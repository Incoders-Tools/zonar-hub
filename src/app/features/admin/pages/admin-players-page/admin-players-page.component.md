# AdminPlayersPageComponent

## Purpose
Admin management screen for the players of the active organization (S3), backed by
`/api/admin/organizations/{organizationId}/players`. Supports server-paged search, create, edit, deactivate and
reactivate (single and bulk deactivate), plus the importer and AI agent tabs.

Players are never deleted: their registrations keep referencing them. Retiring a player sets `isActive: false`;
new registrations then refuse it, and it can be reactivated at any time.

## Inputs
None (route-level container component).

## Outputs
None.

## Dependencies
- `PlayerFacadeService` — server-paged state, catalogs (genders, categories) and translated feedback
- `ZhCollectionViewComponent` — shared list in server-side mode (`serverSide`, `page`, `pageSize`, `totalCount`)
- `FilterPanelComponent` — search (name, email or document) and status, the only filters the API supports
- `ConfirmDialogComponent` — confirmation before deactivating one or several players
- `AsyncButtonComponent`, `PlayerFormPanelComponent`, `HelpButtonComponent`, `TranslatePipe`

## Variants and States
- **Loading** — `zh-collection-view` loading state while a page is requested
- **Empty** — `admin.players.emptyState`
- **Error** — `zh-collection-view` error state with retry, plus the translated reason (`facade.error()` key, for
  example `common.forbidden`) above the list
- **Success** — translated toasts for save, deactivate and reactivate; API error codes become `players.errors.*`
- **Row actions** — edit, plus deactivate (active rows) or reactivate (inactive rows) through `rowActionsFilter`
- **Bulk** — "Deactivate selected" appears only when the selection contains an active player

## Behaviour notes
- The page owns list loads: one on init and one per active organization change (`goToPage(1)`).
- Filters and page changes clear the selection; the API order (last name, first name) is kept, so columns are not
  sortable client-side.
- Reactivation runs without confirmation; deactivation always asks first.

## Accessibility
- Load error rendered with `role="alert"`
- Dialogs and table keyboard support come from the shared components

## i18n
`admin.players.*`, `players.errors.*` (every player error code of `docs/api/admin-registrations.md`). Locales: es, en, pt.

## Theming
Semantic tokens only (`--zh-*`).

## Reuse Guidance
Same server-paged pattern as the users page (`UsersFacadeService`): facade owns paging and filters, the page renders the
returned page as-is.
