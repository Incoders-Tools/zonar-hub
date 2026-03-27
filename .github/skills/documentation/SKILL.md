---
name: documentation
description: Defines technical documentation and user-help documentation requirements for components, screens, CRUD tools, and business-aware forms.
---

# Documentation Skill

Use this skill when documenting components, screens, helpers, CRUD modules, admin tools, and dashboard flows.

## Documentation tracks

There are two mandatory documentation tracks when relevant:

1. Technical component documentation
2. User-help or business-help documentation

## Technical component documentation

Every non-trivial component must have a `.component.md` file.

It must include:
- purpose
- feature context
- business intent
- inputs
- outputs
- dependencies
- states
- validation rules
- accessibility notes
- i18n notes
- theming notes
- reuse guidance

## User-help documentation

For admin panels, CRUD tools, access management screens, and dashboard forms, documentation must also explain:

- what the screen does
- what the action affects
- why some buttons are disabled
- which fields are required
- what happens when an entity is activated or deactivated
- visibility rules across the system
- common operator mistakes
- warnings and constraints

## Translation rule

All helper content intended for end users, operators, or admins must exist as translatable content for all supported locales:
- es
- en
- pt

## Example guidance

For a Categories CRUD:
- explain that inactive categories may stop appearing in tournament forms, filters, or public views
- explain that save remains disabled until all required fields are valid
- explain any dependency between category status and system visibility

## Truthfulness rule

Documentation must reflect actual behavior, not assumptions or desired future behavior.