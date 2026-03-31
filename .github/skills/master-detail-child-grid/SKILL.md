---
name: master-detail-child-grid
description: Use this skill when implementing reusable parent-form + child-collection patterns, editable subtables, tabbed child collections, collapsible child groups, and reorderable detail rows.
---

# Master Detail Child Grid Skill

## Purpose

This skill standardizes how the system implements reusable editable child collections inside parent forms.

It applies to scenarios such as:
- sales with product lines
- purchases with detail rows
- orders with items
- tournaments with complexes and related courts
- any header-detail admin workflow
- any one-to-many editable collection embedded in a form

## Core rule

When the behavior is equivalent, build or extend one shared reusable child-collection primitive instead of creating one component per feature.

Do not create:
- `tournament-items-table` only for tournaments
- `sale-items-table` only for sales
- `purchase-items-table` only for purchases

unless the interaction model is truly different.

## Expected architecture

Prefer this separation:

- parent feature/page/form
  - owns aggregate loading
  - owns aggregate save
  - owns orchestration and dependencies
  - maps feature data to the shared child-collection API

- shared child-collection component
  - owns row rendering
  - owns row actions
  - owns row-level validation display
  - owns reorder UX
  - emits collection changes/events

## Form integration

The pattern must support:
- Reactive Forms
- `FormArray`
- typed row factories where appropriate
- create/edit modes
- patching existing values
- item insertion and deletion
- deterministic ordering

## Reorder and drag-drop

When order matters:
- use Angular CDK drag-drop
- update the collection in memory immediately
- keep `sort_order` aligned
- integrate with shared reorder helpers when available
- avoid feature-local drag-drop reinvention

## Tabs and multiple child collections

If a parent entity has multiple child collections:
- support tabbed rendering
- keep each collection isolated but consistent
- preserve parent save orchestration
- do not create unrelated UX patterns for each tab if the shared primitive can support configuration

## Collapsible behavior

If the user asks for collapsible child sections:
- support section-level collapse
- support collapse-all / expand-all when the page contains multiple groups
- preserve accessibility semantics and keyboard usability
- keep state handling explicit and testable

## Validation

The shared pattern must support:
- row-level required validation
- collection-level validation when applicable
- translated helper and error messages
- date-range validation when child rows contain semantic date fields
- disabled primary actions when aggregate business rules are not satisfied

## i18n and theming

- no hardcoded user-facing strings
- all visible copy must use translation keys
- no hardcoded colors
- state and density must use repository design tokens

## Documentation expectations

Any non-trivial shared child-collection component must document:
- supported modes
- row contract expectations
- integration approach with parent forms
- ordering model
- validation model
- collapse behavior
- reuse guidance

## Testing expectations

Tests must cover:
- rendering
- add/remove row interactions
- reorder interactions
- collapse behavior when enabled
- emitted collection changes
- validation behavior
- disabled-state behavior when applicable