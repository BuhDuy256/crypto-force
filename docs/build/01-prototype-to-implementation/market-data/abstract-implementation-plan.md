# Kế hoạch triển khai Market Data ở mức tổng quan

Đọc file này để biết thứ tự triển khai Market Data và tài liệu cần tạo hoặc cập nhật ở từng giai đoạn.

> **Quy tắc cho agent:** chỉ đọc file này khi lập kế hoạch hoặc triển khai. Chỉ sửa file khi người dùng yêu cầu trực tiếp sửa abstract plan. Ghi phạm vi cụ thể, kế hoạch chi tiết, điều chỉnh cách thực hiện và kết quả công việc trong `work/step-<số hai chữ số>-<tên-ngắn>/`. Cập nhật tiến độ trong `tracker.md`. Không ghi các nội dung đó vào file này.

Kế hoạch đi từ frontend dùng mock đến REST, sau đó bổ sung WebSocket và kiểm chứng các mục tiêu về chức năng, thiết kế, độ tin cậy và hiệu năng [[1]](#ref-1) [[2]](#ref-2).

> Các đường dẫn bên dưới tính từ gốc repo. **Proposed:** tạo `docs/UCs/market-data.md` và test scope `docs/testing/test-scopes/TS-002-market-data/` khi bắt đầu giai đoạn tương ứng. Test scope có một file phân tích requirements cho mỗi increment REST, REST polling và WebSocket. Mỗi file ghi trạng thái requirements trước phân tích. Tài liệu testing ghi phân tích yêu cầu, kịch bản và kết quả cần thiết cho flow, không triển khai full STLC.

## Thứ tự triển khai và cập nhật docs

1. **Chọn phạm vi của flow REST đầu tiên.**
   - Chọn các hành vi sẽ làm trước từ mục tiêu Market Data, chẳng hạn xem lịch sử nến và đổi pair/timeframe. Xác định phần nào để lại cho vòng WebSocket.
   - **Tài liệu làm việc:** ghi phạm vi đã chọn, phần hoãn và đầu ra cần đạt trong `work/step-01-rest-scope/plan.md`. Đối chiếu `goal.md` và `cv-goal.md` để giữ các mục tiêu dài hạn, chưa biến các mục tiêu đó thành cam kết đã đạt.

2. **Hoàn thiện frontend bằng mock data.**
   - Chuyển UI phục vụ flow đã chọn từ prototype vào `apps/web`. Làm logic tương tác và các trạng thái loading, empty, error bằng mock, chưa nối API thật.
   - **Docs:** ghi lại hành vi đã thống nhất vào bản nháp `docs/UCs/market-data.md`. UI là đầu vào để phân tích yêu cầu, không phải nguồn duy nhất để kết luận yêu cầu đã đủ.

3. **Phân tích và chốt requirements cho REST.**
   - **Docs:** hoàn thiện `docs/UCs/market-data.md` với phạm vi, main flow, alternative flow, exception flow, business rules và acceptance criteria. Làm rõ lịch sử nến, pair/timeframe, nến đang mở và hành vi khi tải dữ liệu thất bại.
   - **Docs:** cập nhật `docs/UCs/quality-attributes.md` với tiêu chí chất lượng áp dụng cho REST. Giá trị chưa được chốt phải giữ trạng thái đề xuất.
   - **Docs:** ghi kết quả phân tích vào `docs/testing/test-scopes/TS-002-market-data/rest-requirement-gap-analysis.md`: trạng thái requirements trước phân tích, nguồn đối chiếu, điểm thiếu hoặc mâu thuẫn và kết quả giải quyết. Đối chiếu thêm một baseline độc lập trước khi kết luận yêu cầu đủ để thiết kế test.
   - **Docs:** ghi quyết định còn mở vào `docs/open-questions.md`. Cập nhật `docs/UCs/README.md` để người đọc tìm được tài liệu Market Data.

4. **Thiết kế ranh giới và luồng xử lý REST.**
   - **Docs:** bổ sung `docs/architecture/10-market-data.md` với sơ đồ Web → API → Market Data Service → Provider, trách nhiệm từng thành phần, luồng lấy lịch sử và xử lý lỗi. Liên kết thiết kế với các yêu cầu tương ứng.
   - **Docs:** mô tả interface provider, phần phải thay khi đổi provider và dependency boundaries trong cùng file. Thiết kế cách truyền provider giả lập vào service để kiểm chứng ranh giới mà không cần xây provider thật thứ hai.
   - **Docs:** xác định vị trí log/metric và ngữ cảnh pair/timeframe trong cùng file. Làm rõ bằng chứng cần có để phân biệt lỗi upstream, xử lý backend và client chậm. Mở rộng thiết kế observability khi bổ sung WebSocket.
   - **Docs:** cập nhật `docs/architecture/00-system.md` nếu cần bổ sung hoặc thay đổi mô tả thành phần ở cấp hệ thống.

5. **Thiết kế contract nến và API REST.**
   - **Docs:** ghi contract nến thống nhất và quy tắc chuẩn hóa dữ liệu provider trong `docs/architecture/10-market-data.md`.
   - **Docs:** bổ sung `docs/architecture/22-api-endpoints.md` với endpoints của flow, query parameters, response, validation và lỗi. Tham chiếu contract nến thay vì định nghĩa lại ở nhiều nơi.
   - Việc định nghĩa schema trong `packages/shared` thuộc bước build. Contract được thiết kế ở đây là đầu vào cho schema và việc thay mock bằng API thật.

6. **Thiết kế database và cache.**
   - **Docs:** bổ sung phần Market Data trong `docs/architecture/21-database.md`: dữ liệu cần lưu, schema và ràng buộc nếu có. Nếu giai đoạn REST chưa cần lưu dữ liệu Market Data, ghi rõ quyết định và lý do.
   - **Docs:** ghi trách nhiệm cache, cách làm mới và quan hệ giữa cache với provider trong `docs/architecture/10-market-data.md`.
   - **Docs:** ghi các quyết định có trade-off vào `docs/architecture/30-decisions.md`, gồm phương án đã cân nhắc và điều kiện cần xem lại. Điều chỉnh thiết kế API nếu quyết định lưu trữ làm thay đổi contract.

7. **Chốt cách kiểm chứng REST và baseline.**
   - **Docs:** bổ sung tài liệu kiểm chứng của increment trong `docs/testing/test-scopes/TS-002-market-data/` với kịch bản chức năng, contract, dữ liệu và lỗi provider. Liên kết các kịch bản với yêu cầu cần kiểm chứng.
   - **Docs:** bổ sung kiểm chứng service qua provider giả lập, schema nến dùng chung và dependency boundaries. Ghi kịch bản E2E xem nến, đổi pair/timeframe. Nếu triển khai multi-chart, kiểm tra đổi timeframe một chart không làm tải lại chart khác.
   - **Docs:** xác định workload, môi trường và cách ghi kết quả baseline REST trong cùng file. Chọn các phép đo phục vụ mục tiêu trong `goal.md` và `cv-goal.md`, giữ điều kiện để so sánh với WebSocket sau này.
   - **Docs:** xác định trước các nhóm đo ưu tiên: capacity kèm latency và dữ liệu đúng, freshness kèm request upstream và fan-out, recovery kèm đối soát nến. Bước REST thu thập baseline áp dụng được, bước WebSocket bổ sung các phép đo còn lại.
   - **Docs:** chọn phép đo bổ sung theo phạm vi: bandwidth, CPU/RAM/event-loop lag, tỷ lệ thời gian dữ liệu bị cũ và thời gian hiện chart đầu tiên. Ghi rõ phép đo nào thực hiện hoặc hoãn, không mặc định phải tối ưu toàn bộ chỉ số.
   - Chỉ cập nhật `docs/testing/test-strategy.md` nếu cần thay đổi chiến lược hoặc công cụ chung của repo.

   - Sau khi chốt cách kiểm chứng, viết test tự động cho flow REST trước khi build. Test fail cho tới khi Bước 8 build xong phần tương ứng.

8. **Build và kiểm chứng flow REST xuyên suốt.**
   - Triển khai contract dùng chung → provider adapter → service → API → nối frontend. Bổ sung test và observability theo từng phần.
   - Hoàn thành REST tải lịch sử trước, sau đó bổ sung REST polling thành bước chạy được riêng. Trước khi build polling, ghi phân tích requirements vào `docs/testing/test-scopes/TS-002-market-data/rest-polling-requirement-gap-analysis.md` và viết test trước. Cập nhật hành vi polling, cơ chế và kết quả kiểm chứng lần lượt trong UCs, kiến trúc và tài liệu testing trước khi chuyển sang WebSocket.
   - **Docs:** cập nhật kết quả thực chạy, điều kiện đo và đường dẫn evidence trong tài liệu kiểm chứng của increment trong `docs/testing/test-scopes/TS-002-market-data/`. Đối chiếu hành vi thực tế với UCs và thiết kế. Mọi thay đổi hành vi phải được chốt lại trong UCs trước khi coi flow đã hoàn thành.
   - Giữ commit và diff cho từng bước REST tải lịch sử → REST polling → WebSocket. Lưu lệnh chạy, cấu hình và kết quả baseline để có thể chạy lại các phiên bản dùng cho phép so sánh.

9. **Phân tích và chốt requirements cho WebSocket.**
   - **Docs:** mở rộng `docs/UCs/market-data.md` với cập nhật trực tiếp, thay đổi pair/timeframe, mất kết nối, dữ liệu cũ và phục hồi đồng bộ theo góc nhìn người dùng.
   - **Docs:** cập nhật `docs/UCs/quality-attributes.md` với tiêu chí độ mới dữ liệu, tải đồng thời, latency, phục hồi và tính toàn vẹn dữ liệu cần kiểm chứng. Phân biệt mục tiêu với kết quả đã đo.
   - **Docs:** ghi phân tích tác động vào `docs/testing/test-scopes/TS-002-market-data/websocket-requirement-gap-analysis.md`. Ghi quyết định chưa chốt vào `docs/open-questions.md`.

10. **Thiết kế WebSocket và xem lại thiết kế REST.**
    - **Docs:** cập nhật `docs/architecture/10-market-data.md` với luồng realtime, shared subscriptions, vòng đời subscription, chuyển từ lịch sử sang realtime, reconnect và REST backfill. Làm rõ cách xử lý nến thiếu, trùng hoặc đến không đúng thứ tự.
    - **Docs:** mở rộng `docs/architecture/22-api-endpoints.md` với giao thức WebSocket: kết nối, subscribe/unsubscribe, event payload, lỗi và trạng thái đồng bộ. Ghi rõ REST tiếp tục phục vụ lịch sử và backfill.
    - **Docs:** cập nhật `docs/architecture/20-state-machine.md` cho vòng đời kết nối và đồng bộ. Cập nhật `docs/architecture/23-security.md` cho validation, giới hạn subscription và bảo vệ tài nguyên khi thiết kế yêu cầu.
    - **Docs:** xem lại `docs/architecture/21-database.md` theo nhu cầu phục hồi và lưu trữ. Chỉ sửa schema nếu thiết kế mới cần. Cập nhật `00-system.md` nếu thành phần hoặc kết nối ở cấp hệ thống thay đổi.
    - **Docs:** ghi quyết định chuyển sang WebSocket và trade-off trong `docs/architecture/30-decisions.md`.

11. **Chốt cách kiểm chứng WebSocket trước khi build.**
    - **Docs:** mở rộng tài liệu kiểm chứng của increment trong `docs/testing/test-scopes/TS-002-market-data/` với kịch bản subscription, nhiều client, chuyển pair/timeframe, gián đoạn kết nối và đối soát dữ liệu sau phục hồi.
    - **Docs:** xác định bộ dữ liệu tham chiếu và cách đối chiếu nến đóng sau reconnect/backfill. Kiểm tra nến thiếu, trùng khóa pair/timeframe/thời gian mở và lệch OHLCV. Đo phục hồi đến khi chart nhận cập nhật mới và bù đủ nến đóng bị thiếu.
    - **Docs:** ghi phép so sánh REST–WebSocket với cùng workload và cấu hình máy. Phân biệt backend-to-chart latency với source-to-chart delay. Giữ định nghĩa chỉ số nhất quán giữa requirements, thiết kế và kết quả đo.
    - **Docs:** tách phép so sánh REST polling–WebSocket cho freshness và request upstream khỏi phép so sánh trước/sau shared subscriptions cho capacity và fan-out. Giữ các điều kiện còn lại tương đương để đánh giá tác động của shared subscriptions. Không dựng baseline yếu chỉ để tạo mức cải thiện.
    - **Docs:** chốt điều kiện một client được tính vào capacity: nhận đúng dữ liệu và đạt ngưỡng latency đã thống nhất. Ghi workload, thời lượng, cấu hình máy/cache, chu kỳ polling, nguồn thật hoặc phát lại và cách kiểm soát timestamp. Đếm riêng request browser → API, REST upstream và subscription upstream.
    - **Docs:** bổ sung kịch bản chẩn đoán chart chậm hoặc ngừng cập nhật bằng log/metric theo pair/timeframe. Xác định cách lưu timeline để giải thích nguyên nhân upstream, backend hoặc client.

    - Sau khi chốt cách kiểm chứng, viết test tự động cho WebSocket trước khi build. Test fail cho tới khi Bước 12 build xong phần tương ứng.

12. **Build WebSocket và hoàn thiện bằng chứng.**
    - Build cập nhật trực tiếp xuyên suốt trước, sau đó hoàn thiện shared subscriptions, phục hồi và xử lý client chậm theo thiết kế đã chốt. Kiểm chứng từng phần trước khi đánh giá tải tổng thể.
    - Giữ phiên bản và điều kiện đo trước/sau shared subscriptions nếu muốn dùng dòng CV quy kết mức tăng capacity cho cơ chế chia sẻ subscription. Chỉ nêu quan hệ nguyên nhân khi kết quả so sánh hỗ trợ.
    - **Docs:** cập nhật kết quả chức năng, phục hồi và hiệu năng trong tài liệu kiểm chứng của increment trong `docs/testing/test-scopes/TS-002-market-data/`, kèm đường dẫn evidence và giới hạn của kết quả.
    - **Docs:** lưu kết quả E2E, đối soát nến và timeline của tình huống chẩn đoán trong cùng tài liệu. **Proposed:** đặt dữ liệu đo, log và trace cần thiết trong `docs/testing/evidence/market-data/`, liên kết tới đúng phiên bản code đã kiểm chứng.
    - **Docs:** đối chiếu lại `docs/UCs/market-data.md`, `docs/UCs/quality-attributes.md` và các tài liệu kiến trúc đã sửa. Ghi các quyết định cuối cùng vào ADR khi có trade-off.
    - **Tài liệu làm việc:** đối chiếu từng mục trong `goal.md` và các nhóm chỉ số đã chọn từ `cv-goal.md` với đường dẫn bằng chứng. Ghi kết quả đối chiếu và dòng CV đã điền số liệu trong folder của step 12 thuộc `work/`. Ghi rõ mục đã đạt, chưa đạt hoặc hoãn. Chỉ dùng kết quả có bằng chứng và ghi rõ capacity từ load test.
    - **Tài liệu làm việc:** ghi hướng dẫn chạy/demo trong folder của step 12 thuộc `work/`, gồm flow dữ liệu thật, đổi pair/timeframe, subscribe/unsubscribe và ngắt mạng rồi phục hồi. Bổ sung demo multi-chart nếu nằm trong phạm vi đã triển khai.

Các tài liệu requirements, architecture và testing được cập nhật trong từng vòng REST và WebSocket theo các bước trên. Khi phát hiện yêu cầu thiếu hoặc thiết kế không phù hợp, ghi phân tích và điều chỉnh cách thực hiện vào folder của step trong `work/`. Sau đó chốt lại tài liệu sản phẩm liên quan trước khi tiếp tục triển khai. Nếu cần thay đổi khung thứ tự của abstract plan, ghi đề xuất trong `work/` và báo người dùng, không tự sửa abstract plan.

## References

1. <a id="ref-1"></a>[Những thứ cần đạt được trong lúc build Market Data](goal.md)
2. <a id="ref-2"></a>[Market Data sẽ thêm dòng nào vào CV?](cv-goal.md)
