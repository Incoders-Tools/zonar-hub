# FilterPanel

## Purpose
Shared filter panel for list/table screens. Supports text and select filter fields.

## Inputs
| Input | Type | Description |
|-------|------|-------------|
| fields | `FilterField[]` | Array of filter field definitions |

## Outputs
| Output | Type | Description |
|--------|------|-------------|
| filtersApplied | `Record<string, string>` | Emitted when user applies filters |
| filtersCleared | `void` | Emitted when user clears filters |

## FilterField Interface
```ts
interface FilterField {
  key: string;
  labelKey: string;
  type: 'text' | 'select';
  options?: { value: string; labelKey: string }[];
}
```

## Theming
Uses `--zh-surface-elevated`, `--zh-border-subtle`, `--zh-primary` tokens.

## i18n
All labels and options use translation keys.
