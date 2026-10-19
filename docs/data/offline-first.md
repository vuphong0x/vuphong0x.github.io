---
title: Offline-first & đồng bộ
---

# Offline-first: dữ liệu, outbox và retry

## Nguồn dữ liệu thống nhất

Với feed có cache, để UI đọc Flow/PagingSource từ Room. Repository fetch network, ghi local database; UI thấy dữ liệu mới qua cùng nguồn quan sát. Tách trạng thái đang refresh/lỗi refresh khỏi nội dung đã cache để không làm màn hình trống khi mất mạng.

Đây là lựa chọn theo yêu cầu offline; không có nghĩa mọi ứng dụng đều phải dùng Room. Xác định thời hạn cache, account sở hữu dữ liệu và cách xóa dữ liệu khi logout.

## Outbox và idempotency {#outbox}

Ví dụ chat: trong **một transaction local**, ghi message `PENDING` và một thao tác outbox có `clientMessageId`. UI hiển thị từ Room. Worker đọc outbox và gửi request với cùng ID ở mọi lần retry.

| Failure case | Cách xử lý đề xuất |
| --- | --- |
| Chưa gửi được do mất mạng | Giữ PENDING, retry theo policy |
| Server đã ghi nhưng response mất | Retry cùng ID; server dedup và trả cùng kết quả |
| Server từ chối nội dung không hợp lệ | Đánh dấu FAILED, cho user sửa/thử lại có chủ đích |
| App chết trước khi ghi SENT | Reconcile lại kết quả theo ID |
| Logout khi sync đang chạy | Kiểm tra account/ownership, hủy hoặc cô lập work theo account |

State như `PENDING`, `SENDING`, `SENT`, `FAILED` cần định nghĩa rõ. Đừng để `SENDING` bị kẹt mãi sau process death: có thể dùng lease/timeout và cơ chế reconcile phù hợp.

Đây là phác thảo thiết kế, cần backend hỗ trợ idempotency. Transaction Room không thể atomic cùng một remote HTTP commit. `enqueueUniqueWork()` cũng không bảo đảm thao tác trên server chỉ xảy ra một lần.

## Ví dụ transaction local và khoảng hở remote {#local-transaction}

Giả sử Room có `MessageEntity`, `OutboxEntity` và các DAO tương ứng. Đây là phác thảo transaction dùng type do app định nghĩa, không phải schema đầy đủ:

```kotlin
suspend fun queueMessage(chatId: String, text: String, clientId: String) {
    database.withTransaction {
        messageDao.insert(
            MessageEntity(
                clientId = clientId,
                chatId = chatId,
                text = text,
                status = "PENDING",
            )
        )
        outboxDao.insert(
            OutboxEntity(clientId = clientId, accountId = currentAccountId)
        )
    }
}
```

`clientId` có unique constraint phù hợp; cách xử lý duplicate insert phải theo contract. Ghi cùng transaction tránh “UI đã thấy message nhưng không có thao tác để sync” hoặc “outbox trỏ tới payload chưa tồn tại”. Current account phải được snapshot/kiểm tra theo session của thao tác, không thay đổi tùy tiện giữa lúc xử lý.

Sau transaction, enqueue worker đọc outbox theo account. Có một khoảng hở khác: process có thể chết **sau local commit nhưng trước enqueue**. Vì vậy, outbox là nguồn công việc thật; cần một cơ chế reconcile/scan lại các bản ghi pending ở các thời điểm thích hợp, thay vì chỉ tin vào lệnh enqueue một lần từ UI.

Khi gửi, giữ cùng ID ở server. Một HTTP request thành công và một Room transaction là hai commit riêng biệt. App có thể chết giữa hai bước, nên worker phải xử lý lại được pending record đã thành công ở remote.

## Xung đột và thứ tự thao tác {#conflicts}

