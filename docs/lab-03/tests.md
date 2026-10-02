# Lab 3 Test Plan and Traceability

This plan was written before implementation. Each Acceptance Criterion has unit, API, UI, authorization, regression, or E2E coverage. Phase 8 reconciled the planned paths with the implemented suites and recorded the complete feature-branch result below.

## Final released-main verification - 2 October 2026

Source: `c551061806a9b4eeea3e51967afc8418f7c50ab1`, reviewer-merged Release PR #57. Server: 16 files, 42/42 tests. Client: 10 files, 27/27 tests. Browser: 9/9 E2E tests. Both production builds passed. Seven Prisma migrations applied, no pending migration. These results supersede the older branch checkpoints, not the planned-versus-implemented coverage limitations described below. The report embeds complete actual output, rather than treating a count alone as proof.

## Subsequent Issue #58 correction branch - not released main

The account-switch regression failed on the released UI: after selecting Ben, the Name field still held an unsaved Amina draft. Keying the edit form by `editing.id` makes the selected account's Name, Email, Role and Active state replace the previous account's fields. A second test verifies separate Requested/IT Priority badges and status badges in desktop and mobile Queue layouts. Complete client result: 29/29 (10 files), browser E2E 9/9, both builds passed. These corrections require peer integration/release and another final-main run; they are not included in the 27-test released-main result above.

| ID | Type | AC | Planned behavior | Planned file |
|---|---|---|---|---|
| UNIT-01 | unit | AC-01/06 | password policy, single-role guard, and allowed status-transition helper accept valid input and reject forbidden values | `server/tests/lab-03/auth-policy.test.ts` |
| API-01 | API | AC-01 | valid, invalid, inactive, and rate-limited login; safe session response with no account disclosure | `server/tests/lab-03/auth.api.test.ts` |
| API-02 | API | AC-02/03 | password change, logout, expired/revoked session | `server/tests/lab-03/auth.api.test.ts` |
| API-03 | API/security | AC-04 | forged requester ID, cross-owner Ticket/Attachment, note privacy | `server/tests/lab-03/authorization.api.test.ts` |
| API-04 | API | AC-05 | queue search/filter/sort/page and invalid query | `server/tests/lab-03/staff-queue.api.test.ts` |
| API-05 | API | AC-06 | claim/reassign, IT Priority, legal/illegal status transitions | `server/tests/lab-03/staff-ticket-detail.api.test.ts` |
| API-06 | API/security | AC-07 | Public Comment visibility; Internal Note role denial | `server/tests/lab-03/comments-notes.api.test.ts` |
| API-06a | API/security | AC-07 | blank/overlength Comment and Note rejection; escaped plain-text rendering contract | `server/tests/lab-03/comments-notes.api.test.ts` |
| API-07 | API | AC-08 | User list/create/edit, duplicate email, self/last-Admin safeguards | `server/tests/lab-03/users-admin.api.test.ts` |
| API-08 | migration/regression | AC-09 | Lab 2 Requester/Ticket/Attachment records survive migration | `server/tests/lab-03/migration-regression.api.test.ts` |
| UI-01 | UI | AC-01/02 | Login and Change Password validation, busy, safe failure | `client/tests/lab-03/Authentication.test.tsx` |
| UI-02 | UI | AC-05 | Queue controls and empty/no-results/failure states | `client/tests/lab-03/StaffTicketQueue.test.tsx` |
| UI-03 | UI | AC-06/07 | Staff detail modes, comments versus notes, state feedback | `client/tests/lab-03/StaffTicketDetail.test.tsx` |
| UI-04 | UI/security | AC-08 | User Management validation and forbidden presentation | `client/tests/lab-03/UserManagement.test.tsx` |
| VIS-01 | visual/responsive | AC-10 | Login, Change Password, Queue, Staff Detail, and User Management at desktop/tablet/mobile with document-overflow assertions | `client/e2e/lab-03/responsive.spec.ts` |
| E2E-01 | E2E | AC-01/02/03 | login, first password change, logout blocks direct access | `e2e/lab-03/authentication.spec.ts` |
| E2E-02 | E2E | AC-05/06/07 | Staff queue/detail happy path and privacy | `e2e/lab-03/staff-ticket-flow.spec.ts` |
| E2E-03 | E2E | AC-08 | Admin lifecycle and next-login password-change flow | `e2e/lab-03/user-administration.spec.ts` |
| REG-01 | API/UI regression | AC-07/09 | Requester Public Comments remain public-only and the non-final “problem appears resolved” indication never changes formal status | `server/tests/lab-02/ticket-detail.api.test.ts`, `client/tests/lab-02/RequesterTicketDetail.test.tsx` |

