# Kotlin Basics

## 1. `val` vs `var` vs `const val`

### `val` — Read-only (Runtime Constant)
- Giá trị được **gán một lần** và không thể thay đổi sau khi khởi tạo.
- Giá trị có thể được tính toán **tại runtime**.

```kotlin
val currentTime = System.currentTimeMillis() // Hợp lệ — giá trị tính tại runtime
```

### `var` — Mutable Variable
- Giá trị có thể **thay đổi** sau khi khởi tạo.

```kotlin
var counter = 0
counter = 1 // Hợp lệ
```

### `const val` — Compile-time Constant
- Giá trị phải được biết **ngay tại thời điểm biên dịch**.
- Chỉ áp dụng cho kiểu **primitive** (`Int`, `Long`, `Float`, `Double`, `Boolean`, `Char`) và `String`.
- Phải được khai báo ở **top-level**, trong `object`, hoặc trong `companion object`.

```kotlin
const val MAX_RETRY = 3           // OK — biết lúc compile
const val API_URL = "https://..."  // OK — String literal

// const val time = System.currentTimeMillis() // LỖI — không biết lúc compile
```

**Under the hood (Java Bytecode):** `const val` được compiler thay thế trực tiếp bằng giá trị tại mọi nơi sử dụng (inlined), không tạo ra field hay getter nào. Trong khi `val` vẫn tạo một private field kèm getter.

```java
// const val MAX_RETRY = 3
// Tại mọi nơi gọi MAX_RETRY, compiler thay bằng:
int retry = 3; // Không có lời gọi getter nào

// val apiUrl = "https://..."
// Compiler sinh ra:
private final String apiUrl = "https://...";
public final String getApiUrl() { return this.apiUrl; }
```

---

## 2. Null Safety

Kotlin thiết kế hệ thống kiểu dữ liệu (Type System) để **loại bỏ NullPointerException** ngay từ thời điểm biên dịch.

### Nullable Type (`?`)
```kotlin
var name: String = "Kotlin"
// name = null  // LỖI COMPILE — String không chấp nhận null

var nullableName: String? = "Kotlin"
nullableName = null // Hợp lệ — String? chấp nhận null
```

### Safe Call (`?.`)
Nếu object là `null`, biểu thức trả về `null` thay vì ném Exception.
```kotlin
val length: Int? = nullableName?.length // null nếu nullableName là null
```

### Elvis Operator (`?:`)
Cung cấp giá trị mặc định khi biểu thức bên trái là `null`.
```kotlin
val length: Int = nullableName?.length ?: 0
```

### Not-null Assertion (`!!`)
Ép compiler coi giá trị là non-null. **Nếu giá trị là null → crash ngay lập tức** với `NullPointerException`.
```kotlin
val length: Int = nullableName!!.length // Nguy hiểm — tránh dùng nếu có thể
```

> **Quy tắc thực tế:** Hạn chế dùng `!!` tối đa. Nếu thấy `!!` trong code review, đó thường là một code smell. Thay bằng `?.let {}`, `?: return`, hoặc thiết kế lại data flow.

---

## 3. Scope Functions

Scope functions là nhóm hàm cho phép **thực thi một block code trong context của một object**. Chúng khác nhau ở hai tiêu chí: **cách truy cập context object** (`this` hay `it`) và **giá trị trả về** (context object hay lambda result).

### Bảng so sánh

| Function | Context Object | Return Value | Use Case |
|----------|---------------|--------------|----------|
| `let`    | `it`          | Lambda result | Null check, transformation |
| `run`    | `this`        | Lambda result | Object configuration + compute result |
| `with`   | `this`        | Lambda result | Gọi nhiều method trên cùng object |
| `apply`  | `this`        | Context object | Object configuration |
| `also`   | `it`          | Context object | Side effects (logging, validation) |

### `let` — Null check & Transformation
```kotlin
// Null-safe call
val user: User? = findUser(id)
user?.let { u ->
    println("Found: ${u.name}")
    sendEmail(u.email)
}

// Transformation
val result = "Hello".let {
    it.uppercase() // Trả về "HELLO"
}
```

