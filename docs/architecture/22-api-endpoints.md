# API & Realtime Communication Contracts

Đọc file này để biết các contract đi qua ranh giới HTTP và realtime của hệ thống, bên gọi, điều kiện truy cập, input/output và cách biểu diễn lỗi.

## Drivers

| Driver | Cơ chế đáp ứng |
| --- | --- |
| Sign in, Create account, Verify email, Continue with Google và Reset password | Endpoint của Better Auth dưới `/api/auth`; Web gọi qua typed wrapper [[1]](#ref-1) |
| Không có phiên thì chặn workspace (SS-03), Sign out thu hồi phiên (SS-01) | `get-session` và `sign-out` dùng cookie session |
| Chỉ nhận origin và đích chuyển tiếp hợp lệ (SEC-02, RD-06) | Better Auth kiểm origin/callback; Web kiểm `next` trước khi điều hướng |
| Giới hạn request Auth và gửi email (SI-06, GO-08, SEC-07) | Better Auth trả 429 cùng `X-Retry-After`; Web chuyển lỗi thành `AuthRequestError` |

## Thành phần

`createApp` mount Better Auth bằng `toNodeHandler` trước `express.json()`, vì Better Auth tự đọc body. Router `/api` của ứng dụng được mount sau đó; nó hiện có health và cấu hình Auth công khai [[2]](#ref-2).

## Ranh giới giao tiếp

| Bên gọi → bên nhận | Transport và contract | Hiện trạng |
| --- | --- | --- |
| Trình duyệt → API | HTTP cùng origin, prefix `/api` | Health, cấu hình công khai và Better Auth |
| Google/hộp thư → API qua trình duyệt | Callback OAuth hoặc link kiểm token | Thuộc namespace `/api/auth/*`, sau đó chuyển về route Web |
| API → PostgreSQL | Drizzle adapter và connection pool | Chi tiết schema nằm trong Database |
| Worker → PostgreSQL | pg-boss | Queue bootstrap; chưa có contract payload job nghiệp vụ |
| Trình duyệt ↔ API realtime | WebSocket theo thiết kế | Chưa có server, subscribe request hoặc event schema triển khai |

Web gọi API qua module `app/api/`; contract Auth hiện nằm trong `apps/web/app/api/auth.ts`. `AuthConfig` được kiểm bằng Zod từ `packages/shared`; kết quả Auth lấy type từ Better Auth client [[3]](#ref-3).

### Endpoint ứng dụng

| Method | Path | Session | Response thành công |
| --- | --- | --- | --- |
| GET | `/api/health` | Không yêu cầu | `{ "status": "ok" }`; không kiểm kết nối DB hoặc Worker |
| GET | `/api/auth-config` | Không yêu cầu | `{ "google": boolean }`; true khi cả Google client ID và secret có cấu hình, không lộ giá trị secret |

Nguồn: `health.route.ts`, `auth-config.route.ts` và bootstrap API [[2]](#ref-2).

### Endpoint Auth đang dùng trong ứng dụng

Body là JSON; tham số trong cột Input là query khi method là GET. Các giới hạn và hành vi người dùng nằm trong Authentication [[1]](#ref-1); cấu hình backend và route của Better Auth quyết định contract HTTP [[4]](#ref-4).

| Method | Path | Input chính | Kết quả hoặc tác động |
| --- | --- | --- | --- |
| GET | `/api/auth/get-session` | Cookie nếu có | Session và user, hoặc `null` khi không có phiên hợp lệ |
| POST | `/api/auth/sign-in/email` | `email`, `password`, `rememberMe`, `callbackURL` | Tạo session, trả user/token cùng thông tin redirect; đặt cookie |
| POST | `/api/auth/sign-up/email` | `name`, `email`, `password`, `callbackURL` | Response đăng ký không tiết lộ email đã tồn tại; tài khoản mới cần xác minh email trước khi có phiên |
| POST | `/api/auth/send-verification-email` | `email`, `callbackURL` | `{ "status": true }`; gửi link nếu phù hợp |
| GET | `/api/auth/verify-email` | `token`, `callbackURL` | Kiểm link, cập nhật xác minh, redirect về callback của Web; giữ phiên tài khoản khác nếu có (SS-06) |
| POST | `/api/auth/request-password-reset` | `email`, `redirectTo` | `{ "status": true, "message": string }` giống nhau cho email có hoặc không có tài khoản (RP-03) |
| GET | `/api/auth/reset-password/:token` | Path token, query `callbackURL` | Link trong email; redirect tới form Web kèm `token` hoặc `error=INVALID_TOKEN`, chưa đổi password |
| POST | `/api/auth/reset-password` | `token`, `newPassword` | `{ "status": true }`; đổi password, thu hồi session và các link reset còn lại |
| POST | `/api/auth/sign-in/social` | `provider: "google"`, `callbackURL`, `errorCallbackURL` | Trả URL và thông tin redirect để trình duyệt mở Google |
| GET, POST | `/api/auth/callback/google` | Tham số phản hồi OAuth, gồm `code`, `state` hoặc lỗi | Better Auth hoàn tất OAuth, tạo session khi hợp lệ, redirect về Web |
| POST | `/api/auth/sign-out` | Cookie session nếu có | Kết thúc phiên hiện tại và xóa cookie; Web xóa cache sau response thành công |

Các endpoint bắt đầu đăng nhập, gửi email và kiểm link không yêu cầu phiên đăng nhập sẵn; token/state và origin vẫn phải hợp lệ. `get-session` cho phép kiểm cả trạng thái chưa đăng nhập. Sign out sử dụng cookie của phiên cần kết thúc. Cookie và các trường token trả bởi thư viện không được log [[5]](#ref-5).

### Surface HTTP kế thừa từ Better Auth

Mount toàn bộ handler Better Auth cũng đăng ký các route không có UI tương ứng. Cấu hình hiện không khai báo `disabledPaths`; vì vậy bảng endpoint mà Web đang dùng không phải allowlist của API. Các nhóm dưới đây là surface thư viện, không phải tuyên bố các flow Settings đã được xây [[4]](#ref-4).

| Method | Path sau `/api/auth` | Điều kiện và phạm vi |
| --- | --- | --- |
| POST | `/get-session` | Method bổ sung của thư viện; Web hiện dùng GET |
| GET | `/list-sessions` | Session hợp lệ; liệt kê phiên |
| POST | `/revoke-session`, `/revoke-sessions`, `/revoke-other-sessions` | Session và kiểm tra tương ứng của thư viện; thu hồi phiên |
| POST | `/update-user`, `/update-session` | Session; cập nhật trường mà schema thư viện chấp nhận |
| POST | `/change-password`, `/verify-password` | Session và kiểm password; chưa có UI Settings sử dụng |
| GET | `/list-accounts`, `/account-info` | Session; truy cập thông tin provider/account |
| POST | `/link-social`, `/unlink-account`, `/get-access-token`, `/refresh-token` | Kiểm session/provider theo route thư viện; chưa có wrapper Web sử dụng |
| POST | `/change-email`, `/delete-user` | Route có đăng ký nhưng chức năng bị chặn bởi cấu hình mặc định chưa bật |
| GET | `/delete-user/callback` | Có kiểm cấu hình xóa tài khoản, hiện chưa bật |
| GET | `/ok`, `/error` | Route tiện ích của thư viện |

Đầu vào/đầu ra của surface kế thừa do schema route Better Auth sở hữu; nguồn route nằm trong `dist/api/index.mjs` và `dist/api/routes/`. `setPassword` là API server-only, không phải endpoint HTTP được đăng ký bằng path. Khi đưa một route kế thừa vào flow sản phẩm, cần xác định contract được ứng dụng sử dụng và kiểm lại cấu hình bảo mật của route đó [[4]](#ref-4).

### Lỗi và header

| Phạm vi | Contract |
| --- | --- |
| Better Auth | Lỗi thông thường có `code`, `message`; Web unwrap kết quả SDK thành `AuthRequestError` với `status`, `code`, `retryAfter`. Lỗi 429 có thể chỉ có `message`, nên `code` là optional |
| Rate limit | Status 429; `X-Retry-After` cho thời gian chờ. Wrapper Sign in đọc header này để UI xử lý giới hạn số lần |
| Router ứng dụng | Lỗi `AppError` có `{ "error": { "code": string, "message": string } }`; route không tồn tại trả 404 với `NOT_FOUND`; lỗi không xác định trả 500 với `INTERNAL_ERROR` |
| Kiểm session của workspace | Request lỗi được Web chuyển thành trạng thái lỗi route 503; `null` được chuyển thành 401. Đây là status nội bộ của router Web, không phải khẳng định endpoint `get-session` luôn trả HTTP 401/503 |

Header chung do middleware API đặt; các thuộc tính cookie, origin, cache và reverse proxy được mô tả trong Security [[5]](#ref-5). Error envelope của Express không được áp đặt lên response Better Auth vì handler Auth xử lý request riêng [[2]](#ref-2).

## Realtime và job contracts

API hiện chưa đăng ký WebSocket server, endpoint subscribe hoặc event contract. Tùy chọn `ws: true` của Vite chỉ cho proxy chuyển tiếp WebSocket, không tạo transport realtime. Khi triển khai Realtime và tiến độ job, contract sẽ được xác định cùng flow đó; chưa có sequence WebSocket để mô tả từ code hiện tại [[2]](#ref-2) [[6]](#ref-6).

Worker mới khởi động pg-boss, chưa có job handler hoặc payload schema nghiệp vụ. HTTP response, event realtime và payload job là ba contract khác nhau; hiện chưa có contract tiến độ hoặc kết quả backtest được nối giữa chúng [[7]](#ref-7).

## Quyết định

| Hạng mục | Quyết định |
| --- | --- |
| Quyền sở hữu route | Better Auth sở hữu `/api/auth/*`; router Express của ứng dụng sở hữu `/api/health` và `/api/auth-config` |
| Callback | URL callback backend thuộc `/api/auth/*`; route form `/reset-password` và route `/sign-up/verify` là Web UI, không thay thế endpoint kiểm token |
| Cấu hình Google | API trả capability công khai; Auth layout dùng false nếu không đọc được cấu hình, không suy ra secret từ phía client |

## Rủi ro

- Khi nâng Better Auth, cần đối chiếu lại route, error shape và wrapper Web; bảng endpoint không thay thế schema/runtime validation của thư viện.
- Chưa có API nghiệp vụ Strategy/Backtest; các tab workspace không chứng minh API tương ứng đã tồn tại.
- Surface mặc định của thư viện rộng hơn các route mà Web đang dùng; khi đổi cấu hình hoặc nâng version cần kiểm cả route kế thừa, không chỉ wrapper frontend.

## References

1. <a id="ref-1"></a>[Authentication](../UCs/authentication.md)
2. <a id="ref-2"></a>[Express app](../../apps/api/src/app.ts), [API router](../../apps/api/src/api/routes/index.ts), [Health route](../../apps/api/src/api/routes/health.route.ts), [Auth config route](../../apps/api/src/api/routes/auth-config.route.ts), [Error handler](../../apps/api/src/api/middlewares/error-handler.middleware.ts) và [API bootstrap](../../apps/api/src/index.ts)
3. <a id="ref-3"></a>[Web Auth API](../../apps/web/app/api/auth.ts), [Shared Auth schemas](../../packages/shared/src/schemas/auth.schema.ts) và [Auth layout](../../apps/web/app/routes/auth-layout.tsx)
4. <a id="ref-4"></a>[Auth config](../../apps/api/src/configs/auth.ts); route và rate limiter của Better Auth cài trong workspace tại `apps/api/node_modules/better-auth/dist/api/`.
5. <a id="ref-5"></a>[Security](23-security.md)
6. <a id="ref-6"></a>[Vite config](../../apps/web/vite.config.ts)
7. <a id="ref-7"></a>[Worker bootstrap](../../apps/worker/src/index.ts)
