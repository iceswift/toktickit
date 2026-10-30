# Phase 7 QA / hardening — working record

Started30 October2026 from reviewer-merged staging df785a5 on
feature/74-lab4-qa-hardening, Issue74. Phase6 closure docs/screenshots carried here.
Reread complete11-page Lab4 handout and20-page GitHub workflow guide. PDF rules
are assessment requirements, not independent authorization. Reviewer Richyboy170
approves final head AND merges; direct PR–Issue link required. No Phase8 start.

## Acceptance checklist (local implementation; peer acceptance still pending)

- [x] Full backend real-DB suites including populated migration/recovery/reseed,
  auth/role/ownership, all transition/gate/concurrency/retry cases; production build.
- [x] Full client component/style/adapter suite and build; focused regression
  catches lost Staff Comment/Note drafts and duplicate in-flight requests first.
- [x] Existing Lab2/3 E2E adapted to current authenticated/versioned workflow,
  all Lab4 E2E, no stale removed selectors or purging immutable history. Fresh
  loopback-only p7 database and reserved ports; refuse working env/server reuse.
- [x] Required named Requester/Staff dashboard test paths contain real cases.
- [x] Performance smoke: fresh10k Tickets/20k Actions, documented hardware,
  warmup+20requests/role, p95<=1000ms, query count/plan evidence and no N+1.
- [x] Every major screen inspected desktop1440x900/tablet768x1024/mobile390x844;
  real loaded captures, forms/read-only/errors, focus/keyboard/semantic/noncolor/
  contrast, clipping/overlap/overflow, console/link/unfinished-control audit.
- [x] Security audit before/after; fix compatible production transitive advisories
  and explicitly selected patched dev tooling, no blind force upgrade.
- [x] README current and test/evidence/AC paths reconciled; source/env/logs/hashes
  retained, working report Parts3/8/9 updated. No invented final main/CI/PDF proof.
- [x] One directly linked feature PR83 into staging; peer acceptance/merge pending.

## Publication / independent-review gate

