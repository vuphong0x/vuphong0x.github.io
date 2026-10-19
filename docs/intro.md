---
sidebar_position: 0
slug: /
title: Học Android hướng tới Senior
---

# Android Knowledge Hub

Học Android bằng **cơ chế, quyết định kỹ thuật và bằng chứng thực hành**. Tài liệu dành cho lập trình viên muốn đi từ việc dùng đúng API đến thiết kế tính năng có thể phục hồi, kiểm thử và vận hành trong sản phẩm thực tế.

**[Bắt đầu lộ trình Senior](./interview/senior-android.md)** · **[Đọc sâu theo câu hỏi](./interview/reading-guide.md)** · **[Luyện quiz](/quiz)**

## Chọn cách bắt đầu

| Bạn đang cần gì? | Đi tiếp từ đây |
| --- | --- |
| Ôn nền tảng để đọc code chắc hơn | [Kotlin](./foundation/kotlin/basics.md), [Activity/Fragment](./android-core/activity-fragment.md) |
| Hiểu lỗi lifecycle, cancellation hoặc event bị mất | [State recovery](./android-core/state-recovery.md), [structured concurrency](./foundation/kotlin/structured-concurrency.md), [state/event](./architecture/ui-state-events.md) |
| Thiết kế tính năng dùng trong sản phẩm | [Offline-first](./data/offline-first.md), [networking](./data/retrofit.md), [security](./security/security-model.md) |
| Chuẩn bị phỏng vấn Senior | [Bộ câu hỏi](./interview/android-questions.md), [system design](./interview/system-design.md), [quiz](/quiz) |
| Muốn chứng minh năng lực bằng thực hành | [Capstone chat offline và rubric](./interview/senior-capstone.md) |

## Những năng lực cần kết nối

### Android và concurrency

Hiểu Context, vòng đời View/Fragment, scope ownership và state sau mất process. Phân tích được request thuộc về ai, lỗi lan tới đâu và vì sao collector dừng chưa chắc producer đã dừng.

[Context/memory](./android-core/context-memory.md) · [Flow/lifecycle](./foundation/kotlin/flow-lifecycle.md) · [Background work](./android-core/background-work.md)

### Kiến trúc và dữ liệu

Chọn boundary theo vấn đề, thiết kế contract có lỗi/unknown outcome, tránh mất thao tác hoặc tạo dữ liệu trùng. Đo lợi ích module hóa và bảo vệ dữ liệu khi schema/session thay đổi.

[Clean Architecture](./architecture/clean-architecture.md) · [Module hóa](./architecture/modularization.md) · [Room](./data/room.md) · [Offline-first](./data/offline-first.md)

### UI, performance và accessibility

Biết identity của state/effect/item, measurement/draw và cách tìm bottleneck trong trace. Kiểm tra trải nghiệm trên font scale, input và thiết bị khác nhau thay vì chỉ nhìn screenshot happy path.

[Compose](./ui/jetpack-compose.md) · [Custom View](./ui/custom-view.md) · [Startup](./performance/startup.md) · [Profiling](./performance/profiling.md)

### Testing, security và delivery

Chọn test đúng boundary, kiểm soát thời gian và failure injection; mô tả trust boundary, session race, rollout và điều kiện rollback. Mỗi kết luận cần bằng chứng tương ứng với phạm vi nó tuyên bố.

[Test strategy](./testing/test-strategy.md) · [Security model](./security/security-model.md) · [Permissions](./security/permissions-components.md) · [CI/CD](./real-world/ci-cd.md)

## Học để giải thích được lựa chọn

Mỗi chủ đề chuyên sâu có tình huống lỗi, ví dụ hoặc sơ đồ, bài thực hành và nguồn tham khảo. Sau khi đọc, hãy trả lời: **cơ chế gì đang hoạt động, giải pháp dựa trên giả định nào, khi nào nó thất bại và cách kiểm chứng?**

Quiz giúp tìm phần chưa vững; kết quả quiz không xác định chức danh nghề nghiệp. Capstone giúp bạn tổ chức bằng chứng để trao đổi với reviewer. Dùng sidebar để xem toàn bộ chủ đề hoặc tìm bằng từ khóa tiếng Việt/thuật ngữ tiếng Anh.
