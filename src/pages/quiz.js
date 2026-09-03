import React, { useState, useEffect, useCallback, useRef } from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

// ─── Question Bank ──────────────────────────────────────────────────────────

const ALL_QUESTIONS = [
  // ── Activity & Fragment ──
  {
    id: 1,
    topic: 'activity',
    topicLabel: 'Activity & Fragment',
    question: 'Thứ tự lifecycle chính xác khi mở Activity B từ Activity A là gì?',
    options: [
      'A.onPause → B.onCreate → B.onStart → B.onResume → A.onStop',
      'A.onStop → B.onCreate → B.onStart → B.onResume → A.onPause',
      'A.onPause → A.onStop → B.onCreate → B.onStart → B.onResume',
      'B.onCreate → A.onPause → B.onStart → B.onResume → A.onStop',
    ],
    correct: 0,
    explanation: 'A.onPause() được gọi trước để Activity A nhường foreground. Chỉ sau khi B vẽ xong frame đầu tiên, A mới chuyển sang onStop() để tránh màn hình đen.',
  },
  {
    id: 2,
    topic: 'activity',
    topicLabel: 'Activity & Fragment',
    question: 'Sự khác biệt giữa `add()` và `replace()` trong FragmentTransaction là gì?',
    options: [
      '`add()` xóa Fragment cũ, `replace()` giữ Fragment cũ bên dưới',
      '`replace()` xóa Fragment cũ trong container, `add()` giữ Fragment cũ bên dưới',
      'Hai hàm hoàn toàn giống nhau, chỉ khác tên gọi',
      '`add()` dùng cho Fragment chính, `replace()` dùng cho Dialog Fragment',
    ],
    correct: 1,
    explanation: '`replace()` xóa toàn bộ Fragment hiện có trong container trước khi thêm Fragment mới. `add()` chỉ chèn thêm Fragment mới chồng lên, Fragment cũ vẫn tồn tại bên dưới.',
  },
  {
    id: 3,
    topic: 'activity',
    topicLabel: 'Activity & Fragment',
    question: 'Tại sao phải kiểm tra `savedInstanceState == null` trước khi add Fragment trong `onCreate()`?',
    options: [
      'Vì `savedInstanceState` có thể null khi không có dữ liệu cần lưu',
      'Để tránh Fragment Overlapping — FragmentManager tự restore Fragment cũ khi Activity recreate',
      'Vì `add()` chỉ hoạt động khi savedInstanceState là null',
      'Không cần thiết, đây chỉ là best practice không bắt buộc',
    ],
    correct: 1,
    explanation: 'Khi Activity bị recreate (xoay màn hình), FragmentManager tự động restore lại Fragment cũ từ savedInstanceState. Nếu không kiểm tra, Fragment mới sẽ được add đè lên Fragment đã được restore, gây ra Fragment Overlapping.',
  },
  {
    id: 4,
    topic: 'activity',
    topicLabel: 'Activity & Fragment',
    question: 'Tại sao `commitNow()` không thể kết hợp với `addToBackStack()`?',
    options: [
      'Vì `commitNow()` quá nhanh, BackStack không theo kịp',
      'Để tránh đảo lộn thứ tự tuyến tính của BackStack khi có transaction đang xếp hàng',
      'Vì `addToBackStack()` chỉ hoạt động với `commit()` bất đồng bộ',
      '`commitNow()` không hỗ trợ tính năng BackStack',
    ],
    correct: 1,
    explanation: 'Các transaction submit qua `commit()` nằm trong Message Queue, chờ thực thi bất đồng bộ. Nếu `commitNow()` thêm vào BackStack ngay lập tức, nó sẽ chen ngang vào trước các transaction đang xếp hàng, phá vỡ thứ tự LIFO.',
  },
  {
    id: 5,
    topic: 'activity',
    topicLabel: 'Activity & Fragment',
    question: 'Khi Fragment được đưa vào BackStack, điều gì xảy ra với vòng đời của nó?',
    options: [
      'Fragment bị hủy hoàn toàn (onDestroy được gọi)',
      'Fragment bị tạm dừng (onPause được gọi)',
      'View bị hủy (onDestroyView), nhưng Fragment instance vẫn còn sống',
      'Fragment bị detach khỏi Activity (onDetach được gọi)',
    ],
    correct: 2,
    explanation: 'Fragment có 2 vòng đời tách biệt. Khi vào BackStack, chỉ View lifecycle kết thúc (onDestroyView) để giải phóng bộ nhớ UI. Instance Fragment vẫn sống để giữ trạng thái. Khi user back, onCreateView được gọi lại.',
  },
  {
    id: 6,
    topic: 'activity',
    topicLabel: 'Activity & Fragment',
    question: 'Sử dụng `show()`/`hide()` thay vì `replace()` cho BottomNavigationView có ưu điểm gì?',
    options: [
      'Tiết kiệm RAM vì không giữ Fragment trong bộ nhớ',
      'Giữ nguyên 100% trạng thái UI (scroll position, input) khi chuyển tab',
      'Tốc độ animation chuyển tab nhanh hơn',
      'Tự động xử lý BackStack phức tạp hơn',
    ],
    correct: 1,
    explanation: '`show()`/`hide()` không trigger lifecycle nên View không bị hủy và tạo lại. Điều này giúp giữ nguyên scroll position, text đã nhập,... Nhược điểm là tốn RAM vì giữ tất cả View hierarchy trong bộ nhớ.',
  },
  {
    id: 7,
    topic: 'activity',
    topicLabel: 'Activity & Fragment',
    question: '`IllegalStateException: Can not perform this action after onSaveInstanceState` xảy ra khi nào?',
    options: [
      'Khi gọi `commit()` trên một thread khác Main Thread',
      'Khi gọi `commit()` sau khi Activity đã gọi `onSaveInstanceState()`',
      'Khi Fragment chưa được attach vào Activity',
      'Khi sử dụng `commitNow()` thay vì `commit()`',
    ],
    correct: 1,
    explanation: 'Sau khi onSaveInstanceState() được gọi, Android đã "chụp" trạng thái UI. Nếu commit() sau thời điểm này, transaction sẽ không được lưu vào Bundle. Khi restore, UI sẽ mất transaction đó (State Loss). Android ném Exception để bảo vệ tính toàn vẹn dữ liệu.',
  },
  {
    id: 8,
    topic: 'activity',
    topicLabel: 'Activity & Fragment',
    question: 'Tại sao `setRetainInstance(true)` bị deprecated?',
    options: [
      'Vì nó chậm hơn ViewModel trong mọi trường hợp',
      'Vì nó không giải quyết được Process Death và có nguy cơ Memory Leak cao',
      'Vì API mới hơn đã thay thế hoàn toàn tính năng này',
      'Vì nó chỉ hoạt động trên Android API < 28',
    ],
    correct: 1,
    explanation: '`setRetainInstance(true)` chỉ sống sót qua Configuration Change, hoàn toàn vô dụng khi OS kill process. Hơn nữa, nếu Fragment giữ reference tới Context hoặc View, toàn bộ Activity cũ bị giữ trong RAM → Memory Leak nghiêm trọng. ViewModel giải quyết tốt hơn cả hai vấn đề này.',
  },
  {
    id: 9,
    topic: 'activity',
    topicLabel: 'Activity & Fragment',
    question: 'Khi Activity B là dạng Dialog/Translucent đè lên Activity A, điều gì KHÔNG xảy ra?',
    options: [
      'A.onPause() được gọi',
      'B.onResume() được gọi',
      'A.onStop() được gọi',
      'B.onCreate() được gọi',
    ],
    correct: 2,
    explanation: 'A.onStop() KHÔNG được gọi vì A vẫn còn một phần hiển thị phía sau Dialog/Translucent B. onStop() chỉ được gọi khi Activity bị che khuất HOÀN TOÀN bởi Activity khác.',
  },
  {
    id: 10,
    topic: 'activity',
    topicLabel: 'Activity & Fragment',
    question: 'Cách đúng để observe LiveData/Flow trong Fragment là gì?',
    options: [
      'viewModel.data.observe(this) { ... } — dùng Fragment instance làm LifecycleOwner',
      'viewModel.data.observe(viewLifecycleOwner) { ... } — dùng View lifecycle',
      'viewModel.data.observe(requireActivity()) { ... } — dùng Activity lifecycle',
      'Có thể dùng cả 3 cách, không có sự khác biệt đáng kể',
    ],
    correct: 1,
    explanation: 'Dùng `viewLifecycleOwner` để gắn Observer với vòng đời View (onCreateView → onDestroyView). Nếu dùng `this` (Fragment instance), Observer tồn tại qua cả onDestroyView, và mỗi lần pop BackStack sẽ add thêm Observer mới → duplicate callbacks, memory leak.',
  },

  // ── Kotlin Coroutines ──
  {
    id: 11,
    topic: 'coroutines',
    topicLabel: 'Kotlin Coroutines',
    question: 'Khi gọi `launch {}` với `CoroutineStart.DEFAULT`, block code bên trong có chạy ngay lập tức không?',
    options: [
      'Có, chạy ngay lập tức trên thread hiện tại',
      'Không, được lập lịch vào queue của Dispatcher và chạy khi Dispatcher sẵn sàng',
      'Không, chỉ chạy khi gọi `.start()` hoặc `.join()`',
      'Có, nhưng trên một thread mới được tạo ra',
    ],
    correct: 1,
    explanation: 'CoroutineStart.DEFAULT là mặc định. Coroutine được gửi vào queue của Dispatcher và thực thi khi Main Thread (hoặc Worker Thread) rảnh rỗi. Thứ tự: A → C → B (B là code trong launch block) khi chạy trên Dispatcher.Main.',
  },
  {
    id: 12,
    topic: 'coroutines',
    topicLabel: 'Kotlin Coroutines',
    question: 'Sự khác biệt giữa `Job` và `SupervisorJob` là gì?',
    options: [
      '`SupervisorJob` chạy nhanh hơn `Job` thông thường',
      'Với `Job`, nếu 1 child fail thì HỦY toàn bộ. Với `SupervisorJob`, child fail không ảnh hưởng sibling',
      '`Job` dùng cho IO tasks, `SupervisorJob` dùng cho CPU tasks',
      '`SupervisorJob` tự động retry khi child coroutine fail',
    ],
    correct: 1,
    explanation: 'Với `Job` (mặc định): lỗi từ child lan truyền lên parent → hủy tất cả child khác. Với `SupervisorJob`: mỗi child chịu trách nhiệm lỗi của chính nó, không ảnh hưởng sibling. Dùng SupervisorJob khi các task song song độc lập nhau (tải nhiều file riêng biệt).',
  },
  {
    id: 13,
    topic: 'coroutines',
    topicLabel: 'Kotlin Coroutines',
    question: '`Dispatchers.IO` và `Dispatchers.Default` khác nhau như thế nào?',
    options: [
      '`IO` dùng thread riêng, `Default` dùng Main Thread',
      '`IO` tối ưu cho Network/Disk (pool mở rộng tới 64 thread), `Default` tối ưu cho CPU-intensive (giới hạn bằng số CPU core)',
      '`IO` là bất đồng bộ, `Default` là đồng bộ',
      'Hai loại hoàn toàn giống nhau, chỉ khác tên',
    ],
    correct: 1,
    explanation: 'Dispatchers.IO dùng shared thread pool có thể mở rộng lên tới 64 thread, phù hợp cho blocking I/O (network, database). Dispatchers.Default giới hạn số thread bằng CPU cores, phù hợp cho tính toán nặng (sort, JSON parsing). Cả hai chia sẻ chung CoroutineScheduler.',
  },
  {
    id: 14,
    topic: 'coroutines',
    topicLabel: 'Kotlin Coroutines',
    question: 'Bản chất của `suspend function` trong Kotlin là gì?',
    options: [
      'Là function chạy trên một thread riêng biệt',
      'Là function sử dụng CPS (Continuation-Passing Style) và State Machine được Kotlin Compiler sinh ra',
      'Là function có thể bị tạm dừng mà không block thread, nhờ callback pattern',
      'Là function đặc biệt của Kotlin runtime, không liên quan đến JVM',
    ],
    correct: 1,
    explanation: 'Kotlin Compiler biến suspend function thành function thường với tham số `Continuation` ở cuối. Bên trong, compiler sinh ra State Machine (switch-case với labels). Khi suspend, lưu state và return. Khi resume, gọi continuation.resumeWith() để tiếp tục từ label tiếp theo.',
  },
  {
    id: 15,
    topic: 'coroutines',
    topicLabel: 'Kotlin Coroutines',
    question: 'Tại sao `launchWhenStarted` bị deprecated và nên dùng gì thay thế?',
    options: [
      'Vì `launchWhenStarted` quá chậm, thay bằng `lifecycleScope.launch`',
      'Vì khi app về background, coroutine chỉ *suspend* chứ không bị cancel → producer Flow vẫn chạy ngầm. Dùng `repeatOnLifecycle` thay thế',
      'Vì `launchWhenStarted` không tương thích với Flow, chỉ dùng được với LiveData',
      'Vì nó gây crash trên Android 12+ do thay đổi API',
    ],
    correct: 1,
    explanation: '`launchWhenStarted` khi app xuống background (STOPPED) chỉ suspend coroutine, không cancel. Flow producer tiếp tục bắn event vào buffer lãng phí tài nguyên. `repeatOnLifecycle` sẽ CANCEL coroutine khi lifecycle xuống dưới target state và START lại khi quay lên, an toàn hoàn toàn.',
  },
  {
    id: 16,
    topic: 'coroutines',
    topicLabel: 'Kotlin Coroutines',
    question: 'Để gọi 2 API song song và đợi cả 2 kết quả, dùng cách nào?',
    options: [
      'Dùng 2 lệnh `launch` riêng biệt và `join()` từng cái',
      'Dùng `async/await` trong `coroutineScope {}` để gọi song song và collect kết quả',
      'Dùng `withContext(Dispatchers.IO)` lồng nhau',
      'Dùng `runBlocking` để đợi từng request tuần tự',
    ],
    correct: 1,
    explanation: '`async {}` trả về `Deferred<T>`, khởi chạy coroutine song song. Gọi `await()` để lấy kết quả và tự động đợi. Bọc trong `coroutineScope {}` để đảm bảo nếu 1 task fail, task kia cũng bị cancel. Đây là pattern chuẩn cho parallel API calls.',
  },
  {
    id: 17,
    topic: 'coroutines',
    topicLabel: 'Kotlin Coroutines',
    question: '`CancellationException` có gì đặc biệt trong Coroutines?',
    options: [
      'Nó là exception nghiêm trọng nhất, cần xử lý ngay lập tức',
      'Nó báo hiệu coroutine đã bị hủy, bị CoroutineExceptionHandler bỏ qua và không nên bị "nuốt" trong catch block',
      'Nó tự động retry coroutine sau khi bị cancel',
      'Nó chỉ xảy ra khi job.cancel() được gọi từ thread khác',
    ],
    correct: 1,
    explanation: 'CancellationException là tín hiệu đặc biệt báo coroutine đã bị hủy. CoroutineExceptionHandler cố tình bỏ qua nó. Không bao giờ swallow nó trong `catch (e: Exception)` vì sẽ ngăn coroutine dừng đúng cách và gây resource leak.',
  },
  {
    id: 18,
    topic: 'coroutines',
    topicLabel: 'Kotlin Coroutines',
    question: '`CoroutineStart.UNDISPATCHED` hoạt động như thế nào?',
    options: [
      'Giống `DEFAULT`, nhưng bắt đầu trên Main Thread',
      'Chạy ngay lập tức trên thread hiện tại đến suspension point đầu tiên, sau đó resume trên Dispatcher được chỉ định',
      'Không dispatch sang bất kỳ thread nào, luôn chạy trên thread gọi launch',
      'Tương đương `CoroutineStart.LAZY` nhưng không cần gọi `.start()`',
    ],
    correct: 1,
    explanation: 'UNDISPATCHED chạy NGAY trên thread hiện tại đến suspension point đầu tiên (khác DEFAULT bị lập lịch vào queue). Sau khi resume từ suspension, nó chạy trên Dispatcher được chỉ định. Hữu ích khi cần side effect ngay lập tức trước điểm suspend đầu tiên.',
  },
  {
    id: 19,
    topic: 'coroutines',
    topicLabel: 'Kotlin Coroutines',
    question: 'Phép `+` trong `CoroutineContext = Dispatchers.IO + SupervisorJob() + CoroutineName("X")` làm gì?',
    options: [
      'Cộng số lượng thread của các Dispatcher lại với nhau',
      'Merge các Element vào một CoroutineContext, element sau ghi đè element cùng loại trước đó',
      'Tạo ra một chain các coroutine thực thi tuần tự',
      'Chỉ là syntax sugar, không có tác dụng thực sự',
    ],
    correct: 1,
    explanation: 'CoroutineContext là một map đặc biệt với key là loại Element (Job, Dispatcher, Name,...). Toán tử `+` merge hai Context lại, với element cùng key từ phía phải sẽ ghi đè phía trái. Kết quả là một Context chứa tất cả các Element không trùng key.',
  },
  {
    id: 20,
    topic: 'coroutines',
    topicLabel: 'Kotlin Coroutines',
    question: 'Làm thế nào để tránh gọi API trùng lặp khi user spam nút "Refresh"?',
    options: [
      'Dùng `Thread.sleep()` để throttle',
      'Kiểm tra state Loading, hoặc hủy Job cũ trước khi tạo Job mới, hoặc dùng Flow throttleFirst()',
      'Tắt nút Refresh bằng `button.isEnabled = false` trong toàn bộ thời gian chờ',
      'Dùng `synchronized {}` để lock request',
    ],
    correct: 1,
    explanation: 'Ba giải pháp phổ biến: (1) Kiểm tra nếu state đang Loading thì return sớm. (2) Hủy Job cũ (`refreshJob?.cancel()`) trước khi tạo Job mới — hay dùng cho SearchBar. (3) Dùng Flow với throttleFirst() operator để chỉ nhận event đầu tiên trong window thời gian.',
  },

  // ── Architecture ──
  {
    id: 21,
    topic: 'architecture',
    topicLabel: 'Architecture',
    question: 'Unidirectional Data Flow (UDF) trong MVVM yêu cầu điều gì?',
    options: [
      'Data phải đi từ View → ViewModel → Repository và ngược lại theo cùng 1 đường',
      'State chỉ chảy xuống (View nhận State), Events chỉ đi lên (View gửi Event lên ViewModel)',
      'Tất cả data phải được serialize trước khi truyền giữa các layer',
      'ViewModel phải observe trực tiếp từ Database, không qua Repository',
    ],
    correct: 1,
    explanation: 'UDF: Events đi LÊN (UI → ViewModel → Repository), State đi XUỐNG (Repository → ViewModel → UI). UI không bao giờ tự ý thay đổi state, chỉ gửi intent lên ViewModel. ViewModel là single source of truth qua StateFlow<UiState>.',
  },
  {
    id: 22,
    topic: 'architecture',
    topicLabel: 'Architecture',
    question: 'Trong Clean Architecture, UseCase (Interactor) đóng vai trò gì?',
    options: [
      'Là layer giao tiếp trực tiếp với API và Database',
      'Đóng gói một nghiệp vụ cụ thể (business rule), cô lập ViewModel khỏi các thay đổi của data layer',
      'Là interface giữa Fragment và Activity',
      'Quản lý UI state và lifecycle của màn hình',
    ],
    correct: 1,
    explanation: 'UseCase chứa business logic thuần túy, không phụ thuộc vào Android SDK. Mỗi UseCase làm DUY NHẤT một việc (Single Responsibility). Nó giúp ViewModel gọn hơn, dễ test hơn, và thay đổi data source không ảnh hưởng đến business logic.',
  },
  {
    id: 23,
    topic: 'architecture',
    topicLabel: 'Architecture',
    question: 'ViewModel được thiết kế để sống sót qua sự kiện nào?',
    options: [
      'System Process Death (OS kill app ở background)',
      'Configuration Change (xoay màn hình, đổi language)',
      'Cả hai — Configuration Change lẫn Process Death',
      'Không sự kiện nào — ViewModel bị hủy khi Activity bị destroy',
    ],
    correct: 1,
    explanation: 'ViewModel CHỈ sống sót qua Configuration Change (xoay màn hình, đổi ngôn ngữ) vì được lưu trong ViewModelStore, tách rời khỏi Activity instance. Khi OS kill process (System Process Death), toàn bộ RAM bị clear kể cả ViewModel. Phải dùng SavedStateHandle để chống Process Death.',
  },
  {
    id: 24,
    topic: 'architecture',
    topicLabel: 'Architecture',
    question: '`SavedStateHandle` trong ViewModel giải quyết vấn đề gì mà `ViewModel` thông thường không làm được?',
    options: [
      'Lưu state qua Configuration Change (xoay màn hình)',
      'Lưu state qua System-Initiated Process Death (OS kill app ở background)',
      'Chia sẻ data giữa nhiều Fragment khác nhau',
      'Tự động persist data vào local database',
    ],
    correct: 1,
    explanation: 'ViewModel thông thường chỉ sống qua config change. SavedStateHandle serialize data vào OS Bundle (giống onSaveInstanceState) nên sống sót được cả khi OS kill process để lấy RAM. Khi user mở lại app từ Recent Tasks, state được restore chính xác.',
  },
  {
    id: 25,
    topic: 'architecture',
    topicLabel: 'Architecture',
    question: 'Repository Pattern giải quyết vấn đề gì trong Android Architecture?',
    options: [
      'Tăng tốc độ truy vấn Database bằng caching tự động',
      'Cung cấp một API thống nhất cho data layer, ViewModel không cần biết data đến từ Network hay Local DB',
      'Giúp Activity và Fragment giao tiếp với nhau dễ dàng hơn',
      'Quản lý vòng đời của network request',
    ],
    correct: 1,
    explanation: 'Repository là "single source of truth" cho data. Nó quyết định lấy data từ đâu (cache, network, database) mà ViewModel không cần biết. Giúp code dễ test (mock Repository), dễ thay đổi data source mà không ảnh hưởng business logic.',
  },
  {
    id: 26,
    topic: 'architecture',
    topicLabel: 'Architecture',
    question: 'Trong Multi-Module Architecture, làm thế nào để Feature A navigate sang Feature B mà không gây Circular Dependency?',
    options: [
      'Feature A implementation Feature B trực tiếp',
      'Dùng Deep Link navigation hoặc Navigation Interface Pattern với shared :core:navigation module',
      'Dùng Event Bus global để truyền navigation event',
      'Luôn navigate qua Activity thay vì Fragment',
    ],
    correct: 1,
    explanation: 'Hai giải pháp: (1) Deep Link — Feature A navigate bằng URL "myapp://featureB/screen". (2) Interface Pattern — định nghĩa `interface FeatureBNavigator` trong :core:navigation. Module :app implement interface và inject vào Feature A qua Hilt. Feature A chỉ gọi interface, không biết chi tiết Feature B.',
  },
  {
    id: 27,
    topic: 'architecture',
    topicLabel: 'Architecture',
    question: '`StateFlow` vs `SharedFlow` — khi nào dùng cái nào?',
    options: [
      '`StateFlow` cho events (navigation, snackbar), `SharedFlow` cho state (loading, data)',
      '`StateFlow` cho state UI (có initial value, giữ last value), `SharedFlow` cho one-time events (navigation, snackbar)',
      'Hai loại hoàn toàn giống nhau, chỉ khác syntax',
      '`StateFlow` dùng trong ViewModel, `SharedFlow` dùng trong Repository',
    ],
    correct: 1,
    explanation: 'StateFlow luôn có 1 giá trị hiện tại và new collector nhận ngay giá trị cuối cùng — phù hợp cho UI State. SharedFlow linh hoạt hơn, có thể cấu hình replay, phù hợp cho one-shot events (navigation, show snackbar) mà không nên replay khi screen rotate.',
  },
  {
    id: 28,
    topic: 'architecture',
    topicLabel: 'Architecture',
    question: 'Single-Activity Architecture có ưu điểm gì so với Multi-Activity Architecture?',
    options: [
      'Dễ code hơn vì không cần Fragment',
      'Chia sẻ data dễ hơn (ViewModel scoped theo Activity), transition mượt hơn, navigation tập trung qua Jetpack Navigation',
      'Bảo mật hơn vì ít Activity hơn',
      'Tốc độ khởi chạy app nhanh hơn',
    ],
    correct: 1,
    explanation: 'Single-Activity: (1) Chia sẻ data qua Activity-scoped ViewModel thay vì serialize qua Intent Bundle (giới hạn ~1MB). (2) Transition animation mượt mà hơn (Shared Element, Fragment Transition). (3) Navigation tập trung dễ quản lý Deep Link và BackStack. (4) Ít overhead hơn (không tạo Window mới cho mỗi màn hình).',
  },

  // ── Performance ──
  {
    id: 29,
    topic: 'performance',
    topicLabel: 'Performance',
    question: 'Tại sao phải null hóa ViewBinding trong `onDestroyView()` của Fragment?',
    options: [
      'Để tránh crash khi binding được dùng sau khi View bị destroy',
      'Để GC có thể thu hồi toàn bộ View hierarchy — Fragment instance tồn tại qua onDestroyView nhưng View thì không',
      'Vì Docusaurus yêu cầu null hóa resource khi không dùng',
      'Chỉ cần thiết khi Fragment dùng RecyclerView',
    ],
    correct: 1,
    explanation: 'Fragment instance sống qua onDestroyView (ví dụ khi vào BackStack), nhưng View đã bị GC. Nếu giữ reference đến ViewBinding (chứa reference đến tất cả Views), toàn bộ View hierarchy bị "ghim" trong RAM không được GC thu hồi → Memory Leak nghiêm trọng.',
  },
  {
    id: 30,
    topic: 'performance',
    topicLabel: 'Performance',
    question: 'Cách giả lập System Process Death chính xác nhất trong quá trình phát triển?',
    options: [
      'Nhấn nút Stop ▪ trong Android Studio',
      'Dùng Force Stop trong Settings > Apps',
      'Nhấn Home → chạy `adb shell am kill <package_name>` → mở lại từ Recent Tasks',
      'Tắt thiết bị và bật lại',
    ],
    correct: 2,
    explanation: 'Stop trong Android Studio = Force Stop (xóa cả saved state). Force Stop trong Settings cũng vậy. `am kill` chỉ kill process khi app ở background (giống Low Memory Killer) và GIỮ saved state. Sau đó mở từ Recent Tasks để test restoration. Đây là cách duy nhất mô phỏng chính xác behavior của LMK.',
  },
  {
    id: 31,
    topic: 'performance',
    topicLabel: 'Performance',
    question: 'Tool nào tốt nhất để detect Memory Leak trong quá trình phát triển?',
    options: [
      'Android Profiler → CPU Profiler',
      'LeakCanary (tự động phát hiện và báo cáo leak với GC root trace)',
      'Strict Mode với penaltyLog()',
      'ADB logcat với tag "GC"',
    ],
    correct: 1,
    explanation: 'LeakCanary là thư viện chuyên biệt: tự động detect khi Activity/Fragment không được GC sau onDestroy/onDestroyView, dump Heap, phân tích GC root chain và hiển thị notification chi tiết. Không cần thao tác thủ công. Android Memory Profiler dùng để investigate sau khi suspect có leak.',
  },
  {
    id: 32,
    topic: 'performance',
    topicLabel: 'Performance',
    question: 'Sự khác biệt giữa Memory Cache và Disk Cache trong image loading (Glide/Coil)?',
    options: [
      'Memory Cache lưu compressed images, Disk Cache lưu decoded Bitmaps',
      'Memory Cache (L1): Bitmap đã decode trong RAM → instant access. Disk Cache (L2): encoded image trên disk → đọc và decode khi cache miss',
      'Memory Cache là persistent (sống qua app restart), Disk Cache là temporary',
      'Không có sự khác biệt thực sự, chỉ là thuật ngữ khác nhau',
    ],
    correct: 1,
    explanation: 'Memory Cache (L1) giữ Bitmap đã decode sẵn trong RAM (LRU policy) → instant display khi scroll qua ảnh đã xem. Disk Cache (L2) giữ image file (JPEG/WebP) trên storage → đọc file + decode khi memory cache miss, nhưng nhanh hơn download lại từ network.',
  },
  {
    id: 33,
    topic: 'performance',
    topicLabel: 'Performance',
    question: 'Tại sao không nên thực hiện tác vụ nặng (lưu DB, serialize data) trong `onPause()`?',
    options: [
      'Vì `onPause()` không đảm bảo sẽ được gọi',
      'Vì `onPause()` chạy trước `onCreate()` của Activity tiếp theo, làm chậm thời gian mở màn hình mới',
      'Vì không có permission đọc/ghi trong `onPause()`',
      'Vì `onPause()` chỉ được gọi trên background thread',
    ],
    correct: 1,
    explanation: 'Thứ tự lifecycle: A.onPause → B.onCreate → B.onStart → B.onResume → A.onStop. Nếu onPause() mất 200ms vì lưu DB, user phải chờ thêm 200ms trước khi B bắt đầu load → cảm giác app bị freeze/jank. Nên thực hiện tác vụ nặng trong onStop() hoặc trên background thread.',
  },
  {
    id: 34,
    topic: 'performance',
    topicLabel: 'Performance',
    question: '`DiffUtil` trong RecyclerView giúp gì về performance?',
    options: [
      'Tăng tốc độ render mỗi item trong RecyclerView',
      'Tính toán sự khác biệt giữa 2 list trên background thread và chỉ animate những item thực sự thay đổi',
      'Tự động load thêm item khi scroll đến cuối list (Pagination)',
      'Cache ViewHolder để tránh tạo mới khi scroll',
    ],
    correct: 1,
    explanation: 'DiffUtil dùng Eugene W. Myers\'s diff algorithm để so sánh old list và new list, tìm các thao tác tối thiểu (insert, remove, move, change). Chỉ animate/rebind những item thực sự thay đổi thay vì `notifyDataSetChanged()` reload toàn bộ list — tránh jank khi thêm page mới vào list.',
  },

  // ── General Android ──
  {
    id: 35,
    topic: 'general',
    topicLabel: 'General Android',
    question: 'Sự khác biệt giữa Application Context và Activity Context là gì?',
    options: [
      'Application Context tồn tại lâu hơn, gắn với vòng đời toàn bộ app process; Activity Context gắn với vòng đời Activity',
      'Application Context dùng cho UI, Activity Context dùng cho background tasks',
      'Application Context mạnh hơn, có thể thay thế hoàn toàn Activity Context',
      'Không có sự khác biệt về chức năng, chỉ khác scope',
    ],
    correct: 0,
    explanation: 'Application Context sống suốt vòng đời app (dùng cho singleton, Room database). Activity Context có theme, style của màn hình hiện tại (dùng cho inflate layout, Dialog, Toast). Dùng Application Context trong singleton tránh memory leak vì không giữ reference đến Activity.',
  },
  {
    id: 36,
    topic: 'general',
    topicLabel: 'General Android',
    question: 'WorkManager khác gì so với Foreground Service?',
    options: [
      'WorkManager chạy trên Main Thread, Foreground Service chạy trên Background Thread',
      'WorkManager: deferrable guaranteed work (sync DB, upload log). Foreground Service: user-aware long running work cần notification (play music, GPS tracking)',
      'WorkManager chỉ dùng được khi có WiFi, Foreground Service dùng mọi điều kiện',
      'Foreground Service cần user permission, WorkManager thì không',
    ],
    correct: 1,
    explanation: 'WorkManager: đảm bảo task hoàn thành kể cả app restart/kill, deferrable, có thể đặt điều kiện (network, charging). Foreground Service: dành cho task user đang chủ động aware (music player, workout tracker) cần notification liên tục, có thể bị OS kill nếu tài nguyên cạn kiệt và không đảm bảo retry.',
  },
  {
    id: 37,
    topic: 'general',
    topicLabel: 'General Android',
    question: 'Implicit Intent khác Explicit Intent như thế nào?',
    options: [
      'Explicit Intent chậm hơn vì cần tìm kiếm component trên toàn hệ thống',
      'Explicit Intent chỉ định chính xác component (class) sẽ nhận. Implicit Intent mô tả action và để OS tìm app phù hợp',
      'Implicit Intent chỉ dùng được trong cùng 1 app',
      'Explicit Intent cần permission đặc biệt, Implicit Intent thì không',
    ],
    correct: 1,
    explanation: 'Explicit Intent: `Intent(context, TargetActivity::class.java)` — biết chính xác component. Implicit Intent: `Intent(Intent.ACTION_VIEW, Uri.parse("https://..."))` — mô tả hành động, OS tra cứu IntentFilter của các app đã install để tìm app phù hợp (browser, camera, email...).',
  },
  {
    id: 38,
    topic: 'general',
    topicLabel: 'General Android',
    question: 'Khi người dùng nhấn Back và call API vẫn đang chạy, cách nào tốt nhất để không bị memory leak?',
    options: [
      'Dùng `Thread.interrupt()` để dừng network thread',
      'Dùng `viewModelScope.launch {}` — khi ViewModel bị clear, coroutine tự cancel và Retrofit hủy network request',
      'Dùng `GlobalScope.launch {}` để request sống sót qua màn hình',
      'Không cần xử lý, Android tự hủy network request khi Activity bị destroy',
    ],
    correct: 1,
    explanation: 'viewModelScope tự động cancel tất cả coroutine khi ViewModel.onCleared() được gọi (khi màn hình bị destroy). Khi coroutine bị cancel, CancellationException được throw, Retrofit bắt nó và gọi `call.cancel()` xuống OkHttp để hủy network request — tránh leak và lãng phí bandwidth.',
  },
  {
    id: 39,
    topic: 'general',
    topicLabel: 'General Android',
    question: '`onBackPressedDispatcher` thay thế `onBackPressed()` vì lý do gì?',
    options: [
      'Vì `onBackPressed()` gây crash trên Android 13+',
      'Để hỗ trợ Predictive Back Animation và cho phép đăng ký callback lifecycle-aware ở bất kỳ component nào',
      'Vì `onBackPressedDispatcher` nhanh hơn về mặt performance',
      'Vì `onBackPressed()` không thể override trong Fragment',
    ],
    correct: 1,
    explanation: 'Predictive Back Gesture (Android 13/14) cho phép user preview màn hình trước khi thả tay. `onBackPressed()` là hook cứng không hỗ trợ preview này. `OnBackPressedDispatcher` cho phép đăng ký callback ở Activity, Fragment, hoặc Compose với lifecycle awareness — callback tự disable khi component bị destroy.',
  },
  {
    id: 40,
    topic: 'general',
    topicLabel: 'General Android',
    question: 'Launch Mode `singleTask` khác `singleTop` như thế nào?',
    options: [
      '`singleTask` và `singleTop` hoàn toàn giống nhau',
      '`singleTop`: reuse nếu ở đỉnh stack, còn lại tạo mới. `singleTask`: chỉ 1 instance trong Task, clear tất cả Activity phía trên nó và gọi onNewIntent()',
      '`singleTask` tạo Task mới, `singleTop` ở Task hiện tại',
      '`singleTop` đảm bảo 1 instance duy nhất, `singleTask` cho phép nhiều instance',
    ],
    correct: 1,
    explanation: '`singleTop`: nếu Activity đang ở TOP của stack → gọi onNewIntent(), không tạo mới. Nếu không ở top → tạo instance mới. `singleTask`: đảm bảo chỉ có 1 instance trong toàn bộ Task. Nếu đã tồn tại → clear mọi Activity phía trên nó (pop BackStack đến Activity đó) rồi gọi onNewIntent().',
  },

  // ── Activity & Fragment (thêm) ──
  {
    id: 41,
    topic: 'activity',
    topicLabel: 'Activity & Fragment',
    question: '`DecorView` trong Android đóng vai trò gì?',
    options: [
      'Là class quản lý animation giữa các Activity',
      'Là root View thực sự của Window, kế thừa FrameLayout, chứa status bar, action bar và content area (android.R.id.content)',
      'Là lớp trừu tượng đại diện cho bề mặt hiển thị của GPU',
      'Là View chứa Toolbar và BottomNavigationView',
    ],
    correct: 1,
    explanation: 'DecorView là root của toàn bộ View hierarchy trong một Window. Nó kế thừa FrameLayout và chứa: system UI chrome (status bar, navigation bar), Action Bar/Toolbar, và vùng content (android.R.id.content) nơi bạn inflate layout qua setContentView().',
  },
  {
    id: 42,
    topic: 'activity',
    topicLabel: 'Activity & Fragment',
    question: 'FragmentFactory giải quyết vấn đề gì trong Android?',
    options: [
      'Tăng tốc độ khởi tạo Fragment bằng cách cache instance',
      'Cho phép inject dependency vào Fragment constructor, thay vì bắt buộc dùng no-argument constructor',
      'Tự động quản lý BackStack cho tất cả Fragment',
      'Cung cấp cơ chế animate khi thêm/xóa Fragment',
    ],
    correct: 1,
    explanation: 'Android yêu cầu Fragment có no-argument constructor để OS có thể recreate Fragment qua Reflection. FragmentFactory override cơ chế này, cho phép bạn tự instantiate Fragment với dependency được inject qua constructor — chuẩn hơn, testable hơn, loại bỏ pattern arguments Bundle.',
  },
  {
    id: 43,
    topic: 'activity',
    topicLabel: 'Activity & Fragment',
    question: 'Khi nào nên dùng `executePendingTransactions()` sau `commit()`?',
    options: [
      'Luôn luôn, để đảm bảo transaction chạy ngay lập tức',
      'Khi cần đảm bảo fragment đã được add vào back stack trước khi thực hiện thao tác tiếp theo (như lấy childFragmentManager của fragment vừa add)',
      'Chỉ khi dùng cùng với `addToBackStack()`',
      'Không cần thiết, Docusaurus tự động gọi nó sau mỗi commit()',
    ],
    correct: 1,
    explanation: '`commit()` bất đồng bộ — transaction thực thi khi main thread rảnh. `executePendingTransactions()` flush tất cả pending transaction ngay lập tức đồng bộ. Cần dùng khi logic tiếp theo phụ thuộc vào Fragment đã thực sự được attach (ví dụ: gọi `childFragmentManager` của fragment vừa add).',
  },
  {
    id: 44,
    topic: 'activity',
    topicLabel: 'Activity & Fragment',
    question: 'ViewRootImpl đảm nhiệm vai trò gì trong Android View system?',
    options: [
      'Quản lý vòng đời của Activity và Fragment',
      'Là cầu nối giữa WindowManager và View hierarchy, thực thi 3 phase: Measure → Layout → Draw và dispatch input events',
      'Là root class của tất cả View widget trong Android',
      'Quản lý bộ nhớ và GC cho các View không còn dùng',
    ],
    correct: 1,
    explanation: 'ViewRootImpl kết nối View hierarchy với WindowManagerService. Nó: (1) Trigger traversal Measure/Layout/Draw khi cần redraw. (2) Nhận input events từ InputDispatcher và truyền xuống View tree. (3) Quản lý vsync để đồng bộ render với màn hình 60/90/120Hz.',
  },
  {
    id: 45,
    topic: 'activity',
    topicLabel: 'Activity & Fragment',
    question: 'Fragment Result API (`setFragmentResult`) có ưu điểm gì so với interface callback?',
    options: [
      'Nhanh hơn vì không dùng Reflection',
      'Lifecycle-safe, không cần interface, không gây memory leak — listener tự động clear khi fragment bị destroy',
      'Có thể truyền object lớn mà không giới hạn kích thước',
      'Hoạt động được cả khi fragment không attach vào Activity',
    ],
    correct: 1,
    explanation: 'Interface callback truyền thống yêu cầu Fragment giữ reference đến parent → nguy cơ memory leak nếu không clear. Fragment Result API: (1) Gắn với FragmentManager, không có reference trực tiếp. (2) Listener đăng ký với viewLifecycleOwner → tự clear khi view bị destroy. (3) Chỉ deliver khi receiver ở trạng thái STARTED.',
  },
  {
    id: 46,
    topic: 'activity',
    topicLabel: 'Activity & Fragment',
    question: 'Multiple Back Stacks trong Jetpack Navigation (từ 2.4.0+) giải quyết vấn đề gì của BottomNavigationView?',
    options: [
      'Giúp navigate sang màn hình khác nhanh hơn',
      'Mỗi tab có back stack riêng — khi chuyển tab, state và back stack của tab cũ được save/restore thay vì bị hủy',
      'Cho phép hiển thị nhiều back stack song song trên màn hình lớn',
      'Tự động xử lý animation khi chuyển giữa các tab',
    ],
    correct: 1,
    explanation: 'Trước 2.4.0: chuyển tab bị hủy Fragment cũ, mất trạng thái. Từ 2.4.0+: mỗi tab có NavBackStack riêng. Khi chuyển sang tab khác, current back stack được serialize và lưu lại. Khi quay lại, back stack và Fragment state được restore hoàn hảo — cân bằng tốt giữa UX và memory.',
  },
  {
    id: 47,
    topic: 'activity',
    topicLabel: 'Activity & Fragment',
    question: 'Tại sao `onHiddenChanged(isHidden)` cần được xử lý đặc biệt khi dùng `show()`/`hide()`?',
    options: [
      'Vì `show()`/`hide()` không gọi bất kỳ lifecycle callback nào, cần dùng onHiddenChanged để pause/resume resources như Camera, Video Player',
      'Vì `onHiddenChanged` thay thế hoàn toàn `onResume()` khi dùng show/hide',
      'Vì chỉ có `onHiddenChanged` mới trigger lại layout inflation khi show Fragment',
      'Không cần xử lý đặc biệt, lifecycle tự động điều chỉnh',
    ],
    correct: 0,
    explanation: '`show()`/`hide()` chỉ thay đổi `View.VISIBLE`/`View.GONE`, không trigger onPause()/onResume(). Fragment vẫn ở trạng thái RESUMED khi bị hide. Cần override `onHiddenChanged(hidden: Boolean)` để dừng Camera, animation, video khi fragment bị ẩn và khởi động lại khi được show.',
  },
  {
    id: 48,
    topic: 'activity',
    topicLabel: 'Activity & Fragment',
    question: '`onNewIntent()` được gọi khi nào và `intent` property nào nên dùng sau đó?',
    options: [
      '`onNewIntent()` gọi khi Activity được tạo mới. Dùng `getIntent()` ngay sau.',
      '`onNewIntent()` gọi khi Activity đã tồn tại nhận Intent mới (singleTop/singleTask). Phải gọi `setIntent(intent)` để `getIntent()` trả về Intent mới nhất.',
      '`onNewIntent()` chỉ gọi khi app được mở từ notification. Dùng `intent.extras` ngay trong callback.',
      '`onNewIntent()` chỉ gọi một lần duy nhất trong vòng đời Activity.',
    ],
    correct: 1,
    explanation: 'Khi singleTop/singleTask Activity nhận Intent mới, `onNewIntent(intent)` được gọi với Intent mới. NHƯNG `getIntent()` lúc này vẫn trả về Intent ban đầu! Phải gọi `setIntent(intent)` trong `onNewIntent()` để cập nhật Intent hiện tại, sau đó mới lấy bằng `getIntent()` chính xác.',
  },
  {
    id: 49,
    topic: 'activity',
    topicLabel: 'Activity & Fragment',
    question: '`taskAffinity` ảnh hưởng đến behavior của Launch Mode như thế nào?',
    options: [
      '`taskAffinity` là alias cho `android:launchMode`, hai thuộc tính này tương đương nhau',
      'Khai báo Launch Mode `singleInstance` mà không set `taskAffinity` khác có thể không tạo Task mới vì Activity có cùng affinity với App',
      '`taskAffinity` chỉ ảnh hưởng đến animation transition giữa các Task',
      '`taskAffinity` bắt buộc phải set cho tất cả Activity trong Multi-Activity App',
    ],
    correct: 1,
    explanation: 'Mặc định tất cả Activity có taskAffinity = applicationId. `singleInstance`/`singleTask` chỉ tạo Task mới nếu taskAffinity KHÁC với Task hiện tại. Nếu cùng affinity, Activity có thể bị đẩy vào Task hiện tại. Cần set `android:taskAffinity=":separateTask"` để đảm bảo Task riêng biệt.',
  },
  {
    id: 50,
    topic: 'activity',
    topicLabel: 'Activity & Fragment',
    question: '`ChildFragmentManager` vs `SupportFragmentManager` — khi nào dùng cái nào trong Fragment?',
    options: [
      'Luôn dùng `SupportFragmentManager` để đảm bảo tương thích',
      'Dùng `childFragmentManager` khi tạo nested Fragment (Fragment trong Fragment). Dùng `parentFragmentManager` hoặc `requireActivity().supportFragmentManager` khi cần add Fragment vào container của Activity',
      '`childFragmentManager` chỉ dùng trong BottomSheetDialogFragment',
      'Hai loại hoàn toàn tương đương, chỉ khác scope',
    ],
    correct: 1,
    explanation: '`childFragmentManager` quản lý các Fragment được nest BÊN TRONG Fragment hiện tại (con của Fragment). Lifecycle của chúng bị ràng buộc theo Fragment cha. Khi Fragment cha bị destroy, tất cả child fragment cũng bị destroy theo. `parentFragmentManager` là FragmentManager của host Activity/Fragment cha.',
  },
  {
    id: 51,
    topic: 'activity',
    topicLabel: 'Activity & Fragment',
    question: 'Điều gì xảy ra với Activity A khi `startActivityForResult()` bị deprecated và thay thế bằng Activity Result API?',
    options: [
      'Không thể nhận kết quả từ Activity khác nữa sau deprecation',
      'Activity Result API (`registerForActivityResult`) lifecycle-safe hơn, tách biệt launcher và callback, tránh leak khi Activity recreate',
      'Chỉ ảnh hưởng đến app target API 30+, API thấp hơn vẫn dùng bình thường',
      '`startActivityForResult()` bị xóa hoàn toàn trong Android 13',
    ],
    correct: 1,
    explanation: '`startActivityForResult()` + `onActivityResult()` không lifecycle-safe: callback có thể bị gọi sau khi Fragment/Activity bị destroy. Activity Result API: launcher được tạo ở `onCreate` (lifecycle-safe), callback không cần override method, dễ test, và tách biệt rõ intent launching vs result handling.',
  },
  {
    id: 52,
    topic: 'activity',
    topicLabel: 'Activity & Fragment',
    question: 'Trong Predictive Back Gesture (Android 14+), `OnBackPressedCallback` cần làm gì để hỗ trợ animation xem trước?',
    options: [
      'Override `handleOnBackStarted()`, `handleOnBackProgressed()`, `handleOnBackCancelled()` ngoài `handleOnBackPressed()`',
      'Chỉ cần override `handleOnBackPressed()` như bình thường',
      'Implement interface `PredictiveBackAnimator` riêng biệt',
      'Set `android:enableOnBackInvokedCallback="true"` trong AndroidManifest là đủ',
    ],
    correct: 0,
    explanation: 'Predictive Back API mở rộng OnBackPressedCallback với: `handleOnBackStarted()` (user bắt đầu gesture), `handleOnBackProgressed(progress)` (cập nhật animation theo progress 0.0-1.0), `handleOnBackCancelled()` (user thả tay giữa chừng không back), `handleOnBackPressed()` (back hoàn thành). Cần implement đủ 4 để animation mượt mà.',
  },

  // ── Kotlin Coroutines (thêm) ──
  {
    id: 53,
    topic: 'coroutines',
    topicLabel: 'Kotlin Coroutines',
    question: '`Flow` cold vs `SharedFlow` hot — sự khác biệt cốt lõi là gì?',
    options: [
      'Cold Flow chỉ chạy trên Main Thread, Hot Flow chạy trên background thread',
      'Cold Flow: producer chỉ chạy khi có collector — mỗi collector nhận luồng data độc lập. Hot Flow: producer chạy độc lập, nhiều collector chia sẻ cùng stream data',
      'Cold Flow là synchronous, Hot Flow là asynchronous',
      'Cold Flow không thể cancel, Hot Flow có thể cancel bất kỳ lúc nào',
    ],
    correct: 1,
    explanation: 'Cold Flow (ví dụ flow { }): mỗi lần gọi collect() khởi chạy lại producer từ đầu — giống Sequence lazy. Hot Flow (SharedFlow/StateFlow): producer chạy độc lập với collectors, nhiều collector nhận cùng data, collector mới bỏ lỡ data đã phát trước đó (trừ khi có replay buffer).',
  },
  {
    id: 54,
    topic: 'coroutines',
    topicLabel: 'Kotlin Coroutines',
    question: '`flowOn()` operator trong Flow làm gì?',
    options: [
      'Chuyển tất cả operators phía SAU nó sang Dispatcher được chỉ định',
      'Chuyển tất cả operators phía TRƯỚC nó (upstream) sang Dispatcher được chỉ định, collect vẫn chạy trên context hiện tại',
      'Là bắt buộc phải dùng trên mọi Flow để chỉ định thread',
      'Chuyển collector sang thread riêng biệt để tránh block UI',
    ],
    correct: 1,
    explanation: '`flowOn(Dispatcher.IO)` ảnh hưởng đến UPSTREAM operators (trước nó). Các operator sau `flowOn` và collector vẫn chạy trên context của caller. Pattern phổ biến: `flow { emit(fetchFromNetwork()) }.flowOn(Dispatchers.IO).collect { updateUI(it) }` — fetch chạy trên IO, collect chạy trên Main.',
  },
  {
    id: 55,
    topic: 'coroutines',
    topicLabel: 'Kotlin Coroutines',
    question: 'Sự khác biệt giữa `coroutineScope {}` và `supervisorScope {}`?',
    options: [
      '`coroutineScope` dùng cho IO tasks, `supervisorScope` dùng cho CPU tasks',
      '`coroutineScope`: nếu 1 child fail → cancel tất cả. `supervisorScope`: child fail độc lập, không ảnh hưởng sibling — giống SupervisorJob',
      '`supervisorScope` tự động retry child coroutine khi fail',
      'Hai loại hoàn toàn giống nhau về behavior với lỗi',
    ],
    correct: 1,
    explanation: '`coroutineScope {}` tạo scope với Job thường: 1 child fail → cancel parent → cancel tất cả sibling. `supervisorScope {}` tạo scope với SupervisorJob: child fail không lan truyền lên parent, sibling vẫn chạy. Dùng supervisorScope khi muốn tải song song nhiều item mà 1 item fail không ảnh hưởng item khác.',
  },
  {
    id: 56,
    topic: 'coroutines',
    topicLabel: 'Kotlin Coroutines',
    question: '`withTimeout()` và `withTimeoutOrNull()` khác nhau như thế nào?',
    options: [
      'Cả hai đều throw exception khi timeout, chỉ khác tên',
      '`withTimeout()` throw `TimeoutCancellationException` khi hết giờ. `withTimeoutOrNull()` trả về null thay vì throw exception',
      '`withTimeoutOrNull()` tự động retry khi timeout',
      '`withTimeout()` block Main Thread, `withTimeoutOrNull()` không block',
    ],
    correct: 1,
    explanation: '`withTimeout(1000) { ... }` throw `TimeoutCancellationException` nếu block chưa hoàn thành trong 1000ms. `withTimeoutOrNull(1000) { ... }` trả về null thay vì throw — giúp code gọn hơn khi timeout là trường hợp bình thường cần xử lý, không phải exceptional case.',
  },
  {
    id: 57,
    topic: 'coroutines',
    topicLabel: 'Kotlin Coroutines',
    question: 'Structured Concurrency trong Kotlin Coroutines có nghĩa là gì?',
    options: [
      'Tất cả coroutine phải dùng cùng một Dispatcher',
      'Coroutine con không thể sống sót lâu hơn coroutine cha — lifecycle được tổ chức theo cấu trúc cây phân cấp (parent-child)',
      'Coroutine phải được khai báo theo thứ tự cấu trúc từ trên xuống',
      'Chỉ cho phép tạo tối đa 64 coroutine đồng thời',
    ],
    correct: 1,
    explanation: 'Structured Concurrency đảm bảo: (1) Coroutine con luôn thuộc về scope/coroutine cha. (2) Parent không hoàn thành cho đến khi tất cả child hoàn thành. (3) Hủy parent sẽ hủy tất cả child theo cây phân cấp. (4) Lỗi ở child lan truyền lên parent (trừ SupervisorJob). Loại bỏ hoàn toàn coroutine leak.',
  },
  {
    id: 58,
    topic: 'coroutines',
    topicLabel: 'Kotlin Coroutines',
    question: 'Operator `conflate()` trong Flow làm gì?',
    options: [
      'Gộp nhiều Flow thành một Flow duy nhất',
      'Khi collector xử lý chậm, bỏ qua các giá trị trung gian và chỉ xử lý giá trị MỚI NHẤT — tránh backpressure',
      'Merge các item cùng key lại với nhau',
      'Buffer tất cả item phát ra và xử lý từng cái một theo thứ tự',
    ],
    correct: 1,
    explanation: 'Khi producer phát data nhanh hơn collector xử lý (backpressure), `conflate()` drop các item giữa chừng và chỉ deliver item mới nhất. Khác `buffer()` — buffer giữ tất cả item. Dùng conflate() khi chỉ quan tâm state cuối cùng, ví dụ: hiển thị giá trị realtime của sensor.',
  },
  {
    id: 59,
    topic: 'coroutines',
    topicLabel: 'Kotlin Coroutines',
    question: '`Channel` trong Kotlin Coroutines dùng để làm gì, khác Flow như thế nào?',
    options: [
      'Channel là cách tạo cold Flow có buffer',
      'Channel là hot stream dùng để giao tiếp giữa các coroutine (producer-consumer). Flow là cold, lazy, không có trạng thái chia sẻ',
      'Channel và Flow hoàn toàn tương đương, chỉ khác API',
      'Channel chỉ dùng để broadcast event, Flow dùng cho data streaming',
    ],
    correct: 1,
    explanation: 'Channel: hot, stateful, 2 đầu send/receive riêng biệt, phù hợp giao tiếp giữa 2 coroutine (fan-out, fan-in). Flow: cold, mỗi collector nhận stream độc lập, declarative, dễ chain operator. Thực tế: Channel được dùng internally bởi SharedFlow. Prefer Flow cho business logic, Channel cho low-level coroutine communication.',
  },
  {
    id: 60,
    topic: 'coroutines',
    topicLabel: 'Kotlin Coroutines',
    question: 'Tại sao tránh dùng `GlobalScope` trong Android?',
    options: [
      'Vì `GlobalScope` chạy chậm hơn viewModelScope',
      'Vì coroutine trong GlobalScope không bị cancel khi Activity/Fragment/ViewModel bị destroy → memory leak và crash sau khi màn hình đóng',
      'Vì `GlobalScope` không hỗ trợ Dispatchers.Main',
      'Vì Google deprecated GlobalScope từ Kotlin 1.6+',
    ],
    correct: 1,
    explanation: 'GlobalScope tồn tại suốt lifecycle của process. Coroutine trong GlobalScope không biết về Activity/Fragment lifecycle — khi màn hình bị destroy, coroutine vẫn chạy và có thể: update UI đã null (crash NullPointerException), giữ reference đến View/Context cũ (memory leak), tốn CPU/battery vô nghĩa. Luôn dùng viewModelScope hoặc lifecycleScope.',
  },
  {
    id: 61,
    topic: 'coroutines',
    topicLabel: 'Kotlin Coroutines',
    question: '`stateIn()` operator dùng để làm gì trong ViewModel?',
    options: [
      'Chuyển StateFlow thành thông thường Flow để xử lý',
      'Chuyển cold Flow thành StateFlow với initial value và sharing strategy, giúp Flow "nóng" lên và chia sẻ được giữa nhiều collector',
      'Đặt giới hạn số lượng collector có thể observe Flow cùng lúc',
      'Freeze giá trị của StateFlow để không thể cập nhật thêm',
    ],
    correct: 1,
    explanation: '`someFlow.stateIn(scope, SharingStarted.WhileSubscribed(5000), initialValue)` khởi động Flow khi có collector đầu tiên, dừng sau 5 giây không còn collector (tránh refetch khi rotate). Biến cold Flow (ví dụ từ Room) thành StateFlow để UI có thể observe. WhileSubscribed(5000) là timeout chuẩn cho rotation survival.',
  },
  {
    id: 62,
    topic: 'coroutines',
    topicLabel: 'Kotlin Coroutines',
    question: 'Sự khác biệt giữa `collect` và `collectLatest` trong Flow?',
    options: [
      '`collectLatest` chỉ nhận giá trị đầu tiên, `collect` nhận tất cả',
      '`collectLatest`: nếu item mới đến trong khi đang xử lý item cũ → CANCEL item cũ và xử lý item mới. `collect` đợi xử lý xong item cũ rồi mới nhận item mới',
      '`collectLatest` chỉ dùng được với SharedFlow',
      'Hai operator hoàn toàn giống nhau',
    ],
    correct: 1,
    explanation: '`collectLatest { }` huỷ block đang chạy nếu có item mới. Hữu ích khi mỗi item trigger tác vụ tốn thời gian (search API call) — nếu user gõ nhanh, chỉ request cuối cùng được hoàn thành. `collect { }` đợi block xử lý xong hoàn toàn trước khi nhận item tiếp theo — có thể tạo backpressure.',
  },

  // ── Architecture (thêm) ──
  {
    id: 63,
    topic: 'architecture',
    topicLabel: 'Architecture',
    question: 'Dependency Inversion Principle (DIP) trong Clean Architecture là gì?',
    options: [
      'Các module cấp cao không được phụ thuộc vào module cấp thấp — cả hai phụ thuộc vào abstraction (interface)',
      'Các dependency phải được inject từ bên ngoài, không tự khởi tạo',
      'Module cấp cao luôn có quyền kiểm soát module cấp thấp',
      'Tất cả dependency phải là singleton',
    ],
    correct: 0,
    explanation: 'DIP: High-level module (UseCase) không import trực tiếp Low-level module (Repository implementation). Thay vào đó, cả hai phụ thuộc vào interface (abstraction). UseCase chỉ biết `interface UserRepository`, không biết `UserRepositoryImpl`. Điều này cho phép swap implementation dễ dàng và unit test với mock.',
  },
  {
    id: 64,
    topic: 'architecture',
    topicLabel: 'Architecture',
    question: 'Hilt và Dagger khác nhau như thế nào trong Android DI?',
    options: [
      'Hilt chỉ là Dagger với tên gọi khác, không có sự khác biệt thực sự',
      'Hilt là opinionated DI framework built on top of Dagger, tự động generate component theo Android lifecycle, giảm boilerplate đáng kể',
      'Dagger tốt hơn Hilt cho large-scale project',
      'Hilt chỉ dùng được với Kotlin, Dagger dùng được cả Java',
    ],
    correct: 1,
    explanation: 'Dagger: manual setup các Component, Module, Scope. Rất powerful nhưng boilerplate nhiều. Hilt: build trên Dagger, tự động tạo `@HiltAndroidApp`, `@AndroidEntryPoint`, predefined component (ActivityComponent, ViewModelComponent, ApplicationComponent). Giảm ~70% boilerplate, tích hợp native với ViewModel và WorkManager.',
  },
  {
    id: 65,
    topic: 'architecture',
    topicLabel: 'Architecture',
    question: 'MVI (Model-View-Intent) khác MVVM như thế nào?',
    options: [
      'MVI dùng cho Compose, MVVM dùng cho XML',
      'MVI có single immutable State, Events xử lý qua một pipeline (Intent → Reducer → State), thuận lợi cho debugging và time-travel. MVVM linh hoạt hơn nhưng State có thể phân tán nhiều nơi',
      'MVI chậm hơn MVVM vì phải copy state mỗi lần update',
      'MVI và MVVM là hai tên khác nhau cho cùng một pattern',
    ],
    correct: 1,
    explanation: 'MVI: (1) Single source of truth — toàn bộ UI state là 1 immutable data class. (2) Mọi thay đổi đi qua Reducer (Intent → State mới). (3) Dễ debug — replay lại sequence Intent để tái hiện bug. (4) Side effects rõ ràng. MVVM linh hoạt hơn nhưng State có thể bị phân tán thành nhiều LiveData/StateFlow riêng lẻ.',
  },
  {
    id: 66,
    topic: 'architecture',
    topicLabel: 'Architecture',
    question: 'Paging 3 Library giải quyết vấn đề gì? `RemoteMediator` dùng để làm gì?',
    options: [
      'Paging 3 chỉ giúp load thêm item khi scroll. RemoteMediator không có trong Paging 3',
      'Paging 3 load data theo trang tự động. RemoteMediator là bridge giữa network và local database — implement offline-first bằng cách fetch network → cache vào Room → UI observe từ Room',
      'Paging 3 thay thế RecyclerView bằng cơ chế render riêng',
      'RemoteMediator chỉ dùng khi backend hỗ trợ cursor-based pagination',
    ],
    correct: 1,
    explanation: 'Paging 3: tự động load data khi user scroll gần cuối list, xử lý loading state, error state, retry. RemoteMediator: khi Room cache hết data (APPEND/PREPEND), tự động fetch từ network, lưu vào Room. UI observe PagingData từ Room → offline-first với seamless online refresh. Pattern: Room là Single Source of Truth.',
  },
  {
    id: 67,
    topic: 'architecture',
    topicLabel: 'Architecture',
    question: '`@HiltViewModel` và `by viewModels()` hoạt động như thế nào cùng nhau?',
    options: [
      '`@HiltViewModel` chỉ dùng được với `by activityViewModels()`',
      '`@HiltViewModel` cho phép Hilt inject dependency vào ViewModel constructor. `by viewModels()` tạo ViewModel qua HiltViewModelFactory (tự động được inject bởi `@AndroidEntryPoint`)',
      '`by viewModels()` không tương thích với Hilt, phải dùng `ViewModelProvider` thủ công',
      '`@HiltViewModel` bắt buộc ViewModel phải có scope là Singleton',
    ],
    correct: 1,
    explanation: '`@HiltViewModel` class UserViewModel @Inject constructor(repo: UserRepository): ViewModel(). Hilt generate HiltViewModelFactory cho Activity/Fragment được annotate `@AndroidEntryPoint`. Khi gọi `by viewModels()`, Kotlin delegate lấy factory này từ Hilt, factory biết cách inject repository vào ViewModel constructor.',
  },
  {
    id: 68,
    topic: 'architecture',
    topicLabel: 'Architecture',
    question: 'Tại sao nên return `Flow<Result<T>>` từ Repository thay vì `T` hay `Flow<T>`?',
    options: [
      'Vì `Result<T>` yêu cầu ít memory hơn `T`',
      'Để propagate cả Success và Error state qua Flow pipeline, ViewModel có thể map sang UiState mà không cần try-catch riêng, đảm bảo lỗi không bị bỏ qua silent',
      'Vì Kotlin không cho phép throw Exception trong suspend function',
      'Chỉ cần thiết khi dùng RxJava, không áp dụng cho Coroutines',
    ],
    correct: 1,
    explanation: '`Flow<Result<T>>`: (1) Lỗi là first-class citizen — không bị swallow bởi try-catch không đúng chỗ. (2) ViewModel map `Result.Success` → `UiState.Success`, `Result.Error` → `UiState.Error` một cách declarative. (3) Tránh uncaught exception crash app. (4) Dễ test: emit `Result.Error` trong unit test.',
  },
  {
    id: 69,
    topic: 'architecture',
    topicLabel: 'Architecture',
    question: 'Convention: khi nào scope ViewModel theo NavGraph thay vì theo Activity?',
    options: [
      'Luôn luôn scope theo NavGraph để tiết kiệm memory',
      'Scope theo NavGraph khi ViewModel chỉ cần chia sẻ giữa các màn hình trong CÙNG navigation flow (ví dụ: checkout flow gồm 3 steps). Scope theo Activity khi cần chia sẻ toàn app',
      'Scope theo Activity là luôn tốt hơn vì ViewModel sống lâu hơn',
      'NavGraph scoped ViewModel chỉ hoạt động với Single-Activity Architecture',
    ],
    correct: 1,
    explanation: 'NavGraph scoped ViewModel (by navGraphViewModels(R.id.checkout_graph)): sống suốt navigation flow, bị destroy khi user hoàn thành flow và pop khỏi NavGraph. Activity scoped ViewModel: sống suốt toàn bộ Activity — dùng cho global state (user session, theme). NavGraph scope tránh memory leak và state pollution giữa các flow độc lập.',
  },
  {
    id: 70,
    topic: 'architecture',
    topicLabel: 'Architecture',
    question: 'Modularization theo feature (`:feature:login`) vs theo layer (`:data`, `:domain`, `:presentation`) — ưu nhược điểm?',
    options: [
      'Chỉ có modularization theo feature là đúng, theo layer là sai',
      'Feature modules: build time nhanh hơn (parallel build), tách biệt team, dễ dynamic delivery. Layer modules: dễ share code chung (data layer), nhưng phụ thuộc xuyên suốt tất cả features',
      'Hai kiểu cho kết quả giống nhau về build time và maintainability',
      'Layer modules phù hợp app nhỏ, Feature modules phù hợp app lớn',
    ],
    correct: 1,
    explanation: 'Hybrid approach phổ biến nhất: `:core:data`, `:core:domain`, `:core:ui` (shared) + `:feature:login`, `:feature:dashboard` (vertical slice). Feature modules: Gradle build parallel → giảm build time, isolation rõ ràng, enable Play Feature Delivery. Layer modules: dễ share Repository/UseCase giữa features nhưng module graph phức tạp.',
  },
  {
    id: 71,
    topic: 'architecture',
    topicLabel: 'Architecture',
    question: 'Khi nào cần dùng `produceState` trong Jetpack Compose?',
    options: [
      'Để tạo MutableState trong Composable',
      'Để convert non-Compose state source (callback API, Flow, LiveData) thành Compose State có lifecycle, tự động cancel khi Composable rời khỏi composition',
      'Thay thế cho `remember { mutableStateOf() }` khi cần async initialization',
      'Chỉ dùng khi cần share State giữa nhiều Composable khác nhau',
    ],
    correct: 1,
    explanation: '`produceState(initialValue) { value = fetchData() }` tạo coroutine scope gắn với Composable lifecycle. Khi Composable leave composition, coroutine bị cancel. Hữu ích để: observe Flow trong Composable không qua ViewModel, wrap callback-based API thành State, handle async initialization với loading state.',
  },
  {
    id: 72,
    topic: 'architecture',
    topicLabel: 'Architecture',
    question: 'Cách đúng để handle one-shot events (navigation, show snackbar) từ ViewModel trong Compose/Fragment?',
    options: [
      'Dùng `StateFlow<EventType?>` và set null sau khi handle',
      'Dùng `Channel<Event>` (RENDEZVOUS) hoặc `SharedFlow` với replay=0 để đảm bảo event chỉ được consume một lần và không replay khi screen rotate',
      'Dùng `LiveData<Event>` với EventWrapper pattern',
      'Dùng `MutableStateFlow` thông thường, UI tự biết khi nào nên ignore',
    ],
    correct: 1,
    explanation: 'StateFlow replay giá trị cuối — khi screen rotate, navigation event bị replay → navigate hai lần (bug). Channel(RENDEZVOUS) hoặc SharedFlow(replay=0): event chỉ delivered đến một collector duy nhất, không replay. Pattern chuẩn: `val uiEvents = MutableSharedFlow<UiEvent>(extraBufferCapacity=1)` emit từ ViewModel, collect trong repeatOnLifecycle.',
  },

  // ── Performance (thêm) ──
  {
    id: 73,
    topic: 'performance',
    topicLabel: 'Performance',
    question: 'App Startup Library giải quyết vấn đề gì?',
    options: [
      'Tăng tốc độ download APK từ Play Store',
      'Khởi tạo các library dependencies theo thứ tự đúng trên background thread, tránh ContentProvider abuse và giảm cold start time',
      'Tự động lazy-load các màn hình chưa cần đến',
      'Giảm kích thước APK bằng cách defer initialization',
    ],
    correct: 1,
    explanation: 'Nhiều library dùng ContentProvider để auto-init (Firebase, WorkManager) — mỗi ContentProvider là một onCreate() call chạy nối tiếp trên main thread khi app khởi động → tăng cold start time. App Startup: gộp tất cả initializer vào 1 ContentProvider duy nhất, xử lý dependency graph giữa các initializer, có thể lazy-load, hỗ trợ run trên background thread.',
  },
  {
    id: 74,
    topic: 'performance',
    topicLabel: 'Performance',
    question: 'Baseline Profile trong Android giúp gì cho performance?',
    options: [
      'Tự động detect và fix memory leak',
      'Pre-compile các hot code paths (Activity launch, scroll paths) thành native code khi cài app, giảm JIT compilation overhead → cải thiện cold start và frame rendering',
      'Giảm kích thước APK bằng cách xóa unused code',
      'Tăng tốc độ network request',
    ],
    correct: 1,
    explanation: 'Baseline Profile (.prof file) định nghĩa các class/method quan trọng. Google Play dùng nó để AOT compile trước khi deliver app → khi user mở, code đã là native binary, không cần JIT warm-up. Kết quả: cold start giảm 20-40%, scroll jank giảm đáng kể. Tạo bằng Macrobenchmark library.',
  },
  {
    id: 75,
    topic: 'performance',
    topicLabel: 'Performance',
    question: 'Strict Mode trong Android dùng để làm gì?',
    options: [
      'Giới hạn số lượng thread có thể tạo trong app',
      'Detect vi phạm trong quá trình development: disk/network access trên Main Thread, Activity leak, unclosed Cursor, untagged network socket',
      'Enforce code style convention trong quá trình build',
      'Kiểm tra security vulnerability trong app',
    ],
    correct: 1,
    explanation: 'StrictMode.ThreadPolicy: phát hiện disk/network I/O trên Main Thread. StrictMode.VmPolicy: phát hiện Activity/Fragment leak, unclosed SQLite Cursor, file URI exposure. Có thể log, crash, hoặc show dialog khi vi phạm. Chỉ enable trong Debug build (`if (BuildConfig.DEBUG) { StrictMode.enableDefaults() }`).',
  },
  {
    id: 76,
    topic: 'performance',
    topicLabel: 'Performance',
    question: '`R8` khác `ProGuard` như thế nào?',
    options: [
      'R8 chỉ minify tên class/method, ProGuard shrink và optimize thêm',
      'R8 là full program optimizer (shrink + minify + optimize) trong một pass, nhanh hơn ProGuard và có khả năng optimize aggressive hơn như inlining, devirtualization',
      'ProGuard là open source, R8 là proprietary của Google',
      'R8 và ProGuard cho kết quả giống hệt nhau về kích thước APK',
    ],
    correct: 1,
    explanation: 'ProGuard: 3 pass riêng biệt (shrink → optimize → obfuscate). R8 (Android Gradle Plugin 3.4+): 1 pass duy nhất, tích hợp D8 (Kotlin/Java → DEX compiler). R8 có extra optimizations: method inlining, class merging, devirtualization, dead code elimination aggressive hơn → APK nhỏ hơn 5-20% so với ProGuard.',
  },
  {
    id: 77,
    topic: 'performance',
    topicLabel: 'Performance',
    question: 'Frame drop và Jank xảy ra khi nào trên Android?',
    options: [
      'Khi app dùng quá nhiều màu sắc trong UI',
      'Khi Main Thread bị block quá 16ms (60Hz) hoặc 8ms (120Hz) và không thể giao frame cho SurfaceFlinger đúng vsync deadline → frame bị drop, user thấy giật',
      'Khi app có quá nhiều Activity trong Back Stack',
      'Khi bitmap quá lớn không fit vào bộ nhớ GPU',
    ],
    correct: 1,
    explanation: 'Android dùng vsync để đồng bộ render. Ở 60Hz, Main Thread phải hoàn thành Measure/Layout/Draw trong 16ms. Nếu vượt quá (heavy computation, I/O, long GC pause), SurfaceFlinger không có frame mới → display frame cũ → user thấy jank. Tools: Systrace, Perfetto, GPU Rendering Profile (developer options).',
  },
  {
    id: 78,
    topic: 'performance',
    topicLabel: 'Performance',
    question: 'Background work nào sẽ bị ảnh hưởng bởi Doze Mode?',
    options: [
      'Tất cả background work đều bị Doze block hoàn toàn',
      'Network access, WakeLock, AlarmManager (trừ setAndAllowWhileIdle), JobScheduler bị defer. WorkManager và FCM High Priority vẫn hoạt động',
      'Chỉ network request bị block, CPU background tasks không bị ảnh hưởng',
      'Doze Mode chỉ ảnh hưởng đến app trong background trên Android 6.0',
    ],
    correct: 1,
    explanation: 'Doze Mode (Android 6+): khi thiết bị không sử dụng + không sạc + màn hình tắt. Block: network, WakeLock, alarm thông thường, sync. Cho phép: AlarmManager.setAndAllowWhileIdle(), FCM High Priority (guaranteed delivery), WorkManager (với điều kiện thỏa mãn). Maintenance windows định kỳ cho phép các task chạy ngắn.',
  },
  {
    id: 79,
    topic: 'performance',
    topicLabel: 'Performance',
    question: 'Overdraw trong Android UI là gì và cách kiểm tra?',
    options: [
      'Overdraw là khi app render nhiều Activity cùng lúc',
      'Overdraw là khi cùng một pixel được vẽ nhiều hơn một lần trong một frame — lãng phí GPU. Kiểm tra bằng Developer Options > Debug GPU Overdraw',
      'Overdraw là thuật ngữ cho app dùng quá nhiều RAM',
      'Overdraw xảy ra khi RecyclerView có quá nhiều ViewType khác nhau',
    ],
    correct: 1,
    explanation: 'Overdraw: pixel bị vẽ đè nhiều lần (background Activity + background Fragment + background View + content). Developer Options > Debug GPU Overdraw hiển thị màu: xanh (1x) → xanh lam (2x) → hồng (3x) → đỏ (4x+). Tối ưu: xóa background thừa, dùng transparent/no background cho View ở trên cùng, tránh nested background.',
  },
  {
    id: 80,
    topic: 'performance',
    topicLabel: 'Performance',
    question: 'Tại sao `Bitmap.recycle()` ít cần thiết từ Android 3.0+ trở đi?',
    options: [
      'Vì Android 3.0+ có RAM lớn hơn nên không cần quan tâm',
      'Trước Android 3.0: pixel data của Bitmap lưu ở native heap (không bị GC Java). Từ 3.0+: pixel data lưu ở Java heap → GC tự quản lý. recycle() vẫn hữu ích để release ngay lập tức thay vì đợi GC',
      'Vì Glide/Coil tự động gọi recycle() khi cần',
      'Vì Android 3.0+ nén bitmap tự động để tiết kiệm RAM',
    ],
    correct: 1,
    explanation: 'Android < 3.0 (Gingerbread): Bitmap pixel data ở native heap. JVM GC không biết về native allocation này → OutOfMemoryError hay xảy ra. Cần gọi recycle() để free native memory. Android 3.0+ (Honeycomb): pixel data ở Java heap → GC tự quản lý toàn bộ. Tuy nhiên Bitmap lớn vẫn nên recycle ngay sau dùng để free sớm, không chờ GC.',
  },
  {
    id: 81,
    topic: 'performance',
    topicLabel: 'Performance',
    question: 'WorkManager constraint `NetworkType.CONNECTED` vs `NetworkType.UNMETERED` — khi nào dùng cái nào?',
    options: [
      'Cả hai đều giống nhau, NetworkType.UNMETERED ít được hỗ trợ hơn',
      'CONNECTED: chạy khi có bất kỳ mạng nào (WiFi, data). UNMETERED: chỉ chạy khi có mạng không tính tiền (WiFi, Ethernet) — phù hợp upload file lớn để tránh tốn data của user',
      'UNMETERED chạy nhanh hơn CONNECTED vì ít overhead hơn',
      'CONNECTED dùng cho foreground task, UNMETERED dùng cho background task',
    ],
    correct: 1,
    explanation: '`NetworkType.CONNECTED`: task chạy khi có kết nối bất kỳ (WiFi, 4G, 5G). Dùng cho task nhỏ, không tốn băng thông. `NetworkType.UNMETERED`: chỉ chạy khi mạng không charged (WiFi, Ethernet). Dùng khi upload/download file lớn để tránh tốn dữ liệu di động của user — best practice cho media upload, backup task.',
  },
  {
    id: 82,
    topic: 'performance',
    topicLabel: 'Performance',
    question: 'Cơ chế hoạt động của `RecyclerView.RecycledViewPool` là gì?',
    options: [
      'Pool lưu data model để tránh fetch lại từ database',
      'Pool lưu các ViewHolder đã được detach, cho phép tái sử dụng giữa nhiều RecyclerView — đặc biệt hữu ích cho nested RecyclerView (horizontal list trong vertical list)',
      'Pool là nơi RecyclerView lưu Bitmap của mỗi item để tái sử dụng',
      'Pool quản lý thread riêng cho mỗi RecyclerView để tăng tốc scroll',
    ],
    correct: 1,
    explanation: 'RecycledViewPool giữ ViewHolder đã recycled theo ViewType. Khi một RecyclerView cần ViewHolder mới, nó lấy từ pool thay vì inflate layout XML (tốn kém). Nested RecyclerView: tất cả child RecyclerView chia sẻ 1 pool qua `setRecycledViewPool()` → ViewHolder của item được tái sử dụng khi scroll dọc, giảm inflation đáng kể.',
  },

  // ── General Android (thêm) ──
  {
    id: 83,
    topic: 'general',
    topicLabel: 'General Android',
    question: 'Sự khác biệt giữa `Service`, `IntentService` và `JobIntentService`?',
    options: [
      'Ba loại hoàn toàn giống nhau, chỉ khác naming convention',
      'Service: chạy trên Main Thread, phải tự manage thread. IntentService (deprecated): xử lý Intent tuần tự trên worker thread, tự stop khi xong. JobIntentService: thay thế IntentService, dùng JobScheduler trên API 26+ để tránh background execution limits',
      'IntentService mạnh hơn Service vì có queue riêng',
      'JobIntentService chỉ dùng cho scheduling, không thể thực hiện network request',
    ],
    correct: 1,
    explanation: 'Service: gọi startService() → chạy Main Thread, cần tự tạo thread cho background work, phải tự stop. IntentService: tự tạo HandlerThread, xử lý queue Intent tuần tự, stopSelf() tự động — deprecated vì không tương thích background limits. JobIntentService: wrap JobScheduler (API 26+) để tránh limits, tương thích backward, nhưng Google khuyến nghị WorkManager thay thế.',
  },
  {
    id: 84,
    topic: 'general',
    topicLabel: 'General Android',
    question: 'BroadcastReceiver `Context.registerReceiver()` vs khai báo trong AndroidManifest khác nhau như thế nào?',
    options: [
      'Manifest-declared receiver nhận broadcast mọi lúc kể cả app không chạy. Dynamic receiver chỉ nhận khi app đang active và phải tự unregister để tránh leak',
      'Cả hai có khả năng nhận broadcast giống hệt nhau',
      'Manifest receiver nhanh hơn vì được OS cache',
      'Dynamic receiver không thể nhận system broadcast (BOOT_COMPLETED, CONNECTIVITY_CHANGE)',
    ],
    correct: 0,
    explanation: 'Manifest-declared: receiver được khởi chạy bởi OS kể cả app không chạy (limited từ Android 8.0 — chỉ implicit broadcast cụ thể được phép). Dynamic (registerReceiver): nhận broadcast khi app active, phải unregister trong onStop()/onDestroy() để tránh memory leak. Từ Android 8.0: hầu hết implicit broadcast không thể declare trong Manifest nữa.',
  },
  {
    id: 85,
    topic: 'general',
    topicLabel: 'General Android',
    question: 'Content Provider giải quyết vấn đề gì? Khi nào cần implement?',
    options: [
      'Content Provider là cách duy nhất để lưu data trong Android',
      'Content Provider cung cấp abstraction layer để share data giữa các app khác nhau qua URI interface. Cần implement khi muốn expose data cho app khác hoặc framework (SearchManager, SyncAdapter, FileProvider)',
      'Content Provider chỉ dùng cho database, không phải file',
      'Content Provider tự động sync data với cloud',
    ],
    correct: 1,
    explanation: 'Content Provider: IPC-safe interface để share data qua content:// URI. Android system dùng nó cho Contacts, Calendar, Media. Implement khi: (1) Share data với app khác (2) Custom search suggestion (SearchProvider) (3) SyncAdapter cho account sync (4) FileProvider để share file URI an toàn. Không cần nếu chỉ dùng trong app mình.',
  },
  {
    id: 86,
    topic: 'general',
    topicLabel: 'General Android',
    question: 'Room Database — tại sao không được query Database trên Main Thread?',
    options: [
      'Vì Room không hỗ trợ query trên Main Thread về mặt kỹ thuật',
      'Query DB là blocking I/O operation có thể mất nhiều milliseconds → block Main Thread → jank hoặc ANR (Application Not Responding) nếu block > 5 giây',
      'Vì SQLite không thread-safe và chỉ hoạt động trên worker thread',
      'Vì Room API chỉ trả về Flow/LiveData, không hỗ trợ synchronous call',
    ],
    correct: 1,
    explanation: 'SQLite query phụ thuộc vào: kích thước table, chỉ mục (index), complexity của JOIN. Không có thời gian tối thiểu garantee. Worst case: query full scan table 100k rows mất vài giây → ANR. Room mặc định throw `IllegalStateException: Cannot access database on the main thread` để enforce best practice. Luôn dùng `suspend fun`, Flow, hoặc LiveData từ Room.',
  },
  {
    id: 87,
    topic: 'general',
    topicLabel: 'General Android',
    question: 'Tại sao cần dùng `FileProvider` thay vì `Uri.fromFile()` từ Android 7.0+?',
    options: [
      'Vì `Uri.fromFile()` bị deprecated và không còn trong API mới',
      'Android 7.0+ enforce FileUriExposedException: không thể share file:// URI giữa các app vì vi phạm security (app khác có thể access path tùy ý). FileProvider tạo content:// URI an toàn với permission kiểm soát',
      'FileProvider nhanh hơn Uri.fromFile() vì dùng memory-mapped file',
      'FileProvider là bắt buộc chỉ khi share với app hệ thống (Camera, Gallery)',
    ],
    correct: 1,
    explanation: 'Android 7.0 (API 24): `file://` URI khi share qua Intent → `FileUriExposedException`. Lý do bảo mật: URI tiết lộ đường dẫn thực, app nhận có thể access toàn bộ storage của app gửi. FileProvider tạo `content://com.example.fileprovider/...` URI với READ/WRITE permission tạm thời, chỉ app nhận Intent mới có quyền access file đó.',
  },
  {
    id: 88,
    topic: 'general',
    topicLabel: 'General Android',
    question: 'Android Keystore System dùng để làm gì?',
    options: [
      'Lưu trữ file key-value đơn giản như SharedPreferences',
      'Cung cấp hardware-backed key storage và cryptographic operations — private key không bao giờ rời khỏi secure hardware (TEE/StrongBox), ngay cả app cũng không thể đọc raw key material',
      'Quản lý API key và secret cho network request',
      'Encrypt toàn bộ SharedPreferences tự động',
    ],
    correct: 1,
    explanation: 'Android Keystore: key được generate và lưu trong Trusted Execution Environment (TEE) hoặc StrongBox (dedicated secure chip). Key không bao giờ export ra — app chỉ dùng key qua Keystore API để encrypt/decrypt/sign. Keystore có thể require: biometric authentication, screen lock, time-based restrictions trước khi cho phép dùng key.',
  },
  {
    id: 89,
    topic: 'general',
    topicLabel: 'General Android',
    question: 'Tại sao `DataStore` được khuyến nghị thay thế `SharedPreferences`?',
    options: [
      'DataStore nhanh hơn SharedPreferences 10x',
      'SharedPreferences: synchronous, không an toàn trên main thread, có thể gây StrictMode violation và ANR. DataStore: asynchronous với Flow/coroutines, type-safe (Proto DataStore), không ANR-prone',
      'SharedPreferences bị deprecated và xóa khỏi API mới',
      'DataStore có thể lưu file và hình ảnh, SharedPreferences chỉ lưu primitive types',
    ],
    correct: 1,
    explanation: 'SharedPreferences.edit().commit() blocks main thread. apply() async nhưng không guarantee write trước process kill. Không type-safe, không hỗ trợ complex object. DataStore Preferences: suspend fun, Flow, async hoàn toàn. Proto DataStore: strongly-typed với Protocol Buffers. Cả hai dùng atomic writes và handle IOException properly.',
  },
  {
    id: 90,
    topic: 'general',
    topicLabel: 'General Android',
    question: 'Cơ chế hoạt động của `LiveData` khác `StateFlow` như thế nào trên Android?',
    options: [
      'LiveData chậm hơn StateFlow vì dùng Java Observable pattern',
      'LiveData: lifecycle-aware tự động (chỉ update khi observer STARTED/RESUMED), tích hợp sẵn với Android. StateFlow: Kotlin-first, cần kết hợp repeatOnLifecycle để lifecycle-safe, linh hoạt hơn trong pipeline operator',
      'StateFlow chỉ dùng được trong ViewModel, LiveData dùng ở mọi nơi',
      'Hai loại hoàn toàn tương đương, chỉ khác syntax',
    ],
    correct: 1,
    explanation: 'LiveData: aware của Lifecycle tự động — chỉ deliver update khi observer ở STARTED/RESUMED, tự clear observer khi DESTROYED. StateFlow: không aware lifecycle mặc định, cần `repeatOnLifecycle(STARTED)` để có behavior tương tự. StateFlow có lợi thế: operator phong phú (map, filter, combine), không phụ thuộc Android SDK, dễ test thuần Kotlin.',
  },
  {
    id: 91,
    topic: 'general',
    topicLabel: 'General Android',
    question: 'ANR (Application Not Responding) xảy ra khi nào và cách debug?',
    options: [
      'ANR xảy ra khi app dùng quá nhiều RAM',
      'ANR xảy ra khi Main Thread bị block: >5s khi xử lý broadcast, >5s khi không response input event, >10s khi Service khởi tạo. Debug: adb pull /data/anr/traces.txt, Android Vitals, Perfetto',
      'ANR chỉ xảy ra trên thiết bị RAM thấp hơn 2GB',
      'ANR được trigger khi app crash với uncaught exception',
    ],
    correct: 1,
    explanation: 'ANR triggers: (1) Input dispatch timeout >5s — user touch không response. (2) Broadcast receiver >5s trong onReceive(). (3) Service không start trong 5-20s. Debug: traces.txt chứa stack trace của tất cả thread lúc ANR. Tìm Main Thread và xem nó đang block ở đâu (I/O, lock, long computation). Android Vitals trong Play Console báo cáo ANR rate từ production.',
  },
  {
    id: 92,
    topic: 'general',
    topicLabel: 'General Android',
    question: 'Cơ chế nào Android dùng để giao tiếp giữa các process khác nhau (IPC)?',
    options: [
      'Android không hỗ trợ giao tiếp giữa các process',
      'Binder IPC — cơ chế IPC tùy chỉnh của Android, dùng Linux kernel driver. Intents, ContentProvider, AIDL, Messenger, và Services đều build trên Binder',
      'Android dùng POSIX socket giống Linux thông thường',
      'Android dùng shared memory file thông qua /proc filesystem',
    ],
    correct: 1,
    explanation: 'Binder là IPC backbone của Android. Kernel driver /dev/binder cho phép process A gọi method trực tiếp trên object ở process B với overhead thấp (chỉ 1 memory copy thay vì 2 của IPC truyền thống). AIDL (Android Interface Definition Language) generate stub/proxy code cho Binder. Activity, Service, ContentProvider đều giao tiếp với SystemServer qua Binder.',
  },
  {
    id: 93,
    topic: 'general',
    topicLabel: 'General Android',
    question: 'Khác biệt giữa `FLAG_ACTIVITY_NEW_TASK` và `FLAG_ACTIVITY_CLEAR_TOP`?',
    options: [
      'Cả hai đều có tác dụng giống nhau — start Activity trong Task mới',
      '`NEW_TASK`: start Activity trong Task mới (hoặc Task phù hợp với taskAffinity). `CLEAR_TOP`: nếu Activity đã có trong stack, pop tất cả Activity phía trên nó và bring nó lên top (tương tự singleTask behavior)',
      '`CLEAR_TOP` xóa toàn bộ back stack và restart app',
      '`NEW_TASK` chỉ dùng được từ Service, `CLEAR_TOP` chỉ dùng từ Activity',
    ],
    correct: 1,
    explanation: 'NEW_TASK: cần khi start Activity từ non-Activity context (Service, BroadcastReceiver) vì không có Task hiện tại. CLEAR_TOP: tìm Activity trong current Task → pop mọi thứ phía trên + recreate hoặc reuse Activity đó. Combine NEW_TASK + CLEAR_TOP: thường dùng để "đi về home screen" trong deep link, clear toàn bộ back stack và start MainActivity.',
  },
  {
    id: 94,
    topic: 'general',
    topicLabel: 'General Android',
    question: 'Firebase Cloud Messaging (FCM) `data payload` vs `notification payload` — khi nào dùng cái nào?',
    options: [
      'Cả hai hoàn toàn giống nhau, chỉ khác tên',
      '`notification payload`: FCM tự hiển thị notification khi app ở background (không qua app code). `data payload`: luôn delivered tới onMessageReceived() để app xử lý — cần khi muốn custom notification hoặc trigger background work',
      '`data payload` có giới hạn 256 bytes, `notification payload` không giới hạn',
      '`notification payload` chỉ hoạt động khi app đang foreground',
    ],
    correct: 1,
    explanation: 'Notification payload: khi app background → FCM system tray notification tự động, onMessageReceived() KHÔNG gọi. Khi app foreground → onMessageReceived() gọi, app tự handle. Data payload: luôn gọi onMessageReceived() bất kể foreground/background → app kiểm soát hoàn toàn. Best practice: dùng data-only payload để custom notification style, tracking analytics, trigger WorkManager task.',
  },
  {
    id: 95,
    topic: 'general',
    topicLabel: 'General Android',
    question: 'Jetpack Compose `remember` và `rememberSaveable` khác nhau như thế nào?',
    options: [
      '`rememberSaveable` chậm hơn `remember` vì serialize data',
      '`remember`: giữ state qua recomposition nhưng mất khi Composable rời khỏi composition hoặc screen rotate. `rememberSaveable`: persist state qua rotation và Process Death bằng Bundle',
      '`rememberSaveable` chỉ dùng được với primitive types',
      'Hai loại hoàn toàn giống nhau về behavior',
    ],
    correct: 1,
    explanation: '`remember { mutableStateOf(value) }`: survive recomposition, mất khi Composable leave composition (như navigation away) hoặc config change (rotation). `rememberSaveable { mutableStateOf(value) }`: tự động save/restore qua Bundle khi config change và process death — giống onSaveInstanceState() nhưng declarative. Cần `Saver` custom cho object không parcelable.',
  },
  {
    id: 96,
    topic: 'general',
    topicLabel: 'General Android',
    question: 'Permission runtime (Dangerous Permission) cần xử lý như thế nào đúng chuẩn?',
    options: [
      'Request permission trong onCreate() ngay khi app khởi động',
      'Request khi user thực sự cần tính năng đó (just-in-time), show rationale nếu user từ chối lần trước, handle permanently denied bằng cách mở Settings',
      'Dùng `checkSelfPermission()` và request trong onResume()',
      'Khai báo trong AndroidManifest là đủ, không cần runtime check',
    ],
    correct: 1,
    explanation: 'Best practices: (1) Just-in-time: request khi feature cần (không request location khi mở app). (2) Explain why trước khi request. (3) `shouldShowRequestPermissionRationale()`: true → user từ chối nhưng chưa tick "Don\'t ask again" → show rationale. (4) Nếu denied vĩnh viễn → hướng user vào Settings > App Permissions. (5) Design feature graceful degradation khi không có permission.',
  },
  {
    id: 97,
    topic: 'general',
    topicLabel: 'General Android',
    question: 'Deep Link trong Android — `App Link` (verified) khác `Custom Scheme` như thế nào?',
    options: [
      'App Link dùng https://, Custom Scheme dùng myapp://, không có sự khác biệt về security',
      'Custom Scheme (`myapp://path`): bất kỳ app nào có thể claim → hijacking risk. App Link (`https://example.com/path`): verified qua Digital Asset Links file trên server → chỉ app được verify mới handle, Android bypass app chooser dialog',
      'App Link chỉ hoạt động khi có kết nối internet',
      'Custom Scheme không được phép trong Google Play Store',
    ],
    correct: 1,
    explanation: 'Custom Scheme: nếu 2 app đều declare myapp://, Android show chooser dialog — ambiguous và hijacking risk. App Links: domain owner đặt `/.well-known/assetlinks.json` chứa SHA256 fingerprint của app. Android verify và auto-handle link không cần dialog. Nếu verify fail, fallback về browser. Bảo mật hơn và UX mượt mà hơn.',
  },
  {
    id: 98,
    topic: 'general',
    topicLabel: 'General Android',
    question: 'Accessibility Service — điều gì cần lưu ý khi implement tính năng Accessibility trong app?',
    options: [
      'Accessibility chỉ cần thiết cho app của người khuyết tật, app thông thường không cần quan tâm',
      'ContentDescription cho View, importantForAccessibility, live regions cho dynamic content, semantic role, custom action description — giúp TalkBack đọc UI chính xác',
      'Chỉ cần tăng font size là đủ cho Accessibility',
      'Accessibility framework tự động handle tất cả, không cần code thêm',
    ],
    correct: 1,
    explanation: 'Accessibility cho phép screen reader (TalkBack), switch access, voice access hoạt động. Implementation: `contentDescription` cho Image/Icon. `importantForAccessibility="no"` cho decorative elements. `accessibilityLiveRegion` cho content thay đổi động (loading spinner). Compose: `Modifier.semantics{}`. Custom View: override `onInitializeAccessibilityNodeInfo()`. Test bằng TalkBack và Accessibility Scanner.',
  },
  {
    id: 99,
    topic: 'general',
    topicLabel: 'General Android',
    question: 'Về bảo mật, tại sao không nên log sensitive data trong production?',
    options: [
      'Vì Log làm chậm app',
      'Android Log (Logcat) có thể đọc bởi bất kỳ app nào có READ_LOGS permission (và mặc định được đọc bởi nhiều debug/tracking tool). Sensitive data (token, password, PII) trong log → security vulnerability',
      'Vì Google Play cấm log trong production app',
      'Chỉ cần dùng Log.d() thay vì Log.e() là an toàn',
    ],
    correct: 1,
    explanation: 'Trên thiết bị rooted hoặc Android < 4.1, tất cả log đọc được. Từ 4.1+: READ_LOGS permission cần, nhưng system app và manufacturer app thường có permission này. Crash reporting SDK (Crashlytics) capture log và send lên server. Best practice: (1) Strip log trong release build với ProGuard. (2) Không log token, password, user data. (3) Dùng BuildConfig.DEBUG guard.',
  },
  {
    id: 100,
    topic: 'general',
    topicLabel: 'General Android',
    question: 'Jetpack Compose Recomposition — điều kiện nào khiến Composable KHÔNG recompose dù input thay đổi?',
    options: [
      'Composable sẽ luôn recompose khi bất kỳ parameter nào thay đổi',
      'Nếu parameter là `stable type` và giá trị equal (==) với lần render trước → Compose skip recomposition (smart recomposition). Unstable type (List, class không annotate @Stable/@Immutable) luôn trigger recompose',
      'Composable chỉ recompose khi được gọi explicit bằng invalidate()',
      'Composable không bao giờ skip recompose để đảm bảo UI luôn up-to-date',
    ],
    correct: 1,
    explanation: 'Compose Compiler generate code kiểm tra stability của parameters. Stable types (primitive, String, @Stable class, @Immutable data class): nếu value == giá trị trước → skip recompose. Unstable types (List, Map, mutable class): luôn recompose kể cả data không đổi. Solution: wrap trong `ImmutableList` (Kotlinx Immutable Collections) hoặc annotate `@Stable`/`@Immutable`. Dùng Compose Compiler Metrics để audit stability.',
  },
];

