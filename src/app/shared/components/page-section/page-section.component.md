# PageSectionComponent

## Purpose

Reusable page section wrapper that provides consistent spacing and an optional header (title + subtitle). Used to visually segment page content into labeled blocks.

## Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `titleKey` | `string` | `undefined` | Translation key for the section title. When omitted, no header is rendered. |
| `subtitleKey` | `string` | `undefined` | Translation key for the section subtitle. |

## Outputs

None.

## Dependencies

- `TranslateService` / i18n pipe for resolving translation keys.

## States

| State | Description |
|-------|-------------|
| With header | Title (and optional subtitle) are rendered above the projected content. |
| Without header | Only the projected content is rendered inside the section wrapper. |

## Accessibility

- Title renders as a heading element with an appropriate semantic level.
- Section uses a landmark or grouping role when a title is present.

## i18n

- `titleKey` and `subtitleKey` are translation keys resolved at runtime.
- No hardcoded user-facing text.

## Theming

- Typography uses semantic heading and body tokens.
- Section spacing and dividers use design-token values.

## Reuse guidance

Use as a layout primitive to wrap any page section that benefits from a consistent title/subtitle header and spacing. Accepts content projection for the section body.
