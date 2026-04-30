import {
  createInitialContinuitySnapshot,
  createUiTelemetryEnvelope,
  navigateWithinShell,
  selectAnchorInSnapshot,
  type ContinuitySnapshot,
  type RuntimeScenario,
  type UiTelemetryEnvelopeExample,
  type UiTelemetryEventClass,
} from "@vecells/persistent-shell";

export const HUB_SHELL_TASK_ID = "par_326";
export const HUB_SHELL_VISUAL_MODE = "Hub_Desk_Mission_Control";
export const HUB_SOURCE_SURFACE = "shell_gallery";
export const HUB_TELEMETRY_SCENARIO_ID = "SCN_SHELL_GALLERY_PATIENT_HOME";
export const HUB_DEFAULT_PATH = "/hub/queue";
export const HUB_SHELL_SLUG = "hub-desk";
export const HUB_SHELL_STORAGE_KEY = "hub-desk::continuity-ledger::326";
export const HUB_QUEUE_VISUAL_MODE = "Hub_Queue_Risk_Workbench";
export const HUB_RECOVERY_VISUAL_MODE = "Hub_Recovery_And_Reopen";
export const HUB_ACTING_CONTEXT_VISUAL_MODE = "Hub_Acting_Context_Control_Plane";
export const HUB_MISSION_STACK_VISUAL_MODE = "Hub_Mission_Stack_Premium";

export type HubViewMode = "queue" | "case" | "alternatives" | "exceptions" | "audit";
export type HubRouteFamilyRef = "rf_hub_queue" | "rf_hub_case_management";
export type HubLayoutMode = "two_plane" | "three_panel" | "mission_stack";
export type HubArtifactModeState = "interactive_live" | "table_only" | "summary_only";
export type HubVisualizationAuthority = "visual_table_summary" | "table_only" | "summary_only";
export type HubRecoveryPosture = "live" | "read_only" | "recovery_only";
export type HubRouteShellPosture = "shell_live" | "shell_read_only" | "shell_recovery_only";
export type HubSavedViewId =
  | "resume_today"
  | "ack_watch"
  | "callback_recovery"
  | "supplier_drift"
  | "observe_only";
export type HubCaseWorkState =
  | "alternatives_open"
  | "confirmation_pending"
  | "booked_pending_practice_ack"
  | "callback_transfer_pending"
  | "supplier_drift_review"
  | "urgent_return_to_practice";
export type HubOwnershipState =
  | "claimed_active"
  | "transfer_pending"
  | "takeover_required"
  | "observe_only";
export type HubInterruptionKind =
  | "confirmation_pending"
  | "practice_ack_debt"
  | "callback_transfer_blockage"
  | "supplier_drift_risk"
  | "stale_owner_risk"
  | "urgent_bounce_back";
export type HubSeverityTone = "neutral" | "ready" | "watch" | "critical";
export type HubSavedViewPosture = "live" | "read_only" | "recovery_required";
export type HubRiskBand = "critical" | "watch" | "ready";
export type HubQueueFilterId = "all" | "critical" | "same_day" | "degraded" | "callback";
export type HubWindowClass = 2 | 1 | 0;
export type HubSourceTrustState = "trusted" | "degraded" | "quarantined";
export type HubFreshnessBand = "fresh" | "aging" | "stale";
export type HubActingOrganisationId =
  | "north_shore_hub"
  | "riverside_medical"
  | "elm_park_surgery"
  | "south_vale_network";
export type HubActingSiteId =
  | "north_shore_coordination_desk"
  | "north_shore_escalation_room"
  | "riverside_callback_console"
  | "elm_park_delivery_desk"
  | "south_vale_intake_desk";
export type HubPurposeOfUseId =
  | "direct_care_coordination"
  | "practice_follow_up"
  | "site_delivery"
  | "service_recovery_review";
export type HubAudienceTierId =
  | "hub_desk_visibility"
  | "origin_practice_visibility"
  | "servicing_site_visibility"
  | "no_visibility";
export type HubAccessPosture = "writable" | "read_only" | "frozen" | "denied";
export type HubActingContextState = "current" | "stale" | "blocked";
export type HubVisibilityEnvelopeState = "current" | "stale" | "blocked";
export type HubBreakGlassState = "inactive" | "active" | "expiring" | "revoked" | "denied";
export type HubScopeDriftClass =
  | "organisation_switch"
  | "purpose_of_use_change"
  | "break_glass_revocation"
  | "visibility_contract_drift";
export type HubScopeOptionState = "current" | "available" | "blocked" | "pending";
export type HubScopeTransitionOutcome =
  | "preserve_writable"
  | "preserve_read_only"
  | "freeze_refresh_required"
  | "deny_scope";
export type HubPlaceholderReason =
  | "hidden_by_audience_tier"
  | "hidden_by_role"
  | "elevation_required"
  | "out_of_scope";
export type HubReservationTruthState =
  | "held"
  | "truthful_nonexclusive"
  | "no_hold"
  | "revalidation_required"
  | "unavailable";
export type HubOfferabilityState =
  | "direct_commit"
  | "patient_offerable"
  | "callback_only_reasoning"
  | "diagnostic_only";
export type HubQueueChangeState = "idle" | "buffered" | "applied";
export type HubQueueTimerType =
  | "candidate_refresh"
  | "patient_choice_expiry"
  | "required_window_breach"
  | "too_urgent_for_network"
  | "practice_notification_overdue";
export type HubEscalationBannerType =
  | "too_urgent"
  | "no_trusted_supply"
  | "practice_ack_overdue"
  | "supplier_drift"
  | "stale_owner"
  | "callback_transfer_blocked";
export type HubFallbackType =
  | "callback_request"
  | "return_to_practice"
  | "urgent_return_to_practice"
  | "reopen_review";
export type HubExceptionRetryState = "retryable" | "waiting_manual" | "closed";
export type HubExceptionEscalationState =
  | "none"
  | "supervisor_review_required"
  | "supervisor_reviewed";

export interface HubLocation {
  pathname: string;
  routeFamilyRef: HubRouteFamilyRef;
  viewMode: HubViewMode;
  hubCoordinationCaseId: string | null;
  offerSessionId: string | null;
}

export interface HubSavedView {
  savedViewId: HubSavedViewId;
  label: string;
  summary: string;
  queueLabel: string;
  startOfDayTitle: string;
  startOfDaySummary: string;
  dominantActionLabel: string;
  dominantActionSummary: string;
  dominantActionPath: string;
  defaultCaseId: string;
  queueCaseIds: readonly string[];
  interruptionIds: readonly string[];
  posture: HubSavedViewPosture;
  ownershipSummary: string;
  statusSummary: string;
}

export interface HubCoordinationCase {
  caseId: string;
  offerSessionId: string;
  patientLabel: string;
  queueRank: number;
  queueLabel: string;
  queueSummary: string;
  priorityBand: string;
  originPractice: string;
  workState: HubCaseWorkState;
  ownershipState: HubOwnershipState;
  ownershipLabel: string;
  continuitySummary: string;
  visibilitySummary: string;
  freshestEvidenceLabel: string;
  stageQuestion: string;
  startOfDaySummary: string;
  dominantActionLabel: string;
  dominantActionSummary: string;
  currentCheckpointLabel: string;
  auditSummary: string;
  caseStageSummary: string;
  caseStageHighlights: readonly string[];
  savedViewIds: readonly HubSavedViewId[];
}

export interface HubInterruptionDigestItem {
  interruptionId: string;
  caseId: string;
  kind: HubInterruptionKind;
  severity: HubSeverityTone;
  label: string;
  summary: string;
  dueLabel: string;
  routePath: string;
  dominantActionLabel: string;
}

export interface HubStatusAuthoritySignal {
  signalId: string;
  label: string;
  value: string;
  summary: string;
  tone: HubSeverityTone;
}

export interface HubScopeOptionDescriptor {
  optionId: string;
  label: string;
  summary: string;
  state: HubScopeOptionState;
  outcome: HubScopeTransitionOutcome | "blocked";
}

export interface HubActingContextChipDescriptor {
  contextId: string;
  organisationLabel: string;
  siteLabel: string;
  roleLabel: string;
  purposeLabel: string;
  audienceTierLabel: string;
  accessPosture: HubAccessPosture;
  contextState: HubActingContextState;
  breakGlassState: HubBreakGlassState;
  summary: string;
}

export interface HubScopeSummaryStripDescriptor {
  summaryId: string;
  organisationLabel: string;
  siteLabel: string;
  purposeLabel: string;
  audienceTierLabel: string;
  visibilityEnvelopeLabel: string;
  accessPosture: HubAccessPosture;
  accessPostureLabel: string;
  tupleHash: string;
  switchGenerationLabel: string;
  minimumNecessarySummary: string;
  visibilityEnvelopeState: HubVisibilityEnvelopeState;
  breakGlassState: HubBreakGlassState;
  breakGlassSummary: string;
}

export interface HubActingSiteSwitcherDescriptor {
  title: string;
  summary: string;
  options: readonly HubScopeOptionDescriptor[];
}

export interface HubPurposeOfUsePanelDescriptor {
  title: string;
  summary: string;
  options: readonly HubScopeOptionDescriptor[];
}

export interface HubBreakGlassReasonModalDescriptor {
  title: string;
  summary: string;
  allowed: boolean;
  denialSummary: string | null;
  recommendedReasonId: string;
  reasons: readonly {
    reasonId: string;
    label: string;
    summary: string;
    requiresJustification: boolean;
  }[];
}

export interface HubVisibilityEnvelopeLegendDescriptor {
  title: string;
  summary: string;
  currentAudienceTierId: HubAudienceTierId;
  rows: readonly {
    tierId: HubAudienceTierId;
    label: string;
    visibleSummary: string;
    hiddenSummary: string;
    current: boolean;
  }[];
}

export interface HubMinimumNecessaryPlaceholderBlockDescriptor {
  blockId: string;
  title: string;
  summary: string;
  reason: HubPlaceholderReason;
  audienceTierId: HubAudienceTierId;
  hiddenFields: readonly string[];
}

export interface HubAccessScopeTransitionReceiptDescriptor {
  transitionId: string;
  outcome: HubScopeTransitionOutcome;
  title: string;
  summary: string;
  previousScopeLabel: string;
  currentScopeLabel: string;
  preservedAnchorLabel: string;
  returnContractSummary: string;
}

export interface HubScopeDriftFreezeBannerDescriptor {
  bannerId: string;
  driftClass: HubScopeDriftClass;
  title: string;
  summary: string;
  actionLabel: string;
}

export interface HubAccessDeniedStateDescriptor {
  stateId: string;
  title: string;
  summary: string;
  reasonRows: readonly { label: string; value: string }[];
  recoveryActionLabel: string;
  queueActionLabel: string;
}

export interface HubOrganisationSwitchDrawerDescriptor {
  title: string;
  summary: string;
  organisationOptions: readonly HubScopeOptionDescriptor[];
  actingSiteSwitcher: HubActingSiteSwitcherDescriptor;
  purposePanel: HubPurposeOfUsePanelDescriptor;
  breakGlassSummary: string;
}

export interface HubActingContextControlPlaneDescriptor {
  visualMode: string;
  accessPosture: HubAccessPosture;
  contextState: HubActingContextState;
  visibilityEnvelopeState: HubVisibilityEnvelopeState;
  actingContextChip: HubActingContextChipDescriptor;
  scopeSummaryStrip: HubScopeSummaryStripDescriptor;
  organisationSwitchDrawer: HubOrganisationSwitchDrawerDescriptor;
  breakGlassReasonModal: HubBreakGlassReasonModalDescriptor;
  accessScopeTransitionReceipt: HubAccessScopeTransitionReceiptDescriptor | null;
  scopeDriftFreezeBanner: HubScopeDriftFreezeBannerDescriptor | null;
  visibilityEnvelopeLegend: HubVisibilityEnvelopeLegendDescriptor;
  minimumNecessaryPlaceholders: readonly HubMinimumNecessaryPlaceholderBlockDescriptor[];
  accessDeniedState: HubAccessDeniedStateDescriptor | null;
}

export interface HubQueueEntryStripRow {
  caseId: string;
  patientLabel: string;
  queueLabel: string;
  queueSummary: string;
  metaLine: string;
  selected: boolean;
  routePath: string;
  ownershipState: HubOwnershipState;
  ownershipLabel: string;
}

export interface HubStartOfDayResumeCardDescriptor {
  title: string;
  summary: string;
  dominantActionLabel: string;
  dominantActionPath: string;
  dominantActionSummary: string;
  supportingFacts: readonly { label: string; value: string }[];
}

export interface HubCaseStageHostDescriptor {
  title: string;
  summary: string;
  hostMode:
    | "queue_placeholder"
    | "case_host"
    | "alternatives_host"
    | "exceptions_host"
    | "audit_host";
  primaryPrompt: string;
  secondaryPrompt: string;
  highlights: readonly string[];
  primaryActionLabel: string;
  primaryActionPath: string;
}

export interface HubRightRailHostDescriptor {
  title: string;
  summary: string;
  items: readonly { label: string; value: string }[];
}

export interface HubQueueTimerCue {
  timerId: string;
  timerType: HubQueueTimerType;
  label: string;
  summary: string;
  tone: HubSeverityTone;
}

export interface HubQueueRiskSummaryItem {
  riskBand: HubRiskBand;
  label: string;
  shortLabel: string;
  count: number;
  summary: string;
}

export interface HubQueueChangeBatchDescriptor {
  batchId: string;
  state: Exclude<HubQueueChangeState, "idle">;
  sourceRankSnapshotRef: string;
  targetRankSnapshotRef: string;
  preservedAnchorCaseId: string;
  preservedOptionCardId: string;
  summary: string;
  actionLabel: string;
  followUpLabel: string;
}

export interface HubQueueWorkbenchRow {
  caseId: string;
  patientLabel: string;
  queueLabel: string;
  queueSummary: string;
  riskBand: HubRiskBand;
  breachProbability: number;
  breachSummary: string;
  priorityBand: string;
  timerLabel: string;
  trustSummary: string;
  ownershipState: HubOwnershipState;
  ownershipLabel: string;
  freshnessLabel: string;
  dominantActionLabel: string;
  selected: boolean;
  deltaBuffered: boolean;
  routePath: string;
}

export interface HubQueueWorkbenchProjectionDescriptor {
  projectionId: string;
  selectedCaseRef: string;
  selectedCaseSummary: string;
  selectedFilterId: HubQueueFilterId;
  visibleRows: readonly HubQueueWorkbenchRow[];
  savedViewSummary: string;
  riskSummary: readonly HubQueueRiskSummaryItem[];
  fairnessMergeState: string;
  queueChangeBatch: HubQueueChangeBatchDescriptor | null;
  continuityKey: string;
  toolbarSummary: string;
}

export interface HubOptionReasonCue {
  reasonId: string;
  label: string;
  summary: string;
}

export interface HubOptionCardProjectionDescriptor {
  optionCardId: string;
  candidateRef: string;
  rankOrdinal: number;
  windowClass: HubWindowClass;
  title: string;
  siteLabel: string;
  modalityLabel: string;
  startLabel: string;
  secondaryLine: string;
  travelMinutes: number;
  waitMinutes: number;
  manageCapability: string;
  sourceTrustState: HubSourceTrustState;
  sourceTrustSummary: string;
  freshnessBand: HubFreshnessBand;
  freshnessSummary: string;
  reservationTruthState: HubReservationTruthState;
  reservationTruthSummary: string;
  offerabilityState: HubOfferabilityState;
  dominantActionLabel: string;
  dominantActionSummary: string;
  approvedVarianceVisible: boolean;
  rankProofRef: string;
  rankExplanationRef: string;
  rankReasonRefs: readonly string[];
  rankReasons: readonly HubOptionReasonCue[];
  patientReasonCueRefs: readonly string[];
  comparisonLabel: string;
  selectedState: boolean;
  staleAt: string;
}

export interface HubOptionCardGroupDescriptor {
  groupId: string;
  windowClass: HubWindowClass;
  label: string;
  summary: string;
  cards: readonly HubOptionCardProjectionDescriptor[];
}

export interface HubCallbackFallbackCardDescriptor {
  cardId: string;
  title: string;
  summary: string;
  actionLabel: string;
  routePath: string;
  followUpLabel: string;
}

export interface HubBestFitNowStripDescriptor {
  title: string;
  summary: string;
  optionCardId: string;
  facts: readonly { label: string; value: string }[];
}

export interface HubEscalationBannerDescriptor {
  bannerId: string;
  bannerType: HubEscalationBannerType;
  severityBand: HubSeverityTone;
  title: string;
  summary: string;
  actionLabel: string;
}

export interface HubDecisionDockHostDescriptor {
  title: string;
  summary: string;
  posture: string;
  dominantActionLabel: string;
  dominantActionPath: string;
  dominantActionSummary: string;
  consequenceItems: readonly string[];
  supportingFacts: readonly { label: string; value: string }[];
}

export interface HubRecoveryMessagePreviewDescriptor {
  title: string;
  summary: string;
  rows: readonly { label: string; value: string }[];
}

export interface HubRecoveryActionDescriptor {
  actionId: string;
  label: string;
  summary: string;
  tone: HubSeverityTone;
  targetPath: string;
}

export interface HubNoSlotResolutionPanelDescriptor {
  panelId: string;
  fallbackType: HubFallbackType;
  title: string;
  summary: string;
  outcomeLabel: string;
  rationaleRows: readonly { label: string; value: string }[];
  actions: readonly HubRecoveryActionDescriptor[];
  patientPreview: HubRecoveryMessagePreviewDescriptor;
  practicePreview: HubRecoveryMessagePreviewDescriptor;
}

export interface HubCallbackTransferPendingStateDescriptor {
  stateId: string;
  title: string;
  summary: string;
  blockingRefs: readonly { label: string; value: string }[];
  patientCopy: string;
  nextSafeAction: string;
}

export interface HubReturnToPracticeReceiptDescriptor {
  receiptId: string;
  fallbackType: Extract<HubFallbackType, "return_to_practice" | "urgent_return_to_practice">;
  title: string;
  summary: string;
  receiptRows: readonly { label: string; value: string }[];
  reopenLinkageSummary: string;
}

export interface HubUrgentBounceBackBannerDescriptor {
  bannerId: string;
  title: string;
  summary: string;
  dueLabel: string;
  actionLabel: string;
}

export interface HubRecoveryDiffStripDescriptor {
  diffId: string;
  title: string;
  summary: string;
  diffRows: readonly {
    label: string;
    previousValue: string;
    nextValue: string;
    explanation: string;
  }[];
}

export interface HubReopenProvenanceStubDescriptor {
  stubId: string;
  title: string;
  summary: string;
  preservedRows: readonly { label: string; value: string }[];
  lawSummary: string;
}

export interface HubSupervisorEscalationPanelDescriptor {
  panelId: string;
  title: string;
  summary: string;
  bounceCount: number;
  noveltyScore: number;
  noveltyThreshold: number;
  actionRows: readonly { label: string; value: string }[];
}

export interface HubRecoveryCaseProjectionDescriptor {
  caseId: string;
  visualMode: string;
  mastheadTitle: string;
  mastheadSummary: string;
  fallbackType: HubFallbackType;
  noSlotResolutionPanel: HubNoSlotResolutionPanelDescriptor | null;
  callbackTransferPendingState: HubCallbackTransferPendingStateDescriptor | null;
  returnToPracticeReceipt: HubReturnToPracticeReceiptDescriptor | null;
  urgentBounceBackBanner: HubUrgentBounceBackBannerDescriptor | null;
  recoveryDiffStrip: HubRecoveryDiffStripDescriptor | null;
  reopenProvenanceStub: HubReopenProvenanceStubDescriptor | null;
  supervisorEscalationPanel: HubSupervisorEscalationPanelDescriptor | null;
}

export interface HubExceptionRowDescriptor {
  exceptionId: string;
  caseId: string;
  fallbackType: HubFallbackType;
  exceptionClass: string;
  severity: HubSeverityTone;
  retryState: HubExceptionRetryState;
  escalationState: HubExceptionEscalationState;
  title: string;
  summary: string;
  active: boolean;
  updatedAt: string;
  dueLabel: string;
}

export interface HubExceptionDetailDrawerDescriptor {
  exceptionId: string;
  caseId: string;
  fallbackType: HubFallbackType;
  title: string;
  summary: string;
  blockerRows: readonly { label: string; value: string }[];
  evidenceRows: readonly { label: string; value: string }[];
  nextSafeActions: readonly string[];
  escalationSummary: string;
  routePath: string;
}

export interface HubExceptionWorkspaceDescriptor {
  visualMode: string;
  title: string;
  summary: string;
  selectedExceptionId: string;
  rows: readonly HubExceptionRowDescriptor[];
  detailDrawer: HubExceptionDetailDrawerDescriptor;
}

export interface HubShellSnapshot {
  location: HubLocation;
  savedView: HubSavedView;
  currentCase: HubCoordinationCase;
  actingContextControlPlane: HubActingContextControlPlaneDescriptor;
  queueRows: readonly HubQueueEntryStripRow[];
  interruptionRows: readonly HubInterruptionDigestItem[];
  statusSignals: readonly HubStatusAuthoritySignal[];
  resumeCard: HubStartOfDayResumeCardDescriptor;
  caseStageHost: HubCaseStageHostDescriptor;
  rightRailHost: HubRightRailHostDescriptor;
  layoutMode: HubLayoutMode;
  artifactModeState: HubArtifactModeState;
  visualizationAuthority: HubVisualizationAuthority;
  recoveryPosture: HubRecoveryPosture;
  routeShellPosture: HubRouteShellPosture;
  routeMutationEnabled: boolean;
  summarySentence: string;
  dominantActionRef: string;
  selectedAnchorId: string;
  activeCaseAnchorId: string;
  queueVisualMode: string;
  queueWorkbench: HubQueueWorkbenchProjectionDescriptor;
  optionCardGroups: readonly HubOptionCardGroupDescriptor[];
  selectedOptionCard: HubOptionCardProjectionDescriptor;
  callbackFallbackCard: HubCallbackFallbackCardDescriptor | null;
  bestFitNowStrip: HubBestFitNowStripDescriptor;
  escalationBanner: HubEscalationBannerDescriptor | null;
  decisionDockHost: HubDecisionDockHostDescriptor;
  recoveryCase: HubRecoveryCaseProjectionDescriptor | null;
  exceptionWorkspace: HubExceptionWorkspaceDescriptor | null;
}

