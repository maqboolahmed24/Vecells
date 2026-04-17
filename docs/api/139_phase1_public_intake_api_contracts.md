# 139 Phase 1 Public Intake API Contracts

## Mission
Freeze the exact public HTTP surface for Phase 1 intake so later backend and frontend work cannot fork route meaning, public IDs, or outcome contracts.

## Mock Now Execution
Mock_now_execution is simulator-backed web/browser self-service only. It covers anonymous start, draft resume token, refresh/resume, same-shell urgent diversion, same-shell receipt, and minimal request status.

## Actual Production Strategy Later
Actual_production_strategy_later preserves these same endpoint semantics, IntakeConvergenceContract, IntakeDraftView, IntakeSurfaceRuntimeBinding, IntakeSubmitSettlement, and IntakeOutcomePresentationArtifact semantics for authenticated uplift and NHS App embedded delivery later.

## Endpoint Freeze
| Endpoint | Purpose | Primary request contract | Response contract | Contract law |
| --- | --- | --- | --- | --- |
| POST /v1/intake/drafts | Create one SubmissionEnvelope-backed draft and return IntakeDraftView. | requestType? (optional preselection), surfaceChannelProfile, routeEntryRef | IntakeDraftView | No internal IDs; returns draftPublicId and resumeToken only. |
| GET /v1/intake/drafts/{draftPublicId} | Load the authoritative draft view for the same public draft lineage. | draftPublicId, resumeToken | IntakeDraftView | Must fail closed if a mismatched internal aggregate ID is ever supplied. |
| PATCH /v1/intake/drafts/{draftPublicId} | Apply immutable draft mutations and return the updated IntakeDraftView. | draftVersion, clientCommandId, idempotencyKey, step delta, answer delta | IntakeDraftView | Draft remains on SubmissionEnvelope; no Request promotion on PATCH. |
| POST /v1/intake/drafts/{draftPublicId}/attachments:initiate | Start a governed attachment placeholder or upload grant for the same draft. | draftVersion, filename, declaredMediaType, byteLength | attachment initiation payload | Attachment acceptance stays on the same draft lineage and never leaks raw object-store URLs. |
| POST /v1/intake/drafts/{draftPublicId}/submit | Freeze the snapshot, run normalization and safety, and return one authoritative submit settlement. | draftVersion, idempotencyKey, review acknowledgement | IntakeSubmitSettlement | request.submitted is the canonical submit event. No intake.submitted duplicate is allowed. |
| GET /v1/intake/requests/{requestPublicId}/receipt | Render the calm receipt outcome for a promoted request. | requestPublicId | IntakeOutcomePresentationArtifact | ArtifactPresentationContract and OutboundNavigationGrant remain mandatory for any handoff or preview. |
| GET /v1/intake/requests/{requestPublicId}/status | Render the minimal track-my-request summary for the same request lineage. | requestPublicId | IntakeOutcomePresentationArtifact | Status stays coarse and same-shell; it must not expose internal queue detail. |

## Public ID Separation
- `draftPublicId` is the only public identifier for mutable pre-submit work.
- `requestPublicId` is the only public identifier for post-promotion receipt or status work.
- `SubmissionEnvelope`, aggregate IDs, and internal request IDs are never exposed in routes or payloads.
- `SubmissionEnvelope` remains the canonical pre-submit authority. Promotion into `Request` happens exactly once through `SubmissionPromotionRecord`.

## Attachment Initiation Payload
```json
{
  "attachmentSessionId": "ias_139_supporting_file_01",
  "attachmentPublicId": "att_upload_img_01",
  "artifactPresentationContractRef": "APC_139_INTAKE_ATTACHMENT_UPLOAD_V1",
  "uploadGrantPolicyRef": "UGP_139_INTAKE_ATTACHMENT_UPLOAD_V1",
  "attachmentPlaceholderContractRef": "PHC_139_ATTACHMENT_PLACEHOLDER_V1",
  "acceptedMediaProfileRefs": [
    "media.image_photo",
    "media.document_pdf"
  ],
  "maxUploadBytes": 15728640,
  "draftVersion": 3
}
```

## Response Reference Examples

### IntakeDraftView
```json
{
  "draftPublicId": "dft_7k49m2v8pq41",
  "ingressChannel": "self_service_form",
  "surfaceChannelProfile": "browser",
  "intakeConvergenceContractRef": "ICC_PHASE1_SELF_SERVICE_FORM_V1",
  "identityContext": {
    "bindingState": "anonymous",
    "subjectRefPresence": "none",
    "claimResumeState": "not_required",
    "actorBindingState": "anonymous"
  },
  "requestType": "Symptoms",
  "structuredAnswers": {
    "symptom_start_day_count": 2,
    "has_fever": true,
    "pain_location": "throat"
  },
  "freeTextNarrative": "I have had a sore throat and fever for two days and wanted advice.",
  "attachmentRefs": [
    "att_upload_img_01"
  ],
  "contactPreferences": {
    "preferredChannel": "sms",
    "contactWindow": "weekday_daytime",
    "voicemailAllowed": true
  },
  "channelCapabilityCeiling": {
    "canUploadFiles": true,
    "canRenderTrackStatus": true,
    "canRenderEmbedded": false,
    "mutatingResumeState": "allowed"
  },
  "draftVersion": 3,
  "lastSavedAt": "2026-04-14T10:15:00Z",
  "resumeToken": "rtk_TyM4QjBvYXQxX3Jlc3VtZQ",
  "uiJourneyState": {
    "currentStepKey": "details",
    "completedStepKeys": [
      "request_type"
    ],
    "currentPathname": "/intake/drafts/dft_7k49m2v8pq41/details",
    "quietStatusState": "saved_authoritative",
    "sameShellRecoveryState": "stable",
    "shellContinuityKey": "patient.portal.requests",
    "selectedAnchorKey": "request-proof"
  },
  "draftSchemaVersion": "INTAKE_DRAFT_VIEW_V1"
}
```

