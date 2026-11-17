# Baseline Comparison

Đọc file này để biết bộ requirement đã được đối chiếu với baseline độc lập nào, mỗi mục của baseline đã có requirement tương ứng hay chưa, và còn thiếu gì.

## 1. Baseline

| Baseline | Version | Mức áp dụng | Phần áp dụng | Vì sao độc lập với nguồn của requirement |
| --- | --- | --- | --- | --- |
| [ví dụ: OWASP ASVS; hoặc use case viết độc lập] [[n]](#ref-2) | [version] | [level] | [chương, mục] | [ví dụ: requirement được viết lại từ prototype; baseline là chuẩn ngành không phụ thuộc prototype] |

So các tài liệu có cùng nguồn gốc với nhau, ví dụ spec viết từ prototype với chính prototype đó, chỉ thấy chỗ chúng lệch nhau, không thấy những gì tất cả cùng bỏ sót [[1, LL-003]](#ref-1).

## 2. Đối chiếu

| Baseline item ID | Mức | Nội dung tóm tắt | Requirement IDs | Kết quả | Finding ID |
| --- | --- | --- | --- | --- | --- |
| [ID theo bản gốc] | [level] | [tóm tắt ngắn] | [IDs; hoặc "Không có"] | [Đủ / Một phần / Thiếu / Không áp dụng] | [ID; hoặc "Không có"] |

Kết quả "Không áp dụng" ghi lý do trong cột Nội dung tóm tắt.

| Kết quả | Số baseline item |
| --- | --- |
| Đủ | [số] |
| Một phần | [số] |
| Thiếu | [số] |
| Không áp dụng | [số] |
| **Tổng** | **[số, bằng số item trong phần áp dụng của baseline]** |

## 3. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q2-01 | Baseline độc lập với nguồn đã sinh ra requirement, và lý do độc lập được ghi | RC-03 | [Đạt / Không đạt] |
| Q2-02 | ID và mức của baseline item lấy từ bản gốc, không lấy từ bản tóm tắt | IN-05 | |
| Q2-03 | Mọi item trong phần áp dụng của baseline có kết quả; item Không áp dụng có lý do, dựa trên phạm vi và ràng buộc của domain | IN-09 | |
| Q2-04 | Mọi item Một phần hoặc Thiếu có finding tương ứng ở Review Findings | — | |
| Q2-05 | Tổng ở bảng số lượng bằng số item trong phần áp dụng của baseline | — | |

**Người review / ngày:** [tên, ngày]

## References

1. <a id="ref-1"></a>[Lessons Learned](../../../../../LESSONS.md)
2. <a id="ref-2"></a>[Tên tài liệu, lấy từ heading cấp 1 của file nguồn](đường-dẫn) — [version hoặc thời điểm chốt]
