# Lab 3 Zen Green UI Specification

## Shared Shell

Retain Lab 2 tokens: primary `#006B3C`, pale green surfaces, labelled forms, visible focus, text-bearing badges, field-level validation, and responsive cards. The shell shows current authenticated name and role, Logout, and only permitted navigation: Requester (`My Tickets`, `Create Ticket`), IT Staff (`Ticket Queue`), Administrator (`Ticket Queue` in read-only oversight plus `User Management`). The Development Requester selector and Change Requester control are removed.

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
