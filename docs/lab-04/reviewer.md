# Lab 4 Peer Review Record

Status update, 28 October 2026: student requested a replacement Phase 1 PR with
Richyboy170 as reviewer. Preserve the original contract and review corrections;
this is a reviewer handover, not a new product implementation or approval.
Richyboy170's repository write permission was verified before requesting review.
Replacement PR details will be recorded after creation. PR #76 is historical and
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
