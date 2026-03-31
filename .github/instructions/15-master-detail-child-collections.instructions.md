---
applyTo: "src/app/features/**/*.ts,src/app/features/**/*.html,src/app/shared/**/*.ts,src/app/shared/**/*.html"
---

# Master-Detail Child Collections Instructions

These instructions are mandatory whenever a feature requires a parent form with one or more editable child collections.

## When this instruction applies

Apply this instruction when the user requests or the feature implies:
- header + detail items
- parent + child rows
- nested editable collections
- subtable inside a form
- child rows under tabs
- one-to-many editable relationships
- FK-backed related rows edited in the same screen
- reorderable child items
- grouped/collapsible child items

## Primary rule

Do not create a feature-specific child-table implementation by default.

If the requested behavior matches the shared interaction model, implement or extend a shared reusable child-collection component instead.

## Required reusable capabilities

The shared pattern must support:
- Angular Reactive Forms compatibility
- `FormArray` integration or equivalent reusable adapter
- configurable column definitions
- add row
- remove row
- row editing
- row validation
- drag-and-drop reorder using Angular CDK
- persistence-ready sort mapping
- optional tabbed mode for multiple child collections
- optional collapsible groups
- optional collapse-all / expand-all behavior
- translated labels, helper text, validation messages, empty states, and action copy

## Ownership boundaries

Parent page/form responsibilities:
- load aggregate data
- orchestrate parent and child dependencies
- save the aggregate
- coordinate tabs/sections
- call facade/service/repository boundaries

Shared child-collection responsibilities:
- render child rows
- manage row UX
- expose row-level interactions
- emit collection changes
- handle drag/reorder interactions
- display child validation state

## Reuse-first rule

Before creating or extending a child-collection UI:
1. inspect whether a shared primitive already exists
2. reuse it if possible
3. extend it if necessary
4. do not duplicate row management logic per feature

## Date-range interaction rule

If any child row includes a semantic date range:
- apply shared reusable date-range validation
- block invalid combinations at row level and aggregate submit level
- keep validation messages translated and consistent

## Persistence rule

When child rows represent relational persistence:
- preserve FK semantics
- preserve deterministic order through `sort_order` when ordering applies
- avoid view-only array ordering as the source of truth

## Documentation rule

Every non-trivial shared child-collection component must include:
- `.component.ts`
- `.component.html`
- `.component.scss`
- `.component.spec.ts`
- `.component.md`

The markdown must document:
- purpose
- inputs
- outputs
- supported modes
- row model expectations
- validation expectations
- accessibility notes
- i18n notes
- reuse guidance