# Activity & Fragment - Kiến thức cốt lõi & Câu hỏi phỏng vấn Senior

`Activity` và `Fragment` là hai thành phần giao diện nền tảng trong hệ sinh thái Android. Đối với kỹ sư cấp độ **Senior / Lead**, việc nắm vững không chỉ dừng lại ở các hàm lifecycle cơ bản mà phải hiểu rõ **bản chất kiến trúc ngầm (under the hood)**, cơ chế quản lý bộ nhớ, State Restoration, Transaction Pipeline của `FragmentManager`, và các edge-cases thực tế khi tối ưu ứng dụng quy mô lớn.

---

## 1. Bản chất kiến trúc của Activity & Fragment

### 1.1 Activity Under the Hood
Một `Activity` không trực tiếp vẽ các View lên màn hình, mà nó hoạt động như một bộ điều phối (orchestrator) và là điểm kết nối giữa ứng dụng với hệ điều hành Android (`ActivityTaskManagerService` - ATMS và `WindowManagerService` - WMS).

```
+-------------------------------------------------------------+
|                         Activity                            |
|  +-------------------------------------------------------+  |
|  |             PhoneWindow (Kế thừa Window)              |  |
|  |  +-------------------------------------------------+  |  |
|  |  |              DecorView (FrameLayout)            |  |  |
|  |  |  +---------------------+  +------------------+  |  |  |
|  |  |  |   Action Bar/Title  |  | Content (R.id.content)   |  |
|  |  |  +---------------------+  |  (Layout của bạn)|  |  |  |
|  |  |                           +------------------+  |  |  |
|  |  +-------------------------------------------------+  |  |
|  +-------------------------------------------------------+  |
+-------------------------------------------------------------+
                               |
                        ViewRootImpl
                               |
                  WindowManagerService (WMS)
                               |
                          SurfaceFlinger
```

- **`Window` / `PhoneWindow`**: Đại diện cho một cửa sổ hiển thị cấp cao nhất. `PhoneWindow` là implementation duy nhất của `Window` trong Android UI framework.
- **`DecorView`**: Là root View thực sự (kế thừa từ `FrameLayout`). Nó chứa `status_bar`, `navigation_bar`, `action_bar` và một ViewGroup đặc biệt có id `android.R.id.content`.
- **`setContentView(layoutResID)`**: Khi gọi hàm này, layout XML của bạn được `LayoutInflater` chuyển đổi thành cây View và gắn trực tiếp vào `android.R.id.content`.
- **`ViewRootImpl`**: Cầu nối giữa Window Manager và hệ thống View hierarchy, chịu trách nhiệm xử lý các phase: `Measure` -> `Layout` -> `Draw` và chuyển giao input events từ hardware đến View.

---

### 1.2 Fragment Under the Hood
`Fragment` không phải là một `Context` (khác với Activity). Bản chất Fragment là một **Controller** quản lý một cây View con độc lập và có vòng đời phụ thuộc vào Activity chứa nó.

- **Cơ chế đính kèm**: Fragment được gắn vào một `ViewGroup` container bên trong Activity thông qua `FragmentManager`.
- **Phân tách Lifecycle**: Fragment có **hai vòng đời tách biệt**:
  1. *Fragment Instance Lifecycle* (bắt đầu từ `onAttach` đến `onDetach`).
  2. *Fragment View Lifecycle* (bắt đầu từ `onCreateView` đến `onDestroyView`).

---

### 1.3 Single-Activity vs. Multi-Activity Architecture

