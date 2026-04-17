# 139 Intake Event Catalog

## Event Freeze
| Event | Phase status | Source model | Schema version ref | Forbidden aliases | Patient-visible meaning |
| --- | --- | --- | --- | --- | --- |
| request.submitted | active_phase1 | SubmissionEnvelope | CESV_REQUEST_SUBMITTED_V1 | intake.submitted | Submit is authoritative only after this event and the matching IntakeSubmitSettlement chain settle. |
| intake.draft.created | active_phase1 | SubmissionEnvelope | CESV_INTAKE_DRAFT_CREATED_V1 | none | A resume token and a draft public ID now exist for the same envelope lineage. |
| intake.draft.updated | active_phase1 | SubmissionEnvelope | CESV_INTAKE_DRAFT_UPDATED_V1 | none | Quiet saved posture may change only when continuity evidence still covers the same shell lineage. |
| intake.attachment.added | active_phase1 | SubmissionEnvelope | CESV_INTAKE_ATTACHMENT_ADDED_V1 | none | Supporting files are part of the same draft summary and replay boundary. |
| intake.attachment.quarantined | reserved_follow_on | SubmissionEnvelope | CESV_INTAKE_ATTACHMENT_QUARANTINED_V1 | none | Seq_141 must harden this rule without renaming the event. |
| intake.normalized | active_phase1 | Request | CESV_INTAKE_NORMALIZED_V1 | none | Routine queue entry and ETA proof happen after this normalization boundary, not before. |
| safety.screened | active_phase1 | Request | CESV_SAFETY_SCREENED_V1 | none | Urgent, routine, and failed-safe outcomes all trace to one rules-first safety record set. |
| safety.urgent_diversion.required | active_phase1 | Request | CESV_SAFETY_URGENT_DIVERSION_REQUIRED_V1 | none | Urgent required and urgent diverted remain separate states; the UI may not collapse them. |
| safety.urgent_diversion.completed | active_phase1 | Request | CESV_SAFETY_URGENT_DIVERSION_COMPLETED_V1 | none | The urgent pathway is now settled and may present governed external handoff if policy requires it. |
| triage.task.created | active_phase1 | Request | CESV_TRIAGE_TASK_CREATED_V1 | none | Receipt and ETA may render only after this downstream operational handoff exists. |
| patient.receipt.issued | active_phase1 | Request | CESV_PATIENT_RECEIPT_ISSUED_V1 | none | Receipt, status, and later authenticated views stay semantically equivalent for the same request. |
| communication.queued | active_phase1 | Request | CESV_COMMUNICATION_QUEUED_V1 | none | Communication is a downstream effect of authoritative receipt, not a substitute for it. |

## Canonical Rules
- `request.submitted` is the only canonical submit event.
- `intake.submitted` is explicitly forbidden as a parallel semantic alias for the same promotion boundary.
- Draft events emit from `SubmissionEnvelope` and its projections, not from a second draft persistence model.
- `intake.attachment.quarantined` is reserved now so seq_141 can harden quarantine policy without renaming the event spine.
- `safety.urgent_diversion.required` and `safety.urgent_diversion.completed` remain separate durable states.

## Gap Resolutions
| Gap resolution | Summary |
| --- | --- |
| GAP_RESOLVED_139_PUBLIC_PATH_FREEZE | The public journey now has one exact Phase 1 path set with stable route patterns, outcome paths, and recovery paths instead of narrative-only intent. |
| GAP_RESOLVED_139_SINGLE_PRE_SUBMIT_MODEL | Browser, embedded, and future authenticated uplift all resolve through one IntakeConvergenceContract and one IntakeDraftView schema. |
| GAP_RESOLVED_139_SUBMIT_SUCCESS_REQUIRES_SETTLEMENT_CHAIN | Receipt and status visibility now require IntakeSubmitSettlement plus the SubmissionPromotionRecord chain rather than local browser success inference. |
| GAP_RESOLVED_139_ARTIFACT_AND_HANDOFF_GOVERNANCE | Receipt, urgent guidance, and status surfaces are bound to ArtifactPresentationContract and OutboundNavigationGrant instead of raw URLs or detached pages. |
| GAP_RESOLVED_139_SAME_SHELL_RECOVERY | Urgent diversion, stale recovery, and failed-safe outcomes remain in one same-shell lineage instead of collapsing to generic expired-link or error pages. |

## Bounded Gaps
| Bounded gap | Summary |
| --- | --- |
| GAP_139_QUESTIONNAIRE_DETAIL_PENDING_SEQ_140 | Question semantics, per-type field rules, and questionnaire decision tables are deferred to seq_140 without changing this route or schema spine. |
| GAP_139_ATTACHMENT_RULEBOOK_PENDING_SEQ_141 | Attachment media acceptance, classification, and quarantine policy detail is frozen only at the event and API seam here; seq_141 hardens the rulebook. |
| GAP_139_URGENT_COPY_AND_RULEBOOK_PENDING_SEQ_142 | Urgent-diversion wording and the rules-first red-flag metadata pack remain bounded follow-on work in seq_142. |
| GAP_139_EMBEDDED_RUNTIME_PUBLICATION_PENDING | Embedded posture is modeled as a future-compatible blocked seam so later NHS App work cannot fork the data model or promotion boundary. |
| GAP_139_AUTHENTICATED_UPLIFT_ROUTE_PUBLICATION_PENDING | Authenticated track-my-request uplift stays reserved for later route publication work and may narrow chrome only, not semantics. |
