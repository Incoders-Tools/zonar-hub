# TournamentDetailPageComponent

## Purpose

Public tournament detail reached through the share link: tournament information, the organization's public profile, and the place where the draw and live results will appear.

## Business context

- Route: `/tournaments/:slug`. Links are built only with `publicTournamentPath(slug)`, the same builder as the backoffice share link.
- Reads `GET /api/public/tournaments/{slug}` anonymously through `PublicTournamentService.getBySlug`.
- The draw, live results and participant list are not public yet (S7 is deferred to phase 2). The bracket, results and participants tabs each show a translated coming-soon state. The page shows no placeholder bracket data.
- The registration call to action is not shown: the registration wizard needs internal tournament ids, which the public API does not expose.

## Inputs / Outputs

Routed page. Reads `slug` from the route `paramMap` and reloads when it changes.

## Dependencies

- `PublicTournamentService`
- `PublicOrganizationCardComponent` (full variant, with description)
- `SportIconComponent`, `StatusBadgeComponent`, shared `app-loading-state` and `app-error-state`
- `localizedPublicName`, `publicTournamentStatusVariant`

## States

| State | Description |
| --- | --- |
| Loading | `app-loading-state` |
| Not found | API 404 (unknown, private, inactive or cancelled slug): translated message and a link back to `/tournaments` |
| Error | `app-error-state` with Retry, which requests the slug again |
| Loaded | Header, information list, description, rules, organization block (only when sent), tabs with the coming-soon state |

## Accessibility

- Information uses a description list (`dl`).
- Tabs use `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`, and the panel is `aria-labelledby` the active tab.
- Coming-soon and not-found blocks use `role="status"`.

## i18n keys

`publicTournaments.detail.*`, `publicTournaments.field.*`, `publicTournaments.comingSoon.*`, plus the existing `tournaments.*` labels. Status and modality names follow the active locale.

## Theming

All tokens via `--zh-*`; the layout becomes two columns from the desktop breakpoint.

## Test expectations

- Loads by slug from the public endpoint
- Not-found state on 404, error state with retry on other failures
- Coming-soon state in place of the grid; no bracket component
- Organization block only when sent
