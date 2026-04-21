# SocialSharePreviewComponent

## Purpose

Modal dialog that previews social media content (flyers) with background selection and download functionality. Used to generate and share tournament-related visual content across social platforms.

## Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `payload` | `SocialSharePayload` | — | Required. Contains the data to render the social share flyer preview (tournament info, branding, text). |

## Outputs

| Output | Type | Description |
|--------|------|-------------|
| `close` | `void` | Emitted when the user closes the preview dialog. |

## Dependencies

- Angular Material Dialog (`MatDialogRef`)
- `RegistrationFlyerComponent` (renders the flyer content)
- Background asset files from `public/uploads/`

## States

| State | Description |
|-------|-------------|
| Loading | Flyer assets and backgrounds are being loaded. |
| Ready | Preview is displayed with the selected background. |
| Downloading | Flyer image is being generated and downloaded. |

## Accessibility

- Dialog follows `role="dialog"` with `aria-modal="true"`.
- Close button is keyboard-focusable and labeled.
- Background selection options are navigable via keyboard.

## i18n

- Dialog title, button labels, and background option labels use translation keys.
- No hardcoded user-facing text.

## Theming

- Uses semantic design tokens for dialog surface, overlay, and button styles.
- Background selection thumbnails adapt to the active theme border and focus styles.

## Reuse guidance

Open via `MatDialog.open(SocialSharePreviewComponent, { data: payload })`. Suitable for any feature that needs to preview and download a shareable flyer image.
