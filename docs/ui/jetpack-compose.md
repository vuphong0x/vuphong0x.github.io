---
title: Jetpack Compose
---

# Jetpack Compose: state, effect và hiệu năng

Compose mô tả UI từ state. State hoisting chuyển quyền sở hữu state tới nơi cần phối hợp; composable con nhận giá trị và callback. Trên Android, collect Flow UI bằng `collectAsStateWithLifecycle()`.

```kotlin
@Composable
fun SearchField(query: String, onQueryChange: (String) -> Unit) {
    TextField(value = query, onValueChange = onQueryChange)
}
```

`Column`/`Row` sắp xếp tuần tự, `Box` xếp chồng, `LazyColumn`/`LazyRow` compose/layout item khi cần. Thứ tự modifier ảnh hưởng đo, vẽ và vùng tương tác.

## remember và rememberSaveable

`remember` giữ giá trị trong composition qua recomposition. `rememberSaveable` bổ sung cơ chế saved state cho dữ liệu lưu được; custom type có thể cần Saver. Đây không phải storage dài hạn. State phục hồi còn phụ thuộc owner/task; dữ liệu cần sống sau khi đóng task phải được persist.

Xem [state recovery](../android-core/state-recovery.md) để phân biệt rotation, mất process và force-stop.

## Effect và identity {#effects}

| API | Dùng khi |
| --- | --- |
| `LaunchedEffect(key)` | Coroutine theo composition, restart khi key đổi |
| `DisposableEffect(key)` | Đăng ký resource/listener có cleanup trong `onDispose` |
| `SideEffect` | Publish state ra bên ngoài sau mỗi composition thành công |
| `rememberCoroutineScope()` | Chạy coroutine từ event UI, scope theo composition |
| `rememberUpdatedState(value)` | Effect đang chạy cần giá trị mới mà không restart vì giá trị đó |

Ví dụ: timeout không nên reset chỉ vì callback được tạo lại. Giữ callback mới qua `rememberUpdatedState`, còn key effect phản ánh identity thực sự của timeout. Không mặc định dùng `LaunchedEffect(Unit)` cho mọi tác vụ và không gọi API trực tiếp trong composable body.

### Ví dụ: callback mới nhưng cùng phiên timeout

```kotlin
@Composable
fun SessionTimeout(sessionId: String, onTimeout: () -> Unit) {
    val latestOnTimeout by rememberUpdatedState(onTimeout)
    LaunchedEffect(sessionId) {
        delay(5_000)
        latestOnTimeout()
    }
}
```

Ví dụ dùng Compose runtime cùng `kotlinx.coroutines.delay`. `sessionId` đổi nghĩa là công việc cũ không còn thuộc phiên hiện tại: cancel và bắt đầu timeout mới. Callback đổi trong cùng phiên chỉ cần cập nhật reference; đưa callback đó vào key có thể reset timeout mỗi khi callback được tạo lại.

Điều ngược lại cũng quan trọng: nếu dữ liệu đổi thực sự cần tải lại, giữ key hằng số rồi dùng `rememberUpdatedState` để né restart sẽ sai semantics. Key phải mô tả identity của công việc, không phải công cụ làm giảm số lần chạy bằng mọi giá.

### Ví dụ: resource cần cleanup

```kotlin
DisposableEffect(source) {
    val listener: (String) -> Unit = { status -> onStatusChanged(status) }
    source.addListener(listener)
    onDispose { source.removeListener(listener) }
}
```

Đây là minh họa với callback source của ứng dụng; `onStatusChanged` được giả định ổn định trong lifetime effect. Nếu callback cần thay đổi mà registration không nên restart, dùng `rememberUpdatedState` để listener gọi callback mới. Nếu key source đổi, cleanup phải gỡ listener khỏi **source cũ**, rồi đăng ký source mới.

