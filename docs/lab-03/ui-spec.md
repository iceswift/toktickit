# Lab 3 Zen Green UI Specification

## Shared Shell

Retain Lab 2 tokens: primary `#006B3C`, pale green surfaces, labelled forms, visible focus, text-bearing badges, field-level validation, and responsive cards. The shell shows current authenticated name and role, Logout, and only permitted navigation: Requester (`My Tickets`, `Create Ticket`), IT Staff (`Ticket Queue`), Administrator (`Ticket Queue` oversight plus `User Management`). Administrator oversight is read-only except the explicitly permitted IT Priority update. The Development Requester selector and Change Requester control are removed.

## Required Screens and Modes

| Screen | Main mode and controls | Required feedback |
|---|---|---|
| Login | email, password, submit | validation, busy, safe invalid/inactive/failure |
| Change Password | current/initial password, new password, confirmation | rules, validation, busy, success, safe failure |
| Requester Ticket Detail | inherited read-only detail, attachments, Public Comments, resolution indication | ownership not-found, comment validation, success/failure |
| IT Staff Queue | compact desktop table, mobile cards, search/filter/sort/page controls | loading, empty, no-results, forbidden, failure |
| IT Staff Detail | read-only requester facts; editable owner/IT priority/status; Public Comments and distinct Internal Notes | valid transitions, confirmation, busy, validation, safe failure |
| User Management | list Name/Email/Role/Status/Edit; search, optional role filter, create/edit panel, initial-password reset | duplicate, safety conflict, forbidden, success/failure |

## Role and Safety Presentation

Public Comments use a shared green-accented section labelled “Visible to Requester, IT Staff, and Administrator.” Internal Notes use a separate neutral section labelled “Visible to IT Staff and Administrator”; a Requester never sees it. Editable operational fields are visually distinct from read-only Ticket facts. Status, Requested Priority, IT Priority, and role badges always include text.

## Responsive and Accessibility Rules

- Desktop >= 992px: dense but readable queue table and two-column detail where useful.
- Tablet 768-991px: controls wrap without overlap; table can reduce columns.
- Mobile < 768px: queue uses cards; forms stack; no horizontal document scroll.
- Controls are keyboard reachable, labels precede fields, focus is visible, and feedback includes text rather than color alone.
- Visual evidence covers desktop, tablet, and mobile for Login, Change Password, Queue, Staff Detail, and User Management.

## Source-alignment note - 4 October 2026

The Administrator priority exception above corrects the earlier overly broad "read-only oversight" wording. This is a post-implementation reconciliation, not a backdated contract change. Shared controls currently use Bootstrap success green and the standard blue focus ring; retaining the Lab 2 primary token was the design target, not a claim that every rendered green equals `#006B3C`. The released status selector submits an attempted transition immediately; its validation/success feedback is observed, but a separate confirmation dialog is not implemented. The planned confirmation entry in the screen table must not be read as proof of an implemented dialog.

Keyboard evidence `release63-keyboard-focus.png` records Tab moving to the Email field with a visible focus ring on released main `b65714d`. This verifies that observed control, not a full keyboard-accessibility or WCAG audit. Password mismatch evidence uses a synthetic account and rejects unequal confirmation before changing its password.

## Completed visual inspection checklist - 4 October 2026

Scope: all 15 released-main `b65714d` images of Login, Change Password, Queue, Staff Detail and User Management at 1280, 820 and 390 pixels were visually inspected. Width assertions are independently recorded in the nine passing E2E tests. Results describe those fixtures/viewports only.

| Check | Observed result | Evidence / limitation |
|---|---|---|
| Colors and design consistency | Green shell/primary actions, neutral facts, yellow private-note warning and text feedback are consistent. | Bootstrap success green is used; exact Lab 2 hex and measured contrast compliance are not asserted. |
| Role-aware navigation | Requester has My Tickets/Create Ticket; Staff has Queue; Administrator has Queue/User Management. | Latest Requester shell and Staff/Admin responsive images. API denial is independently exercised in Part 3. |
| Text-bearing badges | Role, formal status and separate Requested/IT Priority badges are present. | Released #62/#63 correction; desktop/tablet/mobile User Management and Queue images. |
| Editable versus read-only | Staff selectors and comment/note textareas differ from plain Ticket facts. Admin edit/create controls differ from the list. | Detail and User Management responsive images. Administrator priority exception is explicit above. |
| Validation placement | Password mismatch and invalid login use a visible alert above their forms; admin duplicate/safety feedback is near the page/form. | This is observed page-level feedback, not a claim that every error is field-level. |
| Button hierarchy | Primary sign-in/save/create actions are filled green; navigation/edit/claim actions are outlined; private-note action has warning emphasis. | Five-screen responsive set and operational screenshots. |
| Keyboard focus | Tab reaches Email and shows a clear blue ring. | `release63-keyboard-focus.png`; other controls/full traversal are not exhaustively certified. |
| Clipping | No cut-off page controls observed; long Ticket text wraps and mobile cards retain actions. | At 820px the native Sort select shortens its displayed option text; recorded usability limitation, not marked as zero truncation. |
| Overlap and hidden controls | No overlapping labels/buttons or unintentionally hidden required actions observed in the fixture images. | Mobile lists switch to cards; header wraps to multiple lines. |
| Horizontal overflow | Automated document-width assertions passed for all five screens in three viewports. | Full-page images support the observed layouts, not all possible data/browser combinations. |
