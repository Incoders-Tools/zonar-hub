# TermsDialogComponent

## Purpose

Modal dialog that displays localized terms-of-service content. Provides actions to accept or close the terms.

## Inputs

None (opened via `MatDialog`; data may be injected through `MAT_DIALOG_DATA` if needed).

## Outputs

| Output | Type | Description |
|--------|------|-------------|
| `closed` | `void` | Emitted (or dialog dismissed) when the user closes without accepting. |
| `accepted` | `void` | Emitted (or dialog result) when the user accepts the terms. |

## Dependencies

- Angular Material Dialog (`MatDialogRef`, `MAT_DIALOG_DATA`)
- i18n service for loading locale-specific terms content.

## States

| State | Description |
|-------|-------------|
| Loading | Terms content is being fetched or resolved for the active locale. |
| Ready | Terms text is displayed with Accept and Close actions. |

## Accessibility

- Dialog has `role="dialog"` and `aria-modal="true"`.
- Terms content is scrollable with keyboard.
- Accept and Close buttons are focusable and labeled.
- Focus is trapped inside the dialog while open.

## i18n

- Terms content is locale-specific (es, en, pt).
- Button labels use translation keys.

## Theming

- Dialog surface, typography, and button styles use semantic design tokens.
- Scrollable content area respects theme contrast requirements.

## Reuse guidance

Open via `MatDialog.open(TermsDialogComponent)`. Use the dialog result to determine whether the user accepted. Suitable for registration, onboarding, or any flow requiring legal agreement.
