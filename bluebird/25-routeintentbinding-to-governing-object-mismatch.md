# RouteIntentBinding To Governing-Object Mismatch

Use this prompt to direct an autonomous AI agent:

## Prompt
You are a principal systems architect and autonomous remediation agent responsible for fully resolving `RouteIntentBinding To Governing-Object Mismatch`.

Map this domain to `RouteIntentBinding`, `ScopedMutationGate`, `CommandActionRecord`, governing-object refs, route family contracts, capability leases, and any equivalent action-routing control plane. Your mission is to fully resolve this failure class. Identify and eliminate every place where routes, actions, or UI controls target one object while server-side mutation authority resolves another, or where stale route context allows commands to execute against the wrong lineage or object version.

Execution mandate:
- Do not stop at diagnosis, observation, or recommendation.
- Read the full algorithm, end-to-end lifecycle, and governing contracts before changing the system.
- Then synthesize the strongest viable remediation and implement it directly when you have write access, using refactoring, schema changes, migration work, and contract hardening where needed.
- When you have write access, deliver patches, refactors, migrations, and contract changes rather than stopping at a change proposal.
- Prefer durable elimination of the failure class over local patches, UI workarounds, extra flags, or operator vigilance.
- Carry the remediation through implementation, verification, rollout or backfill handling, and proof that the unsafe path is closed.

Work method:
- Read the full post-submit mutation path before making changes., from route entry and action rendering through command dispatch and settlement.
- Inspect patient, staff, support, booking, hub, and pharmacy mutation routes.
- Trace how route intent binds to action scope, governing object, entity version, release posture, trust state, and recovery behavior.
- Compare what the UI believes it is acting on with what the backend actually mutates.
- Move from diagnosis into implementation as soon as the governing model is clear; do not leave the task as analysis-only commentary.

Required remediation work:
- Convert the discovered failure modes into a concrete target design and implement that design across the affected layers.
- Remove or refactor the unsafe paths so the system no longer depends on operator vigilance, local convention, or lucky sequencing.
- For each unsafe condition, carry the fix through the owning algorithm, contracts, storage, integrations, and user-facing state until the failure is removed or explicitly governed.
- Find CTAs or route handlers that derive governing-object identity from stale local state, URL params, or detached projection fragments.
- Detect actions that can survive subject binding drift, session drift, route supersession, lineage fence advancement, or publication drift.
- Surface where multiple possible governing objects exist but the system does not disambiguate them explicitly.
- Examine whether recovery posture is correctly triggered when route intent no longer matches current object truth.
- Identify whether authoritative settlement records and audit can reconstruct the exact route intent and object target.

Implementation posture:
- Choose the remediation that definitively closes the failure class, even if that requires non-trivial refactoring.
- Implement the end-state architecture and algorithm, not just the analysis of it.
- Prefer deleting, consolidating, or hardening weak paths over documenting them or layering more conditional logic on top.
- Do not just add extra server-side lookups.
- Prefer one explicit route-intent envelope tied to one governing object, one action scope, and one current version fence.
- If routes currently encode too much authority implicitly, redesign the boundary between route, projection, and mutation gate.
- Ensure stale route context becomes bounded recovery, not accidental cross-object mutation.

Produce:
1. A concise description of the current failure mode, its blast radius, and the target end-state.
2. The exact algorithmic, architectural, schema, contract, runtime, and interface changes required to eliminate the issue.
3. The concrete code, migration, configuration, and data-shape changes you will apply, or an exact executable patch plan if the environment is truly read-only.
4. The invariants, state-transition rules, guardrails, and recovery semantics enforced by the new design.
5. The verification suite needed to prove the remediation, including unit, integration, contract, replay, recovery, concurrency, and end-to-end coverage as applicable.
6. The rollout, backfill, reindex, compatibility, and operational validation plan required to land the fix safely.
7. Residual risks only if they remain after implementation, plus the exact evidence required to close them.

Optimize for definitive elimination of `RouteIntentBinding To Governing-Object Mismatch` through coherent algorithmic and architectural remediation, with durable invariants, safe rollout, and proof-backed correctness. The task is not complete at diagnosis; finish only when the strongest viable remediation is implemented and proven, or reduced to an exact executable change set for a truly read-only environment.
