# Audit — Delta Spec for `user-impersonation`

## Purpose

This spec describes the changes required to the existing audit capability of Zonar Hub to support dual-identity recording under impersonation. Every authenticated request executed while an impersonation session is active MUST produce exactly one audit row that carries both the real sysadmin's identity and the effective (target) user's identity. Impersonation lifecycle events (session start and stop) MUST each produce a dedicated audit row with a typed event name. The frontend's responsibility in this spec is limited: it MUST ensure the impersonation token is sent correctly so the backend middleware can extract both identities. All audit persistence is server-side. The frontend MUST NOT attempt to construct or send audit records directly.

---

## Requirements

### General audit row for impersonated requests

- **REQ-AUD-001**: Every authenticated HTTP request executed with an impersonation token MUST cause the backend to write exactly one audit row. A single user action that results in multiple backend requests MAY result in multiple audit rows (one per request); audit deduplication is out of scope for this change.
- **REQ-AUD-002**: Each audit row produced under impersonation MUST contain, at minimum, the following fields:
  - `real_user_id` — the identifier of the sysadmin who initiated the impersonation session
  - `effective_user_id` — the identifier of the target (impersonated) user
  - `endpoint` — the HTTP method and path of the request (e.g., `GET /tournaments/42`)
  - `timestamp` — the UTC timestamp of the request
  - `request_id` — a correlation identifier that links the audit row to the specific request (exact header or mechanism decided in design)
- **REQ-AUD-003**: Audit rows produced under impersonation MUST be distinguishable from standard (non-impersonation) audit rows. The distinguishing mechanism (a boolean flag, a non-null `real_user_id`, or a dedicated `event_type`) is decided in design; the spec requires that a query filtering for "all actions taken under impersonation" is unambiguously possible.
- **REQ-AUD-004**: The audit middleware MUST extract both identities from the impersonation token's claims. It MUST NOT rely on the frontend to pass identity information in a separate header or request body field.
- **REQ-AUD-005**: If an impersonation token is present but either identity claim is missing or malformed, the backend MUST reject the request with a non-2xx response. Audit rows with incomplete identity information MUST NOT be written.

### Lifecycle event audit rows

