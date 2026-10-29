# Phase 5 — final Ticket workflow and resolution gate

29 October 2026. Issue72; feature/72-lab4-ticket-workflow from reviewer-merged
staging `ae16e0049b089c6ad935eeb04cbc3d370c8c7c97`. Phase4 closure docs/images
carried with this feature, not another cleanup PR. Independent review/merge
still required; no Phase6/dashboard/release started.

## Acceptance

| AC | Implementation and verification |
|---|---|
| AC-05 | Exact eight-status matrix preserved. 64 independent expected pairs in unit tests AND 64 HTTP cases, each exercised as Staff and Administrator with persisted state/version/event assertions. Same-state/unlisted pairs409, not400. Administrator formal transition is the approved Lab4 extension; owner/comments/private Notes permissions remain unchanged and tested. |
| AC-06 | Resolve requires completed work, no Planned/In Progress work, no noncancelled follow-up. Direct bypass409 with all three reasons logged; Cancel with open work409. Real browser completes work/clears follow-up, then Staff Resolve/Close, Administrator Reopen/Cancel. Requester indication stays advisory, no formal status/version/event fabrication; API403 on formal write. |
| AC-11 | Mandatory displayed expectedVersion, including untouched legacy Tickets. Shared parent CAS/lock and audited transaction reused, no unversioned fallback. Three HTTP race categories (Resolve vs creation/follow-up/another transition), three rounds each: exactly one success/one409, one parent increment, valid final gate. UI confirmation freezes version and requires actual refresh then explicit adoption after409. |
| AC-12 | Safe read/error/retry, selection/version retained on recoverable503, busy duplicate suppression, explicit confirmation and role-aware read-only history. Nine workflow component tests and seven adapter tests; Lab4 E2E includes Phase4 regression. |
| Targeted AC-13 | Workflow form/gate/confirmation at1440×900,768×1024,390×844; no document overflow, heading focus then Tab to Confirm, inspected readable labels/buttons/status cues. Not all-app accessibility certification. |

## Runtime behavior

- Existing PATCH /staff/tickets/:id/status accepts only {status,expectedVersion}.
  Missing version409; malformed/unknown fields400; disallowed/identity409;
  stale409. No caller-supplied actor/history. Staff/Admin authenticated again
  within the parent-locked transaction. No new migration or dependency.
- Existing GET /{api|staff}/tickets/:id/workflow-events retains ordered {items}
  and now adds safe ticket{id,currentStatus,version,lastResolvedAt} plus
  eligibility{allowedTransitions,resolutionReasons,cancelBlocked}. One Repeatable
  Read snapshot supplies preview/history/status/version. Preview does NOT grant
  write authority; the actual mutation rechecks all rules under the shared lock.
- Requester reads owned status-only history; no Notes, email/session/password
  fields. Private Notes sentinel exclusion, cross-owner404 and append-only event
  update/delete rejection verified against real DB. Legacy terminal Tickets with
  zero Actions/null dates remain readable; reopening creates only its real event,
  does not invent resolution time/work, and a later Resolve still fails the gate.
- Successful Resolve sets lastResolvedAt; Close/Reopen preserve that timestamp.
  Workflow versions can legitimately have gaps from Action writes. Sorting is
  createdAt ASC,id ASC; actors/from/to/version are server-derived.
- Replaces old immediate all-enum dropdown with allowed-destination selection,
  gate explanation, keyboard-focusable confirmation and shared read-only history.
  Actions/workflow refresh parent versions after success; Requester gets no write
  controls. Draft selection is not promised across navigation/logout/browser close.
- After an uncertain status outcome, a stale retry cannot add duplicate history:
  it conflicts, then the user refreshes and inspects actual saved history/state.
  This is version reconciliation, NOT a new status idempotency-key mechanism.

## Local verification and reproducibility

Final backend:24 files/248 tests, no skips; client:15 files/68 tests; both builds.
Lab4 browser suite:12 scenarios (7 Phase4 regression +5 Phase5). Full logs and
source hashes in artifacts/lab-04/phase5; UI captures in its screenshots directory.
These are LOCAL feature-tree results, NOT new main/CI or completed full old-lab
browser-suite acceptance. Broader old E2E/hardening/performance remains Phase7.

```powershell
# server, dedicated synthetic baseline database already migrated/seeded
$env:DATABASE_URL='postgresql://postgres@127.0.0.1:55484/lab4_p5_reg_20261029'
$env:LAB4_TEST_ADMIN_URL='postgresql://postgres@127.0.0.1:55484/postgres'
$env:LAB4_PG_BIN='C:/Program Files/PostgreSQL/18/bin'
node node_modules/vitest/vitest.mjs run --reporter=verbose
npm.cmd run build
# client: component/adapter regressions
node node_modules/vitest/vitest.mjs run --reporter=verbose
npm.cmd run build
$env:LAB4_UI_TEST='1'
$env:LAB4_UI_DATABASE_URL='postgresql://postgres@127.0.0.1:55484/lab4_p5_ui_20261029'
node node_modules/@playwright/test/cli.js test -c playwright.lab4.config.ts
```

Both synthetic DBs are fresh and separate from Docker/working data. API suites
create additional unique disposable DBs under explicit loopback55484 guard.
Strict UI55486/API55485 servers cannot reuse working servers. Audited fixtures
and events retained, no history purge/reset. Hashes identify exactly tested files.

Genuine pre-fix admin-red-output.txt: expected200, got403 on actual API. That
filtered pre-fix run intentionally skips the other cases and is NOT a passing suite.
workflow-red-output.txt is a missing-module contract-first failure, not a
behavioral assertion. First full backend working run had two fixture failures
(missing required followUpRequired in new test requests); corrected, then final
full run passes. No assertion weakened to achieve this. Old Lab3 Admin-denied
status tests updated for the explicit approved Lab4 role extension; other
Staff-only mutation-denial assertions retained.

Five new E2E cases: real gate→lifecycle/Admin; Requester advisory+403; competing
Ticket409/reconciliation; explicitly injected transport503/retry; three-width
confirmation/keyboard. Only503 is injected in these Phase5 cases. API negative
and race proofs use real transactions. Fifteen final fully loaded UI captures
inspected and incorporated; no screenshot substitute for actual DB assertions.

Unresolved: inherited dependency vulnerabilities (client7 and prior server audit),
dashboards, app-wide accessibility/performance, final-main/Done board and final
PDF layout/confirmed student reflection. No audit force-fix or blocked local
report-browser workaround. Working report structural assets/anchors are checked;
final rendered report/PDF verification remains Phase8.
