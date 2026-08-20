# Lab 2 REST API Contract

## Conventions

- Base path: `/api`.
- JSON responses use `application/json`; attachment upload uses
  `multipart/form-data`.
- Requester-owned endpoints require `X-Development-Requester-Id: <positive int>`.
  This is a development test context, not authentication.
- Validation failure uses `{ "error": "...", "fields": { "field": "message" } }`.
  Safe unexpected failure uses `{ "error": "Unable to complete the request." }`.
- An absent, malformed, inactive, or non-owned requester context yields `404` for
  protected resources to avoid revealing protected information.

## Reference and Requester Context

| Method and path | Success | Failure behavior |
|---|---|---|
| `GET /categories` | `200` active `{id,name}` array | `500` safe error |
| `GET /related-systems` | `200` active `{id,name}` array | `500` safe error |
| `GET /development-requesters` | `200` active `{id,displayName,email}` array | `500` safe error |

## Tickets

### `POST /tickets`

Requires the development requester header. Request body:

```json
{
  "categoryId": 1,
  "relatedSystemId": 2,
  "summary": "VPN disconnects during online exam",
  "requestedPriority": "HIGH",
  "description": "The VPN disconnects after approximately five minutes."
}
```

Returns `201` with the created Ticket, including `id`, `ticketNumber`,
`requesterId`, classification data, priorities, `currentStatus`, and timestamps.
Returns `400` for invalid fields, `404` for invalid/inactive requester or inactive
reference data, `409` only if Ticket Number generation cannot resolve a collision
after bounded retries, and `500` for a safe unexpected error.

### `GET /tickets`

Requires the development requester header. Query parameters:

| Parameter | Allowed values | Default |
|---|---|---|
| `search` | trimmed 0-120 characters | omitted |
| `categoryId` | active positive integer | omitted |
| `requestedPriority` | `LOW`, `MEDIUM`, `HIGH` | omitted |
| `currentStatus` | `NEW` | omitted |
| `sortBy` | `createdAt`, `updatedAt`, `ticketNumber`, `requestedPriority` | `createdAt` |
| `sortOrder` | `asc`, `desc` | `desc` |
| `page` | integer >= 1 | `1` |
| `pageSize` | `10`, `20`, `50` | `10` |

Returns `200`:

```json
{
  "items": [{ "id": 1, "ticketNumber": "TKT-20260820-12AB34CD" }],
  "page": 1,
  "pageSize": 10,
  "totalItems": 1,
  "totalPages": 1
}
```

Only owned Tickets are searched and returned. Invalid query values return `400`;
an empty successful result remains `200` with an empty `items` array.

### `GET /tickets/:ticketId`

Requires the development requester header. Returns `200` with full read-only
Ticket data, reference labels, and Attachment metadata. Returns `404` when the
Ticket is missing or not owned; returns `500` only as a safe unexpected error.

## Attachments

### `POST /tickets/:ticketId/attachments`

Requires the development requester header and multipart field `file`. The
Ticket must be owned. Server validates allowed type, true MIME type where
available, 5 MB maximum, and at most five active Attachments. Returns `201` with
metadata. Returns `400` for missing file, `404` for missing/non-owned Ticket,
`409` for five active files, `413` for oversized files, `415` for unsupported
type, and `500` safely after compensating/removing any incomplete storage write.

### `GET /tickets/:ticketId/attachments`

Requires ownership and returns `200` with Attachment metadata, including removal
status/reason but never server storage paths. Returns `404` for missing/non-owned
Ticket.

### `GET /attachments/:attachmentId/download`

Requires the development requester header and ownership through the Attachment's
Ticket. Returns `200` as a controlled file response only for an active Attachment.
Returns `404` for missing, removed, or non-owned Attachment; no removed file is
previewed or downloaded.

### `DELETE /attachments/:attachmentId`

Requires the development requester header and JSON `{ "reason": "..." }`.
Returns `204` after soft removal. Returns `400` for a missing/invalid reason,
`404` for missing, removed, or non-owned Attachment, and `500` safely on an
unexpected failure.
