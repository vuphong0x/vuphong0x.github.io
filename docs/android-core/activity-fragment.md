# Activity & Fragment: Bản chất kiến trúc & Cẩm nang Senior

`Activity` và `Fragment` là hai thành phần nền tảng xây dựng nên giao diện người dùng trong Android. Ở cấp độ Senior, việc nắm rõ không chỉ dừng lại ở các hàm lifecycle cơ bản, mà quan trọng là hiểu rõ **nguyên lý vận hành bên dưới (under the hood)**: cách hệ thống vẽ UI lên màn hình, cơ chế điều phối transaction của `FragmentManager`, sự lệch pha lifecycle dẫn đến rò rỉ bộ nhớ, và chiến lược khôi phục trạng thái khi hệ thống thu hồi tài nguyên.

---

## 1. Bản chất kiến trúc của Activity & Fragment

### 1.1 Activity Under the Hood: Từ Code đến Pixel trên màn hình

Một quan niệm sai lầm phổ biến là nghĩ rằng `Activity` trực tiếp vẽ các View lên màn hình. Trên thực tế, `Activity` đóng vai trò là một **bộ điều phối (orchestrator)** — điểm kết nối giữa ứng dụng với hệ điều hành Android (`ActivityTaskManagerService` - ATMS và `WindowManagerService` - WMS).

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
|  |  +-------------------------------------------------------+  |
+-------------------------------------------------------------+
                               |
                         ViewRootImpl
                               |
                   WindowManagerService (WMS)
                               |
                          SurfaceFlinger
```

Hành trình từ khi gọi `setContentView()` đến khi xuất hiện pixel trên màn hình trải qua các thành phần:

1. **`Window` & `PhoneWindow`**:
   - `Window` là một abstract class đại diện cho một cửa sổ hiển thị cấp cao nhất trên màn hình.
   - `PhoneWindow` là class triển khai thực tế (implementation) duy nhất của `Window` trong Android UI framework, quản lý toàn bộ giao diện của một Activity.

2. **`DecorView`**:
   - Là View gốc (root view) của toàn bộ cây View trong Window, kế thừa từ `FrameLayout`.
   - `DecorView` chia thành hai phần chính: vùng dành cho thanh hệ thống (Status Bar, Navigation Bar, Action Bar) và một container đặc biệt có id `android.R.id.content`.

3. **`setContentView(layoutResID)`**:
   - Khi gọi hàm này, `LayoutInflater` sẽ đọc file XML của bạn, khởi tạo các đối tượng View tương ứng và gắn cây View đó vào làm con của `android.R.id.content`.

4. **`ViewRootImpl` & Render Pipeline**:
   - `ViewRootImpl` là mắt xích cầu nối giữa Window Manager và cây View của ứng dụng.
   - Nó kích hoạt quy trình đo đạc và vẽ UI gồm 3 bước: `Measure` $\rightarrow$ `Layout` $\rightarrow$ `Draw`.
   - Kết quả vẽ được ghi vào một Surface buffer, sau đó gửi qua Binder IPC tới `SurfaceFlinger` — dịch vụ cấp hệ thống chịu trách nhiệm tổng hợp các layer từ nhiều nguồn (Status bar, Navigation bar, App Surface) rồi gửi tới phần cứng màn hình để hiển thị.

---

### 1.2 Fragment Under the Hood: Controller độc lập trên cây View

Khác với Activity, `Fragment` **không phải là một Context**. 

Về bản chất, Fragment là một **Controller** quản lý một cây View con độc lập và được gắn vào một container (ViewGroup) bên trong Activity thông qua `FragmentManager`.

- **Phụ thuộc vào Activity**: Fragment không thể tồn tại độc lập trên hệ điều hành. Toàn bộ thông điệp từ hệ thống (lifecycle event, input event, intent result) đều phải đi qua Activity trước khi được chuyển tiếp tới Fragment.
- **Tính hai mặt của Lifecycle**: Fragment có **hai vòng đời tách biệt**:
  1. *Fragment Instance Lifecycle* (vòng đời của đối tượng Java/Kotlin trong bộ nhớ): từ `onAttach()` đến `onDetach()`.
  2. *Fragment View Lifecycle* (vòng đời của cây giao diện UI): từ `onCreateView()` đến `onDestroyView()`.

Sự tách biệt này chính là nền tảng để Android tối ưu bộ nhớ thông qua Back Stack, nhưng cũng là nguồn cơn của lỗi rò rỉ bộ nhớ nếu không hiểu đúng.

---

### 1.3 So sánh Single-Activity và Multi-Activity Architecture

Xu hướng hiện đại trong phát triển Android (kể từ khi Google giới thiệu Android Jetpack và Jetpack Compose) là chuyển dịch hoàn toàn từ **Multi-Activity** sang **Single-Activity Architecture**.

| Tiêu chí | Single-Activity Architecture (Hiện đại) | Multi-Activity Architecture (Truyền thống) |
| :--- | :--- | :--- |
| **Cơ chế chuyển màn** | Thay thế Fragment / Composable trong cùng một Window | Hệ thống tạo Window mới, gọi liên tiến trình (IPC) tới ATMS và WMS |
| **Tiêu tốn tài nguyên (Overhead)** | **Rất nhẹ**: Tái sử dụng Window, DecorView, ViewRootImpl và Process hiện tại | **Nặng**: Mỗi Activity tạo riêng một Window, DecorView, ViewRootImpl và phân bổ Surface mới |
| **Chia sẻ dữ liệu** | **Rất linh hoạt**: Sử dụng chung Activity-scoped hoặc NavGraph-scoped ViewModel | **Hạn chế**: Phải serialize qua Intent/Bundle, dễ gặp `TransactionTooLargeException` nếu vượt quá giới hạn Binder (~1MB cho toàn process) |
| **Hiệu ứng chuyển cảnh (Animation)** | Mượt mà, hỗ trợ tốt Shared Element Transitions và hiệu ứng cử chỉ phức tạp | Phụ thuộc vào Window Transition của hệ điều hành, khó đồng bộ mượt mà |
| **Điều hướng & Deep Link** | Dễ dàng quản lý tập trung qua Jetpack Navigation Component | Phức tạp khi cấu hình cờ Intent (`FLAG_ACTIVITY_*`) và các thuộc tính `launchMode` |

---

## 2. Vòng đời chuyên sâu & Cơ chế phục hồi trạng thái

### 2.1 Cơ chế điều phối Lifecycle khi chuyển màn hình

#### Kịch bản 1: Activity A khởi chạy Activity B (Toàn màn hình)

Thứ tự kích hoạt các hàm callback diễn ra chính xác như sau:

```
Activity A                  Hệ điều hành / Activity B
    |                                   |
