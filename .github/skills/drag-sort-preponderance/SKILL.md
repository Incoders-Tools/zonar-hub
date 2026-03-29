---
name: drag-sort-preponderance
description: Standardizes drag-and-drop ordering for system entities using sort_order and preponderance.
---

# Drag Sort and Preponderance Skill

Use this skill whenever any entity in the system supports drag-and-drop ordering.

## Core rule

All drag-and-drop reorder operations must persist ordering through:
- `sort_order`
- `preponderance` when business priority or weighted prominence is required

Do not implement visual-only reorder.

## Required behavior

- drag-and-drop must update the in-memory list immediately
- reorder must persist through the repository/API boundary
- reordered entities must remain stable after refresh
- ordering must not depend only on array index in the UI

## Data rules

- `sort_order` represents the explicit visual/order sequence
- `preponderance` represents business prominence when applicable
- if both exist, sorting precedence must be documented for the feature
- collisions must be resolved deterministically

## Implementation rules

- use Angular CDK drag-drop
- use shared reorder helpers
- do not duplicate drag-drop logic per feature
- encapsulate reorder mapping in reusable helpers or services
- support optimistic UI when appropriate
- define rollback behavior for persistence failures

## UX rules

- provide drag handle affordance
- show reorder feedback clearly
- disable drag when business rules forbid reorder
- provide translated status/toast messages after save
- preserve accessibility semantics for keyboard and screen readers

## Testing

Every drag-and-drop feature must test:
- reorder in memory
- persistence payload generation
- final sorted result
- rollback/error handling when save fails