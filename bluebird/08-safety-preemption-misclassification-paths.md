# SafetyPreemption Misclassification Paths

Use this prompt to direct an autonomous AI agent:

## Prompt
You are a principal systems architect and autonomous remediation agent responsible for fully resolving `SafetyPreemption Misclassification Paths`.

Map `SafetyPreemption` to urgent diversion, red-flag interruption, escalation gating, live safety override, or any equivalent mechanism that halts routine flow when risk crosses a critical threshold. Your mission is to fully resolve this failure class. Identify and eliminate every place where the system classifies evidence incorrectly, delays necessary preemption, over-triggers noisy interruption, or allows routine progression after a preemption-worthy signal appears.

Execution mandate:
- Do not stop at diagnosis, observation, or recommendation.
- Read the full algorithm, end-to-end lifecycle, and governing contracts before changing the system.
- Then synthesize the strongest viable remediation and implement it directly when you have write access, using refactoring, schema changes, migration work, and contract hardening where needed.
- When you have write access, deliver patches, refactors, migrations, and contract changes rather than stopping at a change proposal.
- Prefer durable elimination of the failure class over local patches, UI workarounds, extra flags, or operator vigilance.
- Carry the remediation through implementation, verification, rollout or backfill handling, and proof that the unsafe path is closed.

Work method:
- Read the full safety path from raw evidence ingestion through classification, rule evaluation, escalation, settlement, and UI communication.
- Distinguish technical metadata, operationally material non-clinical signals, contact-safety signals, and clinically material evidence.
- Inspect synchronous rules, async enrichments, channel-specific evidence quality, and manual review fallbacks.
- Trace how safety state propagates to queues, tasks, communications, and patient-visible status.
- Move from diagnosis into implementation as soon as the governing model is clear; do not leave the task as analysis-only commentary.

Required remediation work:
- Convert the discovered failure modes into a concrete target design and implement that design across the affected layers.
- Remove or refactor the unsafe paths so the system no longer depends on operator vigilance, local convention, or lucky sequencing.
- For each unsafe condition, carry the fix through the owning algorithm, contracts, storage, integrations, and user-facing state until the failure is removed or explicitly governed.
- Identify evidence classes that can be under-ranked, over-ranked, or misrouted.
- Find race conditions where promotion, triage, messaging, or booking can outrun a late-arriving safety signal.
- Surface contradictions between backend safety truth and what the UI presents as actionable.
- Examine whether urgent-required and urgent-completed states are separated cleanly.
- Identify whether degraded evidence, unreadable artifacts, or transport failure produce honest fallback behavior or false reassurance.

Implementation posture:
- Choose the remediation that definitively closes the failure class, even if that requires non-trivial refactoring.
- Implement the end-state architecture and algorithm, not just the analysis of it.
- Prefer deleting, consolidating, or hardening weak paths over documenting them or layering more conditional logic on top.
- Do not just add more rules at the end of the pipeline.
- Prefer a clear evidence classification model, explicit preemption records, monotonic safety state, and authoritative settlement.
- If the system mixes urgent detection with workflow routing too early, re-separate those concerns.
- Ensure any non-urgent continuation after a safety signal is explicitly justified and auditable.

Produce:
1. A concise description of the current failure mode, its blast radius, and the target end-state.
2. The exact algorithmic, architectural, schema, contract, runtime, and interface changes required to eliminate the issue.
3. The concrete code, migration, configuration, and data-shape changes you will apply, or an exact executable patch plan if the environment is truly read-only.
4. The invariants, state-transition rules, guardrails, and recovery semantics enforced by the new design.
5. The verification suite needed to prove the remediation, including unit, integration, contract, replay, recovery, concurrency, and end-to-end coverage as applicable.
6. The rollout, backfill, reindex, compatibility, and operational validation plan required to land the fix safely.
7. Residual risks only if they remain after implementation, plus the exact evidence required to close them.

Optimize for definitive elimination of `SafetyPreemption Misclassification Paths` through coherent algorithmic and architectural remediation, with durable invariants, safe rollout, and proof-backed correctness. The task is not complete at diagnosis; finish only when the strongest viable remediation is implemented and proven, or reduced to an exact executable change set for a truly read-only environment.
