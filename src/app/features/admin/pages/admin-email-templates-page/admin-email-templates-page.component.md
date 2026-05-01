# Admin Email Templates Page

## Purpose

This page lets system administrators manage outbound email templates used by authentication and invitation flows.

## Business Context

The API stores templates in a dedicated `email_templates` system table. The page exposes controlled editing for subject, HTML body, and activation state.

## Inputs And Outputs

- Inputs: data loaded from `GET /api/admin/email-templates`
- Outputs: updates through `PUT /api/admin/email-templates/{id}`

## Dependencies

- `EmailTemplatesFacadeService` for orchestration and state
- `ApiEmailTemplateRepository` for HTTP access
- Shared UI primitives:
  - `app-filter-panel`
  - `app-data-table`
  - `app-form-shell`
  - `app-async-button`
  - `app-help-button`

## States

- Loading: table loading state while templates are fetched
- Empty: no templates available
- Error: repository error displayed via table error state
- Success: templates rendered and editable

## Accessibility Notes

- Uses labeled form controls with explicit `for`/`id`
- Keeps edit action keyboard accessible via table row actions

## Translation Notes

All visible strings use translation keys under `admin.email-templates.*` and are implemented for `es`, `en`, and `pt`.

## Theming Notes

Styles only use semantic tokens (`--zh-*`) and remain theme agnostic.

## Test Expectations

- Component creation and editor flow
- Facade load/filter/update behavior

## Reuse Guidance

Use this page pattern when editing system-owned templated content where records are seeded from backend migrations and updated in-place.
