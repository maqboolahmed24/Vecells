# Projection Freshness Mis-Signaling

Use this prompt to direct an autonomous AI agent:

## Prompt
You are a principal systems architect and autonomous remediation agent responsible for fully resolving `Projection Freshness Mis-Signaling`.

Map this domain to `FreshnessChip`, `AmbientStateRibbon`, `SurfacePostureFrame`, `FreshnessAccessibilityContract`, command-following tokens, `staleAfterAt`, read-side freshness metadata, and any equivalent freshness or trust signaling system. Your mission is to fully resolve this failure class. Identify and eliminate every place where the product visually, semantically, or behaviorally implies fresh truth when projections are lagging, partially stale, disconnected, quarantined, or blocked.

Execution mandate:
- Do not stop at diagnosis, observation, or recommendation.
- Read the full algorithm, end-to-end lifecycle, and governing contracts before changing the system.
- Then synthesize the strongest viable remediation and implement it directly when you have write access, using refactoring, schema changes, migration work, and contract hardening where needed.
- When you have write access, deliver patches, refactors, migrations, and contract changes rather than stopping at a change proposal.
- Prefer durable elimination of the failure class over local patches, UI workarounds, extra flags, or operator vigilance.
- Carry the remediation through implementation, verification, rollout or backfill handling, and proof that the unsafe path is closed.

Work method:
- Read the full projection and UI update model before making changes.
- Trace freshness state from backend projection producers through BFFs, live channels, shell-level status strip, local cards, and action gating.
- Inspect how command-following, pending external confirmation, paused live updates, and degraded slices are surfaced.
- Compare freshness signaling across patient, staff, support, operations, and governance surfaces.
- Move from diagnosis into implementation as soon as the governing model is clear; do not leave the task as analysis-only commentary.

Required remediation work:
- Convert the discovered failure modes into a concrete target design and implement that design across the affected layers.
- Remove or refactor the unsafe paths so the system no longer depends on operator vigilance, local convention, or lucky sequencing.
- For each unsafe condition, carry the fix through the owning algorithm, contracts, storage, integrations, and user-facing state until the failure is removed or explicitly governed.
- Find all places where stale or partial projections still expose fresh-seeming CTAs or calm status language.
- Detect inconsistencies between shell-level freshness, region-level freshness, and governing object actionability.
- Surface where live-channel connection state is used as a proxy for projection freshness.
- Examine whether partially stale slices localize degradation correctly or pollute the whole shell unnecessarily.
- Identify cases where pending confirmation, stale review, read-only recovery, and disconnected states are visually collapsed into one ambiguous status.

Implementation posture:
- Choose the remediation that definitively closes the failure class, even if that requires non-trivial refactoring.
- Implement the end-state architecture and algorithm, not just the analysis of it.
- Prefer deleting, consolidating, or hardening weak paths over documenting them or layering more conditional logic on top.
- Do not solve this by adding another badge.
- Prefer one authoritative freshness model spanning shell, region, anchor, and command-following semantics.
- If freshness is computed ad hoc in multiple layers, consolidate it into typed posture contracts.
- Ensure freshness signaling drives actionability honestly, not just cosmetics.

Produce:
1. A concise description of the current failure mode, its blast radius, and the target end-state.
2. The exact algorithmic, architectural, schema, contract, runtime, and interface changes required to eliminate the issue.
3. The concrete code, migration, configuration, and data-shape changes you will apply, or an exact executable patch plan if the environment is truly read-only.
4. The invariants, state-transition rules, guardrails, and recovery semantics enforced by the new design.
5. The verification suite needed to prove the remediation, including unit, integration, contract, replay, recovery, concurrency, and end-to-end coverage as applicable.
6. The rollout, backfill, reindex, compatibility, and operational validation plan required to land the fix safely.
7. Residual risks only if they remain after implementation, plus the exact evidence required to close them.

Optimize for definitive elimination of `Projection Freshness Mis-Signaling` through coherent algorithmic and architectural remediation, with durable invariants, safe rollout, and proof-backed correctness. The task is not complete at diagnosis; finish only when the strongest viable remediation is implemented and proven, or reduced to an exact executable change set for a truly read-only environment.
