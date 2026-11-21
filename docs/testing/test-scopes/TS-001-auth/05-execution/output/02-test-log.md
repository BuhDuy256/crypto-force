# Test Log

Đọc file này để biết các lượt chạy của TS-001 ngày 2026-11-19: session thủ công PROC-17 (RUN-001 đến RUN-009), lượt chạy tự động SU-01, SU-11, SU-04, SU-13 (RUN-010 đến RUN-013) và hai review PROC-18 (RUN-014, RUN-015). Mỗi lượt ghi build, kết quả thực tế so với expected result và evidence. Chưa có exploratory session (mục 3).

## 1. Phạm vi

| Trường | Nội dung |
| --- | --- |
| Đối tượng được kiểm thử | RUN-001 đến RUN-009: commit `b35a791` (HEAD khi ghi), `better-auth@1.7.25`. Server là `pnpm dev` của product owner với `.env` gốc (Google OAuth thật, Resend thật). Từ `b4ca981` đến `b35a791`, `git diff --stat b4ca981 HEAD -- apps/api/src apps/web/app packages` ghi 8 file đổi: `apps/api/src/configs/auth.ts` và `apps/web/app/utils/auth-redirect.ts` (mỗi file chỉ bỏ `export` của một hằng số), `apps/web/app/api/.gitkeep`, cấu hình test của `packages/shared` (`package.json`, `tsconfig.json`, `vitest.config.ts`) và hai file test. Tác giả đọc diff của hai file `.ts` và không thấy đổi hành vi; chưa đọc diff của file cấu hình. RUN-010 đến RUN-015: commit `7cdb0f5` (EN-03: `git rev-parse HEAD`), `better-auth@1.7.25`, working tree không có file đã sửa (`git status --short` chỉ có `HANDOFF.md` và `skills-lock.json` chưa theo dõi). Từ `b35a791` đến `7cdb0f5` chỉ có commit tài liệu và kết quả |
| Khoảng thời gian ghi | 2026-11-19 07:15:45 – 07:18:19 (PROC-17, UTC+7); 07:33 – 07:56 (PROC-17 chạy lại); 08:10:38 – 08:22:50 (RUN-010 đến RUN-013) |
| Nguồn kết quả tự động | RUN-010 đến RUN-013: output của Vitest và Playwright, chạy bởi agent trên máy của product owner (Windows 11, Docker Desktop, PostgreSQL của `pnpm db:up`). Lệnh nằm ở mục 2 |
| Nơi lưu evidence | EV-001 và EV-002 nằm trong file này. EV-003 là video trên máy của product owner, không lưu trong repo (mục 4). EV-010 đến EV-013 là output thô trong thư mục `evidence/` cạnh `output/` |

Thời gian trong video: 00:00 là 07:15:45.

## 2. Lượt chạy

Người thực hiện: product owner. Agent đọc log server, database và video rồi ghi lại kết quả.

