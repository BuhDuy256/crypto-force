# Kế hoạch thiết kế contract nến và API REST

Đọc file này để biết phạm vi, các quyết định cần chốt, thứ tự công việc và cách kiểm chứng Bước 5 của Market Data.

## Mục tiêu và đầu ra

Bước 5 chốt contract đi qua ranh giới HTTP của Market Data: shape nến domain, quy tắc chuẩn hóa dữ liệu provider, endpoint, query, response, điều kiện truy cập và lỗi [[1]](#ref-1). Đầu vào là các việc Bước 4 chuyển sang [[2]](#ref-2).

| Đầu ra | File từ gốc repo | Điều kiện đạt |
| --- | --- | --- |
| Contract nến và quy tắc chuẩn hóa | `docs/architecture/10-market-data.md` | Shape nến domain, nến đang mở, nến khởi động MA, thời điểm dữ liệu, kiểu số và đơn vị thời gian. Mỗi trường trỏ tới rule MK |
| Endpoint Market Data | `docs/architecture/22-api-endpoints.md` | Method, path, query, response, validation, điều kiện truy cập, mã HTTP và `code` của bốn nhóm lỗi. Tham chiếu contract nến, không định nghĩa lại |
| Quyết định có trade-off | `docs/architecture/30-decisions.md` | ADR cho quyết định có nhiều phương án khả thi |
| Đầu vào cho Bước 6–8 | `work/step-05-rest-contract/execution.md` | Quyết định đã chốt và việc chuyển tiếp |

Bước 5 chỉ sửa tài liệu. Không sửa `packages/shared`, mock hoặc code Web/API.

## Điều chỉnh so với việc chuyển từ Bước 4

Bước 4 ghi "sửa schema nháp `market-data.schema.ts`" vào Bước 5. Abstract plan ghi schema trong `packages/shared` thuộc bước build [[1]](#ref-1). Agent đề xuất theo abstract plan và chuyển việc sửa schema sang Bước 8, vì hai lý do:

- Bỏ `ma20` khỏi schema bắt Web tự tính MA (ADR-004). Đó là sửa code chart và test của Web, không phải sửa tài liệu.
- Sửa schema trước khi chốt contract dễ phải sửa lần hai. Contract chốt trong docs trước, schema theo sau.

Bước 5 ghi danh sách thay đổi cụ thể cho schema (thêm `1d`, bỏ `ma20`, thêm trường mới) vào `execution.md` để Bước 8 làm.

## Điểm xuất phát

Nhận định lấy từ file đã đọc tại commit `3b9ca0e`.

- Schema nháp có 5 timeframe, thiếu `1d` (MK-30). `candleHistorySchema` có `ma20`, trái ADR-004. Giá là `number`. Chưa có trường nến đang mở hoặc thời điểm dữ liệu.
- Web gọi `GET /api/market-data/candles?pair&timeframe` và `GET /api/market-data/summary?pair`. Lỗi HTTP thành `Error` chung, chưa đọc `code`.
- `22-api-endpoints.md` chỉ có health, auth-config và Better Auth. Router ứng dụng trả lỗi `{ "error": { "code", "message" } }`.
- API chưa có middleware kiểm phiên cho router ứng dụng. Endpoint hiện có đều công khai.
- `10-market-data.md` ghi quyền truy cập là `Proposed`: yêu cầu phiên, chốt ở Bước 5.

## Quyết định cần chốt

Theo ủy quyền của product owner, agent chốt quyết định không liên quan vận hành và ghi lý do để product owner có thể phủ quyết.

| Câu hỏi | Driver | Hướng đề xuất |
| --- | --- | --- |
| Điều kiện truy cập endpoint (làm đầu tiên) | MK-40, SS-03 | Yêu cầu phiên. Không có phiên hợp lệ thì trả 401, `code: UNAUTHENTICATED`; Web chuyển sang màn chặn đăng nhập theo ADR-001. Lý do: Realtime là màn workspace; endpoint công khai biến API thành proxy Binance miễn phí cho bên ngoài và tốn quota của Binance (Bước 6). Cần middleware kiểm phiên dùng chung qua Better Auth `getSession`; ghi middleware là việc của Bước 8 |
| Shape nến domain | MK-25, MK-51 | `openTime` (epoch ms UTC), `open`, `high`, `low`, `close`, `volume`, `isClosed`. Cờ nến đang mở nằm trên từng nến, vì chỉ nến cuối có thể đang mở |
| Kiểu số trên HTTP | MK-44, MK-51, AGENTS.md #17 | JSON `number`. Engine dùng float64; Binance trả chuỗi thập phân. Số chữ số thập phân hiển thị lấy từ metadata pair, không suy từ giá trị |
| Nguồn số thập phân của pair (MK-44) | MK-44 | Hằng số theo pair trong `packages/shared` cùng danh sách pair (tick size của Binance tại thời điểm chốt). Phương án khác: endpoint metadata đọc `exchangeInfo`. Ghi điều kiện xét lại khi số pair tăng hoặc tick size đổi |
| Nến khởi động MA | MK-24, ADR-004 | Response có `warmupCount`: số nến đầu mảng chỉ dùng tính MA, không vẽ. Một mảng nến duy nhất giữ kiểm thứ tự đơn giản |
| Thời điểm dữ liệu | MK-27 | `dataTime`: thời điểm API nhận dữ liệu từ provider (epoch ms). Phân biệt với `openTime` của nến cuối |
| Query và validation | MK-30, MK-33 | `pair`, `timeframe` bắt buộc, theo enum. Không nhận `limit` từ client; số nến do server quyết định (MK-33 cộng nến khởi động). Query sai trả 400 `INVALID_QUERY` |
| Mã lỗi bốn nhóm | MK-12, MK-18, MK-39, MK-45 | Input sai 400 `INVALID_QUERY`; nguồn không khả dụng hoặc hết hạn 503 `MARKET_DATA_UNAVAILABLE`; dữ liệu nguồn sai 502 `MARKET_DATA_INVALID`; lỗi không lường trước 500 `INTERNAL_ERROR`. `message` không có chi tiết upstream |
| Summary | MK-08 | Giữ `pair`, `lastPrice`, `change24hPercent`; thêm `dataTime` cho nhất quán. Xác nhận lại cần trường nào với sidebar hiện tại (MK-60) |

## Công việc

1. **Truy cập.** Chốt điều kiện truy cập, cập nhật dòng `Proposed` trong `10-market-data.md`. Kiểm Better Auth `getSession` dùng được trong middleware Express (đọc source thư viện đã cài).
2. **Contract nến.** Viết section contract và quy tắc chuẩn hóa trong `10-market-data.md`: map kline Binance sang nến domain, nến đang mở, nến khởi động, thời điểm dữ liệu.
3. **Endpoint.** Thêm mục Market Data vào `22-api-endpoints.md`: bảng endpoint, query, response, lỗi. Thêm dòng driver.
4. **ADR.** Tìm ADR cùng chủ đề trước. Đề xuất ADR cho nguồn số thập phân của pair và cho yêu cầu phiên nếu có trade-off thật.
5. **Kiểm claim về code** bằng `graphify query` rồi đọc source.
6. **Execution.** Ghi quyết định, danh sách sửa schema nháp, middleware phiên và việc cho Bước 6–8.

## Kiểm chứng hoàn thành

| Kiểm tra | Điều kiện đạt |
| --- | --- |
| `pnpm exec prettier --check` các file Markdown đã sửa | Đạt |
| `pnpm check:docs` | Đạt, hoặc chỉ còn lỗi có trước Bước 5 và được ghi rõ |
| `review-change` | Reviewer mới không còn finding mở |

## References

1. <a id="ref-1"></a>[Kế hoạch triển khai Market Data ở mức tổng quan](../../abstract-implementation-plan.md)
2. <a id="ref-2"></a>[Kết quả thiết kế ranh giới và luồng xử lý REST](../step-04-rest-boundaries/execution.md)
