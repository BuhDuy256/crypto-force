# Test Plan

Đọc file này để biết đợt kiểm thử Authentication nhằm mục tiêu gì, phạm vi đến đâu, dựa trên giả định và ràng buộc nào, ai tham gia, giao tiếp thế nào, và kế hoạch đã được duyệt hay chưa.

## 1. Thông tin kế hoạch

| Trường | Nội dung |
| --- | --- |
| Plan ID / version / trạng thái | TS-001 Test Plan; 1.1; Approved |
| Feature / release / iteration | Authentication tại code commit `b4ca981`; chưa gắn với release hay iteration |
| Người lập / người review | Người lập: agent. Người review: product owner |
| File chi tiết | [Risk Register](02-risk-register.md), [Test Approach](03-test-approach.md), [Entry & Exit Criteria](04-entry-exit-criteria.md), [Estimates & Schedule](05-estimates-and-schedule.md) |

| Version | Ngày | Thay đổi | Người cập nhật | Người duyệt |
| --- | --- | --- | --- | --- |
| 0.1 | 2026-11-17 | Bản đầu tiên | Agent | — |
| 1.0 | 2026-11-17 | Product owner xác nhận AS-01 đến AS-03 và Google OAuth client cho localhost; duyệt các giá trị do người lập plan đề xuất; PR-21 được chấp nhận | Agent | Product owner |
| 1.1 | 2026-11-17 | SC-17 chuyển sang In: kiểm email thật qua Resend bằng một bước thủ công. E2E không gọi Resend thật (PJ-09). PJ-08 sửa theo lockfile. AS-03 tăng lên 8,3 ± 0,9 giờ | Agent | Product owner |

## 2. Mục tiêu

| Objective ID | Mục tiêu kiểm thử | Rủi ro liên quan | Exit criteria liên quan |
| --- | --- | --- | --- |
| OBJ-01 | Xác minh hành vi chức năng của Sign in, Continue with Google, Create account và Verify email, Reset password, chuyển tiếp, phiên và Sign out đúng với requirement Ready | PR-03, PR-06, PR-07, PR-08, PR-10, PR-11, PR-12 | EX-01, EX-02, EX-03, EX-07 |
| OBJ-02 | Xác minh các yêu cầu bảo mật: giới hạn số lần, phiên, cookie, origin, header, password, liên kết Google, theo OWASP ASVS 5.0 ở mức ADR-002 | PR-01 đến PR-09, PR-15 | EX-01, EX-02, EX-03, EX-04, EX-07 |
| OBJ-03 | Xác minh 6 màn hình Auth dùng được bằng bàn phím và không có vi phạm accessibility `serious` hoặc `critical` | PR-13 | EX-01, EX-05 |
| OBJ-04 | Xác nhận 9 khác biệt giữa requirement và implementation đã được sửa, hoặc được product owner chấp nhận là rủi ro còn lại | PR-01, PR-03, PR-05, PR-06, PR-07, PR-08, PR-09, PR-11 | EX-06 |
| OBJ-05 | Cung cấp bằng chứng và danh sách rủi ro còn lại để product owner quyết định | PR-01 đến PR-21 | EX-03, EX-08, EX-09 |

## 3. Phạm vi

