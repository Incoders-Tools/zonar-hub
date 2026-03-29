---
name: admin-crud
description: Use this skill when creating or refactoring admin management screens so every CRUD module is complete, reusable, mock-first, and consistent with the repository's management patterns.
---

# Admin CRUD Skill

## Purpose

This skill defines the mandatory structure and quality level for admin CRUD modules.

## Rule

A CRUD/ABM is not considered implemented unless it is fully manageable.

## A complete CRUD module must include

### Page shell
- page header
- help button
- primary "new" action
- real route-backed screen

### Discovery and control
- filter panel
- sorting controls or sorting builder
- paginated list, table, or card view
- loading state
- empty state
- error state

### Record actions
- edit action
- delete action
- row selection
- bulk selection when applicable
- bulk delete when applicable
- confirmation dialog for destructive actions

### Data boundary
- typed contracts
- repository interface
- mock repository if API does not exist yet
- no direct data access in the component

### Forms
- shared validators when applicable
- disabled primary actions until technical and business rules pass
- shared form shell/patterns when available

## Forbidden outcomes
- menu item without a real CRUD screen
- plain table without management actions
- edit-only table
- screen without filter/sort/pagination pattern where management is expected
- direct API/infrastructure logic in components
- backend-missing excuse for not building the screen

## Shared reusable primitives to reuse first
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

## Special cases required now

At minimum, the following modules must behave as complete CRUDs if they exist in admin navigation:
- Sponsors
- Complexes
- Users

## Table expectations

Shared admin tables should support:
- pagination
- row selection
- bulk actions
- empty/loading/error states
- column reordering when the shared table supports advanced management features

## Home Sections rule

Home Sections management should support:
- drag and drop reordering
- explicit display priority/order
- visibility toggle
- per-section configuration
- item limit configuration
- carousel item count configuration when relevant

## Catalog activation rule

For catalog entities:
- include `is_active` in forms
- show active status in lists
- filter by active records by default in consumer flows
- only expose inactive records when explicitly requested by the screen requirements