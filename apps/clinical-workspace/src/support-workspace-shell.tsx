import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { formatVecellTitle } from "@vecells/design-system";
import {
  resolvePortalSupportPhase2Context,
  type PortalSupportPhase2Context,
} from "../../../packages/domain-kernel/src/patient-support-phase2-integration";
import {
  recordWorkspaceSupportUiEvent,
  type RuntimeValidationScenario,
  type ValidationActionFamily,
} from "./workspace-support-observability";

export type SupportWorkspaceScenario = "calm" | "active" | "provisional" | "degraded" | "blocked";
export type SupportShellMode = "live" | "provisional" | "observe_only" | "replay" | "read_only_recovery";
export type SupportWorkspaceRouteKey =
  | "ticket-overview"
  | "ticket-conversation"
  | "ticket-history"
  | "ticket-knowledge"
  | "ticket-action"
  | "ticket-observe"
  | "ticket-replay";
export type SupportActionKey =
  | "controlled_resend"
  | "channel_change"
  | "callback_reschedule"
  | "attachment_recovery"
  | "identity_correction";
export type SupportFallbackReason =
  | "none"
  | "route_intent_drift"
  | "observe_session_drift"
  | "replay_restore_failure"
  | "publication_drift"
  | "disclosure_drift";
export type SupportDisclosureState = "summary_only" | "expanded" | "expired" | "revoked";
export type SupportKnowledgeAssistQueryState = "auto" | "executable" | "preview_only" | "stale" | "blocked";
export type SupportKnowledgeAssistLeaseState = Exclude<SupportKnowledgeAssistQueryState, "auto">;

interface SupportTicketHeaderView {
  readonly maskedSubjectLabel: string;
  readonly reasonCategory: string;
  readonly severity: "high" | "medium";
  readonly slaState: "at_risk" | "within_target" | "breached";
  readonly shellMode: SupportShellMode;
}

export interface SupportTicketWorkspaceProjection {
  readonly projectionName: "SupportTicketWorkspaceProjection";
  readonly supportTicketWorkspaceProjectionId: string;
  readonly supportTicketId: string;
  readonly supportLineageBindingRef: string;
  readonly supportLineageBindingHash: string;
  readonly primaryScopeMemberRef: string;
  readonly ticketVersionRef: string;
  readonly selectedTimelineAnchorRef: string;
  readonly selectedTimelineAnchorTupleHashRef: string;
  readonly ticketHeaderRef: string;
  readonly timelineProjectionRef: string;
  readonly supportReachabilityPostureProjectionRef: string;
  readonly actionWorkbenchProjectionRef: string;
  readonly subject360ProjectionRef: string;
  readonly knowledgeStackProjectionRef: string;
  readonly resolutionSnapshotRef: string | null;
  readonly supportSurfacePostureRef: string;
  readonly supportReadOnlyFallbackProjectionRef: string | null;
  readonly dominantRegion: "timeline" | "action_workbench" | "replay_diff" | "handoff_resolution";
  readonly querySurfaceRef: "GET /ops/support/tickets/:supportTicketId";
  readonly workspaceContinuityKey: string;
  readonly effectiveMaskScopeRef: string;
  readonly ticketHeader: SupportTicketHeaderView;
  readonly timelineEntryPoints: readonly {
    readonly anchorRef: string;
    readonly label: string;
    readonly sourceScopeMemberRef: string;
    readonly artifactBindingRef: string | null;
  }[];
  readonly artifactProvenanceRefs: readonly string[];
  readonly allowedActionRefs: readonly string[];
  readonly reasonCodes: readonly string[];
  readonly renderedAt: string;
}

export interface SupportActionLease {
  readonly projectionName: "SupportActionLease";
  readonly supportActionLeaseId: string;
  readonly supportTicketId: string;
  readonly actionRef: SupportActionKey;
  readonly leaseState: "live" | "observe_only" | "stale" | "blocked";
  readonly observeOnly: boolean;
  readonly maskScopeRef: string;
  readonly selectedTimelineAnchorRef: string;
  readonly expiresAtLabel: string;
}

export interface SupportActionSettlement {
  readonly projectionName: "SupportActionSettlement";
  readonly supportActionSettlementId: string;
  readonly supportTicketId: string;
  readonly supportActionRecordId: string;
  readonly result: "authoritative" | "provisional" | "blocked";
  readonly settlementHint: string;
  readonly recordedAtLabel: string;
}

export interface SupportReachabilityPostureProjection {
  readonly projectionName: "SupportReachabilityPostureProjection";
  readonly supportReachabilityPostureProjectionId: string;
  readonly supportTicketId: string;
  readonly providerName: "sendgrid" | "twilio";
  readonly channel: "email" | "sms";
  readonly deliveryEvidenceBundleRef: string;
  readonly postureState: "at_risk" | "repairing" | "confirmed" | "blocked";
  readonly reasonCodes: readonly string[];
}

export interface SupportActionWorkbenchProjection {
  readonly projectionName: "SupportActionWorkbenchProjection";
  readonly supportActionWorkbenchProjectionId: string;
  readonly supportTicketId: string;
  readonly supportMutationAttemptRef: string | null;
  readonly supportActionSettlementRef: string | null;
  readonly mutatingControlsState: "enabled" | "suspended_for_replay" | "read_only";
  readonly allowedRepairKinds: readonly SupportActionKey[];
  readonly reasonCodes: readonly string[];
}

export interface SupportOmnichannelTimelineProjection {
  readonly projectionName: "SupportOmnichannelTimelineProjection";
  readonly supportOmnichannelTimelineProjectionId: string;
  readonly supportTicketId: string;
  readonly supportLineageBindingRef: string;
  readonly supportLineageBindingHash: string;
  readonly messageDispatchEnvelopeRef: string;
  readonly latestDeliveryEvidenceBundleRef: string;
  readonly latestThreadExpectationEnvelopeRef: string;
  readonly latestThreadResolutionGateRef: string;
  readonly supportMutationAttemptRef: string | null;
  readonly supportActionSettlementRef: string | null;
  readonly supportReplayCheckpointRef: string | null;
  readonly supportReplayRestoreSettlementRef: string | null;
  readonly patientReceiptEnvelopeRef: string;
  readonly patientReceiptParity: "provisional" | "authoritative" | "blocked";
  readonly chronologyRefs: readonly string[];
  readonly provisionalEventRefs: readonly string[];
  readonly authoritativeEventRefs: readonly string[];
  readonly freshness: "live" | "paused_replay" | "queued_delta_review" | "stale" | "read_only";
  readonly supportActionWorkbenchProjection: SupportActionWorkbenchProjection;
  readonly supportReachabilityPostureProjection: SupportReachabilityPostureProjection;
  readonly reasonCodes: readonly string[];
  readonly generatedAt: string;
}

export interface SupportContinuityEvidenceProjection {
  readonly projectionName: "SupportContinuityEvidenceProjection";
  readonly supportContinuityEvidenceProjectionId: string;
  readonly supportTicketId: string;
  readonly supportLineageBindingRef: string;
  readonly supportLineageBindingHash: string;
  readonly routeFamilyRef: "rf_support_ticket_workspace";
  readonly selectedAnchorRef: string;
  readonly selectedAnchorTupleHashRef: string;
  readonly continuityTupleHash: string;
  readonly validationState: "trusted" | "degraded" | "stale" | "blocked";
  readonly blockingRefs: readonly string[];
  readonly capturedAt: string;
}

export interface SupportSurfaceRuntimeBinding {
  readonly projectionName: "SupportSurfaceRuntimeBinding";
  readonly supportSurfaceRuntimeBindingId: string;
  readonly routeFamilyRef: "rf_support_ticket_workspace";
  readonly clientCachePolicyRef: string;
  readonly frontendContractManifestRef: string;
  readonly bindingState: "live" | "recovery_only" | "blocked";
  readonly validatedAt: string;
}

export interface Subject360SummaryProjection {
  readonly projectionName: "SupportSubject360Projection";
  readonly supportSubject360ProjectionId: string;
  readonly maskedSubjectLabel: string;
  readonly repeatContactSignal: string;
  readonly currentChannels: readonly string[];
  readonly linkedRefs: readonly string[];
  readonly currentRiskSummary: string;
}

export interface SupportPresentationArtifact {
  readonly projectionName: "SupportPresentationArtifact";
  readonly supportPresentationArtifactId: string;
  readonly supportTicketId: string;
  readonly anchorRef: string;
  readonly title: string;
  readonly summary: string;
  readonly artifactState: "summary_only" | "inline_renderable" | "recovery_only" | "parity_warning";
  readonly maskScopeRef: string;
  readonly safeTransferState: "inline_only" | "grant_required" | "recovery_only";
}

export interface SupportReadOnlyFallbackProjection {
  readonly projectionName: "SupportReadOnlyFallbackProjection";
  readonly supportReadOnlyFallbackProjectionId: string;
  readonly supportTicketId: string;
  readonly reasonCode: string;
  readonly fallbackClass: SupportFallbackReason;
  readonly selectedTimelineAnchorRef: string;
  readonly strongestConfirmedArtifactRef: string;
  readonly strongestConfirmedArtifactLabel: string;
  readonly strongestConfirmedArtifactSummary: string;
  readonly strongestConfirmedArtifactState: "summary_only" | "inline_renderable" | "recovery_only";
  readonly heldActionSummary: string | null;
  readonly queueReturnPath: string;
  readonly queueReturnLabel: string;
  readonly reacquirePaths: readonly {
    readonly title: string;
    readonly summary: string;
    readonly routePath: string;
    readonly routeLabel: string;
  }[];
}

export interface SupportKnowledgeStackProjection {
  readonly projectionName: "SupportKnowledgeStackProjection";
  readonly supportKnowledgeStackProjectionId: string;
  readonly supportTicketId: string;
  readonly supportLineageBindingRef: string;
  readonly primaryScopeMemberRef: string;
  readonly ticketVersionRef: string;
  readonly selectedTimelineAnchorRef: string;
  readonly supportReachabilityPostureProjectionRef: string;
  readonly supportActionWorkbenchProjectionRef: string;
  readonly supportKnowledgeBindingRef: string;
  readonly supportSubjectContextBindingRef: string;
  readonly dominantRecommendationRef: string;
  readonly secondaryRecommendationRefs: readonly string[];
  readonly relevanceReasonRefs: readonly string[];
  readonly recommendedActionRef: string;
  readonly knowledgeGapState: "not_needed" | "capturable" | "captured" | "follow_up_required";
  readonly promotionState: "summary_only" | "promoted";
  readonly freshnessState: "live" | "stale" | "observe_only" | "runtime_blocked";
  readonly renderedAt: string;
}

export interface SupportKnowledgeBinding {
  readonly projectionName: "SupportKnowledgeBinding";
  readonly supportKnowledgeBindingId: string;
  readonly supportTicketId: string;
  readonly supportLineageBindingRef: string;
  readonly primaryScopeMemberRef: string;
  readonly knowledgeStackProjectionRef: string;
  readonly ticketVersionRef: string;
  readonly policyVersionRef: string;
  readonly maskScopeRef: string;
  readonly routeFamilyRef: "rf_support_ticket_workspace";
  readonly selectedTimelineAnchorRef: string;
  readonly supportReachabilityPostureProjectionRef: string;
  readonly supportActionWorkbenchProjectionRef: string;
  readonly supportSurfaceRuntimeBindingRef: string;
  readonly publicationDigestRef: string;
  readonly projectionCompatibilityDigestRef: string;
  readonly bindingHash: string;
  readonly bindingState: "live" | "observe_only" | "stale" | "blocked";
}

export interface SupportKnowledgeAssistLease {
  readonly projectionName: "SupportKnowledgeAssistLease";
  readonly supportKnowledgeAssistLeaseId: string;
  readonly supportTicketId: string;
  readonly supportKnowledgeBindingRef: string;
  readonly supportActionLeaseRef: string;
  readonly selectedRecommendationRef: string;
  readonly selectedMacroRef: string | null;
  readonly selectedPlaybookRef: string | null;
  readonly selectedTemplateRef: string | null;
  readonly assistIntent:
    | "open_article"
    | "preview_macro"
    | "apply_macro"
    | "launch_playbook"
    | "launch_fallback_channel"
    | "capture_knowledge_gap";
  readonly ticketVersionRef: string;
  readonly policyVersionRef: string;
  readonly maskScopeRef: string;
  readonly supportSurfaceRuntimeBindingRef: string;
  readonly supportContextDisclosureRecordRef: string | null;
  readonly reasonCode: string;
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly leaseState: SupportKnowledgeAssistLeaseState;
}

export interface SupportSubjectContextBinding {
  readonly projectionName: "SupportSubjectContextBinding";
  readonly supportSubjectContextBindingId: string;
  readonly supportTicketId: string;
  readonly supportLineageBindingRef: string;
  readonly scopeMemberRefs: readonly string[];
  readonly subject360ProjectionRef: string;
  readonly supportKnowledgeBindingRef: string;
  readonly ticketVersionRef: string;
  readonly selectedTimelineAnchorRef: string;
  readonly maskScopeRef: string;
  readonly visibilityTier: "support_summary" | "governed_expand";
  readonly supportSurfaceRuntimeBindingRef: string;
  readonly contextWindowHash: string;
  readonly bindingState: "summary_only" | "expanded" | "stale" | "blocked";
}

export interface SupportContextDisclosureRecord {
  readonly projectionName: "SupportContextDisclosureRecord";
  readonly supportContextDisclosureRecordId: string;
  readonly supportTicketId: string;
  readonly supportSubjectContextBindingRef: string;
  readonly supportKnowledgeAssistLeaseRef: string | null;
  readonly openedFromRef: string;
  readonly requestedScope: "summary" | "expanded_history" | "linked_object_detail" | "break_glass_context";
  readonly requiredDisclosureClass: string;
  readonly reasonCode: string;
  readonly maskScopeRef: string;
  readonly jitScopeRef: string | null;
  readonly decisionRef: string;
  readonly openedAt: string;
  readonly expiresAt: string;
  readonly closedAt: string | null;
  readonly disclosureState: "active" | "expired" | "revoked" | "closed";
}

export interface SupportObserveSession {
  readonly projectionName: "SupportObserveSession";
  readonly supportObserveSessionId: string;
  readonly supportTicketId: string;
  readonly supportLineageBindingRef: string;
  readonly primaryScopeMemberRef: string;
  readonly entryRef: string;
  readonly entryReasonCode: string;
  readonly ticketVersionRef: string;
  readonly selectedTimelineAnchorRef: string;
  readonly selectedTimelineAnchorTupleHashRef: string;
  readonly supportRouteIntentTokenRef: string;
  readonly maskScopeRef: string;
  readonly disclosureCeilingRef: string;
  readonly subjectContextBindingRef: string;
  readonly knowledgeBindingRef: string;
  readonly supportSurfaceRuntimeBindingRef: string;
  readonly supportContinuityEvidenceProjectionRef: string;
  readonly stepUpState: "not_required" | "required";
  readonly observeState: "active" | "step_up_required" | "stale" | "released";
  readonly createdAt: string;
}

export interface SupportReplayEvidenceBoundary {
  readonly projectionName: "SupportReplayEvidenceBoundary";
  readonly supportReplayEvidenceBoundaryId: string;
  readonly supportReplayCheckpointRef: string;
  readonly supportLineageBindingRef: string;
  readonly primaryScopeMemberRef: string;
  readonly ticketVersionRef: string;
  readonly authoritativeEventCutoffRef: string;
  readonly selectedTimelineAnchorTupleHashRef: string;
  readonly includedEventRefs: readonly string[];
  readonly includedArtifactRefs: readonly string[];
  readonly artifactBindingRefs: readonly string[];
  readonly excludedDraftRefs: readonly string[];
  readonly excludedOutboundAttemptRefs: readonly string[];
  readonly latestActionSettlementRef: string;
  readonly latestMutationAttemptRef: string;
  readonly externalConfirmationFenceRef: string;
  readonly maskScopeRef: string;
  readonly disclosureCeilingRef: string;
  readonly boundaryHash: string;
}

export interface SupportReplaySession {
  readonly projectionName: "SupportReplaySession";
  readonly supportReplaySessionId: string;
  readonly supportTicketId: string;
  readonly supportReplayCheckpointId: string;
  readonly supportReplayEvidenceBoundaryRef: string;
  readonly currentMaskScopeRef: string;
  readonly disclosureCeilingRef: string;
  readonly restoreState:
    | "frozen"
    | "delta_review"
    | "restore_required"
    | "restore_ready"
    | "restored"
    | "read_only_recovery";
  readonly investigationQuestion: string;
  readonly queueAnchorRef: string;
  readonly selectedTimelineAnchorRef: string;
  readonly returnRouteLabel: string;
}

export type SupportReplayState =
  | "frozen"
  | "delta_review"
  | "restore_required"
  | "restore_ready"
  | "restored"
  | "read_only_recovery";
export type SupportReplayDeltaReviewState = "none" | "queued" | "blocking";
export type SupportReplayRestoreState =
  | "required"
  | "ready"
  | "blocked"
  | "restored"
  | "read_only_recovery";
export type SupportLinkedContextMode = "history" | "knowledge" | "subject";

export interface SupportReplayDeltaReviewItem {
  readonly deltaId: string;
  readonly title: string;
  readonly summary: string;
  readonly severity: "low" | "medium" | "high";
  readonly restoreImpact: "informational" | "confirm" | "blocking";
  readonly anchorRef: string;
  readonly queuedAtLabel: string;
}

export interface SupportReplayDeltaReview {
  readonly projectionName: "SupportReplayDeltaReview";
  readonly supportReplayDeltaReviewId: string;
  readonly supportReplaySessionId: string;
  readonly deltaReviewState: SupportReplayDeltaReviewState;
  readonly highestSeverity: "low" | "medium" | "high" | "none";
  readonly summary: string;
  readonly items: readonly SupportReplayDeltaReviewItem[];
}

export interface SupportReplayDraftHold {
  readonly projectionName: "SupportReplayDraftHold";
  readonly supportReplayDraftHoldId: string;
  readonly supportReplaySessionId: string;
  readonly heldDraftState: "preserved" | "stale" | "released";
  readonly heldDraftRefs: readonly string[];
  readonly heldActionSummary: string;
  readonly heldDraftDisposition: "preserve" | "rebase" | "drop";
}

export interface SupportReplayRestoreSettlement {
  readonly projectionName: "SupportReplayRestoreSettlement";
  readonly supportReplayRestoreSettlementId: string;
  readonly supportReplaySessionId: string;
  readonly restoreState: SupportReplayRestoreState;
  readonly blockerCodes: readonly string[];
  readonly matchedContinuityKey: boolean;
  readonly matchedAnchor: boolean;
  readonly matchedMaskScope: boolean;
  readonly matchedRouteIntent: boolean;
  readonly matchedScopeMember: boolean;
  readonly heldDraftDisposition: "preserve" | "rebase" | "drop" | "none";
  readonly settlementSummary: string;
}

interface SupportKnowledgeCardView {
  readonly recommendationRef: string;
  readonly kind: "article" | "macro" | "playbook" | "policy_note" | "outage_note";
  readonly title: string;
  readonly whyNow: string;
  readonly freshness: string;
  readonly owner: string;
  readonly policyMarker: string;
  readonly previewLabel: string;
  readonly applyLabel: string;
  readonly permittedDisclosure: string;
  readonly state: "live" | "observe_only" | "stale" | "blocked";
}

interface SupportHistoryRow {
  readonly historyRef: string;
  readonly timeLabel: string;
  readonly title: string;
  readonly summary: string;
  readonly maskedState: "summary_only" | "expanded" | "limited";
  readonly disclosureClass: string;
}

export interface SupportTimelineEvent {
  readonly eventId: string;
  readonly anchorRef: string;
  readonly laneLabel: string;
  readonly channel: "email" | "sms" | "secure_message" | "callback" | "telephony" | "internal_note" | "workflow";
  readonly title: string;
  readonly summary: string;
  readonly actor: string;
  readonly timeLabel: string;
  readonly state: "authoritative" | "provisional" | "blocked";
  readonly maskedState: "none" | "summary_only" | "limited";
  readonly maskReason: string | null;
  readonly nextActionHint: string;
  readonly clusterLabel: string;
}

interface SupportActionView {
  readonly actionKey: SupportActionKey;
  readonly label: string;
  readonly summary: string;
  readonly previewLabel: string;
  readonly confirmationLabel: string;
  readonly controlsState: "enabled" | "preview" | "read_only" | "blocked";
  readonly nextStepLabel: string;
}

export interface SupportWorkspaceRouteContract {
  readonly routeKey: SupportWorkspaceRouteKey;
  readonly pathPattern: string;
  readonly shellFamily: "staff_entry_same_shell";
  readonly continuityKey: "support.workspace.tickets";
  readonly selectedAnchorPolicy: string;
  readonly dominantActionLabel: string;
  readonly testId: string;
}

