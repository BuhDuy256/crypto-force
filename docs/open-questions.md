# Open Questions

Đọc file này để biết những câu hỏi sản phẩm và kỹ thuật chưa được quyết, mức ưu tiên, việc mà mỗi câu đang chặn, và kết quả của các câu đã giải quyết.

## Quy ước

- **ID** có dạng `OQ-XXX`, tăng dần, không đổi và không tái sử dụng. Link tới một câu bằng `open-questions.md#oq-xxx`.
- **Ưu tiên:**
  - **High:** chặn engine, schema DB, kiến trúc hoặc expected value của test. Phải quyết trước khi code module đó.
  - **Medium:** chặn API hoặc flow của một module.
  - **Low:** chi tiết UI, quyết khi làm tới màn hình đó.
- **Chặn:** phần việc không thể hoàn thành khi câu hỏi chưa có câu trả lời.
- **Vòng đời:** câu Open nằm trong section theo module. Khi được quyết, nội dung chốt được ghi vào tài liệu chính hoặc ADR, còn câu hỏi chuyển xuống [Resolved & Dropped](#resolved--dropped) kèm trích dẫn tới nơi đã ghi. Câu không còn cần thiết chuyển sang Dropped kèm lý do. Không xoá câu hỏi.

## Engine & Backtest

| ID | Câu hỏi | Điều đã biết | Chặn | Ưu tiên | Nguồn |
| --- | --- | --- | --- | --- | --- |
| <a id="oq-001"></a>OQ-001 | Công thức Score: trọng số và cách chuẩn hóa? | UI chỉ mô tả "combines return, max drawdown and win rate" | Evaluator, Leaderboard, golden test R-03 | High | [[1]](#ref-1) [[2]](#ref-2) |
| <a id="oq-002"></a>OQ-002 | Majority Vote khi hòa có phải luôn là HOLD? | Rules ghi "ties hold" | Combination, test R-04 | High | [[3]](#ref-3) [[2]](#ref-2) |
| <a id="oq-003"></a>OQ-003 | Weights có đi theo đúng danh sách block đã chọn không? Tổng weights có phải bằng 1 không? | Phần weights luôn hiện ba dòng MA, RSI, Support / Resistance dù người dùng chọn block khác | Schema composite, Combination | High | [[3]](#ref-3) |
| <a id="oq-004"></a>OQ-004 | Mỗi lệnh dùng bao nhiêu vốn? Có cho mở nhiều lệnh cùng lúc không? | Assumptions ghi "[to confirm with the engine, e.g. full capital per trade]" | Backtest engine | High | [[4]](#ref-4) |
| <a id="oq-005"></a>OQ-005 | LONG và SHORT áp dụng cho mọi strategy, hay theo rules của từng strategy? | Assumptions ghi "Both LONG and SHORT positions" | Backtest engine, strategy definition | High | [[4]](#ref-4) |
| <a id="oq-006"></a>OQ-006 | Các lỗi khác của backtest (thiếu dữ liệu, timeout, rules không hợp lệ) hiển thị ra sao? Lỗi nào nên chặn ngay ở form? | Chỉ có lỗi ngày trước khi pair được niêm yết | Validation form, xử lý lỗi worker | Medium | [[4]](#ref-4) |
| <a id="oq-007"></a>OQ-007 | Run có 0 trade hiển thị là Completed với cảnh báo, hay một trạng thái khác? | Chưa có trạng thái riêng | State machine của run | Medium | [[4]](#ref-4) |
| <a id="oq-008"></a>OQ-008 | Phần trăm tiến trình của run được tính theo tiêu chí nào? | Prototype chạy cố định khoảng 12 giây | Progress event qua WebSocket | Medium | [[4]](#ref-4) |
| <a id="oq-009"></a>OQ-009 | Nếu Cancel không thành công thì báo thế nào, và run mới có được chạy không? | Cancel luôn thành công sau một khoảng ngắn | Luồng Cancel của worker | Medium | [[4]](#ref-4) |
| <a id="oq-010"></a>OQ-010 | Runs được giữ bao lâu, bao nhiêu run? Có cho xóa run không? | Prototype không giới hạn | Schema DB, retention | Medium | [[4]](#ref-4) |
| <a id="oq-011"></a>OQ-011 | Có cần xuất danh sách trades ra file không? | Bảng trades chỉ xem được trên màn hình | — | Low | [[4]](#ref-4) |

## Discovery

| ID | Câu hỏi | Điều đã biết | Chặn | Ưu tiên | Nguồn |
| --- | --- | --- | --- | --- | --- |
| <a id="oq-012"></a>OQ-012 | Search sinh candidate từ đâu: composite hiện tại trên builder, một strategy trong Library, hay toàn bộ building blocks? | UI có phương thức search và Composite builder nhưng không có liên kết giữa hai phần | Kiến trúc Strategy Generator | High | [[1]](#ref-1) |
| <a id="oq-013"></a>OQ-013 | Search chạy trên pair, timeframe và khoảng thời gian nào? | Search configuration không có pair, timeframe hay khoảng thời gian | Cấu hình Search, dữ liệu backtest | High | [[1]](#ref-1) |
| <a id="oq-014"></a>OQ-014 | Leaderboard thuộc từng phiên hay tích lũy? Phiên mới có xóa kết quả cũ không? Giữ bao nhiêu candidate? | Leaderboard trong prototype là dữ liệu cố định | Schema DB, Ranking Service | High | [[1]](#ref-1) |
| <a id="oq-015"></a>OQ-015 | Khi Pause, candidate đang backtest được chạy xong hay bị hủy và chạy lại khi Resume? | UI có Pause | Worker, state machine phiên Search | Medium | [[1]](#ref-1) |
| <a id="oq-016"></a>OQ-016 | Lỗi nào làm phiên Search Failed, lỗi nào chỉ bỏ qua candidate? | Chỉ có một trường hợp Failed | Xử lý lỗi worker | Medium | [[1]](#ref-1) |
| <a id="oq-017"></a>OQ-017 | Có cho chạy nhiều phiên Search song song không? Có cần lịch sử các phiên không? | UI chỉ có một phiên | Schema DB, job queue | Medium | [[1]](#ref-1) |
| <a id="oq-018"></a>OQ-018 | Thông báo kết thúc phiên Search có được gửi khi người dùng đang ở màn hình khác không? | Trạng thái kết thúc chỉ được xử lý khi màn Discovery đang mở. **Proposed**: có, giống Backtest | Notifications | Medium | [[1]](#ref-1) |
| <a id="oq-019"></a>OQ-019 | Có cần lưu một candidate thành composite hoặc strategy trong Library không? | Chỉ có Re-test | API Library | Medium | [[1]](#ref-1) |
| <a id="oq-020"></a>OQ-020 | Thời gian ở trạng thái Paused có tính vào giới hạn Search time không? | Thời gian chỉ tính lúc Running. **Inferred**: không tính | Stop condition | Low | [[1]](#ref-1) |

## Strategy library

| ID | Câu hỏi | Điều đã biết | Chặn | Ưu tiên | Nguồn |
| --- | --- | --- | --- | --- | --- |
| <a id="oq-021"></a>OQ-021 | Hệ thống phân tích mô tả và link ra rules thế nào? Khi không chắc chắn thì hỏi lại người dùng hay đánh dấu giả định? | Preview luôn là bộ rules mẫu | Strategy definition, có thể cần LLM cho việc sinh rules | High | [[3]](#ref-3) |
| <a id="oq-022"></a>OQ-022 | Lỗi validation nào chặn việc lưu, lỗi nào chỉ là cảnh báo? | Các check hiện là ví dụ | Validation strategy definition | Medium | [[3]](#ref-3) |
| <a id="oq-023"></a>OQ-023 | Người dùng có được sửa tham số của từng rule hoặc sửa JSON không? | Chỉ sửa được qua mô tả, link và việc bỏ rule SHORT | UI Strategy Engine, API | Medium | [[3]](#ref-3) |
| <a id="oq-024"></a>OQ-024 | Danh sách domain được hỗ trợ khi import, và cách xử lý trang cần đăng nhập hoặc có paywall? | Prototype chỉ thành công với vài domain mẫu | Import từ link | Medium | [[3]](#ref-3) |
| <a id="oq-025"></a>OQ-025 | Có cần phân biệt minor và major version (đổi logic so với chỉ đổi tham số) không? | Mỗi lần lưu khi sửa tăng patch | Versioning, schema DB | Medium | [[3]](#ref-3) |
| <a id="oq-026"></a>OQ-026 | Xóa một item đang có run chạy: chặn hay cho phép, và run đó hiển thị ra sao? | Chưa thể hiện | API Library, worker | Medium | [[3]](#ref-3) |
| <a id="oq-027"></a>OQ-027 | Tag tự do hay chọn từ danh sách? Có giới hạn số lượng không? | Có ô "Add tag" nhưng chưa có hành vi | — | Low | [[3]](#ref-3) |
| <a id="oq-028"></a>OQ-028 | Có cho đặt tên composite ngay khi lưu không? | Tên tự sinh, chỉ đổi được bằng Rename trong Library | — | Low | [[3]](#ref-3) |
| <a id="oq-029"></a>OQ-029 | Sau 8 giây Undo, có cách khôi phục item đã xóa nào khác không? | Undo có trong 8 giây | — | Low | [[3]](#ref-3) |

## Realtime & Market data

| ID | Câu hỏi | Điều đã biết | Chặn | Ưu tiên | Nguồn |
| --- | --- | --- | --- | --- | --- |
| <a id="oq-030"></a>OQ-030 | Chọn pair trong Search có mở Realtime với pair đó không? | Đã thống nhất pair chung cho mọi chart trên Realtime. Chuyển pair từ Search chưa được chốt [[16]](#ref-16) | Mô hình subscribe WebSocket, Market Data Service | High | [[5]](#ref-5) [[6]](#ref-6) |
| <a id="oq-031"></a>OQ-031 | Tín hiệu BUY/SELL trên chart được tính realtime từ rules của strategy, hay chỉ minh họa? | Badge tín hiệu hiện với mọi source | Engine có nằm trên luồng realtime không | High | [[5]](#ref-5) |
| <a id="oq-033"></a>OQ-033 | Overlay cố định theo signal source, hay người dùng tự chọn? | Chart chỉ có MA(20) | — | Low | [[5]](#ref-5) |
| <a id="oq-034"></a>OQ-034 | Cờ onboarding tính theo tài khoản hay theo thiết bị? Có Hide riêng từng bước không? | Done dựa trên cờ lưu trong trình duyệt | — | Low | [[5]](#ref-5) |
| <a id="oq-086"></a>OQ-086 | Chart theo timeframe lớn (1h, 4h, 1d) có cần chu kỳ làm mới dài hơn 5 giây không? | Vòng cập nhật định kỳ dùng một chu kỳ 5 giây cho mọi chart (MK-63), product owner duyệt ngày 2026-11-22. Chu kỳ dài hơn giảm request từ browser và lưu lượng, nhưng nến đang mở của các timeframe này vẫn đổi giá theo từng giao dịch [[16, Theo dõi cập nhật định kỳ]](#ref-16) | — | Low | [[16]](#ref-16) |

## News & Sentiment

| ID | Câu hỏi | Điều đã biết | Chặn | Ưu tiên | Nguồn |
| --- | --- | --- | --- | --- | --- |
| <a id="oq-036"></a>OQ-036 | Ngưỡng điểm cho từng nhãn Positive, Neutral, Negative là bao nhiêu? | Điểm từ −1 tới +1; điểm do LLM API tính qua `SentimentAnalyzer` [[7, Tech Stack]](#ref-7) | Sentiment Service, Sentiment strategy | High | [[8]](#ref-8) |
| <a id="oq-037"></a>OQ-037 | Sentiment 24 giờ của một coin được tổng hợp từ các bài thế nào (trung bình, có trọng số theo nguồn)? | Điều kiện strategy dùng "sentiment 24 giờ của coin" | Sentiment strategy | High | [[8]](#ref-8) |
| <a id="oq-038"></a>OQ-038 | Một bài nhắc tới nhiều coin xử lý thế nào? Sentiment áp dụng cho mọi pair của coin đó không? | Tin gắn với coin (BTC, ETH, SOL), không phải pair | Schema News, Sentiment strategy | Medium | [[8]](#ref-8) |
| <a id="oq-039"></a>OQ-039 | Crawl chạy liên tục ở nền và giữ trạng thái giữa các phiên không? | Start/Stop chỉ giữ trong trang; crawl chạy trong `apps/worker` [[7, Tech Stack]](#ref-7) | Job định kỳ trong worker | Medium | [[8]](#ref-8) |
| <a id="oq-040"></a>OQ-040 | "Refresh every" là chu kỳ crawl, hay chỉ là chu kỳ làm mới giao diện? | Có lựa chọn 1–5 phút | Job định kỳ trong worker | Medium | [[8]](#ref-8) |
| <a id="oq-041"></a>OQ-041 | Source type lọc nguồn hay là cấu hình crawl? Assets có lọc feed không? | Đổi giá trị không ảnh hưởng tới feed | News Provider | Medium | [[8]](#ref-8) |
| <a id="oq-042"></a>OQ-042 | Có cần xem tin cũ hơn 24 giờ, hoặc tìm theo từ khóa không? | Feed chỉ có 24 giờ | — | Low | [[8]](#ref-8) |
| <a id="oq-043"></a>OQ-043 | Quản lý phiên bản template extraction có thuộc phạm vi hiện tại không, hay đi cùng self-healing? | Restore và Apply có trong UI, không gắn với self-healing | — | Low | [[8]](#ref-8) |

## Auth & Settings

| ID | Câu hỏi | Điều đã biết | Chặn | Ưu tiên | Nguồn |
| --- | --- | --- | --- | --- | --- |
| <a id="oq-048"></a>OQ-048 | Có cho đổi email không? Có cần xác minh email mới không? | Ô Email sửa được nhưng không được lưu | API Settings | Medium | [[10]](#ref-10) |
| <a id="oq-049"></a>OQ-049 | Time zone ảnh hưởng tới thời gian nào: chart, tin, run, ngày "hôm nay" khi validate Backtest? "Hôm nay" tính theo time zone người dùng hay UTC? | Có lựa chọn Asia/Ho_Chi_Minh và UTC; prototype cố định "hôm nay" là 14/11/2026 | Lưu và hiển thị thời gian, validation Backtest | Medium | [[10]](#ref-10) [[4]](#ref-4) |
| <a id="oq-050"></a>OQ-050 | Đổi password có đăng xuất các thiết bị khác không? | Chưa thể hiện | Cấu hình session | Medium | [[10]](#ref-10) |
| <a id="oq-051"></a>OQ-051 | Nếu Google là cách đăng nhập duy nhất, có chặn Disconnect hoặc yêu cầu đặt password trước không? | Chuyển trạng thái ngay, không xác nhận | Luồng tài khoản liên kết | Medium | [[10]](#ref-10) |
| <a id="oq-052"></a>OQ-052 | Xóa tài khoản có cần nhập password, có thời gian chờ hoặc cách khôi phục không? Backtest và phiên Search đang chạy xử lý ra sao? | Xóa ngay sau khi gõ DELETE | API xóa tài khoản, worker | Medium | [[10]](#ref-10) |
| <a id="oq-053"></a>OQ-053 | Có cần thông báo "phiên đã hết hạn" riêng không? Dữ liệu đang nhập dở được xử lý thế nào? | Màn chặn có thông báo chung | — | Low | [[9]](#ref-9) |
| <a id="oq-055"></a>OQ-055 | Research defaults áp dụng cho form Backtest mới, cho Realtime, hay cả hai? Có áp dụng lại với form đang mở không? | Có Pair, Timeframe, Capital, Fee, Slippage trong Profile nhưng Backtest không đọc | — | Low | [[10]](#ref-10) |
| <a id="oq-056"></a>OQ-056 | Undo của "Sign out thiết bị khác" có thực hiện được không, hay cần hộp thoại xác nhận trước? | Có Undo trong toast | — | Low | [[10]](#ref-10) |
| <a id="oq-057"></a>OQ-057 | Email thông báo được gửi ngay hay gộp lại? Weekly research summary gồm nội dung gì? | Có toggle email nhưng chưa có luồng gửi | — | Low | [[10]](#ref-10) |
| <a id="oq-058"></a>OQ-058 | Export data xuất những dữ liệu nào, định dạng gì, giao cho người dùng bằng cách nào? | Chỉ có toast | — | Low | [[10]](#ref-10) |
| <a id="oq-059"></a>OQ-059 | Ảnh đại diện giới hạn định dạng, dung lượng, cách crop thế nào? | Chọn được file nhưng không lưu | — | Low | [[10]](#ref-10) |

## Workspace & Public pages

| ID | Câu hỏi | Điều đã biết | Chặn | Ưu tiên | Nguồn |
| --- | --- | --- | --- | --- | --- |
| <a id="oq-060"></a>OQ-060 | Thông báo có phụ thuộc tùy chọn trong Settings › Notifications không? Có cần thông báo qua email không? | Backtest tạo thông báo khi kết thúc; Discovery tạo khi phiên kết thúc lúc màn Discovery đang mở | Notifications | Medium | [[6]](#ref-6) |
| <a id="oq-062"></a>OQ-062 | "Discovery found a better candidate" và "Extraction template updated" có thật không, và khi nào thì phát ra? | Hai thông báo này là dữ liệu cố định | — | Low | [[6]](#ref-6) |
| <a id="oq-063"></a>OQ-063 | Trang chân trang nào cần có ở bản đầu và nội dung lấy từ đâu? | Terms, Privacy Policy, Risk disclosure trỏ `#`; Documentation và System status ghi "planned"; Support và Social ghi "not configured" | — | Low | [[11]](#ref-11) |
| <a id="oq-064"></a>OQ-064 | Khách chưa đăng nhập vào URL không tồn tại thì thấy 404 hay được đưa về Landing? | Trang 404 có link vào workspace | — | Low | [[11]](#ref-11) |
| <a id="oq-065"></a>OQ-065 | "Try again" trên 404 có nên tải lại URL vừa lỗi thay vì mở Realtime không? | Nút này mở Realtime | — | Low | [[11]](#ref-11) |
| <a id="oq-075"></a>OQ-075 | Khi tải hoặc làm mới dữ liệu thất bại (Library, Runs, News feed), màn hình nào giữ dữ liệu cũ và giữ trong bao lâu? Retry chỉ do người dùng bấm, hay hệ thống tự thử lại? | Prototype có pattern hiển thị cho lỗi tải, dữ liệu cũ được giữ lại và offline, kèm nút Retry; chưa có quy tắc retry | Xử lý lỗi API ở frontend | Low | [[14]](#ref-14) |
| <a id="oq-076"></a>OQ-076 | Người dùng chọn theme sáng/tối thế nào: theo cài đặt hệ thống, tự chọn trong Settings, hay cả hai? Lựa chọn lưu theo tài khoản hay theo trình duyệt? | Prototype chỉ có theme tối và Settings không có tùy chọn theme. `apps/web` có token cho cả hai theme, mặc định là theme tối | UI chọn theme, lưu lựa chọn theme | Low | [[10]](#ref-10) |
| <a id="oq-081"></a>OQ-081 | Kết quả backtest minh họa trên Landing lấy từ đâu: số cố định ghi rõ là minh họa, hay một sample run thật do `packages/engine` chạy trên dữ liệu lịch sử Binance rồi lưu thành snapshot tĩnh để prerender? Nếu dùng sample run thật thì chọn strategy, pair, timeframe, khoảng ngày, phí và slippage nào? | Landing đang hiển thị số cố định chuyển từ prototype (ví dụ +8.42%, 61.80%, 110 of 178 trades) kèm nhãn "Example" và caption nói đây không phải kết quả đã kiểm chứng. Đề xuất sample run thật chưa được chốt | Nội dung khối Backtest result trên Landing, nhãn "Example" | Low | [[11]](#ref-11) |

## Testing

| ID | Câu hỏi | Điều đã biết | Chặn | Ưu tiên | Nguồn |
| --- | --- | --- | --- | --- | --- |
| <a id="oq-066"></a>OQ-066 | Backtest một candidate trên bộ nến cố định được phép mất tối đa bao lâu? | Benchmark là loại test cho R-12 | Tiêu chí vào/ra của benchmark | Medium | [[2]](#ref-2) |
| <a id="oq-067"></a>OQ-067 | Bao nhiêu client WebSocket và bao nhiêu job đồng thời là mục tiêu của load test? | Load test là loại test cho R-12. Đã chốt cho Market Data: mục tiêu số client đồng thời kèm điều kiện dữ liệu đúng, độ trễ và giới hạn kết nối nguồn nằm tại kịch bản tải đồng thời (QA-15), product owner duyệt ngày 2026-11-23; phần số job backtest đồng thời chưa chốt [[17, Scalability và Performance]](#ref-17) | Kịch bản load test cho backtest job | Medium | [[2]](#ref-2) [[17]](#ref-17) |
| <a id="oq-068"></a>OQ-068 | Loại test nào chạy trên mỗi commit, loại nào chạy định kỳ? | Tiêu chí vào/ra đang là Proposed | Pipeline CI | Medium | [[2]](#ref-2) [[12]](#ref-12) |

## Resolved & Dropped

| ID | Câu hỏi | Trạng thái | Kết quả | Ghi tại |
| --- | --- | --- | --- | --- |
| <a id="oq-087"></a>OQ-087 | Giới hạn số tab Realtime nhận cập nhật trực tiếp đồng thời trên mỗi tài khoản là bao nhiêu, và tab vượt giới hạn hiển thị hành vi nào (cảnh báo và tạm dừng, chuyển sang làm mới thủ công, hay ngắt tab cũ nhất)? | Resolved | Tối đa 4 tab đồng thời mỗi tài khoản; tab vượt giới hạn nhận cảnh báo và dừng tự kết nối lại mà không ngắt các tab đang mở (MK-142). Product owner duyệt ngày 2026-11-23 | [[16, Theo dõi cập nhật trực tiếp]](#ref-16) [[15, Quyết định]](#ref-15) |
| <a id="oq-035"></a>OQ-035 | Có báo mất kết nối khi người dùng đã tạm dừng Live không? | Resolved | Giữ trạng thái tạm dừng và không hiện cảnh báo mất kết nối; kết nối lại và đồng bộ khi người dùng chọn tiếp tục (MK-108). Product owner duyệt ngày 2026-11-23 | [[16, Theo dõi cập nhật trực tiếp]](#ref-16) |
| <a id="oq-032"></a>OQ-032 | "Load 1,000 past candles" áp dụng cho một chart hay tất cả, và có giới hạn không? | Dropped | Product owner bỏ thao tác tải thêm lịch sử khỏi Realtime | [[16, Xem lịch sử thị trường]](#ref-16) |
| <a id="oq-085"></a>OQ-085 | Khi cập nhật trực tiếp thêm nến mới, chart giữ cố định 500 nến gần nhất hay số nến tăng dần? | Resolved | Giữ 500 nến gần nhất sau mỗi lần làm mới; nến cũ nhất rời chart khi có nến mới. Product owner duyệt ngày 2026-11-22. Vòng WebSocket xét lại nếu cách cập nhật khác | [[16, Theo dõi cập nhật định kỳ]](#ref-16) |
| <a id="oq-082"></a>OQ-082 | Khi chưa đủ nến cho MA(20), hiển thị thế nào? Nến đang mở có được tính vào mẫu không? | Resolved | Không vẽ điểm MA thiếu mẫu, hiển thị chưa đủ dữ liệu. MA phủ mọi nến đang hiển thị khi lịch sử đủ. Nến đang mở được tính, điểm MA của nó có nhãn giá trị tạm | [[16, Xem lịch sử thị trường]](#ref-16) |
| <a id="oq-083"></a>OQ-083 | MA và volume của sidebar theo chart nào? Volume là nến cuối hay cả vùng, dùng đơn vị base hay quote? | Resolved | Sidebar không hiển thị MA và volume. Mỗi chart hiển thị MA và volume của chính nó. Volume theo base asset | [[16, Xem lịch sử thị trường]](#ref-16) |
| <a id="oq-084"></a>OQ-084 | Lịch sử có bao gồm nến đang mở không? Người dùng phân biệt nến đang mở với nến đã đóng thế nào? | Resolved | Lịch sử gồm nến đang mở, có nhãn chữ “đang mở”. Màn hình hiển thị thời điểm dữ liệu | [[16, Xem lịch sử thị trường]](#ref-16) |
| <a id="oq-070"></a>OQ-070 | Run backtest chạy ở server hay chỉ trong trình duyệt? Run có tiếp tục sau khi Sign out không? | Resolved | Chạy ở server trong `apps/worker` qua `pg-boss`, nên run tiếp tục sau khi Sign out | [[7, Tech Stack]](#ref-7) |
| <a id="oq-071"></a>OQ-071 | Có mở bài gốc không? Có lưu toàn văn không? | Resolved | Có. Schema News gồm `content` và `url` | [[13, §14]](#ref-13) |
| <a id="oq-072"></a>OQ-072 | Khi đăng nhập trên thiết bị khác, dữ liệu nào cần đồng bộ? | Resolved | Library, Runs và Notifications lưu trong PostgreSQL nên đồng bộ theo tài khoản. Bản nháp của Strategy Engine và Composite builder vẫn lưu trong trình duyệt | [[7, Tech Stack]](#ref-7) [[3, Bản nháp]](#ref-3) |
| <a id="oq-073"></a>OQ-073 | Mọi run Completed dùng chung một bộ kết quả mẫu | Dropped | Đây là dữ liệu minh họa của prototype, không phải câu hỏi sản phẩm | [[4]](#ref-4) |
| <a id="oq-061"></a>OQ-061 | "Leave without saving?" có cần chặn link trong nội dung trang và nút Back của trình duyệt không? | Resolved | Hộp thoại chặn mọi điều hướng trong ứng dụng ra khỏi Settings; Back/Forward, đóng tab và tải lại trang dùng cảnh báo của trình duyệt | [[10, Lưu Profile]](#ref-10) [[6, Rời trang khi còn thay đổi chưa lưu]](#ref-6) |
| <a id="oq-074"></a>OQ-074 | Lỗi sai thông tin kích hoạt bằng password `wrongpass`; link reset dùng nút preview | Dropped | Đây là trigger demo của prototype, không phải yêu cầu | [[9]](#ref-9) |
| <a id="oq-044"></a>OQ-044 | Số lần thử sai, thời gian khóa và cách mở khóa? | Resolved | Giới hạn 5 lần Sign in trong 15 phút theo địa chỉ IP, không khóa theo tài khoản; hết thời gian thì tự mở khóa | [[9, Sign in]](#ref-9) |
| <a id="oq-045"></a>OQ-045 | Phiên có thời hạn bao lâu khi bật và khi tắt "Keep me signed in"? | Resolved | Bật: 7 ngày, tự gia hạn khi dùng. Tắt: kết thúc khi đóng trình duyệt | [[9, Sign in]](#ref-9) |
| <a id="oq-046"></a>OQ-046 | Google sign-in có tạo tài khoản mới nếu email chưa tồn tại không? Có cần bước Verify không? | Resolved | Có tạo tài khoản mới, không cần bước Verify | [[9, Sign in]](#ref-9) |
| <a id="oq-047"></a>OQ-047 | Link reset password có hiệu lực bao lâu và dùng được mấy lần? | Resolved | 1 giờ, dùng một lần; đặt password mới thì đăng xuất mọi phiên cũ | [[9, Reset password]](#ref-9) |
| <a id="oq-054"></a>OQ-054 | Đã đăng nhập mà mở Auth thì chuyển thẳng vào workspace hay hiện "đang đăng nhập với …"? | Resolved | Chuyển thẳng tới đích theo quy tắc chuyển tiếp | [[9, Chuyển tiếp sau khi đăng nhập]](#ref-9) |
| <a id="oq-069"></a>OQ-069 | Chốt công cụ testing nào trong danh sách Proposed? | Resolved | `Vitest` cho unit và integration test, `Playwright` cho E2E. Các công cụ còn lại vẫn là Proposed | [[7, Tech Stack]](#ref-7) [[2, Công cụ]](#ref-2) |
| <a id="oq-077"></a>OQ-077 | Continue with Google bằng email đã có tài khoản email/password thì xử lý thế nào? Nếu tài khoản đó chưa xác minh email thì sao? | Resolved | Tài khoản đã xác minh thì liên kết Google vào tài khoản đó. Chưa xác minh thì không đăng nhập, Auth báo email đã được đăng ký và gợi ý Sign in hoặc Reset password | [[9, Sign in]](#ref-9) |
| <a id="oq-078"></a>OQ-078 | Giới hạn Sign in theo ngưỡng nào, đếm lần sai hay mọi lần bấm, và tính theo IP, theo tài khoản hay cả hai? | Resolved | Dùng mặc định của Better Auth: 3 request/10 giây theo IP, đếm mọi lần bấm, không khóa theo tài khoản | [[9, Sign in]](#ref-9) [[15, Giới hạn số lần đăng nhập]](#ref-15) |
| <a id="oq-079"></a>OQ-079 | Gửi link xác minh, gửi link reset và Create account được giới hạn bao nhiêu lần? Có cần giới hạn theo email để chặn việc spam email vào hộp thư người khác không? | Resolved | Hiện tại dùng mặc định của Better Auth theo IP. Trước khi deploy public thêm giới hạn 3 email/địa chỉ/giờ, giới hạn tổng theo ngày thấp hơn quota kèm cảnh báo, và dọn tài khoản chưa xác minh sau 7 ngày | [[15, Giới hạn gửi email]](#ref-15) |
| <a id="oq-080"></a>OQ-080 | Có chốt các hành vi chỉ có trong code (nội dung lỗi, thời điểm báo lỗi, giới hạn độ dài, tải lại Check your email, mở link reset khi đang đăng nhập, lỗi server) làm requirement không? | Resolved | Chốt cả 6 hành vi; thêm Full name tối đa 100 ký tự, password 8–128 ký tự | [[9]](#ref-9) |

## References

1. <a id="ref-1"></a>[Discovery](design/prototype/docs/requirements/discovery.md)
2. <a id="ref-2"></a>[Test Strategy](testing/test-strategy.md)
3. <a id="ref-3"></a>[Strategy Engine và Strategy library](design/prototype/docs/requirements/strategy-engine.md)
4. <a id="ref-4"></a>[Backtest](design/prototype/docs/requirements/backtest.md)
5. <a id="ref-5"></a>[Realtime](design/prototype/docs/requirements/realtime.md)
6. <a id="ref-6"></a>[Workspace](design/prototype/docs/requirements/workspace.md)
7. <a id="ref-7"></a>[Project: Crypto Force](../CLAUDE.md)
8. <a id="ref-8"></a>[News](design/prototype/docs/requirements/news.md)
9. <a id="ref-9"></a>[Authentication](UCs/authentication.md)
10. <a id="ref-10"></a>[Settings](design/prototype/docs/requirements/settings.md)
11. <a id="ref-11"></a>[Public pages](design/prototype/docs/requirements/public-pages.md)
12. <a id="ref-12"></a>[CI/CD](development/cicd.md)
13. <a id="ref-13"></a>[Project Brief](UCs/sources/project-brief.md)
14. <a id="ref-14"></a>[Crypto Force UI Prototype](design/prototype/README.md)
15. <a id="ref-15"></a>[Security](architecture/23-security.md)

16. <a id="ref-16"></a>[Market Data](UCs/market-data.md)
17. <a id="ref-17"></a>[Quality Attributes](UCs/quality-attributes.md)
