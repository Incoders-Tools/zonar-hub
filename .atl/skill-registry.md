# Skill Registry — zonar-hub

Generated: 2026-05-14
Project: zonar-hub

---

## Project Convention Files

| File | Purpose |
|------|---------|
| `AGENTS.md` | Repository contract — read order, engineering rules, agent routing, form rules, API rules, i18n, theming, testing |
| `.github/copilot-instructions.md` | Copilot instructions — Angular architecture, date-range rules, master-detail rules |
| `.github/instructions/00-engineering-constitution.instructions.md` | Core engineering principles |
| `.github/instructions/01-angular-frontend.instructions.md` | Angular frontend patterns |
| `.github/instructions/02-ui-system.instructions.md` | UI system rules |
| `.github/instructions/03-data-access.instructions.md` | Data access and HTTP patterns |
| `.github/instructions/04-testing.instructions.md` | Testing strategy and Jasmine rules |
| `.github/instructions/05-documentation.instructions.md` | Documentation requirements |
| `.github/instructions/06-i18n.instructions.md` | i18n structure |
| `.github/instructions/07-theming.instructions.md` | Theming and design tokens |
| `.github/instructions/08-react-to-angular.instructions.md` | React-to-Angular migration |
| `.github/instructions/09-user-experience.instructions.md` | UX rules |
| `.github/instructions/10-admin-crud.instructions.md` | Admin CRUD patterns |
| `.github/instructions/11-translation-quality.instructions.md` | Translation quality |
| `.github/instructions/12-catalog-governance.instructions.md` | Catalog governance |
| `.github/instructions/13-admin-preview-controls.instructions.md` | Admin preview controls |
| `.github/instructions/14-git-safety.instructions.md` | Git safety rules |
| `.github/instructions/15-master-detail-child-collections.instructions.md` | Master-detail patterns |
| `.github/instructions/16-frontend-driven-resource-design.instructions.md` | Frontend-driven resource design |

---

## Project Skills (.github/skills/**/SKILL.md)

| Skill | File | Trigger |
|-------|------|---------|
| admin-crud | `.github/skills/admin-crud/SKILL.md` | Creating or refactoring admin management/CRUD screens |
| angular-frontend | `.github/skills/angular-frontend/SKILL.md` | Creating screens, features, routes, pages, forms, CRUD modules, dashboards, or reusable components |
| api-integration | `.github/skills/api-integration/SKILL.md` | Integrating frontend with backend API, HTTP behavior, interceptor usage |
| api-mocking | `.github/skills/api-mocking/SKILL.md` | Backend API unavailable or incomplete; mock-first development |
| app-layout-navigation | `.github/skills/app-layout-navigation/SKILL.md` | Creating or modifying app shell, sidebar, navigation, route groups |
| audit | `.github/skills/audit/SKILL.md` | Final compliance checklist and architectural consistency verification |
| auth-form-standards | `.github/skills/auth-form-standards/SKILL.md` | Login, register, password flows, authentication forms |
| code-style | `.github/skills/code-style/SKILL.md` | Generating or editing TypeScript, HTML, SCSS, Markdown, tests, config files |
| documentation | `.github/skills/documentation/SKILL.md` | Documenting components, screens, CRUD modules, admin tools |
| drag-sort-preponderance | `.github/skills/drag-sort-preponderance/SKILL.md` | Drag-and-drop ordering, sort_order, preponderance fields |
| entity-key-governance | `.github/skills/entity-key-governance/SKILL.md` | Entities with name+key pairs, normalized key generation |
| forms-and-validation | `.github/skills/forms-and-validation/SKILL.md` | Building forms, validators, field rules, helper texts, date ranges |
| icon-system | `.github/skills/icon-system/SKILL.md` | Selecting, rendering, or creating icons |
| list-and-card-views | `.github/skills/list-and-card-views/SKILL.md` | Any screen rendering a list of records; zh-collection-view usage |
| loading-and-progress | `.github/skills/loading-and-progress/SKILL.md` | Loading states, skeletons, spinners, blocking overlays, progress bars |
| master-detail-child-grid | `.github/skills/master-detail-child-grid/SKILL.md` | Parent-form + child-collection patterns, editable subtables, tabbed collections |
| modern-enterprise-ui | `.github/skills/modern-enterprise-ui/SKILL.md` | Creating or refactoring visible UI; premium enterprise look and feel |
| multi-language | `.github/skills/multi-language/SKILL.md` | User-facing copy and i18n structure; AppLocale; translation keys |
| multi-theme | `.github/skills/multi-theme/SKILL.md` | Theme architecture, design tokens, visual consistency |
| notifications-and-feedback | `.github/skills/notifications-and-feedback/SKILL.md` | Save/update/delete/success/error feedback; toasts; confirm dialogs |
| react-to-angular | `.github/skills/react-to-angular/SKILL.md` | Translating React components or behavior into Angular |
| search-and-selection | `.github/skills/search-and-selection/SKILL.md` | Autocomplete, async search, multiselect, filter search |
| testing | `.github/skills/testing/SKILL.md` | Every new component, service, interceptor, guard, reusable helper |
| translation | `.github/skills/translation/SKILL.md` | Translating user-facing strings explicitly requested by user |
| translation-quality | `.github/skills/translation-quality/SKILL.md` | New screens, CRUD modules, shared UI copy, locale file changes |
| ui-system | `.github/skills/ui-system/SKILL.md` | Reusable UI or design-system decisions |

