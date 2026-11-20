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

Contract expected nằm trong thiết kế nến, cache và chuẩn hóa [[3]](#ref-3), cùng endpoint và lỗi HTTP [[4]](#ref-4). Các việc chuyển từ Bước 05–06 gồm kiểm phiên bị thu hồi, mã HTTP/code, lịch sử ngắn, `isClosed`, chuẩn hóa kline, TTL, single-flight, không cache lỗi, tách khóa, cooldown và giữ `dataTime` của snapshot [[5]](#ref-5) [[6]](#ref-6). Task 2 sẽ gắn từng kịch bản với literal expected và evidence cụ thể.

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
- Nguồn thời gian để bắt đầu TTL và hành vi đúng tại mốc hết TTL cần được ghi rõ trong thiết kế case ở Task 2 trước khi test biên. Không suy ra từ implementation chưa có.
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

Một cột trên màn hình hẹp (MK-59) là quyết định sản phẩm; SC Reflow không bắt buộc layout một cột. Mô tả nến cuối là expected của sản phẩm, chưa đủ để kết luận tương đương toàn bộ chart. Task 2 cần ghi phần kiểm tự động và kiểm thủ công riêng, giữ giới hạn này khi báo kết quả.

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
