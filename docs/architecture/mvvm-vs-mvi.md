---
title: MVVM và MVI — state, reducer và concurrency
---

# MVVM và MVI: so sánh trên cùng một bài toán

MVVM và MVI là những họ cách tổ chức presentation logic, có nhiều biến thể trong thực tế. ViewModel có thể expose immutable state và dùng reducer; một màn hình gọi là MVI vẫn có thể bị race condition hoặc mất event. Đánh giá implementation qua ownership, transition và failure semantics thay vì chỉ tên pattern.

## 1. Những quyết định cần tách riêng

| Quyết định | Các lựa chọn có thể dùng |
| --- | --- |
| UI gửi action bằng gì? | Method cụ thể, sealed action, callback |
| State được tổ chức thế nào? | Một snapshot theo screen hoặc các state độc lập có contract rõ |
| Transition ở đâu? | Method của state holder hoặc pure reducer |
| Effect chạy thế nào? | Coroutine theo scope, executor/actor theo policy |
| Kết quả quan trọng được giữ ở đâu? | State/persistence với identity và reconciliation |
| Xử lý action đồng thời ra sao? | Ignore, queue, cancel-previous, latest-wins hoặc merge |

Không có yêu cầu mọi MVI phải có một data class cho toàn ứng dụng. MVVM cũng không cấm state tổng hợp hoặc reducer thuần. Android architecture guidance tập trung UDF, state holder và separation of concerns; không phải một bảng xếp hạng pattern.

