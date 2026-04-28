# Prompt 06: Author Render Blueprint

Run this after Prompts 03, 04, and 05 are complete.

```text
You are Codex working in /Users/test/Code/V.

Goal:
Create the Render Blueprint for the internal team test environment.

Non-negotiable constraints:
- Cross-check official Render docs before writing Blueprint fields:
  - https://render.com/docs/blueprint-spec
  - https://render.com/docs/monorepo-support
  - https://render.com/docs/web-services
  - https://render.com/docs/private-services
  - https://render.com/docs/free
- Use main as the deployment branch.
- No secrets in Git.
- Use generated values or sync:false for secrets.
- Do not create paid resources unless the user explicitly approved them.
- This is internal test deployment only.

Must read first:
- deployment-docs/02-render-internal-strategy.md
- deployment-docs/04-database-and-state-plan.md
- deployment-docs/05-internal-access-control.md
- deployment-docs/07-verified-links.md
- outputs/results from Prompts 03, 04, and 05

Blueprint design:
1. Include the protected internal entrypoint as the primary public web service.
2. Include backend services only if the selected test scope requires them.
3. Use private services for backend APIs where possible.
4. Include a Render database only if Prompt 05 chose Render Postgres.
5. Use free plan only unless the user explicitly approved paid.
6. Configure env vars:
   - NODE_ENV=production
   - VECELLS_ENVIRONMENT=internal
   - RELEASE_RING=internal
   - INTERNAL_TEST_PASSWORD_HASH as sync:false unless generated safely outside Git
   - SESSION_SECRET as generateValue or sync:false
   - data env vars from Prompt 05 if applicable
7. Use repo-root build commands unless monorepo root-directory behavior has been verified safe for each service.
8. Add health checks for web services if supported by the code.
9. Disable auto-deploy initially if Render Blueprint supports the desired manual first-deploy workflow, or document manual deploy expectation if not.

Validation:
1. Check YAML syntax.
2. If Render CLI is installed:
   - render --version
   - render blueprints validate
3. If Render CLI is not installed or not authenticated:
   - document exact validation limitation;
   - provide Dashboard validation steps;
   - do not claim validation passed.
4. Run:
   - NX_TUI=false pnpm typecheck
   - NX_TUI=false pnpm build
   - NX_TUI=false pnpm test

Commit/push:
- If the user has authorized it, commit render.yaml and related docs on main and push.
- If not authorized, stop after local validation and ask for approval.

Deliverables:
- render.yaml path and summary.
- Services/resources defined.
- Env vars and secrets requiring Dashboard entry.
- Blueprint validation result or limitation.
- Commit/push status.
- Dashboard deeplink:
  - https://dashboard.render.com/blueprint/new?repo=https://github.com/maqboolahmed24/Vecells
- Next prompt to run: Prompt 07.

Acceptance criteria:
- render.yaml exists and matches the internal scope.
- No secret values are committed.
- Validation passes or the exact validation blocker is documented.
- main is ready for Render Blueprint creation after user approval.
```

