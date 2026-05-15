# Frontend Multi-tenant Notes

ZonarHub is a shared-instance multi-tenant system.

The canonical multi-tenant architecture documentation lives in:

* `../../zonar-hub-api/docs/architecture/multi-tenant-architecture.md`

Frontend rules:

* render organization-specific UI from the current organization context
* do not treat frontend filtering as a security boundary
* do not hardcode organization-specific behavior
* avoid duplicating tenant rules already enforced by the backend
* API calls must respect the current organization flow
