# Settings

Đọc file này để biết từng phần trong Settings lưu gì, khi nào thay đổi có hiệu lực, và cách xóa tài khoản.

Settings có năm phần: Profile, Sign-in & security, Connected accounts, Notifications, Your data. Mục lục ở đầu trang cuộn tới từng phần. Profile và Notification settings trong App header mở thẳng phần tương ứng ([workspace.md](workspace.md#app-header)).

## Lưu Profile

Profile gồm ảnh đại diện, Full name, Email, Time zone, và nhóm research defaults (Pair, Timeframe, Capital, Fee, Slippage).

1. Người dùng sửa thông tin. Khi Full name khác với giá trị đã lưu, cạnh nút lưu hiện "Unsaved changes" và nút **Discard** (đưa tên về giá trị đã lưu).
2. **Save changes**:
   - Full name trống: toast lỗi, không lưu.
   - Hợp lệ: lưu tên vào phiên, hiện "Saved". Tên mới và chữ viết tắt trên avatar được cập nhật ở App header và ở Settings.

Trong lúc còn thay đổi chưa lưu ở Full name hoặc ở phần đổi password:

- Bấm link ra khỏi Settings trong App header sẽ mở hộp thoại "Leave without saving?" ([workspace.md](workspace.md#rời-trang-khi-còn-thay-đổi-chưa-lưu)).
- Đóng hoặc tải lại tab trình duyệt sẽ hiện cảnh báo của trình duyệt.
- Full name chưa lưu được giữ lại. Khi quay lại Settings, tên đó được khôi phục kèm ghi chú nhắc lưu hoặc bỏ.

Password không bao giờ được lưu lại dưới dạng nháp.

**Change photo** mở hộp chọn file ảnh và hiện toast xác nhận đã chọn. Trong prototype, ảnh không được lưu và avatar vẫn hiện chữ viết tắt.

## Đổi password

Gồm Current password, New password và Confirm new password.

| Điều kiện | Phản hồi |
| --- | --- |
| New password dưới 8 ký tự | Báo lỗi ngay khi gõ |
| Confirm không khớp | Báo lỗi ngay khi gõ |
| Bấm Update password khi thiếu Current password | "Enter your current password." |
| Hợp lệ | Xóa nội dung ba trường và báo đã cập nhật (trong prototype không đổi password thật) |

## Quản lý thiết bị đăng nhập

Danh sách thiết bị đang đăng nhập đánh dấu thiết bị hiện tại. Mỗi thiết bị khác có **Sign out**: thiết bị bị gỡ khỏi danh sách, kèm toast có Undo.

## Liên kết Google

Connected accounts hiện trạng thái liên kết Google, kèm **Connect** hoặc **Disconnect** để chuyển trạng thái.

## Chọn thông báo

Mỗi loại sự kiện có hai lựa chọn bật/tắt riêng: trong app và qua email.

- Backtest finished
- Discovery found a better candidate
- Discovery session finished or failed
- News crawl problems
- Weekly research summary

Thay đổi có hiệu lực ngay, không cần nút lưu. Xem các sự kiện đang tạo thông báo trong [workspace.md](workspace.md#notifications).

## Xuất dữ liệu

**Export data** hiện trạng thái đang chuẩn bị rồi toast xác nhận. Trong prototype không có file nào được tạo.

## Xóa tài khoản

1. **Delete my account** mở phần xác nhận ngay tại chỗ.
2. Người dùng phải gõ đúng `DELETE` thì nút xác nhận mới bật. **Cancel** đóng phần xác nhận và xóa nội dung đã gõ.
3. Xác nhận sẽ:
   - xóa dữ liệu trong trình duyệt: Strategy library, Runs, thông báo, bản nháp, phiên Discovery, signal source, lựa chọn nguồn tin, và các dữ liệu chuyển giao đang chờ;
   - kết thúc phiên đăng nhập;
   - mở Landing với thông báo tài khoản đã bị xóa ([public-pages.md](public-pages.md#thông-báo-sau-khi-xóa-tài-khoản)).

## Điểm UI chưa xác định

| Vấn đề | Điều đã biết | Cần quyết định |
| --- | --- | --- |
| Research defaults | Có Pair, Timeframe, Capital, Fee, Slippage trong Profile, nhưng Backtest không đọc các giá trị này và chúng không được tính là thay đổi chưa lưu | Defaults áp dụng cho form Backtest mới, cho Realtime, hay cho cả hai? Áp dụng lại với form đang mở không? |
| Đổi email | Ô Email sửa được nhưng không được lưu | Có cho đổi email không? Có cần xác minh email mới không? |
| Time zone | Có lựa chọn Asia/Ho_Chi_Minh và UTC | Time zone ảnh hưởng tới thời gian nào: chart, tin, run, ngày "hôm nay" khi validate Backtest? |
| Đổi password và thiết bị khác | Chưa thể hiện | Đổi password có đăng xuất các thiết bị khác không? |
| Sign out thiết bị khác | Có Undo trong toast | Undo có thực hiện được ngoài đời không, hay cần hộp thoại xác nhận trước? |
| Disconnect Google | Chuyển trạng thái ngay, không xác nhận | Nếu Google là cách đăng nhập duy nhất, có chặn Disconnect hoặc yêu cầu đặt password trước không? |
| Thông báo email | Có toggle email, nhưng chưa có luồng gửi | Email được gửi ngay hay gộp lại? Weekly research summary gồm nội dung gì? |
| Export data | Chỉ có toast | Xuất những dữ liệu nào, định dạng gì, và giao cho người dùng bằng cách nào? |
| Xóa tài khoản | Xóa ngay sau khi gõ DELETE | Có cần nhập password, có thời gian chờ hoặc cách khôi phục không? Backtest đang chạy và phiên Search đang chạy xử lý ra sao? |
| Ảnh đại diện | Chọn được file nhưng không lưu | Giới hạn định dạng, dung lượng, cách crop? |
