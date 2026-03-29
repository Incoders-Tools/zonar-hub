# CategoryHelpDialogComponent

## Purpose
Contextual help dialog explaining what categories are, how they are used, where they impact the system, and what the technical key field means.

## Inputs
None.

## Outputs
| Output | Type | Description |
|--------|------|-------------|
| `closed` | `void` | Emitted when user closes the dialog |

## Dependencies
- `TranslatePipe` — i18n key resolution

## Content Sections
1. Introduction — general explanation of categories
2. What are they used for? — tournaments, registrations, zone planning, rankings
3. Where do they impact? — system-wide effects
4. What is the technical key? — admin-only field explanation

## Accessibility
- Dialog has `role="dialog"` with `aria-label`
- Close button has `aria-label`

## i18n
Uses `categories.help.*` keys. Supported locales: es, en, pt.

## Theming
All styles use semantic tokens.
