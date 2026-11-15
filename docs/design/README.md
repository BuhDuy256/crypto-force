# Design

Thư mục chứa các tài liệu tham khảo UI/UX của Crypto Force, giúp định hướng thiết kế và trải nghiệm người dùng, **không phải implementation specification bắt buộc phải sao chép nguyên mẫu**.

## Table of Contents

| File | Subject |
| --- | --- |
| [Crypto Force UI.html](Crypto%20Force%20UI.html) | Design board "Crypto Force – Workspace Review" gồm 11 màn hình |
| [reqs-from-ui/](reqs-from-ui/README.md) | Hành vi sản phẩm theo UI: tác vụ, chuyển màn hình, thay đổi dữ liệu và các điểm **Cần chốt** |

## Crypto Force UI.html

`Crypto Force UI.html` là file HTML tự chứa (self-contained), nhúng sẵn CSS, JavaScript, font Onest và nội dung của 11 boards. Có thể mở trực tiếp bằng trình duyệt, không cần web server hoặc kết nối mạng.

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
* Thanh điều hướng sticky cho phép chuyển giữa 11 boards.
* Mỗi board hiển thị trong iframe với ba chế độ: **Desktop** (chiều rộng thiết kế), **Tablet** (768px) và **Mobile** (390px).
* `Component · App header` là component reference, không phải màn hình đầy đủ.

### Design Boards

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

*Kích thước chỉ mang tính tham khảo, không phải yêu cầu cố định khi triển khai.*

**Guiding principle:** Crypto Force UI.html is a design reference, not a source of truth for product requirements or implementation details.
