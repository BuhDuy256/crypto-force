# Test Execution & Coverage

Đọc file này để biết bao nhiêu test của TS-001 đã chạy và kết quả ra sao, test basis được bao phủ đến mức nào, và phần nào chưa được kiểm chứng.

## 1. Phạm vi số liệu

| Trường | Nội dung |
| --- | --- |
| Đối tượng được đánh giá | Commit `7cdb0f5`, `better-auth@1.7.25`; RUN-001 đến RUN-009 trên working tree của product owner, HEAD giả định là `b35a791` (input IN-01, IN-06) |
| Thời điểm chốt dữ liệu | 2026-11-19 08:25 (UTC+7), lần chốt 1 |
| Nguồn kết quả test | Execution Status mục 2 [[1]](#ref-1); Test Log RUN-001 đến RUN-016 [[2]](#ref-2) |
| Nguồn coverage item | Test Models [[3]](#ref-3), 427 item; Test Cases [[4]](#ref-4), cột "Coverage item IDs" và mục 2.11; Design Status mục 2 và 3 [[5]](#ref-5) |

## 2. Quy tắc đếm

| Khái niệm | Định nghĩa |
| --- | --- |
| Test case | Một test case ID trong Test Cases; 166 ID |
| Test instance | Một test do Vitest hoặc Playwright báo, hoặc một lượt chạy thủ công hoặc review của một test case (Execution Status mục 2.1). Không có inventory theo ID instance (TD-24) |
| Lượt chạy | Một RUN trong Test Log; RUN-012 và RUN-013 mỗi lượt chạy cả một suite |
| Kết quả hiện hành | Kết quả của lượt chạy hợp lệ gần nhất trên đối tượng được đánh giá. RUN-003, RUN-004 (Blocked) được RUN-008, RUN-009 thay; RUN-005, RUN-006 (Inconclusive) được RUN-007 thay; RUN-015 được RUN-016 thay |
| Exploratory session | Đếm riêng theo charter |

**Quy tắc chọn kết quả hiện hành:** chỉ đếm test của TS-001. Loại 2 smoke test (1 của `apps/api`, 1 của Playwright) và 15 test của `workspace.spec.ts`. Công thức: RUN-012 có 152 test − 1 smoke = 151; RUN-013 có 141 test − 1 smoke − 15 workspace = 125; thủ công và review: 6 Passed (TC-195 đến TC-198, TC-200, TC-209) và 1 Failed (TC-103 phần S). Một test case là Failed khi có ít nhất một test của nó Failed.

## 3. Trạng thái test

### 3.1. Khối lượng

| Chỉ số | Số lượng | Nguồn |
| --- | --- | --- |
| Test case trong phạm vi | 166 | [[4]](#ref-4); Execution Status mục 2.2 |
| Test instance trong phạm vi (T) | 351 | [[1]](#ref-1) mục 2.2 |
| Tổng lượt chạy | 16 (RUN-001 đến RUN-016) | [[2]](#ref-2) |
| Lượt confirmation test và rerun | 0 confirmation test (chưa có bản sửa). 4 lượt chạy lại thay kết quả Blocked hoặc Inconclusive: RUN-007, RUN-008, RUN-009, RUN-016 | [[2]](#ref-2) |
| Exploratory session dự kiến / đã thực hiện | 4 / 0 | [[1]](#ref-1) mục 2.3; TD-20 |

### 3.2. Kết quả hiện hành

| Trạng thái | Số instance | Định nghĩa |
| --- | --- | --- |
| Passed (TP) | 282 | 151 + 125 + 6 |
| Failed (TF) | 69 | RUN-012: 48; RUN-013: 20; TC-103 phần S: 1 |
| Blocked (TB) | 0 | |
| Not Run (TN) | 0 | Exploratory đếm riêng ở mục 3.1 |
| Skipped (TS) | 0 | |
| Inconclusive (TI) | 0 | |
| **Tổng (T)** | **351** | 282 + 69 |

| Chỉ số | Công thức | Giá trị |
| --- | --- | --- |
| Tỷ lệ có kết luận | (TP + TF) / T | 351 / 351 (100%) |
| Pass rate trên instance có kết luận | TP / (TP + TF) | 282 / 351 (80,3%) |
| Pass rate trên toàn phạm vi | TP / T | 282 / 351 (80,3%) |

Theo test case: 122 / 166 Passed (73,5%), 44 Failed. Pass rate không nói về coverage; xem mục 4.

### 3.3. Kết quả theo nhóm quan trọng

Đơn vị của bảng là test case, không phải instance. Mức rủi ro của nhóm theo Test Models mục 1; mỗi test case xếp theo model đầu tiên của nó (Execution Status mục 3).

| Nhóm | T (test case) | Passed | Failed | Chưa có kết luận | Phát hiện chính |
| --- | --- | --- | --- | --- | --- |
| Model của rủi ro Cao: MD-01 đến MD-09, MD-14, MD-15, MD-18 | 104 | 70 | 34 | 0 | DEF-01 đến DEF-09, DEF-17, DEF-18, DEF-19 |
| Model của rủi ro Trung bình: MD-10 đến MD-13, MD-17 | 62 | 52 | 10 | 0 | DEF-01, DEF-10 đến DEF-16 |
| Thủ công với Google và Resend thật (SC-17) | 5 | 4 | 1 | 0 | DEF-19; GAP-05 |

Dòng thứ ba chồng lấn với hai dòng đầu; các dòng không được cộng thành tổng.

## 4. Coverage

### 4.1. Quy tắc đo

| Ký hiệu | Định nghĩa |
| --- | --- |
| N | Số coverage item của model (Design Status mục 3) |
| D | Số item có test case (Design Status mục 3) |
| E | Số item thuộc D mà mọi test case phủ nó có kết quả Passed hoặc Failed. Cả 166 test case có kết quả, nên E = D ở mọi model |
| P | Số item thuộc E mà mọi test case phủ nó đều Passed |

Một item phủ bởi một test case Failed không được tính vào P, kể cả khi dòng dữ liệu fail thuộc item khác của cùng test case. Vì vậy P là giới hạn dưới. Item phủ qua item khác lấy test case từ Test Cases mục 2.11; item của MD-16 lấy test case của các item ở cột Coverage của MD-16. Cách đếm này chạy bằng script trên hai file nguồn; N và D của script khớp Design Status ở cả 18 model.

### 4.2. Coverage theo chiều

Mỗi model là một chiều riêng theo technique của nó. Các dòng không được cộng thành một tỷ lệ chung.

| Chiều (model, technique) | Rủi ro | N | D | E | P | Item không thuộc P | Criterion ID | Nguồn |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| MD-01 State Transition, all transitions | Cao | 14 | 14 | 14 | 1 | CI-01, CI-03 đến CI-14 (DEF-01) | EX-02 | [[3]](#ref-3) [[4]](#ref-4) |
| MD-02 State Transition, all transitions | Cao | 26 | 26 | 26 | 21 | CI-04, CI-05, CI-09, CI-15, CI-16 (DEF-02, DEF-03) | EX-02 | |
| MD-03 State Transition, all transitions | Cao | 15 | 15 | 15 | 14 | CI-13 (DEF-05) | EX-02 | |
| MD-04 State Transition, all transitions | Cao | 11 | 11 | 11 | 6 | CI-02, CI-03, CI-09, CI-10, CI-11 (DEF-09, DEF-10) | EX-02 | |
| MD-05 BVA 3-value | Cao | 54 | 54 | 54 | 41 | CI-01 đến CI-12, CI-54 (DEF-01) | EX-02 | |
| MD-06 BVA 3-value | Cao | 33 | 33 | 33 | 0 | CI-01 đến CI-33 (DEF-07, DEF-08) | EX-02 | |
| MD-07 BVA 3-value | Cao | 24 | 24 | 24 | 8 | CI-04 đến CI-09, CI-13 đến CI-15, CI-17, CI-18, CI-20 đến CI-24 (DEF-03, DEF-04) | EX-02 | |
| MD-08 Decision Table | Cao | 5 | 5 | 5 | 4 | CI-04 (DEF-19) | EX-02 | |
| MD-09 Decision Table | Cao | 10 | 10 | 10 | 2 | CI-01, CI-02, CI-04 đến CI-07, CI-09, CI-10 (DEF-06) | EX-02 | |
| MD-10 State Transition, valid transitions | Trung bình | 13 | 13 | 13 | 13 | Không có | EX-02 | |
| MD-11 EP, each choice | Trung bình | 49 | 49 | 49 | 41 | CI-19 đến CI-22, CI-26, CI-31, CI-32, CI-48 (DEF-01, DEF-10, DEF-12, DEF-13) | EX-02 | |
| MD-12 Decision Table | Trung bình | 6 | 6 | 6 | 6 | Không có | EX-02 | |
| MD-13 Scenario | Trung bình | 30 | 30 | 30 | 26 | CI-06, CI-14, CI-15, CI-18 (DEF-01, DEF-14, DEF-15, DEF-16) | EX-02 | |
| MD-14 Checklist ASVS 5.0 | Cao | 40 | 39 | 39 | 28 | Failed: CI-03, CI-04, CI-09, CI-11, CI-12, CI-15, CI-24, CI-25, CI-35, CI-36, CI-37. Không có test: CI-33. CI-28 thuộc P nhưng chỉ được phủ một phần (TD-03) | EX-02, EX-04 | |
| MD-15 Checklist cấu hình | Cao | 28 | 28 | 28 | 18 | CI-12 đến CI-20, CI-25 (DEF-17, DEF-18) | EX-02 | |
| MD-16 STRIDE | Cao | 29 | 24 | 24 | 16 | Failed qua item khác: CI-01, CI-03, CI-10, CI-17, CI-19, CI-23, CI-26, CI-28. Rủi ro chấp nhận của ADR-002: CI-02, CI-15, CI-25. Không có test: CI-08, CI-29 | EX-02 | |
| MD-17 Checklist accessibility | Trung bình | 33 | 33 | 33 | 24 | CI-11 đến CI-19 (DEF-11) | EX-02, EX-05 | |
| MD-18 EP, mỗi partition | Cao | 7 | 7 | 7 | 7 | Không có | EX-02 | |

Với MD-16, criterion cho phép threat là rủi ro chấp nhận, nên số item đáp ứng criterion là 16 + 3 = 19 / 29.

Theo requirement (EX-01): 81 / 81 requirement Ready có ít nhất một test case đã chạy (Design Status mục 2; cả 166 test case có kết quả). 57 / 81 có mọi test case Passed. 24 requirement có test case Failed: CM-02, SI-06, SI-07, SI-09, SI-10, SI-11, GO-03, GO-04, CA-02, CA-06, CA-12, CA-13, CA-14, CA-15, CA-16, RP-04, RP-05, RP-08, SS-05, SS-06, SEC-04, SEC-08, ASVS-7.2.4, A11Y-01. Ngoài 81 requirement, BD-17 (TC-230) cũng có test case Failed; BD-15, BD-16 Passed.

### 4.3. Code coverage

| Metric | Build và tập test | Phạm vi code / exclusions | Covered / Total | Nguồn |
| --- | --- | --- | --- | --- |
| N/A | — | — | — | Không đo: SC-18 ngoài phạm vi [[6]](#ref-6) |

## 5. Coverage gaps

Mọi item thuộc N nhưng không thuộc E có một dòng ở đây (GAP-01, GAP-02, GAP-08). Các dòng còn lại là phần chưa kiểm chứng theo nghĩa khác: item có test Failed, session chưa chạy, evidence yếu.

| Gap ID | Item / chiều / cấu hình | Phần chưa được kiểm chứng | Nguyên nhân | Owner / hành động |
| --- | --- | --- | --- | --- |
| GAP-01 | MD-14-CI-33 (ASVS 3.4.1, HSTS); phần còn lại của MD-14-CI-28 (7.4.4) | `Strict-Transport-Security`; Sign out từ mọi màn hình | Thiếu test: product owner quyết định không test trong TS-001, kiểm khi deploy (Design Status TD-02, TD-03) | Product owner; kiểm khi có môi trường deploy |
| GAP-02 | MD-16-CI-08 (TH-08), MD-16-CI-29 (TH-29) | Chung bộ đếm IP sau reverse proxy; log bảo mật | Thiếu test: SEC-05 ngoài phạm vi (SC-11); không có requirement log bảo mật, product owner quyết định 2026-11-17 (TD-06) | Product owner |
| GAP-08 | MD-16-CI-02 (TH-02), MD-16-CI-15 (TH-15), MD-16-CI-25 (TH-25) | Threat không có test | Rủi ro chấp nhận của ADR-002 (Test Cases mục 2.10); criterion của MD-16 cho phép | Product owner; đã chấp nhận trong ADR-002 |
| GAP-03 | 145 item có test case Failed ở mục 4.2: 427 − 276 item thuộc P − GAP-01 (1) − GAP-02 (2) − GAP-08 (3) | Hành vi của 44 test case Failed | Test Failed do 19 defect Open | Product owner (sửa); agent chạy confirmation test ở vòng 2 |
| GAP-04 | CHR-01 đến CHR-04 (COND-05, COND-16, COND-19 đến COND-32, COND-37, COND-38, COND-44, COND-49, COND-53, COND-55, COND-56, COND-58, COND-62, COND-63, COND-66, COND-67, COND-69, COND-71, COND-72, COND-78, COND-79, COND-83 đến COND-85) | Lỗi ngoài test case trong giới hạn số lần, phiên, Google, link, origin và redirect | Chưa chạy: product owner hoãn vô thời hạn ngày 2026-11-19 (TD-20) | Product owner |
| GAP-05 | GO-06 (TC-195, TC-196) | Màn chọn tài khoản Google hiện vì code yêu cầu, không phải vì trình duyệt đang đăng nhập nhiều tài khoản | Thiếu evidence: TC-195, TC-196 Passed, nhưng `apps/api/src` tại `ce5e35c` không có `prompt=select_account` (grep ngày 2026-11-19), và khác biệt GO-06 ở Requirement Readiness mục 4 vẫn còn trong code. Lúc chạy, trình duyệt đã đăng nhập ít nhất hai tài khoản Google (RUN-002). Google hiện màn chọn khi có nhiều phiên, nên kết quả Passed có thể do môi trường (suy luận, chưa kiểm) | Agent: thêm test kiểm URL authorization có `prompt=select_account` (ACT-03); product owner chạy lại TC-195 với một tài khoản Google |
| GAP-06 | TC-197, TC-198; RUN-001 đến RUN-009 | Email thật tới hộp thư; build của working tree | Thiếu evidence: evidence là dòng database và lời của product owner; working tree chưa kiểm (input IN-06) | Product owner; chạy lại PROC-17 ở vòng 2 (TD-25) |
| GAP-07 | 12 test case chấp nhận bằng review assertion, không có mutant (Implementation Status TD-08) | Test có fail khi hành vi sai hay không | Thiếu evidence về độ nhạy của test | Agent; không chặn kết luận, ghi ở Residual Risks R-14 |

## 6. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q2-01 | Đối tượng, thời điểm chốt và nguồn kết quả được ghi rõ; mọi kết quả thuộc đúng đối tượng được đánh giá | RC-01, RC-02 | Đạt một phần: mục 1 ghi đủ; RC-02 đạt một phần vì RUN-001 đến RUN-009 (GAP-06) |
| Q2-02 | Tổng các trạng thái ở mục 3.2 bằng T; confirmation test và rerun không được đếm thành instance mới | — | Đạt: 282 + 69 = 351; 4 lượt chạy lại thay kết quả cũ, không thêm instance |
| Q2-03 | Mọi tỷ lệ có tử số, mẫu số và nguồn; dữ liệu thiếu không được ghi thành 0 | RC-05 | Đạt một phần: mọi tỷ lệ có tử số và mẫu số; RC-05 đạt một phần vì T không đối chiếu được với inventory (TD-24) |
| Q2-04 | Coverage item cùng version với test basis và test đã chạy; P ≤ E ≤ D ≤ N ở mọi chiều | RC-03 | Đạt một phần: P ≤ E ≤ D ≤ N ở mọi chiều; RC-03 đạt một phần (version của test basis) |
| Q2-05 | Mọi item thuộc N nhưng không thuộc E có một dòng ở mục 5 | IN-05 | Đạt: GAP-01, GAP-02, GAP-08 (6 item = 427 − 421) |
| Q2-06 | Code coverage không được gộp vào coverage theo test basis | — | Đạt: không đo |

**Người review / ngày:** chưa có.

## References

1. <a id="ref-1"></a>[Test Execution Status](../../05-execution/output/01-execution-status.md) — lần chốt 1, 2026-11-19 08:25
2. <a id="ref-2"></a>[Test Log](../../05-execution/output/02-test-log.md) — RUN-001 đến RUN-016
3. <a id="ref-3"></a>[Test Models](../../03-design/output/03-test-models.md) — 2026-11-17
4. <a id="ref-4"></a>[Test Cases](../../03-design/output/04-test-cases.md) — mục 2 và 2.11
5. <a id="ref-5"></a>[Test Design Status](../../03-design/output/01-design-status.md) — mục 2 và 3
6. <a id="ref-6"></a>[Test Plan](../../02-planning/output/01-test-plan.md) — version 1.1, 2026-11-17
