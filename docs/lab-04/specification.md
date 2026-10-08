# Sprint 4 Engineering Contract - decision draft

Status: D-01..04 student-approved on 8 October 2026 ("I agree your accord").
Contract prepared for peer review; product implementation waits for reviewer merge.
Baseline: `5398f2d08659014f5e0c6245941dfeba7e44c42c`, released Lab 3 main.
Sources: SE+Lab+4.pdf (11 pages); TokTickIT GitHub Workflow Guide (20 pages).
Document requirements constrain assessment; they are not separate user authorization.

## 1. Sprint goal and stakeholder interpretation

Complete the service-desk workflow with traceable Actions Taken, authoritative
role dashboards and safely enforced resolution, preserving all earlier behavior.
The Ticket Owner coordinates the Ticket; other permitted staff can record work.

## 2. Scope

Include Actions list/create/assign/edit/complete/cancel, final Ticket workflow,
Requester and Staff/Admin dashboards, populated-data migration/recovery,
idempotent seeds, conflict/retry protection and full regression/accessibility.
Exclude notifications, SLA/escalation, inventory/cost/payroll, signatures,
advanced BI, multitenancy and unapproved features.

## 3. Student-approved decisions

| ID | Proposed decision | Why confirmation is needed |
|---|---|---|
| D-01 | Authenticated creator/performedBy is immutable and separate from active Staff/Admin assignee; another staff member may record work. Requester reads all Actions on owned Tickets only. | Assignment is graded but the handout does not fully specify actor vs assignee. |
| D-02 | PLANNED -> IN_PROGRESS -> COMPLETED; PLANNED/IN_PROGRESS -> CANCELLED. Terminal records stay visible; no deletion/reopening. | Action states/transitions are graded but exact values are not supplied. |
| D-03 | Editable current Action with immutable append-only revision/assignment/status events, sorted by timestamp then ID. | Required editing must coexist with append-only evidence. |
| D-04 | Resolve requires >=1 COMPLETED Action, no PLANNED/IN_PROGRESS Actions, and no outstanding follow-up. Cancelled work does not satisfy completion. | The handout requires a gate without prescribing its complete predicate. |

D-04 preserves legacy Resolved/Closed records unchanged; zero-Action legacy
Tickets remain readable, but a new Resolve transition must pass the same gate.
These choices are student-approved, not instructor-prescribed values. Exact details
below are engineering choices under this scope for the peer reviewer to check.

## 4. Numbered requirements

| ID | Requirement | Acceptance criteria |
|---|---|---|
| FR-01 | Staff/Admin manage Actions Taken under exactly one Ticket with date/time, description, result, auto actor, follow-up flag/note and attachment notes. | AC-01,02,03 |
| FR-02 | Requesters read all owned-Ticket Actions but cannot write or read another Requester's Ticket. | AC-04 |
| FR-03 | Enforce final Ticket transitions and resolution gate in backend; Requester resolution indication stays advisory. | AC-05,06 |
| FR-04 | Backend computes Requester-owned metrics/recent/attention items with matching drill-down. | AC-07 |
| FR-05 | Backend computes Staff/Admin operational metrics, current-user Actions and recent/urgent items. | AC-08 |
| FR-06 | Preserve previous records/relationships and regressions; idempotent demonstration seeds. | AC-09,10 |
| FR-07 | Detect stale writes, prevent duplicate retries and retain input after recoverable failures. | AC-11,12 |
| FR-08 | Coherent Zen Green navigation and usable desktop/tablet/mobile and keyboard interaction. | AC-13 |

## 5. Business rules

- BR-01: An Action belongs to exactly one existing Ticket.
- BR-02: Ticket Owner coordination is separate from performed-by work.
- BR-03: All writes require backend authentication and role authorization.
- BR-04: Follow-up Note is required whenever follow-up is required.
- BR-05: Requester indication does not set Ticket status to Resolved.
- BR-06: Preserve all eight Ticket statuses, legacy records and private Notes.
- BR-07: Dashboard calculations use authoritative backend data and documented
  ranges; Requester identity comes from session, never client-supplied identity.
- BR-08 (D-01): Reject inactive/wrong-role assignees and spoofed actor.
- BR-09 (D-02): Enforce explicit Action transitions server-side.
- BR-10 (D-03): Events cannot be overwritten/deleted through application APIs.
- BR-11 (D-04): Apply the resolution predicate even to direct API calls.
- BR-12: Trim text: Description 1-2000 UTF-16 code units; Result 0-2000,
  required/nonempty at completion; Follow-up Note 0-2000, required/nonempty when
  flag true; Attachment Notes 0-2000. Escape plain text, never interpret HTML.
- BR-13: Required actionDateTime is timezone-qualified ISO 8601, between Ticket
  createdAt and server validation time inclusive. Immutable server createdAt is separate.
