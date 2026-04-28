# 139 Web Intake Journey Contract

## Mission
Freeze the exact Phase 1 patient intake journey, route contracts, runtime/outcome bindings, and shell continuity law before implementation tracks add questionnaire detail, attachments, or red-flag rules.

## Mock Now Execution
Mock_now_execution is the public web/browser self-service contract. It is simulator-backed, uses the current public-entry runtime tuple, and stays honest about today’s current `recovery_only` publication truth for patient intake.

## Actual Production Strategy Later
Actual_production_strategy_later may narrow chrome, identity uplift, or embedded capability, but it must preserve the same `IntakeConvergenceContract`, `IntakeDraftView`, `IntakeSurfaceRuntimeBinding`, `IntakeSubmitSettlement`, and `IntakeOutcomePresentationArtifact` semantics.

## Frozen Page Stack
| Step key | Route pattern | Route family | Purpose | Next transitions |
| --- | --- | --- | --- | --- |
| landing | /intake/start | rf_intake_self_service | Establish scope, service boundaries, and the emergency escape route before draft creation. | request_type |
| request_type | /intake/drafts/:draftPublicId/request-type | rf_intake_self_service | Choose one canonical intake type and lock the questionnaire branch without forking the draft model. | details; resume_recovery |
| details | /intake/drafts/:draftPublicId/details | rf_intake_self_service | Capture the bounded narrative and the structured answers for the chosen request type. | supporting_files; review_submit; resume_recovery |
| supporting_files | /intake/drafts/:draftPublicId/supporting-files | rf_intake_self_service | Collect optional supporting evidence through governed attachment initiation rather than raw uploads. | contact_preferences; review_submit; resume_recovery |
| contact_preferences | /intake/drafts/:draftPublicId/contact-preferences | rf_intake_self_service | Capture the bounded communication preference set used for receipt and follow-up contact. | review_submit; resume_recovery |
| review_submit | /intake/drafts/:draftPublicId/review | rf_intake_self_service | Freeze the current draft summary, show the emergency reminder again, and route submit through the settlement chain. | urgent_outcome; receipt_outcome; resume_recovery |
| resume_recovery | /intake/drafts/:draftPublicId/recovery?resumeToken=:resumeToken | rf_intake_self_service | Recover a stale, superseded, or newly rebound draft in the same shell without opening a second draft lane. | request_type; details; supporting_files; contact_preferences; review_submit |
| urgent_outcome | /intake/requests/:requestPublicId/urgent-guidance | rf_intake_self_service | Render the urgent pathway change in place for the same lineage once urgent diversion is durably required or completed. | request_status |
| receipt_outcome | /intake/requests/:requestPublicId/receipt | rf_intake_self_service | Morph the review surface into the calm receipt for the same request lineage after triage-ready promotion settles. | request_status |
| request_status | /intake/requests/:requestPublicId/status | rf_intake_self_service | Show the minimal top-level patient state and next-step message without exposing internal queue detail. | receipt_outcome |

## Same-Shell Law
- Every route in this journey uses the same patient mission frame and the same shell continuity key: `patient.portal.requests`.
- Urgent diversion, receipt, status, stale recovery, and failed-safe submission remain same-shell outcomes for the same lineage where recovery is still allowed.
- `AudienceSurfaceRuntimeBinding`, `PatientShellConsistencyProjection`, `RouteFreezeDisposition`, `ReleaseRecoveryDisposition`, `ArtifactPresentationContract`, and `OutboundNavigationGrant` all remain first-class contract members instead of implementation detail.
- Generic expired-link, generic validation-error, or detached success pages are not legal steady-state behavior for recoverable intake lineages.

## Frozen Route-to-Runtime Bindings
| Binding ref | Route contract ref | Route family | Binding state | Recovery law |
| --- | --- | --- | --- | --- |
| ISRB_139_PUBLIC_ENTRY_V1 | ISRC_139_INTAKE_LANDING_V1 | rf_intake_self_service | recovery_only | RRD_PATIENT_INTAKE_RECOVERY |
| ISRB_139_RESUME_RECOVERY_V1 | ISRC_139_INTAKE_RESUME_RECOVERY_V1 | rf_intake_self_service | recovery_only | RRD_PATIENT_INTAKE_RECOVERY |
| ISRB_139_URGENT_OUTCOME_V1 | ISRC_139_INTAKE_URGENT_OUTCOME_V1 | rf_intake_self_service | recovery_only | RRD_PATIENT_INTAKE_RECOVERY |
| ISRB_139_RECEIPT_OUTCOME_V1 | ISRC_139_INTAKE_RECEIPT_OUTCOME_V1 | rf_intake_self_service | recovery_only | RRD_PATIENT_INTAKE_RECOVERY |
| ISRB_139_REQUEST_STATUS_V1 | ISRC_139_INTAKE_REQUEST_STATUS_V1 | rf_intake_self_service | recovery_only | RRD_PATIENT_INTAKE_RECOVERY |
| ISRB_139_EMBEDDED_SEAM_V1 | ISRC_139_EMBEDDED_PUBLIC_ENTRY_V1 | rf_patient_embedded_channel | blocked | RRD_139_EMBEDDED_CHROME_RECOVERY |

