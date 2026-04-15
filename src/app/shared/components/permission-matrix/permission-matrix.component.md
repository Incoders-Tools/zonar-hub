# PermissionMatrixComponent

## Purpose

Shared component for managing tool-level permissions per user or role. Displays platform tools organized by module with bulk select/deselect and module-level toggling.

## Business context

Administrators use this matrix to assign or revoke access to specific tools within the platform. Each tool corresponds to a feature route or capability (e.g., tournaments, players, billing).

## Inputs

| Input            | Type             | Default | Description                                        |
|------------------|------------------|---------|----------------------------------------------------|
| `value`          | `string[]`       | `[]`    | Currently selected tool keys                       |
| `disabled`       | `boolean`        | `false` | Disables all interactions                          |
| `restrictToTools`| `string[] \| null` | `null` | When set, only shows the specified tool keys       |

## Outputs

| Output    | Type       | Description                                     |
|-----------|------------|-------------------------------------------------|
| `changed` | `string[]` | Emitted when the selection changes              |

## Dependencies

- `TranslatePipe` — for i18n labels
- `MatIcon` — for expand/collapse chevron
- `PLATFORM_TOOLS` and `getToolsByModule()` from `permissions.model.ts`

## Variants and states

- **Default**: All modules expanded, no selection
- **With value**: Pre-selected tools highlighted
- **Disabled**: All checkboxes and buttons disabled, reduced opacity
- **Restricted**: Only specified tools are visible

## Accessibility notes

- Module headers use `aria-expanded` to indicate open/close state
- Checkboxes are native `<input type="checkbox">` for screen reader compatibility
- Module-level indeterminate state is handled via the `indeterminate` property

## Translation notes

Uses keys from `admin.permissions.*`:
- `admin.permissions.toolsSelected`
- `admin.permissions.selectAll`
- `admin.permissions.deselectAll`
- Module labels: `admin.permissions.module.dashboard`, `.circuit`, `.catalog`, `.system`
- Tool labels: from `PLATFORM_TOOLS[].labelKey`

## Theming notes

Uses design tokens exclusively:
- `--zh-border-subtle`, `--zh-surface-muted`, `--zh-surface-card`, `--zh-surface-bg`
- `--zh-primary`, `--zh-primary-hover`
- `--zh-text-primary`, `--zh-text-secondary`, `--zh-text-muted`
- `--zh-radius-md`, `--zh-radius-sm`
- `--zh-space-*`, `--zh-font-size-*`

## Test expectations

- Renders module groups
- Toggles individual tools on/off
- Select all / deselect all
- Module-level toggle (on/off)
- Module expansion toggle
- Detects fully and partially selected modules
- Respects `disabled` input
- Respects `restrictToTools` input
- Emits `changed` on every selection change

## Reuse guidance

Use this component in any admin screen that requires tool-level permission assignment:
- User edit forms
- Role configuration forms
- Organization-level access control
