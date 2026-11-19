# Handoff

> Tạo lúc: 2026-11-19 ~08:20 (UTC+7)
> Dự án: crypto-force, nhánh `test/auth`, commit mới nhất `7cdb0f5` (đã push)
> Tóm tắt session: đóng Phase 04 và bắt đầu Phase 05 của test scope TS-001-auth (Authentication).

## Goal

Hoàn thành **Phase 05 Test Execution** của TS-001-auth: chạy test chính thức trên một commit cố định, ghi test log, defect report và execution status theo template `docs/testing/stlc-template/05-execution/`. Product owner (người dùng) đã duyệt Phase 04 và yêu cầu "hoàn thành Phase 05" sau khi commit và push. Phase 05 chỉ ghi sự thật: không sửa lỗi sản phẩm, không kết luận exit criteria, không quyết định release (skill `stlc-test-execution`).

## Current State

**Đã xong và đã push (`7cdb0f5`):**
- Phase 04: 166/166 test case Sẵn sàng. `pnpm test` chạy được. TD-17 đã đóng (mutant M25, M15b fail đúng; E2E toàn bộ: 141 pass, 20 fail).
- Phase 05 mới có `docs/testing/test-scopes/TS-001-auth/05-execution/output/02-test-log.md`: session thủ công PROC-17 ngày 2026-11-19 (RUN-001 đến RUN-009).
  - TC-195, TC-196, TC-197 (RUN-008), TC-198 (RUN-009): **Passed**.
  - TC-103 phần S: **Failed** (RUN-007, AN-02): Auth hiện thông báo chung "Google sign-in didn't finish…" (URL `?error=account_not_linked`) thay vì báo email đã đăng ký và gợi ý Sign in hoặc Reset password. Không có phiên, không liên kết (đúng).
  - RUN-003, RUN-004: Blocked (BL-01): Resend chế độ test chỉ gửi tới email của chủ tài khoản Resend (`EMAIL_FROM=onboarding@resend.dev`).
  - RUN-005, RUN-006: Inconclusive (setup sai, AN-01).
- README của scope ghi Phase 05 "Đang thực hiện".

**Chưa xong / có vấn đề:**
- Chưa có `05-execution/input/01-execution-readiness.md`, `output/01-execution-status.md`, `output/03-defect-reports.md`.
- Chưa chạy chính thức `pnpm test` (SU-04) và `pnpm test:e2e` (SU-13). Mới có dry run trong Phase 04 trên working tree chưa commit.
- Chưa làm PROC-18 (TC-200, TC-209) và 4 exploratory charter (PROC-19 đến PROC-22).
- **Chưa commit (không phải của agent, đừng đụng khi chưa hỏi người dùng):**
  - `docs/design/prototype/docs/requirements/authentication.md` dòng 33: chữ "pas sword" gõ nhầm trong test basis. Hỏi người dùng có hoàn nguyên không (`git checkout -- <file>`).
  - `.agents/` và `skills-lock.json` (chưa theo dõi). `pnpm check` fail ở Prettier chỉ vì `.agents/skills/diagnosing-bugs/agents/openai.yaml`. `typecheck` và `lint` pass.
- Database dev `crypto_force` còn dữ liệu test (3 user, tạo 07:45 và 07:52). Test log có ghi hai user lúc 07:45 không có lượt chạy tương ứng.

## Files in Play

| File | Why It Matters |
| --- | --- |
| `docs/testing/test-scopes/TS-001-auth/05-execution/output/02-test-log.md` | Test log đã có; thêm lượt chạy mới vào đây (dòng mới, không ghi đè) |
| `docs/testing/stlc-template/05-execution/` | Template bắt buộc cho các file Phase 05 còn thiếu |
| `.claude/skills/stlc-test-execution/SKILL.md` | Quy tắc Phase 05 và exit check (kể cả chạy `correct` ở chế độ sweep) |
| `docs/testing/test-scopes/TS-001-auth/04-implementation/output/01-implementation-status.md` | Mục 4.1 liệt kê dấu hiệu lỗi sản phẩm đã biết (nguồn cho defect report); TD-13, TD-16, TD-18, TD-19 còn mở |
| `docs/testing/test-scopes/TS-001-auth/04-implementation/output/02-procedures-and-suites.md` | Procedure PROC-xx, suite SU-xx, lệnh chạy, quy ước evidence (mục 5), mutant (mục 6) |
| `docs/testing/test-scopes/TS-001-auth/02-planning/output/04-entry-exit-criteria.md` | EN-03 (ghi commit và version `better-auth`), EN-04, EN-05, EX-xx, SR-xx |
| `docs/testing/test-scopes/TS-001-auth/03-design/output/04-test-cases.md` | Expected result của từng TC |
| `docs/design/prototype/docs/requirements/authentication.md` | Test basis (ghim ở commit `c23d848`) |
| `apps/web/app/pages/Auth/components/GoogleButton.tsx` | Nguồn của AN-02: một thông báo cho mọi lỗi Google |
| `apps/api/test/auth/google.test.ts` dòng 236 | Test CI của TC-103 chỉ kiểm `error=` trong URL (không kiểm thông báo) |
| `scripts/check-stlc-docs.mjs` | Check tài liệu STLC, chạy trong `pnpm check` |
| `CHANGELOG.md` | Phải thêm dòng dưới `## [Unreleased]` mỗi lần commit (skill `commit-push`) |

