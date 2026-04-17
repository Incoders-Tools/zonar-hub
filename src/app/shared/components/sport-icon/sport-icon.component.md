# SportIconComponent

## Purpose

Unified renderer for sport icons. Supports Unicode emoji and custom SVG assets via a single consistent API.

## Inputs

| Input    | Type             | Default     | Description                                                |
|----------|------------------|-------------|------------------------------------------------------------|
| icon     | string (required)| —           | Unicode emoji or SVG asset key (filename without extension)|
| source   | SportIconSource  | `'unicode'` | `'unicode'` renders text, `'svg'` renders image            |
| size     | number           | `24`        | Icon size in pixels                                        |
| alt      | string           | `''`        | Accessibility label                                        |

## SVG Convention

SVG assets must be placed in `src/assets/icons/sports/` named by the sport key (e.g., `padel.svg`).

## Accessibility

- Unicode mode uses `aria-label` for screen readers.
- SVG mode uses `alt` attribute on the `<img>`.

## Reuse Guidance

Use this component anywhere a sport icon is displayed—tables, lists, cards, form previews—instead of rendering emojis inline.
