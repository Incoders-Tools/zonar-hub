# OrgSelectorComponent

## Purpose

Organization switcher dropdown that allows users to select the active organization (tenant) context. Reads and updates the current organization through `ActiveOrganizationService`.

## Inputs

None. Organization data is provided by `ActiveOrganizationService`.

## Outputs

None. Selection changes are propagated through `ActiveOrganizationService`.

## Dependencies

- `ActiveOrganizationService` (injected; provides available organizations and manages the active selection)
- Angular Material select or menu component

## States

| State | Description |
|-------|-------------|
| Single org | Selector may be hidden or displayed as read-only when only one organization is available. |
| Multiple orgs | Dropdown is active and allows switching. |
| Loading | Organizations are being fetched. |

## Accessibility

- Dropdown is keyboard-navigable (arrow keys, Enter, Escape).
- Active organization is announced to screen readers on change.
- Label is associated with the control via `aria-labelledby` or `aria-label`.

## i18n

- Dropdown label and placeholder use translation keys.
- Organization names are data-driven (not translated).

## Theming

- Uses semantic tokens for dropdown surface, border, and selected-item highlight.
- Adapts to the active theme's form-control styling.

## Reuse guidance

Place in the app shell (sidebar or top bar). The component is self-contained — it fetches and manages organization state internally via the injected service. Do not duplicate organization-switching logic elsewhere.
