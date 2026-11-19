# Test Environment

Đọc file này để biết môi trường test của TS-001 gồm những thành phần nào, thành phần nào là thật và thành phần nào được mock, cách dựng và reset, và kết quả kiểm tra sẵn sàng.

## 1. Phạm vi

| Trường | Nội dung |
| --- | --- |
| Yêu cầu môi trường | Data & Environment Requirements [[1]](#ref-1) mục 2, ER-01 đến ER-13, commit `eb1be83` |
| Cấu hình môi trường | `docker-compose.yml` (PostgreSQL), `apps/api/vitest.config.ts`, `apps/api/test/global-setup.ts`, `apps/api/test/support/`, `apps/web/playwright.config.ts`, `apps/web/e2e/server.ts`, `apps/web/e2e/auth/fixtures.ts`, `apps/web/e2e/environment.ts`, `apps/web/vitest.config.ts`, `packages/shared/package.json`; branch `test/auth`, commit chứa thư mục `04-implementation/` |
| Thời điểm kiểm tra | 2026-11-17, 22:00 đến 23:30 (GMT+7) |

## 2. Thành phần môi trường

Version ghi theo `pnpm-lock.yaml` và lệnh `--version` trên máy chạy, ngày 2026-11-17. Máy chạy: Windows 11, Node.js `v22.23.5`, pnpm `9.15.9`. Code sản phẩm tại `b4ca981`: `git log b4ca981..HEAD -- apps packages` không có commit nào. Ngày 2026-11-18 có thay đổi không đổi build: bỏ `export` ở hai hằng số (Implementation Status mục 1).

| Env ID | Thành phần | Version / cấu hình thực tế | Loại | Hành vi được mô phỏng / không đại diện | Dựng và reset | Nơi truy cập | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ENV-01 | PostgreSQL và Better Auth cho Component integration (ER-01) | PostgreSQL 17.10 (`postgres:17-alpine`), `better-auth@1.7.25`, `vitest@5.1.0`. Database `<POSTGRES_DB>_test`. Mỗi test gọi `auth.handler` của một instance tạo bằng `createAuth` với cấu hình sản phẩm | Thật | N/A | `pnpm db:up`; `global-setup.ts` xóa và tạo lại database từ migration ở đầu mỗi lần `pnpm test`. File chạy tuần tự (`fileParallelism: false`); `smoke.test.ts` chạy đầu, `auth/token-entropy.test.ts` chạy cuối | `DATABASE_URL` trong `.env` | Agent |
| ENV-02 | PostgreSQL cho System (ER-02) | Hai database, một cho mỗi server E2E của ENV-07: `<POSTGRES_DB>_e2e` và `<POSTGRES_DB>_e2e_no_google`, tách khỏi database dev (PJ-03) | Thật | N/A | `e2e/server.ts` xóa, tạo lại và chạy `pnpm db:migrate` ở đầu mỗi lần `pnpm test:e2e` | `DATABASE_URL` trong `.env`, thêm hậu tố của server vào tên database | Agent |
| ENV-03 | Mailer giả (ER-03) | `MemoryMailer` trong `apps/api/test/support/harness.ts`, truyền vào `createAuthEmails` | Mock | Mô phỏng: người nhận, tiêu đề, nội dung, link; chế độ `failing = true` làm mọi lần gửi bị từ chối. Không đại diện: render trong mail client, độ trễ, lỗi và giới hạn thật của Resend. Bù bằng TC-197, TC-198 | Tạo mới cho mỗi harness | Trong process test | Agent |
| ENV-04 | OAuth provider giả cho Google (ER-04) | CI: `apps/api/test/support/outbound.ts` thay `globalThis.fetch`. Endpoint token `https://oauth2.googleapis.com/token` trả `access_token` và id_token có profile của test, chữ ký giả. Harness bật Google với client ID giả. S: Playwright route `https://accounts.google.com/**` trả redirect về callback với `error=access_denied` hoặc `error=server_error` | Mock | Mô phỏng: trao đổi `code`, profile và `sub` theo test, trả lỗi của provider, `state` do Better Auth tạo. Không đại diện: màn chọn tài khoản, id_token thật có chữ ký, đóng cửa sổ Google. Ở S, provider giả không trả lời được bước trao đổi `code` phía server, nên luồng Google có profile không chạy được ở S; phần S của TC-103 chạy thủ công với Google thật (CH-11). Bù bằng TC-195, TC-196, CHR-02 | `resetOutbound()` trước mỗi test | Trong process test; route của Playwright | Agent |
| ENV-05 | Stub API Pwned Passwords (ER-05) | `apps/api/test/support/outbound.ts`, host `api.pwnedpasswords.com`, endpoint `/range/<prefix>` | Mock | Mô phỏng: chế độ `clean`, `pwned` (trả suffix của password đã đăng ký bằng `markPwned`), `unavailable` (503), `no-answer` (giữ request 10 giây). Không đại diện: định dạng response thật ngoài `SUFFIX:COUNT`, padding, mạng thật. Request tới host khác bị chặn và ghi vào `outbound.unexpected`, nên tiền tố hash của password test không ra ngoài | `resetOutbound()` trước mỗi test | Trong process test | Agent |
| ENV-06 | Điều khiển thời gian (ER-06) | CI: `controlClock()` dùng `vi.useFakeTimers({ toFake: ['Date'] })` và `vi.setSystemTime`, độ chính xác 1 ms; timer thật vẫn chạy để chờ email. S: link reset được đặt `verification.expires_at = now() - 1 phút`; link xác minh được ký lại bằng `createEmailVerificationToken` của `better-auth/api` với thời hạn đã qua 60 giây | Mock | Mô phỏng: đồng hồ của Better Auth (rate limit, phiên, token). Không đại diện ở S: link xác minh hết hạn thật do server ký; link được ký lại dùng định dạng token của Better Auth 1.7.25, nên khi đổi version `better-auth` phải kiểm lại helper `expiredVerificationLink` | CI: `clock.restore()` sau mỗi test | Trong process test; database E2E; `BETTER_AUTH_SECRET` trong `.env` | Agent |
| ENV-07 | Web, API, Worker và Chromium (ER-07) | Hai bản `pnpm dev`, do `e2e/server.ts` khởi động theo bảng `E2E_SERVERS` trong `apps/web/e2e/environment.ts`. `main`: web 5173, API 3000, biến Google có giá trị giả. `withoutGoogle`: web 5174, API 3001, biến Google trống (ER-11, TC-140 dòng 2). Cả hai: `NODE_ENV=development`, database của ENV-02, `RESEND_API_KEY=''`, `EMAIL_FROM=''`, `BETTER_AUTH_URL` theo cổng web. Mọi biến mà kết quả test phụ thuộc được đặt trong `environment.ts`, không lấy từ `.env`. Cổng web đọc từ `WEB_PORT` trong `apps/web/vite.config.ts`. `@playwright/test@1.65.1`, Chromium của Playwright. Console được chép vào `apps/web/.e2e-output/e2e-console.log` và `e2e-no-google-console.log` (gitignore). `reuseExistingServer: false`; `retries: 0` | Thật | N/A | Playwright khởi động `node --import tsx e2e/server.ts <tên server>` cho từng server và dừng khi xong | `http://localhost:5173` (API 3000), `http://localhost:5174` (API 3001) | Agent |
| ENV-08 | `@axe-core/playwright` (ER-08) | `@axe-core/playwright@4.14.0`, devDependency của `apps/web`, product owner duyệt ngày 2026-11-17 | Thật | N/A | `pnpm install` | — | Agent |
| ENV-09 | Google OAuth và Resend thật (ER-09) | `.env` có `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM` có giá trị (chỉ kiểm có giá trị, không đọc giá trị). Đã chạy thử ngày 2026-11-19: Google thật đạt. Resend với `EMAIL_FROM=onboarding@resend.dev` (giá trị do product owner cho biết; domain chưa xác minh) chỉ gửi tới email của chủ tài khoản Resend, các địa chỉ khác bị từ chối (HTTP 403) | Thật | N/A | Product owner chạy `pnpm dev` với `.env` gốc (PROC-17) | `http://localhost:5173` | Product owner |
| ENV-10 | Khởi động lại API (ER-10) | `apps/api/test/support/api-process.ts` chạy `node --import tsx src/index.ts` thành process riêng, `NODE_ENV=test`, database `<POSTGRES_DB>_test`, cổng 3991 đến 3993. Khởi động lại là dừng process (`kill`) rồi chạy process mới. Request gửi qua HTTP với `x-forwarded-for`. Đồng hồ thật, không dùng ENV-06 | Driver | Mô phỏng: process mới không giữ gì trong bộ nhớ của process cũ; chỉ dữ liệu trong database còn lại. Không đại diện: dừng process giữa lúc đang xử lý request; dừng có thứ tự bằng `SIGTERM` (trên Windows `kill` dừng process ngay). Process không dùng fake của ENV-04 và ENV-05, nên chỉ nhận request Sign in, là request không gọi ra ngoài | Mỗi test dừng mọi process đã chạy | Cổng 3991 đến 3993 trên máy test | Agent |
| ENV-11 | Cấu hình môi trường (ER-11) | TC-226: chạy `node --import tsx src/index.ts` của `apps/api` với `NODE_ENV=production` và một biến email trống. TC-220 dòng 3: harness với `NODE_ENV=production`. TC-140 dòng 2: server E2E `withoutGoogle` của ENV-07 | Thật | N/A | Không cần reset | Trong process test; server `withoutGoogle` | Agent |
| ENV-12 | Lỗi mạng và lỗi API cho web (ER-12) | `page.route` trả 500 hoặc `route.abort('internetdisconnected')` cho `get-session`, `sign-out`, `sign-in/email`, `sign-up/email`, `request-password-reset`, `reset-password`, `send-verification-email` | Mock | Không đại diện: lỗi thật của proxy Vite, timeout mạng thật | Route gỡ khi test kết thúc | Trong browser context | Agent |
| ENV-13 | Component test (ER-13) | `vitest@5.1.0` trong `packages/shared` và `apps/web` (product owner duyệt ngày 2026-11-17); `apps/web/vitest.config.ts` không nạp plugin React Router | Thật | N/A | Không cần reset | `pnpm test` | Agent |

## 3. Kiểm tra sẵn sàng

| Env ID | Cách kiểm tra | Kết quả | Evidence / ngày |
| --- | --- | --- | --- |
| ENV-01 | SU-01 smoke pass; global setup tạo lại database ở mỗi lần chạy | Đạt | VF-02; 2026-11-17 |
| ENV-02 | `e2e/server.ts` tạo database `_e2e` và chạy migration; SU-11 smoke pass | Đạt | VF-03; 2026-11-17 |
| ENV-03 | TC-044 đọc link từ mailer; TC-185 với `failing = true` có log lỗi gửi email. Kiểm bằng lỗi: mutant M6 chỉ gửi email ở lần đầu cho mỗi địa chỉ; TC-011, TC-013, TC-014 fail vì mailer không nhận email (VF-11). Mutant M21 truyền lỗi gửi email ra response; TC-192 fail với chế độ `failing = true` (VF-12) | Đạt | VF-02, VF-11, VF-12; 2026-11-18 |
| ENV-04 | CI: TC-101 tạo phiên từ profile giả; `outbound.unexpected` rỗng. S: TC-141 đưa trình duyệt về callback với lỗi của provider. Kiểm bằng lỗi: ở CI, mutant M4 bỏ Google provider; TC-009 fail (VF-10). Mutant M14 bỏ việc so `state` với cookie của client; dòng 2 của TC-232 fail vì provider giả trả profile và callback tạo phiên (VF-12). Phần S chưa kiểm bằng lỗi: test duy nhất dùng route giả ở S là TC-141, và TC-141 fail trên `b4ca981` vì lỗi sản phẩm (email bị mất), nên mutant không cho thấy thay đổi pass sang fail | Đạt | VF-02, VF-03, VF-10, VF-12; 2026-11-18 |
| ENV-05 | TC-114 thấy response trước 10 giây với chế độ `no-answer`; test "the stub saw no request that left the machine" pass. Kiểm bằng lỗi: lỗi sản phẩm đã biết (API không kiểm Pwned Passwords) làm TC-110, TC-111, TC-113, TC-114 fail với stub ở chế độ `pwned`, `unavailable`, `no-answer` (VF-02). Mutant M11 và M11b từ chối password mà stub báo "chưa lộ"; TC-112 fail (VF-12) | Đạt | VF-02, VF-12; 2026-11-18 |
| ENV-06 | CI: TC-034 dòng 1 thấy thời hạn phiên dời theo đồng hồ giả. S: TC-062 thấy màn link hết hạn. Kiểm bằng lỗi: CI, mutant M9 cho phiên trình duyệt sống 2 ngày; dòng 1 của TC-042 fail ở thời điểm 1 ngày + 1 giờ của đồng hồ giả (VF-12). S, link reset được đặt hết hạn trong database: mutant M16 bỏ kiểm hạn khi mở link; TC-062 fail (VF-12). S, link xác minh được ký lại với hạn đã qua: chưa kiểm bằng lỗi, vì TC-072 fail trên `b4ca981` do lỗi sản phẩm ở thông báo lỗi; kiểm lại khi lỗi đó được sửa | Đạt | VF-02, VF-03, VF-12; 2026-11-18 |
| ENV-07 | Console của cả hai server có dòng "RESEND_API_KEY is not set; emails are printed to the console."; SU-11 đọc link từ console. Với cache Vite trống, log không có dòng "optimized dependencies changed. reloading" | Đạt | VF-03; VF-09; 2026-11-18 |
| ENV-08 | TC-244 chạy axe và nhận danh sách vi phạm | Đạt | VF-03; 2026-11-17 |
| ENV-09 | Session PROC-17, 2026-11-19 (RUN-001, RUN-002, RUN-008, RUN-009) | Đạt với giới hạn: Resend chỉ gửi tới email chủ tài khoản Resend | [Test Log](../../05-execution/output/02-test-log.md) |
| ENV-10 | Process API sẵn sàng sau khoảng 2,2 đến 3,3 giây. Trên build tham chiếu, TC-005 pass. Kiểm bằng lỗi: mutant M3 để bộ đếm trong bộ nhớ (`storage: 'memory'`); TC-005 fail ở cả 4 dòng, nên process mới không giữ bộ đếm của process cũ | Đạt | VF-10; 2026-11-18 |
| ENV-11 | TC-226 nhận exit code khác 0 và tên biến trong output; TC-140 dòng 2 pass trên server `withoutGoogle`, và fail khi server đó được tạm bật Google | Đạt | VF-02; VF-09; 2026-11-18 |
| ENV-12 | TC-123 thấy lỗi tải khi `get-session` trả 500. Kiểm bằng lỗi: mutant W24 coi lỗi khi kiểm phiên là "không có phiên"; TC-123 fail vì màn chặn hiện thay cho lỗi tải (VF-12) | Đạt | VF-03, VF-12; 2026-11-18 |
| ENV-13 | `pnpm --filter @crypto-force/shared test` và `pnpm --filter @crypto-force/web test` chạy được | Đạt | VF-02; 2026-11-17 |

## 4. Khác biệt so với môi trường đích

| Khác biệt | Env IDs | Ảnh hưởng tới kết quả test |
| --- | --- | --- |
| Email không qua Resend | ENV-03, ENV-07 | Không phát hiện lỗi render, lỗi gửi hoặc giới hạn của Resend; chỉ TC-197, TC-198 kiểm |
| Google không thật | ENV-04 | Không phát hiện lỗi cấu hình OAuth client, redirect URI, hay khác biệt profile của Google thật; luồng Google thành công không chạy ở S |
| Pwned Passwords không thật | ENV-05 | Không phát hiện lỗi khi định dạng response thật khác `SUFFIX:COUNT` |
| Đồng hồ giả và link hết hạn dựng lại | ENV-06 | Ở S, link xác minh hết hạn được ký lại theo định dạng của Better Auth 1.7.25; nếu server đổi cách ký, test có thể không còn đại diện |
| `NODE_ENV=development`, HTTP, proxy Vite thay cho reverse proxy | ENV-07 | Không kiểm `Secure` trên trình duyệt, HSTS (TD-02) và cách đọc `x-forwarded-for` sau proxy thật (SEC-05) |
| Một máy Windows, Chromium | ENV-07 | Không kiểm trình duyệt khác (PR-21) |

## 5. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q4-01 | Mỗi yêu cầu môi trường có thành phần tương ứng, hoặc được ghi là thiếu ở Implementation Status | RC-03 | Đạt: ER-01 đến ER-13 có ENV tương ứng |
| Q4-02 | Version và cấu hình ghi theo thực tế đang chạy | IN-06 | Đạt |
| Q4-03 | Mỗi mock, stub, driver, simulator ghi rõ hành vi được mô phỏng và hành vi không đại diện | IN-06 | Đạt |
| Q4-04 | Mỗi thành phần đã được kiểm tra bằng cách chạy thực tế và có evidence | — | Đạt cho ENV-01 đến ENV-13; ENV-09 với giới hạn ở mục 3 |
| Q4-05 | Khác biệt so với môi trường đích được ghi kèm ảnh hưởng | — | Đạt |
| Q4-06 | Không có secrets trong file này | — | Đạt |

**Người review / ngày:** Chưa review

## References

1. <a id="ref-1"></a>[Test Data & Environment Requirements](../../03-design/output/05-data-and-environment-requirements.md) — commit `eb1be83`, 2026-11-17
