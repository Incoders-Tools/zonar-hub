# Design — `user-impersonation`

> Companion artifact to `proposal.md` and `specs/impersonation.md`.
> Audience: the apply phase. This document locks the architecture; tasks should not re-debate ADRs unless evidence below is wrong.

---

## 1. Architecture overview

```
                          ┌────────────────────────────────────────────────┐
                          │                Browser (Angular 20)            │
                          │                                                │
                          │  AuthService         ImpersonationService      │
                          │  - realSession$       - active(): Signal       │
                          │  - currentUser$       - target(): Signal       │
                          │  (effective view)     - sessionId, expiresAt   │
                          │       │                       │                │
                          │       └────────┬──────────────┘                │
                          │                ▼                               │
                          │     authTokenInterceptor (selects token)       │
                          │       imp.active() ? imp.token : real.token    │
                          │                │                               │
                          │       <zh-impersonation-banner> renders        │
                          │       only when imp.active() === true          │
                          └────────────────┼───────────────────────────────┘
                                           │ HTTPS, Authorization: Bearer <jwt>
                                           ▼
        ┌────────────────────────────────────────────────────────────────┐
        │              .NET ApiService (zonar-hub-api)                   │
        │                                                                │
        │  JWT auth middleware ──► HttpContextCurrentUser                │
        │     │                      (UserId = sub  = effective user)    │
        │     │                                                          │
        │     ├──► ImpersonationContext (NEW)                            │
        │     │      (IsImpersonating, RealUserId from `act.sub`,        │
        │     │       SessionId from `imp_session_id`)                   │
        │     │                                                          │
        │     ├──► SensitiveActionMiddleware (NEW)                       │
        │     │      block list (password, 2FA, payment, …) when         │
        │     │      IsImpersonating == true                             │
        │     │                                                          │
        │     ├──► ImpersonationAuditFilter (NEW, MediatR pipeline)      │
        │     │      after each authenticated request → insert audit row │
        │     │                                                          │
        │     ▼                                                          │
        │  Endpoints  ── MapImpersonationEndpoints (NEW)                 │
        │               POST /api/admin/impersonation/start              │
        │               POST /api/admin/impersonation/stop               │
        │               GET  /api/admin/impersonation/health             │
        │     │                                                          │
        │     ▼                                                          │
        │  JwtTokenService.GenerateImpersonationToken(...) (NEW method)  │
        │                                                                │
        └─────────────────────────────┼──────────────────────────────────┘
                                      │ Supabase REST (PostgREST)
                                      ▼
        ┌────────────────────────────────────────────────────────────────┐
        │  Postgres (Supabase)                                           │
        │                                                                │
        │  RLS policies bind to JWT `sub` (effective user) — no change   │
        │  NEW tables:                                                   │
        │    impersonation_sessions(id, real_user_id, target_user_id,    │
        │                           started_at, expires_at, revoked_at,  │
        │                           tenant_id, reason)                   │
        │    impersonation_audit(id, session_id, real_user_id,           │
        │                        effective_user_id, method, path, status,│
        │                        ip, user_agent, occurred_at)            │
        └────────────────────────────────────────────────────────────────┘
```

The token swap happens entirely in `authTokenInterceptor`. The rest of the
client treats `currentUser()` as the effective identity and only the new
`ImpersonationService` and `AuthService.realUser()` know about duality.

---

## 2. Token model (decisive)

### 2.1 Claim shape

The impersonation JWT MUST carry these claims (RFC 8693-style "act" claim):

| Claim | Type | Value | Required |
|---|---|---|---|
| `sub` | string (uuid) | **effective** user id (target) | yes |
| `email` | string | target user's email | yes |
| `role` | string | target user's role | yes |
| `tenantId` | string (uuid?) | target user's tenant | yes |
| `jti` | string (uuid) | unique token id | yes |
| `act` | object | `{ "sub": "<real-sysadmin-id>", "email": "<real-email>" }` | yes |
| `imp_session_id` | string (uuid) | matches `impersonation_sessions.id` | yes |
| `imp` | bool | always `true` for impersonation tokens (cheap sentinel) | yes |
| `exp` | number | issued + **30 minutes** (absolute, not slide-extendable) | yes |
| `iat` | number | issuance time | yes |

