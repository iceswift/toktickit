# Phase8 local verification - 30 October 2026

Branch docs/lab4-release-report from reviewed staging b887994; the accepted
product tree is unchanged except a native SVG favicon and index.html reference.
Installed Chrome requested /favicon.ico and exposed404 in earlier evidence work;
the explicit /favicon.svg now returns200, Content-Type image/svg+xml on the
reserved QA UI. No external icon provider or new runtime dependency.

## Executed results

- Client: `npm test -- --reporter=default`:19 files,90 tests passed; `npm run build` passed.
- Browser: `npm run test:e2e`, LAB4_UI_TEST=1, dedicated fresh migrated/seeded
  lab4_p7_ui_phase8_20261030 on127.0.0.1:55484:37 unique preserved Lab2/3/4 scenarios
  passed,4.9minutes. Browser API/UI reserved55485/55486, reuseExistingServer=false.
- Backend: fresh lab4_p7_reg_phase8_20261030 migrated/seeded with all8 migrations;
  environment guard plus full test set, real migration/recovery/performance enabled:
 29 files,272 tests passed; server production build passed.
- The first backend command appended --reporter=default to a script already
  specifying verbose, so it printed both reporters. Both said272 pass, not544
  tests. A subsequent environment-guarded `npx vitest run --reporter=default`
  independently passed the SAME272 tests. Complete compact output retained;
  duplicated verbose original also retained, not silently edited/truncated.
- Latest compact performance p95 Requester53.81ms, Staff118.79ms, Admin91.85ms;
 10k Tickets/20k Actions, five warmups/20samples, threshold1000ms. Inner dashboard
  model operations6/10/10; full environment/response sizes/query plans in raw log.
  Local smoke only, not production SLA/load certification.

Raw command output is client-tests.txt/client-build.txt/e2e-tests.txt,
server-tests.txt/server-tests-compact.txt/server-build.txt. Local runner wall-clock
strings are preserved; they are not assigned a fictitious timezone. The dated
source-fingerprints.json identifies actual public source bytes used, including
client/index.html and client/public, not merely the prior HEAD.

Supplemental Staff capture: real zero-personal-work synthetic account, genuine
held request then release, explicitly injected503/403, real200 recovery. Source
script scripts/capture_lab4_staff_states.js and staff-capture-output.txt retained.
Originals under screenshots, all five proof states inspected. This is not a
live service outage or a real wrong-role denial screenshot. API tests supply
real role/ownership negatives separately.

Regression images copied byte-for-byte from actual Lab4 browser outputs; previous
Phase7 full originals remain unchanged. The current37 run also passes the same
screen/role assertions, but older retained images are not relabelled fresh-main.

## Release boundary

All of the above are LOCAL feature-branch results, not main/CI, release acceptance
or final all-Done. Report builder checks passing markers before emitting a review
copy. Required next: every-page PDF inspection, direct Issue75-linked Phase8 PR,
Richy approval AND merge, reviewed release into main, actual main rerun/record,
Issue75 acceptance/all-Done capture, final regeneration and every-page QA.