[onPause()] -------------------------> | (A nhường foreground)
    |                                   |
    |                               [onCreate()]
    |                               [onStart()]
    |                               [onResume()]
    |                                   | (B đã sẵn sàng tương tác)
[onStop()] <--------------------------- | (A bị che khuất hoàn toàn)
```

**Tại sao A phải gọi `onPause()` trước khi B khởi tạo, nhưng `onStop()` lại gọi sau khi B đã `onResume()`?**
- **A gọi `onPause()` trước**: Hệ thống cần đảm bảo Activity hiện tại dừng tương tác, tạm dừng animation và ngắt các tài nguyên độc quyền (như camera/mic) trước khi bàn giao quyền điều khiển cho màn hình mới.
- **A chỉ gọi `onStop()` sau khi B đã `onResume()`**: Đây là cơ chế giữ trải nghiệm thị giác liền mạch. Nếu hệ thống vội vã gọi `onStop()` của A ngay khi B vừa tạo, người dùng sẽ thấy màn hình nhấp nháy hoặc hiện một khoảng đen (blank screen) trong khi B vẫn đang bận inflate layout XML. Khi B đã hoàn tất việc hiển thị và tương tác (`onResume`), A mới chính thức bước vào trạng thái dừng (`onStop`).

> **Quy tắc hiệu năng:** Không bao giờ thực hiện các tác vụ tốn thời gian (ghi database, đọc file, mã hóa dữ liệu lớn) bên trong `onPause()`. Bất kỳ sự chậm trễ nào trong `onPause()` của A sẽ trực tiếp trì hoãn thời điểm xuất hiện của B, gây cảm giác ứng dụng bị đơ (jank/freeze).

#### Kịch bản 2: Activity B là Dialog hoặc Màn hình trong suốt (Translucent)
- Thứ tự: `A.onPause()` $\rightarrow$ `B.onCreate()` $\rightarrow$ `B.onStart()` $\rightarrow$ `B.onResume()`.
- **Activity A KHÔNG BAO GIỜ gọi `onStop()`**, vì A vẫn còn hiển thị một phần cho người dùng thấy phía sau lớp giao diện của B.

---

### 2.2 Fragment Lifecycle: Bản chất của hai vòng đời riêng biệt

```
Fragment Instance:  [onAttach] -> [onCreate] -----------------------------------------------------> [onDestroy] -> [onDetach]
                                      |                                                                   ^
Fragment View:                        +--> [onCreateView] -> [onViewCreated] -> [onDestroyView] ----------+
                                                ^                                      |
                                                +-------- (Khi Pop từ Back Stack) -----+
