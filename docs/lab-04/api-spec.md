# Lab 4 API Contract - Phase 1 peer review

No new endpoint is implemented. D-01..04 student-approved 8 October 2026.
Preserve baseline route prefixes: /auth, /tickets, /staff, /admin and reference /api.
Never rewrite them as though the complete baseline lives under /api.
HttpOnly session cookie remains authoritative; do not return secrets/passwords.

| Proposed method/path | Role | Intent |
|---|---|---|
| GET /tickets/:id/actions | Requester | All Actions on an owned Ticket, sanitized history without InternalNotes |
| GET /staff/tickets/:id/actions | Staff/Admin | Operational Action list with stable ordering |
| POST /staff/tickets/:id/actions | Staff/Admin | Validated Action; server actor; scoped Idempotency-Key |
| PATCH /staff/tickets/:id/actions/:actionId | Staff/Admin | Editable fields with expectedVersion; append revision atomically |
| PATCH /staff/tickets/:id/actions/:actionId/assignee | Staff/Admin | Active permitted assignee + expectedVersion |
| PATCH /staff/tickets/:id/actions/:actionId/status | Staff/Admin | Approved transition + expectedVersion, append event |
| PATCH /staff/tickets/:id/status | Approved final role matrix | Existing route extended with expectedVersion and resolution gate |
| GET /tickets/dashboard | Requester | Concise owned metrics/recent/attention plus drill-down |
| GET /staff/dashboard | Staff/Admin | Concise operational metrics/current-user Actions plus drill-down |

Register dashboard route before /tickets/:id to prevent literal dashboard being
parsed as an ID. Literal routes precede parameter routes.

## Exact requests, responses and concurrency

Action input: {actionDateTime,description,result,assigneeUserId,followUpRequired,
followUpNote,attachmentNotes,expectedTicketVersion}. Date requires timezone ISO;
text follows specification BR-12/13; assignee positive integer; flag boolean.
Optional texts normalize to empty strings. Reject unknown/spoofed identity/status
fields with 400. New resource status always PLANNED.
Action DTO: {id,ticketId,performedBy:{id,name},assignee:{id,name,isActive},
actionDateTime,description,result,followUpRequired,followUpNote,attachmentNotes,
status,version,createdAt,updatedAt}. Responses never include password/session data.

Create 201 {action,ticketVersion}. Edit/assign/status 200 {action,ticketVersion};
all require expectedTicketVersion>=1, and edits also expectedVersion>=1. Editable
PATCH contains nonempty subset of description/date/result/follow-up/attachment notes;
assignment uses assigneeUserId; status route uses status. No mass assignment of
identity/parent/createdAt/version. Ticket status uses {status,expectedVersion}.
Each write atomically updates history and shared parent version; mismatch 409
{error,code:'STALE_VERSION'}. No writer may bypass version protocol or Resolve gate.

Creation Idempotency-Key required: 8-128 ASCII letters/digits/hyphen/underscore,
scoped user+Ticket+operation. Same normalized data (excluding version preconditions)
returns saved Action with 200 and replayed:true, before stale-version checks and
without extra history. Reused key/different input 409 IDEMPOTENCY_CONFLICT.
Authenticate/recheck accessibility even on replay. Persist key/hash/resource in DB
for resource lifetime; no in-memory-only duplicate prevention.

Lists: {items,page,pageSize,totalItems,totalPages}; page>=1, size10/20/50, default10.
Action list ordering actionDateTime ASC,id ASC. Events are {items} ordered
createdAt ASC,id ASC with {id,type,actor:{id,name},createdAt,version,changes}.
Add GET /tickets/:id/actions/:actionId/events and /staff equivalent; Requester
gets shared work only. GET /tickets/:id/workflow-events and /staff equivalent
return status-only history to appropriate role. No private Notes in shared revisions.
GET /staff/actions?performedBy=me returns own-created Actions plus Ticket numbers,
same paging, createdAt DESC,id DESC; Staff/Admin session identity only.

## Dashboard DTO and filters

Requester: {asOf,timeZone:'Asia/Bangkok',resolvedWindow:{start,end},metrics:
{openTickets,waitingTickets,recentlyResolvedTickets},recentTickets,attentionTickets,
drillDown}. Staff: {asOf,timeZone,metrics:{unassignedOpenTickets,myOpenTickets,
ticketsByStatus,openTicketsByPriority,myActions},recentTickets,urgentTickets,
recentMyActions,drillDown}. Lists limit5 safe summary fields/detail URLs, not full
descriptions/files/private Notes. Exact predicates/window/order in specification 8.

Extend GET /tickets with statusGroup=open|resolved and resolvedSince/resolvedBefore;
extend /staff/tickets with statusGroup=open and unassigned=true (incompatible with
ownerId); preserve existing defaults/search/sort/paging. Validate ordered ISO date
ranges/query combinations with 400. Drill-down uses exact card population.
All zero metrics numeric0, enum buckets present, lists []. A consistent DB read
transaction gives one asOf. Never trust client Requester identity for ownership.
409 RESOLUTION_GATE reasons: NO_COMPLETED_ACTION/OPEN_ACTIONS/FOLLOW_UP_PENDING.
Cancelled Ticket with open Actions returns409; terminal Ticket Action writes409.

Safe errors: 400 field errors; 401 missing/expired/inactive session; 403 wrong role;
404 non-owned/missing resources or Action parent mismatch; 409 stale version,
illegal transition, unmet gate or idempotency mismatch; 500 safe recoverable error
without private data/stack. Mandatory first-login password change stays enforced.
No DELETE Action/event API. Data/history and mutation are transactional.
