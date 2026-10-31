# DrawMatchDetailComponent

## Purpose

Modal panel with the details of one draw match: status badge, round, court, date and time, score per set and duration (from `startedAt` / `finishedAt`). Opened by `app-tournament-bracket` when a match card is activated and the view is not `interactive`.

It follows the repository's overlay dialog pattern (`app-confirm-dialog`): a fixed overlay with a centred panel, `--zh-surface-overlay` backdrop and elevated surface.

## Inputs

| Input | Type | Description |
|---|---|---|
| `match` | `DrawMatchView` | Prepared by `buildDrawView`. |

## Outputs

| Output | Payload | When |
|---|---|---|
| `closed` | `void` | Close button, Escape or backdrop click. The parent removes the panel and returns focus to the card. |

## Dependencies

`app-status-badge`, `FormatDatePipe` (date in the user's date format), `CdkTrapFocus`, `MatIcon`, `TranslatePipe`, `I18nService`.

## States

- With sets: score table (pair rows, one column per set), winner row emphasised with check icon and hidden "Winner" text.
- Without sets: both pair names and "No score yet".
- Court or schedule missing: "To be confirmed".
- Duration shown only when both timestamps exist and the difference is positive (`1 h 25 min`, `40 min`).

Status badge mapping: scheduled → `upcoming`, inProgress → `in-progress`, completed → `completed`, walkover / retired → `warning`.

## Accessibility notes

`role="dialog"`, `aria-modal="true"`, labelled by the `h2` title; focus is trapped and captured on open; the close button has a translated `aria-label`; facts use a description list.

## i18n notes

`bracket.detail.*`, `bracket.status.*`, `bracket.duration.*`, `bracket.match.winner`, `common.close`. The duration label follows locale changes.

## Theming notes

Tokens only: `--zh-surface-overlay`, `--zh-surface-elevated`, `--zh-elevation-lg`, `--zh-primary-soft`, `--zh-success`, text and border tokens.

## Reuse guidance

Use through `app-tournament-bracket`. Admin result entry (F3) uses its own form dialog, not this read-only panel.
