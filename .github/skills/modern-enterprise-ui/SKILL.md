---
name: modern-enterprise-ui
description: Enforces a contemporary, premium, high-trust enterprise UI style using Angular Material 3, CDK, and the repository design-token system.
---

# Modern Enterprise UI Skill

Use this skill whenever creating or refactoring visible UI.

## Product feel target

The application must feel:
- modern
- premium
- focused
- scalable
- trustworthy
- business-ready

It must not feel:
- generic
- dated
- visually noisy
- inconsistent
- prototype-like

## Visual rules

- use clear visual hierarchy
- use whitespace intentionally
- prefer clean card/page compositions over dense unstructured blocks
- use modern section headers, helper text, and contextual actions
- keep action hierarchy explicit
- ensure tables, filters, forms, and dialogs feel part of one design system

## Composition rules

- each screen must have a clear primary action
- secondary actions must not compete visually with the primary action
- filters must feel structured and reusable
- forms must feel deliberate and calm, not raw field dumps
- empty states must feel designed, not accidental

## Technical rules

- use Angular Material 3 + CDK only
- rely on design tokens and theme variables
- avoid ad-hoc CSS that bypasses the design system
- prefer accessible Material patterns before inventing custom widgets

## Quality bar

If the resulting UI feels like a scaffold, it is not complete.
If the resulting UI feels visually inconsistent with the rest of the product, it is not complete.