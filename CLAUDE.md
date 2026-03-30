# Claude Project Contract

This repository uses `.github/` as the canonical operating model.

Mandatory read order:
1. `.github/copilot-instructions.md`
2. `.github/instructions/**/*.instructions.md`
3. `.github/skills/**/SKILL.md`
4. `.github/agents/*.agent.md`
5. `docs/architecture/**`
6. `docs/copilot/templates/**`

`AGENTS.md` is the repository-level contract and takes precedence over summaries or assumptions.

Rules:
- Do not invent parallel architecture rules
- Do not create alternative instruction systems
- Do not ignore `.github/` because `.claude/` exists
- Reuse the existing repository contract as the source of truth
- If `.claude/` guidance and `.github/` guidance ever conflict, follow `AGENTS.md` and `.github/`

Operational requirements:
- Reuse before create
- No hardcoded UI text
- Respect i18n, theming, testing, and shared component rules
- Do not perform Git write operations unless explicitly requested by the user