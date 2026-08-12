# Lab 1 — Peer Review Record

**Author:** Suwiwat Sinsomboon — <student id> — GitHub: @iceswift
**Peer reviewer:** <partner name> — <student id> — GitHub: [@SupeemAFK](https://github.com/SupeemAFK)

## Pull Requests I authored (reviewed by my partner)
| PR | Branch | Reviewer verdict |
|----|--------|------------------|
| [#5](https://github.com/iceswift/toktickit/pull/5) | feature/1-project-foundation | Approved by @SupeemAFK |
| [#6](https://github.com/iceswift/toktickit/pull/6) | feature/2-health-check | Approved by @SupeemAFK |
| [#7](https://github.com/iceswift/toktickit/pull/7) | feature/3-category-seed | Approved by @SupeemAFK |
| [#8](https://github.com/iceswift/toktickit/pull/8) | feature/4-category-list | Approved by @SupeemAFK |

Reviewer comment I received: SupeemAFK cloned and tested the project foundation, confirmed the frontend and backend builds, Vite and Express responses, PostgreSQL and Prisma checks, ignored files, and concluded, "Good works LGTM."

How I responded: I thanked the reviewer, confirmed that the evidence was recorded in this document, and stated that I would wait for formal approval before merging.

![PR #5 peer review comment and author response](evidence/pr-5-peer-review.png)

Formal approval was submitted by SupeemAFK before the pull request was merged.

![PR #5 formal approval](evidence/pr-5-formal-approval.png)

### PR #6 - API health check

SupeemAFK confirmed that the health API was implemented correctly in both the client and server and that all tests passed, concluding with "LGTM."

How I responded: I thanked the reviewer for checking the implementation and test results and confirmed that the evidence was recorded in this document.

![PR #6 peer review comment and author response](evidence/pr-6-peer-review.png)

The reviewer then submitted a formal approval. GitHub recorded one approving review from a reviewer with write access.

![PR #6 formal approval](evidence/pr-6-formal-approval.png)

### PR #7 - Category model and seed

SupeemAFK asked which command was used to run the category seed.

How I responded: I explained that I ran `npm run prisma:seed` from the `server` directory twice, and then verified that the database still contained four rows with four distinct category names.

![PR #7 reviewer question and author response](evidence/pr-7-peer-review.jpg)

SupeemAFK later confirmed that the schema and seed were valid, concluding with "LGTM," and submitted a formal approval. GitHub recorded one approving review from a reviewer with write access.

![PR #7 formal approval](evidence/pr-7-formal-approval.jpg)

### PR #8 - Display category list

SupeemAFK reviewed the category-list implementation, test results, and working-application evidence. The reviewer confirmed that the code looked good and the tests passed, concluding with "LGTM."

How I responded: I thanked the reviewer for checking the implementation and evidence and confirmed that the feedback and approval were recorded in the Lab 1 peer-review documentation.

![PR #8 peer review comment and author response](evidence/pr-8-peer-review.jpg)

SupeemAFK then submitted a formal approval. GitHub recorded one approving review from a reviewer with write access, and the PR had no conflicts with `lab1-staging`.

![PR #8 formal approval](evidence/pr-8-formal-approval.jpg)

## Pull Requests I reviewed for my partner

### MeldyRose PR #6 - Project foundation

Reviewed PR: [MeldyRose/TockTickIT-Individual-Sprints#6](https://github.com/MeldyRose/TockTickIT-Individual-Sprints/pull/6)

Review verdict: Approved after revisions.

My initial review: I cloned `feature/1-project-foundation` and verified it locally. The client tests and build ran, and the server TypeScript build passed. I requested a tracked `server/.env.example` and complete setup instructions in the README before approval.

![Changes requested on MeldyRose PR #6](evidence/partner-pr-6-request-changes.jpg)

Partner's response: MeldyRose added the requested environment-file template and expanded the README, then replied on the PR and requested another review.

Final review: After checking the new commits and clarifying that implementation of the health endpoint belongs to Issue 2, I approved the project-foundation PR. GitHub recorded one approving review from a reviewer with write access.

![Formal approval of MeldyRose PR #6](evidence/partner-pr-6-formal-approval.jpg)

### MeldyRose PR #7 - API health check

Reviewed PR: [MeldyRose/TokTickIT-Individual-Sprints#7](https://github.com/MeldyRose/TokTickIT-Individual-Sprints/pull/7)

Review verdict: Approved after one revision.

My initial review: I fetched `feature/2-health-check` and tested both applications. The client called the health API and handled Online/Offline states, but the server endpoint still returned HTTP 501, causing the health Supertest to fail. I requested implementation of the Issue 2 endpoint before approval.

![Changes requested on MeldyRose PR #7](evidence/partner-pr-7-request-changes.jpg)

Partner's revision: MeldyRose pushed commit `43b5272`, implementing `GET /api/health` with HTTP 200 and the required JSON response.

Final review: I fetched the new commit and reran the test and build commands. The server health Supertest and client test passed, and both builds succeeded. I then formally approved the PR as a collaborator with write access.

![Formal approval of MeldyRose PR #7](evidence/partner-pr-7-formal-approval.jpg)
