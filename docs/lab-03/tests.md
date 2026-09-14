# Lab 3 Test Plan and Traceability

This plan is written before implementation. Each Acceptance Criterion has planned unit, API, UI, authorization, regression, or E2E coverage. Actual test paths and outcomes are updated as each Phase PR completes.

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
| UI-01 | UI | AC-01/02 | Login and Change Password validation, busy, safe failure | `client/tests/lab-03/Login.test.tsx`, `ChangePassword.test.tsx` |
| UI-02 | UI | AC-05 | Queue controls and empty/no-results/failure states | `client/tests/lab-03/StaffTicketQueue.test.tsx` |
| UI-03 | UI | AC-06/07 | Staff detail modes, comments versus notes, state feedback | `client/tests/lab-03/StaffTicketDetail.test.tsx` |
| UI-04 | UI/security | AC-08 | User Management validation and forbidden presentation | `client/tests/lab-03/UserManagement.test.tsx` |
| VIS-01 | visual/responsive | AC-10 | all major screens at desktop/tablet/mobile; focus/overflow | `client/tests/lab-03/ZenGreenStyle.test.tsx` |
| E2E-01 | E2E | AC-01/02/03 | login, first password change, logout blocks direct access | `e2e/lab-03/authentication.spec.ts` |
| E2E-02 | E2E | AC-05/06/07 | Staff queue/detail happy path and privacy | `e2e/lab-03/staff-ticket-flow.spec.ts` |
| E2E-03 | E2E | AC-08 | Admin lifecycle and next-login password-change flow | `e2e/lab-03/user-administration.spec.ts` |

Final evidence records complete passing output for server, client, authorization, migration/regression, and E2E suites from `main`.
