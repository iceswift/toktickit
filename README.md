# TokTickIT

TokTickIT is an IT service desk application developed for CPE334 Lab 1. This
repository demonstrates a full-stack vertical slice using React, Express,
Prisma, and PostgreSQL.

The Lab 1 application provides a **Check System** action that calls the API,
shows whether the backend is online, and loads the four supported IT request
categories from PostgreSQL. Loading and connection-error states are included.

## Technology stack

- Frontend: React, TypeScript, Vite, and Bootstrap
- Backend: Node.js, Express, and TypeScript
- Database: PostgreSQL with Prisma ORM
- Testing: Vitest, Testing Library, and Supertest

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
|   `-- lab-01/
|       |-- ai_use.md
|       |-- reviewer.md
|       `-- tests.md
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

The seed command is idempotent and inserts these categories without creating
duplicates: Account and Access, Hardware, Software, and Network.

## REST endpoints

- `GET /api/health` returns the TokTickIT API health status.
- `GET /api/categories` returns the categories stored in PostgreSQL in a
  predictable order.

## Tests and builds

Run these commands from either `client/` or `server/` as appropriate:

```bash
npm run dev
npm run build
npm test
```

The backend tests use Vitest and Supertest for the health and category APIs.
The frontend tests use Vitest and Testing Library for the heading, loading,
success, and error states. Lab 1 test files are stored under each package's
`tests/lab-01/` directory.

## GitHub workflow

- [Repository](https://github.com/iceswift/toktickit)
- [TokTickIT Individual Sprints project](https://github.com/users/iceswift/projects/2)

Development uses feature branches that merge into `lab1-staging` through
peer-reviewed Pull Requests. The completed staging branch is then merged into
`main` for the stable Lab 1 release.

## Environment files

Copy each `.env.example` file to `.env` for local development. Real `.env`
files, dependencies, and build output are ignored by Git and must not be
committed.
