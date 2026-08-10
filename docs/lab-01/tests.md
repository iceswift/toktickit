# Lab 1 — Test Plan and Evidence

All test files live under server/tests/lab-01/ and client/tests/lab-01/.

| # | Tool | Test | Result |
|---|------|------|--------|
| 1 | Supertest | GET /api/health returns 200, status=ok | Passed in Phase 2 |
| 2 | Supertest | GET /api/categories returns 4 seeded categories in id order | |
| 3 | Vitest | Heading renders | Passed in Phase 2 |
| 4 | Vitest | Success state shows Online + category list | |
| 5 | Vitest | Error state shows Offline + message | Passed for health API in Phase 2 |

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

## Phase 2 health-check verification

Verified on 10 August 2026 on `feature/2-health-check`:

| Command | Result |
|---------|--------|
| Server `npm test` | Passed: health Supertest file, 1 test |
| Client `npm test` | Passed: 1 Vitest file, 3 tests; 2 future Issue 4 tests remain TODO |
| Server `npm run build` | Passed |
| Client `npm run build` | Passed |
| Live `GET /api/health` | HTTP 200 with `status=ok` and `service=TokTickIT API` |
| Live React check | Displayed `System Status: Online` from the API call |

![Phase 2 live health-check success](evidence/phase-2-health-online.png)

The final Lab 1 test evidence will replace or supplement this setup evidence
after all required features are implemented on `main`.
