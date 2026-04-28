export const submissionLineageCanonicalEventNames = [
  "intake.draft.created",
  "intake.draft.updated",
  "intake.ingress.recorded",
  "intake.normalized",
  "intake.promotion.started",
  "intake.promotion.committed",
  "intake.promotion.settled",
  "intake.promotion.replay_returned",
  "intake.promotion.superseded_grants_applied",
  "intake.resume.continuity.updated",
  "request.created",
  "request.safety.classified",
  "request.safety.preempted",
  "request.safety.decided",
  "request.safety.urgent_diversion_required",
  "request.submitted",
  "request.snapshot.created",
] as const;

export type SubmissionLineageCanonicalEventName =
  (typeof submissionLineageCanonicalEventNames)[number];

export interface SubmissionLineageEventEnvelope<TPayload> {
  eventType: string;
  emittedAt: string;
  payload: TPayload;
}

export interface ParallelInterfaceGapEventContract {
  gapId: string;
  eventName: string;
  lifecycleState: "stubbed_parallel_interface_gap";
  rationale: string;
  sourceRefs: readonly string[];
}

export interface IntakeDraftCreatedPayload {
  envelopeId: string;
  sourceChannel: string;
  surfaceChannelProfile: string;
}

export interface IntakeDraftUpdatedPayload {
  envelopeId: string;
  draftPublicId: string;
  mutationRecordId: string;
  draftVersion: number;
  previousAckState:
    | "draft_not_started"
    | "saving_local"
    | "saved_authoritative"
    | "resume_safely"
    | "submitting_authoritative"
    | "outcome_authoritative"
    | "status_authoritative";
  nextAckState: "saved_authoritative" | "merge_required" | "recovery_required";
}

export const phase1AttachmentPipelineEventNames = [
  "intake.attachment.initiated",
  "intake.attachment.uploaded",
  "intake.attachment.scanning",
  "intake.attachment.safe",
  "intake.attachment.quarantined",
  "intake.attachment.promoted",
  "intake.attachment.removed",
  "intake.attachment.replaced",
  "intake.attachment.preview.generated",
] as const;

export type Phase1AttachmentPipelineEventName =
  (typeof phase1AttachmentPipelineEventNames)[number];

export const phase1ContactPreferenceEventNames = [
  "intake.contact_preferences.captured",
  "intake.contact_preferences.frozen",
] as const;

export type Phase1ContactPreferenceEventName =
  (typeof phase1ContactPreferenceEventNames)[number];

export interface IntakeAttachmentInitiatedPayload {
  attachmentPublicId: string;
  draftPublicId: string;
  uploadSessionId: string;
  duplicateDisposition: "new_capture" | "idempotent_replay" | "replacement_capture";
}

export interface IntakeAttachmentUploadedPayload {
  attachmentPublicId: string;
  draftPublicId: string;
  quarantineObjectKey: string;
  checksumSha256: string;
}

export interface IntakeAttachmentScanningPayload {
  attachmentPublicId: string;
  draftPublicId: string;
  scanAttemptRef: string;
  quarantineObjectKey: string;
}

export interface IntakeAttachmentSafePayload {
  attachmentPublicId: string;
  draftPublicId: string;
  scanAttemptRef: string;
  classificationOutcome: "accepted_safe" | "preview_unavailable_but_file_kept";
}

export interface IntakeAttachmentQuarantinedPayload {
  attachmentPublicId: string;
  draftPublicId: string;
  scanAttemptRef: string;
  classificationOutcome:
    | "quarantined_malware"
    | "quarantined_integrity_failure"
    | "quarantined_unsupported_type"
    | "quarantined_unreadable"
    | "quarantined_size_exceeded";
}

export interface IntakeAttachmentPromotedPayload {
  attachmentPublicId: string;
  draftPublicId: string;
  documentReferenceRef: string;
  durableObjectKey: string;
}

export interface IntakeAttachmentRemovedPayload {
  attachmentPublicId: string;
  draftPublicId: string;
  reasonCode: string;
}

