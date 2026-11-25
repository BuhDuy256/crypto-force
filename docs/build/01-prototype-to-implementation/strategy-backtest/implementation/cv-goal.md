# Mục tiêu Kiến thức và CV cho Strategy và Backtest

Đọc file này để biết mục tiêu kiến thức kỹ thuật, câu chuyện giá trị cho CV, các chỉ số cần đo và bằng chứng dự kiến khi triển khai Strategy và Backtest.

## Định hướng câu chuyện giá trị

Market Data chứng minh năng lực xử lý luồng I/O thời gian thực (WebSocket fan-out, chia sẻ subscription, tự kết nối lại và bù nến thiếu). Strategy và Backtest tập trung vào nửa còn lại của bài toán kỹ thuật trong Project Brief [[1, §24 và §25]](#ref-1) với **3 khía cạnh kiến trúc cốt lõi**:

- **Modifiability & Extensibility:** Tách lõi `packages/engine` thuần tính toán (zero I/O) với Plugin/Registry và 4 lớp độc lập (`Indicator → Strategy/Composite → Trade Simulator → Evaluator`), cho phép thêm strategy mới mà không sửa Backtester, Evaluator, Worker hay API [[1, §6 và §24]](#ref-1).
- **Correctness, Determinism & Reproducibility:** Bảo đảm kết quả tất định, chống look-ahead bias, khóa bất biến kế toán (`Gross P/L - Fee - Slippage = Net P/L`), tính bằng `float64` nhưng lưu `NUMERIC`, và đóng băng **immutable run snapshot** để sửa hoặc xóa strategy trong Library không làm đổi lịch sử run [[1, §21]](#ref-1) [[3, Snapshot cấu hình của run]](#ref-3).
- **CPU Isolation & Async Job Reliability:** Tách tính toán CPU-bound khỏi Express API sang `apps/worker` chạy trong `worker_threads`, kết hợp state machine chặt (`Queued → Running → Completed | Failed | Cancelled`), chặn chạy chồng nhiều backtest thủ công [[3, Khi đã có backtest đang chạy]](#ref-3), cooperative cancellation và phục hồi khi worker dừng đột ngột.

Các bài toán hàng đợi tải cao hàng nghìn job/phút, cache dataset nến dùng chung nhiều worker và bảng xếp hạng Top-K thời gian thực (nơi Redis phát huy giá trị trực tiếp) thuộc phạm vi **Discovery và Continuous Loop**, không gượng ép đưa vào Strategy và Backtest. Ghép các phần lại, dự án chứng minh năng lực thiết kế theo từng bài toán thật trên cả hai trục: **I/O-bound realtime** và **CPU-bound async compute**.

## Đóng góp cho kiến thức kỹ thuật

| Trụ cột kiến thức | Bản chất kỹ thuật cần nắm vững | Cách hiện thực hóa trong Strategy và Backtest | Bằng chứng dự kiến trong repo |
| --- | --- | --- | --- |
| **Kiến trúc Plugin và Pure Core (OCP)** | Tách lõi nghiệp vụ thuần tính toán (không I/O, không đồng hồ hệ thống, không ngẫu nhiên không kiểm soát) khỏi lớp hạ tầng API, database và queue [[1, §6 và §27]](#ref-1). | `packages/engine` tách 4 lớp: `Indicators`, `Strategies` qua Registry, `Backtester` và `Evaluator`. Thêm strategy mới chỉ cần cài đặt interface và đăng ký vào Registry, không sửa Backtester, Worker hay API. | `docs/architecture/11-strategy.md` đến `14-evaluation.md`, code trong `packages/engine`, và diff kiểm chứng thêm strategy thứ năm. |
| **Độ đúng của mô phỏng tài chính** | Tránh các lỗi làm sai lệch kết quả backtest: **look-ahead bias** (dùng dữ liệu tương lai tại thời điểm ra quyết định), xử lý sai thứ tự Stop Loss và Take Profit trong cùng cây nến, và sai số cộng dồn dấu phẩy động. | Tại nến `t`, strategy chỉ nhận dữ liệu tới nến `t`. Engine tính bằng `float64` để giữ tốc độ tìm kiếm, còn database lưu giá, phí và P/L bằng kiểu `NUMERIC`. Khóa chặt bất biến kế toán `Gross P/L - Fee - Slippage = Net P/L`. | Golden tests tính tay và property-based tests trong `packages/engine/test/`. |
| **Thực thi bất đồng bộ và cô lập CPU** | Không chạy tính toán nặng trên event loop của Express hoặc luồng chính của worker để tránh làm chậm API và làm đứt heartbeat hàng đợi. | API xác thực đầu vào, tạo snapshot run, đẩy job vào `pg-boss` và trả phản hồi sớm. `apps/worker` chạy `packages/engine` trong `worker_threads` kèm timeout, cooperative cancellation và phục hồi khi worker dừng đột ngột [[1, §12 và §17]](#ref-1). | `apps/worker/src/jobs/`, `docs/architecture/20-state-machine.md`, và integration tests cho cancel, timeout và retry. |
| **Khả năng tái lập (Reproducibility)** | Thiết kế dữ liệu sao cho lịch sử thí nghiệm giữ nguyên giá trị kiểm chứng ngay cả khi định nghĩa gốc trong thư viện bị sửa, đổi tên hoặc xóa [[1, §21]](#ref-1) [[3, Snapshot cấu hình của run]](#ref-3). | Mỗi bản ghi `backtest_runs` lưu **immutable snapshot** gồm toàn bộ rules, tham số, phiên bản strategy và cấu hình chạy tại thời điểm kích hoạt. | `docs/architecture/21-database.md`, Drizzle schema trong `apps/api`, và integration tests kiểm tra sửa/đổi tên/xóa strategy không làm đổi run cũ. |
| **Kiểm chứng và tối ưu hiệu năng CPU** | Dùng kiểm thử bất biến để bắt lỗi logic khó thấy và profiling để tìm bottleneck thuật toán trước khi mở rộng sang tìm kiếm nhiều tổ hợp. | Chạy benchmark trên bộ nến cố định, đo thông lượng đơn luồng và đa luồng, so sánh độ trễ API khi có và không có tải backtest đồng thời. | Script benchmark tái lập được và báo cáo kết quả trong `docs/testing/evidence/`. |

## Các chỉ số, cách đo và giá trị cho CV

> Các chỉ số dưới đây là kế hoạch đo, chưa phải kết quả đã đạt. Ngưỡng chấp nhận được chốt trước khi đo. Chỉ đưa số liệu đã đo và có bằng chứng lưu trong repo vào CV.
>
> Mức độ giá trị là đánh giá đề xuất cho CV Developer của dự án này. **Rất cao**: chứng minh năng lực tính toán, cô lập tải hoặc độ đúng cốt lõi của hệ thống. **Cao**: chứng minh chất lượng kiến trúc và độ tin cậy vận hành. **Bổ trợ**: làm rõ trải nghiệm người dùng cuối.

| Chỉ số | Mức độ giá trị cho CV | Cách đo | Giá trị thể hiện trong CV |
| --- | --- | --- | --- |
| **Thời gian chạy một backtest và thông lượng nến** | Rất cao | Đo thời gian thực thi p50/p95 (ms) và số nến xử lý mỗi giây trên bộ nến lịch sử cố định (ví dụ 50.000 đến 100.000 nến) với cấu hình máy và bộ strategy được ghi rõ. | Năng lực tối ưu thuật toán tính indicator và mô phỏng giao dịch trên CPU |
| **Cô lập CPU và độ ổn định API khi chạy backtest** | Rất cao | Chạy các job backtest trên bộ nến lớn qua `pg-boss` và `worker_threads` đồng thời với tải đọc/ghi tới API. Đo API HTTP p95 latency và event-loop lag trước/trong khi chạy backtest. | Khả năng tách tải CPU-bound khỏi đường request chính để giữ API và WebSocket ổn định |
| **Độ đúng mô phỏng và chống look-ahead bias** | Rất cao | Chạy bộ golden tests (so với kết quả tính tay với sai số cho phép đã chốt) và property-based tests kiểm tra tính tất định 100%, không đổi tín hiệu tại nến `t` khi thay đổi mọi nến sau `t`, và cân bằng kế toán P/L. | Kỷ luật kỹ thuật và độ tin cậy của logic tài chính |
| **Chi phí thay đổi khi mở rộng strategy (OCP)** | Cao | Thực hiện bài kiểm chứng thêm một strategy mới (ví dụ `MACDStrategy` sau bốn strategy ban đầu) và thống kê số file lõi bị sửa ở Backtester, Evaluator, Worker và API. | Khả năng thiết kế kiến trúc mở rộng thực chất, có thể kiểm tra bằng diff |
| **Độ tin cậy vòng đời job (Cancel và Recovery)** | Cao | Kiểm tra tự động việc hủy run đang chạy (cooperative cancellation), ngăn chạy chồng nhiều backtest thủ công cùng lúc [[3, Khi đã có backtest đang chạy]](#ref-3), và phục hồi trạng thái khi worker dừng giữa chừng. | Khả năng xử lý race condition và độ bền vận hành của hệ thống bất đồng bộ |
| **Tính toàn vẹn snapshot lịch sử** | Cao | Chạy integration test sửa nội dung, đổi tên và xóa strategy trong Strategy Library [[2, Sửa một item trong Library]](#ref-2) rồi kiểm tra lại chi tiết và khả năng chạy lại của các run đã lưu. | Tư duy mô hình hóa dữ liệu cho audit và tái lập kết quả |
| **Độ trễ cập nhật tiến trình tới giao diện** | Bổ trợ | Đo thời gian từ khi worker phát sự kiện tiến trình tới khi chip tiến trình trên App Header nhận cập nhật qua WebSocket. | Hoàn thiện trải nghiệm theo dõi tác vụ nền theo thời gian thực |

> Khi so sánh trước và sau tối ưu, giữ cố định bộ nến đầu vào, cấu hình máy, bộ strategy và tham số phí/slippage. Không dựng phiên bản cố tình chậm để tạo tỷ lệ cải thiện. Ghi rõ kết quả đến từ benchmark có kiểm soát, không gán nhãn như số liệu người dùng production.

## Mẫu dòng trong CV

Áp dụng nguyên tắc viết bullet ngắn gọn, ưu tiên kết quả và cơ chế tạo ra kết quả (Action → Context → End result) trong khoảng 1–2 dòng [[4]](#ref-4) [[5]](#ref-5) [[6]](#ref-6). Dự án Crypto Force trên CV chỉ nên chọn tổng cộng 3–4 bullet, trong đó Strategy và Backtest đóng góp **1–2 bullet** tập trung vào hiệu năng tính toán bất đồng bộ và kiến trúc mở rộng.

> Các câu dưới đây là mẫu viết dự kiến, chưa phải thành tích đã đạt. Thay các biến trong `{...}` bằng kết quả đo đã kiểm chứng trong repo trước khi dùng.

- **CPU isolation và compute performance:** Built a deterministic, zero-I/O backtesting engine and async `pg-boss` + `worker_threads` execution pipeline with cooperative cancellation, processing {N} historical candles per run in {T} ms (p95) while keeping API p95 latency under {L} ms under concurrent backtest load.
- **Extensibility và correctness:** Architected a plugin-based strategy and trade-simulation engine with immutable run snapshots and zero look-ahead bias guarantees, enabling new indicator strategies to be registered with zero changes to core backtesting or API layers, verified by {K} golden and property-based tests.
- **Async lifecycle và full-stack integration:** Engineered an end-to-end backtest workflow with versioned strategy snapshots, cooperative job cancellation, real-time WebSocket progress streaming, and interactive trade/drawdown visualization.

## Giá trị ngoài chỉ số (Câu chuyện kiến trúc khi phỏng vấn)

| Chủ đề phỏng vấn | Lập luận kỹ thuật và trade-off có thể trình bày | Bằng chứng nên chuẩn bị |
| --- | --- | --- |
| **Vì sao chọn `pg-boss` trên PostgreSQL thay vì thêm Redis và BullMQ ngay** | Giảm số thành phần hạ tầng cần vận hành, đồng bộ vòng đời dữ liệu giữa bảng `backtest_runs` và hàng đợi job trên cùng PostgreSQL; chỉ chuyển sang BullMQ khi đo được `pg-boss` là bottleneck. | ADR trong `docs/architecture/30-decisions.md` kèm điều kiện xem xét lại. |
| **Vì sao tách `packages/engine` không có I/O** | Cho phép chạy kiểm thử logic trong vài trăm mili-giây không cần database, chạy an toàn bên trong `worker_threads`, và tái sử dụng nguyên khối cho Backtest, Discovery và Realtime Signals [[1, §24]](#ref-1). | Sơ đồ phụ thuộc workspace, quy tắc ESLint boundary và test tốc độ cao của engine. |
| **Vì sao tính bằng `float64` nhưng lưu `NUMERIC`** | Cân bằng giữa tốc độ CPU khi quét nhiều tổ hợp chiến lược và độ chính xác lưu trữ tài chính; kiểm soát sai số làm tròn ở ranh giới hiển thị và bằng các bất biến kế toán. | ADR, schema Drizzle kiểu `NUMERIC` và bộ test kiểm tra sai số cho phép. |
| **Vì sao lưu Immutable Snapshot thay vì chỉ giữ khóa ngoại tới Strategy** | Sửa hoặc xóa strategy trong Library không làm thay đổi lịch sử kết quả backtest; giao diện chỉ rõ phiên bản strategy đã dùng tại thời điểm chạy [[1, §21]](#ref-1) [[3, Snapshot cấu hình của run]](#ref-3). | ERD trong `docs/architecture/21-database.md` và integration test tái lập run sau khi sửa/xóa strategy. |
| **Xử lý race condition ở vòng đời job** | Giải thích cách xử lý khi người dùng bấm Cancel đúng lúc job sắp hoàn tất, bấm "Cancel it and run the new one", hoặc worker dừng đột ngột khi đang giữ job. | State diagram trong `docs/architecture/20-state-machine.md` và test chuyển trạng thái. |

## References

1. <a id="ref-1"></a>[Project Brief](../../../../UCs/sources/project-brief.md)
2. <a id="ref-2"></a>[Strategy Engine và Strategy library](../../../../design/prototype/docs/requirements/strategy-engine.md)
3. <a id="ref-3"></a>[Backtest](../../../../design/prototype/docs/requirements/backtest.md)
4. <a id="ref-4"></a>[Action-Oriented Accomplishment Statements](https://careerdevelopment.princeton.edu/resume-guide/action-oriented-accomplishment-statements)
5. <a id="ref-5"></a>[Accomplishment Statements](https://www.scu.edu/careercenter/toolkit/resumes/accomplishment-statements/)
6. <a id="ref-6"></a>[Resume Educational Videos — 4 Tips to Writing Strong Bullets](https://cdn.cdo.mit.edu/wp-content/uploads/sites/67/2020/05/Resume-Educational-Videos-2018-Slides.pdf)
