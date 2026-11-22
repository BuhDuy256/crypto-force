# Kế hoạch build và kiểm chứng flow REST xuyên suốt

Đọc file này để biết đầu ra, thứ tự công việc và điều kiện hoàn thành Bước 08 của Market Data.

Các bước dùng checkbox để theo dõi tiến độ.

**Mục tiêu:** build flow REST tải lịch sử theo thứ tự contract dùng chung → provider adapter → service → API → frontend, kiểm chứng từng phần bằng test đã viết ở Bước 07, rồi đo baseline. Sau đó build REST polling thành một bước chạy được riêng [[1, Bước 8]](#ref-1).

**Kiến trúc:** Web → API → Market Data Service → Cache decorator → Binance adapter, theo thiết kế đã chốt [[6]](#ref-6) [[7]](#ref-7). Provider được tạo tại composition root `apps/api/src/index.ts`. Service không biết Binance. Web chỉ gọi API cùng origin.

**Công cụ:** Vitest, Playwright, ESLint theo Test Strategy [[10]](#ref-10). Công cụ phát tải là `k6`, product owner duyệt ngày 2026-11-21 [[3, Môi trường, evidence và cách chạy lại]](#ref-3).

**Đầu vào từ Bước 07:** sáu interface đã duyệt, thứ tự năm lát red → green, fixture tham chiếu, gate mutation và protocol baseline nằm trong bàn giao [[2, Task 5: Bàn giao Bước 08]](#ref-2) và tài liệu kiểm chứng [[3]](#ref-3). Kế hoạch này không lặp lại nội dung đó. Mỗi Task trỏ tới phần tương ứng.

## Ràng buộc

- Code và test tuân theo mục Ranh giới sửa code và test bên dưới [[9]](#ref-9).
- Không thêm `skip`, `only`, `todo`, `eslint-disable`, `@ts-expect-error` hoặc assertion luôn đúng. Không export helper chỉ cho test. Không mock module của app.
- Mỗi lát bắt đầu bằng chạy lại test red. Test bị chặn bởi import hoặc startup phải tới assertion trước khi viết production. Sau đó triển khai tối thiểu để green, review/refactor và chạy lại test [[2, Interface và thứ tự triển khai]](#ref-2).
- Mutation chỉ chạy sau khi test gốc green. Mỗi mutation phải làm assertion liên quan fail. Khôi phục code và xác nhận green sau mỗi mutation. Lỗi import hoặc syntax không chứng minh độ nhạy [[3, Mutation và phép kiểm fake dự kiến]](#ref-3).
- Mỗi commit giữ typecheck của mọi workspace bị ảnh hưởng ở trạng thái đạt, trừ test red có chủ đích của lát sau. Ghi rõ test red còn lại trong commit message.
- Không chạy `pnpm check`. Chọn kiểm tra theo mục Kiểm chứng theo thay đổi của `AGENTS.md`.
- E2E chạy từng spec file với `--workers=1`. Không chạy song song nhiều suite.
- Shell cần `C:/dev_env/nvm/v22.23.5` trong PATH, theo kết quả kiểm tra của Bước 07 [[2, Lệnh và kết quả]](#ref-2). Kiểm tra lại version thực tế trước Task 1.
- Trước khi đọc source, chạy `graphify query`. Trước khi sửa symbol dùng chung, chạy `graphify affected`. Sau khi sửa code, chạy `graphify update .`.
- Không đổi abstract plan. Khi hành vi thực tế khác UCs hoặc thiết kế, ghi phân tích trong execution, chốt lại tài liệu sản phẩm, rồi mới làm tiếp.
- Mỗi giá trị cụ thể do agent đề xuất phải ghi nguồn, lý do và tác động so với nguồn hiện có (LL-004). Kết quả đo chỉ ghi Passed khi evidence chứng minh từng điều kiện (LL-007).

## Ranh giới sửa code và test

Bước 08 viết code production khi test đã có sẵn từ Bước 07. Rủi ro chính là code chỉ đúng với test, hoặc test bị sửa để hết lỗi. Mục này nêu cách Bước 08 chặn các anti-pattern đó và loại thay đổi test được phép. Product owner duyệt ngày 2026-11-21.

### Cách chặn anti-pattern ở Bước 08

Mô tả, ví dụ và nguồn của từng anti-pattern nằm trong tài liệu kiến thức [[14]](#ref-14). Bảng dưới chỉ ghi cách Bước 08 chặn từng nhóm.

| Nhóm            | Anti-pattern                                                                                                           | Cách chặn ở Bước 08                                                                                                                                                                            |
| --------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Code production | Special casing, đọc đáp án có sẵn                                                                                      | Review diff tìm literal của fixture trong `src/`. Thêm case cùng partition với dữ liệu khác fixture. Rule ESLint mới ở Task 2: `apps/*/src` và `apps/web/app` không import `test/` hoặc `e2e/` |
| Code production | Nhánh riêng cho môi trường test                                                                                        | Rule ESLint mới ở Task 2: chỉ `apps/api/src/configs/` được đọc `process.env`                                                                                                                   |
| Code production | Ghi thêm trạng thái                                                                                                    | Không có biến mutable ở module scope trong `src/`. Suite API chạy thêm lượt `--sequence.shuffle`                                                                                               |
| Code production | Chỉ đúng với case có trong test                                                                                        | Đối chiếu với contract. Mutation theo partition                                                                                                                                                |
| Code production | Greedy Catcher                                                                                                         | Test mỗi nhóm lỗi kiểm status, code và body. Rule `testware/exact-status-oracle`                                                                                                               |
| Code production | Nới tham số production, đổi contract cho khớp test                                                                     | Giá trị và contract lấy từ thiết kế. Lệch giữa test và tài liệu xử lý theo loại thay đổi test bên dưới                                                                                         |
| Code production | Thêm API chỉ cho test, đi vòng ràng buộc                                                                               | `check:exports`, interface đã duyệt, rule layer hiện có và rule `providers/` ở Task 2                                                                                                          |
| Code production | Lách type checker                                                                                                      | Ghi lý do của mỗi `as` mới trong `src/` vào commit message                                                                                                                                     |
| Sửa test        | Modify Test Cases, lấy output làm expected, nới assertion, overload phép so sánh, bỏ test, nới cấu hình test hoặc lint | Testware chỉ đọc ở mục bên dưới. Mỗi diff testware thuộc một loại T1–T4. Chạy lại mutation liên quan. Ghi số test trước và sau. Task 1 kiểm Vitest và Playwright có chặn `only` hay không      |
| Sửa test        | Mockery                                                                                                                | Kiểm độ nhạy fake theo gate của Bước 07 [[2, Gate kiểm độ nhạy]](#ref-2). E2E REST không dùng MSW                                                                                              |
| Sửa test        | The Liar, Secret Catcher, Success Against All Odds                                                                     | Chạy red và xác nhận fail tại assertion trước khi viết code. Chạy mutation sau khi green                                                                                                       |
| Sửa test        | Tăng thời gian chờ, Local Hero, Generous Leftovers, Hidden Dependency                                                  | Rule `testware/no-real-time-wait`. Lượt `--sequence.shuffle`. Ghi điều kiện môi trường trong execution                                                                                         |
| Đo kết quả      | Sửa bộ đo, vá bộ chấm, tính trước kết quả, đổi điều kiện sau khi thấy kết quả                                          | Commit script đo, manifest và ngưỡng trước lượt đo. Mốc draw gắn với sự kiện vẽ thật. Phân loại hit/miss bằng log và ledger. Sửa sau khi thấy kết quả là cohort mới                            |

### Loại thay đổi test được phép

Luôn được phép: thêm test mới, hoặc làm assertion chặt hơn khi có nguồn. Sửa hoặc nới test chỉ được phép khi thay đổi thuộc một loại dưới đây.

| Loại                          | Điều kiện                                                          | Bằng chứng trong execution                                                |
| ----------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| T1: test sai so với nguồn     | Expected lệch UCs, thiết kế hoặc ADR đã chốt                       | Trích rule nguồn. Expected mới lấy từ nguồn, không lấy từ output          |
| T2: test khóa chi tiết nội bộ | Test kiểm thứ không thuộc interface đã duyệt, ví dụ nguyên câu log | Kiểm qua public interface. Mutation liên quan vẫn bị bắt                  |
| T3: lỗi harness hoặc driver   | Race, cleanup, port, import lặp                                    | Diff không đổi expected và assertion về hành vi                           |
| T4: requirement cần thay đổi  | Hành vi thực tế cần khác tài liệu                                  | Dừng và báo product owner. Chốt UCs hoặc thiết kế trước, rồi mới sửa test |

Không được phép sửa test chỉ vì implementation trả kết quả khác. Khi một test fail, đọc failure và trả lời "code sai hay test sai" bằng tài liệu nguồn. Code sai thì sửa code. Test sai thì ghi loại và nguồn, rồi mới sửa test. Không xác định được loại thì xử lý như T4.

Test mâu thuẫn với tài liệu là trường hợp agent dễ gian lận nhất. Trong ImpossibleBench, cho agent dừng để gọi người giảm tỷ lệ gian lận của GPT-5 từ 54% xuống 9%, rõ nhất trên Conflicting-SWEbench [[13, 5.3]](#ref-13). `Inferred`: T4 đóng vai trò lối thoát tương tự cho Bước 08. Test chỉ đọc không chặn được special casing hoặc nới phép so sánh [[13, 5.2]](#ref-13), nên vẫn cần mutation và review diff production.

### Testware coi là chỉ đọc

Testware Market Data tại commit `32fffa5` coi là chỉ đọc mặc định:

- `apps/api/test/market-data/`, `apps/api/test/support/market-data-rest-server.ts`
- `apps/web/e2e/market-data/`, `apps/web/playwright.market-data*.config.ts`
- `packages/shared/src/schemas/market-data*.test.ts`, `packages/shared/src/schemas/market-summary-input.schema.test.ts`
- Config test và lint: `**/vitest.config.*`, `eslint.config.js`, `scripts/eslint-plugin-testware.mjs`

Mỗi file có diff so với `32fffa5` phải có loại T1–T4 và nguồn trong execution. Rule ESLint mới của Task 2 là thay đổi được phép của `eslint.config.js`, phải có test cho case hợp lệ và case bị từ chối.

## Commit khi hoàn tất Task

Product owner duyệt ngày 2026-11-21: mỗi Task kết thúc bằng ít nhất một commit. Yêu cầu này cho phép agent tạo commit khi thực hiện từng Task. Agent chỉ push khi product owner yêu cầu.

1. Hoàn thành đầu ra và điều kiện đạt của Task.
2. Chạy kiểm tra phù hợp với các file đã thay đổi. Xử lý lỗi ngoài dự kiến và findings thuộc phạm vi Task trước khi commit.
3. Kiểm diff theo mục Ranh giới sửa code và test. Chạy `git diff --stat 32fffa5 --` với các đường dẫn testware chỉ đọc.
4. Cập nhật checkbox trong file này và kết quả Task trong `execution.md`.
5. Dùng skill `commit`. Chỉ stage thay đổi thuộc Task. Không bỏ qua Git hooks. Khi hook chặn, sửa theo message của hook.
6. Commit message có: test chuyển từ red sang green, testware đã sửa kèm loại T1–T4, mỗi `as` mới trong `src/` kèm lý do, và test còn red có chủ đích của lát sau.
7. Ghi mã commit khi báo kết quả Task. Chỉ chuyển sang Task tiếp theo sau khi commit thành công.

## File và trách nhiệm

Đường dẫn tính từ gốc repo. File mới là đầu ra dự kiến, chưa phải file đã tạo.

| File hoặc thư mục                                                                   | Thay đổi và trách nhiệm                                                                                                                                                    |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/shared/src/schemas/market-data.schema.ts`, `packages/shared/src/index.ts` | Contract lịch sử, query strict, summary query và public exports                                                                                                            |
| `apps/web/app/api/`, `hooks/`, `utils/`, `pages/Realtime/`, `apps/web/mocks/`       | Đọc contract mới, tính MA ở Web, timeout 10 giây, xử lý 401 và mã lỗi. Mock dùng contract mới                                                                              |
| `apps/api/src/providers/market-data/`                                               | Interface provider, Binance adapter, cache decorator. Layer mới                                                                                                            |
| `apps/api/src/services/market-data.service.ts`                                      | Cửa sổ 519/500 nến, kiểm dữ liệu, phân loại lỗi, log                                                                                                                       |
| `apps/api/src/api/{routes,controllers,middlewares}/`, `app.ts`, `index.ts`          | Route, controller, middleware kiểm phiên, mapping lỗi và composition root                                                                                                  |
| `eslint.config.js` và test của rule                                                 | Ranh giới import của `providers/`, thêm cùng lúc với folder [[6]](#ref-6) [[11]](#ref-11). Hai rule chặn đọc `process.env` ngoài `configs/` và chặn `src/` import testware |
| `docs/conventions/project-structure.md`                                             | Thêm `providers/` vào cây thư mục và quy tắc layer                                                                                                                         |
| `apps/api/perf/market-data/`, `apps/web/playwright.market-data-perf.config.ts`      | Script `k6`, script tổng hợp nearest-rank và runner đo browser. Agent đề xuất vị trí, xem mục Quyết định                                                                   |
| `docs/testing/evidence/market-data/<run-id>/`                                       | Manifest, raw samples và kết quả đối chiếu của từng lượt đo [[3, Môi trường, evidence và cách chạy lại]](#ref-3)                                                           |
| `docs/testing/test-scopes/TS-002-market-data/`                                      | Kết quả thực chạy trong `rest-verification.md`. Tạo `rest-polling-requirement-gap-analysis.md` và tài liệu kiểm chứng polling. Cập nhật README scope                       |
| `docs/UCs/`, `docs/architecture/`                                                   | Chốt lại hành vi và thiết kế nếu thực tế khác tài liệu. Thêm hành vi và cơ chế polling                                                                                     |
| `work/step-08-rest-build/execution.md`                                              | Lệnh, kết quả red/green, mutation, quyết định và việc chuyển tiếp                                                                                                          |

## Quyết định cần duyệt và quyết định của agent

Các quyết định dưới đây thay đổi cách vận hành hoặc gọi dịch vụ ngoài. Product owner đã duyệt cả bốn quyết định ngày 2026-11-21. Người dùng duyệt ba quyết định vận hành khi yêu cầu chạy Task 6.

| Quyết định              | Đề xuất                                                                                                                                                    | Lý do                                                                                                                      | Task     |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------- |
| Commit theo Task        | Đã duyệt ngày 2026-11-21: mỗi Task ít nhất một commit, push khi product owner yêu cầu                                                                      | Giữ diff riêng cho từng lát theo abstract plan [[1, Bước 8]](#ref-1)                                                       | Mọi Task |
| Cài `k6`                | Cài bản ổn định mới nhất trên máy đo, ghi version vào manifest                                                                                             | `k6` không phải package của pnpm, cần cài ngoài repo [[3, Môi trường, evidence và cách chạy lại]](#ref-3)                  | 6        |
| Smoke Binance thật      | Một lượt: lịch sử BTCUSDT/5m và một summary, không lặp tự động                                                                                             | Protocol giữ đề xuất này. Đây là lần đầu gọi Binance thật từ code [[3, Môi trường, evidence và cách chạy lại]](#ref-3)     | 6        |
| Lưu evidence trong repo | Commit manifest, summary, reconciliation và samples đã chuẩn hóa. Không commit file raw lớn hơn 5 MB. Nén gzip file raw lớn hơn và ghi hash trong manifest | Output JSON của `k6` ở 50 client trong 180 giây có thể lớn. Agent đề xuất ngưỡng 5 MB để giữ repo nhỏ mà vẫn chạy lại được | 6        |

Các quyết định sau do agent chốt theo ủy quyền của product owner. Product owner có thể bác bỏ khi review.

- **Chuyển Web sang contract mới ngay ở lát 1.** Bàn giao Bước 07 đặt việc chuyển Web ở lát 5. Đổi shape lịch sử ở lát 1 làm typecheck Web fail cho tới lát 5. Agent chuyển các nơi đọc `ma20` và mock fixture ngay ở lát 1, chỉ đủ để giữ Web đúng với contract. Lát 5 vẫn làm phần còn lại: timeout, 401, mã lỗi và E2E xuyên API.
- **Test nháp `market-data.schema.test.ts`.** Test này kiểm `ma20` của contract nháp. Theo ADR-004, Web tính MA và response API không có `ma20` [[6]](#ref-6) [[12, ADR-004]](#ref-12). Agent chuyển các case giá sai và thời gian trùng/sai thứ tự sang contract mới nếu `market-data-rest.schema.test.ts` chưa có case tương đương. Agent bỏ case `ma20` và ghi lý do trong execution.
- **Rule ESLint chống code chỉ cho test.** Chặn đọc `process.env` ngoài `apps/api/src/configs/` và chặn code ứng dụng import `test/` hoặc `e2e/`. Lý do: chặn hai anti-pattern ở mức cấu trúc thay vì dựa vào review. Hiện chưa có rule cho chiều import này.
- **Lượt `--sequence.shuffle` cho suite API.** Lý do: phát hiện code giữ trạng thái giữa các lần gọi và test phụ thuộc thứ tự chạy. Chỉ chạy thêm một lượt mỗi lát, không thay lượt thường.
- **Mutation theo từng lát.** Bàn giao liệt kê mutation chung cho Bước 08. Agent chạy mutation của mỗi lát trong Task của lát đó, để sửa test cùng commit với code.
- **Vị trí script đo.** Script `k6` và script tổng hợp đặt trong `apps/api/perf/market-data/`, ngoài `src/` và `test/`, để Vitest và build không thu chúng. Runner browser dùng config Playwright riêng trong `apps/web`. Lý do: protocol yêu cầu script chạy lại được và không import code workspace vào runtime của `k6`.

## Công việc

### Phần A: REST tải lịch sử

#### Task 1: Lát 1, shared contract và chuyển Web

- [x] Xác nhận Node, pnpm và Docker Compose bằng lệnh thực tế. Ghi commit HEAD bắt đầu Bước 08.
- [x] Kiểm Vitest và Playwright có chặn `only` hay không bằng config và source. Ghi số test của từng suite Market Data làm mốc so sánh.
- [x] Chạy lại ba test shared. Đối chiếu số pass/fail với kết quả Task 4 của Bước 07 [[2, Các lát red cho Bước 08]](#ref-2). Ghi chênh lệch nếu có.
- [x] Chạy `graphify affected` cho `candleHistorySchema`, `candleHistoryInputSchema` và `marketSummarySchema`.
- [x] Sửa schema theo contract nến [[6]](#ref-6): thêm `1d`, query strict, `isClosed`, `warmupCount`, `dataTime`, bỏ `ma20`. Thêm `marketSummaryInputSchema` vào public exports.
- [x] Chuyển các nơi Web đọc `ma20` sang MA tính ở Web từ nến có thật. Không vẽ warm-up. Cập nhật mock fixture theo contract mới.
- [x] Xử lý test nháp theo mục Quyết định. Chạy test Web logic và hai spec mock (`realtime.spec.ts`, `msw-smoke.spec.ts`) từng file một.
- [x] Chạy mutation của shared contract: bỏ strict, bỏ một invariant của snapshot. Test tương ứng phải fail.

**Điều kiện đạt:** 116 test shared tới assertion. Test REST contract và summary query pass. `pnpm check:exports`, typecheck shared/Web/API (API còn red do thiếu module của lát 2–4, ghi rõ), ESLint file đã sửa đạt.

- [x] Chạy kiểm tra phù hợp và tạo commit cho Task 1.

#### Task 2: Lát 2, provider interface, service và Binance adapter

- [x] Tạo folder `providers/market-data/` cùng rule ESLint cho ranh giới import. Viết test cho rule: một import hợp lệ và các import phải bị từ chối [[6]](#ref-6). Cập nhật Project Structure.
- [x] Thêm hai rule ESLint theo mục Ranh giới sửa code và test: chỉ `apps/api/src/configs/` được đọc `process.env`; `apps/*/src` và `apps/web/app` không import từ `test/` hoặc `e2e/`. Viết test cho case hợp lệ và case bị từ chối. Sửa code hiện có vi phạm rule nếu có, không thêm ngoại lệ.
- [x] Tạo interface `MarketDataProvider` và kiểu domain. Chạy lại `service.test.ts` và `binance.test.ts`. Xác nhận test tới assertion và fail ở hành vi chưa build.
- [x] Build service: yêu cầu 519 nến, trả tối đa 500 nến, `warmupCount` theo lịch sử thực nhận, kiểm dữ liệu, phân loại lỗi và log có pair/timeframe/duration.
- [x] Build adapter: URL/query, chuẩn hóa kline và summary, base volume, timeout bằng `AbortSignal`, lỗi có kiểu, không retry.
- [x] Đối chiếu đủ 518 nến đóng với `closed-candles.json`. Không lấy output của implementation làm expected.
- [x] Chạy mutation: đổi close, dùng quote volume, lệch warm-up, fake không tôn trọng `AbortSignal`.

**Điều kiện đạt:** hai suite pass, cả lượt thường và lượt `--sequence.shuffle`. Ba rule ESLint mới có test cho cả case hợp lệ và case bị từ chối. Typecheck API chỉ còn red ở module của lát 3–4.

- [x] Chạy kiểm tra phù hợp và tạo commit cho Task 2.

#### Task 3: Lát 3, cache decorator và lỗi upstream

- [x] Chạy lại `cached-provider.test.ts` và `provider-contract.test.ts`. Xác nhận test tới assertion.
- [x] Build decorator: khóa gồm pair/timeframe/limit và namespace summary, TTL 5 giây theo mốc đã duyệt, single-flight, không cache lỗi, giữ snapshot [[3, Mô hình cache và cooldown]](#ref-3).
- [x] Build cooldown 429/418 theo `Retry-After` trong adapter, dùng chung cho mọi endpoint Binance của instance. Cache còn hạn vẫn trả trong cooldown.
- [x] Chạy mutation: bỏ một thành phần khóa, đổi dấu biên TTL, làm mới `dataTime` khi hit, bỏ single-flight, giữ rejection, bỏ cooldown.

**Điều kiện đạt:** hai suite pass, cả lượt thường và lượt `--sequence.shuffle`. Mỗi mutation trong danh sách làm assertion liên quan fail.

- [x] Chạy kiểm tra phù hợp và tạo commit cho Task 3.

#### Task 4: Lát 4, HTTP và session

- [x] Chạy lại `http.test.ts`. Ghi số test fail vì 404 trước khi build.
- [x] Mở rộng `createApp` để nhận `marketDataProvider`. Dựng service, controller, route và middleware kiểm phiên qua Better Auth `getSession`. Tạo adapter và bọc cache tại `src/index.ts`.
- [x] Mapping lỗi: 400 `INVALID_QUERY`, 401 `UNAUTHENTICATED`, 502 `MARKET_DATA_INVALID`, 503 `MARKET_DATA_UNAVAILABLE`, 500 `INTERNAL_ERROR`, `Cache-Control: no-store` [[7]](#ref-7).
- [x] Bổ sung assertion log còn thiếu ở Bước 07: method/path/status/duration và không lộ cookie, token hoặc secret [[3, Log và dependency boundaries]](#ref-3).
- [x] Chạy mutation: bỏ kiểm phiên, bỏ strict query, cho lỗi upstream lộ chi tiết.

**Điều kiện đạt:** `http.test.ts` và toàn bộ `test/market-data` pass, cả lượt thường và lượt `--sequence.shuffle`. Test Auth của API không regression. Typecheck API đạt.

- [x] Chạy kiểm tra phù hợp và tạo commit cho Task 4.

#### Task 5: Lát 5, flow UI qua API thật

- [x] Chạy lại `rest-history.spec.ts` với config REST. Xác nhận API startup thành công và test tới assertion UI.
- [x] Web xử lý timeout chart 10 giây, 401 chặn workspace và mã lỗi theo contract. Giữ cách gọi HTTP cùng origin.
- [x] Bổ sung test cho response cũ tới sau khi release và timeout transport Web. Bước 07 chỉ kiểm lúc request cũ còn bị giữ [[2, Fixture, evidence và gate còn lại]](#ref-2).
- [x] Chạy mutation của E2E driver: giữ dữ liệu pair cũ, tính MA sai, cho lỗi một chart lan sang chart khác.
- [x] Kiểm trên trình duyệt bằng skill `playwright-cli`: canvas, vùng warm-up, crosshair, gap, zoom/kéo, nến tăng/giảm ngoài màu, focus nhìn thấy, 320 px. Lưu ảnh làm evidence.
- [x] Kiểm accessibility bằng Playwright theo [giới hạn kiểm accessibility](accessibility-verification-limits.md): status có trong DOM trước khi đổi trạng thái, `aria-live="polite"`, so role/name với cây accessibility của Chromium cho MK-47/MK-48, mỗi lần chuyển trạng thái chỉ đổi status của chart liên quan. Không dùng screen reader, theo quyết định của product owner ngày 2026-11-21.
- [x] Cập nhật câu yêu cầu kiểm screen reader trong `rest-verification.md` theo quyết định trên.

**Điều kiện đạt:** 10 test E2E REST và test mới pass. Spec mock không regression. Phần kiểm thủ công có kết quả riêng cho từng requirement.

- [x] Chạy kiểm tra phù hợp, `review-change` cho Phần A code, và tạo commit cho Task 5.

#### Task 6: Baseline REST tải lịch sử

Chỉ bắt đầu sau khi Task 5 green và bốn quyết định ở mục Quyết định đã được duyệt.

- [x] Cài `k6`. Viết script theo bảng workload `k6` và script tổng hợp p50/p95/p99 nearest-rank từ raw samples [[3, Workload baseline đã duyệt]](#ref-3).
- [x] Thêm instrumentation browser cho mốc body/apply/draw. Chứng minh mốc draw gắn với lượt vẽ dữ liệu đúng lựa chọn. Nếu không chứng minh được, ghi thời gian hiển thị Inconclusive.
- [x] Commit script đo, instrumentation, manifest và ngưỡng trước lượt đo đầu tiên. Sửa script sau khi thấy kết quả thì tính là cohort mới và ghi lý do.
- [x] Chạy lượt API: cache rỗng, cache hit, single-flight có barrier, steady state 1/10/50 client cho hai cohort, ba lần lặp.
- [x] Chạy lượt UI với Web production build: lượt chính 100 thao tác × 3 lần lặp cho mở Realtime và đổi timeframe. Lượt phụ cho đổi pair và cache nóng.
- [x] Đối chiếu mọi response thành công với manifest replay. Lượt có dữ liệu sai không đủ điều kiện kết luận.
- [x] Chạy smoke Binance thật một lượt. Lưu header quota và kết quả đối chiếu nến đóng.
- [x] Ghi QA-10/QA-11 theo điều kiện kết luận đã duyệt [[3, Ngưỡng và quyền kết luận]](#ref-3). Khi Failed, báo product owner, không đổi ngưỡng.

Kết quả: [execution.md](execution.md#task-6-kết-quả-baseline-rest). Product owner chọn giữ 18 lượt API làm số liệu mô tả do native k6 dùng wall clock. QA-10/QA-11 và capacity là `Inconclusive`. Các lượt lỗi hoặc bị dừng vẫn được giữ trong evidence.

**Điều kiện đạt:** mỗi lượt có thư mục evidence đủ file theo protocol. Kết quả ghi nhãn môi trường. Không ghi capacity đạt vì chưa có ngưỡng latency HTTP, lỗi hoặc capacity được duyệt.

- [x] Chạy kiểm tra phù hợp và tạo commit cho Task 6.

#### Task 7: Chốt tài liệu REST tải lịch sử

- [x] Đối chiếu hành vi thực tế với UCs [[4]](#ref-4), quality attributes [[5]](#ref-5) và thiết kế [[6]](#ref-6) [[7]](#ref-7). Chốt lại tài liệu sản phẩm cho mọi khác biệt.
- [x] Ghi kết quả thực chạy, điều kiện đo và đường dẫn evidence vào `rest-verification.md`. Cập nhật README scope. Sửa câu cũ mà kết quả mới làm sai (LL-007).
- [x] Chạy Prettier, `pnpm check:docs` và `review-change` cho tài liệu đã sửa.

Kết quả: [execution.md](execution.md#task-7-chốt-tài-liệu-rest-tải-lịch-sử). Không đổi rule trong `docs/UCs/`. Các requirement chưa đủ evidence ghi Inconclusive trong tài liệu kiểm chứng.

**Điều kiện đạt:** flow REST tải lịch sử có evidence cho từng requirement trong phạm vi, hoặc ghi rõ phần Inconclusive và lý do.

- [x] Tạo commit cho Task 7. Commit này đánh dấu mốc so sánh REST tải lịch sử.

### Phần B: REST polling

Task 8 chốt requirements và thiết kế polling. Task 9 và Task 10 được chi tiết hóa từ kết quả Task 8. Chỉ bắt đầu Task 9 sau khi product owner duyệt các mục trong [Quyết định chờ product owner](../../../../../testing/test-scopes/TS-002-market-data/rest-polling-requirement-gap-analysis.md#quyết-định-chờ-product-owner).

#### Task 8: Requirements và thiết kế polling

- [x] Ghi phân tích vào `rest-polling-requirement-gap-analysis.md` theo cấu trúc của phân tích REST [[8]](#ref-8): trạng thái requirements trước phân tích, nguồn, gap và kết quả. Đối chiếu một baseline độc lập trước khi kết luận đủ (LL-003).
- [x] Mở rộng UCs với hành vi polling, gồm làm mới lỗi giữ dữ liệu cũ (MK-13) [[4]](#ref-4). Cập nhật quality attributes cho freshness. Ghi quyết định còn mở vào `docs/open-questions.md`.
- [x] Thiết kế cơ chế polling trong kiến trúc: chu kỳ, quan hệ với cache 5 giây, giới hạn request Binance. Chu kỳ do agent đề xuất phải có nguồn và lý do.
- [x] Chạy Prettier, `pnpm check:docs` và `review-change` cho tài liệu đã sửa.

Kết quả: [execution.md](execution.md#task-8-requirements-và-thiết-kế-polling). Rule mới MK-63 đến MK-85, gap MK-86 đến MK-92, QA-12, QA-13, ADR-007 và ADR-008 có trạng thái Proposed hoặc Inferred, chờ product owner duyệt.

- [x] Tạo commit cho Task 8.

#### Task 9: Kiểm chứng polling và test trước build

Chỉ bắt đầu sau khi product owner duyệt các giá trị Proposed của Task 8. Giá trị bị đổi khi duyệt được sửa trong UCs trước khi viết test.

- [ ] Tạo `rest-polling-verification.md` trong TS-002. Giữ định nghĩa chỉ số chung với REST tải lịch sử. Thêm các phép đo đã hoãn: freshness, tỷ lệ thời gian dữ liệu cũ, bytes/client/phút. Ma trận requirement → test cho MK-63 đến MK-85, QA-12, QA-13.
- [ ] Chọn technique cho từng nhóm: state transition cho bật/tạm dừng/tab ẩn/lỗi/có dữ liệu (MK-73 đến MK-77, MK-80 đến MK-85); decision table cho lỗi có hoặc chưa có dữ liệu (MK-80 đến MK-82); boundary cho chu kỳ và TTL (MK-63, ADR-008).
- [ ] Thiết kế nguồn tham chiếu có timestamp cho QA-12: replay đổi nến đang mở theo lịch đã biết, Web ghi mốc vẽ của lần làm mới. Định nghĩa tỷ lệ thời gian dữ liệu cũ với ngưỡng bằng số đo của QA-12, và bytes/client/phút đo tại browser.
- [ ] Viết test trước build: Vitest cho query options và so `dataTime` (MK-79) qua public hook; Playwright E2E qua API thật với replay có nến đổi theo thời gian, dùng clock của Playwright thay chờ thời gian thật; API test cho ADR-008 nếu được duyệt.
- [ ] Chạy test mới, xác nhận fail tại assertion, ghi trạng thái red. Chạy lại suite REST để chứng minh test cũ không đổi.
- [ ] Chạy kiểm tra phù hợp, `review-change` cho testware và tài liệu, rồi tạo commit cho Task 9.

#### Task 10: Build polling, đo và chốt tài liệu

- [ ] Lát 1, Web query: chu kỳ, tạm dừng/tiếp tục, tab ẩn, lỗi giữ dữ liệu, chart chưa có dữ liệu không tự tải lại, bỏ dữ liệu cũ hơn (MK-63 đến MK-66, MK-72 đến MK-85).
- [ ] Lát 2, chart: bỏ `fitContent()` và xóa crosshair khi làm mới cùng lựa chọn; giữ vùng xem, focus và thông tin nến (MK-67 đến MK-71). Kiểm hành vi `setData` của Lightweight Charts trên trình duyệt.
- [ ] Lát 3, API: giữ lỗi nguồn trong TTL nếu ADR-008 được duyệt. Đổi Status ADR-006 thành `Superseded by ADR-008`.
- [ ] Chạy mutation sau khi mỗi lát green: chu kỳ khác TTL, làm mới khi tab ẩn, không làm mới khi tiếp tục, xóa dữ liệu khi lỗi, nhận dữ liệu cũ hơn, `fitContent()` mỗi lần làm mới, không giữ lỗi trong cache.
- [ ] Đo baseline polling với cùng workload, môi trường và công cụ của Task 6. Ghi kết quả vào tài liệu kiểm chứng polling.
- [ ] Đối chiếu UCs, kiến trúc, tài liệu testing. Chạy `review-change`.
- [ ] Cập nhật tracker với bằng chứng và đánh dấu Bước 08 hoàn thành.
- [ ] Tạo commit cho Task 10. Commit này đánh dấu mốc so sánh REST polling.

## References

1. <a id="ref-1"></a>[Kế hoạch triển khai Market Data ở mức tổng quan](../../abstract-implementation-plan.md)
2. <a id="ref-2"></a>[Kết quả kiểm chứng REST và baseline](../step-07-rest-verification/execution.md)
3. <a id="ref-3"></a>[Kiểm chứng REST tải lịch sử](../../../../../testing/test-scopes/TS-002-market-data/rest-verification.md)
4. <a id="ref-4"></a>[Market Data](../../../../../UCs/market-data.md)
5. <a id="ref-5"></a>[Quality Attributes](../../../../../UCs/quality-attributes.md)
6. <a id="ref-6"></a>[Market Data & Realtime Updates](../../../../../architecture/10-market-data.md)
7. <a id="ref-7"></a>[API & Realtime Communication Contracts](../../../../../architecture/22-api-endpoints.md)
8. <a id="ref-8"></a>[REST Requirement Gap Analysis](../../../../../testing/test-scopes/TS-002-market-data/rest-requirement-gap-analysis.md)
9. <a id="ref-9"></a>[Testware](../../../../../conventions/testware.md)
10. <a id="ref-10"></a>[Test Strategy](../../../../../testing/test-strategy.md)
11. <a id="ref-11"></a>[Project Structure](../../../../../conventions/project-structure.md)
12. <a id="ref-12"></a>[Architecture Decisions](../../../../../architecture/30-decisions.md)
13. <a id="ref-13"></a>[ImpossibleBench: Measuring LLMs' Propensity of Exploiting Test Cases](https://arxiv.org/html/2510.20270v1), truy cập ngày 2026-11-21
14. <a id="ref-14"></a>[Anti-pattern khi code dựa trên test có sẵn](../../../../../knowledge/test-gaming-anti-patterns.md)
