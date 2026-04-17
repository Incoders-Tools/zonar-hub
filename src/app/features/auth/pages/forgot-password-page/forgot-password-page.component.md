# ForgotPasswordPageComponent

## Purpose

Allows users to request a password reset link by entering their registered email address.

## Business context

- Single-field form for email entry
- After submission, displays a success message confirming the link was sent
- No re-submit is available after success (prevents spam)

## Inputs / Outputs

Routed page component with no inputs or outputs.

## Dependencies

- `AuthService` — sends the password reset request
- `NotificationService` — success toast
- `I18nService` — translated messages

## States

| State | Description |
|-------|-------------|
| Default | Email field + submit button |
| Submitting | Spinner on submit button |
| Sent | Success message replaces the form |

## Accessibility

- Email field has `<label>` with `for`/`id` binding
- Submit disabled when form is invalid or submitting

## i18n keys

- `auth.forgotPassword`, `auth.forgotPasswordDesc`
- `auth.email`, `auth.sendResetLink`, `auth.resetLinkSent`, `auth.backToLogin`
- `common.required`, `common.invalidEmail`

## Theming

Uses shared auth SCSS via `@use '../../styles/auth-shared'`.

## Test expectations

- Form renders with email field
- Starts invalid, becomes valid with email
- Starts in unsent state
- Invalid email shows validation error

## Reuse guidance

Not reusable — route-level page.
