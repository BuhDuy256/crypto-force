# Market Data sẽ thêm dòng nào vào CV?

## Định hướng để có câu chuyện vào CV.

REST trước → bổ sung WebSocket sau.
=> Câu chuyện muốn kể là **cải thiện độ mới của dữ liệu, giảm tải và vẫn giữ dữ liệu đúng khi kết nối gián đoạn.**

REST vẫn giữ vai trò tải lịch sử và bù dữ liệu bị thiếu; WebSocket bổ sung cập nhật trực tiếp. Ta có thể chia thành 3 flow nhỏ:
1. REST: chọn pair/timeframe → tải nến → xem chart.
2. REST polling: chart tự cập nhật định kỳ. Đây là baseline để đo.
3. WebSocket: subscribe theo pair/timeframe → nhận cập nhật; reconnect và dùng REST để bù khoảng trống.

## Các chỉ số, cách đo và giá trị thể hiện của chúng trong CV?

> Các chỉ số dưới đây là kế hoạch đo, chưa phải kết quả đã đạt. Ngưỡng đánh giá sẽ được xác định trước khi benchmark. Chỉ dùng số liệu đã đo và có bằng chứng trong CV.
>
> Mức độ giá trị là đánh giá đề xuất cho CV Developer của dự án này. Rất cao: chứng minh quy mô, tốc độ hoặc độ tin cậy của hệ thống. Cao: chứng minh hiệu quả kiến trúc và tài nguyên. Bổ trợ: làm rõ trải nghiệm người dùng. Các chỉ số cùng mức không có thứ hạng riêng.

| Chỉ số | Mức độ giá trị cho CV | Cách đo | Giá trị thể hiện trong CV |
| --- | --- | --- | --- |
| Số client đồng thời | Rất cao | Đo số client đang nhận đúng dữ liệu và vẫn đạt ngưỡng độ trễ đã xác định. Ghi cấu hình máy, thời lượng chạy và số pair/timeframe đang hoạt động. | Khả năng phục vụ tải với điều kiện kiểm chứng cụ thể |
| Độ trễ cập nhật (p50/p95/p99) | Rất cao | Đo thời gian từ lúc backend nhận event đến lúc client áp dụng event vào chart. Kiểm soát sai lệch đồng hồ giữa backend và client. | Khả năng thiết kế và cải thiện tốc độ truyền, xử lý dữ liệu |
| Thời gian phục hồi | Rất cao | Đo từ lúc mạng được khôi phục đến lúc chart nhận cập nhật mới và bù đủ nến đóng bị thiếu. Báo cáo p95 qua các lần ngắt mạng có kiểm soát. | Khả năng reconnect và phục hồi dữ liệu |
| Độ đầy đủ và độ đúng của nến | Rất cao | Đếm nến đóng bị thiếu, trùng khóa pair/timeframe/thời gian mở, hoặc lệch OHLCV so với bộ dữ liệu đối chiếu. Kiểm tra cả sau reconnect và REST backfill. | Chất lượng dữ liệu phục vụ chart và Backtest |
| Số request upstream | Cao | Đếm request REST tới Binance/phút. Đếm riêng request từ browser tới API và số subscription WebSocket tới Binance. | Khả năng giảm tải upstream và sử dụng quota hiệu quả |
| Hiệu quả fan-out | Cao | Đo số client dùng chung một subscription upstream theo pair/timeframe. Kiểm tra số subscription upstream khi tăng số client cùng xem một stream. | Khả năng chia sẻ dữ liệu upstream giữa nhiều client |
| Lưu lượng mạng | Cao | Đo bytes/client/phút với cùng workload. Ghi cả nhịp cập nhật và độ mới dữ liệu để so sánh REST polling với WebSocket. | Hiệu quả truyền dữ liệu |
| CPU, RAM và event-loop lag | Cao | Đo dưới cùng số client, số subscription và tốc độ event. Theo dõi diễn biến trong suốt lượt chạy để phát hiện tích tụ bộ nhớ hoặc hàng đợi. | Hiệu quả tài nguyên và khả năng xác định bottleneck |
| Tỷ lệ thời gian dữ liệu bị cũ | Bổ trợ | Đo phần trăm thời gian chart chậm hơn trạng thái nguồn quá ngưỡng đã xác định. So sánh với nguồn tham chiếu, không coi việc giá không đổi là dữ liệu bị cũ. | Chất lượng cập nhật realtime mà người dùng nhận được |
| Thời gian hiện chart đầu tiên | Bổ trợ | Đo từ lúc người dùng chọn pair/timeframe đến lúc chart hiển thị bộ nến đầu tiên của lựa chọn đó. Tách kết quả cache hit và cache miss. | Hiệu năng tải dữ liệu và hiển thị frontend |

