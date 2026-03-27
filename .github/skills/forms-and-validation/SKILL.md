---
name: forms-and-validation
description: Use this skill when building forms, validators, field rules, helper texts, placeholders, tooltips, and input-state behavior.
---

# Forms and Validation Skill

## Purpose

This skill defines how forms, validators, placeholders, tooltips, and field-level UX must be implemented consistently.

## Rule

All forms must follow one reusable validation and field-behavior strategy.

## Mandatory form rules

- use Reactive Forms
- use shared validators when applicable
- reuse shared input patterns before creating new ones
- primary actions must remain disabled until technical validation and business prerequisites are satisfied
- use contextual helper guidance where rules may confuse the user

## Shared validators

Common validators must be centralized and reusable.

Examples:

- email
- phone
- URL
- required trimmed text
- min/max length
- document ID patterns when applicable
- numeric constraints when applicable

Do not duplicate regex rules across multiple features.

## Validator structure

Prefer centralized validators under a shared validation area.

Examples of acceptable organization:

- `shared/validators`
- `core/validation`
- feature-level validators only when truly feature-specific

## Validation messaging

Validation messages must be:

- translatable
- consistent
- reusable
- mapped intentionally to validator failures

## Placeholders, hints, and tooltips

Placeholders, field hints, and tooltips must be intentional and reusable.

Rules:

- do not hardcode them repeatedly across forms
- prefer translated keys
- prefer shared wording patterns
- use tooltip only when inline helper text is insufficient
- use helper text when business rules affect behavior
- explain disabled actions when needed

## Business-help requirement

For admin screens, CRUD tools, dashboard forms, and operator-facing workflows:

- explain prerequisites
- explain side effects
- explain why a button may remain disabled
- use helper/help patterns consistently

## Async and submit rules

Forms must support:

- loading
- submitting
- success
- error

Avoid duplicate submissions.
Use shared async-button behavior where applicable.

## Input reuse rules

Before creating any new field wrapper, autocomplete, select, multiselect, search input, or textarea pattern:

1. check if one already exists
2. reuse it
3. extend it if needed
4. never duplicate field behavior without justification

## i18n rules

- no hardcoded user-facing labels
- no hardcoded placeholders
- no hardcoded helper texts
- all visible field text must use translation keys

## Theming rules

- no hardcoded colors
- state styles must use semantic tokens

## Documentation requirements

Non-trivial form components must document:

- field purpose
- validation rules
- business prerequisites
- disabled-action behavior
- helper/help behavior
- reuse guidance

## Testing expectations

Tests should cover:

- validators
- disabled state behavior
- submit enablement rules
- helper rendering when applicable
- translated messaging behavior where relevant