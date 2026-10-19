// Bộ câu hỏi gốc, đã rà soát lại các đáp án và thêm bài ôn tập.
export default [
  {
    "id": 1,
    "topic": "activity",
    "topicLabel": "Activity & Fragment",
    "question": "Trong luồng thông thường, khi mở Activity B toàn màn hình từ A đang RESUMED, thứ tự callback nào đúng?",
    "options": [
      "A.onPause → B.onCreate → B.onStart → B.onResume → A.onStop",
      "A.onStop → B.onCreate → B.onStart → B.onResume → A.onPause",
      "A.onPause → A.onStop → B.onCreate → B.onStart → B.onResume",
      "B.onCreate → A.onPause → B.onStart → B.onResume → A.onStop"
    ],
    "correct": 0,
    "explanation": "Luồng thông thường là A.onPause → B.onCreate → B.onStart → B.onResume → A.onStop khi A không còn hiển thị. Không dùng thứ tự này như một cam kết về thời điểm frame đầu tiên hoặc cho mọi chế độ multi-window.",
    "level": "core",
    "docLink": "/android-core/lifecycle"
  },
  {
    "id": 2,
    "topic": "activity",
    "topicLabel": "Activity & Fragment",
    "question": "Sự khác biệt giữa `add()` và `replace()` trong FragmentTransaction là gì?",
    "options": [
      "`add()` xóa Fragment cũ, `replace()` giữ Fragment cũ bên dưới",
      "`replace()` xóa Fragment cũ trong container, `add()` giữ Fragment cũ bên dưới",
      "Hai hàm hoàn toàn giống nhau, chỉ khác tên gọi",
      "`add()` dùng cho Fragment chính, `replace()` dùng cho Dialog Fragment"
    ],
    "correct": 1,
    "explanation": "`replace()` xóa toàn bộ Fragment hiện có trong container trước khi thêm Fragment mới. `add()` chỉ chèn thêm Fragment mới chồng lên, Fragment cũ vẫn tồn tại bên dưới.",
    "level": "core",
    "docLink": "/android-core/lifecycle"
  },
  {
    "id": 3,
    "topic": "activity",
    "topicLabel": "Activity & Fragment",
    "question": "Tại sao phải kiểm tra `savedInstanceState == null` trước khi add Fragment trong `onCreate()`?",
    "options": [
      "Vì `savedInstanceState` có thể null khi không có dữ liệu cần lưu",
      "Để tránh Fragment Overlapping — FragmentManager tự restore Fragment cũ khi Activity recreate",
      "Vì `add()` chỉ hoạt động khi savedInstanceState là null",
      "Không cần thiết, đây chỉ là best practice không bắt buộc"
    ],
    "correct": 1,
    "explanation": "Khi Activity bị recreate (xoay màn hình), FragmentManager tự động restore lại Fragment cũ từ savedInstanceState. Nếu không kiểm tra, Fragment mới sẽ được add đè lên Fragment đã được restore, gây ra Fragment Overlapping.",
    "level": "core",
    "docLink": "/android-core/lifecycle"
  },
  {
    "id": 4,
    "topic": "activity",
    "topicLabel": "Activity & Fragment",
    "question": "Tại sao `commitNow()` không thể kết hợp với `addToBackStack()`?",
    "options": [
      "Vì `commitNow()` quá nhanh, BackStack không theo kịp",
      "Để tránh đảo lộn thứ tự tuyến tính của BackStack khi có transaction đang xếp hàng",
      "Vì `addToBackStack()` chỉ hoạt động với `commit()` bất đồng bộ",
      "`commitNow()` không hỗ trợ tính năng BackStack"
    ],
    "correct": 1,
    "explanation": "Các transaction submit qua `commit()` nằm trong Message Queue, chờ thực thi bất đồng bộ. Nếu `commitNow()` thêm vào BackStack ngay lập tức, nó sẽ chen ngang vào trước các transaction đang xếp hàng, phá vỡ thứ tự LIFO.",
    "level": "core",
    "docLink": "/android-core/lifecycle"
  },
  {
    "id": 5,
    "topic": "activity",
    "topicLabel": "Activity & Fragment",
    "question": "Khi replace Fragment A bằng B và addToBackStack, điều gì thường xảy ra với A sau khi transaction hoàn tất?",
    "options": [
      "Fragment bị hủy hoàn toàn (onDestroy được gọi)",
      "Fragment bị tạm dừng (onPause được gọi)",
      "View bị hủy (onDestroyView), nhưng Fragment instance vẫn còn sống",
      "Fragment bị detach khỏi Activity (onDetach được gọi)"
    ],
    "correct": 2,
    "explanation": "Fragment có 2 vòng đời tách biệt. Khi vào BackStack, chỉ View lifecycle kết thúc (onDestroyView) để giải phóng bộ nhớ UI. Instance Fragment vẫn sống để giữ trạng thái. Khi user back, onCreateView được gọi lại.",
    "level": "core",
    "docLink": "/android-core/lifecycle"
  },
  {
    "id": 6,
    "topic": "activity",
    "topicLabel": "Activity & Fragment",
    "question": "Sử dụng `show()`/`hide()` thay vì `replace()` cho BottomNavigationView có ưu điểm gì?",
    "options": [
      "Tiết kiệm RAM vì không giữ Fragment trong bộ nhớ",
      "Giữ View hierarchy khi chuyển tab, thường tránh tạo lại scroll/input; vẫn cần phục hồi sau mất process",
      "Tốc độ animation chuyển tab nhanh hơn",
      "Tự động xử lý BackStack phức tạp hơn"
    ],
    "correct": 1,
    "explanation": "show()/hide() thay đổi visibility của View và giữ View hierarchy khi chuyển tab. Chúng không tự hạ lifecycle xuống STARTED: Fragment ẩn có thể vẫn RESUMED và vẫn collect dữ liệu. Cân nhắc setMaxLifecycle và chi phí giữ nhiều View trong RAM.",
    "level": "core",
    "docLink": "/android-core/lifecycle"
  },
  {
    "id": 7,
    "topic": "activity",
    "topicLabel": "Activity & Fragment",
    "question": "`IllegalStateException: Can not perform this action after onSaveInstanceState` xảy ra khi nào?",
    "options": [
      "Khi gọi `commit()` trên một thread khác Main Thread",
      "Khi gọi `commit()` sau khi Activity đã gọi `onSaveInstanceState()`",
      "Khi Fragment chưa được attach vào Activity",
      "Khi sử dụng `commitNow()` thay vì `commit()`"
    ],
    "correct": 1,
    "explanation": "Sau khi onSaveInstanceState() được gọi, Android đã \"chụp\" trạng thái UI. Nếu commit() sau thời điểm này, transaction sẽ không được lưu vào Bundle. Khi restore, UI sẽ mất transaction đó (State Loss). Android ném Exception để bảo vệ tính toàn vẹn dữ liệu.",
    "level": "core",
    "docLink": "/android-core/lifecycle"
  },
  {
    "id": 8,
    "topic": "activity",
    "topicLabel": "Activity & Fragment",
    "question": "Tại sao `setRetainInstance(true)` bị deprecated?",
    "options": [
      "Vì nó chậm hơn ViewModel trong mọi trường hợp",
      "Vì nó không giải quyết được Process Death và có nguy cơ Memory Leak cao",
      "Vì API mới hơn đã thay thế hoàn toàn tính năng này",
      "Vì nó chỉ hoạt động trên Android API < 28"
    ],
    "correct": 1,
    "explanation": "Retained Fragment làm vòng đời khó quản lý và dễ giữ View/Activity cũ. ViewModel là lựa chọn để giữ dữ liệu qua configuration change; cả ViewModel và retained Fragment đều không tự sống qua process death. Muốn phục hồi cần saved state hoặc lưu trữ bền vững.",
    "level": "core",
    "docLink": "/android-core/state-recovery"
  },
  {
    "id": 9,
    "topic": "activity",
    "topicLabel": "Activity & Fragment",
    "question": "Khi Activity B là dạng Dialog/Translucent đè lên Activity A, điều gì KHÔNG xảy ra?",
    "options": [
      "A.onPause() được gọi",
      "B.onResume() được gọi",
      "A.onStop() được gọi",
      "B.onCreate() được gọi"
    ],
    "correct": 2,
    "explanation": "A.onStop() KHÔNG được gọi vì A vẫn còn một phần hiển thị phía sau Dialog/Translucent B. onStop() chỉ được gọi khi Activity bị che khuất HOÀN TOÀN bởi Activity khác.",
    "level": "core",
    "docLink": "/android-core/lifecycle"
  },
  {
    "id": 10,
    "topic": "activity",
    "topicLabel": "Activity & Fragment",
    "question": "LifecycleOwner nào phù hợp để observe LiveData cập nhật View trong Fragment?",
    "options": [
      "viewModel.data.observe(this) { ... } — dùng Fragment instance làm LifecycleOwner",
      "viewModel.data.observe(viewLifecycleOwner) { ... } — dùng View lifecycle",
      "viewModel.data.observe(requireActivity()) { ... } — dùng Activity lifecycle",
      "Có thể dùng cả 3 cách, không có sự khác biệt đáng kể"
    ],
    "correct": 1,
    "explanation": "Dùng `viewLifecycleOwner` để gắn Observer với vòng đời View (onCreateView → onDestroyView). Nếu dùng `this` (Fragment instance), Observer tồn tại qua cả onDestroyView, và mỗi lần pop BackStack sẽ add thêm Observer mới → duplicate callbacks, memory leak.",
    "level": "core",
    "docLink": "/android-core/state-recovery#lifecycle-collection"
  },
  {
    "id": 11,
    "topic": "coroutines",
    "topicLabel": "Kotlin Coroutines",
    "question": "Với CoroutineStart.DEFAULT, thời điểm block launch bắt đầu được quyết định bởi điều gì?",
    "options": [
      "Có, chạy ngay lập tức trên thread hiện tại",
      "Phụ thuộc Dispatcher; có thể chạy ngay nếu không cần dispatch, hoặc được lập lịch",
      "Không, chỉ chạy khi gọi `.start()` hoặc `.join()`",
      "Có, nhưng trên một thread mới được tạo ra"
    ],
    "correct": 1,
    "explanation": "DEFAULT khởi chạy theo dispatcher trong CoroutineContext. Dispatchers.Main.immediate có thể thực thi ngay khi đang ở main thread; dispatcher cần dispatch thì lập lịch. Vì vậy không thể khẳng định launch luôn chạy sau dòng lệnh kế tiếp.",
    "level": "core",
    "docLink": "/foundation/kotlin/structured-concurrency#dispatchers"
  },
  {
    "id": 12,
    "topic": "coroutines",
    "topicLabel": "Kotlin Coroutines",
    "question": "Sự khác biệt giữa `Job` và `SupervisorJob` là gì?",
    "options": [
      "`SupervisorJob` chạy nhanh hơn `Job` thông thường",
      "Job thông thường lan lỗi child lên parent; SupervisorJob cô lập lỗi direct child khỏi sibling, không tự xử lý mọi exception",
      "`Job` dùng cho IO tasks, `SupervisorJob` dùng cho CPU tasks",
      "`SupervisorJob` tự động retry khi child coroutine fail"
    ],
    "correct": 1,
    "explanation": "Với `Job` (mặc định): lỗi từ child lan truyền lên parent → hủy tất cả child khác. Với `SupervisorJob`: mỗi child chịu trách nhiệm lỗi của chính nó, không ảnh hưởng sibling. Dùng SupervisorJob khi các task song song độc lập nhau (tải nhiều file riêng biệt).",
    "level": "core",
    "docLink": "/foundation/kotlin/structured-concurrency#partial-success"
  },
  {
    "id": 13,
    "topic": "coroutines",
    "topicLabel": "Kotlin Coroutines",
    "question": "`Dispatchers.IO` và `Dispatchers.Default` khác nhau như thế nào?",
    "options": [
      "`IO` dùng thread riêng, `Default` dùng Main Thread",
      "IO dành cho blocking I/O; Default dành cho tính toán CPU. Chúng có thể chia sẻ thread",
      "`IO` là bất đồng bộ, `Default` là đồng bộ",
      "Hai loại hoàn toàn giống nhau, chỉ khác tên"
    ],
    "correct": 1,
    "explanation": "Dispatchers.IO dành cho blocking I/O, Default dành cho CPU-bound work. IO mặc định giới hạn song song bằng max(64, số core), có thể cấu hình; các view limitedParallelism có quy tắc riêng. Hàm suspend không mặc nhiên cần chuyển sang IO nếu API đã main-safe.",
    "level": "core",
    "docLink": "/foundation/kotlin/structured-concurrency#dispatchers"
  },
  {
    "id": 14,
    "topic": "coroutines",
    "topicLabel": "Kotlin Coroutines",
    "question": "Trên Kotlin/JVM, compiler thường biểu diễn suspend function có nhiều suspension point như thế nào?",
    "options": [
      "Là function chạy trên một thread riêng biệt",
      "Là function sử dụng CPS (Continuation-Passing Style) và State Machine được Kotlin Compiler sinh ra",
      "Tạo một OS thread riêng cho từng suspension point",
      "Là function đặc biệt của Kotlin runtime, không liên quan đến JVM"
    ],
    "correct": 1,
    "explanation": "Kotlin Compiler biến suspend function thành function thường với tham số `Continuation` ở cuối. Bên trong, compiler sinh ra State Machine (switch-case với labels). Khi suspend, lưu state và return. Khi resume, gọi continuation.resumeWith() để tiếp tục từ label tiếp theo.",
    "level": "core",
    "docLink": "/foundation/kotlin/coroutines"
  },
  {
    "id": 15,
    "topic": "coroutines",
    "topicLabel": "Kotlin Coroutines",
    "question": "Tại sao `launchWhenStarted` bị deprecated và nên dùng gì thay thế?",
    "options": [
      "Vì `launchWhenStarted` quá chậm, thay bằng `lifecycleScope.launch`",
      "Vì khi app về background, coroutine chỉ *suspend* chứ không bị cancel → producer Flow vẫn chạy ngầm. Dùng `repeatOnLifecycle` thay thế",
      "Vì `launchWhenStarted` không tương thích với Flow, chỉ dùng được với LiveData",
      "Vì nó gây crash trên Android 12+ do thay đổi API"
    ],
    "correct": 1,
    "explanation": "`launchWhenStarted` khi app xuống background (STOPPED) chỉ suspend coroutine, không cancel. Flow producer tiếp tục bắn event vào buffer lãng phí tài nguyên. `repeatOnLifecycle` sẽ CANCEL coroutine khi lifecycle xuống dưới target state và START lại khi quay lên, an toàn hoàn toàn.",
    "level": "core",
    "docLink": "/foundation/kotlin/flow-lifecycle#collection"
  },
  {
    "id": 16,
    "topic": "coroutines",
    "topicLabel": "Kotlin Coroutines",
    "question": "Để gọi 2 API song song và đợi cả 2 kết quả, dùng cách nào?",
    "options": [
      "Dùng 2 lệnh `launch` riêng biệt và `join()` từng cái",
      "Dùng `async/await` trong `coroutineScope {}` để gọi song song và collect kết quả",
      "Dùng `withContext(Dispatchers.IO)` lồng nhau",
      "Dùng `runBlocking` để đợi từng request tuần tự"
    ],
    "correct": 1,
    "explanation": "`async {}` trả về `Deferred<T>`, khởi chạy coroutine song song. Gọi `await()` để lấy kết quả và tự động đợi. Bọc trong `coroutineScope {}` để đảm bảo nếu 1 task fail, task kia cũng bị cancel. Đây là pattern chuẩn cho parallel API calls.",
    "level": "core",
    "docLink": "/foundation/kotlin/structured-concurrency#all-or-nothing"
  },
  {
    "id": 17,
    "topic": "coroutines",
    "topicLabel": "Kotlin Coroutines",
    "question": "`CancellationException` có gì đặc biệt trong Coroutines?",
    "options": [
      "Nó là exception nghiêm trọng nhất, cần xử lý ngay lập tức",
      "Nó báo hiệu coroutine đã bị hủy, bị CoroutineExceptionHandler bỏ qua và không nên bị \"nuốt\" trong catch block",
      "Nó tự động retry coroutine sau khi bị cancel",
      "Nó chỉ xảy ra khi job.cancel() được gọi từ thread khác"
    ],
    "correct": 1,
    "explanation": "CancellationException là tín hiệu đặc biệt báo coroutine đã bị hủy. CoroutineExceptionHandler cố tình bỏ qua nó. Không bao giờ swallow nó trong `catch (e: Exception)` vì sẽ ngăn coroutine dừng đúng cách và gây resource leak.",
    "level": "core",
    "docLink": "/foundation/kotlin/structured-concurrency#cancellation"
  },
  {
    "id": 18,
    "topic": "coroutines",
    "topicLabel": "Kotlin Coroutines",
    "question": "`CoroutineStart.UNDISPATCHED` hoạt động như thế nào?",
    "options": [
      "Giống `DEFAULT`, nhưng bắt đầu trên Main Thread",
      "Chạy ngay lập tức trên thread hiện tại đến suspension point đầu tiên, sau đó resume trên Dispatcher được chỉ định",
      "Không dispatch sang bất kỳ thread nào, luôn chạy trên thread gọi launch",
      "Tương đương `CoroutineStart.LAZY` nhưng không cần gọi `.start()`"
    ],
    "correct": 1,
    "explanation": "UNDISPATCHED chạy NGAY trên thread hiện tại đến suspension point đầu tiên (khác DEFAULT bị lập lịch vào queue). Sau khi resume từ suspension, nó chạy trên Dispatcher được chỉ định. Hữu ích khi cần side effect ngay lập tức trước điểm suspend đầu tiên.",
    "level": "core",
    "docLink": "/foundation/kotlin/structured-concurrency#dispatchers"
  },
  {
    "id": 19,
    "topic": "coroutines",
    "topicLabel": "Kotlin Coroutines",
    "question": "Phép `+` trong `CoroutineContext = Dispatchers.IO + SupervisorJob() + CoroutineName(\"X\")` làm gì?",
    "options": [
      "Cộng số lượng thread của các Dispatcher lại với nhau",
      "Merge các Element vào một CoroutineContext, element sau ghi đè element cùng loại trước đó",
      "Tạo ra một chain các coroutine thực thi tuần tự",
      "Chỉ là syntax sugar, không có tác dụng thực sự"
    ],
    "correct": 1,
    "explanation": "CoroutineContext là một map đặc biệt với key là loại Element (Job, Dispatcher, Name,...). Toán tử `+` merge hai Context lại, với element cùng key từ phía phải sẽ ghi đè phía trái. Kết quả là một Context chứa tất cả các Element không trùng key.",
    "level": "core",
    "docLink": "/foundation/kotlin/structured-concurrency#scope-ownership"
  },
  {
    "id": 20,
    "topic": "coroutines",
    "topicLabel": "Kotlin Coroutines",
    "question": "Làm thế nào để tránh gọi API trùng lặp khi user spam nút \"Refresh\"?",
    "options": [
      "Dùng `Thread.sleep()` để throttle",
      "Chọn policy rõ: bỏ qua khi đang Loading, cancel-previous hoặc throttle theo implementation phù hợp",
      "Tắt nút Refresh bằng `button.isEnabled = false` trong toàn bộ thời gian chờ",
      "Dùng `synchronized {}` để lock request"
    ],
    "correct": 1,
    "explanation": "Ba giải pháp phổ biến: (1) Kiểm tra nếu state đang Loading thì return sớm. (2) Hủy Job cũ (`refreshJob?.cancel()`) trước khi tạo Job mới — hay dùng cho SearchBar. (3) Dùng Flow với throttleFirst() operator để chỉ nhận event đầu tiên trong window thời gian.",
    "level": "core",
    "docLink": "/foundation/kotlin/coroutines"
  },
  {
    "id": 21,
    "topic": "architecture",
    "topicLabel": "Architecture",
    "question": "Unidirectional Data Flow (UDF) trong MVVM yêu cầu điều gì?",
    "options": [
      "Data phải đi từ View → ViewModel → Repository và ngược lại theo cùng 1 đường",
      "State chỉ chảy xuống (View nhận State), Events chỉ đi lên (View gửi Event lên ViewModel)",
      "Tất cả data phải được serialize trước khi truyền giữa các layer",
      "ViewModel phải observe trực tiếp từ Database, không qua Repository"
    ],
    "correct": 1,
    "explanation": "UDF: Events đi LÊN (UI → ViewModel → Repository), State đi XUỐNG (Repository → ViewModel → UI). UI không bao giờ tự ý thay đổi state, chỉ gửi intent lên ViewModel. ViewModel là single source of truth qua StateFlow<UiState>.",
    "level": "core",
    "docLink": "/architecture/ui-state-events#udf"
  },
  {
    "id": 22,
    "topic": "architecture",
    "topicLabel": "Architecture",
    "question": "Trong Clean Architecture, UseCase (Interactor) đóng vai trò gì?",
    "options": [
      "Là layer giao tiếp trực tiếp với API và Database",
      "Đóng gói một nghiệp vụ cụ thể (business rule), cô lập ViewModel khỏi các thay đổi của data layer",
      "Là interface giữa Fragment và Activity",
      "Quản lý UI state và lifecycle của màn hình"
    ],
    "correct": 1,
    "explanation": "UseCase chứa business logic thuần túy, không phụ thuộc vào Android SDK. Mỗi UseCase làm DUY NHẤT một việc (Single Responsibility). Nó giúp ViewModel gọn hơn, dễ test hơn, và thay đổi data source không ảnh hưởng đến business logic.",
    "level": "core",
    "docLink": "/architecture/ui-state-events#repository-contract"
  },
  {
    "id": 23,
    "topic": "architecture",
    "topicLabel": "Architecture",
    "question": "ViewModel được thiết kế để sống sót qua sự kiện nào?",
    "options": [
      "System Process Death (OS kill app ở background)",
      "Configuration Change (xoay màn hình, đổi language)",
      "Cả hai — Configuration Change lẫn Process Death",
      "Không sự kiện nào — ViewModel bị hủy khi Activity bị destroy"
    ],
    "correct": 1,
    "explanation": "ViewModel CHỈ sống sót qua Configuration Change (xoay màn hình, đổi ngôn ngữ) vì được lưu trong ViewModelStore, tách rời khỏi Activity instance. Khi OS kill process (System Process Death), toàn bộ RAM bị clear kể cả ViewModel. Phải dùng SavedStateHandle để chống Process Death.",
    "level": "core",
    "docLink": "/android-core/state-recovery"
  },
  {
    "id": 24,
    "topic": "architecture",
    "topicLabel": "Architecture",
    "question": "`SavedStateHandle` trong ViewModel giải quyết vấn đề gì mà `ViewModel` thông thường không làm được?",
    "options": [
      "Lưu state qua Configuration Change (xoay màn hình)",
      "Lưu state qua System-Initiated Process Death (OS kill app ở background)",
      "Chia sẻ data giữa nhiều Fragment khác nhau",
      "Tự động persist data vào local database"
    ],
    "correct": 1,
    "explanation": "SavedStateHandle lưu dữ liệu UI nhỏ qua cơ chế saved state để tạo lại ViewModel sau system-initiated process death khi task được phục hồi. Không bảo đảm phục hồi sau force-stop, finish hoặc xóa task. Lưu ID/query nhỏ, tải lại dữ liệu lớn từ Room hoặc server.",
    "level": "core",
    "docLink": "/android-core/state-recovery"
  },
  {
    "id": 25,
    "topic": "architecture",
    "topicLabel": "Architecture",
    "question": "Repository Pattern giải quyết vấn đề gì trong Android Architecture?",
    "options": [
      "Tăng tốc độ truy vấn Database bằng caching tự động",
      "Cung cấp một API thống nhất cho data layer, ViewModel không cần biết data đến từ Network hay Local DB",
      "Giúp Activity và Fragment giao tiếp với nhau dễ dàng hơn",
      "Quản lý vòng đời của network request"
    ],
    "correct": 1,
    "explanation": "Repository là \"single source of truth\" cho data. Nó quyết định lấy data từ đâu (cache, network, database) mà ViewModel không cần biết. Giúp code dễ test (mock Repository), dễ thay đổi data source mà không ảnh hưởng business logic.",
    "level": "core",
    "docLink": "/architecture/ui-state-events#repository-contract"
  },
  {
    "id": 26,
    "topic": "architecture",
    "topicLabel": "Architecture",
    "question": "Trong Multi-Module Architecture, làm thế nào để Feature A navigate sang Feature B mà không gây Circular Dependency?",
    "options": [
      "Feature A implementation Feature B trực tiếp",
      "Dùng Deep Link navigation hoặc Navigation Interface Pattern với shared :core:navigation module",
      "Dùng Event Bus global để truyền navigation event",
      "Luôn navigate qua Activity thay vì Fragment"
    ],
    "correct": 1,
    "explanation": "Hai giải pháp: (1) Deep Link — Feature A navigate bằng URL \"myapp://featureB/screen\". (2) Interface Pattern — định nghĩa `interface FeatureBNavigator` trong :core:navigation. Module :app implement interface và inject vào Feature A qua Hilt. Feature A chỉ gọi interface, không biết chi tiết Feature B.",
    "level": "core",
    "docLink": "/architecture/mvvm"
  },
  {
    "id": 27,
    "topic": "architecture",
    "topicLabel": "Architecture",
    "question": "`StateFlow` vs `SharedFlow` — khi nào dùng cái nào?",
    "options": [
      "`StateFlow` cho events (navigation, snackbar), `SharedFlow` cho state (loading, data)",
      "StateFlow giữ giá trị state hiện tại; SharedFlow phát tới các subscriber với replay/buffer cấu hình được",
      "Hai loại hoàn toàn giống nhau, chỉ khác syntax",
      "`StateFlow` dùng trong ViewModel, `SharedFlow` dùng trong Repository"
    ],
    "correct": 1,
    "explanation": "StateFlow có giá trị ban đầu và conflation theo equality. SharedFlow là broadcast stream, không bảo đảm event quan trọng được xử lý đúng một lần: replay=0 có thể mất event khi không có subscriber. Chọn cơ chế theo yêu cầu delivery, không chỉ theo tên state/event.",
    "level": "core",
    "docLink": "/foundation/kotlin/flow-lifecycle#cold-hot"
  },
  {
    "id": 28,
    "topic": "architecture",
    "topicLabel": "Architecture",
    "question": "Single-Activity Architecture có ưu điểm gì so với Multi-Activity Architecture?",
    "options": [
      "Dễ code hơn vì không cần Fragment",
      "Chia sẻ data dễ hơn (ViewModel scoped theo Activity), transition mượt hơn, navigation tập trung qua Jetpack Navigation",
      "Bảo mật hơn vì ít Activity hơn",
      "Tốc độ khởi chạy app nhanh hơn"
    ],
    "correct": 1,
    "explanation": "Single-Activity: (1) Chia sẻ data qua Activity-scoped ViewModel thay vì serialize qua Intent Bundle (giới hạn ~1MB). (2) Transition animation mượt mà hơn (Shared Element, Fragment Transition). (3) Navigation tập trung dễ quản lý Deep Link và BackStack. (4) Ít overhead hơn (không tạo Window mới cho mỗi màn hình).",
    "level": "core",
    "docLink": "/architecture/mvvm"
  },
  {
    "id": 29,
    "topic": "performance",
    "topicLabel": "Performance",
    "question": "Tại sao phải null hóa ViewBinding trong `onDestroyView()` của Fragment?",
    "options": [
      "Để tránh crash khi binding được dùng sau khi View bị destroy",
      "Để GC có thể thu hồi toàn bộ View hierarchy — Fragment instance tồn tại qua onDestroyView nhưng View thì không",
      "Vì Docusaurus yêu cầu null hóa resource khi không dùng",
      "Chỉ cần thiết khi Fragment dùng RecyclerView"
    ],
    "correct": 1,
    "explanation": "Fragment instance có thể sống lâu hơn View, ví dụ sau replace có addToBackStack. Binding giữ reference đến View hierarchy; đặt binding=null trong onDestroyView và gỡ listener phù hợp để GC có thể thu hồi các View cũ.",
    "level": "core",
    "docLink": "/android-core/context-memory#ownership"
  },
  {
    "id": 30,
    "topic": "performance",
    "topicLabel": "Performance",
    "question": "Một cách hữu ích để thử phục hồi sau mất process khi app đang background là gì?",
    "options": [
      "Nhấn nút Stop ▪ trong Android Studio",
      "Dùng Force Stop trong Settings > Apps",
      "Nhấn Home → chạy `adb shell am kill <package_name>` → mở lại từ Recent Tasks",
      "Tắt thiết bị và bật lại"
    ],
    "correct": 2,
    "explanation": "Đưa app về background, dùng adb shell am kill <package_name>, rồi mở task cũ từ Recents để kiểm tra phục hồi. Force-stop và nút Stop không tương đương system-initiated process death. Không dùng “Don’t keep activities” như một bài test process death vì nó chủ yếu hủy Activity.",
    "level": "core",
    "docLink": "/android-core/state-recovery"
  },
  {
    "id": 31,
    "topic": "performance",
    "topicLabel": "Performance",
    "question": "Tool nào hỗ trợ tự phát hiện retained Activity/Fragment và hiển thị retention trace trong phát triển?",
    "options": [
      "Android Profiler → CPU Profiler",
      "LeakCanary (tự động phát hiện và báo cáo leak với GC root trace)",
      "Strict Mode với penaltyLog()",
      "ADB logcat với tag \"GC\""
    ],
    "correct": 1,
    "explanation": "LeakCanary là thư viện chuyên biệt: tự động detect khi Activity/Fragment không được GC sau onDestroy/onDestroyView, dump Heap, phân tích GC root chain và hiển thị notification chi tiết. Không cần thao tác thủ công. Android Memory Profiler dùng để investigate sau khi suspect có leak.",
    "level": "core",
    "docLink": "/android-core/context-memory"
  },
  {
    "id": 32,
    "topic": "performance",
    "topicLabel": "Performance",
    "question": "Sự khác biệt giữa Memory Cache và Disk Cache trong image loading (Glide/Coil)?",
    "options": [
      "Memory Cache lưu compressed images, Disk Cache lưu decoded Bitmaps",
      "Memory Cache (L1): Bitmap đã decode trong RAM → instant access. Disk Cache (L2): encoded image trên disk → đọc và decode khi cache miss",
      "Memory Cache là persistent (sống qua app restart), Disk Cache là temporary",
      "Không có sự khác biệt thực sự, chỉ là thuật ngữ khác nhau"
    ],
    "correct": 1,
    "explanation": "Memory Cache (L1) giữ Bitmap đã decode sẵn trong RAM (LRU policy) → instant display khi scroll qua ảnh đã xem. Disk Cache (L2) giữ image file (JPEG/WebP) trên storage → đọc file + decode khi memory cache miss, nhưng nhanh hơn download lại từ network.",
    "level": "core",
    "docLink": "/performance/profiling"
  },
  {
    "id": 33,
    "topic": "performance",
    "topicLabel": "Performance",
    "question": "Tại sao không nên thực hiện tác vụ nặng (lưu DB, serialize data) trong `onPause()`?",
    "options": [
      "Vì `onPause()` không đảm bảo sẽ được gọi",
      "Vì `onPause()` chạy trước `onCreate()` của Activity tiếp theo, làm chậm thời gian mở màn hình mới",
      "Vì không có permission đọc/ghi trong `onPause()`",
      "Vì `onPause()` chỉ được gọi trên background thread"
    ],
    "correct": 1,
    "explanation": "Thứ tự lifecycle: A.onPause → B.onCreate → B.onStart → B.onResume → A.onStop. Nếu onPause() mất 200ms vì lưu DB, user phải chờ thêm 200ms trước khi B bắt đầu load → cảm giác app bị freeze/jank. Nên thực hiện tác vụ nặng trong onStop() hoặc trên background thread.",
    "level": "core",
    "docLink": "/performance/profiling"
  },
  {
    "id": 34,
    "topic": "performance",
    "topicLabel": "Performance",
    "question": "`DiffUtil` trong RecyclerView giúp gì về performance?",
    "options": [
      "Tăng tốc độ render mỗi item trong RecyclerView",
      "Tính diff giữa hai danh sách để dispatch cập nhật tối thiểu; ListAdapter/AsyncListDiffer giúp chạy diff ở background",
      "Tự động load thêm item khi scroll đến cuối list (Pagination)",
      "Cache ViewHolder để tránh tạo mới khi scroll"
    ],
    "correct": 1,
    "explanation": "DiffUtil tính các thay đổi giữa hai snapshot list; tự gọi calculateDiff không tự chuyển thread. ListAdapter/AsyncListDiffer tính diff ở background và cập nhật adapter. Không sửa list đang được diff; dùng snapshot mới và callback so sánh identity/content chính xác.",
    "level": "core",
    "docLink": "/performance/profiling"
  },
  {
    "id": 35,
    "topic": "general",
    "topicLabel": "General Android",
    "question": "Sự khác biệt giữa Application Context và Activity Context là gì?",
    "options": [
      "Application Context tồn tại lâu hơn, gắn với vòng đời toàn bộ app process; Activity Context gắn với vòng đời Activity",
      "Application Context dùng cho UI, Activity Context dùng cho background tasks",
      "Application Context mạnh hơn, có thể thay thế hoàn toàn Activity Context",
      "Không có sự khác biệt về chức năng, chỉ khác scope"
    ],
    "correct": 0,
    "explanation": "Application Context sống suốt vòng đời app (dùng cho singleton, Room database). Activity Context có theme, style của màn hình hiện tại (dùng cho inflate layout, Dialog, Toast). Dùng Application Context trong singleton tránh memory leak vì không giữ reference đến Activity.",
    "level": "core",
    "docLink": "/android-core/context-memory"
  },
  {
    "id": 36,
    "topic": "general",
    "topicLabel": "General Android",
    "question": "WorkManager khác gì so với Foreground Service?",
    "options": [
      "WorkManager chạy trên Main Thread, Foreground Service chạy trên Background Thread",
      "WorkManager cho persistent scheduling có constraints/retry; Foreground Service cho công việc người dùng nhận biết với các giới hạn riêng",
      "WorkManager chỉ dùng được khi có WiFi, Foreground Service dùng mọi điều kiện",
      "Foreground Service cần user permission, WorkManager thì không"
    ],
    "correct": 1,
    "explanation": "WorkManager lưu lịch cho persistent work qua process restart/reboot, hỗ trợ constraints và retry, nhưng không hứa hoàn thành ngay hay đúng giờ. Doze, quota, force-stop và hủy work ảnh hưởng thực thi. Foreground Service phục vụ công việc người dùng nhận biết, có notification và chịu giới hạn khởi chạy theo phiên bản Android.",
    "level": "core",
    "docLink": "/android-core/background-work#choose"
  },
  {
    "id": 37,
    "topic": "general",
    "topicLabel": "General Android",
    "question": "Implicit Intent khác Explicit Intent như thế nào?",
    "options": [
      "Explicit Intent chậm hơn vì cần tìm kiếm component trên toàn hệ thống",
      "Explicit Intent chỉ định chính xác component (class) sẽ nhận. Implicit Intent mô tả action và để OS tìm app phù hợp",
      "Implicit Intent chỉ dùng được trong cùng 1 app",
      "Explicit Intent cần permission đặc biệt, Implicit Intent thì không"
    ],
    "correct": 1,
    "explanation": "Explicit Intent: `Intent(context, TargetActivity::class.java)` — biết chính xác component. Implicit Intent: `Intent(Intent.ACTION_VIEW, Uri.parse(\"https://...\"))` — mô tả hành động, OS tra cứu IntentFilter của các app đã install để tìm app phù hợp (browser, camera, email...).",
    "level": "core",
    "docLink": "/interview/android-questions"
  },
  {
    "id": 38,
    "topic": "general",
    "topicLabel": "General Android",
    "question": "Khi người dùng nhấn Back và call API vẫn đang chạy, cách nào tốt nhất để không bị memory leak?",
    "options": [
      "Dùng `Thread.interrupt()` để dừng network thread",
      "Dùng `viewModelScope.launch {}` — khi ViewModel bị clear, coroutine tự cancel và Retrofit hủy network request",
      "Dùng `GlobalScope.launch {}` để request sống sót qua màn hình",
      "Không cần xử lý, Android tự hủy network request khi Activity bị destroy"
    ],
    "correct": 1,
    "explanation": "viewModelScope tự động cancel tất cả coroutine khi ViewModel.onCleared() được gọi (khi màn hình bị destroy). Khi coroutine bị cancel, CancellationException được throw, Retrofit bắt nó và gọi `call.cancel()` xuống OkHttp để hủy network request — tránh leak và lãng phí bandwidth.",
    "level": "core",
    "docLink": "/foundation/kotlin/structured-concurrency#scope-ownership"
  },
  {
    "id": 39,
    "topic": "general",
    "topicLabel": "General Android",
    "question": "`onBackPressedDispatcher` thay thế `onBackPressed()` vì lý do gì?",
    "options": [
      "Vì `onBackPressed()` gây crash trên Android 13+",
      "Để hỗ trợ Predictive Back Animation và cho phép đăng ký callback lifecycle-aware ở bất kỳ component nào",
      "Vì `onBackPressedDispatcher` nhanh hơn về mặt performance",
      "Vì `onBackPressed()` không thể override trong Fragment"
    ],
    "correct": 1,
    "explanation": "Predictive Back Gesture (Android 13/14) cho phép user preview màn hình trước khi thả tay. `onBackPressed()` là hook cứng không hỗ trợ preview này. `OnBackPressedDispatcher` cho phép đăng ký callback ở Activity, Fragment, hoặc Compose với lifecycle awareness — callback tự disable khi component bị destroy.",
    "level": "core",
    "docLink": "/interview/android-questions"
  },
  {
    "id": 40,
    "topic": "general",
    "topicLabel": "General Android",
    "question": "Launch Mode `singleTask` khác `singleTop` như thế nào?",
    "options": [
      "`singleTask` và `singleTop` hoàn toàn giống nhau",
      "`singleTop`: reuse nếu ở đỉnh stack, còn lại tạo mới. `singleTask`: chỉ 1 instance trong Task, clear tất cả Activity phía trên nó và gọi onNewIntent()",
      "`singleTask` tạo Task mới, `singleTop` ở Task hiện tại",
      "`singleTop` đảm bảo 1 instance duy nhất, `singleTask` cho phép nhiều instance"
    ],
    "correct": 1,
    "explanation": "`singleTop`: nếu Activity đang ở TOP của stack → gọi onNewIntent(), không tạo mới. Nếu không ở top → tạo instance mới. `singleTask`: đảm bảo chỉ có 1 instance trong toàn bộ Task. Nếu đã tồn tại → clear mọi Activity phía trên nó (pop BackStack đến Activity đó) rồi gọi onNewIntent().",
    "level": "core",
    "docLink": "/interview/android-questions"
  },
  {
    "id": 41,
    "topic": "activity",
    "topicLabel": "Activity & Fragment",
    "question": "`DecorView` trong Android đóng vai trò gì?",
    "options": [
      "Là class quản lý animation giữa các Activity",
      "Là root View thực sự của Window, kế thừa FrameLayout, chứa status bar, action bar và content area (android.R.id.content)",
      "Là lớp trừu tượng đại diện cho bề mặt hiển thị của GPU",
      "Là View chứa Toolbar và BottomNavigationView"
    ],
    "correct": 1,
    "explanation": "DecorView là root của toàn bộ View hierarchy trong một Window. Nó kế thừa FrameLayout và chứa: system UI chrome (status bar, navigation bar), Action Bar/Toolbar, và vùng content (android.R.id.content) nơi bạn inflate layout qua setContentView().",
    "level": "core",
    "docLink": "/android-core/lifecycle"
  },
  {
    "id": 42,
    "topic": "activity",
    "topicLabel": "Activity & Fragment",
    "question": "FragmentFactory giải quyết vấn đề gì trong Android?",
    "options": [
      "Tăng tốc độ khởi tạo Fragment bằng cách cache instance",
      "Cho phép inject dependency vào Fragment constructor, thay vì bắt buộc dùng no-argument constructor",
      "Tự động quản lý BackStack cho tất cả Fragment",
      "Cung cấp cơ chế animate khi thêm/xóa Fragment"
    ],
    "correct": 1,
    "explanation": "Android yêu cầu Fragment có no-argument constructor để OS có thể recreate Fragment qua Reflection. FragmentFactory override cơ chế này, cho phép bạn tự instantiate Fragment với dependency được inject qua constructor — chuẩn hơn, testable hơn, loại bỏ pattern arguments Bundle.",
    "level": "core",
    "docLink": "/android-core/lifecycle"
  },
  {
    "id": 43,
    "topic": "activity",
    "topicLabel": "Activity & Fragment",
    "question": "Khi nào nên dùng `executePendingTransactions()` sau `commit()`?",
    "options": [
      "Luôn luôn, để đảm bảo transaction chạy ngay lập tức",
      "Khi thực sự cần thực thi các transaction đang chờ đồng bộ và chấp nhận ảnh hưởng của việc flush toàn bộ hàng đợi",
      "Chỉ khi dùng cùng với `addToBackStack()`",
      "Không cần thiết, Docusaurus tự động gọi nó sau mỗi commit()"
    ],
    "correct": 1,
    "explanation": "executePendingTransactions thực thi các transaction đang chờ, không chỉ transaction ngay trước đó. Cân nhắc callback/ordering và reentrancy; nếu chỉ cần một transaction đồng bộ không vào back stack, commitNow có thể phù hợp hơn. Không dùng flush queue như mặc định sau mọi commit.",
    "level": "core",
    "docLink": "/android-core/lifecycle"
  },
  {
    "id": 44,
    "topic": "activity",
    "topicLabel": "Activity & Fragment",
    "question": "ViewRootImpl đảm nhiệm vai trò gì trong Android View system?",
    "options": [
      "Quản lý vòng đời của Activity và Fragment",
      "Là cầu nối giữa WindowManager và View hierarchy, thực thi 3 phase: Measure → Layout → Draw và dispatch input events",
      "Là root class của tất cả View widget trong Android",
      "Quản lý bộ nhớ và GC cho các View không còn dùng"
    ],
    "correct": 1,
    "explanation": "ViewRootImpl kết nối View hierarchy với WindowManagerService. Nó: (1) Trigger traversal Measure/Layout/Draw khi cần redraw. (2) Nhận input events từ InputDispatcher và truyền xuống View tree. (3) Quản lý vsync để đồng bộ render với màn hình 60/90/120Hz.",
    "level": "core",
    "docLink": "/android-core/lifecycle"
  },
  {
    "id": 45,
    "topic": "activity",
    "topicLabel": "Activity & Fragment",
    "question": "Fragment Result API (`setFragmentResult`) có ưu điểm gì so với interface callback?",
    "options": [
      "Nhanh hơn vì không dùng Reflection",
      "Gửi/nhận kết quả qua FragmentManager theo request key và LifecycleOwner, giảm phụ thuộc callback trực tiếp",
      "Có thể truyền object lớn mà không giới hạn kích thước",
      "Hoạt động được cả khi fragment không attach vào Activity"
    ],
    "correct": 1,
    "explanation": "Fragment Result API giữ pending result theo key và deliver khi listener đủ lifecycle theo contract. Chọn đúng FragmentManager và owner; API không tự loại bỏ mọi leak do reference/job khác của ứng dụng.",
    "level": "core",
    "docLink": "/android-core/lifecycle"
  },
  {
    "id": 46,
    "topic": "activity",
    "topicLabel": "Activity & Fragment",
    "question": "Multiple Back Stacks trong Jetpack Navigation (từ 2.4.0+) giải quyết vấn đề gì của BottomNavigationView?",
    "options": [
      "Giúp navigate sang màn hình khác nhanh hơn",
      "Mỗi tab có back stack riêng — khi chuyển tab, state và back stack của tab cũ được save/restore thay vì bị hủy",
      "Cho phép hiển thị nhiều back stack song song trên màn hình lớn",
      "Tự động xử lý animation khi chuyển giữa các tab"
    ],
    "correct": 1,
    "explanation": "Trước 2.4.0: chuyển tab bị hủy Fragment cũ, mất trạng thái. Từ 2.4.0+: mỗi tab có NavBackStack riêng. Khi chuyển sang tab khác, current back stack được serialize và lưu lại. Khi quay lại, back stack và Fragment state được restore hoàn hảo — cân bằng tốt giữa UX và memory.",
    "level": "core",
    "docLink": "/android-core/lifecycle"
  },
  {
    "id": 47,
    "topic": "activity",
    "topicLabel": "Activity & Fragment",
    "question": "Tại sao `onHiddenChanged(isHidden)` cần được xử lý đặc biệt khi dùng `show()`/`hide()`?",
    "options": [
      "Vì `show()`/`hide()` không gọi bất kỳ lifecycle callback nào, cần dùng onHiddenChanged để pause/resume resources như Camera, Video Player",
      "Vì `onHiddenChanged` thay thế hoàn toàn `onResume()` khi dùng show/hide",
      "Vì chỉ có `onHiddenChanged` mới trigger lại layout inflation khi show Fragment",
      "Không cần xử lý đặc biệt, lifecycle tự động điều chỉnh"
    ],
    "correct": 0,
    "explanation": "`show()`/`hide()` chỉ thay đổi `View.VISIBLE`/`View.GONE`, không trigger onPause()/onResume(). Fragment vẫn ở trạng thái RESUMED khi bị hide. Cần override `onHiddenChanged(hidden: Boolean)` để dừng Camera, animation, video khi fragment bị ẩn và khởi động lại khi được show.",
    "level": "core",
    "docLink": "/android-core/lifecycle"
  },
  {
    "id": 48,
    "topic": "activity",
    "topicLabel": "Activity & Fragment",
    "question": "`onNewIntent()` được gọi khi nào và `intent` property nào nên dùng sau đó?",
    "options": [
      "`onNewIntent()` gọi khi Activity được tạo mới. Dùng `getIntent()` ngay sau.",
      "`onNewIntent()` gọi khi Activity đã tồn tại nhận Intent mới (singleTop/singleTask). Phải gọi `setIntent(intent)` để `getIntent()` trả về Intent mới nhất.",
      "`onNewIntent()` chỉ gọi khi app được mở từ notification. Dùng `intent.extras` ngay trong callback.",
      "`onNewIntent()` chỉ gọi một lần duy nhất trong vòng đời Activity."
    ],
    "correct": 1,
    "explanation": "Khi singleTop/singleTask Activity nhận Intent mới, `onNewIntent(intent)` được gọi với Intent mới. NHƯNG `getIntent()` lúc này vẫn trả về Intent ban đầu! Phải gọi `setIntent(intent)` trong `onNewIntent()` để cập nhật Intent hiện tại, sau đó mới lấy bằng `getIntent()` chính xác.",
    "level": "core",
    "docLink": "/android-core/lifecycle"
  },
  {
    "id": 49,
    "topic": "activity",
    "topicLabel": "Activity & Fragment",
    "question": "Nhận định nào đúng về taskAffinity và launchMode singleInstance?",
    "options": [
      "`taskAffinity` là alias cho `android:launchMode`, hai thuộc tính này tương đương nhau",
      "singleInstance là Activity duy nhất trong task của nó; taskAffinity không thay thế quy tắc launchMode",
      "`taskAffinity` chỉ ảnh hưởng đến animation transition giữa các Task",
      "`taskAffinity` bắt buộc phải set cho tất cả Activity trong Multi-Activity App"
    ],
    "correct": 1,
    "explanation": "singleInstance đặt Activity vào task riêng và không cho Activity khác cùng task đó. taskAffinity là thuộc tính riêng, được xét trong các trường hợp như NEW_TASK và task reparenting; cùng affinity không làm mất quy tắc singleInstance.",
    "level": "core",
    "docLink": "/android-core/lifecycle"
  },
  {
    "id": 50,
    "topic": "activity",
    "topicLabel": "Activity & Fragment",
    "question": "`ChildFragmentManager` vs `SupportFragmentManager` — khi nào dùng cái nào trong Fragment?",
    "options": [
      "Luôn dùng `SupportFragmentManager` để đảm bảo tương thích",
      "Dùng `childFragmentManager` khi tạo nested Fragment (Fragment trong Fragment). Dùng `parentFragmentManager` hoặc `requireActivity().supportFragmentManager` khi cần add Fragment vào container của Activity",
      "`childFragmentManager` chỉ dùng trong BottomSheetDialogFragment",
      "Hai loại hoàn toàn tương đương, chỉ khác scope"
    ],
    "correct": 1,
    "explanation": "`childFragmentManager` quản lý các Fragment được nest BÊN TRONG Fragment hiện tại (con của Fragment). Lifecycle của chúng bị ràng buộc theo Fragment cha. Khi Fragment cha bị destroy, tất cả child fragment cũng bị destroy theo. `parentFragmentManager` là FragmentManager của host Activity/Fragment cha.",
    "level": "core",
    "docLink": "/android-core/lifecycle"
  },
  {
    "id": 51,
    "topic": "activity",
    "topicLabel": "Activity & Fragment",
    "question": "Khi dùng Activity Result API, cần làm gì để nhận lại kết quả sau khi Activity bị recreate?",
    "options": [
      "Không thể nhận kết quả từ Activity khác nữa sau deprecation",
      "Đăng ký callback mỗi lần Activity/Fragment được tạo, theo thứ tự ổn định và trước STARTED",
      "Chỉ ảnh hưởng đến app target API 30+, API thấp hơn vẫn dùng bình thường",
      "`startActivityForResult()` bị xóa hoàn toàn trong Android 13"
    ],
    "correct": 1,
    "explanation": "Đăng ký callback vô điều kiện mỗi lần tạo Activity/Fragment, theo thứ tự ổn định, trước khi lifecycle STARTED; chỉ launch khi lifecycle ít nhất CREATED. Registry có thể khớp kết quả đang chờ với callback mới. State bổ sung vẫn cần được lưu riêng.",
    "level": "core",
    "docLink": "/android-core/lifecycle"
  },
  {
    "id": 52,
    "topic": "activity",
    "topicLabel": "Activity & Fragment",
    "question": "Trong Predictive Back Gesture (Android 14+), `OnBackPressedCallback` cần làm gì để hỗ trợ animation xem trước?",
    "options": [
      "Override `handleOnBackStarted()`, `handleOnBackProgressed()`, `handleOnBackCancelled()` ngoài `handleOnBackPressed()`",
      "Chỉ cần override `handleOnBackPressed()` như bình thường",
      "Implement interface `PredictiveBackAnimator` riêng biệt",
      "Set `android:enableOnBackInvokedCallback=\"true\"` trong AndroidManifest là đủ"
    ],
    "correct": 0,
    "explanation": "Predictive Back API mở rộng OnBackPressedCallback với: `handleOnBackStarted()` (user bắt đầu gesture), `handleOnBackProgressed(progress)` (cập nhật animation theo progress 0.0-1.0), `handleOnBackCancelled()` (user thả tay giữa chừng không back), `handleOnBackPressed()` (back hoàn thành). Cần implement đủ 4 để animation mượt mà.",
    "level": "core",
    "docLink": "/android-core/lifecycle"
  },
  {
    "id": 53,
    "topic": "coroutines",
    "topicLabel": "Kotlin Coroutines",
    "question": "`Flow` cold vs `SharedFlow` hot — sự khác biệt cốt lõi là gì?",
    "options": [
      "Cold Flow chỉ chạy trên Main Thread, Hot Flow chạy trên background thread",
      "Cold flow builder chạy logic cho mỗi collection; SharedFlow chia sẻ broadcast stream, producer lifetime còn tùy owner/sharing policy",
      "Cold Flow là synchronous, Hot Flow là asynchronous",
      "Cold Flow không thể cancel, Hot Flow có thể cancel bất kỳ lúc nào"
    ],
    "correct": 1,
    "explanation": "Cold Flow (ví dụ flow { }): mỗi lần gọi collect() khởi chạy lại producer từ đầu — giống Sequence lazy. Hot Flow (SharedFlow/StateFlow): producer chạy độc lập với collectors, nhiều collector nhận cùng data, collector mới bỏ lỡ data đã phát trước đó (trừ khi có replay buffer).",
    "level": "core",
    "docLink": "/foundation/kotlin/flow-lifecycle#cold-hot"
  },
  {
    "id": 54,
    "topic": "coroutines",
    "topicLabel": "Kotlin Coroutines",
    "question": "`flowOn()` operator trong Flow làm gì?",
    "options": [
      "Chuyển tất cả operators phía SAU nó sang Dispatcher được chỉ định",
      "Chuyển tất cả operators phía TRƯỚC nó (upstream) sang Dispatcher được chỉ định, collect vẫn chạy trên context hiện tại",
      "Là bắt buộc phải dùng trên mọi Flow để chỉ định thread",
      "Chuyển collector sang thread riêng biệt để tránh block UI"
    ],
    "correct": 1,
    "explanation": "`flowOn(Dispatcher.IO)` ảnh hưởng đến UPSTREAM operators (trước nó). Các operator sau `flowOn` và collector vẫn chạy trên context của caller. Pattern phổ biến: `flow { emit(fetchFromNetwork()) }.flowOn(Dispatchers.IO).collect { updateUI(it) }` — fetch chạy trên IO, collect chạy trên Main.",
    "level": "core",
    "docLink": "/foundation/kotlin/coroutines"
  },
  {
    "id": 55,
    "topic": "coroutines",
    "topicLabel": "Kotlin Coroutines",
    "question": "Sự khác biệt giữa `coroutineScope {}` và `supervisorScope {}`?",
    "options": [
      "`coroutineScope` dùng cho IO tasks, `supervisorScope` dùng cho CPU tasks",
      "`coroutineScope`: nếu 1 child fail → cancel tất cả. `supervisorScope`: child fail độc lập, không ảnh hưởng sibling — giống SupervisorJob",
      "`supervisorScope` tự động retry child coroutine khi fail",
      "Hai loại hoàn toàn giống nhau về behavior với lỗi"
    ],
    "correct": 1,
    "explanation": "`coroutineScope {}` tạo scope với Job thường: 1 child fail → cancel parent → cancel tất cả sibling. `supervisorScope {}` tạo scope với SupervisorJob: child fail không lan truyền lên parent, sibling vẫn chạy. Dùng supervisorScope khi muốn tải song song nhiều item mà 1 item fail không ảnh hưởng item khác.",
    "level": "core",
    "docLink": "/foundation/kotlin/structured-concurrency#partial-success"
  },
  {
    "id": 56,
    "topic": "coroutines",
    "topicLabel": "Kotlin Coroutines",
    "question": "`withTimeout()` và `withTimeoutOrNull()` khác nhau như thế nào?",
    "options": [
      "Cả hai đều throw exception khi timeout, chỉ khác tên",
      "`withTimeout()` throw `TimeoutCancellationException` khi hết giờ. `withTimeoutOrNull()` trả về null thay vì throw exception",
      "`withTimeoutOrNull()` tự động retry khi timeout",
      "`withTimeout()` block Main Thread, `withTimeoutOrNull()` không block"
    ],
    "correct": 1,
    "explanation": "`withTimeout(1000) { ... }` throw `TimeoutCancellationException` nếu block chưa hoàn thành trong 1000ms. `withTimeoutOrNull(1000) { ... }` trả về null thay vì throw — giúp code gọn hơn khi timeout là trường hợp bình thường cần xử lý, không phải exceptional case.",
    "level": "core",
    "docLink": "/foundation/kotlin/structured-concurrency#cancellation"
  },
  {
    "id": 57,
    "topic": "coroutines",
    "topicLabel": "Kotlin Coroutines",
    "question": "Structured Concurrency trong Kotlin Coroutines có nghĩa là gì?",
    "options": [
      "Tất cả coroutine phải dùng cùng một Dispatcher",
      "Coroutine con không thể sống sót lâu hơn coroutine cha — lifecycle được tổ chức theo cấu trúc cây phân cấp (parent-child)",
      "Coroutine phải được khai báo theo thứ tự cấu trúc từ trên xuống",
      "Chỉ cho phép tạo tối đa 64 coroutine đồng thời"
    ],
    "correct": 1,
    "explanation": "Structured Concurrency đảm bảo: (1) Coroutine con luôn thuộc về scope/coroutine cha. (2) Parent không hoàn thành cho đến khi tất cả child hoàn thành. (3) Hủy parent sẽ hủy tất cả child theo cây phân cấp. (4) Lỗi ở child lan truyền lên parent (trừ SupervisorJob). Loại bỏ hoàn toàn coroutine leak.",
    "level": "core",
    "docLink": "/foundation/kotlin/structured-concurrency#scope-ownership"
  },
  {
    "id": 58,
    "topic": "coroutines",
    "topicLabel": "Kotlin Coroutines",
    "question": "Operator `conflate()` trong Flow làm gì?",
    "options": [
      "Gộp nhiều Flow thành một Flow duy nhất",
      "Khi collector xử lý chậm, bỏ qua các giá trị trung gian và chỉ xử lý giá trị MỚI NHẤT — tránh backpressure",
      "Merge các item cùng key lại với nhau",
      "Buffer tất cả item phát ra và xử lý từng cái một theo thứ tự"
    ],
    "correct": 1,
    "explanation": "Khi producer phát data nhanh hơn collector xử lý (backpressure), `conflate()` drop các item giữa chừng và chỉ deliver item mới nhất. Khác `buffer()` — buffer giữ tất cả item. Dùng conflate() khi chỉ quan tâm state cuối cùng, ví dụ: hiển thị giá trị realtime của sensor.",
    "level": "core",
    "docLink": "/foundation/kotlin/flow-lifecycle#backpressure"
  },
  {
    "id": 59,
    "topic": "coroutines",
    "topicLabel": "Kotlin Coroutines",
    "question": "`Channel` trong Kotlin Coroutines dùng để làm gì, khác Flow như thế nào?",
    "options": [
      "Channel là cách tạo cold Flow có buffer",
      "Channel trao đổi phần tử giữa coroutine theo queue/fan-out; Flow là abstraction stream, có cả cold và hot implementations",
      "Channel và Flow hoàn toàn tương đương, chỉ khác API",
      "Channel chỉ dùng để broadcast event, Flow dùng cho data streaming"
    ],
    "correct": 1,
    "explanation": "Không phải mọi Flow đều cold: StateFlow/SharedFlow là hot Flow. Channel dùng send/receive và semantics buffer/consumer riêng; chuyển phần tử không bảo đảm side effect được xử lý exactly-once qua cancellation hoặc process death.",
    "level": "core",
    "docLink": "/foundation/kotlin/coroutines"
  },
  {
    "id": 60,
    "topic": "coroutines",
    "topicLabel": "Kotlin Coroutines",
    "question": "Tại sao tránh dùng `GlobalScope` trong Android?",
    "options": [
      "Vì `GlobalScope` chạy chậm hơn viewModelScope",
      "Vì coroutine trong GlobalScope không bị cancel khi Activity/Fragment/ViewModel bị destroy → memory leak và crash sau khi màn hình đóng",
      "Vì `GlobalScope` không hỗ trợ Dispatchers.Main",
      "Vì Google deprecated GlobalScope từ Kotlin 1.6+"
    ],
    "correct": 1,
    "explanation": "GlobalScope tồn tại suốt lifecycle của process. Coroutine trong GlobalScope không biết về Activity/Fragment lifecycle — khi màn hình bị destroy, coroutine vẫn chạy và có thể: update UI đã null (crash NullPointerException), giữ reference đến View/Context cũ (memory leak), tốn CPU/battery vô nghĩa. Luôn dùng viewModelScope hoặc lifecycleScope.",
    "level": "core",
    "docLink": "/foundation/kotlin/structured-concurrency#scope-ownership"
  },
  {
    "id": 61,
    "topic": "coroutines",
    "topicLabel": "Kotlin Coroutines",
    "question": "`stateIn()` operator dùng để làm gì trong ViewModel?",
    "options": [
      "Chuyển StateFlow thành thông thường Flow để xử lý",
      "Chuyển cold Flow thành StateFlow với initial value và sharing strategy, giúp Flow \"nóng\" lên và chia sẻ được giữa nhiều collector",
      "Đặt giới hạn số lượng collector có thể observe Flow cùng lúc",
      "Freeze giá trị của StateFlow để không thể cập nhật thêm"
    ],
    "correct": 1,
    "explanation": "`someFlow.stateIn(scope, SharingStarted.WhileSubscribed(5000), initialValue)` khởi động Flow khi có collector đầu tiên, dừng sau 5 giây không còn collector (tránh refetch khi rotate). Biến cold Flow (ví dụ từ Room) thành StateFlow để UI có thể observe. WhileSubscribed(5000) là timeout chuẩn cho rotation survival.",
    "level": "core",
    "docLink": "/foundation/kotlin/flow-lifecycle#sharing"
  },
  {
    "id": 62,
    "topic": "coroutines",
    "topicLabel": "Kotlin Coroutines",
    "question": "Sự khác biệt giữa `collect` và `collectLatest` trong Flow?",
    "options": [
      "`collectLatest` chỉ nhận giá trị đầu tiên, `collect` nhận tất cả",
      "`collectLatest`: nếu item mới đến trong khi đang xử lý item cũ → CANCEL item cũ và xử lý item mới. `collect` đợi xử lý xong item cũ rồi mới nhận item mới",
      "`collectLatest` chỉ dùng được với SharedFlow",
      "Hai operator hoàn toàn giống nhau"
    ],
    "correct": 1,
    "explanation": "`collectLatest { }` huỷ block đang chạy nếu có item mới. Hữu ích khi mỗi item trigger tác vụ tốn thời gian (search API call) — nếu user gõ nhanh, chỉ request cuối cùng được hoàn thành. `collect { }` đợi block xử lý xong hoàn toàn trước khi nhận item tiếp theo — có thể tạo backpressure.",
    "level": "core",
    "docLink": "/foundation/kotlin/flow-lifecycle#backpressure"
  },
  {
    "id": 63,
    "topic": "architecture",
    "topicLabel": "Architecture",
    "question": "Dependency Inversion Principle (DIP) trong Clean Architecture là gì?",
    "options": [
      "Các module cấp cao không được phụ thuộc vào module cấp thấp — cả hai phụ thuộc vào abstraction (interface)",
      "Các dependency phải được inject từ bên ngoài, không tự khởi tạo",
      "Module cấp cao luôn có quyền kiểm soát module cấp thấp",
      "Tất cả dependency phải là singleton"
    ],
    "correct": 0,
    "explanation": "DIP: High-level module (UseCase) không import trực tiếp Low-level module (Repository implementation). Thay vào đó, cả hai phụ thuộc vào interface (abstraction). UseCase chỉ biết `interface UserRepository`, không biết `UserRepositoryImpl`. Điều này cho phép swap implementation dễ dàng và unit test với mock.",
    "level": "core",
    "docLink": "/architecture/mvvm"
  },
  {
    "id": 64,
    "topic": "architecture",
    "topicLabel": "Architecture",
    "question": "Hilt và Dagger khác nhau như thế nào trong Android DI?",
    "options": [
      "Hilt chỉ là Dagger với tên gọi khác, không có sự khác biệt thực sự",
      "Hilt là opinionated DI framework built on top of Dagger, tự động generate component theo Android lifecycle, giảm boilerplate đáng kể",
      "Dagger tốt hơn Hilt cho large-scale project",
      "Hilt chỉ dùng được với Kotlin, Dagger dùng được cả Java"
    ],
    "correct": 1,
    "explanation": "Dagger: manual setup các Component, Module, Scope. Rất powerful nhưng boilerplate nhiều. Hilt: build trên Dagger, tự động tạo `@HiltAndroidApp`, `@AndroidEntryPoint`, predefined component (ActivityComponent, ViewModelComponent, ApplicationComponent). Giảm ~70% boilerplate, tích hợp native với ViewModel và WorkManager.",
    "level": "core",
    "docLink": "/architecture/mvvm"
  },
  {
    "id": 65,
    "topic": "architecture",
    "topicLabel": "Architecture",
    "question": "MVI (Model-View-Intent) khác MVVM như thế nào?",
    "options": [
      "MVI dùng cho Compose, MVVM dùng cho XML",
      "Biến thể MVI thường tổ chức action → reducer → immutable state; MVVM cũng có thể dùng cùng các kỹ thuật đó",
      "MVI chậm hơn MVVM vì phải copy state mỗi lần update",
      "MVI và MVVM là hai tên khác nhau cho cùng một pattern"
    ],
    "correct": 1,
    "explanation": "MVI/MVVM có nhiều biến thể. Reducer và immutable state giúp test transition nhưng không tự loại bỏ race, impossible states hoặc mất effect. Policy ordering, request identity, scope và persistence vẫn phải được thiết kế.",
    "level": "core",
    "docLink": "/architecture/mvvm-vs-mvi"
  },
  {
    "id": 66,
    "topic": "data",
    "topicLabel": "Data & Offline",
    "question": "Paging 3 Library giải quyết vấn đề gì? `RemoteMediator` dùng để làm gì?",
    "options": [
      "Paging 3 chỉ giúp load thêm item khi scroll. RemoteMediator không có trong Paging 3",
      "Paging 3 load data theo trang tự động. RemoteMediator là bridge giữa network và local database — implement offline-first bằng cách fetch network → cache vào Room → UI observe từ Room",
      "Paging 3 thay thế RecyclerView bằng cơ chế render riêng",
      "RemoteMediator chỉ dùng khi backend hỗ trợ cursor-based pagination"
    ],
    "correct": 1,
    "explanation": "Paging 3: tự động load data khi user scroll gần cuối list, xử lý loading state, error state, retry. RemoteMediator: khi Room cache hết data (APPEND/PREPEND), tự động fetch từ network, lưu vào Room. UI observe PagingData từ Room → offline-first với seamless online refresh. Pattern: Room là Single Source of Truth.",
    "level": "core",
    "docLink": "/data/paging"
  },
  {
    "id": 67,
    "topic": "architecture",
    "topicLabel": "Architecture",
    "question": "`@HiltViewModel` và `by viewModels()` hoạt động như thế nào cùng nhau?",
    "options": [
      "`@HiltViewModel` chỉ dùng được với `by activityViewModels()`",
      "`@HiltViewModel` cho phép Hilt inject dependency vào ViewModel constructor. `by viewModels()` tạo ViewModel qua HiltViewModelFactory (tự động được inject bởi `@AndroidEntryPoint`)",
      "`by viewModels()` không tương thích với Hilt, phải dùng `ViewModelProvider` thủ công",
      "`@HiltViewModel` bắt buộc ViewModel phải có scope là Singleton"
    ],
    "correct": 1,
    "explanation": "`@HiltViewModel` class UserViewModel @Inject constructor(repo: UserRepository): ViewModel(). Hilt generate HiltViewModelFactory cho Activity/Fragment được annotate `@AndroidEntryPoint`. Khi gọi `by viewModels()`, Kotlin delegate lấy factory này từ Hilt, factory biết cách inject repository vào ViewModel constructor.",
    "level": "core",
    "docLink": "/architecture/mvvm"
  },
  {
    "id": 68,
    "topic": "architecture",
    "topicLabel": "Architecture",
    "question": "Nhận định nào đúng khi thiết kế kiểu trả về của Repository?",
    "options": [
      "Vì `Result<T>` yêu cầu ít memory hơn `T`",
      "Chọn suspend, Flow và kiểu lỗi theo contract; không bắt buộc mọi hàm đều trả Flow<Result<T>>",
      "Vì Kotlin không cho phép throw Exception trong suspend function",
      "Chỉ cần thiết khi dùng RxJava, không áp dụng cho Coroutines"
    ],
    "correct": 1,
    "explanation": "Không có quy tắc luôn dùng Flow<Result<T>>. suspend fun có thể trả một kết quả; Flow<T> phù hợp quan sát thay đổi; Result hoặc sealed type giúp biểu diễn lỗi theo contract. Kotlin Result dùng isSuccess/isFailure, không có Result.Success/Result.Error. Không nuốt CancellationException.",
    "level": "core",
    "docLink": "/architecture/ui-state-events#repository-contract"
  },
  {
    "id": 69,
    "topic": "architecture",
    "topicLabel": "Architecture",
    "question": "Convention: khi nào scope ViewModel theo NavGraph thay vì theo Activity?",
    "options": [
      "Luôn luôn scope theo NavGraph để tiết kiệm memory",
      "NavGraph scope phù hợp state chia sẻ trong một flow; Activity scope phù hợp lifetime của Activity đó, không phải mọi process/app",
      "Scope theo Activity là luôn tốt hơn vì ViewModel sống lâu hơn",
      "NavGraph scoped ViewModel chỉ hoạt động với Single-Activity Architecture"
    ],
    "correct": 1,
    "explanation": "ViewModel gắn với ViewModelStoreOwner. NavGraph-scoped state được clear khi owner bị loại khỏi back stack; Activity-scoped state thuộc Activity, không phải singleton toàn process. Cả hai không tự giữ instance qua process death.",
    "level": "core",
    "docLink": "/architecture/mvvm"
  },
  {
    "id": 70,
    "topic": "architecture",
    "topicLabel": "Architecture",
    "question": "Modularization theo feature (`:feature:login`) vs theo layer (`:data`, `:domain`, `:presentation`) — ưu nhược điểm?",
    "options": [
      "Chỉ có modularization theo feature là đúng, theo layer là sai",
      "Feature/layer/hybrid có tradeoff về ownership, reuse và dependency graph; lợi ích build cần được đo, không tự tăng theo số module",
      "Hai kiểu cho kết quả giống nhau về build time và maintainability",
      "Layer modules phù hợp app nhỏ, Feature modules phù hợp app lớn"
    ],
    "correct": 1,
    "explanation": "Chọn boundary có owner/contract rõ và đo clean/incremental build trước-sau. Modules có overhead configuration/codegen; dynamic delivery cần cấu hình riêng và không tự có chỉ vì đặt tên feature.",
    "level": "core",
    "docLink": "/architecture/modularization#build-evidence"
  },
  {
    "id": 71,
    "topic": "compose",
    "topicLabel": "Jetpack Compose",
    "question": "Khi nào cần dùng `produceState` trong Jetpack Compose?",
    "options": [
      "Để tạo MutableState trong Composable",
      "Để convert non-Compose state source (callback API, Flow, LiveData) thành Compose State có lifecycle, tự động cancel khi Composable rời khỏi composition",
      "Thay thế cho `remember { mutableStateOf() }` khi cần async initialization",
      "Chỉ dùng khi cần share State giữa nhiều Composable khác nhau"
    ],
    "correct": 1,
    "explanation": "`produceState(initialValue) { value = fetchData() }` tạo coroutine scope gắn với Composable lifecycle. Khi Composable leave composition, coroutine bị cancel. Hữu ích để: observe Flow trong Composable không qua ViewModel, wrap callback-based API thành State, handle async initialization với loading state.",
    "level": "core",
    "docLink": "/ui/jetpack-compose"
  },
  {
    "id": 72,
    "topic": "architecture",
    "topicLabel": "Architecture",
    "question": "Kết quả thanh toán cần được UI xử lý sau khi trở lại foreground. Thiết kế nào phù hợp nhất?",
    "options": [
      "Chỉ phát kết quả một lần qua SharedFlow(replay=0), dù UI đang STOPPED",
      "Lưu kết quả vào state có định danh, UI xác nhận sau khi xử lý; persist nếu cần",
      "Dùng `LiveData<Event>` với EventWrapper pattern",
      "Dùng `MutableStateFlow` thông thường, UI tự biết khi nào nên ignore"
    ],
    "correct": 1,
    "explanation": "Biểu diễn kết quả quan trọng bằng state có ID và cơ chế UI xác nhận đã xử lý; persist nếu cần sống qua process death. SharedFlow(replay=0) có thể mất event khi không có subscriber và broadcast tới nhiều subscriber. Channel cũng không tự bảo đảm xử lý exactly-once khi cancellation xảy ra.",
    "level": "core",
    "docLink": "/architecture/ui-state-events#delivery"
  },
  {
    "id": 73,
    "topic": "performance",
    "topicLabel": "Performance",
    "question": "App Startup Library giải quyết vấn đề gì?",
    "options": [
      "Tăng tốc độ download APK từ Play Store",
      "Tổ chức initializer dependencies và tập trung initialization; không tự chuyển việc sang background hay bảo đảm startup nhanh hơn",
      "Tự động lazy-load các màn hình chưa cần đến",
      "Giảm kích thước APK bằng cách defer initialization"
    ],
    "correct": 1,
    "explanation": "App Startup cung cấp Initializer và dependency ordering theo cấu hình. create() không tự trở thành tác vụ bất đồng bộ; vẫn cần đo critical path, defer hợp lý và tránh khởi tạo thư viện hai lần.",
    "level": "core",
    "docLink": "/performance/startup"
  },
  {
    "id": 74,
    "topic": "performance",
    "topicLabel": "Performance",
    "question": "Baseline Profile trong Android giúp gì cho performance?",
    "options": [
      "Tự động detect và fix memory leak",
      "Cung cấp profile cho code path quan trọng để runtime có thể compile/tối ưu sớm hơn theo cơ chế cài đặt được hỗ trợ",
      "Giảm kích thước APK bằng cách xóa unused code",
      "Tăng tốc độ network request"
    ],
    "correct": 1,
    "explanation": "Baseline Profiles cần được generate, package và dùng theo toolchain/runtime hỗ trợ. Đo bằng compilation mode có/không profile; không có mức tăng tốc cố định hoặc thời điểm compile duy nhất cho mọi installer/thiết bị.",
    "level": "core",
    "docLink": "/performance/startup"
  },
  {
    "id": 75,
    "topic": "performance",
    "topicLabel": "Performance",
    "question": "Strict Mode trong Android dùng để làm gì?",
    "options": [
      "Giới hạn số lượng thread có thể tạo trong app",
      "Detect vi phạm trong quá trình development: disk/network access trên Main Thread, Activity leak, unclosed Cursor, untagged network socket",
      "Enforce code style convention trong quá trình build",
      "Kiểm tra security vulnerability trong app"
    ],
    "correct": 1,
    "explanation": "StrictMode.ThreadPolicy: phát hiện disk/network I/O trên Main Thread. StrictMode.VmPolicy: phát hiện Activity/Fragment leak, unclosed SQLite Cursor, file URI exposure. Có thể log, crash, hoặc show dialog khi vi phạm. Chỉ enable trong Debug build (`if (BuildConfig.DEBUG) { StrictMode.enableDefaults() }`).",
    "level": "core",
    "docLink": "/performance/profiling"
  },
  {
    "id": 76,
    "topic": "performance",
    "topicLabel": "Performance",
    "question": "`R8` khác `ProGuard` như thế nào?",
    "options": [
      "R8 chỉ minify tên class/method, ProGuard shrink và optimize thêm",
      "R8 là optimizer trong Android build pipeline cho shrinking, optimization, obfuscation và DEX; không chỉ đổi tên class",
      "ProGuard là open source, R8 là proprietary của Google",
      "R8 và ProGuard cho kết quả giống hệt nhau về kích thước APK"
    ],
    "correct": 1,
    "explanation": "R8 là optimizer mặc định của Android build toolchain, hỗ trợ shrinking, optimization, obfuscation và tạo DEX cùng pipeline Android. R8 dùng nhiều quy tắc keep tương thích ProGuard. Hiệu quả phụ thuộc ứng dụng và cấu hình; không có mức giảm APK cố định cho mọi dự án.",
    "level": "core",
    "docLink": "/performance/profiling"
  },
  {
    "id": 77,
    "topic": "performance",
    "topicLabel": "Performance",
    "question": "Frame drop và Jank xảy ra khi nào trên Android?",
    "options": [
      "Khi app dùng quá nhiều màu sắc trong UI",
      "Khi pipeline render lỡ deadline của frame; nút thắt có thể ở main, RenderThread, GPU hoặc scheduling",
      "Khi app có quá nhiều Activity trong Back Stack",
      "Khi bitmap quá lớn không fit vào bộ nhớ GPU"
    ],
    "correct": 1,
    "explanation": "Jank xuất hiện khi pipeline render lỡ deadline của frame. 60Hz có chu kỳ khoảng 16,7ms, 120Hz khoảng 8,3ms; main thread, RenderThread, GPU hoặc scheduling đều có thể là nút thắt. Dùng Perfetto và frame metrics để xác định thay vì chỉ đếm recomposition.",
    "level": "core",
    "docLink": "/performance/profiling"
  },
  {
    "id": 78,
    "topic": "performance",
    "topicLabel": "Performance",
    "question": "Background work nào sẽ bị ảnh hưởng bởi Doze Mode?",
    "options": [
      "Tất cả background work đều bị Doze block hoàn toàn",
      "Network, alarm và JobScheduler bị hạn chế; WorkManager cũng chịu Doze, không được miễn chỉ vì đã đủ constraints",
      "Chỉ network request bị block, CPU background tasks không bị ảnh hưởng",
      "Doze Mode chỉ ảnh hưởng đến app trong background trên Android 6.0"
    ],
    "correct": 1,
    "explanation": "Doze hạn chế network, wake lock, alarm và trì hoãn JobScheduler, do đó ảnh hưởng cả WorkManager. Công việc được chạy khi hệ thống cho phép. FCM high priority chỉ dành cho nội dung khẩn người dùng nhìn thấy, có thể bị hạ ưu tiên và không bảo đảm delivery.",
    "level": "core",
    "docLink": "/android-core/background-work#guarantees"
  },
  {
    "id": 79,
    "topic": "performance",
    "topicLabel": "Performance",
    "question": "Overdraw trong Android UI là gì và cách kiểm tra?",
    "options": [
      "Overdraw là khi app render nhiều Activity cùng lúc",
      "Overdraw là khi cùng một pixel được vẽ nhiều hơn một lần trong một frame — lãng phí GPU. Kiểm tra bằng Developer Options > Debug GPU Overdraw",
      "Overdraw là thuật ngữ cho app dùng quá nhiều RAM",
      "Overdraw xảy ra khi RecyclerView có quá nhiều ViewType khác nhau"
    ],
    "correct": 1,
    "explanation": "Overdraw: pixel bị vẽ đè nhiều lần (background Activity + background Fragment + background View + content). Developer Options > Debug GPU Overdraw hiển thị màu: xanh (1x) → xanh lam (2x) → hồng (3x) → đỏ (4x+). Tối ưu: xóa background thừa, dùng transparent/no background cho View ở trên cùng, tránh nested background.",
    "level": "core",
    "docLink": "/performance/profiling"
  },
  {
    "id": 80,
    "topic": "performance",
    "topicLabel": "Performance",
    "question": "Cách quản lý Bitmap nào an toàn trên Android hiện đại?",
    "options": [
      "Vì Android 3.0+ có RAM lớn hơn nên không cần quan tâm",
      "Decode theo kích thước hiển thị, để thư viện quản lý cache; không recycle bitmap còn đang được sử dụng",
      "Vì Glide/Coil tự động gọi recycle() khi cần",
      "Vì Android 3.0+ nén bitmap tự động để tiết kiệm RAM"
    ],
    "correct": 1,
    "explanation": "Pixel data nằm ở native heap trên Android 8.0+, khác giai đoạn 3.0–7.1. Hãy giảm kích thước decode, dùng thư viện ảnh quản lý cache/pool và tránh recycle bitmap còn được hiển thị hoặc chia sẻ. Không tự recycle bitmap do thư viện sở hữu.",
    "level": "core",
    "docLink": "/android-core/context-memory#diagnose"
  },
  {
    "id": 81,
    "topic": "performance",
    "topicLabel": "Performance",
    "question": "WorkManager constraint `NetworkType.CONNECTED` vs `NetworkType.UNMETERED` — khi nào dùng cái nào?",
    "options": [
      "Cả hai đều giống nhau, NetworkType.UNMETERED ít được hỗ trợ hơn",
      "CONNECTED yêu cầu mạng kết nối; UNMETERED yêu cầu mạng hệ thống đánh dấu không tính dung lượng, không chỉ dựa vào Wi-Fi",
      "UNMETERED chạy nhanh hơn CONNECTED vì ít overhead hơn",
      "CONNECTED dùng cho foreground task, UNMETERED dùng cho background task"
    ],
    "correct": 1,
    "explanation": "Wi-Fi có thể được đánh dấu metered, nên UNMETERED không đồng nghĩa với Wi-Fi. Constraints là điều kiện lập lịch, không bảo đảm request thành công: vẫn cần xử lý mất mạng, server error và retry có giới hạn.",
    "level": "core",
    "docLink": "/android-core/background-work#retry"
  },
  {
    "id": 82,
    "topic": "performance",
    "topicLabel": "Performance",
    "question": "Cơ chế hoạt động của `RecyclerView.RecycledViewPool` là gì?",
    "options": [
      "Pool lưu data model để tránh fetch lại từ database",
      "Pool lưu các ViewHolder đã được detach, cho phép tái sử dụng giữa nhiều RecyclerView — đặc biệt hữu ích cho nested RecyclerView (horizontal list trong vertical list)",
      "Pool là nơi RecyclerView lưu Bitmap của mỗi item để tái sử dụng",
      "Pool quản lý thread riêng cho mỗi RecyclerView để tăng tốc scroll"
    ],
    "correct": 1,
    "explanation": "RecycledViewPool giữ ViewHolder đã recycled theo ViewType. Khi một RecyclerView cần ViewHolder mới, nó lấy từ pool thay vì inflate layout XML (tốn kém). Nested RecyclerView: tất cả child RecyclerView chia sẻ 1 pool qua `setRecycledViewPool()` → ViewHolder của item được tái sử dụng khi scroll dọc, giảm inflation đáng kể.",
    "level": "core",
    "docLink": "/performance/profiling"
  },
  {
    "id": 83,
    "topic": "general",
    "topicLabel": "General Android",
    "question": "Sự khác biệt giữa `Service`, `IntentService` và `JobIntentService`?",
    "options": [
      "Ba loại hoàn toàn giống nhau, chỉ khác naming convention",
      "Service không tự tạo worker thread; IntentService là API legacy xử lý tuần tự, JobIntentService cũng deprecated — chọn API hiện hành theo use case",
      "IntentService mạnh hơn Service vì có queue riêng",
      "JobIntentService chỉ dùng cho scheduling, không thể thực hiện network request"
    ],
    "correct": 1,
    "explanation": "IntentService và JobIntentService không phải lựa chọn mặc định mới. Service callbacks mặc định trên main; với persistent finite work cân nhắc WorkManager, với công việc người dùng nhận biết dùng API/FGS phù hợp và xét giới hạn phiên bản.",
    "level": "core",
    "docLink": "/android-core/background-work#choose"
  },
  {
    "id": 84,
    "topic": "general",
    "topicLabel": "General Android",
    "question": "BroadcastReceiver `Context.registerReceiver()` vs khai báo trong AndroidManifest khác nhau như thế nào?",
    "options": [
      "Manifest receiver và dynamic receiver có lifetime/cách đăng ký khác nhau; delivery còn chịu loại broadcast, flags và giới hạn phiên bản",
      "Cả hai có khả năng nhận broadcast giống hệt nhau",
      "Manifest receiver nhanh hơn vì được OS cache",
      "Dynamic receiver không thể nhận system broadcast (BOOT_COMPLETED, CONNECTIVITY_CHANGE)"
    ],
    "correct": 0,
    "explanation": "Không phải mọi manifest broadcast đều được giao khi process chưa chạy. Dynamic receiver phụ thuộc registration/context/process lifetime, không chỉ Activity đang foreground. Xét exported flags, permission, implicit broadcast limits và cleanup đúng owner.",
    "level": "core",
    "docLink": "/interview/android-questions"
  },
  {
    "id": 85,
    "topic": "general",
    "topicLabel": "General Android",
    "question": "Content Provider giải quyết vấn đề gì? Khi nào cần implement?",
    "options": [
      "Content Provider là cách duy nhất để lưu data trong Android",
      "Content Provider cung cấp abstraction layer để share data giữa các app khác nhau qua URI interface. Cần implement khi muốn expose data cho app khác hoặc framework (SearchManager, SyncAdapter, FileProvider)",
      "Content Provider chỉ dùng cho database, không phải file",
      "Content Provider tự động sync data với cloud"
    ],
    "correct": 1,
    "explanation": "Content Provider: IPC-safe interface để share data qua content:// URI. Android system dùng nó cho Contacts, Calendar, Media. Implement khi: (1) Share data với app khác (2) Custom search suggestion (SearchProvider) (3) SyncAdapter cho account sync (4) FileProvider để share file URI an toàn. Không cần nếu chỉ dùng trong app mình.",
    "level": "core",
    "docLink": "/interview/android-questions"
  },
  {
    "id": 86,
    "topic": "data",
    "topicLabel": "Data & Offline",
    "question": "Room Database — tại sao không được query Database trên Main Thread?",
    "options": [
      "Vì Room không hỗ trợ query trên Main Thread về mặt kỹ thuật",
      "Query DB là blocking I/O operation có thể mất nhiều milliseconds → block Main Thread → jank hoặc ANR (Application Not Responding) nếu block > 5 giây",
      "Vì SQLite không thread-safe và chỉ hoạt động trên worker thread",
      "Vì Room API chỉ trả về Flow/LiveData, không hỗ trợ synchronous call"
    ],
    "correct": 1,
    "explanation": "SQLite query phụ thuộc vào: kích thước table, chỉ mục (index), complexity của JOIN. Không có thời gian tối thiểu garantee. Worst case: query full scan table 100k rows mất vài giây → ANR. Room mặc định throw `IllegalStateException: Cannot access database on the main thread` để enforce best practice. Luôn dùng `suspend fun`, Flow, hoặc LiveData từ Room.",
    "level": "core",
    "docLink": "/data/room"
  },
  {
    "id": 87,
    "topic": "general",
    "topicLabel": "General Android",
    "question": "Tại sao cần dùng `FileProvider` thay vì `Uri.fromFile()` từ Android 7.0+?",
    "options": [
      "Vì `Uri.fromFile()` bị deprecated và không còn trong API mới",
      "Android 7.0+ enforce FileUriExposedException: không thể share file:// URI giữa các app vì vi phạm security (app khác có thể access path tùy ý). FileProvider tạo content:// URI an toàn với permission kiểm soát",
      "FileProvider nhanh hơn Uri.fromFile() vì dùng memory-mapped file",
      "FileProvider là bắt buộc chỉ khi share với app hệ thống (Camera, Gallery)"
    ],
    "correct": 1,
    "explanation": "Android 7.0 (API 24): `file://` URI khi share qua Intent → `FileUriExposedException`. Lý do bảo mật: URI tiết lộ đường dẫn thực, app nhận có thể access toàn bộ storage của app gửi. FileProvider tạo `content://com.example.fileprovider/...` URI với READ/WRITE permission tạm thời, chỉ app nhận Intent mới có quyền access file đó.",
    "level": "core",
    "docLink": "/interview/android-questions"
  },
  {
    "id": 88,
    "topic": "security",
    "topicLabel": "Security & Privacy",
    "question": "Android Keystore System dùng để làm gì?",
    "options": [
      "Lưu trữ file key-value đơn giản như SharedPreferences",
      "Quản lý cryptographic key và policy sử dụng; hardware backing tùy key/thiết bị, không mặc định mọi key nằm trong StrongBox",
      "Quản lý API key và secret cho network request",
      "Encrypt toàn bộ SharedPreferences tự động"
    ],
    "correct": 1,
    "explanation": "Keystore bảo vệ key material và cung cấp cryptographic operations. Mức bảo vệ/secure hardware cần kiểm tra theo key/device; token/ciphertext được lưu ở storage phù hợp và dữ liệu đã giải mã trong RAM vẫn cần threat model.",
    "level": "core",
    "docLink": "/security/security-model#keystore"
  },
  {
    "id": 89,
    "topic": "data",
    "topicLabel": "Data & Offline",
    "question": "Tại sao `DataStore` được khuyến nghị thay thế `SharedPreferences`?",
    "options": [
      "DataStore nhanh hơn SharedPreferences 10x",
      "DataStore cung cấp API suspend/Flow và transaction update cho dữ liệu nhỏ; không làm app miễn mọi ANR hoặc thay thế Room",
      "SharedPreferences bị deprecated và xóa khỏi API mới",
      "DataStore có thể lưu file và hình ảnh, SharedPreferences chỉ lưu primitive types"
    ],
    "correct": 1,
    "explanation": "Preferences dùng typed keys; typed DataStore dùng Serializer như Proto/JSON theo setup. Một instance đúng cho file, error/corruption policy và migration vẫn cần thiết. Không dùng runBlocking trên main để đọc Flow; SharedPreferences apply có pending disk writes có thể ảnh hưởng lifecycle.",
    "level": "core",
    "docLink": "/data/datastore"
  },
  {
    "id": 90,
    "topic": "general",
    "topicLabel": "General Android",
    "question": "Cơ chế hoạt động của `LiveData` khác `StateFlow` như thế nào trên Android?",
    "options": [
      "LiveData chậm hơn StateFlow vì dùng Java Observable pattern",
      "LiveData: lifecycle-aware tự động (chỉ update khi observer STARTED/RESUMED), tích hợp sẵn với Android. StateFlow: Kotlin-first, cần kết hợp repeatOnLifecycle để lifecycle-safe, linh hoạt hơn trong pipeline operator",
      "StateFlow chỉ dùng được trong ViewModel, LiveData dùng ở mọi nơi",
      "Hai loại hoàn toàn tương đương, chỉ khác syntax"
    ],
    "correct": 1,
    "explanation": "LiveData: aware của Lifecycle tự động — chỉ deliver update khi observer ở STARTED/RESUMED, tự clear observer khi DESTROYED. StateFlow: không aware lifecycle mặc định, cần `repeatOnLifecycle(STARTED)` để có behavior tương tự. StateFlow có lợi thế: operator phong phú (map, filter, combine), không phụ thuộc Android SDK, dễ test thuần Kotlin.",
    "level": "core",
    "docLink": "/foundation/kotlin/flow-lifecycle#collection"
  },
  {
    "id": 91,
    "topic": "general",
    "topicLabel": "General Android",
    "question": "ANR (Application Not Responding) xảy ra khi nào và cách debug?",
    "options": [
      "ANR xảy ra khi app dùng quá nhiều RAM",
      "Khi app không hoàn tất công việc trong timeout của từng loại ANR; dùng reason, thread dumps, Android Vitals và Perfetto để chẩn đoán",
      "ANR chỉ xảy ra trên thiết bị RAM thấp hơn 2GB",
      "ANR được trigger khi app crash với uncaught exception"
    ],
    "correct": 1,
    "explanation": "ANR là nhiều loại timeout; input dispatch thường khoảng 5 giây, broadcast/service có ngưỡng riêng theo phiên bản và trạng thái tiến trình. Xem ANR reason, thread dumps, Android Vitals và Perfetto để tìm lock contention, I/O hoặc CPU bottleneck. Traces không phải lúc nào cũng truy cập được bằng adb pull trên máy production.",
    "level": "core",
    "docLink": "/interview/android-questions"
  },
  {
    "id": 92,
    "topic": "general",
    "topicLabel": "General Android",
    "question": "Cơ chế nào Android dùng để giao tiếp giữa các process khác nhau (IPC)?",
    "options": [
      "Android không hỗ trợ giao tiếp giữa các process",
      "Binder IPC — cơ chế IPC tùy chỉnh của Android, dùng Linux kernel driver. Intents, ContentProvider, AIDL, Messenger, và Services đều build trên Binder",
      "Android dùng POSIX socket giống Linux thông thường",
      "Android dùng shared memory file thông qua /proc filesystem"
    ],
    "correct": 1,
    "explanation": "Binder là IPC backbone của Android. Kernel driver /dev/binder cho phép process A gọi method trực tiếp trên object ở process B với overhead thấp (chỉ 1 memory copy thay vì 2 của IPC truyền thống). AIDL (Android Interface Definition Language) generate stub/proxy code cho Binder. Activity, Service, ContentProvider đều giao tiếp với SystemServer qua Binder.",
    "level": "core",
    "docLink": "/interview/android-questions"
  },
  {
    "id": 93,
    "topic": "general",
    "topicLabel": "General Android",
    "question": "Khác biệt giữa `FLAG_ACTIVITY_NEW_TASK` và `FLAG_ACTIVITY_CLEAR_TOP`?",
    "options": [
      "Cả hai đều có tác dụng giống nhau — start Activity trong Task mới",
      "`NEW_TASK`: start Activity trong Task mới (hoặc Task phù hợp với taskAffinity). `CLEAR_TOP`: nếu Activity đã có trong stack, pop tất cả Activity phía trên nó và bring nó lên top (tương tự singleTask behavior)",
      "`CLEAR_TOP` xóa toàn bộ back stack và restart app",
      "`NEW_TASK` chỉ dùng được từ Service, `CLEAR_TOP` chỉ dùng từ Activity"
    ],
    "correct": 1,
    "explanation": "NEW_TASK: cần khi start Activity từ non-Activity context (Service, BroadcastReceiver) vì không có Task hiện tại. CLEAR_TOP: tìm Activity trong current Task → pop mọi thứ phía trên + recreate hoặc reuse Activity đó. Combine NEW_TASK + CLEAR_TOP: thường dùng để \"đi về home screen\" trong deep link, clear toàn bộ back stack và start MainActivity.",
    "level": "core",
    "docLink": "/interview/android-questions"
  },
  {
    "id": 94,
    "topic": "general",
    "topicLabel": "General Android",
    "question": "Firebase Cloud Messaging (FCM) `data payload` vs `notification payload` — khi nào dùng cái nào?",
    "options": [
      "Cả hai hoàn toàn giống nhau, chỉ khác tên",
      "Notification payload có thể được SDK hiển thị ở background; data payload cho app xử lý khi được giao, chịu giới hạn delivery/background",
      "`data payload` có giới hạn 256 bytes, `notification payload` không giới hạn",
      "`notification payload` chỉ hoạt động khi app đang foreground"
    ],
    "correct": 1,
    "explanation": "Notification message ở background thường được SDK đưa vào system tray; foreground nhận callback. Data message được app xử lý khi được giao, nhưng có thể trễ, hết TTL, bị giới hạn hoặc không được giao. Mixed payload có cách xử lý riêng. Không dùng FCM như nguồn dữ liệu bền vững hay cam kết always-delivered.",
    "level": "core",
    "docLink": "/interview/android-questions"
  },
  {
    "id": 95,
    "topic": "compose",
    "topicLabel": "Jetpack Compose",
    "question": "Jetpack Compose `remember` và `rememberSaveable` khác nhau như thế nào?",
    "options": [
      "`rememberSaveable` chậm hơn `remember` vì serialize data",
      "remember giữ trong composition; rememberSaveable bổ sung saved-state restoration cho dữ liệu phù hợp khi owner/task được phục hồi",
      "`rememberSaveable` chỉ dùng được với primitive types",
      "Hai loại hoàn toàn giống nhau về behavior"
    ],
    "correct": 1,
    "explanation": "rememberSaveable không phải storage dài hạn, không bảo đảm giữ state sau finish/xóa task/force-stop. Dữ liệu nhỏ có thể dùng Saver phù hợp; dữ liệu nghiệp vụ cần giữ lâu hơn phải persist.",
    "level": "core",
    "docLink": "/ui/jetpack-compose"
  },
  {
    "id": 96,
    "topic": "security",
    "topicLabel": "Security & Privacy",
    "question": "Permission runtime (Dangerous Permission) cần xử lý như thế nào đúng chuẩn?",
    "options": [
      "Request permission trong onCreate() ngay khi app khởi động",
      "Xin khi cần tính năng, rationale khi phù hợp, tôn trọng từ chối và cung cấp fallback/Settings theo ngữ cảnh",
      "Dùng `checkSelfPermission()` và request trong onResume()",
      "Khai báo trong AndroidManifest là đủ, không cần runtime check"
    ],
    "correct": 1,
    "explanation": "Kiểm tra permission hiện tại và dùng Activity Result contract phù hợp. shouldShowRequestPermissionRationale=false không tự chứng minh permanently denied vì lần đầu cũng có thể false. Không request lại liên tục hoặc tự mở Settings khi user chưa chọn tiếp tục.",
    "level": "core",
    "docLink": "/security/permissions-components#permissions"
  },
  {
    "id": 97,
    "topic": "security",
    "topicLabel": "Security & Privacy",
    "question": "Deep Link trong Android — `App Link` (verified) khác `Custom Scheme` như thế nào?",
    "options": [
      "App Link dùng https://, Custom Scheme dùng myapp://, không có sự khác biệt về security",
      "App Links dùng HTTPS và xác minh quan hệ domain/app; custom scheme có thể được nhiều app claim, còn input vẫn cần validate/authorize",
      "App Link chỉ hoạt động khi có kết nối internet",
      "Custom Scheme không được phép trong Google Play Store"
    ],
    "correct": 1,
    "explanation": "Digital Asset Links giúp verified routing theo trạng thái hệ thống/user preferences. Verification không chứng minh user có quyền đọc ID trong link, không thay backend authorization và không khiến external input đáng tin cậy.",
    "level": "core",
    "docLink": "/security/permissions-components#app-links"
  },
  {
    "id": 98,
    "topic": "general",
    "topicLabel": "General Android",
    "question": "Khi xây UI hỗ trợ TalkBack, cần chú ý điều gì?",
    "options": [
      "Accessibility chỉ cần thiết cho app của người khuyết tật, app thông thường không cần quan tâm",
      "ContentDescription cho View, importantForAccessibility, live regions cho dynamic content, semantic role, custom action description — giúp TalkBack đọc UI chính xác",
      "Chỉ cần tăng font size là đủ cho Accessibility",
      "Accessibility framework tự động handle tất cả, không cần code thêm"
    ],
    "correct": 1,
    "explanation": "Accessibility cho phép screen reader (TalkBack), switch access, voice access hoạt động. Implementation: `contentDescription` cho Image/Icon. `importantForAccessibility=\"no\"` cho decorative elements. `accessibilityLiveRegion` cho content thay đổi động (loading spinner). Compose: `Modifier.semantics{}`. Custom View: override `onInitializeAccessibilityNodeInfo()`. Test bằng TalkBack và Accessibility Scanner.",
    "level": "core",
    "docLink": "/interview/android-questions"
  },
  {
    "id": 99,
    "topic": "security",
    "topicLabel": "Security & Privacy",
    "question": "Về bảo mật, tại sao không nên log sensitive data trong production?",
    "options": [
      "Vì Log làm chậm app",
      "Log có thể đi vào debug tooling hoặc crash report; token, mật khẩu và PII cần được loại bỏ hoặc che trước khi ghi",
      "Vì Google Play cấm log trong production app",
      "Chỉ cần dùng Log.d() thay vì Log.e() là an toàn"
    ],
    "correct": 1,
    "explanation": "Không đưa token, mật khẩu hoặc PII vào log. Log có thể lọt vào debug tooling, crash report hoặc bị đọc khi thiết bị bị xâm nhập; Android hiện đại giới hạn READ_LOGS nên không phải app nào cũng đọc được toàn bộ Logcat. Redact dữ liệu trước khi log và kiểm tra cấu hình release/crash reporting.",
    "level": "core",
    "docLink": "/security/security-model#session"
  },
  {
    "id": 100,
    "topic": "compose",
    "topicLabel": "Jetpack Compose",
    "question": "Khi strong skipping được bật, nhận định nào đúng với restartable Composable có unstable parameter?",
    "options": [
      "Mọi Composable luôn recompose khi parent recompose",
      "Có thể được skip: unstable parameter so sánh bằng identity, stable parameter bằng equals, nếu không có invalidation cần chạy lại",
      "Composable chỉ recompose khi được gọi explicit bằng invalidate()",
      "Composable không bao giờ skip recompose để đảm bảo UI luôn up-to-date"
    ],
    "correct": 1,
    "explanation": "Strong skipping mặc định bật từ Kotlin 2.0.20: restartable Composable có unstable parameter vẫn có thể được skip. Unstable parameter so sánh bằng identity (===), stable parameter bằng equals. State được đọc bị invalidated vẫn có thể kích hoạt recomposition. @Stable/@Immutable là contract cần đúng, không phải công tắc sửa mọi lỗi hiệu năng.",
    "level": "core",
    "docLink": "/ui/jetpack-compose#strong-skipping"
  }
];
