# Strategy Engine và Strategy library

Đọc file này để biết cách tạo, sửa, lưu và quản lý strategy và composite, kèm các quy tắc validation, version và bản nháp.

Library chứa hai loại item: **strategy**, tạo trong Strategy Engine, và **composite**, tạo trong Composite builder trên màn Discovery. Cả hai dùng chung tên, version, Library và các action.

## Tạo strategy từ mô tả hoặc link

Strategy Engine có hai cách nhập. Đổi cách nhập sẽ bỏ preview hiện tại.

**Describe it**

1. Người dùng mô tả rules bằng ngôn ngữ tự nhiên, tối đa 1.000 ký tự. **Clear** xóa nội dung và có Undo.
2. **Preview example rules**:
   - Mô tả trống: toast lỗi yêu cầu mô tả entry, exit và stop loss.
   - Có nội dung: hiện trạng thái đang xử lý, sau đó hiện preview.

**Import from a link**

1. Người dùng dán link tới một bài viết về strategy. Link phải bắt đầu bằng `http://` hoặc `https://` và có domain; sai định dạng thì báo lỗi tại trường nhập.
2. **Extract from page**:
   - Trang có strategy: hiện preview.
   - Không tìm thấy strategy: toast lỗi, gợi ý kiểm tra link hoặc dán nội dung vào Describe it.

Trong prototype, preview luôn là một bộ rules mẫu cố định, không sinh ra từ mô tả. Chỉ một số domain mẫu (TradingView, Medium, GitHub Gist, Blogspot, Google Docs) cho kết quả thành công.

Sửa mô tả hoặc link sau khi đã preview sẽ bỏ preview. Người dùng phải preview lại trước khi lưu.

## Review rules trước khi lưu

Preview gồm bảng rules, danh sách giả định cần xác nhận và định nghĩa JSON.

- Rules mẫu có một rule SHORT minh họa. **Remove short example** bỏ rule đó và có Undo; strategy khi đó chỉ còn LONG.
- **Strategy definition (JSON)**: Show/Hide, Copy (toast xác nhận đã copy).
- **Validation & actions** chỉ hiện sau khi có preview. Phần kiểm tra (Required fields, Logic, Indicators) là ví dụ; prototype không chạy validation thật.

## Lưu strategy

Các trường trước khi lưu:

| Trường | Quy tắc |
| --- | --- |
| Name | Bắt buộc, tối đa 60 ký tự, không trùng tên item khác trong Library (không phân biệt hoa thường) |
| Version | Hiển thị, không sửa được: `1.0.0` khi tạo mới; khi sửa thì hiện version sẽ có sau khi lưu |
| Tags | Xóa từng tag, có Undo |
| Source | "Written by you" hoặc "Imported from a link", theo cách nhập |

**Save strategy** (hoặc **Save changes** khi đang sửa):

| Điều kiện | Kết quả |
| --- | --- |
| Chưa có preview | Toast lỗi "Open a strategy preview before saving." |
| Tên trống hoặc trùng | Toast lỗi, không lưu |
| Tạo mới | Thêm item vào đầu Library, version 1.0.0, ghi Created và Updated |
| Đang sửa | Cập nhật đúng item đó, tăng patch version (1.0.0 → 1.0.1), cập nhật Updated (**Confirmed**: không hỏi "lưu thành bản mới") |

Sau khi lưu, toast có link **Backtest it** mở Backtest với strategy vừa lưu. Bản nháp được xóa. Strategy Engine chuyển sang trạng thái đang sửa item vừa lưu, nên lần lưu tiếp theo sẽ cập nhật cùng item.

Muốn có một bản riêng để chỉnh, người dùng dùng **Duplicate** trong Library rồi sửa bản sao (**Confirmed**).

## Sửa một item trong Library

**Edit** trong Library mở đúng nơi tạo ra item (**Confirmed**):

| Loại | Mở | Khôi phục |
| --- | --- | --- |
| Strategy | Strategy Engine | Cách nhập, mô tả hoặc link, tags, tên, rule SHORT; preview được bật sẵn |
| Composite | Composite builder trên Discovery | Building blocks, cách vote, weights (**Confirmed**) |

