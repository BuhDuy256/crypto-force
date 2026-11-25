# REST Polling Requirement Gap Analysis

Đọc file này để biết trạng thái requirements Market Data trước vòng cập nhật định kỳ, các gap đã tìm thấy và kết quả giải quyết trước khi thiết kế test.

## Trạng thái requirements trước phân tích

Trước phân tích này, requirements của Market Data chỉ mô tả vòng tải lịch sử. Vòng này đã build và kiểm chứng tại commit `9729616` [[1]](#ref-1). Về cập nhật định kỳ:

- Chỉ có một rule: làm mới lỗi giữ dữ liệu cũ kèm thông báo lỗi (MK-13), Confirmed, áp dụng từ vòng cập nhật định kỳ.
- Gap MK-53 (muốn thấy nến mới phải reload) có trạng thái Accepted tới vòng cập nhật định kỳ.
- Câu hỏi giữ 500 nến hay tăng số nến khi có nến mới (OQ-085) còn Open.
- Chưa có chu kỳ làm mới, hành vi khi tab ẩn, tạm dừng, lỗi lặp lại, hay yêu cầu chất lượng về độ mới dữ liệu và tải lên Binance.
- Tổng quan của use case ghi "chart không tự cập nhật sau khi tải xong".

## Phạm vi phân tích

Phân tích áp dụng cho use case theo dõi cập nhật định kỳ trên Realtime và các quality attribute scenario của vòng này [[2, Theo dõi cập nhật định kỳ]](#ref-2) [[3]](#ref-3). Cập nhật trực tiếp khi nguồn có dữ liệu mới, phục hồi kết nối WebSocket và tín hiệu BUY/SELL nằm ngoài phạm vi. Kịch bản kiểm thử sẽ nằm trong `rest-polling-verification.md` của test scope này, chưa tạo.

## Nguồn đối chiếu

Mọi nguồn trong repo được đọc tại commit `9729616` ngày 2026-11-22.

| Nguồn | Phần đã đọc |
| --- | --- |
| Project Brief [[4]](#ref-4) | §4 Realtime Data, §5 Multi-Timeframe Chart, §17 Realtime và Reliability |
| Prototype Realtime [[5]](#ref-5) | Cập nhật live và dữ liệu lịch sử, Mất kết nối |
| Định hướng CV của Market Data [[6]](#ref-6) | Ba flow REST, polling, WebSocket; chỉ số lưu lượng, tỷ lệ thời gian dữ liệu cũ; lưu ý về baseline yếu và source-to-chart delay |
| Open Questions [[7]](#ref-7) | Câu hỏi của Realtime và Market Data |
| Use case và quality attributes trước phân tích | Rule, luồng ngoại lệ và gap của vòng tải lịch sử [[2]](#ref-2) [[3]](#ref-3) |

## Điểm thiếu, mâu thuẫn và cách giải quyết

| Điểm | Nguồn mâu thuẫn hoặc thiếu | Kết quả |
| --- | --- | --- |
| Có làm mới định kỳ không | Brief chỉ mô tả cập nhật qua WebSocket và yêu cầu frontend không liên tục gọi `GET /price`; định hướng CV đặt polling làm baseline trước WebSocket | Polling là increment riêng, là baseline để so sánh, không thay mục tiêu WebSocket của brief. Chu kỳ 5 giây cho chart và sidebar (MK-63, MK-64) |
| Độ trễ mục tiêu | QA-05 yêu cầu dưới 1 giây, không nói về transport | QA-05 áp dụng cho vòng cập nhật trực tiếp. Vòng polling có scenario riêng QA-12. Ghi chú này nằm trong cột Nguồn của QA-12 |
| Số nến khi có nến mới | OQ-085 còn Open; MK-33 giới hạn 500 nến cho lần tải đầu | Giữ 500 nến gần nhất sau mỗi lần làm mới (MK-67). OQ-085 chuyển Resolved sau khi product owner duyệt |
| Điều khiển Live updates | Prototype có switch Live updates và dòng "Paused at {giờ}"; brief không nói | Bắt buộc theo WCAG 2.2 SC 2.2.2 ở bảng baseline. Tạm dừng và tiếp tục (MK-73), dòng đã tạm dừng (MK-74, lấy từ prototype), làm mới khi tiếp tục (MK-75) |
| Mất kết nối trong prototype | Prototype có banner mất kết nối, "Reconnect now" và trạng thái Reconnecting | Thuộc vòng WebSocket. Ở vòng polling, mất mạng là lần làm mới lỗi (MK-80), xem gap MK-91 |
| Hành vi đã có của vòng tải lịch sử | MK-12, MK-14, MK-17, MK-34, MK-37, MK-38, MK-40, MK-42, MK-48 không nói rõ khi chart tự làm mới | Áp dụng lại bằng luồng ngoại lệ MK-80 đến MK-85 và rule MK-68 đến MK-72, MK-78 |

## Kết quả baseline độc lập

| Baseline | Mức áp dụng | Kết quả |
| --- | --- | --- |
| Bộ use case do subagent viết ngày 2026-11-22, chỉ nhận mục tiêu làm mới định kỳ và actor, không đọc file nào của repo | Luồng của người dùng và yêu cầu chất lượng; bỏ use case của người vận hành | 7 nhóm gap: tab ẩn, phiên hết hạn và đổi lựa chọn khi làm mới; giữ vùng xem, focus và thông tin nến; lỗi, quá hạn, dữ liệu cũ hơn và chồng yêu cầu; lỗi liên tiếp; mất mạng và máy ngủ; chu kỳ theo timeframe; lưu lượng |
| WCAG 2.2 [[8]](#ref-8) và Understanding SC 2.2.2 [[9]](#ref-9) | SC 2.2.2 Pause, Stop, Hide (mức A); SC 4.1.3 Status Messages (mức AA) | 1 gap: nội dung tự cập nhật thiếu cách tạm dừng. SC 4.1.3 đã có MK-48; bổ sung MK-72 cho lần làm mới thành công |

Mục SC 2.2.2 về thông tin tự cập nhật được đọc nguyên văn ngày 2026-11-22 từ `https://www.w3.org/TR/WCAG22/`, trang ghi bản W3C Recommendation 12 December 2024: thông tin tự cập nhật bắt đầu tự động và hiển thị song song với nội dung khác phải có cách để người dùng tạm dừng, dừng, ẩn, hoặc điều khiển tần suất cập nhật, trừ khi việc tự cập nhật là thiết yếu. Trang Understanding lấy cập nhật giá cổ phiếu làm ví dụ của nội dung tự cập nhật, và cho biết với thông tin realtime, khi tiếp tục nên chuyển tới dữ liệu hiện tại. Nội dung SC 4.1.3 và mức AA chỉ đọc được qua bản tóm tắt của công cụ đọc trang. Mức này khớp với đối chiếu nguyên văn của vòng REST [[10, Đối chiếu WCAG 2.2]](#ref-10).

Danh sách gap và quyết định nằm trong Gap analysis của use case [[2, Gap analysis]](#ref-2). Các mục baseline khác được xử lý như sau:

| Mục của bộ use case độc lập | Kết quả |
| --- | --- |
| Chu kỳ 5 giây (R1), không chồng yêu cầu (R4), làm mới khi tab hiện lại (R8), không request khi tab ẩn (R9), không quay về dữ liệu cũ hơn (R11), không lẫn lựa chọn cũ (R12), giữ vùng xem (R13); luồng A1, A2, A4, A6, E1, E6 | Có rule tương ứng: MK-63, MK-64, MK-65, MK-77, MK-76, MK-79, MK-83 (cùng MK-14, MK-17), MK-68; đổi số chart dùng rule MK-04, MK-05 |
| Timeout mỗi request 4 giây (R3) | Dùng thời hạn chờ của chart (MK-34, MK-81); không thêm giá trị riêng cho lần làm mới |
| Nến đóng bị thiếu hoặc trùng sau khoảng trống (R10), dữ liệu sai từ nguồn (E7) | Đã có OHLCV khớp nguồn và thời gian mở đúng (MK-51, MK-52), nến sai (MK-45); mỗi lần làm mới lấy lại 500 nến (MK-67) |
| Yêu cầu chất lượng về độ mới và tải lên nguồn | QA-12, QA-13 |
| Chu kỳ riêng cho timeframe lớn (R2) | Open, [OQ-086](../../../open-questions.md#oq-086) |
| Nhãn "Data delayed" sau 3 lỗi liên tiếp, backoff 5 tới 60 giây, làm mờ giá khi dữ liệu cũ hơn 60 giây (E2, R5–R7) | Accepted (MK-90): thông báo lỗi và thời điểm dữ liệu đã cho biết dữ liệu cũ. Tải lên Binance khi lỗi do API giới hạn (ADR-008) [[11]](#ref-11) |
| Trạng thái Offline và resync sau khi máy ngủ (E3, E4, A5) | Accepted (MK-91): mỗi lần làm mới lấy lại 500 nến, nên không có nến đóng bị thiếu |
| Nút "Go to latest" khi người dùng đã kéo khỏi nến cuối (A3) | Không thêm. Người dùng kéo về nến cuối bằng thao tác kéo đã có (MK-42). Nến mới vẫn được thêm vào chart (MK-67) |
| Giữ lựa chọn sau khi đăng nhập lại (E5, R14) | Khác quyết định đã chốt: reload và đăng nhập lại trả về lựa chọn mặc định (MK-37) |
| Làm mới chỉ lấy 1–2 nến cuối để giảm lưu lượng | Quyết định thiết kế, không phải hành vi người dùng thấy. Ghi trong ADR-007 với rủi ro lưu lượng [[11]](#ref-11) |
| Theo dõi sức khỏe của người vận hành (UC-2: cảnh báo tỷ lệ lỗi, weight) | Ngoài phạm vi vòng polling. Log của API đã có weight và nhóm lỗi; cảnh báo chưa có trong project |
| Thời gian "last updated" chính xác tới 1 giây (R15) | Đã có thời điểm dữ liệu của chart (MK-27, MK-66); không thêm sai số riêng |
| Tương phản 3:1 cho chỉ báo trạng thái (SC 1.4.11) | Ngoài các SC đã chọn cho Market Data ở vòng REST; giữ phạm vi đối chiếu WCAG như vòng REST |

## Quyết định do agent đề xuất

Các giá trị và quyết định dưới đây do agent đề xuất. Product owner duyệt toàn bộ ngày 2026-11-22, không đổi giá trị nào. Giá trị gốc nằm trong rule, scenario hoặc ADR được nêu ở cột Mục; khi một giá trị đổi, sửa nơi gốc rồi sửa bảng này.

| Mục | Đề xuất | Nguồn và lý do | Thay đổi so với nguồn hiện có |
| --- | --- | --- | --- |
| Chu kỳ làm mới (MK-63, MK-64) | 5 giây cho mọi chart và sidebar | Bằng TTL cache của API (ADR-006). Ngắn hơn thì nhận lại cùng dữ liệu; dài hơn làm baseline yếu so với WebSocket [[6]](#ref-6) | Trước đây không có làm mới |
| Thời gian bắt đầu làm mới khi tiếp tục hoặc tab hiện lại (MK-75, MK-77) | 1 giây | Understanding SC 2.2.2: chuyển tới dữ liệu hiện tại khi tiếp tục; 1 giây đủ cho một lần render | Hành vi mới |
| Giữ 500 nến sau làm mới (MK-67) | Nến cũ nhất rời chart khi có nến mới | Giữ giới hạn của MK-33 và đủ mẫu cho MA (MK-24) | Trả lời OQ-085 cho vòng polling |
| Điều khiển tạm dừng (MK-73, MK-74) | Một điều khiển cho mọi chart và sidebar; dòng đã tạm dừng kèm thời điểm | WCAG 2.2 SC 2.2.2 mức A; prototype | Thêm điều khiển mới trên Realtime |
| Chart chưa có dữ liệu không tự tải lại (MK-82) | Chỉ tải lại bằng thao tác thử lại | Giữ focus và thông báo ổn định (MK-38, MK-48) | Hành vi mới |
| Độ mới (QA-12) | Dưới 11 giây ở p95 | Chu kỳ 5 giây cộng TTL 5 giây cộng 1 giây cho response và vẽ | Scenario mới |
| Tải lên Binance (QA-13) | Không quá 504 weight mỗi phút với 1, 10, 50 client, kể cả khi Binance lỗi | Mức trần của ADR-006, khoảng 8% giới hạn theo IP | Scenario mới; cần ADR-008 |
| Polling tải lại toàn bộ cửa sổ (ADR-007) | Không đổi API và contract | Không có bước nối nến; giữ các rule nến đã kiểm | Lưu lượng khoảng 3 MB mỗi client mỗi phút, ước tính, chưa đo |
| Giữ lỗi nguồn trong TTL (ADR-008) | Thay quy tắc không cache lỗi của ADR-006 | Mức trần weight không tăng theo số client khi Binance lỗi | Thử lại của người dùng trong TTL nhận lại cùng lỗi, tối đa 5 giây |

## Kết luận

Requirements của vòng cập nhật định kỳ đủ để thiết kế test chức năng: product owner đã duyệt các mục ở bảng trên ngày 2026-11-22. Mọi gap có quyết định, trừ MK-92 (chu kỳ theo timeframe), là gap Open không chặn vòng này: MK-63 dùng một chu kỳ cho mọi timeframe. Test hiệu năng của QA-12 cần nguồn tham chiếu có timestamp để đo source-to-chart delay [[6]](#ref-6). Tỷ lệ thời gian dữ liệu cũ và bytes/client/phút chỉ là phép đo mô tả, chưa có ngưỡng; định nghĩa của chúng thuộc `rest-polling-verification.md`.

## References

1. <a id="ref-1"></a>[Kết quả build REST Market Data](../../../build/01-prototype-to-implementation/market-data/implementation/work/step-08-rest-build/execution.md)
2. <a id="ref-2"></a>[Market Data](../../../UCs/market-data.md)
3. <a id="ref-3"></a>[Quality Attributes](../../../UCs/quality-attributes.md)
4. <a id="ref-4"></a>[Project Brief](../../../UCs/sources/project-brief.md)
5. <a id="ref-5"></a>[Realtime](../../../design/prototype/docs/requirements/realtime.md)
6. <a id="ref-6"></a>[Market Data sẽ thêm dòng nào vào CV?](../../../build/01-prototype-to-implementation/market-data/implementation/cv-goal.md)
7. <a id="ref-7"></a>[Open Questions](../../../open-questions.md)
8. <a id="ref-8"></a>W3C, _Web Content Accessibility Guidelines (WCAG) 2.2_, W3C Recommendation, 12/12/2024. <https://www.w3.org/TR/WCAG22/>
9. <a id="ref-9"></a>W3C, _Understanding SC 2.2.2: Pause, Stop, Hide (Level A)_, cập nhật 04/10/2026, đọc ngày 2026-11-22. <https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html>
10. <a id="ref-10"></a>[Kiểm chứng REST tải lịch sử](rest-verification.md)
11. <a id="ref-11"></a>[Architectural Decisions](../../../architecture/30-decisions.md)
