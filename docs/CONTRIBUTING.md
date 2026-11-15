# Contributing to Documentation

Đọc file này để biết các quy tắc viết và maintain tài liệu trong `docs/` .

## General Conventions

> Các quy tắc chung về cấu trúc áp dụng cho toàn bộ tài liệu trong `docs/` . Những quy tắc này được ưu tiên hơn các template hoặc quy ước khác khi có xung đột.

1. Mỗi file tài liệu (`.md`, `.txt`, ...) phải có một heading cấp 1 (`# Title`), theo sau là đúng một dòng mô tả mục đích của file, trả lời câu hỏi **"Đọc file này để làm gì?"**. Dòng mô tả phải bắt đầu bằng "Đọc file này để biết ...", "Đọc file này để ..." hoặc "Đọc file này giúp ...".
2. Với file chưa có nội dung, chỉ tạo heading cấp 1 và dòng mô tả mục đích. Không thêm các section như `Purpose`,  `Status` hoặc placeholder.
3. Không áp dụng các quy tắc trên cho source code, file được generate tự động hoặc file có định dạng bắt buộc riêng.

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