- **REQ-AUD-006**: When an impersonation session is started (successful `POST /impersonation/start`), the backend MUST write a dedicated audit row with `event_type = 'impersonation.start'`. This row MUST contain: `real_user_id`, `effective_user_id`, `timestamp`, `session_id` (the server-side session record's identifier).
- **REQ-AUD-007**: When an impersonation session is stopped (successful `POST /impersonation/stop` or server-side session expiry), the backend MUST write a dedicated audit row with `event_type = 'impersonation.stop'`. This row MUST contain: `real_user_id`, `effective_user_id`, `timestamp`, `session_id`, and a `reason` field indicating whether the stop was explicit (sysadmin action), timeout, or server-initiated (e.g., a new session replacing the old one).
- **REQ-AUD-008**: The `impersonation.start` audit row MUST be written before the impersonation token is returned to the client. If writing the audit row fails, the session MUST NOT be created and the start endpoint MUST return a non-2xx response.
- **REQ-AUD-009**: The `impersonation.stop` audit row MUST be written as part of the stop transaction. If writing the audit row fails, the session invalidation MUST still proceed (audit failure MUST NOT prevent exit), but the failure MUST be recorded in the application error log.

### Audit coverage and completeness

- **REQ-AUD-010**: The audit hook that captures impersonation request rows MUST live in the backend's authentication middleware (or equivalent request pipeline stage) so that it captures every authenticated request, including those to endpoints the frontend does not know about.
- **REQ-AUD-011**: Requests to the `POST /impersonation/stop` endpoint made under an impersonation token MUST produce an audit row. The stop endpoint is whitelisted for access (per REQ-IMP-031 in the impersonation spec) but it is not exempt from audit.
- **REQ-AUD-012**: Failed requests (those returning 4xx or 5xx) made under an impersonation token MUST also produce an audit row. The audit row MUST include the HTTP response status code.
- **REQ-AUD-013**: The audit pipeline MUST handle the known `TournamentRepository` / `TournamentAdminRepository` split: requests routed through either repository while under impersonation MUST produce audit rows with both identities, regardless of which repository path is used.

### Audit data retention and access

- **REQ-AUD-014**: Audit rows produced under impersonation MUST be stored in the same audit pipeline as all other audit records. No separate audit store is created for impersonation records.
- **REQ-AUD-015**: The audit data schema MUST allow a query to retrieve, for any given impersonation session: all requests made (ordered by timestamp), the start event, and the stop event. The schema design that enables this query is decided in design.
- **REQ-AUD-016**: Audit records MUST be write-once. Once written, an audit row MUST NOT be modified or deleted by the application. Immutability enforcement mechanism is decided in design.

### Frontend obligations

- **REQ-AUD-017**: The frontend MUST ensure the impersonation token (not the real session token) is sent on all requests made during an impersonation session. Failure to do so would cause the backend to classify requests as non-impersonation, creating audit gaps. This requirement is satisfied by REQ-AUTH-006 and REQ-AUTH-007 in the auth spec; it is restated here to make the dependency explicit.
- **REQ-AUD-018**: The frontend MUST NOT construct, populate, or send audit rows or audit metadata fields in request headers or bodies. Audit is a server-side concern only.

---

## Scenarios

### Scenario: Standard request under impersonation produces audit row with both identities

Given an impersonation session is active with sysadmin S impersonating user U  
And the auth interceptor sends the impersonation token on all requests  
When the frontend makes an authenticated request to `GET /tournaments`  
Then the backend writes exactly one audit row  
And the row contains `real_user_id = S`, `effective_user_id = U`, `endpoint = 'GET /tournaments'`, a non-null timestamp, and a non-null request id

### Scenario: Non-impersonation request produces no dual-identity audit row

Given no impersonation session is active  
And the auth interceptor sends the real session token  
When the frontend makes an authenticated request to `GET /tournaments`  
Then the backend does not write an audit row with both `real_user_id` and `effective_user_id` populated  
And the request is logged according to the existing (non-impersonation) audit convention

### Scenario: Impersonation session start produces dedicated audit row

Given the sysadmin S submits a valid start request for target user U  
When the backend successfully creates the impersonation session  
Then the backend writes an audit row with `event_type = 'impersonation.start'`, `real_user_id = S`, `effective_user_id = U`, and a non-null `session_id`  
And this audit row is written before the impersonation token is returned to the client

### Scenario: Audit row failure on start prevents session creation

Given the sysadmin S submits a valid start request for target user U  
When writing the `impersonation.start` audit row fails  
Then the backend does NOT create the impersonation session  
And the backend does NOT return an impersonation token  
And the backend returns a non-2xx response  
And no impersonation session record exists for U

### Scenario: Impersonation session stop (explicit) produces dedicated audit row

Given an impersonation session is active with sysadmin S and effective user U  
When the sysadmin explicitly calls `POST /impersonation/stop`  
Then the backend writes an audit row with `event_type = 'impersonation.stop'`, `real_user_id = S`, `effective_user_id = U`, the matching `session_id`, and `reason = 'explicit'`  
And the session is invalidated  
And the impersonation token is no longer accepted by the backend

### Scenario: Impersonation session stop (timeout) produces dedicated audit row

Given an impersonation session is active with sysadmin S and effective user U  
When the session expires on the server side due to the absolute TTL  
Then the backend writes an audit row with `event_type = 'impersonation.stop'`, the matching `session_id`, and `reason = 'timeout'`  
And subsequent requests using the expired impersonation token are rejected

### Scenario: Impersonation session auto-revoked by new session start produces stop audit row

Given an impersonation session is active with sysadmin S and effective user U1  
When the sysadmin starts a new session for user U2  
Then the backend writes an audit row with `event_type = 'impersonation.stop'` for U1 with `reason = 'superseded'`  
And then writes an audit row with `event_type = 'impersonation.start'` for U2  
And only one active impersonation session exists for S after the operation

### Scenario: Failed request under impersonation still produces audit row

Given an impersonation session is active with sysadmin S impersonating user U  
When the frontend makes a request to an endpoint that returns 403  
Then the backend writes an audit row containing `real_user_id = S`, `effective_user_id = U`, `endpoint`, `timestamp`, `request_id`, and `response_status = 403`

### Scenario: Stop endpoint request under impersonation produces audit row

Given an impersonation session is active with sysadmin S impersonating user U  
When the sysadmin calls `POST /impersonation/stop` (which is whitelisted for access under impersonation)  
Then the backend writes an audit row for the stop-endpoint request itself  
And then writes the `impersonation.stop` lifecycle event row  
And both rows reference the same `session_id`

### Scenario: Impersonation token with missing identity claim is rejected

Given a request is made with a JWT that has an impersonation indicator but is missing the `real_user_id` claim  
When the backend's auth middleware processes the request  
Then the backend rejects the request with a non-2xx response  
And no audit row is written for this request  
And an application error is logged indicating the malformed token

### Scenario: Requests via both TournamentRepository and TournamentAdminRepository produce audit rows

Given an impersonation session is active with sysadmin S impersonating user U  
When a request is processed through `TournamentRepository`  
And separately, another request is processed through `TournamentAdminRepository`  
Then both requests produce audit rows containing `real_user_id = S` and `effective_user_id = U`  
And the audit rows are indistinguishable by repository path (the audit hook runs above the repository layer)

### Scenario: Audit rows are write-once and immutable

Given an audit row has been written for an impersonated request  
When the application or any automated process attempts to update or delete the audit row  
Then the operation is rejected by the data store's immutability enforcement  
And the original audit row is unchanged
