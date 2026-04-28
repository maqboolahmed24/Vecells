# Vecells Internal Render Deployment Docs

Prepared on 2026-04-28 for an internal team test deployment only. This is not an official launch plan.

These documents capture the deployment knowledge gathered from the local repository, the current Git state, validation runs, and official Render/GitHub documentation checked during this pass. No `render.yaml` has been created yet by design; the next deployment work should be split into the five sequential tasks in `06-five-sequential-deployment-tasks.md`.

## Current Recommendation

Use Render Blueprint deployment from `main`, after preserving the current dirty `dev` work and merging/reconciling `dev` into `main`. This repo is a pnpm/Nx monorepo with multiple frontend apps, services, workers, local infra emulators, and branch divergence, so a Blueprint is safer than one-off direct service creation.

For internal testers, expose one easy public web entrypoint protected by an app-level password gate, and keep backend services private where possible. Do not expose seven separate ungated static sites for nontechnical testers.

## Doc Map

- `01-project-audit.md` - repository shape, apps, services, infra, CI, validation results, and blocker fixes made during this pass.
- `02-render-internal-strategy.md` - recommended Render topology, service mapping, build/start command direction, and known Render readiness blockers.
- `03-github-main-branch-plan.md` - exact Git state and safe plan for using `main` as the deployment branch.
- `04-database-and-state-plan.md` - local database/emulator reality and Render data choices for internal testing.
- `05-internal-access-control.md` - secure but simple access plan for nontechnical internal testers.
- `06-five-sequential-deployment-tasks.md` - the five future tasks to complete the end-to-end internal deployment.
- `07-verified-links.md` - official links checked before writing these docs.

## Validation Snapshot

Commands passed after fixes:

- `pnpm install --frozen-lockfile`
- `NX_TUI=false pnpm typecheck`
- `NX_TUI=false pnpm build`
- `NX_TUI=false pnpm test`
- `pnpm --dir tests/playwright test`

Remaining deployment blockers are not test failures. They are deployment readiness gaps: Git is dirty/diverged, no Render Blueprint exists, several services bind to `127.0.0.1`, no root Node engine is pinned, and production-like durable data wiring is not complete.

