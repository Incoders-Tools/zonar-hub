# TournamentDetailPageComponent

## Purpose

Public tournament detail reached through the share link: tournament information, the organization's public profile, and the live published draw with its results (D10, S1, S5).

## Business context

- Route: `/tournaments/:slug`. Links are built only with `publicTournamentPath(slug)`, the same builder as the backoffice share link.
- Reads `GET /api/public/tournaments/{slug}` anonymously through `PublicTournamentService.getBySlug`.
- Draw and results tabs: once the tournament is loaded, the page starts its own `PublicDrawLiveService` (provided in the component) with the slug. It reads `GET /api/public/tournaments/{slug}/draw` and the tabs render `app-public-draw-panel`: the draw tab shows the bracket view, the results tab the list view of the same draw. When the tournament has no published draw (API 404), both tabs keep the translated coming-soon state, projected into the panel.
- Live update (S5): the draw is requested again every 30 s while the document is visible. A hidden page is not polled; when it becomes visible again it refreshes at once if the last request is 30 s old or more, otherwise when the 30 s are up. Polling stops when the page is destroyed and when the slug changes (the answer for the previous slug is ignored). No draw request is made for a tournament that is not found or failed to load.
- Participants tab: the participant list is not public yet, so it keeps the coming-soon state. The page shows no placeholder bracket data.
- The registration call to action is not shown: the registration wizard needs internal tournament ids, which the public API does not expose.

## Inputs / Outputs

Routed page. Reads `slug` from the route `paramMap` and reloads when it changes.

## Dependencies

- `PublicTournamentService`
- `PublicDrawLiveService` (page-scoped provider) and `PublicDrawPanelComponent` (`features/tournaments/components/public-draw-panel`), which renders the shared non-interactive `app-tournament-bracket`
- `PublicOrganizationCardComponent` (full variant, with description)
- `SportIconComponent`, `StatusBadgeComponent`, shared `app-loading-state` and `app-error-state`
- `localizedPublicName`, `publicTournamentStatusVariant`

## States

| State | Description |
| --- | --- |
| Loading | `app-loading-state` |
| Not found | API 404 (unknown, private, inactive or cancelled slug): translated message and a link back to `/tournaments` |
| Error | `app-error-state` with Retry, which requests the slug again |
| Loaded | Header, information list, description, rules, organization block (only when sent), tabs |

Draw area (draw and results tabs, see `public-draw-panel.component.md`):

| State | Description |
| --- | --- |
| Draw loading | First draw request only: `app-loading-state` |
| Draw error | First draw request failed: `app-error-state` with Retry |
| No published draw | Coming-soon state of the active tab |
| Draw | Bracket (draw tab) or list (results tab), "updated at HH:mm" |
| Refresh failed | The last draw stays; a discreet "could not update" note with Retry. Background refreshes never show a loading state |

## Accessibility

- Information uses a description list (`dl`).
- Tabs use `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`, and the panel is `aria-labelledby` the active tab.
- Coming-soon and not-found blocks use `role="status"`.

## i18n keys

`publicTournaments.detail.*`, `publicTournaments.field.*`, `publicTournaments.comingSoon.*`, `publicTournaments.draw.*` (through the panel), plus the existing `tournaments.*` labels. Status and modality names follow the active locale.

## Theming

All tokens via `--zh-*`; the layout becomes two columns from the desktop breakpoint.

## Test expectations

- Loads by slug from the public endpoint
- Not-found state on 404, error state with retry on other failures
- Organization block only when sent
- Draw (fake timers): loading state on the first draw request; bracket when a draw exists; coming-soon when there is none; results tab = list view; initial draw error with retry; updated-at label per locale; polling every 30 s without a loading flash; a draw published later appears; paused while hidden and refreshed on becoming visible after 30 s (or after the rest of the interval); no requests after destroy; stale answer ignored after a slug change; refresh error keeps the last draw and shows the note with a working retry
