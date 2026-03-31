# Zonar Hub - Copilot Repository Instructions

Follow the repository contract defined in `AGENTS.md`.

Mandatory read order:

1. `.github/copilot-instructions.md`
2. `.github/instructions/**/*.instructions.md`
3. `.github/skills/**/SKILL.md`
4. `.github/agents/*.agent.md`
5. `docs/architecture/**`
6. `docs/copilot/templates/**`

Do not override this order.

Zonar Hub is a modern Angular frontend for a competitive padel circuit. It consumes a .NET API over HTTP and must be fast, accessible, responsive, scalable, and consistent.

Core repository rules:
- Use Angular standalone components and lazy-loaded feature routes.
- Follow a feature-first architecture under `src/app/features/**`.
- Use Angular Material 3 + CDK as the only shared UI framework unless explicitly approved otherwise.
- Reuse before create. Do not create a second filter panel, form shell, table shell, modal, confirmation dialog, loader, status badge, or button variant unless explicitly requested.
- Keep a strict separation between presentation, routing, state orchestration, and data access.
- Prefer Signals, computed state, and explicit inputs/outputs over ad-hoc shared mutable state.
- Keep business rules out of presentational components.
- Every relevant screen must support loading, empty, error, and success states.
- Every HTTP flow must comply with the global loader and blocking UX strategy defined by the repository.
- Every new reusable or non-trivial component must include HTML, SCSS, TypeScript, tests, and technical Markdown documentation.
- User-facing text must be prepared for i18n from day one. Do not hardcode UI copy that belongs in translation files.
- Multi-theme support is mandatory. Use semantic design tokens and avoid hardcoded colors in components.
- Full responsive behavior is mandatory.
- Prefer simple, production-oriented implementations over speculative abstractions.

When generating code:
- Check whether a reusable primitive already exists or should be extended.
- Match existing naming, structure, file placement, and architecture.
- Keep code testable and documented.
- When migrating from React, preserve behavior and UX while translating idiomatically to Angular.

## Global semantic date-range rule

Whenever a request, feature, screen, filter, form, model, DTO, or query includes a semantic range pair such as:
- `start` / `end`
- `from` / `to`
- `date_from` / `date_to`
- `valid_from` / `valid_to`
- `tournament_start_date` / `tournament_end_date`

you MUST treat it as a protected date-range scenario.

Mandatory behavior:
- block inconsistent selection in the UI when technically possible
- add cross-field form validation
- prevent primary submit actions when the range is invalid
- show a clear translated validation message
- preserve the same rule in create and edit flows
- do not rely only on UI constraints; enforce validation again in the appropriate business/data boundary

Do not leave date consistency as an implicit assumption.

## Global master-detail and child-collections rule

Whenever a request describes:
- header + items
- parent form + child table
- nested rows
- subtable
- detail lines
- one-to-many editable collections
- tabs with related collections
- drag/reorder child items inside a form

you MUST first evaluate whether the feature matches the shared master-detail child-collection pattern.

Default rule:
- do not create a feature-specific child-table component if the behavior matches the shared pattern
- prefer a shared reusable child-grid / child-collection component
- parent forms should orchestrate the aggregate
- shared child components should own row-level UX and collection interaction
- add/remove/reorder/drag-drop logic must be reusable rather than duplicated per feature

Expected shared pattern capabilities:
- Reactive Forms integration
- `FormArray` or equivalent adapter strategy
- add row
- remove row
- reorder rows
- drag and drop
- row-level validation
- configurable columns
- optional tabs for multiple child collections
- optional collapsible groups or collapse-all behavior
- compatibility with FK-backed persistence

If any instruction conflicts with `AGENTS.md`, `AGENTS.md` takes precedence.