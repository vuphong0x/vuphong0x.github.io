---
title: Flow, sharing và lifecycle
sidebar_position: 11
---

# Flow: ai tạo dữ liệu, ai collect và ai chịu mất giá trị?

Bài này nối các câu hỏi cold/hot Flow, `stateIn`, `repeatOnLifecycle`, `conflate` và UI event. Một pipeline có thể hợp lệ về syntax nhưng vẫn gọi API trùng, chạy sensor khi màn hình tắt hoặc làm mất kết quả quan trọng.

Kiến thức trước: [Coroutines](./coroutines.md), [structured concurrency](./structured-concurrency.md).

## 1. Cold Flow và việc chạy lại producer {#cold-hot}

```kotlin
fun observeReading(): Flow<Int> = flow {
    println("producer started")
    emit(readSensorOnce())
}
```

Đây là ví dụ minh họa; `readSensorOnce()` đại diện một hàm suspend của ứng dụng. Hai lần `collect` tạo hai lần chạy block `flow`. Nếu block gọi network hoặc đăng ký sensor, nhiều collector có thể đồng nghĩa nhiều tác vụ bên ngoài.

Hot flow chia sẻ đối tượng luồng giữa các subscriber. Điều đó không có nghĩa phải có producer chạy vĩnh viễn: `stateIn` và `shareIn` có chính sách bắt đầu/dừng riêng. Xác định **scope sở hữu producer**, không chỉ tên type.

## 2. Chọn theo contract dữ liệu

| Công cụ | Contract hữu ích | Không tự bảo đảm |
| --- | --- | --- |
| Cold Flow | Mỗi collection chạy logic nguồn | Chia sẻ request giữa collector |
| StateFlow | State hiện tại, có initial value, equality conflation | Mọi state trung gian đều được nhìn thấy |
| SharedFlow | Broadcast, replay và buffer cấu hình được | Subscriber tương lai nhận mọi event |
| Channel | Queue/fan-out theo cách tiêu thụ được chọn | Side effect xử lý exactly-once qua cancellation/process death |
| Room + outbox | Dữ liệu/thao tác cần phục hồi lâu dài | Remote commit atomic cùng local transaction |

Nếu số dư từ 100 → 90 → 80 rất nhanh, UI có thể chỉ cần thấy state cuối 80. Nhưng nếu ba giá trị đại diện ba lệnh nghiệp vụ phải xử lý riêng, dùng StateFlow để vận chuyển chúng là sai contract.

## 3. stateIn và WhileSubscribed {#sharing}

```kotlin
val uiState: StateFlow<ScreenState> = repository.observeItems()
    .map<List<Item>, ScreenState> { ScreenState.Content(it) }
    .stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = ScreenState.Loading,
    )
```

Các type `Item`, `ScreenState` và repository là type của app. Ví dụ bỏ qua error mapping để tập trung vào sharing; ở app thực tế cần xác định state lỗi và retry.

Khi subscriber cuối rời đi, upstream chưa nhất thiết dừng ngay: policy trên chờ 5 giây. Nếu subscriber mới tới trong khoảng đó, tránh một lần stop/start không cần thiết. Sau timeout, upstream dừng; **giá trị state đã cache mặc định vẫn còn**. Stop timeout và replay expiration là hai tham số khác nhau.

Khi subscriber quay lại, có thể thấy cache trước rồi nhận dữ liệu mới. Vì vậy, nếu yêu cầu phân biệt cache cũ/đang refresh, state phải biểu diễn điều đó. Đừng suy ra `Loading` luôn được phát lại mỗi khi mở màn hình.

Nguồn: [stateIn](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/state-in.html), [WhileSubscribed](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/-sharing-started/-companion/-while-subscribed.html).

## 4. Lifecycle của collector và producer khác nhau {#collection}

Trong Fragment, đăng ký ở `onViewCreated()`:

```kotlin
viewLifecycleOwner.lifecycleScope.launch {
    viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
        launch { viewModel.uiState.collect(::render) }
        launch { viewModel.progress.collect(::renderProgress) }
    }
}
```

