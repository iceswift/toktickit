# Lab 3 Sprint Engineering Specification

## 1. Sprint Goal

Deliver TokTickIT's first authenticated operational increment: real Users with
one role, secure local-lab sessions, preserved Requester ticketing, an IT Staff
queue and Ticket workflow, and minimalist Administrator User Management.

## 2. Stakeholder Request Interpretation

The Lab 2 Development Requester selector is replaced by the authenticated User.
Requesters retain their existing owned Ticket and Attachment capabilities; IT
Staff gain an operational queue and controlled Ticket actions; Administrators
manage accounts. The backend, not hidden client controls, enforces every role
and ownership rule.

## 3. Scope

### Included

- Login, logout, current-user retrieval, first-login password change, and
  server-side role-based authorization.
- Migration from `DevelopmentRequester` ownership to authenticated `User`
  ownership without discarding Lab 2 Tickets or Attachments.
- Requester regression, Public Comments, and a non-final “problem appears
  resolved” indication.
- IT Staff queue, Ticket operations, Public Comments, Internal Notes, and
  Attachment continuity.
- Minimalist Administrator User Management and required account safety rules.
- Spec DD, Test DD/TDD, migration/regression tests, E2E, visual checks, PR
  workflow, and final evidence.

### Excluded

- Self-registration, email/password-reset delivery, MFA, social login, SSO,
  user deletion, bulk operations, imports/exports, multiple roles, departments,
  dashboards, SLA/escalation/notification services, Actions Taken, and cloud
  deployment changes.

## 4. Functional Requirements

- FR-01: Active Users authenticate with email and password; inactive accounts
  cannot enter the application.
- FR-02: A User with an initial password can only access Change Password until a
  valid replacement is saved; logout invalidates the authenticated session.
- FR-03: The application shell shows the current User name and role and only
  permitted navigation.
- FR-04: Requester Ticket and Attachment operations derive ownership from the
  authenticated User, not a client-provided requester identifier.
- FR-05: Requesters can add Public Comments and indicate a problem appears
  resolved, without formally resolving or closing the Ticket.
- FR-06: IT Staff can use a paginated Ticket Queue with documented search,
  filter, sort, ownership, status, and priority information.
- FR-07: IT Staff can claim/reassign a Ticket, update IT Priority and permitted
  status transitions, add Public Comments, and add Internal Notes.
- FR-08: Administrators can list/search Users, optionally filter by role, create
  and edit a User, assign exactly one role, activate/deactivate accounts, and
  set a new initial password.
- FR-09: All applicable screens provide meaningful loading, validation, busy,
  success, empty/no-results, forbidden/not-found, conflict, and safe-failure
  feedback.
- FR-10: New and preserved screens use the Lab 2 Zen Green system and remain
  usable at desktop, tablet, and mobile widths.

## 5. Authorization Matrix

| Operation | Requester | IT Staff | Administrator |
|---|---:|---:|---:|
| Own Tickets / Attachments | allowed | no | no |
| Public Comments | own Ticket: read/post | read/post | read-only |
| Problem appears resolved | own Ticket only | no | no |
| IT Staff Queue / operational detail | no | allowed | read-only |
| Claim / reassign / formal status | no | allowed | no |
| IT Priority | no | allowed | allowed |
| Internal Notes | no | read/create | read-only |
| User Management | no | no | allowed |

Administrators remain conceptually separate from IT Staff operations. They have
read-only operational oversight where the role matrix permits it, while formal
status changes remain an IT Staff responsibility. A Ticket Owner may be an
active IT Staff User or active Administrator, as required by the Lab 3 data
model. Backend checks use the current authenticated session for every row above.

## 6. Business Rules

- BR-01: Only an active User with valid credentials can authenticate. Passwords
  are stored only as bcrypt hashes.
- BR-02: Invalid credentials and inactive accounts return safe messages that do
  not disclose extra account information.
- BR-02a: The login endpoint permits at most five failed attempts for the same
  normalized email and source IP in a rolling 15-minute window. Further attempts
  receive the same safe `401` response until the window expires; a successful
  login clears that pair's failure counter. This is rate limiting, not an
  account-lock workflow.
- BR-03: A `mustChangePassword` User cannot use normal application endpoints or
  screens until a valid replacement password is saved.
- BR-04: Authentication uses a random opaque session token in an HttpOnly,
  SameSite=Lax cookie. The database stores only its SHA-256 digest, user, expiry,
  and revocation state. Cookies use `Secure` in HTTPS deployments; local HTTP is
  documented as a development-only exception.
- BR-05: Logout revokes the current session and clears the cookie. Expired,
  revoked, malformed, or missing sessions are unauthenticated.
- BR-06: One User has exactly one role: `REQUESTER`, `IT_STAFF`, or
  `ADMINISTRATOR`.
- BR-07: The authenticated identity, never a client `requesterId`, determines
  Requester ownership. Cross-owner Ticket, Attachment, and Internal Note access
  returns a safe not-found response without data leakage.
