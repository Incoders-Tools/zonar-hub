# AdminDashboardPageComponent

## Purpose

Main admin dashboard showing key metrics, quick actions, and system health at a glance.

## Business context

- Landing page for admin users after login
- Shows active tournaments, registrations, players, sports, complexes, and admin user counts
- Metrics are organization-scoped using the active organization selected in the sidebar
- Displays the onboarding banner while the onboarding wizard is not completed
- Links to key admin management screens

## Inputs / Outputs

Routed page. No inputs or outputs.

## Dependencies

- `AdminDashboardService` — loads summary cards from `/api/admin/dashboard/summary`; exposes `summary`, `summaryOrganizationId`, `loading`, and `error` (a translation key, never a raw API message)
- `ActiveOrganizationService` — organization context and change signal for reload
- `OnboardingStateService` — onboarding progress that drives the setup banner
- `TenantContextService` and `ApiPlanRepository` — plan limits for usage widgets
- `AsyncButtonComponent` — shared secondary retry button

## States

| State | Description |
|-------|-------------|
| Onboarding banner | Driven only by `onboarding.progress` (wizard not completed); independent of the summary request |
| Loading summary | Active organization set but no summary for it yet; compact `role="status"` text. Checklist, stats, plan usage, and overview charts are hidden; quick actions stay available |
| Summary error | Compact `role="alert"` with a translated message and a `type="button"` retry for the current active organization. Checklist, stats, plan usage, and overview charts are hidden so a failure never looks like zero progress; quick actions stay available |
| Dashboard | Summary loaded for the active organization: checklist (until complete), metric cards, plan usage, overview charts, quick actions |
| Zero data | A successful all-zero summary is real data and renders as zero progress |
| No organization | No request is made; the checklist shows only the pending "create organization" step linking to organizations, without a progress count. Stats, usage, and charts are hidden |

Quick actions are hidden only while the onboarding setup prompt is shown, independent of the summary state.

## Data consistency

- The page only renders a summary whose `summaryOrganizationId` matches the active organization, so a previous organization's data is never shown after a switch.
- The service tracks a request sequence: late successes or failures from superseded requests (including after the organization is cleared) are ignored.
- A same-organization refresh keeps the current summary visible while it reloads.

## Accessibility

- Loading text uses `role="status"`; the error uses `role="alert"`.
- Retry is a real non-submitting button (`type="button"`). Starting a retry clears the error, so the alert is replaced by the loading status while the request is in flight.

## i18n keys

Dashboard keys under `dashboard.*`, including `dashboard.summaryError`; shared `common.loading` and `common.retry`.

## Theming

All tokens via `--zh-*`; the error block uses `--zh-danger` and `--zh-danger-soft`, matching other inline alerts.

## Test expectations

- Loads the summary for the active organization and reloads on organization change
- Loading and error states hide checklist, stats, usage, and overview charts but keep quick-action links
- Retry calls the service for the current active organization and the alert gives way to the loading status
- No active organization shows only the create-organization step with its link
- Legitimate zero summaries render as zero progress
- Onboarding banner stays driven by onboarding progress during summary loading or failure
