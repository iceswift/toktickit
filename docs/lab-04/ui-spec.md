# Lab 4 UI Specification - prepared for peer review

Current30October Phase7: major screens implemented and inspected at three widths;
current checklist below supersedes historical phase-only pending notices. Actual
captures/automated and manual limits: phase7-visual-evidence.md and phase7-qa.md.
Independent review and final release/PDF inspection are separate pending gates.

Phase5 local checkpoint: Ticket Workflow gate/confirmation/history and Requester
read-only view implemented; three-width captures/focus/overflow checks inspected.
See phase5-ticket-workflow.md and report Part7/Part9 continuation. Below old
not-implemented table is historical; dashboards/app-wide final QA still pending.

29October2026 implementation note: Phase4 Actions-only forms/list/history are
implemented and locally verified; below “Not implemented” table remains the
historical plan for the full sprint. See phase4-actions-ui.md and report Part6/9
for inspected three-width screenshots, semantic validation/focus, field-state
and safe-error proof. Dashboard/final-workflow/app-wide checks remain pending.

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

Proposed inspection viewports: desktop 1440x900, tablet 768x1024, mobile 390x844.
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

## Phase6 working UI checkpoint

Explicit Dashboard navigation preserves legacy landing pages. Server filters
are retained in list search/sort/pagination; scope is visible and clearable.
Back from Detail returns to its source; Dashboard remount and explicit Refresh
re-fetch. Loading, zero,403 and failure differ; old counts clear on fetch/error.
My Actions lists current-performer work, not assignments. Whole-app final QA
checkboxes above remain pending. Actual targeted browser evidence is recorded in
[Phase6](phase6-dashboards.md), not inferred from component tests.