export interface IntakeAttachmentReplacedPayload {
  attachmentPublicId: string;
  draftPublicId: string;
  replacedByAttachmentPublicId: string;
}

export interface IntakeAttachmentPreviewGeneratedPayload {
  attachmentPublicId: string;
  draftPublicId: string;
  thumbnailKey: string;
}

export interface IntakeContactPreferencesCapturedPayload {
  draftPublicId: string;
  envelopeRef: string;
  contactPreferenceCaptureRef: string;
  contactPreferencesRef: string;
  maskedViewRef: string;
  routeSnapshotSeedRef: string | null;
  replayClass: "new_capture" | "idempotent_replay";
  completenessState: "complete" | "incomplete" | "blocked";
}

export interface IntakeContactPreferencesFrozenPayload {
  draftPublicId: string;
  envelopeRef: string;
  contactPreferenceFreezeRef: string;
  contactPreferenceCaptureRef: string;
  contactPreferencesRef: string;
  routeSnapshotSeedRef: string | null;
}

export interface IntakeIngressRecordedPayload {
  envelopeId: string;
  ingressRecordRef: string;
}

export interface IntakeNormalizedPayload {
  envelopeId: string;
  normalizedSubmissionRef: string;
}

export interface IntakePromotionStartedPayload {
  envelopeId: string;
  sourceLineageRef: string;
  receiptConsistencyKey: string;
  statusConsistencyKey: string;
}

export interface IntakePromotionCommittedPayload {
  envelopeId: string;
  promotionRecordId: string;
  requestId: string;
  requestLineageId: string;
  receiptConsistencyKey: string;
  statusConsistencyKey: string;
}

export interface IntakePromotionSettledPayload {
  envelopeId: string;
  promotionRecordId: string;
  requestId: string;
  requestLineageId: string;
}

export interface IntakePromotionReplayReturnedPayload {
  envelopeId: string;
  promotionRecordId: string;
  requestId: string;
  requestLineageId: string;
  replayClass:
    | "exact_submit_replay"
    | "duplicate_submit_same_tab"
    | "duplicate_submit_cross_tab"
    | "auth_return_replay"
    | "support_resume_replay"
    | "delayed_network_retry";
  lookupField:
    | "submissionEnvelopeRef"
    | "sourceLineageRef"
    | "requestLineageRef"
    | "receiptConsistencyKey"
    | "statusConsistencyKey";
}

export interface IntakePromotionSupersededGrantsAppliedPayload {
  envelopeId: string;
  promotionRecordId: string;
  supersededAccessGrantRefs: readonly string[];
  supersededDraftLeaseRefs: readonly string[];
}

export interface RequestCreatedPayload {
  requestId: string;
  requestLineageId: string;
  episodeId: string;
  promotionRecordId: string;
}

export interface RequestSubmittedPayload {
  requestId: string;
  workflowState: "submitted";
  sourceChannel: string;
}

export interface RequestSafetyClassifiedPayload {
  requestId: string;
  evidenceSnapshotRef: string;
  classificationDecisionRef: string;
  dominantEvidenceClass:
    | "technical_metadata"
    | "operationally_material_nonclinical"
    | "contact_safety_relevant"
    | "potentially_clinical";
  misclassificationRiskState: "ordinary" | "fail_closed_review" | "urgent_hold";
}

export interface RequestSafetyPreemptedPayload {
  requestId: string;
  preemptionRef: string;
  openingSafetyEpoch: number;
  status:
    | "pending"
    | "blocked_manual_review"
    | "cleared_routine"
    | "escalated_urgent"
    | "cancelled"
    | "superseded";
  reasonCode: string;
}

export interface RequestSafetyDecidedPayload {
  requestId: string;
  safetyDecisionRef: string;
  requestedSafetyState:
    | "urgent_diversion_required"
    | "residual_risk_flagged"
    | "screen_clear";
  decisionOutcome:
    | "urgent_required"
    | "urgent_live"
    | "urgent_review"
    | "residual_review"
    | "clear_routine"
    | "fallback_manual_review";
  resultingSafetyEpoch: number;
}

