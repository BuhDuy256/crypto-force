# Public pages

Đọc file này để biết Landing và trang 404 dẫn người dùng vào ứng dụng như thế nào.

Landing và các màn hình xác thực là public; mọi màn hình workspace yêu cầu đăng nhập (**Confirmed**, xem [workspace.md](workspace.md#điều-kiện-đăng-nhập)).

## Thử một ý tưởng từ Landing

Người dùng nhập mô tả strategy vào ô ý tưởng hoặc chọn một ví dụ có sẵn. Chọn ví dụ sẽ thay toàn bộ nội dung ô bằng câu ví dụ đó.

1. Người dùng chọn **Backtest this idea**.
2. Nếu ô ý tưởng có nội dung, ý tưởng được lưu trong trình duyệt để Strategy Engine đọc lại.
3. Đích đến phụ thuộc trạng thái đăng nhập:

| Trạng thái | Kết quả |
| --- | --- |
| Đã đăng nhập | Mở Strategy Engine với ý tưởng điền sẵn |
| Chưa đăng nhập | Mở Auth. Auth báo trước rằng sau khi đăng nhập, người dùng sẽ vào Strategy Engine với ý tưởng đã nhập (**Confirmed**) |

Ô ý tưởng để trống vẫn đi tiếp theo bảng trên, nhưng Strategy Engine mở với nội dung mặc định.

Strategy Engine hiện ghi chú đã giữ ý tưởng từ Landing. Ý tưởng được xóa khỏi trình duyệt sau khi người dùng preview rules lần đầu ([strategy-engine.md](strategy-engine.md#tạo-strategy-từ-mô-tả-hoặc-link)).

## Các điểm vào khác

| Action | Đích đến |
| --- | --- |
| Sign in, I already have an account | Auth, tab Sign in |
| Create account | Auth |
| Open workspace (chỉ hiện khi đã đăng nhập, thay cho Sign in và Create account) | Realtime |
| Các mục điều hướng trong header (Product, How it works, Return vs. risk, FAQ) | Cuộn tới section tương ứng trên Landing |
| Help & FAQ trong menu tài khoản của workspace | Landing, section FAQ (**Confirmed**: giữ cách này, chưa cần drawer trong app) |

Trên màn hình hẹp, header thu thành menu drawer. Chọn một mục hoặc nhấn Esc sẽ đóng drawer và trả focus về nút menu.

FAQ là accordion, mỗi lần chỉ mở một câu hỏi.

## Thông báo sau khi xóa tài khoản

Khi người dùng xóa tài khoản trong Settings, Landing hiện một thông báo xác nhận ở đầu trang, có nút Dismiss. Thông báo chỉ hiện một lần ([settings.md](settings.md#xóa-tài-khoản)).

## Trang không tồn tại

Trang 404 có **Go to Realtime**, **Back to home**, **Try again** (mở Realtime) và danh sách link nhanh tới các tab workspace. Nếu chưa đăng nhập, các link vào workspace sẽ gặp màn chặn đăng nhập.

## Cần chốt

| Vấn đề | Điều đã biết | Cần quyết định |
| --- | --- | --- |
| Link chân trang | Terms, Privacy Policy và Risk disclosure đều trỏ `#`; Documentation và System status ghi "planned"; Support và Social ghi "not configured" | Trang nào cần có ở bản đầu và nội dung lấy từ đâu? |
| Ai thấy trang 404 | Trang có link vào workspace | Khách chưa đăng nhập vào URL không tồn tại thì thấy 404 hay được đưa về Landing? |
| Try again trên 404 | Nút này mở Realtime | "Try again" có nên tải lại URL vừa lỗi thay vì mở Realtime không? |
