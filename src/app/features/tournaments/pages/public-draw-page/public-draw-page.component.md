# PublicDrawPageComponent

## Purpose

Full-width, shareable view of a tournament's live published draw (`/tournaments/:slug/draw`). It shows the same draw as the tournament detail page.

## Business context

- Route: `/tournaments/:slug/draw`. The tournament is resolved by its public slug through `PublicTournamentService.getBySlug` for the title and the back link (`publicTournamentPath`).
- Decision (F4): the page was kept instead of redirecting to the detail page, so existing `/draw` links keep working. It no longer uses the in-memory `DrawPlannerResult`. It provides its own `PublicDrawLiveService` and renders the shared `app-public-draw-panel`, so loading, polling every 30 s while visible, refresh errors and the updated-at label are the same code as the detail page (no duplicated polling).
- The draw request starts with the tournament request; a tournament that fails to load only hides the header data.
- Read-only public view: the bracket is not interactive.

## Inputs / Outputs

Routed page. Reads `slug` from the route `paramMap`; a new slug restarts the live draw and ignores answers for the previous one.

## Dependencies

- `PublicTournamentService` (header data)
- `PublicDrawLiveService` (page-scoped provider)
- `PublicDrawPanelComponent`
- `TranslatePipe`, `MatIcon`, `RouterLink`

## States

| State | Description |
|-------|-------------|
| Loading | `app-loading-state` of the panel during the first draw request |
| Error | `app-error-state` of the panel with Retry |
| Empty | "Draw not published" block (projected into the panel) when the API answers 404 |
| Loaded | Shared bracket view with "updated at HH:mm"; refresh failures show a discreet note with Retry and keep the last draw |

## Accessibility

- `h1` title; the bracket view provides its own headings and ARIA labels.
- The empty block uses `role="status"`.
- Back link has a visible focus ring.

## i18n keys

- `tournaments.backToDetail`, `draw.title`, `draw.notPublished`, plus `publicTournaments.draw.*` through the panel.

## Theming

All colors via `--zh-*` design tokens.

## Test expectations

- Requests the tournament and its draw by slug and shows the loading state
- Renders the API draw with the shared bracket view; title, subtitle and back link
- Not-published state on 404
- Refreshes after 30 s (same live service as the detail page)
- Error state with a retry that loads the draw

## Reuse guidance

Route-level page. Reuse `app-public-draw-panel` with a page-scoped `PublicDrawLiveService` for any other public draw surface.
