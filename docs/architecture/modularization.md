---
title: Modularization, DI và build performance
---

# Module hóa theo boundary và bằng chứng

Tách module có thể cải thiện encapsulation, ownership, reuse và khả năng xử lý công việc độc lập. Nó cũng có chi phí configuration, plugin, code generation và dependency graph. Không có quy luật “càng nhiều module càng build nhanh”.

## 1. Bắt đầu bằng điểm thay đổi và owner {#boundaries}

Một graph minh họa:

```text
:app → :feature:checkout → :core:orders-api
:app → :feature:catalog  → :core:catalog-api
:app → :data:orders     → :core:orders-api
```

`:app` là composition root ghép implementation. Checkout không phụ thuộc UI của Catalog chỉ để nhận một product ID. Contract navigation/data có thể đặt ở boundary nhỏ phù hợp; đừng biến `core:utils` thành module chứa mọi thứ và mọi dependency.

Với logic không cần Android API/resource, cân nhắc Kotlin/JVM module để giảm overhead. Một feature không nhất thiết là dynamic feature; Play Feature Delivery cần cấu hình và yêu cầu riêng.

Nguồn: [Guide to modularization](https://developer.android.com/topic/modularization), [common patterns](https://developer.android.com/topic/modularization/patterns).

## 2. api và implementation không phải access modifier {#gradle-api}

`api` expose dependency tới compile classpath của consumer; `implementation` giữ dependency ở implementation classpath theo plugin contract. Tuy nhiên, nếu public API của module dùng type của thư viện đó, consumer vẫn cần truy cập type để compile; “chỉ đổi api thành implementation” không sửa một public boundary đang lộ type.

Kotlin `internal` giới hạn theo module biên dịch; nó khác việc Gradle expose dependency. Review cả public signature, plugin/application mode và ABI thay vì chỉ tên configuration.

## 3. Dependency injection theo lifetime {#di}

DI nghĩa là object nhận dependency thay vì tự tạo chúng. Constructor injection thường đủ để test class bằng fake; không cần Hilt cho mọi hàm thuần túy.

Hilt/Dagger cung cấp graph và lifecycle integration cụ thể. Scope phải khớp lifetime: singleton không giữ Activity/View; dependency của ViewModel không được capture View cũ qua callback. Runtime DI hoặc cơ chế compile-time có tradeoff khác nhau; đo startup/build và đánh giá validation/tooling của phiên bản dùng thực tế thay vì khẳng định một framework luôn nhanh hơn.

```kotlin
class CalculateTotal(private val prices: PriceCatalog) {
    fun forItems(ids: List<String>): Long = ids.sumOf(prices::minorUnits)
}

interface PriceCatalog {
    fun minorUnits(id: String): Long
}
```

Ví dụ dùng minor currency units để minh họa một pure boundary; chưa xử lý thuế, rounding hay overflow của nghiệp vụ thực tế. Test có thể truyền fake PriceCatalog trực tiếp, không cần khởi toàn bộ app graph.

Nguồn integration: [Hilt](https://developer.android.com/training/dependency-injection/hilt-android).

## 4. Đo build trước và sau {#build-evidence}

Ghi rõ phiên bản JDK/Gradle/AGP, loại máy, cache và tác vụ đo. So sánh ít nhất clean build, no-change build và incremental change ở một feature/contract được chia sẻ. Warm daemon/cache và cold run là các điều kiện khác nhau.

| Thay đổi thử | Câu hỏi cần trả lời |
| --- | --- |
| Sửa implementation của checkout | Những task/module nào thực sự chạy lại? |
| Đổi public type dùng ở nhiều feature | ABI change lan rộng tới đâu? |
| Thêm module có codegen | Chi phí configuration/codegen tăng bao nhiêu? |
| Tách pure Kotlin khỏi Android module | Task và classpath nào được giảm? |

Không suy ra kết quả chỉ từ số module hoặc một lần build. Dùng build report/scan phù hợp chính sách dữ liệu của team; không upload thông tin build nhạy cảm tùy tiện.

## 5. Chuyển đổi từng bước

Chọn một boundary có lợi ích rõ, thêm characterization/contract tests, tách với dependency hướng rõ rồi đo lại. Theo dõi thời gian review, ownership và cycle dependency cùng build time. Nếu rollback được extraction mà không thay behavior, rollout ít rủi ro hơn một lần rewrite toàn bộ app.

**Bài tập:** đề xuất tách checkout khỏi monolith. Viết một decision record gồm vấn đề, hai phương án, graph, phép đo baseline, kết quả mong đợi và điều kiện dừng nếu chi phí cao hơn lợi ích.

Đọc tiếp: [Clean Architecture](./clean-architecture.md), [legacy code](../real-world/legacy-code.md), [capstone](../interview/senior-capstone.md).