export interface HubShellState {
  location: HubLocation;
  continuitySnapshot: ContinuitySnapshot;
  selectedSavedViewId: HubSavedViewId;
  selectedCaseId: string;
  selectedQueueAnchorId: string;
  activeCaseAnchorId: string;
  selectedExceptionId: string;
  selectedOptionCardId: string;
  selectedOrganisationId: HubActingOrganisationId;
  selectedSiteId: HubActingSiteId;
  selectedPurposeId: HubPurposeOfUseId;
  breakGlassBaseState: Exclude<HubBreakGlassState, "expiring">;
  breakGlassReasonId: string | null;
  lastScopeTransition:
    | {
        fromOrganisationId: HubActingOrganisationId;
        fromSiteId: HubActingSiteId;
        fromPurposeId: HubPurposeOfUseId;
        toOrganisationId: HubActingOrganisationId;
        toSiteId: HubActingSiteId;
        toPurposeId: HubPurposeOfUseId;
        outcome: HubScopeTransitionOutcome;
      }
    | null;
  selectedQueueFilterId: HubQueueFilterId;
  queueChangeState: HubQueueChangeState;
  runtimeScenario: RuntimeScenario;
  returnPath: string | null;
  telemetry: readonly UiTelemetryEnvelopeExample[];
}

export interface HubShellHistorySnapshot {
  pathname: string;
  selectedSavedViewId: HubSavedViewId;
  selectedCaseId: string;
  selectedQueueAnchorId: string;
  activeCaseAnchorId: string;
  selectedExceptionId?: string;
  selectedOptionCardId?: string;
  selectedOrganisationId?: HubActingOrganisationId;
  selectedSiteId?: HubActingSiteId;
  selectedPurposeId?: HubPurposeOfUseId;
  breakGlassBaseState?: Exclude<HubBreakGlassState, "expiring">;
  breakGlassReasonId?: string | null;
  lastScopeTransition?: HubShellState["lastScopeTransition"];
  selectedQueueFilterId?: HubQueueFilterId;
  queueChangeState?: HubQueueChangeState;
}

export interface HubShellContractRouteRow {
  routeId: string;
  path: string;
  routeFamilyRef: HubRouteFamilyRef;
  viewMode: HubViewMode;
  projectionRef: string;
  selectedAnchorPolicy: string;
  dominantActionRule: string;
  statusRule: string;
}

export interface HubShellStateMatrixRow {
  rowId: string;
  path: string;
  savedViewId: HubSavedViewId;
  shellPosture: HubRouteShellPosture;
  layoutMode: Exclude<HubLayoutMode, "mission_stack">;
  dominantRegion: string;
  secondaryRegion: string;
  readOnlyReason: string;
}

const hubOrganisationConfigs = {
  north_shore_hub: {
    label: "North Shore Hub",
    summary: "Cross-practice coordination authority with hub-desk visibility.",
    audienceTierId: "hub_desk_visibility" as const,
    roleLabel: "Network coordinator",
    defaultSiteId: "north_shore_coordination_desk" as const,
    defaultPurposeId: "direct_care_coordination" as const,
  },
  riverside_medical: {
    label: "Riverside Medical",
    summary: "Origin-practice operational view with minimum-necessary exposure only.",
    audienceTierId: "origin_practice_visibility" as const,
    roleLabel: "Practice callback coordinator",
    defaultSiteId: "riverside_callback_console" as const,
    defaultPurposeId: "practice_follow_up" as const,
  },
  elm_park_surgery: {
    label: "Elm Park Surgery",
    summary: "Servicing-site delivery posture with site-local visibility only.",
    audienceTierId: "servicing_site_visibility" as const,
    roleLabel: "Servicing-site desk",
    defaultSiteId: "elm_park_delivery_desk" as const,
    defaultPurposeId: "site_delivery" as const,
  },
  south_vale_network: {
    label: "South Vale Network",
    summary: "No approved membership for the current hub tuple.",
    audienceTierId: "no_visibility" as const,
    roleLabel: "No active role",
    defaultSiteId: "south_vale_intake_desk" as const,
    defaultPurposeId: "direct_care_coordination" as const,
  },
} satisfies Record<
  HubActingOrganisationId,
  {
    label: string;
    summary: string;
    audienceTierId: HubAudienceTierId;
    roleLabel: string;
    defaultSiteId: HubActingSiteId;
    defaultPurposeId: HubPurposeOfUseId;
  }
>;

const hubSiteConfigs = {
  north_shore_coordination_desk: {
    organisationId: "north_shore_hub" as const,
    label: "Coordination desk",
    summary: "Primary writable hub console for live coordination.",
    optionState: "available" as const,
    outcome: "preserve_writable" as const,
  },
  north_shore_escalation_room: {
    organisationId: "north_shore_hub" as const,
    label: "Duty-clinician escalation room",
    summary: "Same hub tuple, but break-glass promotion is time-bound and visibly expiring.",
    optionState: "pending" as const,
    outcome: "preserve_writable" as const,
  },
  riverside_callback_console: {
    organisationId: "riverside_medical" as const,
    label: "Callback follow-up console",
    summary: "Read-only origin-practice review with callback and acknowledgement context only.",
    optionState: "available" as const,
    outcome: "preserve_read_only" as const,
  },
  elm_park_delivery_desk: {
    organisationId: "elm_park_surgery" as const,
    label: "Delivery desk",
    summary: "Servicing-site encounter delivery summary without origin triage detail.",
    optionState: "available" as const,
    outcome: "preserve_read_only" as const,
  },
  south_vale_intake_desk: {
    organisationId: "south_vale_network" as const,
    label: "Intake desk",
    summary: "Membership is not active for the current tuple, so the route remains denied.",
    optionState: "blocked" as const,
    outcome: "deny_scope" as const,
  },
} satisfies Record<
  HubActingSiteId,
  {
    organisationId: HubActingOrganisationId;
    label: string;
    summary: string;
    optionState: HubScopeOptionState;
    outcome: HubScopeTransitionOutcome;
  }
>;

const hubPurposeConfigs = {
  direct_care_coordination: {
    label: "Direct care coordination",
    summary: "Ordinary hub coordination under the current visibility envelope.",
    optionState: "available" as const,
  },
  practice_follow_up: {
    label: "Practice callback follow-up",
    summary: "Origin-practice read-only follow-up without hub-internal narrative.",
    optionState: "available" as const,
  },
  site_delivery: {
    label: "Site delivery",
    summary: "Servicing-site appointment delivery and manage posture only.",
    optionState: "available" as const,
  },
  service_recovery_review: {
    label: "Service recovery review",
    summary: "Policy-plane revalidation keeps the current case frozen until the scope is re-read.",
    optionState: "pending" as const,
  },
} satisfies Record<
  HubPurposeOfUseId,
  {
    label: string;
    summary: string;
    optionState: HubScopeOptionState;
  }
>;

const hubBreakGlassReasons = [
  {
    reasonId: "urgent_clinical_safety",
    label: "Urgent clinical safety",
    summary: "Immediate escalation requires richer delivery or coordination detail.",
    requiresJustification: true,
  },
  {
    reasonId: "safeguarding_continuity",
    label: "Safeguarding continuity",
    summary: "Current safeguarding concern needs governed evidence beyond the baseline envelope.",
    requiresJustification: true,
  },
  {
    reasonId: "specialist_escalation",
    label: "Specialist escalation",
    summary: "Time-limited escalation to the duty clinician or site specialist.",
    requiresJustification: false,
  },
] as const;

const hubAudienceTierLabels: Record<HubAudienceTierId, string> = {
  hub_desk_visibility: "Hub desk visibility",
  origin_practice_visibility: "Origin practice visibility",
  servicing_site_visibility: "Servicing site visibility",
  no_visibility: "No current visibility envelope",
};

function clampOrganisationId(
  organisationId: HubActingOrganisationId | undefined,
): HubActingOrganisationId {
  return organisationId && organisationId in hubOrganisationConfigs
    ? organisationId
    : "north_shore_hub";
}

function defaultSiteForOrganisation(organisationId: HubActingOrganisationId): HubActingSiteId {
  return hubOrganisationConfigs[organisationId].defaultSiteId;
}

function defaultPurposeForOrganisation(
  organisationId: HubActingOrganisationId,
): HubPurposeOfUseId {
  return hubOrganisationConfigs[organisationId].defaultPurposeId;
}

function normalizeSiteForOrganisation(
  organisationId: HubActingOrganisationId,
  siteId: HubActingSiteId | undefined,
): HubActingSiteId {
  if (!siteId) {
    return defaultSiteForOrganisation(organisationId);
  }
  return hubSiteConfigs[siteId]?.organisationId === organisationId
    ? siteId
    : defaultSiteForOrganisation(organisationId);
}

function normalizePurposeForOrganisation(
  organisationId: HubActingOrganisationId,
  purposeId: HubPurposeOfUseId | undefined,
): HubPurposeOfUseId {
  if (organisationId === "north_shore_hub") {
    return purposeId === "service_recovery_review" ? purposeId : "direct_care_coordination";
  }
  if (organisationId === "riverside_medical") {
    return "practice_follow_up";
  }
  if (organisationId === "elm_park_surgery") {
    return "site_delivery";
  }
  return "direct_care_coordination";
}

function clampBreakGlassBaseState(
  breakGlassBaseState: Exclude<HubBreakGlassState, "expiring"> | undefined,
): Exclude<HubBreakGlassState, "expiring"> {
  return breakGlassBaseState === "active" ||
    breakGlassBaseState === "revoked" ||
    breakGlassBaseState === "denied"
    ? breakGlassBaseState
    : "inactive";
}

export const hubCases: readonly HubCoordinationCase[] = [
  {
    caseId: "hub-case-104",
    offerSessionId: "offer-session-104",
    patientLabel: "Case 104 / child fever follow-up",
    queueRank: 1,
    queueLabel: "Same-day continuation",
    queueSummary:
      "One held continuation remains safe to resume now, with truthful fallback still visible.",
    priorityBand: "Same day",
    originPractice: "Riverside Medical",
    workState: "alternatives_open",
    ownershipState: "claimed_active",
    ownershipLabel: "Claimed by A. Khan",
    continuitySummary:
      "Continuity evidence is current for the selected same-shell route and queue anchor.",
    visibilitySummary:
      "Origin practice visibility is current; no new acknowledgement debt is open yet.",
    freshestEvidenceLabel: "Fresh 2m ago / 1 buffered queue change",
    stageQuestion:
      "Should the shell keep the held continuation as the resume path, or surface the truthful fallback if the hold drops?",
    startOfDaySummary:
      "Resume the current same-day queue without rebuilding the shell. The held path stays dominant, but the queue anchor and fallback evidence remain visible.",
    dominantActionLabel: "Resume same-day coordination",
    dominantActionSummary:
      "Continue from the pinned queue row and reopen the current case stage with the same ownership and visibility envelope.",
    currentCheckpointLabel: "Held continuation expires in 11m",
    auditSummary:
      "Rank proof RANK-104, policy tuple hub-pol-17, and continuity evidence hub-continuity-104 are the active proof set.",
    caseStageSummary:
      "The future ranked queue and decision workbench mount into this stage host without replacing the shell, selected queue row, or right-rail context.",
    caseStageHighlights: [
      "Queue anchor remains pinned across queue, case, alternatives, and audit routes.",
      "Only one dominant action stays visible at a time inside the case stage host.",
      "Quiet summary posture stays inside the shared shell rather than forking a detached dashboard.",
    ],
    savedViewIds: ["resume_today"],
  },
  {
    caseId: "hub-case-087",
    offerSessionId: "offer-session-087",
    patientLabel: "Case 087 / urgent COPD review",
    queueRank: 2,
    queueLabel: "Confirmation review",
    queueSummary:
      "Native booking is in flight, but external confirmation is still weaker than booked truth.",
    priorityBand: "Urgent today",
    originPractice: "Kingsgate Surgery",
    workState: "confirmation_pending",
    ownershipState: "claimed_active",
    ownershipLabel: "Claimed by J. Malik",
    continuitySummary:
      "Commit continuity is current, but the confirmation gate still blocks calm booked posture.",
    visibilitySummary:
      "Patient and practice copy remain provisional until stronger supplier evidence lands.",
    freshestEvidenceLabel: "Awaiting supplier confirmation / updated 2m ago",
    stageQuestion:
      "Which proof is still missing before this can upgrade from confirmation pending to confirmed network truth?",
    startOfDaySummary:
      "Resume the confirmation lane without leaving the shell. The selected case stays visible, but the route must remain operationally cautious.",
    dominantActionLabel: "Inspect pending confirmation",
    dominantActionSummary:
      "Review commit evidence, not dashboard metrics. The shell keeps the case open until confirmation settles or degrades.",
    currentCheckpointLabel: "External confirmation pending",
    auditSummary:
      "Commit attempt BTX-087-3, receipt checkpoint RCPT-087-2, and provider fence BIND-087 are the current governing tuple.",
    caseStageSummary:
      "Commit, practice visibility, and reminder surfaces mount here later, but the selected case and shell-level status authority already stay stable now.",
    caseStageHighlights: [
      "Confirmation pending stays in the shared strip, not in competing banners.",
      "Practice visibility remains separate from patient reassurance even in placeholder state.",
      "The shell keeps the case open until authoritative confirmation or governed recovery lands.",
    ],
    savedViewIds: ["resume_today", "ack_watch"],
  },
  {
    caseId: "hub-case-066",
    offerSessionId: "offer-session-066",
    patientLabel: "Case 066 / medication review booking",
    queueRank: 3,
    queueLabel: "Practice acknowledgement debt",
    queueSummary:
      "Booked truth is durable, but the origin practice still owes acknowledgement on the latest generation.",
    priorityBand: "Routine",
    originPractice: "Canal Street Practice",
    workState: "booked_pending_practice_ack",
    ownershipState: "transfer_pending",
    ownershipLabel: "Transfer pending / acknowledgement chase",
    continuitySummary:
      "Case remains live because acknowledgement generation 4 is overdue and still blocks quiet closure.",
    visibilitySummary:
      "Practice visibility is minimum necessary and generation-bound; patient reassurance is calmer than operator posture.",
    freshestEvidenceLabel: "Acknowledgement overdue by 19m",
    stageQuestion:
      "What materially changed after booking, and which acknowledgement generation still needs to be explicitly cleared?",
    startOfDaySummary:
      "Resume the acknowledgement chase in one shell. Patient-facing calmness can stay quiet while operator posture remains active and visible.",
    dominantActionLabel: "Chase practice acknowledgement",
    dominantActionSummary:
      "Keep the booked case pinned while the origin practice delta, due time, and latest proof remain visible in the same shell.",
    currentCheckpointLabel: "Generation 4 overdue by 19m",
    auditSummary:
      "Practice delta PVD-066-4, acknowledgement record ACK-066-4, and confirmation proof CONF-066-2 are the current authority set.",
    caseStageSummary:
      "Practice visibility and reminder detail surfaces land here later, but the shell already keeps acknowledgement debt explicit and same-shell.",
    caseStageHighlights: [
      "Booked truth does not clear acknowledgement debt or closeability on its own.",
      "Observe-only and transfer-pending postures stay visibly different from claimed-active work.",
      "Audit and reminder routes preserve the same active case anchor instead of reconstructing generic pages.",
    ],
    savedViewIds: ["resume_today", "ack_watch", "observe_only"],
  },
  {
    caseId: "hub-case-052",
    offerSessionId: "offer-session-052",
    patientLabel: "Case 052 / no safe slot left",
    queueRank: 4,
    queueLabel: "Callback recovery",
    queueSummary:
      "No safe ranked option remains. Callback transfer is required but the expectation record is not durable yet.",
    priorityBand: "Soon",
    originPractice: "Harbour Family Practice",
    workState: "callback_transfer_pending",
    ownershipState: "takeover_required",
    ownershipLabel: "Takeover required / stale owner recovery",
    continuitySummary:
      "Callback transfer is still blocked, so the shell stays in recovery and may not imply calm continuation.",
    visibilitySummary:
      "Practice visibility refreshed 8m ago, but fallback publication debt remains open.",
    freshestEvidenceLabel: "Recovery lane open / updated 8m ago",
    stageQuestion:
      "Which blocker must clear before this can move from fallback pending to callback expected without losing provenance?",
    startOfDaySummary:
      "Resume the fallback recovery lane. The shell must stay serious, visible, and same-shell until callback expectation publication settles.",
    dominantActionLabel: "Publish callback expectation",
    dominantActionSummary:
      "Keep the current queue row, ownership risk, and fallback provenance visible while the recovery path is still blocked.",
    currentCheckpointLabel: "Callback expectation not yet durable",
    auditSummary:
      "Recovery event HUB-REC-052, stale lease LEASE-052-9, and callback expectation gap CB-052-PENDING are all still open.",
    caseStageSummary:
      "No-slot recovery surfaces land here later, but the shell already preserves stale-owner risk and callback blockage without detaching the case.",
    caseStageHighlights: [
      "Recovery posture keeps the same queue anchor and case anchor visible.",
      "Callback is not rendered as another slot row or optimistic continuation.",
      "Supervisor takeover remains explicit in shell chrome rather than hidden in a modal flow.",
    ],
    savedViewIds: ["callback_recovery"],
  },
  {
    caseId: "hub-case-041",
    offerSessionId: "offer-session-041",
    patientLabel: "Case 041 / booked slot drift review",
    queueRank: 6,
    queueLabel: "Supplier drift supervision",
    queueSummary:
      "Supplier mirror reports a reschedule outside the current tuple; manage posture is frozen pending recovery.",
    priorityBand: "Active recovery",
    originPractice: "Elm Park Surgery",
    workState: "supplier_drift_review",
    ownershipState: "observe_only",
    ownershipLabel: "Observe only / another coordinator owns mutation",
    continuitySummary:
      "Supplier drift has frozen stale manage posture and reopened visibility debt.",
    visibilitySummary:
      "Practice acknowledgement debt has been reopened against the latest drift generation.",
    freshestEvidenceLabel: "Mirror drift observed 7m ago",
    stageQuestion:
      "Has the shell made the drift and freeze state explicit enough that no stale manage affordance can read as live?",
    startOfDaySummary:
      "Resume the supplier drift review in a bounded shell. Mutation stays blocked until continuity and visibility refresh settle together.",
    dominantActionLabel: "Review supplier drift recovery",
    dominantActionSummary:
      "Keep the case readable for supervision, but visibly read-only until current ownership and repair posture are refreshed.",
    currentCheckpointLabel: "Manage status frozen pending review",
    auditSummary:
      "Mirror observation MIR-041-5, drift hook DRIFT-041-2, and continuity refresh request CNT-041-3 form the current recovery tuple.",
    caseStageSummary:
      "Cross-org confirmation and manage detail mount here later, but the shell already downgrades to read-only or recovery when supplier truth drifts.",
    caseStageHighlights: [
      "Supplier drift reopens visibility debt and freezes stale manage posture.",
      "Observe-only review stays explicit in chrome and action labels.",
      "The shell keeps recovery inside the route family instead of redirecting to support.",
    ],
    savedViewIds: ["ack_watch", "supplier_drift", "observe_only"],
  },
  {
    caseId: "hub-case-031",
    offerSessionId: "offer-session-031",
    patientLabel: "Case 031 / urgent duty-clinician bounce-back",
    queueRank: 5,
    queueLabel: "Urgent bounce-back",
    queueSummary:
      "Lead-time law failed, the practice return has been linked, and repeated low-novelty recirculation now requires supervisor review.",
    priorityBand: "Urgent today",
    originPractice: "North Quay Practice",
    workState: "urgent_return_to_practice",
    ownershipState: "transfer_pending",
    ownershipLabel: "Return linked / supervisor review pending",
    continuitySummary:
      "The original queue anchor and prior no-slot rationale stay visible while the urgent return receipt and escalation posture settle.",
    visibilitySummary:
      "Origin practice receipt is linked, but supervisor review still blocks quiet closure after four low-novelty bounces.",
    freshestEvidenceLabel: "Urgent return linked 3m ago / novelty 0.18",
    stageQuestion:
      "Has the shell made the urgent return, preserved rationale, and repeat-bounce escalation explicit enough that no ordinary retry can look safe?",
    startOfDaySummary:
      "Resume the urgent recovery path in the same shell. The option context stays visible, but the next safe action is now duty-clinician return plus supervisor review.",
    dominantActionLabel: "Review urgent bounce-back",
    dominantActionSummary:
      "Keep the return receipt, provenance, and escalation threshold in one bounded canvas instead of detaching the case into a generic exception page.",
    currentCheckpointLabel: "Duty-clinician reopen linked / supervisor review due in 4m",
    auditSummary:
      "Return record RTP-031-4, reopen lease REOPEN-031-2, and supervisor escalation SUP-031-1 form the current governing set.",
    caseStageSummary:
      "Urgent return, exception, and reopen detail now mount here together, with the prior option context kept as read-only provenance rather than erased.",
    caseStageHighlights: [
      "Urgent bounce-back stays visually different from ordinary coordination.",
      "The shell preserves prior candidate context so the return is causally legible.",
      "Supervisor review appears as an explicit path, not a quiet retry hint.",
    ],
    savedViewIds: ["callback_recovery"],
  },
] as const;

