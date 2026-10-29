# Phase4 working verification record

Branch feature/71-lab4-actions-ui from reviewed staging2f633d0 (Phase3).
Issue71 scope: role-safe Action UI, draft/retry recovery, conflict reconciliation,
fully loaded validation/failure/assignee and three-viewport evidence with tests.
No completed dashboard/final workflow/release is inferred from this phase.

Final local source tests: 13 files /52 passed, no skipped tests; client build
passed; dedicated Playwright config 7/7 scenarios passed. Full logs retained.
19 new component/adapter cases and7 new browser scenarios; existing33 client
cases remain passing. Backend source/migrations unchanged in this phase; earlier
Phase3 110-test result is retained evidence, not a fresh Phase4 backend run.

Environment: Windows, Node/npm lockfile install, Chromium via existing Playwright,
PostgreSQL18 task cluster127.0.0.1:55484; fresh lab4_p4_ui_20261029 database;
8 migrations and synthetic seed. Strict isolated API55485/UI55486, no reused app
servers or normal DATABASE_URL. Test accounts/fixtures changed only in that DB.
Fixtures and immutable events retained for investigation, not deleted.

Images: actual rendered Action section captures at desktop1440×900,
tablet768×1024 and mobile390×844, copied after visual inspection from
output/playwright/phase4. Validation-mobile was recaptured after rejecting an
early development-refresh capture without its form. Every viewport now asserts
visible form + both field errors before capturing; document overflow checked.
Other scenes use default Playwright viewport1280×720, element screenshot may be
taller than viewport. Loading/503/403 are labelled injected transport cases.
Inactive400, competing409, lifecycle and same-key replay hit real backend/DB.

Quality inspection found a stale snapshot could leave Record an Action visible
after failed read403. Fixed by invalidating snapshot and blocking writes until
a successful refresh; component and browser assertions cover the correction.
No behavioral-red claim: original component-red-output.txt is missing Vitest
dependencies, and first E2E locator Open vs actual Open detail was scaffolding.

Unresolved risk: npm ci reports client7 vulnerabilities (3moderate/2high/2critical)
and prior server audit is not clean. No new dependencies/audit force fix.
No CI/main/PDF-layout/app-wide accessibility or peer approval claimed.

Task-owned PostgreSQL test cluster was stopped after verification; databases and
events retained. Test servers55485/55486 exited with the runner. Output text has
only trailing blank EOF lines normalized for git whitespace checks; no test
results or diagnostics removed.
