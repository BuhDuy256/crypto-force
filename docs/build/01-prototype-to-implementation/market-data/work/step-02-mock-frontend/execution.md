# Bằng chứng triển khai frontend mock

Đọc file này để biết kết quả kiểm chứng Bước 2 và các điều chỉnh so với plan.

## Điều kiện và điều chỉnh

- Ngày thực hiện: 2026-11-20. Node v22.23.5, pnpm 9.15.9 theo output CLI.
- Source ban đầu khớp plan: route Realtime là placeholder, QueryClientProvider và MSW bootstrap đã có, handlers rỗng.
- UI project dùng port 5183, tắt mock và chặn service worker. Smoke project dùng port 5184, bật mock. Khi cùng bật mock và chặn worker, MSW không khởi động được và app không hydrate. Hai server tách cache, từ chối tái sử dụng server có sẵn.
- Schema shared là draft cho UI. API production chưa được phê duyệt. Không sửa abstract plan.

## Increment 1

Mapper test đạt 1/1. Smoke nhận HTTP 200 từ worker thật với pair, timeframe và điểm MA đầu đúng fixture. Browser suite đạt 2/2. Mutant bỏ phép chia timestamp cho 1000 làm mapper fail. Mutant xóa chart làm UI test fail, mutant bỏ handlers làm smoke fail. Đã khôi phục source. Playwright-cli mở Realtime bằng session mock tại browser context. Ảnh trực tiếp cho thấy nến, volume, MA và attribution. Reviewer mới đã kiểm increment 1. Findings về claims và ranh giới UC đã sửa.

## Increment 2

UI suite đạt 3/3: render, cache/ẩn-hiện timeframe, resize và bàn phím mobile. Mutant không cập nhật timeframe làm test cache fail. Mutant bỏ hai cột làm test resize fail. Đã khôi phục source. Selector Charts dùng role radio theo Radix hiện cài. Bàn phím đợi focus của option trước khi nhấn phím tiếp theo.

Reviewer increment 2 phát hiện coverage chỉ đo card. Đã thêm đo chart thực tế. Mutant bỏ observer và cố định chiều rộng 600 làm assertion chart resize fail. Kiểm trực tiếp bằng playwright-cli: 4 → 1 → 4, mobile 390 × 844 còn 4 chart, không tràn ngang.

## Increment 3

Browser suite đạt 6/6 trước khi bổ sung gate hoàn tất response cũ. Giá mẫu BTC 123, ETH 234 và SOL 345 chứng minh summary phân biệt pair. Mutant bỏ pair khỏi summary key giữ giá 123 sau khi chọn ETH, làm test fail. Fixture test và mapper đạt 2/2. Fixture được parse cho 15 tổ hợp pair/timeframe. Ví dụ chuẩn hóa close 1..20 cho MA đầu 10.5. Mutant đổi MA đầu thành 10.6 làm fixture test fail.

Mutant giữ placeholder của pair cũ làm test gate fail: vẫn thấy giá chart BTC khi ETH đang tải. Đã khôi phục. Gate chờ handler cũ hoàn tất trước assertions cuối.

## Increment 4

Schema draft từ chối OHLC mâu thuẫn, timestamps không tăng hoặc trùng và MA không khớp nến. Các kiểm tra này bảo vệ thư viện chart khỏi input không hợp lệ, chưa chốt contract production. Test shared mới đạt 1/1 trước mutation.

Browser lần đầu đạt 8/10. Axe phát hiện màu nút Retry kế thừa Alert, contrast 4.06:1. Đã sửa nút dùng text-foreground. Mock tắt trả 502 từ Vite proxy khi upstream không chạy. Test đã điều chỉnh theo output thực tế, kiểm thêm không có chart fixture.

Config Auth trước exclusion chọn 167 tests, gồm 6 tests Market Data. Đã thêm testIgnore cho market-data, giữ nguyên servers Auth. Hai server mock dùng upstream không có dịch vụ tại 127.0.0.1:1 để kiểm lỗi proxy mà không gọi backend hoặc dịch vụ ngoài.