```

**Tại sao Fragment cần tách biệt View Lifecycle và Instance Lifecycle?**

Câu trả lời nằm ở cơ chế **Back Stack** của `FragmentManager`:
- Khi bạn chuyển sang màn hình khác và đưa Fragment hiện tại vào Back Stack (`addToBackStack()`):
  - Cây giao diện UI của Fragment sẽ bị hủy hoàn toàn (`onDestroyView()`) để giải phóng bộ nhớ RAM chứa các View nặng (Bitmap, TextView, RecyclerView).
  - Tuy nhiên, **instance của Fragment vẫn tiếp tục sống trong bộ nhớ** để lưu giữ toàn bộ biến trạng thái, dữ liệu logic và tham chiếu logic.
- Khi người dùng nhấn nút Back để quay lại:
  - Fragment không cần tạo lại instance (không gọi lại `onAttach()` hay `onCreate()`).
  - Hệ thống chỉ gọi lại `onCreateView()` và `onViewCreated()` để tái tạo cây View mới từ trạng thái đã có.

---

### 2.3 Phân biệt Configuration Change và Process Death

Khi người dùng đang sử dụng ứng dụng, giao diện có thể bị hủy và tạo lại bởi hai nguyên nhân hoàn toàn khác nhau:

```
                   +-------------------------------------------------------+
                   |                 Sự kiện làm mất UI                    |
                   +-------------------------------------------------------+
                                   /                       \
                                  /                         \
      [Configuration Change (Xoay màn hình)]    [System Process Death (LMK kill app)]
                   |                                           |
    - Tiến trình (Process) KHÔNG bị hủy         - Toàn bộ tiến trình bị OS kill
    - ViewModel CÒN SỐNG trong RAM              - ViewModel & Singleton BỊ MẤT TRẮNG
    - View/Activity bị recreate                 - Phục hồi qua SavedStateHandle / Storage
```

1. **Configuration Change (Xoay màn hình, thay đổi ngôn ngữ, bật Dark Mode)**:
   - Hệ điều hành chủ động hủy và tạo lại Activity để nạp lại bộ tài nguyên (resources: layout-land, values-night, string localized) phù hợp với cấu hình mới.
   - Đối tượng `ViewModel` được gắn với `ViewModelStoreOwner` nên được giữ nguyên vẹn trong bộ nhớ RAM và không bị ảnh hưởng.
2. **System-Initiated Process Death (Hệ thống thu hồi bộ nhớ qua Low Memory Killer - LMK)**:
   - Khi ứng dụng chuyển xuống chạy nền (background), nếu hệ thống thiếu hụt RAM cho ứng dụng foreground khác, LMK sẽ lập tức chấm dứt tiến trình của ứng dụng.
   - Toàn bộ bộ nhớ heap của tiến trình (bao gồm ViewModel, biến tĩnh, Singleton) đều bị xóa sạch.
   - **Cơ chế khôi phục**:
     - *Dữ liệu UI tạm thời nhỏ gọn* (ID đang xem, text đang gõ dở, filter query): Được lưu tự động hoặc thủ công qua `SavedStateHandle` / `onSaveInstanceState()`. Dữ liệu này được OS giữ lại dưới dạng `Bundle` qua Binder IPC.
     - *Dữ liệu nghiệp vụ lớn*: Phải được lưu trữ bền vững (Persistent Storage) trong Room Database, DataStore hoặc lấy lại từ Server API. Tránh nhồi nhét object lớn vào Bundle vì kích thước buffer của Transaction IPC có giới hạn hữu hạn (chia sẻ chung cho toàn bộ tiến trình).

---

## 3. Bản chất FragmentManager & FragmentTransaction

### 3.1 So sánh `add()`, `replace()`, `show()` / `hide()`, `detach()` / `attach()`

Mỗi thao tác trong `FragmentTransaction` tác động rất khác nhau lên View Hierarchy và Lifecycle:

| Thao tác | Tác động lên View Hierarchy | Tác động lên Lifecycle của Fragment cũ | Tình huống sử dụng thực tế |
| :--- | :--- | :--- | :--- |
| **`add()`** | Chèn View mới đè lên container, giữ nguyên cây View cũ bên dưới | Không ảnh hưởng: Fragment cũ vẫn giữ nguyên trạng thái `RESUMED` | Hiển thị màn hình dạng layer đè lên nhau, popup overlay hoặc ghép nhiều Fragment vào các container khác nhau trên cùng màn hình |
| **`replace()`** | Gỡ bỏ toàn bộ cây View cũ trong container và chèn cây View mới vào | Nếu có `addToBackStack()`: Fragment cũ gọi `onDestroyView()` nhưng giữ instance.<br/>Nếu không: Fragment cũ bị hủy hoàn toàn (`onDestroy()`, `onDetach()`) | Luồng điều hướng tuần tự cơ bản (Master-Detail, Form nhiều bước, chuyển màn hình chính) |
| **`show()` / `hide()`** | Thay đổi thuộc tính hiển thị `View.VISIBLE` / `View.GONE`, giữ nguyên cây View trong container | **KHÔNG làm thay đổi lifecycle!** Chỉ kích hoạt callback `onHiddenChanged(hidden: Boolean)` | **BottomNavigationView / Tabs**: Giữ nguyên trạng thái cuộn, input và không muốn reload lại dữ liệu khi người dùng chuyển qua lại giữa các tab |
| **`detach()` / `attach()`** | Tách cây View ra khỏi UI hierarchy (`detach`) hoặc gắn lại cây View vào (`attach`) | `detach` gọi `onDestroyView()`; `attach` kích hoạt lại từ `onCreateView()` | Triển khai trong các adapter kiểu cũ (như `FragmentPagerAdapter`) khi muốn giải phóng bộ nhớ UI nhưng giữ lại instance |

---

### 3.2 Phân biệt 4 biến thể của `commit()` trong FragmentTransaction

```kotlin
// 1. commit()
supportFragmentManager.beginTransaction().replace(R.id.container, fragment).commit()

