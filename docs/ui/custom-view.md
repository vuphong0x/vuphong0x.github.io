---
title: Custom View từ MeasureSpec đến accessibility
sidebar_position: 4
---

# Custom View: đo, vẽ, cập nhật và kiểm chứng

Bài này trả lời câu hỏi **“tạo custom View thế nào?”** bằng một thanh progress đơn giản. Mục tiêu không chỉ là vẽ được trên một thiết bị, mà còn đúng khi parent đổi constraints, kích thước thay đổi và người dùng sử dụng công cụ hỗ trợ tiếp cận.

Đọc trước: [XML Views](./xml.md), [profiling](../performance/profiling.md).

## 1. Chọn mức tùy biến cần thiết

Nếu chỉ cần ghép text, icon và button, một compound View/layout có thể đủ. Mở rộng View có sẵn khi muốn giữ behavior của nó. Tự vẽ bằng Canvas phù hợp đồ thị/hình học riêng, nhưng bạn phải tự xử lý measurement, input, saved state và accessibility tương ứng.

Trong codebase Compose, cân nhắc Canvas/custom layout hoặc interop trước khi tạo thêm View. Chọn theo nhu cầu tích hợp và tương tác, không theo giả định custom drawing luôn nhanh hơn widget có sẵn.

## 2. Đọc MeasureSpec như một hợp đồng {#measurement}

Parent truyền constraints cho mỗi chiều:

| Mode | Ý nghĩa cần tuân thủ |
| --- | --- |
| EXACTLY | Dùng kích thước được chỉ định |
| AT_MOST | Không vượt giới hạn, chọn kích thước mong muốn phù hợp |
| UNSPECIFIED | Không có giới hạn kiểu trên trong lần đo đó |

`wrap_content` không tự cho View biết nó muốn rộng bao nhiêu. View phải tính desired size, gồm nội dung, padding và minimum size. Với ViewGroup còn phải đo con và layout con; ví dụ bên dưới chỉ là View lá.

