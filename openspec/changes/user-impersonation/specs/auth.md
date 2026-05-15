# Auth — Delta Spec for `user-impersonation`

## Purpose

This spec describes the changes required to the existing authentication layer of Zonar Hub to support a real-token versus impersonation-token swap. The existing auth contract (JWT bearer tokens, interceptor-driven header injection, permission signals, session-timeout service, tenant header) is extended — not replaced — to be aware of an active impersonation session. No currently working auth path is modified in its default (non-impersonation) behaviour. All deltas described here are additive and MUST leave the non-impersonation code paths functionally identical to the pre-change baseline.

---

## Requirements

### Token storage

- **REQ-AUTH-001**: The auth layer MUST maintain two distinct token slots: one for the real sysadmin session token and one for the active impersonation token. The two slots MUST be independently readable, writable, and clearable.
- **REQ-AUTH-002**: The real session token MUST remain in its current storage slot and MUST NOT be modified, overwritten, or cleared when an impersonation session starts.
- **REQ-AUTH-003**: The impersonation token MUST be stored in a slot separate from the real session token. The exact storage tier (sessionStorage, localStorage with expiry metadata, memory-only) is decided in design; the spec requires only that the token is independently addressable and that the application can distinguish which slot holds which token.
- **REQ-AUTH-004**: On application initialisation, the auth layer MUST read both token slots and determine which, if any, is the active token. If a non-expired impersonation token is present, the impersonation session MUST be restored. If the impersonation token is absent or expired, the real session token MUST be used. Determination of expiry MUST use the token's embedded expiry claim, not a local clock assumption.
- **REQ-AUTH-005**: The impersonation token MUST be discarded (slot cleared) when any of the following occur: the stop endpoint returns a success response; the token's embedded expiry is reached; the application detects the token is invalid or tampered.

### Auth interceptor

- **REQ-AUTH-006**: The auth interceptor MUST attach the currently active token to the `Authorization: Bearer` header of every outbound HTTP request that requires authentication.
- **REQ-AUTH-007**: "Currently active token" MUST resolve as: the impersonation token when an impersonation session is active and the token is not expired; the real session token in all other cases. This resolution logic MUST be centralised in a single place so that all interceptor-level code paths call one source of truth.
- **REQ-AUTH-008**: The interceptor MUST NOT require request-level callsites to be aware of whether impersonation is active. The token selection MUST be transparent to the rest of the application.
- **REQ-AUTH-009**: Switching from an impersonation token to a real session token (on exit) MUST take effect on the very next request made after the switch. No stale impersonation token MUST be sent after the switch has occurred.

### Current-user signal

- **REQ-AUTH-010**: The current-user signal MUST reflect the identity of the effective user at all times. While an impersonation session is active, it MUST reflect the target user's display name, role, permissions, and tenant context.
- **REQ-AUTH-011**: When the impersonation session starts, the current-user signal MUST be updated synchronously (before any navigation or page render occurs) to the target user's profile.
- **REQ-AUTH-012**: When the impersonation session ends (explicit exit or idle timeout), the current-user signal MUST be updated to the real sysadmin's profile before any navigation or page render occurs.
- **REQ-AUTH-013**: The current-user signal MUST expose a derived signal or computed property that indicates whether an impersonation session is currently active. Components and services MUST use this derived signal rather than inspecting raw token claims directly.

### Permission service

- **REQ-AUTH-014**: The permission service MUST evaluate all permission checks against the effective user's permissions (i.e., the target user's permissions while impersonating, the sysadmin's own permissions otherwise).
- **REQ-AUTH-015**: The permission service MUST NOT apply sysadmin-level overrides or elevated-permission shortcuts while an impersonation session is active. The effective permission set MUST be derived solely from the current-user signal's active profile.
- **REQ-AUTH-016**: Existing consumers of the permission service (guards, components, pipes) MUST require no changes to benefit from REQ-AUTH-014 and REQ-AUTH-015. The impersonation-aware behaviour MUST be encapsulated within the permission service itself.

### Session-timeout service

- **REQ-AUTH-017**: The session-timeout service MUST be made aware of the impersonation token's expiry in addition to the real session token's expiry. When the impersonation token expires, the service MUST trigger the impersonation exit flow (per REQ-IMP-024 in the impersonation spec) rather than a full logout.
- **REQ-AUTH-018**: Expiry of the impersonation token MUST NOT cause the real session token to be invalidated. The sysadmin MUST remain logged in with their own session after the impersonation session auto-expires.
- **REQ-AUTH-019**: If both the real session token and the impersonation token are expired simultaneously, the real-session expiry flow (full logout) MUST take precedence.

### Tenant-header interceptor

