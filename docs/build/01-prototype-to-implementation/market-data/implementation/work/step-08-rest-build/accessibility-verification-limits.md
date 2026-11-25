# Giới hạn kiểm accessibility bằng Playwright

Đọc file này để biết Bước 08 kiểm accessibility bằng cách nào, Playwright có thể pass ở chỗ nào trong khi người dùng screen reader không nhận được thông tin, và cách giảm các điểm lệch đó.

## Quyết định

Product owner quyết định ngày 2026-11-21: Bước 08 không dùng NVDA hoặc screen reader khác. Playwright là công cụ kiểm accessibility của flow REST.

Do đó Bước 08 chỉ kết luận ở mức **khai báo**: trang có cung cấp role, name, trạng thái và focus đúng cho công cụ hỗ trợ hay không. Bước 08 không kết luận ở mức **trải nghiệm**: screen reader có đọc thông tin đó cho người dùng hay không. WCAG 4.1.3 và 1.1.1 yêu cầu thông tin xác định được bằng chương trình, nên mức khai báo là bằng chứng phù hợp cho hai SC này [[1, Đối chiếu WCAG 2.2]](#ref-1).

## Phần Playwright kiểm được

| Requirement                               | Cách kiểm bằng Playwright                                                                                           |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Thao tác bằng bàn phím (MK-46)            | Chỉ dùng `keyboard.press` để chọn pair, timeframe, số chart và retry                                                |
| Mô tả chart bằng chữ (MK-47)              | `getByRole` tìm mô tả theo name. So nội dung với nến cuối của fixture                                               |
| Thông báo trạng thái (MK-48)              | Tìm phần tử `role="status"`. Kiểm nội dung loading, empty, error. Kiểm thời điểm phần tử xuất hiện, xem điểm lệch 1 |
| Không chỉ dùng màu (MK-49)                | Kiểm nhãn chữ tăng/giảm. Phần nến trên canvas cần kiểm trực quan                                                    |
| Reflow và một cột ở 320 px (MK-50, MK-59) | So `scrollWidth` với `clientWidth`, kiểm vị trí các chart                                                           |
| Focus (MK-58)                             | `toBeFocused()` sau retry và sau khi đổi lựa chọn. Focus nhìn thấy cần kiểm bằng ảnh                                |

## Điểm lệch có thể gặp

### 1. Live region xuất hiện cùng lúc với nội dung

MDN ghi: "Assistive technologies will generally only announce _dynamic_ changes in the content of a live region. Establish the live region before updating its content." [[2, Live regions]](#ref-2)

Ví dụ trong Realtime: chart chuyển sang loading, React mount mới `<div role="status">Đang tải…</div>` cùng lúc với chữ. Test `expect(getByRole('status')).toHaveText('Đang tải…')` pass. Screen reader có thể không đọc vì nó không thấy thay đổi nào trong một region đã có từ trước.

Cách giảm trong Playwright:

- Kiểm phần tử status của mỗi chart đã có trong DOM trước khi thao tác đổi trạng thái. Sau thao tác, kiểm vẫn là phần tử đó và chỉ nội dung thay đổi.
- Thêm `aria-live="polite"` cùng với `role="status"`, theo khuyến nghị của MDN cho status: "To maximize compatibility, add a redundant `aria-live="polite"` when using this role." [[2, Roles with implicit live region attributes]](#ref-2)

Rủi ro còn lại: MDN ghi "Behavior can vary across browser and assistive technology combinations." [[2, Live regions]](#ref-2). Region đúng cấu trúc vẫn có thể không được đọc trên một tổ hợp cụ thể.

### 2. Role và name do Playwright tự tính

Playwright mô tả `getByRole` là locator "reflects how users and assistive technology perceive the page" [[3, Locate by role]](#ref-3). Source của `playwright-core` 1.65.1 trong `node_modules` tính role và accessible name bằng code JS riêng (`computeAriaRole`, `getElementAccessibleName`). Bundle không gọi `Accessibility.getFullAXTree` của Chrome. Agent kiểm bằng cách tìm các tên hàm này trong `lib/coreBundle.js` ngày 2026-11-21. Trang ARIA snapshot của Playwright không nói snapshot lấy từ browser hay do Playwright tính [[4, Aria snapshots]](#ref-4).

Do đó kết quả Playwright là cách Playwright hiểu spec ARIA và HTML, không phải cây accessibility mà Chrome gửi cho Windows. Hai cách tính có thể khác nhau trong ca ít gặp, ví dụ name ghép từ nhiều nguồn hoặc phần tử có `aria-hidden` ở cha.

Cách giảm: với mô tả chart (MK-47) và status (MK-48), đọc thêm cây accessibility của Chromium qua CDP (`Accessibility.getPartialAXTree`) và so role/name với kết quả của `getByRole`. Phép kiểm này chỉ áp dụng cho Chromium.

Rủi ro còn lại: cây accessibility của Chromium vẫn chưa phải thứ screen reader đọc ra. Screen reader có thể bỏ qua hoặc đọc khác thông tin trong cây.

### 3. Cách screen reader đọc thực tế

Playwright không quan sát được các hành vi sau của screen reader:

- Thông báo polite bị thông báo sau cắt ngang, khi bốn chart đổi trạng thái gần cùng lúc.
- Một thay đổi bị đọc hai lần.
- Thứ tự đọc trong chế độ duyệt và cách screen reader bỏ qua canvas.
- Tiền tố hoặc cách đọc riêng của từng tổ hợp browser và screen reader [[2, Live regions]](#ref-2).

Cách giảm: kiểm mỗi lần chuyển trạng thái chỉ đổi nội dung status của chart liên quan một lần. Chart khác không đổi status. Phép kiểm này giảm nguy cơ đọc lặp, nhưng không chứng minh thứ tự đọc.

Rủi ro còn lại: phần này không kiểm được nếu không có screen reader. Playwright không thay thế được việc kiểm này. Playwright cũng ghi role locator "do not replace accessibility audits and conformance tests" [[3, Locate by role]](#ref-3).

## Cách ghi kết quả

- Ghi MK-46 đến MK-50, MK-58, MK-59 theo kết quả Playwright và kiểm trực quan. Mỗi requirement có kết quả riêng.
- Với MK-47 và MK-48, ghi kết quả là mức khai báo. Ghi phần đọc bằng screen reader là "Không kiểm, theo quyết định của product owner ngày 2026-11-21", kèm link tới file này. Không ghi Inconclusive cho phần này, vì đây là phạm vi đã chốt, không phải bằng chứng còn thiếu.
- Task 5 cập nhật câu yêu cầu kiểm screen reader trong tài liệu kiểm chứng REST theo quyết định này [[1, E2E và phần kiểm thủ công]](#ref-1).

## References

1. <a id="ref-1"></a>[Kiểm chứng REST tải lịch sử](../../../../../../testing/test-scopes/TS-002-market-data/rest-verification.md)
2. <a id="ref-2"></a>[MDN: ARIA live regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions), truy cập ngày 2026-11-21
3. <a id="ref-3"></a>[Playwright: Locators](https://playwright.dev/docs/locators), truy cập ngày 2026-11-21
4. <a id="ref-4"></a>[Playwright: Snapshot testing](https://playwright.dev/docs/aria-snapshots), truy cập ngày 2026-11-21
