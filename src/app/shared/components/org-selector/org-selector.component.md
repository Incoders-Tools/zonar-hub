# OrgSelectorComponent

## Purpose

Organization switcher dropdown that selects the active context. It is read-only with respect to the server-persisted primary organization: the primary is listed first and marked with a badge, but it cannot be changed here. Admins change the primary from the organizations admin page (`AdminOrganizationsPageComponent`), which owns the confirmation and save flow. System admins may switch to other active organizations.

## Inputs

None. Organization data is provided by `ActiveOrganizationService`.

## Outputs

None. Selection changes are propagated through `ActiveOrganizationService`.

## Dependencies

- `ActiveOrganizationService` (injected; provides available organizations, the primary organization and the eligible set, and manages the active selection)
- `TranslatePipe` and `FormsModule` (search input)

## States

| State | Description |
|-------|-------------|
| Single org | Trigger is read-only, without chevron; the dropdown does not open. |
| Multiple orgs | Dropdown opens and allows switching; the primary organization is listed first. |
| Primary badge | Shown on the primary row only when more than one assigned active organization is primary-eligible. |
| Search | Search input appears when more than five organizations are available; filters by name. |
| Empty search | A translated no-results message is shown when no organization matches. |

## Accessibility

- Each organization is a single native `type="button"` element, so switching is keyboard accessible without nested interactive elements.
- The trigger exposes `aria-expanded`; the active organization is marked with `aria-current`.
- The search input has a translated accessible label.

## i18n

- Dropdown labels, search placeholder, empty state and primary badge use translation keys in es/en/pt.
- The shared `org.selector.*` primary-change keys (confirmation, success, error) are still used by the organizations admin page; do not remove them.
- Organization names are data-driven (not translated).

## Theming

- Uses semantic tokens for dropdown surface, border, and selected-item highlight.
- Adapts to the active theme's form-control styling.

## Reuse guidance

Place in the app shell (sidebar or top bar). The component is self-contained — it reads and switches organization state via the injected service. Do not duplicate organization-switching logic elsewhere, and do not reintroduce primary-change actions here; use the organizations admin page.
