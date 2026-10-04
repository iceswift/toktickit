# Lab 3 AI Use and Reflection

## Tool and Responsibility

OpenAI Codex with GPT Sol6.0 and Sol6.1 was used for specification analysis, implementation support, test design, and report auditing. The student confirmed these model names on 3 October 2026. The specification-agent role extracted requirements and decisions; the coding-agent role implemented and checked them. These are workflow roles, not a claim of independent peer review. The student remains responsible for the submitted product and evidence.

## Selected User Prompts and Recorded Follow-up

These nine instructions are selected from the student's actual chat messages, not reconstructed technical prompts. Originally Thai messages are presented as labelled English translations; the short English messages are verbatim. Step numbers refer to the report-completion roadmap in that conversation. Follow-up describes the assistant's recorded work, not proof that the student personally performed each check.

| # | Selected user prompt | Recorded role / follow-up |
|---|---|---|
| 1 | English translation: "These are the Lab 3 details. Before starting, reread the Lab document and GitHub-use guide, then plan the project phases. Think mainly in English and answer in Thai. Capture evidence and update the report throughout." | Specification-agent framing: requirements, workflow and evidence-first planning. |
| 2 | "Let's do Phase 1" | Authorization to begin the engineering-contract/setup phase, before feature implementation. |
| 3 | English translation: "Can you plan to inspect and redo the Lab 3 submission documents?" | Specification/report audit: compared deliverables with the nine required Parts. |
| 4 | English translation: "Have you read the GitHub-use file?" | Workflow check: reviewer merge, actual PR/Issue links and replies, including disclosed late repairs. |
| 5 | English translation: "I want a report-submission roadmap; I do not even know when it will finish although the assignment seems fixed." | Finite release/main verification, workflow, report-content, layout and PDF-QA gates. |
| 6 | "Let's do step1" | Executable released-main verification. Later correction checkpoints were rerun rather than relabelled from older branches. |
| 7 | "Let's do step 2" | Final Kanban/review-link/comment-response evidence reconciliation. |
| 8 | "Let's do step3" | Report content/AI-use reconciliation, source-contract comparison and evidence gap checks. |
| 9 | "Let's continue" | Coding/audit follow-through: the role-badge correction required a regression, reviewer-approved feature/release PRs and fresh main checks. |

## My Reflection

The specification-agent role helped turn the handout into numbered requirements and a role matrix; the coding-agent role helped implement and test those decisions. The important lesson was that an AI completion claim and a green test count are not enough. Contract comparison exposed missing Requester Public Comments and a non-final resolution indication, while browser checks exposed mobile overflow. Later audits found missing seed examples, an Administrator priority-permission mismatch, and an account-switch edit bug. The account-switch regression failed before its fix, providing an observable reason for correction. Peer review and released-main reruns then checked the corrections: PR #59 integrated into staging, PR #60 into main, and final source passed server 42/42, client 29/29 and E2E 9/9. For the next lab, I would map evidence as each requirement is completed and reply to review summaries before merge. Late acknowledgements and repaired Issue links are disclosed rather than presented as timely workflow compliance.

Model names are student-confirmed; the model assigned to each historical instruction is not recorded and is not invented. My Reflection is an assistant-drafted account of the verified workflow and still needs the student's final read-through to ensure it represents their own learning. Technical requirement analysis and test-design decisions in the repository are assistant work, not invented verbatim user prompts.

Latest verified checkpoint: the subsequent Section 7 role-badge audit found a presentation requirement not covered by the then-passing suite. The new desktop/mobile user-list regression failed before its fix. Richyboy170 reviewer-merged correction #62; jarbbie approved and merged release #63. On released main `b65714d`, server 42/42, client 33/33, E2E 9/9 and both builds passed. This reinforces the need to compare the product with the handout, not infer complete requirements from green tests. Report layout and every-page PDF QA remain separate work.
