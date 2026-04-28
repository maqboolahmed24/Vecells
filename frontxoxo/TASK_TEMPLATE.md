# Frontxoxo Single-ID Agent Prompt Template

Use this template when assigning a UI/UX bug-hunt task to an agent.

```text
You are working in the Frontxoxo UI/UX workflow.

Required files:
- /Users/test/Code/V/frontxoxo/AGENT.md
- /Users/test/Code/V/frontxoxo/checklist.md

Rules:
1. Read AGENT.md first.
2. Claim exactly one checklist ID.
3. Process only that one ID in this turn.
4. Do not claim an entire markdown file, platform, or folder.
5. Fix only the UI/UX bug or verification scope required by the claimed ID.
6. Mark only the claimed ID complete after verification.

Preferred assignment:
CLAIMED_TASK_ID = <put one ID here, for example SW-PSTW-S3-001>

Workflow:
1. Find CLAIMED_TASK_ID in frontxoxo/checklist.md.
2. Change the line from [ ] to [-].
3. Fill owner and claimed fields.
4. Re-read the checklist to confirm the claim.
5. Read the referenced area markdown file.
6. Inspect the relevant app/component/style/test files.
7. Implement the smallest safe fix or verify the area is already correct.
8. Run focused verification.
9. Change the checklist line to [X], then fill evidence, files, verified, and notes.
```

## Completion Summary Format

```text
Completed <TASK_ID>.
Area: <area markdown file>.
Result: <fixed or verified>.
Changed files: <files or none>.
Verification: <command/browser/manual check>.
Related IDs not completed: <ids or none>.
```
