# Test Execution: Readiness

Đọc file này để biết thông tin và tài nguyên nào đã có trước khi chạy test TS-001, mức độ tin cậy của từng thông tin, và phần nào của inventory được phép chạy. File này được lập sau lượt chạy đầu tiên (PROC-17, sáng 2026-11-19): lượt đó chạy khi chưa có file này. Điều đó được ghi ở RC-05.

## 1. Đợt thực thi

| Trường | Nội dung |
| --- | --- |
| Mục tiêu | Ghi hành vi thực tế của luồng Authentication so với expected result của 166 test case, và báo anomaly |
| Đối tượng được kiểm thử | Commit `7cdb0f5` trên branch `test/auth`, `better-auth@1.7.25`, `@better-auth/core@1.7.25`, `@better-auth/utils@0.5.1` (`pnpm-lock.yaml`). Working tree không có file đã sửa. Lượt PROC-17 (RUN-001 đến RUN-009) chạy trên `b35a791` |
| Phạm vi | TS-001, SC-01 đến SC-09 và SC-17 của Test Plan; Component, Component integration, System (tự động), System integration và review (thủ công), 4 exploratory charter |
| Thời gian dự kiến | 2026-11-19 07:15 – 08:25 (UTC+7) cho phần đã chạy; exploratory chưa có lịch |
| Người thực hiện | Agent (tự động, review PROC-18); product owner (PROC-17, PROC-19 đến PROC-22) |

## 2. Thông tin cần có

