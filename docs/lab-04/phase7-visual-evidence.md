# Phase7 visual evidence index

30October2026. Original loaded captures, not generated mockups.
Source: client/e2e/lab-04/responsive.spec.ts; full output and source hashes in
artifacts/lab-04/phase7/. Desktop1440x900/tablet768x1024/mobile390x844.
Panels are additional readable browser captures; originals remain beside them.
No final PDF layout or screen-reader certification implied.

| Screen / inspection | Desktop | Tablet | Mobile |
|---|---|---|---|
| Sign in; email→password keyboard path | [Image](../../artifacts/lab-04/phase7/screenshots/login-desktop.png) | [Image](../../artifacts/lab-04/phase7/screenshots/login-tablet.png) | [Image](../../artifacts/lab-04/phase7/screenshots/login-mobile.png) |
| Owned list, filters and pagination | [Image](../../artifacts/lab-04/phase7/screenshots/my-tickets-desktop.png) | [Image](../../artifacts/lab-04/phase7/screenshots/my-tickets-tablet.png) | [Image](../../artifacts/lab-04/phase7/screenshots/my-tickets-mobile.png) |
| Owned snapshot/window/attention/recents | [Image](../../artifacts/lab-04/phase7/screenshots/requester-dashboard-desktop.png) | [Image](../../artifacts/lab-04/phase7/screenshots/requester-dashboard-tablet.png) | [Image](../../artifacts/lab-04/phase7/screenshots/requester-dashboard-mobile.png) |
| Loaded selectors; editable versus read-only | [Image](../../artifacts/lab-04/phase7/screenshots/create-ticket-desktop.png) | [Image](../../artifacts/lab-04/phase7/screenshots/create-ticket-tablet.png) | [Image](../../artifacts/lab-04/phase7/screenshots/create-ticket-mobile.png) |
| Owned read-only shared Actions/history | [Image](../../artifacts/lab-04/phase7/screenshots/requester-detail-desktop.png) | [Image](../../artifacts/lab-04/phase7/screenshots/requester-detail-tablet.png) | [Image](../../artifacts/lab-04/phase7/screenshots/requester-detail-mobile.png) |
| Operational list and wrapped priority/owner labels | [Image](../../artifacts/lab-04/phase7/screenshots/staff-queue-desktop.png) | [Image](../../artifacts/lab-04/phase7/screenshots/staff-queue-tablet.png) | [Image](../../artifacts/lab-04/phase7/screenshots/staff-queue-mobile.png) |
| Operational metrics and performer work | [Image](../../artifacts/lab-04/phase7/screenshots/staff-dashboard-desktop.png) | [Image](../../artifacts/lab-04/phase7/screenshots/staff-dashboard-tablet.png) | [Image](../../artifacts/lab-04/phase7/screenshots/staff-dashboard-mobile.png) |
| Current performer list, not assigned-to counts | [Image](../../artifacts/lab-04/phase7/screenshots/my-actions-desktop.png) | [Image](../../artifacts/lab-04/phase7/screenshots/my-actions-tablet.png) | [Image](../../artifacts/lab-04/phase7/screenshots/my-actions-mobile.png) |
| Loaded legacy controls/Comments/private Notes | [Image](../../artifacts/lab-04/phase7/screenshots/staff-detail-desktop.png) | [Image](../../artifacts/lab-04/phase7/screenshots/staff-detail-tablet.png) | [Image](../../artifacts/lab-04/phase7/screenshots/staff-detail-mobile.png) |
| Expected version and keyboard Confirm/Keep | [Image](../../artifacts/lab-04/phase7/screenshots/workflow-confirm-desktop.png) | [Image](../../artifacts/lab-04/phase7/screenshots/workflow-confirm-tablet.png) | [Image](../../artifacts/lab-04/phase7/screenshots/workflow-confirm-mobile.png) |
| Near-field description/follow-up errors | [Image](../../artifacts/lab-04/phase7/screenshots/action-validation-desktop.png) | [Image](../../artifacts/lab-04/phase7/screenshots/action-validation-tablet.png) | [Image](../../artifacts/lab-04/phase7/screenshots/action-validation-mobile.png) |
| Edit draft; immutable recorded actor | [Image](../../artifacts/lab-04/phase7/screenshots/action-edit-desktop.png) | [Image](../../artifacts/lab-04/phase7/screenshots/action-edit-tablet.png) | [Image](../../artifacts/lab-04/phase7/screenshots/action-edit-mobile.png) |
| Read-only created event | [Image](../../artifacts/lab-04/phase7/screenshots/action-history-desktop.png) | [Image](../../artifacts/lab-04/phase7/screenshots/action-history-tablet.png) | [Image](../../artifacts/lab-04/phase7/screenshots/action-history-mobile.png) |
| Responsive user table/cards | [Image](../../artifacts/lab-04/phase7/screenshots/admin-directory-desktop.png) | [Image](../../artifacts/lab-04/phase7/screenshots/admin-directory-tablet.png) | [Image](../../artifacts/lab-04/phase7/screenshots/admin-directory-mobile.png) |
| Role/account edit form, no credential change | [Image](../../artifacts/lab-04/phase7/screenshots/admin-edit-desktop.png) | [Image](../../artifacts/lab-04/phase7/screenshots/admin-edit-tablet.png) | [Image](../../artifacts/lab-04/phase7/screenshots/admin-edit-mobile.png) |
| Reset form inspection only; not submitted | [Image](../../artifacts/lab-04/phase7/screenshots/admin-reset-desktop.png) | [Image](../../artifacts/lab-04/phase7/screenshots/admin-reset-tablet.png) | [Image](../../artifacts/lab-04/phase7/screenshots/admin-reset-mobile.png) |

