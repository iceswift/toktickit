# TokTickIT

TokTickIT is an IT service desk application developed for CPE334 Labs 1–3.
This repository demonstrates a full-stack vertical slice using React, Express,
Prisma, and PostgreSQL.

Lab 2 adds a Requester-facing Ticketing MVP. A temporary Development Requester
selection context can create Tickets, view only its own paginated My Tickets
list, inspect an owned read-only detail screen, and manage permitted
Attachments. Lab 3 replaces that temporary selector with authenticated Requester identity and adds secure sessions, role authorization, IT Staff operations, Administrator user management, Public Comments, private Internal Notes, and responsive QA coverage.

## Technology stack

- Frontend: React, TypeScript, Vite, and Bootstrap
- Backend: Node.js, Express, and TypeScript
- Database: PostgreSQL with Prisma ORM
- Testing: Vitest, Testing Library, and Supertest
- Browser testing: Playwright

## Repository structure

```text
toktickit/
|-- client/
|   |-- src/
|   `-- tests/
|       `-- lab-01/
|-- server/
|   |-- prisma/
|   |-- src/
|   `-- tests/
|       `-- lab-01/
|-- docs/
|   |-- lab-01/
|   `-- lab-02/
|       |-- specification.md
|       |-- tests.md
|       |-- ui-spec.md
|       |-- api-spec.md
|       |-- reviewer.md
|       `-- ai-use.md
|-- compose.yaml
|-- .gitignore
`-- README.md
```

## Prerequisites

- Node.js 20 or newer
- npm
- Docker Desktop, or a local PostgreSQL installation

## Local setup

1. Start PostgreSQL:

   ```bash
   docker compose up -d postgres
   ```

   The isolated Lab 1 database is exposed on host port `5433` to avoid
   conflicting with an existing local PostgreSQL installation.

2. Configure and install the backend, then prepare the database:

   ```bash
   cd server
   cp .env.example .env
   npm install
   npx prisma generate
   npx prisma migrate deploy
   npm run prisma:seed
   npm run dev
   ```

3. In another terminal, configure and install the frontend:

   ```bash
   cd client
   cp .env.example .env
   npm install
   npm run dev
   ```

4. Open `http://localhost:5173` in a browser. The API listens on
   `http://localhost:3000`.

The seed command is idempotent. It preserves the Lab 2 catalogue and creates the Lab 3 Requester, IT Staff, and Administrator accounts used by the documented test scenarios.

## REST endpoints

- `GET /api/health` returns the TokTickIT API health status.
- `GET /api/categories` returns the categories stored in PostgreSQL in a
  predictable order.
- `GET /api/development-requesters` returns active test Requesters.
- `POST /api/tickets` creates a validated Ticket for the selected Requester.
- `GET /api/tickets` returns only the selected Requester's searchable,
  filterable, sortable, paginated Ticket list.
- `GET /api/tickets/:ticketId` retrieves an owned Ticket Detail.
- `POST /api/auth/login`, `POST /api/auth/change-password`, and `POST /api/auth/logout` implement the Lab 3 session lifecycle.
- `GET /api/staff/tickets` and the protected Staff Ticket operations implement the role-protected queue and workflow.
- `/api/admin/users` operations implement Administrator-only account management.
- Requester and Staff Public Comment endpoints share requester-visible history; Internal Notes remain Staff/Administrator-only.
- `POST /api/tickets/:ticketId/attachments`, `GET /api/tickets/:ticketId/attachments`,
  `GET /api/attachments/:attachmentId/download`, and `DELETE /api/attachments/:attachmentId`
  implement the permitted Attachment lifecycle.

## Tests and builds

Run these commands from either `client/` or `server/` as appropriate:

```bash
npm run dev
npm run build
npm test
npm run test:e2e
```

The backend tests use Vitest and Supertest. The frontend tests use Vitest and Testing Library. Playwright covers the Lab 2 requester regression plus Lab 3 authentication, logout, Staff workflow/privacy, Administrator lifecycle, and desktop/tablet/mobile checks. Start Docker/PostgreSQL first, then run `npm run test:e2e` from `client/`. Test files are organized by lab under `tests/` and `e2e/`.

## GitHub workflow

- [Repository](https://github.com/iceswift/toktickit)
- [TokTickIT Individual Sprints project](https://github.com/users/iceswift/projects/2)

Lab 3 development uses feature branches that merge into `lab3-staging` through peer-reviewed Pull Requests. The completed staging branch is then merged into `main` through one peer-reviewed release Pull Request.

## Environment files

Copy each `.env.example` file to `.env` for local development. Real `.env`
files, dependencies, and build output are ignored by Git and must not be
committed.
