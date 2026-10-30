# TokTickIT

React/TypeScript/Bootstrap frontend, Express4 API and Prisma5/PostgreSQL service
desk. Labs1–3 provide Tickets, authenticated Requesters/Staff/Admin, ownership,
Attachments, Public Comments, private Internal Notes and account administration.
Lab4 adds audited Actions Taken, safe final Ticket workflow and role dashboards.

## Current delivery boundary

Lab4 Phases1–6 are independently approved and merged into `lab4-staging`.
Phase7 QA/hardening is on `feature/74-lab4-qa-hardening` (Issue74); not yet a
reviewer-approved release. Phase8 will publish reviewed staging into main and
verify the final single PDF/main output. No final-main/CI pass is inferred.

## Setup (working development environment)

Use Node22.12+ (tested22.17), npm, Docker Desktop or PostgreSQL. With older npm10,
Vitest optional-peer resolution may fail; a tested one-off resolver is
`npx --yes --package npm@11.6.2 npm ci`, not a global Node/npm replacement.

1. `docker compose up -d postgres`. Existing compose maps PostgreSQL to host5434.
2. In server, copy `.env.example` to `.env`; configure your development DATABASE_URL.
   Run `npm ci`, `npx prisma generate`, `npx prisma migrate deploy`,
   `npm run prisma:seed`, then `npm run dev` (default API3000).
3. In client, copy `.env.example` to `.env`; configure VITE_API_URL if needed.
   Run `npm ci` and `npm run dev`; open localhost5173.
4. `npm run build` in server and client produces production builds. Production
   auth cookies require HTTPS; configure environment/origin deliberately.

Migrations are additive. Never reset a populated database to demonstrate Lab4.
See [populated migration/backup/recovery runbook](docs/lab-04/database-runbook.md).

## Synthetic demonstration data

Seed is idempotent: existing passwords, worked Ticket fields, Actions/history and
versions are preserved. It maintains categories/systems and legacy Users/Tickets,
plus eight dedicated Lab4 examples spanning statuses/priorities/ownership and
zero/one/multiple Actions. Unknown legacy resolution times stay null, not backfilled.

Demo accounts (example.test, local fixtures only):

| Role | Email |
|---|---|
| Requester | amina.rahman@example.test |
| Requester | ben.carter@example.test |
| Staff | iris.nattapong@example.test |
| Staff | jonas.miller@example.test |
| Administrator | narin.admin@example.test |

Initial fixture password `Lab3Initial!2026`; first login requires a real password
change. Do not expose these fixtures publicly or reuse this credential elsewhere.

## Main capabilities / HTTP paths

- `GET /api/health`, `GET /api/categories`; development requester enumeration retired.
- `POST /auth/login`, `POST /auth/change-password`, `POST /auth/logout`, `GET /auth/me`.
- `POST/GET /api/tickets`, `GET /api/tickets/:id`: session-owned Requester data.
- `/api/tickets/:id/attachments`, `/api/attachments/:id/download`, soft removal.
- `GET /api/tickets/dashboard`: own Open/Waiting/recently-resolved, attention/recent.
- `GET /staff/dashboard`: operational status/priority/owner and performedBy metrics.
- `/staff/tickets`, `/staff/tickets/:id`: queue/detail/priority/owner operations.
- `/staff/tickets/:id/actions`: create/read/update/assign/status with explicit shared
  Ticket/Action versions. Immutable performer, append-only audit, persistent scoped
  Action-create idempotency. My Actions `/staff/actions?performedBy=me` is not assignee work.
- `GET /staff/tickets/:id/workflow-events` and `PATCH /staff/tickets/:id/status`: final transitions/gates/version conflict;
  Requester indication remains advisory. Staff and Administrator formal status
  permission is a Lab4 extension; Admin does not gain Staff-only owner/comment/Note writes.
- Requester own-Ticket Actions/workflow history are read-only; cross-owner access404.
- Public Comments shared with Requester; Internal Notes private to Staff/Admin.
- `/admin/users`: Administrator-only account management and safety constraints.

Exact methods/payloads/statuses: [API contract](docs/lab-04/api-spec.md).
Dashboard is an explicit navigation choice; legacy role landing pages remain.
Card destinations retain their calculation filters. Refresh gets a new snapshot.

## Tests: never use the working database

Client `npm test` runs components/adapters; `npm run build` typechecks and builds.
Backend tests include mutating fixtures; use a fresh reserved database on the
dedicated test PostgreSQL cluster at127.0.0.1:55484, not Docker5434 or server/.env.
No destructive reset/drop is required. Retain audit/history fixtures after runs.

Prepare fresh `lab4_p7_reg_<runid>` and `lab4_p7_ui_<runid>` using createdb,
migrate deploy and seed with DATABASE_URL explicitly targeting each test DB.
The cluster must permit creating additional isolated migration/recovery/perf DBs.

PowerShell, from server (replace runid/tool path with your actual isolated setup):

```powershell
$env:DATABASE_URL='postgresql://postgres@127.0.0.1:55484/lab4_p7_reg_runid'
$env:LAB4_TEST_ADMIN_URL='postgresql://postgres@127.0.0.1:55484/postgres'
$env:LAB4_PG_BIN='C:/Program Files/PostgreSQL/18/bin'
$env:LAB4_PERF_TEST='1'
npm run test:lab4-qa
npm run build
```

From client:

```powershell
$env:LAB4_UI_TEST='1'
$env:LAB4_UI_DATABASE_URL='postgresql://postgres@127.0.0.1:55484/lab4_p7_ui_runid'
npm run test:e2e
```

Browser QA config refuses working DB names/existing server reuse; launches isolated
API55485/UI55486. Shared fixture helpers also validate opt-in before mutations.
Run all preserved Lab2/3 scenarios and Lab4, not only the newest tests. Actual
screenshots/axe reports go to output/playwright/phase7 for inspection before copying
to artifacts. Missing DB/performance opt-in is not a passing result.

Performance smoke uses its own new10,000-Ticket/20,000-Action database,
five warmups then20 HTTP requests per role, provisional p95<=1000ms. Logs include
hardware, bounded ORM operation counts, response size and EXPLAIN ANALYZE. This is
a local development smoke threshold, not production load/SLA certification.

Audit: `npm audit --json` in each package. Phase7 updates Vitest4.1.12/Vite6.4.5
and compatible server/transitive patches; never use audit-fix --force blindly.
Real before/after results and remaining limits: [QA record](docs/lab-04/phase7-qa.md).

## Repository / workflow / evidence

```text
client/src/                 role UI and safe API adapters
client/tests/lab-01..04/     component/style/adapter tests
client/e2e/lab-02..04/       preserved and incremental browser acceptance
server/src/lab4/            transactional Actions/workflow/dashboard domain
server/prisma/              additive migrations and idempotent seeds
server/tests/lab-01..04/     unit/API/migration/recovery/performance tests
docs/lab-04/                contract, test traceability, review, AI-use, working report
artifacts/lab-04/           inspected captures, actual output and provenance
```

[Issues](https://github.com/iceswift/toktickit/issues) and
[Kanban](https://github.com/users/iceswift/projects/2): feature branch → directly
Issue-linked PR into lab4-staging → reviewer approves AND merges. Author replies
to every review comment, fixes stay in same PR. Done only after actual acceptance
and reviewer merge. Final reviewed Release PR into main is Phase8.

Real .env, credentials, uploads, dependencies, build output and private fixture
DB data must never be committed; see .gitignore. No direct staging/main development.
