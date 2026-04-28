# 228 Phase 3 Endpoint Decision, Approval, And Escalation Contracts

Task: `seq_228`

Visual mode: `Endpoint_Approval_Escalation_Atlas`

This task freezes the Phase 3 consequence rail. It publishes the exact endpoint taxonomy, `DecisionEpoch` law, approval checkpoint rules, urgent escalation branch, and summary-first consequence artifact family that later implementation tasks must reuse directly.

## Source grounding

Primary source sections implemented here:

- `blueprint/phase-3-the-human-checkpoint.md#3E. Endpoint decision engine and resolution model`
- `blueprint/phase-3-the-human-checkpoint.md#3F. Human approval checkpoint and urgent escalation path`
- `blueprint/phase-3-the-human-checkpoint.md#3G. Direct resolution, downstream handoff seeds, and reopen mechanics`
- `blueprint/phase-0-the-foundation-protocol.md#1.42 ArtifactPresentationContract`
- `blueprint/phase-0-the-foundation-protocol.md#1.43 OutboundNavigationGrant`
- `blueprint/phase-0-the-foundation-protocol.md#2.8 ScopedMutationGate`
- `blueprint/self-care-content-and-admin-resolution-blueprint.md`
- `blueprint/staff-workspace-interface-architecture.md`

## Machine-readable sources

- `data/contracts/228_endpoint_decision.schema.json`
- `data/contracts/228_decision_epoch.schema.json`
- `data/contracts/228_decision_supersession_record.schema.json`
- `data/contracts/228_endpoint_decision_binding.schema.json`
- `data/contracts/228_endpoint_decision_action_record.schema.json`
- `data/contracts/228_endpoint_decision_settlement.schema.json`
- `data/contracts/228_endpoint_outcome_preview_artifact.schema.json`
- `data/contracts/228_approval_checkpoint.schema.json`
- `data/contracts/228_approval_policy_matrix.yaml`
- `data/contracts/228_approval_requirement_assessment.schema.json`
- `data/contracts/228_duty_escalation_record.schema.json`
- `data/contracts/228_urgent_contact_attempt.schema.json`
- `data/contracts/228_urgent_escalation_outcome.schema.json`
- `data/contracts/228_booking_intent.schema.json`
- `data/contracts/228_pharmacy_intent.schema.json`
- `data/contracts/228_triage_reopen_record.schema.json`
- `data/contracts/228_triage_outcome_presentation_artifact.schema.json`
- `data/analysis/228_endpoint_payload_matrix.csv`
- `data/analysis/228_decision_epoch_supersession_cases.csv`
- `data/analysis/228_approval_and_escalation_gap_log.json`

## Fixed endpoint taxonomy

The endpoint taxonomy is frozen exactly:

1. `admin_resolution`
2. `self_care_and_safety_net`
3. `clinician_message`
4. `clinician_callback`
5. `appointment_required`
6. `pharmacy_first_candidate`
7. `duty_clinician_escalation`

`EndpointDecision` binds every endpoint to a structured payload minimum, a payload hash, a preview artifact, and one `requiredApprovalMode`. The endpoint payload matrix is authoritative for the minimum required fields. A prose note without the typed payload minimum is not a valid endpoint draft.

## DecisionEpoch law

`DecisionEpoch` is the sole consequence fence.

The first endpoint mutation on a review snapshot mints one live epoch. Every preview, approval checkpoint, urgent escalation, booking seed, pharmacy seed, and consequence presentation artifact binds to that same epoch.

If any of these drift materially:

- evidence
- safety posture
- duplicate resolution
- ownership epoch
- trust slice
- publication tuple
- selected anchor
- review version
- manual replace or reopen

the system must append one `DecisionSupersessionRecord`, downgrade the stale rail through `EndpointDecisionBinding(bindingState = stale | blocked | preview_only)`, and preserve stale previews only as provenance.

## Endpoint rail mutation chain

The consequence rail is not a local form.

Every consequence-bearing action resolves:

1. `RouteIntentBinding`
2. `CommandActionRecord`
3. `EndpointDecisionActionRecord`
4. `EndpointDecisionSettlement`
5. same-shell recovery or presentation artifact

`EndpointDecisionSettlement.result` is frozen to:

- `draft_saved`
- `preview_ready`
- `submitted`
- `stale_recoverable`
- `blocked_policy`
- `blocked_approval_gate`
- `failed`

That closes the gap where a drawer acknowledgement or optimistic local draft could look equivalent to durable consequence.

## Boundary coupling for self-care and admin

`admin_resolution` and `self_care_and_safety_net` remain coupled to the existing self-care boundary model.

`EndpointDecisionBinding` and `EndpointDecisionSettlement` now carry:

- `selfCareBoundaryDecisionRef`
- `boundaryTupleHash`
- `boundaryDecisionState`
- `clinicalMeaningState`
- `operationalFollowUpScope`

Those fields keep subtype wording, preview state, and live consequence from drifting away from the canonical boundary answer. If the boundary tuple stops matching, the rail freezes and requires same-shell recovery.

## Approval burden

Approval is epoch-specific, not task-generic.

`ApprovalPolicyMatrix` publishes the machine-readable rule pack. `ApprovalRequirementAssessment` evaluates:

- endpoint class
- tenant policy
- pathway
- risk burden
- assistive provenance
- sensitive override posture

`ApprovalCheckpoint` then runs the fixed state machine:

`not_required -> required -> pending -> approved | rejected -> superseded`

Any material decision drift supersedes the old checkpoint. Earlier approval is preserved as audit provenance but may not be reused on the replacement epoch.

## Urgent escalation branch

Urgent escalation is a typed peer domain, not a banner.

The contract family is:

- `DutyEscalationRecord`
- `UrgentContactAttempt`
- `UrgentEscalationOutcome`

The outcome taxonomy is frozen to:

- `direct_non_appointment`
- `downstream_handoff`
- `return_to_triage`
- `cancelled`
- `expired`

That gives later implementation work one exact urgent branch that can emit direct outcome, handoff, reopen, or cancelled provenance without improvising ad hoc note semantics.

## Downstream seeds and reopen

Forward-stable seed shapes are now frozen:

- `BookingIntent`
- `PharmacyIntent`
- `TriageReopenRecord`

The critical rule is unchanged: stale or superseded decisions do not launch new downstream work. Seeds must echo `decisionEpochRef`, and reopen must preserve the superseded epoch plus the `DecisionSupersessionRecord`.

## Summary-first consequence presentation

Primary consequence UX remains summary-first inside the same shell.

Two artifact families now govern that surface:

- `EndpointOutcomePreviewArtifact`
- `TriageOutcomePresentationArtifact`

Both require:

- `ArtifactPresentationContract`
- `OutboundNavigationGrant` policy binding
- current runtime publication refs
- bounded artifact states: `summary_only | interactive_same_shell | external_handoff_ready | recovery_only`

Raw URLs, detached print pages, and ad hoc confirmation screens are not valid primary consequence UX.

## Gap closure status

The mandatory consequence, approval, escalation, assistive, and detached-preview gaps are closed in `data/analysis/228_approval_and_escalation_gap_log.json`.

Later tasks may implement engines and workflows against these contracts. They may not replace the taxonomy, epoch law, approval invalidation rules, escalation branch, or presentation contract family frozen here.
