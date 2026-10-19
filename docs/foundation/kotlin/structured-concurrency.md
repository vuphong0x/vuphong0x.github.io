---
title: Structured concurrency và partial failure
sidebar_position: 10
---

# Structured concurrency: scope, cancellation và partial failure

Câu hỏi “`Job` khác `SupervisorJob` thế nào?” chỉ có ý nghĩa khi biết **task nào thuộc về task nào** và **một kết quả thiếu có làm toàn bộ thao tác vô nghĩa không**. Bài này dùng ví dụ dashboard gồm profile và recommendations để phân tích hai contract khác nhau.

Kiến thức trước: [Coroutines](./coroutines.md). Các type `Profile`, `Recommendation`, `DashboardApi` trong ví dụ là type nghiệp vụ của ứng dụng; cần thêm import từ `kotlinx.coroutines` và `java.io.IOException` khi tích hợp.

## 1. Scope là quyền sở hữu công việc {#scope-ownership}

Một coroutine con thuộc Job cha. Cha chờ con hoàn tất; khi cha bị cancel, con nhận cancellation. Việc này giúp nơi bắt đầu thao tác cũng quản lý được thời điểm nó kết thúc.

```text
ViewModel scope
  └─ refresh dashboard
      ├─ fetch profile
      └─ fetch recommendations
```

Nếu `refresh dashboard` không còn cần thiết, hủy nó phải hủy các request thuộc refresh đó. Nếu mỗi hàm tự tạo `CoroutineScope(Dispatchers.IO)` rồi launch, cây công việc bị tách khỏi caller: caller không còn chờ, cancel hoặc nhận lỗi theo cùng contract.

`viewModelScope` phù hợp cho công việc thuộc ViewModel đang tồn tại, không đồng nghĩa công việc sống tới khi user đóng app. Với đồng bộ cần sống qua mất process, xem [background work](../../android-core/background-work.md).

## 2. Khi hai kết quả phải thành công cùng nhau {#all-or-nothing}

Nếu dashboard chỉ có ý nghĩa khi cả hai response thành công, dùng một scope với failure policy chung:

```kotlin
data class Dashboard(
    val profile: Profile,
    val recommendations: List<Recommendation>,
)

suspend fun loadDashboard(api: DashboardApi): Dashboard = coroutineScope {
    val profile = async { api.profile() }
    val recommendations = async { api.recommendations() }
    Dashboard(profile.await(), recommendations.await())
}
```

Hai `async` được tạo trước khi chờ kết quả. Nếu một child lỗi ngoài cancellation, scope thường thất bại và hủy child còn lại. Đây là quyết định nghiệp vụ: tránh tiếp tục làm phần việc không còn tạo được kết quả hợp lệ.

Đặt `try/catch` quanh `await()` không tự đảo ngược việc child đã làm parent fail trong một scope thông thường. Nếu muốn giữ phần còn lại, cần thay failure boundary thay vì chỉ thêm catch ở dòng cuối.

## 3. Khi cho phép partial success {#partial-success}

Giả sử profile và recommendations độc lập: một phần lỗi vẫn hiển thị phần còn lại. Ta có thể chuyển **lỗi dự kiến** thành dữ liệu của từng nhánh:

```kotlin
sealed interface Part<out T> {
    data class Ready<T>(val value: T) : Part<T>
    data class NetworkFailure(val cause: IOException) : Part<Nothing>
}

suspend fun <T> networkPart(block: suspend () -> T): Part<T> = try {
    Part.Ready(block())
} catch (cancelled: CancellationException) {
    throw cancelled
} catch (error: IOException) {
    Part.NetworkFailure(error)
}

data class DashboardParts(
    val profile: Part<Profile>,
    val recommendations: Part<List<Recommendation>>,
)

suspend fun loadParts(api: DashboardApi): DashboardParts = supervisorScope {
    val profile = async { networkPart { api.profile() } }
    val recommendations = async { networkPart { api.recommendations() } }
    DashboardParts(profile.await(), recommendations.await())
}
```

