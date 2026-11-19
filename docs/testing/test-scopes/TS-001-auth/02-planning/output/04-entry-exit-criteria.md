# Entry & Exit Criteria

Đọc file này để biết điều kiện để bắt đầu từng hoạt động hoặc test level của TS-001, điều kiện để coi là hoàn thành, và khi nào phải tạm dừng hoặc được tiếp tục.

## 1. Entry criteria

| Criterion ID | Hoạt động / test level | Điều kiện | Cách kiểm tra | Nguồn dữ liệu |
| --- | --- | --- | --- | --- |
| EN-01 | Phase 03 Test Analysis & Design | Test plan có version cụ thể đã được product owner duyệt | Test Plan mục 7 có dòng Duyệt | [Test Plan](01-test-plan.md) |
| EN-02 | Phase 04 Test Implementation | Product owner đã review test condition và test case của rủi ro mức Cao | Design Status của Phase 03 ghi người review và ngày | `03-design/` |
| EN-03 | Mọi lần chạy test | Đã ghi commit của build và version `better-auth` đã cài | `git rev-parse HEAD`; `pnpm --filter @crypto-force/api list better-auth` | Test log |
| EN-04 | Component integration | `pnpm db:up` chạy được; test smoke tạo tài khoản, xác minh email và Sign in pass | `pnpm test` | Output của Vitest |
| EN-05 | System | `pnpm dev` chạy được trên database E2E riêng (PJ-03) và với `RESEND_API_KEY` để trống (PJ-09); E2E "create an account, confirm the email, then sign in" pass | `pnpm test:e2e` | Output của Playwright |
| EN-06 | Test cần công cụ mới | Đã cài và cấu hình `@axe-core/playwright`, cách điều khiển thời gian, OAuth provider giả, stub Pwned Passwords (PJ-05) | Implementation Status của Phase 04 | `04-implementation/` |
| EN-07 | System integration với Google và Resend | OAuth client trong `.env` hoạt động với `http://localhost:5173`, và có tài khoản Google để test (PJ-04). `.env` có `RESEND_API_KEY`, `EMAIL_FROM`, và product owner mở được hộp thư của chủ tài khoản Resend | Nút Continue with Google mở được màn đăng nhập của Google; log của API không có "RESEND_API_KEY is not set" | Test log |

