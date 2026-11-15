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

## Sign in

1. Người dùng nhập email và password. Có thể bật/tắt hiện password và chọn **Keep me signed in on this device**.
2. Khi bấm Sign in, form kiểm tra dữ liệu:

| Điều kiện | Phản hồi |
| --- | --- |
| Email trống | "Enter your email address." |
| Email sai định dạng | Báo thiếu `@` hoặc domain |
| Password trống | "Enter your password." |
| Email và password không khớp | Báo lỗi kèm link Reset password; tăng số lần thử sai |
| Sai lần thứ 3 | Tạm khóa: báo đợi vài phút hoặc reset password. Các lần bấm sau vẫn hiện thông báo khóa |
| Hợp lệ | Ghi phiên đăng nhập, rồi chuyển tới đích theo [quy tắc chuyển tiếp](#chuyển-tiếp-sau-khi-đăng-nhập) |

Sửa password sau một lần sai sẽ ẩn thông báo lỗi, trừ khi đang ở trạng thái khóa.

**Continue with Google** chuyển sang trạng thái chờ rồi luôn báo lỗi popup bị đóng hoặc bị chặn. Trong prototype chưa có nhánh Google thành công.

## Create account và Verify email

1. Người dùng chuyển sang tab Create account, nhập Full name, email, password (tối thiểu 8 ký tự) và tick xác nhận rằng Crypto Force chỉ mô phỏng, đồng thời đồng ý Terms và Privacy Policy.
2. Thiếu một trong các điều kiện trên thì báo lỗi ngay tại trường tương ứng.
3. Hợp lệ thì chuyển sang bước Check your email, hiện email vừa nhập.
4. Ở bước Verify, người dùng có thể:
   - **Resend the link**: nút đổi thành "Sent again" và bị vô hiệu.
   - **Use a different email**: quay lại form Create account.
   - **I've confirmed, continue**: ghi phiên đăng nhập và chuyển tới đích theo [quy tắc chuyển tiếp](#chuyển-tiếp-sau-khi-đăng-nhập). Nút ghi rõ tên đích đến.

Tab Sign in và Create account điều khiển được bằng phím mũi tên, Home và End.

## Reset password

1. Từ Sign in, người dùng chọn **Forgot password?**, nhập email và chọn Send reset link.
2. Email sai định dạng thì báo lỗi. Email hợp lệ thì luôn hiện thông báo "If an account exists for …" để không tiết lộ email có tồn tại hay không.
3. Từ bước này, prototype có hai link preview thay cho việc mở email:
   - **Mở link hợp lệ**: tới form Choose a new password, gồm New password (tối thiểu 8 ký tự) và Confirm (phải khớp). Lỗi hiện ngay khi gõ. Lưu thành công thì hiện "Password updated." và nút Sign in quay về form Sign in.
   - **Mở link đã hết hạn**: báo link hết hạn hoặc đã dùng; có **Send a new link** (quay lại bước nhập email) và **Back to sign in**.

## Cần chốt

| Vấn đề | Điều đã biết | Cần quyết định |
| --- | --- | --- |
| Điều kiện khóa sau nhiều lần sai | Prototype khóa ở lần sai thứ 3, kèm thông báo "đợi vài phút" | Số lần thử, thời gian khóa và cách mở khóa? |
| Keep me signed in | Có checkbox, nhưng chưa thể hiện khác biệt về hành vi | Phiên có thời hạn bao lâu khi bật và khi tắt? |
| Google sign-in thành công | Chỉ có nhánh lỗi | Google có tạo tài khoản mới nếu email chưa tồn tại không? Có cần bước Verify không? |
| Phiên hết hạn khi đang dùng | Màn chặn có thông báo chung, chưa có thông báo riêng cho phiên hết hạn | Có cần thông báo "phiên đã hết hạn" riêng không? Dữ liệu đang nhập dở được xử lý thế nào? |
| Đã đăng nhập mà mở Auth | Auth vẫn hiện form | Chuyển thẳng vào workspace hay hiện thông báo "đang đăng nhập với …"? |
| Thời hạn link reset | Có trạng thái hết hạn | Link có hiệu lực bao lâu và dùng được mấy lần? |
| Trigger demo | Lỗi sai thông tin được kích hoạt bằng password `wrongpass`; link reset dùng nút preview | Chỉ dùng cho prototype, không phải yêu cầu (**Inferred**) |
