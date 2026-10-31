# Lab 4 Test DD and traceability - accepted feature verification

30 October 2026. Current matrix supersedes earlier planning-only tables.
Historical red/green results and closures remain in phase2..6 records and Git.
Base: reviewer-merged staging df785a5. Results are LOCAL feature-tree runs,
not final main or CI. Phase7 was subsequently approved/merged by Richyboy170 in
PR83; that acceptance does not turn earlier local output into a fresh main run.

## Actual implemented paths

Server files below: server/tests/lab-04/; client: client/tests/lab-04/;
browser: client/e2e/lab-04/.

| ID / AC | Assertions | Actual files |
|---|---|---|
| ACTION / AC-01, AC-02, AC-03 | Validation, actor vs assignee, immutable events, status/edit rules | action-validation.unit.test.ts, actions-taken.api.test.ts, ActionsTaken.test.tsx, actions-api.test.tsx, actions-taken-flow.spec.ts |
| AUTH / AC-04 | Owned read-only Actions, other-owner404, wrong-role writes denied, private Notes excluded | actions-taken.api.test.ts, ticket-workflow.api.test.ts, actions-taken-flow.spec.ts; existing Lab2/3 regression |
| WORKFLOW / AC-05, AC-06 | Full8×8 matrix for Staff/Admin, unfinished-work/follow-up gates, advisory Requester indication, immutable status history | ticket-workflow.unit.test.ts, ticket-workflow.api.test.ts, TicketWorkflow.test.tsx, workflow-api.test.tsx, ticket-resolution.spec.ts |
| REQUESTER / AC-07 | Owned metrics/calendar boundaries/legacy dates/recents/attention/drill-down; loading/zero/error/403 | dashboard-policy.unit.test.ts, dashboards.api.test.ts, requester-dashboard.api.test.ts, RequesterDashboard.test.tsx, dashboards.spec.ts |
| STAFF / AC-08 | Status/priority/unassigned/owner queues, performedBy vs assignedTo, Admin boundaries, matching drill-down | dashboards.api.test.ts, staff-dashboard.api.test.ts, StaffDashboard.test.tsx, RequesterDashboard.test.tsx (shared cases), dashboards.spec.ts |
| MIGRATION / AC-09 | Original data/relations survive additive migration; real pg_dump/restore recovery | data-contract.test.ts, migration-regression.api.test.ts |
| SEED / AC-10 | Repeat seed retains IDs/work/events/versions; zero/one/multiple Actions and distinct actors | seed-regression.api.test.ts |
| CONCURRENCY / AC-11 | Parent locks, version gates, one winner409, Action vs Resolve, replay and rollback | versioned-mutations.integration.test.ts, ticket-workflow.api.test.ts, actions-taken.api.test.ts |
| RECOVERY / AC-12 | Persistent scoped Action key, same-payload replay/different409; conflict/input retention; Comment/Note serialized and cleared only after confirmed save | actions-taken.api.test.ts, ActionsTaken.test.tsx, TicketWorkflow.test.tsx, StaffDraftRecovery.test.tsx, responsive.spec.ts |
| STYLE / AC-13 | One current nav destination, skip link/focus, semantic errors/read-only/non-color cues, axe WCAG2A/AA+2.1AA at three widths | ZenGreenStyle.test.tsx, responsive.spec.ts |
| PERF / AC-07, AC-08 |10k Tickets/20k Actions/events, five warmups+20HTTP samples/role, p95<=1000ms, bounded inner-model calls and EXPLAIN ANALYZE BUFFERS | dashboard-performance.test.ts (explicit opt-in) |

## Retained actual local outputs

All paths in artifacts/lab-04/phase7/:
- server-final-consistent-fixture-output.txt:29 files/272 tests passed, opted-in
  performance included; synthetic Action fixtures retain their paired events.
- client-final-output.txt:19 files/90 tests passed after all semantic follow-ups;
  client-build-output.txt passes. Unsupported RTL exact option caught earlier by TS.
- e2e-final-verified-output.txt:37 unique prior Lab2/3 and Lab4 scenarios passed on
  final product source. The10-scenario visual/console subset yields48 axe reports,
  no automatic violations and no unexpected console/runtime errors; incomplete
  native-select contrast manually reviewed.64 actual images retained and inspected.
- Staff draft RED (lost input/duplicate requests) and navigation RED retained;
  focused GREEN proves the fixes. Tooling/parser failures are not behavioral TDD.
- Latest client/server audit JSON:0 advisories after compatible patches and
  explicitly selected supported tooling. Audit0 is not a full security proof.

## Reproduction and limits

See README and phase7-qa.md. Backend test:lab4-qa requires explicit loopback55484
regression DB, admin URL and performance opt-in. Browser test:e2e uses safe
playwright.lab4-qa.config.ts, LAB4_UI_TEST=1 and lab4_p7_ui_* DB; reserved API/UI
ports55485/55486 with reuseExistingServer=false. Helpers reject other environments
before mutation. Only synthetic accounts/data; retain append-only histories.

Performance threshold is a local smoke criterion, not a production SLA.
Instrumentation counts inner dashboard model operations, not outer auth SQL or
BEGIN/COMMIT. Bulk synthetic fixture insertion is not API execution proof.
Axe plus selected keyboard checks is not screen-reader certification. All captures
require visual inspection before selecting report figures; current inventory and
manual inspection notes are in phase7-visual-evidence.md and phase7-qa.md.
Clean lockfile reproducibility is documented above. Fresh final-main
output and rendered PDF pagination are separate pending gates; no unexecuted or
skipped suite is represented as passing.

## Phase8 supplementary proof and reproduction

Staff-specific real empty-personal-work, held-request loading, labelled injected
503/403 and actual200 retry captures are under artifacts/lab-04/phase8/screenshots.
They supplement, not relabel, earlier Requester state proof. The capture CLI script
rejects non-reserved UI origins; a new synthetic Staff account has no personal work.
The working Docker database and append-only histories are untouched.

Installed Chrome exposed a missing favicon request not requested by the earlier
headless run. A native SVG favicon/reference fixes that concrete404. Actual GET
on the reserved UI origin returns200/image-svg; the Phase8 client/build/full-browser
rerun is retained separately under artifacts/lab-04/phase8, never called main/CI.
The complete compact backend rerun uses the same environment guard and full test
set with the default reporter; verbosity is presentation, not test exclusion.
