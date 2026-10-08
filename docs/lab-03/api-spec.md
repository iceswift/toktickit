# Lab 3 REST API Contract

## Conventions

- Requester/reference routes use `/api`; authentication uses `/auth`, Staff uses `/staff`, and administration uses `/admin`. JSON errors are `{ "error": "...", "fields": { ... } }` when useful. Route/shape corrections below were made during the 3 October audit, not attributed retroactively to the initial contract.
- Authentication is an HttpOnly `toktickit_session` cookie backed by a hashed, revocable database session. Client code never receives a password or session secret.
- `401` means no valid session, `403` means an authenticated role cannot use an operation, `404` hides non-owned protected resources, `409` represents a safe conflict, and `500` has no stack trace or private data.

## Authentication

| Method/path | Success | Rules / failures |
|---|---|---|
| `POST /auth/login` | Request: `{ email, password }`; `200 { user: { id,name,email,role,mustChangePassword } }`, sets cookie | `401` missing/malformed credentials, invalid/inactive or throttled login; five failed attempts per normalized-email/source-IP pair in 15 minutes are rate-limited without an account lock |
| `POST /auth/logout` | `204`, revokes session and clears cookie | idempotent for missing session |
| `GET /auth/me` | `200 { user: { id,name,email,role,mustChangePassword } }` | `401` missing/invalid; normal endpoints deny a must-change User |
| `POST /auth/change-password` | Request: `{ currentPassword, newPassword, confirmation }`; `204`, clears must-change, revokes all sessions including current, clears cookie | validates current password, new password and confirmation; sign in again after success |

## Requester APIs

Lab 2 requester routes retain resource paths but remove `X-Development-Requester-Id`. The session User determines ownership. Categories and Related Systems remain authenticated reference-data routes. Ticket create, list, detail, and Attachment upload/list/download/removal retain documented Lab 2 validation and return `404` for non-owned resources.

| Method/path | Role | Result |
|---|---|---|
| `POST /tickets` | Requester | create owned Ticket; backend sets requester identity and mapped IT Priority; any client requester identity is rejected/ignored |
| `GET /tickets` and `GET /tickets/:id` | Requester | owned list/detail only |
| Attachment lifecycle routes | Requester | owned active upload/list/download/soft removal |
| `POST /tickets/:id/public-comments` | Requester | request `{ content }`; append visible Public Comment on owned Ticket |
| `PATCH /tickets/:id/problem-appears-resolved` | Requester | request `{ appearsResolved: boolean }`; records/clears indication; never formally resolves/closes |

## IT Staff Queue and Ticket Operations

| Method/path | Result |
|---|---|
| `GET /staff/tickets` | queue with `search`, `status`, `ownerId`, priorities, sort, page and metadata; Administrator access is read-only |
| `GET /staff/tickets/:id` | operational Ticket detail with permitted comments, notes, Attachment metadata |
| `PATCH /staff/tickets/:id/owner` | IT Staff only. Request `{ ownerUserId: positive integer \| null }`; `null` claims current IT Staff User, otherwise assigns an active IT Staff or Administrator User |
| `PATCH /staff/tickets/:id/it-priority` | IT Staff or Administrator. Request `{ itPriority: "LOW"\|"MEDIUM"\|"HIGH"\|"URGENT" }` |
| `PATCH /staff/tickets/:id/status` | IT Staff only. Request `{ status }`; backend accepts only a legal transition from current status |
| `POST /staff/tickets/:id/public-comments` | IT Staff only. Request `{ content }`; append shared Public Comment |
| `GET/POST /staff/tickets/:id/internal-notes` | GET: IT Staff or Administrator; POST: IT Staff only with request `{ content }`; never serialize to Requester responses |

Queue search matches Ticket Number and Summary case-insensitively. Default order is `updatedAt desc`; page sizes are `10`, `20`, or `50`. Invalid query values are `400`; a valid empty result is `200` with empty items.

All Comment and Note requests trim `content`, reject empty text and text above
2,000 JavaScript UTF-16 code units with `400`, and return server-created `{ id, ticketId,
author: { id, name, role }, content, createdAt }`. The server serializes comment
and note text as plain text; clients must escape it and must not interpret it as
HTML. Queue responses use `{ items, page, pageSize, totalItems, totalPages }`.

## Administrator User Management

| Method/path | Result |
|---|---|
| `GET /admin/users` | User list; `search` matches name/email, optional `role` filter |
| `POST /admin/users` | request `{ name,email,role,active,initialPassword }`; create one-role User and always set must-change |
| `PATCH /admin/users/:id` | request `{ name,email,role,active }`; update basic account data; checks duplicate email and Admin safety rules |
| `POST /admin/users/:id/initial-password` | request `{ initialPassword }`; set a new initial password and require next-login change |

Only Administrators receive these routes. User deletion, bulk changes, import/export, multi-role changes, and email delivery are excluded.

## Error and Privacy Rules

- Cross-owner Requester Ticket/Attachment access returns safe `404`. Requester access to `/staff` Internal Note routes returns role-based `403`, without note content or resource-existence disclosure.
- IT Staff attempts to User Management return `403`; Requesters attempting Staff routes return `403`.
- Invalid login, inactive accounts, password failures, and malformed input use safe messages. Duplicate email and transition/account-safety conflicts use `409` with a clear non-sensitive message.
