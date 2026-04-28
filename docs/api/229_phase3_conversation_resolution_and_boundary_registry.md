# 229 Phase 3 Conversation Resolution and Boundary Registry

## Registry intent

This registry names the authoritative object families for callback, clinician-message, patient conversation, self-care, and admin-resolution consequence.

## Callback registry

| Object | Role |
| --- | --- |
| `CallbackCase` | Lifecycle container for one callback lineage case |
| `CallbackIntentLease` | Sole scheduling, rescheduling, cancellation, and ready-for-attempt authority |
| `CallbackAttemptRecord` | Idempotent fence for each actual attempt |
| `CallbackExpectationEnvelope` | Sole patient-visible callback promise |
| `CallbackOutcomeEvidenceBundle` | Durable proof of answered, no-answer, voicemail, or route failure |
| `CallbackResolutionGate` | Sole retry, escalate, complete, cancel, or expire authority |

## Message registry

| Object | Role |
| --- | --- |
| `ClinicianMessageThread` | Canonical message lineage shell |
| `MessageDispatchEnvelope` | Immutable send or resend authority |
| `MessageDeliveryEvidenceBundle` | Durable delivered, failed, disputed, or expired truth |
| `ThreadExpectationEnvelope` | Sole patient-visible reply, repair, and awaiting-review posture |
| `ThreadResolutionGate` | Sole repair, escalate-to-callback, reopen, or close authority |

## Patient conversation registry

| Object | Role |
| --- | --- |
| `PatientConversationCluster` | Sole grouping identity for the patient conversation shell |
| `PatientConversationPreviewDigest` | Shared preview digest for summary surfaces |
| `PatientComposerLease` | One-live-composer fence |
| `PatientReceiptEnvelope` | Channel-specific acknowledgement shell |
| `PatientUrgentDiversionState` | Same-shell urgent preemption state |
| `ConversationCommandSettlement` | Cross-domain reply, repair, resend, callback, and reopen settlement authority |

## Self-care and admin boundary registry

| Object | Role |
| --- | --- |
| `SelfCareBoundaryDecision` | Sole classifier of self-care versus admin versus clinician re-entry |
| `AdviceEligibilityGrant` | Eligibility and visibility authority for advice issue |
| `AdviceRenderSettlement` | Authoritative advice issue settlement |
| `AdviceFollowUpWatchWindow` | Post-advice watch and rollback-review window |
| `AdviceAdminDependencySet` | Canonical reopen and blocker dependency set |
| `AdviceAdminReleaseWatch` | Release and trust watch for self-care or admin consequence |
| `AdminResolutionCase` | Bounded admin work container |
| `AdminResolutionSubtypeProfile` | Canonical subtype vocabulary and dependency/completion rules |
| `AdminResolutionActionRecord` | Claimed admin action intent with lease and publication context |
| `AdminResolutionCompletionArtifact` | Typed proof of completion |
| `AdminResolutionSettlement` | Authoritative admin outcome settlement |
| `AdminResolutionExperienceProjection` | Sole patient- and staff-visible admin follow-up shell |

## Canonical state vocabularies

### Callback lifecycle

`created -> queued -> scheduled -> ready_for_attempt -> attempt_in_progress -> awaiting_outcome_evidence -> answered | no_answer | voicemail_left | contact_route_repair_pending -> awaiting_retry | escalation_review -> completed | cancelled | expired -> closed`

### Message-thread lifecycle

Primary:

`drafted -> approved -> sent -> delivered -> patient_replied -> awaiting_clinician_review -> closed`

Repair:

`sent | delivered -> delivery_failed -> contact_route_repair_pending -> approved | sent`

### Boundary vocabulary

- `decisionState = self_care | admin_resolution | clinician_review_required | blocked_pending_review`
- `clinicalMeaningState = informational_only | bounded_admin_only | clinician_reentry_required`
- `operationalFollowUpScope = none | self_serve_guidance | bounded_admin_resolution`
- `adminMutationAuthorityState = none | bounded_admin_only | frozen`

### Admin subtype vocabulary

- `document_or_letter_workflow`
- `form_workflow`
- `result_follow_up_workflow`
- `medication_admin_query`
- `registration_or_demographic_update`
- `routed_admin_task`

## Cross-domain routing rule

Every patient or support command in these domains must settle through `ConversationCommandSettlement`. Route-local repair or resend may stay inside the owning domain, but it may not bypass the shared settlement record, the owning domain fence, or the current `DecisionEpoch`.
