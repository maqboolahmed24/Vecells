# Hub Offer-To-Confirmation State Drift

Use this prompt to direct an autonomous AI agent:

## Prompt
You are a principal systems architect and autonomous remediation agent responsible for fully resolving `Hub Offer-To-Confirmation State Drift`.

Map this domain to `HubCoordinationCase`, `AlternativeOfferSession`, `NetworkCandidateSnapshot`, `HubBookingEvidenceBundle`, `HubAppointmentRecord`, `PracticeAcknowledgementRecord`, and any equivalent network-coordination lifecycle. Your mission is to fully resolve this failure class. Identify and eliminate every place where hub offers, patient choice, native booking attempts, external confirmation, and origin-practice visibility drift apart so the case looks further along than the underlying network truth justifies.

Execution mandate:
- Do not stop at diagnosis, observation, or recommendation.
- Read the full algorithm, end-to-end lifecycle, and governing contracts before changing the system.
- Then synthesize the strongest viable remediation and implement it directly when you have write access, using refactoring, schema changes, migration work, and contract hardening where needed.
- When you have write access, deliver patches, refactors, migrations, and contract changes rather than stopping at a change proposal.
- Prefer durable elimination of the failure class over local patches, UI workarounds, extra flags, or operator vigilance.
- Carry the remediation through implementation, verification, rollout or backfill handling, and proof that the unsafe path is closed.

Work method:
- Read the entire hub coordination path from hub request through candidate ranking, alternative offers, patient choice, native booking, confirmation pending, practice acknowledgement, fallback, and closure.
- Trace how candidate freshness, offer expiry, booking evidence, confirmation confidence, and practice acknowledgement generations are stored and enforced.
- Inspect whether hub ownership, callback fallback, and return-to-practice work stay linked to the same coordination case.
- Compare what patient, hub staff, origin practice, and operations surfaces see at each state.
- Move from diagnosis into implementation as soon as the governing model is clear; do not leave the task as analysis-only commentary.

Required remediation work:
- Convert the discovered failure modes into a concrete target design and implement that design across the affected layers.
- Remove or refactor the unsafe paths so the system no longer depends on operator vigilance, local convention, or lucky sequencing.
- For each unsafe condition, carry the fix through the owning algorithm, contracts, storage, integrations, and user-facing state until the failure is removed or explicitly governed.
- Find cases where alternatives, selections, or booked posture remain live after candidate or offer expiry.
- Detect where native booking evidence is treated as confirmation before independent confirmation or practice acknowledgement exists.
- Surface cases that disappear from active oversight while confirmation or acknowledgement debt is still open.
- Examine whether callback fallback and return-to-practice paths are durably linked before the hub case advances.
- Identify whether closure rules actually honor all open blockers on the hub lineage.

Implementation posture:
- Choose the remediation that definitively closes the failure class, even if that requires non-trivial refactoring.
- Implement the end-state architecture and algorithm, not just the analysis of it.
- Prefer deleting, consolidating, or hardening weak paths over documenting them or layering more conditional logic on top.
- Do not flatten network coordination into a simpler local booking story.
- Prefer durable hub case states, explicit confirmation debt, acknowledgement debt, and fallback transfer semantics.
- If practice visibility and patient-facing truth are decoupled today, redesign the model so both derive from the same authoritative state machine.
- Keep hub alternatives, native booking, and fallback flows elegant for users but strict in domain semantics.

Produce:
1. A concise description of the current failure mode, its blast radius, and the target end-state.
2. The exact algorithmic, architectural, schema, contract, runtime, and interface changes required to eliminate the issue.
3. The concrete code, migration, configuration, and data-shape changes you will apply, or an exact executable patch plan if the environment is truly read-only.
4. The invariants, state-transition rules, guardrails, and recovery semantics enforced by the new design.
5. The verification suite needed to prove the remediation, including unit, integration, contract, replay, recovery, concurrency, and end-to-end coverage as applicable.
6. The rollout, backfill, reindex, compatibility, and operational validation plan required to land the fix safely.
7. Residual risks only if they remain after implementation, plus the exact evidence required to close them.

Optimize for definitive elimination of `Hub Offer-To-Confirmation State Drift` through coherent algorithmic and architectural remediation, with durable invariants, safe rollout, and proof-backed correctness. The task is not complete at diagnosis; finish only when the strongest viable remediation is implemented and proven, or reduced to an exact executable change set for a truly read-only environment.
