---
name: multi-language
description: Defines the internationalization structure and rules for the application.
---

# Multi-Language Skill

Use this skill for user-facing copy and i18n structure.

## Locale source of truth

Supported locales are defined in:
- `src/app/core/i18n/i18n.types.ts`

Use `AppLocale` as the canonical source of truth for locale coverage.

## Translation source of truth

Translations are stored in:
- `src/app/core/i18n/i18n.translations.ts`

## Conventions

- organize keys by feature and screen or component purpose
- keep the same key tree across all locales defined by `AppLocale`
- avoid string duplication when one shared key should exist
- store locale metadata centrally in `i18n.types.ts`
- store translations centrally in `i18n.translations.ts`
- support future locales without folder restructuring

## Rules

- never hardcode user-facing text in templates
- always use translation keys
- whenever a new key is introduced, update `i18n.translations.ts` in the same task
- ensure every locale defined by `AppLocale` receives the same new key
- ensure fallback behavior exists

## Example key style

- `common.actions.save`
- `common.states.loading`
- `tournaments.list.filters.category`
- `dashboard.playerRanking.lastTournament`
