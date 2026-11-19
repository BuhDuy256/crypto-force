# Handoff: review độc lập Phase 05 của TS-001-auth

> Tạo lúc: 2026-11-19. Dự án: crypto-force, nhánh `test/auth`, commit `7cdb0f5`.
> Người nhận: một reviewer không có quyền truy cập repo (ChatGPT web). Reviewer chỉ đọc các file người dùng đính kèm. Reviewer không chạy được lệnh.
> File này chưa commit và không được commit.

## 1. Việc cần làm

Review kết quả Phase 05 (Test Execution) của test scope TS-001-auth (Authentication). Tìm lỗi của người viết. Người viết là một AI agent. Người viết tin vào kết quả của chính mình, nên cần một reviewer khác kiểm lại.

Không sửa file. Không viết lại tài liệu. Chỉ báo cáo phát hiện.

## 2. Bối cảnh ngắn

- Crypto Force là app phân tích crypto. TS-001 kiểm thử luồng Authentication: Sign in, Continue with Google, Create account, Verify email, Reset password, vòng đời phiên, Sign out.
- Quy trình theo STLC của ISTQB. Phase 05 chạy test, ghi test log, báo defect và ghi execution status.
- Phase 05 chỉ ghi sự thật. Phase 05 không sửa lỗi sản phẩm, không kết luận exit criteria, không chấp nhận rủi ro và không quyết định release.
- Ngày 2026-11-19, agent đã chạy: smoke API, smoke E2E, `pnpm test`, E2E đầy đủ, và hai review thủ công (TC-200, TC-209). Product owner đã chạy session thủ công PROC-17 với Google và Resend thật.
- Exploratory (PROC-19 đến PROC-22) chưa chạy. Người dùng quyết định để sau.

## 3. File đính kèm

Người dùng đính kèm các file sau cho reviewer. Đường dẫn tính từ thư mục gốc của repo. Viết tắt `TS` = `docs/testing/test-scopes/TS-001-auth`.

### 3.1. File cần review (mới hoặc đã sửa)

| # | File | Nội dung |
| --- | --- | --- |
| 1 | `TS/05-execution/input/01-execution-readiness.md` | Thông tin và điều kiện trước khi chạy; kết luận sẵn sàng |
| 2 | `TS/05-execution/output/02-test-log.md` | Từng lượt chạy RUN-001 đến RUN-015, phân tích, evidence, sai lệch DV-01 đến DV-06 |
| 3 | `TS/05-execution/output/03-defect-reports.md` | 19 defect DEF-01 đến DEF-19 |
| 4 | `TS/05-execution/output/01-execution-status.md` | Số lượng theo trạng thái, hiệu lực kết quả, việc còn lại |
| 5 | `TS/05-execution/evidence/RUN-012-su04-pnpm-test.txt` | Output thô của `pnpm test` (1042 dòng) |
| 6 | `TS/05-execution/evidence/RUN-013-su13-playwright-all.txt` | Output thô của Playwright (910 dòng) |
| 7 | `TS/05-execution/evidence/RUN-010-su01-vitest-smoke.txt` và `RUN-011-su11-playwright-smoke.txt` | Output thô của hai smoke test (nhỏ) |

### 3.2. File tham chiếu (nguồn của expected result và quy tắc)

