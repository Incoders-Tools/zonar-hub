---
name: api-mocking
description: Use this skill when backend API endpoints, credentials, tokens, or integration configuration are incomplete or unavailable.
---

# API Mocking Skill

## Purpose

This skill defines how to implement frontend services safely when the real API is not yet available, not yet configured, or must not be called directly.

## Rule

If the API contract, credentials, tokens, base URL, or resource configuration are incomplete or unavailable:

- DO NOT block feature implementation
- DO NOT hardcode temporary endpoint calls into components
- DO NOT invent unstable production integration details
- implement a mock-first strategy

## Mandatory approach

Use a service abstraction that allows the feature to work with mock data first.

Preferred structure:

- API-facing contracts live in a dedicated data-access layer
- feature components consume services or facades only
- mock behavior must be swappable without rewriting the UI layer

## Allowed mock strategies

Use one of these strategies:

1. in-memory fake service
2. mock repository / mock gateway
3. local mock JSON mapped through a service
4. environment-based provider swap
5. injection-token-based provider swap

## Required architecture

- Components MUST NOT call HttpClient directly
- Components MUST NOT know whether data is mocked or real
- UI, orchestration, and data access remain separated
- Mock and real services must expose the same public contract

## Naming guidance

Prefer names such as:

- `PlayersService` + `MockPlayersService`
- `TournamentGateway` + `MockTournamentGateway`
- `RankingsRepository` + `MockRankingsRepository`

## Provider strategy

When possible, use environment-aware providers so the application can switch between mock and real implementations cleanly.

Examples of acceptable patterns:

- injection token + provider mapping
- interface-like abstraction through Angular service contracts
- app-level provider selection using `ApplicationConfig`

## Mock data rules

Mock data must be:

- coherent
- typed
- realistic enough for UI states
- reusable across tests and development
- easy to replace with real API responses later

Mock data must support:

- loading state
- success state
- empty state
- error state
- partial state when useful

## Temporary implementation rules

When using mocks:

- explicitly mark the implementation as mock-backed
- keep file naming clear and intentional
- do not mix real and fake network logic in the same class unless explicitly justified
- do not leak mock-only assumptions into components

## Documentation requirements

Any non-trivial mocked service or gateway must document:

- why mock mode exists
- what contract it simulates
- which future API integration should replace it
- what provider swap is expected later

## Testing expectations

Tests must validate:

- UI behavior independent of transport
- state handling with mock data
- mock service contract compatibility with expected real usage

## Reuse rule

If a mock strategy already exists in the repo, reuse it.
Do not invent a second mock pattern unless explicitly justified.