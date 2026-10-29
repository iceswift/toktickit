# Phase 4 — Actions Taken UI

Latest closure: Richyboy170 approved final60c20d4 then merged PR80 at ae16e00
on29October2026. Fetched staging exactly matches reviewed source. Issue71
acceptance checked, Closed/Project Done. See phase4-closure.md. Earlier pending
review descriptions below are historical. This accepts Phase4 only, not the
full Lab4 release or final-main/PDF. Closure update is local for next feature.

29 October 2026. Issue [#71](https://github.com/iceswift/toktickit/issues/71),
feature/71-lab4-actions-ui from peer-merged staging
`2f633d0ae78195bbd721ad958f2795323a89cf23`. Local implementation checkpoint;
independent review and reviewer merge are still required. No Phase5 started.

Published [PR80](https://github.com/iceswift/toktickit/pull/80) Open/Ready into
lab4-staging; product/evidence commit4820ce3. Direct Development Issue71 linkage
verified in UI and closingIssuesReferences; Richyboy170 requested. Actual Project
PR Review, Issue remains Open. Attached checks0 is NOT passing CI. This feature
also carries these submission screenshots/docs; no separate cleanup PR or self-merge.

## Acceptance and verification

| Contract | Delivered scope and actual verification |
|---|---|
| AC-01 / FR-01 | Existing Ticket Detail: chronological paginated Actions, create/edit/history, required work fields, read-only performer/server creation time and separate active assignee. Component and real browser tests. |
| AC-02 / D-02 | Planned → In Progress → Completed; Planned/In Progress → Cancelled; confirmation and required completion Result. Terminal work remains, no Delete/reopen control. Real lifecycle and component assertions. |
| AC-03 / D-01,03 | Iris/Jonas record independent work on one Ticket; performer differs from assignee. Edit/reassignment/status events remain shared read-only history. Administrator creation verified. |
| AC-04 | Owned Requester Ticket Detail shows Actions/history without write controls/private Notes. Adapter uses /api/tickets only, never staff snapshot/assignees. Server ownership/forgery enforcement is retained from Phase3, not replaced by hidden buttons. |
| AC-12 | Draft/key survive uncertain failures; busy guard stops duplicates. Real create201 + injected503, same-key retry200/replayed + list total1. Actual competing edit409, explicit refresh/rebase preserves draft. Real inactive-assignee400 race/correction. |
| AC-13, Phase4 | 1440×900,768×1024,390×844 validation forms/screenshots; document-width overflow assertions plus inspection. Keyboard heading focus → Tab to read-only performer, labels, associated errors, textual status and busy feedback. Other phase screens pending. |

No new shell/dependency/framework. Reuses React/Bootstrap Zen Green. The adapter
sends cookies, preserves safe status/code, rejects malformed list/history/mutation
DTOs. Invalid2xx does not clear an unconfirmed draft/key. One key per logical
create; no persistence across logout/navigation/browser close is promised.

Status confirmations freeze both Ticket/Action versions at time of intent;
refresh cannot silently adopt a newer precondition. Component regression sends
version2 even after refreshing version9. Saved writes refresh Actions/history and
parent Ticket. Existing Ticket status writer now forwards the displayed parent
version because Action writes advance it. This is compatibility, NOT Phase5's
final role/matrix/gate/workflow-history UI. No dashboard refresh is claimed yet.

## Reproduce

```powershell
# client directory; all component regressions, then build
node node_modules/vitest/vitest.mjs run --reporter=verbose
npm.cmd run build
# Explicit synthetic DB, eight reviewed migrations/seed applied first
$env:LAB4_UI_TEST = '1'
$env:LAB4_UI_DATABASE_URL = 'postgresql://postgres@127.0.0.1:55484/lab4_p4_ui_20261029'
node node_modules/@playwright/test/cli.js test -c playwright.lab4.config.ts
```

Final local result: **13 files /52 client tests; build;7 E2E scenarios passed**.
Full outputs: artifacts/lab-04/phase4/client-final-output.txt,
client-build-output.txt and e2e-final-output.txt. LOCAL feature-tree results, not
GitHub CI, staging/main acceptance or a new full-backend run. Earlier39-test
checkpoint is superseded. Source fingerprints accompany logs.

PostgreSQL18 task-owned test cluster127.0.0.1:55484 is separate from Docker/app
data. Test ports55485/55486 are strict; config refuses nonreserved databases and
reuseExistingServer. Unique fixtures/events are retained, never purged or reset.
Account resets and inactive-assignee toggle are confined to this synthetic DB.

Seven scenarios: multi-staff lifecycle; uncertain-response replay; inactive race;
competing-write409; Administrator; three-width validation/focus; delayed assignee
and403/retry. Loading/403 are explicitly injected transport scenarios, not backend
authorization proof. Lifecycle, inactive400, competing409 and replay hit real
API/database. Retained Phase3 API tests cover wider security/ownership.

## Evidence quality and limits

Only inspected screenshots from output/playwright/phase4 are copied into
artifacts/lab-04/phase4/screenshots and report Part6/9. One early test locator used
Open instead of Open detail: scaffolding correction, not product TDD. An early
responsive capture during development refresh showed an empty panel; rejected,
recaptured with explicit form/error-retention assertions at every width.
Initial component-red log was missing dependencies, NOT a behavioral failing test.

Client npm ci reports7 vulnerabilities (3moderate,2high,2critical). No dependency
or lock change/audit fix/force; unresolved Phase7/release risk. Existing server
audit risk remains. No formal contrast or full assistive-technology certification.
No report file:// browser restriction bypass; final rendered HTML/PDF layout QA
is pending Phase8. Phase5 workflow, dashboards, full regression/hardening,
final-main, final Done board and Lab4 student reflection confirmation remain
future work, not already certified.
