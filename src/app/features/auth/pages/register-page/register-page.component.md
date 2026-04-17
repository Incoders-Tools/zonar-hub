# RegisterPageComponent

## Purpose

Two-step registration page for new Zonar Hub users. Collects personal info, validates uniqueness, verifies email via OTP code, then creates the account.

## Business context

- Accepts an optional `?plan=` query parameter to pre-select a pricing plan badge
- Validates email and phone uniqueness before proceeding to verification
- Uses a 6-digit OTP verification step (max 3 attempts)
- After successful registration, admins are routed to onboarding, players to `/player`
- Password strength indicator guides users toward strong passwords

## Inputs / Outputs

Routed page component. Reads `plan` from query params.

## Dependencies

- `AuthService` — email/phone uniqueness checks, registration API
- `OnboardingStateService` — initializes onboarding for new users
- `NotificationService` — success/error toasts
- `I18nService` — translated messages
- `PhoneInputComponent` — international phone number input
- `OtpInputComponent` — 6-digit verification code input
- `TermsDialogComponent` — modal for terms and conditions

## States

| State | Description |
|-------|-------------|
| Form step | Personal info + security fields, terms checkbox |
| Email/phone taken | Warning with link to login instead |
| Verify step | OTP input with attempts counter |
| Verifying | Spinner during code validation |
| Code verified | Success message, register button enabled |
| Attempts exhausted | Max attempts reached, cannot retry |
| Submitting | Spinner on register button |

## Accessibility

- All fields have `<label>` with `for`/`id` binding
- Password toggles have `aria-label`
- Fieldsets group related fields with `<legend>`
- Checkbox label is clickable

## i18n keys

- `auth.register`, `auth.registerDesc`, `auth.section.personal`, `auth.section.security`
- `auth.fullName`, `auth.fullNamePlaceholder`, `auth.email`, `auth.emailPlaceholder`
- `auth.phone`, `auth.password`, `auth.confirmPassword`
- `auth.togglePassword`, `auth.passwordMinLength`, `auth.passwordStrength.*`
- `auth.acceptTermsPrefix`, `auth.acceptTermsLink`, `auth.mustAcceptTerms`
- `auth.emailAlreadyInUse`, `auth.phoneAlreadyInUse`, `auth.loginInstead`
- `auth.registerAction`, `auth.registerError`, `auth.registerSuccess`
- `auth.hasAccount`, `auth.loginLink`
- `verification.*` keys
- `common.required`, `common.minLength`, `common.passwordMismatch`, `common.next`, `common.back`

## Theming

Uses shared auth SCSS. All tokens via `--zh-*`.

## Test expectations

- Starts on form step with all fields
- Password strength detection works
- Terms acceptance from dialog
- Back button returns to form step
- Account creation blocked until OTP verified

## Reuse guidance

Not reusable — route-level page. Shared styles in `features/auth/styles/_auth-shared.scss`.
