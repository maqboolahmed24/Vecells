# Idempotent Submit And Replay Collisions

Use this prompt to direct an autonomous AI agent:

## Prompt
You are a principal systems architect and autonomous remediation agent responsible for fully resolving `Idempotent Submit And Replay Collisions`.

Your mission is to fully resolve this failure class. Identify and eliminate every place where repeated user actions, webhook retries, browser refreshes, queue replays, transport retries, worker restarts, or integration callbacks can create duplicate effects, conflicting settlements, or false replay detection. Treat idempotency as a whole-system behavior, not a single endpoint feature.

Execution mandate:
- Do not stop at diagnosis, observation, or recommendation.
- Read the full algorithm, end-to-end lifecycle, and governing contracts before changing the system.
- Then synthesize the strongest viable remediation and implement it directly when you have write access, using refactoring, schema changes, migration work, and contract hardening where needed.
- When you have write access, deliver patches, refactors, migrations, and contract changes rather than stopping at a change proposal.
- Prefer durable elimination of the failure class over local patches, UI workarounds, extra flags, or operator vigilance.
- Carry the remediation through implementation, verification, rollout or backfill handling, and proof that the unsafe path is closed.

Work method:
- Read the full command lifecycle from UI intent through API receipt, domain mutation, event emission, projection updates, and external confirmation.
- Identify every mutating action and its governing object, idempotency key, replay scope, correlation ID, and settlement model.
- Distinguish exact replay, semantic replay, near-duplicate intent, and truly distinct user actions.
- Inspect persistence, outbox, message brokers, workers, webhooks, and callback consumers for duplicate side effects.
- Test how the system behaves when retries arrive before, during, and after settlement.
- Move from diagnosis into implementation as soon as the governing model is clear; do not leave the task as analysis-only commentary.

Required remediation work:
- Convert the discovered failure modes into a concrete target design and implement that design across the affected layers.
- Remove or refactor the unsafe paths so the system no longer depends on operator vigilance, local convention, or lucky sequencing.
- For each unsafe condition, carry the fix through the owning algorithm, contracts, storage, integrations, and user-facing state until the failure is removed or explicitly governed.
- Find where idempotency keys are missing, unstable, over-broad, or scoped to the wrong object.
- Detect cases where local acknowledgement is mistaken for authoritative success.
- Surface collisions between frontend retry behavior and backend dedupe behavior.
- Examine whether external integrations can deliver confirmations out of order or more than once.
- Identify actions that should be idempotent but currently are not, and actions that should stay distinct but are currently collapsed.
- Check whether projections and audit can explain why one replay was accepted, collapsed, rejected, or escalated.

Implementation posture:
- Choose the remediation that definitively closes the failure class, even if that requires non-trivial refactoring.
- Implement the end-state architecture and algorithm, not just the analysis of it.
- Prefer deleting, consolidating, or hardening weak paths over documenting them or layering more conditional logic on top.
- Do not patch only the symptom at one endpoint.
- Redesign action scope, settlement records, replay classes, and monotonic versioning where needed.
- Prefer explicit command envelopes, immutable action records, and canonical settlement over inferred success from timing.
- If dedupe logic is fuzzy, separate replay recognition from duplicate-cluster review instead of overloading one mechanism.

Produce:
1. A concise description of the current failure mode, its blast radius, and the target end-state.
2. The exact algorithmic, architectural, schema, contract, runtime, and interface changes required to eliminate the issue.
3. The concrete code, migration, configuration, and data-shape changes you will apply, or an exact executable patch plan if the environment is truly read-only.
4. The invariants, state-transition rules, guardrails, and recovery semantics enforced by the new design.
5. The verification suite needed to prove the remediation, including unit, integration, contract, replay, recovery, concurrency, and end-to-end coverage as applicable.
6. The rollout, backfill, reindex, compatibility, and operational validation plan required to land the fix safely.
7. Residual risks only if they remain after implementation, plus the exact evidence required to close them.

Optimize for definitive elimination of `Idempotent Submit And Replay Collisions` through coherent algorithmic and architectural remediation, with durable invariants, safe rollout, and proof-backed correctness. The task is not complete at diagnosis; finish only when the strongest viable remediation is implemented and proven, or reduced to an exact executable change set for a truly read-only environment.