## Readable panels for report selection

| Panel | Desktop | Tablet | Mobile |
|---|---|---|---|
| workflow-confirm | [Panel](../../artifacts/lab-04/phase7/screenshots/workflow-confirm-desktop-panel.png) | [Panel](../../artifacts/lab-04/phase7/screenshots/workflow-confirm-tablet-panel.png) | [Panel](../../artifacts/lab-04/phase7/screenshots/workflow-confirm-mobile-panel.png) |
| action-validation | [Panel](../../artifacts/lab-04/phase7/screenshots/action-validation-desktop-panel.png) | [Panel](../../artifacts/lab-04/phase7/screenshots/action-validation-tablet-panel.png) | [Panel](../../artifacts/lab-04/phase7/screenshots/action-validation-mobile-panel.png) |
| action-edit | [Panel](../../artifacts/lab-04/phase7/screenshots/action-edit-desktop-panel.png) | [Panel](../../artifacts/lab-04/phase7/screenshots/action-edit-tablet-panel.png) | [Panel](../../artifacts/lab-04/phase7/screenshots/action-edit-mobile-panel.png) |
| action-history | [Panel](../../artifacts/lab-04/phase7/screenshots/action-history-desktop-panel.png) | [Panel](../../artifacts/lab-04/phase7/screenshots/action-history-tablet-panel.png) | [Panel](../../artifacts/lab-04/phase7/screenshots/action-history-mobile-panel.png) |

[Labelled injected Note503 with retained draft](../../artifacts/lab-04/phase7/screenshots/injected-note-failure.png).
Separate real successful retry is asserted; injection is not a real outage claim.

Baseline first-login change-password captures are additionally retained:
[desktop](../../artifacts/lab-04/phase7/screenshots/change-password-desktop.png),
[tablet](../../artifacts/lab-04/phase7/screenshots/change-password-tablet.png),
[mobile](../../artifacts/lab-04/phase7/screenshots/change-password-mobile.png).
Automated old-lab authentication scenarios exercise the synthetic workflow; no
real user's password was changed.

Raw per-screen axe JSON: artifacts/lab-04/phase7/a11y/.
Per-scenario expected/unexpected console records: artifacts/lab-04/phase7/console/.
Expected only: unauthenticated auth/me401, deliberately injected internal-notes503.
Runtime exceptions/other errors fail. No blanket suppression of4xx/5xx.

Manual inspection: wrapping, clipping, overlap, hierarchy, read-only/validation
distinction and selected keyboard paths. Native select SVG arrows make axe
contrast incomplete; foreground/background text pair manually checked. RoleBadge
semantic issue found in incomplete details was fixed with genuine RED/GREEN.
Final axe/console counts and limitations: [phase7-qa.md](phase7-qa.md).
