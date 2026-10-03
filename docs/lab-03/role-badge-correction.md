# Role-badge correction — 3 October 2026

Released baseline: main `8469b118bada539edb7fc3fff8d76a11180bd576`. Lab sheet Section 7 and ui-spec.md require role badges, but User Management and the authenticated shell used plain role text. Status/priority badges were already present.

Backlog: [Issue #61](https://github.com/iceswift/toktickit/issues/61). The card was automatically added to the existing Project in Backlog, then moved to Specified and Started. Issue creation occurred after the local correction began; this ordering is disclosed in the Issue body.

## Focused correction

- Shared `client/src/RoleBadge.tsx` renders a Bootstrap badge with a visible role value and accessible `Role: <role>` label.
- Shell retains current name, role wording, permitted navigation and Logout, and adds the role badge.
- Desktop user table and mobile cards use the same component; Active/Inactive remain separate status badges.
- `client/tests/lab-03/RoleBadge.test.tsx` covers all three roles and both user-list views. An existing requester-session UI test also checks the shell badge.

## Actual local verification (correction branch, NOT main)

The new user-list regression failed before integration of the component into User Management: three component cases passed and the desktop/mobile integration case failed. After the fix, client **33/33 in 11 files**, existing E2E **9/9**, and client production build passed. No backend behavior or authorization rule changed.

Raw logs: `step3-role-badge-before-fix.txt`, `step3-role-badge-client-tests.txt`, `step3-role-badge-client-build.txt`, `step3-role-badge-e2e.txt`, retained locally under output/playwright. Responsive captures under artifacts/lab-03/screenshots/phase-08-qa were regenerated on this correction branch for desktop 1280x900, tablet 820x900 and mobile 390x844. Width assertions passed; desktop/mobile User Management images were visually inspected for badge placement/readability. These are branch evidence, not released-main evidence.

## Pending integration

Peer review and reviewer merge into lab3-staging, reviewer release into main, final-main rerun and final Done board. The report content audit, concise layout, every-page PDF QA and student personal reflection read-through remain incomplete. Existing final-main counts 42/29/9 describe release #60, not this correction. Do not label the PDF submission-ready.

Local report/API/specification/model-name reconciliation is retained separately and not silently included in this focused product PR. Its final documentation integration must follow the GitHub workflow as well.
