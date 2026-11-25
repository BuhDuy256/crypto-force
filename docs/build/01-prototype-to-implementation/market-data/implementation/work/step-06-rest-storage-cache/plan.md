# Kế hoạch thiết kế database và cache cho REST

Đọc file này để biết phạm vi, các quyết định cần chốt, thứ tự công việc và cách kiểm chứng Bước 6 của Market Data.

## Mục tiêu và đầu ra

Bước 6 chốt dữ liệu Market Data nào được lưu, cache nằm ở đâu, làm mới thế nào và quan hệ giữa cache với provider [[1]](#ref-1). Đầu vào là các việc Bước 5 chuyển sang: giới hạn request theo IP của Binance, cache nến và summary, header `Cache-Control` [[2]](#ref-2).

| Đầu ra | File từ gốc repo | Điều kiện đạt |
| --- | --- | --- |
| Quyết định lưu trữ Market Data | `docs/architecture/21-database.md` | Ghi rõ vòng REST có lưu dữ liệu Market Data hay không, kèm lý do. Nếu không lưu, không thêm bảng vào ERD |
| Cache và giới hạn request | `docs/architecture/10-market-data.md` | Vị trí cache, khóa, thời gian sống, cách làm mới, gộp request trùng, xử lý giới hạn của Binance, quan hệ với `dataTime` và `isClosed`. Thay dòng rủi ro "chưa có cache" |
| Quyết định có trade-off | `docs/architecture/30-decisions.md` | ADR cho lựa chọn nơi cache, kèm phương án đã cân nhắc và điều kiện xem lại |
| Contract nếu bị ảnh hưởng | `docs/architecture/22-api-endpoints.md` | Chỉ sửa khi quyết định cache làm đổi contract (ví dụ `Cache-Control`, ý nghĩa `dataTime`) |
| Đầu vào cho Bước 7–8 | `work/step-06-rest-storage-cache/execution.md` | Quyết định đã chốt và việc chuyển tiếp |

Bước 6 chỉ sửa tài liệu. Không thêm migration, không sửa code.

## Điểm xuất phát

Nhận định lấy từ file đã đọc tại commit `3b9ca0e` và tài liệu Bước 5.

- `21-database.md` ghi chưa có schema market data. Database chỉ có bảng Auth và `rate_limit`.
- `10-market-data.md` ghi mỗi lần mở Realtime gửi 4 request nến (MK-31) và 1 request summary tới Binance, chưa có cache. Cache phía Web theo khóa pair và timeframe đã có (TanStack Query, QA-11).
- Vòng REST không tự cập nhật chart (MK-27). Mỗi chart tối đa 500 nến cộng nến khởi động MA (MK-33, ADR-004). Web chờ tối đa 10 giây (MK-34); API timeout provider 5 giây.
- Endpoint trả `Cache-Control: no-store`. `dataTime` là lúc API nhận dữ liệu từ provider.
- Chưa có nhu cầu dữ liệu lịch sử cho backtest trong phạm vi Market Data REST. Backtest dùng dữ liệu thị trường ở module khác, chưa thiết kế.

## Quyết định cần chốt

Theo ủy quyền của product owner, agent chốt quyết định không liên quan vận hành và ghi lý do để product owner có thể phủ quyết. Các mục đánh dấu **(vận hành)** cần product owner xác nhận.

| Câu hỏi | Driver | Hướng đề xuất |
| --- | --- | --- |
| Lưu nến vào PostgreSQL ở vòng REST? (làm đầu tiên) | MK-33, MK-51, abstract plan | Không lưu. Lý do: chart chỉ cần 500 nến gần nhất và Binance trả trong một request; lưu nến cần đồng bộ, lấp khoảng trống và đối soát với nguồn (MK-35, MK-51) mà vòng REST không đo được lợi ích. Điều kiện xem lại: backtest cần dữ liệu dài hạn, hoặc số đo cho thấy upstream là bottleneck của QA-10 |
| Cache phía API ở đâu | QA-10, giới hạn IP Binance | Cache trong bộ nhớ process API, khóa `pair + timeframe` cho nến và `pair` cho summary. Không dùng Redis (AGENTS.md chỉ thêm Redis khi đo được bottleneck) và không dùng bảng PostgreSQL (thêm I/O mà không giữ được qua nhiều instance tốt hơn). Một instance API trên VPS nên cache trong process đủ |
| Thời gian sống của cache | MK-27, MK-25 | Theo timeframe, ngắn hơn khoảng một phút để nến đang mở không quá cũ. Đề xuất: nến 5 giây, summary 5 giây. `dataTime` trả thời điểm nhận từ provider của bản trong cache, không phải thời điểm request, nên chart vẫn báo đúng độ tươi (MK-27). Phương án khác: TTL đến lúc đóng nến, bị loại vì nến đang mở thay đổi liên tục |
| Gộp request trùng | QA-10 | Single-flight theo khóa: nhiều request cùng khóa khi cache rỗng chỉ tạo một lời gọi provider. Lỗi provider không được cache |
| Xử lý giới hạn request của Binance **(vận hành)** | MK-12, MK-39 | Đọc header used-weight của Binance và log. Khi Binance trả 429 hoặc 418, API trả 503 `MARKET_DATA_UNAVAILABLE` và ngừng gọi Binance tới hết `Retry-After`; trong thời gian đó trả bản cache còn hạn nếu có. Không tự retry phía API, vì Web đã có thử lại theo chart. Cần kiểm lại trọng số endpoint và giới hạn hiện hành trên tài liệu Binance |
| `Cache-Control` ở HTTP | MK-14, MK-17 | Giữ `no-store`. Cache phía Web do TanStack Query quản lý theo khóa; cache HTTP của trình duyệt thêm một tầng khó kiểm và dễ trả dữ liệu khác khóa |
| Cache khi tách nhiều instance API | Vận hành | Ghi là giới hạn: mỗi instance có cache riêng và tự gọi Binance. Điều kiện xem lại: chạy hơn một instance API |

## Công việc

1. **Lưu trữ.** Chốt quyết định không lưu nến, ghi vào `21-database.md` (phạm vi dữ liệu và lý do).
2. **Giới hạn Binance.** Đọc tài liệu Binance hiện hành về request weight của `klines`, `ticker/24hr`, giới hạn theo IP, 429/418 và `Retry-After`. Tính số weight cho một lần mở Realtime với và không có cache.
3. **Cache.** Viết section cache trong `10-market-data.md`: vị trí trong service hoặc decorator quanh provider, khóa, TTL, single-flight, lỗi không cache, quan hệ với `dataTime`/`isClosed`. Cập nhật driver, sơ đồ thành phần nếu thêm khối cache, bảng quan sát (cache hit/miss), quyết định và rủi ro.
4. **ADR.** Tìm ADR cùng chủ đề trước. Viết ADR cho nơi cache và việc không lưu nến nếu trade-off đủ lớn để tách.
5. **Contract.** Kiểm `22-api-endpoints.md` có cần đổi không; nếu không, ghi rõ trong execution.
6. **Kiểm claim về code** bằng `graphify query` rồi đọc source.
7. **Execution.** Ghi quyết định và việc cho Bước 7 (test TTL, single-flight, không cache lỗi, 429) và Bước 8 (vị trí code cache, cấu hình TTL qua env nếu cần).

## Kiểm chứng hoàn thành

| Kiểm tra | Điều kiện đạt |
| --- | --- |
| `pnpm exec prettier --check` các file Markdown đã sửa | Đạt |
| `pnpm check:docs` | Đạt, hoặc chỉ còn lỗi có trước Bước 6 và được ghi rõ |
| `review-change` | Reviewer mới không còn finding mở |

## References

1. <a id="ref-1"></a>[Kế hoạch triển khai Market Data ở mức tổng quan](../../abstract-implementation-plan.md)
2. <a id="ref-2"></a>[Kết quả thiết kế contract nến và API REST](../step-05-rest-contract/execution.md)
