# Lab 3 Evidence Matrix

This matrix maps the original Phase 8 coverage and the latest 3 October product checkpoint. The Phase 8 status column below is historical, not the latest release state. Released main `b65714d` (#63) has passed server 42/42, client 33/33, E2E 9/9 and both builds, with seven migrations applied. Major-screen responsive images were regenerated on that source; supplemental Requester badge/logout captures and direct API assertions carry the release63 prefix. Older screenshots keep their actual provenance, not relabelled as new evidence. The 4 October document-only audit, actual pagination Page 1/Page 2 captures, closed-product Kanban views, qualified completed visual checklist and 75-page PDF inspection are recorded in report-audit.md. Issue #64 remains open for peer integration; the filtered board is not proof that the report task is Done.

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
| AC-10 | Latest main server 42/42; client 33/33; E2E 9/9; both builds; 15 responsive captures and overflow assertions; RoleBadge regression | Part 9 source plus supplemental Requester badge images | Automated checks passed; final visual checklist and PDF QA are separate gates |
