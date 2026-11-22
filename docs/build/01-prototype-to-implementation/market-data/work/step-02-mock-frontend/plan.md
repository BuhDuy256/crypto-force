# Kế hoạch dựng frontend Realtime bằng mock

Đọc file này để biết cách tổ chức code, quản lý dữ liệu và kiểm chứng frontend Realtime trong Bước 2.

## Mục tiêu và phạm vi

Dựng flow REST trên Realtime theo phạm vi đã thống nhất: pair chung, 1/2/4 chart, timeframe riêng, nến, volume, MA(20), giá/thay đổi 24h và bảng thông tin [[1]](#ref-1). Prototype cung cấp bố cục và tương tác tham chiếu, không cung cấp code production để chuyển nguyên sang React [[2]](#ref-2).

Bước này dùng HTTP mock, chưa nối Binance hoặc API Market Data thật. Live updates, polling và phục hồi kết nối giữ đúng increment sau trong abstract plan [[3]](#ref-3). Không hiển thị “Live” hoặc độ trễ Binance giả. Trạng thái dữ liệu thể hiện đã tải, đang tải hoặc tải lỗi. Tín hiệu BUY/SELL và Signals from đã hoãn [[1]](#ref-1).

Product owner đã duyệt các lựa chọn kỹ thuật dưới đây để triển khai Bước 2. Schema HTTP vẫn là draft phục vụ UI, chưa phải API contract production. Các business rules có nhãn Proposed tiếp tục chờ chốt requirements. Kết quả thực chạy nằm trong [bằng chứng triển khai](execution.md).

## Skills và rules áp dụng

| Skill | Khi dùng | Ảnh hưởng đến cách triển khai |
| --- | --- | --- |
| `writing-plans` | Lập và tự review plan | Mỗi increment có file sở hữu, interface, đầu ra và kiểm chứng |
| `graphify` | Khám phá code và trước khi đổi shared symbol | Query trước đọc source, dùng affected để xác định consumers, update graph sau sửa code |
| `vercel-react-best-practices` | Viết React và query hooks | Query độc lập chạy song song, state suy ra không dùng effect, tránh render và tải lại không cần thiết. Không áp dụng hướng dẫn Next.js hoặc thay TanStack Query bằng SWR |
| `shadcn` | Chọn và compose controls | Tận dụng primitives hiện có, semantic tokens và `cn`. Charts selector dùng ToggleGroup. Đọc component docs phù hợp trước khi thêm primitive |
| `playwright-cli` | Kiểm tra flow thật trong browser | Kiểm tra tương tác, responsive, focus và lifecycle chart |
| `write-use-case` | Ghi bản nháp hành vi ở cuối từng increment | UI quan sát được nằm trong UCs, không đưa hook/query/API mechanism vào use case |
| `review-change` | Trước khi hoàn thành increment có code/test/UC | Reviewer mới kiểm diff và conventions sau các kiểm tra tự động |
| `verification-before-completion` | Trước khi báo kết quả | Chỉ báo đạt theo command output và browser evidence đã có |
| `ste-vi` / `ste-en` | Viết tài liệu hoặc text cho agent đọc | Theo ngôn ngữ của text. Error/status strings áp dụng Strict |

Rules bắt buộc từ Code và Project Structure: page/component không import API, effect chỉ nằm trong hooks, không import mocks từ application modules, contracts HTTP thuộc shared [[4]](#ref-4) [[5]](#ref-5). Không tạo layer, context hoặc generic chart framework chỉ để đủ cấu trúc. Test theo Testware và Test Strategy, không gọi browser mock test là E2E backend thật [[6]](#ref-6) [[7]](#ref-7).

## Điểm xuất phát và điều chỉnh cách thực hiện

Khi bắt đầu triển khai, đã kiểm tra source: `apps/web/app/routes/realtime.tsx` chỉ render ScreenPlaceholder. `app/root.tsx` đã có QueryClientProvider. `app/entry.client.tsx` đợi MSW trước hydrate khi bật cờ dev. `mocks/handlers.ts` đang rỗng và `mocks/browser.ts` bypass request không có handler. Không tạo lại các cơ chế này.

`apps/web/vitest.config.ts` chỉ include `app/**/*.test.ts`, chưa có môi trường render React. `apps/web/playwright.config.ts` hiện khởi động hai server Auth với PostgreSQL. `packages/engine/src/index.ts` chưa export indicator. Những nhận định này lấy từ source đã đọc, không suy ra từ tài liệu kiến trúc.

**Proposed, điều chỉnh cách thực hiện:** abstract plan đặt schema shared ở Bước 8, nhưng convention yêu cầu HTTP mock và API client cùng dùng shared schema [[3]](#ref-3) [[4]](#ref-4). Đưa một schema nháp tối thiểu lên increment đầu của Bước 2. Ghi rõ schema này là draft phục vụ UI. Bước 5 đối chiếu lại endpoints, timestamps, pagination và response, Bước 8 nối backend thật. Không sửa abstract plan hoặc coi draft là contract backend đã chốt.

MA của Bước 2 là chuỗi điểm tham chiếu tính trước trong fixture, hiển thị cùng nến tương ứng. Không tạo thuật toán indicator riêng trong Web hoặc MSW. Kiểm tra fixture bằng ví dụ tính tay. Cách tính indicator production và nơi cung cấp MA được chốt khi thiết kế REST, tránh dựng engine trước phạm vi bước này.

## Tổ chức code và interface dự kiến

Các đường dẫn bên dưới là file dự kiến, chỉ tạo khi increment cần đến. Component riêng của Realtime colocate trong page, hooks/API theo layer của repo [[5]](#ref-5).

| File từ gốc repo | Trách nhiệm và interface |
| --- | --- |
| `apps/web/app/routes/realtime.tsx` | Giữ meta và render RealtimePage, tái sử dụng workspace layout/auth guard |
| `apps/web/app/pages/Realtime/RealtimePage.tsx` | Compose toolbar, grid và sidebar. Không giữ bản sao query data |
| `apps/web/app/pages/Realtime/components/RealtimeToolbar.tsx` | Props pair, chartCount và callbacks thay lựa chọn |
| `apps/web/app/pages/Realtime/components/MarketChartCard.tsx` | Nhận chartId, pair, timeframe và callback. Gọi hook cho query chart đó, render trạng thái và chart |
| `apps/web/app/pages/Realtime/components/CandlestickChart.tsx` | Container chart, gọi hook quản lý thư viện. Không fetch hoặc tính indicator |
| `apps/web/app/pages/Realtime/components/MarketSummary.tsx` | Giá/thay đổi 24h, MA/volume có nhãn timeframe, trạng thái query tương ứng |
| `apps/web/app/hooks/useRealtimeWorkspace.ts` | UI state pair, chartCount, timeframe theo slot ID ổn định và event handlers |
| `apps/web/app/hooks/useMarketData.ts` | `useCandleHistory(pair, timeframe)` và `useMarketSummary(pair)`, query keys, AbortSignal, refetch theo key |
| `apps/web/app/hooks/useCandlestickChart.ts` | Tạo chart/series, áp dụng dataset, resize và cleanup. Trả container ref, không lộ chart instance cho page |
| `apps/web/app/api/market-data.ts` | `getCandleHistory({ pair, timeframe }, signal)` và `getMarketSummary(pair, signal)`. Fetch same-origin, kiểm HTTP status và parse Zod |
| `packages/shared/src/schemas/market-data.schema.ts` | Draft input/response schemas và inferred types. Không chứa MA algorithm hoặc fixture |
| `packages/shared/src/index.ts` | Public exports của draft schemas/types |
| `apps/web/mocks/market-data.handlers.ts` | MSW handlers đúng method/path, parse input, response theo shared schema |
| `apps/web/mocks/fixtures/market-data.ts` | Nến, volume, điểm MA tính trước và summary theo pair/timeframe. Dữ liệu tất định |
| `apps/web/mocks/handlers.ts` | Đăng ký handlers mới, giữ bypass cho endpoint khác |
| `apps/web/app/utils/market-chart.ts` | Mapper thuần từ timestamps/values sang chart series. Không I/O hoặc thuật toán indicator |
| `apps/web/playwright.market-data.config.ts` | Browser suite riêng cho UI mock, không thay config Auth |
| `apps/web/e2e/market-data/realtime.spec.ts` | Assertions trên UI và HTTP requests, không import fixture development |
| `apps/web/e2e/market-data/msw-smoke.spec.ts` | Smoke với service worker và development handlers thật, tách khỏi suite route interception |

Draft đề xuất: `GET /api/market-data/candles?pair=...&timeframe=...` trả `{ pair, timeframe, candles, ma20 }`; `GET /api/market-data/summary?pair=...` trả `{ pair, lastPrice, change24hPercent }`. Candle có `openTime`, OHLCV dạng number, thời gian Unix milliseconds. Điểm MA có `openTime`, `value`. Client mapper chuyển milliseconds sang đơn vị chart yêu cầu đúng một lần. Đây là đề xuất representation, không phải Binance payload hoặc endpoint đã tồn tại.

Pair/timeframe ban đầu lấy từ các lựa chọn prototype. Khởi tạo chartCount 4, timeframe theo slot là 1m/5m/15m/1h. Selector timeframe có thêm 4h [[2]](#ref-2). Không lấy số nến fixture làm giới hạn tải lịch sử production.

## State, query và lifecycle chart

- Workspace hook sở hữu pair chung và các slot ID cố định. Chọn ít chart hơn chỉ unmount chart cuối, vẫn giữ timeframe trong workspace state. Không cần global store hoặc localStorage.
- Query nến dùng key `['market-data', 'candles', pair, timeframe]`. Query summary dùng `['market-data', 'summary', pair]`. Cùng pair/timeframe chia sẻ cache và request, không thêm chartId vào key.
- Đổi timeframe cập nhật một slot. Đổi pair đổi key của mọi chart đang hiện và summary. Truyền AbortSignal vào fetch. Không dùng placeholder data từ key cũ để hiển thị dưới nhãn pair mới.
- Chart và summary tải song song. Một chart lỗi không chặn grid. Retry chỉ refetch key tương ứng, không invalidate cả prefix. Nếu hai chart cùng key, cả hai nhận kết quả dùng chung.
- Bước này tắt polling và refetch tự động do focus/reconnect cho các query Market Data. Không đổi default QueryClient toàn ứng dụng. Bấm tải lịch sử ở bước mock refetch dataset của key hiện tại, không giả vờ nối thêm nến. Dùng nhãn trung tính “Load history”, chưa cam kết tải 1,000 nến [[1]](#ref-1).
- Hook chart tạo instance khi mount, cập nhật series khi dataset đổi, không dựng lại chart khi giá sidebar đổi. Cleanup observer, listeners và chart khi unmount, kể cả StrictMode mount/cleanup/mount. Dataset pair/timeframe mới được replace, không append vào series cũ.
- Trạng thái initial loading, empty, error tách khỏi background fetching. Nếu refetch cùng key lỗi, giữ dữ liệu trước đó kèm thông báo refresh lỗi. Không hiển thị thành công từ fixture fallback.
- **Proposed:** sidebar MA/volume theo slot đầu tiên, luôn có nhãn timeframe. Giá và phần trăm 24h thuộc pair, không tính từ vùng nến đang xem. Khi đổi timeframe slot đầu, sidebar dùng cùng query nến, không tạo request riêng.
- **Proposed:** dữ liệu mock dưới 20 nến không có điểm MA cho đoạn chưa đủ mẫu, UI hiện chưa đủ dữ liệu. Không thay bằng số 0. Đây là hành vi nháp để đối chiếu trong Bước 3.

## Các increment và kiểm chứng

Mỗi increment kết thúc bằng bản chạy được, kiểm tra theo phạm vi và review-change. Checkbox dưới đây theo dõi các đầu ra đã được kiểm chứng.

### Increment 1: Một chart thật đi qua HTTP mock

- [x] Trước khi sửa shared symbol, chạy Graphify affected và đọc consumers. Tạo draft schemas/exports, API module, query hook, MSW handlers/fixture và mapper theo bảng file.
- [x] Thay placeholder bằng RealtimePage có một chart nến, volume và MA. Giữ app header và auth guard hiện có. Dùng shadcn primitives và Tailwind tokens, không import prototype source hoặc inline CSS của prototype.
- [x] Tạo browser config riêng, giới hạn testDir ở `e2e/market-data`. Dev server bật `VITE_API_MOCKING=true`, dùng session mock chỉ trong browser test để qua auth guard. Không sửa auth production hoặc dùng tài khoản thật. Mỗi suite dùng port trống, không tái sử dụng server chưa biết cấu hình.
- [x] Test mapper tại `app/utils/market-chart.test.ts`: timestamps đúng đơn vị, OHLC/volume giữ nguyên và không sửa input. Fixture parse được bằng schema. Dùng bộ close từ 1 đến 20 để đối chiếu điểm MA đầu bằng 10.5, tính tay cho test. Đây là dữ liệu kiểm thử do agent đề xuất, không phải giá thị trường. Browser kiểm chart có nến/volume/MA, labels và attribution hiển thị.

**Đầu ra:** chart dùng Lightweight Charts, dữ liệu đi theo Page → hook → API → HTTP → MSW. Không cần backend/DB cho suite mock. Kiểm tra StrictMode không tạo canvas hoặc listener trùng.

### Increment 2: Workspace multi-chart

- [x] Thêm workspace hook, toolbar và MarketChartCard theo bảng file. Selector 1/2/4 chart dùng ID slot ổn định. Mỗi card tự subscribe query theo pair/timeframe.
- [x] Viết browser tests: 4 → 1 → 4 giữ timeframe, đổi timeframe một slot không gửi request cho key khác, hai slot cùng timeframe dùng chung request/cache.
- [x] Kiểm chart resize khi đổi số cột, card ẩn được cleanup và mobile xếp một cột. Kiểm điều khiển bằng bàn phím và accessible name riêng từng timeframe selector.

**Đầu ra:** multi-chart hoạt động độc lập, không remount toàn grid khi đổi một timeframe.

### Increment 3: Pair và bảng thông tin

- [x] Thêm pair selector, summary query và MarketSummary. Thêm fixture phân biệt rõ từng pair để test không thể đạt bằng dữ liệu cứng BTC.
- [x] Browser test đổi pair cập nhật toàn bộ chart và summary. Giữ response cũ bằng request gate, trả response mới trước rồi thả response cũ. Assert nhãn và dữ liệu cuối vẫn thuộc pair mới.
- [x] Assert giá/thay đổi 24h không đổi theo timeframe chart. Sidebar MA/volume theo slot đầu với nhãn timeframe, loading/error theo đúng nguồn dữ liệu.

**Đầu ra:** màn hình hiển thị đúng pair, không trộn dữ liệu chart và sidebar.

### Increment 4: Trạng thái lỗi và hoàn thiện UI

- [x] Thêm loading, empty, error, retry và trạng thái giữ dữ liệu khi refetch lỗi. Error messages không lộ stack hoặc payload nội bộ.
- [x] Browser route interception điều khiển response chậm, rỗng, sai schema và HTTP lỗi cho từng request. Suite này chặn request trước service worker bằng cấu hình browser block service workers, không để page.route bị MSW che. Test data thuộc test, không import development fixtures.
- [x] Kiểm retry một key không tải lại các key khác, summary lỗi không làm mất chart, MA thiếu mẫu không hiện 0. Dùng điều kiện/assertion hoặc request gate, không sleep cố định.
- [x] Kiểm desktop/tablet/mobile, keyboard focus, labels, thông tin đọc được ngoài canvas và attribution. Chạy axe trên màn hình chính và trạng thái lỗi, xử lý serious/critical theo Test Strategy [[7]](#ref-7).
- [x] Cấu hình hai project trong browser config riêng: project UI block service workers và chỉ chọn `realtime.spec.ts`, project smoke allow service workers và chỉ chọn `msw-smoke.spec.ts`. Không để cùng một test chạy nhầm cả hai chế độ.
- [x] Chạy smoke với service worker thực sự bật và MSW handlers thật để chứng minh dev bootstrap hoạt động. Chạy tắt mock và xác nhận request đi backend/lỗi thật, không fallback fixture. Không coi phiên này là kiểm chứng API Market Data đã có.

**Đầu ra:** UI dùng được khi dữ liệu chậm hoặc tải lỗi. Browser evidence ghi đúng phần đã quan sát, không chỉ kiểm canvas tồn tại rồi kết luận nến/MA đúng.

### Increment 5: Ghi nhận hành vi và chuẩn bị chuyển sang requirements

- [x] Trong từng increment, ghi hành vi đã review vào bản nháp `docs/UCs/market-data.md`, cập nhật mục lục UCs. Dùng `write-use-case` và conventions tương ứng. Không tự nâng Proposed thành Confirmed.
- [x] Ghi vấn đề cần product owner quyết vào `docs/open-questions.md`, tham chiếu từ UCs theo ID. Đối chiếu MA thiếu mẫu, sidebar, tải lịch sử và nến đang mở tại Bước 3.
- [x] Ghi bằng chứng chạy UI mock trong folder làm việc của Bước 2 khi thực hiện. Phân tích và bằng chứng kiểm thử chính thức của REST thuộc `docs/testing/market-data.md` ở các bước sau [[3]](#ref-3).
- [x] Đối chiếu phạm vi Bước 1, kiểm production build không chứa mocks/MSW và ghi kết quả vào tracker. Chỉ đánh dấu Bước 2 hoàn thành khi UI đã chạy và được kiểm chứng.

## Lệnh kiểm chứng khi triển khai

Các lệnh dưới đây là kế hoạch, chưa phải kết quả chạy. Chạy từ repo root và truyền đúng danh sách file đã sửa.

| Phạm vi | Lệnh và điều kiện đạt |
| --- | --- |
| Code Web/shared | `pnpm exec eslint <files>` và `pnpm --filter @crypto-force/web typecheck`. Chạy thêm shared typecheck khi đổi schema |
| Public exports | `pnpm check:exports` sau khi thêm exports shared |
| Helpers | `pnpm --filter @crypto-force/web test -- app/utils/market-chart.test.ts`, assertions kiểm giá trị đã tính trước |
| Browser mock suite | `pnpm --filter @crypto-force/web exec playwright test --config playwright.market-data.config.ts`, mọi scenario nêu trên đạt |
| Build và mock guard | `pnpm --filter @crypto-force/web build` với cờ mock bật, build vẫn loại mock runtime/asset |
| Docs | `pnpm exec prettier --check <files>` và `pnpm check:docs` |
| Review | `review-change`, giải quyết findings trước khi báo increment hoàn thành |

Vì thêm shared schema, xác định workspace tiêu thụ bằng Graphify affected trước khi chọn thêm kiểm tra. Không chạy toàn repo `pnpm check`. Không commit khi người dùng chưa yêu cầu. Không cài React test renderer chỉ để chạy lại các browser scenarios bằng công cụ khác.

## References

1. <a id="ref-1"></a>[Phạm vi flow REST đầu tiên](../step-01-rest-scope/plan.md)
2. <a id="ref-2"></a>[Realtime](../../../../../design/prototype/docs/requirements/realtime.md)
3. <a id="ref-3"></a>[Kế hoạch triển khai Market Data ở mức tổng quan](../../abstract-implementation-plan.md)
4. <a id="ref-4"></a>[Coding Guidelines](../../../../../conventions/code.md)
5. <a id="ref-5"></a>[Project Structure](../../../../../conventions/project-structure.md)
6. <a id="ref-6"></a>[Testware](../../../../../conventions/testware.md)
7. <a id="ref-7"></a>[Test Strategy](../../../../../testing/test-strategy.md)
