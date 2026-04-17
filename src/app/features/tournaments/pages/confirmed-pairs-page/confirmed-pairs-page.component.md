# ConfirmedPairsPageComponent

## Purpose

Displays the list of confirmed player pairs for a specific tournament.

## Business context

- Accessible from tournament detail via `/tournaments/:id/pairs`
- Shows all confirmed registrations as pair cards with player names, category, and gender
- Read-only public view

## Inputs / Outputs

Routed page. Reads tournament `id` from route params.

## Dependencies

- `TournamentService` — loads tournament metadata
- `RegistrationService` — retrieves confirmed registrations

## States

| State | Description |
|-------|-------------|
| Empty | No confirmed pairs message |
| Loaded | Grid of pair cards |

## i18n keys

- `tournaments.backToDetail`, `confirmedPairs.title`, `confirmedPairs.empty`

## Theming

All colors via `--zh-*` design tokens.

## Test expectations

- Creates successfully
- Starts with empty pairs
- Shows empty state when no pairs
