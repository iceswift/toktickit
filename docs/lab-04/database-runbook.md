# Phase 2 data increment and isolated verification

Working branch: feature/69-lab4-data, based on peer-merged staging `0f84785`.
Local verification complete; student authorized the Phase2 feature PR and push.
Peer approval and merge remain pending. Initially Draft; direct Development link
to Issue69 is now independently verified and PR78 is Ready for review.
Actual submission: https://github.com/iceswift/toktickit/pull/78.

## Models and database decisions

- Add ActionTaken separately from comments/private notes. Immutable authenticated
  performer and active-assignee selection remain distinct concepts; Phase 3 must
  enforce authentication, active/role checks and the shared version transaction.
- ActionEvent and TicketWorkflowEvent are append-only for ordinary UPDATE/DELETE,
  reinforced by database triggers. No Action delete; immutable identity/creator.
  Eligible field revisions are still possible, as approved in D-03. These defenses
  do not claim protection against a database superuser or replace API validation.
- Composite Action ID/Ticket ID foreign keys prevent a history/retry record from
  claiming a different parent. Scoped unique user+Ticket+operation+key persists
  retries; Phase 3 must implement payload normalization/replay behavior.
- Ticket.version defaults to 1; nullable lastResolvedAt is not backfilled. Legacy
  Resolved/Closed records remain readable with unknown resolution time and no
  synthetic Actions/history. Dashboard date-window semantics remain in contract.
- Version/conditional-text constraints and deterministic list/query indexes are
  included in migration SQL. Custom CHECK constraints/triggers are not represented
  completely in Prisma's model syntax; preserve them in future migrations.
- Baseline drift found during verification: optional User.developmentRequesterId
  and Ticket.requesterUserId relations had implicit Prisma SetNull, but the old
  migration actually used RESTRICT. Their schema annotations now explicitly say
  onDelete: Restrict, matching existing deployed behavior. Old migration SQL is
  unchanged; this is not a new deletion policy or destructive FK migration.

## Migration/recovery protocol

Migration: server/prisma/migrations/20261028070000_lab4_action_foundation/migration.sql.
It adds tables/types/columns/indexes/constraints transactionally; it does not drop
or rewrite old tables. All seven existing migration files remain unchanged.

MIG-01 builds an isolated PostgreSQL database from those seven old migrations,
inserts synthetic data across all nine old tables (including live/removed
attachments, shared/private history, session and terminal/unassigned Tickets),
and takes a custom-format pg_dump. It applies only the new migration, compares
every original field, ID and relationship exactly, and checks NULL resolution
times and zero new Actions/history. It pg_restores the backup into another new
database and compares the complete original data again. Neither database is reset
or dropped. Recovery is database-record recovery; binary upload-file backup is a
separate operational concern, not falsely covered by this database test.

Actual test cluster: PostgreSQL 18, loopback 127.0.0.1:55484, temporary task-owned
data directory D:/Chat/cpe/tmp/lab4-phase2-pg. Docker's application database is not
used. The temporary loopback-only cluster uses trust authentication for synthetic
tests only; never expose that cluster to the network or reuse it for real data.

## Repeatable commands (PowerShell, from server/)

Use an isolated empty cluster at the reserved port, with PostgreSQL tools installed.
The tests create unique databases prefixed lab4_p2_ and never infer a target from
the application's .env. They refuse non-loopback or a different port/admin database.

```powershell
$env:LAB4_TEST_ADMIN_URL='postgresql://postgres@127.0.0.1:55484/postgres'
$env:LAB4_PG_BIN='C:/Program Files/PostgreSQL/18/bin'
npm run test:lab4-data
npm run build
```

The explicit test:lab4-data command fails if opt-in configuration is absent.
General npm test skips the isolated data suites without that configuration; such
skips are NOT evidence of passing migration/recovery. For full regression, create
a separate fresh test database on that cluster, set DATABASE_URL to it, deploy all
eight migrations and run prisma:seed before npm test. Do not point regression
tests (which create/update/delete fixture records) at a working application DB.

The task-owned test cluster was stopped after verification; its data was retained.
To repeat the test against that same dedicated cluster, start it explicitly first:

```powershell
& 'C:/Program Files/PostgreSQL/18/bin/pg_ctl.exe' -D D:/Chat/cpe/tmp/lab4-phase2-pg -l D:/Chat/cpe/tmp/lab4-phase2-pg-server.log -o '-h 127.0.0.1 -p 55484' start
```

Stop that same cluster after testing with pg_ctl -D and the same exact directory.
Do not run initdb over an existing directory or substitute a working database path.

## Fixtures and limits

Existing Lab3 Ticket fixtures remain unchanged. New reserved prefix
TKT-20261028-L4D has eight synthetic Tickets, all statuses and five IT priorities,
assigned/unassigned ownership, zero/one/multiple Actions, different performers
and assignees and zero/nonzero metric populations. Fixed dates are synthetic
demonstration dates, not reconstructed real service history. Terminal fixture
records are explicitly marked synthetic in their creation-event payload.

Each new fixture is created atomically with transaction-scoped advisory locking;
existing fixture Tickets are skipped, preserving user work and history on rerun.
The test reruns the seed twice after modifying work and appending an event, then
compares Ticket/Action/history/retry values and versions exactly. It also checks
credential hashes are unchanged. No new endpoint or UI exists in this Phase.

## Actual local checkpoint results - 28 October 2026

- Full server regression with opted-in isolated data suites: 19 files / 52 tests
  passed, no skipped tests. Includes ten Phase2 cases in three new files.
- TypeScript server build, Prisma validation/generation passed.
- Database-to-Prisma schema diff after explicit legacy FK annotations:
  `No difference detected.` Seven old migration files are unmodified.
- Retained complete output and final schema verification under
  artifacts/lab-04/phase2/. Results refer to a local working tree, not main/CI.
- Docker Desktop became available (server28.4.0), but the separate temporary
  PostgreSQL cluster was retained consistently. No Docker DB was migrated/reset.
- No client/E2E/UI result, peer review or release readiness is claimed.

## Open dependency audit

Unchanged server lockfile audit on 28 October reports 11 vulnerable dependency
nodes: 4 moderate, 4 high, 3 critical. Some suggested fixes are major-version
upgrades. No automatic audit fix or dependency upgrade was applied in this data
increment. Treat audit remediation as a release-blocking hardening task; passing
database tests/build does not imply a clean audit or final product readiness.
