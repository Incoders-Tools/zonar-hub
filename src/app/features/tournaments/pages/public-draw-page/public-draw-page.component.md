# PublicDrawPageComponent

## Purpose

Displays the published tournament draw (zone allocations and pair assignments) for public viewing.

## Business context

- Accessed via `/tournaments/:id/draw`
- Shows zone cards with pair names and seed indicators
- Read-only public view — no editing capabilities
- Displays loading, empty (not published), and populated states

## Inputs / Outputs

Routed page component. Reads tournament `id` from route params.

## Dependencies

- `TournamentService` — loads tournament metadata for the title
- `DrawPlannerService` — retrieves the published draw result
- `TranslatePipe` — all UI text is translated

## States

| State | Description |
|-------|-------------|
| Loading | Spinner with loading text |
| Empty | "Draw not published" message |
| Loaded | Grid of zone cards with pair lists |

## Accessibility

- Semantic heading hierarchy (h1 for title, h3 for zone names)
- Unordered list for pairs within each zone
- Back link for navigation

## i18n keys

- `tournaments.backToDetail`, `draw.title`, `draw.notPublished`, `states.loading`

## Theming

All colors via `--zh-*` design tokens. Zone cards use `--zh-surface-card`, seeded pairs use `--zh-warning`.

## Test expectations

- Component creates successfully
- Shows empty state when no draw result
- Tournament starts null (async load)

## Reuse guidance

Not reusable — route-level page. Zone card layout could be extracted if draw visualization is needed elsewhere.
