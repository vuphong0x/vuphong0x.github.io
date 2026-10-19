---
title: UDF, UI state và event delivery
sidebar_position: 5
---

# UDF, UI state và xử lý kết quả không bị mất

Bài này đào sâu câu hỏi **“state xuống, event lên”** và tình huống **“kết quả request đến lúc UI đang STOPPED”**. Vấn đề không chỉ là chọn StateFlow hay SharedFlow: cần xác định nguồn dữ liệu, quyền sở hữu và điều kiện để coi một kết quả đã được xử lý.

Đọc trước: [MVVM](./mvvm.md), [Flow theo lifecycle](../foundation/kotlin/flow-lifecycle.md).

## 1. State là mô tả hiện tại, action là yêu cầu {#udf}

Với màn hình checkout, UI gửi `SubmitOrder`; state holder xử lý action và cập nhật `Submitting`, `Failed` hoặc `Confirmed(orderId)`. UI render state thay vì tự giữ một bản trạng thái nghiệp vụ riêng rồi sửa song song.

```text
User action
  → ViewModel / state holder
    → Repository / use case khi cần
      → nguồn dữ liệu nghiệp vụ
        → UiState
          → UI render
```

UDF giúp nhìn thấy ai có quyền sửa state và làm cho test có đầu vào/đầu ra rõ ràng. Nó không yêu cầu mọi app có reducer hoặc mọi action đi qua một sealed Intent. Đó là lựa chọn tổ chức thêm, không phải điều kiện để state đi một chiều.

## 2. Phân biệt state, hiệu ứng UI và kết quả nghiệp vụ

| Nội dung | Ai nên sở hữu? | Cần sống qua mất process? |
| --- | --- | --- |
| Text người dùng đang nhập | UI/state holder tùy mức chia sẻ | Tùy yêu cầu bản nháp |
| Danh sách sản phẩm cache | Data layer | Nếu cần offline/cache bền vững |
| Điều hướng do bấm một nút UI | UI/navigation owner | Thường phục hồi qua navigation state, tùy flow |
| Giao dịch đã được server xác nhận | Repository/backend + ID | Có nếu cần reconcile giao dịch |
| Snackbar thông báo phụ | UI hoặc state holder theo contract | Có thể chấp nhận mất, phải quyết định rõ |

Một event “payment succeeded” chứa kết quả nghiệp vụ không nên có lifetime ngắn chỉ vì muốn gọi `navigate()` một lần. Ngược lại, không phải mọi click hoặc toast đều cần database và acknowledgment.

