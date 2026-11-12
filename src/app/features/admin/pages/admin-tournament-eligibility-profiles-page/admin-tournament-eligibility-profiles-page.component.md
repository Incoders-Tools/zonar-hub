# AdminTournamentEligibilityProfilesPageComponent

## Purpose
Manage the eligibility profiles of the active organization (D1, D5) through
`/api/admin/organizations/{organizationId}/eligibility-profiles`. A profile holds one rule slot per participant
(gender, category with one level of tolerance, minimum and maximum age, label, required). A tournament references a
profile from its own form (`TournamentsFormComponent`, R2b).

## Architecture
- **Page** — orchestration: filters, dialogs, row actions; reloads on init and per organization change
- **Facade** (`TournamentEligibilityProfilesFacadeService`) — state, genders and categories for the slot options,
  translated toasts for every API error code
- **Form panel** (`TournamentEligibilityProfilesFormPanelComponent`) — profile fields and the slot grid
- **Repository** — `ApiEligibilityProfileRepository`

`slot-editor/slot-editor.component.ts` is no longer used: slots are edited with the shared
`ChildCollectionGridComponent`.

## Inputs / Outputs
None (route-level container).

## States
- **Loading / Empty / Error** — `zh-collection-view`; the translated load error (`facade.error()`) renders above the list
- **Success** — save and delete toasts
- **Delete refused** — `eligibility_profiles.errors.in_use` (409) explains that a tournament still references the
  profile; the profile stays and the dialog remains open. Bulk delete stops at the first refusal and reloads.

## Business rules (help)
- An inactive profile is ignored: the tournaments that reference it apply their own category, gender and modality
  rules until it is reactivated (L8).
- A profile referenced by a tournament cannot be deleted.

## Table columns
Name (sortable), description, participants (slot count), status.

## Accessibility
Load error with `role="alert"`; dialogs and list from shared components.

## i18n
`admin.tournament-eligibility-profiles.*`, `eligibility_profiles.errors.*`. Locales: es, en, pt.

## Theming
Semantic tokens only.
