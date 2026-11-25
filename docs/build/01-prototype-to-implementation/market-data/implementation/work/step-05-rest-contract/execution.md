# Kết quả thiết kế contract nến và API REST

Đọc file này để biết quyết định đã chốt trong Bước 5 và việc chuyển cho Bước 6–8.

## Quyết định đã chốt

Product owner duyệt kế hoạch Bước 5 ngày 2026-11-20 [[1]](#ref-1). Contract nằm trong Market Data [[2]](#ref-2), API Contracts [[3]](#ref-3) và ADR-005 [[4]](#ref-4).

| Câu hỏi | Kết quả | Nơi ghi |
| --- | --- | --- |
| Điều kiện truy cập | Yêu cầu phiên; 401 `UNAUTHENTICATED` | 22-api-endpoints, Quyết định |
| Kiểm phiên trong Express | `auth.api.getSession({ headers: fromNodeHeaders(req.headers) })`. Đã đọc source Better Auth đang cài: endpoint có `requireHeaders: true`, trả `null` khi không có phiên. Cookie cache không bật, nên phiên bị thu hồi bị từ chối ngay | 22-api-endpoints, Endpoint Market Data |
| Shape nến | `openTime`, `open`, `high`, `low`, `close`, `volume`, `isClosed` | 10-market-data, Contract nến |
| Lịch sử nến | `pair`, `timeframe`, `candles`, `warmupCount`, `dataTime` | 10-market-data, Contract nến |
| Summary | `pair`, `lastPrice`, `change24hPercent`. Không có `dataTime`: MK-27 chỉ áp dụng cho chart, MK-60 không yêu cầu thời điểm trên sidebar | 10-market-data, Summary |
| Kiểu số | JSON number, không làm tròn | 10-market-data, Nến |
| Số chữ số thập phân (MK-44) | Hằng số theo pair trong `packages/shared` | ADR-005 |
| Endpoint và query | `GET /api/market-data/candles?pair&timeframe`, `GET /api/market-data/summary?pair`; client không gửi số nến | 22-api-endpoints |
| Lỗi | 400 `INVALID_QUERY`, 503 `MARKET_DATA_UNAVAILABLE`, 502 `MARKET_DATA_INVALID`, 500 `INTERNAL_ERROR` | 22-api-endpoints, Lỗi Market Data |

## Điều chỉnh so với Bước 4

Việc sửa schema nháp chuyển sang Bước 8, theo abstract plan. Bỏ `ma20` bắt Web tự tính MA, nên đây là việc build.

## Chuyển cho bước sau

| Bước | Việc |
| --- | --- |
| 06 Database và cache | Giới hạn request theo IP của Binance; cache nến và summary. `Cache-Control: no-store` ở HTTP giữ nguyên trừ khi thiết kế cache đổi |
| 07 Kiểm chứng | Test 401 khi không có phiên và khi phiên bị thu hồi; test mã HTTP và `code` của bốn nhóm lỗi; test `warmupCount` khi provider trả ít nến; test `isClosed` của nến cuối; test chuẩn hóa kline mẫu |
| 08 Build — schema | `market-data.schema.ts`: thêm timeframe `1d`; bỏ `ma20`; thêm `isClosed`, `warmupCount`, `dataTime`; metadata pair có số chữ số thập phân (lấy tick size từ `exchangeInfo`, ghi nguồn); query schema từ chối tham số thừa |
| 08 Build — Web | Tính MA từ `candles`, không vẽ `warmupCount` nến đầu; đọc `code` của lỗi; 401 chuyển sang màn chặn workspace; cập nhật mock MSW |
| 08 Build — API | Middleware kiểm phiên dùng chung; truyền `auth` vào `createApiRouter`; `AppError` cho bốn nhóm lỗi |

## Kiểm chứng

| Kiểm tra | Kết quả ngày 2026-11-20 |
| --- | --- |
| `pnpm check:docs` | Đạt |
| `pnpm exec prettier --check` các file Markdown đã sửa | Đạt |
| Tài liệu Binance (klines, ticker 24hr, exchangeInfo) | Đọc ngày 2026-11-20: thứ tự phần tử kline, kiểu chuỗi của giá, `lastPrice`, `priceChangePercent` khớp contract. `PRICE_FILTER` là optional, đã ghi vào ADR-005 |
| `review-change` | 3 finding medium và 3 finding low đã sửa. Giữ 2 finding low: đề xuất `dataTime` của summary trong `plan.md` (plan ghi đề xuất trước khi chốt) và câu yêu cầu phiên lặp lại trong `10-market-data.md` (đã link tới API Contracts) |

## References

1. <a id="ref-1"></a>[Kế hoạch thiết kế contract nến và API REST](plan.md)
2. <a id="ref-2"></a>[Market Data & Realtime Updates](../../../../../../architecture/10-market-data.md)
3. <a id="ref-3"></a>[API Contracts](../../../../../../architecture/22-api-endpoints.md)
4. <a id="ref-4"></a>[Architectural Decisions](../../../../../../architecture/30-decisions.md)
