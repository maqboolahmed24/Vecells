# Projection Contract Versioning Strategy

Use this prompt to direct an autonomous AI agent:

## Prompt
You are a principal systems architect and autonomous remediation agent responsible for fully resolving `Projection Contract Versioning Strategy`.

Map this domain to `ProjectionQueryContract`, `FrontendContractManifest`, projection schema digests, route-contract digests, `RuntimePublicationBundle`, migration and backfill windows, and any cache or read-model versioning scheme implied by the repository. Your mission is to fully resolve this failure class. Identify and eliminate every place where projection evolution is under-governed, causing silent schema drift, brittle consumers, mixed-version behavior, or read paths that cannot survive rollout, rollback, or backfill.

Execution mandate:
- Do not stop at diagnosis, observation, or recommendation.
- Read the full algorithm, end-to-end lifecycle, and governing contracts before changing the system.
- Then synthesize the strongest viable remediation and implement it directly when you have write access, using refactoring, schema changes, migration work, and contract hardening where needed.
- When you have write access, deliver patches, refactors, migrations, and contract changes rather than stopping at a change proposal.
- Prefer durable elimination of the failure class over local patches, UI workarounds, extra flags, or operator vigilance.
- Carry the remediation through implementation, verification, rollout or backfill handling, and proof that the unsafe path is closed.

Work method:
- Read the frontend, runtime, migration, and projection blueprints before making changes.
- Inventory projection families, their consumers, their publication path, and any version or digest currently carried with them.
- Distinguish additive evolution, breaking evolution, compatibility windows, and same-shell degraded recovery.
- Inspect how projection freshness, settlement truth, and continuity evidence interact during version transitions.
- Move from diagnosis into implementation as soon as the governing model is clear; do not leave the task as analysis-only commentary.

Required remediation work:
- Convert the discovered failure modes into a concrete target design and implement that design across the affected layers.
- Remove or refactor the unsafe paths so the system no longer depends on operator vigilance, local convention, or lucky sequencing.
- For each unsafe condition, carry the fix through the owning algorithm, contracts, storage, integrations, and user-facing state until the failure is removed or explicitly governed.
- Find projections or route contracts that are effectively unversioned or only versioned by convention.
- Detect where frontend code depends on incidental payload shape rather than published query contracts.
- Surface mixed-version hazards during canary rollout, rollback, partial backfill, or environment skew.
- Examine whether projection versioning is separate from command-settlement and continuity-control versioning when it should be or too entangled when it should not.
- Identify whether backward-compatible fallbacks, placeholders, or read-only recovery are defined for contract drift.

Implementation posture:
- Choose the remediation that definitively closes the failure class, even if that requires non-trivial refactoring.
- Implement the end-state architecture and algorithm, not just the analysis of it.
- Prefer deleting, consolidating, or hardening weak paths over documenting them or layering more conditional logic on top.
- Do not rely on best-effort consumer tolerance as a versioning strategy.
- Prefer explicit query contracts, digest publication, compatibility windows, and typed recovery for mismatches.
- If projections are too monolithic to version safely, split them into smaller contracts.
- Ensure version transitions are observable, replayable, and tied to runtime publication rather than hidden deploy order.

Produce:
1. A concise description of the current failure mode, its blast radius, and the target end-state.
2. The exact algorithmic, architectural, schema, contract, runtime, and interface changes required to eliminate the issue.
3. The concrete code, migration, configuration, and data-shape changes you will apply, or an exact executable patch plan if the environment is truly read-only.
4. The invariants, state-transition rules, guardrails, and recovery semantics enforced by the new design.
5. The verification suite needed to prove the remediation, including unit, integration, contract, replay, recovery, concurrency, and end-to-end coverage as applicable.
6. The rollout, backfill, reindex, compatibility, and operational validation plan required to land the fix safely.
7. Residual risks only if they remain after implementation, plus the exact evidence required to close them.

Optimize for definitive elimination of `Projection Contract Versioning Strategy` through coherent algorithmic and architectural remediation, with durable invariants, safe rollout, and proof-backed correctness. The task is not complete at diagnosis; finish only when the strongest viable remediation is implemented and proven, or reduced to an exact executable change set for a truly read-only environment.
