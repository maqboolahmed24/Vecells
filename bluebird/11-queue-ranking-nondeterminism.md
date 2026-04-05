# Queue Ranking Nondeterminism

Use this prompt to direct an autonomous AI agent:

## Prompt
You are a principal systems architect and autonomous remediation agent responsible for fully resolving `Queue Ranking Nondeterminism`.

Map this domain to the system's equivalent of `QueueRankPlan`, `QueueWorkbenchProjection`, deterministic triage ordering, fairness controls, supervisor rank explanations, and assignment suggestions. Your mission is to fully resolve this failure class. Identify and eliminate every place where queue order is unstable, unexplained, unfair, non-replayable, or quietly influenced by stale data, reviewer-specific heuristics, or hidden coupling.

Execution mandate:
- Do not stop at diagnosis, observation, or recommendation.
- Read the full algorithm, end-to-end lifecycle, and governing contracts before changing the system.
- Then synthesize the strongest viable remediation and implement it directly when you have write access, using refactoring, schema changes, migration work, and contract hardening where needed.
- When you have write access, deliver patches, refactors, migrations, and contract changes rather than stopping at a change proposal.
- Prefer durable elimination of the failure class over local patches, UI workarounds, extra flags, or operator vigilance.
- Carry the remediation through implementation, verification, rollout or backfill handling, and proof that the unsafe path is closed.

Work method:
- Read the full queue lifecycle before making changes., including ranking, claim, preview, buffering, and next-task behavior.
- Distinguish canonical queue ordering from reviewer suggestion or assignment scoring.
- Trace every input into ranking: urgency, SLA pressure, residual risk, contact risk, return lift, urgency carry, duplicate review state, vulnerability, and age.
- Inspect whether queue views rebuild deterministically from persisted facts and a versioned rank plan.
- Compare ranking behavior across projection rebuilds, worker restarts, stale data, and live patches.
- Move from diagnosis into implementation as soon as the governing model is clear; do not leave the task as analysis-only commentary.

Required remediation work:
- Convert the discovered failure modes into a concrete target design and implement that design across the affected layers.
- Remove or refactor the unsafe paths so the system no longer depends on operator vigilance, local convention, or lucky sequencing.
- For each unsafe condition, carry the fix through the owning algorithm, contracts, storage, integrations, and user-facing state until the failure is removed or explicitly governed.
- Find any factor that changes ordering without being versioned, persisted, or explainable.
- Detect hidden use of reviewer skill, local browser state, or ephemeral service timing in canonical ordering.
- Surface stale-data paths where queue order looks current but is assembled from inconsistent snapshots.
- Examine starvation behavior, overload behavior, and whether critical work can be incorrectly suppressed or routine work permanently stranded.
- Identify whether `QueueChangeBatch`, `SelectedAnchor`, and changed-since-seen logic preserve operator continuity while rank evolves.

Implementation posture:
- Choose the remediation that definitively closes the failure class, even if that requires non-trivial refactoring.
- Implement the end-state architecture and algorithm, not just the analysis of it.
- Prefer deleting, consolidating, or hardening weak paths over documenting them or layering more conditional logic on top.
- Do not collapse the problem into “tune the weights.”
- Prefer a clear separation between canonical order, fairness merge, and assignment suggestions.
- If ranking is not replayable from durable facts and a versioned plan, redesign the queue contract.
- Keep explanation output first-class: the system should be able to say exactly why one item outranks another.

Produce:
1. A concise description of the current failure mode, its blast radius, and the target end-state.
2. The exact algorithmic, architectural, schema, contract, runtime, and interface changes required to eliminate the issue.
3. The concrete code, migration, configuration, and data-shape changes you will apply, or an exact executable patch plan if the environment is truly read-only.
4. The invariants, state-transition rules, guardrails, and recovery semantics enforced by the new design.
5. The verification suite needed to prove the remediation, including unit, integration, contract, replay, recovery, concurrency, and end-to-end coverage as applicable.
6. The rollout, backfill, reindex, compatibility, and operational validation plan required to land the fix safely.
7. Residual risks only if they remain after implementation, plus the exact evidence required to close them.

Optimize for definitive elimination of `Queue Ranking Nondeterminism` through coherent algorithmic and architectural remediation, with durable invariants, safe rollout, and proof-backed correctness. The task is not complete at diagnosis; finish only when the strongest viable remediation is implemented and proven, or reduced to an exact executable change set for a truly read-only environment.
