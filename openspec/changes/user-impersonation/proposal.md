# Proposal — `user-impersonation`

## Intent
Give the sysadmin a controlled "View system as: <user>" capability so support staff can reproduce a reported issue exactly as the affected user sees it, then exit cleanly back to their own profile. The goal is **diagnostic fidelity**: what the user sees, the sysadmin sees — same routes, same permissions, same data visibility — under a fully audited, time-boxed session.

## Why now
Support currently handles user-reported problems by asking for screenshots, guessing at role/permission state, or temporarily mutating production data. This is slow and error-prone, and several recent issues (admin pages partial rollout, theme/contrast bugs, tournament eligibility) were hard to triage because the sysadmin could not reproduce them without becoming the user. Impersonation closes that gap and replaces ad-hoc workarounds with a single, auditable workflow.

## Scope

### In scope
- Sysadmin-only entry point in the admin area to pick any user and start an impersonation session.
- Backend endpoint pair to **start** and **stop** an impersonation session, gated by a sysadmin permission check.
- A new short-lived token (or token-augmentation) that carries both the real sysadmin identity and the effective (impersonated) identity.
- Frontend auth/state changes so that the active token, current user, permissions, tenant context, and routing reflect the impersonated user.
- Persistent, unmistakable UI indicator (sticky banner with chrome accent + exit action) while impersonation is active.
- Explicit "Return to my profile" exit flow; idle-timeout exit; behavior on refresh/new tab is specified in design.
- Strict permission boundary: while impersonating, the sysadmin acts with the target user's effective permissions — not their own elevated ones.
- Server-side audit log on every request executed under impersonation: real sysadmin id + impersonated user id + action + timestamp.
- i18n keys for all new UI strings in es/en/pt; banner styling via semantic tokens; tests across both repos.

### Out of scope (explicitly called out)
- Self-service "view as my team" or "view as a teammate" for non-sysadmin roles.
- Session recording / replay of an impersonated session (audit log captures requests; UI replay is a separate effort).
- Multiple concurrent impersonations by the same sysadmin, or chained impersonation (sysadmin → user A → user B).
- **Cross-organization impersonation**: today the platform is multi-tenant; impersonating a user from a different organization than the sysadmin's currently active tenant is left as an open tenancy question for design. Default lean: restrict to within the sysadmin's accessible tenants, with an explicit tenant switch if needed.
- Impersonation of other sysadmins (admin-on-admin). Default lean: forbid.
- Write operations on highly sensitive surfaces (see Risks → sensitive data redaction); design will enumerate the allow/deny list.

## Affected modules and packages

### Frontend (`zonar-hub`, Angular 20)
- `src/app/core/auth/` — `auth.service.ts`, `auth-token.interceptor.ts`, `permission.service.ts`, `session-timeout.service.ts`, `tenant-header.interceptor.ts` will need to be aware of an active impersonation token and swap behavior accordingly.
- `src/app/core/impersonation/` (new) — `impersonation.service.ts` (start/stop, state signal), `impersonation.repository.ts` (HTTP contract with backend, per api-integration skill), `impersonation.model.ts` (typed session info), `impersonation.guard.ts` if needed for the entry route.
- `src/app/features/admin/` — new entry surface (likely a route or action on `admin-users-page`) for picking a user and starting a session; reuse `zh-collection-view` / `zh-select` per list+card and forms-and-validation skills.
- `src/app/shared/components/` — new `zh-impersonation-banner` (sticky chrome) styled via semantic tokens; ties into the toast/confirm-dialog primitives for start/stop confirmations.
- i18n catalogs `src/assets/i18n/{es,en,pt}.json` (or equivalent) — new keys for banner, entry point, confirmation flows, errors.
- Tests: spec files for every new component/service plus updates to existing auth specs that assume a single identity.

### Backend (`zonar-hub-api`, .NET 10 + Supabase)
- New endpoint group under `ZonarHub.ApiService/Endpoints/` (working name: `ImpersonationEndpoints`) exposing `POST /impersonation/start` and `POST /impersonation/stop`.
- JWT issuance updates in `ZonarHub.Infrastructure` (or wherever the auth handler lives) to mint impersonation tokens with `original_sub` and `effective_sub` (or equivalent) claims, short TTL, and a server-side session record.
- Authorization handler / policy update so request authorization uses `effective_sub` for permission evaluation while audit logging uses both claims.
- RLS / repository layer: ensure data filters bind to the effective user; verify both `TournamentRepository` and `TournamentAdminRepository` (the known split) behave consistently when the caller is impersonated.
- New audit table or extension of the existing audit pipeline to record `(real_user_id, effective_user_id, request, timestamp)` for every authenticated request executed under impersonation.
- Feature flag at the endpoint level so the capability can be disabled without a redeploy.

## Recommended approach

**Issue a dedicated, short-lived impersonation token from a sysadmin-only endpoint, carrying both identities as claims; the frontend stores it separately from the real token and uses it for all requests until an explicit stop call swaps it back.**

Concretely:
1. Sysadmin calls `POST /impersonation/start` with the target user id. Server validates the sysadmin permission, checks tenancy rules, creates a server-side impersonation session row (id, real_user_id, effective_user_id, started_at, expires_at), and returns a short-lived JWT with `sub = effective_user_id`, additional claim `act = { sub: real_user_id, session_id }`, TTL on the order of 30–60 minutes (design decides exact).
2. Frontend stores the impersonation token in a separate slot from the real token; the auth interceptor uses whichever is "active." The original token is preserved untouched so exit is purely client-side once `stop` is acknowledged.
3. Every backend authorization decision evaluates permissions against `sub` (the effective user). Every audit log row records both `sub` and `act.sub`. RLS policies bind to `sub` as today.
4. UI surfaces an unmistakable banner driven by an `impersonation` state signal in the new core service; the banner offers a single "Return to my profile" action that calls `POST /impersonation/stop` and discards the impersonation token.
5. Refresh, new tab, and idle behavior follow design — the lean is: persist the impersonation token in the same storage tier as the real token so refresh keeps the session, but with an absolute expiry that forces re-confirmation; new tabs inherit the active session; idle timeout auto-exits with a toast.