export const hubSavedViews: readonly HubSavedView[] = [
  {
    savedViewId: "resume_today",
    label: "Resume today",
    summary: "Held or confirmation-bound cases that need one calm resume path right now.",
    queueLabel: "Same-day network work",
    startOfDayTitle: "Continue the current same-day coordination queue",
    startOfDaySummary:
      "Open with one dominant resume path, not a wall of widgets. Keep the same queue and case anchor alive before deeper surfaces mount.",
    dominantActionLabel: "Resume same-day coordination",
    dominantActionSummary:
      "Reopen the pinned queue row and hand the coordinator into the active case stage without rebuilding shell chrome or losing saved-view context.",
    dominantActionPath: "/hub/case/hub-case-104",
    defaultCaseId: "hub-case-104",
    queueCaseIds: ["hub-case-104", "hub-case-087", "hub-case-066"],
    interruptionIds: ["int-087-confirmation", "int-066-ack", "int-041-drift"],
    posture: "live",
    ownershipSummary: "Claimed-active queue / same-shell resume",
    statusSummary: "Fresh queue with one buffered delta and one held continuation nearing expiry",
  },
  {
    savedViewId: "ack_watch",
    label: "Ack watch",
    summary:
      "Cases where booked truth is durable but practice visibility still blocks quiet closure.",
    queueLabel: "Practice acknowledgement",
    startOfDayTitle: "Chase practice acknowledgement without losing the booked case anchor",
    startOfDaySummary:
      "Keep one explicit acknowledgement chase dominant while drift and confirmation debt stay bounded in the digest rail.",
    dominantActionLabel: "Review acknowledgement debt",
    dominantActionSummary:
      "Open the current booked case and keep the latest acknowledgement generation visible inside the same shell family.",
    dominantActionPath: "/hub/case/hub-case-066",
    defaultCaseId: "hub-case-066",
    queueCaseIds: ["hub-case-066", "hub-case-041", "hub-case-087"],
    interruptionIds: ["int-066-ack", "int-041-drift", "int-087-confirmation"],
    posture: "live",
    ownershipSummary: "Transfer pending / acknowledgement chase remains active",
    statusSummary: "Acknowledgement debt is the dominant blocker across booked network cases",
  },
  {
    savedViewId: "callback_recovery",
    label: "Callback recovery",
    summary: "No-slot and stale-owner cases that must stay in governed same-shell recovery.",
    queueLabel: "Fallback recovery",
    startOfDayTitle: "Resume callback recovery with one explicit next step",
    startOfDaySummary:
      "Keep callback blockage dominant and suppress calmness. The queue stays visible, but only one recovery action owns attention at a time.",
    dominantActionLabel: "Publish callback expectation",
    dominantActionSummary:
      "Return to the fallback case with the same ownership, queue anchor, and recovery context instead of opening a detached exception flow.",
    dominantActionPath: "/hub/case/hub-case-052",
    defaultCaseId: "hub-case-052",
    queueCaseIds: ["hub-case-052", "hub-case-031", "hub-case-041"],
    interruptionIds: [
      "int-052-callback",
      "int-031-urgent-return",
      "int-052-ownership",
      "int-041-drift",
    ],
    posture: "recovery_required",
    ownershipSummary: "Recovery-only / supervisor action needed",
    statusSummary:
      "Callback publication, urgent return, and stale-owner debt all stay explicit until recovery is durably linked",
  },
  {
    savedViewId: "supplier_drift",
    label: "Supplier drift",
    summary:
      "Cases where mirrored supplier truth has frozen stale manage posture or reopened visibility debt.",
    queueLabel: "Drift supervision",
    startOfDayTitle: "Start with supplier drift, not stale calmness",
    startOfDaySummary:
      "Open the drift review queue in the same shell and keep the blocked mutation posture obvious before later manage surfaces arrive.",
    dominantActionLabel: "Review supplier drift recovery",
    dominantActionSummary:
      "Enter the drift case in read-only or recovery posture with visibility debt and continuity refresh already explicit.",
    dominantActionPath: "/hub/case/hub-case-041",
    defaultCaseId: "hub-case-041",
    queueCaseIds: ["hub-case-041", "hub-case-066", "hub-case-087"],
    interruptionIds: ["int-041-drift", "int-066-ack", "int-087-confirmation"],
    posture: "recovery_required",
    ownershipSummary: "Observe-only supervision with recovery debt",
    statusSummary: "Supplier drift has frozen stale manage posture and reopened practice debt",
  },
  {
    savedViewId: "observe_only",
    label: "Observe only",
    summary: "Read-only multi-user viewing for cases already claimed elsewhere.",
    queueLabel: "Observe-only review",
    startOfDayTitle: "Review current hub work without taking ownership",
    startOfDaySummary:
      "Preserve the same shell, selected queue row, and case context while mutation stays unavailable until a lawful handoff occurs.",
    dominantActionLabel: "Open read-only case review",
    dominantActionSummary:
      "Hold the queue and case anchor steady while the shell makes observe-only posture explicit in chrome and status signals.",
    dominantActionPath: "/hub/case/hub-case-041",
    defaultCaseId: "hub-case-041",
    queueCaseIds: ["hub-case-041", "hub-case-066", "hub-case-087"],
    interruptionIds: ["int-041-drift", "int-066-ack"],
    posture: "read_only",
    ownershipSummary: "Observe-only / another coordinator owns mutation",
    statusSummary: "Route stays readable, but dominant actions are demoted to review-only status",
  },
] as const;

export const hubInterruptions: readonly HubInterruptionDigestItem[] = [
  {
    interruptionId: "int-087-confirmation",
    caseId: "hub-case-087",
    kind: "confirmation_pending",
    severity: "critical",
    label: "Confirmation pending",
    summary:
      "Native booking confirmation is still incomplete, so the case stays active and patient reassurance remains provisional.",
    dueLabel: "Evidence review due now",
    routePath: "/hub/case/hub-case-087",
    dominantActionLabel: "Inspect pending confirmation",
  },
  {
    interruptionId: "int-066-ack",
    caseId: "hub-case-066",
    kind: "practice_ack_debt",
    severity: "watch",
    label: "Practice acknowledgement debt",
    summary:
      "Generation 4 is overdue. The shell may not quiet or close the booked case until the current acknowledgement generation is settled or explicitly excepted.",
    dueLabel: "Generation 4 overdue by 19m",
    routePath: "/hub/case/hub-case-066",
    dominantActionLabel: "Review acknowledgement debt",
  },
  {
    interruptionId: "int-052-callback",
    caseId: "hub-case-052",
    kind: "callback_transfer_blockage",
    severity: "critical",
    label: "Callback transfer blocked",
    summary:
      "No safe slot remains. Callback expectation is still not durable, so the shell stays in governed recovery instead of implying another live option.",
    dueLabel: "Callback expectation still pending",
    routePath: "/hub/case/hub-case-052",
    dominantActionLabel: "Publish callback expectation",
  },
  {
    interruptionId: "int-052-ownership",
    caseId: "hub-case-052",
    kind: "stale_owner_risk",
    severity: "critical",
    label: "Stale-owner recovery",
    summary:
      "The current ownership lease is stale. Takeover remains explicit in shell chrome so read-only review is distinguishable from active coordination.",
    dueLabel: "Supervisor recovery open",
    routePath: "/hub/exceptions",
    dominantActionLabel: "Open exception review",
  },
  {
    interruptionId: "int-031-urgent-return",
    caseId: "hub-case-031",
    kind: "urgent_bounce_back",
    severity: "critical",
    label: "Urgent bounce-back linked",
    summary:
      "Return-to-practice linkage exists, but the case has bounced four times with low novelty and now requires supervisor review before ordinary churn can resume.",
    dueLabel: "Supervisor review due in 4m",
    routePath: "/hub/case/hub-case-031",
    dominantActionLabel: "Review urgent bounce-back",
  },
  {
    interruptionId: "int-041-drift",
    caseId: "hub-case-041",
    kind: "supplier_drift_risk",
    severity: "critical",
    label: "Supplier drift risk",
    summary:
      "Supplier mirror reports appointment details have drifted. Manage status is frozen and practice visibility debt has reopened until recovery settles.",
    dueLabel: "Mirror drift observed 7m ago",
    routePath: "/hub/case/hub-case-041",
    dominantActionLabel: "Review supplier drift recovery",
  },
] as const;

interface HubCaseWorkbenchSeed {
  caseId: string;
  riskBand: HubRiskBand;
  breachProbability: number;
  breachSummary: string;
  timerLabel: string;
  fairnessNote: string;
  baseOptionOrder: readonly string[];
  deltaOptionOrder: readonly string[];
  optionCards: readonly Omit<HubOptionCardProjectionDescriptor, "selectedState">[];
  callbackFallbackCard: HubCallbackFallbackCardDescriptor | null;
  escalationBanner: HubEscalationBannerDescriptor | null;
}

const hubSavedViewQueueOrders: Record<
  HubSavedViewId,
  {
    base: readonly string[];
    delta: readonly string[];
    fairnessMergeState: string;
  }
> = {
  resume_today: {
    base: ["hub-case-104", "hub-case-087", "hub-case-066"],
    delta: ["hub-case-087", "hub-case-104", "hub-case-066"],
    fairnessMergeState:
      "Critical or overdue rows bypass the fairness merge. Same-band rows stay stable after the rank proof.",
  },
  ack_watch: {
    base: ["hub-case-066", "hub-case-041", "hub-case-087"],
    delta: ["hub-case-041", "hub-case-066", "hub-case-087"],
    fairnessMergeState:
      "Acknowledgement debt stays ordered by risk first; fairness merge applies only after the same-band proof holds.",
  },
  callback_recovery: {
    base: ["hub-case-052", "hub-case-031", "hub-case-041"],
    delta: ["hub-case-031", "hub-case-052", "hub-case-041"],
    fairnessMergeState:
      "Recovery rows keep active callback blockage or urgent bounce-back ahead of convenience-focused reshuffles.",
  },
  supplier_drift: {
    base: ["hub-case-041", "hub-case-066", "hub-case-087"],
    delta: ["hub-case-087", "hub-case-041", "hub-case-066"],
    fairnessMergeState:
      "Supplier-drift supervision keeps critical confirmation or frozen-manage rows ahead of fairness merge rotations.",
  },
  observe_only: {
    base: ["hub-case-041", "hub-case-066", "hub-case-087"],
    delta: ["hub-case-087", "hub-case-041", "hub-case-066"],
    fairnessMergeState:
      "Observe-only review keeps the authoritative rank visible without exposing local resort or mutation affordances.",
  },
};

