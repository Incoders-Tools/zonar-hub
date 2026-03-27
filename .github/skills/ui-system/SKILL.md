---
name: ui-system
description: Defines reusable UI system rules, shared components, and design consistency for Zonar Hub.
---

# UI System Skill

Use this skill for any reusable UI or design-system decision.

## Framework decision
The shared UI framework for Zonar Hub is Angular Material 3 + CDK. Keep the app visually unified through one framework and one token system.

## Shared primitives to prioritize
- app page header
- app section card
- app primary, secondary, and destructive buttons
- app filter panel
- app form shell
- app data list or data table shell
- app empty state
- app error state
- app confirmation dialog
- app helper dialog
- app blocking loader overlay
- app status chips

## Styling principles
- Use semantic design tokens.
- Use modern CSS with custom properties, logical properties, gap, clamp, container queries when justified, and accessible focus states.
- Never hardcode feature colors.
- Prefer composition and variants over copy-paste components.

## Canonical UI components (mandatory)
Do not create alternatives unless explicitly requested.

- Filter Panel → `shared/ui/filter-panel`
- Form Shell → `shared/ui/form-shell`
- Data Table → `shared/ui/data-table`
- Confirm Dialog → `shared/ui/confirm-dialog`
- Async Button → `shared/ui/async-button`

If a similar component exists:
- reuse it
- extend it
- never duplicate it

## Form pattern (strict)

Every non-trivial form must follow this structure:
- feature container component
- shared form shell
- Angular reactive forms
- shared validators when applicable
- centralized service for submit
- shared async button for primary actions

Required states:
- loading
- submitting
- success
- error

Do not create a different visual or structural pattern for forms unless explicitly requested.


## Shared list and pagination pattern

All non-trivial list-based screens must reuse a shared list pattern.

Canonical shared primitives:
- data-table
- list-toolbar
- bulk-actions-bar
- pagination

The shared pagination solution must be reusable across the platform and support:
- server-side pagination when required
- configurable page size
- page index display
- total item count
- optional pagination placement:
  - footer only (default)
  - header only
  - header and footer

The shared list pattern must support:
- row selection
- bulk selection
- bulk actions
- empty state
- loading state
- error state
- responsive adaptation

Do not create feature-specific pagination components unless explicitly justified.