# PublicDrawPanelComponent

## Purpose

Draw area of the public pages (D10, S1, S5): renders the live published draw of a tournament with the shared bracket view, the "updated at" time and a discreet refresh-error note.

## Feature context and business intent

Visitors follow a tournament's draw and results while it is played. The panel shows what the API last returned and never blanks it during the periodic refresh, so a slow or failed refresh does not hide the draw.

## Inputs

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `mode` | `'bracket' \| 'list'` | `'bracket'` | View applied to `app-tournament-bracket` whenever it changes (the visitor can still toggle inside the view) |

Content projection: the host's empty state, shown when the tournament has no published draw.

## Outputs

None. Retry calls `PublicDrawLiveService.retry()`.

## Dependencies

- `PublicDrawLiveService` (`core/services/public-draw-live.service.ts`), which the host page must provide (`providers: [PublicDrawLiveService]`) so polling stops with the page. It reads the draw through `PublicTournamentService.getDraw` → `ApiPublicTournamentRepository.getDraw` (`GET /api/public/tournaments/{slug}/draw`, public request, 404 → `null`).
- Shared `app-tournament-bracket` (non-interactive), `app-loading-state`, `app-error-state`.

## States

| Live state | Rendering |
| --- | --- |
| `idle` / `loading` | `app-loading-state` (first request only) |
| `error` | `app-error-state` (`publicTournaments.draw.errorTitle`, the error key) with Retry |
| `loaded`, no draw | Projected host content |
| `loaded`, draw | Status row ("updated at HH:mm") and the bracket |
| `loaded`, refresh failed | Same, plus the note `publicTournaments.draw.refreshError` with Retry (disabled while a request runs) |

## Live behaviour (`PublicDrawLiveService`)

- `start(slug)`: first request (`loading`), then one request 30 s after each answer while `document.visibilityState` is not `hidden`.
- Hidden page: the pending timer is cleared. Visible again: request at once if the last request is 30 s old or more, otherwise wait for the rest of the interval.
- `stop()`, destroy or a new `start`: timers and the visibility listener are removed; answers still in flight are ignored.
- A failed refresh keeps the last draw; the next success clears the note.
- A failed first load keeps polling, so the panel recovers on its own when the API is back.

## Validation rules

None (read-only).

## Accessibility

- The refresh note has `role="status"`, so screen readers announce it once. The "updated at" label is not a live region, to avoid an announcement every 30 s.
- Retry is a real `button` with a visible focus ring.
- Icons are `aria-hidden`.

## i18n

`publicTournaments.draw.loading`, `.errorTitle`, `.updatedAt` (`{time}` = `HH:mm`, local time), `.refreshError`, and `common.retry`, in es/en/pt. The label follows locale changes.

## Theming

Only `--zh-*` tokens (muted text, warning icon, link color).

## Reuse guidance

Use it for any public surface that shows a tournament's draw: provide `PublicDrawLiveService` in the page, call `start(slug)`, and project the page's own empty state. Do not add a second polling loop.