// 2. commitNow()
supportFragmentManager.beginTransaction().replace(R.id.container, fragment).commitNow()

// 3. commitAllowingStateLoss()
supportFragmentManager.beginTransaction().replace(R.id.container, fragment).commitAllowingStateLoss()

// 4. commitNowAllowingStateLoss()
supportFragmentManager.beginTransaction().replace(R.id.container, fragment).commitNowAllowingStateLoss()
```

Bản chất của các hàm này được phân định dựa trên hai tiêu chí: **Thời điểm thực thi (Sync vs Async)** và **Mức độ an toàn với State Loss**:

#### 1. Bất đồng bộ (`commit()`) vs Đồng bộ (`commitNow()`)
- **`commit()`**: Hoạt động bất đồng bộ. Nó đưa công việc transaction vào hàng đợi tin nhắn (`MessageQueue`) của Main Thread. Transaction sẽ được thực thi khi Main Thread xử lý tới tin nhắn đó.
- **`commitNow()`**: Hoạt động đồng bộ. Transaction được thực thi ngay lập tức tại dòng lệnh gọi hàm.
  - ⚠️ **Quy tắc bắt buộc:** **Không được gọi `addToBackStack()` cùng với `commitNow()`**. Nếu vi phạm, hệ thống sẽ ném ra `IllegalStateException: This transaction is already being added to the back stack`. Lý do: `FragmentManager` có một Back Stack chung, nếu cho phép một transaction đồng bộ chen ngang vào giữa khi các transaction bất đồng bộ khác đang xếp hàng trong queue, thứ tự LIFO của Back Stack sẽ bị phá vỡ.

#### 2. Vấn đề State Loss (`commitAllowingStateLoss()`)
- Khi Activity sắp bị đưa vào trạng thái dừng, hệ thống sẽ gọi `onSaveInstanceState()` để chụp lại snapshot của UI và Fragment Back Stack vào một `Bundle`.
- Nếu bạn gọi `commit()` **sau** khi `onSaveInstanceState()` đã chạy, transaction mới sẽ không kịp lưu vào Bundle. Nếu sau đó tiến trình bị kill, khi người dùng mở lại app, transaction này sẽ biến mất hoàn toàn. Để ngăn chặn lỗi sai lệch dữ liệu này, Android mặc định ném ra ngoại lệ:
  `IllegalStateException: Can not perform this action after onSaveInstanceState`
- Dùng `commitAllowingStateLoss()` là chấp nhận bỏ qua việc kiểm tra này: transaction vẫn được thực hiện nếu Activity chưa bị destroy, nhưng nếu app bị kill bởi hệ thống thì trạng thái này sẽ bị mất.

---

### 3.3 `FragmentFactory` và Dependency Injection hiện đại

Theo cơ chế truyền thống, Android Framework yêu cầu mọi Fragment phải có **constructor mặc định không tham số (no-argument constructor)**. Nguyên nhân là khi ứng dụng bị recreate (do xoay màn hình hoặc process death), hệ thống sử dụng Java Reflection (`Class.newInstance()`) để tự động khởi tạo lại Fragment.

**Hạn chế:** Bạn không thể truyền dependency trực tiếp qua constructor (Constructor Injection), buộc phải dùng Field Injection hoặc Service Locator bên trong Fragment, khiến code khó viết Unit Test.

**Giải pháp hiện đại với `FragmentFactory`:**

Bằng cách cài đặt một `FragmentFactory` tùy biến trước khi `onCreate()` của Activity diễn ra, bạn có thể kiểm soát hoàn toàn việc khởi tạo Fragment:

```kotlin
class CustomFragmentFactory(
    private val analyticsTracker: AnalyticsTracker,
    private val userRepository: UserRepository
) : FragmentFactory() {
    override fun instantiate(classLoader: ClassLoader, className: String): Fragment {
        return when (className) {
            UserProfileFragment::class.java.name -> 
                UserProfileFragment(analyticsTracker, userRepository)
            else -> super.instantiate(classLoader, className)
        }
    }
}

// Cài đặt trong Activity TRƯỚC super.onCreate()
class MainActivity : AppCompatActivity() {
    @Inject lateinit var customFragmentFactory: CustomFragmentFactory

    override fun onCreate(savedInstanceState: Bundle?) {
        supportFragmentManager.fragmentFactory = customFragmentFactory
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
    }
}
```

---

## 4. Giao tiếp giữa Activity và Fragment

### 4.1 Fragment Result API (Mô hình 1-1 tối ưu giữa hai Fragment)

Trước đây, để truyền dữ liệu giữa hai Fragment (ví dụ: màn hình chọn Filter trả kết quả về màn hình Danh sách), lập trình viên thường dùng Callback Interface hoặc `targetFragment` (đã bị deprecated).

Cách tiếp cận chuẩn mực hiện nay là **Fragment Result API**: không phụ thuộc tham chiếu trực tiếp giữa các Fragment, không cần Interface tùy biến, và an toàn tuyệt đối với vòng đời.

```kotlin
// 1. Màn hình gửi kết quả (FilterFragment)
btnApply.setOnClickListener {
    setFragmentResult(
        "request_filter", 
        bundleOf("selected_status" to "COMPLETED")
    )
    parentFragmentManager.popBackStack()
}

