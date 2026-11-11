# TournamentEligibilityProfilesFormPanelComponent

## Purpose
Create and edit an eligibility profile (`EligibilityProfileBody`): name, description, status and one rule row per
participant slot.

## Inputs
| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `profile` | `TournamentEligibilityProfile \| null` | `null` | Profile to edit; `null` creates one |
| `saving` | `boolean` | `false` | Save in progress |
| `genders` | `Gender[]` | `[]` | Active genders become the slot gender options |
| `categories` | `Category[]` | `[]` | Active categories become the slot category options |

## Outputs
| Output | Type | Description |
|--------|------|-------------|
| `saved` | `void` | Emitted after a successful save |
| `cancelled` | `void` | Emitted when the user cancels |

## Dependencies
`TournamentEligibilityProfilesFacadeService` (save, name hint), `FormShellComponent`, shared
`ChildCollectionGridComponent` (edit mode with a `FormArray`), `AsyncButtonComponent`, `ActiveToggleComponent`.

## Validation (mirrors the API)
- Name required, up to 120 characters, not used by another profile of the organization in any case (client hint for
  the API `name_taken`)
- Description up to 500 characters
- At least one slot; slot numbers 1..16 without repeats; ages 0..120 with the maximum not below the minimum; label up
  to 60 characters
- New profiles start with two required slots; added rows take the next free number

Empty gender, category or age means "no rule" and is sent as `null`.

## Disabled-action behaviour
Submit stays disabled while any rule above fails, while saving, and in edit mode until something changed. The broken
slot rules are listed under the grid with `role="alert"`.

## Variants
Create (always active) and edit (status toggle; an inactive profile is ignored by its tournaments, L8).

## i18n
`admin.tournament-eligibility-profiles.form.*`, `eligibility_profiles.errors.*`.

## Theming
Semantic tokens only.

## Reuse guidance
Slot rows reuse the shared child-collection grid; do not reintroduce a feature-specific slot table.