### `apply` — Object Configuration
```kotlin
val textView = TextView(context).apply {
    text = "Hello"              // this.text = "Hello"
    textSize = 16f
    setTextColor(Color.BLACK)
}
// apply trả về chính object → textView là TextView đã được config
```

### `also` — Side Effects
```kotlin
val numbers = mutableListOf(1, 2, 3).also {
    println("List trước khi thêm: $it")  // Logging
}.also {
    it.add(4)
}
```

### `run` — Compute trên Object
```kotlin
val service = DatabaseService()
val result = service.run {
    connect()            // this.connect()
    query("SELECT *")   // this.query(...)
}
// result = kết quả của query()
```

### `with` — Gọi nhiều method không cần lặp tên
```kotlin
val user = User("Phong", 25)
with(user) {
    println(name)   // this.name
    println(age)    // this.age
}
```

**Under the hood:** Scope functions thực chất là các **inline higher-order functions**. Nhờ `inline`, compiler sẽ copy-paste code lambda trực tiếp vào nơi gọi, **không tạo object Function nào** → zero overhead.

---

## 4. `object` Keyword

Từ khóa `object` trong Kotlin có 3 cách sử dụng:

### Object Declaration (Singleton)
Tạo một **singleton** — chỉ có duy nhất một instance trong toàn bộ ứng dụng.
```kotlin
object AppConfig {
    var isDarkMode: Boolean = false
    fun reset() { isDarkMode = false }
}

// Sử dụng
AppConfig.isDarkMode = true
```

**Under the hood:** Compiler tạo ra một class với một static field `INSTANCE` được khởi tạo trong `static { }` block (thread-safe nhờ class loading mechanism của JVM).

```java
public final class AppConfig {
    public static final AppConfig INSTANCE;
    private static boolean isDarkMode;

    static {
        INSTANCE = new AppConfig();
    }
}
```

### Companion Object
Tương đương `static` members trong Java. Mỗi class chỉ có **một** companion object.
```kotlin
class User(val name: String) {
    companion object {
        const val TAG = "User"
        fun create(name: String): User = User(name)
    }
}

// Sử dụng
val user = User.create("Phong")
println(User.TAG)
```

### Anonymous Object (Object Expression)
Tạo một **object không tên**, thường dùng để implement interface nhanh.
```kotlin
val listener = object : View.OnClickListener {
    override fun onClick(v: View?) {
        println("Clicked!")
    }
}
```

---

## 5. `object` vs `data object`

### `object` thông thường
```kotlin
object Loading

println(Loading)           // com.example.Loading@1a2b3c4d
println(Loading == Loading) // true (cùng reference)
println(Loading.toString()) // com.example.Loading@1a2b3c4d
```

### `data object` (Kotlin 1.9+)
Compiler tự động sinh `toString()`, `equals()`, và `hashCode()` giống như `data class` nhưng cho singleton.

```kotlin
data object Loading

println(Loading)           // Loading  (đẹp hơn!)
println(Loading == Loading) // true
println(Loading.toString()) // Loading
```

**Khi nào dùng:** `data object` rất phù hợp khi dùng làm một nhánh của `sealed class`/`sealed interface` mà không cần mang dữ liệu:
```kotlin
sealed interface UiState {
    data object Loading : UiState
    data object Empty : UiState
    data class Success(val data: List<Item>) : UiState
    data class Error(val message: String) : UiState
}
```

---

## 6. Type Casting

### Smart Cast
Kotlin compiler tự động cast kiểu sau khi kiểm tra `is`:
```kotlin
fun process(any: Any) {
    if (any is String) {
        // Compiler tự hiểu 'any' là String ở đây
        println(any.length) // Không cần cast thủ công
    }
}
```

### Unsafe Cast (`as`)
Ép kiểu trực tiếp. **Ném `ClassCastException` nếu sai kiểu.**
```kotlin
val str: String = any as String // Crash nếu any không phải String
```

### Safe Cast (`as?`)
Trả về `null` nếu cast thất bại, **không ném Exception**.
```kotlin
val str: String? = any as? String // null nếu any không phải String
```

---