Non-impersonation tokens do NOT carry `act`, `imp_session_id`, or `imp`. The
existing `JwtTokenService.GenerateAccessToken` is unchanged; a new method
`GenerateImpersonationToken(User target, User realUser, Guid sessionId,
DateTimeOffset expiresAt)` is added.

### 2.2 Why 30 minutes

- Long enough for a meaningful diagnostic session (reproduce + take notes).
- Short enough that a leaked token is contained.
- Matches the existing `AccessTokenMinutes = 30` default, so JWT validation
  cache/clock-skew tuning does not change.
- **Not refreshable.** When the token expires the sysadmin must explicitly
  re-start. This is intentional: forced re-affirmation is a feature, not a bug.

### 2.3 Server-side session record (defence in depth)

The JWT alone is not the source of truth. Every impersonation request is
validated against `impersonation_sessions`:

- `revoked_at IS NULL`
- `expires_at > now()`
- `id = imp_session_id` claim

This lets `POST /stop` invalidate a token before its `exp`. Performed via a
small `IImpersonationSessionStore` consulted in the
`SensitiveActionMiddleware` (and any policy that depends on impersonation).

### 2.4 What does NOT change

- `IJwtTokenService.GenerateAccessToken(User)` — untouched.
- `JwtOptions` — untouched, but a new `JwtOptions.ImpersonationTokenMinutes`
  defaulting to **30** is added (separate from `AccessTokenMinutes` for
  future tuning).
- `HttpContextCurrentUser.UserId` — still resolves from `sub`, which is now
  the effective user. This means **every existing authorization check, RLS
  binding, and repository filter automatically downgrades to the target
  user's identity with zero code changes**.

---

## 3. RLS / authorization strategy

### 3.1 Principle

Supabase RLS policies bind to `auth.jwt() ->> 'sub'` or to claims forwarded
via `request.jwt.claims`. Today they evaluate the calling user. Because the
impersonation token sets `sub = effective_user_id`, **all existing RLS
policies continue to work without modification**.

This is the central insight that makes the dual-claim approach safe.

### 3.2 Policies that need NO change

Anything that currently filters by `user_id = auth.uid()` or by
`tenant_id` derived from the calling user. This covers the vast majority of
read-side policies: tournaments visibility, registration ownership, player
profile reads, organization scoping. We do not enumerate them — the rule is
"if it reads from `sub`, it works."

### 3.3 Policies that MAY need carve-outs

Only one category: rows whose write policy currently checks
`role = 'system_admin'`. Under impersonation the role is the target user's
role, not `system_admin`, so the sysadmin loses the elevated path. **This is
the correct behaviour** — the strict permission boundary requires it. We do
not weaken these policies.

### 3.4 Sensitive endpoints that MUST be blocked server-side

These are blocked by `SensitiveActionMiddleware` when
`ImpersonationContext.IsImpersonating == true`, regardless of whether the
target user normally has access:

| Endpoint pattern | Reason |
|---|---|
| `POST /api/auth/reset-password` | Password change |
| `POST /api/auth/forgot-password` | Password reset trigger |
| `PUT  /api/admin/users/{id}/2fa/*` | Two-factor enrollment/removal |
| `DELETE /api/admin/users/{id}` | Account deletion |
| `POST /api/admin/billing/payment-methods/*` | Payment-instrument writes |
| `DELETE /api/admin/billing/payment-methods/*` | Same |
| `PUT  /api/user-preferences/email` | Email change (would lock the user out) |
| `PUT  /api/auth/me/email` | Same |

Implementation: a small `IEndpointFilter` registered globally that consults
a static `SensitiveRouteRegistry` and returns `403 impersonation.forbidden`
with `Problem`-shaped JSON. Adding/removing entries is a one-line code
change, intentionally not config-driven (this is a security boundary).

### 3.5 Read-only carve-outs (UI + API)

