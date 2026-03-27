---
applyTo: "src/**/*.ts"
---

# Data Access and API Integration Instructions

Zonar Hub consumes a .NET API over HTTP.

Use this layering:
- interceptor(s) for cross-cutting HTTP concerns
- feature API service or gateway for endpoint calls
- mapper for API contract to UI model transformation when needed
- page or container for orchestration

Rules:
- Keep HTTP details out of presentational components.
- Use typed request and response models.
- Centralize base URL and environment configuration.
- Handle loading, server errors, empty responses, and retries deliberately.
- The global loader interceptor must block concurrent malicious or accidental repeated user actions where the UX requires it.
- Prefer idempotent UI handling and explicit disabled states on submit actions.