| Tiêu chí | Single-Activity Architecture (Modern) | Multi-Activity Architecture (Legacy) |
| :--- | :--- | :--- |
| **Cơ chế chuyển màn** | Swap Fragment / Composable trong cùng 1 Window | Hệ thống tạo Window mới, gọi qua IPC tới ATMS/WMS |
| **Chi phí tài nguyên (Overhead)** | Rất nhẹ, tái sử dụng cùng Window & Process resources | Tốn RAM và CPU do mỗi Activity có Window, DecorView, ViewRootImpl riêng |
| **Chia sẻ dữ liệu** | Đơn giản via Activity-scoped / NavGraph-scoped ViewModel | Phải serialize qua Intent/Bundle (giới hạn ~1MB TransactionTooLargeException) |
| **Animation & Transitions** | Mượt mà (Shared Element, Fragment Transition, Compose Animation) | Phụ thuộc Window Transition của OS, khó custom phức tạp |
| **Deep Link & Back Stack** | Dễ dàng quản lý tập trung qua Jetpack Navigation | Phức tạp khi phục hồi Task stack với nhiều Launch Mode |

---

## 2. Vòng đời chuyên sâu & Cơ chế phục hồi trạng thái (Lifecycle & State Restoration)

### 2.1 Thứ tự Lifecycle khi chuyển màn hình

#### Kịch bản 1: Mở Activity B từ Activity A
1. `A.onPause()` *(A chuẩn bị nhường foreground, chưa dừng hoàn toàn)*
2. `B.onCreate()` -> `B.onStart()` -> `B.onResume()` *(B hiển thị và sẵn sàng tương tác)*
3. `A.onStop()` *(Chỉ khi B đã hoàn thành vẽ frame đầu tiên và che khuất hoàn toàn A, A mới chuyển sang onStop)*

> **Lưu ý quan trọng:** Không thực hiện các tác vụ nặng (như lưu DB, serialize data lớn) trong `onPause()` vì nó trực tiếp làm chậm thời gian mở màn hình tiếp theo (gây app freeze/jank).

#### Kịch bản 2: Activity B là dạng Dialog/Translucent đè lên Activity A
- `A.onPause()` -> `B.onCreate()` -> `B.onStart()` -> `B.onResume()`
- **A KHÔNG gọi `onStop()`** vì A vẫn còn một phần hiển thị cho người dùng thấy phía sau Dialog/Translucent Window.

---

### 2.2 Fragment Lifecycle: Hai vòng đời riêng biệt

```
Fragment Instance:  [onAttach] -> [onCreate] -----------------------------------------------------> [onDestroy] -> [onDetach]
                                      |                                                                   ^
Fragment View:                        +--> [onCreateView] -> [onViewCreated] -> [onDestroyView] ----------+
                                                ^                                      |
                                                +-------- (Back Stack Pop/Recreate) ---+
```

- **Tại sao cần 2 vòng đời?** Khi một Fragment được đưa vào **Back Stack** (ví dụ qua `addToBackStack`):
  - View của nó bị hủy (`onDestroyView()`) để giải phóng tài nguyên bộ nhớ UI.
  - Instance của Fragment vẫn còn sống trong bộ nhớ để lưu giữ trạng thái logic.
  - Khi user nhấn Back quay lại, `onCreateView()` và `onViewCreated()` được gọi lại, tạo mới cây View mà không gọi lại `onCreate()`.

---

### 2.3 Configuration Change vs. Process Death

```
                   +-------------------------------------------------------+
                   |                 Sự kiện làm mất UI                   |
                   +-------------------------------------------------------+
                                   /                       \
                                  /                         \
      [Configuration Change (Xoay màn hình)]    [System Process Death (LMK kill app)]
                   |                                           |
    - Process KHÔNG bị kill                     - Toàn bộ Process bị OS kill
    - ViewModel còn sống trong RAM               - ViewModel bị hủy hoàn toàn
    - View/Activity bị recreate                 - Phải phục hồi qua SavedStateHandle
```

1. **Configuration Change (Xoay màn hình, đổi ngôn ngữ, dark mode)**:
   - OS hủy và tạo lại Activity để nạp tài nguyên (resources) mới tương ứng.
   - `ViewModel` được lưu giữ trong `ViewModelStoreOwner` và **sống sót**.
2. **System-Initiated Process Death (Low Memory Killer - LMK)**:
   - Khi app ở background, OS có thể kill toàn bộ process của app để lấy RAM cho app khác.
   - `ViewModel` và toàn bộ singleton trong RAM bị mất hoàn toàn.
   - **Cứu cánh duy nhất:** `SavedStateHandle` (tích hợp trong ViewModel) hoặc `onSaveInstanceState(Bundle)` (giới hạn kích thước nhỏ < 50KB).