Notifications and private inbox are **readable** under impersonation but
mutations (mark-as-read, delete) are blocked. The same middleware enforces
this by mapping `(method, path)` to `Allowed | ReadOnly | Blocked`.

---

## 4. Backend endpoints (.NET)

### 4.1 Route surface

New endpoint group at
`ZonarHub.ApiService/Endpoints/Admin/System/Impersonation/MapImpersonationEndpoints.cs`,
mounted at `/api/admin/impersonation`.

#### `POST /api/admin/impersonation/start`

Authorization: `[RequireRole("system_admin")]` AND feature flag
`Features:Impersonation:Enabled` must be `true` AND the caller MUST NOT
already be impersonating (no chained impersonation).

Request:
```json
{ "targetUserId": "uuid", "reason": "string (optional, max 500)" }
```

Behaviour:
1. Validate target exists, is active, is in a tenant the sysadmin can access.
2. Reject if target's role is `system_admin` (admin-on-admin forbidden).
3. Insert `impersonation_sessions` row: `(real_user_id, target_user_id,
   started_at = now, expires_at = now + 30min, tenant_id, reason)`.
4. Mint impersonation JWT via `JwtTokenService.GenerateImpersonationToken`.
5. Emit an audit row of type `session_started`.
6. Return:
   ```json
   {
     "token": "eyJ…",
     "tokenType": "Bearer",
     "expiresAt": "2026-05-15T17:00:00Z",
     "sessionId": "uuid",
     "target": { "id": "uuid", "fullName": "…", "email": "…",
                 "role": "player", "tenantId": "uuid" }
   }
   ```

Errors: `400 impersonation.targetInvalid`, `403 impersonation.notSysadmin`,
`409 impersonation.alreadyActive`, `404 impersonation.featureDisabled`.

#### `POST /api/admin/impersonation/stop`

Authorization: must be called WITH an impersonation token (i.e. caller's
JWT has `imp_session_id`). Otherwise `400 impersonation.notImpersonating`.

Behaviour:
1. Look up `impersonation_sessions` by `imp_session_id`.
2. Set `revoked_at = now()`.
3. Emit `session_stopped` audit row.
4. Return `204 No Content`.

The client is responsible for discarding the impersonation token and
resuming use of the real token (still in memory / sessionStorage).

#### `GET /api/admin/impersonation/health`

Anonymous-tolerant: returns `{ "enabled": true|false }` based on the
feature flag. Used by the frontend to hide the admin entry without
embedding the flag in client config.

### 4.2 DTOs

Defined in `ZonarHub.Application.Features.Impersonation.Start` and
`.Stop`, following the existing MediatR command/query pattern (see
`Features/Auth/Login`). Each carries a small validator (FluentValidation
is already in the codebase per the Auth pipeline).

### 4.3 Audit pipeline

There is no pre-existing audit infrastructure in `zonar-hub-api`
(`Grep audit` found only docs and a permissions migration, not an audit
table). We add:

- Migration `2026XXXXXXXXXX_create_impersonation_audit.sql` creating:
  - `impersonation_sessions` (see ASCII diagram for columns)
  - `impersonation_audit` (see ASCII diagram for columns)
  - Indexes on `session_id`, `real_user_id`, `effective_user_id`,
    `occurred_at desc`.
  - RLS: `system_admin` only on both tables.
- A MediatR `IPipelineBehavior<TRequest, TResponse>` named
  `ImpersonationAuditBehavior` registered AFTER auth resolution. It runs
  only when `ImpersonationContext.IsImpersonating`. It captures
  `(method, path, status, real_user_id, effective_user_id, session_id,
  ip, user_agent, occurred_at)`. For non-MediatR endpoints (rare, mostly
  health/metrics) the same logic lives in a small
  `EndpointAuditMiddleware` so we do not miss requests.

Decision: separate table from any future generic audit table. The
impersonation audit has a fixed shape and stricter RLS; coupling it to a
generic `audit_log` we do not yet have would be speculative.

---

## 5. Frontend architecture

### 5.1 New module layout