export interface SupportMaskingFallbackRouteContract extends SupportWorkspaceRouteContract {
  readonly shellMode: SupportShellMode | "route_bound";
  readonly requiresMaskScope: true;
  readonly allowsLiveMutation: boolean;
}

interface ParsedSupportRoute {
  readonly routeKey: SupportWorkspaceRouteKey;
  readonly supportTicketId: string;
  readonly actionKey?: SupportActionKey;
  readonly observeSessionId?: string;
  readonly replaySessionId?: string;
}

interface SupportWorkspaceDataset {
  readonly phase2Context: PortalSupportPhase2Context;
  readonly shellMode: SupportShellMode;
  readonly replayState: SupportReplayState;
  readonly ticketWorkspace: SupportTicketWorkspaceProjection;
  readonly actionLease: SupportActionLease;
  readonly actionSettlement: SupportActionSettlement;
  readonly timelineProjection: SupportOmnichannelTimelineProjection;
  readonly continuityEvidence: SupportContinuityEvidenceProjection;
  readonly runtimeBinding: SupportSurfaceRuntimeBinding;
  readonly subject360: Subject360SummaryProjection;
  readonly timelineEvents: readonly SupportTimelineEvent[];
  readonly actionView: SupportActionView;
  readonly ownershipLabel: string;
  readonly queueContextLabel: string;
  readonly disclosureLabel: string;
  readonly settlementHint: string;
  readonly extensionLabel: string;
  readonly effectiveMaskScopeRef: string;
  readonly fallbackProjection: SupportReadOnlyFallbackProjection | null;
  readonly strongestArtifact: SupportPresentationArtifact;
  readonly knowledgeStack: SupportKnowledgeStackProjection;
  readonly knowledgeBinding: SupportKnowledgeBinding;
  readonly knowledgeAssistLease: SupportKnowledgeAssistLease;
  readonly knowledgeCards: readonly SupportKnowledgeCardView[];
  readonly subjectContextBinding: SupportSubjectContextBinding;
  readonly disclosureRecord: SupportContextDisclosureRecord | null;
  readonly historyRows: readonly SupportHistoryRow[];
  readonly observeSession: SupportObserveSession | null;
  readonly replaySession: SupportReplaySession | null;
  readonly replayEvidenceBoundary: SupportReplayEvidenceBoundary | null;
  readonly replayDeltaReview: SupportReplayDeltaReview | null;
  readonly replayDraftHold: SupportReplayDraftHold | null;
  readonly replayRestoreSettlement: SupportReplayRestoreSettlement | null;
  readonly routeModeSummary: string;
}

interface SupportWorkspaceQueryState {
  readonly scenario: SupportWorkspaceScenario;
  readonly selectedAnchorRef: string;
  readonly fallbackReason: SupportFallbackReason;
  readonly disclosureState: SupportDisclosureState;
  readonly assistState: SupportKnowledgeAssistQueryState;
  readonly replayState: SupportReplayState;
  readonly deltaReviewState: SupportReplayDeltaReviewState;
  readonly restoreState: SupportReplayRestoreState;
  readonly linkedContextMode: SupportLinkedContextMode;
}

export const SUPPORT_WORKSPACE_VISUAL_MODE = "Forensic_Support_Deck";
export const SUPPORT_WORKSPACE_STYLE_SYSTEM = "Support_Ticket_Omnichannel_Shell";
const ROUTE_CHANGE_EVENT = "vecells-route-change";
const DEFAULT_TICKET_ID = "support_ticket_218_delivery_failure";
const DEFAULT_OBSERVE_SESSION_ID = "support_observe_session_218_delivery_failure";
const DEFAULT_REPLAY_SESSION_ID = "support_replay_session_218_delivery_failure";

function validationScenarioFromSupportScenario(
  scenario: SupportWorkspaceScenario,
): RuntimeValidationScenario {
  switch (scenario) {
    case "calm":
    case "active":
      return "live";
    case "provisional":
      return "stale_review";
    case "degraded":
      return "recovery_only";
    case "blocked":
      return "blocked";
  }
}

function validationPublicationPostureForSupport(
  shellMode: SupportShellMode,
): "live" | "projection_visible" | "recovery_only" | "blocked" {
  switch (shellMode) {
    case "live":
      return "live";
    case "provisional":
    case "observe_only":
    case "replay":
      return "projection_visible";
    case "read_only_recovery":
      return "recovery_only";
  }
}

function validationRecoveryPostureForSupport(
  shellMode: SupportShellMode,
  scenario: SupportWorkspaceScenario,
): "none" | "stale_recoverable" | "read_only_fallback" | "recovery_required" | "blocked" {
  if (scenario === "blocked") {
    return "blocked";
  }
  if (shellMode === "read_only_recovery") {
    return "read_only_fallback";
  }
  if (shellMode === "replay" || shellMode === "observe_only" || scenario === "degraded") {
    return "recovery_required";
  }
  if (scenario === "provisional") {
    return "stale_recoverable";
  }
  return "none";
}

function validationEventStateForSupport(
  shellMode: SupportShellMode,
  scenario: SupportWorkspaceScenario,
): "provisional" | "authoritative" | "buffered" | "resolved" | "failed" {
  if (scenario === "blocked") {
    return "failed";
  }
  if (shellMode === "provisional" || shellMode === "replay") {
    return "buffered";
  }
  if (shellMode === "observe_only" || shellMode === "read_only_recovery" || scenario === "degraded") {
    return "provisional";
  }
  return "authoritative";
}

function validationSettlementProfileForSupport(
  shellMode: SupportShellMode,
  scenario: SupportWorkspaceScenario,
) {
  if (scenario === "blocked") {
    return {
      localAckState: "shown" as const,
      processingAcceptanceState: "externally_rejected" as const,
      externalObservationState: "blocked" as const,
      authoritativeSource: "recovery_disposition" as const,
      authoritativeOutcomeState: "failed" as const,
      settlementState: "reverted" as const,
    };
  }
  if (shellMode === "read_only_recovery") {
    return {
      localAckState: "restored" as const,
      processingAcceptanceState: "accepted_for_processing" as const,
      externalObservationState: "recovery_only" as const,
      authoritativeSource: "recovery_disposition" as const,
      authoritativeOutcomeState: "recovery_required" as const,
      settlementState: "disputed" as const,
    };
  }
  if (shellMode === "replay" || shellMode === "observe_only" || scenario === "provisional") {
    return {
      localAckState: "shown" as const,
      processingAcceptanceState: "awaiting_external_confirmation" as const,
      externalObservationState: "projection_visible" as const,
      authoritativeSource: "not_yet_authoritative" as const,
      authoritativeOutcomeState: "review_required" as const,
      settlementState: "accepted" as const,
    };
  }
  return {
    localAckState: "shown" as const,
    processingAcceptanceState: "externally_accepted" as const,
    externalObservationState: "projection_visible" as const,
    authoritativeSource: "projection_visible" as const,
    authoritativeOutcomeState: "settled" as const,
    settlementState: "authoritative" as const,
  };
}

function actionFamilyForSupportRoute(route: ParsedSupportRoute): ValidationActionFamily | null {
  switch (route.routeKey) {
    case "ticket-history":
      return "history_reveal";
    case "ticket-knowledge":
      return "knowledge_reveal";
    case "ticket-replay":
      return "support_replay";
    case "ticket-action":
      return route.actionKey === "callback_reschedule"
        ? "callback_action"
        : "message_action";
    case "ticket-conversation":
      return "message_action";
    default:
      return null;
  }
}

export const SUPPORT_ROUTE_REGISTRY: Record<SupportWorkspaceRouteKey, SupportMaskingFallbackRouteContract> = {
  "ticket-overview": {
    routeKey: "ticket-overview",
    pathPattern: "/ops/support/tickets/:supportTicketId",
    shellFamily: "staff_entry_same_shell",
    continuityKey: "support.workspace.tickets",
    selectedAnchorPolicy: "ticket-timeline-persists",
    dominantActionLabel: "Continue the active support handoff",
    testId: "SupportTicketRoute",
    shellMode: "route_bound",
    requiresMaskScope: true,
    allowsLiveMutation: true,
  },
  "ticket-conversation": {
    routeKey: "ticket-conversation",
    pathPattern: "/ops/support/tickets/:supportTicketId/conversation",
    shellFamily: "staff_entry_same_shell",
    continuityKey: "support.workspace.tickets",
    selectedAnchorPolicy: "conversation-anchor-persists",
    dominantActionLabel: "Review the current omnichannel exchange without losing the active anchor",
    testId: "SupportConversationRoute",
    shellMode: "route_bound",
    requiresMaskScope: true,
    allowsLiveMutation: true,
  },
  "ticket-history": {
    routeKey: "ticket-history",
    pathPattern: "/ops/support/tickets/:supportTicketId/history",
    shellFamily: "staff_entry_same_shell",
    continuityKey: "support.workspace.tickets",
    selectedAnchorPolicy: "history-summary-anchor-persists",
    dominantActionLabel: "Widen history only through the active disclosure ceiling",
    testId: "SupportHistoryRoute",
    shellMode: "route_bound",
    requiresMaskScope: true,
    allowsLiveMutation: false,
  },
  "ticket-knowledge": {
    routeKey: "ticket-knowledge",
    pathPattern: "/ops/support/tickets/:supportTicketId/knowledge",
    shellFamily: "staff_entry_same_shell",
    continuityKey: "support.workspace.tickets",
    selectedAnchorPolicy: "knowledge-binding-anchor-persists",
    dominantActionLabel: "Keep ranked knowledge inside the same ticket shell",
    testId: "SupportKnowledgeRoute",
    shellMode: "route_bound",
    requiresMaskScope: true,
    allowsLiveMutation: false,
  },
  "ticket-action": {
    routeKey: "ticket-action",
    pathPattern: "/ops/support/tickets/:supportTicketId/actions/:actionKey",
    shellFamily: "staff_entry_same_shell",
    continuityKey: "support.workspace.tickets",
    selectedAnchorPolicy: "action-workbench-persists",
    dominantActionLabel: "Stage one limited support action at a time",
    testId: "SupportActionRoute",
    shellMode: "route_bound",
    requiresMaskScope: true,
    allowsLiveMutation: true,
  },
  "ticket-observe": {
    routeKey: "ticket-observe",
    pathPattern: "/ops/support/tickets/:supportTicketId/observe/:supportObserveSessionId",
    shellFamily: "staff_entry_same_shell",
    continuityKey: "support.workspace.tickets",
    selectedAnchorPolicy: "observe-session-anchor-persists",
    dominantActionLabel: "Keep observe-only status visible and same-shell",
    testId: "SupportObserveRoute",
    shellMode: "observe_only",
    requiresMaskScope: true,
    allowsLiveMutation: false,
  },
  "ticket-replay": {
    routeKey: "ticket-replay",
    pathPattern: "/ops/support/replay/:supportReplaySessionId",
    shellFamily: "staff_entry_same_shell",
    continuityKey: "support.workspace.tickets",
    selectedAnchorPolicy: "replay-boundary-anchor-persists",
    dominantActionLabel: "Inspect frozen replay evidence without reopening writable authority",
    testId: "SupportReplayRoute",
    shellMode: "replay",
    requiresMaskScope: true,
    allowsLiveMutation: false,
  },
};

