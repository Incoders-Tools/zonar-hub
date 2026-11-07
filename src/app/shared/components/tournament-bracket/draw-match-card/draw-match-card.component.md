# DrawMatchCardComponent

## Purpose

One match of a draw: two pair rows with seed, names (surnames uppercase, one per line), per-set games right-aligned, winner check, `BYE` rows and translated placeholders for pending slots, plus a status / court line once a result exists. Internal building block of `app-tournament-bracket`; not used on its own elsewhere.

## Inputs

| Input | Type | Default | Description |
|---|---|---|---|
| `match` | `DrawMatchView` | required | Prepared by `buildDrawView` (all text already translated). |
| `activatable` | `boolean` | `true` | Renders a `button`; bye matches always render as `article`. |

## Outputs

| Output | Payload | When |
|---|---|---|
| `activated` | `HTMLElement` (the card button) | The button is clicked or activated by keyboard. The parent uses the element to return focus. |

## Dependencies

`MatIcon` (`check`, Material Symbols), `TranslatePipe`, `NgTemplateOutlet`.

## States

Participant, bye and pending rows; winner / loser rows; highlighted participant (inline marker and card border); with or without result meta (status chip text, court).

## Accessibility notes

The card's `aria-label` carries round, match number, both pairs, status, score and winner. The winner icon is `aria-hidden` and paired with visually hidden "Winner" text. Focus ring through the shared `focus-ring` mixin.

## i18n notes

Labels arrive translated in `DrawMatchView`; the only key used directly is `bracket.match.winner`.

## Theming notes

Tokens only: `--zh-surface-card`, `--zh-border-*`, `--zh-primary-soft`, `--zh-primary`, `--zh-success`, `--zh-*-soft` status pairs.

## Reuse guidance

Render it through `app-tournament-bracket`. If another screen needs a single match card, build the view with `buildDrawView` instead of hand-made view objects.
