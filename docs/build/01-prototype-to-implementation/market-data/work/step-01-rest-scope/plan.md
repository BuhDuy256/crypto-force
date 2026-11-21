# Phạm vi flow REST đầu tiên

Đọc file này để biết phạm vi đã thống nhất, thứ tự triển khai và cách kiểm chứng Bước 1 của Market Data.

## Phạm vi đã thống nhất

Product owner đã thống nhất giữ multi-chart, nến, volume, MA(20), giá/thay đổi 24h và bảng thông tin bên cạnh trên màn hình Realtime. Live updates và phục hồi kết nối cũng thuộc phạm vi, triển khai sau REST. Phạm vi này theo các increment tải lịch sử → polling → WebSocket trong kế hoạch tổng quan và định hướng CV [[1]](#ref-1) [[2]](#ref-2).

UI tham chiếu là màn hình Realtime của prototype. Prototype có một pair chung, chọn 1/2/4 chart và timeframe riêng cho từng chart [[3, Chọn số chart và timeframe]](#ref-3) [[4]](#ref-4). Các số và lựa chọn này lấy từ prototype, không phải giới hạn mới do agent đặt.

| Trong phạm vi REST tải lịch sử | Đầu ra mong muốn của flow |
| --- | --- |
| Chọn pair chung | Các chart hiển thị lịch sử nến của pair đang chọn |
| Chọn 1/2/4 chart | Giữ multi-chart theo prototype. Khi giảm số chart, giữ timeframe của chart ẩn để dùng khi bật lại [[3]](#ref-3) |
| Đổi timeframe của một chart | Chỉ chart đó tải dữ liệu tương ứng. Các chart khác giữ lựa chọn và dữ liệu [[3]](#ref-3) |
| Hiển thị nến và volume | Mỗi chart hiển thị dữ liệu theo pair chung và timeframe riêng |
| Hiển thị MA(20) | Vẽ đường trung bình giá đóng cửa của 20 nến theo timeframe của chart. MA là chỉ báo hiển thị, không tạo tín hiệu BUY/SELL |
| Hiển thị giá và thay đổi 24h | Hiển thị thông tin thị trường của pair đang chọn, tách khỏi timeframe riêng của các chart |
| Bảng thông tin bên cạnh | Giữ giá, thay đổi 24h, MA, volume và trạng thái dữ liệu theo bố cục tham chiếu [[3]](#ref-3) [[4]](#ref-4) |
| Tải lịch sử | Giữ thao tác tải lịch sử trên từng chart. Nhãn prototype là “Load 1,000 past candles”, chưa coi số lượng hoặc cách nối nến là contract đã chốt [[3, Cập nhật live và dữ liệu lịch sử]](#ref-3) |
| Hiển thị biểu đồ | Dùng Lightweight Charts và hiển thị attribution theo stack của project |

**Proposed:** mỗi chart có loading, empty, error và thao tác thử lại riêng. Khi đổi lựa chọn liên tiếp, chỉ hiển thị kết quả đúng lựa chọn hiện tại. Agent đề xuất các hành vi này để một chart tải lỗi không làm mất khả năng xem các chart còn lại.

Bước 1 chốt phạm vi chức năng, chưa chốt toàn bộ business rules hoặc API contract. Bước 2 dùng mock để làm rõ tương tác. Bước 3 chốt hành vi chi tiết, gồm cách tính MA khi thiếu nến và ý nghĩa MA/volume trong bảng thông tin [[1]](#ref-1).

## Phân chia REST và live updates

| Phần triển khai | Thời điểm | Kết quả cần có |
| --- | --- | --- |
| REST tải lịch sử và thông tin thị trường | Bước 2–8 | Flow multi-chart và các dữ liệu hiển thị trong bảng phạm vi chạy được xuyên suốt |
| REST polling | Increment riêng trong Bước 8 | Cập nhật định kỳ để tạo baseline trước WebSocket [[1]](#ref-1) |
| Live updates bằng WebSocket | Bước 9–12 | Bật/tắt cập nhật, phân phối dữ liệu đúng pair/timeframe và cập nhật nến đang mở [[1]](#ref-1) [[3]](#ref-3) |
| Phục hồi kết nối | Bước 9–12 | Hiển thị mất kết nối, giữ dữ liệu cuối, reconnect và dùng REST bù nến thiếu. Phân biệt kết nối đã mở lại với dữ liệu đã đồng bộ [[1]](#ref-1) [[5]](#ref-5) |
| Benchmark capacity, freshness, fan-out và recovery | Chọn phép đo tại Bước 7, bổ sung tại Bước 11 | Giữ mục tiêu đo trong CV. Chỉ báo kết quả đã đạt khi có bằng chứng [[1]](#ref-1) [[2]](#ref-2) |

## Phần hoãn khỏi phạm vi màn hình

Product owner đã đồng ý hoãn tín hiệu BUY/SELL và chọn strategy trong ô Signals from. MA(20) vẫn nằm trong phạm vi đọc chart. Các phần này vốn xuất hiện cùng nhau trên prototype [[3]](#ref-3).

**Proposed:** hoãn Backtest this strategy, Manage in library và onboarding dẫn sang Strategy/Backtest/Discovery. Agent đề xuất giữ flow Market Data độc lập với các workflow chưa triển khai. Các link trên Realtime chưa làm các màn hình đích trở thành phạm vi công việc [[3]](#ref-3).

**Proposed:** hoãn tìm kiếm lịch sử theo khoảng ngày tùy chọn và tự tải thêm nến khi kéo chart về quá khứ. Agent đề xuất giữ thao tác tải lịch sử rõ ràng trước khi mở rộng tương tác. Đề xuất này không loại bỏ nút tải lịch sử của từng chart.

## Công việc và đầu ra của Bước 1

1. Đối chiếu phạm vi với mục tiêu Market Data và các nhóm giá trị trong CV [[2]](#ref-2) [[5]](#ref-5).
2. Đối chiếu các khu vực của UI Realtime với phạm vi REST và vòng WebSocket [[3]](#ref-3) [[4]](#ref-4).
3. Ghi phạm vi đã thống nhất và phân biệt với các chi tiết Proposed trong file này.
4. Cập nhật tracker với link tới phạm vi và kết quả kiểm chứng.

Đầu ra của Bước 1 là phạm vi đã thống nhất để bắt đầu frontend bằng mock. Bước 1 chưa tạo contract API, schema, thiết kế cache hoặc code production. Các đầu ra đó thuộc các bước sau [[1]](#ref-1).

## Tài liệu và cách kiểm chứng

Trong Bước 1, chỉ cập nhật file này và tracker. Giữ nguyên abstract plan. Bản nháp use case bắt đầu tại Bước 2 theo kế hoạch tổng quan [[1]](#ref-1).

- Kiểm tra phạm vi có flow chính, trạng thái tải dữ liệu, lỗi và các phần hoãn.
- Kiểm tra multi-chart còn trong phạm vi REST. Đổi timeframe một chart không làm tải lại các chart khác.
- Kiểm tra live updates và phục hồi kết nối còn trong phạm vi vòng WebSocket.
- Kiểm tra mục tiêu provider boundary, observability và các phép so sánh REST–WebSocket vẫn được giữ ở các bước sau [[1]](#ref-1) [[5]](#ref-5).
- Chạy Prettier trên hai file đã sửa và chạy `pnpm check:docs`.
- Chỉ đánh dấu Bước 1 hoàn thành sau khi product owner thống nhất phạm vi và các kiểm tra tài liệu đạt.

## References

1. <a id="ref-1"></a>[Kế hoạch triển khai Market Data ở mức tổng quan](../../abstract-implementation-plan.md)
2. <a id="ref-2"></a>[Market Data sẽ thêm dòng nào vào CV?](../../cv-goal.md)
3. <a id="ref-3"></a>[Realtime](../../../../../design/prototype/docs/requirements/realtime.md)
4. <a id="ref-4"></a>[Realtime – Crypto Force](../../../../../design/prototype/screens/Realtime.dc.html)
5. <a id="ref-5"></a>[Những thứ cần đạt được trong lúc build Market Data](../../goal.md)
