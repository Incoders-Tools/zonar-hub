# DataTable

## Purpose
Shared data table for admin list screens. Renders columns and rows from typed data.

## Inputs
| Input | Type | Default | Description |
|-------|------|---------|-------------|
| columns | `DataTableColumn[]` | required | Column definitions |
| data | `T[]` | required | Row data array |
| loading | `boolean` | `false` | Loading state |
| emptyMessageKey | `string` | `'table.noData'` | i18n key for empty state |

## Theming
Uses `--zh-surface-elevated`, `--zh-surface-muted`, `--zh-border-subtle` tokens.

## i18n
Column headers and empty message use translation keys.
