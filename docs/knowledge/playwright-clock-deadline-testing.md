# Test deadline bằng clock của Playwright

Đọc file này để biết clock giả của Playwright xử lý timer như thế nào, và cách test một deadline của Web ở các giá trị biên mà không chờ thời gian thật.

## Tóm tắt

- Sau `clock.pauseAt()`, trang không chạy timer nào cho tới khi test gọi `runFor()`, `fastForward()`, `pauseAt()` hoặc `resume()` [[1, pauseAt]](#ref-1).
- Một timer 0 ms được tạo trong lúc clock đang chạy timer khác có hạn ở `now + 1` ms, không phải `now` [[2, addTimer]](#ref-2). Vì vậy `runFor(0)` không chạy timer này.
- TanStack Query báo thay đổi cho UI bằng `setTimeout(callback, 0)` theo mặc định [[3]](#ref-3). `Inferred`: khi deadline chạy trong `runFor`, thông báo cho UI là timer 0 ms tạo trong lúc clock chạy, nên test cần thêm `runFor(1)` trước khi UI đổi.
- Một deadline được kiểm ở ba giá trị: ngay trước, đúng và ngay sau deadline. Mutant lệch 1 ms ở mỗi phía làm một test fail [[4, Mutation]](#ref-4).

## Cách test deadline 10 giây của chart

Test MK-34 dùng các bước sau [[5]](#ref-5):

1. Test server giữ request HTTP trước API. Timeout 5 giây của API và upstream không kết thúc request này.
2. Test cài clock và dừng clock trước khi trang gửi request.
3. Test chờ server báo đã giữ request, rồi gọi `runFor(9999)`, `runFor(10000)` hoặc `runFor(10001)`.
4. Ở 9999 ms, status vẫn là Loading. Test release response, và request kết thúc `finished`.
5. Ở 10000 và 10001 ms, request kết thúc `failed`. Test gọi `runFor(1)` trong mỗi lần poll cho tới khi status báo lỗi.

| Mutant | Test fail | Nguồn |
| --- | --- | --- |
| Deadline 9999 ms | Request bị abort ở 9999 ms | [[4, Mutation]](#ref-4) |
| Deadline 10001 ms | Request chưa kết thúc ở 10000 ms | [[4, Mutation]](#ref-4) |
| Deadline 10002 ms | Request chưa kết thúc ở 10001 ms | [[4, Mutation]](#ref-4) |

Deadline của Web dùng `setTimeout`, nên clock của trang điều khiển được deadline này [[4, Build]](#ref-4). `clock.install` thay các hàm thời gian mà docs liệt kê [[1, install]](#ref-1).

## Giới hạn còn lại

- Test status của MK-48 vẫn dựa vào deadline thật 10 giây. Rủi ro còn lại là máy rất chậm sau lúc gửi request [[4, Xử lý review]](#ref-4).
- Dev server render trong React `StrictMode`. Request đầu của mỗi query bị hủy, nên helper `latestRequest` theo request cuối cùng khớp URL [[5]](#ref-5). Cơ chế nằm trong Vòng đời fetch của TanStack Query v5 [[6]](#ref-6).

## References

1. <a id="ref-1"></a>[Clock](https://playwright.dev/docs/api/class-clock), Playwright docs, truy cập ngày 2026-11-21
2. <a id="ref-2"></a>[coreBundle.js, playwright-core 1.65.1](https://unpkg.com/playwright-core@1.65.1/lib/coreBundle.js), Microsoft, truy cập ngày 2026-11-21
3. <a id="ref-3"></a>[notifyManager.ts, @tanstack/query-core 5.107.1](https://unpkg.com/@tanstack/query-core@5.107.1/src/notifyManager.ts), TanStack, truy cập ngày 2026-11-21
4. <a id="ref-4"></a>[Kết quả build REST Market Data](../build/01-prototype-to-implementation/market-data/work/step-08-rest-build/execution.md)
5. <a id="ref-5"></a>[rest-history.spec.ts](../../apps/web/e2e/market-data/rest-history.spec.ts)
6. <a id="ref-6"></a>[Vòng đời fetch của TanStack Query v5](tanstack-query-v5-fetch-lifecycle.md)
