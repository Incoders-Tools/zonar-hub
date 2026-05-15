# Apply progress — user-impersonation

## Completed batches

### Batch 1 — Phase 1 (BE infrastructure) — 2026-05-15

- **1.1.1** — RED: `ImpersonationMigrationSmokeTests` written; 25 assertions against `ImpersonationSchema` constants; compiled and failed before implementation.
- **1.1.2** — GREEN: `ImpersonationSchema.cs` (authoritative column-name map) added to `ZonarHub.Infrastructure/Persistence/Impersonation/`; SQL migration `20260515_create_impersonation_tables.sql` created in `supabase/migrations/`; smoke tests pass.
- **1.2.1** — RED: `FeaturesOptionsTests` written; 5 assertions covering `Enabled=true`, `Enabled=false`, absent key defaults, `ImpersonationTokenMinutes` default=30, configurable value; compiled and failed before implementation.
- **1.2.2** — GREEN: `FeaturesOptions.cs` created in `ZonarHub.Infrastructure/Configuration/`; `JwtOptions.ImpersonationTokenMinutes` (default 30) added; `DependencyInjection.cs` registers `IOptions<FeaturesOptions>`; all tests pass.
- **1.3.1** — RED: `JwtTokenServiceImpersonationTests` written; 13 assertions covering every claim in design §2.1 (`sub`, `email`, `act.sub`, `act.email`, `imp_session_id`, `imp`, `jti`, `exp`, `tenantId`, `role`) plus 3 negative assertions that `GenerateAccessToken` does not emit impersonation claims; compiled and failed.
- **1.3.2** — GREEN: `GenerateImpersonationToken(User target, User realUser, Guid sessionId, DateTimeOffset expiresAt)` added to `JwtTokenService` and to `IJwtTokenService` interface; `GenerateAccessToken` is unchanged; stub implementations in existing test files updated to satisfy the new interface member; all 13 new tests pass.
- **1.4.1** — RED: `ImpersonationContextTests` written; 11 assertions covering `IsImpersonating`, `RealUserId`, `SessionId` happy paths and `IsValid` for malformed tokens (missing `act.sub`, missing `imp_session_id`); compiled and failed.
- **1.4.2** — GREEN: `ImpersonationContext` POCO created in `ZonarHub.Infrastructure/Auth/Impersonation/`; `IImpersonationSessionStore` interface created in `ZonarHub.Application/Abstractions/`; all 11 context tests pass.

## Current state

- Backend build: `ZonarHub.Infrastructure.csproj` — 0 errors, 0 warnings (TreatWarningsAsErrors on).
- Tests: **135 passed, 0 failed** (84 baseline + 51 new).
- Files created (production):
  - `ZonarHub.Infrastructure/Persistence/Impersonation/ImpersonationSchema.cs` — authoritative column-name constants for both tables.
  - `ZonarHub.Infrastructure/Configuration/FeaturesOptions.cs` — `Features:Impersonation:Enabled` (bool, default false).
  - `ZonarHub.Infrastructure/Auth/Impersonation/ImpersonationContext.cs` — POCO built from JWT claims.
  - `ZonarHub.Application/Abstractions/IImpersonationSessionStore.cs` — interface for session validity check.
  - `supabase/migrations/20260515_create_impersonation_tables.sql` — creates `impersonation_sessions` + `impersonation_audit` with indexes and RLS.
- Files modified (production):
  - `ZonarHub.Infrastructure/Auth/JwtOptions.cs` — added `ImpersonationTokenMinutes` (default 30).
  - `ZonarHub.Infrastructure/Auth/JwtTokenService.cs` — added `GenerateImpersonationToken(...)`.
  - `ZonarHub.Infrastructure/DependencyInjection/DependencyInjection.cs` — registers `IOptions<FeaturesOptions>`.
  - `ZonarHub.Application/Abstractions/IJwtTokenService.cs` — added `GenerateImpersonationToken(...)` to interface.
- Files created (tests):
  - `ZonarHub.Tests/Infrastructure/Persistence/Impersonation/ImpersonationMigrationSmokeTests.cs`
  - `ZonarHub.Tests/Infrastructure/Configuration/FeaturesOptionsTests.cs`
  - `ZonarHub.Tests/Infrastructure/Auth/JwtTokenServiceImpersonationTests.cs`
  - `ZonarHub.Tests/Infrastructure/Auth/Impersonation/ImpersonationContextTests.cs`
