# Lab 2 Test Plan and Results

## 1. Test Strategy

Tests were planned from the approved specification before implementation. Unit,
API, UI component, UI style, responsive/visual, and E2E tests collectively cover
every Acceptance Criterion. Where practical, tests were written to expose the
required behavior before implementation and then kept green through refactoring.

## 2. Planned Tests

| ID | Type | AC | What it tests | Expected result | Planned file | Final |
|---|---|---|---|---|---|---|
| UNIT-01 | Unit | AC-03 | Ticket Number generator | Required format; fresh retry candidate | `server/tests/lab-02/ticket-number.test.ts` | Pass |
| API-01 | API | AC-01 | Active Requester list | Active only; inactive excluded | `server/tests/lab-02/development-requesters.api.test.ts` | Pass |
| API-02 | API | AC-03, AC-04 | Valid/invalid Ticket creation | 201 or field-level 400; persisted ownership | `server/tests/lab-02/create-ticket.api.test.ts` | Pass |
| API-03 | API | AC-05 | Create/reference failure safety | Safe field errors; no false success | `server/tests/lab-02/create-ticket.api.test.ts` | Pass |
| API-04 | API | AC-06 | Owned list query | Search/filter/sort/page metadata only for owner | `server/tests/lab-02/my-tickets.api.test.ts` | Pass |
| API-05 | API | AC-07, AC-08 | Detail ownership | Owner gets 200; other requester gets the same safe 404 | `server/tests/lab-02/ticket-detail.api.test.ts` | Pass |
| API-06 | API | AC-07, AC-09, AC-10 | Attachment lifecycle | Allowed upload, true type check, active-file limit, owner-only access, soft removal, blocked download | `server/tests/lab-02/attachments.api.test.ts` | Pass |
| UI-01 | UI | AC-01, AC-02 | Requester selector states | Loading, active options, empty/failure, guard | `client/tests/lab-02/DevelopmentRequester.test.tsx` | Pass |
| UI-02 | UI | AC-03, AC-04, AC-05 | Create Ticket states | Validation, busy, success number, retained error form | `client/tests/lab-02/CreateTicket.test.tsx` | Pass |
| UI-03 | UI | AC-06 | My Tickets states | Search/filter/sort/page, empty/no-results/failure | `client/tests/lab-02/MyTickets.test.tsx` | Pass |
| UI-04 | UI | AC-08 | Detail states | Read-only owned fields, back navigation, and no-data error state | `client/tests/lab-02/RequesterTicketDetail.test.tsx` | Pass |
| UI-05 | UI | AC-09, AC-10 | Attachment lifecycle states | File selection/upload state, removal reason, and removal confirmation | `client/tests/lab-02/RequesterTicketDetail.test.tsx` | Pass |
| STYLE-01 | UI style | AC-04, AC-11 | Required labels/states/classes | Required marker, field message, busy/disabled state | `client/tests/lab-02/ZenGreenStyle.test.tsx` | Pass |
| RESP-01 | Responsive | AC-11 | Three viewport layouts | No overflow/clipping; usable controls | `client/e2e/lab-02/responsive.spec.ts` | Pass |
| E2E-01 | E2E | AC-01, AC-03, AC-06, AC-08 | Requester creates then finds/opens Ticket | Official number persists for correct owner | `client/e2e/lab-02/requester-ticket-flow.spec.ts` | Pass |
| E2E-02 | E2E | AC-07, AC-09, AC-10 | Multi-requester and Attachment lifecycle | Cross-owner access blocked; removal blocks download | `client/e2e/lab-02/requester-ticket-flow.spec.ts` | Pass |

## 3. Acceptance-Criterion Traceability

| Acceptance Criterion | Planned tests |
|---|---|
| AC-01 | API-01, UI-01, E2E-01 |
| AC-02 | UI-01 |
| AC-03 | UNIT-01, API-02, UI-02, E2E-01 |
| AC-04 | API-02, UI-02, STYLE-01 |
| AC-05 | API-03, UI-02 |
| AC-06 | API-04, UI-03, E2E-01 |
| AC-07 | API-05, E2E-02 |
| AC-08 | API-05, UI-04, E2E-01 |
| AC-09 | API-06, E2E-02 |
| AC-10 | API-06, UI-05, E2E-02 |
| AC-11 | STYLE-01, RESP-01 |
| AC-12 | All planned automated tests |

