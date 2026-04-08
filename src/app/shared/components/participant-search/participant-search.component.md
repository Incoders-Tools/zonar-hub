# ParticipantSearchComponent

## Purpose
Shared component for searching and selecting participants (players) in registration flows. Supports eligibility validation, habitual partner suggestions, and availability state badges.

## Inputs

| Input | Type | Default | Description |
|---|---|---|---|
| `slotNumber` | `number` (required) | - | Slot index for this participant |
| `slotLabel` | `string` | `''` | i18n key for slot label |
| `tournamentId` | `string` (required) | - | Tournament context |
| `sportId` | `string` (required) | - | Sport context |
| `eligibilitySlot` | `TournamentEligibilitySlot \| null` | `null` | Eligibility constraints for this slot |
| `config` | `SportParticipantConfig` (required) | - | Sport registration config |
| `existingRegistrations` | `Registration[]` | `[]` | Existing registrations for duplicate check |
| `selectedPlayerIds` | `Set<string>` | `new Set()` | Players already selected in other slots |
| `disabled` | `boolean` | `false` | Disables interaction |
| `categories` | `Category[]` | `[]` | Categories for tolerance calculation |
| `habitualPartnerSuggestion` | `Player \| null` | `null` | Auto-suggest partner |

## Outputs

| Output | Type | Description |
|---|---|---|
| `playerSelected` | `{ slotNumber: number; player: Player }` | Emitted when player is selected |
| `playerCleared` | `number` | Emitted with slot number when cleared |

## Availability States

- `available` — green badge, selectable
- `alreadyRegistered` — gray badge, not selectable
- `incompatibleGender` — orange badge, not selectable
- `incompatibleCategory` — orange badge, not selectable
- `incompatibleAge` — orange badge, not selectable

## Usage

```html
<app-participant-search
  [slotNumber]="1"
  [tournamentId]="tournament.id"
  [sportId]="tournament.sportId"
  [config]="config"
  [eligibilitySlot]="profile.slots[0]"
  [existingRegistrations]="registrations"
  [categories]="categories"
  (playerSelected)="onPlayerSelected($event)"
  (playerCleared)="onPlayerCleared($event)">
</app-participant-search>
```

## Dependencies

- `MockPlayerRepository`, `EligibilityValidationService`
- `TranslatePipe`, `LoadingStateComponent`, `EmptyStateComponent`
- `ReactiveFormsModule`
