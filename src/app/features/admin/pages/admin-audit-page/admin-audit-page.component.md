# AdminAuditPageComponent

## Overview
Read-only audit log viewer component for displaying system-wide changes and actions. Allows filtering, sorting, and deletion of old audit records.

## Features
- Display audit logs with timestamp, user, action, entity type, and entity ID
- Filter by action (CREATE, UPDATE, DELETE, EXECUTE, RESTORE)
- Filter by entity type and user ID
- Sort by any column
- Bulk delete audit records
- Help dialog with action descriptions
- Responsive design with Material Design 3

## Component Structure
- **admin-audit-page.component.ts**: Main component logic
- **admin-audit-page.component.html**: Template with data-table and filter-panel
- **admin-audit-page.component.scss**: Styling with design tokens
- **audit-facade.service.ts**: State management and API integration
- **audit-help-dialog/**: Help dialog component

## Dependencies
- `DataTableComponent`: For displaying tabular data with sorting
- `FilterPanelComponent`: For filtering audit logs
- `ConfirmDialogComponent`: For delete confirmation
- `AuditFacadeService`: For state management

## Models Used
- `AuditLog`: Represents a single audit log entry
- `AuditFilters`: Filter interface for query parameters

## i18n Keys
- admin.audit.title
- admin.audit.subtitle
- admin.audit.column.timestamp
- admin.audit.column.user
- admin.audit.column.action
- admin.audit.column.entity
- admin.audit.column.entityId
- admin.audit.column.changes
- admin.audit.filter.action
- admin.audit.filter.entityType
- admin.audit.filter.user
- admin.audit.action.create
- admin.audit.action.update
- admin.audit.action.delete
- admin.audit.action.execute
- admin.audit.action.restore
- admin.audit.action.bulkDelete
- admin.audit.confirm.deleteTitle
- admin.audit.confirm.deleteMessage
- admin.audit.confirm.bulkDeleteTitle
- admin.audit.confirm.bulkDeleteMessage
- admin.audit.help.title
- admin.audit.help.description
- admin.audit.help.actions
- admin.audit.help.actionCreate
- admin.audit.help.actionUpdate
- admin.audit.help.actionDelete
- admin.audit.help.actionExecute
- admin.audit.help.actionRestore

## Usage
```typescript
// Route configuration
{
  path: 'system/audit',
  loadComponent: () => import('./admin-audit-page/admin-audit-page.component')
    .then(m => m.AdminAuditPageComponent)
}
```

## Testing
Unit tests cover:
- Component creation
- Filter application and clearing
- Row selection
- Help dialog interactions
- Delete operations
