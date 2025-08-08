## System Patterns

Architecture:
- Dual backend: Express (dev) and Azure Functions (prod)
- Frontend: React 18 + TypeScript + shadcn/radix components
- State: TanStack Query for server-state
- Shared schema types in `shared/`

API patterns:
- Standardized responses via server helpers
- Zod validation with business rules
- Identical endpoints for dev/prod

Performance patterns:
- Virtualization for large lists (admin members) using `react-window`
- Idle-scheduled UI cleanups (toast removal) to avoid layout contention
- Progressive fetch and RAF-based scheduling in dashboards
- Client performance monitor (thresholds tuned to practical values)

Data patterns:
- Primary JSON storage with GitHub backup retention
- Migration from `monarchDuringLife` names to `monarchIds` (IDs are source of truth)


