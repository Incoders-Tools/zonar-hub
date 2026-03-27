---
applyTo: "src/**/*,.github/**/*,docs/**/*,package.json,angular.json"
---

# Engineering Constitution

Non-negotiable principles:
- Reuse before create.
- Keep it simple.
- Prefer explicitness over magic.
- Prefer composition over inheritance.
- Avoid speculative abstractions.
- Keep architecture boring, readable, and scalable.
- Treat accessibility, responsiveness, and testability as product requirements.
- Avoid hardcoded environment-specific values.
- Optimize for maintainability by a real team, not for cleverness.

Delivery expectations:
- Ship vertical slices that can evolve safely.
- Keep domain language aligned with the circuit business.
- Separate presentational concerns from orchestration and API concerns.
- Document reusable patterns once and reuse them everywhere.

## HTTP and loading behavior

- All API requests must go through Angular HttpClient and centralized services.
- Use the global HTTP interceptor pipeline for cross-cutting concerns.
- The global loader overlay must be triggered centrally for blocking requests.
- Do not implement ad-hoc loading blockers independently in each component if the interceptor already handles it.
- Components may show local skeleton or loading states for partial content, but global blocking behavior must remain centralized.
- Keep authentication headers, request tracing, and standardized error handling in interceptors or dedicated infrastructure layers, not in presentational components.

## Component completeness and documentation

Every non-trivial Angular component must be delivered with:
- `.component.ts`
- `.component.html`
- `.component.scss`
- `.component.spec.ts`
- `.component.md`

SCSS is the standard styling format for Angular components in this repository.

Do not generate incomplete components.

## Business-aware forms and action enablement

Primary actions must remain disabled until both technical validation and business prerequisites are satisfied.

This rule applies especially to:
- admin panels
- access management
- CRUD screens
- dashboard forms
- operational backoffice workflows

Do not enable buttons prematurely.

Button enablement must consider:
- required fields
- valid form state
- business rules
- dependent selections
- workflow prerequisites

## Helper and translated guidance

If a screen includes business rules, prerequisites, visibility side effects, activation or deactivation behavior, or operator-sensitive actions, provide helper guidance.

That helper guidance must:
- explain what the action does
- explain why the action may be disabled
- explain important side effects across the system
- be prepared for translation in supported locales

Supported locales:
- es
- en
- pt
