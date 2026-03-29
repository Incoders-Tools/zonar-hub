---
applyTo: "src/**/*,.github/skills/**/*,.github/agents/**/*,docs/architecture/**/*"
---

# Catalog Governance Instructions

These instructions are mandatory for all catalog/reference entities.

## Required default fields

All catalog entities must support at minimum:
- `name`
- `key`
- `is_active`

When ordering applies, also support:
- `sort_order`

When business prominence applies, also support:
- `preponderance`

## Name rules

- `name` is user-facing
- `name` must be normalized according to entity rules
- unless stated otherwise, display names should use sentence-style normalization or repository-defined title normalization

## Key rules

- `key` must be generated automatically by the system
- `key` must be stored in English
- `key` must use snake_case
- `key` is hidden for non-admin users by default
- `key` is editable only for administrators

## Active state rules

- all catalog forms must include `is_active`
- all consumers of catalog entities must filter active records by default
- inactive records must only appear when a screen explicitly enables "show inactive"
- the decision to expose inactive records belongs to product/design/development governance, not random feature implementation

## Reuse rules

Do not implement:
- one-off `is_active` filtering
- one-off key generators
- one-off catalog field visibility logic

These behaviors must be shared and reusable.