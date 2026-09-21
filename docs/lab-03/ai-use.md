# Lab 3 AI Use and Reflection

## Tool and Responsibility

OpenAI Codex is used as an engineering assistant for analysis, drafting, implementation support, and test design. The student remains responsible for reading the Lab 3 sheet, selecting the final rules, reviewing every change, running commands, inspecting evidence, and rejecting unsupported output.

## Selected Prompts and Verification

| # | Prompt focus | Student verification |
|---|---|---|
| 1 | Extract Lab 3 deliverables, dependencies, and exclusions. | Compared the phase plan with the Lab 3 sheet. |
| 2 | Propose password, session, and logout decisions for the course stack. | Reviewed cookie, hashing, expiry, and secret-handling trade-offs. |
| 3 | Design the User/role migration without losing Lab 2 ownership. | Inspected the generated migration and passed migration/regression coverage against PostgreSQL. |
| 4 | Build an authorization matrix for all protected operations. | Compared each operation against the required roles. |
| 5 | Define a constrained Ticket status-transition matrix. | Checked that Requesters cannot formally resolve or close. |
| 6 | Plan IT Staff queue/detail tests and privacy boundaries. | Ran API, UI, and E2E coverage; also inspected the Staff Detail screenshot to confirm Internal Notes are visually distinguished. |
| 7 | Plan Administrator safety rules and negative tests. | Verified duplicate email, self-deactivation, last-Administrator protection, session revocation, and forced password change. |
| 8 | Audit evidence required for the nine report parts. | Captured 15 readable responsive screenshots and linked each retained figure to an exact requirement. |
| 9 | Audit Requester detail against FR-05 and AC-07 before release. | Found missing requester Public Comments and the non-final resolution indication; added API/UI behavior, migration, and regression tests. |
| 10 | Diagnose the mobile User Management overflow found by Playwright. | Used element-bound diagnostics to identify the wide table, replaced it with mobile cards below the medium breakpoint, and reran all viewports. |

## My Reflection

AI suggestions were treated as hypotheses, not proof. That distinction mattered in Phase 8: a checklist-only review would have missed two real gaps. Comparing the running product with FR-05/AC-07 exposed missing requester Public Comments and a missing non-final resolution indication. Running the responsive browser test then exposed a mobile table overflow that unit tests could not reveal. I accepted the proposed fixes only after reading the affected contract, inspecting the UI screenshots, and passing server, client, migration, build, and E2E checks. The remaining limitation is that these results are from the feature branch; the same suite must pass again on released `main` before the report calls them final evidence.
