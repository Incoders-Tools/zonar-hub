You must NOT implement code.

Quick ecosystem verification:

1) Confirm `.component.scss`, `.component.md`, angular.json, and current components are aligned.
2) Confirm all AGENTS.md agent names exist in `.github/agents` with no routing mismatch.
3) Confirm shared primitives must be reused before creating new ones.
4) Confirm forms require shared validators when applicable, disabled primary actions until technical and business rules pass, and no HttpClient in components.
5) Confirm i18n/theming rules: no hardcoded UI strings, no hardcoded color literals.
6) Confirm whether delete confirmation, toasts, tooltips/placeholders, API mock strategy, navigation/sidebar patterns, icons, async search, and multiselect are already standardized or still missing.
7) Final verdict:
- FULLY ALIGNED
- PARTIALLY ALIGNED
- NOT ALIGNED

Use repository evidence only. No generic answer.