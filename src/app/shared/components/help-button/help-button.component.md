# HelpButton

## Purpose
Shared help button with modal dialog for displaying feature documentation. Replaces per-feature help dialog components with a single reusable component.

## Inputs
| Input | Type | Required | Description |
|-------|------|----------|-------------|
| titleKey | `string` | Yes | i18n key for the modal title |
| sections | `HelpSection[]` | Yes | Array of help sections to display |

## HelpSection Interface
```typescript
interface HelpSection {
  titleKey: string;      // i18n key for section heading
  contentKey?: string;   // i18n key for paragraph text
  items?: string[];      // i18n keys for list items
}
```

## Usage
```html
<app-help-button
  [titleKey]="'admin.roles.help.title'"
  [sections]="helpSections">
</app-help-button>
```

```typescript
readonly helpSections: HelpSection[] = [
  { titleKey: 'admin.roles.help.systemRoles', contentKey: 'admin.roles.help.systemRolesDescription' }
];
```

## Accessibility
- Button has `aria-label` for screen readers
- Modal overlay has `role="dialog"` with `aria-label`
- Close button has `aria-label`

## Theming
Uses semantic design tokens: `--zh-primary`, `--zh-surface-overlay`, `--zh-surface-elevated`, `--zh-border-subtle`, `--zh-text-primary`, `--zh-text-secondary`.
