# 12 Monorepo Build System Decision

Vecells now has one enforceable workspace baseline: `pnpm + Nx` with graph-tag boundary enforcement, generated CODEOWNERS, export-map restrictions, and contract-aware codegen targets.

## Scorecard

| Option | Graph | Boundary | Local determinism | Codegen | Agent complexity | Total | Decision |
| --- | --- | --- | --- | --- | --- | --- | --- |
| pnpm + Nx | 5 | 5 | 5 | 5 | 4 | 48 | chosen |
| pnpm + Turborepo | 4 | 3 | 5 | 4 | 5 | 41 | rejected |
| Bazel or equivalent graph-first system | 5 | 4 | 5 | 5 | 1 | 43 | rejected |

## Chosen Baseline

- `pnpm` is the package manager and lockfile authority for deterministic local installs and workspace protocol references.
- `Nx` is the graph authority, affected-target runner, and task orchestrator for build, lint, test, preview, codegen, and Playwright execution.
- Remote cache is optional but never required for correctness; local execution must remain deterministic without it.
- Export maps, boundary lint, and validator parity checks are part of the build-system contract rather than optional conventions.

## Rejected Alternatives

- `pnpm + Turborepo`: Rejected because the repo law depends on graph-native tags and machine-checkable boundary policy, not only task caching.
- `Bazel or equivalent graph-first system`: Rejected because the accidental complexity cost is too high for the current Phase 0 baseline and would slow contract and shell iteration.
