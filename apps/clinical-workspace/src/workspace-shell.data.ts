import {
  createContinuityCarryForwardPlan,
  createContinuityRestorePlan,
  resolveAutomationAnchorProfile,
  resolveRouteGuardDecision,
  resolveShellBoundaryDecision,
  type AudienceSurfaceRuntimeBindingLike,
  type ReleaseRecoveryDispositionLike,
  type ReleaseTrustFreezeVerdictLike,
  type RouteFreezeDispositionLike,
  type RouteGuardDecision,
  type RuntimeScenario,
} from "@vecells/persistent-shell";
import {
  resolveSurfacePostureContract,
  surfacePostureSpecimens,
  type SurfacePostureContract,
} from "@vecells/surface-postures";
import {
  resolveArtifactModeTruth,
  statusTruthSpecimens,
  type ArtifactModeTruthProjection,
  type ArtifactPreviewPage,
  type ArtifactShellSpecimen,
  type ArtifactSummarySection,
  type CasePulseContract,
  type ProjectionActionabilityState,
  type ProjectionFreshnessState,
  type ProjectionTransportState,
  type ProjectionTrustState,
  type StatusTruthInput,
} from "@vecells/design-system";
import {
  resolvePhase3PatientWorkspaceConversationBundleByTaskId,
  type Phase3PatientWorkspaceAccessState,
  type Phase3PatientWorkspaceDeliveryPosture,
  type Phase3PatientWorkspaceDueState,
  type Phase3PatientWorkspaceRepairPosture,
  type Phase3PatientWorkspaceReplyEligibilityState,
} from "@vecells/domain-kernel";
import {
  defaultStaffBookingCaseId,
  resolveStaffBookingCaseSeed,
} from "./workspace-booking-handoff.model";

type FrontendContractManifestRuntime = any;
type FrontendManifestValidationVerdict = any;

function generateFrontendContractManifest(input: any): FrontendContractManifestRuntime {
  return {
    ...input,
    surfaceAuthorityTupleHash: `sat::${input.frontendContractManifestId.toLowerCase()}`,
  };
}

function validateFrontendContractManifest(
  manifest: FrontendContractManifestRuntime,
  _input: { routeFamilyRef: string },
): FrontendManifestValidationVerdict {
  if (manifest.projectionCompatibilityState === "blocked") {
    return {
      validationState: "blocked",
      safeToConsume: false,
      driftState: "blocked",
    };
  }
  if (manifest.projectionCompatibilityState === "exact" && manifest.publicationParityState === "exact") {
    return {
      validationState: "exact",
      safeToConsume: true,
      driftState: "none",
    };
  }
  return {
    validationState: "constrained",
    safeToConsume: true,
    driftState: manifest.publicationParityState === "withdrawn" ? "blocked" : "review_required",
  };
}

function patientConversationScenarioForRuntime(
  runtimeScenario: RuntimeScenario,
): "live" | "stale" | "blocked" {
  switch (runtimeScenario) {
    case "live":
      return "live";
    case "blocked":
      return "blocked";
    case "stale_review":
    case "read_only":
    case "recovery_only":
    default:
      return "stale";
  }
}

export const STAFF_SHELL_TASK_ID = "par_116";
export const STAFF_TELEMETRY_SCENARIO_ID = "SCN_STATUS_LAB_WORKSPACE_REVIEW";
export const STAFF_STORAGE_KEY = "clinical-workspace::staff-shell-ledger";

export type StaffRouteKind =
  | "home"
  | "queue"
  | "task"
  | "more-info"
  | "decision"
  | "validation"
  | "consequences"
  | "callbacks"
  | "messages"
  | "approvals"
  | "escalations"
  | "changed"
  | "bookings"
  | "search"
  | "support-handoff";

export type StaffQueueState =
  | "recommended"
  | "changed"
  | "approval"
  | "escalated"
  | "blocked"
  | "reassigned";

export interface StaffEvidenceItem {
  label: string;
  value: string;
  detail: string;
}

export interface StaffConsequenceItem {
  title: string;
  detail: string;
}

export interface StaffQuickCaptureConfig {
  endpoints: readonly string[];
  questionSets: readonly string[];
  reasonChips: readonly string[];
  macros: readonly string[];
  duePicks: readonly string[];
}

export interface StaffQueueCase {
  id: string;
  patientLabel: string;
  patientRef: string;
  queueKey: string;
  state: StaffQueueState;
  urgencyTone: "info" | "caution" | "critical";
  ageLabel: string;
  freshnessLabel: string;
  dueLabel: string;
  primaryReason: string;
  secondaryMeta: string;
  previewSummary: string;
  previewTrustNote: string;
  summaryPoints: readonly string[];
  deltaClass: "decisive" | "consequential" | "contextual" | "clerical";
  deltaSummary: string;
  changedFieldRefs: readonly string[];
  contradictionRefs: readonly string[];
  actionInvalidationRefs: readonly string[];
  primaryChangedAnchorRef: string;
  returnToQuietEligibility: "blocked" | "on_ack" | "on_resolve";
  patientReturnImpact: string;
  resumeActionLabel: string;
  resumeActionSummary: string;
  supersededContext: readonly string[];
  evidence: readonly StaffEvidenceItem[];
  consequences: readonly StaffConsequenceItem[];
  references: readonly string[];
  decisionOptions: readonly string[];
  moreInfoPrompts: readonly string[];
  quickCapture: StaffQuickCaptureConfig;
  nextQueueRank: number;
  currentQueueRank: number;
  launchQueue: string;
}

export interface StaffQueueDefinition {
  key: string;
  label: string;
  description: string;
  recommendedTaskId: string;
  filter: (item: StaffQueueCase) => boolean;
}

export interface StaffHomeModule {
  id: string;
  title: string;
  summary: string;
  detail: string;
  tone: "neutral" | "caution" | "critical";
  taskRefs: readonly string[];
}

export interface StaffShellRoute {
  kind: StaffRouteKind;
  path: string;
  routeFamilyRef: "rf_staff_workspace" | "rf_staff_workspace_child";
  title: string;
  sectionLabel: string;
  queueKey: string | null;
  taskId: string | null;
  bookingCaseId?: string | null;
  searchQuery: string;
}

export interface StaffShellLedger {
  path: string;
  selectedAnchorId: string;
  queueKey: string;
  selectedTaskId: string;
  previewTaskId: string;
  searchQuery: string;
  callbackStage: "detail" | "outcome" | "repair";
  messageStage: "detail" | "dispute" | "repair";
  bufferedUpdateCount: number;
  queuedBatchPending: boolean;
  bufferedQueueTrayState: "expanded" | "collapsed" | "deferred";
  runtimeScenario: RuntimeScenario;
  lastQuietRegionLabel: string;
}

export type QueueToolbarFilterKey = "all" | "changed" | "urgent" | "approval" | "blocked";

export interface QueueToolbarFilterOption {
  key: QueueToolbarFilterKey;
  label: string;
  count: number;
}

export interface QueueScanSessionProjection {
  queueScanSessionId: string;
  queueKey: string;
  rankSnapshotRef: string;
  focusedRowRef: string;
  previewDigestRef: string | null;
  prefetchWindowRef: string;
  selectedAnchorRef: string;
  scanFenceToken: string;
  previewHydrationMode: "summary_only" | "pinned_summary";
  sessionState: "scanning" | "preview_peek" | "preview_pinned" | "task_open";
  previewAcknowledgesSeen: false;
  openedAt: string;
  updatedAt: string;
}

export interface QueuePreviewDigestProjection {
  queuePreviewDigestId: string;
  taskId: string;
  rankSnapshotRef: string;
  rankEntryRef: string;
  reviewVersion: string;
  reasonSummaryRef: string;
  materialDeltaSummaryRef: string;
  blockingDigestRef: string;
  ownershipDigestRef: string;
  nextActionDigestRef: string;
  attachmentAvailabilityDigestRef: string;
  previewMode: "hover_summary" | "pinned_summary" | "prefetch_summary";
  leaseMintState: "forbidden";
  changedSinceSeenState: "unchanged";
  heavyHydrationState: "on_open_only";
  freshnessState: "fresh" | "stale";
  generatedAt: string;
}

export interface QueueRowPresentationContract {
  queueRowPresentationContractId: string;
  taskId: string;
  anchorRef: string;
  rankSnapshotRef: string;
  rowDensity: "compact" | "elevated";
  lineClampPrimary: 1;
  lineClampSecondary: 1;
  lineClampTertiary: 0;
  leftSignalRailMode: "semantic";
  rightClusterMode: "status_cluster";
  changedSinceSeenMode: "muted" | "promoted";
  freshnessCueMode: "timestamp";
  currentRank: number;
  targetRank: number;
  primaryLabel: string;
  primarySummary: string;
  secondaryLine: string;
  queueExplanation: string;
  changedStateLabel: string;
  rightClusterLabel: string;
  statusChipLabel: string;
  openActionLabel: string;
  nextActionLabel: string;
  signalTone: StaffQueueCase["urgencyTone"];
  rowState: "resting" | "selected" | "preview_peek" | "preview_pinned" | "task_open";
  movementState: "stable" | "rank_shift" | "reassigned" | "approval_lane" | "blocked_lane";
  generatedAt: string;
}

export interface QueueChangeBatchProjection {
  batchId: string;
  queueRef: string;
  sourceRankSnapshotRef: string;
  targetRankSnapshotRef: string;
  preservedAnchorRef: string;
  preservedAnchorTupleHash: string;
  insertedRefs: readonly string[];
  updatedRefs: readonly string[];
  priorityShiftRefs: readonly string[];
  rankPlanVersion: string;
  applyPolicy: "idle_only" | "explicit_apply" | "immediate_if_safe";
  batchImpactClass: "bufferable" | "review_required";
  focusProtectedRef: string | null;
  invalidatedAnchorRefs: readonly string[];
  replacementAnchorRefs: readonly string[];
  anchorApplyState: "preserved" | "invalidated" | "replaced" | "released";
  summaryMessage: string;
  firstBufferedAt: string;
  flushDeadlineAt: string;
  batchState: "available" | "applied" | "dismissed";
  createdAt: string;
}

export interface QueueAnchorStubProjection {
  anchorId: string;
  taskId: string;
  stubState:
    | "filtered"
    | "search_hidden"
    | "moved_to_approvals"
    | "moved_to_changed"
    | "moved_to_escalations"
    | "settled_removed";
  title: string;
  summary: string;
  actionLabel: string;
  targetQueueKey: string | null;
}

export interface QueueWorkbenchProjection {
  queueKey: string;
  savedViewRef: string;
  appliedFilters: readonly string[];
  sortMode: "authoritative_rank";
  rankPlanVersion: string;
  rankSnapshotRef: string;
  assignmentSuggestionSnapshotRef: string;
  workspaceTrustEnvelopeRef: string;
  rowOrderHash: string;
  rowCount: number;
  virtualWindowRef: string;
  virtualizationState: "inline" | "windowed";
  rows: readonly QueueRowPresentationContract[];
  queueHealthDigest: {
    label: string;
    summary: string;
  };
  queueChangeBatch: QueueChangeBatchProjection | null;
  queueScanSession: QueueScanSessionProjection;
  queuePreviewDigest: QueuePreviewDigestProjection | null;
  previewTaskId: string | null;
  previewMode: "idle" | "hover_summary" | "pinned_summary" | "task_open";
  selectedAnchorId: string;
  anchorStub: QueueAnchorStubProjection | null;
  toolbarFilters: readonly QueueToolbarFilterOption[];
  searchQuery: string;
  generatedAt: string;
}

export interface StaffRouteAuthorityArtifacts {
  manifest: StaffFrontendContractManifest;
  verdict: FrontendManifestValidationVerdict;
  runtimeBinding: AudienceSurfaceRuntimeBindingLike;
  releaseVerdict: ReleaseTrustFreezeVerdictLike;
  routeFreezeDisposition: RouteFreezeDispositionLike | null;
  releaseRecoveryDisposition: ReleaseRecoveryDispositionLike | null;
  guardDecision: RouteGuardDecision;
}

export type TaskOpeningMode = "first_review" | "resumed_review" | "approval_review" | "handoff_review";

export interface TaskStackRowProjection {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone?: "neutral" | "accent" | "caution" | "critical";
}

export interface SummaryStackProjection {
  stackId: string;
  title: string;
  headline: string;
  dominantQuestion: string;
  ownershipSummary: string;
  rows: readonly TaskStackRowProjection[];
}

export interface DeltaStackProjection {
  stackId: string;
  title: string;
  headline: string;
  deltaClass: StaffQueueCase["deltaClass"];
  expandedByDefault: boolean;
  decisiveMeaning: string;
  authoritativeDeltaPacketRef: string;
  acknowledgementState: "pending_review" | "acknowledged" | "recommit_required";
  rows: readonly TaskStackRowProjection[];
  supersededContextRefs: readonly string[];
}

export interface EvidenceStackProjection {
  stackId: string;
  title: string;
  headline: string;
  lineageStripLabel: string;
  rows: readonly TaskStackRowProjection[];
}

export interface ConsequenceStackProjection {
  stackId: string;
  title: string;
  headline: string;
  rows: readonly TaskStackRowProjection[];
  decisionPreviewLabel: string;
  decisionPreviewSummary: string;
}

export interface ReferenceStackProjection {
  stackId: string;
  title: string;
  headline: string;
  collapsedByDefault: boolean;
  digestLabel: string;
  rows: readonly TaskStackRowProjection[];
  attachmentAndThread: AttachmentAndThreadProjection;
}

export type AttachmentDigestKind = "document" | "image" | "audio";
export type ThreadPreviewMode =
  | "authenticated_summary"
  | "public_safe_summary"
  | "step_up_required"
  | "suppressed_recovery_only";
export type ThreadReplyNeededState =
  | "none"
  | "reply_needed"
  | "blocked_by_repair"
  | "blocked_by_diversion"
  | "read_only";
export type ThreadAwaitingReviewState =
  | "none"
  | "awaiting_review"
  | "review_pending"
  | "blocked";
export type ThreadRepairRequiredState =
  | "none"
  | "contact_route_repair"
  | "policy_blocked"
  | "recovery_only";
export type ThreadAuthoritativeOutcomeState =
  | "awaiting_delivery_truth"
  | "awaiting_reply"
  | "callback_scheduled"
  | "awaiting_review"
  | "reviewed"
  | "settled"
  | "recovery_required";
export type ThreadDeliveryRiskState = "on_track" | "at_risk" | "likely_failed" | "disputed";
export type ThreadDispositionClass =
  | "accepted_in_window"
  | "accepted_late_review"
  | "blocked_repair"
  | "superseded_duplicate"
  | "expired_rejected";
export type ThreadSettlementResult =
  | "accepted_in_place"
  | "review_pending"
  | "awaiting_external"
  | "repair_required"
  | "stale_recoverable"
  | "blocked_policy"
  | "denied_scope"
  | "expired";
export type ThreadLocalAckState = "none" | "shown" | "superseded";
export type ThreadTransportState =
  | "local_only"
  | "provider_accepted"
  | "provider_rejected"
  | "timed_out";
export type ThreadExternalObservationState =
  | "unobserved"
  | "delivered"
  | "answered"
  | "failed"
  | "disputed"
  | "expired";
export type ViewerHydrationMode = "instant" | "chunked" | "placeholder";

export interface AttachmentDigestCardProjection {
  cardId: string;
  artifactId: string;
  digestKind: AttachmentDigestKind;
  title: string;
  summary: string;
  provenanceLabel: string;
  availabilityLabel: string;
  metaLabel: string;
  openLabel: string;
  selected: boolean;
  hydrationMode: ViewerHydrationMode;
  modeTruth: ArtifactModeTruthProjection;
  specimen: ArtifactShellSpecimen;
}

export interface AttachmentDigestGridProjection {
  gridId: string;
  title: string;
  summary: string;
  selectedArtifactId: string | null;
  cards: readonly AttachmentDigestCardProjection[];
}

export interface ArtifactViewerStageProjection {
  stageId: string;
  artifactId: string;
  title: string;
  summary: string;
  selectedAnchorRef: string;
  quietReturnTargetRef: string;
  hydrationMode: ViewerHydrationMode;
  modeTruth: ArtifactModeTruthProjection;
  specimen: ArtifactShellSpecimen;
}

export interface ThreadDispositionChipProjection {
  chipId: string;
  label: string;
  tone: "neutral" | "accent" | "caution" | "critical";
}

export interface ThreadEventRowProjection {
  rowId: string;
  anchorId: string;
  eventKind:
    | "more_info_reply"
    | "attachment_return"
    | "clinician_message"
    | "callback_update"
    | "repair_update"
    | "reminder_notice";
  occurredAt: string;
  headline: string;
  summary: string;
  actorLabel: string;
  selected: boolean;
  visibilityMode: ThreadPreviewMode;
  dispositionClass: ThreadDispositionClass | null;
  settlementResult: ThreadSettlementResult;
  localAckState: ThreadLocalAckState;
  transportState: ThreadTransportState;
  externalObservationState: ThreadExternalObservationState;
  authoritativeOutcomeState: ThreadAuthoritativeOutcomeState;
  repairRequiredState: ThreadRepairRequiredState;
  deliveryRiskState: ThreadDeliveryRiskState;
  attachmentRefs: readonly string[];
  chips: readonly ThreadDispositionChipProjection[];
}

export interface ThreadAnchorStubProjection {
  stubId: string;
  title: string;
  summary: string;
  actionLabel: string;
  selectedEventAnchorRef: string;
}

export interface PatientResponseThreadPanelProjection {
  panelId: string;
  title: string;
  summary: string;
  requestRef: string;
  requestLineageRef: string;
  clusterRef: string;
  threadId: string;
  patientConversationRouteRef: string;
  phase3ConversationBundleRef: string;
  evidenceDeltaPacketRef: string;
  moreInfoResponseDispositionRef: string;
  deliveryPosture: Phase3PatientWorkspaceDeliveryPosture;
  repairPosture: Phase3PatientWorkspaceRepairPosture;
  previewMode: ThreadPreviewMode;
  replyNeededState: ThreadReplyNeededState;
  awaitingReviewState: ThreadAwaitingReviewState;
  repairRequiredState: ThreadRepairRequiredState;
  authoritativeOutcomeState: ThreadAuthoritativeOutcomeState;
  deliveryRiskState: ThreadDeliveryRiskState;
  dominantNextActionRef: string;
  quietReturnTargetRef: string;
  selectedThreadEventId: string | null;
  anchorStub: ThreadAnchorStubProjection | null;
  rows: readonly ThreadEventRowProjection[];
}

export interface CommunicationDigestProjection {
  communicationDigestId: string;
  requestRef: string;
  requestLineageRef: string;
  clusterRef: string;
  threadId: string;
  patientConversationRouteRef: string;
  phase3ConversationBundleRef: string;
  previewMode: ThreadPreviewMode;
  replyNeededState: ThreadReplyNeededState;
  awaitingReviewState: ThreadAwaitingReviewState;
  repairRequiredState: ThreadRepairRequiredState;
  authoritativeOutcomeState: ThreadAuthoritativeOutcomeState;
  deliveryRiskState: ThreadDeliveryRiskState;
  dominantNextActionRef: string;
}

export interface AttachmentAndThreadProjection {
  resolverId: string;
  selectedAnchorRef: string;
  quietReturnTargetRef: string;
  attachmentDigestGrid: AttachmentDigestGridProjection;
  artifactViewerStage: ArtifactViewerStageProjection | null;
  patientResponseThreadPanel: PatientResponseThreadPanelProjection;
}

export interface PromotedSupportRegionProjection {
  regionId: string;
  kind: "approval_review" | "handoff_review" | "more_info_stage" | "decision_stage";
  title: string;
  summary: string;
  quietReturnTargetRef: string;
  actionLabel: string;
  stateLabel: string;
  rows: readonly TaskStackRowProjection[];
}

export interface DecisionDockProjection {
  dockId: string;
  primaryActionLabel: string;
  primaryActionReason: string;
  recommendationReasonRef: string;
  confidenceLevel: "high" | "guarded" | "blocked";
  consequencePreviewRef: string;
  transitionEnvelopeRef: string;
  anchorPersistenceRef: string;
  focusLeaseRef: string;
  stateStability: "stable" | "pending" | "blocked" | "invalidated" | "reconciled";
  blockingReason: string | null;
  shortlist: readonly string[];
}

export interface RapidEntryDraftInput {
  note: string;
  selectedReasonChip: string | null;
  selectedQuestionSet: string | null;
  selectedMacro: string | null;
  selectedDuePick: string | null;
  autosaveState: StatusTruthInput["saveState"];
  lastLocalChangeAt: string;
}

export interface QuickCaptureTrayProjection {
  trayId: string;
  activeMode: "rapid_entry" | "more_info" | "endpoint_reasoning";
  endpointShortcuts: readonly string[];
  reasonChips: readonly string[];
  questionSets: readonly string[];
  macros: readonly string[];
  duePicks: readonly string[];
  localAcknowledgement: string;
  autosaveState: StatusTruthInput["saveState"];
  keyboardHint: string;
  reviewActionLeaseRef: string;
}

export interface RapidEntryDraftProjection {
  draftId: string;
  taskId: string;
  draftType: "notes" | "question_set" | "endpoint_reasoning";
  noteValue: string;
  notePlaceholder: string;
  selectedReasonChip: string | null;
  selectedQuestionSet: string | null;
  selectedMacro: string | null;
  selectedDuePick: string | null;
  autosaveState: StatusTruthInput["saveState"];
  lastLocalChangeAt: string;
  recoverableUntil: string;
  localOnlyLabel: string;
}

export interface MoreInfoInlineSideStageProjection {
  stageId: string;
  requestRef: string;
  requestLineageRef: string;
  cycleRef: string;
  statusDigestRef: string;
  replyWindowCheckpointRef: string;
  reminderScheduleRef: string;
  patientConversationRouteRef: string;
  phase3ConversationBundleRef: string;
  dueState: Phase3PatientWorkspaceDueState;
  replyEligibilityState: Phase3PatientWorkspaceReplyEligibilityState;
  secureLinkAccessState: Phase3PatientWorkspaceAccessState;
  deliveryPosture: Phase3PatientWorkspaceDeliveryPosture;
  repairPosture: Phase3PatientWorkspaceRepairPosture;
  dominantPatientActionRef: string;
  statusState:
    | "draft"
    | "awaiting_patient_reply"
    | "review_required"
    | "late_review"
    | "repair_required";
  stageState: "live" | "stale_recoverable" | "recovery_only";
  headline: string;
  summary: string;
  dominantWorkspaceActionRef: string;
  cycleMode: "resume_existing" | "drafting_new";
  sendLabel: string;
  sendEnabled: boolean;
  questionPreview: readonly string[];
}

export interface ConsequencePreviewSurfaceProjection {
  surfaceId: string;
  headline: string;
  summary: string;
  previewState: "previewing" | "approval_pending" | "frozen";
  rows: readonly TaskStackRowProjection[];
  approvalCheckpointRef: string | null;
  transitionEnvelopeRef: string;
}

export interface EndpointReasoningStageProjection {
  stageId: string;
  decisionEpochRef: string;
  endpointDecisionBindingRef: string;
  reviewActionLeaseRef: string;
  stageState: "live" | "stale_recoverable" | "recovery_only";
  headline: string;
  summary: string;
  selectedEndpoint: string;
  rationaleLabel: string;
  sendLabel: string;
  sendEnabled: boolean;
  preview: ConsequencePreviewSurfaceProjection;
}

export interface ProtectedCompositionFreezeFrameProjection {
  freezeFrameId: string;
  freezeState: "stale_recoverable" | "recovery_only";
  headline: string;
  summary: string;
  blockingReasons: readonly string[];
  recoveryActionLabel: string;
  preservedDraftSummary: string;
  preservedAnchorRef: string;
  preservedDecisionEpochRef: string;
}

export interface ReasoningLayerProjection {
  layerId: string;
  focusProtectionLeaseRef: string;
  protectedCompositionStateRef: string;
  selectedAnchorTupleHashRef: string;
  quickCaptureTray: QuickCaptureTrayProjection;
  rapidEntryDraft: RapidEntryDraftProjection;
  moreInfoStage: MoreInfoInlineSideStageProjection;
  endpointReasoningStage: EndpointReasoningStageProjection;
  freezeFrame: ProtectedCompositionFreezeFrameProjection | null;
}

export interface TaskCanvasFrameProjection {
  taskCanvasFrameId: string;
  primaryRegionBindingRef: string;
  statusStripAuthorityRef: string;
  quietReturnTargetRef: string;
  summaryStack: SummaryStackProjection;
  deltaStack: DeltaStackProjection;
  evidenceStack: EvidenceStackProjection;
  consequenceStack: ConsequenceStackProjection;
  referenceStack: ReferenceStackProjection;
}

export interface TaskWorkspaceProjection {
  taskWorkspaceProjectionId: string;
  taskId: string;
  requestRef: string;
  requestLineageRef: string;
  routeKind: "task" | "more-info" | "decision";
  patientConversationRouteRef: string;
  phase3ConversationBundleRef: string;
  evidenceDeltaPacketRef: string;
  moreInfoResponseDispositionRef: string;
  deliveryPosture: Phase3PatientWorkspaceDeliveryPosture;
  repairPosture: Phase3PatientWorkspaceRepairPosture;
  openingMode: TaskOpeningMode;
  workspaceTrustEnvelopeRef: string;
  staffWorkspaceConsistencyProjectionRef: string;
  workspaceSliceTrustProjectionRef: string;
  decisionDockFocusLeaseRef: string;
  reviewActionLeaseRef: string;
  decisionEpochRef: string;
  quietSettlementEnvelopeRef: string;
  statusTruthTupleRef: string;
  casePulse: CasePulseContract;
  statusInput: StatusTruthInput;
  attachmentDigest: AttachmentDigestGridProjection;
  communicationDigest: CommunicationDigestProjection;
  deltaFirstResumeShell: DeltaFirstResumeShellProjection | null;
  taskCanvasFrame: TaskCanvasFrameProjection;
  decisionDock: DecisionDockProjection;
  reasoningLayer: ReasoningLayerProjection;
  promotedSupportRegion: PromotedSupportRegionProjection | null;
  selectedAnchorRef: string;
  shellPosture: RuntimeScenario;
}

export type ApprovalRouteState =
  | "required"
  | "pending"
  | "approved"
  | "rejected"
  | "superseded"
  | "recovery_required";
export type DecisionCommitViewState =
  | "previewing"
  | "awaiting_approval"
  | "commit_pending"
  | "settled"
  | "superseded"
  | "recovery_required";
export type EscalationRouteState =
  | "active"
  | "contact_in_progress"
  | "direct_outcome_recorded"
  | "handoff_pending"
  | "returned_to_triage"
  | "cancelled"
  | "expired";
export type UrgentStageMode = "active" | "relief_pending" | "recovery_only";
export type EscalationOutcomeClass =
  | "direct_non_appointment"
  | "downstream_handoff"
  | "return_to_triage"
  | "cancelled"
  | "expired";

export interface ApprovalLifecycleStepProjection {
  stepId: string;
  label: string;
  current: boolean;
  reached: boolean;
}

export interface ApprovalInboxRowProjection {
  rowId: string;
  taskId: string;
  anchorRef: string;
  patientLabel: string;
  consequenceLabel: string;
  approverRole: string;
  urgencyLabel: string;
  changedSinceLastReview: string;
  timestampLabel: string;
  approvalState: ApprovalRouteState;
  commitState: DecisionCommitViewState;
  supersessionLabel: string | null;
  irreversibleEffectLabel: string;
  summary: string;
  selected: boolean;
  openLabel: string;
}

export interface ApprovalAuthoritySummaryProjection {
  summaryId: string;
  approvalCheckpointRef: string;
  decisionEpochRef: string;
  approvalRole: string;
  replacementAuthorityRef: string | null;
  auditTrailLabel: string;
  irreversibleEffects: readonly string[];
  approvalState: ApprovalRouteState;
  commitState: DecisionCommitViewState;
}

