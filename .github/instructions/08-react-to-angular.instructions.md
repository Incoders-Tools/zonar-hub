---
applyTo: "src/**/*.ts,src/**/*.html,src/**/*.scss,.github/skills/react-to-angular/**/*"
---

# React to Angular Interpretation Instructions

When the user provides a React component to reproduce in Angular:
- preserve functionality, interaction model, UX states, and layout intent
- translate idiomatically to Angular, not line-by-line mechanically
- use standalone Angular components
- map props to typed `input()` or `@Input` and callbacks to outputs
- map hooks and state to Signals or appropriate Angular primitives
- replace React-specific patterns with Angular equivalents
- keep SCSS and accessibility behavior equivalent or better
- do not lose edge cases, validation, or keyboard behavior
