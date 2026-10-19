---
title: Chiến lược test theo rủi ro
sidebar_position: 1
---

# Test theo rủi ro và đúng boundary

Senior không chỉ tăng coverage hoặc số mock. Một bộ test hữu ích phải phát hiện failure quan trọng ở nơi nó có thể xảy ra và có chi phí chạy/bảo trì phù hợp. Test thuần logic không thay thế test Android lifecycle; screenshot đúng không chứng minh persistence đúng.

## 1. Chọn nơi kiểm chứng

| Rủi ro | Loại bằng chứng phù hợp |
| --- | --- |
| Pricing/reducer/mapping | JVM test với dữ liệu boundary |
| Coroutine timing và cancellation | Test scheduler, fake có thể điều khiển |
| SQL transaction/migration | Room/database integration test theo schema cũ |
| HTTP status, timeout, refresh | HTTP test server hoặc fake transport theo contract |
| UI action/semantics/accessibility | UI test và kiểm tra công cụ hỗ trợ |
| Process restoration | Kịch bản mất process riêng, không chỉ Activity recreate |
| Startup/frame regression | Macrobenchmark trên build/thiết bị phù hợp |
| Credential/log leakage | Release config/artifact và runtime capture đã kiểm soát |

Mỗi test cần nói rõ nó chứng minh điều gì và không chứng minh điều gì. Coverage cao có thể bỏ sót auth race hoặc migration mất dữ liệu nếu chỉ đi qua happy path.

## 2. Fake, mock và test server

Fake giữ behavior nhỏ, dễ điều khiển: repository trả state, đồng hồ cố định hoặc API chờ một Deferred. Mock hữu ích để kiểm tra interaction là contract thực sự, như không gọi analytics khi user chưa consent. Tránh verify mọi lời gọi nội bộ nếu refactor không đổi behavior sẽ làm test vỡ.

Test server giúp kiểm tra serialization/header/status mà fake repository bỏ qua. Ngược lại, không cần chạy HTTP server cho mọi reducer test. Chọn phạm vi nhỏ nhất vẫn bao phủ failure cần bắt.

## 3. Deterministic không đồng nghĩa chờ thật lâu

`Thread.sleep` làm test phụ thuộc tốc độ máy. Với coroutines, dùng scheduler được inject; với UI, dùng synchronization/IdlingResource hoặc điều kiện bounded phù hợp nguồn dữ liệu. Timeout là cơ chế phát hiện failure, không phải kỳ vọng rằng sau N milliseconds công việc chắc chắn xong.

Dùng `runTest` không tự điều khiển IO/Default thật, clock hệ thống hay server bên ngoài. Chia sẻ cùng TestCoroutineScheduler giữa dispatcher test cần phối hợp; reset global Main sau test nếu có thay.

## 4. Test plan cho checkout

| Failure injection | Expected behavior |
| --- | --- |
| Double tap | Một logical request ID theo policy |
| Response I/O fail trước commit | Có đường retry không tạo ID vô cớ |
| Server commit nhưng response mất | Reconcile cùng ID, không tạo đơn thứ hai |
| UI STOPPED khi response về | Kết quả quan trọng có nguồn để dựng lại |
| Process death | State nhỏ + persisted data tải lại được |
| Logout giữa refresh | Session cũ không ghi đè phiên mới |
| Migration schema | Cart/outbox cũ không bị xóa ngoài ý muốn |

Đây là yêu cầu bài thực hành, không phải báo cáo các test Android đã chạy trong repository website này.

## 5. Đưa vào CI và release

Chạy unit/contract tests nhanh ở PR; chạy integration/UI theo rủi ro, thiết bị và thời gian phù hợp. Flaky test cần owner, reproducer và hạn sửa; retry vô hạn che lỗi không tạo confidence. Với performance, giữ baseline, artifact trace và điều kiện đo để so sánh có nghĩa.

Trước release, kiểm tra signing/config, migration từ phiên bản đang được hỗ trợ, quan sát crash/ANR theo rollout cohort và định nghĩa rollback/stop condition. App rollout và backend compatibility phải được xét cùng nhau.

Nguồn: [Fundamentals of testing](https://developer.android.com/training/testing/fundamentals), [coroutine testing](https://developer.android.com/kotlin/coroutines/test), [Compose synchronization](https://developer.android.com/develop/ui/compose/testing/synchronization).

Đọc tiếp: [JUnit](./junit.md), [coroutines](./coroutines.md), [UI testing](./ui-testing.md), [capstone và rubric](../interview/senior-capstone.md).