const hubCaseWorkbenchSeeds: readonly HubCaseWorkbenchSeed[] = [
  {
    caseId: "hub-case-104",
    riskBand: "watch",
    breachProbability: 0.36,
    breachSummary: "Window closes in 11 minutes if the held continuation drops.",
    timerLabel: "Held continuation expires in 11m",
    fairnessNote: "Same-day continuation still outranks lower-risk acknowledgement debt.",
    baseOptionOrder: ["opt-104-riverside", "opt-104-north-shore", "opt-104-harbour"],
    deltaOptionOrder: ["opt-104-north-shore", "opt-104-riverside", "opt-104-harbour"],
    optionCards: [
      {
        optionCardId: "opt-104-riverside",
        candidateRef: "candidate-104-riverside",
        rankOrdinal: 1,
        windowClass: 2,
        title: "09:20 / Riverside Hub / paediatric rapid review",
        siteLabel: "Riverside Hub",
        modalityLabel: "Face to face",
        startLabel: "Today 09:20",
        secondaryLine: "14 min travel • 0 min wait • Staff-managed follow-up available",
        travelMinutes: 14,
        waitMinutes: 0,
        manageCapability: "Managed by hub desk",
        sourceTrustState: "trusted",
        sourceTrustSummary: "Trusted native feed / same-bundle rank proof",
        freshnessBand: "fresh",
        freshnessSummary: "Fresh 2m ago",
        reservationTruthState: "held",
        reservationTruthSummary: "Held for this continuation / truthful exclusivity",
        offerabilityState: "direct_commit",
        dominantActionLabel: "Commit held continuation",
        dominantActionSummary:
          "Safe same-day continuation remains inside the preferred window and is currently held.",
        approvedVarianceVisible: false,
        rankProofRef: "RANK-104",
        rankExplanationRef: "RANK-104-A",
        rankReasonRefs: ["window", "held", "travel"],
        rankReasons: [
          {
            reasonId: "104-window",
            label: "Inside preferred window",
            summary: "Remains inside the clinically preferred same-day window.",
          },
          {
            reasonId: "104-held",
            label: "Held truthfully",
            summary: "The current hold is real, not implied by local UI state.",
          },
          {
            reasonId: "104-travel",
            label: "Lowest travel burden",
            summary: "Shortest safe travel time among trusted same-day options.",
          },
        ],
        patientReasonCueRefs: ["window_preferred", "short_travel"],
        comparisonLabel: "Best fit now",
        staleAt: "stale at 09:44",
      },
      {
        optionCardId: "opt-104-north-shore",
        candidateRef: "candidate-104-north-shore",
        rankOrdinal: 2,
        windowClass: 2,
        title: "09:45 / North Shore Annex / urgent child review",
        siteLabel: "North Shore Annex",
        modalityLabel: "Face to face",
        startLabel: "Today 09:45",
        secondaryLine: "19 min travel • 9 min wait • Manage via practice after booking",
        travelMinutes: 19,
        waitMinutes: 9,
        manageCapability: "Practice-managed after booking",
        sourceTrustState: "trusted",
        sourceTrustSummary: "Trusted feed / slightly older than the held continuation",
        freshnessBand: "aging",
        freshnessSummary: "Aging 8m",
        reservationTruthState: "truthful_nonexclusive",
        reservationTruthSummary: "Visible but not exclusive / no hold implied",
        offerabilityState: "patient_offerable",
        dominantActionLabel: "Offer as backup option",
        dominantActionSummary:
          "Still clinically preferred, but the slot is not held and may change before commit.",
        approvedVarianceVisible: false,
        rankProofRef: "RANK-104",
        rankExplanationRef: "RANK-104-B",
        rankReasonRefs: ["window", "trust", "nonexclusive"],
        rankReasons: [
          {
            reasonId: "104-window-b",
            label: "Still preferred window",
            summary: "Clinically acceptable now without using approved variance.",
          },
          {
            reasonId: "104-trust-b",
            label: "Trusted source",
            summary: "Current feed trust remains high enough for patient offerability.",
          },
          {
            reasonId: "104-nonexclusive-b",
            label: "No exclusive hold",
            summary: "Visible truthfully without implying the slot is reserved.",
          },
        ],
        patientReasonCueRefs: ["window_preferred", "backup_offer"],
        comparisonLabel: "Backup within same window",
        staleAt: "stale at 09:50",
      },
      {
        optionCardId: "opt-104-harbour",
        candidateRef: "candidate-104-harbour",
        rankOrdinal: 3,
        windowClass: 1,
        title: "10:30 / Harbour Virtual Hub / paediatric video review",
        siteLabel: "Harbour Virtual Hub",
        modalityLabel: "Video",
        startLabel: "Today 10:30",
        secondaryLine:
          "0 min travel • 41 min wait • Contact route repair needed before patient offer",
        travelMinutes: 0,
        waitMinutes: 41,
        manageCapability: "Contact repair required",
        sourceTrustState: "degraded",
        sourceTrustSummary: "Degraded source / visible for reasoning, not ordinary direct commit",
        freshnessBand: "fresh",
        freshnessSummary: "Fresh 3m ago",
        reservationTruthState: "no_hold",
        reservationTruthSummary: "No hold / advisory only",
        offerabilityState: "diagnostic_only",
        dominantActionLabel: "Review variance rationale",
        dominantActionSummary:
          "Visible as approved variance reasoning only while the source remains degraded.",
        approvedVarianceVisible: true,
        rankProofRef: "RANK-104",
        rankExplanationRef: "RANK-104-C",
        rankReasonRefs: ["variance", "degraded", "video"],
        rankReasons: [
          {
            reasonId: "104-variance",
            label: "Approved variance only",
            summary: "Falls into approved variance rather than the preferred window.",
          },
          {
            reasonId: "104-degraded",
            label: "Degraded trust",
            summary: "Feed trust blocks ordinary direct commit or patient offer.",
          },
          {
            reasonId: "104-video",
            label: "Video-only route",
            summary: "Zero-travel option stays secondary because modality and trust are weaker.",
          },
        ],
        patientReasonCueRefs: ["approved_variance"],
        comparisonLabel: "Variance reasoning",
        staleAt: "stale at 09:48",
      },
    ],
    callbackFallbackCard: null,
    escalationBanner: null,
  },
  {
    caseId: "hub-case-087",
    riskBand: "critical",
    breachProbability: 0.72,
    breachSummary:
      "Confirmation lag leaves less than 24 minutes before the required window breaches.",
    timerLabel: "Required-window breach in 24m",
    fairnessNote: "Confirmation-pending critical work bypasses same-band fairness merge.",
    baseOptionOrder: ["opt-087-booked", "opt-087-midday", "opt-087-home-visit"],
    deltaOptionOrder: ["opt-087-midday", "opt-087-booked", "opt-087-home-visit"],
    optionCards: [
      {
        optionCardId: "opt-087-booked",
        candidateRef: "candidate-087-booked",
        rankOrdinal: 1,
        windowClass: 2,
        title: "10:10 / Kingsgate Hub / COPD urgent review",
        siteLabel: "Kingsgate Hub",
        modalityLabel: "Face to face",
        startLabel: "Today 10:10",
        secondaryLine: "11 min travel • 6 min wait • Same-shell confirmation review",
        travelMinutes: 11,
        waitMinutes: 6,
        manageCapability: "Hub-managed confirmation",
        sourceTrustState: "trusted",
        sourceTrustSummary:
          "Trusted booking evidence, but supplier confirmation is still weaker than booked truth",
        freshnessBand: "aging",
        freshnessSummary: "Aging 6m",
        reservationTruthState: "revalidation_required",
        reservationTruthSummary: "Commit attempt exists / confirmation still requires revalidation",
        offerabilityState: "direct_commit",
        dominantActionLabel: "Inspect confirmation gate",
        dominantActionSummary:
          "The booking path is still governing, but confirmation remains pending and blocks calm completion.",
        approvedVarianceVisible: false,
        rankProofRef: "RANK-087",
        rankExplanationRef: "RANK-087-A",
        rankReasonRefs: ["critical_window", "confirmation", "trusted"],
        rankReasons: [
          {
            reasonId: "087-window",
            label: "Critical inside-window fit",
            summary: "Still inside the clinically required window.",
          },
          {
            reasonId: "087-confirmation",
            label: "Confirmation still pending",
            summary: "The supplier confirmation gate remains weaker than booked truth.",
          },
          {
            reasonId: "087-trusted",
            label: "Trusted route",
            summary: "Native booking evidence still outranks backup supply.",
          },
        ],
        patientReasonCueRefs: ["window_preferred", "confirmation_pending"],
        comparisonLabel: "Current booked path",
        staleAt: "stale at 09:40",
      },
      {
        optionCardId: "opt-087-midday",
        candidateRef: "candidate-087-midday",
        rankOrdinal: 2,
        windowClass: 2,
        title: "10:40 / North Shore Respiratory Hub / urgent review",
        siteLabel: "North Shore Respiratory Hub",
        modalityLabel: "Face to face",
        startLabel: "Today 10:40",
        secondaryLine: "18 min travel • 10 min wait • Patient-offerable if confirmation fails",
        travelMinutes: 18,
        waitMinutes: 10,
        manageCapability: "Patient can be offered if recovery triggers",
        sourceTrustState: "trusted",
        sourceTrustSummary: "Trusted fallback candidate / same window class",
        freshnessBand: "fresh",
        freshnessSummary: "Fresh 2m ago",
        reservationTruthState: "truthful_nonexclusive",
        reservationTruthSummary: "No hold / truthful fallback only",
        offerabilityState: "patient_offerable",
        dominantActionLabel: "Hold as governed backup",
        dominantActionSummary:
          "Remain ready if the confirmation gate fails or if a replay-safe switch becomes necessary.",
        approvedVarianceVisible: false,
        rankProofRef: "RANK-087",
        rankExplanationRef: "RANK-087-B",
        rankReasonRefs: ["backup_window", "freshness", "travel"],
        rankReasons: [
          {
            reasonId: "087-window-b",
            label: "Same preferred window",
            summary: "Still fits the required window without approved variance.",
          },
          {
            reasonId: "087-fresh",
            label: "Fresher than current booking",
            summary: "Latest snapshot is newer than the pending-confirmation slot.",
          },
          {
            reasonId: "087-travel",
            label: "Slightly longer travel",
            summary: "Travel burden is higher, so it stays below the active booking path.",
          },
        ],
        patientReasonCueRefs: ["window_preferred", "backup_offer"],
        comparisonLabel: "Fallback in same window",
        staleAt: "stale at 09:46",
      },
      {
        optionCardId: "opt-087-home-visit",
        candidateRef: "candidate-087-home-visit",
        rankOrdinal: 3,
        windowClass: 1,
        title: "11:15 / Mobile team / home respiratory review",
        siteLabel: "Mobile respiratory team",
        modalityLabel: "Home visit",
        startLabel: "Today 11:15",
        secondaryLine: "32 min travel • 0 min wait • Approved variance only",
        travelMinutes: 32,
        waitMinutes: 0,
        manageCapability: "Supervisor review required",
        sourceTrustState: "degraded",
        sourceTrustSummary: "Degraded route / visible for contingency only",
        freshnessBand: "aging",
        freshnessSummary: "Aging 12m",
        reservationTruthState: "no_hold",
        reservationTruthSummary: "No hold / contingent reasoning only",
        offerabilityState: "diagnostic_only",
        dominantActionLabel: "Review supervisor variance",
        dominantActionSummary:
          "Visible for urgent contingency planning only while confirmation remains unresolved.",
        approvedVarianceVisible: true,
        rankProofRef: "RANK-087",
        rankExplanationRef: "RANK-087-C",
        rankReasonRefs: ["variance", "degraded", "home_visit"],
        rankReasons: [
          {
            reasonId: "087-variance",
            label: "Approved variance only",
            summary: "Falls outside the required window unless a supervisor accepts variance.",
          },
          {
            reasonId: "087-degraded",
            label: "Degraded trust",
            summary: "Trust state blocks routine patient offerability.",
          },
          {
            reasonId: "087-home",
            label: "Home-visit overhead",
            summary: "Higher service cost keeps it below safer trusted supply.",
          },
        ],
        patientReasonCueRefs: ["approved_variance"],
        comparisonLabel: "Contingency only",
        staleAt: "stale at 09:52",
      },
    ],
    callbackFallbackCard: null,
    escalationBanner: null,
  },
  {
    caseId: "hub-case-066",
    riskBand: "watch",
    breachProbability: 0.44,
    breachSummary:
      "Booked truth is safe, but acknowledgement debt becomes operationally risky if the practice stays uninformed.",
    timerLabel: "Practice acknowledgement overdue by 19m",
    fairnessNote:
      "Booked acknowledgement debt stays behind imminent breach, ahead of routine read-only review.",
    baseOptionOrder: ["opt-066-booked", "opt-066-earlier", "opt-066-variance"],
    deltaOptionOrder: ["opt-066-booked", "opt-066-variance", "opt-066-earlier"],
    optionCards: [
      {
        optionCardId: "opt-066-booked",
        candidateRef: "candidate-066-booked",
        rankOrdinal: 1,
        windowClass: 2,
        title: "Thursday 14:20 / Canal Street Practice / medication review",
        siteLabel: "Canal Street Practice",
        modalityLabel: "Face to face",
        startLabel: "Thu 14:20",
        secondaryLine:
          "7 min travel • 0 min wait • Manage capability currently frozen to acknowledgement-safe actions",
        travelMinutes: 7,
        waitMinutes: 0,
        manageCapability: "Acknowledgement-safe manage only",
        sourceTrustState: "trusted",
        sourceTrustSummary: "Booked truth is durable and trusted",
        freshnessBand: "fresh",
        freshnessSummary: "Fresh 1m ago",
        reservationTruthState: "truthful_nonexclusive",
        reservationTruthSummary: "Booked truth is durable / no exclusive re-hold implied",
        offerabilityState: "direct_commit",
        dominantActionLabel: "Chase acknowledgement",
        dominantActionSummary:
          "The slot itself is sound; the active operator job is to clear the current acknowledgement generation.",
        approvedVarianceVisible: false,
        rankProofRef: "RANK-066",
        rankExplanationRef: "RANK-066-A",
        rankReasonRefs: ["booked_truth", "ack_debt", "travel"],
        rankReasons: [
          {
            reasonId: "066-booked",
            label: "Booked truth durable",
            summary: "The booked appointment remains the governing truth surface.",
          },
          {
            reasonId: "066-ack",
            label: "Acknowledgement debt open",
            summary: "Practice acknowledgement generation 4 is still overdue.",
          },
          {
            reasonId: "066-travel",
            label: "Local travel burden",
            summary: "Still the easiest path for the patient if the generation clears.",
          },
        ],
        patientReasonCueRefs: ["booked_true"],
        comparisonLabel: "Current booked state",
        staleAt: "stale at 09:41",
      },
      {
        optionCardId: "opt-066-earlier",
        candidateRef: "candidate-066-earlier",
        rankOrdinal: 2,
        windowClass: 2,
        title: "Thursday 13:40 / North Shore Annex / medication review",
        siteLabel: "North Shore Annex",
        modalityLabel: "Face to face",
        startLabel: "Thu 13:40",
        secondaryLine: "19 min travel • 4 min wait • Patient-offerable if rebook becomes necessary",
        travelMinutes: 19,
        waitMinutes: 4,
        manageCapability: "Offerable only if rebook path opens",
        sourceTrustState: "trusted",
        sourceTrustSummary: "Trusted backup supply",
        freshnessBand: "aging",
        freshnessSummary: "Aging 9m",
        reservationTruthState: "no_hold",
        reservationTruthSummary: "Visible without a hold or implied exclusivity",
        offerabilityState: "patient_offerable",
        dominantActionLabel: "Keep as backup",
        dominantActionSummary:
          "Only relevant if acknowledgement debt becomes a forced rebook event.",
        approvedVarianceVisible: false,
        rankProofRef: "RANK-066",
        rankExplanationRef: "RANK-066-B",
        rankReasonRefs: ["backup", "travel", "nonexclusive"],
        rankReasons: [
          {
            reasonId: "066-backup",
            label: "Trusted backup",
            summary: "Remains a viable fallback if the original booking cannot stand.",
          },
          {
            reasonId: "066-travel-b",
            label: "Longer travel",
            summary: "Travel burden is higher than the current booked slot.",
          },
          {
            reasonId: "066-hold-b",
            label: "No hold present",
            summary: "Card stays truthful about non-exclusive visibility.",
          },
        ],
        patientReasonCueRefs: ["backup_offer"],
        comparisonLabel: "Rebook backup",
        staleAt: "stale at 09:48",
      },
      {
        optionCardId: "opt-066-variance",
        candidateRef: "candidate-066-variance",
        rankOrdinal: 3,
        windowClass: 1,
        title: "Friday 09:00 / Harbour Virtual Hub / medication review video",
        siteLabel: "Harbour Virtual Hub",
        modalityLabel: "Video",
        startLabel: "Fri 09:00",
        secondaryLine: "0 min travel • 0 min wait • Policy-visible approved variance",
        travelMinutes: 0,
        waitMinutes: 0,
        manageCapability: "Supervisor-approved variance only",
        sourceTrustState: "trusted",
        sourceTrustSummary: "Trusted but outside the currently preferred timing",
        freshnessBand: "fresh",
        freshnessSummary: "Fresh 2m ago",
        reservationTruthState: "no_hold",
        reservationTruthSummary: "Advisory only / no hold",
        offerabilityState: "diagnostic_only",
        dominantActionLabel: "Review variance logic",
        dominantActionSummary:
          "Useful for planning, but it should not displace the durable booked truth without a lawful reopen.",
        approvedVarianceVisible: true,
        rankProofRef: "RANK-066",
        rankExplanationRef: "RANK-066-C",
        rankReasonRefs: ["variance", "video", "reopen"],
        rankReasons: [
          {
            reasonId: "066-variance",
            label: "Approved variance",
            summary: "Visible for contingency planning outside the preferred route.",
          },
          {
            reasonId: "066-video",
            label: "Video convenience",
            summary: "Low travel burden does not outweigh the reopen rules.",
          },
          {
            reasonId: "066-reopen",
            label: "Reopen required",
            summary: "A lawful reopen must happen before this becomes actionable.",
          },
        ],
        patientReasonCueRefs: ["approved_variance"],
        comparisonLabel: "Contingency only",
        staleAt: "stale at 09:47",
      },
    ],
    callbackFallbackCard: null,
    escalationBanner: null,
  },
  {
    caseId: "hub-case-052",
    riskBand: "critical",
    breachProbability: 0.91,
    breachSummary:
      "No safe trusted supply remains. Callback transfer must settle before the case can leave recovery.",
    timerLabel: "Too urgent for network in 7m",
    fairnessNote:
      "Callback-transfer blockages stay above fairness merge until the recovery lane settles.",
    baseOptionOrder: ["opt-052-variance", "opt-052-remote"],
    deltaOptionOrder: ["opt-052-remote", "opt-052-variance"],
    optionCards: [
      {
        optionCardId: "opt-052-variance",
        candidateRef: "candidate-052-variance",
        rankOrdinal: 1,
        windowClass: 0,
        title: "Tomorrow 08:45 / North Shore Hub / urgent GP review",
        siteLabel: "North Shore Hub",
        modalityLabel: "Face to face",
        startLabel: "Tomorrow 08:45",
        secondaryLine: "21 min travel • 0 min wait • Outside clinically safe window",
        travelMinutes: 21,
        waitMinutes: 0,
        manageCapability: "Recovery planning only",
        sourceTrustState: "trusted",
        sourceTrustSummary: "Trusted source, but timing is no longer safe enough for direct offer",
        freshnessBand: "fresh",
        freshnessSummary: "Fresh 1m ago",
        reservationTruthState: "unavailable",
        reservationTruthSummary: "Unavailable for direct commit / outside safe timing",
        offerabilityState: "diagnostic_only",
        dominantActionLabel: "Keep as rationale only",
        dominantActionSummary:
          "Visible so the coordinator can explain why callback became necessary.",
        approvedVarianceVisible: false,
        rankProofRef: "RANK-052",
        rankExplanationRef: "RANK-052-A",
        rankReasonRefs: ["outside_window", "trusted", "callback_only"],
        rankReasons: [
          {
            reasonId: "052-window",
            label: "Outside safe window",
            summary: "No longer clinically safe enough to present as a live slot.",
          },
          {
            reasonId: "052-trusted",
            label: "Trusted but still unusable",
            summary: "Trust alone cannot rescue an unsafe time window.",
          },
          {
            reasonId: "052-callback",
            label: "Callback path governs",
            summary: "The governed callback path is now the dominant recovery action.",
          },
        ],
        patientReasonCueRefs: ["outside_window"],
        comparisonLabel: "Explains the fallback",
        staleAt: "stale at 09:39",
      },
      {
        optionCardId: "opt-052-remote",
        candidateRef: "candidate-052-remote",
        rankOrdinal: 2,
        windowClass: 0,
        title: "Today 17:10 / Remote advice line / remote triage",
        siteLabel: "Remote advice line",
        modalityLabel: "Telephone",
        startLabel: "Today 17:10",
        secondaryLine:
          "0 min travel • 0 min wait • Degraded trust, not a governed slot alternative",
        travelMinutes: 0,
        waitMinutes: 0,
        manageCapability: "Review only",
        sourceTrustState: "degraded",
        sourceTrustSummary: "Degraded source / visible only for diagnosis and explanation",
        freshnessBand: "stale",
        freshnessSummary: "Stale 22m",
        reservationTruthState: "unavailable",
        reservationTruthSummary: "Unavailable / degraded diagnostic signal only",
        offerabilityState: "diagnostic_only",
        dominantActionLabel: "Explain rejection",
        dominantActionSummary:
          "Show why degraded remote advice cannot replace the governed callback route.",
        approvedVarianceVisible: false,
        rankProofRef: "RANK-052",
        rankExplanationRef: "RANK-052-B",
        rankReasonRefs: ["degraded", "stale", "not_slot"],
        rankReasons: [
          {
            reasonId: "052-degraded",
            label: "Degraded trust",
            summary: "Trust is too weak for ordinary actionability.",
          },
          {
            reasonId: "052-stale",
            label: "Stale feed",
            summary: "Freshness is too weak to support any live booking claim.",
          },
          {
            reasonId: "052-slot",
            label: "Not a slot substitute",
            summary: "This remains explanation-only and cannot masquerade as a slot row.",
          },
        ],
        patientReasonCueRefs: ["callback_only"],
        comparisonLabel: "Rejected diagnostic signal",
        staleAt: "stale at 09:36",
      },
    ],
    callbackFallbackCard: {
      cardId: "callback-052",
      title: "Governed callback fallback",
      summary:
        "Callback remains separate from ranked slot rows. The expectation record still needs durable publication before the shell can quiet.",
      actionLabel: "Publish callback expectation",
      routePath: "/hub/case/hub-case-052",
      followUpLabel: "Return to practice only if the callback transfer blocks again",
    },
    escalationBanner: {
      bannerId: "banner-052",
      bannerType: "callback_transfer_blocked",
      severityBand: "critical",
      title: "Callback transfer is the dominant path now",
      summary:
        "No safe trusted slot remains. Do not present variance or degraded supply as if it were a ranked live offer.",
      actionLabel: "Open callback recovery",
    },
  },
  {
    caseId: "hub-case-041",
    riskBand: "critical",
    breachProbability: 0.64,
    breachSummary:
      "Supplier drift froze stale manage posture and reopened practice visibility debt.",
    timerLabel: "Practice visibility refresh due in 12m",
    fairnessNote:
      "Supplier drift rows stay explicit so frozen manage posture cannot look calm or writable.",
    baseOptionOrder: ["opt-041-current", "opt-041-backup"],
    deltaOptionOrder: ["opt-041-backup", "opt-041-current"],
    optionCards: [
      {
        optionCardId: "opt-041-current",
        candidateRef: "candidate-041-current",
        rankOrdinal: 1,
        windowClass: 2,
        title: "Friday 11:30 / Elm Park Surgery / booked drifted slot",
        siteLabel: "Elm Park Surgery",
        modalityLabel: "Face to face",
        startLabel: "Fri 11:30",
        secondaryLine:
          "12 min travel • 0 min wait • Current booking drifted outside the live tuple",
        travelMinutes: 12,
        waitMinutes: 0,
        manageCapability: "Frozen pending drift review",
        sourceTrustState: "quarantined",
        sourceTrustSummary:
          "Quarantined by supplier drift / cannot support live manage or calmness",
        freshnessBand: "fresh",
        freshnessSummary: "Mirror drift observed 7m ago",
        reservationTruthState: "unavailable",
        reservationTruthSummary: "Unavailable until drift settles / no stale manage affordance",
        offerabilityState: "diagnostic_only",
        dominantActionLabel: "Review drift evidence",
        dominantActionSummary:
          "The current booking stays visible so the coordinator can reconcile it, not because it is action-safe.",
        approvedVarianceVisible: false,
        rankProofRef: "RANK-041",
        rankExplanationRef: "RANK-041-A",
        rankReasonRefs: ["supplier_drift", "quarantined", "manage_frozen"],
        rankReasons: [
          {
            reasonId: "041-drift",
            label: "Supplier drift detected",
            summary: "The supplier mirror reopened the tuple and blocked calm booked posture.",
          },
          {
            reasonId: "041-quarantine",
            label: "Quarantined trust",
            summary: "Trust is too weak for any live mutation.",
          },
          {
            reasonId: "041-freeze",
            label: "Manage frozen",
            summary:
              "Current manage posture is intentionally frozen until the tuple is reconciled.",
          },
        ],
        patientReasonCueRefs: ["supplier_drift"],
        comparisonLabel: "Current drifted booking",
        staleAt: "stale at 09:43",
      },
      {
        optionCardId: "opt-041-backup",
        candidateRef: "candidate-041-backup",
        rankOrdinal: 2,
        windowClass: 1,
        title: "Friday 14:10 / North Shore Annex / backup review slot",
        siteLabel: "North Shore Annex",
        modalityLabel: "Face to face",
        startLabel: "Fri 14:10",
        secondaryLine: "24 min travel • 6 min wait • Trusted backup if reopen succeeds",
        travelMinutes: 24,
        waitMinutes: 6,
        manageCapability: "Visible for reopen planning",
        sourceTrustState: "trusted",
        sourceTrustSummary: "Trusted backup supply / not yet dominant while drift is unresolved",
        freshnessBand: "aging",
        freshnessSummary: "Aging 9m",
        reservationTruthState: "no_hold",
        reservationTruthSummary: "No hold / visible for recovery planning only",
        offerabilityState: "patient_offerable",
        dominantActionLabel: "Prepare reopen path",
        dominantActionSummary:
          "Use only after the drift tuple is reconciled and reopen law authorizes a new dominant action.",
        approvedVarianceVisible: true,
        rankProofRef: "RANK-041",
        rankExplanationRef: "RANK-041-B",
        rankReasonRefs: ["trusted_backup", "variance", "reopen_gate"],
        rankReasons: [
          {
            reasonId: "041-backup",
            label: "Trusted backup",
            summary: "Trusted supply exists if the current booking cannot stand.",
          },
          {
            reasonId: "041-variance",
            label: "Approved variance",
            summary: "Visible as a later backup, not as a silent replacement.",
          },
          {
            reasonId: "041-reopen",
            label: "Reopen gate required",
            summary: "The shell may not switch to this candidate until reopen law clears.",
          },
        ],
        patientReasonCueRefs: ["approved_variance", "backup_offer"],
        comparisonLabel: "Recovery backup",
        staleAt: "stale at 09:49",
      },
    ],
    callbackFallbackCard: null,
    escalationBanner: {
      bannerId: "banner-041",
      bannerType: "supplier_drift",
      severityBand: "critical",
      title: "Supplier drift froze stale manage posture",
      summary:
        "Keep the current case pinned, but do not show quiet booked or live-manage posture until the tuple is reconciled.",
      actionLabel: "Inspect drift recovery",
    },
  },
  {
    caseId: "hub-case-031",
    riskBand: "critical",
    breachProbability: 0.97,
    breachSummary:
      "The practice return is linked, but repeated low-novelty bounce still blocks calm closure until supervisor review lands.",
    timerLabel: "Duty-clinician review due in 4m",
    fairnessNote:
      "Urgent bounce-back stays ahead of ordinary callback or acknowledgement recovery because the next safe action is external review, not local retry.",
    baseOptionOrder: ["opt-031-prior-window", "opt-031-clinical-context"],
    deltaOptionOrder: ["opt-031-clinical-context", "opt-031-prior-window"],
    optionCards: [
      {
        optionCardId: "opt-031-prior-window",
        candidateRef: "candidate-031-prior-window",
        rankOrdinal: 1,
        windowClass: 0,
        title: "Today 17:20 / Harbour Annex / late same-day follow-up",
        siteLabel: "Harbour Annex",
        modalityLabel: "Face to face",
        startLabel: "Today 17:20",
        secondaryLine: "26 min travel • 0 min wait • Outside the safe urgent window",
        travelMinutes: 26,
        waitMinutes: 0,
        manageCapability: "Read-only provenance",
        sourceTrustState: "trusted",
        sourceTrustSummary: "Trusted supply, preserved only to explain why an urgent return replaced ordinary coordination",
        freshnessBand: "aging",
        freshnessSummary: "Aging 6m",
        reservationTruthState: "unavailable",
        reservationTruthSummary: "Unavailable / too late for urgent care",
        offerabilityState: "diagnostic_only",
        dominantActionLabel: "Explain no-slot rationale",
        dominantActionSummary:
          "This remains visible so the return decision is reviewable, not because it is still safe to offer.",
        approvedVarianceVisible: false,
        rankProofRef: "RANK-031",
        rankExplanationRef: "RANK-031-A",
        rankReasonRefs: ["outside_window", "urgent_return", "provenance_only"],
        rankReasons: [
          {
            reasonId: "031-window",
            label: "Outside urgent window",
            summary: "The clinically safe lead-time inequality failed for this slot.",
          },
          {
            reasonId: "031-return",
            label: "Urgent return governs",
            summary: "The next safe action is duty-clinician return, not another offer.",
          },
          {
            reasonId: "031-provenance",
            label: "Provenance only",
            summary: "Preserved so the operator can explain what changed without reviving actionability.",
          },
        ],
        patientReasonCueRefs: ["urgent_return"],
        comparisonLabel: "Prior last-safe option",
        staleAt: "stale at 09:40",
      },
      {
        optionCardId: "opt-031-clinical-context",
        candidateRef: "candidate-031-clinical-context",
        rankOrdinal: 2,
        windowClass: 0,
        title: "New clinical context / home oxygen deterioration",
        siteLabel: "Practice escalation",
        modalityLabel: "Clinical context",
        startLabel: "Updated 3m ago",
        secondaryLine: "Novelty 0.18 • bounce 4 • supervisor review required",
        travelMinutes: 0,
        waitMinutes: 0,
        manageCapability: "Supervisor review only",
        sourceTrustState: "trusted",
        sourceTrustSummary: "Current clinical context is authoritative and now makes ordinary hub recirculation unsafe",
        freshnessBand: "fresh",
        freshnessSummary: "Fresh 3m ago",
        reservationTruthState: "unavailable",
        reservationTruthSummary: "No live slot action remains while return and supervisor review are active",
        offerabilityState: "diagnostic_only",
        dominantActionLabel: "Review supervisor path",
        dominantActionSummary:
          "Use the new clinical context to explain why the case escalated instead of retrying the hub loop.",
        approvedVarianceVisible: false,
        rankProofRef: "RANK-031",
        rankExplanationRef: "RANK-031-B",
        rankReasonRefs: ["novelty", "bounce", "supervisor"],
        rankReasons: [
          {
            reasonId: "031-novelty",
            label: "Low novelty",
            summary: "The latest recirculation did not materially improve trusted fit.",
          },
          {
            reasonId: "031-bounce",
            label: "Bounce threshold breached",
            summary: "Four returns now require explicit supervisor review.",
          },
          {
            reasonId: "031-supervisor",
            label: "Supervisor review dominates",
            summary: "Retry is demoted until a reviewer signs off the next safe path.",
          },
        ],
        patientReasonCueRefs: ["supervisor_review"],
        comparisonLabel: "Escalation context",
        staleAt: "stale at 09:43",
      },
    ],
    callbackFallbackCard: null,
    escalationBanner: {
      bannerId: "banner-031",
      bannerType: "too_urgent",
      severityBand: "critical",
      title: "Urgent bounce-back is now the dominant path",
      summary:
        "Lead-time law failed, the return has been linked, and repeat low-novelty churn must stay subordinate to supervisor review.",
      actionLabel: "Open urgent recovery",
    },
  },
] as const;

