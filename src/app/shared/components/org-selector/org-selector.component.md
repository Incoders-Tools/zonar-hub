# OrgSelectorComponent

## Purpose

Organization switcher dropdown that selects active context independently of the server-persisted primary organization. Admins with multiple assigned active organizations can confirm a primary replacement. System admins may switch to other active organizations, but cannot designate unassigned organizations as primary.

## Inputs

None. Organization data is provided by `ActiveOrganizationService`.

## Outputs

None. Selection changes are propagated through `ActiveOrganizationService`.

## Dependencies

- `ActiveOrganizationService` (injected; provides available organizations and manages the active selection)
- `AuthService`, `NotificationService` and shared `ConfirmDialogComponent`

## States

| State | Description |
|-------|-------------|
| Single org | Selector may be hidden or displayed as read-only when only one organization is available. |
| Multiple orgs | Dropdown is active and allows switching; the primary badge appears only when multiple assigned active organizations are eligible. |
| Saving | Confirmation disables repeat submission until the API responds. |
| Failure | Existing primary and active selection remain unchanged; an error notification appears. |
| Success | Primary moves to the first row, without switching active context. |

## Accessibility

- Separate native buttons provide keyboard access to switch and set-primary actions without nesting interactive elements.
- Active context is marked with `aria-current`; search and primary actions have translated accessible labels.
- The shared confirmation dialog warns before replacement.

## i18n

- Dropdown labels, confirmation warning and success/error notifications use translation keys in es/en/pt.
- Organization names are data-driven (not translated).

## Theming

- Uses semantic tokens for dropdown surface, border, and selected-item highlight.
- Adapts to the active theme's form-control styling.

## Reuse guidance

Place in the app shell (sidebar or top bar). The component is self-contained — it fetches and manages organization state internally via the injected service. Do not duplicate organization-switching logic elsewhere.