## 7. Equality — `==` vs `===`

| Operator | Tên gọi | Ý nghĩa | Java tương đương |
|----------|---------|---------|-----------------|
| `==`     | Structural Equality | So sánh **nội dung** (gọi `equals()`) | `.equals()` |
| `===`    | Referential Equality | So sánh **địa chỉ bộ nhớ** (cùng object?) | `==` |

```kotlin
val a = "Hello"
val b = "Hello"
val c = String("Hello".toCharArray())

println(a == b)   // true  — cùng nội dung
println(a === b)  // true  — cùng reference (String pool)
println(a == c)   // true  — cùng nội dung
println(a === c)  // false — khác reference (new object)
```

---

## 8. Higher-Order Functions & Lambdas

### Higher-Order Function
Là hàm nhận **hàm khác làm tham số** hoặc **trả về một hàm**.

```kotlin
fun operate(a: Int, b: Int, operation: (Int, Int) -> Int): Int {
    return operation(a, b)
}

// Sử dụng
val sum = operate(3, 4) { x, y -> x + y }     // 7
val product = operate(3, 4) { x, y -> x * y } // 12
```

### Lambda Expression
Là một **hàm ẩn danh** (anonymous function) — một block code có thể được truyền như một giá trị.

```kotlin
val greet: (String) -> String = { name -> "Hello, $name!" }
println(greet("Kotlin")) // Hello, Kotlin!
```

### Trailing Lambda
Nếu tham số cuối cùng là lambda, có thể đặt nó **bên ngoài dấu ngoặc tròn**:
```kotlin
listOf(1, 2, 3).filter { it > 1 } // Thay vì .filter({ it > 1 })
```

**Under the hood:** Mỗi lambda không inline sẽ tạo ra một **anonymous class** implement `FunctionN` interface. Đây là lý do tại sao `inline` function quan trọng — nó loại bỏ chi phí tạo object này.

```java
// val greet: (String) -> String = { name -> "Hello, $name!" }
// Compiler sinh ra:
Function1 greet = new Function1() {
    public String invoke(String name) {
        return "Hello, " + name + "!";
    }
};
```

---

## 9. Collections — List, Set, Map

### Immutable vs Mutable

| Immutable (Read-only) | Mutable |
|----------------------|---------|
| `listOf()` | `mutableListOf()` |
| `setOf()` | `mutableSetOf()` |
| `mapOf()` | `mutableMapOf()` |

```kotlin
val readOnly = listOf(1, 2, 3)
// readOnly.add(4) // LỖI COMPILE — không có method add()

val mutable = mutableListOf(1, 2, 3)
mutable.add(4) // OK
```

### Các hàm biến đổi phổ biến

```kotlin
val numbers = listOf(1, 2, 3, 4, 5)

// filter — lọc phần tử
numbers.filter { it > 3 }          // [4, 5]

// map — biến đổi từng phần tử
numbers.map { it * 2 }             // [2, 4, 6, 8, 10]

// flatMap — biến đổi + làm phẳng
val nested = listOf(listOf(1, 2), listOf(3, 4))
nested.flatMap { it }              // [1, 2, 3, 4]

// groupBy — nhóm theo điều kiện
numbers.groupBy { if (it % 2 == 0) "even" else "odd" }
// {odd=[1, 3, 5], even=[2, 4]}

// associate — tạo Map từ List
numbers.associateWith { it * it }  // {1=1, 2=4, 3=9, 4=16, 5=25}

// fold / reduce — gộp thành một giá trị
numbers.reduce { acc, n -> acc + n }     // 15
numbers.fold(10) { acc, n -> acc + n }   // 25 (bắt đầu từ 10)
```

### Sequence vs Collection

| Collection | Sequence |
|-----------|----------|
| Xử lý **eager** — mỗi operation tạo list trung gian | Xử lý **lazy** — chỉ tính khi cần |
| Tốt cho collections nhỏ | Tốt cho collections lớn hoặc chain dài |

