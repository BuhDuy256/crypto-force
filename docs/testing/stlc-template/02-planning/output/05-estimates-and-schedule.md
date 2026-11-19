# Estimates & Schedule

Đọc file này để biết effort ước lượng cho từng hoạt động kiểm thử, cách ước lượng, ai làm, và lịch thực hiện.

## 1. Estimate

| Hoạt động | Kỹ thuật ước lượng | Giá trị đầu vào | Estimate | Giả định |
| --- | --- | --- | --- | --- |
| [ví dụ: thiết kế test cho Sign in] | [Theo tỷ lệ / Ngoại suy / Wideband Delphi / Three-point] | [với three-point: a, m, b; với tỷ lệ: tỷ lệ và nguồn [[n]](#ref-2)] | [người-giờ; với three-point: E ± SD] | [giả định mà estimate dựa vào] |

Với three-point estimation: E = (a + 4m + b) / 6, SD = (b − a) / 6, trong đó a là ước lượng lạc quan nhất, m là khả năng cao nhất, b là bi quan nhất. Estimate luôn dựa trên giả định và có sai số [[1, §5.1.4]](#ref-1).

## 2. Phân công

| Vai trò | Người | Hoạt động | Thời gian có thể tham gia | Nhu cầu đào tạo |
| --- | --- | --- | --- | --- |
| [vai trò] | [tên] | [hoạt động] | [từ – đến; % thời gian] | [nội dung hoặc "Không có"] |

## 3. Lịch

| Mốc | Hoạt động | Bắt đầu | Kết thúc | Phụ thuộc | Owner của phụ thuộc |
| --- | --- | --- | --- | --- | --- |
| [M-01] | [hoạt động] | [ngày] | [ngày] | [ví dụ: bàn giao build, môi trường sẵn sàng] | [tên] |

## 4. Ngân sách

| Hạng mục | Chi phí ước lượng | Nguồn |
| --- | --- | --- |
| [công cụ, hạ tầng, dịch vụ ngoài, người] | [số tiền hoặc người-giờ] | [[n]](#ref-2) [báo giá, số liệu cũ] |

Ghi "N/A" khi đợt kiểm thử không có ngân sách riêng.

## 5. Tiêu chí đạt

| ID | Tiêu chí | Điều kiện đầu vào | Kết quả |
| --- | --- | --- | --- |
| Q5-01 | Mỗi estimate ghi kỹ thuật ước lượng, giá trị đầu vào và giả định | IN-07 | [Đạt / Không đạt] |
| Q5-02 | Estimate theo three-point ghi cả khoảng sai số | — | |
| Q5-03 | Mọi hoạt động trong Test Approach có estimate và có người thực hiện | — | |
| Q5-04 | Phụ thuộc vào bên ngoài nhóm test có owner và có nguồn | RC-03 | |
| Q5-05 | Thời gian tham gia của từng người dựa trên xác nhận, không chỉ giả định của người lập plan | RC-03 | |

**Người review / ngày:** [tên, ngày]

## References

1. <a id="ref-1"></a>[ISTQB Certified Tester Foundation Level Syllabus v4.0.1](https://www.istqb.org/wp-content/uploads/2024/11/ISTQB_CTFL_Syllabus_v4.0.1.pdf) — v4.0.1, 2024-09-15
2. <a id="ref-2"></a>[Tên tài liệu, lấy từ heading cấp 1 của file nguồn](đường-dẫn) — [version hoặc thời điểm chốt]