- BR-08: Requesters and IT Staff may post Public Comments; these are visible to
  the Ticket Requester, IT Staff, and Administrators. Internal Notes are created
  by IT Staff and visible only to IT Staff and Administrators. Both are
  append-only, backend-authored, timestamped, and reject blank content. After
  trimming, content is limited to 2,000 Unicode characters and is rendered as
  escaped plain text (never trusted HTML).
- BR-09: A Requester may record `problemAppearsResolvedAt`; this does not change
  formal status to Resolved or Closed. Only IT Staff perform formal transitions.
- BR-10: A Ticket has zero or one active IT Staff or Administrator owner. Claim
  assigns the current active IT Staff User; reassignment requires another active
  IT Staff or Administrator target.
- BR-11: `itPriority` starts as the mapped Requested Priority and only IT Staff
  or Administrators can modify it. Requested Priority remains immutable after
  creation.
- BR-12: Statuses are `NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`,
  `RESOLVED`, `CLOSED`, `REOPENED`, and `CANCELLED`. IT Staff transitions are:
  `NEW -> OPEN|IN_PROGRESS|CANCELLED`; `OPEN|REOPENED -> IN_PROGRESS|WAITING_FOR_REQUESTER|RESOLVED|CANCELLED`; `IN_PROGRESS -> WAITING_FOR_REQUESTER|RESOLVED|CANCELLED`; `WAITING_FOR_REQUESTER -> IN_PROGRESS|RESOLVED|CANCELLED`; `RESOLVED -> CLOSED|REOPENED`; `CLOSED -> REOPENED`.
- BR-13: Email addresses are unique case-insensitively; a User cannot deactivate
  themselves; the final active Administrator cannot be deactivated; users are
  deactivated rather than deleted.
- BR-14: Creating/resetting an initial password sets `mustChangePassword = true`.
  A password change clears it only after current/initial password verification,
  valid new password, and confirmation.
- BR-15: Existing Lab 2 Ticket, Attachment, Category, and Related System data
  remains valid. Development Requesters are migrated to Users by unique email;
  Ticket and removal ownership are remapped transactionally.

## 7. Data and Migration Decisions

`User` adds name, normalized unique email, password hash, role, active state,
must-change-password state, and timestamps. `AuthSession` stores a hashed opaque
token, User relation, expiry, and revocation. `Ticket` changes requester
ownership to `requesterUserId`, adds nullable `ownerUserId`, the expanded status
enum, mapped IT Priority, and optional requester-resolution indication. New
`PublicComment` and `InternalNote` models link Ticket and author User.

The migration creates a Requester User for every existing Development Requester,
assigns documented local-only initial passwords, remaps Ticket/Attachment foreign
keys inside a transaction, verifies counts, then removes selector-only client
state. Seed execution is idempotent and supplies at least four active and one
inactive Requester, three active and one inactive IT Staff, one active
Administrator, realistic Tickets, and safe example comments/notes.

## 8. API and UI References

Detailed routes, request/response shapes, cookies, statuses, authorization, and
safe errors are in [api-spec.md](api-spec.md). Screen structure, modes, feedback,
navigation, and responsive rules are in [ui-spec.md](ui-spec.md).

## 9. Acceptance Criteria

- AC-01: Valid active credentials create authenticated access and return the
  permitted current User identity and role.
- AC-02: Initial-password Users must complete valid password change before the
  application shell is available.
- AC-03: After logout, protected API and direct UI access are blocked.
- AC-04: Requester APIs ignore a forged requester identity and never expose
  another User's Ticket or Attachment.
- AC-05: IT Staff Queue returns documented search/filter/sort/pagination results
  and clear state feedback.
- AC-06: IT Staff can perform only permitted ownership, priority, and status
  transitions; invalid transitions are safely rejected.
- AC-07: Public Comments follow visibility rules and Internal Notes are never
  exposed to Requesters.
- AC-08: Administrator User Management supports the required lifecycle while
  blocking duplicate email, self-deactivation, and loss of the last active Admin.
- AC-09: Lab 2 Requester Ticket and Attachment behavior continues after migration
  without the Development Requester selector.
- AC-10: All planned API, UI, authorization, migration/regression, responsive,
  and E2E tests pass from final `main`.

## 10. Product Definition of Done

- All FR, BR, AC, data/API/UI contract decisions, and Test DD items are complete.
- Migration and seed are repeatable and preserve Lab 2 records.
- Protected endpoints authorize on the backend; no secret or plaintext password
  is committed.
- Every AC maps to at least one planned passing test with an actual file path.
- Every Issue reaches `Done` only after linked peer-reviewed PR, reviewer merge
  into `lab3-staging`, tests, and acceptance criteria.
- `reviewer.md`, `ai-use.md`, README, screenshots, final Kanban, and final report
  evidence are current. A reviewer merges the release PR into `main`.

## 11. Assumptions and Decisions

- Local development accounts use documented test-only initial passwords; no real
  secrets or personal passwords are stored in Git.
- Password validation requires 12-128 characters including upper, lower, number,
  and symbol; confirmation must match.
- Sessions expire after eight hours and are invalidated by logout, deactivation,
  password change, or expiry.
- Queue defaults to newest updated Ticket first; exact permitted query values are
  defined in `api-spec.md` before implementation.