export interface RequestSafetyUrgentDiversionRequiredPayload {
  requestId: string;
  safetyDecisionRef: string;
  preemptionRef: string;
  resultingSafetyEpoch: number;
}

export interface RequestSnapshotCreatedPayload {
  envelopeId: string;
  evidenceSnapshotRef: string;
}

export interface IntakeResumeContinuityUpdatedPayload {
  requestLineageId: string;
  continuityWitnessClass: string;
  continuityWitnessRef: string;
}

export interface RequestLineageBranchedPayload {
  requestLineageId: string;
  parentRequestLineageId: string;
  branchClass: "same_episode_branch" | "related_episode_branch";
  branchDecisionRef: string;
}

export interface RequestLineageCaseLinkChangedPayload {
  requestLineageId: string;
  lineageCaseLinkId: string;
  ownershipState:
    | "proposed"
    | "acknowledged"
    | "active"
    | "returned"
    | "closed"
    | "superseded"
    | "compensated";
  caseFamily?: string;
  returnToTriageRef?: string | null;
}

export const submissionLineageCanonicalEventContracts = submissionLineageCanonicalEventNames.map(
  (eventName) => ({
    eventName,
    registrySource: "seq_048 canonical event registry",
  }),
);

export const submissionLineageParallelInterfaceGaps = [
  {
    gapId: "PARALLEL_INTERFACE_GAP_062_REQUEST_LINEAGE_BRANCHED_EVENT",
    eventName: "request.lineage.branched",
    lifecycleState: "stubbed_parallel_interface_gap",
    rationale:
      "The seq_048 canonical registry does not yet publish a branch-specific RequestLineage event, but par_062 needs a bounded shared event seam for explicit same-episode and related-episode branch creation.",
    sourceRefs: [
      "prompt/062.md",
      "prompt/shared_operating_contract_056_to_065.md",
      "blueprint/phase-0-the-foundation-protocol.md#1.1B RequestLineage",
    ],
  },
  {
    gapId: "PARALLEL_INTERFACE_GAP_062_REQUEST_LINEAGE_CASE_LINK_CHANGED_EVENT",
    eventName: "request.lineage.case_link.changed",
    lifecycleState: "stubbed_parallel_interface_gap",
    rationale:
      "The seq_048 canonical registry does not yet publish a first-class LineageCaseLink event family, but par_062 needs a bounded shared event seam for child-workflow ownership transitions without leaking private package internals.",
    sourceRefs: [
      "prompt/062.md",
      "prompt/shared_operating_contract_056_to_065.md",
      "blueprint/phase-0-the-foundation-protocol.md#1.1C LineageCaseLink",
    ],
  },
] as const satisfies readonly ParallelInterfaceGapEventContract[];

export function emitIntakeDraftCreated(
  payload: IntakeDraftCreatedPayload,
): SubmissionLineageEventEnvelope<IntakeDraftCreatedPayload> {
  return {
    eventType: "intake.draft.created",
    emittedAt: new Date().toISOString(),
    payload,
  };
}

export function emitIntakeDraftUpdated(
  payload: IntakeDraftUpdatedPayload,
): SubmissionLineageEventEnvelope<IntakeDraftUpdatedPayload> {
  return {
    eventType: "intake.draft.updated",
    emittedAt: new Date().toISOString(),
    payload,
  };
}

export function emitIntakeIngressRecorded(
  payload: IntakeIngressRecordedPayload,
): SubmissionLineageEventEnvelope<IntakeIngressRecordedPayload> {
  return {
    eventType: "intake.ingress.recorded",
    emittedAt: new Date().toISOString(),
    payload,
  };
}

export function emitIntakeNormalized(
  payload: IntakeNormalizedPayload,
): SubmissionLineageEventEnvelope<IntakeNormalizedPayload> {
  return {
    eventType: "intake.normalized",
    emittedAt: new Date().toISOString(),
    payload,
  };
}

export function emitIntakePromotionStarted(
  payload: IntakePromotionStartedPayload,
): SubmissionLineageEventEnvelope<IntakePromotionStartedPayload> {
  return {
    eventType: "intake.promotion.started",
    emittedAt: new Date().toISOString(),
    payload,
  };
}

