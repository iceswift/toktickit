# Lab 4 Evidence Register

Checkpoint: 2026-10-08, Asia/Bangkok. Baseline main `5398f2d08659014f5e0c6245941dfeba7e44c42c`.
States: Planned -> Captured -> Visually verified -> Incorporated -> Final-main reverified.
Draft report is a checklist, not a finished submission; do not mark planned work complete.

| Evidence ID | Part / AC | Required proof | State | File / provenance |
|---|---|---|---|---|
| GIT-BASE | 1 | Correct main/staging baseline and actual Phase 1 board | Captured, visually verified, linked in report source | baseline.md; artifacts/lab-04/github/phase1-issue68-started.jpg; Issue #68 Started; 8 Oct; 1280x720 browser; UI/main baseline SHA recorded |
| SPEC-01 | 2 | Approved spec commit before product implementation | Student decisions approved; peer review pending | specification.md; D-01..04 approved 8 Oct; spec commit to be recorded |
| TEST-01 | 3 / all AC | Planned coverage and real final test paths/output from main | Plan recorded, execution pending | tests.md |
| AI-01 | 4 | Actual tool/prompts and confirmed personal reflection | One authentic prompt recorded | ai-use.md |
| STAFF-01 | 5 / AC-08,12 | Metrics vs DB, performedBy work, drill-down and safe states | Planned | Capture in Phase 6 |
| ACT-01 | 6 / AC-01..04,11,12 | List/create/assign/edit/transitions/complete/cancel, different staff/actions, negatives | Planned | Capture in Phases 2-4 |
| WF-01 | 7 / AC-05,06,11 | Full transitions, gate bypass, immutable ordered history, visibility | Planned | Capture in Phases 3/5 |
| REQ-01 | 8 / AC-04,07,09,12 | Owned metrics, DB agreement, drill-down and representative Labs 1-3 regressions | Planned | Capture in Phases 6-8 |
| VIS-01 | 9 / AC-13 | Rendered ui-spec, every major screen at three viewports and completed checklist | Planned | Capture in Phases 4-8 |

Each captured record must add date, command/URL, source SHA, actual role, viewport,
fixture vs real-data designation, file path, result and visual inspection status.
Keep original images, never include blank/loading/unreadable screenshots. Do not
capture credentials, cookies/tokens or private user information.

GIT-BASE capture: actual https://github.com/users/iceswift/projects/2/views/1,
authenticated student iceswift, not a mock board. Image shows the active Started
card clearly; it is NOT final all-Done evidence and is labelled accordingly.
The HTML draft contains this image; rendered report inspection is still pending.

## Phase 1 PR checkpoint - 8 October 2026

Contract commit: 753ddeb6c871d1aa909097bb97ad2617de48732a.
PR #76 directly linked to Issue #68; jarbbie review requested; no approval/merge yet.
Actual board: Backlog 7, Specified 0, Started 0, PR Review 1, Fixing 0, historical Done24.
These are interim sprint images, NOT final Lab 4 all-Done proof.

| File (artifacts/lab-04/github/) | Source/role/viewport | Inspection |
|---|---|---|
| phase1-backlog.jpg | Actual Project #2, iceswift, 1280x720, baseline main5398f2d / contract753ddeb | Captured; shows backlog7; inspect report before completion claim |
| phase1-pr-review.jpg | Actual Project #2, iceswift, 1280x720 | Captured and visually verified; #68 PR Review displays #76 |
| phase1-pr76-linked.jpg | Actual PR76, iceswift, 1265px browser content | Captured and visually verified; direct Development linkage and requested jarbbie review |

Structural check: python scripts/verify_lab4_contract.py PASS, covering required files,
AC-01..13 test mapping, nine report sections, anchors and local asset references.
No product test, feature, migration or database mutation is claimed.

Report visual limitation: browser rejected file:// navigation under its URL policy.
No workaround attempted. HTML assets/anchors were structurally verified and the
original GitHub screenshots inspected, but rendered HTML layout has NOT been
certified. Keep that QA item pending; source can be opened in the app file editor.

## Working Phases (organizing choice, not mandated number)

1. Baseline/contract/backlog, decision approval, spec/test plan before coding.
2. Database migration/recovery, Action model and idempotent seeds (depends 1).
3. Action APIs/auth/validation/history/conflicts/retry tests (depends 2).
4. Action UI/roles/safe states/responsive proof (depends 3).
5. Final Ticket matrix/resolution gate/history (depends 3; UI evidence depends 4).
6. Role dashboards/query proof/drill-down (depends 2/3; lifecycle verification 5).
7. Integrated regression/security/performance/accessibility (depends 4-6).
8. Reviewer records/release/final main/Done board/one-PDF QA (depends 7).

Tests and report evidence evolve in the same active feature PR, not postponed to Phase 8.
