# Knowledge

Đọc file này để biết `docs/lessons/` chứa kiến thức gì và tìm file kiến thức theo chủ đề.

## Phạm vi

Folder này là tầng Knowledge: kiến thức có nguồn thu được khi làm dự án, gồm pattern, anti-pattern, kết quả research và giới hạn của công cụ. Convention, skill và kế hoạch trích các file ở đây làm nguồn khi đặt quy tắc hoặc chọn cách làm [[1, Các tầng]](#ref-1). Quy ước viết file kiến thức nằm trong Knowledge Documentation [[2]](#ref-2).

| Thuộc `docs/lessons/` | Không thuộc `docs/lessons/` |
| --- | --- |
| Anti-pattern khi code dựa trên test có sẵn, kèm nguồn và hướng chặn | Quy tắc bắt buộc cho file output. Quy tắc nằm trong [Conventions](../conventions/README.md) |
| Kết quả research về công cụ, chuẩn hoặc phương pháp | Lỗi hành vi đã xảy ra của agent. Lỗi này nằm trong [`LESSONS.md`](../../LESSONS.md) và cần người dùng duyệt |
| Giới hạn đã kiểm của một công cụ, ví dụ phần Playwright không kiểm được | Tiến độ, kế hoạch và kết quả của một step. Các nội dung này nằm trong `docs/build/` |

## Table of Contents

| File | Subject |
| --- | --- |
| [test-gaming-anti-patterns.md](test-gaming-anti-patterns.md) | Anti-pattern khi code dựa trên test có sẵn: viết code chỉ để pass test, sửa test để hết lỗi, sửa bộ đo |

## References

1. <a id="ref-1"></a>[Conventions](../conventions/README.md)
2. <a id="ref-2"></a>[Knowledge Documentation](../conventions/knowledge.md)