// 2. Màn hình nhận kết quả (ProductListFragment)
override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    
    // Lắng nghe kết quả thông qua cùng một request key
    setFragmentResultListener("request_filter") { requestKey, bundle ->
        val status = bundle.getString("selected_status")
        viewModel.filterByStatus(status)
    }
}
```

### 4.2 Shared ViewModel (Mô hình 1-Nhiều hoặc Chia sẻ State phức tạp)

Khi nhiều Fragment cùng tham gia vào một quy trình nghiệp vụ chung (ví dụ: Checkout Flow gồm màn Giỏ hàng, Địa chỉ, Thanh toán), việc sử dụng chung một `ViewModel` có scope theo Activity hoặc theo Navigation Graph là giải pháp chuẩn mực.

```kotlin
class CartFragment : Fragment(R.layout.fragment_cart) {
    // ViewModel có phạm vi gắn liền với Activity chứa nó
    private val checkoutViewModel: CheckoutViewModel by activityViewModels()
}

class PaymentFragment : Fragment(R.layout.fragment_payment) {
    // Cùng trỏ tới một instance CheckoutViewModel duy nhất trong RAM
    private val checkoutViewModel: CheckoutViewModel by activityViewModels()
}
```

---

## 5. Cạm bẫy rò rỉ bộ nhớ (Memory Leak Pitfalls)

### 5.1 Rò rỉ ViewBinding trong Fragment

Đây là lỗi rò rỉ bộ nhớ phổ biến nhất trong các dự án Android.

**Nguyên nhân:** Như đã phân tích ở phần lifecycle, khi Fragment được đưa vào Back Stack, cây View bị hủy (`onDestroyView()`) nhưng đối tượng Fragment vẫn sống. Biến ViewBinding giữ tham chiếu mạnh (strong reference) tới Root View, và Root View lại giữ tham chiếu tới toàn bộ cây View con cùng với `Context` (Activity). Nếu không xóa tham chiếu này, toàn bộ cây View và Activity cũ sẽ không thể được Garbage Collector (GC) thu hồi.

```kotlin
class UserProfileFragment : Fragment(R.layout.fragment_user_profile) {

    // 1. Khai báo backing property nullable để có thể giải phóng
    private var _binding: FragmentUserProfileBinding? = null
    
    // 2. Property công khai chỉ hợp lệ giữa onCreateView và onDestroyView
    private val binding get() = _binding!!

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        _binding = FragmentUserProfileBinding.bind(view)
        
