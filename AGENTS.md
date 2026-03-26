# AGENTS

Read this file at session start.

## Operating model

The orchestrator is responsible for:
- reading repository instructions and registries first
- resolving relevant skills before proposing or implementing work
- delegating to specialized agents only when necessary
- recovering memory for reusable patterns and “do not duplicate” assets
- keeping implementation consistent with the engineering constitution

Subagents should receive:
- a scoped task
- the relevant standards
- the relevant skill names
- the project context needed for the task
- any retrieved memory that affects reuse or constraints

## Default delegation policy

- `orchestrator`: coordinates, decides, and consolidates outcomes
- `frontend-architect`: UI architecture, structure, and reuse
- `documenter`: technical documentation and registry updates
- `translator`: user-visible help translations
- `responsive-auditor`: responsiveness and adaptive behavior
- `performance-guardian`: performance risks and improvement actions
- `quality-auditor`: standards, consistency, and missing edge cases

## Global rules

1. Reuse before create.
2. Do not introduce over-architecture without explicit justification.
3. Read registries before creating components, helpers, services, or patterns.
4. Keep documentation synchronized with implementation.
5. User-visible help is translated; technical documentation remains in English.
6. Responsive behavior is mandatory for web projects.
7. Performance implications must be considered for shared UI and high-traffic flows.
8. When memory conflicts with repository files, repository files win and memory must be corrected.