Nguồn: [Custom drawing và onMeasure](https://developer.android.com/develop/ui/views/layout/custom-views/custom-drawing).

## 3. Một View minh họa có kiểm soát allocation {#drawing}

```kotlin
class ProgressStrip @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0,
) : View(context, attrs, defStyleAttr) {
    private val density = resources.displayMetrics.density
    private val track = RectF()
    private val fill = RectF()
    private val trackPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.LTGRAY
    }
    private val fillPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.BLUE
    }

    var progress: Float = 0f
        set(value) {
            require(value.isFinite())
            val next = value.coerceIn(0f, 1f)
            if (field == next) return
            field = next
            updateFill()
            invalidate()
        }

    override fun onMeasure(widthSpec: Int, heightSpec: Int) {
        val desiredWidth = maxOf(
            suggestedMinimumWidth,
            (160 * density).roundToInt() + paddingLeft + paddingRight,
        )
        val desiredHeight = maxOf(
            suggestedMinimumHeight,
            (8 * density).roundToInt() + paddingTop + paddingBottom,
        )
        setMeasuredDimension(
            resolveSizeAndState(desiredWidth, widthSpec, 0),
            resolveSizeAndState(desiredHeight, heightSpec, 0),
        )
    }

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)
        updateTrack()
    }

    private fun updateTrack() {
        track.set(
            paddingLeft.toFloat(),
            paddingTop.toFloat(),
            maxOf(paddingLeft, width - paddingRight).toFloat(),
            maxOf(paddingTop, height - paddingBottom).toFloat(),
        )
        updateFill()
    }

    private fun updateFill() {
        fill.set(track)
        fill.right = track.left + track.width() * progress
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        // Cập nhật cả khi padding đổi nhưng kích thước ngoài không đổi.
        updateTrack()
        val radius = track.height() / 2f
        canvas.drawRoundRect(track, radius, radius, trackPaint)
        canvas.drawRoundRect(fill, radius, radius, fillPaint)
    }
}
```

Ví dụ dùng Android `View`, `Canvas`, `Paint`, `RectF`, `Color`, `Context`, `AttributeSet` và `kotlin.math.roundToInt`. Màu hardcode và kích thước mặc định chỉ để tập trung vào pipeline; khi tích hợp phải thay bằng theme/custom attributes phù hợp. Set `progress` trên main thread.

`Paint`/`RectF` được tái sử dụng, không tạo mới ở mỗi `onDraw`. Việc cập nhật hình học nhỏ trong draw giúp ví dụ xử lý cả padding đổi mà outer size giữ nguyên; với đường vẽ phức tạp, cache theo data/geometry version và rebuild khi input tương ứng thay đổi.

## 4. invalidate khác requestLayout {#updates}

Trong ví dụ, progress đổi chỉ làm vùng fill rộng hơn trong kích thước hiện có: `invalidate()` là đủ. Nếu View hiển thị label và label mới làm desired size thay đổi, cần `requestLayout()` để parent đo lại, rồi yêu cầu redraw theo nhu cầu.

Gọi requestLayout liên tục trong animation dù kích thước không đổi có thể tạo công việc measure/layout thừa. Ngược lại, chỉ invalidate khi desired size đã đổi có thể khiến nội dung bị cắt. Chọn theo đầu vào nào thay đổi, không chọn theo thói quen.

Không decode bitmap, gọi network hoặc query database trong draw. Chuẩn bị dữ liệu trước, decode ảnh theo kích thước hiển thị và cập nhật View qua main thread. Chuyển Canvas hiện tại sang IO không phải cách làm draw bất đồng bộ an toàn.

## 5. Accessibility là một phần của behavior {#accessibility}

Thanh progress read-only nên expose trạng thái/role/range phù hợp để công cụ hỗ trợ hiểu giá trị; nếu nó tương tác như slider, cần cả action thay đổi và thao tác bàn phím, không chỉ `contentDescription`. Với widget tương tác phổ biến, mở rộng widget có sẵn thường giữ được nhiều behavior hơn.

Biểu đồ có nhiều điểm bấm cần cân nhắc virtual accessibility children thay vì một mô tả khổng lồ cho cả biểu đồ. Kiểm tra focus order, font scale, tương phản, TalkBack và cách biểu diễn thông tin ngoài màu sắc. Không cần tạo một AccessibilityService chỉ để View của app hỗ trợ TalkBack.

`ProgressStrip` ở trên chỉ minh họa đo/vẽ; chưa cung cấp đầy đủ accessibility, RTL, theme, custom attributes hay state restoration. Nếu owner giữ progress thì View nhận lại khi bind; nếu View tự sở hữu state cần phục hồi, triển khai saved state phù hợp hoặc dùng widget đã có behavior này.

Nguồn: [Custom views accessibility](https://developer.android.com/guide/topics/ui/accessibility/views/custom-views).

## 6. Test theo ràng buộc, không theo một screenshot

| Kịch bản | Cần kiểm tra |
| --- | --- |
| EXACTLY 100px | Measured size là 100px, không ép về 160dp |
| AT_MOST nhỏ hơn desired size | Không vượt parent constraint |
| Padding lớn hoặc content area rất nhỏ | Không có kích thước/rect âm |
| Progress ngoài 0–1 hoặc không finite | Clamp/reject theo contract đã công bố |
| Resize, đổi padding | Geometry được tính từ bounds hiện tại |
| Cập nhật nhiều frame | Allocation và frame timing không tăng bất thường |
| TalkBack/RTL | Behavior phù hợp sản phẩm, không chỉ hình vẽ đúng ở LTR |

**Bài tập:** bổ sung label “75%”, hỗ trợ RTL và semantics progress. Xác định thay đổi nào cần redraw, thay đổi nào cần remeasure; đo lại khi cập nhật progress liên tục.

Đọc tiếp: [Compose state/effects](./jetpack-compose.md), [profiling](../performance/profiling.md#senior-measurement), [Context và memory](../android-core/context-memory.md). [Bộ câu hỏi](../interview/android-questions.md) · [Quiz](/quiz).
