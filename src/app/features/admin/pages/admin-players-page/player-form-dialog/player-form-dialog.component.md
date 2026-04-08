# PlayerFormDialogComponent

## Purpose
Dialog component for creating and editing players. Implements reactive form with required fields (name, email, gender, category), optional fields in a collapsible section (phone, document, birth date, city, ranking, photo), sport selection, and active toggle.

## Inputs
| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `player` | `Player \| null` | `null` | Player to edit; `null` for create mode |
| `saving` | `boolean` | `false` | Whether a save operation is in progress |
| `categories` | `Category[]` | `[]` | Available categories for select |
| `genders` | `Gender[]` | `[]` | Available genders for select |
| `sports` | `Sport[]` | `[]` | Available sports for select |

## Outputs
| Output | Type | Description |
|--------|------|-------------|
| `saved` | `void` | Emitted after successful save |
| `cancelled` | `void` | Emitted when user cancels |

## Dependencies
- `PlayerFacadeService` — save operations
- `FormShellComponent` — shared form layout wrapper
- `AsyncButtonComponent` — submit button with loading state
- `CollapsibleSectionComponent` — collapsible optional fields section

## Field Rules
- **firstName**: required, max 100 chars
- **lastName**: required, max 100 chars
- **email**: required, email format, max 200 chars
- **genderId**: required (select)
- **categoryId**: required (select)
- **sportId**: optional (select)
- **phone**: optional
- **documentId**: optional
- **birthDate**: optional (date input)
- **city**: optional
- **ranking**: optional, min 1
- **photoUrl**: optional (URL)
- **isActive**: boolean toggle, defaults to `true`

## Accessibility
- Dialog has `role="dialog"` with `aria-label`
- All form fields have associated `<label>` elements
- Submit is disabled until form is valid

## i18n
Uses `admin.players.form.*` and `admin.players.validation.*` keys.

## Theming
All styles use semantic tokens. No hardcoded colors.
