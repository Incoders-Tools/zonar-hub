---
applyTo: "src/**/*.spec.ts,src/**/*.ts"
---

# Testing Instructions

Testing is mandatory.

Coverage expectation:
- 100% of created components must have tests
- services, pipes, guards, interceptors, and reusable helpers must have tests

Test strategy:
- test behavior, not implementation trivia
- verify accessibility-relevant behavior when possible
- verify loading, empty, error, and success states
- verify emitted outputs and public inputs
- verify translations and theme-dependent class or token usage when logic is involved
- verify HTTP interceptor behavior for loader orchestration

Do not:
- create shallow placeholder specs with no assertions
- ignore edge cases in shared components
