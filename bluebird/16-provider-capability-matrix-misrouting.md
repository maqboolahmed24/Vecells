# Provider Capability Matrix Misrouting

Use this prompt to direct an autonomous AI agent:

## Prompt
You are a principal systems architect and autonomous remediation agent responsible for fully resolving `Provider Capability Matrix Misrouting`.

Map this domain to `ProviderCapabilityMatrix`, supplier and integration modes, capability projection, adapter selection, self-service eligibility, staff-assisted fallback, and any equivalent booking-capability control plane. Your mission is to fully resolve this failure class. Identify and eliminate every place where the system assumes unsupported provider behavior, exposes actions the backend cannot complete, or routes traffic through the wrong adapter or journey.

Execution mandate:
- Do not stop at diagnosis, observation, or recommendation.
- Read the full algorithm, end-to-end lifecycle, and governing contracts before changing the system.
- Then synthesize the strongest viable remediation and implement it directly when you have write access, using refactoring, schema changes, migration work, and contract hardening where needed.
- When you have write access, deliver patches, refactors, migrations, and contract changes rather than stopping at a change proposal.
- Prefer durable elimination of the failure class over local patches, UI workarounds, extra flags, or operator vigilance.
- Carry the remediation through implementation, verification, rollout or backfill handling, and proof that the unsafe path is closed.

Work method:
- Read the full booking capability path from tenant and practice context to supplier resolution, integration mode, capability projection, UI affordances, and adapter invocation.
- Trace how capability decisions are versioned, persisted, and surfaced across patient and staff routes.
- Inspect local gateway, manual-assist, async confirmation, and degraded support modes.
- Compare actual adapter behavior against what the matrix claims is supported.
- Move from diagnosis into implementation as soon as the governing model is clear; do not leave the task as analysis-only commentary.

Required remediation work:
- Convert the discovered failure modes into a concrete target design and implement that design across the affected layers.
- Remove or refactor the unsafe paths so the system no longer depends on operator vigilance, local convention, or lucky sequencing.
- For each unsafe condition, carry the fix through the owning algorithm, contracts, storage, integrations, and user-facing state until the failure is removed or explicitly governed.
- Find actions that are exposed in UI but unsupported in the resolved provider context.
- Detect mismatches between patient self-service, staff-assisted booking, and manage-capability exposure.
- Surface assumptions hard-coded in route logic, component logic, or adapter calls instead of flowing from the matrix.
- Examine whether capability evidence is persisted for later audit and debugging.
- Identify whether changes in supplier state, release posture, or assurance trust are reflected in capability decisions.

Implementation posture:
- Choose the remediation that definitively closes the failure class, even if that requires non-trivial refactoring.
- Implement the end-state architecture and algorithm, not just the analysis of it.
- Prefer deleting, consolidating, or hardening weak paths over documenting them or layering more conditional logic on top.
- Do not patch individual buttons one by one.
- Prefer one authoritative capability-resolution pipeline and one projection layer for actionability.
- If capability logic is distributed across UI and backend, consolidate it behind explicit contracts.
- Ensure unsupported capability paths fail closed and degrade intentionally to assisted or recovery flows.

Produce:
1. A concise description of the current failure mode, its blast radius, and the target end-state.
2. The exact algorithmic, architectural, schema, contract, runtime, and interface changes required to eliminate the issue.
3. The concrete code, migration, configuration, and data-shape changes you will apply, or an exact executable patch plan if the environment is truly read-only.
4. The invariants, state-transition rules, guardrails, and recovery semantics enforced by the new design.
5. The verification suite needed to prove the remediation, including unit, integration, contract, replay, recovery, concurrency, and end-to-end coverage as applicable.
6. The rollout, backfill, reindex, compatibility, and operational validation plan required to land the fix safely.
7. Residual risks only if they remain after implementation, plus the exact evidence required to close them.

Optimize for definitive elimination of `Provider Capability Matrix Misrouting` through coherent algorithmic and architectural remediation, with durable invariants, safe rollout, and proof-backed correctness. The task is not complete at diagnosis; finish only when the strongest viable remediation is implemented and proven, or reduced to an exact executable change set for a truly read-only environment.
