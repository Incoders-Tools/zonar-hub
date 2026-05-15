# Tasks — `user-impersonation`

> Generated from: `proposal.md` + `specs/impersonation.md` + `specs/auth.md` + `specs/audit.md` + `design.md`.
> TDD mode: STRICT. Every implementation task is preceded by (or paired with) its test task.
> Prefixes: `[BE]` = zonar-hub-api (.NET) · `[FE]` = zonar-hub (Angular).
> Sequential unless noted as `[PARALLEL]`.

---

## Phase 1 — Backend infrastructure (.NET)

### 1.1 DB migrations

- [x] **1.1.1** `[BE]` Write xUnit migration-smoke tests asserting `impersonation_sessions` and `impersonation_audit` tables exist with correct columns, indexes, and RLS policies (system_admin only).
  _Done when_: tests compile and **fail** (tables absent from test DB schema).

- [x] **1.1.2** `[BE]` Create migration `20260515_create_impersonation_tables.sql`: `impersonation_sessions(id uuid PK, real_user_id uuid NOT NULL, target_user_id uuid NOT NULL, started_at timestamptz NOT NULL, expires_at timestamptz NOT NULL, revoked_at timestamptz, tenant_id uuid NOT NULL, reason text)` + `impersonation_audit(id uuid PK, session_id uuid NOT NULL REFERENCES impersonation_sessions, real_user_id uuid NOT NULL, effective_user_id uuid NOT NULL, method text NOT NULL, path text NOT NULL, status int, ip text, user_agent text, occurred_at timestamptz NOT NULL)` + indexes on `session_id`, `real_user_id`, `effective_user_id`, `occurred_at DESC` + RLS restricting both tables to `system_admin`.
  _Done when_: migration applies cleanly against the Supabase test schema; smoke tests from 1.1.1 are green. (depends on 1.1.1)
  _Satisfies_: REQ-AUD-001, REQ-AUD-002, REQ-AUD-014, REQ-AUD-015, REQ-AUD-016, design §4.3.

### 1.2 Feature-flag plumbing

- [x] **1.2.1** `[BE]` Write xUnit unit tests for `FeaturesOptions` parsing: `Features:Impersonation:Enabled = true` resolves to `true`, absent key resolves to `false`. `[PARALLEL with 1.1.1]`
  _Done when_: tests compile and **fail** (class absent).

- [x] **1.2.2** `[BE]` Add `FeaturesOptions.Impersonation.Enabled` (bool, default `false`) to `ZonarHub.Infrastructure` configuration binding. Register `IOptions<FeaturesOptions>` in DI. Add `JwtOptions.ImpersonationTokenMinutes` (int, default `30`).
  _Done when_: unit tests from 1.2.1 are green; existing `JwtOptions` tests still pass. (depends on 1.2.1)
  _Satisfies_: REQ-IMP-007, design §9.1.

### 1.3 JWT issuance — impersonation token

- [x] **1.3.1** `[BE]` Write xUnit unit tests for `JwtTokenService.GenerateImpersonationToken`:
  - Claims match design §2.1 exactly (`sub = target.id`, `act.sub = realUser.id`, `act.email = realUser.email`, `imp_session_id`, `imp = true`, `jti`, `exp = issued + 30 min`).
  - Non-impersonation token produced by `GenerateAccessToken` does NOT contain `act`, `imp_session_id`, or `imp`.
  _Done when_: tests compile and **fail** (method absent). `[PARALLEL with 1.1.1, 1.2.1]`

- [x] **1.3.2** `[BE]` Add `GenerateImpersonationToken(User target, User realUser, Guid sessionId, DateTimeOffset expiresAt)` to `JwtTokenService`. Must not touch `GenerateAccessToken`. Reads `ImpersonationTokenMinutes` from `JwtOptions`.
  _Done when_: tests from 1.3.1 are green; `GenerateAccessToken` tests still pass. (depends on 1.3.1, 1.2.2)
  _Satisfies_: REQ-IMP-009, design §2.1, §2.4.

### 1.4 ImpersonationContext + IImpersonationSessionStore

