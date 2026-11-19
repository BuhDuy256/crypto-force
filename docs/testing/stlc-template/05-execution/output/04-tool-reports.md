# Tool Reports

Đọc file này để biết kết quả của các công cụ đo chạy trong đợt thực thi, như code coverage, performance và security scanner, cùng điều kiện đo và giới hạn của từng kết quả.

## 1. Kết quả

| Report ID | Công cụ / version | Loại | Build và tập test | Điều kiện đo | Kết quả và đơn vị | Ngưỡng / nguồn | Link report |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [TR-01] | [công cụ; version] | [code coverage / performance / security scan / accessibility / ...] | [build; suite] | [workload, cấu hình, phạm vi code và exclusions] | [số / mẫu số, đơn vị] | [ngưỡng; [[n]](#ref-n); hoặc "Không có ngưỡng"] | [link] |

Với code coverage, ghi metric (statement, branch), covered / total và phần code bị loại trừ. Code đã được thực thi không có nghĩa là hành vi đã được kiểm chứng đúng.

## 2. Phát hiện

| Report ID | Phát hiện | Mức độ theo công cụ | Đã xác minh thủ công | Anomaly / Defect ID |
| --- | --- | --- | --- | --- |
| [TR-01] | [mô tả] | [mức] | [Có / Không / False positive] | [ID hoặc "Không tạo"] |

## 3. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q4-01 | Mỗi kết quả ghi công cụ, version, build, tập test và điều kiện đo | RC-01 | [Đạt / Không đạt] |
| Q4-02 | Mỗi số liệu có đơn vị và mẫu số; ngưỡng có nguồn | — | |
| Q4-03 | Phát hiện của công cụ được xác minh trước khi tạo defect, hoặc ghi rõ chưa xác minh | IN-09 | |
| Q4-04 | Code coverage không được dùng làm kết luận về hành vi đúng | — | |

**Người review / ngày:** [tên, ngày]

## References

1. <a id="ref-1"></a>[Tên tài liệu, lấy từ heading cấp 1 của file nguồn](đường-dẫn) — [version hoặc thời điểm chốt]
