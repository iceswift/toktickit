# Report evidence reconciliation - 4 October 2026

Product source: released main `b65714ddd4cb733d4ad80983707d50ff618a0a1f` (#63), reviewer-approved and reviewer-merged by jarbbie. This audit/report revision is local and has not been integrated through a documentation PR. It is not a submission-readiness certificate.

## Evidence mapped to the nine required Parts

| Part | Evidence incorporated | Qualification |
|---|---|---|
| 1 | Complete Lab 3 commit graph excluding the Lab 2 baseline; current Done 23/empty work columns; historical overlapping Done cards; rendered reviewer record, technical feedback/reply, README, .gitignore and tree | Current capture and historical checkpoints are labelled separately; late replies/link repairs are not backdated. |
| 2 | Rendered numbered specification, authorization rules, migration, AC/DoD and pre-implementation commit evidence; working GitHub source link | Local reconciled source differs from the published version until documentation integration. |
| 3 | Rendered plan/AC/actual-path traceability and complete current-main server 42, client 33, E2E 9, build/migration and actual direct API output | A planned standalone helper unit file was not created; API/UI coverage and historical standalone expiry/rate assertions are explicitly distinguished. |
| 4 | Rendered AI-use document with student-confirmed Sol6.0/Sol6.1 and nine actual user instructions; brief reflection | Originally English instructions versus labelled Thai-to-English translations are distinguished. Assistant follow-up is not attributed to student verification. Reflection needs the student's personal read-through. |
| 5 | Real invalid/inactive login, controlled delayed/failed login, reset first-login gate, current user/role, logout and actual protected-access 401 | Added real password-confirmation mismatch without changing the account password. Controlled UI faults are labelled. |
| 6 | Realistic queue/search/filter/sort/page/assigned-unassigned/action plus empty/no-results/failure and current badges/responsive set | Empty/failure examples are explicitly injected UI responses, not database claims. |
| 7 | Claim/reassign/IT Priority/status/Public Comments/private Notes, actual invalid transition, Requester non-final resolution and direct API authorization | Added current-main Staff attachment metadata and actual upload/download/removal/blocked-download assertions. Older unchanged-operation figures retain historical provenance. |
| 8 | Users/search/filter/create/duplicate/safety/reset-next-login, wrong-role API denial, responsive images | Added real invalid-password rejection and before/after edits to all four fields; database read-back verified name/email/role/inactive. Page-level alert inaccurately refers to highlighted fields; no field highlighting is implemented. |
| 9 | Rendered UI contract plus all 15 five-screen/three-viewport captures; completed qualified checklist | Actual keyboard-focus example added. Native Sort select truncates its selected text at tablet width; full WCAG/contrast compliance is not claimed. |

## Additional capture provenance and cleanup

The 4 October supplemental UI captures followed the recorded 3 October unchanged-main suites; they do not add to the 42/33/9 counts. Three synthetic demo accounts' mandatory-password flags were temporarily cleared only for normal-screen evidence and then restored to true. No existing password hash was changed.

Invalid creation of `validation.evidence@example.test` was rejected (zero matching database rows). A subsequent permitted creation was used only to demonstrate changing Name, Email, Role and Active. Read-back showed `Edited Evidence User`, `edited.evidence@example.test`, `IT_STAFF`, inactive. Only that newly created temporary account was deleted afterward.

The attachment demonstration uploaded the supplied course handout as `lab3-attachment-demo.pdf` to synthetic Ticket `TKT-20260901-DEMO0001`. Staff detail retained the same attachment ID/filename. Owner download returned 200; soft removal returned 204; subsequent download returned 404. The soft-removal record remains auditable. No real customer/private file was used.

## Finite remaining gates

1. Layout inspection and structure checks have been completed for the 75-page peer-review copy. The report remains long because it renders all required source documents, complete passing output and fifteen responsive views; concision remains a reviewer judgement, not guaranteed grading compliance.
2. Student reads and confirms their personal reflection; do not invent confirmation.
3. Integrate the final documentation/evidence through the required linked, peer-reviewed documentation workflow. Do not self-merge or publish a premature completion claim.
4. Reconcile final documentation revision/links and deliver one final PDF, with no browser date/path headers.

No new product-code correction was implemented in this audit. Known UI/planned-test limitations are disclosed; passing tests are not treated as proof of every design promise.

## Layout/structure review checkpoint

The first regenerated version reached 93 pages. Duplicate historical views and unrelated Lab 1/2 graph history were reduced; required supplemental evidence was then added. The subsequent 87-page version was rendered with Poppler and every page viewed in four-page contact sheets. This is a first layout inspection, not final readability certification: several full-width GitHub captures make card/comment text too small, equal-height screenshot slices can cut through a row/control, and many figure pages leave substantial unused space. Those issues still need focused evidence framing and concise layout before submission. Do not use page count or successful rendering as proof that the report is finished.

Structure checks on that version found nine PDF outlines, 102 link annotations, all nine HTML section anchors and zero missing local image references. The authored document has page-number footers but no browser date/title/path print headers. Source-script/document whitespace checks passed; retained raw terminal/graph logs contain original trailing whitespace and are not falsely reported as a clean whole-tree diff.

Part 4 was subsequently revised to nine real user instructions, with labelled translations and assistant follow-up separated from personal student verification. Regenerate the PDF and recheck the changed pages; the student has not yet confirmed the personal reflection. No documentation PR was opened in this audit turn.

## Latest peer-review checkpoint - 4 October

The regenerated copy has 75 pages, 60 figures, nine PDF outlines, 79 link annotations, nine HTML anchors and zero missing image files. All 75 pages were visually reviewed in 19 contact sheets after the focused framing revision. Operational panels are explicitly separate actual-source crops, not reconstructed continuous screens. Long tablet/mobile captures use labelled continuations; row/card boundaries were adjusted after inspection. The final cover/end wording and Queue mobile boundary were then re-rendered and checked separately. These checks certify observed layout, not product/rubric perfection.

New current-main pagination captures show Page 1 then Page 2 of 3 after clicking Next. The 21 exact temporary synthetic records were deleted and the original Staff password-change gate restored. New GitHub closed-product views show actual loaded cards for all eleven Lab 3 product Issues. The visible `is:closed` filter excludes open report Issue #64 explicitly; it is not a claim that the new report task is Done. The temporary view filter was discarded after capture.

PR #41 review/response was newly captured from the actual conversation. Long code blocks have horizontal scrolling in GitHub: the PDF caption calls the image an overview and links to the original; reviewer.md records all four technical points and their real response. Incomplete historical loading-placeholder images are retained only as unused audit history, not report evidence.

Issue #64 and branch `docs/lab3-final-submission` track this document-only revision. Product source, migrations and the previously verified 42/33/9 test results are unchanged. Personal reflection confirmation and reviewer integration are still pending. The initial locally-only/no-PR statements above describe earlier checkpoints, not a backdated current completion claim.

Documentation PR [#65](https://github.com/iceswift/toktickit/pull/65) is now Open from `docs/lab3-final-submission` into `lab3-staging`, with Richyboy170 requested as reviewer. Issue #64 has the actual Development link to #65 and Project status PR Review. Screenshot `report-issue64-pr65-review.jpg` records the saved state. No approval or merge is claimed; the author has not self-merged. Source links to the pushed documentation branch resolve, including the preserved reviewer archive. The peer-review PDF is 75 pages and is not the final submission file until the remaining gates above are settled.

## Part 4 support-focused revision

At the student's request, Part 4 now selects nine actual conversation messages that illustrate requirement interpretation, planning, gap assessment, workflow checking and evidence review. Thai-to-English translations are labelled. Selection does not invent historical prompts or conceal AI implementation and test execution; those activities remain explicitly disclosed. The personal reflection remains an assistant-drafted text awaiting the student's read-through.

The regenerated PDF retains 75 pages and 60 figures. Structure checks found nine outlines, 79 links, all nine section anchors and zero missing local images. The contents page, revised Part 4 pages 27-28 and following page 29 were rendered and visually inspected: table continuation, repeated header, reflection and page references were readable without observed clipping or overlap. This revision updates the existing documentation PR #65, not a new PR.
