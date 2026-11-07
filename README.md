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
cp .env.example .env
npm start
```

The application should be available at:

```
http://localhost:4200
```

---

## API base URL

The app reads the API base URL at runtime from `ZH_API_BASE_URL`; no API address is hardcoded in `src/`.

- `npm start` and `npm run build` first run `scripts/write-runtime-config.mjs` (`prestart` / `prebuild`).
- The script takes `ZH_API_BASE_URL` from the process environment, else from the gitignored `.env` at the repository root, and writes the gitignored `public/runtime-config.js` (`window.__ZH_API_BASE_URL__ = "...";`). `src/index.html` loads that file before the application bundle.
- The value must be an absolute `http`/`https` URL including the `/api` prefix (for example `https://api.example.com/api`); any other value stops the script with an error.
- When the value is empty or unset, the script prints a warning and the app calls the API on its own origin: `${location.origin}/api`.
- Local development: copy `.env.example` to `.env`; it points to the local API (`http://localhost:5336/api`).
- Deployed environments set `ZH_API_BASE_URL` as a build-time variable instead of using a `.env` file.

Requests to anonymous public endpoints set the `PUBLIC_REQUEST` HTTP context flag (`src/app/core/http/public-request.context.ts`), so the auth and tenant interceptors attach no `Authorization`, `X-Tenant-Id` or `X-Organization-Id` header to them, even for logged-in visitors.

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
- CI: `.github/workflows/ci.yml` runs the `ci-gate` job (`npm ci`, `npm run test:ci`, `npm run build`) on every pull request and push to `dev` and `main`; merge only when `ci-gate` is green on the PR head commit

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