## What Has Been Tried (and Why It Failed)

### Chạy E2E đầy đủ với số worker mặc định
- **What:** `pnpm exec playwright test` trong `apps/web`.
- **Why it failed:** máy 16 GB chỉ còn ~1,5 GB trống, hệ thống dừng lượt chạy và Docker Desktop tắt (PostgreSQL mất). Dùng `--workers=2` thì chạy hết sau 12 phút. Trước khi chạy, bảo người dùng đóng bớt ứng dụng nặng.

### Mutant trên `better-auth`
- **What:** sửa một bản `node_modules/.pnpm/better-auth@1.7.25…`.
- **Why it failed:** pnpm giữ 4 bản `better-auth`; Vitest và process API nạp hai bản khác nhau. Script `mutants.mjs` ở scratchpad sửa theo từng inode (xem Procedures & Suites mục 6.1). Đã xong; không cần lặp lại trừ khi chạy mutant mới.

### Xóa dòng database bằng `docker exec … psql`
- **What:** `DELETE FROM public."user"` qua Bash.
- **Why it failed:** auto mode chặn lệnh phá dữ liệu. Người dùng phải tự chạy bằng tiền tố `!` trong prompt, hoặc cấp quyền. Đừng tìm đường vòng.

### TC-103 phần S với setup sai
- **What:** RUN-005 dùng email `…@gmail.comj` (thừa chữ `j`); RUN-006 để tài khoản Google đã xác minh còn trong database.
- **Why it failed:** TC-103 cần một tài khoản email/password **chưa xác minh** có đúng email của tài khoản Google test. RUN-007 là lượt đúng setup.

### Tạo bản đọc video
- **What:** đọc video `.mp4` của người dùng.
- **Why it failed:** `Read` không đọc video. Đã dựng virtualenv có `imageio-ffmpeg` ở scratchpad: `C:\Users\Duy\AppData\Local\Temp\claude\21f2886269200934\bd5b6ee9-87d6-4cd0-aee8-d766b32e3cf6\scratchpad\vid-venv\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v9.0.2.exe` (có thể đã bị xóa; cài lại bằng `python -m venv` và `pip install imageio-ffmpeg` trong thư mục scratchpad). Tách khung: `-vf "fps=1/5,scale=960:-1,tile=2x2"`.

## Current Best Theory

Phase 05 làm được gần hết bằng test tự động và review của agent. Phần cần người dùng chỉ còn exploratory (PROC-19 đến PROC-22) và có thể TC-200 cần đối chiếu UI. Các test fail trong dry run là lỗi sản phẩm đã biết (mục 4.1 của Implementation Status); hai danh sách lỗi đã đối chiếu: API 39 test fail, E2E 20 test fail, cả hai khớp mục 4.1. Chúng phải thành defect report, không phải "sửa test".

## Next Steps

