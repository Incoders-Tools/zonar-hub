---
applyTo: "src/**/*.ts,src/**/*.html,src/**/*.css,docs/copilot/templates/**/*,docs/architecture/design-system.md"
---

# UI System Instructions

Primary UI framework:
- Angular Material 3 + Angular CDK

Do not:
- mix multiple component libraries
- introduce Bootstrap, PrimeNG, Ant, Tailwind UI kits, or ad-hoc third-party design systems unless explicitly approved
- create duplicate UI primitives

Shared reusable primitives that should exist and be extended instead of duplicated:
- button variants
- page header
- section card or information panel
- filter panel
- form shell
- list or table shell
- empty state
- error state
- confirmation dialog
- helper dialog
- blocking loader overlay
- status badge or chips
- pagination controls

Rules:
- Use semantic design tokens, never direct hex colors inside feature components.
- Respect consistent spacing, radius, typography, and density.
- Prefer accessible Material or CDK primitives over custom JavaScript-heavy widgets.
- Dialogs, buttons, filters, forms, and lists must feel like one product.