**Why this approach**
- Keeps the real sysadmin session intact and recoverable — no risk of "locking yourself out as the user."
- Centralizes server-side enforcement on a single claim (`sub`), minimizing churn in repositories and RLS policies.
- Audit is mechanical: one server-side hook records both identities for every authenticated request.
- Token TTL bounds blast radius if a token leaks.
- Feature-flagged at the endpoint, so rollback is a config flip.

### Alternatives considered

**A. Embed `act_as` claim on the existing sysadmin token instead of issuing a new one.**
Pros: simpler flow on the client (one token slot). Cons: the sysadmin's own elevated permissions are still on the token, making "strict permission boundary" much harder to enforce — every authorization check would need to consciously consult `act_as` and downgrade, and any code path that forgets is a privilege-escalation bug. Rejected: violates the principle of least privilege and increases the surface area of "did we remember to check?" code.

**B. Server-side session cookie with no token swap; backend keys off a per-session impersonation row.**
Pros: no token plumbing on the client; impersonation is purely a server concern. Cons: the project's existing auth is JWT-bearer; introducing a parallel cookie-based path would fragment the auth model, complicate interceptors, and confuse Supabase-side flows. Rejected: too much architectural churn for a diagnostic feature.

The recommendation (short-lived dual-claim token, separate client slot) is the smallest safe step that satisfies the audit, boundary, and rollback requirements.

## Risks and mitigations

| Risk | Mitigation (to be detailed in design) |
|---|---|
| Sysadmin performs a destructive action under impersonation thinking they are themselves. | Persistent sticky banner with chrome accent, distinct color/tint per theme via tokens; confirmation dialog on destructive actions under impersonation; banner always visible (not just on first page); restrict writes on highly sensitive surfaces (see below). |
| Impersonation token leaks or persists beyond session. | Short TTL on the token; absolute server-side session expiry; explicit `stop` endpoint invalidates the session row; idle-timeout auto-stop; do not store in long-lived storage tiers without expiry metadata. |
| UI ambiguity — is this me or the user? | Banner with target user's display name, role, and tenant; chrome tint; mandatory `aria-live` announcement; entry/exit toasts in all three locales. |
| RLS policies misbehave with dual identity. | Authorization and RLS evaluate strictly against `sub` (effective user); the dual identity lives in claims and audit only. Test the known TournamentRepository / TournamentAdminRepository split explicitly. |
| Audit gaps — actions slip through unlogged. | Audit hook lives in the auth middleware so it captures every authenticated request; impersonation start/stop are themselves audited; design includes an integration test that exercises a request under impersonation and asserts both ids land in the audit row. |
| Existing tests assume a single identity. | Audit and update auth specs (`auth.service.spec`, interceptor specs, permission.service specs); add explicit impersonation-mode test variants. |
| Sensitive data (private inbox, notifications, payment info) visible or actionable under impersonation. | Design enumerates a redaction/blocking list; default: read-only for notifications and inbox, fully blocked for payment-instrument actions. Server-side enforcement, not just UI. |
| Cross-tenant confusion. | Default-restrict to tenants the sysadmin already has access to; explicit tenant context in the banner; design resolves the exact rule. |

## Rollback plan
- **Backend**: feature flag at the impersonation endpoint group. Flip off → `start` returns 404/403; in-flight sessions can still call `stop` to clean up; no data migration required.
- **Frontend**: hide the admin entry point behind the same feature flag (exposed via existing config). Banner is purely state-driven — with no active session, it never renders.
- **Data**: no schema migration is destructive. The new impersonation-session table and audit-row columns are additive; on rollback they remain but are unused.
- **Tokens**: short TTL means any outstanding impersonation tokens self-expire within an hour; no manual revocation campaign needed.

## Open questions for the design phase
1. **Exact RLS strategy**: confirm that binding RLS to `sub = effective_sub` is sufficient and that no policy depends on a JWT claim the sysadmin token carries but the impersonation token doesn't.
2. **Idle timeout duration**: 15 min? 30 min? Also: what counts as "activity" — any request, or only user-driven navigation?
3. **Refresh / new-tab persistence**: does the impersonation token survive a browser refresh? Survive a new tab? Or is impersonation strictly tab-scoped?
4. **Sensitive-data redaction list**: enumerate, per feature area, what is read-only or blocked under impersonation (notifications, inbox, payment, account-deletion, password change, 2FA setup).
5. **Cross-tenant rule**: can a sysadmin impersonate a user in a tenant the sysadmin does not currently have selected? If yes, does the start endpoint auto-switch tenant, or require an explicit tenant context?
6. **Admin-on-admin**: confirm the default lean (forbid impersonating other sysadmins) and whether there is any exception.
7. **Banner placement and theme tints**: which existing chrome slot hosts the banner, and what is the per-theme token mapping for the accent color (court-energy / clay-match / night-arena)?
8. **User picker UX**: `zh-select` with async search vs a dedicated route reusing `zh-collection-view`. Both are valid; design picks one with rationale.
