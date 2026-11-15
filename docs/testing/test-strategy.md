# Test Strategy

Đọc file này để biết Crypto Force cần test những gì, ở mức nào, vì sao, và công cụ nào được đề xuất cho từng loại test.

Thứ tự lập luận trong file: rủi ro chất lượng → loại test giảm rủi ro đó → công cụ thực hiện loại test. Mọi công cụ ở [Công cụ](#công-cụ) đều truy ngược được về ít nhất một rủi ro ở [Rủi ro chất lượng](#rủi-ro-chất-lượng).

## Phạm vi

**Trong phạm vi:**

- Tính đúng của indicator, strategy, combination, backtest và evaluation trong `packages/engine`.
- Khả năng tái lập kết quả: cùng input và cùng version strategy luôn cho cùng kết quả [[1, §21]](#ref-1).
- Hành vi của các flow người dùng: Realtime, Strategy Engine, Discovery, Backtest, News, Authentication [[2]](#ref-2).
- Các Architectural Drivers: Modifiability, Scalability, Realtime, Reliability, Performance, Maintainability, Observability [[1, §17]](#ref-1).

**Ngoài phạm vi:**

- Hiệu quả đầu tư của strategy. Test kiểm tra engine tính **đúng** return, win rate, max drawdown, không kiểm tra strategy có **lãi** hay không [[1, §24]](#ref-1).
- Độ chính xác của mô hình sentiment. Test kiểm tra pipeline Collect → Store → Analyze và việc lưu model, prompt version; không đánh giá LLM phân loại tin đúng đến đâu.
- Tính đúng của dữ liệu do Binance cung cấp.

## Rủi ro chất lượng

Mức ưu tiên: **High** là sai thì kết quả hệ thống mất giá trị hoặc vi phạm trực tiếp một Architectural Driver; **Medium** là ảnh hưởng một flow nhưng có cách phát hiện hoặc khôi phục; **Low** là ảnh hưởng trải nghiệm.

| ID | Rủi ro | Nguồn | Ưu tiên |
| --- | --- | --- | --- |
| R-01 | Indicator (MA, RSI, Bollinger, Support/Resistance) tính sai, đặc biệt ở biên: chuỗi nến ngắn hơn period, giá đi ngang, giá trị bằng 0 | [[1, §6]](#ref-1) | High |
| R-02 | Backtest giả lập sai: sai thứ tự entry/exit, tính fee và slippage sai, dùng dữ liệu của nến chưa đóng (look-ahead bias) | [[1, §10]](#ref-1) [[3, Cấu hình một lần chạy]](#ref-3) | High |
| R-03 | Evaluator tính sai metric: Total Return, Win Rate, Max Drawdown, Number of Trades, Score | [[1, §10, §11]](#ref-1) | High |
| R-04 | Combination kết hợp tín hiệu sai: Majority Vote khi hòa, Weighted với ngưỡng | [[1, §8]](#ref-1) [[4, Tạo và sửa composite]](#ref-4) | High |
| R-05 | Mất khả năng tái lập: chạy lại run cũ ra kết quả khác, hoặc run cũ bị thay đổi khi strategy được sửa, đổi tên, xóa | [[1, §21]](#ref-1) [[3, Snapshot cấu hình của run]](#ref-3) | High |
| R-06 | Thêm strategy hoặc search algorithm mới làm hỏng component khác (Modifiability) | [[1, §17, §26]](#ref-1) | High |
| R-07 | Mất kết nối Binance WebSocket không được phát hiện, không tự kết nối lại, hoặc mất nến trong khoảng mất kết nối (Reliability) | [[1, §17]](#ref-1) [[5, Mất kết nối]](#ref-5) | High |
| R-08 | Phiên Search chuyển trạng thái sai: Pause/Resume mất tiến độ, không dừng khi chạm stop condition, Stop không giữ kết quả | [[1, §12]](#ref-1) [[6, Vòng đời một phiên Search]](#ref-6) | High |
| R-09 | Job backtest/Search bị xử lý trùng, mất khi worker crash, hoặc không retry (Scalability) | [[1, §12, §26]](#ref-1) | High |
| R-10 | API, WebSocket event và frontend lệch định dạng dữ liệu | [[1, §19]](#ref-1) | Medium |
| R-11 | Lỗi ở News hoặc Sentiment làm Chart, Backtest ngừng hoạt động | [[1, §25]](#ref-1) | Medium |
| R-12 | Backtest và Search chậm tới mức không dùng được khi số candidate lớn; realtime update có độ trễ cao (Performance, Realtime) | [[1, §17]](#ref-1) | Medium |
| R-13 | Lỗi bảo mật ở Auth: lộ email tồn tại khi reset password, không khóa khi đăng nhập sai nhiều lần, session cookie cấu hình sai | [[7]](#ref-7) | Medium |
| R-14 | Validation form sai: Backtest (From/To, Fee, Slippage), Search (stop condition), Strategy (tên trùng, giới hạn ký tự) | [[3, Cấu hình một lần chạy]](#ref-3) [[6, Cấu hình Search]](#ref-6) [[4, Lưu strategy]](#ref-4) | Medium |
| R-15 | Không quan sát được hệ thống: không biết loop đang chạy hay dừng, bao nhiêu job lỗi (Observability) | [[1, §17]](#ref-1) | Medium |
| R-16 | UI không dùng được bằng bàn phím và screen reader: Leaderboard `aria-sort`, mô tả chart, drawer đóng bằng Esc | [[6, Xem và mở candidate]](#ref-6) [[5, Chọn số chart và timeframe]](#ref-5) | Low |
| R-17 | Giao diện vỡ layout sau khi sửa style | [[8]](#ref-8) | Low |

## Test levels

| Level | Kiểm tra gì | Ranh giới | Phụ thuộc bên ngoài |
| --- | --- | --- | --- |
| Unit | Một hàm hoặc class đơn lẻ | Chủ yếu `packages/engine` và `packages/shared`; logic thuần trong `apps/*` | Không có |
| Integration | Một app làm việc với hạ tầng thật | `apps/api` + PostgreSQL; `apps/worker` + pg-boss + PostgreSQL | PostgreSQL thật; Binance, LLM, email được thay bằng mock |
| Contract | Định dạng dữ liệu giữa hai bên | REST response, WebSocket event, job payload so với schema Zod trong `packages/shared` | Không có |
| System / E2E | Flow người dùng xuyên màn hình | `apps/web` + `apps/api` + `apps/worker` + PostgreSQL | Binance, LLM, email được thay bằng mock |

`packages/engine` không có I/O [[9, Tech Stack]](#ref-9), nên phần lớn rủi ro High (R-01 tới R-06) được kiểm tra ở mức unit, chạy nhanh và không cần môi trường.

## Test types theo rủi ro

| Loại test | Giảm rủi ro | Cách áp dụng |
| --- | --- | --- |
| Example-based unit | R-01, R-02, R-03, R-04, R-14 | Input viết tay, output tính trước bằng tay hoặc bảng tính |
| Property-based | R-01, R-02, R-03, R-04 | Sinh ngẫu nhiên chuỗi nến và tham số, kiểm tra tính chất luôn đúng. Ví dụ: RSI ∈ [0, 100]; Max Drawdown ∈ [-100%, 0]; số trade đóng ≤ số tín hiệu BUY; Weighted với mọi weight bằng nhau cho cùng kết quả hướng với Majority Vote khi không hòa |
| Golden / regression | R-02, R-03, R-05, R-06 | Lưu kết quả backtest của bộ dữ liệu cố định, mỗi lần sửa code so lại. Thay đổi golden file phải được review như thay đổi hành vi |
| Extensibility | R-06 | Thêm một strategy giả (ví dụ `MACDStrategy` tối giản) chỉ qua `register(...)`, kiểm tra Combination, Backtest, Evaluation chạy được mà không sửa code khác [[1, §26]](#ref-1) |
| State machine | R-08, R-09 | Kiểm tra mọi chuyển trạng thái hợp lệ và bị từ chối của phiên Search và run Backtest |
| Integration với DB | R-05, R-09, R-13 | Snapshot cấu hình run, version strategy, job queue, session |
| Contract | R-10 | Mọi payload qua REST, WebSocket và job đều được parse bằng schema dùng chung |
| Resilience / fault injection | R-07, R-09, R-11 | Ngắt WebSocket giả lập Binance, kill worker giữa job, làm News provider trả lỗi; kiểm tra hệ thống khôi phục và các module khác vẫn chạy |
| Benchmark | R-12 | Đo thời gian backtest của engine trên bộ dữ liệu cố định, phát hiện chậm đi sau mỗi thay đổi |
| Load | R-12 | Nhiều client WebSocket subscribe cùng lúc; nhiều job backtest trong queue |
| Security | R-13 | Kiểm tra các quy tắc Auth; quét dependency có lỗ hổng; quét lỗi web phổ biến (OWASP Top 10) |
| Observability | R-15 | Kiểm tra trạng thái loop, số job lỗi, thời gian backtest được ghi log và truy vấn được |
| E2E | R-05, R-08, R-14 | Các flow chính: tạo strategy → backtest → xem run; Start search → Leaderboard → Re-test |
| Accessibility | R-16 | Quét tự động trên các màn hình chính; kiểm tra điều hướng bàn phím ở Leaderboard, drawer, tab Auth |
| Visual regression | R-17 | So ảnh chụp các màn hình chính ở Desktop, Tablet, Mobile |

## Chiến lược theo module

| Module | Rủi ro chính | Level | Loại test |
| --- | --- | --- | --- |
| Indicator, Strategy | R-01, R-06 | Unit | Example-based, property-based, extensibility |
| Combination | R-04 | Unit | Example-based, property-based |
| Backtest | R-02, R-05 | Unit, integration | Example-based, property-based, golden, benchmark |
| Evaluation, Leaderboard | R-03 | Unit | Example-based, property-based, golden |
| Strategy Search | R-08, R-09, R-12 | Unit, integration | State machine, resilience, load |
| Market Data | R-07, R-12 | Integration | Resilience, load |
| News, Sentiment | R-11 | Integration | Resilience, contract |
| Strategy library, version | R-05, R-14 | Integration, E2E | Integration với DB, E2E |
| Auth | R-13, R-14 | Integration, E2E | Security, E2E |
| API, WebSocket | R-10 | Contract | Contract |
| UI | R-14, R-16, R-17 | E2E | E2E, accessibility, visual regression |

## Test data và môi trường

- **Bộ nến cố định:** một số đoạn BTCUSDT lấy từ Binance, lưu trong repo dưới dạng file, dùng cho golden test và benchmark. Gồm ít nhất một đoạn có xu hướng tăng, một đoạn giảm, một đoạn đi ngang.
- **Bộ nến tổng hợp:** chuỗi nến viết tay hoặc sinh bằng code cho các trường hợp biên của R-01 (ít nến hơn period, giá không đổi).
- **Random có seed:** Random Search và property-based test dùng seed cố định, in seed ra khi test fail để chạy lại đúng trường hợp đó.
- **PostgreSQL:** chạy bằng Docker Compose, cùng image với môi trường chạy thật [[9, Tech Stack]](#ref-9). Mỗi lần chạy integration test bắt đầu từ DB sạch.
- **Mock bên ngoài:** Binance (REST và WebSocket), LLM API, dịch vụ email được thay bằng mock có thể điều khiển để tạo lỗi.

## Tiêu chí vào và ra

**Proposed**:

| Thời điểm | Tiêu chí |
| --- | --- |
| Trước khi merge | Unit, contract và golden test pass; không có golden file thay đổi mà chưa được review |
| Trước khi merge thay đổi ở `apps/api`, `apps/worker` | Integration test pass |
| Trước khi demo hoặc deploy | E2E, resilience, accessibility pass; benchmark không chậm hơn ngưỡng đã chốt |
| Định kỳ | Load test, quét security |

## Công cụ

Tất cả là **Proposed**. Một loại test chỉ được thêm công cụ khi loại test đó được giữ lại trong strategy.

| Công cụ | Dùng cho loại test | Rủi ro |
| --- | --- | --- |
| `Vitest` | Example-based unit, golden (snapshot), integration, contract, benchmark (`vitest bench`) | R-01 tới R-06, R-09, R-10, R-12 |
| `fast-check` | Property-based | R-01 tới R-04 |
| `Testcontainers` | Khởi tạo PostgreSQL sạch cho integration test | R-05, R-09, R-13 |
| Mock WebSocket server tự viết (dùng `ws`) | Giả lập Binance, tạo mất kết nối | R-07 |
| `Toxiproxy` | Tạo độ trễ, ngắt mạng giữa app và DB hoặc mock | R-07, R-09, R-11 |
| `k6` | Load test REST và WebSocket | R-12 |
| `Playwright` | E2E, visual regression (screenshot) | R-05, R-08, R-14, R-17 |
| `@axe-core/playwright` | Accessibility | R-16 |
| `pnpm audit` | Quét dependency có lỗ hổng | R-13 |
| `OWASP ZAP` | Quét lỗi web phổ biến | R-13 |

## References

1. <a id="ref-1"></a>[Project Brief](../requirements/project-brief.md)
2. <a id="ref-2"></a>[Crypto Force: hành vi sản phẩm theo UI](../design/reqs-from-ui/README.md)
3. <a id="ref-3"></a>[Backtest](../design/reqs-from-ui/backtest.md)
4. <a id="ref-4"></a>[Strategy Engine và Strategy library](../design/reqs-from-ui/strategy-engine.md)
5. <a id="ref-5"></a>[Realtime](../design/reqs-from-ui/realtime.md)
6. <a id="ref-6"></a>[Discovery](../design/reqs-from-ui/discovery.md)
7. <a id="ref-7"></a>[Authentication](../design/reqs-from-ui/authentication.md)
8. <a id="ref-8"></a>[Design](../design/README.md)
9. <a id="ref-9"></a>[Project: Crypto Force](../../AGENTS.md)
