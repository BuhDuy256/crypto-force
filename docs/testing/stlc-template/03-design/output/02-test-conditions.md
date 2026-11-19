# Test Conditions

Đọc file này để biết từ test basis cần kiểm tra những gì, theo thứ tự ưu tiên nào, test basis còn thiếu gì so với baseline độc lập, và những lỗi test basis đã được báo.

## 1. Phạm vi

| Trường | Nội dung |
| --- | --- |
| Test basis | [[n]](#ref-n) [version] |
| Baseline độc lập | [[n]](#ref-n) [chuẩn, version, mức áp dụng; hoặc use case viết độc lập] |
| Thời điểm chốt | [ngày giờ, múi giờ] |

## 2. Test conditions

| Condition ID | Test basis item / version | Điều cần kiểm tra | Nguồn | Rủi ro / ưu tiên | Test level / type |
| --- | --- | --- | --- | --- | --- |
| [COND-01] | [ID; version] | [hành vi hoặc thuộc tính cần kiểm chứng; hoặc "Dùng trực tiếp acceptance criterion [ID]"] | [Test basis / Baseline độc lập / Error guessing] | [mức rủi ro; ưu tiên] | [level; type] |

Mỗi test condition dẫn tới một nguồn có version. Hành vi không có trong nguồn nào được báo thành lỗi test basis ở mục 4, không được ghi thành test condition với expected result tự đặt.

## 3. Đối chiếu baseline độc lập

| Baseline item | Version / mức | Test condition IDs | Kết quả |
| --- | --- | --- | --- |
| [ví dụ: ASVS 5.0 6.2.1] | [version; level] | [IDs] | [Đã phủ / Thiếu trong test basis, xem mục 4 / Ngoài phạm vi, kèm lý do] |

ID và mức yêu cầu của chuẩn lấy từ bản gốc, không lấy từ bản tóm tắt.

## 4. Lỗi test basis

| ID | Test basis item | Loại | Mô tả | Báo cho / link | Trạng thái | Test condition bị chặn |
| --- | --- | --- | --- | --- | --- | --- |
| [BD-01] | [ID; version] | [Thiếu / Mơ hồ / Mâu thuẫn / Không kiểm thử được] | [mô tả cụ thể, kèm ví dụ] | [người hoặc nơi; link] | [Chờ trả lời / Đã chốt, kèm version mới / Không sửa, kèm lý do] | [IDs; hoặc "Không có"] |

## 5. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q2-01 | Mỗi test condition dẫn tới test basis item có version, hoặc tới baseline item | RC-01 | [Đạt / Không đạt] |
| Q2-02 | Ưu tiên của mỗi test condition lấy từ mức rủi ro của test basis item | RC-02 | |
| Q2-03 | Không test condition nào chứa expected behavior không có trong nguồn; hành vi chưa có nguồn đã được báo ở mục 4 | IN-09 | |
| Q2-04 | Mọi baseline item trong mức áp dụng có kết quả đối chiếu; item thiếu trong test basis có dòng ở mục 4 | RC-04 | |
| Q2-05 | Mỗi lỗi test basis có nơi báo, trạng thái và danh sách test condition bị chặn | RC-05 | |

**Người review / ngày:** [tên, ngày]

## References

1. <a id="ref-1"></a>[Tên tài liệu, lấy từ heading cấp 1 của file nguồn](đường-dẫn) — [version hoặc thời điểm chốt]