- [x] **1.4.1** `[BE]` Write xUnit unit tests for `ImpersonationContext`:
  - When JWT has `imp = true` and all required claims, `IsImpersonating = true`, `RealUserId` and `SessionId` parse correctly.
  - When JWT has no `imp` claim, `IsImpersonating = false`.
  - When JWT has `imp = true` but `act.sub` is absent, middleware returns `401` before context is built.
  _Done when_: tests compile and **fail** (class absent). `[PARALLEL with 1.3.1]`

- [x] **1.4.2** `[BE]` Implement `ImpersonationContext` (POCO extracted from JWT claims in the auth middleware) and `IImpersonationSessionStore` (interface + Supabase-backed implementation: validates `revoked_at IS NULL AND expires_at > now() AND id = sessionId`).
  _Done when_: tests from 1.4.1 are green. (depends on 1.4.1, 1.1.2)
  _Satisfies_: design §1, §2.3, REQ-AUD-004, REQ-AUD-005.

---

## Phase 2 — Backend endpoints (.NET)

_Depends on Phase 1 complete._

### 2.1 MediatR commands and DTOs

- [x] **2.1.1** `[BE]` Write xUnit unit tests for `StartImpersonationCommand` and `StopImpersonationCommand` FluentValidation rules:
  - `StartImpersonationCommand`: `targetUserId` required GUID, `reason` max 500 chars.
  - `StopImpersonationCommand`: `imp_session_id` must be present in calling context.
  _Done when_: tests compile and **fail** (commands absent). `[PARALLEL with 2.2.1]`

- [x] **2.1.2** `[BE]` Implement `StartImpersonationCommand`, `StopImpersonationCommand`, their validators (FluentValidation), and corresponding response DTOs (`StartImpersonationResponse` matching design §4.1 response shape). Follow existing `Features/Auth/Login` pattern.
  _Done when_: validator tests from 2.1.1 are green. (depends on 2.1.1)
  _Satisfies_: design §4.2.

### 2.2 Endpoint integration tests (write first)

- [x] **2.2.1** `[BE]` Write xUnit integration tests (`ZonarHub.Tests`) for all `POST /api/admin/impersonation/start` scenarios:
  - Happy path: 200, response shape, `impersonation_sessions` row inserted, `session_started` audit row written before response returned.
  - Non-sysadmin caller: 403.
  - Admin-on-admin target: 400 `impersonation.targetInvalid`.
  - Cross-tenant target: 400 `impersonation.targetInvalid`.
  - Feature flag off: 404 `impersonation.featureDisabled`.
  - Caller already impersonating: 409 `impersonation.alreadyActive` (previous session auto-revoked, new session created, stop audit row for old session written). `[PARALLEL with 2.1.1]`
  _Done when_: all tests compile and **fail** (endpoint absent).

- [x] **2.2.2** `[BE]` Write xUnit integration tests for `POST /api/admin/impersonation/stop`:
  - Happy path: 204, `revoked_at` set on session row, `session_stopped` audit row written.
  - Called without impersonation token: 400 `impersonation.notImpersonating`.
  - Called with already-revoked session: 400 (idempotent or specific error — implement as 400 to be safe).
  _Done when_: tests compile and **fail** (endpoint absent). `[PARALLEL with 2.2.1]`

- [x] **2.2.3** `[BE]` Write xUnit tests for `GET /api/admin/impersonation/health`:
  - Flag on: `{ enabled: true }` 200.
  - Flag off: `{ enabled: false }` 200.
  - Anonymous caller accepted.
  _Done when_: tests compile and **fail**. `[PARALLEL with 2.2.1]`

### 2.3 Implement endpoints

