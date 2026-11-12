# RegistrationFormPanelComponent

## Purpose

Inline panel of the admin registrations page that creates a registration for the selected tournament from players of its organization (S3, S4). There is no edit mode: a stored registration only changes status or payment from the list.

## Business context

- The slots are the client mirror of D3: the tournament's active eligibility profile, else its own modality, gender and category (L8). An inactive profile is ignored. The `mixed` gender admits any player.
- The API checks the same rules again and decides the final status: `pending` becomes `waitlisted` when the places are taken; `confirmed` needs a free place (`registrations.errors.capacity_reached` otherwise).
- A player may hold one active registration (`pending`, `confirmed`, `waitlisted`) per tournament (D1).

## Data flow

```
tournament input
  -> ApiTournamentAdminRepository.getEligibilityProfileId + ApiCategoryRepository.getAll + ApiGenderRepository.getAll
  -> ApiEligibilityProfileRepository.getById (when a profile is assigned)
  -> EligibilityValidationService.resolveSlots(profile, tournament rules)
  -> one ParticipantSearchComponent per slot
  -> EligibilityValidationService.validateAllParticipants(..., { tournament, genders })
  -> RegistrationFacadeService.create(body)
```

## Inputs

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `tournament` | `Tournament` | required | Tournament of the registration. |
| `capacity` | `RegistrationCapacity \| null` | `null` | Places of the tournament; a full tournament refuses the `confirmed` status. |
| `registrations` | `TournamentRegistration[]` | `[]` | Players of active registrations appear as unavailable in every slot. |
| `saving` | `boolean` | `false` | Create in progress (facade). |

## Outputs

| Output | Type | Description |
| --- | --- | --- |
| `saved` | `void` | The API created the registration. |
| `cancelled` | `void` | The user closed the panel. |

## Form

| Control | Rules |
| --- | --- |
| `status` | `pending` (default) or `confirmed`; `confirmed` with a full tournament shows `registrations.capacity.fullExplanation` and keeps save disabled. |
| `contactEmail` | Optional, `Validators.email`. |
| `notes` | Optional, at most 2000 characters. |
| `publicNameConsent` | Shows the pair's names on the public confirmed list (D4). |

Save (`app-async-button`) needs: valid fields, every required slot filled, no slot outside the rules, every player eligible, a free place for `confirmed`, the rules loaded and no running save. While disabled, `registrations.form.saveDisabledHint` explains why.

## States

- Loading the tournament rules (status region).
- Rules error: the translated key with `data-state="rules-error"`; no slots, save disabled.
- Per-slot eligibility errors (`validation.eligibility.*`) under the slot; structure errors after a save attempt.
- Refused create: the facade shows the translated API error and the panel stays open.

## Dependencies

`RegistrationStrategyService` (sport config), `EligibilityValidationService`, `ApiTournamentAdminRepository`, `ApiEligibilityProfileRepository`, `ApiCategoryRepository`, `ApiGenderRepository`, `RegistrationFacadeService` (from the page), `FormShellComponent`, `AsyncButtonComponent`, `CollapsibleSectionComponent`, `ParticipantSearchComponent`, `FormatDatePipe`.

## Accessibility notes

The status choice is a `fieldset` with a `legend`; inputs have labels; the capacity and rules errors use `role="alert"`; the loading line is a `status` region.

## i18n notes

Keys under `registrations.form.*`, `registrations.capacity.*`, `registrations.errors.*` and `validation.eligibility.*`, in es, en and pt.

## Theming notes

Only semantic `--zh-*` tokens in the SCSS.

## Tests

`registration-form-panel.component.spec.ts`: tournament slots without a profile, active and inactive profiles, rules error, save disabled until every slot holds an eligible player, gender mismatch, `mixed` gender, unavailable players, confirmed refused while full, create body in slot order, refused create keeps the panel open, invalid email, cancel.

## Reuse guidance

Eligibility rules live in `EligibilityValidationService`; do not re-implement them here. The public wizard (F3) uses the same service.
