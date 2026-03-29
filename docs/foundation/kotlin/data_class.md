# Data Class
Data class là một lớp được thiết kế để chứa dữ liệu. Compiler sẽ tự động sinh ra các phương thức như *`equals()`*, *`hashCode()`*, *`toString()`*, *`copy()`*, *`componentN()`*. Điều này giúp giảm lượng boilerplate code khi mục đích chính của nó là để lưu trữ và quản lý dữ liệu.

## Key Concepts

### 1. Data Class phải đáp ứng các điều kiện sau:
- Primary constructor phải có ít nhất một tham số.
- Tất cả các tham số của primary constructor phải được đánh dấu là val hoặc var.
- Data class không thể là abstract, open, sealed, hoặc inner.
=> Vì những điều kiện này mà data class không thể thay thế cho class thông thường.

## 2. Hàm copy() 
Trong Java Bytecode, nó sẽ có dạng như sau:
```
// Data class User(val name: String, val age: Int)
fun copy(name: String = this.name, age: Int = this.age) = User(name, age)
```
**Nguyên lý:** Hàm `copy()` chỉ tạo ra một bản sao "nông" (*Shallow Copy*), tức là tạo ra một object mới trên bộ nhớ Heap **nhưng** các thuộc tính bên trong (nested object) thì vẫn trỏ đến reference cũ. Hệ quả là nếu 1 trong 2 object thay đổi sẽ làm object còn lại thay đổi theo.

## 3. Tại sao các tham số trong primary constructor phải là val hoặc var?
Vì Kotlin dùng primary constructor để tự tạo ra các hàm như *`equals()`*, *`hashCode()`*, *`toString()`*, *`copy()`*, *`componentN()`* và những hàm này đều cần truy cập property của object. Nếu không có `var`/`val` các tham số trong constructor chỉ được coi là tham số tạm thời, chỉ tồn tại trong `init` block. Bằng cách dùng `var`/`val`, những tham số này sẽ trở thành **Properties** của object - tức là chúng được lưu trữ dưới dạng các trường (fields) và có thể được truy cập thông qua getter/setter.
- Ví dụ về một class thông thường khi được biên dịch thành Java Bytecode:</br>
    ```
    // class User(name: String, age: Int)
    public final class User {
        public User(String name, int age) {
            // Các tham số chỉ xuất hiện ở đây, không thể dùng cho logic của class
        }
    }
    ```
- Ví dụ về một data class khi được biên dịch thành Java Bytecode:</br>
    ```
    // data class User(val name: String, val age: Int)
    public final class User {

        private final String name;
        private final int age;

        // Constructor
        public User(String name, int age) {
            this.name = name;
            this.age = age;
        }

        // Getter
        public final String getName() {
            return name;
        }

        public final int getAge() {
            return age;
        }

        // copy()
        public final User copy(String name, int age) {
            return new User(name, age);
        }

        // copy$default (hỗ trợ default params)
        public static User copy$default(User user, String name, int age, int mask, Object obj) {
            if ((mask & 1) != 0) name = user.name;
            if ((mask & 2) != 0) age = user.age;
            return user.copy(name, age);
        }

        // componentN (destructuring)
        public final String component1() {
            return name;
        }

        public final int component2() {
            return age;
        }

        // equals()
        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof User)) return false;
            User other = (User) o;
            return age == other.age &&
                java.util.Objects.equals(name, other.name);
        }

        // hashCode()
        @Override
        public int hashCode() {
            return java.util.Objects.hash(name, age);
        }

        // toString()
        @Override
        public String toString() {
            return "User(name=" + name + ", age=" + age + ")";
        }
    }
    ```

## 4. So sánh `==` (structural equality) và `===` (referential equality) khác nhau như thế nào?
- `==`: So sánh nội dung bên trong object
- `===`: So sánh địa chỉ ô nhớ
- Ex:
    ```
    data class User(val name: String, val age: Int)
    val userOriginal = User("Alice", 25)
    val userCopy = userOriginal.copy()
    println(userOriginal == userCopy) // true
    println(userOriginal === userCopy) // false
    println(userOriginal.name == userCopy.name) // true
    ```

## 5. Có thể override các hàm tự động sinh ra không?
- Có thể override các hàm tự động sinh ra của Data Class, khi đó Kotlin sẽ sử dụng các hàm override thay vì hàm tự động sinh ra. Tuy nhiên các hàm khác vẫn được sinh ra dựa trên tham số ở constructor chính.
- Trong một số trường hợp, nếu data class chứa dữ liệu nhạy cảm (như mật khẩu) thì nên override lại hàm `toString()` để tránh việc bị lộ thông tin trong log hoặc crash report.