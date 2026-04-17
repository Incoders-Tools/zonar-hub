# RegistrationWizardPageComponent

## Purpose

Multi-step wizard guiding players through tournament registration, including partner selection, availability, and confirmation.

## Business context

- Accessed via `/register/:tournamentId` or similar route
- Steps: tournament info → partner search → availability selection → confirmation
- Uses a stepper UI for progressive disclosure
- Validates prerequisites at each step before allowing progression
- Integrates participant search with async lookup
- Supports availability time-slot selection

## Inputs / Outputs

Routed page. Reads tournament `id` from route params.

## Dependencies

- `WizardFacadeService` — orchestrates wizard state and API calls
- `StepperComponent` — shared multi-step UI
- `ParticipantSearchComponent` — async player search
- `AsyncButtonComponent` — submit with loading state
- `AvailabilitySelectorComponent` — time-slot picker
- `TutorialModalComponent` — first-time user guidance
- `NotificationService` — success/error feedback

## States

| State | Description |
|-------|-------------|
| Loading | Fetching tournament and registration data |
| Step 1 | Tournament info and category selection |
| Step 2 | Partner search and selection |
| Step 3 | Availability time-slot selection |
| Step 4 | Confirmation and submit |
| Submitted | Success state with confirmation |
| Error | Error feedback at any step |

## Accessibility

- Stepper provides keyboard navigation between steps
- Form fields have labels and validation messages
- Submit button disabled until all prerequisites met

## i18n keys

Registration wizard keys under `registration.wizard.*`

## Theming

All tokens via `--zh-*`.

## Test expectations

- Component has existing spec file
- Tests cover step navigation, form validation, and submission flow