Ở đây lỗi I/O được xử lý **bên trong mỗi nhánh**, trước khi nó thoát ra dưới dạng child failure. Với riêng loại lỗi đã chuyển thành `Part`, `coroutineScope` cũng có thể dùng được; `supervisorScope` không phải phép màu tạo partial success. Ví dụ dùng nó để làm rõ boundary giám sát, còn lỗi lập trình ngoài contract vẫn được phép làm toàn bộ thao tác thất bại.

Nếu một `Deferred` thật sự fail, `await()` vẫn ném exception. Exception thoát khỏi **block supervisorScope** sẽ làm block thất bại và hủy child còn chạy. Muốn tiếp tục sau loại lỗi đó, cần xử lý nó tại đúng boundary.

Nguồn cơ chế: [Coroutine exception handling và supervision](https://kotlinlang.org/docs/exception-handling.html).

## 4. Cancellation là tín hiệu điều khiển {#cancellation}

Một `catch (Exception)` rộng hoặc `runCatching` có thể biến cancellation thành lỗi UI. Hệ quả dễ thấy: user rời màn hình nhưng tác vụ vẫn retry hoặc phát “lỗi mạng” dù request bị hủy có chủ đích.

Hãy catch lỗi dự kiến; nếu catch rộng thì ném lại `CancellationException`. Với vòng lặp CPU không gặp suspend point, thêm checkpoint phù hợp:

```kotlin
suspend fun digestAll(values: List<ByteArray>): List<Int> {
    val output = ArrayList<Int>(values.size)
    for (value in values) {
        currentCoroutineContext().ensureActive()
        output += value.contentHashCode()
    }
    return output
}
```

Checkpoint giữa các phần tử không ngắt được một phép tính đơn lẻ kéo dài bên trong `contentHashCode()`. Cần chia việc với độ hạt hợp lý và chạy CPU work ngoài main thread. Cancellation của coroutine cũng không chứng minh server đã rollback một request trước đó.

Cleanup thông thường đặt trong `finally`; chỉ dùng `NonCancellable` cho cleanup suspend ngắn, có lý do rõ ràng. Không dùng nó để che mọi tác vụ khỏi cancellation.

## 5. Dispatcher không thay failure policy {#dispatchers}

`Dispatchers.IO` trả lời công việc blocking I/O chạy ở đâu; `SupervisorJob` trả lời lỗi lan theo cây nào. Hai quyết định này độc lập. Thêm IO không làm task sống qua process death; thêm SupervisorJob không tự retry request.

Với `CoroutineStart.DEFAULT`, dispatcher quyết định có dispatch hay bắt đầu ngay. `Main.immediate` có thể bắt đầu trên caller đang ở main thread. Vì vậy, thứ tự log của một ví dụ `runBlocking` không phải quy luật cho mọi `launch`.

Nguồn: [Coroutine context và dispatchers](https://kotlinlang.org/docs/coroutine-context-and-dispatchers.html), [CoroutineStart.DEFAULT](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-coroutine-start/-d-e-f-a-u-l-t/).

## 6. Kiểm chứng contract

| Kịch bản | Kết quả mong đợi |
| --- | --- |
| Cả hai request thành công | Có đủ hai phần |
| Recommendations lỗi I/O, cho phép partial success | Profile vẫn trả về; recommendations là NetworkFailure |
| Parent bị cancel | Các nhánh bị hủy; không trả một “success rỗng” |
| Lỗi lập trình ngoài contract | Test thấy failure, không bị nuốt thành mất mạng |
| `await()` lỗi thoát supervisor block | Child còn lại bị hủy theo failure của block |

**Bài tập:** viết fake API dùng `CompletableDeferred` để điều khiển thời điểm từng request hoàn tất. Test partial failure mà không dựa vào `Thread.sleep`. Đổi sang contract all-or-nothing và giải thích test nào phải thay đổi.

Đọc tiếp: [Flow theo lifecycle](./flow-lifecycle.md), [test Coroutines/StateFlow](../../testing/coroutines.md), [UI state/event](../../architecture/ui-state-events.md). [Bộ câu hỏi](../../interview/android-questions.md) · [Quiz](/quiz).
