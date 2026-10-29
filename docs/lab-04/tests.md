# Lab 4 Test DD - actual Phase 2 data coverage and remaining plan

## Latest: Phase4 local UI verification,29October2026

13 files/52 client tests and production build pass;7 real-browser scenarios pass.
New files: client/tests/lab-04/ActionsTaken.test.tsx (10 component cases),
actions-api.test.tsx (9 HTTP-adapter cases),
client/e2e/lab-04/actions-taken-flow.spec.ts (7 scenarios).
UI-01/E2E-01 and Actions-only STYLE/RESP acceptance are locally implemented;
remaining workflow/dashboard/full-regression/final-main cases stay planned.
See phase4-actions-ui.md and artifacts/lab-04/phase4 for complete outputs,
synthetic environment, injected failures, source fingerprints and inspection
limits. Peer review/merge pending. Earlier UI-planned text is historical.

Latest29October: Phase3 Action API scope accepted after Richy approved/merged PR79
at2f633d0. Reviewed headcc479b2 is tree-identical to fetched staging. The110-test
backend/build evidence below is the retained pre-merge LOCAL run, not new staging
CI/main verification. Phase4 UI and full Phase5 workflow matrix remain planned.
See phase3-closure.md; older pending-peer-review descriptions are historical.

## Current Phase3 local checkpoint - 29 October 2026

Full backend22files/110tests passes without skips, plus build/schema validation.
New action-validation.unit.test.ts has30 cases; actions-taken.api.test.ts has14
actual DB-backed HTTP cases. See phase3-api.md and phase3/server-full-output.txt
for real404/409, persistent retry, ownership, failure and concurrency evidence.
API01/02, AUTH01 and RETRY01 Action scope are implemented locally. CON01 has
actual Action-vs-Resolve HTTP and concurrent-retry evidence, but the complete
Phase5 Ticket transition/role matrix remains planned. No client/E2E or main claim.

| Test ID | Type / AC | Actual assertion / expected result | File | Evidence status |
|---|---|---|---|---|
| ACTION-VAL | Unit / AC02,03 | All16 state pairs, strict/date/text/version inputs | server/tests/lab-04/action-validation.unit.test.ts | Local30 passed |
| ACTION-API | API / AC01..04 | Authenticated actor, active permitted assignee, immutable ownership/history, safe owned read-only projection | server/tests/lab-04/actions-taken.api.test.ts | Local14 passed, grouped assertions |
| ACTION-RETRY | API+DB / AC11,12 | Same scoped key replays once; conflict409; concurrent requests persist one resource/event | server/tests/lab-04/actions-taken.api.test.ts | Actual DB/logged responses |
| ACTION-RACE | API+DB / AC11 | Resolve vs Action shares parent lock; one winner/one409; legacy bypass blocked | server/tests/lab-04/actions-taken.api.test.ts | Actual DB/logged response |

Earlier Phase2/source-plan tables below are historical where superseded here.

Closure checkpoint 29 October 2026: Phase2 peer merged in PR78 at staging f4b6ea9;
reviewed head c2d7027 has the exact same tree. Retained pre-merge local result is
20 files/66 tests (data-only4files/24tests), not CI or a new staging rerun.
MIG/SEED/VERSION foundation is accepted for Phase2 only. Future API/domain-policy
and client/E2E coverage below remains planned. See phase2-closure.md.

Baseline `5398f2d`; D-01 through D-04 student-approved on 8 October 2026.
Remaining feature paths below are planned and do not yet exist. Phase 2 data
tests now exist; their actual local verification is recorded below, not as main/CI evidence.
Write a focused failing test before its implementation, retain red/green output,
then run integrated Labs 1-3 regression throughout the sprint.

