# Admin Tournament Statuses Page

## Purpose
Manage tournament statuses (Scheduled, In Progress, Completed, Cancelled, etc.) through a full CRUD interface. Allow administrators to create, update, delete, and organize statuses for tournaments.

## Architecture

### Layer Separation
- **Page Component** (`admin-tournament-statuses-page.component.ts`): UI orchestration, dialog management, table interactions
- **Facade Service** (`tournament-statuses-facade.service.ts`): Business logic, state management, validation
- **Form Dialog Component** (`tournament-statuses-form-panel.component.ts`): Form UI and local form state
- **Help Dialog Component** (`tournament-statuses-help-dialog.component.ts`): Help content display
- **Repository** (`MockTournamentStatusRepository`): Data access layer (mock for now, real API later)

## Data Model

### TournamentStatus
```typescript
interface TournamentStatus {
  id: string;
  name: string;              // e.g., "Scheduled", "Completed"
  key: string;               // e.g., "scheduled", "completed" (unique, lowercase)
  description: string | null; // e.g., "Tournament has been scheduled"
  sortOrder: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

## Validation Rules

| Field | Rule | Error Type |
|-------|------|-----------|
| name | Required, letters+spaces only, unique in DB | required, pattern, unique |
| key | Required (edit: optional), lowercase+underscore, unique in DB | required, pattern, unique |
| description | Optional | - |
| sortOrder | Non-negative integer, unique (except 0/null) | min, unique |
| isActive | Boolean | - |

## Features

- Full CRUD operations
- Filtering by name and status
- Sorting support
- Bulk delete operations
- Form validation with uniqueness checks
- Responsive design
- i18n support for all strings
