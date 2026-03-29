# AsyncButton

## Purpose
Reusable button with loading state that prevents duplicate submissions.

## Inputs
| Input | Type | Default | Description |
|-------|------|---------|-------------|
| type | `'button' \| 'submit'` | `'button'` | HTML button type |
| variant | `'primary' \| 'secondary' \| 'danger'` | `'primary'` | Visual variant |
| disabled | `boolean` | `false` | Disabled state |
| loading | `boolean` | `false` | Loading spinner state |

## Outputs
| Output | Type | Description |
|--------|------|-------------|
| clicked | `void` | Emitted on click when not disabled/loading |

## Usage
```html
<app-async-button
  variant="primary"
  [loading]="isSaving()"
  [disabled]="!form.valid"
  (clicked)="onSave()">
  {{ 'common.save' | t }}
</app-async-button>
```

## Accessibility
- Uses native `<button>` element
- Spinner has `role="status"` and `aria-label`
- Disabled state prevents interaction

## Theming
Uses semantic tokens: `--zh-primary`, `--zh-danger`, `--zh-secondary-soft`.

## i18n
Content projected, so parent controls translation.
