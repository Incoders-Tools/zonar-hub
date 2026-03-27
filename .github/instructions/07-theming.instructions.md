---
applyTo: "src/**/*.scss,src/**/*.ts,docs/architecture/design-system.md,.github/skills/multi-theme/**/*"
---

# Multi-Theme Instructions

Zonar Hub supports at least three themes and must scale to more.

Rules:
- Implement themes through semantic design tokens.
- Keep components theme-agnostic.
- Do not hardcode palette colors in feature styles.
- Theme switching should affect Material components and custom components consistently.
- Keep contrast and readability accessible in every theme.
- Prefer light and dark aware tokens if a theme requires it.
