---
title: System design Android theo failure case
sidebar_position: 5
---

# System design Android: đi từ yêu cầu đến invariant

Một bài design Senior cần làm rõ yêu cầu và bảo vệ invariant khi mạng, process, session hoặc dữ liệu thay đổi. Bắt đầu bằng tên pattern/module mà chưa biết offline/ordering/retention dễ tạo một sơ đồ đẹp nhưng không giải được bài toán.

## 1. Quy trình thảo luận

1. Xác định user journey, offline/read/write, realtime, nhiều account/thiết bị và loại dữ liệu nhạy cảm.
2. Ghi invariant: một logical message có một ID; dữ liệu account A không sang B; UI có nguồn để dựng lại sau process death.
3. Vẽ owner và data flow, phân biệt cache, source of truth, transient state và persisted work.
4. Liệt kê failure point giữa các commit; xác định retry, dedup, reconcile, conflict và cancellation.
5. Chọn API/library phù hợp constraint hiện tại, sau đó chỉ ra tradeoff của phương án khác.
6. Kết thúc bằng test matrix, metric, rollout và open questions, không chỉ danh sách công nghệ.

## 2. Chat offline {#chat}

**Giả định:** text chat một account active, có lịch sử phân trang, offline queue và backend hỗ trợ logical client ID.

```text
UI → state holder → repository → local message + outbox transaction
                                     ↓
                                  scheduler
                                     ↓
                       HTTP send/reconcile theo protocol
                                     ↓
                              local confirmed state
UI ← Flow/PagingSource từ local database
```

Có thể dùng socket/SSE cho realtime khi app/session cho phép, hoặc polling theo yêu cầu đơn giản hơn. Chọn theo latency, battery, backend và reconnect complexity. Không giữ socket vô hạn trong Worker; worker phù hợp tác vụ hữu hạn đọc pending work và reconcile theo contract.

FCM là tín hiệu/notification theo delivery/background restrictions, không phải cam kết app được đánh thức để chạy tùy ý. Luôn có cơ chế tải lại dữ liệu missed sau reconnect; không dùng push như database hoặc kỳ vọng mọi message push đến đúng thứ tự.

Phân biệt server-assigned ordering, local pending ordering và dedup identity. Timestamp của thiết bị không tự tạo total order đáng tin cậy giữa nhiều client. Nếu hỗ trợ edit/delete, version/tombstone/conflict policy phải được định nghĩa.

Đọc: [outbox](../data/offline-first.md), [background work](../android-core/background-work.md), [capstone](./senior-capstone.md).

## 3. Feed ảnh có cache {#feed}

**Giả định:** cursor pagination, cache local, image loader có memory/disk cache và list dài.

Dùng RemoteMediator khi thiết kế Paging kết hợp network/database phù hợp; ghi items và remote keys atomic. UI quan sát một nguồn nhất quán cho nội dung, kèm state refresh/append/error. Xác định refresh thay cache hay merge, cursor hết hạn và dataset đổi thứ tự.

Ảnh cần decode theo kích thước hiển thị và quản lý cache có giới hạn. Không hứa mọi ảnh được decode “đúng bằng” View size hoặc memory cache luôn có implementation cụ thể cho mọi loader. Kiểm tra request size, cache keys, account-sensitive media và disk retention.

RecyclerView có ListAdapter/AsyncListDiffer cho diff; LazyColumn dùng item key/contentType và state đúng identity. Không áp yêu cầu “phải dùng DiffUtil” cho mọi Compose list. Prefetch phải được đo với network/memory budget, không tải trước toàn bộ dataset.

**Failure cases:** mất mạng lúc append, refresh đổi item IDs, remote keys lệch cache, file ảnh cache bị xóa, logout giữa response và user cuộn trong lúc chèn trang mới.

Đọc: [Paging](../data/paging.md), [Compose](../ui/jetpack-compose.md), [profiling](../performance/profiling.md).

## 4. Refactor một flow trong legacy app {#legacy}

**Giả định:** app vẫn release thường xuyên; chưa có đủ test cho toàn bộ codebase.

Chọn một seam có giá trị và có thể rollback; viết characterization test cho behavior phải giữ. Tách I/O sau interface, giữ navigation/data contract, thay một flow nhỏ thay vì rewrite mọi thứ cùng lúc. Không coi “module hóa trước” hoặc “mọi màn mới bắt buộc Compose” là quy luật cho mọi team.

Đo build, crash/performance và chi phí thay đổi trước/sau. Giữ backend/schema compatibility trong rollout; chỉ xóa code cũ khi routing/feature flag, state restoration và migration không còn cần nó. Test xanh ở JVM không đủ chứng minh navigation hoặc process restoration đúng.

Đọc: [modularization](../architecture/modularization.md), [legacy code](../real-world/legacy-code.md), [test strategy](../testing/test-strategy.md).

## 5. Security và vận hành xuyên suốt

Mỗi design cần trust boundary, credential/session lifetime, external input và log policy. Không liệt kê certificate pinning, encryption hoặc R8 như một bộ phép bảo đảm an toàn. Chọn theo [threat model](../security/security-model.md), ghi cả availability/rotation/rollback cost.

Tách metric sản phẩm và metric kỹ thuật: send success/latency theo logical operation, pending age, retry rate, crash/ANR, startup/frame timing. Không đưa nội dung message/token vào telemetry để debug thuận tiện.

**Bài tập:** trình bày một design trong 30 phút, dành riêng thời gian cho hai failure points và hai phương án thay thế. Reviewer phải biết dữ liệu quan trọng nằm ở đâu khi process chết ở bất kỳ bước nào.

Nguồn: [Offline-first guidance](https://developer.android.com/topic/architecture/data-layer/offline-first), [FCM delivery](https://firebase.google.com/docs/cloud-messaging/understand-delivery), [Architecture recommendations](https://developer.android.com/topic/architecture/recommendations).
