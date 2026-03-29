---
name: auth-form-standards
description: Standardizes authentication-related forms, validation, password visibility, submit protection, and reusable progress-button behavior.
---

# Auth Form Standards Skill

Use this skill whenever implementing or modifying:
- login
- register
- forgot password
- reset password
- account access recovery flows

## Core rule

Authentication forms must use the same platform form standards as the rest of the application.
Do not create disconnected auth-only form patterns unless explicitly justified.

## Field rules

### Email
- must use the shared input field component
- required where applicable
- must validate email format
- must show translated validation messages
- must not allow submit while invalid

### Password
- must use the shared input field or shared password field pattern
- must support show/hide visibility with eye icon
- whenever a password field exists, this behavior is mandatory
- must support translated validation and helper messages

## Submit rules

- submit buttons must remain disabled until required fields are valid
- submit buttons must prevent duplicate submission
- submit actions must show embedded loading/progress feedback
- loading/progress button behavior should be reusable beyond auth flows

## UX rules

- auth forms must feel consistent with the full design system
- spacing, labels, helper text, error states, and action hierarchy must match shared platform patterns
- do not mix different input/button styles across auth screens

## Security-oriented behavior

- include frontend attempt throttling or protective behavior where appropriate
- structure the flow so backend enforcement can be added cleanly
- do not pretend frontend-only protection is sufficient
- avoid request spam through careless submit handling

## Reuse rules

Prefer shared pieces for:
- input field
- password visibility control
- async/progress button
- validation messages
- form-shell
- error presentation