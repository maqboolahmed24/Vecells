# Prompt 02: Update Main From Dev And Verify

Run this only after Prompt 01 has preserved the dirty work or the user has explicitly approved the branch/commit handling.

```text
You are Codex working in /Users/test/Code/V.

Goal:
Prepare main as the deployment branch by updating it from origin/main and merging/reconciling dev into main. This is for internal Render testing only.

Non-negotiable constraints:
- Do not assume the worktree is clean. Check it.
- Do not run destructive commands.
- Do not lose user changes.
- Do not push main until local validation passes and the user has approved pushing.
- Do not create Render resources in this prompt.

Must read first:
- deployment-docs/03-github-main-branch-plan.md
- deployment-docs/01-project-audit.md
- output/result from Prompt 01

Preflight:
1. Run:
   - git status --short --branch
   - git branch -vv
   - git remote -v
   - git fetch origin --prune
2. If the worktree is dirty and not intentionally preserved, stop and return to Prompt 01.
3. Confirm the deployment branch is main.

Branch update plan:
1. Update local main from origin/main using a non-destructive flow.
2. Merge dev into main or open a PR path if direct merge is not allowed.
3. Resolve conflicts carefully. Do not discard unrelated user changes.
4. If conflicts touch deployment docs or readiness fixes, preserve the deployment docs unless they are proven wrong by current repo state.

Suggested commands, only after the worktree is safe:
- git switch main
- git pull --ff-only origin main
- git merge dev

If git refuses due to local changes or divergence:
- stop;
- report exact git output;
- propose the least destructive resolution.

Validation commands:
- pnpm install --frozen-lockfile
- NX_TUI=false pnpm typecheck
- NX_TUI=false pnpm build
- NX_TUI=false pnpm test

GitHub branch protection:
1. Check whether GitHub CLI is installed and authenticated:
   - gh --version
   - gh auth status
2. If authenticated, inspect branch protection if permissions allow.
3. If not authenticated or not permitted, document the dashboard steps from GitHub protected branches docs. Do not invent current protection state.

Push:
- If validation passes and the user explicitly approves, push main.
- If validation fails, do not push. Fix only scoped issues or report blockers.

Deliverables:
- Exact merge result.
- Exact validation results.
- Whether main was pushed.
- Any GitHub branch protection findings or manual dashboard steps.
- Next prompt to run: Prompt 03.

Acceptance criteria:
- main contains the intended dev/deployment baseline locally.
- Validation passes locally on main.
- main is pushed only after user approval.
- No Render config/resources exist yet unless they existed before.
```

