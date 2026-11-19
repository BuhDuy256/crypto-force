# Test Closure & Handover

Đọc file này để biết testware, môi trường và các việc tồn đọng của đợt kiểm thử đã được lưu trữ, bàn giao hoặc xử lý thế nào.

## 1. Bàn giao

| Hạng mục | Vị trí lưu | Người nhận | Trạng thái | Việc còn lại / hạn |
| --- | --- | --- | --- | --- |
| Test basis, test plan và Test Summary Report bản cuối | [link] | [tên] | [Đã bàn giao / Đang làm / Chưa làm] | [việc, ngày] |
| Test case, script, charter và test data có thể dùng lại | | | | |
| Execution log, evidence, traceability và coverage report | | | | |
| Change request hoặc backlog item cho defect và coverage gap chưa giải quyết | [link tới từng item] | | | |
| Rủi ro còn lại và quyết định liên quan | | | | |
| Môi trường test, tài nguyên và dữ liệu tạm, đưa về trạng thái đã thống nhất | [trạng thái đã thống nhất] | | | |
| Quyền truy cập và thời gian lưu evidence | | | | |

## 2. Kết luận closure

**Trạng thái:** [Chưa bắt đầu / Đang thực hiện / Hoàn tất]

**Phạm vi đã đóng:** [cycle hoặc milestone; ngày; người xác nhận]

**Lý do đóng:** [kế hoạch hoàn tất / kết thúc sớm / thay đổi phạm vi]. Khi kết thúc sớm, ghi phần chưa hoàn tất và ảnh hưởng của nó.

**Việc còn lại:** [ID, nơi theo dõi, owner; hoặc "Không có"]

Đóng đợt test không có nghĩa là sản phẩm đạt exit criteria. Kết luận về exit criteria nằm ở [Test Summary Report, mục 5](01-test-summary-report.md#5-exit-criteria).

## 3. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q6-01 | Mọi hạng mục bàn giao có vị trí lưu truy cập được và người nhận | IN-12 | [Đạt / Không đạt] |
| Q6-02 | Mọi defect chưa giải quyết ở file Defects và mọi coverage gap đều có change request hoặc backlog item | IN-08 | |
| Q6-03 | Môi trường test được đưa về trạng thái đã thống nhất, hoặc ghi rõ việc còn lại | IN-12 | |
| Q6-04 | Mọi việc còn lại có owner và nơi theo dõi | — | |
| Q6-05 | Khi kết thúc sớm, phần chưa hoàn tất và ảnh hưởng được ghi rõ | — | |

**Người review / ngày:** [tên, ngày]

## References

1. <a id="ref-1"></a>[Tên tài liệu, lấy từ heading cấp 1 của file nguồn](đường-dẫn) — [version hoặc thời điểm chốt]
