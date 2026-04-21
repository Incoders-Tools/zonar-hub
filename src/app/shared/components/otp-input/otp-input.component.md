# OtpInputComponent

## Purpose

A 6-digit one-time password input with individual character fields, auto-focus advancement, paste support, and backspace navigation. Used in authentication and verification flows.

## Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `length` | `number` | `6` | Number of OTP digits to render. |
| `disabled` | `boolean` | `false` | Disables all input fields. |
| `error` | `boolean` | `false` | Applies error styling to indicate an invalid code. |

## Outputs

| Output | Type | Description |
|--------|------|-------------|
| `codeComplete` | `string` | Emitted when all digits are filled. Contains the full OTP string. |
| `codeChanged` | `string` | Emitted on every digit change. Contains the current partial or full OTP string. |

## Dependencies

None (standalone component).

## States

| State | Description |
|-------|-------------|
| Empty | All fields are blank; focus is on the first field. |
| Partial | Some digits entered; focus advances automatically. |
| Complete | All digits filled; `codeComplete` is emitted. |
| Error | Red border/highlight applied to all fields. |
| Disabled | All fields are non-interactive. |

## Accessibility

- Each input field has an `aria-label` indicating its position (e.g., "Digit 1 of 6").
- Focus is programmatically managed on input and backspace.
- Paste from clipboard fills all fields at once.
- `aria-invalid` is set when `error` is `true`.

## i18n

- `aria-label` values use translation keys.
- No visible user-facing text beyond the digit inputs.

## Theming

- Input field borders, focus ring, and error state colors use semantic tokens.
- Spacing between fields uses the design-token scale.

## Reuse guidance

Use in any verification flow requiring a numeric code input. Adjust `length` if the OTP size differs from the default 6. Listen to `codeComplete` to trigger verification.