---

## 3. Bản chất FragmentManager & FragmentTransaction

### 3.1 So sánh `add()`, `replace()`, `show()` / `hide()`, `attach()` / `detach()`

| Thao tác | Hành vi với View Hierarchy | Hành vi với Lifecycle của Fragment cũ | Khi nào sử dụng? |
| :--- | :--- | :--- | :--- |
| **`add()`** | Chèn View mới đè lên container, giữ nguyên View cũ | Không ảnh hưởng Fragment cũ (vẫn `RESUMED`) | Hiển thị overlay, popup, hoặc ghép nhiều fragment vào các container khác nhau |
| **`replace()`** | Xóa toàn bộ View cũ trong container và chèn View mới | Fragment cũ gọi `onDestroyView()` (nếu vào back stack) hoặc `onDestroy()` | Flat navigation (Master-Detail, Wizard flow, standard screen change) |
| **`show()` / `hide()`** | Thay đổi `View.VISIBLE` / `View.GONE`, không tác động hierarchy | **KHÔNG** kích hoạt lifecycle! Gọi callback `onHiddenChanged(hidden: Boolean)` | **BottomNavigationView / Tabs** khi muốn giữ nguyên state và không muốn load lại data |
| **`detach()` / `attach()`**| Hủy cây View khỏi UI hierarchy (`detach`) hoặc tạo lại (`attach`) | `detach` gọi `onDestroyView()`, `attach` gọi `onCreateView()` | ViewPager cũ hoặc khi muốn giải phóng View mà vẫn giữ instance |

---

### 3.2 Các biến thể của `commit()` trong FragmentTransaction

```kotlin
// 1. commit()
fragmentManager.beginTransaction().replace(R.id.container, fragment).commit()

// 2. commitNow()
fragmentManager.beginTransaction().replace(R.id.container, fragment).commitNow()

// 3. commitAllowingStateLoss()
fragmentManager.beginTransaction().replace(R.id.container, fragment).commitAllowingStateLoss()

// 4. commitNowAllowingStateLoss()
fragmentManager.beginTransaction().replace(R.id.container, fragment).commitNowAllowingStateLoss()
```

- **`commit()`**: Bất đồng bộ (Asynchronous). Gửi transaction vào main thread message queue. Lệnh sẽ chạy khi Main Thread rảnh rỗi.
- **`commitNow()`**: Đồng bộ (Synchronous). Thực thi ngay lập tức tại dòng code đó.
  - *Quy tắc thép:* **Không được gọi `addToBackStack()` cùng với `commitNow()`**, nếu không sẽ throw `IllegalStateException: This transaction is already being added to the back stack`.
- **`commitAllowingStateLoss()`**: Tương tự `commit()`, nhưng cho phép thực thi kể cả sau khi Activity đã gọi `onSaveInstanceState()`. Nếu xảy ra kill process/xoay màn hình, transaction này có thể bị mất trạng thái.
- **`commitNowAllowingStateLoss()`**: Đồng bộ và cho phép state loss.

---

### 3.3 `FragmentFactory` & Dependency Injection

Trước đây, Android bắt buộc Fragment phải có constructor rỗng (no-argument constructor) để OS có thể instantiate lại Fragment qua Reflection (`Class.newInstance()`) khi recreate.

**Vấn đề:** Không thể inject dependency trực tiếp qua constructor (Constructor Injection).

**Giải pháp hiện đại:** Sử dụng `FragmentFactory`:

```kotlin
class CustomFragmentFactory(
    private val analyticsTracker: AnalyticsTracker,
    private val repository: UserRepository
) : FragmentFactory() {
    override fun instantiate(classLoader: ClassLoader, className: String): Fragment {
        return when (className) {
            UserProfileFragment::class.java.name -> UserProfileFragment(analyticsTracker, repository)
            else -> super.instantiate(classLoader, className)
        }
    }
}

// Thiết lập trong Activity TRƯỚC onCreate()
class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        supportFragmentManager.fragmentFactory = customFragmentFactory
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
    }
}
```