- [x] **2.3.1** `[BE]` Implement `MapImpersonationEndpoints` at `ZonarHub.ApiService/Endpoints/Admin/System/Impersonation/MapImpersonationEndpoints.cs` exposing all three routes. Wire `StartImpersonationCommand` handler: validate sysadmin, check flag, reject admin-on-admin + cross-tenant, auto-revoke existing session (write `session_stopped` audit), insert `impersonation_sessions` row, call `GenerateImpersonationToken`, write `session_started` audit, return `StartImpersonationResponse`.
  _Done when_: integration tests from 2.2.1 are green. (depends on 2.2.1, 2.2.2, 2.2.3, 2.1.2, 1.3.2, 1.4.2)
  _Satisfies_: REQ-IMP-001, REQ-IMP-003, REQ-IMP-007, REQ-IMP-008, REQ-IMP-009, REQ-IMP-013, REQ-AUD-006, REQ-AUD-007, REQ-AUD-008, design §4.1.

- [x] **2.3.2** `[BE]` Implement `StopImpersonationCommand` handler: look up session by `imp_session_id`, set `revoked_at = now()`, write `session_stopped` audit row (non-blocking — log failure, do not fail response per REQ-AUD-009), return 204.
  _Done when_: integration tests from 2.2.2 are green. (depends on 2.3.1)
  _Satisfies_: REQ-IMP-020, REQ-AUD-007, REQ-AUD-009, REQ-AUD-011, design §4.1.

- [x] **2.3.3** `[BE]` Implement `health` endpoint: reads `IOptions<FeaturesOptions>` per-request, returns `{ enabled }` anonymously.
  _Done when_: integration tests from 2.2.3 are green. (depends on 2.3.1)
  _Satisfies_: design §9.1.

### 2.4 SensitiveActionMiddleware

- [x] **2.4.1** `[BE]` Write xUnit integration tests for each entry in the sensitive-route block list (design §3.4): each blocked endpoint under impersonation returns `403 impersonation.forbidden`; same endpoint under real sysadmin token returns the normal response (or 404 if not fully implemented).
  _Done when_: tests compile and **fail**. `[PARALLEL with 2.2.1]`

- [x] **2.4.2** `[BE]` Implement `SensitiveActionMiddleware` as an `IEndpointFilter` registered globally; consult `SensitiveRouteRegistry` (static readonly dictionary `(method, path-prefix) → AllowedReadOnly|Blocked`); when `ImpersonationContext.IsImpersonating == true` and route is Blocked, return `403` Problem JSON with error code `impersonation.forbidden`; when ReadOnly, reject non-GET methods similarly. Also validate session is not revoked (consult `IImpersonationSessionStore`) — return `401` if revoked.
  _Done when_: tests from 2.4.1 are green. (depends on 2.4.1, 1.4.2)
  _Satisfies_: REQ-IMP-031, REQ-IMP-034, REQ-IMP-035, design §3.4, §3.5, §2.3.

### 2.5 ImpersonationAuditBehavior (MediatR pipeline)

- [x] **2.5.1** `[BE]` Write xUnit integration test: a normal authenticated request under an impersonation token (e.g., any existing GET handler wrapped in MediatR) produces exactly one `impersonation_audit` row with both identities, method, path, status, ip, user_agent, occurred_at. Non-impersonated request produces no such row.
  _Done when_: test compiles and **fails**. `[PARALLEL with 2.4.1]`

- [x] **2.5.2** `[BE]` Implement `ImpersonationAuditBehavior : IPipelineBehavior<TRequest, TResponse>`: runs only when `ImpersonationContext.IsImpersonating`; extracts `(method, path, real_user_id, effective_user_id, session_id, ip, user_agent)`; inserts to `impersonation_audit` after handler completes (captures status); register in DI AFTER auth resolution. Also add `EndpointAuditMiddleware` (non-MediatR paths, e.g. health) for completeness.
  _Done when_: test from 2.5.1 is green; failed requests (4xx/5xx) also produce rows. (depends on 2.5.1, 1.4.2, 1.1.2)
  _Satisfies_: REQ-AUD-001, REQ-AUD-002, REQ-AUD-003, REQ-AUD-004, REQ-AUD-010, REQ-AUD-012, REQ-AUD-013, design §4.3.

### 2.6 RLS smoke tests

- [ ] **2.6.1** `[BE]` Write and run RLS smoke tests: execute one read each against tournaments, registrations, and player-profile endpoints twice — once with sysadmin real token, once with an impersonation token for a regular user — assert that visibility matches the regular user's scope, not the sysadmin's.
  _Done when_: smoke tests pass green. (depends on 2.3.1)
  _Satisfies_: REQ-IMP-030, design §3.1–§3.3, §8.1.

