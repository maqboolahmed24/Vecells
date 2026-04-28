# Prompt 08: Post-Deploy Smoke, Logs, And Security Check

Run this after Prompt 07 creates the Render environment.

```text
You are Codex working in /Users/test/Code/V.

Goal:
Verify the internal Render deployment before any tester receives the URL.

Non-negotiable constraints:
- Do not send the tester URL until all smoke checks pass or limitations are explicitly accepted.
- Do not expose passwords or session secrets.
- Use synthetic data only.
- Do not assume a route works; check it.

Must read first:
- deployment-docs/05-internal-access-control.md
- deployment-docs/06-five-sequential-deployment-tasks.md
- output/result from Prompt 07

Smoke checks:
1. Anonymous access:
   - Open the public entrypoint URL.
   - Verify only the password page is visible.
   - Verify app content is not visible in page source or unauthenticated HTML.
2. Wrong password:
   - Submit a wrong password.
   - Verify access is denied.
3. Correct password:
   - Submit the internal test password without logging the value.
   - Verify session is created.
   - Verify internal test banner is visible.
4. Menu links:
   - patient web loads.
   - clinical workspace loads.
   - ops console loads.
   - hub desk loads.
   - pharmacy console loads.
   - support workspace loads.
   - governance console loads.
5. Logout:
   - verify logout returns to password page.
   - verify previously authenticated app paths are protected after logout.
6. Backend/API:
   - check health endpoints for services intentionally deployed.
   - verify private services are not directly public unless intentionally public.
7. Data mode:
   - run synthetic flow only.
   - verify no laptop database is required.
   - if Render Postgres is used, verify connection and disposable test banner.
8. Render logs:
   - inspect recent deploy/runtime logs.
   - record any warnings/errors.
9. Performance sanity:
   - note cold start behavior.
   - note large frontend bundle load impact.

Preferred tools:
- Browser automation if available for visual/auth flow.
- curl for HTTP status checks.
- Render dashboard/CLI/MCP for logs if authenticated.

Deliverables:
- Create or update a smoke report under deployment-docs, for example:
  deployment-docs/internal-smoke-report.md
- Include:
  - date/time;
  - Render service names;
  - public entrypoint URL;
  - checks passed/failed;
  - logs reviewed;
  - unresolved risks;
  - approval status for tester rollout.

Acceptance criteria:
- Password gate works.
- All intended app surfaces load.
- No app content is visible anonymously.
- Logs have no deployment-blocking errors.
- Synthetic/test-only boundary is visible.
- Next prompt to run: Prompt 09.
```

