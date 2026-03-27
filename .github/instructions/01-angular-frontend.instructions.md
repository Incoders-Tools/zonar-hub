---
applyTo: "src/**/*.ts,src/**/*.html,src/**/*.css"
---

# Angular Frontend Instructions

Use:
- standalone components
- lazy-loaded feature routes
- feature-first folders under `src/app/features/**`
- `core` for singleton infrastructure
- `shared` only for truly reusable UI or system primitives
- Signals for local component state when appropriate

Preferred structure:
- `pages/` for route containers
- `components/` for feature UI pieces
- `services/` for feature orchestration or API facades
- `models/` for typed contracts or view models
- `mappers/` for transformation logic
- `store/` only when state complexity truly requires it

Rules:
- Keep container or page components responsible for orchestration.
- Keep presentational components simple and reusable.
- Use typed inputs and outputs.
- Avoid heavy business logic in templates.
- Prefer modern Angular template features when they improve readability.
- Prefer route-level code splitting.
