---
name: loading-and-progress
description: Use this skill when implementing loading states, skeletons, spinners, blocking overlays, or progress bars to choose the correct feedback pattern and keep long-running workflows trustworthy.
---

# Loading and Progress Skill

## Purpose

This skill defines how to choose and implement loading feedback across the application.

## Rule

Use loading feedback according to operation semantics, not visual preference.

## Use loader or loading-state when

Prefer a loader, spinner, loading-state, or button-level loading state when:
- the operation is short
- the duration is unknown
- the system is fetching content
- the action is lightweight from the user's perspective
- progress cannot be meaningfully estimated

Typical examples:
- login
- save
- delete
- fetch lists
- route loading
- open form
- resend verification code
- simple search

## Use skeleton when

Prefer skeletons when:
- the final layout is known
- the user benefits from seeing the future structure
- the screen is cards, lists, dashboards, or predictable detail sections

Typical examples:
- home sections
- tournament cards
- public draw sections
- admin tables
- detail page shells

## Use progress bar when

Prefer a progress bar when:
- the workflow is long-running
- the workflow is multi-stage
- the user perceives meaningful system work
- the workflow is strategically important
- progress can be measured or reasonably simulated

Typical examples:
- tournament planner
- draw generation
- ranking recalculation
- batch imports
- bulk processing
- publish/orchestration flows

## Simulated progress

When real backend progress is unavailable:
- simulated progress is allowed
- simulated progress is recommended for flagship workflows
- it should move fast at first and slower near completion
- it should not instantly jump to 100
- it may expose stage labels

## Mandatory planner rule

The tournament planner / draw planner generator must use a progress bar.
A simple spinner is not enough.

## Accessibility

Loading and progress components must:
- expose meaningful status semantics
- include accessible labels or messages
- communicate long-running work clearly
- avoid decorative-only motion

## Component completeness

Every non-trivial shared loading/progress component must include:
- `.component.ts`
- `.component.html`
- `.component.scss`
- `.component.spec.ts`
- `.component.md`

Do not leave shared loading primitives as TypeScript-only components.