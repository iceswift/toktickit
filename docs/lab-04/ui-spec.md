# Lab 4 UI Specification - draft

Reuse existing Zen Green conventions; no replacement design or new shell framework.
Requester Dashboard and Staff/Admin Dashboard lead to detailed lists/Tickets.
Actions area belongs to existing Ticket Detail: list plus create/view/edit modes,
assignment and explicit status controls. Requesters have read-only own-Ticket work.

Display date/time, description, result, authenticated performed-by, separate assignee,
follow-up indicator/note and attachment notes. Preserve terminal Actions/history.
UI transitions reflect backend eligibility but never replace backend authorization.
Show a resolution explanation when the proposed gate is unmet; Requester indication
is advisory. Distinguish shared Actions from private InternalNotes without color alone.

Every screen needs loading, success, zero/empty vs no-results, validation, forbidden,
not-found, stale-conflict and API-failure feedback. Field errors are near fields and
semantically associated. Busy submits prevent duplicate clicks. Recoverable failures
retain input; conflicts require deliberate refresh/reconciliation, not silent overwrite.

Proposed inspection viewports: desktop 1440x900, tablet 768x1024, mobile 390x844.
Inspect all major screens at all three; additionally keyboard traversal, visible
focus, semantic labels/headings, non-color cues, readable contrast, dialogs, clipping,
overlap and horizontal overflow. Screenshot only fully loaded readable content.

| Visual/accessibility check | Current status |
|---|---|
| Zen Green design consistency and role navigation | Not implemented |
| Dashboard cards, current-user Actions and drill-down | Not implemented |
| Action list/forms/status/read-only visibility | Not implemented |
| Editable/read-only fields and validation placement | Not implemented |
| Button hierarchy, loading and recoverable feedback | Not implemented |
| Keyboard/focus/semantic labels/non-color cues/contrast | Not verified |
| Clipping, overlap and horizontal overflow | Not verified |

No checkbox is marked complete before actual inspection.

Desktop: up to four-column metric grid, readable tables/recent lists; tablet two
columns, mobile one-column cards and labelled stacked rows. Exact metric drill-down
links preserve role filters; My Actions paginated list links staff Ticket Detail.
Action form contains local datetime converted to ISO+timezone, description/result,
active assignee, follow-up checkbox/conditional note and attachment notes. Actor and
createdAt read-only. Create starts Planned; terminal status cannot reopen, permitted
annotations still append history on active Tickets. Requester has no write controls.
One idempotency key per logical create, retained with input through retry/failure.
409 shows reload/reconcile, never overwrites automatically. Success refreshes Ticket
version/status, Action/history and dashboard. Semantic labels, keyboard focus,
textual statuses/priorities and field-associated errors required at all viewports.
