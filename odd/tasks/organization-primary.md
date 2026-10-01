# Persistent primary organization

## Objective
Let an admin with multiple assigned active organizations choose one persisted primary organization, independently of the active context. Display the primary first with a badge only for multiple organizations, warn before replacing an existing primary, and reflect renames without a page reload.

## Scope and constraints
- API is the authority: `users.organization_id` is the primary; reject selecting an unassigned/inactive organization. Use authenticated caller identity, never a caller-provided user ID. A dedicated, documented self-service API avoids the broad admin-user update contract. No migration or parallel preference store unless evidence requires one.
- Active switching must not persist a primary change. Creating a further organization must not silently replace an existing primary; the first/only organization is primary. Keep other assignments intact.
- The interface shows the primary first; with one organization do not show a badge. For a replacement, confirm the prior primary loses the designation before saving. Keep current active context unless the organization itself changes.
- Frontend on `dev`, API on `main` by explicit user branch choice. No push until relevant checks pass. Two repositories, one feature document in frontend, backend path recorded here.
- TDD mode: frontend repository `openspec/config.yaml` strict_tdd true (repo config); frontend runner `npm run test:ci`. API repo mandates tests for changes in AGENTS.md; runner `dotnet test ZonarHub.Tests/ZonarHub.Tests.csproj`. Require RED/GREEN on added behavior where feasible. No user request to skip tests on this feature.
- Delivery strategy: ask-on-risk; actual frontend candidate is about 450 authored lines with tests/docs. User chose two functional commits directly on `dev`: core state/CRUD and selector UI; no PR or branch chain requested. Every work unit has its own commit. No production deployment assumed.

## Tasks
- [x] OP-1 API: introduced authenticated `PUT /api/user-preferences/primary-organization` with `AdminOrAbove` policy and handler checks for persisted caller role, assigned and active organization; updates `User.OrganizationId` only. OpenAPI documented and nine focused tests added. Focused 9/9, full API suite 178/178 after OP-B, isolated solution build passed (two NU1903 warnings); independent verification and parent `git diff --check` passed. Work-unit commit `e4c316c6bb7cb78a2c3e54372fde1b0ea20ebabd` pushed to API `origin/main`. No live HTTP/Supabase integration run. Route: delegated API writer.
- [x] OP-2 Frontend state and CRUD: invoke API for primary selection independent of active context, avoid silent promotion on create, refresh selector data after rename, and cover with service tests/build. Route: delegated frontend writer (multi-file). Evidence: whole candidate passed 526/526 tests and build, independent verification confirmed; staged OP-2 diff check passed. Work-unit commit `8bfa8897ffae2a9c7cdb82f53feb212039dafcb2` pushed to frontend `origin/dev`. Standalone slice suite not run; the passing suite covered the OP-3 worktree changes too.
- [x] OP-3 Frontend selector: confirmation and translations, primary-first order, badge only for multiple eligible assignments, accessible separate buttons, component tests/docs, no-primary direct save, and blocked cancellation during pending save. Route: delegated frontend writer with focused corrections. Evidence: independent frontend suite 530/530, build and parent `git diff --check` passed. Delivery identity: `feat(organizations): let admins choose primary in selector` on frontend `dev` (exact hash reported at delivery). Browser and HTTP integration checks pending.
- [x] OP-B API full-suite blocker: repaired clock mismatch in the two impersonation test files. Focused 10/10, full suite 178/178, isolated solution build passed (NU1903 warnings), independent full-suite verification 178/178 and parent `git diff --check` passed. Work-unit commit `b7c18ab8ca4a5b9666f209828b2992791338590c` pushed to API `origin/main`. Route: delegated writer.

## Acceptance and checks
- A sole assigned active organization is primary without a pill; among several the admin can choose exactly one and it appears first, even after a fresh login.
- Choosing a different primary warns that the prior designation will be replaced and only persists on confirmation; failure leaves existing primary and active context unchanged.
- Selecting an unassigned or inactive organization is rejected by API. Switching active context does not change the primary.
- Admin create retains prior primary; rename updates selector without browser reload.
- Focused and applicable full suites/builds reported with exact results; runtime browser check if available, otherwise explicitly pending.

## Progress
- Explored both repositories: frontend stores a browser-only primary, backend has `User.OrganizationId` and ordered assignments; existing broad admin-user PUT is unsuitable as self-service.
- User explicitly authorized direct API `main`; frontend remains on `dev`. Both clean and `git pull --ff-only` up to date before writes.
- Engram mirror pending: memory tool previously returned `session has already ended`; retry when available.
- OP-1 partial: self-service endpoint and nine focused tests implemented; focused suite 9 passed and isolated-path solution build passed with NU1903 warnings. Full API suite reported 176 passed, 2 failed in ImpersonationHandlerTests; separate read-only diagnosis pending. Default build output was locked by a running API process; isolated `--artifacts-path` build passed without stopping it.
- Independent verifier re-ran focused tests (9/9), solution build (passed, NU1903 warnings) and `git diff --check` (passed); confirmed `AdminOrAbove` middleware policy exists. API code is uncommitted and unpushed.
- Impersonation failures diagnosed: two tests use a fixed May 2026 clock but the session store checks actual October 2026 time; 8/10 in that class passed. No files from that feature changed. Exact failing tests: `Start_HappyPath_ReturnTokenAndSession`, `Start_WhenAlreadyImpersonating_AutoRevokesOldSessionAndCreatesNew`.
- User explicitly selected repair of the two existing impersonation tests; scope expansion authorized. OP-B precedes closing OP-1.
- OP-B complete; parent committed only the two test files, leaving OP-1 work intact. OP-1 committed and pushed independently after checks.
- Native risk assessment was unavailable (`package-local-binary-missing`); independent verifier ran as required, native review not started (RDD status unknown).
- OP-2 first pass: 523/523 frontend tests and build passed independently. Independent verifier found a blocking mismatch: restored active org B may not update auth session/header from primary A; system-admin UI may offer primary selection for unassigned orgs that API rejects. Correct both before OP-2 completion.
- OP-2 corrections verified: restored active org updates the session/header without replacing primary; only assigned active orgs are eligible for primary choice. The selector test also needed spy reset between cases. Independent rerun passed 526/526 and build; browser/HTTP remain pending.
- User selected two functional frontend commits on `dev` for the ~450-line feature. OP-2 committed and pushed; OP-3 includes safe no-primary direct selection and a shared ConfirmDialog loading guard. Independent verification: frontend suite 530/530, build passed; native risk assessment unavailable (`package-local-binary-missing`), so a separate verifier was used. Live browser/API checks pending.
- Next: publish the OP-3 frontend work unit, then manually verify the flow against the running API.
