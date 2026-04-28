# Prompt 05: Data Mode, Seed, Reset, And Test Boundaries

Run this after Prompt 04 has created the protected internal entrypoint.

```text
You are Codex working in /Users/test/Code/V.

Goal:
Choose and implement the data mode for the first internal Render deployment, then document seed/reset boundaries so testers do not depend on a laptop database or enter real data.

Non-negotiable constraints:
- Do not use a laptop-hosted database for Render.
- Do not add paid storage unless the user explicitly approves.
- Do not store real patient data.
- Do not store secrets in Git.
- If persistence is not implemented, label the environment as synthetic/disposable.

Must read first:
- deployment-docs/04-database-and-state-plan.md
- deployment-docs/02-render-internal-strategy.md
- deployment-docs/01-project-audit.md
- output/result from Prompt 04

Default decision:
Use synthetic/no-durable-state mode for the first internal test unless the user explicitly says testers need durable shared submissions. If durable shared state is needed, use Render Free Postgres as short-lived disposable test storage and document the 30-day/1 GB limitation.

Execution steps:
1. Re-check current state wiring:
   - rg -n "DATABASE_URL|POSTGRES|vecells_domain|vecells_fhir|localStorage|sessionStorage|in-memory|fixture|seed" apps services packages infra
2. Identify which tester flows are actually in scope for the first deployment:
   - UI/navigation only;
   - synthetic patient intake;
   - staff/admin review;
   - API-backed flow if any.
3. Choose data mode:
   - Mode A: synthetic/disposable, no Render database.
   - Mode B: Render Free Postgres with explicit disposable warning.
4. If Mode A:
   - ensure the protected entrypoint and tester docs say synthetic/disposable;
   - add a reset instruction for client-side/local state where applicable;
   - avoid adding fake DATABASE_URL requirements.
5. If Mode B:
   - define env var names;
   - define schema ownership;
   - define seed command;
   - define reset/wipe command;
   - add migrations only if existing code has a clear migration pattern.
6. Update deployment docs with the final decision.
7. Add smoke tests or scripts that prove the chosen mode works locally.

Validation:
- Run any new seed/reset script tests.
- NX_TUI=false pnpm typecheck
- NX_TUI=false pnpm build
- NX_TUI=false pnpm test

Deliverables:
- Final data mode decision.
- Env vars required for data mode.
- Seed/reset commands or explicit "not required for synthetic mode".
- Tester data safety text.
- Validation results.
- Next prompt to run: Prompt 06.

Acceptance criteria:
- First internal deployment does not depend on a laptop database.
- Testers know not to enter real data.
- State limitations are documented.
- Build/typecheck/test remain green.
```

