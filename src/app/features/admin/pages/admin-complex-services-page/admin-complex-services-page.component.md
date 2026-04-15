# Admin Complex Services Page

## Purpose
Manage complex services (WiFi, Parking, Showers, etc.) through a full CRUD interface. Allow administrators to create, update, delete, and organize services offered by sports complexes.

## Architecture

### Layer Separation
- **Page Component** (`admin-complex-services-page.component.ts`): UI orchestration, dialog management, table interactions
- **Facade Service** (`complex-services-facade.service.ts`): Business logic, state management, validation
- **form panel Component** (`complex-services-form-panel.component.ts`): Form UI and local form state
- **Help Dialog Component** (`complex-services-help-dialog.component.ts`): Help content display
- **Repository** (`MockComplexServiceRepository`): Data access layer (mock for now, real API later)

### Data Flow
```
Page Component
  ↓ (user clicks)
form panel
  ↓ (on save)
Facade Service
  ↓ (delegates)
Repository
  ↓ (returns)
Facade Service updates signals
  ↓ (signals emit)
Page Component detects changes
  ↓ (computed properties update)
Table re-renders
```

## Components

### AdminComplexServicesPageComponent
Main container component managing page-level state.

**Inputs**: None (facade is injected)

**Signals**:
- `showFormPanel`: Controls form panel visibility
- `showDeleteDialog`: Controls delete confirmation visibility
- `showBulkDeleteDialog`: Controls bulk delete confirmation visibility
- `showHelpDialog`: Controls help dialog visibility
- `editingService`: Current service being edited (null = create mode)
- `deletingId`: ID of service to delete
- `selectedServices`: Currently selected rows for bulk operations

**Tasks**:
- Load services on init
- Open/close dialogs
- Handle row actions (edit/delete)
- Handle selection changes
- Trigger filter/sort operations

### ComplexServicesFormPanelComponent
Reactive form for creating/editing services.

**Inputs**:
- `service`: Service to edit (null = create mode)
- `saving`: Loading state from facade

**Outputs**:
- `saved`: Emitted when form submitted successfully
- `cancelled`: Emitted when user cancels

**Validation**:
- Name: Required, letters+spaces only, unique in database
- Key: Required (disabled on edit), lowercase+underscore, unique, auto-inferred from name on create
- Icon: Optional, text field for react-icons classname
- Sort Order: Optional, non-negative integer, unique among sort orders > 0
- Status: Boolean checkbox

**Form States**:
- Create mode: Key editable, auto-computed from name
- Edit mode: Key disabled, name changes don't affect key

### ComplexServicesHelpDialogComponent
Simple modal dialog displaying help content for administrators.

**Inputs**: None

**Outputs**:
- `closed`: Emitted when dialog is closed

## Data Model

### ComplexService
```typescript
interface ComplexService {
  id: string;
  name: string;           // e.g., "WiFi", "Parking"
  key: string;            // e.g., "wifi", "parking" (auto-computed from name or manual)
  faIcon: string | null;  // e.g., "FaWifi" (react-icons classname)
  sortOrder: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

## State Management

### Facade Service Signals
- `entitiesState`: Array of all services
- `loadingState`: True during data fetch
- `savingState`: True during create/update
- `deletingState`: True during delete
- `errorState`: Error message if any operation fails
- `filtersState`: Current filter criteria
- `sortState`: Current sort option

### Computed Properties (Public)
- `filteredServices`: Computed result of applying filters and sort to entitiesState
- Plus direct access to loading, saving, deleting, error states

## Filtering

Supports:
- **Name filter** (substring, case-insensitive)
- **Status filter** (active/inactive)

## Sorting

Options:
- `sort_order_asc`: By sort order ascending
- `sort_order_desc`: By sort order descending
- `name_asc`: By name A-Z
- `name_desc`: By name Z-A

## API Methods (Facade)

### Public Methods
- `load()`: Fetch all services from repository
- `applyFilters(filters)`: Update active filters
- `clearFilters()`: Reset all filters
- `applySortOption(option)`: Change sort order
- `saveService(service)`: Create or update service
- `deleteService(id)`: Delete a service
- `bulkDelete(ids)`: Delete multiple services
- `checkKeyExists(key, currentId?)`: Validate key uniqueness
- `checkNameExists(name, currentId?)`: Validate name uniqueness
- `checkSortOrderExists(order, currentId?)`: Validate sort order uniqueness
- `getNextSortOrder()`: Get suggested sort order for new services

## Validation Rules

| Field | Rule | ErrorType |
|-------|------|-----------|
| name | Required, letters+spaces only, unique in DB | required, pattern, unique |
| key | Required (edit: optional), alphanumeric+dash, unique in DB, auto-inferred | required, pattern, unique |
| faIcon | Optional | - |
| sortOrder | Non-negative integer, unique (except 0/null) | min, unique |
| isActive | Boolean | - |

## i18n Keys

All strings must use translation keys. Core keys:
- `admin.complex-services.title`
- `admin.complex-services.subtitle`
- `admin.complex-services.form.*`
- `admin.complex-services.column.*`
- `admin.complex-services.status.*`
- `admin.complex-services.filter.*`
- `admin.complex-services.error.*`
- `admin.complex-services.confirm.*`
- `admin.complex-services.help.*`

## Testing

### Unit Tests (Facade)
- `load()` fetches and sets state
- `save()` creates or updates
- `delete()` removes from state
- Validators check uniqueness correctly
- Filters apply correctly to entities

### Integration Tests (Page + Form)
- form panel → Facade save flow
- Table row click → Edit dialog opens
- Delete confirmation → Facade delete call
- Bulk delete works correctly

## Accessibility

- All form labels associated with inputs
- Error messages clearly visible
- Help button with tooltip
- Keyboard navigation support (via Material)
- ARIA labels on interactive elements

## Performance

- Signals for reactive updates (no manual change detection)
- Computed properties avoid unnecessary recalculations
- Mock repository has 400ms delay to simulate real API
- Table pagination at 10 items per page

## Browser Support

- Chrome 120+
- Firefox 120+
- Safari 17+
- Edge 120+

## Related Components

- `DataTableComponent`: Display services list
- `FilterPanelComponent`: Advanced filtering
- `ConfirmDialogComponent`: Delete confirmations
- `AsyncButtonComponent`: Loading states
- `FormShellComponent`: Form layout wrapper
- `FormBuilder` (Angular): Form creation
