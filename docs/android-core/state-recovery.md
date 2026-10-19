---
title: State recovery & lifecycle
---

# Phục hồi state và collect đúng lifecycle

## Chọn nơi lưu state

ViewModel giữ dữ liệu qua configuration change, nhưng mất cùng process. Saved state giữ thông tin UI nhỏ khi hệ thống có thể khôi phục task. Dữ liệu cần giữ sau khi đóng task phải nằm trong storage hoặc backend.

Ví dụ: lưu `productId` và query trong `SavedStateHandle`, nạp lại sản phẩm qua repository. Không lưu bitmap, cả danh sách phân trang hay object graph lớn vào Bundle. Khi dữ liệu server thay đổi, kiểm tra lại điều kiện nghiệp vụ thay vì tin cache cũ.

```kotlin
class ProductViewModel(
    savedStateHandle: SavedStateHandle,
    repository: ProductRepository,
) : ViewModel() {
    private val productId: String = checkNotNull(savedStateHandle["productId"])
    val product = repository.observeProduct(productId)
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), null)
}
```

Đoạn code giả định navigation cung cấp `productId` hợp lệ và repository expose `Flow<Product?>`. Với app thực tế, mô hình hóa loading/error/not-found và kiểm tra input bên ngoài.

Không dùng `onDestroy()` làm nơi ghi duy nhất: hệ thống có thể kết thúc process mà không gọi callback đó. Persist bản nháp khi người dùng thay đổi nội dung theo chính sách phù hợp.

