# Inline Function

Inline function được sinh ra để tối ưu hiệu suất khi sử dụng higher-order function nhận lambda làm tham số. Khi truyền Lambda vào một Higher-order function, dưới góc nhìn của Java Bytecode, Kotlin sẽ tự động tạo ra một object (FunctionX) để chứa đoạn code lambda đó. Nếu hàm này được gọi liên tục (vd: trong một vòng lặp), hàng ngàn object rác sẽ được tạo ra, gây áp lực cho Garbage Collector (GC), dẫn đến giảm hiệu năng (Jank/Lag).

### 1. `inline`&#x20;

**Bản chất**: Khi đặt `inline` trước function, trình biên dịch sẽ copy toàn bộ nội dung của hàm này vào nơi gọi hàm

**Ưu điểm**: Loại bỏ chi phí khởi tạo object (Zero overhead) và chi phí gọi hàm.

**Nhược điểm:**

- Tốn bộ nhớ Stack nếu hàm chứa nhiều biến cục bộ

- Tăng kích thước file class vì code dài ra

- Nếu dùng nhiều sẽ làm giảm tốc độ truy cập bộ nhớ đệm

**Dùng khi nào:**

- Dùng khi cần tối ưu hiệu suất

- Các hàm ngắn, được dùng nhiều lần

**Không nên dùng khi nào:**

- Khi code của hàm quá lớn, chứa nhiều logic phức tạp

- Hàm khởi tạo

- Hàm trừu tượng

```kotlin title="Kotlin" showLineNumbers
// Khai báo hàm inline
inline fun measureTime(block: () -> Unit) {
    val start = System.currentTimeMillis()
    block() // Mã của lambda sẽ được thế trực tiếp vào đây
    println("Time: ${System.currentTimeMillis() - start}")
}

// Khi sử dụng:
fun doWork() {
    measureTime {
        println("Working...") 
    }
}
```

```kotlin title="Sau khi Compile sẽ thành như này:" showLineNumbers
fun doWork() {
    val start = System.currentTimeMillis()
    println("Working...") // Không có object nào được tạo ra, code được copy trực tiếp!
    println("Time: ${System.currentTimeMillis() - start}")
}
```

### 2. `noninline`&#x20;

Bản chất: Khi một function là `iniline` các lambda parameter của nó cũng sẽ bị inline. Nếu không muốn điều này, chúng ta sử dụng`noninline` .

Khi nào sử dụng:

- Muốn gán lambda đó vào một biến

- Truyền lambda đó cho một hàm không phải inline

- Dùng như một object bình thường

```kotlin
inline fun executeTasks(task1: () -> Unit, noinline task2: () -> Unit) {
    task1() // Sẽ được inline (copy-paste)
    
    // task2 không bị inline, nó vẫn là 1 object Function0, 
    // nên ta có thể truyền nó vào hàm khác hoặc gán vào biến.
    saveTaskForLater(task2) 
}

fun saveTaskForLater(task: () -> Unit) { ... }
```

### 3. `crossinline`&#x20;

