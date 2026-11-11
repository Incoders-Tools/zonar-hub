# AdminRegistrationsPageComponent

## Purpose

Backoffice page of tournament registrations (S4) on the real admin API (`/api/admin/tournaments/{tournamentId}/registrations`, `docs/api/admin-registrations.md` in the API repository). The organizer picks a tournament, reads its places, and moves each registration through the D2 statuses and the manual payment marks (D5).

## Business context

- Registrations arrive `pending` (public form or admin create) or `waitlisted` when the places are taken. The organizer confirms or rejects them. Only confirmed registrations feed the draw (import on the draw page).
- Capacity is `maxPairs` over confirmed registrations. Confirming beyond it is refused.
- Payment: `notRequired`, `pending`, `paid`, `refunded` or `failed`. Cash payments are marked by hand: `paid` from `pending` or `failed`, `refunded` from `paid`.
- Every status and payment change sends the revision that was read. A stale revision (409 `registrations.errors.concurrent_modification`) reloads the list with a warning. Any other refusal reloads it with an error.

## Inputs / outputs

None (route-level container).

## Dependencies

- `RegistrationFacadeService` (provided by the page): selected tournament, list, capacity, filters, transitions, payment marks and create on `ApiRegistrationRepository`. It also holds the in-memory registration tokens of the tokens tab (`RegistrationService`).
- `TournamentService` (tournament list), `ActiveOrganizationService` (organization scope), `NotificationService`, `I18nService`.
- `RegistrationFormPanelComponent` (admin create).
- Shared: `ZhCollectionViewComponent`, `FilterPanelComponent`, `ConfirmDialogComponent`, `AsyncButtonComponent`, `HelpButtonComponent`, `ZhSelectComponent`, `EmptyStateComponent`, `SocialSharePreviewComponent`, `ChatbotBubbleComponent`.

## List tab

| Element | Behaviour |
| --- | --- |
| Tournament picker | Tournaments of the active organization. Changing it closes the form and any pending confirmation. Changing the organization clears the selection. |
| Capacity | Confirmed (`3 / 8`, or `3` without a limit), pending, waiting list and places left (`No limit` without a limit). When full, `registrations.capacity.fullExplanation` is shown. |
| Filters | Status is sent to the API. Search (participant name) and payment filter the loaded list. |
| Row actions | Only what D2 allows for the status: pending → confirm, reject, waitlist, cancel; waitlisted → confirm, cancel; confirmed → cancel; rejected and cancelled → none. Then the allowed payment mark, then share. |
| Confirm while full | Replaced by "Confirm (full)", which explains why instead of calling the API. |
| Confirm, waitlist, mark paid | Run at once. |
| Reject, cancel, mark refunded | Run only after the `app-confirm-dialog`; cancelling the dialog changes nothing. |
| New registration | Enabled with a tournament selected; opens the inline form panel. |

## States

- No tournaments (picker empty state), no tournament selected (`data-state="no-tournament"`).
- Loading, empty and error of the list (`zh-collection-view`), with the translated load error above the list and a retry.
- Success and failure toasts for every change.

## Other tabs

- Tokens: registration tokens of the selected tournament (in-memory mock, unchanged).
- Importer and AI agent: unchanged placeholders (simulated parsing and import).

## Accessibility notes

The tab bar uses `role="tablist"` and `aria-selected`. The picker and capacity sections are labelled by headings. The capacity hint is a `status` region, the load error an `alert`. Row action buttons carry translated `aria-label`s.

## i18n notes

Keys under `registrations.*` (picker, capacity, status, payment, source, action, confirmAction, feedback, errors, help) and `admin.registrations`, in es, en and pt. `capacitySummary` interpolates `{value}`.

## Theming notes

Status and payment pills use the shared variants (`active`, `warning`, `info`, `danger`, `inactive`). The SCSS uses `--zh-*` tokens only.

## Tests

`admin-registrations-page.component.spec.ts` (through the template, the real facade and a repository spy): organization-scoped picker, capacity with and without a limit, loading, empty and error states with retry, D2 actions per status, confirm at once, confirm replaced while full, reject, cancel and refund behind the confirm-dialog, status filter, create panel, organization change. `registration-facade.service.spec.ts` covers the facade.

## Reuse guidance

Keep the D2 and D5 tables in `tournament-registration.model.ts` (`allowedRegistrationTransitions`, `allowedManualPayments`); this page and the facade only read them.
