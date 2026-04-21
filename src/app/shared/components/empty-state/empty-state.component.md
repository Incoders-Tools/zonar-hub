# EmptyStateComponent

## Purpose

Displays an empty state with an icon and a message when no data is available. Supports content projection for custom actions (e.g., a "Create" button).

## Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `message` | `string` | `undefined` | Translation key or text for the empty state message. |

## Outputs

None.

## Dependencies

None (standalone component).

## States

| State | Description |
|-------|-------------|
| Default | Icon and message are displayed. Projected content (if any) appears below the message. |

## Accessibility

- Message is rendered as a paragraph or heading with sufficient contrast.
- Projected action buttons remain keyboard-accessible.

## i18n

- `message` should be a translation key resolved by the consumer or an i18n pipe.
- No hardcoded user-facing text.

## Theming

- Icon and text colors use semantic muted/secondary tokens.
- Spacing uses the design-token scale.

## Reuse guidance

Use as the standard empty state in lists, tables, and data views. Project additional content (buttons, links) into the default `<ng-content>` slot for contextual actions like "Add first item".
