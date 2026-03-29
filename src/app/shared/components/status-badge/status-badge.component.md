# StatusBadge

## Purpose
Displays a colored status badge using semantic design tokens.

## Inputs
| Input | Type | Description |
|-------|------|-------------|
| status | `string` | Status key mapped to styling: `open`, `closed`, `upcoming`, `in-progress`, `completed`, `draft`, `confirmed`, `pending`, `cancelled` |
| label | `string` | i18n translation key for display text |

## Theming
Uses `--zh-success-soft`, `--zh-danger-soft`, `--zh-warning-soft`, `--zh-info-soft` tokens.

## i18n
Label is a translation key rendered through the `t` pipe.
