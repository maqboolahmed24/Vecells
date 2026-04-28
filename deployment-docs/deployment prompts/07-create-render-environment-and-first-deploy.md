# Prompt 07: Create Render Environment And First Deploy

Run this after Prompt 06 has created and validated the Blueprint on main.

```text
You are Codex working in /Users/test/Code/V.

Goal:
Create the internal Render environment from the Blueprint and perform the first internal deployment.

Non-negotiable constraints:
- Do not expose secret values in chat, logs, docs, or Git.
- Do not deploy from any branch except main.
- Do not mark this as official launch.
- Do not continue if render.yaml is not committed/pushed to main.
- Do not buy paid resources unless the user explicitly approves.

Must read first:
- render.yaml
- deployment-docs/02-render-internal-strategy.md
- deployment-docs/05-internal-access-control.md
- deployment-docs/07-verified-links.md
- output/result from Prompt 06

Preflight:
1. Confirm current branch and remote:
   - git status --short --branch
   - git log --oneline -5
   - git remote -v
2. Confirm render.yaml is present on main and pushed.
3. Confirm required secret/env var list:
   - INTERNAL_TEST_PASSWORD_HASH
   - SESSION_SECRET
   - any data mode env vars from Prompt 05
4. Confirm user has access to the Render account connected with their Gmail.

Deployment options:
Option A, Dashboard:
- Open:
  https://dashboard.render.com/blueprint/new?repo=https://github.com/maqboolahmed24/Vecells
- Select the correct Render workspace.
- Confirm repo and branch main.
- Review services/resources.
- Fill sync:false secrets.
- Apply Blueprint.

Option B, CLI/MCP if configured:
- Check Render auth/workspace first.
- Apply the Blueprint only if the tool clearly supports it and the user authorizes it.
- If auth is missing, stop and give Dashboard steps.

During deploy:
1. Record service names and URLs.
2. Watch first deploy logs.
3. Confirm web entrypoint reaches live state.
4. Confirm private services, if any, are live or intentionally omitted.
5. Do not send tester URL yet. That happens after Prompt 08 smoke passes.

Failure handling:
- If build fails, capture first concrete error and fix only scoped issues.
- If service fails to bind, revisit Prompt 03.
- If auth gate fails, revisit Prompt 04.
- If database env fails, revisit Prompt 05.
- If Blueprint syntax/resource fails, revisit Prompt 06.

Deliverables:
- Render workspace name if visible.
- Blueprint name.
- Services created.
- Public internal entrypoint URL.
- Secret/env vars entered, names only, no values.
- First deploy status.
- Any logs/errors summarized.
- Next prompt to run: Prompt 08.

Acceptance criteria:
- Render environment exists.
- First deployment is live or has a documented blocker.
- Public tester URL is not distributed yet.
- No secrets were exposed.
```

