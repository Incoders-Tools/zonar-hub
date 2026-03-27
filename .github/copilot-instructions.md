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

If any instruction conflicts with `AGENTS.md`, `AGENTS.md` takes precedence.