[PR83](https://github.com/iceswift/toktickit/pull/83) Open/Ready into lab4-staging,
product/evidence174bd181d86261785282577181c05e5d722bed30. Direct Issue74 Development
link confirmed in actual UI and closingIssuesReferences, not just a branch/body
mention. Richyboy170 requested; actual Project status PR Review, Issue74 Open.
Inspected phase7-pr83-ready.png and phase7-issue74-pr-review.png are retained in
artifacts/lab-04/github and incorporated into the report. This handoff record is
a documentation-only follow-up in the SAME PR; product source/verification unchanged.
Attached checks0 is not CI Pass. Reviewer approves final head and merges; no author
merge, approval, closed Issue, Done or final release inferred. Phase8 Issue75 remains
Backlog until independent acceptance of Phase7.

## Findings before fixes

1. StaffTicketDetail clears Public Comment/Internal Note immediately even when
   save fails and permits overlapping requests. Focused behavioral red retained
   before implementation. Do not claim network-uncertain Comment retry idempotent;
   persistent Action creation replay is a separate already-tested contract.
2. Old browser suites use hardcoded3000/5173, obsolete Staff status selector and
   Open button, plus purge/reset cleanup incompatible with immutable histories.
   Update test harness/selectors to approved current semantics, not relax product.
3. Audit before: client7 vulnerable nodes (3moderate/2high/2critical), server11
   (4moderate/4high/3critical). Read registry/advisory data and Node engines first;
   Node22.17 compatible with Vitest4.1.12/Vite6.4.5. No audit-fix --force.
4. README still says Actions/dashboard unimplemented (Phase2 checkpoint).
5. App navigation visually outlines multiple buttons and only Dashboard carries
   aria-current. Need exact active-page semantics throughout shell.

## Verified checkpoints (local feature tree, not main or CI)

Final selected verification: server-final-consistent-fixture-output.txt passes29
files/272 tests; client-final-output.txt passes19 files/90 tests; production builds
pass. e2e-final-verified-output.txt passes all37 browser scenarios on final product
source, including the10-scenario accessibility/console subset, after semantic fixes.
Earlier runs/failures remain separately labelled, not additional unique tests.
evidence-summary.json validates outputs,48 axe reports,10 console records,64 images
and audit0; source-fingerprints.json records current public source bytes and base.
Captured text outputs are mechanically normalized for line endings/trailing
whitespace only; no command, failure, count or diagnostic content removed.

Both lockfiles reproduced with npm11.6.2 ci:0 advisories. npm10 Arborist errors
retained, no force/legacy-peer-deps/global upgrade. Node22.17 supports selected
Vitest4.1.12/Vite6.4.5; Express remains4.x/Prisma5.x.

Performance in server-working-output.txt:10k Tickets/20k Actions/events, five
warmups+20HTTP samples per role. p95 Requester50.49ms (6 model calls), Staff147.60ms
(10), Admin92.20ms (10); below1000ms local threshold. Intel i7-14650HX/24 logical
CPUs/24GB, Windows x64/Node22.17. Count is inner dashboard model operations, not
outer auth SQL/BEGIN/COMMIT. Query plans retained; not production SLA/load proof.

## Accessibility findings and inspection limits

Reviewing incomplete-rule details exposed a real baseline semantic issue: RoleBadge
used aria-label on a span without a label-supporting role. Retained3-case semantic
RED, then explicit img role makes the visible text badge's role name valid; full
client90 tests/build pass again. This was fixed, not dismissed as an incomplete.
Native Bootstrap select arrows use a background SVG; text/background colors were
also checked manually: #212529 on white15.43:1; read-only #495057/#e9ecef6.90:1.
This manual calculation addresses those select-text warnings, not a blanket claim
for every inaccessible or disabled control.

The fail-closed evidence inventory also caught the remaining baseline pagination
div with aria-label but no supporting role. Retained one-case semantic RED, then
added navigation role without changing layout/query behavior. Full client90/build
passes again, and the full browser suite is rechecked before final asset publication.
The collector deliberately refused stale/incomplete proof rather than deleting
the warning or disabling its rule.

Initial console audit correctly captured401/auth/me during unauthenticated startup.
Revised classification is exact URL+status only, retained in per-scenario JSON:
expected /auth/me401 and the explicitly injected internal-notes503; all other
console errors and all runtime exceptions fail acceptance. No browser security or
authorization check was weakened. Initial over-strict failure log is retained as
console-audit-initial-output.txt, not relabelled a product/TDD defect.

Initial axe found actual contrast failures: navbar4.29:1, pagination label2.48:1,
secondary text4.44:1 and validation red4.29:1 on bg-light. Fixed shared CSS while
retaining Zen Green; a11y-before retains failures, not ignored rules.
visual-a11y-final-output.txt:10 scenarios passed;49 loaded images/48 axe reports.
Screens: Login, My Tickets/Create/Requester Detail/Dashboard, Staff Queue/Dashboard/
My Actions/Detail, Workflow confirmation, Action validation/edit/history, Admin
directory/edit/reset at1440x900,768x1024,390x844, plus injected Note failure.

All49 images reviewed in nine layout contact sheets; selected form/confirmation
captures inspected full resolution. No blank/loading-only image or overlapping
controls; long pages scroll vertically. Automated document-width assertions pass.
Textual role/status/error labels supplement color. Heading focus/Tab-to-confirm
and validation association checked. Axe zero automatic violations is not WCAG or
screen-reader certification. Both unsupported-label defects are fixed; the only
remaining incomplete rule is native-select color-contrast, manually reviewed as
above. Final48 reports have zero automatic violations and10 console reports zero
unexpected errors; expected exact auth401/injected503 are explicitly retained.
64 final captures (49 full-context/injected,12 readable panels,3 baseline first-login)
are catalogued in phase7-visual-evidence.md. All extra panels/first-login captures
inspected in three more contact sheets, with selected full-size images checked.
Capture animations are disabled, not product animations or validation. Report
anchors/assets/nine Parts pass structural checks. PDF pagination belongs to Phase8.

Latest performance: server-final-consistent-fixture-output.txt gives Requester
p95 53.65ms, Staff128.38ms, Admin90.75ms; inner calls6/10/10. Earlier measurements
above are retained checkpoints, not the current selected run. Local shared-machine
timings vary; all retained passing smokes meet1000ms, no production SLA inference.
