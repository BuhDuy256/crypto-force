# Testing Approach Update

Đọc file này để biết kế hoạch điều chỉnh cách test sau TS-001 (Authentication): mục tiêu mới, những gì giữ lại, những gì dừng, và các bước tiếp theo.

## 1. Bối cảnh và kết luận

Mục tiêu khi chạy STLC cho TS-001 là "làm Testing chuẩn chỉnh". Mục tiêu đó không gắn với kết quả cho product, nên phần lớn công sức đi vào workflow và report.

Số liệu round 1:

| Mốc | Kết quả | Defect mới |
|---|---|---|
| Dry run Phase 04 (18/11) | Thấy gần như toàn bộ defect lớn: lockout sai ngưỡng, session fixation, không có giới hạn session 30 ngày, reset link cũ còn hiệu lực, thiếu header bảo mật | ~18 |
| Mutant check testware (18/11) | 34 test chưa từng fail được phát hiện và sửa; assertion yếu bị thay | 0 (testware đáng tin hơn) |
| Phase 05 chính thức (19/11) | Chạy lại và ghi log; DEF-19 đến từ lần chạy tay Google sign-in | 1 |
| Phase 06 (19/11) | Report, residual risk, lessons, mở rộng docs checker | 0 |

Kết quả cuối: 19 defect mở, 7 Major, chưa defect nào được sửa [[1]](#ref-1). Exit criteria: 6/9 không đạt [[2]](#ref-2). Kết luận: giá trị chính đến từ test basis rõ ràng, checklist bảo mật và mutant check; nửa sau của quy trình chủ yếu là chi phí tài liệu.

## 2. Mục tiêu mới

> Ship Authentication an toàn, với chi phí token và thời gian nhỏ nhất, và có test tự động chặn regression.

Mỗi artifact phải trả lời được một trong ba câu: nó giúp **tìm** bug, **sửa** bug, hay **chặn bug quay lại**? Không trả lời được thì không làm.

## 3. Giữ lại

Ba anti-pattern về test (Tautological tests, Structure-sensitive tests, Test that can't fail) đã được áp dụng đúng vào testware và đã nằm trong coding guidelines, lint rule và skill [[3]](#ref-3). Phần này có hiệu quả và không tốn thêm chi phí cho feature sau.

- Test basis có giá trị cụ thể (ví dụ "3 lần mỗi 10 giây", "30 ngày absolute").
- Checklist bảo mật (OWASP ASVS) và boundary cho các luồng nhạy cảm.
- Mutant check: mỗi test quan trọng phải fail ít nhất một lần trên hành vi sai.
- Assertion chính xác, expected value lấy từ test case, không lấy từ code.
- Chạy tay ngắn các flow chính (15–30 phút).

## 4. Dừng

- Không mở rộng `scripts/check-stlc-docs.mjs` thêm. Đây là automated check cho report, không cho product.
- Không bổ sung thêm report cho TS-001 (readiness, summary, closure, residual risk). Đóng TS-001 ở trạng thái hiện tại.
- Agent không đưa lựa chọn cho người dùng khi quyết định đó không ảnh hưởng tới việc tìm, sửa hoặc chặn defect. Agent tự chốt và ghi lại lý do.

## 5. Các bước

| # | Việc | Kết quả mong đợi | Trạng thái |
|---|---|---|---|
| 1 | Sửa 7 defect Major (DEF-01, 02, 03, 05, 06, 09, 18) theo TDD, dùng test đang fail làm red test [[1]](#ref-1) | Test tương ứng pass; `pnpm check` và `pnpm test` pass | Xong (commit `41c7f79`–`30d27b5`) |
| 2 | Phân loại 12 defect Minor/Trivial: sửa ngay, hoãn có lý do, hoặc bỏ | Mỗi defect có một quyết định trong defect report | Xong (Minor/Trivial được sửa cùng Bước 1) |
| 3 | Chạy lại toàn bộ test auth (unit, integration, E2E) và chạy tay các flow chính | Không còn test fail ngoài các defect đã hoãn | Phần tự động xong; còn 2 test flaky (TC-005, TC-172) chuyển sang Bước 6. Chưa chạy tay |
| 4 | Viết Lean testing workflow cho feature sau (1 trang, xem §6) | Workflow được người dùng duyệt | Xong: v1 đã duyệt ở [lean-testing-workflow.md](lean-testing-workflow.md) |
| 4b | Cập nhật repo để phục vụ workflow v1 mà không ghi workflow vào repo (xem §8) | Repo chỉ chứa rule; `pnpm check` không còn kiểm tài liệu STLC; agent không tự chạy STLC | Xong trên `chore/lean-testing` (4 commit, chưa push). Lint cho thời gian thật chuyển sang Bước 6 |
| 5 | Feature tiếp theo (`packages/engine`): thiết kế Deep Module trước khi viết code, test qua public interface | Interface nhỏ, test không phụ thuộc cấu trúc nội bộ | Chưa bắt đầu |
| 6 | Sau mỗi feature: `/code-review`, rồi retro. Retro đề xuất check tự động (lint, type, test), không đề xuất thêm văn bản | Mỗi lỗi lặp lại có một check chặn nó | Chưa bắt đầu |

## 6. Phác thảo Lean testing workflow

1. **Spec có số cụ thể.** Mỗi rule có giá trị đo được.
2. **Chọn mức độ theo rủi ro.** Feature rủi ro cao (auth, tính tiền, engine) dùng checklist bảo mật và boundary đầy đủ. Feature khác chỉ test hành vi chính.
3. **Test tự động** viết qua public interface, có mutant check cho test quan trọng.
4. **Chạy tay** 15–30 phút trên các flow chính.
5. **Một file defect duy nhất.** Không có execution status, summary hay closure riêng.
6. **Retro** chỉ sinh ra check tự động.

Workflow STLC đầy đủ chỉ dùng khi có yêu cầu rõ ràng (ví dụ cần bằng chứng cho bên thứ ba).

## 7. Ngân sách

- Mỗi report hoặc tài liệu: tối đa 1 lượt review độc lập.
- Một feature không dùng quá thời gian cho tài liệu bằng thời gian cho test và sửa lỗi.
- Khi chi phí vượt ngân sách, agent dừng và báo người dùng trước khi tiếp tục.

## 8. Bước 4b: cập nhật repo

### Ràng buộc

- **Repo chỉ chứa rule**: lint, type, test, coding guidelines, kiến thức kỹ thuật (skill technique). Thứ tự làm việc và workflow nằm ngoài repo (trong đầu người dùng hoặc implementation plan trong `docs/build/`). Không thêm file workflow, không thêm dòng mô tả workflow vào `CLAUDE.md`.
- Thứ tự ưu tiên khi chặn lỗi: cấu trúc code và type → lint → test → tài liệu.
- Không tạo file Markdown mới khi người dùng không yêu cầu. File trong `.claude/` viết bằng tiếng Anh.
- Không xóa lịch sử: TS-001 giữ nguyên làm hồ sơ. Không thêm, sửa, xóa Lesson Learned khi người dùng chưa duyệt.
- Lint rule mới có `message` chỉ cách sửa.

### Phân loại thành phần hiện có

| Thành phần | Loại | Việc cần làm |
|---|---|---|
| Lint testware (`no-stlc-ids`, `exact-status-oracle`, `require-expect`), `check-exports`, `vitest-configs`, hook lint | Rule | Giữ |
| `docs/development/coding-guidelines.md`, mục Testware | Rule | Giữ. Gỡ chỗ rule phụ thuộc tài liệu STLC: dòng "Mỗi mock, stub, driver ghi Đạt ở Test Environment phải có `Kiểm bằng lỗi:` … (`pnpm check:docs`)" → đổi thành rule cho chính test code (ví dụ comment đầu file test nêu lỗi đã thử). Thêm rule "test không phụ thuộc thời gian thật" (TC-005, TC-172), chặn bằng lint nếu làm được |
| Anti-pattern trong `.claude/skills/stlc-test-implementation/SKILL.md` | Rule nằm sai chỗ | Chuyển các anti-pattern còn thiếu sang coding guidelines; `review-change` đọc từ coding guidelines, không đọc từ skill STLC |
| `review-change` | Rule (review) | Thu hẹp về code và test; bỏ "STLC documents" khỏi description |
| `docs/testing/test-strategy.md` | Rule (level, type theo rủi ro, tiêu chí trước merge) | Giữ. Không thêm workflow |
| Skill `test-technique-*`, `test-risk-analysis`, `test-defect-classification`, `deliver-acceptance-criteria` | Kiến thức | Giữ |
| 6 skill `stlc-*` | Workflow (thứ tự phase) | Giữ, nhưng sửa description: chỉ dùng khi người dùng yêu cầu rõ STLC đầy đủ. Agent không tự kích hoạt khi được hỏi "design test cases" |
| `docs/testing/stlc-template/`, `docs/testing/test-scopes/` | Workflow + hồ sơ | Giữ nguyên, không tạo template lean |
| `check-stlc-docs.mjs`, `check-test-scope-ids.mjs` trong `pnpm check:docs` | Check cho tài liệu | Bỏ khỏi `pnpm check`, chuyển sang `pnpm check:stlc` (chạy tay). Kiểm `.github/workflows/ci.yml` cùng lúc |
| `CLAUDE.md` | Rule | Chỉ sửa dòng bị sai sau các thay đổi trên (ví dụ mô tả `pnpm check`). Không thêm workflow |

### Điều kiện hoàn thành

- `pnpm check` pass và không chạy `check-stlc-docs`, `check-test-scope-ids`.
- `pnpm check:stlc` vẫn pass trên TS-001.
- Không có file Markdown mới trong repo; `CLAUDE.md` không có mô tả workflow.
- Mỗi rule mới hoặc chuyển chỗ có check tự động hoặc ghi rõ "review: skill `review-change`".

## References

1. <a id="ref-1"></a>[Defect Reports](../../testing/test-scopes/TS-001-auth/05-execution/output/03-defect-reports.md)
2. <a id="ref-2"></a>[Test Summary Report](../../testing/test-scopes/TS-001-auth/06-report/output/01-test-summary-report.md)
3. <a id="ref-3"></a>[Coding Guidelines](../../development/coding-guidelines.md)