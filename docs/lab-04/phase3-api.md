# Phase 3 Action APIs - implementation and evidence

Closure29October: independently approved/merged in PR79 by Richyboy170, staging
2f633d0, reviewed headcc479b2. Issue70 Closed/Done after scope verification. See
phase3-closure.md for actual images/records and explicit local-vs-CI distinction.

29 October 2026. Branch feature/70-lab4-actions from reviewer-merged staging
f4b6ea9. Issue70 maps AC01..04/11/12. Local verification is NOT peer acceptance,
GitHub CI or final-main evidence. No UI/dashboard work is included.

## Implemented surface

- GET owned `/api/tickets/:ticketId/actions`, `/actions/:actionId/events`,
  `/workflow-events`: authenticated Requester, safe404 for cross-owner/parent;
  shared work only, no Notes/password/session information. Requester writes403.
- GET corresponding `/staff/tickets/:ticketId/...`: authenticated Staff/Admin.
- POST `/staff/tickets/:ticketId/actions`: session actor, active Staff/Admin
  assignee, normalized fields/date limits, initial PLANNED, scoped retry key.
- PATCH Action root/assignee/status: distinct validated request shapes,
  expected Action AND Ticket versions, permitted transitions, terminal-Ticket
  protection, merged conditional-field validation and immutable event snapshots.
- GET `/staff/actions?performedBy=me`: actual session creator, not assignee,
  safe Ticket numbers, creation-time/ID descending and bounded pagination.
- Ticket lists use actionDateTime/ID ascending, page>=1, pageSize10/20/50.
  Existing `/staff/ticket-owners` is now explicitly authenticated as a sibling
  path; prefix `/staff/tickets` alone never protected it.

Every write runs the reviewed Phase2 persistence layer with a real policy under
the parent row lock. The service composes that layer into ONE outer transaction;
no separately committing nested transaction. Creation serializes the retry scope
with a transaction advisory lock before querying the durable IdempotencyRecord.
Same normalized payload/key replays the saved resource before stale checks;
different payload conflicts409. Both version preconditions are excluded from
the normalized hash; replay rechecks session/access even for a now-terminal Ticket.
No in-memory cache, key deletion or new event on replay. Different actors/Tickets
have separate scopes. Event versions and actor identity are never client-controlled.

## Required legacy-writer safety prerequisite (not completed Phase5 UI)

A real negative test demonstrated that the baseline status route returned200
when resolving with a PLANNED Action. The old writer had to be guarded before
new Action writes could coexist safely. `legacy-workflow.ts` now takes the same
parent version/lock and atomically writes status history, enforcing Resolve work/
follow-up prerequisites and no cancellation with open Actions. Real HTTP race
testing proves Resolve vs Action creation has one successful writer and one409.

Baseline Staff-only status permission is intentionally retained; Administrator
formal workflow extension, complete transition-matrix coverage and UI integration
remain Phase5. Transitional no-version compatibility applies ONLY to an untouched
legacy Ticket with no Actions AND no workflow history. It still uses conditional
server-read version locking; once work/history exists, missing expectedVersion is
a409 conflict. It is not the final strict-version UI protocol. Phase5 must remove
that compatibility once the client sends expectedVersion consistently.

Actions already on a terminal Ticket cannot be newly written. COMPLETED/CANCELLED
Actions cannot transition again, but eligible field edits on active Tickets remain
audited per D03; a completed Result cannot be emptied. Cancelled Action follow-up
is historical, not outstanding work for the Resolve gate. These rules are not
claims that the complete Phase5 role/UI workflow is finished.

## Actual tests, failures and environment

- `action-validation.unit.test.ts`: 30 cases, including all16 Action state pairs,
  malformed dates/calendar days/timezone omissions, spoofed/unknown fields,
  string/negative versions/IDs, text limits and distinct mutation shapes.
- `actions-taken.api.test.ts`: 14 cases against real Express/Supertest/PostgreSQL,
  including permissions, first-login/inactive denial, cross-requester/parent404,
  safe projections, terminal restrictions, follow-up/result validation, own work,
  stable pagination, immutable history, concurrent retry/scoped keys, stale writes,
  blocked legacy Resolve, and actual Resolve/Action race.
- Full backend: **22 files / 110 tests passed, no skips**, duration60.54s;
  build and schema validation passed. All eight migrations unchanged.
- Complete passing output and actual NEGATIVE_API_PROOF/CONCURRENCY_API_PROOF
  responses: artifacts/lab-04/phase3/server-full-output.txt. The safe500 check
  injects a simulated DB outage explicitly; the ownership/concurrency proofs use
  the actual database, not mocked responses.
- Genuine pre-fix legacy gate red: legacy-gate-red-output.txt shows expected409
  but actual200. Initial validation red was a missing-module load failure, not
  30 observed failing assertions. Initial API setup failed due a missing synthetic
  passwordHash; that is not presented as behavioral TDD evidence.
- First full run: 110 assertions passed but the suite FAILED in old fixture cleanup
  because immutable workflow history prevents deleting its parent Ticket. The
  test now uses a fresh Ticket number and retains audited disposable fixtures;
  no trigger/constraint/test assertion was disabled. Failed run retained separately.

Tests use the dedicated PostgreSQL18 loopback55484 cluster, fresh uniquely named
synthetic DBs. Full passing DB: lab4_p3_regression_ccb09eb2913b4d01859cc36eeaaa5a6f.
No application/Docker DB reset or migration. Explicit `npm run test:lab4-actions`
fails without the isolated-cluster opt-in; default `npm test` skips isolated API
suites if not configured (skips are NOT passing API evidence).

## Still pending

New UI/client/E2E, full final Ticket role/matrix/UI,
dashboards, clean dependency audit, final-main/one-PDF acceptance remain pending.
The unchanged dependency lockfile has the previously disclosed audit findings;
this phase does not falsely certify a clean release. Local Phase2 closure evidence
and the student's visual confirmation are carried with this feature work.
