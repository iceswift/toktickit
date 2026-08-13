# Lab 1 - AI Use and Reflection

**Student:** Suwiwat Sinsomboon (67070503444)
**AI assistant:** OpenAI Codex (GPT-5)

## How AI was used

I used AI as an engineering assistant for requirements analysis, implementation suggestions, test execution, code review, and documentation. I directed the order and scope of each task, decided when each phase could proceed, reviewed the proposed changes, coordinated the GitHub peer-review workflow, and verified the final behavior locally.

The AI did not replace my responsibility for the work. I checked its conclusions against the Lab Sheet, reviewed GitHub state and screenshots, ran the required commands, investigated failures, and corrected suggestions that did not match the current Issue.

## Selected key prompts

The prompts below are English translations that have been lightly condensed from the working conversation. Their original intent, constraints, and decision points are preserved.

| # | Prompt name | Prompt used | My role and verification |
|---|-------------|-------------|--------------------------|
| 1 | Requirements analysis | Read the provided Lab 1 documents and starter scaffold first. Summarize the required phases, dependencies, tests, Git workflow, and submission evidence. Do not change files yet. | I compared the summary with the Lab Sheet and decided the implementation order before allowing repository changes. |
| 2 | Project foundation | Work only on Issue 1 using `feature/1-project-foundation`. Set up the required React, Express, Prisma, PostgreSQL, and test structure, but do not implement later Issues. Show the verification results for me to review. | I checked the repository structure, configuration, ignored files, README, local services, and Phase 1 evidence before opening the PR. |
| 3 | API health check | Before implementing Issue 2, compare the task with its acceptance criteria. Add the health endpoint and frontend status call, then run the relevant tests and builds. Keep Issue 3 and Issue 4 out of scope. | I reviewed the endpoint response, browser result, test output, and peer approval before continuing. |
| 4 | Category database | Implement the Issue 3 Prisma Category model, migration, and idempotent seed only after the previous dependency is ready. Verify that seeding twice still leaves exactly four distinct categories. | I checked the database rows in Prisma Studio, confirmed the seed command and result, and answered the reviewer's question before merge. |
| 5 | Final vertical slice | Implement Issue 4 on `feature/4-category-list`: load categories through Express and Prisma, display API-provided data in React, and cover loading, success, and error states with tests. | I reviewed the working application, API response, automated tests, build output, evidence images, and final peer approval. |
| 6 | Partner PR review | Review the partner's PR only against the acceptance criteria of its current Issue. Inspect the changed files, run the branch locally, and provide evidence for any requested change. I will decide the final review outcome. | I coordinated collaborator access, checked the findings, discussed the scope with the partner, and ensured that the final GitHub action was a formal approval. |
| 7 | Recheck the remote branch | Fetch the partner's latest remote branch and check again. Do not rely on the earlier clone or test result. Compare the new commit, rerun tests/builds, and report whether the Issue criteria now pass. | This recheck found a newly pushed backend commit. I verified that the health test passed before approving the updated PR. |
| 8 | Final integrated verification | On the completed Lab 1 branch, start the required local services, seed the database, and run all server/client tests and builds. Report the exact failure before changing code so I can decide whether the cause is the application or the environment. | When the categories test initially returned HTTP 500, I checked Docker and PostgreSQL first. After starting the database and seeding it, I reran the same commands and verified that all tests and builds passed without an unnecessary code change. |

## Critical reflection

The most effective prompts gave the AI a narrow scope, named the current Issue or branch, and required evidence before the next action. This kept the four feature branches aligned with the dependency order and reduced the risk of implementing later requirements too early. Short instructions were sufficient only when the acceptance criteria and repository state were already present in the conversation; a reusable prompt should include the target branch, required behavior, tests, and stopping condition.

I did not accept AI output automatically. During the first review of a partner's Issue 1 PR, the AI treated the future Issue 2 health test as a blocker. I questioned the conclusion and returned to the Lab Sheet. The acceptance criteria showed that implementing `GET /api/health` belonged to Issue 2, so the earlier review was corrected and replaced with the appropriate approval. This demonstrated that test output must be interpreted within the scope of the current Issue.

A second example occurred during final verification. The categories test initially returned HTTP 500 because Docker Desktop and PostgreSQL were not running. Instead of changing working application code, I checked the environment, started the required database, seeded the four categories, and reran the tests. The verified result was 2/2 server tests and 4/4 client tests passing, with both builds successful.

Overall, AI accelerated repetitive inspection, implementation drafting, testing, and documentation, while I retained control over scope, GitHub actions, peer communication, verification, and final acceptance. The main lesson was to treat AI suggestions and terminal output as evidence to evaluate, not content to accept or submit without review.