---

## Phase 3 — Frontend core/impersonation module (Angular)

_Can start in parallel with Phase 2 once Phase 1 is complete. Full integration requires Phase 2 endpoints._

### 3.1 Models and test fixtures

- [x] **3.1.1** `[FE]` Create `src/app/core/impersonation/impersonation.model.ts`: interfaces `ImpersonationSession`, `ImpersonationTarget`, `StartImpersonationRequest`, `StartImpersonationResponse`, `ImpersonationHealthResponse`. Create `src/app/core/impersonation/index.ts` barrel. Create `src/app/testing/helpers/build-impersonation-session.ts` factory (shared fixture builder for all specs).
  _Done when_: TypeScript compiles; factory exports typed stubs for use in specs. `[PARALLEL with Phase 2]`
  _Satisfies_: design §5.1, §8.3.

### 3.2 ImpersonationRepository

- [x] **3.2.1** `[FE]` Write `src/app/core/repositories/api/api-impersonation.repository.spec.ts` using `provideHttpClientTesting()`:
  - `start(req)` POSTs to `/api/admin/impersonation/start`, returns typed `StartImpersonationResponse`.
  - `stop()` POSTs to `/api/admin/impersonation/stop`, returns void.
  - `health()` GETs `/api/admin/impersonation/health`, returns `ImpersonationHealthResponse`.
  - Error responses surface error codes via `extractApiErrorCode`.
  _Done when_: tests compile and **fail**. (depends on 3.1.1) `[PARALLEL with 3.3.1]`

- [x] **3.2.2** `[FE]` Implement `src/app/core/impersonation/impersonation.repository.ts` (interface) and `src/app/core/repositories/api/api-impersonation.repository.ts` (HTTP implementation). Follow the api-integration skill: no direct HttpClient in components; repository returns typed observables/promises; error codes extracted via `extractApiErrorCode`.
  _Done when_: tests from 3.2.1 are green. (depends on 3.2.1)
  _Satisfies_: REQ-AUTH-006, REQ-AUD-017, design §5.1.

### 3.3 ImpersonationService

- [x] **3.3.1** `[FE]` Write `src/app/core/impersonation/impersonation.service.spec.ts`:
  - `start(uid, reason)` calls repository, sets `session` signal, writes to sessionStorage under `zh_impersonation_session`.
  - `stop()` calls repository, clears signal and sessionStorage.
  - Boot-time rehydration: service instantiated with a non-expired sessionStorage entry → `active() === true`.
  - Boot-time expired entry is discarded → `active() === false`.
  - `forceStop()` clears signal and sessionStorage without calling repository (used by interceptor on 401).
  - `token()` returns impersonation token string when active, null otherwise.
  - `checkAvailability()` calls repository `health()`, caches result for session.
  _Done when_: tests compile and **fail**. (depends on 3.1.1) `[PARALLEL with 3.2.1]`

- [x] **3.3.2** `[FE]` Implement `src/app/core/impersonation/impersonation.service.ts` per design §5.2 signal API: `session`, `active`, `target`, `expiresAt` signals/computed; `start`, `stop`, `forceStop`, `token`, `checkAvailability` methods; sessionStorage I/O under key `zh_impersonation_session`; constructor reads sessionStorage and rehydrates or discards based on `expiresAt > now`.
  _Done when_: tests from 3.3.1 are green. (depends on 3.3.1, 3.2.2)
  _Satisfies_: REQ-IMP-010, REQ-IMP-023, REQ-IMP-026, REQ-IMP-027, REQ-IMP-029, REQ-AUTH-001, REQ-AUTH-003, REQ-AUTH-004, REQ-AUTH-005, REQ-AUTH-022, REQ-AUTH-023, design §5.2, §5.5, §9.2.

### 3.4 AuthService rewire

