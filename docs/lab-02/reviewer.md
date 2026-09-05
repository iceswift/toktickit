# Lab 2 Peer Review Record

## Participants

| Role | Identity |
|---|---|
| Author | Suwiwat Sinsomboon (`iceswift`) |
| Peer reviewer and merger | Patiharn Liangkobkit (`Richyboy170`) |

## Pull Request Evidence

Each implementation Issue was developed on its own feature branch and merged
into `lab2-staging` only after peer approval. The reviewer merged the approved
PRs.

| Phase | PR | Evidence recorded | Outcome |
|---|---|---|---|
| 1 - Engineering contract | [#13](https://github.com/iceswift/toktickit/pull/13) | Approval and merge | Approved and merged to `lab2-staging` |
| 2 - Requester context | [#15](https://github.com/iceswift/toktickit/pull/15) | Approval and merge | Approved and merged to `lab2-staging` |
| 3 - Create Ticket | [#17](https://github.com/iceswift/toktickit/pull/17) | Approval and merge | Approved and merged to `lab2-staging` |
| 4 - My Tickets | [#19](https://github.com/iceswift/toktickit/pull/19) | Approval and merge | Approved and merged to `lab2-staging` |
| 5 - Ticket Detail | [#21](https://github.com/iceswift/toktickit/pull/21) | Approval and merge | Approved and merged to `lab2-staging` |
| 6 - Attachments | [#23](https://github.com/iceswift/toktickit/pull/23) | Approval and merge | Approved and merged to `lab2-staging` |
| 7 - Quality assurance | [#25](https://github.com/iceswift/toktickit/pull/25) | Approval, review comment, and merge | Approved and merged to `lab2-staging` |
| 8 - Release | [#28](https://github.com/iceswift/toktickit/pull/28) | Approval and release merge | Approved and merged from `lab2-staging` to `main` |

## Review Conversation and Response

The author and reviewer treated review as a conversation, not only an approval.
For [PR #25](https://github.com/iceswift/toktickit/pull/25), the reviewer left a
review comment and the author replied in the same PR before the reviewer
approved and merged the change. The Phase 7 conversation confirmed the QA
coverage, responsive checks, screenshots, and verification notes. The reviewer
then approved and merged [release PR #28](https://github.com/iceswift/toktickit/pull/28)
from `lab2-staging` into `main`.

No unresolved review threads or requested changes remain in the merged PRs
above. The GitHub PR pages are the authoritative record of the exact comment,
reply, approval, and reviewer-performed merge actions.

## Review Checklist Used

- Compare the changed files with the Issue acceptance criteria and the approved
  engineering contract, rather than checking only whether the app starts.
- Verify that automated tests and production builds pass without skipped tests.
- Check requester ownership protection, Attachment soft removal, and safe
  failures as well as the happy path.
- Check the Zen Green desktop, tablet, and mobile evidence for clipping,
  overlap, and horizontal overflow.
- Approve only when the PR is understandable, scoped, and ready to merge.