```
src/app/core/impersonation/
  impersonation.model.ts                 // ImpersonationSession, StartRequest, StartResponse
  impersonation.repository.ts            // interface (per api-integration skill)
  impersonation.service.ts               // start/stop, signals, sessionStorage I/O
  impersonation.service.spec.ts
  impersonation-token.interceptor.ts     // NEW — see §5.4
  impersonation-token.interceptor.spec.ts
  index.ts

src/app/core/repositories/api/
  api-impersonation.repository.ts        // HTTP impl, returns typed DTOs
  api-impersonation.repository.spec.ts
```

### 5.2 `ImpersonationService` signal API

```ts
@Injectable({ providedIn: 'root' })
export class ImpersonationService {
  // null when not impersonating
  readonly session = signal<ImpersonationSession | null>(null);
  readonly active = computed(() => this.session() !== null);
  readonly target = computed(() => this.session()?.target ?? null);
  readonly expiresAt = computed(() => this.session()?.expiresAt ?? null);

  async start(targetUserId: string, reason?: string): Promise<void>;
  async stop(): Promise<void>;
  // Called by interceptor to learn which token to attach
  token(): string | null;
}
```

### 5.3 `AuthService` changes (additive)

```ts
// existing
readonly currentUser = computed(...)   // now: EFFECTIVE user when impersonating
// new
readonly realUser    = computed(...)   // always the sysadmin's own user
readonly isImpersonating = computed(() => this.imp.active())
```

`currentUser` is intentionally rewired to reflect the effective identity so
that everything downstream (menus, permissions, route guards, page chrome,
"hello, X" headers) "just works" without per-call branching. `realUser`
exists for the banner, audit hooks, and any sysadmin-only surface that
must keep showing the sysadmin (there are not many; default to none).

Implementation: `AuthService` injects `ImpersonationService` lazily (via
`Injector` to avoid the cyclic-DI risk) and `currentUser` returns
`this.imp.target() ?? this.sessionState()?.user`.

### 5.4 Token swap at the interceptor

The existing `authTokenInterceptor` is modified — NOT replaced — to ask
`ImpersonationService.token()` first:

```ts
const impToken = inject(ImpersonationService).token();
const token = impToken ?? auth.session()?.token;
```

We also stop injecting the real-session `tenantId` when impersonating;
instead we pass the target user's tenant. The interceptor's logic stays
under 15 lines.

A separate `impersonation-token.interceptor.ts` file is created but its
implementation is folded into `authTokenInterceptor` (no second
interceptor in the chain). The separate file exists only as a unit-testable
helper function exported from the same module.

### 5.5 Storage: ephemeral (decision)

The impersonation token is stored ONLY in:
- **in-memory** signal inside `ImpersonationService`, AND
- **`sessionStorage`** under key `zh_impersonation_session` (mirror).

Not `localStorage`. The reasoning:

- Tab-scoped storage is exactly the contract the proposal called out as the
  lean (refresh-tolerant, new-tab-isolated).
- A leaked DevTools screenshot of localStorage would be cross-tab and
  cross-session. SessionStorage limits blast radius.
- A 30-minute hard cap means refresh resumption is a usability win without
  cumulative risk.

Refresh behaviour: on app boot, `ImpersonationService` constructor reads
`sessionStorage`. If `expiresAt > now`, it rehydrates the signal. Otherwise
it clears the entry. A 400/401 response from any endpoint with an
impersonation token also clears the entry (the server already revoked it).

New tab behaviour: sessionStorage is per-tab → new tab starts WITHOUT
impersonation. The sysadmin sees their own session. This is intentional.

### 5.6 Banner: `<zh-impersonation-banner>`

Location: `src/app/shared/components/zh-impersonation-banner/` (new),
following the existing `zh-select` pattern. Standalone, OnPush, signal-based.

```ts
@Component({ selector: 'zh-impersonation-banner', standalone: true, … })
export class ZhImpersonationBannerComponent {
  readonly targetName  = input.required<string>();
  readonly targetEmail = input<string>('');
  readonly tenantName  = input<string>('');
  readonly expiresAt   = input.required<string>();   // ISO
  readonly exit = output<void>();
}
```

