# Android Knowledge Hub

Website Docusaurus chia sẻ kiến thức Android hướng tới Senior: cơ chế nền tảng, thiết kế có đánh đổi, failure cases, thực hành và quiz. Nội dung nằm trong `docs/`; trang chủ là `docs/intro.md`, lộ trình tại `docs/interview/senior-android.md`, bài tổng hợp tại `docs/interview/senior-capstone.md`.

## Chạy và kiểm tra

Yêu cầu Node.js >= 20 theo `package.json`.

```bash
npm ci
npm start
```

```bash
npm run test:quiz
npm run build
npm run serve
```

`build/` là artifact website tĩnh. `npm run build` tự chạy kiểm tra quiz qua `prebuild`, rồi build với kiểm tra broken internal links/Markdown links. GitHub Actions dùng cùng lệnh build và deploy Pages từ `main`. Thay đổi local chưa tự xuất hiện trên website công khai.

## Nội dung và quiz

- `src/data/coreQuestions.mjs`: bộ câu hỏi gốc đã rà soát lại đáp án và liên kết đọc.
- `src/data/seniorQuestions.mjs`: tình huống Senior.
- `src/data/quizQuestions.mjs`: tổng hợp câu hỏi/chủ đề.
- `src/utils/quiz.mjs`: bộ lọc, randomization và scoring.
- `scripts/quiz.test.mjs`: kiểm tra ID/đáp án, bài đọc/anchor, bộ lọc, đảo lựa chọn, retry và tỷ lệ đúng.

Practice mode không đếm giờ; challenge mode có 20 giây/câu gốc và 60 giây/tình huống Senior. Tỷ lệ đúng độc lập với điểm thưởng. Tiến độ nằm trong memory của trang và reset khi reload; bài đọc mở tab mới để không làm gián đoạn quiz.

Tìm kiếm local hỗ trợ tiếng Việt và tiếng Anh. Tài liệu dùng sidebar tự sinh, nên bài mới được đưa vào đúng thư mục/chủ đề.

## Khi viết hoặc sửa bài

Nêu vấn đề, cơ chế, giả định, tradeoff/failure case và cách kiểm chứng. Ưu tiên nguồn chính thức; kiểm tra version/target SDK trước các khẳng định về platform hoặc thư viện. Ví dụ Kotlin phải nêu dependency/type giả định và phần chưa triển khai, giữ cancellation/ownership đúng và không đưa credential thật vào mẫu.

Website là tài liệu học và đề thực hành, không chứa một Android app hoàn chỉnh. Build Docusaurus và test quiz không chứng minh các ví dụ Android đã được compile/run trên thiết bị; người học cần setup project và thực hiện ma trận test của bài tương ứng. Điểm quiz/rubric không chứng nhận cấp bậc nghề nghiệp.