Sau sửa contrast, suite đạt 10/10: 9 UI tests và 1 smoke MSW. Axe không có serious/critical ở desktop 1440, tablet 768, mobile 390 và trạng thái refresh lỗi. Config Auth sau exclusion chọn 161 tests trong 8 files, không chạy suite Market Data.

Mutant biến HTTP lỗi thành empty success làm 3 tests fail: trạng thái riêng từng chart, giữ dữ liệu khi refresh lỗi và tắt mock không fallback. Mutant bỏ kiểm consistency làm shared schema test fail. Đã khôi phục. Bổ sung kiểm chart đầu không remount khi đổi timeframe chart khác và so số listener window/document bằng Chromium CDP sau 4 → 1 → 4.

## Increment 5: Đối chiếu đầu ra

| Đầu ra của plan | Code hoặc tài liệu sở hữu | Bằng chứng |
| --- | --- | --- |
| HTTP draft, validation và mock | [Shared schema](../../../../../../packages/shared/src/schemas/market-data.schema.ts), [API module](../../../../../../apps/web/app/api/market-data.ts), [handlers](../../../../../../apps/web/mocks/market-data.handlers.ts) | Shared schema test, fixture test cho các lựa chọn, smoke dùng worker thật |
| Route và page đúng layer | [Route](../../../../../../apps/web/app/routes/realtime.tsx), [Page](../../../../../../apps/web/app/pages/Realtime/RealtimePage.tsx) | Route giữ meta, page compose UI. Scoped ESLint và reviewers đạt |
| Nến, volume, MA và attribution | [Chart hook](../../../../../../apps/web/app/hooks/useCandlestickChart.ts), [mapper](../../../../../../apps/web/app/utils/market-chart.ts) | Mapper test, fixture MA tính tay, browser render/attribution, ảnh desktop đã xem |
| Pair chung, timeframe riêng, ẩn/hiện chart | [Workspace hook](../../../../../../apps/web/app/hooks/useRealtimeWorkspace.ts), [query hooks](../../../../../../apps/web/app/hooks/useMarketData.ts) | Browser kiểm 4 → 1 → 4, request theo key, cache chung, lựa chọn riêng từng slot |
| Cleanup và resize | Chart hook, query hooks | Chart đầu giữ DOM khi đổi slot khác. Sau 4 → 1 → 4 còn đúng số chart và số listener window/document không tăng. Chart đổi chiều rộng theo card |
| Giá/thay đổi 24h và MA/volume sidebar | [MarketSummary](../../../../../../apps/web/app/pages/Realtime/components/MarketSummary.tsx) | Browser đổi BTC → ETH, kiểm giá/24h giữ nguyên khi timeframe đổi, volume và nhãn theo chart đầu |
| Không nhận nhầm response cũ | Query hooks, API module | Request gate giữ ETH, trả SOL trước rồi thả ETH. Nhãn và giá cuối vẫn thuộc SOL |
| Loading, empty, error, retry và refresh lỗi | [MarketChartCard](../../../../../../apps/web/app/pages/Realtime/components/MarketChartCard.tsx), MarketSummary | HTTP interception điều khiển chậm, rỗng, sai schema và lỗi. Retry chỉ tải key tương ứng. Refresh lỗi giữ giá trị cũ. MA thiếu mẫu không hiện số không |
| Browser suite tách khỏi Auth | [Config Market Data](../../../../../../apps/web/playwright.market-data.config.ts), [config Auth](../../../../../../apps/web/playwright.config.ts) | 9 UI tests block worker, 1 smoke allow worker. Auth --list chỉ chọn 161 tests trong 8 files |
| Responsive, bàn phím và accessibility | Controls và chart cards | Browser keyboard/focus, resize desktop/mobile, axe trên desktop/tablet/mobile và refresh lỗi |
| Mock bật/tắt đúng boundary | MSW bootstrap hiện có và handlers mới | Smoke nhận dữ liệu thật từ MSW. Tắt mock nhận HTTP 502, không có worker controller, không có chart fixture |
| UC và câu hỏi cần chốt sau | [Market Data](../../../../../UCs/market-data.md), [câu hỏi mở](../../../../../open-questions.md) | Bản nháp giữ Proposed. Gap dẫn tới OQ-032, OQ-082, OQ-083, OQ-084 |
| Production loại mock | Production guard hiện có | Build Web với VITE_API_MOCKING=true đạt. Guard duyệt module của bundle, không có worker asset trong output |
| Phạm vi Bước 1 | [Phạm vi](../step-01-rest-scope/plan.md) | Có đầy đủ flow tải lịch sử. Không thêm backend, polling, WebSocket, phục hồi kết nối, BUY/SELL hoặc strategy selector |