Nguồn kiến trúc: [UI layer](https://developer.android.com/topic/architecture/ui-layer), [UI events](https://developer.android.com/topic/architecture/ui-layer/events).

## 3. Timeline làm mất event {#delivery}

```text
T0: UI collect SharedFlow(replay=0)
T1: UI STOPPED → collector bị cancel
T2: request hoàn tất → emit Success(orderId)
T3: không có subscriber, replay=0 → giá trị không được giữ
T4: UI STARTED → collector mới không có kết quả để dựng lại màn hình
```

`extraBufferCapacity` không lưu hộ subscriber chưa tồn tại. Đổi replay sang 1 có thể đưa kết quả cho collector mới, nhưng cũng phải xét việc replay một navigation đã xử lý.

Channel có semantics khác SharedFlow nhưng không tự cung cấp bảo đảm **side effect được xử lý đúng một lần**. Coroutine có thể nhận phần tử rồi bị cancel trước khi hoàn tất xử lý. Process death còn làm mất dữ liệu trong RAM.

Nguồn: [SharedFlow](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/-shared-flow/).

## 4. Mô hình hóa kết quả theo state {#state-model}

Ví dụ sau là state transition tối giản, dùng kết quả đơn hàng thay vì một queue sự kiện transient:

```kotlin
sealed interface CheckoutState {
    data object Editing : CheckoutState
    data object Submitting : CheckoutState
    data class Confirmed(val orderId: String) : CheckoutState
    data class Failed(val message: String) : CheckoutState
}

class CheckoutViewModel(
    private val repository: OrderRepository,
) : ViewModel() {
    private val _state = MutableStateFlow<CheckoutState>(CheckoutState.Editing)
    val state = _state.asStateFlow()

    fun submit(cartId: String, requestId: String) {
        if (_state.value != CheckoutState.Editing) return
        _state.value = CheckoutState.Submitting
        viewModelScope.launch {
            try {
                val orderId = repository.submit(cartId, requestId)
                _state.value = CheckoutState.Confirmed(orderId)
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (error: IOException) {
                _state.value = CheckoutState.Failed("Chưa xác nhận được kết quả")
            }
        }
    }
}
```

Giả định `submit()` chỉ được gọi trên main thread và `OrderRepository.submit()` là main-safe. Ví dụ bỏ qua reset/edit/retry để tập trung vào transition. App thực tế cần đường phục hồi sau Failed và phải xác định cancellation của request làm state thay đổi thế nào.

Lưu ý `requestId`: thao tác logical phải có ID ổn định khi retry; không tạo ID mới sau mỗi timeout. Repository phải phân biệt “server từ chối” và “chưa biết đã commit chưa”, đồng thời lưu/reconcile kết quả nếu cần phục hồi sau process death. Mỗi instance ViewModel giữ state không đủ cho yêu cầu đó.

## 5. Navigation và acknowledgment {#acknowledgment}

Khi thấy `Confirmed(orderId)`, UI có thể render xác nhận tại chỗ hoặc điều hướng theo state. Nếu điều hướng, phải xử lý trường hợp state được collect lại: kiểm tra destination/identity hiện tại, tránh push thêm cùng confirmation liên tục và quản lý back stack theo flow.

Nếu có danh sách thông báo cần acknowledgment, dùng ID ổn định và xóa **đúng ID** sau khi xử lý. Không gọi “clear tất cả” vì thông báo mới có thể đến lúc UI đang hiển thị thông báo trước. Xác định rõ khi nào là “đã xử lý”: snackbar bắt đầu, kết thúc hay người dùng bấm action?

Acknowledgment không làm hai side effect trở thành transaction. Nếu UI điều hướng xong nhưng process chết trước khi xác nhận, lần phục hồi có thể lặp lại hiệu ứng. Giải pháp thường gồm effect idempotent, kiểm tra state hiện tại hoặc chọn semantics at-least-once/at-most-once chấp nhận được cho sản phẩm.

## 6. Repository và UseCase theo contract {#repository-contract}

Không phải mọi API phải trả `Flow<Result<T>>`:

- `suspend fun submit(...): OrderId` phù hợp kết quả một lần, với lỗi được contract quy định.
- `Flow<Order>` phù hợp quan sát thay đổi đơn hàng.
- Sealed domain result hữu ích khi caller cần xử lý rõ các nhánh như Rejected, PendingConfirmation và Confirmed.
- Kotlin `Result<T>` là một type khác; không có `Result.Success`/`Result.Error` nếu app chưa tự định nghĩa type như vậy.

Thêm UseCase khi có rule dùng lại hoặc orchestration đáng kể. Một lớp chỉ chuyển tiếp mỗi hàm repository chưa chắc đem lại boundary hữu ích. Tách interface theo nhu cầu caller, giữ domain không phụ thuộc UI và kiểm tra dependency graph khi module hóa.

Đọc tiếp: [Clean Architecture](./clean-architecture.md), [modularization](./modularization.md).

## 7. Kiểm chứng bằng failure case

**Bài tập:** mô tả expected behavior trước khi viết test cho các trường hợp sau:

1. Bấm submit hai lần liên tiếp: một logical request hay hai request?
2. UI STOPPED khi kết quả đến: state nào còn để render?
3. Rotate sau Confirmed: có thêm một destination trùng không?
4. Timeout sau server commit: retry dùng ID nào?
5. Kill process rồi mở lại: tải trạng thái từ đâu?
6. User rời flow có chủ đích: còn cần hiện confirmation khi quay lại không?

Một câu trả lời Senior tốt giải thích được semantics sản phẩm trong từng trường hợp, thay vì chỉ liệt kê ưu điểm của một primitive concurrency.

Đọc tiếp: [state recovery](../android-core/state-recovery.md), [offline-first](../data/offline-first.md), [test Coroutines](../testing/coroutines.md). [Bộ câu hỏi](../interview/android-questions.md) · [Quiz](/quiz).
