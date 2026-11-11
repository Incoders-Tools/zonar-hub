# PlayerFormPanelComponent

## Purpose
Inline form to create and edit an organization player with the fields the API stores (`PlayerBody`).

## Inputs
| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `player` | `Player \| null` | `null` | Player to edit; `null` for create mode |
| `saving` | `boolean` | `false` | Whether a save is in progress |
| `categories` | `Category[]` | `[]` | Category options |
| `genders` | `Gender[]` | `[]` | Gender options |

## Outputs
| Output | Type | Description |
|--------|------|-------------|
| `saved` | `void` | Emitted after a successful save |
| `cancelled` | `void` | Emitted when the user cancels |

## Dependencies
`PlayerFacadeService` (save), `FormShellComponent`, `AsyncButtonComponent`, `CollapsibleSectionComponent`,
`PhoneInputComponent`, `DateInputComponent`, `ActiveToggleComponent`.

## Field Rules (API limits)
- **firstName**, **lastName**: required, up to 100 characters
- **email**: optional, valid email; unique in the organization (API `players.email_taken`)
- **genderId**, **categoryId**, **birthDate** (not in the future): optional
- **phone**, **documentId**: optional, up to 40 characters; the document is unique in the organization
- **club**: optional, up to 120 characters; pairs sharing a club are kept apart in the draw
- **isActive**: edit mode only; the API creates players active

## Business help
The eligibility hint explains that gender, category and birth date are optional, but a player missing the data a
tournament rule needs cannot register until the record is completed (D3, L8).

## Disabled-action behaviour
Submit stays disabled while the form is invalid, while saving, and in edit mode until something changed. API refusals
(for example `players.errors.document_taken`) arrive as translated toasts and keep the panel open.

## Accessibility
Every field has a `<label>`; validation messages render next to their field.

## i18n
`admin.players.form.*`, `players.errors.*`.

## Theming
Semantic tokens only.
