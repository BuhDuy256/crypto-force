# Realtime

Đọc file này để biết cách xem chart nhiều timeframe, chọn nguồn tín hiệu, điều khiển cập nhật live và xử lý mất kết nối.

Realtime hiện một pair (BTCUSDT) trên tối đa bốn chart nến, mỗi chart có timeframe riêng. Dữ liệu và tín hiệu trong prototype là minh họa.

## Chọn số chart và timeframe

- **Charts**: chọn 1, 2 hoặc 4 chart. Chọn ít chart hơn thì chỉ ẩn các chart cuối; timeframe của chúng vẫn được giữ khi bật lại.
- **Timeframe**: mỗi chart có một ô chọn riêng (1m, 5m, 15m, 1h, 4h). Đổi timeframe của một chart không ảnh hưởng các chart khác.

Mỗi chart hiện nến, volume, đường MA(20), giá cuối, thay đổi trong 24 giờ và badge tín hiệu BUY hoặc SELL theo signal source đang chọn. Mỗi chart có mô tả cho screen reader, gồm giá cuối, MA(20) và tín hiệu.

## Chọn signal source

Ô **Signals from** liệt kê MA Crossover (built-in) cùng toàn bộ item trong Strategy library; composite có ghi chú "· composite".

1. Người dùng chọn một source. Badge tín hiệu trên các chart đổi theo source đó.
2. Lựa chọn được lưu lại cho các lần mở sau. Chọn MA Crossover sẽ xóa lựa chọn đã lưu.
3. Library cũng có thể đặt signal source bằng action **Use as signal source** ([strategy-engine.md](strategy-engine.md#đặt-làm-signal-source)).

Nếu source đã lưu bị xóa khỏi Library, Realtime chuyển về MA Crossover và hiện thông báo "{tên} was deleted from your library…" ngay dưới ô chọn. Thông báo biến mất khi người dùng chọn source khác.

Link **Manage in library** mở Strategy library.

## Backtest strategy đang xem

**Backtest this strategy** mở Backtest với signal source hiện tại được chọn sẵn ([backtest.md](backtest.md#chọn-strategy-để-backtest)).

## Cập nhật live và dữ liệu lịch sử

| Điều khiển | Hành vi |
| --- | --- |
| Live updates (switch) | Bật: dòng Data hiện "Live · Binance" kèm độ trễ. Tắt: hiện "Paused at {giờ}" |
| Load 1,000 past candles | Hiện trạng thái đang tải rồi toast xác nhận. Trong prototype không tải thêm dữ liệu |

## Mất kết nối

Khi kết nối dữ liệu bị mất:

1. Banner báo thời điểm mất kết nối. Chart giữ dữ liệu cuối cùng nhận được, tín hiệu tạm dừng tới khi dữ liệu chạy lại, và hệ thống tự thử kết nối lại.
2. Dòng Data đổi thành "Disconnected at {giờ} · retrying".
3. **Reconnect now** chuyển sang trạng thái "Reconnecting…". Thành công thì banner biến mất và toast báo "Reconnected. Live data resumed."

Trong prototype, trạng thái này được mở bằng link **Preview connection loss**. Artboard States có cùng banner nhưng chỉ là bản minh họa, không bấm được.

## Bắt đầu với onboarding checklist

Checklist "Get started: run the loop once" gồm ba bước: Create a strategy, Run a backtest, Start a Discovery search. Mỗi bước là link sang tab tương ứng.

Một bước được đánh dấu Done khi người dùng lưu strategy hoặc composite, chạy một backtest, hoặc bắt đầu một phiên Search. **Hide** ẩn checklist vĩnh viễn trên trình duyệt đó.

## Cần chốt

| Vấn đề | Điều đã biết | Cần quyết định |
| --- | --- | --- |
| Chọn pair | Realtime chỉ có BTCUSDT; Search vẫn liệt kê ETHUSDT và SOLUSDT dẫn tới Realtime | Realtime có cần ô chọn pair không? Mọi chart dùng chung một pair hay mỗi chart một pair? |
| Overlay | Chart chỉ có MA(20) | Overlay có cố định theo signal source, hay người dùng tự chọn? |
| Tín hiệu khi strategy chỉ là mô tả | Badge BUY/SELL hiện với mọi source | Tín hiệu được tính realtime từ rules của strategy, hay chỉ minh họa? |
| Load 1,000 past candles | Chỉ có toast | Dữ liệu tải thêm áp dụng cho một chart hay cho tất cả, và có giới hạn không? |
| Thời điểm tính onboarding | Done dựa trên cờ lưu trong trình duyệt | Cờ này tính theo tài khoản hay theo thiết bị? Bước nào cũng có thể Hide riêng không? |
| Mất kết nối khi Live tắt | Chưa thể hiện | Có báo mất kết nối khi người dùng đã tạm dừng live không? |
