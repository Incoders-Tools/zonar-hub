# CategoryFormPanelComponent

## Purpose
Dialog component for creating and editing categories. Implements reactive form with name normalization, auto-generated key, level validation, active toggle, and sort order.

## Inputs
| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `category` | `Category \| null` | `null` | Category to edit; `null` for create mode |
| `saving` | `boolean` | `false` | Whether a save operation is in progress |

## Outputs
| Output | Type | Description |
|--------|------|-------------|
| `saved` | `void` | Emitted after successful save |
| `cancelled` | `void` | Emitted when user cancels |

## Dependencies
- `EntityKeyService` — shared key generation and name normalization
- `CategoryFacadeService` — save operations and existing key retrieval
- `FormShellComponent` — shared form layout wrapper
- `AsyncButtonComponent` — submit button with loading state

## Field Rules
- **name**: required, max 100 chars, normalized to sentence case on blur
- **key**: auto-generated from name via `EntityKeyService`, snake_case, unique validation, admin-only visible/editable
- **level**: required, integer 1–99
- **sortOrder**: required, integer ≥ 0
- **isActive**: boolean toggle, defaults to `true`

## Accessibility
- Dialog has `role="dialog"` with `aria-label`
- All form fields have associated `<label>` elements
- Submit is disabled until form is valid and key is unique

## i18n
Uses `categories.form.*` and `categories.validation.*` keys.

## Theming
All styles use semantic tokens. No hardcoded colors.
