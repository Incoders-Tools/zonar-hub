---
name: notifications-and-feedback
description: Use this skill when implementing save, update, delete, success, warning, info, or error feedback for user actions.
---

# Notifications and Feedback Skill

## Purpose

This skill defines how user feedback must be delivered across the application.

## Rule

The application must use a centralized and reusable notification pattern.

## Mandatory principles

- Use one shared notification system
- Use one shared destructive confirmation pattern
- Do not invent ad-hoc toast or alert implementations per feature

## Standard feedback channels

Preferred feedback primitives:

- toast / snackbar for transient feedback
- confirm-dialog for destructive confirmation
- inline validation or helper text for field-level guidance
- loader-overlay for blocking async workflows when justified

## Toast / snackbar rules

Use a shared toast or snackbar primitive for:

- save success
- update success
- delete success
- non-blocking warnings
- transient informational messages
- recoverable async errors when inline rendering is not enough

Toast content must be:

- short
- clear
- translatable
- consistent with severity

## Destructive action rules

Every destructive delete action in any CRUD workflow MUST:

- use the shared confirm-dialog
- explicitly offer confirm and cancel
- explain what is being deleted when needed
- never execute immediately without confirmation unless explicitly justified

## Severity model

Support a small consistent severity model such as:

- success
- info
- warning
- error

Do not create multiple overlapping feedback taxonomies.

## Reuse rule

Before creating any notification or confirmation UI:

1. check whether shared toast or confirm-dialog already exists
2. reuse it
3. extend only if required
4. never create parallel variants without explicit justification

## i18n rules

- no hardcoded user-facing notification strings
- confirmation titles, descriptions, buttons, and severity labels must use translation keys

## Theming rules

- no hardcoded colors
- severity visuals must use semantic tokens

## Documentation requirements

Shared notification primitives must document:

- supported variants
- inputs
- expected triggers
- action patterns
- accessibility considerations
- reuse guidance

## Testing expectations

Tests should cover:

- correct message rendering
- correct severity rendering
- destructive confirmation flow
- callback execution only after confirm
- no execution on cancel