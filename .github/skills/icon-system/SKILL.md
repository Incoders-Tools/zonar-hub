---
name: icon-system
description: Use this skill when selecting, rendering, or creating icons to ensure a single consistent icon system across the application.
---

# Icon System Skill

## Purpose

This skill defines how icons must be selected, rendered, and reused across the application.

## Rule

The application must use a single, consistent icon system.

## Library standard

Preferred icon source:

- Angular Material Icons (Material Symbols)

Do NOT:

- mix multiple icon libraries
- import random SVG sets per feature
- use inconsistent icon styles

## Rendering strategy

Icons should be rendered using a shared, reusable pattern.

Preferred approaches:

- Angular Material icon component
- shared `app-icon` wrapper if abstraction is needed

## Naming rules

- icon names must be explicit and semantic
- avoid unclear or generic icon naming
- icon usage must reflect intent (not just visual similarity)

## Reuse rules

Before introducing a new icon pattern:

1. check existing icon usage
2. reuse the same icon for the same semantic meaning
3. do not create variations unless necessary

## Size and layout

- icon sizing must be consistent
- avoid inline arbitrary sizing
- use shared spacing rules

## i18n rules

Icons must NOT replace text meaning.

- icons complement UI
- text must remain translatable
- do not encode meaning only in icons

## Theming rules

- no hardcoded colors for icons
- use semantic tokens
- icons must adapt to themes

## Accessibility rules

Icons must:

- include accessible labels when needed
- not be the only indicator of meaning
- support screen readers where required

## Documentation requirements

If a shared icon wrapper or system is introduced, it must document:

- supported icon sources
- naming conventions
- usage guidelines
- accessibility expectations

## Final rule

All icons must feel consistent, predictable, and part of the same system across the entire application.