---
title: Unit test, scheduler và state transition
---

# Unit test có contract và lịch chạy rõ ràng

Local JVM tests phù hợp pure logic/state transformation không cần thiết bị. Khi code phụ thuộc Android API hoặc lifecycle, cần fake/abstraction, môi trường hỗ trợ hoặc instrumented test đúng boundary. Chọn runner JUnit theo toolchain/source set được hỗ trợ; không coi số phiên bản mới hơn tự giải quyết integration.

## 1. Arrange, Act, Assert

Arrange chuẩn bị input và dependency có thể kiểm soát; Act thực hiện hành động; Assert kiểm tra behavior theo contract. Đừng chỉ assert object không null sau khi chạy code. Chọn boundary case: rỗng, duplicate, lỗi dự kiến, cancellation và thứ tự cập nhật khi chúng ảnh hưởng sản phẩm.

## 2. Ví dụ ViewModel dùng Main dispatcher trong JVM test

Ví dụ sau dùng JUnit4, `androidx.lifecycle` và `kotlinx-coroutines-test`. Main không có Android Looper trong JVM test, nên rule cài TestDispatcher và reset sau test.

```kotlin
@OptIn(ExperimentalCoroutinesApi::class)
class MainDispatcherRule(
    val dispatcher: TestDispatcher = StandardTestDispatcher(),
) : TestWatcher() {
    override fun starting(description: Description) {
        Dispatchers.setMain(dispatcher)
    }
    override fun finished(description: Description) {
        Dispatchers.resetMain()
    }
}

class CounterViewModel : ViewModel() {
    private val _count = MutableStateFlow(0)
    val count = _count.asStateFlow()

    fun incrementLater() {
        viewModelScope.launch {
            delay(1_000)
            _count.value += 1
        }
    }
}

@OptIn(ExperimentalCoroutinesApi::class)
class CounterViewModelTest {
    @get:Rule val main = MainDispatcherRule()

    @Test
    fun incrementsAfterDelay() = runTest(main.dispatcher) {
        val viewModel = CounterViewModel()
        viewModel.incrementLater()
        assertEquals(0, viewModel.count.value)
        advanceUntilIdle()
        assertEquals(1, viewModel.count.value)
    }
}
```

Imports cần lấy từ JUnit, JUnit rules/runner và kotlinx.coroutines tương ứng. Không có infinite collector trong ví dụ; với ViewModel có job dài phải kết thúc owner/scope do test tạo. Test dùng cùng dispatcher/scheduler, không đo thời gian thật bằng sleep.

## 3. runTest không điều khiển mọi thời gian

Delay trong code chạy trên TestDispatcher dùng cùng scheduler có thể được tiến bằng virtual time. Code hardcode IO/Default thật hoặc gọi clock/network thật không tự chuyển sang scheduler đó. `advanceUntilIdle()` không phải “đợi toàn bộ ứng dụng xong” cho mọi nguồn async.

Với stateIn(WhileSubscribed), cần subscriber để upstream bắt đầu. Nếu contract cần xác nhận Loading trung gian, fake nên cho phép giữ request chưa hoàn tất; assert state cuối quá sớm có thể bỏ sót lỗi transition.

## 4. Test behavior thay vì cấu trúc nội bộ

Pure reducer nên test input/state/output. Repository integration nên kiểm tra mapping/error/cache contract. Mock interaction chỉ khi interaction là điều cần bảo vệ; đổi implementation mà behavior giữ nguyên không nên phá hàng chục test không cần thiết.

Test pass không chứng minh mọi scenario ngoài phạm vi. Ghi rõ fixture/assumption, ví dụ currency unit, timezone, session identity và thiết bị/runtime khi chúng ảnh hưởng kết quả.

Nguồn: [Local tests](https://developer.android.com/training/testing/local-tests), [Testing coroutines](https://developer.android.com/kotlin/coroutines/test).

Đọc tiếp: [Flow testing](./coroutines.md), [test strategy](./test-strategy.md), [UI testing](./ui-testing.md).
