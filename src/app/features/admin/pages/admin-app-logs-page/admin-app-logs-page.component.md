# AdminAppLogsPageComponent

## Overview
Application logs viewer component for displaying system-wide logs from frontend, backend, edge and system sources. Allows filtering, sorting, marking as resolved, and cleanup of old logs.

## Features
- Display application logs with timestamps, levels, origins, categories, and messages
- Filter by log level (DEBUG, INFO, WARN, ERROR, FATAL)
- Filter by origin (FRONTEND, BACKEND, EDGE, SYSTEM)
- Filter by resolved status
- Full-text search across message, route, component, and category
- Sort by any column
- Mark logs as resolved/pending
- Cleanup old logs based on retention days
- Bulk delete log records
- Help dialog with level and origin descriptions
- Responsive design with Material Design 3

## Component Structure
- **admin-app-logs-page.component.ts**: Main component logic
- **admin-app-logs-page.component.html**: Template with data-table and filter-panel
- **admin-app-logs-page.component.scss**: Styling with design tokens
- **app-logs-facade.service.ts**: State management and API integration
- **app-logs-help-dialog/**: Help dialog component

## Dependencies
- `DataTableComponent`: For displaying tabular data with sorting
- `FilterPanelComponent`: For filtering application logs
- `ConfirmDialogComponent`: For delete confirmation
- `AppLogsFacadeService`: For state management

## Models Used
- `AppLog`: Represents a single application log entry
- `AppLogFilters`: Filter interface for query parameters
- `LogLevel`: Type for log severity levels
- `LogOrigin`: Type for log source origins

## i18n Keys
- admin.appLogs.title
- admin.appLogs.subtitle
- admin.appLogs.column.timestamp
- admin.appLogs.column.level
- admin.appLogs.column.origin
- admin.appLogs.column.category
- admin.appLogs.column.message
- admin.appLogs.column.route
- admin.appLogs.column.resolved
- admin.appLogs.filter.level
- admin.appLogs.filter.origin
- admin.appLogs.filter.resolved
- admin.appLogs.filter.search
- admin.appLogs.level.debug
- admin.appLogs.level.info
- admin.appLogs.level.warn
- admin.appLogs.level.error
- admin.appLogs.level.fatal
- admin.appLogs.origin.frontend
- admin.appLogs.origin.backend
- admin.appLogs.origin.edge
- admin.appLogs.origin.system
- admin.appLogs.resolved.resolved
- admin.appLogs.resolved.pending
- admin.appLogs.action.bulkDelete
- admin.appLogs.cleanup.label
- admin.appLogs.cleanup.action
- admin.appLogs.confirm.deleteTitle
- admin.appLogs.confirm.deleteMessage
- admin.appLogs.confirm.bulkDeleteTitle
- admin.appLogs.confirm.bulkDeleteMessage
- admin.appLogs.help.title
- admin.appLogs.help.description
- admin.appLogs.help.levels
- admin.appLogs.help.levelDebug
- admin.appLogs.help.levelInfo
- admin.appLogs.help.levelWarn
- admin.appLogs.help.levelError
- admin.appLogs.help.levelFatal
- admin.appLogs.help.origins
- admin.appLogs.help.originFrontend
- admin.appLogs.help.originBackend
- admin.appLogs.help.originEdge
- admin.appLogs.help.originSystem

## Usage
```typescript
// Route configuration
{
  path: 'system/logs',
  loadComponent: () => import('./admin-app-logs-page/admin-app-logs-page.component')
    .then(m => m.AdminAppLogsPageComponent)
}
```

## Testing
Unit tests cover:
- Component creation
- Log loading on init
- Filter application and clearing
- Cleanup operations
- Row selection
- Help dialog interactions
- Delete operations
