# CookieConsentComponent

## Purpose

Displays a cookie consent banner at the bottom of the viewport. Persists the user's acceptance decision in `localStorage` so the banner is not shown again on subsequent visits.

## Inputs

None.

## Outputs

None.

## Dependencies

- `localStorage` (browser API for persisting consent state).

## States

| State | Description |
|-------|-------------|
| Visible | Banner is displayed because no prior consent record exists in `localStorage`. |
| Hidden | Banner is hidden after the user accepts or if consent was previously recorded. |

## Accessibility

- Banner uses `role="banner"` or `role="dialog"` with `aria-label` for cookie notice.
- Accept button is keyboard-focusable.
- Banner does not trap focus but is announced to screen readers on appearance.

## i18n

- Banner text and button label use translation keys.
- No hardcoded user-facing text.

## Theming

- Banner surface, text, and button colors use semantic design tokens.
- Position and elevation follow the design-token system.

## Reuse guidance

Include once in the root app component or public layout. The component is self-contained and manages its own visibility state. Do not duplicate consent logic elsewhere.
