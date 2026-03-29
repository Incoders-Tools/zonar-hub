# ConfirmDialog

## Purpose
Modal confirmation dialog for destructive actions (delete, exit, publish).

## Inputs
| Input | Type | Default | Description |
|-------|------|---------|-------------|
| titleKey | `string` | `'confirm.deleteTitle'` | i18n key for title |
| messageKey | `string` | `'confirm.deleteMessage'` | i18n key for message |
| warningKey | `string` | `'confirm.deleteWarning'` | i18n key for warning line |
| confirmLabelKey | `string` | `'common.confirm'` | i18n key for confirm button |
| confirmVariant | `'primary' \| 'danger'` | `'danger'` | Confirm button variant |
| loading | `boolean` | `false` | Loading state on confirm button |

## Outputs
| Output | Type | Description |
|--------|------|-------------|
| confirmed | `void` | User confirmed the action |
| cancelled | `void` | User cancelled |

## Accessibility
Uses `role="dialog"` and `aria-label`. Clicking overlay cancels.

## Theming
Uses semantic tokens. No hardcoded colors.

## i18n
All text uses translation keys.