- [x] **3.4.1** `[FE]` Update `src/app/core/auth/auth.service.spec.ts` with new impersonation-mode variants:
  - `currentUser()` returns target user when `ImpersonationService.active() === true`.
  - `currentUser()` returns real sysadmin when `active() === false`.
  - `realUser()` always returns the sysadmin's own user regardless of impersonation state.
  - `isImpersonating()` mirrors `ImpersonationService.active()`.
  - Existing test cases continue to pass without changes to their arrange/assert.
  _Done when_: new test cases compile and **fail**. (depends on 3.3.2)
  _Satisfies_: REQ-AUTH-025, design §5.3, §8.2.

- [x] **3.4.2** `[FE]` Rewire `AuthService`: inject `ImpersonationService` lazily via `Injector` (avoid cyclic DI); add `realUser = computed(...)` returning sysadmin identity always; change `currentUser` to `computed(() => this.imp.target() ?? this.sessionState()?.user)`; add `isImpersonating = computed(() => this.imp.active())`.
  _Done when_: tests from 3.4.1 are green; `npm run test:ci` baseline (456/456) still passes. (depends on 3.4.1)
  _Satisfies_: REQ-AUTH-010, REQ-AUTH-011, REQ-AUTH-012, REQ-AUTH-013, REQ-AUTH-014, REQ-AUTH-015, REQ-AUTH-016, design §5.3.

### 3.5 Auth token interceptor rewire

- [x] **3.5.1** `[FE]` Update `src/app/core/auth/auth-token.interceptor.spec.ts` with impersonation variants:
  - `imp.active() === false` → `Authorization: Bearer <real-token>`.
  - `imp.active() === true` → `Authorization: Bearer <imp-token>` + `X-Tenant-Id` header reflects target user's tenant (not sysadmin's).
  - Immediately after impersonation stop (token cleared), next request uses real token.
  - On 401 response with active impersonation token → calls `ImpersonationService.forceStop()`.
  _Done when_: new tests compile and **fail**. (depends on 3.4.2)
  _Satisfies_: REQ-AUTH-025.

- [x] **3.5.2** `[FE]` Modify `src/app/core/auth/auth-token.interceptor.ts` to ask `ImpersonationService.token()` first; if non-null, attach it as Bearer; also derive tenant from `ImpersonationService.target()?.tenantId` when impersonating. Create helper function in `src/app/core/impersonation/impersonation-token.interceptor.ts` (unit-testable, exported, consumed by the existing interceptor — no second interceptor in chain per design §5.4). On 401, call `forceStop()` if impersonation is active.
  _Done when_: tests from 3.5.1 are green. (depends on 3.5.1, 3.3.2)
  _Satisfies_: REQ-AUTH-006, REQ-AUTH-007, REQ-AUTH-008, REQ-AUTH-009, REQ-AUTH-020, REQ-AUTH-021, REQ-AUTH-024, design §5.4.

### 3.6 Session-timeout service integration

- [x] **3.6.1** `[FE]` Update session-timeout service spec to add impersonation-expiry variants:
  - When impersonation token expires and real token is still valid → `ImpersonationService.forceStop()` is called, real session is intact.
  - When both tokens expire → real-session logout takes precedence.
  - `toastIdleExit` i18n key is emitted on impersonation auto-expiry.
  _Done when_: tests compile and **fail**. (depends on 3.3.2)

- [x] **3.6.2** `[FE]` Modify `session-timeout.service.ts` to watch `ImpersonationService.expiresAt()`; set a client-side timer; when it fires, call `ImpersonationService.forceStop()` and emit the idle-exit toast, then redirect to admin landing — without touching the real session.
  _Done when_: tests from 3.6.1 are green. (depends on 3.6.1, 3.4.2)
  _Satisfies_: REQ-IMP-023, REQ-IMP-024, REQ-AUTH-017, REQ-AUTH-018, REQ-AUTH-019, design §6.3, ADR-005.

---

## Phase 4 — Frontend UI components

_Depends on Phase 3 complete._

### 4.1 Semantic tokens