## Route and Outcome Decisions
- Exact public path freeze:
  `/intake/start`, `/intake/drafts/:draftPublicId/request-type`, `/intake/drafts/:draftPublicId/details`, `/intake/drafts/:draftPublicId/supporting-files`, `/intake/drafts/:draftPublicId/contact-preferences`, `/intake/drafts/:draftPublicId/review`, `/intake/drafts/:draftPublicId/recovery?resumeToken=:resumeToken`, `/intake/requests/:requestPublicId/urgent-guidance`, `/intake/requests/:requestPublicId/receipt`, `/intake/requests/:requestPublicId/status`
- One dominant route family carries the public browser journey now: `rf_intake_self_service`.
- Embedded posture is modeled explicitly as a blocked seam and may not silently fork the pre-submit model later.
- Minimal status is a first-class route contract, not a generic extension of receipt.

## Promotion and Recovery Law
- `SubmissionEnvelope` is the only mutable pre-submit model.
- `SubmissionPromotionRecord` is the only legal envelope-to-request boundary.
- `IntakeSubmitSettlement` is mandatory for authoritative urgent, routine, stale-recoverable, denied-scope, and failed-safe submit outcomes.
- `ArtifactPresentationContract` and `OutboundNavigationGrant` govern every receipt, urgent guidance, status, preview, print, and exit path.

## Gap Resolutions
| Decision | Summary |
| --- | --- |
| GAP_RESOLVED_139_PUBLIC_PATH_FREEZE | The public journey now has one exact Phase 1 path set with stable route patterns, outcome paths, and recovery paths instead of narrative-only intent. |
| GAP_RESOLVED_139_SINGLE_PRE_SUBMIT_MODEL | Browser, embedded, and future authenticated uplift all resolve through one IntakeConvergenceContract and one IntakeDraftView schema. |
| GAP_RESOLVED_139_SUBMIT_SUCCESS_REQUIRES_SETTLEMENT_CHAIN | Receipt and status visibility now require IntakeSubmitSettlement plus the SubmissionPromotionRecord chain rather than local browser success inference. |
| GAP_RESOLVED_139_ARTIFACT_AND_HANDOFF_GOVERNANCE | Receipt, urgent guidance, and status surfaces are bound to ArtifactPresentationContract and OutboundNavigationGrant instead of raw URLs or detached pages. |
| GAP_RESOLVED_139_SAME_SHELL_RECOVERY | Urgent diversion, stale recovery, and failed-safe outcomes remain in one same-shell lineage instead of collapsing to generic expired-link or error pages. |

## Bounded Gaps
| Gap | Summary |
| --- | --- |
| GAP_139_QUESTIONNAIRE_DETAIL_PENDING_SEQ_140 | Question semantics, per-type field rules, and questionnaire decision tables are deferred to seq_140 without changing this route or schema spine. |
| GAP_139_ATTACHMENT_RULEBOOK_PENDING_SEQ_141 | Attachment media acceptance, classification, and quarantine policy detail is frozen only at the event and API seam here; seq_141 hardens the rulebook. |
| GAP_139_URGENT_COPY_AND_RULEBOOK_PENDING_SEQ_142 | Urgent-diversion wording and the rules-first red-flag metadata pack remain bounded follow-on work in seq_142. |
| GAP_139_EMBEDDED_RUNTIME_PUBLICATION_PENDING | Embedded posture is modeled as a future-compatible blocked seam so later NHS App work cannot fork the data model or promotion boundary. |
| GAP_139_AUTHENTICATED_UPLIFT_ROUTE_PUBLICATION_PENDING | Authenticated track-my-request uplift stays reserved for later route publication work and may narrow chrome only, not semantics. |

## Event Grammar Lock
The journey binds the following exact event grammar now: request.submitted, intake.draft.created, intake.draft.updated, intake.attachment.added, intake.attachment.quarantined, intake.normalized, safety.screened, safety.urgent_diversion.required, safety.urgent_diversion.completed, triage.task.created, patient.receipt.issued, communication.queued.
