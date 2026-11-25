# Knowledge

Đọc file này để biết `docs/knowledge/` chứa kiến thức gì và tìm file kiến thức theo chủ đề.

## Phạm vi

Folder này là tầng Knowledge: kiến thức có nguồn thu được khi làm dự án, gồm pattern, anti-pattern, kết quả research và giới hạn của công cụ. Convention, skill và kế hoạch trích các file ở đây làm nguồn khi đặt quy tắc hoặc chọn cách làm [[1, Các tầng]](#ref-1). Quy ước viết file kiến thức nằm trong Knowledge Documentation [[2]](#ref-2).

| Thuộc `docs/knowledge/` | Không thuộc `docs/knowledge/` |
| --- | --- |
| Anti-pattern khi code dựa trên test có sẵn, kèm nguồn và hướng chặn | Quy tắc bắt buộc cho file output. Quy tắc nằm trong [Conventions](../conventions/README.md) |
| Kết quả research về công cụ, chuẩn hoặc phương pháp | Lỗi hành vi đã xảy ra của agent. Lỗi này nằm trong [ `LESSONS.md` ](../../LESSONS.md) và cần người dùng duyệt |
| Giới hạn đã kiểm của một công cụ, ví dụ phần Playwright không kiểm được | Tiến độ, kế hoạch và kết quả của một step. Các nội dung này nằm trong `docs/build/` |

## Table of Contents

| File | Subject |
| --- | --- |
| [test-gaming-anti-patterns.md](test-gaming-anti-patterns.md) | Anti-pattern khi code dựa trên test có sẵn: viết code chỉ để pass test, sửa test để hết lỗi, sửa bộ đo |
| [tanstack-query-v5-fetch-lifecycle.md](tanstack-query-v5-fetch-lifecycle.md) | TanStack Query v5: state `pending` khi retry, hủy request khi observer rời đi, dùng lại fetch đang chạy |
| [market-data-rest-polling.flow.md](261123-market-data-rest-polling/market-data-rest-polling.flow.md) | Luồng lấy dữ liệu nến từ `MarketChartCard` tới Binance: hàm của từng layer, hằng số điều khiển số nến và nhánh lỗi |
| [market-data-rest-polling.ui-data-flow.md](261123-market-data-rest-polling/market-data-rest-polling.ui-data-flow.md) | Luồng dữ liệu trong UI: state mà `MarketChartCard` đọc, trigger làm mới query và cách UI vẽ lại khi state đổi |
| [market-data-rest-polling.upstream-resilience.md](261123-market-data-rest-polling/market-data-rest-polling.upstream-resilience.md) | Bảo vệ Binance trước tải polling: single-flight, negative caching, deadline layering, cooldown và giới hạn in-process |
| [market-data-rest-polling.polling-bottlenecks.md](261123-market-data-rest-polling/market-data-rest-polling.polling-bottlenecks.md) | Bottleneck thật sự của REST polling qua số đo baseline: truy vấn phiên vào PostgreSQL ở 50 client và lưu lượng full-window polling |

## References

1. <a id="ref-1"></a>[Conventions](../conventions/README.md)
2. <a id="ref-2"></a>[Knowledge Documentation](../conventions/knowledge.md)
