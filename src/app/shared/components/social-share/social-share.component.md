# SocialShareComponent

## Purpose

Renders a row of social media quick-share buttons (WhatsApp, Twitter/X, Facebook, Instagram, copy-link) for sharing content across platforms.

## Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `config` | `ShareConfig` | — | Required. Contains the URL, title, and text to share. |
| `showInstagram` | `boolean` | `false` | Whether to display the Instagram share button. |

## Outputs

| Output | Type | Description |
|--------|------|-------------|
| `instagramRequested` | `void` | Emitted when the user taps the Instagram button (triggers flyer generation flow). |

## Dependencies

- Clipboard API (for copy-link)
- Platform-specific share URL schemes (WhatsApp, Twitter, Facebook)
- `NotificationService` (copy-link success feedback)

## States

| State | Description |
|-------|-------------|
| Default | All enabled share buttons are displayed. |
| Link copied | Temporary visual feedback after copying the link. |

## Accessibility

- Each button has an `aria-label` describing the share target (e.g., "Share on WhatsApp").
- Buttons are keyboard-focusable and activatable via Enter/Space.
- Icon-only buttons include screen-reader-accessible labels.

## i18n

- Button `aria-label` values and tooltip text use translation keys.
- Copy-link success notification uses a translated message.

## Theming

- Icon buttons use semantic token colors for idle, hover, and active states.
- Respects the active theme's icon color palette.

## Reuse guidance

Drop into any view that needs social sharing. Provide a `ShareConfig` with at minimum a `url`. Enable `showInstagram` only when flyer generation is supported in context.
