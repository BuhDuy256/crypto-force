# Workspace

Đọc file này để biết App header, điều kiện đăng nhập và các quy tắc dùng chung giữa các màn hình workspace.

Workspace gồm năm tab chính (Realtime, Strategy Engine, Discovery, Backtest, News) và Settings. Strategy library là màn hình con của Strategy Engine: header vẫn đánh dấu tab Strategy Engine khi đang ở Library.

## Điều kiện đăng nhập

Landing và Auth là public; mọi màn hình workspace yêu cầu đăng nhập. Màn chặn khi chưa có phiên, màn chặn khi phiên kết thúc trong lúc màn hình đang mở, và Sign out được mô tả trong Authentication [[1, Phiên và Sign out]](#ref-1).

Dữ liệu được chuyển sang trước khi người dùng bị chặn (ví dụ strategy được gửi sang Backtest) chỉ được dùng sau khi đã đăng nhập, nên không bị mất khi đi qua màn chặn. Dữ liệu đang nhập dở khi phiên kết thúc là [OQ-053](../../../../open-questions.md#oq-053).

Trong prototype, trình duyệt chưa có dữ liệu phiên được coi là đã đăng nhập với hồ sơ mẫu, để canvas hiện được các màn hình workspace. Muốn xem trạng thái chưa đăng nhập thì phải Sign out một lần.

## Sign out

Sign out nằm trong menu tài khoản và trong drawer mobile. Kết quả của Sign out và trường hợp không gửi được yêu cầu được mô tả trong Authentication [[1, Phiên và Sign out]](#ref-1). Workspace thêm hai hộp thoại trước khi Sign out:

| Điều kiện | Phản hồi |
| --- | --- |
| Có backtest đang chạy | Hộp thoại "A backtest is still running" báo rằng sign out không dừng backtest đó, kết quả sẽ có trong Runs khi đăng nhập lại. Chọn **Stay signed in** hoặc **Sign out anyway** |
| Settings có thay đổi chưa lưu | Hộp thoại "Leave without saving?" hiện trước ([quy tắc bên dưới](#rời-trang-khi-còn-thay-đổi-chưa-lưu)) |

## App header

| Thành phần | Hành vi |
| --- | --- |
| Logo | Mở Landing |
| Tab chính | Mở màn hình tương ứng; tab hiện tại được đánh dấu |
| Market data | Chỉ báo nguồn dữ liệu là Binance API và WebSocket; không có tương tác |
| Chip "Backtest NN%" | Chỉ hiện khi có backtest đang chạy và người dùng đã đăng nhập. Phần trăm cập nhật mỗi giây. Chọn chip mở chi tiết run đó trong Backtest |
| Search | Mở hộp tìm kiếm ([Search](#search)) |
| Notifications | Mở panel thông báo ([Notifications](#notifications)) |
| Menu tài khoản | Hiện tên và email trong phiên. Gồm Profile (mở Settings tại mục Profile), Settings, Help & FAQ (mở Landing, mục FAQ), Sign out |

Menu tài khoản dùng được bằng bàn phím: mũi tên lên/xuống, Home, End để di chuyển; Esc đóng menu và trả focus về nút. Chọn ra ngoài panel sẽ đóng panel.

Ở độ rộng 1100px trở xuống, các tab và menu tài khoản chuyển vào drawer mở bằng nút menu. Từ 1101px đến 1380px, ô Search thu thành icon và phần chỉ báo Market data bị ẩn.

## Search

Hộp Search tìm theo tên, mô tả phụ và nhóm. Kết quả chia nhóm:

| Nhóm | Nguồn | Chọn một kết quả |
| --- | --- | --- |
| Strategies | Strategy library | Mở Library với drawer chi tiết của item đó |
| Discovery candidates | Ứng viên trên leaderboard chưa lưu | Mở Discovery |
| Pairs | BTCUSDT, ETHUSDT, SOLUSDT | Mở Realtime |
| Pages | Các tab, Strategy library, Settings | Mở màn hình tương ứng |
| Backtest runs | 6 run gần nhất | Mở chi tiết run trong Backtest |

Mũi tên lên/xuống để chọn kết quả, Enter để mở, Esc để đóng. Không có kết quả thì hiện gợi ý tìm theo tên strategy, pair hoặc tên tab.

## Notifications

Panel liệt kê thông báo mới nhất trước, thông báo chưa đọc có chấm đánh dấu. Badge trên chuông đếm số chưa đọc.

| Action | Kết quả |
| --- | --- |
| Chọn một thông báo | Đánh dấu đã đọc và mở đúng đối tượng: chi tiết run cho thông báo backtest, drawer News sources cho lỗi nguồn tin, Discovery cho thông báo search |
| Mark all read | Đánh dấu tất cả đã đọc |
| Clear | Xóa hết, hiện "You're all caught up" kèm **Undo clear** |
| Notification settings | Mở Settings tại mục Notifications |

Thông báo do hệ thống tạo ra được giữ lại khi chuyển màn hình, gồm cả trạng thái đã đọc và việc đã xóa. Các sự kiện tạo thông báo là: backtest hoàn tất hoặc thất bại ([backtest.md](backtest.md#theo-dõi-backtest-đang-chạy)) và phiên Discovery kết thúc ([discovery.md](discovery.md#khi-phiên-search-kết-thúc)).

## Chuyển ngữ cảnh giữa các màn hình

Khi một màn hình gửi đối tượng sang màn hình khác, đối tượng đó được dùng một lần khi màn hình đích mở ra. Sau đó dữ liệu chuyển giao bị xóa.

| Từ | Action | Màn hình đích nhận |
| --- | --- | --- |
| Landing | Backtest this idea | Strategy Engine: mô tả strategy |
| Strategy library, Strategy Engine (toast sau khi lưu), Composite builder, Discovery leaderboard (Re-test), Realtime | Backtest | Backtest: strategy được chọn sẵn kèm ghi chú nguồn ([backtest.md](backtest.md#chọn-strategy-để-backtest)) |
| Strategy library | Edit | Strategy Engine hoặc Composite builder: item đang sửa ([strategy-engine.md](strategy-engine.md#sửa-một-item-trong-library)) |
| News | Add as a condition, sample strategy | Strategy Engine: điều kiện sentiment ([news.md](news.md#đưa-sentiment-vào-strategy)) |
| Notifications, Search, chip backtest, Library | Mở run | Backtest: chi tiết run |
| Search, toast | Mở item trong library | Strategy library: drawer chi tiết |
| Notification lỗi nguồn | Mở thông báo | News: drawer News sources |

## Rời trang khi còn thay đổi chưa lưu

Hai cách bảo vệ dữ liệu đang được dùng:

- **Tự lưu nháp**: Strategy Engine và Composite builder lưu nháp liên tục ([strategy-engine.md](strategy-engine.md#bản-nháp)). Rời trang không cần xác nhận.
- **Xác nhận khi rời trang**: Settings đánh dấu khi Profile hoặc phần đổi password có thay đổi chưa lưu. Khi đó, bấm bất kỳ link nào trong App header dẫn ra khỏi Settings (tab, Search, Notifications, menu tài khoản) sẽ mở hộp thoại "Leave without saving?": **Stay on Settings** hoặc **Leave without saving**. Đóng tab, tải lại trang hoặc dùng Back/Forward của trình duyệt sẽ hiện cảnh báo của trình duyệt ([settings.md](settings.md#lưu-profile)).

## Phản hồi dùng chung

Toast hiện ở góc dưới phải trong 5 giây, hoặc 8 giây nếu có Undo. Toast có thể kèm một link sang màn hình liên quan. Thao tác xóa, bỏ một phần cấu hình, hoặc xóa nội dung đều có Undo trong toast.

## References

1. <a id="ref-1"></a>[Authentication](../../../../UCs/authentication.md)