---

## User-Level Skills (C:\Users\patri\.claude\skills)

| Skill | Trigger |
|-------|---------|
| branch-pr | PR creation workflow with issue-first enforcement |
| diagnose-why-work-stopped | Forensics on stalled, looping, or stopped work trees |
| issue-creation | Creating GitHub issues, reporting bugs, feature requests |
| judgment-day | Adversarial dual-review protocol |
| sdd-explore | Investigate an idea or explore the codebase |
| sdd-new | Start a new SDD change (meta-command) |
| sdd-propose | Write a structured change proposal |
| sdd-spec | Write spec scenarios for a change |
| sdd-design | Write technical design and architecture decisions |
| sdd-tasks | Break design into executable tasks |
| sdd-apply | Implement tasks from the spec |
| sdd-verify | Validate implementation against spec |
| sdd-archive | Close a change and persist artifacts |

---

## Compact Rules (injected into sub-agents)

### angular-frontend
- Standalone Angular components; feature-first structure under `src/app/features/<feature>/`
- Lazy route loading; Angular Material 3 + CDK as the ONLY UI framework
- Signals for local state when applicable; SCSS for styling
- Feature file structure: pages/, components/, services/, models/, mappers/, docs/

### code-style
- Prefer consistency and match existing repository conventions
- TypeScript strict mode enabled; no hardcoded magic strings
- SCSS: semantic tokens only, no hardcoded colors; modern CSS (gap, clamp, logical properties)
- HTML: accessible, clean, no inline styles

### testing
- Every created component MUST include a `.spec.ts`
- Framework: Jasmine + Karma (Angular TestBed); do NOT use Jest or Mocha
- Test behavior (rendering, states, interactions, outputs) — not implementation details
- Cover: loading, empty, error, success states; validation; button disabled states; i18n usage

### api-integration
- Components MUST NOT call HttpClient directly — use services/repositories
- Interceptors handle global loading, error handling, authentication
- Typed requests and responses; mappers/adapters for API-to-UI adaptation
- Centralized environment configuration; graceful error handling

### ui-system
- Reuse before create — check if a shared component already exists
- Angular Material 3 + CDK only; one design-token system for colors, spacing, typography
- Semantic design tokens; no hardcoded colors in components
- Shared primitives: filter-panel, form-shell, data-table, confirm-dialog, async-button, loader-overlay

### admin-crud
- CRUD module is not complete without: page shell, filter panel, pagination, all 4 states (loading/empty/error/success), CRUD dialogs, help guidance
- Use zh-collection-view for list rendering (table + cards toggle)
- All forms use Reactive Forms + shared form-shell + async-button
- Every delete/destructive action requires confirm-dialog

### forms-and-validation
- Reactive Forms only; shared validators for email, phone, date-ranges
- Primary actions disabled until technical validation AND business prerequisites satisfied
- Date-range pairs (start/end, from/to) require cross-field validation
- Helper/tooltip guidance mandatory where business rules affect user actions

### multi-theme
- Three themes: court-energy, clay-match, night-arena
- Tokens in `src/styles/_tokens.scss`; per-theme overrides in `_themes.scss`
- Never hardcode colors; use semantic tokens with CSS custom properties
- Components must not depend on specific theme — tokens abstract the theme

### multi-language
- AppLocale in `src/app/core/i18n/i18n.types.ts` is the source of truth
- Translations in `src/app/core/i18n/i18n.translations.ts`; same key tree across all locales
- No hardcoded user-facing text; all UI copy must use translation keys
- Supported locales: es, en, pt

### list-and-card-views
- All record listings MUST use `<zh-collection-view>` (src/app/shared/components/zh-collection-view/)
- Default mode: paginated → table; non-paginated → cards; toggle is part of the contract
- Do NOT create feature-specific cards grids or wrap app-data-table separately
- Cards use `.zh-list-card` shared styles

### notifications-and-feedback
- One shared notification system (toast/snackbar for transient feedback)
- One shared destructive confirmation pattern (confirm-dialog for delete flows)
- Do not invent ad-hoc toast or alert implementations per feature
- Success, error, and informational feedback must be verified in tests

### master-detail-child-grid
- Build or extend ONE shared child-collection primitive instead of per-feature tables
- Applies to: header-detail, order-items, tournament-complexes, any one-to-many in a form
- Required capabilities: FormArray, add/remove/reorder, drag-drop, row-level validation, configurable columns
- FK-backed persistence compatibility required

### documentation
- Every non-trivial component MUST have a `.component.md` file
- Technical docs: purpose, inputs, outputs, dependencies, states, validation rules, a11y notes, i18n, theming, reuse guidance
- User-help/business-help docs mandatory for admin screens, CRUD tools, operator-facing workflows
- All help content must be translatable

### audit
- Check: repo instructions followed, no duplicate primitives, AM3+CDK only, components complete+tested, docs present, translation-ready, theme tokens correct, a11y/responsive respected
- If duplication or architectural drift detected → stop and refactor before proceeding

---

*Auto-generated by sdd-init. Re-run `/sdd-init` to refresh.*