- [ ] **4.1.1** `[FE]` Add three new semantic tokens to `src/styles/_tokens.scss`: `--banner-impersonation-bg`, `--banner-impersonation-fg`, `--banner-impersonation-accent` with default values. Add per-theme overrides in `src/styles/_themes.scss` for `court-energy` (warm amber/dark teal), `clay-match` (terracotta), and `night-arena` (high-contrast magenta) per design §5.6.
  _Done when_: `npm run build` is green; no hardcoded color values in the new declarations; existing theme tests pass. `[PARALLEL with 4.2.1]`
  _Satisfies_: REQ-IMP-017, design §5.6.

### 4.2 zh-impersonation-banner component

- [ ] **4.2.1** `[FE]` Write `src/app/shared/components/zh-impersonation-banner/zh-impersonation-banner.component.spec.ts`:
  - Renders `targetName`, `targetEmail`, `tenantName`, formatted expiry countdown.
  - Emits `exit` output when exit button is clicked.
  - Has `aria-live="polite"` attribute.
  - Uses only CSS custom properties (no hardcoded colors) — inspect host element styles.
  - i18n keys `admin.impersonation.bannerLabel`, `bannerTenant`, `bannerExit` are present in template.
  _Done when_: tests compile and **fail**. `[PARALLEL with 4.1.1]`

- [ ] **4.2.2** `[FE]` Implement `src/app/shared/components/zh-impersonation-banner/zh-impersonation-banner.component.ts` and `.html` and `.scss`: standalone, OnPush, signal-based inputs (`targetName` required, `targetEmail`, `tenantName`, `expiresAt` required) and `exit` output; sticky below toolbar via `position: sticky; top: 0; z-index: <toolbar+1>`; `aria-live="polite"` region; all colours via `var(--banner-impersonation-*)` tokens; labels via i18n keys. Export from shared barrel.
  _Done when_: tests from 4.2.1 are green; `npm run build` green. (depends on 4.2.1, 4.1.1)
  _Satisfies_: REQ-IMP-014, REQ-IMP-015, REQ-IMP-016, REQ-IMP-017, REQ-IMP-018, design §5.6.

### 4.3 i18n keys

- [ ] **4.3.1** `[FE]` Add all 21 i18n keys from design §5.8 to `src/assets/i18n/es.json`, `en.json`, and `pt.json`. Keys: `admin.impersonation.title`, `.intro`, `.pickUser`, `.reasonLabel`, `.reasonPlaceholder`, `.start`, `.confirmTitle`, `.confirmBody`, `.confirmCta`, `.bannerLabel`, `.bannerTenant`, `.bannerExit`, `.exitConfirm`, `.toastStarted`, `.toastStopped`, `.toastIdleExit`, `.errors.targetInvalid`, `.errors.alreadyActive`, `.errors.featureDisabled`, `.errors.notSysadmin`, `.errors.sensitiveBlocked`.
  _Done when_: `npm run build` green; no missing-key warnings in test output; all three locale files have all 21 keys. `[PARALLEL with 4.2.1]`
  _Satisfies_: REQ-IMP-006, REQ-IMP-019, design §5.8.

### 4.4 Banner mounted in app shell

- [ ] **4.4.1** `[FE]` Mount `<zh-impersonation-banner>` in the app shell template (`app.component.html` or the root layout shell) using `@if (imp.active())` guard, bound to `imp.target()` and `imp.expiresAt()` signals; wire `(exit)` to `onExitImpersonation()` handler that calls `ImpersonationService.stop()` then redirects to admin landing on success, shows toast error and keeps banner on failure.
  _Done when_: banner renders during an active impersonation session and is absent otherwise; manual test (Phase 7) confirms. (depends on 4.2.2, 3.3.2)
  _Satisfies_: REQ-IMP-014, REQ-IMP-020, REQ-IMP-021, REQ-IMP-022, design §5.6.

---

## Phase 5 — Frontend admin page

_Depends on Phase 3 complete. Can run in parallel with Phase 4._

### 5.1 impersonationEnabledGuard

- [ ] **5.1.1** `[FE]` Write spec for `impersonationEnabledGuard`: calls `ImpersonationService.checkAvailability()`; returns `true` when enabled, `UrlTree` to admin home when disabled.
  _Done when_: test compiles and **fails**. `[PARALLEL with Phase 4]`

