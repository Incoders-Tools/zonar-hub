# AdminDrawPlannerPageComponent

## Purpose

Admin draw page (D9) of one tournament: the organizer enters the participants (table rows or a pasted list), chooses the format, options and randomization, previews the draw, saves it as a draft, publishes or unpublishes it and deletes it. It replaces the former in-memory zone planner; the API is the source of truth.

## Feature context and business intent

- One draw per tournament (D1): `draft` (private, editable) → `published` (shown on the public tournament page when the tournament is public).
- A draw whose matches have results can no longer be regenerated, replaced (save draft) or deleted. Result entry per match is F3.
- Participants are entered manually (S4); registrations will feed them later.

## Routes

| Route | Behaviour |
| --- | --- |
| `/admin/tournaments/:tournamentId/draw` | The draw page of the tournament. Reached from the "Draw" row action of the tournaments list. |
| `/admin/draw-planner` | Kept for the existing menu entry: without a tournament id the page is a tournament picker; choosing a tournament navigates to `/admin/tournaments/:id/draw`. |

Both routes use `data: { toolKey: 'draw-planner' }` with `toolGuard` (unchanged tool semantics).

## Inputs / outputs

None (route-level container). The tournament id comes from the `tournamentId` route parameter.

## Dependencies

- `DrawPlannerService` (provided by the page): tournament + stored draw + unsaved preview state; calls `ApiTournamentDrawRepository` (D5 endpoints) and `ApiTournamentAdminRepository.getById`.
- `draw-participant-entries.ts` (pure): paste parser, participant validation, request mapping, seed validation.
- `TournamentService` (picker list), `NotificationService` (toasts), `I18nService`.
- Shared: `FormShellComponent`, `ChildCollectionGridComponent` (participant rows, add/remove/reorder), `ZhSelectComponent`, `AsyncButtonComponent`, `ConfirmDialogComponent`, `HelpButtonComponent`, `ProgressBarComponent`, `LoadingStateComponent`, `ErrorStateComponent`, `EmptyStateComponent`, `StatusBadgeComponent`, `TournamentBracketComponent` (the shared draw view).

## Form (Reactive Forms)

| Control | Rules |
| --- | --- |
| `format` | `singleElimination` · `roundRobin` · `groupsThenKnockout` |
| `participationFormat` | `pair` · `individual` · `team`; defaults from the tournament modality (singles → individual, team modalities → team, otherwise pair). Changing it changes the participant columns. |
| `thirdPlaceMatch` | Single elimination and groups then knockout. |
| `legs` | 1 or 2; round robin and the group stage. |
| `groupSizing` + `groupCount` (≥ 1) / `groupSize` (≥ 2), `qualifiersPerGroup` (≥ 1) | Groups then knockout; only the chosen sizing is sent. |
| `thirdSetSuperTiebreak` | Scoring option used by result entry (D3). |
| `randomizationMode` | `seeded` (seed ranks respected) · `random` (seed ranks ignored). |
| `seed` | Optional unsigned 64-bit decimal. Empty → the API generates one; after a preview the field shows the seed used, so saving reproduces the previewed draw. |
| `participants` | `FormArray` of rows (`id`, `displayName`, `member1`, `member2`, `teamMembers`, `seedRank`, `separationKey`). |

Participant columns per format: pair → player 1, player 2, display name (optional, defaults to "Player 1 / Player 2"), seed, club; individual → player, seed, club; team → team name, members separated by `/`, seed, club.

Participant validation (`validateDrawParticipantEntries`, same rules as the API): 2–256 participants; every member name filled; pair = 2 names, individual = 1, team needs a name and at least one member; seed rank a whole number ≥ 1; no duplicate names (case-insensitive) or seed ranks. Issues are listed by row ("Row 3: …").

## Paste syntax (`parseDrawParticipantPaste`)

One participant per line; empty lines are ignored.

- Pair: `Name A / Name B`
- Individual: `Name`
- Team: `Team name: Member / Member / Member`
- Optional seed rank `[n]` anywhere in the line (one per line, whole number ≥ 1) and club `#Club` at the end, e.g. `Ana Gómez / Bea Pérez [1] #Club Norte` or `Ana Gómez / Bea Pérez #Club Norte [1]`.

"Check list" shows the parsed entries or the issues by line ("Line 3: …"); "Replace participants" / "Add to the list" stay disabled until the list is valid. The syntax is also in the page help.

## Actions and disabled rules

| Action | Enabled when | Effect |
| --- | --- | --- |
| Preview | valid form and participant list, no results, no running action | `POST preview`; renders the bracket and the separation-conflicts warning; nothing saved. Shows a simulated staged progress bar (planner rule). |
| Regenerate (when a draw exists) | as Preview | Clears the seed and previews with a new API seed. |
| Save draft | as Preview | `PUT draw`; the draw becomes `draft` (also when it was published). |
| Publish | draw saved as `draft` and no unsaved preview | `POST publish`. |
| Unpublish | draw `published` | `POST unpublish`; results are kept. |
| Delete | draw `draft` without results | Confirm dialog, then `DELETE`; the participant list stays in the form. |

Every action uses `app-async-button` (loading + duplicate-click guard). API failures show the translated key from `drawErrorKey` as an error toast.

## States

- Picker: loading / empty (no tournaments) / select.
- Draw page: loading (`app-loading-state`), error with retry (`app-error-state`), tournament not found (`app-empty-state`), no draw yet (status "No draw", empty result section), draft, published, unsaved preview (labelled "Unsaved preview", discardable), results lock.

## Business help

Inline hints (`data-hint`): results lock, fix participants, saving a published draw returns it to draft, preview vs save vs regenerate, save before publish, unpublish before delete, a draw with results cannot be deleted, and public visibility (public tournament → shown on its public page; private tournament → not public until the tournament is public). The help button explains the steps, the paste syntax, states, results and visibility (clubs are never shown publicly).

## Accessibility notes

- Sections are `section` elements labelled by their headings; inputs have labels; invalid inputs set `aria-invalid`; hints of the seed and paste box are linked with `aria-describedby`.
- The participant count is a `status` region; issue lists are `aria-live="polite"`.
- Decorative icons are `aria-hidden`; the progress bar exposes its stage label.

## i18n notes

Keys under `adminDraw.*` (page) and `draws.errors.*` (API problem codes, including `draws.errors.results.*` for F3), plus `admin.tournaments.actions.draw`, in es, en and pt. Messages with counts use `{count}`, `{min}`, `{max}` and `{n}` placeholders interpolated in the component.

## Theming notes

Only `--zh-*` semantic tokens (surfaces, borders, text, primary, warning, danger). No hardcoded colors.

## Reuse guidance

- Do not add a second planner: extend this page (F3 adds result entry here).
- Keep parsing and validation in `draw-participant-entries.ts` and HTTP in `ApiTournamentDrawRepository`.
- Render draws only through `<app-tournament-bracket>`.

## Known limits

- Changing the participation format keeps the row values of the shared controls (`member1`, `member2`, `displayName`); team members are not converted from pair rows.
- Whether a draw "has results" is computed from the loaded draw (any match with a stored result, including a `scheduled` result with only court/time); the API remains the authority and answers 409 otherwise.
