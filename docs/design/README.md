# Design

Thư mục chứa các tài liệu tham khảo UI/UX của Crypto Force, giúp định hướng thiết kế và trải nghiệm người dùng, **không phải implementation specification bắt buộc phải sao chép nguyên mẫu**.

## Table of Contents

| File | Subject |
| --- | --- |
| [prototype/](prototype/README.md) | Prototype dạng source của 12 board (11 màn hình và component App header); mỗi màn hình là một file sửa được và các màn hình liên kết với nhau |
| [prototype/docs/requirements/](prototype/docs/requirements/README.md) | Hành vi sản phẩm theo UI: tác vụ, chuyển màn hình và thay đổi dữ liệu. Prototype chỉ thể hiện giao diện và tương tác mô phỏng, không thể hiện hành vi sản phẩm, nên hành vi được mô tả riêng ở đây |

## Prototype

[`prototype/`](prototype/README.md) chứa markup, CSS, logic tương tác và dữ liệu mẫu của 12 board. Các phần dùng chung như App header, styles, font và runtime được tách thành file riêng. Chạy bằng lệnh:

```bash
node docs/design/prototype/serve.mjs
```

rồi mở `http://127.0.0.1:4173/` để xem toàn bộ board xếp dọc, hoặc `http://127.0.0.1:4173/screens/<Tên>.dc.html` để mở một màn hình. Các màn hình điều hướng được qua link, reload và mở URL trực tiếp. Chi tiết về cấu trúc và cách chỉnh sửa nằm trong [`prototype/README.md`](prototype/README.md).

### Design Boards

| # | Board | Kích thước (px) | File trong `prototype/screens/` |
| --- | --- | --- | --- |
| 1 | Landing | 1440×3700 | `Main.dc.html` |
| 2 | Sign in / Create account / Verify / Reset | 1280×900 | `Auth.dc.html` |
| 3 | 404 / Error | 1280×800 | `NotFound.dc.html` (biến thể Error: `?variant=error`) |
| 4 | Strategy library | 1440×1100 | `Library.dc.html` |
| 5 | App · Realtime | 1600×1100 | `Realtime.dc.html` |
| 6 | App · Strategy Engine | 1600×1180 | `Strategy.dc.html` |
| 7 | App · Discovery | 1600×1200 | `Discovery.dc.html` |
| 8 | App · Backtest | 1600×1500 | `Backtest.dc.html` |
| 9 | App · News | 1600×1500 | `News.dc.html` |
| 10 | App · Settings | 1440×2000 | `Settings.dc.html` |
| 11 | App · Empty & loading states | 1600×1300 | `States.dc.html` |
| 12 | App header (component) | 1440×61 | `AppHeader.dc.html` |

*Kích thước chỉ mang tính tham khảo, không phải yêu cầu cố định khi triển khai.* `App header (component)` là component reference, không phải màn hình đầy đủ.

## How to Use

**What to extract:**
* **Information Architecture:** Cấu trúc màn hình và cách nhóm chức năng.
* **User Flows & Interactions:** Tác vụ, hành động và trạng thái giao diện.
* **Visual Language:** Colors, typography, spacing và component styles.
* **Content Hierarchy:** Cách ưu tiên và trình bày thông tin.

**What NOT to assume:**
* Layout, kích thước và workflow trong prototype là cố định hoặc bắt buộc.
* UX copy, dữ liệu mẫu và tương tác demo là product requirements hoặc business logic đã được xác nhận.
* UI thể hiện đầy đủ mọi chức năng và trường hợp sử dụng.
* Ngôn ngữ giao diện quyết định ngôn ngữ đầu vào được hỗ trợ.

**Implementation principles:**
* **Preserve intent, not pixels.** Giữ ý đồ thiết kế, không sao chép máy móc.
* **Content-aware layout.** Bố cục thích ứng với nội dung, trạng thái và viewport; tránh khoảng trống hoặc kéo giãn component không cần thiết.
* **Task-oriented design.** Tổ chức giao diện theo tác vụ thực tế, không ép mọi chức năng thành workflow tuần tự.
* **Requirements first.** Đối chiếu với requirements và domain rules trước khi triển khai; không tự suy diễn khả năng sản phẩm.
* **Review & improve.** Chủ động cải thiện usability, visual balance, information hierarchy và responsive behavior mà không tự thay đổi business logic.

**Guiding principle:** The prototype is a design reference, not a source of truth for product requirements or implementation details. Production frontend dùng stack trong `CLAUDE.md` và không import code từ `prototype/`.
