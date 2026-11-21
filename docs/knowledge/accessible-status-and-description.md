# Status, mô tả và focus cho người dùng công nghệ hỗ trợ

Đọc file này để biết cách làm một live region, một mô tả bằng `aria-describedby` và một nút Retry giữ focus hoạt động với cây accessibility, và các lỗi đã gặp ở Market Data.

## Tóm tắt

- Live region phải có trước khi nội dung đổi. MDN khuyên đặt live region rỗng trong markup ban đầu [[1, Live regions]](#ref-1). `display: none` loại phần tử khỏi cây accessibility [[2, Accessibility]](#ref-2). Vì vậy một status bị ẩn khi rỗng không có trong cây lúc nội dung đổi [[3, Test mới]](#ref-3).
- Với `role="status"`, MDN khuyên thêm `aria-live="polite"` để tương thích tốt hơn [[1, Roles with implicit live region attributes]](#ref-1).
- Mô tả từ `aria-describedby` là kết quả tính tên của các phần tử được tham chiếu [[4, 4.2]](#ref-4). Bước tính tên dùng `aria-label` của phần tử [[4, 4.3.2]](#ref-4). `Inferred`: khi `aria-describedby` trỏ tới phần tử có `aria-label`, mô tả là label đó, không phải text bên trong. Chromium cho kết quả này khi agent viết test của Market Data. Execution không ghi lần quan sát này.
- `aria-disabled` không đổi khả năng nhận focus. Web phải tự chặn chức năng của phần tử [[5, Description]](#ref-5).

## Lỗi đã gặp và cách sửa

| Lỗi | Nguyên nhân | Cách sửa | Nguồn |
| --- | --- | --- | --- |
| Status rỗng không có trong cây accessibility | Class `empty:hidden` ẩn status khi không có text. Live region không có trước khi trạng thái đổi | Status luôn có trong DOM. Khi rỗng, status dùng `sr-only` | [[3, Test mới]](#ref-3) |
| Mô tả chart đọc ra "Chart 1 values" thay vì giá trị | `aria-describedby` trỏ tới đoạn có `aria-label` | `aria-describedby` trỏ tới `<span>` bên trong, span không có `aria-label` | Agent thấy lỗi này khi viết test, execution không ghi lỗi. Test kỳ vọng description là text giá trị [[6]](#ref-6). Mutant bỏ liên kết mô tả làm test fail [[3, Mutation]](#ref-3) |
| Focus mất sau khi Retry thành công | Nút Retry rời DOM khi có data, trong lúc nút giữ focus | Hook `useRetryFocus` chuyển focus vào vùng chart hoặc sidebar | [[3, Quyết định của agent]](#ref-3) |
| Focus mất trong lúc retry | TanStack Query đưa query về `pending`, nên nút Retry rời DOM | Nút ở lại từ lần lỗi đầu tới khi có data, với `aria-disabled` khi đang tải | [[3, Test mới]](#ref-3) [[7]](#ref-7) |

MDN ghi rằng phần tử bị ẩn nhưng được `aria-describedby` tham chiếu vẫn được đưa tới công nghệ hỗ trợ [[2, Accessibility]](#ref-2). `Inferred`: phần tử mô tả có thể bị ẩn, còn live region thì không, vì live region phải nằm trong cây để báo thay đổi.

## Cách kiểm

- Playwright kiểm role, name, description và focus. Test so sánh kết quả của Playwright với `Accessibility.getPartialAXTree` của Chromium [[3, Test mới]](#ref-3).
- Test kiểm status là cùng một phần tử trước và sau thay đổi bằng `MutationObserver` và một attribute đánh dấu [[6]](#ref-6).
- Playwright không kiểm lời đọc của screen reader [[3, Kiểm trên trình duyệt]](#ref-3).

## References

1. <a id="ref-1"></a>[ARIA live regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions), MDN, truy cập ngày 2026-11-21
2. <a id="ref-2"></a>[display](https://developer.mozilla.org/en-US/docs/Web/CSS/display), MDN, truy cập ngày 2026-11-21
3. <a id="ref-3"></a>[Kết quả build REST Market Data](../build/01-prototype-to-implementation/market-data/work/step-08-rest-build/execution.md)
4. <a id="ref-4"></a>[Accessible Name and Description Computation 1.2](https://www.w3.org/TR/2026/WD-accname-1.2-20261104/), W3C Working Draft 04 November 2026, truy cập ngày 2026-11-21
5. <a id="ref-5"></a>[aria-disabled](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-disabled), MDN, truy cập ngày 2026-11-21
6. <a id="ref-6"></a>[rest-history.spec.ts](../../apps/web/e2e/market-data/rest-history.spec.ts)
7. <a id="ref-7"></a>[Vòng đời fetch của TanStack Query v5](tanstack-query-v5-fetch-lifecycle.md)
