# Admin Social Networks Page

## Purpose
Manage social networks (Instagram, Facebook, Twitter, etc.) used throughout the platform. Configure URLs, icons, and visibility settings.

## Architecture
- **Page Component**: Orchestration and UI state
- **Facade Service**: Business logic, state, validation
- **Form Dialog Component**: Create/edit form with URL and description fields
- **Help Dialog Component**: User guidance
- **Mock Repository**: Data access layer

## Key Features
- **URL Validation**: Enforces http/https protocol
- **Description Support**: Optional text field for additional info
- **Icon Management**: React-icons classname support
- **Sorting**: By name or sort_order
- **Filtering**: By name or active status

## Data Model

```typescript
interface SocialNetwork {
  id: string;
  name: string;
  key: string;
  url: string | null;           // Must start with http:// or https://
  description: string | null;
  faIcon: string | null;
  sortOrder: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

## Form Validation

| Field | Rules | Validator |
|-------|-------|-----------|
| name | Required, letters+spaces, unique | required, pattern, asyncUnique |
| key | Required, lowercase_underscore, unique, auto-inferred | required, pattern, asyncUnique |
| url | Optional, must start with http:// or https:// | pattern (if present) |
| description | Optional | - |
| faIcon | Optional | - |
| sortOrder | Non-negative int, unique (except 0/null) | min, asyncUnique |
| isActive | Boolean | - |

## API Methods (Facade)
- `load()`: Fetch all networks
- `saveNetwork(network)`: Create or update
- `deleteNetwork(id)`: Delete single
- `bulkDelete(ids)`: Delete multiple
- `applyFilters(filters)`: Apply search/status filters
- `checkKeyExists(key, currentId?)`: Validate key uniqueness
- `checkNameExists(name, currentId?)`: Validate name uniqueness

## Differences from ComplexServices
- Adds `url` field with http/https validation
- Adds `description` optional text field
- No `fa_icon` is not mandatory (optional like ComplexServices)
- URL column in table
- URL validation in form

## Related Components
- FormShellComponent
- DataTableComponent
- FilterPanelComponent
- ConfirmDialogComponent
- AsyncButtonComponent
