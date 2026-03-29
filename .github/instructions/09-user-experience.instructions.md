# User Experience Instructions

These instructions are mandatory across the repository.

They define:
- when to use loaders vs progress bars
- how loading states must feel
- how long-running workflows should communicate progress
- accessibility expectations for loading and progress feedback

If any implementation conflicts with these rules, these rules take precedence.

---

## 1. Use loading feedback according to semantics, not visual preference

Choose the loading pattern based on the nature of the operation.

### Use a loader, loading-state, spinner, button-loading-state, or skeleton when:
- the operation is short
- the duration is unknown and cannot be meaningfully estimated
- the system is fetching content
- the action is lightweight from the user perspective
- the user is waiting for availability rather than for a staged workflow result

Typical examples:
- page data fetch
- dashboard load
- route-level loading
- list refresh
- login
- save
- update
- delete
- resend verification code
- opening an edit form
- simple searches

### Prefer skeletons over generic spinners when:
- the final layout is already known
- the page structure is predictable
- the user benefits from seeing the expected shape

Typical examples:
- tournament cards
- home sections
- admin tables
- detail shells
- confirmed pairs lists
- public draw sections

### Use a progress bar when:
- the workflow is long-running
- the workflow is multi-stage
- the user perceives the system as performing meaningful work
- the action is strategically important
- the workflow should feel deliberate, intelligent, and trustworthy
- progress can be measured or reasonably simulated

Typical examples:
- tournament draw planning
- zone generation
- ranking recalculation
- imports
- bulk processing
- publish/orchestration workflows

---

## 2. Simulated progress is allowed when real backend progress does not exist yet

If the workflow is important and real backend progress is unavailable, simulated staged progress is allowed and recommended.

Simulated progress should:
- move quickly at the beginning
- slow down near the end
- avoid fake instant jumps from 0 to 100
- optionally expose meaningful stage labels
- only finish when the action resolves

---

## 3. Mandatory planner rule

The tournament planner / draw planner generator MUST use a progress bar.
A simple spinner is not enough.
If no real progress source exists yet, use simulated staged progress.

---

## 4. Loading and progress accessibility

Loading and progress components must:
- expose meaningful status semantics
- provide accessible labels/messages
- avoid purely decorative motion without meaning
- communicate long-running work in a user-understandable way

---

## 5. Shared loading component completeness

Every non-trivial shared loading or progress component must include:
- `.component.ts`
- `.component.html`
- `.component.scss`
- `.component.spec.ts`
- `.component.md`

Do not leave shared loading components as TypeScript-only primitives.
Do not keep non-trivial inline styles in shared components.
Upgrade existing incomplete components in place instead of duplicating them.