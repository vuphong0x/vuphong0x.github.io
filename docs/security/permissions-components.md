---
title: Permissions, deep links và component exposure
sidebar_position: 2
---

# Permissions và input từ bên ngoài ứng dụng

Một link mở được Activity không chứng minh người gọi được quyền thực hiện hành động trong Activity đó. Senior cần phân biệt **routing**, **permission** và **business authorization** ở từng ranh giới.

## 1. Runtime permission là quyết định của người dùng {#permissions}

Chỉ xin quyền khi user thực hiện chức năng cần nó; cân nhắc API hệ thống như photo picker để giảm quyền phải xin. Kiểm tra trạng thái hiện tại mỗi khi cần dùng resource, vì quyền có thể bị thu hồi hoặc có lifetime giới hạn tùy loại quyền/phiên bản.

```text
User chọn chức năng
  → Có quyền? Thực hiện nếu điều kiện khác cũng hợp lệ
  → Chưa có quyền? Hiển thị rationale khi phù hợp
  → Request qua Activity Result contract
  → Granted: thử thực hiện và vẫn xử lý lỗi resource
  → Denied: fallback, không request lặp vô hạn
```

`shouldShowRequestPermissionRationale()` trả false không đủ để khẳng định user đã từ chối vĩnh viễn: lần đầu xin quyền cũng có thể false. UX cần biết ngữ cảnh, không tự động đẩy user vào Settings hoặc hỏi lại mỗi lần recompose. Chỉ hướng dẫn Settings khi thích hợp và user chủ động muốn tiếp tục chức năng.

Nguồn: [Request runtime permissions](https://developer.android.com/training/permissions/requesting).

## 2. Exported component và dữ liệu Intent {#components}

Không export component nếu không có use case bên ngoài. Với component cần export, validate action, scheme/host/path, kiểu dữ liệu, kích thước input và điều kiện đăng nhập/authorization. Không tin extras chỉ vì chúng có tên do app định nghĩa.

Ví dụ deep link `/document/123`: parser lấy document ID hợp lệ, repository/backend kiểm tra account có quyền đọc 123, UI xử lý not-found/forbidden. Không nhận một extra `isAdmin=true` rồi mở quyền quản trị. Dùng explicit intent cho đích đã biết; nếu chia sẻ file, cấp quyền URI tối thiểu qua FileProvider thay vì lộ file path tùy tiện.

## 3. App Links không thay authorization {#app-links}

Verified App Links xác minh quan hệ giữa domain và ứng dụng để cải thiện routing. Custom scheme có thể bị nhiều app đăng ký. Dù dùng loại nào, nội dung link vẫn là external input: validate và kiểm tra quyền tại nơi lấy hoặc thay đổi dữ liệu.

Nếu link chứa URL để mở WebView, dùng allowlist host/scheme theo nhu cầu. Đừng chuyển thẳng query parameter vào `loadUrl` hoặc mở JavaScript bridge cho nội dung không tin cậy. Với OAuth/login, dùng flow và browser integration theo protocol thay vì tự phát minh callback token không có kiểm tra state phù hợp.

Nguồn: [Android App Links](https://developer.android.com/training/app-links), [security best practices](https://developer.android.com/privacy-and-security/security-best-practices).

## 4. Ma trận kiểm chứng

| Tình huống | Kết quả cần chứng minh |
| --- | --- |
| Camera bị từ chối | Chức năng không cần camera vẫn dùng được |
| Quyền bị thu hồi sau khi cấp | Không crash vì giả định “đã granted một lần” |
| Link ID sai định dạng/rất dài | Từ chối có kiểm soát |
| Link tới dữ liệu account khác | Authorization chặn, không chỉ giấu UI |
| Component không dành cho bên ngoài | Không export ngoài ý muốn trong release manifest |
| URL WebView ngoài allowlist | Không mở bridge/content với quyền của app |

**Bài tập:** thử mở cùng link khi logged-out, account A và account B; xoay màn hình lúc permission dialog đang mở; kiểm tra callback vẫn gắn đúng lifecycle và không lặp thao tác đặc quyền.

Đọc tiếp: [state recovery](../android-core/state-recovery.md), [security model](./security-model.md), [navigation](../ui/navigation.md).
