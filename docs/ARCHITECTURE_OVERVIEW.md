# Architecture Overview

## Goal
Provide a scalable Angular application foundation with strong separation between app-wide concerns, shared reusable UI, and feature-specific business areas.

## Top-level structure
- `core`: application-wide concerns, singleton services, config, interceptors, global state
- `shared`: reusable UI, forms, validators, utilities, pipes, directives
- `features`: feature-specific pages, components, state, contracts, models, mapping, infrastructure, documentation