| # | File | Dùng để |
| --- | --- | --- |
| 8 | `TS/03-design/output/04-test-cases.md` | Expected result và input của từng test case (TC-xxx). Cần cho mọi kiểm tra "expected" |
| 9 | `TS/04-implementation/output/01-implementation-status.md` | Mục 2 (coverage item của mỗi test case) và mục 4.1 (dấu hiệu lỗi sản phẩm đã biết từ dry run). Nguồn của nhiều "Actual" trong defect report |
| 10 | `TS/04-implementation/output/02-procedures-and-suites.md` | Định nghĩa PROC-xx, SU-xx, lệnh chạy, quy ước evidence (mục 5) |
| 11 | `TS/02-planning/output/04-entry-exit-criteria.md` | Entry criteria EN-xx, tiêu chí tạm dừng SR-xx |
| 12 | `docs/design/prototype/docs/requirements/authentication.md` | Test basis: hành vi người dùng (commit `c23d848`) |
| 13 | `docs/architecture/23-security.md` | Test basis: yêu cầu bảo mật (commit `c23d848`) |
| 14 | `docs/testing/stlc-template/05-execution/README.md` và 4 file trong `input/`, `output/` cùng thư mục | Template bắt buộc của Phase 05 và tiêu chí đạt |
| 15 | `.claude/skills/stlc-test-execution/SKILL.md` | Quy tắc Phase 05 và exit check |
| 16 | `.claude/skills/test-defect-classification/SKILL.md` | Thang severity và priority |
| 17 | `TS/README.md` và `CHANGELOG.md` (mục `[Unreleased]`) | Hai file đã sửa một dòng |

Nếu không đính kèm được hết, đính kèm theo thứ tự trên. File 1 đến 4 và 8, 9 là tối thiểu.

## 4. Số liệu chính để đối chiếu

| Mục | Giá trị | Nguồn |
| --- | --- | --- |
| `packages/shared` (Vitest) | 33 test: 24 pass, 9 fail | File 5 |
| `apps/web` (Vitest) | 7 test: 7 pass | File 5 |
| `apps/api` (Vitest) | 160 test: 121 pass, 39 fail | File 5 |
| Playwright (`--workers=2`) | 161 test: 141 pass, 20 fail, 0 skip | File 6 |
| Smoke | 2 test, 2 pass | File 7 |
| Instance ở Execution Status | Passed 299, Failed 69, tổng 368 | File 4 mục 2.2 |
| Test case | 166 tổng; 44 Failed; 122 Passed | File 4 mục 2.2 |
| Defect | DEF-01 đến DEF-19, mọi defect Open | File 3 |

Công thức của 368: 152 + 141 + 6 test case thủ công đã Passed = 299 Passed. 48 + 20 + 1 (TC-103 phần S) = 69 Failed.

## 5. Việc reviewer phải kiểm

Kiểm từng mục. Mỗi phát hiện cần dẫn file và dòng hoặc ID.

1. **Số liệu.** Các con số ở mục 4 khớp với output thô (file 5, 6, 7) và khớp giữa các file 1 đến 4. Cộng lại các bảng (test log mục 2.4; execution status mục 2.2 và mục 3).
2. **Gán test fail cho defect.** Mỗi test fail trong file 5 và 6 nằm trong đúng một DEF ở test log mục 2.4. Số test theo từng DEF cộng lại thành 48 (RUN-012) và 20 (RUN-013). Không có test fail nào thiếu hoặc thừa.
3. **Actual có căn cứ.** Phần "Actual" của mỗi defect report dựa trên output thô hoặc trên mục 4.1 của file 9, và báo cáo ghi rõ nguồn nào. Tìm chỗ "Actual" nói nhiều hơn evidence chứng minh.
4. **Expected có nguồn.** Expected của mỗi defect khớp với cột "Expected result" của test case trong file 8 và với test basis (file 12, 13). Test case ID và coverage item ID đã trích có tồn tại trong file 8 và 9.
5. **Severity.** Severity theo thang của file 16. Tìm severity quá cao hoặc quá thấp và nêu lý do. Priority phải để trống (product owner đặt).
6. **Ranh giới của Phase 05.** Không có câu nào kết luận exit criteria đạt, chấp nhận rủi ro, hoặc quyết định release. Không có chỗ nào đổi expected result để test pass. Không có chỗ nào gọi test fail là "Passed".
7. **Passed có evidence.** Mỗi Passed có evidence đúng quy ước (file 10 mục 5). Chú ý đặc biệt: TC-197 và TC-198 (RUN-008, RUN-009: chỉ có dòng database và lời của product owner), TC-200 và TC-209 (RUN-014, RUN-015: review, chưa có người duyệt).
8. **TC-200.** Kiểm lại 7 mục ASVS ở bảng EV-015 của file 2 với `docs/architecture/23-security.md` (file 13). Kiểm lập luận cho 6.2.10 và 6.4.2 (chỉ tìm theo từ khóa và đọc source, không mở UI). Kiểm ghi chú DV-03: TC-200 ghi Security `d6c0541`, review dùng `c23d848`.
9. **TC-209.** Kiểm các số dòng trong RUN-014 là hợp lý. Reviewer không có `node_modules`, nên chỉ nói được chúng khớp bản review tham chiếu TD-14 ở file 9 mục 4.2 hay không.
10. **Sai lệch và giả định.** Danh sách DV-01 đến DV-07 đầy đủ. Mọi chỗ ghi "Đạt" ở tiêu chí đạt (Q1-xx, Q2-xx, Q3-xx) có căn cứ. Tìm tiêu chí ghi "Đạt" mà nội dung nói chưa đạt.
11. **Quy trình.** Kết luận "Sẵn sàng một phần" ở file 1 đúng với định nghĩa của template (file 14). Execution status theo template. Có việc nào Phase 05 phải làm mà thiếu không (so với file 15 mục Exit check).
12. **Bảo mật dữ liệu.** Không có email thật, mật khẩu, mã OAuth, cookie hoặc API key trong file 1 đến 7.
13. **Chất lượng chữ.** Câu mơ hồ, đại từ không rõ, hoặc chỗ hai file nói khác nhau về cùng một sự việc.

