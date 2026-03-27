---
name: testing
description: Defines testing rules and coverage expectations for components, services, and UI flows.
---

# Testing Skill

Use this skill for every new component, service, interceptor, guard, and reusable helper.

## Coverage rule
Every created component must include a `.spec.ts`.

## What to test
- rendering and key states
- input and output behavior
- emitted events
- validation states
- button disabled or loading behavior
- error and empty states
- interceptor behavior when relevant

## Anti-patterns
- empty tests
- snapshot-only tests
- testing implementation instead of behavior

## Rule
No component is complete without tests.
