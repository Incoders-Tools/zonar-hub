---
name: translation-quality
description: Prevent unresolved translation keys, locale drift, and incomplete locale coverage.
---

# Translation Quality Skill

Use this skill whenever:
- a new screen is created
- a CRUD module is added
- shared UI copy is modified
- locale files are changed

## Goals

- never leave unresolved keys visible in the UI
- enforce the same key tree across locales
- make missing translations obvious in development
- keep translation namespaces predictable

## Required checks

- every new translation key exists in `es`, `en`, and `pt`
- labels, placeholders, tooltips, validation messages, help texts, table headers, dialogs, and empty states are translated
- no hardcoded user-facing strings remain in component code or templates
- no translation key is referenced from UI without locale entries

## Key naming convention

Use stable keys by feature and scope, for example:
- `admin.categories.page.title`
- `admin.categories.filters.name`
- `admin.categories.table.columns.level`
- `admin.categories.form.fields.name.label`
- `admin.categories.form.fields.level.label`
- `admin.categories.messages.createSuccess`

## Missing key policy

In development:
- expose an explicit missing translation marker
- do not silently degrade to unresolved raw keys