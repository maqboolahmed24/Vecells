# 45 Coding Standards

Vecells publishes one engineering baseline across `39` canonical artifacts. These rules translate the architecture corpus into day-to-day developer ergonomics so shells, services, shared contracts, and tooling stay aligned.

## Source Order

1. `prompt/AGENT.md` and `prompt/checklist.md` for sequencing and claim law
2. `prompt/045.md` plus the shared operating contract for seq_036-045
3. `docs/architecture/41_repository_topology_rules.md`
4. `docs/architecture/42_monorepo_scaffold_plan.md`
5. `docs/architecture/43_service_scaffold_map.md`
6. `docs/architecture/44_domain_package_contracts.md`

## Code Style Baseline

- Use `prettier` for formatting and `eslint` for code-quality enforcement.
- Default indentation is two spaces for JS, TS, JSON, Markdown, YAML, and shell-compatible text. Python keeps four spaces.
- Keep files ASCII unless an existing file already uses Unicode for a clear reason.
- Prefer small modules with explicit names over “misc”, “helpers”, or anonymous shared buckets.
- Public APIs must be exported through package entrypoints, never through private `src/*` deep imports.

## Typing Expectations

- TypeScript is the default runtime and package language.
- `strict` TypeScript remains on. Do not weaken compiler settings to land scaffolds or tests.
- Python stays bounded to repo analysis and validation tools. It may inspect or synthesize; it never owns runtime truth.
- Contract data crossing package or service boundaries must use explicit types, schemas, or manifest-backed structures.

## Testing Expectations By Layer

- Static and unit: `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test`
- Repo topology and generator drift: `pnpm validate:topology`, `pnpm validate:scaffold`, `pnpm validate:services`, `pnpm validate:domains`, `pnpm validate:standards`
- Browser-visible work: `pnpm test:e2e`
- Release or migration risk: `pnpm verify:release` plus any task-specific dry runs or migration proofs

## Playwright Expectations For Browser-Visible Work

- Define semantic landmarks and stable `data-testid` markers before polish.
- Drive critical flows with Playwright while building, not only as a late smoke test.
- Browser-visible work is incomplete until Playwright covers the user-visible behavior, reduced-motion posture, and chart or diagram parity where relevant.
- UI-only claims without browser automation evidence do not meet the Vecells definition of done.

## Accessibility Expectations

- Preserve visible focus rings, landmark structure, keyboard access, and readable parity content beside diagrams or visual summaries.
- Primary controls stay large enough for touch and keyboard operation.
- Reduced motion must stay functional and truthful, not merely hidden.
- Accessibility semantics belong in code and contract surfaces, not only in screenshots or review comments.

## Performance And Security Hygiene

- No source secrets, live credentials, or provider identifiers in committed code, snapshots, traces, or logs.
- Keep logs structured and disclosure-safe; redact tokens, credentials, and patient-sensitive context.
- Prefer explicit release gates, retry policies, and degraded defaults over silent fallback.
- Treat dependency, provenance, and watch tuple drift as release blockers rather than operational chores.

## Package-Boundary And Import Discipline

- Apps consume published contracts, design-system APIs, and shared packages only.
- `services/api-gateway` may publish or enforce contracts and policy, but it does not import domain packages directly.
- Domain packages do not import sibling domain packages. Shared kernel, published contracts, authz policy, and observability are the allowed seams.
- Never deep import another workspace’s `src/*`, `internal/*`, `workers/*`, or `repositories/*` paths.
- If a boundary rule feels awkward, fix the exported seam or the architecture record instead of bypassing the rule locally.

## Traceability Expectations

- Every branch, commit, PR, and generated artifact must point back to a concrete `seq_` or `par_` task.
- Commits require `Task:` and `Refs:` footers.
- PRs must name the prompt task, the architecture refs touched, and the exact validation commands run.

## Temporary Scaffold Rule

“Placeholder”, “draft”, and “temporary scaffold” are delivery posture labels, not waivers. The same typing, testing, boundary, accessibility, and traceability rules still apply.
