---
sidebar_position: 3
title: Đọc sâu theo câu hỏi
---

# Đọc sâu theo bộ câu hỏi Android

Trang này nối [bộ câu hỏi phỏng vấn](./android-questions.md) với bài giải thích đầy đủ. Bắt đầu từ vấn đề chưa hiểu, đọc ví dụ và failure case, làm bài thực hành, rồi quay lại [quiz](/quiz). [Lộ trình Senior](./senior-android.md) gợi ý thứ tự học theo buổi.

## Từ câu hỏi đến bài học

| Câu hỏi/vấn đề | Bài đọc chuyên sâu | Sau khi đọc, bạn cần tự giải thích được |
| --- | --- | --- |
| Context khác nhau thế nào? Vì sao Activity đã đóng vẫn bị giữ? | [Context, ownership và memory leak](../android-core/context-memory.md) | Đường reference từ singleton qua callback; cleanup thuộc owner nào |
| Rotation khác process death thế nào? Lưu state ở đâu? | [State recovery và lifecycle](../android-core/state-recovery.md) | Khởi tạo ViewModel mới từ query/ID; saved state khác persistent storage |
| Job/SupervisorJob và hai API song song hoạt động thế nào? | [Structured concurrency và partial failure](../foundation/kotlin/structured-concurrency.md) | Scope tree, failure boundary và cancellation của từng nhánh |
| Cold/hot Flow, stateIn và collect theo lifecycle? | [Flow, sharing và lifecycle](../foundation/kotlin/flow-lifecycle.md) | Collector dừng có làm producer dừng không; khi nào mất giá trị |
| Chọn Coroutine, Service hay WorkManager cho upload? | [Background work](../android-core/background-work.md) | Tách lifetime, persist input, scheduling, retry và idempotency |
| UDF là gì? Vì sao event quan trọng có thể mất? | [UI state và event delivery](../architecture/ui-state-events.md) | State/action/effect khác nhau; replay không thay acknowledgment/persistence |
| onMeasure/onDraw làm gì? Khi nào invalidate/requestLayout? | [Custom View](../ui/custom-view.md) | Tuân thủ MeasureSpec, cache tài nguyên vẽ và kiểm tra accessibility |
| Key của effect/list, rememberUpdatedState và stability? | [Jetpack Compose](../ui/jetpack-compose.md) | Identity, phase đọc state, mutation và giới hạn của annotation |
| Offline-first có tránh gửi trùng và mất thao tác không? | [Outbox và đồng bộ](../data/offline-first.md) | Khoảng hở local/remote commit, reconcile và conflict policy |
| Làm sao test được timing, subscription và restoration? | [Test Coroutines/StateFlow](../testing/coroutines.md), [ma trận phục hồi](../android-core/state-recovery.md#verify-restoration) | Virtual time thuộc scheduler nào; test nào không tương đương mất process |
| RAM tăng hoặc cuộn giật: bắt đầu đo ở đâu? | [Điều tra memory](../android-core/context-memory.md#diagnose), [profiling](../performance/profiling.md#senior-measurement) | Bằng chứng phân biệt leak/cache/churn và frame deadline bị lỡ |

## Các bước tiếp theo để hoàn thiện năng lực Senior

- [Networking: lỗi, retry và token refresh](../data/retrofit.md): phân biệt unknown outcome, request body, authentication và session race.
- [Security model](../security/security-model.md) và [permissions/components](../security/permissions-components.md): credential, trust boundary, external input và log policy.
- [Test strategy](../testing/test-strategy.md): chọn đúng boundary cho SQL, HTTP, lifecycle, timing và release.
- [Capstone chat offline](./senior-capstone.md): kết nối các bài vào một thiết kế có thể review và kiểm chứng.

## Đọc theo một tình huống xuyên suốt

### Checkout phục hồi sau mất process

Đọc [state recovery](../android-core/state-recovery.md#restoration-timeline), sau đó [UI state/event](../architecture/ui-state-events.md#state-model). Phác thảo cart ID, request ID, nguồn xác nhận đơn hàng và màn hình lúc chưa biết server đã commit hay chưa. Thử rotation, STOPPED và mất process như ba trường hợp riêng.

### Chat offline không mất hoặc nhân đôi tin nhắn

Đọc [outbox](../data/offline-first.md#outbox), [khoảng hở local commit/enqueue](../data/offline-first.md#local-transaction) và [background retry](../android-core/background-work.md#idempotency). Dừng client có chủ đích ở từng bước; khi chạy lại, chứng minh mỗi logical message chỉ có một identity ở server.

### Màn hình realtime vừa giật vừa giữ Activity cũ

Đọc [listener ownership](../android-core/context-memory.md#listener-cleanup), [Flow collection](../foundation/kotlin/flow-lifecycle.md#collection) và [draw path](../ui/custom-view.md#drawing). Tách hai giả thuyết: leak do lifetime sai, jank do chi phí mỗi frame. Mỗi giả thuyết cần phép đo và cách sửa riêng.

## Cách dùng các ví dụ

Các đoạn Kotlin minh họa một boundary hoặc behavior. Bài viết nêu type/dependency giả định và phần chưa triển khai; chúng không phải một ứng dụng Android hoàn chỉnh để copy nguyên vào production. Khi thực hành, bổ sung imports/dependencies, error states, localization và test phù hợp project.

Sau khi đọc, hãy diễn đạt lại bằng bốn ý: cơ chế hoạt động, giả định của giải pháp, trường hợp nó thất bại và phép kiểm chứng. Nếu chưa tự giải thích được một timeline, mở lại phần ví dụ thay vì chỉ học thuộc đáp án.