const TOPICS = [
  { id: 'all', label: '🎯 Tất cả', color: '#1b9c5a' },
  { id: 'activity', label: '📱 Activity & Fragment', color: '#2196F3' },
  { id: 'coroutines', label: '⚡ Coroutines', color: '#9C27B0' },
  { id: 'architecture', label: '🏗️ Architecture', color: '#FF9800' },
  { id: 'performance', label: '🚀 Performance', color: '#F44336' },
  { id: 'general', label: '🤖 General Android', color: '#607D8B' },
];

const RANKS = [
  { min: 90, label: '👑 Lead Engineer', desc: 'Xuất sắc! Kiến thức vượt trội của bậc thầy.', color: '#FFD700' },
  { min: 75, label: '🏆 Senior Developer', desc: 'Rất tốt! Sẵn sàng cho vị trí Senior.', color: '#3DDC84' },
  { min: 55, label: '💼 Mid-Level Developer', desc: 'Tốt! Đang trên đường đến Senior.', color: '#2196F3' },
  { min: 35, label: '🌱 Junior Developer', desc: 'Tiếp tục ôn luyện, bạn sẽ làm được!', color: '#FF9800' },
  { min: 0,  label: '☕ Intern', desc: 'Hãy đọc thêm docs và thực hành nhiều hơn!', color: '#9E9E9E' },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getRank(pct) {
  return RANKS.find(r => pct >= r.min);
}

const TIMER_DURATION = 20;

// ─── Main Quiz Component ────────────────────────────────────────────────────

export default function QuizPage() {
  const { siteConfig } = useDocusaurusContext();

  // Game state
  const [screen, setScreen] = useState('home'); // 'home' | 'playing' | 'result'
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [shuffledOptions, setShuffledOptions] = useState([]);
  const [correctOptionIdx, setCorrectOptionIdx] = useState(0);

  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [timer, setTimer] = useState(TIMER_DURATION);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [answers, setAnswers] = useState([]); // [{question, selectedIdx, correctIdx, options, isCorrect, points}]
  const [bonusEarned, setBonusEarned] = useState(false);

  const timerRef = useRef(null);

  // Prepare shuffled options for current question
  useEffect(() => {
    if (questions.length === 0 || currentIdx >= questions.length) return;
    const q = questions[currentIdx];
    const indexed = q.options.map((opt, i) => ({ text: opt, originalIdx: i }));
    const shuffled = shuffle(indexed);
    setShuffledOptions(shuffled);
    setCorrectOptionIdx(shuffled.findIndex(o => o.originalIdx === q.correct));
  }, [questions, currentIdx]);

  // Timer
  useEffect(() => {
    if (screen !== 'playing' || selectedAnswer !== null) return;
    if (timer <= 0) {
      handleAnswer(-1); // timeout
      return;
    }
    timerRef.current = setTimeout(() => setTimer(t => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [screen, timer, selectedAnswer]);

  const startGame = useCallback(() => {
    const pool = selectedTopic === 'all'
      ? ALL_QUESTIONS
      : ALL_QUESTIONS.filter(q => q.topic === selectedTopic);
    const selected = shuffle(pool).slice(0, Math.min(15, pool.length));
    setQuestions(selected);
    setCurrentIdx(0);
    setScore(0);
    setStreak(0);
    setAnswers([]);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setTimer(TIMER_DURATION);
    setBonusEarned(false);
    setScreen('playing');
  }, [selectedTopic]);

  const calcPoints = useCallback((timeLeft) => {
    if (timeLeft > 15) return 10;
    if (timeLeft > 10) return 7;
    return 5;
  }, []);

  const handleAnswer = useCallback((shuffledIdx) => {
    if (selectedAnswer !== null) return;
    clearTimeout(timerRef.current);

    const isCorrect = shuffledIdx === correctOptionIdx;
    const newStreak = isCorrect ? streak + 1 : 0;
    const points = isCorrect ? calcPoints(timer) : 0;
    const bonus = isCorrect && newStreak > 0 && newStreak % 3 === 0 ? 5 : 0;

    setSelectedAnswer(shuffledIdx);
    setShowExplanation(true);
    setStreak(newStreak);
    setScore(s => s + points + bonus);
    setBonusEarned(bonus > 0);

    const q = questions[currentIdx];
    setAnswers(prev => [...prev, {
      question: q,
      shuffledOptions,
      shuffledSelectedIdx: shuffledIdx,
      shuffledCorrectIdx: correctOptionIdx,
      isCorrect,
      points: points + bonus,
      timeLeft: timer,
    }]);
  }, [selectedAnswer, correctOptionIdx, streak, timer, calcPoints, questions, currentIdx, shuffledOptions]);

  const goNext = useCallback(() => {
    if (currentIdx + 1 >= questions.length) {
      setScreen('result');
      return;
    }
    setCurrentIdx(i => i + 1);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setTimer(TIMER_DURATION);
    setBonusEarned(false);
  }, [currentIdx, questions.length]);

  const restartHome = () => {
    setScreen('home');
    setQuestions([]);
    setCurrentIdx(0);
  };

  // ── Render ──

  const currentQ = questions[currentIdx];
  const totalQ = questions.length;
  const maxScore = totalQ * 10;
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const rank = getRank(percentage);
  const topicInfo = TOPICS.find(t => t.id === selectedTopic);

  const timerPct = (timer / TIMER_DURATION) * 100;
  const timerColor = timer > 10 ? '#3DDC84' : timer > 5 ? '#FF9800' : '#F44336';

  return (
    <Layout
      title="Android Quiz 🎮"
      description="Kiểm tra kiến thức Android của bạn với bộ câu hỏi phỏng vấn Senior"
    >
      <div className="quiz-root">

        {/* ── HOME SCREEN ── */}
        {screen === 'home' && (
          <div className="quiz-home">
            <div className="quiz-home-hero">
              <div className="quiz-home-icon">🤖</div>
              <h1 className="quiz-home-title">Android Knowledge Quiz</h1>
              <p className="quiz-home-subtitle">
                Kiểm tra kiến thức phỏng vấn Android của bạn.<br />
                40+ câu hỏi về Activity, Coroutines, Architecture, Performance.
              </p>
            </div>

            <div className="quiz-stats-row">
              <div className="quiz-stat-card">
                <span className="quiz-stat-num">40+</span>
                <span className="quiz-stat-label">Câu hỏi</span>
              </div>
              <div className="quiz-stat-card">
                <span className="quiz-stat-num">5</span>
                <span className="quiz-stat-label">Chủ đề</span>
              </div>
              <div className="quiz-stat-card">
                <span className="quiz-stat-num">20s</span>
                <span className="quiz-stat-label">Mỗi câu</span>
              </div>
            </div>

            <div className="quiz-section-title">Chọn chủ đề</div>
            <div className="quiz-topics-grid">
              {TOPICS.map(t => (
                <button
                  key={t.id}
                  className={`quiz-topic-btn ${selectedTopic === t.id ? 'active' : ''}`}
                  style={selectedTopic === t.id ? { borderColor: t.color, backgroundColor: t.color + '22' } : {}}
                  onClick={() => setSelectedTopic(t.id)}
                >
                  <span>{t.label}</span>
                  {t.id !== 'all' && (
                    <span className="quiz-topic-count">
                      {ALL_QUESTIONS.filter(q => q.topic === t.id).length} câu
                    </span>
                  )}
                </button>
              ))}
            </div>

            <button className="quiz-start-btn" onClick={startGame}>
              ▶ Bắt đầu Game
            </button>

            <div className="quiz-rank-preview">
              <div className="quiz-section-title" style={{ marginBottom: '0.75rem' }}>Bảng xếp hạng</div>
              <div className="quiz-rank-list">
                {RANKS.map(r => (
                  <div key={r.label} className="quiz-rank-row">
                    <span className="quiz-rank-badge" style={{ color: r.color }}>{r.label}</span>
                    <span className="quiz-rank-pct">≥ {r.min}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── PLAYING SCREEN ── */}
        {screen === 'playing' && currentQ && (
          <div className="quiz-playing">
            {/* Header */}
            <div className="quiz-play-header">
              <button className="quiz-exit-btn" onClick={restartHome}>✕ Thoát</button>
              <div className="quiz-play-meta">
                <span className="quiz-play-topic" style={{ color: topicInfo?.color }}>
                  {currentQ.topicLabel}
                </span>
                <span className="quiz-play-progress">
                  {currentIdx + 1} / {totalQ}
                </span>
              </div>
              <div className="quiz-score-display">
                <span>⭐ {score}</span>
                {streak >= 2 && <span className="quiz-streak">🔥 {streak}</span>}
              </div>
            </div>

            {/* Progress bar */}
            <div className="quiz-progress-bar">
              <div
                className="quiz-progress-fill"
                style={{ width: `${((currentIdx) / totalQ) * 100}%` }}
              />
            </div>

            {/* Timer */}
            <div className="quiz-timer-row">
              <div className="quiz-timer-bar">
                <div
                  className="quiz-timer-fill"
                  style={{
                    width: `${timerPct}%`,
                    backgroundColor: timerColor,
                    transition: 'width 1s linear, background-color 0.3s',
                  }}
                />
              </div>
              <span className="quiz-timer-num" style={{ color: timerColor }}>{timer}s</span>
            </div>

            {/* Question */}
            <div className="quiz-question-card">
              <p className="quiz-question-text">{currentQ.question}</p>
            </div>

            {/* Options */}
            <div className="quiz-options-grid">
              {shuffledOptions.map((opt, idx) => {
                let cls = 'quiz-option';
                if (selectedAnswer !== null) {
                  if (idx === correctOptionIdx) cls += ' correct';
                  else if (idx === selectedAnswer) cls += ' wrong';
                  else cls += ' disabled';
                }
                return (
                  <button
                    key={idx}
                    className={cls}
                    onClick={() => handleAnswer(idx)}
                    disabled={selectedAnswer !== null}
                  >
                    <span className="quiz-option-label">{String.fromCharCode(65 + idx)}</span>
                    <span className="quiz-option-text">{opt.text}</span>
                  </button>
                );
              })}
            </div>

            {/* Bonus feedback */}
            {bonusEarned && (
              <div className="quiz-bonus-toast">🔥 Combo! +5 điểm thưởng</div>
            )}

            {/* Explanation */}
            {showExplanation && (
              <div className="quiz-explanation">
                <div className="quiz-explanation-header">
                  <span>{selectedAnswer === correctOptionIdx ? '✅ Chính xác!' : (selectedAnswer === -1 ? '⏰ Hết giờ!' : '❌ Sai rồi!')}</span>
                  {selectedAnswer === correctOptionIdx && (
                    <span className="quiz-points-earned">+{answers[answers.length - 1]?.points} điểm</span>
                  )}
                </div>
                <p className="quiz-explanation-text">{currentQ.explanation}</p>
                <button className="quiz-next-btn" onClick={goNext}>
                  {currentIdx + 1 >= totalQ ? '🏁 Xem kết quả' : 'Câu tiếp →'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── RESULT SCREEN ── */}
        {screen === 'result' && (
          <div className="quiz-result">
            <div className="quiz-result-hero">
              <div className="quiz-result-rank-badge" style={{ color: rank.color }}>
                {rank.label}
              </div>
              <div className="quiz-result-score-circle" style={{ borderColor: rank.color }}>
                <span className="quiz-result-pct">{percentage}%</span>
                <span className="quiz-result-score-label">{score} / {maxScore} điểm</span>
              </div>
              <p className="quiz-result-desc">{rank.desc}</p>
            </div>

            {/* Stats */}
            <div className="quiz-result-stats">
              <div className="quiz-result-stat">
                <span className="quiz-result-stat-num" style={{ color: '#3DDC84' }}>
                  {answers.filter(a => a.isCorrect).length}
                </span>
                <span>Đúng</span>
              </div>
              <div className="quiz-result-stat">
                <span className="quiz-result-stat-num" style={{ color: '#F44336' }}>
                  {answers.filter(a => !a.isCorrect).length}
                </span>
                <span>Sai</span>
              </div>
              <div className="quiz-result-stat">
                <span className="quiz-result-stat-num" style={{ color: '#FF9800' }}>
                  {Math.max(...answers.map(a => a.timeLeft || 0), 0)}s
                </span>
                <span>Nhanh nhất</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="quiz-result-actions">
              <button className="quiz-start-btn" onClick={startGame}>🔄 Chơi lại</button>
              <button className="quiz-outline-btn" onClick={restartHome}>🏠 Về trang chủ</button>
            </div>

            {/* Review wrong answers */}
            {answers.filter(a => !a.isCorrect).length > 0 && (
              <div className="quiz-review">
                <h2 className="quiz-review-title">📝 Xem lại câu sai</h2>
                {answers
                  .filter(a => !a.isCorrect)
                  .map((a, i) => (
                    <div key={i} className="quiz-review-item">
                      <div className="quiz-review-q">{a.question.question}</div>
                      <div className="quiz-review-answers">
                        {a.shuffledOptions.map((opt, idx) => (
                          <div
                            key={idx}
                            className={`quiz-review-opt ${idx === a.shuffledCorrectIdx ? 'correct' : idx === a.shuffledSelectedIdx ? 'wrong' : ''}`}
                          >
                            <span className="quiz-option-label">{String.fromCharCode(65 + idx)}</span>
                            {opt.text}
                          </div>
                        ))}
                      </div>
                      <div className="quiz-review-explanation">
                        💡 {a.question.explanation}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
