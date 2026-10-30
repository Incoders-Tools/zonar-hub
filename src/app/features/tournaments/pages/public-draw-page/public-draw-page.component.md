# PublicDrawPageComponent

## Purpose

Displays the published tournament draw (zone allocations and pair assignments) for public viewing.

## Business context

- Route: `/tournaments/:slug/draw`. The tournament is resolved by its public slug through `PublicTournamentService`; the back link uses `publicTournamentPath`.
- Draws are not published through the public API yet (phase 2), so the page shows the "draw not published" state after the tournament loads.
- Read-only public view — no editing capabilities.

## Inputs / Outputs

Routed page component. Reads `slug` from route params.

## Dependencies

- `PublicTournamentService` — loads the tournament name for the title
- `TranslatePipe` — all UI text is translated

## States

| State | Description |
|-------|-------------|
| Loading | Spinner with loading text while the tournament loads |
| Empty | "Draw not published" message |
| Loaded | Grid of zone cards with pair lists (once a public draw source exists) |

## Accessibility

- Semantic heading hierarchy (h1 for title, h3 for zone names)
- Unordered list for pairs within each zone
- Back link for navigation

## i18n keys

- `tournaments.backToDetail`, `draw.title`, `draw.notPublished`, `states.loading`

## Theming

All colors via `--zh-*` design tokens. Zone cards use `--zh-surface-card`, seeded pairs use `--zh-warning`.

## Test expectations

- Tournament starts null (async load)
- Shows the not-published state after loading
- Loads the tournament by slug and links back to the public detail

## Reuse guidance

Not reusable — route-level page. Zone card layout could be extracted if draw visualization is needed elsewhere.
