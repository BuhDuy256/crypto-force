# Crypto Force

Nền tảng xây dựng, backtest và tìm kiếm chiến lược giao dịch crypto. Mô tả bài toán nằm trong [`docs/UCs/sources/project-brief.md`](docs/UCs/sources/project-brief.md); toàn bộ tài liệu bắt đầu từ [`docs/README.md`](docs/README.md).

## Yêu cầu

- Node.js `>=22.22` (xem `.nvmrc`)
- pnpm 9 (`corepack enable` sẽ dùng đúng phiên bản trong `package.json`)
- Docker Desktop (PostgreSQL)

## Chạy local

```bash
pnpm install
cp .env.example .env      # PowerShell: Copy-Item .env.example .env
pnpm db:up
pnpm dev
```

- Web: <http://localhost:5173>
- API: <http://localhost:3000/api/health>

Các lệnh khác được liệt kê trong mục Commands của [`CLAUDE.md`](CLAUDE.md).

## Cấu trúc

| Workspace | Vai trò |
| --- | --- |
| `apps/web` | React Router (SPA, prerender landing), Tailwind CSS, shadcn/ui, TanStack Query |
| `apps/api` | Express, Drizzle ORM, pino |
| `apps/worker` | pg-boss job handlers (backtest, Strategy Search, crawl tin, sentiment) |
| `packages/shared` | Zod schemas và contracts dùng chung |
| `packages/engine` | Strategy & backtest engine thuần TypeScript, không I/O |

Trách nhiệm và dependency boundaries của từng workspace: [`docs/conventions/project-structure.md`](docs/conventions/project-structure.md).
