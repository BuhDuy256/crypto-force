# Test Analysis & Design: Readiness

Đọc file này để xác định thông tin cần có trước khi phân tích test basis Authentication và thiết kế test, mức độ tin cậy của từng thông tin, và khi nào đủ điều kiện để bắt đầu.

## 1. Đợt thiết kế

| Trường | Nội dung |
| --- | --- |
| Mục tiêu | Từ 81 requirement Ready của TS-001, xác định test condition, test model, coverage item và test case để đạt coverage target của Test Plan 1.1 cho từng mức rủi ro |
| Phạm vi | Phạm vi In của Test Plan [[1, §3]](#ref-1): SC-01 đến SC-09 và SC-17. Test level: Component, Component integration, System, System integration. Test type: Functional, Security, Usability, Reliability |
| Thời gian dự kiến | Bắt đầu 2026-11-17 (GMT+7); không có hạn kết thúc (AS-02 của Test Plan) |
| Người thực hiện / người review | Người thực hiện: agent. Người review: product owner |

## 2. Thông tin cần có

| ID | Thông tin cần có | Dùng cho file | Nguồn | Trạng thái | Căn cứ trạng thái | Ảnh hưởng nếu chưa xác minh |
| --- | --- | --- | --- | --- | --- | --- |
| IN-01 | Các trường ở mục 1 | 01–05 | [[1]](#ref-1) | Đã xác minh | Mục tiêu và phạm vi lấy từ Test Plan 1.1, product owner duyệt ngày 2026-11-17 | — |
| IN-02 | Test basis có version | 01–04 | [[2]](#ref-2) [[3]](#ref-3) [[4]](#ref-4) [[5]](#ref-5) [[6]](#ref-6) [[7]](#ref-7) [[8]](#ref-8) | Đã xác minh | Requirement Readiness tại `6c7bbd7`: 81 Ready, 3 Ngoài phạm vi, product owner duyệt. Tài liệu nguồn: Authentication `705a1ad`, Security `d6c0541`, Workspace `bd0ecff`, Crypto Force UI Prototype `dbbaafe`, Architectural Decisions `705a1ad`, Test Strategy `705a1ad`. `git log -1` của từng file khớp các commit này | — |
| IN-03 | Mức rủi ro của từng test basis item | 02–04 | [[9]](#ref-9) | Đã xác minh | Risk Register tại `341584a`: mỗi requirement Ready thuộc ít nhất một rủi ro PR-01 đến PR-15, có mức Cao hoặc Trung bình | — |
| IN-04 | Test approach: test level, test type, technique, coverage criterion, coverage target | 01, 03 | [[10]](#ref-10) | Đã xác minh | Test Approach tại `341584a`, mục 2: criterion và target theo mức rủi ro, product owner duyệt từng giá trị ngày 2026-11-17 | — |
| IN-05 | Baseline độc lập | 02 | [[11]](#ref-11) [[12]](#ref-12) [[13]](#ref-13) [[14]](#ref-14) | Đã xác minh | Baseline Comparison tại `da6b261`: OWASP ASVS 5.0, L1 cộng các mục L2 của ADR-002, 70 mục; ID và mức lấy từ file gốc. Threat model STRIDE trên 4 data flow do Test Approach mục 2 yêu cầu được lập ở Phase này (MD-16) | — |
| IN-06 | Thông tin về test object cho state transition | 03 | [[3]](#ref-3) [[4]](#ref-4) [[5]](#ref-5) [[7]](#ref-7) | Đã xác minh | State model lấy trạng thái và event từ test basis có version, không từ code. White-box Out (SC-18). Code tại `b4ca981`; `git log b4ca981..HEAD -- apps packages` không có commit | — |
| IN-07 | Test case và test model hiện có có thể tái sử dụng | 03, 04 | `apps/api/test/auth.test.ts`, `apps/web/e2e/auth.spec.ts`, `apps/web/e2e/workspace.spec.ts` tại `b4ca981` | Đã xác minh | 11 integration test, 3 E2E Auth, 11 E2E workspace. Không có test model nào. Test hiện có được viết theo spec cũ, ví dụ test khóa Sign in dùng giới hạn 5 lần của code. Phase này thiết kế từ test basis; Phase 04 quyết định test nào được sửa để dùng lại | — |
| IN-08 | Quy ước đặt ID, định dạng test case, nơi lưu | 02–05 | [[15]](#ref-15) [[16]](#ref-16) | Đã xác minh | ID theo template Phase 03 và quy ước của test scope: `COND-NN`, `MD-NN`, `MD-NN-CI-NN`, `BD-NN`. Threat trong MD-16 dùng `TH-NN`; tiền tố `TH` không có trong template STLC và bảng tiền tố requirement. Mọi file nằm ở `03-design/` | — |
| IN-09 | Người trả lời câu hỏi về test basis và nơi báo lỗi test basis | 02, 03 | [[1, §5]](#ref-1) | Đã xác minh | Product owner giữ requirement (AS-01). Lỗi test basis được ghi ở Test Conditions mục 4 và báo cho product owner trong phiên làm việc (Test Plan mục 6) | — |
| IN-10 | Ràng buộc đã biết về test data và môi trường | 05 | [[1, §4]](#ref-1) [[9, §3]](#ref-9) [[10, §6]](#ref-10) | Đã xác minh | Test tự động không gọi Google, Resend, Pwned Passwords thật (AS-06). E2E cần database riêng (PJ-03) và `RESEND_API_KEY` để trống (PJ-09). Chưa có `@axe-core/playwright`, cách điều khiển thời gian, OAuth provider giả, stub Pwned Passwords (PJ-05). Email thật chỉ tới hộp thư của chủ tài khoản Resend | — |

## 3. Điều kiện bắt đầu

| ID | Điều kiện | Thông tin liên quan | Kết quả | Ảnh hưởng nếu không đạt |
| --- | --- | --- | --- | --- |
| RC-01 | Mỗi test basis item trong phạm vi có version và đã được xác nhận, hoặc được đánh dấu là giả định | IN-02 | Đạt | — |
| RC-02 | Mỗi test basis item trong phạm vi có mức rủi ro | IN-02, IN-03 | Đạt | — |
| RC-03 | Test Plan xác định coverage criterion và coverage target theo rủi ro | IN-04 | Đạt | — |
| RC-04 | Phần phạm vi có chuẩn ngành áp dụng đã có baseline độc lập với version và mức áp dụng | IN-05 | Đạt | — |
| RC-05 | Đã có người trả lời câu hỏi về test basis và nơi báo lỗi test basis | IN-09 | Đạt | — |

## 4. Kết luận sẵn sàng

**Trạng thái:** Sẵn sàng

**Phần được phép làm:** Toàn bộ phạm vi

**Người quyết định / ngày:** Product owner, 2026-11-17 (EN-01: Test Plan 1.1 đã duyệt)

## References

1. <a id="ref-1"></a>[Test Plan](../../02-planning/output/01-test-plan.md) — version 1.1, commit `341584a`, 2026-11-17
2. <a id="ref-2"></a>[Requirement Readiness](../../01-requirement-analysis/output/01-requirement-readiness.md) — commit `6c7bbd7`, 2026-11-17
3. <a id="ref-3"></a>[Authentication](../../../../../design/prototype/docs/requirements/authentication.md) — commit `705a1ad`, 2026-11-17
4. <a id="ref-4"></a>[Security](../../../../../architecture/23-security.md) — commit `d6c0541`, 2026-11-17
5. <a id="ref-5"></a>[Workspace](../../../../../design/prototype/docs/requirements/workspace.md) — commit `bd0ecff`, 2026-11-16
6. <a id="ref-6"></a>[Crypto Force UI Prototype](../../../../../design/prototype/README.md) — commit `dbbaafe`, 2026-11-16
7. <a id="ref-7"></a>[Architectural Decisions](../../../../../architecture/30-decisions.md) — commit `705a1ad`, 2026-11-17
8. <a id="ref-8"></a>[Test Strategy](../../../../test-strategy.md) — commit `705a1ad`, 2026-11-17
9. <a id="ref-9"></a>[Risk Register](../../02-planning/output/02-risk-register.md) — commit `341584a`, 2026-11-17
10. <a id="ref-10"></a>[Test Approach](../../02-planning/output/03-test-approach.md) — commit `341584a`, 2026-11-17
11. <a id="ref-11"></a>[Baseline Comparison](../../01-requirement-analysis/output/02-baseline-comparison.md) — commit `da6b261`, 2026-11-17
12. <a id="ref-12"></a>OWASP ASVS 5.0, V6 Authentication. <https://raw.githubusercontent.com/OWASP/ASVS/master/5.0/en/0x15-V6-Authentication.md> — truy cập 2026-11-17
13. <a id="ref-13"></a>OWASP ASVS 5.0, V7 Session Management. <https://raw.githubusercontent.com/OWASP/ASVS/master/5.0/en/0x16-V7-Session-Management.md> — truy cập 2026-11-17
14. <a id="ref-14"></a>OWASP ASVS 5.0, V3 Web Frontend Security. <https://raw.githubusercontent.com/OWASP/ASVS/master/5.0/en/0x12-V3-Web-Frontend-Security.md> — truy cập 2026-11-17
15. <a id="ref-15"></a>[Test Scopes](../../../README.md) — commit `25a2e24`, 2026-11-17
16. <a id="ref-16"></a>[Phase 03: Test Analysis & Design](../README.md)
