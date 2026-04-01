# Lateinit Lazy

`lateinit` và `lazy` đều được sinh ra để giải quyết bài toán **trì hoãn việc khởi tạo**.

### 1. `lateinit var` (Late Initialization)

- **Bản chất**: Cho phép khai báo một biến non-null mà không cần khởi tạo ngay trong constructor.

- **Đặc tính kỹ thuật:**

  - Chỉ đi kèm với `var`&#x20;

  - **Không** hỗ trợ kiểu dữ liệu nguyên thủy (Primitive types như `Int`, `Float`, `Boolean`,...) và không hỗ trợ kiểu Nullable (`String?`, `Object?`)

- **Under the hood (Java Bytecode):** Khi khai báo `lateinit var`, Compiler sẽ sinh ra một private field thông thường trong Java. Hàm `getter()/setter()` sẽ tự động được chèn thêm một lệnh check null. Đây là lí do `lateinit` không hỗ trợ Primitive types (các kiểu nguyên thủy), vì các kiểu nguyên thủy trong Java (int, float,..) không thể nhận giá trị null.

```kotlin title="Kotlin"
class UserActivity {
    lateinit var userName: String
    
    fun printName() {
        println(userName)
    }
}
```

```java
public final class UserActivity {
    // 1. Biến thực tế được khai báo là private
    private String userName;

    // 2. Hàm Getter được compiler tự động sinh ra
    @NotNull
    public final String getUserName() {
        String var1 = this.userName;
        
        // Null-check được chèn vào mọi lần gọi getter
        if (var1 != null) {
            return var1;
        } else {
            // Nếu biến chưa được gán (bằng null), ném ra Exception
            Intrinsics.throwUninitializedPropertyAccessException("userName");
            return null;
        }
    }

    // 3. Hàm Setter thông thường kèm kiểm tra null đầu vào
    public final void setUserName(@NotNull String var1) {
        Intrinsics.checkNotNullParameter(var1, "<set-?>");
        this.userName = var1;
    }

    public final void printName() {
        // Lời gọi userName trong Kotlin thực chất là gọi hàm getUserName() trong Java
        String var1 = this.getUserName();
        System.out.println(var1);
    }
}
```

### 2. `lazy` (Lazy Delegation)

- **Bản chất:** `lazy` không phải là một từ khóa của ngôn ngữ như `lateinit`, nó là một **highger-order function** trả về một đối tượng `Lazy<T>` . Sử dụng nó thông qua cơ chế Delegated Properties (`by`).

- **Đặc tính kỹ thuật:**

  - Phải đi kèm với `val`

  - Giá trị được tính toán **một lần duy nhất** ở lần gọi đầu tiên (qua lambda block). Các lần sau sẽ trả về kết quả đã được cache.

  - Hỗ trợ mọi kiểu dữ liệu, bao gồm cả Primitive types và Nullable types.

- **Under the hood (Java Bytecode):**

  Khi dùng `by lazy`, compiler không tạo ra trực tiếp một field chứa giá trị. Thay vào đó nó tạo ra **một đối tượng** `Lazy` **mới.** Hàm `getter()` sẽ gọi đến `lazyObject.getValue()`. Việc này đồng nghĩa với việc tạo thêm một object instance và có chi phí (overhead) về bộ nhớ nhỉnh hơn so với `lateinit`&#x20;

```kotlin showLineNumbers
class UserActivity {
    val databaseUrl: String by lazy {
        println("Computing...")
        "https://my-database.com"
    }
}
```

```java title="Decompiled Java Code" showLineNumbers
public final class UserActivity {
    // 1. Không hề có biến String nào được tạo ra! 
    // Thay vào đó là một đối tượng Lazy đóng vai trò Delegate (Ủy quyền)
    @NotNull
    private final Lazy databaseUrl$delegate;

    public UserActivity() {
        // 2. Khởi tạo đối tượng Lazy trong Constructor, truyền vào một khối Lambda (Function0)
        this.databaseUrl$delegate = LazyKt.lazy((Function0)(new Function0() {
            public final Object invoke() {
                System.out.println("Computing...");
                return "https://my-database.com";
            }
        }));
    }

    // 3. Hàm Getter gọi đến delegate
    @NotNull
    public final String getDatabaseUrl() {
        Lazy delegate = this.databaseUrl$delegate;
        // Thực hiện lấy giá trị từ đối tượng Lazy
        return (String) delegate.getValue();
    }
}
```

### 3. Tại sao phải dùng `lateinit` và `lazy`&#x20;

- `lateinit` : Ép các biến có tính chất phụ thuộc vào Lifecycle (Views, ViewModels, Inject objects) trở thành dạng **Non-null,** giúp code sạch hơn, an toàn hơn và loại bỏ các toán tử dư thừa `?.` hay `!!`

- `lazy` : Có những object rất "nặng" (tốn nhiều CPU và RAM để khởi tạo) như: Database Instance, Gson/Moshi builder, MediaPlayer, hoặc các thuật toán xử lý hình ảnh. Nếu khởi tạo ngay thì có thể sẽ làm app bị khựng và lãng phí tài nguyên, đặc biệt là khi người dùng thậm chí còn chưa dùng đến chức năng đó.
