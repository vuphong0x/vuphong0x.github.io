---
title: CI/CD, release gates và rollback
---

# CI/CD: từ bằng chứng ở PR đến rollout có kiểm soát

Pipeline tự động chạy lệnh; nó không tự bảo đảm build tái lập, test đủ hoặc merge bị chặn. Những điều đó cần cấu hình toolchain, dependency, branch/ruleset và release gate cụ thể. Một pipeline xanh chỉ hỗ trợ kết luận trong phạm vi các check thực sự chạy.

## 1. Thiết kế các tầng kiểm chứng

| Giai đoạn | Check cần chọn theo rủi ro | Artifact nên giữ |
| --- | --- | --- |
| Pull request | Compile, unit/contract tests, static checks phù hợp | Test report, lỗi có thể tái hiện |
| Integration | DB migration, HTTP contract, UI/lifecycle trên môi trường chọn trước | Logs đã redact, schema, report thiết bị |
| Release candidate | Release config, minification, signing, smoke journeys | APK/AAB, mapping/symbols, version/config |
| Rollout | Chất lượng theo cohort và metric sản phẩm | Crash/ANR, startup, sync failure và quyết định dừng |

Build debug thành công không chứng minh artifact minified release đúng. Migration cần được thử từ các schema đang hỗ trợ, không chỉ cài app mới. Giữ versioning/source revision để trace report production về đúng artifact.

## 2. Toolchain và dependency

Pin phiên bản công cụ/dependency theo policy project, dùng Gradle Wrapper và kiểm tra thay đổi wrapper/dependency review. Cache giúp tốc độ nhưng cũng cần phân biệt cold/warm behavior khi điều tra lỗi. Không tuyên bố mọi runner có môi trường “giống hệt” nếu image hoặc dependency vẫn thay đổi ngoài kiểm soát.

Tên task như `testDebugUnitTest`, `assembleDebug`, `bundleRelease` phụ thuộc Android project/variant. Đặt check đúng source set và variant; website này dùng pipeline Docusaurus, không phải các task Android đó.

## 3. Signing và credential

Tách upload/signing responsibilities theo Play App Signing và cấu hình phân phối thực tế. Credential có quyền tối thiểu, không lộ trong command log, artifact hoặc PR không tin cậy. Base64 chỉ là encoding, không phải encryption; quyền đọc secret/runner và lifetime file tạm mới là phần cần kiểm soát.

Chỉ cấp quyền release cho job/environment cần nó. Review third-party actions, inputs, permissions và version được pin theo policy. Không chạy release credential trên code PR từ nguồn không tin cậy mà không có boundary phù hợp.

Nguồn: [Android app signing](https://developer.android.com/studio/publish/app-signing).

## 4. Rollout và rollback có giới hạn

Trước rollout, định nghĩa metric/stop condition, thời gian quan sát và owner. Ví dụ pending-sync age tăng, migration crash ở một phiên bản cũ hoặc send success giảm theo cohort có thể quan trọng hơn crash-free rate toàn app.

Rollback client không chắc đảo ngược schema/server changes đã áp dụng. Backend cần compatibility với các phiên bản còn trong thực tế; schema migration/destructive changes cần kế hoạch recovery riêng. Feature flag có thể tắt một đường code nhưng không phục hồi dữ liệu đã bị xóa.

## 5. Bài tập release review

Chuẩn bị release thêm outbox và auth refresh. Ghi check ở PR, check integration, artifact release cần lưu, cohort theo dõi và cách xử lý nếu app cũ không đọc được schema mới. Chỉ ra gate nào do pipeline thực thi và gate nào cần cấu hình repository/store riêng.

Đọc tiếp: [test strategy](../testing/test-strategy.md), [observability](./analytics.md), [legacy refactor](./legacy-code.md), [capstone](../interview/senior-capstone.md).
