# Extensions function
Nó là cơ chế cho phép ta "thêm" phương thức mới vào một lớp đã tồn tại mà không cần kế thừa (inheritance) hay sử dụng Decorator pattern.

## Q: Extension Function có thực sự thay đổi Class đó không?
A: Không. Nó không chèn code vào trong class gốc.</br>
**Bản chất**: Khi biên dịch ra Bytecode (hoặc Java), Extension function thực chất là một Static Method nhận đối tượng đó làm tham số đầu tiên.</br>
**Ví dụ**:
```
fun ImageView.loadImage(url: String) {
    Glide.with(this.context)
        .load(url)
        .into(this)
}
```
Decompile code:
```
public final class ExtensionKt {
   public static final void loadImage(@NotNull ImageView $this$loadImage, @NotNull String url) {
      Intrinsics.checkNotNullParameter($this$loadImage, "$this$loadImage");
      Intrinsics.checkNotNullParameter(url, "url");
      Glide.with($this$loadImage.getContext())
         .load(url)
         .into($this$loadImage);
   }
}
```
**Hệ quả**: Không thể truy cập vào các thuộc tính hoặc phương thức private hay protected của lớp đó.

## Q: Nếu Extension function trùng tên & tham số với Member function thì sao?
A: Kotlin luôn ưu tiên Member function. Extension function sẽ bị bỏ qua.

## Q: Tính chất Static Dispatch.
- Quyết định hàm nào được gọi dựa trên kiểu biến, không dựa trên kiểu object thực tế.
- Ví dụ:
```
open class Shape
class Rectangle: Shape()

fun Shape.getName() = "Shape"
fun Rectangle.getName() = "Rectangle"

fun printClassName(s: Shape) {
    println(s.getName())
}

printClassName(Rectangle())
// Output: Rectangle
```