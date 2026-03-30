# Admin Tournament Types Page

## Purpose
Manage tournament types (Singles, Doubles, Mixed, etc.) through a full CRUD interface with support for boolean configuration fields (scoresPoints, appliesToGender).

## Architecture

### Layer Separation
- **Page Component** (`admin-tournament-types-page.component.ts`): UI orchestration, dialog management, table interactions
- **Facade Service** (`tournament-types-facade.service.ts`): Business logic, state management, validation
- **Form Dialog Component** (`tournament-types-form-dialog.component.ts`): Form UI with checkbox support
- **Help Dialog Component** (`tournament-types-help-dialog.component.ts`): Help content display
- **Repository** (`MockTournamentTypeRepository`): Data access layer

## Data Model

### TournamentType
```typescript
interface TournamentType {
  id: string;
  name: string;              // e.g., "Singles", "Doubles"
  key: string;               // e.g., "singles", "doubles" (unique, alphanumeric)
  sortOrder: number | null;
  scoresPoints: boolean;     // Whether tournament scores count towards rankings
  appliesToGender: boolean;  // Whether gender restrictions apply
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

## Features

- Full CRUD operations with boolean checkbox fields
- Yes/No badges in table for boolean fields
- Filtering by name and status
- Sorting support
- Bulk delete operations
- Form validation with uniqueness checks
- Checkbox fields with visual status indicators
- i18n support for all strings

## Table Columns

- Name (sortable)
- Key (sortable)
- Sort Order (sortable)
- Scores Points (Yes/No badge)
- Applies to Gender (Yes/No badge)
- Status (Active/Inactive badge, sortable)
