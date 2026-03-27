---
name: multi-language
description: Defines the internationalization structure and rules for the application.
---

# Multi-Language Skill

Use this skill for user-facing copy and i18n structure.

## Supported locales
- `es`
- `en`
- `pt`

## Conventions
- organize keys by feature and screen or component purpose
- keep the same key tree across locales
- avoid string duplication when one shared key should exist
- store locale metadata centrally
- support future locales without folder restructuring

## Rules
- never hardcode user-facing text in templates
- always use translation keys
- ensure fallback behavior exists

## Example key style
- `common.actions.save`
- `common.states.loading`
- `tournaments.list.filters.category`
- `dashboard.playerRanking.lastTournament`
