---
name: search-and-selection
description: Use this skill when building autocomplete, async search, multiselect, selection lists, filter search, and reusable query-driven input components.
---

# Search and Selection Skill

## Purpose

This skill defines how search-driven and selection-driven components must be built and reused.

## Rule

Search and selection patterns must be centralized and reusable.

## Covered components

This skill applies to patterns such as:

- autocomplete
- async search field
- remote lookup input
- multiselect
- entity selector
- chip-based selection
- searchable filter controls

## Mandatory principles

- reuse before create
- prefer one canonical pattern per problem type
- do not create multiple unrelated search components for the same use case
- separate UI from data access
- make remote search behavior configurable, not duplicated

## Async search rules

When search goes against backend data:

- debounce requests when appropriate
- handle loading state
- handle empty results
- handle error state
- avoid duplicate requests
- keep HttpClient out of components
- use services or gateways only

## Multiselect rules

Shared multiselect patterns should support when relevant:

- translated labels
- clear selected-state rendering
- search within options
- clear selection action
- disabled state
- empty state

## Reuse rules

Before creating a new search or selection component:

1. check whether an existing primitive already solves the problem
2. reuse it
3. extend it only if needed
4. never create a second equivalent component unless explicitly justified

## Table and filter integration

Search and selection components must align with the shared filter-panel and shared data-table patterns.

Avoid isolated mini-filter systems inside each feature.

## i18n rules

- no hardcoded labels
- no hardcoded placeholders
- no hardcoded empty-state messages
- all user-facing strings must use translation keys

## Theming rules

- no hardcoded colors
- use semantic tokens only

## Documentation requirements

Reusable search or selection components must document:

- purpose
- data source expectations
- loading and empty states
- configuration inputs
- selected value model
- reuse guidance

## Testing expectations

Tests should cover:

- loading behavior
- empty behavior
- error behavior
- selection behavior
- multiselect state handling when applicable
- no transport logic inside components