1. Hỏi người dùng về `authentication.md` (hoàn nguyên "pas sword" hay giữ) và nhắc đóng `pnpm dev` đang chạy: E2E cần cổng 5173, 5174, 3000, 3001 trống (`pnpm test:e2e` tự khởi động server E2E). Cần Docker Desktop và PostgreSQL chạy (`pnpm db:up`).
2. Đọc `.claude/skills/stlc-test-execution/SKILL.md` và các template trong `docs/testing/stlc-template/05-execution/`. Chạy `git rev-parse HEAD` và `pnpm --filter @crypto-force/api list better-auth` để ghi EN-03. Nếu commit hoặc working tree khác `7cdb0f5` hoặc có file chưa commit trong code, ghi rõ.
3. Điền `05-execution/input/01-execution-readiness.md`.
4. Chạy smoke trước (SU-01: `pnpm --filter @crypto-force/api exec vitest run test/smoke.test.ts`; SU-11: `pnpm --filter @crypto-force/web exec playwright test e2e/smoke.spec.ts`). Nếu fail, áp dụng SR-01.
5. Chạy chính thức SU-04 (`pnpm test`) và SU-13 (`pnpm test:e2e`, thêm `--workers=2` nếu máy thiếu bộ nhớ). Lưu output vào file, ghi từng lượt chạy vào `02-test-log.md` (RUN-010 trở đi), kèm commit, thời điểm, trạng thái, evidence. Với mỗi test fail, ghi phân tích (lỗi sản phẩm, test, dữ liệu hay môi trường) trước khi báo defect. Lỗi chập chờn (TD-16): lưu output của lần fail vào evidence.
6. Viết `03-defect-reports.md`: mỗi defect một báo cáo, dùng skill `test-defect-classification` cho severity và priority. Nhóm theo mục 4.1 của Implementation Status; thêm AN-02. Gỡ nhầm lẫn: bước tái hiện gồm trạng thái ban đầu và dữ liệu chính xác, không chứa email, mật khẩu thật.
7. PROC-18 (agent tự làm): TC-200 (đối chiếu checklist ASVS với Security tại `c23d848` và 3 màn Auth) và TC-209 (đọc `createSession`, `generateId` trong `node_modules` của `better-auth`; ghi version). Ghi vào test log.
8. Exploratory CHR-01 đến CHR-04 (PROC-19 đến PROC-22): cần người dùng. Hỏi người dùng có chạy trong session này không; nếu không, ghi "Not Run" kèm lý do và owner ở Execution Status.
9. Viết `01-execution-status.md` với thời điểm chốt và commit. Đếm theo test instance. Không kết luận exit criteria (EX-xx), không chấp nhận rủi ro, không quyết định release.
10. Cập nhật `README.md` của scope (trạng thái Phase 05), `CHANGELOG.md`. Chạy `node scripts/check-stlc-docs.mjs`, `pnpm check`, skill `review-change`, và skill `correct` ở chế độ sweep (exit check của Phase 05). Rồi `commit-push` nếu người dùng yêu cầu.

## Key Constraints

- Trả lời bằng tiếng Việt, kết luận trước, tách điều đã biết, suy luận, chưa chắc; báo cáo trung thực, kể cả test fail hoặc bước bỏ qua (`C:\Users\Duy\.claude\CLAUDE.md`).
- Người dùng đã ủy quyền cho agent tự chốt các quyết định không đổi cách vận hành dự án; ghi mỗi quyết định là "theo ủy quyền của product owner" để người dùng có thể bác (memory `decision-delegation`). Hỏi người dùng với quyết định đổi cách vận hành: CI chặn merge, thêm code sản phẩm chỉ cho test, dịch vụ ngoài, chi phí.
- Không đổi expected result để test pass. Không sửa lỗi sản phẩm ở Phase 05.
- Không đưa email thật, mật khẩu, mã OAuth, cookie, API key vào tài liệu. Video của người dùng chứa mật khẩu hiện rõ; không đưa vào repo.
- Không tạo file Markdown ngoài yêu cầu (`CLAUDE.md` dự án). Skill `commit-push` của dự án cấm trailer `Co-Authored-By`.
- Chỉ commit khi người dùng yêu cầu. Không commit `HANDOFF.md`, `.agents/`, `skills-lock.json`.
- Resend (`EMAIL_FROM=onboarding@resend.dev`, domain chưa xác minh) chỉ gửi tới email của chủ tài khoản Resend. Người dùng không có domain.
- Trước khi báo hoàn thành: `pnpm check` (hiện fail vì `.agents/`, không phải do thay đổi của agent), skill `review-change`.
- Máy yếu bộ nhớ: không chạy nhiều tiến trình nặng cùng lúc. Docker Desktop từng tắt khi hết bộ nhớ; không tự bật lại mà không hỏi.

## Memory Pointers

- Observation 2877: người dùng ủy quyền cho agent chốt quyết định không đổi vận hành.
- Observation 2884: VF-13, lượt chạy SU-12 dừng vì thiếu bộ nhớ.
- Observation 2921: kết quả review độc lập của Phase 04 (TD-17, TD-18).
- Searches worth re-running: `TS-001 Phase 05 execution`, `PROC-17 TC-103 AN-02`, `better-auth account_not_linked`.