### IntakeSubmitSettlement
```json
{
  "draftPublicId": "dft_7k49m2v8pq41",
  "routeIntentBindingRef": "RIB_139_PATIENT_INTAKE_REVIEW_V1",
  "commandActionRecordRef": "CAR_139_PATIENT_INTAKE_SUBMIT_V1",
  "commandSettlementRecordRef": "CSR_139_PATIENT_INTAKE_SUBMIT_V1",
  "transitionEnvelopeRef": "TE_139_PATIENT_INTAKE_REVIEW_TO_OUTCOME_V1",
  "audienceSurfaceRuntimeBindingRef": "ASRB_050_PATIENT_PUBLIC_ENTRY_V1",
  "surfacePublicationRef": "ASPR_050_PATIENT_PUBLIC_ENTRY_V1",
  "runtimePublicationBundleRef": "rpb::local::authoritative",
  "releasePublicationParityRef": "rpp::local::authoritative",
  "releaseRecoveryDispositionRef": "RRD_PATIENT_INTAKE_RECOVERY",
  "uiTransitionSettlementRecordRef": "UTSR_139_PATIENT_INTAKE_REVIEW_V1",
  "uiTelemetryDisclosureFenceRef": "UTDF_139_PATIENT_INTAKE_SUMMARY_V1",
  "intakeSubmitSettlementId": "ISS_139_TRIAGE_READY_V1",
  "requestPublicId": "req_91x2p4n6mk5",
  "submissionPromotionRecordRef": "SPR_139_REQ_91X2P4N6MK5_V1",
  "patientJourneyLineageRef": "PJL_139_REQ_91X2P4N6MK5_V1",
  "idempotencyRecordRef": "IR_139_SUBMIT_REPLAY_A_V1",
  "presentationArtifactRef": "IOPA_139_RECEIPT_REQ_91X2P4N6MK5_V1",
  "result": "triage_ready",
  "recordedAt": "2026-04-14T10:20:20Z"
}
```

### IntakeOutcomePresentationArtifact
```json
{
  "artifactPresentationContractRef": "APC_139_PATIENT_INTAKE_SUMMARY_V1",
  "outboundNavigationGrantPolicyRef": "ONGP_139_PATIENT_INTAKE_OUTCOME_V1",
  "audienceSurfaceRuntimeBindingRef": "ASRB_050_PATIENT_PUBLIC_ENTRY_V1",
  "surfacePublicationRef": "ASPR_050_PATIENT_PUBLIC_ENTRY_V1",
  "runtimePublicationBundleRef": "rpb::local::authoritative",
  "releasePublicationParityRef": "rpp::local::authoritative",
  "createdAt": "2026-04-14T10:21:50Z",
  "intakeOutcomePresentationArtifactId": "IOPA_139_RECEIPT_REQ_91X2P4N6MK5_V1",
  "requestPublicId": "req_91x2p4n6mk5",
  "surfaceRouteContractRef": "ISRC_139_INTAKE_RECEIPT_OUTCOME_V1",
  "visibilityTier": "public_safe_summary",
  "summarySafetyTier": "routine_clear",
  "placeholderContractRef": "PHC_139_RECEIPT_STATUS_SUMMARY_V1",
  "artifactState": "inline_renderable"
}
```

## Route and Runtime Bindings
- The public route family remains `rf_intake_self_service`.
- The active browser tuple binds `AudienceSurfaceRuntimeBinding = ASRB_050_PATIENT_PUBLIC_ENTRY_V1`, `RouteFreezeDisposition = RFD_050_PATIENT_PUBLIC_ENTRY_V1`, and `ReleaseRecoveryDisposition = RRD_PATIENT_INTAKE_RECOVERY`.
- Current browser truth is intentionally `recovery_only`, not publishable-live. Exact route meaning is frozen now even though calm live publication is still withheld by current design and accessibility posture.

## Non-Negotiable Rules
- `request.submitted` is the canonical submit event; `intake.submitted` is forbidden.
- `SubmissionEnvelope` remains the only legal mutable pre-submit model.
- Receipt and status must not infer success from local form state. They require authoritative `IntakeSubmitSettlement`.
- `ArtifactPresentationContract` and `OutboundNavigationGrant` are mandatory for urgent guidance, receipt, status, attachment preview, print, or external handoff.
