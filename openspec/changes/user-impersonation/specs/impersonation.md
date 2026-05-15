# Impersonation — Delta Spec for `user-impersonation`

## Purpose

This spec defines the complete set of requirements for the new user-impersonation capability in Zonar Hub. A sysadmin may start a time-boxed, fully audited session that reflects any target user's exact view of the system — same routes, same permissions, same data visibility — and exit cleanly back to their own profile. The capability MUST be gated behind a sysadmin-only entry point, MUST produce an unambiguous persistent UI indicator, MUST enforce strict permission boundaries, MUST redact or block sensitive write surfaces, and MUST auto-expire on idle or absolute timeout.

---

## Requirements

### Entry point and eligibility

- **REQ-IMP-001**: The system MUST expose an impersonation entry point exclusively within the admin area, accessible only to users who hold the sysadmin permission. No other role SHALL reach this entry point.
- **REQ-IMP-002**: The entry point MUST present a user picker that allows the sysadmin to search for and select any active, non-sysadmin user account within the tenants the sysadmin is authorised to access.
- **REQ-IMP-003**: The system MUST NOT allow a sysadmin to impersonate another sysadmin. Attempts to start an impersonation session targeting a sysadmin account MUST be rejected with an appropriate error message.
- **REQ-IMP-004**: The user picker MUST be implemented using Reactive Forms. The primary "Start impersonation" action MUST remain disabled until a valid target user is selected.
- **REQ-IMP-005**: Before starting an impersonation session, the system MUST present a confirm-dialog that states the target user's display name and role, requiring explicit sysadmin confirmation.
- **REQ-IMP-006**: All text strings in the entry point, picker, and confirm-dialog MUST be supplied via i18n keys with translations for `es`, `en`, and `pt` locales.
- **REQ-IMP-007**: The impersonation entry point MUST be controlled by a feature flag. When the flag is disabled, the entry point MUST NOT be rendered and the `POST /impersonation/start` endpoint MUST return a non-2xx response.

### Session start

- **REQ-IMP-008**: When the sysadmin confirms, the frontend MUST call the backend start endpoint with the selected target user id. The backend MUST validate the sysadmin permission server-side before issuing any token, regardless of client-side guards.
- **REQ-IMP-009**: The backend MUST issue a short-lived impersonation token carrying both the real sysadmin identity and the effective (target) user identity as distinct claims. The exact claim names are decided in design; the spec requires both identities to be present and distinguishable.
- **REQ-IMP-010**: The frontend MUST store the impersonation token in a slot separate from the real session token. The real session token MUST be preserved untouched during the impersonation session so that exit is possible without re-authentication.
- **REQ-IMP-011**: Immediately after the impersonation token is stored, the auth interceptor MUST begin using the impersonation token for all subsequent requests, and the current-user signal MUST reflect the effective (target) user's identity, permissions, and tenant context.
- **REQ-IMP-012**: After the session starts successfully, the frontend MUST redirect to the application root (or a safe default landing) so that the first page the sysadmin sees is rendered under the target user's view.
- **REQ-IMP-013**: A sysadmin MUST NOT have more than one active impersonation session at a time. Starting a new session while one is already active MUST automatically revoke the previous session server-side before the new one is created.

### Persistent banner

- **REQ-IMP-014**: While an impersonation session is active, a non-dismissible banner MUST be visible on every page of the application, including pages reached via internal navigation, deep links, and page refresh.
- **REQ-IMP-015**: The banner MUST display, at minimum: the target user's display name, role, and tenant. It MUST make unmistakably clear that the sysadmin is viewing the system as another user, not as themselves.
- **REQ-IMP-016**: The banner MUST include a clearly labelled "Return to my profile" action (label supplied via i18n key) that initiates the exit flow.
- **REQ-IMP-017**: The banner MUST be styled exclusively using semantic design tokens. No hardcoded colors, spacing values, or font sizes are permitted. The accent/chrome tint MUST be theme-aware, supporting the `court-energy`, `clay-match`, and `night-arena` themes.
- **REQ-IMP-018**: The banner MUST include an `aria-live` region that announces the impersonation state to screen readers when the session starts and when it ends.
- **REQ-IMP-019**: The banner's i18n keys MUST have translations for `es`, `en`, and `pt` locales.

### Session exit — explicit

