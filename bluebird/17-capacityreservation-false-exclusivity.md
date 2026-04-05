# CapacityReservation False Exclusivity

Use this prompt to direct an autonomous AI agent:

## Prompt
You are a principal systems architect and autonomous remediation agent responsible for fully resolving `CapacityReservation False Exclusivity`.

Map this domain to `CapacityReservation`, `ReservationAuthority`, offer sessions, holds, soft selection, nonexclusive truth modes, booking transactions, waitlist holds, and any equivalent capacity-claim mechanism. Your mission is to fully resolve this failure class. Identify and eliminate every place where the system implies a slot or unit is reserved, held, or guaranteed when no authoritative exclusive reservation actually exists.

Execution mandate:
- Do not stop at diagnosis, observation, or recommendation.
- Read the full algorithm, end-to-end lifecycle, and governing contracts before changing the system.
- Then synthesize the strongest viable remediation and implement it directly when you have write access, using refactoring, schema changes, migration work, and contract hardening where needed.
- When you have write access, deliver patches, refactors, migrations, and contract changes rather than stopping at a change proposal.
- Prefer durable elimination of the failure class over local patches, UI workarounds, extra flags, or operator vigilance.
- Carry the remediation through implementation, verification, rollout or backfill handling, and proof that the unsafe path is closed.

Work method:
- Read the full reservation path from search results and offer creation through slot selection, revalidation, hold, commit, expiry, release, and waitlist reuse.
- Trace `canonicalReservationKey`, truth mode, hold support, reservation version, and supplier observation state.
- Compare UI language, timers, and affordances against real reservation semantics.
- Inspect adapter behavior, provider capability constraints, and degraded manual modes.
- Move from diagnosis into implementation as soon as the governing model is clear; do not leave the task as analysis-only commentary.

Required remediation work:
- Convert the discovered failure modes into a concrete target design and implement that design across the affected layers.
- Remove or refactor the unsafe paths so the system no longer depends on operator vigilance, local convention, or lucky sequencing.
- For each unsafe condition, carry the fix through the owning algorithm, contracts, storage, integrations, and user-facing state until the failure is removed or explicitly governed.
- Find all places where exclusive language or behavior is shown without real hold proof.
- Detect race conditions where multiple users can think they own the same capacity unit.
- Surface where waitlist, hub, or fallback flows reuse capacity semantics inconsistently.
- Examine whether release, expiry, and supersession are monotonic and auditable.
- Identify whether reservation state survives projection lag or adapter ambiguity in misleading ways.

Implementation posture:
- Choose the remediation that definitively closes the failure class, even if that requires non-trivial refactoring.
- Implement the end-state architecture and algorithm, not just the analysis of it.
- Prefer deleting, consolidating, or hardening weak paths over documenting them or layering more conditional logic on top.
- Do not fix this with copy changes alone if the domain model is wrong.
- Prefer one authoritative reservation service and explicit truth modes such as exclusive hold, truthful nonexclusive, and degraded manual pending.
- If UI countdowns or offer states imply guarantees not backed by the model, redesign the flow.
- Ensure downstream confirmation and manage flows inherit honest reservation truth.

Produce:
1. A concise description of the current failure mode, its blast radius, and the target end-state.
2. The exact algorithmic, architectural, schema, contract, runtime, and interface changes required to eliminate the issue.
3. The concrete code, migration, configuration, and data-shape changes you will apply, or an exact executable patch plan if the environment is truly read-only.
4. The invariants, state-transition rules, guardrails, and recovery semantics enforced by the new design.
5. The verification suite needed to prove the remediation, including unit, integration, contract, replay, recovery, concurrency, and end-to-end coverage as applicable.
6. The rollout, backfill, reindex, compatibility, and operational validation plan required to land the fix safely.
7. Residual risks only if they remain after implementation, plus the exact evidence required to close them.

Optimize for definitive elimination of `CapacityReservation False Exclusivity` through coherent algorithmic and architectural remediation, with durable invariants, safe rollout, and proof-backed correctness. The task is not complete at diagnosis; finish only when the strongest viable remediation is implemented and proven, or reduced to an exact executable change set for a truly read-only environment.
