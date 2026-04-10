# Multi-Instance Scalability Architecture

## Overview

Zonar Hub supports multi-tenant operation where each organization (club, circuit operator) operates in an isolated context while sharing the same frontend deployment. This document describes the scalability model, tenant isolation, and infrastructure considerations.

---

## Tenant Isolation Model

### Frontend Isolation

- **TenantContextService** (`core/services/tenant-context.service.ts`) is the single source of truth for tenant state.
- Tenant data is derived reactively from the authenticated session via Angular signals.
- All tenant-scoped UI behavior reads from computed signals: `tenantId`, `tenantName`, `planType`, `isActive`.
- No global mutable state is shared between tenants; switching tenants requires re-authentication.

### API Isolation

- **tenantHeaderInterceptor** (`core/auth/tenant-header.interceptor.ts`) injects `X-Tenant-Id` into every outbound HTTP request.
- The backend API uses this header to scope data access, query filters, and authorization checks.
- The frontend never constructs tenant-scoped URLs manually; header-based routing is enforced at the interceptor layer.

### Data Isolation

| Plan       | Database Strategy           | Notes                                  |
|------------|-----------------------------|----------------------------------------|
| Starter    | Shared database, row-level  | Tenant ID column on every table        |
| Pro        | Shared database, row-level  | Same as Starter with expanded limits   |
| Enterprise | Dedicated database instance | Full physical isolation per tenant      |
| Single Use | Shared database, row-level  | Limited lifespan, scoped to one event  |

---

## Plan-Based Feature Gating

The `planType` signal drives UI-level feature visibility:

| Capability            | Starter | Pro | Enterprise | Single Use |
|-----------------------|---------|-----|------------|------------|
| Tournaments           | 2       | 20  | Unlimited  | 1          |
| Administrators        | 1       | 5   | 50         | 1          |
| Complexes             | 1       | ∞   | ∞          | 1          |
| Draw Planner          | ✗       | ✓   | ✓          | ✗          |
| Advanced Analytics    | ✗       | ✓   | ✓          | ✗          |
| Dedicated Server      | ✗       | ✗   | ✓          | ✗          |
| Dedicated Database    | ✗       | ✗   | ✓          | ✗          |
| Dedicated AI          | ✗       | ✗   | ✓          | ✗          |
| SLA                   | ✗       | ✗   | ✓          | ✗          |
| Custom Branding       | ✗       | ✗   | ✓          | ✗          |

Feature gating is enforced via computed signals in `TenantContextService` (`isEnterprise`, `isSingleUse`, `isTrial`, `hasDedicatedServer`, etc.) and consumed by components for conditional rendering.

---

## Horizontal Scaling Strategy

### Frontend

- The Angular SPA is a static bundle served from a CDN.
- No server-side tenant state exists in the frontend layer.
- All tenant context flows through the authenticated JWT and the `X-Tenant-Id` header.
- Scaling the frontend means scaling CDN edge nodes — no per-tenant frontend instances.

### Backend (.NET API)

- Stateless API instances behind a load balancer.
- Tenant resolution happens at the middleware layer via `X-Tenant-Id` header.
- Connection strings can be resolved dynamically per tenant for Enterprise plans.
- Shared tenants (Starter, Pro, Single Use) share a connection pool with row-level filtering.

### Database

- Shared tenants: single database with `tenant_id` column indexing.
- Enterprise tenants: dedicated database instance provisioned on upgrade.
- Migration system must support both shared and dedicated schemas.

---

## Scaling Boundaries

| Dimension              | Limit (Shared)              | Limit (Enterprise)   |
|------------------------|-----------------------------|----------------------|
| Concurrent sessions    | Per-plan rate limiting       | SLA-defined          |
| API requests/minute    | Throttled per tenant         | Dedicated capacity   |
| Storage                | Shared quota                 | Dedicated volumes    |
| Background jobs        | Shared job queue             | Dedicated workers    |
| WebSocket connections  | Pooled                       | Dedicated channels   |

---

## Instance Deployment Topology

```
┌─────────────────────────────────────────────┐
│                  CDN / Edge                  │
│         (Static Angular SPA Bundle)         │
└───────────────────┬─────────────────────────┘
                    │
          ┌─────────▼──────────┐
          │   Load Balancer    │
          └─────────┬──────────┘
                    │
     ┌──────────────┼──────────────┐
     │              │              │
┌────▼────┐   ┌────▼────┐   ┌────▼────┐
│ API #1  │   │ API #2  │   │ API #N  │
│ (.NET)  │   │ (.NET)  │   │ (.NET)  │
└────┬────┘   └────┬────┘   └────┬────┘
     │              │              │
     └──────────────┼──────────────┘
                    │
     ┌──────────────┼──────────────┐
     │              │              │
┌────▼────┐   ┌────▼────┐   ┌────▼────┐
│ Shared  │   │ Shared  │   │ Dedicated│
│ DB Pool │   │ Cache   │   │ DB (Ent) │
└─────────┘   └─────────┘   └──────────┘
```

---

## Trial and Onboarding Flow

1. New organization signs up → assigned `starter` plan with trial period.
2. **Admin onboarding wizard** (`/admin/onboarding`) guides initial setup: complex, courts, sport, first tournament.
3. Trial countdown is tracked in `TenantContextService` and surfaced on the **billing page** (`/admin/billing`).
4. On trial expiry, the tenant enters a grace period (read-only) before suspension.
5. Upgrade triggers plan migration; Enterprise upgrades provision dedicated infrastructure.

---

## Security Considerations

- Tenant ID is never trusted from the client alone; the backend validates it against the authenticated JWT claims.
- The `X-Tenant-Id` header is a routing hint; authorization is enforced server-side.
- Cross-tenant data access is prevented at the query layer (shared) or connection layer (dedicated).
- Admin users can only operate within their assigned tenant; super-admin roles have explicit cross-tenant permissions.

---

## Future Considerations

- **Tenant provisioning API**: Automate Enterprise database creation on plan upgrade.
- **Tenant-scoped feature flags**: Allow per-tenant beta features without plan changes.
- **Multi-region deployment**: CDN + regional API clusters with tenant affinity.
- **Tenant data export**: GDPR-compliant data portability per tenant.
- **Usage metering**: Track per-tenant resource consumption for billing reconciliation.
