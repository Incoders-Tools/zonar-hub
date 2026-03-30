# Admin Tournament Eligibility Profiles Page

## Purpose
Manage tournament eligibility profiles with complex slot-based configuration. Allow administrators to define eligibility criteria with support for multiple slots per profile, each specifying gender, category, and age constraints.

## Architecture

### Layer Separation
- **Page Component** (`admin-tournament-eligibility-profiles-page.component.ts`): UI orchestration, dialog management, table interactions
- **Facade Service** (`tournament-eligibility-profiles-facade.service.ts`): Business logic, state management, data fetching (including genders/categories)
- **Form Dialog Component** (`tournament-eligibility-profiles-form-dialog.component.ts`): Main form with slot management (collapsible section)
- **Slot Editor Component** (`slot-editor/slot-editor.component.ts`): Dedicated component for rendering slot table with add/remove buttons
- **Help Dialog Component** (`tournament-eligibility-profiles-help-dialog.component.ts`): Help content display
- **Repository** (`MockTournamentEligibilityProfileRepository`): Data access layer

### Complex Features
- **1:Many Relationship**: Main profile has multiple slots
- **Collapsible Slots Section**: Slots are managed in a collapsible UI section
- **Slot Management**: Add/remove slots dynamically with form array
- **Supporting Data**: Facade loads genders and categories for slot configuration

## Data Model

### TournamentEligibilityProfile
```typescript
interface TournamentEligibilityProfile {
  id: string;
  name: string;              // e.g., "U18 Standard Profile"
  key: string;               // e.g., "u18_standard" (unique, lowercase)
  description: string | null; // e.g., "Profile for U18 tournaments"
  sortOrder: number | null;
  slots: EligibilitySlot[];   // 1:many relationship
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EligibilitySlot {
  slotNumber: number;        // Display order
  genderId: string;          // M, F, Mixed
  categoryId: string;        // e.g., U18, U21, Open
  minAge: number | null;
  maxAge: number | null;
  label: string | null;      // e.g., "Slot A"
}
```

## Features

- Full CRUD operations with nested slot management
- Collapsible slots section in form dialog
- Dynamic slot add/remove with table editor
- Support for gender, category, and age constraints per slot
- Filtering by name and status
- Sorting support
- Bulk delete operations
- Form validation with uniqueness checks
- Responsive design
- i18n support for all strings

## Complex Form Structure

1. **Main Fields** (standard grid):
   - name, key, description, sortOrder, isActive

2. **Slots Section** (collapsible):
   - Table with columns: slotNumber, genderId, categoryId, minAge, maxAge, label
   - Add Slot button to append new rows
   - Remove button per slot (inline)
   - Empty state message when no slots

## Table Columns

- Name (sortable)
- Key (sortable)
- Description
- Slots Count (displays count of slots)
- Sort Order (sortable)
- Status (Active/Inactive badge, sortable)

## Facade Load Method

The `load()` method fetches:
- All tournament eligibility profiles
- Supporting data: Genders, Categories (for form dropdowns - TODO)
