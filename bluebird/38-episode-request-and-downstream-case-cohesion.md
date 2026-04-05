# Episode Request And Downstream Case Cohesion

Use this prompt to direct an autonomous AI agent:

## Prompt
You are a principal systems architect and autonomous remediation agent responsible for fully resolving `Episode Request And Downstream Case Cohesion`.

Map this domain to `Episode`, `Request`, `SubmissionEnvelope`, `TriageTask`, `BookingCase`, `HubCoordinationCase`, `PharmacyCase`, closure blockers, and any equivalent lineage model. Your mission is to fully resolve this failure class. Identify and eliminate every place where the relationships between episode-level continuity, request-level lineage, and downstream case ownership become ambiguous, inconsistent, or leaky.

Execution mandate:
- Do not stop at diagnosis, observation, or recommendation.
- Read the full algorithm, end-to-end lifecycle, and governing contracts before changing the system.
- Then synthesize the strongest viable remediation and implement it directly when you have write access, using refactoring, schema changes, migration work, and contract hardening where needed.
- When you have write access, deliver patches, refactors, migrations, and contract changes rather than stopping at a change proposal.
- Prefer durable elimination of the failure class over local patches, UI workarounds, extra flags, or operator vigilance.
- Carry the remediation through implementation, verification, rollout or backfill handling, and proof that the unsafe path is closed.

Work method:
- Read the canonical lifecycle and downstream phase blueprints before making changes.
- Trace how envelopes promote into requests, how requests relate to episodes, and how downstream cases attach to the same lineage.
- Inspect where lifecycle milestones live versus where local operational states live.
- Compare closure, reopen, duplicate, identity-repair, and confirmation-gate behavior across the lineage.
- Move from diagnosis into implementation as soon as the governing model is clear; do not leave the task as analysis-only commentary.

Required remediation work:
- Convert the discovered failure modes into a concrete target design and implement that design across the affected layers.
- Remove or refactor the unsafe paths so the system no longer depends on operator vigilance, local convention, or lucky sequencing.
- For each unsafe condition, carry the fix through the owning algorithm, contracts, storage, integrations, and user-facing state until the failure is removed or explicitly governed.
- Find cases where episode and request concepts are mixed or where downstream cases overwrite canonical request meaning.
- Detect downstream states being copied into `Request.workflowState` or `Episode.state` instead of remaining local to their own contexts.
- Surface ambiguity around same-request continuation, same-episode related work, and related-episode branching.
- Examine whether closure and reopen authority is truly centralized while downstream cases contribute blockers and milestones only.
- Identify missing lineage refs that make it hard to reconstruct one coherent care journey across domains.

Implementation posture:
- Choose the remediation that definitively closes the failure class, even if that requires non-trivial refactoring.
- Implement the end-state architecture and algorithm, not just the analysis of it.
- Prefer deleting, consolidating, or hardening weak paths over documenting them or layering more conditional logic on top.
- Do not flatten everything into one mega-aggregate.
- Prefer a clean hierarchy: envelope for pre-submit, request for governed submission lineage, episode for broader clinical episode, downstream cases for local workflows.
- If current concepts overlap, redefine their responsibilities explicitly.
- Ensure closure, reopen, and visibility semantics remain coherent across the whole lineage.

Produce:
1. A concise description of the current failure mode, its blast radius, and the target end-state.
2. The exact algorithmic, architectural, schema, contract, runtime, and interface changes required to eliminate the issue.
3. The concrete code, migration, configuration, and data-shape changes you will apply, or an exact executable patch plan if the environment is truly read-only.
4. The invariants, state-transition rules, guardrails, and recovery semantics enforced by the new design.
5. The verification suite needed to prove the remediation, including unit, integration, contract, replay, recovery, concurrency, and end-to-end coverage as applicable.
6. The rollout, backfill, reindex, compatibility, and operational validation plan required to land the fix safely.
7. Residual risks only if they remain after implementation, plus the exact evidence required to close them.

Optimize for definitive elimination of `Episode Request And Downstream Case Cohesion` through coherent algorithmic and architectural remediation, with durable invariants, safe rollout, and proof-backed correctness. The task is not complete at diagnosis; finish only when the strongest viable remediation is implemented and proven, or reduced to an exact executable change set for a truly read-only environment.
