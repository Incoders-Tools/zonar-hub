You must NOT implement code.

Run a strict repository alignment audit using repository evidence only.

Audit in two layers for every point:
- CONTRACT LEVEL = documented rules, instructions, skills, agents
- IMPLEMENTATION LEVEL = actual repository files such as src, angular.json, shared components, validators, services, docs

If implementation evidence is missing, say exactly:
NOT VERIFIED FROM AVAILABLE EVIDENCE

Required checks:

1) Component contract
- Confirm whether the repository contract requires:
  - `.component.ts`
  - `.component.html`
  - `.component.scss`
  - `.component.spec.ts`
  - `.component.md`
- Confirm whether `angular.json` and current Angular component implementation were actually verified.
- If they were not available, say so explicitly.

2) Agent routing
- Confirm every agent referenced by `AGENTS.md` exists under `.github/agents`.
- Report any missing agent or naming mismatch.

3) Reuse-before-create
- Confirm whether shared primitives are mandated before creating new ones.
- Confirm whether actual shared primitives were verified in implementation or not.

4) Forms and HTTP
- Confirm whether forms require shared validators when applicable.
- Confirm whether primary actions must stay disabled until both technical and business rules pass.
- Confirm whether components are forbidden from calling HttpClient directly.
- Confirm whether implementation evidence exists.

5) i18n and theming
- Confirm whether hardcoded user-facing strings are forbidden.
- Confirm whether hardcoded color literals are forbidden.
- Confirm supported locales and named themes if documented.
- Confirm whether implementation evidence exists.

6) Standardized behavior inventory
For each item, return one of:
- STANDARDIZED IN CONTRACT
- VERIFIED IN IMPLEMENTATION
- MISSING
- NOT VERIFIED FROM AVAILABLE EVIDENCE

Items:
- delete confirmation
- toasts / snackbar
- tooltips / placeholders / helper texts
- API mock strategy
- navigation / sidebar pattern
- icon system
- async search
- multiselect

7) Consistency audit
Check for contradictions across:
- `AGENTS.md`
- `.github/copilot-instructions.md`
- `README.md`

Specifically verify:
- read order consistency
- rescue prompt path consistency
- precedence consistency

8) Final verdict
Return exactly one:
- FULLY ALIGNED
- PARTIALLY ALIGNED
- NOT ALIGNED

Output format:

# Ecosystem audit

## Verified
- ...

## Gaps
- ...

## Contradictions
- ...

## Standardization matrix
- item → status

## Final verdict
- ...

Rules:
- Use repository evidence only
- No generic answer
- No assumptions
- Do not mark implementation as verified unless the actual implementation files were inspected