# 229 Phase 3 Callback, Message, Self-care, and Admin Boundaries

## Purpose

Task `229` freezes the remaining peer consequence domains for Phase 3:

- callback lifecycle
- clinician-message lifecycle
- patient conversation shell and reply authority
- self-care boundary and advice release
- admin-resolution subtype, waiting, completion, and reopen semantics

The pack exists to stop callback, messaging, self-care, and admin-resolution work from drifting into generic timeline prose, provider optimism, or route-local UI state.

## Canonical callback law

The callback domain is governed by:

- [229_callback_case.schema.json](/Users/test/Code/V/data/contracts/229_callback_case.schema.json)
- [229_callback_intent_lease.schema.json](/Users/test/Code/V/data/contracts/229_callback_intent_lease.schema.json)
- [229_callback_attempt_record.schema.json](/Users/test/Code/V/data/contracts/229_callback_attempt_record.schema.json)
- [229_callback_expectation_envelope.schema.json](/Users/test/Code/V/data/contracts/229_callback_expectation_envelope.schema.json)
- [229_callback_outcome_evidence_bundle.schema.json](/Users/test/Code/V/data/contracts/229_callback_outcome_evidence_bundle.schema.json)
- [229_callback_resolution_gate.schema.json](/Users/test/Code/V/data/contracts/229_callback_resolution_gate.schema.json)

Frozen lifecycle:

```text
created -> queued -> scheduled -> ready_for_attempt -> attempt_in_progress
-> awaiting_outcome_evidence -> answered | no_answer | voicemail_left | contact_route_repair_pending
-> awaiting_retry | escalation_review -> completed | cancelled | expired -> closed
```

Governing rules:

1. `CallbackIntentLease` is the sole authority for schedule, reschedule, cancel, and ready-for-attempt arming.
2. `CallbackExpectationEnvelope` is the sole patient-facing callback promise and repair guide.
3. `CallbackOutcomeEvidenceBundle` is required before answered, no-answer, or voicemail truth becomes durable.
4. `CallbackResolutionGate` is the sole authority for retry, escalation, completion, cancel, or expiry.
5. Confidence or provider acknowledgement may widen pending posture, but may not manufacture completion.

## Canonical clinician-message law

The clinician-message domain is governed by:

- [229_clinician_message_thread.schema.json](/Users/test/Code/V/data/contracts/229_clinician_message_thread.schema.json)
- [229_message_dispatch_envelope.schema.json](/Users/test/Code/V/data/contracts/229_message_dispatch_envelope.schema.json)
- [229_message_delivery_evidence_bundle.schema.json](/Users/test/Code/V/data/contracts/229_message_delivery_evidence_bundle.schema.json)
- [229_thread_expectation_envelope.schema.json](/Users/test/Code/V/data/contracts/229_thread_expectation_envelope.schema.json)
- [229_thread_resolution_gate.schema.json](/Users/test/Code/V/data/contracts/229_thread_resolution_gate.schema.json)

Frozen primary path:

```text
drafted -> approved -> sent -> delivered -> patient_replied -> awaiting_clinician_review -> closed
```

Frozen repair path:

```text
sent | delivered -> delivery_failed -> contact_route_repair_pending -> approved | sent
```

Governing rules:

1. `MessageDispatchEnvelope` is the immutable send or resend authority.
2. `MessageDeliveryEvidenceBundle` is the only durable delivery truth.
3. `ThreadExpectationEnvelope` is the sole patient-facing reply, repair, and awaiting-review posture.
4. `ThreadResolutionGate` is the sole authority for repair routing, callback escalation, reopen, and closure.
5. Provider retries reconcile onto one dispatch fence; they may not create a second live send.

CallbackExpectationEnvelope is the sole patient-facing callback promise.
MessageDeliveryEvidenceBundle is the only durable delivery truth.

## Patient conversation and command routing

The shared patient conversation shell is governed by:

- [229_patient_conversation_cluster.schema.json](/Users/test/Code/V/data/contracts/229_patient_conversation_cluster.schema.json)
- [229_patient_conversation_preview_digest.schema.json](/Users/test/Code/V/data/contracts/229_patient_conversation_preview_digest.schema.json)
- [229_patient_composer_lease.schema.json](/Users/test/Code/V/data/contracts/229_patient_composer_lease.schema.json)
- [229_patient_receipt_envelope.schema.json](/Users/test/Code/V/data/contracts/229_patient_receipt_envelope.schema.json)
- [229_patient_urgent_diversion_state.schema.json](/Users/test/Code/V/data/contracts/229_patient_urgent_diversion_state.schema.json)
- [229_conversation_command_settlement.schema.json](/Users/test/Code/V/data/contracts/229_conversation_command_settlement.schema.json)