export interface ApprovalReviewStageProjection {
  stageId: string;
  approvalState: ApprovalRouteState;
  commitState: DecisionCommitViewState;
  approvalCheckpointRef: string;
  decisionEpochRef: string;
  approvalRole: string;
  headline: string;
  summary: string;
  rationale: string;
  freezeReason: string | null;
  replacementAuthorityRef: string | null;
  actionLabel: string;
  actionEnabled: boolean;
  irreversibleEffects: readonly string[];
  lifecycle: readonly ApprovalLifecycleStepProjection[];
  sourceTaskProjection: TaskWorkspaceProjection;
}

export interface ApprovalInboxRouteProjection {
  routeId: string;
  visualMode: "Quiet_Escalation_Control_Room";
  queueHealthSummary: string;
  rowCount: number;
  rows: readonly ApprovalInboxRowProjection[];
  reviewStage: ApprovalReviewStageProjection;
  authoritySummary: ApprovalAuthoritySummaryProjection;
  emptyStateTitle: string;
  emptyStateSummary: string;
}

export interface EscalationInboxRowProjection {
  rowId: string;
  taskId: string;
  anchorRef: string;
  patientLabel: string;
  urgencyReason: string;
  severityBand: "urgent" | "critical";
  escalationState: EscalationRouteState;
  currentStatusLabel: string;
  lastMeaningfulTouch: string;
  nextGovernedAction: string;
  selected: boolean;
  openLabel: string;
}

export interface UrgentContactTimelineEntryProjection {
  entryId: string;
  headline: string;
  summary: string;
  occurredAtLabel: string;
  actorLabel: string;
  eventTone: "neutral" | "caution" | "critical" | "accent";
  outcomeLabel: string;
}

export interface UrgentContactTimelineProjection {
  timelineId: string;
  escalationState: EscalationRouteState;
  elapsedLabel: string;
  currentStatusLabel: string;
  nextGovernedAction: string;
  entries: readonly UrgentContactTimelineEntryProjection[];
}

export interface EscalationCommandSurfaceProjection {
  surfaceId: string;
  escalationState: EscalationRouteState;
  urgentStage: UrgentStageMode;
  dutyEscalationRef: string;
  decisionEpochRef: string;
  escalationOwnerLabel: string;
  severityBand: "urgent" | "critical";
  urgencyReason: string;
  headline: string;
  summary: string;
  freezeReason: string | null;
  actionLabel: string;
  actionEnabled: boolean;
  lineageSummary: string;
  sourceTaskProjection: TaskWorkspaceProjection;
}

export interface EscalationOutcomeOptionProjection {
  optionId: string;
  outcomeClass: EscalationOutcomeClass;
  label: string;
  summary: string;
}

export interface EscalationOutcomeRecorderProjection {
  recorderId: string;
  escalationState: EscalationRouteState;
  resolutionGateRef: string;
  lastOutcomeSummary: string;
  provenanceStrips: readonly string[];
  options: readonly EscalationOutcomeOptionProjection[];
}

export interface EscalationRouteProjection {
  routeId: string;
  visualMode: "Quiet_Escalation_Control_Room";
  queueHealthSummary: string;
  rowCount: number;
  rows: readonly EscalationInboxRowProjection[];
  commandSurface: EscalationCommandSurfaceProjection;
  urgentTimeline: UrgentContactTimelineProjection;
  outcomeRecorder: EscalationOutcomeRecorderProjection;
  emptyStateTitle: string;
  emptyStateSummary: string;
}

export type ResumeReviewState =
  | "diff_first"
  | "acknowledged"
  | "recommit_required"
  | "recovery_only";
export type ChangedRegionMarkerTone = "neutral" | "accent" | "caution" | "critical";
export type ChangedRegionMarkerKind =
  | "changed_field"
  | "contradiction"
  | "action_invalidation";

export interface EvidenceDeltaSummaryProjection {
  summaryId: string;
  authoritativeDeltaPacketRef: string;
  deltaClass: StaffQueueCase["deltaClass"];
  reviewState: ResumeReviewState;
  summary: string;
  explanation: string;
  primaryChangedAnchorRef: string;
  returnToQuietEligibility: StaffQueueCase["returnToQuietEligibility"];
  changedFieldRefs: readonly string[];
  contradictionRefs: readonly string[];
  actionInvalidationRefs: readonly string[];
}

export interface ChangedRegionMarkerProjection {
  markerId: string;
  kind: ChangedRegionMarkerKind;
  tone: ChangedRegionMarkerTone;
  label: string;
  summary: string;
  anchorRef: string;
}

export interface InlineChangedRegionMarkersProjection {
  markerSetId: string;
  headline: string;
  markers: readonly ChangedRegionMarkerProjection[];
}

export interface SupersededContextCompareItemProjection {
  itemId: string;
  label: string;
  previousContext: string;
  currentMeaning: string;
}

export interface SupersededContextCompareProjection {
  compareId: string;
  headline: string;
  summary: string;
  defaultExpanded: boolean;
  items: readonly SupersededContextCompareItemProjection[];
}

export interface ResumeReviewGateProjection {
  gateId: string;
  reviewState: ResumeReviewState;
  recommitRequired: boolean;
  acknowledgementState: DeltaStackProjection["acknowledgementState"];
  headline: string;
  summary: string;
  patientReturnImpact: string;
  dominantActionLabel: string;
  actionEnabled: boolean;
  governingRefs: readonly string[];
}

export interface DeltaFirstResumeShellProjection {
  shellId: string;
  deltaClass: StaffQueueCase["deltaClass"];
  reviewState: ResumeReviewState;
  recommitRequired: boolean;
  supersededContextState: "visible" | "none";
  selectedAnchorRef: string;
  evidenceDeltaSummary: EvidenceDeltaSummaryProjection;
  inlineChangedRegionMarkers: InlineChangedRegionMarkersProjection;
  supersededContextCompare: SupersededContextCompareProjection;
  resumeReviewGate: ResumeReviewGateProjection;
}

export interface ChangedWorkRowProjection {
  rowId: string;
  taskId: string;
  anchorRef: string;
  patientLabel: string;
  deltaClass: StaffQueueCase["deltaClass"];
  returnedEvidenceCount: number;
  contradictionCount: number;
  urgencyLabel: string;
  changedSummary: string;
  resumeState: ResumeReviewState;
  recommitRequired: boolean;
  selected: boolean;
  resumeLabel: string;
}

export interface ChangedWorkRouteProjection {
  routeId: string;
  visualMode: "Delta_Reentry_Compass";
  queueHealthSummary: string;
  rowCount: number;
  rows: readonly ChangedWorkRowProjection[];
  deltaFirstResumeShell: DeltaFirstResumeShellProjection;
  sourceTaskProjection: TaskWorkspaceProjection;
  emptyStateTitle: string;
  emptyStateSummary: string;
}

export interface AttachmentAndThreadSelectionState {
  selectedArtifactId: string | null;
  selectedThreadEventId: string | null;
}

type StaffFrontendContractManifest = FrontendContractManifestRuntime & {
  shellType: "staff";
};

const workspaceStatusSeed = statusTruthSpecimens.find(
  (candidate) => candidate.audience === "workspace",
);

if (!workspaceStatusSeed) {
  throw new Error("STATUS_TRUTH_WORKSPACE_SPECIMEN_MISSING");
}

const workspaceEmptySeed = surfacePostureSpecimens.find(
  (candidate) => candidate.postureId === "workspace_empty_queue",
);
const workspacePartialSeed = surfacePostureSpecimens.find(
  (candidate) => candidate.postureId === "workspace_partial_visibility",
);

if (!workspaceEmptySeed || !workspacePartialSeed) {
  throw new Error("WORKSPACE_POSTURE_SPECIMENS_MISSING");
}

function requireWorkspaceEmptySeed(): SurfacePostureContract {
  if (!workspaceEmptySeed) {
    throw new Error("WORKSPACE_EMPTY_POSTURE_SPECIMEN_MISSING");
  }
  return cloneJson(workspaceEmptySeed);
}

function requireWorkspacePartialSeed(): SurfacePostureContract {
  if (!workspacePartialSeed) {
    throw new Error("WORKSPACE_PARTIAL_POSTURE_SPECIMEN_MISSING");
  }
  return cloneJson(workspacePartialSeed);
}

