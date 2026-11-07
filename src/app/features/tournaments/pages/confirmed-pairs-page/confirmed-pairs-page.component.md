# ConfirmedPairsPageComponent

## Purpose

Displays the list of confirmed player pairs for a public tournament.

## Business context

- Route: `/tournaments/:slug/confirmed-pairs`. The tournament is resolved by its public slug through `PublicTournamentService`; the back link uses `publicTournamentPath`.
- Registrations have no public endpoint yet, so the list stays empty and the empty state is shown.
- Read-only public view.

## Inputs / Outputs

Routed page. Reads `slug` from route params.

## Dependencies

- `PublicTournamentService` — loads the tournament name for the header

## States

| State | Description |
|-------|-------------|
| Empty | No confirmed pairs message |
| Loaded | Grid of pair cards (once a public registrations source exists) |

## i18n keys

- `tournaments.backToDetail`, `confirmedPairs.title`, `confirmedPairs.empty`

## Theming

All colors via `--zh-*` design tokens.

## Test expectations

- Starts with empty pairs and shows the empty state
- Loads the tournament by slug and links back to the public detail
