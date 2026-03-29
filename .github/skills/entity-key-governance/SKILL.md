---
name: entity-key-governance
description: Governs automatic entity key generation, normalization, visibility, and editability rules for catalog entities.
---

# Entity Key Governance Skill

Use this skill for any entity that stores:
- `name`
- `key`

## Core rule

The system must assign a normalized technical key automatically from the entity name.

Example:
- Name: `En Curso`
- Key: `in_progress`

## Key requirements

- keys must always be technical identifiers
- keys must always be lowercase
- keys must always use snake_case
- keys must always be stored in English
- keys must be deterministic and stable
- keys must be unique within the entity scope

## Generation rule

The UI must derive the key automatically from the name through a shared key service.

Pipeline:
1. read the display name entered by the user
2. normalize display format if required
3. detect or infer source language when needed
4. translate or map to English
5. normalize to snake_case
6. validate uniqueness
7. persist as the entity key

## Visibility rules

- the `key` field is hidden for common users by default
- the `key` field is visible to administrators
- only administrators can manually edit the generated key
- non-admin flows must still persist the generated key even when it is hidden

## Shared implementation rules

Do not implement key generation ad hoc in feature components.

Reuse shared pieces:
- key generation service
- transliteration/normalization helper
- uniqueness validator
- role-aware field visibility rule

## Data contract recommendation

When useful, distinguish:
- `key`
- `generated_key`
- `key_generation_source`
- `is_key_manually_overridden`

If the backend contract does not support all of these yet, at minimum support:
- `key`
- deterministic auto-generation
- admin-only manual override behavior

## UX rules

- explain to admins that the key is a technical identifier
- show uniqueness and format validation when admins can edit it
- keep common users focused on business fields, not technical identifiers