function requireWorkspaceStatusSeed() {
  if (!workspaceStatusSeed) {
    throw new Error("STATUS_TRUTH_WORKSPACE_SPECIMEN_MISSING");
  }
  return workspaceStatusSeed;
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export const staffCases: readonly StaffQueueCase[] = [
  {
    id: "task-311",
    patientLabel: "Asha Patel",
    patientRef: "PT-311-AX7",
    queueKey: "recommended",
    state: "changed",
    urgencyTone: "caution",
    ageLabel: "47m open",
    freshnessLabel: "Changed 12m ago",
    dueLabel: "More-info due 14:10",
    primaryReason: "Returned evidence changes the inhaler escalation recommendation.",
    secondaryMeta:
      "2 attachments · duplicate suspicion watch · prior judgment now superseded · reviewer Lee Moran",
    previewSummary:
      "The patient replied with a corrected inhaler photo and a pharmacy note that contradict the last self-care path.",
    previewTrustNote:
      "Preview stays summary-first and read-only until the active task shell revalidates the decision lease.",
    summaryPoints: [
      "Patient-reported wheeze worsened overnight after following the original advice path.",
      "Returned evidence includes a new inhaler label image and a pharmacy callback note.",
      "A duplicate suspicion remains open because an older repeat request reused the same phone number.",
    ],
    deltaClass: "decisive",
    deltaSummary:
      "A decisive delta landed: the pharmacy callback and attachment pair invalidated the prior self-care judgement.",
    changedFieldRefs: [
      "Returned inhaler image no longer matches the controller assumption used in the earlier advice path.",
      "Pharmacy callback transcript changes the medication interpretation attached to the current request.",
    ],
    contradictionRefs: [
      "Patient reply says symptoms worsened after following the prior advice path.",
      "Duplicate watch remains open, so the phone-linked lineage cannot be treated as already reconciled.",
    ],
    actionInvalidationRefs: [
      "Previous self-care outcome can no longer settle without a fresh clinician review.",
      "Prior callback note cannot stay informational only while the new attachment pair is unresolved.",
    ],
    primaryChangedAnchorRef: "changed-region-task-311-pharmacy",
    returnToQuietEligibility: "on_resolve",
    patientReturnImpact:
      "The patient returned after following the earlier path, so the resumed review must explain the changed evidence before any calm completion can resume.",
    resumeActionLabel: "Recommit after reviewing the decisive delta",
    resumeActionSummary:
      "The previous outcome status is paused until the reviewer rechecks the new information and recommits intentionally.",
    supersededContext: [
      "Superseded: self-care advice variant from 09:12 assumed no controller inhaler duplication.",
      "Superseded: prior approval note treated the callback as informational, not blocking.",
    ],
    evidence: [
      {
        label: "Attachment digest",
        value: "2 returned artifacts",
        detail: "One inhaler photo, one pharmacy callback transcript excerpt.",
      },
      {
        label: "Duplicate watch",
        value: "open",
        detail: "History group 7 still needs reviewer acknowledgement before closure.",
      },
      {
        label: "Patient reply",
        value: "late but valid",
        detail: "Reply arrived 12 minutes after the last more-info window warning.",
      },
    ],
    consequences: [
      {
        title: "Recommendation impact",
        detail: "The active advice path must be rechecked before the case can settle.",
      },
      {
        title: "Support boundary",
        detail: "If the attachment check fails, hand off through support review only.",
      },
    ],
    references: [
      "Medication summary v7",
      "Practice escalation policy note",
      "Previous decision preview",
    ],
    decisionOptions: [
      "Escalate to clinician callback",
      "Issue more-info follow-up",
      "Hold as duplicate review",
    ],
    moreInfoPrompts: [
      "Confirm which inhaler was actually used after the overnight symptom change.",
      "Ask whether the pharmacist supplied a replacement or updated dose instructions.",
      "Verify whether the callback note refers to this request lineage or an older duplicate.",
    ],
    quickCapture: {
      endpoints: ["Clinician callback", "Pharmacy clarification", "Duplicate review lane"],
      questionSets: ["Inhaler confirmation", "Pharmacy callback", "Duplicate history check"],
      reasonChips: ["Returned evidence", "Contradiction", "Patient safety"],
      macros: ["Hold commit and reopen change review", "Late reply acknowledged", "Pharmacy note pending"],
      duePicks: ["Today 14:30", "Today 16:00", "Tomorrow 09:00"],
    },
    nextQueueRank: 2,
    currentQueueRank: 1,
    launchQueue: "returned-evidence",
  },
  {
    id: "task-208",
    patientLabel: "Noah Bennett",
    patientRef: "PT-208-FQ2",
    queueKey: "recommended",
    state: "approval",
    urgencyTone: "info",
    ageLabel: "18m open",
    freshnessLabel: "Approval queued",
    dueLabel: "Approval SLA 15:00",
    primaryReason: "Booking-intent summary is ready, but consequence review still needs approval.",
    secondaryMeta:
      "1 approval blocker · booking-intent seed · reviewer Zoe Keane · no downstream drift detected",
    previewSummary:
      "The task is clinically stable, but the promoted booking path cannot settle until the approval lane confirms the new access need.",
    previewTrustNote:
      "Preview keeps the approval blocker visible without minting a writable approval action.",
    summaryPoints: [
      "The patient accepted the proposed service window in the previous more-info cycle.",
      "The booking-intent seed is ready to advance once the approval frame confirms the access rule.",
      "No contradictory evidence has landed since the last reviewer touch.",
    ],
    deltaClass: "contextual",
    deltaSummary:
      "The only new information is a contextual approval requirement triggered by the service site availability change.",
    changedFieldRefs: [
      "Service-site availability now requires approval confirmation before the booking path can settle.",
    ],
    contradictionRefs: [],
    actionInvalidationRefs: [
      "Booking handoff remains staged only until the approval checkpoint resolves.",
    ],
    primaryChangedAnchorRef: "changed-region-task-208-approval",
    returnToQuietEligibility: "on_ack",
    patientReturnImpact:
      "No patient surprise is active, but the approval-context drift must stay visible until the reviewer acknowledges it.",
    resumeActionLabel: "Acknowledge the approval-context change",
    resumeActionSummary:
      "This delta annotates the review frame and keeps the approval dependency visible without taking over the full task.",
    supersededContext: [
      "Superseded: initial booking-intent preview assumed no extra approval requirement.",
    ],
    evidence: [
      {
        label: "Approval lane",
        value: "awaiting reviewer",
        detail: "One promoted approval preview is attached to this task.",
      },
      {
        label: "Booking intent",
        value: "ready to stage",
        detail: "The bounded booking follow-up stays read-only until approval settles.",
      },
    ],
    consequences: [
      {
        title: "Decision impact",
        detail: "Dominant action is approval review, not direct booking commitment.",
      },
    ],
    references: ["Service eligibility snapshot", "Previous callback summary"],
    decisionOptions: [
      "Request approval",
      "Prepare booking handoff",
      "Hold in review",
    ],
    moreInfoPrompts: [
      "Confirm whether the patient still prefers the proposed service date.",
      "Verify if transport constraints changed since the last callback.",
    ],
    quickCapture: {
      endpoints: ["Approval reviewer", "Booking intent lane"],
      questionSets: ["Approval context", "Service preference"],
      reasonChips: ["Approval needed", "Booking intent", "Stable evidence"],
      macros: ["Approval preview promoted", "Booking handoff staged", "Awaiting reviewer sign-off"],
      duePicks: ["Today 15:00", "Today 17:00", "Tomorrow 08:30"],
    },
    nextQueueRank: 4,
    currentQueueRank: 3,
    launchQueue: "approvals",
  },
  {
    id: "task-412",
    patientLabel: "Elena Morris",
    patientRef: "PT-412-ZM4",
    queueKey: "recommended",
    state: "escalated",
    urgencyTone: "critical",
    ageLabel: "9m open",
    freshnessLabel: "Urgent callback watch",
    dueLabel: "Escalation due now",
    primaryReason: "Callback follow-up is drifting and now needs an urgent, bounded escalation.",
    secondaryMeta:
      "Blocked contact route · callback-intent seed · dependency caution · reviewer Tariq Noor",
    previewSummary:
      "Outbound callback attempts are failing against the current contact route assessment, so the case moved into urgent escalation status.",
    previewTrustNote:
      "Preview reports the escalation status only; contact-route repair stays limited to the task workspace.",
    summaryPoints: [
      "Two callback attempts failed against a stale mobile number.",
      "The current reachability assessment disputes the preferred contact route.",
      "The patient asked for a same-day callback in the original request.",
    ],
    deltaClass: "consequential",
    deltaSummary:
      "A consequential delta arrived: contact-route trust drift means the callback plan is no longer safely actionable.",
    changedFieldRefs: [
      "Reachability assessment drifted away from the mobile callback route used by the last review.",
    ],
    contradictionRefs: [
      "Two failed callback attempts now contradict the previously trusted contact plan.",
    ],
    actionInvalidationRefs: [
      "Callback execution can no longer continue on the old route.",
      "Urgent escalation must stay promoted until a relief or return-to-triage outcome is recorded.",
    ],
    primaryChangedAnchorRef: "changed-region-task-412-reachability",
    returnToQuietEligibility: "on_resolve",
    patientReturnImpact:
      "Routine resume is no longer safe. The changed route must make the urgent recovery redirect obvious before anyone re-enters the callback plan.",
    resumeActionLabel: "Recommit the callback path after escalation review",
    resumeActionSummary:
      "The old callback plan is fenced until urgent recovery truth is reviewed and the next safe route is chosen deliberately.",
    supersededContext: [
      "Superseded: previous callback summary assumed the mobile route was current.",
    ],
    evidence: [
      {
        label: "Reachability",
        value: "disputed",
        detail: "The active contact-route snapshot is stale and under repair.",
      },
      {
        label: "Dependency digest",
        value: "callback queue delayed",
        detail: "Queue health remains degraded but not fully blocked.",
      },
    ],
    consequences: [
      {
        title: "Escalation impact",
        detail: "The dominant action is escalation review with one promoted relief path.",
      },
      {
        title: "Support boundary",
        detail: "Support handoff remains a read-only escape hatch for contact-route repair only.",
      },
    ],
    references: ["Reachability assessment", "Callback timeline"],
    decisionOptions: [
      "Escalate to urgent callback review",
      "Freeze contact-route mutation",
      "Send to support review",
    ],
    moreInfoPrompts: [
      "Ask for a safe alternate callback number.",
      "Confirm if voicemail or text follow-up is acceptable.",
    ],
    quickCapture: {
      endpoints: ["Urgent callback lane", "Support review", "Reachability repair"],
      questionSets: ["Alternate number", "Urgency confirmation"],
      reasonChips: ["Urgent escalation", "Contact route disputed", "Callback follow-up"],
      macros: ["Escalation promoted", "Reachability repair frozen", "Support review prepared"],
      duePicks: ["In 30 minutes", "Today 13:45", "Today 16:30"],
    },
    nextQueueRank: 1,
    currentQueueRank: 2,
    launchQueue: "callback-follow-up",
  },
  {
    id: "task-507",
    patientLabel: "Ravi Singh",
    patientRef: "PT-507-RS1",
    queueKey: "recommended",
    state: "blocked",
    urgencyTone: "critical",
    ageLabel: "61m open",
    freshnessLabel: "Pharmacy intent blocked",
    dueLabel: "Pharmacy response awaited",
    primaryReason: "Pharmacy-intent seed is paused while a duplicate medication route is reconciled.",
    secondaryMeta:
      "Pharmacy intent · blocker active · duplicate suspicion reopened · reviewer Mina Blake",
    previewSummary:
      "The pharmacy line cannot move until the duplicate medication route is reconciled and the returned evidence is acknowledged.",
    previewTrustNote:
      "Preview holds the blocker summary only; the heavy artifact review waits for task open.",
    summaryPoints: [
      "The patient uploaded a second medication label with a different site stamp.",
      "The pharmacy-intent seed is otherwise ready for fulfilment staging.",
      "A reopen event linked the current line to an older duplicate resolution draft.",
    ],
    deltaClass: "decisive",
    deltaSummary:
      "A decisive duplicate-lineage delta blocked the pharmacy intent and forced a reopened review posture.",
    changedFieldRefs: [
      "A newly returned medication label changes the fulfilment route interpretation.",
    ],
    contradictionRefs: [
      "Duplicate-lineage truth now conflicts with the previously settled pharmacy path.",
    ],
    actionInvalidationRefs: [
      "Pharmacy intent may not progress downstream while the duplicate block remains active.",
      "Completion and send actions stay frozen until the conflicting lineage is reconciled.",
    ],
    primaryChangedAnchorRef: "changed-region-task-507-duplicate",
    returnToQuietEligibility: "blocked",
    patientReturnImpact:
      "The patient-supplied label reopened a supposedly settled path, so the next reviewer must see the duplicate contradiction before any fulfilment action is trusted.",
    resumeActionLabel: "Recommit only after duplicate reconciliation",
    resumeActionSummary:
      "This decisive delta blocks quiet return completely until the duplicate route is reconciled and the pharmacy path is rechecked.",
    supersededContext: [
      "Superseded: previous pharmacy-intent preview treated the duplicate review as settled.",
      "Superseded: prior fulfillment readiness note relied on the older medication snapshot.",
    ],
    evidence: [
      {
        label: "Medication snapshot",
        value: "2 conflicting labels",
        detail: "The newer label changes the route interpretation for fulfilment.",
      },
      {
        label: "Pharmacy intent",
        value: "paused",
        detail: "No downstream pharmacy mutation may proceed while the blocker is active.",
      },
    ],
    consequences: [
      {
        title: "Decision impact",
        detail: "DecisionDock must freeze send and completion until the duplicate block clears.",
      },
    ],
    references: ["Pharmacy seed summary", "Duplicate resolution note", "Medication image digest"],
    decisionOptions: [
      "Reconcile duplicate route",
      "Request pharmacy clarification",
      "Hold for manual review",
    ],
    moreInfoPrompts: [
      "Confirm which site supplied the replacement label.",
      "Ask whether the patient still has the original packaging available.",
    ],
    quickCapture: {
      endpoints: ["Pharmacy clarification", "Duplicate review lane"],
      questionSets: ["Medication source", "Replacement supply"],
      reasonChips: ["Pharmacy intent", "Duplicate suspicion", "Returned evidence"],
      macros: ["Freeze fulfilment action", "Duplicate review reopened", "Pharmacy note pending"],
      duePicks: ["Today 15:30", "Tomorrow 09:15", "Tomorrow 11:00"],
    },
    nextQueueRank: 3,
    currentQueueRank: 4,
    launchQueue: "pharmacy-watch",
  },
  {
    id: "task-118",
    patientLabel: "Maya Foster",
    patientRef: "PT-118-MF8",
    queueKey: "recommended",
    state: "reassigned",
    urgencyTone: "info",
    ageLabel: "26m open",
    freshnessLabel: "Reopen watch",
    dueLabel: "Review by 16:20",
    primaryReason: "A reopened admin-resolution case needs a calm changed-since-seen review.",
    secondaryMeta:
      "Reopen watch · admin-resolution seed · no urgent blocker · reviewer Ada Fox",
    previewSummary:
      "The prior admin-resolution outcome was reopened after a new practice note arrived, but the task remains safely reviewable.",
    previewTrustNote:
      "Preview preserves the reopen context and return anchor while staying summary-only.",
    summaryPoints: [
      "The original admin-resolution summary remains visible as superseded context.",
      "A new practice note changes follow-up ownership but not patient safety status.",
      "No urgent interruption wins the shell right now.",
    ],
    deltaClass: "contextual",
    deltaSummary:
      "A contextual reopen delta landed: ownership and next-step language changed, but the prior judgement still holds for now.",
    changedFieldRefs: [
      "A new practice note changed owner and next-step wording for the reopened case.",
    ],
    contradictionRefs: [],
    actionInvalidationRefs: [
      "Admin-resolution close wording remains visible but no longer current.",
    ],
    primaryChangedAnchorRef: "changed-region-task-118-reopen",
    returnToQuietEligibility: "on_ack",
    patientReturnImpact:
      "The patient-facing close note may need correction, so the reopen reason must remain visible until the reviewer acknowledges the new context.",
    resumeActionLabel: "Acknowledge the reopened review context",
    resumeActionSummary:
      "This is a calm reopen. The prior judgement stays visible and secondary while the reviewer confirms the new owner and next step.",
    supersededContext: [
      "Superseded: admin-resolution close note from 10:05 is preserved for comparison.",
    ],
    evidence: [
      {
        label: "Reopen state",
        value: "review required",
        detail: "The task re-entered the queue without losing its prior settlement context.",
      },
      {
        label: "Ownership",
        value: "reassigned",
        detail: "The case must surface calm reassignment instead of silently moving away.",
      },
    ],
    consequences: [
      {
        title: "Review impact",
        detail: "Changed-since-seen review becomes the dominant next step until the reopen is acknowledged.",
      },
    ],
    references: ["Close note v2", "Reopen event digest"],
    decisionOptions: [
      "Acknowledge reopen",
      "Request more info",
      "Return to admin resolution",
    ],
    moreInfoPrompts: [
      "Ask whether the patient-facing completion note needs correcting.",
      "Confirm which owner should receive the reopened follow-up.",
    ],
    quickCapture: {
      endpoints: ["Admin resolution", "Reopen review"],
      questionSets: ["Reopen context", "Ownership clarification"],
      reasonChips: ["Changed since seen", "Reassigned", "Reopen watch"],
      macros: ["Reopen acknowledged", "Owner reassigned", "Quiet return preserved"],
      duePicks: ["Today 16:20", "Tomorrow 10:00", "Tomorrow 12:00"],
    },
    nextQueueRank: 5,
    currentQueueRank: 5,
    launchQueue: "changed-since-seen",
  },
] as const;

type WorkspaceFixtureFlag = "hardening_safe" | "large_queue";

function readWorkspaceFixtureFlags(): ReadonlySet<WorkspaceFixtureFlag> {
  if (typeof window === "undefined") {
    return new Set();
  }
  const params = new URLSearchParams(window.location.search);
  const flags = new Set<WorkspaceFixtureFlag>();
  for (const rawValue of params.getAll("fixture")) {
    for (const token of rawValue.split(",")) {
      const normalized = token.trim().toLowerCase();
      if (normalized === "hardening_safe" || normalized === "large_queue") {
        flags.add(normalized);
      }
    }
  }
  return flags;
}

function anonymizeTaskLabel(taskId: string): string {
  const digits = taskId.replace(/\D+/g, "") || "000";
  return `Case ${digits}`;
}

function anonymizeTaskRef(taskId: string): string {
  const digits = taskId.replace(/\D+/g, "") || "000";
  return `SUBJ-${digits}`;
}

function toSafeCase(task: StaffQueueCase): StaffQueueCase {
  return {
    ...task,
    patientLabel: anonymizeTaskLabel(task.id),
    patientRef: anonymizeTaskRef(task.id),
  };
}

function createLargeQueueClone(template: StaffQueueCase, index: number): StaffQueueCase {
  const ordinal = String(index + 1).padStart(3, "0");
  const queueRank = staffCases.length + index + 1;
  const nextRankOffset = index % 4 === 0 ? -1 : index % 5 === 0 ? 1 : 0;
  const nextQueueRank = Math.max(1, queueRank + nextRankOffset);
  const queueKey = template.queueKey === "recommended" ? "recommended" : template.launchQueue;
  return {
    ...template,
    id: `task-lg-${ordinal}`,
    patientLabel: `Case L${ordinal}`,
    patientRef: `SUBJ-L${ordinal}`,
    queueKey,
    ageLabel: `${12 + (index % 48)}m open`,
    freshnessLabel: index % 3 === 0 ? "Buffered queue replay" : "Authority snapshot current",
    dueLabel: index % 2 === 0 ? "Review by 15:30" : "Review by 16:10",
    primaryReason: `Large-queue fixture row ${ordinal} preserves dense scan semantics without widening clinical meaning.`,
    secondaryMeta: `Large queue fixture · ${template.state.replaceAll("_", " ")} · ${template.launchQueue}`,
    previewSummary: `Fixture row ${ordinal} keeps the same-shell preview contract under dense queue load.`,
    previewTrustNote:
      "Preview remains summary-only and PHI-safe in the hardening fixture while the real route contract is exercised.",
    summaryPoints: [
      `Fixture row ${ordinal} is part of the deterministic >50 row queue workload.`,
      "The row keeps keyboard scan, preview, and launch semantics intact.",
      "No personal data is present in the hardening fixture evidence path.",
    ],
    deltaSummary: `Large-queue fixture row ${ordinal} preserves the ${template.deltaClass} delta grammar under load.`,
    changedFieldRefs: [
      `Fixture row ${ordinal} keeps its changed-field markers explicit under dense rendering.`,
    ],
    contradictionRefs:
      template.contradictionRefs.length > 0
        ? [`Fixture contradiction marker ${ordinal} remains visible under dense rendering.`]
        : [],
    actionInvalidationRefs:
      template.actionInvalidationRefs.length > 0
        ? [`Fixture action invalidation ${ordinal} remains summary-safe under queue load.`]
        : [],
    primaryChangedAnchorRef: `changed-region-task-lg-${ordinal}`,
    patientReturnImpact:
      "The fixture preserves return-to-review semantics while removing personal identifiers from the browser evidence.",
    resumeActionSummary:
      "The fixture row remains launchable and reviewable, but only through the current same-shell authority chain.",
    supersededContext: template.supersededContext.map((_entry, entryIndex) => `Fixture superseded context ${ordinal}-${entryIndex + 1}`),
    evidence: template.evidence.map((entry, entryIndex) => ({
      ...entry,
      value: entryIndex === 0 ? `Fixture bundle ${ordinal}` : entry.value,
      detail: `Fixture evidence ${ordinal}-${entryIndex + 1} remains summary-safe.`,
    })),
    consequences: template.consequences.map((entry, entryIndex) => ({
      ...entry,
      detail: `Fixture consequence ${ordinal}-${entryIndex + 1} remains bounded to the same-shell contract.`,
    })),
    references: template.references.map((_entry, entryIndex) => `Fixture reference ${ordinal}-${entryIndex + 1}`),
    moreInfoPrompts: template.moreInfoPrompts.map(
      (_entry, entryIndex) => `Fixture follow-up prompt ${ordinal}-${entryIndex + 1}`,
    ),
    currentQueueRank: queueRank,
    nextQueueRank,
  };
}

function buildLargeQueueCases(): readonly StaffQueueCase[] {
  const templates = staffCases.map(toSafeCase);
  const clones: StaffQueueCase[] = [];
  for (let index = 0; index < 60; index += 1) {
    const template = templates[index % templates.length]!;
    clones.push(createLargeQueueClone(template, index));
  }
  return clones;
}

function activeStaffCases(): readonly StaffQueueCase[] {
  const flags = readWorkspaceFixtureFlags();
  const safeCases = flags.has("hardening_safe") ? staffCases.map(toSafeCase) : [...staffCases];
  if (!flags.has("large_queue")) {
    return safeCases;
  }
  return [...safeCases, ...buildLargeQueueCases()];
}

export function workspaceFixtureSafePatientLabel(taskId: string, patientLabel: string): string {
  return readWorkspaceFixtureFlags().has("hardening_safe") ? anonymizeTaskLabel(taskId) : patientLabel;
}

export const staffQueues: readonly StaffQueueDefinition[] = [
  {
    key: "recommended",
    label: "Recommended queue",
    description: "Best next queue based on start-of-day role and current interruption weight.",
    recommendedTaskId: "task-311",
    filter: () => true,
  },
  {
    key: "returned-evidence",
    label: "Returned evidence",
    description: "Cases reopened by patient replies, new attachments, or contradiction packets.",
    recommendedTaskId: "task-311",
    filter: (item) => item.deltaClass === "decisive" || item.state === "changed",
  },
  {
    key: "callback-follow-up",
    label: "Callback follow-up",
    description: "Cases where callback intent, reachability drift, or same-day urgency is active.",
    recommendedTaskId: "task-412",
    filter: (item) =>
      item.id === "task-412" || item.quickCapture.reasonChips.includes("Callback follow-up"),
  },
  {
    key: "approvals",
    label: "Approvals lane",
    description: "Cases waiting for a governed approval checkpoint before consequence can settle.",
    recommendedTaskId: "task-208",
    filter: (item) => item.state === "approval",
  },
  {
    key: "pharmacy-watch",
    label: "Pharmacy watch",
    description: "Bounded pharmacy-intent and medication-route blockers inside the same shell.",
    recommendedTaskId: "task-507",
    filter: (item) => item.id === "task-507",
  },
  {
    key: "changed-since-seen",
    label: "Changed since seen",
    description: "Cases that resumed review because the evidence or ownership picture changed.",
    recommendedTaskId: "task-118",
    filter: (item) => item.state === "changed" || item.id === "task-118",
  },
] as const;

interface StaffAttachmentSeed {
  artifactId: string;
  digestKind: AttachmentDigestKind;
  title: string;
  summary: string;
  provenanceLabel: string;
  availabilityLabel: string;
  metaLabel: string;
  hydrationMode: ViewerHydrationMode;
  requestedMode: ArtifactShellSpecimen["context"]["artifactModeRequest"];
  previewPolicy: ArtifactShellSpecimen["contract"]["previewPolicy"];
  requiredSummaryAuthority: ArtifactShellSpecimen["contract"]["requiredSummaryAuthority"];
  authorityState: ArtifactShellSpecimen["parityDigest"]["authorityState"];
  parityState: ArtifactShellSpecimen["parityDigest"]["sourceParityState"];
  channelPosture: ArtifactShellSpecimen["context"]["channelPosture"];
  byteDeliveryPosture: ArtifactShellSpecimen["context"]["byteDeliveryPosture"];
  transferKind: ArtifactShellSpecimen["transferSettlement"]["transferKind"];
  transferState: ArtifactShellSpecimen["transferSettlement"]["authoritativeTransferState"];
  localAckState: ArtifactShellSpecimen["transferSettlement"]["localAckState"];
  grantState: ArtifactShellSpecimen["grant"]["state"];
  summarySections: readonly ArtifactSummarySection[];
  previewPages: readonly ArtifactPreviewPage[];
}

interface StaffThreadEventSeed {
  eventId: string;
  anchorId: string;
  eventKind: ThreadEventRowProjection["eventKind"];
  occurredAt: string;
  headline: string;
  summary: string;
  actorLabel: string;
  visibilityMode: ThreadPreviewMode;
  dispositionClass: ThreadDispositionClass | null;
  settlementResult: ThreadSettlementResult;
  localAckState: ThreadLocalAckState;
  transportState: ThreadTransportState;
  externalObservationState: ThreadExternalObservationState;
  authoritativeOutcomeState: ThreadAuthoritativeOutcomeState;
  repairRequiredState: ThreadRepairRequiredState;
  deliveryRiskState: ThreadDeliveryRiskState;
  attachmentRefs: readonly string[];
}

interface StaffThreadSeed {
  clusterRef: string;
  threadId: string;
  title: string;
  summary: string;
  previewMode: ThreadPreviewMode;
  replyNeededState: ThreadReplyNeededState;
  awaitingReviewState: ThreadAwaitingReviewState;
  repairRequiredState: ThreadRepairRequiredState;
  authoritativeOutcomeState: ThreadAuthoritativeOutcomeState;
  deliveryRiskState: ThreadDeliveryRiskState;
  dominantNextActionRef: string;
  rows: readonly StaffThreadEventSeed[];
}

function artifactSection(
  id: string,
  title: string,
  body: string,
  emphasis?: string,
): ArtifactSummarySection {
  return { id, title, body, emphasis };
}

function artifactPage(id: string, title: string, lines: readonly string[]): ArtifactPreviewPage {
  return { id, title, lines };
}

const staffAttachmentSeedsByTask: Record<string, readonly StaffAttachmentSeed[]> = {
  "task-311": [
    {
      artifactId: "artifact-task-311-inhaler-photo",
      digestKind: "image",
      title: "Corrected inhaler label photo",
      summary: "The returned image shows the controller inhaler variant that contradicts the earlier self-care path.",
      provenanceLabel: "Returned by patient in the accepted late review bundle",
      availabilityLabel: "Governed preview ready",
      metaLabel: "Image · 2.4 MB",
      hydrationMode: "instant",
      requestedMode: "governed_preview",
      previewPolicy: "inline_preview",
      requiredSummaryAuthority: "verified_or_provisional",
      authorityState: "summary_provisional",
      parityState: "summary_provisional",
      channelPosture: "standard_browser",
      byteDeliveryPosture: "available",
      transferKind: "none",
      transferState: "not_started",
      localAckState: "none",
      grantState: "active",
      summarySections: [
        artifactSection(
          "what-changed",
          "What changed",
          "This image is the first returned evidence showing the controller inhaler label rather than the rescue-only assumption in the prior draft.",
          "Summary-first review remains authoritative until the task recommits.",
        ),
        artifactSection(
          "provenance",
          "Provenance",
          "Uploaded with the late-but-accepted patient reply and bound to the current task lineage.",
        ),
      ],
      previewPages: [
        artifactPage("preview-1", "Image summary", [
          "Label clearly reads controller inhaler.",
          "Strength marking contradicts the prior self-care assumption.",
          "Photo captured in the same reply bundle as the voice note.",
        ]),
      ],
    },
    {
      artifactId: "artifact-task-311-pharmacy-transcript",
      digestKind: "document",
      title: "Pharmacy callback transcript excerpt",
      summary: "The callback transcript says the patient was supplied a replacement inhaler with updated dosing guidance.",
      provenanceLabel: "Imported from callback observation and attached to the same request cluster",
      availabilityLabel: "Placeholder-safe heavy preview",
      metaLabel: "Document · 2 pages · 156 KB",
      hydrationMode: "placeholder",
      requestedMode: "governed_preview",
      previewPolicy: "inline_preview",
      requiredSummaryAuthority: "verified_or_provisional",
      authorityState: "summary_provisional",
      parityState: "summary_provisional",
      channelPosture: "standard_browser",
      byteDeliveryPosture: "large_guarded",
      transferKind: "none",
      transferState: "not_started",
      localAckState: "none",
      grantState: "active",
      summarySections: [
        artifactSection(
          "summary",
          "Summary",
          "The transcript excerpt remains viewable as a governed placeholder because the shell keeps the summary authoritative while the heavier body stays bounded.",
        ),
        artifactSection(
          "review-use",
          "Review use",
          "Use this transcript to confirm whether the pharmacy note applies to the current request lineage or a duplicate branch.",
        ),
      ],
      previewPages: [
        artifactPage("preview-1", "Transcript placeholder", [
          "Heavy transcript preview remains guarded.",
          "Summary and provenance stay visible in the same shell.",
        ]),
      ],
    },
    {
      artifactId: "artifact-task-311-voice-note",
      digestKind: "audio",
      title: "Patient overnight voice note",
      summary: "The patient describes worsening wheeze and confirms which inhaler was actually used overnight.",
      provenanceLabel: "Captured in the same accepted late-review bundle as the image attachment",
      availabilityLabel: "Chunked audio preview",
      metaLabel: "Audio · 01:18",
      hydrationMode: "chunked",
      requestedMode: "governed_preview",
      previewPolicy: "inline_preview",
      requiredSummaryAuthority: "verified_or_provisional",
      authorityState: "summary_provisional",
      parityState: "summary_provisional",
      channelPosture: "standard_browser",
      byteDeliveryPosture: "available",
      transferKind: "none",
      transferState: "not_started",
      localAckState: "none",
      grantState: "active",
      summarySections: [
        artifactSection(
          "audio-summary",
          "Audio summary",
          "The spoken account confirms overnight use of the controller inhaler and requests a same-day review.",
        ),
        artifactSection(
          "safety-meaning",
          "Safety meaning",
          "The note raises consequence urgency but does not by itself authorize a new decision path.",
        ),
      ],
      previewPages: [
        artifactPage("preview-1", "Audio digest", [
          "Chunked waveform preview loads only on explicit open.",
          "Full audio playback remains governed by the artifact shell.",
        ]),
      ],
    },
  ],
  "task-208": [
    {
      artifactId: "artifact-task-208-booking-pack",
      digestKind: "document",
      title: "Booking intent summary pack",
      summary: "A compact summary of the booking consequence and the approval-required site change.",
      provenanceLabel: "Generated from the current booking-intent seed and approval frame",
      availabilityLabel: "Governed preview ready",
      metaLabel: "Document · 3 pages",
      hydrationMode: "instant",
      requestedMode: "governed_preview",
      previewPolicy: "inline_preview",
      requiredSummaryAuthority: "verified_or_provisional",
      authorityState: "summary_verified",
      parityState: "summary_verified",
      channelPosture: "standard_browser",
      byteDeliveryPosture: "available",
      transferKind: "none",
      transferState: "not_started",
      localAckState: "none",
      grantState: "active",
      summarySections: [
        artifactSection("approval", "Approval scope", "This pack shows the booking consequence, the approver role, and the irreversible effects."),
      ],
      previewPages: [artifactPage("preview-1", "Booking pack", ["Approval-required site change", "Booking consequence remains staged only"])],
    },
  ],
  "task-412": [
    {
      artifactId: "artifact-task-412-reachability-assessment",
      digestKind: "document",
      title: "Reachability assessment digest",
      summary: "The latest contact-route assessment disputes the mobile number currently attached to callback attempts.",
      provenanceLabel: "Bound to the current callback repair journey",
      availabilityLabel: "Governed preview ready",
      metaLabel: "Document · 1 page",
      hydrationMode: "instant",
      requestedMode: "governed_preview",
      previewPolicy: "inline_preview",
      requiredSummaryAuthority: "verified_or_provisional",
      authorityState: "summary_verified",
      parityState: "summary_verified",
      channelPosture: "standard_browser",
      byteDeliveryPosture: "available",
      transferKind: "none",
      transferState: "not_started",
      localAckState: "none",
      grantState: "active",
      summarySections: [artifactSection("repair", "Repair scope", "Use the assessment to understand why the callback route is paused and what repair evidence is missing.")],
      previewPages: [artifactPage("preview-1", "Reachability digest", ["Mobile route marked disputed", "Urgent callback remains reviewable in-shell"])],
    },
  ],
  "task-507": [
    {
      artifactId: "artifact-task-507-medication-image",
      digestKind: "image",
      title: "Conflicting medication label image",
      summary: "The newer label changes the route interpretation for pharmacy fulfilment.",
      provenanceLabel: "Returned evidence on the reopened duplicate branch",
      availabilityLabel: "Governed preview ready",
      metaLabel: "Image · 1.7 MB",
      hydrationMode: "instant",
      requestedMode: "governed_preview",
      previewPolicy: "inline_preview",
      requiredSummaryAuthority: "verified_or_provisional",
      authorityState: "summary_provisional",
      parityState: "summary_provisional",
      channelPosture: "standard_browser",
      byteDeliveryPosture: "available",
      transferKind: "none",
      transferState: "not_started",
      localAckState: "none",
      grantState: "active",
      summarySections: [artifactSection("duplicate", "Duplicate relevance", "This image is the returned evidence currently blocking the pharmacy intent.")],
      previewPages: [artifactPage("preview-1", "Image summary", ["Second site stamp visible", "Duplicate route no longer reads as settled"])],
    },
  ],
  "task-118": [
    {
      artifactId: "artifact-task-118-reopen-note",
      digestKind: "document",
      title: "Reopen note digest",
      summary: "The new practice note changes ownership but does not currently change patient safety posture.",
      provenanceLabel: "Reopen event summary preserved from the last calm settlement",
      availabilityLabel: "Governed preview ready",
      metaLabel: "Document · 1 page",
      hydrationMode: "instant",
      requestedMode: "governed_preview",
      previewPolicy: "inline_preview",
      requiredSummaryAuthority: "verified_or_provisional",
      authorityState: "summary_verified",
      parityState: "summary_verified",
      channelPosture: "standard_browser",
      byteDeliveryPosture: "available",
      transferKind: "none",
      transferState: "not_started",
      localAckState: "none",
      grantState: "active",
      summarySections: [artifactSection("reopen", "Reopen summary", "The reopen stays lineage-visible and comparison-safe inside the same task shell.")],
      previewPages: [artifactPage("preview-1", "Reopen digest", ["Admin-resolution close note retained", "Ownership change remains the dominant context"])],
    },
  ],
};

const staffThreadSeedsByTask: Record<string, StaffThreadSeed> = {
  "task-311": {
    clusterRef: "conversation_cluster::task-311",
    threadId: "conversation_thread::task-311",
    title: "Patient response thread",
    summary: "The chronology stays review-bound to the accepted late reply, returned attachments, and pharmacy callback note.",
    previewMode: "authenticated_summary",
    replyNeededState: "none",
    awaitingReviewState: "review_pending",
    repairRequiredState: "none",
    authoritativeOutcomeState: "awaiting_review",
    deliveryRiskState: "on_track",
    dominantNextActionRef: "Review returned evidence against the superseded self-care draft.",
    rows: [
      {
        eventId: "thread-event-task-311-reminder",
        anchorId: "thread-anchor-task-311-reminder",
        eventKind: "reminder_notice",
        occurredAt: "2026-04-17T07:52:00Z",
        headline: "Late-window reminder sent",
        summary: "A bounded reminder was issued before the reply window crossed into late review.",
        actorLabel: "Reminder schedule",
        visibilityMode: "authenticated_summary",
        dispositionClass: null,
        settlementResult: "awaiting_external",
        localAckState: "shown",
        transportState: "provider_accepted",
        externalObservationState: "delivered",
        authoritativeOutcomeState: "awaiting_reply",
        repairRequiredState: "none",
        deliveryRiskState: "on_track",
        attachmentRefs: [],
      },
      {
        eventId: "thread-event-task-311-reply",
        anchorId: "thread-anchor-task-311-reply",
        eventKind: "more_info_reply",
        occurredAt: "2026-04-17T08:21:00Z",
        headline: "Patient reply accepted for late review",
        summary: "The reply arrived after the first warning but remains accepted for review rather than expired or silently rejected.",
        actorLabel: "More-info response disposition",
        visibilityMode: "authenticated_summary",
        dispositionClass: "accepted_late_review",
        settlementResult: "review_pending",
        localAckState: "shown",
        transportState: "provider_accepted",
        externalObservationState: "delivered",
        authoritativeOutcomeState: "awaiting_review",
        repairRequiredState: "none",
        deliveryRiskState: "on_track",
        attachmentRefs: ["artifact-task-311-inhaler-photo", "artifact-task-311-voice-note"],
      },
      {
        eventId: "thread-event-task-311-attachment",
        anchorId: "thread-anchor-task-311-attachment",
        eventKind: "attachment_return",
        occurredAt: "2026-04-17T08:22:00Z",
        headline: "Returned attachment bundle preserved",
        summary: "The image and audio remain attached to the current lineage and keep their summary-safe provenance visible.",
        actorLabel: "Attachment digest",
        visibilityMode: "authenticated_summary",
        dispositionClass: "accepted_late_review",
        settlementResult: "accepted_in_place",
        localAckState: "shown",
        transportState: "provider_accepted",
        externalObservationState: "delivered",
        authoritativeOutcomeState: "awaiting_review",
        repairRequiredState: "none",
        deliveryRiskState: "on_track",
        attachmentRefs: ["artifact-task-311-inhaler-photo", "artifact-task-311-voice-note"],
      },
      {
        eventId: "thread-event-task-311-callback",
        anchorId: "thread-anchor-task-311-callback",
        eventKind: "callback_update",
        occurredAt: "2026-04-17T08:27:00Z",
        headline: "Pharmacy callback note reconciled",
        summary: "The callback note now sits in the same chronology, and its review meaning remains pending until the task recommits.",
        actorLabel: "Communication settlement",
        visibilityMode: "authenticated_summary",
        dispositionClass: null,
        settlementResult: "review_pending",
        localAckState: "none",
        transportState: "provider_accepted",
        externalObservationState: "answered",
        authoritativeOutcomeState: "awaiting_review",
        repairRequiredState: "none",
        deliveryRiskState: "on_track",
        attachmentRefs: ["artifact-task-311-pharmacy-transcript"],
      },
    ],
  },
  "task-208": {
    clusterRef: "conversation_cluster::task-208",
    threadId: "conversation_thread::task-208",
    title: "Availability and approval thread",
    summary: "The task stays clinically stable while the patient’s booking preference and approval requirement remain reviewable in one chronology.",
    previewMode: "authenticated_summary",
    replyNeededState: "none",
    awaitingReviewState: "awaiting_review",
    repairRequiredState: "none",
    authoritativeOutcomeState: "awaiting_review",
    deliveryRiskState: "on_track",
    dominantNextActionRef: "Review the approval-required consequence before committing the booking handoff.",
    rows: [
      {
        eventId: "thread-event-task-208-availability",
        anchorId: "thread-anchor-task-208-availability",
        eventKind: "more_info_reply",
        occurredAt: "2026-04-17T08:05:00Z",
        headline: "Patient availability confirmation",
        summary: "The patient confirmed the preferred service window and did not introduce contradictory evidence.",
        actorLabel: "More-info response disposition",
        visibilityMode: "authenticated_summary",
        dispositionClass: "accepted_in_window",
        settlementResult: "accepted_in_place",
        localAckState: "shown",
        transportState: "provider_accepted",
        externalObservationState: "delivered",
        authoritativeOutcomeState: "awaiting_review",
        repairRequiredState: "none",
        deliveryRiskState: "on_track",
        attachmentRefs: ["artifact-task-208-booking-pack"],
      },
    ],
  },
  "task-412": {
    clusterRef: "conversation_cluster::task-412",
    threadId: "conversation_thread::task-412",
    title: "Callback repair thread",
    summary: "Urgent callback work stays visible here, but detailed wording is limited by contact-route repair status.",
    previewMode: "step_up_required",
    replyNeededState: "blocked_by_repair",
    awaitingReviewState: "review_pending",
    repairRequiredState: "contact_route_repair",
    authoritativeOutcomeState: "recovery_required",
    deliveryRiskState: "disputed",
    dominantNextActionRef: "Repair the contact route or escalate with the current callback attempts visible.",
    rows: [
      {
        eventId: "thread-event-task-412-attempt",
        anchorId: "thread-anchor-task-412-attempt",
        eventKind: "callback_update",
        occurredAt: "2026-04-17T08:14:00Z",
        headline: "Callback attempt now disputed",
        summary: "Full callback wording is hidden until the contact route is revalidated, but the failed-attempt posture remains visible.",
        actorLabel: "Callback settlement",
        visibilityMode: "step_up_required",
        dispositionClass: null,
        settlementResult: "repair_required",
        localAckState: "shown",
        transportState: "provider_accepted",
        externalObservationState: "disputed",
        authoritativeOutcomeState: "recovery_required",
        repairRequiredState: "contact_route_repair",
        deliveryRiskState: "disputed",
        attachmentRefs: ["artifact-task-412-reachability-assessment"],
      },
    ],
  },
  "task-507": {
    clusterRef: "conversation_cluster::task-507",
    threadId: "conversation_thread::task-507",
    title: "Duplicate and pharmacy thread",
    summary: "Returned evidence and duplicate review remain visible, but the fulfilment route is still blocked.",
    previewMode: "authenticated_summary",
    replyNeededState: "none",
    awaitingReviewState: "awaiting_review",
    repairRequiredState: "none",
    authoritativeOutcomeState: "awaiting_review",
    deliveryRiskState: "at_risk",
    dominantNextActionRef: "Resolve duplicate lineage before restarting pharmacy fulfilment.",
    rows: [
      {
        eventId: "thread-event-task-507-label",
        anchorId: "thread-anchor-task-507-label",
        eventKind: "attachment_return",
        occurredAt: "2026-04-17T07:58:00Z",
        headline: "Replacement label image attached",
        summary: "The returned image changes the medication route interpretation and keeps pharmacy intent blocked.",
        actorLabel: "Attachment digest",
        visibilityMode: "authenticated_summary",
        dispositionClass: "accepted_in_window",
        settlementResult: "review_pending",
        localAckState: "shown",
        transportState: "provider_accepted",
        externalObservationState: "delivered",
        authoritativeOutcomeState: "awaiting_review",
        repairRequiredState: "none",
        deliveryRiskState: "at_risk",
        attachmentRefs: ["artifact-task-507-medication-image"],
      },
    ],
  },
  "task-118": {
    clusterRef: "conversation_cluster::task-118",
    threadId: "conversation_thread::task-118",
    title: "Reopen continuity thread",
    summary: "The reopen event and ownership correction remain quiet but explicitly reviewable.",
    previewMode: "authenticated_summary",
    replyNeededState: "none",
    awaitingReviewState: "awaiting_review",
    repairRequiredState: "none",
    authoritativeOutcomeState: "awaiting_review",
    deliveryRiskState: "on_track",
    dominantNextActionRef: "Acknowledge the reopen before returning to bounded admin follow-up.",
    rows: [
      {
        eventId: "thread-event-task-118-reopen",
        anchorId: "thread-anchor-task-118-reopen",
        eventKind: "repair_update",
        occurredAt: "2026-04-17T08:02:00Z",
        headline: "Reopen event preserved in chronology",
        summary: "The close note remains visible as superseded context while the new owner reviews the reopened path.",
        actorLabel: "Reopen lineage",
        visibilityMode: "authenticated_summary",
        dispositionClass: null,
        settlementResult: "review_pending",
        localAckState: "none",
        transportState: "local_only",
        externalObservationState: "unobserved",
        authoritativeOutcomeState: "awaiting_review",
        repairRequiredState: "none",
        deliveryRiskState: "on_track",
        attachmentRefs: ["artifact-task-118-reopen-note"],
      },
    ],
  },
};

export const staffHomeModules: readonly StaffHomeModule[] = [
  {
    id: "today-workbench-hero",
    title: "TodayWorkbenchHero",
    summary: "Resume the returned-evidence queue and reopen the active inhaler review first.",
    detail:
      "The recommended queue stays expanded because decisive deltas landed in the last acknowledged review cycle.",
    tone: "neutral",
    taskRefs: ["task-311", "task-412"],
  },
  {
    id: "interruption-digest",
    title: "InterruptionDigest",
    summary: "1 blocker, 1 urgent escalation, 2 watch items.",
    detail:
      "Escalation remains the only promoted interruption; the rest stay summary-level until selected.",
    tone: "critical",
    taskRefs: ["task-412", "task-507"],
  },
  {
    id: "team-risk-digest",
    title: "TeamRiskDigest",
    summary: "Booking approvals are accumulating while callback follow-up is time-sensitive.",
    detail:
      "The team-risk digest stays summary-only until the operator explicitly promotes a lane.",
    tone: "caution",
    taskRefs: ["task-208", "task-118"],
  },
  {
    id: "recent-resumption-strip",
    title: "RecentResumptionStrip",
    summary: "Recent resumptions preserve the exact row and quiet-return target from the last safe read.",
    detail:
      "Task 118 and Task 311 are ready to resume without resetting the queue context or decision rail.",
    tone: "neutral",
    taskRefs: ["task-118", "task-311"],
  },
] as const;

function requireCase(taskId: string): StaffQueueCase {
  const task = activeStaffCases().find((candidate) => candidate.id === taskId);
  if (!task) {
    throw new Error(`STAFF_CASE_UNKNOWN:${taskId}`);
  }
  return task;
}

export { requireCase };

export function requireQueue(queueKey: string): StaffQueueDefinition {
  const queue = staffQueues.find((candidate) => candidate.key === queueKey);
  if (!queue) {
    throw new Error(`STAFF_QUEUE_UNKNOWN:${queueKey}`);
  }
  return queue;
}

export function listQueueCases(queueKey: string): StaffQueueCase[] {
  const queue = requireQueue(queueKey);
  return activeStaffCases()
    .filter(queue.filter)
    .sort((left, right) => left.currentQueueRank - right.currentQueueRank);
}

export function listSearchCases(query: string): StaffQueueCase[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [];
  }
  return activeStaffCases().filter((item) =>
    [
      item.patientLabel,
      item.patientRef,
      item.primaryReason,
      item.secondaryMeta,
      item.queueKey,
      item.id,
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalized),
  );
}

