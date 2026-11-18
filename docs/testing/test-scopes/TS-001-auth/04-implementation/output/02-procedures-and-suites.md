# Test Procedures & Suites

Đọc file này để biết các test procedure, script và suite của TS-001 đã được tạo, cách chạy chúng theo thứ tự nào, và bằng chứng cho thấy chúng kiểm đúng expected result.

## 1. Phạm vi

| Trường | Nội dung |
| --- | --- |
| Nơi lưu testware | `apps/api/test/` (Component integration), `packages/shared/test/` và `apps/web/app/utils/auth-redirect.test.ts` (Component), `apps/web/e2e/auth/*.spec.ts` và `apps/web/e2e/auth/fixtures.ts`, `apps/web/e2e/environment.ts` (System), file này mục 2.2 (thủ công) |
| Snapshot | Branch `test/auth`, commit chứa thư mục `04-implementation/` |
| Framework và công cụ | `vitest@5.1.0`, `@playwright/test@1.65.1` với Chromium, `@axe-core/playwright@4.14.0`, `tsx@4.23.15`, `pg@8.23.1` |
| Test design được hiện thực hóa | Test Cases [[1]](#ref-1), 166 test case và 4 charter: 159 test case `v1` tại commit `497541d`; ngày 2026-11-18 có TC-005, TC-060, TC-103, TC-133, TC-204, TC-206 `v2` và TC-209 `v1` mới (Implementation Status mục 3, TD-14) |

## 2. Procedures và scripts

### 2.1. Script tự động

Tên mỗi test bắt đầu bằng Test case ID, kèm số dòng khi test case có nhiều dòng dữ liệu, để kết quả của Vitest và Playwright truy vết được tới test case. Mỗi dòng dữ liệu là một test riêng, chạy lại từ precondition.

| Procedure ID | Test case IDs theo thứ tự chạy | Mục tiêu | Ưu tiên | Loại | Khởi đầu | Kết thúc và dọn dẹp | Vị trí / version | Verification IDs |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PROC-00 | Smoke, không phải test case (EN-04, EN-05) | Build kiểm thử được: tạo tài khoản, xác minh email, Sign in | Cao | Automated | CI: database `_test` vừa tạo. S: server E2E vừa khởi động | Không cần | `apps/api/test/smoke.test.ts`, `apps/web/e2e/smoke.spec.ts` | VF-01, VF-02, VF-03 |
| PROC-01 | TC-001, TC-002, TC-003, TC-004, TC-005, TC-006, TC-007, TC-008, TC-011, TC-012, TC-013, TC-014, TC-015, TC-016, TC-020 | Khóa Sign in và giới hạn số lần (MD-01, MD-05) | Cao | Automated, CI | Harness mới và đồng hồ giả cho mỗi test; IP mới từ `198.51.100.0/24`. TC-003, TC-005: process API thật và đồng hồ thật (ENV-10) | `clock.restore()`; dừng mọi process API đã chạy | `apps/api/test/auth/rate-limit.test.ts` | VF-01, VF-02, VF-04, VF-05, VF-10, VF-11, VF-12 |
| PROC-02 | TC-032, TC-033, TC-034, TC-035, TC-036, TC-039, TC-041, TC-042, TC-044, TC-045, TC-046, TC-047, TC-048, TC-049, TC-050 | Vòng đời phiên và thời hạn (MD-02, MD-07) | Cao | Automated, CI | Harness mới, đồng hồ giả, tài khoản mới | `clock.restore()` | `apps/api/test/auth/session.test.ts` | VF-01, VF-02, VF-05, VF-12 |
| PROC-03 | TC-063, TC-066, TC-068, TC-069, TC-077 | Link reset và link xác minh (MD-03, MD-04) | Cao | Automated, CI | Harness mới, đồng hồ giả | `clock.restore()` | `apps/api/test/auth/links.test.ts` | VF-01, VF-02, VF-05, VF-12 |
| PROC-04 | TC-090, TC-091, TC-092, TC-093, TC-096, TC-097 (phần CI), TC-110, TC-111, TC-112, TC-113, TC-114, TC-201, TC-203 | Quy tắc password (MD-06, MD-09, MD-14) | Cao | Automated, CI | Harness mới; stub Pwned Passwords về `clean` | Không cần | `apps/api/test/auth/password.test.ts` | VF-01, VF-02, VF-05, VF-12 |
| PROC-05 | TC-009, TC-010, TC-017, TC-018, TC-019, TC-043, TC-100, TC-101, TC-102, TC-103 (phần CI), TC-104, TC-199, TC-232 | Continue with Google (MD-05, MD-08, MD-13, MD-15) | Cao | Automated, CI | Harness có Google; OAuth provider giả về trạng thái rỗng | `clock.restore()` | `apps/api/test/auth/google.test.ts` | VF-01, VF-02, VF-05, VF-10, VF-12 |
|  PROC-06 | TC-133 (phần CI), TC-150 (phần CI), TC-185, TC-229, TC-192, TC-204, TC-205, TC-208, TC-220 dòng 3, TC-221 dòng 2, TC-222, TC-223, TC-224, TC-226, TC-231 | Kết quả Sign in, lỗi gửi email, ASVS, cấu hình bảo mật (MD-11 đến MD-15) | Cao, Trung bình | Automated, CI | Harness có Google | TC-204 xóa database `_test_fresh`; TC-226 dừng process API con | `apps/api/test/auth/security.test.ts` | VF-01, VF-02, VF-05, VF-12 |
| PROC-07 | TC-206 | Token phiên không trùng và có độ dài, bảng ký tự đủ cho 128 bit. Không kiểm token có đoán trước được không; phần này là review TC-209 (PROC-18) | Trung bình | Automated, CI | Chạy sau mọi file CI khác (`vitest.config.ts`) | Không cần | `apps/api/test/auth/token-entropy.test.ts` | VF-01, VF-02, VF-12 |
| PROC-08 | TC-090 đến TC-098 (phần C) | Độ dài trong schema form (MD-06) | Cao, Trung bình | Automated, C | Không cần | Không cần | `packages/shared/test/auth.schema.test.ts` | VF-01, VF-02 |
| PROC-09 | TC-160 (phần C) | Hàm chọn đích sau Sign in (MD-18) | Cao | Automated, C | Không cần | Không cần | `apps/web/app/utils/auth-redirect.test.ts` | VF-01, VF-02 |
| PROC-11 | TC-021, TC-138, TC-175 | Giới hạn số lần nhìn từ UI | Cao | Automated, S | IP cố định từ `198.51.100.0/24` | Đóng context | `apps/web/e2e/auth/limits.spec.ts` | VF-01, VF-03 |
| PROC-12 | TC-030, TC-031, TC-037, TC-038, TC-040, TC-120, TC-121, TC-122, TC-123, TC-124, TC-125, TC-126, TC-193, TC-194 | Phiên trong trình duyệt, màn chặn, Sign out (MD-02, MD-10, MD-13) | Cao, Trung bình | Automated, S | Context mới, IP mới | Đóng context | `apps/web/e2e/auth/session.spec.ts` | VF-01, VF-03, VF-07, VF-12 |
| PROC-13 | TC-060, TC-061, TC-062, TC-064, TC-065, TC-067, TC-070, TC-071, TC-072, TC-073, TC-074, TC-075, TC-076, TC-078, TC-145, TC-146, TC-186, TC-187, TC-188, TC-189, TC-190, TC-191 | Link reset, link xác minh, luồng Reset password (MD-03, MD-04, MD-13) | Cao, Trung bình | Automated, S | Context mới; link lấy từ console | Đóng context | `apps/web/e2e/auth/links.spec.ts` | VF-01, VF-03, VF-07, VF-12 |
| PROC-14 | TC-094, TC-095, TC-098, TC-130, TC-131, TC-132, TC-133 (phần S), TC-134, TC-135, TC-136, TC-137, TC-139, TC-140 (dòng 2 trên server `withoutGoogle`), TC-141, TC-142, TC-143, TC-144, TC-150, TC-160, TC-170 đến TC-184 | Trường form, kết quả Sign in, `next`, luồng Auth (MD-06, MD-11, MD-12, MD-13, MD-18) | Cao, Trung bình | Automated, S | Context mới | Đóng context | `apps/web/e2e/auth/forms.spec.ts` | VF-01, VF-03, VF-07, VF-12 |
| PROC-15 | TC-202, TC-207, TC-220 dòng 1 và 2, TC-221 dòng 1, TC-225, TC-227, TC-228, TC-230 | ASVS và cấu hình bảo mật qua API thật (MD-14, MD-15) | Cao, Trung bình | Automated, S | Context mới | Đóng context | `apps/web/e2e/auth/security.spec.ts` | VF-01, VF-03, VF-07, VF-12 |
| PROC-16 | TC-240, TC-241, TC-242, TC-243, TC-244, TC-245, TC-246 | Accessibility của 6 màn Auth (MD-17) | Trung bình | Automated, S | Context mới | Đóng context | `apps/web/e2e/auth/a11y.spec.ts` | VF-01, VF-03, VF-07 |

### 2.2. Procedure thủ công

| Procedure ID | Test case IDs theo thứ tự chạy | Mục tiêu | Ưu tiên | Loại | Khởi đầu | Kết thúc và dọn dẹp | Vị trí / version | Verification IDs |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PROC-17 | TC-195, TC-196, TC-197, TC-198, TC-103 (phần S) | Google OAuth và Resend thật (SI); phần S của TC-103 với Google thật (CH-11) | Cao, Trung bình | Manual | EN-07 đạt. Dừng mọi server đang chạy, rồi chạy `pnpm dev` với `.env` gốc (có Google và Resend). Trình duyệt ở chế độ thường, đã đăng nhập tài khoản Google test | Sign out; xóa tài khoản Crypto Force vừa tạo khỏi database dev (`DELETE FROM "user" WHERE email = '<email>'`) | File này, mục 2.3 | VF-08 |
| PROC-18 | TC-200, TC-209 | Review tài liệu, UI và code của dependency theo ASVS | Cao, Trung bình | Manual (review) | Security tại `c23d848`; UI tại `b4ca981` mở bằng `pnpm dev`; TC-209: `node_modules` cài bằng `pnpm install --frozen-lockfile` | Không cần | File này, mục 2.3 | VF-08 |
| PROC-19 | CHR-01 | Exploratory: giới hạn số lần và vòng đời phiên | Cao | Exploratory charter | Server E2E (`node --import tsx e2e/server.ts` trong `apps/web`), DevTools, `curl` | Ghi session sheet; dừng server | Test Cases mục 3 | VF-08 |
| PROC-20 | CHR-02 | Exploratory: Continue with Google | Cao | Exploratory charter | Server E2E và route Google giả của Playwright (`auth/forms.spec.ts`, TC-141) làm điểm xuất phát; một session ngắn với Google thật dùng môi trường của PROC-17 | Ghi session sheet | Test Cases mục 3 | VF-08 |
| PROC-21 | CHR-03 | Exploratory: link xác minh và link reset | Cao | Exploratory charter | Server E2E; link đọc ở `apps/web/.e2e-output/e2e-console.log` | Ghi session sheet | Test Cases mục 3 | VF-08 |
| PROC-22 | CHR-04 | Exploratory: origin, CORS, header, chuyển tiếp | Cao | Exploratory charter | Server E2E; trang HTML local ở origin khác (ví dụ `python -m http.server 8080`) | Ghi session sheet | Test Cases mục 3 | VF-08 |

Mỗi exploratory session ghi: charter ID, người chạy, thời điểm bắt đầu và kết thúc (timebox 60 phút), commit đang chạy, danh sách việc đã thử, phát hiện kèm evidence (screenshot, request và response), câu hỏi mở, và kết quả debrief. Session sheet nằm ở `05-execution/` của Phase 05.

### 2.3. Bước của procedure thủ công

**PROC-17** (người chạy: product owner):

1. TC-195: mở `http://localhost:5173/sign-in`, bấm Continue with Google, chọn tài khoản Google test. Ghi: Google có hiện màn chọn tài khoản không; sau khi chọn, trang có mở Realtime với phiên không.
2. TC-196: Sign out từ menu tài khoản; bấm Continue with Google lần nữa. Ghi: Google có hiện màn chọn tài khoản không; mở `https://accounts.google.com` ở tab khác và ghi phiên Google còn hay không.
3. TC-197: Create account với địa chỉ `<hộp thư của chủ tài khoản Resend>+ts001-<ngày giờ>`; mở hộp thư; mở link. Ghi: email có tới không, link có xác minh được tài khoản không.
4. TC-198: Sign out; Forgot password cho email của bước 3; mở link trong hộp thư. Ghi: email có tới không, link có mở form Choose a new password không.
5. TC-103 phần S: Sign out. Create account với email của tài khoản Google test và một password bất kỳ; không mở link xác minh. Bấm Continue with Google, chọn tài khoản Google test. Ghi: có phiên không (mở `/realtime`), Auth báo gì. Sau bước này, xóa tài khoản Crypto Force đó như ở bước kết thúc.
6. Ghi commit, version `better-auth` (EN-03), và kết quả từng bước vào test log của Phase 05. Không ghi email hay mật khẩu thật vào tài liệu.

**PROC-18** (người chạy: agent, product owner duyệt kết luận):

1. TC-200: đối chiếu từng mục với Security tại `c23d848` và với 3 màn Sign in, Create account, Forgot password. Với mỗi mục, ghi Có hoặc Không kèm vị trí trong tài liệu hoặc screenshot.
2. TC-209: ghi version của `better-auth`, `@better-auth/core`, `@better-auth/utils` trong `pnpm-lock.yaml`. Bắt đầu từ các route tạo phiên (Sign in, Create account, xác minh email, liên kết Google, đổi thông tin user), đọc tới hàm sinh token trong `node_modules`: `createSession` có `overrideAll` không, `generateId` dùng hàm sinh nào, hàm đó lấy byte từ đâu và đổi byte sang ký tự thế nào. Đọc `apps/api/src/configs/auth.ts`: có thay `generateId` hoặc có `databaseHooks` sửa token không. Ghi file và dòng của mỗi kết luận. Bản review ngày 2026-11-18 ở TD-14 của Implementation Status là bản tham chiếu; khi version không đổi, chỉ cần xác nhận lại các dòng đó.

## 3. Suites

| Suite ID | Cách chọn test | Data / cấu hình | Thứ tự, phụ thuộc, chạy song song | Lệnh chạy |
| --- | --- | --- | --- | --- |
| SU-01 | PROC-00 phần CI | DA-01; ENV-01 | Chạy trước mọi suite CI | `pnpm --filter @crypto-force/api exec vitest run test/smoke.test.ts` |
| SU-02 | PROC-08, PROC-09 | DA-05, DA-09, DA-10; ENV-13 | Độc lập, song song theo mặc định của Vitest | `pnpm --filter @crypto-force/shared test` và `pnpm --filter @crypto-force/web test` |
| SU-03 | PROC-00 phần CI, PROC-01 đến PROC-07: mọi file `apps/api/test/*.test.ts` | DA-01 đến DA-08, DA-11; ENV-01, ENV-03 đến ENV-06, ENV-10, ENV-11 | Tuần tự theo file (`fileParallelism: false`); smoke đầu tiên, TC-206 cuối cùng | `pnpm --filter @crypto-force/api test` |
| SU-04 | SU-02 và SU-03 | Như SU-02, SU-03 | Tuần tự theo workspace, không dừng khi một workspace fail (`--no-bail`) | `pnpm test` |
| SU-11 | PROC-00 phần S | DA-01, DA-08; ENV-02, ENV-07 | Chạy trước SU-12 | `pnpm --filter @crypto-force/web exec playwright test e2e/smoke.spec.ts` |
| SU-12 | PROC-11 đến PROC-16: file `e2e/auth/*.spec.ts` | DA-01 đến DA-11; ENV-02, ENV-04, ENV-06, ENV-07, ENV-08, ENV-11, ENV-12 | Các file chạy song song theo số worker mặc định của Playwright; test trong một file chạy tuần tự (`fullyParallel: false`); mỗi test có IP và tài khoản riêng | `pnpm --filter @crypto-force/web exec playwright test e2e/auth/` |
| SU-13 | Mọi file `apps/web/e2e/*.spec.ts`, gồm cả test workspace | Như SU-12 | Như SU-12 | `pnpm test:e2e` |
| SU-21 | PROC-17 | DA-12; ENV-09 | Sau SU-04 và SU-13 của cùng commit | Thủ công |
| SU-22 | PROC-18 | — | Không phụ thuộc | Thủ công |
| SU-23 | PROC-19 đến PROC-22 | Server E2E | Sau vòng chạy tự động đầu tiên (Test Approach mục 4) | Thủ công |

**Chính sách retry:** Không retry (`retries: 0` trong `playwright.config.ts`; Vitest không cấu hình retry). Test fail được ghi nguyên kết quả; chạy lại chỉ để điều tra, và lượt fail đầu vẫn được ghi vào test log.

## 4. Lịch chạy

| Batch | Suite / procedure IDs | Điều kiện bắt đầu | Thứ tự / thời gian dự kiến | Môi trường | Căn cứ ưu tiên |
| --- | --- | --- | --- | --- | --- |
| B-01 | SU-01 | `pnpm db:up`; EN-03 đã ghi | 1; khoảng 2 phút (Vitest mất khoảng 70 giây để import trên máy Windows) | ENV-01 | Smoke quyết định build có kiểm thử được không (SR-01) |
| B-02 | SU-11 | B-01 pass; không có server nào ở cổng 5173 | 2; khoảng 1 phút | ENV-02, ENV-07 | Như B-01 |
| B-03 | SU-04 | B-01 pass | 3; khoảng 10 phút | ENV-01, ENV-13 | Phần lớn test case rủi ro Cao của PR-01 đến PR-09 nằm ở Component integration, nhanh hơn System [[2]](#ref-2) [[3, §4]](#ref-3) |
| B-04 | SU-12 (hoặc SU-13 cho regression) | B-02 pass | 4; khoảng 8 phút với 4 worker | ENV-02, ENV-04, ENV-06 đến ENV-08, ENV-11, ENV-12 | Rủi ro Cao chỉ kiểm được trên trình duyệt: PR-04 (`next`), PR-05 (header), PR-07 (SS-06) [[3, §1.2]](#ref-3) |
| B-05 | SU-23 | B-03, B-04 đã chạy | 5; 4 session × 60 phút | Server E2E | Test Approach mục 4: exploratory sau vòng tự động đầu |
| B-06 | SU-21 | EN-07 đạt | 6; khoảng 2 giờ (Estimates & Schedule) | ENV-09 | Rủi ro Cao PR-08 với Google thật |
| B-07 | SU-22 | Không phụ thuộc | Bất kỳ lúc nào trong Phase 05 | — | Rủi ro Cao, chỉ kiểm được bằng review |

Trong một suite tự động, thứ tự giữa các file không được cố định theo ưu tiên, trừ smoke và TC-206. Toàn bộ suite chạy trong khoảng 10 phút, nên kết quả của test rủi ro Cao không phải chờ lâu hơn test rủi ro Trung bình.

## 5. Runbook

| Việc | Hướng dẫn |
| --- | --- |
| Lấy đúng version và cài dependency | Checkout branch `test/auth` ở commit cần chạy. Node.js `>=22.22`, pnpm 9. Chạy `pnpm install --frozen-lockfile` ở thư mục gốc. Ghi `git rev-parse HEAD` và `pnpm --filter @crypto-force/api list better-auth` (EN-03) |
| Cấu hình và quyền truy cập | `.env` tạo từ `.env.example`. Test tự động cần `DATABASE_URL` và `BETTER_AUTH_SECRET`; không cần Google hay Resend. Server E2E tự đặt `RESEND_API_KEY` và `EMAIL_FROM` trống. Secrets chỉ nằm trong `.env`, không có trong testware |
| Chuẩn bị và reset data, môi trường | `pnpm db:up`. Database `_test` và `_e2e` được tạo lại tự động ở đầu mỗi lần chạy; không cần reset tay. Chi tiết ở [Test Data](03-test-data.md) và [Test Environment](04-test-environment.md) |
| Chạy toàn bộ, chạy một phần, chạy manual | Toàn bộ: `pnpm test`, rồi `pnpm test:e2e`. Trước `pnpm test:e2e`, dừng `pnpm dev` nếu đang chạy, vì Playwright tự khởi động server E2E và báo lỗi khi cổng 5173 bận. Một procedure: `pnpm --filter @crypto-force/api exec vitest run test/auth/session.test.ts`; một test case: thêm `-t "TC-034"` (Vitest) hoặc `--grep "TC-034"` (Playwright). Thủ công: mục 2.3 |
| Đọc kết quả và lấy evidence | Vitest: output console; thêm `--reporter=json --outputFile=test-results/vitest.json` khi cần file. Playwright: `apps/web/playwright-report/index.html` (`pnpm --filter @crypto-force/web exec playwright show-report`), `apps/web/test-results/results.json`, trace và screenshot của test fail trong `apps/web/test-results/`. Console của server E2E ở `apps/web/.e2e-output/e2e-console.log`. Gắn các file này với Run ID của test log Phase 05 |
| Dừng, chạy lại, xử lý lượt chạy dở | Dừng bằng Ctrl+C; Playwright dừng cả server E2E. Trước khi chạy lại, chép `apps/web/test-results/`, `playwright-report/` và `.e2e-output/` sang thư mục evidence của Run ID, vì lần chạy sau ghi đè các thư mục này |
| Dọn dẹp | `pnpm db:down` khi không cần PostgreSQL. Database `_test` và `_e2e` được giữ tới lần chạy sau để điều tra; xóa tay bằng `DROP DATABASE` nếu cần |

Runbook không chứa secrets.

## 6. Xác minh testware

| Verification ID | Procedure / suite | Cách xác minh | Kết quả | Evidence |
| --- | --- | --- | --- | --- |
| VF-01 | Mọi procedure tự động | Review từng script với Test Cases (input, expected result, số dòng dữ liệu); `pnpm check` (typecheck, ESLint, `check:docs`, Prettier) | Đạt | `pnpm check` pass, 2026-11-18 |
| VF-02 | SU-01 đến SU-04 | Dry run trên `b4ca981`, 2026-11-17 | Đạt: chạy hết. `packages/shared` 24 pass, 9 fail; `apps/web` 7 pass; `apps/api` 120 pass, 41 fail. Mọi fail là dấu hiệu lỗi sản phẩm (Implementation Status mục 4.1), trừ TC-133 và TC-204 chờ quyết định ở TD-10 | Output Vitest, `--reporter=json` |
| VF-03 | SU-11 đến SU-13 | Dry run trên `b4ca981`, 2026-11-17. Lượt 1 tìm 4 lỗi testware và đã sửa: locator heading khớp cả heading của màn chặn (TC-193), locator text khớp 2 phần tử (TC-136), Backspace không xóa ký tự (TC-137), timeout 5 giây quá ngắn khi 4 worker dùng chung dev server (TC-030). Lượt 2 sau khi sửa | Đạt: 161 test (146 của TS-001, 15 của workspace); 139 pass, 21 fail, 1 skip (TC-103 phần S). 20 fail là dấu hiệu lỗi sản phẩm; TC-021 dòng 1 fail vì hết thời gian 30 giây, pass khi chạy lại với timeout 60 giây (2026-11-18) | Output Playwright list reporter, trace và screenshot |
| VF-04 | PROC-01 | Build tham chiếu tạm thời: giới hạn Sign in trong `apps/api/src/configs/auth.ts` đổi thành 3 lần/10 giây như test basis; chạy PROC-01; hoàn nguyên bằng `git checkout` | Đạt: 35/35 test pass, trong đó 16 test fail trên `b4ca981`. Script kiểm đúng test basis, không kiểm hành vi hiện tại | Vitest JSON |
| VF-05 | PROC-01 đến PROC-07 | Mutant build M1 và M2 tạm thời (mục 6.1); chạy SU-03; hoàn nguyên bằng `git checkout` | Đạt: M1 làm fail 51 trên 120 test đang pass. M2 làm fail cả 5 test nhắm tới (TC-077, TC-226 dòng 1 và 2, TC-231 dòng 1 và 2) | Vitest JSON |
| VF-06 | PROC-09 | Mutant W1 (mục 6.1); chạy SU-02 phần `apps/web` | Đạt: TC-160 phần C fail | Vitest JSON |
| VF-07 | PROC-11 đến PROC-16 | Mutant build M1 và W1 đến W19 tạm thời (mục 6.1); chạy SU-12; hoàn nguyên. Lượt đầu bị dừng giữa chừng khi session kết thúc; 35 test còn lại chạy ở lượt sau, 2026-11-18 | Đạt: 74 trên 124 test S đang pass bị fail; smoke SU-11 fail | Playwright list reporter |
| VF-08 | PROC-17 đến PROC-22 | Review bước của procedure với Test Cases | Đạt | File này mục 2.2, 2.3 |
| VF-09 | PROC-06, PROC-11 đến PROC-16 sau review ngày 2026-11-18 | Chạy lại SU-03 và SU-12 trên `b4ca981` sau khi đổi tên file, sửa CH-01 đến CH-05 và chạy hai server E2E. Hai lượt E2E đầu fail thêm 6 đến 7 test vì Vite tối ưu lại dependency giữa lượt chạy và reload trang đang mở; đã sửa bằng `optimizeDeps.entries` và `server.warmup` trong `apps/web/vite.config.ts`, cache riêng cho mỗi server. Lượt cuối chạy với cache trống. TC-140 dòng 2 được chạy thêm với server `withoutGoogle` tạm bật Google | Đạt: `apps/api` 160 test, kết quả như VF-02 (bỏ test API của TC-140). E2E 140 pass, 20 fail, 1 skip; 20 test fail đúng là 20 dấu hiệu lỗi sản phẩm của VF-03. TC-021 dòng 1, TC-060, TC-126, TC-140 dòng 2 pass. TC-140 dòng 2 fail khi server có Google. TC-060, TC-021 dòng 1, TC-126 và phép so theo dạng của CH-03 chưa được thấy fail sau khi sửa | Vitest JSON; Playwright `test-results/results.json` |
| VF-10 | PROC-01, PROC-05, PROC-07, PROC-09 sau audit chất lượng test ngày 2026-11-18 | Đổi testware theo CH-07 và CH-08, rồi chạy trên code hiện tại, trên build tham chiếu của VF-04 và trên mutant M3, M4, M5, W20 (mục 6.1). Chạy testware cũ (commit `2666e5b`) trên cùng mutant để so. Hoàn nguyên mutant bằng `git checkout` | Đạt. Code hiện tại: `apps/api` 119 pass, 41 fail, cùng danh sách fail như VF-09, ở mọi lần chạy khác (ít nhất 5 lần). Một lần (`pnpm test`, chỉ đặt `DATABASE_URL`) có 118 pass, 42 fail; chưa xác định test fail thêm (TD-16); `apps/web` 7 pass. Build tham chiếu: 55/55 test của `rate-limit.test.ts` và `google.test.ts` pass. M3: testware cũ 35/35 pass, tức là TC-005 không fail khi bộ đếm mất lúc khởi động lại; testware mới: TC-005 dòng 1 đến 4 fail, TC-003 pass. M4: testware cũ chỉ TC-009 fail; testware mới: TC-009, TC-010 (d = 10, 11) và TC-019 fail. M4 không nhắm hành vi của TC-019 (mỗi endpoint có bộ đếm riêng), nên TC-019 được xác minh bằng M5: TC-019 fail, TC-009 pass. W20: TC-160 phần C fail ở dòng `//evil.example`. Bỏ riêng điều kiện `//` là mutant tương đương: `url.origin !== base` vẫn chặn URL đó | Vitest verbose reporter |
| VF-11 | PROC-01 sau review ngày 2026-11-18 (điều kiện xác nhận của CH-07) | Thêm assertion về tác dụng của request được chấp nhận ở TC-011, TC-013, TC-014, TC-015, TC-016: request gửi email hoặc tạo tài khoản. Chạy `rate-limit.test.ts` trên code hiện tại và trên mutant M6 (mục 6.1). Chạy TC-011 đến TC-014 của testware cũ (commit `2666e5b`) trên M6 trong một lượt riêng để so, vì hai file chạy chung một lượt dùng chung IP và bộ đếm trong database. Hoàn nguyên M6 bằng bản sao của file | Đạt. Code hiện tại: 19 pass, 16 fail; 16 test fail đúng là các test ở mục 4.1 của Implementation Status (TC-001, TC-002, TC-004 dòng 1 và 3, TC-005, TC-006, TC-007 d = 8, 9, TC-008, TC-020); TC-011 đến TC-016 pass. M6: testware cũ pass ở TC-011, TC-013 và TC-014 (d = 58 đến 61); testware mới fail ở TC-011, TC-013 và TC-014 (d = 60, 61). TC-012 fail ở cả hai, vì test này đã kiểm email từ trước. Chưa có mutant cho TC-015 và TC-016 (Create account trả 200 mà không tạo tài khoản) | Vitest verbose reporter |
| VF-12 | PROC-01 đến PROC-07, PROC-12 đến PROC-15 (TD-08, TD-15) | Mỗi test case trong danh sách cũ của mục 6.2 có một mutant nhắm đúng hành vi mà test case kiểm (mục 6.1, M7 đến M24, W21 đến W25). Với mỗi mutant: cài mutant, chạy riêng các test của test case đó (`-t` của Vitest, `-g` của Playwright), hoàn nguyên, và so từng byte với bản sao trước khi cài. Trước khi cài mutant, chạy các test đó trên code hiện tại: tất cả pass. Mỗi test fail được đọc lại để chắc nó fail ở assertion của expected result, không fail vì mutant làm hỏng bước chuẩn bị. Ba mutant đầu tiên không cho bằng chứng và được thay: M11 làm hỏng cả bước tạo tài khoản ở dòng 2 của TC-112 (thay bằng M11b); bản đầu của M21 chỉ sửa cấu hình, là mutant tương đương vì `better-auth@1.7.25` bắt mọi lỗi của callback gửi email (`runInBackgroundOrAwait`); W25 chỉ sửa schema, là mutant tương đương vì ô `type="email"` của trình duyệt cũng bỏ khoảng trắng (thay bằng W25b). M7 lần đầu không có tác dụng vì chỉ sửa một bản `better-auth` (đoạn về `node_modules` ở mục 6.1); chạy lại sau khi sửa mọi bản thì TC-003 fail | Đạt. Mọi test nhắm tới fail: TC-003 (M7), TC-032 (M8), TC-042 dòng 1 (M9) và dòng 2 (M9b), TC-063 (M10), TC-112 (M11, M11b), TC-203 (M12), TC-208 (M13), TC-232 dòng 2 (M14), TC-031 và TC-040 dòng 2 (M15), TC-062, TC-064, TC-146 (M16), TC-061 (M17), TC-073, TC-074 (M18), TC-207 (M19), TC-228 (M20), TC-192 (M21), TC-224 (M22), TC-206 (M23), TC-204 (M24), TC-202 (W21, W22), TC-123 (W24), phần S của TC-133 (W25b), điều kiện 200 của helper so body ở TC-192 (M26). Ngày 2026-11-19 (TD-17): phần CI của TC-133 fail trên M25 (`An@Example.com` nhận 401 thay vì 200; trước khi cài mutant, test pass), dòng 1 của TC-040 fail trên M15b (phiên không còn sau khi mở lại trình duyệt), dòng 2 của TC-040 pass trên M15b. Bản đầu của M25 chỉ bỏ chữ thường ở route Sign in và là mutant tương đương, vì `findUserByEmail` cũng đổi email sang chữ thường. TC-040 dòng 1 pass trên M15, đúng với phiên được nhớ. Sau mọi lượt chạy, mọi file đã sửa giống bản sao từng byte | Vitest verbose reporter, Playwright list reporter |
| VF-13 | SU-03 và các test S đã sửa, sau thay đổi ngày 2026-11-18 (TC-133, TC-204, helper so body, xóa test skip của TC-103) | Chạy `apps/api` toàn bộ 5 lần (TD-16) và nhóm giới hạn Google 15 lần. Chạy riêng TC-133 phần S và TC-123 trên code hiện tại. Lượt chạy toàn bộ SU-12 đầu tiên bị dừng giữa chừng vì máy thiếu bộ nhớ. Ngày 2026-11-19 chạy lại toàn bộ SU-12 với `--workers=2` để dùng ít bộ nhớ hơn (TD-17) | Đạt. `apps/api`: cả 5 lần 121 pass, 39 fail, cùng một danh sách; 39 test fail đúng là các test của mục 4.1 ở Implementation Status (TC-133 và TC-204 giờ pass). Nhóm Google: 15/15 lần pass 11/11. TC-133 phần S và TC-123 pass. SU-12 toàn bộ: 161 test, 141 pass, 20 fail, không có test skip; 20 test fail đều thuộc mục 4.1 ở Implementation Status: TC-071, TC-072, TC-078 (2 dòng), TC-095 (2 dòng) và TC-098 phần S, TC-135 dòng 1, TC-138, TC-141 (2 dòng), TC-145, TC-175, TC-183, TC-184, TC-187, TC-227, TC-230, TC-242, TC-243 | Vitest JSON reporter, Playwright list reporter |

### 6.1. Lỗi cố ý của mutant build

Mỗi mutant chỉ tồn tại trong lúc chạy xác minh. Sau mỗi lần chạy, `git status` cho thấy `apps/api/src`, `apps/web/app` và `packages/shared/src` không còn thay đổi.

Mutant trong `node_modules`: pnpm có 4 bản `better-auth@1.7.25` (một bản cho mỗi bộ peer dependency). Vitest nạp một bản, còn process API (`tsx`) nạp bản của `apps/api/node_modules`. Phần lớn file của các bản là hard link tới cùng một file trong pnpm store, nên sửa một đường dẫn là sửa mọi bản và cả store. Ngày 2026-11-18, `dist/api/rate-limiter/index.mjs` của bản mà `apps/api` dùng là một file riêng, có lẽ do một lần hoàn nguyên trước đó tách hard link; nội dung vẫn giống bản gốc. Vì vậy mutant được cài vào mọi file khác nhau (theo inode) của 4 bản, và được hoàn nguyên bằng cách ghi đè nội dung, không thay file, để giữ hard link.

| Mutant | Lỗi cố ý |
| --- | --- |
| M1 (`apps/api/src/configs/auth.ts`) | Password tối thiểu 9, tối đa 200; không thu hồi phiên khi đặt password; không tự đăng nhập sau xác minh; link reset 2 giờ; phiên 8 ngày, gia hạn sau 2 ngày; tắt liên kết tài khoản và kiểm state cookie; mỗi phiên mới xóa phiên khác của user; giới hạn gửi email, Create account, Google và callback đổi số lần hoặc cửa sổ; cookie không `Secure`; tắt origin check; không yêu cầu xác minh email; `baseURL` không đặt; gửi email đồng bộ; Google không cho tạo tài khoản mới |
| M2 (`auth.ts`, `env.schema.ts`, `mailer.ts`) | Link xác minh 2 giờ; `baseURL` là `http://evil.example`; production không yêu cầu `RESEND_API_KEY` và `EMAIL_FROM` |
| M3 (`apps/api/src/configs/auth.ts`, trên build tham chiếu của VF-04) | Bộ đếm rate limit để trong bộ nhớ (`storage: 'memory'`), nên mất khi khởi động lại API |
| M4 (`apps/api/src/configs/auth.ts`) | Không cấu hình Google provider dù có `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET`, nên Continue with Google không trả URL của provider |
| M5 (`better-auth/dist/api/rate-limiter/index.mjs` trong `node_modules`, sửa tạm rồi khôi phục và so bằng `cmp`) | Key của bộ đếm bỏ path (`createRateLimitKey(ip, "/shared")`), nên mọi endpoint dùng chung một bộ đếm theo IP |
| M6 (`apps/api/src/configs/auth.ts`) | Email xác minh và email reset chỉ được gửi lần đầu cho mỗi địa chỉ. Các request sau vẫn được 200 nhưng không gửi email |
| W1 đến W19 (`apps/web/app`) | `next` nhận URL bắt đầu bằng `//` và route Auth; Sign out mở Realtime và không báo lỗi; lỗi kiểm phiên hiện màn chặn; người đã đăng nhập vẫn mở được Auth; sửa password không ẩn thông báo không khớp; Keep me signed in tắt mặc định; không có nút Google; ô không có `aria-invalid`; nút hiện password không đổi; Home và End không đổi tab; I've confirmed luôn mở Sign in; Resend không bị vô hiệu; Send reset link không gọi API; token bị từ chối vẫn giữ form; chọn lỗi trong danh sách không chuyển focus; không có dòng báo đích; Back to home mở Realtime; ảnh không có `alt` trên trang Auth; ô password có `autocomplete="off"` |
| W20 (`apps/web/app/utils/auth-redirect.ts`) | `next` bắt đầu bằng `//` hoặc có origin khác được giữ nguyên |
| M7 (`better-auth/dist/api/rate-limiter/index.mjs`) | Khi IP chưa có bộ đếm, như sau khi khởi động lại mà chưa bấm lần nào, request bị chặn thay vì được chấp nhận |
| M8 (`better-auth/dist/api/routes/session.mjs`) | `get-session` không có cookie trả một session thay vì `null` |
| M9 (`better-auth/dist/db/internal-adapter.mjs`) | Phiên trình duyệt (Keep me signed in tắt) có thời hạn 2 ngày ở server thay vì 1 ngày |
| M10 (`apps/api/src/configs/auth.ts`) | Gửi link reset mới xóa các link reset cũ của user |
| M11, M11b (`apps/api/src/configs/auth.ts`) | M11: kiểm password từ chối mọi password ở Create account và New password. M11b: chỉ ở New password |
| M12 (`apps/api/src/configs/auth.ts`) | Password bị bỏ khoảng trắng ở hai đầu trước khi hash và trước khi so |
| M13 (`apps/api/src/configs/auth.ts`) | Một plugin đổi `GET` có tham số query thành `POST` ở các endpoint thay đổi trạng thái |
| M14 (`apps/api/src/configs/auth.ts`) | Callback Google không so `state` với cookie state của client (`account.skipStateCookieCheck`) |
| M15 (`better-auth/dist/cookies/index.mjs`) | Cookie phiên có `Max-Age` cả khi Keep me signed in tắt |
| M16 (`better-auth/dist/api/routes/password.mjs`) | Mở link reset không kiểm token; app nhận token và hiện form |
| M17 (`better-auth/dist/api/routes/password.mjs`, `apps/web/app/pages/Auth/ResetPasswordPage.tsx`) | Password không hợp lệ làm link hết hiệu lực. Hai phần: form gửi request mà không chờ kiểm độ dài, và API xóa token trước khi kiểm độ dài. Mỗi phần riêng là mutant tương đương, vì phần kia vẫn giữ link |
| M18 (`better-auth/dist/api/routes/email-verification.mjs`) | Link xác minh của email đã xác minh vẫn đăng nhập lại |
| M19 (`apps/api/src/app.ts`) | API cho mọi origin, kèm credentials |
| M20 (`better-auth/dist/api/routes/session.mjs`) | `get-session` trả `Cache-Control: private, max-age=60` thay vì `no-store` |
| M21 (`better-auth/dist/context/create-context.mjs`, `apps/api/src/configs/auth.ts`) | Gửi email reset xong mới trả lời, và thư viện truyền lỗi gửi email ra ngoài. Chỉ phần cấu hình là mutant tương đương với `better-auth@1.7.25`; phần thư viện là rủi ro khi đổi version |
| M22 (`better-auth/dist/api/routes/password.mjs`) | Forgot password trả message khác cho email chưa đăng ký |
| M23 (`better-auth/dist/db/internal-adapter.mjs`) | Token phiên dài 16 ký tự (khoảng 95 bit) thay vì 32 |
| M24 (`apps/api/drizzle/0000_auth.sql`) | Migration tạo sẵn một tài khoản |
| M9b (`better-auth/dist/db/internal-adapter.mjs`) | Phiên trình duyệt có thời hạn 8 ngày ở server |
| M15b (`better-auth/dist/cookies/index.mjs`) | Cookie phiên không bao giờ có `Max-Age`, kể cả khi Keep me signed in bật |
| M25 (`better-auth/dist/api/routes/sign-in.mjs`, `better-auth/dist/db/internal-adapter.mjs`) | Sign in tìm tài khoản theo email như đã nhập, không đổi sang chữ thường. Hai chỗ, vì mỗi chỗ riêng là mutant tương đương |
| M26 (`better-auth/dist/api/routes/password.mjs`) | Send reset link luôn lỗi 500 |
| W21, W22 (`apps/web/app/pages/Auth/components/AuthField.tsx`) | W21: ô password chặn dán. W22: ô password có `autocomplete="off"` |
| W24 (`apps/web/app/routes/workspace-layout.tsx`) | Lỗi khi kiểm phiên được coi là "không có phiên", nên màn chặn hiện thay cho lỗi tải |
| W25, W25b (`packages/shared/src/schemas/auth.schema.ts`, `apps/web/app/pages/Auth/SignInPage.tsx`) | W25: schema của ô email không bỏ khoảng trắng ở hai đầu (mutant tương đương). W25b: thêm ô email của Sign in thành `type="text"`, nên không còn chỗ nào bỏ khoảng trắng |

### 6.2. Test case tự động được chấp nhận bằng review

Trước ngày 2026-11-18, 33 test case tự động pass trên `b4ca981` nhưng chưa fail trên mutant nào (TD-08). Sau VF-12, 22 test case trong số đó có ít nhất một dòng fail trên mutant: 19 test case ưu tiên Cao và TC-192, TC-224, TC-206. Trong 19 test case ưu tiên Cao, còn một dòng chưa thấy fail: dòng 1 của TC-232 (dưới đây). Dòng 1 của TC-040 fail trên M15b ngày 2026-11-19 (TD-17). Các dòng và test case dưới đây được chấp nhận bằng review assertion với expected result, không có mutant riêng (quyết định ở TD-08, Implementation Status mục 4.2):

- Dòng 1 của TC-232 (ưu tiên Cao): callback thiếu `state` và cookie state. Better Auth từ chối request này ở hai chỗ độc lập: khi thiếu `state`, và khi không tìm thấy state đã lưu. Vì vậy mutant chỉ có một lỗi đều là mutant tương đương.
- 11 test case ưu tiên Trung bình: TC-134, TC-136, TC-170, TC-172, TC-173, TC-178, TC-181, TC-190, TC-191, TC-205, TC-225. Mỗi test so đúng giá trị của expected result (text, heading, giá trị của ô, email của phiên), và dùng locator, helper đã thấy fail ở test case khác (VF-07).

Dấu hiệu lỗi sản phẩm phát hiện khi dry run được ghi ở Implementation Status mục 4 để báo thành defect ở Phase 05; kết quả dry run không thay cho kết quả chạy test chính thức.

## 7. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q2-01 | Mỗi procedure có mục tiêu, ưu tiên, test case theo thứ tự, bước khởi đầu, bước kết thúc và vị trí có version theo quy ước lưu testware | IN-02, IN-09 | Đạt |
| Q2-02 | Assertion khớp expected result của đúng version test case; assertion quan trọng đã được xác nhận fail khi hành vi sai | RC-01 | Đạt với ngoại lệ có ghi: mọi test case ưu tiên Cao có dòng fail trên lỗi sản phẩm hoặc mutant. Ngoại lệ: dòng 1 của TC-232 chưa thấy fail (mutant tương đương, chấp nhận bằng review). 11 test case ưu tiên Trung bình được chấp nhận bằng review (mục 6.2) |
| Q2-03 | Script dùng điểm truy cập đã xác định trong contract hoặc test ID, không dựa vào chi tiết nội bộ dễ thay đổi | RC-04 | Đạt với ngoại lệ có ghi: UI dùng role, label và text; API dùng route của Better Auth. Ngoại lệ: database (bảng `user`, `account`, `verification`, `session`) để tạo dữ liệu và đặt thời hạn, định dạng token xác minh của Better Auth (ENV-06) |
| Q2-04 | Kết quả và evidence được xuất theo quy ước ghi kết quả đã thống nhất | RC-06 | Đạt: quy ước được chốt ngày 2026-11-18 (TD-07); testware xuất các file ở mục 5 |
| Q2-05 | Testware tái sử dụng đã được chạy thử trên version hiện tại | RC-05 | Đạt: `global-setup.ts`, `test-database.ts`, `support.ts` chạy trong VF-02, VF-03 |
| Q2-06 | Cách chọn test của mỗi suite lặp lại được; thứ tự và phụ thuộc giữa test được khai báo | IN-10 | Đạt |
| Q2-07 | Chính sách retry được khai báo; lượt fail trước retry vẫn được ghi lại | — | Đạt |
| Q2-08 | Lịch chạy sắp theo độ ưu tiên có nguồn | IN-04, IN-10 | Đạt |
| Q2-09 | Người khác tác giả chạy được testware chỉ bằng runbook; runbook không chứa secrets | — | Chưa đủ bằng chứng, được chấp nhận: dự án chỉ có một người, nên không có người khác chạy thử. Job `test` và `e2e` của CI chạy testware từ checkout sạch, chỉ bằng lệnh của runbook; lần chạy CI đầu tiên sẽ là bằng chứng. Runbook không chứa secrets |

**Người review / ngày:** Product owner duyệt báo cáo Phase 04, 2026-11-18. VF-12, mục 6.2 và Q2-02, Q2-04, Q2-09 được cập nhật sau lần duyệt đó, chưa review

## References

1. <a id="ref-1"></a>[Test Cases](../../03-design/output/04-test-cases.md) — commit `497541d`, 2026-11-17
2. <a id="ref-2"></a>[Risk Register](../../02-planning/output/02-risk-register.md) — commit `341584a`, 2026-11-17
3. <a id="ref-3"></a>[Test Approach](../../02-planning/output/03-test-approach.md) — commit `341584a`, 2026-11-17