- **REQ-IMP-020**: When the sysadmin activates the "Return to my profile" action, the frontend MUST call the backend stop endpoint to revoke the impersonation session server-side.
- **REQ-IMP-021**: After a successful stop response, the frontend MUST discard the impersonation token, restore the real session token as the active token, restore the current-user signal to reflect the sysadmin's own identity, and redirect to the admin landing page.
- **REQ-IMP-022**: If the stop endpoint call fails (network error or non-2xx response), the frontend MUST display a toast error and MUST NOT silently remove the impersonation token or silently restore the sysadmin session. The banner MUST remain visible.

### Session exit — idle timeout

- **REQ-IMP-023**: The impersonation token MUST carry an absolute expiry set by the backend (exact duration decided in design). The frontend MUST detect when the impersonation token has expired.
- **REQ-IMP-024**: On detecting token expiry, the frontend MUST automatically exit the impersonation session: discard the impersonation token, restore the real session token, display a toast notification (i18n key, `es`/`en`/`pt`) explaining that the session expired due to inactivity, and redirect to the admin landing page.
- **REQ-IMP-025**: The definition of "activity" for idle-timeout purposes (any authenticated request vs. user-driven navigation only) is decided in design. The spec requires that whatever definition is chosen, it MUST be consistently applied and MUST be tested.

### Session persistence across refresh and new tabs

- **REQ-IMP-026**: Impersonation tokens MUST be stored in a storage tier that persists across a browser page refresh within the same tab. A page refresh MUST NOT silently drop the impersonation session or silently restore the sysadmin view without user action.
- **REQ-IMP-027**: If the impersonation token is present in storage when the application initialises (e.g., after a refresh), the frontend MUST restore the impersonation session state — including the banner — before rendering any other route.
- **REQ-IMP-028**: Whether a new browser tab opened from within the impersonation session inherits the impersonation token is decided in design. The spec requires that the chosen behaviour MUST be explicit, documented, and tested. The default assumption is that storage-tier sharing between tabs inherits the session; design MUST either confirm or override this default.
- **REQ-IMP-029**: The impersonation token MUST NOT be stored in any long-lived storage tier that survives beyond the absolute expiry embedded in the token itself. The application MUST discard any impersonation token whose embedded expiry has passed, regardless of whether a stop call was made.

### Permission boundary

- **REQ-IMP-030**: While an impersonation session is active, all permission checks MUST be evaluated against the effective (target) user's permissions. The sysadmin's own elevated permissions MUST NOT bleed through.
- **REQ-IMP-031**: Backend endpoints that are restricted to sysadmin only MUST return 403 when called with an impersonation token, with the single exception of the stop endpoint and any minimal set of endpoints required to enable exit (whitelisted in design). This whitelist MUST be explicitly enumerated in the design spec.
- **REQ-IMP-032**: The frontend MUST hide UI affordances for sysadmin-only features while an impersonation session is active. Server-side enforcement (REQ-IMP-031) is the source of truth; client-side hiding is a UX convenience only.
- **REQ-IMP-033**: Cross-tenant impersonation MUST be restricted by default to users within the tenants the sysadmin is already authorised to access. Allowing a sysadmin to impersonate a user in a tenant they do not have access to MUST require an explicit configuration setting. The safer default (same-tenant or accessible-tenant only) MUST apply unless the setting is explicitly enabled.

### Sensitive-data blocks

- **REQ-IMP-034**: The following actions MUST be blocked server-side when the request is made under an impersonation token. The frontend MUST also hide the affordances for these actions while impersonating, but server-side enforcement is the authoritative gate:
  - Change password
  - Change email address
  - Manage two-factor / multi-factor authentication
  - Delete account
  - Manage payment methods
- **REQ-IMP-035**: The block in REQ-IMP-034 MUST apply even if the target user's account would normally permit these actions. Impersonation MUST NOT be a vector for a sysadmin to perform irreversible account mutations on behalf of a user.
- **REQ-IMP-036**: The design phase MUST enumerate a complete allow/deny list per feature area for read and write access under impersonation. Until that list is published, the default posture MUST be: read-only for notifications and inbox; fully blocked for payment-instrument actions and account-lifecycle mutations.

---

## Scenarios

### Scenario: Sysadmin starts impersonation successfully

Given the user is authenticated as a sysadmin  
And the impersonation feature flag is enabled  
And the admin users page is open  
When the sysadmin selects an active non-sysadmin user from the user picker  
And the sysadmin confirms the action in the confirm-dialog  
And the backend returns a valid impersonation token  
Then the impersonation token is stored separately from the real session token  
And the auth interceptor begins sending the impersonation token on all requests  
And the current-user signal reflects the target user's identity and permissions  
And the application navigates to the default landing page  
And the non-dismissible impersonation banner is visible with the target user's display name, role, and tenant  
And an `aria-live` announcement is made identifying the impersonated user

