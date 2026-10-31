# DrawStandingsTableComponent

## Purpose

Read-only standings of a group or a round robin: position, pair, played, won, lost, set difference and game difference, in the order the API resolver returns (D4). Internal building block of `app-tournament-bracket`.

It is a plain semantic table instead of `app-data-table` on purpose: standings must keep the API order (no user sorting), have no selection, actions or pagination, and must stay compact inside a group card.

## Inputs

| Input | Type | Description |
|---|---|---|
| `rows` | `DrawStandingRowView[]` | Prepared by `buildDrawView` (differences already signed, `+3` / `-2` / `0`). |
| `caption` | `string` | Translated caption, for example "Group A standings" (visually hidden). |

## Outputs

None.

## Dependencies

`TranslatePipe`.

## States

Normal rows and a highlighted row (`highlightParticipantId` of the parent). An empty `rows` array renders headers only; the parent hides the table when there are no standings.

## Accessibility notes

`caption` names the table; column headers use `scope="col"` and `abbr` with the full name in `title`; the pair cell is the row header (`scope="row"`).

## i18n notes

`bracket.standings.*` keys (short and full header names) in es, en and pt.

## Theming notes

Tokens only: `--zh-border-subtle`, `--zh-text-*`, `--zh-surface-selected` for the highlighted row. Scrolls horizontally on narrow containers.

## Reuse guidance

Use through `app-tournament-bracket`. Do not sort or recompute standings here.
