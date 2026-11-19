# Security

Đọc file này để biết cơ chế nào trong Crypto Force đáp ứng các yêu cầu Authentication, phiên và bảo mật, cùng các quyết định và rủi ro còn lại.

## Drivers

Hành vi và số đo nằm trong Authentication [[1]](#ref-1). Bảng dưới chỉ nói cơ chế nào đáp ứng chúng.

| Driver | Cơ chế đáp ứng |
| --- | --- |
| Sign in, Create account, Verify email, Reset password, Continue with Google | Better Auth mount tại `/api/auth/*` trong API; dữ liệu trong PostgreSQL qua Drizzle adapter [[2, Tech Stack]](#ref-2) |
| Thời hạn phiên khi bật và tắt Keep me signed in (SI-09, SI-10), thời hạn tuyệt đối (SS-05) | Cấu hình session của Better Auth; API từ chối session quá thời hạn tuyệt đối |
| Giới hạn số lần Sign in, Google và gửi email (SI-06, GO-08, SEC-07); bộ đếm không mất khi khởi động lại (SEC-04) | Rate limiter của Better Auth, storage là bảng `rate_limit` trong PostgreSQL |
| Từ chối password phổ biến hoặc đã bị lộ (CA-14) | Danh sách password phổ biến từ SecLists và lời gọi API Pwned Passwords trong `apps/api/src/services/password-check.service.ts` |
| Không lộ email đã đăng ký (CA-04, RP-03, SEC-03, SEC-09) | Response giống nhau; email gửi ở nền; lỗi gửi chỉ ghi log |
| Header bảo mật (SEC-08), origin và callback (SEC-02), đích sau đăng nhập chỉ là đường dẫn nội bộ (RD-06) | Header trên response của API, origin check của Better Auth, kiểm tham số `next` ở Web |
| Màn chặn workspace và lỗi khi không kiểm được phiên (SS-03, SS-04, SS-07) | Route middleware ở Web [[3, ADR-001]](#ref-3) |
| Mức bảo mật OWASP ASVS 5.0 L1 cộng một số mục L2 | Quyết định mức bảo mật [[3, ADR-002]](#ref-3) |

## Thành phần

```mermaid
flowchart LR
    B[Trình duyệt] --> W[Web: route middleware, Auth UI]
    W -- proxy /api --> A[API: Better Auth tại /api/auth/*]
    A --> D[(PostgreSQL: user, session, account, verification, rate_limit)]
    A --> R[Resend: gửi email]
    A --> H[Pwned Passwords API]
    A --> G[Google OAuth]
```

Web gọi API qua proxy `/api`, nên cookie thuộc cùng origin với Web; `BETTER_AUTH_URL` là origin của Web.

## Kịch bản chính

Sign in với giới hạn số lần Sign in (SI-06):

```mermaid
sequenceDiagram
    participant W as Web
    participant A as API (Better Auth)
    participant D as PostgreSQL
    W->>A: POST /api/auth/sign-in/email
    A->>D: Đọc và cập nhật bộ đếm rate_limit theo IP và endpoint
    alt Vượt giới hạn số lần Sign in (SI-06)
        A-->>W: Từ chối kèm thời gian chờ (SI-06)
    else Trong giới hạn
        A->>D: Kiểm password, rồi trạng thái xác minh
        alt Password sai
            A-->>W: Lỗi không khớp (SI-04)
        else Email chưa xác minh
            A-->>W: Lỗi cần xác minh email, không tạo session (SI-05)
        else Hợp lệ
            A->>D: Tạo session
            A-->>W: Set-Cookie (SI-11)
        end
    end
```

Reset password:

```mermaid
sequenceDiagram
    participant W as Web
    participant A as API (Better Auth)
    participant D as PostgreSQL
    participant R as Resend
    W->>A: POST /api/auth/request-password-reset
    A->>D: Lưu token nếu email có tài khoản
    A--)R: Gửi email ở nền
    A-->>W: 200, cùng body cho mọi email (RP-03)
    W->>A: POST /api/auth/reset-password
    A->>D: Kiểm token còn hiệu lực và chưa dùng (RP-04), đổi password
    A->>D: Thu hồi mọi session và token reset khác của tài khoản (RP-06, RP-09)
    A-->>W: 200
```

## Quyết định

| Hạng mục | Quyết định |
| --- | --- |
| Cookie session | Thuộc tính cookie phiên (SEC-01) cấu hình trong Better Auth; thuộc tính `Secure` bật theo `NODE_ENV=production`. Thời hạn phiên khi tắt Keep me signed in (SI-10) là mặc định của Better Auth cho phiên `dontRememberMe` |
| Thời hạn phiên tuyệt đối | Con số của thời hạn tuyệt đối (SS-05) theo mức tái xác thực tối đa cho AAL1 của NIST SP 800-63B [[4]](#ref-4); idle timeout không áp dụng [[3, ADR-002]](#ref-3) |
| Password | Danh sách password phổ biến (CA-14) lấy các dòng đầu của `Passwords/Common-Credentials/10-million-password-list-top-10000.txt` trong SecLists [[5]](#ref-5), lưu trong `apps/api/src/services/common-passwords.ts`; code ghi commit của SecLists đã dùng. `password-check.service.ts` gọi API Pwned Passwords; khi API lỗi hoặc quá thời gian chờ, service chỉ kiểm danh sách password phổ biến và ghi log cảnh báo (CA-14) |
| Header bảo mật | Mọi response của API có header của SEC-08. `Strict-Transport-Security` đặt ở reverse proxy khi deploy. Trang Choose a new password dùng `Referrer-Policy: no-referrer` qua header HTTP hoặc thẻ `<meta name="referrer" content="no-referrer">` [[6, V3.4.5]](#ref-6) |
| Origin và callback URL | Chỉ chấp nhận request và callback URL thuộc `BETTER_AUTH_URL`. Origin check luôn bật, kể cả khi `NODE_ENV=test` (Better Auth mặc định tắt check này trong test). Link trong email luôn dùng origin của `BETTER_AUTH_URL` (SEC-02) |
| Đích sau đăng nhập | Web kiểm tham số `next` trước khi chuyển tiếp, theo quy tắc đích nội bộ (RD-06), để `next` không thành open redirect |
| Email chưa xác minh | API kiểm password trước, trạng thái xác minh sau, để password sai luôn trả lỗi không khớp (SI-04, SI-05) |
| Link xác minh khi đang có phiên tài khoản khác | Không tạo session mới cho tài khoản vừa xác minh; giữ session hiện tại (SS-06) |
| Google | Request bắt đầu Continue with Google (`/api/auth/sign-in/social`) dùng cùng giới hạn với `/api/auth/sign-in/email` nhưng bộ đếm riêng (GO-08). Callback chỉ tạo session khi tham số `state` khớp với request đã bắt đầu ở cùng trình duyệt [[7, §10.12]](#ref-7); thiếu hoặc không khớp thì không tạo session và không liên kết tài khoản (GO-04). Luồng Google dùng redirect, không dùng popup hay `postMessage` |
| Sign out | Web gọi `POST /api/auth/sign-out`; Better Auth xóa session trong database và xóa cookie; sau đó Web xóa cache dữ liệu của tài khoản (SS-01). Request thất bại thì Web giữ trạng thái đăng nhập (SS-02) |
| Màn hình workspace | Màn chặn chỉ là lớp hiển thị; API tự kiểm session ở mọi endpoint cần đăng nhập |
| Lấy IP cho rate limit | Better Auth lấy IP từ `X-Forwarded-For` và chỉ tin header có đúng một địa chỉ. Ở development và test, Better Auth dùng `127.0.0.1` khi không có header |
| Email trong development | Khi không có `RESEND_API_KEY` và `EMAIL_FROM`, API in nội dung email ra console bằng `console`, không qua `pino` (SEC-06). Đây là ngoại lệ có chủ đích với quy tắc không log token [[8, Backend: responsibilities]](#ref-8). API kiểm hai biến này lúc khởi động ở `NODE_ENV=production` (SEC-06) |

## Rủi ro

- Xóa session trong database lỗi khi Sign out: Better Auth chỉ ghi log, vẫn xóa cookie và trả thành công. Token đã bị sao chép vẫn dùng được tới khi session hết hạn. Rủi ro chỉ xảy ra khi đồng thời mất token và database lỗi; xử lý phải can thiệp vào luồng nội bộ của Better Auth [[3, ADR-002]](#ref-3).
- Giới hạn Sign in tính theo IP: kẻ tấn công đổi IP liên tục vẫn thử được nhiều password cho một tài khoản [[3, ADR-002]](#ref-3).
- Ràng buộc deploy của giới hạn theo IP (SEC-05): API chỉ nhận request qua reverse proxy, và proxy ghi đè (không nối thêm) `X-Forwarded-For` bằng IP của client. Client gọi thẳng API tự đặt được header này và vượt qua giới hạn. Request không có IP hợp lệ dùng chung một bộ đếm, nên một client có thể khóa đăng nhập của mọi người dùng.
- Giới hạn theo IP không ngăn gửi nhiều email vào hộp thư của một người từ nhiều IP, và không bảo vệ quota của Resend. Giới hạn bổ sung trước khi deploy public gồm giới hạn theo địa chỉ email, giới hạn tổng số email mỗi ngày và dọn tài khoản chưa xác minh (SEC-10).
- Password đã bị lộ nhưng không nằm trong danh sách password phổ biến được chấp nhận trong lúc API Pwned Passwords lỗi (CA-14).

## References

1. <a id="ref-1"></a>[Authentication](../UCs/authentication.md)
2. <a id="ref-2"></a>[Project: Crypto Force](../../AGENTS.md)
3. <a id="ref-3"></a>[Architectural Decisions](30-decisions.md)
4. <a id="ref-4"></a>[NIST SP 800-63B: Digital Identity Guidelines, Authentication and Lifecycle Management](https://pages.nist.gov/800-63-3/sp800-63b.html)
5. <a id="ref-5"></a>[SecLists](https://github.com/danielmiessler/SecLists)
6. <a id="ref-6"></a>OWASP ASVS 5.0, V3 Web Frontend Security. <https://raw.githubusercontent.com/OWASP/ASVS/master/5.0/en/0x12-V3-Web-Frontend-Security.md>
7. <a id="ref-7"></a>[RFC 6749: The OAuth 2.0 Authorization Framework](https://www.rfc-editor.org/rfc/rfc6749)
8. <a id="ref-8"></a>[Coding Guidelines](../conventions/code.md)
