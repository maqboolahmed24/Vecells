import { createHash } from "node:crypto";
import {
  SUPPORT_LINEAGE_FIXTURE_TICKET_ID,
  createSupportLineageTicketSubjectHistoryApplication,
  type SupportLineageArtifactBinding,
  type SupportLineageBinding,
  type SupportLineageScopeMember,
  type SupportReadOnlyFallbackProjection,
  type SupportShellMode,
  type SupportTicket,
  type SupportTicketWorkspaceProjection,
} from "./support-lineage-ticket-subject-history";

export const SUPPORT_REPAIR_CHAIN_ASSEMBLER_NAME = "SupportRepairChainAssembler";
export const REPLAY_CHECKPOINT_SERVICE_NAME = "ReplayCheckpointService";
export const REPLAY_RESTORE_SERVICE_NAME = "ReplayRestoreService";
export const SUPPORT_REPAIR_REPLAY_SCHEMA_VERSION = "219.crosscutting.support-repair-replay.v1";
export const SUPPORT_REPAIR_REPLAY_VISUAL_MODE = "Support_Replay_Control_Atlas";
export const SUPPORT_REPAIR_REPLAY_FIXTURE_TICKET_ID = SUPPORT_LINEAGE_FIXTURE_TICKET_ID;

export const SUPPORT_REPAIR_REPLAY_QUERY_SURFACES = [
  "POST /ops/support/tickets/:supportTicketId/communication-repair/preview",
  "POST /ops/support/tickets/:supportTicketId/communication-repair/commit",
  "POST /ops/support/tickets/:supportTicketId/replay/start",
  "POST /ops/support/tickets/:supportTicketId/replay/release",
  "GET /ops/support/tickets/:supportTicketId/timeline",
  "GET /ops/support/tickets/:supportTicketId/restore-status",
] as const;

export const SUPPORT_REPAIR_REPLAY_REASON_CODES = [
  "SUPPORT_219_REPAIR_CHAIN_CANONICAL_COMMUNICATION_BOUND",
  "SUPPORT_219_REPAIR_DEDUPE_REUSED_LIVE_ATTEMPT",
  "SUPPORT_219_REPAIR_AWAITING_EXTERNAL_SETTLEMENT",
  "SUPPORT_219_REPAIR_DENIED_BY_THREAD_RESOLUTION_GATE",
  "SUPPORT_219_REPAIR_STALE_RECOVERABLE",
  "SUPPORT_219_REPAIR_MANUAL_HANDOFF_REQUIRED",
  "SUPPORT_219_REPAIR_PROVIDER_CALLBACK_SIGNATURE_VALIDATED",
  "SUPPORT_219_REPAIR_PROVIDER_CALLBACK_SIGNATURE_REJECTED",
  "SUPPORT_219_PROVIDER_METADATA_SAFE_CORRELATION_ONLY",
  "SUPPORT_219_REPLAY_CHECKPOINT_FROZEN",
  "SUPPORT_219_REPLAY_BOUNDARY_EXCLUDES_DRAFTS_AND_LATER_PROOF",
  "SUPPORT_219_REPLAY_RELEASE_DELTA_REVIEW_REQUIRED",
  "SUPPORT_219_REPLAY_RESTORE_LIVE_CONTROLS_REARMED",
  "SUPPORT_219_REPLAY_RESTORE_BLOCKED_READ_ONLY_FALLBACK",
] as const;

export const SUPPORT_REPAIR_REPLAY_FORBIDDEN_PROVIDER_METADATA_FIELDS = [
  "sendgrid.categories.phi",
  "sendgrid.categories.direct_patient_identifier",
  "sendgrid.unique_args.phi",
  "sendgrid.unique_args.direct_patient_identifier",
  "sendgrid.custom_args.phi",
  "sendgrid.custom_args.direct_patient_identifier",
  "twilio.status_callback_url.phi_query_param",
  "twilio.status_callback_url.direct_patient_identifier",
] as const;

export const supportProviderWebhookSignatureControls = {
  twilio:
    "Validate the X-Twilio-Signature header against the full callback URL and request parameters before accepting delivery truth.",
  sendgrid:
    "Validate the X-Twilio-Email-Event-Webhook-Signature and X-Twilio-Email-Event-Webhook-Timestamp headers with the configured public key, or use the provider-supported OAuth Event Webhook path.",
} as const;

export type SupportRepairReplayReasonCode = (typeof SUPPORT_REPAIR_REPLAY_REASON_CODES)[number];
export type SupportRepairKind =
  | "controlled_resend"
  | "reissue"
  | "channel_change"
  | "callback_reschedule"
  | "attachment_recovery";
export type SupportRepairChannel = "sms" | "email" | "in_app" | "voice_callback";
export type SupportMutationAttemptState =
  | "preview_only"
  | "awaiting_external"
  | "provider_observed"
  | "settled"
  | "stale_recoverable"
  | "read_only_fallback"
  | "manual_handoff_required";
export type SupportActionSettlementResult =
  | "preview_authorized"
  | "awaiting_external"
  | "authoritative_settled"
  | "authoritative_failed"
  | "denied_scope"
  | "stale_recoverable"
  | "manual_handoff_required"
  | "read_only_fallback";
export type DeliveryEvidenceStatus =
  | "pending"
  | "delivered"
  | "failed"
  | "expired"
  | "disputed"
  | "suppressed";
export type ThreadResolutionDecision =
  | "hold"
  | "repair_route"
  | "reopen"
  | "close"
  | "manual_review";
export type SupportReplayState = "frozen" | "released" | "read_only_fallback";
export type SupportReplayRestoreResult =
  | "live_restored"
  | "read_only_fallback"
  | "awaiting_external_hold";
export type SupportRouteIntentState = "live" | "stale" | "expired" | "route_drift";
export type SupportContinuityTrustState =
  | "trusted"
  | "stale"
  | "mask_scope_drift"
  | "lineage_drift";
export type SupportTimelineFreshness = "live" | "paused_replay" | "read_only_recovery";
export type ProviderName = "sendgrid" | "twilio";
export type ProviderWebhookSignatureState =
  | "validated"
  | "quarantined_invalid_signature"
  | "unsupported_provider";

export interface SupportRepairReplayRouteDefinition {
  readonly routeId: string;
  readonly method: "GET" | "POST";
  readonly path: string;
  readonly contractFamily: string;
  readonly projectionNames: readonly string[];
  readonly purpose: string;
  readonly bodyRequired: boolean;
  readonly idempotencyRequired: boolean;
}