Mounted ONCE in the app shell, just below the top toolbar:

```html
<!-- app shell template, conditional -->
@if (imp.active()) {
  <zh-impersonation-banner
    [targetName]="imp.target()!.fullName"
    [targetEmail]="imp.target()!.email"
    [tenantName]="imp.target()!.tenantName"
    [expiresAt]="imp.expiresAt()!"
    (exit)="onExitImpersonation()" />
}
```

Styling: semantic tokens only.

| Theme | Token | Purpose |
|---|---|---|
| court-energy | `--banner-impersonation-bg`, `--banner-impersonation-fg`, `--banner-impersonation-accent` | warm amber over dark teal |
| clay-match | same tokens, different `_themes.scss` mapping | terracotta accent |
| night-arena | same tokens, different mapping | high-contrast magenta accent |

Tokens are added to `src/styles/_tokens.scss` and mapped per theme in
`_themes.scss`. **No hardcoded color values in the component SCSS.** The
banner uses `position: sticky; top: 0; z-index: <toolbar+1>;` and announces
itself with `aria-live="polite"` on mount.

### 5.7 Admin entry point

New page: `src/app/features/admin/pages/admin-impersonation-page/`.

- Route `/admin/impersonation`, guarded by `systemAdminGuard` AND a new
  `impersonationEnabledGuard` that calls `/api/admin/impersonation/health`
  once and caches the answer.
- Tile added to the system-administration section of the admin home with
  i18n label `admin.impersonation.title`.
