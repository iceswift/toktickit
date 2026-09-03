# Lab 2 Sprint Engineering Specification

## 1. Sprint Goal

Deliver a responsive Requester-facing Ticketing MVP. A selected Development
Requester can create an IT support ticket, find only their own tickets, inspect
an owned ticket, and manage permitted attachments. The selector is a Lab 2 test
context; it is not authentication.

## 2. Stakeholder Request Interpretation

TokTickIT needs a reliable Requester workflow before real authentication and IT
Staff workflow are introduced in later labs. The system must persist tickets in
PostgreSQL, generate an official Ticket Number in the backend, protect
requester-owned data, and provide reusable Zen Green responsive screens.

## 3. Scope

### Included

- Development Requester selection and switching for testing.
- Create Ticket, My Tickets, Requester Ticket Detail, and attachment lifecycle.
- Search, filters, sorting, pagination, validation, ownership protection, and
  loading, empty, no-results, success, and safe failure states.
- PostgreSQL/Prisma data changes, REST APIs, automated tests, visual inspection,
  and end-to-end evidence.

### Excluded

- Real authentication, passwords, sessions, tokens, and role-based authorization.
- IT Staff queues, assignment, status changes after `NEW`, and changing IT Priority.
- Public Comments, Internal Notes, Actions Taken, resolution, closing, reopening,
  cancellation, and administration screens.

## 4. Functional Requirements

- FR-01: The application shall load active Development Requesters and require one
  to be selected before ticket screens can be used.
- FR-02: The application shall show the selected Requester and provide Change
  Requester; changing it reloads requester-specific data.
- FR-03: The application shall load active Categories and Related Systems from
  PostgreSQL for Create Ticket.
- FR-04: The application shall create one validated Ticket and return a backend-
  generated official Ticket Number.
- FR-05: The application shall list only the selected Requester's Tickets with
  search, filters, sorting, and pagination.
- FR-06: The application shall retrieve a Ticket Detail only when it belongs to
  the selected Requester.
- FR-07: The application shall allow the owner to add a permitted attachment,
  download an active attachment, and soft-remove an active attachment.
- FR-08: The application shall present loading, validation, empty, no-results,
  success, and safe API-failure feedback on applicable screens.
- FR-09: The application shall apply the Zen Green UI rules and support desktop,
  tablet, and mobile viewports.

## 5. Business Rules

- BR-01: The backend generates a unique official Ticket Number in the format
  `TKT-YYYYMMDD-XXXXXXXX`, where the final segment is an uppercase random value.
  A database unique constraint remains the final collision safeguard.
- BR-02: A newly created Ticket has `currentStatus = NEW` and
  `itPriority = NOT_SET`; neither is editable by a Requester in Lab 2.
- BR-03: Development Requester selection is only a test context and must be
  labelled as not being a login or authentication mechanism.
- BR-04: Only active Development Requesters appear in the selector. A stored
  selection that is absent or inactive is cleared and the user returns to the
  selector.
- BR-05: The client stores the selected requester ID in session storage and sends
  it as `X-Development-Requester-Id` on requester-owned API calls. The backend
  validates that it identifies an active Development Requester; it is never a
  security credential.
- BR-06: A Ticket belongs to exactly one Requester. List, detail, attachment
  metadata, download, upload, and removal operations must verify ownership in
  the backend and return no protected data on failure.
- BR-07: Category, Related System, Ticket Summary, Requested Priority, and
  Description are required. The client trims Summary and Description before
  submission; the backend repeats all validation.
- BR-08: Summary must contain 5-120 non-whitespace characters and Description
  must contain 10-2,000 non-whitespace characters. Requests with invalid IDs,
  enums, or values are rejected with field-level errors.
- BR-09: Submit is disabled while a create request is pending. A failed request
  retains the user's valid entered values and never claims that a Ticket was
  saved.
- BR-10: My Tickets searches Ticket Number and Summary case-insensitively; it
  supports Category, Requested Priority, and Current Status filters. Default
  order is newest `createdAt` then descending ID; permitted sort fields are
  `createdAt`, `updatedAt`, `ticketNumber`, and `requestedPriority`.
- BR-11: List pages are one-based. Permitted page sizes are 10, 20, and 50;
  invalid query values receive a safe 400 response. An empty list and a
  no-results search/filter state are visibly different.
- BR-12: Ticket Detail is read-only for Ticket fields in Lab 2. Direct access to
  another Requester's Ticket must return a safe not-found response rather than
  revealing ownership.
- BR-13: Allowed attachment types are JPG/JPEG, PNG, WEBP, and PDF. Each active
  file is at most 5 MB, and a Ticket has at most five active attachments.
- BR-14: Attachment uploads use generated server-side storage names outside
  version control. Original filename, generated storage name, MIME type, byte
  size, upload timestamp, and removal metadata are stored in PostgreSQL.
- BR-15: Attachment removal is soft removal. It requires a 5-250 character
  reason, records requester and timestamp, retains metadata, and blocks preview
  and download of the removed file.
- BR-16: If an upload fails after Ticket creation, the Ticket remains saved and
  the UI reports the failed file without claiming it was attached. No orphaned
  active Attachment record may remain.
- BR-17: API errors must be safe and actionable; unexpected errors expose no
  stack trace, storage path, or another Requester's information.
- BR-18: The data model must remain evolvable for Lab 3 authentication by keeping
  DevelopmentRequester as a distinct, clearly temporary owner model.

## 6. UI Specification Summary

The application shell has TokTickIT identity, My Tickets and Create Ticket
navigation, selected Requester display, Change Requester, and a visible active
page state. Zen Green tokens, component states, accessibility, responsive rules,
and screenshot paths are defined in [ui-spec.md](ui-spec.md). The screens are:

