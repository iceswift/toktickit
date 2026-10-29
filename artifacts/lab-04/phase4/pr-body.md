## Phase 4: Actions Taken UI

Closes #71

Base: `lab4-staging` at reviewed Phase3 merge `2f633d0`.

### Scope
- Integrate role-safe Actions list/create/edit/assignment/status/history into existing Ticket Detail; Requester owned read-only and Administrator support.
- Distinct immutable performer vs active assignee, terminal records retained, no deletion/reopening.
- Preserve draft and creation key through uncertain failure; busy guard, safe errors, explicit409 refresh/reconciliation and frozen confirmation versions.
- Forward displayed Ticket version through existing status writer (compatibility only; final workflow UI is Phase5).
- Carry verified Phase3 closure docs/images with this feature; continuously update report Part6/9, traceability and twelve inspected UI captures.

### Actual local verification
- Client: **13 files /52 tests passed**, including19 new component/HTTP-adapter cases.
- Production client build passed.
- **7/7 browser scenarios passed** with real API/isolated PostgreSQL18 fixtures.
- Real multi-staff lifecycle, edit/reassign/complete/cancel/history, Requester read-only, Administrator, inactive-assignee400 and competing-edit409.
- Uncertain response: backend create201, deliberately injected503, same-key retry200/replayed, authoritative total1. Explicitly delayed assignee/403 transport scenarios are labelled, not misrepresented as backend authorization proof.
- Validation/keyboard focus and no document overflow at1440×900,768×1024,390×844; inspected screenshot evidence in report.
- Structural contract/local-link checks and git whitespace check pass.

Complete logs, source SHA256, environment and limits: `artifacts/lab-04/phase4/` and `docs/lab-04/phase4-actions-ui.md`.

### Review focus / limitations
Please check shared vs private data, actor/assignee distinction, draft/key preservation, fail-closed cached eligibility, version reconciliation, terminal states and form responsiveness.

No backend/migration change or new dependencies. Existing audit risks remain (client npm ci:7 vulnerabilities); no audit force fix. Retained Phase3 backend110-test result is NOT a new Phase4 full-backend/CI/main run. Dashboards, final Ticket matrix/gate UI, full regression/hardening, report/PDF layout and release remain pending.

Please leave substantive feedback; I will reply and fix in this same PR. **Reviewer approves AND merges** into lab4-staging; author will not self-merge. Issue71 stays Open until acceptance/reviewer merge is verified.