function normalizePathname(pathname: string): string {
  if (!pathname || pathname === "/") {
    return "/workspace";
  }
  return pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

function readLocation() {
  if (typeof window === "undefined") {
    return {
      pathname: `/ops/support/tickets/${DEFAULT_TICKET_ID}`,
      search: "?state=calm&anchor=envelope_214_reply",
    };
  }
  return {
    pathname: normalizePathname(window.location.pathname),
    search: window.location.search,
  };
}

function labelize(value: string): string {
  return value.replace(/_/g, " ");
}

function parseScenario(search: string): SupportWorkspaceScenario {
  const value = new URLSearchParams(search).get("state");
  if (value === "active" || value === "provisional" || value === "degraded" || value === "blocked" || value === "calm") {
    return value;
  }
  return "calm";
}

function parseAnchor(search: string): string {
  return new URLSearchParams(search).get("anchor") ?? "envelope_214_reply";
}

function parseFallbackReason(search: string): SupportFallbackReason {
  const value = new URLSearchParams(search).get("fallback");
  switch (value) {
    case "route_intent_drift":
    case "observe_session_drift":
    case "replay_restore_failure":
    case "publication_drift":
    case "disclosure_drift":
      return value;
    default:
      return "none";
  }
}

function parseDisclosureState(search: string): SupportDisclosureState {
  const value = new URLSearchParams(search).get("disclosure");
  switch (value) {
    case "expanded":
    case "expired":
    case "revoked":
      return value;
    default:
      return "summary_only";
  }
}

function parseAssistState(search: string): SupportKnowledgeAssistQueryState {
  const value = new URLSearchParams(search).get("assist");
  switch (value) {
    case "executable":
    case "preview_only":
    case "stale":
    case "blocked":
      return value;
    default:
      return "auto";
  }
}

function parseReplayState(search: string): SupportReplayState {
  const value = new URLSearchParams(search).get("replay");
  switch (value) {
    case "delta_review":
    case "restore_required":
    case "restore_ready":
    case "restored":
    case "read_only_recovery":
      return value;
    case "frozen":
    default:
      return "frozen";
  }
}

function parseDeltaReviewState(search: string): SupportReplayDeltaReviewState {
  const value = new URLSearchParams(search).get("delta");
  switch (value) {
    case "queued":
    case "blocking":
      return value;
    case "none":
    default:
      return "none";
  }
}

function parseRestoreState(search: string): SupportReplayRestoreState {
  const value = new URLSearchParams(search).get("restore");
  switch (value) {
    case "ready":
    case "blocked":
    case "restored":
    case "read_only_recovery":
      return value;
    case "required":
    default:
      return "required";
  }
}

function parseLinkedContextMode(search: string): SupportLinkedContextMode {
  const value = new URLSearchParams(search).get("linked");
  switch (value) {
    case "knowledge":
    case "subject":
      return value;
    case "history":
    default:
      return "history";
  }
}

function materializeSupportRoutePath(route: ParsedSupportRoute): string {
  switch (route.routeKey) {
    case "ticket-history":
      return `/ops/support/tickets/${route.supportTicketId}/history`;
    case "ticket-knowledge":
      return `/ops/support/tickets/${route.supportTicketId}/knowledge`;
    case "ticket-action":
      return `/ops/support/tickets/${route.supportTicketId}/actions/${route.actionKey ?? "controlled_resend"}`;
    case "ticket-observe":
      return `/ops/support/tickets/${route.supportTicketId}/observe/${route.observeSessionId ?? DEFAULT_OBSERVE_SESSION_ID}`;
    case "ticket-replay":
      return `/ops/support/replay/${route.replaySessionId ?? DEFAULT_REPLAY_SESSION_ID}`;
    case "ticket-conversation":
      return `/ops/support/tickets/${route.supportTicketId}/conversation`;
    default:
      return `/ops/support/tickets/${route.supportTicketId}`;
  }
}

function parseSupportRoute(pathname: string): ParsedSupportRoute {
  const normalized = normalizePathname(pathname);
  const replayMatch = normalized.match(/^\/ops\/support\/replay\/([^/]+)$/);
  if (replayMatch) {
    return {
      routeKey: "ticket-replay",
      supportTicketId: DEFAULT_TICKET_ID,
      replaySessionId: replayMatch[1] ?? DEFAULT_REPLAY_SESSION_ID,
    };
  }

  const observeMatch = normalized.match(/^\/ops\/support\/tickets\/([^/]+)\/observe\/([^/]+)$/);
  if (observeMatch) {
    return {
      routeKey: "ticket-observe",
      supportTicketId: observeMatch[1] ?? DEFAULT_TICKET_ID,
      observeSessionId: observeMatch[2] ?? DEFAULT_OBSERVE_SESSION_ID,
    };
  }

  const historyMatch = normalized.match(/^\/ops\/support\/tickets\/([^/]+)\/history$/);
  if (historyMatch) {
    return {
      routeKey: "ticket-history",
      supportTicketId: historyMatch[1] ?? DEFAULT_TICKET_ID,
    };
  }

  const knowledgeMatch = normalized.match(/^\/ops\/support\/tickets\/([^/]+)\/knowledge$/);
  if (knowledgeMatch) {
    return {
      routeKey: "ticket-knowledge",
      supportTicketId: knowledgeMatch[1] ?? DEFAULT_TICKET_ID,
    };
  }

  const actionMatch = normalized.match(/^\/ops\/support\/tickets\/([^/]+)\/actions\/([^/]+)$/);
  if (actionMatch) {
    return {
      routeKey: "ticket-action",
      supportTicketId: actionMatch[1] ?? DEFAULT_TICKET_ID,
      actionKey: actionMatch[2] as SupportActionKey,
    };
  }

  const conversationMatch = normalized.match(/^\/ops\/support\/tickets\/([^/]+)\/conversation$/);
  if (conversationMatch) {
    return {
      routeKey: "ticket-conversation",
      supportTicketId: conversationMatch[1] ?? DEFAULT_TICKET_ID,
    };
  }

  const overviewMatch = normalized.match(/^\/ops\/support\/tickets\/([^/]+)$/);
  if (overviewMatch) {
    return {
      routeKey: "ticket-overview",
      supportTicketId: overviewMatch[1] ?? DEFAULT_TICKET_ID,
    };
  }

  return {
    routeKey: "ticket-overview",
    supportTicketId: DEFAULT_TICKET_ID,
  };
}

export function isSupportWorkspacePath(pathname: string): boolean {
  const normalized = normalizePathname(pathname);
  return normalized.startsWith("/ops/support/tickets/") || normalized.startsWith("/ops/support/replay/");
}

function scenarioLabel(scenario: SupportWorkspaceScenario): string {
  switch (scenario) {
    case "active":
      return "Active action";
    case "provisional":
      return "Provisional";
    case "degraded":
      return "Degraded";
    case "blocked":
      return "Blocked";
    case "calm":
    default:
      return "Calm";
  }
}

function fallbackReasonLabel(fallbackReason: SupportFallbackReason): string {
  switch (fallbackReason) {
    case "route_intent_drift":
      return "Route intent drift";
    case "observe_session_drift":
      return "Observe session drift";
    case "replay_restore_failure":
      return "Replay restore failure";
    case "publication_drift":
      return "Runtime publication drift";
    case "disclosure_drift":
      return "Disclosure drift";
    case "none":
    default:
      return "No fallback";
  }
}

function deriveFallbackReason(route: ParsedSupportRoute, scenario: SupportWorkspaceScenario, fallbackReason: SupportFallbackReason): SupportFallbackReason {
  if (fallbackReason !== "none") {
    return fallbackReason;
  }
  if (scenario === "blocked") {
    if (route.routeKey === "ticket-observe") {
      return "observe_session_drift";
    }
    if (route.routeKey === "ticket-replay") {
      return "replay_restore_failure";
    }
    return "route_intent_drift";
  }
  if (scenario === "degraded") {
    return route.routeKey === "ticket-history" ? "disclosure_drift" : "publication_drift";
  }
  return "none";
}

function deriveShellMode(route: ParsedSupportRoute, scenario: SupportWorkspaceScenario, fallbackReason: SupportFallbackReason): SupportShellMode {
  if (fallbackReason !== "none" && (scenario === "blocked" || scenario === "degraded")) {
    return "read_only_recovery";
  }
  if (route.routeKey === "ticket-replay") {
    return "replay";
  }
  if (route.routeKey === "ticket-observe") {
    return "observe_only";
  }
  if (scenario === "provisional") {
    return "provisional";
  }
  return "live";
}

function deriveMaskScopeRef(shellMode: SupportShellMode, disclosureState: SupportDisclosureState): string {
  if (shellMode === "read_only_recovery") {
    return "mask_scope_support_recovery_summary";
  }
  if (shellMode === "observe_only") {
    return disclosureState === "expanded" ? "mask_scope_support_observe_governed_expand" : "mask_scope_support_observe_summary";
  }
  if (shellMode === "replay") {
    return "mask_scope_support_replay_boundary";
  }
  if (disclosureState === "expanded") {
    return "mask_scope_support_governed_expand";
  }
  return "mask_scope_support_summary";
}

function buildKnowledgeState(
  assistState: SupportKnowledgeAssistQueryState,
  shellMode: SupportShellMode,
  scenario: SupportWorkspaceScenario,
): SupportKnowledgeAssistLeaseState {
  if (assistState !== "auto") {
    return assistState;
  }
  if (shellMode === "read_only_recovery") {
    return "blocked";
  }
  if (shellMode === "observe_only" || shellMode === "replay") {
    return "preview_only";
  }
  if (scenario === "degraded") {
    return "stale";
  }
  return "executable";
}

function buildTimelineEvents(
  scenario: SupportWorkspaceScenario,
  shellMode: SupportShellMode,
  selectedAnchorRef: string,
): readonly SupportTimelineEvent[] {
  const repairSummary =
    shellMode === "read_only_recovery"
      ? "Repair is paused while the ticket refreshes."
      : shellMode === "replay"
        ? "Replay shows the saved review point."
        : scenario === "blocked"
          ? "Repair is held while the ticket is rechecked."
          : "Current message and callback details are ready.";

  return [
    {
      eventId: "event_subject_reply",
      anchorRef: "envelope_214_reply",
      laneLabel: "Patient",
      channel: "secure_message",
      title: "Patient reported a missing email",
      summary: "Secure-link email did not arrive. Callback requested.",
      actor: "Patient",
      timeLabel: "08:41",
      state: "authoritative",
      maskedState: "summary_only",
      maskReason: "Message text hidden.",
      nextActionHint: "Review delivery proof",
      clusterLabel: "Current exchange",
    },
    {
      eventId: "event_delivery_failure",
      anchorRef: "delivery_failure_bundle",
      laneLabel: "Email",
      channel: "email",
      title: "Email delivery failed",
      summary: "Confirmation email failed after send.",
      actor: "System",
      timeLabel: "08:44",
      state: "authoritative",
      maskedState: "none",
      maskReason: null,
      nextActionHint: "Proceed with repair",
      clusterLabel: "Repair evidence",
    },
    {
      eventId: "event_callback_summary",
      anchorRef: "callback_summary_214",
      laneLabel: "Callback",
      channel: "callback",
      title: "Same-day callback promised",
      summary:
        shellMode === "replay"
          ? "Callback promise remains visible in replay."
          : "Callback stays active while the contact route is checked.",
      actor: "Marta Singh",
      timeLabel: "08:48",
      state: "authoritative",
      maskedState: "summary_only",
      maskReason: "Callback details hidden.",
      nextActionHint: "Keep callback visible",
      clusterLabel: "Shared chronology",
    },
    {
      eventId: "event_repair_preview",
      anchorRef: "repair_preview_219",
      laneLabel: "Action",
      channel: "workflow",
      title: shellMode === "replay" ? "Resend review point saved" : "Resend ready for review",
      summary: repairSummary,
      actor: "Support",
      timeLabel: "08:51",
      state: shellMode === "read_only_recovery" || scenario === "blocked" ? "blocked" : "provisional",
      maskedState: "limited",
      maskReason: "Preview details hidden.",
      nextActionHint:
        shellMode === "read_only_recovery"
          ? "Refresh before sending"
          : selectedAnchorRef === "repair_preview_219"
            ? "Check details before sending"
            : "Send only if details remain valid",
      clusterLabel: "Repair action",
    },
    {
      eventId: "event_repair_settlement",
      anchorRef: "settlement_219",
      laneLabel: "Outcome",
      channel: "internal_note",
      title: "Latest action recorded",
      summary:
        shellMode === "read_only_recovery"
          ? "Last action remains visible while live controls are paused."
          : scenario === "provisional"
            ? "Action is pending receipt update."
            : "Repair step is complete and linked to this ticket.",
      actor: "Support",
      timeLabel: "08:54",
      state: shellMode === "read_only_recovery" ? "blocked" : scenario === "provisional" ? "provisional" : "authoritative",
      maskedState: "none",
      maskReason: null,
      nextActionHint: "Complete",
      clusterLabel: "Outcome",
    },
  ];
}

function createFallbackProjection(
  route: ParsedSupportRoute,
  fallbackReason: SupportFallbackReason,
  selectedAnchorRef: string,
  actionLabel: string,
): SupportReadOnlyFallbackProjection | null {
  if (fallbackReason === "none") {
    return null;
  }

  const basePaths = {
    liveTicket: `/ops/support/tickets/${route.supportTicketId}`,
    observe: `/ops/support/tickets/${route.supportTicketId}/observe/${route.observeSessionId ?? DEFAULT_OBSERVE_SESSION_ID}`,
    replay: `/ops/support/replay/${route.replaySessionId ?? DEFAULT_REPLAY_SESSION_ID}`,
    queue: "/ops/support/inbox/repair",
  };

  const reacquirePaths =
    fallbackReason === "observe_session_drift"
      ? [
          {
            title: "Reopen observe status",
            summary: "Mint a fresh observe session against the same ticket anchor and disclosure ceiling.",
            routePath: basePaths.observe,
            routeLabel: "Observe route",
          },
          {
            title: "Return to live summary",
            summary: "Drop back to the approved ticket overview without widening detail.",
            routePath: basePaths.liveTicket,
            routeLabel: "Ticket overview",
          },
          {
            title: "Return to repair inbox",
            summary: "Keep the current queue context if further inspection is no longer lawful.",
            routePath: basePaths.queue,
            routeLabel: "Repair inbox",
          },
        ]
      : fallbackReason === "replay_restore_failure"
        ? [
            {
              title: "Re-open replay boundary",
              summary: "Restore from the current replay checkpoint only after the evidence boundary is live again.",
              routePath: basePaths.replay,
              routeLabel: "Replay route",
            },
            {
              title: "Return to ticket summary",
              summary: "Stay on the same ticket anchor while live restore remains blocked.",
              routePath: basePaths.liveTicket,
              routeLabel: "Ticket overview",
            },
            {
              title: "Return to repair inbox",
              summary: "Preserve the pinned queue summary while replay restore remains blocked.",
              routePath: basePaths.queue,
              routeLabel: "Repair inbox",
            },
          ]
        : fallbackReason === "disclosure_drift"
          ? [
              {
                title: "Re-request approved history widen",
                summary: "Require a fresh disclosure record before exposing deeper history rows.",
                routePath: `/ops/support/tickets/${route.supportTicketId}/history`,
                routeLabel: "History route",
              },
              {
                title: "Return to summary-only ticket view",
                summary: "Keep the same chronology without carrying stale expanded context.",
                routePath: basePaths.liveTicket,
                routeLabel: "Ticket overview",
              },
              {
                title: "Return to repair inbox",
                summary: "Preserve queue position while history disclosure is reacquired.",
                routePath: basePaths.queue,
                routeLabel: "Repair inbox",
              },
            ]
          : [
              {
                title: "Refresh route authority",
                summary: "Revalidate continuity, runtime publication, and the active route-intent tuple.",
                routePath: basePaths.liveTicket,
                routeLabel: "Ticket overview",
              },
              {
                title: "Open summary-safe knowledge",
                summary: "Stay in the same shell, but collapse to summary-safe guidance until bindings are live again.",
                routePath: `/ops/support/tickets/${route.supportTicketId}/knowledge`,
                routeLabel: "Knowledge route",
              },
              {
                title: "Return to repair inbox",
                summary: "Keep the approved inbox summary visible while writable status remains unavailable.",
                routePath: basePaths.queue,
                routeLabel: "Repair inbox",
              },
            ];

  return {
    projectionName: "SupportReadOnlyFallbackProjection",
    supportReadOnlyFallbackProjectionId: `support_read_only_fallback_${fallbackReason}`,
    supportTicketId: route.supportTicketId,
    reasonCode: `SUPPORT_222_${fallbackReason.toUpperCase()}`,
    fallbackClass: fallbackReason,
    selectedTimelineAnchorRef: selectedAnchorRef,
    strongestConfirmedArtifactRef: "support_artifact_delivery_failure_bundle",
    strongestConfirmedArtifactLabel: "Latest confirmed delivery artifact",
    strongestConfirmedArtifactSummary:
      fallbackReason === "replay_restore_failure"
        ? "Replay keeps the settlement and latest delivery artifact visible, but live restore remains blocked."
        : "The latest delivery failure bundle remains the strongest confirmed artifact still safe to display.",
    strongestConfirmedArtifactState: "recovery_only",
    heldActionSummary: `${actionLabel} remains summary-only until the current support status is reacquired.`,
    queueReturnPath: "/ops/support/inbox/repair",
    queueReturnLabel: "Return to repair inbox",
    reacquirePaths,
  };
}

function createSupportWorkspaceDataset(
  route: ParsedSupportRoute,
  query: SupportWorkspaceQueryState,
): SupportWorkspaceDataset {
  const fallbackReason = deriveFallbackReason(route, query.scenario, query.fallbackReason);
  const shellMode = deriveShellMode(route, query.scenario, fallbackReason);
  const effectiveMaskScopeRef = deriveMaskScopeRef(shellMode, query.disclosureState);
  const replayRouteActive = route.routeKey === "ticket-replay" || fallbackReason === "replay_restore_failure";
  const replayState: SupportReplayState =
    !replayRouteActive
      ? "frozen"
      : shellMode === "read_only_recovery"
        ? "read_only_recovery"
        : query.replayState;
  const deltaReviewState: SupportReplayDeltaReviewState =
    !replayRouteActive
      ? "none"
      : replayState === "delta_review"
        ? query.deltaReviewState === "none"
          ? "queued"
          : query.deltaReviewState
        : replayState === "read_only_recovery"
          ? "blocking"
          : query.deltaReviewState;
  const restoreState: SupportReplayRestoreState =
    !replayRouteActive
      ? "required"
      : replayState === "restore_ready"
        ? "ready"
        : replayState === "restored"
          ? "restored"
          : replayState === "read_only_recovery"
            ? "read_only_recovery"
            : query.restoreState;
  const actionKey = route.actionKey ?? "controlled_resend";
  const phase2Search = new URLSearchParams();
  phase2Search.set("state", query.scenario);
  phase2Search.set("anchor", query.selectedAnchorRef);
  if (fallbackReason !== "none") {
    phase2Search.set("fallback", fallbackReason);
  }
  const phase2Context = resolvePortalSupportPhase2Context({
    pathname: materializeSupportRoutePath(route),
    search: `?${phase2Search.toString()}`,
  });
  const knowledgeLeaseState = buildKnowledgeState(query.assistState, shellMode, query.scenario);
  const patientReceiptParity =
    shellMode === "read_only_recovery" || query.scenario === "blocked"
      ? "blocked"
      : query.scenario === "provisional"
        ? "provisional"
        : "authoritative";
  const freshness =
    shellMode === "replay"
      ? "paused_replay"
      : shellMode === "read_only_recovery"
        ? "read_only"
        : query.scenario === "degraded"
          ? "stale"
          : query.scenario === "provisional"
            ? "queued_delta_review"
            : "live";

  const actionControlsState: SupportActionView["controlsState"] =
    shellMode === "read_only_recovery"
      ? "read_only"
      : shellMode === "observe_only" || shellMode === "replay"
        ? "preview"
        : query.scenario === "blocked"
          ? "blocked"
          : query.scenario === "degraded"
            ? "read_only"
            : query.scenario === "provisional"
              ? "preview"
              : "enabled";

  const timelineEvents = buildTimelineEvents(query.scenario, shellMode, query.selectedAnchorRef);

  const actionViewMap: Record<SupportActionKey, Omit<SupportActionView, "controlsState">> = {
    controlled_resend: {
      actionKey: "controlled_resend",
      label: "Controlled resend",
      summary: "Resend the current message and keep the callback promise visible.",
      previewLabel: "Preview shows the failed delivery, callback promise, and message destination.",
      confirmationLabel: "Send only after the current contact details and patient reply step are still valid.",
      nextStepLabel:
        shellMode === "read_only_recovery"
          ? "Refresh the ticket before sending."
          : "Review the preview, then send or hold.",
    },
    channel_change: {
      actionKey: "channel_change",
      label: "Channel change",
      summary: "Switch the outbound route to SMS while keeping the callback promise visible.",
      previewLabel: "Preview shows the SMS destination and the current delivery risk.",
      confirmationLabel: "Sending stays blocked if the contact details are disputed.",
      nextStepLabel: "Confirm the contact route and callback fallback before sending.",
    },
    callback_reschedule: {
      actionKey: "callback_reschedule",
      label: "Callback reschedule",
      summary: "Adjust the callback promise from this ticket.",
      previewLabel: "Preview shows the callback route and current delivery risk.",
      confirmationLabel: "Confirm the callback update before returning to the conversation.",
      nextStepLabel: "Update the callback promise and return to the current message.",
    },
    attachment_recovery: {
      actionKey: "attachment_recovery",
      label: "Attachment recovery",
      summary: "Recover access to the required attachment from this ticket.",
      previewLabel: "Preview shows the attachment issue and the latest patient message.",
      confirmationLabel: "Sending stays blocked if the attachment details are out of date.",
      nextStepLabel: "Confirm the attachment details, then reopen the attachment route.",
    },
    identity_correction: {
      actionKey: "identity_correction",
      label: "Identity correction",
      summary: "Prepare an identity correction request for the current ticket.",
      previewLabel: "Preview shows the identity issue and the information already checked.",
      confirmationLabel: "Only send once the identity evidence is ready.",
      nextStepLabel: "Collect evidence and hand off for approval.",
    },
  };

  const actionView: SupportActionView = {
    ...actionViewMap[actionKey],
    controlsState: actionControlsState,
  };

  const fallbackProjection = createFallbackProjection(route, fallbackReason, query.selectedAnchorRef, actionView.label);

  const strongestArtifact: SupportPresentationArtifact = {
    projectionName: "SupportPresentationArtifact",
    supportPresentationArtifactId: "support_presentation_artifact_delivery_failure",
    supportTicketId: route.supportTicketId,
    anchorRef: "delivery_failure_bundle",
    title: "Latest confirmed delivery artifact",
    summary:
      shellMode === "replay"
        ? "Replay exposes the delivery-failure summary and settlement history, but keeps later mutable content outside the boundary."
        : shellMode === "read_only_recovery"
          ? "Recovery status keeps only the strongest confirmed delivery artifact inline."
          : "Inline summary confirms the latest delivery failure bundle and the attached settlement chain.",
    artifactState:
      shellMode === "read_only_recovery"
        ? "recovery_only"
        : query.scenario === "provisional"
          ? "parity_warning"
          : shellMode === "replay"
            ? "summary_only"
            : "inline_renderable",
    maskScopeRef: effectiveMaskScopeRef,
    safeTransferState: shellMode === "read_only_recovery" ? "recovery_only" : "grant_required",
  };

  const subject360: Subject360SummaryProjection = {
    projectionName: "SupportSubject360Projection",
    supportSubject360ProjectionId: "support_subject_360_218_delivery_failure",
    maskedSubjectLabel: "Subject ending 214",
    repeatContactSignal: "Repeat contact in last 48h",
    currentChannels: ["Secure message", "Email", "Callback"],
    linkedRefs: [
      phase2Context.fixture.requestLineageRef,
      phase2Context.fixture.communicationClusterRef,
      phase2Context.fixture.communicationThreadRef,
      phase2Context.fixture.requestRef,
    ],
    currentRiskSummary:
      shellMode === "read_only_recovery"
        ? phase2Context.communicationStateLabel
        : shellMode === "observe_only"
          ? "Observe mode keeps identity and contact context summary-first."
          : shellMode === "replay"
            ? "Replay keeps the current delivery-failure question frozen against the same ticket anchor."
            : phase2Context.communicationStateLabel,
  };

  const workbenchProjection: SupportActionWorkbenchProjection = {
    projectionName: "SupportActionWorkbenchProjection",
    supportActionWorkbenchProjectionId: "support_action_workbench_projection_222_delivery_failure",
    supportTicketId: route.supportTicketId,
    supportMutationAttemptRef: "support_mutation_attempt_219_delivery_failure",
    supportActionSettlementRef: shellMode === "read_only_recovery" ? null : "support_action_settlement_219_delivery_failure",
    mutatingControlsState:
      shellMode === "live"
        ? "enabled"
        : shellMode === "provisional" || shellMode === "replay"
          ? "suspended_for_replay"
          : "read_only",
    allowedRepairKinds: [
      "controlled_resend",
      "channel_change",
      "callback_reschedule",
      "attachment_recovery",
      "identity_correction",
    ],
    reasonCodes:
      shellMode === "read_only_recovery"
        ? ["SUPPORT_222_READ_ONLY_FALLBACK_PRESERVE_STRONGEST_ARTIFACT"]
        : ["SUPPORT_219_REPAIR_CHAIN_CANONICAL_COMMUNICATION_BOUND"],
  };

  const reachability: SupportReachabilityPostureProjection = {
    projectionName: "SupportReachabilityPostureProjection",
    supportReachabilityPostureProjectionId: "support_reachability_posture_219_delivery_failure",
    supportTicketId: route.supportTicketId,
    providerName: actionKey === "channel_change" ? "twilio" : "sendgrid",
    channel: actionKey === "channel_change" ? "sms" : "email",
    deliveryEvidenceBundleRef: "message_delivery_evidence_bundle_214_failure",
    postureState:
      shellMode === "read_only_recovery"
        ? "blocked"
        : query.scenario === "active"
          ? "repairing"
          : query.scenario === "provisional"
            ? "at_risk"
            : "confirmed",
    reasonCodes: ["SUPPORT_219_REPAIR_CHAIN_CANONICAL_COMMUNICATION_BOUND"],
  };

  const timelineProjection: SupportOmnichannelTimelineProjection = {
    projectionName: "SupportOmnichannelTimelineProjection",
    supportOmnichannelTimelineProjectionId: "support_omnichannel_timeline_projection_222_delivery_failure",
    supportTicketId: route.supportTicketId,
    supportLineageBindingRef: "support_lineage_binding_218_delivery_failure_v1",
    supportLineageBindingHash: "support_lineage_binding_218_delivery_failure_hash",
    messageDispatchEnvelopeRef: "MessageDispatchEnvelope_214_reply",
    latestDeliveryEvidenceBundleRef: "message_delivery_evidence_bundle_214_failure",
    latestThreadExpectationEnvelopeRef: "thread_expectation_envelope_214",
    latestThreadResolutionGateRef: "thread_resolution_gate_214",
    supportMutationAttemptRef: "support_mutation_attempt_219_delivery_failure",
    supportActionSettlementRef: shellMode === "read_only_recovery" ? null : "support_action_settlement_219_delivery_failure",
    supportReplayCheckpointRef: shellMode === "replay" ? "support_replay_checkpoint_219_delivery_failure" : null,
    supportReplayRestoreSettlementRef:
      shellMode === "read_only_recovery" && route.routeKey === "ticket-replay"
        ? "support_replay_restore_settlement_219_delivery_failure"
        : null,
    patientReceiptEnvelopeRef: "patient_receipt_envelope_214_reply",
    patientReceiptParity,
    chronologyRefs: timelineEvents.map((event) => event.eventId),
    provisionalEventRefs: timelineEvents.filter((event) => event.state === "provisional").map((event) => event.eventId),
    authoritativeEventRefs: timelineEvents.filter((event) => event.state === "authoritative").map((event) => event.eventId),
    freshness,
    supportActionWorkbenchProjection: workbenchProjection,
    supportReachabilityPostureProjection: reachability,
    reasonCodes: ["SUPPORT_219_REPAIR_CHAIN_CANONICAL_COMMUNICATION_BOUND"],
    generatedAt: "2026-04-16T09:22:00Z",
  };

  const actionLease: SupportActionLease = {
    projectionName: "SupportActionLease",
    supportActionLeaseId: "support_action_lease_222_delivery_failure",
    supportTicketId: route.supportTicketId,
    actionRef: actionKey,
    leaseState:
      shellMode === "live"
        ? "live"
        : shellMode === "observe_only"
          ? "observe_only"
          : shellMode === "provisional" || shellMode === "replay"
            ? "stale"
            : "blocked",
    observeOnly: shellMode === "observe_only",
    maskScopeRef: effectiveMaskScopeRef,
    selectedTimelineAnchorRef: query.selectedAnchorRef,
    expiresAtLabel:
      shellMode === "read_only_recovery"
        ? "Lease blocked now"
        : shellMode === "replay"
          ? "Lease suspended until replay exits"
          : "Lease valid for 14m",
  };

  const actionSettlement: SupportActionSettlement = {
    projectionName: "SupportActionSettlement",
    supportActionSettlementId: "support_action_settlement_219_delivery_failure",
    supportTicketId: route.supportTicketId,
    supportActionRecordId: "support_action_record_219_delivery_failure",
    result: patientReceiptParity,
    settlementHint:
      shellMode === "read_only_recovery"
        ? "Live changes are unavailable. The last completed action remains visible."
        : shellMode === "replay"
          ? "Replay is active. Live changes resume after restore."
          : query.scenario === "provisional"
            ? "Preview staged. Waiting for completion."
            : "Latest action completed and tied to this ticket.",
    recordedAtLabel: "08:54",
  };

  const continuityEvidence: SupportContinuityEvidenceProjection = {
    projectionName: "SupportContinuityEvidenceProjection",
    supportContinuityEvidenceProjectionId: "support_continuity_evidence_projection_222_delivery_failure",
    supportTicketId: route.supportTicketId,
    supportLineageBindingRef: "support_lineage_binding_218_delivery_failure_v1",
    supportLineageBindingHash: "support_lineage_binding_218_delivery_failure_hash",
    routeFamilyRef: "rf_support_ticket_workspace",
    selectedAnchorRef: query.selectedAnchorRef,
    selectedAnchorTupleHashRef: `tuple_${query.selectedAnchorRef}`,
    continuityTupleHash: `support.workspace.tickets:${query.selectedAnchorRef}`,
    validationState:
      shellMode === "read_only_recovery"
        ? "blocked"
        : query.scenario === "degraded"
          ? "degraded"
          : "trusted",
    blockingRefs:
      shellMode === "read_only_recovery"
        ? ["continuity_tuple_drift", "runtime_binding_recovery_only", fallbackReason]
        : [],
    capturedAt: "2026-04-16T09:21:00Z",
  };

  const runtimeBinding: SupportSurfaceRuntimeBinding = {
    projectionName: "SupportSurfaceRuntimeBinding",
    supportSurfaceRuntimeBindingId: "support_surface_runtime_binding_222_delivery_failure",
    routeFamilyRef: "rf_support_ticket_workspace",
    clientCachePolicyRef: "support_ticket_cache_policy_v1",
    frontendContractManifestRef: "support_frontend_manifest_222",
    bindingState: shellMode === "read_only_recovery" ? "recovery_only" : "live",
    validatedAt: "09:20",
  };

  const knowledgeBindingState =
    shellMode === "read_only_recovery"
      ? "blocked"
      : shellMode === "observe_only" || shellMode === "replay"
        ? "observe_only"
        : knowledgeLeaseState === "stale"
          ? "stale"
          : "live";

  const knowledgeCards: readonly SupportKnowledgeCardView[] = [
    {
      recommendationRef: "knowledge_delivery_failure_playbook",
      kind: "playbook",
      title: "Repair steps",
      whyNow: "Use current email failure and callback details.",
      freshness: knowledgeBindingState === "stale" ? "review overdue 3d" : "reviewed 2h ago",
      owner: "Support reliability",
      policyMarker: "Policy pack 24.6",
      previewLabel: "Review resend steps and callback wording.",
      applyLabel: knowledgeLeaseState === "executable" ? "Open" : "Preview",
      permittedDisclosure: "Uses summary detail unless full history is opened",
      state:
        knowledgeBindingState === "blocked"
          ? "blocked"
          : knowledgeBindingState === "observe_only"
            ? "observe_only"
            : knowledgeBindingState === "stale"
              ? "stale"
              : "live",
    },
    {
      recommendationRef: "knowledge_callback_macro",
      kind: "macro",
      title: "Reply wording",
      whyNow: "Short message for a disputed email route.",
      freshness: knowledgeBindingState === "stale" ? "review overdue 6d" : "reviewed 1d ago",
      owner: "Messaging policy",
      policyMarker: "Channel caveat",
      previewLabel: "Check callback and resend wording.",
      applyLabel: knowledgeLeaseState === "executable" ? "Preview" : "Summary",
      permittedDisclosure: "Uses summary detail only",
      state:
        knowledgeBindingState === "blocked"
          ? "blocked"
          : knowledgeBindingState === "observe_only"
            ? "observe_only"
            : knowledgeBindingState === "stale"
              ? "stale"
              : "live",
    },
    {
      recommendationRef: "knowledge_runtime_notice",
      kind: "outage_note",
      title: "Pause note",
      whyNow: "Use if live actions pause during refresh.",
      freshness: "published now",
      owner: "Release control",
      policyMarker: "Service note",
      previewLabel: "Explain the current pause and refresh path.",
      applyLabel: "View",
      permittedDisclosure: "Summary-safe",
      state:
        knowledgeBindingState === "blocked"
          ? "blocked"
          : knowledgeBindingState === "observe_only"
            ? "observe_only"
            : "live",
    },
  ];
  const dominantKnowledgeCard = knowledgeCards[0]!;

  const knowledgeBinding: SupportKnowledgeBinding = {
    projectionName: "SupportKnowledgeBinding",
    supportKnowledgeBindingId: "support_knowledge_binding_222_delivery_failure",
    supportTicketId: route.supportTicketId,
    supportLineageBindingRef: "support_lineage_binding_218_delivery_failure_v1",
    primaryScopeMemberRef: "support_scope_member_214_thread",
    knowledgeStackProjectionRef: "support_knowledge_stack_projection_222",
    ticketVersionRef: "support_ticket_218_delivery_failure_v4",
    policyVersionRef: "policy_version_24_6",
    maskScopeRef: effectiveMaskScopeRef,
    routeFamilyRef: "rf_support_ticket_workspace",
    selectedTimelineAnchorRef: query.selectedAnchorRef,
    supportReachabilityPostureProjectionRef: reachability.supportReachabilityPostureProjectionId,
    supportActionWorkbenchProjectionRef: workbenchProjection.supportActionWorkbenchProjectionId,
    supportSurfaceRuntimeBindingRef: runtimeBinding.supportSurfaceRuntimeBindingId,
    publicationDigestRef: "publication_digest_support_knowledge_24_6",
    projectionCompatibilityDigestRef: "projection_digest_support_workspace_222",
    bindingHash: "knowledge_binding_hash_222",
    bindingState: knowledgeBindingState,
  };

  const subjectContextBindingState =
    query.disclosureState === "expanded" && shellMode !== "read_only_recovery"
      ? "expanded"
      : query.disclosureState === "expired"
        ? "stale"
        : query.disclosureState === "revoked" || fallbackReason === "disclosure_drift"
          ? "blocked"
          : "summary_only";

  const subjectContextBinding: SupportSubjectContextBinding = {
    projectionName: "SupportSubjectContextBinding",
    supportSubjectContextBindingId: "support_subject_context_binding_222_delivery_failure",
    supportTicketId: route.supportTicketId,
    supportLineageBindingRef: "support_lineage_binding_218_delivery_failure_v1",
    scopeMemberRefs: ["support_scope_member_214_thread"],
    subject360ProjectionRef: subject360.supportSubject360ProjectionId,
    supportKnowledgeBindingRef: knowledgeBinding.supportKnowledgeBindingId,
    ticketVersionRef: "support_ticket_218_delivery_failure_v4",
    selectedTimelineAnchorRef: query.selectedAnchorRef,
    maskScopeRef: effectiveMaskScopeRef,
    visibilityTier: query.disclosureState === "expanded" ? "governed_expand" : "support_summary",
    supportSurfaceRuntimeBindingRef: runtimeBinding.supportSurfaceRuntimeBindingId,
    contextWindowHash: "support_subject_context_window_hash_222",
    bindingState: subjectContextBindingState,
  };

  const disclosureRecord =
    query.disclosureState === "summary_only"
      ? null
      : {
          projectionName: "SupportContextDisclosureRecord",
          supportContextDisclosureRecordId: `support_context_disclosure_${query.disclosureState}`,
          supportTicketId: route.supportTicketId,
          supportSubjectContextBindingRef: subjectContextBinding.supportSubjectContextBindingId,
          supportKnowledgeAssistLeaseRef: null,
          openedFromRef: "history_panel",
          requestedScope: "expanded_history",
          requiredDisclosureClass: "governed_support_history_expand",
          reasonCode: "SUPPORT_222_HISTORY_DISCLOSURE",
          maskScopeRef: effectiveMaskScopeRef,
          jitScopeRef: query.disclosureState === "expanded" ? "jit_scope_history_expand_214" : null,
          decisionRef: "support_disclosure_decision_222",
          openedAt: "2026-04-16T09:08:00Z",
          expiresAt: "2026-04-16T09:26:00Z",
          closedAt: query.disclosureState === "expanded" ? null : "2026-04-16T09:18:00Z",
          disclosureState:
            query.disclosureState === "expanded"
              ? "active"
              : query.disclosureState === "expired"
                ? "expired"
                : "revoked",
        } satisfies SupportContextDisclosureRecord;

  const knowledgeAssistLease: SupportKnowledgeAssistLease = {
    projectionName: "SupportKnowledgeAssistLease",
    supportKnowledgeAssistLeaseId: "support_knowledge_assist_lease_222_delivery_failure",
    supportTicketId: route.supportTicketId,
    supportKnowledgeBindingRef: knowledgeBinding.supportKnowledgeBindingId,
    supportActionLeaseRef: actionLease.supportActionLeaseId,
    selectedRecommendationRef: dominantKnowledgeCard.recommendationRef,
    selectedMacroRef: "macro_callback_safe_explainer",
    selectedPlaybookRef: "playbook_delivery_failure_controlled_resend",
    selectedTemplateRef: null,
    assistIntent: route.routeKey === "ticket-knowledge" ? "launch_playbook" : "preview_macro",
    ticketVersionRef: "support_ticket_218_delivery_failure_v4",
    policyVersionRef: "policy_version_24_6",
    maskScopeRef: effectiveMaskScopeRef,
    supportSurfaceRuntimeBindingRef: runtimeBinding.supportSurfaceRuntimeBindingId,
    supportContextDisclosureRecordRef: disclosureRecord?.supportContextDisclosureRecordId ?? null,
    reasonCode:
      knowledgeLeaseState === "blocked"
        ? "SUPPORT_222_ASSIST_BLOCKED_BY_RECOVERY"
        : knowledgeLeaseState === "stale"
          ? "SUPPORT_222_ASSIST_STALE_BINDING"
          : knowledgeLeaseState === "preview_only"
            ? "SUPPORT_222_ASSIST_PREVIEW_ONLY"
            : "SUPPORT_222_ASSIST_EXECUTABLE",
    issuedAt: "2026-04-16T09:07:00Z",
    expiresAt: "2026-04-16T09:24:00Z",
    leaseState: knowledgeLeaseState,
  };

  const knowledgeStack: SupportKnowledgeStackProjection = {
    projectionName: "SupportKnowledgeStackProjection",
    supportKnowledgeStackProjectionId: "support_knowledge_stack_projection_222",
    supportTicketId: route.supportTicketId,
    supportLineageBindingRef: "support_lineage_binding_218_delivery_failure_v1",
    primaryScopeMemberRef: "support_scope_member_214_thread",
    ticketVersionRef: "support_ticket_218_delivery_failure_v4",
    selectedTimelineAnchorRef: query.selectedAnchorRef,
    supportReachabilityPostureProjectionRef: reachability.supportReachabilityPostureProjectionId,
    supportActionWorkbenchProjectionRef: workbenchProjection.supportActionWorkbenchProjectionId,
    supportKnowledgeBindingRef: knowledgeBinding.supportKnowledgeBindingId,
    supportSubjectContextBindingRef: subjectContextBinding.supportSubjectContextBindingId,
    dominantRecommendationRef: dominantKnowledgeCard.recommendationRef,
    secondaryRecommendationRefs: knowledgeCards.slice(1).map((card) => card.recommendationRef),
    relevanceReasonRefs: ["delivery_failure", "callback_promise", "repair_preview"],
    recommendedActionRef: actionKey,
    knowledgeGapState: knowledgeLeaseState === "blocked" ? "capturable" : "not_needed",
    promotionState: route.routeKey === "ticket-knowledge" ? "promoted" : "summary_only",
    freshnessState:
      knowledgeBindingState === "blocked"
        ? "runtime_blocked"
        : knowledgeBindingState === "observe_only"
          ? "observe_only"
          : knowledgeBindingState === "stale"
            ? "stale"
            : "live",
    renderedAt: "2026-04-16T09:20:00Z",
  };

  const historyRows: readonly SupportHistoryRow[] = [
    {
      historyRef: "history_repeat_contact_48h",
      timeLabel: "Yesterday",
      title: "Repeat contact pattern remains active",
      summary: "Subject contacted support twice after the secure-link route failed and the callback promise was issued.",
      maskedState: "summary_only",
      disclosureClass: "support_summary",
    },
    {
      historyRef: "history_prior_repair_attempt",
      timeLabel: "2 days ago",
      title: "Prior repair used the same callback-safe explanation",
      summary: "The previous ticket settled after support used a callback-safe summary rather than a full disclosure refresh.",
      maskedState: query.disclosureState === "expanded" ? "expanded" : "summary_only",
      disclosureClass: "expanded_history",
    },
    {
      historyRef: "history_duplicate_signal",
      timeLabel: "Last week",
      title: "Duplicate-safe context links the same request history",
      summary: "A prior duplicate review tied the same request and message thread together without widening subject detail.",
      maskedState: query.disclosureState === "expanded" ? "expanded" : "limited",
      disclosureClass: "linked_object_detail",
    },
  ];

  const observeSession =
    route.routeKey === "ticket-observe" || fallbackReason === "observe_session_drift"
      ? {
          projectionName: "SupportObserveSession",
          supportObserveSessionId: route.observeSessionId ?? DEFAULT_OBSERVE_SESSION_ID,
          supportTicketId: route.supportTicketId,
          supportLineageBindingRef: "support_lineage_binding_218_delivery_failure_v1",
          primaryScopeMemberRef: "support_scope_member_214_thread",
          entryRef: "observe_entry_218_delivery_failure",
          entryReasonCode: "SUPPORT_222_OBSERVE_ENTRY",
          ticketVersionRef: "support_ticket_218_delivery_failure_v4",
          selectedTimelineAnchorRef: query.selectedAnchorRef,
          selectedTimelineAnchorTupleHashRef: `tuple_${query.selectedAnchorRef}`,
          supportRouteIntentTokenRef: "support_route_intent_token_222_observe",
          maskScopeRef: effectiveMaskScopeRef,
          disclosureCeilingRef: "disclosure_ceiling_support_observe_summary",
          subjectContextBindingRef: subjectContextBinding.supportSubjectContextBindingId,
          knowledgeBindingRef: knowledgeBinding.supportKnowledgeBindingId,
          supportSurfaceRuntimeBindingRef: runtimeBinding.supportSurfaceRuntimeBindingId,
          supportContinuityEvidenceProjectionRef: continuityEvidence.supportContinuityEvidenceProjectionId,
          stepUpState: query.disclosureState === "expanded" ? "not_required" : "required",
          observeState: shellMode === "read_only_recovery" ? "stale" : "active",
          createdAt: "2026-04-16T09:09:00Z",
        } satisfies SupportObserveSession
      : null;

  const replayEvidenceBoundary =
    replayRouteActive
      ? {
          projectionName: "SupportReplayEvidenceBoundary",
          supportReplayEvidenceBoundaryId: "support_replay_evidence_boundary_219_delivery_failure",
          supportReplayCheckpointRef: "support_replay_checkpoint_219_delivery_failure",
          supportLineageBindingRef: "support_lineage_binding_218_delivery_failure_v1",
          primaryScopeMemberRef: "support_scope_member_214_thread",
          ticketVersionRef: "support_ticket_218_delivery_failure_v4",
          authoritativeEventCutoffRef: "event_repair_preview",
          selectedTimelineAnchorTupleHashRef: `tuple_${query.selectedAnchorRef}`,
          includedEventRefs: ["event_subject_reply", "event_delivery_failure", "event_callback_summary", "event_repair_preview"],
          includedArtifactRefs: ["support_artifact_delivery_failure_bundle", "support_resolution_snapshot_221_delivery_failure"],
          artifactBindingRefs: ["support_lineage_artifact_binding_214_reply", "support_lineage_artifact_binding_214_dispatch"],
          excludedDraftRefs: ["support_draft_hold_reply_214"],
          excludedOutboundAttemptRefs: ["support_outbound_attempt_pending_214"],
          latestActionSettlementRef: "support_action_settlement_219_delivery_failure",
          latestMutationAttemptRef: "support_mutation_attempt_219_delivery_failure",
          externalConfirmationFenceRef: "external_confirmation_fence_214",
          maskScopeRef: effectiveMaskScopeRef,
          disclosureCeilingRef: "disclosure_ceiling_support_replay_boundary",
          boundaryHash: "support_replay_boundary_hash_219",
        } satisfies SupportReplayEvidenceBoundary
      : null;

  const replaySession =
    replayRouteActive
      ? {
          projectionName: "SupportReplaySession",
          supportReplaySessionId: route.replaySessionId ?? DEFAULT_REPLAY_SESSION_ID,
          supportTicketId: route.supportTicketId,
          supportReplayCheckpointId: "support_replay_checkpoint_219_delivery_failure",
          supportReplayEvidenceBoundaryRef: replayEvidenceBoundary?.supportReplayEvidenceBoundaryId ?? "support_replay_evidence_boundary_219_delivery_failure",
          currentMaskScopeRef: effectiveMaskScopeRef,
          disclosureCeilingRef: "disclosure_ceiling_support_replay_boundary",
          restoreState:
            replayState === "delta_review"
              ? "delta_review"
              : replayState === "restore_required"
                ? "restore_required"
                : replayState === "restore_ready"
                  ? "restore_ready"
                  : replayState === "restored"
                    ? "restored"
                    : replayState === "read_only_recovery"
                      ? "read_only_recovery"
                      : "frozen",
          investigationQuestion: "Why did the secure-link email failure require a callback-safe resend path?",
          queueAnchorRef: "repair_queue_anchor",
          selectedTimelineAnchorRef: query.selectedAnchorRef,
          returnRouteLabel: "Return to approved ticket summary",
        } satisfies SupportReplaySession
      : null;

  const replayDeltaReviewItems: readonly SupportReplayDeltaReviewItem[] =
    !replayRouteActive
      ? []
      : ([
          {
            deltaId: "delta_provider_retry_queued",
            title: "Provider retry landed after replay entry",
            summary: "A later provider retry notice arrived outside the frozen boundary and needs explicit review before restore.",
            severity: "medium",
            restoreImpact: "confirm",
            anchorRef: "delivery_failure_bundle",
            queuedAtLabel: "08:57",
          },
          {
            deltaId: "delta_callback_window_changed",
            title: "Callback promise moved forward by support",
            summary: "The callback-safe window was edited after replay entry and would change the visible promise if restore proceeds.",
            severity: deltaReviewState === "blocking" ? "high" : "medium",
            restoreImpact: deltaReviewState === "blocking" ? "blocking" : "confirm",
            anchorRef: "callback_summary_214",
            queuedAtLabel: "08:59",
          },
          {
            deltaId: "delta_disclosure_expired",
            title: "History disclosure ceiling expired",
            summary: "Expanded history detail is no longer lawful to restore without a fresh disclosure record.",
            severity: "high",
            restoreImpact: "blocking",
            anchorRef: "envelope_214_reply",
            queuedAtLabel: "09:01",
          },
        ] satisfies readonly SupportReplayDeltaReviewItem[]).slice(
          0,
          deltaReviewState === "none" ? 0 : deltaReviewState === "queued" ? 2 : 3,
        );

  const replayDeltaReview =
    replayRouteActive && replaySession
      ? {
          projectionName: "SupportReplayDeltaReview",
          supportReplayDeltaReviewId: "support_replay_delta_review_219_delivery_failure",
          supportReplaySessionId: replaySession.supportReplaySessionId,
          deltaReviewState: deltaReviewState,
          highestSeverity:
            deltaReviewState === "none"
              ? "none"
              : deltaReviewState === "blocking"
                ? "high"
                : "medium",
          summary:
            deltaReviewState === "blocking"
              ? "Queued live changes now block restore until support confirms the callback promise, disclosure ceiling, and later provider signals."
              : deltaReviewState === "queued"
                ? "Later live changes are buffered for review before the shell can restore live controls."
                : "No queued live changes are waiting outside the current replay boundary.",
          items: replayDeltaReviewItems,
        } satisfies SupportReplayDeltaReview
      : null;

  const replayDraftHold =
    replayRouteActive && replaySession
      ? {
          projectionName: "SupportReplayDraftHold",
          supportReplayDraftHoldId: "support_replay_draft_hold_219_delivery_failure",
          supportReplaySessionId: replaySession.supportReplaySessionId,
          heldDraftState:
            restoreState === "restored"
              ? "released"
              : shellMode === "read_only_recovery"
                ? "stale"
                : "preserved",
          heldDraftRefs: ["support_draft_hold_reply_214", "support_draft_hold_repair_macro_214"],
          heldActionSummary:
            restoreState === "restored"
              ? "Drafts were revalidated and released back into the live ticket shell."
              : "Draft reply text and repair macros remain outside the replay evidence boundary until restore law settles.",
          heldDraftDisposition:
            restoreState === "restored" ? "preserve" : restoreState === "blocked" || restoreState === "read_only_recovery" ? "rebase" : "preserve",
        } satisfies SupportReplayDraftHold
      : null;

  const replayRestoreSettlement =
    replayRouteActive && replaySession
      ? {
          projectionName: "SupportReplayRestoreSettlement",
          supportReplayRestoreSettlementId: "support_replay_restore_settlement_219_delivery_failure",
          supportReplaySessionId: replaySession.supportReplaySessionId,
          restoreState,
          blockerCodes:
            restoreState === "blocked"
              ? ["callback_window_changed", "disclosure_ceiling_expired"]
              : restoreState === "read_only_recovery"
                ? ["runtime_publication_drift", "continuity_tuple_drift"]
                : restoreState === "required"
                  ? ["restore_confirmation_missing"]
                  : [],
          matchedContinuityKey: restoreState !== "read_only_recovery",
          matchedAnchor: restoreState !== "blocked",
          matchedMaskScope: restoreState !== "read_only_recovery",
          matchedRouteIntent: restoreState === "ready" || restoreState === "restored",
          matchedScopeMember: restoreState !== "read_only_recovery",
          heldDraftDisposition:
            restoreState === "restored"
              ? "preserve"
              : restoreState === "blocked" || restoreState === "read_only_recovery"
                ? "rebase"
                : "preserve",
          settlementSummary:
            restoreState === "ready"
              ? "Restore can return to live work because the current ticket, anchor, mask scope, and held draft status still match."
              : restoreState === "restored"
                ? "Live work was re-armed against the same ticket anchor after replay validation completed."
                : restoreState === "blocked"
                  ? "Restore is blocked until the buffered deltas and callback promise drift are reviewed."
                  : restoreState === "read_only_recovery"
                    ? "Replay cannot safely restore live work. The shell stays same-ticket and read-only."
                    : "Replay remains frozen until support explicitly validates the current anchor, mask scope, and held drafts.",
        } satisfies SupportReplayRestoreSettlement
      : null;

  const ticketWorkspace: SupportTicketWorkspaceProjection = {
    projectionName: "SupportTicketWorkspaceProjection",
    supportTicketWorkspaceProjectionId: "support_ticket_workspace_projection_222_delivery_failure",
    supportTicketId: route.supportTicketId,
    supportLineageBindingRef: "support_lineage_binding_218_delivery_failure_v1",
    supportLineageBindingHash: "support_lineage_binding_218_delivery_failure_hash",
    primaryScopeMemberRef: "support_scope_member_214_thread",
    ticketVersionRef: "support_ticket_218_delivery_failure_v4",
    selectedTimelineAnchorRef: query.selectedAnchorRef,
    selectedTimelineAnchorTupleHashRef: `tuple_${query.selectedAnchorRef}`,
    ticketHeaderRef: "support_ticket_header_218_delivery_failure",
    timelineProjectionRef: timelineProjection.supportOmnichannelTimelineProjectionId,
    supportReachabilityPostureProjectionRef: reachability.supportReachabilityPostureProjectionId,
    actionWorkbenchProjectionRef: workbenchProjection.supportActionWorkbenchProjectionId,
    subject360ProjectionRef: subject360.supportSubject360ProjectionId,
    knowledgeStackProjectionRef: knowledgeStack.supportKnowledgeStackProjectionId,
    resolutionSnapshotRef: shellMode === "read_only_recovery" ? null : "support_resolution_snapshot_221_delivery_failure",
    supportSurfacePostureRef: `support_surface_posture_222_${shellMode}`,
    supportReadOnlyFallbackProjectionRef: fallbackProjection?.supportReadOnlyFallbackProjectionId ?? null,
    dominantRegion: route.routeKey === "ticket-replay" ? "replay_diff" : actionControlsState === "enabled" ? "action_workbench" : "timeline",
    querySurfaceRef: "GET /ops/support/tickets/:supportTicketId",
    workspaceContinuityKey: "support.workspace.tickets",
    effectiveMaskScopeRef,
    ticketHeader: {
      maskedSubjectLabel: "Subject ending 214",
      reasonCategory: phase2Context.causeClass,
      severity: "high",
      slaState: shellMode === "read_only_recovery" ? "breached" : "at_risk",
      shellMode,
    },
    timelineEntryPoints: [
      {
        anchorRef: "envelope_214_reply",
        label: "Latest subject reply",
        sourceScopeMemberRef: "support_scope_member_214_thread",
        artifactBindingRef: "support_lineage_artifact_binding_214_reply",
      },
      {
        anchorRef: "repair_preview_219",
        label: "Repair preview",
        sourceScopeMemberRef: "support_scope_member_214_thread",
        artifactBindingRef: null,
      },
      {
        anchorRef: "settlement_219",
        label: "Latest settlement",
        sourceScopeMemberRef: "support_scope_member_214_thread",
        artifactBindingRef: "support_resolution_snapshot_221_delivery_failure",
      },
    ],
    artifactProvenanceRefs: [
      "support_lineage_artifact_binding_214_reply",
      "support_lineage_artifact_binding_214_dispatch",
    ],
    allowedActionRefs: Object.keys(actionViewMap) as SupportActionKey[],
    reasonCodes: [
      "SUPPORT_218_TICKET_WORKSPACE_ANATOMY",
      "SUPPORT_219_REPAIR_CHAIN_CANONICAL_COMMUNICATION_BOUND",
      "SUPPORT_222_MASKING_FALLBACK_KNOWLEDGE",
      ...phase2Context.reasonCodes,
    ],
    renderedAt: "2026-04-16T09:23:00Z",
  };

  const routeModeSummary =
    shellMode === "read_only_recovery"
      ? `${fallbackReasonLabel(fallbackReason)} keeps the same ticket anchor but suppresses live controls.`
      : shellMode === "observe_only"
        ? "Observe-only mode keeps the same shell, anchor, and disclosure ceiling visible."
        : shellMode === "replay"
          ? replayDeltaReview?.deltaReviewState === "blocking"
            ? "Replay freezes the ticket chronology and shows blocking deltas before any restore can proceed."
            : replayDeltaReview?.deltaReviewState === "queued"
              ? "Replay freezes the ticket chronology and buffers later live changes into queued delta review."
              : "Replay freezes the ticket chronology against the current evidence boundary."
          : query.scenario === "provisional"
            ? "Provisional status keeps current chronology visible while live confirmation catches up."
            : "Live support status remains same-shell and anchor preserving.";

  return {
    phase2Context,
    shellMode,
    replayState,
    ticketWorkspace,
    actionLease,
    actionSettlement,
    timelineProjection,
    continuityEvidence,
    runtimeBinding,
    subject360,
    timelineEvents,
    actionView,
    ownershipLabel:
      shellMode === "observe_only"
        ? "Marta Singh (observe)"
        : shellMode === "replay"
          ? "Marta Singh (replay)"
          : "Marta Singh",
    queueContextLabel: "Repair inbox",
    disclosureLabel:
      query.disclosureState === "expanded"
        ? "Full history open"
      : query.disclosureState === "expired"
          ? "History access expired"
          : query.disclosureState === "revoked"
            ? "History access revoked"
            : "Limited history",
    settlementHint: actionSettlement.settlementHint,
    extensionLabel:
      shellMode === "read_only_recovery"
        ? "Refresh before live changes."
        : "Full history opens only when approved.",
    effectiveMaskScopeRef,
    fallbackProjection,
    strongestArtifact,
    knowledgeStack,
    knowledgeBinding,
    knowledgeAssistLease,
    knowledgeCards,
    subjectContextBinding,
    disclosureRecord,
    historyRows,
    observeSession,
    replaySession,
    replayEvidenceBoundary,
    replayDeltaReview,
    replayDraftHold,
    replayRestoreSettlement,
    routeModeSummary,
  };
}

function buildSearch(query: SupportWorkspaceQueryState): string {
  const params = new URLSearchParams();
  params.set("state", query.scenario);
  params.set("anchor", query.selectedAnchorRef);
  if (query.fallbackReason !== "none") {
    params.set("fallback", query.fallbackReason);
  }
  if (query.disclosureState !== "summary_only") {
    params.set("disclosure", query.disclosureState);
  }
  if (query.assistState !== "auto") {
    params.set("assist", query.assistState);
  }
  if (query.replayState !== "frozen") {
    params.set("replay", query.replayState);
  }
  if (query.deltaReviewState !== "none") {
    params.set("delta", query.deltaReviewState);
  }
  if (query.restoreState !== "required") {
    params.set("restore", query.restoreState);
  }
  if (query.linkedContextMode !== "history") {
    params.set("linked", query.linkedContextMode);
  }
  return `?${params.toString()}`;
}

interface SupportReplayGate {
  readonly supportTicketId: string;
  readonly replaySessionId: string;
  readonly restoreState: SupportReplayRestoreState;
}

const SUPPORT_REPLAY_GATE_STORAGE_KEY = "vecells.supportReplayGate";

function readSupportReplayGate(): SupportReplayGate | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.sessionStorage.getItem(SUPPORT_REPLAY_GATE_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as SupportReplayGate;
    if (!parsed.supportTicketId || !parsed.replaySessionId || !parsed.restoreState) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeSupportReplayGate(gate: SupportReplayGate): void {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.setItem(SUPPORT_REPLAY_GATE_STORAGE_KEY, JSON.stringify(gate));
}

function clearSupportReplayGate(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.removeItem(SUPPORT_REPLAY_GATE_STORAGE_KEY);
}

function useSupportWorkspaceRouter() {
  const [locationState, setLocationState] = useState(readLocation);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const handleRouteChange = () => setLocationState(readLocation());
    window.addEventListener("popstate", handleRouteChange);
    window.addEventListener(ROUTE_CHANGE_EVENT, handleRouteChange);
    return () => {
      window.removeEventListener("popstate", handleRouteChange);
      window.removeEventListener(ROUTE_CHANGE_EVENT, handleRouteChange);
    };
  }, []);

  const route = useMemo(() => parseSupportRoute(locationState.pathname), [locationState.pathname]);
  const queryState = useMemo<SupportWorkspaceQueryState>(
    () => ({
      scenario: parseScenario(locationState.search),
      selectedAnchorRef: parseAnchor(locationState.search),
      fallbackReason: parseFallbackReason(locationState.search),
      disclosureState: parseDisclosureState(locationState.search),
      assistState: parseAssistState(locationState.search),
      replayState: parseReplayState(locationState.search),
      deltaReviewState: parseDeltaReviewState(locationState.search),
      restoreState: parseRestoreState(locationState.search),
      linkedContextMode: parseLinkedContextMode(locationState.search),
    }),
    [locationState.search],
  );

  const navigate = (
    pathname: string,
    overrides: Partial<SupportWorkspaceQueryState> = {},
  ) => {
    if (typeof window === "undefined") {
      return;
    }
    const nextQuery = {
      ...queryState,
      ...overrides,
    };
    window.history.pushState({}, "", `${pathname}${buildSearch(nextQuery)}`);
    window.dispatchEvent(new Event(ROUTE_CHANGE_EVENT));
    setLocationState(readLocation());
  };

  return {
    route,
    pathname: locationState.pathname,
    queryState,
    navigate,
  };
}

function ScenarioPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className="support-workspace__scenario-pill" data-active={active ? "true" : "false"} onClick={onClick}>
      {label}
    </button>
  );
}

function StatusChip({
  label,
  tone,
}: {
  label: string;
  tone: "neutral" | "authoritative" | "provisional" | "blocked";
}) {
  return (
    <span className="support-workspace__status-chip" data-tone={tone}>
      {label}
    </span>
  );
}

export function MaskScopeBadge({
  label,
  tone,
  detail,
}: {
  label: string;
  tone: "neutral" | "observe" | "replay" | "blocked";
  detail?: string;
}) {
  return (
    <span
      className="support-workspace__mask-badge"
      data-tone={tone}
      aria-label={detail ? `${label}. ${detail}` : label}
    >
      {label}
    </span>
  );
}

export function SupportTicketHeader({
  dataset,
}: {
  dataset: SupportWorkspaceDataset;
}) {
  return (
    <header className="support-workspace__header" data-testid="SupportTicketHeader">
      <div className="support-workspace__header-top">
        <p className="support-workspace__eyebrow">Support</p>
        <div className="support-workspace__chip-row">
          <StatusChip
            label={dataset.phase2Context.canonicalStatusLabel}
            tone={
              dataset.phase2Context.causeClass === "session_current"
                ? "authoritative"
                : dataset.phase2Context.causeClass === "repair_required" ||
                    dataset.phase2Context.causeClass === "step_up_required"
                  ? "provisional"
                  : "blocked"
            }
          />
          <StatusChip
            label={dataset.shellMode === "live" ? "Ready" : labelize(dataset.shellMode)}
            tone={dataset.shellMode === "live" ? "authoritative" : dataset.shellMode === "read_only_recovery" ? "blocked" : "provisional"}
          />
          <StatusChip
            label={dataset.timelineProjection.freshness === "live" ? "Live" : labelize(dataset.timelineProjection.freshness)}
            tone={dataset.timelineProjection.freshness === "live" ? "authoritative" : dataset.timelineProjection.freshness === "read_only" ? "blocked" : "provisional"}
          />
        </div>
      </div>
      <div className="support-workspace__header-title-row">
        <div className="support-workspace__header-main">
          <h1>{dataset.ticketWorkspace.ticketHeader.maskedSubjectLabel}</h1>
          <p className="support-workspace__lede">Email failed; reply needed.</p>
        </div>
        <div className="support-workspace__header-action">
          <span>Next</span>
          <strong>{dataset.phase2Context.patientActionLabel}</strong>
        </div>
      </div>
      <div className="support-workspace__header-meta">
        <div>
          <span>Queue</span>
          <strong>{dataset.queueContextLabel}</strong>
        </div>
        <div>
          <span>Owner</span>
          <strong>{dataset.ownershipLabel}</strong>
        </div>
        <div>
          <span>Details</span>
          <strong>{dataset.disclosureLabel}</strong>
        </div>
      </div>
    </header>
  );
}

