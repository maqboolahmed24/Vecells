# Internal Smoke Report

Status: local runtime smoke passed; hosted Render smoke is pending first Blueprint apply.

The detailed smoke record is maintained in `deployment-docs/internal-render-smoke-report.md`.

Current boundary:

- Local protected entrypoint smoke passed.
- Hosted Render service URL is not recorded in this repo.
- Hosted smoke cannot be marked passed until the Render Blueprint is applied, `INTERNAL_TEST_PASSWORD_HASH` is set outside Git, and the deployed URL is tested.
- This smoke status does not prove production readiness.
