# TournamentBracketComponent

## Purpose

Displays a visual elimination bracket for a tournament. Renders rounds, matches, pair names, seeds, scores, and winner indicators in a horizontally scrollable bracket layout.

## Business context

Used in the draw planner and tournament detail views to visualize the elimination phase of a tournament. Supports quarterfinals through finals with automatic spacing and connector lines between rounds.

## Inputs

| Input     | Type                | Required | Description                            |
|-----------|---------------------|----------|----------------------------------------|
| `bracket` | `TournamentBracket` | Yes      | Full bracket data including rounds and matches |

## Outputs

None. This is a read-only display component.

## Dependencies

- `TranslatePipe` — for round names and TBD label
- `MatIcon` — for winner check icon
- `TournamentBracket`, `BracketMatch`, `BracketRound`, `BracketPair` from `bracket.model.ts`

## Data model

```typescript
interface TournamentBracket {
  tournamentId: string;
  categoryName: string;
  genderLabel: string;
  rounds: BracketRound[];
}

interface BracketRound {
  name: string;        // Translation key for round name
  matches: BracketMatch[];
}

interface BracketMatch {
  id: string;
  pair1: BracketPair | null;
  pair2: BracketPair | null;
  score1: string[];
  score2: string[];
  winnerId: string | null;
  courtName?: string;
  scheduledAt?: string;
}
```

## Variants and states

- **Full bracket**: All pairs assigned, scores filled, winners determined
- **Partial bracket**: Some matches pending (TBD pairs)
- **In progress**: Mix of completed and unplayed matches
- **Final match**: Special styling for the last round

## Accessibility notes

- Round titles use semantic `<h3>` headings
- Winner icon uses `check_circle` Material icon for visual distinction
- Pair names are text-based for screen reader access

## Translation notes

Uses keys:
- `bracket.tbd` — displayed when a pair is not yet determined
- Round names (e.g., `bracket.quarterfinals`, `bracket.semifinals`, `bracket.final`) are passed as translation keys in `BracketRound.name`

## Theming notes

Uses design tokens for:
- Match card background, borders, and shadows
- Winner/loser text colors and highlights
- Round title typography
- Seed badge styling

## Test expectations

- Renders correct number of rounds and matches
- Identifies winners and losers correctly
- Handles null pairs (TBD)
- Handles undefined pairId
- Shows seed numbers when present
- Shows TBD label for missing pairs
- Shows winner icon for winning pair

## Reuse guidance

Use wherever a tournament elimination bracket needs to be visualized:

```html
<app-tournament-bracket [bracket]="bracketData" />
```

The parent is responsible for loading and transforming bracket data from the API or draw planner.
