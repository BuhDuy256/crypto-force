# Triển khai Market Data

Đọc file này để biết mục tiêu, thứ tự triển khai và cách theo dõi tiến độ Market Data.

## Tài liệu

| File hoặc thư mục | Nội dung |
| --- | --- |
| [goal.md](goal.md) | Mục tiêu cần đạt và bằng chứng cần có trong repo |
| [cv-goal.md](cv-goal.md) | Câu chuyện giá trị, chỉ số và mẫu dòng CV |
| [abstract-implementation-plan.md](abstract-implementation-plan.md) | Khung tham chiếu ổn định về thứ tự triển khai và cập nhật docs. Agent chỉ sửa khi người dùng yêu cầu trực tiếp |
| [tracker.md](tracker.md) | Trạng thái từng step, link kế hoạch chi tiết và bằng chứng hoàn thành |
| `work/` | Kế hoạch chi tiết, phân tích, điều chỉnh cách thực hiện và kết quả công việc. Tạo dần, mỗi step một folder |

## Cách triển khai từng step

1. Chọn step tiếp theo trong tracker theo thứ tự của abstract plan.
2. Khi bắt đầu step, tạo folder `work/step-<số hai chữ số>-<tên-ngắn>/` và file `plan.md` bên trong. Ví dụ: `work/step-01-rest-scope/plan.md`. Không tạo trước toàn bộ folder và kế hoạch cho các step sau.
3. Trong `plan.md`, ghi phạm vi, đầu ra, các việc cần làm, docs cần cập nhật và cách kiểm chứng hoàn thành step. Chỉ chi tiết hóa step đang bắt đầu.
4. Thêm link kế hoạch vào tracker và cập nhật trạng thái khi thực hiện. Đặt phân tích, điều chỉnh cách thực hiện và kết quả công việc trong cùng folder. Chỉ tạo file bổ sung khi cần. Requirements, thiết kế và bằng chứng kiểm thử chính thức vẫn nằm tại các đường dẫn docs được chỉ định trong abstract plan, tài liệu làm việc tham chiếu tới chúng.
5. Khi kiểm chứng xong, ghi link đầu ra và bằng chứng vào tracker rồi đánh dấu hoàn thành. Sau đó mới tạo kế hoạch chi tiết cho step tiếp theo.

Agent chỉ đọc abstract plan trong quá trình làm việc. Chỉ sửa abstract plan khi người dùng yêu cầu trực tiếp. Ghi phạm vi cụ thể và điều chỉnh cách thực hiện trong `work/`, cập nhật trạng thái trong tracker. Nếu cần thay đổi khung thứ tự của abstract plan, ghi đề xuất trong `work/` và báo người dùng, không tự sửa abstract plan.