## Phase 8 Feature-Branch Verification

- Server: 15 files, 38/38 tests passed.
- Client: 10 files, 26/26 tests passed.
- Browser E2E: 8/8 tests passed, including all Lab 2 regressions and four Lab 3 scenarios.
- Production builds: server and client passed.
- Database: all 7 Prisma migrations applied; schema is up to date.
- Responsive evidence: 15 screenshots (5 screens × 3 viewports) captured under `artifacts/lab-03/screenshots/phase-08-qa/` after the overflow assertion passed.

These are Phase 8 feature-branch results. The release phase must rerun the complete checks from released `main` before they are labelled final evidence.

## Released baseline audit and post-release correction

Released main `c9567a5` was rerun on 2026-10-01: server 38/38, client 26/26, E2E 8/8 and both builds passed. The audit nevertheless found missing realistic seed data and an Administrator priority UI/contract mismatch; the existing suite did not cover those gaps.

Issue #55 tracks the corrections on `feature/lab3-final-audit-fixes`. Correction-branch verification: server 16 files/42 tests, client 10 files/27 tests, and browser 9 scenarios passed; both builds passed. Raw server and E2E outputs are retained under `artifacts/lab-03/final-audit/`. API and E2E suites must run sequentially when they share this local database: both modify the same fixture accounts. A concurrent run failed a login gate check; the sequential rerun passed all eight original cases, and the expanded nine-case run also passed.

| Planned item | Actual implementation/verification path | Scope note |
|---|---|---|
| API-03 | `server/tests/lab-03/requester-authorization.api.test.ts` | Includes forged identity, wrong role, cross-owner and migrated ownership checks |
| API-06 / API-06a | `server/tests/lab-03/staff-ticket-detail.api.test.ts`, `server/tests/lab-02/ticket-detail.api.test.ts` | Communication visibility and blank/overlength rejection; not a separate comments-notes file |
| E2E-01 | `client/e2e/lab-03/authentication.spec.ts` | Actual path includes client/ |
| E2E-02 | `client/e2e/lab-03/staff-ticket-flow.spec.ts` | Staff operational workflow |
| E2E-03 | `client/e2e/lab-03/user-administration.spec.ts` | Account lifecycle plus new real-browser Admin priority scenario |
| Seed completeness / AC-09 | `server/tests/lab-03/seed-ticket-examples.api.test.ts` | Eight examples, ownership, repeat-safety and preservation |
| Admin priority / AC-06 | `server/tests/lab-03/staff-ticket-detail.api.test.ts`, `client/tests/lab-03/StaffTicketDetail.test.tsx` | Priority allowed; Staff-only writes remain forbidden |
| Last active Admin / AC-08 | `server/tests/lab-03/users-admin.api.test.ts` | Explicit final-Admin demotion rejection in addition to self-deactivation |

The original planning table remains historical. A mapped test file does not by itself prove every planned subcase: UNIT-01's separate helper file was not created, and dedicated rate-limit/expiry coverage still needs a traceability check. No such unverified subcase is labelled passing here. Correction results are not final-main results until peer-reviewed integration and release are complete.