Frozen routing law:

1. There is one authoritative conversation cluster and one live patient composer at a time.
2. Every patient or support command settles through `ConversationCommandSettlement`.
3. Pure repair stays in the owning domain, but still settles through the shared command-settlement record.
4. Potentially clinical or contact-safety-relevant replies route into evidence assimilation and re-safety before routine thread or triage flow resumes.
5. Urgent diversion freezes unsafe async affordances without losing same-shell context.

## Self-care and admin boundary law

The boundary family is governed by:

- [229_self_care_boundary_decision.schema.json](/Users/test/Code/V/data/contracts/229_self_care_boundary_decision.schema.json)
- [229_advice_eligibility_grant.schema.json](/Users/test/Code/V/data/contracts/229_advice_eligibility_grant.schema.json)
- [229_advice_render_settlement.schema.json](/Users/test/Code/V/data/contracts/229_advice_render_settlement.schema.json)
- [229_advice_follow_up_watch_window.schema.json](/Users/test/Code/V/data/contracts/229_advice_follow_up_watch_window.schema.json)
- [229_advice_admin_dependency_set.schema.json](/Users/test/Code/V/data/contracts/229_advice_admin_dependency_set.schema.json)
- [229_advice_admin_release_watch.schema.json](/Users/test/Code/V/data/contracts/229_advice_admin_release_watch.schema.json)
- [229_admin_resolution_case.schema.json](/Users/test/Code/V/data/contracts/229_admin_resolution_case.schema.json)
- [229_admin_resolution_subtype_profiles.yaml](/Users/test/Code/V/data/contracts/229_admin_resolution_subtype_profiles.yaml)
- [229_admin_resolution_action_record.schema.json](/Users/test/Code/V/data/contracts/229_admin_resolution_action_record.schema.json)
- [229_admin_resolution_completion_artifact.schema.json](/Users/test/Code/V/data/contracts/229_admin_resolution_completion_artifact.schema.json)
- [229_admin_resolution_settlement.schema.json](/Users/test/Code/V/data/contracts/229_admin_resolution_settlement.schema.json)
- [229_admin_resolution_experience_projection.schema.json](/Users/test/Code/V/data/contracts/229_admin_resolution_experience_projection.schema.json)

Boundary rules:

1. `SelfCareBoundaryDecision` is the sole classifier for `self_care`, `admin_resolution`, or `clinician_review_required`.
2. Subtype labels and route copy may not widen boundary meaning.
3. Waiting requires a typed dependency, an owner, a clock source, and patient-visible wording.
4. `AdminResolutionCompletionArtifact` is the typed proof of completion.
5. `AdminResolutionSettlement.result = completed` is invalid without the matching artifact and current `boundaryTupleHash`.
6. New symptoms, safety preemption, material patient evidence, invalidated advice, or unstable dependency sets reopen boundary review and freeze stale consequence.

SelfCareBoundaryDecision is the sole classifier.

Canonical initial subtype set:

- `document_or_letter_workflow`
- `form_workflow`
- `result_follow_up_workflow`
- `medication_admin_query`
- `registration_or_demographic_update`
- `routed_admin_task`

## Contact-repair seam

The contract pack does not weaken repair semantics to absorb an unfinished shared repair projection. Instead it publishes an explicit seam:

- [PARALLEL_INTERFACE_GAP_PHASE3_CONTACT_REPAIR.json](/Users/test/Code/V/data/analysis/PARALLEL_INTERFACE_GAP_PHASE3_CONTACT_REPAIR.json)

Current rule:

- repair remains in the owning domain
- callback and message repair still settle through `ConversationCommandSettlement`
- later implementation may unify the repair projection, but it may not bypass the callback, message, or support fences already frozen here

## Atlas and machine-readable parity

The premium browser proof for this pack is:

- [229_phase3_conversation_resolution_boundary_atlas.html](/Users/test/Code/V/docs/frontend/229_phase3_conversation_resolution_boundary_atlas.html)

Supporting parity artifacts:

- [229_callback_and_message_state_matrix.csv](/Users/test/Code/V/data/analysis/229_callback_and_message_state_matrix.csv)
- [229_selfcare_admin_boundary_cases.csv](/Users/test/Code/V/data/analysis/229_selfcare_admin_boundary_cases.csv)
- [229_conversation_resolution_gap_log.json](/Users/test/Code/V/data/analysis/229_conversation_resolution_gap_log.json)

The atlas is not allowed to carry meaning absent from those contracts and parity tables.
