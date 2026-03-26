# Project Rules

## Project summary
Describe the business purpose and major user roles.

## Angular baseline
- standalone components
- feature-first structure
- shared components in `src/app/shared`
- global cross-cutting concerns in `src/app/core`
- route areas in `src/app/features`

## Component documentation policy
Technical component documentation lives next to the component as:
- `*.component.doc.md`

User-facing help content lives under the feature documentation area by language:
- `documentation/help/es/...`
- `documentation/help/en/...`
- `documentation/help/pt/...`
