---
title: Threat model, secrets và dữ liệu nhạy cảm
sidebar_position: 1
---

# Bảo mật Android: thiết kế từ ranh giới tin cậy

Một ứng dụng Senior cần giải thích **tài sản nào cần bảo vệ, ai có thể truy cập và điều gì xảy ra khi một lớp bảo vệ thất bại**. Thêm mã hóa hoặc obfuscation mà không có threat model có thể tạo cảm giác an toàn trong khi token vẫn bị ghi vào log hoặc endpoint vẫn chấp nhận truy cập trái phép.

## 1. Viết threat model trước khi chọn công cụ {#threat-model}

Ví dụ app lưu tài liệu theo account:

| Tài sản/ranh giới | Failure case | Biện pháp và giới hạn |
| --- | --- | --- |
| API authorization | User sửa document ID để đọc account khác | Backend kiểm tra ownership; UI ẩn nút không đủ |
| Phiên đăng nhập | Token lọt vào crash report | Không log token; redact và kiểm tra telemetry |
| Dữ liệu local | File/cache còn sau logout hoặc backup ngoài dự kiến | Chính sách retention, account isolation và backup rõ ràng |
| Kết nối mạng | Cleartext hoặc trust manager chấp nhận mọi certificate | TLS và trust policy đúng; không bỏ hostname verification |
| Link/Intent bên ngoài | Input mở chức năng đặc quyền | Validate input và kiểm tra authorization tại nơi thực hiện |
| Thiết bị bị xâm nhập | Runtime đọc dữ liệu khi app đang giải mã | Giảm lượng dữ liệu lưu, giới hạn session và xử lý rủi ro ở backend |

Không phải mọi app cần cùng mức kiểm soát. Hãy ghi giả định và ưu tiên rủi ro thực tế thay vì coi một checklist là chứng nhận an toàn.

Nguồn: [Android security best practices](https://developer.android.com/privacy-and-security/security-best-practices).

## 2. BuildConfig, NDK và R8 không tạo secret {#secrets}

`local.properties` giúp tránh commit credential vào repository. Nếu giá trị được đưa vào APK qua BuildConfig/resource/native library, nó vẫn được phân phối cho thiết bị người dùng và có thể bị trích xuất. R8 hoặc chia chuỗi trong NDK chỉ tăng công sức phân tích, không biến client thành nơi giữ server secret.

Phân biệt public client identifier/API key có giới hạn theo platform với credential có quyền truy cập dữ liệu hoặc ký giao dịch. Secret của backend phải nằm ở hệ thống được kiểm soát phía server; client dùng credential ngắn hạn và quyền tối thiểu phù hợp protocol. Không “sửa” lộ secret bằng cách chuyển cùng secret từ Kotlin sang C++.

Nguồn: [Hardcoded cryptographic secrets](https://developer.android.com/privacy-and-security/risks/hardcoded-cryptographic-secrets).

## 3. TLS là nền tảng; pinning có chi phí vận hành {#tls}

Dùng HTTPS với certificate và hostname verification hợp lệ. Có thể khai báo network security policy cho domain và tách debug trust khỏi release. Không triển khai trust manager chấp nhận mọi chứng chỉ để “sửa lỗi kết nối”.

Certificate pinning thu hẹp tập chứng chỉ/key được chấp nhận, đồng thời tạo nguy cơ mất kết nối khi certificate/key được thay mà client chưa cập nhật. Android không khuyến nghị dùng pinning như mặc định cho mọi ứng dụng. Nếu threat model yêu cầu, cần chiến lược backup pin, rotation, rollout, thiết bị chưa update và incident response.

Không kết luận “HTTPS chưa đủ nên mọi request phải tự AES-encrypt”. Mã hóa payload chỉ có ý nghĩa khi protocol định nghĩa rõ threat model, authenticated encryption, key distribution/rotation, nonce, replay protection và lỗi tương thích. Một interceptor AES tự viết không thay authorization, TLS hoặc key management.

Nguồn: [Network security configuration và pinning](https://developer.android.com/privacy-and-security/security-config).

## 4. Keystore giữ khóa, không phải kho chứa mọi token {#keystore}

Android Keystore quản lý cryptographic keys và có thể áp dụng ràng buộc sử dụng/hardware protection tùy thiết bị. Dữ liệu cần mã hóa được lưu ở storage phù hợp; key dùng để bảo vệ dữ liệu có lifetime, quyền sử dụng và tình huống invalidation riêng.

Thiết kế phải trả lời: restore backup sang thiết bị khác thì key còn dùng được không? User đổi bảo mật thiết bị có làm key mất hiệu lực không? Khi giải mã thất bại, app hướng dẫn đăng nhập lại hay làm mất bản nháp? Dữ liệu đã giải mã trong RAM vẫn cần được quản lý; Keystore không khiến mọi hành vi trong process trở nên đáng tin cậy.

DataStore/Room không mặc định biến toàn bộ dữ liệu thành dữ liệu mã hóa. Chọn cơ chế lưu theo loại dữ liệu và threat model; kiểm tra trạng thái API/thư viện tại thời điểm tích hợp, không mặc định một tên API “Encrypted…” là lựa chọn lâu dài cho mọi trường hợp.

Nguồn: [Android Keystore](https://developer.android.com/privacy-and-security/keystore).

## 5. Session, logout và telemetry {#session}

Logout là chuyển trạng thái của cả hệ thống: vô hiệu hóa/revoke theo protocol, dừng hoặc cô lập work theo account, xóa cache/credential theo chính sách, và tránh response cũ ghi vào session mới. Chỉ xóa một preference không xử lý request đã bay đi.

Log/crash report chỉ nên chứa dữ liệu đã được phân loại. Không ghi Authorization, refresh token, mật khẩu, nguyên body chứa PII hoặc URL có credential. Redact header chưa đủ nếu body/query/path vẫn mang dữ liệu đó. Theo dõi lỗi bằng mã lỗi, endpoint đã chuẩn hóa và correlation ID không tiết lộ nội dung người dùng.

## 6. Bài tập review bảo mật

Review tính năng tải tài liệu theo account. Viết ít nhất một test cho mỗi trường hợp: account A truy cập ID của B, đổi account trong lúc request đang chạy, token hết hạn, cleartext bị chặn và crash report không chứa token/body nhạy cảm. Kiểm tra release manifest/network config cùng hành vi runtime, không chỉ đọc code debug.

**Câu hỏi tự kiểm:** tại sao mã hóa token bằng key hardcode trong APK vẫn chưa bảo vệ được secret theo threat model trích xuất APK? Cả ciphertext và key đều được phân phối cùng client; cần thay cách quản lý key/credential theo threat model.

Đọc tiếp: [Networking và authentication](../data/retrofit.md), [permissions và external input](./permissions-components.md), [capstone Senior](../interview/senior-capstone.md).
