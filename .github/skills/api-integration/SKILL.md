---
name: api-integration
description: Defines frontend-to-backend API integration rules, HTTP behavior, interceptor usage, and data adaptation.
---

# API Integration Skill

Use this skill for any task that integrates a frontend client with a backend API.

## HTTP principles

- use typed requests and responses
- use interceptors/middleware for cross-cutting concerns
- use feature services, API clients, facades, or gateways for endpoint consumption
- use mappers/adapters for API-to-UI adaptation
- avoid direct HTTP calls in presentational components
- keep API contracts explicit and documented

## Mandatory cross-cutting concerns

- global loader or blocking overlay strategy
- graceful error handling
- duplicate-submit prevention
- explicit disabled state for submitting controls
- centralized environment configuration
- authentication/authorization handling when applicable
- retry/timeout/cancellation behavior when applicable

## Architecture rules

- components must not call HTTP clients directly
- HTTP flows must pass through services, clients, facades, gateways, or adapters
- interceptors/middleware must handle global concerns
- UI models and API DTOs should be separated when their shapes differ
- avoid leaking backend persistence details into frontend contracts
- avoid hardcoding API URLs, secrets, tokens, or environment-specific values

## Contract rules

- inspect backend API contracts before integrating
- prefer OpenAPI or documented endpoint contracts
- keep request/response models typed
- preserve backward compatibility when possible
- coordinate frontend and backend changes when contracts change