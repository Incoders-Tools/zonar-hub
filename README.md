# Zonar Hub Angular Template

Minimal Angular template ready to bootstrap a new application with a structured Copilot ecosystem.

---

## Overview

This repository provides:

- Angular standalone setup
- Feature-first folder structure
- SCSS-based styling system
- i18n-ready architecture
- Theme-token-based UI system
- Structured Copilot contract under `.github/`
- Zero extra setup beyond Node/npm

---

## Requirements

- Node.js 20.11.1 or higher
- npm 10 or higher

---

## Verify environment

```bash
node -v
npm -v
```

---

## Getting started

```bash
npm install
npm start
```

The application should be available at:

```
http://localhost:4200
```

---

## Creating a new repository from this template

1. Click **Use this template** on GitHub
2. Clone your new repository
3. Run:

```bash
npm install
npm start
```

---

## Troubleshooting

Check:

- Node version is 20+
- `npm install` completed without errors
- port 4200 is available
- you are running commands from project root

---

## Project structure

- `.github/` → Copilot ecosystem (instructions, skills, agents)
- `AGENTS.md` → entry contract for reasoning
- `docs/` → templates and architecture references (if present)
- `src/` → Angular application

---

## Architecture highlights

- Angular standalone components
- Feature-first structure
- Strict separation:
  - UI
  - orchestration
  - data access
- SCSS with semantic design tokens
- i18n enforced (no hardcoded user-facing strings)
- Theming enforced (no hardcoded color literals)
- Reuse-first UI system

---

## Testing

- Framework: **Jasmine**
- All components MUST have `.spec.ts`
- Behavior-driven tests only (no implementation coupling)

---

## Copilot ecosystem

This repository uses a structured Copilot operating model.

The canonical contract is defined in `AGENTS.md`.

Mandatory read order:

1. `.github/copilot-instructions.md`
2. `.github/instructions/**/*.instructions.md`
3. `.github/skills/**/SKILL.md`
4. `.github/agents/*.agent.md`
5. `docs/architecture/**`
6. `docs/copilot/templates/**`

If any summary or helper text conflicts with `AGENTS.md`, `AGENTS.md` takes precedence.

---

## Copilot validation

When in doubt, use one of these prompts:

- `docs/copilot/templates/ecosystem-rescue.prompt.md`
- `docs/copilot/templates/ecosystem-rescue-short.prompt.md`

These prompts verify whether Copilot is correctly following the repository contract and whether the current repository implementation is actually aligned with that contract.
---

## Extended shared behavior rules

The repository standardizes behavior through skills for:

- API mocking when backend integration is unavailable
- App shell, sidebar, and responsive navigation
- Notifications and destructive confirmations
- Centralized validators, placeholders, helper texts, and tooltips
- Code style and formatting consistency
- Search, autocomplete, multiselect, and selection patterns
- Icon system standardization

All rules defined under `.github/skills/**/SKILL.md` are mandatory.

---

## UI system rules

The application uses canonical shared primitives:

- filter-panel
- form-shell
- data-table
- confirm-dialog
- async-button
- loader-overlay

These MUST be reused before creating new UI elements.

---

## Key constraints

- No HttpClient usage inside components
- No hardcoded UI strings
- No hardcoded color values
- No duplicated UI primitives
- No ad-hoc architectural patterns

---

## Copilot validation

When in doubt, use the rescue prompt:

```
docs/copilot/templates/ecosystem-rescue.prompt.md
```

This verifies whether Copilot is correctly following the repository contract.

---

## Goal

Ensure that:

- code is consistent
- UI is reusable
- architecture is predictable
- Copilot operates deterministically within the system
