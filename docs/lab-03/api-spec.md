# Lab 3 REST API Contract

## Conventions

- Base path is `/api`; JSON errors are `{ "error": "...", "fields": { ... } }` when field-level feedback is useful.
- Authentication is an HttpOnly `toktickit_session` cookie backed by a hashed, revocable database session. Client code never receives a password or session secret.
- `401` means no valid session, `403` means an authenticated role cannot use an operation, `404` hides non-owned protected resources, `409` represents a safe conflict, and `500` has no stack trace or private data.

## Authentication

| Method/path | Success | Rules / failures |
|---|---|---|
| `POST /auth/login` | `200 { user, mustChangePassword }`, sets cookie | `400` invalid shape; `401` safe invalid/inactive message |
| `POST /auth/logout` | `204`, revokes session and clears cookie | idempotent for missing session |
| `GET /auth/me` | `200 { id,name,email,role,mustChangePassword }` | `401` missing/invalid; normal endpoints deny a must-change User |
| `POST /auth/change-password` | `204`, clears must-change and revokes other sessions | authenticated; validates current password, new password, confirmation |

## Requester APIs

Lab 2 requester routes retain resource paths but remove `X-Development-Requester-Id`. The session User determines ownership. Categories and Related Systems remain authenticated reference-data routes. Ticket create, list, detail, and Attachment upload/list/download/removal retain documented Lab 2 validation and return `404` for non-owned resources.

| Method/path | Role | Result |
|---|---|---|
| `POST /tickets` | Requester | create owned Ticket; backend sets requester identity and mapped IT Priority |
| `GET /tickets` and `GET /tickets/:id` | Requester | owned list/detail only |
| Attachment lifecycle routes | Requester | owned active upload/list/download/soft removal |
| `POST /tickets/:id/public-comments` | Requester | append visible Public Comment on owned Ticket |
| `POST /tickets/:id/problem-appears-resolved` | Requester | record indication; never formally resolve/close |

## IT Staff Queue and Ticket Operations

| Method/path | Result |
|---|---|
| `GET /staff/tickets` | queue with `search`, `status`, `ownerId`, priorities, sort, page and metadata; Administrator access is read-only |
| `GET /staff/tickets/:id` | operational Ticket detail with permitted comments, notes, Attachment metadata |
| `PATCH /staff/tickets/:id/owner` | claim current User or assign active IT Staff `{ ownerUserId }` |
| `PATCH /staff/tickets/:id/it-priority` | IT Staff or Administrator; permitted `LOW|MEDIUM|HIGH|URGENT` |
| `PATCH /staff/tickets/:id/status` | valid transition `{ currentStatus }` only |
| `POST /staff/tickets/:id/public-comments` | append shared Public Comment |
| `GET/POST /staff/tickets/:id/internal-notes` | GET: IT Staff or Administrator; POST: IT Staff only; never serialize to Requester responses |

Queue search matches Ticket Number and Summary case-insensitively. Default order is `updatedAt desc`; page sizes are `10`, `20`, or `50`. Invalid query values are `400`; a valid empty result is `200` with empty items.

## Administrator User Management

| Method/path | Result |
|---|---|
| `GET /admin/users` | User list; `search` matches name/email, optional `role` filter |
| `POST /admin/users` | create name, email, one role, active state, initial password; always sets must-change |
| `PATCH /admin/users/:id` | update name, email, role, active state; checks duplicate email and Admin safety rules |
| `POST /admin/users/:id/initial-password` | set valid new initial password and require next-login change |

Only Administrators receive these routes. User deletion, bulk changes, import/export, multi-role changes, and email delivery are excluded.

## Error and Privacy Rules

- Requester access to another Ticket/Attachment and any Requester access to an Internal Note returns safe `404` without protected content.
- IT Staff attempts to User Management return `403`; Requesters attempting Staff routes return `403`.
- Invalid login, inactive accounts, password failures, and malformed input use safe messages. Duplicate email and transition/account-safety conflicts use `409` with a clear non-sensitive message.
