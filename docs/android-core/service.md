# Service

### 1. Service là gì?

Service là 1 trong 4 component chính của Android. Nhiện vụ chính là thực hiện các tác vụ chạy ngầm, kéo dài mà không cần cung cấp UI. Ngay cả khi người dùng chuyển sang ứng dụng khác, Service vẫn có thể tiếp tục chạy.

Service mặc định chạy trên Main Thread. Do đó, nếu Service thực hiện các tác vụ nặng (như gọi API, truy vấn DB, xử lý file), chúng ta bắt buộc phải quản lý để đưa các tác vụ đó chạy trên Worker Thread (thông qua Coroutines, RxJava,...) để tránh lỗi ARN.

### 2. Có mấy loại Service?

Có 3 loại chính:

**a. Foreground Service**

**Đặc điểm:** Thực hiện một tác vụ mà người dùng có thể nhận biết được nó đang diễn ra

**Yêu cầu bắt buộc:** Foreground Service phải hiển thị một Notification liên tục để người dùng biết app đang chạy ngầm và tiêu thụ tài nguyên.

**Ví dụ:** Ứng dụng nghe nhạc phát nhạc khi tắt màn hình, hoặc ứng dụng đếm bước chân, tracking GPS ghi lại quãng đường di chuyển.

**b. Background Service**

**Đặc điểm:** Thực hiện một tác vụ mà người dùng không trực tiếp nhận biết được.

**Ví dụ:** Đồng bộ hóa dữ liệu định kỳ, nén file ngầm.

**Note:** Từ Android 8.0 (API 26), Google đã hạn chế với Background Service nhằm tiết kiệm pin và RAM. Nếu ứng dụng đang chạy ở background mà cố gắng chạy một Background Service thì hệ thống sẽ ném ra một `IllegalStateException`.

- Google khuyến cáo sử dụng WorkManager cho các tác vụ cần đảm bảo thực thi.

**c. Bound Service**

**Đặc điểm:** Cung cấp mô hình Client-Server. Service này cho phép các component khác (như Activity, Fragment) bind (ràng buộc) vào nó để gửi yêu cầu, nhận kết quả, hoặc thậm chí thực hiện giao tiếp liên tiến trình (IPC - Interprocess Communication) thông qua `AIDL`.

**Vòng đời:** Nó sống dựa trên các component bind vào nó. Khi tất cả các client đã unbind, hệ thống sẽ tự hủy Bound Service này.

**Ví dụ:** Activity muốn kết nối với Service đang phát nhạc để lấy thông tin bài hát hiện tại, cập nhật thanh tiến trình, hoặc ra lệnh play/pause.

Các giá trị trả về trong `onStartCommand()`

START\_NOT\_STICKY: Hệ thống sẽ **không** khởi động lại Service trừ khi có các Intent mới đang chờ được gửi tới.

START\_STICKY: Hệ thống **sẽ** khởi động lại Service, nhưng intent truyền vào hàm `onStartCommand()` sẽ là `null`.

START\_REDELIVER\_INTENT: Hệ thống **sẽ** khởi động lại Service và truyền lại đúng cái `Intent` cuối cùng mà Service nhận được trước khi bị kill.

Và một số giá trị khác nữa

### **Có nên so sánh Service với một Thread hay không?**{#_5-co-nen-so-sanh-service-voi-mot-thread-hay-khong-5}

- **Service là một Android Component:** Nó đại diện cho *mong muốn* của ứng dụng muốn thực hiện một tác vụ chạy nền (background operation) hoặc cung cấp tính năng cho app khác. Service có vòng đời (Lifecycle) rõ ràng (`onCreate`, `onStartCommand`, `onDestroy`) và được **Hệ điều hành Android (OS) quản lý**.

- **Thread là đơn vị thực thi của Hệ điều hành (OS Execution Unit):** Nó dùng để xử lý các tác vụ đồng thời (concurrency) để không làm đơ giao diện. Thread hoàn toàn "mù tịt" về vòng đời của Android Component. Khi bạn khởi tạo một `Thread`, Android OS không hề biết Thread đó đang làm gì hay có quan trọng không.
