# ProgressBar

## Purpose
Determinate progress bar for long-running, multi-stage workflows. Communicates staged progress to the user with optional title, message, and stage labels.

## When to use
- Tournament draw planner generation
- Ranking recalculation
- Bulk imports/processing
- Any workflow that takes more than a few seconds and has identifiable stages

## When NOT to use
- Short operations (use `LoadingStateComponent`)
- Full-screen blocking (use `LoaderOverlayComponent`)
- Unknown-duration single operations (use spinner)

## Inputs
| Input          | Type    | Default | Description                            |
|---------------|---------|---------|----------------------------------------|
| progress      | number  | 0       | Current progress percentage (0-100)    |
| titleKey      | string  | ''      | Translation key for heading            |
| messageKey    | string  | ''      | Translation key for helper message     |
| stageLabel    | string  | ''      | Current stage description text         |
| showPercentage| boolean | true    | Whether to show percentage number      |

## Outputs
None.

## Accessibility
- `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- `aria-label` from titleKey when provided
- Clamped 0-100 value for safety

## Theming
- Track: `--zh-surface-muted`
- Fill: `--zh-primary`
- Text: `--zh-text-primary`, `--zh-text-secondary`, `--zh-text-muted`
- Container: `--zh-surface-elevated`, `--zh-border-subtle`

## i18n
- `titleKey` and `messageKey` are translation keys passed through `TranslatePipe`
- `stageLabel` is raw text (typically set by the consuming component with already-translated stage names)

## Simulated Progress Pattern
When no real backend progress exists, consuming components should simulate staged progress:
```typescript
const stages = [
  { label: 'Validating...', target: 15 },
  { label: 'Loading data...', target: 35 },
  { label: 'Analyzing...', target: 55 },
  { label: 'Generating...', target: 80 },
  { label: 'Finalizing...', target: 95 }
];
```
Move quickly at the start and slow down near 100%. Only reach 100% when the operation resolves.

## Dependencies
- `TranslatePipe`