export function applyQueueChangeBatch(
  rows: readonly StaffQueueCase[],
  selectedTaskId: string,
): StaffQueueCase[] {
  const currentRows = [...rows];
  const selectedIndex = currentRows.findIndex((row) => row.id === selectedTaskId);
  const selectedRow = selectedIndex >= 0 ? currentRows[selectedIndex] : null;
  const reranked = [...currentRows].sort((left, right) => left.nextQueueRank - right.nextQueueRank);

  if (!selectedRow || selectedIndex < 0) {
    return reranked;
  }

  const withoutSelected = reranked.filter((row) => row.id !== selectedTaskId);
  withoutSelected.splice(Math.min(selectedIndex, withoutSelected.length), 0, selectedRow);
  return withoutSelected;
}

export function routeFamilyRefForKind(
  kind: StaffRouteKind,
): "rf_staff_workspace" | "rf_staff_workspace_child" {
  switch (kind) {
    case "home":
    case "queue":
    case "task":
      return "rf_staff_workspace";
    case "more-info":
    case "decision":
    case "validation":
    case "consequences":
    case "callbacks":
    case "messages":
    case "approvals":
    case "escalations":
    case "changed":
    case "bookings":
    case "search":
    case "support-handoff":
      return "rf_staff_workspace_child";
  }
}

export function buildStaffPath(route: {
  kind: StaffRouteKind;
  queueKey?: string | null;
  taskId?: string | null;
  bookingCaseId?: string | null;
  searchQuery?: string;
}): string {
  switch (route.kind) {
    case "home":
      return "/workspace";
    case "queue":
      return `/workspace/queue/${route.queueKey ?? "recommended"}`;
    case "task":
      return `/workspace/task/${route.taskId ?? "task-311"}`;
    case "more-info":
      return `/workspace/task/${route.taskId ?? "task-311"}/more-info`;
    case "decision":
      return `/workspace/task/${route.taskId ?? "task-311"}/decision`;
    case "validation":
      return "/workspace/validation";
    case "consequences":
      return "/workspace/consequences";
    case "callbacks":
      return "/workspace/callbacks";
    case "messages":
      return "/workspace/messages";
    case "approvals":
      return "/workspace/approvals";
    case "escalations":
      return "/workspace/escalations";
    case "changed":
      return "/workspace/changed";
    case "bookings":
      return route.bookingCaseId ? `/workspace/bookings/${route.bookingCaseId}` : "/workspace/bookings";
    case "search": {
      const search = route.searchQuery?.trim();
      return search ? `/workspace/search?q=${encodeURIComponent(search)}` : "/workspace/search";
    }
    case "support-handoff":
      return "/workspace/support-handoff";
  }
}

function titleForRoute(route: StaffRouteKind): string {
  switch (route) {
    case "home":
      return "Workspace Home";
    case "queue":
      return "Queue workboard";
    case "task":
      return "Active task";
    case "more-info":
      return "More-info compose";
    case "decision":
      return "Decision preview";
    case "validation":
      return "Clinical beta validation";
    case "consequences":
      return "Consequences";
    case "callbacks":
      return "Callback operations";
    case "messages":
      return "Clinician messaging";
    case "approvals":
      return "Approvals";
    case "escalations":
      return "Escalations";
    case "changed":
      return "Changed since seen";
    case "bookings":
      return "Bookings";
    case "search":
      return "Search";
    case "support-handoff":
      return "Support handoff";
  }
}

function sectionForRoute(route: StaffRouteKind): string {
  switch (route) {
    case "callbacks":
      return "Callbacks";
    case "consequences":
      return "Consequences";
    case "messages":
      return "Messages";
    case "approvals":
      return "Approvals";
    case "escalations":
      return "Escalations";
    case "changed":
      return "Changed";
    case "bookings":
      return "Bookings";
    case "search":
      return "Search";
    case "validation":
      return "Validation";
    default:
      return "Queue";
  }
}

export function parseStaffPath(pathname: string, search = ""): StaffShellRoute {
  const normalizedPath = pathname === "/" ? "/workspace" : pathname.replace(/\/+$/, "") || "/workspace";
  const params = new URLSearchParams(search);
  const queueMatch = normalizedPath.match(/^\/workspace\/queue\/([^/]+)$/);
  if (queueMatch) {
    const queueKey = decodeURIComponent(queueMatch[1] ?? "recommended");
    return {
      kind: "queue",
      path: buildStaffPath({ kind: "queue", queueKey }),
      routeFamilyRef: "rf_staff_workspace",
      title: titleForRoute("queue"),
      sectionLabel: sectionForRoute("queue"),
      queueKey,
      taskId: null,
      searchQuery: "",
    };
  }

  const taskChildMatch = normalizedPath.match(/^\/workspace\/task\/([^/]+)\/(more-info|decision)$/);
  if (taskChildMatch) {
    const taskId = decodeURIComponent(taskChildMatch[1] ?? "task-311");
    const kind = (taskChildMatch[2] ?? "more-info") as "more-info" | "decision";
    return {
      kind,
      path: buildStaffPath({ kind, taskId }),
      routeFamilyRef: "rf_staff_workspace_child",
      title: titleForRoute(kind),
      sectionLabel: sectionForRoute(kind),
      queueKey: requireCase(taskId).launchQueue,
      taskId,
      searchQuery: "",
    };
  }

  const taskMatch = normalizedPath.match(/^\/workspace\/task\/([^/]+)$/);
  if (taskMatch) {
    const taskId = decodeURIComponent(taskMatch[1] ?? "task-311");
    return {
      kind: "task",
      path: buildStaffPath({ kind: "task", taskId }),
      routeFamilyRef: "rf_staff_workspace",
      title: titleForRoute("task"),
      sectionLabel: sectionForRoute("task"),
      queueKey: requireCase(taskId).launchQueue,
      taskId,
      searchQuery: "",
    };
  }

  if (normalizedPath === "/workspace/callbacks") {
    return {
      kind: "callbacks",
      path: "/workspace/callbacks",
      routeFamilyRef: "rf_staff_workspace_child",
      title: titleForRoute("callbacks"),
      sectionLabel: sectionForRoute("callbacks"),
      queueKey: "callback-follow-up",
      taskId: "task-412",
      searchQuery: "",
    };
  }

  if (normalizedPath === "/workspace/validation") {
    return {
      kind: "validation",
      path: "/workspace/validation",
      routeFamilyRef: "rf_staff_workspace_child",
      title: titleForRoute("validation"),
      sectionLabel: sectionForRoute("validation"),
      queueKey: "recommended",
      taskId: "task-311",
      searchQuery: "",
    };
  }

  if (normalizedPath === "/workspace/consequences") {
    return {
      kind: "consequences",
      path: "/workspace/consequences",
      routeFamilyRef: "rf_staff_workspace_child",
      title: titleForRoute("consequences"),
      sectionLabel: sectionForRoute("consequences"),
      queueKey: "recommended",
      taskId: "task-311",
      searchQuery: "",
    };
  }

  if (normalizedPath === "/workspace/messages") {
    return {
      kind: "messages",
      path: "/workspace/messages",
      routeFamilyRef: "rf_staff_workspace_child",
      title: titleForRoute("messages"),
      sectionLabel: sectionForRoute("messages"),
      queueKey: "recommended",
      taskId: "task-208",
      searchQuery: "",
    };
  }

  if (normalizedPath === "/workspace/approvals") {
    return {
      kind: "approvals",
      path: "/workspace/approvals",
      routeFamilyRef: "rf_staff_workspace_child",
      title: titleForRoute("approvals"),
      sectionLabel: sectionForRoute("approvals"),
      queueKey: "approvals",
      taskId: "task-208",
      searchQuery: "",
    };
  }

  if (normalizedPath === "/workspace/escalations") {
    return {
      kind: "escalations",
      path: "/workspace/escalations",
      routeFamilyRef: "rf_staff_workspace_child",
      title: titleForRoute("escalations"),
      sectionLabel: sectionForRoute("escalations"),
      queueKey: "callback-follow-up",
      taskId: "task-412",
      searchQuery: "",
    };
  }

  if (normalizedPath === "/workspace/changed") {
    return {
      kind: "changed",
      path: "/workspace/changed",
      routeFamilyRef: "rf_staff_workspace_child",
      title: titleForRoute("changed"),
      sectionLabel: sectionForRoute("changed"),
      queueKey: "changed-since-seen",
      taskId: "task-311",
      searchQuery: "",
    };
  }

  const bookingMatch = normalizedPath.match(/^\/workspace\/bookings(?:\/([^/]+))?$/);
  if (bookingMatch) {
    const bookingCaseId = decodeURIComponent(bookingMatch[1] ?? defaultStaffBookingCaseId);
    const bookingSeed = resolveStaffBookingCaseSeed(bookingCaseId);
    return {
      kind: "bookings",
      path: buildStaffPath({ kind: "bookings", bookingCaseId: bookingSeed.bookingCaseId }),
      routeFamilyRef: "rf_staff_workspace_child",
      title: titleForRoute("bookings"),
      sectionLabel: sectionForRoute("bookings"),
      queueKey: bookingSeed.queueKey,
      taskId: bookingSeed.taskId,
      bookingCaseId: bookingSeed.bookingCaseId,
      searchQuery: "",
    };
  }

  if (normalizedPath === "/workspace/search") {
    const searchQuery = params.get("q") ?? "";
    return {
      kind: "search",
      path: buildStaffPath({ kind: "search", searchQuery }),
      routeFamilyRef: "rf_staff_workspace_child",
      title: titleForRoute("search"),
      sectionLabel: sectionForRoute("search"),
      queueKey: "recommended",
      taskId: null,
      searchQuery,
    };
  }

  if (normalizedPath === "/workspace/support-handoff") {
    return {
      kind: "support-handoff",
      path: "/workspace/support-handoff",
      routeFamilyRef: "rf_staff_workspace_child",
      title: titleForRoute("support-handoff"),
      sectionLabel: sectionForRoute("support-handoff"),
      queueKey: "callback-follow-up",
      taskId: "task-412",
      searchQuery: "",
    };
  }

  return {
    kind: "home",
    path: "/workspace",
    routeFamilyRef: "rf_staff_workspace",
    title: titleForRoute("home"),
    sectionLabel: sectionForRoute("home"),
    queueKey: "recommended",
    taskId: "task-311",
    searchQuery: "",
  };
}

export function defaultAnchorForRoute(route: StaffShellRoute): string {
  switch (route.kind) {
    case "home":
      return "hero-recommended-queue";
    case "queue":
      return `queue-row-${requireQueue(route.queueKey ?? "recommended").recommendedTaskId}`;
    case "task":
      return `task-summary-${route.taskId ?? "task-311"}`;
    case "more-info":
      return `more-info-compose-${route.taskId ?? "task-311"}`;
    case "decision":
      return `decision-preview-${route.taskId ?? "task-311"}`;
    case "validation":
      return "validation-north-star-band";
    case "consequences":
      return `consequence-detail-${route.taskId ?? "task-311"}`;
    case "callbacks":
      return `callback-detail-${route.taskId ?? "task-412"}`;
    case "messages":
      return `message-detail-${route.taskId ?? "task-208"}`;
    case "approvals":
      return "approval-preview-task-208";
    case "escalations":
      return "escalation-preview-task-412";
    case "changed":
      return "changed-delta-task-311";
    case "bookings":
      return resolveStaffBookingCaseSeed(route.bookingCaseId).defaultAnchorRef;
    case "search":
      return "search-results";
    case "support-handoff":
      return "support-handoff-stub";
  }
}

export function createInitialLedger(
  route: StaffShellRoute,
  runtimeScenario: RuntimeScenario,
): StaffShellLedger {
  const bookingSeed = route.kind === "bookings" ? resolveStaffBookingCaseSeed(route.bookingCaseId) : null;
  const queuedBatchPending =
    route.kind === "queue" ||
    route.kind === "home" ||
    route.kind === "callbacks" ||
    route.kind === "messages" ||
    Boolean(bookingSeed?.queueBuffered);
  return {
    path: route.path,
    selectedAnchorId: defaultAnchorForRoute(route),
    queueKey: route.queueKey ?? "recommended",
    selectedTaskId: route.taskId ?? "task-311",
    previewTaskId: route.taskId ?? "task-311",
    searchQuery: route.searchQuery,
    callbackStage: "detail",
    messageStage: "detail",
    bufferedUpdateCount: queuedBatchPending ? 3 : 0,
    queuedBatchPending,
    bufferedQueueTrayState:
      route.kind === "callbacks" || route.kind === "messages"
        ? "collapsed"
        : queuedBatchPending
          ? "expanded"
          : "collapsed",
    runtimeScenario,
    lastQuietRegionLabel:
      route.kind === "home"
        ? "Today workbench hero"
        : route.kind === "callbacks"
          ? "Callback workbench"
          : route.kind === "consequences"
            ? "Bounded consequence studio"
            : route.kind === "messages"
              ? "Thread repair studio"
              : route.kind === "bookings"
                ? "Staff booking control panel"
                : "Queue workboard",
  };
}

const STAFF_MANIFEST_BASE = {
  audienceSurface: "audsurf_clinical_workspace",
  shellType: "staff",
  routeFamilyRefs: ["rf_staff_workspace", "rf_staff_workspace_child"],
  gatewaySurfaceRef: "gws_clinician_workspace",
  gatewaySurfaceRefs: [
    "gws_clinician_workspace",
    "gws_clinician_workspace_child",
    "gws_practice_ops_workspace",
    "gws_assistive_sidecar",
  ],
  surfaceRouteContractRef: "ASRC_050_CLINICAL_WORKSPACE_V1",
  surfacePublicationRef: "ASPR_050_CLINICAL_WORKSPACE_V1",
  audienceSurfaceRuntimeBindingRef: "ASRB_050_CLINICAL_WORKSPACE_V1",
  designContractPublicationBundleRef: "dcpb::clinical_workspace::planned",
  tokenKernelLayeringPolicyRef: "TKLP_SIGNAL_ATLAS_LIVE_V1",
  profileSelectionResolutionRefs: [
    "PSR_050_CLINICAL_WORKSPACE_V1",
    "PSR_050_STAFF_V1",
    "PSR_050_RF_STAFF_WORKSPACE_V1",
    "PSR_050_RF_STAFF_WORKSPACE_CHILD_V1",
  ],
  surfaceStateKernelBindingRefs: [
    "SSKB_050_RF_STAFF_WORKSPACE_V1",
    "SSKB_050_RF_STAFF_WORKSPACE_CHILD_V1",
  ],
  projectionContractVersionSetRef: "PCVS_050_CLINICAL_WORKSPACE_V1",
  runtimePublicationBundleRef: "rpb::clinical_workspace::planned",
  projectionQueryContractRefs: [
    "PQC_050_RF_STAFF_WORKSPACE_V1",
    "PQC_050_RF_STAFF_WORKSPACE_CHILD_V1",
  ],
  projectionQueryContractDigestRefs: [
    "projection-query-digest::0973bb4a4950c84e",
    "projection-query-digest::5e6e47f740c068fa",
  ],
  mutationCommandContractRefs: [
    "MCC_050_RF_STAFF_WORKSPACE_V1",
    "MCC_050_RF_STAFF_WORKSPACE_CHILD_V1",
  ],
  mutationCommandContractDigestRefs: [
    "mutation-command-digest::18af4e7a1c26e0b8",
    "mutation-command-digest::d688764d7d04d722",
  ],
  liveUpdateChannelContractRefs: [
    "LCC_050_RF_STAFF_WORKSPACE_V1",
    "LCC_050_RF_STAFF_WORKSPACE_CHILD_V1",
  ],
  liveUpdateChannelDigestRefs: [
    "live-channel-digest::49525887f7d162dc",
    "live-channel-digest::b377fa0b95ed96af",
  ],
  clientCachePolicyRef: "CP_WORKSPACE_SINGLE_ORG_PRIVATE",
  clientCachePolicyRefs: [
    "CP_ASSISTIVE_ADJUNCT_NO_PERSIST",
    "CP_WORKSPACE_CHILD_PRIVATE_EPHEMERAL",
    "CP_WORKSPACE_SINGLE_ORG_PRIVATE",
  ],
  clientCachePolicyDigestRefs: [
    "cache-policy-digest::2b4638d623680784",
    "cache-policy-digest::eb30b568e5146fc1",
    "cache-policy-digest::7674a539240e0f9e",
  ],
  commandSettlementSchemaRef: "CommandSettlementSchema::staff_workspace::v1",
  commandSettlementSchemaRefs: [
    "CommandSettlementSchema::staff_workspace::v1",
    "CommandSettlementSchema::staff_workspace_child::v1",
  ],
  transitionEnvelopeSchemaRef: "TransitionEnvelopeSchema::staff_workspace::v1",
  transitionEnvelopeSchemaRefs: [
    "TransitionEnvelopeSchema::staff_workspace::v1",
    "TransitionEnvelopeSchema::staff_workspace_child::v1",
  ],
  releaseRecoveryDispositionRef: "RRD_WORKSPACE_READ_ONLY",
  releaseRecoveryDispositionRefs: [
    "RRD_ASSISTIVE_READ_ONLY",
    "RRD_ASSISTIVE_SIDECAR_FROZEN",
    "RRD_WORKSPACE_CHILD_READ_ONLY",
    "RRD_WORKSPACE_CHILD_RECOVERY_ONLY",
    "RRD_WORKSPACE_QUEUE_PLACEHOLDER",
    "RRD_WORKSPACE_READ_ONLY",
  ],
  routeFreezeDispositionRef: "RFD_050_CLINICAL_WORKSPACE_V1",
  routeFreezeDispositionRefs: ["RFD_050_CLINICAL_WORKSPACE_V1"],
  designContractLintVerdictRef: "dclv::clinical_workspace::seed_ready",
  profileLayeringDigestRef: "81672401de8a72af",
  kernelPropagationDigestRef: "5a17eb84d7331069",
  accessibilitySemanticCoverageProfileRefs: [
    "ASCP_050_RF_STAFF_WORKSPACE_V1",
    "ASCP_050_RF_STAFF_WORKSPACE_CHILD_V1",
  ],
  automationAnchorProfileRefs: [
    "AAP_050_RF_STAFF_WORKSPACE_V1",
    "AAP_050_RF_STAFF_WORKSPACE_CHILD_V1",
  ],
  surfaceStateSemanticsProfileRefs: [
    "SSSP_050_RF_STAFF_WORKSPACE_V1",
    "SSSP_050_RF_STAFF_WORKSPACE_CHILD_V1",
  ],
  source_refs: [
    "prompt/116.md",
    "prompt/shared_operating_contract_116_to_125.md",
    "blueprint/staff-workspace-interface-architecture.md#Route family",
    "blueprint/staff-workspace-interface-architecture.md#WorkspaceNavigationLedger",
    "blueprint/platform-frontend-blueprint.md#PersistentShell",
    "blueprint/forensic-audit-findings.md#Finding 92",
  ],
} as const;

function scenarioManifestTuple(runtimeScenario: RuntimeScenario) {
  switch (runtimeScenario) {
    case "live":
      return {
        browserPostureState: "publishable_live" as const,
        designContractLintState: "pass" as const,
        accessibilityCoverageState: "complete" as const,
        projectionCompatibilityState: "exact" as const,
        runtimeBindingState: "exact" as const,
        runtimePublicationState: "published" as const,
        publicationParityState: "exact" as const,
        manifestState: "current" as const,
        accessibilityCoverageDigestRef: "acd::staff_workspace::seed_live",
        projectionCompatibilityDigestRef: "pcd::staff_workspace::seed_live",
        generatedAt: "2026-04-13T21:00:00Z",
      };
    case "stale_review":
      return {
        browserPostureState: "read_only" as const,
        designContractLintState: "pass" as const,
        accessibilityCoverageState: "complete" as const,
        projectionCompatibilityState: "constrained" as const,
        runtimeBindingState: "exact" as const,
        runtimePublicationState: "published" as const,
        publicationParityState: "stale" as const,
        manifestState: "drifted" as const,
        accessibilityCoverageDigestRef: "acd::staff_workspace::seed_live",
        projectionCompatibilityDigestRef: "pcd::staff_workspace::stale_review",
        generatedAt: "2026-04-13T21:05:00Z",
      };
    case "read_only":
      return {
        browserPostureState: "read_only" as const,
        designContractLintState: "drifted" as const,
        accessibilityCoverageState: "complete" as const,
        projectionCompatibilityState: "constrained" as const,
        runtimeBindingState: "exact" as const,
        runtimePublicationState: "stale" as const,
        publicationParityState: "stale" as const,
        manifestState: "drifted" as const,
        accessibilityCoverageDigestRef: "acd::staff_workspace::read_only",
        projectionCompatibilityDigestRef: "pcd::staff_workspace::read_only",
        generatedAt: "2026-04-13T21:10:00Z",
      };
    case "recovery_only":
      return {
        browserPostureState: "recovery_only" as const,
        designContractLintState: "pass" as const,
        accessibilityCoverageState: "degraded" as const,
        projectionCompatibilityState: "recovery_only" as const,
        runtimeBindingState: "stale" as const,
        runtimePublicationState: "published" as const,
        publicationParityState: "exact" as const,
        manifestState: "drifted" as const,
        accessibilityCoverageDigestRef: "acd::staff_workspace::recovery_only",
        projectionCompatibilityDigestRef: "pcd::staff_workspace::recovery_only",
        generatedAt: "2026-04-13T21:15:00Z",
      };
    case "blocked":
      return {
        browserPostureState: "blocked" as const,
        designContractLintState: "blocked" as const,
        accessibilityCoverageState: "blocked" as const,
        projectionCompatibilityState: "blocked" as const,
        runtimeBindingState: "blocked" as const,
        runtimePublicationState: "withdrawn" as const,
        publicationParityState: "withdrawn" as const,
        manifestState: "rejected" as const,
        accessibilityCoverageDigestRef: "acd::staff_workspace::blocked",
        projectionCompatibilityDigestRef: "pcd::staff_workspace::blocked",
        generatedAt: "2026-04-13T21:20:00Z",
      };
  }
}

export function createStaffManifest(
  runtimeScenario: RuntimeScenario,
): StaffFrontendContractManifest {
  const tuple = scenarioManifestTuple(runtimeScenario);
  return {
    ...generateFrontendContractManifest({
    frontendContractManifestId: `FCM_116_STAFF_WORKSPACE_${runtimeScenario.toUpperCase()}`,
    ...STAFF_MANIFEST_BASE,
    ...tuple,
    }),
    shellType: "staff",
  };
}

function surfaceAuthorityStateForScenario(
  runtimeScenario: RuntimeScenario,
): ReleaseTrustFreezeVerdictLike["surfaceAuthorityState"] {
  switch (runtimeScenario) {
    case "live":
      return "live";
    case "stale_review":
    case "read_only":
      return "diagnostic_only";
    case "recovery_only":
      return "recovery_only";
    case "blocked":
      return "blocked";
  }
}

function mutationAuthorityForScenario(
  runtimeScenario: RuntimeScenario,
): ReleaseTrustFreezeVerdictLike["mutationAuthorityState"] {
  switch (surfaceAuthorityStateForScenario(runtimeScenario)) {
    case "live":
      return "enabled";
    case "diagnostic_only":
      return "observe_only";
    case "recovery_only":
      return "governed_recovery";
    case "blocked":
      return "blocked";
  }
}

export function createStaffRouteAuthority(
  route: StaffShellRoute,
  runtimeScenario: RuntimeScenario,
): StaffRouteAuthorityArtifacts {
  const manifest = createStaffManifest(runtimeScenario);
  const verdict = validateFrontendContractManifest(manifest, {
    routeFamilyRef: route.routeFamilyRef,
  });
  const runtimeBinding: AudienceSurfaceRuntimeBindingLike = {
    audienceSurfaceRuntimeBindingId: manifest.audienceSurfaceRuntimeBindingRef,
    audienceSurface: manifest.audienceSurface,
    routeFamilyRefs: manifest.routeFamilyRefs,
    gatewaySurfaceRefs: manifest.gatewaySurfaceRefs,
    surfaceRouteContractRef: manifest.surfaceRouteContractRef,
    surfacePublicationRef: manifest.surfacePublicationRef,
    runtimePublicationBundleRef: manifest.runtimePublicationBundleRef,
    designContractPublicationBundleRef: manifest.designContractPublicationBundleRef,
    bindingState:
      runtimeScenario === "live"
        ? "live"
        : runtimeScenario === "stale_review" || runtimeScenario === "read_only"
          ? "read_only"
          : runtimeScenario === "recovery_only"
            ? "recovery_only"
            : "blocked",
    surfaceAuthorityState: surfaceAuthorityStateForScenario(runtimeScenario),
    releaseRecoveryDispositionRefs: manifest.releaseRecoveryDispositionRefs,
    routeFreezeDispositionRefs: manifest.routeFreezeDispositionRefs,
    surfaceTupleHash: manifest.surfaceAuthorityTupleHash,
    generatedAt: manifest.generatedAt,
  };
  const releaseVerdict: ReleaseTrustFreezeVerdictLike = {
    releaseTrustFreezeVerdictId: `RTFV_116_${route.routeFamilyRef.toUpperCase()}_${runtimeScenario.toUpperCase()}`,
    audienceSurface: manifest.audienceSurface,
    routeFamilyRef: route.routeFamilyRef,
    surfaceAuthorityState: surfaceAuthorityStateForScenario(runtimeScenario),
    calmTruthState: runtimeScenario === "live" ? "allowed" : "suppressed",
    mutationAuthorityState: mutationAuthorityForScenario(runtimeScenario),
    blockerRefs:
      runtimeScenario === "live"
        ? []
        : runtimeScenario === "blocked"
          ? ["BLOCKER_RELEASE_PARITY_NOT_EXACT", "BLOCKER_RUNTIME_PUBLICATION_WITHDRAWN"]
          : ["BLOCKER_CALM_OR_WRITABLE_POSTURE_SUPPRESSED"],
    evaluatedAt: manifest.generatedAt,
  };

  let routeFreezeDisposition: RouteFreezeDispositionLike | null = null;
  let releaseRecoveryDisposition: ReleaseRecoveryDispositionLike | null = null;
  if (runtimeScenario !== "live") {
    routeFreezeDisposition = {
      routeFreezeDispositionId: `RFD_116_${route.routeFamilyRef.toUpperCase()}_${runtimeScenario.toUpperCase()}`,
      routeFamilyRef: route.routeFamilyRef,
      freezeState:
        runtimeScenario === "blocked"
          ? "blocked"
          : runtimeScenario === "recovery_only"
            ? "recovery_only"
            : "read_only",
      sameShellDisposition:
        runtimeScenario === "blocked"
          ? "downgrade_blocked"
          : runtimeScenario === "recovery_only"
            ? "downgrade_recovery_only"
            : "downgrade_read_only",
      recoveryActionLabel:
        runtimeScenario === "blocked"
          ? "Open recovery summary"
          : runtimeScenario === "recovery_only"
            ? "Restore the last safe task snapshot"
            : "Review the current tuple",
      reasonRefs:
        runtimeScenario === "blocked"
          ? ["runtime_publication_withdrawn", "manifest_state_rejected"]
          : runtimeScenario === "recovery_only"
            ? ["runtime_binding_stale", "focus_protection_invalidated"]
            : ["projection_truth_under_review"],
    };
    releaseRecoveryDisposition = {
      releaseRecoveryDispositionId: `RRD_116_${route.routeFamilyRef.toUpperCase()}_${runtimeScenario.toUpperCase()}`,
      posture:
        runtimeScenario === "blocked"
          ? "blocked"
          : runtimeScenario === "recovery_only"
            ? "recovery_only"
            : "read_only",
      label:
        runtimeScenario === "blocked"
          ? "Blocked recovery"
          : runtimeScenario === "recovery_only"
            ? "Same-shell recovery"
            : "Read-only preserve",
      summary:
        runtimeScenario === "blocked"
          ? "The shell keeps the last safe task summary while publication authority is withdrawn."
          : runtimeScenario === "recovery_only"
            ? "Focus-protected work stays frozen in place until the reviewer restores the tuple."
            : "The same shell remains visible, but writable posture is fenced until review completes.",
      actionLabel:
        runtimeScenario === "blocked"
          ? "Return to last safe summary"
          : runtimeScenario === "recovery_only"
            ? "Restore draft and review delta"
            : "Recheck decisive delta",
      continuityMode:
        runtimeScenario === "blocked"
          ? "review_summary"
          : runtimeScenario === "recovery_only"
            ? "resume_return_contract"
            : "refresh_tuple",
      reasonRefs:
        runtimeScenario === "blocked"
          ? ["manifest_state_rejected", "runtime_publication_withdrawn"]
          : runtimeScenario === "recovery_only"
            ? ["runtime_binding_stale", "workspace_focus_protection_invalidated"]
            : ["projection_truth_under_review"],
    };
  }

  const guardManifest = {
    ...manifest,
    browserPostureState:
      runtimeScenario === "live"
        ? "live"
        : runtimeScenario === "recovery_only"
          ? "recovery_only"
          : runtimeScenario === "blocked"
            ? "blocked"
            : "read_only",
  } as const;

  const guardDecision = resolveRouteGuardDecision({
    routeFamilyRef: route.routeFamilyRef,
    manifest: guardManifest,
    runtimeBinding,
    hydrationState: runtimeScenario === "live" ? "binding_ready" : "binding_invalid",
    audienceContext: {
      audienceSurface: manifest.audienceSurface,
      channelProfile: "browser",
    },
    releaseVerdict,
    routeFreezeDisposition,
    releaseRecoveryDisposition,
  });

  return {
    manifest,
    verdict,
    runtimeBinding,
    releaseVerdict,
    routeFreezeDisposition,
    releaseRecoveryDisposition,
    guardDecision,
  };
}