- **REQ-AUTH-020**: The tenant-header interceptor MUST derive the active tenant from the effective user's context (the impersonated user's tenant while impersonating, the sysadmin's active tenant otherwise).
- **REQ-AUTH-021**: The tenant context switch MUST happen atomically with the current-user signal update when the impersonation session starts and ends.

### Impersonation state signal

- **REQ-AUTH-022**: A dedicated impersonation-state signal MUST exist and be readable by any component or service without coupling to token internals. The signal MUST expose at minimum: `isActive: boolean`, `effectiveUser: UserProfile | null`, `realUser: UserProfile | null`.
- **REQ-AUTH-023**: The impersonation-state signal MUST be the single source of truth that the banner, the permission service, and the current-user signal consult to determine whether impersonation is active. Duplicated "is impersonating?" checks scattered across components are prohibited.

### Backward compatibility

- **REQ-AUTH-024**: When no impersonation session is active, all auth-layer code paths MUST behave identically to the pre-change baseline. No new branching logic MUST execute in the hot path for non-impersonation requests.
- **REQ-AUTH-025**: Existing auth spec files (`auth.service.spec`, interceptor specs, `permission.service.spec`, session-timeout spec) MUST be updated to add explicit test variants for the impersonation-active state. Existing test cases MUST continue to pass without modification to their arrange/assert sections.

---

## Scenarios

### Scenario: Impersonation token selected over real token during active session

Given a real session token is stored in the real-token slot  
And a valid, non-expired impersonation token is stored in the impersonation-token slot  
When the auth interceptor processes an outbound request  
Then the `Authorization: Bearer` header contains the impersonation token  
And the real session token is not sent

### Scenario: Real token used when no impersonation session is active

Given a real session token is stored in the real-token slot  
And the impersonation-token slot is empty or holds an expired token  
When the auth interceptor processes an outbound request  
Then the `Authorization: Bearer` header contains the real session token

### Scenario: Token slot switch on impersonation exit takes effect immediately

Given an impersonation session has just been stopped  
And the impersonation token has been discarded from its slot  
When the next HTTP request is made  
Then the `Authorization: Bearer` header contains the real session token  
And no impersonation token is sent

### Scenario: Current-user signal updates on impersonation start

Given a sysadmin is authenticated with their own identity in the current-user signal  
When the impersonation session starts with target user U  
Then the current-user signal is updated to U's display name, role, permissions, and tenant  
And the `isActive` flag on the impersonation-state signal is `true`  
And the `realUser` field on the impersonation-state signal holds the sysadmin's profile

### Scenario: Current-user signal restored on impersonation exit

Given an impersonation session is active with the current-user signal reflecting user U  
When the impersonation session ends (explicit or timeout)  
Then the current-user signal reverts to the sysadmin's own display name, role, permissions, and tenant  
And the `isActive` flag on the impersonation-state signal is `false`  
And the `effectiveUser` field on the impersonation-state signal is `null`

### Scenario: Impersonation session restored on application startup

Given an impersonation token with a future expiry is present in the impersonation-token slot  
When the application initialises  
Then the auth layer reads the impersonation token  
And the current-user signal is set to the token's effective user before any route is rendered  
And the impersonation-state signal reports `isActive: true`  
And the banner is rendered on the first page load

### Scenario: Expired impersonation token discarded on startup

Given an impersonation token whose embedded expiry has passed is present in the impersonation-token slot  
When the application initialises  
Then the auth layer discards the impersonation token from its slot  
And the current-user signal is set to the real session token's user  
And the impersonation-state signal reports `isActive: false`  
And no banner is rendered

### Scenario: Permission service uses target user's permissions while impersonating

Given an impersonation session is active for target user T who lacks the `manage-tournaments` permission  
When a component consults the permission service for `manage-tournaments`  
Then the permission service returns `false`  
And the sysadmin's own `manage-tournaments` permission is not consulted

### Scenario: Session-timeout triggers impersonation exit on token expiry, not full logout

Given an impersonation session is active and the real session token is still valid  
When the impersonation token reaches its expiry time  
Then the session-timeout service triggers the impersonation exit flow  
And the real session token remains valid and becomes the active token  
And the sysadmin is not logged out

### Scenario: Tenant header reflects effective user's tenant under impersonation

Given an impersonation session is active for target user T who belongs to tenant X  
And the sysadmin's own active tenant is Y  
When the tenant-header interceptor processes an outbound request  
Then the tenant header carries tenant X (the effective user's tenant)  
And tenant Y is not sent

### Scenario: No auth change in non-impersonation code path

Given no impersonation session is active  
When the auth interceptor processes a request  
Then the interceptor behaviour is identical to the pre-change baseline  
And no impersonation-specific branching code executes
