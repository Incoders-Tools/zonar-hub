# AdminUsersPageComponent

## Overview
User management component for system administrators. Provides complete CRUD operations for user accounts including role assignment, complex assignment, profile management, and bulk operations.

## Features
- Display all users with email, name, role, complex assignment, and status
- Create new users with email invite or direct password
- Edit existing users (full name, phone, role, complex, status)
- Delete individual or bulk users with confirmation
- Filter users by search, role, and active status
- Sort by any column
- Role-based access control
- Organization assignment list uses tenant scope for non-sysadmin users (all active tenant organizations)
- Permissions are configured per assigned organization using a dynamic API catalog
- Permission matrix supports selecting an organization target and copying permissions from another assigned organization
- Permissions can be replicated from another user found through the dedicated permission-source search (see below)
- System-admin-only tools are disabled automatically for non-system-admin roles
- Help dialog explaining user roles and permissions
- Responsive design with Material Design 3

## Permission source search
The "replicate permissions from user" source is **not** derived from the Users table. It uses
`ApiAdminUserRepository.searchPermissionSources` (`/api/admin/users/permission-sources`), never the
Users list or its `scope=all`. The API decides which users the caller may copy from (tenant/global
enforcement), so cross-organization copying works without loading every user.

- **Controls**: a native labelled `input type="search"` (name or email) and a labelled native `select`.
  No custom combobox. The input describes the minimum length via `aria-describedby`; the select is
  described by the live status and the copy hint.
- **Request rules**: debounced 300ms; requires at least 2 meaningful characters (same normalization as
  the repository: wildcard/delimiter characters removed, `_` and whitespace not counted). Shorter terms
  send no request. Enter searches immediately and never submits the form.
- **Stale results**: every query change, form close, active-organization change and edited-user change
  cancels the pending debounce and invalidates any in-flight response (monotonic request id).
- **States** (single polite live region, `role="status"`): idle (empty), loading, results count, empty,
  error with a native Retry button that repeats the current search.
- **Bounded results**: the API returns at most 20 items. When `totalCount` exceeds the items shown, the
  status says "showing N of M" and asks to refine the search; results are never presented as exhaustive.
- **Selection**: the selected source stays in the options while results refresh, so the copy action keeps
  working. Only offered ids are accepted. The user being edited is excluded. Search term, results and
  selection reset when the form opens (create/edit/duplicate), closes or the organization changes.
- **Copy semantics** are unchanged: the Replicate button needs a source and a target organization and
  loads the source permissions through `ApiPermissionRepository.getUserPermissions`.

## Component Structure
- **admin-users-page.component.ts**: Main component logic
- **admin-users-page.component.html**: Template with data-table and filter-panel
- **admin-users-page.component.scss**: Styling with design tokens
- **users-facade.service.ts**: State management and API integration
- **users-form-panel/**: form panel for create/edit operations
- **users-help-dialog/**: Help dialog component

## Dependencies
- `DataTableComponent`: For displaying tabular data with sorting
- `FilterPanelComponent`: For filtering users
- `ConfirmDialogComponent`: For delete confirmation
- `UsersFormPanelComponent`: For user form operations
- `UsersFacadeService`: For state management

## Models Used
- `AdminUser`: Represents a user account
- `AdminUserCreatePayload`: Payload for creating users
- `AdminUserUpdatePayload`: Payload for updating users
- `UsersFilters`: Filter interface for query parameters

## i18n Keys (Sample)
- admin.users.title
- admin.users.subtitle
- admin.users.column.email
- admin.users.column.name
- admin.users.column.role
- admin.users.column.complex
- admin.users.column.status
- admin.users.filter.search
- admin.users.filter.role
- admin.users.filter.status
- admin.users.status.active
- admin.users.status.inactive
- admin.users.role.systemAdmin
- admin.users.role.admin
- admin.users.role.viewer
- admin.users.role.editor
- admin.users.action.create
- admin.users.action.bulkDelete
- admin.users.form.create
- admin.users.form.edit
- admin.users.form.email
- admin.users.form.fullName
- admin.users.form.phone
- admin.users.form.role
- admin.users.form.isActive
- admin.users.permissions.organizationSelector
- admin.users.permissions.selectOrganization
- admin.users.permissions.copyFrom
- admin.users.permissions.selectSourceOrganization
- admin.users.permissions.copyAction
- admin.users.permissions.replicateFromUser
- admin.users.permissions.selectSourceUser
- admin.users.permissions.replicateHint
- admin.users.permissions.sourceSearch.label
- admin.users.permissions.sourceSearch.placeholder
- admin.users.permissions.sourceSearch.minChars
- admin.users.permissions.sourceSearch.loading
- admin.users.permissions.sourceSearch.empty
- admin.users.permissions.sourceSearch.results (`{count}`)
- admin.users.permissions.sourceSearch.moreResults (`{shown}`, `{total}`)
- admin.users.permissions.sourceSearch.error
- common.retry
- admin.users.permissions.emptyOrgSelection
- admin.users.permissions.invalidSelection
- admin.users.confirm.deleteTitle
- admin.users.confirm.deleteMessage
- admin.users.confirm.bulkDeleteTitle
- admin.users.confirm.bulkDeleteMessage
- admin.users.help.title
- admin.users.help.description
- admin.users.help.roles
- admin.users.help.roleSystemAdmin
- admin.users.help.roleAdmin
- admin.users.help.roleEditor
- admin.users.help.roleViewer

## Usage
```typescript
// Route configuration
{
  path: 'system/users',
  loadComponent: () => import('./admin-users-page/admin-users-page.component')
    .then(m => m.AdminUsersPageComponent)
}
```

## Testing
Unit tests cover:
- Component creation
- User loading on init
- Filter application and clearing
- Create form opening
- Help dialog interactions
- Permission source search: DOM labels and live region, independence from the Users list, 300ms debounce,
  minimum length, Enter, stale responses (query/form close/organization/edited user), edited-user
  exclusion, selection retention and reset, loading/empty/error/retry, refine hint, copy action
