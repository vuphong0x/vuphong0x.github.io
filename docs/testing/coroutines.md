---
title: Test Coroutines & StateFlow
---

# Test Coroutines và StateFlow

Test nên kiểm tra hành vi người dùng/contract: state cuối đúng, cancellation được giữ, retry không tạo side effect trùng. Tránh dùng `Thread.sleep()` để chờ một lịch chạy không kiểm soát được.

## Virtual time và dispatcher {#virtual-time}

`runTest` kiểm soát virtual time qua `TestCoroutineScheduler`. Công việc chạy trên IO/Default thật không tự tham gia scheduler này. Inject dispatcher; các TestDispatcher phối hợp cần dùng chung scheduler.

```kotlin
class DelayedGreeting(private val dispatcher: CoroutineDispatcher) {
    suspend fun load(): String = withContext(dispatcher) {
        delay(1_000)
        "Hello"
    }
}

@OptIn(ExperimentalCoroutinesApi::class)
class DelayedGreetingTest {
    @Test
    fun returnsGreeting() = runTest {
        val loader = DelayedGreeting(StandardTestDispatcher(testScheduler))
        assertEquals("Hello", loader.load())
    }
}
```

`runCurrent()` chạy công việc sẵn sàng tại thời điểm hiện tại; `advanceTimeBy()` tiến virtual time; `advanceUntilIdle()` chạy đến khi không còn công việc được scheduler theo dõi. Khi code dùng `viewModelScope`, thay Main bằng test dispatcher và luôn reset trong cleanup.

Nguồn: [Testing Kotlin coroutines](https://developer.android.com/kotlin/coroutines/test).

## stateIn và subscriber {#stateflow-test}

StateFlow có conflation; không mặc định mọi collector sẽ thấy mọi state trung gian. Assert state tại thời điểm phù hợp. Với `stateIn(WhileSubscribed)`, cần collector để upstream bắt đầu, dù test chỉ đọc `.value`.

```kotlin
@OptIn(ExperimentalCoroutinesApi::class)
@Test
fun sharesLatestValue() = runTest {
    val source = MutableStateFlow(0)
    val state = source.stateIn(
        backgroundScope,
        SharingStarted.WhileSubscribed(5_000),
        -1,
    )
    backgroundScope.launch(UnconfinedTestDispatcher(testScheduler)) {
        state.collect {}
    }
    runCurrent()
    source.value = 42
    runCurrent()
    assertEquals(42, state.value)
}
```

`backgroundScope` được hủy khi test kết thúc, tránh chờ collector vô hạn. Trong test ViewModel, dùng fake repository phát dữ liệu kiểm soát được và kết thúc scope do test sở hữu.

Nguồn: [Testing Kotlin flows](https://developer.android.com/kotlin/flow/test).

## Test failure case có ý nghĩa

| Trường hợp | Điều cần chứng minh |
| --- | --- |
| Parent bị cancel | Child kết thúc; không biến cancellation thành lỗi network |
| Một request độc lập fail | Request khác vẫn trả kết quả nếu contract cho phép |
| Timeout sau remote commit | Retry cùng ID không tạo dữ liệu trùng |
| Room upgrade | Schema và dữ liệu cũ đúng sau migration |
| UI bị recreate/mất process | Khôi phục đúng từ ID và dữ liệu persist |

[State recovery](../android-core/state-recovery.md#verify-restoration) · [Offline-first](../data/offline-first.md) · [Quiz](/quiz)