Hai `collect` vô hạn phải có hai coroutine con; viết nối tiếp khiến collector thứ hai không bao giờ bắt đầu. `render` chỉ truy cập binding của View hiện tại.

Khi dưới STARTED, block bị cancel. Producer hot trong scope khác chỉ dừng nếu chính sách của nó dẫn đến việc dừng. Nếu một collector khác còn active, `WhileSubscribed` vẫn có subscriber. Đây là lý do “UI lifecycle-safe” không đồng nghĩa “không còn background work”.

Với Compose trên Android, collect UI state bằng `collectAsStateWithLifecycle()`. Composition lifetime và Activity lifecycle là hai khái niệm liên quan nhưng không trùng nhau.

Nguồn: [Lifecycle-aware coroutines](https://developer.android.com/topic/libraries/architecture/coroutines).

## 5. Buffer và lựa chọn giá trị bị bỏ {#backpressure}

Giả sử producer phát nhanh hơn consumer:

- `buffer()` cho producer đi trước trong giới hạn buffer; khi đầy, hành vi phụ thuộc cấu hình overflow.
- `conflate()` giữ giá trị mới hơn khi consumer chưa theo kịp, bỏ giá trị trung gian.
- `collectLatest()` hủy block xử lý giá trị trước khi giá trị mới tới. Nó không rollback side effect đã thực hiện ở server.
- Với search, `debounce` giảm lượng query được phát; `flatMapLatest` chuyển sang nguồn kết quả mới nhất. API và logic mapping vẫn phải hợp tác cancellation.

Ví dụ progress upload có thể bỏ 31%, 32% và hiển thị 33%. Lệnh “gửi tin nhắn A”, “gửi B”, “gửi C” không được tự ý conflated thành chỉ C. Nếu thao tác không thể mất, persistence và acknowledgment phải được thiết kế trước tối ưu buffer.

Nguồn operator: [Flow guide](https://kotlinlang.org/docs/flow.html).

## 6. SharedFlow không có subscriber {#event-delivery}

`MutableSharedFlow<Event>(replay = 0, extraBufferCapacity = 1)` có thể hữu ích cho broadcast tạm thời. Tuy nhiên, extra buffer dành cho subscriber đang theo dõi nhưng chậm, không phải kho lưu event cho subscriber chưa xuất hiện. Khi không còn subscriber, replay mới quyết định phần dữ liệu được giữ.

Tăng replay lên 1 tránh một kiểu mất event nhưng có thể phát lại navigation sau recreation. Cần xác định kết quả nào là state hiện tại, event nào có thể mất và hiệu ứng nào cần xác nhận xử lý; xem [UI state/event](../../architecture/ui-state-events.md).

Nguồn: [SharedFlow replay và buffering](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/-shared-flow/).

## 7. Bài thực hành

Tạo fake upstream đếm số lần start và chạy `awaitCancellation()` trong `try/finally` để đếm stop. Viết test cho một subscriber, hai subscriber, subscriber cuối bị hủy và subscriber quay lại trước/sau timeout.

Với virtual time, kiểm tra cả ranh giới timeout và công việc được lên lịch đúng tại ranh giới đó; `advanceTimeBy()` có thể cần `runCurrent()` để chạy công việc tại thời điểm đích. Đừng chỉ đọc `.value` rồi kết luận `WhileSubscribed` đã chạy upstream.

**Câu hỏi tự kiểm:** nếu UI STOPPED nhưng một logger vẫn collect cùng stateIn, upstream có dừng sau 5 giây không? **Không**, vì vẫn còn subscriber; cần kiểm tra logger có thực sự nên sở hữu collection đó hay không.

Đọc tiếp: [test StateFlow](../../testing/coroutines.md#stateflow-test), [Context và listener](../../android-core/context-memory.md#listener-cleanup), [state recovery](../../android-core/state-recovery.md). [Quiz](/quiz).
