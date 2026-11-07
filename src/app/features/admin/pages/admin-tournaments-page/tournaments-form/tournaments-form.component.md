# TournamentsFormComponent

## Purpose
Create/edit form for a tournament in the tournaments admin page: identity, sport and modality, complexes and courts, dates and registration window, gender/category/rule set, capacity, active status, public visibility and share link, optional and technical fields.

## Inputs
- `tournament: Tournament | null` — `null` for create; a tournament pre-fills the form (including `isPublic`) and provides its read-only `publicSlug`.
- `saving: boolean` — async-button loading state.

## Outputs
- `saved: Partial<Tournament>` — emitted after `TournamentsFacadeService.saveTournament` succeeds. The payload includes `isPublic`; it never includes `publicSlug`.
- `cancelled: void`

## Dependencies
- `TournamentsFacadeService` (page-scoped) — lookups, courts, uniqueness checks, status computation and save
- `PublicTournamentLinkService` (`core/services/public-tournament-link.service.ts`) — builds the share URL `{origin}/tournaments/{publicSlug}` and copies it with toast feedback
- `AuthService`, `I18nService`, `DateFormatService`
- Shared: `FormShellComponent`, `AsyncButtonComponent`, `CollapsibleSectionComponent`, `ChildCollectionGridComponent`, `ActiveToggleComponent`, `DateInputComponent`, `ZhSelectComponent`, `TranslatePipe`, `MatIcon`
- Shared validator: `dateRangeValidator` for the tournament and registration ranges

## Public visibility and share link
- "Show publicly" toggle (`isPublic`, off for new tournaments) reuses `app-active-toggle` with Public/Private labels.
- Business help: public tournaments appear in the ZonarHub tournaments section and get a shareable link for competitors; private ones are only visible in the backoffice; the link stays the same if visibility is turned off and on again.
- Share block, driven by the current toggle value and the saved slug:

| Toggle | `publicSlug` | Shown |
| --- | --- | --- |
| Off | any | nothing |
| On | present | link `{origin}/tournaments/{slug}` (opens in a new tab, `rel="noopener noreferrer"`) and a "Copy link" button |
| On | missing | note: the link is generated when the tournament is saved as public |

- Copy writes the URL with `navigator.clipboard.writeText` and shows `admin.tournaments.share.copySuccess`, or `admin.tournaments.share.copyError` when the clipboard is unavailable or refuses.
- The API generates the slug on the first public save and never changes it; the client never sends it.

## Validation and disabled submit
Submit is disabled while the form is invalid (required name, sport, modality, dates, gender; date ranges; `maxPairs ≥ 2`; key pattern). On submit the form also requires at least one complex and checks key/name uniqueness.

## States
- Create / edit
- Registration dates disabled until both tournament dates exist (with hint)
- Courts loading / empty
- Public with link / public pending link / private
- Saving (async-button loader); save errors are reported by the facade toast (`tournaments.errors.forbidden` for a tenant refusal, `toast.error` otherwise)

## Accessibility
- The share link is a real anchor with the full URL as text; the copy button has a translated `aria-label` and visible text; the icon is `aria-hidden`.
- The pending-link note uses `role="status"`.

## i18n
`admin.tournaments.form.*`, `admin.tournaments.form.visibility.*`, `admin.tournaments.share.*`, `admin.tournaments.error.*`, `common.*` in es, en and pt.

## Theming
Share block uses `--zh-surface-muted`, `--zh-border-subtle`, `--zh-text-link` and spacing/radius tokens. No hardcoded colors in the new styles.

## Reuse guidance
Build public tournament URLs only through `PublicTournamentLinkService` / `publicTournamentPath` so backoffice links and the public route stay in sync.
