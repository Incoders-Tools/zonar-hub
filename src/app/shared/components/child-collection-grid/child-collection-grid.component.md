# ChildCollectionGridComponent

## Purpose
Shared reusable component for rendering editable child collections or selectable item lists inside parent forms. Supports two modes: `edit` (FormArray-backed CRUD rows) and `select` (checkbox selection from existing items).

## Inputs

| Input | Type | Default | Description |
|---|---|---|---|
| `columns` | `ChildGridColumn[]` | *required* | Column definitions (key, labelKey, type, options, width) |
| `mode` | `'edit' \| 'select'` | `'edit'` | Operating mode |
| `formArray` | `FormArray \| null` | `null` | FormArray to bind in edit mode |
| `rowFactory` | `(() => FormGroup) \| null` | `null` | Factory function to create new rows in edit mode |
| `items` | `Record<string, unknown>[]` | `[]` | Items to display in select mode |
| `selectedIds` | `Set<string>` | `new Set()` | Pre-selected item IDs in select mode |
| `trackByKey` | `string` | `'id'` | Property used to identify items |
| `titleKey` | `string` | `''` | i18n key for section title |
| `collapsible` | `boolean` | `false` | Wrap in collapsible-section |
| `reorderable` | `boolean` | `false` | Enable drag-drop reorder (edit mode) |
| `disabled` | `boolean` | `false` | Disable all interactions |
| `loading` | `boolean` | `false` | Show loading state |
| `maxRows` | `number \| null` | `null` | Max rows allowed in edit mode |

## Outputs

| Output | Type | Description |
|---|---|---|
| `rowAdded` | `void` | Emitted when a row is added (edit mode) |
| `rowRemoved` | `number` | Emitted with index when a row is removed (edit mode) |
| `rowReordered` | `{ previousIndex, currentIndex }` | Emitted on drag-drop reorder (edit mode) |
| `selectionChanged` | `Set<string>` | Emitted with selected IDs on change (select mode) |

## Supported Column Types
- `text`: Text input
- `number`: Number input
- `date`: Date input
- `select`: Dropdown with `options`
- `checkbox`: Checkbox
- `display`: Read-only text

## Usage Examples

### Select mode (e.g., tournament courts)
```html
<app-child-collection-grid
  mode="select"
  [columns]="courtColumns"
  [items]="availableCourts()"
  [selectedIds]="selectedCourtIds()"
  [titleKey]="'courts.title'"
  [collapsible]="true"
  (selectionChanged)="onCourtsChanged($event)">
</app-child-collection-grid>
```

### Edit mode (e.g., order line items)
```html
<app-child-collection-grid
  mode="edit"
  [columns]="lineColumns"
  [formArray]="form.get('lines') as FormArray"
  [rowFactory]="createLineRow"
  [reorderable]="true"
  [titleKey]="'lines.title'"
  (rowAdded)="onLineAdded()"
  (rowRemoved)="onLineRemoved($event)">
</app-child-collection-grid>
```

## Dependencies
- `CollapsibleSectionComponent` (optional, when collapsible=true)
- `@angular/cdk/drag-drop` (when reorderable=true)
- `TranslatePipe` (all labels via i18n)

## i18n
All visible labels use translation keys. Default keys: `childGrid.addRow`, `childGrid.removeRow`, `childGrid.noItems`, `childGrid.selectAll`, `childGrid.deselectAll`.

## Theming
Uses design tokens (`--zh-*`). No hardcoded colors.

## Accessibility
- Checkboxes have native input semantics
- Drag handles use `cdkDragHandle`
- Disabled state prevents all interactions

## Reuse Guidance
Use this component instead of creating feature-specific child tables. If the interaction is header+items, parent+subtable, or FK-backed detail rows, this component handles it.
