# ErrorStateComponent

## Purpose

Displays an error feedback state with a title, message, and an optional retry action. Used as the standard error placeholder across screens and data-loading flows.

## Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `title` | `string` | `undefined` | Translation key or text for the error title. |
| `message` | `string` | `undefined` | Translation key or text for the error description. |

## Outputs

| Output | Type | Description |
|--------|------|-------------|
| `retried` | `void` | Emitted when the user clicks the retry button. |

## Dependencies

None (standalone component).

## States

| State | Description |
|-------|-------------|
| Default | Error icon, title, and message are displayed with a retry button. |
| Without retry | If no listener is bound to `retried`, the retry button may be hidden. |

## Accessibility

- Error content uses `role="alert"` or `aria-live="assertive"` to announce the error.
- Retry button is keyboard-focusable and labeled.

## i18n

- `title` and `message` should be translation keys resolved by the consumer or an i18n pipe.
- Retry button label uses a translation key.

## Theming

- Error icon and title use the semantic error color token.
- Surface and message text use standard design tokens.

## Reuse guidance

Use as the standard error state in any screen or component that loads data asynchronously. Bind `(retried)` to re-trigger the failed operation. Prefer this over ad-hoc error UI.
