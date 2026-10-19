---
sidebar_position: 1
title: Câu hỏi phỏng vấn Android
---

# Câu hỏi phỏng vấn Android: từ nền tảng đến Senior

Bộ câu hỏi này xoay quanh năm nhóm: Context và bộ nhớ, lifecycle và state, concurrency và background work, kiến trúc, custom View. Với mỗi câu, hãy giải thích **cơ chế → lựa chọn → đánh đổi → cách kiểm chứng**, rồi đối chiếu với tình huống thực tế.

[Tra cứu bài đọc theo câu hỏi](./reading-guide.md) · [Học theo lộ trình Senior](./senior-android.md) · [Luyện quiz](/quiz)

## 1. Context và bộ nhớ {#context-memory}

**Context là gì? Khi nào dùng Application Context hoặc Activity Context?**

Context cung cấp quyền truy cập resource, service và các thao tác ở cấp ứng dụng. Activity Context mang cấu hình/theme của màn hình và gắn với Activity đó. Application Context phù hợp cho đối tượng cần sống theo process, như database; không dùng nó thay thế mọi UI context. Singleton giữ Activity Context có thể giữ cả Activity cũ sau rotation.

**Tình huống Senior:** sau khi đóng màn hình camera 20 lần, RAM tăng. Bạn điều tra thế nào?

Phân biệt cache/heap tăng tạm thời với đối tượng bị giữ sai vòng đời. Reproduce, lấy heap dump, tìm Activity đã bị destroy, lần reference tới GC root. Sửa nơi giữ listener/callback/View, rồi chạy lại cùng kịch bản. Không coi `System.gc()` hoặc `largeHeap` là cách chữa leak.

**Bẫy:** đặt mọi reference thành `null` trong `onDestroy()` không giải quyết listener còn được singleton giữ; process death cũng không bảo đảm callback này chạy.

