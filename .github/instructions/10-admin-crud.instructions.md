# Admin CRUD Instructions

These instructions are mandatory for all admin management modules.

They define:
- what counts as a complete CRUD/ABM
- how forms and management screens must be built
- what actions and panels are required
- how admin navigation must be modularized
- how mock-first CRUDs must be implemented when APIs do not exist yet
- how master-detail forms and child collections must be handled in reusable form

If any implementation conflicts with these rules, these rules take precedence.

---

## 1. A CRUD/ABM is not complete unless it is truly manageable

A management module is NOT considered implemented if it is only:
- a menu item
- a route placeholder
- a plain table
- an edit-only list
- a read-only scaffold
- a screen without a real mock/API boundary

If a menu item exists for an admin entity, the corresponding working management screen must also exist.

Do not create menu-only CRUD modules.

---

## 2. Minimum required structure for every admin CRUD module

Every admin CRUD screen must include:
- page header
- help button
- primary "new" action
- filter panel
- sorting controls or sorting builder
- paginated results
- loading state
- empty state
- error state
- edit action
- delete action
- row selection
- bulk selection support where applicable
- bulk delete when deletion is a valid operation
- confirmation dialog for destructive actions

This is the default pattern unless explicitly overridden by a strong business reason.

---

## 3. Form rules for CRUD modules

CRUD forms must:
- use shared validators when applicable
- disable primary actions until technical and business rules pass
- follow shared form patterns and shells
- avoid direct data access in components
- be wired through services, facades, repositories, or equivalent boundaries

Use and extend shared primitives instead of duplicating them.

Relevant shared reusable primitives include:
- button variants
- page header
- section card or information panel
- filter panel
- form shell
- list or table shell
- empty state
- error state
- confirmation dialog
- helper dialog
- blocking loader overlay
- status badge or chips
- pagination controls

---

## 4. Mock-first CRUD rule

If the API does not exist yet:
- define typed contracts
- define repository interfaces
- implement mock repositories
- build the full CRUD against that boundary

Do not block CRUD implementation because the backend is missing.
Do not place temporary direct infrastructure logic inside the component as a substitute for repository boundaries.

---

## 5. Complexes CRUD rule

The Complexes admin module must include:
- help button
- new button
- filter panel
- sorting area inside or attached to filters
- paginated management view
- edit
- delete
- bulk selection
- bulk delete
- loading/empty/error states
- mock repository/contracts when backend is missing

It must not be implemented as a bare table.

---

## 6. Current required upgrades

At minimum, the following modules must behave as real CRUD modules, not as incomplete shells:
- Sponsors
- Complexes
- Users

If they exist in the menu, they must have complete CRUD behavior.

---

## 7. Shared table expectations

Every admin listing MUST be rendered through the shared `<zh-collection-view>`
component (selector defined in `src/app/shared/components/zh-collection-view/`).
The full contract — required inputs, default-mode rule, shared `.zh-list-card`
markup, equivalence between table and cards, testing expectations — lives in
`.github/skills/list-and-card-views/SKILL.md`. That skill is mandatory whenever
you create or refactor a list.

The shared component must support:
- pagination
- row selection
- bulk actions
- loading state
- empty state
- error state
- user-driven column reordering
- table ↔ cards toggle, persisted per page via `viewKey`

If the shared component already exists, extend it in place instead of creating
a second overlapping list solution. Do not introduce a parallel cards grid
alongside `<app-data-table>` or roll a feature-specific list wrapper.

---

## 8. Home Sections management expectations

The Home Sections admin module must support:
- drag and drop reordering
- explicit display priority/order
- visibility toggle
- per-section configuration
- item limit configuration
- carousel item count configuration when relevant

---

## 9. Admin navigation modularization

Admin navigation must be organized into groups:

### System Administration
Sysadmin-only functionality:
- Users
- Home Sections
- Audit
- Processes
- Security
- Roles
- Actions (manual + automatic)

### Catalogs
Satellite/reference entities:
- Categories
- Genders
- Cities
- Tournament Statuses
- Tournament Types
- Teaching Levels
- Player Conditions
- Social Networks
- Complex Services
- Eligibility Profiles

### Business module (Circuit Operations)
Tournament-operational features:
- Tournaments
- Registrations
- Players
- Complexes
- Sponsors
- Draw Planner
- Confirmed Pairs
- News
- Courts/scheduling assets

Navigation must feel modular and ready for future modules.

It must feel like a real homepage composition tool, not a flat table.

---

## 10. Admin navigation modularization

Admin navigation must be grouped and modular.

### System Administration
Must contain:
- Users
- Home Sections
- Audit
- Processes
- Security
- Roles
- Actions

The Actions entry should include:
- manual actions
- automatic actions

### Catalogs
Satellite/reference entities must be grouped under Catalogs rather than mixed into top-level navigation.

Examples:
- Categories
- Genders
- Cities
- Tournament Statuses
- Tournament Types
- Teaching Levels
- Player Conditions
- Social Networks
- Complex Services
- Eligibility Profiles

### Business modules
Navigation must reflect business modules, not only raw tables.

The first major module should group the tournament planning / operational domain and include the entities and screens that belong together operationally.

---

## 11. Completeness rule for shared and reusable admin components

Whenever a non-trivial reusable admin primitive is created or refactored, it must include:
- `.component.ts`
- `.component.html`
- `.component.scss`
- `.component.spec.ts`
- `.component.md`

Do not leave reusable admin primitives half-built.

---

## 12. Catalogs and composition ordering rule

If an admin entity is orderable:
- use shared drag-and-drop behavior
- persist through `sort_order`
- use `preponderance` when the entity also requires weighted business prominence
- do not create feature-specific reorder conventions

---

## 13. Master-detail CRUD rule

If an admin form includes:
- a header plus editable items
- a parent entity with one or more child collections
- one-to-many related rows edited inside the same workflow
- tabs with child entities
- FK-backed detail rows
- nested orderable items

then the implementation MUST default to the shared master-detail child-collection pattern.

Do not create a one-off child table component for each feature when the interaction model is equivalent.

The reusable shared pattern must support:
- integration with Reactive Forms
- `FormArray` or equivalent reusable adapter strategy
- add row
- remove row
- drag and drop
- reorder
- configurable columns
- row validation
- translated labels and helper text
- optional tabbed mode when multiple child collections exist
- optional collapsible mode
- optional collapse-all / expand-all controls when the UX requires grouped child rows

The parent page/form should own:
- aggregate loading
- aggregate save
- orchestration across tabs/collections
- repository/service interaction

The shared child-collection component should own:
- row rendering
- row interactions
- child collection editing UX
- reorder behavior
- child-level validation display

---

## 14. Date-range safety rule for CRUDs and filters

Whenever an admin screen contains date ranges such as:
- `start_date` / `end_date`
- `from` / `to`
- tournament ranges
- validity windows
- scheduling ranges

the implementation must include all of the following:
- UI-level prevention of invalid ranges where possible
- cross-field validation in Reactive Forms
- disabled primary action while invalid
- translated validation/error messaging
- consistent behavior in create and edit mode
- reusable shared validation logic instead of feature-local duplication

This applies to:
- create forms
- edit forms
- filter panels
- search panels
- scheduling-related flows

---

## 15. Reuse-first correction rule

If an existing feature is partially broken but already points toward a reusable pattern:
- do not patch it with an ad-hoc local fix first
- stabilize it by moving the repeated behavior into the appropriate shared primitive
- then refactor the feature to consume that shared primitive

Broken local implementations are not a valid excuse to bypass shared architecture.