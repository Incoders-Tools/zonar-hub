# Frontend-Driven Resource API Design

The backend MUST derive resource behavior from actual frontend needs and feature documentation.

## Mandatory rules

- Do not implement read-only endpoints for a resource if the frontend requires create, update, delete, activation, pagination, filtering, sorting, or detail retrieval.
- Before defining endpoints for any resource, inspect the corresponding frontend modules, services, components, and any `.md` documentation.
- Every backend resource must be designed from the real usage patterns of the frontend, while remaining reusable for future mobile and third-party clients.
- Do not stop at simple `GET` endpoints when the frontend requires a full CRUD or administrative workflow.

## Resource contract expectations

For each resource, evaluate whether the frontend requires:

- list
- detail by id
- create
- update
- delete or soft delete
- activation/deactivation
- pagination
- filtering
- sorting
- lookup/autocomplete variants
- validation rules
- authorization rules

If required, these capabilities must be exposed explicitly through the API.

## Frontend integration rules

- When a backend API is implemented, the corresponding frontend service must be updated to consume it.
- Existing mocks must be removed or isolated behind a clear fallback mechanism until the real API is fully adopted.
- Components must hydrate their state from backend responses.
- Frontend error handling must use backend error codes and messages consistently.

## Final rule

Do not design backend resources in isolation.
Always derive resource behavior from the actual frontend workflow and documentation.