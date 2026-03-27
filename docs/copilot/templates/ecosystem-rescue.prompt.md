# Copilot Ecosystem Rescue Prompt

Use this prompt when there is any suspicion that Copilot is not following the repository ecosystem correctly.

## Prompt

You must NOT implement code.

Verify whether you are currently reasoning with the repository ecosystem correctly.

Read and validate against:

- AGENTS.md
- .github/copilot-instructions.md
- .github/instructions/**
- .github/skills/**
- .github/agents/**
- angular.json
- current component files

Return only:

1) Core alignment
- Is the repository standardized on `.component.scss`?
- Does angular.json follow that standard?
- Do current components follow it?
- Is `.component.md` required consistently for non-trivial components?

2) Agent routing
- Do all agent names referenced in AGENTS.md exist in `.github/agents`?
- Is any real agent missing from AGENTS.md?

3) UI system
- Are shared primitives enforced before creating new ones?
- Are `filter-panel`, `form-shell`, `data-table`, `confirm-dialog`, `async-button`, and `loader-overlay` still canonical?
- If a toast, tooltip, autocomplete, multiselect, search field, navbar, or dialog already exists, would you reuse it instead of creating another one?

4) Forms and data access
- Are shared validators required when applicable?
- Are primary actions disabled until technical and business rules pass?
- Are components forbidden from calling HttpClient directly?
- Is base URL / API configuration centralized?
- If the API is not configured, is a mock-first service strategy required?

5) UX and behavior
- Are hardcoded user-facing strings forbidden?
- Are hardcoded color literals forbidden?
- Are destructive delete actions required to use a shared confirm dialog?
- Are toasts or notifications standardized?
- Are placeholders, tooltips, and helper texts centralized and translatable?

6) Final verdict
- FULLY ALIGNED
- PARTIALLY ALIGNED
- NOT ALIGNED

7) Blocking issues
- List only the exact missing or conflicting rules that still prevent safe autonomous implementation.

Use repository evidence only.
Do not answer generically.
Do not implement code.