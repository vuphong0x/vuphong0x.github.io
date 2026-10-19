---
title: Coroutines, WorkManager và Foreground Service
sidebar_position: 8
---

# Chọn background work theo yêu cầu thực thi

Bài này trả lời câu hỏi **“Coroutines, Service hay WorkManager?”** bằng một tính năng cụ thể: user chọn ảnh, app chuẩn bị ảnh rồi upload, kể cả khi màn hình đã đóng. Trước khi chọn API, cần xác định phần công việc nào được phép hủy và phần nào cần tiếp tục sau mất process.

Đọc trước: [scope ownership](../foundation/kotlin/structured-concurrency.md#scope-ownership), [Service](./service.md).

## 1. Tách công việc theo lifetime {#choose}

Trong cùng tính năng upload có nhiều công việc khác nhau:

| Công việc | Lifetime | Lựa chọn cần cân nhắc |
| --- | --- | --- |
| Tạo preview nhỏ cho màn hình hiện tại | UI còn cần preview | Coroutine theo owner phù hợp |
| Ghi yêu cầu upload và đường dẫn file | Cần tồn tại sau màn hình | Persistent storage |
| Thử upload khi có mạng | Cần tiếp tục qua process restart | WorkManager, dựa trên dữ liệu persist |
| Truyền file do user chủ động yêu cầu | User chờ tiến độ/hoàn tất | Kiểm tra API truyền dữ liệu do user khởi tạo hoặc cơ chế foreground phù hợp |
| Phát nhạc khi tắt màn hình | Phiên playback người dùng nhận biết | Media3 và service/session phù hợp |

Không có một API thay thế mọi hàng. Coroutine là cơ chế thực thi; WorkManager là persistent scheduler; Service là component do Android quản lý. Một Worker vẫn có thể dùng coroutine, và một Service vẫn phải quản lý việc chuyển thread.

Nguồn lựa chọn: [Background work](https://developer.android.com/develop/background-work).

## 2. WorkManager bảo đảm điều gì? {#guarantees}

WorkManager lưu thông tin lịch work và phối hợp với hệ thống. Nó phù hợp công việc persistent với constraints và retry; không hứa chạy ngay, hoàn tất trước một deadline hay hoàn tất trong mọi trạng thái thiết bị.

Phân biệt ba điều:

1. **Yêu cầu đã được lưu:** không chỉ nằm trong một coroutine của màn hình.
2. **Worker được phép thực thi:** còn phụ thuộc constraints, quota, Doze và chính sách hệ thống.
3. **Nghiệp vụ hoàn thành:** còn phụ thuộc mạng, server, credential và sự đồng ý/hủy của người dùng.

Force-stop, work bị cancel, dữ liệu app bị xóa hoặc quyền truy cập file không còn là các trường hợp phải xử lý riêng. Không gọi một cơ chế là “guaranteed work” rồi bỏ qua các trạng thái này.

## 3. Persist input trước khi enqueue {#enqueue}

Payload lớn không nên nằm trong `Data` của WorkManager. Lưu file/payload ở nơi app có thể truy cập lâu dài, ghi bản ghi upload với ID ổn định, rồi truyền ID nhỏ vào Worker. Nếu nguồn là content URI, phải xét quyền URI có còn hợp lệ sau restart hay cần sao chép file vào storage do app quản lý.

```kotlin
val request = OneTimeWorkRequestBuilder<UploadWorker>()
    .setInputData(workDataOf("uploadId" to uploadId))
    .setConstraints(
        Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()
    )
    .setBackoffCriteria(
        BackoffPolicy.EXPONENTIAL,
        30,
        TimeUnit.SECONDS,
    )
    .build()

WorkManager.getInstance(context.applicationContext)
    .enqueueUniqueWork("upload:$uploadId", ExistingWorkPolicy.KEEP, request)
```

Ví dụ dùng `androidx.work` và `java.util.concurrent.TimeUnit`; `UploadWorker` là worker của app. `uploadId` được tạo cho **một thao tác logic**, không tạo lại mỗi lần retry.

`KEEP` giúp không enqueue work cùng tên khi work trước còn chưa kết thúc. Nó không ngăn mọi request trùng sau khi work trước kết thúc, không khóa backend và không khiến file tự còn tồn tại. Trong app nhiều account, tên work và bản ghi phải phân biệt account.

Nguồn: [Getting started](https://developer.android.com/develop/background-work/background-tasks/persistent/getting-started), [Managing work và unique work](https://developer.android.com/develop/background-work/background-tasks/persistent/how-to/manage-work).

## 4. Thiết kế retry theo lỗi nghiệp vụ {#retry}

Giả sử repository expose `uploadPending(id)` và trả một sealed result do app định nghĩa. Thân `doWork()` của một `CoroutineWorker` đã được inject repository có thể có dạng:

```kotlin
override suspend fun doWork(): Result {
    val uploadId = inputData.getString("uploadId") ?: return Result.failure()
    return when (repository.uploadPending(uploadId)) {
        UploadOutcome.Confirmed -> Result.success()
        UploadOutcome.Retryable -> Result.retry()
        UploadOutcome.Rejected -> Result.failure()
    }
}
```

Đây là mẫu contract, không phải class Worker hoàn chỉnh. Repository chịu trách nhiệm kiểm tra account, đọc payload, phân loại lỗi dự kiến và ghi trạng thái local. Không catch cancellation thành `Retryable`; Worker bị dừng phải dừng được.

| Kết quả quan sát | Chính sách cần quyết định |
| --- | --- |
| Mất kết nối/tạm không liên lạc được server | Retry với backoff, giới hạn theo nhu cầu |
| Rate limit | Tôn trọng tín hiệu server và chính sách retry |
| Credential hết hạn | Refresh theo contract hoặc chờ user đăng nhập; tránh vòng lặp vô hạn |
| Nội dung bị từ chối vĩnh viễn | FAILED với lý do để UI hướng dẫn sửa |
| Không biết server đã commit hay chưa | Reconcile/retry cùng idempotency key |

CONNECTED không chứng minh server reachable. Wi-Fi cũng không đồng nghĩa unmetered. Nếu user chọn “chỉ trên mạng không tính dung lượng”, dùng UNMETERED theo đánh dấu của hệ thống và vẫn xử lý network error.

## 5. Khoảng hở sau remote commit {#idempotency}

```text
Client gửi uploadId=U
Server tạo ảnh cho U
Response bị mất
Worker thấy timeout
Worker thử lại uploadId=U
Server trả cùng kết quả của U thay vì tạo ảnh thứ hai
```

Backoff chỉ giảm áp lực retry, không giải quyết trùng dữ liệu. Unique work chỉ quản lý lịch ở client, không khép được khoảng hở giữa remote commit và local acknowledgment. Backend phải có contract dedup/idempotency tương ứng; xem [outbox và phục hồi](../data/offline-first.md#outbox).

## 6. Foreground Service cần được xét riêng {#foreground-service}

Foreground Service không tự có worker thread và không được miễn ANR. Callback như `onStartCommand()` mặc định chạy trên main thread; CPU work vẫn cần dispatcher phù hợp cùng scope được cleanup.

Việc khởi chạy FGS từ background, service type, quyền liên quan và thời hạn hoạt động phụ thuộc phiên bản/target SDK. Ví dụ, ứng dụng target Android 12+ chịu hạn chế khởi chạy từ background với các ngoại lệ cụ thể; đây không phải lý do để cố khởi FGS mỗi lần nhận broadcast. Kiểm tra tài liệu theo use case và API level mà app hỗ trợ.

Với công việc dài, không suy luận rằng chuyển Worker sang foreground sẽ loại bỏ mọi quota. Long-running Worker vẫn có giới hạn phụ thuộc phiên bản; so sánh với API phù hợp cho truyền dữ liệu do user khởi tạo khi đó là yêu cầu sản phẩm.

Nguồn: [FGS background start restrictions](https://developer.android.com/develop/background-work/services/fgs/restrictions-bg-start), [Long-running workers](https://developer.android.com/develop/background-work/background-tasks/persistent/how-to/long-running), [Doze](https://developer.android.com/training/monitoring-device-state/doze-standby).

## 7. Bài thực hành

Tạo upload giả với khả năng “server đã commit nhưng client timeout”. Kiểm tra retry cùng ID chỉ tạo một ảnh; đóng màn hình không xóa input; mất file được báo lỗi có thể hiểu; logout không khiến dữ liệu account cũ bị gửi bằng session mới.

**Câu hỏi tự kiểm:** tại sao `viewModelScope.launch(Dispatchers.IO)` chưa đủ cho upload cần sống qua process death? Vì cả Job và dữ liệu chỉ trong RAM vẫn mất cùng process; dispatcher chỉ quyết định nơi chạy.

[Bộ câu hỏi](../interview/android-questions.md) · [Lộ trình Senior](../interview/senior-android.md) · [Quiz](/quiz).