---

## 4. Giao tiếp giữa Activity và Fragment (Modern Communication Patterns)

### 4.1 Fragment Result API (Khuyên dùng cho giao tiếp 1-1 giữa 2 Fragment)
Không cần interface callback, không cần shared ViewModel, hoàn toàn lifecycle-safe.

```kotlin
// 1. Màn hình gửi kết quả (ví dụ: FilterFragment)
setFragmentResult("request_key", bundleOf("selected_filter" to "ACTIVE"))

// 2. Màn hình nhận kết quả (ví dụ: ProductListFragment)
override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setFragmentResultListener("request_key") { _, bundle ->
        val filter = bundle.getString("selected_filter")
        viewModel.applyFilter(filter)
    }
}
```

### 4.2 Activity-Scoped / NavGraph-Scoped ViewModel
Dùng khi nhiều Fragment chia sẻ chung một luồng dữ liệu phức tạp (ví dụ: Checkout Flow, Wizard form).

```kotlin
class StepOneFragment : Fragment() {
    // Scope theo Activity host
    private val sharedViewModel: CheckoutViewModel by activityViewModels()
}

class StepTwoFragment : Fragment() {
    // Cùng tham chiếu tới một instance ViewModel duy nhất
    private val sharedViewModel: CheckoutViewModel by activityViewModels()
}
```

---

## 5. Phòng chống rò rỉ bộ nhớ (Memory Leak Pitfalls)

### 5.1 Rò rỉ ViewBinding trong Fragment

```kotlin
class HomeFragment : Fragment(R.layout.fragment_home) {
    // SAI LẦM: Giữ strong reference tới binding mà không null hóa
    // private var binding: FragmentHomeBinding? = null

    // ĐÚNG:
    private var _binding: FragmentHomeBinding? = null
    private val binding get() = _binding!!

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        _binding = FragmentHomeBinding.bind(view)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        // BẮT BUỘC: Hủy reference khi View bị destroy để GC thu hồi View hierarchy
        _binding = null
    }
}
```

### 5.2 Lắng nghe Coroutine Flow sai cách (`launchWhenStarted` vs `repeatOnLifecycle`)

- **`launchWhenStarted` / `launchWhenResumed` (ĐÃ BỊ DEPRECATE)**:
  - Khi app xuống background (STOPPED), coroutine chỉ bị *suspend* chứ **không bị cancel**.
  - Producer của Flow vẫn tiếp tục chạy ngầm, bắn dữ liệu vào buffer, gây lãng phí CPU, RAM và có thể crash khi resume.
- **`repeatOnLifecycle` (CHUẨN HIỆN NAY)**:
  - Khi lifecycle xuống dưới target state (ví dụ `STOPPED`), coroutine block sẽ **bị hủy hoàn toàn**.
  - Khi màn hình quay lại `STARTED`, một coroutine mới sẽ được khởi chạy lại và bắt đầu collect từ đầu.

```kotlin
viewLifecycleOwner.lifecycleScope.launch {
    viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
        viewModel.uiState.collect { state ->
            render(state)
        }
    }
}
```

---

## 6. Bộ câu hỏi phỏng vấn Senior (Q&A Chuyên sâu)

### Q1: Phân biệt `Fragment.lifecycle` và `Fragment.viewLifecycleOwner.lifecycle`. Nếu observe LiveData/Flow bằng `this` (Fragment instance) trong `onViewCreated` thì hậu quả là gì?
**Trả lời:**
- `Fragment.lifecycle` đại diện cho vòng đời của đối tượng Java/Kotlin Fragment (`onAttach` -> `onDestroy`).
- `Fragment.viewLifecycleOwner.lifecycle` đại diện cho vòng đời của cây View UI (`onCreateView` -> `onDestroyView`).
- **Hậu quả khi dùng `this` trong `onViewCreated`:**
  - Khi Fragment được đưa vào Back Stack, View bị hủy (`onDestroyView()`) nhưng Fragment instance vẫn còn sống.
  - Khi user pop back stack, `onViewCreated()` được gọi lại và đăng ký một Observer **mới**.
  - Kết quả là có **nhiều Observer cùng tồn tại** trên cùng một Fragment instance. Mỗi khi LiveData/Flow phát event, callback UI bị trigger nhiều lần, dẫn đến lỗi duplicated events, memory leak hoặc crash ứng dụng.