| Scope ID | Hành vi / thành phần / test type / cấu hình | In / Out | Test basis item / version | Căn cứ |
| --- | --- | --- | --- | --- |
| SC-01 | Quy tắc dùng chung và Sign in | In | CM-01 đến CM-03, SI-01 đến SI-12; `705a1ad` | Ready [[1]](#ref-1) |
| SC-02 | Continue with Google | In | GO-01 đến GO-10; `705a1ad` | Ready [[1]](#ref-1) |
| SC-03 | Create account và Verify email | In | CA-01 đến CA-17; `705a1ad` | Ready [[1]](#ref-1) |
| SC-04 | Reset password | In | RP-01 đến RP-08; `705a1ad` | Ready [[1]](#ref-1) |
| SC-05 | Chuyển tiếp sau khi đăng nhập | In | RD-01, RD-02, RD-04 đến RD-08; `705a1ad` | Ready [[1]](#ref-1) |
| SC-06 | Phiên và Sign out | In | SS-01 đến SS-08; `bd0ecff`, `705a1ad` | Ready [[1]](#ref-1) |
| SC-07 | Cấu hình bảo mật: cookie, origin, rate limit, email, header | In | SEC-01 đến SEC-04, SEC-06 đến SEC-09; `705a1ad` | Ready [[1]](#ref-1) |
| SC-08 | Mục ASVS L1 không có hành vi trong spec | In | ASVS-6.2.7, ASVS-6.3.2, ASVS-7.2.2, ASVS-7.2.3, ASVS-7.2.4, ASVS-3.4.2; `705a1ad` | Ready [[1]](#ref-1) |
| SC-09 | Accessibility của 6 màn hình Auth | In | A11Y-01, A11Y-02, CA-11; `dbbaafe`, `705a1ad` | Ready [[1]](#ref-1) |
| SC-10 | Chuyển tiếp từ Backtest this idea | Out | RD-03; `705a1ad` | Strategy Engine chưa được build; product owner quyết định ngày 2026-11-17 [[1]](#ref-1). Rủi ro: PR-18 |
| SC-11 | Ràng buộc deploy cho `X-Forwarded-For` | Out | SEC-05; `705a1ad` | Chỉ kiểm được trên môi trường deploy có reverse proxy [[1]](#ref-1). Rủi ro: PR-16 |
| SC-12 | Điều kiện trước khi deploy public | Out | SEC-10; `705a1ad` | Security ghi là điều kiện trước khi deploy public [[1]](#ref-1). Rủi ro: PR-17 |
| SC-13 | Rủi ro chấp nhận của ADR-002 | Out | ADR-002; `705a1ad` | Product owner đã chấp nhận trong ADR-002 [[2]](#ref-2). Rủi ro: PR-19 |
| SC-14 | UI của App header, menu tài khoản, drawer, hộp thoại khi Sign out | Out | Workspace; `bd0ecff` | Thuộc test scope workspace [[3]](#ref-3). Rủi ro: PR-20 |
| SC-15 | Trình duyệt ngoài Chromium | Out | — | Test basis không nêu trình duyệt được hỗ trợ; product owner duyệt ngày 2026-11-17. Rủi ro: PR-21 |
| SC-16 | Performance, maintainability, portability, safety | Out | — | Không có requirement trong test basis ([Test Approach](03-test-approach.md) mục 1.1) |
| SC-17 | Gửi email thật qua Resend tới hộp thư của chủ tài khoản Resend: email của Create account và Reset password tới hộp thư, link trong email mở được | In | CA-03, CA-05, RP-01, RP-04; `705a1ad` | `.env` local có `RESEND_API_KEY` và `EMAIL_FROM`; `apps/api/src/services/mailer.ts` gửi qua Resend khi có key. Kiểm thủ công một lần; product owner duyệt ngày 2026-11-17 ([Test Approach](03-test-approach.md) mục 1.2) |
| SC-18 | Code coverage (white-box) | Out | — | Đề xuất của người lập plan; product owner duyệt ngày 2026-11-17 ([Test Approach](03-test-approach.md) mục 1.2) |

Hạng mục Out of scope ghi lý do, và rủi ro của việc không test nằm ở [Risk Register](02-risk-register.md).

## 4. Giả định và ràng buộc

| ID | Loại | Nội dung | Nguồn | Ảnh hưởng nếu sai hoặc thay đổi |
| --- | --- | --- | --- | --- |
| AS-01 | Ràng buộc | Product owner là người duyệt plan, người duyệt exit criteria và risk owner | Product owner xác nhận ngày 2026-11-17 | Mục 5, mục 7; xử lý của PR-16, PR-17, PR-20, PR-21 |
| AS-02 | Ràng buộc | Đợt kiểm thử không có hạn thời gian; lịch chỉ có thứ tự và phụ thuộc | Product owner xác nhận ngày 2026-11-17 | Lịch ở Estimates & Schedule mục 3; nếu có hạn, phải chọn lại phạm vi theo mức rủi ro |
| AS-03 | Ràng buộc | Product owner có khoảng 8,3 ± 0,9 giờ cho review, session Google và Resend thật, và quyết định | Product owner xác nhận ngày 2026-11-17, theo Estimates & Schedule mục 1 | Lịch của M-01, M-03, M-06, M-09 |
| AS-04 | Giả định | Code của Authentication là commit `b4ca981`; `apps/` và `packages/` không đổi tới `393e2b8` | `git log b4ca981..393e2b8 -- apps packages` không có commit | Requirement Readiness mục 4 và PR-01 đến PR-09 phải xem lại khi code đổi; EN-03 ghi commit của từng lần chạy |
| AS-05 | Giả định | Better Auth cho phép cấu hình OAuth provider giả và stub Pwned Passwords mà không sửa code sản phẩm | Người lập plan giả định | Estimate Phase 04 tăng; có thể cần thay đổi code để test được |
| AS-06 | Ràng buộc | Test tự động không gọi Google, Resend hay Pwned Passwords thật. E2E chạy với `RESEND_API_KEY` để trống, nên mailer in email ra console | Test Strategy, Mock bên ngoài [[4]](#ref-4) | Test Approach mục 1.2 |
| AS-07 | Ràng buộc | Chỉ có môi trường local chạy bằng Docker Compose; không có môi trường deploy | Project: Crypto Force [[5]](#ref-5); SEC-05 Ngoài phạm vi [[1]](#ref-1) | SC-11, SC-12 |
| AS-08 | Ràng buộc | Công cụ đã chốt là `Vitest` và `Playwright`; dependency mới cần product owner duyệt | Test Strategy, Công cụ [[4]](#ref-4); Project: Crypto Force, Safety Rules [[5]](#ref-5) | PJ-05; EN-06 |

## 5. Stakeholder

| Vai trò | Người | Trách nhiệm trong testing | Duyệt hoặc quyết định gì |
| --- | --- | --- | --- |
| Product owner | Product owner | Giữ requirement; review test case; chạy session Google và Resend thật | Plan, exit criteria, chấp nhận rủi ro, suspension và resumption (AS-01) |
| Người lập plan, thiết kế và chạy test | Agent | Phase 02 đến 06; báo cáo defect và trạng thái | Không quyết định; đề xuất cho product owner |
| Developer | Chưa xác định | Sửa khác biệt đã biết và defect | Không quyết định trong testing |

## 6. Giao tiếp

| Thông tin | Hình thức | Tần suất | Người nhận | Template hoặc nơi lưu |
| --- | --- | --- | --- | --- |
| Trạng thái từng phase | Bảng trạng thái phase trong README của TS-001 | Khi một phase đổi trạng thái | Product owner | [README](../../README.md) |
| Tiến độ chạy test và metrics | Execution status | Mỗi lần chạy test | Product owner | `05-execution/output/01-execution-status.md` |
| Defect | Defect report | Khi phát hiện | Product owner, developer | `05-execution/output/03-defect-reports.md` |
| Suspension, blocker, quyết định cần product owner | Tin nhắn trong phiên làm việc | Ngay khi xảy ra | Product owner | Ghi lại vào file của phase liên quan |
| Kết quả đợt kiểm thử | Test Summary Report | Một lần, cuối đợt | Product owner | `06-report/output/01-test-summary-report.md` |

## 7. Phê duyệt

| Vai trò | Người | Quyết định | Ngày | Plan version | Điều kiện |
| --- | --- | --- | --- | --- | --- |
| Product owner | Product owner | Duyệt | 2026-11-17 | 1.0 | Không có |
| Product owner | Product owner | Duyệt | 2026-11-17 | 1.1 | Không có |

Sau khi duyệt, mọi thay đổi về phạm vi, approach, criteria hoặc lịch được ghi thành version mới ở mục 1.

## 8. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q1-01 | Phạm vi liệt kê từng hạng mục In và Out, kèm test basis item có version | RC-01 | Đạt |
| Q1-02 | Mỗi mục tiêu dẫn tới ít nhất một rủi ro và một exit criterion | — | Đạt |
| Q1-03 | Giả định và ràng buộc được tách riêng; mỗi dòng có nguồn hoặc ghi rõ là giả định của người lập plan | RC-03 | Đạt |
| Q1-04 | Người duyệt plan, người duyệt exit criteria và risk owner được ghi tên | RC-02 | Đạt |
| Q1-05 | Cách giao tiếp ghi rõ hình thức, tần suất và người nhận cho từng loại thông tin | IN-04 | Đạt |
| Q1-06 | Các file 02–05 đạt tiêu chí của chúng, hoặc phần chưa đạt được ghi là giả định ở mục 4 | — | Đạt |
| Q1-07 | Plan đã được duyệt với version cụ thể trước khi bắt đầu thiết kế test | RC-02 | Đạt: version 1.1 |

**Người review / ngày:** Product owner, 2026-11-17

## References

1. <a id="ref-1"></a>[Requirement Readiness](../../01-requirement-analysis/output/01-requirement-readiness.md) — commit `da6b261`, 2026-11-17
2. <a id="ref-2"></a>[Architectural Decisions](../../../../../architecture/30-decisions.md) — commit `705a1ad`, 2026-11-17
3. <a id="ref-3"></a>[Workspace](../../../../../design/prototype/docs/requirements/workspace.md) — commit `bd0ecff`, 2026-11-16
4. <a id="ref-4"></a>[Test Strategy](../../../../test-strategy.md) — commit `705a1ad`, 2026-11-17
5. <a id="ref-5"></a>[Project: Crypto Force](../../../../../../CLAUDE.md) — commit `bf86629`, 2026-11-16