Khi đang sửa, banner hiện "Editing {tên} · v{version}" và nhắc rằng các run cũ vẫn giữ cấu hình đã chạy ([backtest.md](backtest.md#snapshot-cấu-hình-của-run)).

**Stop editing**:

- Chưa có thay đổi: thoát chế độ sửa và mở Library.
- Có thay đổi chưa lưu: hộp thoại "Discard changes to {tên}?". **Keep editing** ở lại; **Discard changes** bỏ thay đổi và bản nháp, item trong Library giữ nguyên.

## Bản nháp

Strategy Engine và Composite builder tự lưu nháp trong trình duyệt mỗi khi nội dung thay đổi so với bản gốc (**Confirmed**).

| | Strategy Engine | Composite builder |
| --- | --- | --- |
| Nội dung nháp | Cách nhập, mô tả, link, tags, tên, rule SHORT | Building blocks, cách vote, weights |
| Phạm vi | Một nháp cho strategy mới, hoặc một nháp cho item đang sửa | Tương tự, cho composite |

Khi mở lại màn hình trong cùng ngữ cảnh (cùng tạo mới, hoặc cùng sửa một item), nháp được khôi phục kèm banner "Restored your unsaved changes from {giờ}" và hai nút: **Discard draft** (quay về bản gốc) hoặc **Keep** (ẩn banner). Nháp được xóa khi lưu thành công, khi Discard, hoặc khi xác nhận bỏ thay đổi.

Nháp strategy không được khôi phục nếu người dùng đến Strategy Engine kèm một ý tưởng từ Landing hoặc một điều kiện từ News; dữ liệu mới đó được ưu tiên.

## Nhận dữ liệu từ màn hình khác

| Nguồn | Strategy Engine làm gì |
| --- | --- |
| Ý tưởng từ Landing | Điền vào mô tả, hiện ghi chú đã giữ ý tưởng |
| News: thêm điều kiện | Thêm câu điều kiện sentiment vào cuối mô tả, bỏ preview, hiện banner nhắc preview lại |
| News: sample strategy | Bắt đầu một strategy mới (không sửa item nào) với mô tả, tên và tag mẫu |

Xem [news.md](news.md#đưa-sentiment-vào-strategy).

## Xem Strategy library

Strategy Engine hiện ba item gần nhất ("Your library") kèm **View all (N)**. Mỗi dòng có Backtest và Open. Library là màn hình riêng:

- Lọc theo All, Strategies hoặc Composites, kèm số lượng từng loại.
- Tìm theo tên hoặc tag.
- Mỗi item hiện loại, nguồn, version, thời điểm cập nhật, tags, kết quả run gần nhất (hoặc "Not backtested yet") và nhãn "Realtime signal source" nếu đang được dùng.
- Item mới lưu đứng đầu danh sách. Sửa một item không đổi vị trí của nó.

| Trạng thái | Hiển thị |
| --- | --- |
| Library trống | Hướng dẫn kèm Create a strategy và Build a composite |
| Không có kết quả tìm | Thông báo kèm **Clear search and filters** |

**New strategy** và **New composite** mở trang tạo mới và bỏ chế độ sửa đang dở.

## Xem chi tiết một item

**Details**, hoặc chọn tên item, mở drawer chi tiết. Drawer có version, nguồn, Updated, Created, rules, mô tả hoặc link nguồn (với strategy), building blocks kèm weights và cách vote (với composite), và tối đa 5 backtest run gần nhất. Mỗi run là link mở chi tiết run.

Drawer đóng bằng nút Close, phím Esc hoặc chọn ra ngoài.

## Đặt làm signal source

**Use as signal source** đặt item làm nguồn tín hiệu của Realtime và hiện toast có link Open Realtime. Nếu item đã là signal source, nút hiện "Current signal source" và bị vô hiệu. Xem [realtime.md](realtime.md#chọn-signal-source).

## Đổi tên

1. **Rename** chuyển tiêu đề drawer thành ô nhập.
2. Enter hoặc **Save** để lưu; Esc hoặc **Cancel** để hủy.
3. Validation giống trường Name khi lưu ([Lưu strategy](#lưu-strategy)).
4. Đổi tên cập nhật Updated, không tăng version và không đổi rules. Nếu item là signal source, Realtime hiện tên mới.

Các run cũ vẫn giữ tên lúc chạy ([backtest.md](backtest.md#snapshot-cấu-hình-của-run)).

## Nhân bản

**Duplicate** tạo bản sao ngay sau item gốc, tên "{tên} (copy)" (tự thêm số nếu trùng), version 1.0.0, Created bằng thời điểm hiện tại. Drawer chuyển sang bản sao và mở sẵn ô đổi tên.

## Xóa

1. **Delete** mở hộp thoại xác nhận "Delete "{tên}"?". Hộp thoại nói rõ item sẽ bị gỡ khỏi Library và các ô chọn strategy, còn run cũ vẫn giữ bản sao cấu hình. Nếu item đang là signal source của Realtime, hộp thoại cảnh báo thêm rằng Realtime sẽ quay về MA Crossover.
2. Xác nhận sẽ xóa item, đóng drawer và hiện toast có Undo. Undo đưa item về đúng vị trí cũ.

Chi tiết run của strategy đã xóa báo rằng strategy không còn trong Library ([backtest.md](backtest.md#snapshot-cấu-hình-của-run)).

## Tạo và sửa composite

Composite builder nằm trên màn Discovery, cạnh leaderboard.

1. Người dùng chọn building blocks (MA, RSI, Bollinger Bands, Support / Resistance, SMC, Wyckoff) hoặc một quick pick. Quick pick thay toàn bộ lựa chọn hiện tại.
2. Chọn cách vote: **Majority vote** hoặc **Weighted**.
3. Với Weighted, **Adjust weights** mở phần chỉnh weights; dòng tiêu đề tóm tắt các weights hiện tại.
4. **Save composite** (hoặc **Save changes** khi đang sửa):
   - Dưới 2 building blocks: toast lỗi, không lưu.
   - Tạo mới: tên tự sinh từ các block đã chọn (ví dụ "MA + RSI + S/R"), tự thêm số nếu trùng; nguồn là "Built in Discovery"; version 1.0.0.
   - Đang sửa: cập nhật đúng composite đó (**Confirmed**), giữ tên, tăng patch version.
   - Rules của composite được sinh từ danh sách block và cách vote.
   - Toast có link Backtest it mở Backtest với composite vừa lưu.
5. **Backtest now** gửi cấu hình hiện tại trên builder sang Backtest, kể cả khi chưa lưu ([backtest.md](backtest.md#chọn-strategy-để-backtest)).

Khi đang có phiên Search chạy, Composite builder vẫn dùng được; chỉ phần Search configuration bị khóa.

## Điểm UI chưa xác định

| Vấn đề | Điều đã biết | Cần quyết định |
| --- | --- | --- |
| Rules được sinh thế nào | Preview luôn là bộ rules mẫu | Hệ thống phân tích mô tả và link ra sao? Khi không chắc chắn thì hỏi lại người dùng hay đánh dấu giả định? |
| Domain được hỗ trợ khi import | Prototype chỉ thành công với vài domain mẫu | Danh sách domain được hỗ trợ, và cách xử lý trang cần đăng nhập hoặc có paywall? |
| Validation thật | Checks hiện là ví dụ | Những lỗi nào chặn việc lưu, lỗi nào chỉ là cảnh báo? |
| Sửa rules trực tiếp | Chỉ sửa được qua mô tả, link và việc bỏ rule SHORT | Người dùng có được sửa tham số của từng rule hoặc sửa JSON không? |
| Thêm tag | Có ô "Add tag" nhưng chưa có hành vi | Tag tự do hay chọn từ danh sách? Có giới hạn số lượng không? |
| Version | Mỗi lần lưu khi sửa tăng patch | Có cần phân biệt minor và major (ví dụ đổi logic so với chỉ đổi tham số) không? |
| Weights theo block | Phần weights luôn hiện ba dòng MA, RSI, Support / Resistance dù người dùng chọn block khác | Weights có đi theo đúng danh sách block đã chọn không? Tổng weights có phải bằng 1 không? |
| Majority vote khi hòa | Rules ghi "ties hold" | Đây có phải quy tắc chính thức không? |
| Tên composite | Tên tự sinh, chỉ đổi được bằng Rename trong Library | Có cho đặt tên ngay khi lưu không? |
| Xóa item có run đang chạy | Chưa thể hiện | Có chặn xóa hay cho phép, và run đó hiển thị ra sao? |
| Undo sau khi xóa | Undo có trong 8 giây | Sau đó có cách khôi phục nào khác không? |
