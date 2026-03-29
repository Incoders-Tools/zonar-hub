# Stepper

## Purpose
Multi-step progress indicator with linear gating support. Used in registration wizard and multi-step forms.

## Inputs
| Input | Type | Default | Description |
|-------|------|---------|-------------|
| steps | `StepperStep[]` | required | Array of steps with `labelKey` and optional `completed` |
| activeIndex | `number` | `0` | Currently active step index |
| linear | `boolean` | `true` | If true, steps must be completed sequentially |

## Outputs
| Output | Type | Description |
|--------|------|-------------|
| stepChanged | `number` | Emitted when user clicks a navigable step |

## Accessibility
Uses `role="tablist"` and `role="tab"` with `aria-selected`. Disabled steps have `disabled` attribute.

## Responsive
On mobile (<600px), step labels are hidden, showing only step indicators.

## Theming
Uses `--zh-primary`, `--zh-success`, `--zh-surface-muted` tokens.
