# Lab 4 Test DD - planned, not executed

Baseline `5398f2d`; D-01 through D-04 student-approved on 8 October 2026.
Paths below are planned and do not yet exist. No Lab 4 test is labelled Pass.
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
| MIG-01 | Integration / AC-09 | Populated legacy IDs/counts/relations survive migration; recovery succeeds | server/tests/lab-04/migration-regression.api.test.ts | Planned |
| SEED-01 | Integration / AC-10 | Repeated seed yields same fixture counts and relationships | server/tests/lab-04/seed-regression.api.test.ts | Planned |
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

## Explicit AC traceability (all Planned)

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
