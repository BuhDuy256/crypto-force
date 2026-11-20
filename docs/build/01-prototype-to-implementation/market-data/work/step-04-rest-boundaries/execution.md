# Kết quả thiết kế ranh giới và luồng xử lý REST

Đọc file này để biết quyết định đã chốt trong Bước 4 và việc chuyển cho Bước 5–8.

## Quyết định đã chốt

Product owner duyệt toàn bộ đề xuất của kế hoạch Bước 4 ngày 2026-11-20 [[1]](#ref-1). Thiết kế nằm trong Market Data [[2]](#ref-2) và ADR [[3]](#ref-3).

| Câu hỏi | Kết quả | Nơi ghi |
| --- | --- | --- |
| Vị trí provider | Layer `apps/api/src/providers/market-data/`, interface cùng adapter | ADR-003 |
| Truyền provider giả lập | Composition root truyền qua `AppDependencies`, `ApiRouterDependencies` | ADR-003 |
| Nơi tính MA | Web tính; API trả thêm nến khởi động MA | ADR-004 |
| Kiểm nến sai | Service kiểm sau chuẩn hóa, trả lỗi dữ liệu nguồn sai | 10-market-data, Xử lý lỗi |
| Phân loại lỗi | Input không hợp lệ, nguồn không khả dụng, dữ liệu nguồn sai, lỗi không lường trước | 10-market-data, Xử lý lỗi |
| Log | `pino-http` hiện có cộng một log service cho mỗi request; chưa thêm metric | 10-market-data, Observability |
| Quyền truy cập | Proposed: endpoint Market Data yêu cầu phiên; chốt ở Bước 5 | 10-market-data, Quyết định |

## Chuyển cho bước sau

| Bước | Việc |
| --- | --- |
| 05 Contract và API | Shape nến domain, dấu hiệu nến đang mở, cách đánh dấu nến khởi động MA, thời điểm dữ liệu (MK-27); endpoint, query, mã HTTP và `code` cho bốn nhóm lỗi; số chữ số thập phân của pair (MK-44) đến từ đâu; điều kiện truy cập endpoint; sửa schema nháp `market-data.schema.ts` (thêm 1d, bỏ MA khỏi lịch sử nến) |
| 06 Database và cache | Giới hạn request của Binance; cache nến và summary |
| 07 Kiểm chứng | Integration test với provider giả lập cho bốn nhóm lỗi và QA-09; test chuẩn hóa của adapter Binance với response mẫu; đo QA-10, QA-11 phía client và đối chiếu log thời gian provider |
| 08 Build | Folder `providers/` và rule ESLint cùng lúc; biến môi trường cho base URL và timeout của provider. Timeout đề xuất 5 giây (agent đề xuất): ngắn hơn thời hạn chờ của chart (MK-34) để API kịp trả lỗi có phân loại |

## Kiểm chứng

| Kiểm tra | Kết quả ngày 2026-11-20 |
| --- | --- |
| `pnpm check:docs` | Đạt |
| `pnpm exec prettier --check` các file đã sửa | Đạt |
| `review-change` | 2 finding medium và 9 finding low đã sửa. Giữ giá trị MK-24, MK-34 trong `plan.md` vì plan ghi đề xuất trước khi chốt |

## References

1. <a id="ref-1"></a>[Kế hoạch thiết kế ranh giới và luồng xử lý REST](plan.md)
2. <a id="ref-2"></a>[Market Data & Realtime Updates](../../../../../architecture/10-market-data.md)
3. <a id="ref-3"></a>[Architectural Decisions](../../../../../architecture/30-decisions.md)
