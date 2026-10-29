# Lab 4 Peer Review Record

## Current Phase3 preparation - 29 October 2026

Issue70; branch feature/70-lab4-actions from peer-merged staging f4b6ea9.
Action APIs and real in-transaction policy/replay implemented; local backend
22files/110tests, build/schema validation passed. Actual Issue70 Project status
Started was set and verified in Browser in app. Feature PR/direct Issue link,
peer approval and merge are not claimed until separately verified.
The earlier Phase2 closure-only local docs/images are included with this feature
as planned, not via another cleanup PR. See phase3-api.md for role/UI scope limits.

## Current closure - 29 October 2026

PR78 reviewer Richyboy170 approved final head c2d7027 at 22:23:23 UTC on 28 October,
then merged at 22:23:32 UTC into lab4-staging, f4b6ea9d108fe7de14a4856f4b78c75ca2c6cc32.
These are 29 October 05:23 Bangkok. No author merge. Source tree equality with
fetched staging verified; pre-merge local test output is not new staging/main CI.
Issue69 AC09/10 verified and closed; actual Project card Done. Browser in app
captured reviewer approval/merge, closed Issue and Done68/69, all in report.html.
See phase2-closure.md and artifacts/lab-04/github/phase2-merge-record.json.
Closure additions are local, to carry with the next feature work, not a new PR.
Earlier pending-review sections below are historical and superseded.

## Latest review correction - 28 October 2026

Richyboy170 COMMENTED on PR78 head e17403f at 08:04:31 UTC, not APPROVED.
Both findings are valid: workflow-event and Action-event uniqueness does not
make parent/entity versions atomic or sequential. The correction implements the
reviewer's mutation-layer option before new routes are exposed; see
version-protocol.md and server/src/lab4/versioned-mutations.ts. No SQL-wide
invariant or completed API/domain policy is falsely claimed.

Fourteen new internal transaction tests pass; integrated backend regression is
20 files / 66 tests with no skips, plus build. Existing migration SQL is unchanged,
and populated legacy preservation/recovery and seed repeat tests still pass.
Actual logs: artifacts/lab-04/phase2/review-server-output.txt,
review-build-output.txt and review-data-output.txt. Fix c03110677b0deff0326094b26dff202dcc0c1c82
was pushed to the SAME PR78. Author answered both findings with actual results at
https://github.com/iceswift/toktickit/pull/78#issuecomment-6470468784 and requested
re-review from Richyboy170. Actual Browser in app screenshot:
artifacts/lab-04/github/phase2-pr78-version-review-reply.png. Visually verified:
Open PR78 into staging, correction commit, both replies and real test counts.
Approval/reviewer merge remain pending; Issue69 is not Done. No CI checks are
attached; the recorded backend results are local, not a passing GitHub CI claim.

Earlier checkpoint sections below are historical, not current review state.

## Current Phase 2 PR Review - verified through in-app browser

Issue69; feature/69-lab4-data from peer-merged staging0f84785. Data schema,
migration, seed and tests implemented and locally verified. Student now explicitly
authorized push and opening the Phase2 PR; no approval or merge is claimed.
Direct Development linkage to Issue69 is now verified in the in-app browser and
GitHub API. PR78 was changed from Draft to Ready for review after that verification.
Reviewer: Richyboy170. Do not mark Issue69 Done or imply peer integration.
Actual PR: https://github.com/iceswift/toktickit/pull/78, initially Draft, now Open/Ready.
Product/evidence commit: 0ad56c4; source branch feature/69-lab4-data;
target lab4-staging. Richyboy170 review requested; approval and merge pending.
Actual Project2 now shows Issue69 in PR Review with linked PR78, and closed
Issue68 in Done. Board filter Lab4 was temporary, not saved as the shared view.
Actual PR78 overview/Development, Project cards and PR77 approval/merge screenshots
were captured and visually inspected in Browser in app; no Edge input was used.
Actual local test scope and remaining security/visual gaps: database-runbook.md.

## Verified closure - 28 October 2026 (local report update)