export function emitIntakePromotionCommitted(
  payload: IntakePromotionCommittedPayload,
): SubmissionLineageEventEnvelope<IntakePromotionCommittedPayload> {
  return {
    eventType: "intake.promotion.committed",
    emittedAt: new Date().toISOString(),
    payload,
  };
}

export function emitIntakePromotionSettled(
  payload: IntakePromotionSettledPayload,
): SubmissionLineageEventEnvelope<IntakePromotionSettledPayload> {
  return {
    eventType: "intake.promotion.settled",
    emittedAt: new Date().toISOString(),
    payload,
  };
}

export function emitIntakePromotionReplayReturned(
  payload: IntakePromotionReplayReturnedPayload,
): SubmissionLineageEventEnvelope<IntakePromotionReplayReturnedPayload> {
  return {
    eventType: "intake.promotion.replay_returned",
    emittedAt: new Date().toISOString(),
    payload,
  };
}

export function emitIntakePromotionSupersededGrantsApplied(
  payload: IntakePromotionSupersededGrantsAppliedPayload,
): SubmissionLineageEventEnvelope<IntakePromotionSupersededGrantsAppliedPayload> {
  return {
    eventType: "intake.promotion.superseded_grants_applied",
    emittedAt: new Date().toISOString(),
    payload,
  };
}

export function emitRequestCreated(
  payload: RequestCreatedPayload,
): SubmissionLineageEventEnvelope<RequestCreatedPayload> {
  return {
    eventType: "request.created",
    emittedAt: new Date().toISOString(),
    payload,
  };
}

export function emitRequestSubmitted(
  payload: RequestSubmittedPayload,
): SubmissionLineageEventEnvelope<RequestSubmittedPayload> {
  return {
    eventType: "request.submitted",
    emittedAt: new Date().toISOString(),
    payload,
  };
}

export function emitRequestSafetyClassified(
  payload: RequestSafetyClassifiedPayload,
): SubmissionLineageEventEnvelope<RequestSafetyClassifiedPayload> {
  return {
    eventType: "request.safety.classified",
    emittedAt: new Date().toISOString(),
    payload,
  };
}

export function emitRequestSafetyPreempted(
  payload: RequestSafetyPreemptedPayload,
): SubmissionLineageEventEnvelope<RequestSafetyPreemptedPayload> {
  return {
    eventType: "request.safety.preempted",
    emittedAt: new Date().toISOString(),
    payload,
  };
}

export function emitRequestSafetyDecided(
  payload: RequestSafetyDecidedPayload,
): SubmissionLineageEventEnvelope<RequestSafetyDecidedPayload> {
  return {
    eventType: "request.safety.decided",
    emittedAt: new Date().toISOString(),
    payload,
  };
}

export function emitRequestSafetyUrgentDiversionRequired(
  payload: RequestSafetyUrgentDiversionRequiredPayload,
): SubmissionLineageEventEnvelope<RequestSafetyUrgentDiversionRequiredPayload> {
  return {
    eventType: "request.safety.urgent_diversion_required",
    emittedAt: new Date().toISOString(),
    payload,
  };
}

export function emitRequestSnapshotCreated(
  payload: RequestSnapshotCreatedPayload,
): SubmissionLineageEventEnvelope<RequestSnapshotCreatedPayload> {
  return {
    eventType: "request.snapshot.created",
    emittedAt: new Date().toISOString(),
    payload,
  };
}

export function emitIntakeResumeContinuityUpdated(
  payload: IntakeResumeContinuityUpdatedPayload,
): SubmissionLineageEventEnvelope<IntakeResumeContinuityUpdatedPayload> {
  return {
    eventType: "intake.resume.continuity.updated",
    emittedAt: new Date().toISOString(),
    payload,
  };
}

export function emitRequestLineageBranched(
  payload: RequestLineageBranchedPayload,
): SubmissionLineageEventEnvelope<RequestLineageBranchedPayload> {
  return {
    eventType: "request.lineage.branched",
    emittedAt: new Date().toISOString(),
    payload,
  };
}

