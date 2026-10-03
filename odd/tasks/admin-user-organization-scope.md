# Admin user organization scope (frontend)

## Goal and decision
The Users page defaults to the selected real organization. A system admin can explicitly choose All organizations on that page, not through a fake Zonar Hub organization in the global switcher. A test organization is deferred. The API owns filtering and total count before paging; client-side filtering of the first 200 is not an acceptable substitute.

## Boundaries
- Frontend target is existing `dev` (the user's established frontend branch). No push, PR or deployment without a separate decision. Preserve unrelated `.atl/` and `.gitignore` modifications.
- Preserve ordinary organization switching, tool permission checks, admin ability to find unassigned tenant users, multi-organization membership, existing create/update/permission UX and its documentation. Impersonation must not gain global access through an effective-user/real-user mix-up; do not enable impersonation here.
- The All selection is a local users-page display scope and only system_admin can use it. Switching active organization restores organization mode and resets page. Stale/out-of-order responses must not leak prior-org results. Clear error/loading correctly.
- Follow `AGENTS.md` and .github instructions, es/en/pt i18n, shared collection/filter/accessible controls, strict TDD (`npm run test:ci`) and `npm run build`. A mock does not verify a deployed API or DB migration.

## Tasks
- [x] AUS-FE-1 Added typed `getPage` that requires an explicit organization or all scope, validates page and organization before HTTP, encodes filters and returns server `totalCount`; existing `getAll` retained only until FE-2 migrates the facade. Strict TDD RED missing method, focused GREEN 15/15, full frontend 630/630, build and diff check observed by writer and independent verifier. Work-unit commit identity recorded after commit. No live API or browser check.
- [ ] AUS-FE-2 Refactor users facade to request only the selected page/scope, eliminate duplicate org-change loads and stale races, preserve tenant-admin unassigned workflow, avoid unconditional self-injection and first-200 client filtering; test transitions and filters; commit.
- [ ] AUS-FE-3 Add explicit All toggle visible only to sysadmin within Users, organization-context label, accurate server paging and empty/error/loading states with translated help. Keep the global org selector unchanged; test DOM and keyboard accessibility, full suite/build, then commit.

## Evidence and blockers
- Initial read-only trace: sysadmin skips the client org filter, `getAll()` fetches only page 1 of 200, the facade and page both reload on organization switch, and no server paging exists in the UI. Backend contract/migration must precede final integration.
- Progress, RED/GREEN evidence, commit identities, verification, skips and rollback boundary: pending.
- Mirror key: `odd/admin-user-organization-scope/tasks` (Engram attempted where available).
