# Test Procedures & Suites

Đọc file này để biết các test procedure, script và suite của TS-001 đã được tạo, cách chạy chúng theo thứ tự nào, và bằng chứng cho thấy chúng kiểm đúng expected result.

## 1. Phạm vi

| Trường | Nội dung |
| --- | --- |
| Nơi lưu testware | `apps/api/test/` (Component integration), `packages/shared/test/` và `apps/web/app/utils/auth-redirect.test.ts` (Component), `apps/web/e2e/auth/*.spec.ts` và `apps/web/e2e/auth/fixtures.ts`, `apps/web/e2e/environment.ts` (System), file này mục 2.2 (thủ công) |
| Snapshot | Branch `test/auth`, commit chứa thư mục `04-implementation/` |
| Framework và công cụ | `vitest@5.1.0`, `@playwright/test@1.65.1` với Chromium, `@axe-core/playwright@4.14.0`, `tsx@4.23.15`, `pg@8.23.1` |
| Test design được hiện thực hóa | Test Cases [[1]](#ref-1), 165 test case `v1` và 4 charter, commit `497541d` |

## 2. Procedures và scripts

### 2.1. Script tự động

Tên mỗi test bắt đầu bằng Test case ID, kèm số dòng khi test case có nhiều dòng dữ liệu, để kết quả của Vitest và Playwright truy vết được tới test case. Mỗi dòng dữ liệu là một test riêng, chạy lại từ precondition.

| Procedure ID | Test case IDs theo thứ tự chạy | Mục tiêu | Ưu tiên | Loại | Khởi đầu | Kết thúc và dọn dẹp | Vị trí / version | Verification IDs |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PROC-00 | Smoke, không phải test case (EN-04, EN-05) | Build kiểm thử được: tạo tài khoản, xác minh email, Sign in | Cao | Automated | CI: database `_test` vừa tạo. S: server E2E vừa khởi động | Không cần | `apps/api/test/smoke.test.ts`, `apps/web/e2e/smoke.spec.ts` | VF-01, VF-02, VF-03 |
| PROC-01 | TC-001, TC-002, TC-003, TC-004, TC-005, TC-006, TC-007, TC-008, TC-011, TC-012, TC-013, TC-014, TC-015, TC-016, TC-020 | Khóa Sign in và giới hạn số lần (MD-01, MD-05) | Cao | Automated, CI | Harness mới và đồng hồ giả cho mỗi test; IP mới từ `198.51.100.0/24` | `clock.restore()` | `apps/api/test/auth/rate-limit.test.ts` | VF-01, VF-02, VF-04, VF-05 |
| PROC-02 | TC-032, TC-033, TC-034, TC-035, TC-036, TC-039, TC-041, TC-042, TC-044, TC-045, TC-046, TC-047, TC-048, TC-049, TC-050 | Vòng đời phiên và thời hạn (MD-02, MD-07) | Cao | Automated, CI | Harness mới, đồng hồ giả, tài khoản mới | `clock.restore()` | `apps/api/test/auth/session.test.ts` | VF-01, VF-02, VF-05 |
| PROC-03 | TC-063, TC-066, TC-068, TC-069, TC-077 | Link reset và link xác minh (MD-03, MD-04) | Cao | Automated, CI | Harness mới, đồng hồ giả | `clock.restore()` | `apps/api/test/auth/links.test.ts` | VF-01, VF-02, VF-05 |
| PROC-04 | TC-090, TC-091, TC-092, TC-093, TC-096, TC-097 (phần CI), TC-110, TC-111, TC-112, TC-113, TC-114, TC-201, TC-203 | Quy tắc password (MD-06, MD-09, MD-14) | Cao | Automated, CI | Harness mới; stub Pwned Passwords về `clean` | Không cần | `apps/api/test/auth/password.test.ts` | VF-01, VF-02, VF-05 |
| PROC-05 | TC-009, TC-010, TC-017, TC-018, TC-019, TC-043, TC-100, TC-101, TC-102, TC-103 (phần CI), TC-104, TC-199, TC-232 | Continue with Google (MD-05, MD-08, MD-13, MD-15) | Cao | Automated, CI | Harness có Google; OAuth provider giả về trạng thái rỗng | `clock.restore()` | `apps/api/test/auth/google.test.ts` | VF-01, VF-02, VF-05 |
| PROC-06 | TC-133, TC-150 (phần CI), TC-185, TC-229, TC-192, TC-204, TC-205, TC-208, TC-220 dòng 3, TC-221 dòng 2, TC-222, TC-223, TC-224, TC-226, TC-231 | Kết quả Sign in, lỗi gửi email, ASVS, cấu hình bảo mật (MD-11 đến MD-15) | Cao, Trung bình | Automated, CI | Harness có Google | TC-204 xóa database `_test_fresh`; TC-226 dừng process API con | `apps/api/test/auth/security.test.ts` | VF-01, VF-02, VF-05 |
| PROC-07 | TC-206 | Token phiên đủ ngẫu nhiên | Trung bình | Automated, CI | Chạy sau mọi file CI khác (`vitest.config.ts`) | Không cần | `apps/api/test/auth/token-entropy.test.ts` | VF-01, VF-02 |
| PROC-08 | TC-090 đến TC-098 (phần C) | Độ dài trong schema form (MD-06) | Cao, Trung bình | Automated, C | Không cần | Không cần | `packages/shared/test/auth.schema.test.ts` | VF-01, VF-02 |
| PROC-09 | TC-160 (phần C) | Hàm chọn đích sau Sign in (MD-18) | Cao | Automated, C | Không cần | Không cần | `apps/web/app/utils/auth-redirect.test.ts` | VF-01, VF-02 |
| PROC-11 | TC-021, TC-138, TC-175 | Giới hạn số lần nhìn từ UI | Cao | Automated, S | IP cố định từ `198.51.100.0/24` | Đóng context | `apps/web/e2e/auth/limits.spec.ts` | VF-01, VF-03 |
| PROC-12 | TC-030, TC-031, TC-037, TC-038, TC-040, TC-120, TC-121, TC-122, TC-123, TC-124, TC-125, TC-126, TC-193, TC-194 | Phiên trong trình duyệt, màn chặn, Sign out (MD-02, MD-10, MD-13) | Cao, Trung bình | Automated, S | Context mới, IP mới | Đóng context | `apps/web/e2e/auth/session.spec.ts` | VF-01, VF-03, VF-07 |
| PROC-13 | TC-060, TC-061, TC-062, TC-064, TC-065, TC-067, TC-070, TC-071, TC-072, TC-073, TC-074, TC-075, TC-076, TC-078, TC-145, TC-146, TC-186, TC-187, TC-188, TC-189, TC-190, TC-191 | Link reset, link xác minh, luồng Reset password (MD-03, MD-04, MD-13) | Cao, Trung bình | Automated, S | Context mới; link lấy từ console | Đóng context | `apps/web/e2e/auth/links.spec.ts` | VF-01, VF-03, VF-07 |
| PROC-14 | TC-094, TC-095, TC-098, TC-130, TC-131, TC-132, TC-134, TC-135, TC-136, TC-137, TC-139, TC-140 (dòng 2 trên server `withoutGoogle`), TC-141, TC-142, TC-143, TC-144, TC-150, TC-160, TC-170 đến TC-184, TC-103 (phần S, Bị chặn) | Trường form, kết quả Sign in, `next`, luồng Auth (MD-06, MD-11, MD-12, MD-13, MD-18) | Cao, Trung bình | Automated, S | Context mới | Đóng context | `apps/web/e2e/auth/forms.spec.ts` | VF-01, VF-03, VF-07 |
| PROC-15 | TC-202, TC-207, TC-220 dòng 1 và 2, TC-221 dòng 1, TC-225, TC-227, TC-228, TC-230 | ASVS và cấu hình bảo mật qua API thật (MD-14, MD-15) | Cao, Trung bình | Automated, S | Context mới | Đóng context | `apps/web/e2e/auth/security.spec.ts` | VF-01, VF-03, VF-07 |
| PROC-16 | TC-240, TC-241, TC-242, TC-243, TC-244, TC-245, TC-246 | Accessibility của 6 màn Auth (MD-17) | Trung bình | Automated, S | Context mới | Đóng context | `apps/web/e2e/auth/a11y.spec.ts` | VF-01, VF-03, VF-07 |

### 2.2. Procedure thủ công

| Procedure ID | Test case IDs theo thứ tự chạy | Mục tiêu | Ưu tiên | Loại | Khởi đầu | Kết thúc và dọn dẹp | Vị trí / version | Verification IDs |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PROC-17 | TC-195, TC-196, TC-197, TC-198 | Google OAuth và Resend thật (SI) | Cao, Trung bình | Manual | EN-07 đạt. Dừng mọi server đang chạy, rồi chạy `pnpm dev` với `.env` gốc (có Google và Resend). Trình duyệt ở chế độ thường, đã đăng nhập tài khoản Google test | Sign out; xóa tài khoản Crypto Force vừa tạo khỏi database dev (`DELETE FROM "user" WHERE email = '<email>'`) | File này, mục 2.3 | VF-08 |
| PROC-18 | TC-200 | Review tài liệu và UI theo ASVS | Cao | Manual (review) | Security tại `c23d848`; UI tại `b4ca981` mở bằng `pnpm dev` | Không cần | File này, mục 2.3 | VF-08 |
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
5. Ghi commit, version `better-auth` (EN-03), và kết quả từng bước vào test log của Phase 05. Không ghi email hay mật khẩu thật vào tài liệu.

**PROC-18** (người chạy: agent, product owner duyệt kết luận): đối chiếu từng mục của TC-200 với Security tại `c23d848` và với 3 màn Sign in, Create account, Forgot password. Với mỗi mục, ghi Có hoặc Không kèm vị trí trong tài liệu hoặc screenshot.

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

### 6.1. Lỗi cố ý của mutant build

Mỗi mutant chỉ tồn tại trong lúc chạy xác minh. Sau mỗi lần chạy, `git status` cho thấy `apps/api/src`, `apps/web/app` và `packages/shared/src` không còn thay đổi.

| Mutant | Lỗi cố ý |
| --- | --- |
| M1 (`apps/api/src/configs/auth.ts`) | Password tối thiểu 9, tối đa 200; không thu hồi phiên khi đặt password; không tự đăng nhập sau xác minh; link reset 2 giờ; phiên 8 ngày, gia hạn sau 2 ngày; tắt liên kết tài khoản và kiểm state cookie; mỗi phiên mới xóa phiên khác của user; giới hạn gửi email, Create account, Google và callback đổi số lần hoặc cửa sổ; cookie không `Secure`; tắt origin check; không yêu cầu xác minh email; `baseURL` không đặt; gửi email đồng bộ; Google không cho tạo tài khoản mới |
| M2 (`auth.ts`, `env.schema.ts`, `mailer.ts`) | Link xác minh 2 giờ; `baseURL` là `http://evil.example`; production không yêu cầu `RESEND_API_KEY` và `EMAIL_FROM` |
| W1 đến W19 (`apps/web/app`) | `next` nhận URL bắt đầu bằng `//` và route Auth; Sign out mở Realtime và không báo lỗi; lỗi kiểm phiên hiện màn chặn; người đã đăng nhập vẫn mở được Auth; sửa password không ẩn thông báo không khớp; Keep me signed in tắt mặc định; không có nút Google; ô không có `aria-invalid`; nút hiện password không đổi; Home và End không đổi tab; I've confirmed luôn mở Sign in; Resend không bị vô hiệu; Send reset link không gọi API; token bị từ chối vẫn giữ form; chọn lỗi trong danh sách không chuyển focus; không có dòng báo đích; Back to home mở Realtime; ảnh không có `alt` trên trang Auth; ô password có `autocomplete="off"` |

### 6.2. Test case tự động chưa thấy fail

34 test case dưới đây pass trên `b4ca981` và không fail trên mutant nào: TC-003, TC-019, TC-031, TC-032, TC-040, TC-042, TC-061, TC-062, TC-063, TC-064, TC-073, TC-074, TC-112, TC-134, TC-136, TC-146, TC-170, TC-172, TC-173, TC-178, TC-181, TC-190, TC-191, TC-192, TC-202, TC-203, TC-205, TC-206, TC-207, TC-208, TC-224, TC-225, TC-228, TC-232. Phần lớn dùng chung helper và assertion đã thấy fail ở test case khác (ví dụ `getSession`, `passwordWorks`, `sessionSetCookie`, `expiredScreen`), nhưng chưa có bằng chứng trực tiếp cho từng test case. Các test case này được ghi "Đã tạo, chưa xác minh" ở Implementation Status (TD-08).

Dấu hiệu lỗi sản phẩm phát hiện khi dry run được ghi ở Implementation Status mục 4 để báo thành defect ở Phase 05; kết quả dry run không thay cho kết quả chạy test chính thức.

## 7. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q2-01 | Mỗi procedure có mục tiêu, ưu tiên, test case theo thứ tự, bước khởi đầu, bước kết thúc và vị trí có version theo quy ước lưu testware | IN-02, IN-09 | Đạt |
| Q2-02 | Assertion khớp expected result của đúng version test case; assertion quan trọng đã được xác nhận fail khi hành vi sai | RC-01 | Không đạt hoàn toàn: mọi procedure tự động đã thấy fail (VF-02 đến VF-07), nhưng 34 test case chưa có bằng chứng fail riêng (mục 6.2, TD-08) |
| Q2-03 | Script dùng điểm truy cập đã xác định trong contract hoặc test ID, không dựa vào chi tiết nội bộ dễ thay đổi | RC-04 | Đạt với ngoại lệ có ghi: UI dùng role, label và text; API dùng route của Better Auth. Ngoại lệ: database (bảng `user`, `account`, `verification`, `session`) để tạo dữ liệu và đặt thời hạn, định dạng token xác minh của Better Auth (ENV-06) |
| Q2-04 | Kết quả và evidence được xuất theo quy ước ghi kết quả đã thống nhất | RC-06 | Không đạt: quy ước chưa được duyệt (IN-11, TD-07). Testware xuất các file ở mục 5 |
| Q2-05 | Testware tái sử dụng đã được chạy thử trên version hiện tại | RC-05 | Đạt: `global-setup.ts`, `test-database.ts`, `support.ts` chạy trong VF-02, VF-03 |
| Q2-06 | Cách chọn test của mỗi suite lặp lại được; thứ tự và phụ thuộc giữa test được khai báo | IN-10 | Đạt |
| Q2-07 | Chính sách retry được khai báo; lượt fail trước retry vẫn được ghi lại | — | Đạt |
| Q2-08 | Lịch chạy sắp theo độ ưu tiên có nguồn | IN-04, IN-10 | Đạt |
| Q2-09 | Người khác tác giả chạy được testware chỉ bằng runbook; runbook không chứa secrets | — | Chưa đủ bằng chứng: chưa có người khác chạy thử runbook. Runbook không chứa secrets |

**Người review / ngày:** Chưa review

## References

1. <a id="ref-1"></a>[Test Cases](../../03-design/output/04-test-cases.md) — commit `497541d`, 2026-11-17
2. <a id="ref-2"></a>[Risk Register](../../02-planning/output/02-risk-register.md) — commit `341584a`, 2026-11-17
3. <a id="ref-3"></a>[Test Approach](../../02-planning/output/03-test-approach.md) — commit `341584a`, 2026-11-17
