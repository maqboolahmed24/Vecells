# GitHub Main Branch Plan

User decision: deploy from `main`.

Current reality: work is on `dev`, local `main` is behind `origin/main`, and the worktree is dirty.

## Current Git Facts

- Current branch: `dev`
- `dev`: `f488ecd`, tracking `origin/dev`
- local `main`: `14683f3`, behind `origin/main` by 3 commits
- `origin/main`: `c3afc8c`
- `origin/main...origin/dev`: `1 4`
- local `main...dev`: `0 6`
- dirty working tree: 101 modified/staged tracked files and 3372 untracked paths

## Do Not Do Yet

Do not run these until dirty work is preserved:

```bash
git switch main
git merge dev
git reset --hard
git checkout -- .
git clean -fd
```

The dirty work includes user/generated changes and fixes made during this pass. Losing it would lose deployment readiness work and many generated assets.

## Safe Branch Preparation Plan

1. Review and commit/push the current `dev` work, or intentionally split it into reviewable commits.
2. Confirm CI status on `dev`.
3. Update local `main` from `origin/main`.
4. Merge or PR `dev` into `main`.
5. Resolve conflicts.
6. Run local gates on the candidate `main`:

```bash
pnpm install --frozen-lockfile
NX_TUI=false pnpm typecheck
NX_TUI=false pnpm build
NX_TUI=false pnpm test
```

7. Push `main`.
8. Deploy Render from `main` only after it contains the internal deployment config.

## Recommended GitHub Protections

Protect `main` before Render deploys from it:

- require pull request before merge;
- require status checks to pass;
- require branch to be up to date before merging if the team can tolerate extra CI runs;
- require conversation resolution;
- restrict direct pushes if possible.

This matters because Render auto-deploys from linked Git branches. If `main` is used for internal deployment, then accidental pushes to `main` can become accidental deployments.

## Render Auto-Deploy Recommendation

For the first internal deployment:

- allow manual deploys until the first smoke test passes;
- then enable auto-deploy from `main` if the team wants fast iteration;
- keep official launch disabled regardless of Render deploy success.

## PR/Commit Scope For Later Tasks

Use separate commits/PRs for:

- branch cleanup and validation;
- Render readiness code changes;
- internal access gate;
- `render.yaml` Blueprint;
- smoke test scripts and tester instructions.

This makes rollback easier if a single deployment task causes problems.

