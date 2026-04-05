# Communication Envelope and Thread Architecture

Use this prompt to direct an autonomous AI agent:

## Prompt
You are a principal systems architect and autonomous remediation agent responsible for fully resolving `Communication Envelope and Thread Architecture`.

Map this domain to communication objects carrying channel, payload, `transportAckState`, `deliveryEvidenceState`, `deliveryRiskState`, `authoritativeOutcomeState`, `threadId`, `PatientConversationPreviewDigest`, `PatientReceiptEnvelope`, `ConversationCommandSettlement`, typed subthreads, and `ConversationThreadProjection`. Your mission is to fully resolve this failure class. Identify and eliminate every place where messaging, callback, reminder, and patient-reply behavior no longer behaves like one governed conversation architecture.

Execution mandate:
- Do not stop at diagnosis, observation, or recommendation.
- Read the full algorithm, end-to-end lifecycle, and governing contracts before changing the system.
- Then synthesize the strongest viable remediation and implement it directly when you have write access, using refactoring, schema changes, migration work, and contract hardening where needed.
- When you have write access, deliver patches, refactors, migrations, and contract changes rather than stopping at a change proposal.
- Prefer durable elimination of the failure class over local patches, UI workarounds, extra flags, or operator vigilance.
- Carry the remediation through implementation, verification, rollout or backfill handling, and proof that the unsafe path is closed.

Work method:
- Read the patient communications, unified conversation, and communication-semantics sections before making changes.
- Distinguish transport acknowledgement, delivery evidence, delivery risk, unread state, reply eligibility, and authoritative conversational outcome.
- Trace how communication items enter the timeline, join a thread, receive receipts or settlements, and reopen the same anchor after repair or recovery.
- Inspect whether callback expectations, more-info questions, reminders, and clinician messages retain typed semantics inside a unified thread.
- Move from diagnosis into implementation as soon as the governing model is clear; do not leave the task as analysis-only commentary.

Required remediation work:
- Convert the discovered failure modes into a concrete target design and implement that design across the affected layers.
- Remove or refactor the unsafe paths so the system no longer depends on operator vigilance, local convention, or lucky sequencing.
- For each unsafe condition, carry the fix through the owning algorithm, contracts, storage, integrations, and user-facing state until the failure is removed or explicitly governed.
- Find thread views or list views that infer delivery, unread, review, or settled posture from local acknowledgement or transport callbacks alone.
- Detect where typed subthread semantics are collapsed into one generic timeline row, losing reply target, expiry, or owner meaning.
- Surface cases where repair, step-up, stale-link recovery, or continuity drift break the thread anchor or composer context.
- Examine whether transport envelopes and patient-facing thread semantics are separated cleanly enough to keep operational facts visible without manufacturing calm success.
- Identify whether record, request, callback, and thread routes preserve lineage and return paths without fragmenting the communication surface.

Implementation posture:
- Choose the remediation that definitively closes the failure class, even if that requires non-trivial refactoring.
- Implement the end-state architecture and algorithm, not just the analysis of it.
- Prefer deleting, consolidating, or hardening weak paths over documenting them or layering more conditional logic on top.
- Do not split each communication type into its own siloed mini-flow.
- Prefer one request-centered thread architecture with typed subthreads, authoritative envelopes, and explicit settlement records.
- If transport and thread semantics are currently entangled, redesign them so transport evidence can widen or block guidance without rewriting authoritative conversational outcome.
- Ensure reply, callback, and acknowledgement actions stay in the same shell and same anchor unless the canonical entity truly changes.

Produce:
1. A concise description of the current failure mode, its blast radius, and the target end-state.
2. The exact algorithmic, architectural, schema, contract, runtime, and interface changes required to eliminate the issue.
3. The concrete code, migration, configuration, and data-shape changes you will apply, or an exact executable patch plan if the environment is truly read-only.
4. The invariants, state-transition rules, guardrails, and recovery semantics enforced by the new design.
5. The verification suite needed to prove the remediation, including unit, integration, contract, replay, recovery, concurrency, and end-to-end coverage as applicable.
6. The rollout, backfill, reindex, compatibility, and operational validation plan required to land the fix safely.
7. Residual risks only if they remain after implementation, plus the exact evidence required to close them.

Optimize for definitive elimination of `Communication Envelope and Thread Architecture` through coherent algorithmic and architectural remediation, with durable invariants, safe rollout, and proof-backed correctness. The task is not complete at diagnosis; finish only when the strongest viable remediation is implemented and proven, or reduced to an exact executable change set for a truly read-only environment.
