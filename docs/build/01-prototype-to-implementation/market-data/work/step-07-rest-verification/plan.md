# Kế hoạch kiểm chứng REST và baseline

Đọc file này để biết đầu ra, thứ tự công việc và điều kiện hoàn thành Bước 07 của Market Data.

Các bước dùng checkbox để theo dõi tiến độ.

**Mục tiêu:** chốt cách kiểm chứng REST tải lịch sử, thiết kế baseline có thể chạy lại và viết test tự động trước khi Bước 08 build phần tương ứng [[1, Bước 7]](#ref-1).

**Kiến trúc:** kiểm contract dùng chung, service qua provider giả lập, adapter qua HTTP giả lập và flow Web → API qua E2E. Đo riêng cache hit và cache miss. REST tải lịch sử chỉ cung cấp baseline cho các phép đo áp dụng được.

**Công cụ:** Vitest, Playwright và ESLint theo Test Strategy [[2]](#ref-2). Công cụ load test còn Proposed, chọn khi chốt workload.

**Test basis:** hành vi Market Data [[3]](#ref-3), quality attributes [[4]](#ref-4), thiết kế provider/cache [[5]](#ref-5), contract HTTP [[6]](#ref-6) và phân tích requirements REST [[7]](#ref-7).

**Tham khảo phương pháp:** chọn level/type/technique theo rủi ro, thiết kế interface, TDD, mutant check và phòng anti-pattern từ Lean Testing Workflow [[12]](#ref-12). Kế hoạch này không áp dụng toàn bộ workflow đó. Quy định hiện hành của project vẫn quyết định việc kiểm tra, tài liệu và commit.

## Ràng buộc

- Không triển khai full STLC. Tài liệu kiểm chứng nằm trong TS-002, code test nằm trong workspace [[1]](#ref-1) [[8]](#ref-8).
- Không build code production REST ở bước này. Test mới có thể fail cho tới khi Bước 08 triển khai hành vi tương ứng [[1]](#ref-1).
- Mỗi Task hoàn tất phải có commit riêng theo quy tắc bên dưới. Không chạy `pnpm check`. Chỉ chạy kiểm tra theo phạm vi thay đổi.
- Không đổi abstract plan. Chỉ cập nhật tracker và folder làm việc của bước 07.
- Giữ ngưỡng mở Realtime dưới 2 giây ở p95 (QA-10) và đổi timeframe dưới 1 giây ở p95 (QA-11) ở trạng thái Proposed cho tới khi chốt điều kiện đo [[4]](#ref-4).
- Mỗi giá trị workload do agent đề xuất phải ghi nguồn, lý do và tác động so với test basis. Tách các giá trị cần người dùng duyệt.
- Trước khi đọc source, đọc skill `graphify` và chạy query khi có graph. Trước khi sửa symbol dùng chung, chạy `graphify affected`. Sau khi sửa code, chạy `graphify update .`.
- Test dùng literal làm expected value, không lấy kết quả mong đợi từ implementation. Thay dependency qua boundary, không mock module của app [[9]](#ref-9).

## Commit khi hoàn tất Task

Quy tắc này áp dụng cho cả năm Task trong kế hoạch, theo yêu cầu của product owner. Yêu cầu này cho phép agent tạo commit khi thực hiện từng Task.

1. Hoàn thành đầu ra và điều kiện đạt của Task.
2. Chạy kiểm tra phù hợp với các file đã thay đổi. Xử lý lỗi ngoài dự kiến và findings thuộc phạm vi Task trước khi commit.
3. Cập nhật checkbox và kết quả Task trong tài liệu làm việc. Với test red có chủ đích của Bước 07, ghi test đã chạy, nguyên nhân fail và phần Bước 08 phải triển khai. Không ghi các test đó là pass.
4. Dùng skill `commit`. Kiểm diff và chỉ stage thay đổi thuộc Task cùng cập nhật tiến độ liên quan. Không đưa thay đổi ngoài Task vào commit.
5. Tạo commit riêng cho Task trên branch hiện tại. Không gộp nhiều Task vào một commit. Không bỏ qua Git hooks để tạo commit.
6. Xác nhận commit đã tạo và ghi mã commit khi báo kết quả Task cho người dùng. Chỉ chuyển sang Task tiếp theo sau khi commit thành công.

Nếu kiểm tra hoặc Git hook chặn commit vì test red có chủ đích, báo rõ nguyên nhân và giữ Task chưa hoàn tất. Không tự đổi assertion hoặc thêm `skip` để commit được.

## File và trách nhiệm

Đường dẫn tính từ gốc repo. Các file mới dưới đây là đầu ra dự kiến, chưa phải file đã tạo.

| File | Thay đổi và trách nhiệm |
| --- | --- |
| `docs/testing/test-scopes/TS-002-market-data/rest-verification.md` | Tạo ma trận requirement → kịch bản → test → evidence. Ghi fixture, workload, môi trường, phép đo, tiêu chí và cách chạy lại |
| `docs/testing/test-scopes/TS-002-market-data/README.md` | Thêm đường dẫn tài liệu kiểm chứng và trạng thái REST |
| `docs/testing/test-scopes/TS-002-market-data/rest-requirement-gap-analysis.md` | Cập nhật kết luận khi đã đối chiếu nguyên văn WCAG và đã chốt điều kiện đo |
| `docs/UCs/quality-attributes.md` | Chỉ sửa QA-10/QA-11 khi điều kiện đo và ngưỡng đã được chốt |
| `docs/UCs/market-data.md` | Chỉ sửa nguồn WCAG hoặc hành vi nếu quá trình thiết kế test phát hiện gap đã được giải quyết |
| `packages/shared/src/schemas/market-data.schema.test.ts` | Test contract response và query qua public API hiện có hoặc public API dự kiến đã ghi rõ |
| `apps/api/test/market-data/` | Test provider contract, adapter, cache, service, API và log |
| `apps/api/test/support/` | Fixture, provider giả lập và HTTP giả lập dùng chung nếu nhiều test cần |
| `apps/web/e2e/market-data/` | Test flow dùng API ứng dụng thật, upstream giả lập. Phân biệt với test chỉ dùng HTTP mock của Web |
| `work/step-07-rest-verification/execution.md` | Ghi quyết định, lệnh đã chạy, test fail có chủ đích và việc chuyển bước 08 |

Tên file test cụ thể và interface test harness được chốt sau khi đọc source ở Task 1. Không đổi production API chỉ để thuận tiện cho test. Chỉ sửa `test-strategy.md` nếu chọn công cụ hoặc chiến lược chung khác hiện tại [[1]](#ref-1).

## Chọn cách kiểm thử

Task 2 hoàn thiện bảng này theo nhóm requirement và rủi ro cụ thể. Chọn level thấp nhất đủ phát hiện lỗi, chỉ dùng E2E cho hành vi cần đi qua toàn flow. Contract là loại kiểm tra, không phải một test level riêng [[2]](#ref-2) [[12, Bước 2]](#ref-12).

| Nhóm hành vi | Rủi ro cần giảm | Level | Type | Technique |
| --- | --- | --- | --- | --- |
| Query và schema nến | Nhận input sai hoặc response lệch contract | Unit/component của shared schema | Functional, contract | Equivalence partitioning, boundary value analysis (EP/BVA) |
| Chuẩn hóa OHLCV, lịch sử ngắn và MA | Sai dữ liệu hoặc sai số nến hiển thị | Component của adapter/service và logic Web | Functional, data integrity | EP/BVA, ví dụ có expected tính độc lập |
| Cache, single-flight và cooldown | Trả snapshot sai, gọi upstream lặp hoặc gọi trong thời gian bị chặn | Component integration qua interface provider | Functional, resilience | State transition, BVA, scenario đồng thời |
| Session, query và lỗi HTTP | Truy cập trái phép, input vượt phạm vi, lộ chi tiết upstream | Integration qua HTTP API | Functional, security, contract | Decision table, threat model cho bề mặt REST |
| Đổi pair/timeframe và lỗi từng chart | Gắn dữ liệu sai nhãn hoặc ảnh hưởng chart khác | System/E2E | Functional | Scenario, state transition |
| Điều khiển, focus và mô tả chart | Người dùng không thao tác hoặc không đọc được trạng thái | UI/system | Accessibility | Checklist từ WCAG, scenario bàn phím và screen reader |
| Baseline REST | Kết quả tải không tái lập hoặc nhanh nhưng dữ liệu sai | API/system và browser | Performance, data integrity | Performance workload modeling |

Exploratory testing là lựa chọn bổ sung khi cần tìm tình huống chưa mô hình hóa. Không dùng branch coverage làm nguồn sinh expected result. Chỉ dùng coverage sau khi có test hành vi để tìm phần chưa được kiểm. Khi áp dụng một technique, đọc skill `test-technique-*` tương ứng trước khi thiết kế case.

## Chặn anti-pattern và kiểm độ nhạy của test

Các biện pháp sau dựa trên Testware và phần anti-pattern của tài liệu tham khảo [[9]](#ref-9) [[12]](#ref-12).

| Anti-pattern | Cách phòng | Cách kiểm |
| --- | --- | --- |
| Expected lặp lại implementation | Dùng literal từ requirement, ví dụ tính độc lập hoặc fixture tham chiếu. Không import hằng số app làm expected | ESLint cho test đã sửa và review nguồn expected |
| Test phụ thuộc cấu trúc nội bộ | Gọi public interface hoặc UI. Không test private method, không export chỉ để test, không mock module app | ESLint, `check:exports` khi có đổi export và review interface |
| Test không thể fail khi hành vi sai | Assert status chính xác cùng body/side effect. Fake phải tạo được cả thành công và lỗi | Mutant check cho các hành vi ưu tiên bên dưới |
| Test phụ thuộc thời gian thật | Inject clock hoặc dùng fake clock. Chờ điều kiện thay vì chờ một khoảng cố định | ESLint và kiểm test TTL/timeout bằng clock điều khiển được |
| Test pass nhờ mock bỏ qua flow thật | API test thay upstream, E2E đi qua API thật. Ghi rõ phần fake không chứng minh được | Review harness và kiểm độ nhạy của fake theo Testware |

Agent đề xuất ưu tiên mutant check cho tính đúng dữ liệu, cách ly lựa chọn, giới hạn upstream và truy cập phiên. Lý do: lỗi ở các vùng này có thể trả dữ liệu sai hoặc làm ảnh hưởng mọi client. Bảng dưới là danh sách mutation dự kiến, chưa phải kết quả đã chạy.

| Hành vi | Mutation có chủ đích | Test phải phát hiện |
| --- | --- | --- |
| Đối chiếu nến và MA | Đổi giá trị OHLCV hoặc làm lệch warm-up | Assertion giá trị nến/MA độc lập bị fail |
| Cách ly pair/timeframe | Bỏ một thành phần khóa hoặc cho response cũ ghi đè lựa chọn mới | Test tách khóa hoặc E2E đổi lựa chọn bị fail |
| TTL và snapshot | Kéo dài TTL hoặc cập nhật `dataTime` ở cache hit | Test trước/sau TTL hoặc snapshot bị fail |
| Single-flight và lỗi | Bỏ gộp request hoặc giữ rejection cho request sau | Test đếm upstream hoặc thử lại sau lỗi bị fail |
| Cooldown và phiên | Bỏ chặn upstream trong cooldown hoặc bỏ kiểm phiên | Test upstream call count hoặc HTTP 401 bị fail |

Chạy từng mutation sau khi test gốc đã pass. Test phải fail ở assertion liên quan, không phải do syntax, import hoặc cấu hình. Khôi phục mutation ngay sau lượt chạy và xác nhận test gốc pass lại. Mutant còn sống yêu cầu sửa test hoặc giải thích vì sao mutation không đổi hành vi thuộc phạm vi. Bước 07 chỉ chốt danh sách này, Bước 08 thực hiện khi có implementation. Kiểm độ nhạy của fake theo Testware vẫn áp dụng, kể cả với fake ngoài danh sách ưu tiên.

## Điểm cần review

| Điều kiện dễ bị bỏ sót | Kết quả cần kiểm | Task |
| --- | --- | --- |
| Response cũ đến sau khi đổi pair/timeframe | Không gắn dữ liệu cũ vào nhãn mới. Chart khác không tải lại | 2, 4 |
| Lịch sử ngắn, có khoảng trống hoặc có nến đang mở | Không tạo nến giả. MA dùng nến thật, có nhãn tạm và xử lý thiếu mẫu | 2, 4 |
| Nến đóng trong thời gian cache còn hạn | `dataTime` và `isClosed` vẫn thuộc snapshot ban đầu | 2, 4 |
| Nhiều request cùng khóa khi cache rỗng hoặc provider lỗi | Gộp lời gọi đang chạy, không giữ lỗi trong cache | 2, 4 |
| Binance trả 429/418 trong khi khóa khác còn cache | Dừng upstream theo `Retry-After`, vẫn trả cache còn hạn và không tự retry | 2, 4 |

## Công việc

### Task 1: Chốt test basis, interface và cách chạy test

- [ ] Đọc conventions về code, cấu trúc và test trước khi sửa test. Dùng Graphify để tìm schema, Web query, API composition root và test harness đang có.
- [ ] Đọc các việc chuyển tiếp từ Bước 05 và Bước 06. Đối chiếu contract thiết kế với schema mock. Ghi nơi test sẽ gọi, signature dự kiến và phần Bước 08 phải triển khai.
- [ ] Dùng skill `codebase-design` để thiết kế interface nhỏ theo nhu cầu caller thật. Ghi input/output, invariant, lỗi, quy tắc thời gian và dependency được truyền vào. Giữ chi tiết Binance và cache bên trong implementation, không tạo abstraction chỉ để test.
- [ ] Lập bảng public interface dùng làm điểm kiểm thử: shared schema, service/provider, adapter/decorator, HTTP API và UI. Mỗi dòng ghi nơi khai báo dự kiến, signature, dependency thay được, lỗi bắt được và phần không chứng minh được. Trình bảng này để người dùng review trước khi viết test, theo skill `tdd`.
- [ ] Kiểm tra script, cấu hình E2E, database test và cách chặn outbound từ source. Chỉ kiểm sự hiện diện của biến môi trường, không in secret. Ghi rõ phần chưa kiểm tra.
- [ ] Đọc nguyên văn WCAG 2.2 cho mô tả chart, màu, reflow, bàn phím, focus và status message. Đối chiếu SC 1.1.1, 1.4.1, 1.4.10, 2.1.1, 2.4.7, 4.1.3 với hành vi đã chốt [[3]](#ref-3) [[7]](#ref-7).
- [ ] Tạo phần test basis trong `rest-verification.md`. Phân loại requirement áp dụng, Dropped, gap đã Accepted và hành vi chỉ áp dụng từ polling. Không tính làm mới lỗi giữ dữ liệu cũ (MK-13) vào vòng này.

**Điều kiện đạt:** interface và điểm kiểm thử đã được review trước khi viết test. Mỗi test có nguồn expected result rõ. Không còn nhận định môi trường lấy từ tài liệu mong muốn thay cho source.

- [ ] Chạy kiểm tra phù hợp và tạo commit riêng cho Task 1 theo mục Commit khi hoàn tất Task.

### Task 2: Thiết kế kịch bản và dữ liệu đối chiếu

- [ ] Hoàn thiện bảng chọn cách kiểm thử theo rủi ro. Ghi lý do chọn level, type và technique cho mỗi nhóm rule. Đọc skill technique tương ứng, không chọn chỉ theo tên công cụ.
- [ ] Lập ma trận bao phủ các requirement REST còn hiệu lực, gồm cả accessibility. Mỗi dòng ghi precondition, thao tác, expected result, level, type, technique, code test dự kiến và evidence cần lưu. Từ technique đã chọn, xác định partitions, giá trị biên, trạng thái/chuyển trạng thái hoặc tổ hợp điều kiện cần kiểm.
- [ ] Thiết kế contract: enum pair/timeframe, query thiếu/sai/thừa, kiểu số hữu hạn, OHLCV, thứ tự và mốc nến, nến đang mở, `warmupCount`, `dataTime`, summary và lỗi HTTP [[5]](#ref-5) [[6]](#ref-6).
- [ ] Thiết kế fixture có expected literal: lịch sử đủ 519 nến, 500 nến, ít hơn mẫu MA(20), rỗng, có khoảng trống và dữ liệu sai. Với 519 nến, 19 nến chỉ khởi động MA và tối đa 500 nến được vẽ. Các số này suy từ giới hạn hiển thị và mẫu MA đã chốt [[3]](#ref-3) [[5]](#ref-5).
- [ ] Thiết kế service test bằng provider giả lập. Kiểm service không biết payload Binance, kiểm dữ liệu sai và mapping lỗi. Kiểm adapter chuẩn hóa riêng bằng response Binance cố định, không gọi Binance trong regression test.
- [ ] Thiết kế cache test bằng clock điều khiển được: trước/đúng/sau TTL 5 giây, tách khóa pair/timeframe/số nến, single-flight thành công và thất bại, không cache lỗi, giữ snapshot. Kiểm cooldown 429/418, 403, timeout 5 giây và API không retry [[5]](#ref-5).
- [ ] Thiết kế E2E: mở mặc định, đổi pair/timeframe, ẩn/hiện chart, phản hồi cũ, lỗi chart/sidebar độc lập, thử lại, hết phiên, hạn chờ Web 10 giây, nhãn nến/MA, đọc nến, zoom và màn hình hẹp [[3]](#ref-3).
- [ ] Thiết kế kiểm dependency boundaries và log có pair/timeframe, thời gian upstream/service và cache hit/miss. Phân biệt assertion tự động với việc review source.
- [ ] Gắn các mutation dự kiến với test cụ thể. Ghi phần kiểm tự động, phần review và phần chỉ chạy được sau khi implementation đã pass.

**Điều kiện đạt:** test có thể phát hiện dữ liệu sai dù fixture và mock trả thành công. Đối chiếu nến đóng theo khóa pair/timeframe/openTime, không so nến đang mở ở hai thời điểm khác nhau.

- [ ] Chạy kiểm tra phù hợp và tạo commit riêng cho Task 2 theo mục Commit khi hoàn tất Task.

### Task 3: Chốt protocol baseline REST

- [ ] Tạo bảng phép đo thực hiện/hoãn từ mục tiêu Market Data và nhóm chỉ số CV [[10]](#ref-10) [[11]](#ref-11).
- [ ] Giữ ngay: thời gian hiện chart đầu tiên, thời gian đủ chart mặc định, đổi timeframe, latency HTTP, tỷ lệ lỗi, đối chiếu nến đóng và số request browser → API/upstream. Tách latency API khỏi thời gian vẽ chart.
- [ ] Thiết kế lượt cache rỗng, cache còn hạn và request đồng thời cùng khóa. Giữ cache production 5 giây. Không tắt cache để tạo baseline yếu. Ghi cả request count và weight upstream, không xem chúng là một chỉ số.
- [ ] Đề xuất workload trước khi chạy: concurrency, phân bố pair/timeframe, số chart/client, nhịp mở hoặc đổi chart, warm-up, thời lượng, số lần lặp và cách tổng hợp percentile. Mỗi giá trị mới có lý do. Không dùng một lần tải trang làm mẫu p95.
- [ ] Ghi môi trường cần lưu: commit/diff, runtime và dependency lock, cấu hình máy, DB/session, nguồn thật hoặc replay, RTT, clock, cache, chế độ build Web, công cụ phát tải và vị trí máy phát tải. Ghi cả cấu hình máy client khi đo thời gian vẽ.
- [ ] Tách replay xác định để so sánh các phiên bản khỏi smoke với Binance thật để kiểm mapping. Không load test Binance thật. Thiết kế lưu command, cấu hình, raw samples, lỗi và kết quả đối chiếu theo từng lượt.
- [ ] Ghi capacity REST là tải request phục vụ lịch sử. Chỉ gọi là đạt tải khi dữ liệu đúng và đáp ứng tiêu chí latency đã chốt. Không dùng con số này thay capacity nhận cập nhật realtime.
- [ ] Hoãn freshness/source-to-chart delay, tỷ lệ thời gian dữ liệu cũ và bandwidth/client/phút tới polling. Hoãn fan-out subscription và recovery/backfill tới WebSocket. REST vẫn kiểm snapshot `dataTime` đúng. Chọn CPU/RAM/event-loop lag làm số đo bổ sung khi chạy tải, không tự đặt ngưỡng tối ưu.
- [ ] Trình riêng workload đề xuất và quyết định giữ/chỉnh ngưỡng QA-10/QA-11. Nếu chưa chốt ngưỡng, chỉ thiết kế phép đo mô tả, không ghi Passed cho mục tiêu hiệu năng.

**Điều kiện đạt:** protocol phân biệt được điều đo ngay và điều chưa thể đo. Các phiên bản REST tải lịch sử, polling và WebSocket dùng chung định nghĩa chỉ số khi so sánh.

- [ ] Chạy kiểm tra phù hợp và tạo commit riêng cho Task 3 theo mục Commit khi hoàn tất Task.

### Task 4: Viết test tự động trước build và xác nhận trạng thái fail

- [ ] Sau khi chốt cách kiểm chứng và điểm kiểm thử, dùng skill `tdd`. Viết test qua public interface của Task 1–2. Chỉ thêm harness cần cho test, chưa triển khai hành vi production.
- [ ] Xếp test thành các lát hành vi để Bước 08 triển khai lần lượt: contract và dữ liệu, provider/service, cache và lỗi upstream, HTTP/session, rồi flow UI. Mỗi lát ghi test red đầu tiên và expected result. Không cố định chi tiết nội bộ cho toàn bộ implementation từ Bước 07.
- [ ] Viết hoặc mở rộng E2E dùng API thật với upstream giả lập. Không dùng mock response tại browser để tuyên bố đã kiểm flow xuyên suốt.
- [ ] Chạy từng nhóm test bằng script đúng của workspace. Lưu lệnh, test name, assertion và nguyên nhân fail. Phân biệt thiếu module/harness với fail ở hành vi chưa build. Không dùng `skip`, `todo` hoặc assertion luôn đúng để thay test.
- [ ] Kiểm test đang có không bị sửa expected result để phù hợp contract mới khi production chưa chuyển đổi. Ghi riêng test regression đang pass và test mới đang red.
- [ ] Kiểm từng test theo bảng anti-pattern trước khi bàn giao. Không dùng lỗi import do thiếu module làm bằng chứng assertion đã kiểm được hành vi. Ghi test đó chưa tới assertion và yêu cầu chạy lại ở Bước 08.
- [ ] Với fake/harness mới, ghi phép làm hỏng hành vi mà fake thay thế. Nếu chưa thể chạy mutation do thiếu implementation, ghi chưa kiểm chứng và chuyển thành gate bắt buộc ở bước 08, không ghi đã chứng minh fake [[9]](#ref-9).

**Điều kiện đạt:** test cho Bước 08 tồn tại và đã được chạy. Trạng thái red có nguyên nhân rõ. Bước 07 chỉ hoàn thành phần test trước build theo abstract plan, chưa hoàn thành chu trình TDD. Bước 08 chạy lại red, triển khai tối thiểu để green theo từng lát, rồi review/refactor và chạy lại test. Không tuyên bố mutant check đã đạt khi test gốc chưa pass. Bước 07 không tuyên bố flow REST đã đạt hoặc baseline đã đo.

- [ ] Chạy kiểm tra phù hợp và tạo commit riêng cho Task 4 theo mục Commit khi hoàn tất Task. Ghi rõ trạng thái red có chủ đích trong commit.

### Task 5: Review, kiểm tra tài liệu và bàn giao

- [ ] Cập nhật README của scope, execution và tracker. Chỉ đánh dấu hoàn thành khi cả tài liệu kiểm chứng lẫn test trước build đã có.
- [ ] Chạy Prettier cho file sửa và `pnpm check:docs`. Nếu sửa public exports, chạy `pnpm check:exports`. Chạy ESLint, typecheck workspace và test liên quan theo thay đổi. Báo rõ lỗi do contract production chưa build, không gộp vào kết quả pass.
- [ ] Chạy `graphify update .` nếu sửa code. Dùng skill `review-change` với reviewer mới cho code/test hoặc UCs đã sửa. Xử lý findings trước khi báo hoàn thành.
- [ ] Bàn giao Bước 08: interface đã chốt, thứ tự red → green theo từng lát, fixture tham chiếu, protocol baseline, evidence cần thu, mutation và phép kiểm fake chưa thực hiện. Chạy mutant check sau khi test gốc pass. Khôi phục code và chạy lại test sau mỗi mutation. Không chạy benchmark trước khi có flow tương ứng.
- [ ] Tạo commit riêng cho Task 5 theo mục Commit khi hoàn tất Task. Chỉ báo Bước 07 hoàn thành sau khi commit thành công.

## References

1. <a id="ref-1"></a>[Kế hoạch triển khai Market Data ở mức tổng quan](../../abstract-implementation-plan.md)
2. <a id="ref-2"></a>[Test Strategy](../../../../../testing/test-strategy.md)
3. <a id="ref-3"></a>[Market Data](../../../../../UCs/market-data.md)
4. <a id="ref-4"></a>[Quality Attributes](../../../../../UCs/quality-attributes.md)
5. <a id="ref-5"></a>[Market Data & Realtime Updates](../../../../../architecture/10-market-data.md)
6. <a id="ref-6"></a>[API & Realtime Communication Contracts](../../../../../architecture/22-api-endpoints.md)
7. <a id="ref-7"></a>[REST Requirement Gap Analysis](../../../../../testing/test-scopes/TS-002-market-data/rest-requirement-gap-analysis.md)
8. <a id="ref-8"></a>[Test Scopes](../../../../../testing/test-scopes/README.md)
9. <a id="ref-9"></a>[Testware](../../../../../conventions/testware.md)
10. <a id="ref-10"></a>[Những thứ cần đạt được trong lúc build Market Data](../../goal.md)
11. <a id="ref-11"></a>[Market Data sẽ thêm dòng nào vào CV?](../../cv-goal.md)
12. <a id="ref-12"></a>[Lean Testing Workflow (v1)](../../../draft/testing/lean-testing-workflow.md)
