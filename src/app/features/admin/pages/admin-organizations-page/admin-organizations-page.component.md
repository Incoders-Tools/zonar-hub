# AdminOrganizationsPageComponent

## Purpose
Admin CRUD screen for organizations. Supports create, edit, delete (single and bulk), filtering, sorting, table/card views, and choosing the admin's primary organization from each eligible row or card.

## Inputs
None (route-level container component).

## Outputs
None.

## Dependencies
- `OrganizationFacadeService` — component-scoped orchestration for loading, CRUD, filters, sorting, and `setPrimary` (exposes `savingPrimary`)
- `ActiveOrganizationService` — source of `primaryOrganizationId`, `primaryEligibleOrganizations`, and `organizationChanged`
- `AuthService` — `isAdmin` gate for the primary action
- `ZhCollectionViewComponent` — shared table/card renderer; `rowActionsFilter` drives per-row actions in both modes
- `FilterPanelComponent` — shared filter panel
- `ConfirmDialogComponent` — shared confirmation for delete, bulk delete, and primary replacement
- `AsyncButtonComponent` — header actions
- `OrganizationFormPanelComponent` — create/edit form panel
- `TranslatePipe` — i18n key resolution

## Primary organization action
- Row action `setPrimary` (`star` icon, label `org.selector.setPrimary`) is added before edit/delete only when:
  - the current user is an admin (`admin` or `system_admin`),
  - the user has more than one active assigned organization (`primaryEligibleOrganizations`),
  - the row is one of those eligible organizations, and
  - the row is not already the primary organization.
- Every other row keeps exactly edit and delete. The same filter applies to table and card modes.
- If a primary already exists, the action opens the shared confirm dialog with `org.selector.confirmTitle`, `org.selector.confirmMessage`, and `org.selector.confirmWarning`. If no primary exists, the facade is called directly.
- Duplicate submissions are blocked by `facade.savingPrimary()`: requests and confirmations are ignored while a change is pending, and the dialog shows its loading state.
- On success the dialog closes and the primary pill moves reactively. On cancel nothing changes. On failure the facade shows `org.selector.primaryError`, the previous primary keeps its pill, and the dialog stays open so the admin can retry or cancel.
- The active organization never changes as part of this flow.
- The global organization selector keeps its own primary action until it is removed in a later work unit.

## Variants and States
- **Loading / Empty / Error** — delegated to `ZhCollectionViewComponent` (retry reloads through the facade)
- **Data** — table or cards with filters, header actions, and row actions
- **Primary marker** — table column `org.selector.primary` renders an `info` pill only on the primary row (blank labels render no pill); cards show a `zh-list-card__status--info` pill next to the status pill
- **Form panel** — create or edit mode
- **Dialogs** — delete, bulk delete, and primary replacement confirmation
- Changing the active organization resets form, dialogs, selection, and any pending primary confirmation, then reloads.

## Accessibility
- Table action buttons expose the translated label as `title` and `aria-label`; card action buttons expose it as `aria-label` and visible text
- The confirm dialog uses `role="dialog"` with a translated `aria-label`
- The primary marker is text, not color-only

## i18n
Uses `admin.organizations.*`, `organization.type.*`, `common.*`, and the existing `org.selector.primary`, `org.selector.setPrimary`, and `org.selector.confirm*` keys. No new keys. Locales: es, en, pt.

## Theming
Pills reuse shared variants: table `data-variant="info"` and card `zh-list-card__status--info`. Card badge spacing uses `--zh-space-xs`. No hardcoded colors.

## Reuse Guidance
Page-specific container. To add a conditional row action elsewhere, keep the base `rowActions` array and pass a `rowActionsFilter` to `zh-collection-view` so table and cards stay equivalent.
