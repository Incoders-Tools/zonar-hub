---
name: audit
description: Final compliance checklist to verify architectural consistency, reuse, and quality.
---

# Audit Skill

Use this skill as the final compliance checklist.

Audit for:
- repository instructions were followed
- no duplicate shared primitives were introduced
- Angular Material 3 + CDK remains the shared UI framework
- components are complete and tested
- documentation exists when required
- translation readiness is preserved
- theme tokens are used correctly
- accessibility and responsiveness are respected
- complexity is justified

## Critical rule
If duplication or architectural drift is detected:
- stop and refactor instead of proceeding
