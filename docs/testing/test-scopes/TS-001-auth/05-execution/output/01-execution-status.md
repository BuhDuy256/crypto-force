| TD-23 | Đã xử lý ngày 2026-11-19: product owner duyệt kết luận TC-200 và TC-209 || TD-22 | Đã xử lý ngày 2026-11-19: product owner chọn Security `c23d848` cho TC-200 (DV-03) || TD-21 | Đã xử lý ngày 2026-11-19: product owner duyệt nguyên nhân Product và severity; priority đặt theo severity, theo ủy quyền của product owner |# Test Execution Status

Đọc file này để biết trạng thái hiện hành của các test TS-001 tại thời điểm chốt 2026-11-19 08:25, kết quả nào còn hiệu lực, và việc gì còn phải làm. File này chỉ ghi sự thật về lượt chạy. Nó không kết luận exit criteria, không chấp nhận rủi ro và không quyết định release.

## 1. Phạm vi kết quả

| Trường | Nội dung |
| --- | --- |
| Version / thời điểm chốt | Lần chốt 1; 2026-11-19 08:25 (UTC+7) |
| Đối tượng được kiểm thử | Commit `7cdb0f5`, `better-auth@1.7.25`: RUN-010 đến RUN-015. Commit `b35a791`: RUN-001 đến RUN-009 (PROC-17). `git log b35a791..7cdb0f5 -- apps packages` không có commit, nên không có thay đổi code sản phẩm giữa hai build |
| Phạm vi | Authentication: SC-01 đến SC-09 và SC-17 của Test Plan; Component, Component integration, System, System integration, review |
| Thời gian thực thi | 2026-11-19 07:15:45 – 08:22:50 (UTC+7) |
| Người thực hiện / người tổng hợp | Agent (tự động, review); product owner (PROC-17) |
| Nguồn | [Test Log](02-test-log.md), [Defect Reports](03-defect-reports.md), [[1]](#ref-1) test inventory |

## 2. Trạng thái test instance

### 2.1. Quy tắc đếm

| Khái niệm | Định nghĩa |
| --- | --- |
| Test instance | Phase 04 không có bảng ID cho từng instance. File này đếm một test do Vitest hoặc Playwright báo là một instance, và một lượt chạy thủ công hoặc review của một test case là một instance (IN-04, Giả định) |
| Lượt chạy | Một lần thực hiện một instance |
| Kết quả hiện hành | Kết quả của lượt chạy hợp lệ gần nhất trên build đang đánh giá. RUN-003 và RUN-004 (Blocked) được RUN-008 và RUN-009 thay; RUN-005 và RUN-006 (Inconclusive) được RUN-007 thay |
| Exploratory session | Đếm riêng theo charter |

Mục 2.2 chỉ đếm test của TS-001. Không đếm hai smoke test (điều kiện vào của suite: 1 trong 160 test của `apps/api`, 1 trong 161 test Playwright) và 15 test workspace (`workspace.spec.ts`, không thuộc TS-001; tất cả pass). Vì vậy 152 + 141 − 17 = 276 test tự động Passed. Số này đã sửa sau review độc lập: bản đầu đếm 299 và 368.

### 2.2. Số lượng theo trạng thái

| Trạng thái | Số instance | Instance IDs hoặc query |
| --- | --- | --- |
| Passed | 282 | RUN-012: 152 test, trừ 1 smoke API (151); RUN-013: 141 test, trừ 1 smoke và 15 test workspace (125); thủ công và review: TC-195, 196, 197, 198, 200, 209 (6) |
| Failed | 69 | RUN-012: 48 test; RUN-013: 20 test; TC-103 phần S (1). Danh sách ở Test Log mục 2.4 |
| Blocked | 0 | |
| Not Run | 0 test instance | Xem mục 2.3 cho exploratory |
| Skipped | 0 | |
| Inconclusive | 0 | RUN-015 (TC-200) Inconclusive đã được RUN-016 thay |
| **Tổng** | **351** | Không so được với inventory theo ID instance (Q1-02, IN-04) |
| Exploratory session đã thực hiện / dự kiến | 0 / 4 | CHR-01 đến CHR-04 |

Tính theo test case: 166 test case, 122 Passed (116 chỉ có test tự động Passed, TC-195 đến TC-198, TC-200, TC-209) và 44 Failed (một test case Failed khi có ít nhất một dòng dữ liệu Failed):

TC-001, 002, 004, 005, 006, 007, 008, 020, 033, 036, 046, 047, 049, 050, 068, 071, 072, 078, 090 đến 098, 103, 110, 111, 113, 114, 135, 138, 141, 145, 175, 183, 184, 187, 227, 230, 242, 243.

Một test case Passed ở đây nghĩa là mọi test của nó Passed. Phần lớn test case đã kiểm chứng bằng mutant (Implementation Status mục 2); 12 test case chỉ được chấp nhận bằng review assertion (TD-08).

### 2.3. Instance chưa có kết luận

| Instance ID | Trạng thái | Lý do | Blocker / Defect ID | Owner / dự kiến chạy |
| --- | --- | --- | --- | --- |
| CHR-01 (PROC-19), CHR-02 (PROC-20), CHR-03 (PROC-21), CHR-04 (PROC-22) | Not Run | Product owner hoãn vô thời hạn ngày 2026-11-19 (tin nhắn trong session) | Không có | Product owner; chưa có ngày |
| TC-197, TC-198 | Passed, evidence yếu | Evidence là dòng database và lời của product owner (EV-006, EV-007); không có log hay video; DV-01 (địa chỉ không có `+tag`) | Không có | Giữ Passed; product owner có thể bổ sung evidence |
| TC-200, TC-209 | Passed, product owner duyệt 2026-11-19 | PROC-18 yêu cầu product owner duyệt kết luận; TC-200 đúng cho Security `c23d848` (DV-03) | Không có | Product owner |

## 3. Truy vết tới coverage item

Bảng theo test model, không theo từng coverage item. Test Log và Implementation Status mục 2 giữ liên kết từng test case tới coverage item. Một test model chỉ "kiểm chứng" khi mọi test case của nó Passed và không còn anomaly chưa giải quyết.

| Test model | Test case | Failed | Kiểm chứng hoàn toàn |
| --- | --- | --- | --- |
| MD-01 Sign in: khóa theo lần | 5 | TC-001, 002, 004, 005 (DEF-01) | Không |
| MD-02 Phiên | 15 | TC-033 (DEF-02), TC-036 (DEF-03) | Không |
| MD-03 Link reset | 10 | TC-068 (DEF-05) | Không |
| MD-04 Link xác minh | 9 | TC-071 (DEF-09), TC-072, TC-078 (DEF-10) | Không |
| MD-05 Giới hạn số lần | 16 | TC-006, 007, 008, 020 (DEF-01) | Không |
| MD-06 Độ dài password và tên | 9 | TC-090 đến TC-098 (DEF-07, DEF-08) | Không |
| MD-07 Thời hạn | 6 | TC-046, 047, 050 (DEF-04), TC-049 (DEF-03) | Không |
| MD-08 Google và tài khoản chưa xác minh | 5 | TC-103 (DEF-19) | Không |
| MD-09 Password phổ biến, đã lộ | 5 | TC-110, 111, 113, 114 (DEF-06) | Không |
| MD-10 Màn chặn, Sign out | 7 | Không có | Có |
| MD-11 Form và kết quả Sign in | 17 | TC-135 (DEF-12), TC-138 (DEF-01), TC-141 (DEF-13), TC-145 (DEF-10) | Không |
| MD-12 | 1 | Không có | Có |
| MD-13 Luồng Auth và Google, Resend | 30 | TC-175 (DEF-01), TC-183 (DEF-14), TC-184 (DEF-15), TC-187 (DEF-16) | Không |
| MD-14 ASVS | 10 | Không có | Có: TC-200 và TC-209 Passed, product owner duyệt; DV-03 chọn `c23d848` |
| MD-15 Cấu hình bảo mật | 13 | TC-227 (DEF-17), TC-230 (DEF-18) | Không |
| MD-17 Accessibility | 7 | TC-242, TC-243 (DEF-11) | Không |
| MD-18 Đích sau Sign in | 1 | Không có | Có |

Mỗi test case xếp theo test model đầu tiên ở cột "Coverage items" của Implementation Status; một test case có thể phủ item của nhiều model. Tổng test case: 166. Phần chưa kiểm chứng của mỗi dòng "Không" là hành vi của các test case Failed ở cột 3.

## 4. Hiệu lực kết quả

| Nhóm kết quả | Build / cấu hình | Còn hiệu lực cho build đang đánh giá | Căn cứ | Test cần chạy lại / owner |
| --- | --- | --- | --- | --- |
| RUN-010 đến RUN-015 | `7cdb0f5`; môi trường test tự động | Có | Build đang đánh giá | Không có |
| RUN-001, RUN-002, RUN-007 | `b35a791`; Google thật, working tree của product owner | Có | `git log b35a791..7cdb0f5 -- apps packages` không có commit; kết quả không phụ thuộc file tài liệu | Không có |
| RUN-008, RUN-009 | `b35a791`; Resend thật; email của chủ tài khoản Resend, không `+tag` | Một phần | Cùng căn cứ như trên. Evidence là database và lời product owner (Test Log Q2-07) | Product owner có thể bổ sung log hoặc video |
| RUN-003, RUN-004, RUN-005, RUN-006 | `b35a791` | Không (đã được thay thế) | Blocked và Inconclusive; được RUN-008, RUN-009, RUN-007 thay | Không có |

Mọi kết quả Failed ở RUN-012 và RUN-013 chỉ đúng cho `7cdb0f5`. Khi code đổi, chạy lại suite tương ứng.

## 5. Tạm dừng và sai lệch

| ID | Sự kiện | Thời gian | Tiêu chí áp dụng | Ảnh hưởng | Người quyết định |
| --- | --- | --- | --- | --- | --- |
| DV-01 đến DV-02 | Sai lệch của PROC-17: địa chỉ TC-197 không có `+tag`; không có tab `accounts.google.com` riêng | 2026-11-19 07:16 – 07:56 | Không có tiêu chí | TC-196, TC-197; Test Log mục 2.3 | Product owner chạy; chưa có quyết định ghi lại |
| DV-03 | TC-200 ghi Security `d6c0541`; review dùng `c23d848` | 2026-11-19 08:14 | Không có tiêu chí | TC-200 đúng cho `c23d848` | Chưa có (TD-22) |
| DV-04 | RUN-015 kiểm UI bằng source, không mở giao diện; RUN-016 (08:55) mở giao diện và thay kết quả | 2026-11-19 08:14 – 08:55 | Không có tiêu chí | RUN-015 mục 6.4.2 | Đã xử lý bằng RUN-016 |
| DV-05 | Ghi kết quả theo suite, không theo từng test instance | 2026-11-19 08:10 – 08:22 | Không có tiêu chí | RUN-012, RUN-013 | Chưa có |
| DV-07 | Execution Readiness là Chưa sẵn sàng (RC-05 chỉ đạt một phần) khi các lượt chạy bắt đầu | 2026-11-19 07:15 | RC-05 | Mọi lượt chạy | Chưa có |
| DV-08 | `playwright test --list` ghi đè `results.json` và báo cáo HTML của RUN-013 | 2026-11-19 08:38 | Không có tiêu chí | EV-013 chỉ còn output console và ảnh chụp (EV-017) | Chưa có |
| DV-06 | `--workers=2` cho SU-13 vì máy thiếu bộ nhớ | 2026-11-19 08:15 – 08:22 | Không có tiêu chí | RUN-013 | Chưa có |
| DV-07 | File Readiness lập sau lượt chạy đầu tiên | 2026-11-19 | RC-05 | RUN-001 đến RUN-009 | Chưa có |
| — | Không có tạm dừng: smoke RUN-010 và RUN-011 pass, SR-01 không áp dụng | | | | |

Chi tiết DV-01 đến DV-06: [Test Log](02-test-log.md) mục 2.3. Mỗi sai lệch chưa có người quyết định là sai lệch agent ghi; product owner có thể bác (Implementation Status mục 1, quy tắc ủy quyền).

## 6. Việc còn lại

Số TD tiếp nối Implementation Status (TD-19 là số cuối).

| ID | Việc | Liên quan | Owner | Hạn | Nơi theo dõi |
| --- | --- | --- | --- | --- | --- |
| TD-20 | Exploratory CHR-01 đến CHR-04: product owner hoãn vô thời hạn ngày 2026-11-19. EX-07 chưa đạt khi các session chưa chạy; Phase 06 phải ghi điều này là rủi ro còn lại hoặc quyết định của product owner | CHR-01 đến CHR-04; EX-07 | Product owner | Hoãn vô thời hạn | Mục 2.3 |
| TD-21 | Triage DEF-01 đến DEF-19: đặt priority, xác nhận nguyên nhân Product hay đổi requirement (EX-06) | DEF-01 đến DEF-19 | Product owner | Chưa có | [Defect Reports](03-defect-reports.md) |
| TD-22 | Sửa nguồn của TC-200 (`d6c0541` thành `c23d848`) hoặc xác nhận chọn `c23d848` | TC-200; DV-03 | Agent (sửa), product owner (xác nhận) | Trước Phase 06 | Mục 5 |
| TD-23 | Product owner duyệt kết luận TC-200 và TC-209. Phần chạy lại TC-200 với giao diện đã xong (RUN-016) | TC-200, TC-209 | Product owner | Chưa có | Test Log RUN-014 đến RUN-016 |
| TD-26 | Đã xử lý ngày 2026-11-19: mỗi defect report có "Các bước tái hiện" riêng. Còn lại: một người khác chạy lại từng report (Defect Reports Q3-02) | DEF-01 đến DEF-19 | Agent | 2026-11-19 | Defect Reports |
| TD-27 | Đã chạy `correct` sweep ngày 2026-11-19: thêm check `readinessConclusion` và `criteriaWithUnmetInput` vào `scripts/check-stlc-docs.mjs`, LL-007 vào `LESSONS.md`, và chặn `--list` ghi đè kết quả Playwright | Phase 05 | Agent | 2026-11-19 | `scripts/check-stlc-docs.mjs`, `LESSONS.md` |
| TD-28 | Đã xử lý: `apps/web/playwright.config.ts` không dùng reporter `html` và `json` khi chạy `--list`, nên lệnh này không ghi đè kết quả của lần chạy trước (kiểm: mốc thời gian của `results.json` không đổi sau `--list`). Vẫn phải chép `test-results/` và `playwright-report/` trước khi chạy test lần sau (Procedures & Suites mục 5) | RUN-013; DV-08 | Agent | 2026-11-19 | `apps/web/playwright.config.ts` |
| TD-24 | Lập inventory theo ID instance, hoặc chấp nhận đếm theo test của tool | IN-04; Q1-02 | Agent | Trước Phase 06 | Readiness IN-04 |
| TD-25 | Bổ sung evidence cho RUN-008 và RUN-009 (log, video), nếu product owner muốn | TC-197, TC-198 | Product owner | Chưa có | Test Log Q2-07 |
| TD-16 | Điều tra test chập chờn: lưu output của lần fail; RUN-012 và RUN-013 không có test chập chờn, mỗi test chạy một lần | TC-017, TC-021 dòng 3 | Agent | Trước khi CI chặn merge | Implementation Status mục 4 |
| TD-18 | Kiểm ENV-04 phần S và ENV-06 sau khi DEF-10 sửa | TC-141, TC-072 | Agent | Lần regression đầu sau khi sửa | Implementation Status mục 4 |
| TD-19 | Thêm test thông báo hiển thị cho TC-103 sau khi DEF-19 sửa | TC-103 | Agent | Trước khi CI chặn merge | Implementation Status mục 4 |

## 7. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q1-01 | Thời điểm chốt và build được ghi rõ; kết quả từ nhiều build không bị gộp chung | RC-01 | Đạt một phần: RUN-001 đến RUN-009 chạy trên working tree của product owner, nên RC-01 chỉ đạt một phần cho các lượt đó. hai build (`b35a791`, `7cdb0f5`) được ghi riêng ở mục 1 và mục 4 |
| Q1-02 | Mỗi instance trong inventory có đúng một kết quả hiện hành; tổng ở mục 2.2 bằng số instance trong inventory | IN-04, RC-04 | Không đạt: không có bảng instance theo ID; tổng 351 đếm theo test của tool (TD-24) |
| Q1-03 | Mọi instance chưa có kết luận có lý do và owner ở mục 2.3 | — | Đạt |
| Q1-04 | Coverage item chỉ được ghi là đã kiểm chứng khi mọi instance bắt buộc đã Passed và không còn anomaly chưa giải quyết liên quan | IN-11 | Đạt một phần: mục 3 theo test model, không theo từng coverage item |
| Q1-05 | Kết quả trên build cũ có căn cứ còn hiệu lực, hoặc đã được đưa vào danh sách chạy lại | RC-01 | Đạt một phần: mục 4 ghi căn cứ hiệu lực; RUN-001 đến RUN-009 chạy trên working tree của product owner, nên RC-01 chỉ đạt một phần cho các lượt đó |
| Q1-06 | Mỗi lần bắt đầu khi entry criteria chưa đạt, tạm dừng hoặc tiếp tục đều dẫn tới tiêu chí áp dụng và người quyết định | IN-10, IN-12, RC-06 | Đạt một phần: các sai lệch ở mục 5 chưa có người quyết định |
| Q1-07 | Mọi việc còn lại có owner và nơi theo dõi | — | Đạt |

**Người review / ngày:** chưa có.

## References

1. <a id="ref-1"></a>[Implementation Status](../../04-implementation/output/01-implementation-status.md) — mục 2, 2026-11-19
