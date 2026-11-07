# AdminTournamentsPageComponent

## Purpose
Admin CRUD screen for the active organization's tournaments: create, edit, delete (single and bulk), filters, sorting, table/card views, Instagram-style share preview, copying the public link of public tournaments and opening the tournament draw.

## Inputs
None (route-level container component).

## Outputs
None.

## Dependencies
- `TournamentsFacadeService` — component-scoped orchestration (load, filters, sorting, save, delete)
- `PublicTournamentLinkService` — share URL `{origin}/tournaments/{publicSlug}` and clipboard copy with toast feedback
- `AuthService`, `TenantContextService` (plan enforcement), `ActiveOrganizationService` (reload on organization change), `Router`
- `PermissionService` — shows the draw action only with the `draw-planner` tool
- Shared: `ZhCollectionViewComponent`, `FilterPanelComponent`, `ConfirmDialogComponent`, `AsyncButtonComponent`, `HelpButtonComponent`, `SocialSharePreviewComponent`, `TranslatePipe`
- `TournamentsFormComponent` — inline create/edit panel (see `tournaments-form/tournaments-form.component.md`)

## Row actions
- Every row: edit, share (social preview image), delete.
- Users with the `draw-planner` tool also get "Draw" (`account_tree` icon, `admin.tournaments.actions.draw`) right after edit. It opens `/admin/tournaments/:tournamentId/draw` (the admin draw page, guarded by the same tool).
- Public tournaments that already have a `publicSlug` also get "Copy public link" (`link` icon, `admin.tournaments.share.copyPublicLink`), placed before delete. It copies the share URL and shows `admin.tournaments.share.copySuccess` or `admin.tournaments.share.copyError`.
- The per-row list is provided through `rowActionsFilter`, so table and card modes stay equivalent.

## Variants and States
- Loading / empty / error — delegated to `ZhCollectionViewComponent`
- Form panel — create or edit
- Dialogs — delete, bulk delete, plan enforcement
- Share preview overlay
- Changing the active organization closes the panel and dialogs and reloads.

## Business help
The help button covers tournament management plus a "Public visibility and link" section: public tournaments appear in the ZonarHub tournaments section, saving generates a permanent link that can be copied from the form or the list, and private tournaments stay backoffice-only.

## Accessibility
Row actions expose translated labels (`title`/`aria-label` in the table, visible text in cards).

## i18n
`admin.tournaments.*` (including `admin.tournaments.share.*`, `admin.tournaments.actions.draw` and `admin.tournaments.help.public*`), `share.label`, `common.*`, `plan.enforcement.*` in es, en and pt.

## Theming
No page-specific colors; shared components carry the tokens.

## Reuse guidance
Add conditional row actions through `rowActionsFilter` on `zh-collection-view` and keep the base `rowActions` array for the common ones.