| Run ID | Instance ID / test case version | Dữ liệu / cấu hình | Build | Người thực hiện / thời điểm | Expected / actual | Trạng thái | Evidence IDs | Defect / anomaly IDs |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| RUN-001 | TC-195; v1 | Tài khoản Google test #1 (chưa có tài khoản Crypto Force); môi trường S với Google thật (ENV-09) | `b35a791` | Product owner; 07:16:40 – 07:16:50 | Expected: Google hiện màn chọn tài khoản; sau khi chọn, mở Realtime với phiên. Actual: Google hiện màn "Choose an account"; sau khi chọn tài khoản #1, trang mở `/realtime` và menu hiện tên và email của tài khoản. Server trả 302 `/realtime`. Database có user mới `email_verified = true` và một account `google` không có password | Passed | EV-001, EV-002, EV-003 (00:55–01:05) | Không có |
| RUN-002 | TC-196; v1 | Như RUN-001, sau Sign out lúc 07:16:59 | `b35a791` | Product owner; 07:17:00 – 07:17:09 | Expected: Google vẫn hiện màn chọn tài khoản; phiên Google vẫn còn. Actual: sau Sign out, bấm Continue with Google hai lần; cả hai lần Google hiện lại màn chọn tài khoản, liệt kê các tài khoản đã đăng nhập, không hỏi password. Tab Gmail mở từ 07:16:25 vẫn đăng nhập. Lượt thứ hai chọn tài khoản Google test #2 và mở Realtime | Passed | EV-001, EV-003 (01:15, 01:25, 00:45) | Không có |
| RUN-003 | TC-197; v1 | Create account với một email `…@gmail.comj` (không phải hộp thư của chủ tài khoản Resend) | `b35a791` | Product owner; 07:16:22 | Expected: email tới hộp thư; link xác minh được tài khoản. Actual: Auth hiện "Check your email". Tài khoản được tạo, chưa xác minh. Server ghi lỗi: Resend từ chối gửi (HTTP 403, `validation_error`, "You can only send testing emails to your own email address …"). Không có email nào | Blocked | EV-001, EV-002, EV-003 (00:20–00:50) | BL-01 |
| RUN-004 | TC-198; v1 | Forgot password cho tài khoản Google-only #2 (không phải tài khoản của TC-197) | `b35a791` | Product owner; 07:17:50 | Expected: email tới hộp thư; link mở form Choose a new password. Actual: Auth hiện "If an account exists for …, a reset link is on its way". Database có token reset hạn 1 giờ. Server ghi cùng lỗi Resend 403. Không có email; không mở được link | Blocked | EV-001, EV-002, EV-003 (02:05–02:30) | BL-01 |
| RUN-005 | TC-103 phần S; v2 | Create account với `…@gmail.comj`; Google test #1 có email `…@gmail.com` | `b35a791` | Product owner; 07:16:22 và 07:16:40 | Expected: không có phiên; không liên kết; Auth báo email đã đăng ký, gợi ý Sign in bằng password hoặc Reset password. Actual: Google tạo tài khoản mới đã xác minh và mở Realtime. Hai email khác nhau (`gmail.comj` và `gmail.com`), nên chưa có tài khoản chưa xác minh trùng email với Google. Setup không khớp bước 5 của PROC-17 | Inconclusive | EV-002, EV-003 | AN-01 |
| RUN-006 | TC-103 phần S; v2 | Create account bằng đúng email của Google test #1; tài khoản Crypto Force của email này đã có (U2, đã xác minh, tạo ở RUN-001 và chưa bị xóa) | `b35a791` | Product owner; khoảng 07:33:12 – 07:34:10 | Expected: như RUN-005, với một tài khoản chưa xác minh trùng email Google. Actual: Create account hiện "Check your email"; database không có user mới. Continue with Google, chọn Google test #1, mở Realtime với phiên của U2; Sign out. Không có tài khoản chưa xác minh nên không phải kịch bản TC-103 | Inconclusive | EV-004, EV-008 | AN-01 |
| RUN-007 | TC-103 phần S; v2 | Database đã xóa. Create account bằng đúng email của Google test #1 (tạo U unverified lúc 07:37:20), không mở link xác minh, không bấm "I've confirmed". Rồi Continue with Google, chọn Google test #1 | `b35a791` | Product owner; 07:37:04 – 07:37:40 | Expected: không có phiên; không liên kết; Auth báo email đã đăng ký, gợi ý Sign in bằng password hoặc Reset password. Actual: không có phiên (`session` 0 dòng) và không liên kết (U chỉ có account `credential`, EV-009). Trang quay về `/sign-in?provider=google&error=account_not_linked` với thông báo chung "Google sign-in didn't finish. It may have been cancelled or blocked. Try again, or use your email below.". Không có thông báo email đã đăng ký, không gợi ý Reset password | Failed | EV-005, EV-009 | AN-02 (DEF-19) |
| RUN-008 | TC-197; v1 | Create account bằng email của chủ tài khoản Resend, địa chỉ gốc không có `+tag` (`EMAIL_FROM=onboarding@resend.dev`); database đã xóa user cũ của email này | `b35a791` | Product owner; 07:52:21 – 07:52:56 | Expected: email tới hộp thư; link xác minh được tài khoản. Lệch so với test case: địa chỉ không có `+tag` (DV-01). Actual: email tới và sau khi mở link, trang mở Realtime (chỉ có lời product owner; không có log hay video). Database: user tạo 07:52:21, `email_verified = true` lúc 07:52:56 (35 giây sau); chỉ có account `credential`. Database chứng minh link xác minh đã được dùng; không chứng minh email tới hộp thư hay trang Realtime. Bảng `session` lúc 07:54 có 0 dòng, nên chưa kiểm được phiên bằng database | Passed | EV-006 | Không có |
| RUN-009 | TC-198; v1 | Tài khoản của RUN-008 (email của chủ tài khoản Resend) | `b35a791` | Product owner; khoảng 07:54 – 07:55:33 | Expected: email tới hộp thư; link mở form Choose a new password. Actual: email tới và link hoạt động (chỉ có lời product owner; không có log hay video; form Choose a new password không được ghi lại). Database: không còn dòng `reset-password` trong `verification` (token đã dùng); account `credential` của user này cập nhật lúc 07:55:33, tức là password đã được đổi, nên link reset đã được dùng và form đã được gửi. Sau đó `session` có 0 dòng | Passed | EV-007 | Không có |
| RUN-010 | SU-01 (PROC-00 phần CI); smoke API | `pnpm --filter @crypto-force/api exec vitest run test/smoke.test.ts`; ENV-01; DA-01 | `7cdb0f5` | Agent; 08:10:38 – 08:10:48 | Expected: tạo tài khoản, xác minh email, Sign in chạy được (EN-04). Actual: 1 test, 1 pass | Passed | EV-010 | Không có |
| RUN-011 | SU-11 (PROC-00 phần S); smoke E2E | `pnpm --filter @crypto-force/web exec playwright test e2e/smoke.spec.ts --workers=1`; ENV-02, ENV-07 | `7cdb0f5` | Agent; 08:10:56 – 08:12:03 | Expected: "create an account, confirm the email, then sign in" pass (EN-05). Actual: 1 test, 1 pass (1,1 phút) | Passed | EV-011 | Không có |
| RUN-012 | SU-04 (PROC-01 đến PROC-09); `pnpm test` | ENV-01, ENV-13; database `_test` tạo lại từ migration | `7cdb0f5` | Agent; 08:12:09 – 08:14:46 | Expected: mọi test pass (expected result của từng TC ở Test Cases). Actual: `packages/shared` 33 test, 24 pass, 9 fail; `apps/web` 7 test, 7 pass; `apps/api` 160 test, 121 pass, 39 fail. Tổng 200 test, 152 pass, 48 fail, 0 skip. 48 test fail thuộc 28 test case: TC-001, 002, 004 đến 008, 020, 033, 036, 046, 047, 049, 050, 068, 090 đến 098, 110, 111, 113, 114. Chi tiết ở mục 2.4 | Failed (48 test); phần còn lại Passed | EV-012 | DEF-01 đến DEF-08 (mục 2.4) |
| RUN-013 | SU-13 (PROC-11 đến PROC-16, test workspace); `playwright test` | Hai server E2E (ENV-07); `--workers=2` vì máy 16 GB còn khoảng 2,5 GB trống; không có `pnpm dev` | `7cdb0f5` | Agent; 08:15:11 – 08:22:50 | Expected: mọi test pass. Actual: 161 test, 141 pass, 20 fail, 0 skip (7,6 phút). 20 test fail thuộc 17 test case: TC-071, 072, 078, 095, 098, 135, 138, 141, 145, 175, 183, 184, 187, 227, 230, 242, 243. Chi tiết ở mục 2.4 | Failed (20 test); phần còn lại Passed | EV-013 | DEF-01, DEF-08 đến DEF-18 (mục 2.4) |
| RUN-014 | TC-209; v1 (PROC-18) | Review code trong `node_modules`, version trong `pnpm-lock.yaml`: `better-auth@1.7.25`, `@better-auth/core@1.7.25`, `@better-auth/utils@0.5.1` | `7cdb0f5` | Agent; khoảng 08:13 | Expected: token phiên lấy từ CSPRNG, không đoán trước được. Actual: `createSession` đặt `token: generateId(32)` (`better-auth/dist/db/internal-adapter.mjs:304`); không có `overrideAll` ở route nào trong `better-auth/dist/api` (grep không có kết quả). `generateId` gọi `createRandomStringGenerator("a-z", "A-Z", "0-9")` (`@better-auth/core/dist/utils/id.mjs`). Hàm này lấy byte từ `crypto.getRandomValues` (`@better-auth/utils/dist/random.mjs:31`), bỏ byte từ 248 trở lên (dòng 23, 35), nên 62 ký tự có xác suất bằng nhau. `apps/api/src/configs/auth.ts` không có `generateId`, `databaseHooks` hay `overrideAll` (grep không có kết quả). Khớp bản review ngày 2026-11-18 (TD-14); version không đổi | Passed (product owner duyệt ngày 2026-11-19 kết luận, PROC-18) | EV-014 | Không có |
| RUN-015 | TC-200; v1 (PROC-18) | Security tại `c23d848` (khác `d6c0541` mà TC-200 ghi, DV-03); UI đọc từ source tại `7cdb0f5` | `7cdb0f5` | Agent; khoảng 08:14 | Expected: Security mô tả 6.1.1, 6.1.3, 7.1.1, 7.1.2, 7.1.3; không luồng nào bắt đổi password theo thời gian (6.2.10); ba màn không có gợi ý password hay câu hỏi bí mật (6.4.2). Actual: xem bảng EV-015 ở mục 4. Cả 7 mục là Có | Passed, sau khi chạy lại phần UI (xem dòng bên dưới). Lượt đầu 08:14 là Inconclusive vì 6.4.2 chỉ đọc source (DV-04); 6.2.10 chỉ tìm theo từ khóa. Chờ product owner duyệt; DV-03 | EV-015, EV-018 | Không có |
| RUN-016 | TC-200; v1 (PROC-18), chạy lại phần UI | Ba màn `/sign-in`, `/sign-up`, `/forgot-password` mở từ `pnpm dev`; không nhập dữ liệu; Security `c23d848` (DV-03) | `440fc76` (không đổi `apps` và `packages` so với `7cdb0f5`) | Agent; khoảng 08:55 | Expected: ba màn không có gợi ý password hay câu hỏi bí mật (6.4.2). Actual: không màn nào có; chỉ có dòng "At least 8 characters." ở Create account, là yêu cầu độ dài. Với 6.2.10: không tìm thấy luồng nào bắt đổi password theo thời gian (tìm theo từ khóa ở RUN-015; đọc ba màn trên và màn Choose a new password ở `ResetPasswordPage.tsx`) | Passed (product owner duyệt ngày 2026-11-19; DV-03) | EV-018 | Không có |