Composition vẫn có thể tồn tại khi Activity stopped. DisposableEffect tự nó không có nghĩa listener chỉ active ở STARTED. Với resource cần theo lifecycle màn hình, kết hợp lifecycle-aware collection hoặc effect lifecycle phù hợp; xem [Flow theo lifecycle](../foundation/kotlin/flow-lifecycle.md#collection).

Nguồn: [Side-effects in Compose](https://developer.android.com/develop/ui/compose/side-effects).

## State dẫn xuất {#derived-state}

Dùng `derivedStateOf` khi input thay đổi thường xuyên hơn kết quả cần hiển thị, như chỉ hiện nút lên đầu khi item đầu tiên đã cuộn khỏi màn hình.

```kotlin
val listState = rememberLazyListState()
val showScrollToTop by remember {
    derivedStateOf { listState.firstVisibleItemIndex > 0 }
}
```

Đừng bọc mọi biểu thức vào derived state: nó có overhead. Chuyển tính toán nặng khỏi composition body và đo ảnh hưởng thực tế.

## Key cho danh sách {#lazy-keys}

```kotlin
LazyColumn {
    items(items = messages, key = { it.id }) { message ->
        MessageRow(message)
    }
}
```

Key ổn định và duy nhất giữ identity khi chèn/xóa/đổi thứ tự. Index không phù hợp khi vị trí item thay đổi mà item có state. Key cần tương thích saved state nếu item dùng `rememberSaveable` trên Android.

Nguồn: [Lazy list item keys](https://developer.android.com/develop/ui/compose/lists#item-keys).

## Strong skipping và stability {#strong-skipping}

Strong skipping được bật mặc định từ Kotlin 2.0.20. Khi bật, restartable composable có unstable parameter **vẫn có thể được skip**: unstable được so bằng identity, stable bằng equals. State invalidation vẫn có thể yêu cầu chạy lại.

`@Stable` và `@Immutable` là cam kết về hành vi của type. Đừng gắn annotation để che việc mutate collection thường mà Compose không quan sát được. Một data class dùng `val` nhưng chứa `MutableList` không tự trở thành immutable sâu.

Nguồn: [Strong skipping](https://developer.android.com/develop/ui/compose/performance/stability/strongskipping).

## Mutate collection thường không phải observable state {#mutation}

```kotlin
// Dễ sai: mutate bên trong List không tạo một state write mới.
val messages = remember { mutableListOf<String>() }
// messages.add("Hello") không tự báo Compose cần đọc lại.
```

Một lựa chọn là state chứa immutable snapshot và gán list mới; lựa chọn khác là snapshot-aware collection khi UI thực sự sở hữu collection mutable. Với StateFlow ở ViewModel, expose state bất biến và cập nhật bằng giá trị mới thay vì sửa object đã được emit trước đó.

Không sửa triệu chứng bằng `@Stable` rồi tiếp tục mutate dữ liệu không được quan sát. Compose cần cơ chế thông báo thay đổi đúng; skipping chỉ là tối ưu khi runtime/compiler được phép tin contract.

## Recomposition, layout và draw là các giai đoạn khác nhau {#phases}

Thay đổi state không đồng nghĩa luôn cần chạy lại toàn bộ pipeline. Nơi state được đọc quyết định phase phải cập nhật. Với animation/scroll, đọc state ở phase phù hợp có thể giảm công việc; nhưng API lambda/modifier phải được chọn theo đúng semantics layout/draw.

Khi một danh sách giật, đo critical user journey trước: có thể bottleneck là decode ảnh, layout phức tạp, main thread bị I/O, RenderThread/GPU hoặc scheduling. Recomposition count giúp đặt giả thuyết, không chứng minh một frame đã lỡ deadline. Chỉ đổi dữ liệu/annotation sau khi thấy nơi chi phí xuất hiện trong trace.

Nguồn: [Compose phases](https://developer.android.com/develop/ui/compose/phases), [State in Compose](https://developer.android.com/develop/ui/compose/state).

## Bài thực hành: danh sách chat

1. Dựng LazyColumn có input hoặc trạng thái mở rộng theo từng item.
2. Chèn message ở đầu list, so sánh index key và message ID key; quan sát state có theo đúng item không.
3. Thêm effect tải avatar theo user ID; kiểm tra thay ID có hủy công việc cũ và nhận ảnh của user mới không.
4. Cho callback timeout đổi trong recomposition; xác định có nên reset timeout theo yêu cầu thực tế.
5. Ghi frame timing khi cuộn; không chỉ ghi số recomposition.

Kiểm tra cả font scale và semantics của message/action. Nếu phần tử tương tác chỉ được vẽ qua Canvas, behavior accessibility phải được thiết kế thêm; xem [custom View và accessibility](./custom-view.md#accessibility).

## Câu hỏi thực hành

- Callback mới xuất hiện trong recomposition: effect nên restart hay chỉ nhận reference mới?
- List bị chèn đầu: state của item có theo đúng ID không?
- Đếm recomposition tăng: frame có thực sự bị jank không? Trace nào chứng minh bottleneck?
- Mutable data đổi nhưng UI không cập nhật: state có observable và contract stability có đúng không?

[Profiling](../performance/profiling.md#senior-measurement) · [Lộ trình Senior](../interview/senior-android.md) · [Quiz](/quiz)
