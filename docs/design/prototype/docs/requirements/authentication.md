# Authentication

Đọc file này để biết các bước Sign in, Create account, Verify email, Reset password và người dùng được đưa tới đâu sau khi hoàn tất.

Tất cả các bước nằm trên cùng một màn hình Auth. Chuyển bước không làm mất email đã nhập. Phiên đăng nhập trong prototype là phiên mô phỏng, không phải cơ chế bảo mật (**Confirmed**).

## Chuyển tiếp sau khi đăng nhập

Mọi cách đăng nhập (Sign in, Create account → Verify email, Reset password → Sign in) đều dùng chung một quy tắc chọn đích đến (**Confirmed**):

| Người dùng đến Auth từ | Sau khi đăng nhập |
| --- | --- |
| Backtest this idea trên Landing | Strategy Engine, ý tưởng đã điền sẵn để kiểm tra rules trước khi backtest |
| Màn chặn của một màn hình workspace | Đúng màn hình đó, giữ ngữ cảnh đang có |
| Không có hành động nào đang chờ | Realtime |

Khi có hành động đang chờ, Auth hiện một dòng báo trước đích đến. Đích đến chờ bị xóa khi đăng nhập thành công hoặc khi người dùng Sign out.

Đích đến được truyền qua URL của Auth, và chỉ nhận đường dẫn nội bộ của ứng dụng. Đích trỏ ra ngoài ứng dụng bị bỏ qua và thay bằng Realtime (**Confirmed**). Người dùng đã đăng nhập mà mở Auth được chuyển thẳng tới đích theo quy tắc trên (**Confirmed**).

## Sign in

1. Người dùng nhập email và password. Có thể bật/tắt hiện password và chọn **Keep me signed in on this device**.
2. Khi bấm Sign in, form kiểm tra dữ liệu:

| Điều kiện | Phản hồi |
| --- | --- |
| Email trống | "Enter your email address." |
| Email sai định dạng | Báo thiếu `@` hoặc domain |
| Password trống | "Enter your password." |
| Email và password không khớp | Báo lỗi kèm link Reset password |
| Email chưa được xác minh | Báo cần xác nhận email trước, kèm nút gửi lại link xác minh (**Confirmed**) |
| Quá 5 lần Sign in trong 15 phút từ cùng một địa chỉ IP | Tạm khóa: báo đợi vài phút hoặc reset password. Các lần bấm sau vẫn hiện thông báo khóa cho tới hết thời gian khóa (**Confirmed**) |
| Hợp lệ | Ghi phiên đăng nhập, rồi chuyển tới đích theo [quy tắc chuyển tiếp](#chuyển-tiếp-sau-khi-đăng-nhập) |

Giới hạn số lần thử được tính theo địa chỉ IP, không theo tài khoản, để người khác không thể cố ý nhập sai nhằm khóa tài khoản của một người dùng (**Confirmed**).

Sửa password sau một lần sai sẽ ẩn thông báo lỗi, trừ khi đang ở trạng thái khóa.

**Keep me signed in on this device** (**Confirmed**):

| Lựa chọn | Thời hạn phiên |
| --- | --- |
| Bật (mặc định) | 7 ngày, tự gia hạn khi người dùng tiếp tục dùng ứng dụng |
| Tắt | Kết thúc khi đóng trình duyệt |

**Continue with Google** (**Confirmed**): email chưa có tài khoản thì tạo tài khoản mới, không qua bước Verify vì Google đã xác minh email. Đăng nhập xong chuyển tới đích theo [quy tắc chuyển tiếp](#chuyển-tiếp-sau-khi-đăng-nhập). Người dùng đóng cửa sổ Google hoặc Google báo lỗi thì Auth hiện lỗi và giữ form email. Nút chỉ hiện khi môi trường đã cấu hình Google OAuth.

## Create account và Verify email

1. Người dùng chuyển sang tab Create account, nhập Full name, email, password (tối thiểu 8 ký tự) và tick xác nhận rằng Crypto Force chỉ mô phỏng, đồng thời đồng ý Terms và Privacy Policy.
2. Thiếu một trong các điều kiện trên thì báo lỗi ngay tại trường tương ứng.
3. Hợp lệ thì chuyển sang bước Check your email, hiện email vừa nhập. Email đã có tài khoản cũng đi tới bước này, để form không tiết lộ email nào đã đăng ký (**Confirmed**); chủ tài khoản nhận email báo rằng họ đã có tài khoản, kèm link Sign in và Reset password (**Proposed**).
4. Link trong email xác minh tài khoản, ghi phiên đăng nhập trên trình duyệt mở link, rồi chuyển tới đích theo [quy tắc chuyển tiếp](#chuyển-tiếp-sau-khi-đăng-nhập) (**Confirmed**). Link hết hạn hoặc đã dùng thì Auth báo lỗi và cho gửi lại link.
5. Ở bước Verify, người dùng có thể:
   - **Resend the link**: nút đổi thành "Sent again" và bị vô hiệu.
   - **Use a different email**: quay lại form Create account.
   - **I've confirmed, continue**: nếu trình duyệt đã có phiên đăng nhập (người dùng mở link trên cùng trình duyệt), chuyển tới đích theo [quy tắc chuyển tiếp](#chuyển-tiếp-sau-khi-đăng-nhập). Nếu chưa có phiên (ví dụ người dùng mở link trên thiết bị khác), mở form Sign in với email điền sẵn (**Confirmed**). Nút ghi rõ tên đích đến.

Tab Sign in và Create account điều khiển được bằng phím mũi tên, Home và End.

## Reset password

1. Từ Sign in, người dùng chọn **Forgot password?**, nhập email và chọn Send reset link.
2. Email sai định dạng thì báo lỗi. Email hợp lệ thì luôn hiện thông báo "If an account exists for …" để không tiết lộ email có tồn tại hay không.
3. Link reset có hiệu lực 1 giờ và chỉ dùng được một lần (**Confirmed**). Prototype dùng hai link preview thay cho việc mở email:
   - **Mở link hợp lệ**: tới form Choose a new password, gồm New password (tối thiểu 8 ký tự) và Confirm (phải khớp). Lỗi hiện ngay khi gõ. Lưu thành công thì hiện "Password updated." và nút Sign in quay về form Sign in. Mọi phiên đăng nhập cũ của tài khoản bị đăng xuất (**Confirmed**).
   - **Mở link đã hết hạn**: báo link hết hạn hoặc đã dùng; có **Send a new link** (quay lại bước nhập email) và **Back to sign in**.