        binding.txtName.text = "Phong"
    }

    override fun onDestroyView() {
        super.onDestroyView()
        // 3. BẮT BUỘC: Xóa tham chiếu để GC có thể giải phóng toàn bộ cây View
        _binding = null
    }
}
```

---

### 5.2 Thu thập Flow sai cách: `launchWhenStarted` vs `repeatOnLifecycle`

Lắng nghe dữ liệu phát ra từ Coroutine Flow trong UI Layer nếu không cẩn thận sẽ dẫn đến lãng phí CPU hoặc crash ứng dụng khi màn hình ở dưới background.

```kotlin
// ❌ CÁCH CŨ (ĐÃ BỊ DEPRECATED): launchWhenStarted
viewLifecycleOwner.lifecycleScope.launchWhenStarted {
    viewModel.uiState.collect { state ->
        renderUI(state) // Có thể lãng phí tài nguyên
    }
}
```

- **Vấn đề của `launchWhenStarted`**: Khi màn hình bị ẩn xuống background (trạng thái `STOPPED`), coroutine này chỉ bị **tạm dừng (suspend)** chứ **không bị hủy (cancel)**. Nếu Flow ở ViewModel là một Hot Flow (như `SharedFlow` hoặc `StateFlow`), nguồn phát vẫn tiếp tục gửi dữ liệu, làm tốn tài nguyên xử lý dưới nền mà người dùng không hề nhìn thấy.

```kotlin
// ✅ CHUẨN HIỆN NẠI: repeatOnLifecycle
viewLifecycleOwner.lifecycleScope.launch {
    viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
        viewModel.uiState.collect { state ->
            renderUI(state)
        }
    }
}
```

- **Ưu điểm của `repeatOnLifecycle`**:
  - Khi lifecycle của View rơi xuống dưới `STARTED` (khi app vào background hoặc Fragment vào back stack), coroutine block bên trong sẽ **bị hủy hoàn toàn (cancelled)**, ngừng mọi thao tác thu thập dữ liệu từ flow producer.
  - Khi người dùng quay lại và màn hình đạt trạng thái `STARTED`, một coroutine mới sẽ được **tự động khởi tạo lại** và bắt đầu thu thập dữ liệu mới nhất.

---

## 6. Bộ câu hỏi phỏng vấn Senior (Q&A Chuyên sâu)

### Q1: Phân biệt `viewLifecycleOwner` và `this` (Fragment instance) khi đăng ký Observer. Nếu dùng nhầm `this` trong `onViewCreated` thì hậu quả là gì?
**Trả lời:**
- `this` đại diện cho vòng đời của đối tượng Fragment (từ `onAttach` đến `onDetach`).
- `viewLifecycleOwner` đại diện cho vòng đời của cây giao diện UI (từ `onCreateView` đến `onDestroyView`).
- **Hậu quả khi dùng `this` trong `onViewCreated`:**
  - Khi Fragment được đưa vào Back Stack, View bị hủy nhưng Fragment instance vẫn sống.
  - Khi người dùng ấn Back quay lại, `onViewCreated()` được gọi thêm một lần nữa và tiếp tục đăng ký thêm một Observer mới vào cùng một LiveData/Flow.
  - Hệ quả là có **nhiều Observer cùng lắng nghe đồng thời**. Mỗi khi dữ liệu thay đổi, callback UI bị kích hoạt lặp lại nhiều lần (gây duplicated toast, duplicated analytics event, hoặc crash app do truy cập view đã bị hủy).

---

### Q2: Giải thích nguyên nhân gốc rễ của ngoại lệ `IllegalStateException: Can not perform this action after onSaveInstanceState`. Cách xử lý đúng chuẩn là gì?
**Trả lời:**
- **Nguyên nhân:** Khi Activity có nguy cơ bị hủy bởi hệ thống, callback `onSaveInstanceState()` được gọi để chụp lại trạng thái hiện tại lưu vào `Bundle`. Nếu bạn thực hiện một `FragmentTransaction.commit()` sau thời điểm này, transaction mới sẽ không được ghi nhận trong snapshot đó. Nếu tiến trình bị kill, khi người dùng mở lại ứng dụng, giao diện sẽ bị mất đồng bộ (State Loss). Do đó, Android cố tình ném ra ngoại lệ này để bảo vệ tính toàn vẹn của dữ liệu UI.
- **Cách xử lý đúng chuẩn:**
  1. Chỉ thực hiện transaction khi UI đang ở trạng thái active (trong các callback tương tác của người dùng hoặc gắn với `lifecycleScope`).
  2. Nếu transaction đến từ kết quả của một tác vụ bất đồng bộ (API response, Coroutine), hãy thu thập dữ liệu bằng `repeatOnLifecycle` để tác vụ tự động dừng nếu UI đã xuống background.
  3. Chỉ sử dụng `commitAllowingStateLoss()` cho các thao tác phụ trợ, không ảnh hưởng nghiêm trọng đến luồng trải nghiệm chính của người dùng (ví dụ: đóng một Dialog loading hoặc ẩn một banner quảng cáo).

---

### Q3: Tại sao `commitNow()` không được phép sử dụng cùng với `addToBackStack()`?
**Trả lời:**
- `FragmentManager` duy trì một ngăn xếp Back Stack chung theo cơ chế LIFO (Last In, First Out) cho toàn bộ các transaction.
- Khi người dùng gọi các hàm `commit()` thông thường, các transaction đó được đẩy vào hàng đợi MessageQueue của Main Thread để thực thi tuần tự.
- Nếu `commitNow()` cho phép đẩy một transaction vào Back Stack ngay lập tức tại thời điểm gọi, nó sẽ **chen ngang và làm đảo lộn thứ tự** của các transaction đang chờ trong queue.
- Để đảm bảo tính nhất quán và trật tự của ngăn xếp điều hướng, framework cấm việc kết hợp hai thao tác này. Nếu muốn commit có Back Stack và thực thi ngay lập tức, cần dùng `commit()` kết hợp với `supportFragmentManager.executePendingTransactions()`.

---

### Q4: Trong ứng dụng có BottomNavigationView gồm 5 tab, mỗi tab có giao diện phức tạp, bạn sẽ quản lý các Fragment này như thế nào để tối ưu hiệu năng và trải nghiệm?
**Trả lời:**
Có hai chiến lược chính tùy thuộc vào yêu cầu của ứng dụng:

1. **Chiến lược `show()` / `hide()` (Giữ trạng thái trong bộ nhớ RAM):**
   - *Cách làm:* Khởi tạo các Fragment và add vào container cùng lúc (hoặc lazy-add khi bấm tab lần đầu), sau đó dùng `show()` tab được chọn và `hide()` các tab còn lại.
   - *Ưu điểm:* Chuyển đổi tab tức thì, giữ nguyên vị trí cuộn trang (scroll position) và dữ liệu nhập dở của người dùng.
   - *Nhược điểm:* Tốn RAM vì cây View của cả 5 tab đều tồn tại liên tục trong bộ nhớ. Cần override `onHiddenChanged()` để tạm dừng các tác vụ nặng (như phát video, camera preview, animation) khi tab bị ẩn.
2. **Chiến lược Multiple Back Stacks (Khuyên dùng với Jetpack Navigation Component):**
   - *Cách làm:* Sử dụng Navigation Component (từ bản 2.4.0 trở lên) có hỗ trợ sẵn tính năng Multiple Back Stacks (`saveState` và `restoreState`).
   - *Ưu điểm:* Khi rời khỏi một tab, View của tab đó bị hủy để giải phóng bộ nhớ, nhưng toàn bộ lịch sử Back Stack và trạng thái UI của tab được lưu trữ an toàn. Khi quay lại tab, giao diện được khôi phục chính xác trạng thái trước đó mà vẫn tiết kiệm tài nguyên hệ thống.

---

### Q5: Hiện tượng Fragment Overlapping (các Fragment bị vẽ đè lên nhau khi xoay màn hình) xuất phát từ đâu? Khắc phục triệt để như thế nào?
**Trả lời:**
- **Nguyên nhân:** Khi Activity bị tạo lại do xoay màn hình hoặc khôi phục sau Process Death, `FragmentManager` sẽ **tự động phục hồi và gắn lại** các Fragment đã tồn tại từ `savedInstanceState`. Nếu trong `onCreate()` của Activity, lập trình viên vẫn chủ động gọi lệnh thêm Fragment mới:
  ```kotlin
  supportFragmentManager.beginTransaction()
      .add(R.id.container, MyFragment())
      .commit()
  ```
  mà không kiểm tra điều kiện, hệ thống sẽ tạo thêm một instance mới của `MyFragment` và vẽ đè lên instance cũ đã được phục hồi, tạo ra hiện tượng chồng chéo giao diện.
- **Cách khắc phục:** Luôn bọc đoạn code khởi tạo Fragment ban đầu bên trong điều kiện kiểm tra `savedInstanceState == null`:
  ```kotlin
  override fun onCreate(savedInstanceState: Bundle?) {
      super.onCreate(savedInstanceState)
      setContentView(R.layout.activity_main)

      if (savedInstanceState == null) {
          supportFragmentManager.beginTransaction()
              .replace(R.id.container, HomeFragment())
              .commit()
      }
  }
  ```

---

### Q6: Tại sao phương thức `setRetainInstance(true)` lại bị deprecated trong Android Jetpack?
**Trả lời:**
`setRetainInstance(true)` từng được dùng để giữ lại instance của Fragment khi Activity bị hủy do xoay màn hình (bỏ qua `onDestroy` và `onCreate` của Fragment). Phương thức này bị khai tử vì các lý do:
1. **Phá vỡ nguyên tắc kiến trúc:** Fragment là một UI Controller, việc biến nó thành một nơi lưu trữ dữ liệu sống sót qua vòng đời của Activity làm mập mờ ranh giới trách nhiệm giữa UI và Business Logic.
2. **Không giải quyết được Process Death:** `retainInstance` chỉ duy trì được đối tượng qua Configuration Change, hoàn toàn vô tác dụng khi hệ thống kill tiến trình do thiếu RAM.
3. **Nguy cơ rò rỉ bộ nhớ rất cao:** Nếu Fragment giữ bất kỳ tham chiếu nào tới Context cũ, View callbacks hoặc Activity cũ, việc giữ lại instance sẽ kéo theo toàn bộ cây tài nguyên cũ bị rò rỉ trong heap.
- **Giải pháp thay thế:** Sử dụng kiến trúc hiện đại với **`ViewModel`** (để giữ dữ liệu qua xoay màn hình) kết hợp với **`SavedStateHandle`** (để chống chịu Process Death).

---

### Q7: Tại sao phương thức `onBackPressed()` bị deprecated từ Android 13 (API 33)? Cơ chế mới hoạt động ra sao?
**Trả lời:**
- **Lý do deprecated:** `onBackPressed()` chặn sự kiện phím cứng Back một cách trực tiếp và đột ngột. Cơ chế này không thể hỗ trợ tính năng **Predictive Back Animation** (tính năng từ Android 13/14+ cho phép người dùng vuốt nhẹ từ cạnh màn hình để xem trước giao diện màn hình phía sau hoặc màn hình Home trước khi quyết định thả tay để back thật).
- **Cơ chế mới với `OnBackPressedDispatcher`:**
  - Tách logic xử lý thao tác Back thành các đối tượng `OnBackPressedCallback` độc lập.
  - Các callback này được gắn kèm với `LifecycleOwner` (Activity hoặc Fragment). Khi màn hình rơi vào trạng thái `STOPPED` hoặc `DESTROYED`, callback sẽ tự động tạm vô hiệu hóa hoặc bị gỡ bỏ, ngăn ngừa memory leak.
  - Hệ thống biết trước màn hình nào đang sẵn sàng xử lý thao tác Back để hiển thị animation vuốt mượt mà tương ứng.

```kotlin
requireActivity().onBackPressedDispatcher.addCallback(
    viewLifecycleOwner,
    object : OnBackPressedCallback(true) {
        override fun handleOnBackPressed() {
            if (hasUnsavedChanges()) {
                showConfirmDiscardDialog()
            } else {
                isEnabled = false // Vô hiệu hóa callback này để hệ thống back tự nhiên
                requireActivity().onBackPressedDispatcher.onBackPressed()
            }
        }
    }
)
```

---

### Q8: Làm thế nào để giả lập và kiểm thử chính xác kịch bản Process Death trong quá trình phát triển?
**Trả lời:**
Nhiều lập trình viên nhầm lẫn việc nhấn nút **"Stop"** hoặc chạy lại app từ Android Studio với kịch bản Process Death. Nhấn Stop sẽ tương đương với `Force Stop` — toàn bộ saved state bị xóa sạch, không phải hành vi thực tế của hệ điều hành.

**Quy trình giả lập chuẩn:**
1. Mở ứng dụng, thao tác nhập dữ liệu vào form hoặc điều hướng vào sâu trong các màn hình.
2. Nhấn nút **Home** trên thiết bị để đưa ứng dụng xuống background (lúc này OS sẽ kích hoạt `onSaveInstanceState`).
3. Sử dụng lệnh ADB trong terminal để giả lập việc hệ thống thu hồi tài nguyên và kill process:
   ```bash
   adb shell am kill <your.package.name>
   ```
   *(Lệnh `am kill` chỉ chấm dứt tiến trình khi ứng dụng đang nằm dưới nền, mô phỏng chuẩn xác cơ chế Low Memory Killer).*
4. Nhấn vào ứng dụng trong danh sách **Recent Apps** để mở lại.
5. **Đánh giá:**
   - Nếu ứng dụng bị crash do `NullPointerException` (thường do ỷ lại vào các biến static, ViewModel hoặc dữ liệu singleton trong RAM) $\rightarrow$ Xử lý phục hồi trạng thái thất bại.
   - Nếu ứng dụng hiển thị lại đúng màn hình trước đó với đầy đủ dữ liệu form đã nhập $\rightarrow$ Đạt chuẩn xử lý Process Death.

---

### Q9: Trong dự án Multi-Module quy mô lớn áp dụng Single-Activity, làm thế nào để Fragment thuộc Module A điều hướng sang Fragment thuộc Module B mà không gây phụ thuộc vòng (Circular Dependency)?
**Trả lời:**
Trong kiến trúc Multi-Module chuẩn (ví dụ: `:feature:auth`, `:feature:dashboard`, `:core:navigation`), hai feature module độc lập tuyệt đối không được phụ thuộc trực tiếp vào nhau.

Có hai giải pháp kiến trúc phổ biến:

1. **Deep Link Navigation (Khuyên dùng với Jetpack Navigation Component):**
   - Mỗi màn hình Fragment đăng ký một URL pattern duy nhất trong nav graph (ví dụ: `app://dashboard/home`).
   - Feature Auth muốn chuyển sang Dashboard chỉ cần gọi:
     ```kotlin
     findNavController().navigate("app://dashboard/home".toUri())
     ```
   - Các module hoàn toàn độc lập và không cần biết đến class cụ thể của nhau.

