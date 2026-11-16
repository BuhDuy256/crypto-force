# Security

Đọc file này để biết các quyết định, rủi ro bảo mật và phạm vi Authentication, Authorization.

## Authentication

Authentication dùng Better Auth với cookie session, email/password và Google OAuth; dữ liệu lưu trong PostgreSQL qua Drizzle adapter [[1, Tech Stack]](#ref-1). Hành vi người dùng thấy được mô tả trong Authentication [[2]](#ref-2).

| Hạng mục | Quyết định |
| --- | --- |
| Vị trí | API mount Better Auth tại `/api/auth/*`. Web gọi qua proxy `/api` nên cookie thuộc cùng origin với web; `BETTER_AUTH_URL` là origin của web |
| Cookie session | `HttpOnly`, `SameSite=Lax`; thêm `Secure` khi `NODE_ENV=production`. Thời hạn: 7 ngày, tự gia hạn mỗi ngày khi dùng; tắt "Keep me signed in" thì cookie hết khi đóng trình duyệt |
| Origin và callback URL | Chỉ chấp nhận request và callback URL thuộc `BETTER_AUTH_URL`. Origin check luôn bật, kể cả khi `NODE_ENV=test` (Better Auth mặc định tắt check này trong test) |
| Đích sau đăng nhập | Web chỉ nhận tham số `next` là đường dẫn nội bộ; URL tuyệt đối hoặc dạng `//host` bị thay bằng đích mặc định, để `next` không thành open redirect |
| Lộ email đã đăng ký | Create account và Reset password trả cùng một response dù email đã có tài khoản hay chưa. Email được gửi nền để thời gian phản hồi không khác nhau |
| Email chưa xác minh | Không đăng nhập được bằng password cho tới khi xác minh email |
| Link xác minh và link reset | Hiệu lực 1 giờ; link reset chỉ dùng một lần. Đặt password mới thì thu hồi mọi session cũ |
| Sign out | Web gọi `POST /api/auth/sign-out`; Better Auth xóa session trong database và xóa cookie. Sau đó web xóa cache dữ liệu của tài khoản trong trình duyệt. Nếu request thất bại, web giữ nguyên trạng thái đăng nhập để người dùng thử lại [[4, Sign out]](#ref-4) |
| Màn hình workspace | Khi không có session, web hiện màn chặn và không render nội dung workspace [[4, Điều kiện đăng nhập]](#ref-4). Đây chỉ là lớp hiển thị; API vẫn tự kiểm session ở mọi endpoint cần đăng nhập |

Rủi ro được chấp nhận: khi xóa session trong database bị lỗi, Better Auth chỉ ghi log, vẫn xóa cookie và trả thành công. Token đã bị sao chép trước đó vẫn dùng được tới khi session hết hạn. Rủi ro này chỉ xảy ra khi đồng thời mất token và database lỗi đúng lúc Sign out, và muốn xử lý phải can thiệp vào luồng nội bộ của Better Auth.

## Giới hạn số lần đăng nhập

`/api/auth/sign-in/email` cho phép 5 request trong 15 phút từ mỗi địa chỉ IP. Bộ đếm lưu trong bảng `rate_limit` của PostgreSQL nên không mất khi API khởi động lại. Giới hạn tính theo IP thay vì theo tài khoản, để người khác không thể cố ý nhập sai nhằm khóa tài khoản của một người dùng [[2, Sign in]](#ref-2).

Better Auth lấy IP từ header `X-Forwarded-For` và chỉ tin header có đúng một địa chỉ. Ràng buộc khi deploy:

- API chỉ được nhận request qua reverse proxy, và proxy phải ghi đè (không nối thêm) `X-Forwarded-For` bằng IP của client. Nếu client gọi thẳng API, họ tự đặt được header này và vượt qua giới hạn.
- Nếu request không có IP hợp lệ, mọi request dùng chung một bộ đếm, nên một client có thể làm khóa đăng nhập của tất cả người dùng.

Ở môi trường development và test, Better Auth dùng `127.0.0.1` khi không có header.

## Email trong môi trường development

Khi không có `RESEND_API_KEY` và `EMAIL_FROM`, API in nội dung email, gồm cả link xác minh và link reset, ra console thay vì gửi. Đây là ngoại lệ có chủ đích với quy tắc không log token [[3, Backend: responsibilities]](#ref-3): nội dung được in bằng `console`, không đi qua `pino`, và API không khởi động được ở `NODE_ENV=production` nếu thiếu hai biến này.

## References

1. <a id="ref-1"></a>[Project: Crypto Force](../../CLAUDE.md)
2. <a id="ref-2"></a>[Authentication](../design/prototype/docs/requirements/authentication.md)
3. <a id="ref-3"></a>[Coding Guidelines](../development/coding-guidelines.md)
4. <a id="ref-4"></a>[Workspace](../design/prototype/docs/requirements/workspace.md)
