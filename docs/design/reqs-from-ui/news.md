# News

Đọc file này để biết cách thu thập và lọc tin, xem chi tiết và sentiment của từng bài, quản lý nguồn tin, và đưa sentiment vào strategy.

Sentiment chỉ là một input tùy chọn. Nó chỉ ảnh hưởng tới strategy khi một rule yêu cầu rõ ràng.

## Thu thập tin

Form Crawl settings gồm:

- **Source type**: Website, RSS hoặc HTML.
- **Assets**: BTC, ETH, SOL hoặc cả ba.
- **Refresh every**: 1 tới 5 phút.

**Start crawl** chuyển sang trạng thái đang khởi động, sau đó nút đổi thành **Stop crawl**. Stop crawl dừng thu thập, các tin đã có vẫn giữ trong danh sách. Trong prototype không có tin mới được tải về.

## Xem và lọc feed

Incoming news liệt kê tin trong 24 giờ gần nhất: thời điểm, coin, tiêu đề, tóm tắt, sentiment kèm loại sự kiện, và nguồn.

- Lọc theo sentiment: All, Positive, Neutral, Negative. Mỗi nút có số lượng tương ứng.
- Dưới feed có dòng "Showing N of M articles…".
- Tin từ nguồn đã tắt không hiện trong feed. Khi có tin bị ẩn vì lý do này, dòng "N articles hidden from sources you turned off · Manage sources" xuất hiện và mở được drawer News sources.

| Trạng thái rỗng | Thông báo |
| --- | --- |
| Tất cả nguồn đã tắt | Yêu cầu bật lại ít nhất một nguồn trong Configure sources |
| Bộ lọc sentiment không có bài | Gợi ý chọn bộ lọc khác |

## Xem chi tiết một bài

Chọn tiêu đề bài mở drawer chi tiết. Drawer có coin, sentiment, giờ đăng, nguồn, loại sự kiện, điểm sentiment trên thang −1 tới +1, và bản tóm tắt đã trích xuất.

Từ drawer, **Add {coin} sentiment as a condition** mở Strategy Engine với điều kiện sentiment của đúng coin trong bài ([Đưa sentiment vào strategy](#đưa-sentiment-vào-strategy)).

Drawer đóng bằng Close, phím Esc hoặc chọn ra ngoài.

## Đọc sentiment tổng hợp

Panel **Sentiment, last 24h** tóm tắt sentiment trong 24 giờ và liệt kê các loại sự kiện chính theo số lượng: ETF / fund flow, Market trend, Protocol upgrade, Regulation, Partnership. Panel này chỉ để đọc.

## Đưa sentiment vào strategy

| Action | Ở đâu | Kết quả trong Strategy Engine |
| --- | --- | --- |
| Add as a condition | Panel Use in strategies | Thêm "Only enter when the 24-hour news sentiment for BTC is positive." vào cuối mô tả hiện có |
| Add {coin} sentiment as a condition | Drawer chi tiết bài | Như trên, với coin của bài |
| Start a sentiment strategy (sample) | Panel Use in strategies | Bắt đầu một strategy mới với mô tả, tên và tag mẫu về sentiment |

Sau khi thêm điều kiện, Strategy Engine bỏ preview hiện tại và nhắc người dùng preview lại. Nếu người dùng đang sửa một strategy, điều kiện được thêm vào strategy đó ([strategy-engine.md](strategy-engine.md#nhận-dữ-liệu-từ-màn-hình-khác)).

## Quản lý nguồn tin

**Configure sources** mở drawer News sources. Phạm vi là xem và bật/tắt các nguồn có sẵn; chưa có thêm website tùy ý hay cấu hình crawler (**Confirmed**).

1. Drawer liệt kê từng nguồn: tên, loại (RSS, Website, HTML), các coin được theo dõi và một switch bật/tắt.
2. Nguồn không phản hồi ở lần crawl gần nhất có ghi chú; hệ thống tự thử lại.
3. Đổi switch được lưu ngay. Thay đổi áp dụng từ lần crawl kế tiếp, còn tin của nguồn đã tắt bị ẩn khỏi feed ngay lập tức.
4. Tắt hết nguồn: drawer cảnh báo News sẽ trống cho tới khi bật lại một nguồn.
5. **Done**, Close, Esc hoặc chọn ra ngoài để đóng drawer.

Dòng tóm tắt trong Sources & extraction ("N of M sources on · K not responding") lấy số liệu từ cùng danh sách này. Thông báo về nguồn không phản hồi mở thẳng drawer này ([workspace.md](workspace.md#notifications)).

## Xem cách trích xuất bài viết

Panel **Sources & extraction** mặc định thu gọn; **Show details** mở ra:

- **How articles are extracted**: các bước trích xuất và lịch sử phiên bản template. **Restore** chuyển template đang dùng sang phiên bản đã chọn, có Undo.
- **Self-healing**: switch bật/tắt, đề xuất template mới kèm tỷ lệ lỗi và **Apply now**. Phần này được gắn nhãn "Under review · not in current scope" và **View diff** bị vô hiệu. Chức năng self-healing chưa được xác nhận nằm trong phạm vi (**Confirmed**: ghi riêng để xem xét sau, không mở rộng).

## Cần chốt

| Vấn đề | Điều đã biết | Cần quyết định |
| --- | --- | --- |
| Source type và Assets | Form Crawl settings có Source type và Assets, nhưng đổi giá trị không ảnh hưởng tới feed | Source type lọc nguồn hay là cấu hình crawl? Assets có lọc feed không? |
| Refresh every | Có lựa chọn 1–5 phút | Đây là chu kỳ crawl, hay chỉ là chu kỳ làm mới giao diện? |
| Trạng thái crawl | Start/Stop chỉ giữ trong trang | Crawl chạy liên tục ở nền và giữ trạng thái giữa các phiên không? |
| Cách tính sentiment | Có nhãn Positive, Neutral, Negative và điểm từ −1 tới +1 | Ngưỡng điểm cho từng nhãn, và nguồn tính điểm? |
| Sentiment theo coin | Điều kiện dùng "sentiment 24 giờ của coin" | Sentiment 24 giờ được tổng hợp từ các bài thế nào (trung bình, có trọng số theo nguồn)? |
| Link bài gốc | Drawer ghi chưa có link gốc | Có mở bài gốc không? Có lưu toàn văn không? |
| Liên kết với pair | Tin gắn với coin (BTC, ETH, SOL), không phải pair | Một bài nhắc tới nhiều coin thì xử lý thế nào? Sentiment áp dụng cho mọi pair của coin đó không? |
| Lịch sử tin | Feed chỉ có 24 giờ | Có cần xem tin cũ hơn, hoặc tìm theo từ khóa không? |
| Template extraction | Restore và Apply có trong UI, không gắn với self-healing | Quản lý phiên bản template có thuộc phạm vi hiện tại không, hay đi cùng self-healing? |
