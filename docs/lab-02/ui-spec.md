# Lab 2 Zen Green UI Specification

## Tokens and Shared Components

| Token | Value and use |
|---|---|
| Primary green | `#006B3C` header, primary actions, strong emphasis |
| Secondary green | `#0B7A46` active navigation, focus accents, links, hover |
| Pale green | `#EAF6EF` selected and success emphasis |
| Page background | `#F5F7F6` near-white page background |
| Surface | white card, subtle border, restrained shadow |
| Text | dark charcoal-green, never pure black as the main body color |
| Error | dark red text/border directly below its field |
| Warning | amber callout/badge only when conveying warning |

All form labels appear above controls. Required fields use a red asterisk plus a
written validation message. Inputs share one height; Description is a larger
textarea. Buttons contain visible text. Icon-only controls have an accessible
name and tooltip. Keyboard focus is always visible. Editable, read-only, invalid,
disabled, busy, loading, success, empty, no-results, and failure states are
visually distinct without relying on color alone.

## Application Shell

The header shows TokTickIT, navigation links for My Tickets and Create Ticket,
the selected Development Requester, and Change Requester. The active page is
visually clear. Mobile navigation remains touch-friendly and readable.

## Development Requester Selection

Show TokTickIT title; testing-only explanation; active Requester dropdown;
Continue button; and loading, empty, and safe API-failure states. Continue is
disabled until an active Requester is chosen. No active Requesters shows an empty
state. The screen explicitly says that authentication comes in Lab 3.

## Create Ticket

Use a centered responsive card. Group read-only/system fields near the top,
classification fields together, Summary and Description with adequate width, and
Attachments below the main form. Requester displays from selected context.
Submit shows busy text and is disabled while pending. On success, show the
backend-generated Ticket Number and a clear next action. Validation messages
remain next to their related fields; API failure preserves entered values.

## My Tickets

Provide Create Ticket action, search, filters, sort, clear filters, pagination,
and clear states. Desktop uses an understandable table; mobile uses cards or a
responsive table that does not clip. Each item identifies Ticket Number, Summary,
Category, Requested Priority, Current Status, and Last Updated. Empty Tickets and
no results from an active search/filter must use different wording.

## Ticket Detail and Attachments

Ticket information is read-only and visually distinct from editable controls.
Attachment controls are in a separate section with active, uploading, invalid,
removed, and unavailable states. Active Attachments offer download and removal;
removal asks for a reason and confirmation. Removed metadata remains visible but
download/preview actions are absent or disabled with explanatory text.

## Badges

Requested Priority uses a consistent readable badge per priority. IT Priority is
read-only and initially `Not set`. Current Status displays `New` consistently.
Each badge includes text, not color alone.

## Responsive and Accessibility Rules

| Viewport | Required behavior |
|---|---|
| Desktop >= 992px | Centered multi-column layout with sensible maximum width |
| Tablet 768-991px | Two columns where practical; Summary/Description remain usable |
| Mobile < 768px | Fields stack; touch-friendly buttons; no horizontal page scrolling |

At every size there must be no clipped labels, overlapping messages, hidden
buttons, or unreadable attachment filenames. Controls are keyboard reachable,
focusable, and labelled; error/success states use text as well as color.

## Visual Inspection Checklist and Screenshot Paths

Playwright captures desktop, tablet, and mobile views under:

- `artifacts/lab-02/screenshots/create-ticket/`
- `artifacts/lab-02/screenshots/my-tickets/`
- `artifacts/lab-02/screenshots/ticket-detail/`

For each viewport, check tokens, editable/read-only distinction, validation
placement, busy/disabled buttons, active navigation, table/card behavior,
pagination and filters, attachment controls, clipping, overlap, and horizontal
overflow.
