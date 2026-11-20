# Kế hoạch thiết kế ranh giới và luồng xử lý REST

Đọc file này để biết phạm vi, các quyết định cần chốt, thứ tự công việc và cách kiểm chứng Bước 4 của Market Data.

## Mục tiêu và đầu ra

Bước 4 mở hộp đen của use case Market Data đã chốt ở Bước 3: thành phần nào làm gì, gọi nhau theo thứ tự nào, lỗi đi qua đâu và cần log gì [[1]](#ref-1). Bước này chỉ sửa tài liệu. Không sửa code, schema shared, ESLint rule hoặc UI mock.

| Đầu ra | File từ gốc repo | Điều kiện đạt |
| --- | --- | --- |
| Thiết kế Market Data cho REST | `docs/architecture/10-market-data.md` | Có Drivers, thành phần và ranh giới, luồng lấy lịch sử và summary, xử lý lỗi, interface provider, cách thay provider, cách truyền provider giả lập, observability. Mỗi cơ chế trỏ tới rule MK hoặc QA [[2]](#ref-2) |
| Mô tả cấp hệ thống | `docs/architecture/00-system.md` | Container API có Market Data và kết nối tới Binance, phân biệt đã triển khai và thiết kế |
| Quyết định có trade-off | `docs/architecture/30-decisions.md` | Mỗi quyết định có nhiều phương án khả thi là một ADR `Proposed` hoặc `Accepted` |
| Ma trận driver | `docs/architecture/README.md` | Dòng Market Data và QA-09, QA-10, QA-11 trỏ tới `10-market-data.md` |
| Câu hỏi mở | `docs/open-questions.md` | Driver chưa có cơ chế thành câu hỏi mới có ID kế tiếp |
| Đầu vào cho Bước 5–8 | `work/step-04-rest-boundaries/execution.md` | Ghi các quyết định đã chốt và việc chuyển cho contract, cache, kiểm chứng và build |

Bước 4 không chốt shape của nến, endpoint, query parameter, mã lỗi HTTP, bảng DB hoặc cache. Các nội dung đó thuộc Bước 5–6 [[1]](#ref-1). Thiết kế chỉ để lại chỗ nối cho chúng.

## Skills và rules áp dụng

| Skill hoặc rule | Ảnh hưởng đến cách làm |
| --- | --- |
| `write-architecture-doc` | Theo 8 bước: drivers từ UC, chọn view, mở hộp đen, ADR cho trade-off, kiểm claim về code tại nguồn, không chép giá trị từ UC, cập nhật ma trận README |
| Architecture Documentation, Documentation Conventions, Mermaid | Section Drivers bắt buộc, định dạng ADR, trích dẫn và diagram [[3]](#ref-3) |
| Project Structure, ESLint boundaries | Thiết kế giữ layer Route → Controller → Service; provider chỉ ở backend qua `MarketDataProvider` [[4]](#ref-4) |
| LL-006 | Mỗi câu về trạng thái code hiện tại có nguồn đã đọc [[5]](#ref-5) |
| `ste-vi` | Viết lại câu của tài liệu theo checklist |
| `review-change` | Reviewer mới kiểm diff tài liệu trước khi báo hoàn thành |

Theo ủy quyền của product owner, agent tự chốt quyết định thiết kế không liên quan đến vận hành project và ghi lý do để product owner có thể phủ quyết.

## Điểm xuất phát

Các nhận định dưới đây lấy từ file đã đọc tại commit `298d585`.

- `10-market-data.md` chỉ có tiêu đề và dòng mục đích.
- `00-system.md` vẽ Binance là tích hợp chưa triển khai. Container API chưa có Market Data.
- `apps/api/src` có `api/routes`, `api/controllers`, `services`, `repositories`, `mappers`, chưa có code Market Data. `createApiRouter` nhận dependency qua `ApiRouterDependencies`, hiện chỉ có `authConfig`.
- Web đã có `app/api/market-data.ts` (`getCandleHistory`, `getMarketSummary`), hook `useCandleHistory`, `useMarketSummary` và schema nháp `packages/shared/src/schemas/market-data.schema.ts`. MSW trả dữ liệu mock.
- Project Structure quy định Binance chỉ đi qua `MarketDataProvider` trong backend. Khi thêm folder có ranh giới phụ thuộc, thêm rule ESLint cùng lúc [[4]](#ref-4).
- Use case có rule MK-01 đến MK-62. QA-09 (thêm provider, 0 file frontend đổi) là Confirmed. QA-10, QA-11 là Proposed [[6]](#ref-6) [[7]](#ref-7).

## Quyết định cần chốt

Bảng dưới ghi hướng đề xuất. Khi thực hiện, agent ghi phương án, trade-off và lý do vào tài liệu kiến trúc.

| Câu hỏi | Driver | Hướng đề xuất |
| --- | --- | --- |
| Provider adapter đặt ở đâu trong `apps/api` | QA-09, Project Structure | Folder mới `apps/api/src/providers/market-data/` gồm interface `MarketDataProvider` và adapter Binance. Service chỉ phụ thuộc interface. Rule ESLint cho folder mới ghi thành việc của Bước 8. Interface ở `apps/api`, chưa đưa vào `packages/shared`, vì Worker chưa cần. Ghi điều kiện xét lại khi Worker cần dữ liệu thị trường |
| Interface provider gồm những thao tác nào | MK-25, MK-33, MK-08 | Hai thao tác: lấy nến theo pair, timeframe, số lượng; lấy summary 24 giờ theo pair. Trả dữ liệu đã chuẩn hóa theo kiểu của domain, không trả kiểu của Binance. Shape chi tiết thuộc Bước 5 |
| Truyền provider giả lập vào service thế nào | QA-09 | Tạo provider ở composition root (`app.ts`) và truyền qua `ApiRouterDependencies` xuống service. Integration test truyền provider giả lập. Không cần provider thật thứ hai |
| MA tính ở đâu (ADR) | MK-01, MK-24, MK-28, MK-36 | Đề xuất tính ở frontend bằng hàm thuần, vì MA chỉ phục vụ hiển thị và cùng dữ liệu nến. API trả thêm 19 nến trước cửa sổ hiển thị để MA phủ chart. Phương án khác: API tính MA. Ghi ADR vì ảnh hưởng contract Bước 5 và tái sử dụng `packages/engine` |
| Kiểm nến sai ở đâu | MK-45, MK-51, MK-52 | Service kiểm sau khi chuẩn hóa: high ≥ low, thời gian mở tăng dần, không trùng, đúng mốc timeframe. Vi phạm trả lỗi dữ liệu nguồn, không trả nến. Frontend chỉ hiển thị lỗi |
| Thời hạn chờ và lỗi upstream | MK-34, MK-12, MK-39 | Thời hạn 10 giây đo ở client theo MK-34. API đặt timeout gọi provider ngắn hơn để kịp trả lỗi có phân loại trước khi client hết hạn. Giá trị timeout của API là cấu hình, agent đề xuất kèm lý do. Lỗi trả ra không có chi tiết upstream |
| Phân loại lỗi | MK-12, MK-18, MK-39 | Ba nhóm: input không hợp lệ, upstream lỗi hoặc hết hạn, dữ liệu upstream sai. Mã HTTP và body thuộc Bước 5 |
| Log và metric | Abstract plan Bước 4, QA-10, QA-11 | Một dòng log `pino` cho mỗi request Market Data: pair, timeframe, số nến, thời gian gọi provider, tổng thời gian xử lý, kết quả và nhóm lỗi. Thời gian phía client đo ở bước kiểm chứng hiệu năng. Chưa thêm hệ thống metric riêng |
| Sidebar summary và chart tách lỗi | MK-18, MK-12 | Hai request độc lập, lỗi của một request không ảnh hưởng request kia |
| Giới hạn request của Binance | Chưa có driver | Ghi rủi ro và chuyển cho Bước 6 cùng cache. Không thiết kế rate limit ở Bước 4 |

## Công việc

Thứ tự theo checklist của `write-architecture-doc`.

1. **Drivers.** Liệt kê rule MK và QA-09, QA-10, QA-11 cần cơ chế. Rule chỉ thuộc giao diện (ví dụ MK-46, MK-49) ghi là do Web đáp ứng, không thiết kế thêm. Driver thiếu cơ chế thành câu hỏi mở.
2. **View.** Dùng `flowchart` mức component trong container API cho Web → API route → Market Data Service → `MarketDataProvider` → Binance. Không trộn container và class trong một diagram.
3. **Mở hộp đen.** Vẽ `sequenceDiagram` cho: mở Realtime với 4 chart và summary; đổi timeframe một chart; provider lỗi hoặc hết hạn; nến sai. Nhãn giữ ID rule.
4. **Quyết định.** Chốt các dòng trong bảng trên. Tìm ADR cùng chủ đề trong `30-decisions.md` trước khi viết ADR mới. Ghi điều kiện xét lại.
5. **Kiểm claim về code.** Đọc source cho mỗi câu về trạng thái hiện tại. Dùng `graphify query` trước khi đọc file.
6. **Không chép giá trị.** Số nến, thời hạn chờ, timeframe, pair ghi bằng nội dung kèm ID rule.
7. **00-system, README, câu hỏi mở.** Cập nhật mô tả container và ma trận. Thêm câu hỏi mới nếu có.
8. **Execution.** Ghi quyết định và việc chuyển cho Bước 5–8 trong `execution.md`.

## Kiểm chứng hoàn thành

| Kiểm tra | Điều kiện đạt |
| --- | --- |
| `pnpm exec prettier --check` với các file Markdown đã sửa | Đạt |
| `pnpm check:docs` | Đạt, hoặc chỉ còn lỗi có trước Bước 4 và được ghi rõ |
| `review-change` | Reviewer mới không còn finding mở |
| Đối chiếu đầu ra | Mỗi cơ chế có driver. Mỗi driver có cơ chế hoặc câu hỏi mở. Không có giá trị chép từ UC |
| Báo cáo | Liệt kê riêng từng quyết định agent chốt theo ủy quyền để product owner phủ quyết |

Không chạy typecheck, test app hoặc `pnpm check`, vì Bước 4 chỉ sửa tài liệu. Không commit khi người dùng chưa yêu cầu.

## References

1. <a id="ref-1"></a>[Kế hoạch triển khai Market Data ở mức tổng quan](../../abstract-implementation-plan.md)
2. <a id="ref-2"></a>[Market Data & Realtime Updates](../../../../../architecture/10-market-data.md)
3. <a id="ref-3"></a>[Architecture Documentation](../../../../../conventions/architecture.md)
4. <a id="ref-4"></a>[Project Structure](../../../../../conventions/project-structure.md)
5. <a id="ref-5"></a>[Lessons Learned](../../../../../../LESSONS.md)
6. <a id="ref-6"></a>[Market Data](../../../../../UCs/market-data.md)
7. <a id="ref-7"></a>[Quality Attributes](../../../../../UCs/quality-attributes.md)