export function TicketLineageStrip({
  continuityEvidence,
  runtimeBinding,
  actionLease,
  effectiveMaskScopeRef,
}: {
  continuityEvidence: SupportContinuityEvidenceProjection;
  runtimeBinding: SupportSurfaceRuntimeBinding;
  actionLease: SupportActionLease;
  effectiveMaskScopeRef: string;
}) {
  return (
    <section className="support-workspace__lineage-strip" data-testid="TicketLineageStrip">
      <div>
        <span>History</span>
        <strong>{continuityEvidence.supportLineageBindingRef}</strong>
      </div>
      <div>
        <span>Continuity</span>
        <strong>{continuityEvidence.validationState}</strong>
      </div>
      <div>
        <span>Runtime</span>
        <strong>{runtimeBinding.bindingState}</strong>
      </div>
      <div>
        <span>Action lease</span>
        <strong>{actionLease.leaseState}</strong>
      </div>
      <div>
        <span>Mask scope</span>
        <strong>{effectiveMaskScopeRef}</strong>
      </div>
    </section>
  );
}

export function ObserveReplayBreadcrumb({
  dataset,
  route,
}: {
  dataset: SupportWorkspaceDataset;
  route: ParsedSupportRoute;
}) {
  const modeLabel =
    dataset.shellMode === "observe_only"
      ? `Observe session ${route.observeSessionId ?? DEFAULT_OBSERVE_SESSION_ID}`
      : dataset.shellMode === "replay"
        ? `Replay session ${route.replaySessionId ?? DEFAULT_REPLAY_SESSION_ID}`
        : "Read-only recovery";

  const summary =
    dataset.shellMode === "observe_only"
      ? "Observe-only status keeps the same ticket shell, but suppresses reply, resend, and identity-correction controls."
      : dataset.shellMode === "replay"
        ? "Replay keeps the evidence boundary and selected anchor visible while mutable work stays outside the frozen proof."
        : dataset.routeModeSummary;

  return (
    <section className="support-workspace__mode-bar" data-testid="ObserveReplayBreadcrumb" role="status" aria-live="polite">
      <div className="support-workspace__mode-copy">
        <p className="support-workspace__eyebrow">View mode</p>
        <h2>{modeLabel}</h2>
        <p>{summary}</p>
      </div>
      <div className="support-workspace__mode-chips">
        <MaskScopeBadge label={labelize(dataset.effectiveMaskScopeRef)} tone={dataset.shellMode === "replay" ? "replay" : dataset.shellMode === "observe_only" ? "observe" : "blocked"} />
        <StatusChip
          label={dataset.continuityEvidence.validationState === "trusted" ? "Verified" : labelize(dataset.continuityEvidence.validationState)}
          tone={dataset.continuityEvidence.validationState === "trusted" ? "authoritative" : dataset.continuityEvidence.validationState === "blocked" ? "blocked" : "provisional"}
        />
        <StatusChip
          label={dataset.shellMode === "read_only_recovery" ? "Actions paused" : "Preview only"}
          tone={dataset.shellMode === "read_only_recovery" ? "blocked" : "provisional"}
        />
      </div>
    </section>
  );
}

export function TimelineAnchorNavigator({
  anchors,
  selectedAnchorRef,
  onSelect,
}: {
  anchors: SupportTicketWorkspaceProjection["timelineEntryPoints"];
  selectedAnchorRef: string;
  onSelect: (anchorRef: string) => void;
}) {
  return (
    <nav className="support-workspace__anchor-nav" aria-label="Timeline anchors" data-testid="TimelineAnchorNavigator">
      {anchors.map((anchor) => (
        <button
          key={anchor.anchorRef}
          type="button"
          className="support-workspace__anchor-button"
          data-active={selectedAnchorRef === anchor.anchorRef ? "true" : "false"}
          onClick={() => onSelect(anchor.anchorRef)}
        >
          {anchor.label}
        </button>
      ))}
    </nav>
  );
}

export function MaskAwareTimelineCell({
  event,
  selected,
}: {
  event: SupportTimelineEvent;
  selected: boolean;
}) {
  const tone =
    event.state === "blocked" ? "blocked" : event.state === "provisional" ? "provisional" : "authoritative";
  const statusLabel =
    event.state === "authoritative" ? "Done" : event.state === "provisional" ? "Review" : "Blocked";
  const maskLabel =
    event.maskedState === "summary_only" ? "Summary" : event.maskedState === "limited" ? "Limited" : null;

  return (
    <article
      className="support-workspace__timeline-card support-workspace__mask-aware-cell"
      data-selected={selected ? "true" : "false"}
      data-masked={event.maskedState === "none" ? "false" : "true"}
      data-testid="MaskAwareTimelineCell"
      aria-label={`${event.title}. ${event.maskedState === "none" ? "Full summary." : `${labelize(event.maskedState)} detail. ${event.maskReason ?? ""}`}`}
    >
      <div className="support-workspace__timeline-meta">
        <span className="support-workspace__timeline-time">{event.timeLabel}</span>
        <StatusChip label={event.laneLabel} tone="neutral" />
        <StatusChip label={statusLabel} tone={tone} />
        {maskLabel ? (
          <MaskScopeBadge
            label={maskLabel}
            tone="blocked"
            detail={event.maskReason ?? "Some content is hidden in this view."}
          />
        ) : null}
      </div>
      <h3>{event.title}</h3>
      <p>{event.summary}</p>
      <div className="support-workspace__timeline-footer">
        <span>{event.actor}</span>
        <span>{event.nextActionHint}</span>
      </div>
    </article>
  );
}

export function TimelineEventCard({
  event,
  selected,
}: {
  event: SupportTimelineEvent;
  selected: boolean;
}) {
  return <MaskAwareTimelineCell event={event} selected={selected} />;
}

export function OmnichannelTimeline({
  dataset,
  selectedAnchorRef,
}: {
  dataset: SupportWorkspaceDataset;
  selectedAnchorRef: string;
}) {
  return (
    <section className="support-workspace__timeline" data-testid="OmnichannelTimeline">
      <div className="support-workspace__section-heading">
        <div>
          <p className="support-workspace__eyebrow">Timeline</p>
          <h2>Latest contact events</h2>
          <p>{dataset.phase2Context.communicationStateLabel}</p>
        </div>
        <div className="support-workspace__timeline-status">
          <StatusChip
            label={labelize(dataset.timelineProjection.freshness)}
            tone={dataset.timelineProjection.freshness === "live" ? "authoritative" : dataset.timelineProjection.freshness === "read_only" ? "blocked" : "provisional"}
          />
          <StatusChip
            label={dataset.timelineProjection.patientReceiptParity === "authoritative" ? "Receipt current" : labelize(dataset.timelineProjection.patientReceiptParity)}
            tone={
              dataset.timelineProjection.patientReceiptParity === "authoritative"
                ? "authoritative"
                : dataset.timelineProjection.patientReceiptParity === "blocked"
                  ? "blocked"
                  : "provisional"
            }
          />
        </div>
      </div>
      <div className="support-workspace__timeline-list">
        {dataset.timelineEvents.map((event) => (
          <TimelineEventCard
            key={event.eventId}
            event={event}
            selected={event.anchorRef === selectedAnchorRef}
          />
        ))}
      </div>
    </section>
  );
}

export function FallbackArtifactAnchor({
  artifact,
}: {
  artifact: SupportPresentationArtifact;
}) {
  return (
    <section className="support-workspace__artifact-anchor" data-testid="FallbackArtifactAnchor">
      <div className="support-workspace__section-heading">
        <div>
          <p className="support-workspace__eyebrow">Strongest confirmed artifact</p>
          <h2>{artifact.title}</h2>
        </div>
        <MaskScopeBadge label={labelize(artifact.artifactState)} tone="blocked" />
      </div>
      <p>{artifact.summary}</p>
      <div className="support-workspace__artifact-meta">
        <span>anchor: {artifact.anchorRef}</span>
        <span>transfer: {artifact.safeTransferState}</span>
        <span>mask: {artifact.maskScopeRef}</span>
      </div>
    </section>
  );
}

