# Contributing to Documentation

Đọc file này để biết các quy tắc viết và maintain tài liệu trong `docs/` .

## General Conventions

> Các quy tắc chung về cấu trúc áp dụng cho toàn bộ tài liệu trong `docs/` . Những quy tắc này được ưu tiên hơn các template hoặc quy ước khác khi có xung đột.

1. Mỗi file tài liệu (`.md`, `.txt`, ...) phải có một heading cấp 1 (`# Title`), theo sau là đúng một dòng mô tả mục đích của file, trả lời câu hỏi **"Đọc file này để làm gì?"**. Dòng mô tả phải bắt đầu bằng "Đọc file này để biết ...", "Đọc file này để ..." hoặc "Đọc file này giúp ...".
2. Với file chưa có nội dung, chỉ tạo heading cấp 1 và dòng mô tả mục đích. Không thêm các section như `Purpose`,  `Status` hoặc placeholder.
3. Không áp dụng các quy tắc trên cho source code, file được generate tự động hoặc file có định dạng bắt buộc riêng.
4. Trích dẫn nguồn theo kiểu paper khi một câu, dòng bảng hoặc bullet dựa vào nội dung của tài liệu khác (yêu cầu, quyết định, số liệu, hành vi). Không áp dụng cho bảng Table of Contents trong `README.md` và link tới heading trong cùng file.
   * Trong văn bản, viết `[[n]](#ref-n)`. Khi cần chỉ tới một phần cụ thể, thêm vị trí sau dấu phẩy: `[[1, §17]](#ref-1)` với heading có số, `[[2, Mất kết nối]](#ref-2)` với heading không có số.
   * Section `## References` là section cuối cùng của file. Mỗi file nguồn có đúng một số, đánh liên tục theo thứ tự xuất hiện lần đầu trong văn bản. Tên hiển thị là heading cấp 1 của file nguồn.

     ```markdown
     ## References

     1. <a id="ref-1"></a>[Project Brief](../requirements/project-brief.md)
     2. <a id="ref-2"></a>[Realtime](../design/reqs-from-ui/realtime.md)
     ```

   * Ví dụ:
     * Before: `Mất kết nối Binance phải tự kết nối lại (Brief §17, [realtime.md](../design/reqs-from-ui/realtime.md)).`
     * After: `Mất kết nối Binance phải tự kết nối lại [[1, §17]](#ref-1) [[2, Mất kết nối]](#ref-2).`
5. Câu hỏi mở (vấn đề chưa được quyết) chỉ được ghi trong [`open-questions.md`](open-questions.md), theo quy ước ở đầu file đó. File khác muốn nhắc tới một câu hỏi thì link theo ID (`open-questions.md#oq-xxx`), không chép nội dung câu hỏi.
   * Khi một câu được quyết, ghi nội dung đã chốt vào tài liệu chính, hoặc vào ADR trong [`architecture/30-decisions.md`](architecture/30-decisions.md) nếu là quyết định kiến trúc có trade-off. Sau đó chuyển câu xuống bảng Resolved & Dropped, kèm trích dẫn tới nơi đã ghi.
   * Không xoá câu hỏi. Câu không còn cần thiết chuyển sang Dropped, kèm lý do.

## Architecture Documentation

Áp dụng cho tài liệu trong `docs/architecture/` .

* Mỗi file mô tả các quyết định thuộc phạm vi của mình, tránh lặp lại chi tiết đã có trong file khác.
* Các quyết định chưa được thống nhất phải được đánh dấu là `Proposed` hoặc `Open`.
* Phân biệt yêu cầu trong [Project Brief](requirements/project-brief.md) với phương án kiến trúc do nhóm đề xuất.
* Sử dụng liên kết đến tài liệu liên quan thay vì sao chép nội dung.
* Không xem cấu trúc tài liệu là cấu trúc bắt buộc của source code.

## Design Documentation

...

## Requirement Documetation

...
