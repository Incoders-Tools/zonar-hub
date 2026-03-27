---
name: multi-theme
description: Defines theming architecture, design tokens, and visual consistency.
---

# Multi-Theme Skill

Use this skill for theme architecture, tokens, and visual consistency.

## Theme strategy
Implement theming through semantic tokens that can feed both Angular Material and custom components.

## Current theme set
1. `court-energy`
2. `clay-match`
3. `night-arena`

## Rules
- components consume semantic tokens, not raw palette values
- ensure AA contrast where possible
- preserve consistent elevation, radius, borders, and focus styles
- themes must scale without rewriting feature styles

## Strict rule
Never hardcode colors in components.