function postureTupleForScenario(runtimeScenario: RuntimeScenario): {
  trust: ProjectionTrustState;
  freshness: ProjectionFreshnessState;
  transport: ProjectionTransportState;
  actionability: ProjectionActionabilityState;
  outcome: StatusTruthInput["authoritativeOutcomeState"];
  saveState: StatusTruthInput["saveState"];
} {
  switch (runtimeScenario) {
    case "live":
      return {
        trust: "trusted",
        freshness: "fresh",
        transport: "live",
        actionability: "live",
        outcome: "pending",
        saveState: "idle",
      };
    case "stale_review":
      return {
        trust: "degraded",
        freshness: "stale_review",
        transport: "live",
        actionability: "frozen",
        outcome: "review_required",
        saveState: "saved",
      };
    case "read_only":
      return {
        trust: "degraded",
        freshness: "stale_review",
        transport: "paused",
        actionability: "frozen",
        outcome: "review_required",
        saveState: "saved",
      };
    case "recovery_only":
      return {
        trust: "partial",
        freshness: "blocked_recovery",
        transport: "reconnecting",
        actionability: "recovery_only",
        outcome: "recovery_required",
        saveState: "failed",
      };
    case "blocked":
      return {
        trust: "blocked",
        freshness: "blocked_recovery",
        transport: "disconnected",
        actionability: "recovery_only",
        outcome: "failed",
        saveState: "failed",
      };
  }
}

export function buildWorkspaceStatus(
  route: StaffShellRoute,
  runtimeScenario: RuntimeScenario,
  task: StaffQueueCase | null,
): { statusInput: StatusTruthInput; pulse: CasePulseContract } {
  const tuple = postureTupleForScenario(runtimeScenario);
  const workspaceSeed = requireWorkspaceStatusSeed();
  const statusInput = cloneJson(workspaceSeed.statusInput);
  const pulse = cloneJson(workspaceSeed.pulse);

  statusInput.dominantActionLabel =
    route.kind === "more-info"
      ? "Send bounded more-info request"
      : route.kind === "decision"
        ? "Confirm the current decision preview"
        : route.kind === "consequences"
          ? "Issue or confirm bounded consequence truth"
        : route.kind === "callbacks"
          ? "Resolve the callback promise with evidence"
          : route.kind === "messages"
            ? "Repair message delivery truth with evidence"
        : route.kind === "approvals"
          ? "Advance the promoted approval preview"
        : route.kind === "escalations"
            ? "Relieve the escalated callback blocker"
            : route.kind === "changed"
              ? "Acknowledge the authoritative delta packet"
              : route.kind === "bookings"
                ? "Advance the assisted booking case through the shared booking core"
              : route.kind === "search"
                ? "Review the exact-match search result"
                : route.kind === "support-handoff"
                  ? "Keep support handoff bounded"
                  : task
                    ? "Advance the current case safely"
                    : "Resume the recommended queue";

  statusInput.authority.macroStateRef =
    route.kind === "escalations"
      ? "action_required"
      : route.kind === "consequences"
        ? "reviewing_next_steps"
      : route.kind === "callbacks"
        ? "reviewing_next_steps"
      : route.kind === "messages"
        ? "reviewing_next_steps"
      : route.kind === "approvals"
        ? "reviewing_next_steps"
        : runtimeScenario === "blocked"
          ? "blocked"
          : runtimeScenario === "recovery_only"
            ? "recovery_required"
            : "in_review";
  statusInput.authority.projectionTrustState = tuple.trust;
  statusInput.authority.degradeMode =
    runtimeScenario === "blocked"
      ? "recovery_required"
      : runtimeScenario === "live"
        ? "quiet_pending"
        : "refresh_required";
  statusInput.freshnessEnvelope.projectionFreshnessState = tuple.freshness;
  statusInput.freshnessEnvelope.transportState = tuple.transport;
  statusInput.freshnessEnvelope.actionabilityState = tuple.actionability;
  statusInput.freshnessEnvelope.reasonRefs =
    runtimeScenario === "live"
      ? ["workspace_queue_current"]
      : runtimeScenario === "recovery_only"
        ? ["focus_protection_invalidated", "runtime_binding_stale"]
        : ["decisive_delta_requires_review"];
  statusInput.authoritativeOutcomeState = tuple.outcome;
  statusInput.saveState = tuple.saveState;
  statusInput.lastChangedAt = "2026-04-13T13:52:00Z";

  pulse.entityRef = task?.id ?? "workspace-home";
  pulse.entityType = route.kind === "home" ? "Workspace home" : "Review task";
  pulse.macroState = statusInput.authority.macroStateRef;
  pulse.headline =
    route.kind === "home"
      ? "Clinical workspace start-of-day"
      : task
        ? `${task.id.toUpperCase()} / ${task.patientLabel}`
        : "Clinical workspace";
  pulse.subheadline =
    route.kind === "home"
      ? "One quiet shell keeps queue continuity, interruptions, and dominant action aligned."
      : task
        ? task.previewSummary
        : "Same-shell route entry keeps task, queue, and dock truth together.";
  pulse.primaryNextActionLabel = statusInput.dominantActionLabel;
  pulse.ownershipOrActorSummary =
    route.kind === "support-handoff"
      ? "Support remains a separate shell family"
      : task
        ? `${task.patientRef} · ${task.launchQueue}`
        : "Assigned to clinical workspace";
  pulse.urgencyBand =
    runtimeScenario === "blocked"
      ? "Recovery only"
      : task?.urgencyTone === "critical"
        ? "Urgent review"
        : task?.urgencyTone === "caution"
          ? "Guarded review"
          : "Quiet next step";
  pulse.confirmationPosture =
    runtimeScenario === "live"
      ? "Writable status available"
      : runtimeScenario === "recovery_only"
        ? "Recovery posture"
        : runtimeScenario === "blocked"
          ? "Blocked by release truth"
          : "Read-only preserve";
  pulse.changedSinceSeen =
    route.kind === "changed"
      ? "Changed since seen: reopen state and ownership context are preserved."
      : task?.deltaSummary ?? "Changed since seen: no decisive delta currently promoted.";
  pulse.lastMeaningfulUpdateAt = statusInput.lastChangedAt;
  pulse.stateAxes = [
    {
      key: "lifecycle",
      label: "Lifecycle",
      value:
        route.kind === "consequences"
          ? "Bounded consequence"
          : 
        route.kind === "callbacks"
          ? "Callback operations"
          : route.kind === "messages"
            ? "Message repair"
          : route.kind === "approvals"
          ? "Approval review"
          : route.kind === "escalations"
            ? "Escalation active"
            : route.kind === "changed"
              ? "Resumed review"
              : route.kind === "bookings"
                ? "Assisted booking"
              : runtimeScenario === "live"
                ? "In review"
                : runtimeScenario === "blocked"
                  ? "Recovery required"
                  : "Review required",
      detail: "The workspace keeps one current view while the route changes.",
    },
    {
      key: "ownership",
      label: "Ownership",
      value: task?.state === "reassigned" ? "Reassigned" : "Queue row pinned",
      detail: "Queue, task, and quiet-return target remain explicit in the ledger.",
    },
    {
      key: "trust",
      label: "Trust",
      value: tuple.trust === "trusted" ? "Trusted" : tuple.trust === "blocked" ? "Blocked" : "Degraded",
      detail: "Runtime authority, not local optimism, decides whether the shell is writable.",
    },
    {
      key: "urgency",
      label: "Urgency",
      value: pulse.urgencyBand,
      detail: "Interruption budgeting promotes only one urgent path at a time.",
    },
    {
      key: "interaction",
      label: "Interaction",
      value:
        tuple.actionability === "live"
          ? "Writable"
          : tuple.actionability === "frozen"
            ? "Frozen"
            : "Recovery only",
      detail: "Protected work freezes in place instead of losing the current draft or anchor.",
    },
  ];

  return { statusInput, pulse };
}

export function createInitialRapidEntryDraft(task: StaffQueueCase): RapidEntryDraftInput {
  return {
    note: "",
    selectedReasonChip: task.quickCapture.reasonChips[0] ?? null,
    selectedQuestionSet: task.quickCapture.questionSets[0] ?? null,
    selectedMacro: task.quickCapture.macros[0] ?? null,
    selectedDuePick: task.quickCapture.duePicks[0] ?? null,
    autosaveState: "idle",
    lastLocalChangeAt: "2026-04-17T08:31:00Z",
  };
}

function taskOpeningMode(task: StaffQueueCase): TaskOpeningMode {
  if (task.state === "approval") {
    return "approval_review";
  }
  if (task.state === "blocked" || task.state === "escalated") {
    return "handoff_review";
  }
  if (
    task.state === "changed" ||
    task.state === "reassigned" ||
    task.deltaClass === "decisive" ||
    task.deltaClass === "consequential"
  ) {
    return "resumed_review";
  }
  return "first_review";
}

function primaryQuestionForOpeningMode(openingMode: TaskOpeningMode): string {
  switch (openingMode) {
    case "approval_review":
      return "Which irreversible effect still needs approval before this task can settle?";
    case "handoff_review":
      return "Which escalated or blocked condition owns the next safe move?";
    case "resumed_review":
      return "Which prior judgement or ownership assumption is no longer safe to carry forward?";
    case "first_review":
      return "What is the next safe action for this case with the current evidence?";
  }
}

function recommitRequiredForTask(task: StaffQueueCase): boolean {
  return task.deltaClass === "decisive" || task.deltaClass === "consequential";
}

function deltaReviewStateForTask(
  task: StaffQueueCase,
  runtimeScenario: RuntimeScenario,
): ResumeReviewState {
  if (runtimeScenario === "recovery_only" || runtimeScenario === "blocked") {
    return "recovery_only";
  }
  if (recommitRequiredForTask(task)) {
    return "recommit_required";
  }
  return task.deltaClass === "contextual" || task.deltaClass === "clerical"
    ? "diff_first"
    : "acknowledged";
}

function deltaExplanationForTask(task: StaffQueueCase): string {
  switch (task.deltaClass) {
    case "decisive":
      return "Decisive change: previous reasoning is no longer safe to trust without a deliberate recheck.";
    case "consequential":
      return "Consequential change: the current consequence path is altered and must be rechecked before commit.";
    case "clerical":
      return "Clerical change: this is annotation-only unless another governing truth packet says otherwise.";
    case "contextual":
    default:
      return "Contextual change: the reviewer keeps the previous judgement in view, but the changed context must still be acknowledged.";
  }
}

function markerToneForKind(kind: ChangedRegionMarkerKind): ChangedRegionMarkerTone {
  switch (kind) {
    case "changed_field":
      return "accent";
    case "contradiction":
      return "caution";
    case "action_invalidation":
      return "critical";
  }
}

function buildDeltaFirstResumeShellProjection(input: {
  task: StaffQueueCase;
  runtimeScenario: RuntimeScenario;
  selectedAnchorRef: string;
  authoritativeDeltaPacketRef: string;
  reviewActionLeaseRef: string;
  decisionEpochRef: string;
}): DeltaFirstResumeShellProjection {
  const {
    task,
    runtimeScenario,
    selectedAnchorRef,
    authoritativeDeltaPacketRef,
    reviewActionLeaseRef,
    decisionEpochRef,
  } = input;
  const reviewState = deltaReviewStateForTask(task, runtimeScenario);
  const recommitRequired = recommitRequiredForTask(task);
  const acknowledgementState: DeltaStackProjection["acknowledgementState"] =
    reviewState === "acknowledged"
      ? "acknowledged"
      : recommitRequired
        ? "recommit_required"
        : "pending_review";
  const markers: ChangedRegionMarkerProjection[] = [
    ...task.changedFieldRefs.map((item, index) => ({
      markerId: `changed-marker::${task.id}::field::${index + 1}`,
      kind: "changed_field" as const,
      tone: markerToneForKind("changed_field"),
      label: `Changed field ${index + 1}`,
      summary: item,
      anchorRef: `${task.primaryChangedAnchorRef}::field-${index + 1}`,
    })),
    ...task.contradictionRefs.map((item, index) => ({
      markerId: `changed-marker::${task.id}::contradiction::${index + 1}`,
      kind: "contradiction" as const,
      tone: markerToneForKind("contradiction"),
      label: `Contradiction ${index + 1}`,
      summary: item,
      anchorRef: `${task.primaryChangedAnchorRef}::contradiction-${index + 1}`,
    })),
    ...task.actionInvalidationRefs.map((item, index) => ({
      markerId: `changed-marker::${task.id}::action::${index + 1}`,
      kind: "action_invalidation" as const,
      tone: markerToneForKind("action_invalidation"),
      label: `Invalidated action ${index + 1}`,
      summary: item,
      anchorRef: `${task.primaryChangedAnchorRef}::action-${index + 1}`,
    })),
  ];

  return {
    shellId: `delta_first_resume_shell::${task.id}`,
    deltaClass: task.deltaClass,
    reviewState,
    recommitRequired,
    supersededContextState: task.supersededContext.length ? "visible" : "none",
    selectedAnchorRef,
    evidenceDeltaSummary: {
      summaryId: `evidence_delta_summary::${task.id}`,
      authoritativeDeltaPacketRef,
      deltaClass: task.deltaClass,
      reviewState,
      summary: task.deltaSummary,
      explanation: deltaExplanationForTask(task),
      primaryChangedAnchorRef: task.primaryChangedAnchorRef,
      returnToQuietEligibility: task.returnToQuietEligibility,
      changedFieldRefs: task.changedFieldRefs,
      contradictionRefs: task.contradictionRefs,
      actionInvalidationRefs: task.actionInvalidationRefs,
    },
    inlineChangedRegionMarkers: {
      markerSetId: `inline_changed_region_markers::${task.id}`,
      headline: "Changed regions stay inline with the active reading target",
      markers,
    },
    supersededContextCompare: {
      compareId: `superseded_context_compare::${task.id}`,
      headline: "Superseded context remains reachable and quieter",
      summary:
        "Previous reasoning stays visible as collapsed history so the reviewer can understand what changed without leaving the workspace.",
      defaultExpanded: false,
      items: task.supersededContext.map((item, index) => ({
        itemId: `superseded-compare::${task.id}::${index + 1}`,
        label: `Superseded context ${index + 1}`,
        previousContext: item,
        currentMeaning:
          task.actionInvalidationRefs[index] ??
          task.changedFieldRefs[index] ??
          task.patientReturnImpact,
      })),
    },
    resumeReviewGate: {
      gateId: `resume_review_gate::${task.id}`,
      reviewState,
      recommitRequired,
      acknowledgementState,
      headline:
        reviewState === "recovery_only"
          ? "Recovery posture preserves the last safe changed summary in place"
          : recommitRequired
            ? "Commit remains frozen until the changed evidence is rechecked"
            : "Changed context is visible and ready for deliberate acknowledgement",
      summary: task.resumeActionSummary,
      patientReturnImpact: task.patientReturnImpact,
      dominantActionLabel:
        reviewState === "recovery_only" ? "Recover authoritative delta truth" : task.resumeActionLabel,
      actionEnabled: runtimeScenario === "live",
      governingRefs: [authoritativeDeltaPacketRef, reviewActionLeaseRef, decisionEpochRef],
    },
  };
}

function reasoningStageStateForScenario(
  runtimeScenario: RuntimeScenario,
): "live" | "stale_recoverable" | "recovery_only" {
  if (runtimeScenario === "live") {
    return "live";
  }
  if (runtimeScenario === "stale_review" || runtimeScenario === "read_only") {
    return "stale_recoverable";
  }
  return "recovery_only";
}

function freezeReasonsForScenario(
  runtimeScenario: RuntimeScenario,
  route: StaffShellRoute,
): readonly string[] {
  switch (runtimeScenario) {
    case "stale_review":
      return [
        "Decision epoch drifted while the same-shell composer was open.",
        route.kind === "more-info"
          ? "Selected anchor truth needs revalidation before another more-info send."
          : "Selected anchor truth needs revalidation before consequence preview can commit.",
      ];
    case "read_only":
      return [
        "Ownership or review lease drift fenced the compose lane to read-only preserve.",
        "Local draft context is still visible, but send and commit must stay frozen.",
      ];
    case "recovery_only":
      return [
        "Workspace trust or publication drift invalidated the protected composition lease.",
        "The shell is preserving the last safe draft, selected anchor, and reading target in place.",
      ];
    case "blocked":
      return [
        "Publication authority was withdrawn, so the shell keeps the current compose state only as frozen provenance.",
        "Recovery must happen in place; no silent retargeting to another row, anchor, or decision epoch is allowed.",
      ];
    case "live":
    default:
      return [];
  }
}

function buildReasoningLayerProjection(input: {
  route: StaffShellRoute;
  task: StaffQueueCase;
  runtimeScenario: RuntimeScenario;
  selectedDecision: string;
  selectedAnchorRef: string;
  reviewActionLeaseRef: string;
  decisionEpochRef: string;
  rapidEntryDraft: RapidEntryDraftInput;
}): ReasoningLayerProjection {
  const {
    route,
    task,
    runtimeScenario,
    selectedDecision,
    selectedAnchorRef,
    reviewActionLeaseRef,
    decisionEpochRef,
    rapidEntryDraft,
  } = input;
  const stageState = reasoningStageStateForScenario(runtimeScenario);
  const endpointIndex = Math.max(0, task.decisionOptions.indexOf(selectedDecision));
  const selectedEndpoint = task.quickCapture.endpoints[endpointIndex] ?? task.quickCapture.endpoints[0] ?? selectedDecision;
  const approvalCheckpointRef =
    task.state === "approval" ? `approval_checkpoint::${task.id}::current` : null;
  const sendEnabled = stageState === "live" && task.state !== "approval";
  const freezeReasons = freezeReasonsForScenario(runtimeScenario, route);
  const patientConversationBundle = resolvePhase3PatientWorkspaceConversationBundleByTaskId({
    taskId: task.id === "task-507" || task.id === "task-208" || task.id === "task-118" ? "task-311" : task.id,
    scenario: patientConversationScenarioForRuntime(runtimeScenario),
    routeKey:
      route.kind === "more-info"
        ? "conversation_more_info"
        : route.kind === "decision"
          ? "conversation_messages"
          : "conversation_overview",
  });
  const preservedDraftSummary = [
    rapidEntryDraft.selectedReasonChip,
    rapidEntryDraft.selectedQuestionSet,
    rapidEntryDraft.selectedDuePick,
    rapidEntryDraft.note.trim() || "No inline note captured yet.",
  ]
    .filter(Boolean)
    .join(" • ");

  return {
    layerId: `reasoning_layer::${task.id}::${route.kind}`,
    focusProtectionLeaseRef: `workspace_focus_protection_lease::${task.id}::${route.kind}`,
    protectedCompositionStateRef: `protected_composition_state::${task.id}::${route.kind}`,
    selectedAnchorTupleHashRef: `selected_anchor_tuple::${selectedAnchorRef}`,
    quickCaptureTray: {
      trayId: `quick_capture_tray::${task.id}`,
      activeMode:
        route.kind === "more-info"
          ? "more_info"
          : route.kind === "decision"
            ? "endpoint_reasoning"
            : "rapid_entry",
      endpointShortcuts: task.quickCapture.endpoints,
      reasonChips: task.quickCapture.reasonChips,
      questionSets: task.quickCapture.questionSets,
      macros: task.quickCapture.macros,
      duePicks: task.quickCapture.duePicks,
      localAcknowledgement:
        rapidEntryDraft.autosaveState === "saving"
          ? "Saving local draft only"
          : rapidEntryDraft.autosaveState === "saved"
            ? "Local draft saved. This has not sent or committed."
            : rapidEntryDraft.autosaveState === "failed"
              ? "Local draft recovery is required."
              : "Local draft is idle until the next edit.",
      autosaveState: rapidEntryDraft.autosaveState,
      keyboardHint: "One tab cycle keeps rapid entry, more-info compose, and endpoint reasoning in the same dock.",
      reviewActionLeaseRef,
    },
    rapidEntryDraft: {
      draftId: `rapid_entry_draft::${task.id}`,
      taskId: task.id,
      draftType:
        route.kind === "decision"
          ? "endpoint_reasoning"
          : route.kind === "more-info"
            ? "question_set"
            : "notes",
      noteValue: rapidEntryDraft.note,
      notePlaceholder: "Capture the bounded rationale, then decide whether the richer side stage is actually needed.",
      selectedReasonChip: rapidEntryDraft.selectedReasonChip,
      selectedQuestionSet: rapidEntryDraft.selectedQuestionSet,
      selectedMacro: rapidEntryDraft.selectedMacro,
      selectedDuePick: rapidEntryDraft.selectedDuePick,
      autosaveState: rapidEntryDraft.autosaveState,
      lastLocalChangeAt: rapidEntryDraft.lastLocalChangeAt,
      recoverableUntil: "2026-04-17T12:31:00Z",
      localOnlyLabel: "Local autosave only. Authoritative send and commit remain separately governed.",
    },
    moreInfoStage: {
      stageId: `more_info_inline_stage::${task.id}`,
      requestRef: patientConversationBundle.requestRef,
      requestLineageRef: patientConversationBundle.requestLineageRef,
      cycleRef: patientConversationBundle.moreInfoCycleRef,
      statusDigestRef: `more_info_status_digest::${task.id}`,
      replyWindowCheckpointRef: patientConversationBundle.replyWindowCheckpointRef,
      reminderScheduleRef: patientConversationBundle.reminderScheduleRef,
      patientConversationRouteRef: patientConversationBundle.routeRefs.moreInfo,
      phase3ConversationBundleRef: patientConversationBundle.bundleRef,
      dueState: patientConversationBundle.parity.dueState,
      replyEligibilityState: patientConversationBundle.parity.replyEligibilityState,
      secureLinkAccessState: patientConversationBundle.secureLinkAccessState,
      deliveryPosture: patientConversationBundle.parity.deliveryPosture,
      repairPosture: patientConversationBundle.parity.repairPosture,
      dominantPatientActionRef: patientConversationBundle.parity.dominantNextActionRef,
      statusState: patientConversationBundle.staffParity.moreInfoStageState,
      stageState,
      headline: "More-info compose stays attached to the current review",
      summary:
        patientConversationBundle.staffParity.moreInfoStageState === "awaiting_patient_reply"
          ? "An active more-info cycle already exists for this lineage, so the shell resumes that exact cycle in place instead of inventing a fresh request."
          : patientConversationBundle.staffParity.moreInfoStageState === "repair_required"
            ? "Reply and callback posture stay bound to the same repair-dominant patient shell, so the reviewer sees the same blocked action the patient sees."
            : "This task has no live patient-facing cycle yet, so the same-shell composer stays in bounded draft posture until the reviewer explicitly sends.",
      dominantWorkspaceActionRef: `dominant_workspace_action::${task.id}::more_info`,
      cycleMode:
        patientConversationBundle.staffParity.moreInfoStageState === "awaiting_patient_reply"
          ? "resume_existing"
          : "drafting_new",
      sendLabel: stageState === "live" ? "Send bounded more-info request" : "Send frozen by current tuple drift",
      sendEnabled:
        stageState === "live" &&
        patientConversationBundle.parity.replyEligibilityState === "answerable",
      questionPreview: task.moreInfoPrompts,
    },
    endpointReasoningStage: {
      stageId: `endpoint_reasoning_stage::${task.id}`,
      decisionEpochRef,
      endpointDecisionBindingRef: `endpoint_decision_binding::${task.id}::current`,
      reviewActionLeaseRef,
      stageState,
      headline: "Endpoint reasoning stays same-shell and preview-first",
      summary:
        task.state === "approval"
          ? "This preview is bound to the current approval posture. The shell keeps the reasoning visible, but the consequence cannot settle until approval truth says it can."
          : "The dock keeps structured endpoint shortcuts inline and promotes a richer preview only when the reviewer asks for it.",
      selectedEndpoint,
      rationaleLabel:
        rapidEntryDraft.selectedReasonChip ??
        task.quickCapture.reasonChips[0] ??
        "No dominant reason chip selected",
      sendLabel: sendEnabled ? "Preview ready for governed commit" : "Preview fenced pending approval or recovery",
      sendEnabled,
      preview: {
        surfaceId: `consequence_preview_surface::${task.id}`,
        headline: "ConsequencePreviewSurface",
        summary:
          task.consequences[0]?.detail ??
          "No consequence preview is currently attached.",
        previewState:
          task.state === "approval"
            ? "approval_pending"
            : stageState === "live"
              ? "previewing"
              : "frozen",
        rows: task.consequences.map((item, index) => ({
          id: `reasoning-preview-${index + 1}`,
          label: item.title,
          value: selectedDecision,
          detail: item.detail,
          tone: index === 0 ? "accent" : "neutral",
        })),
        approvalCheckpointRef,
        transitionEnvelopeRef: `decision_commit_envelope::${task.id}`,
      },
    },
    freezeFrame:
      stageState === "live"
        ? null
        : {
            freezeFrameId: `protected_composition_freeze_frame::${task.id}::${route.kind}`,
            freezeState: stageState,
            headline:
              stageState === "stale_recoverable"
                ? "Protected composition is frozen until the current tuple is revalidated"
                : "Recovery-only posture is preserving the last safe compose state",
            summary:
              stageState === "stale_recoverable"
                ? "The shell keeps the current draft and preview visible in place instead of silently retargeting to a newer decision epoch or anchor."
                : "Live send and commit are blocked. The last safe draft, selected anchor, and decision preview remain visible as frozen provenance.",
            blockingReasons: freezeReasons,
            recoveryActionLabel:
              stageState === "stale_recoverable" ? "Revalidate lease and keep this draft" : "Restore last safe compose context",
            preservedDraftSummary,
            preservedAnchorRef: selectedAnchorRef,
            preservedDecisionEpochRef: decisionEpochRef,
          },
  };
}

