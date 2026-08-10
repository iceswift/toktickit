# TokTickIT

TokTickIT is an IT service desk application developed for CPE334 Lab 1. This
repository demonstrates a full-stack vertical slice using React, Express,
Prisma, and PostgreSQL.

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
|   `-- tests/lab-01/
|-- server/
|   |-- prisma/
|   |-- src/
|   `-- tests/lab-01/
|-- docs/lab-01/
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

2. Configure and install the backend:

   ```bash
   cd server
   cp .env.example .env
   npm install
   npx prisma generate
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

## Commands

Run these commands from either `client/` or `server/` as appropriate:

```bash
npm run dev
npm run build
npm test
```

Database migrations and seed data are introduced in Issue 3.

## Environment files

Copy each `.env.example` file to `.env` for local development. Real `.env`
files, dependencies, and build output are ignored by Git and must not be
committed.
