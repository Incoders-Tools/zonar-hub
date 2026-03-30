---
applyTo: "src/**/*.ts,src/**/*.html,src/**/*.scss,src/**/*.json,.github/skills/**/*,.github/agents/**/*"
---

# Translation Quality Instructions

These instructions are mandatory for all user-facing UI work.

## Core rule

User-facing text must never be rendered as unresolved translation keys.

Examples of invalid UI output:
- `home.upcomingTournaments`
- `home.section.nextTournaments`
- `home.section.confirmedPairs`

## Repository source of truth

Locales are defined in:
- `src/app/core/i18n/i18n.types.ts`

Translations are defined in:
- `src/app/core/i18n/i18n.translations.ts`

`AppLocale` is the source of truth for which locales must be covered.

## Required behavior

- Never ship a screen that displays raw translation keys to end users.
- Missing translation keys must fail visibly during development.
- Missing translation keys must be traceable and easy to audit.
- Shared components must not silently swallow missing translations.
- Any new translation key must be added to `i18n.translations.ts` in the same task.
- Every key used in UI must exist for every locale defined by `AppLocale`.

## Development-time enforcement

When implementing or modifying user-facing UI:
- verify that every used translation key exists in the translation source of truth
- verify that every used translation key exists for all locales defined by `AppLocale`
- verify that the same key tree exists across all locales
- do not introduce locale drift
- do not leave placeholder keys in templates

## Fallback policy

Allowed fallback order:
1. current locale
2. default locale configured by the application
3. explicit visible development marker for missing translation

Do not render the raw unresolved key as if it were valid copy.

## CRUD/i18n convention

Admin CRUD modules must define translation keys for:
- page title
- page subtitle
- help content
- filters
- columns
- form labels
- placeholders
- validation messages
- success messages
- delete confirmations
- empty states
- bulk actions
- active/inactive states

## Validation rule

If a new screen or feature introduces user-facing strings and no translation entries are created in `src/app/core/i18n/i18n.translations.ts` for all locales defined by `AppLocale`, the work is incomplete.
