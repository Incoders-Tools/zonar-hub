---
applyTo: "src/app/features/admin/**/*,src/app/layout/**/*"
---

# Admin Preview Controls Instructions

These instructions apply to system-administration and preview-capable interfaces.

## Required admin preview controls

System administrators must be able to preview the application using:
- a language selector
- a theme selector

## Language selector rules

- allow previewing the application in all supported locales
- changing preview locale must update visible UI copy immediately
- preview must be safe and reversible
- preview must help validate translation completeness and layout behavior

## Theme selector rules

- allow previewing all supported themes
- changing theme must update both Material components and custom components
- preview must help validate readability, contrast, and product feel

## Governance rule

These selectors are administrative preview tools and must not be implemented as disconnected demo widgets.
They must be wired to the real runtime theming and localization systems.