- [ ] **5.1.2** `[FE]` Implement `src/app/core/impersonation/impersonation-enabled.guard.ts`.
  _Done when_: test from 5.1.1 is green. (depends on 5.1.1, 3.3.2)
  _Satisfies_: REQ-IMP-007, design §5.7, §9.2.

### 5.2 Admin impersonation page

- [ ] **5.2.1** `[FE]` Write `src/app/features/admin/pages/admin-impersonation-page/admin-impersonation-page.component.spec.ts`:
  - Lists users from `AdminUserRepository` via `zh-collection-view` (filter, pagination, empty/loading/error states).
  - User picker uses Reactive Form; "Start impersonation" button disabled until valid user selected.
  - Confirm dialog shows target name, role, tenant, `reason` field, 30-min countdown copy.
  - On confirm, calls `ImpersonationService.start(targetId, reason)`.
  - After successful start, navigates to `/`.
  - When `/health` returns `enabled: false`, page is not accessible (guard blocks).
  _Done when_: tests compile and **fail**. (depends on 5.1.2, 3.3.2)

- [ ] **5.2.2** `[FE]` Implement `admin-impersonation-page.component.ts` and `.html` and `.scss`:
  - Route `/admin/impersonation` in admin routing module.
  - Guards: `systemAdminGuard` AND `impersonationEnabledGuard`.
  - `zh-collection-view` user picker sourced from `AdminUserRepository`; filter panel; pagination.
  - Reactive Form with `targetUserId` control; "Start impersonation" CTA disabled when null.
  - Confirm dialog (reuse existing `zh-confirm-dialog` or closest primitive) with target name, role, tenant, optional reason textarea, expiry notice.
  - On confirm → `imp.start()` → navigate to `/` on success.
  - All text via i18n keys from 4.3.1.
  _Done when_: tests from 5.2.1 are green; `npm run build` green. (depends on 5.2.1, 4.3.1, 5.1.2)
  _Satisfies_: REQ-IMP-001, REQ-IMP-002, REQ-IMP-003, REQ-IMP-004, REQ-IMP-005, REQ-IMP-006, REQ-IMP-007, REQ-IMP-008, REQ-IMP-012, design §5.7.

### 5.3 Admin nav tile

