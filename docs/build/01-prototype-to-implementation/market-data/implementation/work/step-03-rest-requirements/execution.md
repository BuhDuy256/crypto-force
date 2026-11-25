# Kết quả thực hiện requirements REST

Đọc file này để biết quyết định đã chốt trong Bước 3 và các thay đổi UI mock cần làm ở Bước 8.

## Quyết định đã chốt

Product owner chốt các quyết định dưới đây ngày 2026-11-20. Nội dung rule nằm trong use case [[1]](#ref-1).

| Câu hỏi | Kết quả | Rule |
| --- | --- | --- |
| Nến đang mở (OQ-084) | Có nến đang mở, nhãn chữ "đang mở", hiển thị thời điểm dữ liệu | MK-25, MK-26, MK-27 |
| MA khi thiếu nến (OQ-082) | Không vẽ điểm thiếu mẫu, MA phủ mọi nến khi lịch sử đủ, MA tính cả nến đang mở với nhãn giá trị tạm | MK-15, MK-24, MK-28 |
| MA và volume trong sidebar (OQ-083) | Sidebar bỏ MA và volume. Mỗi chart hiển thị MA và volume của nó. Volume theo base asset | MK-09, MK-60, MK-23, MK-29 |
| Timeframe, lựa chọn mặc định, pair | Thêm 1d. Mở với BTCUSDT và 5m, 15m, 1h, 4h. Pair BTCUSDT, ETHUSDT, SOLUSDT | MK-30, MK-31, MK-32 |
| Tải thêm lịch sử (OQ-032) | Bỏ thao tác tải thêm lịch sử khỏi Realtime | MK-16, MK-61, MK-03 |
| Baseline độc lập | Thêm giá trị nến, zoom, múi giờ, số thập phân, nến sai, accessibility, reflow và dữ liệu khớp nguồn. Chấp nhận cập nhật cần reload tới vòng polling | MK-27, MK-41 đến MK-59 |
| Exception flow | Xác nhận trạng thái tải, rỗng, lỗi và dữ liệu đúng lựa chọn. Thêm thời hạn chờ 10 giây, không lấp khoảng trống, reload về mặc định, khóa thử lại khi đang tải, lỗi không lộ chi tiết, phiên hết hạn theo Authentication | MK-10 đến MK-14, MK-17, MK-18, MK-34 đến MK-40 |

## Thay đổi UI mock cần làm ở Bước 8

| Hành vi UI Bước 2 | Requirement đã chốt |
| --- | --- |
| Không đánh dấu nến đang mở | Nến cuối có nhãn "đang mở", điểm MA cuối có nhãn giá trị tạm |
| Trạng thái chỉ ghi "Data loaded · {timeframe}" | Hiển thị thời điểm của dữ liệu |
| Volume không ghi đơn vị | Volume ghi đơn vị base asset |
| Sidebar có MA và volume của chart đầu tiên | Sidebar chỉ có giá, thay đổi 24h và trạng thái dữ liệu |
| Đường MA chỉ có từ nến thứ 20 của dữ liệu đã tải | MA phủ mọi nến đang hiển thị khi lịch sử đủ |
| Timeframe không có 1d, mặc định 1m, 5m, 15m, 1h | Có 1d, mặc định 5m, 15m, 1h, 4h |
| Mỗi chart có nút Load history | Không có nút tải thêm lịch sử |
| Chưa kiểm giá trị nến khi trỏ, múi giờ, số thập phân, mô tả chữ, nến không chỉ dùng màu và thời điểm theo chart | Kiểm và bổ sung theo MK-27, MK-41 đến MK-50, MK-58, MK-59 |
| Chưa kiểm thời hạn chờ và thao tác thử lại khi đang tải | Kiểm và bổ sung nếu thiếu: lỗi sau 10 giây chờ, khóa thử lại khi đang tải |

## References

1. <a id="ref-1"></a>[Market Data](../../../../../../UCs/market-data.md)