function supportRegionForTask(input: {
  route: StaffShellRoute;
  task: StaffQueueCase;
  selectedDecision: string;
}): PromotedSupportRegionProjection | null {
  const { route, task, selectedDecision } = input;

  if (route.kind === "more-info") {
    return {
      regionId: `promoted_support::${task.id}::more_info`,
      kind: "more_info_stage",
      title: "Promoted more-info review region",
      summary: "The task shell keeps the reading context visible while the current more-info child stage stays bounded.",
      quietReturnTargetRef: `quiet_return::${task.id}::summary`,
      actionLabel: "Resume the more-info child route",
      stateLabel: "protected child stage",
      rows: task.moreInfoPrompts.map((prompt, index) => ({
        id: `more-info-prompt-${index + 1}`,
        label: `Prompt ${index + 1}`,
        value: prompt,
        detail: "This remains summary-first until the 258 reasoning layer upgrades the compose surface.",
        tone: index === 0 ? "accent" : "neutral",
      })),
    };
  }

  if (route.kind === "decision") {
    return {
      regionId: `promoted_support::${task.id}::decision`,
      kind: "decision_stage",
      title: "Promoted decision review region",
      summary: "Consequence preview stays visible without displacing the source evidence or the dominant dock lane.",
      quietReturnTargetRef: `quiet_return::${task.id}::consequence`,
      actionLabel: "Review the current decision preview",
      stateLabel: "previewing consequence",
      rows: task.consequences.map((item, index) => ({
        id: `decision-preview-${index + 1}`,
        label: item.title,
        value: selectedDecision,
        detail: item.detail,
        tone: index === 0 ? "accent" : "neutral",
      })),
    };
  }

  if (task.state === "approval") {
    return {
      regionId: `promoted_support::${task.id}::approval`,
      kind: "approval_review",
      title: "Approval review remains promoted",
      summary: "Approval posture may summarize in the support region, but it does not replace the main review canvas.",
      quietReturnTargetRef: `quiet_return::${task.id}::approval`,
      actionLabel: "Open promoted approval detail",
      stateLabel: "approval pending",
      rows: [
        {
          id: "approval-irreversible-effects",
          label: "Irreversible effects",
          value: "Booking handoff remains fenced",
          detail: "The consequence can preview here, but release still belongs to the dominant dock action.",
          tone: "accent",
        },
        {
          id: "approval-owner",
          label: "Approver role",
          value: "Clinical access reviewer",
          detail: "The current task stays readable while the approval frame remains bounded to this shell.",
          tone: "neutral",
        },
      ],
    };
  }

  if (task.state === "blocked" || task.state === "escalated") {
    return {
      regionId: `promoted_support::${task.id}::handoff`,
      kind: "handoff_review",
      title: "Escalation and handoff remain promoted",
      summary: "The shell shows one promoted support region for the blocker path instead of a stack of urgent banners.",
      quietReturnTargetRef: `quiet_return::${task.id}::handoff`,
      actionLabel: "Open the escalation path",
      stateLabel: task.state === "blocked" ? "blocked" : "escalated",
      rows: [
        {
          id: "handoff-owner",
          label: "Current blocker",
          value: task.primaryReason,
          detail: task.deltaSummary,
          tone: "critical",
        },
        {
          id: "handoff-boundary",
          label: "Support boundary",
          value: "Bounded support handoff only",
          detail: "The same shell keeps the active queue context while support remains a separate family.",
          tone: "neutral",
        },
      ],
    };
  }

  return null;
}

function attachmentSeedsForTask(task: StaffQueueCase): readonly StaffAttachmentSeed[] {
  const seeded = staffAttachmentSeedsByTask[task.id];
  if (seeded?.length) {
    return seeded;
  }
  return task.references.slice(0, 1).map((reference, index) => ({
    artifactId: `artifact-${task.id}-${index + 1}`,
    digestKind: "document",
    title: reference,
    summary: `${reference} remains available as a summary-first governed attachment.`,
    provenanceLabel: `Reference stack seed for ${task.id}`,
    availabilityLabel: "Governed preview ready",
    metaLabel: "Document · summary seed",
    hydrationMode: "instant",
    requestedMode: "governed_preview",
    previewPolicy: "inline_preview",
    requiredSummaryAuthority: "verified_or_provisional",
    authorityState: "summary_provisional",
    parityState: "summary_provisional",
    channelPosture: "standard_browser",
    byteDeliveryPosture: "available",
    transferKind: "none",
    transferState: "not_started",
    localAckState: "none",
    grantState: "active",
    summarySections: [
      artifactSection(
        "summary",
        "Summary",
        "This fallback digest keeps the reference visible without inventing a detached artifact surface.",
      ),
    ],
    previewPages: [artifactPage("preview-1", "Reference summary", [reference])],
  }));
}

function threadSeedForTask(task: StaffQueueCase): StaffThreadSeed {
  const seeded = staffThreadSeedsByTask[task.id];
  if (seeded) {
    return seeded;
  }
  return {
    clusterRef: `conversation_cluster::${task.id}`,
    threadId: `conversation_thread::${task.id}`,
    title: "Patient response thread",
    summary: "This task uses the generic thread seed because no richer chronology has been published yet.",
    previewMode: "authenticated_summary",
    replyNeededState: "none",
    awaitingReviewState: "awaiting_review",
    repairRequiredState: "none",
    authoritativeOutcomeState: "awaiting_review",
    deliveryRiskState: "on_track",
    dominantNextActionRef: "Review the current chronology in place.",
    rows: [
      {
        eventId: `thread-event-${task.id}-summary`,
        anchorId: `thread-anchor-${task.id}-summary`,
        eventKind: "repair_update",
        occurredAt: "2026-04-17T08:00:00Z",
        headline: "Generic chronology seed",
        summary: "The thread remains summary-first until a richer task-specific publication is present.",
        actorLabel: "Projection fallback",
        visibilityMode: "authenticated_summary",
        dispositionClass: null,
        settlementResult: "review_pending",
        localAckState: "none",
        transportState: "local_only",
        externalObservationState: "unobserved",
        authoritativeOutcomeState: "awaiting_review",
        repairRequiredState: "none",
        deliveryRiskState: "on_track",
        attachmentRefs: attachmentSeedsForTask(task).map((item) => item.artifactId),
      },
    ],
  };
}

function summarySafetyTierForAuthority(
  authorityState: ArtifactShellSpecimen["parityDigest"]["authorityState"],
): ArtifactShellSpecimen["context"]["summarySafetyTier"] {
  switch (authorityState) {
    case "summary_verified":
      return "verified";
    case "summary_provisional":
      return "provisional";
    case "source_only":
      return "source_only";
    case "recovery_only":
      return "recovery_only";
  }
}

function fallbackKindForSeed(
  seed: StaffAttachmentSeed,
  runtimeScenario: RuntimeScenario,
): ArtifactShellSpecimen["fallbackDisposition"]["fallbackKind"] {
  if (runtimeScenario === "blocked" || runtimeScenario === "recovery_only") {
    return "recovery_only";
  }
  if (seed.byteDeliveryPosture === "large_guarded") {
    return "placeholder_only";
  }
  if (seed.previewPolicy !== "inline_preview") {
    return "summary_only";
  }
  return "none";
}

function fallbackTriggerForSeed(
  seed: StaffAttachmentSeed,
  runtimeScenario: RuntimeScenario,
): ArtifactShellSpecimen["fallbackDisposition"]["trigger"] {
  if (runtimeScenario === "blocked" || runtimeScenario === "recovery_only") {
    return "parity_drift";
  }
  if (seed.byteDeliveryPosture === "large_guarded") {
    return "large_artifact";
  }
  if (seed.previewPolicy !== "inline_preview") {
    return "preview_blocked";
  }
  return "none";
}

function degradeAttachmentSeedForRuntime(
  seed: StaffAttachmentSeed,
  runtimeScenario: RuntimeScenario,
): StaffAttachmentSeed {
  if (runtimeScenario === "recovery_only" || runtimeScenario === "blocked") {
    return {
      ...seed,
      authorityState: "recovery_only",
      parityState: "parity_blocked",
      grantState: "blocked",
      byteDeliveryPosture: "blocked",
      availabilityLabel: "Recovery-only summary",
    };
  }
  if (runtimeScenario === "stale_review" && seed.parityState === "summary_verified") {
    return {
      ...seed,
      authorityState: "summary_provisional",
      parityState: "summary_provisional",
      availabilityLabel: "Provisional summary preview",
    };
  }
  return seed;
}

function visibilitySummaryForMode(mode: ThreadPreviewMode, summary: string): string {
  switch (mode) {
    case "public_safe_summary":
      return "Public-safe summary only. Full patient wording remains hidden.";
    case "step_up_required":
      return "Step-up is required before richer patient wording can be shown here.";
    case "suppressed_recovery_only":
      return "Recovery-only posture keeps chronology visible but suppresses detailed content.";
    case "authenticated_summary":
    default:
      return summary;
  }
}

function threadChipTone(
  label:
    | ThreadDispositionClass
    | ThreadRepairRequiredState
    | ThreadPreviewMode
    | ThreadExternalObservationState
    | ThreadSettlementResult,
): ThreadDispositionChipProjection["tone"] {
  switch (label) {
    case "accepted_in_window":
      return "accent";
    case "accepted_late_review":
    case "review_pending":
    case "awaiting_external":
    case "public_safe_summary":
      return "caution";
    case "blocked_repair":
    case "expired_rejected":
    case "repair_required":
    case "step_up_required":
    case "suppressed_recovery_only":
    case "contact_route_repair":
    case "policy_blocked":
    case "recovery_only":
    case "failed":
    case "disputed":
    case "blocked_policy":
    case "denied_scope":
    case "expired":
      return "critical";
    case "superseded_duplicate":
    case "delivered":
    case "answered":
    case "unobserved":
    default:
      return "neutral";
  }
}

function threadDispositionLabel(value: ThreadDispositionClass): string {
  switch (value) {
    case "accepted_in_window":
      return "Accepted in window";
    case "accepted_late_review":
      return "Late review";
    case "blocked_repair":
      return "Repair hold";
    case "superseded_duplicate":
      return "Superseded duplicate";
    case "expired_rejected":
      return "Expired reply";
  }
}

function buildWorkspaceArtifactSpecimen(input: {
  task: StaffQueueCase;
  route: StaffShellRoute;
  seed: StaffAttachmentSeed;
  selectedAnchorRef: string;
  quietReturnTargetRef: string;
  runtimeScenario: RuntimeScenario;
}): ArtifactShellSpecimen {
  const seed = degradeAttachmentSeedForRuntime(input.seed, input.runtimeScenario);
  const fallbackKind = fallbackKindForSeed(seed, input.runtimeScenario);
  const fallbackTrigger = fallbackTriggerForSeed(seed, input.runtimeScenario);
  return {
    id: seed.artifactId,
    title: `${seed.title} summary`,
    subtitle:
      "The artifact stays inside the same workspace shell with summary-first review and an explicit return target.",
    artifactKind: "record_attachment",
    artifactLabel: seed.title,
    summarySections: seed.summarySections,
    previewPages: seed.previewPages,
    contract: {
      contractId: `artifact-contract::${seed.artifactId}`,
      artifactKind: "record_attachment",
      summaryRequired: true,
      previewPolicy: seed.previewPolicy,
      downloadPolicy: "allowed",
      printPolicy: "blocked",
      handoffPolicy: "grant_required",
      requiredSummaryAuthority: seed.requiredSummaryAuthority,
      source_refs: [
        "prompt/259.md",
        "docs/architecture/109_artifact_presentation_shell.md",
      ],
    },
    binding: {
      bindingId: `artifact-binding::${seed.artifactId}`,
      routeFamilyRef: input.route.routeFamilyRef,
      artifactLabel: seed.title,
      selectedAnchorRef: input.selectedAnchorRef,
      selectedAnchorLabel: input.selectedAnchorRef,
      previewContractRef: `preview::${seed.artifactId}`,
      downloadContractRef: `download::${seed.artifactId}`,
      printContractRef: `print::${seed.artifactId}`,
      handoffContractRef: `handoff::${seed.artifactId}`,
      requiredParityStates: ["summary_verified", "summary_provisional"],
      embeddedFallback: "summary_only",
      staleFallback: "summary_only",
      unsupportedFallback: "placeholder_only",
      source_refs: [
        "prompt/259.md",
        "docs/architecture/109_artifact_presentation_shell.md",
      ],
    },
    parityDigest: {
      parityDigestId: `artifact-parity::${seed.artifactId}`,
      sourceArtifactHash: `src_${seed.artifactId}`,
      summaryHash: `sum_${seed.artifactId}`,
      authorityState: seed.authorityState,
      sourceParityState: seed.parityState,
      parityStatement:
        "The attachment summary and viewer posture remain bound to one artifact contract and current task continuity tuple.",
      lastVerifiedAt: "2026-04-17T08:32:00Z",
      verifiedBy: "Workspace attachment resolver",
      driftReason:
        seed.parityState === "parity_blocked" ? "Runtime tuple degraded to recovery-only posture." : null,
      source_refs: [
        "prompt/259.md",
        "docs/architecture/109_artifact_presentation_shell.md",
      ],
    },
    context: {
      contextId: `artifact-context::${seed.artifactId}`,
      shellContinuityKey: `workspace_artifact_thread::${input.task.id}`,
      routeFamilyRef: input.route.routeFamilyRef,
      selectedAnchorRef: input.selectedAnchorRef,
      selectedAnchorLabel: input.selectedAnchorRef,
      returnTargetRef: input.quietReturnTargetRef,
      returnTargetLabel: "Return to the current task reference layer",
      channelPosture: seed.channelPosture,
      artifactModeRequest: seed.requestedMode,
      visibilityCeiling:
        input.runtimeScenario === "blocked"
          ? "restricted"
          : input.runtimeScenario === "recovery_only"
            ? "masked"
            : "full",
      summarySafetyTier: summarySafetyTierForAuthority(seed.authorityState),
      byteDeliveryPosture: seed.byteDeliveryPosture,
      currentRouteLineage: `${input.route.kind} -> reference-stack -> ${seed.digestKind}`,
      source_refs: [
        "prompt/259.md",
        "docs/architecture/109_artifact_presentation_shell.md",
      ],
    },
    transferSettlement: {
      settlementId: `artifact-settlement::${seed.artifactId}`,
      transferKind: seed.transferKind,
      authoritativeTransferState: seed.transferState,
      localAckState: seed.localAckState,
      progressLabel:
        seed.transferKind === "none"
          ? "No external transfer is active."
          : "Any transfer remains provisional until authoritative settlement confirms it.",
      lastUpdatedAt: "2026-04-17T08:32:00Z",
      source_refs: [
        "prompt/259.md",
        "docs/architecture/109_artifact_presentation_shell.md",
      ],
    },
    fallbackDisposition: {
      fallbackId: `artifact-fallback::${seed.artifactId}`,
      fallbackKind,
      trigger: fallbackTrigger,
      title:
        fallbackKind === "placeholder_only"
          ? "Placeholder-safe preview"
          : fallbackKind === "recovery_only"
            ? "Recovery-only summary"
            : "Summary-first preview",
      summary:
        fallbackKind === "placeholder_only"
          ? "The shell keeps provenance and summary visible while the heavy artifact body stays guarded."
          : fallbackKind === "recovery_only"
            ? "The last safe summary remains visible while artifact preview posture is recovered."
            : "Summary-first review remains the source of truth until a richer preview is explicitly opened.",
      recoveryActionLabel: "Return to the task reference layer",
      source_refs: [
        "prompt/259.md",
        "docs/architecture/109_artifact_presentation_shell.md",
      ],
    },
    grant: {
      grantId: `artifact-grant::${seed.artifactId}`,
      routeFamilyRef: input.route.routeFamilyRef,
      continuityKey: `workspace_artifact_thread::${input.task.id}`,
      selectedAnchorRef: input.selectedAnchorRef,
      returnTargetRef: input.quietReturnTargetRef,
      destinationLabel: "Governed same-shell viewer",
      destinationType: "browser",
      state: seed.grantState,
      expiresAt: null,
      scrubbedDestination: `workspace-viewer://${seed.artifactId}`,
      reason: "Attachment view stays scoped to the active task shell and current quiet-return target.",
      source_refs: [
        "prompt/259.md",
        "docs/architecture/109_artifact_presentation_shell.md",
      ],
    },
  };
}

function buildThreadDispositionChips(
  event: StaffThreadEventSeed,
): readonly ThreadDispositionChipProjection[] {
  const chips: ThreadDispositionChipProjection[] = [];
  if (event.dispositionClass) {
    chips.push({
      chipId: `${event.eventId}::disposition`,
      label: threadDispositionLabel(event.dispositionClass),
      tone: threadChipTone(event.dispositionClass),
    });
  }
  chips.push({
    chipId: `${event.eventId}::settlement`,
    label: event.settlementResult.replaceAll("_", " "),
    tone: threadChipTone(event.settlementResult),
  });
  if (event.repairRequiredState !== "none") {
    chips.push({
      chipId: `${event.eventId}::repair`,
      label: event.repairRequiredState.replaceAll("_", " "),
      tone: threadChipTone(event.repairRequiredState),
    });
  }
  if (event.visibilityMode !== "authenticated_summary") {
    chips.push({
      chipId: `${event.eventId}::visibility`,
      label: event.visibilityMode.replaceAll("_", " "),
      tone: threadChipTone(event.visibilityMode),
    });
  }
  if (event.externalObservationState === "failed" || event.externalObservationState === "disputed") {
    chips.push({
      chipId: `${event.eventId}::delivery`,
      label: event.externalObservationState,
      tone: threadChipTone(event.externalObservationState),
    });
  }
  return chips;
}

function buildAttachmentAndThreadResolver(input: {
  task: StaffQueueCase;
  route: StaffShellRoute;
  runtimeScenario: RuntimeScenario;
  selectedAnchorRef: string;
  quietReturnTargetRef: string;
  selection: AttachmentAndThreadSelectionState;
}): {
  attachmentAndThread: AttachmentAndThreadProjection;
  attachmentDigest: AttachmentDigestGridProjection;
  communicationDigest: CommunicationDigestProjection;
} {
  const attachmentSeeds = attachmentSeedsForTask(input.task);
  const selectedArtifactSeed =
    attachmentSeeds.find((seed) => seed.artifactId === input.selection.selectedArtifactId) ?? null;
  const attachmentCards = attachmentSeeds.map<AttachmentDigestCardProjection>((seed) => {
    const specimen = buildWorkspaceArtifactSpecimen({
      task: input.task,
      route: input.route,
      seed,
      selectedAnchorRef: input.selectedAnchorRef,
      quietReturnTargetRef: input.quietReturnTargetRef,
      runtimeScenario: input.runtimeScenario,
    });
    const modeTruth = resolveArtifactModeTruth(specimen);
    return {
      cardId: `attachment-card::${seed.artifactId}`,
      artifactId: seed.artifactId,
      digestKind: seed.digestKind,
      title: seed.title,
      summary: seed.summary,
      provenanceLabel: seed.provenanceLabel,
      availabilityLabel: seed.availabilityLabel,
      metaLabel: seed.metaLabel,
      openLabel:
        modeTruth.currentMode === "recovery_only"
          ? "Open recovery-safe summary"
          : modeTruth.currentMode === "placeholder_only"
            ? "Open governed placeholder"
            : "Open governed viewer",
      selected: selectedArtifactSeed?.artifactId === seed.artifactId,
      hydrationMode: seed.hydrationMode,
      modeTruth,
      specimen,
    };
  });

  const threadSeed = threadSeedForTask(input.task);
  const patientConversationBundle = resolvePhase3PatientWorkspaceConversationBundleByTaskId({
    taskId:
      input.task.id === "task-507" || input.task.id === "task-208" || input.task.id === "task-118"
        ? "task-311"
        : input.task.id,
    scenario: patientConversationScenarioForRuntime(input.runtimeScenario),
    routeKey: "conversation_messages",
  });
  const latestThreadRow = threadSeed.rows[threadSeed.rows.length - 1] ?? null;
  const selectedThreadSeed =
    threadSeed.rows.find((row) => row.eventId === input.selection.selectedThreadEventId) ?? latestThreadRow;
  const adjustedPreviewMode =
    input.runtimeScenario === "blocked" || input.runtimeScenario === "recovery_only"
      ? "suppressed_recovery_only"
      : threadSeed.previewMode;
  const adjustedRepairRequiredState =
    input.runtimeScenario === "blocked" || input.runtimeScenario === "recovery_only"
      ? "recovery_only"
      : threadSeed.repairRequiredState;
  const adjustedOutcomeState =
    input.runtimeScenario === "blocked" || input.runtimeScenario === "recovery_only"
      ? "recovery_required"
      : threadSeed.authoritativeOutcomeState;
  const threadRows = threadSeed.rows.map<ThreadEventRowProjection>((event) => ({
    rowId: event.eventId,
    anchorId: event.anchorId,
    eventKind: event.eventKind,
    occurredAt: event.occurredAt,
    headline: event.headline,
    summary:
      input.runtimeScenario === "blocked" || input.runtimeScenario === "recovery_only"
        ? "Recovery-only posture keeps the chronology visible while detailed content is withheld."
        : visibilitySummaryForMode(event.visibilityMode, event.summary),
    actorLabel: event.actorLabel,
    selected: selectedThreadSeed?.eventId === event.eventId,
    visibilityMode:
      input.runtimeScenario === "blocked" || input.runtimeScenario === "recovery_only"
        ? "suppressed_recovery_only"
        : event.visibilityMode,
    dispositionClass: event.dispositionClass,
    settlementResult: event.settlementResult,
    localAckState: event.localAckState,
    transportState: event.transportState,
    externalObservationState: event.externalObservationState,
    authoritativeOutcomeState:
      input.runtimeScenario === "blocked" || input.runtimeScenario === "recovery_only"
        ? "recovery_required"
        : event.authoritativeOutcomeState,
    repairRequiredState:
      input.runtimeScenario === "blocked" || input.runtimeScenario === "recovery_only"
        ? "recovery_only"
        : event.repairRequiredState,
    deliveryRiskState: event.deliveryRiskState,
    attachmentRefs: event.attachmentRefs,
    chips: buildThreadDispositionChips(event),
  }));

  const attachmentDigestGrid: AttachmentDigestGridProjection = {
    gridId: `attachment-digest-grid::${input.task.id}`,
    title: "AttachmentDigestGrid",
    summary:
      attachmentCards.length === 1
        ? "One governed attachment stays summary-first until explicitly opened."
        : `${attachmentCards.length} governed attachments stay summary-first until explicitly opened.`,
    selectedArtifactId: selectedArtifactSeed?.artifactId ?? null,
    cards: attachmentCards,
  };

  const communicationDigest: CommunicationDigestProjection = {
    communicationDigestId: `communication-digest::${input.task.id}`,
    requestRef: patientConversationBundle.requestRef,
    requestLineageRef: patientConversationBundle.requestLineageRef,
    clusterRef: patientConversationBundle.clusterRef,
    threadId: patientConversationBundle.threadId,
    patientConversationRouteRef: patientConversationBundle.routeRefs.messages,
    phase3ConversationBundleRef: patientConversationBundle.bundleRef,
    previewMode: adjustedPreviewMode,
    replyNeededState:
      input.runtimeScenario === "blocked" || input.runtimeScenario === "recovery_only"
        ? "read_only"
        : threadSeed.replyNeededState,
    awaitingReviewState: threadSeed.awaitingReviewState,
    repairRequiredState: adjustedRepairRequiredState,
    authoritativeOutcomeState: adjustedOutcomeState,
    deliveryRiskState: threadSeed.deliveryRiskState,
    dominantNextActionRef: threadSeed.dominantNextActionRef,
  };

  const patientResponseThreadPanel: PatientResponseThreadPanelProjection = {
    panelId: `patient-response-thread::${input.task.id}`,
    title: "PatientResponseThreadPanel",
    summary:
      input.runtimeScenario === "blocked" || input.runtimeScenario === "recovery_only"
        ? "The chronology remains visible, but detailed content is suppressed until the current recovery posture clears."
        : threadSeed.summary,
    requestRef: patientConversationBundle.requestRef,
    requestLineageRef: patientConversationBundle.requestLineageRef,
    clusterRef: patientConversationBundle.clusterRef,
    threadId: patientConversationBundle.threadId,
    patientConversationRouteRef: patientConversationBundle.routeRefs.messages,
    phase3ConversationBundleRef: patientConversationBundle.bundleRef,
    evidenceDeltaPacketRef: patientConversationBundle.evidenceDeltaPacketRef,
    moreInfoResponseDispositionRef: patientConversationBundle.moreInfoResponseDispositionRef,
    deliveryPosture: patientConversationBundle.parity.deliveryPosture,
    repairPosture: patientConversationBundle.parity.repairPosture,
    previewMode: adjustedPreviewMode,
    replyNeededState: communicationDigest.replyNeededState,
    awaitingReviewState: communicationDigest.awaitingReviewState,
    repairRequiredState: communicationDigest.repairRequiredState,
    authoritativeOutcomeState: communicationDigest.authoritativeOutcomeState,
    deliveryRiskState: communicationDigest.deliveryRiskState,
    dominantNextActionRef: communicationDigest.dominantNextActionRef,
    quietReturnTargetRef: input.quietReturnTargetRef,
    selectedThreadEventId: selectedThreadSeed?.eventId ?? null,
    anchorStub:
      selectedThreadSeed && latestThreadRow && selectedThreadSeed.eventId !== latestThreadRow.eventId
        ? {
            stubId: `thread-anchor-stub::${selectedThreadSeed.eventId}`,
            title: "ThreadAnchorStub",
            summary: `Focused on ${selectedThreadSeed.headline.toLowerCase()} while the task keeps the same quiet-return target.`,
            actionLabel: "Return to latest chronology",
            selectedEventAnchorRef: selectedThreadSeed.anchorId,
          }
        : adjustedPreviewMode !== "authenticated_summary"
          ? {
              stubId: `thread-anchor-stub::${input.task.id}::visibility`,
              title: "ThreadAnchorStub",
              summary: "The current visibility or recovery posture is explicit, and the same task shell keeps the last safe chronology anchor pinned.",
              actionLabel: "Return to latest chronology",
              selectedEventAnchorRef: latestThreadRow?.anchorId ?? `thread-anchor::${input.task.id}`,
            }
          : null,
    rows: threadRows,
  };

  const artifactViewerStage =
    selectedArtifactSeed &&
    attachmentCards.find((card) => card.artifactId === selectedArtifactSeed.artifactId)
      ? (() => {
          const selectedCard = attachmentCards.find(
            (card) => card.artifactId === selectedArtifactSeed.artifactId,
          )!;
          return {
            stageId: `artifact-viewer-stage::${selectedArtifactSeed.artifactId}`,
            artifactId: selectedArtifactSeed.artifactId,
            title: "ArtifactViewerStage",
            summary:
              selectedCard.modeTruth.currentMode === "placeholder_only"
                ? "Heavy preview remains bounded, so the governed placeholder stays in-place with provenance."
                : selectedCard.modeTruth.currentMode === "recovery_only"
                  ? "The viewer holds the last safe summary while the artifact tuple recovers."
                  : "The heavy artifact view opens inside the same shell and preserves the quiet-return target.",
            selectedAnchorRef: input.selectedAnchorRef,
            quietReturnTargetRef: input.quietReturnTargetRef,
            hydrationMode: selectedCard.hydrationMode,
            modeTruth: selectedCard.modeTruth,
            specimen: selectedCard.specimen,
          } satisfies ArtifactViewerStageProjection;
        })()
      : null;

  return {
    attachmentDigest: attachmentDigestGrid,
    communicationDigest,
    attachmentAndThread: {
      resolverId: `attachment-thread-resolver::${input.task.id}`,
      selectedAnchorRef: input.selectedAnchorRef,
      quietReturnTargetRef: input.quietReturnTargetRef,
      attachmentDigestGrid,
      artifactViewerStage,
      patientResponseThreadPanel,
    },
  };
}

export function createInitialAttachmentAndThreadSelection(
  task: StaffQueueCase | string,
): AttachmentAndThreadSelectionState {
  const taskId = typeof task === "string" ? task : task.id;
  const thread = threadSeedForTask(requireCase(taskId));
  return {
    selectedArtifactId: null,
    selectedThreadEventId: thread.rows[thread.rows.length - 1]?.eventId ?? null,
  };
}

