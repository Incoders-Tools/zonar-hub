# Home Page Component

## Purpose

Render the public landing page for Zonar Hub and communicate the product value clearly from the first screen.

## Feature context

This page belongs to the `home` feature and acts as the initial entry point of the application.

## Business intent

The page introduces Zonar Hub as the operational platform for padel circuit management, including players, rankings, tournaments, draws, complexes, courts, dashboards, and live tournament state.

## Inputs

This component currently does not receive external `@Input()` values.

## Outputs

This component currently does not emit external `@Output()` events.

## Dependencies

- Angular standalone component
- Angular Router
- shared translation pipe
- `PublicTournamentService` for the upcoming-tournaments section (anonymous `GET /api/public/tournaments`; no session or active organization needed)
- `PublicTournamentCardComponent` for each upcoming tournament (shared with `/tournaments`; shows the organization block only when the API sends it)
- shared `app-loading-state`, `app-empty-state` and `app-error-state` for the upcoming-tournaments states
- shared `app-sport-icon` for the sport cards (padel uses the `svg` source and renders `uploads/sports-icons/padel.svg`; the other sports render their emoji at 40px)
- global theme tokens from `src/styles.scss`

## States

The page is informational except for the upcoming-tournaments section, which shows the first six public tournaments that have not ended:

| Section state | Rendering |
| --- | --- |
| Loading | `app-loading-state` |
| Error | `app-error-state` with Retry, which calls the public endpoint again |
| Empty | `app-empty-state` with `publicTournaments.list.empty` |
| Loaded | Tournament cards and a "View all tournaments" link to `/tournaments` |

Other expected states:
- default content state
- responsive layout adaptation
- translated rendering according to active locale

## Validation rules

This page does not contain form validation rules at the moment.

## Accessibility notes

- semantic headings must remain ordered
- interactive elements must remain keyboard accessible
- visible text must preserve contrast through theme tokens
- navigation links must expose clear accessible labels

## i18n notes

- no user-facing text should be hardcoded in the template
- all visible strings must use translation keys
- supported locales:
  - es
  - en
  - pt

## Theming notes

- no hardcoded color literals should be used in the component stylesheet
- styling must rely on semantic design tokens and shared theme variables
- the component must remain compatible with:
  - court-energy
  - clay-match
  - night-arena

## Reuse guidance

- do not duplicate hero, card-grid, or CTA patterns later without first checking whether they should become shared UI primitives
- if similar landing or dashboard summary blocks appear in multiple features, extract a shared reusable component instead of copying the markup