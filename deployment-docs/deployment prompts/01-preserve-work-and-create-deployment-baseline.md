# Prompt 01: Preserve Work And Create Deployment Baseline

Copy/paste this as the first deployment execution prompt.

```text
You are Codex working in /Users/test/Code/V.

Goal:
Prepare the repository for internal Render deployment work without losing any current user/generated work. This is an internal team test deployment only, not an official launch.

Non-negotiable constraints:
- Do not assume anything. Cross-check local files and commands before deciding.
- Do not run destructive commands such as git reset --hard, git checkout -- ., git clean -fd, or branch switches that risk dirty work.
- Do not create or edit Render resources in this prompt.
- Do not create render.yaml in this prompt.
- Do not commit secrets.
- Preserve user changes. If a file has unrelated changes, work with them instead of reverting them.

Must read first:
- deployment-docs/README.md
- deployment-docs/01-project-audit.md
- deployment-docs/03-github-main-branch-plan.md
- deployment-docs/07-verified-links.md
- AGENTS.md if present

Current known facts to re-check:
- Current branch was dev.
- origin is https://github.com/maqboolahmed24/Vecells.git.
- local main was behind origin/main.
- dev and main diverged.
- the worktree was very dirty when the docs were written.

Execution steps:
1. Run:
   - git status --short --branch
   - git branch -vv
   - git remote -v
   - git rev-list --left-right --count origin/main...origin/dev
   - git rev-list --left-right --count main...dev
2. Count dirty files:
   - git status --porcelain=v1 | awk 'BEGIN{m=0;u=0} /^\\?\\?/{u++} /^[ MARCUD]/ && !/^\\?\\?/{m++} END{print "modified_or_staged=" m; print "untracked=" u}'
3. Identify deployment-related files already created or modified:
   - deployment-docs/**
   - apps/patient-web/src/App.tsx
   - apps/patient-web/src/patient-intake-question-primitives.tsx
   - tests/playwright/155_patient_intake_mission_frame.spec.js
   - tests/playwright/patient-shell-seed-routes.spec.js
   - tests/playwright/staff-shell-seed-routes.spec.js
   - packages/event-contracts/**
   - services/command-api/tests/phase4-appointment-manage.integration.test.js
   - packages/domains/pharmacy/src/phase6-pharmacy-case-kernel.ts
   - packages/domains/assistive_evaluation/src/index.ts
4. Produce a short preservation proposal:
   - Option A: one temporary safety commit on dev for the full dirty workspace.
   - Option B: split deployment docs/fixes from unrelated generated phase work.
   - Option C: create a safety branch without committing, then ask the user how to handle the large dirty set.
5. If the user has already authorized committing, create a branch using the maqbool/ prefix, for example:
   - maqbool/internal-render-deployment-baseline
   Then stage only the agreed files and commit with a precise message.
6. If the user has not authorized committing, stop after the proposal and ask for confirmation. Do not switch branches.

Validation:
- Re-run git status --short --branch.
- Confirm no destructive command was used.
- Confirm whether a safety branch/commit was created or whether user approval is still required.

Deliverables:
- A concise status report with:
  - current branch;
  - dirty count;
  - divergence count;
  - exact files staged/committed if any;
  - next prompt to run: Prompt 02.

Acceptance criteria:
- Current work is protected by an agreed branch/commit plan, or the user has explicitly been asked to approve the preservation method.
- No dirty work is lost.
- No Render deployment/config has been created yet.
```

