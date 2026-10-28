# Phase 2 review correction: versioned transaction protocol

PR #78 reviewer Richyboy170 commented on head `e17403f` on 28 October 2026:
unique event-version indexes do not guarantee that current rows and their history
advance together. Both the Ticket and Action findings are valid.

## Implemented boundary (not a database-wide invariant)

`server/src/lab4/versioned-mutations.ts` implements the reviewer's mutation-layer
option BEFORE any new Action/workflow HTTP API is exposed. It is not registered
in `app.ts`. No migration was rewritten and no trigger is falsely credited with
enforcing this transaction protocol. SQL still enforces positive/unique versions,
parent-safe relations, immutable Action identity and append-only history only.
Direct ORM/SQL can bypass the transaction protocol; these are NOT supported
application write paths. The negative tests deliberately create corrupt history
through raw ORM and prove that the protocol refuses further mutation of it.

## Protocol and invariants

1. Each writer supplies `expectedTicketVersion`. A conditional parent update
   (`id + version`, increment exactly one) obtains the Ticket row lock FIRST.
   Zero affected rows throws `STALE_VERSION`. Action and Ticket mutations share
   this lock/precondition, so concurrent writers cannot both win on one version.
2. A policy callback runs INSIDE the locked transaction. The default policy denies
   the mutation. Future APIs must use a real callback for authenticated actor,
   active role/assignee, accessibility, terminal status, transition and Resolve
   rules. The tests use an explicit synthetic no-op: it is not an authorization
   test or implementation of the full Resolve gate.
3. Action creation sets version 1 and inserts exactly one CREATED event at 1.
   Updates require `expectedVersion` AND the parent precondition, verify an
   existing contiguous Action history in insertion order (CREATED at 1, then
   exactly 2..current), increment exactly one, and append the matching event with
   old/new allowed-field values. A failed entity/history write rolls back both
   the Action and the shared Ticket version.
4. Ticket transition saves from/to and the newly incremented Ticket version in
   the same transaction. Existing workflow history must be increasing, no later
   than the previous Ticket version, continuous in status, and end at the current
   status. Failed event insertion rolls back state, resolution time and version.
5. Callers cannot specify event versions or identity/current-version fields in
   the mutation data. Caller-supplied version 99, stale preconditions, missing/
   skipped/out-of-insertion-order Action history and corrupt workflow history
   fail without persisted changes. No standalone append-event operation is exposed.

Ticket versions are a SHARED sequence: creation/edit/assignment/status of an
Action also increments the Ticket version. Therefore workflow-only events need
not have adjacent version numbers. Example: Action creation/edits consume parent
versions 2, 3, 4; the next real Ticket transition has workflow version 5, NOT 2.
Action's own event sequence, however, is contiguous 1, 2, 3. Tests prove both.

## Phase 3/4 integration gate

- Do not expose raw `actionTaken` / event writes in a route. All versioned writes
  must use this protocol with a real in-transaction policy callback.
- The existing Lab 3 status route has NOT been converted here and is not claimed
  to enforce this new protocol. Phase 4 must convert it before enabling the final
  Lab 4 Ticket workflow; no coexistence of bypassing legacy/new writers is accepted.
- Creation idempotency must later join the SAME transaction (authenticate/recheck
  replay, normalized payload hash, saved resource and key). This module does not
  yet implement API replay, ownership, permitted status matrices or Resolve rules.
- Phase 3/4 API and race tests remain mandatory. Internal persistence tests do not
  stand in for HTTP permission tests, complete lifecycle tests, CI or final main.
- Dedicated synthetic seed snapshots are a bootstrap path with explicit fixture
  provenance, not real user mutation history. Existing fixture work is preserved;
  the seed-regression user-edit step now uses the actual transaction protocol.

## Reproduce and evidence

`npm run test:lab4-data` now includes `versioned-mutations.integration.test.ts`.
It uses the runbook's opt-in loopback PostgreSQL18 cluster on port55484 and fresh
unique databases, never the application database. The general test command skips
isolated database suites without opt-in; that must not be reported as a Pass.

The focused 14-case suite passed locally. Complete integrated output is retained
in `artifacts/lab-04/phase2/review-server-output.txt`; build output separately in
`review-build-output.txt`. Verify the final summary there rather than treating
earlier 52-test evidence as the new total. No approval or merge is implied.
