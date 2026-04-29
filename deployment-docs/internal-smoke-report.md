# Internal Smoke Report

Status: local runtime smoke passed; hosted Render smoke passed before suspension.

The detailed smoke record is maintained in `deployment-docs/internal-render-smoke-report.md`.

Current status:

- Local protected entrypoint smoke passed.
- Hosted Render protected entrypoint smoke passed.
- Hosted Render service URL: `https://vecells-internal-entrypoint.onrender.com`.
- `INTERNAL_TEST_PASSWORD_HASH` was set outside Git.
- `SESSION_SECRET` is managed by Render from the Blueprint.
- Current hosted service state: suspended as of 2026-04-29 13:13 UTC.
- This smoke status does not prove production readiness.
