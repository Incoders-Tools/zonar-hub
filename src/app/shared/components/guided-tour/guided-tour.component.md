# GuidedTourComponent

## Purpose

Interactive guided tour that highlights UI elements step-by-step with an overlay, tooltip, and navigation controls. Used for onboarding and feature discovery.

## Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `steps` | `TourStep[]` | — | Required. Array of tour steps, each specifying a target element selector, title, and description. |
| `initialStep` | `number` | `0` | Zero-based index of the step to start on. |

## Outputs

| Output | Type | Description |
|--------|------|-------------|
| `stepChanged` | `number` | Emitted when the active step changes. Contains the new step index. |
| `completed` | `void` | Emitted when the user finishes all steps. |
| `cancelled` | `void` | Emitted when the user dismisses the tour early. |

## Dependencies

- CDK Overlay or custom overlay logic for backdrop and positioning.
- `TourStep` model interface.

## States

| State | Description |
|-------|-------------|
| Inactive | Tour is not running; no overlay is shown. |
| Active | Overlay is displayed, highlighting the current step's target element. |
| Transitioning | Animating between steps. |
| Completed | All steps finished; overlay dismissed. |
| Cancelled | User dismissed the tour before completing all steps. |

## Accessibility

- Focus is trapped within the tooltip during each step.
- Tooltip content is announced via `aria-live` region.
- Next/Previous/Close buttons are keyboard-accessible.
- Escape key cancels the tour.
- Target element remains visible and described.

## i18n

- Step titles, descriptions, and navigation button labels use translation keys.
- No hardcoded user-facing text.

## Theming

- Overlay backdrop uses a semantic scrim/overlay token.
- Tooltip surface, text, and button styles use design tokens.
- Highlight ring around the target element uses the theme's focus/accent color.

## Reuse guidance

Instantiate with a `steps` array tailored to the current screen. Each `TourStep` should reference a stable CSS selector for the target element. Can be triggered from any feature to onboard users to new functionality.
