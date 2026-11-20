# Kiểm chứng REST tải lịch sử

Đọc file này để biết test basis, interface kiểm thử và cách chạy kiểm chứng REST tải lịch sử của Market Data.

## Test basis và phạm vi

Test basis nội bộ được đọc tại commit `652f1bfa9e324bd11a086b005ecd6e962d40f9dd`. Expected result lấy từ requirements và thiết kế đã chốt, không lấy từ hành vi mock hiện tại. Bảng dưới phân loại toàn bộ rule và gap của use case Market Data [[1]](#ref-1).

| Phân loại | Requirement hoặc gap | Cách dùng làm expected result |
| --- | --- | --- |
| MA, volume và lịch sử | MA(20), thiếu mẫu, warm-up, nến mở, cửa sổ hiển thị và khoảng trống (MK-01, MK-15, MK-23 đến MK-25, MK-28, MK-33, MK-35, MK-36) | Literal tính độc lập từ nến có thật; tách nến dùng warm-up khỏi nến hiển thị |
| Lựa chọn và cách ly dữ liệu | Số chart, giữ timeframe chart ẩn, đổi timeframe/pair, bỏ response cũ, tập lựa chọn, mặc định và reload (MK-04 đến MK-07, MK-14, MK-17, MK-30 đến MK-32, MK-37) | Lựa chọn và dữ liệu từng chart sau thao tác; chart khác giữ dữ liệu |
| Thông tin và thao tác chart | Attribution, nhãn nến mở, thời điểm dữ liệu, MA/volume từng chart, đọc nến, zoom/kéo, múi giờ và định dạng giá (MK-02, MK-26, MK-27, MK-29, MK-41 đến MK-44) | Nội dung người dùng đọc được và giá trị fixture; không dùng riêng số phần tử canvas làm oracle |
| Summary và sidebar | Giá/thay đổi 24 giờ, lỗi riêng và không có MA/volume (MK-08, MK-18, MK-60) | Summary của pair được chọn, độc lập timeframe và lỗi chart |
| Tải, lỗi, phiên và tính đúng dữ liệu | Đang tải, rỗng, thử lại, timeout, không lộ chi tiết, phiên hết hạn, nến sai, OHLCV và thời gian mở (MK-10 đến MK-12, MK-34, MK-38 đến MK-40, MK-45, MK-51, MK-52, MK-62) | Trạng thái hiển thị, quyền truy cập, HTTP contract và nến mẫu độc lập |
| Accessibility và màn hình hẹp | Bàn phím, mô tả chữ, thông báo trạng thái, không chỉ dùng màu, reflow, focus và một cột (MK-46 đến MK-50, MK-58, MK-59) | Requirement sản phẩm kết hợp bảng đối chiếu WCAG bên dưới |
| Không tải thêm lịch sử | Không có thao tác tải thêm (MK-61) | Kiểm sự vắng mặt của thao tác; zoom/kéo chỉ trong dữ liệu đã tải |
| Dropped | MA/volume sidebar và Load history (MK-09, MK-16, MK-19) | Không tạo test bắt sản phẩm giữ hành vi cũ; thay bằng thông tin từng chart và không tải thêm (MK-29, MK-60 đến MK-62) |
| Chỉ từ polling | Làm mới lỗi giữ dữ liệu cũ (MK-13) | Ngoài vòng tải lịch sử; không dùng trạng thái refresh của mock làm requirement vòng này |
| Gap Closed | MA, sidebar, nến mở, đọc nến, múi giờ, dữ liệu sai và accessibility (MK-20 đến MK-22, MK-54 đến MK-57) | Truy về rule đã chốt tương ứng, không tính gap thành test độc lập |
| Gap Accepted | Bỏ tải thêm và reload mất lựa chọn (MK-03, MK-53) | Giữ quyết định không tải thêm và reload về mặc định (MK-61, MK-37); không báo đây là defect |

Thay provider mà không đổi frontend (QA-09) là requirement Confirmed. Test với provider giả lập chứng minh API/service chỉ cần interface đã thống nhất; nó không chứng minh chi phí tích hợp một provider thật thứ hai. Thời gian mở Realtime (QA-10) và đổi timeframe (QA-11) còn Proposed; Task 3 chốt protocol và điều kiện đo trước khi dùng làm tiêu chí đạt. Độ trễ live và reconnect không thuộc vòng này [[2]](#ref-2).

Contract expected nằm trong thiết kế nến, cache và chuẩn hóa [[3]](#ref-3), cùng endpoint và lỗi HTTP [[4]](#ref-4). Các việc chuyển từ Bước 05–06 gồm kiểm phiên bị thu hồi, mã HTTP/code, lịch sử ngắn, `isClosed`, chuẩn hóa kline, TTL, single-flight, không cache lỗi, tách khóa, cooldown và giữ `dataTime` của snapshot [[5]](#ref-5) [[6]](#ref-6). Ma trận dưới gắn các kịch bản với expected và evidence cần lưu.

## Chênh lệch với source hiện tại

| Nơi đã đọc | Hiện có tại commit test basis | Bước 08 phải triển khai |
| --- | --- | --- |
| `packages/shared/src/schemas/market-data.schema.ts` [[7]](#ref-7) | 5 timeframe, có `ma20`; chưa có `isClosed`, `warmupCount`, `dataTime`; query dùng `z.object` chưa từ chối key thừa | Thêm `1d`, đổi shape theo contract đã chốt, strict query và metadata độ chính xác giá có nguồn |
| `apps/web/app/api/market-data.ts`, `hooks/useMarketData.ts` [[8]](#ref-8) [[9]](#ref-9) | Fetch cùng origin, parse schema nháp, kiểm lựa chọn khớp; query key có pair/timeframe; không retry/poll/focus/reconnect refetch; chưa đặt timeout chart, chưa phân nhánh error code | Giữ cách gọi HTTP, đọc contract mới, xử lý timeout và 401/code |
| `MarketChartCard.tsx` [[10]](#ref-10) | Đọc `ma20` từ response; còn nút Load history | Tính MA ở Web, không vẽ warm-up; áp dụng requirement đã chốt thay cho hành vi mock |
| `apps/api/src/app.ts`, `api/routes/index.ts` [[11]](#ref-11) [[12]](#ref-12) | `createApp({logger, auth, authConfig})`; router chỉ có health và auth-config | Truyền provider từ composition root, dựng service/controller, thêm route và middleware kiểm phiên |

## Interface đề xuất để review

**Trạng thái: Confirmed, product owner đã duyệt sáu interface ngày 2026-11-20.** Bảng này cụ thể hóa các thao tác đã có trong thiết kế [[3]](#ref-3) [[4]](#ref-4). Tên factory và tên method là thiết kế đã duyệt, chưa phải exports đã tồn tại. Không thêm public method để đọc cache hoặc gọi riêng hàm chuẩn hóa chỉ phục vụ test.

| Điểm kiểm thử | Nơi khai báo và signature hiện có hoặc dự kiến | Dependency thay được | Lỗi test có thể bắt | Phần không chứng minh được |
| --- | --- | --- | --- | --- |
| Shared schema | `packages/shared/src/schemas/market-data.schema.ts`, qua public exports của `@crypto-force/shared`: `candleHistoryInputSchema.safeParse(unknown)`, `candleHistorySchema.safeParse(unknown)`, `marketSummarySchema.safeParse(unknown)` đã có. Đề xuất thêm `marketSummaryInputSchema.safeParse(unknown)` | Input literal, không cần I/O | Enum, key thừa, shape và dữ liệu vi phạm invariant | Service thật có gọi schema hay không; dữ liệu được vẽ đúng |
| Service/provider | `services/market-data.service.ts`: đề xuất `createMarketDataService({provider, logger})` trả `getCandleHistory({pair,timeframe}): Promise<CandleHistory>` và `getMarketSummary(pair): Promise<MarketSummary>`. `providers/market-data/market-data-provider.ts`: đề xuất `MarketDataProvider.getCandles({pair,timeframe,limit}): Promise<{candles, dataTime}>`, `getSummary(pair): Promise<MarketSummary>` | Provider giả lập trả thành công, lỗi, dữ liệu sai; logger thu bản ghi | Số nến yêu cầu, warm-up, validation domain, phân loại lỗi, ngữ cảnh log và khả năng thay provider | HTTP Binance, session và UI |
| Binance adapter | `providers/market-data/binance.provider.ts`: đề xuất `createBinanceMarketDataProvider({fetch, now, timeoutMs, logger}): MarketDataProvider` | HTTP fake hỗ trợ `AbortSignal`, clock `now(): number` trả epoch ms, timeout cấu hình; Vitest fake timers cho timer | URL/query, chuẩn hóa kline/summary, timeout, snapshot, 429/418/403, cooldown và không tự retry | Dữ liệu Binance thật, giới hạn IP thực tế và tên header weight trên response thật |
| Cache decorator | `providers/market-data/cached-market-data.provider.ts`: đề xuất `createCachedMarketDataProvider({provider, now, ttlMs, logger}): MarketDataProvider` | Provider có promise điều khiển được, clock và TTL cấu hình | Hit/miss, tách khóa gồm limit, single-flight, lỗi không cache, giữ snapshot | Cache chia sẻ giữa process hoặc nhiều instance |
| HTTP API | `apps/api/src/app.ts`: đề xuất mở rộng `createApp({logger,auth,authConfig,marketDataProvider})`; caller HTTP gọi hai endpoint đã chốt [[4]](#ref-4). Provider được tạo/bọc tại `src/index.ts`, service được dựng bên trong composition root | Provider giả lập, Auth thật trên DB test và logger thu bản ghi; client HTTP loopback | Phiên thiếu/hết hạn/bị thu hồi, query, exact status/code/body, `no-store`, lỗi chung và route wiring | Chuẩn hóa adapter khi test thay provider; browser render |
| Web qua API thật | UI Realtime, các thao tác chọn pair/timeframe/số chart, thử lại và điều hướng. Đề xuất `apps/web/e2e/market-data/rest-history.spec.ts` với cấu hình riêng `playwright.market-data-rest.config.ts` | Upstream HTTP giả lập trong process API; API và session thật, database riêng, clock test khi cần | Cách ly chart/lựa chọn, response cũ, trạng thái, MA, timeout, 401, bàn phím và mô tả chart | Chỉ DOM không chứng minh mọi điểm canvas hoặc tiếng đọc của screen reader; cần kiểm trực quan và assistive technology |

Tên file test dự kiến: `packages/shared/src/schemas/market-data.schema.test.ts` đang có; `apps/api/test/market-data/{service,provider-contract,binance,cached-provider,http}.test.ts` và E2E nêu trong bảng là file mới dự kiến. Logic MA được kiểm qua UI; chỉ thêm test ở interface tính MA nếu Bước 08 có caller production dùng interface đó. Không export helper chỉ cho test [[13]](#ref-13).

### Invariant, thời gian và lỗi của interface

- Input service đã qua query schema; provider nhận `limit` do service quyết định, không nhận query tùy ý từ client. Theo cửa sổ 500 nến và MA(20), lời gọi lịch sử yêu cầu 519 nến. Nguồn và cách tính nằm trong contract [[3, Lịch sử nến]](#ref-3).
- Provider trả nến chuẩn hóa và `dataTime` của lúc nhận upstream. Cache giữ nguyên cả hai. Service kiểm giá, volume, thứ tự, trùng thời gian và mốc timeframe; service trả `warmupCount` theo lịch sử thực nhận. Không bù nến và không làm tròn OHLCV [[3]](#ref-3).
- `now` và timer là hai dependency khác nhau: clock quyết định epoch/snapshot/TTL/cooldown; fake timers điều khiển timeout. Không chỉ đổi `now` rồi chờ timeout thật. Provider timeout phải ngắn hơn 10 giây của chart; Task 1 không đề xuất thêm giá trị timeout [[1]](#ref-1) [[3]](#ref-3).
- Mốc bắt đầu TTL và hành vi tại mốc hết TTL nằm trong [Mô hình cache và cooldown](#mô-hình-cache-và-cooldown). Các assertion còn Proposed phải được duyệt trước khi viết test tương ứng.
- Lỗi transport, timeout và bị giới hạn được adapter báo dưới dạng lỗi có kiểu; service phân loại thành lỗi ứng dụng. Dữ liệu sai sau chuẩn hóa là lỗi dữ liệu nguồn. Tên kiểu lỗi nội bộ chưa chốt; test kiểm kết quả qua service và HTTP, không phụ thuộc class private. Lỗi không lường trước vẫn đi tới handler chung [[3]](#ref-3) [[4]](#ref-4).
- HTTP expected: 200 cho thành công; 401 `UNAUTHENTICATED`, 400 `INVALID_QUERY`, 503 `MARKET_DATA_UNAVAILABLE`, 502 `MARKET_DATA_INVALID`, 500 `INTERNAL_ERROR`, kèm envelope đã chốt. Test kiểm cả body và việc provider có bị gọi hay không khi không có phiên/query sai [[4]](#ref-4).
- Cooldown thuộc adapter dùng chung cho các thao tác Binance trong instance đó. Cache còn hạn trả trước khi gọi adapter. Không tạo abstraction riêng để đọc cooldown; kiểm số HTTP call và kết quả request [[3, Giới hạn request của Binance]](#ref-3).

## Harness và cách chạy

Các lệnh bên dưới chạy từ repo root. Đây là cách chạy được xác định từ script/config, chưa phải kết quả execution của REST mới.

| Phạm vi | Lệnh hiện có hoặc dự kiến | Điều kiện và giới hạn từ source |
| --- | --- | --- |
| Shared contract | `pnpm --filter @crypto-force/shared exec vitest run src/schemas/market-data.schema.test.ts` | Config shared bật `expect.requireAssertions`; không có setup DB [[14]](#ref-14) |
| API Market Data | Dự kiến `pnpm --filter @crypto-force/api exec vitest run test/market-data` sau khi có test | Config hiện tại luôn chạy global setup: tạo lại DB dẫn xuất từ pathname của `DATABASE_URL` cộng `_test`, áp migration; kể cả chỉ lọc test provider vẫn cần PostgreSQL. Không ghi đây là suite không cần DB [[15]](#ref-15) [[16]](#ref-16) [[17]](#ref-17) |
| Web logic thuần | `pnpm --filter @crypto-force/web test` | Vitest chỉ include `app/**/*.test.ts`, `mocks/**/*.test.ts`; không chạy E2E [[18]](#ref-18) |
| UI mock hiện có | `pnpm --filter @crypto-force/web exec playwright test --config playwright.market-data.config.ts` | Hai Web server 5183/5184, proxy tới cổng không có API; project UI chặn service worker, project MSW bật worker. Không chứng minh REST xuyên API [[19]](#ref-19) |
| E2E Auth hiện có | `pnpm test:e2e` | Cấu hình mặc định loại `**/market-data/**`; không dùng lệnh này để khẳng định đã chạy Market Data [[20]](#ref-20) |
| E2E REST dự kiến | `pnpm --filter @crypto-force/web exec playwright test --config playwright.market-data-rest.config.ts` | Cấu hình chưa tồn tại. Cần API thật, upstream fake trong process API, `VITE_API_MOCKING=false`, chặn service worker và không intercept response Market Data ở browser |

Harness Auth hiện có gọi trực tiếp `auth.handler`, không đi qua Express `createApp`; có Auth thật, MemoryMailer và logger thu log. Có thể dùng nó để tạo phiên, nhưng test Market Data HTTP cần thêm server loopback gọi Express và đóng server/pool sau test [[21]](#ref-21).

`test/support/outbound.ts` thay `globalThis.fetch`, chỉ hỗ trợ Pwned Passwords và Google token endpoint; host khác bị ghi vào `outbound.unexpected` rồi throw. Chưa có fake Binance. Chặn fetch này không chứng minh chặn `node:http`, SDK transport hoặc process con; test cần kiểm `outbound.unexpected` để phát hiện lỗi bị app catch [[22]](#ref-22). Process API riêng trong `api-process.ts` không cài stub đó [[23]](#ref-23).

E2E Auth tạo DB `_e2e` và `_e2e_no_google`, chạy cổng Web/API 5173/3000 và 5174/3001; server ghi đè Resend key và email from thành rỗng. Nó kế thừa các biến khác từ process, chưa ép tắt `VITE_API_MOCKING`, chưa cài fake Binance hoặc chặn outbound trong API process. Không tái dùng nguyên cấu hình này cho REST mới [[24]](#ref-24) [[25]](#ref-25).

Task 4 cần thêm harness riêng cho REST: fake upstream có thể trả thành công/lỗi/chậm và ghi call, kiểm không gọi host ngoài danh sách, session trên DB riêng, cleanup tài nguyên. Không dùng mock response ở browser thay cho API thật. Phép làm hỏng fake và mutant check vẫn chưa thực hiện; Bước 08 phải chứng minh độ nhạy sau khi test gốc green [[13]](#ref-13).

## Đối chiếu WCAG 2.2

Đã đọc nguyên văn sáu SC từ bản W3C Recommendation ngày 12/12/2024, vào ngày 2026-11-20 [[26]](#ref-26). Bảng này ghi phạm vi kiểm, không tuyên bố sản phẩm đạt WCAG AA.

| SC và mức | Đối chiếu requirement | Giới hạn |
| --- | --- | --- |
| 1.1.1 Non-text Content — A | Mô tả chart bằng chữ (MK-47) | Chưa chứng minh tương đương toàn bộ thông tin chart |
| 1.4.1 Use of Color — A | Phân biệt tăng/giảm ngoài màu (MK-49) | Kiểm cả nến, không chỉ legend |
| 1.4.10 Reflow — AA | Không cuộn ngang ở 320 CSS px (MK-50) | Ngoại lệ nội dung hai chiều không miễn cho toàn trang |
| 2.1.1 Keyboard — A | Điều khiển bằng bàn phím (MK-46) | Kiểm cả chức năng chart; không mặc định kéo chart được miễn |
| 2.4.7 Focus Visible — AA | Focus nhìn thấy (MK-58) | Có focus trong DOM chưa đủ |
| 4.1.3 Status Messages — AA | Thông báo tải/rỗng/lỗi (MK-48) | Kiểm semantics và screen reader; giữ focus |

Một cột trên màn hình hẹp (MK-59) là quyết định sản phẩm. SC Reflow không bắt buộc layout một cột. Mô tả nến cuối là expected của sản phẩm, chưa đủ để kết luận tương đương toàn bộ chart. Ma trận dưới tách phần kiểm tự động và kiểm thủ công.

## Chọn level, type và technique

Thiết kế này giảm rủi ro lệch contract, sai chỉ báo, lộ phiên, khó chẩn đoán và UI không dùng được trong Test Strategy [[27]](#ref-27). Contract là type kiểm tra. Component chỉ đối tượng kiểm thử của shared, service, adapter hoặc decorator. Integration dùng HTTP API và PostgreSQL thật. E2E đi từ browser qua API thật với upstream giả lập. Việc config API hiện luôn cần DB không biến test adapter thành test tích hợp DB.

| Nhóm rule | Rủi ro và lý do chọn level | Type | Technique và tiêu chí thiết kế |
| --- | --- | --- | --- |
| Query, nến, summary | Sai một trường có thể làm mọi consumer đọc sai. Unit/component shared tìm lỗi tại contract với input literal | Functional, contract, data integrity | EP mỗi partition ít nhất một lần. Enum kiểm từng giá trị. BVA ba giá trị cho giới hạn số nguyên và thời gian |
| Chuẩn hóa và MA | Sai OHLCV hoặc warm-up làm người dùng đọc sai. Component adapter/service kiểm trước UI. E2E chỉ kiểm nối dữ liệu vào chart | Functional, data integrity | EP, BVA độ dài. Oracle viết độc lập. So từng nến đóng theo pair/timeframe/openTime |
| Cache và cooldown | Khóa thiếu hoặc TTL sai có thể trả dữ liệu pair khác hay tiêu giới hạn chung. Component qua public provider đủ quan sát kết quả và call count | Functional, resilience | State transition cho mọi chuyển trạng thái trong bảng. BVA thời gian. Scenario các request đồng thời có promise điều khiển được |
| HTTP và phiên | Client có thể vượt validation hoặc dùng cache sau thu hồi phiên. Integration HTTP với Auth/DB thật kiểm được wiring và kiểm phiên | Functional, security, contract | Decision table cho phiên/query. EP cho dữ liệu upstream và các loại lỗi. Threat model REST bên dưới |
| Lựa chọn, lỗi và hiển thị | Lỗi phối hợp query/UI không thấy ở API. E2E cần browser và API thật | Functional | Scenario cho main/alternative/exception flow. State transition cho tải/thử lại và đổi lựa chọn |
| Accessibility và layout | DOM đúng chưa bảo đảm người dùng đọc hoặc điều khiển được chart. E2E kết hợp kiểm thủ công | Accessibility | Checklist sáu SC WCAG đã đối chiếu. Scenario bàn phím, screen reader và viewport 320 CSS px |
| Dependency và log | Sai import làm mất ranh giới provider. Thiếu log cản phân biệt upstream/backend | Maintainability, observability | Kiểm tĩnh bằng ESLint và review. Component/integration kiểm bản ghi cấu trúc và ngữ cảnh lỗi |

Các criterion trên là lựa chọn thiết kế kiểm thử của agent, không thêm ngưỡng sản phẩm. Baseline hiệu năng và workload thuộc Task 3. Không dùng ma trận Task 2 để xác nhận ngưỡng còn Proposed của thời gian mở/đổi chart (QA-10, QA-11).

### Partitions và giá trị biên

Mỗi case invalid chỉ đổi một thuộc tính của fixture hợp lệ, trừ case tổ hợp ghi riêng trong decision table. EP dùng Each Choice cho các input độc lập. Không gọi enum là BVA. Các số fixture do agent chọn để phân biệt lỗi, không phải dữ liệu thị trường thật hoặc workload.

| Đối tượng | Partition hợp lệ | Partition invalid và case cần thử | Expected và nguồn |
| --- | --- | --- | --- |
| Pair và timeframe | Từng pair `BTCUSDT`, `ETHUSDT`, `SOLUSDT`. Từng timeframe `1m`, `5m`, `15m`, `1h`, `4h`, `1d` | Thiếu, chuỗi rỗng, chỉ khoảng trắng, sai hoa/thường, ngoài enum, `null`, số, array/object. HTTP thêm query lặp cùng key | Schema từ chối, HTTP 400 `INVALID_QUERY`. Enum và strict query từ contract [[1]](#ref-1) [[4]](#ref-4). Query lặp tạo nhiều giá trị, không phải một enum hợp lệ |
| Query theo endpoint | Candles có đúng pair/timeframe. Summary chỉ pair | Từng key thừa: `limit`, `startTime`, `endTime`, `timeframe` ở summary, key tùy ý. Thiếu riêng từng key bắt buộc | 400 và provider không được gọi. Server tự quyết định số nến [[4]](#ref-4) |
| Giá và volume domain | Giá dương hữu hạn. Volume 0 hoặc dương hữu hạn | Mỗi trường thử riêng số âm, giá 0, `NaN`, `Infinity`, `-Infinity`, chuỗi, `null`, thiếu. Volume âm invalid | Schema/service từ chối dữ liệu sai. `NaN`/infinity kiểm ở object JavaScript, không giả vờ là JSON hợp lệ. Qua HTTP thử JSON hỏng/`null` [[3]](#ref-3) |
| OHLC | Low không lớn hơn open/close/high. High không nhỏ hơn open/close | High < low, high < open, high < close, low > open, low > close. Có case open=close và high=low hợp lệ | Không sort/sửa giá để làm hợp lệ. HTTP 502 `MARKET_DATA_INVALID` [[1]](#ref-1) [[3]](#ref-3) |
| Thời gian nến | Integer ms, duy nhất, tăng dần, đúng mốc timeframe | Fractional, sai kiểu, thiếu, trùng, đảo thứ tự, lệch mốc 1 ms. Gap đúng mốc vẫn hợp lệ | Từ chối vi phạm. Giữ gap, không tạo nến [[1]](#ref-1) [[3]](#ref-3) |
| Mốc timeframe | UTC 00:00 đúng mốc cho cả sáu timeframe. Mỗi timeframe có hai nến cách nhau đúng chu kỳ | Dịch riêng một nến khỏi mốc 1 ms. `1d` qua ranh giới ngày UTC dù browser dùng múi giờ khác | UTC quyết định hợp lệ. Múi giờ thiết bị chỉ đổi cách hiển thị [[1]](#ref-1) [[3]](#ref-3) |
| `isClosed` | Mọi nến true, hoặc chỉ nến cuối false | False ở nến không phải cuối, nhiều nến false, thiếu hoặc không boolean | Schema/service từ chối. Adapter dùng closeTime < dataTime. Kiểm dataTime trước/đúng/sau closeTime 1 ms [[3]](#ref-3) |
| Lịch sử và warm-up | Độ dài 0, 1, 19, 20, 21, 499, 500, 501, 518, 519. Warm-up tương ứng 0, 0, 0, 0, 0, 0, 0, 1, 18, 19 | `warmupCount` âm, fractional, sai kiểu, lớn hơn độ dài hoặc khác số nến vượt 500. Provider trả 520 nến là vi phạm limit 519, chưa có policy cắt/báo lỗi | Khớp contract số nến [[3]](#ref-3). Case 520 là phép kiểm invariant của fake/provider contract. Không tự đặt HTTP expected cho vi phạm chưa chốt |
| `dataTime` | Integer epoch ms của lúc nhận upstream | Thiếu, fractional, sai kiểu. Cache hit không được thay giá trị | Kiểm nhận response chậm khác giờ bắt đầu request. Không thêm invariant `openTime <= dataTime` nếu chưa có nguồn [[3]](#ref-3) |
| Summary | Pair khớp request, `lastPrice` dương hữu hạn, `change24hPercent` âm/0/dương hữu hạn | Thiếu/sai kiểu từng trường, lastPrice 0/âm, số không hữu hạn, pair không khớp | Từ chối dữ liệu sai. Không đặt giới hạn ±100 cho phần trăm vì contract không có [[3]](#ref-3) |
| Payload Binance | Kline cố định đủ 12 vị trí. Summary có `lastPrice`, `priceChangePercent` | JSON hỏng, không phải mảng kline, tuple thiếu trường dùng, chuỗi giá không đổi được sang số, thiếu trường summary | Dữ liệu sai phải bị chặn trước Web. Test service/HTTP kiểm 502 cho dữ liệu domain sai. Phân loại lỗi parse payload cần xác nhận ở lát adapter trước assertion HTTP [[3]](#ref-3) [[4]](#ref-4) |

Giá float64 không có bước nhỏ nhất cố định. Vì vậy test giá dùng partition 0/dương/âm, không tuyên bố BVA ba giá trị cho toàn miền float. BVA dùng bước 1 cho số nến và 1 ms cho thời gian fixture. Những chi tiết chưa có oracle ở hai dòng provider vượt limit và lỗi parse được giữ làm gate trước test tương ứng, không được xem là sản phẩm đã vi phạm.

## Fixture và oracle độc lập

Fixture dưới là dữ liệu tổng hợp do agent thiết kế. Mục đích là phát hiện bỏ warm-up, lệch MA, đổi đơn vị volume hoặc làm tròn OHLCV. Fixture không thay bằng chứng mapping với Binance thật. Task 4 tạo input fixtures ở workspace test, không tạo production export phục vụ test [[13]](#ref-13).

Chọn gốc `1735689600000` (2025-01-01 00:00 UTC), timeframe `1m`, pair `BTCUSDT`. Với chỉ số input `i` từ 0, openTime cách nhau 60000 ms. Nến input có open=close=`100+i`, high=`101+i`, low=`99+i`, volume=`10+i`. Đây là công thức sinh **input**, không dùng làm hàm expected trong test. `dataTime=1735720739999` ở bộ 519 nến. CloseTime cuối bằng dataTime nên nến cuối false. Những nến trước true. Adapter fixture giữ thêm các vị trí Binance không dùng với giá trị khác biệt để bắt đọc nhầm cột.

| Fixture | Input và mục đích | Expected literal phải lưu trong test |
| --- | --- | --- |
| `full` | 519 nến theo input trên, MA đủ ở toàn bộ cửa sổ | `warmupCount=19`, hiển thị 500 nến. Nến hiển thị đầu: openTime `1735690740000`, O/H/L/C/V `119/120/118/119/29`, MA `109.5`. Nến cuối: openTime `1735720680000`, `618/619/617/618/528`, MA `608.5`, đang mở và MA tạm |
| `five-hundred` | 500 nến đầu của chuỗi, dataTime `1735719599999` | Warm-up 0, vẽ 500. Nến đầu `100/101/99/100/10`, chưa đủ MA. Điểm MA đầu ở index 19, openTime `1735690740000`, `109.5`. Nến cuối close `599`, volume `509`, MA `589.5` |
| `short` | Prefix 1, 19, 20 và 21 nến. Clock nhận đặt tại closeTime của nến cuối | Warm-up đều 0. 1 và 19 nến không có điểm MA. 20 nến có đúng 1 điểm `109.5`. 21 nến có 2 điểm `109.5`, `110.5`. Thiếu mẫu hiển thị chữ, không hiển thị MA 0 |
| `window-boundary` | Prefix 499, 501 và 518 nến để bắt lỗi quanh 500/519 | 499: warm-up 0, vẽ 499, MA cuối `588.5`. 501: warm-up 1, vẽ 500, close đầu `101`, MA đầu chưa đủ, MA cuối `590.5`. 518: warm-up 18, vẽ 500, close đầu `118`, điểm đầu chưa đủ, điểm kế `109.5`, MA cuối `607.5` |
| `empty` | Mảng rỗng nhưng provider thành công | `candles=[]`, warm-up 0, giữ dataTime. UI thông báo rỗng, không vẽ MA/volume giả, có mô tả trạng thái |
| `gap` | Input 21 nến, xóa nến index 10. Giữ openTime của các nến còn lại. Nến cuối false | 20 nến thật, warm-up 0. Không có openTime `1735690200000`. Điểm MA duy nhất ở `1735690800000`, giá trị `110`. Vẽ 20 nến, không vẽ nến giả ở gap |
| `flat` | 20 nến close/open/high/low đều `100`, volume `0` | MA cuối `100`, volume `0` vẫn hợp lệ. Dùng thêm nến tăng `100/102/99/101` và giảm `101/102/99/100` cho kiểm ngoài màu |
| `decimal` | Tuple `[1735689600000,"100.125","102.875","99.0625","101.375","12.625",1735689659999,"1262.5",7,"6.25","631.25","0"]` | Khi dataTime `1735689660000`: domain O/H/L/C/V `100.125/102.875/99.0625/101.375/12.625`, isClosed true. Không lấy quote volume `1262.5` hoặc taker volume `6.25` |
| `summary` | BTC lastPrice `"618.125"`, percent `"-1.25"`. ETH `"218.5"`/`"0"`. SOL `"18.25"`/`"2.5"` | Domain đúng pair, số `618.125/-1.25`, `218.5/0`, `18.25/2.5`. Đổi timeframe không đổi summary hoặc gọi lại summary |
| `invalid` | Clone bộ hợp lệ. Mỗi case đổi đúng một thuộc tính theo bảng partitions | Schema reject hoặc service báo dữ liệu nguồn sai. HTTP 502, chart không vẽ nến. Không dùng fixture success chung rồi chỉ assert status 200 |
| `selection` | Pair/timeframe khác nhau có close/volume cuối khác nhau. Promise giữ response BTC/5m cho tới khi ETH/1h xong | Expected từng lựa chọn lấy từ manifest literal của fixture, không tính từ nhãn đang render. Response cũ không xuất hiện dưới nhãn mới |

Với bộ `full`, phép tính tay cho MA đầu là tổng 100 đến 119 bằng 2190, chia 20 bằng 109.5. MA cuối là tổng 599 đến 618 bằng 12170, chia 20 bằng 608.5. Bộ `gap` giữ close 100 đến 120 trừ 110, tổng 2200, chia 20 bằng 110. Các phép tính này giải thích oracle. Test chỉ nhận literal, không import hàm MA hoặc hằng số production để tự tính expected.

Đối chiếu dữ liệu dùng manifest literal được review độc lập với generator. Task 4 phải lưu expected OHLCV của **mọi nến đóng** theo khóa pair/timeframe/openTime trong fixture tham chiếu. So đủ các khóa và giá trị, không chỉ nến đầu/cuối. Các giá trị nhị phân biểu diễn chính xác ở fixture trên cho phép so chính xác sau mapping. Nếu dùng số thập phân khác cần tolerance thì ghi tolerance và lý do riêng, không tự áp một sai số cho tiêu chí 0 nến lệch (MK-51). Không so hai phiên bản của nến đang mở tại thời điểm khác nhau.

Metadata số thập phân của ba pair chưa có giá trị chốt trong test basis. Theo quyết định metadata [[28, ADR-005]](#ref-28), Bước 08 phải ghi nguồn tick size trước khi chốt literal chuỗi giá cho fixture `decimal`. Task 4 có thể kiểm không hiển thị giá khác 0 thành 0, nhưng không tự đặt số chữ số của pair. Test định dạng giá cần literal lấy từ metadata đã có nguồn.

## Mô hình cache và cooldown

TTL 5000 ms lấy từ cache thiết kế [[3]](#ref-3). **Proposed — chờ product owner duyệt:** TTL bắt đầu khi provider resolve thành công. Entry còn hạn khi elapsed < 5000 ms, hết hạn khi elapsed >= 5000 ms. Lý do đề xuất: tái sử dụng đủ 5 giây sau khi nhận dữ liệu, dù upstream trả chậm. Thiết kế hiện tại chỉ quy định TTL 5 giây, chưa quy định mốc bắt đầu và dấu so sánh. Đề xuất bổ sung hai chi tiết đó, không đổi giá trị TTL. Không viết assertion chốt mốc này trước khi được duyệt.

Test dùng clock cấu hình độc lập với `dataTime`. Ví dụ request bắt đầu ở clock 0, provider resolve ở 2000. Theo đề xuất, tại 6999 hit, 7000 miss, 7001 miss. Mỗi case biên bắt đầu từ cache mới để miss ở 7000 không thay kết quả của 7001. Snapshot vẫn mang dataTime do provider trả, không phải clock của lần đọc cache.

| Trạng thái trước | Sự kiện và guard | Trạng thái sau, kết quả và side effect |
| --- | --- | --- |
| Empty hoặc Expired | Request đầu cho khóa K | Pending. Gọi provider đúng một lần |
| Pending | Request tiếp theo cùng K | Pending. Chờ chung. Không tăng provider call |
| Pending | Request khác K | Pending riêng. Gọi provider cho khóa mới, không chờ K |
| Pending | Provider resolve | Fresh. Mọi waiter nhận cùng giá trị nến và snapshot |
| Pending | Provider reject | Empty. Mọi waiter nhận lỗi. Request sau tạo lời gọi mới |
| Fresh | Đọc trước TTL | Fresh. Không gọi provider, không đổi dataTime/isClosed |
| Fresh | Không có request dù clock qua TTL | Expired quan sát ở lần đọc sau. Không tự gọi provider |
| Fresh/Expired | Đọc đúng hoặc sau TTL | Pending. Một lần gọi mới. Hành vi biên phụ thuộc duyệt đề xuất TTL |

Các event resolve/reject khi không có Pending không phải thao tác trên public interface nên ngoài model. Không thêm method nội bộ để ép transition. Case snapshot: tạo nến cuối false, tiến clock qua closeTime nhưng còn trong TTL, đọc lại vẫn false và giữ dataTime. Case tách khóa thay riêng pair, timeframe, limit, rồi summary pair. Nến và summary cùng pair không được đụng namespace cache. Limit là input provider, không phải HTTP query.

Cooldown từ HTTP 429/418 dùng clock nhận response và `Retry-After` theo giây [[3]](#ref-3). Fixture chọn `Retry-After: 2`, clock nhận 1000. Đây là input mô phỏng header, không phải thời hạn cấu hình production. Tại 2999 không gọi upstream, tại 3000 được gọi theo nghĩa hết thời gian chờ. Mỗi biên dùng instance sạch. Với header thiếu/hỏng, test phải xác nhận không retry tự động và không lộ upstream. Không tự đoán thời hạn cooldown fallback.

| Trạng thái adapter/cache | Thao tác | Expected và số HTTP call thêm |
| --- | --- | --- |
| Ready, miss | Upstream trả 429 hoặc 418 | Unavailable, bắt đầu Blocked. Thêm đúng 1 call, không retry |
| Blocked, miss | Gọi nến khác pair/timeframe hoặc gọi summary trước hết hạn | Unavailable ngay, thêm 0 call. Cooldown dùng chung trong instance |
| Blocked, fresh cache | Đọc khóa đã cache | Thành công với snapshot cũ, thêm 0 call |
| Blocked, cache vừa hết hạn | Đọc khóa trước hết cooldown | Unavailable, không trả entry hết hạn, thêm 0 call |
| Blocked | Clock tới hết cooldown rồi caller gửi request | Có thể gọi upstream, thêm 1 call. Không tự gọi khi chỉ tiến clock |
| Ready | Upstream trả 403, 5xx hoặc lỗi mạng | Unavailable, không retry. Request caller kế tiếp được gọi lại, không giữ rejection |
| Ready, Pending | Upstream không trả lời tới timeout cấu hình 5000 ms | AbortSignal bị abort, một lỗi unavailable. Tại 4999 còn pending, 5000 timeout, 5001 không phát sinh retry |

Timeout API 5000 ms là cấu hình fixture được kế hoạch Bước 07 yêu cầu kiểm [[29, Task 2]](#ref-29). Test không suy ra đây là timeout production bắt buộc vì kiến trúc chỉ yêu cầu nhỏ hơn 10 giây. Clock epoch không thay thế fake timers điều khiển timeout. Kiểm late resolve sau abort không biến request đã timeout thành thành công. Với promise chưa resolve, dùng deferred signal thay fixed wait.

## Ma trận requirement → kịch bản → test → evidence

Các nhãn dạng `schema/query` là tên kịch bản cục bộ, không cấp requirement ID mới. Cột requirement liên kết về use case [[1]](#ref-1), quality attributes [[2]](#ref-2) và contract [[3]](#ref-3) [[4]](#ref-4). Mỗi dòng là một nhóm case cần tách thành test theo partitions hoặc flow đã nêu. **Trạng thái tất cả: Designed, chưa viết hoặc chạy test.**

Tên file dưới là code test **dự kiến**, chưa phải link tới file có thật:

- `schema`: `packages/shared/src/schemas/market-data.schema.test.ts`.
- `service`, `provider-contract`, `binance`, `cached-provider`, `http`: `apps/api/test/market-data/<tên>.test.ts`.
- `rest-history`: `apps/web/e2e/market-data/rest-history.spec.ts`.
- `manual`: checklist trong execution khi có implementation, kèm phiên bản browser/OS/screen reader.

Evidence tự động cần lưu test name, command, commit/diff, input fixture và assertion thực tế. API thêm status/body/header, provider/upstream call trace và log đã bỏ secret. E2E thêm trace, request trace và screenshot cần cho assertion hình. Manual lưu bước, actual và ảnh hoặc bản ghi lời đọc. Không ghi Passed khi chỉ có thiết kế hoặc source review.

| Kịch bản và requirement | Precondition | Thao tác | Expected result | Level / type / technique | Code dự kiến và evidence riêng |
| --- | --- | --- | --- | --- | --- |
| `schema/query`: lựa chọn hợp lệ, strict query (MK-30, MK-32) | Input literal | Parse từng enum, từng partition query | Nhận đúng enum, reject thiếu/sai/thừa | Component / contract / EP | `schema`, `http`: từng safeParse result, 400/code và 0 provider call |
| `schema/candles`: OHLCV/thời gian (MK-45, MK-51, MK-52) | `decimal`, `invalid` | Parse rồi gọi service với từng invariant sai | Giữ nguyên OHLCV hợp lệ. Reject nến sai, trùng, sai thứ tự/mốc | Component / data integrity / EP, BVA | `schema`, `service`: field bị đổi, exact error qua HTTP, manifest từng nến |
| `schema/snapshot`: nến mở và dữ liệu (MK-25, MK-27) | `full` | Đổi riêng isClosed/warmupCount/dataTime | Đúng kiểu, chỉ cuối có thể false, warm-up đúng chiều dài | Component / contract / EP, BVA | `schema`, `service`: từng input và kết quả parse/domain |
| `adapter/mapping`: khớp nguồn (MK-23, MK-51, MK-52) | HTTP fake trả tuple `decimal` và manifest `full` | Gọi public provider nến | Request `/api/v3/klines`, symbol/interval/limit đúng. Giữ OHLCV và base volume. Không sort/lấp gap | Component / data integrity / example, EP | `binance`: URL/query và đối chiếu mọi nến đóng với manifest |
| `adapter/closed`: nến mở (MK-25, MK-26, MK-28) | Cố định closeTime `1735689659999` | Nhận tại `1735689659998`, `1735689659999`, `1735689660000` | isClosed lần lượt false, false, true. dataTime là clock nhận | Component / functional / BVA | `binance`: ba snapshot, clock bắt đầu/nhận khác nhau |
| `service/window`: MA và cửa sổ (MK-24, MK-33) | Provider domain `full`, `five-hundred`, `window-boundary` | Gọi service lịch sử | Provider nhận limit 519. Warm-up 19/0/0/1/18 đúng fixture. Không trả MA do API tính | Component / functional, contract / BVA | `service`, `provider-contract`: args và body không có `ma20` |
| `ui/ma`: MA/volume của chart (MK-01, MK-15, MK-23, MK-24, MK-28, MK-29) | API thật trả `full`, `short`, `flat` ở các chart | Mở chart, đọc nến đầu/cuối | Các literal MA/volume đúng fixture. Warm-up không vẽ. Thiếu mẫu là chữ. MA nến mở có nhãn tạm và timeframe đúng | E2E / data integrity / scenario, BVA | `rest-history`, `manual`: text/crosshair, ảnh chart xác nhận vùng warm-up không xuất hiện |
| `ui/gap`: lịch sử thật (MK-35, MK-36) | `gap` | Mở chart, đọc hai phía gap | 20 nến thật, MA cuối 110. Không tạo nến ở openTime thiếu | E2E / data integrity / scenario | `service`, `rest-history`, `manual`: manifest và ảnh/crosshair tại gap |
| `ui/default`: mặc định (MK-04, MK-30, MK-31, MK-32) | Phiên hợp lệ, cache rỗng | Mở Realtime | BTCUSDT, 4 chart 5m/15m/1h/4h. UI có 3 pair, 6 timeframe. API có 4 request nến + 1 summary | E2E / functional / main scenario, EP | `rest-history`: lựa chọn, chart, API/upstream trace, không đếm request session như Market Data |
| `ui/timeframe`: cách ly chart (MK-06, MK-08, MK-29) | Bốn chart đã tải, summary literal | Đổi riêng chart 5m sang 1d | Chỉ chart đó tải mới, các chart khác giữ dữ liệu. Summary không đổi và không gọi lại | E2E / functional / alternative scenario | `rest-history`: before/after text, request count theo endpoint/key |
| `ui/pair`: pair chung (MK-07) | ETH fixture khác BTC | Chọn ETHUSDT | Mọi chart và summary dùng ETH, giữ timeframe từng chart. Không hiện OHLCV BTC dưới nhãn ETH | E2E / functional / alternative scenario | `rest-history`: manifest mỗi chart, summary, request keys |
| `ui/count`: giữ timeframe (MK-04, MK-05) | Đặt chart thứ tư 1d | Chọn 1 rồi 2 rồi 4 chart | Đúng số chart. Chart hiện lại vẫn 1d. Dữ liệu dưới nhãn đúng lựa chọn | E2E / functional / state transition | `rest-history`: ảnh/text từng trạng thái. Không tự bắt buộc refetch khi hiện lại nếu test basis không quy định |
| `ui/stale`: response cũ (MK-14, MK-17) | Upstream giữ response BTC/5m | Đổi pair rồi timeframe, cho response mới hoàn tất trước, release response cũ | Dữ liệu mới giữ nguyên, không gắn dữ liệu cũ. Chart khác không bị thay do đổi timeframe | E2E / functional / state transition, concurrency scenario | `rest-history`: thứ tự resolve, API trace và text trước/sau release |
| `ui/reopen`: mất lựa chọn (MK-37) | Chọn ETH/1d/1 chart | Reload. Lặp lại sau đi màn khác rồi mở Realtime | Cả hai đường đều về mặc định BTC và 4 timeframe | E2E / functional / alternative scenario | `rest-history`: lựa chọn trước/sau mỗi đường |
| `ui/loading-empty`: trạng thái (MK-10, MK-11, MK-62) | Upstream giữ rồi trả `empty` | Mở/đổi chart | Loading cho chart, MA/volume không giữ giá trị timeframe trước. Sau resolve có thông báo rỗng riêng | E2E / functional / state transition | `rest-history`: DOM ở Loading và Empty, request trace |
| `ui/chart-error`: lỗi và retry (MK-12, MK-38, MK-39, MK-45) | Một chart trả unavailable hoặc invalid, chart khác thành công | Xem lỗi, thử lại, giữ response retry rồi trả thành công | Chart lỗi không vẽ nến sai, retry riêng. Retry disabled khi Loading. Các chart khác không đổi. Không lộ stack/URL/payload | E2E / functional / exception scenario | `rest-history`: trạng thái, call count chỉ chart lỗi và sentinel không xuất hiện |
| `ui/summary`: sidebar độc lập (MK-08, MK-18, MK-60) | Nến thành công, summary lỗi | Retry sidebar rồi đổi timeframe | Sidebar phục hồi đúng giá/percent pair, không có MA/volume. Chart không bị tải lại. Timeframe không đổi summary | E2E / functional / exception scenario | `rest-history`: summary literals, absence MA/volume, request trace |
| `ui/isolation`: chart lỗi, sidebar tốt (MK-12, MK-18) | Summary thành công, một chart lỗi | Retry chart | Giá/sidebar vẫn đúng, không chuyển lỗi hoặc tải lại | E2E / functional / exception scenario | `rest-history`: snapshot summary và summary call count |
| `ui/timeout`: hạn chờ Web (MK-34, MK-38) | Auth/API thật. Test transport không trả response candles tới Web, không sửa body. Browser clock điều khiển được | Tiến 9999, 10000, 10001 ms từ bắt đầu tải. Mỗi case riêng | Trước hạn Loading. Đúng hạn Error và retry. Response đến muộn không thay Error bằng dữ liệu của lựa chọn cũ | E2E / resilience / BVA, state transition | `rest-history`: timestamp tương đối, state, late-response trace. Không dùng upstream chậm với timeout API 5 giây để giả chứng minh timeout Web |
| `ui/candle-info`: đọc nến và snapshot (MK-26, MK-27, MK-41) | `full`, `decimal`, clock cố định | Hover/chạm nến đóng và mở | Có giờ/OHLCV/MA của nến chọn. Nến cuối ghi đang mở. Thời điểm dữ liệu là dataTime từng chart | E2E + manual / functional / scenario | `rest-history`, `manual`: text literal và đối chiếu canvas/crosshair |
| `ui/zoom`: giới hạn lịch sử (MK-33, MK-42, MK-61) | `full` | Zoom in/out, kéo về hai đầu | Xem được chi tiết trong 500 nến đã tải, không lộ 19 warm-up, không có Load history, không gọi thêm lịch sử | E2E + manual / functional / scenario | `rest-history`, `manual`: ảnh trước/sau, request trace |
| `ui/time-price`: múi giờ/giá (MK-43, MK-44) | Browser UTC rồi Asia/Bangkok. Metadata có nguồn | Đọc cùng openTime và giá decimal | UTC 00:00 thành Bangkok 07:00, có nhãn múi giờ. Giá theo metadata, không đổi OHLCV, không biến giá khác 0 thành 0 | E2E + manual / functional / EP, scenario | `rest-history`, `manual`: timezone config, literal formatted price sau khi có nguồn metadata |
| `ui/attribution`: nguồn chart (MK-02) | Chart đã tải | Đọc attribution | TradingView đọc được ở desktop và 320 CSS px | E2E + manual / accessibility / checklist | `rest-history`, `manual`: link/text và ảnh độ dễ đọc |
| `a11y/keyboard`: bàn phím/focus (MK-46, MK-58) | Realtime ở Loading/Ready/Error | Tab/Shift+Tab qua pair, count, mỗi timeframe, retry. Kích hoạt bằng phím phù hợp. Thử chức năng zoom/kéo bằng bàn phím | Mọi điều khiển hoạt động. Focus nhìn thấy và không bị bẫy. Chức năng chart không tự được miễn | E2E + manual / accessibility / WCAG checklist, scenario | `rest-history`, `manual`: focus sequence, ảnh focus và thao tác chart thực tế |
| `a11y/description`: mô tả (MK-47) | `full`, `short`, `empty`, lỗi | Đọc accessible description từng chart | Có pair/timeframe/close/MA nến cuối. Thiếu MA/rỗng/lỗi có mô tả phù hợp, không đọc số 0 giả | E2E + manual / accessibility / WCAG checklist | `rest-history`, `manual`: accessibility tree và actual screen-reader speech. Chỉ chứng minh mô tả sản phẩm, không toàn bộ SC 1.1.1 |
| `a11y/status`: thông báo (MK-48) | Focus ở timeframe, chart request pending | Release success/empty/error rồi retry | Loading/empty/error có semantics thông báo, screen reader đọc được, focus không chuyển | E2E + manual / accessibility / state transition, WCAG checklist | `rest-history`, `manual`: activeElement trước/sau và bản ghi lời đọc, không suy ra speech từ `aria-live` |
| `a11y/color`: ngoài màu (MK-49) | Nến tăng/giảm của `flat` variant | Xem chart khi bỏ tín hiệu màu | Phân biệt được tăng/giảm bằng dấu hiệu khác màu trên nến, không chỉ legend | Manual / accessibility / WCAG checklist | `manual`: ảnh và mô tả dấu hiệu thực tế |
| `a11y/narrow`: reflow (MK-50, MK-59) | Viewport 320 CSS px, 4 chart | Duyệt pair/timeframe/retry, xem toàn trang | Chart một cột, document không cuộn ngang, điều khiển không mất | E2E + manual / accessibility / WCAG checklist | `rest-history`, `manual`: scrollWidth/clientWidth và screenshot toàn trang |
| `http/session`: quyền truy cập (MK-40) | Auth thật, DB test, có fresh cache | GET hai endpoint với phiên thiếu/hỏng/hết hạn/bị thu hồi | 401 `UNAUTHENTICATED`. Không gọi provider và không trả cache cho client không có quyền | Integration / security, contract / decision table, threat model | `http`: exact status/envelope, provider count, DB session state không lưu cookie |
| `ui/session`: hết phiên (MK-40) | Người dùng ở Realtime | Thu hồi phiên server, đổi timeframe để phát request, đăng nhập lại | Màn chặn workspace. Sau login quay về Realtime theo quy tắc Auth hiện có | E2E / security, functional / exception scenario | `rest-history`: 401 trace, route trước/sau, không nhận diện lỗi chỉ bằng status |
| `http/errors`: envelope/no-store (MK-39, MK-45) | Query và phiên hợp lệ | Provider thành công, lỗi có phân loại, nến sai, lỗi không lường trước | 200/domain, 503/unavailable, 502/invalid, 500/internal. Error có `error.code` và message chung. Thành công có no-store | Integration / contract, security / EP | `http`: status/body/header và sentinel upstream không lộ |
| `provider/replace`: thay provider (QA-09) | Hai fake cùng interface, không có kiểu Binance | Gọi service/API với từng fake | Cùng request/response contract. Service gọi đúng thao tác và limit 519, Web không đổi | Component + integration / modifiability / scenario | `provider-contract`, `service`, `http`: args/output. Review import riêng, không khẳng định chi phí provider thật thứ hai |
| `cache/transitions`: TTL/snapshot | Clock/deferred provider mới mỗi case | Thực hiện mọi dòng model cache, tách key và hai outcome single-flight | Call count và snapshot đúng bảng, reject không giữ lại, không làm mới nền | Component / resilience / state transition, BVA | `cached-provider`: clock timeline, args, resolve/reject của mọi waiter |
| `adapter/cooldown`: chặn upstream | Fake HTTP, clock, cache decorator | Thực hiện mọi dòng model cooldown, cả nến và summary | Đúng call count. 429/418 chặn toàn instance. Fresh cache còn dùng. 403/timeout không retry | Component + integration / resilience / state transition, BVA | `binance`, `cached-provider`, `http`: HTTP trace, signal abort và 503/code |
| `logs/context`: quan sát | Logger thu structured records | Success/miss/hit/coalesced, unavailable, invalid | Có ngữ cảnh và mức log theo bảng bên dưới, không có credential | Component + integration / observability / scenario, checklist | `service`, `binance`, `cached-provider`, `http`: log records đã lọc secret |
| `boundaries/imports`: ranh giới | Diff production Bước 08 | ESLint và review source | Provider không biết Express/DB/service. Service chỉ biết interface. Web chỉ gọi API app | Static review / maintainability / checklist | Review Bước 08: command/output ESLint từng file và đường import được kiểm |

### Decision table và threat model REST

Hai điều kiện phiên hợp lệ và query hợp lệ có bốn tổ hợp. Giữ cả bốn, không rút gọn: trường hợp cả hai sai cần xác nhận thứ tự kiểm. Với cả hai sai, test hiện chỉ bắt buộc từ chối và provider count 0. **Proposed:** ưu tiên 401 trước validation, để request chưa đăng nhập luôn qua cùng kiểm phiên. Lý do: tránh lộ hành vi validation trước kiểm quyền. Test basis chưa chốt ưu tiên này. Chưa dùng 401 làm assertion cho tổ hợp cả hai sai trước khi duyệt. Mỗi hàng chạy cho cả candles và summary [[4]](#ref-4).

| Phiên hợp lệ | Query hợp lệ | Expected | Provider call |
| --- | --- | --- | --- |
| Có | Có | 200 nếu provider trả dữ liệu hợp lệ | 1 khi cache rỗng |
| Có | Không | 400 `INVALID_QUERY` | 0 |
| Không | Có | 401 `UNAUTHENTICATED` | 0 |
| Không | Không | Từ chối. Exact status/code còn Proposed như trên | 0 |

Tài sản cần bảo vệ là phiên, dữ liệu chart đúng lựa chọn và quota upstream. Trust boundary là browser → Express/Auth/DB và API → upstream. Threat model này bổ sung case REST, không thay review bảo mật Auth và không tuyên bố ASVS compliance.

| Đe dọa | Đường tấn công và tác động | Control và case kiểm |
| --- | --- | --- |
| Spoofing/elevation | Gọi thẳng endpoint bằng cookie giả hoặc đã thu hồi để dùng quota và lấy response từ fresh cache | `http/session`, kiểm Auth thật trước trả dữ liệu |
| Tampering | Gửi query lặp/thừa/limit tùy ý hoặc upstream có dữ liệu sai, làm tăng tải hoặc sai giá | `schema/query`, `schema/candles`, `http/errors` |
| Information disclosure | Gây lỗi upstream có URL/stack/payload sentinel, đọc chi tiết hoặc credential từ response/log | `http/errors`, `ui/chart-error`, `logs/context` |
| Denial of service | Gửi nhiều request cùng khóa, hoặc khác khóa trong cooldown, làm tiêu quota chung | `cache/transitions`, `adapter/cooldown`. Không kiểm tải công khai ngoài phạm vi bằng cách gọi Binance thật |
| Repudiation/thiếu truy vết | Request lỗi không có ngữ cảnh để xác định pair/timeframe hay nguyên nhân upstream | `logs/context` theo yêu cầu observability hiện có, không thêm audit cá nhân |

Các đe dọa trên có tác động tới dữ liệu hoặc khả dụng của REST. Chưa lượng hóa likelihood và không đặt thang điểm mới. Chiều sâu kiểm dựa trên control cụ thể: từng partition invalid, mọi transition trong model và từng tổ hợp decision table. Authentication/session dùng baseline đã có của project, không tự thêm lifetime hoặc cơ chế Auth trong Task 2.

### E2E và phần kiểm thủ công

Main flow là đăng nhập → mở mặc định → nhận chart và summary đúng. Alternative flow tách riêng đổi timeframe, đổi pair, đổi số chart, reload và rời/quay lại Realtime. Exception flow tách riêng upstream lỗi chart, summary lỗi, dữ liệu sai, response cũ, timeout, empty và phiên bị thu hồi. Mỗi flow có precondition và postcondition ở ma trận, không chỉ assert màn cuối.

Model UI dùng Loading → Ready/Empty/Error theo outcome. Error → Loading khi retry. Retry trong Loading không gửi request nữa. Ready/Loading → Loading của khóa mới khi đổi lựa chọn. Response khóa cũ tới không chuyển state khóa mới. 401 ở trạng thái đang tải → màn chặn workspace. Không đưa refresh lỗi giữ dữ liệu cũ vào model vì hành vi đó chỉ bắt đầu từ polling (MK-13).

Harness E2E dùng API thật và upstream fake trong process API như Task 1. Với timeout Web, transport test giữ response sau khi API xử lý, hoặc dùng server test không gửi xong response. Transport không thay body Market Data, không bật MSW. Đây là fault injection mạng riêng, không phải bằng chứng API gọi upstream tới 10 giây. Clock Web được cài trước request. API timeout được kiểm riêng bằng clock/timer của adapter. Sau timeout, release response để kiểm không gắn dữ liệu sai và cleanup connection.

Canvas cần đối chiếu trực quan: vùng warm-up, giá trị crosshair, gap, zoom/kéo, nến tăng/giảm ngoài màu và focus nhìn thấy. Assert DOM có nhãn đúng không chứng minh pixel chart đúng. Screen reader cần kiểm bằng assistive technology thật: mô tả từng chart, loading/empty/error, giữ focus, retry và thiếu mẫu MA. Từng phần tự động/manual có kết quả riêng, không dùng một kết quả DOM Passed cho toàn bộ requirement accessibility.

### Log và dependency boundaries

Tên field log cụ thể có thể đổi trong implementation. Test kiểm ý nghĩa và giá trị của structured fields, không snapshot toàn câu message. Nguồn expected là Observability và dependency rules trong thiết kế [[3]](#ref-3).

| Nơi kiểm | Expected tự động | Phần review hoặc giới hạn |
| --- | --- | --- |
| Service lịch sử | Pair, timeframe, requested=519, received theo fixture, provider duration và total service duration hữu hạn không âm, outcome/group lỗi. Invalid có loại vi phạm và openTime, mức error. Lỗi upstream mức warn | Chưa chốt seam clock service. Task 4 chỉ kiểm có duration hợp lệ. Exact duration cần seam đo thời gian có caller thực trước khi assert |
| Service summary | Pair, outcome, thời gian. Không gắn timeframe giả cho summary | Không bắt summary có số nến |
| Decorator | Key, hit/miss và có chờ single-flight. Debug log đúng trạng thái test | Không thêm public getter cho cache |
| Adapter | 429/418 có warn, Retry-After và weight khi header fixture có. HTTP trace chứng minh không retry | Header weight thật chưa xác nhận, regression dùng header mô phỏng, không báo đã kiểm Binance thật |
| HTTP | Method/path/status/duration tương ứng request, không lộ cookie/token/secret | Không snapshot logger runtime có timestamp/request ID thay đổi |
| Import | ESLint các file thay đổi chặn route/controller gọi adapter, service import concrete adapter, provider import Express/service/DB | Đọc import và composition root là source review, không phải behavioral test. Gate Bước 08 thêm layer rules cùng folder provider |

## Mutation và phép kiểm fake dự kiến

Các phép kiểm dưới **chưa chạy**. Task 4 phải ghi được test nào đã tới assertion, test nào còn thiếu module/harness. Bước 08 chỉ chạy mutation sau khi test gốc green. Mỗi lần thay đổi một hành vi, yêu cầu assertion liên quan fail, khôi phục rồi xác nhận green. Không dùng lỗi syntax/import làm bằng chứng độ nhạy [[13]](#ref-13).

| Mutation hoặc fault | Test/kịch bản phải phát hiện | Evidence cần lưu khi thực hiện |
| --- | --- | --- |
| Đổi close hoặc dùng quote volume thay base volume dù HTTP 200 | `adapter/mapping`, `ui/ma`, `ui/candle-info` | Key nến và expected/actual OHLCV/MA lệch |
| Bỏ nến warm-up, lấy sai cửa sổ MA, hoặc vẽ warm-up | `service/window`, `ui/ma`, `ui/zoom` | WarmupCount, MA literal và ảnh/crosshair sai |
| Tạo nến lấp gap hoặc chia MA theo số phút đã trôi | `ui/gap`, `adapter/mapping` | Thừa key nến hoặc MA cuối khác 110 |
| Bỏ pair/timeframe/limit trong cache key hoặc gộp namespace summary | `cache/transitions`, `ui/pair`, `ui/timeframe` | Call trace/key và payload khác expected |
| Cho response cũ ghi đè lựa chọn mới | `ui/stale` | Lựa chọn giữ mới nhưng giá/volume cũ xuất hiện |
| Dùng giờ bắt đầu TTL sai, đổi dấu hết hạn, hoặc làm mới snapshot lúc hit | `cache/transitions`, `adapter/closed` | Hit/miss và dataTime/isClosed sai tại biên đã duyệt |
| Bỏ single-flight hoặc giữ rejected promise | `cache/transitions` | Thừa provider call, hoặc retry không tạo call mới |
| Bỏ cooldown, chỉ chặn một endpoint, hoặc chặn cả fresh cache | `adapter/cooldown` | HTTP call phát sinh trong Blocked hoặc fresh cache trả lỗi |
| Bỏ kiểm phiên hoặc dùng cookie cache bỏ qua thu hồi | `http/session`, `ui/session` | Có dữ liệu/200 thay 401, hoặc UI không chặn |
| Fake timeout không tôn trọng AbortSignal, fake giữ response cũ không release được | `adapter/cooldown`, `ui/timeout`, `ui/stale` | Abort quan sát được, waiter kết thúc đúng lỗi, late response có thể được phát ra và không ghi đè |
| Fake luôn thành công hoặc nuốt lỗi outbound | `http/errors`, `ui/chart-error`, `ui/summary` | Từng lỗi thực sự tới assertion đúng nhóm. Unexpected outbound làm test fail dù app catch lỗi |

Không sửa expected để giết mutant. Fault làm hỏng fake phải làm test sản phẩm fail ở kết quả cần kiểm. Nếu chưa có production để chứng minh, ghi phép kiểm fake chưa thực hiện và giữ gate Bước 08. Source review kiểm tránh module mock, private method hoặc export chỉ dùng bởi test. Kiểm tự động ở Task 4–08 dùng ESLint cho file test thay đổi, không coi review là bằng chứng behavior đã chạy.

## References

1. <a id="ref-1"></a>[Market Data](../../../UCs/market-data.md)
2. <a id="ref-2"></a>[Quality Attributes](../../../UCs/quality-attributes.md)
3. <a id="ref-3"></a>[Market Data & Realtime Updates](../../../architecture/10-market-data.md)
4. <a id="ref-4"></a>[API & Realtime Communication Contracts](../../../architecture/22-api-endpoints.md)
5. <a id="ref-5"></a>[Kết quả thiết kế contract nến và API REST](../../../build/01-prototype-to-implementation/market-data/work/step-05-rest-contract/execution.md)
6. <a id="ref-6"></a>[Kết quả thiết kế database và cache cho REST](../../../build/01-prototype-to-implementation/market-data/work/step-06-rest-storage-cache/execution.md)
7. <a id="ref-7"></a>[Shared Market Data schema](../../../../packages/shared/src/schemas/market-data.schema.ts)
8. <a id="ref-8"></a>[Web Market Data HTTP access](../../../../apps/web/app/api/market-data.ts)
9. <a id="ref-9"></a>[Web Market Data query hooks](../../../../apps/web/app/hooks/useMarketData.ts)
10. <a id="ref-10"></a>[MarketChartCard](../../../../apps/web/app/pages/Realtime/components/MarketChartCard.tsx)
11. <a id="ref-11"></a>[API createApp](../../../../apps/api/src/app.ts)
12. <a id="ref-12"></a>[API router](../../../../apps/api/src/api/routes/index.ts)
13. <a id="ref-13"></a>[Testware](../../../conventions/testware.md)
14. <a id="ref-14"></a>[Shared Vitest config](../../../../packages/shared/vitest.config.ts)
15. <a id="ref-15"></a>[API Vitest config](../../../../apps/api/vitest.config.ts)
16. <a id="ref-16"></a>[API test global setup](../../../../apps/api/test/global-setup.ts)
17. <a id="ref-17"></a>[API test database](../../../../apps/api/test/test-database.ts)
18. <a id="ref-18"></a>[Web Vitest config](../../../../apps/web/vitest.config.ts)
19. <a id="ref-19"></a>[Market Data mock Playwright config](../../../../apps/web/playwright.market-data.config.ts)
20. <a id="ref-20"></a>[Default Playwright config](../../../../apps/web/playwright.config.ts)
21. <a id="ref-21"></a>[Auth test harness](../../../../apps/api/test/support/harness.ts)
22. <a id="ref-22"></a>[API test outbound stub](../../../../apps/api/test/support/outbound.ts)
23. <a id="ref-23"></a>[API process test support](../../../../apps/api/test/support/api-process.ts)
24. <a id="ref-24"></a>[E2E environment](../../../../apps/web/e2e/environment.ts)
25. <a id="ref-25"></a>[E2E server](../../../../apps/web/e2e/server.ts)
26. <a id="ref-26"></a>W3C, _Web Content Accessibility Guidelines (WCAG) 2.2_, Recommendation 12/12/2024, SC [1.1.1](https://www.w3.org/TR/2024/REC-WCAG22-20241212/#non-text-content), [1.4.1](https://www.w3.org/TR/2024/REC-WCAG22-20241212/#use-of-color), [1.4.10](https://www.w3.org/TR/2024/REC-WCAG22-20241212/#reflow), [2.1.1](https://www.w3.org/TR/2024/REC-WCAG22-20241212/#keyboard), [2.4.7](https://www.w3.org/TR/2024/REC-WCAG22-20241212/#focus-visible), [4.1.3](https://www.w3.org/TR/2024/REC-WCAG22-20241212/#status-messages).
27. <a id="ref-27"></a>[Test Strategy](../../test-strategy.md)
28. <a id="ref-28"></a>[Architectural Decisions](../../../architecture/30-decisions.md)
29. <a id="ref-29"></a>[Kế hoạch kiểm chứng REST và baseline](../../../build/01-prototype-to-implementation/market-data/work/step-07-rest-verification/plan.md)
