# Lab 1 — Test Plan and Evidence  (fill this in)

All test files live under server/tests/lab-01/ and client/tests/lab-01/.

| # | Tool | Test | Result |
|---|------|------|--------|
| 1 | Supertest | GET /api/health returns 200, status=ok | |
| 2 | Supertest | GET /api/categories returns 4 seeded categories in id order | |
| 3 | Vitest | Heading renders | |
| 4 | Vitest | Success state shows Online + category list | |
| 5 | Vitest | Error state shows Offline + message | |

Paste your passing terminal output / screenshot below.

## Phase 1 foundation verification

Verified on 10 August 2026 before the Issue 1 commit:

| Check | Result |
|-------|--------|
| Frontend production build (`npm run build`) | Passed |
| Backend TypeScript build (`npm run build`) | Passed |
| Frontend worked-example test | 1 passed, 2 future Issue 4 tests remain TODO |
| Vite development server | HTTP 200 at `http://localhost:5173` |
| Express server foundation | Started on port 3000; the health route remains the expected Issue 2 stub |
| PostgreSQL container | Healthy on local port 5433 |
| Prisma-to-PostgreSQL connection | `SELECT 1` executed successfully |

The final Lab 1 test evidence will replace or supplement this setup evidence
after all required features are implemented on `main`.
