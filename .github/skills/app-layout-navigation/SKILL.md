---
name: app-layout-navigation
description: Use this skill when creating or modifying app shell, sidebar, top navigation, mobile navigation, route groups, or reusable navigation structures.
---

# App Layout Navigation Skill

## Purpose

This skill defines the standard layout and navigation model for the application.

## Rule

The application must use a modern, reusable, responsive navigation shell.

## Mandatory layout principles

- Prefer one shared app shell
- Prefer one navigation system
- Reuse before create
- Avoid multiple unrelated navbar patterns
- Avoid multiple unrelated sidebar patterns

## Default application shell

Preferred structure:

- top-level app shell
- sidebar for desktop
- drawer or collapsible navigation for mobile
- content area separated from navigation chrome
- support for nested navigation items when needed

## Required behavior

Navigation must support:

- primary sections
- optional subitems
- active route indication
- collapse / expand behavior
- user-controlled visibility when appropriate
- responsive adaptation for desktop and mobile

## Desktop and mobile guidance

Desktop:

- prefer persistent sidebar when screen size allows
- allow collapse to a compact state when justified

Mobile:

- prefer drawer or overlay navigation
- do not force desktop sidebar behavior into mobile layouts

## Reuse rules

Before creating any new navigation structure:

1. check whether a shared shell already exists
2. reuse existing layout primitives
3. extend shared navigation config if necessary
4. never duplicate shell behavior without justification

## Routing guidance

Navigation must reflect route structure clearly.

Prefer:

- route-driven menu configuration
- explicit labels through translation keys
- icon metadata where needed
- role-aware visibility only when business rules require it

## Accessibility rules

Navigation must be:

- keyboard accessible
- screen-reader understandable
- clear in active state
- clear in collapsed state
- usable in mobile and desktop contexts

## i18n rules

- no hardcoded user-facing navigation labels
- all labels must use translation keys
- tooltips and collapsed labels must also be translatable

## Theming rules

- no hardcoded colors
- use semantic design tokens only
- navigation chrome must remain theme-compatible

## State rules

Navigation state must be centralized and intentional.

Examples of acceptable state:

- sidebar expanded or collapsed
- mobile drawer open or closed
- selected group expanded or collapsed

Do not scatter navigation state randomly across unrelated components.

## Documentation requirements

Any shared shell or navigation primitive must document:

- purpose
- layout zones
- desktop behavior
- mobile behavior
- state model
- reuse guidance

## Testing expectations

Tests should cover:

- route visibility
- active state
- collapse and expand behavior
- responsive conditional rendering when relevant
- accessibility-critical interactions