# Architecture Documentation

Đọc file này để biết một file trong `docs/architecture/` phải gồm những phần nào, trỏ về use case ra sao và ghi quyết định kiến trúc thế nào.

Quy tắc chung của mọi tài liệu nằm trong [Documentation Conventions](docs.md). Quy tắc được `pnpm check:docs` kiểm được đánh dấu *(check-docs)*.

## Phạm vi của `docs/architecture/`

`docs/architecture/` mô tả cơ chế bên trong giúp hệ thống đáp ứng use case và quality attribute: thành phần, luồng giữa các thành phần, dữ liệu, contract, quyết định và rủi ro. Hành vi quan sát được từ bên ngoài và số đo của hành vi đó nằm trong `docs/UCs/` [[1]](#ref-1).

- File architecture trỏ tới ID trong `docs/UCs/` bằng cụm nội dung kèm ID, ví dụ "link reset chỉ dùng một lần (RP-04)". Không chép giá trị của rule; khi cần con số, link tới rule đó.
- Phân biệt yêu cầu của [Project Brief](../UCs/sources/project-brief.md) với phương án kiến trúc do nhóm đề xuất.
- Quyết định chưa thống nhất mang nhãn `Proposed` hoặc `Open`.
- Mỗi file chỉ mô tả quyết định trong phạm vi của nó. Chi tiết đã có ở file khác thì link tới file đó.
- Cấu trúc tài liệu không phải cấu trúc bắt buộc của source code. Cấu trúc source code nằm trong [Project Structure](project-structure.md).

## Khung của file architecture

Các section theo thứ tự sau. File chưa có nội dung chỉ có heading và dòng mục đích. File có nội dung (trừ `README.md` và `30-decisions.md`) có section `## Drivers` *(check-docs)*.

| Section | Nội dung | Diagram |
| --- | --- | --- |
| `# <Phạm vi>` + dòng mục đích | theo [Cấu trúc file](docs.md#cấu-trúc-file) | |
| `## Drivers` | Bảng có cột Driver và cột Cơ chế đáp ứng; mỗi dòng là một use case, rule hoặc quality attribute (cụm nội dung kèm ID, có link) và cơ chế đáp ứng nó | |
| `## Thành phần` | Trách nhiệm của từng thành phần, ranh giới phụ thuộc | `flowchart` (C4 Container hoặc Component) |
| `## Kịch bản chính` | Mỗi use case hoặc quality attribute quan trọng một kịch bản, mở hộp đen của use case: Web, API, Worker, database, dịch vụ ngoài | `sequenceDiagram` |
| `## Trạng thái` | Trạng thái nội bộ, ví dụ job, kết nối WebSocket | `stateDiagram-v2` |
| `## Quyết định` | Bảng có cột Hạng mục và cột Quyết định; quyết định có trade-off lớn link tới ADR | |
| `## Rủi ro` | Rủi ro còn lại và lý do chấp nhận | |
| `## References` | theo [Trích dẫn nguồn](docs.md#trích-dẫn-nguồn) | |

File chung dùng diagram theo loại nội dung: `00-system.md` dùng `flowchart` cho C4 Context và Container; `21-database.md` dùng `erDiagram`; `22-api-endpoints.md` dùng bảng endpoint và `sequenceDiagram` cho luồng WebSocket.

`README.md` có ma trận `Driver | File` từ mỗi file use case và từ `quality-attributes.md` tới file architecture đáp ứng nó.

## Architectural Decision Record

ADR nằm trong `30-decisions.md`, ID dạng `ADR-XXX`, không đổi và không dùng lại. Mỗi ADR có các phần:

| Phần | Nội dung |
| --- | --- |
| `## ADR-XXX: <quyết định>` | Heading nêu chính quyết định, không nêu chủ đề chung chung |
| `**Status:**` | `Proposed`, `Accepted (YYYY-MM-DD)`, `Superseded by ADR-YYY` hoặc `Deprecated` |
| `### Bối cảnh` | Vấn đề, ràng buộc, driver (cụm nội dung kèm ID) |
| `### Phương án đã xét` | Các phương án và trade-off. Bỏ phần này khi chỉ có một phương án khả thi, và nêu lý do trong Bối cảnh |
| `### Quyết định` | Điều được chọn, đủ cụ thể để kiểm được |
| `### Lý do` | Vì sao phương án được chọn hơn các phương án khác |
| `### Rủi ro chấp nhận` | Khi có |
| `### Hệ quả` | Điều dễ hơn, điều khó hơn, điều kiện phải xét lại quyết định |

ADR đã Accepted không được sửa nội dung quyết định. Khi quyết định thay đổi, viết ADR mới và đổi Status của ADR cũ thành `Superseded by ADR-YYY`.

## References

1. <a id="ref-1"></a>[Use Case Documentation](use-cases.md)