## 6. Điều đã biết là yếu (đừng báo như phát hiện mới, nhưng hãy đánh giá mức độ)

- Không có bảng inventory theo ID cho từng test instance. Tổng 368 đếm theo số test của tool (TD-24).
- Execution Status mục 3 theo test model, không theo từng coverage item.
- Nhiều "Actual" trong defect report lấy từ mục 4.1 (dry run trên `b4ca981`), không từ thông báo lỗi của lượt chạy này.
- RUN-012 và RUN-013 ghi theo suite, không có một dòng Run ID cho mỗi test (DV-05).
- E2E chạy `--workers=2`, không dùng số worker mặc định (DV-06).
- Mỗi test chỉ chạy một lần. Không có kết quả để xét test chập chờn (TD-16).
- Product owner chưa xác nhận nguyên nhân "Product" của 19 defect.

## 7. Điều reviewer không được làm

- Không bịa kết quả test, số dòng hoặc nội dung file không đính kèm. Khi thiếu file, ghi "Không kiểm được vì thiếu file X".
- Không kết luận "sản phẩm đạt" hoặc "nên release".
- Không đề xuất đổi expected result của test case để test pass.
- Không đề xuất sửa code sản phẩm trong phạm vi review này.

## 8. Định dạng báo cáo

Viết bằng tiếng Việt. Dùng một bảng với các cột: `File và dòng/ID`, `Phát hiện`, `Evidence`, `Mức` (cao, trung bình, thấp). Sắp xếp theo mức giảm dần. Với mỗi mục trong phần 5 không có vấn đề, viết "Không có phát hiện" và nêu bạn đã kiểm bằng cách nào.

Ở cuối, nêu ba thứ:

1. Phát hiện nào cần sửa trước khi commit.
2. Phát hiện nào cần quyết định của product owner.
3. Phần nào bạn không kiểm được và vì sao.

## 9. Ghi chú cho người dùng

- Subagent review nội bộ (agent `abdaa5fdee9c2eefb`) vẫn đang chạy lúc tạo file này. Kết quả của nó chưa được đọc. Khi cả hai báo cáo có, đối chiếu và gộp.
- Việc còn mở của Phase 05: exploratory CHR-01 đến CHR-04 (TD-20), triage defect (TD-21), duyệt TC-200 và TC-209 (TD-22, TD-23). Chưa commit.