export const supportRepairAndReplayRoutes = [
  {
    routeId: "support_communication_repair_preview",
    method: "POST",
    path: "/ops/support/tickets/{supportTicketId}/communication-repair/preview",
    contractFamily: "SupportCommunicationRepairPreviewContract",
    projectionNames: [
      "SupportRepairChainView",
      "SupportMutationAttempt",
      "SupportActionRecord",
      "SupportActionSettlement",
      "SupportReadOnlyFallbackProjection",
    ],
    purpose:
      "Dry-run a controlled resend, reissue, channel change, callback reschedule, or attachment recovery against the current canonical dispatch/evidence/lineage chain.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "support_communication_repair_commit",
    method: "POST",
    path: "/ops/support/tickets/{supportTicketId}/communication-repair/commit",
    contractFamily: "SupportCommunicationRepairCommitContract",
    projectionNames: [
      "SupportMutationAttempt",
      "SupportActionRecord",
      "SupportActionSettlement",
      "MessageDispatchEnvelope",
      "MessageDeliveryEvidenceBundle",
      "ThreadExpectationEnvelope",
      "ThreadResolutionGate",
    ],
    purpose:
      "Reserve one live SupportMutationAttempt for an authorized communication repair and collapse duplicate operator clicks or worker retries onto that attempt.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "support_replay_start",
    method: "POST",
    path: "/ops/support/tickets/{supportTicketId}/replay/start",
    contractFamily: "SupportReplayStartContract",
    projectionNames: [
      "CommunicationReplayRecord",
      "SupportReplayCheckpoint",
      "SupportReplayEvidenceBoundary",
      "SupportOmnichannelTimelineProjection",
    ],
    purpose:
      "Freeze current support evidence, preserve ticket and timeline anchors, and suspend mutating controls while replay runs.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "support_replay_release",
    method: "POST",
    path: "/ops/support/tickets/{supportTicketId}/replay/release",
    contractFamily: "SupportReplayReleaseContract",
    projectionNames: [
      "SupportReplayDeltaReview",
      "SupportReplayReleaseDecision",
      "SupportReplayRestoreSettlement",
      "SupportRouteIntentToken",
      "SupportContinuityEvidenceProjection",
      "SupportReadOnlyFallbackProjection",
    ],
    purpose:
      "Release a replay checkpoint only after delta review, fresh route intent, continuity, lineage, mask-scope, and lease proof are present.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "support_ticket_timeline_current",
    method: "GET",
    path: "/ops/support/tickets/{supportTicketId}/timeline",
    contractFamily: "SupportOmnichannelTimelineProjectionContract",
    projectionNames: [
      "SupportOmnichannelTimelineProjection",
      "SupportActionSettlement",
      "MessageDeliveryEvidenceBundle",
      "ThreadResolutionGate",
    ],
    purpose:
      "Hydrate support timeline chronology with provisional versus authoritative repair states aligned to patient receipts and canonical delivery evidence.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "support_repair_restore_status",
    method: "GET",
    path: "/ops/support/tickets/{supportTicketId}/restore-status",
    contractFamily: "SupportReplayRestoreStatusContract",
    projectionNames: [
      "SupportReplayRestoreSettlement",
      "SupportReadOnlyFallbackProjection",
      "SupportContinuityEvidenceProjection",
    ],
    purpose:
      "Return the latest live-restore or same-shell read-only fallback status for support workbench rehydration.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
] as const satisfies readonly SupportRepairReplayRouteDefinition[];

export interface MessageDispatchEnvelope {
  readonly projectionName: "MessageDispatchEnvelope";
  readonly messageDispatchEnvelopeId: string;
  readonly supportTicketId: string;
  readonly governingThreadRef: string;
  readonly governingSubthreadRef: string;
  readonly governingThreadTupleHash: string;
  readonly governingSubthreadTupleHash: string;
  readonly dispatchAuthorityRef: string;
  readonly providerName: ProviderName;
  readonly channel: SupportRepairChannel;
  readonly dispatchState: "accepted" | "withheld" | "superseded";
  readonly patientReceiptEnvelopeRef: string;
  readonly supportMutationAttemptRef: string | null;
  readonly createdAt: string;
}

export interface MessageDeliveryEvidenceBundle {
  readonly projectionName: "MessageDeliveryEvidenceBundle";
  readonly messageDeliveryEvidenceBundleId: string;
  readonly messageDispatchEnvelopeRef: string;
  readonly providerName: ProviderName;
  readonly providerMessageRefHash: string;
  readonly latestEvidenceStatus: DeliveryEvidenceStatus;
  readonly authoritativeAt: string | null;
  readonly adapterReceiptCheckpointRefs: readonly string[];
  readonly evidenceBundleHash: string;
  readonly source: "adapter_receipt_checkpoint" | "manual_attestation" | "simulator";
}

export interface ThreadExpectationEnvelope {
  readonly projectionName: "ThreadExpectationEnvelope";
  readonly threadExpectationEnvelopeId: string;
  readonly governingThreadRef: string;
  readonly governingSubthreadRef: string;
  readonly expectedNextActor: "patient" | "clinician" | "support" | "provider";
  readonly expectedDeliveryState: DeliveryEvidenceStatus;
  readonly expectationVersionRef: string;
  readonly createdAt: string;
}

export interface ThreadResolutionGate {
  readonly projectionName: "ThreadResolutionGate";
  readonly threadResolutionGateId: string;
  readonly governingThreadRef: string;
  readonly governingSubthreadRef: string;
  readonly gateDecision: ThreadResolutionDecision;
  readonly authorizedRepairActions: readonly ThreadResolutionDecision[];
  readonly gateVersionRef: string;
  readonly reasonCodes: readonly SupportRepairReplayReasonCode[];
  readonly evaluatedAt: string;
}

export interface SupportRepairChainView {
  readonly projectionName: "SupportRepairChainView";
  readonly supportTicketId: string;
  readonly supportLineageBinding: SupportLineageBinding;
  readonly supportLineageScopeMember: SupportLineageScopeMember;
  readonly supportLineageArtifactBindings: readonly SupportLineageArtifactBinding[];
  readonly supportTicket: SupportTicket;
  readonly supportTicketWorkspaceProjection: SupportTicketWorkspaceProjection;
  readonly messageDispatchEnvelope: MessageDispatchEnvelope;
  readonly latestDeliveryEvidenceBundle: MessageDeliveryEvidenceBundle;
  readonly latestThreadExpectationEnvelope: ThreadExpectationEnvelope;
  readonly latestThreadResolutionGate: ThreadResolutionGate;
  readonly governingThreadTupleHash: string;
  readonly governingSubthreadTupleHash: string;
  readonly canonicalChainHash: string;
  readonly freshRepairAuthorized: boolean;
  readonly reasonCodes: readonly SupportRepairReplayReasonCode[];
  readonly assembledBy: typeof SUPPORT_REPAIR_CHAIN_ASSEMBLER_NAME;
  readonly assembledAt: string;
}

export interface ProviderSafeMetadataBundle {
  readonly projectionName: "ProviderSafeMetadataBundle";
  readonly providerName: ProviderName;
  readonly category: "support_repair_notice";
  readonly customArgs: Readonly<Record<string, string>>;
  readonly uniqueArgs: Readonly<Record<string, string>>;
  readonly localLookupRef: string;
  readonly phiInProviderMetadata: false;
  readonly directPatientIdentifierInProviderMetadata: false;
  readonly checkedAgainstForbiddenFields: readonly string[];
  readonly reasonCodes: readonly SupportRepairReplayReasonCode[];
}

export interface SupportMutationAttempt {
  readonly projectionName: "SupportMutationAttempt";
  readonly supportMutationAttemptId: string;
  readonly supportTicketId: string;
  readonly repairKind: SupportRepairKind;
  readonly requestedChannel: SupportRepairChannel;
  readonly requestedByRef: string;
  readonly requestedAt: string;
  readonly idempotencyKey: string;
  readonly dedupeKey: string;
  readonly mutationEnvelopeState: SupportMutationAttemptState;
  readonly messageDispatchEnvelopeRef: string;
  readonly latestDeliveryEvidenceBundleRef: string;
  readonly latestThreadExpectationEnvelopeRef: string;
  readonly latestThreadResolutionGateRef: string;
  readonly supportLineageBindingRef: string;
  readonly supportLineageBindingHash: string;
  readonly actionableScopeMemberRef: string;
  readonly governingThreadRef: string;
  readonly governingSubthreadRef: string;
  readonly governingThreadTupleHash: string;
  readonly governingSubthreadTupleHash: string;
  readonly canonicalChainHash: string;
  readonly providerSafeMetadata: ProviderSafeMetadataBundle;
  readonly externalEffectCount: number;
  readonly reasonCodes: readonly SupportRepairReplayReasonCode[];
}

export interface SupportActionRecord {
  readonly projectionName: "SupportActionRecord";
  readonly supportActionRecordId: string;
  readonly supportMutationAttemptRef: string;
  readonly supportTicketId: string;
  readonly operatorIntent: SupportRepairKind;
  readonly requestedByRef: string;
  readonly idempotencyKey: string;
  readonly messageDispatchEnvelopeRef: string;
  readonly supportLineageBindingRef: string;
  readonly actionableScopeMemberRef: string;
  readonly actionLeaseRef: string;
  readonly commandRef: string;
  readonly causalToken: string;
  readonly reasonCodes: readonly SupportRepairReplayReasonCode[];
  readonly recordedAt: string;
}

export interface SupportActionSettlement {
  readonly projectionName: "SupportActionSettlement";
  readonly supportActionSettlementId: string;
  readonly supportMutationAttemptRef: string;
  readonly supportActionRecordRef: string;
  readonly supportTicketId: string;
  readonly localAckState: "accepted" | "reused" | "denied";
  readonly processingAcceptanceState: "accepted" | "withheld" | "blocked";
  readonly externalObservationState:
    | "not_started"
    | "awaiting_provider_callback"
    | "observed"
    | "signature_rejected";
  readonly authoritativeOutcomeState: "provisional" | "settled" | "failed" | "blocked";
  readonly result: SupportActionSettlementResult;
  readonly messageDispatchEnvelopeRef: string;
  readonly deliveryEvidenceBundleRef: string;
  readonly threadResolutionGateRef: string;
  readonly patientReceiptEnvelopeRef: string;
  readonly patientReceiptParity: "provisional" | "authoritative" | "blocked";
  readonly structuredLogRef: string;
  readonly reasonCodes: readonly SupportRepairReplayReasonCode[];
  readonly settledAt: string | null;
}

export interface AdapterReceiptCheckpoint {
  readonly projectionName: "AdapterReceiptCheckpoint";
  readonly adapterReceiptCheckpointId: string;
  readonly providerName: ProviderName;
  readonly supportMutationAttemptRef: string;
  readonly messageDispatchEnvelopeRef: string;
  readonly deliveryEvidenceBundleRef: string;
  readonly providerMessageRefHash: string;
  readonly webhookSignatureState: ProviderWebhookSignatureState;
  readonly correlationId: string;
  readonly causalToken: string;
  readonly observedStatus: DeliveryEvidenceStatus;
  readonly rawPayloadStoredRef: string;
  readonly reasonCodes: readonly SupportRepairReplayReasonCode[];
  readonly observedAt: string;
}

export interface CommunicationReplayRecord {
  readonly projectionName: "CommunicationReplayRecord";
  readonly communicationReplayRecordId: string;
  readonly supportTicketId: string;
  readonly supportReplayCheckpointRef: string;
  readonly supportReplayEvidenceBoundaryRef: string;
  readonly replayState: SupportReplayState;
  readonly startedByRef: string;
  readonly startedAt: string;
  readonly releasedAt: string | null;
  readonly mutatingControlsSuspended: true;
  readonly draftHoldRef: string;
}

export interface SupportReplayCheckpoint {
  readonly projectionName: "SupportReplayCheckpoint";
  readonly supportReplayCheckpointId: string;
  readonly supportTicketId: string;
  readonly supportLineageBindingRef: string;
  readonly supportLineageBindingHash: string;
  readonly ticketVersionRef: string;
  readonly ticketAnchorRef: string;
  readonly selectedTimelineAnchorRef: string;
  readonly selectedTimelineAnchorTupleHashRef: string;
  readonly maskScopeRef: string;
  readonly disclosureCeilingRef: string;
  readonly routeIntentTokenRef: string;
  readonly queueAnchorRef: string;
  readonly projectionWatermarkRef: string;
  readonly evidenceBoundaryRef: string;
  readonly draftHoldRef: string;
  readonly checkpointHash: string;
  readonly createdBy: typeof REPLAY_CHECKPOINT_SERVICE_NAME;
  readonly createdAt: string;
}

export interface SupportReplayEvidenceBoundary {
  readonly projectionName: "SupportReplayEvidenceBoundary";
  readonly supportReplayEvidenceBoundaryId: string;
  readonly supportReplayCheckpointRef: string;
  readonly supportTicketId: string;
  readonly includedEvidenceRefs: readonly string[];
  readonly excludedDraftRefs: readonly string[];
  readonly excludedInFlightOutboundAttemptRefs: readonly string[];
  readonly excludedLaterConfirmationRefs: readonly string[];
  readonly excludedWiderDisclosureRefs: readonly string[];
  readonly strongestConfirmedArtifactRef: string;
  readonly evidenceBoundaryHash: string;
  readonly reasonCodes: readonly SupportRepairReplayReasonCode[];
  readonly createdAt: string;
}

export interface SupportReplayDeltaReview {
  readonly projectionName: "SupportReplayDeltaReview";
  readonly supportReplayDeltaReviewId: string;
  readonly supportReplayCheckpointRef: string;
  readonly supportTicketId: string;
  readonly currentTicketVersionRef: string;
  readonly checkpointTicketVersionRef: string;
  readonly changedProjectionRefs: readonly string[];
  readonly outsideBoundaryDraftRefs: readonly string[];
  readonly pendingExternalAttemptRefs: readonly string[];
  readonly maskScopeDrift: "none" | "narrowed" | "widened";
  readonly lineageBindingHashMatches: boolean;
  readonly reviewState: "accepted" | "blocked";
  readonly reasonCodes: readonly SupportRepairReplayReasonCode[];
  readonly reviewedAt: string;
}

export interface SupportRouteIntentToken {
  readonly projectionName: "SupportRouteIntentToken";
  readonly supportRouteIntentTokenId: string;
  readonly supportTicketId: string;
  readonly supportReplayCheckpointRef: string;
  readonly routeIntentState: SupportRouteIntentState;
  readonly routeTupleHash: string;
  readonly actionLeaseRef: string;
  readonly leaseState: "reacquired" | "stale" | "blocked";
  readonly issuedAt: string;
  readonly expiresAt: string;
}

export interface SupportContinuityEvidenceProjection {
  readonly projectionName: "SupportContinuityEvidenceProjection";
  readonly supportContinuityEvidenceProjectionId: string;
  readonly supportTicketId: string;
  readonly supportReplayCheckpointRef: string;
  readonly supportLineageBindingHash: string;
  readonly currentLineageBindingHash: string;
  readonly maskScopeRef: string;
  readonly currentMaskScopeRef: string;
  readonly continuityTrustState: SupportContinuityTrustState;
  readonly anchorTupleHash: string;
  readonly currentAnchorTupleHash: string;
  readonly routeIntentTokenRef: string;
  readonly evidenceBoundaryHash: string;
  readonly reasonCodes: readonly SupportRepairReplayReasonCode[];
  readonly evaluatedAt: string;
}

export interface SupportReplayReleaseDecision {
  readonly projectionName: "SupportReplayReleaseDecision";
  readonly supportReplayReleaseDecisionId: string;
  readonly supportTicketId: string;
  readonly supportReplayCheckpointRef: string;
  readonly supportReplayDeltaReviewRef: string;
  readonly supportRouteIntentTokenRef: string;
  readonly supportContinuityEvidenceProjectionRef: string;
  readonly decision: "restore_live" | "read_only_fallback" | "awaiting_external_hold";
  readonly freshTicketVersion: boolean;
  readonly liveRouteIntent: boolean;
  readonly reacquiredLease: boolean;
  readonly continuityTrusted: boolean;
  readonly currentLineageBinding: boolean;
  readonly sameMaskScope: boolean;
  readonly pendingExternalSettlementsClear: boolean;
  readonly reasonCodes: readonly SupportRepairReplayReasonCode[];
  readonly decidedBy: typeof REPLAY_RESTORE_SERVICE_NAME;
  readonly decidedAt: string;
}

export interface SupportReplayRestoreSettlement {
  readonly projectionName: "SupportReplayRestoreSettlement";
  readonly supportReplayRestoreSettlementId: string;
  readonly supportTicketId: string;
  readonly supportReplayCheckpointRef: string;
  readonly supportReplayReleaseDecisionRef: string;
  readonly supportReplayEvidenceBoundaryRef: string;
  readonly supportContinuityEvidenceProjectionRef: string;
  readonly result: SupportReplayRestoreResult;
  readonly restoredShellMode: SupportShellMode;
  readonly restoredTicketAnchorRef: string;
  readonly restoredTimelineAnchorRef: string;
  readonly restoredMaskScopeRef: string;
  readonly restoredLineageBindingHash: string;
  readonly heldSupportMutationAttemptRefs: readonly string[];
  readonly supportReadOnlyFallbackProjectionRef: string | null;
  readonly reasonCodes: readonly SupportRepairReplayReasonCode[];
  readonly settledAt: string;
}

export interface SupportActionWorkbenchProjection {
  readonly projectionName: "SupportActionWorkbenchProjection";
  readonly supportActionWorkbenchProjectionId: string;
  readonly supportTicketId: string;
  readonly supportMutationAttemptRef: string | null;
  readonly supportActionSettlementRef: string | null;
  readonly mutatingControlsState: "enabled" | "suspended_for_replay" | "read_only";
  readonly allowedRepairKinds: readonly SupportRepairKind[];
  readonly reasonCodes: readonly SupportRepairReplayReasonCode[];
}

export interface SupportReachabilityPostureProjection {
  readonly projectionName: "SupportReachabilityPostureProjection";
  readonly supportReachabilityPostureProjectionId: string;
  readonly supportTicketId: string;
  readonly providerName: ProviderName;
  readonly channel: SupportRepairChannel;
  readonly deliveryEvidenceBundleRef: string;
  readonly postureState: "at_risk" | "repairing" | "confirmed" | "blocked";
  readonly reasonCodes: readonly SupportRepairReplayReasonCode[];
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
  readonly freshness: SupportTimelineFreshness;
  readonly supportActionWorkbenchProjection: SupportActionWorkbenchProjection;
  readonly supportReachabilityPostureProjection: SupportReachabilityPostureProjection;
  readonly reasonCodes: readonly SupportRepairReplayReasonCode[];
  readonly generatedAt: string;
  readonly createdByAuthority: typeof SUPPORT_REPAIR_CHAIN_ASSEMBLER_NAME;
}

export interface SupportCommunicationRepairPreviewInput {
  readonly supportTicketId: string;
  readonly repairKind: SupportRepairKind;
  readonly requestedChannel?: SupportRepairChannel;
  readonly requestedByRef?: string;
  readonly idempotencyKey: string;
  readonly requestedAt?: string;
  readonly simulateEvidenceStatus?: DeliveryEvidenceStatus;
  readonly simulateGateDecision?: ThreadResolutionDecision;
  readonly simulateBindingState?: SupportLineageBinding["bindingState"];
}

export interface SupportCommunicationRepairCommitInput
  extends SupportCommunicationRepairPreviewInput {
  readonly commandRef?: string;
}

export interface ProviderCallbackInput {
  readonly supportTicketId: string;
  readonly supportMutationAttemptRef: string;
  readonly providerName: ProviderName;
  readonly providerMessageRef: string;
  readonly observedStatus: DeliveryEvidenceStatus;
  readonly signatureValid: boolean;
  readonly correlationId?: string;
  readonly causalToken?: string;
  readonly observedAt?: string;
}

export interface SupportReplayStartInput {
  readonly supportTicketId: string;
  readonly startedByRef?: string;
  readonly idempotencyKey: string;
  readonly startedAt?: string;
}

export interface SupportReplayReleaseInput {
  readonly supportTicketId: string;
  readonly supportReplayCheckpointRef: string;
  readonly releasedByRef?: string;
  readonly idempotencyKey: string;
  readonly releasedAt?: string;
  readonly simulateRouteIntentState?: SupportRouteIntentState;
  readonly simulateContinuityTrustState?: SupportContinuityTrustState;
  readonly simulateMaskScopeDrift?: "none" | "narrowed" | "widened";
  readonly simulatePendingExternal?: boolean;
  readonly simulateFreshTicketVersion?: boolean;
  readonly simulateReacquiredLease?: boolean;
  readonly simulateBindingState?: SupportLineageBinding["bindingState"];
}

export interface SupportCommunicationRepairPreviewResult {
  readonly projectionName: "SupportCommunicationRepairPreviewResult";
  readonly repairChain: SupportRepairChainView;
  readonly dedupeDecision:
    | "would_create_new_attempt"
    | "reuse_live_attempt"
    | "denied_scope"
    | "read_only_fallback";
  readonly existingAttempt: SupportMutationAttempt | null;
  readonly wouldCreateMutationAttemptRef: string | null;
  readonly supportReadOnlyFallbackProjection: SupportReadOnlyFallbackProjection | null;
  readonly reasonCodes: readonly SupportRepairReplayReasonCode[];
}

export interface SupportCommunicationRepairCommitResult {
  readonly projectionName: "SupportCommunicationRepairCommitResult";
  readonly repairChain: SupportRepairChainView;
  readonly dedupeDecision:
    | "created_new_attempt"
    | "exact_replay"
    | "reuse_live_attempt"
    | "denied_scope"
    | "read_only_fallback";
  readonly supportMutationAttempt: SupportMutationAttempt | null;
  readonly supportActionRecord: SupportActionRecord | null;
  readonly supportActionSettlement: SupportActionSettlement;
  readonly providerMetadata: ProviderSafeMetadataBundle | null;
  readonly supportReadOnlyFallbackProjection: SupportReadOnlyFallbackProjection | null;
  readonly externalEffectCount: number;
  readonly reasonCodes: readonly SupportRepairReplayReasonCode[];
}

export interface ProviderCallbackResult {
  readonly projectionName: "ProviderCallbackResult";
  readonly adapterReceiptCheckpoint: AdapterReceiptCheckpoint;
  readonly supportMutationAttempt: SupportMutationAttempt | null;
  readonly supportActionSettlement: SupportActionSettlement | null;
  readonly acceptedAsTruth: boolean;
}

export interface SupportReplayStartResult {
  readonly projectionName: "SupportReplayStartResult";
  readonly communicationReplayRecord: CommunicationReplayRecord;
  readonly supportReplayCheckpoint: SupportReplayCheckpoint;
  readonly supportReplayEvidenceBoundary: SupportReplayEvidenceBoundary;
  readonly supportOmnichannelTimelineProjection: SupportOmnichannelTimelineProjection;
}

export interface SupportReplayReleaseResult {
  readonly projectionName: "SupportReplayReleaseResult";
  readonly supportReplayDeltaReview: SupportReplayDeltaReview;
  readonly supportRouteIntentToken: SupportRouteIntentToken;
  readonly supportContinuityEvidenceProjection: SupportContinuityEvidenceProjection;
  readonly supportReplayReleaseDecision: SupportReplayReleaseDecision;
  readonly supportReplayRestoreSettlement: SupportReplayRestoreSettlement;
  readonly supportReadOnlyFallbackProjection: SupportReadOnlyFallbackProjection | null;
}

export interface SupportReplayRestoreStatusResult {
  readonly projectionName: "SupportReplayRestoreStatusResult";
  readonly supportTicketId: string;
  readonly activeReplayRecord: CommunicationReplayRecord | null;
  readonly latestRestoreSettlement: SupportReplayRestoreSettlement | null;
  readonly supportReadOnlyFallbackProjection: SupportReadOnlyFallbackProjection | null;
}

interface RepairAttemptState {
  attempt: SupportMutationAttempt;
  actionRecord: SupportActionRecord;
  settlement: SupportActionSettlement;
  chain: SupportRepairChainView;
  providerMetadata: ProviderSafeMetadataBundle;
  externalEffectCount: number;
  idempotencyKeys: Set<string>;
}

interface ReplayStateRecord {
  replayRecord: CommunicationReplayRecord;
  checkpoint: SupportReplayCheckpoint;
  boundary: SupportReplayEvidenceBoundary;
  idempotencyKeys: Set<string>;
  latestSettlement: SupportReplayRestoreSettlement | null;
  readOnlyFallback: SupportReadOnlyFallbackProjection | null;
}

function stableHash(parts: readonly unknown[]): string {
  return createHash("sha256").update(JSON.stringify(parts)).digest("hex").slice(0, 24);
}

function stableRef(prefix: string, parts: readonly unknown[]): string {
  return `${prefix}_${stableHash(parts)}`;
}

function clone<T>(value: T): T {
  return structuredClone(value) as T;
}

function requireValue<T>(value: T | undefined | null, message: string): T {
  if (value === undefined || value === null) {
    throw new Error(message);
  }
  return value;
}

function isDeliveryTerminalForFreshRepair(status: DeliveryEvidenceStatus): boolean {
  return status === "failed" || status === "expired" || status === "disputed";
}

function isGateAuthorizedForFreshRepair(gate: ThreadResolutionGate): boolean {
  return (
    gate.gateDecision === "repair_route" ||
    gate.gateDecision === "reopen" ||
    gate.authorizedRepairActions.includes("repair_route") ||
    gate.authorizedRepairActions.includes("reopen")
  );
}

function buildRepairDedupeKey(
  chain: SupportRepairChainView,
  repairKind: SupportRepairKind,
): string {
  return stableRef("support_repair_dedupe_219", [
    chain.supportTicketId,
    chain.governingThreadTupleHash,
    chain.governingSubthreadTupleHash,
    repairKind,
  ]);
}

function buildProviderSafeMetadata(
  chain: SupportRepairChainView,
  attemptRef: string,
): ProviderSafeMetadataBundle {
  return {
    projectionName: "ProviderSafeMetadataBundle",
    providerName: chain.messageDispatchEnvelope.providerName,
    category: "support_repair_notice",
    customArgs: {
      correlation_id: stableRef("corr_219", [attemptRef]),
      dispatch_ref_hash: stableHash([chain.messageDispatchEnvelope.messageDispatchEnvelopeId]),
      support_attempt_ref_hash: stableHash([attemptRef]),
    },
    uniqueArgs: {
      correlation_id: stableRef("corr_219", [attemptRef]),
      chain_ref_hash: chain.canonicalChainHash,
    },
    localLookupRef: stableRef("provider_metadata_lookup_219", [
      chain.supportTicketId,
      attemptRef,
      chain.canonicalChainHash,
    ]),
    phiInProviderMetadata: false,
    directPatientIdentifierInProviderMetadata: false,
    checkedAgainstForbiddenFields: SUPPORT_REPAIR_REPLAY_FORBIDDEN_PROVIDER_METADATA_FIELDS,
    reasonCodes: ["SUPPORT_219_PROVIDER_METADATA_SAFE_CORRELATION_ONLY"],
  };
}

export function validateProviderMetadataHygiene(metadata: ProviderSafeMetadataBundle): boolean {
  const serialized = JSON.stringify({
    category: metadata.category,
    customArgs: metadata.customArgs,
    uniqueArgs: metadata.uniqueArgs,
    localLookupRef: metadata.localLookupRef,
  }).toLowerCase();
  const forbiddenTokens = [
    "nhs_subject",
    "patient_id",
    "direct_patient",
    "dob",
    "postcode",
    "full_name",
    "phone_number",
    "email_address",
  ];
  return (
    metadata.phiInProviderMetadata === false &&
    metadata.directPatientIdentifierInProviderMetadata === false &&
    forbiddenTokens.every((token) => !serialized.includes(token))
  );
}

function createDispatchEnvelope(
  supportTicketId: string,
  requestedChannel: SupportRepairChannel,
  attemptedRef: string | null,
): MessageDispatchEnvelope {
  const governingThreadRef = "thread_214_a";
  const governingSubthreadRef = "subthread_214_replacement_photo";
  const governingThreadTupleHash = stableHash([
    supportTicketId,
    governingThreadRef,
    "lineage_214_a",
  ]);
  const governingSubthreadTupleHash = stableHash([
    supportTicketId,
    governingThreadRef,
    governingSubthreadRef,
    "lineage_case_link_214_callback_message",
  ]);
  return {
    projectionName: "MessageDispatchEnvelope",
    messageDispatchEnvelopeId: "MessageDispatchEnvelope_214_reply",
    supportTicketId,
    governingThreadRef,
    governingSubthreadRef,
    governingThreadTupleHash,
    governingSubthreadTupleHash,
    dispatchAuthorityRef: "ConversationCommandSettlement_214_reply",
    providerName: requestedChannel === "sms" ? "twilio" : "sendgrid",
    channel: requestedChannel,
    dispatchState: "accepted",
    patientReceiptEnvelopeRef: "PatientReceiptEnvelope_214_reply_provisional",
    supportMutationAttemptRef: attemptedRef,
    createdAt: "2026-04-16T13:45:00.000Z",
  };
}

function createDeliveryEvidenceBundle(
  dispatch: MessageDispatchEnvelope,
  evidenceStatus: DeliveryEvidenceStatus,
  receiptCheckpointRefs: readonly string[] = [],
): MessageDeliveryEvidenceBundle {
  return {
    projectionName: "MessageDeliveryEvidenceBundle",
    messageDeliveryEvidenceBundleId: `MessageDeliveryEvidenceBundle_214_reply_${evidenceStatus}`,
    messageDispatchEnvelopeRef: dispatch.messageDispatchEnvelopeId,
    providerName: dispatch.providerName,
    providerMessageRefHash: stableHash(["provider_message_214_reply"]),
    latestEvidenceStatus: evidenceStatus,
    authoritativeAt: evidenceStatus === "pending" ? null : "2026-04-16T14:06:00.000Z",
    adapterReceiptCheckpointRefs: receiptCheckpointRefs,
    evidenceBundleHash: stableHash([
      dispatch.messageDispatchEnvelopeId,
      evidenceStatus,
      receiptCheckpointRefs,
    ]),
    source: receiptCheckpointRefs.length > 0 ? "adapter_receipt_checkpoint" : "simulator",
  };
}

function createThreadExpectationEnvelope(
  dispatch: MessageDispatchEnvelope,
): ThreadExpectationEnvelope {
  return {
    projectionName: "ThreadExpectationEnvelope",
    threadExpectationEnvelopeId: "ThreadExpectationEnvelope_214_reply_v6",
    governingThreadRef: dispatch.governingThreadRef,
    governingSubthreadRef: dispatch.governingSubthreadRef,
    expectedNextActor: "provider",
    expectedDeliveryState: "delivered",
    expectationVersionRef: "thread_expectation_214_reply_v6",
    createdAt: "2026-04-16T13:46:00.000Z",
  };
}

function createThreadResolutionGate(
  dispatch: MessageDispatchEnvelope,
  decision: ThreadResolutionDecision,
): ThreadResolutionGate {
  return {
    projectionName: "ThreadResolutionGate",
    threadResolutionGateId: "ThreadResolutionGate_214_a",
    governingThreadRef: dispatch.governingThreadRef,
    governingSubthreadRef: dispatch.governingSubthreadRef,
    gateDecision: decision,
    authorizedRepairActions: decision === "repair_route" || decision === "reopen" ? [decision] : [],
    gateVersionRef: "thread_resolution_gate_214_a_v4",
    reasonCodes:
      decision === "repair_route" || decision === "reopen"
        ? ["SUPPORT_219_REPAIR_CHAIN_CANONICAL_COMMUNICATION_BOUND"]
        : ["SUPPORT_219_REPAIR_DENIED_BY_THREAD_RESOLUTION_GATE"],
    evaluatedAt: "2026-04-16T14:03:00.000Z",
  };
}

export class SupportRepairChainAssembler {
  readonly #lineageApplication = createSupportLineageTicketSubjectHistoryApplication();

  resolveRepairChain(input: {
    readonly supportTicketId: string;
    readonly requestedChannel?: SupportRepairChannel;
    readonly requestedAt?: string;
    readonly simulateEvidenceStatus?: DeliveryEvidenceStatus;
    readonly simulateGateDecision?: ThreadResolutionDecision;
    readonly simulateBindingState?: SupportLineageBinding["bindingState"];
  }): SupportRepairChainView {
    const workspace =
      this.#lineageApplication.supportLineageTicketProjectionService.getSupportTicketWorkspace({
        supportTicketId: input.supportTicketId,
        requestedAt: input.requestedAt,
        simulateBindingState: input.simulateBindingState,
      });
    const supportLineageScopeMember = requireValue(
      workspace.supportLineageScopeMembers.find(
        (member) => member.actionability === "governed_mutation" && member.memberState === "active",
      ),
      "Support repair requires one active governed mutation scope member.",
    );
    const dispatch = createDispatchEnvelope(
      input.supportTicketId,
      input.requestedChannel ?? "email",
      null,
    );
    const evidence = createDeliveryEvidenceBundle(
      dispatch,
      input.simulateEvidenceStatus ?? "failed",
    );
    const expectation = createThreadExpectationEnvelope(dispatch);
    const gate = createThreadResolutionGate(dispatch, input.simulateGateDecision ?? "repair_route");
    const freshRepairAuthorized =
      workspace.supportLineageBinding.bindingState === "active" &&
      (isGateAuthorizedForFreshRepair(gate) ||
        isDeliveryTerminalForFreshRepair(evidence.latestEvidenceStatus));
    const canonicalChainHash = stableHash([
      dispatch.messageDispatchEnvelopeId,
      evidence.messageDeliveryEvidenceBundleId,
      expectation.threadExpectationEnvelopeId,
      gate.threadResolutionGateId,
      workspace.supportLineageBinding.bindingHash,
      supportLineageScopeMember.supportLineageScopeMemberId,
      dispatch.governingThreadTupleHash,
      dispatch.governingSubthreadTupleHash,
    ]);

    return {
      projectionName: "SupportRepairChainView",
      supportTicketId: input.supportTicketId,
      supportLineageBinding: workspace.supportLineageBinding,
      supportLineageScopeMember,
      supportLineageArtifactBindings: workspace.supportLineageArtifactBindings,
      supportTicket: workspace.supportTicket,
      supportTicketWorkspaceProjection: workspace.supportTicketWorkspaceProjection,
      messageDispatchEnvelope: dispatch,
      latestDeliveryEvidenceBundle: evidence,
      latestThreadExpectationEnvelope: expectation,
      latestThreadResolutionGate: gate,
      governingThreadTupleHash: dispatch.governingThreadTupleHash,
      governingSubthreadTupleHash: dispatch.governingSubthreadTupleHash,
      canonicalChainHash,
      freshRepairAuthorized,
      reasonCodes: freshRepairAuthorized
        ? ["SUPPORT_219_REPAIR_CHAIN_CANONICAL_COMMUNICATION_BOUND"]
        : ["SUPPORT_219_REPAIR_DENIED_BY_THREAD_RESOLUTION_GATE"],
      assembledBy: SUPPORT_REPAIR_CHAIN_ASSEMBLER_NAME,
      assembledAt: input.requestedAt ?? "2026-04-16T14:05:00.000Z",
    };
  }
}

