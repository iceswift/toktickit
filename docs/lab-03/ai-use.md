# Lab 3 AI Use and Reflection

## Tool and Responsibility

OpenAI Codex with GPT Sol6.0 and Sol6.1 supported requirement interpretation, phase planning, implementation, test execution, workflow checks and evidence review. The student confirmed these model names on 3 October 2026. The specification-agent role organized requirements and acceptance criteria; the coding-agent role implemented changes and ran checks. These are assistant workflow roles, not independent human reviewers. The student supplied the assignment, requested checks, questioned incomplete results and authorized the work. Some implementation and documentation were delegated to AI; this report does not claim that the student personally wrote or verified every change. Human peers separately reviewed and merged the PRs.

## Selected Prompts: Analysis, Planning and Review Support

The nine examples below are actual user messages selected to show how AI assisted with interpretation, planning, progress assessment and review. They are not the complete conversation or a claim that AI only advised. All prompts are presented in English; messages originally written in Thai have been translated, while the originally English instruction is verbatim. The support column describes the purpose of the request, not a verbatim AI response or proof that the student performed a check themselves. Original implementation instructions and execution remain part of the disclosed AI contribution.

| # | Actual selected prompt | How AI supported the work |
|---|---|---|
| 1 | "These are the Lab 3 details. Before starting, reread the Lab document and GitHub-use guide, then plan the project phases. Think mainly in English and answer in Thai. Capture evidence and update the report throughout." | Interpret the handout and connect requirements, phase dependencies, GitHub workflow and evidence planning. |
| 2 | "Can you plan to inspect and redo the Lab 3 submission documents?" | Organize a report audit against the nine required answer Parts instead of relying on page count. |
| 3 | "Have you read the GitHub-use file?" | Recheck reviewer-merge rules, review replies and actual PR-to-Issue links. |
| 4 | "How much needs to be corrected now?" | Assess remaining gaps and explain the scope of corrections before proceeding. |
| 5 | "Are there still any PRs that need to be opened?" | Clarify which review/integration gates remained, distinguishing product work from documentation updates. |
| 6 | "I want a report-submission roadmap; I do not even know when it will finish although the assignment seems fixed." | Break completion into released-main verification, evidence reconciliation, report preparation and final PDF checks. |
| 7 | "When will Lab 3 be finished and the report ready to submit?" | Explain readiness and outstanding work rather than treating an approval or passing test count as final submission completion. |
| 8 | "Let's do step1" | Authorize the first verification step in the report roadmap. AI executed checks; this is not represented as student-executed testing. |
| 9 | "Please provide all the details in English so another AI can take over from here, because the new chat can access the in-app browser." | Prepare a handover that preserves context, verified status and unresolved browser/workflow tasks. |

## My Reflection

AI helped organize a long handout into requirements, a role matrix and a practical roadmap, and also implemented changes and executed tests. The useful lesson for me is to ask for evidence and an explanation of remaining gaps, not accept a completion statement. Audits exposed missing Requester communication, incomplete seed examples, an Administrator priority mismatch, an account-switch edit bug and missing role badges. The account-switch and role-badge regressions failed before their fixes; human reviewers then approved and merged the corrections. Released main `b65714d` passed server 42/42, client 33/33, E2E 9/9 and both builds. These results are valuable checks, but they do not prove every planned test or UI requirement is complete. I remain responsible for reviewing the submitted evidence and understanding the limitations. Next time, I would connect each requirement to a test and screenshot as work proceeds, and respond to review feedback before merge. Late replies and repaired Issue links are disclosed rather than presented as timely compliance.

Model names are student-confirmed; the model assigned to each historical instruction is not recorded and is not invented. My Reflection is an assistant-drafted account of the verified workflow and still needs the student's final read-through to ensure it represents their own learning. Technical requirement analysis and test-design decisions in the repository are assistant work, not invented verbatim user prompts.

Traceability: Richyboy170 reviewer-merged role-badge correction #62; jarbbie approved and merged release #63. Historical release #60 had 29 client tests, not the latest 33. Report layout has been inspected separately; personal reflection confirmation and documentation integration are still pending. No model assignment per prompt or personal confirmation is invented.
