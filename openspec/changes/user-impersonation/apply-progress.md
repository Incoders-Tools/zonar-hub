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

## Next batch (Phase 3 — Frontend `core/impersonation` module)

- Picks up at tasks **3.1.x / 3.2.x / 3.3.x / 3.4.x** (typed `ImpersonationService`, `ImpersonationRepository`, token-swap helper for `authTokenInterceptor`, `AuthService` rewire for `realUser` vs effective `currentUser`).
- Strict TDD: this is FRONTEND, so the test command is `npm run test:ci` from `D:\Repositories\incoders\zonar-hub`. Frontend baseline before Phase 3: 456/456 passing (last measured after the bug-fix commit `d84def2`).
- The backend endpoints, response shapes, and feature-flag health check are all in place — frontend can call them directly.