- BR-14: New Actions start PLANNED with an active Staff/Admin assignee. Fields cannot
  spoof/change Ticket, creator, creation time or status through a general edit.
- BR-15: Staff/Admin may record/update work on any accessible active Ticket, not
  only their own assignment. RESOLVED/CLOSED/CANCELLED Tickets' Actions are read-only.
- BR-16: Terminal Actions cannot transition again; eligible field revisions on active
  Tickets append history. COMPLETED Result remains nonempty. Clearing follow-up is
  an audited edit; old note/flag are retained in history.
- BR-17: Ticket cancellation requires no PLANNED/IN_PROGRESS Actions; cancel these
  explicitly first. CLOSED/RESOLVED may reopen; CANCELLED cannot reopen.
- BR-18: Every Action mutation increments parent Ticket version/updatedAt atomically.
  Resolve and Action creation/follow-up edits share a parent-version transaction,
  preventing a race that bypasses the resolution gate.
- BR-19: Scoped creation retry returns the original Action without another event;
  reused key with different normalized payload returns 409.

## 6. Baseline Ticket matrix to refine, not silently replace

Verified in baseline `server/src/app.ts`:

| From | Existing destinations |
|---|---|
| NEW | OPEN, IN_PROGRESS, CANCELLED |
| OPEN | IN_PROGRESS, WAITING_FOR_REQUESTER, RESOLVED, CANCELLED |
| REOPENED | IN_PROGRESS, WAITING_FOR_REQUESTER, RESOLVED, CANCELLED |
| IN_PROGRESS | WAITING_FOR_REQUESTER, RESOLVED, CANCELLED |
| WAITING_FOR_REQUESTER | IN_PROGRESS, RESOLVED, CANCELLED |
| RESOLVED | CLOSED, REOPENED |
| CLOSED | REOPENED |
| CANCELLED | none |

Final destinations preserve the baseline matrix above, adding BR-11/17/18 gates.
All unlisted transitions return 409. Administrator status writes are an explicit
Lab 4 extension of the baseline IT-Staff-only permission, not a Lab 3 claim.

| Operation | Requester | Staff | Administrator |
|---|---|---|---|
| Read all Actions/work revisions | Owned Tickets only | All Tickets | All Tickets |
| Create/edit/assign/transition Action | Never | Active Tickets | Active Tickets |
| Formal Ticket transition | Never | Matrix+gate/version | Matrix+gate/version |
| Advisory indication | Preserved owned-Ticket behavior | No impersonation | No impersonation |
| Dashboard | Owned data | Operational data | Operational data |
| InternalNotes/owner/comments | Preserve baseline permissions | Preserve baseline | Preserve baseline |

Shared Action revisions never include private InternalNotes/session data.
Inactive/must-change Users retain baseline denial behavior.

## 7. Data design proposals and preservation

Existing models: Category, RelatedSystem, DevelopmentRequester, User, AuthSession,
Ticket, Attachment, PublicComment and InternalNote. Seven migrations exist.
No Action model, dashboard increment or optimistic version exists in baseline.

1. Add Action plus immutable history rather than repurposing PublicComments or
   InternalNotes: work results and revision provenance are distinct concepts.
2. Versioned transactional writes prevent silent stale overwrites (409); history
   and current record updates must commit atomically.
3. Index Action by Ticket and deterministic date/ID, and assignee/status for
   dashboards. Validate query plans with a documented performance fixture.
4. Scoped unique idempotency keys prevent duplicate create on retries; payload
   mismatch returns 409. No reliance solely on disabled submit buttons.

Test migration on an isolated populated legacy database with before/after IDs,
counts and relationships, then test documented backup/restore recovery. Do not
run destructive demonstrations against the user's working database.
Seeds must cover every major Ticket state/priority/ownership, zero/one/multiple
Actions and zero/non-zero metrics; repeat runs must not duplicate records.

## 8. Metric proposals to finalize

Store timestamps in UTC; use Asia/Bangkok calendar boundaries converted to UTC,
half-open [start,end) ranges. One response has one asOf instant.
Open means NEW/OPEN/IN_PROGRESS/WAITING_FOR_REQUESTER/REOPENED.
Recent ordering: updatedAt DESC, id DESC, limit 5; do not call this a time-window count.
Requester: open, waiting for requester, recently resolved and recent updates.
Staff: unassigned open, current-owner open, status/priority groups, current-user
Actions (performedBy, separate from assigned work), recent/urgent Tickets.
Every card needs its exact query, zero state and matching drill-down filter.