export class SupportRepairReplayControlService {
  readonly #assembler: SupportRepairChainAssembler;
  readonly #liveAttemptsByDedupeKey = new Map<string, RepairAttemptState>();
  readonly #attemptsById = new Map<string, RepairAttemptState>();
  readonly #replaysByCheckpointRef = new Map<string, ReplayStateRecord>();
  readonly #activeReplayByTicket = new Map<string, string>();

  constructor(assembler: SupportRepairChainAssembler = new SupportRepairChainAssembler()) {
    this.#assembler = assembler;
  }

  previewCommunicationRepair(
    input: SupportCommunicationRepairPreviewInput,
  ): SupportCommunicationRepairPreviewResult {
    const chain = this.#assembler.resolveRepairChain(input);
    const dedupeKey = buildRepairDedupeKey(chain, input.repairKind);
    const existing = this.#liveAttemptsByDedupeKey.get(dedupeKey);
    const replayCheckpoint = this.#activeReplayByTicket.get(input.supportTicketId);
    if (existing) {
      return {
        projectionName: "SupportCommunicationRepairPreviewResult",
        repairChain: chain,
        dedupeDecision: "reuse_live_attempt",
        existingAttempt: clone(existing.attempt),
        wouldCreateMutationAttemptRef: existing.attempt.supportMutationAttemptId,
        supportReadOnlyFallbackProjection: null,
        reasonCodes: ["SUPPORT_219_REPAIR_DEDUPE_REUSED_LIVE_ATTEMPT"],
      };
    }
    if (replayCheckpoint) {
      const fallback = this.#createReadOnlyFallback(
        chain,
        "awaiting_external_hold",
        replayCheckpoint,
        null,
      );
      return {
        projectionName: "SupportCommunicationRepairPreviewResult",
        repairChain: chain,
        dedupeDecision: "read_only_fallback",
        existingAttempt: null,
        wouldCreateMutationAttemptRef: null,
        supportReadOnlyFallbackProjection: fallback,
        reasonCodes: ["SUPPORT_219_REPLAY_RESTORE_BLOCKED_READ_ONLY_FALLBACK"],
      };
    }
    if (!chain.freshRepairAuthorized) {
      return {
        projectionName: "SupportCommunicationRepairPreviewResult",
        repairChain: chain,
        dedupeDecision: "denied_scope",
        existingAttempt: null,
        wouldCreateMutationAttemptRef: null,
        supportReadOnlyFallbackProjection: null,
        reasonCodes: ["SUPPORT_219_REPAIR_DENIED_BY_THREAD_RESOLUTION_GATE"],
      };
    }
    return {
      projectionName: "SupportCommunicationRepairPreviewResult",
      repairChain: chain,
      dedupeDecision: "would_create_new_attempt",
      existingAttempt: null,
      wouldCreateMutationAttemptRef: stableRef("SupportMutationAttempt_219", [dedupeKey]),
      supportReadOnlyFallbackProjection: null,
      reasonCodes: [
        "SUPPORT_219_REPAIR_CHAIN_CANONICAL_COMMUNICATION_BOUND",
        "SUPPORT_219_REPAIR_AWAITING_EXTERNAL_SETTLEMENT",
      ],
    };
  }

  commitCommunicationRepair(
    input: SupportCommunicationRepairCommitInput,
  ): SupportCommunicationRepairCommitResult {
    const chain = this.#assembler.resolveRepairChain(input);
    const dedupeKey = buildRepairDedupeKey(chain, input.repairKind);
    const existing = this.#liveAttemptsByDedupeKey.get(dedupeKey);
    if (existing) {
      existing.idempotencyKeys.add(input.idempotencyKey);
      const exactReplay = existing.attempt.idempotencyKey === input.idempotencyKey;
      return {
        projectionName: "SupportCommunicationRepairCommitResult",
        repairChain: clone(existing.chain),
        dedupeDecision: exactReplay ? "exact_replay" : "reuse_live_attempt",
        supportMutationAttempt: clone(existing.attempt),
        supportActionRecord: clone(existing.actionRecord),
        supportActionSettlement: clone(existing.settlement),
        providerMetadata: clone(existing.providerMetadata),
        supportReadOnlyFallbackProjection: null,
        externalEffectCount: existing.externalEffectCount,
        reasonCodes: ["SUPPORT_219_REPAIR_DEDUPE_REUSED_LIVE_ATTEMPT"],
      };
    }

    const activeReplayCheckpointRef = this.#activeReplayByTicket.get(input.supportTicketId);
    if (activeReplayCheckpointRef) {
      const fallback = this.#createReadOnlyFallback(
        chain,
        "awaiting_external_hold",
        activeReplayCheckpointRef,
        null,
      );
      return this.#blockedCommitResult(chain, "read_only_fallback", fallback);
    }

    if (!chain.freshRepairAuthorized) {
      return this.#blockedCommitResult(chain, "denied_scope", null);
    }

    const attemptRef = stableRef("SupportMutationAttempt_219", [dedupeKey]);
    const providerMetadata = buildProviderSafeMetadata(chain, attemptRef);
    if (!validateProviderMetadataHygiene(providerMetadata)) {
      return this.#blockedCommitResult(chain, "denied_scope", null);
    }
    const dispatch = createDispatchEnvelope(
      input.supportTicketId,
      input.requestedChannel ?? "email",
      attemptRef,
    );
    const attempt: SupportMutationAttempt = {
      projectionName: "SupportMutationAttempt",
      supportMutationAttemptId: attemptRef,
      supportTicketId: input.supportTicketId,
      repairKind: input.repairKind,
      requestedChannel: input.requestedChannel ?? "email",
      requestedByRef: input.requestedByRef ?? "support_user_219_primary",
      requestedAt: input.requestedAt ?? "2026-04-16T14:06:00.000Z",
      idempotencyKey: input.idempotencyKey,
      dedupeKey,
      mutationEnvelopeState: "awaiting_external",
      messageDispatchEnvelopeRef: dispatch.messageDispatchEnvelopeId,
      latestDeliveryEvidenceBundleRef:
        chain.latestDeliveryEvidenceBundle.messageDeliveryEvidenceBundleId,
      latestThreadExpectationEnvelopeRef:
        chain.latestThreadExpectationEnvelope.threadExpectationEnvelopeId,
      latestThreadResolutionGateRef: chain.latestThreadResolutionGate.threadResolutionGateId,
      supportLineageBindingRef: chain.supportLineageBinding.supportLineageBindingId,
      supportLineageBindingHash: chain.supportLineageBinding.bindingHash,
      actionableScopeMemberRef: chain.supportLineageScopeMember.supportLineageScopeMemberId,
      governingThreadRef: dispatch.governingThreadRef,
      governingSubthreadRef: dispatch.governingSubthreadRef,
      governingThreadTupleHash: chain.governingThreadTupleHash,
      governingSubthreadTupleHash: chain.governingSubthreadTupleHash,
      canonicalChainHash: chain.canonicalChainHash,
      providerSafeMetadata: providerMetadata,
      externalEffectCount: 1,
      reasonCodes: [
        "SUPPORT_219_REPAIR_CHAIN_CANONICAL_COMMUNICATION_BOUND",
        "SUPPORT_219_REPAIR_AWAITING_EXTERNAL_SETTLEMENT",
        "SUPPORT_219_PROVIDER_METADATA_SAFE_CORRELATION_ONLY",
      ],
    };
    const actionRecord: SupportActionRecord = {
      projectionName: "SupportActionRecord",
      supportActionRecordId: stableRef("SupportActionRecord_219", [attemptRef]),
      supportMutationAttemptRef: attemptRef,
      supportTicketId: input.supportTicketId,
      operatorIntent: input.repairKind,
      requestedByRef: input.requestedByRef ?? "support_user_219_primary",
      idempotencyKey: input.idempotencyKey,
      messageDispatchEnvelopeRef: dispatch.messageDispatchEnvelopeId,
      supportLineageBindingRef: chain.supportLineageBinding.supportLineageBindingId,
      actionableScopeMemberRef: chain.supportLineageScopeMember.supportLineageScopeMemberId,
      actionLeaseRef:
        chain.supportTicket.currentActionLeaseRef ?? "support_action_lease_219_reacquired",
      commandRef: input.commandRef ?? stableRef("support_repair_command_219", [attemptRef]),
      causalToken: stableRef("causal_219_repair", [attemptRef, chain.canonicalChainHash]),
      reasonCodes: ["SUPPORT_219_REPAIR_CHAIN_CANONICAL_COMMUNICATION_BOUND"],
      recordedAt: input.requestedAt ?? "2026-04-16T14:06:00.000Z",
    };
    const settlement: SupportActionSettlement = {
      projectionName: "SupportActionSettlement",
      supportActionSettlementId: stableRef("SupportActionSettlement_219", [attemptRef]),
      supportMutationAttemptRef: attemptRef,
      supportActionRecordRef: actionRecord.supportActionRecordId,
      supportTicketId: input.supportTicketId,
      localAckState: "accepted",
      processingAcceptanceState: "accepted",
      externalObservationState: "awaiting_provider_callback",
      authoritativeOutcomeState: "provisional",
      result: "awaiting_external",
      messageDispatchEnvelopeRef: dispatch.messageDispatchEnvelopeId,
      deliveryEvidenceBundleRef: chain.latestDeliveryEvidenceBundle.messageDeliveryEvidenceBundleId,
      threadResolutionGateRef: chain.latestThreadResolutionGate.threadResolutionGateId,
      patientReceiptEnvelopeRef: dispatch.patientReceiptEnvelopeRef,
      patientReceiptParity: "provisional",
      structuredLogRef: stableRef("support_repair_structured_log_219", [actionRecord.causalToken]),
      reasonCodes: [
        "SUPPORT_219_REPAIR_AWAITING_EXTERNAL_SETTLEMENT",
        "SUPPORT_219_PROVIDER_METADATA_SAFE_CORRELATION_ONLY",
      ],
      settledAt: null,
    };
    const liveState: RepairAttemptState = {
      attempt,
      actionRecord,
      settlement,
      chain: {
        ...chain,
        messageDispatchEnvelope: dispatch,
      },
      providerMetadata,
      externalEffectCount: 1,
      idempotencyKeys: new Set([input.idempotencyKey]),
    };
    this.#liveAttemptsByDedupeKey.set(dedupeKey, liveState);
    this.#attemptsById.set(attemptRef, liveState);

    return {
      projectionName: "SupportCommunicationRepairCommitResult",
      repairChain: clone(liveState.chain),
      dedupeDecision: "created_new_attempt",
      supportMutationAttempt: clone(attempt),
      supportActionRecord: clone(actionRecord),
      supportActionSettlement: clone(settlement),
      providerMetadata: clone(providerMetadata),
      supportReadOnlyFallbackProjection: null,
      externalEffectCount: liveState.externalEffectCount,
      reasonCodes: [
        "SUPPORT_219_REPAIR_CHAIN_CANONICAL_COMMUNICATION_BOUND",
        "SUPPORT_219_REPAIR_AWAITING_EXTERNAL_SETTLEMENT",
      ],
    };
  }

  reconcileProviderCallback(input: ProviderCallbackInput): ProviderCallbackResult {
    const state = this.#attemptsById.get(input.supportMutationAttemptRef);
    const observedAt = input.observedAt ?? "2026-04-16T14:08:00.000Z";
    const checkpoint: AdapterReceiptCheckpoint = {
      projectionName: "AdapterReceiptCheckpoint",
      adapterReceiptCheckpointId: stableRef("AdapterReceiptCheckpoint_219", [
        input.providerName,
        input.providerMessageRef,
        observedAt,
      ]),
      providerName: input.providerName,
      supportMutationAttemptRef: input.supportMutationAttemptRef,
      messageDispatchEnvelopeRef:
        state?.attempt.messageDispatchEnvelopeRef ?? "MessageDispatchEnvelope_unknown",
      deliveryEvidenceBundleRef:
        state?.attempt.latestDeliveryEvidenceBundleRef ?? "MessageDeliveryEvidenceBundle_unknown",
      providerMessageRefHash: stableHash([input.providerMessageRef]),
      webhookSignatureState: input.signatureValid ? "validated" : "quarantined_invalid_signature",
      correlationId:
        input.correlationId ?? stableRef("corr_219_callback", [input.providerMessageRef]),
      causalToken:
        input.causalToken ?? stableRef("causal_219_callback", [input.providerMessageRef]),
      observedStatus: input.observedStatus,
      rawPayloadStoredRef: stableRef("raw_provider_payload_ref_219_redacted", [
        input.providerName,
        input.providerMessageRef,
      ]),
      reasonCodes: input.signatureValid
        ? ["SUPPORT_219_REPAIR_PROVIDER_CALLBACK_SIGNATURE_VALIDATED"]
        : ["SUPPORT_219_REPAIR_PROVIDER_CALLBACK_SIGNATURE_REJECTED"],
      observedAt,
    };
    if (!state || !input.signatureValid) {
      return {
        projectionName: "ProviderCallbackResult",
        adapterReceiptCheckpoint: checkpoint,
        supportMutationAttempt: state ? clone(state.attempt) : null,
        supportActionSettlement: state ? clone(state.settlement) : null,
        acceptedAsTruth: false,
      };
    }

    const authoritativeOutcomeState = input.observedStatus === "delivered" ? "settled" : "failed";
    const result: SupportActionSettlementResult =
      input.observedStatus === "delivered" ? "authoritative_settled" : "authoritative_failed";
    const updatedAttempt: SupportMutationAttempt = {
      ...state.attempt,
      mutationEnvelopeState: input.observedStatus === "delivered" ? "settled" : "stale_recoverable",
      latestDeliveryEvidenceBundleRef: createDeliveryEvidenceBundle(
        state.chain.messageDispatchEnvelope,
        input.observedStatus,
        [checkpoint.adapterReceiptCheckpointId],
      ).messageDeliveryEvidenceBundleId,
      externalEffectCount: state.externalEffectCount,
      reasonCodes: [
        ...state.attempt.reasonCodes,
        "SUPPORT_219_REPAIR_PROVIDER_CALLBACK_SIGNATURE_VALIDATED",
      ],
    };
    const updatedSettlement: SupportActionSettlement = {
      ...state.settlement,
      externalObservationState: "observed",
      authoritativeOutcomeState,
      result,
      deliveryEvidenceBundleRef: updatedAttempt.latestDeliveryEvidenceBundleRef,
      patientReceiptParity: "authoritative",
      reasonCodes: [
        ...state.settlement.reasonCodes,
        input.observedStatus === "delivered"
          ? "SUPPORT_219_REPLAY_RESTORE_LIVE_CONTROLS_REARMED"
          : "SUPPORT_219_REPAIR_STALE_RECOVERABLE",
      ],
      settledAt: observedAt,
    };
    state.attempt = updatedAttempt;
    state.settlement = updatedSettlement;
    this.#liveAttemptsByDedupeKey.delete(updatedAttempt.dedupeKey);

    return {
      projectionName: "ProviderCallbackResult",
      adapterReceiptCheckpoint: checkpoint,
      supportMutationAttempt: clone(updatedAttempt),
      supportActionSettlement: clone(updatedSettlement),
      acceptedAsTruth: true,
    };
  }

  getSupportTimeline(input: {
    readonly supportTicketId: string;
    readonly requestedAt?: string;
  }): SupportOmnichannelTimelineProjection {
    const chain = this.#assembler.resolveRepairChain({
      supportTicketId: input.supportTicketId,
      requestedAt: input.requestedAt,
    });
    const latestAttempt = [...this.#attemptsById.values()]
      .filter((state) => state.attempt.supportTicketId === input.supportTicketId)
      .at(-1);
    const replayCheckpointRef = this.#activeReplayByTicket.get(input.supportTicketId) ?? null;
    const replayState = replayCheckpointRef
      ? this.#replaysByCheckpointRef.get(replayCheckpointRef)
      : null;
    return this.#assembleTimeline(
      chain,
      latestAttempt ?? null,
      replayCheckpointRef,
      replayState?.latestSettlement ?? null,
      replayState?.readOnlyFallback ?? null,
      input.requestedAt ?? "2026-04-16T14:10:00.000Z",
    );
  }

  startReplay(input: SupportReplayStartInput): SupportReplayStartResult {
    const chain = this.#assembler.resolveRepairChain({
      supportTicketId: input.supportTicketId,
      requestedAt: input.startedAt,
    });
    const existingCheckpointRef = this.#activeReplayByTicket.get(input.supportTicketId);
    if (existingCheckpointRef) {
      const existing = requireValue(
        this.#replaysByCheckpointRef.get(existingCheckpointRef),
        "Active replay checkpoint missing state.",
      );
      existing.idempotencyKeys.add(input.idempotencyKey);
      return {
        projectionName: "SupportReplayStartResult",
        communicationReplayRecord: clone(existing.replayRecord),
        supportReplayCheckpoint: clone(existing.checkpoint),
        supportReplayEvidenceBoundary: clone(existing.boundary),
        supportOmnichannelTimelineProjection: this.getSupportTimeline({
          supportTicketId: input.supportTicketId,
          requestedAt: input.startedAt,
        }),
      };
    }

    const startedAt = input.startedAt ?? "2026-04-16T14:11:00.000Z";
    const replayCheckpointRef = stableRef("SupportReplayCheckpoint_219", [
      input.supportTicketId,
      input.idempotencyKey,
    ]);
    const boundaryRef = stableRef("SupportReplayEvidenceBoundary_219", [replayCheckpointRef]);
    const routeIntentTokenRef = stableRef("SupportRouteIntentToken_219", [
      replayCheckpointRef,
      "start",
    ]);
    const heldAttempts = [...this.#attemptsById.values()]
      .filter(
        (state) =>
          state.attempt.supportTicketId === input.supportTicketId &&
          state.attempt.mutationEnvelopeState === "awaiting_external",
      )
      .map((state) => state.attempt.supportMutationAttemptId);
    const checkpoint: SupportReplayCheckpoint = {
      projectionName: "SupportReplayCheckpoint",
      supportReplayCheckpointId: replayCheckpointRef,
      supportTicketId: input.supportTicketId,
      supportLineageBindingRef: chain.supportLineageBinding.supportLineageBindingId,
      supportLineageBindingHash: chain.supportLineageBinding.bindingHash,
      ticketVersionRef: chain.supportTicket.ticketVersionRef,
      ticketAnchorRef: chain.supportTicket.selectedTimelineAnchorRef,
      selectedTimelineAnchorRef: chain.supportTicket.selectedTimelineAnchorRef,
      selectedTimelineAnchorTupleHashRef: chain.supportTicket.selectedTimelineAnchorTupleHashRef,
      maskScopeRef: chain.supportTicket.effectiveMaskScopeRef,
      disclosureCeilingRef: chain.supportLineageBinding.disclosureCeilingRef,
      routeIntentTokenRef,
      queueAnchorRef: chain.supportTicket.queueKey,
      projectionWatermarkRef: stableRef("projection_watermark_219", [
        input.supportTicketId,
        startedAt,
      ]),
      evidenceBoundaryRef: boundaryRef,
      draftHoldRef: stableRef("support_replay_draft_hold_219", [replayCheckpointRef]),
      checkpointHash: stableHash([
        chain.supportLineageBinding.bindingHash,
        chain.supportTicket.ticketVersionRef,
        chain.supportTicket.selectedTimelineAnchorTupleHashRef,
        chain.supportTicket.effectiveMaskScopeRef,
        boundaryRef,
      ]),
      createdBy: REPLAY_CHECKPOINT_SERVICE_NAME,
      createdAt: startedAt,
    };
    const strongestArtifact =
      chain.supportLineageArtifactBindings[0]?.sourceArtifactRef ??
      chain.messageDispatchEnvelope.messageDispatchEnvelopeId;
    const boundary: SupportReplayEvidenceBoundary = {
      projectionName: "SupportReplayEvidenceBoundary",
      supportReplayEvidenceBoundaryId: boundaryRef,
      supportReplayCheckpointRef: replayCheckpointRef,
      supportTicketId: input.supportTicketId,
      includedEvidenceRefs: [
        chain.messageDispatchEnvelope.messageDispatchEnvelopeId,
        chain.latestDeliveryEvidenceBundle.messageDeliveryEvidenceBundleId,
        chain.latestThreadExpectationEnvelope.threadExpectationEnvelopeId,
        chain.latestThreadResolutionGate.threadResolutionGateId,
        chain.supportLineageBinding.supportLineageBindingId,
        chain.supportLineageScopeMember.supportLineageScopeMemberId,
      ],
      excludedDraftRefs: ["support_draft_219_uncommitted_response"],
      excludedInFlightOutboundAttemptRefs: heldAttempts,
      excludedLaterConfirmationRefs: ["provider_callback_after_replay_boundary_219"],
      excludedWiderDisclosureRefs: ["bounded_detail_after_replay_boundary_219"],
      strongestConfirmedArtifactRef: strongestArtifact,
      evidenceBoundaryHash: stableHash([
        replayCheckpointRef,
        chain.canonicalChainHash,
        strongestArtifact,
        heldAttempts,
      ]),
      reasonCodes: [
        "SUPPORT_219_REPLAY_CHECKPOINT_FROZEN",
        "SUPPORT_219_REPLAY_BOUNDARY_EXCLUDES_DRAFTS_AND_LATER_PROOF",
      ],
      createdAt: startedAt,
    };
    const replayRecord: CommunicationReplayRecord = {
      projectionName: "CommunicationReplayRecord",
      communicationReplayRecordId: stableRef("CommunicationReplayRecord_219", [
        replayCheckpointRef,
      ]),
      supportTicketId: input.supportTicketId,
      supportReplayCheckpointRef: replayCheckpointRef,
      supportReplayEvidenceBoundaryRef: boundaryRef,
      replayState: "frozen",
      startedByRef: input.startedByRef ?? "support_user_219_primary",
      startedAt,
      releasedAt: null,
      mutatingControlsSuspended: true,
      draftHoldRef: checkpoint.draftHoldRef,
    };
    const replayState: ReplayStateRecord = {
      replayRecord,
      checkpoint,
      boundary,
      idempotencyKeys: new Set([input.idempotencyKey]),
      latestSettlement: null,
      readOnlyFallback: null,
    };
    this.#replaysByCheckpointRef.set(replayCheckpointRef, replayState);
    this.#activeReplayByTicket.set(input.supportTicketId, replayCheckpointRef);

    return {
      projectionName: "SupportReplayStartResult",
      communicationReplayRecord: clone(replayRecord),
      supportReplayCheckpoint: clone(checkpoint),
      supportReplayEvidenceBoundary: clone(boundary),
      supportOmnichannelTimelineProjection: this.#assembleTimeline(
        chain,
        null,
        replayCheckpointRef,
        null,
        null,
        startedAt,
      ),
    };
  }

  releaseReplay(input: SupportReplayReleaseInput): SupportReplayReleaseResult {
    const replayState = requireValue(
      this.#replaysByCheckpointRef.get(input.supportReplayCheckpointRef),
      `Unknown replay checkpoint: ${input.supportReplayCheckpointRef}`,
    );
    const releasedAt = input.releasedAt ?? "2026-04-16T14:18:00.000Z";
    const chain = this.#assembler.resolveRepairChain({
      supportTicketId: input.supportTicketId,
      requestedAt: releasedAt,
      simulateBindingState: input.simulateBindingState,
    });
    const pendingExternalAttemptRefs = input.simulatePendingExternal
      ? [...this.#attemptsById.values()]
          .filter(
            (state) =>
              state.attempt.supportTicketId === input.supportTicketId &&
              state.attempt.mutationEnvelopeState === "awaiting_external",
          )
          .map((state) => state.attempt.supportMutationAttemptId)
      : [];
    const maskScopeDrift = input.simulateMaskScopeDrift ?? "none";
    const lineageBindingHashMatches =
      chain.supportLineageBinding.bindingHash === replayState.checkpoint.supportLineageBindingHash;
    const deltaReview: SupportReplayDeltaReview = {
      projectionName: "SupportReplayDeltaReview",
      supportReplayDeltaReviewId: stableRef("SupportReplayDeltaReview_219", [
        input.supportReplayCheckpointRef,
        releasedAt,
      ]),
      supportReplayCheckpointRef: input.supportReplayCheckpointRef,
      supportTicketId: input.supportTicketId,
      currentTicketVersionRef: chain.supportTicket.ticketVersionRef,
      checkpointTicketVersionRef: replayState.checkpoint.ticketVersionRef,
      changedProjectionRefs:
        lineageBindingHashMatches && maskScopeDrift === "none"
          ? []
          : ["support_lineage_binding_hash_drift_219", "support_mask_scope_delta_219"],
      outsideBoundaryDraftRefs: replayState.boundary.excludedDraftRefs,
      pendingExternalAttemptRefs,
      maskScopeDrift,
      lineageBindingHashMatches,
      reviewState:
        lineageBindingHashMatches &&
        maskScopeDrift === "none" &&
        pendingExternalAttemptRefs.length === 0
          ? "accepted"
          : "blocked",
      reasonCodes: ["SUPPORT_219_REPLAY_RELEASE_DELTA_REVIEW_REQUIRED"],
      reviewedAt: releasedAt,
    };
    const routeIntentState = input.simulateRouteIntentState ?? "live";
    const reacquiredLease = input.simulateReacquiredLease ?? true;
    const routeIntentToken: SupportRouteIntentToken = {
      projectionName: "SupportRouteIntentToken",
      supportRouteIntentTokenId: stableRef("SupportRouteIntentToken_219", [
        input.supportReplayCheckpointRef,
        input.idempotencyKey,
      ]),
      supportTicketId: input.supportTicketId,
      supportReplayCheckpointRef: input.supportReplayCheckpointRef,
      routeIntentState,
      routeTupleHash: stableHash([
        chain.supportTicket.queueKey,
        chain.supportTicket.selectedTimelineAnchorTupleHashRef,
        routeIntentState,
      ]),
      actionLeaseRef:
        chain.supportTicket.currentActionLeaseRef ?? "support_action_lease_219_reacquired",
      leaseState: reacquiredLease ? "reacquired" : "stale",
      issuedAt: releasedAt,
      expiresAt: "2026-04-16T14:23:00.000Z",
    };
    const continuityTrustState =
      input.simulateContinuityTrustState ??
      (lineageBindingHashMatches && maskScopeDrift === "none" ? "trusted" : "lineage_drift");
    const continuity: SupportContinuityEvidenceProjection = {
      projectionName: "SupportContinuityEvidenceProjection",
      supportContinuityEvidenceProjectionId: stableRef("SupportContinuityEvidenceProjection_219", [
        input.supportReplayCheckpointRef,
        releasedAt,
      ]),
      supportTicketId: input.supportTicketId,
      supportReplayCheckpointRef: input.supportReplayCheckpointRef,
      supportLineageBindingHash: replayState.checkpoint.supportLineageBindingHash,
      currentLineageBindingHash: chain.supportLineageBinding.bindingHash,
      maskScopeRef: replayState.checkpoint.maskScopeRef,
      currentMaskScopeRef: chain.supportTicket.effectiveMaskScopeRef,
      continuityTrustState,
      anchorTupleHash: replayState.checkpoint.selectedTimelineAnchorTupleHashRef,
      currentAnchorTupleHash: chain.supportTicket.selectedTimelineAnchorTupleHashRef,
      routeIntentTokenRef: routeIntentToken.supportRouteIntentTokenId,
      evidenceBoundaryHash: replayState.boundary.evidenceBoundaryHash,
      reasonCodes: [
        continuityTrustState === "trusted"
          ? "SUPPORT_219_REPLAY_RESTORE_LIVE_CONTROLS_REARMED"
          : "SUPPORT_219_REPLAY_RESTORE_BLOCKED_READ_ONLY_FALLBACK",
      ],
      evaluatedAt: releasedAt,
    };
    const freshTicketVersion =
      input.simulateFreshTicketVersion ??
      chain.supportTicket.ticketVersionRef === replayState.checkpoint.ticketVersionRef;
    const liveRouteIntent = routeIntentState === "live";
    const continuityTrusted = continuityTrustState === "trusted";
    const currentLineageBinding =
      chain.supportLineageBinding.bindingState === "active" && lineageBindingHashMatches;
    const sameMaskScope =
      replayState.checkpoint.maskScopeRef === chain.supportTicket.effectiveMaskScopeRef &&
      maskScopeDrift === "none";
    const pendingExternalSettlementsClear = pendingExternalAttemptRefs.length === 0;
    const canRestoreLive =
      deltaReview.reviewState === "accepted" &&
      freshTicketVersion &&
      liveRouteIntent &&
      reacquiredLease &&
      continuityTrusted &&
      currentLineageBinding &&
      sameMaskScope &&
      pendingExternalSettlementsClear;
    const decisionValue: SupportReplayReleaseDecision["decision"] = canRestoreLive
      ? "restore_live"
      : pendingExternalSettlementsClear
        ? "read_only_fallback"
        : "awaiting_external_hold";
    const releaseDecision: SupportReplayReleaseDecision = {
      projectionName: "SupportReplayReleaseDecision",
      supportReplayReleaseDecisionId: stableRef("SupportReplayReleaseDecision_219", [
        input.supportReplayCheckpointRef,
        releasedAt,
      ]),
      supportTicketId: input.supportTicketId,
      supportReplayCheckpointRef: input.supportReplayCheckpointRef,
      supportReplayDeltaReviewRef: deltaReview.supportReplayDeltaReviewId,
      supportRouteIntentTokenRef: routeIntentToken.supportRouteIntentTokenId,
      supportContinuityEvidenceProjectionRef: continuity.supportContinuityEvidenceProjectionId,
      decision: decisionValue,
      freshTicketVersion,
      liveRouteIntent,
      reacquiredLease,
      continuityTrusted,
      currentLineageBinding,
      sameMaskScope,
      pendingExternalSettlementsClear,
      reasonCodes: canRestoreLive
        ? ["SUPPORT_219_REPLAY_RESTORE_LIVE_CONTROLS_REARMED"]
        : ["SUPPORT_219_REPLAY_RESTORE_BLOCKED_READ_ONLY_FALLBACK"],
      decidedBy: REPLAY_RESTORE_SERVICE_NAME,
      decidedAt: releasedAt,
    };
    const fallback = canRestoreLive
      ? null
      : this.#createReadOnlyFallback(
          chain,
          decisionValue === "awaiting_external_hold" ? "awaiting_external_hold" : "stale_reacquire",
          input.supportReplayCheckpointRef,
          pendingExternalAttemptRefs[0] ?? null,
        );
    const restoreSettlement: SupportReplayRestoreSettlement = {
      projectionName: "SupportReplayRestoreSettlement",
      supportReplayRestoreSettlementId: stableRef("SupportReplayRestoreSettlement_219", [
        input.supportReplayCheckpointRef,
        releasedAt,
      ]),
      supportTicketId: input.supportTicketId,
      supportReplayCheckpointRef: input.supportReplayCheckpointRef,
      supportReplayReleaseDecisionRef: releaseDecision.supportReplayReleaseDecisionId,
      supportReplayEvidenceBoundaryRef: replayState.boundary.supportReplayEvidenceBoundaryId,
      supportContinuityEvidenceProjectionRef: continuity.supportContinuityEvidenceProjectionId,
      result: canRestoreLive
        ? "live_restored"
        : decisionValue === "awaiting_external_hold"
          ? "awaiting_external_hold"
          : "read_only_fallback",
      restoredShellMode: canRestoreLive ? "live" : "read_only_recovery",
      restoredTicketAnchorRef: replayState.checkpoint.ticketAnchorRef,
      restoredTimelineAnchorRef: replayState.checkpoint.selectedTimelineAnchorRef,
      restoredMaskScopeRef: replayState.checkpoint.maskScopeRef,
      restoredLineageBindingHash: replayState.checkpoint.supportLineageBindingHash,
      heldSupportMutationAttemptRefs: pendingExternalAttemptRefs,
      supportReadOnlyFallbackProjectionRef: fallback?.supportReadOnlyFallbackProjectionId ?? null,
      reasonCodes: canRestoreLive
        ? ["SUPPORT_219_REPLAY_RESTORE_LIVE_CONTROLS_REARMED"]
        : ["SUPPORT_219_REPLAY_RESTORE_BLOCKED_READ_ONLY_FALLBACK"],
      settledAt: releasedAt,
    };

    replayState.latestSettlement = restoreSettlement;
    replayState.readOnlyFallback = fallback;
    replayState.replayRecord = {
      ...replayState.replayRecord,
      replayState: canRestoreLive ? "released" : "read_only_fallback",
      releasedAt,
    };
    if (canRestoreLive) {
      this.#activeReplayByTicket.delete(input.supportTicketId);
    }

    return {
      projectionName: "SupportReplayReleaseResult",
      supportReplayDeltaReview: deltaReview,
      supportRouteIntentToken: routeIntentToken,
      supportContinuityEvidenceProjection: continuity,
      supportReplayReleaseDecision: releaseDecision,
      supportReplayRestoreSettlement: restoreSettlement,
      supportReadOnlyFallbackProjection: fallback,
    };
  }

  getRestoreStatus(input: { readonly supportTicketId: string }): SupportReplayRestoreStatusResult {
    const activeCheckpoint = this.#activeReplayByTicket.get(input.supportTicketId);
    const activeReplayRecord = activeCheckpoint
      ? (this.#replaysByCheckpointRef.get(activeCheckpoint)?.replayRecord ?? null)
      : null;
    const replayStates = [...this.#replaysByCheckpointRef.values()].filter(
      (state) => state.replayRecord.supportTicketId === input.supportTicketId,
    );
    const latest = replayStates.at(-1);
    return {
      projectionName: "SupportReplayRestoreStatusResult",
      supportTicketId: input.supportTicketId,
      activeReplayRecord: activeReplayRecord ? clone(activeReplayRecord) : null,
      latestRestoreSettlement: latest?.latestSettlement ? clone(latest.latestSettlement) : null,
      supportReadOnlyFallbackProjection: latest?.readOnlyFallback
        ? clone(latest.readOnlyFallback)
        : null,
    };
  }

  #blockedCommitResult(
    chain: SupportRepairChainView,
    dedupeDecision: "denied_scope" | "read_only_fallback",
    fallback: SupportReadOnlyFallbackProjection | null,
  ): SupportCommunicationRepairCommitResult {
    const settlement: SupportActionSettlement = {
      projectionName: "SupportActionSettlement",
      supportActionSettlementId: stableRef("SupportActionSettlement_219_blocked", [
        chain.supportTicketId,
        chain.canonicalChainHash,
        dedupeDecision,
      ]),
      supportMutationAttemptRef: "none",
      supportActionRecordRef: "none",
      supportTicketId: chain.supportTicketId,
      localAckState: "denied",
      processingAcceptanceState: "blocked",
      externalObservationState: "not_started",
      authoritativeOutcomeState: "blocked",
      result: dedupeDecision === "read_only_fallback" ? "read_only_fallback" : "denied_scope",
      messageDispatchEnvelopeRef: chain.messageDispatchEnvelope.messageDispatchEnvelopeId,
      deliveryEvidenceBundleRef: chain.latestDeliveryEvidenceBundle.messageDeliveryEvidenceBundleId,
      threadResolutionGateRef: chain.latestThreadResolutionGate.threadResolutionGateId,
      patientReceiptEnvelopeRef: chain.messageDispatchEnvelope.patientReceiptEnvelopeRef,
      patientReceiptParity: "blocked",
      structuredLogRef: stableRef("support_repair_structured_log_219_blocked", [
        chain.canonicalChainHash,
      ]),
      reasonCodes: [
        dedupeDecision === "read_only_fallback"
          ? "SUPPORT_219_REPLAY_RESTORE_BLOCKED_READ_ONLY_FALLBACK"
          : "SUPPORT_219_REPAIR_DENIED_BY_THREAD_RESOLUTION_GATE",
      ],
      settledAt: null,
    };
    return {
      projectionName: "SupportCommunicationRepairCommitResult",
      repairChain: chain,
      dedupeDecision,
      supportMutationAttempt: null,
      supportActionRecord: null,
      supportActionSettlement: settlement,
      providerMetadata: null,
      supportReadOnlyFallbackProjection: fallback,
      externalEffectCount: 0,
      reasonCodes: settlement.reasonCodes,
    };
  }

  #createReadOnlyFallback(
    chain: SupportRepairChainView,
    mode: SupportReadOnlyFallbackProjection["mode"],
    replayCheckpointRef: string | null,
    heldAttemptRef: string | null,
  ): SupportReadOnlyFallbackProjection {
    return {
      projectionName: "SupportReadOnlyFallbackProjection",
      supportReadOnlyFallbackProjectionId: stableRef("SupportReadOnlyFallbackProjection_219", [
        chain.supportTicketId,
        replayCheckpointRef,
        mode,
      ]),
      supportTicketId: chain.supportTicketId,
      supportLineageBindingRef: chain.supportLineageBinding.supportLineageBindingId,
      supportLineageBindingHash: chain.supportLineageBinding.bindingHash,
      primaryScopeMemberRef: chain.supportLineageScopeMember.supportLineageScopeMemberId,
      triggerRef: replayCheckpointRef ?? chain.latestThreadResolutionGate.threadResolutionGateId,
      ticketVersionRef: chain.supportTicket.ticketVersionRef,
      currentMaskScopeRef: chain.supportTicket.effectiveMaskScopeRef,
      preservedAnchorRef: chain.supportTicket.selectedTimelineAnchorRef,
      preservedArtifactRef:
        chain.supportLineageArtifactBindings[0]?.sourceArtifactRef ??
        chain.messageDispatchEnvelope.messageDispatchEnvelopeId,
      preservedDraftRef: "support_draft_219_uncommitted_response",
      supportReplayCheckpointRef: replayCheckpointRef,
      supportReplayDraftHoldRef: replayCheckpointRef
        ? stableRef("support_replay_draft_hold_219", [replayCheckpointRef])
        : null,
      supportReplayRestoreSettlementRef: null,
      heldSupportMutationAttemptRef: heldAttemptRef,
      heldMessageDispatchEnvelopeRef: chain.messageDispatchEnvelope.messageDispatchEnvelopeId,
      heldDeliveryEvidenceBundleRef:
        chain.latestDeliveryEvidenceBundle.messageDeliveryEvidenceBundleId,
      heldThreadResolutionGateRef: chain.latestThreadResolutionGate.threadResolutionGateId,
      mode,
      explanationRef: stableRef("support_read_only_explanation_219", [chain.supportTicketId, mode]),
      reacquireActionRef: "support_action_reacquire_replay_restore_219",
      renderedAt: "2026-04-16T14:18:00.000Z",
    };
  }

  #assembleTimeline(
    chain: SupportRepairChainView,
    latestAttempt: RepairAttemptState | null,
    replayCheckpointRef: string | null,
    restoreSettlement: SupportReplayRestoreSettlement | null,
    fallback: SupportReadOnlyFallbackProjection | null,
    generatedAt: string,
  ): SupportOmnichannelTimelineProjection {
    const settlement = latestAttempt?.settlement ?? null;
    const freshness: SupportTimelineFreshness = fallback
      ? "read_only_recovery"
      : replayCheckpointRef
        ? "paused_replay"
        : "live";
    const provisionalRefs =
      settlement && settlement.patientReceiptParity === "provisional"
        ? [settlement.supportActionSettlementId]
        : [];
    const authoritativeRefs =
      settlement && settlement.patientReceiptParity === "authoritative"
        ? [settlement.supportActionSettlementId]
        : [
            chain.latestDeliveryEvidenceBundle.messageDeliveryEvidenceBundleId,
            chain.latestThreadResolutionGate.threadResolutionGateId,
          ];
    const workbench: SupportActionWorkbenchProjection = {
      projectionName: "SupportActionWorkbenchProjection",
      supportActionWorkbenchProjectionId: stableRef("SupportActionWorkbenchProjection_219", [
        chain.supportTicketId,
        freshness,
      ]),
      supportTicketId: chain.supportTicketId,
      supportMutationAttemptRef: latestAttempt?.attempt.supportMutationAttemptId ?? null,
      supportActionSettlementRef: settlement?.supportActionSettlementId ?? null,
      mutatingControlsState:
        freshness === "paused_replay"
          ? "suspended_for_replay"
          : freshness === "read_only_recovery"
            ? "read_only"
            : "enabled",
      allowedRepairKinds: [
        "controlled_resend",
        "reissue",
        "channel_change",
        "callback_reschedule",
        "attachment_recovery",
      ],
      reasonCodes:
        freshness === "live"
          ? ["SUPPORT_219_REPAIR_CHAIN_CANONICAL_COMMUNICATION_BOUND"]
          : ["SUPPORT_219_REPLAY_CHECKPOINT_FROZEN"],
    };
    const reachability: SupportReachabilityPostureProjection = {
      projectionName: "SupportReachabilityPostureProjection",
      supportReachabilityPostureProjectionId: stableRef(
        "SupportReachabilityPostureProjection_219",
        [chain.supportTicketId, chain.latestDeliveryEvidenceBundle.latestEvidenceStatus],
      ),
      supportTicketId: chain.supportTicketId,
      providerName: chain.messageDispatchEnvelope.providerName,
      channel: chain.messageDispatchEnvelope.channel,
      deliveryEvidenceBundleRef:
        settlement?.deliveryEvidenceBundleRef ??
        chain.latestDeliveryEvidenceBundle.messageDeliveryEvidenceBundleId,
      postureState: settlement
        ? settlement.patientReceiptParity === "authoritative"
          ? "confirmed"
          : "repairing"
        : "at_risk",
      reasonCodes: ["SUPPORT_219_REPAIR_CHAIN_CANONICAL_COMMUNICATION_BOUND"],
    };
    return {
      projectionName: "SupportOmnichannelTimelineProjection",
      supportOmnichannelTimelineProjectionId: stableRef(
        "SupportOmnichannelTimelineProjection_219",
        [chain.supportTicketId, freshness],
      ),
      supportTicketId: chain.supportTicketId,
      supportLineageBindingRef: chain.supportLineageBinding.supportLineageBindingId,
      supportLineageBindingHash: chain.supportLineageBinding.bindingHash,
      messageDispatchEnvelopeRef: chain.messageDispatchEnvelope.messageDispatchEnvelopeId,
      latestDeliveryEvidenceBundleRef:
        settlement?.deliveryEvidenceBundleRef ??
        chain.latestDeliveryEvidenceBundle.messageDeliveryEvidenceBundleId,
      latestThreadExpectationEnvelopeRef:
        chain.latestThreadExpectationEnvelope.threadExpectationEnvelopeId,
      latestThreadResolutionGateRef: chain.latestThreadResolutionGate.threadResolutionGateId,
      supportMutationAttemptRef: latestAttempt?.attempt.supportMutationAttemptId ?? null,
      supportActionSettlementRef: settlement?.supportActionSettlementId ?? null,
      supportReplayCheckpointRef: replayCheckpointRef,
      supportReplayRestoreSettlementRef:
        restoreSettlement?.supportReplayRestoreSettlementId ?? null,
      patientReceiptEnvelopeRef:
        settlement?.patientReceiptEnvelopeRef ??
        chain.messageDispatchEnvelope.patientReceiptEnvelopeRef,
      patientReceiptParity: settlement?.patientReceiptParity ?? "provisional",
      chronologyRefs: [
        chain.messageDispatchEnvelope.messageDispatchEnvelopeId,
        chain.latestDeliveryEvidenceBundle.messageDeliveryEvidenceBundleId,
        chain.latestThreadExpectationEnvelope.threadExpectationEnvelopeId,
        chain.latestThreadResolutionGate.threadResolutionGateId,
        ...(latestAttempt ? [latestAttempt.attempt.supportMutationAttemptId] : []),
        ...(settlement ? [settlement.supportActionSettlementId] : []),
        ...(replayCheckpointRef ? [replayCheckpointRef] : []),
        ...(restoreSettlement ? [restoreSettlement.supportReplayRestoreSettlementId] : []),
      ],
      provisionalEventRefs: provisionalRefs,
      authoritativeEventRefs: authoritativeRefs,
      freshness,
      supportActionWorkbenchProjection: workbench,
      supportReachabilityPostureProjection: reachability,
      reasonCodes: [
        "SUPPORT_219_REPAIR_CHAIN_CANONICAL_COMMUNICATION_BOUND",
        ...(replayCheckpointRef ? ["SUPPORT_219_REPLAY_CHECKPOINT_FROZEN" as const] : []),
      ],
      generatedAt,
      createdByAuthority: SUPPORT_REPAIR_CHAIN_ASSEMBLER_NAME,
    };
  }
}

export function createSupportRepairAndReplayApplication(options?: {
  readonly assembler?: SupportRepairChainAssembler;
}) {
  const assembler = options?.assembler ?? new SupportRepairChainAssembler();
  return {
    supportRepairChainAssembler: assembler,
    supportRepairReplayControlService: new SupportRepairReplayControlService(assembler),
    routeDefinitions: supportRepairAndReplayRoutes,
  } as const;
}
