# Kế hoạch chốt requirements cho REST

Đọc file này để biết phạm vi, các quyết định cần chốt, thứ tự công việc và cách kiểm chứng Bước 3 của Market Data.

## Mục tiêu và đầu ra

Bước 3 biến bản nháp hành vi của Bước 2 thành requirements đủ để thiết kế REST và thiết kế test [[1]](#ref-1). Bước này chỉ sửa tài liệu. Không sửa code, schema shared hoặc UI mock.

| Đầu ra | File từ gốc repo | Điều kiện đạt |
| --- | --- | --- |
| Use case Market Data hoàn chỉnh cho REST | `docs/UCs/market-data.md` | Có phạm vi và phần ngoài phạm vi, main flow, alternative flow, exception flow, business rules và Gap analysis theo convention [[2]](#ref-2). Làm rõ lịch sử nến, pair/timeframe, nến đang mở và lỗi tải dữ liệu |
| Tiêu chí chất lượng áp dụng cho REST | `docs/UCs/quality-attributes.md` | Scenario có đủ sáu phần và số đo. Giá trị chưa chốt giữ trạng thái Proposed |
| Phân tích requirements | `docs/testing/test-scopes/TS-002-market-data/rest-requirement-gap-analysis.md` (tạo mới) | Ghi nguồn kèm commit, điểm thiếu hoặc mâu thuẫn, cách giải quyết, kết quả đối chiếu baseline độc lập và kết luận có đủ để thiết kế test hay không |
| Câu hỏi mở | `docs/open-questions.md` | OQ-032, OQ-082, OQ-083, OQ-084 chuyển sang Resolved kèm trích dẫn, hoặc còn Open kèm lý do. Câu hỏi mới có ID kế tiếp |
| Mục lục | `docs/UCs/README.md` | Dòng Market Data mô tả đúng phạm vi mới |
| Chênh lệch giữa requirements và UI mock | `work/step-03-rest-requirements/execution.md` | Liệt kê hành vi UI Bước 2 khác requirements đã chốt, để Bước 8 xử lý |

Bước 3 không chốt endpoint, query parameter, schema, cache hoặc giới hạn của Binance. Các nội dung đó thuộc Bước 4–6 [[1]](#ref-1). Use case chỉ ghi điều người dùng hoặc tester quan sát được từ bên ngoài [[2]](#ref-2).

## Skills và rules áp dụng

| Skill hoặc rule | Ảnh hưởng đến cách làm |
| --- | --- |
| `write-use-case` | Theo 10 bước của skill: nguồn kèm commit, giữ ID cũ, main flow dạng hộp đen, exception flow theo từng bước, rule có số đo, boundary test, baseline độc lập, báo cáo từng giá trị agent đề xuất |
| Use Case Documentation, Documentation Conventions, Mermaid | Định dạng bảng rule, bảng luồng, Gap analysis, ID và trích dẫn [[2]](#ref-2) |
| LL-003 | Không kết luận requirements đủ khi chưa đối chiếu baseline độc lập. Lấy ID và mức của chuẩn từ bản gốc [[3]](#ref-3) |
| LL-004 | Mỗi giá trị agent đề xuất có nguồn, lý do và mức thay đổi so với nguồn. Báo cáo tách riêng để product owner duyệt từng giá trị [[3]](#ref-3) |
| LL-007 | Kết luận trong tài liệu testing chỉ nói điều mà đối chiếu đã chứng minh [[3]](#ref-3) |
| `ste-vi` | Viết lại các câu của tài liệu theo checklist cho text tiếng Việt |
| `review-change` | Reviewer mới kiểm diff tài liệu trước khi báo hoàn thành |

Theo ủy quyền của product owner, agent tự đề xuất và chốt các quyết định sản phẩm không liên quan đến cách vận hành project. Mỗi quyết định ghi "theo ủy quyền của product owner" kèm lý do để product owner có thể phủ quyết.

## Điểm xuất phát

Các nhận định dưới đây lấy từ file đã đọc tại commit `b836aa4`.

- Bản nháp use case có một use case "Xem lịch sử thị trường", rule MK-01 đến MK-19 và bốn gap Open MK-03, MK-20, MK-21, MK-22. Rule MK-09 đến MK-19 có trạng thái Proposed [[4]](#ref-4).
- Gap analysis ghi "Chưa thực hiện đối chiếu baseline độc lập" [[4, Gap analysis]](#ref-4).
- Repo chưa có `docs/testing/market-data.md`. Convention tài liệu chưa quy định khung cho file testing ngoài test scope STLC [[5, Theo loại tài liệu]](#ref-5).
- Brief liệt kê timeframe `1m, 5m, 15m, 1h, 4h, 1d` cho mỗi chart [[6, §5]](#ref-6). Prototype và UI Bước 2 chỉ có 1m, 5m, 15m, 1h, 4h [[7, Chọn số chart và timeframe]](#ref-7) [[8]](#ref-8).
- Demo của brief mở BTCUSDT với `5m | 15m | 1h | 4h` [[6, §29]](#ref-6). UI Bước 2 khởi tạo 1m, 5m, 15m, 1h [[8]](#ref-8).
- Quality attributes hiện có QA-05 và QA-06 cho luồng realtime và mất kết nối WebSocket. Chưa có scenario cho REST tải lịch sử [[9]](#ref-9).

## Quyết định cần chốt

Bảng dưới đây ghi hướng đề xuất ban đầu. Khi thực hiện, agent ghi giá trị cụ thể kèm nguồn và lý do theo LL-004, rồi đối chiếu với baseline trước khi chốt. Product owner có thể phủ quyết từng dòng.

| Câu hỏi | Nguồn hiện có | Hướng đề xuất |
| --- | --- | --- |
| Tải lịch sử áp dụng cho chart nào, thêm bao nhiêu nến, có giới hạn không ([OQ-032](../../../../../open-questions.md#oq-032)) | Prototype: nhãn "Load 1,000 past candles", chỉ có toast [[7, Cập nhật live và dữ liệu lịch sử]](#ref-7). UI mock: làm mới lịch sử của chart được chọn [[4]](#ref-4) | Áp dụng cho một chart. Thêm nến cũ hơn nến cũ nhất đang hiển thị, số lượng theo nhãn prototype. Có giới hạn tổng số nến trên một chart và trạng thái "không còn lịch sử cũ hơn". Agent đề xuất giá trị giới hạn khi thực hiện |
| MA khi chưa đủ nến và nến đang mở có được tính vào mẫu không ([OQ-082](../../../../../open-questions.md#oq-082)) | Bản nháp hiển thị chưa đủ dữ liệu thay vì số không [[4]](#ref-4) | Giữ hành vi chưa đủ dữ liệu. Quyết định nến đang mở cùng với câu hỏi về nến đang mở bên dưới, để MA và chart dùng cùng một tập nến |
| MA và volume trong sidebar theo chart nào, volume là gì, đơn vị nào ([OQ-083](../../../../../open-questions.md#oq-083)) | Bản nháp dùng chart đầu tiên, có nhãn timeframe, volume của nến cuối [[4]](#ref-4) | Giữ chart đầu tiên và nhãn timeframe. Chốt volume là volume của một nến cụ thể và ghi đơn vị trên màn hình |
| Lịch sử có nến đang mở không, người dùng phân biệt bằng cách nào ([OQ-084](../../../../../open-questions.md#oq-084)) | Bản nháp chưa đánh dấu trạng thái đóng nến [[4]](#ref-4) | **Product owner đã chọn ngày 2026-11-20:** lịch sử gồm nến đang mở. Người dùng phân biệt nến đang mở bằng text, không chỉ bằng màu. Màn hình ghi thời điểm của dữ liệu vì vòng REST chưa cập nhật trực tiếp. MA và volume của nến đang mở được ghi rõ là giá trị tạm, hoặc lấy theo nến đã đóng. Chốt chi tiết này cùng OQ-082 và OQ-083 |
| Tập timeframe có gồm 1d không | Brief có 1d [[6, §5]](#ref-6), prototype không có [[7]](#ref-7) | Theo brief, vì brief là nguồn yêu cầu, prototype là nguồn giao diện. Ghi chênh lệch UI vào `execution.md` |
| Lựa chọn mặc định khi mở Realtime | Brief demo 5m/15m/1h/4h [[6, §29]](#ref-6). UI mock 1m/5m/15m/1h [[8]](#ref-8) | Chốt pair, số chart và timeframe từng chart. Ưu tiên kịch bản demo của brief |
| Danh sách pair được hỗ trợ | UI mock có BTC, ETH, SOL theo lựa chọn prototype [[8]](#ref-8) | Ghi danh sách pair và hành vi khi pair không có dữ liệu |
| Số nến hiển thị khi mở chart | Chưa có nguồn | Agent đề xuất giá trị kèm lý do. Giá trị này là hành vi người dùng thấy, không phải giới hạn của provider |

## Công việc

Thứ tự dưới đây theo checklist của `write-use-case`. Mỗi việc kết thúc bằng thay đổi trong file đầu ra tương ứng.

1. **Nguồn và ID.** Ghi danh sách nguồn kèm commit vào `docs/testing/test-scopes/TS-002-market-data/rest-requirement-gap-analysis.md`: brief §4, §5, §29, prototype Realtime, bản nháp UC, OQ liên quan, plan Bước 1–2 và các ADR có liên quan trong `docs/architecture/30-decisions.md`. Tìm ID MK trong `docs/testing/test-scopes/` và `docs/open-questions.md`. Giữ nghĩa của MK-01 đến MK-22. Rule mới nhận số kế tiếp, bắt đầu từ MK-23.
2. **Phạm vi và use case.** Viết lại Tổng quan: actor, phạm vi REST, phần ngoài phạm vi (live updates, phục hồi kết nối, BUY/SELL, Signals from, tìm theo khoảng ngày, tự tải khi kéo chart) [[10]](#ref-10). Tách use case theo mục tiêu người dùng hoàn thành trong một phiên. Hướng đề xuất: "Xem thị trường trên nhiều chart" và "Tải lịch sử cũ hơn". Đổi pair, đổi timeframe và đổi số chart là luồng thay thế, trừ khi phân tích cho thấy cần use case riêng.
3. **Main flow dạng hộp đen.** Mỗi use case có bảng bước và `sequenceDiagram`. Participant chỉ gồm người dùng, Crypto Force và Binance khi người dùng thấy Binance.
4. **Exception flow theo từng bước.** Với mỗi bước, xét: nguồn dữ liệu không trả lời hoặc trả lỗi, lịch sử rỗng, lịch sử có khoảng trống, đổi lựa chọn liên tiếp, bấm thử lại hoặc tải lịch sử nhiều lần, đã tới nến cũ nhất, phiên đăng nhập hết hạn khi đang xem, reload hoặc quay lại trang. Mỗi kết quả làm thay đổi điều người dùng thấy là một dòng trong bảng luồng. Hành vi phiên hết hạn tham chiếu rule của Authentication, không định nghĩa lại.
5. **Rule.** Chốt các quyết định trong bảng trên. Tách rule nói hai điều. Rule có đại lượng ghi số, đơn vị và điểm đo. Rule Proposed của Bước 2 được chốt, sửa hoặc bỏ kèm lý do. Rule bị bỏ giữ ID và đổi trạng thái.
6. **Boundary test.** Kiểm từng fact: người dùng hoặc tester có quan sát được không. Fact về endpoint, cache, giới hạn request của Binance hoặc cách tính trong code ghi thành đầu vào cho Bước 4–6 trong `execution.md`, không ghi vào UC.
7. **Quality attributes cho REST.** Thêm scenario cho thời gian từ lúc mở Realtime tới lúc chart có lịch sử, thời gian đổi timeframe một chart, giới hạn thời gian trước khi báo lỗi khi nguồn dữ liệu không trả lời, và growth scenario thêm provider mà Web không đổi [[11]](#ref-11). Ngưỡng hiệu năng giữ Proposed tới Bước 7, vì ngưỡng chỉ có nghĩa khi đã có workload và môi trường đo. Growth scenario được chốt theo ủy quyền nếu nguồn đủ.
8. **Baseline độc lập.** Dùng hai baseline, ghi kết quả từng mục là đủ, một phần, thiếu hoặc không áp dụng:
   - Bộ use case do subagent mới viết, chỉ nhận mục tiêu "xem lịch sử giá crypto trên nhiều chart" và danh sách actor. Subagent không đọc spec, prototype, code hoặc test.
   - WCAG 2.2 mức AA cho chart và trạng thái dữ liệu: non-text content, use of color, contrast, reflow, keyboard, focus visible, name/role/value và status messages. Lấy số mục từ văn bản gốc của W3C.
   - Mỗi mục chưa đủ thành một dòng Gap: rule mới, rủi ro chấp nhận kèm lý do, hoặc câu hỏi mở.
9. **Tài liệu testing.** Tạo `docs/testing/test-scopes/TS-002-market-data/rest-requirement-gap-analysis.md` với các phần: phạm vi phân tích, nguồn kèm commit, điểm thiếu hoặc mâu thuẫn và cách giải quyết, kết quả baseline, kết luận. Không dùng template STLC và không tạo test case. Kịch bản kiểm chứng thuộc Bước 7 [[1]](#ref-1).
10. **Câu hỏi mở, mục lục và chênh lệch UI.** Chuyển OQ đã quyết sang Resolved & Dropped, trích dẫn tới rule đã chốt. Cập nhật mục lục UCs. Ghi chênh lệch giữa UI mock và requirements vào `execution.md`, ví dụ tập timeframe, lựa chọn mặc định, nhãn tải lịch sử và đánh dấu nến đang mở.

## Kiểm chứng hoàn thành

| Kiểm tra | Điều kiện đạt |
| --- | --- |
| `pnpm exec prettier --check` với các file Markdown đã sửa | Đạt hoặc ghi rõ file bị cấu hình repo bỏ qua |
| `pnpm check:docs` | Đạt. Không có ID MK biến mất so với `HEAD` |
| `review-change` | Reviewer mới không còn finding mở |
| Đối chiếu đầu ra | Mỗi dòng trong bảng đầu ra có file sở hữu. Không còn gap Open thiếu link câu hỏi mở. Kết luận "đủ để thiết kế test" chỉ ghi sau khi hai baseline có kết quả |
| Báo cáo | Liệt kê riêng từng giá trị agent đề xuất, ID mới và ID đã tách để product owner duyệt |

Không chạy typecheck, test app hoặc `pnpm check`, vì Bước 3 chỉ sửa tài liệu. Không commit khi người dùng chưa yêu cầu. Bước 3 chỉ được đánh dấu Hoàn thành sau khi các kiểm tra trên đạt và tracker có link tới đầu ra.

## References

1. <a id="ref-1"></a>[Kế hoạch triển khai Market Data ở mức tổng quan](../../abstract-implementation-plan.md)
2. <a id="ref-2"></a>[Use Case Documentation](../../../../../conventions/use-cases.md)
3. <a id="ref-3"></a>[Lessons Learned](../../../../../../LESSONS.md)
4. <a id="ref-4"></a>[Market Data](../../../../../UCs/market-data.md)
5. <a id="ref-5"></a>[Documentation Conventions](../../../../../conventions/docs.md)
6. <a id="ref-6"></a>[Project Brief](../../../../../UCs/sources/project-brief.md)
7. <a id="ref-7"></a>[Realtime](../../../../../design/prototype/docs/requirements/realtime.md)
8. <a id="ref-8"></a>[Kế hoạch dựng frontend Realtime bằng mock](../step-02-mock-frontend/plan.md)
9. <a id="ref-9"></a>[Quality Attributes](../../../../../UCs/quality-attributes.md)
10. <a id="ref-10"></a>[Phạm vi flow REST đầu tiên](../step-01-rest-scope/plan.md)
11. <a id="ref-11"></a>[Những thứ cần đạt được trong lúc build Market Data](../../goal.md)
