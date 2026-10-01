# Lab 3 post-release audit corrections

## Baseline and scope

The audit started from released `main` commit `c9567a59e183f44cc0f5abea61f7db2097ae5be4` (PR #54, reviewed and merged by Richyboy170). The baseline server 38 tests, client 26 tests, eight E2E scenarios and both builds passed on an isolated PostgreSQL database. Passing those tests did not establish every labsheet requirement.

This correction branch addresses two verified gaps without changing the approved authorization matrix or adding a schema migration:

1. Labsheet section 5.3 requires realistic Ticket, Public Comment and Internal Note seed data. A fresh baseline database had 10 users but zero records of those three kinds.
2. The specification authorization matrix and BR-11 permit Administrators to change IT Priority; the backend already permits it, but the frontend disabled it with the Staff-only flag.

## Acceptance criteria

- Eight stable synthetic Tickets cover all required statuses, four active Requesters, all Requested Priority values, and assigned/unassigned ownership.
- Each example includes a safe Public Comment and Internal Note authored by a seeded IT Staff User.
- A repeat seed does not duplicate Tickets or the example communication and does not overwrite existing Ticket workflow changes or credentials.
- Admin can change IT Priority while Requested Priority remains immutable.
- Admin still cannot claim/reassign, change status or create Public Comments/Internal Notes. Requesters remain forbidden from staff APIs.
- Last-active-Administrator demotion is explicitly covered by a negative test, separately from self-deactivation.
- API, UI, build and E2E results are captured from this branch, and must be rerun from final main after reviewer merges the correction and release PRs.

## Implementation and verification map

| Requirement | Implementation | Added verification |
|---|---|---|
| Realistic, repeat-safe examples | `server/prisma/seed-ticket-examples.ts`, invoked by `seed.ts` | `server/tests/lab-03/seed-ticket-examples.api.test.ts` |
| Admin IT Priority UI and restricted staff controls | `client/src/StaffTicketDetail.tsx` | `client/tests/lab-03/StaffTicketDetail.test.tsx` |
| Admin API priority permission without extra workflow writes | Existing `server/src/app.ts` routes retained | `server/tests/lab-03/staff-ticket-detail.api.test.ts` |
| Last active Admin safety | Existing backend safety retained | `server/tests/lab-03/users-admin.api.test.ts` |

## Local data safety

Tests use a separate audit container on port 55434, not the original development database. All example identities use `example.test`. Initial passwords are the already documented local-only fixtures; no real passwords are added. Stable Ticket numbers use `TKT-20260901-DEMO0001` through `DEMO0008`. Reseeding preserves worked Ticket fields with `upsert(update: {})` and checks the existing example comment/note before inserting. These are demonstration records, not fabricated historical user activity.

## Workflow and submission gate

Tracked by [Issue #55](https://github.com/iceswift/toktickit/issues/55). Correction verification passed: server 42/42 (16 files), client 27/27 (10 files), browser 9/9, and both builds. On the separate fresh seed-check database, two seed runs produced exactly 10 Users, 8 Tickets, 8 Public Comments and 8 Internal Notes. The real-browser Administrator priority screenshot is `artifacts/lab-03/final-audit/admin-priority-correction.png`.

API and E2E checks were rerun sequentially after an initial concurrent execution interfered with a shared login fixture. The failed run was retained locally; it is not represented as a passing result.

The correction PR must be linked to its Issue, reviewed and merged into lab3-staging by the peer reviewer. A subsequent release PR must be reviewed and merged into main by the reviewer. Screenshots captured before those merges must be labelled correction-branch evidence, not final-main evidence. The report/PDF is not submission-ready until remaining evidence, exact AI model name, final Kanban and final-main rerun are verified.
