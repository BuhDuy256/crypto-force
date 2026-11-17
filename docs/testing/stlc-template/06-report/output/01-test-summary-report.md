# Test Summary Report

Đọc file này để biết kết luận về chất lượng của đối tượng được kiểm thử, mức đáp ứng exit criteria và recommendation cho bước tiếp theo.

## 1. Thông tin báo cáo

| Trường | Nội dung |
| --- | --- |
| Report ID / version / trạng thái | [ID; version; Draft / Reviewed / Final] |
| Feature / release | [tên feature hoặc release] |
| Test cycle / test level | [cycle; level] |
| Đối tượng được đánh giá | [build hoặc commit; version từng thành phần nếu cần] |
| Thời gian kiểm thử | [bắt đầu – kết thúc, múi giờ] |
| Thời điểm chốt dữ liệu | [ngày giờ, múi giờ] |
| Người lập / người review | [tên hoặc vai trò] |
| Người quyết định bước tiếp theo | [tên hoặc vai trò] |
| Phân phối | [người nhận; ngày gửi; version đã gửi] |
| File chi tiết | [Execution & Coverage](02-execution-and-coverage.md), [Defects](03-defects.md), [Residual Risks](04-residual-risks.md), [Lessons Learned](05-lessons-learned.md), [Closure & Handover](06-closure-and-handover.md) |

| Version | Ngày | Thay đổi | Người cập nhật |
| --- | --- | --- | --- |
| [version] | [ngày] | [thay đổi về số liệu hoặc kết luận] | [tên] |

Kết quả phát sinh sau thời điểm chốt được đưa vào version mới của báo cáo, kèm đánh giá lại các kết luận bị ảnh hưởng.

## 2. Executive Summary

> Trong [thời gian], nhóm đã kiểm thử [phạm vi] trên [build] để trả lời câu hỏi [câu hỏi quyết định]. Tại thời điểm chốt, [TP]/[T] test instance pass, [TF] fail và [TB + TN + TS + TI] chưa có kết luận. Coverage [chiều trọng yếu] đạt [P]/[N] item. Còn [số] defect chưa giải quyết, cao nhất ở mức [severity], và [số] rủi ro cần quyết định. Exit criteria: [kết luận]. Recommendation: [recommendation], với điều kiện [điều kiện]. Kết luận chỉ áp dụng cho [phạm vi, môi trường, giả định].

