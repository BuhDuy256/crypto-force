# Design

Đọc file này để biết thiết kế giao diện và luồng màn hình, và tìm file thiết kế tương ứng.

## Table of Contents

| File | Subject |
| --- | --- |
| [UI.html](UI.html) | Design board "Crypto Force – Workspace Review" gồm 11 màn hình |

## UI.html

`UI.html` là file HTML tự chứa (self-contained) chứa design board **Crypto Force – Workspace Review** với 11 màn hình của Crypto Force. File nhúng sẵn CSS, JavaScript, font Onest và nội dung của từng màn hình, nên chỉ cần mở trực tiếp bằng trình duyệt (double-click hoặc kéo file vào cửa sổ trình duyệt), không cần web server hay kết nối mạng.

- File cần JavaScript để giải nén bundle và render nội dung. Khi JavaScript bị tắt, trang chỉ hiển thị thông báo "This page requires JavaScript to display."
- Thanh điều hướng dạng sticky ở đầu trang liệt kê đủ 11 board; chọn một mục để cuộn tới board tương ứng.
- Mỗi board render màn hình trong một iframe và có nút chuyển chế độ xem **Desktop** (giữ nguyên chiều rộng thiết kế), **Tablet** (768 px) và **Mobile** (390 px).
- Board `Component · App header` chỉ chứa component app header, không phải một màn hình đầy đủ.

Design board gồm 11 board theo thứ tự sau:

| # | Board | Kích thước (px) |
| --- | --- | --- |
| 1 | Landing | 1440×3700 |
| 2 | Sign in / Create account / Verify / Reset | 1280×900 |
| 3 | 404 / Error (variant in Tweaks) | 1280×800 |
| 4 | App · Realtime | 1600×1100 |
| 5 | App · Strategy Engine | 1600×1180 |
| 6 | App · Discovery | 1600×1200 |
| 7 | App · Backtest | 1600×1900 |
| 8 | App · News | 1600×1500 |
| 9 | App · Settings | 1440×2000 |
| 10 | App · Empty & loading states | 1600×1300 |
| 11 | Component · App header | 1440×61 |
