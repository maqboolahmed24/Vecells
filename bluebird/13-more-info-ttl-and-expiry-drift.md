# MoreInfo TTL And Expiry Drift

Use this prompt to direct an autonomous AI agent:

## Prompt
You are a principal systems architect and autonomous remediation agent responsible for fully resolving `MoreInfo TTL And Expiry Drift`.

Map this domain to `MoreInfoCycle`, reply windows, TTL policies, reminders, supersession, late replies, recovery routes, and any equivalent request-for-information loop. Your mission is to fully resolve this failure class. Identify and eliminate every place where information-request windows expire inconsistently, remain open too long, accept stale replies, or diverge between patient view, staff view, and backend authority.

Execution mandate:
- Do not stop at diagnosis, observation, or recommendation.
- Read the full algorithm, end-to-end lifecycle, and governing contracts before changing the system.
- Then synthesize the strongest viable remediation and implement it directly when you have write access, using refactoring, schema changes, migration work, and contract hardening where needed.
- When you have write access, deliver patches, refactors, migrations, and contract changes rather than stopping at a change proposal.
- Prefer durable elimination of the failure class over local patches, UI workarounds, extra flags, or operator vigilance.
- Carry the remediation through implementation, verification, rollout or backfill handling, and proof that the unsafe path is closed.

Work method:
- Read the entire more-info lifecycle from request creation through send, reminder, response, expiry, supersession, and reopen.
- Trace how due times, reminder schedules, expiry state, and allowable reply actions are computed and enforced.
- Inspect how patient route contracts, secure links, grants, and shell recovery behave near expiry boundaries.
- Examine whether late, duplicate, or superseded replies are handled consistently across ingestion, UI, and queueing.
- Move from diagnosis into implementation as soon as the governing model is clear; do not leave the task as analysis-only commentary.

Required remediation work:
- Convert the discovered failure modes into a concrete target design and implement that design across the affected layers.
- Remove or refactor the unsafe paths so the system no longer depends on operator vigilance, local convention, or lucky sequencing.
- For each unsafe condition, carry the fix through the owning algorithm, contracts, storage, integrations, and user-facing state until the failure is removed or explicitly governed.
- Find where TTL is calculated in more than one place or from non-authoritative clocks.
- Detect cases where expired requests still appear actionable, or active ones appear blocked.
- Surface how a materially useful late reply is classified versus a stale or unsafe one.
- Examine whether reminders, callback alternatives, and recovery guidance stay aligned with actual expiry posture.
- Identify whether `MoreInfoCycle` has its own lifecycle lease and whether closure remains blocked correctly while it is active.

Implementation posture:
- Choose the remediation that definitively closes the failure class, even if that requires non-trivial refactoring.
- Implement the end-state architecture and algorithm, not just the analysis of it.
- Prefer deleting, consolidating, or hardening weak paths over documenting them or layering more conditional logic on top.
- Do not patch this with a front-end countdown alone.
- Prefer one authoritative expiry model, one reply-acceptance contract, and explicit same-shell recovery posture.
- If TTL, reminders, and response assimilation are fragmented across services, consolidate orchestration.
- Ensure the system can explain why a response was accepted, routed to review, marked superseded, or rejected.

Produce:
1. A concise description of the current failure mode, its blast radius, and the target end-state.
2. The exact algorithmic, architectural, schema, contract, runtime, and interface changes required to eliminate the issue.
3. The concrete code, migration, configuration, and data-shape changes you will apply, or an exact executable patch plan if the environment is truly read-only.
4. The invariants, state-transition rules, guardrails, and recovery semantics enforced by the new design.
5. The verification suite needed to prove the remediation, including unit, integration, contract, replay, recovery, concurrency, and end-to-end coverage as applicable.
6. The rollout, backfill, reindex, compatibility, and operational validation plan required to land the fix safely.
7. Residual risks only if they remain after implementation, plus the exact evidence required to close them.

Optimize for definitive elimination of `MoreInfo TTL And Expiry Drift` through coherent algorithmic and architectural remediation, with durable invariants, safe rollout, and proof-backed correctness. The task is not complete at diagnosis; finish only when the strongest viable remediation is implemented and proven, or reduced to an exact executable change set for a truly read-only environment.