| Test ID | Type / AC | Expected result | Planned path | Status |
|---|---|---|---|---|
| API-01 | API / AC-01,03 | Correct Ticket/session actor; invalid fields/date/follow-up rejected | server/tests/lab-04/actions-taken.api.test.ts | Planned |
| API-02 | API / AC-02,03 | Active permitted assignment; edit/status/terminal rules enforced | server/tests/lab-04/actions-taken.api.test.ts | Planned |
| AUTH-01 | API / AC-04 | Own read-only Actions, cross-owner 404, writes/Notes forbidden | server/tests/lab-04/actions-taken.api.test.ts | Planned |
| WF-01 | API / AC-05,06 | Entire transition matrix, direct resolution bypass, advisory indication | server/tests/lab-04/ticket-workflow.api.test.ts | Planned |
| DASH-01 | API / AC-07 | Owned counts, calendar edges, recent/attention and drill-down equal fixture queries | server/tests/lab-04/requester-dashboard.api.test.ts | Planned |
| DASH-02 | API / AC-08 | Staff/Admin counts including performedBy work and drill-down match queries | server/tests/lab-04/staff-dashboard.api.test.ts | Planned |
| MIG-01 | Integration / AC-09 | Populated legacy IDs/counts/relations survive migration; recovery succeeds | server/tests/lab-04/migration-regression.api.test.ts | Local Pass on synthetic isolated PostgreSQL; not peer merged/main |
| SEED-01 | Integration / AC-10 | Repeated seed preserves fixtures/work/history/versions; constraints | server/tests/lab-04/seed-regression.api.test.ts | Local Pass on synthetic isolated PostgreSQL; not peer merged/main |
| VERSION-01 | Internal persistence integration / AC-11 foundation | Atomic shared Ticket/entity/history versions; stale/concurrent writes and rollback; deny corrupt sequences | server/tests/lab-04/versioned-mutations.integration.test.ts | Focused 14 cases locally passed; full output retained separately; not API/auth/main acceptance |
| CON-01 | Integration / AC-11 | Concurrent writes yield one success and safe 409, immutable history | server/tests/lab-04/ticket-workflow.api.test.ts | Planned |
| RETRY-01 | API / AC-12 | Same key/payload saves once; different payload conflicts | server/tests/lab-04/actions-taken.api.test.ts | Planned |
| UNIT-01 | Unit / AC-05,06,11 | Pure transition/gate/version decisions and boundary inputs | server/tests/lab-04/workflow-rules.test.ts | Planned |
| UI-01 | UI / AC-01,02,03,12 | Action list/create/assign/edit/complete/cancel, recoverable errors retain input | client/tests/lab-04/ActionsTaken.test.tsx | Planned |
| UI-02 | UI / AC-05,06,11,12 | Permitted transitions, gate/conflict messages and coherent refresh | client/tests/lab-04/TicketWorkflow.test.tsx | Planned |
| UI-03 | UI / AC-07,12 | Requester metric/drill-down/loading/zero/forbidden/failure | client/tests/lab-04/RequesterDashboard.test.tsx | Planned |
| UI-04 | UI / AC-08,12 | Staff metric/drill-down/loading/zero/forbidden/failure | client/tests/lab-04/StaffDashboard.test.tsx | Planned |
| STYLE-01 | UI style / AC-13 | Zen Green semantics/read-only/validation/focus and button hierarchy | client/tests/lab-04/ZenGreenStyle.test.tsx | Planned |
| E2E-01 | E2E / AC-01,02,03,04,12 | Multiple Actions/different staff, assignment and Requester read-only | client/e2e/lab-04/actions-taken-flow.spec.ts | Planned |
| E2E-02 | E2E / AC-05,06,11 | Work -> Resolve -> Close/Reopen/Cancel; gate/bypass/conflict | client/e2e/lab-04/ticket-resolution.spec.ts | Planned |
| E2E-03 | E2E / AC-07,08,12 | Role dashboards and matching destinations | client/e2e/lab-04/dashboards.spec.ts | Planned |
| RESP-01 | Browser/manual / AC-13 | Every major Lab 4 screen at desktop/tablet/mobile; no overflow or unusable controls | client/e2e/lab-04/responsive.spec.ts | Planned |
| PERF-01 | Performance smoke / AC-07,08 | Document fixture size, queries, timings and agreed threshold, not invented production performance | server/tests/lab-04/dashboard-performance.test.ts | Planned |
| REG-01 | Full regression / AC-04,09,12,13 | All existing Labs 1-3 tests plus auth/comments/private Notes/attachments/user management | Existing server/tests, client/tests, client/e2e plus new regression cases | Planned |

