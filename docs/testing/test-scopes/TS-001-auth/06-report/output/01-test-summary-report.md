# Test Summary Report

Đọc file này để biết kết luận về chất lượng của luồng Authentication sau vòng 1 của TS-001, mức đáp ứng exit criteria và recommendation cho bước tiếp theo.

## 1. Thông tin báo cáo

| Trường | Nội dung |
| --- | --- |
| Report ID / version / trạng thái | TSR-TS-001; 1.0; Draft |
| Feature / release | Authentication (TS-001); chưa gắn với release |
| Test cycle / test level | Vòng 1 (mốc M-06); Component, Component integration, System, System integration, review |
| Đối tượng được đánh giá | Commit `7cdb0f5`, `better-auth@1.7.25`; RUN-001 đến RUN-009 trên working tree của product owner, HEAD giả định là `b35a791` (input IN-06). Không có thay đổi code sản phẩm tới `ce5e35c` (input IN-01) |
| Thời gian kiểm thử | 2026-11-17 10:55 – 2026-11-19 08:55 (UTC+7); thực thi 2026-11-19 07:15:45 – 08:55 |
| Thời điểm chốt dữ liệu | 2026-11-19 08:25 (UTC+7), lần chốt 1 của Execution Status |
| Người lập / người review | Agent / chưa có |
| Người quyết định bước tiếp theo | Product owner |
| Phân phối | Chưa gửi |
| File chi tiết | [Execution & Coverage](02-execution-and-coverage.md), [Defects](03-defects.md), [Residual Risks](04-residual-risks.md), [Lessons Learned](05-lessons-learned.md), [Closure & Handover](06-closure-and-handover.md) |

| Version | Ngày | Thay đổi | Người cập nhật |
| --- | --- | --- | --- |
| 1.0 | 2026-11-19 | Bản đầu, dữ liệu vòng 1 | Agent |

Kết quả phát sinh sau thời điểm chốt được đưa vào version mới của báo cáo, kèm đánh giá lại các kết luận bị ảnh hưởng.

## 2. Executive Summary

> Trong 2026-11-17 – 2026-11-19, nhóm đã kiểm thử luồng Authentication (SC-01 đến SC-09, SC-17) trên `7cdb0f5` để trả lời câu hỏi: luồng có đạt exit criteria của TS-001 không. Tại thời điểm chốt, 282/351 test instance pass, 69 fail và 0 chưa có kết luận; theo test case, 122/166 pass. 421/427 coverage item có test đã chạy, nhưng chỉ 276/427 item có mọi test pass. Còn 19 defect Open, cao nhất ở mức Major (7 defect), và 14 rủi ro cần product owner quyết định. 4 exploratory session chưa chạy. Exit criteria: Không đạt (7/9 tiêu chí Không đạt; EX-09 Không đạt vì chưa có quyết định về rủi ro). Recommendation: Chưa chuyển; không đóng TS-001, sửa defect rồi chạy vòng 2. Kết luận chỉ áp dụng cho `7cdb0f5` trên môi trường local, Chromium, với Google và Resend thật chỉ ở PROC-17.