### Scenario: Non-sysadmin cannot access the impersonation entry point

Given the user is authenticated with a role other than sysadmin  
When the user navigates to the admin users page or any admin impersonation route  
Then the impersonation entry point is not rendered  
And no call to the start endpoint is possible from the frontend  
And if the start endpoint is called directly, the server returns 403

### Scenario: Sysadmin attempts to impersonate another sysadmin

Given the user is authenticated as a sysadmin  
And the impersonation feature flag is enabled  
When the sysadmin selects a target user who holds the sysadmin role  
Then the user picker or confirm-dialog MUST surface an error preventing the selection  
And if the start endpoint is called directly with a sysadmin target id, the server returns a non-2xx error  
And no impersonation token is issued

### Scenario: Sysadmin exits impersonation via "Return to my profile"

Given an impersonation session is active  
And the banner is visible  
When the sysadmin clicks "Return to my profile"  
And the stop endpoint returns a success response  
Then the impersonation token is discarded from storage  
And the real session token becomes the active token  
And the current-user signal reflects the sysadmin's own identity  
And the application redirects to the admin landing page  
And the impersonation banner is no longer visible  
And an `aria-live` announcement confirms the session has ended

### Scenario: Stop endpoint fails during explicit exit

Given an impersonation session is active  
When the sysadmin clicks "Return to my profile"  
And the stop endpoint returns a non-2xx response or network error  
Then a toast error notification is displayed  
And the impersonation token is NOT removed from storage  
And the banner remains visible  
And the current-user signal still reflects the target user

### Scenario: Impersonation token expires (idle timeout)

Given an impersonation session is active  
And the impersonation token's absolute expiry time has been reached  
When the frontend detects the token has expired  
Then the impersonation token is discarded from storage  
And the real session token becomes the active token  
And a toast notification is displayed explaining the session expired  
And the application redirects to the admin landing page  
And the banner is no longer visible

### Scenario: Impersonation session persists across page refresh

Given an impersonation session is active and the token has not expired  
When the user refreshes the browser page  
Then the application reads the impersonation token from storage on initialisation  
And the impersonation session state is fully restored  
And the banner is visible before any other route renders  
And the current-user signal reflects the target user

### Scenario: Impersonation token found in storage after expiry on startup

Given the browser stores an impersonation token whose embedded expiry has passed  
When the application initialises  
Then the application discards the expired impersonation token without restoring the session  
And the real session token becomes the active token  
And no banner is rendered  
And no stop endpoint call is made (token is already expired)

### Scenario: Sysadmin-only endpoint returns 403 under impersonation

Given an impersonation session is active  
When a request is made to a sysadmin-only endpoint (other than the whitelisted exit endpoints)  
Then the server returns 403  
And the frontend does not expose the sysadmin-only affordance while impersonating

### Scenario: Sensitive write action blocked under impersonation

Given an impersonation session is active  
When a request is made (via the frontend or directly) to change the target user's password  
Then the server returns a non-2xx response (exact status decided in design)  
And the frontend does not render the change-password affordance while impersonating

### Scenario: Sysadmin starts a second impersonation while one is already active

Given an impersonation session is already active for target user A  
When the sysadmin initiates a new impersonation session for target user B  
And the backend auto-revokes the session for user A  
And issues a new impersonation token for user B  
Then the frontend replaces the stored impersonation token with the new token  
And the banner updates to reflect target user B  
And the audit log contains a stop event for user A and a start event for user B

### Scenario: Cross-tenant impersonation blocked by default

Given the sysadmin is operating within tenant T1  
And tenant T2 is not in the sysadmin's accessible tenants list  
When the sysadmin attempts to start an impersonation session targeting a user in tenant T2  
Then the backend rejects the request with a non-2xx response  
And no impersonation token is issued  
And an appropriate error is shown to the sysadmin

### Scenario: Feature flag disabled

Given the impersonation feature flag is disabled  
When the sysadmin navigates to the admin area  
Then the impersonation entry point is not rendered  
And any direct call to `POST /impersonation/start` returns a non-2xx response  
And the banner is never rendered

### Scenario: Banner is theme-aware

Given an impersonation session is active  
When the active theme is `court-energy`, `clay-match`, or `night-arena`  
Then the banner's accent/chrome tint reflects the correct semantic token value for that theme  
And no hardcoded color values are present in the banner's styles
