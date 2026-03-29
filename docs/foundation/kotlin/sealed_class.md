# Sealed Class và Sealed Interface

## 1. Sealed Class: "Gia phả" có giới hạn
- Về cơ bản, `sealed class` dùng để biểu diễn một **hệ thống phân cấp lớp bị hạn chế**. Tức là, các subclass của nó phải được định nghĩa trong một file (hoặc cùng một package ở các phiên bản 1.5+).
- Khi dùng với `when`, nhờ tính *exhaustive*, compiler bắt buộc chúng ta phải handle tất cả các trường hợp.
### Ví dụ:
```kotlin
sealed class Result {
    data class Success(val data: String) : Result()
    data class Error(val exception: Exception) : Result()
}

// Khi sử dụng
fun handleResult(result: Result) {
    when (result) {
        is Result.Success -> {
            println("Success: ${result.data}")
        }
        is Result.Error -> {
            println("Error: ${result.exception.message}")
        }
    }
}
```

## 2. Sealed Interface
- Được giới thiệu từ Kotlin 1.5.
- Hữu ích khi muốn một object vừa thuộc nhóm dữ liệu này, vừa có hành vi của nhóm dữ liệu khác.
### Ví dụ:
```kotlin
sealed interface Clickable
sealed interface Focusable

class Button : Clickable, Focusable
class TextField : Focusable
```

## 3. Sự khác biệt giữa Enum là Sealed Class?
- Enum: Tập hợp các hằng số (constains) có chung cấu trúc dữ liệu.
- Sealed Class: Mỗi subclass có cấu trúc dữ liệu riêng biệt.
    - Ví dụ: Trạng thái `Success` mang theo một `User` object, nhưng trạng thái `Error` lại mang theo một `Exception`.

## 4. Phân biệt Sealed Class và Abstract Class
- Abstract Class: Cho phép các subclass có thể kế thừa ở bất kỳ đâu.
- Sealed Class: Tất cả các subclass phải được định nghĩa trong cùng một package/module. Compiler có thể biết được tất cả các subclass ngay từ đầu.