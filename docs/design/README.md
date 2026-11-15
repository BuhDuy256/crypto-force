# Design

Thư mục chứa các tài liệu tham khảo UI/UX của Crypto Force, giúp định hướng thiết kế và trải nghiệm người dùng, **không phải implementation specification bắt buộc phải sao chép nguyên mẫu**.

## Table of Contents

| File | Subject |
| --- | --- |
| [Crypto Force UI.html](Crypto%20Force%20UI.html) | Bản export gốc từ Claude Web UI Design: design board gồm 12 board (11 màn hình và component App header) |
| [prototype/](prototype/README.md) | Prototype dạng source có cùng giao diện và tương tác với `Crypto Force UI.html`; mỗi màn hình là một file sửa được và các màn hình liên kết với nhau |
| [Landing.png](Landing.png) | Màn hình landing page |
| [Sign in.png](Sign%20in.png) | Màn hình đăng nhập / tạo tài khoản |
| [404.png](404.png) | Màn hình lỗi 404 |
| [Realtime.png](Realtime.png) | Màn hình Realtime |
| [Strategy Engine.png](Strategy%20Engine.png) | Màn hình Strategy Engine |
| [Strategy library.png](Strategy%20library.png) | Màn hình thư viện strategy và composite |
| [Discovery.png](Discovery.png) | Màn hình Discovery |
| [Backtest.png](Backtest.png) | Màn hình Backtest |
| [News.png](News.png) | Màn hình News |
| [Settings.png](Settings.png) | Màn hình Settings |
| [Empty & loading states.png](Empty%20%26%20loading%20states.png) | Trạng thái rỗng và trạng thái đang tải |
| [reqs-from-ui/](reqs-from-ui/README.md) | Hành vi sản phẩm theo UI: tác vụ, chuyển màn hình, thay đổi dữ liệu và các **điểm UI chưa xác định** (rút ra từ Claude Web vì `Crypto Force UI.html` được export ra từ Claude Web UI Design chỉ rút ra được UI, không rút ra được hành vi sản phẩm) |

## Ảnh màn hình (PNG)

Các file PNG trong thư mục này là ảnh mỗi màn hình của design board, dùng để xem nhanh một màn hình cụ thể mà không cần mở file HTML. Nội dung ảnh tương ứng với các board trong [Crypto Force UI.html](Crypto%20Force%20UI.html).

## Crypto Force UI.html

`Crypto Force UI.html` là file HTML tự chứa (self-contained), nhúng sẵn CSS, JavaScript, font Onest và nội dung của 12 board. Có thể mở trực tiếp bằng trình duyệt, không cần web server. Đây là bản export gốc, không chỉnh sửa trực tiếp.

### How to Use

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

### Navigation

* File cần JavaScript để giải nén bundle và render giao diện.
* Các board xếp dọc trên một trang, mỗi board là một iframe có kích thước thiết kế. Tương tác trong từng board hoạt động, nhưng link chuyển sang màn hình khác không mở được vì các màn hình không được export thành file riêng.
* `App header (component)` là component reference, không phải màn hình đầy đủ.

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

*Kích thước chỉ mang tính tham khảo, không phải yêu cầu cố định khi triển khai.*

**Guiding principle:** Crypto Force UI.html is a design reference, not a source of truth for product requirements or implementation details.

## Prototype

[`prototype/`](prototype/README.md) chứa source của cùng 12 board, gồm markup, CSS, logic tương tác và dữ liệu mẫu. Các phần dùng chung như App header, styles, font và runtime được tách thành file riêng. Chạy bằng lệnh:

```bash
node docs/design/prototype/serve.mjs
```

rồi mở `http://127.0.0.1:4173/`. Khác với `Crypto Force UI.html`, prototype điều hướng được giữa các màn hình (link, reload, mở URL trực tiếp) và là nơi để chỉnh sửa thiết kế. Prototype cũng là design reference, không phải production frontend; mục [How to Use](#how-to-use) áp dụng cho prototype giống như cho `Crypto Force UI.html`.