PR #77 was approved by Richyboy170 at 06:34:37 UTC and merged by that reviewer
at 06:34:46 UTC, merge 0f84785e4ac219fccf05559e87258d8010a2c080 into lab4-staging.
Original #76 is also recorded merged by GitHub at 06:34:48 UTC, its original
history being contained in #77. #76 retains direct Development linkage to #68;
#77 closingIssuesReferences is empty. Do not claim a retrospective #77 link or
an approval on #76. Actual author reply:
https://github.com/iceswift/toktickit/pull/77#issuecomment-6462523848.
Issue #68 was manually closed after integrated-contract verification. Kanban Done
status is unverified: Project CLI lacks read:project. No new PR or merge created.
This closure update is carried with the authorized Phase2 feature branch, not
through a separate closure-only PR or direct staging push.
Earlier checkpoint entries below are retained as history, not current status.

Status update, 28 October 2026: student requested a replacement Phase 1 PR with
Richyboy170 as reviewer. Preserve the original contract and review corrections;
this is a reviewer handover, not a new product implementation or approval.
Richyboy170's repository write permission was verified before requesting review.
Replacement PR: https://github.com/iceswift/toktickit/pull/77;
docs/lab4-contract-richy -> lab4-staging, requested reviewer Richyboy170.
PR #76 is historical and
must not be treated as approved or merged.

Previous checkpoint: Phase 1 PR #76 OPEN; jarbbie requested changes on 8 October 2026.
Route contract correction prepared on the same branch on 16 October 2026.
No reviewer approval or merge exists yet. Author must not self-merge.
Do not reuse the friend's PR #60 as evidence of this repository's Lab 4.

Required workflow: real Issue -> feature/docs branch -> directly Issue-linked PR
into lab4-staging -> feedback/replies on same PR -> reviewer approval AND reviewer
merge -> tests/AC verified -> Issue Done/closed. Release lab4-staging -> main also
needs peer review/reviewer merge. Lab 3 author-merge exception is not carried forward.

For each actual PR append Issue/PR URLs, head SHA, author/reviewer, review comments,
responses/changes, approval and merge identity/time/SHA, CI/evidence and remaining gaps.
Do not fabricate dialogue or pre-fill successful reviews.

## Phase 1 actual checkpoint - 8 October 2026

- Issue: https://github.com/iceswift/toktickit/issues/68; assigned iceswift.
- PR: https://github.com/iceswift/toktickit/pull/76.
- Source: docs/lab4-contract -> lab4-staging; contract commit
  753ddeb6c871d1aa909097bb97ad2617de48732a predates any Lab 4 product code.
- Author: iceswift. Requested peer: jarbbie (actual repository collaborator).
- Direct Issue link verified via Development and closingIssuesReferences; board
  Issue #68 displays #76 and is PR Review, not Done. Remaining #69-75 Backlog.
- Review comments/responses/approval/merge: none yet; will append real events.
- Verification: structural contract checker and git diff checks passed. This is
  docs-only; zero GitHub checks were attached at checkpoint. No product Pass claimed.
- Captured and visually inspected actual PR link/review-request and PR Review board.

## Review correction - 16 October 2026

- Actual reviewer jarbbie requested changes on head fc1cdfa, 8 October 2026,
  16:33:57 UTC: Requester paths must match /api/tickets and /api/attachments;
  Staff/Admin/auth must retain /staff, /admin and /auth.
- Confirmed the finding against baseline server/src/app.ts middleware/mounts and
  client/src/api.ts fetch paths. It was a real contract error, not a product fix.
- Corrected all proposed Requester paths, event paths, route-order instruction,
  metric drill-down example and explicit server-origin URL notation. Listed Staff
  paths fully and specified guards for new sibling Staff endpoints.
- Added regression assertions to scripts/verify_lab4_contract.py for baseline
  mixed prefixes, resolved endpoint paths and absence of bare /tickets paths.
- Approval, merge and Phase 1 completion remain pending peer re-review.
- Fix pushed as fa8e550; actual response posted at
  https://github.com/iceswift/toktickit/pull/76#issuecomment-6215220380.
  Re-review requested from jarbbie. Actual Edge screenshot of commit/reply
  visually inspected and incorporated in the report; no approval is claimed.
- Project CLI cannot move Issue #68 to Fixing: current token lacks read:project
  scope. No board transition or new screenshot is claimed for this correction.
  Existing 8 October screenshots remain historical, not current-state evidence.
