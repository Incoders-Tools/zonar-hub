# FormShell

## Purpose
Wraps any form providing consistent layout: title, description, content area, and action bar.

## Inputs
| Input | Type | Default | Description |
|-------|------|---------|-------------|
| titleKey | `string` | `''` | i18n key for form title |
| descriptionKey | `string` | `''` | i18n key for description |

## Content Projection
- Default slot: form fields
- `[formActions]`: action buttons (save, cancel)

## Usage
```html
<app-form-shell titleKey="admin.tournaments">
  <!-- form fields here -->
  <div formActions>
    <app-async-button (clicked)="save()">{{ 'common.save' | t }}</app-async-button>
  </div>
</app-form-shell>
```
