# Lab 2 AI Use and Reflection

## Tool and Responsibility

I used OpenAI Codex (a GPT-5.6 coding model) as an engineering assistant for
analysis, drafting, implementation support, and test design. I remained
responsible for checking the requirements, choosing the final rules, reviewing
every changed file, running the commands, and deciding whether the evidence was
sufficient. AI output was treated as a draft or a hypothesis, not as proof that
the work was correct.

## Selected Prompts

| # | Selected prompt | How I used and checked the result |
|---|---|---|
| 1 | `Read the Lab 2 handout and workflow guide. List the required deliverables, dependencies, and exclusions before editing files.` | I compared the proposed phase plan with the handout and used the eight phases as the Issue decomposition. |
| 2 | `Read specification.md, tests.md, ui-spec.md, and api-spec.md. Identify ambiguities or conflicts before implementing Phase 2.` | I checked that the temporary Requester selector was clearly not authentication and that the contracts agreed on ownership behavior. |
| 3 | `Design the Prisma models, constraints, indexes, migration, and idempotent seed data needed for Requesters, Tickets, Related Systems, and Attachments.` | I reviewed the Prisma schema and reran the seed to confirm that it did not create duplicates. |
| 4 | `Write planned API tests for Ticket creation and ownership before implementing the endpoint. Explain which acceptance criteria they prove.` | I inspected the tests, ran them against PostgreSQL, and checked the returned Ticket Number and requester ownership. |
| 5 | `Implement only the Create Ticket increment from the approved contract. Preserve field-level validation and do not add authentication or Staff workflow.` | I reviewed the changed frontend and backend files and checked validation, success, and safe failure behavior manually. |
| 6 | `Audit the My Tickets design against the UI specification: search, filters, sorting, pagination, empty/no-results states, mobile cards, and owner scope.` | I checked the rendered UI and automated component/API tests rather than accepting the audit text alone. |
| 7 | `Review the Attachment lifecycle against the fixed file rules, safe error responses, and soft-removal requirement. List missing boundary tests.` | I added and ran tests for permitted files, content/type mismatch, oversized files, maximum active files, cross-owner access, removal, and blocked download. |
| 8 | `Create Playwright checks for the Requester happy path, cross-owner protection, and desktop/tablet/mobile My Tickets layouts. Do not claim success until they pass.` | I fixed selectors against the actual UI, reran the suite, and retained the generated responsive screenshots as evidence. |
| 9 | `Audit the completed increment against all acceptance criteria and report missing evidence without changing scope.` | I used the audit as a checklist, then verified the test counts, review status, documentation, and GitHub workflow myself. |

## My Reflection

AI helped me turn a long lab handout into smaller engineering tasks and made it
faster to draft tests and documentation. Its first drafts were not always exact:
some Playwright selectors and assumptions about the visible UI had to be
corrected after real test runs. The useful workflow was to ask for a narrow
proposal, compare it with the specification, run the software, inspect the
output, and revise. This kept the final decisions and evidence under my own
review instead of relying on autocomplete or an unverified “done” claim.