export function ReacquirePathCard({
  title,
  summary,
  routeLabel,
  onClick,
}: {
  title: string;
  summary: string;
  routeLabel: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className="support-workspace__reacquire-card" data-testid="ReacquirePathCard" onClick={onClick}>
      <strong>{title}</strong>
      <span>{summary}</span>
      <small>{routeLabel}</small>
    </button>
  );
}

export function ReadOnlyFallbackHero({
  fallbackProjection,
  artifact,
  onNavigate,
}: {
  fallbackProjection: SupportReadOnlyFallbackProjection;
  artifact: SupportPresentationArtifact;
  onNavigate: (path: string) => void;
}) {
  return (
    <section className="support-workspace__fallback-hero" data-testid="ReadOnlyFallbackHero" role="status" aria-live="polite">
      <p className="support-workspace__eyebrow">Same-shell read-only fallback</p>
      <h2>Live controls are unavailable, but the current anchor and safest evidence stay visible.</h2>
      <p>{fallbackReasonLabel(fallbackProjection.fallbackClass)} changed the current support posture. The shell keeps the same ticket, anchor, and return stub instead of ejecting to a generic error surface.</p>
      <FallbackArtifactAnchor artifact={artifact} />
      {fallbackProjection.heldActionSummary ? (
        <section className="support-workspace__fallback-held">
          <p className="support-workspace__eyebrow">Held action summary</p>
          <p>{fallbackProjection.heldActionSummary}</p>
        </section>
      ) : null}
      <div className="support-workspace__reacquire-grid">
        {fallbackProjection.reacquirePaths.map((path) => (
          <ReacquirePathCard
            key={`${fallbackProjection.supportReadOnlyFallbackProjectionId}-${path.routePath}`}
            title={path.title}
            summary={path.summary}
            routeLabel={path.routeLabel}
            onClick={() => onNavigate(path.routePath)}
          />
        ))}
      </div>
      <div className="support-workspace__queue-return">
        <span>Queue return summary</span>
        <button type="button" className="support-workspace__rail-home" onClick={() => onNavigate(fallbackProjection.queueReturnPath)}>
          {fallbackProjection.queueReturnLabel}
        </button>
      </div>
    </section>
  );
}

export function DisclosureGatePrompt({
  dataset,
  onExpand,
}: {
  dataset: SupportWorkspaceDataset;
  onExpand: () => void;
}) {
  const message =
    dataset.subjectContextBinding.bindingState === "expanded"
      ? "Expanded history remains approved by the current disclosure record."
      : dataset.subjectContextBinding.bindingState === "stale"
        ? "The prior history widen expired. The shell collapsed back to summary while keeping the current anchor."
        : dataset.subjectContextBinding.bindingState === "blocked"
          ? "History widen is unavailable because disclosure or mask scope drifted."
          : "History widening requires the current disclosure authority. Summary stays visible until that authority is active.";

  return (
    <section className="support-workspace__disclosure-prompt" data-testid="DisclosureGatePrompt">
      <div>
        <p className="support-workspace__eyebrow">Disclosure gate</p>
        <h2>History stays summary-first until approved detail is lawful.</h2>
        <p>{message}</p>
      </div>
      <button
        type="button"
        className="support-workspace__rail-link"
        onClick={onExpand}
        disabled={dataset.shellMode === "read_only_recovery" || dataset.shellMode === "replay"}
      >
        {dataset.subjectContextBinding.bindingState === "expanded" ? "Disclosure active" : "Request approved history widen"}
      </button>
    </section>
  );
}

export function SubjectHistorySummaryPanel({
  dataset,
  onExpand,
}: {
  dataset: SupportWorkspaceDataset;
  onExpand: () => void;
}) {
  const showExpanded = dataset.subjectContextBinding.bindingState === "expanded";
  return (
    <section className="support-workspace__history-panel" data-testid="SubjectHistorySummaryPanel">
      <div className="support-workspace__section-heading">
        <div>
          <p className="support-workspace__eyebrow">Subject history</p>
          <h2>Repeat patterns, prior contacts, and duplicate-safe context stay summary-first.</h2>
        </div>
        <MaskScopeBadge
          label={showExpanded ? "expanded history" : "summary only"}
          tone={showExpanded ? "observe" : dataset.subjectContextBinding.bindingState === "blocked" ? "blocked" : "neutral"}
        />
      </div>
      <div className="support-workspace__history-summary-grid">
        <article>
          <strong>Recent anomalies</strong>
          <span>Delivery failure and callback promise remain the active pattern.</span>
        </article>
        <article>
          <strong>Repeat patterns</strong>
          <span>Same request history reappeared within 48 hours.</span>
        </article>
        <article>
          <strong>Relevant prior contacts</strong>
          <span>Previous callback-safe wording resolved the last similar repair ticket.</span>
        </article>
        <article>
          <strong>Replay-safe context</strong>
          <span>Duplicate-safe prior evidence remains linkable without widening into a dossier.</span>
        </article>
      </div>
      {showExpanded ? (
        <div className="support-workspace__history-list" data-testid="SupportHistoryExpandedRows">
          {dataset.historyRows.map((row) => (
            <article key={row.historyRef} className="support-workspace__history-row">
              <div className="support-workspace__timeline-meta">
                <span>{row.timeLabel}</span>
                <MaskScopeBadge label={labelize(row.maskedState)} tone={row.maskedState === "expanded" ? "observe" : "blocked"} />
              </div>
              <h3>{row.title}</h3>
              <p>{row.summary}</p>
              <small>{row.disclosureClass}</small>
            </article>
          ))}
        </div>
      ) : null}
      <DisclosureGatePrompt dataset={dataset} onExpand={onExpand} />
    </section>
  );
}

export function PlaybookAssistCard({
  card,
  leaseState,
}: {
  card: SupportKnowledgeCardView;
  leaseState: SupportKnowledgeAssistLeaseState;
}) {
  const disabled = leaseState === "blocked" || card.state === "blocked";
  const actionLabel = disabled ? "Unavailable" : leaseState === "executable" ? card.applyLabel : "Preview";

  return (
    <article className="support-workspace__knowledge-card" data-testid="PlaybookAssistCard" data-state={card.state}>
      <div className="support-workspace__knowledge-card-head">
        <h3>{card.title}</h3>
        <button type="button" className="support-workspace__rail-link" disabled={disabled}>
          {actionLabel}
        </button>
      </div>
      <p>{card.whyNow}</p>
    </article>
  );
}

export function KnowledgeStackRail({
  dataset,
}: {
  dataset: SupportWorkspaceDataset;
}) {
  return (
    <section className="support-workspace__knowledge-rail" data-testid="KnowledgeStackRail">
      <div className="support-workspace__section-heading">
        <div>
          <p className="support-workspace__eyebrow">Guidance</p>
          <h2>Recommended help</h2>
        </div>
        <StatusChip
          label={dataset.knowledgeAssistLease.leaseState === "executable" ? "Ready" : labelize(dataset.knowledgeAssistLease.leaseState)}
          tone={
            dataset.knowledgeAssistLease.leaseState === "executable"
              ? "authoritative"
              : dataset.knowledgeAssistLease.leaseState === "blocked"
                ? "blocked"
                : "provisional"
          }
        />
      </div>
      <div className="support-workspace__knowledge-stack">
        {dataset.knowledgeCards.slice(0, 3).map((card) => (
          <PlaybookAssistCard key={card.recommendationRef} card={card} leaseState={dataset.knowledgeAssistLease.leaseState} />
        ))}
      </div>
    </section>
  );
}

