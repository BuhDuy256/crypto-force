# Lỗi khi dùng mutation để chứng minh test

Đọc file này để biết những trường hợp một lượt mutation cho kết luận sai về độ nhạy của test, dấu hiệu nhận ra và cách sửa.

## Tóm tắt

- Một mutant sống sót không phải lúc nào cũng là test yếu. Library có thể làm mutant tương đương với code gốc [[1, Mutation]](#ref-1).
- Oracle có giới hạn thời gian chờ dài hơn một cơ chế khác cho cùng kết quả không phân biệt được mutant với code đúng [[1, Xử lý review]](#ref-1).
- Một test có thể pass trên mọi mutant vì kết quả mà test chờ không bao giờ xảy ra. Đây là dạng The Liar [[2]](#ref-2).
- Lượt chạy có 0 test pass và 0 test fail không chứng minh gì. Script mutation phải kiểm số test đã chạy [[1, Mutation]](#ref-1).

## Trường hợp đã gặp

| Trường hợp | Ví dụ ở Market Data | Dấu hiệu | Cách sửa | Nguồn |
| --- | --- | --- | --- | --- |
| Mutant tương đương do library | Bỏ guard `if (query.isFetching) return;` của Retry. TanStack Query trả promise đang chạy cho `refetch()` của query chưa có data, nên số request không đổi | Mutant sống sót, nhưng source của library cho thấy hành vi không đổi | Ghi mutant là tương đương kèm nguồn. Kiểm hành vi bằng assertion khác, ví dụ `aria-disabled` | [[1, Mutation]](#ref-1) [[3]](#ref-3) |
| Oracle chờ lâu hơn cơ chế khác | Mutant "không chuyển tiếp abort" sống sót khi test chờ request cũ kết thúc trong 10 giây. Deadline 10 giây của Web cũng làm request kết thúc `failed` | Mutant sống sót với cùng outcome mà code đúng cho | Giới hạn chờ ngắn hơn mọi cơ chế khác: 3 giây, so với timeout 5 giây của API và deadline 10 giây của Web | [[1, Xử lý review]](#ref-1) [[4]](#ref-4) |
| Test chờ kết quả không bao giờ xảy ra | Test "response cũ sau release không thay pair mới". Web hủy request cũ, nên response không bao giờ tới trang. Assertion pass với mọi code | Reviewer không tìm được mutant nào làm test fail | Test assert outcome trực tiếp: request cũ kết thúc `failed` | [[1, Xử lý review]](#ref-1) |
| Lượt chạy không chạy test | Bốn mutant báo 0 pass và 0 fail vì `pnpm` tạm thời không có trong PATH của shell | Tổng số test bằng 0 | Không tính lượt đó. Chạy lại. `Agent đề xuất`: script báo lỗi khi tổng số test bằng 0 | [[1, Mutation]](#ref-1) |

## Quy trình đã dùng

Script mutation của Task 5 chạy từng mutant theo các bước sau [[1, Mutation]](#ref-1):

1. Áp một mutant vào file.
2. Chạy các test liên quan.
3. Khôi phục file.
4. Chạy lại cùng các test và xác nhận các test pass.

Bảng mutation ghi assertion fail của mỗi mutant. `Agent đề xuất`: một mutant chỉ được tính là bị bắt khi test fail tại assertion, không fail ở setup, vì lỗi setup không chứng minh assertion bắt được hành vi sai.

## References

1. <a id="ref-1"></a>[Kết quả build REST Market Data](../build/01-prototype-to-implementation/market-data/work/step-08-rest-build/execution.md)
2. <a id="ref-2"></a>[Anti-pattern khi code dựa trên test có sẵn](test-gaming-anti-patterns.md)
3. <a id="ref-3"></a>[query.ts, @tanstack/query-core 5.107.1](https://unpkg.com/@tanstack/query-core@5.107.1/src/query.ts), TanStack, truy cập ngày 2026-11-21
4. <a id="ref-4"></a>[rest-history.spec.ts](../../apps/web/e2e/market-data/rest-history.spec.ts)