- Development Requester Selection: active-user dropdown, Continue, explanation,
  loading, empty, and failure states.
- Create Ticket: grouped classification fields, clearly read-only system values,
  field-level validation, attachment selection, busy submit, and confirmation
  containing the official Ticket Number.
- My Tickets: search, filters, sort, pagination, desktop table/mobile cards, and
  distinct loading, empty, no-results, and failure states.
- Requester Ticket Detail: read-only Ticket fields and separate Attachment actions
  and states; it contains no Staff workflow or comments.

## 7. Data Changes

The Prisma design will extend the existing `Category` model and add:

- `DevelopmentRequester`: `id`, unique `email`, `displayName`, `isActive`, and
  timestamps.
- `RelatedSystem`: `id`, unique `name`, `isActive`, and timestamps.
- `Ticket`: `id`, unique `ticketNumber`, requester/category/related-system foreign
  keys, `summary`, `description`, `requestedPriority`, `itPriority`,
  `currentStatus`, and timestamps.
- `Attachment`: `id`, ticket foreign key, original/generated filename, MIME type,
  byte size, storage key, upload timestamp, nullable soft-removal fields, and the
  removing requester relation.

`Category` gains `isActive`. Enums are `RequestedPriority` (`LOW`, `MEDIUM`,
`HIGH`), `ITPriority` (`NOT_SET`, `LOW`, `MEDIUM`, `HIGH`, `URGENT`), and
`TicketStatus` (`NEW`). Unique constraints protect Category, Related System,
Requester email, and Ticket Number. Foreign keys protect ownership and reference
data. Indexes will support `Ticket(requesterId, createdAt)`, common requester
filters, and active attachment lookup. The chosen compound requester/date index
is justified because every list query is ownership-scoped and defaults to newest
Tickets first.

The seed must be idempotent and provide four required Categories, at least six
Related Systems, at least four active Requesters, one inactive Requester, and
test Tickets only when needed by automated tests. The inactive Requester never
appears in the selector.

## 8. API Contract

The detailed contract is in [api-spec.md](api-spec.md). It covers active reference
data, Development Requesters, Ticket creation, requester-owned paginated lists,
owned detail, and the attachment lifecycle. `200`, `201`, `204`, `400`, `404`,
`409`, `413`, `415`, and `500` are used only for documented outcomes.

## 9. Acceptance Criteria

- AC-01: Given active Requesters exist, when the selector loads, then it displays
  active Requesters from PostgreSQL and identifies itself as testing-only.
- AC-02: Given no Requester is selected, when a protected screen is opened, then
  the selector is shown instead of requester-owned data.
- AC-03: Given valid Ticket input and selected Requester A, when Create Ticket is
  submitted, then one Ticket for A is saved with a unique backend Ticket Number
  and `NEW` status and success shows that number.
- AC-04: Given invalid Create Ticket input, when submission is attempted, then
  field-level messages appear and no API create call is made for client-invalid
  input; backend-invalid input returns safe field errors.
- AC-05: Given a create or reference-data API failure, when the UI receives it,
  then safe feedback appears and valid entered form values remain available.
- AC-06: Given Requester A has Tickets, when My Tickets loads for A, then only A's
  Tickets are returned and the documented search, filter, sort, and pagination
  controls work.
- AC-07: Given Requester B is selected, when B requests A's Ticket or Attachment,
  then protected data and download are not returned.
- AC-08: Given an owned Ticket, when its Detail opens, then the Ticket fields are
  read-only and active attachment metadata/actions are displayed.
- AC-09: Given a permitted file within limits, when its owner uploads it, then it
  appears as an active attachment; invalid type, oversized file, or a sixth active
  file is rejected safely.
- AC-10: Given an active owned Attachment and valid removal reason, when removal
  is confirmed, then its metadata remains marked removed and download is blocked.
- AC-11: Given each required viewport, when the three core screens render, then
  controls are usable without clipping, overlap, or horizontal page scrolling.
- AC-12: Given the final main branch, when documented test commands run, then all
  planned unit, API, UI, style, responsive, and E2E tests pass without skipping.

## 10. Definition of Done

- All included Functional Requirements, Business Rules, and Acceptance Criteria
  are implemented and verified.
- Prisma migration, idempotent seed, API contract, UI specification, and README
  are current and consistent with implementation.
- Every Acceptance Criterion maps to one or more planned tests; all planned tests
  name their actual test files and pass from final `main`.
- No required test is skipped, disabled, flaky, or replaced by an unrelated test.
- Desktop, tablet, and mobile visual checks match ui-spec.md with no clipping,
  overlap, broken focus state, or horizontal overflow.
- Each Issue uses a feature branch and a PR into `lab2-staging`, linked through
  the Development panel, peer-reviewed, approved, and merged.
- Review comments receive a response; reviewer identity and PR evidence are in
  `reviewer.md`; selected AI prompts and reflection are in `ai-use.md`.
- All Lab 2 Issues are Done, integration tests pass on `lab2-staging`, and the
  peer-reviewed release PR is merged into `main`.
- The final concise PDF uses Answer Part 1 through Answer Part 9 in order and has
  readable screenshots and working links.

## 11. Assumptions and Decisions

- `X-Development-Requester-Id` simulates a current identity consistently across
  requester-owned APIs. It will be replaced by authenticated identity in Lab 3.
- The server stores permitted upload bytes locally using generated names; uploads
  are not committed to Git. Controlled API download is required instead of a
  public static directory.
- Requested Priority has three Requester choices. IT Priority exists only as a
  read-only default for compatible badge presentation until Staff workflow exists.
