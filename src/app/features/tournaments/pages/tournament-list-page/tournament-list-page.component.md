# TournamentListPageComponent

## Purpose

Public `/tournaments` showcase: every tournament an organization made public, so visitors see real organizations and real data.

## Business context

- Route: `/tournaments` (`PUBLIC_TOURNAMENTS_ROUTE`).
- Reads `GET /api/public/tournaments` anonymously through `PublicTournamentService`. It needs no session or active organization, unlike the backoffice `TournamentService`.
- The API lists tournaments that are public, active and not cancelled, from every organization, ordered by start date.

## Inputs / Outputs

Routed page. No inputs or outputs.

## Dependencies

- `PublicTournamentService` (`tournaments`, `loading`, `error`, `load()`)
- `PublicTournamentCardComponent` (one card per tournament)
- Shared `app-loading-state`, `app-empty-state`, `app-error-state`

## States

| State | Description |
| --- | --- |
| Loading | `app-loading-state` with `publicTournaments.list.loading` |
| Error | `app-error-state` titled `publicTournaments.list.errorTitle`, with the API error key as the message; Retry calls the endpoint again |
| Empty | `app-empty-state` with `publicTournaments.list.empty` |
| Loaded | Responsive grid of tournament cards |

## Accessibility

Single `h1`; the cards are list items with `h3` titles.

## i18n keys

`tournaments.title`, `publicTournaments.list.*`, plus the card keys.

## Theming

All tokens via `--zh-*`.

## Test expectations

- Calls the public endpoint and never the admin one
- Organization block only for tournaments that send `organization`; links keep `target` and `rel`
- Loading, empty, and error-with-retry states
