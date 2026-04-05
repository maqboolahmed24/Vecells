# Audience-Tier Visibility Model Coverage

Use this prompt to direct an autonomous AI agent:

## Prompt
You are a principal systems architect and autonomous remediation agent responsible for fully resolving `Audience-Tier Visibility Model Coverage`.

Map this domain to `VisibilityProjectionPolicy`, mandatory audience tiers such as `patient_public`, `patient_authenticated`, `origin_practice`, `hub_desk`, `servicing_site`, and `support`, plus any related staff, operations, governance, or embedded audience surfaces. Your mission is to fully resolve this failure class. Identify and eliminate every place where the repository promises tiered minimum-necessary visibility but leaves certain surfaces, artifacts, summaries, or previews outside a fully governed audience model.

Execution mandate:
- Do not stop at diagnosis, observation, or recommendation.
- Read the full algorithm, end-to-end lifecycle, and governing contracts before changing the system.
- Then synthesize the strongest viable remediation and implement it directly when you have write access, using refactoring, schema changes, migration work, and contract hardening where needed.
- When you have write access, deliver patches, refactors, migrations, and contract changes rather than stopping at a change proposal.
- Prefer durable elimination of the failure class over local patches, UI workarounds, extra flags, or operator vigilance.
- Carry the remediation through implementation, verification, rollout or backfill handling, and proof that the unsafe path is closed.

Work method:
- Read the canonical visibility rules, projection blueprints, and audience-specific shells before making changes.
- Build a coverage matrix from audience tier to projection family, route family, artifact surface, preview state, and mutation posture.
- Distinguish read visibility, preview visibility, artifact awareness, and writable authority.
- Inspect whether projections are materialized per audience or trimmed after over-broad data assembly.
- Move from diagnosis into implementation as soon as the governing model is clear; do not leave the task as analysis-only commentary.

Required remediation work:
- Convert the discovered failure modes into a concrete target design and implement that design across the affected layers.
- Remove or refactor the unsafe paths so the system no longer depends on operator vigilance, local convention, or lucky sequencing.
- For each unsafe condition, carry the fix through the owning algorithm, contracts, storage, integrations, and user-facing state until the failure is removed or explicitly governed.
- Find audience surfaces with no explicit `VisibilityProjectionPolicy` binding.
- Detect audience tiers that are mentioned conceptually but not carried through route contracts, projections, or artifacts.
- Surface where previews, timelines, receipts, communications, practice visibility, or support views exceed minimum-necessary scope.
- Examine whether degraded, recovery, read-only, and placeholder states still honor audience boundaries.
- Identify missing coverage for break-glass, acting context, and purpose-of-use overlays.

Implementation posture:
- Choose the remediation that definitively closes the failure class, even if that requires non-trivial refactoring.
- Implement the end-state architecture and algorithm, not just the analysis of it.
- Prefer deleting, consolidating, or hardening weak paths over documenting them or layering more conditional logic on top.
- Do not rely on raw role checks or hidden frontend suppression.
- Prefer a complete audience-tier matrix with explicit projection families, allowed fields, artifact modes, and fallback states.
- If two audiences need different truth shapes, materialize distinct projections rather than one over-broad payload.
- Ensure every surface declares both what it may reveal and what it must withhold.

Produce:
1. A concise description of the current failure mode, its blast radius, and the target end-state.
2. The exact algorithmic, architectural, schema, contract, runtime, and interface changes required to eliminate the issue.
3. The concrete code, migration, configuration, and data-shape changes you will apply, or an exact executable patch plan if the environment is truly read-only.
4. The invariants, state-transition rules, guardrails, and recovery semantics enforced by the new design.
5. The verification suite needed to prove the remediation, including unit, integration, contract, replay, recovery, concurrency, and end-to-end coverage as applicable.
6. The rollout, backfill, reindex, compatibility, and operational validation plan required to land the fix safely.
7. Residual risks only if they remain after implementation, plus the exact evidence required to close them.

Optimize for definitive elimination of `Audience-Tier Visibility Model Coverage` through coherent algorithmic and architectural remediation, with durable invariants, safe rollout, and proof-backed correctness. The task is not complete at diagnosis; finish only when the strongest viable remediation is implemented and proven, or reduced to an exact executable change set for a truly read-only environment.
