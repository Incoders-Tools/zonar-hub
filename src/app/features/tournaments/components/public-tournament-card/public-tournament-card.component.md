# PublicTournamentCardComponent

## Purpose

Card of one public tournament, shared by the `/tournaments` showcase and the home upcoming-tournaments section.

## Feature context

Public tournament showcase (S4, S5, S6). Data comes from `GET /api/public/tournaments` through `PublicTournamentService`.

## Inputs

| Input | Type | Description |
| --- | --- | --- |
| `tournament` | `PublicTournament` (required) | One item of the public list. |

## Outputs

None. Navigation uses router links built with `publicTournamentPath(slug)`.

## Dependencies

- `SportIconComponent` (`<app-sport-icon>` with the API `icon` / `iconSource`)
- `StatusBadgeComponent` (status name and variant from `publicTournamentStatusVariant`)
- `PublicOrganizationCardComponent` (compact variant)
- `FormatDatePipe`, `TranslatePipe`, `MatIcon`, `RouterLink`
- `localizedPublicName` for multilingual names (status, modality)

## Content and states

| Element | Rule |
| --- | --- |
| Image | `imageUrl`, else `coverImageUrl`; hidden when neither exists |
| Sport icon | Hidden when `sport` is null |
| Status | Name for the active locale (falls back to es, en, pt, then the key); hidden when `status` is null |
| Dates | Start date, plus end date when it differs |
| Complex | Name and address; hidden when `complex` is null |
| Tags | Category name, gender name, modality name for the active locale, skipping nulls |
| Organization | Compact organization block only when `organization` is not null |
| Links | The name and the "View tournament" call to action go to `/tournaments/<slug>` |

The organization block sits outside the tournament link, so its links are separate valid anchors.

## Accessibility notes

- `article` with an `h3` title link.
- Decorative icons and the image are hidden from assistive technology; the dates and complex rows carry visually hidden labels.
- The call to action's accessible name includes the tournament name.

## i18n considerations

Keys: `publicTournaments.card.viewDetails`, `tournaments.dates`, `tournaments.complex`. Catalog names come from the API.

## Theming considerations

Only `--zh-*` tokens and the shared SCSS mixins (`card`, `focus-ring`, `visually-hidden`).

## Reuse guidance

Use it for any list of public tournaments. Backoffice lists use `zh-collection-view` instead.