const hubRecoveryCases: readonly HubRecoveryCaseProjectionDescriptor[] = [
  {
    caseId: "hub-case-052",
    visualMode: HUB_RECOVERY_VISUAL_MODE,
    mastheadTitle: "No-slot recovery remains explicit",
    mastheadSummary:
      "Callback transfer is pending, the prior option context remains read-only provenance, and no calm completion copy is lawful yet.",
    fallbackType: "callback_request",
    noSlotResolutionPanel: {
      panelId: "recovery-no-slot-052",
      fallbackType: "callback_request",
      title: "HubNoSlotResolutionPanel",
      summary:
        "No trusted candidate remains inside the safe window. The shell keeps the rejected option context visible so the fallback is causally legible.",
      outcomeLabel: "Callback governs until expectation publication is durable",
      rationaleRows: [
        { label: "Trusted frontier", value: "Collapsed / outside safe window" },
        { label: "Lead-time law", value: "offerLead 28m > remaining clinical window 7m" },
        { label: "Fallback chosen", value: "Governed callback request" },
      ],
      actions: [
        {
          actionId: "publish-callback-052",
          label: "Publish callback expectation",
          summary: "Keep the callback path dominant until the expectation envelope is durably linked.",
          tone: "critical",
          targetPath: "/hub/case/hub-case-052",
        },
        {
          actionId: "review-exception-052",
          label: "Open recovery workspace",
          summary: "Inspect typed callback-transfer and stale-owner exceptions without leaving the shell.",
          tone: "watch",
          targetPath: "/hub/exceptions",
        },
      ],
      patientPreview: {
        title: "Patient preview",
        summary: "We have not found a safe slot in time. The hub is arranging a callback and will keep this case open until that handoff is durable.",
        rows: [
          { label: "Exposure", value: "Callback pending / no calm completion wording" },
          { label: "Reason", value: "Safe timing window no longer holds" },
        ],
      },
      practicePreview: {
        title: "Practice preview",
        summary: "Hub fallback is callback pending. Prior offers preserved as provenance only. Monitor callback expectation linkage before return is considered.",
        rows: [
          { label: "Current blocker", value: "Expectation envelope not yet published" },
          { label: "Provenance", value: "offer-session-052 kept read-only" },
        ],
      },
    },
    callbackTransferPendingState: {
      stateId: "callback-pending-052",
      title: "HubCallbackTransferPendingState",
      summary:
        "The callback domain has not yet durably taken over. The shell must stay operationally serious and may not imply that the handoff is complete.",
      blockingRefs: [
        { label: "Callback case", value: "CB-052 missing durable link" },
        { label: "Expectation envelope", value: "CBEXP-052 pending publication" },
        { label: "Stale owner debt", value: "LEASE-052-9 requires supervisor takeover" },
      ],
      patientCopy:
        "Patient-facing truth remains callback pending until the current expectation envelope is live.",
      nextSafeAction: "Publish callback expectation and keep stale offers frozen as provenance.",
    },
    returnToPracticeReceipt: null,
    urgentBounceBackBanner: null,
    recoveryDiffStrip: null,
    reopenProvenanceStub: {
      stubId: "reopen-prov-052",
      title: "Reopen history",
      summary:
        "The last visible alternatives remain attached as read-only context so the fallback never looks like a generic error replacement.",
      preservedRows: [
        { label: "Preserved offer session", value: "offer-session-052 / read_only_provenance" },
        { label: "Preserved fallback card", value: "callback-052 / sourceFallbackRef intact" },
        { label: "Selected anchor", value: "opt-052-variance" },
      ],
      lawSummary:
        "Fallback supersession preserves rationale and selected-anchor evidence, but stale accept or callback mutation remains frozen.",
    },
    supervisorEscalationPanel: null,
  },
  {
    caseId: "hub-case-031",
    visualMode: HUB_RECOVERY_VISUAL_MODE,
    mastheadTitle: "Urgent bounce-back is now the dominant posture",
    mastheadSummary:
      "The return-to-practice workflow is linked, but repeated low-novelty recirculation has escalated to supervisor review rather than a quiet retry.",
    fallbackType: "urgent_return_to_practice",
    noSlotResolutionPanel: {
      panelId: "recovery-no-slot-031",
      fallbackType: "urgent_return_to_practice",
      title: "HubNoSlotResolutionPanel",
      summary:
        "Lead-time law failed for all trusted candidates in the urgent window. The panel keeps the prior option context visible so the duty-clinician return is explainable.",
      outcomeLabel: "Urgent return linked / no ordinary retry",
      rationaleRows: [
        { label: "Trusted frontier", value: "No safe urgent slot remains" },
        { label: "Lead-time law", value: "offerLead 22m > remaining clinical window 4m" },
        { label: "Fallback chosen", value: "Urgent return to practice" },
      ],
      actions: [
        {
          actionId: "open-urgent-return-031",
          label: "Review return receipt",
          summary: "Keep the linked reopen workflow, urgency carry, and provenance visible in one shell.",
          tone: "critical",
          targetPath: "/hub/case/hub-case-031",
        },
        {
          actionId: "open-exception-031",
          label: "Open supervisor exception",
          summary: "Inspect the loop-prevention exception and confirm the next safe path.",
          tone: "watch",
          targetPath: "/hub/exceptions",
        },
      ],
      patientPreview: {
        title: "Patient preview",
        summary: "The hub could not safely complete this booking in time. The practice duty clinician has been asked to take over urgently.",
        rows: [
          { label: "Exposure", value: "Urgent reassessment / no slot promise" },
          { label: "Trigger", value: "Clinical window too short for safe hub completion" },
        ],
      },
      practicePreview: {
        title: "Practice preview",
        summary: "Urgent return linked with raised urgency carry and preserved no-slot rationale. Supervisor review required because repeated returns showed low novelty.",
        rows: [
          { label: "Urgency carry floor", value: "0.92" },
          { label: "Reopened workflow", value: "practice-task-031 / linked" },
        ],
      },
    },
    callbackTransferPendingState: null,
    returnToPracticeReceipt: {
      receiptId: "return-receipt-031",
      fallbackType: "urgent_return_to_practice",
      title: "HubReturnToPracticeReceipt",
      summary:
        "The practice-facing task has been reopened and linked back to the hub lineage. The shell keeps the original rationale and urgency carry visible until supervision settles.",
      receiptRows: [
        { label: "Return state", value: "Linked to duty clinician workflow" },
        { label: "Workflow ref", value: "practice-task-031" },
        { label: "Reopen lease", value: "REOPEN-031-2" },
        { label: "Urgency carry floor", value: "0.92 / breach and trust gap applied" },
      ],
      reopenLinkageSummary:
        "Return linkage is durable, but the hub case remains open because supervisor review still blocks quiet closure.",
    },
    urgentBounceBackBanner: {
      bannerId: "urgent-bounce-031",
      title: "HubUrgentBounceBackBanner",
      summary:
        "This case left ordinary coordination. The next safe action is duty-clinician return plus supervisor review, not another hub retry.",
      dueLabel: "Supervisor review due in 4m",
      actionLabel: "Open supervisor review",
    },
    recoveryDiffStrip: null,
    reopenProvenanceStub: {
      stubId: "reopen-prov-031",
      title: "Reopen history",
      summary:
        "The last hub-visible option set remains attached so the urgent bounce-back is anchored to real rejected choices, not a detached escalation label.",
      preservedRows: [
        { label: "Prior selected anchor", value: "opt-031-prior-window" },
        { label: "Bounce count", value: "4" },
        { label: "Novelty score", value: "0.18" },
      ],
      lawSummary:
        "Repeat low-novelty returns cannot silently re-enter ordinary hub flow; preserved context explains the escalation without reviving actionability.",
    },
    supervisorEscalationPanel: {
      panelId: "supervisor-031",
      title: "HubSupervisorEscalationPanel",
      summary:
        "Loop prevention threshold breached. The hub may not quietly resend or recirculate this case until a supervisor acknowledges the next safe disposition.",
      bounceCount: 4,
      noveltyScore: 0.18,
      noveltyThreshold: 0.35,
      actionRows: [
        { label: "Escalation state", value: "supervisor_review_required" },
        { label: "Exception ref", value: "exc-loop-031" },
        { label: "Current safe action", value: "Review urgent return and supervisor notes" },
      ],
    },
  },
  {
    caseId: "hub-case-041",
    visualMode: HUB_RECOVERY_VISUAL_MODE,
    mastheadTitle: "Reopen stays diff-first and anchor-preserving",
    mastheadSummary:
      "Supplier drift reopened the tuple. The shell keeps the drifted booking, the new candidate, and the reopen explanation together instead of swapping them silently.",
    fallbackType: "reopen_review",
    noSlotResolutionPanel: null,
    callbackTransferPendingState: null,
    returnToPracticeReceipt: null,
    urgentBounceBackBanner: null,
    recoveryDiffStrip: {
      diffId: "reopen-diff-041",
      title: "HubRecoveryDiffStrip",
      summary:
        "New capacity and new continuity evidence changed what is now possible. The prior case anchor stays pinned while the shell explains the delta first.",
      diffRows: [
        {
          label: "Manage status",
          previousValue: "Frozen / stale drift tuple",
          nextValue: "Reopen review with backup candidate visible",
          explanation: "Supplier mirror widened recovery, but did not restore calm booked posture.",
        },
        {
          label: "Trusted backup",
          previousValue: "None visible",
          nextValue: "Fri 14:10 North Shore Annex",
          explanation: "New trusted capacity exists, but only for reopen planning until law clears.",
        },
        {
          label: "Practice visibility",
          previousValue: "Ack generation 4 pending",
          nextValue: "Ack generation 5 reopened",
          explanation: "The drift changed what the origin practice must know.",
        },
      ],
    },
    reopenProvenanceStub: {
      stubId: "reopen-prov-041",
      title: "Reopen history",
      summary:
        "The current drifted booking and the newly visible backup candidate stay side by side so the operator can see exactly what changed.",
      preservedRows: [
        { label: "Pinned case anchor", value: "hub-case-041" },
        { label: "Drifted booking", value: "candidate-041-current / still current truth" },
        { label: "New backup", value: "candidate-041-backup / reopen planning only" },
      ],
      lawSummary:
        "Reopen may widen planning context, but it may not silently replace the active truth or lose the prior anchor.",
    },
    supervisorEscalationPanel: null,
  },
] as const;

const hubExceptions: readonly {
  row: Omit<HubExceptionRowDescriptor, "active">;
  detail: Omit<HubExceptionDetailDrawerDescriptor, "exceptionId" | "caseId" | "fallbackType">;
}[] = [
  {
    row: {
      exceptionId: "exc-callback-052",
      caseId: "hub-case-052",
      fallbackType: "callback_request",
      exceptionClass: "callback_transfer_blocked",
      severity: "critical",
      retryState: "retryable",
      escalationState: "none",
      title: "Callback transfer blocked",
      summary: "Expectation publication is still missing, so the callback path may not read as complete.",
      updatedAt: "Updated 2m ago",
      dueLabel: "Publish before 09:58",
    },
    detail: {
      title: "HubExceptionDetailDrawer",
      summary:
        "Callback linkage is incomplete. The shell keeps prior no-slot rationale attached and narrows the next action to callback publication.",
      blockerRows: [
        { label: "Callback case", value: "Missing durable callbackCaseRef" },
        { label: "Expectation envelope", value: "Current envelope not yet published" },
        { label: "Fallback state", value: "callback_transfer_pending" },
      ],
      evidenceRows: [
        { label: "Fallback ref", value: "HFB-052-1" },
        { label: "Source offer session", value: "offer-session-052 / read_only_provenance" },
      ],
      nextSafeActions: [
        "Publish the current callback expectation envelope.",
        "Keep callback copy explicit until the callback domain has taken over.",
        "Escalate stale-owner debt if linkage remains blocked.",
      ],
      escalationSummary: "No supervisor escalation is open yet, but stale-owner recovery remains active.",
      routePath: "/hub/case/hub-case-052",
    },
  },
  {
    row: {
      exceptionId: "exc-loop-031",
      caseId: "hub-case-031",
      fallbackType: "urgent_return_to_practice",
      exceptionClass: "loop_prevention",
      severity: "critical",
      retryState: "waiting_manual",
      escalationState: "supervisor_review_required",
      title: "Loop prevention threshold breached",
      summary: "Four low-novelty returns now require supervisor review instead of another quiet recirculation.",
      updatedAt: "Updated 3m ago",
      dueLabel: "Supervisor review due in 4m",
    },
    detail: {
      title: "HubExceptionDetailDrawer",
      summary:
        "This case has bounced too many times without meaningful novelty. The linked urgent return stays current while supervisor review owns the next safe action.",
      blockerRows: [
        { label: "Bounce count", value: "4" },
        { label: "Novelty score", value: "0.18 / threshold 0.35" },
        { label: "Return state", value: "reopen linked / supervisor review required" },
      ],
      evidenceRows: [
        { label: "Return record", value: "RTP-031-4" },
        { label: "Supervisor escalation", value: "SUP-031-1" },
      ],
      nextSafeActions: [
        "Review the urgent return receipt and provenance.",
        "Confirm whether new clinical context changes the downstream disposition.",
        "Record supervisor acknowledgement before any new recirculation.",
      ],
      escalationSummary: "Supervisor review is mandatory before ordinary retry posture can return.",
      routePath: "/hub/case/hub-case-031",
    },
  },
  {
    row: {
      exceptionId: "exc-drift-041",
      caseId: "hub-case-041",
      fallbackType: "reopen_review",
      exceptionClass: "backfill_ambiguity_supervision",
      severity: "watch",
      retryState: "waiting_manual",
      escalationState: "none",
      title: "Reopen ambiguity supervision",
      summary: "New capacity exists, but drift reconciliation still blocks any calmer posture.",
      updatedAt: "Updated 7m ago",
      dueLabel: "Review before manage refresh",
    },
    detail: {
      title: "HubExceptionDetailDrawer",
      summary:
        "The supplier mirror widened planning context, but the shell may not infer a calmer booked truth from ambiguous lineage.",
      blockerRows: [
        { label: "Current posture", value: "supplier_drift_review" },
        { label: "Manage freeze", value: "frozen until reopen review settles" },
        { label: "Ack generation", value: "Reopened to generation 5" },
      ],
      evidenceRows: [
        { label: "Mirror observation", value: "MIR-041-5" },
        { label: "Drift hook", value: "DRIFT-041-2" },
      ],
      nextSafeActions: [
        "Review the diff strip before using the new backup candidate.",
        "Keep the drifted booking as current truth until reopen law clears.",
      ],
      escalationSummary: "Manual review required, but no supervisor escalation is open.",
      routePath: "/hub/case/hub-case-041",
    },
  },
  {
    row: {
      exceptionId: "exc-ack-066",
      caseId: "hub-case-066",
      fallbackType: "reopen_review",
      exceptionClass: "practice_acknowledgement_overdue",
      severity: "watch",
      retryState: "retryable",
      escalationState: "none",
      title: "Practice acknowledgement overdue",
      summary: "Booked truth is current, but the latest practice visibility generation still blocks closure.",
      updatedAt: "Updated 19m ago",
      dueLabel: "Generation 4 overdue",
    },
    detail: {
      title: "HubExceptionDetailDrawer",
      summary:
        "Acknowledgement debt remains operational work, but it stays below urgent recovery and callback blockage in the exception queue.",
      blockerRows: [
        { label: "Ack generation", value: "4" },
        { label: "Delivery risk", value: "likely_failed" },
        { label: "Current posture", value: "booked_pending_practice_ack" },
      ],
      evidenceRows: [
        { label: "Ack record", value: "ACK-066-4" },
        { label: "Visibility delta", value: "PVD-066-4" },
      ],
      nextSafeActions: [
        "Chase acknowledgement through the current generation only.",
        "Keep closure blocked until acknowledgement or an audited exception lands.",
      ],
      escalationSummary: "No supervisor escalation is open.",
      routePath: "/hub/case/hub-case-066",
    },
  },
] as const;

const hubWorkbenchSeedByCaseId = new Map(hubCaseWorkbenchSeeds.map((seed) => [seed.caseId, seed]));
const hubRecoveryCaseById = new Map(hubRecoveryCases.map((seed) => [seed.caseId, seed]));
const hubExceptionRows = hubExceptions.map((exception) => exception.row);
const hubExceptionById = new Map(
  hubExceptions.map((exception) => [exception.row.exceptionId, exception]),
);
const defaultExceptionByCaseId = new Map(
  hubExceptions.map((exception) => [exception.row.caseId, exception.row.exceptionId]),
);

const hubCaseById = new Map(hubCases.map((hubCase) => [hubCase.caseId, hubCase]));
const hubOfferSessionToCaseId = new Map(
  hubCases.map((hubCase) => [hubCase.offerSessionId, hubCase.caseId]),
);
const savedViewById = new Map(hubSavedViews.map((savedView) => [savedView.savedViewId, savedView]));
const interruptionById = new Map(hubInterruptions.map((item) => [item.interruptionId, item]));

export const hubShellContractSeedRows: readonly HubShellContractRouteRow[] = [
  {
    routeId: "hub_queue",
    path: "/hub/queue",
    routeFamilyRef: "rf_hub_queue",
    viewMode: "queue",
    projectionRef: "HubConsoleConsistencyProjection",
    selectedAnchorPolicy: "preserve_saved_view_then_queue_row_then_case_anchor",
    dominantActionRule: "one start-of-day resume path only",
    statusRule: "shared strip owns freshness, ownership, visibility, and recovery posture",
  },
  {
    routeId: "hub_case",
    path: "/hub/case/:hubCoordinationCaseId",
    routeFamilyRef: "rf_hub_case_management",
    viewMode: "case",
    projectionRef: "HubCaseConsoleProjection",
    selectedAnchorPolicy: "preserve_case_anchor_across_same_shell_child_routes",
    dominantActionRule: "case host owns the current coordination prompt",
    statusRule:
      "shared strip remains authoritative; local host may add only route-specific actionability",
  },
  {
    routeId: "hub_alternatives",
    path: "/hub/alternatives/:offerSessionId",
    routeFamilyRef: "rf_hub_case_management",
    viewMode: "alternatives",
    projectionRef: "AlternativeOfferSession",
    selectedAnchorPolicy: "preserve_offer_session_origin_case_anchor",
    dominantActionRule: "alternatives stay bounded to the active case shell",
    statusRule: "summary-first child route; no second shell or detached review page",
  },
  {
    routeId: "hub_exceptions",
    path: "/hub/exceptions",
    routeFamilyRef: "rf_hub_queue",
    viewMode: "exceptions",
    projectionRef: "HubCoordinationException",
    selectedAnchorPolicy: "preserve_current_recovery_case_anchor",
    dominantActionRule: "exception host may dominate only when recovery is required",
    statusRule: "shared strip owns shell posture; exception lane remains bounded and explicit",
  },
  {
    routeId: "hub_audit",
    path: "/hub/audit/:hubCoordinationCaseId",
    routeFamilyRef: "rf_hub_case_management",
    viewMode: "audit",
    projectionRef: "HubContinuityEvidenceProjection",
    selectedAnchorPolicy: "preserve_current_case_anchor_and_saved_view",
    dominantActionRule: "audit stays read-only and same-shell",
    statusRule: "shared strip remains visible; audit host does not mint writable posture",
  },
] as const;

export const hubShellStateMatrixRows: readonly HubShellStateMatrixRow[] = [
  {
    rowId: "queue_resume_today",
    path: "/hub/queue",
    savedViewId: "resume_today",
    shellPosture: "shell_live",
    layoutMode: "two_plane",
    dominantRegion: "HubStartOfDayResumeCard",
    secondaryRegion: "HubInterruptionDigestPanel",
    readOnlyReason: "",
  },
  {
    rowId: "queue_ack_watch",
    path: "/hub/queue",
    savedViewId: "ack_watch",
    shellPosture: "shell_live",
    layoutMode: "two_plane",
    dominantRegion: "HubStartOfDayResumeCard",
    secondaryRegion: "HubInterruptionDigestPanel",
    readOnlyReason: "",
  },
  {
    rowId: "queue_callback_recovery",
    path: "/hub/queue",
    savedViewId: "callback_recovery",
    shellPosture: "shell_recovery_only",
    layoutMode: "two_plane",
    dominantRegion: "HubStartOfDayResumeCard",
    secondaryRegion: "HubInterruptionDigestPanel",
    readOnlyReason: "Recovery only until callback publication and ownership debt settle",
  },
  {
    rowId: "case_live",
    path: "/hub/case/:hubCoordinationCaseId",
    savedViewId: "resume_today",
    shellPosture: "shell_live",
    layoutMode: "three_panel",
    dominantRegion: "HubCaseStageHost",
    secondaryRegion: "HubInterruptionDigestPanel",
    readOnlyReason: "",
  },
  {
    rowId: "case_observe_only",
    path: "/hub/case/:hubCoordinationCaseId",
    savedViewId: "observe_only",
    shellPosture: "shell_read_only",
    layoutMode: "three_panel",
    dominantRegion: "HubCaseStageHost",
    secondaryRegion: "HubInterruptionDigestPanel",
    readOnlyReason: "Another coordinator owns mutation; shell remains readable but not writable",
  },
  {
    rowId: "exceptions_recovery",
    path: "/hub/exceptions",
    savedViewId: "supplier_drift",
    shellPosture: "shell_recovery_only",
    layoutMode: "three_panel",
    dominantRegion: "HubCaseStageHost",
    secondaryRegion: "HubInterruptionDigestPanel",
    readOnlyReason: "Recovery review remains explicit and same-shell",
  },
  {
    rowId: "audit_read_only",
    path: "/hub/audit/:hubCoordinationCaseId",
    savedViewId: "ack_watch",
    shellPosture: "shell_read_only",
    layoutMode: "three_panel",
    dominantRegion: "HubCaseStageHost",
    secondaryRegion: "HubInterruptionDigestPanel",
    readOnlyReason: "Audit host is read-only by design",
  },
] as const;

function normalizeHubPath(pathname: string): string {
  const trimmed = pathname.trim();
  if (!trimmed.startsWith("/hub")) {
    return HUB_DEFAULT_PATH;
  }
  return trimmed.length > 1 ? trimmed.replace(/\/+$/, "") || "/" : trimmed;
}

export function parseHubPath(pathname: string): HubLocation {
  const normalized = normalizeHubPath(pathname);

  if (normalized === "/hub/queue") {
    return {
      pathname: normalized,
      routeFamilyRef: "rf_hub_queue",
      viewMode: "queue",
      hubCoordinationCaseId: null,
      offerSessionId: null,
    };
  }

  if (normalized === "/hub/exceptions") {
    return {
      pathname: normalized,
      routeFamilyRef: "rf_hub_queue",
      viewMode: "exceptions",
      hubCoordinationCaseId: null,
      offerSessionId: null,
    };
  }

  const caseMatch = normalized.match(/^\/hub\/case\/([^/]+)$/);
  if (caseMatch?.[1]) {
    return {
      pathname: normalized,
      routeFamilyRef: "rf_hub_case_management",
      viewMode: "case",
      hubCoordinationCaseId: caseMatch[1],
      offerSessionId: null,
    };
  }

  const alternativesMatch = normalized.match(/^\/hub\/alternatives\/([^/]+)$/);
  if (alternativesMatch?.[1]) {
    return {
      pathname: normalized,
      routeFamilyRef: "rf_hub_case_management",
      viewMode: "alternatives",
      hubCoordinationCaseId: hubOfferSessionToCaseId.get(alternativesMatch[1]) ?? null,
      offerSessionId: alternativesMatch[1],
    };
  }

  const auditMatch = normalized.match(/^\/hub\/audit\/([^/]+)$/);
  if (auditMatch?.[1]) {
    return {
      pathname: normalized,
      routeFamilyRef: "rf_hub_case_management",
      viewMode: "audit",
      hubCoordinationCaseId: auditMatch[1],
      offerSessionId: null,
    };
  }

  return parseHubPath(HUB_DEFAULT_PATH);
}

function savedViewForId(savedViewId: HubSavedViewId | null | undefined): HubSavedView | undefined {
  return savedViewId ? savedViewById.get(savedViewId) : undefined;
}

function caseForId(caseId: string | null | undefined): HubCoordinationCase | undefined {
  return caseId ? hubCaseById.get(caseId) : undefined;
}

function interruptionForId(interruptionId: string): HubInterruptionDigestItem | undefined {
  return interruptionById.get(interruptionId);
}

function exceptionForId(
  exceptionId: string | null | undefined,
):
  | (typeof hubExceptions)[number]
  | undefined {
  return exceptionId ? hubExceptionById.get(exceptionId) : undefined;
}

function clampQueueFilterId(
  filterId: HubQueueFilterId | string | null | undefined,
): HubQueueFilterId {
  switch (filterId) {
    case "critical":
    case "same_day":
    case "degraded":
    case "callback":
      return filterId;
    default:
      return "all";
  }
}

function clampQueueChangeState(
  queueChangeState: HubQueueChangeState | string | null | undefined,
): HubQueueChangeState {
  switch (queueChangeState) {
    case "buffered":
    case "applied":
      return queueChangeState;
    default:
      return "idle";
  }
}

function workbenchSeedForCase(caseId: string | null | undefined): HubCaseWorkbenchSeed | undefined {
  return caseId ? hubWorkbenchSeedByCaseId.get(caseId) : undefined;
}

function recoveryCaseForId(
  caseId: string | null | undefined,
): HubRecoveryCaseProjectionDescriptor | undefined {
  return caseId ? hubRecoveryCaseById.get(caseId) : undefined;
}

function defaultOptionCardIdForCase(caseId: string | null | undefined): string {
  const seed = workbenchSeedForCase(caseId);
  return seed?.baseOptionOrder[0] ?? `option::${caseId ?? "hub-case-104"}`;
}

function defaultExceptionIdForCase(caseId: string | null | undefined): string {
  return defaultExceptionByCaseId.get(caseId ?? "") ?? hubExceptionRows[0]?.exceptionId ?? "exc-callback-052";
}

function defaultSavedViewForLocation(
  location: HubLocation,
  preferredSavedViewId?: string | null,
): HubSavedView {
  const preferred = savedViewForId(preferredSavedViewId as HubSavedViewId);
  if (preferred) {
    return preferred;
  }
  if (
    location.viewMode === "case" ||
    location.viewMode === "alternatives" ||
    location.viewMode === "audit"
  ) {
    const locatedCase = caseForId(location.hubCoordinationCaseId);
    const routeDefault = savedViewForId(locatedCase?.savedViewIds[0]);
    if (routeDefault) {
      return routeDefault;
    }
  }
  return savedViewById.get("resume_today")!;
}

function defaultCaseForLocation(
  location: HubLocation,
  savedView: HubSavedView,
  preferredCaseId?: string | null,
): HubCoordinationCase {
  const fromPath =
    caseForId(location.hubCoordinationCaseId) ??
    caseForId(
      location.offerSessionId
        ? (hubOfferSessionToCaseId.get(location.offerSessionId) ?? null)
        : null,
    );
  if (fromPath) {
    return fromPath;
  }

  const preferred = caseForId(preferredCaseId);
  if (preferred) {
    return preferred;
  }

  return caseForId(savedView.defaultCaseId) ?? hubCases[0]!;
}

