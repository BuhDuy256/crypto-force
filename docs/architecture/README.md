# Architecture

Đọc file này để biết cách Crypto Force được tổ chức để đáp ứng các use case và quality attribute, và tìm file kiến trúc theo từng nhóm quyết định.

Hành vi quan sát được và số đo nằm trong [Use Cases](../UCs/README.md); file trong thư mục này chỉ mô tả cơ chế và trỏ về ID của use case.

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

## Driver và file đáp ứng

| Driver | File |
| --- | --- |
| [Authentication](../UCs/authentication.md): Sign in, Google, Create account, Reset password, phiên, bảo mật | [23-security.md](23-security.md); màn chặn workspace và mức bảo mật trong [30-decisions.md](30-decisions.md) |
| [Modifiability](../UCs/quality-attributes.md#modifiability): thêm Strategy, thêm cách sinh candidate (QA-01, QA-02) | [11-strategy.md](11-strategy.md), [15-search.md](15-search.md) |
| [Scalability và Performance](../UCs/quality-attributes.md#scalability-và-performance): backtest nhiều candidate (QA-03, QA-04) | [13-backtesting.md](13-backtesting.md), [15-search.md](15-search.md) |
| [Realtime](../UCs/quality-attributes.md#realtime): độ trễ từ Binance tới màn hình (QA-05) | [10-market-data.md](10-market-data.md) |
| [Reliability](../UCs/quality-attributes.md#reliability): mất kết nối Binance, job lỗi (QA-06, QA-07) | [10-market-data.md](10-market-data.md), [13-backtesting.md](13-backtesting.md) |
| [Observability](../UCs/quality-attributes.md#observability): trạng thái của loop (QA-08) | [15-search.md](15-search.md) |