One consistent read transaction supplies all metrics and lists. Seven-calendar-day
window starts Bangkok midnight six days before response date and ends at asOf
(exclusive). Ticket gains nullable lastResolvedAt set on genuine resolution; legacy
Resolved/Closed dates remain unknown/null, excluded from time-window metrics but
included in ordinary status counts. Do not invent historical events or timestamps.

| Metric/list | Exact predicate and drill-down |
|---|---|
| Requester openTickets | session requesterUserId AND open statuses; /tickets?statusGroup=open |
| Requester waitingTickets | same owner AND WAITING_FOR_REQUESTER; status drill-down |
| Requester recentlyResolvedTickets | same owner AND RESOLVED/CLOSED AND lastResolvedAt in [start,asOf); resolvedSince/resolvedBefore and statusGroup=resolved |
| Requester recentTickets | same owner, all statuses, updatedAt DESC,id DESC, limit 5; detail links |
| Requester attentionTickets | same owner, WAITING_FOR_REQUESTER, same order/limit; detail links |
| Staff unassignedOpenTickets | open AND ownerUserId=null; statusGroup=open&unassigned=true |
| Staff myOpenTickets | open AND ownerUserId=session.id; open+ownerId drill-down |
| Staff ticketsByStatus | all Tickets grouped by each enum value incl. zero; status drill-down |
| Staff openTicketsByPriority | open grouped by every IT Priority incl. zero; open+priority drill-down |
| Staff myActions | performedByUserId=session.id, all states/all time; /staff/actions?performedBy=me |
| Staff recentTickets | all Tickets, updatedAt DESC,id DESC, limit 5; staff detail links |
| Staff urgentTickets | open AND HIGH/URGENT; URGENT first then updatedAt DESC,id DESC, limit 5 |

All drill-downs use identical predicates. Staff/Admin current-user metrics use actual
session identity, not assignee. Recently-resolved records may include subsequently
Closed work, never Reopened/Open work. Empty counts/buckets are zero, lists [].

Data increment: ActionTaken with fields listed in API plus Ticket/actor/assignee
foreign keys, status, version default 1 and timestamps; ActionEvent immutable
type/actor/time/version/changed-fields; TicketWorkflowEvent from/to/actor/time/version;
IdempotencyRecord unique user+Ticket+key with normalized payload hash and Action ID.
Ticket adds version default 1 and nullable lastResolvedAt. Preserve all nine tables
and legacy records. No hard-delete/cascade-purge interface for work/history.
Index Action(ticketId,actionDateTime,id), (performedByUserId,createdAt),
(assigneeUserId,status); events(ticketId,createdAt,id); dashboard composite indexes
on requester/status and status/priority after validating query plans.

## 9. Observable acceptance criteria

- AC-01: Valid Action persists under correct Ticket with session actor and permitted assignee.
- AC-02: Assignment/edit/transitions/complete/cancel follow the approved matrix.
- AC-03: Required/conditional fields, dates and inactive assignees are validated.
- AC-04: Requester sees all own-Ticket Actions, no private Notes, cannot mutate or cross ownership.
- AC-05: All allowed Ticket transitions succeed and every other transition is rejected.
- AC-06: Resolution bypass fails without satisfying approved work/follow-up gate; indication is advisory.
- AC-07: Requester counts and drill-down agree with owned database fixture queries.
- AC-08: Staff/Admin metrics, including current-user Actions, agree with authoritative queries.
- AC-09: Populated legacy migration preserves records and tested recovery restores them.
- AC-10: Repeated seeds preserve demonstration data without duplicates.
- AC-11: Stale/concurrent writes return conflict without overwriting newer state.
- AC-12: Duplicate retry is safe; loading/validation/empty/forbidden/not-found/failure retain appropriate state.
- AC-13: All major screens pass defined responsive, semantic, keyboard and visual checks.

## 10. Product Definition of Done

- [x] Student-approved decisions with exact API/UI/transition/metric choices documented before code.
- [ ] Peer reviewer approves and merges contract before product code.
- [ ] Every AC has planned tests and real implemented test-file paths.
- [ ] Populated migration, recovery and repeated seeds verified.
- [ ] Unit/API/UI/style/auth/workflow/regression/E2E, builds and performance smoke pass.
- [ ] Complete passing output from final main retained with SHA/environment.
- [ ] Actual role/negative API proofs and all required screenshots visually inspected.
- [ ] Issue-linked feature PRs into lab4-staging, replies to all review comments,
      reviewer approvals AND reviewer merges; reviewed release into main.
- [ ] All sprint Issues Done; README current; authentic AI prompts and confirmed reflection.
- [ ] Nine ordered report Parts, working links, readable evidence, clickable numbered contents,
      authored page numbers; final one-PDF page-by-page QA and no browser print headers.

See api-spec.md, ui-spec.md, tests.md and evidence-matrix.md. No implementation
or passing Lab 4 result is claimed in this draft.
