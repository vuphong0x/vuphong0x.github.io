# MVVM vs MVI — So sánh toàn diện

Cả MVVM và MVI đều là kiến trúc **Presentation Layer** phổ biến trong Android. Hiểu rõ bản chất, ưu nhược điểm và khi nào dùng cái nào là yêu cầu bắt buộc của kỹ sư cấp Senior.

---

## 1. MVVM (Model — View — ViewModel)

### Luồng dữ liệu

```
┌──────────────────────────────────────────────────────┐
│                       VIEW                           │
│  (Activity / Fragment / Composable)                  │
│                                                      │
│  Gửi event lên:  viewModel.onLoginClicked()          │
│  Nhận state xuống: uiState.collect { render(it) }    │
└────────────────────┬─────────────────────────────────┘
                     │  Events ↑ / State ↓
┌────────────────────▼─────────────────────────────────┐
│                    VIEWMODEL                         │
│                                                      │
│  • Xử lý business logic của màn hình                 │
│  • Phát ra StateFlow<UiState>                        │
│  • Không biết gì về View                            │
└────────────────────┬─────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────┐
│                 MODEL / DATA LAYER                   │
│  (Repository → Room, Retrofit, DataStore)            │
└──────────────────────────────────────────────────────┘
```

### Cách implement chuẩn

```kotlin
// ── State ──────────────────────────────────────────
data class LoginUiState(
    val email: String = "",
    val password: String = "",
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val isLoggedIn: Boolean = false,
)

// ── ViewModel ──────────────────────────────────────
@HiltViewModel
class LoginViewModel @Inject constructor(
    private val loginUseCase: LoginUseCase,
) : ViewModel() {

    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    // One-shot events (navigation, snackbar)
    private val _events = MutableSharedFlow<LoginEvent>(extraBufferCapacity = 1)
    val events: SharedFlow<LoginEvent> = _events.asSharedFlow()

    fun onEmailChanged(email: String) {
        _uiState.update { it.copy(email = email) }
    }

    fun onPasswordChanged(password: String) {
        _uiState.update { it.copy(password = password) }
    }

    fun onLoginClicked() {
        val state = _uiState.value
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            loginUseCase(state.email, state.password)
                .onSuccess {
                    _events.emit(LoginEvent.NavigateToDashboard)
                }
                .onFailure { e ->
                    _uiState.update { it.copy(isLoading = false, errorMessage = e.message) }
                }
        }
    }
}

// ── View (Fragment) ────────────────────────────────
viewLifecycleOwner.lifecycleScope.launch {
    repeatOnLifecycle(Lifecycle.State.STARTED) {
        launch { viewModel.uiState.collect { render(it) } }
        launch { viewModel.events.collect { handleEvent(it) } }
    }
}
```

---

## 2. MVI (Model — View — Intent)

### Tư tưởng cốt lõi

MVI đưa pattern **Redux** (từ web) vào Android. Mọi thay đổi UI đều phải đi qua một **Reducer** duy nhất — hàm thuần túy (pure function) nhận State cũ + Intent → trả về State mới.

```
                     ┌─────────────┐
                     │    USER     │
                     └──────┬──────┘
                            │ action (click, swipe, input)
                            ▼
┌───────────────────────────────────────────────────────┐
│                        VIEW                           │
│  Render(state)                  Dispatch(intent)      │
└───────┬──────────────────────────────────┬────────────┘
        │ State ↓ (render)                 │ Intent ↑ (user action)
        │                                  │
┌───────▼──────────────────────────────────▼────────────┐
│                      VIEWMODEL                        │
│                                                       │
│  ┌────────────┐    ┌───────────────┐   ┌───────────┐  │
│  │   Intent   │───▶│    Reducer    │──▶│   State   │  │
│  │  (Action)  │    │ (pure func)   │   │(immutable)│  │
│  └────────────┘    └───────────────┘   └───────────┘  │
│                           │                           │
│                    ┌──────▼──────┐                    │
│                    │  Side Effect│                    │
│                    │(API call,   │                    │
│                    │ navigation) │                    │
│                    └─────────────┘                    │
└───────────────────────────────────────────────────────┘
```

### Cách implement chuẩn

