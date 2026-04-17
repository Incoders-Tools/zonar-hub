# LoginPageComponent

## Purpose

Authentication entry point for Zonar Hub. Allows registered users to sign in with email and password credentials.

## Business context

- Used by all user roles: players, admins, system admins
- After login, users are routed based on role (admin → `/admin`, player → `/player`)
- System admins who need onboarding are redirected to `/admin/onboarding`
- Brute-force protection: after repeated failures, the account is temporarily blocked

## Inputs / Outputs

This is a routed page component with no explicit inputs or outputs.

## Dependencies

- `AuthService` — handles login API call
- `AttemptGuardService` — tracks failed login attempts and enforces temporary blocking
- `OnboardingStateService` — checks whether admin onboarding wizard is needed
- `NotificationService` — displays success/error toast messages
- `I18nService` — resolves translated notification messages
- `ProgressBarComponent` — shows a multi-stage progress bar during login

## States

| State | Description |
|-------|-------------|
| Default | Email and password form visible, submit disabled until valid |
| Submitting | Progress bar with stages: connecting → verifying → establishing → complete |
| Error | Translated error message with remaining attempts counter |
| Blocked | Account locked message, submit permanently disabled |

## Accessibility

- All form fields have associated `<label>` elements with `for`/`id` binding
- Password toggle button has `aria-label`
- Submit button is disabled when form is invalid or account is blocked
- Keyboard navigation follows natural tab order

## i18n keys

- `auth.login`, `auth.loginDesc`, `auth.email`, `auth.password`
- `auth.togglePassword`, `auth.loginAction`
- `auth.forgotPassword`, `auth.noAccount`, `auth.registerLink`
- `auth.accountBlocked`, `auth.invalidCredentials`, `auth.attemptsRemaining`
- `auth.loginSuccess`
- `auth.progress.connecting`, `auth.progress.verifying`, `auth.progress.establishing`, `auth.progress.complete`
- `common.required`, `common.invalidEmail`

## Theming

Uses shared auth SCSS via `@use '../../styles/auth-shared'`. All colors reference design tokens (`--zh-*`).

## Test expectations

- Form renders with email and password fields
- Form starts invalid
- Becomes valid with proper email and password
- Password visibility toggles
- Submit is disabled when form invalid or blocked
- Blocked state prevents submission

## Reuse guidance

Not reusable — this is a route-level page. Shared styles live in `features/auth/styles/_auth-shared.scss`.