| Trạng thái | Định nghĩa |
| --- | --- |
| Passed | Actual result khớp expected result; có evidence theo quy ước |
| Failed | Actual result khác expected result; dẫn tới anomaly report |
| Blocked | Không thể hoàn tất vì một trở ngại đã xác định; dẫn tới blocker |
| Inconclusive | Đã chạy nhưng chưa đủ căn cứ kết luận; dẫn tới anomaly report hoặc phân tích |

### 2.1. Phân tích Blocked và Inconclusive

**BL-01 (RUN-003, RUN-004): Resend ở chế độ test, không gửi tới địa chỉ khác.** Theo thông báo lỗi của Resend ("You can only send testing emails to your own email address … verify a domain at resend.com/domains"), Resend chỉ gửi tới email của chủ tài khoản Resend. Product owner cho biết `EMAIL_FROM=onboarding@resend.dev` (lời của product owner trong session, không có trong log server). Precondition của TC-197 ("email là hộp thư của chủ tài khoản Resend") không đạt, vì cả hai email trong session đều khác email này. Đây là lỗi môi trường (ENV-09), không phải lỗi sản phẩm. Phần sản phẩm làm đúng: tài khoản được tạo, token reset được tạo, và lỗi gửi email được ghi vào log server. Ghi chú để quyết định sau, chưa phải defect: khi Resend từ chối gửi, Auth vẫn hiện "Check your email". Test basis chưa nói rõ hành vi này; Better Auth không chuyển lỗi gửi email tới response (hàm `runInBackgroundOrAwait` bắt lỗi của callback gửi email; xem VF-12 ở Procedures & Suites). Cách chạy lại: dùng đúng email của chủ tài khoản Resend, hoặc xác minh một domain ở Resend rồi đổi `EMAIL_FROM`.

