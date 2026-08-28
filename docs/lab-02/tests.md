# Lab 2 Test Plan and Results

## 1. Test Strategy

Tests are planned from the approved specification before implementation. Unit,
API, UI component, UI style, responsive/visual, and E2E tests collectively cover
every Acceptance Criterion. Tests will be written failing where practical, then
implemented and refactored until green.

## 2. Planned Tests

| ID | Type | AC | What it tests | Expected result | Planned file | Final |
|---|---|---|---|---|---|---|
| UNIT-01 | Unit | AC-03 | Ticket Number generator | Required format; collision retry | `server/tests/lab-02/ticket-number.test.ts` | Pending |
| API-01 | API | AC-01 | Active Requester list | Active only; inactive excluded | `server/tests/lab-02/development-requesters.api.test.ts` | Pass |
| API-02 | API | AC-03, AC-04 | Valid/invalid Ticket creation | 201 or field-level 400; persisted ownership | `server/tests/lab-02/create-ticket.api.test.ts` | Pending |
| API-03 | API | AC-05 | Create/reference failure safety | Safe error; no false success | `server/tests/lab-02/create-ticket.api.test.ts` | Pending |
| API-04 | API | AC-06 | Owned list query | Search/filter/sort/page metadata only for owner | `server/tests/lab-02/my-tickets.api.test.ts` | Pending |
| API-05 | API | AC-07, AC-08 | Detail ownership | Owner gets 200; other requester gets 404 | `server/tests/lab-02/ticket-detail.api.test.ts` | Pending |
| API-06 | API | AC-09, AC-10 | Attachment lifecycle | Limits, upload, soft removal, blocked download | `server/tests/lab-02/attachments.api.test.ts` | Pending |
| UI-01 | UI | AC-01, AC-02 | Requester selector states | Loading, active options, empty/failure, guard | `client/tests/lab-02/DevelopmentRequester.test.tsx` | Pass |
| UI-02 | UI | AC-03, AC-04, AC-05 | Create Ticket states | Validation, busy, success number, retained error form | `client/tests/lab-02/CreateTicket.test.tsx` | Pending |
| UI-03 | UI | AC-06 | My Tickets states | Search/filter/sort/page, empty/no-results/failure | `client/tests/lab-02/MyTickets.test.tsx` | Pending |
| UI-04 | UI | AC-08, AC-10 | Detail/attachment states | Read-only fields, removal reason, removed display | `client/tests/lab-02/RequesterTicketDetail.test.tsx` | Pending |
| STYLE-01 | UI style | AC-04, AC-11 | Required labels/states/classes | Required marker, field message, busy/disabled state | `client/tests/lab-02/ZenGreenStyle.test.tsx` | Pending |
| RESP-01 | Responsive | AC-11 | Three viewport layouts | No overflow/clipping; usable controls | `e2e/lab-02/responsive.spec.ts` | Pending |
| E2E-01 | E2E | AC-01, AC-03, AC-06, AC-08 | Requester creates then finds/opens Ticket | Official number persists for correct owner | `e2e/lab-02/requester-ticket-flow.spec.ts` | Pending |
| E2E-02 | E2E | AC-07, AC-09, AC-10 | Multi-requester and Attachment lifecycle | Cross-owner access blocked; removal blocks download | `e2e/lab-02/requester-ticket-flow.spec.ts` | Pending |

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
| AC-10 | API-06, UI-04, E2E-02 |
| AC-11 | STYLE-01, RESP-01 |
| AC-12 | All planned automated tests |

## 4. Responsive and Visual Checklist

At desktop, tablet, and mobile sizes verify Zen Green tokens, readable labels,
editable/read-only distinction, field-level validation, busy/disabled buttons,
focus indicators, header/navigation, filters, pagination, attachment controls,
empty/no-results states, no clipping, no overlap, and no horizontal page overflow.

## 5. Test Commands

Final commands will be confirmed against the implemented toolchain:

```bash
cd server && npm test
cd client && npm test
cd client && npm run build
cd server && npm run build
# Phase 7 adds the documented Playwright E2E command.
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

## 7. Known Limitations or Deferred Tests

Real authentication, IT Staff workflow, comments, lifecycle changes after `NEW`,
and administration are intentionally deferred because they are outside Lab 2.
