# ActiveToggleComponent

## Purpose

Unified, reusable component for displaying and toggling `isActive` state across all catalog and admin entities.

## Business Context

Every catalog entity in Zonar Hub has an `isActive` field. This component provides a consistent rendering pattern across tables (badge mode) and forms (toggle mode), ensuring visual uniformity.

## Inputs

| Input              | Type                   | Default           | Description                           |
|--------------------|------------------------|-------------------|---------------------------------------|
| `value`            | `boolean` (required)   | —                 | Current active state                  |
| `mode`             | `'badge' \| 'toggle'`  | `'badge'`         | Read-only badge or interactive toggle |
| `disabled`         | `boolean`              | `false`           | Disable the toggle interaction        |
| `activeLabelKey`   | `string`               | `'common.active'` | Translation key for active label      |
| `inactiveLabelKey` | `string`               | `'common.inactive'` | Translation key for inactive label  |

## Outputs

| Output    | Type      | Description                           |
|-----------|-----------|---------------------------------------|
| `toggled` | `boolean` | Emitted when the checkbox changes     |

## Dependencies

- `TranslatePipe`

## Variants and States

- **Badge (read-only):** Renders a colored pill. Green for active, muted for inactive.
- **Toggle (interactive):** Renders a checkbox alongside the badge pill. Badge updates in real-time.

## Accessibility

- Uses native `<input type="checkbox">` for toggle mode, inheriting keyboard and screen reader support.
- `disabled` attribute is forwarded.

## i18n

- All labels use translation keys. Custom label keys can be provided via inputs.

## Theming

- Uses semantic tokens (`--zh-success`, `--zh-success-soft`, `--zh-text-muted`, `--zh-surface-muted`).
- Theme-agnostic.

## Reuse Guidance

Use this component wherever an entity's active/inactive status needs to be displayed or toggled:
- Data table status columns (badge mode)
- Form dialogs with isActive checkbox (toggle mode)
- Detail panels

Do **not** create feature-specific active/inactive rendering.
