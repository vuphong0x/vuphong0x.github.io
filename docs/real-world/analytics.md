---
title: Observability, crash reports và privacy
---

# Quan sát production mà không làm lộ dữ liệu

Chọn crash reporting, metrics và analytics theo yêu cầu sản phẩm, quyền riêng tư và chi phí vận hành. Không có SDK analytics bắt buộc cho mọi ứng dụng. Điều quan trọng là phát hiện lỗi có ý nghĩa, liên hệ được với phiên bản/user journey và giữ dữ liệu thu thập trong phạm vi cần thiết.

## 1. Từ triệu chứng đến tín hiệu

| Vấn đề | Tín hiệu hữu ích | Điều cần tránh |
| --- | --- | --- |
| Send message chậm | Latency theo logical operation, retry và pending age | Ghi nội dung message/token vào log |
| App giật khi cuộn | Frame timing theo journey/thiết bị | Chỉ đếm recomposition rồi kết luận |
| Migration lỗi | App/schema version, loại lỗi, cohort | Upload toàn database user để debug mặc định |
| Refresh session lặp | Nhóm lỗi, số follow-up, session transition đã chuẩn hóa | Dùng credential làm correlation ID |
| Crash release | Stack trace, mapping/symbols, build/version | Tưởng debug stack trace đủ cho mọi artifact |

Metric cần denominator và cohort: 10 lỗi trên 100 thao tác khác 10 lỗi trên một triệu thao tác. Không so percentile giữa hai nhóm thiết bị/build khác nhau mà bỏ qua điều kiện.

## 2. Non-fatal reporting có chọn lọc

Handled exception không đồng nghĩa mọi exception nên gửi lên crash reporter. Phân loại expected failure, cancellation và invariant violation. Không báo cancellation do user rời màn hình thành lỗi network; không gửi nguyên exception nếu message chứa URL/body nhạy cảm.

Một abstraction reporting nhỏ có thể nhận mã lỗi được kiểm soát thay vì arbitrary payload:

```kotlin
interface ReliabilityReporter {
    fun recordFailure(code: String, operation: String)
}
```

Adapter phía SDK quyết định mapping, sampling và collection policy. Không cho caller tự đính mọi object/credential vào map rồi xem interface là bảo đảm privacy. Khi cần stack trace thực, sanitize/phân loại theo policy trước khi thu thập.

Nguồn khả năng SDK: [Customize Crashlytics reports](https://firebase.google.com/docs/crashlytics/customize-crash-reports?platform=android).

## 3. Context và cardinality

Build version, screen đã chuẩn hóa và enum operation thường hữu ích hơn chuỗi chứa user content. ID quá nhiều giá trị có thể tăng cardinality và làm dashboard khó dùng/tốn chi phí; raw user identifier còn có tác động privacy. Chọn retention, consent/collection mode và cách xóa/liên kết dữ liệu theo yêu cầu sản phẩm.

Không ghi password, Authorization, refresh token, payment payload hoặc message body chỉ vì đang debug production. Redaction cần xét header, URL, query, body, exception message và breadcrumb.

## 4. Nối quan sát với hành động

Mỗi alert cần owner, độ ưu tiên, điều kiện so sánh và bước điều tra. Với regression release, kiểm tra cohort/version, trace/reproducer và khả năng tắt/rollback trước khi kết luận nguyên nhân. Một biểu đồ tăng cùng thời điểm deploy là manh mối, chưa tự chứng minh quan hệ nhân quả.

**Bài tập:** thiết kế dashboard cho capstone chat: send success theo logical operation, pending age, retry count, crash/ANR và startup/frame metrics. Với mỗi metric, ghi nguồn, denominator, dữ liệu nhạy cảm không được thu thập và quyết định có thể dựa vào nó.

Đọc tiếp: [security/log policy](../security/security-model.md#session), [profiling](../performance/profiling.md), [release gates](./ci-cd.md).
