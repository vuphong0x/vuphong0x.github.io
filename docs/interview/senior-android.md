---
sidebar_position: 2
title: Lộ trình Senior Android
---

# Lộ trình ôn tập Senior Android

Dựa trên [bộ câu hỏi phỏng vấn](./android-questions.md), lộ trình này tập trung vào quyết định kỹ thuật và các tình huống thất bại. Mỗi buổi: đọc cơ chế, viết một ví dụ nhỏ, tự giải thích đánh đổi, rồi [làm quiz tình huống Senior](/quiz). Mở [bài đọc theo câu hỏi](./reading-guide.md) để tra đúng vấn đề cần hiểu sâu.

| Buổi | Nội dung | Đầu ra thực hành |
| --- | --- | --- |
| 1 | Context, lifecycle, state recovery | Khôi phục query và item ID sau mất process |
| 2 | Coroutines, Flow, cancellation | Hai request độc lập, partial failure có test |
| 3 | UDF, state/event, module boundary | Viết contract cho kết quả thanh toán |
| 4 | Background work, offline-first | Outbox có idempotency, retry và trạng thái local |
| 5 | Compose/custom View, hiệu năng | Trace một thao tác cuộn/chuyển màn hình |
| 6 | Testing và migration | Test scheduler, dữ liệu cũ và restoration |

## Context và memory ownership {#context-memory}

**Câu hỏi:** singleton đăng ký callback từ Activity; sau rotation Activity cũ còn trong heap. Vì sao?

Vòng đời owner dài hơn đối tượng mà nó giữ. Callback/lambda có thể capture Activity hoặc binding, tạo đường reference từ singleton tới UI cũ. Cắt reference ở đúng registration owner; đừng chỉ thay context bên trong callback trong khi lambda vẫn giữ màn hình.

**Thực hành:** mở/đóng cùng màn hình nhiều lần; dùng LeakCanary/heap dump kiểm tra retention path, sửa cleanup, rồi lặp lại kịch bản. Phân biệt dữ liệu cache có chủ đích với Activity đã hết vòng đời.

Đọc sâu: [Context, ownership và listener cleanup](../android-core/context-memory.md), [View lifecycle và phục hồi](../android-core/state-recovery.md).

## Kiến trúc và kết quả quan trọng {#architecture}

**Câu hỏi:** UI không active khi request hoàn tất. Kết quả cần tồn tại bao lâu và ai xác nhận đã xử lý?

Xác định contract trước: state hiện tại, broadcast tạm thời hay công việc phải được xử lý? Với kết quả thanh toán, giữ payment ID/trạng thái trong nguồn dữ liệu phù hợp; UI dựng lại từ dữ liệu đó. Nếu cần acknowledgment, xác định thời điểm và hành vi khi user rời màn hình. Channel hoặc replay không thay cho persistence.

**Câu hỏi mở rộng:** Repository trả `suspend T`, `Flow<T>`, Kotlin `Result<T>` hay sealed domain result?

Chọn theo one-shot/observation và cách mô hình hóa lỗi. Kotlin `Result` có `isSuccess`, `isFailure`, `getOrNull`, `exceptionOrNull`; `Result.Success/Error` chỉ tồn tại nếu bạn tự định nghĩa sealed type tương ứng. Không nuốt cancellation khi chuyển exception thành lỗi UI.

**UseCase và module:** cần business rule/reuse rõ ràng; đặt dependency hướng vào abstraction cần thiết, tránh module chung thành nơi chứa mọi thứ. Đo clean/incremental build trước và sau khi tách một feature. Không mặc định nhiều module luôn nhanh hơn.