```kotlin
// ── Intent (user action) ───────────────────────────
sealed class LoginIntent {
    data class EmailChanged(val email: String) : LoginIntent()
    data class PasswordChanged(val password: String) : LoginIntent()
    object LoginClicked : LoginIntent()
    object ErrorDismissed : LoginIntent()
}

// ── State (immutable, single source of truth) ──────
data class LoginState(
    val email: String = "",
    val password: String = "",
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
)

// ── Side Effect (one-shot event) ───────────────────
sealed class LoginEffect {
    object NavigateToDashboard : LoginEffect()
    data class ShowSnackbar(val message: String) : LoginEffect()
}

// ── ViewModel ──────────────────────────────────────
@HiltViewModel
class LoginViewModel @Inject constructor(
    private val loginUseCase: LoginUseCase,
) : ViewModel() {

    private val _state = MutableStateFlow(LoginState())
    val state: StateFlow<LoginState> = _state.asStateFlow()

    private val _effect = MutableSharedFlow<LoginEffect>(extraBufferCapacity = 1)
    val effect: SharedFlow<LoginEffect> = _effect.asSharedFlow()

    // Entry point duy nhất để xử lý mọi event từ UI
    fun dispatch(intent: LoginIntent) {
        _state.update { reduce(it, intent) }
        handleSideEffect(intent)
    }

    // Reducer: pure function, không có side effect
    private fun reduce(current: LoginState, intent: LoginIntent): LoginState {
        return when (intent) {
            is LoginIntent.EmailChanged    -> current.copy(email = intent.email)
            is LoginIntent.PasswordChanged -> current.copy(password = intent.password)
            is LoginIntent.LoginClicked    -> current.copy(isLoading = true, errorMessage = null)
            is LoginIntent.ErrorDismissed  -> current.copy(errorMessage = null)
        }
    }

    // Side Effects: API call, navigation — tách biệt hoàn toàn khỏi Reducer
    private fun handleSideEffect(intent: LoginIntent) {
        if (intent !is LoginIntent.LoginClicked) return
        viewModelScope.launch {
            loginUseCase(_state.value.email, _state.value.password)
                .onSuccess {
                    _state.update { it.copy(isLoading = false) }
                    _effect.emit(LoginEffect.NavigateToDashboard)
                }
                .onFailure { e ->
                    _state.update { it.copy(isLoading = false, errorMessage = e.message) }
                }
        }
    }
}

// ── View (Fragment) ────────────────────────────────
// Gửi intent
binding.btnLogin.setOnClickListener {
    viewModel.dispatch(LoginIntent.LoginClicked)
}
binding.etEmail.doOnTextChanged { text, _, _, _ ->
    viewModel.dispatch(LoginIntent.EmailChanged(text.toString()))
}

// Nhận state
viewLifecycleOwner.lifecycleScope.launch {
    repeatOnLifecycle(Lifecycle.State.STARTED) {
        launch { viewModel.state.collect { render(it) } }
        launch { viewModel.effect.collect { handleEffect(it) } }
    }
}
```

---

## 3. So sánh chi tiết

### Bảng so sánh tổng quan

| Tiêu chí | MVVM | MVI |
| :--- | :--- | :--- |
| **Entry point xử lý event** | Nhiều hàm riêng biệt trên ViewModel | Một hàm `dispatch(intent)` duy nhất |
| **State management** | Có thể phân tán (nhiều StateFlow) | Bắt buộc 1 `data class` duy nhất (immutable) |
| **Luồng dữ liệu** | Unidirectional nhưng không enforce nghiêm | Unidirectional được enforce bởi kiến trúc |
| **Debugging** | Khó trace khi có nhiều state riêng lẻ | Dễ trace: log sequence of Intent → State |
| **Predictability** | Trung bình | Cao — cùng Intent + State → luôn cho cùng kết quả |
| **Testability** | Tốt | Rất tốt — Reducer là pure function |
| **Boilerplate** | Thấp – Vừa | Cao hơn MVVM |
| **Learning curve** | Thấp — chuẩn Android chính thống | Cao hơn — cần hiểu Redux/Elm pattern |
| **Phù hợp với Compose** | Rất tốt | Rất tốt |
| **Google recommend** | ✅ Chính thức | Không chính thức, nhưng phổ biến |

---

### So sánh về State

**MVVM** — State có thể phân tán:
```kotlin
// Một số project MVVM không kỷ luật sẽ bị như này:
class ProductViewModel : ViewModel() {
    val products = MutableStateFlow<List<Product>>(emptyList())
    val isLoading = MutableStateFlow(false)
    val errorMessage = MutableStateFlow<String?>(null)
    val selectedCategory = MutableStateFlow<Category?>(null)
    // → Khó đồng bộ, dễ có inconsistent state
}
```

**MVI** — Bắt buộc single state object:
```kotlin
// MVI enforce: tất cả state gộp làm một
data class ProductState(
    val products: List<Product> = emptyList(),
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val selectedCategory: Category? = null,
    // → Impossible để có inconsistent state
)
```

---

### So sánh về Testability

