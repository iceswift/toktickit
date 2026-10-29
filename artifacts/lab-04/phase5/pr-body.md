## Phase 5 — final Ticket workflow and resolution gate

Closes #72

Base: reviewed `lab4-staging` at Phase4 merge `ae16e00`.

### Changes
- Preserve exact eight-status matrix; extend formal status writes to Staff/Administrator per approved contract, without widening owner/comments/private Notes permissions.
- Require supplied expectedVersion on every status write, including untouched legacy Tickets; reject unknown identity/history fields. Shared parent lock/CAS, transactional gate/history and immutable audit remain mandatory.
- Resolve requires completed work/no open work/no noncancelled follow-up; Cancel blocks open work. No invented legacy work/history/resolution dates; lastResolvedAt set on genuine Resolve, retained across Close/Reopen.
- Extend existing safe workflow-events response with consistent ticket/version/gate preview metadata (RepeatableRead); actual writes independently recheck under lock.
- Replace immediate all-enum status select with explicit allowed transition/confirmation, retained selection, deliberate409 refresh/rebase, safe errors and owned Requester read-only history.
- Carry Phase4 approved/merged/Done closure records; working report Part7/9 includes15 inspected Workflow captures. No extra cleanup PR.

### Actual LOCAL verification
- Backend: **24 files /248 tests passed**, no skips. New65 unit cases and73 API cases; all64 pairs each tested as Staff/Admin over HTTP, complete gate/bypass/role/legacy/history and9 concurrent writer rounds.
- Client: **15 files /68 tests passed**;9 new Workflow component cases +7 adapter cases.
- Both production builds passed.
- **12/12 Lab4 E2E scenarios passed** (7 Phase4 regression +5 Phase5). Real work→Resolve/Close→Administrator Reopen/Cancel, advisory Requester + API403, real competing409/reconciliation; labelled injected503;1440×900/768×1024/390×844 confirmation/keyboard/overflow.
- Actual pre-fix Administrator403 vs expected200 test retained as red proof; filtered red run is not passing evidence. Initial fixture omissions corrected without weakening assertions.
- Structural docs/anchors/assets check and git whitespace check passed.

Full logs/source hashes: `artifacts/lab-04/phase5/`. Details: `docs/lab-04/phase5-ticket-workflow.md`.

### Review focus / limits
Please check exact matrix, strict legacy preconditions, role boundary, gate/race atomicity, sanitized immutable history, selection preservation/version reconciliation and form responsiveness.

No schema/dependency change; inherited audit risk remains. Tests use fresh synthetic DBs/strict test servers, not working app data. These are not GitHub CI/main, all old browser suites or final-main acceptance. Dashboards, performance/app-wide QA, release/PDF remain later phases.

**Reviewer approves AND merges** into lab4-staging. I will reply to findings and fix in this same PR; author does not self-merge. Issue72 remains Open until acceptance/reviewer merge is verified.
