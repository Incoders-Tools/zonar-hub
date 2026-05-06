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
- System-admin-only tools are disabled automatically for non-system-admin roles
- Help dialog explaining user roles and permissions
- Responsive design with Material Design 3

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