## Kết quả kiểm chứng cuối

| Lệnh hoặc phiên kiểm | Kết quả thực chạy |
| --- | --- |
| pnpm --filter @crypto-force/web typecheck | Đạt |
| pnpm --filter @crypto-force/shared typecheck | Đạt |
| pnpm --filter @crypto-force/api typecheck | Đạt, kiểm consumer của shared exports |
| pnpm --filter @crypto-force/worker typecheck | Đạt, kiểm consumer của shared exports |
| pnpm --filter @crypto-force/web test | 9/9 trong workspace: 2 test Market Data mới và 7 test auth-redirect hiện có |
| pnpm --filter @crypto-force/shared test | 34/34 trong package: 1 test Market Data mới và 33 test hiện có |
| pnpm --filter @crypto-force/web exec playwright test --config playwright.market-data.config.ts | 10/10: 9 UI mock tests và 1 smoke MSW. Chromium, hai server riêng, không DB/backend |
| pnpm exec eslint với toàn bộ file TypeScript đã thay đổi | Đạt |
| pnpm check:exports | Đạt |
| pnpm exec prettier --check với file đã thay đổi | Đạt cho source. Cấu hình repo bỏ qua Markdown, nên tài liệu được kiểm thủ công theo convention và bằng check:docs |
| pnpm check:docs | Đạt |
| pnpm --filter @crypto-force/web build với VITE_API_MOCKING=true | Đạt. Guard không phát hiện mock runtime trong bundle. Không có worker asset |
| graphify update . | Đạt, chỉ AST |
| playwright-cli | Đã kiểm trực tiếp pair, layout, chart và tắt mock. ETH hiển thị 3,072 USDT. Mobile không tràn ngang. Mock tắt: status 502, worker false, charts 0 |
| review-change | Reviewer mới cho từng increment 1–5. Findings đã sửa. Review cuối không có finding mới |

Các ảnh chụp đã được mở và xem: [desktop](desktop.png), [tablet](tablet.png), [mobile](mobile.png), [mock tắt và lỗi upstream](mock-off-error.png). Đây là evidence UI mock, không phải bằng chứng API Market Data production hoặc kết nối Binance.

Chưa kiểm backend Market Data thật, dữ liệu Binance thật, DB, polling, WebSocket, phục hồi kết nối hoặc benchmark. Các phần này thuộc các bước sau. Trong phiên triển khai ban đầu, không chạy pnpm check, không commit, push, tạo PR hoặc deploy.

Rule build/ tại dòng 3 của .gitignore hiện bỏ qua cả docs/build/. Các file này ban đầu không hiện trong git diff và reviewer đã đọc trực tiếp. Khi product owner yêu cầu commit và push, các tài liệu Market Data cùng evidence được stage bằng git add -f. Không sửa cấu hình ignore.
Bước 2 hoàn thành ngày 2026-11-20 sau khi đối chiếu các đầu ra và review cuối. Đã đóng browser và dừng hai web server dùng để kiểm chứng.
