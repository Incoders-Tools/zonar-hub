# ToastContainerComponent

## Purpose

Global notification container that renders toast messages in the bottom-right corner of the viewport. Subscribes to `NotificationService` and displays success, error, warning, and info toasts.

## Inputs

None. Toasts are driven by `NotificationService`.

## Outputs

None.

## Dependencies

- `NotificationService` (injected; provides the toast stream).
- Angular animations for enter/exit transitions.

## States

| State | Description |
|-------|-------------|
| Empty | No active toasts; container is invisible. |
| Active | One or more toasts are visible, stacked vertically. |
| Dismissing | A toast is animating out after timeout or manual dismiss. |

## Accessibility

- Each toast uses `role="status"` and `aria-live="polite"` (or `aria-live="assertive"` for errors).
- Dismiss button (if present) is keyboard-focusable.
- Toasts auto-dismiss after a configurable timeout.

## i18n

- Toast messages are provided by the calling service and should already use translated strings.
- No hardcoded user-facing text in the container.

## Theming

- Toast background, text, and icon colors vary by severity and use semantic tokens (success, error, warning, info).
- Elevation and border-radius follow the design-token scale.

## Reuse guidance

Include once in the root app component. All toast display is handled centrally through `NotificationService`. Do not create ad-hoc toast or snackbar components per feature.