- Layout: `zh-collection-view` of users (reuses `admin-users` repository
  already in place — `AdminUserRepository`). On row select, a confirm
  dialog summarises `(real → target, tenant, role, expires in 30 min,
  reason field)` then calls `imp.start(targetId, reason)`. On success,
  navigate to `/` (the target user's home) — the rest of the app already
  knows what to show because `currentUser` is now the target.

User picker UX decision: **`zh-collection-view` page, not `zh-select`
dropdown**. Rationale:
- A dropdown over thousands of users is hostile.
- `zh-collection-view` is the canonical list+card pattern (per memory
  `list_card_pattern.md`) and already does async paging + filtering.
- The "start impersonation" action belongs on a dedicated screen so the
  confirmation surface has room for tenant, role, and reason context.

### 5.8 i18n keys (new)

Locale catalogs `src/assets/i18n/{es,en,pt}.json`. Minimum new keys:

- `admin.impersonation.title`
- `admin.impersonation.intro`
- `admin.impersonation.pickUser`
- `admin.impersonation.reasonLabel`
- `admin.impersonation.reasonPlaceholder`
- `admin.impersonation.start`
- `admin.impersonation.confirmTitle`
- `admin.impersonation.confirmBody`  (params: targetName, role, tenant, minutes)
- `admin.impersonation.confirmCta`
- `admin.impersonation.bannerLabel`  (params: targetName)
- `admin.impersonation.bannerTenant` (params: tenantName)
- `admin.impersonation.bannerExit`
- `admin.impersonation.exitConfirm`
- `admin.impersonation.toastStarted`
- `admin.impersonation.toastStopped`
- `admin.impersonation.toastIdleExit`
- `admin.impersonation.errors.targetInvalid`
- `admin.impersonation.errors.alreadyActive`
- `admin.impersonation.errors.featureDisabled`
- `admin.impersonation.errors.notSysadmin`
- `admin.impersonation.errors.sensitiveBlocked`

---

## 6. Sequence diagrams

### 6.1 Start impersonation

```
Sysadmin    AdminImpersonationPage   ImpersonationService   ApiImpersonationRepo   ApiService           DB
   │                  │                       │                      │                  │                │
   │── select user ──▶│                       │                      │                  │                │
   │                  │── start(uid, reason) ▶│                      │                  │                │
   │                  │                       │── POST /start ──────▶│                  │                │
   │                  │                       │                      │── validate sa ──▶│                │
   │                  │                       │                      │                  │── insert row ─▶│
   │                  │                       │                      │◀── sessionId ────│                │
   │                  │                       │                      │── mint JWT       │                │
   │                  │                       │                      │── audit start ──▶│                │
   │                  │                       │◀── { token, target } │                  │                │
   │                  │                       │── set signal         │                  │                │
   │                  │                       │── sessionStorage     │                  │                │
   │                  │                       │── nav('/')           │                  │                │
   │◀─ banner renders, app reloads as target ──                      │                  │                │
```

### 6.2 Normal request under impersonation (with audit)

```
Component    HttpClient    authTokenInterceptor    ApiService    SensitiveMiddleware   AuditBehavior   DB
   │             │                  │                  │                   │                  │            │
   │── GET /x ──▶│                  │                  │                   │                  │            │
   │             │── attach impJWT ▶│                  │                   │                  │            │
   │             │                  │── HTTPS Bearer ─▶│                   │                  │            │
   │             │                  │                  │── JWT valid? ─────▶                   │            │
   │             │                  │                  │── route in        │                   │            │
   │             │                  │                  │   sensitive list? │── no, pass        │            │
   │             │                  │                  │── handler runs    │                   │            │
   │             │                  │                  │                   │                   │── insert ─▶│
   │             │                  │                  │◀── 200            │                   │            │
   │             │                  │◀── 200           │                   │                   │            │
   │◀── data ────│                  │                  │                   │                   │            │
```

### 6.3 Exit (manual or idle)

```
Sysadmin     Banner    ImpersonationService    ApiService              DB
   │            │              │                    │                    │
   │── click ──▶│              │                    │                    │
   │            │── exit() ───▶│                    │                    │
   │            │              │── POST /stop ─────▶│── set revoked_at ─▶│
   │            │              │                    │── audit stop ─────▶│
   │            │              │◀── 204             │                    │
   │            │              │── clear signal     │                    │
   │            │              │── clear sessionStorage                  │
   │            │              │── reload app shell, currentUser = real  │
   │◀── back to sysadmin view ─────────────────────                       │
```

The same flow runs automatically when the local 30-minute timer fires; the
toast `admin.impersonation.toastIdleExit` is shown instead of
`toastStopped`.

---

## 7. Architecture Decision Records

### ADR-001 — Dual-claim short-lived token vs separate cookie/header

**Decision:** Dual-claim JWT with `sub = effective`, `act.sub = real`,
issued by a dedicated endpoint, stored in a separate client slot from the
real token.

**Alternatives:**
- (A) `X-Impersonate-As: <uuid>` header on the existing sysadmin JWT.
  Rejected — every authorization site would have to consciously downgrade
  from sysadmin to target; any miss is a privilege-escalation bug.
- (B) Cookie-based server-side session keyed to a per-session row, no
  token swap. Rejected — fragments the JWT-bearer auth model and breaks the
  Supabase JWT contract.

**Why this wins:** existing authorization, RLS, repositories, and
interceptors keep treating `sub` as the caller. No code path can forget to
downgrade because the downgrade is in the claim itself. The "act" claim is
RFC-precedented (RFC 8693).

### ADR-002 — Ephemeral (sessionStorage) vs persistent (localStorage)

**Decision:** Ephemeral. `sessionStorage` only, mirrored from an in-memory
signal. Tab-scoped, refresh-tolerant, new-tab-isolated.

**Alternative considered:** `localStorage` for parity with the real-token
storage. Rejected — cross-tab impersonation is confusing (sysadmin opens a
new tab to "check something as themselves" and is still the impersonated
user). The 30-minute hard expiry already bounds risk; cross-tab spread is
pure downside.

### ADR-003 — Strict permission boundary vs additive (sysadmin OR target)

**Decision:** Strict. Under impersonation, the caller has **only** the
target's effective permissions, never the sysadmin's elevated ones. RLS
already enforces this naturally because `sub` is the target.

**Alternative considered:** "Additive" — sysadmin can still hit admin
endpoints while impersonating, for convenience. Rejected — the entire
diagnostic value of impersonation is fidelity. The moment the sysadmin can
do something the target cannot, the reproduction is invalid. Sensitive
endpoints are additionally blocked even when the target normally has them
(§3.4).

### ADR-004 — Cross-tenant impersonation default

**Decision:** Deny cross-tenant by default. The `start` endpoint rejects
target users whose `tenantId` is not in `realUser.tenantIds`. A future
sysadmin-only override flag (`allowCrossTenant: true` in the request body,
gated by an additional permission) MAY be added later but is **out of
scope for the initial release**.

**Why:** the multi-tenant model already partitions data; the platform has
not made a deliberate decision to let any sysadmin see any tenant's data,
and impersonation should not be the side door that does it.

### ADR-005 — Idle timeout duration and definition

**Decision:** **Absolute 30-minute lifetime** on the impersonation token,
**not** a sliding idle window. "Idle" is not measured separately; the
clock starts at `start` and the session dies at `expiresAt` no matter how
active the sysadmin is.

**Alternatives considered:**
- 15-minute absolute. Rejected — too short for thoughtful debugging.
- 60-minute absolute. Rejected — exceeds the existing access-token TTL and
  doubles blast radius.
- Sliding idle (extend on each request). Rejected — defeats the "forced
  re-affirmation" property; an open tab keeps a session alive forever.

The sysadmin can always re-start. Cheap path, no operational pain.

---

## 8. Test strategy (strict TDD)

Strict TDD is active per `openspec/config.yaml` and `sdd-init`. Each layer
below MUST have failing tests first, then implementation, then green.

### 8.1 Backend (`zonar-hub-api`)

- **Endpoint integration tests** (`ZonarHub.Tests` xUnit harness):
  - `start` happy path: sysadmin starts session, response shape matches,
    `impersonation_sessions` row exists, audit row of type `session_started`
    exists.
  - `start` rejects non-sysadmin (`403`).
  - `start` rejects admin-on-admin (`400 targetInvalid`).
  - `start` rejects cross-tenant by default.
  - `start` rejects when feature flag off (`404 featureDisabled`).
  - `start` rejects when caller is already impersonating (`409 alreadyActive`).
  - `stop` revokes the session row and emits `session_stopped` audit.
  - `stop` rejected when called with a non-impersonation token.
  - A normal authenticated request under an impersonation token emits one
    audit row per request and resolves `sub` as the effective user in
    `HttpContextCurrentUser`.
  - Sensitive-route blocking: each entry in §3.4 returns `403
    impersonation.forbidden`.
  - Revoked-session enforcement: a request with a valid (not-yet-expired)
    impersonation JWT whose session is revoked returns `401`.

- **JWT unit tests**: `GenerateImpersonationToken` produces a token whose
  claims match §2.1 exactly; non-impersonation tokens do NOT carry `act` or
  `imp_session_id`.

- **RLS smoke tests** (in `ZonarHub.Tests.Support.Persistence`): one read
  per major data area (tournaments, registrations, profile) executed once
  as sysadmin's real token and once as the impersonation token; assert
  visibility matches the target user's, not the sysadmin's.

### 8.2 Frontend (`zonar-hub`, Karma + Jasmine, `npm run test:ci`)

Use `provideHttpClientTesting()` and `HttpTestingController` everywhere —
matches the existing pattern in `api-admin-user.repository.spec.ts`.

- `impersonation.service.spec.ts`
  - `start(uid)` calls the repository, sets signal, mirrors sessionStorage.
  - `stop()` calls the repository, clears signal and sessionStorage.
  - Boot-time rehydration: a fresh service instance with a non-expired
    entry in sessionStorage exposes `active() === true`.
  - Boot-time expired entry is discarded.
  - 401 response signal: the service exposes a `forceStop()` that the
    interceptor can call.

- `auth-token.interceptor.spec.ts` (updates)
  - When `imp.active() === false`, attaches the real bearer token.
  - When `imp.active() === true`, attaches the impersonation bearer token,
    AND swaps the `X-Tenant-Id` header to the target's tenant.

- `api-impersonation.repository.spec.ts`
  - Each method hits the right URL/verb/body, maps the response into the
    typed model, surfaces error codes via `extractApiErrorCode`.

- `zh-impersonation-banner.component.spec.ts`
  - Renders target name, email, tenant, formatted expiry countdown.
  - Emits `exit` on the exit button.
  - Honours `aria-live="polite"`.

- `admin-impersonation-page.component.spec.ts`
  - Lists users from `AdminUserRepository`.
  - Confirm dialog shows target + reason + countdown copy.
  - On confirm, calls `ImpersonationService.start(...)`.
  - Hides itself when `/health` returns `enabled: false`.

- `auth.service.spec.ts` (updates)
  - `currentUser()` returns the target when impersonating, the real user
    otherwise.
  - `realUser()` always returns the real user.
  - `isImpersonating()` mirrors the service signal.

### 8.3 Cross-cutting

- All HTTP specs use `provideHttpClientTesting()`.
- A single `helpers/build-impersonation-session.ts` factory builds typed
  fixtures shared across specs.
- E2E is unavailable in this project (`testing.layers.e2e.available =
  false`); no e2e tasks are planned.

---

## 9. Rollback and feature flag

### 9.1 Backend

- Config key `Features:Impersonation:Enabled` (boolean, default `false`)
  read via `IOptions<FeaturesOptions>` at startup AND per-request (the
  endpoint group checks it on every call so a config reload disables in
  seconds, not on next restart).
- When `false`:
  - `POST /start` returns `404 impersonation.featureDisabled` (404, not
    403, so a probing attacker cannot enumerate the route).
  - `POST /stop` continues to function so any in-flight session can be
    cleanly closed.
  - `GET /health` returns `{ enabled: false }`.

### 9.2 Frontend

- `ImpersonationService.checkAvailability()` calls `/health` lazily on
  first access (after authentication) and caches the result for the
  session.
- The admin tile and route are hidden when `enabled: false`.
- The interceptor swap logic is dormant when there is no active session,
  so no user-visible effect from leaving the code in place.

### 9.3 Data

- The new tables are additive. Rolling back the feature flag does not drop
  them. A separate "remove impersonation feature" migration would be a
  later destructive change handled by the archive policy.

### 9.4 Token lifetime as natural rollback

- 30-minute hard expiry means any outstanding impersonation token
  self-invalidates within half an hour. No manual revocation campaign is
  required when flipping the flag.

---

## 10. Open items resolved by this design

| Proposal open question | Resolution |
|---|---|
| Exact RLS strategy | §3: `sub = effective_user_id` flows through unchanged. No policy edits. |
| Idle timeout duration | ADR-005: 30 min ABSOLUTE, not sliding. No separate idle metric. |
| Refresh / new-tab persistence | §5.5: sessionStorage. Refresh keeps session; new tab does not. |
| Sensitive-data redaction list | §3.4: enumerated allow/deny/read-only list, server-enforced. |
| Cross-tenant rule | ADR-004: deny by default, no override in this release. |
| Admin-on-admin | §4.1 `start`: rejected with `400 impersonation.targetInvalid`. |
| Banner placement and theme tints | §5.6: sticky below toolbar, three new semantic tokens mapped per theme. |
| User picker UX | §5.7: `zh-collection-view` page, not `zh-select`. |

### 10.1 Deferred to apply phase (with reason)

- **Exact token-format tests for clock-skew tolerance.** Reason: depends on
  the JWT validator config we already have; will be derived empirically
  during the test-writing pass. Deadline: apply phase task 8.x.
- **Banner copy review by product.** Reason: i18n keys are locked but the
  text is editorial. Apply phase will draft initial es/en/pt strings; a
  review pass is expected before merge.
- **Whether to log audit rows for read-only carve-outs (notifications GET).**
  Reason: design says "every authenticated request under impersonation
  audits"; the volume implication for high-frequency reads will only be
  visible once we measure. Apply phase will start with "audit everything"
  and revisit in verify if storage growth is alarming.