| Nội dung | Kết quả | Chi tiết |
| --- | --- | --- |
| Exit criteria | [Đạt / Không đạt / Chưa đủ bằng chứng / Chưa được thiết lập] | [Mục 5](#5-exit-criteria) |
| Coverage của hành vi trọng yếu | [P/N theo từng chiều] | [Execution & Coverage, mục 4](02-execution-and-coverage.md#4-coverage) |
| Defect quan trọng còn lại | [Defect IDs] | [Defects, mục 4](03-defects.md#4-defect-quan-trọng) |
| Rủi ro cần quyết định | [Risk IDs] | [Residual Risks, mục 3](04-residual-risks.md#3-quyết-định-xử-lý) |
| Recommendation | [recommendation] | [Mục 7](#7-recommendation-và-sign-off) |
| Quyết định | [Chưa quyết định / quyết định, người, ngày] | [Mục 7.2](#72-sign-off) |
| Lessons learned | [action item quan trọng nhất] | [Lessons Learned](05-lessons-learned.md) |
| Closure | [N/A / Chưa bắt đầu / Đang thực hiện / Hoàn tất] | [Closure & Handover](06-closure-and-handover.md) |

## 3. Mục tiêu, test basis và phạm vi

### 3.1. Mục tiêu

| Objective ID | Câu hỏi cần kiểm chứng | Exit criteria liên quan |
| --- | --- | --- |
| [OBJ-01] | [hành vi, thuộc tính chất lượng hoặc rủi ro cần đánh giá] | [Criterion IDs] |

### 3.2. Test basis

| Basis ID | Tài liệu | Version | Phần áp dụng | Trạng thái xác nhận |
| --- | --- | --- | --- | --- |
| [BS-01] | [[n]](#ref-n) | [version] | [mục hoặc ID] | [Đã xác nhận bởi ..., ngày / Giả định, xem input IN-02] |

Kết quả pass trên một requirement ở trạng thái giả định chỉ cho thấy hệ thống đúng với giả định đó, chưa chứng minh requirement đúng.

### 3.3. Phạm vi

| Scope ID | Hành vi / thành phần / test type / cấu hình | In / Out | Căn cứ |
| --- | --- | --- | --- |
| [SC-01] | [mô tả cụ thể] | [In / Out] | [[n]](#ref-n) |

Out of scope là quyết định về phạm vi. Hạng mục in scope nhưng chưa test vẫn thuộc phạm vi và được ghi ở [coverage gaps](02-execution-and-coverage.md#5-coverage-gaps).

### 3.4. Thay đổi phạm vi so với kế hoạch

| Change ID | Thay đổi | Lý do | Ảnh hưởng tới mẫu số coverage | Người xác nhận, ngày |
| --- | --- | --- | --- | --- |
| [CH-01] | [thêm, loại, tách, gộp item hoặc đổi cấu hình] | [lý do] | [N trước → N sau; mapping ID cũ–mới nếu tách hoặc gộp] | [tên, ngày] |

Ghi "Không có" nếu phạm vi không thay đổi.

## 4. Cách kiểm thử và môi trường

### 4.1. Hoạt động kiểm thử

| Test level / type | Phạm vi | Manual / Automated | Nguồn kết quả | Giới hạn |
| --- | --- | --- | --- | --- |
| [ví dụ: E2E functional] | [Scope IDs] | [Manual / Automated / Kết hợp] | [[n]](#ref-n) | [giới hạn] |

Với non-functional test, ghi workload, điều kiện đo và ngưỡng trong cột Phạm vi.

### 4.2. Môi trường và dữ liệu

| Env ID | Build và thành phần | Dữ liệu hoặc workload | Khác biệt so với môi trường đích | Ảnh hưởng tới kết luận |
| --- | --- | --- | --- | --- |
| [ENV-01] | [build; ghi rõ thành phần dùng mock hoặc stub] | [data set và version] | [khác biệt] | [kết luận nào bị giới hạn] |

### 4.3. Sai lệch về lịch và effort

| Hạng mục | Kế hoạch | Thực tế | Chênh lệch | Nguyên nhân | Ảnh hưởng tới kết luận |
| --- | --- | --- | --- | --- | --- |
| Thời gian bắt đầu – kết thúc | [ngày – ngày] | [ngày – ngày] | [số ngày] | [nguyên nhân] | [ảnh hưởng hoặc "Không có"] |
| Effort | [người-giờ] | [người-giờ] | [chênh lệch] | | |

Nguồn số liệu kế hoạch: [[n]](#ref-n).

### 4.4. Trở ngại khi thực hiện

| ID | Trở ngại hoặc sai lệch so với cách thực hiện dự kiến | Ảnh hưởng | Cách xử lý | Risk ID |
| --- | --- | --- | --- | --- |
| [DV-01] | [mô tả] | [ảnh hưởng] | [cách xử lý và kết quả] | [Risk ID nếu còn rủi ro] |

## 5. Exit criteria

Nguồn exit criteria: [[n]](#ref-n), [version, người xác nhận, ngày].

| Criterion ID | Tiêu chí, ngưỡng và mẫu số | Kết quả thực tế | Đánh giá | Evidence | Ngoại lệ đã được quyết định |
| --- | --- | --- | --- | --- | --- |
| [EX-01] | [tiêu chí] | [số liệu kèm mẫu số] | [Đạt / Không đạt / Chưa đủ bằng chứng] | [link] | [link quyết định hoặc "Không có"] |

Đánh giá "Chưa đủ bằng chứng" kèm ID của dòng IN hoặc RC trong input, hoặc Gap ID trong file Execution & Coverage.

**Kết luận:** [Đạt / Không đạt / Chưa đủ bằng chứng / Chưa được thiết lập]

Kết luận chỉ là Đạt khi mọi tiêu chí bắt buộc đạt. Tiêu chí được miễn bằng một quyết định ngoại lệ vẫn giữ đánh giá Không đạt, và cột Ngoại lệ dẫn tới quyết định đó.

## 6. Nhận định chất lượng

| Hành vi / thuộc tính chất lượng | Kết luận | Căn cứ | Giới hạn |
| --- | --- | --- | --- |
| [mô tả] | [Đáp ứng / Không đáp ứng / Chưa đủ bằng chứng] | [Criterion, Defect, Gap IDs] | [phạm vi, môi trường hoặc giả định mà kết luận không vượt qua] |

## 7. Recommendation và sign-off

### 7.1. Recommendation

**Recommendation:** [Chuyển bước / Chuyển có điều kiện / Chưa chuyển / Chưa đủ bằng chứng để đề xuất]

**Bước tiếp theo:** [UAT / cycle tiếp theo / release feature / ...]

**Căn cứ:** [Criterion IDs, Defect IDs, Gap IDs, Risk IDs]

| Điều kiện ID | Việc phải hoàn tất | Owner | Hạn | Cách xác nhận | Trạng thái |
| --- | --- | --- | --- | --- | --- |
| [CD-01] | [việc cụ thể] | [tên] | [ngày] | [evidence cần có] | [Chưa làm / Đang làm / Đã xác nhận] |

### 7.2. Sign-off

| Vai trò | Xác nhận điều gì | Người | Quyết định | Ngày | Report version |
| --- | --- | --- | --- | --- | --- |
| Người lập | Số liệu và giới hạn dữ liệu chính xác | [tên] | [quyết định] | [ngày] | [version] |
| Người review | Báo cáo đủ căn cứ cho các kết luận | [tên] | [quyết định] | [ngày] | [version] |
| Risk owner | Chấp nhận các rủi ro [Risk IDs] | [tên] | [quyết định] | [ngày] | [version] |
| Người quyết định | Quyết định bước tiếp theo | [tên] | [quyết định] | [ngày] | [version] |

Ô chưa có quyết định ghi "Chưa quyết định". Review báo cáo xác nhận báo cáo đáng tin cậy, không phải chấp thuận chuyển bước.

## 8. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q1-01 | Đối tượng, phạm vi và thời điểm chốt được ghi rõ và khớp với các file 02–06 | RC-01 | [Đạt / Không đạt] |
| Q1-02 | Test basis có version và trạng thái xác nhận; requirement ở trạng thái giả định được nêu rõ | IN-02, RC-03 | |
| Q1-03 | Exit criteria có nguồn, ngưỡng và mẫu số; tiêu chí được miễn không bị ghi thành Đạt | RC-04 | |
| Q1-04 | Mọi kết luận "Chưa đủ bằng chứng" dẫn tới ID của dòng IN, RC hoặc Gap | — | |
| Q1-05 | Số liệu trong Executive Summary khớp với mục 5–7 và các file 02–04 | RC-05 | |
| Q1-06 | Recommendation không vượt phạm vi bằng chứng; mỗi điều kiện có owner, hạn và cách xác nhận | — | |
| Q1-07 | Review báo cáo, chấp nhận rủi ro và quyết định bước tiếp theo được ghi tách biệt, do đúng người có thẩm quyền | IN-10 | |
| Q1-08 | Các file 02–04 đạt tiêu chí của chúng, hoặc phần chưa đạt đã được ghi thành giới hạn ở mục 6 và 7 | — | |
| Q1-09 | Sai lệch về lịch và effort có số liệu kế hoạch, thực tế và nguyên nhân | IN-13 | |
| Q1-10 | Báo cáo đã được gửi tới người quyết định và risk owner; version đã gửi được ghi lại | IN-10 | |

**Người review / ngày:** [tên, ngày]

## References

1. <a id="ref-1"></a>[Tên tài liệu, lấy từ heading cấp 1 của file nguồn](đường-dẫn) — [version hoặc thời điểm chốt]