export function buildTaskWorkspaceProjection(input: {
  route: StaffShellRoute;
  task: StaffQueueCase;
  authority: StaffRouteAuthorityArtifacts;
  runtimeScenario: RuntimeScenario;
  statusInput: StatusTruthInput;
  pulse: CasePulseContract;
  selectedDecision: string;
  selectedAnchorRef: string;
  rapidEntryDraft: RapidEntryDraftInput;
  attachmentAndThreadSelection: AttachmentAndThreadSelectionState;
}): TaskWorkspaceProjection {
  const {
    route,
    task,
    authority,
    runtimeScenario,
    statusInput,
    pulse,
    selectedDecision,
    selectedAnchorRef,
    rapidEntryDraft,
    attachmentAndThreadSelection,
  } = input;
  const openingMode = taskOpeningMode(task);
  const workspaceTrustEnvelopeRef = `workspace_trust_envelope::${authority.manifest.surfaceAuthorityTupleHash}`;
  const staffWorkspaceConsistencyProjectionRef = `staff_workspace_consistency_projection::${route.routeFamilyRef}`;
  const workspaceSliceTrustProjectionRef = `workspace_slice_trust_projection::${route.kind}::${task.id}`;
  const decisionDockFocusLeaseRef = `decision_dock_focus_lease::${task.id}::${route.kind}`;
  const reviewActionLeaseRef = `review_action_lease::${task.id}::current`;
  const decisionEpochRef = `decision_epoch::${task.id}::current`;
  const quietSettlementEnvelopeRef = `quiet_settlement_envelope::${task.id}::pending`;
  const authoritativeDeltaPacketRef = `evidence_delta_packet::${task.id}::${task.deltaClass}`;
  const statusTruthTupleRef = `status_truth_tuple::${task.id}::${runtimeScenario}`;
  const patientConversationBundle = resolvePhase3PatientWorkspaceConversationBundleByTaskId({
    taskId: task.id === "task-507" || task.id === "task-208" || task.id === "task-118" ? "task-311" : task.id,
    scenario: patientConversationScenarioForRuntime(runtimeScenario),
    routeKey:
      route.kind === "more-info"
        ? "conversation_more_info"
        : route.kind === "decision"
          ? "conversation_messages"
          : "conversation_overview",
  });
  const deltaFirstResumeShell =
    openingMode === "resumed_review"
      ? buildDeltaFirstResumeShellProjection({
          task,
          runtimeScenario,
          selectedAnchorRef,
          authoritativeDeltaPacketRef,
          reviewActionLeaseRef,
          decisionEpochRef,
        })
      : null;
  const promotedSupportRegion = supportRegionForTask({ route, task, selectedDecision });
  const quietReturnTargetRef =
    promotedSupportRegion?.quietReturnTargetRef ?? `quiet_return::${task.id}::summary`;
  const reasoningLayer = buildReasoningLayerProjection({
    route,
    task,
    runtimeScenario,
    selectedDecision,
    selectedAnchorRef,
    reviewActionLeaseRef,
    decisionEpochRef,
    rapidEntryDraft,
  });
  const attachmentAndThread = buildAttachmentAndThreadResolver({
    task,
    route,
    runtimeScenario,
    selectedAnchorRef,
    quietReturnTargetRef,
    selection: attachmentAndThreadSelection,
  });
  const taskStatusInput = cloneJson(statusInput);
  taskStatusInput.saveState = reasoningLayer.rapidEntryDraft.autosaveState;
  const dockState: DecisionDockProjection["stateStability"] =
    route.kind !== "task"
      ? "pending"
      : authority.guardDecision.effectivePosture === "live"
        ? "stable"
        : authority.guardDecision.effectivePosture === "read_only"
          ? "blocked"
          : "invalidated";

  return {
    taskWorkspaceProjectionId: `task_workspace_projection::${task.id}::${route.kind}`,
    taskId: task.id,
    requestRef: patientConversationBundle.requestRef,
    requestLineageRef: patientConversationBundle.requestLineageRef,
    routeKind: route.kind as "task" | "more-info" | "decision",
    patientConversationRouteRef:
      route.kind === "more-info"
        ? patientConversationBundle.routeRefs.moreInfo
        : route.kind === "decision"
          ? patientConversationBundle.routeRefs.messages
          : patientConversationBundle.routeRefs.overview,
    phase3ConversationBundleRef: patientConversationBundle.bundleRef,
    evidenceDeltaPacketRef: patientConversationBundle.evidenceDeltaPacketRef,
    moreInfoResponseDispositionRef: patientConversationBundle.moreInfoResponseDispositionRef,
    deliveryPosture: patientConversationBundle.parity.deliveryPosture,
    repairPosture: patientConversationBundle.parity.repairPosture,
    openingMode,
    workspaceTrustEnvelopeRef,
    staffWorkspaceConsistencyProjectionRef,
    workspaceSliceTrustProjectionRef,
    decisionDockFocusLeaseRef,
    reviewActionLeaseRef,
    decisionEpochRef,
    quietSettlementEnvelopeRef,
    statusTruthTupleRef,
    casePulse: pulse,
    statusInput: taskStatusInput,
    attachmentDigest: attachmentAndThread.attachmentDigest,
    communicationDigest: attachmentAndThread.communicationDigest,
    deltaFirstResumeShell,
    taskCanvasFrame: {
      taskCanvasFrameId: `task_canvas_frame::${task.id}`,
      primaryRegionBindingRef: `primary_region_binding::${task.id}`,
      statusStripAuthorityRef: `status_strip_authority::${task.id}`,
      quietReturnTargetRef,
      summaryStack: {
        stackId: `summary_stack::${task.id}`,
        title: "SummaryStack",
        headline: openingMode === "first_review" ? "First meaningful read" : "Current review frame",
        dominantQuestion: primaryQuestionForOpeningMode(openingMode),
        ownershipSummary: pulse.ownershipOrActorSummary,
        rows: task.summaryPoints.map((point, index) => ({
          id: `summary-point-${index + 1}`,
          label: index === 0 ? "Primary summary" : `Summary point ${index + 1}`,
          value: point,
          detail: task.previewTrustNote,
          tone: index === 0 ? "accent" : "neutral",
        })),
      },
      deltaStack: {
        stackId: `delta_stack::${task.id}`,
        title: "Change review",
        headline:
          openingMode === "resumed_review" || openingMode === "handoff_review" || openingMode === "approval_review"
            ? "Review recent changes first"
            : "Current change update",
        deltaClass: task.deltaClass,
        expandedByDefault: openingMode !== "first_review",
        decisiveMeaning:
          task.deltaClass === "decisive"
            ? "This change needs a fresh review before the prior path can continue."
            : task.deltaClass === "consequential"
              ? "This change affects the outcome status and must remain visible at commit time."
            : task.deltaClass === "clerical"
              ? "This clerical change stays visible as annotation unless a review rule says otherwise."
                : "This change stays visible as context without stealing the dominant action.",
        authoritativeDeltaPacketRef,
        acknowledgementState:
          openingMode === "first_review"
            ? "acknowledged"
            : recommitRequiredForTask(task)
              ? "recommit_required"
              : "pending_review",
        rows: [
          {
            id: "delta-summary",
            label: "Changed since seen",
            value: task.deltaSummary,
            detail: "Source checked for the current change.",
            tone: task.deltaClass === "decisive" ? "critical" : task.deltaClass === "consequential" ? "caution" : "neutral",
          },
          {
            id: "delta-review-mode",
            label: "Opening mode",
            value: openingMode.replaceAll("_", " "),
            detail: "Resumed and approval review prioritize recent changes before full history.",
            tone: "accent",
          },
        ],
        supersededContextRefs: task.supersededContext,
      },
      evidenceStack: {
        stackId: `evidence_stack::${task.id}`,
        title: "Evidence",
        headline: "Structured facts and returned evidence",
        lineageStripLabel: `History ${task.patientRef} • ${task.launchQueue}`,
        rows: task.evidence.map((item) => ({
          id: `evidence-${item.label.toLowerCase().replaceAll(" ", "-")}`,
          label: item.label,
          value: item.value,
          detail: item.detail,
          tone: item.label.toLowerCase().includes("duplicate")
            ? "caution"
            : item.label.toLowerCase().includes("reply")
              ? "accent"
              : "neutral",
        })),
      },
      consequenceStack: {
        stackId: `consequence_stack::${task.id}`,
        title: "Outcome review",
        headline: "Outcome preview and next-owner status",
        rows: task.consequences.map((item, index) => ({
          id: `consequence-${index + 1}`,
          label: item.title,
          value: selectedDecision,
          detail: item.detail,
          tone: index === 0 ? "accent" : "neutral",
        })),
        decisionPreviewLabel: selectedDecision,
        decisionPreviewSummary: task.consequences[0]?.detail ?? "No consequence preview is currently attached.",
      },
      referenceStack: {
        stackId: `reference_stack::${task.id}`,
        title: "Reference notes",
        headline: "Collapsed by default",
        collapsedByDefault: true,
        digestLabel: `${attachmentAndThread.attachmentDigest.cards.length} attachment digests · ${attachmentAndThread.communicationDigest.awaitingReviewState.replaceAll("_", " ")} thread status.`,
        rows: task.references.map((item, index) => ({
          id: `reference-${index + 1}`,
          label: `Reference ${index + 1}`,
          value: item,
          detail:
            index === 0
              ? "This stack keeps narrative, attachments, and audit detail quiet until the reviewer asks for more."
              : "Additional reference detail stays collapsed until it becomes the chosen reading target.",
          tone: "neutral",
        })),
        attachmentAndThread: attachmentAndThread.attachmentAndThread,
      },
    },
    decisionDock: {
      dockId: `decision_dock::${task.id}`,
      primaryActionLabel: statusInput.dominantActionLabel,
      primaryActionReason:
        promotedSupportRegion?.summary ??
        (task.deltaClass === "decisive"
          ? "Commit remains concentrated here because the authoritative delta is still active."
          : "Commit remains concentrated here while the current review action lease is active."),
      recommendationReasonRef: task.primaryReason,
      confidenceLevel:
        authority.guardDecision.effectivePosture === "live"
          ? task.deltaClass === "contextual"
            ? "high"
            : "guarded"
          : "blocked",
      consequencePreviewRef: task.consequences[0]?.detail ?? "No consequence preview attached",
      transitionEnvelopeRef: `decision_transition_envelope::${task.id}`,
      anchorPersistenceRef: selectedAnchorRef,
      focusLeaseRef: decisionDockFocusLeaseRef,
      stateStability: dockState,
      blockingReason:
        authority.guardDecision.effectivePosture === "live"
          ? null
          : `The dock remains visible, but ${authority.guardDecision.effectivePosture.replaceAll("_", " ")} posture fences commit-ready action.`,
      shortlist: task.decisionOptions,
    },
    reasoningLayer,
    promotedSupportRegion,
    selectedAnchorRef,
    shellPosture: runtimeScenario,
  };
}

function approvalStateForScenario(runtimeScenario: RuntimeScenario): {
  approvalState: ApprovalRouteState;
  commitState: DecisionCommitViewState;
  freezeReason: string | null;
  replacementAuthorityRef: string | null;
  actionEnabled: boolean;
  actionLabel: string;
} {
  switch (runtimeScenario) {
    case "live":
      return {
        approvalState: "pending",
        commitState: "awaiting_approval",
        freezeReason: null,
        replacementAuthorityRef: null,
        actionEnabled: true,
        actionLabel: "Advance the governed approval checkpoint",
      };
    case "stale_review":
      return {
        approvalState: "superseded",
        commitState: "superseded",
        freezeReason: "A newer decision epoch replaced the last approval-ready consequence preview.",
        replacementAuthorityRef: "approval_checkpoint::task-208::replacement",
        actionEnabled: false,
        actionLabel: "Review the replacement approval authority",
      };
    case "read_only":
      return {
        approvalState: "pending",
        commitState: "recovery_required",
        freezeReason: "The review lease drifted, so approval actions are frozen until the current tuple is revalidated.",
        replacementAuthorityRef: null,
        actionEnabled: false,
        actionLabel: "Revalidate lease before approval can continue",
      };
    case "recovery_only":
    case "blocked":
    default:
      return {
        approvalState: "recovery_required",
        commitState: "recovery_required",
        freezeReason: "The shell is preserving the last safe approval summary, but commit posture is fenced to recovery only.",
        replacementAuthorityRef: null,
        actionEnabled: false,
        actionLabel: "Restore the last safe approval context",
      };
  }
}

function approvalLifecycle(commitState: DecisionCommitViewState): readonly ApprovalLifecycleStepProjection[] {
  const order: readonly DecisionCommitViewState[] = [
    "previewing",
    "awaiting_approval",
    "commit_pending",
    "settled",
    "superseded",
    "recovery_required",
  ];
  const currentIndex = order.indexOf(commitState);

  return order.map((state, index) => ({
    stepId: `approval-lifecycle-${state}`,
    label: state.replaceAll("_", " "),
    current: state === commitState,
    reached: currentIndex >= 0 && index <= currentIndex,
  }));
}

function escalationStateForTask(task: StaffQueueCase, runtimeScenario: RuntimeScenario): {
  escalationState: EscalationRouteState;
  urgentStage: UrgentStageMode;
  currentStatusLabel: string;
  freezeReason: string | null;
  actionEnabled: boolean;
  actionLabel: string;
  elapsedLabel: string;
} {
  if (runtimeScenario === "read_only") {
    return {
      escalationState: "returned_to_triage",
      urgentStage: "recovery_only",
      currentStatusLabel: "Read-only escalation preserve",
      freezeReason:
        "Urgent contact work is visible, but this shell is read-only and may not record a fresh escalation attempt or outcome.",
      actionEnabled: false,
      actionLabel: "Observe the preserved escalation path",
      elapsedLabel: "Elapsed 29m",
    };
  }

  if (runtimeScenario === "recovery_only" || runtimeScenario === "blocked") {
    return {
      escalationState: "returned_to_triage",
      urgentStage: "recovery_only",
      currentStatusLabel: "Recovery-only preserve",
      freezeReason: "Urgent contact work is frozen while the shell preserves the last safe escalation summary and reopen rationale.",
      actionEnabled: false,
      actionLabel: "Restore the last safe escalation path",
      elapsedLabel: "Elapsed 29m",
    };
  }

  if (runtimeScenario === "stale_review") {
    return {
      escalationState: "returned_to_triage",
      urgentStage: "relief_pending",
      currentStatusLabel: "Returned to triage with lineage visible",
      freezeReason: "The urgent contact outcome was recorded, but the case must reopen in place before any further mutation resumes.",
      actionEnabled: false,
      actionLabel: "Resume review from the preserved escalation outcome",
      elapsedLabel: "Elapsed 26m",
    };
  }

  if (task.state === "blocked") {
    return {
      escalationState: "handoff_pending",
      urgentStage: "active",
      currentStatusLabel: "Blocked lane protecting downstream mutation",
      freezeReason: "Duplicate reconciliation still fences downstream pharmacy or callback action.",
      actionEnabled: false,
      actionLabel: "Wait for blocker relief before escalation can resolve",
      elapsedLabel: "Elapsed 61m",
    };
  }

  return {
    escalationState: "contact_in_progress",
    urgentStage: "active",
    currentStatusLabel: "Urgent callback contact work is in progress",
    freezeReason: null,
    actionEnabled: true,
    actionLabel: "Record the next urgent contact attempt",
    elapsedLabel: "Elapsed 9m",
  };
}

function escalationTimelineEntries(task: StaffQueueCase): readonly UrgentContactTimelineEntryProjection[] {
  if (task.id === "task-507") {
    return [
      {
        entryId: "task-507-escalation-origin",
        headline: "Duplicate blocker reopened the bounded escalation path",
        summary: "The medication-route contradiction forced the pharmacy intent back behind a governed blocker instead of letting fulfilment continue.",
        occurredAtLabel: "12:06",
        actorLabel: "Review kernel",
        eventTone: "critical",
        outcomeLabel: "returned to triage",
      },
      {
        entryId: "task-507-pharmacy-pause",
        headline: "Downstream fulfilment stayed frozen",
        summary: "The shell kept the blocker visible and suppressed any live-looking completion affordance.",
        occurredAtLabel: "12:17",
        actorLabel: "Workspace continuity",
        eventTone: "caution",
        outcomeLabel: "handoff pending",
      },
    ];
  }

  return [
    {
      entryId: "task-412-attempt-1",
      headline: "Attempt 1 failed against the stale mobile route",
      summary: "The callback dial-out hit the disputed number and immediately stayed visible as failed contact rather than a quiet transport-only event.",
      occurredAtLabel: "12:06",
      actorLabel: "Urgent callback lane",
      eventTone: "critical",
      outcomeLabel: "failed",
    },
    {
      entryId: "task-412-route-repair",
      headline: "Reachability repair stayed bounded in the same shell",
      summary: "The shell preserved the escalation reason and demoted routine chrome while the contact-route repair held the dominant path.",
      occurredAtLabel: "12:11",
      actorLabel: "Reachability repair",
      eventTone: "accent",
      outcomeLabel: "repair pending",
    },
    {
      entryId: "task-412-attempt-2",
      headline: "Attempt 2 escalated to urgent review",
      summary: "A second no-answer result kept the urgent path promoted and preserved all prior contact evidence as lineage-visible context.",
      occurredAtLabel: "12:15",
      actorLabel: "Urgent callback lane",
      eventTone: "critical",
      outcomeLabel: "contact in progress",
    },
  ];
}

export function buildApprovalInboxRouteProjection(input: {
  task: StaffQueueCase;
  rows: readonly StaffQueueCase[];
  runtimeScenario: RuntimeScenario;
  sourceTaskProjection: TaskWorkspaceProjection;
}): ApprovalInboxRouteProjection {
  const { task, rows, runtimeScenario, sourceTaskProjection } = input;
  const stage = approvalStateForScenario(runtimeScenario);
  const approvalRole = "Clinical access reviewer";
  const irreversibleEffects = [
    "Booking handoff remains fenced until the access rule is confirmed.",
    "The promoted consequence preview may stay visible, but it may not settle while approval truth is unresolved.",
  ] as const;
  const approvalRows: readonly ApprovalInboxRowProjection[] = rows.map((row) => ({
    rowId: `approval-row::${row.id}`,
    taskId: row.id,
    anchorRef: `approval-preview-${row.id}`,
    patientLabel: row.patientLabel,
    consequenceLabel: row.consequences[0]?.title ?? "Governed consequence review",
    approverRole: approvalRole,
    urgencyLabel: row.urgencyTone === "critical" ? "Urgent checkpoint" : "Governed checkpoint",
    changedSinceLastReview: row.deltaSummary,
    timestampLabel: row.freshnessLabel,
    approvalState: row.id === task.id ? stage.approvalState : "pending",
    commitState: row.id === task.id ? stage.commitState : "awaiting_approval",
    supersessionLabel:
      row.id === task.id && stage.replacementAuthorityRef
        ? "Replacement authority published"
        : row.supersededContext[0] ?? null,
    irreversibleEffectLabel: irreversibleEffects[0] ?? "Irreversible effect summary unavailable",
    summary: row.previewSummary,
    selected: row.id === task.id,
    openLabel: `Open ${row.patientLabel} in the task shell`,
  }));

  return {
    routeId: `approval_inbox_route::${task.id}`,
    visualMode: "Quiet_Escalation_Control_Room",
    queueHealthSummary:
      rows.length === 0
        ? "No governed approvals are currently waiting."
        : `${rows.length} governed approval ${rows.length === 1 ? "checkpoint is" : "checkpoints are"} waiting in the same shell.`,
    rowCount: rows.length,
    rows: approvalRows,
    reviewStage: {
      stageId: `approval_review_stage::${task.id}`,
      approvalState: stage.approvalState,
      commitState: stage.commitState,
      approvalCheckpointRef: `approval_checkpoint::${task.id}::current`,
      decisionEpochRef: sourceTaskProjection.decisionEpochRef,
      approvalRole,
      headline: "ApprovalReviewStage",
      summary:
        stage.approvalState === "superseded"
          ? "The last approval-ready consequence preview is frozen in place and points to the replacement authority instead of leaving a live-looking submit path."
          : "The consequence preview, source evidence, and irreversible effects stay visible together so the reviewer never loses causality.",
      rationale:
        "This consequence needs governed confirmation because the service-site availability change altered who may release the booking-intent path.",
      freezeReason: stage.freezeReason,
      replacementAuthorityRef: stage.replacementAuthorityRef,
      actionLabel: stage.actionLabel,
      actionEnabled: stage.actionEnabled,
      irreversibleEffects,
      lifecycle: approvalLifecycle(stage.commitState),
      sourceTaskProjection,
    },
    authoritySummary: {
      summaryId: `approval_authority_summary::${task.id}`,
      approvalCheckpointRef: `approval_checkpoint::${task.id}::current`,
      decisionEpochRef: sourceTaskProjection.decisionEpochRef,
      approvalRole,
      replacementAuthorityRef: stage.replacementAuthorityRef,
      auditTrailLabel: `decision_commit_envelope::${task.id}`,
      irreversibleEffects,
      approvalState: stage.approvalState,
      commitState: stage.commitState,
    },
    emptyStateTitle: "No approvals match the current filter",
    emptyStateSummary: "The route keeps the current shell and filter posture, but there is no governed approval row in the current slice.",
  };
}

export function buildEscalationRouteProjection(input: {
  task: StaffQueueCase;
  rows: readonly StaffQueueCase[];
  runtimeScenario: RuntimeScenario;
  sourceTaskProjection: TaskWorkspaceProjection;
}): EscalationRouteProjection {
  const { task, rows, runtimeScenario, sourceTaskProjection } = input;
  const stage = escalationStateForTask(task, runtimeScenario);
  const rowProjections: readonly EscalationInboxRowProjection[] = rows.map((row) => {
    const rowStage = escalationStateForTask(row, runtimeScenario);
    return {
      rowId: `escalation-row::${row.id}`,
      taskId: row.id,
      anchorRef: `escalation-preview-${row.id}`,
      patientLabel: row.patientLabel,
      urgencyReason: row.primaryReason,
      severityBand: row.urgencyTone === "critical" ? "critical" : "urgent",
      escalationState: rowStage.escalationState,
      currentStatusLabel: rowStage.currentStatusLabel,
      lastMeaningfulTouch: row.freshnessLabel,
      nextGovernedAction: rowStage.actionLabel,
      selected: row.id == task.id,
      openLabel: `Open ${row.patientLabel} in the task shell`,
    };
  });

  return {
    routeId: `escalation_route::${task.id}`,
    visualMode: "Quiet_Escalation_Control_Room",
    queueHealthSummary:
      rows.length === 0
        ? "No escalations currently need urgent contact handling."
        : `${rows.length} urgent or blocked ${rows.length === 1 ? "case is" : "cases are"} visible in the escalation lane.`,
    rowCount: rows.length,
    rows: rowProjections,
    commandSurface: {
      surfaceId: `escalation_command_surface::${task.id}`,
      escalationState: stage.escalationState,
      urgentStage: stage.urgentStage,
      dutyEscalationRef: `duty_escalation_record::${task.id}::current`,
      decisionEpochRef: sourceTaskProjection.decisionEpochRef,
      escalationOwnerLabel: task.id === "task-412" ? "Duty clinician review" : "Bounded blocker relief",
      severityBand: task.urgencyTone === "critical" ? "critical" : "urgent",
      urgencyReason: task.primaryReason,
      headline: "EscalationCommandSurface",
      summary:
        stage.urgentStage === "recovery_only"
          ? "The urgent path stays visible with the last safe summary and lineage, but action controls are frozen until recovery can safely resume."
          : "Urgent escalation stays promoted in one disciplined stage. Source evidence, contact truth, and next governed action remain visible without stacking banners.",
      freezeReason: stage.freezeReason,
      actionLabel: stage.actionLabel,
      actionEnabled: stage.actionEnabled,
      lineageSummary:
        stage.escalationState === "returned_to_triage"
          ? "The urgent path already produced a lineage-visible reopen explanation."
          : "If urgent contact returns this case to review, the shell will keep the escalation outcome and urgency reason attached to the next review frame.",
      sourceTaskProjection,
    },
    urgentTimeline: {
      timelineId: `urgent_contact_timeline::${task.id}`,
      escalationState: stage.escalationState,
      elapsedLabel: stage.elapsedLabel,
      currentStatusLabel: stage.currentStatusLabel,
      nextGovernedAction: stage.actionLabel,
      entries: escalationTimelineEntries(task),
    },
    outcomeRecorder: {
      recorderId: `escalation_outcome_recorder::${task.id}`,
      escalationState: stage.escalationState,
      resolutionGateRef: `callback_resolution_gate::${task.id}`,
      lastOutcomeSummary:
        stage.escalationState === "returned_to_triage"
          ? "Urgent escalation reopened the case for further governed review with the prior contact evidence preserved."
          : "No terminal outcome is recorded yet. The recorder stays ready to capture the next governed outcome without replacing the active evidence.",
      provenanceStrips: [
        task.deltaSummary,
        task.supersededContext[0] ?? "No superseded urgency context is currently attached.",
        `duty escalation ref ${`duty_escalation_record::${task.id}::current`}`,
      ],
      options: [
        {
          optionId: `escalation-outcome::${task.id}::direct_non_appointment`,
          outcomeClass: "direct_non_appointment",
          label: "Direct outcome",
          summary: "Record a safe direct resolution that does not create a downstream appointment or handoff.",
        },
        {
          optionId: `escalation-outcome::${task.id}::downstream_handoff`,
          outcomeClass: "downstream_handoff",
          label: "Downstream handoff",
          summary: "Capture the bounded handoff while preserving why urgent escalation had to leave the current review path.",
        },
        {
          optionId: `escalation-outcome::${task.id}::return_to_triage`,
          outcomeClass: "return_to_triage",
          label: "Return to triage",
          summary: "Relieve the urgent path and reopen the case with lineage-visible urgency context.",
        },
        {
          optionId: `escalation-outcome::${task.id}::cancelled`,
          outcomeClass: "cancelled",
          label: "Cancel escalation",
          summary: "Only use when the urgent stage was raised in error and the replacement authority is explicit.",
        },
        {
          optionId: `escalation-outcome::${task.id}::expired`,
          outcomeClass: "expired",
          label: "Mark expired",
          summary: "Preserve the failed urgent path as explicit provenance rather than smoothing over it.",
        },
      ],
    },
    emptyStateTitle: "No escalations match the current filter",
    emptyStateSummary: "The route keeps the urgent-control layout, but the current slice has no visible escalation row.",
  };
}

export function buildChangedWorkRouteProjection(input: {
  task: StaffQueueCase;
  rows: readonly StaffQueueCase[];
  runtimeScenario: RuntimeScenario;
  sourceTaskProjection: TaskWorkspaceProjection;
}): ChangedWorkRouteProjection {
  const { task, rows, runtimeScenario, sourceTaskProjection } = input;
  return {
    routeId: `changed_work_route::${task.id}`,
    visualMode: "Delta_Reentry_Compass",
    queueHealthSummary:
      rows.length === 0
        ? "No changed-review work is currently visible."
        : `${rows.length} changed-review ${rows.length === 1 ? "item is" : "items are"} available with delta-first resume posture.`,
    rowCount: rows.length,
    rows: rows.map((row) => ({
      rowId: `changed-row::${row.id}`,
      taskId: row.id,
      anchorRef: `changed-delta-${row.id}`,
      patientLabel: row.patientLabel,
      deltaClass: row.deltaClass,
      returnedEvidenceCount: Math.max(1, row.changedFieldRefs.length + row.contradictionRefs.length),
      contradictionCount: row.contradictionRefs.length,
      urgencyLabel:
        row.urgencyTone === "critical"
          ? "Urgent re-safety impact"
          : row.urgencyTone === "caution"
            ? "Guarded review impact"
            : "Routine review impact",
      changedSummary: row.deltaSummary,
      resumeState: deltaReviewStateForTask(row, runtimeScenario),
      recommitRequired: recommitRequiredForTask(row),
      selected: row.id === task.id,
      resumeLabel:
        row.state === "escalated" || row.state === "blocked"
          ? "Resume or redirect"
          : "Resume review",
    })),
    deltaFirstResumeShell:
      sourceTaskProjection.deltaFirstResumeShell ??
      buildDeltaFirstResumeShellProjection({
        task,
        runtimeScenario,
        selectedAnchorRef: sourceTaskProjection.selectedAnchorRef,
        authoritativeDeltaPacketRef: `evidence_delta_packet::${task.id}::${task.deltaClass}`,
        reviewActionLeaseRef: sourceTaskProjection.reviewActionLeaseRef,
        decisionEpochRef: sourceTaskProjection.decisionEpochRef,
      }),
    sourceTaskProjection,
    emptyStateTitle: "No changed work matches the current filter",
    emptyStateSummary:
      "The changed lane keeps the same shell and route family, but there is no current delta packet matching this slice.",
  };
}