function runtimeScenarioForState(
  location: HubLocation,
  savedView: HubSavedView,
  currentCase: HubCoordinationCase,
): RuntimeScenario {
  if (
    savedView.posture === "recovery_required" ||
    currentCase.ownershipState === "takeover_required"
  ) {
    return "recovery_only";
  }
  if (
    savedView.posture === "read_only" ||
    currentCase.ownershipState === "observe_only" ||
    location.viewMode === "audit"
  ) {
    return "read_only";
  }
  return "live";
}

function anchorKeyForLocation(location: HubLocation): string {
  switch (location.viewMode) {
    case "queue":
      return "hub-start-of-day";
    case "exceptions":
      return "hub-exception-row";
    default:
      return "hub-case-anchor";
  }
}

function continuitySnapshotForLocation(
  location: HubLocation,
  runtimeScenario: RuntimeScenario,
): ContinuitySnapshot {
  return createInitialContinuitySnapshot({
    shellSlug: HUB_SHELL_SLUG,
    routeFamilyRef: location.routeFamilyRef,
    anchorKey: anchorKeyForLocation(location),
    runtimeScenario,
  });
}

function nextContinuitySnapshot(
  snapshot: ContinuitySnapshot,
  location: HubLocation,
  runtimeScenario: RuntimeScenario,
): ContinuitySnapshot {
  const anchorKey = anchorKeyForLocation(location);
  let nextSnapshot = snapshot;
  if (snapshot.activeRouteFamilyRef !== location.routeFamilyRef) {
    nextSnapshot = navigateWithinShell(snapshot, location.routeFamilyRef, {
      runtimeScenario,
    }).snapshot;
  }
  if (nextSnapshot.selectedAnchor.anchorKey !== anchorKey) {
    nextSnapshot = selectAnchorInSnapshot(nextSnapshot, anchorKey);
  }
  return {
    ...nextSnapshot,
    runtimeScenario,
  };
}

export function createHubTelemetryEnvelope(
  routeFamilyRef: HubRouteFamilyRef,
  eventClass: UiTelemetryEventClass,
  payload: Record<string, string | number | boolean | null>,
): UiTelemetryEnvelopeExample {
  const normalizedPayload = Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [key, String(value ?? "")]),
  );
  return createUiTelemetryEnvelope({
    scenarioId: HUB_TELEMETRY_SCENARIO_ID,
    routeFamilyRef,
    sourceSurface: HUB_SOURCE_SURFACE,
    eventClass,
    payload: normalizedPayload,
  });
}

function appendTelemetry(
  state: HubShellState,
  eventClass: UiTelemetryEventClass,
  payload: Record<string, string | number | boolean | null>,
): readonly UiTelemetryEnvelopeExample[] {
  return [
    ...state.telemetry,
    createHubTelemetryEnvelope(state.location.routeFamilyRef, eventClass, payload),
  ];
}

function buildQueueRows(
  savedView: HubSavedView,
  selectedCaseId: string,
): readonly HubQueueEntryStripRow[] {
  const orderedCaseIds =
    hubSavedViewQueueOrders[savedView.savedViewId]?.base ?? savedView.queueCaseIds;
  return orderedCaseIds
    .map((caseId) => caseForId(caseId))
    .filter((hubCase): hubCase is HubCoordinationCase => Boolean(hubCase))
    .map((hubCase) => ({
      caseId: hubCase.caseId,
      patientLabel: hubCase.patientLabel,
      queueLabel: hubCase.queueLabel,
      queueSummary: hubCase.queueSummary,
      metaLine: `${hubCase.priorityBand} • ${hubCase.freshestEvidenceLabel}`,
      selected: hubCase.caseId === selectedCaseId,
      routePath: `/hub/case/${hubCase.caseId}`,
      ownershipState: hubCase.ownershipState,
      ownershipLabel: hubCase.ownershipLabel,
    }));
}

function queueOrderForSavedView(
  savedViewId: HubSavedViewId,
  queueChangeState: HubQueueChangeState,
): readonly string[] {
  const order = hubSavedViewQueueOrders[savedViewId];
  if (!order) {
    return (
      hubSavedViews.find((savedView) => savedView.savedViewId === savedViewId)?.queueCaseIds ?? []
    );
  }
  return queueChangeState === "applied" ? order.delta : order.base;
}

function rowMatchesFilter(
  filterId: HubQueueFilterId,
  hubCase: HubCoordinationCase,
  seed: HubCaseWorkbenchSeed | undefined,
): boolean {
  switch (filterId) {
    case "critical":
      return seed?.riskBand === "critical";
    case "same_day":
      return hubCase.priorityBand === "Same day" || hubCase.priorityBand === "Urgent today";
    case "degraded":
      return (
        seed?.optionCards.some((card) => card.sourceTrustState !== "trusted") === true ||
        seed?.escalationBanner?.bannerType === "supplier_drift"
      );
    case "callback":
      return Boolean(seed?.callbackFallbackCard);
    default:
      return true;
  }
}

function buildQueueWorkbenchRows(
  savedView: HubSavedView,
  selectedCaseId: string,
  selectedFilterId: HubQueueFilterId,
  queueChangeState: HubQueueChangeState,
): readonly HubQueueWorkbenchRow[] {
  const baseOrder = hubSavedViewQueueOrders[savedView.savedViewId]?.base ?? savedView.queueCaseIds;
  const targetOrder = hubSavedViewQueueOrders[savedView.savedViewId]?.delta ?? baseOrder;

  return queueOrderForSavedView(savedView.savedViewId, queueChangeState)
    .map((caseId) => caseForId(caseId))
    .filter((hubCase): hubCase is HubCoordinationCase => Boolean(hubCase))
    .filter((hubCase) =>
      rowMatchesFilter(selectedFilterId, hubCase, workbenchSeedForCase(hubCase.caseId)),
    )
    .map((hubCase) => {
      const seed = workbenchSeedForCase(hubCase.caseId);
      const baseIndex = baseOrder.indexOf(hubCase.caseId);
      const targetIndex = targetOrder.indexOf(hubCase.caseId);
      return {
        caseId: hubCase.caseId,
        patientLabel: hubCase.patientLabel,
        queueLabel: hubCase.queueLabel,
        queueSummary: hubCase.queueSummary,
        riskBand: seed?.riskBand ?? "watch",
        breachProbability: seed?.breachProbability ?? 0.5,
        breachSummary: seed?.breachSummary ?? hubCase.currentCheckpointLabel,
        priorityBand: hubCase.priorityBand,
        timerLabel: seed?.timerLabel ?? hubCase.currentCheckpointLabel,
        trustSummary:
          seed?.optionCards[0]?.sourceTrustSummary ??
          "Trusted projection / no extra trust warning published",
        ownershipState: hubCase.ownershipState,
        ownershipLabel: hubCase.ownershipLabel,
        freshnessLabel: hubCase.freshestEvidenceLabel,
        dominantActionLabel: hubCase.dominantActionLabel,
        selected: hubCase.caseId === selectedCaseId,
        deltaBuffered: queueChangeState === "buffered" && baseIndex !== targetIndex,
        routePath: `/hub/case/${hubCase.caseId}`,
      };
    });
}

function buildQueueRiskSummary(
  rows: readonly HubQueueWorkbenchRow[],
): readonly HubQueueRiskSummaryItem[] {
  const counts = new Map<HubRiskBand, number>([
    ["critical", 0],
    ["watch", 0],
    ["ready", 0],
  ]);
  for (const row of rows) {
    counts.set(row.riskBand, (counts.get(row.riskBand) ?? 0) + 1);
  }
  return [
    {
      riskBand: "critical",
      label: "Critical now",
      shortLabel: "Critical",
      count: counts.get("critical") ?? 0,
      summary: "Immediate window or recovery risk. These rows stay ahead of fairness merge.",
    },
    {
      riskBand: "watch",
      label: "Watch closely",
      shortLabel: "Watch",
      count: counts.get("watch") ?? 0,
    summary: "Operationally risky but not yet in imminent breach or takeover-required status.",
    },
    {
      riskBand: "ready",
      label: "Stable queue",
      shortLabel: "Stable",
      count: counts.get("ready") ?? 0,
      summary: "Safe to work through in authoritative order without extra escalation.",
    },
  ];
}

function buildQueueChangeBatch(
  state: HubShellState,
  savedView: HubSavedView,
  currentCase: HubCoordinationCase,
): HubQueueChangeBatchDescriptor | null {
  if (state.queueChangeState === "idle") {
    return null;
  }
  const order = hubSavedViewQueueOrders[savedView.savedViewId];
  const selectedOptionCardId = workbenchSeedForCase(currentCase.caseId)?.baseOptionOrder.includes(
    state.selectedOptionCardId,
  )
    ? state.selectedOptionCardId
    : defaultOptionCardIdForCase(currentCase.caseId);

  return {
    batchId: `queue-batch::${savedView.savedViewId}`,
    state: state.queueChangeState,
    sourceRankSnapshotRef: `${order?.base.join("|") ?? savedView.queueCaseIds.join("|")}::base`,
    targetRankSnapshotRef: `${order?.delta.join("|") ?? savedView.queueCaseIds.join("|")}::delta`,
    preservedAnchorCaseId: currentCase.caseId,
    preservedOptionCardId: selectedOptionCardId,
    summary:
      state.queueChangeState === "buffered"
        ? "One authoritative queue delta is buffered. The active case and selected option stay pinned until you apply it."
        : "The buffered queue delta has been applied without stealing the active case or selected option.",
    actionLabel:
      state.queueChangeState === "buffered" ? "Apply queued delta" : "Applied authoritatively",
    followUpLabel:
      state.queueChangeState === "buffered"
        ? "The browser may not locally rerank rows before the queued delta is applied."
        : "The row order changed under the same selected-anchor contract.",
  };
}

function buildQueueWorkbenchProjection(
  state: HubShellState,
  savedView: HubSavedView,
  currentCase: HubCoordinationCase,
): HubQueueWorkbenchProjectionDescriptor {
  const rows = buildQueueWorkbenchRows(
    savedView,
    currentCase.caseId,
    state.selectedQueueFilterId,
    state.queueChangeState,
  );
  return {
    projectionId: `hub-workbench::${savedView.savedViewId}`,
    selectedCaseRef: currentCase.caseId,
    selectedCaseSummary: `${currentCase.patientLabel} remains the pinned selected row while live queue deltas buffer through QueueChangeBatch.`,
    selectedFilterId: state.selectedQueueFilterId,
    visibleRows: rows,
    savedViewSummary: savedView.summary,
    riskSummary: buildQueueRiskSummary(rows),
    fairnessMergeState:
      hubSavedViewQueueOrders[savedView.savedViewId]?.fairnessMergeState ??
      "Authoritative order remains fixed by the queue engine.",
    queueChangeBatch: buildQueueChangeBatch(state, savedView, currentCase),
    continuityKey: `hub.queue::${savedView.savedViewId}::${currentCase.caseId}`,
    toolbarSummary: `${rows.length} rows in view / ${savedView.queueLabel}`,
  };
}

function buildOptionCardsForCase(
  currentCase: HubCoordinationCase,
  selectedOptionCardId: string,
  queueChangeState: HubQueueChangeState,
): readonly HubOptionCardProjectionDescriptor[] {
  const seed = workbenchSeedForCase(currentCase.caseId);
  if (!seed) {
    return [];
  }

  const orderedIds = queueChangeState === "applied" ? seed.deltaOptionOrder : seed.baseOptionOrder;
  const cardsById = new Map(seed.optionCards.map((card) => [card.optionCardId, card]));
  const effectiveSelectedId = orderedIds.includes(selectedOptionCardId)
    ? selectedOptionCardId
    : orderedIds[0];

  return orderedIds
    .map((optionCardId) => cardsById.get(optionCardId))
    .filter((card): card is Omit<HubOptionCardProjectionDescriptor, "selectedState"> =>
      Boolean(card),
    )
    .map((card, index) => ({
      ...card,
      rankOrdinal: index + 1,
      selectedState: card.optionCardId === effectiveSelectedId,
    }));
}

function buildOptionCardGroups(
  cards: readonly HubOptionCardProjectionDescriptor[],
): readonly HubOptionCardGroupDescriptor[] {
  const windowClassLabels: Record<HubWindowClass, [string, string]> = {
    2: [
      "Clinically preferred now",
      "Preferred-window candidates stay above approved variance and review-only reasoning.",
    ],
    1: [
      "Approved variance",
      "Visible because policy allows variance disclosure, not because they outrank preferred-window supply.",
    ],
    0: [
      "Review only",
      "Keep these visible for explanation or recovery reasoning only. They are not live ranked offers.",
    ],
  };

  return ([2, 1, 0] as const).flatMap((windowClass) => {
    const groupedCards = cards.filter((card) => card.windowClass === windowClass);
    if (groupedCards.length === 0) {
      return [];
    }
    const [label, summary] = windowClassLabels[windowClass];
    return [
      {
        groupId: `window-class-${windowClass}`,
        windowClass,
        label,
        summary,
        cards: groupedCards,
      },
    ];
  });
}

function resolveSelectedOptionCard(
  currentCase: HubCoordinationCase,
  selectedOptionCardId: string,
  queueChangeState: HubQueueChangeState,
): HubOptionCardProjectionDescriptor {
  const cards = buildOptionCardsForCase(currentCase, selectedOptionCardId, queueChangeState);
  return (
    cards.find((card) => card.selectedState) ??
    cards[0] ?? {
      optionCardId: defaultOptionCardIdForCase(currentCase.caseId),
      candidateRef: `candidate::${currentCase.caseId}`,
      rankOrdinal: 1,
      windowClass: 2,
      title: currentCase.patientLabel,
      siteLabel: currentCase.originPractice,
      modalityLabel: "Unknown",
      startLabel: "Unknown",
      secondaryLine: currentCase.queueSummary,
      travelMinutes: 0,
      waitMinutes: 0,
      manageCapability: "Unavailable",
      sourceTrustState: "trusted",
      sourceTrustSummary: currentCase.continuitySummary,
      freshnessBand: "fresh",
      freshnessSummary: currentCase.freshestEvidenceLabel,
      reservationTruthState: "no_hold",
      reservationTruthSummary: "No current slot truth is available",
      offerabilityState: "diagnostic_only",
      dominantActionLabel: currentCase.dominantActionLabel,
      dominantActionSummary: currentCase.dominantActionSummary,
      approvedVarianceVisible: false,
      rankProofRef: "RANK-FALLBACK",
      rankExplanationRef: "RANK-FALLBACK",
      rankReasonRefs: [],
      rankReasons: [],
      patientReasonCueRefs: [],
      comparisonLabel: "Fallback",
      selectedState: true,
      staleAt: "stale at unknown",
    }
  );
}

function buildBestFitNowStrip(
  currentCase: HubCoordinationCase,
  selectedOptionCard: HubOptionCardProjectionDescriptor,
): HubBestFitNowStripDescriptor {
  return {
    title: "Best fit now",
    summary: selectedOptionCard.dominantActionSummary,
    optionCardId: selectedOptionCard.optionCardId,
    facts: [
      { label: "Selected candidate", value: selectedOptionCard.title },
      {
        label: "Trust and freshness",
        value: `${selectedOptionCard.sourceTrustSummary} / ${selectedOptionCard.freshnessSummary}`,
      },
      { label: "Checkpoint", value: currentCase.currentCheckpointLabel },
    ],
  };
}

function buildDecisionDockHost(
  location: HubLocation,
  currentCase: HubCoordinationCase,
  runtimeScenario: RuntimeScenario,
  selectedOptionCard: HubOptionCardProjectionDescriptor,
  queueChangeBatch: HubQueueChangeBatchDescriptor | null,
): HubDecisionDockHostDescriptor {
  const routeDominantActionPath =
    location.viewMode === "queue"
      ? `/hub/case/${currentCase.caseId}`
      : currentCase.workState === "callback_transfer_pending"
        ? "/hub/exceptions"
        : `/hub/alternatives/${currentCase.offerSessionId}`;

  return {
    title: "Next action",
    summary:
      queueChangeBatch?.summary ??
      "Keep one dominant action and one consequence preview visible while queue order and rank proof stay authoritative.",
    posture:
      runtimeScenario === "live"
        ? "Writable if trust and ownership remain current"
        : runtimeScenario === "read_only"
          ? "Read-only / review only"
          : "Recovery only / dominant action narrowed",
    dominantActionLabel:
      location.viewMode === "queue"
        ? currentCase.dominantActionLabel
        : selectedOptionCard.dominantActionLabel,
    dominantActionPath: routeDominantActionPath,
    dominantActionSummary:
      location.viewMode === "queue"
        ? currentCase.dominantActionSummary
        : selectedOptionCard.dominantActionSummary,
    consequenceItems: [
      `Reservation truth: ${selectedOptionCard.reservationTruthSummary}`,
      `Trust and freshness: ${selectedOptionCard.sourceTrustSummary}; ${selectedOptionCard.freshnessSummary}.`,
      `Practice and continuity: ${currentCase.visibilitySummary}`,
    ],
    supportingFacts: [
      { label: "Selected case", value: currentCase.patientLabel },
      { label: "Selected option", value: selectedOptionCard.title },
      { label: "Comparison status", value: selectedOptionCard.comparisonLabel },
      { label: "Queue checkpoint", value: currentCase.currentCheckpointLabel },
    ],
  };
}

function buildInterruptions(savedView: HubSavedView): readonly HubInterruptionDigestItem[] {
  return savedView.interruptionIds
    .map((interruptionId) => interruptionForId(interruptionId))
    .filter((item): item is HubInterruptionDigestItem => Boolean(item))
    .slice(0, 4);
}

function statusSignalsForSnapshot(
  savedView: HubSavedView,
  currentCase: HubCoordinationCase,
  runtimeScenario: RuntimeScenario,
): readonly HubStatusAuthoritySignal[] {
  const shellPostureSignal: HubStatusAuthoritySignal =
    runtimeScenario === "read_only"
      ? {
          signalId: "shell-posture",
          label: "Workspace status",
          value: "Observe only",
          summary:
            "Another coordinator owns changes. The workspace stays readable while write actions are unavailable.",
          tone: "watch",
        }
      : runtimeScenario === "recovery_only"
        ? {
            signalId: "shell-posture",
            label: "Workspace status",
            value: "Recovery required",
            summary:
              "The same case stays open, but the next action is limited to recovery or supervision.",
            tone: "critical",
          }
        : {
            signalId: "shell-posture",
            label: "Workspace status",
            value: "Live coordination",
            summary:
              "The current case, acting context, and route all currently support write actions.",
            tone: "ready",
          };

  return [
    {
      signalId: "freshness",
      label: "Freshness",
      value: currentCase.freshestEvidenceLabel,
      summary: savedView.statusSummary,
      tone: runtimeScenario === "live" ? "ready" : "watch",
    },
    {
      signalId: "ownership",
      label: "Ownership",
      value: currentCase.ownershipLabel,
      summary: savedView.ownershipSummary,
      tone:
        currentCase.ownershipState === "claimed_active"
          ? "ready"
          : currentCase.ownershipState === "transfer_pending"
            ? "watch"
            : "critical",
    },
    {
      signalId: "visibility",
      label: "Practice visibility",
      value: currentCase.visibilitySummary,
      summary: currentCase.continuitySummary,
      tone:
        currentCase.workState === "booked_pending_practice_ack" ||
        currentCase.workState === "supplier_drift_review"
          ? "watch"
          : "neutral",
    },
    shellPostureSignal,
  ];
}

function summarySentenceForSnapshot(
  location: HubLocation,
  savedView: HubSavedView,
  currentCase: HubCoordinationCase,
): string {
  if (location.viewMode === "queue") {
    return savedView.dominantActionSummary;
  }
  if (location.viewMode === "exceptions") {
    return "Exceptions remain inside the hub shell so stale ownership, callback blockage, and supplier drift stay attached to the live case.";
  }
  if (location.viewMode === "audit") {
    return "Audit review stays in the same shell and preserves the active case anchor instead of reconstructing a detached proof page.";
  }
  if (location.viewMode === "alternatives") {
    return "Alternative review remains bounded to the same case shell, even before the richer patient-choice surfaces arrive in 328.";
  }
  return currentCase.caseStageSummary;
}

function buildResumeCard(
  savedView: HubSavedView,
  currentCase: HubCoordinationCase,
): HubStartOfDayResumeCardDescriptor {
  return {
    title: savedView.startOfDayTitle,
    summary: currentCase.startOfDaySummary,
    dominantActionLabel: savedView.dominantActionLabel,
    dominantActionPath: savedView.dominantActionPath,
    dominantActionSummary: savedView.dominantActionSummary,
    supportingFacts: [
      { label: "Queue", value: savedView.queueLabel },
      { label: "Current case", value: currentCase.patientLabel },
      { label: "Checkpoint", value: currentCase.currentCheckpointLabel },
      { label: "Origin practice", value: currentCase.originPractice },
    ],
  };
}

function buildCaseStageHost(
  location: HubLocation,
  currentCase: HubCoordinationCase,
): HubCaseStageHostDescriptor {
  if (location.viewMode === "alternatives") {
    return {
      title: "Alternative session host",
      summary:
        "327 and 328 mount richer queue and patient-choice surfaces here later, but the shell already keeps the current case, return path, and read-only boundaries stable.",
      hostMode: "alternatives_host",
      primaryPrompt: currentCase.stageQuestion,
      secondaryPrompt:
        "Return always lands back in the active case shell with the same saved view and case anchor, not a detached review screen.",
      highlights: [
        "Offer-session review remains same-shell and preserves the case anchor.",
        "Callback remains a governed fallback path, not another slot row.",
        "The right rail can add richer proofs later without rebuilding shell chrome.",
      ],
      primaryActionLabel: "Return to case stage",
      primaryActionPath: `/hub/case/${currentCase.caseId}`,
    };
  }

  if (location.viewMode === "exceptions") {
    return {
      title: "Exception and recovery host",
      summary:
        "Typed exception review now stays inside the same shell with a bounded list, detail drawer, and preserved case anchor.",
      hostMode: "exceptions_host",
      primaryPrompt:
        "Recovery-required cases stay in one hub shell family so blockers remain causally honest and navigable from the queue strip.",
      secondaryPrompt:
        "The start-of-day shell keeps the interruption digest bounded instead of multiplying status banners or detached recovery pages.",
      highlights: [
        "Read-only and recovery-only postures stay explicit in shell chrome.",
        "Current dominant action remains singular even when several blockers are visible.",
        "Exception review remains routed through the same saved-view and queue context.",
      ],
      primaryActionLabel: "Open current recovery case",
      primaryActionPath: `/hub/case/${currentCase.caseId}`,
    };
  }

  if (location.viewMode === "audit") {
    return {
      title: "Audit and proof host",
      summary:
        "329 later owns deeper cross-org confirmation proof, but the shell already keeps audit review read-only and causally attached to the active case.",
      hostMode: "audit_host",
      primaryPrompt: currentCase.auditSummary,
      secondaryPrompt:
        "Audit never becomes a detached application. The saved view, queue row, and case anchor stay preserved through return and refresh.",
      highlights: [
        "Audit host remains summary-first and read-only.",
        "Shared status strip stays visible above the proof host.",
        "Return path always resolves to the current case shell route.",
      ],
      primaryActionLabel: "Return to case stage",
      primaryActionPath: `/hub/case/${currentCase.caseId}`,
    };
  }

  if (location.viewMode === "queue") {
    return {
      title: "Case stage host",
      summary:
        "Queue, commit, reminder, and recovery surfaces mount here without rebuilding shell chrome or dropping the current case anchor.",
      hostMode: "queue_placeholder",
      primaryPrompt: currentCase.caseStageSummary,
      secondaryPrompt:
        "The current saved view, queue row, and active case anchor are already stable enough that deeper child routes can layer in later.",
      highlights: currentCase.caseStageHighlights,
      primaryActionLabel: "Open current case stage",
      primaryActionPath: `/hub/case/${currentCase.caseId}`,
    };
  }

  return {
    title: "Current case stage",
    summary:
      "The centre host keeps ranked choices, recovery status, and downstream proof inside one stable workspace.",
    hostMode: "case_host",
    primaryPrompt: currentCase.stageQuestion,
    secondaryPrompt: currentCase.caseStageSummary,
    highlights: currentCase.caseStageHighlights,
    primaryActionLabel:
      location.viewMode === "case" ? "Open alternatives" : "Return to active case",
    primaryActionPath:
      location.viewMode === "case"
        ? `/hub/alternatives/${currentCase.offerSessionId}`
        : `/hub/case/${currentCase.caseId}`,
  };
}

