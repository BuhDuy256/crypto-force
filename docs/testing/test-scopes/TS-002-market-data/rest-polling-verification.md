# Kiểm chứng REST polling

Đọc file này để biết test trước build, nguồn tham chiếu và cách đo baseline REST polling của Realtime.

## Phạm vi

Phạm vi gồm cập nhật định kỳ của chart và sidebar (MK-63 đến MK-85), độ mới (QA-12), tải lên Binance (QA-13) và giữ lỗi nguồn trong TTL (ADR-008). Product owner duyệt các giá trị ngày 2026-11-22 [[1]](#ref-1) [[2]](#ref-2) [[3]](#ref-3). Task 9 viết test trước build; Task 10 triển khai rồi đo [[4]](#ref-4).

Giữ định nghĩa latency HTTP/UI, lỗi, cache hit/miss, nearest-rank percentile, workload, môi trường và cấu trúc evidence của REST tải lịch sử [[5]](#ref-5). Không dùng fake clock để kết luận latency thực tế. Mốc apply chưa chứng minh canvas paint.

## Level, type và technique

Lựa chọn dựa trên rủi ro của Test Strategy [[6]](#ref-6). Bảng trạng thái và expected result lấy từ requirements, không lấy từ code hiện tại.

| Nhóm                           | Level và type                                                                                | Technique và tiêu chí                                                                            |
| ------------------------------ | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Chu kỳ, dataTime, lỗi/phục hồi | Component integration qua hook public, React và QueryClient thật; functional, data integrity | BVA ba giá trị cho chu kỳ; EP timestamp cũ hơn, bằng và mới hơn; state transition lỗi → phục hồi |
| Cache lỗi                      | Component qua public provider; resilience, contract                                          | Pending/error/expired; BVA TTL; cả lỗi invalid/unavailable và lỗi ngoài dự kiến                  |
| Trạng thái trang/chart         | System/E2E qua HTTP API, Auth và DB thật; functional, accessibility                          | Các chuyển trạng thái trong bảng; decision table dữ liệu/lỗi; boundary timeout                   |
| Freshness, bytes, weight       | System performance                                                                           | Replay có timestamp, cùng workload baseline REST; không suy diễn từ test chức năng               |

### Mô hình chuyển trạng thái

Trạng thái cập nhật toàn trang và trạng thái dữ liệu của từng query là hai chiều độc lập. Guard của mỗi dòng xác định sự kiện được xử lý [[1]](#ref-1).

| Trạng thái trước     | Sự kiện hoặc guard     | Kết quả quan sát                                                   | Test                                        |
| -------------------- | ---------------------- | ------------------------------------------------------------------ | ------------------------------------------- |
| Mới mở/reload        | Phiên hợp lệ           | Bật, tải lần đầu                                                   | E2E refresh; Task 10 kiểm reload sau paused |
| Bật, tab hiện, idle  | Đủ 5 giây              | Chart và sidebar bắt đầu làm mới; thành công đổi dữ liệu/thời điểm | Hook boundary, E2E refresh                  |
| Bật, đang chờ        | Đủ chu kỳ              | Không bắt đầu request chồng                                        | Hook slow, E2E deadline                     |
| Bật                  | Tạm dừng               | Giữ dữ liệu, hiện thời điểm tạm dừng, không bắt đầu request mới    | E2E pause/resume                            |
| Tạm dừng, đang chờ   | Request hoàn tất       | Nhận kết quả, vẫn tạm dừng                                         | E2E in-flight pause                         |
| Tạm dừng             | Tiếp tục, tab hiện     | Bật, bắt đầu trong 1 giây                                          | E2E pause/resume                            |
| Bật, tab hiện        | Tab ẩn                 | Không bắt đầu request; không yêu cầu hủy request đã chạy           | E2E visibility                              |
| Bật, tab ẩn          | Tab hiện               | Bắt đầu trong 1 giây                                               | E2E visibility                              |
| Tạm dừng, tab ẩn     | Tab hiện               | Vẫn tạm dừng, không tự làm mới                                     | Task 10 kiểm tổ hợp                         |
| Bật, có dữ liệu      | Nguồn lỗi hoặc timeout | Giữ dữ liệu/thời điểm, báo lỗi; chu kỳ sau thử lại                 | Hook recovery, E2E recovery/deadline        |
| Bật, báo lỗi làm mới | Nguồn phục hồi         | Hiển thị dữ liệu mới, bỏ lỗi                                       | Hook recovery, E2E recovery                 |
| Chưa có dữ liệu, lỗi | Đủ chu kỳ              | Giữ lỗi và Retry; không tự tải chart                               | E2E initial error                           |
| Chưa có dữ liệu, lỗi | Người dùng Retry       | Tải theo lựa chọn hiện tại                                         | E2E initial error                           |
| Đang làm mới         | Đổi timeframe/pair     | Chỉ hiển thị dữ liệu lựa chọn mới, chu kỳ mới                      | E2E timeframe race; Task 10 kiểm thêm pair  |
| Đang làm mới         | Phiên hết hạn          | Màn chặn đăng nhập, ngừng cập nhật                                 | E2E session                                 |

Tick khi paused/hidden/pending/initial-error là chuyển trạng thái bị chặn. Không tự thêm hành vi cho sự kiện chưa có trong nguồn. Mục tiêu là bao phủ các dòng trên; test red dừng sớm không chứng minh các assertion phía sau.

### Decision table dữ liệu và lỗi

Hai điều kiện boolean tạo bốn tổ hợp khả thi. Không gộp hoặc loại tổ hợp. Nguồn: lỗi làm mới, timeout và chart chưa có dữ liệu (MK-80 đến MK-82) [[1]](#ref-1).

| Điều kiện/hành động                           | Có dữ liệu, thành công | Có dữ liệu, lỗi       | Chưa có dữ liệu, thành công | Chưa có dữ liệu, lỗi |
| --------------------------------------------- | ---------------------- | --------------------- | --------------------------- | -------------------- |
| Có dữ liệu trước request                      | T                      | T                     | F                           | F                    |
| Request lỗi                                   | F                      | T                     | F                           | T                    |
| Hiển thị response mới và dataTime             | Có                     | Không                 | Có                          | Không                |
| Giữ dữ liệu và dataTime cũ                    | Không                  | Có                    | Không áp dụng               | Không áp dụng        |
| Hiển thị lỗi                                  | Không                  | Có                    | Không                       | Có                   |
| Tự tải chart ở chu kỳ sau khi bật và tab hiện | Có                     | Có                    | Có                          | Không                |
| Test                                          | E2E refresh            | E2E recovery/deadline | E2E mở trang                | E2E initial error    |

### Biên thời gian và dữ liệu

- Chu kỳ: elapsed nguyên millisecond dưới 5000 chưa có request; tại 5000 và sau 5000 bắt đầu request khi idle. Kiểm 4999/5000/5001 (MK-63, MK-64). Tính elapsed từ lần bắt đầu request trước, không từ lúc assert hoàn tất.
- Cache lỗi: pending chưa có expiry. Provider reject ở clock 2000; read ở 6999 nhận lỗi cũ, read ở 7000 gọi provider mới. Summary kiểm riêng 4999/5000/5001 kể từ reject. TTL lấy từ quyết định giữ lỗi (ADR-008) [[3]](#ref-3).
- Timeout chart: các biên 9999/10000/10001 ms vẫn lấy oracle từ REST tải lịch sử [[5]](#ref-5). E2E polling thêm giữ dữ liệu và không chồng trước deadline. Không tăng timeout để chữa lỗi sản phẩm.
- Response `dataTime` cũ hơn bị bỏ, bằng hoặc mới hơn được nhận (MK-79). Hook dùng snapshot 1800000000000, cũ 1799999999999, mới 1800000000001 và bằng 1800000000000. Agent chọn epoch tổng hợp và khoảng cách 1 ms để phân biệt các partition; không đổi ngưỡng sản phẩm.

## Ma trận requirement → phép kiểm

Tên rút gọn trỏ tới file trong mục Harness. Phép kiểm ghi Task 10 đã có thiết kế bên dưới nhưng chưa có kết quả.

| Requirement | Nội dung                                     | Phép kiểm và oracle                                                                                                        | Giới hạn                                              |
| ----------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| MK-63       | Chart chu kỳ 5 giây                          | Hook boundary, E2E refresh; số request, close 618 → 628                                                                    | Red trước build                                       |
| MK-64       | Sidebar chu kỳ 5 giây                        | Hook boundary, E2E refresh; Last price 618 → 628                                                                           | Assertion sau chart có thể chưa tới                   |
| MK-65       | Không chồng request                          | Hook slow, E2E deadline, ledger HTTP vào API                                                                               | Không lấy upstream count thay browser count           |
| MK-66       | Đổi thời điểm dữ liệu                        | E2E refresh; Data time đổi                                                                                                 | Epoch API từ control clock                            |
| MK-67       | Tối đa 500 nến, bỏ nến cũ nhất               | Task 10 advance 300000 ms; series apply có 500 điểm, openTime đầu/cuối dịch một interval, warm-up vẫn 19; đối chiếu canvas | Apply chưa chứng minh canvas                          |
| MK-68       | Giữ vùng xem                                 | Task 10 zoom/kéo, lưu ảnh và mốc thời gian ở hai mép; refresh cùng lựa chọn rồi so lại                                     | Không export chart API chỉ cho test                   |
| MK-69       | Nến mới trong vùng xem khi đang xem nến cuối | Task 10 kéo tới cuối, rollover một interval, kiểm nến mới/time axis bằng ảnh                                               | Chưa kiểm canvas                                      |
| MK-70       | Giữ focus                                    | E2E keyboard selection                                                                                                     | Chỉ kết luận sau khi refresh đạt                      |
| MK-71       | Giữ thông tin nến đang chỉ                   | E2E keyboard selection; Task 10 thêm hover chuột và ảnh                                                                    | Keyboard không chứng minh hover                       |
| MK-72       | Thành công không thông báo                   | E2E keyboard selection, status rỗng; Task 10 ghi mutation DOM của live region trong refresh                                | Không kiểm tiếng screen reader                        |
| MK-73       | Một điều khiển pause/resume mọi query        | E2E pause/resume, ledger                                                                                                   | Task 10 kiểm thêm bàn phím                            |
| MK-74       | Paused at có thời điểm                       | E2E pause/resume kiểm nhãn; Task 10 so giờ với clock                                                                       | Nhãn hiện chưa chứng minh giờ đúng                    |
| MK-75       | Tiếp tục trong 1 giây                        | E2E pause/resume, clock chạy 999 ms rồi flush UI                                                                           | Task 10 ghi request timestamp, tách UI latency        |
| MK-76       | Không refresh khi tab ẩn                     | E2E visibility, ledger API không tăng                                                                                      | Driver phát visibilitychange, chưa thay kiểm tab thật |
| MK-77       | Tab hiện lại làm mới trong 1 giây            | E2E visibility                                                                                                             | Cùng giới hạn với tiếp tục                            |
| MK-78       | Mở/reload mặc định bật                       | E2E refresh/pause; Task 10 reload sau paused                                                                               | Không lưu pause qua reload                            |
| MK-79       | Bỏ dữ liệu cũ hơn                            | Hook older/equal/newer qua public hook                                                                                     | Không assert query option                             |
| MK-80       | Lỗi giữ dữ liệu, phục hồi bỏ lỗi             | Hook recovery; E2E recovery cả chart/sidebar                                                                               | Data time giữ nguyên khi lỗi                          |
| MK-81       | Timeout như lỗi làm mới                      | E2E deadline, dữ liệu còn và status lỗi                                                                                    | Clock page, hold trước API                            |
| MK-82       | Chart chưa có dữ liệu không tự retry         | E2E initial error, đếm request chart, Retry giữ focus                                                                      | Sidebar tách khỏi số đếm                              |
| MK-83       | Đổi lựa chọn khi đang refresh                | E2E timeframe race                                                                                                         | Task 10 kiểm thêm pair                                |
| MK-84       | Phiên hết hạn                                | E2E session, sign-out từ context khác, màn chặn và ledger đứng                                                             | Cookie browser vẫn gửi                                |
| MK-85       | Pause khi đang refresh                       | E2E in-flight pause, release đổi giá rồi ledger đứng                                                                       | Nhận response còn hợp lệ                              |
| QA-12       | Freshness p95 dưới 11 giây                   | Protocol nguồn tham chiếu bên dưới                                                                                         | Chưa đo                                               |
| QA-13       | Tối đa 504 weight/phút                       | Protocol load bên dưới, cả thành công/lỗi                                                                                  | Chưa đo                                               |

## Harness và cách chạy

| Phạm vi    | File và lệnh từ repo root                                                                                                                                             |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hook       | `apps/web/app/hooks/useMarketData.polling.test.ts`; `pnpm --filter @crypto-force/web exec vitest run app/hooks/useMarketData.polling.test.ts`                         |
| Cache lỗi  | `apps/api/test/market-data/polling-cache.test.ts`; `pnpm --filter @crypto-force/api exec vitest run test/market-data/polling-cache.test.ts`                           |
| E2E        | `apps/web/e2e/market-data/rest-polling.spec.ts`; `pnpm --filter @crypto-force/web exec playwright test --config playwright.market-data-polling.config.ts --workers=1` |
| Regression | Suite API Market Data cũ, shared market-data và E2E `playwright.market-data-rest.config.ts`, từng spec với một worker; test mới red chạy riêng                        |

Hook dùng `happy-dom`, `react-dom/client`, React `act`, router bộ nhớ và QueryClient thật. Chỉ thay fetch boundary. Probe đọc data/error trong render để đăng ký cập nhật hook. Clock giả chạy timer thông báo của QueryClient; flush 1 ms không phải chờ thời gian thật. Không export helper production hoặc mock module app.

E2E dùng `apps/api/test/support/market-data-rest-server.ts`, cổng API 3015/control 3016 và Web 5185. Hai suite dùng DB dẫn xuất `_market_data_rest_test`; không chạy đồng thời. Auth dùng đồng hồ thật, polling/cache dùng clock riêng. Email vào bộ nhớ. MSW tắt, service worker bị chặn, browser không intercept response Market Data.

Replay `polling` có epoch gốc 1800000000000. Nến căn interval, nến cuối đang mở. Close cuối của các timeframe mặc định và summary là 618 tại gốc, 628 sau 5000 ms, 638 sau 10000 ms. Riêng timeframe 1d cộng 100 vào close, nên sau 5000 ms trả 728 để test phân biệt dữ liệu 1d với 5m. Agent chọn input tổng hợp này để response đổi trong cùng nến. Endpoint loopback `/__rest/polling` đổi elapsed/failure/hold, không xóa cache. `/__rest/reset/polling` xóa trạng thái giữa test. `pollingRequests` đếm request trước cache; ledger upstream đếm request sau cache. Hold dừng trước API để kiểm timeout Web mà không chờ timeout Node thật.

Phép kiểm driver phải chứng minh response đầu đúng, nến đổi theo clock, trả 503 khi nguồn lỗi và phục hồi. Làm hỏng từng boundary trước khi dùng kết quả green tương ứng: replay không đổi close; nguồn luôn thành công; visibility event không đổi trạng thái; hold trả ngay; nguồn trả timestamp cũ. Chỉ tính độ nhạy khi assertion hành vi fail. Ghi phép đã chạy vào execution; phép chưa chạy không được gọi là đã kiểm.

## Protocol đo freshness, dữ liệu cũ và bytes

Dùng workload 1/10/50 client, lựa chọn mặc định, cùng môi trường và cách lặp baseline REST [[5]](#ref-5). Giữ riêng cohort thành công, lỗi, cache nóng/lạnh; không gộp percentile. Commit runner, manifest, lịch replay và điều kiện pass trước lượt đo. Task 9 thiết kế protocol; Task 10 tạo và chạy runner.

Nguồn tham chiếu là HTTP replay đi qua Binance adapter với lịch đổi nến đang mở biết trước. Mỗi thay đổi có `eventId`, pair/timeframe/openTime, OHLCV, `sourceAvailableAt` và timestamp đơn điệu của nguồn. Lịch đổi lệch pha polling/TTL để không chỉ đo trường hợp thuận lợi. Manifest ghi lịch, phase, seed nếu có và hash dữ liệu. Không dùng `dataTime` của response thay thời điểm nguồn có giá mới.

Web ghi eventId và mốc vẽ dữ liệu tương ứng. Runner đối chiếu OHLCV/openTime rồi xác nhận canvas qua ảnh và sự kiện render của chart hoặc observer ngoài đã kiểm độ nhạy. `market-data:apply` chỉ là apply. Chưa có evidence paint thì freshness là Inconclusive.

Đồng bộ clock nguồn/browser bằng mốc đơn điệu cùng host, ghi sai số trước/sau lượt đo. Không xác định được sai số phù hợp với độ phân giải phép đo thì ghi Inconclusive. Fake clock chỉ dùng test chức năng. Mỗi event có một mẫu cho mỗi client/chart đang hiện. Draw phiên bản mới hơn cùng series có thể hoàn tất mẫu event cũ nếu oracle xác nhận đúng dữ liệu; ghi event bị thay thế. Không đòi chart vẽ mọi phiên bản trung gian. Giữ mẫu thiếu/censored khi chưa có draw thay thế, không loại để giảm p95.

| Chỉ số                     | Công thức và điểm đọc                                                                                                                                                                       | Điều kiện kết luận                                                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Freshness                  | `drawAt(event hoặc phiên bản thay thế mới hơn, client) - sourceAvailableAt(event)`; nguồn có dữ liệu mới → canvas vẽ đúng phiên bản đó hoặc mới hơn; nearest-rank p95                       | p95 < 11000 ms cho QA-12 khi bật, tab hiện, nguồn bình thường. Thiếu paint/mẫu chưa giải trình thì Inconclusive                  |
| Tỷ lệ thời gian dữ liệu cũ | Tích phân chỉ báo `sourceVersion(t - 11000) > drawnVersion(t)`, chia thời gian quan sát đủ điều kiện rồi nhân 100%. Version tăng theo lịch nguồn của cùng series; draw mới thay thế draw cũ | Ngưỡng cũ 11000 ms lấy từ QA-12. Báo mô tả, chưa có ngưỡng pass riêng. Không suy ra từ p95                                       |
| Bytes/client/phút          | Tổng `Network.loadingFinished.encodedDataLength` tại browser cho Market Data trong cửa sổ đo, chia client-minute; gồm request lỗi. Ghi nghĩa byte và version CDP đã kiểm                    | Tách cold load và steady polling, compression/protocol. Chưa có ngưỡng pass. Không lấy kích thước JSON nguồn thay bytes browser  |
| Weight/phút                | Tổng weight request mà replay nhận từ API trong từng cửa sổ trượt nửa mở `[t, t + 60000)` ms; đối chiếu log adapter/ledger nguồn                                                            | Mọi cửa sổ đủ thời lượng của workload 1/10/50, cả thành công/lỗi, không quá 504 (QA-13). Không tính browser request thành weight |

Cuối lượt đo tiếp tục thu đủ để thấy kết quả event cuối nhưng không đổi mẫu số cửa sổ chính. Báo riêng thời gian paused/hidden/lỗi nguồn, request hủy, mẫu thiếu và khoảng không có tham chiếu. Tỷ lệ dữ liệu cũ chỉ có mẫu số khi nguồn quan sát được. Không kết luận QA-12 đạt trong cohort lỗi nguồn.

Artifacts: manifest môi trường/commit/version, timeline nguồn, request browser/bytes, draw samples, cache ledger, upstream weight ledger, lỗi/mẫu thiếu, nearest-rank summary và reconciliation. Kết quả nêu phạm vi đã kiểm và phần Inconclusive [[5]](#ref-5).

## Kết quả Task 9

Test, regression, kiểm tra tĩnh, driver fault và review nằm trong execution [[7]](#ref-7). Polling chưa build, baseline chưa đo. Các phép kiểm canvas, paint, phase và load ở trên thuộc Task 10, không tính là evidence green của Task 9.

## References

1. <a id="ref-1"></a>[Market Data — cập nhật định kỳ](../../../UCs/market-data.md)
2. <a id="ref-2"></a>[Quality Attributes](../../../UCs/quality-attributes.md)
3. <a id="ref-3"></a>[Architecture Decisions](../../../architecture/30-decisions.md)
4. <a id="ref-4"></a>[Bước 08 — Task 9 và Task 10](../../../build/01-prototype-to-implementation/market-data/work/step-08-rest-build/plan.md)
5. <a id="ref-5"></a>[Kiểm chứng REST tải lịch sử](rest-verification.md)
6. <a id="ref-6"></a>[Test Strategy](../../test-strategy.md)
7. <a id="ref-7"></a>[Execution Bước 08](../../../build/01-prototype-to-implementation/market-data/work/step-08-rest-build/execution.md)
