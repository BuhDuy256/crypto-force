# Architecture

Đọc file này để biết cách Crypto Force được tổ chức để đáp ứng các use case và quality attribute, và tìm file kiến trúc theo từng nhóm quyết định.

Hành vi quan sát được và số đo nằm trong [Use Cases](../UCs/README.md); file trong thư mục này chỉ mô tả cơ chế và trỏ về ID của use case.

## Table of Contents

| File | Câu hỏi được trả lời |
| --- | --- |
| [00-system.md](00-system.md) | Hệ thống gồm những container nào, trách nhiệm và kết nối là gì, phần nào đã triển khai? |
| [10-market-data.md](10-market-data.md) | Dữ liệu thị trường được lấy, chuẩn hóa và cập nhật realtime thế nào? |
| [11-strategy.md](11-strategy.md) | Strategy được biểu diễn, thực thi và mở rộng thế nào? |
| [12-combination.md](12-combination.md) | Các strategy được kết hợp và tín hiệu được hợp nhất thế nào? |
| [13-backtesting.md](13-backtesting.md) | Backtest được thực thi và giao dịch được mô phỏng thế nào? |
| [14-evaluation.md](14-evaluation.md) | Kết quả được đánh giá, xếp hạng và đưa vào leaderboard thế nào? |
| [15-search.md](15-search.md) | Candidate được sinh, đánh giá và điều phối trong loop thế nào? |
| [16-news-sentiment.md](16-news-sentiment.md) | Tin tức được thu thập, phân tích sentiment và truy vết kết quả thế nào? |
| [20-state-machine.md](20-state-machine.md) | Process và đối tượng nào có vòng đời, ai sở hữu trạng thái và sự kiện nào chuyển trạng thái? |
| [21-database.md](21-database.md) | Hệ thống lưu gì, ERD và constraints là gì, dữ liệu được sở hữu và migrate thế nào? |
| [22-api-endpoints.md](22-api-endpoints.md) | Contract nào đi qua ranh giới hệ thống, ai gọi được và nhận input/output/error gì? |
| [23-security.md](23-security.md) | Tài sản và trust boundary nào được bảo vệ, cơ chế đặt ở đâu và còn gap gì? |
| [30-decisions.md](30-decisions.md) | Vì sao chọn mỗi phương án kiến trúc, trade-off và điều kiện xét lại là gì? |

Các file `00`, `20`–`23` là góc nhìn toàn hệ thống; nội dung hiện trạng được giới hạn bởi code đã có, không đổi phạm vi theo increment. Các file `11`–`16` hiện mới định nghĩa phạm vi module, chưa có thiết kế chi tiết. `10-market-data.md` có thiết kế vòng REST tải lịch sử và vòng cập nhật định kỳ đã triển khai, cùng thiết kế vòng WebSocket đã duyệt ngày 2026-11-23 (chưa triển khai). Bức tranh triển khai hiện tại nằm trong [thành phần hệ thống](00-system.md#thành-phần).

## Driver và file đáp ứng

| Driver | File |
| --- | --- |
| [Authentication](../UCs/authentication.md): Sign in, Google, Create account, Reset password | [00-system.md](00-system.md), [21-database.md](21-database.md), [22-api-endpoints.md](22-api-endpoints.md), [23-security.md](23-security.md) |
| [Authentication](../UCs/authentication.md#phiên-và-sign-out): màn chặn, kiểm lại phiên, Sign out và thời hạn phiên (SS-01–SS-08) | [20-state-machine.md](20-state-machine.md), [23-security.md](23-security.md); quyết định màn chặn trong [30-decisions.md](30-decisions.md) |
| [Authentication](../UCs/authentication.md#bảo-mật): origin, cookie, rate limit và lưu bộ đếm (SEC-01–SEC-09) | [21-database.md](21-database.md), [22-api-endpoints.md](22-api-endpoints.md), [23-security.md](23-security.md); mức bảo mật trong [30-decisions.md](30-decisions.md) |
| [Market Data](../UCs/market-data.md): xem lịch sử nến trên nhiều chart, lỗi, dữ liệu đúng nguồn và cập nhật định kỳ (MK-01–MK-92) | [10-market-data.md](10-market-data.md), [21-database.md](21-database.md), [22-api-endpoints.md](22-api-endpoints.md); provider, MA và cache trong [30-decisions.md](30-decisions.md) |
| [Market Data](../UCs/market-data.md#theo-dõi-cập-nhật-trực-tiếp): cập nhật trực tiếp, mất kết nối, dữ liệu cũ, phục hồi đồng bộ và bảo mật WebSocket (MK-93–MK-142) | [00-system.md](00-system.md), [10-market-data.md](10-market-data.md), [20-state-machine.md](20-state-machine.md), [21-database.md](21-database.md), [22-api-endpoints.md](22-api-endpoints.md), [23-security.md](23-security.md); quyết định WebSocket trong [30-decisions.md](30-decisions.md) |
| [Modifiability](../UCs/quality-attributes.md#modifiability): thêm Strategy, thêm cách sinh candidate (QA-01, QA-02) | [11-strategy.md](11-strategy.md), [15-search.md](15-search.md) |
| [Scalability và Performance](../UCs/quality-attributes.md#scalability-và-performance): backtest nhiều candidate (QA-03, QA-04) | [13-backtesting.md](13-backtesting.md), [15-search.md](15-search.md) |
| [Modifiability](../UCs/quality-attributes.md#modifiability): thêm provider dữ liệu thị trường (QA-09) | [10-market-data.md](10-market-data.md), [30-decisions.md](30-decisions.md) |
| [Scalability và Performance](../UCs/quality-attributes.md#scalability-và-performance): mở Realtime và đổi timeframe (QA-10, QA-11) | [10-market-data.md](10-market-data.md) |
| [Scalability và Performance](../UCs/quality-attributes.md#scalability-và-performance): request tới Binance khi nhiều client làm mới định kỳ (QA-13) | [10-market-data.md](10-market-data.md), [30-decisions.md](30-decisions.md) |
| [Scalability và Performance](../UCs/quality-attributes.md#scalability-và-performance): tải đồng thời và chia sẻ subscription WebSocket (QA-15) | [10-market-data.md](10-market-data.md), [23-security.md](23-security.md), [30-decisions.md](30-decisions.md) |
| [Realtime](../UCs/quality-attributes.md#realtime): độ mới dữ liệu khi làm mới định kỳ (QA-12) | [10-market-data.md](10-market-data.md), [30-decisions.md](30-decisions.md) |
| [Realtime](../UCs/quality-attributes.md#realtime): độ trễ nhận event và độ mới dữ liệu trực tiếp (QA-05, QA-14) | [10-market-data.md](10-market-data.md), [22-api-endpoints.md](22-api-endpoints.md), [30-decisions.md](30-decisions.md) |
| [Reliability](../UCs/quality-attributes.md#reliability): mất kết nối Binance, phục hồi đồng bộ, toàn vẹn OHLCV và job lỗi (QA-06, QA-07, QA-16, QA-17) | [10-market-data.md](10-market-data.md), [20-state-machine.md](20-state-machine.md), [22-api-endpoints.md](22-api-endpoints.md), [30-decisions.md](30-decisions.md), [13-backtesting.md](13-backtesting.md) |
| [Observability](../UCs/quality-attributes.md#observability): trạng thái của loop (QA-08) | [15-search.md](15-search.md) |
