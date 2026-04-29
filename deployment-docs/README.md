# Vecells Internal Render Deployment Docs

Prepared on 2026-04-28 for an internal team test deployment only. This is not an official launch plan.

These documents capture the deployment knowledge gathered from the local repository, the current Git state, validation runs, and official Render/GitHub documentation checked during this pass. `render.yaml` now defines the first internal Blueprint for a protected synthetic/disposable Render deployment.

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
- `internal-render-implementation-status.md` - implementation status for the preserved baseline, runtime readiness, protected entrypoint, and synthetic data mode.
- `internal-render-smoke-report.md` - local runtime smoke results and hosted Render smoke boundary.
- `internal-smoke-report.md` - compatibility smoke summary for prompts that expect this filename.
- `internal-tester-guide.md` - nontechnical tester instructions with one URL placeholder and password-handling rules.
- `internal-feedback-template.md` - feedback format for internal testers.
- `internal-support-runbook.md` - support, rotation, disable, redeploy, rollback, and closeout steps for the internal test window.
- `internal-test-closeout.md` - Prompt 10 monitoring, rollback, unresolved risks, and closeout status record.

## Validation Snapshot

Commands passed after fixes:

- `pnpm install --frozen-lockfile`
- `NX_TUI=false pnpm typecheck`
- `NX_TUI=false pnpm build`
- `NX_TUI=false pnpm test`
- `pnpm --dir tests/playwright test`
- Local internal-entrypoint HTTP smoke on `127.0.0.1:7300`
- Hosted Render smoke on `https://vecells-internal-entrypoint.onrender.com`

The internal Render environment deployed successfully and hosted smoke passed. The web service is currently suspended, so public access is paused until the service is resumed in Render.