2. **Mediator / Router Pattern (Sử dụng Interface điều hướng):**
   - Định nghĩa một Interface điều hướng trừu tượng bên trong `:core:navigation`:
     ```kotlin
     interface DashboardNavigator {
         fun openDashboard(fragment: Fragment)
     }
     ```
   - Module tổng `:app` (nơi phụ thuộc tất cả các feature module) sẽ triển khai (implement) interface này và cung cấp thông qua Dependency Injection (Hilt/Dagger).
   - Module `:feature:auth` chỉ việc inject `DashboardNavigator` và gọi hàm mà không có bất kỳ phụ thuộc trực tiếp nào tới `:feature:dashboard`.

---

### Q10: Phân tích sự đánh đổi (trade-offs) giữa việc dùng Fragment và chuyển hẳn sang Jetpack Compose 100% trong xây dựng UI?
**Trả lời:**
- **Khi sử dụng Fragment:**
  - *Ưu điểm:* Hệ sinh thái thư viện XML/View cực kỳ hoàn thiện và trưởng thành; quản lý tốt các thành phần phần cứng legacy (MapView, CameraX, SurfaceView chuyên dụng); đội ngũ lập trình viên đã quá quen thuộc với lifecycle.
  - *Nhược điểm:* Quản lý View phức tạp, boilerplate code lớn (phải tách biệt View Lifecycle và Fragment Instance Lifecycle); dễ phát sinh memory leak từ ViewBinding; hiệu năng inflate XML tốn kém hơn cơ chế tái cấu trúc trực tiếp bằng code Kotlin.
- **Khi chuyển sang Jetpack Compose 100%:**
  - *Ưu điểm:* Loại bỏ hoàn toàn sự rắc rối của Fragment Lifecycle; loại bỏ lớp ViewBinding và nguy cơ rò rỉ bộ nhớ View; Single Source of Truth cho UI State; UI được viết hoàn toàn bằng Kotlin mang tính khai báo (Declarative UI); code tái sử dụng cao và dễ test giao diện độc lập.
  - *Đánh đổi:* Cần đầu tư thời gian tối ưu Recomposition (tránh recompose không cần thiết qua `@Stable`, `remember`, `derivedStateOf`); chi phí học tập cao cho đội ngũ; một số thư viện bên thứ ba chưa có bản hỗ trợ Compose native vẫn phải bọc qua `AndroidView`.

---

## Đọc sâu và thực hành

- [State recovery và ma trận kiểm chứng](./state-recovery.md)
- [Context, ownership và memory leak](./context-memory.md)
- [Flow theo lifecycle và quản lý coroutine](../foundation/kotlin/flow-lifecycle.md)
