---
name: angular-frontend
description: Defines Angular architecture, feature structure, component composition, and delivery rules for Zonar Hub.
---

# Angular Frontend Skill

Use this skill when creating screens, features, routes, pages, forms, CRUD modules, dashboards, or reusable components.

## Architectural defaults

- Standalone Angular components
- Feature-first structure
- Lazy route loading
- Signals for local or UI state when appropriate
- Angular Material 3 + CDK as the ONLY UI framework
- SCSS as the standard component styling format

## Mandatory feature structure

When creating a non-trivial feature, prefer this structure:

- `src/app/features/<feature>/<subfeature>/pages/**`
- `src/app/features/<feature>/<subfeature>/components/**`
- `src/app/features/<feature>/<subfeature>/services/**`
- `src/app/features/<feature>/<subfeature>/models/**`
- `src/app/features/<feature>/<subfeature>/mappers/**`
- `src/app/features/<feature>/<subfeature>/docs/**` when needed

Example:

- `src/app/features/tournaments/registration/pages/registration-page/**`
- `src/app/features/tournaments/registration/components/registration-form/**`
- `src/app/features/tournaments/registration/services/tournament-registration.service.ts`

## Mandatory component delivery

Every non-trivial component MUST be delivered with all of the following:

- `.component.ts`
- `.component.html`
- `.component.scss`
- `.component.spec.ts`
- `.component.md`

Do not omit any of these files unless the user explicitly requests otherwise.

## Component markdown requirements

Every `.component.md` file must explain:

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

## Forms and dashboards

If a component belongs to:
- administrative panels
- user access management
- CRUD screens
- dashboard forms
- backoffice tools
- operational screens with business rules

then it MUST also include:

- contextual help content
- user guidance for business rules
- translated helper content for all supported locales

## Form behavior rules

All forms MUST:

- use Reactive Forms
- use shared validators when possible
- disable primary submit actions until business prerequisites are satisfied
- prevent duplicate submissions
- expose clear validation and helper feedback
- support loading, submitting, success, error, and disabled states

## Button enablement rule

Buttons MUST NOT be enabled only because fields contain some value.

Buttons must be enabled only when:
- validation rules pass
- business prerequisites pass
- dependent selections are complete
- the use case allows the action

Examples:
- player creation requires all mandatory player fields
- category save requires all required fields and valid state
- tournament registration requires valid pairing and availability selection if applicable

## Help and guidance rule

For admin tools, dashboard forms, and CRUD screens, always provide a helper/help pattern explaining:
- what the action does
- prerequisites to enable the action
- important side effects
- visibility rules across the system
- warnings and constraints

Example:
If a category is deactivated, it may stop appearing in tournament setup, filters, or public screens.
This must be documented in the helper content and translated for supported locales.

## Reuse rules

Never create a new shared modal, filter panel, form shell, list shell, helper dialog, or button style without checking the shared UI system first.

## Standard CRUD feature blueprint

A standard CRUD feature should usually include:

- list page
- create/edit form page
- feature service
- models
- mappers
- routes
- documentation

List pages must reuse the shared list system and shared pagination component.

CRUD list screens should support when relevant:
- search
- filters
- row actions
- bulk selection
- bulk deletion
- pagination

Do not build a custom list pattern for each entity.