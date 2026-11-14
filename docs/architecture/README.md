# Architecture

Đọc file này để biết cách Crypto Force được tổ chức để đáp ứng các yêu cầu chức năng và chất lượng, và tìm file kiến trúc theo từng nhóm quyết định.

## Table of Contents

| File | Subject |
| --- | --- |
| [00-system.md](00-system.md) | System Context & Architecture Overview |
| [10-market-data.md](10-market-data.md) | Market Data & Realtime Updates |
| [11-strategy.md](11-strategy.md) | Strategy Engine & Extensibility |
| [12-combination.md](12-combination.md) | Composite Strategy & Signal Combination |
| [13-backtesting.md](13-backtesting.md) | Backtesting & Trade Simulation |
| [14-evaluation.md](14-evaluation.md) | Evaluation, Ranking & Leaderboard |
| [15-search.md](15-search.md) | Strategy Search & Continuous Loop |
| [16-news-sentiment.md](16-news-sentiment.md) | News Collection & Sentiment Analysis |
| [20-state-machine.md](20-state-machine.md) | System States & Lifecycle |
| [21-database.md](21-database.md) | Data Model & Persistence |
| [22-api-endpoints.md](22-api-endpoints.md) | API & Realtime Communication Contracts |
| [23-security.md](23-security.md) | Security |
| [30-decisions.md](30-decisions.md) | Architectural Decisions |

## Documentation Conventions

* Mỗi file mô tả các quyết định thuộc phạm vi của mình, tránh lặp lại chi tiết đã có trong file khác.
* Các quyết định chưa được thống nhất phải được đánh dấu là `Proposed` hoặc `Open`.
* Phân biệt yêu cầu từ đề bài với phương án kiến trúc do nhóm đề xuất.
* Sử dụng liên kết đến tài liệu liên quan thay vì sao chép nội dung.
* Không xem cấu trúc tài liệu là cấu trúc bắt buộc của source code.