function buildRightRailHost(
  currentCase: HubCoordinationCase,
  runtimeScenario: RuntimeScenario,
): HubRightRailHostDescriptor {
  return {
    title: "Right-rail host",
    summary:
      "Proof drawers, continuity evidence, and action previews stay bounded here when the route still needs a supporting rail.",
    items: [
      { label: "Current case", value: currentCase.patientLabel },
      {
        label: "Route status",
        value:
          runtimeScenario === "live"
            ? "Writable"
            : runtimeScenario === "read_only"
              ? "Read-only"
              : "Recovery only",
      },
      { label: "Visibility", value: currentCase.visibilitySummary },
      { label: "Continuity", value: currentCase.continuitySummary },
    ],
  };
}

function scopeLabelForSelection(
  organisationId: HubActingOrganisationId,
  siteId: HubActingSiteId,
  purposeId: HubPurposeOfUseId,
): string {
  return `${hubOrganisationConfigs[organisationId].label} / ${hubSiteConfigs[siteId].label} / ${hubPurposeConfigs[purposeId].label}`;
}

function deriveBreakGlassState(
  state: HubShellState,
  organisationId: HubActingOrganisationId,
  siteId: HubActingSiteId,
): HubBreakGlassState {
  if (state.breakGlassBaseState === "active" && organisationId === "north_shore_hub") {
    return siteId === "north_shore_escalation_room" ? "expiring" : "active";
  }
  return state.breakGlassBaseState;
}

function deriveActingContextAccessState(
  state: HubShellState,
  currentCase: HubCoordinationCase,
  runtimeScenario: RuntimeScenario,
  organisationId: HubActingOrganisationId,
  purposeId: HubPurposeOfUseId,
  breakGlassState: HubBreakGlassState,
): {
  accessPosture: HubAccessPosture;
  contextState: HubActingContextState;
  visibilityEnvelopeState: HubVisibilityEnvelopeState;
  driftClass: HubScopeDriftClass | null;
  deniedSummary: string | null;
} {
  if (organisationId === "south_vale_network") {
    return {
      accessPosture: "denied",
      contextState: "blocked",
      visibilityEnvelopeState: "blocked",
      driftClass: "organisation_switch",
      deniedSummary: "No approved organisation membership exists for the current hub tuple.",
    };
  }

  if (breakGlassState === "revoked") {
    return {
      accessPosture: "denied",
      contextState: "blocked",
      visibilityEnvelopeState: "blocked",
      driftClass: "break_glass_revocation",
      deniedSummary: "Break-glass was revoked, so the current writable shell is blocked in place.",
    };
  }

  if (state.location.viewMode === "exceptions" && organisationId !== "north_shore_hub") {
    return {
      accessPosture: "denied",
      contextState: "blocked",
      visibilityEnvelopeState: "blocked",
      driftClass: "organisation_switch",
      deniedSummary:
        "Typed exception review is hub-only operational work and cannot reopen under this organisation scope.",
    };
  }

  if (organisationId === "north_shore_hub" && purposeId === "service_recovery_review") {
    return {
      accessPosture: "frozen",
      contextState: "stale",
      visibilityEnvelopeState: "stale",
      driftClass: "purpose_of_use_change",
      deniedSummary: null,
    };
  }

  if (runtimeScenario === "recovery_only") {
    return {
      accessPosture: "frozen",
      contextState: currentCase.workState === "supplier_drift_review" ? "stale" : "current",
      visibilityEnvelopeState:
        currentCase.workState === "supplier_drift_review" ? "stale" : "current",
      driftClass:
        currentCase.workState === "supplier_drift_review" ? "visibility_contract_drift" : null,
      deniedSummary: null,
    };
  }

  if (organisationId !== "north_shore_hub" || runtimeScenario === "read_only") {
    return {
      accessPosture: "read_only",
      contextState: "current",
      visibilityEnvelopeState: "current",
      driftClass: null,
      deniedSummary: null,
    };
  }

  return {
    accessPosture: "writable",
    contextState: "current",
    visibilityEnvelopeState: "current",
    driftClass: null,
    deniedSummary: null,
  };
}

function buildOrganisationOptions(
  currentOrganisationId: HubActingOrganisationId,
): readonly HubScopeOptionDescriptor[] {
  return (Object.entries(hubOrganisationConfigs) as [
    HubActingOrganisationId,
    (typeof hubOrganisationConfigs)[HubActingOrganisationId],
  ][]).map(([organisationId, organisation]) => ({
    optionId: organisationId,
    label: organisation.label,
    summary: organisation.summary,
    state: organisationId === currentOrganisationId ? "current" : "available",
    outcome:
      organisationId === "north_shore_hub"
        ? "preserve_writable"
        : organisationId === "south_vale_network"
          ? "deny_scope"
          : "preserve_read_only",
  }));
}

function buildSiteOptions(
  organisationId: HubActingOrganisationId,
  currentSiteId: HubActingSiteId,
): readonly HubScopeOptionDescriptor[] {
  return (Object.entries(hubSiteConfigs) as [
    HubActingSiteId,
    (typeof hubSiteConfigs)[HubActingSiteId],
  ][])
    .filter(([, site]) => site.organisationId === organisationId)
    .map(([siteId, site]) => ({
      optionId: siteId,
      label: site.label,
      summary: site.summary,
      state: siteId === currentSiteId ? "current" : site.optionState,
      outcome: site.optionState === "blocked" ? "blocked" : site.outcome,
    }));
}

function buildPurposeOptions(
  organisationId: HubActingOrganisationId,
  currentPurposeId: HubPurposeOfUseId,
): readonly HubScopeOptionDescriptor[] {
  return (Object.entries(hubPurposeConfigs) as [
    HubPurposeOfUseId,
    (typeof hubPurposeConfigs)[HubPurposeOfUseId],
  ][]).map(([purposeId, purpose]) => {
    const allowed =
      (organisationId === "north_shore_hub" &&
        (purposeId === "direct_care_coordination" || purposeId === "service_recovery_review")) ||
      (organisationId === "riverside_medical" && purposeId === "practice_follow_up") ||
      (organisationId === "elm_park_surgery" && purposeId === "site_delivery");
    const state: HubScopeOptionState =
      purposeId === currentPurposeId
        ? "current"
        : !allowed
          ? "blocked"
          : purpose.optionState;
    return {
      optionId: purposeId,
      label: purpose.label,
      summary: purpose.summary,
      state,
      outcome:
        state === "blocked"
          ? "blocked"
          : purposeId === "service_recovery_review"
            ? "freeze_refresh_required"
            : organisationId === "north_shore_hub"
              ? "preserve_writable"
              : "preserve_read_only",
    };
  });
}

function buildVisibilityEnvelopeLegend(
  audienceTierId: HubAudienceTierId,
): HubVisibilityEnvelopeLegendDescriptor {
  return {
    title: "Visibility envelope legend",
    summary:
      "Audience tiers explain why a section is visible, withheld, or requires elevated access before richer detail appears.",
    currentAudienceTierId: audienceTierId,
    rows: [
      {
        tierId: "hub_desk_visibility",
        label: "Hub desk visibility",
        visibleSummary:
          "Clinical routing, travel constraints, governed coordination evidence, and selected candidate truth remain visible.",
        hiddenSummary: "Broad narrative and attachment payloads stay withheld without break-glass.",
        current: audienceTierId === "hub_desk_visibility",
      },
      {
        tierId: "origin_practice_visibility",
        label: "Origin practice visibility",
        visibleSummary:
          "Macro booking status, callback reason code, and acknowledgement delta stay visible.",
        hiddenSummary:
          "Additional coordination notes, cross-site capacity detail, and original booking evidence remain withheld.",
        current: audienceTierId === "origin_practice_visibility",
      },
      {
        tierId: "servicing_site_visibility",
        label: "Servicing site visibility",
        visibleSummary:
          "Encounter delivery brief, site-local capacity, and confirmed slot summary remain visible.",
        hiddenSummary:
          "Origin triage notes, callback rationale, and other-site alternatives remain withheld.",
        current: audienceTierId === "servicing_site_visibility",
      },
    ],
  };
}

function buildMinimumNecessaryPlaceholders(
  audienceTierId: HubAudienceTierId,
  breakGlassState: HubBreakGlassState,
): readonly HubMinimumNecessaryPlaceholderBlockDescriptor[] {
  if (audienceTierId === "origin_practice_visibility") {
    return [
      {
        blockId: "placeholder-origin-notes",
        title: "Additional coordination notes withheld",
        summary:
          "This field is intentionally hidden because origin-practice visibility stops at macro coordination truth.",
        reason: "hidden_by_audience_tier",
        audienceTierId,
        hiddenFields: ["hub_internal_free_text"],
      },
      {
        blockId: "placeholder-origin-capacity",
        title: "Cross-site capacity detail hidden",
        summary:
          "Other-site candidate detail is not shown under the current minimum-necessary contract.",
        reason: "hidden_by_audience_tier",
        audienceTierId,
        hiddenFields: ["cross_site_capacity_detail"],
      },
      {
        blockId: "placeholder-origin-proof",
        title: "Raw booking proof withheld",
        summary:
          "Practice-facing review keeps operational truth visible without exposing raw supplier proof bundles.",
        reason: "hidden_by_role",
        audienceTierId,
        hiddenFields: ["raw_native_booking_proof"],
      },
    ];
  }

  if (audienceTierId === "servicing_site_visibility") {
    return [
      {
        blockId: "placeholder-site-triage",
        title: "Origin triage detail hidden",
        summary:
          "Servicing-site delivery posture omits origin-practice triage notes and callback rationale.",
        reason: "hidden_by_audience_tier",
        audienceTierId,
        hiddenFields: ["origin_practice_triage_notes", "callback_rationale"],
      },
      {
        blockId: "placeholder-site-network",
        title: "Other-site options removed",
        summary:
          "The current delivery envelope does not include alternative options for other sites or hubs.",
        reason: "out_of_scope",
        audienceTierId,
        hiddenFields: ["alternative_options_other_sites"],
      },
    ];
  }

  if (audienceTierId === "hub_desk_visibility" && breakGlassState === "inactive") {
    return [
      {
        blockId: "placeholder-hub-attachment",
        title: "Attachment payload requires break-glass",
        summary:
          "The hub can coordinate safely with governed evidence, but raw attachment payloads stay hidden until elevated access is reason-coded.",
        reason: "elevation_required",
        audienceTierId,
        hiddenFields: ["attachment_payload_without_break_glass"],
      },
    ];
  }

  return [];
}

function buildActingContextControlPlane(
  state: HubShellState,
  currentCase: HubCoordinationCase,
  runtimeScenario: RuntimeScenario,
): HubActingContextControlPlaneDescriptor {
  const organisationId = state.selectedOrganisationId;
  const siteId = state.selectedSiteId;
  const purposeId = state.selectedPurposeId;
  const organisation = hubOrganisationConfigs[organisationId];
  const site = hubSiteConfigs[siteId];
  const purpose = hubPurposeConfigs[purposeId];
  const breakGlassState = deriveBreakGlassState(state, organisationId, siteId);
  const accessState = deriveActingContextAccessState(
    state,
    currentCase,
    runtimeScenario,
    organisationId,
    purposeId,
    breakGlassState,
  );
  const audienceTierId = organisation.audienceTierId;
  const tupleHash = `scope::${organisationId}::${siteId}::${purposeId}::${breakGlassState}`;
  const placeholders = buildMinimumNecessaryPlaceholders(audienceTierId, breakGlassState);
  const scopeLabel = scopeLabelForSelection(organisationId, siteId, purposeId);
  const previousScopeLabel = state.lastScopeTransition
    ? scopeLabelForSelection(
        state.lastScopeTransition.fromOrganisationId,
        state.lastScopeTransition.fromSiteId,
        state.lastScopeTransition.fromPurposeId,
      )
    : null;

  return {
    visualMode: HUB_ACTING_CONTEXT_VISUAL_MODE,
    accessPosture: accessState.accessPosture,
    contextState: accessState.contextState,
    visibilityEnvelopeState: accessState.visibilityEnvelopeState,
    actingContextChip: {
      contextId: tupleHash,
      organisationLabel: organisation.label,
      siteLabel: site.label,
      roleLabel: organisation.roleLabel,
      purposeLabel: purpose.label,
      audienceTierLabel: hubAudienceTierLabels[audienceTierId],
      accessPosture: accessState.accessPosture,
      contextState: accessState.contextState,
      breakGlassState,
      summary:
        accessState.accessPosture === "writable"
          ? "Current organisation, site, purpose, and audience tier all support live hub coordination."
          : accessState.accessPosture === "read_only"
            ? "Current scope preserves the same shell, but richer cross-org detail and mutation stay withheld."
            : accessState.accessPosture === "frozen"
              ? "Scope drift froze writable posture in place until the same case is re-read under the new tuple."
              : "Current scope blocks the route from exposing operational detail or mutation.",
    },
    scopeSummaryStrip: {
      summaryId: tupleHash,
      organisationLabel: organisation.label,
      siteLabel: site.label,
      purposeLabel: purpose.label,
      audienceTierLabel: hubAudienceTierLabels[audienceTierId],
      visibilityEnvelopeLabel:
        accessState.visibilityEnvelopeState === "current"
          ? "Current envelope"
          : accessState.visibilityEnvelopeState === "stale"
            ? "Stale envelope"
            : "Blocked envelope",
      accessPosture: accessState.accessPosture,
      accessPostureLabel:
        accessState.accessPosture === "writable"
          ? "Writable"
          : accessState.accessPosture === "read_only"
            ? "Read-only"
            : accessState.accessPosture === "frozen"
              ? "Frozen pending scope refresh"
              : "Denied",
      tupleHash,
      switchGenerationLabel: `Access update ${tupleHash.length % 7 + 12}`,
      minimumNecessarySummary:
        placeholders.length > 0
          ? `${placeholders.length} limited summar${placeholders.length === 1 ? "y explains" : "ies explain"} unavailable detail.`
          : "No additional limited summaries are required under the current audience tier.",
      visibilityEnvelopeState: accessState.visibilityEnvelopeState,
      breakGlassState,
      breakGlassSummary:
        breakGlassState === "inactive"
          ? "No break-glass is active."
          : breakGlassState === "active"
            ? "Break-glass is active and bound to the current hub access details."
            : breakGlassState === "expiring"
              ? "Break-glass is active but expiring soon under the escalation-room lease."
              : breakGlassState === "revoked"
                ? "Break-glass was revoked and the shell is blocked until a new reason-coded activation."
                : "Break-glass request was denied under the current organisation and purpose of use.",
    },
    organisationSwitchDrawer: {
      title: "OrganisationSwitchDrawer",
      summary:
        "Organisation, site, and purpose switches preserve the same workspace and selected case while making any freeze or denial explicit.",
      organisationOptions: buildOrganisationOptions(organisationId),
      actingSiteSwitcher: {
        title: "ActingSiteSwitcher",
        summary: "Sites can change expiry status or available recovery controls without changing the route silently.",
        options: buildSiteOptions(organisationId, siteId),
      },
      purposePanel: {
        title: "PurposeOfUsePanel",
        summary:
          "Purpose-of-use changes recheck acting access details; blocked and pending paths stay explicit instead of behaving like soft navigation filters.",
        options: buildPurposeOptions(organisationId, purposeId),
      },
      breakGlassSummary:
        organisationId === "north_shore_hub"
          ? "Break-glass may be reason-coded from the current hub access details when the purpose is direct care coordination."
          : "Break-glass cannot be requested from this organisation scope.",
    },
    breakGlassReasonModal: {
      title: "BreakGlassReasonModal",
      summary:
        "Reason-coded activation is explicit, auditable, and bound to the current scope tuple rather than hidden behind a silent privilege toggle.",
      allowed:
        organisationId === "north_shore_hub" && purposeId === "direct_care_coordination",
      denialSummary:
        organisationId === "north_shore_hub" && purposeId === "direct_care_coordination"
          ? null
          : "Current organisation or purpose of use cannot activate break-glass. Switch back to the hub direct-care tuple first.",
      recommendedReasonId: "urgent_clinical_safety",
      reasons: hubBreakGlassReasons,
    },
    accessScopeTransitionReceipt: state.lastScopeTransition
      ? {
          transitionId: `transition::${state.lastScopeTransition.toOrganisationId}::${state.lastScopeTransition.toSiteId}::${state.lastScopeTransition.toPurposeId}`,
          outcome: state.lastScopeTransition.outcome,
          title:
            state.lastScopeTransition.outcome === "preserve_writable"
              ? "Writable scope refreshed in place"
              : state.lastScopeTransition.outcome === "preserve_read_only"
                ? "Route preserved in read-only scope"
                : state.lastScopeTransition.outcome === "freeze_refresh_required"
                  ? "Scope drift froze the current case"
                  : "Current scope denied the route",
          summary:
            state.lastScopeTransition.outcome === "preserve_writable"
              ? "The same case stayed open and writable under the new acting tuple."
              : state.lastScopeTransition.outcome === "preserve_read_only"
                ? "The same route stayed open, but the new audience tier only allows bounded review."
                : state.lastScopeTransition.outcome === "freeze_refresh_required"
                  ? "The shell preserved the active case anchor and froze write posture until the new purpose is re-read."
                  : "The route stayed in the shell, but operational detail is blocked until a lawful scope is chosen.",
          previousScopeLabel: previousScopeLabel ?? scopeLabel,
          currentScopeLabel: scopeLabel,
          preservedAnchorLabel: currentCase.patientLabel,
          returnContractSummary:
            "Queue row, selected case anchor, and current return path remain bound to the same shell family.",
        }
      : null,
    scopeDriftFreezeBanner:
      accessState.accessPosture === "frozen" && accessState.driftClass
        ? {
            bannerId: `drift::${accessState.driftClass}`,
            driftClass: accessState.driftClass,
            title:
              accessState.driftClass === "purpose_of_use_change"
                ? "Purpose-of-use drift froze write posture"
                : accessState.driftClass === "visibility_contract_drift"
                  ? "Visibility contract drift froze the current case"
                  : "Current scope drifted under the visible shell",
            summary:
              accessState.driftClass === "purpose_of_use_change"
                ? "The case remains visible, but the new purpose-of-use requires a same-shell re-read before any mutation can continue."
                : "Current cross-org visibility or recovery truth drifted; the shell stays open but bounded to refresh and supervision actions.",
            actionLabel: "Open acting-context controls",
          }
        : null,
    visibilityEnvelopeLegend: buildVisibilityEnvelopeLegend(audienceTierId),
    minimumNecessaryPlaceholders: placeholders,
    accessDeniedState:
      accessState.accessPosture === "denied"
        ? {
            stateId: `denied::${organisationId}::${state.location.viewMode}`,
            title: "HubAccessDeniedState",
            summary:
              accessState.deniedSummary ??
              "The current scope cannot keep this route open beyond the shared shell frame.",
            reasonRows: [
              { label: "Organisation", value: organisation.label },
              { label: "Site", value: site.label },
              { label: "Purpose of use", value: purpose.label },
              { label: "Audience tier", value: hubAudienceTierLabels[audienceTierId] },
            ],
            recoveryActionLabel: "Choose another acting scope",
            queueActionLabel: "Return to queue shell",
          }
        : null,
  };
}

function buildRecoveryCaseProjection(
  currentCase: HubCoordinationCase,
): HubRecoveryCaseProjectionDescriptor | null {
  return recoveryCaseForId(currentCase.caseId) ?? null;
}

function buildExceptionWorkspace(
  state: HubShellState,
  currentCase: HubCoordinationCase,
): HubExceptionWorkspaceDescriptor | null {
  if (state.location.viewMode !== "exceptions") {
    return null;
  }

  const selectedException =
    exceptionForId(state.selectedExceptionId) ??
    exceptionForId(defaultExceptionIdForCase(currentCase.caseId)) ??
    hubExceptions[0];
  if (!selectedException) {
    return null;
  }

  const rows = hubExceptionRows.map((row) => ({
    ...row,
    active: row.exceptionId === selectedException.row.exceptionId,
  }));

  return {
    visualMode: HUB_RECOVERY_VISUAL_MODE,
    title: "HubExceptionQueueView",
    summary:
      "Typed recovery work stays inside the hub shell with selected case continuity, severity ordering, and one bounded detail drawer.",
    selectedExceptionId: selectedException.row.exceptionId,
    rows,
    detailDrawer: {
      exceptionId: selectedException.row.exceptionId,
      caseId: selectedException.row.caseId,
      fallbackType: selectedException.row.fallbackType,
      ...selectedException.detail,
    },
  };
}