| ID | Thông tin cần có | Dùng cho file | Nguồn | Trạng thái | Căn cứ trạng thái | Ảnh hưởng nếu chưa xác minh |
| --- | --- | --- | --- | --- | --- | --- |
| IN-01 | Các trường ở mục 1 | 01–04 | [[1]](#ref-1) | Đã xác minh | Commit và version từ `git rev-parse HEAD` và `pnpm --filter @crypto-force/api list better-auth` (EN-03), ghi ở Test Log mục 1 | |
| IN-02 | Test basis có version, nguồn của expected result | 02, 03 | [[2]](#ref-2), [[3]](#ref-3) | Đã xác minh | Authentication và Security ghim ở `c23d848`; product owner duyệt Phase 03 và Phase 04 (Implementation Status mục 1). TC-200 `v1` ghi Security `d6c0541`, khác `c23d848` (DV-03) | |
| IN-03 | Testware có version: test case, procedure, script, charter | 02 | [[4]](#ref-4), [[5]](#ref-5) | Đã xác minh | 166 test case Sẵn sàng; script đã chạy trên `7cdb0f5` | |
| IN-04 | Test inventory: danh sách test instance (test case × dữ liệu × cấu hình), độ ưu tiên và lịch chạy | 01, 02 | [[4]](#ref-4), [[5]](#ref-5) | Giả định | Phase 04 liệt kê 166 test case và lịch theo batch (Procedures & Suites mục 4). Không có bảng ID cho từng test instance; số instance lấy từ số test mà Vitest và Playwright báo | Execution Status đếm theo test tự động, không theo ID instance; tổng không so được với inventory (Execution Status mục 7, Q1-02). Owner: agent; hạn: trước Phase 06 |
| IN-05 | Đối tượng được kiểm thử: build, danh sách thay đổi, known issues | 01, 02, 03 | [[4]](#ref-4) | Đã xác minh | Thay đổi từ `b4ca981`: Test Log mục 1; known issues: Implementation Status mục 4.1 | |
| IN-06 | Môi trường test: cấu hình, dependency, stub, mock, quyền truy cập, kết quả kiểm tra sẵn sàng | 02, 03 | [[4]](#ref-4) | Đã xác minh | Smoke SU-01 (RUN-010) và SU-11 (RUN-011) pass trên `7cdb0f5`; ENV-09 kiểm ở PROC-17 | |
| IN-07 | Test data: data set, trạng thái tài khoản, cách khởi tạo và reset, kết quả kiểm tra sẵn sàng | 02 | [[4]](#ref-4) | Đã xác minh | Test tự động tạo dữ liệu riêng, database tạo lại từ migration. DA-12 (Google test, hộp thư Resend) chuẩn bị ở PROC-17. Database dev còn 2 user cũ lúc 07:45 (Test Log mục 4); không ảnh hưởng test tự động | |
| IN-08 | Quy ước ghi kết quả: định nghĩa trạng thái, thông tin bắt buộc của một lượt chạy, mức evidence theo rủi ro, nơi lưu | 01, 02 | [[5]](#ref-5) | Đã xác minh | Agent chốt theo ủy quyền của product owner (TD-07); Procedures & Suites mục 5 | |
| IN-09 | Quy trình xử lý defect: nơi báo cáo, triage, định nghĩa severity và priority, owner | 03 | [[6]](#ref-6) | Giả định | Defect nằm trong file `03-defect-reports.md`; severity theo thang mặc định của skill. Chưa có tracker, chưa có người đặt priority (product owner) | Priority ghi "Chưa đặt" cho mọi defect; chưa có thứ tự sửa. Owner: product owner |
| IN-10 | Entry criteria, tiêu chí tạm dừng và tiếp tục | 01 | [[7]](#ref-7) | Đã xác minh | EN-01 đến EN-07, SR-01 đến SR-06 ở Entry/Exit Criteria | |
| IN-11 | Coverage item và traceability từ coverage item tới test | 01 | [[4]](#ref-4) | Đã xác minh | Cột "Coverage items" ở Implementation Status mục 2 | |
| IN-12 | Người xử lý blocker và người quyết định bắt đầu, tạm dừng, tiếp tục | 01 | [[7]](#ref-7) | Đã xác minh | SR-01 đến SR-06: agent báo cáo, product owner quyết định | |

## 3. Điều kiện bắt đầu

| ID | Điều kiện | Thông tin liên quan | Kết quả | Ảnh hưởng nếu không đạt |
| --- | --- | --- | --- | --- |
| RC-01 | Build cần kiểm thử đã được xác định và triển khai vào môi trường test; build đang chạy khớp build ghi nhận | IN-01, IN-05, IN-06 | Đạt cho RUN-010 đến RUN-015 (`7cdb0f5`, working tree không sửa). Đạt một phần cho RUN-001 đến RUN-009: chạy trên working tree của product owner, HEAD khi ghi là `b35a791` | Kết quả RUN-001 đến RUN-009 còn hiệu lực cho `7cdb0f5` khi không có thay đổi code sản phẩm giữa hai commit (`git log b35a791..7cdb0f5 -- apps packages` không có commit). Owner: agent |
| RC-02 | Testware và expected result dùng cùng version với test basis | IN-02, IN-03 | Đạt một phần: đạt cho mọi test case trừ TC-200; ghi Security `d6c0541`, không phải `c23d848` (DV-03) | Kết quả TC-200 đúng cho `c23d848`. Owner: agent sửa nguồn của test case hoặc product owner xác nhận |
| RC-03 | Môi trường và test data được kiểm thực tế | IN-06, IN-07 | Đạt: smoke pass, ENV-09 và DA-12 dùng thật ở PROC-17 | |
| RC-04 | Mỗi test instance có đủ testware, dữ liệu, cấu hình, hoặc đánh dấu chưa chạy được kèm lý do | IN-03, IN-04, IN-07 | Đạt một phần: 166 test case có testware. Exploratory CHR-01 đến CHR-04 cần product owner | CHR-01 đến CHR-04 Not Run (Execution Status mục 2.3). Owner: product owner |
| RC-05 | Quy ước ghi kết quả và quy trình xử lý defect đã thống nhất trước lượt chạy đầu tiên | IN-08, IN-09 | Đạt một phần: quy ước ghi kết quả có từ Phase 04 (TD-07). Quy trình defect (IN-09) chưa có người đặt priority. File này lập sau RUN-001 đến RUN-009 | Defect chưa có priority. Owner: product owner |
| RC-06 | Entry criteria đạt, hoặc người có thẩm quyền đã quyết định bắt đầu khi chưa đạt | IN-10, IN-12 | Đạt: EN-01 và EN-02 (product owner duyệt Phase 03, Phase 04); EN-03 ghi ở Test Log; EN-04 (RUN-010) và EN-05 (RUN-011) pass; EN-06 (Phase 04); EN-07 (PROC-17) | |

## 4. Kết luận sẵn sàng

**Trạng thái:** Chưa sẵn sàng.

Theo định nghĩa của template, "Sẵn sàng một phần" cần RC-01 và RC-05 đều đạt. RC-01 đạt cho RUN-010 đến RUN-015 nhưng RC-05 chỉ đạt một phần (chưa có người đặt priority; file này lập sau lượt chạy đầu tiên). Vì vậy kết luận là Chưa sẵn sàng. Các lượt chạy vẫn diễn ra: đây là sai lệch DV-07 (bắt đầu khi RC-05 chưa đạt). Người có thẩm quyền chưa quyết định cho sai lệch này. Các điều kiện khác chưa đạt: IN-04 và IN-09 là Giả định, RC-04 (exploratory), RC-02 (nguồn của TC-200).

**Phần được phép chạy:** chưa có quyết định của product owner. Các suite SU-01, SU-11, SU-04, SU-13, SU-21 và SU-22 đã chạy (DV-07). SU-23 (exploratory) chưa chạy.

**Người quyết định / ngày:** agent đánh giá, 2026-11-19. Product owner chưa xác nhận kết luận này.

## References

1. <a id="ref-1"></a>[Test Log](../output/02-test-log.md) — mục 1, 2026-11-19
2. <a id="ref-2"></a>[Authentication](../../../../../design/prototype/docs/requirements/authentication.md) — commit `c23d848`, 2026-11-17
3. <a id="ref-3"></a>[Security](../../../../../architecture/23-security.md) — commit `c23d848`, 2026-11-17
4. <a id="ref-4"></a>[Implementation Status](../../04-implementation/output/01-implementation-status.md) — 2026-11-19
5. <a id="ref-5"></a>[Procedures & Suites](../../04-implementation/output/02-procedures-and-suites.md) — mục 3, 4, 5
6. <a id="ref-6"></a>Skill `test-defect-classification` — `.claude/skills/test-defect-classification/SKILL.md`
7. <a id="ref-7"></a>[Entry & Exit Criteria](../../02-planning/output/04-entry-exit-criteria.md) — mục EN, SR