export function buildSurfacePosture(
  route: StaffShellRoute,
  authority: StaffRouteAuthorityArtifacts,
  options: {
    queueRows: readonly StaffQueueCase[];
    selectedAnchorId: string;
    searchQuery: string;
  },
): SurfacePostureContract | null {
  if (route.kind === "queue" && options.queueRows.length === 0) {
    return resolveSurfacePostureContract({
      ...requireWorkspaceEmptySeed(),
      title: "No task needs action in this filtered queue right now",
      summary:
        "The queue is quiet for the current filter tuple, and the safest next action is to review saved filters or move to the adjacent queue.",
      selectedAnchor: {
        anchorId: options.selectedAnchorId,
        label: route.queueKey ?? "recommended",
        summary: "Queue selection remains explicit under empty posture.",
        returnLabel: "Back to the current queue",
      },
    });
  }

  if (route.kind === "search" && options.searchQuery && options.queueRows.length === 0) {
    return resolveSurfacePostureContract({
      ...requireWorkspaceEmptySeed(),
      title: "No exact-match result is currently published for this search",
      summary:
        "The same shell preserves your search term, route memory, and return target instead of dropping to a generic empty page.",
      regionLabel: "Search results",
      dominantQuestion: "Should I broaden the search or return to the current queue context?",
      nextSafeActionLabel: "Review search filters",
      selectedAnchor: {
        anchorId: options.selectedAnchorId,
        label: "Search results",
        summary: "The search route keeps the current query and return posture visible.",
        returnLabel: "Back to search results",
      },
    });
  }

  if (authority.guardDecision.effectivePosture === "recovery_only") {
    return resolveSurfacePostureContract({
      ...requireWorkspacePartialSeed(),
      postureClass: "bounded_recovery",
      title: "Protected work is frozen in place until the runtime tuple recovers",
      summary:
        "The current draft, selected anchor, and last safe summary stay visible while buffered updates wait behind the focus-protection lease.",
      regionLabel: "Protected composition recovery",
      dominantQuestion: "What can the reviewer safely restore before the current task continues?",
      nextSafeActionLabel: "Restore draft and review delta",
      visibilityState: "full",
      freshnessState: "stale_review",
      actionabilityState: "recovery_only",
      degradedMode: "bounded_recovery",
      selectedAnchor: {
        anchorId: options.selectedAnchorId,
        label: "Protected composition",
        summary: "Draft, compare target, and queue anchor remain pinned.",
        returnLabel: "Back to the protected composition anchor",
      },
      recoveryActions: [
        {
          actionId: "restore_draft",
          label: "Restore draft and review delta",
          detail: "Return to the last safe draft without replacing the current task or queue context.",
          importance: "dominant",
          actionKind: "resume",
        },
        {
          actionId: "review_summary",
          label: "Open last safe summary",
          detail: "Inspect the last trusted task summary while the live tuple is repaired.",
          importance: "secondary",
          actionKind: "return",
        },
      ],
    });
  }

  if (authority.guardDecision.effectivePosture === "blocked") {
    return resolveSurfacePostureContract({
      ...requireWorkspacePartialSeed(),
      postureClass: "blocked_recovery",
      title: "The workspace keeps context, but release truth blocks live action",
      summary:
        "The last safe queue row and task summary remain visible, yet commit and handoff actions stay suppressed until publication authority returns.",
      regionLabel: "Blocked release recovery",
      dominantQuestion: "What is the single safe recovery path while the workspace remains blocked?",
      nextSafeActionLabel: "Open recovery summary",
      visibilityState: "blocked",
      freshnessState: "blocked_recovery",
      actionabilityState: "blocked",
      degradedMode: "bounded_recovery",
      selectedAnchor: {
        anchorId: options.selectedAnchorId,
        label: "Blocked workspace anchor",
        summary: "The current row and quiet-return target remain visible even while action is blocked.",
        returnLabel: "Back to the blocked workspace anchor",
      },
      recoveryActions: [
        {
          actionId: "open_recovery_summary",
          label: "Open recovery summary",
          detail: "Preserve the task context while the operator reviews the release blocker evidence.",
          importance: "dominant",
          actionKind: "resume",
        },
      ],
    });
  }

  if (authority.guardDecision.effectivePosture === "read_only") {
    return resolveSurfacePostureContract({
      ...requireWorkspacePartialSeed(),
      postureClass: "read_only",
      title: "The current task remains visible, but writable posture is fenced",
      summary:
        "Queue truth, task summary, and the decision rail stay present while the reviewer rechecks the current delta or approval state.",
      regionLabel: "Read-only preserve",
      dominantQuestion: "What can still be reviewed safely without reopening mutation posture?",
      nextSafeActionLabel: "Review the visible summary",
      visibilityState: "full",
      freshnessState: "stale_review",
      actionabilityState: "read_only",
      degradedMode: "none",
      selectedAnchor: {
        anchorId: options.selectedAnchorId,
        label: "Read-only task anchor",
        summary: "The same task anchor stays pinned while commit posture is fenced.",
        returnLabel: "Back to the current task anchor",
      },
    });
  }

  return null;
}

export function deriveTaskForRoute(route: StaffShellRoute): StaffQueueCase | null {
  if (!route.taskId) {
    return route.kind === "callbacks"
      ? requireCase("task-412")
      : route.kind === "consequences"
      ? requireCase("task-311")
      : route.kind === "messages"
      ? requireCase("task-208")
      : route.kind === "approvals"
      ? requireCase("task-208")
      : route.kind === "escalations"
        ? requireCase("task-412")
        : route.kind === "changed"
          ? requireCase("task-311")
          : route.kind === "bookings"
            ? requireCase(resolveStaffBookingCaseSeed(route.bookingCaseId).taskId)
          : route.kind === "support-handoff"
            ? requireCase("task-412")
            : null;
  }
  return requireCase(route.taskId);
}

export function deriveVisibleQueueRows(
  route: StaffShellRoute,
  ledger: StaffShellLedger,
): StaffQueueCase[] {
  const visibleCases = activeStaffCases();
  if (route.kind === "search") {
    return listSearchCases(route.searchQuery || ledger.searchQuery);
  }
  if (route.kind === "callbacks") {
    return visibleCases.filter(
      (item) =>
        item.launchQueue === "callback-follow-up" ||
        item.quickCapture.reasonChips.includes("Callback follow-up") ||
        item.decisionOptions.some((option) => option.toLowerCase().includes("callback")),
    );
  }
  if (route.kind === "consequences") {
    return visibleCases.filter((item) => ["task-311", "task-507", "task-208", "task-118"].includes(item.id));
  }
  if (route.kind === "messages") {
    return visibleCases.filter((item) =>
      ["task-208", "task-311", "task-412", "task-118"].includes(item.id),
    );
  }
  if (route.kind === "approvals") {
    return visibleCases.filter((item) => item.state === "approval");
  }
  if (route.kind === "escalations") {
    return visibleCases.filter((item) => item.state === "escalated" || item.state === "blocked");
  }
  if (route.kind === "changed") {
    return visibleCases.filter(
      (item) => item.state === "changed" || item.state === "reassigned" || item.deltaClass !== "contextual",
    );
  }
  if (route.kind === "bookings") {
    const bookingTaskIds = new Set(baseQueueRowsForBookings());
    return visibleCases.filter((item) => bookingTaskIds.has(item.id));
  }
  const queueKey = route.queueKey ?? ledger.queueKey ?? "recommended";
  const rows = listQueueCases(queueKey);
  return ledger.queuedBatchPending ? rows : applyQueueChangeBatch(rows, ledger.selectedTaskId);
}

function baseQueueRowsForBookings(): readonly string[] {
  return [
    resolveStaffBookingCaseSeed("booking_case_299_linkage_required").taskId,
    resolveStaffBookingCaseSeed("booking_case_299_compare_live").taskId,
    resolveStaffBookingCaseSeed("booking_case_299_pending_confirmation").taskId,
    resolveStaffBookingCaseSeed("booking_case_299_stale_recovery").taskId,
    resolveStaffBookingCaseSeed("booking_case_299_confirmed").taskId,
  ];
}

function queueRankSnapshotRef(queueKey: string, queuedBatchPending: boolean): string {
  return queuedBatchPending ? "Current queue order" : "Recommended queue order";
}

function queueTargetRankSnapshotRef(queueKey: string): string {
  return "Recommended queue order";
}

function movementStateForTask(task: StaffQueueCase): QueueRowPresentationContract["movementState"] {
  if (task.state === "reassigned") {
    return "reassigned";
  }
  if (task.state === "approval") {
    return "approval_lane";
  }
  if (task.state === "blocked" || task.state === "escalated") {
    return "blocked_lane";
  }
  return task.currentQueueRank === task.nextQueueRank ? "stable" : "rank_shift";
}

function queueFilterPredicate(
  task: StaffQueueCase,
  filterKey: QueueToolbarFilterKey,
  searchQuery: string,
): boolean {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  if (normalizedQuery) {
    const haystack = [
      task.patientLabel,
      task.patientRef,
      task.primaryReason,
      task.secondaryMeta,
      task.state,
      task.deltaSummary,
      task.queueKey,
    ]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(normalizedQuery)) {
      return false;
    }
  }

  switch (filterKey) {
    case "all":
      return true;
    case "changed":
      return task.deltaClass !== "contextual" || task.state === "changed";
    case "urgent":
      return task.urgencyTone !== "info";
    case "approval":
      return task.state === "approval";
    case "blocked":
      return task.state === "blocked" || task.state === "escalated" || task.state === "reassigned";
  }
}

function queueToolbarFilters(rows: readonly StaffQueueCase[]): readonly QueueToolbarFilterOption[] {
  const countFor = (filterKey: QueueToolbarFilterKey) =>
    rows.filter((task) => queueFilterPredicate(task, filterKey, "")).length;

  return [
    { key: "all", label: "All", count: countFor("all") },
    { key: "changed", label: "Changed", count: countFor("changed") },
    { key: "urgent", label: "Urgent", count: countFor("urgent") },
    { key: "approval", label: "Approval", count: countFor("approval") },
    { key: "blocked", label: "Blocked", count: countFor("blocked") },
  ];
}

function buildQueueRowPresentationContract(input: {
  task: StaffQueueCase;
  queueKey: string;
  selectedTaskId: string;
  previewTaskId: string | null;
  previewPinned: boolean;
  taskOpen: boolean;
  rankSnapshotRef: string;
}): QueueRowPresentationContract {
  const { task } = input;
  const isSelected = input.selectedTaskId === task.id;
  const isPreviewing = input.previewTaskId === task.id;
  const rowState: QueueRowPresentationContract["rowState"] = input.taskOpen && isSelected
    ? "task_open"
    : isPreviewing && input.previewPinned
      ? "preview_pinned"
      : isPreviewing
        ? "preview_peek"
        : isSelected
          ? "selected"
          : "resting";

  return {
    queueRowPresentationContractId: `queue_row_contract::${input.queueKey}::${task.id}`,
    taskId: task.id,
    anchorRef: `queue-row-${task.id}`,
    rankSnapshotRef: input.rankSnapshotRef,
    rowDensity: isSelected || isPreviewing ? "elevated" : "compact",
    lineClampPrimary: 1,
    lineClampSecondary: 1,
    lineClampTertiary: 0,
    leftSignalRailMode: "semantic",
    rightClusterMode: "status_cluster",
    changedSinceSeenMode: task.deltaClass === "contextual" ? "muted" : "promoted",
    freshnessCueMode: "timestamp",
    currentRank: task.currentQueueRank,
    targetRank: task.nextQueueRank,
    primaryLabel: task.patientLabel,
    primarySummary: task.primaryReason,
    secondaryLine: `${task.dueLabel} • ${task.ageLabel} • ${task.freshnessLabel}`,
    queueExplanation: task.secondaryMeta,
    changedStateLabel: task.deltaClass === "contextual" ? "Stable since last review" : "Changed since seen",
    rightClusterLabel: `${task.state.replaceAll("_", " ")} • rank ${task.currentQueueRank}`,
    statusChipLabel: task.deltaClass.toUpperCase(),
    openActionLabel: `Open ${task.patientLabel}`,
    nextActionLabel: task.decisionOptions[0] ?? "Open task",
    signalTone: task.urgencyTone,
    rowState,
    movementState: movementStateForTask(task),
    generatedAt: "2026-04-17T08:30:00Z",
  };
}

function buildQueuePreviewDigestProjection(
  task: StaffQueueCase,
  queueKey: string,
  previewPinned: boolean,
  rankSnapshotRef: string,
): QueuePreviewDigestProjection {
  return {
    queuePreviewDigestId: `queue_preview_digest::${queueKey}::${task.id}`,
    taskId: task.id,
    rankSnapshotRef,
    rankEntryRef: `queue_rank_entry::${queueKey}::${task.id}`,
    reviewVersion: `review_version::${task.id}::v${task.currentQueueRank + 6}`,
    reasonSummaryRef: task.primaryReason,
    materialDeltaSummaryRef: task.deltaSummary,
    blockingDigestRef: task.consequences[0]?.detail ?? "No blocking digest",
    ownershipDigestRef: task.secondaryMeta,
    nextActionDigestRef: task.decisionOptions[0] ?? "Open task",
    attachmentAvailabilityDigestRef: task.evidence[0]?.value ?? "No attachment digest",
    previewMode: previewPinned ? "pinned_summary" : "hover_summary",
    leaseMintState: "forbidden",
    changedSinceSeenState: "unchanged",
    heavyHydrationState: "on_open_only",
    freshnessState: task.deltaClass === "contextual" ? "fresh" : "stale",
    generatedAt: "2026-04-17T08:30:00Z",
  };
}

function buildQueueChangeBatchProjection(
  queueKey: string,
  ledger: StaffShellLedger,
  selectedTaskId: string,
  sourceRows: readonly StaffQueueCase[],
): QueueChangeBatchProjection | null {
  if (!ledger.queuedBatchPending) {
    return null;
  }
  const targetRows = applyQueueChangeBatch(sourceRows, selectedTaskId);
  const priorityShiftRefs = targetRows
    .filter((row) => row.currentQueueRank !== row.nextQueueRank)
    .map((row) => row.id);

  return {
    batchId: `queue_change_batch::${queueKey}`,
    queueRef: queueKey,
    sourceRankSnapshotRef: queueRankSnapshotRef(queueKey, true),
    targetRankSnapshotRef: queueTargetRankSnapshotRef(queueKey),
    preservedAnchorRef: ledger.selectedAnchorId,
    preservedAnchorTupleHash: `anchor_tuple::${ledger.selectedAnchorId}`,
    insertedRefs: [],
    updatedRefs: priorityShiftRefs,
    priorityShiftRefs,
    rankPlanVersion: `rank_plan::${queueKey}::v2`,
    applyPolicy: "explicit_apply",
    batchImpactClass: "bufferable",
    focusProtectedRef: null,
    invalidatedAnchorRefs: [],
    replacementAnchorRefs: [],
    anchorApplyState: "preserved",
    summaryMessage: `${ledger.bufferedUpdateCount} queued changes are buffered. The current anchor stays pinned until you apply them.`,
    firstBufferedAt: "2026-04-17T08:18:00Z",
    flushDeadlineAt: "2026-04-17T08:42:00Z",
    batchState: "available",
    createdAt: "2026-04-17T08:18:00Z",
  };
}

function buildQueueAnchorStub(input: {
  route: StaffShellRoute;
  ledger: StaffShellLedger;
  allRows: readonly StaffQueueCase[];
  filteredRows: readonly QueueRowPresentationContract[];
  filterKey: QueueToolbarFilterKey;
  searchQuery: string;
}): QueueAnchorStubProjection | null {
  const anchorTaskId = input.ledger.selectedTaskId;
  const anchorTask = activeStaffCases().find((task) => task.id === anchorTaskId) ?? null;
  if (!anchorTask) {
    return {
      anchorId: input.ledger.selectedAnchorId,
      taskId: anchorTaskId,
      stubState: "settled_removed",
      title: "Selected anchor settled out of the queue",
      summary: "The last safe row left the current queue snapshot. Keep the stub visible until the next safe item is chosen.",
      actionLabel: "Return to queue top",
      targetQueueKey: input.route.queueKey ?? input.ledger.queueKey,
    };
  }

  const rowStillVisible = input.filteredRows.some((row) => row.taskId === anchorTaskId);
  if (rowStillVisible) {
    return null;
  }

  const rowStillInLane = input.allRows.some((row) => row.id === anchorTaskId);
  if (rowStillInLane && input.searchQuery.trim()) {
    return {
      anchorId: input.ledger.selectedAnchorId,
      taskId: anchorTaskId,
      stubState: "search_hidden",
      title: "Selected anchor is hidden by the current search",
      summary: `The anchor for ${anchorTask.patientLabel} stays pinned while the current queue search narrows the list.`,
      actionLabel: "Clear search",
      targetQueueKey: input.route.queueKey ?? input.ledger.queueKey,
    };
  }

  if (rowStillInLane && input.filterKey !== "all") {
    return {
      anchorId: input.ledger.selectedAnchorId,
      taskId: anchorTaskId,
      stubState: "filtered",
      title: "Selected anchor is hidden by the active filter",
      summary: `The anchor for ${anchorTask.patientLabel} stays preserved even though the toolbar filter removed it from the resting list.`,
      actionLabel: "Show all rows",
      targetQueueKey: input.route.queueKey ?? input.ledger.queueKey,
    };
  }

  if (anchorTask.state === "approval") {
    return {
      anchorId: input.ledger.selectedAnchorId,
      taskId: anchorTaskId,
      stubState: "moved_to_approvals",
      title: "Selected anchor moved to approvals",
      summary: `${anchorTask.patientLabel} is no longer in this queue slice. The governed approval lane now owns the row.`,
      actionLabel: "Open approvals lane",
      targetQueueKey: "approvals",
    };
  }

  if (anchorTask.state === "reassigned") {
    return {
      anchorId: input.ledger.selectedAnchorId,
      taskId: anchorTaskId,
      stubState: "moved_to_changed",
      title: "Selected anchor was reassigned",
      summary: `${anchorTask.patientLabel} left the current slice after reassignment. The changed-since-seen lane keeps the continuity path.`,
      actionLabel: "Open changed lane",
      targetQueueKey: "changed-since-seen",
    };
  }

  if (anchorTask.state === "blocked" || anchorTask.state === "escalated") {
    return {
      anchorId: input.ledger.selectedAnchorId,
      taskId: anchorTaskId,
      stubState: "moved_to_escalations",
      title: "Selected anchor moved into escalation handling",
      summary: `${anchorTask.patientLabel} now sits in the escalation slice. The queue keeps the stub instead of silently jumping focus.`,
      actionLabel: "Open escalation lane",
      targetQueueKey: "callback-follow-up",
    };
  }

  return {
    anchorId: input.ledger.selectedAnchorId,
    taskId: anchorTaskId,
    stubState: "settled_removed",
    title: "Selected anchor was removed from the current queue",
    summary: `${anchorTask.patientLabel} is no longer present in the committed queue snapshot. The last safe summary stays visible until you pick a replacement.`,
    actionLabel: "Return to top ranked row",
    targetQueueKey: input.route.queueKey ?? input.ledger.queueKey,
  };
}

export function buildQueueWorkbenchProjection(input: {
  route: StaffShellRoute;
  ledger: StaffShellLedger;
  selectedTaskId: string;
  previewTaskId: string | null;
  previewPinned: boolean;
  filterKey: QueueToolbarFilterKey;
  searchQuery: string;
}): QueueWorkbenchProjection {
  const queueKey = input.route.queueKey ?? input.ledger.queueKey ?? "recommended";
  const sourceRows = listQueueCases(queueKey);
  const rankSnapshotRef = queueRankSnapshotRef(queueKey, input.ledger.queuedBatchPending);
  const scanCandidateRows = input.ledger.queuedBatchPending
    ? sourceRows
    : applyQueueChangeBatch(sourceRows, input.selectedTaskId);
  const filteredRows = scanCandidateRows
    .filter((task) => queueFilterPredicate(task, input.filterKey, input.searchQuery))
    .map((task) =>
      buildQueueRowPresentationContract({
        task,
        queueKey,
        selectedTaskId: input.selectedTaskId,
        previewTaskId: input.previewTaskId,
        previewPinned: input.previewPinned,
        taskOpen: input.route.kind === "task" || input.route.kind === "more-info" || input.route.kind === "decision",
        rankSnapshotRef,
      }),
    );
  const previewTask =
    scanCandidateRows.find((task) => task.id === input.previewTaskId) ??
    activeStaffCases().find((task) => task.id === input.previewTaskId) ??
    null;
  const previewMode: QueueWorkbenchProjection["previewMode"] =
    input.route.kind === "task" || input.route.kind === "more-info" || input.route.kind === "decision"
      ? "task_open"
      : previewTask && input.previewPinned
        ? "pinned_summary"
        : previewTask
          ? "hover_summary"
          : "idle";

  return {
    queueKey,
    savedViewRef: `saved_view::${queueKey}`,
    appliedFilters: [input.filterKey, input.searchQuery.trim()].filter(Boolean),
    sortMode: "authoritative_rank",
    rankPlanVersion: `rank_plan::${queueKey}::v2`,
    rankSnapshotRef,
    assignmentSuggestionSnapshotRef: `assignment_suggestion_snapshot::${queueKey}`,
    workspaceTrustEnvelopeRef: `workspace_trust_envelope::${input.route.kind}::${input.selectedTaskId}`,
    rowOrderHash: filteredRows.map((row) => row.taskId).join("|") || "empty",
    rowCount: filteredRows.length,
    virtualWindowRef: `virtual_window::${queueKey}::0-${Math.max(filteredRows.length - 1, 0)}`,
    virtualizationState: filteredRows.length > 8 ? "windowed" : "inline",
    rows: filteredRows,
    queueHealthDigest: {
      label: queueKey === "recommended" ? "Recommended flow" : `${requireQueue(queueKey).label} flow`,
      summary: input.ledger.queuedBatchPending
        ? "Buffered live changes are waiting behind the selected anchor."
        : "Committed queue order is aligned to the active rank snapshot.",
    },
    queueChangeBatch: buildQueueChangeBatchProjection(queueKey, input.ledger, input.selectedTaskId, sourceRows),
    queueScanSession: {
      queueScanSessionId: `queue_scan_session::${queueKey}`,
      queueKey,
      rankSnapshotRef,
      focusedRowRef: input.selectedTaskId,
      previewDigestRef: previewTask ? `queue_preview_digest::${queueKey}::${previewTask.id}` : null,
      prefetchWindowRef: `prefetch_window::${queueKey}::summary_only`,
      selectedAnchorRef: input.ledger.selectedAnchorId,
      scanFenceToken: `scan_fence::${queueKey}::${input.selectedTaskId}`,
      previewHydrationMode: input.previewPinned ? "pinned_summary" : "summary_only",
      sessionState:
        previewMode === "task_open"
          ? "task_open"
          : previewMode === "pinned_summary"
            ? "preview_pinned"
            : previewMode === "hover_summary"
              ? "preview_peek"
              : "scanning",
      previewAcknowledgesSeen: false,
      openedAt: "2026-04-17T08:20:00Z",
      updatedAt: "2026-04-17T08:30:00Z",
    },
    queuePreviewDigest: previewTask
      ? buildQueuePreviewDigestProjection(previewTask, queueKey, input.previewPinned, rankSnapshotRef)
      : null,
    previewTaskId: previewTask?.id ?? null,
    previewMode,
    selectedAnchorId: input.ledger.selectedAnchorId,
    anchorStub: buildQueueAnchorStub({
      route: input.route,
      ledger: input.ledger,
      allRows: scanCandidateRows,
      filteredRows,
      filterKey: input.filterKey,
      searchQuery: input.searchQuery,
    }),
    toolbarFilters: queueToolbarFilters(sourceRows),
    searchQuery: input.searchQuery,
    generatedAt: "2026-04-17T08:30:00Z",
  };
}

export function reduceLedgerForNavigation(input: {
  ledger: StaffShellLedger;
  currentRoute: StaffShellRoute;
  nextRoute: StaffShellRoute;
  runtimeScenario: RuntimeScenario;
}): {
  ledger: StaffShellLedger;
  boundaryState: string;
  restoreStorageKey: string;
} {
  const boundaryDecision = resolveShellBoundaryDecision({
    currentRouteFamilyRef: input.currentRoute.routeFamilyRef,
    candidateRouteFamilyRef: input.nextRoute.routeFamilyRef,
    runtimeScenario: input.runtimeScenario,
  });
  const carryForwardPlan = createContinuityCarryForwardPlan(boundaryDecision);
  const restorePlan = createContinuityRestorePlan({
    shellSlug: "clinical-workspace",
    routeFamilyRef: input.nextRoute.routeFamilyRef,
    selectedAnchor: input.ledger.selectedAnchorId,
    foldState: "expanded",
    runtimeScenario: input.runtimeScenario,
  });
  const nextAnchor = carryForwardPlan.preserveSelectedAnchor
    ? input.ledger.selectedAnchorId
    : defaultAnchorForRoute(input.nextRoute);

  return {
    ledger: {
      ...input.ledger,
      path: input.nextRoute.path,
      queueKey: input.nextRoute.queueKey ?? input.ledger.queueKey,
      selectedTaskId: input.nextRoute.taskId ?? input.ledger.selectedTaskId,
      previewTaskId: input.nextRoute.taskId ?? input.ledger.previewTaskId,
      selectedAnchorId: nextAnchor,
      searchQuery: input.nextRoute.searchQuery,
      callbackStage: input.nextRoute.kind === "callbacks" ? input.ledger.callbackStage : "detail",
      messageStage: input.nextRoute.kind === "messages" ? input.ledger.messageStage : "detail",
      bufferedQueueTrayState: input.ledger.queuedBatchPending
        ? input.nextRoute.kind === "queue" ||
          input.nextRoute.kind === "home" ||
          (input.nextRoute.kind === "bookings" && resolveStaffBookingCaseSeed(input.nextRoute.bookingCaseId).queueBuffered)
          ? "expanded"
          : input.ledger.bufferedQueueTrayState === "expanded"
            ? "collapsed"
            : input.ledger.bufferedQueueTrayState
        : "collapsed",
      lastQuietRegionLabel:
        input.nextRoute.kind === "home"
          ? "Today workbench hero"
          : input.nextRoute.kind === "callbacks"
            ? "Callback workbench"
            : input.nextRoute.kind === "consequences"
              ? "Bounded consequence studio"
            : input.nextRoute.kind === "messages"
              ? "Thread repair studio"
              : input.nextRoute.kind === "bookings"
                ? "Staff booking control panel"
            : input.ledger.lastQuietRegionLabel,
    },
    boundaryState: boundaryDecision.boundaryState,
    restoreStorageKey: restorePlan.restoreStorageKey,
  };
}

export function defaultDecisionOption(task: StaffQueueCase): string {
  return task.decisionOptions[0] ?? "Review the current task";
}

export function staffAutomationProfile(routeFamilyRef: StaffShellRoute["routeFamilyRef"]) {
  return resolveAutomationAnchorProfile(routeFamilyRef);
}
