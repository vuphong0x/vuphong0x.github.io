---
title: Context, ownership và memory leak
sidebar_position: 7
---

# Context, ownership và memory leak

Bài này giải thích hai câu hỏi: **khi nào dùng Activity/Application Context** và **vì sao Activity đã đóng vẫn nằm trong heap**. Mục tiêu là xác định ai sở hữu đối tượng, đối tượng cần sống bao lâu và reference nào phải được gỡ.

Kiến thức trước khi đọc: [Activity/Fragment lifecycle](./lifecycle.md). Liên hệ: [nhóm Context và bộ nhớ](../interview/android-questions.md#context-memory).

## 1. Context là khả năng truy cập môi trường

Context không chỉ là một biến để truyền vào constructor. Từ nó, code có thể lấy resource, truy cập system service hoặc yêu cầu mở component. Context của Activity còn gắn với cấu hình/theme và cửa sổ của màn hình. Application Context tồn tại theo process, không mang cùng quyền sở hữu UI.

Hãy hỏi **“thao tác này cần môi trường nào?”** trước khi hỏi “context nào không leak?”. Dialog thuộc màn hình cần Activity thích hợp; database singleton không nên giữ Activity. Inflater dùng context khác theme có thể tạo View sai giao diện dù không phát sinh leak.

| Nhu cầu | Context/owner khởi đầu | Lý do |
| --- | --- | --- |
| Database dùng chung trong process | Application Context | Database không thuộc một màn hình |
| Dialog, View có theme của màn hình | Activity/themed Context phù hợp | Cần cấu hình UI và window owner đúng |
| Hàm format số hoặc xử lý domain | Thường không cần Context | Truyền dữ liệu/abstraction cần thiết thay vì toàn bộ môi trường Android |
| Callback cập nhật binding | View lifecycle owner | View có thể bị hủy trước Fragment instance |

Application Context không bảo đảm một class không leak: class vẫn có thể giữ callback capture Activity. Context cũng không thay thế permission, không chứng minh component còn active, và không tự chuyển thread.

Nguồn API: [Context](https://developer.android.com/reference/android/content/Context).

## 2. Vì sao GC không thu hồi Activity đã đóng? {#ownership}

Giả sử ứng dụng có một nguồn trạng thái dùng chung:

```text
Process root
  → application-scoped StatusSource
    → tập listener
      → lambda cập nhật giao diện
        → Fragment / binding / View
          → Activity cũ
```

GC xét khả năng đi tới đối tượng qua reference mạnh. Việc Activity đã gọi `onDestroy()` không tự xóa mọi đường reference từ các object khác. Vì vậy, “đặt `binding = null`” chỉ có ích nếu đó là đường giữ cần loại bỏ; một listener capture View riêng vẫn có thể giữ cây View cũ.

Một quy tắc thiết kế thực dụng: **khi A sống lâu hơn B và giữ B, phải có lý do rõ ràng cùng thời điểm giải phóng reference**. Không có lý do thì thay contract, ví dụ expose Flow thay vì nhận một UI callback được giữ vô hạn.

## 3. Ví dụ listener: đăng ký và cleanup cùng owner {#listener-cleanup}

Đoạn sau là mẫu tích hợp cho một callback API do ứng dụng sở hữu. `StatusSource.addListener/removeListener` được giả định là thread-safe; nếu API thực tế yêu cầu main thread, việc đăng ký/gỡ phải tuân thủ yêu cầu đó.

```kotlin
interface StatusSource {
    fun addListener(listener: (String) -> Unit)
    fun removeListener(listener: (String) -> Unit)
}

fun StatusSource.statuses(): Flow<String> = callbackFlow {
    val listener: (String) -> Unit = { status ->
        trySend(status)
    }
    addListener(listener)
    awaitClose { removeListener(listener) }
}
```

Trong `Fragment.onViewCreated()`:

```kotlin
viewLifecycleOwner.lifecycleScope.launch {
    viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
        statusSource.statuses().collect { status ->
            binding.statusLabel.text = status
        }
    }
}
```

Điểm đáng chú ý không phải chỉ là dùng coroutine. Khi block collect bị cancel, `awaitClose` gỡ **đúng listener đã đăng ký**. Khi View được tạo lại, một collection mới đăng ký listener mới. Không đặt flow wrapper này vào một `GlobalScope` rồi tiếp tục capture binding.

`callbackFlow` có buffer hữu hạn; ví dụ bỏ qua kết quả `trySend` để minh họa ownership. Nếu từng callback đều quan trọng, phải thiết kế overflow/error policy hoặc queue bền vững. Với trạng thái có thể thay thế bằng giá trị mới nhất, xem [Flow và backpressure](../foundation/kotlin/flow-lifecycle.md#backpressure).

Nguồn: [callbackFlow và awaitClose](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/callback-flow.html).

## 4. Quy trình điều tra bằng chứng {#diagnose}

Ví dụ thực hành: mở màn hình có listener, quay lại, rồi lặp 20 lần. Đây là kịch bản thử, không phải số liệu benchmark.

1. **Xác định đối tượng đáng lẽ phải mất.** Activity cũ sau rotation hoặc View cũ sau `onDestroyView`, không phải mọi object trong cache.
2. **Giữ điều kiện tái hiện ổn định.** Cùng màn hình, cùng dữ liệu và cùng thao tác; đợi animation/tác vụ tạm thời kết thúc.
3. **Xem retained instance và đường giữ.** LeakCanary hoặc heap dump giúp tìm đường reference tới đối tượng đó. Một object còn trong heap ngay sau khi đóng màn hình chưa đủ chứng minh leak.
4. **Tìm cạnh reference cần sửa.** Ai đăng ký callback? Ai sở hữu registry? Khi nào registry bỏ callback? Đừng sửa ngẫu nhiên class cuối đường giữ.
5. **Lặp lại sau khi sửa.** Kiểm tra listener count, Activity/View cũ còn bị retain không và UI vẫn cập nhật đúng khi mở lại.

Đọc trace theo nghĩa ownership, không chỉ theo tên thư viện. Nếu một singleton hợp lệ giữ callback do app đăng ký, vấn đề có thể nằm ở việc app chưa unregister, dù trace đi qua code thư viện.

Nguồn hướng dẫn: [Fixing a memory leak — LeakCanary](https://square.github.io/leakcanary/fundamentals-fixing-a-memory-leak/).

## 5. Leak, cache và allocation churn khác nhau

| Quan sát | Giả thuyết cần kiểm tra | Bước tiếp theo |
| --- | --- | --- |
| Activity cũ tăng theo mỗi lần navigation | Reference sống quá vòng đời | Heap dump, listener ownership |
| Heap tăng rồi ổn định quanh một mức | Cache có giới hạn hoặc dữ liệu đang dùng | Xem eviction, kích thước và nhu cầu thực tế |
| Nhiều object ngắn hạn, GC thường xuyên | Allocation churn | Allocation recording, kiểm tra draw/bind loop |
| OOM lúc tải ảnh lớn, không có Activity bị giữ | Decode/buffer quá lớn | Đo kích thước ảnh sau decode, downsample theo hiển thị |

`largeHeap`, ép GC hay đổi mọi reference sang `WeakReference` không thay thế chẩn đoán. Weak reference có thể làm callback biến mất lúc vẫn cần; cache yếu cũng không tự có chính sách dung lượng phù hợp.

## 6. Bài tập và câu hỏi kiểm tra

**Bài tập:** viết fake `StatusSource` lưu tập listener. Tạo/hủy collector hai lần; chứng minh mỗi lần active có đúng listener cần thiết và sau cancel không còn listener. Sau đó thử trên Fragment qua rotation/back stack để kiểm tra UI ownership.

**Tự giải thích:** vì sao thay `Activity Context` bằng `applicationContext` trong singleton vẫn chưa sửa leak nếu singleton còn giữ `onChanged = { binding... }`?

**Gợi ý:** context là một đường reference; closure capture binding là đường khác. Cần cắt reference đang giữ View, không chỉ đổi tham số constructor.

Đọc tiếp: [state recovery](./state-recovery.md), [memory management](../performance/memory.md), [Flow theo lifecycle](../foundation/kotlin/flow-lifecycle.md). [Quay lại bộ câu hỏi](../interview/android-questions.md) · [Quiz](/quiz).
