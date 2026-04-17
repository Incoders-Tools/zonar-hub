# TournamentDetailPageComponent

## Purpose

Public-facing tournament detail page showing tournament info, bracket, results, and confirmed pairs in a tabbed layout.

## Business context

- Accessible via `/tournaments/:id`
- Three tabs: bracket visualization, results, and confirmed pairs
- Public read-only view for players and spectators
- Links to dedicated confirmed-pairs and draw pages

## Inputs / Outputs

Routed page. Reads tournament `id` from route params.

## Dependencies

- `TournamentService` — tournament metadata
- `BracketService` — bracket data for visualization
- `DrawPlannerService` — draw zone data
- `TournamentBracketComponent` — bracket tree renderer

## States

| State | Description |
|-------|-------------|
| Loading | Spinner while data loads |
| Loaded | Tabbed content (bracket / results / pairs) |
| No bracket | Empty state within bracket tab |

## Tabs

- **Bracket** (default): Visual bracket tree
- **Results**: Match results
- **Pairs**: Confirmed pairs list

## i18n keys

Tournament detail keys under `tournaments.detail.*`

## Theming

All tokens via `--zh-*`. Bracket component handles its own theming.

## Test expectations

- Creates successfully
- Starts in loading state
- Defaults to bracket tab