---

### Q2: Giải thích nguyên nhân gốc rễ của lỗi `IllegalStateException: Can not perform this action after onSaveInstanceState`. Cách khắc phục đúng chuẩn?
**Trả lời:**
- **Nguyên nhân:** Khi Activity có nguy cơ bị hủy bởi hệ điều hành, `onSaveInstanceState()` được gọi để chụp lại (snapshot) toàn bộ trạng thái UI và Fragment back stack vào một `Bundle`. Nếu bạn gọi `commit()` sau thời điểm này, transaction mới sẽ **không được lưu vào Bundle**. Khi app được restore lại, trạng thái UI sẽ bị sai lệch so với trước đó (State Loss). Do đó, Android Framework cố tình ném ra `IllegalStateException` để bảo vệ tính toàn vẹn của dữ liệu.
- **Cách khắc phục:**
  1. Đảm bảo các tác vụ transaction chỉ chạy khi Activity đang active (trước `onSaveInstanceState`, thường trước `onPause`/`onStop`).
  2. Nếu transaction bắt nguồn từ callback async (như API response, Push Notification), hãy gắn nó với `lifecycleScope` / `repeatOnLifecycle` để tự động hủy khi UI không còn active.
  3. Chỉ sử dụng `commitAllowingStateLoss()` khi việc mất transaction đó không gây ảnh hưởng nghiêm trọng tới UI state (ví dụ: đóng một popup thông báo không quan trọng).

---

### Q3: Tại sao `commitNow()` không thể kết hợp với `addToBackStack()`?
**Trả lời:**
- `FragmentManager` duy trì một danh sách Back Stack chung cho toàn bộ transaction.
- Khi các transaction trước đó được submit qua `commit()`, chúng nằm trong Message Queue và đang chờ thực thi bất đồng bộ.
- Nếu `commitNow()` cho phép thêm vào Back Stack ngay lập tức tại thời điểm gọi, nó sẽ làm **đảo lộn thứ tự tuyến tính** của Back Stack (transaction gọi sau lại chen ngang vào trước các transaction đang xếp hàng trong queue).
- Để đảm bảo tính toàn vẹn thứ tự của ngăn xếp LIFO, Android cấm tuyệt đối việc gọi `addToBackStack()` kèm với `commitNow()`. Nếu cần thực thi đồng bộ và có backstack, phải dùng `commit()` kết hợp với `executePendingTransactions()`.

---

### Q4: Trong một ứng dụng có BottomNavigationView 5 tab, mỗi tab là một màn hình phức tạp (list data, scroll position, camera). Bạn sẽ quản lý các Fragment này như thế nào để tối ưu trải nghiệm và hiệu năng?
**Trả lời:**
Các chiến lược triển khai:
1. **Chiến lược `show()` / `hide()` (Giữ state trong RAM)**:
   - *Cách làm:* Khởi tạo cả 5 Fragment (hoặc lazy-load khi tab được click lần đầu) qua `add()`, sau đó dùng `show(currentFragment)` và `hide(otherFragments)`.
   - *Ưu điểm:* Chuyển tab tức thì (0ms latency), giữ nguyên 100% trạng thái scroll, input text.
   - *Nhược điểm:* Tốn RAM do giữ cả 5 cây View hierarchy trong bộ nhớ. Phải override `onHiddenChanged()` để pause video/camera/animations khi tab bị ẩn.
