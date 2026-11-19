# Security

Đọc file này để biết các quyết định, rủi ro bảo mật và phạm vi Authentication, Authorization.

## Authentication

Authentication dùng Better Auth với cookie session, email/password và Google OAuth; dữ liệu lưu trong PostgreSQL qua Drizzle adapter [[1, Tech Stack]](#ref-1). Hành vi người dùng thấy được mô tả trong Authentication [[2]](#ref-2).

| Hạng mục | Quyết định |
| --- | --- |
| Vị trí | API mount Better Auth tại `/api/auth/*`. Web gọi qua proxy `/api` nên cookie thuộc cùng origin với web; `BETTER_AUTH_URL` là origin của web |
| Mức bảo mật | OWASP ASVS 5.0 L1 cộng một số mục L2, kèm danh sách rủi ro chấp nhận [[5, ADR-002]](#ref-4) |
| Cookie session | `HttpOnly`, `SameSite=Lax`; thêm `Secure` khi `NODE_ENV=production`. Thời hạn: 7 ngày, tự gia hạn khi request cách lần gia hạn cuối từ 1 ngày trở lên. Phiên tạo bởi Continue with Google và bởi link xác minh dùng thời hạn này. Tắt "Keep me signed in" thì cookie hết khi đóng trình duyệt, và phiên phía server hết hạn 1 ngày sau khi tạo, không tự gia hạn; đây là mặc định của Better Auth cho phiên `dontRememberMe` |
| Thời hạn phiên tuyệt đối | Phiên bị từ chối sau 30 ngày kể từ lúc tạo, dù vẫn được dùng đều. Con số theo mức tái xác thực tối đa cho AAL1 của NIST SP 800-63B. Idle timeout không áp dụng [[5, ADR-002]](#ref-4) |
| Password | 8 đến 128 Unicode code point, không ép quy tắc thành phần [[6, §5.1.1.2]](#ref-6). Create account và Reset password từ chối password nằm trong danh sách 3.000 password phổ biến nhất, và password đã bị lộ theo API Pwned Passwords của Have I Been Pwned (plugin `haveIBeenPwned` của Better Auth). Danh sách 3.000 password là 3.000 dòng đầu của `Passwords/Common-Credentials/10-million-password-list-top-10000.txt` trong SecLists [[7]](#ref-7); code ghi commit của SecLists đã dùng. Khi API Pwned Passwords lỗi hoặc không trả lời trong 3 giây (giới hạn thời gian người dùng phải chờ thêm ở Create account và Reset password; con số chưa dựa trên số liệu đo), API chỉ kiểm tra danh sách 3.000 password, chấp nhận password không có trong danh sách đó và ghi log cảnh báo. Password đã bị lộ nhưng không có trong danh sách 3.000 được chấp nhận trong thời gian API lỗi; đây là rủi ro chấp nhận |
| Header bảo mật | Mọi response của API có `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer` và CSP `frame-ancestors 'none'`. Response của `/api/auth/*` có thêm `Cache-Control: no-store`. `Strict-Transport-Security` đặt ở reverse proxy khi deploy. Trang web có token trong URL, gồm Choose a new password (`/reset-password`), dùng `Referrer-Policy: no-referrer` qua header HTTP hoặc thẻ `<meta name="referrer" content="no-referrer">`, để token không lộ qua header `Referer` [[8, V3.4.5]](#ref-8) |
| Link xác minh khi đang đăng nhập tài khoản khác | Không tạo phiên mới cho tài khoản vừa xác minh; giữ phiên hiện tại [[2, Create account và Verify email]](#ref-2) |
| Origin và callback URL | Chỉ chấp nhận request và callback URL thuộc `BETTER_AUTH_URL`. Origin check luôn bật, kể cả khi `NODE_ENV=test` (Better Auth mặc định tắt check này trong test). Link trong email xác minh, email reset và email báo đã có tài khoản luôn dùng origin của `BETTER_AUTH_URL`, bất kể header `Host`, `X-Forwarded-Host` hay `Origin` của request, để header của request không làm link trỏ tới domain khác |
| Đích sau đăng nhập | Web chỉ nhận tham số `next` là đường dẫn nội bộ; URL tuyệt đối hoặc dạng `//host` bị thay bằng đích mặc định, để `next` không thành open redirect |
| Lộ email đã đăng ký | Create account và Reset password trả cùng một response (nội dung và status) dù email đã có tài khoản hay chưa. Email được gửi ở nền để giảm chênh lệch thời gian phản hồi; thời gian phản hồi vẫn có thể khác nhau, và đây là rủi ro chấp nhận [[5, ADR-002]](#ref-4) |
| Email chưa xác minh | Không đăng nhập được bằng password cho tới khi xác minh email. API kiểm password trước, trạng thái xác minh sau: password sai thì trả lỗi không khớp như mọi tài khoản khác |
| Link xác minh và link reset | Hiệu lực 1 giờ; link và phiên hết hiệu lực tại đúng mốc thời hạn. Link reset chỉ dùng một lần. Đặt password mới thì thu hồi mọi session cũ và mọi link reset còn hạn khác của tài khoản. Token bị sửa hoặc không hợp lệ được xử lý như link hết hạn |
| Phiên đồng thời | Không giới hạn số phiên đồng thời của một tài khoản; đây là mặc định của Better Auth. Người dùng chưa xem hay kết thúc được từng phiên [[5, ADR-002]](#ref-4) |
| Google | Request bắt đầu Continue with Google (`/api/auth/sign-in/social`) dùng cùng giới hạn với Sign in, với bộ đếm riêng: không dùng chung bộ đếm với `/api/auth/sign-in/email`. Callback chỉ tạo phiên khi tham số `state` khớp với request Continue with Google đã bắt đầu ở cùng trình duyệt; thiếu `state` hoặc `state` không khớp thì không tạo phiên và không liên kết tài khoản [[9, §10.12]](#ref-9). Callback của Google dùng giới hạn chung của Better Auth: 100 request trong 10 giây từ mỗi địa chỉ IP. Tài khoản Google được xác định theo provider và `sub`, không theo email. Luồng Google dùng redirect, không dùng popup hay `postMessage`. Phiên Crypto Force độc lập với phiên Google: Sign out không đăng xuất khỏi Google, và phiên Google kết thúc không làm kết thúc phiên Crypto Force |
| Sign out | Web gọi `POST /api/auth/sign-out`; Better Auth xóa session trong database và xóa cookie. Sau đó web xóa cache dữ liệu của tài khoản trong trình duyệt. Nếu request thất bại, web giữ nguyên trạng thái đăng nhập để người dùng thử lại [[4, Sign out]](#ref-5) |
| Màn hình workspace | Khi không có session, web hiện màn chặn và không render nội dung workspace [[4, Điều kiện đăng nhập]](#ref-5). Đây chỉ là lớp hiển thị; API vẫn tự kiểm session ở mọi endpoint cần đăng nhập |

Rủi ro được chấp nhận: khi xóa session trong database bị lỗi, Better Auth chỉ ghi log, vẫn xóa cookie và trả thành công. Token đã bị sao chép trước đó vẫn dùng được tới khi session hết hạn. Rủi ro này chỉ xảy ra khi đồng thời mất token và database lỗi đúng lúc Sign out, và muốn xử lý phải can thiệp vào luồng nội bộ của Better Auth.

## Giới hạn số lần đăng nhập

`/api/auth/sign-in/email` dùng giới hạn mặc định của Better Auth: tối đa 3 request từ mỗi địa chỉ IP, đếm mọi request kể cả lần đăng nhập đúng. Bộ đếm về 0 khi request mới cách request được chấp nhận cuối từ 10 giây trở lên. Khi bị chặn, API trả 429 kèm header `X-Retry-After` là số giây còn lại tới 10 giây sau request được chấp nhận cuối; request bị chặn không kéo dài thời gian này. Giới hạn này chặn script thử password liên tục nhưng gần như không ảnh hưởng người dùng gõ tay. Bộ đếm lưu trong bảng `rate_limit` của PostgreSQL nên không mất khi API khởi động lại. Giới hạn tính theo IP thay vì theo tài khoản, để người khác không thể cố ý nhập sai nhằm khóa tài khoản của một người dùng [[2, Sign in]](#ref-2). Kẻ tấn công đổi IP liên tục vẫn thử được nhiều password cho một tài khoản; đây là rủi ro chấp nhận ở mức hiện tại [[5, ADR-002]](#ref-4).

Better Auth lấy IP từ header `X-Forwarded-For` và chỉ tin header có đúng một địa chỉ. Ràng buộc khi deploy:

- API chỉ được nhận request qua reverse proxy, và proxy phải ghi đè (không nối thêm) `X-Forwarded-For` bằng IP của client. Nếu client gọi thẳng API, họ tự đặt được header này và vượt qua giới hạn.
- Nếu request không có IP hợp lệ, mọi request dùng chung một bộ đếm, nên một client có thể làm khóa đăng nhập của tất cả người dùng.

Ở môi trường development và test, Better Auth dùng `127.0.0.1` khi không có header.

## Giới hạn gửi email

Hiện tại dùng giới hạn mặc định của Better Auth theo IP:

| Endpoint | Giới hạn |
| --- | --- |
| Gửi lại link xác minh, gửi link reset password | 3 request trong 60 giây |
| Create account | 3 request trong 10 giây |

Mọi giới hạn trong file này, kể cả callback của Google, dùng cùng cách tính với Sign in: bộ đếm riêng cho mỗi endpoint và mỗi IP, bộ đếm về 0 khi request mới cách request được chấp nhận cuối từ độ dài cửa sổ trở lên, và request bị chặn không được đếm. Khi bị chặn, API trả 429 kèm `X-Retry-After` là số giây còn lại tới khi hết chặn, làm tròn lên; ví dụ còn 1,5 giây thì giá trị là `2`. Đây là cách tính của Better Auth. Auth hiện lỗi chặn cho người dùng như mô tả trong Authentication [[2]](#ref-2).

Giới hạn theo IP không ngăn được việc gửi nhiều email vào hộp thư của một người từ nhiều IP, cũng không bảo vệ quota của Resend. Trước khi deploy public phải có thêm:

- giới hạn theo địa chỉ email: tối đa 3 email cho mỗi địa chỉ mỗi giờ;
- giới hạn tổng số email mỗi ngày, thấp hơn quota của Resend, kèm cảnh báo cho người vận hành khi gần chạm ngưỡng;
- dọn tài khoản chưa xác minh sau 7 ngày, để email của người khác không bị giữ chỗ lâu dài.

Khi gửi email lỗi, API chỉ ghi log; response cho người dùng vẫn giống trường hợp gửi thành công, để không lộ email đã đăng ký.

## Email trong môi trường development

Khi không có `RESEND_API_KEY` và `EMAIL_FROM`, API in nội dung email, gồm cả link xác minh và link reset, ra console thay vì gửi. Đây là ngoại lệ có chủ đích với quy tắc không log token [[3, Backend: responsibilities]](#ref-3): nội dung được in bằng `console`, không đi qua `pino`, và API không khởi động được ở `NODE_ENV=production` nếu thiếu hai biến này.

## References

1. <a id="ref-1"></a>[Project: Crypto Force](../../CLAUDE.md)
2. <a id="ref-2"></a>[Authentication](../design/prototype/docs/requirements/authentication.md)
3. <a id="ref-3"></a>[Coding Guidelines](../development/coding-guidelines.md)
4. <a id="ref-4"></a>[Architectural Decisions](30-decisions.md)
5. <a id="ref-5"></a>[Workspace](../design/prototype/docs/requirements/workspace.md)
6. <a id="ref-6"></a>[NIST SP 800-63B: Digital Identity Guidelines, Authentication and Lifecycle Management](https://pages.nist.gov/800-63-3/sp800-63b.html)
7. <a id="ref-7"></a>[SecLists](https://github.com/danielmiessler/SecLists)
8. <a id="ref-8"></a>OWASP ASVS 5.0, V3 Web Frontend Security. <https://raw.githubusercontent.com/OWASP/ASVS/master/5.0/en/0x12-V3-Web-Frontend-Security.md>
9. <a id="ref-9"></a>[RFC 6749: The OAuth 2.0 Authorization Framework](https://www.rfc-editor.org/rfc/rfc6749)