**Vấn đề (Non-local return):** Nếu gọi `return` bên trong một lambda được `inline`, nó sẽ không chỉ thoát khỏi lambda, mà nó sẽ **thoát luôn cả hàm bên ngoài** (hàm chứa hàm `inline`. Đây gọi là Non-local return.

Nếu bên trong hàm `inline`, chúng ta ném lambda đó cho một môi trường thực thi khác (Thread khác, một callback giao diện UI), việc cho phép `return` sẽ làm sập logic hệ thống, vì compiler không biết lúc nào lệnh `return` được gọi.

Bản chất: `crossinline` được dùng khi:

- lambda vẫn cần inline

- nhưng **không cho phép non-local return**

```
inline fun View.onSafeClick(crossinline action: (View) -> Unit) {
    setOnClickListener { v ->
        action(v)
    }
}
```

### 4. Interview Question

**Q: Nếu** `inline` **giúp tăng performance tốt như vậy, tại sao chúng ta không thêm từ khóa** `inline` **vào tất cả các hàm trong project?**

A: Vì hiện tượng **Code Bloat (Phình to mã nguồn)**. Nếu một hàm `inline` quá lớn hoặc chứa quá nhiều logic phức tạp, và nó được gọi ở 100 nơi khác nhau, compiler sẽ phải copy-paste cục code khổng lồ đó ra 100 bản sao. Điều này làm dung lượng file APK/AAB tăng lên chóng mặt và giảm hiệu suất bộ nhớ cache của CPU (Instruction Cache Miss). Chỉ nên dùng `inline` cho các hàm bậc cao (Higher-order functions) ngắn gọn.

**Q: Một hàm** `inline` **có thể truy cập các biến hoặc hàm** `private` **trong class của nó không?**

- **Trả lời:** **Không.** Vì đoạn code của hàm `inline` sẽ được copy sang *một class khác* (nơi nó được gọi). Nếu nó mang theo các tham chiếu `private`, nơi gọi mới sẽ không thể truy cập được và gây lỗi JVM.

- Tuy nhiên, ta có thể dùng từ khóa `internal` kết hợp với annotation `@PublishedApi` để lách luật, cho phép hàm inline gọi các logic nội bộ mà không cần public chúng ra ngoài API.

```
class AuthenticationManager {
    // Biến private, chỉ dùng nội bộ trong class này
    private val secretKey = "XYZ_123"

    // BÁO LỖI COMPILE NGAY DÒNG NÀY: 
    // "Public-API inline function cannot access non-public-API 'secretKey'"
    inline fun performSecureAction(action: (String) -> Unit) {
        println("Preparing action...")
        action(secretKey) 
    }
}
```

*Lý do:* Giả sử bạn gọi `performSecureAction` từ `MainActivity`. Trình biên dịch sẽ copy dòng `action(secretKey)` dán vào `MainActivity`. Nhưng `MainActivity` làm sao có quyền đọc biến `private secretKey` của `AuthenticationManager`? Do đó, Java Virtual Machine (JVM) sẽ báo lỗi Access Violation. Kotlin compiler ngăn chặn điều này từ trong trứng nước.

**Q: Hãy giải thích khái niệm Reified type parameter. Nó liên quan gì đến** `inline`**?**

**A:** Trong Java/Kotlin, có một giới hạn gọi là *Type Erasure* (Xóa kiểu dữ liệu ở runtime). Ví dụ hàm `fun <T> checkType(item: Any)` sẽ không biết `T` là gì lúc Runtime. Nhưng nếu ta đánh dấu hàm này là `inline` và thêm từ khóa `reified` vào `T` (như `inline fun <reified T> checkType()`), compiler sẽ thay thế chữ `T` bằng chính class thật (VD: `String::class.java`) tại nơi gọi hàm.

```
// Hàm Generic thông thường kiểm tra xem biến có thuộc kiểu T không
fun <T> checkType(item: Any) {
    // BÁO LỖI COMPILE: "Cannot check for instance of erased type: T"
    if (item is T) { 
        println("Đúng kiểu rồi!")
    }
    
    // BÁO LỖI COMPILE: "Cannot use 'T' as reified type parameter"
    val clazz = T::class.java 
}
```

Khi dùng `inline` `reified`:

```
// Bắt buộc phải có 'inline' đi kèm với 'reified'
inline fun <reified T> checkType(item: Any) {
    // Hoàn toàn hợp lệ! Không còn lỗi nữa.
    if (item is T) {
        println("Item is exactly of type ${T::class.java.simpleName}")
    } else {
        println("Item is NOT of type ${T::class.java.simpleName}")
    }
}

// Khi sử dụng:
fun testReified() {
    val myName: Any = "Android Developer"
    
    // Khi bạn gọi dòng này...
    checkType<String>(myName) 
}
```

Khi gọi `checkType<String>(myName)`, trình biên dịch Kotlin sẽ **không** gọi hàm. Thay vào đó, nó copy nội dung hàm `checkType`, và thay tất cả chữ `T` thành `String` trực tiếp vào code của bạn.
