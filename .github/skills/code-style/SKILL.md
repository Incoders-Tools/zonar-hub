---
name: code-style
description: Use this skill when generating or editing TypeScript, HTML, SCSS, Markdown, tests, and configuration files to preserve one consistent coding style across the repository.
---

# Code Style Skill

## Purpose

This skill defines the formatting and style consistency expected across the repository.

## Rule

All generated and edited files must follow one consistent code style.

## Mandatory principles

- prefer consistency over personal style
- match existing repository conventions when they are explicit
- do not introduce formatting drift
- do not mix multiple formatting styles in the same file or feature

## Scope

This applies to:

- TypeScript
- HTML
- SCSS
- Markdown
- test files
- configuration files when relevant

---

## TypeScript style

Prefer:

- clear naming
- small focused methods
- explicit readonly fields when appropriate
- predictable dependency injection style
- modern Angular patterns (standalone components, signals when applicable)
- no unnecessary comments
- no dead code
- no unexplained abbreviations

Avoid:

- deeply nested logic when it can be simplified
- mixing responsibilities in the same class
- leaking data-access concerns into UI components

---

## HTML style

Prefer:

- semantic structure
- clear indentation
- minimal template complexity
- translated user-facing strings only
- reusable components instead of duplicated blocks

Avoid:

- large monolithic templates
- hardcoded UI strings
- duplicated markup that should be a shared component

---

## SCSS style

Prefer:

- semantic token usage
- CSS variables and theme tokens
- shallow, readable nesting
- reusable patterns over repetition

Avoid:

- hardcoded color literals
- deep selector chains
- duplicated style blocks
- component-specific hacks that should live in shared primitives

---

## Markdown style

Prefer:

- clear section headings
- concise purpose-first documentation
- consistent bullet usage
- repository-specific wording

Avoid:

- overly verbose explanations
- generic documentation not aligned with the project

---

## Tests style

Prefer:

- behavior-focused tests
- clear naming
- consistent structure
- readable arrangement (Arrange / Act / Assert)

Tests MUST:

- use Jasmine syntax (`describe`, `it`, `expect`)
- follow Angular TestBed patterns
- avoid implementation-coupled assertions
- test real behavior, not internal details

Avoid:

- mixing Jest or Mocha syntax
- shallow placeholder tests
- duplicated setup logic
- inconsistent async handling

---

## Angular consistency rules

All generated code must:

- follow standalone component patterns
- respect feature-first architecture
- keep UI, orchestration, and data layers separated
- avoid calling HttpClient from components
- use Signals where appropriate
- align with existing Angular patterns in the repo

---

## Formatting tools

When repository formatter configuration exists, follow it strictly.

Expected repository-level standards may include:

- `.editorconfig`
- `Prettier`
- `ESLint`

Do not intentionally format against those standards.

---

## Reuse rule

If a style or structural convention already appears consistently in the repo:

- follow it
- extend it if needed
- do not introduce a second convention without justification

---

## Documentation requirements

When introducing a new reusable pattern:

- keep naming consistent
- follow existing file structure conventions
- align documentation with repository terminology

---

## Final rule

Generated code must look like it belongs to the repository without requiring manual style cleanup.