Nguồn: [Save UI states](https://developer.android.com/topic/libraries/architecture/saving-states), [SavedStateHandle](https://developer.android.com/topic/libraries/architecture/viewmodel/viewmodel-savedstate).


## Timeline phục hồi: instance mới, dữ liệu được dựng lại {#restoration-timeline}

Xét màn hình tìm kiếm với query, kết quả và item đang chọn:

```text
Process P1: user nhập query, chọn item
  → ViewModel giữ state đang dùng
  → SavedStateHandle lưu query + selectedId nhỏ
  → dữ liệu nghiệp vụ/cache được persist theo chính sách
Activity đi vào background, host lưu state
Process P1 bị hệ thống kết thúc
User mở lại task được hệ thống phục hồi
Process P2: Activity và ViewModel mới
  → đọc query + selectedId đã restore
  → lấy kết quả mới từ repository
  → render loading/content/error theo dữ liệu hiện tại
```

Điều được phục hồi là **đầu vào để tái tạo màn hình**, không phải nguyên object graph hay request cũ đang chạy. Nếu server đã thay đổi giá hoặc một item đã bị xóa, UI phải phản ánh dữ liệu hiện tại thay vì cố phục hồi một snapshot không còn hợp lệ.

## Ví dụ lưu query và selection {#saved-state-example}

```kotlin
class SearchViewModel(
    private val savedStateHandle: SavedStateHandle,
) : ViewModel() {
    val query: StateFlow<String> =
        savedStateHandle.getStateFlow("query", "")

    val selectedId: StateFlow<String?> =
        savedStateHandle.getStateFlow("selectedId", null)

    fun setQuery(value: String) {
        savedStateHandle["query"] = value
    }

    fun selectItem(id: String?) {
        savedStateHandle["selectedId"] = id
    }
}
```

Ví dụ dùng `androidx.lifecycle` và `kotlinx.coroutines.flow.StateFlow`; default ViewModel creation được cấu hình để cung cấp SavedStateHandle. Chỉ lưu String/ID nhỏ. Repository có thể quan sát query, debounce theo nhu cầu và lấy lại dữ liệu; không serialize cả response mạng vào handle.

Trên Android Compose, UI collect `query` bằng `collectAsStateWithLifecycle()` rồi truyền giá trị và callback vào TextField. Với Fragment, dùng View lifecycle như phần bên dưới. Lưu một giá trị không tự render UI nếu UI vẫn đọc một biến cache cũ tách rời khỏi state đó.

Saved state phụ thuộc chu kỳ lưu của host. Ghi khi Activity đang stopped không có nghĩa bản ghi đó đã được snapshot mới; cần host trải qua chu kỳ phù hợp. Nếu bản nháp không được phép mất, ghi persistent storage theo policy riêng thay vì xem SavedStateHandle là database.

## Giữ gì ở đâu? {#storage-boundaries}

| State | Ví dụ lựa chọn | Lý do và giới hạn |
| --- | --- | --- |
| Vị trí cuộn/selection UI nhỏ | Saved state phù hợp owner | Có ích khi phục hồi task, không là dữ liệu nghiệp vụ lâu dài |
| Query đang dùng để dựng màn hình | SavedStateHandle nếu thuộc ViewModel | Khôi phục đầu vào cho repository |
| Kết quả tìm kiếm lớn | Cache hoặc nạp lại | Tránh serialized payload lớn trong Bundle |
| Giỏ hàng/bản nháp quan trọng | Room/backend theo yêu cầu | Cần giữ qua task dismissal và thiết kế đồng bộ |
| Tùy chọn nhỏ lâu dài | DataStore khi phù hợp | Dữ liệu cấu hình, không thay thế mọi mô hình quan hệ |
| Trạng thái thanh toán | ID + trạng thái từ nguồn nghiệp vụ tin cậy | Cần reconcile, không chỉ replay event UI |

`rememberSaveable` phù hợp state do UI sở hữu và có thể lưu theo cơ chế saved state. Di chuyển mọi state vào ViewModel cũng không tự làm nó bền vững; hãy chọn theo owner và lifetime.

## Collector cập nhật View {#lifecycle-collection}

Fragment instance có thể tồn tại lâu hơn View. Đăng ký collector trong `onViewCreated()` theo **View lifecycle**, không giữ binding cũ trong job của Activity hoặc scope toàn ứng dụng.

```kotlin
viewLifecycleOwner.lifecycleScope.launch {
    viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
        launch { viewModel.uiState.collect { render(it) } }
        launch { viewModel.progress.collect { renderProgress(it) } }
    }
}
```

Mỗi `collect` vô hạn cần coroutine riêng nếu muốn chạy song song. Block bị hủy dưới STARTED và chạy lại khi trở về STARTED; scope kết thúc khi View bị hủy. Với Compose trên Android, dùng `collectAsStateWithLifecycle()` cho UI state.

Việc hủy collector không tự dừng mọi hot producer: upstream còn phụ thuộc scope và chính sách sharing. Kiểm tra `stateIn`/`shareIn`, resource ownership và cleanup.

Nguồn: [Lifecycle-aware coroutines](https://developer.android.com/topic/libraries/architecture/coroutines).

## Rotation không phải process death

Trong configuration change thông thường, ViewModelStore có thể giữ lại ViewModel trong khi Activity/View mới được tạo. Sau mất process, không còn instance nào trong RAM đó để giữ lại. Nếu test chỉ chứng minh ViewModel còn cùng reference sau rotation, bạn chưa kiểm tra đường khởi tạo mới từ saved state.

ViewModel cũng không nên giữ Activity hoặc View để “restore UI nhanh hơn”: nó có thể giữ owner cũ qua rotation. Xem [Context và ownership](./context-memory.md#ownership).

## Kiểm tra phục hồi {#verify-restoration}

1. Nhập query, chọn sản phẩm và ghi nhận UI mong đợi.
2. Xoay màn hình: kiểm tra configuration change, request trùng và View cũ bị giữ.
3. Đưa app về background bằng Home, chạy `adb shell am kill your.package.name`, rồi mở **task cũ từ Recents**.
4. Kiểm tra query/ID được phục hồi, dữ liệu được nạp lại và loading/error vẫn hợp lý.
5. Kiểm tra riêng `finish()`, xóa task và force-stop: chỉ dữ liệu được persist phải đáp ứng yêu cầu giữ lâu dài.

Lệnh adb chỉ dành cho app đang phát triển. `ActivityScenario.recreate()` kiểm tra recreation, không giết toàn bộ process. “Don’t keep activities” cũng không thay thế bài test mất process.

### Ma trận kiểm chứng

| Thao tác | Điều cần chứng minh |
| --- | --- |
| Rotation | Không mất input và không giữ View/Activity cũ |
| Navigate rồi pop back stack | View mới collect đúng owner, không nhân đôi callback |
| Background + am kill + mở task cũ | ViewModel mới dựng được màn hình từ state nhỏ và repository |
| Xóa task/mở phiên mới | Dữ liệu nghiệp vụ persist đúng theo yêu cầu; không mặc định giữ mọi UI state |
| Mất mạng lúc restore | Có loading/error/cache hợp lý, không crash vì object trong RAM đã mất |
| Server đổi hoặc xóa item đã chọn | Xử lý selection không còn hợp lệ |

**Bài tập:** tạo màn hình tìm kiếm, cố tình chỉ lưu danh sách trong ViewModel. Kiểm tra rotation trước, sau đó kiểm tra mất process. Sửa bằng query/ID + repository; giải thích vì sao dữ liệu hiển thị sau restore có thể khác snapshot trước khi app bị kill.

**Câu hỏi tự kiểm:** nếu process chết sau khi server thanh toán thành công, nguồn nào giúp app biết trạng thái giao dịch? Đối chiếu payment ID với backend; đừng chỉ dựa vào biến trong ViewModel.

[Quay lại bộ câu hỏi](../interview/android-questions.md) · [Luyện quiz](/quiz)
