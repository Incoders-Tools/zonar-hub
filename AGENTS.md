# Zonar Hub Agent Contract

This repository defines its Copilot operating model in `.github/` and `docs/architecture/`.

## Read order (MANDATORY)

1. `.github/copilot-instructions.md`
2. `.github/instructions/**/*.instructions.md`
3. `.github/skills/**/SKILL.md`
4. `.github/agents/*.agent.md`
5. `docs/architecture/**`
6. `docs/copilot/templates/**`

Always follow this order when reasoning about the project.

---

## Product context

- Product name: Zonar Hub
- Domain: padel circuit management, player registration, rankings, draws, match progression, tournament visibility, complexes, courts, dashboards, and live tournament state
- Frontend: Angular
- Backend integration: .NET HTTP API

---

## Non-functional priorities

- speed
- consistency
- accessibility
- responsiveness
- reuse
- maintainability
- scalability

---

## Global engineering rules (NON-NEGOTIABLE)

- Reuse before create
- Angular Material 3 + CDK is the ONLY UI framework
- One shared design-token system (colors, spacing, typography, elevation, states)
- One filter-panel pattern unless explicitly justified
- One form layout system unless explicitly justified
- One data list / table system unless explicitly justified

- Always provide:
  - loading state
  - empty state
  - error state
  - success state

- Use feature-first folder structure
- Use standalone Angular components
- Prefer Signals for local state when applicable
- Separate UI, orchestration, and API layers strictly
- Use semantic, modern CSS and theme tokens (no hardcoded styles)

---

## Component delivery requirements (MANDATORY)

Every non-trivial component MUST include:

- `.component.ts`
- `.component.html`
- `.component.css`
- `.component.spec.ts`

Additionally, for reusable or complex components:

- technical markdown documentation is REQUIRED

### Technical documentation must include:
- purpose
- inputs
- outputs
- dependencies
- variants and states
- accessibility notes
- i18n considerations
- theming considerations
- reuse guidance

---

## UI system rules (STRICT)

Before creating any UI element:

1. Check if a shared component already exists
2. Reuse it if possible
3. Extend it if necessary
4. NEVER duplicate it

### Canonical components (MANDATORY)

- filter-panel
- form-shell
- data-table
- confirm-dialog
- async-button
- loader-overlay

---

## Form rules (STRICT)

All forms MUST:

- use Reactive Forms
- be wrapped in a shared form-shell
- use shared validators when applicable
- use async-button for submit actions
- prevent duplicate submissions
- handle:
  - loading
  - submitting
  - success
  - error

---

## API & HTTP rules

- Components MUST NOT call HttpClient directly
- All API interaction must go through services
- Interceptors handle:
  - global loading behavior
  - error handling
  - future authentication concerns

- Global blocking loader must be centralized
- Do not implement ad-hoc loading blockers per component

---

## i18n rules

- No hardcoded user-facing text
- All strings must use translation keys
- Supported locales:
  - es
  - en
  - pt

---

## Theming rules

- No hardcoded colors
- Use semantic design tokens only
- Support multiple themes:
  - court-energy
  - clay-match
  - night-arena

---

## Testing rules

- Every component MUST have a `.spec.ts`
- Test behavior, not implementation
- Cover:
  - rendering
  - states
  - interactions
  - outputs

- No empty or superficial tests

---

## Agent routing (ENFORCED)

Use the correct agent depending on the task:

- Architecture and screen composition → `frontend-architect`
- UI reuse and shared components → `frontend-architect` (UI enforcement is centralized)
- Documentation and business-help → `documentation-steward`
- i18n and locale structure → `i18n-agent`
- Theming and design tokens → `theme-architect`
- Testing and coverage → `testing-guardian`
- React to Angular migration → `react-interpreter`
- Dependency detection → `dependency-architect`
- Final validation → `audit`

---

## Final rule

If any instruction conflicts with this contract:

→ This file takes precedence  
→ Enforce consistency over convenience  
→ Never introduce architectural drift