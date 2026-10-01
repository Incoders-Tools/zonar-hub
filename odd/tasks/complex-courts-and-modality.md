# Complex courts and tournament modality

## Objective
Record and fix the reported complex/court display and persistence bugs, move court configuration into the complex form, and correct the tournament modality required-state display.

## Scope and constraints
- GitHub issue publication requires a YAML Issue Form on the default branch. User explicitly authorized direct commits to frontend `main` for the form; frontend feature work continues on `dev`, API on its user-authorized `main`. No deployment or live browser check requested; user will launch that personally.
- Track the separate root classes: complex court count hardcoded zero, court configuration discarded by API, integrated complex form workflow, and shared select required-message bug. Favor tests at data-contract and form boundaries; do not claim runtime reproduction from static code alone.
- Count should reflect assigned courts, including inactive courts unless product requirements state otherwise; form integration must preserve existing create/edit behavior and report transactional limits.
- Frontend TDD: `strict_tdd: true` in `openspec/config.yaml`, runner `npm run test:ci`; API tests `dotnet test ZonarHub.Tests/ZonarHub.Tests.csproj`, build `dotnet build ZonarHub.slnx --artifacts-path C:/temp/zonar-hub-api-complex-build` to avoid an existing live-process output lock.
- Delivery strategy: ask-on-risk; forecast over 400 authored lines across both repositories, separate coherent work units; no PR or merge without explicit user decision. No parallel writers.

## Tasks
- [x] CC-1 Published GitHub's YAML Issue Form convention at `.github/ISSUE_TEMPLATE/bug_report.yml` on frontend default `main` as commit `a78ab5a7b12650f738ceb1ff178cee331927caaf`. Local YAML parsing/structure verification passed; default-branch host readback confirmed. Open-and-closed duplicate searches found no existing issues. Created and read back two scoped issues with no labels: complex courts and form workflow [#1](https://github.com/Incoders-Tools/zonar-hub/issues/1), tournament modality [#2](https://github.com/Incoders-Tools/zonar-hub/issues/2). Route: inline form, delegated read-only verification.
- [x] CC-2 Fixed shared `zh-select` required-message state with a required FormControl regression spec and component documentation. RED: 1 failure in 532; GREEN: 532/532 frontend tests. Worker and independent verifier both ran the full suite and build successfully; parent staged diff check pending. Work-unit delivery identity: `fix(forms): clear required error after selecting modality` on frontend `dev` (exact hash to be recorded after commit). Browser check deferred to user. Route: delegated writer.
- [ ] CC-3 Define and implement persisted court configuration in API (including schema/migration, DTOs and tests), preserve compatibility. Route: delegated API writer. Evidence: pending.
- [ ] CC-4 Align frontend court requests/count with API and incorporate court rows/configuration into complex form without duplicating UI, with tests and build. Route: delegated frontend writer. Evidence: pending.

## Acceptance and checks
- A complex with courts shows the correct assigned court count after reload; indoor courts remain indoor after saving/reloading; other court configuration fields survive as supported by the form.
- Complex create/edit workflow includes court configuration and preserves current access to existing courts. Any non-atomic parent/child save behavior is clearly reported.
- Tournament modality selection clears 'required' once the control is valid; invalid state still displays when empty.
- Each scoped issue has confirmed GitHub identity and named tests; no issue is claimed created on uncertain writes. Browser/API live verification remains user-owned and pending.

## Progress
- Read-only mapping: `ApiComplexRepository.toModel()` hardcodes count to zero; `ApiCourtRepository` strips configuration and API court model/DTO/storage omit it; shared `zh-select` derives visual error from touched + static errorMessage even when valid.
- Official GitHub docs confirm `.github/ISSUE_TEMPLATE/*.yml` on default branch; repository has no issue forms or organization default template.
- Engram mirror pending (memory service returned `session has already ended` in this session family).
- Issue target: `github.com/Incoders-Tools/zonar-hub`. User explicitly authorized direct main form commit; GitHub issue form belongs on default branch and is not yet part of dev branch. Both issues were confirmed by host readback after privacy scan. A pre-mutation privacy-scan script syntax error made no GitHub write; fixed before the single create attempt for each issue.
- Returned to frontend `dev`; API `main` clean. Native risk assessment unavailable (`package-local-binary-missing`), so CC-2 had independent verification. Next: commit/push CC-2, then investigate court schema and save semantics for CC-3/CC-4.
