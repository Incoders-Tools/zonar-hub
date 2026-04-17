# ResetPasswordPageComponent

## Purpose

Allows users to set a new password using a reset token received via email.

## Business context

- Accessed via a link from the forgot-password email flow
- Requires matching password and confirmation with minimum length
- Password strength indicator helps users pick a strong password
- After success, redirects to login

## Inputs / Outputs

Routed page component. Expects a reset token (currently hardcoded as `'mock-token'` for mock mode).

## Dependencies

- `AuthService` — submits the new password with the reset token
- `NotificationService` — success/error toasts
- `I18nService` — translated messages

## States

| State | Description |
|-------|-------------|
| Default | Password + confirm fields with strength indicator |
| Submitting | Spinner on submit button |
| Error | Translated error message |
| Success | Toast notification, redirect to `/login` |

## Accessibility

- All fields have `<label>` with `for`/`id` binding
- Password toggles have `aria-label`
- Submit disabled when form is invalid

## i18n keys

- `auth.resetPassword`, `auth.resetPasswordDesc`
- `auth.newPassword`, `auth.confirmPassword`, `auth.togglePassword`
- `auth.passwordMinLength`, `auth.passwordStrength.*`
- `auth.resetAction`, `auth.resetSuccess`, `auth.resetError`, `auth.backToLogin`
- `common.required`, `common.passwordMismatch`

## Theming

Uses shared auth SCSS via `@use '../../styles/auth-shared'`.

## Test expectations

- Form renders with password and confirm fields
- Starts invalid
- Detects password mismatch
- Valid when passwords match
- Password strength detection works
- Visibility toggles work

## Reuse guidance

Not reusable — route-level page. Shares `passwordMatchValidator` with RegisterPageComponent (could be extracted to shared validators if needed).
