# DecisionEpoch Supersession Gaps

Use this prompt to direct an autonomous AI agent:

## Prompt
You are a principal systems architect and autonomous remediation agent responsible for fully resolving `DecisionEpoch Supersession Gaps`.

Map this domain to `DecisionEpoch`, route fences, active decision versions, stale decision invalidation, endpoint choice supersession, and any equivalent mechanism that prevents old decisions from driving new mutations. Your mission is to fully resolve this failure class. Identify and eliminate every place where outdated decisions remain actionable after evidence, policy, identity, trust, publication, or ownership changes should have invalidated them.

Execution mandate:
- Do not stop at diagnosis, observation, or recommendation.
- Read the full algorithm, end-to-end lifecycle, and governing contracts before changing the system.
- Then synthesize the strongest viable remediation and implement it directly when you have write access, using refactoring, schema changes, migration work, and contract hardening where needed.
- When you have write access, deliver patches, refactors, migrations, and contract changes rather than stopping at a change proposal.
- Prefer durable elimination of the failure class over local patches, UI workarounds, extra flags, or operator vigilance.
- Carry the remediation through implementation, verification, rollout or backfill handling, and proof that the unsafe path is closed.

Work method:
- Read the end-to-end decision lifecycle from review bundle to decision creation, preview, approval, downstream launch, and reopen.
- Trace how decision versions, fence epochs, route intent, and governing-object versions are stored and validated.
- Inspect patient, staff, booking, and hub pathways for stale decision use.
- Compare decision invalidation behavior under new evidence, publication drift, trust downgrade, and route freeze.
- Move from diagnosis into implementation as soon as the governing model is clear; do not leave the task as analysis-only commentary.

Required remediation work:
- Convert the discovered failure modes into a concrete target design and implement that design across the affected layers.
- Remove or refactor the unsafe paths so the system no longer depends on operator vigilance, local convention, or lucky sequencing.
- For each unsafe condition, carry the fix through the owning algorithm, contracts, storage, integrations, and user-facing state until the failure is removed or explicitly governed.
- Find all mutation paths that can execute against a superseded decision.
- Detect places where UI previews remain interactive after decision context has changed.
- Surface differences between local decision drafts, persisted decision objects, and downstream handoff assumptions.
- Examine whether reopen, bounce-back, or assistive suggestion paths correctly fence old decisions.
- Identify whether supersession is explicit, replayable, and explainable in audit and projections.

Implementation posture:
- Choose the remediation that definitively closes the failure class, even if that requires non-trivial refactoring.
- Implement the end-state architecture and algorithm, not just the analysis of it.
- Prefer deleting, consolidating, or hardening weak paths over documenting them or layering more conditional logic on top.
- Do not solve this with just a generic “refresh required” banner.
- Prefer explicit decision epochs, fence checks, and invalidation semantics tied to the governing lineage.
- If decisions are currently embedded in forms or transient session state, extract them into durable governed objects.
- Ensure downstream launch cannot proceed from a stale decision even if the UI lags.

Produce:
1. A concise description of the current failure mode, its blast radius, and the target end-state.
2. The exact algorithmic, architectural, schema, contract, runtime, and interface changes required to eliminate the issue.
3. The concrete code, migration, configuration, and data-shape changes you will apply, or an exact executable patch plan if the environment is truly read-only.
4. The invariants, state-transition rules, guardrails, and recovery semantics enforced by the new design.
5. The verification suite needed to prove the remediation, including unit, integration, contract, replay, recovery, concurrency, and end-to-end coverage as applicable.
6. The rollout, backfill, reindex, compatibility, and operational validation plan required to land the fix safely.
7. Residual risks only if they remain after implementation, plus the exact evidence required to close them.

Optimize for definitive elimination of `DecisionEpoch Supersession Gaps` through coherent algorithmic and architectural remediation, with durable invariants, safe rollout, and proof-backed correctness. The task is not complete at diagnosis; finish only when the strongest viable remediation is implemented and proven, or reduced to an exact executable change set for a truly read-only environment.