export function Subject360SummaryPanel({
  projection,
  extensionLabel,
  phase2Context,
}: {
  projection: Subject360SummaryProjection;
  extensionLabel: string;
  phase2Context: PortalSupportPhase2Context;
}) {
  const caseSummary =
    projection.currentRiskSummary === phase2Context.communicationStateLabel
      ? "Email failed; reply needed."
      : projection.currentRiskSummary;
  const contactRows = [
    ["Auth claim", "NHS login current"],
    ["Identity evidence", "Ownership verified"],
    ["Demographic evidence", "PDS masked"],
    ["Patient preference", "Secure message first"],
    ["Support reachability", "Email failed; callback active"],
  ] as const;

  return (
    <section className="support-workspace__summary-panel" data-testid="Subject360SummaryPanel">
      <div className="support-workspace__summary-head">
        <div>
          <p className="support-workspace__eyebrow">Case snapshot</p>
          <h2>{projection.maskedSubjectLabel}</h2>
        </div>
        <StatusChip label={phase2Context.canonicalStatusLabel} tone="provisional" />
      </div>
      <p className="support-workspace__summary-note">{caseSummary}</p>
      <div className="support-workspace__summary-chips">
        <StatusChip label={projection.repeatContactSignal} tone="neutral" />
        <StatusChip label={`${projection.currentChannels.length} channels`} tone="neutral" />
      </div>
      <dl className="support-workspace__summary-grid support-workspace__summary-grid--compact">
        {contactRows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p className="support-workspace__extension-note">{extensionLabel}</p>
    </section>
  );
}

export function GovernedChildRoutePlaceholder({
  routeLabel,
  summary,
}: {
  routeLabel: string;
  summary: string;
}) {
  return (
    <section className="support-workspace__placeholder" data-testid="GovernedChildRoutePlaceholder">
      <p className="support-workspace__eyebrow">Approved summary</p>
      <h2>{routeLabel}</h2>
      <p>{summary}</p>
    </section>
  );
}

export function ActionWorkbenchDock({
  dataset,
  routeKey,
  replayGateActive = false,
  onReturnToReplay,
}: {
  dataset: SupportWorkspaceDataset;
  routeKey: SupportWorkspaceRouteKey;
  replayGateActive?: boolean;
  onReturnToReplay?: () => void;
}) {
  const buttonLabel =
    replayGateActive
      ? "Return to replay restore"
      : dataset.shellMode === "read_only_recovery"
      ? "Read only"
      : dataset.shellMode === "observe_only"
        ? "Observe only"
        : dataset.shellMode === "replay"
          ? "Replay mode"
          : dataset.actionView.controlsState === "blocked"
            ? "Unavailable"
            : dataset.actionView.controlsState === "read_only"
              ? "Preview only"
              : routeKey === "ticket-conversation"
                ? "Open action"
                : "Prepare action";

  const reachabilityState = dataset.timelineProjection.supportReachabilityPostureProjection.postureState;
  const reachabilityLabel =
    reachabilityState === "confirmed"
      ? "Contact confirmed"
      : reachabilityState === "blocked"
        ? "Contact blocked"
        : "Contact pending";

  const disabled =
    replayGateActive ||
    dataset.shellMode === "read_only_recovery" ||
    dataset.shellMode === "observe_only" ||
    dataset.shellMode === "replay" ||
    dataset.actionView.controlsState === "blocked" ||
    dataset.actionView.controlsState === "read_only";

  return (
    <aside className="support-workspace__action-dock" data-testid="ActionWorkbenchDock">
      <p className="support-workspace__eyebrow">Next action</p>
      <h2>{routeKey === "ticket-conversation" ? "Conversation status" : dataset.actionView.label}</h2>
      <p>
        {replayGateActive
          ? "This ticket is waiting for replay restore before live changes can resume."
          : dataset.shellMode === "read_only_recovery"
          ? "Live changes are paused until the ticket is refreshed."
          : dataset.shellMode === "observe_only"
            ? "This view is read-only. Reply, resend, and correction controls are unavailable."
            : dataset.shellMode === "replay"
              ? "Replay shows the current action summary without changing the ticket."
              : routeKey === "ticket-conversation"
                ? "Reply and note status stay attached to this ticket."
                : dataset.actionView.summary}
      </p>
      <div className="support-workspace__dock-metrics">
        <StatusChip
          label={dataset.actionLease.leaseState === "live" ? "Ready" : labelize(dataset.actionLease.leaseState)}
          tone={dataset.actionLease.leaseState === "live" ? "authoritative" : dataset.actionLease.leaseState === "blocked" ? "blocked" : "provisional"}
        />
        <StatusChip
          label={reachabilityLabel}
          tone={reachabilityState === "confirmed" ? "authoritative" : reachabilityState === "blocked" ? "blocked" : "provisional"}
        />
      </div>
      <div className="support-workspace__dock-checks" aria-label="Action checks">
        <div>
          <span>Preview</span>
          <p>{dataset.actionView.previewLabel}</p>
        </div>
        <div>
          <span>Check</span>
          <p>{dataset.actionView.confirmationLabel}</p>
        </div>
        <div>
          <span>Last outcome</span>
          <p>{dataset.actionSettlement.settlementHint}</p>
          <small>{dataset.actionSettlement.recordedAtLabel}</small>
        </div>
      </div>
      <button type="button" className="support-workspace__primary-action" data-testid="support-action-cta" disabled={disabled}>
        {buttonLabel}
      </button>
      {replayGateActive && onReturnToReplay ? (
        <button
          type="button"
          className="support-workspace__rail-link"
          data-testid="support-return-to-replay"
          onClick={onReturnToReplay}
        >
          Open replay restore
        </button>
      ) : null}
      <p className="support-workspace__dock-note">{dataset.actionView.nextStepLabel}</p>
    </aside>
  );
}

export function ContinuityStubBar({
  continuityEvidence,
  runtimeBinding,
  selectedAnchorRef,
  shellMode,
}: {
  continuityEvidence: SupportContinuityEvidenceProjection;
  runtimeBinding: SupportSurfaceRuntimeBinding;
  selectedAnchorRef: string;
  shellMode: SupportShellMode;
}) {
  return (
    <section className="support-workspace__continuity-bar" data-testid="ContinuityStubBar">
      <span>continuity: {continuityEvidence.continuityTupleHash}</span>
      <span>anchor: {selectedAnchorRef}</span>
      <span>runtime: {runtimeBinding.bindingState}</span>
      <span>mode: {shellMode}</span>
      <span>return: /ops/support/inbox/repair</span>
    </section>
  );
}

function KnowledgeRoutePanel({
  dataset,
}: {
  dataset: SupportWorkspaceDataset;
}) {
  const dominantCard = dataset.knowledgeCards[0]!;
  return (
    <section className="support-workspace__route-panel" data-testid="SupportKnowledgeDetailPanel">
      <div className="support-workspace__section-heading">
        <div>
          <p className="support-workspace__eyebrow">Knowledge route</p>
          <h2>Promoted guidance stays lease-bound and same-shell.</h2>
        </div>
        <StatusChip
          label={`binding: ${dataset.knowledgeBinding.bindingState}`}
          tone={dataset.knowledgeBinding.bindingState === "live" ? "authoritative" : dataset.knowledgeBinding.bindingState === "blocked" ? "blocked" : "provisional"}
        />
      </div>
      <PlaybookAssistCard card={dominantCard} leaseState={dataset.knowledgeAssistLease.leaseState} />
      <GovernedChildRoutePlaceholder
        routeLabel="Knowledge assist boundaries"
        summary="Preview can remain visible without execution. Any apply, playbook launch, or fallback-channel suggestion remains fenced by the current knowledge assist lease and support action status."
      />
    </section>
  );
}

function ObserveRoutePanel({
  dataset,
}: {
  dataset: SupportWorkspaceDataset;
}) {
  return (
    <section className="support-workspace__route-panel" data-testid="SupportObservePanel">
      <div className="support-workspace__section-heading">
        <div>
          <p className="support-workspace__eyebrow">Observe route</p>
          <h2>Read-only inspection</h2>
        </div>
        <StatusChip
          label={dataset.observeSession?.observeState === "active" ? "Active" : "Inactive"}
          tone={dataset.observeSession?.observeState === "active" ? "authoritative" : "blocked"}
        />
      </div>
      <p>{dataset.routeModeSummary}</p>
      <GovernedChildRoutePlaceholder
        routeLabel="Observe-only controls"
        summary="Observe child routes may widen detail only within the current disclosure ceiling. Reply, resend, and identity-correction controls remain visibly suppressed."
      />
    </section>
  );
}

function ReplayBoundaryPanel({
  dataset,
  framed = true,
}: {
  dataset: SupportWorkspaceDataset;
  framed?: boolean;
}) {
  return (
    <section
      className={framed ? "support-workspace__route-panel" : "support-workspace__route-panel-body"}
      data-testid="SupportReplayBoundaryPanel"
    >
      <div className="support-workspace__section-heading">
        <div>
          <p className="support-workspace__eyebrow">Replay boundary</p>
          <h2>Frozen evidence stays explicit about what remains inside and outside the proof.</h2>
        </div>
        <StatusChip
          label={`restore: ${dataset.replaySession?.restoreState ?? "inactive"}`}
          tone={dataset.replaySession?.restoreState === "frozen" ? "provisional" : "blocked"}
        />
      </div>
      <div className="support-workspace__history-summary-grid">
        <article>
          <strong>Included events</strong>
          <span>{dataset.replayEvidenceBoundary?.includedEventRefs.length ?? 0} frozen chronology rows remain inside the replay boundary.</span>
        </article>
        <article>
          <strong>Excluded drafts</strong>
          <span>{dataset.replayEvidenceBoundary?.excludedDraftRefs.length ?? 0} held drafts stay outside replay until live restore succeeds.</span>
        </article>
        <article>
          <strong>Mask scope</strong>
          <span>{dataset.replaySession?.currentMaskScopeRef ?? dataset.effectiveMaskScopeRef}</span>
        </article>
        <article>
          <strong>Return route</strong>
          <span>{dataset.replaySession?.returnRouteLabel ?? "Return to approved ticket summary"}</span>
        </article>
      </div>
    </section>
  );
}

export function SupportHistoryView({
  dataset,
  compact = false,
  onExpand,
}: {
  dataset: SupportWorkspaceDataset;
  compact?: boolean;
  onExpand?: () => void;
}) {
  if (!compact) {
    return (
      <div data-testid="SupportHistoryView" data-disclosure-state={dataset.subjectContextBinding.bindingState}>
        <SubjectHistorySummaryPanel dataset={dataset} onExpand={onExpand ?? (() => undefined)} />
      </div>
    );
  }
  const rows = compact ? dataset.historyRows.slice(0, 2) : dataset.historyRows;
  return (
    <section
      className="support-workspace__linked-context-card"
      data-testid="SupportHistoryView"
      data-disclosure-state={dataset.subjectContextBinding.bindingState}
    >
      <div className="support-workspace__section-heading">
        <div>
          <p className="support-workspace__eyebrow">Support history</p>
          <h2>{compact ? "Linked subject history" : "History stays same-shell and disclosure-bound."}</h2>
        </div>
        <MaskScopeBadge
          label={dataset.subjectContextBinding.bindingState === "expanded" ? "expanded" : "summary only"}
          tone={
            dataset.subjectContextBinding.bindingState === "blocked"
              ? "blocked"
              : dataset.subjectContextBinding.bindingState === "expanded"
                ? "observe"
                : "neutral"
          }
        />
      </div>
      <div className="support-workspace__linked-context-list">
        {rows.map((row) => (
          <article
            key={row.historyRef}
            className="support-workspace__linked-context-item"
            data-mask-state={row.maskedState}
          >
            <div className="support-workspace__timeline-meta">
              <span>{row.timeLabel}</span>
              <span>{row.disclosureClass}</span>
            </div>
            <strong>{row.title}</strong>
            <p>{row.summary}</p>
          </article>
        ))}
      </div>
      {compact && onExpand ? (
        <button type="button" className="support-workspace__rail-link" onClick={onExpand}>
          {dataset.subjectContextBinding.bindingState === "expanded" ? "Full history shown" : "Show full history"}
        </button>
      ) : null}
    </section>
  );
}

export function SupportKnowledgeView({
  dataset,
  compact = false,
}: {
  dataset: SupportWorkspaceDataset;
  compact?: boolean;
}) {
  if (!compact) {
    return (
      <div data-testid="SupportKnowledgeView" data-knowledge-state={dataset.knowledgeBinding.bindingState}>
        <KnowledgeRoutePanel dataset={dataset} />
      </div>
    );
  }
  const cards = compact ? dataset.knowledgeCards.slice(0, 2) : dataset.knowledgeCards.slice(0, 3);
  return (
    <section
      className="support-workspace__linked-context-card"
      data-testid="SupportKnowledgeView"
      data-knowledge-state={dataset.knowledgeBinding.bindingState}
    >
      <div className="support-workspace__section-heading">
        <div>
          <p className="support-workspace__eyebrow">Support knowledge</p>
          <h2>{compact ? "Ranked guidance" : "Ticket guidance"}</h2>
        </div>
        <StatusChip
          label={dataset.knowledgeAssistLease.leaseState === "executable" ? "Ready" : labelize(dataset.knowledgeAssistLease.leaseState)}
          tone={
            dataset.knowledgeAssistLease.leaseState === "executable"
              ? "authoritative"
              : dataset.knowledgeAssistLease.leaseState === "blocked"
                ? "blocked"
                : "provisional"
          }
        />
      </div>
      <div className="support-workspace__linked-context-list">
        {cards.map((card) => (
          <article
            key={card.recommendationRef}
            className="support-workspace__linked-context-item"
            data-card-state={card.state}
          >
            <div className="support-workspace__timeline-meta">
              <span>{labelize(card.kind)}</span>
              <span>{card.policyMarker}</span>
            </div>
            <strong>{card.title}</strong>
            <p>{card.whyNow}</p>
            <small>{card.previewLabel}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

export function SupportLinkedContextView({
  dataset,
  mode,
  onModeChange,
  onExpandHistory,
}: {
  dataset: SupportWorkspaceDataset;
  mode: SupportLinkedContextMode;
  onModeChange: (mode: SupportLinkedContextMode) => void;
  onExpandHistory: () => void;
}) {
  return (
    <section
      className="support-workspace__linked-context-shell"
      data-testid="SupportLinkedContextView"
      data-linked-context-mode={mode}
    >
      <div className="support-workspace__section-heading">
        <div>
          <p className="support-workspace__eyebrow">Linked context</p>
          <h2>History, knowledge, and subject summary stay bound to the same ticket anchor.</h2>
        </div>
        <MaskScopeBadge label={dataset.effectiveMaskScopeRef} tone={dataset.shellMode === "replay" ? "replay" : "neutral"} />
      </div>
      <div className="support-workspace__segment-tabs" role="tablist" aria-label="Linked context views">
        {(["history", "knowledge", "subject"] as const).map((candidate) => (
          <button
            key={candidate}
            type="button"
            role="tab"
            aria-selected={mode === candidate}
            data-active={mode === candidate ? "true" : "false"}
            onClick={() => onModeChange(candidate)}
          >
            {candidate === "subject" ? "Subject 360" : labelize(candidate)}
          </button>
        ))}
      </div>
      {mode === "history" ? <SupportHistoryView dataset={dataset} compact onExpand={onExpandHistory} /> : null}
      {mode === "knowledge" ? <SupportKnowledgeView dataset={dataset} compact /> : null}
      {mode === "subject" ? (
        <div className="support-workspace__linked-context-card" data-testid="SupportLinkedSubjectView">
          <Subject360SummaryPanel
            projection={dataset.subject360}
            extensionLabel={dataset.extensionLabel}
            phase2Context={dataset.phase2Context}
          />
        </div>
      ) : null}
    </section>
  );
}

export function SupportReplayDeltaReviewPanel({
  replayDeltaReview,
}: {
  replayDeltaReview: SupportReplayDeltaReview;
}) {
  return (
    <section
      className="support-workspace__replay-panel support-workspace__replay-panel--delta"
      data-testid="SupportReplayDeltaReviewPanel"
      data-delta-review-state={replayDeltaReview.deltaReviewState}
    >
      <div className="support-workspace__section-heading">
        <div>
          <p className="support-workspace__eyebrow">SupportReplayDeltaReview</p>
          <h2>Queued live changes during replay</h2>
        </div>
        <StatusChip
          label={replayDeltaReview.deltaReviewState}
          tone={
            replayDeltaReview.deltaReviewState === "blocking"
              ? "blocked"
              : replayDeltaReview.deltaReviewState === "queued"
                ? "provisional"
                : "authoritative"
          }
        />
      </div>
      <p>{replayDeltaReview.summary}</p>
      {replayDeltaReview.items.length === 0 ? (
        <div className="support-workspace__linked-context-item">
          <strong>No buffered deltas</strong>
          <p>The current replay boundary and live chronology still match.</p>
        </div>
      ) : (
        <div className="support-workspace__replay-delta-list">
          {replayDeltaReview.items.map((item) => (
            <article
              key={item.deltaId}
              className="support-workspace__replay-delta-item"
              data-severity={item.severity}
              data-restore-impact={item.restoreImpact}
            >
              <div className="support-workspace__timeline-meta">
                <span>{item.queuedAtLabel}</span>
                <span>{item.anchorRef}</span>
              </div>
              <strong>{item.title}</strong>
              <p>{item.summary}</p>
              <div className="support-workspace__dock-metrics">
                <StatusChip
                  label={`severity: ${item.severity}`}
                  tone={item.severity === "high" ? "blocked" : item.severity === "medium" ? "provisional" : "neutral"}
                />
                <StatusChip
                  label={`restore: ${item.restoreImpact}`}
                  tone={item.restoreImpact === "blocking" ? "blocked" : item.restoreImpact === "confirm" ? "provisional" : "neutral"}
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export function SupportReplayRestoreBridge({
  replaySession,
  replayDraftHold,
  replayRestoreSettlement,
  onRestore,
  onReturnToReplay,
}: {
  replaySession: SupportReplaySession;
  replayDraftHold: SupportReplayDraftHold | null;
  replayRestoreSettlement: SupportReplayRestoreSettlement;
  onRestore: () => void;
  onReturnToReplay?: () => void;
}) {
  const ready = replayRestoreSettlement.restoreState === "ready";
  const restored = replayRestoreSettlement.restoreState === "restored";
  const blocked =
    replayRestoreSettlement.restoreState === "blocked" ||
    replayRestoreSettlement.restoreState === "read_only_recovery";
  const buttonLabel = restored
    ? "Restore settled"
    : ready
      ? "Restore live ticket"
      : onReturnToReplay
        ? "Return to replay restore"
        : "Restore blocked";

  return (
    <section
      className="support-workspace__replay-panel support-workspace__replay-panel--restore"
      data-testid="SupportReplayRestoreBridge"
      data-restore-state={replayRestoreSettlement.restoreState}
    >
      <div className="support-workspace__section-heading">
        <div>
          <p className="support-workspace__eyebrow">SupportReplayRestoreBridge</p>
          <h2>Replay restore remains explicit</h2>
        </div>
        <StatusChip
          label={replayRestoreSettlement.restoreState}
          tone={ready || restored ? "authoritative" : blocked ? "blocked" : "provisional"}
        />
      </div>
      <p>{replayRestoreSettlement.settlementSummary}</p>
      <div className="support-workspace__history-summary-grid">
        <article>
          <strong>Checkpoint</strong>
          <span>{replaySession.supportReplayCheckpointId}</span>
        </article>
        <article>
          <strong>Mask scope</strong>
          <span>{replaySession.currentMaskScopeRef}</span>
        </article>
        <article>
          <strong>Anchor</strong>
          <span>{replaySession.selectedTimelineAnchorRef}</span>
        </article>
        <article>
          <strong>Held draft</strong>
          <span>{replayDraftHold?.heldDraftDisposition ?? "none"}</span>
        </article>
      </div>
      {replayRestoreSettlement.blockerCodes.length > 0 ? (
        <div className="support-workspace__linked-context-list">
          {replayRestoreSettlement.blockerCodes.map((code) => (
            <article key={code} className="support-workspace__linked-context-item" data-blocker={code}>
              <strong>{labelize(code)}</strong>
              <p>Restore law keeps live controls inert until this blocker is cleared or explicitly superseded.</p>
            </article>
          ))}
        </div>
      ) : null}
      <div className="support-workspace__replay-actions">
        <button
          type="button"
          className="support-workspace__primary-action"
          onClick={ready ? onRestore : onReturnToReplay}
          disabled={!ready && !onReturnToReplay}
        >
          {buttonLabel}
        </button>
        <p className="support-workspace__dock-note">
          Draft posture: {replayDraftHold?.heldActionSummary ?? "No held draft outside the replay boundary."}
        </p>
      </div>
    </section>
  );
}

export function SupportReplaySurface({
  dataset,
  onRestore,
}: {
  dataset: SupportWorkspaceDataset;
  onRestore: () => void;
}) {
  if (!dataset.replaySession || !dataset.replayEvidenceBoundary || !dataset.replayRestoreSettlement) {
    return null;
  }
  return (
    <section
      className="support-workspace__route-panel support-workspace__route-panel--replay"
      data-testid="SupportReplaySurface"
      data-replay-state={dataset.replayState}
      data-replay-checkpoint={dataset.replaySession.supportReplayCheckpointId}
      data-mask-scope={dataset.replaySession.currentMaskScopeRef}
    >
      <div className="support-workspace__section-heading">
        <div>
          <p className="support-workspace__eyebrow">SupportReplaySurface</p>
          <h2>Replay keeps the evidence boundary and restore law visible.</h2>
        </div>
        <StatusChip
          label={dataset.replayState}
          tone={
            dataset.replayState === "restore_ready" || dataset.replayState === "restored"
              ? "authoritative"
              : dataset.replayState === "read_only_recovery"
                ? "blocked"
                : "provisional"
          }
        />
      </div>
      <p>{dataset.replaySession.investigationQuestion}</p>
      <ReplayBoundaryPanel dataset={dataset} framed={false} />
      <div className="support-workspace__replay-boundary-grid">
        <article className="support-workspace__linked-context-item">
          <strong>Included evidence</strong>
          <p>{dataset.replayEvidenceBoundary.includedEventRefs.join(", ")}</p>
        </article>
        <article className="support-workspace__linked-context-item">
          <strong>Excluded drafts and mutable work</strong>
          <p>
            {dataset.replayEvidenceBoundary.excludedDraftRefs.length} drafts and{" "}
            {dataset.replayEvidenceBoundary.excludedOutboundAttemptRefs.length} outbound attempts remain outside replay.
          </p>
        </article>
      </div>
      {dataset.replayDeltaReview ? <SupportReplayDeltaReviewPanel replayDeltaReview={dataset.replayDeltaReview} /> : null}
      <SupportReplayRestoreBridge
        replaySession={dataset.replaySession}
        replayDraftHold={dataset.replayDraftHold}
        replayRestoreSettlement={dataset.replayRestoreSettlement}
        onRestore={onRestore}
      />
    </section>
  );
}

export function SupportTicketChildRouteShell({
  dataset,
  routeKey,
  title,
  summary,
  topology,
  mainContent,
  promotedRegion,
}: {
  dataset: SupportWorkspaceDataset;
  routeKey: SupportWorkspaceRouteKey;
  title: string;
  summary: string;
  topology: "two_plane" | "three_plane";
  mainContent: ReactNode;
  promotedRegion?: ReactNode;
}) {
  return (
    <section
      className="support-workspace__child-route-shell"
      data-testid="SupportTicketChildRouteShell"
      data-route-key={routeKey}
      data-shell-topology={topology}
      data-support-shell-mode={dataset.shellMode}
      data-replay-state={dataset.replayState}
      data-mask-scope={dataset.effectiveMaskScopeRef}
      data-replay-checkpoint={dataset.replaySession?.supportReplayCheckpointId ?? "none"}
      data-delta-review-state={dataset.replayDeltaReview?.deltaReviewState ?? "none"}
      data-restore-state={dataset.replayRestoreSettlement?.restoreState ?? "required"}
    >
      <header className="support-workspace__child-route-header">
        <div>
          <p className="support-workspace__eyebrow">SupportTicketChildRouteShell</p>
          <h2>{title}</h2>
          <p>{summary}</p>
        </div>
        <div className="support-workspace__dock-metrics">
          <StatusChip label={`mode: ${dataset.shellMode}`} tone={dataset.shellMode === "live" ? "authoritative" : dataset.shellMode === "replay" ? "provisional" : "blocked"} />
          <StatusChip
            label={`anchor: ${dataset.ticketWorkspace.selectedTimelineAnchorRef}`}
            tone="neutral"
          />
        </div>
      </header>
      <div className="support-workspace__child-route-grid" data-topology={topology}>
        <div className="support-workspace__child-route-main">{mainContent}</div>
        {promotedRegion ? <aside className="support-workspace__child-route-side">{promotedRegion}</aside> : null}
      </div>
    </section>
  );
}

function SupportWorkspaceShell({
  route,
  pathname,
  queryState,
  dataset,
  reducedMotion,
  replayGate,
  onNavigate,
  onScenarioChange,
  onAnchorSelect,
  onDisclosureExpand,
  onLinkedContextChange,
  onRestoreFromReplay,
  children,
}: {
  route: ParsedSupportRoute;
  pathname: string;
  queryState: SupportWorkspaceQueryState;
  dataset: SupportWorkspaceDataset;
  reducedMotion: boolean;
  replayGate: {
    supportTicketId: string;
    replaySessionId: string;
    restoreState: SupportReplayRestoreState;
  } | null;
  onNavigate: (path: string, overrides?: Partial<SupportWorkspaceQueryState>) => void;
  onScenarioChange: (nextScenario: SupportWorkspaceScenario) => void;
  onAnchorSelect: (anchorRef: string) => void;
  onDisclosureExpand: () => void;
  onLinkedContextChange: (mode: SupportLinkedContextMode) => void;
  onRestoreFromReplay: () => void;
  children: ReactNode;
}) {
  const contract = SUPPORT_ROUTE_REGISTRY[route.routeKey];
  const actionKey = route.actionKey ?? dataset.actionView.actionKey;
  const replayGateActive = Boolean(
    replayGate &&
      replayGate.supportTicketId === route.supportTicketId &&
      replayGate.restoreState !== "restored" &&
      route.routeKey !== "ticket-replay",
  );

  return (
    <div
      className="support-workspace"
      data-testid={SUPPORT_WORKSPACE_STYLE_SYSTEM}
      data-visual-mode={SUPPORT_WORKSPACE_VISUAL_MODE}
      data-shell-family={contract.shellFamily}
      data-continuity-key={contract.continuityKey}
      data-selected-anchor={queryState.selectedAnchorRef}
      data-selected-anchor-policy={contract.selectedAnchorPolicy}
      data-route-key={route.routeKey}
      data-route-path={pathname}
      data-motion-mode={reducedMotion ? "reduced" : "full"}
      data-shell-mode={dataset.shellMode}
      data-support-shell-mode={dataset.shellMode}
      data-replay-state={dataset.replayState}
      data-mask-scope={dataset.effectiveMaskScopeRef}
      data-replay-checkpoint={dataset.replaySession?.supportReplayCheckpointId ?? replayGate?.replaySessionId ?? "none"}
      data-delta-review-state={dataset.replayDeltaReview?.deltaReviewState ?? "none"}
      data-restore-state={replayGateActive ? replayGate?.restoreState ?? "required" : dataset.replayRestoreSettlement?.restoreState ?? "required"}
      data-fallback-active={dataset.fallbackProjection ? "true" : "false"}
      data-truth-kernel={dataset.phase2Context.truthKernel}
      data-shared-request-ref={dataset.phase2Context.fixture.requestRef}
      data-shared-lineage-ref={dataset.phase2Context.fixture.requestLineageRef}
      data-support-ticket-id={dataset.phase2Context.fixture.supportTicketId}
      data-cause-class={dataset.phase2Context.causeClass}
      data-recovery-class={dataset.phase2Context.recoveryClass}
      data-canonical-status-label={dataset.phase2Context.canonicalStatusLabel}
    >
      <a className="support-workspace__skip-link" href="#support-workspace-main">
        Skip to support workspace
      </a>
      <div
        className="support-workspace__layout"
        data-shell-topology={route.routeKey === "ticket-replay" ? "three_plane" : "two_plane"}
      >
        <aside className="support-workspace__left-rail">
          <button type="button" className="support-workspace__rail-home" onClick={() => onNavigate("/ops/support/inbox/repair")}>
            Inbox
          </button>
          <div className="support-workspace__rail-stack">
            <p className="support-workspace__eyebrow">Ticket</p>
            <button
              type="button"
              className="support-workspace__rail-link"
              data-active={route.routeKey === "ticket-overview" ? "true" : "false"}
              onClick={() => onNavigate(`/ops/support/tickets/${route.supportTicketId}`)}
            >
              Overview
            </button>
            <button
              type="button"
              className="support-workspace__rail-link"
              data-active={route.routeKey === "ticket-conversation" ? "true" : "false"}
              onClick={() => onNavigate(`/ops/support/tickets/${route.supportTicketId}/conversation`)}
            >
              Conversation
            </button>
            <button
              type="button"
              className="support-workspace__rail-link"
              data-active={route.routeKey === "ticket-history" ? "true" : "false"}
              onClick={() => onNavigate(`/ops/support/tickets/${route.supportTicketId}/history`)}
            >
              History
            </button>
            <button
              type="button"
              className="support-workspace__rail-link"
              data-active={route.routeKey === "ticket-knowledge" ? "true" : "false"}
              onClick={() => onNavigate(`/ops/support/tickets/${route.supportTicketId}/knowledge`)}
            >
              Knowledge
            </button>
            <button
              type="button"
              className="support-workspace__rail-link"
              data-active={route.routeKey === "ticket-action" ? "true" : "false"}
              onClick={() => onNavigate(`/ops/support/tickets/${route.supportTicketId}/actions/${actionKey}`)}
            >
              Action
            </button>
          </div>
          <div className="support-workspace__rail-stack">
            <p className="support-workspace__eyebrow">Review modes</p>
            <button
              type="button"
              className="support-workspace__rail-link"
              data-active={route.routeKey === "ticket-observe" ? "true" : "false"}
              onClick={() => onNavigate(`/ops/support/tickets/${route.supportTicketId}/observe/${route.observeSessionId ?? DEFAULT_OBSERVE_SESSION_ID}`)}
            >
              Observe
            </button>
            <button
              type="button"
              className="support-workspace__rail-link"
              data-active={route.routeKey === "ticket-replay" ? "true" : "false"}
              onClick={() => onNavigate(`/ops/support/replay/${route.replaySessionId ?? DEFAULT_REPLAY_SESSION_ID}`)}
            >
              Replay
            </button>
          </div>
          <div className="support-workspace__rail-stack">
            <p className="support-workspace__eyebrow">Timeline</p>
            <TimelineAnchorNavigator
              anchors={dataset.ticketWorkspace.timelineEntryPoints}
              selectedAnchorRef={queryState.selectedAnchorRef}
              onSelect={onAnchorSelect}
            />
          </div>
          <div className="support-workspace__rail-stack" hidden>
            <p className="support-workspace__eyebrow">State</p>
            <div className="support-workspace__scenario-row">
              {(["calm", "active", "provisional", "degraded", "blocked"] as const).map((candidate) => (
                <ScenarioPill key={candidate} label={scenarioLabel(candidate)} active={queryState.scenario === candidate} onClick={() => onScenarioChange(candidate)} />
              ))}
            </div>
          </div>
          <div className="support-workspace__rail-stack">
            <p className="support-workspace__eyebrow">Details</p>
            <button
              type="button"
              className="support-workspace__rail-link"
              data-active={queryState.disclosureState === "expanded" ? "true" : "false"}
              onClick={onDisclosureExpand}
            >
              {queryState.disclosureState === "expanded" ? "Full history" : "Limited history"}
            </button>
          </div>
          {route.routeKey !== "ticket-overview" ? (
            <SupportLinkedContextView
              dataset={dataset}
              mode={
                route.routeKey === "ticket-history"
                  ? "history"
                  : route.routeKey === "ticket-knowledge"
                    ? "knowledge"
                    : queryState.linkedContextMode
              }
              onModeChange={onLinkedContextChange}
              onExpandHistory={onDisclosureExpand}
            />
          ) : null}
        </aside>

        <main id="support-workspace-main" className="support-workspace__main">
          {dataset.shellMode === "observe_only" || dataset.shellMode === "replay" || dataset.fallbackProjection ? (
            <ObserveReplayBreadcrumb dataset={dataset} route={route} />
          ) : null}

          <SupportTicketHeader dataset={dataset} />

          {replayGateActive && replayGate ? (
            <SupportReplayRestoreBridge
              replaySession={
                dataset.replaySession ?? {
                  projectionName: "SupportReplaySession",
                  supportReplaySessionId: replayGate.replaySessionId,
                  supportTicketId: replayGate.supportTicketId,
                  supportReplayCheckpointId: replayGate.replaySessionId,
                  supportReplayEvidenceBoundaryRef: "pending_replay_boundary",
                  currentMaskScopeRef: dataset.effectiveMaskScopeRef,
                  disclosureCeilingRef: "disclosure_ceiling_support_replay_boundary",
                  restoreState: "restore_required",
                  investigationQuestion: "Replay restore is still required before live work can resume.",
                  queueAnchorRef: "repair_queue_anchor",
                  selectedTimelineAnchorRef: queryState.selectedAnchorRef,
                  returnRouteLabel: "Return to replay restore",
                }
              }
              replayDraftHold={dataset.replayDraftHold}
              replayRestoreSettlement={
                dataset.replayRestoreSettlement ?? {
                  projectionName: "SupportReplayRestoreSettlement",
                  supportReplayRestoreSettlementId: "support_replay_restore_gate_pending",
                  supportReplaySessionId: replayGate.replaySessionId,
                  restoreState: replayGate.restoreState,
                  blockerCodes:
                    replayGate.restoreState === "blocked"
                      ? ["delta_review_pending", "restore_revalidation_pending"]
                      : ["restore_revalidation_pending"],
                  matchedContinuityKey: true,
                  matchedAnchor: false,
                  matchedMaskScope: true,
                  matchedRouteIntent: false,
                  matchedScopeMember: true,
                  heldDraftDisposition: "preserve",
                  settlementSummary:
                    replayGate.restoreState === "blocked"
                      ? "A prior replay session still holds this ticket in restore review. Live controls stay paused until support returns to replay."
                      : "Replay restore is still required. The current ticket stays visible, but live changes remain paused.",
                }
              }
              onRestore={onRestoreFromReplay}
              onReturnToReplay={() =>
                onNavigate(`/ops/support/replay/${replayGate.replaySessionId}`, {
                  restoreState: replayGate.restoreState,
                  replayState:
                    replayGate.restoreState === "ready"
                      ? "restore_ready"
                      : replayGate.restoreState === "blocked"
                        ? "delta_review"
                        : "restore_required",
                })
              }
            />
          ) : null}

          {children}
        </main>

        <div className="support-workspace__right-rail">
          <ActionWorkbenchDock
            dataset={dataset}
            routeKey={route.routeKey}
            replayGateActive={replayGateActive}
            onReturnToReplay={
              replayGate
                ? () =>
                    onNavigate(`/ops/support/replay/${replayGate.replaySessionId}`, {
                      restoreState: replayGate.restoreState,
                      replayState:
                        replayGate.restoreState === "ready"
                          ? "restore_ready"
                          : replayGate.restoreState === "blocked"
                            ? "delta_review"
                            : "restore_required",
                    })
                : undefined
            }
          />
          <KnowledgeStackRail dataset={dataset} />
          <Subject360SummaryPanel
            projection={dataset.subject360}
            extensionLabel={dataset.extensionLabel}
            phase2Context={dataset.phase2Context}
          />
        </div>
      </div>
    </div>
  );
}

function OverviewRoute({
  dataset,
  selectedAnchorRef,
  onNavigate,
}: {
  dataset: SupportWorkspaceDataset;
  selectedAnchorRef: string;
  onNavigate: (path: string) => void;
}) {
  return (
    <div className="support-workspace__center-stack" data-testid="SupportTicketRoute">
      {dataset.fallbackProjection ? (
        <ReadOnlyFallbackHero fallbackProjection={dataset.fallbackProjection} artifact={dataset.strongestArtifact} onNavigate={onNavigate} />
      ) : null}
      <OmnichannelTimeline dataset={dataset} selectedAnchorRef={selectedAnchorRef} />
    </div>
  );
}

function ConversationRoute({
  dataset,
  selectedAnchorRef,
  onNavigate,
}: {
  dataset: SupportWorkspaceDataset;
  selectedAnchorRef: string;
  onNavigate: (path: string) => void;
}) {
  return (
    <div className="support-workspace__center-stack" data-testid="SupportConversationRoute">
      {dataset.fallbackProjection ? (
        <ReadOnlyFallbackHero fallbackProjection={dataset.fallbackProjection} artifact={dataset.strongestArtifact} onNavigate={onNavigate} />
      ) : null}
      <SupportTicketChildRouteShell
        dataset={dataset}
        routeKey="ticket-conversation"
        title="Conversation stays same-shell and anchor preserving."
        summary="Support can review the current exchange without leaving the approved ticket shell or widening beyond the current mask scope."
        topology="two_plane"
        mainContent={<OmnichannelTimeline dataset={dataset} selectedAnchorRef={selectedAnchorRef} />}
        promotedRegion={
          <GovernedChildRoutePlaceholder
            routeLabel="Conversation plane"
            summary="Reply, note, and channel-specific detail remain route-aware instead of opening a detached support page."
          />
        }
      />
    </div>
  );
}

function HistoryRoute({
  dataset,
  selectedAnchorRef,
  onNavigate,
  onDisclosureExpand,
}: {
  dataset: SupportWorkspaceDataset;
  selectedAnchorRef: string;
  onNavigate: (path: string) => void;
  onDisclosureExpand: () => void;
}) {
  return (
    <div className="support-workspace__center-stack" data-testid="SupportHistoryRoute">
      {dataset.fallbackProjection ? (
        <ReadOnlyFallbackHero fallbackProjection={dataset.fallbackProjection} artifact={dataset.strongestArtifact} onNavigate={onNavigate} />
      ) : null}
      <SupportTicketChildRouteShell
        dataset={dataset}
        routeKey="ticket-history"
        title="History detail remains same-shell and disclosure-bound."
        summary="Wider history never becomes a detached utility page. The same anchor, ticket history, and mask scope remain visible throughout."
        topology="two_plane"
        mainContent={<OmnichannelTimeline dataset={dataset} selectedAnchorRef={selectedAnchorRef} />}
        promotedRegion={<SupportHistoryView dataset={dataset} onExpand={onDisclosureExpand} />}
      />
    </div>
  );
}

function KnowledgeRoute({
  dataset,
  selectedAnchorRef,
  onNavigate,
}: {
  dataset: SupportWorkspaceDataset;
  selectedAnchorRef: string;
  onNavigate: (path: string) => void;
}) {
  return (
    <div className="support-workspace__center-stack" data-testid="SupportKnowledgeRoute">
      {dataset.fallbackProjection ? (
        <ReadOnlyFallbackHero fallbackProjection={dataset.fallbackProjection} artifact={dataset.strongestArtifact} onNavigate={onNavigate} />
      ) : null}
      <SupportTicketChildRouteShell
        dataset={dataset}
        routeKey="ticket-knowledge"
        title="Knowledge promotion remains bound to the current ticket anchor."
        summary="Ranked guidance stays mask-safe and same-shell, even when the operator pivots between knowledge, conversation, and replay."
        topology="two_plane"
        mainContent={<OmnichannelTimeline dataset={dataset} selectedAnchorRef={selectedAnchorRef} />}
        promotedRegion={<SupportKnowledgeView dataset={dataset} />}
      />
    </div>
  );
}

function ActionRoute({
  dataset,
  selectedAnchorRef,
  actionKey,
  onNavigate,
}: {
  dataset: SupportWorkspaceDataset;
  selectedAnchorRef: string;
  actionKey?: SupportActionKey;
  onNavigate: (path: string) => void;
}) {
  if (!actionKey) {
    return (
      <div className="support-workspace__center-stack" data-testid="SupportActionRoute">
        {dataset.fallbackProjection ? (
          <ReadOnlyFallbackHero fallbackProjection={dataset.fallbackProjection} artifact={dataset.strongestArtifact} onNavigate={onNavigate} />
        ) : null}
        <GovernedChildRoutePlaceholder
          routeLabel="Action route"
          summary="Action child routes stay same-shell and limited. Choose one approved action from the active lease before widening the dock."
        />
      </div>
    );
  }

  return (
    <div className="support-workspace__center-stack" data-testid="SupportActionRoute">
      {dataset.fallbackProjection ? (
        <ReadOnlyFallbackHero fallbackProjection={dataset.fallbackProjection} artifact={dataset.strongestArtifact} onNavigate={onNavigate} />
      ) : null}
      <SupportTicketChildRouteShell
        dataset={dataset}
        routeKey="ticket-action"
        title={`${labelize(actionKey)} stays governed by the current ticket tuple.`}
        summary="The action child route keeps the same chronology and selected anchor while the workbench stages one limited action at a time."
        topology="two_plane"
        mainContent={<OmnichannelTimeline dataset={dataset} selectedAnchorRef={selectedAnchorRef} />}
        promotedRegion={
          <GovernedChildRoutePlaceholder
            routeLabel={`${labelize(actionKey)} route`}
            summary="This action child route keeps the same chronology and selected anchor while the sticky workbench stages one limited action at a time."
          />
        }
      />
    </div>
  );
}

function ObserveRoute({
  dataset,
  selectedAnchorRef,
  onNavigate,
}: {
  dataset: SupportWorkspaceDataset;
  selectedAnchorRef: string;
  onNavigate: (path: string) => void;
}) {
  return (
    <div className="support-workspace__center-stack" data-testid="SupportObserveRoute">
      {dataset.fallbackProjection ? (
        <ReadOnlyFallbackHero fallbackProjection={dataset.fallbackProjection} artifact={dataset.strongestArtifact} onNavigate={onNavigate} />
      ) : null}
      <SupportTicketChildRouteShell
        dataset={dataset}
        routeKey="ticket-observe"
        title="Observe mode keeps the same ticket in read-only view."
        summary="Support can inspect the current timeline and linked context without enabling live actions."
        topology="two_plane"
        mainContent={<OmnichannelTimeline dataset={dataset} selectedAnchorRef={selectedAnchorRef} />}
        promotedRegion={<ObserveRoutePanel dataset={dataset} />}
      />
    </div>
  );
}

function ReplayRoute({
  dataset,
  selectedAnchorRef,
  onNavigate,
  onRestore,
}: {
  dataset: SupportWorkspaceDataset;
  selectedAnchorRef: string;
  onNavigate: (path: string) => void;
  onRestore: () => void;
}) {
  return (
    <div className="support-workspace__center-stack" data-testid="SupportReplayRoute">
      {dataset.fallbackProjection ? (
        <ReadOnlyFallbackHero fallbackProjection={dataset.fallbackProjection} artifact={dataset.strongestArtifact} onNavigate={onNavigate} />
      ) : null}
      <SupportTicketChildRouteShell
        dataset={dataset}
        routeKey="ticket-replay"
        title="Replay is a approved forensic deck, not a detached log viewer."
        summary="The shell freezes the selected anchor, shows the exact evidence boundary, buffers later live changes into delta review, and restores live work only after explicit revalidation."
        topology="three_plane"
        mainContent={<OmnichannelTimeline dataset={dataset} selectedAnchorRef={selectedAnchorRef} />}
        promotedRegion={<SupportReplaySurface dataset={dataset} onRestore={onRestore} />}
      />
    </div>
  );
}

function useReducedMotionPreference(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return reducedMotion;
}

export function SupportWorkspaceApp() {
  const { route, pathname, queryState, navigate } = useSupportWorkspaceRouter();
  const reducedMotion = useReducedMotionPreference();
  const dataset = useMemo(() => createSupportWorkspaceDataset(route, queryState), [route, queryState]);
  const [replayGate, setReplayGate] = useState<SupportReplayGate | null>(() => readSupportReplayGate());
  const lastSupportRouteEventKeyRef = useRef("");
  const lastSupportRecoveryEventKeyRef = useRef("");

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = formatVecellTitle("Support Workspace", route.supportTicketId);
    }
  }, [route.supportTicketId]);

  useEffect(() => {
    const actionFamily = actionFamilyForSupportRoute(route);
    if (!actionFamily) {
      return;
    }
    const routeEventKey = [
      route.routeKey,
      queryState.selectedAnchorRef,
      queryState.scenario,
      dataset.shellMode,
      route.actionKey ?? "none",
    ].join(":");
    if (lastSupportRouteEventKeyRef.current === routeEventKey) {
      return;
    }
    recordWorkspaceSupportUiEvent({
      routeFamilyRef: "rf_support_ticket_workspace",
      routePath: pathname,
      routeIntentRef: `support.${route.routeKey}.entered`,
      canonicalObjectDescriptorRef: SUPPORT_ROUTE_REGISTRY[route.routeKey].testId,
      canonicalEntitySeed: route.supportTicketId,
      shellInstanceRef: "par_267_phase3_track_playwright_frontend_support_replay_linked_context",
      continuityKey: dataset.ticketWorkspace.workspaceContinuityKey,
      selectedAnchorRef: queryState.selectedAnchorRef,
      surfaceRef: SUPPORT_ROUTE_REGISTRY[route.routeKey].testId,
      audienceTier: "support",
      channelContextRef: "browser.support_workspace",
      actionFamily,
      eventClass:
        route.routeKey === "ticket-replay"
          ? "recovery"
          : route.routeKey === "ticket-history" || route.routeKey === "ticket-knowledge"
            ? "projection"
            : "transition",
      eventState: validationEventStateForSupport(dataset.shellMode, queryState.scenario),
      publicationPosture: validationPublicationPostureForSupport(dataset.shellMode),
      recoveryPosture: validationRecoveryPostureForSupport(dataset.shellMode, queryState.scenario),
      shellDecisionClass:
        dataset.shellMode === "read_only_recovery"
          ? "frozen"
          : route.routeKey === "ticket-replay"
            ? "restored"
            : "reused",
      semanticCoverageRef: "SupportMaskingFallbackRouteContract",
      releaseTupleRef: dataset.runtimeBinding.frontendContractManifestRef,
      evidenceLinkPath:
        route.routeKey === "ticket-replay"
          ? "/Users/test/Code/V/output/playwright/269-workspace-support-event-chains-support.png"
          : "/Users/test/Code/V/output/playwright/269-validation-board-support-integrity.png",
      interactionMode: "system",
      maskedContactDescriptor: route.routeKey === "ticket-action" ? "m***@service.invalid" : null,
      ...validationSettlementProfileForSupport(dataset.shellMode, queryState.scenario),
    });
    lastSupportRouteEventKeyRef.current = routeEventKey;
  }, [dataset, pathname, queryState.scenario, queryState.selectedAnchorRef, route]);

  useEffect(() => {
    if (dataset.shellMode === "live" && queryState.scenario !== "blocked") {
      return;
    }
    const recoveryEventKey = [
      route.routeKey,
      queryState.scenario,
      dataset.shellMode,
      queryState.selectedAnchorRef,
    ].join(":");
    if (lastSupportRecoveryEventKeyRef.current === recoveryEventKey) {
      return;
    }
    recordWorkspaceSupportUiEvent({
      routeFamilyRef: "rf_support_ticket_workspace",
      routePath: pathname,
      routeIntentRef: `support.${route.routeKey}.recovery`,
      canonicalObjectDescriptorRef: SUPPORT_ROUTE_REGISTRY[route.routeKey].testId,
      canonicalEntitySeed: route.supportTicketId,
      shellInstanceRef: "par_267_phase3_track_playwright_frontend_support_replay_linked_context",
      continuityKey: dataset.ticketWorkspace.workspaceContinuityKey,
      selectedAnchorRef: queryState.selectedAnchorRef,
      surfaceRef: SUPPORT_ROUTE_REGISTRY[route.routeKey].testId,
      audienceTier: "support",
      channelContextRef: "browser.support_workspace",
      actionFamily: "stale_recovery",
      eventClass: "recovery",
      eventState: validationEventStateForSupport(dataset.shellMode, queryState.scenario),
      publicationPosture: validationPublicationPostureForSupport(dataset.shellMode),
      recoveryPosture: validationRecoveryPostureForSupport(dataset.shellMode, queryState.scenario),
      shellDecisionClass: "frozen",
      semanticCoverageRef: "SupportMaskingFallbackRouteContract",
      releaseTupleRef: dataset.runtimeBinding.frontendContractManifestRef,
      evidenceLinkPath: "/Users/test/Code/V/output/playwright/269-workspace-support-event-chains-support.png",
      interactionMode: "system",
      maskedContactDescriptor: "m***@service.invalid",
      ...validationSettlementProfileForSupport(dataset.shellMode, queryState.scenario),
    });
    lastSupportRecoveryEventKeyRef.current = recoveryEventKey;
  }, [
    dataset.runtimeBinding.frontendContractManifestRef,
    dataset.shellMode,
    dataset.ticketWorkspace.workspaceContinuityKey,
    pathname,
    queryState.scenario,
    queryState.selectedAnchorRef,
    route.routeKey,
    route.supportTicketId,
  ]);

  useEffect(() => {
    if (!dataset.replaySession || !dataset.replayRestoreSettlement) {
      if (route.routeKey !== "ticket-replay") {
        setReplayGate(readSupportReplayGate());
      }
      return;
    }
    if (dataset.replayRestoreSettlement.restoreState === "restored") {
      clearSupportReplayGate();
      setReplayGate(null);
      return;
    }
    const nextGate = {
      supportTicketId: route.supportTicketId,
      replaySessionId: dataset.replaySession.supportReplaySessionId,
      restoreState: dataset.replayRestoreSettlement.restoreState,
    } satisfies SupportReplayGate;
    writeSupportReplayGate(nextGate);
    setReplayGate(nextGate);
  }, [
    dataset.replayRestoreSettlement,
    dataset.replaySession,
    route.routeKey,
    route.supportTicketId,
  ]);

  const navigateToPath = (path: string) => navigate(path);
  const restoreFromReplay = () => {
    recordWorkspaceSupportUiEvent({
      routeFamilyRef: "rf_support_ticket_workspace",
      routePath: pathname,
      routeIntentRef: "support.replay.restore",
      canonicalObjectDescriptorRef: "SupportReplayRestoreBridge",
      canonicalEntitySeed: route.supportTicketId,
      shellInstanceRef: "par_267_phase3_track_playwright_frontend_support_replay_linked_context",
      continuityKey: dataset.ticketWorkspace.workspaceContinuityKey,
      selectedAnchorRef: queryState.selectedAnchorRef,
      surfaceRef: "SupportReplayRestoreBridge",
      audienceTier: "support",
      channelContextRef: "browser.support_workspace",
      actionFamily: "support_restore",
      eventClass: "transition",
      eventState: validationEventStateForSupport(dataset.shellMode, queryState.scenario),
      publicationPosture: validationPublicationPostureForSupport(dataset.shellMode),
      recoveryPosture: validationRecoveryPostureForSupport(dataset.shellMode, queryState.scenario),
      shellDecisionClass: "restored",
      semanticCoverageRef: "SupportMaskingFallbackRouteContract",
      releaseTupleRef: dataset.runtimeBinding.frontendContractManifestRef,
      evidenceLinkPath: "/Users/test/Code/V/output/playwright/269-workspace-support-event-chains-support.png",
      interactionMode: "pointer",
      maskedContactDescriptor: "m***@service.invalid",
      ...validationSettlementProfileForSupport(dataset.shellMode, queryState.scenario),
    });
    clearSupportReplayGate();
    setReplayGate(null);
    navigate(`/ops/support/tickets/${route.supportTicketId}`, {
      replayState: "frozen",
      deltaReviewState: "none",
      restoreState: "required",
      fallbackReason: "none",
    });
  };

  return (
    <SupportWorkspaceShell
      route={route}
      pathname={pathname}
      queryState={queryState}
      dataset={dataset}
      reducedMotion={reducedMotion}
      replayGate={replayGate}
      onNavigate={navigate}
      onScenarioChange={(nextScenario) => navigate(pathname, { scenario: nextScenario })}
      onAnchorSelect={(anchorRef) => navigate(pathname, { selectedAnchorRef: anchorRef })}
      onDisclosureExpand={() =>
        navigate(pathname, {
          disclosureState: queryState.disclosureState === "expanded" ? "summary_only" : "expanded",
          fallbackReason: queryState.disclosureState === "expanded" ? "none" : queryState.fallbackReason,
        })
      }
      onLinkedContextChange={(mode) => navigate(pathname, { linkedContextMode: mode })}
      onRestoreFromReplay={restoreFromReplay}
    >
      {route.routeKey === "ticket-overview" ? (
        <OverviewRoute dataset={dataset} selectedAnchorRef={queryState.selectedAnchorRef} onNavigate={navigateToPath} />
      ) : null}
      {route.routeKey === "ticket-conversation" ? (
        <ConversationRoute dataset={dataset} selectedAnchorRef={queryState.selectedAnchorRef} onNavigate={navigateToPath} />
      ) : null}
      {route.routeKey === "ticket-history" ? (
        <HistoryRoute
          dataset={dataset}
          selectedAnchorRef={queryState.selectedAnchorRef}
          onNavigate={navigateToPath}
          onDisclosureExpand={() =>
            navigate(pathname, {
              disclosureState: queryState.disclosureState === "expanded" ? "summary_only" : "expanded",
            })
          }
        />
      ) : null}
      {route.routeKey === "ticket-knowledge" ? (
        <KnowledgeRoute dataset={dataset} selectedAnchorRef={queryState.selectedAnchorRef} onNavigate={navigateToPath} />
      ) : null}
      {route.routeKey === "ticket-action" ? (
        <ActionRoute dataset={dataset} selectedAnchorRef={queryState.selectedAnchorRef} actionKey={route.actionKey} onNavigate={navigateToPath} />
      ) : null}
      {route.routeKey === "ticket-observe" ? (
        <ObserveRoute dataset={dataset} selectedAnchorRef={queryState.selectedAnchorRef} onNavigate={navigateToPath} />
      ) : null}
      {route.routeKey === "ticket-replay" ? (
        <ReplayRoute
          dataset={dataset}
          selectedAnchorRef={queryState.selectedAnchorRef}
          onNavigate={navigateToPath}
          onRestore={restoreFromReplay}
        />
      ) : null}
    </SupportWorkspaceShell>
  );
}