| Nội dung | Kết quả | Chi tiết |
| --- | --- | --- |
| Exit criteria | Không đạt | [Mục 5](#5-exit-criteria) |
| Coverage của hành vi trọng yếu | 81/81 requirement có test đã chạy, 57/81 có mọi test pass. Coverage item theo model: [Execution & Coverage, mục 4.2](02-execution-and-coverage.md#42-coverage-theo-chiều) | [Execution & Coverage, mục 4](02-execution-and-coverage.md#4-coverage) |
| Defect quan trọng còn lại | DEF-01, DEF-02, DEF-03, DEF-05, DEF-06, DEF-09, DEF-18 (Major) | [Defects, mục 4](03-defects.md#4-defect-quan-trọng) |
| Rủi ro cần quyết định | R-01 đến R-14 | [Residual Risks, mục 3](04-residual-risks.md#3-quyết-định-xử-lý) |
| Recommendation | Chưa chuyển | [Mục 7](#7-recommendation-và-sign-off) |
| Quyết định | Chưa quyết định | [Mục 7.2](#72-sign-off) |
| Lessons learned | ACT-03: test cho GO-06 kiểm `prompt=select_account`, không dựa vào số phiên Google của trình duyệt | [Lessons Learned](05-lessons-learned.md) |
| Closure | Chưa bắt đầu | [Closure & Handover](06-closure-and-handover.md) |

## 3. Mục tiêu, test basis và phạm vi

### 3.1. Mục tiêu

Mục tiêu lấy từ Test Plan mục 2 [[1]](#ref-1).

| Objective ID | Câu hỏi cần kiểm chứng | Exit criteria liên quan |
| --- | --- | --- |
| OBJ-01 | Hành vi chức năng của Sign in, Google, Create account và Verify email, Reset password, chuyển tiếp, phiên và Sign out đúng với requirement | EX-01, EX-02, EX-03, EX-07 |
| OBJ-02 | Yêu cầu bảo mật theo OWASP ASVS 5.0 ở mức ADR-002 | EX-01 đến EX-04, EX-07 |
| OBJ-03 | 6 màn hình Auth dùng được bằng bàn phím, không có vi phạm accessibility `serious` hoặc `critical` | EX-01, EX-05 |
| OBJ-04 | 9 khác biệt giữa requirement và implementation đã sửa hoặc được chấp nhận | EX-06 |
| OBJ-05 | Bằng chứng và danh sách rủi ro còn lại cho product owner | EX-03, EX-08, EX-09 |

### 3.2. Test basis

| Basis ID | Tài liệu | Version | Phần áp dụng | Trạng thái xác nhận |
| --- | --- | --- | --- | --- |
| BS-01 | Authentication [[2]](#ref-2) | `c23d848` | CM, SI, GO, CA, RP, RD | Product owner duyệt 81 requirement Ready ở Phase 01 và 17 quyết định BD ngày 2026-11-17 |
| BS-02 | Security [[3]](#ref-3) | `c23d848` | SEC-01 đến SEC-09, SS-05, SS-08 | Như BS-01; product owner chọn `c23d848` cho TC-200 (TD-22) |
| BS-03 | Workspace [[4]](#ref-4) | `bd0ecff` | SS-01 đến SS-04 | Như BS-01 |
| BS-04 | ADR-002 [[5]](#ref-5) | `705a1ad` | ASVS 5.0 ở mức đã chọn; rủi ro chấp nhận | Như BS-01 |
| BS-05 | Crypto Force UI Prototype [[6]](#ref-6) | `dbbaafe` | Quy ước lỗi form (A11Y-01) | Như BS-01 |

Không có requirement ở trạng thái giả định.

### 3.3. Phạm vi

| Scope ID | Hành vi / thành phần / test type / cấu hình | In / Out | Căn cứ |
| --- | --- | --- | --- |
| SC-01 đến SC-09 | Quy tắc chung và Sign in; Google; Create account và Verify email; Reset password; chuyển tiếp; phiên và Sign out; cấu hình bảo mật; mục ASVS L1 không có hành vi trong spec; accessibility | In | [[1]](#ref-1) mục 3 |
| SC-17 | Google OAuth và Resend thật tới hộp thư của chủ tài khoản Resend | In | [[1]](#ref-1) mục 3 |
| SC-10 đến SC-16, SC-18 | Backtest this idea; ràng buộc deploy `X-Forwarded-For`; điều kiện deploy public; rủi ro chấp nhận ADR-002; UI workspace; trình duyệt ngoài Chromium; performance và các thuộc tính khác; code coverage | Out | [[1]](#ref-1) mục 3 |

Out of scope là quyết định về phạm vi. Hạng mục in scope nhưng chưa test vẫn thuộc phạm vi và được ghi ở [coverage gaps](02-execution-and-coverage.md#5-coverage-gaps).

### 3.4. Thay đổi phạm vi so với kế hoạch

| Change ID | Thay đổi | Lý do | Ảnh hưởng tới mẫu số coverage | Người xác nhận, ngày |
| --- | --- | --- | --- | --- |
| CH-01 | CHR-01 đến CHR-04 hoãn vô thời hạn | Quyết định của product owner (TD-20) | Không đổi N; session vẫn thuộc EX-07 và là GAP-04 | Product owner, 2026-11-19 |

## 4. Cách kiểm thử và môi trường

### 4.1. Hoạt động kiểm thử

| Test level / type | Phạm vi | Manual / Automated | Nguồn kết quả | Giới hạn |
| --- | --- | --- | --- | --- |
| Component (`packages/shared`, `apps/web`) và Component integration (`apps/api`), functional và security | SC-01 đến SC-08 | Automated, Vitest (`pnpm test`) | RUN-012 [[7]](#ref-7) | Đồng hồ điều khiển được; Better Auth gọi trực tiếp, không qua mạng |
| System, functional, security và accessibility | SC-01 đến SC-09 | Automated, Playwright (`pnpm test:e2e`, `--workers=2`) | RUN-013 [[7]](#ref-7) | Chỉ Chromium; OAuth provider giả; email in ra console; báo cáo HTML và JSON bị ghi đè (DV-08) |
| System integration với Google và Resend thật | SC-02, SC-17 | Manual (PROC-17, product owner) | RUN-001 đến RUN-009 [[7]](#ref-7) | Working tree chưa kiểm; evidence của TC-197, TC-198 yếu (GAP-06) |
| Review tài liệu và UI | SC-08 | Manual (agent, product owner duyệt) | RUN-014, RUN-016 [[7]](#ref-7) | TC-200 đúng cho Security `c23d848` |
| Exploratory | SC-01 đến SC-07 | Manual | Không có | 0/4 session (GAP-04) |

### 4.2. Môi trường và dữ liệu

| Env ID | Build và thành phần | Dữ liệu hoặc workload | Khác biệt so với môi trường đích | Ảnh hưởng tới kết luận |
| --- | --- | --- | --- | --- |
| ENV-01 | `7cdb0f5`; PostgreSQL của `pnpm db:up`, database `_test` tạo lại từ migration; mailer ghi vào bộ nhớ; stub Pwned Passwords | Tài khoản tạo trong từng test | Không có reverse proxy, không HTTPS, không Resend | Kết luận không áp dụng cho HSTS, `X-Forwarded-For` sau proxy (GAP-01, GAP-02) |
| ENV-02, ENV-07 | `7cdb0f5`; hai server E2E, database `_e2e`; OAuth provider giả; `RESEND_API_KEY` trống | Tài khoản tạo trong từng test | Như ENV-01; Google và Resend được thay bằng stub | Hành vi với Google và Resend thật chỉ có bằng chứng từ PROC-17 |
| ENV-09 | `b35a791` working tree; `pnpm dev` của product owner với `.env` gốc; Google và Resend thật | Tài khoản Google test #1, #2; hộp thư chủ tài khoản Resend | Localhost, không phải domain thật | Kết luận về SC-17 và GO-06: Chưa đủ bằng chứng (IN-06, GAP-05) |

Chi tiết môi trường ở Test Environment [[8]](#ref-8).

### 4.3. Sai lệch về lịch và effort

| Hạng mục | Kế hoạch | Thực tế | Chênh lệch | Nguyên nhân | Ảnh hưởng tới kết luận |
| --- | --- | --- | --- | --- | --- |
| Thời gian bắt đầu – kết thúc | Không có ngày; mốc M-01 đến M-09 theo thứ tự | 2026-11-17 – 2026-11-19 cho Phase 01 đến vòng 1 | Không tính được | Lịch không có ngày (Estimates & Schedule mục 3) | Không có |
| Thứ tự mốc | M-09 (Phase 06) sau M-07 (sửa) và M-08 (vòng 2) | Phase 06 lập sau M-06, trước M-07 | M-07, M-08 chưa làm | Product owner cần danh sách defect và rủi ro để quyết định vòng sửa | Báo cáo này là báo cáo của vòng 1; version sau cập nhật sau vòng 2 |
| Effort | Agent 43,3 ± 4,0 giờ; product owner 8,3 ± 0,9 giờ | Chưa có | Không tính được | Không ghi effort thực tế (PJ-07, input IN-13) | Không có; ACT-04 |

Nguồn số liệu kế hoạch: [[9]](#ref-9).

### 4.4. Trở ngại khi thực hiện

| ID | Trở ngại hoặc sai lệch so với cách thực hiện dự kiến | Ảnh hưởng | Cách xử lý | Risk ID |
| --- | --- | --- | --- | --- |
| DV-01, DV-02 | PROC-17: địa chỉ TC-197 không có `+tag`; không có tab `accounts.google.com` riêng | Evidence của TC-196, TC-197 yếu | Ghi ở Test Log mục 2.3 | R-14 |
| DV-03 | TC-200 ghi Security `d6c0541`, review dùng `c23d848` | TC-200 đúng cho `c23d848` | Product owner chọn `c23d848` (TD-22) | Không có |
| DV-04 | RUN-015 kiểm UI bằng source | RUN-015 không dùng được | RUN-016 mở giao diện và thay kết quả | Không có |
| DV-05 | Ghi kết quả theo suite, không theo ID instance | Số 351 không đối chiếu được với inventory | TD-24 | R-14 |
| DV-06 | `--workers=2` cho SU-13 vì máy thiếu bộ nhớ | Không thấy ảnh hưởng tới kết quả | Không có | Không có |
| DV-07 | Execution Readiness lập sau lượt chạy đầu; kết luận Chưa sẵn sàng | Điều kiện vào không chặn RUN-001 đến RUN-009 | ACT-05 | R-14 |
| DV-08 | `playwright test --list` ghi đè báo cáo của RUN-013 | EV-013 chỉ còn output console và ảnh chụp | TD-28 sửa config | Không có |

## 5. Exit criteria

Nguồn exit criteria: Entry & Exit Criteria [[10]](#ref-10), version 1.1, product owner duyệt 2026-11-17.

| Criterion ID | Tiêu chí, ngưỡng và mẫu số | Kết quả thực tế | Đánh giá | Evidence | Ngoại lệ đã được quyết định |
| --- | --- | --- | --- | --- | --- |
| EX-01 | 81/81 requirement Ready có ít nhất một test case đã chạy | 81/81 có test case với kết quả Passed hoặc Failed. 57/81 có mọi test case Passed | Đạt | [Execution & Coverage, mục 4.2](02-execution-and-coverage.md#42-coverage-theo-chiều); Design Status mục 2 | Không có |
| EX-02 | 100% coverage item của criterion ở Test Approach mục 2, cho mỗi rủi ro Cao và Trung bình | Item có mọi test pass: 276/427. Chỉ MD-10, MD-12, MD-18 đạt 100%. Item không có test: 6 (GAP-01, GAP-02, 3 rủi ro chấp nhận của MD-16) | Không đạt | [Execution & Coverage, mục 4.2](02-execution-and-coverage.md#42-coverage-theo-chiều) | MD-14-CI-33: product owner quyết định không test, kiểm khi deploy (TD-02). MD-16-CI-08: control SEC-05 ngoài phạm vi (SC-11). MD-16-CI-29: không test, product owner quyết định 2026-11-17; TD-06 vẫn mở. MD-16-CI-02, CI-15, CI-25: rủi ro chấp nhận của ADR-002 |
| EX-03 | 0 defect Critical, 0 defect Major đang mở; Minor và Trivial có trong danh sách rủi ro | 0 Critical; 7 Major Open; 12 Minor và Trivial có trong R-06 đến R-11 | Không đạt | [Defects, mục 3](03-defects.md#3-defect-chưa-giải-quyết-theo-severity) | Không có |
| EX-04 | 100% mục ASVS áp dụng có test đã chạy và pass, hoặc là rủi ro chấp nhận của ADR-002 | 28/40 mục pass; trong đó 7.4.4 (MD-14-CI-28) chỉ được phủ phần Sign out từ một màn hình, phần còn lại không test (TD-03). Failed: 6.2.1, 6.2.4, 6.2.9, 6.2.12, 6.3.1, 6.4.1, 7.2.4, 7.3.2, 3.4.4, 3.4.5, 3.4.6. Không có test: 3.4.1 | Không đạt | [Execution & Coverage, mục 4.2](02-execution-and-coverage.md#42-coverage-theo-chiều), dòng MD-14 | 3.4.1: product owner quyết định kiểm khi deploy (TD-02) |
| EX-05 | 0 vi phạm `serious` hoặc `critical` trên 6/6 màn hình Auth, kể cả trạng thái lỗi | Quét axe: 0 vi phạm trên 6/6 màn hình mặc định và 4/4 trạng thái lỗi (MD-17-CI-20 đến CI-29; TC-244, TC-245 Passed) | Đạt | RUN-013; [Execution & Coverage, mục 4.2](02-execution-and-coverage.md#42-coverage-theo-chiều), dòng MD-17 | Không có. DEF-11 (A11Y-01) không thuộc ngưỡng này; nó nằm ở EX-02 và EX-03 |
| EX-06 | 9/9 khác biệt ở Requirement Readiness mục 4 đã sửa và confirmation test pass, hoặc được chấp nhận | 0/9 đã sửa có confirmation test. 8/9 có test Failed: SI-06 (DEF-01), GO-03 (DEF-19), CA-13 và CM-02 (DEF-07, DEF-08), CA-14 (DEF-06), RP-08 (DEF-16), SEC-08 (DEF-17), SS-05 (DEF-03), SS-06 (DEF-09). GO-06: test Passed, nhưng code chưa đổi (GAP-05). 0/9 được chấp nhận | Không đạt | [Defects, mục 4](03-defects.md#4-defect-quan-trọng); [Execution & Coverage, mục 5](02-execution-and-coverage.md#5-coverage-gaps) | Không có |
| EX-07 | 4/4 exploratory session có debrief; session Google và Resend thật đã chạy, hoặc PJ-04 được chấp nhận | 0/4 session. Session Google và Resend thật đã chạy (RUN-001 đến RUN-009) | Không đạt | Execution Status mục 2.3 | Product owner hoãn session vô thời hạn, 2026-11-19 (TD-20). Đây là hoãn, không phải chấp nhận rủi ro |
| EX-08 | `pnpm test` và `pnpm test:e2e` chạy đầy đủ trên commit cuối và pass, trừ test của defect đã được chấp nhận | Chạy đầy đủ trên `7cdb0f5` (RUN-012, RUN-013): 68 test của TS-001 Failed. Không có defect nào được chấp nhận. `ce5e35c` không đổi code sản phẩm, nhưng đổi `apps/web/playwright.config.ts` (TD-28, chỉ reporter khi `--list`) | Không đạt | RUN-012, RUN-013; EV-012, EV-013 | Không có |
| EX-09 | Product owner đã xem và chấp nhận danh sách rủi ro còn lại | R-01 đến R-14: Chưa quyết định | Không đạt | [Residual Risks, mục 3](04-residual-risks.md#3-quyết-định-xử-lý) | Không có |

**Kết luận:** Không đạt

Kết luận chỉ là Đạt khi mọi tiêu chí bắt buộc đạt. Tiêu chí được miễn bằng một quyết định ngoại lệ vẫn giữ đánh giá Không đạt, và cột Ngoại lệ dẫn tới quyết định đó.

## 6. Nhận định chất lượng

| Hành vi / thuộc tính chất lượng | Kết luận | Căn cứ | Giới hạn |
| --- | --- | --- | --- |
| Giới hạn số lần Sign in (PR-01) | Không đáp ứng | EX-03; DEF-01 | `7cdb0f5`; một IP mỗi test |
| Vòng đời phiên và Sign out (PR-03) | Không đáp ứng | DEF-02, DEF-03, DEF-04. MD-10 (màn chặn, Sign out) đáp ứng | Đồng hồ điều khiển được; chưa có exploratory (GAP-04) |
| Link reset và link xác minh (PR-06, PR-07) | Không đáp ứng | DEF-05, DEF-09, DEF-10, DEF-18 | Như trên |
| Quy tắc password (PR-09) | Không đáp ứng | DEF-06, DEF-07, DEF-08 | Pwned Passwords dùng stub |
| Kết quả Sign in theo tài khoản; chống lộ email đã đăng ký (PR-02) | Đáp ứng | MD-12 6/6 item pass; TC-185, TC-192, TC-223, TC-229 Passed | `7cdb0f5`; response so theo quy tắc "Response giống nhau" của Test Cases |
| Chuyển tiếp và tham số `next` (PR-04, PR-11) | Đáp ứng một phần: `next` ngoài app bị thay (MD-18 7/7); DEF-16 sai đích sau Reset password | MD-18; DEF-16 | Chưa có exploratory CHR-04 |
| Continue with Google (PR-08) | Chưa đủ bằng chứng | DEF-19 (input IN-06); GAP-05 | Provider giả trong test tự động; Google thật chỉ ở PROC-17 |
| Cookie, origin và header bảo mật (PR-05) | Không đáp ứng | DEF-17, DEF-18; TC-220 Passed | Không có HTTPS và reverse proxy (GAP-01) |
| Accessibility (PR-13) | Đáp ứng ngưỡng axe (EX-05); không đáp ứng A11Y-01 ở 2 màn hình | EX-05; DEF-11 | Chỉ Chromium; không kiểm bằng screen reader thật |
| Gửi email thật qua Resend (PR-14, SC-17) | Chưa đủ bằng chứng | TC-197, TC-198 (GAP-06, input IN-06) | Evidence là database và lời product owner |

## 7. Recommendation và sign-off

### 7.1. Recommendation

**Recommendation:** Chưa chuyển

**Bước tiếp theo:** không đóng TS-001. Chuyển sang M-07 (sửa defect và khác biệt đã biết), rồi M-08 (vòng 2: confirmation test và regression cuối), rồi phát hành version 2 của báo cáo này.

**Căn cứ:** EX-02, EX-03, EX-04, EX-06, EX-07, EX-08, EX-09 Không đạt; 7 defect Major Open (DEF-01, DEF-02, DEF-03, DEF-05, DEF-06, DEF-09, DEF-18), 6 trong số đó là lỗi bảo mật thuộc ASVS hoặc khác biệt đã biết; R-01 đến R-05 có ảnh hưởng Cao hoặc Trung bình và không có biện pháp đủ thay thế.

Recommendation này không vượt phạm vi bằng chứng: nó dựa trên kết quả Failed của `7cdb0f5`, không dựa vào 5 kết quả của RUN-001 đến RUN-009 (input IN-06). Nó không phải quyết định release: TS-001 chưa gắn với release nào.

| Điều kiện ID | Việc phải hoàn tất | Owner | Hạn | Cách xác nhận | Trạng thái |
| --- | --- | --- | --- | --- | --- |
| CD-01 | Giao developer và hạn sửa cho DEF-01 đến DEF-19 (PJ-01) | Product owner | Chưa có | Defect Reports có owner và hạn cho mỗi defect | Chưa làm |
| CD-02 | Chạy confirmation test cho từng bản sửa và regression `pnpm test`, `pnpm test:e2e` trên commit cuối | Agent | Sau CD-01 | Defect Reports mục 4 có Run ID; EX-08 Đạt | Chưa làm |
| CD-03 | Quyết định cho GO-06: thêm test `prompt=select_account` (ACT-03) và chạy lại PROC-17 có log hoặc video | Agent (test); product owner (PROC-17) | Vòng 2 | GAP-05, GAP-06 đóng | Chưa làm |
| CD-04 | Quyết định cho exploratory: chạy CHR-01 đến CHR-04, hoặc chấp nhận R-12 | Product owner | Trước khi đóng TS-001 | EX-07 có kết quả hoặc R-12 có quyết định | Chưa làm |
| CD-05 | Quyết định cho R-01 đến R-14 | Product owner | Sau vòng 2 | Residual Risks mục 3 có người, ngày và link | Chưa làm |

### 7.2. Sign-off

| Vai trò | Xác nhận điều gì | Người | Quyết định | Ngày | Report version |
| --- | --- | --- | --- | --- | --- |
| Người lập | Số liệu và giới hạn dữ liệu chính xác | Agent | Xác nhận | 2026-11-19 | 1.0 |
| Người review | Báo cáo đủ căn cứ cho các kết luận | Chưa có | Chưa quyết định | | |
| Risk owner | Chấp nhận các rủi ro R-01 đến R-14 | Product owner | Chưa quyết định | | |
| Người quyết định | Quyết định bước tiếp theo | Product owner | Chưa quyết định | | |

Ô chưa có quyết định ghi "Chưa quyết định". Review báo cáo xác nhận báo cáo đáng tin cậy, không phải chấp thuận chuyển bước.

## 8. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q1-01 | Đối tượng, phạm vi và thời điểm chốt được ghi rõ và khớp với các file 02–06 | RC-01 | Đạt |
| Q1-02 | Test basis có version và trạng thái xác nhận; requirement ở trạng thái giả định được nêu rõ | IN-02, RC-03 | Đạt một phần: RC-03 đạt một phần, vì test case dẫn tới Authentication `705a1ad` và Security `d6c0541`, còn báo cáo dùng `c23d848` |
| Q1-03 | Exit criteria có nguồn, ngưỡng và mẫu số; tiêu chí được miễn không bị ghi thành Đạt | RC-04 | Đạt |
| Q1-04 | Mọi kết luận "Chưa đủ bằng chứng" dẫn tới ID của dòng IN, RC hoặc Gap | — | Đạt |
| Q1-05 | Số liệu trong Executive Summary khớp với mục 5–7 và các file 02–04 | RC-05 | Đạt một phần: số khớp; RC-05 đạt một phần vì T không đối chiếu được với inventory (TD-24) |
| Q1-06 | Recommendation không vượt phạm vi bằng chứng; mỗi điều kiện có owner, hạn và cách xác nhận | — | Đạt một phần: CD-01 chưa có hạn, vì dự án chưa có developer và lịch sửa (PJ-01) |
| Q1-07 | Review báo cáo, chấp nhận rủi ro và quyết định bước tiếp theo được ghi tách biệt, do đúng người có thẩm quyền | IN-10 | Đạt |
| Q1-08 | Các file 02–04 đạt tiêu chí của chúng, hoặc phần chưa đạt đã được ghi thành giới hạn ở mục 6 và 7 | — | Đạt: phần đạt một phần của file 02, 03 (RC-02, RC-05) có ở mục 6 và 7.1 |
| Q1-09 | Sai lệch về lịch và effort có số liệu kế hoạch, thực tế và nguyên nhân | IN-13 | Không đạt: không có effort thực tế (IN-13 Chưa có) |
| Q1-10 | Báo cáo đã được gửi tới người quyết định và risk owner; version đã gửi được ghi lại | IN-10 | Không đạt: chưa gửi |

**Người review / ngày:** chưa có.

## References

1. <a id="ref-1"></a>[Test Plan](../../02-planning/output/01-test-plan.md) — version 1.1, 2026-11-17
2. <a id="ref-2"></a>[Authentication](../../../../../design/prototype/docs/requirements/authentication.md) — commit `c23d848`, 2026-11-17
3. <a id="ref-3"></a>[Security](../../../../../architecture/23-security.md) — commit `c23d848`, 2026-11-17
4. <a id="ref-4"></a>[Workspace](../../../../../design/prototype/docs/requirements/workspace.md) — commit `bd0ecff`, 2026-11-16
5. <a id="ref-5"></a>[Architectural Decisions](../../../../../architecture/30-decisions.md) — commit `705a1ad`, 2026-11-17
6. <a id="ref-6"></a>[Crypto Force UI Prototype](../../../../../design/prototype/README.md) — commit `dbbaafe`, 2026-11-16
7. <a id="ref-7"></a>[Test Log](../../05-execution/output/02-test-log.md) — RUN-001 đến RUN-016
8. <a id="ref-8"></a>[Test Environment](../../04-implementation/output/04-test-environment.md) — 2026-11-19
9. <a id="ref-9"></a>[Estimates & Schedule](../../02-planning/output/05-estimates-and-schedule.md) — 2026-11-17
10. <a id="ref-10"></a>[Entry & Exit Criteria](../../02-planning/output/04-entry-exit-criteria.md) — version 1.1, 2026-11-17
