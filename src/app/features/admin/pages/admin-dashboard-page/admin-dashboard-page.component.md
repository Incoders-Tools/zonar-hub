# AdminDashboardPageComponent

## Purpose

Main admin dashboard showing key metrics, quick actions, and system health at a glance.

## Business context

- Landing page for admin users after login
- Shows active tournaments, registrations, players, sports, complexes, and admin user counts
- Metrics are organization-scoped using the active organization selected in the sidebar
- Displays a setup prompt when no tournaments exist yet
- Links to key admin management screens

## Inputs / Outputs

Routed page. No inputs or outputs.

## Dependencies

- `AdminDashboardService` — loads summary cards from `/api/admin/dashboard/summary`
- `ActiveOrganizationService` — organization context and change signal for reload
- `TenantContextService` and `MockPlanRepository` — plan limits for usage widgets

## States

| State | Description |
|-------|-------------|
| Setup prompt | Shown when no tournaments exist |
| Loading summary | Awaiting API summary load for selected organization |
| Dashboard | Metric cards and quick actions |

## i18n keys

Dashboard keys under `admin.dashboard.*`

## Theming

All tokens via `--zh-*`.

## Test expectations

- Creates successfully
- Exposes activeTournaments and showSetupPrompt computed signals
- Reloads summary when active organization changes
