# Crypto Force Documentation

Đọc file này để biết cách tài liệu của Crypto Force được tổ chức và các quy tắc viết tài liệu trong `docs/` .

## Table of Contents

| Folder | Subject |
| --- | --- |
| [requirements/](requirements/README.md) | System description, functional và non-functional requirements |
| [architecture/](architecture/README.md) | Quyết định kiến trúc, core domain, dữ liệu và giao tiếp |
| [design/](design/README.md) | Thiết kế giao diện |
| [development/](development/README.md) | CI/CD và quy trình phát triển |

## Documentation Conventions

> Các quy tắc chung về cấu trúc áp dụng cho toàn bộ tài liệu trong `docs/` . Những quy tắc này được ưu tiên hơn các template hoặc quy ước khác khi có xung đột.

1. Mỗi file tài liệu (`.md`, `.txt`, ...) phải có một heading cấp 1 (`# Title`), theo sau là đúng một dòng mô tả mục đích của file, trả lời câu hỏi **"Đọc file này để làm gì?"**. Dòng mô tả phải bắt đầu bằng "Đọc file này để biết ...", "Đọc file này để ..." hoặc "Đọc file này giúp ...". 
2. Với file chưa có nội dung, chỉ tạo heading cấp 1 và dòng mô tả mục đích. Không thêm các section như `Purpose`,  `Status` hoặc placeholder.
3. Không áp dụng các quy tắc trên cho source code, file được generate tự động hoặc file có định dạng bắt buộc riêng.
