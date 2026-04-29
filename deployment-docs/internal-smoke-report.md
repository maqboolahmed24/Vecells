# Internal Smoke Report

Status: local runtime smoke passed; hosted Render smoke passed.

The detailed smoke record is maintained in `deployment-docs/internal-render-smoke-report.md`.

Current status:

- Local protected entrypoint smoke passed.
- Hosted Render protected entrypoint smoke passed.
- Hosted Render service URL: `https://vecells-internal-entrypoint.onrender.com`.
- `INTERNAL_TEST_PASSWORD_HASH` was set outside Git.
- `SESSION_SECRET` is managed by Render from the Blueprint.
- This smoke status does not prove production readiness.
