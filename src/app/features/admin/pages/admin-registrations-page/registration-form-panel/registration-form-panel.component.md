# RegistrationFormPanelComponent

## Purpose
Inline form panel for creating and editing tournament registrations from the admin registrations page. Dynamically resolves participant slot count and eligibility constraints based on the selected tournament's sport and tournament type.

## Architecture

### Data Flow
```
RegistrationFormPanel
  -> user selects tournament
  -> RegistrationStrategyService resolves SportParticipantConfig
  -> MockEligibilityProfileRepository loads slot constraints
  -> ParticipantSearch components render per slot
  -> user searches/selects players
  -> EligibilityValidationService validates all participants
  -> RegistrationFacadeService.save() persists
```

## Inputs

| Input | Type | Default | Description |
|---|---|---|---|
| `registration` | `Registration \| null` | `null` | Registration to edit (null = create mode) |
| `saving` | `boolean` | `false` | Loading state from facade |

## Outputs

| Output | Type | Description |
|---|---|---|
| `saved` | `void` | Emitted when form saved successfully |
| `cancelled` | `void` | Emitted when user cancels |

## Internal State (Signals)

| Signal | Type | Description |
|---|---|---|
| `tournaments` | `Tournament[]` | Available tournaments |
| `selectedTournament` | `Tournament \| null` | Currently selected tournament |
| `config` | `SportParticipantConfig \| null` | Strategy config for sport + type |
| `eligibilityProfile` | `TournamentEligibilityProfile \| null` | Eligibility profile with slot constraints |
| `slots` | `TournamentEligibilitySlot[]` | Dynamic participant slots |
| `participants` | `Map<number, Player>` | Selected players by slot number |
| `categories` | `Category[]` | Categories for tolerance calculation |
| `existingRegistrations` | `Registration[]` | Existing registrations for duplicate checks |
| `validationErrors` | `ParticipantValidationResult[]` | Validation results per slot |

## Form Fields

| Field | Type | Validators | Description |
|---|---|---|---|
| `tournamentId` | `select` | Required | Tournament selection (disabled in edit mode) |
| `source` | `hidden` | - | Always 'admin' |
| `observations` | `textarea` | - | Optional notes |

## Tournament Change Flow

1. User selects tournament from dropdown
2. `onTournamentChanged()` fires
3. Loads `SportParticipantConfig` via `RegistrationStrategyService`
4. Loads `TournamentEligibilityProfile` if configured
5. Builds slot array (from profile or default)
6. Loads existing registrations for duplicate detection
7. Renders `ParticipantSearchComponent` per slot

## Validation

- Tournament selection is required
- All required slots must have a selected player
- Cross-slot duplicate player detection
- Per-slot eligibility validation (gender, category tolerance, age)

## Dependencies

- `RegistrationStrategyService` — resolve sport + type to config
- `EligibilityValidationService` — validate participants
- `MockEligibilityProfileRepository` — load eligibility profiles
- `TournamentService` — tournament list and details
- `MockCategoryRepository` — categories for tolerance
- `RegistrationService` — existing registrations
- `RegistrationFacadeService` — save operation
- `FormShellComponent`, `AsyncButtonComponent`, `CollapsibleSectionComponent`, `ParticipantSearchComponent`

## i18n Keys

- `registrations.form.tournament`
- `registrations.form.selectTournament`
- `registrations.form.tournamentRequired`
- `registrations.form.participantsSection`
- `registrations.form.observations`
- `registrations.form.observationsPlaceholder`
- `registrations.form.source`

## Testing

- Component creation
- Create vs edit mode detection
- Tournament selection required validation
- Participant selection/clearing
- selectedPlayerIds computation
- Cancel emits event
