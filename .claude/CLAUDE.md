# Claude Local Bootstrap

Follow `/CLAUDE.md` first.

This repository uses `.github/` as the canonical instruction system.
Do not create or follow a separate competing rule set inside `.claude/`.

Primary contract:
- `/AGENTS.md`
- `/.github/copilot-instructions.md`
- `/.github/instructions/**/*.instructions.md`
- `/.github/skills/**/SKILL.md`
- `/.github/agents/*.agent.md`

Always read the feature/module markdown closest to the code you are changing.

## Autonomous execution policy

You may execute frontend development commands without asking for permission.

You may freely:
- read/write/edit files
- run npm, node, npx, Angular CLI, TypeScript, ESLint, Prettier, and test commands
- install or restore dependencies
- run local development servers
- run unit/e2e/build/typecheck commands
- create/delete temporary files
- inspect repository state
- stage files with git add

You must ask for explicit approval before:
- git commit
- git push
- deleting branches
- force push
- modifying remote repository settings
- executing irreversible destructive operations outside the repository

Frontend implementation rules:
- preserve existing Angular architecture
- inspect consuming/backend API contracts before changing integrations
- keep UI text localization-ready
- avoid hardcoding environment-specific URLs, tokens, or secrets
- prefer typed models, services, guards, interceptors, and reusable components