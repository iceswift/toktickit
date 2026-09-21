# Lab 3 Evidence Matrix

This matrix maps each Acceptance Criterion to executable and visual evidence. Phase 8 rows are verified on `feature/lab3-8-qa-release-readiness`; AC-10 remains provisional until the release phase repeats the full suite on `main`.

| AC | Executable evidence | Visual/document evidence | Phase 8 status |
|---|---|---|---|
| AC-01 | `server/tests/lab-03/auth.api.test.ts`; `client/tests/lab-03/Authentication.test.tsx`; `client/e2e/lab-03/authentication.spec.ts` | `login-desktop/tablet/mobile.png` | Pass |
| AC-02 | Authentication API/UI tests and first-login E2E | `change-password-desktop/tablet/mobile.png` | Pass |
| AC-03 | Logout/session-revocation API and authentication E2E | `docs/lab-03/tests.md` results | Pass |
| AC-04 | `server/tests/lab-03/requester-authorization.api.test.ts`; Lab 2 ownership E2E | Phase 4 authenticated requester figures in `report.html` | Pass |
| AC-05 | `server/tests/lab-03/staff-queue.api.test.ts`; `client/tests/lab-03/StaffTicketQueue.test.tsx` | `queue-desktop/tablet/mobile.png` | Pass |
| AC-06 | `server/tests/lab-03/staff-ticket-detail.api.test.ts`; `client/e2e/lab-03/staff-ticket-flow.spec.ts` | `staff-detail-desktop/tablet/mobile.png` | Pass |
| AC-07 | Staff detail tests plus requester Public Comment/resolution regression in `ticket-detail.api.test.ts` and `RequesterTicketDetail.test.tsx` | Staff Detail figure distinguishes Public Comments from private Internal Notes | Pass |
| AC-08 | `server/tests/lab-03/users-admin.api.test.ts`; `client/tests/lab-03/UserManagement.test.tsx`; admin E2E | `user-management-desktop/tablet/mobile.png` | Pass |
| AC-09 | `server/tests/lab-03/migration-regression.api.test.ts`; complete Lab 2 API/UI/E2E regression | Phase 4 requester figures; Prisma reports 7 migrations up to date | Pass |
| AC-10 | Server 38/38; client 26/26; E2E 8/8; both builds pass; 15 responsive screenshots pass overflow assertions | `docs/lab-03/report.html` Part 9 | Feature branch pass; final `main` rerun pending |