## 4. Responsive and Visual Checklist

At desktop, tablet, and mobile sizes verify Zen Green tokens, readable labels,
editable/read-only distinction, field-level validation, busy/disabled buttons,
focus indicators, header/navigation, filters, pagination, attachment controls,
empty/no-results states, no clipping, no overlap, and no horizontal page overflow.

## 5. Test Commands

The following commands were run against the final local implementation on
5 September 2026:

```bash
cd server && npm test
cd client && npm test
cd client && npm run build
cd server && npm run build
cd client && npm run test:e2e
```

## 6. Final Results

Phase 2 results:

- `client && npm test`: 6 tests passed, including the two Development Requester
  selector tests.
- `server && npm run build`: passed.
- `server && npx prisma validate`: passed.
- `server && npx prisma migrate deploy`: applied the Development Requester
  migration successfully.
- `server && npm run prisma:seed`: succeeded twice, confirming the seed is safe
  to rerun.
- `server && npm test`: 3 API tests passed, including API-01 against PostgreSQL.

Phase 3 results:

- `server && npx prisma migrate deploy`: applied the Ticket and Related System migration.
- `server && npm run prisma:seed`: seeded active Categories and seven Related Systems safely.
- `server && npm test`: 7 tests passed, including Ticket Number and create-ticket API coverage.
- `client && npm test`: 8 tests passed, including Create Ticket validation and backend-number confirmation.
- `client && npm run build` and `server && npm run build`: passed.

Phase 4 results:

- `server && npm test`: 9 tests passed, including owned-list search, filter, sort, pagination metadata, and invalid-query coverage.
- `client && npm test`: 10 tests passed, including My Tickets search query and distinct empty/no-results states.
- `client && npm run build` and `server && npm run build`: passed.

Phase 5 results:

- `server && npm test`: 11 tests passed, including owner-scoped detail, invalid ID,
  missing Ticket, and cross-requester safe-404 coverage.
- `client && npm test`: 12 tests passed, including read-only detail rendering,
  back navigation, and a non-disclosing error state.
- `client && npm run build` and `server && npm run build`: passed.

Phase 6 results:

- `server && npm test`: 16 tests passed, including permitted upload, oversized and content/type
  validation, max-five rejection, owner-only metadata access, soft removal, and
  blocked download.
- `client && npm test`: 13 tests passed, including file selection/upload state
  and removal confirmation with a reason.
- `client && npm run build` and `server && npm run build`: passed.

Phase 7 results:

- `server && npm test`: 16 tests passed across health, reference data, Ticket
  creation/list/detail, and Attachment lifecycle coverage.
- `client && npm test`: 14 tests passed, including Zen Green required-field,
  Bootstrap class, and disabled-safe submit conventions.
- `client && npm run test:e2e`: 3 Playwright tests passed: requester create →
  search → detail, cross-requester protection plus Attachment upload/removal,
  and My Tickets at desktop (1280 px), tablet (820 px), and mobile (390 px).
- `client && npm run build` and `server && npm run build`: passed.

## 6.1 Final Verification Snapshot (5 September 2026)

The final full-suite run reconfirmed the delivered behavior after the release
evidence was assembled:

- `server && npm test`: **8 test files / 16 tests passed**. This includes
  requester selection, Ticket creation, owner-scoped list/detail access, and
  Attachment validation, soft removal, and blocked download.
- `client && npm test`: **6 test files / 14 tests passed**. This includes
  field validation, safe API failure presentation, requester selection,
  Ticket list states, read-only detail, Attachment controls, and Zen Green
  form conventions.
- `client && npm run test:e2e`: **3 Playwright tests passed**. The flows cover
  requester create → search → owned detail, cross-owner protection plus
  Attachment removal, and responsive use at desktop, tablet, and mobile.
- `server && npm run build` and `client && npm run build`: both passed.

The report reproduces this final verification output and links each test area
to the planned file paths above; it is not based only on an earlier phase run.

## 7. Known Limitations or Deferred Tests

Real authentication, IT Staff workflow, comments, lifecycle changes after `NEW`,
and administration are intentionally deferred because they are outside Lab 2.
