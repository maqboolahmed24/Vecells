# Five Sequential Deployment Tasks

These are the future tasks to complete the internal Render deployment end to end.

## Task 1: Stabilize Git And Main

Goal: make `main` a safe deployment branch.

Work:

- preserve dirty `dev` work in commits or reviewable branches;
- update local `main` from `origin/main`;
- merge or PR `dev` into `main`;
- resolve conflicts;
- run local gates;
- push `main`;
- enable/verify GitHub branch protection for `main`.

Acceptance:

- `main` contains the intended deployment baseline;
- worktree is clean or intentionally dirty only with docs;
- `NX_TUI=false pnpm typecheck`, `NX_TUI=false pnpm build`, and `NX_TUI=false pnpm test` pass on `main`;
- GitHub checks pass.

## Task 2: Make Runtime Render-Ready

Goal: remove code-level blockers before writing `render.yaml`.

Work:

- pin Node version at the repo root;
- update services to bind host `0.0.0.0` when deployed;
- make public web service use `process.env.PORT`;
- decide which admin ports are disabled, private, or health-only;
- add minimal internal password gate;
- add env var docs/templates for Render;
- keep local dev behavior working.

Acceptance:

- services still pass local runtime tests;
- app gate works locally;
- no secret values are committed;
- a dry-run start command can run with Render-like env vars.

## Task 3: Decide Data Mode And Seed/Reset

Goal: choose state behavior for internal testers.

Work:

- choose synthetic/no-durable-state or Render Free Postgres;
- map any required database connection env vars;
- decide whether domain and FHIR data share one database or use separate databases/schemas;
- write seed/reset commands;
- document test data rules;
- ensure no real patient data enters the environment.

Acceptance:

- team agrees on data durability limits;
- reset procedure is documented;
- Render env vars are known;
- smoke tests do not depend on a laptop database.

## Task 4: Create Render Blueprint

Goal: create and validate `render.yaml`.

Work:

- define the protected public entrypoint;
- define private/backend services or omit them for the first scope;
- define database resource only if Task 3 requires it;
- set env vars and `sync: false` or generated values for secrets;
- add health checks;
- set build filters/root behavior appropriate for the monorepo;
- validate with Render CLI if available;
- commit and push to `main`.

Acceptance:

- `render.yaml` is committed on `main`;
- Blueprint validation passes or is manually verified in Dashboard;
- Render Dashboard can create the Blueprint from GitHub;
- first deploy reaches live state.

## Task 5: Internal Tester Rollout And Smoke

Goal: make the environment usable by the internal team.

Work:

- run access smoke test;
- run app-surface smoke test;
- run one patient flow and one staff/admin flow with synthetic data;
- check Render logs for errors;
- write tester instructions with one URL and one password;
- define rollback and reset steps;
- set a test window and owner.

Acceptance:

- testers can access the protected entrypoint without technical setup;
- no app is publicly visible before password entry;
- known limitations are visible in the tester instructions;
- smoke test results are recorded;
- environment is explicitly labeled internal/non-production.

