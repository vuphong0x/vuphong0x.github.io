# Model-View-ViewModel (MVVM)

MVVM is the officially recommended architecture for Android. It robustly separates the user interface logic from the business logic.

## Core Components

### 1. View (Activity/Fragment/Composable)
- Responsible exclusively for displaying data on the screen and routing user events.
- Has no business logic.
- Observes the ViewModel (via `StateFlow` or `LiveData`) to update the UI.

### 2. ViewModel
- Transforms domain data into UI states.
- Contains business logic specific to that screen.
- Crucially, it **survives configuration changes** (like screen rotations) meaning data doesn't have to be refetched.
- Has no reference to the View (`Context`, `Activity`, `View`). Passing these into a ViewModel creates massive memory leaks.

### 3. Model (Data/Domain Layer)
- Defines where data comes from (Database, Network API) via Repositories.
- Abstracted away from the ViewModel. 

## Unidirectional Data Flow (UDF)
The core pattern within modern MVVM in Android.
- **State flows down:** ViewModel exposes an immutable `StateFlow<UiState>`. The View observes it.
- **Events flow up:** View calls public methods on the ViewModel (e.g., `viewModel.onLoginClicked()`).

## Example (Modern Approach)

```kotlin
// 1. Define State
data class LoginState(val isLoading: Boolean = false, val error: String? = null)

// 2. ViewModel
class LoginViewModel(private val repository: LoginRepository) : ViewModel() {
    private val _uiState = MutableStateFlow(LoginState())
    val uiState: StateFlow<LoginState> = _uiState.asStateFlow()

    fun login() {
        _uiState.update { it.copy(isLoading = true) }
        viewModelScope.launch {
            try {
                repository.doLogin()
                // Navigate to home (via SharedFlow event or state update)
            } catch(e: Exception) {
                _uiState.update { it.copy(isLoading = false, error = e.message) }
            }
        }
    }
}
```

## Difference from MVC and MVP
- **MVC (Model-View-Controller):** The Controller heavily manipulates the View. Hard to test.
- **MVP (Model-View-Presenter):** The Presenter holds an interface to the View and calls methods like `view.showLoading()`. Tight coupling makes it harder to scale than MVVM.
- **MVVM:** View observes ViewModel. ViewModel knows absolutely nothing about the View. Perfect for reactive frameworks like Compose.

## Interview Questions

**Q: How does a ViewModel survive screen rotations?**
*Answer:* The `ViewModelStoreOwner` (usually the Activity or Fragment) retains the ViewModel instance during configuration changes. While the Activity is destroyed and recreated, the system keeps the `ViewModelStore` alive in memory and attaches it to the new Activity instance.

**Q: Can a ViewModel hold a reference to a `Context`?**
*Answer:* No. Holding an Activity Context inside a ViewModel causes an immediate memory leak, because the ViewModel outlives the Activity. If an application context is absolutely needed, you should extend `AndroidViewModel(application)`, but it's broadly recommended to pass dependencies containing Context directly to the classes that need them instead of injecting Context into ViewModels.
