# AdminDashboardPageComponent

## Purpose

Main admin dashboard showing key metrics, quick actions, and system health at a glance.

## Business context

- Landing page for admin users after login
- Shows active tournaments, registrations, players, sports, complexes, and admin user counts
- Displays a setup prompt when no tournaments exist yet
- Links to key admin management screens

## Inputs / Outputs

Routed page. No inputs or outputs.

## Dependencies

- `TournamentService` — tournament counts and active tournaments
- `RegistrationService` — registration metrics
- `PlayerService` — player counts
- `MockSportRepository` — sport counts
- `MockComplexRepository` — complex counts
- `MockAdminUserRepository` — admin user counts

## States

| State | Description |
|-------|-------------|
| Setup prompt | Shown when no tournaments exist |
| Dashboard | Metric cards and quick actions |

## i18n keys

Dashboard keys under `admin.dashboard.*`

## Theming

All tokens via `--zh-*`.

## Test expectations

- Creates successfully
- Exposes activeTournaments and showSetupPrompt computed signals
