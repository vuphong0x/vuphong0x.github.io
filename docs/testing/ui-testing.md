---
title: UI testing, semantics và synchronization
---

# UI test: hành vi người dùng và đồng bộ đúng nguồn

Espresso làm việc với View hierarchy; Compose testing API tìm node theo semantics. Trên Android, `createComposeRule()` vẫn dùng cơ chế host/instrumentation tương ứng: “không phải chỉ định Activity riêng” không đồng nghĩa “không có Activity” hoặc một JVM test thuần.

## 1. Chọn test rule

- `createComposeRule()` phù hợp đặt content cần kiểm tra mà không chọn Activity sản phẩm cụ thể.
- `createAndroidComposeRule<YourActivity>()` phù hợp cần Activity cụ thể và integration của nó.
- `createEmptyComposeRule()` không tự cung cấp host/content; test phải tổ chức môi trường riêng theo contract API.

Thiết lập dependencies/source set theo phiên bản Compose đang dùng. Không trộn giả định của local JVM tests với instrumented UI tests.

Nguồn: [Compose testing setup](https://developer.android.com/develop/ui/compose/testing).

## 2. Ví dụ kiểm tra state/action của một button

```kotlin
class SubmitButtonTest {
    @get:Rule
    val compose = createComposeRule()

    @Test
    fun disabledButtonDoesNotSubmit() {
        var submissions = 0
        compose.setContent {
            Button(onClick = { submissions++ }, enabled = false) {
                Text("Submit")
            }
        }
        compose.onNodeWithText("Submit").assertIsNotEnabled()
        compose.runOnIdle { assertEquals(0, submissions) }
    }
}
```

Ví dụ dùng Compose Material và UI test JUnit4. Đây là kiểm tra UI nhỏ; test thành công phải có case button enabled, click và callback/behavior được kích hoạt. Trong UI nhiều node cùng text, dùng matcher có semantics đủ phân biệt thay vì dựa vào thứ tự node.

Test tag hữu ích khi cần định danh kỹ thuật, nhưng không thay accessible label/role/action. Semantics merge có thể làm cây test khác layout tree; chỉ dùng unmerged tree khi thực sự kiểm tra boundary đó.

## 3. Idle của UI chưa chắc network đã hoàn tất

Framework đồng bộ các nguồn nó biết, không tự hiểu mọi request Retrofit, external callback hoặc background job. Inject fake cho screen tests; với integration thực, đăng ký IdlingResource hoặc chờ điều kiện bounded theo API test. Không đăng ký resource luôn “busy” hay dùng sleep để che race.

Compose test clock giúp điều khiển animation/recomposition theo API; nó không tự tiến server clock hoặc mọi coroutine dispatcher ngoài Compose. Kiểm tra boundary của clock đang dùng trước khi kết luận một delay được skip.

Nguồn: [Compose synchronization](https://developer.android.com/develop/ui/compose/testing/synchronization), [Espresso Idling Resources](https://developer.android.com/training/testing/espresso/idling-resource).

## 4. Ma trận UI đủ sát sản phẩm

| Trường hợp | Cần kiểm tra |
| --- | --- |
| Loading/error/retry | Có trạng thái rõ, không submit lặp ngoài contract |
| Font scale/thiết bị nhỏ | Nội dung và action chính vẫn dùng được |
| TalkBack/keyboard | Tên, role, focus và action phù hợp |
| Rotation/back stack | Input/selection phục hồi đúng owner |
| Network hoàn tất lúc STOPPED | Không truy cập View cũ; state quan trọng vẫn tồn tại |
| Process death | Test riêng, không đánh đồng recreate |

Đọc tiếp: [state recovery](../android-core/state-recovery.md#verify-restoration), [custom View accessibility](../ui/custom-view.md#accessibility), [test strategy](./test-strategy.md).
