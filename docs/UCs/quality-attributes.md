# Quality Attributes

Đọc file này để biết các yêu cầu chất lượng toàn hệ thống của Crypto Force dưới dạng quality attribute scenario có số đo.

Mỗi scenario gồm sáu phần: nguồn kích thích, kích thích, môi trường, artifact, phản hồi và số đo [[1, §3.8]](#ref-1). Các thuộc tính lấy từ Architectural Drivers của đề bài [[2, §17]](#ref-2) và scenario kiểm tra kiến trúc [[2, §26]](#ref-2). Đề bài không cho con số cho phần lớn các thuộc tính. Số đo ở các scenario dưới đây do agent đề xuất và chốt theo ủy quyền của product owner ngày 2026-11-20; cột Nguồn ghi lý do của từng con số để product owner có thể phủ quyết.

## Modifiability

Growth scenario: thay đổi dự kiến của hệ thống.

| ID | Nguồn kích thích | Kích thích | Môi trường | Artifact | Phản hồi | Số đo | Nguồn | Trạng thái |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| QA-01 | Developer | Thêm Strategy MACD | Lúc phát triển, đã có MA, RSI, Bollinger, Support/Resistance | Strategy engine | MACD dùng được trong backtest, composite và Search mà không sửa code của backtest, evaluation, Search, API hay UI | 0 file production thay đổi ngoài file của Strategy mới và 1 chỗ đăng ký Strategy | Đề bài [[2, §17, §26]](#ref-2); số đo do agent đề xuất, theo hình mẫu "implements Strategy + register" của đề bài | Confirmed (theo ủy quyền của product owner, 2026-11-20) |
| QA-02 | Developer | Thêm cách sinh candidate mới (Domain-guided, Genetic) bên cạnh Random Search | Lúc phát triển | Strategy Search | Backtest và Leaderboard nhận candidate mới mà không cần biết candidate được sinh thế nào | 0 file thay đổi trong backtest và Leaderboard | Đề bài [[2, §17, §26]](#ref-2); số đo do agent đề xuất, từ yêu cầu "Backtester vẫn giữ nguyên" | Confirmed (theo ủy quyền của product owner, 2026-11-20) |
| QA-09 | Developer | Thêm provider dữ liệu thị trường thứ hai bên cạnh Binance | Lúc phát triển, Realtime đã hiển thị lịch sử nến từ Binance | Market Data | Realtime hiển thị lịch sử nến từ provider mới với cùng dữ liệu nến mà frontend đang nhận | 0 file frontend thay đổi | Đề bài [[2, §4]](#ref-2) yêu cầu thêm adapter mà frontend không phải thay đổi | Confirmed (theo ủy quyền của product owner, 2026-11-20) |

## Scalability và Performance

| ID | Nguồn kích thích | Kích thích | Môi trường | Artifact | Phản hồi | Số đo | Nguồn | Trạng thái |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| QA-03 | Strategy Search | Gửi 10.000 candidate cần backtest, mỗi candidate mất 2 giây với một worker | Vận hành bình thường | Backtest | Thêm worker làm tổng thời gian giảm theo số worker | Tổng thời gian với N worker không quá 1,2 × 20.000 / N giây, với N từ 1 tới 8 | Đề bài [[2, §26]](#ref-2) cho 2 giây và 10.000 candidate; hệ số 1,2 và N ≤ 8 do agent đề xuất để chừa 20% overhead cho queue và ghi kết quả | Confirmed (theo ủy quyền của product owner, 2026-11-20) |
| QA-04 | Người dùng | Chạy backtest cho 1.000 strategy | Vận hành bình thường | Backtest | Backtest chạy song song qua job queue, giao diện vẫn dùng được trong lúc chạy | Phản hồi của API cho người dùng khác dưới 500 ms ở percentile 95 trong lúc chạy | Đề bài [[2, §17]](#ref-2) cho 1.000 strategy; 500 ms do agent đề xuất, là ngưỡng mà thao tác trên giao diện vẫn được cảm nhận là liền mạch | Confirmed (theo ủy quyền của product owner, 2026-11-20) |
| QA-10 | Người dùng | Mở Realtime với lựa chọn mặc định 4 chart | Vận hành bình thường, chưa có cập nhật trực tiếp | Market Data và Realtime | Cả 4 chart hiển thị lịch sử nến, volume và MA | Dưới 2 giây ở percentile 95, đo từ lúc mở Realtime tới lúc chart cuối cùng hiển thị nến | Agent đề xuất: 4 chart × 500 nến là một lần tải nhỏ; điều kiện kết luận nằm trong [Ngưỡng và quyền kết luận](../testing/test-scopes/TS-002-market-data/rest-verification.md#ngưỡng-và-quyền-kết-luận) | Confirmed (product owner, 2026-11-21) |
| QA-11 | Người dùng | Đổi timeframe của một chart | Vận hành bình thường, chưa có cập nhật trực tiếp | Market Data và Realtime | Chart đó hiển thị lịch sử theo timeframe mới, các chart khác giữ dữ liệu | Dưới 1 giây ở percentile 95, đo từ lúc chọn timeframe tới lúc chart hiển thị nến mới | Agent đề xuất: chỉ một chart tải lại; điều kiện kết luận nằm trong [Ngưỡng và quyền kết luận](../testing/test-scopes/TS-002-market-data/rest-verification.md#ngưỡng-và-quyền-kết-luận) | Confirmed (product owner, 2026-11-21) |
| QA-13 | Người dùng | 1, 10 hoặc 50 client mở Realtime với lựa chọn mặc định và cập nhật định kỳ đang bật, kể cả khi Binance trả lỗi | Vòng cập nhật định kỳ, hệ thống chạy trên một máy chủ | Market Data | Số request tới Binance không tăng theo số client | Không quá 504 request weight của Binance mỗi phút, đo theo request weight mà Binance nhận từ hệ thống trong mỗi phút của lượt đo | Agent đề xuất: mức trần khi mọi pair và timeframe của Realtime đều được xem [[4, ADR-006]](#ref-4), khoảng 8% giới hạn 6000 weight mỗi phút của Binance [[3]](#ref-3); giữ mức trần cả khi Binance lỗi nhờ quyết định giữ lỗi nguồn trong thời gian sống của cache (ADR-008) [[4]](#ref-4) | Confirmed (product owner, 2026-11-22) |

## Realtime

| ID | Nguồn kích thích | Kích thích | Môi trường | Artifact | Phản hồi | Số đo | Nguồn | Trạng thái |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| QA-05 | Binance | Có candle hoặc giá mới | Vận hành bình thường, người dùng đang mở Realtime cho pair và timeframe đó | Luồng Market Data → Indicator → Strategy → UI | Chart, indicator và signal trên màn hình cập nhật | Dưới 1 giây ở percentile 95, đo từ lúc nhận event của Binance tới lúc màn hình hiện dữ liệu mới | Đề bài [[2, §17]](#ref-2) yêu cầu "độ trễ thấp"; 1 giây do agent đề xuất, vì candle nhỏ nhất của Binance là 1 giây | Confirmed (theo ủy quyền của product owner, 2026-11-20) |
| QA-12 | Binance | Có giá hoặc nến mới | Vòng cập nhật định kỳ, cập nhật đang bật, tab đang hiện, nguồn trả lời bình thường | Market Data và Realtime | Chart hiển thị dữ liệu mới ở lần làm mới sau đó | Dưới 11 giây ở percentile 95, đo từ lúc nguồn tham chiếu có dữ liệu mới tới lúc chart vẽ dữ liệu đó | Agent đề xuất: chu kỳ làm mới 5 giây (MK-63) cộng 5 giây dữ liệu được dùng lại [[4, ADR-006]](#ref-4) cộng 1 giây cho response và vẽ. QA-05 áp dụng cho vòng cập nhật trực tiếp; vòng cập nhật định kỳ là baseline để so sánh | Confirmed (product owner, 2026-11-22) |

## Reliability

Exploratory scenario: áp lực ngoài dự kiến.

| ID | Nguồn kích thích | Kích thích | Môi trường | Artifact | Phản hồi | Số đo | Nguồn | Trạng thái |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| QA-06 | Binance | Kết nối WebSocket bị đóng | Vận hành bình thường | Market data | Hệ thống báo mất kết nối, tự kết nối lại, lấy lại candle bị thiếu | Kết nối lại trong 30 giây; 0 candle bị thiếu sau khi kết nối lại | Đề bài [[2, §17]](#ref-2) hỏi reconnect và việc mất candle; 30 giây do agent đề xuất, ngắn hơn khung 1 phút nhỏ nhất mà người dùng thường xem | Confirmed (theo ủy quyền của product owner, 2026-11-20) |
| QA-07 | Worker | Một job backtest lỗi giữa chừng | Vận hành bình thường | Backtest job | Job được đánh dấu lỗi hoặc chạy lại; job khác không bị ảnh hưởng | 0 job khác thất bại do job lỗi | Đề bài [[2, §17]](#ref-2); số đo do agent đề xuất | Confirmed (theo ủy quyền của product owner, 2026-11-20) |

## Observability

| ID | Nguồn kích thích | Kích thích | Môi trường | Artifact | Phản hồi | Số đo | Nguồn | Trạng thái |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| QA-08 | Người vận hành | Hỏi trạng thái của Continuous Strategy Loop | Vận hành bình thường | Search loop | Thấy loop đang chạy hay dừng, số strategy đã thử, thời gian backtest, số job lỗi, strategy đứng Top 1 | 5 chỉ số, mỗi chỉ số cũ tối đa 10 giây | Đề bài [[2, §17]](#ref-2) liệt kê 5 chỉ số; 10 giây do agent đề xuất | Confirmed (theo ủy quyền của product owner, 2026-11-20) |

## References

1. <a id="ref-1"></a>M. Barbacci và cộng sự, *Quality Attribute Workshops (QAWs), Third Edition*, CMU/SEI-2003-TR-016, Software Engineering Institute, 2003. <https://www.sei.cmu.edu/library/quality-attribute-workshops-qaws-third-edition/>
2. <a id="ref-2"></a>[Project Brief](sources/project-brief.md)
3. <a id="ref-3"></a>Binance Spot API, General API Information (Limits), đọc ngày 2026-11-20. <https://developers.binance.com/docs/binance-spot-api-docs/rest-api/limits>
4. <a id="ref-4"></a>[Architectural Decisions](../architecture/30-decisions.md)
