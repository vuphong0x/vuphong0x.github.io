---
title: MVVM và screen state có thể kiểm chứng
---

# MVVM: phân quyền sở hữu state cho màn hình

Trong mô hình MVVM thường dùng trên Android, UI render state và chuyển action tới ViewModel; ViewModel phối hợp dữ liệu để tạo screen state. MVVM không quy định mọi logic đều phải nằm trong ViewModel hoặc mọi UI chỉ được có một Flow. Quan trọng là source of truth và lifetime rõ ràng.

## 1. State cho một thao tác đăng nhập

```kotlin
sealed interface LoginState {
    data object Editing : LoginState
    data object Loading : LoginState
    data object Authenticated : LoginState
    data class Rejected(val reason: String) : LoginState
}

class LoginViewModel(private val sessions: Sessions) : ViewModel() {
    private val _state = MutableStateFlow<LoginState>(LoginState.Editing)
    val state: StateFlow<LoginState> = _state.asStateFlow()

    // UI gọi trên main thread.
    fun login(credentials: Credentials) {
        if (_state.value == LoginState.Loading) return
        _state.value = LoginState.Loading
        viewModelScope.launch {
            try {
                _state.value = when (val result = sessions.login(credentials)) {
                    SignIn.Accepted -> LoginState.Authenticated
                    is SignIn.Rejected -> LoginState.Rejected(result.reason)
                }
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (error: IOException) {
                _state.value = LoginState.Rejected("Chưa thể kết nối")
            }
        }
    }
}
```

`Sessions`, Credentials và SignIn là contract do app định nghĩa; login phải main-safe và xử lý session persistence theo yêu cầu. Đây là ví dụ transition, không phải authentication SDK hoàn chỉnh. Chuỗi UI cần localization khi tích hợp. Không đưa credential vào saved state/log chỉ để thuận tiện.

Set Loading trước launch giúp các action đồng bộ liên tiếp trên main thread thấy thao tác đang chạy. Nếu caller có thể gọi từ nhiều thread, guard này không còn là cơ chế đồng bộ đủ; contract phải cấm hoặc serialize action đúng cách.

## 2. ViewModel không phải nơi giữ View {#lifetime}

ViewModel có thể sống qua configuration change và bị clear theo owner. Nó không sống qua process death. Không giữ Activity/binding để render sau request; expose state và để UI hiện tại collect theo lifecycle.

Application Context không có cùng vấn đề lifetime với Activity Context, nhưng không vì thế mọi ViewModel nên nhận Context. Inject abstraction cần thiết như repository/resource policy ở đúng tầng. Context không mặc nhiên gây leak; leak xuất hiện khi reference sống quá lifetime đối tượng được giữ.

## 3. Kết quả, navigation và error

Authenticated là state của ví dụ; nếu UI điều hướng theo nó thì cần kiểm soát destination/back stack khi collect lại. Không phát event qua SharedFlow(replay=0) rồi mặc định kết quả quan trọng sẽ đến UI sau background.

Cancellation của request phải lan theo scope; thông báo lỗi network chỉ dành cho lỗi mạng dự kiến. Một catch(Exception) không phân biệt cancellation có thể làm màn hình báo lỗi khi user đã rời đi. Lỗi lập trình/protocol cần boundary xử lý và quan sát riêng.

## 4. Test những gì?

Test Editing → Loading → Authenticated/Rejected, chống submit trùng theo contract, lỗi I/O, cancellation và session đổi trong lúc request. Fake Sessions có thể trì hoãn kết quả để assert Loading, không chỉ trả response ngay và assert state cuối.

Tách presentation test khỏi integration test xác thực HTTP/credential storage. Một ViewModel test xanh không chứng minh login an toàn trên thiết bị thật.

Nguồn: [Architecture recommendations](https://developer.android.com/topic/architecture/recommendations), [ViewModel](https://developer.android.com/topic/libraries/architecture/viewmodel).

Đọc sâu: [UDF và event delivery](./ui-state-events.md), [MVVM/MVI](./mvvm-vs-mvi.md), [test strategy](../testing/test-strategy.md), [security](../security/security-model.md).
