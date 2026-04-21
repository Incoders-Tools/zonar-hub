# RegistrationFlyerComponent

## Purpose

Renders a tournament registration flyer suitable for image generation and social sharing. Displays tournament details, branding, and registration information in a visual layout optimized for export.

## Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `data` | `FlyerData` | — | Required. Contains tournament name, dates, location, categories, branding, and other flyer content. |

## Outputs

None. The component is rendered as a visual template consumed by the social-share-preview flow for screenshot/download.

## Dependencies

- `FlyerData` model interface.
- Background image assets from `public/uploads/`.

## States

| State | Description |
|-------|-------------|
| Rendering | Flyer layout is being composed with the provided data. |
| Ready | Flyer is fully rendered and available for capture/export. |

## Accessibility

- Primarily a visual export artifact; not interactive.
- Alt text is applied to images within the flyer for in-app preview contexts.

## i18n

- Labels within the flyer (e.g., "Registration open", "Dates", "Location") use translation keys.
- Tournament data values are data-driven.

## Theming

- Flyer uses its own visual styling driven by background assets and branding, independent of the app theme.
- Typographic tokens may be shared for consistency in preview mode.

## Reuse guidance

Used internally by `SocialSharePreviewComponent` to render flyer content. Can be embedded in any context that needs a visual flyer preview. Provide a complete `FlyerData` object.