**Đọc sâu:** [Context, ownership và memory leak](../android-core/context-memory.md) phân tích reference chain, callback giữ Activity và cách cleanup bằng callbackFlow. Bắt đầu từ [quy trình điều tra heap](../android-core/context-memory.md#diagnose) nếu muốn thực hành debugging. Tham khảo thêm [memory management](../performance/memory.md).

## 2. Lifecycle và state {#state-recovery}

**Màn hình bị xoay hoặc process bị hệ thống kết thúc: giữ state bằng gì?**

| Nhu cầu | Cơ chế | Giới hạn |
| --- | --- | --- |
| Giữ dữ liệu màn hình qua configuration change | ViewModel | Không giữ instance qua process death |
| Phục hồi ID, query, lựa chọn UI nhỏ | SavedStateHandle, rememberSaveable | Phụ thuộc saved state và task được phục hồi |
| Giữ giỏ hàng, bản nháp nghiệp vụ | Room, DataStore hoặc backend tùy kiểu dữ liệu | Cần chính sách ghi, migration và đồng bộ |

`onSaveInstanceState()` vẫn là API hợp lệ cho saved state của Activity/View; không phải nơi lưu database hay bitmap lớn. ViewModel được tạo lại sau process death và dùng ID để nạp lại dữ liệu, không được “hồi sinh” nguyên instance.

**Tình huống Senior:** user quay lại checkout sau khi app ở background bị kill. Lưu bước hiện tại và cart ID trong saved state, lưu cart bền vững, rồi tải lại và xác thực giá/tồn kho với server trước khi thanh toán.

**Bẫy:** force-stop, xóa task, `finish()` và system-initiated process death có hành vi phục hồi khác nhau.

**Đọc sâu:** [State recovery](../android-core/state-recovery.md) có timeline khởi tạo lại process, ví dụ SavedStateHandle và ma trận test. Đọc [ví dụ lưu query/selection](../android-core/state-recovery.md#saved-state-example), sau đó thử mất mạng trong lúc restore.

## 3. Concurrency và background work {#background-work}

**Phân biệt Coroutines, Service và WorkManager?**

| Công việc | Lựa chọn khởi đầu | Cần làm rõ |
| --- | --- | --- |
| Fetch dữ liệu khi mở màn hình | Coroutine theo scope phù hợp | Hủy khi nào? API có main-safe không? |
| Đồng bộ dữ liệu cần tiếp tục sau process restart | WorkManager + dữ liệu persist | Constraints, retry, quota, idempotency |
| Phát nhạc/theo dõi vận động người dùng đang biết | API chuyên dụng/Foreground Service khi phù hợp | Notification, service type, quyền và giới hạn nền |

Service không tự cung cấp worker thread. WorkManager lưu lịch bền vững, nhưng không bảo đảm hoàn thành ngay, đúng thời điểm hay side effect chỉ xảy ra một lần. Nó chịu Doze, quota và giới hạn hệ thống; force-stop có thể ngăn công việc chạy cho tới khi người dùng mở lại ứng dụng.

**Tình huống Senior:** upload thành công trên server nhưng client timeout. Retry dùng cùng upload ID/idempotency key; server deduplicate. Giữ trạng thái local để tiếp tục sau restart.

**Bẫy:** `suspend` không tự chuyển thread; `launch(DEFAULT)` không luôn chạy sau dòng kế tiếp; không chuyển `CancellationException` thành lỗi nghiệp vụ.

**Đọc sâu:** [Structured concurrency](../foundation/kotlin/structured-concurrency.md) phân tích hai API song song và partial failure; [Flow theo lifecycle](../foundation/kotlin/flow-lifecycle.md) giải thích sharing/backpressure; [background work](../android-core/background-work.md) đi từ persist input đến unique work, retry và khoảng hở sau server commit.

## 4. Kiến trúc và UDF {#architecture}

**State và event đi theo hướng nào trong Compose/MVVM?**

UI gửi action lên state holder; ViewModel phối hợp repository/use case khi cần; state mới chảy xuống UI. Expose immutable state và giữ một nguồn sở hữu state rõ ràng. Repository chịu trách nhiệm contract dữ liệu; không mặc định mọi hàm phải là `Flow<Result<T>>`.

**Tình huống Senior:** kết quả thanh toán phát lúc màn hình STOPPED. `SharedFlow(replay=0)` không giữ kết quả cho subscriber tương lai. Kết quả quan trọng nên nằm trong state/dữ liệu có ID, có xác nhận xử lý nếu cần, và persist nếu yêu cầu phục hồi sau process death. Không có Channel/SharedFlow nào tự cung cấp bảo đảm xử lý exactly-once cho nghiệp vụ.

**Đánh đổi:** thêm UseCase khi business rule/reuse/orchestration đáng kể; một lớp chỉ chuyển tiếp lời gọi có thể làm app đơn giản khó bảo trì hơn. Module hóa cần boundary và phép đo build, không chỉ tăng số module.

**Đọc sâu:** [UDF, UI state và event delivery](../architecture/ui-state-events.md) có timeline mất event, state transition checkout và phân tích acknowledgment. [Offline-first](../data/offline-first.md) bổ sung outbox, transaction local, reconcile và xung đột giữa thiết bị.

## 5. Custom View và UI hiện đại {#custom-view}

**Khi nào cần custom View, và các callback chính làm gì?**

- `onMeasure()`: tính kích thước mong muốn, xét padding/minimum và MeasureSpec từ parent; gọi `setMeasuredDimension()`.
- `onSizeChanged()`: tính hình học phụ thuộc kích thước thay vì tính lại mọi thứ ở mỗi frame.
- `onDraw()`: vẽ bằng Canvas/Paint, hạn chế allocation và I/O.
- `invalidate()`: yêu cầu vẽ lại; `requestLayout()`: yêu cầu đo/layout lại khi kích thước có thể thay đổi.

**Tình huống Senior:** biểu đồ realtime giật. Đo frame timing/allocation; chuẩn bị Paint, Path và dữ liệu ngoài draw path, chỉ yêu cầu layout khi cần. Cung cấp semantics/accessibility cho nội dung tương tác; với biểu đồ có nhiều vùng tương tác, cân nhắc virtual accessibility hierarchy.

**Câu hỏi Compose tương ứng:** key của `LaunchedEffect` thể hiện điều gì? Tại sao stable item key quan trọng? Khi nào dùng `derivedStateOf`? Vì sao không thể kết luận “unstable luôn recompose” khi strong skipping được bật?

**Đọc sâu:** [Custom View](../ui/custom-view.md) có ví dụ đo/vẽ hoàn chỉnh cho một View đơn giản, phân tích invalidate/requestLayout và giới hạn accessibility. [Jetpack Compose](../ui/jetpack-compose.md) mở rộng effect keys, callback mới, mutable state và các phase render.

## Tự đánh giá câu trả lời

Một câu trả lời tốt cần nêu giả định, mô tả một failure case, giải thích lý do chọn giải pháp và đề xuất phép kiểm chứng. Tỷ lệ quiz đúng giúp tìm lỗ hổng kiến thức; kinh nghiệm Senior còn cần code review, debugging và giải quyết bài toán thực tế.

## Nguồn chính thức

- [Lưu UI state — Android Developers](https://developer.android.com/topic/libraries/architecture/saving-states)
- [Chọn background work — Android Developers](https://developer.android.com/develop/background-work)
- [UI events — Android Developers](https://developer.android.com/topic/architecture/ui-layer/events)
- [Tạo custom View — Android Developers](https://developer.android.com/develop/ui/views/layout/custom-views/custom-drawing)
- [CoroutineStart.DEFAULT — Kotlin](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-coroutine-start/-d-e-f-a-u-l-t/)