- [ ] **5.3.1** `[FE]` Add impersonation tile to the System Administration section of the admin home page/nav. Label via i18n key `admin.impersonation.title`. Show only when `impersonationEnabledGuard` would pass (i.e., read `ImpersonationService`'s cached availability). Add spec assertion that tile is absent when feature disabled.
  _Done when_: tile visible in admin nav when flag on; absent when flag off; build green. (depends on 5.2.2)
  _Satisfies_: REQ-IMP-007, design §5.7.

---

## Phase 6 — Cross-cutting concerns

_Depends on Phases 3–5. Can partially run in parallel._

### 6.1 Audit existing currentUser sysadmin comparisons

- [ ] **6.1.1** `[FE]` Search codebase for all patterns that compare `currentUser().id`, `currentUser().role`, or similar to a sysadmin constant or use `currentUser()` in sysadmin-gating logic. Replace with `realUser().id` / `realUser().role` where the intent is "is the actual human a sysadmin" rather than "is the effective user a sysadmin". Document every changed callsite in a comment.
  _Done when_: `npm run test:ci` still green; no regressions in admin guard behaviour; grep for pattern shows 0 remaining instances of the anti-pattern. `[PARALLEL with 6.2.1]`
  _Satisfies_: design §5.3, risk note in proposal §Risks, REQ-AUTH-023.

### 6.2 Cross-tenant enforcement (backend)

- [ ] **6.2.1** `[BE]` Verify (or add targeted test) that the `start` endpoint integration test for cross-tenant rejection covers the exact tenancy check: target user's `tenantId` not in `realUser.tenantIds` → 400 `impersonation.targetInvalid`. Confirm `SensitiveActionMiddleware` does not accidentally bypass this check.
  _Done when_: test is explicit and green; no regression in same-tenant happy path. `[PARALLEL with 6.1.1]`
  _Satisfies_: REQ-IMP-033, ADR-004, design §4.1.

### 6.3 Permission service explicit test

- [ ] **6.3.1** `[FE]` Add spec for `PermissionService` (or wherever permissions are evaluated) asserting that while impersonating a user without `manage-tournaments`, the service returns `false` even though the real sysadmin has that permission; and that when impersonation ends, the sysadmin's permission is restored.
  _Done when_: test is green; existing permission specs unmodified. (depends on 3.4.2)
  _Satisfies_: REQ-AUTH-014, REQ-AUTH-015, REQ-AUTH-016.

---

## Phase 7 — Verification

_Depends on all previous phases complete._

### 7.1 Full test suite baseline

- [ ] **7.1.1** `[FE]` Run `npm run test:ci`. Must report 456 existing tests + all new tests green. Zero failures.
  _Done when_: exit code 0, no skipped/pending tests.

- [ ] **7.1.2** `[BE]` Run `dotnet build` (no warnings on new files) + `dotnet test`. Must report all existing tests + all new tests green.
  _Done when_: exit code 0.

### 7.2 Build sanity

- [ ] **7.2.1** `[FE]` Run `npm run build` (production). Must succeed with no new errors or warnings related to the impersonation feature.
  _Done when_: exit code 0.

### 7.3 Manual test plan

- [ ] **7.3.1** `[FE+BE]` Execute manual test checklist (can be run by the developer during apply):
  - [ ] Start impersonation: pick a non-sysadmin user, confirm dialog appears with correct name/role/tenant, "Start" calls backend, banner appears, app is now showing user's view.
  - [ ] Banner persists on navigation (go to several pages).
  - [ ] Page refresh: impersonation session is restored, banner present.
  - [ ] New tab: no impersonation active (tab-isolated).
  - [ ] "Return to my profile": banner disappears, sysadmin view restored, admin landing page shown.
  - [ ] Stop endpoint failure: simulate offline; banner remains, toast error shown.
  - [ ] Sensitive action blocked: attempt password-change flow; server returns 403; frontend hides affordance.
  - [ ] Audit row visible: query `impersonation_audit` table for the session; start row, request rows, stop row all present with both user IDs.
  - [ ] Admin-on-admin rejected: attempt to impersonate a sysadmin; error shown.
  - [ ] Feature flag off: set `Features:Impersonation:Enabled = false`; admin tile disappears; direct POST to `/start` returns 404.
  - [ ] All three themes: verify banner accent tint changes correctly for `court-energy`, `clay-match`, `night-arena`.
  _Done when_: all checkboxes manually confirmed; any failures filed as bugs before merge.

---

## Out of scope (deferred)

The following items are explicitly excluded from this change and MUST NOT be implemented during the apply phase:

- **Self-service "view as teammate"** for non-sysadmin roles.
- **Session recording / replay** of impersonation sessions (audit log is the record; replay is a separate effort).
- **Multiple concurrent impersonations** by the same sysadmin.
- **Chained impersonation** (sysadmin → user A → user B at the same time; starting a new session auto-revokes the previous, which IS in scope).
- **Cross-organization impersonation** with an override flag (`allowCrossTenant: true` in request body) — default-deny is in scope; the override flag is not.
- **Impersonation of other sysadmins** (admin-on-admin).
- **Generic / reusable audit table** — the `impersonation_audit` table is purpose-built and intentionally not coupled to a generic audit log we do not yet have.
- **E2E tests** — `testing.layers.e2e.available = false` per sdd-init; no e2e tasks are planned.
- **Banner copy product review** — i18n strings will be drafted in apply; editorial review is a post-apply step before merge.
- **Clock-skew tolerance tuning** for impersonation token expiry — deferred to apply/verify empirical pass.
- **Audit volume review for high-frequency reads** — start with "audit everything"; revisit in verify if storage growth is a concern.
- **`allowCrossTenant` permission flag** for future cross-tenant scenarios.
- **Sliding idle-timeout** — ADR-005 decided absolute 30-min; no sliding window to implement.
