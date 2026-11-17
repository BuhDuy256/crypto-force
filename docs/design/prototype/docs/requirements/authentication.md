# Authentication

Đọc file này để biết các bước Sign in, Create account, Verify email, Reset password và người dùng được đưa tới đâu sau khi hoàn tất.

Tất cả các bước nằm trên cùng một màn hình Auth. Chuyển bước không làm mất email đã nhập. Cookie session, giới hạn số lần đăng nhập và các biện pháp chống lộ email đã đăng ký được ghi trong Security [[1]](#ref-1).

Quy tắc dùng chung cho mọi bước (**Confirmed**):

- Email được bỏ khoảng trắng ở đầu và cuối, không phân biệt chữ hoa chữ thường. Địa chỉ có `+tag` (ví dụ `an+test@example.com`) là một địa chỉ riêng.
- Password dài 8 đến 128 ký tự, không bắt buộc chữ hoa, số hay ký tự đặc biệt. Password được kiểm đúng như người dùng nhập, không bị cắt bớt.
- Lỗi server hoặc mất mạng hiện thông báo chung kèm gợi ý thử lại, ví dụ "We couldn’t sign you in right now. Check your connection and try again." Câu này là ví dụ của Sign in; mỗi bước dùng câu riêng, miễn là có gợi ý thử lại.

## Chuyển tiếp sau khi đăng nhập

Mọi cách đăng nhập (Sign in, Create account → Verify email, Reset password → Sign in) đều dùng chung một quy tắc chọn đích đến (**Confirmed**):

| Người dùng đến Auth từ | Sau khi đăng nhập |
| --- | --- |
| Backtest this idea trên Landing | Strategy Engine, ý tưởng đã điền sẵn để kiểm tra rules trước khi backtest |
| Màn chặn của một màn hình workspace | Đúng màn hình đó, giữ ngữ cảnh đang có |
| Không có hành động nào đang chờ | Realtime |

Khi có hành động đang chờ, Auth hiện một dòng báo trước đích đến. Đích đến chờ bị xóa khi đăng nhập thành công hoặc khi người dùng Sign out.

Đích đến được truyền qua URL của Auth, và chỉ nhận đường dẫn nội bộ của ứng dụng. Đích trỏ ra ngoài ứng dụng bị bỏ qua và thay bằng Realtime (**Confirmed**). Người dùng đã đăng nhập mà mở Auth được chuyển thẳng tới đích theo quy tắc trên (**Confirmed**). Ngoại lệ là link reset password: link này vẫn mở được khi đang đăng nhập (xem [Reset password](#reset-password)).

## Sign in

1. Người dùng nhập email và password. Có thể bật/tắt hiện password và chọn **Keep me signed in on this device**.
2. Khi bấm Sign in, form kiểm tra dữ liệu:

| Điều kiện | Phản hồi |
| --- | --- |
| Email trống | "Enter your email address." |
| Email sai định dạng | "That doesn’t look like an email address. Check for a missing @ or domain." (**Confirmed**) |
| Password trống | "Enter your password." |
| Email và password không khớp | Báo lỗi kèm link Reset password. Tài khoản chỉ đăng nhập bằng Google mà nhập password cũng nhận thông báo này |
| Email chưa được xác minh | Báo cần xác nhận email trước, kèm nút gửi lại link xác minh (**Confirmed**) |
| Từ cùng một địa chỉ IP, đã có 3 lần bấm Sign in được chấp nhận, và lần bấm mới cách lần được chấp nhận cuối dưới 10 giây. Mọi lần bấm đều được đếm, kể cả lần đúng. Bộ đếm về 0 khi người dùng ngưng bấm từ 10 giây trở lên | Tạm khóa: báo đợi giây lát rồi thử lại, hoặc reset password. Khóa hết sau 10 giây kể từ lần bấm được chấp nhận cuối. Lần bấm trong lúc khóa vẫn hiện thông báo khóa và không kéo dài thời gian khóa (**Confirmed**) |
| Hợp lệ | Ghi phiên đăng nhập, rồi chuyển tới đích theo [quy tắc chuyển tiếp](#chuyển-tiếp-sau-khi-đăng-nhập) |

Giới hạn số lần thử được tính theo địa chỉ IP, không theo tài khoản, để người khác không thể cố ý nhập sai nhằm khóa tài khoản của một người dùng (**Confirmed**).

Sửa password sau một lần sai sẽ ẩn thông báo lỗi, trừ khi đang ở trạng thái khóa.

**Keep me signed in on this device** (**Confirmed**):

| Lựa chọn | Thời hạn phiên |
| --- | --- |
| Bật (mặc định) | 7 ngày, tự gia hạn khi người dùng tiếp tục dùng ứng dụng, nhưng không quá 30 ngày kể từ lúc đăng nhập. Sau 30 ngày phải đăng nhập lại |
| Tắt | Kết thúc khi đóng trình duyệt: cookie session không có `Max-Age` hay `Expires`. Trình duyệt bật tính năng khôi phục phiên làm việc có thể giữ cookie này sau khi mở lại |

**Continue with Google** (**Confirmed**): email chưa có tài khoản thì tạo tài khoản mới, không qua bước Verify vì Google đã xác minh email. Email đã có tài khoản email/password và đã xác minh thì Google được liên kết vào tài khoản đó. Tài khoản đó chưa xác minh email thì không đăng nhập: Auth báo email này đã được đăng ký và gợi ý Sign in bằng password hoặc Reset password. Chủ của hộp thư lấy lại được tài khoản bằng cách Reset password **rồi** xác nhận email, vì Reset password không đánh dấu email là đã xác minh. Mỗi lần bấm nút, Google luôn hiện màn chọn tài khoản, vì Sign out chỉ kết thúc phiên Crypto Force, không đăng xuất khỏi Google. Đăng nhập xong chuyển tới đích theo [quy tắc chuyển tiếp](#chuyển-tiếp-sau-khi-đăng-nhập). Người dùng đóng cửa sổ Google hoặc Google báo lỗi thì Auth hiện lỗi và giữ form email. Nút chỉ hiện khi môi trường đã cấu hình Google OAuth.

## Create account và Verify email

1. Người dùng chuyển sang tab Create account, nhập Full name, email, password (tối thiểu 8 ký tự) và tick xác nhận rằng Crypto Force chỉ mô phỏng, đồng thời đồng ý Terms và Privacy Policy.
2. Khi bấm Create account, trường nào không đạt thì báo lỗi ngay tại trường đó (**Confirmed**):

   | Điều kiện | Phản hồi |
   | --- | --- |
   | Full name trống | "Enter your full name." |
   | Full name dài hơn 100 ký tự | "Use 100 characters or fewer." |
   | Email trống hoặc sai định dạng | Như [Sign in](#sign-in) |
   | Password ngắn hơn 8 ký tự | "Use at least 8 characters." |
   | Password dài hơn 128 ký tự | "Use 128 characters or fewer." |
   | Password phổ biến hoặc đã bị lộ trong một vụ rò rỉ dữ liệu | "This password is too common or has appeared in a data breach. Choose a different one." |
   | Chưa tick xác nhận | "Please confirm to create your account." |

3. Hợp lệ thì chuyển sang bước Check your email, hiện email vừa nhập. Email đã có tài khoản cũng đi tới bước này, để form không tiết lộ email nào đã đăng ký (**Confirmed**); chủ tài khoản nhận email báo rằng họ đã có tài khoản, kèm link Sign in và Reset password (**Confirmed**). Nếu tài khoản đó chưa xác minh email, email hướng dẫn Reset password rồi xác nhận email (**Confirmed**). Tải lại trang Check your email thì quay về Create account, vì email không được lưu trong URL (**Confirmed**).
4. Link trong email xác minh tài khoản, ghi phiên đăng nhập trên trình duyệt mở link, rồi chuyển tới đích theo [quy tắc chuyển tiếp](#chuyển-tiếp-sau-khi-đăng-nhập) (**Confirmed**). Link hết hạn thì Auth báo lỗi và cho gửi lại link. Link còn hạn của email đã được xác minh trước đó không báo lỗi và không tạo phiên: Auth mở form Sign in, hoặc chuyển thẳng tới đích nếu trình duyệt đã có phiên (**Confirmed**).
   - Phiên chỉ được tạo ở lần mở link đầu tiên. Nếu phần mềm quét email của hộp thư đã mở link trước, email vẫn được xác minh nhưng người dùng phải tự Sign in (**Confirmed**).
   - Trình duyệt đang đăng nhập bằng một tài khoản khác thì giữ nguyên phiên đó, không chuyển sang tài khoản vừa xác minh. Auth báo "{email} is verified. You’re still signed in as {email hiện tại}." (**Confirmed**).
5. Ở bước Verify, người dùng có thể:
   - **Resend the link**: nút đổi thành "Sent again" và bị vô hiệu.
   - **Use a different email**: quay lại form Create account.
   - **I've confirmed, continue**: nếu trình duyệt đã có phiên đăng nhập (người dùng mở link trên cùng trình duyệt), chuyển tới đích theo [quy tắc chuyển tiếp](#chuyển-tiếp-sau-khi-đăng-nhập). Nếu chưa có phiên (ví dụ người dùng mở link trên thiết bị khác), mở form Sign in với email điền sẵn (**Confirmed**). Nút ghi rõ tên đích đến.

Tab Sign in và Create account điều khiển được bằng phím mũi tên, Home và End.

## Reset password

1. Từ Sign in, người dùng chọn **Forgot password?**, nhập email và chọn Send reset link.
2. Email sai định dạng thì báo lỗi như [Sign in](#sign-in). Email hợp lệ thì luôn hiện thông báo "If an account exists for …" để không tiết lộ email có tồn tại hay không.
3. Link reset có hiệu lực 1 giờ và chỉ dùng được một lần (**Confirmed**). Link mang theo đích đến đang chờ, nên đăng nhập sau khi reset vẫn chuyển tới đúng đích (**Confirmed**). Link mở được cả khi trình duyệt đang đăng nhập (**Confirmed**). Khi người dùng mở link trong email:
   - **Link còn hiệu lực**: tới form Choose a new password, gồm New password và Confirm. New password theo quy tắc password của Create account; Confirm không khớp thì báo "The two passwords don’t match."; Confirm để trống thì báo "Fill in both fields." Lỗi hiện ngay khi gõ (**Confirmed**). Lưu thành công thì hiện "Password updated." và nút Sign in quay về form Sign in. Mọi phiên đăng nhập của tài khoản bị đăng xuất, kể cả phiên trên trình duyệt đang mở link (**Confirmed**).
   - **Link hết hạn hoặc đã dùng**: báo link hết hạn hoặc đã dùng; có **Send a new link** (quay lại bước nhập email) và **Back to sign in**.

## References

1. <a id="ref-1"></a>[Security](../../../../architecture/23-security.md)
