# [TS-XXX]: [Tên đối tượng kiểm thử]

Đọc file này để biết [TS-XXX] kiểm thử đối tượng nào, dựa trên test basis nào, và từng phase đang ở trạng thái nào.

## Đối tượng kiểm thử

| Mục | Nội dung |
| --- | --- |
| Test object | [feature, epic hoặc thành phần được kiểm thử; version hoặc commit nếu đã xác định] |
| Test basis | [tài liệu dùng làm căn cứ, mỗi tài liệu kèm version hoặc thời điểm chốt [[1]](#ref-1)] |
| Trong phạm vi | [chức năng, đặc tính chất lượng, test level] |
| Ngoài phạm vi | [phần không kiểm thử, kèm lý do] |
| Test plan | [Riêng: `02-planning/` trong thư mục này / Dùng chung: link tới `02-planning/` của TS-YYY] |
| Code test | [đường dẫn tới thư mục code test trong workspace] |

## Trạng thái phase

| Phase | Thư mục | Trạng thái | Kết luận |
| --- | --- | --- | --- |
| 01 Requirement Analysis | [01-requirement-analysis/](01-requirement-analysis/) | [Chưa bắt đầu / Đang làm / Đạt / Không đạt / Không áp dụng: lý do] | [link tới file output tổng hợp của phase] |
| 02 Test Planning | [02-planning/](02-planning/) | | |
| 03 Test Analysis & Design | [03-design/](03-design/) | | |
| 04 Test Implementation | [04-implementation/](04-implementation/) | | |
| 05 Test Execution | [05-execution/](05-execution/) | | |
| 06 Test Summary & Closure | [06-report/](06-report/) | | |

Thư mục của phase chưa bắt đầu ghi dạng code (ví dụ `02-planning/`), không ghi dạng link, vì thư mục đó chưa tồn tại.

Một phase có trạng thái Đạt khi mọi tiêu chí đạt trong các file output của phase đó đều đạt.

## References

1. <a id="ref-1"></a>[Tên tài liệu, lấy từ heading cấp 1 của file nguồn](đường-dẫn) — [version hoặc thời điểm chốt]