Nguồn: [Architecture recommendations](https://developer.android.com/topic/architecture/recommendations).

## 2. Cùng một tình huống: search trả kết quả sai thứ tự {#race}

```text
Query A → request A bắt đầu
Query B → request B bắt đầu
Response B về → hiển thị B
Response A về chậm hơn → nếu ghi đè vô điều kiện, UI lại hiển thị A
```

Một reducer không tự biết response nào thuộc query hiện tại. Cần identity/version và policy cho request cũ. Có thể cancel previous nếu API hợp tác, đồng thời kiểm tra identity để tránh stale result ở boundary cần thiết. Với side effect đã commit ở server, cancellation không đảo ngược thao tác đó.

## 3. Reducer thuần với request version {#reducer}

Ví dụ dùng List<String> để tập trung vào transition; caller phải truyền snapshot không bị mutate sau khi phát. Khi tích hợp, định nghĩa model item, loading/error UI và policy cache phù hợp.

```kotlin
sealed interface SearchPhase {
    data object Idle : SearchPhase
    data object Loading : SearchPhase
    data object Ready : SearchPhase
    data object Error : SearchPhase
}

data class SearchState(
    val query: String = "",
    val version: Long = 0,
    val items: List<String> = emptyList(),
    val phase: SearchPhase = SearchPhase.Idle,
)

sealed interface SearchAction {
    data class QueryChanged(val query: String) : SearchAction
    data object Submitted : SearchAction
    data class Loaded(val version: Long, val items: List<String>) : SearchAction
    data class Failed(val version: Long) : SearchAction
}

fun reduce(state: SearchState, action: SearchAction): SearchState = when (action) {
    is SearchAction.QueryChanged -> state.copy(
        query = action.query,
        version = state.version + 1,
        phase = SearchPhase.Idle,
    )
    SearchAction.Submitted -> state.copy(
        version = state.version + 1,
        phase = SearchPhase.Loading,
    )
    is SearchAction.Loaded -> if (action.version == state.version) {
        state.copy(items = action.items, phase = SearchPhase.Ready)
    } else state
    is SearchAction.Failed -> if (action.version == state.version) {
        state.copy(phase = SearchPhase.Error)
    } else state
}
```

QueryChanged làm response của request cũ không còn hợp lệ, kể cả trước lần submit mới. Ví dụ giữ items cũ trong lúc sửa query; UI cần biểu diễn cached/stale content đúng hoặc xóa items nếu policy sản phẩm yêu cầu. Reducer là nơi công bố lựa chọn đó, không phải cơ chế tự quyết định UX.

## 4. Effect và action ordering {#effects}

State holder serialize các action theo policy được chọn, áp reducer rồi bắt đầu effect ngoài reducer. Khi Submitted được chấp nhận, chụp query/version tương ứng và đưa version đó vào Loaded/Failed sau request. Không đọc `_state.value.query` sau await để đoán request vừa xong thuộc query nào.

Reducer không gọi network, không đọc clock hệ thống, không log credential và không sinh random ID. Nếu dùng `MutableStateFlow.update`, lambda có thể được đánh giá lại khi concurrent update; pure transition tránh lặp side effect trong lambda đó. StateFlow APIs thread-safe không có nghĩa chuỗi nhiều thao tác đọc/ghi nghiệp vụ đã atomic.

Ví dụ version bảo vệ stale response, nhưng không tự giới hạn request/băng thông. Debounce, cancel-previous hoặc queue là các quyết định riêng. Đồng bộ access khi caller đa luồng hoặc chỉ cho phép dispatch trên main thread theo contract rõ ràng.

Nguồn: [StateFlow](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/-state-flow/), [structured concurrency](../foundation/kotlin/structured-concurrency.md).

## 5. Kiểm tra reducer và effect ở hai boundary

```kotlin
@Test
fun staleResponseDoesNotReplaceCurrentItems() {
    val current = SearchState(query = "B", version = 2, items = listOf("B result"))
    val next = reduce(current, SearchAction.Loaded(version = 1, items = listOf("A result")))
    assertEquals(current, next)
}
```

Đây là JVM test dùng JUnit/assertions theo setup project. Nó chứng minh một transition cụ thể, không chứng minh API thật đã cancel. Test effect cần fake điều khiển thứ tự request A/B, failure và cancellation; test UI cần xác nhận state render và lifecycle collection đúng.

Một snapshot chứa `isLoading=true` và `error!=null` vẫn có thể được tạo nếu model cho phép. Immutable data class giảm mutation ngoài ý muốn, không tự làm impossible states biến mất. Có thể dùng sealed state cho tổ hợp cần loại trừ hoặc enforce invariant trong transition.

## 6. Navigation và kết quả nghiệp vụ {#delivery}

Channel/SharedFlow thường xuất hiện trong cả MVVM lẫn MVI, nhưng chúng không bảo đảm side effect được xử lý exactly-once qua cancellation hoặc process death. SharedFlow(replay=0) có thể mất event khi không có subscriber; Channel có thể chuyển phần tử rồi consumer bị hủy trước khi hoàn tất xử lý.

Với checkout, giữ order/request ID và trạng thái xác nhận trong nguồn dữ liệu phù hợp, dựng UI từ đó. Acknowledgment/handling cần identity và semantics rõ ràng; replay một lần không thay thế persistence hoặc server reconciliation. Xem [UDF, state và event delivery](./ui-state-events.md).

## 7. Chọn cấu trúc theo chi phí và nhu cầu

Reducer/action rõ ràng có ích khi transition phức tạp, nhiều input và cần review/test tập trung. Với màn hình nhỏ, methods cụ thể và immutable screen state có thể đủ. Cả hai đều cần scope, state ownership và error policy đúng.

Log/replay toàn bộ action không phải mặc định an toàn: action có thể chứa password/PII, clock/random và kết quả I/O không tự tái tạo từ user intents. Muốn time-travel debugging cần xác định dữ liệu được lưu, side effects nào không chạy lại và policy redaction.

**Bài tập:** triển khai cùng screen bằng public methods và sealed actions. Giữ cùng test matrix: response sai thứ tự, double submit, cancel, rotation và UI STOPPED. So sánh độ dễ review/đổi behavior, không chỉ số class.

Đọc tiếp: [MVVM](./mvvm.md), [Flow](../foundation/kotlin/flow-lifecycle.md), [test strategy](../testing/test-strategy.md), [security](../security/security-model.md#session).
