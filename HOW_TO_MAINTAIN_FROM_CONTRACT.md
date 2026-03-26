# How to maintain this template from `ai-agent-contract`

This repository should periodically pull in selected global files from `ai-agent-contract`.

Recommended sync targets:
- `.github/instructions`
- `.github/agents`
- `.github/skills`
- `.memory/engram`
- `docs/base`
- `checks`
- `templates`
- `AGENTS.md`

Do not blindly overwrite:
- `docs/PROJECT_RULES.md`
- `docs/ARCHITECTURE_OVERVIEW.md`
- `docs/DOMAIN_GLOSSARY.md`
- `docs/registries`
- Angular source code under `src/`
