# ImageUploadComponent

## Purpose

Drag-and-drop image uploader with preview, file validation, optional client-side optimization, and remove functionality. Used wherever the application requires image input from the user.

## Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `currentImageUrl` | `string` | `undefined` | URL of the currently set image, displayed as preview. |
| `accept` | `string` | `'image/*'` | Accepted MIME types for the file input. |
| `maxSizeMb` | `number` | `undefined` | Maximum file size in megabytes. Files exceeding this limit are rejected with a validation message. |
| `enableOptimization` | `boolean` | `false` | Whether to apply client-side image optimization (resize/compress) before emitting. |
| `disabled` | `boolean` | `false` | Disables the upload area and remove action. |

## Outputs

| Output | Type | Description |
|--------|------|-------------|
| `imageChanged` | `File` | Emitted when a new image is selected or dropped. Contains the (optionally optimized) file. |
| `imageRemoved` | `void` | Emitted when the user removes the current image. |

## Dependencies

- Browser File/Drag-and-Drop APIs.
- Optional: Canvas API for client-side image optimization.

## States

| State | Description |
|-------|-------------|
| Empty | No image set; drop zone with upload prompt is shown. |
| Preview | An image is set (from `currentImageUrl` or a newly selected file); preview thumbnail is displayed. |
| Dragging | A file is being dragged over the drop zone; visual feedback is applied. |
| Error | File validation failed (wrong type or exceeds `maxSizeMb`); error message is shown. |
| Disabled | Drop zone and actions are non-interactive. |

## Accessibility

- Drop zone is keyboard-focusable and activatable via Enter/Space to open the file picker.
- `aria-label` describes the upload action.
- Error messages are announced via `aria-live`.
- Remove button is labeled for screen readers.

## i18n

- Upload prompt, error messages, and button labels use translation keys.
- File size limit message includes the configured `maxSizeMb` value.

## Theming

- Drop zone border, background, and drag-over highlight use semantic design tokens.
- Error state styling uses the semantic error color token.

## Reuse guidance

Use in any form or settings screen that requires image input. Configure `accept` and `maxSizeMb` per use case. Bind `(imageChanged)` to handle the file and `(imageRemoved)` to clear the image reference.