**MVVM Test:**
```kotlin
@Test
fun `login success should update isLoggedIn state`() = runTest {
    // Arrange
    val viewModel = LoginViewModel(fakeLoginUseCase)
    val states = mutableListOf<LoginUiState>()
    val job = launch { viewModel.uiState.toList(states) }

    // Act
    viewModel.onLoginClicked()

    // Assert — phức tạp hơn vì phải handle multiple StateFlow
    assertTrue(states.last().isLoggedIn)
    job.cancel()
}
```

**MVI Test — Reducer là pure function, test cực đơn giản:**
```kotlin
@Test
fun `LoginClicked intent should set isLoading to true`() {
    val initialState = LoginState(email = "a@b.com", password = "123")

    // Reducer là pure function — test không cần coroutine, không cần mock
    val newState = reduce(initialState, LoginIntent.LoginClicked)

    assertTrue(newState.isLoading)
    assertNull(newState.errorMessage)
}

@Test
fun `EmailChanged intent should update email`() {
    val newState = reduce(LoginState(), LoginIntent.EmailChanged("user@gmail.com"))
    assertEquals("user@gmail.com", newState.email)
}
```

---

## 4. Ưu điểm & Nhược điểm

### MVVM

**✅ Ưu điểm:**
- **Ít boilerplate:** Không cần định nghĩa sealed class Intent cho mỗi action nhỏ
- **Được Google chính thức recommend** — tích hợp tốt với Jetpack (ViewModel, LiveData, Hilt)
- **Learning curve thấp** — dễ onboard thành viên mới
- **Đủ tốt cho hầu hết ứng dụng** — không over-engineer cho app đơn giản

**❌ Nhược điểm:**
- **Không enforce Unidirectional Flow** — developer không kỷ luật có thể update state từ nhiều nơi, gây inconsistent state
- **State có thể phân tán** — khó track toàn bộ UI state tại một thời điểm
- **Debugging khó hơn** — khi bug xảy ra, khó biết chuỗi thay đổi state là gì

---

### MVI

**✅ Ưu điểm:**
- **Predictable hoàn toàn** — `(State, Intent) → State` là deterministic
- **Single source of truth bắt buộc** — không thể có inconsistent state
- **Time-travel debugging** — có thể replay lại sequence Intent để tái hiện bug
- **Testability cao nhất** — Reducer là pure function, test không cần mock complex
- **Tách biệt rõ ràng** — Intent (user action) / Reducer (pure logic) / Side Effect (IO, navigation)

**❌ Nhược điểm:**
- **Boilerplate nhiều** — mỗi màn hình cần sealed class Intent, State, Effect
- **Learning curve cao hơn** — cần hiểu Redux/Elm architecture
- **Over-engineer** cho màn hình đơn giản (ví dụ: chỉ hiển thị thông tin, không có interaction phức tạp)
- **State copy overhead** — mỗi thay đổi nhỏ tạo object State mới (immutable copy)

---

## 5. Khi nào dùng cái nào?

### Dùng MVVM khi:

```
✔ App có quy mô nhỏ đến trung bình
✔ Team nhỏ, cần onboard nhanh
✔ Màn hình không có quá nhiều trạng thái phức tạp
✔ Deadline gấp, không có thời gian setup MVI framework
✔ Tích hợp với codebase Android chuẩn (Google Architecture Samples)
```

**Ví dụ thực tế phù hợp MVVM:**
- Màn hình Profile — hiển thị và edit thông tin user
- Màn hình Settings — danh sách toggle đơn giản
- Màn hình chi tiết sản phẩm — fetch data và display

---

### Dùng MVI khi:

```
✔ Màn hình có nhiều state phức tạp, nhiều trạng thái đồng thời
✔ Cần debug và reproduce bug production dễ dàng
✔ Team có kinh nghiệm, chấp nhận boilerplate
✔ Yêu cầu test coverage cao (tài chính, y tế)
✔ Màn hình có nhiều user interaction xảy ra đồng thời
```

**Ví dụ thực tế phù hợp MVI:**
- Màn hình thanh toán (Payment) — nhiều step, validate phức tạp
- Màn hình Chat realtime — nhiều event song song (typing, receive, send, error)
- Màn hình Dashboard phức tạp — filter, sort, search, pagination cùng lúc
- Màn hình Form nhiều bước (multi-step wizard)

---

## 6. Hybrid Approach — Thực tế được dùng nhiều nhất

Trong thực tế, phần lớn team Senior không chọn hoàn toàn một trong hai, mà dùng **MVVM với State được tổ chức theo tinh thần MVI**:

