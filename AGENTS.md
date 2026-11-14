# Project: Crypto Force

## Tech Stack

## Commands

## Architecture

## Coding Conventions

## Documentation

Tuân thủ [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) khi tạo hoặc chỉnh sửa tài liệu trong `docs/`.

## Testing & Quality

## Safety Rules

## Response & Writing Conventions

1. Sử dụng Vietnamese làm ngôn ngữ chính cho documents và responses. Giữ nguyên thuật ngữ chuyên ngành bằng English khi phổ biến hoặc chính xác hơn bản dịch Vietnamese. Ngoại lệ: mọi file trong `.claude/` viết hoàn toàn bằng English.
2. Ưu tiên cách diễn đạt rõ ràng, tự nhiên và chính xác. Tránh văn phong máy móc, phóng đại hoặc nội dung không mang lại giá trị.
3. Đảm bảo nội dung có đủ context, các ý liên kết logic và thuật ngữ được sử dụng nhất quán. Không tự tạo thông tin hoặc trình bày giả định như sự thật.
4. Điều chỉnh giọng văn, mức độ chi tiết và cách trình bày theo từng task. Không áp dụng một writing style hoặc format cố định cho mọi nội dung.

## Lesson Learned & Pitfalls

1. [`LESSONS.md`](LESSONS.md) là Single Source of Truth cho các Lesson Learned đã được người dùng chấp thuận. Không sao chép nội dung bài học vào `AGENTS.md`.
2. Trước khi thực hiện task, đọc các Lesson Learned có Scope liên quan đến task trong `LESSONS.md`. Chỉ áp dụng bài học còn hiệu lực, bỏ qua bài học có `Status: Deprecated`.
3. Dùng Skill `lesson-manager` ([`.claude/skills/lesson-manager/SKILL.md`](.claude/skills/lesson-manager/SKILL.md)) khi cần Capture, Review hoặc Update Lesson Learned.
4. Không tự thêm, sửa hoặc xóa Lesson Learned khi người dùng chưa chấp thuận.