Entry criteria thường gồm: tài nguyên sẵn sàng (người, công cụ, môi trường, test data, ngân sách, thời gian); testware sẵn sàng (test basis, requirement kiểm thử được, test case); chất lượng ban đầu của test object, ví dụ smoke test đã pass [[1, §5.1.3]](#ref-1).

Test của 9 khác biệt đã biết (Requirement Readiness mục 4) không chờ code được sửa. Test được chạy trên build hiện có; kết quả fail được ghi thành defect (PJ-01).

## 2. Exit criteria

| Criterion ID | Test level | Loại | Tiêu chí | Ngưỡng / mẫu số | Objective IDs | Nguồn của ngưỡng |
| --- | --- | --- | --- | --- | --- | --- |
| EX-01 | Mọi level | Mức độ kỹ lưỡng | Requirement coverage | 81/81 requirement Ready có ít nhất một test case đã chạy | OBJ-01, OBJ-02, OBJ-03 | Người lập plan đề xuất: mọi requirement Ready đều thuộc một rủi ro được giảm bằng testing, nên không có requirement nào được phép bỏ |
| EX-02 | Mọi level | Mức độ kỹ lưỡng | Coverage theo mức rủi ro | 100% coverage item của criterion ở Test Approach mục 2, cho mỗi rủi ro mức Cao và Trung bình | OBJ-01, OBJ-02 | Người lập plan đề xuất: theo coverage target ở Test Approach mục 2 |
| EX-03 | Mọi level | Mức độ kỹ lưỡng | Defect chưa giải quyết theo severity | 0 defect Critical và 0 defect Major đang mở. Defect Minor và Trivial đang mở có trong danh sách rủi ro còn lại | OBJ-01, OBJ-02, OBJ-05 | Người lập plan đề xuất: với Auth, defect Critical và Major là lỗi bảo mật hoặc lỗi làm luồng chính cho kết quả sai; thang severity mặc định của skill `test-defect-classification` |
| EX-04 | Component integration, System | Mức độ kỹ lưỡng | ASVS coverage | 100% mục ASVS áp dụng có test case đã chạy và pass, hoặc là rủi ro chấp nhận của ADR-002 | OBJ-02 | ADR-002 [[2]](#ref-2) |
| EX-05 | System | Mức độ kỹ lưỡng | Vi phạm accessibility | 0 vi phạm `serious` hoặc `critical` trên 6/6 màn hình Auth, kể cả trạng thái lỗi | OBJ-03 | Test Strategy [[3, Test types theo rủi ro]](#ref-3); product owner duyệt ở RF-05 |
| EX-06 | Mọi level | Mức độ kỹ lưỡng | Khác biệt đã biết | 9/9 khác biệt ở Requirement Readiness mục 4 đã sửa và confirmation test pass, hoặc được product owner chấp nhận là rủi ro còn lại | OBJ-04 | Người lập plan đề xuất: mỗi khác biệt đã được product owner quyết định "giữ requirement, implementation cần sửa" |
| EX-07 | System, System integration | Có hoặc không | Session thủ công | 4/4 exploratory session có debrief; session Google và Resend thật đã chạy, hoặc PJ-04 được product owner chấp nhận | OBJ-01, OBJ-02 | Người lập plan đề xuất: theo Test Approach mục 2 |
| EX-08 | Component, Component integration, System | Có hoặc không | Regression cuối | `pnpm test` và `pnpm test:e2e` chạy đầy đủ trên commit cuối và pass, trừ test của defect đã được chấp nhận ở EX-03, EX-06 | OBJ-05 | Người lập plan đề xuất: bằng chứng cho build cuối, không cho build trung gian |
| EX-09 | Mọi level | Có hoặc không | Rủi ro còn lại | Product owner đã xem và chấp nhận danh sách rủi ro còn lại ở Phase 06 | OBJ-05 | [[1, §5.1.3]](#ref-1) |

Exit criteria có hai loại: đo mức độ kỹ lưỡng (coverage đạt được, số defect chưa giải quyết, defect density, số test fail) và tiêu chí có hoặc không (test đã lên kế hoạch đã chạy, static testing đã làm, mọi defect đã được báo cáo, regression đã automation). Hết thời gian hoặc ngân sách chỉ được dùng làm điều kiện kết thúc khi stakeholder đã review và chấp nhận rủi ro của việc dừng test [[1, §5.1.3]](#ref-1).

Đợt kiểm thử TS-001 không có hạn thời gian. Kết thúc vì thời gian chỉ được phép khi product owner chấp nhận rủi ro của phần chưa test, theo EX-09.

## 3. Suspension và resumption criteria

| Criterion ID | Loại | Điều kiện | Người quyết định |
| --- | --- | --- | --- |
| SR-01 | Tạm dừng | Smoke test của EN-04 hoặc EN-05 fail trên build mới: dừng chạy test ở level đó | Agent báo cáo; product owner quyết định |
| SR-02 | Tiếp tục | Build sửa lỗi pass smoke test của EN-04 hoặc EN-05 | Product owner |
| SR-03 | Tạm dừng | Một defect chặn một luồng, ví dụ Create account không tạo được tài khoản: dừng các test phụ thuộc luồng đó, các test khác tiếp tục | Agent báo cáo; product owner quyết định |
| SR-04 | Tiếp tục | Defect chặn luồng đã sửa và confirmation test pass | Product owner |
| SR-05 | Tạm dừng | Version `better-auth` đã cài khác version ghi ở EN-03 | Agent báo cáo; product owner quyết định |
| SR-06 | Tiếp tục | Product owner xác nhận requirement viết theo hành vi của Better Auth (CA-06, CA-17, SI-06) vẫn đúng với version mới; chạy lại toàn bộ regression từ đầu | Product owner |

## 4. Phê duyệt

| Người duyệt | Quyết định | Ngày | Version |
| --- | --- | --- | --- |
| Product owner | Duyệt | 2026-11-17 | 1.1 |

## 5. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q4-01 | Mỗi tiêu chí đo được: có metric, ngưỡng, mẫu số và nguồn dữ liệu | — | Đạt |
| Q4-02 | Ngưỡng khác nhau theo mức rủi ro khi rủi ro khác nhau; mỗi ngưỡng có nguồn, giá trị do người lập plan đề xuất ghi lý do | IN-07 | Đạt: mức khác nhau nằm ở coverage criterion của Test Approach mục 2; EX-02 áp dụng target của từng mức. IN-07 Chưa có, nên ngưỡng không dựa trên số liệu cũ |
| Q4-03 | Mỗi exit criterion dẫn tới ít nhất một mục tiêu kiểm thử | — | Đạt |
| Q4-04 | Tiêu chí từ chuẩn bắt buộc dùng version và mức áp dụng lấy từ bản gốc | RC-04 | Đạt |
| Q4-05 | Kết thúc do hết thời gian hoặc ngân sách chỉ được phép khi có stakeholder chấp nhận rủi ro | RC-02 | Đạt: quy tắc ở mục 2; người chấp nhận rủi ro là product owner |
| Q4-06 | Exit criteria được người có thẩm quyền duyệt trước khi bắt đầu chạy test | RC-02 | Đạt: version 1.1 |
| Q4-07 | Mỗi suspension criterion có resumption criterion tương ứng và người quyết định | — | Đạt |

**Người review / ngày:** Product owner, 2026-11-17

## References

1. <a id="ref-1"></a>[ISTQB Certified Tester Foundation Level Syllabus v4.0.1](https://www.istqb.org/wp-content/uploads/2024/11/ISTQB_CTFL_Syllabus_v4.0.1.pdf) — v4.0.1, 2024-09-15
2. <a id="ref-2"></a>[Architectural Decisions](../../../../../architecture/30-decisions.md) — commit `705a1ad`, 2026-11-17
3. <a id="ref-3"></a>[Test Strategy](../../../../test-strategy.md) — commit `705a1ad`, 2026-11-17