export function resolveHubShellSnapshot(
  state: HubShellState,
  viewportWidth: number,
): HubShellSnapshot {
  const savedView =
    savedViewById.get(state.selectedSavedViewId) ?? savedViewById.get("resume_today")!;
  const currentCase = defaultCaseForLocation(state.location, savedView, state.selectedCaseId);
  const runtimeScenario = runtimeScenarioForState(state.location, savedView, currentCase);
  const recoveryPosture: HubRecoveryPosture =
    runtimeScenario === "live"
      ? "live"
      : runtimeScenario === "read_only"
        ? "read_only"
        : "recovery_only";
  const actingContextControlPlane = buildActingContextControlPlane(
    state,
    currentCase,
    runtimeScenario,
  );
  const routeShellPosture: HubRouteShellPosture =
    actingContextControlPlane.accessPosture === "denied" ||
    actingContextControlPlane.accessPosture === "frozen"
      ? "shell_recovery_only"
      : actingContextControlPlane.accessPosture === "read_only" || recoveryPosture === "read_only"
        ? "shell_read_only"
        : "shell_live";
  const artifactModeState: HubArtifactModeState =
    state.location.viewMode === "exceptions"
      ? "table_only"
      : state.location.viewMode === "audit"
        ? "summary_only"
        : "interactive_live";
  const visualizationAuthority: HubVisualizationAuthority =
    artifactModeState === "table_only"
      ? "table_only"
      : artifactModeState === "summary_only"
        ? "summary_only"
        : "visual_table_summary";
  const layoutMode: HubLayoutMode =
    viewportWidth < 960
      ? "mission_stack"
      : state.location.viewMode === "queue"
        ? "two_plane"
        : "three_panel";

  const routeMutationEnabled =
    recoveryPosture === "live" &&
    actingContextControlPlane.accessPosture === "writable" &&
    currentCase.ownershipState === "claimed_active" &&
    state.location.viewMode !== "audit" &&
    state.location.viewMode !== "exceptions";
  const queueWorkbench = buildQueueWorkbenchProjection(state, savedView, currentCase);
  const optionCards = buildOptionCardsForCase(
    currentCase,
    state.selectedOptionCardId,
    state.queueChangeState,
  );
  const selectedOptionCard = resolveSelectedOptionCard(
    currentCase,
    state.selectedOptionCardId,
    state.queueChangeState,
  );
  const optionCardGroups = buildOptionCardGroups(optionCards);
  const currentSeed = workbenchSeedForCase(currentCase.caseId);
  const bestFitNowStrip = buildBestFitNowStrip(currentCase, selectedOptionCard);
  const decisionDockHost = buildDecisionDockHost(
    state.location,
    currentCase,
    runtimeScenario,
    selectedOptionCard,
    queueWorkbench.queueChangeBatch,
  );
  const recoveryCase = buildRecoveryCaseProjection(currentCase);
  const exceptionWorkspace = buildExceptionWorkspace(state, currentCase);

  return {
    location: state.location,
    savedView,
    currentCase,
    actingContextControlPlane,
    queueRows: buildQueueRows(savedView, currentCase.caseId),
    interruptionRows: buildInterruptions(savedView),
    statusSignals: statusSignalsForSnapshot(savedView, currentCase, runtimeScenario),
    resumeCard: buildResumeCard(savedView, currentCase),
    caseStageHost: buildCaseStageHost(state.location, currentCase),
    rightRailHost: buildRightRailHost(currentCase, runtimeScenario),
    layoutMode,
    artifactModeState,
    visualizationAuthority,
    recoveryPosture,
    routeShellPosture,
    routeMutationEnabled,
    summarySentence: summarySentenceForSnapshot(state.location, savedView, currentCase),
    dominantActionRef: `hub-dominant-action::${savedView.savedViewId}::${currentCase.caseId}`,
    selectedAnchorId:
      state.location.viewMode === "queue" ? state.selectedQueueAnchorId : state.activeCaseAnchorId,
    activeCaseAnchorId: state.activeCaseAnchorId,
    queueVisualMode: HUB_QUEUE_VISUAL_MODE,
    queueWorkbench,
    optionCardGroups,
    selectedOptionCard,
    callbackFallbackCard: currentSeed?.callbackFallbackCard ?? null,
    bestFitNowStrip,
    escalationBanner: currentSeed?.escalationBanner ?? null,
    decisionDockHost,
    recoveryCase,
    exceptionWorkspace,
  };
}

function createReturnPath(location: HubLocation, currentCase: HubCoordinationCase): string | null {
  if (location.viewMode === "alternatives" || location.viewMode === "audit") {
    return `/hub/case/${currentCase.caseId}`;
  }
  return null;
}

export function createHubShellHistorySnapshot(state: HubShellState): HubShellHistorySnapshot {
  return {
    pathname: state.location.pathname,
    selectedSavedViewId: state.selectedSavedViewId,
    selectedCaseId: state.selectedCaseId,
    selectedQueueAnchorId: state.selectedQueueAnchorId,
    activeCaseAnchorId: state.activeCaseAnchorId,
    selectedExceptionId: state.selectedExceptionId,
    selectedOptionCardId: state.selectedOptionCardId,
    selectedOrganisationId: state.selectedOrganisationId,
    selectedSiteId: state.selectedSiteId,
    selectedPurposeId: state.selectedPurposeId,
    breakGlassBaseState: state.breakGlassBaseState,
    breakGlassReasonId: state.breakGlassReasonId,
    lastScopeTransition: state.lastScopeTransition,
    selectedQueueFilterId: state.selectedQueueFilterId,
    queueChangeState: state.queueChangeState,
  };
}

export function createInitialHubShellState(
  pathname: string = HUB_DEFAULT_PATH,
  options: {
    historySnapshot?: Partial<HubShellHistorySnapshot> | null;
  } = {},
): HubShellState {
  const historySnapshot = options.historySnapshot ?? null;
  const location = parseHubPath(pathname);
  const savedView = defaultSavedViewForLocation(location, historySnapshot?.selectedSavedViewId);
  let currentCase = defaultCaseForLocation(location, savedView, historySnapshot?.selectedCaseId);
  const selectedExceptionId =
    exceptionForId(historySnapshot?.selectedExceptionId) &&
    location.viewMode === "exceptions"
      ? (historySnapshot?.selectedExceptionId as string)
      : defaultExceptionIdForCase(currentCase.caseId);
  if (location.viewMode === "exceptions") {
    const exceptionCase = caseForId(exceptionForId(selectedExceptionId)?.row.caseId);
    if (exceptionCase) {
      currentCase = exceptionCase;
    }
  }
  const runtimeScenario = runtimeScenarioForState(location, savedView, currentCase);
  const continuitySnapshot = continuitySnapshotForLocation(location, runtimeScenario);
  const selectedQueueAnchorId = historySnapshot?.selectedQueueAnchorId ?? currentCase.caseId;
  const activeCaseAnchorId = historySnapshot?.activeCaseAnchorId ?? currentCase.caseId;
  const selectedOrganisationId = clampOrganisationId(historySnapshot?.selectedOrganisationId);
  const selectedSiteId = normalizeSiteForOrganisation(
    selectedOrganisationId,
    historySnapshot?.selectedSiteId,
  );
  const selectedPurposeId = normalizePurposeForOrganisation(
    selectedOrganisationId,
    historySnapshot?.selectedPurposeId,
  );
  const selectedOptionCardId = workbenchSeedForCase(currentCase.caseId)?.baseOptionOrder.includes(
    historySnapshot?.selectedOptionCardId ?? "",
  )
    ? (historySnapshot?.selectedOptionCardId ?? defaultOptionCardIdForCase(currentCase.caseId))
    : defaultOptionCardIdForCase(currentCase.caseId);

  return {
    location,
    continuitySnapshot,
    selectedSavedViewId: savedView.savedViewId,
    selectedCaseId: currentCase.caseId,
    selectedQueueAnchorId,
    activeCaseAnchorId,
    selectedExceptionId,
    selectedOptionCardId,
    selectedOrganisationId,
    selectedSiteId,
    selectedPurposeId,
    breakGlassBaseState: clampBreakGlassBaseState(historySnapshot?.breakGlassBaseState),
    breakGlassReasonId: historySnapshot?.breakGlassReasonId ?? null,
    lastScopeTransition: historySnapshot?.lastScopeTransition ?? null,
    selectedQueueFilterId: clampQueueFilterId(historySnapshot?.selectedQueueFilterId),
    queueChangeState: clampQueueChangeState(historySnapshot?.queueChangeState),
    runtimeScenario,
    returnPath: createReturnPath(location, currentCase),
    telemetry: [
      createHubTelemetryEnvelope(location.routeFamilyRef, "surface_enter", {
        pathname: location.pathname,
        caseId: currentCase.caseId,
        savedViewId: savedView.savedViewId,
        viewMode: location.viewMode,
      }),
    ],
  };
}

export function selectHubSavedView(
  state: HubShellState,
  savedViewId: HubSavedViewId,
): HubShellState {
  const savedView = savedViewById.get(savedViewId) ?? savedViewById.get("resume_today")!;
  const nextLocation = parseHubPath(HUB_DEFAULT_PATH);
  const currentCase = caseForId(savedView.defaultCaseId) ?? hubCases[0]!;
  const runtimeScenario = runtimeScenarioForState(nextLocation, savedView, currentCase);
  const continuitySnapshot = nextContinuitySnapshot(
    state.continuitySnapshot,
    nextLocation,
    runtimeScenario,
  );

  return {
    ...state,
    location: nextLocation,
    continuitySnapshot,
    selectedSavedViewId: savedView.savedViewId,
    selectedCaseId: currentCase.caseId,
    selectedQueueAnchorId: currentCase.caseId,
    activeCaseAnchorId: currentCase.caseId,
    selectedExceptionId: defaultExceptionIdForCase(currentCase.caseId),
    selectedOptionCardId: defaultOptionCardIdForCase(currentCase.caseId),
    selectedQueueFilterId: "all",
    queueChangeState: "idle",
    runtimeScenario,
    returnPath: createReturnPath(nextLocation, currentCase),
    telemetry: appendTelemetry(state, "state_summary_changed", {
      pathname: nextLocation.pathname,
      savedViewId: savedView.savedViewId,
      caseId: currentCase.caseId,
    }),
  };
}

export function selectHubCase(state: HubShellState, caseId: string): HubShellState {
  const currentCase = caseForId(caseId) ?? caseForId(state.selectedCaseId) ?? hubCases[0]!;
  const savedView =
    savedViewById.get(state.selectedSavedViewId) ?? savedViewById.get("resume_today")!;
  let nextLocation = state.location;

  if (
    state.location.viewMode === "case" ||
    state.location.viewMode === "alternatives" ||
    state.location.viewMode === "audit"
  ) {
    nextLocation = parseHubPath(`/hub/case/${currentCase.caseId}`);
  }

  const runtimeScenario = runtimeScenarioForState(nextLocation, savedView, currentCase);
  const continuitySnapshot = nextContinuitySnapshot(
    state.continuitySnapshot,
    nextLocation,
    runtimeScenario,
  );

  return {
    ...state,
    location: nextLocation,
    continuitySnapshot,
    selectedCaseId: currentCase.caseId,
    selectedQueueAnchorId: currentCase.caseId,
    activeCaseAnchorId: currentCase.caseId,
    selectedExceptionId: defaultExceptionIdForCase(currentCase.caseId),
    selectedOptionCardId:
      currentCase.caseId === state.selectedCaseId
        ? resolveSelectedOptionCard(currentCase, state.selectedOptionCardId, state.queueChangeState)
            .optionCardId
        : defaultOptionCardIdForCase(currentCase.caseId),
    queueChangeState: "idle",
    runtimeScenario,
    returnPath: createReturnPath(nextLocation, currentCase),
    telemetry: appendTelemetry(state, "selected_anchor_changed", {
      caseId: currentCase.caseId,
      pathname: nextLocation.pathname,
    }),
  };
}

export function navigateHubShell(state: HubShellState, pathname: string): HubShellState {
  const location = parseHubPath(pathname);
  const savedView =
    savedViewById.get(state.selectedSavedViewId) ?? savedViewById.get("resume_today")!;
  let currentCase = defaultCaseForLocation(location, savedView, state.selectedCaseId);
  if (location.viewMode === "exceptions" && !defaultExceptionByCaseId.has(currentCase.caseId)) {
    const fallbackException = exceptionForId(defaultExceptionIdForCase(currentCase.caseId));
    const fallbackCase = caseForId(fallbackException?.row.caseId);
    if (fallbackCase) {
      currentCase = fallbackCase;
    }
  }
  const runtimeScenario = runtimeScenarioForState(location, savedView, currentCase);
  const continuitySnapshot = nextContinuitySnapshot(
    state.continuitySnapshot,
    location,
    runtimeScenario,
  );

  return {
    ...state,
    location,
    continuitySnapshot,
    selectedCaseId: currentCase.caseId,
    selectedQueueAnchorId: currentCase.caseId,
    activeCaseAnchorId: currentCase.caseId,
    selectedExceptionId:
      location.viewMode === "exceptions"
        ? exceptionForId(state.selectedExceptionId)?.row.caseId === currentCase.caseId
          ? state.selectedExceptionId
          : defaultExceptionIdForCase(currentCase.caseId)
        : defaultExceptionIdForCase(currentCase.caseId),
    selectedOptionCardId:
      currentCase.caseId === state.selectedCaseId
        ? resolveSelectedOptionCard(currentCase, state.selectedOptionCardId, state.queueChangeState)
            .optionCardId
        : defaultOptionCardIdForCase(currentCase.caseId),
    runtimeScenario,
    returnPath: createReturnPath(location, currentCase),
    telemetry: appendTelemetry(state, "state_summary_changed", {
      pathname: location.pathname,
      viewMode: location.viewMode,
      caseId: currentCase.caseId,
      savedViewId: savedView.savedViewId,
    }),
  };
}

export function returnFromHubChildRoute(state: HubShellState): HubShellState {
  const fallbackPath = `/hub/case/${state.selectedCaseId}`;
  return navigateHubShell(state, state.returnPath ?? fallbackPath);
}

export function selectHubOptionCard(state: HubShellState, optionCardId: string): HubShellState {
  const currentCase = caseForId(state.selectedCaseId) ?? hubCases[0]!;
  const selectedOptionCard = resolveSelectedOptionCard(
    currentCase,
    optionCardId,
    state.queueChangeState,
  );
  return {
    ...state,
    selectedOptionCardId: selectedOptionCard.optionCardId,
    telemetry: appendTelemetry(state, "selected_anchor_changed", {
      caseId: currentCase.caseId,
      optionCardId: selectedOptionCard.optionCardId,
      pathname: state.location.pathname,
    }),
  };
}

export function selectHubExceptionRow(state: HubShellState, exceptionId: string): HubShellState {
  const selectedException = exceptionForId(exceptionId);
  if (!selectedException) {
    return state;
  }
  const currentCase = caseForId(selectedException.row.caseId) ?? hubCases[0]!;
  const savedView =
    savedViewById.get(state.selectedSavedViewId) ?? savedViewById.get("resume_today")!;
  const runtimeScenario = runtimeScenarioForState(state.location, savedView, currentCase);
  const continuitySnapshot = nextContinuitySnapshot(
    state.continuitySnapshot,
    state.location,
    runtimeScenario,
  );

  return {
    ...state,
    continuitySnapshot,
    selectedCaseId: currentCase.caseId,
    selectedQueueAnchorId: currentCase.caseId,
    activeCaseAnchorId: currentCase.caseId,
    selectedExceptionId: selectedException.row.exceptionId,
    runtimeScenario,
    telemetry: appendTelemetry(state, "selected_anchor_changed", {
      pathname: state.location.pathname,
      caseId: currentCase.caseId,
      exceptionId: selectedException.row.exceptionId,
    }),
  };
}

function scopeTransitionOutcomeForSelection(
  organisationId: HubActingOrganisationId,
  purposeId: HubPurposeOfUseId,
): HubScopeTransitionOutcome {
  if (organisationId === "south_vale_network") {
    return "deny_scope";
  }
  if (organisationId === "north_shore_hub" && purposeId === "service_recovery_review") {
    return "freeze_refresh_required";
  }
  return organisationId === "north_shore_hub" ? "preserve_writable" : "preserve_read_only";
}

function applyScopeSelection(
  state: HubShellState,
  nextOrganisationId: HubActingOrganisationId,
  nextSiteId: HubActingSiteId,
  nextPurposeId: HubPurposeOfUseId,
): HubShellState {
  const currentCase = caseForId(state.selectedCaseId) ?? hubCases[0]!;
  const savedView =
    savedViewById.get(state.selectedSavedViewId) ?? savedViewById.get("resume_today")!;
  const runtimeScenario = runtimeScenarioForState(state.location, savedView, currentCase);
  const continuitySnapshot = nextContinuitySnapshot(
    state.continuitySnapshot,
    state.location,
    runtimeScenario,
  );
  const nextBreakGlassBaseState =
    nextOrganisationId === "north_shore_hub" && nextPurposeId === "direct_care_coordination"
      ? state.breakGlassBaseState === "revoked" || state.breakGlassBaseState === "denied"
        ? "inactive"
        : state.breakGlassBaseState
      : "inactive";
  const nextBreakGlassReasonId =
    nextBreakGlassBaseState === "active" ? state.breakGlassReasonId : null;

  return {
    ...state,
    continuitySnapshot,
    selectedOrganisationId: nextOrganisationId,
    selectedSiteId: nextSiteId,
    selectedPurposeId: nextPurposeId,
    breakGlassBaseState: nextBreakGlassBaseState,
    breakGlassReasonId: nextBreakGlassReasonId,
    lastScopeTransition: {
      fromOrganisationId: state.selectedOrganisationId,
      fromSiteId: state.selectedSiteId,
      fromPurposeId: state.selectedPurposeId,
      toOrganisationId: nextOrganisationId,
      toSiteId: nextSiteId,
      toPurposeId: nextPurposeId,
      outcome: scopeTransitionOutcomeForSelection(nextOrganisationId, nextPurposeId),
    },
    runtimeScenario,
    telemetry: appendTelemetry(state, "state_summary_changed", {
      pathname: state.location.pathname,
      selectedOrganisationId: nextOrganisationId,
      selectedSiteId: nextSiteId,
      selectedPurposeId: nextPurposeId,
    }),
  };
}

export function selectHubOrganisation(
  state: HubShellState,
  organisationId: HubActingOrganisationId,
): HubShellState {
  const nextOrganisationId = clampOrganisationId(organisationId);
  const nextSiteId = defaultSiteForOrganisation(nextOrganisationId);
  const nextPurposeId = defaultPurposeForOrganisation(nextOrganisationId);
  return applyScopeSelection(state, nextOrganisationId, nextSiteId, nextPurposeId);
}

export function selectHubActingSite(
  state: HubShellState,
  siteId: HubActingSiteId,
): HubShellState {
  const nextSiteId = normalizeSiteForOrganisation(state.selectedOrganisationId, siteId);
  return applyScopeSelection(
    state,
    state.selectedOrganisationId,
    nextSiteId,
    normalizePurposeForOrganisation(state.selectedOrganisationId, state.selectedPurposeId),
  );
}

export function selectHubPurposeOfUse(
  state: HubShellState,
  purposeId: HubPurposeOfUseId,
): HubShellState {
  const nextPurposeId =
    buildPurposeOptions(state.selectedOrganisationId, state.selectedPurposeId).find(
      (option) => option.optionId === purposeId && option.state !== "blocked",
    )?.optionId as HubPurposeOfUseId | undefined;
  return applyScopeSelection(
    state,
    state.selectedOrganisationId,
    state.selectedSiteId,
    nextPurposeId ?? state.selectedPurposeId,
  );
}

export function activateHubBreakGlass(
  state: HubShellState,
  reasonId: string,
): HubShellState {
  const currentCase = caseForId(state.selectedCaseId) ?? hubCases[0]!;
  const savedView =
    savedViewById.get(state.selectedSavedViewId) ?? savedViewById.get("resume_today")!;
  const runtimeScenario = runtimeScenarioForState(state.location, savedView, currentCase);
  const continuitySnapshot = nextContinuitySnapshot(
    state.continuitySnapshot,
    state.location,
    runtimeScenario,
  );
  const allowed =
    state.selectedOrganisationId === "north_shore_hub" &&
    state.selectedPurposeId === "direct_care_coordination";

  return {
    ...state,
    continuitySnapshot,
    breakGlassBaseState: allowed ? "active" : "denied",
    breakGlassReasonId: reasonId,
    runtimeScenario,
    telemetry: appendTelemetry(state, "state_summary_changed", {
      pathname: state.location.pathname,
      breakGlassBaseState: allowed ? "active" : "denied",
      breakGlassReasonId: reasonId,
    }),
  };
}

export function revokeHubBreakGlass(state: HubShellState): HubShellState {
  const currentCase = caseForId(state.selectedCaseId) ?? hubCases[0]!;
  const savedView =
    savedViewById.get(state.selectedSavedViewId) ?? savedViewById.get("resume_today")!;
  const runtimeScenario = runtimeScenarioForState(state.location, savedView, currentCase);
  const continuitySnapshot = nextContinuitySnapshot(
    state.continuitySnapshot,
    state.location,
    runtimeScenario,
  );

  return {
    ...state,
    continuitySnapshot,
    breakGlassBaseState:
      state.breakGlassBaseState === "active" ? "revoked" : state.breakGlassBaseState,
    runtimeScenario,
    telemetry: appendTelemetry(state, "state_summary_changed", {
      pathname: state.location.pathname,
      breakGlassBaseState:
        state.breakGlassBaseState === "active" ? "revoked" : state.breakGlassBaseState,
    }),
  };
}

export function selectHubQueueFilter(
  state: HubShellState,
  filterId: HubQueueFilterId,
): HubShellState {
  return {
    ...state,
    selectedQueueFilterId: clampQueueFilterId(filterId),
    telemetry: appendTelemetry(state, "state_summary_changed", {
      pathname: state.location.pathname,
      filterId,
      savedViewId: state.selectedSavedViewId,
    }),
  };
}

export function bufferHubQueueChangeBatch(state: HubShellState): HubShellState {
  return {
    ...state,
    queueChangeState: "buffered",
    telemetry: appendTelemetry(state, "state_summary_changed", {
      pathname: state.location.pathname,
      queueChangeState: "buffered",
      savedViewId: state.selectedSavedViewId,
    }),
  };
}

export function applyHubQueueChangeBatch(state: HubShellState): HubShellState {
  return {
    ...state,
    queueChangeState: "applied",
    telemetry: appendTelemetry(state, "state_summary_changed", {
      pathname: state.location.pathname,
      queueChangeState: "applied",
      savedViewId: state.selectedSavedViewId,
    }),
  };
}

export function createHubShellTopologyMermaid(): string {
  return `flowchart LR
  Q["/hub/queue\\nstart-of-day"]
  C["/hub/case/:hubCoordinationCaseId\\ncase stage host"]
  A["/hub/alternatives/:offerSessionId\\nchild route host"]
  E["/hub/exceptions\\nrecovery host"]
  U["/hub/audit/:hubCoordinationCaseId\\nread-only proof host"]
  S["HubShellContinuityBinder\\nsaved view + queue anchor + case anchor"]
  V["HubSavedViewRail"]
  Q --> C
  Q --> E
  C --> A
  C --> U
  A --> C
  U --> C
  V --> Q
  V --> E
  S --> Q
  S --> C
  S --> A
  S --> E
  S --> U
  classDef shell fill:#eef2f6,stroke:#2457FF,color:#0F172A,stroke-width:1.3px
  classDef support fill:#ffffff,stroke:#D7E0EA,color:#334155,stroke-width:1px
  class Q,C,A,E,U shell
  class S,V support`;
}
