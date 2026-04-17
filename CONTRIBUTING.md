# Contributing

Vecells is a contract-first monorepo. The contributor workflow is intentionally opinionated so later coding agents, human contributors, and CI all use the same branch, commit, validation, and review model.

## Start Here

1. Claim the next eligible task in `prompt/checklist.md` before editing code.
2. Read the task prompt plus `prompt/AGENT.md` and keep the checklist serialization intact.
3. Create one task-scoped branch such as `codex/seq-045-engineering-standards`.
4. Run `pnpm bootstrap` once per clone or after generator changes.
5. Before opening a PR, run `pnpm check`. If the change is browser-visible, also run `pnpm test:e2e`.

## Canonical Validation Commands

- `pnpm bootstrap`
- `pnpm codegen`
- `pnpm format`
- `pnpm check`
- `pnpm test:e2e`
- `pnpm verify:release`

## Current Foundation Scope

- Canonical topology: `39` artifacts
- Apps: `7`
- Services: `5`
- Packages: `22`
- Tooling and docs workspaces: `5`

## Non-Negotiables

- Typed code is the default. “Temporary scaffold” does not waive typing, tests, or boundary discipline.
- Browser-visible work is not complete without Playwright-or-equivalent proof.
- Apps consume published contracts; they do not become hidden owners of domain or service truth.
- Commits must carry architectural signal. `update`, `misc`, and unlabeled bundles are rejected.
- Every commit must trace back to roadmap work using `Task:` and `Refs:` footers.

## Standards Pack

- [45 Coding Standards](docs/engineering/45_coding_standards.md)
- [45 Branching Strategy](docs/engineering/45_branching_strategy.md)
- [45 Commit Conventions](docs/engineering/45_commit_conventions.md)
- [45 PR Review And Release Hygiene](docs/engineering/45_pr_review_and_release_hygiene.md)

## Commit Footer Minimum

```text
Task: seq_045
Refs: prompt/045.md, prompt/AGENT.md, docs/architecture/41_repository_topology_rules.md
```

Use `Risk:` and `Validation:` footers as well when the change touches release controls, migrations, route intent, trust posture, or other explicitly risky surfaces.