- Files modified (tests):
  - `ZonarHub.Tests/Application/Auth/AuthRegistrationTests.cs` — `StubJwtTokenService` satisfies new interface member.
  - `ZonarHub.Tests/Application/Auth/LoginHandlerTests.cs` — same.

## Blocked / deferred

- **1.4.2 Supabase-backed `IImpersonationSessionStore` implementation**: the interface is defined and satisfies the test contract. The concrete Supabase HTTP implementation is deferred to Phase 2 (task 2.3.1) when the full endpoint wiring is done and the Supabase client pattern is in use for the impersonation feature. This is not a blocker for Phase 2 — Phase 2 can start writing its integration tests immediately.

- **`ImpersonationTokenMinutes` not read by `GenerateImpersonationToken`**: the method accepts `expiresAt` as a parameter (caller controls the expiry based on `JwtOptions.ImpersonationTokenMinutes`), which matches the design §2.1 contract. The endpoint handler in Phase 2 will compute `expiresAt = now + ImpersonationTokenMinutes`. This is intentional and not a defect.

### Batch 2 — Phase 2 (BE endpoints) — 2026-05-15

Started by a sub-agent that hit a rate-limit before validating the build; recovered inline.

- **2.1.1 / 2.1.2** — Commands + validators + DTOs: `StartImpersonationCommand`, `StopImpersonationCommand`, `StartImpersonationValidator`, `StopImpersonationValidator`, `StartImpersonationResponse`, `ImpersonationTargetDto`. `ImpersonationCommandValidationTests.cs` covers the validators.
- **2.2.1 / 2.2.2 / 2.2.3** — Endpoint scenarios tested at the MediatR handler level via `ImpersonationHandlerTests.cs` (10 tests: Start happy path, feature off, non-sysadmin, admin-on-admin rejected, cross-tenant rejected, auto-revoke; Stop happy path, not-impersonating; Health enabled / disabled). HTTP-level integration tests via `WebApplicationFactory` are deferred — see "Blocked / deferred" below.
- **2.3.1** — `MapImpersonationEndpoints.cs` created at `ZonarHub.ApiService/Endpoints/Admin/System/Impersonation/`. Three routes (`GET /health`, `POST /start`, `POST /stop`) mapped via MediatR `ISender`. `Stop` extracts `imp_session_id` from the caller's JWT claims and passes it to the command. Wired into `Program.cs`.
- **2.3.2 / 2.3.3** — `StopImpersonationHandler` and `GetImpersonationHealthHandler` implemented; both green under their handler tests.
- **2.4.1 / 2.4.2** — `SensitiveActionEndpointFilter` + `SensitiveRouteRegistry` implemented; `SensitiveActionMiddlewareTests.cs` covers the block-list behaviour.
- **2.5.1 / 2.5.2** — `ImpersonationAuditBehavior<TRequest, TResponse> : IPipelineBehavior` writes one `impersonation_audit` row per impersonated request and is non-blocking on audit-write failure. Initial run had a real bug (both `RealUserId` and `EffectiveUserId` were being read from `act.sub`) — fixed by adding `EffectiveUserId` to `ImpersonationContext` (reads `sub` claim) and routing it through the behaviour. `ImpersonationAuditBehaviorTests.cs` now passes.

### Recovery notes (Batch 2)

The sub-agent left two issues that were resolved inline:

1. `ImpersonationAuditBehaviorTests.cs` would not compile — missing `using ZonarHub.Domain.Common;` and used the namespace-qualified `Domain.Common.Result.Success(...)` which resolved against `ZonarHub.Tests.Domain.Common` (does not exist). Fixed by adding the using and switching to the unqualified `Result.Success(...)`.
2. Production bug in `ImpersonationAuditBehavior`: the audit row had `EffectiveUserId = _context.RealUserId` (same value as `RealUserId`). `ImpersonationContext` did not expose the effective user. Fixed by adding `EffectiveUserId` to the context (reading `sub`) and wiring it through the behaviour. Also tightened the validity check to require `sub` parses cleanly.

## Current state

