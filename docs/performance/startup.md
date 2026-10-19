---
title: Startup, App Startup và Baseline Profiles
---

# Tối ưu startup bằng user journey và phép đo

Startup nhanh là khi user đến được nội dung có ích theo yêu cầu sản phẩm, không chỉ nhìn thấy splash sớm. Phân biệt **time to initial display** và thời điểm nội dung thực sự sẵn sàng; ghi rõ điểm kết thúc metric để tránh tối ưu một con số mà trải nghiệm không cải thiện.

## 1. Cold, warm và hot start

Cold start phải tạo process; warm/hot có các tài nguyên/instance được giữ lại khác nhau. Đừng suy ra loại start chỉ từ một thao tác Back trên mọi phiên bản Android. Benchmark cần setup kiểm soát được process/activity state.

Ngưỡng Android Vitals là chỉ báo chất lượng theo định nghĩa/platform, không phải mục tiêu trải nghiệm chung cho mọi app. Đặt budget cho user journey, thiết bị và dữ liệu của sản phẩm; xem tài liệu hiện hành khi đọc threshold.

Nguồn: [App startup time](https://developer.android.com/topic/performance/issues/launch-time).

## 2. Lập initialization graph

Liệt kê công việc trước frame đầu và dependency thật: đọc session, dựng root UI, SDK, database, analytics. Tách việc bắt buộc trước UI khỏi việc có thể defer/lazy; không chuyển mọi initialization sang coroutine mà không xét API yêu cầu thread/lifetime.

| Công việc | Câu hỏi review |
| --- | --- |
| SDK trong Application/provider | Có cần cho màn hình đầu? Có dependency ẩn? |
| Disk/network trên main | Có thể dùng cache/loading state hoặc API main-safe? |
| Database open/migration | Chi phí và đường lỗi có được đo/test? |
| Decode ảnh đầu màn hình | Decode đúng kích thước và nguồn cache? |
| Splash giữ lâu | Đang che loading/error nào? User có đường xử lý? |

App Startup giúp tổ chức dependency giữa initializer và giảm một số provider startup overhead khi được tích hợp đúng. Nó không tự làm initialization bất đồng bộ hoặc nhanh hơn. Không tự đăng ký thêm initializer WorkManager trong khi default initializer vẫn hoạt động; phải theo integration guide/version của thư viện.

Nguồn: [App Startup](https://developer.android.com/topic/libraries/app-startup).

## 3. Đo trước/sau, không so bằng cảm giác {#measurement}

Chọn cùng thiết bị, build gần release, dữ liệu, network/cache policy và compilation mode. Lặp nhiều lần, ghi biến động; thermal/background work có thể làm sai phép so sánh. Giữ trace để xác định thời gian trong main thread, Binder, I/O hoặc scheduling.

Không kết luận đổi XML sang Compose tự cải thiện startup. Cả hai đều có initialization/layout work cần đo. Cũng không coi số SDK ít hơn là bằng chứng startup nhanh nếu công việc nặng còn nằm trên critical path.

## 4. Baseline Profiles và R8

R8 tối ưu/shrink/obfuscate chương trình ở build pipeline; profile hướng dẫn runtime compile các code path quan trọng. Baseline Profile cần user journey phù hợp, packaging/installation được hỗ trợ và benchmark kiểm tra profile thật sự được dùng.

Không có mức tăng tốc cố định 30–40% cho mọi ứng dụng. So compilation modes có/không profile bằng Macrobenchmark, giữ cùng đầu vào và kiểm tra startup lẫn scrolling/action quan trọng. Profile không sửa synchronous network trên main hoặc một thuật toán quá tốn chi phí.

Nguồn: [Baseline Profiles](https://developer.android.com/topic/performance/baselineprofiles/overview).

## 5. Bài thực hành

Đo cold start tới feed có thể tương tác. Vẽ initialization graph, chọn một công việc defer được, đo lại và ghi tradeoff: frame đầu nhanh hơn nhưng action đầu tiên có bị chậm không? Thêm profile cho journey rồi kiểm tra độc lập lợi ích của thay đổi code và compilation.

Đọc tiếp: [Profiling/Macrobenchmark](./profiling.md#senior-measurement), [test strategy](../testing/test-strategy.md), [capstone](../interview/senior-capstone.md).
