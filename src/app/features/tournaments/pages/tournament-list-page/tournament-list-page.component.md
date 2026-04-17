# TournamentListPageComponent

## Purpose

Public listing of all available tournaments with status indicators and links to detail pages.

## Business context

- Accessible via `/tournaments`
- Shows tournament cards with name, dates, status, and category info
- Supports loading state while tournaments are fetched

## Inputs / Outputs

Routed page. No inputs or outputs.

## Dependencies

- `TournamentService` — provides `publicTournaments` and `loading` signals

## States

| State | Description |
|-------|-------------|
| Loading | Loading indicator |
| Empty | No tournaments available |
| Loaded | Grid/list of tournament cards |

## i18n keys

Tournament list keys under `tournaments.list.*`

## Theming

All tokens via `--zh-*`.

## Test expectations

- Creates successfully
- Exposes tournaments signal
- Generates correct status CSS classes