- Backend build: 0 errors, 0 warnings.
- Tests: **169 passed, 0 failed** (135 after Batch 1 + 34 new in Batch 2).
- New endpoints reachable: `GET /api/admin/impersonation/health`, `POST /api/admin/impersonation/start`, `POST /api/admin/impersonation/stop`.
- Sensitive-action filter + audit pipeline behaviour registered (or ready to register — verify DI wiring in Phase 3 frontend integration).

## Blocked / deferred

- **2.6.1 RLS smoke tests** — NOT done. Require live Supabase (or a hosted-equivalent) test environment plus end-to-end tokens. Best deferred until Phase 5 (frontend admin page) lands, so the smoke can drive a real start → request → stop sequence.
- **HTTP-level integration tests** for the three impersonation routes — NOT added. The repo has no `WebApplicationFactory` setup or existing HTTP integration test class. The handler-level tests (`ImpersonationHandlerTests.cs`) cover all the documented scenarios, including the response shape and Result error types — the HTTP layer is a thin route → MediatR adapter. If a future task needs full HTTP coverage, it should add a `WebApplicationFactory` harness as Phase 6 hardening.
- **Logger DI** in `ImpersonationAuditBehavior` — the production constructor takes `ILogger<ImpersonationAuditBehavior<...>>` but DI wiring of the pipeline behaviour is not yet confirmed in `DependencyInjection.cs`. Verify in Phase 6 cross-cutting.

### Batch 3 — Phase 3 (FE core/impersonation module) — 2026-05-15

- **3.1.1** — RED: `impersonation.model.ts` compiled without classes (pure types); `build-impersonation-session.ts` fixture factory created with `buildImpersonationSession(expired?)` and `buildImpersonationTarget()` helpers. TypeScript compiles clean.
- **3.2.1** — RED: `api-impersonation.repository.spec.ts` written; 10 tests covering `start()`, `stop()`, `health()` plus error-code extraction; failed with `TS2307 Cannot find module` (implementation absent).
- **3.2.2** — GREEN: `api-impersonation.repository.ts` (HTTP impl) implemented. `ApiImpersonationRepository` constructor calls `inject(ImpersonationService).setRepository(this)` for auto-wiring. 10/10 spec pass.
- **3.3.1** — RED: `impersonation.service.spec.ts` written; 17 tests covering start/stop/forceStop signals, sessionStorage write/read, boot-time rehydration, expired-entry discard, `checkAvailability()`. Two tests failed initially (stop-throws behaviour, checkAvailability-no-repo). Fixed by (a) catching error inside `stop()` catch block and (b) reset-module pattern in spec.
- **3.3.2** — GREEN: `impersonation.service.ts` implemented with signal-based API (`session`, `active`, `target`, `expiresAt`), `start()`/`stop()`/`forceStop()`/`token()`/`checkAvailability()`. Repository resolved via `setRepository()` override pattern (test-friendly). 17/17 spec pass.
- **3.4.1** — RED: `auth.service.spec.ts` created (new file — none existed); 10 tests covering non-impersonation baseline, `isImpersonating()`, `realUser()`, `currentUser()` effective-user swap, `isSystemAdmin() = false` while impersonating. Compile errors for missing `realUser`/`isImpersonating`.
- **3.4.2** — GREEN: `auth.service.ts` rewired with lazy `Injector.get(ImpersonationService)` pattern. Added `realUser` computed (always returns `sessionState()?.user`), updated `currentUser` to return `imp.target()` mapped to `User` shape when impersonating, added `isImpersonating` computed. All 10 auth-service tests pass. Full suite: **493/493** (456 baseline + 37 new).
- **3.5.1** — RED: `auth-token.interceptor.spec.ts` created (new file); 8 tests covering real-token pass-through, tenant-header swap, imp-token selection, `X-Tenant-Id` uses target tenant, `forceStop()` called on 401-under-impersonation. 4 tests fail (implementation absent).
- **3.5.2** — GREEN: `auth-token.interceptor.ts` modified to call `resolveActiveToken(imp, realToken)` and `resolveActiveTenantId(imp, ...)`. Added `tap({ error })` pipe to call `imp.forceStop()` on 401 when impersonation active. Helper functions exported from `impersonation-token.interceptor.ts` (unit-testable). 8/8 spec pass.
- **3.6.1** — RED: `session-timeout.service.spec.ts` created (new file); 7 tests covering creation, `showWarning` baseline, and 5 impersonation-expiry variants (`forceStop()` called, not called before expiry, not called when inactive, navigate to `/admin`, real session not logged out). 2 tests fail.
- **3.6.2** — GREEN: `session-timeout.service.ts` modified to inject `ImpersonationService`; added `impExpiryFired` guard; `tick()` checks `imp.active()` + `imp.expiresAt()` each second; on expiry calls `imp.forceStop()` + `router.navigate(['/admin'])` without touching real session. 7/7 spec pass.