At each checkpoint record command, source SHA, environment/fixture, complete
output, failures/skips and coverage gaps. Mocked UI delays/failures must be labelled;
they do not replace real database/API ownership/migration verification.
Historical Lab 3 results are not fresh Lab 4 baseline results.

## Explicit AC traceability (MIG/SEED locally implemented; other feature tests Planned)

| AC | Planned tests |
|---|---|
| AC-01 | API-01, UI-01, E2E-01 |
| AC-02 | API-02, UI-01, E2E-01 |
| AC-03 | API-01, API-02, UI-01, E2E-01 |
| AC-04 | AUTH-01, E2E-01, REG-01 |
| AC-05 | WF-01, UNIT-01, UI-02, E2E-02 |
| AC-06 | WF-01, UNIT-01, UI-02, E2E-02 |
| AC-07 | DASH-01, UI-03, E2E-03, PERF-01 |
| AC-08 | DASH-02, UI-04, E2E-03, PERF-01 |
| AC-09 | MIG-01, REG-01 |
| AC-10 | SEED-01 |
| AC-11 | CON-01, UNIT-01, UI-02, E2E-02 |
| AC-12 | RETRY-01, UI-01..04, E2E-01, E2E-03, REG-01 |
| AC-13 | STYLE-01, RESP-01, REG-01 and manual ui-spec checklist |

Expand cases: spoofed actor, invalid date bounds, unknown fields, wrong Action parent,
terminal Ticket writes; inactive/must-change sessions and sanitized shared events;
every Ticket from/to enum pair; legacy zero-Action and unknown-resolution-time data;
cancel Ticket with open Actions; terminal Action edits retaining required Result;
race Resolve vs Action create/follow-up changes; lost-response idempotent replay
after version changes; Bangkok midnight/7-calendar-day boundaries, zero buckets,
exact grouping and performedBy vs assignee metrics.

Performance smoke: isolated 10,000 Tickets/20,000 Actions, documented hardware,
warm-up then 20 requests, provisional p95 <=1000 ms per dashboard and no N+1 query
pattern. Record actual measurement/limitations; this is not a production SLA.
Manual visual/keyboard inspection is not replaced by DOM class assertions.

## Phase 2 actual implemented cases

- DATA-SOURCE-01: all nine old models plus four new records and nullable resolution
  timestamp are present (source check, not DB execution): data-contract.test.ts.
- MIG-01A/B/C: exact old-nine-table preservation; legacy null dates/zero work;
  pg_dump/pg_restore pre-upgrade recovery into a different fresh DB.
- SEED-01A/B/C/D/E/F: all status/priority/ownership/action-count fixtures;
  repeat-seed exact equality after work edit/history append; zero/nonzero metric
  query populations; immutable/parent-safe history/retry; repeat migration deploy
  and indexes; conditional-field/version/audit constraints.
- VERSION-01A..N: fourteen actual internal transaction cases added in response to
  Richy's two PR78 findings. Ticket and Action state/history commit together;
  stale/spoofed versions, missing/skipped/out-of-order history, failed event
  writes and failed policy roll back; concurrent writes have exactly one winner.
  Workflow-only version gaps from shared parent Action writes are explicitly
  tested. See version-protocol.md and review-server-output.txt for full scope.
- Tests require an explicitly opted-in isolated loopback cluster. The explicit
  npm run test:lab4-data fails on missing configuration; the general suite skips
  these DB suites without opt-in, which must not be reported as a pass.
- See database-runbook.md and retained artifacts/lab-04/phase2 output. Backend
  runtime APIs, UI, full lifecycle/race checks, client/E2E and final-main acceptance
  are NOT certified by these tests. The unchanged dependency audit is not clean.
