# Kết quả kiểm chứng REST và baseline

Đọc file này để biết đầu ra từng Task của Bước 07, bằng chứng đã kiểm tra và phần còn phải thực hiện.

## Task 1: Test basis, interface và harness

Ngày thực hiện: 2026-11-20. Source và test basis nội bộ được đọc tại commit `652f1bfa9e324bd11a086b005ecd6e962d40f9dd`. Phạm vi Task nằm trong kế hoạch Bước 07 [[1]](#ref-1).

Đã tạo test basis, phân loại requirements/gap, bảng chênh lệch mock, sáu điểm kiểm thử, signature đề xuất, invariant, lỗi, thời gian, dependency thay được và cách chạy trong tài liệu kiểm chứng [[2]](#ref-2). Đã đọc nguyên văn sáu SC WCAG và cập nhật kết luận accessibility trong gap analysis [[3]](#ref-3). Chưa viết hoặc sửa code test/production.

### Môi trường đã kiểm tra

Chỉ kiểm tra biến có giá trị, không in hoặc lưu giá trị. Kết quả dưới đây là kiểm tra tĩnh ngày thực hiện, không phải kết quả thử kết nối dịch vụ.

| Kiểm tra                                                                                               | Kết quả                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.env`: `DATABASE_URL`, `POSTGRES_DB`, `BETTER_AUTH_SECRET`                                            | Có giá trị                                                                                                                                                 |
| `.env`: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `VITE_API_MOCKING` | Có giá trị; không suy ra giá trị bật/tắt của cờ mock                                                                                                       |
| Process của shell: các biến nêu trên                                                                   | Không có giá trị; runtime có thể nạp `.env` theo entrypoint                                                                                                |
| Runtime Node.js                                                                                        | `C:/dev_env/nvm/v22.23.5/node.exe --version`: `v22.23.5`; PATH ban đầu không tìm thấy `node`/`pnpm`. Đọc/chạy runtime cần quyền ngoài sandbox              |
| Package manager                                                                                        | `pnpm --version`: `9.15.9` khi thêm thư mục runtime vào PATH                                                                                               |
| Hành vi email dev từ source                                                                            | `src/index.ts` truyền cấu hình vào `createMailer`; có cả key và from thì dùng Resend. Không giả định dev chỉ in email [[4]](#ref-4) [[5]](#ref-5)          |
| Chặn outbound và DB/E2E từ source                                                                      | Đã đọc config, global setup, outbound stub, Auth harness và E2E server; chi tiết và giới hạn trong tài liệu kiểm chứng [[2, Harness và cách chạy]](#ref-2) |
| PostgreSQL, Docker, quyền tạo DB, cổng server, browser, OAuth, Resend, Binance                         | Chưa kiểm tra runtime: Task 1 chỉ khảo sát source và thiết kế kiểm chứng; không khởi động dịch vụ hoặc gọi các dịch vụ này                                 |

### Review và phần chuyển tiếp

Product owner đã duyệt sáu interface ngày 2026-11-20 theo yêu cầu của kế hoạch và skill `tdd`. Interface dùng để thiết kế và viết test ở các Task tiếp theo. Kết quả Task 2–3 nằm bên dưới. Kết quả Task 4 nằm bên dưới. Task 5 chưa thực hiện.

Các việc cần cho Bước 08 đã ghi theo điểm kiểm thử: đổi shared contract, dựng provider/service và route có phiên, cập nhật Web và mock, bổ sung harness đi qua API thật. Timeout cụ thể, protocol baseline, fixtures và ma trận kịch bản được xử lý ở các Task sau của Bước 07 [[1]](#ref-1) [[2]](#ref-2).

### Kiểm tra tài liệu

| Kiểm tra                                    | Kết quả                                                                                                               |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Prettier cho bảy file Markdown thuộc Task 1 | Đạt; chạy trực tiếp CLI Prettier bằng Node đã cài để có output kiểm chứng                                             |
| `pnpm check:docs`                           | Đạt: `check-docs: docs OK`                                                                                            |
| `git diff --check`                          | Đạt                                                                                                                   |
| `review-change`, reviewer độc lập           | Không có finding; đã đối chiếu interface/harness với source. Review này không thay thế product owner review interface |
| Test app, build và baseline                 | Không chạy: chỉ thay đổi tài liệu; chưa có test REST mới hoặc implementation                                          |

Không chạy `pnpm check`. Không cập nhật Graphify vì không sửa code.

Task 1 được lưu trong commit riêng chứa bảy file tài liệu đã kiểm tra. Xác nhận mã commit bằng lịch sử Git và báo cho product owner trước khi chuyển Task tiếp theo [[1, Commit khi hoàn tất Task]](#ref-1).

## Task 2: Kịch bản và dữ liệu đối chiếu

Ngày thực hiện: 2026-11-20. Phạm vi chỉ là thiết kế kiểm chứng trong tài liệu [[2]](#ref-2). Chưa viết test, fixture code hoặc production. Chưa chạy browser, mutation hoặc baseline.

Đã thiết kế cách chọn level/type/technique, partitions và giá trị biên, fixture có MA/OHLCV literal, mô hình cache/cooldown, decision table phiên/query và threat model REST. Ma trận gắn requirement với precondition, thao tác, expected, test file dự kiến và evidence cần lưu. E2E tách phần DOM, canvas và screen reader. Mutation/fault gắn với kịch bản cụ thể, chỉ thực hiện sau khi test gốc green.

Kiểm tra hiện diện ID trong ma trận tìm đủ 49 rule Confirmed của vòng REST: lấy các dòng Confirmed trong use case, loại rule refresh chỉ từ polling (MK-13), rồi tìm từng ID trong phần ma trận. Đây chỉ là kiểm traceability bằng tên, không chứng minh 49 requirement đã được kiểm hành vi. Đã đọc từng nhóm expected trong quá trình thiết kế.

Các gate trước khi viết assertion tương ứng:

- Mốc bắt đầu TTL và hết hạn đúng biên đang Proposed. Đã gửi lựa chọn tới product owner. Chưa coi đề xuất là quyết định sản phẩm.
- Ưu tiên 401 khi cả phiên và query đều sai đang Proposed. Case đã có expected tối thiểu là từ chối và không gọi provider.
- Chuỗi giá theo số chữ số thập phân chờ metadata có nguồn theo quyết định đã chốt. Không tự đặt tick size trong fixture.
- Hành vi khi provider trả vượt limit và mã lỗi HTTP cho payload upstream không parse được chưa có oracle cụ thể. Phải xác nhận trong lát contract/adapter trước assertion tương ứng. Các nhóm dữ liệu domain sai đã có expected 502.

Các gate này không chặn ghi thiết kế case hoặc expected đã có nguồn. Chúng chặn assertion áp quyết định chưa được duyệt. Workload và protocol baseline vẫn thuộc Task 3. Task 4 tạo test/harness từ thiết kế, không gọi Binance trong regression.

Kiểm tra tài liệu: Prettier qua CLI trực tiếp đạt cho các file Task 2. `pnpm check:docs` trả `check-docs: docs OK`. `git diff --check` đạt. Reviewer độc lập dùng `review-change` không có finding cho thiết kế và cập nhật tiến độ. Không chạy test app, build, `pnpm check` hoặc Graphify vì chỉ sửa Markdown.

Task 2 được lưu bằng commit riêng cùng cập nhật plan, scope README, tracker và changelog. Mã commit được xác nhận trong Git và báo cho product owner sau khi tạo thành công.

## Task 3: Protocol baseline REST

Ngày thực hiện: 2026-11-20. Đã thiết kế protocol trong tài liệu kiểm chứng [[2, Protocol baseline REST]](#ref-2). Protocol phân biệt chỉ số tải lịch sử, chỉ số cập nhật từ polling và chỉ số subscription/phục hồi từ WebSocket. Chưa chạy benchmark, smoke Binance thật hoặc test app. Chưa sửa production, quality attributes hoặc abstract plan.

Protocol giữ thời gian chart đầu tiên/đủ bốn chart/đổi timeframe, latency HTTP, tỷ lệ lỗi, đối chiếu nến đóng và request count/weight riêng. Thiết kế tách rỗng/hit/single-flight, giữ TTL production 5 giây. Replay đi qua adapter thật, có oracle độc lập và ledger upstream. Môi trường, raw samples, lỗi, tài nguyên và command được lưu theo từng lượt khi chạy ở Bước 08.

Workload do agent đề xuất có nguồn, lý do và tác động riêng cho từng giá trị. Đã trình riêng workload và khuyến nghị giữ ngưỡng mở Realtime/đổi timeframe ở Proposed. Chưa ghi product owner duyệt workload hoặc ngưỡng. Protocol cho phép đo mô tả khi ngưỡng chưa chốt, không ghi Passed hoặc capacity đã đạt. Chỉ chạy workload sau khi được duyệt và có implementation tương ứng.

Task 4 tiếp tục test/harness theo thiết kế chức năng. Công cụ phát tải, instrumentation vẽ chart và script benchmark phải được cụ thể hóa trước khi chạy baseline. Nếu chưa chứng minh canvas đã vẽ, chỉ báo thời gian apply dữ liệu và ghi thời gian hiển thị là Inconclusive.

Kiểm tra tài liệu: Prettier kiểm sáu file Task 3 đạt. `pnpm check:docs` trả `check-docs: docs OK`. `git diff --check` đạt. Review độc lập theo skill `review-change` phát hiện barrier single-flight chưa phân biệt request vào API với caller đã join pending key. Đã sửa điều kiện thả barrier và yêu cầu log chứng minh join. Đây là sửa protocol, chưa phải bằng chứng single-flight đã chạy. Không phát sinh lớp lỗi lặp lại cần thêm rule hoặc Lesson Learned.

Không chạy test app, build, browser, baseline, `pnpm check` hoặc Graphify vì chỉ sửa Markdown. Task 3 được lưu bằng commit riêng gồm protocol và các cập nhật tiến độ. Mã commit được xác nhận trong Git sau khi tạo thành công.

## Task 4: Test tự động trước build

Ngày thực hiện: 2026-11-20. Chỉ thêm test, fixture và harness. Không sửa production hoặc expected của test nháp cũ. Product owner yêu cầu để các quyết định cần duyệt lại sau.

Chưa viết assertion cho biên TTL, ưu tiên phiên/query cùng sai, metadata giá hoặc mã lỗi của payload parse hỏng. Workload và ngưỡng baseline vẫn Proposed.

### Các lát red cho Bước 08

| Lát và file                                          | Test red đầu tiên và expected                                                                                                                                              | Kết quả thực tế                                                                                                                                               |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shared: `market-data-rest.schema.test.ts`            | `REST query accepts timeframe 1d`: safeParse thành công. Snapshot decimal giữ OHLCV, isClosed, warmupCount và dataTime, không cần ma20 từ API                              | 108 test: 37 pass, 71 fail. Case 1d nhận false. Query còn nhận key thừa. Guard của các case snapshot fail vì schema nháp yêu cầu ma20, chưa tới invariant sâu |
| Summary query: `market-summary-input.schema.test.ts` | `accepts summary pair BTCUSDT`: nhận pair. Từ chối key thừa, thiếu hoặc pair lặp                                                                                           | 7 test fail trước expect vì export marketSummaryInputSchema chưa tồn tại. TypeError khi gọi safeParse không chứng minh validation                             |
| Service: `service.test.ts`                           | `keeps 0 real candles with warmup 0`: gọi provider với limit 519, trả warmupCount 0 và snapshot. Các prefix khác kiểm cửa sổ                                               | Chưa tới assertion vì thiếu services/market-data.service.ts                                                                                                   |
| Adapter: `binance.test.ts`                           | `maps every closed candle and requests the specified source key`: đúng URL/query, OHLCV và base volume khớp manifest                                                       | Chưa tới assertion vì thiếu providers/market-data/binance.provider.ts                                                                                         |
| Cache: `cached-provider.test.ts`                     | `shares pending work and preserves the received snapshot on a fresh hit`: một provider call cho hai waiter và lần đọc cache. Giữ dataTime/isClosed                         | Chưa tới assertion vì thiếu providers/market-data/cached-market-data.provider.ts. Không assert biên TTL đang Proposed                                         |
| Provider contract: `provider-contract.test.ts`       | `serves a fresh snapshot while a different key is blocked by upstream cooldown`: cache BTC vẫn trả sau khi ETH nhận 429. Summary SOL bị chặn. Tổng hai HTTP call           | Chưa tới assertion vì thiếu adapter/decorator                                                                                                                 |
| HTTP: `http.test.ts`                                 | `rejects missing session for candles?pair=BTCUSDT&timeframe=1m without calling the provider`: 401, UNAUTHENTICATED và không gọi provider                                   | 13 test tới assertion status, đều fail vì nhận 404. Route chưa build. Case thu hồi phiên dừng ở request thành công ban đầu, chưa tới sign-out                 |
| UI: `rest-history.spec.ts`                           | `opens four default charts through the real API with no browser worker`: BTC, 5m/15m/1h/4h, MA 608.5, attribution, không Load history. Bốn upstream candles và một summary | Playwright thu thập 10 test. API startup fail vì thiếu adapter. Cả 10 test chưa tới setup phiên hoặc assertion UI                                             |

Test nháp `market-data.schema.test.ts` giữ nguyên và có 1 test pass. Tổng lệnh shared là 116 test = 108 REST contract + 7 summary query + 1 regression. Có 38 pass = 37 REST contract + 1 regression. Có 78 fail = 71 REST contract + 7 summary query. Không gộp regression vào số test REST mới pass. Các test đã pass chưa có mutant evidence mới.

`closed-candles.json` lưu literal của đủ 518 nến đóng thuộc fixture full. Test adapter/service so từng nến với JSON này. Input upstream được sinh riêng trong fixtures.ts. Chưa có kết quả đối chiếu vì hai module còn thiếu.

Fixture selection có OHLC của ETH cao hơn BTC 100, close cuối ETH là 718. Agent chọn dữ liệu tổng hợp này để bắt lỗi gắn dữ liệu sai pair. Đây không phải giá thật, metadata giá hoặc thay đổi requirement.

### Harness và phạm vi UI

Cấu hình E2E riêng tắt MSW và chặn service worker. API entrypoint test dùng createApp/Auth thật, mailer bộ nhớ và HTTP upstream giả lập. Adapter/cache dùng module production khi Bước 08 cung cấp chúng. Browser không thay response Market Data.

Database dẫn xuất từ DATABASE_URL với hậu tố `_market_data_rest_test`. Cổng riêng: Web 5185, API 3015, control loopback 3016. Không khởi động worker hoặc gửi email ngoài. Control routes chỉ có trong entrypoint test. Lệnh hiện dừng trước khi tạo DB hoặc mở listener vì static import adapter thất bại.

Mười test UI kiểm mặc định/MA, đổi timeframe, chart ẩn, rỗng, thiếu mẫu MA, reload, viewport 320 px, response cũ, lỗi chart/thử lại và sidebar. Scenario held cố ý giữ HTTP promise dù caller hủy để mô phỏng response tới muộn. Test chỉ kiểm dữ liệu pair mới khi upstream cũ còn bị giữ. Thao tác release chỉ dùng cleanup, không chứng minh callback UI đã nhận hoặc áp response cũ. Kiểm response thực sự tới muộn vẫn là gate Bước 08.

Canvas, screen reader, timeout transport Web và các case ma trận chưa có test vẫn cần thực hiện ở lát tương ứng của Bước 08. Log duration và đầy đủ ngữ cảnh structured log cũng chưa có assertion. Không ghi toàn bộ ma trận là đã tự động hóa. Không dùng DOM để kết luận pixel chart hoặc tiếng đọc screen reader đúng.

### Lệnh và kết quả

Đã chạy Node 22.23.5 và pnpm 9.15.9 để kiểm version thực tế. Shell cần thêm `C:/dev_env/nvm/v22.23.5` vào PATH. Docker Compose báo PostgreSQL 17 healthy. API Vitest chạy global setup và migration trên database `_test`.

| Lệnh từ repo root                                                                                                                                                                                                                                                            | Kết quả                                                                                                                                                                                      |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm --filter @crypto-force/shared exec vitest run src/schemas/market-data.schema.test.ts src/schemas/market-data-rest.schema.test.ts src/schemas/market-summary-input.schema.test.ts --reporter=json --outputFile=C:/Users/Duy/AppData/Local/Temp/rest-shared-result.json` | Exit 1, 38 pass/78 fail theo phân loại trên. JSON có tên và failure message từng test                                                                                                        |
| `pnpm --filter @crypto-force/api exec vitest run test/market-data --reporter=json --outputFile=C:/Users/Duy/AppData/Local/Temp/rest-api-result.json`                                                                                                                         | Exit 1. HTTP có 13 assertion status fail do 404. Bốn suite còn lại thiếu module, không thu thập được test                                                                                    |
| `pnpm --filter @crypto-force/api exec vitest run test/market-data/http.test.ts --reporter=json --outputFile=C:/Users/Duy/AppData/Local/Temp/rest-http-final.json`                                                                                                            | Exit 1, 13 test fail vì 404. Đã sửa race listening của harness và chạy lại. Không còn hook timeout ở lượt cuối                                                                               |
| `pnpm --filter @crypto-force/web exec playwright test --config playwright.market-data-rest.config.ts --list`                                                                                                                                                                 | Thu thập 10 test. Listing không chứng minh đã chạy flow                                                                                                                                      |
| `pnpm --filter @crypto-force/web exec playwright test --config playwright.market-data-rest.config.ts`                                                                                                                                                                        | Exit 1: ERR_MODULE_NOT_FOUND của Binance adapter tại API startup. Chưa mở browser                                                                                                            |
| `pnpm --filter @crypto-force/api typecheck`                                                                                                                                                                                                                                  | Red do ba module production chưa tồn tại. Có các import lặp trong test server/provider contract                                                                                              |
| `pnpm --filter @crypto-force/shared typecheck`                                                                                                                                                                                                                               | Red do marketSummaryInputSchema chưa có trong public exports                                                                                                                                 |
| `pnpm --filter @crypto-force/web typecheck`                                                                                                                                                                                                                                  | Đạt                                                                                                                                                                                          |
| ESLint các file test/harness mới                                                                                                                                                                                                                                             | Còn lỗi no-unsafe-* và oracle rule liên quan kiểu chưa phân giải từ module/export thiếu. HTTP, fixtures, REST schema, E2E spec và Playwright config không có lỗi. Không ghi toàn bộ lint đạt |

Vitest/Playwright thực sự khởi chạy qua pnpm. Sau exit 1, pnpm còn in `Command vitest not found` hoặc `Command playwright not found`. Failure JSON và log startup xác định nguyên nhân ban đầu, không phải thông báo cuối này.

Không chạy pnpm check, benchmark, smoke Binance thật hoặc mutation. Không thêm declaration giả, suppression hoặc thay đổi rule để né red. Không đổi public exports của production.

### Gate kiểm độ nhạy

Bước 08 phải chạy lại red, triển khai tối thiểu để green theo từng lát. Sau đó mới chạy mutation trong tài liệu kiểm chứng [[2, Mutation và phép kiểm fake dự kiến]](#ref-2). Khôi phục code và xác nhận green sau mỗi mutation. Lỗi import không thay thế bằng chứng test phát hiện mutant.

- Provider fake: đổi OHLCV hoặc trả dữ liệu invalid. Test phải fail ở dữ liệu hoặc kết quả từ chối.
- Deferred/cache driver: bỏ single-flight hoặc giữ rejection. Test phải fail ở call count hoặc request tiếp theo.
- HTTP fake: đọc nhầm base volume, bỏ cooldown hoặc không abort. Test adapter phải fail ở dữ liệu, call count hoặc AbortSignal.
- Express/Auth harness: bỏ kiểm phiên hoặc strict query. Test phải fail ở status/body/provider call count.
- E2E upstream/control driver: giữ dữ liệu pair cũ, tính MA sai hoặc cho lỗi chart lan sang chart khác. Test phải fail qua UI/API thật.

Các phép kiểm fake trên đều chưa chứng minh được khi implementation còn thiếu. Chúng là gate bắt buộc ở Bước 08. Task 4 chỉ bàn giao test trước build. Chưa hoàn tất TDD, mutant check hoặc baseline. Task 5 chưa thực hiện.

### Kiểm tra và review Task 4

Prettier đạt cho code mới và sáu Markdown. Markdown được kiểm với `--ignore-path .gitignore` vì `.prettierignore` mặc định bỏ qua docs. `pnpm check:docs` và `git diff --check` đạt. `graphify update .` cập nhật AST thành công.

Reviewer độc lập đã kiểm đủ 518 reference rows, không thấy sai lệch. Review phát hiện ba điểm: precision UI chưa có oracle, claim response tới muộn vượt evidence và câu trạng thái config E2E đã cũ. Đã bỏ assertion chuỗi giá phụ thuộc metadata. Test pair chỉ còn kiểm khi request upstream cũ đang bị giữ. Đã sửa trạng thái config. Không tuyên bố đã kiểm response tới muộn sau khi release. Reviewer đã kiểm lại ba sửa đổi và không có finding mới.

Các sửa lỗi nằm trong test/driver và trạng thái tài liệu. Đã áp dụng skill correct ở phạm vi này. Không thêm rule chung hoặc sửa Lesson Learned cho các finding riêng của lát chưa build. Bằng chứng mutant và độ nhạy driver vẫn là gate Bước 08.

## References

1. <a id="ref-1"></a>[Kế hoạch kiểm chứng REST và baseline](plan.md)
2. <a id="ref-2"></a>[Kiểm chứng REST tải lịch sử](../../../../../testing/test-scopes/TS-002-market-data/rest-verification.md)
3. <a id="ref-3"></a>[REST Requirement Gap Analysis](../../../../../testing/test-scopes/TS-002-market-data/rest-requirement-gap-analysis.md)
4. <a id="ref-4"></a>[API bootstrap](../../../../../../apps/api/src/index.ts)
5. <a id="ref-5"></a>[Mailer](../../../../../../apps/api/src/services/mailer.ts)
