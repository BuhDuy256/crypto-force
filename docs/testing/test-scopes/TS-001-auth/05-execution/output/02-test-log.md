# Test Log

Đọc file này để biết session thủ công PROC-17 của TS-001 ngày 2026-11-19 đã diễn ra thế nào: chạy gì, trên build nào, kết quả thực tế so với expected result, và evidence đi kèm. File này mới ghi một session. Phase 05 mới có file này: chưa có Execution Readiness, Execution Status và Defect Reports.

## 1. Phạm vi

| Trường | Nội dung |
| --- | --- |
| Đối tượng được kiểm thử | Commit `b35a791` (HEAD khi ghi), `better-auth@1.7.25`. Server là `pnpm dev` của product owner với `.env` gốc (Google OAuth thật, Resend thật). Từ `b4ca981` đến `b35a791`, `git diff --stat b4ca981 HEAD -- apps/api/src apps/web/app packages` ghi 8 file đổi: `apps/api/src/configs/auth.ts` và `apps/web/app/utils/auth-redirect.ts` (mỗi file chỉ bỏ `export` của một hằng số), `apps/web/app/api/.gitkeep`, cấu hình test của `packages/shared` (`package.json`, `tsconfig.json`, `vitest.config.ts`) và hai file test. Tác giả đọc diff của hai file `.ts` và không thấy đổi hành vi; chưa đọc diff của file cấu hình |
| Khoảng thời gian ghi | 2026-11-19 07:15:45 – 07:18:19 (UTC+7) |
| Nguồn kết quả tự động | Không có. Đây là session thủ công |
| Nơi lưu evidence | EV-001 và EV-002 nằm trong file này. EV-003 là video trên máy của product owner, không lưu trong repo (mục 4) |

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
| RUN-007 | TC-103 phần S; v2 | Database đã xóa. Create account bằng đúng email của Google test #1 (tạo U unverified lúc 07:37:20), không mở link xác minh, không bấm "I've confirmed". Rồi Continue with Google, chọn Google test #1 | `b35a791` | Product owner; 07:37:04 – 07:37:40 | Expected: không có phiên; không liên kết; Auth báo email đã đăng ký, gợi ý Sign in bằng password hoặc Reset password. Actual: không có phiên (`session` 0 dòng) và không liên kết (U chỉ có account `credential`, EV-009). Trang quay về `/sign-in?provider=google&error=account_not_linked` với thông báo chung "Google sign-in didn't finish. It may have been cancelled or blocked. Try again, or use your email below.". Không có thông báo email đã đăng ký, không gợi ý Reset password | Failed | EV-005, EV-009 | AN-02 |
| RUN-008 | TC-197; v1 | Create account bằng email của chủ tài khoản Resend, địa chỉ gốc không có `+tag` (`EMAIL_FROM=onboarding@resend.dev`); database đã xóa user cũ của email này | `b35a791` | Product owner; 07:52:21 – 07:52:56 | Expected: email tới hộp thư; link xác minh được tài khoản. Lệch so với test case: địa chỉ không có `+tag` (DV-01). Actual: email tới và sau khi mở link, trang mở Realtime (chỉ có lời product owner; không có log hay video). Database: user tạo 07:52:21, `email_verified = true` lúc 07:52:56 (35 giây sau); chỉ có account `credential`. Database chứng minh link xác minh đã được dùng; không chứng minh email tới hộp thư hay trang Realtime. Bảng `session` lúc 07:54 có 0 dòng, nên chưa kiểm được phiên bằng database | Passed | EV-006 | Không có |
| RUN-009 | TC-198; v1 | Tài khoản của RUN-008 (email của chủ tài khoản Resend) | `b35a791` | Product owner; khoảng 07:54 – 07:55:33 | Expected: email tới hộp thư; link mở form Choose a new password. Actual: email tới và link hoạt động (chỉ có lời product owner; không có log hay video; form Choose a new password không được ghi lại). Database: không còn dòng `reset-password` trong `verification` (token đã dùng); account `credential` của user này cập nhật lúc 07:55:33, tức là password đã được đổi, nên link reset đã được dùng và form đã được gửi. Sau đó `session` có 0 dòng | Passed | EV-007 | Không có |

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

## 3. Exploratory session

Không có session nào trong đợt này.

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

## 5. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q2-01 | Mỗi lượt chạy xác định instance, test case version, dữ liệu, cấu hình, build, người thực hiện và thời điểm | RC-05 | Đạt |
| Q2-02 | Mỗi lượt chạy có expected và actual result, hoặc link tới nơi giữ chúng | RC-02 | Đạt |
| Q2-03 | Build ghi trong mỗi lượt chạy khớp với build trong môi trường tại thời điểm chạy | RC-01 | Đạt một phần: build là working tree của product owner khi `pnpm dev` chạy. Commit `b35a791` là HEAD lúc ghi; chưa kiểm tra HEAD lúc 07:15 |
| Q2-04 | Mọi lượt chạy Failed hoặc Inconclusive dẫn tới anomaly report hoặc phân tích | IN-09 | Đạt: AN-01, AN-02 và BL-01 ở mục 2.1. Chưa có file Defect Reports; AN-02 cần defect report (TD-13) |
| Q2-05 | Lượt chạy lại được thêm thành dòng mới; không ghi đè kết quả cũ | — | Đạt |
| Q2-06 | Evidence truy cập được, gắn với Run ID hoặc Session ID, không chứa secrets hoặc dữ liệu cá nhân thật | IN-08 | Đạt một phần: EV-001 và EV-002 đã lọc. EV-003 chứa dữ liệu thật và chỉ nằm trên máy của product owner |
| Q2-07 | Mọi lượt chạy có evidence đúng mức đã quy ước cho nhóm rủi ro của nó | IN-04, IN-08 | Đạt một phần: RUN-001, RUN-002 dựa vào video (không trong repo) và log server. RUN-008, RUN-009 dựa vào database và lời product owner; không có log hay video |
| Q2-08 | Exploratory session có charter, thời lượng, phạm vi đã khám phá và phát hiện | — | N/A: không có session |

**Người review / ngày:** chưa có.

## References

1. <a id="ref-1"></a>[Test Cases](../../03-design/output/04-test-cases.md) — TC-103 `v2`, TC-195 đến TC-198 `v1`; expected result của mục 2
2. <a id="ref-2"></a>[Authentication](../../../../../design/prototype/docs/requirements/authentication.md) — test basis ở commit `c23d848`