**AN-01 (RUN-005): setup sai.** Bước 5 của PROC-17 yêu cầu Create account bằng đúng email của tài khoản Google test. Trong session, email dùng ở Create account có đuôi `gmail.comj`. Vì vậy Google không gặp tài khoản chưa xác minh nào. Kết quả này không nói gì về TC-103. Cách chạy lại: xóa tài khoản Crypto Force của Google test #1, Create account bằng đúng email Google test #1 (Resend không gửi được thư không ảnh hưởng, vì tài khoản vẫn được tạo, chưa xác minh), rồi bấm Continue with Google và chọn tài khoản đó. RUN-006 lặp lại lỗi setup này, vì U2 chưa bị xóa trước khi chạy. Expected: không có phiên, không liên kết, Auth báo email đã đăng ký và gợi ý Sign in hoặc Reset password.

**AN-02 (RUN-007): thông báo của Auth không khớp expected result.** Phần dữ liệu đúng: không phiên, không liên kết. Phần giao diện sai: `GoogleButton.tsx` hiện một thông báo cho mọi lỗi Google (huỷ, bị chặn, `account_not_linked`) và không đọc mã lỗi. Test basis [[2]](#ref-2) cho trường hợp này yêu cầu báo email đã đăng ký và gợi ý Sign in bằng password hoặc Reset password. Ứng viên defect sản phẩm; cần defect report ở Phase 05 (TD-13). Test tự động không bắt được lỗi này: phần CI của TC-103 (`google.test.ts`, test "TC-103 Google with the email of an unverified account") chỉ kiểm URL chuyển hướng có `error=`, và không có test E2E nào kiểm thông báo hiển thị (TD-19).

**"I've confirmed, continue" không ảnh hưởng kết quả.** Nút này chỉ gọi kiểm tra phiên (`VerifyEmailPage.tsx`, `continueAfterConfirming`); không có phiên thì chuyển sang Sign in với email điền sẵn. Nó không ghi gì vào database, nên không đổi trạng thái tài khoản chưa xác minh. Các kết quả khác nhau giữa RUN-005, RUN-006 và RUN-007 đến từ trạng thái database: RUN-005 dùng email khác (`gmail.comj`), RUN-006 có tài khoản Google đã xác minh trùng email, RUN-007 là lần đầu có tài khoản chưa xác minh trùng email. Không video nào ghi lại lượt bấm "I've confirmed" rồi Continue with Google, nên tôi chưa kiểm được trường hợp đó bằng bằng chứng.

**Chưa chắc: nút "Waiting for Google…" ở đầu RUN-006.** `waiting` là `isPending || isSuccess`, và request thành công thì trình duyệt rời trang. Nếu người dùng quay lại bằng nút Back, trang có thể được khôi phục từ bộ nhớ đệm với nút vẫn bị khóa. Đây là suy luận từ code, chưa có log hay lần tái hiện.

### 2.2. Quan sát thêm trong session

Các bước này không thuộc PROC-17 và không phải một lượt chạy của test case nào. Chúng khớp với test basis [[2]](#ref-2):

| Thời điểm | Thao tác | Actual | Khớp test basis |
| --- | --- | --- | --- |
| 07:15:59 | Sign in với email chưa đăng ký | 401, thông báo chung "That email and password don't match" | Có |
| 07:17:35 | Create account bằng email của tài khoản Google-only #2 | "Check your email"; server ghi email "You already have a Crypto Force account" (không gửi được do BL-01). Không liên kết, không đặt password: tài khoản #2 vẫn chỉ có account `google`, không có password | Có |
| 07:17:46 | Sign in bằng email và password của tài khoản Google-only #2 | 401, thông báo chung như trên | Có |
| 07:17:50 | Forgot password cho tài khoản #2 | Thông báo chung "If an account exists …"; token hạn 1 giờ (08:17:50) | Có |

### 2.4. Phân tích test Failed của RUN-012 và RUN-013

Mỗi test fail được đối chiếu với dấu hiệu lỗi sản phẩm ở Implementation Status mục 4.1, ghi từ dry run trên `b4ca981`. Testware đã được kiểm ở Phase 04: build tham chiếu VF-04 cho PROC-01 pass khi giới hạn đúng test basis, và các mutant ở Procedures & Suites mục 6. Từng test fail trong RUN-012 và RUN-013 trùng với một dấu hiệu ở mục 4.1; không có test fail ngoài danh sách đó. Hai bộ số khớp lượt dry run: `apps/api` 39 fail, `packages/shared` 9 fail, SU-12 20 fail. Nguyên nhân của mọi dòng dưới đây được xếp là Product (lỗi sản phẩm); chưa ai xác nhận từng lỗi là lỗi sản phẩm hay requirement cần đổi. Mỗi lỗi có một defect report ở [Defect Reports](03-defect-reports.md).

| Defect | Run | Test fail (số test) |
| --- | --- | --- |
| DEF-01 | RUN-012 | TC-001 (1), TC-002 (1), TC-004 dòng 1 và 3 (2), TC-005 dòng 1 đến 4 (4), TC-006 (1), TC-007 d = 8, 9 (2), TC-008 d = 8, 9, 10, 11 (4), TC-020 (1) |
| DEF-01 | RUN-013 | TC-138 (1), TC-175 (1) |
| DEF-02 | RUN-012 | TC-033 dòng 1 đến 4 (4) |
| DEF-03 | RUN-012 | TC-036 (1), TC-049 tại 30 ngày + 0 s và + 1 s (2) |
| DEF-04 | RUN-012 | TC-046 tại 3.600 s (1), TC-047 tại 7 ngày (1), TC-050 tại 1 ngày (1) |
| DEF-05 | RUN-012 | TC-068 (1) |
| DEF-06 | RUN-012 | TC-110, TC-111, TC-113, TC-114, mỗi test case 2 dòng (8) |
| DEF-07 | RUN-012 | TC-096 tại 4 và 65 emoji (2), TC-097 tại 4 và 65 emoji (2) |
| DEF-08 | RUN-012 | `packages/shared`: TC-090 và TC-091 (2), TC-092 và TC-093 (2), TC-094 và TC-095 (2), TC-096 (1), TC-097 (1), TC-098 (1) |
| DEF-08 | RUN-013 | TC-095 tại 101 và 102 ký tự (2), TC-098 tại 101 emoji (1) |
| DEF-09 | RUN-013 | TC-071 (1) |
| DEF-10 | RUN-013 | TC-072 (1), TC-078 dòng 1 và 2 (2), TC-145 (1) |
| DEF-11 | RUN-013 | TC-242 (1), TC-243 (1) |
| DEF-12 | RUN-013 | TC-135 dòng 1 (1) |
| DEF-13 | RUN-013 | TC-141 dòng 1 và 2 (2) |
| DEF-14 | RUN-013 | TC-183 (1) |
| DEF-15 | RUN-013 | TC-184 (1) |
| DEF-16 | RUN-013 | TC-187 (1) |
| DEF-17 | RUN-013 | TC-227 (1) |
| DEF-18 | RUN-013 | TC-230 (1) |
| DEF-19 | RUN-007 | TC-103 phần S (1) |

Cộng RUN-012: 39 + 9 = 48 test. Cộng RUN-013: 20 test. Không retry (Procedures & Suites mục 3). Các test nằm trong TD-16 không fail ở hai lượt này: TC-021 dòng 3 và TC-017 pass. Việc này không loại được lỗi chập chờn: mỗi test chỉ chạy một lần trong đợt này.

## 3. Exploratory session

Không có session nào trong đợt này. CHR-01 đến CHR-04 (PROC-19 đến PROC-22) chưa chạy: product owner hoãn vô thời hạn ngày 2026-11-19 (Execution Status mục 2.3, TD-20).

## 4. Evidence

| Evidence ID | Run / session | Loại | Vị trí | Điều được chứng minh |
| --- | --- | --- | --- | --- |
| EV-001 | RUN-001 đến RUN-005 | Log server (`pino`), đã lọc từ 07:15:45, bỏ mã OAuth, cookie, header | Bảng bên dưới | Thứ tự request, status và lỗi gửi email |
| EV-002 | RUN-001, RUN-003 đến RUN-005 | Dòng database (`crypto_force`), đã che email | Bảng bên dưới | Tài khoản, account và token được tạo hay không |
| EV-004 | RUN-006 | Video màn hình, 0:59 | `C:\Users\Duy\Videos\2026-11-19 07-33-12.mp4` (máy của product owner; không lưu trong repo, có email thật và mật khẩu hiện rõ) | Điều hiển thị trên UI. Không có log server cho đoạn này |
| EV-005 | RUN-007 | Video màn hình, 0:36 | `C:\Users\Duy\Videos\2026-11-19 07-37-04.mp4` (máy của product owner; không lưu trong repo, có email thật và mật khẩu hiện rõ) | Điều hiển thị trên UI, gồm URL có `error=account_not_linked`. Không có log server cho đoạn này; database lúc 07:38 xác nhận phần dữ liệu |
| EV-006 | RUN-008 | Dòng database (`crypto_force`), đã che email; lời của product owner | Bảng `user` lúc 07:54: một user có domain của chủ tài khoản Resend, `email_verified = true`, cập nhật 07:52:56 | Link xác minh đã được mở và đã xác minh tài khoản. Không có video hay log server của lượt này |
| EV-007 | RUN-009 | Dòng database (`crypto_force`), đã che email; lời của product owner | Bảng `verification` rỗng lúc 07:55; `account.updated_at = 07:55:33` | Token reset được tạo, dùng, và password được đổi. Không có video hay log server của lượt này |
| EV-008 | RUN-006 | Dòng database (`crypto_force`), đã che email | Bảng bên dưới, lúc 07:36 | Chưa có user mới sau Create account |
| EV-009 | RUN-007 | Dòng database (`crypto_force`), đã che email | Bảng bên dưới, lúc 07:38 | U chưa xác minh, chỉ có account `credential`, không có phiên |
| EV-003 | RUN-001 đến RUN-005 | Video màn hình, 2:34 | `C:\Users\Duy\Videos\2026-11-19 07-15-45.mp4` (máy của product owner) | Điều hiển thị trên UI và trong Gmail |
| EV-010 | RUN-010 | Output Vitest, 9 dòng | `evidence/RUN-010-su01-vitest-smoke.txt` | 1 test pass, thời điểm bắt đầu 08:10:43 |
| EV-011 | RUN-011 | Output Playwright | `evidence/RUN-011-su11-playwright-smoke.txt` | 1 test pass trong 1,1 phút |
| EV-012 | RUN-012 | Output `pnpm test` của ba workspace | `evidence/RUN-012-su04-pnpm-test.txt` | Tên, thông báo lỗi và tổng số của 48 test fail; 152 test pass |
| EV-013 | RUN-013 | Output Playwright (list reporter) | `evidence/RUN-013-su13-playwright-all.txt` | Tên, thông báo lỗi và tổng số của 20 test fail; 141 test pass. Dòng cuối "Command playwright not found" do pnpm in khi lệnh thoát với mã khác 0; không phải lỗi của test |
| EV-014 | RUN-014 | Dấu ra của lệnh đọc mã nguồn `better-auth` | `evidence/RUN-014-tc209-source.txt`, ghi lúc 08:38 từ cùng file như lúc RUN-014 | Nguồn của token phiên |
| EV-017 | RUN-013 | Ảnh chụp màn hình và ngữ cảnh lỗi của 20 test fail | `evidence/RUN-013-artifacts/` | Trạng thái giao diện lúc test fail; không có `trace.zip`, `results.json`, báo cáo HTML (DV-08) |
| EV-018 | RUN-016 | Snapshot ba màn Auth từ `pnpm dev` bằng `playwright-cli` | `evidence/RUN-016-tc200-ui-screens.txt` | Ba màn không có gợi ý password hay câu hỏi bí mật (6.4.2) |
| EV-016 | RUN-010 đến RUN-015 | Dấu ra của lệnh EN-03: HEAD, `git status`, version `better-auth`, `node -v` | `evidence/EN-03-environment.txt`, ghi lúc 08:38, sau các lượt chạy; HEAD khi ghi là `440fc76` (commit tài liệu trên `7cdb0f5`, không đổi `apps` và `packages`) | Commit và version của build |
| EV-015 | RUN-015 | Tài liệu và source | Bảng bên dưới | Kết quả từng mục ASVS |

Output thô của EV-010 đến EV-013 không có secrets: tìm các mẫu key Resend, cookie, `secret`, `password=`, email Gmail của product owner không có kết quả. Playwright không lưu trace, screenshot và `results.json` vào repo; thư mục `apps/web/test-results/` và `playwright-report/` còn trên máy của product owner đến lần chạy sau (Procedures & Suites mục 5).

**EV-015: kết quả TC-200.** Security tại `c23d848`; UI đọc từ source tại `7cdb0f5`, chưa chụp màn hình.

| Mục ASVS | Có / Không | Vị trí |
| --- | --- | --- |
| 6.1.1 Rate limit theo IP kèm lý do | Có | `docs/architecture/23-security.md` mục "Giới hạn số lần đăng nhập" (dòng 30 đến 32): tính theo IP "để người khác không thể cố ý nhập sai nhằm khóa tài khoản" |
| 6.1.3 Giới hạn của Sign in và Google | Có | Cùng mục (3 request trong 10 giây); dòng Google ở bảng phiên (dòng 24): cùng giới hạn với Sign in, bộ đếm riêng, callback 100 request trong 10 giây |
| 7.1.1 Thời hạn 7 ngày, 30 ngày, không idle timeout | Có | Dòng 13 (cookie 7 ngày) và dòng 14 (tuyệt đối 30 ngày; "Idle timeout không áp dụng") |
| 7.1.2 Không giới hạn phiên đồng thời | Có | Dòng 23 |
| 7.1.3 Quan hệ với phiên Google | Có | Dòng 24: phiên Crypto Force độc lập với phiên Google |
| 6.2.10 Không luồng nào bắt đổi password theo thời gian | Có | Tìm `rotate`, `expire.*password`, `password.*age` trong `apps/api/src` và `apps/web/app/pages/Auth`: không có kết quả. Tìm theo từ khóa, chưa đọc từng luồng |
| 6.4.2 Không gợi ý password, không câu hỏi bí mật ở Sign in, Create account, Forgot password | Có | `SignInPage.tsx`, `SignUpPage.tsx`, `ForgotPasswordPage.tsx`: không có trường câu hỏi bí mật. Duy nhất một `hint` là "At least 8 characters." ở `SignUpPage.tsx:100`; đây là yêu cầu độ dài, không phải gợi ý password đã lưu |

EV-003 có mật khẩu hiện rõ ở ô Password và email thật, nên không được lưu vào repo. Mật khẩu này nên được đổi nếu dùng ở nơi khác.

**EV-001: log server từ 07:15:45.** Log trong terminal còn lẫn các dòng trước 07:15:45 (trước khi xóa database); các dòng đó bị bỏ.

| Giờ | Req | Request | Status | Ghi chú |
| --- | --- | --- | --- | --- |
| 07:15:59 | 61 | `POST /api/auth/sign-in/email` | 401 | `[better-auth] User not found` (cảnh báo này cũng ghi khi tài khoản không có credential; `better-auth` `sign-in.mjs:321`) |
| 07:16:22 | 62 | `POST /api/auth/sign-up/email` | 200 | Lỗi: gửi email "Confirm your Crypto Force account" thất bại, Resend 403 `validation_error` |
| 07:16:40 | 64 | `POST /api/auth/sign-in/social` | 200 | Chuyển tới Google |
| 07:16:49 | 65 | `GET /api/auth/callback/google` | 302 | Tới `/realtime` |
| 07:16:59 | 68 | `POST /api/auth/sign-out` | 200 | |
| 07:17:02 | 72 | `POST /api/auth/sign-in/social` | 200 | Không có callback sau request này; còn một dòng `auth-state` trong database |
| 07:17:09 | 73 | `POST /api/auth/sign-in/social` | 200 | |
| 07:17:13 | 74 | `GET /api/auth/callback/google` | 302 | Tới `/realtime` |
| 07:17:18 | 76 | `POST /api/auth/sign-out` | 200 | |
| 07:17:35 | 80 | `POST /api/auth/sign-up/email` | 200 | Lỗi: gửi email "You already have a Crypto Force account" thất bại, Resend 403 |
| 07:17:46 | 82 | `POST /api/auth/sign-in/email` | 401 | `User not found` |
| 07:17:50 | 83 | `POST /api/auth/request-password-reset` | 200 | Lỗi: gửi email "Reset your Crypto Force password" thất bại, Resend 403 |

**EV-002: database `crypto_force` lúc 07:21 (sau session).**

| Bảng | Dòng |
| --- | --- |
| `user` | U1: email `…@gmail.comj`, `email_verified = false`, tạo 07:16:22. U2: Google test #1 (`…@gmail.com`), `email_verified = true`, tạo 07:16:49. U3: Google test #2, `email_verified = true`, tạo 07:17:13 |
| `account` | U1: `credential`, có password. U2: `google`, không có password. U3: `google`, không có password |
| `verification` | `auth-state` tạo 07:17:02 (từ request 72); `reset-password` tạo 07:17:50, hạn 08:17:50 |
| `session` | 0 dòng (cả hai phiên Google đã Sign out) |

**EV-008: database lúc 07:36 (trước RUN-007).** Có 3 user, không user nào mới sau 07:17:13: `…@gmail.comj` chưa xác minh (07:16:22), Google test #1 đã xác minh (07:16:49), Google test #2 đã xác minh (07:17:13). Có 3 account (`credential`, `google`, `google`). Có hai dòng `verification`: `reset-password` (07:17:50) và `auth-state` (07:33:16).

**EV-009: database lúc 07:38 (sau RUN-007).** Có 1 user: email của Google test #1, `email_verified = false`, tạo 07:37:20. Có 1 account `credential` có password, tạo 07:37:20. Bảng `verification` rỗng. Bảng `session` có 0 dòng.

**Tên user.** EV-002 dùng U1, U2, U3 cho dữ liệu lúc 07:21. RUN-007 dùng "U" cho user tạo lúc 07:37:20. User này, cùng các user của EV-002, đã bị xóa trước 07:45; vì vậy database lúc 07:54 (EV-006) không còn chúng.

**Dòng không có lượt chạy trong log.** Database lúc 07:54 còn hai user tạo lúc 07:45: một user Google đã xác minh (07:45:35) và một user `credential` chưa xác minh (07:45:57). Không có video, log hay lời của product owner cho lượt này, nên log không ghi lượt chạy nào cho chúng.

### 2.3. Sai lệch so với PROC-17

| ID | Sai lệch | Ảnh hưởng |
| --- | --- | --- |
| DV-01 | Bước 3 (TC-197) dùng địa chỉ `<hộp thư>+ts001-<ngày giờ>`. RUN-008 dùng địa chỉ gốc, không có `+tag`, và xóa user cũ của địa chỉ này trước khi chạy | Expected result đã đạt với địa chỉ gốc. Dạng `+tag` chưa được thử, nên chưa biết Resend có chấp nhận hay không |
| DV-02 | Bước 2 (TC-196) yêu cầu mở `https://accounts.google.com` ở tab khác để ghi phiên Google còn hay không. Video chỉ có một tab Gmail đã đăng nhập (07:16:25) và màn chọn tài khoản của Google lần thứ hai | Phiên Google còn được suy ra từ màn chọn tài khoản liệt kê các tài khoản đã đăng nhập và từ tab Gmail; không có tab `accounts.google.com` riêng |
| DV-03 | TC-200 `v1` ghi Security `d6c0541`; PROC-18 và test basis của TS-001 ghi `c23d848`. Hai commit khác nhau ở file `23-security.md` (`git diff --stat d6c0541 c23d848`: 13 dòng thêm, 7 dòng xóa). RUN-015 dùng `c23d848`, giống HEAD | Kết quả của TC-200 đúng cho `c23d848`, không cho `d6c0541`. Nguồn của test case cần sửa, hoặc product owner xác nhận chọn `c23d848` (Execution Status mục 6) |
| DV-04 | PROC-18 bước 1 cho phép ghi vị trí trong tài liệu hoặc screenshot; TC-200 ghi "xem các màn Auth". RUN-015 đọc source của ba màn, không mở giao diện | 6.4.2 được kiểm bằng source; một `hint` hay nhãn tạo bởi code ngoài ba file đã đọc có thể bị bỏ sót |
| DV-05 | RUN-012 và RUN-013 ghi theo suite; kết quả từng test nằm trong output thô (EV-012, EV-013) và bảng ở mục 2.4, không có một dòng Run ID cho mỗi test instance | Q2-01 chỉ đạt ở mức suite cho 276 test tự động của TS-001 đã Passed (152 + 141 − 2 smoke − 15 test workspace); không truy được thời điểm chạy riêng của từng test |
| DV-06 | SU-13 chạy với `--workers=2`, không dùng số worker mặc định (Procedures & Suites mục 4 dự kiến 4 worker, khoảng 8 phút) | Số worker làm đổi thời gian chạy (7,6 phút). Lượt chạy SU-12 với 2 worker ở Phase 04 (VF-13) cho cùng kết quả: 141 pass, 20 fail |
| DV-07 | File Execution Readiness lập sau RUN-001 đến RUN-015; RC-05 chỉ đạt một phần khi các lượt chạy bắt đầu, nên readiness là Chưa sẵn sàng | Các lượt chạy đã diễn ra khi chưa có quyết định bắt đầu của người có thẩm quyền; kết quả vẫn ghi theo evidence |
| DV-08 | Lệnh `playwright test --list` lúc 08:38 ghi đè `apps/web/test-results/results.json` và `playwright-report/` của RUN-013 trước khi chép (Procedures & Suites mục 5). Output console (EV-013) và thư mục artifact của 20 test fail còn nguyên | `results.json` và báo cáo HTML của RUN-013 mất. Ảnh chụp và ngữ cảnh lỗi của 20 test fail lưu ở `evidence/RUN-013-artifacts/`; `trace.zip` không lưu (nặng) |

## 5. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q2-01 | Mỗi lượt chạy xác định instance, test case version, dữ liệu, cấu hình, build, người thực hiện và thời điểm | RC-05 | Đạt một phần: RUN-001 đến RUN-011, RUN-014, RUN-015 đạt. RUN-012 và RUN-013 xác định theo suite, không theo từng test (DV-05) |
| Q2-02 | Mỗi lượt chạy có expected và actual result, hoặc link tới nơi giữ chúng | RC-02 | Đạt một phần: mọi lượt chạy có expected và actual; expected của TC-200 dẫn tới Security `d6c0541`, khác test basis `c23d848` (RC-02, DV-03) |
| Q2-03 | Build ghi trong mỗi lượt chạy khớp với build trong môi trường tại thời điểm chạy | RC-01 | Đạt một phần: RUN-001 đến RUN-009 chạy trên working tree của product owner khi `pnpm dev` chạy; commit `b35a791` là HEAD lúc ghi, chưa kiểm HEAD lúc 07:15. RUN-010 đến RUN-015 đạt: commit `7cdb0f5`, working tree không có file đã sửa |
| Q2-04 | Mọi lượt chạy Failed hoặc Inconclusive dẫn tới anomaly report hoặc phân tích | IN-09 | Đạt: AN-01 và BL-01 ở mục 2.1; mọi test Failed của RUN-007, RUN-012 và RUN-013 có defect report DEF-01 đến DEF-19 (mục 2.4). AN-02 là DEF-19 |
| Q2-05 | Lượt chạy lại được thêm thành dòng mới; không ghi đè kết quả cũ | — | Đạt |
| Q2-06 | Evidence truy cập được, gắn với Run ID hoặc Session ID, không chứa secrets hoặc dữ liệu cá nhân thật | IN-08 | Đạt một phần: EV-001 và EV-002 đã lọc. EV-003 chứa dữ liệu thật và chỉ nằm trên máy của product owner |
| Q2-07 | Mọi lượt chạy có evidence đúng mức đã quy ước cho nhóm rủi ro của nó | IN-04, IN-08 | Đạt một phần: RUN-001, RUN-002 dựa vào video (không trong repo) và log server. RUN-008, RUN-009 dựa vào database và lời product owner; không có log hay video |
| Q2-08 | Exploratory session có charter, thời lượng, phạm vi đã khám phá và phát hiện | — | N/A: không có session. CHR-01 đến CHR-04 chưa chạy (Not Run, Execution Status mục 2.3) |

**Người review / ngày:** chưa có.

## References

1. <a id="ref-1"></a>[Test Cases](../../03-design/output/04-test-cases.md) — TC-103 `v2`, TC-195 đến TC-198 `v1`; expected result của mục 2
2. <a id="ref-2"></a>[Authentication](../../../../../UCs/authentication.md) — test basis ở commit `c23d848`, khi đó tại `docs/design/prototype/docs/requirements/authentication.md`
