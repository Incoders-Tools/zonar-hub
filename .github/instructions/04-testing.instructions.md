---
applyTo: "src/**/*.spec.ts,src/**/*.ts"
---

# Testing Instructions

Testing is mandatory.

## Test environment (ENFORCED)

- The repository uses **Jasmine** as the test framework
- Tests must be compatible with Angular testing utilities

Do NOT:
- use Jest
- use Mocha
- mix testing frameworks
- introduce alternative runners unless explicitly defined at repository level

## Coverage expectations

- 100% of created components MUST have tests
- services, pipes, guards, interceptors, and reusable helpers MUST have tests
- shared UI primitives MUST have comprehensive tests

## Test strategy

Focus on behavior, not implementation details.

Tests MUST verify:

- rendering correctness
- loading, empty, error, and success states
- user interactions
- emitted outputs
- public inputs
- conditional rendering logic
- accessibility-relevant behavior when applicable
- translation usage when logic depends on it
- theme-dependent class or token behavior when logic is involved

## Angular-specific rules

- use Angular TestBed properly
- prefer standalone component testing patterns
- avoid over-mocking Angular internals
- test Signals-based state when applicable
- avoid relying on private component state

## API and data rules

- components MUST NOT call HttpClient directly (validate via test behavior)
- test services independently from components
- when API is not available, use mock services consistent with the api-mocking skill
- mock data must reflect real scenarios (not trivial placeholders)

## Form and validation rules

Tests MUST verify:

- validation rules
- disabled state of primary actions
- enabling conditions based on both technical and business rules
- helper/help behavior when rules affect user interaction

## UI system rules

For shared UI components:

- test all supported states
- test reuse scenarios when relevant
- test interaction contracts (inputs/outputs)
- avoid duplicating logic across tests

## Notifications and destructive actions

Tests MUST verify:

- success, error, and informational feedback behavior
- destructive actions only execute after confirmation
- no execution happens when user cancels
- confirm-dialog integration for delete flows

## i18n rules

- do not assert hardcoded strings
- prefer asserting presence of rendered content or behavior
- ensure components do not break when locale changes

## Theming rules

- do not assert specific colors
- assert semantic behavior (class usage, token usage, state changes)
- ensure components do not depend on hardcoded styling

## Code style for tests

- clear test naming
- readable structure
- no unnecessary setup duplication
- no dead assertions
- no commented-out tests

## Do not

- create shallow placeholder specs with no assertions
- assert implementation details instead of behavior
- duplicate test patterns unnecessarily
- introduce inconsistent test styles
- bypass shared mocks or test utilities when they exist

## Final rule

Tests must reflect real usage scenarios and validate that the component or service behaves correctly within the repository architecture.