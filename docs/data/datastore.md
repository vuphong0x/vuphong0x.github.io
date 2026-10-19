---
title: DataStore, schema và lỗi lưu trữ
---

# DataStore: cấu hình nhỏ, cập nhật atomic và error policy

DataStore phù hợp dữ liệu cấu hình nhỏ dưới dạng Preferences hoặc typed data qua Serializer. Typed DataStore không chỉ giới hạn ở Protocol Buffers: định dạng phụ thuộc Serializer, ví dụ Proto hoặc JSON theo setup được hỗ trợ. Với query quan hệ, partial update phức tạp hoặc dataset lớn, cân nhắc Room.

## 1. Chọn theo dữ liệu, không theo tên thư viện

| Nhu cầu | Lựa chọn khởi đầu |
| --- | --- |
| Dark mode, tùy chọn nhỏ | Preferences DataStore |
| Object cấu hình có schema/serialization rõ | Typed DataStore |
| Cart, message, outbox, join/query/index | Room hoặc storage phù hợp |
| UI state nhỏ phục hồi task | SavedStateHandle/rememberSaveable |
| Credential nhạy cảm | Threat model và key/storage policy riêng |

DataStore không mặc định mã hóa mọi dữ liệu. Type safety không thay authorization hoặc chính sách lưu token. Đọc [security model](../security/security-model.md#keystore).

## 2. Một instance cho một file trong phạm vi phù hợp

```kotlin
val Context.settingsStore by preferencesDataStore(name = "settings")

class SettingsRepository(private val store: DataStore<Preferences>) {
    private val darkMode = booleanPreferencesKey("dark_mode")

    val useDarkMode: Flow<Boolean> = store.data.map { prefs ->
        prefs[darkMode] ?: false
    }

    suspend fun setDarkMode(enabled: Boolean) {
        store.edit { prefs -> prefs[darkMode] = enabled }
    }
}
```

Ví dụ dùng `androidx.datastore.preferences` và Flow. Delegate đặt ở top level; tạo repository/store theo ownership phù hợp. Không tạo nhiều instance active cho cùng file. Nếu app có nhiều process, dùng cấu hình multi-process được hỗ trợ thay vì trộn các kiểu DataStore trên cùng file.

## 3. Atomic update không phải multi-store transaction

`edit`/`updateData` cung cấp cập nhật transaction theo contract của DataStore. Đọc một giá trị ngoài update rồi ghi lại có thể gây lost update nếu caller tự tính từ snapshot cũ. Với increment/cập nhật phụ thuộc state hiện tại, tính trên state trong transaction.

Một DataStore update không atomic cùng HTTP request, Room transaction hoặc file khác. Nếu nghiệp vụ cần outbox và payload commit cùng nhau, thiết kế trong một storage transaction phù hợp thay vì hy vọng hai lệnh save liên tiếp là atomic.

## 4. Đọc/ghi lỗi và corruption

Không phải mọi lỗi đọc đều nên biến thành `emptyPreferences()`: fallback im lặng có thể khiến app tưởng user chưa consent, mất lựa chọn quan trọng hoặc dùng cấu hình mặc định sai. Quyết định dữ liệu nào được phép fallback, lỗi nào cần hiển thị/telemetry và corruption handler có được phép thay file hay không.

Migration cần tính idempotent và được test từ dữ liệu cũ. Với typed data, schema evolution/default field và serializer compatibility phải được thiết kế; “object typed” không có nghĩa tương thích mọi lần update.

## 5. Main safety và lifetime

API suspend/Flow cho phép dùng từ coroutine main theo contract mà không tự blocking chờ disk. Không dùng `runBlocking { data.first() }` trên main thread để lấy cấu hình. Với API callback đồng bộ, thiết kế cache/initialization boundary riêng, tránh deadlock hoặc block trong interceptor.

SharedPreferences `apply()` cập nhật memory rồi lên lịch ghi disk; pending writes có thể ảnh hưởng lifecycle transitions. Không mô tả nó như cùng một synchronous disk write trong mọi tình huống. Đánh giá migration sang DataStore theo nhu cầu và failure behavior.

Nguồn: [DataStore guide](https://developer.android.com/topic/libraries/architecture/datastore).

**Bài tập:** migrate theme preference, giữ giá trị user cũ, inject một lỗi đọc và quyết định có fallback không. Sau đó giải thích vì sao cart/outbox vẫn nên nằm trong Room ở thiết kế chat offline.

Đọc tiếp: [Room](./room.md), [offline-first](./offline-first.md), [state recovery](../android-core/state-recovery.md).
