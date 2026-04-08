# AdminPlayersPageComponent

## Purpose
Full admin CRUD management screen for circuit players. Supports create, edit, delete (single and bulk), filtering by multiple fields, sorting, pagination, and contextual help.

## Inputs
None (route-level container component).

## Outputs
None.

## Dependencies
- `PlayerFacadeService` — orchestration layer for state management and repository access
- `DataTableComponent` — shared paginated, selectable, sortable table
- `FilterPanelComponent` — shared filter panel with text and select fields
- `ConfirmDialogComponent` — shared destructive action confirmation
- `AsyncButtonComponent` — shared submit button with loading state
- `PlayerFormDialogComponent` — create/edit form dialog
- `HelpButtonComponent` — contextual help dialog trigger
- `TranslatePipe` — i18n key resolution

## Variants and States
- **Loading** — delegated to `DataTableComponent` loading state
- **Empty** — delegated to `DataTableComponent` empty state
- **Error** — delegated to `DataTableComponent` error state
- **Data** — table with players, filter panel, page header, row actions
- **Form panel** — create or edit mode (inline above filters)
- **Delete dialog** — single or bulk delete confirmation
- **Help dialog** — contextual business help

## Accessibility
- Help button has `aria-label`
- All dialogs use `role="dialog"` with `aria-label`
- Table supports keyboard navigation via shared `DataTableComponent`
- Filter fields have associated labels

## i18n
All user-facing text uses `admin.players.*` translation keys. Supported locales: es, en, pt.

## Theming
All colors use semantic design tokens (`--zh-*`). No hardcoded colors.

## Reuse Guidance
This component is specific to the Players entity. The pattern (facade + repository + form dialog + help dialog + shared table) can be replicated for other entities by following the same structure.