Đọc sâu: [UDF, UI state và event delivery](../architecture/ui-state-events.md). Tham khảo [UI events chính thức](https://developer.android.com/topic/architecture/ui-layer/events), [SharedFlow](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/-shared-flow/), [Clean Architecture](../architecture/clean-architecture.md).

## Background work và retry {#background-work}

**Câu hỏi:** đồng bộ cần sống qua process restart, nhưng user cũng muốn biết tiến độ. Bạn tách UI state và công việc thế nào?

Giữ payload/trạng thái trong storage, để scheduler thực thi, UI quan sát tiến độ. WorkManager hỗ trợ persistent scheduling nhưng chịu thời điểm chạy do hệ thống quyết định. Đừng hứa đúng giờ hay hoàn thành sau mọi kiểu kill.

**Câu hỏi:** server đã commit trước khi client nhận response thì sao?

Dùng cùng idempotency key cho một thao tác logic, lưu kết quả xác nhận, xử lý retry có backoff và phân loại lỗi retryable/permanent. Unique work tránh một số enqueue trùng ở client; vẫn cần dedup ở server. Hủy coroutine không đồng nghĩa server rollback request đã nhận.

Service không tự tạo thread. Foreground Service có các yêu cầu phụ thuộc phiên bản, service type và quyền. Với playback, cân nhắc Media3; với sync có thể trì hoãn, bắt đầu từ WorkManager và kiểm tra giới hạn tương ứng.

Đọc sâu: [Coroutines, WorkManager và Foreground Service](../android-core/background-work.md), [structured concurrency](../foundation/kotlin/structured-concurrency.md), [Flow và lifecycle](../foundation/kotlin/flow-lifecycle.md).

Nguồn: [background work](https://developer.android.com/develop/background-work), [Doze](https://developer.android.com/training/monitoring-device-state/doze-standby). Thực hành: [offline-first và outbox](../data/offline-first.md).

## Custom View, Compose và trải nghiệm người dùng {#custom-view}

**Câu hỏi:** View hoạt động trong một layout nhưng lỗi khi đặt trong parent khác. Bạn kiểm tra gì?

Kiểm tra `EXACTLY`, `AT_MOST`, `UNSPECIFIED`, padding và minimum size. Dùng `resolveSizeAndState` khi phù hợp, gọi `setMeasuredDimension`; tránh giả định kích thước luôn bằng màn hình. Tính lại đường vẽ khi data/kích thước đổi; không decode ảnh trong mỗi `onDraw`.

**Câu hỏi:** UI nhanh nhưng không dùng được bằng TalkBack. Thiếu gì?

Đặt tên/role/action hợp lý cho phần tử tương tác, bỏ phần trang trí khỏi accessibility tree, kiểm tra thứ tự focus và font scale. Không cần tạo AccessibilityService chỉ để app hỗ trợ TalkBack. Với quyền camera bị từ chối, cung cấp fallback và chỉ xin quyền theo hành động người dùng.

**Compose:** tách identity của item/effect khỏi vị trí trong list. Annotation stability cần phản ánh đúng contract; dùng công cụ đo để quyết định tối ưu. Xem [bài custom View với ví dụ đo/vẽ](../ui/custom-view.md), [bài Compose](../ui/jetpack-compose.md) và [profiling](../performance/profiling.md#senior-measurement).

Nguồn: [custom drawing](https://developer.android.com/develop/ui/views/layout/custom-views/custom-drawing), [accessibility](https://developer.android.com/guide/topics/ui/accessibility/apps), [runtime permissions](https://developer.android.com/training/permissions/requesting).

## Security, testing và bằng chứng thực hành

Sau các buổi về Android/data/UI, bổ sung [threat model và secrets](../security/security-model.md), [permissions và external input](../security/permissions-components.md), [network/session](../data/retrofit.md) và [test strategy](../testing/test-strategy.md). Các chủ đề này cần được xét trong cùng một flow, không chỉ học như checklist riêng.

Thực hiện [capstone chat offline](./senior-capstone.md): đề bài có yêu cầu sản phẩm, artifact cần chuẩn bị, failure injection matrix và rubric định tính. Dùng test/trace của bài thực hành để đánh giá phần đã vững; điểm quiz không thay bằng chứng đó.

## Tự luyện phỏng vấn

Chọn một đề: checkout phục hồi sau process death, chat offline hoặc feed phân trang. Trong 20–30 phút, trình bày requirements, state ownership, data flow, failure cases, phép đo và test. Người nghe cần hiểu vì sao giải pháp phù hợp với ràng buộc đó.

Sau mỗi lượt quiz, mở bài đọc từ câu sai và giải thích lại bằng ví dụ của riêng bạn. Điểm quiz phản ánh bài vừa làm, không chứng nhận cấp bậc nghề nghiệp.