2. **Chiến lược Multiple Back Stacks (Jetpack Navigation Component - Khuyên dùng)**:
   - Hỗ trợ từ Navigation 2.4.0+ thông qua cơ chế `saveState` và `restoreState`.
   - Khi chuyển tab, Fragment cũ bị hủy View để giải phóng bộ nhớ, nhưng toàn bộ Back Stack và UI state của tab đó được serialize và lưu lại.
   - Khi quay lại tab cũ, state được restore tự động hoàn hảo mà không tốn RAM chạy ngầm.

---

### Q5: Khi nào xảy ra hiện tượng Fragment Overlapping (các Fragment bị vẽ đè lên nhau khi xoay màn hình)? Cách khắc phục triệt để?
**Trả lời:**
- **Nguyên nhân:** Khi Activity bị recreate (do xoay màn hình hoặc process death), `FragmentManager` tự động khôi phục và thêm lại các Fragment đã tồn tại từ `savedInstanceState`. Nếu trong `onCreate()` của Activity, lập trình viên vẫn viết code `supportFragmentManager.beginTransaction().add(...)` mà không kiểm tra trạng thái, một instance Fragment mới sẽ được tạo thêm và add đè lên Fragment cũ đã được khôi phục.
- **Cách khắc phục:** Luôn kiểm tra `savedInstanceState == null` trước khi khởi tạo Fragment ban đầu:

```kotlin
override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(R.layout.activity_main)

    if (savedInstanceState == null) {
        supportFragmentManager.beginTransaction()
            .replace(R.id.fragment_container, HomeFragment())
            .commit()
    }
}
```

---

### Q6: Tại sao `setRetainInstance(true)` bị deprecated trong Android Jetpack?
**Trả lời:**
- `setRetainInstance(true)` từng được dùng để giữ lại instance của Fragment khi xoay màn hình (bỏ qua `onDestroy` và `onCreate`).
- **Lý do bị Deprecated:**
  1. *Phá vỡ tính đồng nhất của kiến trúc:* Fragment được thiết kế là UI Controller, nhưng `retainInstance` biến nó thành nơi chứa dữ liệu/state logic.
  2. *Không giải quyết được Process Death:* `retainInstance` chỉ sống sót qua Configuration Change, hoàn toàn vô dụng khi OS kill process.
  3. *Nguy cơ Memory Leak cực cao:* Nếu Fragment giữ reference tới Context, Activity cũ, hoặc View callbacks, việc retain instance sẽ kéo theo toàn bộ Activity cũ bị rò rỉ trong bộ nhớ.
- **Thay thế:** Sử dụng `ViewModel` để lưu trữ data sống qua config change và `SavedStateHandle` để chống Process Death.

---

### Q7: Giả sử Activity A khởi chạy Activity B (Launch Mode `standard`). Trình bày thứ tự chính xác của tất cả các hàm lifecycle. Tại sao A không gọi `onStop()` ngay khi B bắt đầu khởi tạo?
**Trả lời:**
- **Thứ tự thực thi:**
  1. `A.onPause()`
  2. `B.onCreate()`
  3. `B.onStart()`
  4. `B.onResume()`
  5. `A.onStop()`
- **Lý do A không gọi `onStop()` ngay:**
  - Android ưu tiên **trải nghiệm thị giác liền mạch**. Nếu A gọi `onStop()` và hủy UI quá sớm trong khi B vẫn đang inflate layout XML hoặc khởi tạo View, màn hình sẽ bị hiện tượng màn hình đen (black screen/blank screen) hoặc giật khung hình (frame drop).
  - Hệ điều hành đợi cho tới khi Window của B được SurfaceFlinger vẽ xong khung hình đầu tiên và che khuất hoàn toàn Window của A, lúc này A mới an toàn chuyển sang trạng thái `onStop()`.

---

### Q8: Cơ chế hoạt động của `OnBackPressedDispatcher` trong Activity hiện đại là gì? Tại sao `onBackPressed()` bị deprecated trong API 33?
**Trả lời:**
- **Lý do `onBackPressed()` bị deprecated:**
  - `onBackPressed()` là cơ chế chặn phím cứng/gesture trực tiếp nhưng không hỗ trợ **Predictive Back Animation** (tính năng từ Android 13/14 cho phép người dùng vuốt nhẹ mép màn hình để xem trước màn hình phía sau trước khi quyết định thả tay để back).
