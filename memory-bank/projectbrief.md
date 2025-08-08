## Project Brief

Purpose: Build a modern, well-documented heritage site for the Gyllencreutz family with admin tools, reliable data management, and strong performance and validation.

Scope:
- Admin interface for managing family members and Swedish monarchs
- REST APIs with identical behavior across Express (dev) and Azure Functions (prod)
- Data backed by JSON (with Cosmos-ready paths) and GitHub-based backups
- Performance monitoring, testing, and developer experience tooling

Success Criteria:
- Accurate data model with migration path from `monarchDuringLife` names to `monarchIds`
- Fast UI: low input latency and smooth rendering on admin pages with 100–150+ rows
- Consistent API error handling and validation
- High test coverage and type-safe TypeScript across client/server

Non-Goals (current):
- Full DB migration to Postgres/Cosmos as primary (JSON remains primary for now)
- Heavy analytics beyond light performance and usage stats


