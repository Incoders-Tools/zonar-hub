# TournamentBracketComponent (shared draw view)

## Purpose

The single, presentational view of a tournament draw (design decision D8 in `odd/tasks/tournament-draws.md`). It renders the D7 draw JSON (`TournamentDraw` in `core/models/tournament-draw.model.ts`):

- **Knockout**: round columns under a header bar (`R64`, `R32`, `R16`, quarterfinals, semifinals, final) with previous / next paging, match cards, connector lines and the third-place match under the final column.
- **Group stage**: one card per group with its standings table and its matches by matchday, followed by the knockout phase.
- **Round robin**: standings table plus the matchday list (with the resting pair of each matchday).
- **List / bracket toggle** for knockout phases (list = rounds stacked, best on small screens).
- **Match detail panel** (modal) with status badge, round, court, date and time, sets and duration.

It replaces the previous `TournamentBracket` rendering of this folder (old `BracketRound/BracketMatch` input). There is only one bracket component in the app.

## Feature context

- Public tournament page (F4): read-only grid, `interactive` false; activating a card opens the detail panel.
- Admin draw page (F2) and result entry (F3): `interactive` true; activating a card emits `matchSelected` so the page opens its own result dialog.

The component never calls HTTP. Parents load the draw through a service and should pass it through `normalizeTournamentDraw` (the component also normalises its input; the call is idempotent).

## Usage

```html
<app-tournament-bracket
  [draw]="draw()"
  [interactive]="false"
  [highlightParticipantId]="myPairId()"
  (matchSelected)="openResultDialog($event)" />
```

## Inputs

| Input | Type | Default | Description |
|---|---|---|---|
| `draw` | `TournamentDraw \| null` | `null` | The draw (D7). `null` or a draw without matches shows the empty state. |
| `interactive` | `boolean` | `false` | When true, activating a match emits `matchSelected` instead of opening the detail panel. |
| `highlightParticipantId` | `string \| null` | `null` | Draw-local participant id emphasised in cards (inline marker) and standings (row background). |

## Outputs

| Output | Payload | When |
|---|---|---|
| `matchSelected` | `DrawMatch` (the D7 match as received) | A non-bye match card is activated while `interactive` is true. |

## Dependencies

- Subcomponents in this folder: `app-draw-match-card`, `app-draw-standings-table`, `app-draw-match-detail`.
- `draw-view.model.ts`: pure `buildDrawView(draw, translate, highlightId)` that resolves names, placeholders, labels, scores and ARIA text. Covered through the component specs.
- Shared: `app-empty-state`, `app-status-badge` (in the detail panel), `TranslatePipe`, `FormatDatePipe`, `MatIcon` (Material Symbols), CDK `BreakpointObserver` and `CdkTrapFocus`.

## Rendering rules

- **Pair rows**: member surnames (last word of each member name) in uppercase, one per line; the participant display name when it has no members. Seed rank shown when present.
- **Scores**: one cell per set, right-aligned; the set winner's games are bold; tie-break points appear as a superscript on the side that lost the tie-break set.
- **Winner**: check icon plus visually hidden "Winner" text, only for `completed`, `walkover` and `retired` results with a `winnerSide`.
- **BYE**: a bye side shows `BYE`; bye matches are rendered as `article` (not activatable).
- **Pending slots**: `winnerOf` / `loserOf` show "Winner of R1 M3" / "Loser of R2 M1" (round number and match number of the source match); `groupPosition` shows "1st of Group A". Resolved slots (`resolvedParticipantId`) show the participant.
- **Third place**: the knockout final round's match whose two slots are `loserOf` (API engine convention) is taken out of the final column and shown under it, labelled "Third place".
- **Group matches**: a group-stage matchday lists, per group, the matches whose participants belong to that group.
- **Round-robin standings**: taken from `phase.groups[0].standings` when present (assumed shape, see Open points); otherwise only the matchday list is shown.

## Variants and states

| State | Behaviour |
|---|---|
| Empty | `draw` null, or every phase without matches/groups: shared empty state with `bracket.empty`. |
| Partial | Unresolved slots show placeholders; matches without a result show no score or status chip; detail shows "To be confirmed" for court and schedule. |
| In progress | Status chip "In progress" on the card; partial sets shown; no winner check. |
| Decided | Winner row emphasised, check icon, status chip (Completed / Walkover / Retired). |
| Bracket mode | Columns paged by the number of visible columns: 3 at ≥ 960px (`desktop` mixin breakpoint), 1 below. Arrows disable at the ends. |
| List mode | Rounds stacked as headed card grids; third place last. |
| Interactive | Cards emit `matchSelected`; no detail panel. |

Loading and error states belong to the parent page (the component is purely presentational).

## Accessibility notes

- Phase titles are `h2`; round headers, group titles and list-mode round titles are `h3`; matchday titles and the third-place title are `h4`.
- Each bracket column is an `ol` labelled by its round heading (`aria-labelledby`). `R16`-style labels carry a visually hidden spoken label ("Round of 16").
- Match cards are `button`s when activatable, with an `aria-label` containing the round, match number, both pairs, status, score and winner, for example: "Quarterfinals, match 1: Gómez / Pérez versus Club Sur. Completed. Score 6-4, 6-3. Winner: Gómez / Pérez".
- Status is always written (chip text, badge text, hidden "Winner" text), never conveyed by colour alone.
- Paging: labelled previous / next buttons; ArrowLeft / ArrowRight on the bracket move a page and move focus to the bracket viewport; a polite live region announces the visible rounds.
- The view-mode toggle is a `role="group"` with `aria-pressed` buttons and visible text.
- The detail panel is `role="dialog"` with `aria-modal`, labelled by its title, traps focus, closes with Escape, the close button or the backdrop, and returns focus to the activating card.

## i18n notes

All copy uses `bracket.*` keys in `core/i18n/i18n.translations.ts` (es, en, pt): round labels (`bracket.round.*`), phases, group title, placeholders (`bracket.placeholder.*` with `bracket.ordinal.*`), statuses (`bracket.status.*`), ARIA templates (`bracket.match.*`), view toggle, paging, standings headers (short and full), matchday resting text, detail panel and duration. Templates use `{name}` tokens replaced in code. Labels follow locale changes.

## Theming notes

Semantic tokens only; no literal colours. Header bars use `--zh-primary` / `--zh-on-primary`; connectors use `--zh-draw-bracket-line`; cards use `--zh-surface-card`, `--zh-border-subtle`, winner rows `--zh-primary-soft`, highlight `--zh-primary`; status chips use the `--zh-*-soft` / `--zh-*` pairs. Every colour token used is overridden by `night-arena`; `court-energy` and `clay-match` use the light defaults. Local custom properties `--draw-gap` (column gap = `--zh-space-xl`) and `--draw-line` (connector width) can be overridden by a parent.

## Reuse guidance

- Use this component for any draw, bracket, group table or fixture view; do not create another bracket component.
- Keep business rules (standings order, progression, validation) in the API; this component only renders what it receives.
- For new phase kinds extend `TournamentDraw` normalisation and `buildDrawView`, then add a template branch.

## Open points

- Enum serialisation: the contract assumes camelCase strings (`groupStage`, `knockout`, `roundRobin`; `scheduled`, `inProgress`, `completed`, `walkover`, `retired`). `normalizeTournamentDraw` also accepts PascalCase, snake_case and the numeric API enum values for phase kind and format.
- Round-robin standings location in D7 is not fixed yet; the view reads `phase.groups[0].standings`.