- **Cơ chế `OnBackPressedDispatcher`:**
  - Tách rời logic xử lý Back Navigation ra thành các callback độc lập có thể đăng ký ở bất kỳ đâu (Activity, Fragment, Custom View, Compose).
  - Tích hợp chặt chẽ với `LifecycleOwner`: Khi Fragment bị `STOPPED` hoặc `DESTROYED`, callback tự động bị disable hoặc gỡ bỏ, chống memory leak hoàn toàn.

```kotlin
requireActivity().onBackPressedDispatcher.addCallback(
    viewLifecycleOwner,
    object : OnBackPressedCallback(true) {
        override fun handleOnBackPressed() {
            if (hasUnsavedChanges()) {
                showConfirmExitDialog()
            } else {
                isEnabled = false // Tắt callback này để hệ điều hành back tự nhiên
                requireActivity().onBackPressedDispatcher.onBackPressed()
            }
        }
    }
)
```

---

### Q9: Làm thế nào để giả lập và kiểm thử chuẩn xác kịch bản System-Initiated Process Death khi phát triển ứng dụng?
**Trả lời:**
Nhiều lập trình viên nhầm lẫn giữa việc nhấn nút "Stop" trong Android Studio (tương đương Force Stop, xóa sạch saved state) với Process Death thật.

**Các bước giả lập chuẩn:**
1. Mở app, điều hướng tới màn hình cần kiểm tra, nhập liệu dữ liệu vào Form.
2. Nhấn nút **Home** để đưa app về background (lúc này OS sẽ gọi `onSaveInstanceState`).
3. Sử dụng command line (ADB) để kill process của app:
   ```bash
   adb shell am kill <package_name>
   ```
   *(Lưu ý: `am kill` chỉ kill process khi app đang ở background, mô phỏng chính xác hành vi của Low Memory Killer).*
4. Nhấn vào app trong màn hình Recent Apps để mở lại.
5. **Kiểm tra:** Nếu app bị crash (do `NullPointerException` từ ViewModel rỗng hoặc Intent arguments thiếu) -> Xử lý chưa đạt chuẩn Process Death. Nếu app hiển thị lại đúng dữ liệu ban đầu -> App đã được quản lý state an toàn với `SavedStateHandle` / `Bundle`.

---

### Q10: Phân tích kiến trúc Single-Activity trong dự án Multi-Module quy mô lớn. Làm thế nào giải quyết bài toán Navigation giữa các feature module mà không gây phụ thuộc vòng (Circular Dependency)?
**Trả lời:**
Trong mô hình Multi-module (`:app`, `:feature:login`, `:feature:dashboard`, `:core:navigation`):
1. **Vấn đề:** Module `:feature:login` cần mở màn hình trong `:feature:dashboard`, nhưng hai feature module độc lập không được phép `implementation` lẫn nhau (vi phạm nguyên tắc đóng gói và gây circular dependency).
2. **Giải pháp kiến trúc:**
   - **Deep Link Navigation (Khuyên dùng với Jetpack Navigation):** Các màn hình expose URL pattern (ví dụ: `myapp://dashboard/profile`). Feature login mở màn hình dashboard thông qua `navController.navigate("myapp://dashboard/profile".toUri())`.
   - **Navigation Interface Pattern (Mediator / Router Pattern):**
     - Đặt interface điều hướng trong `:core:navigation` (ví dụ: `interface DashboardNavigator { fun openDashboard(context: Context) }`).
     - Module `:app` (module tổng phụ thuộc tất cả feature) sẽ implement interface này và inject vào Feature Login thông qua Dagger/Hilt.
     - Feature Login chỉ gọi `dashboardNavigator.openDashboard(context)` mà không cần biết chi tiết class Activity hay Fragment của Dashboard.
