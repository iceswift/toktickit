# Phase 6 — authoritative dashboards and drill-down

Working feature: `feature/73-lab4-dashboards`, based on reviewer-merged staging
`aa1f868ec0d74b8143848471955e3e40d963e47b`. Scope: Issue #73, AC-07/08/12/13.
This is not final Lab 4 release acceptance. Phase 5 closure records are carried
in this same feature branch; reviewed historical commits were not rewritten.

## Population and read consistency

Both endpoints compute `asOf` once and read in a PostgreSQL Repeatable Read
transaction. The Requester guard remains session-owned; Staff/Admin endpoint has
its own explicit sibling-route role check. First-login/inactive/anonymous callers
cannot access metrics. Client-supplied dashboard query fields are rejected.

| Card | Exact population / linked list |
|---|---|
| Requester Open | Session owner; NEW/OPEN/IN_PROGRESS/WAITING_FOR_REQUESTER/REOPENED; `statusGroup=open` |
| Requester Waiting | Session owner; WAITING_FOR_REQUESTER; status alias preserved |
| Requester Recently Resolved | Session owner; RESOLVED/CLOSED; non-null lastResolvedAt within explicit half-open window |
| Staff Unassigned Open | Open group and ownerUserId null; `statusGroup=open&unassigned=true` |
| Staff My Open | Open group and ownerUserId equal session user; not requester identity |
| Staff status buckets | All eight statuses, including numeric zero buckets |
| Staff priority buckets | Open group only; all five IT priorities, including zeros |
| My Actions | performedByUserId equal session user; all states/all time; NOT assigned-to count |

The resolved window starts at Bangkok midnight six calendar dates before the
response's local date, ends exclusively at `asOf`; timestamps stored UTC. Tests
cover exact midnight, before/end boundaries, December/January, reopened Tickets,
and unknown legacy resolution times. Unknown dates remain null and are excluded
only from the resolved-time window, not ordinary status counts.

Recent Tickets use updatedAt DESC/id DESC, limit five, not the seven-day window.
Attention uses owned Waiting; urgent list includes open URGENT first then HIGH,
each subgroup updatedAt DESC/id DESC, combined limit five. Recent work uses
createdAt DESC/id DESC and current performer, limit five. Ticket summaries omit
description, files and private Notes; recent Action descriptions are shortened to
160 characters. Full authorized My Actions is separately paginated, ten per page.

## UI behavior

Existing role landing pages are preserved. Dashboard is an explicit navigation
choice. Backend drill-down URLs are parsed into allowlisted list query fields;
external URLs, wrong-role paths, duplicates and unknown keys fail safely. Lists
preserve initial dashboard scope through search/sort/pagination; selecting a new
explicit status clears the contradictory group. Clear resets the scope. Opening
a Ticket and going Back returns to the source page; returning to Dashboard
re-fetches the snapshot. Explicit Refresh fetches after external mutations.

Loading/error clears old metrics. Failure/403 never masquerades as numeric zeros;
Retry re-requests data. No new framework, schema migration, dependencies or auth
relaxations are introduced.

## Verification and provenance

- Local server: 267 tests in 26 files passed, with real isolated PostgreSQL enabled.
- Local client: 82 tests in 16 files passed. Server and client builds passed.
- API fixture independently enumerates database rows and compares all 19 card
  populations/drill-down totals (3 Requester, 3 Staff/My Actions, 8 status, 5
  priority), plus the separate zero-population proof.
- Full logs: `artifacts/lab-04/phase6/*-output.txt`; injected failures are labelled,
  not evidence of a real outage. Initial missing-module red output is not claimed
  as behavioral TDD. Browser acceptance and image inspection are recorded below
  only after completion.
- Synthetic regression DB `lab4_p6_reg_20261030`; synthetic browser DB
  `lab4_p6_ui_20261030`, loopback PostgreSQL port55484. Working application data
  and credentials untouched. Fixtures and histories are retained, not purged.

Reproduce server with explicit DATABASE_URL, LAB4_TEST_ADMIN_URL on
`127.0.0.1:55484/postgres`, LAB4_PG_BIN, then `npm test -- --reporter=verbose`.
Client: `npm test -- --reporter=verbose` and `npm run build`.
Browser: fresh migrated/seeded reserved p6 UI database, LAB4_UI_TEST=1,
LAB4_UI_DATABASE_URL, `npx playwright test --config playwright.lab4.config.ts`.
This config refuses working database names and reuse of existing servers; ports
55485/55486 are reserved for isolated testing.

## Remaining acceptance boundary

Peer review and reviewer merge are required before Done/Issue closure. No main/CI
result, performance load test, all-app accessibility certification or final PDF
pagination is inferred. Existing dependency audit warnings remain for Phase7.
The working report has not received automated rendered-layout approval; previous
local-file browser access restriction is not bypassed.

Phase6 browser checkpoint: 18 scenarios passed (12 prior Lab4 +6 Dashboard).
Dashboard6 rerun after expanded Requester viewport coverage also passed; not24
unique tests. Inspected15 screenshots: actual metrics/drill-down/zero plus labelled
delayed/injected503/injected403 states, both roles at1440×900/768×1024/390×844.
Initial17pass/1fail was a fixture assumption: Darin actually had a Waiting Ticket;
kept failure log and replaced zero scenario with a newly created synthetic owner,
not deleted history. All19 API counts still pass; recent work length160 asserted.
Report Parts5/8/9 updated; structural document/asset check passed, not rendered QA.