```kotlin
// Collection — tạo 2 list trung gian
listOf(1, 2, 3, 4, 5)
    .filter { it > 2 }   // Tạo list [3, 4, 5]
    .map { it * 2 }       // Tạo list [6, 8, 10]

// Sequence — không tạo list trung gian
listOf(1, 2, 3, 4, 5)
    .asSequence()
    .filter { it > 2 }
    .map { it * 2 }
    .toList()             // Chỉ tạo list cuối cùng
```

---

## 10. Delegation — `by`

### Interface Delegation (Class Delegation)
Cho phép một class **ủy quyền** việc implement interface cho một object khác, thay vì tự viết.

```kotlin
interface Printer {
    fun print(message: String)
}

class ConsolePrinter : Printer {
    override fun print(message: String) = println(message)
}

// Ủy quyền cho consolePrinter thực hiện tất cả method của Printer
class DocumentPrinter(consolePrinter: Printer) : Printer by consolePrinter

val printer = DocumentPrinter(ConsolePrinter())
printer.print("Hello") // Gọi ConsolePrinter.print()
```

**Under the hood:** Compiler sinh ra các method chuyển tiếp (forwarding methods) gọi đến object delegate.

### Property Delegation (`by lazy`, `by observable`, custom delegate)
```kotlin
// Lazy delegation
val heavyObject: HeavyObject by lazy { HeavyObject() }

// Observable delegation
var name: String by Delegates.observable("Initial") { _, old, new ->
    println("$old -> $new")
}

// Map delegation — hữu ích khi parse JSON/Bundle
class User(map: Map<String, Any?>) {
    val name: String by map
    val age: Int by map
}
val user = User(mapOf("name" to "Phong", "age" to 25))
println(user.name) // Phong
```

---

## Interview Questions

**Q: `val` khác `const val` như thế nào?**

`val` là runtime constant — giá trị được gán tại runtime và không thể thay đổi sau đó. `const val` là compile-time constant — giá trị phải được biết ngay lúc biên dịch, chỉ áp dụng cho primitive và String, và compiler sẽ inline giá trị trực tiếp vào bytecode.

**Q: Giải thích sự khác nhau giữa `let` và `apply`.**

`let` truy cập object qua `it` và trả về kết quả của lambda — phù hợp cho null check và transformation. `apply` truy cập object qua `this` và trả về chính object đó — phù hợp cho object configuration.

**Q: `object` và `data object` khác gì nhau?**

`object` là singleton thông thường, `toString()` trả về dạng `ClassName@hashcode`. `data object` (Kotlin 1.9+) tự động sinh `toString()` trả về tên class đẹp, kèm theo `equals()` và `hashCode()` chuẩn. `data object` thường dùng làm nhánh không mang data trong `sealed class`.

**Q: Khi nào nên dùng `Sequence` thay vì `Collection`?**

Khi chain nhiều operations (filter, map, flatMap...) trên collection lớn. `Collection` xử lý eager — mỗi operation tạo một list trung gian. `Sequence` xử lý lazy — xử lý từng phần tử qua toàn bộ pipeline, không tạo list trung gian, tiết kiệm bộ nhớ. Tuy nhiên, với collection nhỏ (< 1000 phần tử), `Collection` thường nhanh hơn do overhead của `Sequence`.

**Q: Smart cast hoạt động như thế nào? Khi nào nó không hoạt động?**

Sau khi kiểm tra kiểu bằng `is`, compiler tự động cast biến sang kiểu đã check mà không cần `as`. Tuy nhiên smart cast **không hoạt động** với `var` properties (vì giá trị có thể bị thay đổi bởi thread khác giữa lúc check và lúc dùng) hoặc với custom getter (vì giá trị có thể khác mỗi lần gọi).

**Q: Giải thích cơ chế Delegation trong Kotlin. Tại sao nó tốt hơn Inheritance?**

Delegation cho phép một class ủy quyền hành vi cho object khác thông qua `by`. So với inheritance: (1) Tránh vấn đề "fragile base class" — thay đổi base class không ảnh hưởng delegate; (2) Linh hoạt hơn — có thể thay đổi delegate tại runtime; (3) Hỗ trợ composition over inheritance — nguyên tắc thiết kế được khuyến khích trong phát triển phần mềm hiện đại.
