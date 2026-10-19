---
title: Capstone Senior — ứng dụng chat offline
sidebar_position: 4
---

# Capstone: chứng minh năng lực qua một tính năng hoàn chỉnh

Đây là đề thực hành dành cho người học, không phải một ứng dụng Android đã được triển khai trong repository website. Hãy xây một chat client nhỏ hoặc viết design/test plan đủ chi tiết để reviewer có thể đánh giá quyết định kỹ thuật của bạn.

## 1. Yêu cầu sản phẩm

- Xem lịch sử đã cache khi offline, tải thêm lịch sử theo trang khi có mạng.
- Gửi message có trạng thái pending/confirmed/failed và cho phép retry có chủ đích.
- Đóng màn hình, rotation hoặc mất process không làm mất message đã xác nhận lưu local.
- Retry sau timeout không tạo logical message trùng ở backend theo protocol đã thỏa thuận.
- Dữ liệu account A không bị hiển thị/gửi bằng session B sau logout/login.
- UI có trạng thái loading/error, semantics phù hợp và không giả định chỉ thiết bị nhanh.

Làm rõ yêu cầu còn mở: attachment, chỉnh sửa/xóa, nhiều thiết bị, ordering, retention và delivery receipt. Không tự hứa exactly-once end-to-end nếu protocol chỉ hỗ trợ retry/dedup.

## 2. Những artifact cần nộp cho reviewer {#deliverables}

| Artifact bài tập | Bằng chứng cần có |
| --- | --- |
| Design/decision record | Hai phương án, lý do chọn, giả định và tradeoff |
| Dependency/data-flow diagram | Owner của UI state, producer, storage và sync |
| Schema + migration plan | Message/outbox/remote keys, account boundary, unique ID |
| State machine | Các transition của send/retry/cancel/reconcile |
| Test matrix + kết quả khi thực hành | Failure injection và expected behavior |
| Performance report | Journey, thiết bị/build/compilation mode, trace trước/sau |
| Security review | Asset, trust boundary, credential/log/URI exposure |
| Release/rollback plan | Backend compatibility, rollout signal và stop condition |

Các mục này là đầu ra người học cần tạo; website cung cấp hướng dẫn, không thay bạn chứng minh một app cụ thể đã đạt tất cả yêu cầu.

## 3. Chia thành các mốc có thể kiểm chứng

### Mốc A — state và lifetime

Render list/input theo UDF, collect theo lifecycle, lưu query/chat ID nhỏ đúng owner. Test rotation và loss of process riêng. Đọc [state recovery](../android-core/state-recovery.md), [state/event](../architecture/ui-state-events.md).

### Mốc B — dữ liệu và đồng bộ

Ghi message + outbox atomic trong local transaction. Enqueue từ dữ liệu persist, scan/reconcile pending record khi cần. Retry cùng logical ID; Room không atomic cùng remote HTTP commit. Đọc [offline-first](../data/offline-first.md), [background work](../android-core/background-work.md).

### Mốc C — failure và session

Inject lỗi trước/sau remote commit, cancellation, auth refresh đồng thời và logout giữa request. Không nuốt cancellation, không ghi session cũ vào account mới. Đọc [structured concurrency](../foundation/kotlin/structured-concurrency.md), [networking](../data/retrofit.md), [security](../security/security-model.md).

### Mốc D — hiệu năng và khả năng sử dụng

Đo cold startup và cuộn lịch sử có ảnh; tìm bottleneck bằng trace. Kiểm tra font scale, TalkBack, loading/error/retry. Không dùng recomposition count như metric duy nhất. Đọc [startup](../performance/startup.md), [profiling](../performance/profiling.md), [UI testing](../testing/ui-testing.md).

## 4. Failure injection matrix {#failure-matrix}

| Điểm thử lỗi | Invariant cần giữ |
| --- | --- |
| Process chết sau local commit, trước enqueue | Pending message được tìm lại để sync |
| Server commit nhưng response mất | Retry cùng ID, không tạo logical message mới |
| App chết trước local confirmed | Reconcile từ kết quả remote |
| UI stopped khi kết quả về | Không truy cập View cũ; dữ liệu quan trọng vẫn có nguồn đọc |
| Một request phụ lỗi | Partial success đúng contract, cancellation vẫn lan |
| Logout giữa refresh | Credential/session cũ không ghi đè phiên mới |
| Migration từ schema cũ | Không mất payload/outbox ngoài policy |
| Chèn trang đầu khi user đang cuộn | Identity/selection của item không đổi theo index |
| Cache/file bị xóa | Lỗi có kiểm soát, không retry vô hạn |

## 5. Rubric tự đánh giá {#rubric}

Mỗi chiều dùng mô tả định tính; không cộng điểm để tự chứng nhận chức danh Senior.

| Chiều đánh giá | Mới nắm khái niệm | Có thể áp dụng | Có bằng chứng vững |
| --- | --- | --- | --- |
| Cơ chế Android | Kể tên callback/API | Giải thích lifetime | Chứng minh restoration/cleanup bằng kịch bản |
| Concurrency | Dùng launch/Flow | Chọn scope/failure policy | Test cancellation, ordering và partial failure |
| Architecture/data | Vẽ lớp/module | Giải thích contract | Xử lý duplicate, conflict và migration |
| Performance | Liệt kê tools | Đo một journey | Trace và so sánh điều kiện tương đương |
| Security | Liệt kê encryption | Nêu trust boundary | Kiểm chứng credential/session/external input |
| Testing/delivery | Happy path chạy | Có failure test | Rollout/observability/rollback theo rủi ro |

Một reviewer tốt sẽ hỏi “nếu giả định này sai thì sao?” và “bằng chứng nào hỗ trợ lựa chọn?”. Viết câu trả lời bằng dữ liệu/test/trace của bài thực hành, không chỉ bằng tên pattern.

[Tra cứu bài đọc](./reading-guide.md) · [System design](./system-design.md) · [Quiz](/quiz).