> Khi so sánh hai phiên bản, giữ cố định cấu hình máy, workload, thời lượng và cấu hình cache. Ghi rõ chu kỳ REST polling và nguồn dữ liệu thật hay nguồn phát lại. Kết quả load test phải được ghi là load test, không dùng thay số người dùng production.

## Ví dụ dòng trong CV

Một bullet cần cho thấy đóng góp đã tạo ra giá trị gì. Chỉ số là bằng chứng cho giá trị đó. Princeton hướng dẫn viết theo Action → Context → End result [[1]](#ref-1). Santa Clara University dùng Context → Action → Result [[2]](#ref-2). MIT Sloan khuyên nêu kết quả, giải thích ý nghĩa và giữ bullet trong khoảng 1–2 dòng [[3]](#ref-3).

Áp dụng các hướng dẫn này cho Market Data, xác định câu chuyện trước khi viết câu tiếng Anh:

| Câu hỏi | Ví dụ để xác định nội dung |
| --- | --- |
| Trước đó có giới hạn gì? | Mỗi client tạo thêm request upstream, hoặc polling khiến chart chậm cập nhật |
| Giới hạn đó ảnh hưởng gì? | Hệ thống khó phục vụ nhiều client, tốn quota hoặc hiển thị dữ liệu cũ |
| Bạn thay đổi cơ chế nào? | Chia sẻ subscription theo pair/timeframe hoặc chuyển sang cập nhật bằng WebSocket |
| Sau thay đổi, hệ thống làm được gì tốt hơn? | Phục vụ nhiều client hơn trên cùng máy hoặc giảm độ chậm của dữ liệu |
| Bằng chứng nào xác nhận kết quả? | So sánh trước/sau dưới cùng workload, kèm điều kiện về latency hoặc tài nguyên |

Mỗi bullet tập trung vào một câu chuyện giá trị. Với scale, điểm nhấn là phục vụ nhiều client hơn trên cùng tài nguyên. Với freshness, điểm nhấn là chart nhận dữ liệu mới hơn. Với reliability, điểm nhấn là tự phục hồi và giữ dữ liệu đầy đủ sau gián đoạn.

Ưu tiên impact-first: mở đầu bằng kết quả như Increased, Reduced hoặc Achieved, rồi nêu cơ chế tạo ra kết quả. Giữ mỗi bullet một câu và kiểm tra độ dài trên bản CV đã dàn trang. Chuyển chi tiết benchmark sang báo cáo khi câu vượt khoảng 1–2 dòng.

Đề xuất chọn 3–4 bullet cho project, không dùng toàn bộ mẫu. Các tác động cùng nguyên nhân có thể gộp vào một bullet nếu câu vẫn dễ đọc. Bộ ba ưu tiên cho Market Data là scale và latency, freshness kèm upstream efficiency, và recovery hoặc data integrity.

Ví dụ, “Supported {N} concurrent clients with {L} ms p95 latency” nêu năng lực đã đạt. Câu có thêm thay đổi kỹ thuật, baseline và chất lượng được giữ lại sẽ giải thích rõ hơn đóng góp của người viết. Cấu trúc đề xuất là: **kết quả có giá trị → thay đổi kỹ thuật tạo ra kết quả → bằng chứng hoặc điều kiện đo cần thiết**.

> Không bắt buộc mọi bullet đều có so sánh trước/sau. Khi xây mới, giá trị có thể là một năng lực trước đó chưa có. Không dựng baseline yếu để tạo phần trăm cải thiện. Chỉ ghi quan hệ nguyên nhân khi bằng chứng hỗ trợ quan hệ đó.
>
> Thời gian chờ lần poll tiếp theo không thuộc backend-to-chart latency. Khi so sánh polling với WebSocket về độ mới dữ liệu, dùng cùng định nghĩa source-to-chart delay và nguồn tham chiếu có kiểm soát timestamp.

> Các dòng dưới đây là mẫu viết, chưa phải thành tích đã đạt. Thay phần trong dấu `{...}` bằng kết quả đã kiểm chứng. Chọn các dòng phù hợp với phần đã triển khai và giữ báo cáo benchmark làm bằng chứng.
>
> Các mẫu cùng nhóm là lựa chọn thay thế, không cần dùng đồng thời. Mẫu gộp freshness và upstream efficiency chỉ áp dụng khi cả hai kết quả thuộc cùng phép so sánh. Request count không đồng nghĩa với quota usage nếu request có trọng số khác nhau.
>
> Chỉ dùng mẫu không có nến sai khi phép đối chiếu xác nhận kết quả đó trong phạm vi đã ghi. Kết quả kiểm thử không bảo đảm mọi dữ liệu tương lai đều đúng. Chỉ ghi WebSocket deltas khi hệ thống thực sự gửi phần dữ liệu thay đổi.

- **Scale and latency:** Increased **load-tested** capacity from {A} to {B} concurrent clients through shared subscriptions, maintaining p95 update latency below {L} ms on unchanged hardware.

> **Load-tested**: sức tải đã được kiểm chứng bằng thử nghiệm mô phỏng nhiều client đồng thời. Con số này thể hiện khả năng phục vụ trong điều kiện thử nghiệm đã ghi nhận, không phải số người dùng thực tế trên production.

- **Freshness:** Reduced p95 source-to-chart delay from {A} to {B} ms by replacing {P}-second polling with WebSocket streaming under identical workloads.
- **Upstream efficiency:** Reduced Binance REST requests by {R}% through shared pair/timeframe subscriptions versus {P}-second polling at the same {N}-client load.
- **Freshness and upstream efficiency:** Reduced p95 source-to-chart delay by {D}% and Binance REST requests by {R}% through WebSocket streaming versus {P}-second polling under identical workloads.
- **Recovery:** Achieved {T}-second p95 recovery after network restoration through reconnect and REST backfill, with no missing or duplicate closed candles across {K} fault tests.
- **Data integrity:** Verified OHLCV integrity across {N} closed candles and {S} pair/timeframe combinations through automated post-sync reconciliation, with no missing, duplicate, or mismatched candles.
- **Bandwidth:** Reduced traffic from {A} to {B} KB/client/minute at {N}-client load by replacing {P}-second REST polling with WebSocket updates under identical workloads.
- **Resource efficiency:** Reduced backend RAM from {A} to {B} MB at {N} concurrent clients and {E} events/second by {specific change} under identical workloads.

## Ngoài 1 dòng chỉ số trong CV thì có gì?

Market Data còn có thể cung cấp một case study về cách thiết kế, phát triển và kiểm chứng hệ thống. Project Brief đặt trọng tâm vào kiến trúc có thể thay đổi và mở rộng, đồng thời giữ tính đúng đắn và khả năng quan sát [[4, §30]](#ref-4). Một dòng CV là phần tóm tắt kết quả. Code, tài liệu và demo là bằng chứng để giải thích kết quả khi review portfolio hoặc phỏng vấn.

| Giá trị ngoài chỉ số | Câu chuyện có thể trình bày | Bằng chứng nên chuẩn bị |
| --- | --- | --- |
| Thiết kế ranh giới và khả năng thay provider | Frontend dùng contract dữ liệu thống nhất, không phụ thuộc payload Binance. Giải thích phần phải thay khi thêm provider khác [[4, §4 và §25]](#ref-4). | Sơ đồ Web → API → Market Data Service → Provider, contract nến và test bằng provider giả lập |
| Phát triển từng bước | REST phục vụ lịch sử và backfill, WebSocket bổ sung cập nhật trực tiếp. Giải thích cách nâng cấp mà vẫn giữ contract nến ổn định. | Các increment có thể chạy, diff giữa các bước và quyết định về trách nhiệm của từng transport |
| Thiết kế luồng realtime | Giải thích đường đi của dữ liệu, nơi chuẩn hóa và cách chuyển cập nhật tới đúng pair/timeframe. Liên hệ với luồng realtime trong brief [[4, §4 và §17]](#ref-4). | Data-flow diagram, sequence tải lịch sử rồi nhận cập nhật và demo subscribe/unsubscribe |
| Xử lý lỗi và phục hồi | Giải thích cách phát hiện mất kết nối, reconnect và bù nến thiếu. Phân biệt kết nối đã mở lại với dữ liệu đã đồng bộ xong [[4, §17 và §25]](#ref-4). | Demo ngắt mạng, sequence phục hồi và kết quả đối chiếu nến sau backfill |
| Tách trách nhiệm giữa các module | Giải thích vì sao adapter lấy dữ liệu, service điều phối và chart hiển thị. Tránh một service vừa lấy dữ liệu vừa tính strategy, backtest và gửi mọi sự kiện [[4, §27]](#ref-4). | Component diagram, dependency boundaries trong code và test từng phần qua interface |
| Khả năng quan sát và chẩn đoán | Giải thích cách tìm nguyên nhân chart bị chậm hoặc ngừng cập nhật. Đề xuất phân biệt lỗi upstream, xử lý backend và client chậm theo mục tiêu observability của brief [[4, §17 và §30]](#ref-4). | Log và metric có ngữ cảnh pair/timeframe, timeline của một lần lỗi và cách xác định nguyên nhân |
| Demo chức năng có thể kiểm chứng | Cho thấy người dùng xem nến và đổi timeframe. Khi triển khai multi-chart, chứng minh đổi timeframe của một chart không làm tải lại các chart khác [[4, §5]](#ref-4). | Demo flow thật, dữ liệu đã tải và các kiểm tra hành vi tương ứng |
| Lập luận về trade-off | Giải thích vì sao chọn WebSocket, vì sao REST vẫn cần và điều kiện nào khiến thiết kế phải thay đổi. Brief yêu cầu giải thích lựa chọn kiến trúc và cung cấp deliverables [[4, §23 và §28]](#ref-4). | ADR ngắn có lựa chọn thay thế, lợi ích, chi phí và điều kiện xem xét lại |

Bộ bằng chứng đề xuất cho phần Market Data gồm code chạy được, hướng dẫn chạy/demo, sơ đồ kiến trúc và data flow, ADR cho quyết định chính, cùng báo cáo benchmark và phục hồi lỗi. Bộ này cụ thể hóa các deliverables của Project Brief cho phạm vi Market Data [[4, §28]](#ref-4).

> Đây là các giá trị và bằng chứng dự kiến, không phải tuyên bố hệ thống đã có đầy đủ. Chuẩn bị bằng chứng theo từng flow đã triển khai. Không cần xây provider thứ hai hoặc toàn bộ multi-chart chỉ để có câu chuyện trong CV.

## References

1. <a id="ref-1"></a>[Action-Oriented Accomplishment Statements](https://careerdevelopment.princeton.edu/resume-guide/action-oriented-accomplishment-statements)
2. <a id="ref-2"></a>[Accomplishment Statements](https://www.scu.edu/careercenter/toolkit/resumes/accomplishment-statements/)
3. <a id="ref-3"></a>[Resume Educational Videos — 4 Tips to Writing Strong Bullets](https://cdn.cdo.mit.edu/wp-content/uploads/sites/67/2020/05/Resume-Educational-Videos-2018-Slides.pdf)
4. <a id="ref-4"></a>[Project Brief](../../../../UCs/sources/project-brief.md)
