---
name: api-integration
description: Defines .NET API integration rules, HTTP behavior, interceptor usage, and data adaptation.
---

# API Integration Skill

Use this skill for anything that talks to the .NET API.

## HTTP principles
- typed requests and responses
- interceptors for cross-cutting concerns
- feature services or facades for endpoint consumption
- mappers for API-to-UI adaptation
- no direct HTTP calls in presentational components

## Mandatory cross-cutting concerns
- global loader or blocking overlay strategy
- graceful error handling
- duplicate-submit prevention
- explicit disabled state for submitting controls
- centralized environment configuration

## Architecture rules
- components never call HttpClient directly
- all HTTP flows must pass through services
- interceptors must handle global concerns

## Common Zonar Hub domains
- tournaments
- registrations
- rankings
- complexes
- courts
- players
- pairs
- draws
- live match progression
