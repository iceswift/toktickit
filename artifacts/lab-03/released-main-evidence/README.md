# Evidence provenance

- `*-released-main-*` test/build logs and migration output: actual released product `c551061` on 2 October 2026, before the Issue #58 source changes.
- `issue-58-*`: subsequent correction branch only. Client 29/29, E2E 9/9 and both builds passed; these are not yet released-main results for Issue #58.
- Login, queue, detail, administrator and direct API state evidence uses synthetic accounts/Tickets in isolated PostgreSQL on host port 55434. Original development data was not modified.
- Files ending `injected` and login busy/network failure use controlled browser delay, empty response, 503 or network abort. They demonstrate UI feedback, not a real backend outage.
- `queue-badges-correction` and `admin-account-switch-correction`: real running UI on the Issue #58 branch.
- Final Kanban captures are genuine overlapping board views at the Release #57 checkpoint, before Issue #58 was opened. Recapture is required after the latter is integrated.
- Development links for 43/44 and 46/47 and review acknowledgements were reconciled during this audit. Historical timing is not backdated.
- Logs retain all result lines; trailing whitespace and redundant empty EOF lines were normalized for version control. Original command output remains in local `output/playwright`.
- The HTML/PDF is a comprehensive review draft, not yet the concise submission version. Its pending requirements are explicit. Do not infer completeness from its page count.
