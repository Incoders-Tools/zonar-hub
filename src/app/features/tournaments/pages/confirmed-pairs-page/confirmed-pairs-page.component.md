# ConfirmedPairsPageComponent

## Purpose

Displays the confirmed pairs of a public tournament (S4: only confirmed registrations are listed).

## Business context

- Route: `/tournaments/:slug/confirmed-pairs`. The tournament is resolved by its public slug through `PublicTournamentService`; the back link uses `publicTournamentPath`.
- Pairs come from the anonymous `GET /api/public/tournaments/{slug}/confirmed-pairs` (`ApiPublicRegistrationRepository.getConfirmedPairs`), in registration order.
- Names appear only for registrations that gave public name consent (D4). The others carry only a `labelKey`, shown translated (`public_registrations.confirmed_pairs.anonymous`); an unknown key falls back to that label so no raw key reaches the page.
- Read-only public view; no ids, emails or phones are received.

## Inputs / Outputs

Routed page. Reads `slug` from route params.

## Dependencies

- `PublicTournamentService` — tournament name for the header
- `ApiPublicRegistrationRepository` — confirmed pairs (public request, no credentials)
- `LoadingStateComponent`, `ErrorStateComponent`, `EmptyStateComponent`

## States

| State | Description |
|-------|-------------|
| Loading | Shared loading state while both requests run |
| Empty | No confirmed pair yet (`confirmedPairs.empty`) |
| Loaded | Ordered list of pair cards with position and member names |
| Not found | The tournament is not public (404); link to the tournament list |
| Error | Shared error state with a retry that reloads both requests |

## Accessibility

- The pairs are an ordered list (`ol`); the position badge and the `&` separator are decorative (`aria-hidden`).
- Not-found uses `role="status"`; the shared error and empty states bring their own roles.

## i18n keys

- `confirmedPairs.title`, `confirmedPairs.empty`, `confirmedPairs.loading`, `confirmedPairs.errorTitle`
- `public_registrations.confirmed_pairs.anonymous`, `publicTournaments.detail.notFound.*`, `tournaments.backToDetail`, `tournaments.backToList`

## Theming

All colors via `--zh-*` design tokens.

## Test expectations

- Loading state while requests run; both requests carry the public-request marker
- Consented names and the translated anonymised label, including an unknown label key
- Empty, not-found (with link to the list) and error with retry
