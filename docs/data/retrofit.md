---
title: Retrofit, lỗi mạng và authentication
---

# Networking: contract, lỗi và vòng đời session

Retrofit ánh xạ interface/annotation thành lời gọi HTTP, dùng HTTP client và converter cho transport/serialization. Ở level Senior, câu hỏi quan trọng là **contract trả về gì, lỗi nào retry được, request có thuộc account hiện tại không và dữ liệu nhạy cảm đi đâu**.

## 1. Chọn kiểu response có chủ đích {#contract}

```kotlin
interface UserApi {
    @GET("users/{id}")
    suspend fun getUser(@Path("id") id: String): Response<UserDto>
}
```

Ví dụ dùng Retrofit; `UserDto` là DTO của app và converter phải được cấu hình tương ứng. Với `Response<T>`, caller kiểm tra status/body theo contract, không xem mọi response là thành công. API trả trực tiếp `T` có error semantics khác, như HTTP error được thể hiện bằng exception. Transport, HTTP status, parsing và domain validation là các nhóm lỗi khác nhau.

```kotlin
sealed interface UserResult {
    data class Found(val user: User) : UserResult
    data object NotFound : UserResult
    data object TemporarilyUnavailable : UserResult
}

suspend fun loadUser(id: String): UserResult = try {
    val response = api.getUser(id)
    when {
        response.code() == 404 -> UserResult.NotFound
        response.isSuccessful -> {
            val dto = requireNotNull(response.body()) { "Missing user body" }
            UserResult.Found(dto.toDomain())
        }
        response.code() in 500..599 -> UserResult.TemporarilyUnavailable
        else -> throw UnexpectedHttpStatus(response.code())
    }
} catch (cancelled: CancellationException) {
    throw cancelled
} catch (error: IOException) {
    UserResult.TemporarilyUnavailable
}
```

Đây là boundary minh họa: `api`, `User`, mapper và `UnexpectedHttpStatus` thuộc app. Cần tách lỗi parse/protocol trong implementation thực tế; không coi mọi IOException của mọi converter là chắc chắn do mất mạng. Không trả “user rỗng” để che response không hợp lệ. Lỗi ngoài contract cần được xử lý ở boundary cao hơn và ghi nhận có kiểm soát.

## 2. Main safety và cancellation

Suspend không tự chuyển thread. Retrofit suspend integration hỗ trợ async HTTP; blocking file I/O hoặc mapping CPU nặng trong repository vẫn cần dispatcher phù hợp. Không bọc mọi suspend API vào IO như một nghi thức và không nuốt CancellationException.

Hủy call phía client không rollback request server đã nhận. Với create/update có retry, dùng logical request ID và protocol idempotency; xem [offline-first](./offline-first.md#outbox).

Nguồn integration: [Retrofit Kotlin extensions](https://github.com/square/retrofit/blob/trunk/retrofit/src/main/java/retrofit2/KotlinExtensions.kt).

## 3. Timeouts, retries và request body {#retry}

Phân biệt connect/read/write timeout và tổng lifetime call. Thêm retry ở interceptor, repository và Worker đồng thời có thể nhân số lần gửi. Quyết định tầng nào sở hữu retry, backoff/giới hạn và tín hiệu cancel.

Không mặc định retry POST là an toàn; không mặc định body upload có thể đọc/gửi lại tùy ý. Streaming, one-shot body và payload lớn cần protocol/resume policy phù hợp. Với read timeout sau server commit, trạng thái là “chưa biết kết quả”, không nhất thiết “server chưa làm gì”.

## 4. Authentication khi nhiều request cùng nhận 401 {#authentication}

Một refresh flow cần protocol rõ ràng:

1. Chỉ thêm Authorization cho origin đáng tin cậy và loại request cần credential. Không gửi token cho URL động tùy ý hoặc coi “thiếu header” luôn là yêu cầu gắn token.
2. Khi nhận challenge, kiểm tra account/session vẫn hợp lệ và giới hạn số lần follow-up; server liên tục từ chối token mới phải kết thúc được.
3. So token/version của request với session hiện tại. Nếu một refresh khác đã hoàn tất cho cùng session, có thể dùng kết quả đó theo contract.
4. Cô lập refresh để tránh recursion vào chính authenticator và tránh deadlock do chờ công việc cần cùng executor đang bị chiếm.
5. Chỉ lưu token mới nếu session/account vẫn là phiên đã bắt đầu refresh; logout/login khác trong lúc chờ không được bị ghi đè.
6. Phân biệt refresh credential bị từ chối vĩnh viễn với lỗi network tạm thời; không logout phá hủy dữ liệu user chỉ vì một timeout.

Không cung cấp một `synchronized { refresh() }` như lời giải hoàn chỉnh: khóa có thể giảm refresh đồng thời nhưng không tự giải quyết retry loop, session race, executor starvation hoặc token rotation. Authenticator là callback đồng bộ; thiết kế đường refresh và storage theo yêu cầu API, không đọc DataStore bằng runBlocking trên main thread.

Nguồn API: [OkHttp Authenticator](https://github.com/square/okhttp/blob/master/okhttp/src/commonJvmAndroid/kotlin/okhttp3/Authenticator.kt).

## 5. TLS và logging {#security}

Dùng HTTPS, trust/hostname verification đúng và policy release rõ ràng. Pinning cần threat model và kế hoạch rotation, không phải mặc định “quan trọng nhất”. API key được build vào APK không trở thành secret khi chuyển từ Kotlin sang BuildConfig/NDK. Đọc [security model](../security/security-model.md#secrets) trước khi chọn giải pháp.

Không bật body logging cho request chứa thông tin nhạy cảm. Redact Authorization không che body/query/path có PII. Error reporting nên dùng endpoint chuẩn hóa, mã lỗi và ID không lộ dữ liệu; kiểm tra artifact/config release thực tế.

## 6. Test network boundary

Dùng fake hoặc HTTP test server kiểm soát response thay vì phụ thuộc server production. Test 200/body hợp lệ, 200/body sai schema, 404, 429, 5xx, disconnect, timeout, cancellation, 401 đồng thời và logout trong khi refresh đang chạy. Đối với side effect, kiểm tra cả số logical operation trên server thay vì chỉ đếm số lần gọi method client.

Đọc tiếp: [UDF và repository contract](../architecture/ui-state-events.md#repository-contract), [test strategy](../testing/test-strategy.md), [security](../security/security-model.md).