export function emitRequestLineageCaseLinkChanged(
  payload: RequestLineageCaseLinkChangedPayload,
): SubmissionLineageEventEnvelope<RequestLineageCaseLinkChangedPayload> {
  return {
    eventType: "request.lineage.case_link.changed",
    emittedAt: new Date().toISOString(),
    payload,
  };
}

export function emitIntakeAttachmentInitiated(
  payload: IntakeAttachmentInitiatedPayload,
): SubmissionLineageEventEnvelope<IntakeAttachmentInitiatedPayload> {
  return {
    eventType: "intake.attachment.initiated",
    emittedAt: new Date().toISOString(),
    payload,
  };
}

export function emitIntakeAttachmentUploaded(
  payload: IntakeAttachmentUploadedPayload,
): SubmissionLineageEventEnvelope<IntakeAttachmentUploadedPayload> {
  return {
    eventType: "intake.attachment.uploaded",
    emittedAt: new Date().toISOString(),
    payload,
  };
}

export function emitIntakeAttachmentScanning(
  payload: IntakeAttachmentScanningPayload,
): SubmissionLineageEventEnvelope<IntakeAttachmentScanningPayload> {
  return {
    eventType: "intake.attachment.scanning",
    emittedAt: new Date().toISOString(),
    payload,
  };
}

export function emitIntakeAttachmentSafe(
  payload: IntakeAttachmentSafePayload,
): SubmissionLineageEventEnvelope<IntakeAttachmentSafePayload> {
  return {
    eventType: "intake.attachment.safe",
    emittedAt: new Date().toISOString(),
    payload,
  };
}

export function emitIntakeAttachmentQuarantined(
  payload: IntakeAttachmentQuarantinedPayload,
): SubmissionLineageEventEnvelope<IntakeAttachmentQuarantinedPayload> {
  return {
    eventType: "intake.attachment.quarantined",
    emittedAt: new Date().toISOString(),
    payload,
  };
}

export function emitIntakeAttachmentPromoted(
  payload: IntakeAttachmentPromotedPayload,
): SubmissionLineageEventEnvelope<IntakeAttachmentPromotedPayload> {
  return {
    eventType: "intake.attachment.promoted",
    emittedAt: new Date().toISOString(),
    payload,
  };
}

export function emitIntakeAttachmentRemoved(
  payload: IntakeAttachmentRemovedPayload,
): SubmissionLineageEventEnvelope<IntakeAttachmentRemovedPayload> {
  return {
    eventType: "intake.attachment.removed",
    emittedAt: new Date().toISOString(),
    payload,
  };
}

export function emitIntakeAttachmentReplaced(
  payload: IntakeAttachmentReplacedPayload,
): SubmissionLineageEventEnvelope<IntakeAttachmentReplacedPayload> {
  return {
    eventType: "intake.attachment.replaced",
    emittedAt: new Date().toISOString(),
    payload,
  };
}

export function emitIntakeAttachmentPreviewGenerated(
  payload: IntakeAttachmentPreviewGeneratedPayload,
): SubmissionLineageEventEnvelope<IntakeAttachmentPreviewGeneratedPayload> {
  return {
    eventType: "intake.attachment.preview.generated",
    emittedAt: new Date().toISOString(),
    payload,
  };
}

export function emitIntakeContactPreferencesCaptured(
  payload: IntakeContactPreferencesCapturedPayload,
): SubmissionLineageEventEnvelope<IntakeContactPreferencesCapturedPayload> {
  return {
    eventType: "intake.contact_preferences.captured",
    emittedAt: new Date().toISOString(),
    payload,
  };
}

export function emitIntakeContactPreferencesFrozen(
  payload: IntakeContactPreferencesFrozenPayload,
): SubmissionLineageEventEnvelope<IntakeContactPreferencesFrozenPayload> {
  return {
    eventType: "intake.contact_preferences.frozen",
    emittedAt: new Date().toISOString(),
    payload,
  };
}
