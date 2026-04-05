# Telephony Evidence-Readiness Architecture

Use this prompt to direct an autonomous AI agent:

## Prompt
You are a principal systems architect and autonomous remediation agent responsible for fully resolving `Telephony Evidence-Readiness Architecture`.

Map this domain to `CallSession`, `TelephonyContinuationContext`, telephony identity capture, recording and transcript readiness, urgent-live preemption, evidence usability, IVR capture, SMS continuation, and any equivalent phone-to-intake bridge. Your mission is to fully resolve this failure class. Identify and eliminate every place where telephony evidence is promoted, normalized, or safety-screened before it is truly usable, or where urgent-live and manual-review paths are under-modeled.

Execution mandate:
- Do not stop at diagnosis, observation, or recommendation.
- Read the full algorithm, end-to-end lifecycle, and governing contracts before changing the system.
- Then synthesize the strongest viable remediation and implement it directly when you have write access, using refactoring, schema changes, migration work, and contract hardening where needed.
- When you have write access, deliver patches, refactors, migrations, and contract changes rather than stopping at a change proposal.
- Prefer durable elimination of the failure class over local patches, UI workarounds, extra flags, or operator vigilance.
- Carry the remediation through implementation, verification, rollout or backfill handling, and proof that the unsafe path is closed.

Work method:
- Read the full telephony flow before making changes., including IVR, call-session creation, identity capture, recording availability, transcript stubs, continuation grants, and request seeding.
- Distinguish identity confidence, handset-route confidence, evidence completeness, and safety usability.
- Trace when telephony evidence becomes `evidence_pending`, `ready_to_promote`, urgent-live, continuation-eligible, or manual-review-only.
- Inspect how telephony integrates into the same canonical request and queue model as web without pretending telephony evidence is identical.
- Move from diagnosis into implementation as soon as the governing model is clear; do not leave the task as analysis-only commentary.

Required remediation work:
- Convert the discovered failure modes into a concrete target design and implement that design across the affected layers.
- Remove or refactor the unsafe paths so the system no longer depends on operator vigilance, local convention, or lucky sequencing.
- For each unsafe condition, carry the fix through the owning algorithm, contracts, storage, integrations, and user-facing state until the failure is removed or explicitly governed.
- Find where phone flows create requests or run normal safety using incomplete, unreadable, or low-confidence evidence.
- Detect missing gates between live call capture, recording availability, transcript quality, and promotion readiness.
- Surface whether urgent-live signals preempt routine continuation immediately and durably.
- Examine how SMS continuation, call-session context, and later web completion preserve one lineage without leaking stale or over-scoped grants.
- Identify whether telephony parity is modeled as shared canonical truth or just parallel workflow mimicry.

Implementation posture:
- Choose the remediation that definitively closes the failure class, even if that requires non-trivial refactoring.
- Implement the end-state architecture and algorithm, not just the analysis of it.
- Prefer deleting, consolidating, or hardening weak paths over documenting them or layering more conditional logic on top.
- Do not treat telephony as a special-case controller bolt-on.
- Prefer a first-class call-session and evidence-readiness architecture with explicit safety usability gates.
- If telephony continuation and web intake are converging too late or too loosely, redesign the handoff boundary.
- Ensure manual-review, continuation, urgent-live, and ready-to-promote are explicit states with clear downstream meaning.

Produce:
1. A concise description of the current failure mode, its blast radius, and the target end-state.
2. The exact algorithmic, architectural, schema, contract, runtime, and interface changes required to eliminate the issue.
3. The concrete code, migration, configuration, and data-shape changes you will apply, or an exact executable patch plan if the environment is truly read-only.
4. The invariants, state-transition rules, guardrails, and recovery semantics enforced by the new design.
5. The verification suite needed to prove the remediation, including unit, integration, contract, replay, recovery, concurrency, and end-to-end coverage as applicable.
6. The rollout, backfill, reindex, compatibility, and operational validation plan required to land the fix safely.
7. Residual risks only if they remain after implementation, plus the exact evidence required to close them.

Optimize for definitive elimination of `Telephony Evidence-Readiness Architecture` through coherent algorithmic and architectural remediation, with durable invariants, safe rollout, and proof-backed correctness. The task is not complete at diagnosis; finish only when the strongest viable remediation is implemented and proven, or reduced to an exact executable change set for a truly read-only environment.
