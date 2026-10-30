# Lab 4 UI Specification and Inspection

Current30October2026: product Phases1-7 accepted at staging b887994.
[Historical notes](ui-spec-history.md) preserve earlier implementation states.
This checklist records actual local inspection, not final release/main/PDF QA.

Reuse existing Zen Green conventions; no replacement design or new shell framework.
Requester Dashboard and Staff/Admin Dashboard lead to detailed lists/Tickets.
Actions area belongs to existing Ticket Detail: list plus create/view/edit modes,
assignment and explicit status controls. Requesters have read-only own-Ticket work.

Display date/time, description, result, authenticated performed-by, separate assignee,
follow-up indicator/note and attachment notes. Preserve terminal Actions/history.
UI transitions reflect backend eligibility but never replace backend authorization.
Show a resolution explanation when the approved gate is unmet; Requester indication
is advisory. Distinguish shared Actions from private InternalNotes without color alone.

Every screen needs loading, success, zero/empty vs no-results, validation, forbidden,
not-found, stale-conflict and API-failure feedback. Field errors are near fields and
semantically associated. Busy submits prevent duplicate clicks. Recoverable failures
retain input; conflicts require deliberate refresh/reconciliation, not silent overwrite.

Verified inspection viewports: desktop 1440x900, tablet 768x1024, mobile 390x844.
Inspect all major screens at all three; additionally keyboard traversal, visible
focus, semantic labels/headings, non-color cues, readable contrast, dialogs, clipping,
overlap and horizontal overflow. Screenshot only fully loaded readable content.

| Visual/accessibility check | Current status |
|---|---|
| Zen Green design consistency and role navigation | Implemented; current nav semantics and skip link verified in Phase7 |
| Dashboard cards, current-user Actions and drill-down | Actual DB/API/component/browser evidence in Phase6/7 |
| Action list/forms/status/read-only visibility | Loaded desktop/tablet/mobile captures and role tests |
| Editable/read-only fields and validation placement | Gray read-only fields, near-field text/aria errors; three-width inspection |
| Button hierarchy, loading and recoverable feedback | Primary/secondary controls; retained drafts/retries; confirmed writes clear input |
| Keyboard/focus/semantic labels/non-color cues/contrast | Selected keyboard paths and axe automated scans pass after measured contrast fixes; not full assistive-tech certification |
| Clipping, overlap and horizontal overflow | Loaded screenshots inspected, document-width assertions pass; normal vertical scroll |

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


## Navigation, data refresh and evidence limits

Explicit Dashboard navigation preserves legacy landing pages. One current nav
destination, skip link and visible focus are semantic, not color-only cues.
Dashboard filters persist into list search/sort/pagination; source context is clearable.
Back from Detail returns to its source. Remount/Refresh re-fetch; errors clear stale
metrics. My Actions means performedBy, not assignments. Requester/shared Actions
and private Internal Notes remain distinct and backend protected.

Phase7:64 inspected images,48 automatic axe reports with zero violations and10
console records with zero unexpected errors. Exact expected unauthenticated auth/me401
and injected Note503 retained. Native select SVG backgrounds make some contrast
checks incomplete; actual text color pairs checked manually. Not screen-reader or
WCAG certification. Phase8 Staff-specific delayed request, injected503/403, real
zero-personal-work and retry captures supplement earlier Requester state images.
All injections explicitly labelled; real API authorization tests remain separate.

Color fixes preserve Zen Green: navbar pure white on #198754 is4.53:1;
validation #b02a37 on #f8f9fa is6.16:1; read-only #495057/#e9ecef is6.90:1.
Role badges have a supported accessible name, pagination a navigation landmark.
Source facts and loaded screenshot inventory: [phase7-visual-evidence.md](phase7-visual-evidence.md).