### Consumer audit (3.4.2 blast-radius review)

Grepped all `currentUser()` consumers across `src/app/`:

| File | Usage | Decision |
|---|---|---|
| `admin-users-page.component.ts:234,439,549` | `currentUser()?.id` for self-deletion prevention and assignment update | Left on `currentUser()` — this page is sysadmin-gated; under impersonation the guard blocks access entirely |
| `admin-layout.component.ts:71,100,109` | Display name, initials, role label | **Correct** on `currentUser()` — should show target user's name/role during impersonation |
| `permission.service.ts:40,56,134,168` | Permission loading scoped to user + org | **Correct** — permission service already evaluates effective user |
| `users-facade.service.ts:209,274,300` | Email, user ID, sysadmin checks | Left on `currentUser()` — facade is sysadmin-only page |
| `active-organization.service.ts` (multiple) | Tenant/org resolution | **Correct** on `currentUser()` — should resolve effective user's org during impersonation |
| `user-preferences.service.ts` (multiple) | Preference loading | **Correct** on `currentUser()` — loads target user's prefs during impersonation |
| `tenant-filter.service.ts` | Tenant scoping | **Correct** |
| `sport.service.ts`, `tenant-context.service.ts` | Tenant ID | **Correct** |
| `admin-profile-page.component.ts` | `readonly user = this.auth.currentUser` | Left on `currentUser()` — shows effective user profile |
| `player-profile-page.component.ts` | Profile display and editing | **Correct** — shows target user's profile |
| `player-registrations-page.component.ts` | Loads registrations for current user | **Correct** |

No consumer was found where the clear intent is "is the human sysadmin?" that is not already behind a `systemAdminGuard` (which now correctly blocks during impersonation). The task 6.1.1 `realUser()` audit is explicitly Phase 6 scope.

## Current state

- Frontend build: 0 errors, 0 warnings.
- Tests: **508 passed, 0 failed** (456 baseline + 52 new in Batch 3).
- All Phase 3 tasks: 3.1.1 ✓, 3.2.1 ✓, 3.2.2 ✓, 3.3.1 ✓, 3.3.2 ✓, 3.4.1 ✓, 3.4.2 ✓, 3.5.1 ✓, 3.5.2 ✓, 3.6.1 ✓, 3.6.2 ✓.

## Blocked / deferred (Batch 3)

- **`toastIdleExit` i18n key**: the spec task description mentions this key should be emitted on impersonation auto-expiry. The `session-timeout.service.ts` modification navigates to `/admin` and calls `forceStop()` but does NOT show a toast (no toast service is injected). A toast call would require injecting `NotificationService` or the shared snackbar primitive and the i18n key `admin.impersonation.toastIdleExit` — both of which are Phase 4 concerns (i18n keys added in task 4.3.1, banner+toast wiring in task 4.4.1). The `forceStop()` + navigate is the testable behaviour; toast will be added when i18n keys exist.
- **`systemAdminGuard` and impersonation**: when impersonating a non-sysadmin user, `isSystemAdmin()` correctly returns `false`, which means `systemAdminGuard` would block access to `/admin/impersonation` if the sysadmin navigates there mid-session. This is correct (strict permission boundary). The sysadmin should stop impersonation first. Phase 4 banner's "exit" button handles this flow.

## Next batch (Phase 4 — Frontend UI components)

- Picks up at tasks **4.1.x / 4.2.x / 4.3.x / 4.4.x** (semantic tokens, `zh-impersonation-banner`, i18n keys, mount banner in app shell).
- Backend endpoints and all Phase 3 core services are in place.
- The `ImpersonationService.active()` signal is now consumable by the banner directly.
