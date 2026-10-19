---
title: Clean Architecture và dependency boundaries
---

# Clean Architecture: chọn boundary theo vấn đề

Clean Architecture đặt dependency của source code hướng về policy/abstraction ổn định hơn. Trong Android, một thiết kế thường tách UI, logic nghiệp vụ và nguồn dữ liệu, nhưng không có yêu cầu mọi app phải có đúng ba Gradle module hoặc một UseCase cho mỗi hàm repository.

## 1. Dependency lúc compile khác lời gọi lúc chạy {#dependencies}

```text
:feature:checkout → :domain:orders ← :data:orders
                            ↑
:app ghép implementation và dependency injection
```

Trong thiết kế này, domain khai báo contract cần thiết; data implement contract. Lúc chạy, ViewModel gọi use case/repository và thực thi data implementation. Việc lời gọi đi tới database không có nghĩa domain phải import Room.

Tên thư mục không tạo boundary. Nếu domain import DTO Retrofit hoặc UI phải xử lý cursor Room, abstraction vẫn bị lộ dù project có đủ folder `presentation/domain/data`.

## 2. Khi nào thêm UseCase? {#use-cases}

Một UseCase có ích khi đóng gói policy dùng lại hoặc phối hợp nhiều nguồn. Ví dụ “đặt hàng” cần kiểm tra đầu vào, dùng cart snapshot, tạo logical request ID và phân loại kết quả chưa được xác nhận. Một lớp `GetUserUseCase` chỉ gọi đúng `repository.getUser()` có thể chưa thêm giá trị trong app CRUD nhỏ.

Android architecture guidance coi domain layer là tùy chọn theo độ phức tạp/reuse. Đừng bắt UI import data implementation để né abstraction; cũng đừng tạo lớp pass-through chỉ để đáp ứng sơ đồ.

Nguồn: [Architecture recommendations](https://developer.android.com/topic/architecture/recommendations).

## 3. Contract nhỏ có semantics rõ

```kotlin
interface Orders {
    suspend fun submit(draft: OrderDraft, requestId: String): SubmitResult
    fun observeOrder(id: String): Flow<Order>
}

sealed interface SubmitResult {
    data class Confirmed(val orderId: String) : SubmitResult
    data class Rejected(val reason: String) : SubmitResult
    data class PendingConfirmation(val requestId: String) : SubmitResult
}
```

Đây là model minh họa; app phải định nghĩa OrderDraft/Order và mapping lỗi. `PendingConfirmation` biểu diễn timeout không rõ server đã commit hay chưa. Nếu chỉ có `Boolean`, UI có thể retry với ID mới và tạo đơn trùng.

Domain không cần biết HTTP status nào tương ứng một rejection cụ thể. Data implementation chuyển transport/API contract thành domain semantics, đồng thời giữ cancellation đúng. Không bắt mọi repository luôn trả Flow<Result<T>>; chọn one-shot hay observation theo nhu cầu caller.

## 4. Model riêng khi có lý do riêng

DTO thể hiện API contract; entity thể hiện schema/cache; UI state thể hiện nhu cầu render. Tách model giúp thay đổi độc lập khi các contract khác nhau, nhưng không tự bảo vệ khỏi mọi thay đổi backend: field mất ý nghĩa hoặc đổi semantics vẫn có thể buộc đổi domain.

Không copy cùng bộ field qua bốn lớp mà không có policy/mapping hữu ích. Ngược lại, expose entity mutable ra UI có thể cho phép sửa state ngoài owner và làm test khó tin cậy. Ghi lại vì sao từng model tồn tại.

## 5. Test boundary và chi phí thay đổi

Dùng fake Orders cho test state holder; test data implementation với server/database kiểm soát được; test mapping rejection và unknown outcome. Một test ViewModel không chứng minh HTTP client hoặc migration hoạt động, nên cần kiểm chứng đúng tầng.

**Bài tập:** thiết kế checkout có offline cart. Viết dependency graph, ba kết quả SubmitResult và một quyết định có/không dùng UseCase. Giải thích phần nào phải thay đổi nếu backend chuyển protocol mà semantics đặt hàng vẫn giữ nguyên.

Đọc tiếp: [UDF và state/event](./ui-state-events.md), [modularization](./modularization.md), [offline-first](../data/offline-first.md), [capstone](../interview/senior-capstone.md).
