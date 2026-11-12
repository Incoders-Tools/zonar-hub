# RegistrationWizardPageComponent

## Purpose

Anonymous registration of a pair (or of the modality's participants) on a public tournament, verified by an emailed code (S2, S4; D2, D3, D4 of `odd/tasks/registrations.md`).

## Business context

- Route: `/tournaments/:slug/register`, reached from the register call to action of the public tournament page. The tournament is addressed only by its share slug; no session or organization is needed.
- Reads only the public API (`docs/api/public-registrations.md` in the API repository) through `WizardFacadeService`: the tournament (`PublicTournamentService.getBySlug`), the form data (`GET …/registration`), the anonymous catalogs `/api/catalog/genders` and `/api/catalog/categories`, the code (`POST …/registration/code`) and the submission (`POST …/registration`).
- Participants are typed per slot (first and last name, optional email, phone, document, birth date, gender, category, club). There is no player search: the public form never reveals stored players (L9).
- Slot rules come from the API info and are shown per slot (gender, category with its tolerance, age limits). `EligibilityValidationService` mirrors them as a live pre-check (D3, L8: missing data a rule needs fails that rule). The server decides; its refusals are shown translated.
- Steps: participants → verification (contact email, code, public name consent, submit) → result. Nothing is written until the submission succeeds; on a refusal the data and the code stay so the visitor can correct and resend.
- Result: the reference (registration id), the `pending` or `waitlisted` explanation (D2), and the fee due or "no fee". There is no online payment yet (MP1/MP2).

## Inputs / Outputs

Routed page. Reads `slug` from the route snapshot.

## Dependencies

- `WizardFacadeService` (component-scoped) — state, pre-check, code wait, single submission
- `StepperComponent`, `AsyncButtonComponent`, `OtpInputComponent`, `DateInputComponent`, `PhoneInputComponent`
- `LoadingStateComponent`, `ErrorStateComponent`, `TutorialModalComponent`
- `NormalizeNameDirective`, `NormalizeLowercaseDirective`, `TranslatePipe`, `FormatDatePipe`

## States

| State | Description |
|-------|-------------|
| Loading | Shared loading state while tournament, info and catalogs load |
| Error | Shared error state with a retry |
| Not found | Tournament not public (404): message and link back to the tournament page |
| Closed | Window not started or ended, or a `public_registrations.closed` answer meanwhile: reason, window dates, link back |
| Participants | One fieldset per slot; places left or waitlist hint and fee in the header |
| Verification | Contact email, send/resend code, 6-digit code, consent, submit |
| Result | Reference, status explanation, payment, links to the tournament and its confirmed pairs |

## Validation and action enablement

- Next stays disabled until every required slot has first and last name, field limits hold (names 100, phone and document 40, club 120, email 200), an optional slot has both names or none, and the pre-check passes (slot rules, missing data, a repeated email or document). A hint explains why.
- Send code needs a valid contact email and no running wait. After `202` the resend wait from the API (`resendAfterSeconds`) counts down visibly. A `429 code_cooldown` or a `429` of the rate limit shows its message and a 60-second countdown (the API cooldown).
- Submit needs the participants step valid, the code sent to the current address (changing the email asks for a new code), and 6 digits. It is disabled and shows a spinner while submitting; the facade also ignores a second call in flight, so a double click sends one request. The API itself accepts each code once.
- The consent checkbox is optional; its text is the API `consentTextKey`, translated. Without consent the pair is listed as "confirmed pair".

## Errors

Every documented code has a translation (`publicRegistrationErrorKey`): `public_registrations.errors.*` (`invalid_code`, `code_cooldown`, `too_many_requests`, `closed`, `participant_unavailable` with the L9 text, `not_found`), `players.errors.*`, `registrations.errors.*`, `eligibility_profiles.errors.not_found`; an undocumented code becomes `common.unexpectedError`.

## Accessibility

- Each slot is a `fieldset` with a `legend`; inputs have labels bound by id; required fields are marked.
- Pre-check errors, code errors and submission errors use `role="alert"`; the code-sent confirmation and the result status use `role="status"`.
- The countdown is not a live region, so screen readers are not interrupted every second; the send button's disabled state and the message tell the wait.
- Steps are `section`s labelled by their heading; buttons stay keyboard reachable.

## i18n keys

`registration.public.*`, `registration.step.*`, `registration.title`, `registration.sendCode`, `registration.resendCode`, `registration.enterCode`, `registration.verificationCode`, `registration.submit`, `registration.tutorial.*`, `admin.players.form.*` field labels, `public_registrations.*`, `validation.eligibility.*`, `publicTournaments.detail.notFound.*`. Amounts use `Intl.NumberFormat` with the active locale.

## Theming

All tokens via `--zh-*`; the slot grid becomes one column below 600 px.

## Test expectations

- Loads by slug; one typed form per API slot with its rules; no participant search
- Places left / waitlist hint; next disabled until required names and pre-check pass
- Code: send, countdown, cooldown message, closed state with link back
- Submit: disabled until 6 digits, consent text from the API key, one request on double submit
- Each refusal translated (incl. the L9 text); result for pending, waitlisted, fee and no fee; not-found, closed and error states
