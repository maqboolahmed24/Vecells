# Frontxoxo Agent Operating Protocol

This folder is the UI/UX bug-hunt workflow for the repository.

The only live task board is `/Users/test/Code/V/frontxoxo/checklist.md`.
Do not track task status in `AGENT.md`.
Do not mark status inside the platform scope files.

## Status Markers

- `[ ]` Unclaimed and available.
- `[-]` Claimed and actively in progress.
- `[X]` Completed and verified.
- `[!]` Blocked and released for human review.

## Source Of Truth

1. Read `/Users/test/Code/V/frontxoxo/AGENT.md` first.
2. Read `/Users/test/Code/V/frontxoxo/checklist.md` second.
3. Use `/Users/test/Code/V/frontxoxo/checklist.md` as the only file for claiming, blocking, or completing work.
4. Use the `area:` file referenced by the checklist line for task-specific context.
5. Use the source app or package named in that area file as the implementation boundary.

## One-ID Rule

Each agent turn may claim exactly one numbered task ID.

Examples:

- Allowed: claim `SW-PSTW-S3-001` only.
- Allowed: claim `PW-IF-S2-003` only.
- Not allowed: claim all of `Persistent support ticket workspace.md`.
- Not allowed: claim all of `Support Workspace`.
- Not allowed: mark related IDs complete just because the same code change may help them.

If one root fix affects multiple IDs, implement the smallest safe fix needed for the claimed ID, mark only the claimed ID complete, and add related IDs in the `notes:` field.

## Task Types

- `kind: screen` means inspect and fix the specific screen, phase, route, component state, or panel named by the task.
- `kind: bug-check` means inspect and fix the specific UI/UX concern named by the task across the screen group in that area file.

Stage 1 lines in area files are scope metadata and are not claimable tasks.

## Eligibility Rules

1. Any `[ ]` task may be claimed unless a human has given a narrower assignment.
2. Prefer tasks with no active `[-]` task in the same `area:` file to reduce conflicts.
3. Never edit another agent's `[-]` task unless a human explicitly asks for a takeover.
4. If the checklist changes while claiming, stop, re-read it, and confirm your task is still claimed by you.
5. If your task becomes impossible, mark it `[!]` with a short blocker in `notes:` and stop.

## Claim Workflow

1. Pick one `[ ]` checklist line.
2. Change `[ ]` to `[-]`.
3. Set `owner:` to a short identifier for your agent or thread.
4. Set `claimed:` to an ISO-like timestamp, for example `2026-04-27T14:30Z`.
5. Save and re-read `/Users/test/Code/V/frontxoxo/checklist.md`.
6. Continue only if the same line is still `[-]` and owned by you.

## Execution Workflow

1. Read the referenced `area:` markdown file.
2. Read nearby app source, route model, component, style, and test files needed for that one ID.
3. Reproduce or inspect the UI state when practical.
4. Fix only the smallest UI/UX issue needed for the claimed ID.
5. Do not do broad refactors, platform-wide redesigns, or unrelated cleanup.
6. Preserve existing behavior unless the claimed ID requires a behavior change.
7. Add or update focused tests only when the risk justifies it.
8. Run the smallest useful verification command or browser check.

## Completion Workflow

Mark the task `[X]` only when all of these are true:

- The claimed ID has been inspected directly.
- Any bug found for that ID has been fixed or the area is verified as already correct.
- Verification evidence is recorded in the checklist line.
- Changed files are recorded in the checklist line.
- Related-but-unchecked IDs are left uncompleted.

Completion line fields:

- `owner:` keep the owner that completed the task.
- `claimed:` keep the original claim timestamp.
- `evidence:` short result, for example `fixed overflow in mobile queue row`.
- `files:` comma-separated changed files or `none`.
- `verified:` command, browser check, or `manual source review`.
- `notes:` related IDs, residual risk, or `none`.

## Blocked Workflow

Use `[!]` instead of leaving a task `[-]` when work cannot continue.

Blocked lines must include:

- `owner:` who hit the blocker.
- `evidence:` what was attempted.
- `verified:` why verification could not complete.
- `notes:` the exact blocker or decision needed.

## Regenerating The Checklist

The checklist is generated from the platform markdown files by:

```bash
node frontxoxo/tools/build-checklist.mjs
```

The generator preserves existing checklist status and metadata for known IDs.
Only run it when adding, removing, or renaming scope IDs.