Idempotency giải quyết việc gửi lặp cùng thao tác, không giải quyết hai thao tác **khác nhau** cùng sửa dữ liệu. Ví dụ hai thiết bị sửa cùng ghi chú: cần policy như version/ETag, merge theo field, server-authoritative hoặc yêu cầu user giải quyết, tùy nghiệp vụ.

Đừng mặc định timestamp của thiết bị là thứ tự đáng tin cậy. Đồng hồ có thể lệch; với update cần điều kiện, dùng version/precondition do backend xác nhận. Với nhiều thao tác phụ thuộc nhau, xác định thứ tự và trạng thái lỗi: không gửi bước B khi bước A bắt buộc còn pending hoặc đã bị từ chối.

Xóa local record cũng cần semantics: nếu delete chưa được server xác nhận, có thể cần tombstone thay vì xóa sạch dấu vết để lần refresh không làm dữ liệu “sống lại”. Retention/cleanup của tombstone là một phần của protocol, không chỉ là câu SQL xóa.

## Phân trang cache {#pagination}

Khi dùng Paging với network và Room, `RemoteMediator` nhận dữ liệu network; Room cung cấp PagingSource cho UI. Ghi items và remote keys trong cùng transaction để tránh cursor lệch dữ liệu. Khi refresh, thay keys/cache theo chính sách nhất quán; xác định end-of-pagination từ contract API.

Dùng identity ổn định và xử lý load state/retry cho refresh lẫn append. Với Compose, key theo item ID giúp giữ state đúng item khi list đổi vị trí.

## Migration không làm mất dữ liệu {#migrations}

Export schema, dùng `MigrationTestHelper` kiểm tra các đường nâng cấp được hỗ trợ và assert dữ liệu sau migration. Test schema mới trống không đủ để phát hiện mất dữ liệu cũ. Đặc biệt kiểm tra default value, nullable, index và constraint theo thay đổi thực tế.

`fallbackToDestructiveMigration()` có thể xóa dữ liệu khi thiếu migration. Chỉ dùng khi quyết định mất dữ liệu là chấp nhận được, không xem là giải pháp mặc định cho dữ liệu người dùng.

**Bài tập:** thiết kế upload ảnh offline. Viết bảng trạng thái và test hai lần retry cùng upload ID sau timeout; chỉ một ảnh được tạo ở server.

## Ma trận thử lỗi cho hệ thống đồng bộ {#verification}

| Điểm dừng có chủ đích | Lần chạy sau cần làm gì? |
| --- | --- |
| Trước local transaction commit | Không có bản ghi nửa chừng |
| Sau local commit, trước enqueue | Reconcile tìm lại pending record |
| Sau server commit, trước response | Retry/reconcile cùng ID, không tạo message mới |
| Sau response, trước local SENT | Cập nhật lại từ kết quả remote đã xác nhận |
| Trong refresh items + remote keys | Transaction không để keys lệch dữ liệu |
| Sau logout và trước retry | Không gửi record account cũ bằng account mới |

**Câu hỏi tự kiểm:** tại sao unique work không thay thế outbox? Vì lịch và payload có ownership khác nhau; work có thể chưa được enqueue, bị cancel hoặc hoàn tất trong khi dữ liệu vẫn cần reconcile. Nguồn dữ liệu bền vững giúp reconstruct công việc còn thiếu.

Đọc bài [background work](../android-core/background-work.md#enqueue) để nối phần persistence với scheduling, và [UI state/event](../architecture/ui-state-events.md#delivery) để render kết quả khi UI quay lại.

## Nguồn chính thức

- [Offline-first architecture](https://developer.android.com/topic/architecture/data-layer/offline-first)
- [Paging network + database](https://developer.android.com/topic/libraries/architecture/paging/v3-network-db)
- [Room migrations](https://developer.android.com/training/data-storage/room/migrating-db-versions)
- [MigrationTestHelper](https://developer.android.com/reference/androidx/room/testing/MigrationTestHelper)

[Quay lại lộ trình Senior](../interview/senior-android.md) · [Luyện quiz](/quiz)
