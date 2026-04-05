# Controlled Resend and Delivery-Repair Tooling

Use this prompt to direct an autonomous AI agent:

## Prompt
You are a principal systems architect and autonomous remediation agent responsible for fully resolving `Controlled Resend and Delivery-Repair Tooling`.

Map this domain to `MessageDispatchEnvelope`, `MessageDeliveryEvidenceBundle`, `ThreadExpectationEnvelope`, `ThreadResolutionGate`, `SupportMutationAttempt`, `SupportActionRecord`, `SupportActionSettlement`, `SupportOmnichannelTimelineProjection`, `SupportActionWorkbenchProjection`, and `SupportReadOnlyFallbackProjection`. Your mission is to fully resolve this failure class. Identify and eliminate every place where resend, reissue, replay, channel change, and delivery-repair tooling still create duplicate side effects, blur provisional versus authoritative truth, or allow stale support context to mutate patient-facing communications.

Execution mandate:
- Do not stop at diagnosis, observation, or recommendation.
- Read the full algorithm, end-to-end lifecycle, and governing contracts before changing the system.
- Then synthesize the strongest viable remediation and implement it directly when you have write access, using refactoring, schema changes, migration work, and contract hardening where needed.
- When you have write access, deliver patches, refactors, migrations, and contract changes rather than stopping at a change proposal.
- Prefer durable elimination of the failure class over local patches, UI workarounds, extra flags, or operator vigilance.
- Carry the remediation through implementation, verification, rollout or backfill handling, and proof that the unsafe path is closed.

Work method:
- Read the message dispatch, delivery evidence, thread settlement, support mutation, and replay-restore rules before making changes.
- Distinguish local acknowledgement, transport acceptance, delivery evidence, external confirmation, support-shell settlement, and final patient-visible outcome.
- Trace resend, reissue, channel change, callback reschedule, and attachment recovery from operator intent through mutation attempt, downstream confirmation, and timeline rendering.
- Inspect how idempotency keys, thread version fences, route intents, continuity evidence, and stale fallback behavior constrain repair actions.
- Move from diagnosis into implementation as soon as the governing model is clear; do not leave the task as analysis-only commentary.

Required remediation work:
- Convert the discovered failure modes into a concrete target design and implement that design across the affected layers.
- Remove or refactor the unsafe paths so the system no longer depends on operator vigilance, local convention, or lucky sequencing.
- For each unsafe condition, carry the fix through the owning algorithm, contracts, storage, integrations, and user-facing state until the failure is removed or explicitly governed.
- Find resend or reissue flows that can create a second live external side effect instead of reusing one authoritative dispatch or mutation envelope.
- Detect timeline and receipt views that imply `sent`, `delivered`, `resolved`, or `transferred` before external confirmation or authoritative settlement exists.
- Surface cases where delivery failure or dispute does not materialize as visible repair state in the support workbench and thread chronology.
- Examine whether replay exit, deep-link restore, or stale publication posture can leave a second resend or repair action armed while the first attempt is still `awaiting_external`.
- Identify where support tooling, clinician-message tooling, and patient thread posture compute delivery or repair truth differently for the same underlying communication chain.

Implementation posture:
- Choose the remediation that definitively closes the failure class, even if that requires non-trivial refactoring.
- Implement the end-state architecture and algorithm, not just the analysis of it.
- Prefer deleting, consolidating, or hardening weak paths over documenting them or layering more conditional logic on top.
- Do not treat this as retry-button hardening alone.
- Prefer one controlled resend and delivery-repair contract where operator tooling, patient thread state, and downstream evidence all reference the same causal chain.
- If support and messaging flows currently duplicate retry semantics, redesign them around one idempotent mutation attempt model plus one evidence-bound delivery truth model.
- Ensure stale or replay-restored support shells degrade to provisional or read-only recovery rather than allowing blind resend.

Produce:
1. A concise description of the current failure mode, its blast radius, and the target end-state.
2. The exact algorithmic, architectural, schema, contract, runtime, and interface changes required to eliminate the issue.
3. The concrete code, migration, configuration, and data-shape changes you will apply, or an exact executable patch plan if the environment is truly read-only.
4. The invariants, state-transition rules, guardrails, and recovery semantics enforced by the new design.
5. The verification suite needed to prove the remediation, including unit, integration, contract, replay, recovery, concurrency, and end-to-end coverage as applicable.
6. The rollout, backfill, reindex, compatibility, and operational validation plan required to land the fix safely.
7. Residual risks only if they remain after implementation, plus the exact evidence required to close them.

Optimize for definitive elimination of `Controlled Resend and Delivery-Repair Tooling` through coherent algorithmic and architectural remediation, with durable invariants, safe rollout, and proof-backed correctness. The task is not complete at diagnosis; finish only when the strongest viable remediation is implemented and proven, or reduced to an exact executable change set for a truly read-only environment.
