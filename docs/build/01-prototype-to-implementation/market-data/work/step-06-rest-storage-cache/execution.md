# Kết quả thiết kế database và cache cho REST

Đọc file này để biết quyết định đã chốt trong Bước 6 và việc chuyển cho Bước 7–8.

## Quyết định đã chốt

Product owner duyệt kế hoạch Bước 6 ngày 2026-11-20, gồm hai mục vận hành: xử lý 429/418 và giới hạn khi chạy nhiều instance [[1]](#ref-1). Thiết kế nằm trong Market Data [[2]](#ref-2), Data Model [[3]](#ref-3) và ADR-006 [[4]](#ref-4).

| Câu hỏi | Kết quả | Nơi ghi |
| --- | --- | --- |
| Lưu nến vào PostgreSQL | Không lưu ở vòng REST; không thêm bảng hoặc migration | 21-database, ADR-006 |
| Vị trí cache | Decorator `MarketDataProvider` trong process API, bọc adapter ở composition root | 10-market-data, Cache và giới hạn request |
| Khóa và TTL | Nến: `pair` + `timeframe` + số nến; summary: `pair`. Khóa có số nến vì đó là input của provider; decorator không giả định Service luôn gửi cùng số nến. TTL 5 giây, cấu hình của API | 10-market-data |
| Request trùng và lỗi | Single-flight theo khóa; không cache lỗi; không làm mới chủ động | 10-market-data |
| `dataTime`, `isClosed` | Đi cùng giá trị cache; `dataTime` vẫn là lúc API nhận response của provider | 10-market-data, 22-api-endpoints |
| Giới hạn Binance | 429/418: dừng gọi Binance theo `Retry-After`, trả 503 `MARKET_DATA_UNAVAILABLE`; 403 trả 503; API không tự thử lại; log `X-MBX-USED-WEIGHT-1M` | 10-market-data |
| `Cache-Control` | Giữ `no-store`; contract không đổi | 22-api-endpoints |
| Nhiều instance API | Ghi là giới hạn, xét lại khi chạy hơn một instance | 10-market-data, ADR-006 |

## Số liệu Binance

Đọc ngày 2026-11-20 từ trang Limits, trang Market endpoints và response `exchangeInfo?symbol=BTCUSDT`:

- `REQUEST_WEIGHT`: 6000 mỗi phút mỗi IP.
- `klines`: weight 2 cho mọi `limit` tới 1000. `ticker/24hr` một symbol: weight 2.
- 429 khi vượt giới hạn; 418 khi IP bị khóa vì tiếp tục gửi sau 429, khóa từ 2 phút tới 3 ngày; `Retry-After` tính bằng giây.
- Tên header `X-MBX-USED-WEIGHT-1M` suy từ mẫu `X-MBX-USED-WEIGHT-(intervalNum)(intervalLetter)` và `rateLimits` (1 MINUTE). Bước 8 xác nhận trên response thật.

Mức trần với cache: 21 khóa × 12 lần mỗi phút × 2 weight = 504 weight mỗi phút mỗi instance.

## Sửa trong review

- Anchor `[[8, Quy tắc]]` của ADR-005 (có từ Bước 5) và ADR-006 đổi sang section `Xem lịch sử thị trường`, vì use case không có section `Quy tắc`.
- Mức trần 504 weight chỉ đúng khi provider trả thành công; đã ghi giới hạn khi Binance lỗi.

## Chuyển cho bước sau

| Bước | Việc |
| --- | --- |
| 07 Kiểm chứng | Test decorator với provider giả lập và đồng hồ giả: trả cache trong TTL, gọi lại sau TTL, single-flight (nhiều request đồng thời, một lời gọi), lỗi không được cache, khóa khác nhau không dùng chung. Test adapter: 429/418 với `Retry-After` chặn lời gọi tới hết thời gian, 403 thành lỗi nguồn không khả dụng. Test `dataTime` của response từ cache bằng thời điểm nhận ban đầu |
| 08 Build | `cached-market-data.provider.ts` trong `providers/market-data/`; bọc adapter trong composition root; TTL và timeout trong `configs/env.ts`; log cache hit/miss và weight; xác nhận tên header weight trên response thật |

## Kiểm chứng

| Kiểm tra | Kết quả ngày 2026-11-20 |
| --- | --- |
| `pnpm exec prettier --check` các file Markdown đã sửa | Đạt |
| `pnpm check:docs` | Đạt (`docs OK`) |
| `review-change` | 4 finding medium và 5 finding low đã sửa. Giữ 1 finding low: số liệu lặp trong `execution.md`, vì file này là bản ghi công việc tại thời điểm chốt |

## References

1. <a id="ref-1"></a>[Kế hoạch thiết kế database và cache cho REST](plan.md)
2. <a id="ref-2"></a>[Market Data & Realtime Updates](../../../../../architecture/10-market-data.md)
3. <a id="ref-3"></a>[Data Model & Persistence](../../../../../architecture/21-database.md)
4. <a id="ref-4"></a>[Architectural Decisions](../../../../../architecture/30-decisions.md)