```kotlin
// ─── Tinh thần MVI trong MVVM ─────────────────────
// Giữ structure gọn hơn pure MVI nhưng predictable hơn plain MVVM

@HiltViewModel
class CheckoutViewModel @Inject constructor(
    private val placeOrderUseCase: PlaceOrderUseCase,
) : ViewModel() {

    // Single immutable state — học từ MVI
    private val _state = MutableStateFlow(CheckoutState())
    val state: StateFlow<CheckoutState> = _state.asStateFlow()

    // One-shot effects — tách biệt khỏi state
    private val _effect = Channel<CheckoutEffect>(Channel.BUFFERED)
    val effect = _effect.receiveAsFlow()

    // Public API — linh hoạt như MVVM, không cần sealed class
    fun selectAddress(address: Address) {
        _state.update { it.copy(selectedAddress = address) }
    }

    fun onPlaceOrderClicked() {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true) }
            placeOrderUseCase(_state.value)
                .onSuccess { orderId ->
                    _state.update { it.copy(isLoading = false) }
                    _effect.send(CheckoutEffect.NavigateToOrderConfirm(orderId))
                }
                .onFailure { e ->
                    _state.update { it.copy(isLoading = false, error = e.message) }
                }
        }
    }
}

data class CheckoutState(
    val selectedAddress: Address? = null,
    val selectedPayment: PaymentMethod? = null,
    val cartItems: List<CartItem> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
)

sealed class CheckoutEffect {
    data class NavigateToOrderConfirm(val orderId: String) : CheckoutEffect()
    object ShowPaymentFailed : CheckoutEffect()
}
```

---

## 7. Câu hỏi phỏng vấn Senior

**Q: Tại sao MVI enforce immutable State lại quan trọng?**

**Trả lời:** Immutable State đảm bảo:
1. **Thread-safety:** StateFlow chỉ accept value assign từ main thread, không thể có race condition khi nhiều coroutine đọc State
2. **Predictability:** State tại mọi thời điểm là snapshot hoàn chỉnh — không bị partial update
3. **Easy diffing:** Compose và RecyclerView DiffUtil so sánh object equality hiệu quả hơn
4. **Time-travel debug:** Có thể lưu lại sequence State để replay bug

---

**Q: MVI Reducer phải là pure function — điều này có nghĩa gì và tại sao quan trọng?**

**Trả lời:** Pure function là hàm:
- **Deterministic:** Cùng input (State + Intent) luôn cho cùng output (State mới)
- **Không có side effect:** Không gọi API, không emit Flow, không log, không đọc system time

Quan trọng vì:
- **Unit test không cần mock** — chỉ gọi `reduce(state, intent)` và assert kết quả
- **Thread-safe** — có thể gọi từ bất kỳ thread nào
- **Reproducible** — dễ viết snapshot test

```kotlin
// Test Reducer = 3 dòng, không cần mock, không cần coroutine
@Test
fun `reduce LoginClicked sets isLoading true`() {
    val result = reduce(LoginState(), LoginIntent.LoginClicked)
    assertTrue(result.isLoading)
}
```

---

**Q: Trong MVI, Side Effects nên được xử lý ở đâu và tại sao?**

**Trả lời:** Side effects (API call, navigation, show dialog) phải **tách biệt hoàn toàn khỏi Reducer**. Thực hiện trong ViewModel sau khi Reducer đã tính State mới:

```kotlin
fun dispatch(intent: LoginIntent) {
    // 1. Reducer chạy trước — pure, synchronous
    _state.update { reduce(it, intent) }

    // 2. Side effect xử lý sau — có thể async, có thể fail
    if (intent is LoginIntent.LoginClicked) {
        triggerLoginApiCall()
    }
}
```

Tại sao tách biệt:
- Giữ Reducer thuần túy, dễ test
- Side effect có thể fail, retry — không muốn nó làm phức tạp Reducer
- Side effect có thể trigger từ nhiều Intent khác nhau — tách biệt giúp reuse

---

**Q: Một số team dùng `Channel<Effect>` thay vì `SharedFlow` cho side effects — khi nào nên dùng cái nào?**

**Trả lời:**

| | `Channel` | `SharedFlow(replay=0)` |
|---|---|---|
| **Delivery guarantee** | Đảm bảo effect được consume (buffered) | Có thể drop nếu không có collector |
| **Multiple collectors** | Chỉ 1 collector nhận mỗi event | Mọi collector đều nhận |
| **Khi UI không active** | Buffer, deliver khi UI active lại | Drop event |
| **Phù hợp** | Navigation, show dialog (phải execute đúng 1 lần) | Broadcast event (toast cho nhiều component) |

Trong thực tế: dùng `Channel(BUFFERED)` cho **one-shot effects** (navigation, snackbar), dùng `SharedFlow` khi nhiều component cần observe cùng event stream.
