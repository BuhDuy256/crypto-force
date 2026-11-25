# Vòng đời fetch của TanStack Query v5

Đọc file này để biết TanStack Query v5 đổi state, hủy request và dùng lại fetch đang chạy như thế nào, và hệ quả của các hành vi này cho UI có nút Retry và cho test.

## Tóm tắt

- Khi query chưa có data bắt đầu fetch lại, state quay về `status: 'pending'` và `error: null` [[1, fetchState]](#ref-1). Docs định nghĩa `pending` là trạng thái không có data và không có error [[2, Returns]](#ref-2). Vì vậy, một nút Retry chỉ hiện khi `isError` sẽ rời DOM trong lúc retry [[3, Test mới]](#ref-3).
- `errorUpdateCount` là tổng số lỗi [[2, Returns]](#ref-2). Bộ đếm này không về 0 khi fetch bắt đầu [[1, fetchState]](#ref-1). `Inferred`: điều kiện `!data && errorUpdateCount > 0` giữ nút Retry từ lần lỗi đầu tới khi có data.
- Khi observer cuối cùng rời query và query function đã đọc `signal`, query hủy fetch và trả state về như trước [[4, Default behavior]](#ref-4) [[1, removeObserver]](#ref-1). Khi query function không đọc `signal`, fetch chạy tiếp [[4, Default behavior]](#ref-4).
- Khi một fetch đang chạy, `fetch()` chỉ hủy fetch đó nếu query đã có data và `cancelRefetch` bật. Query chưa có data nhận lại promise đang chạy [[1, fetch]](#ref-1). `observer.refetch()` mặc định bật `cancelRefetch` [[5, refetch]](#ref-5).

Nguồn [[1]](#ref-1) và [[5]](#ref-5) là source của `@tanstack/query-core@5.107.1`, phiên bản Web đang dùng. Hành vi có thể khác ở phiên bản khác.

## Hành vi và hệ quả

| Hành vi | Nguồn | Hệ quả đã thấy ở Market Data | Biện pháp |
| --- | --- | --- | --- |
| Retry query chưa có data đưa state về `pending`, `error: null` | [[1, fetchState]](#ref-1) | Nút Retry chart rời DOM trong lúc tải. Focus mất, rồi nút xuất hiện lại khi retry lỗi [[3, Test mới]](#ref-3) | Điều kiện hiện nút dựa vào `errorUpdateCount` và data, không dựa vào `isError` [[3, Test mới]](#ref-3) |
| Observer cuối rời đi và `signal` đã được đọc: fetch bị hủy, state trả về như trước | [[4, Default behavior]](#ref-4) [[1, removeObserver]](#ref-1) | Đổi pair làm request nến của pair cũ kết thúc `failed` trong browser [[3, Test mới]](#ref-3) | Test kiểm request cũ bị hủy, không chờ response cũ tới trang [[3, Xử lý review]](#ref-3) |
| Đọc `signal` nhưng không chuyển `signal` tới `fetch` | `Inferred` từ [[1, removeObserver]](#ref-1): query hủy `AbortController` của nó, còn request HTTP không gắn với controller này | Mutant "không chuyển tiếp abort" làm request cũ chạy tiếp tới deadline 10 giây của Web [[3, Mutation]](#ref-3) | Test giới hạn thời gian chờ request cũ ở 3 giây [[3, Xử lý review]](#ref-3) |
| `refetch()` trên query chưa có data trả promise đang chạy | [[1, fetch]](#ref-1) | Bỏ guard `if (query.isFetching) return;` của Retry không làm tăng số request. Mutant này tương đương [[3, Mutation]](#ref-3) | Test kiểm `aria-disabled` và số request của browser. Guard được giữ làm lớp phòng thủ [[3, Mutation]](#ref-3) |
| React `StrictMode` chạy thêm một chu kỳ setup và cleanup cho mỗi Effect trong development | [[6, Fixing bugs found by re-running Effects in development]](#ref-6) | `Inferred`: observer đầu rời query, nên request đầu của mỗi query bị hủy và request thứ hai thay thế [[7]](#ref-7) | Helper của test theo request cuối cùng khớp URL [[7]](#ref-7) |

## References

1. <a id="ref-1"></a>[query.ts, @tanstack/query-core 5.107.1](https://unpkg.com/@tanstack/query-core@5.107.1/src/query.ts), TanStack, truy cập ngày 2026-11-21
2. <a id="ref-2"></a>[useQuery](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery), TanStack Query v5 docs, truy cập ngày 2026-11-21
3. <a id="ref-3"></a>[Kết quả build REST Market Data](../build/01-prototype-to-implementation/market-data/work/step-08-rest-build/execution.md)
4. <a id="ref-4"></a>[Query Cancellation](https://tanstack.com/query/v5/docs/framework/react/guides/query-cancellation), TanStack Query v5 docs, truy cập ngày 2026-11-21
5. <a id="ref-5"></a>[queryObserver.ts, @tanstack/query-core 5.107.1](https://unpkg.com/@tanstack/query-core@5.107.1/src/queryObserver.ts), TanStack, truy cập ngày 2026-11-21
6. <a id="ref-6"></a>[StrictMode](https://react.dev/reference/react/StrictMode), React docs, truy cập ngày 2026-11-21
7. <a id="ref-7"></a>[rest-history.spec.ts](../../apps/web/e2e/market-data/rest-history.spec.ts)
