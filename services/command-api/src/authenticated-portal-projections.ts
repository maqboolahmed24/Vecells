import { createHash } from "node:crypto";

export const AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME = "AuthenticatedPortalProjectionService";
export const AUTHENTICATED_PORTAL_PROJECTION_SCHEMA_VERSION = "185.phase2.portal-projections.v1";
export const AUTHENTICATED_PORTAL_PROJECTION_POLICY_VERSION =
  "phase2-authenticated-portal-projections-v1";
export const MORE_INFO_CHILD_ROUTE_RESOLVER_NAME = "MoreInfoChildRouteResolver";
export const CALLBACK_AND_REPAIR_STATUS_ASSEMBLER_NAME = "CallbackAndRepairStatusAssembler";
export const HEALTH_RECORD_PROJECTION_ASSEMBLER_NAME = "HealthRecordProjectionAssembler";
export const RECORD_ARTIFACT_PARITY_ENGINE_NAME = "RecordArtifactParityEngine";
export const COMMUNICATIONS_TIMELINE_ASSEMBLER_NAME = "CommunicationsTimelineAssembler";
export const COMMUNICATION_VISIBILITY_RESOLVER_NAME = "CommunicationVisibilityResolver";

export const authenticatedPortalProjectionPersistenceTables = [
  "phase2_patient_audience_coverage_projections",
  "phase2_patient_portal_entry_projections",
  "phase2_patient_home_projections",
  "phase2_patient_requests_index_projections",
  "phase2_patient_request_detail_projections",
  "phase2_patient_communication_visibility_projections",
  "phase2_patient_action_recovery_projections",
  "phase2_patient_identity_hold_projections",
  "phase2_patient_secure_link_session_projections",
  "phase2_patient_portal_projection_events",
] as const;

export const authenticatedPortalProjectionMigrationPlanRefs = [
  "services/command-api/migrations/100_phase2_authenticated_portal_projections.sql",
] as const;

export const authenticatedPortalProjectionParallelInterfaceGaps = [
  "PARALLEL_INTERFACE_GAP_PHASE2_PORTAL_CONTROLLER_LOCAL_TRIMMING_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_PORTAL_AUTHENTICATED_NOT_EVERYTHING_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_PORTAL_SAME_SHELL_RECOVERY_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_PORTAL_STABLE_PROJECTION_VOCABULARY_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_PORTAL_LIST_DETAIL_COVERAGE_PARITY_V1",
] as const;

export const AUTHENTICATED_PORTAL_REASON_CODES = [
  "PORTAL_185_COVERAGE_FIRST",
  "PORTAL_185_PUBLIC_MINIMAL_ONLY",
  "PORTAL_185_AUTHENTICATED_SUMMARY_ALLOWED",
  "PORTAL_185_DETAIL_FULL_ALLOWED",
  "PORTAL_185_DETAIL_SUMMARY_ONLY",
  "PORTAL_185_ACTION_DISABLED",
  "PORTAL_185_COMMAND_PENDING_CONSISTENCY",
  "PORTAL_185_SAME_SHELL_RECOVERY",
  "PORTAL_185_IDENTITY_HOLD",
  "PORTAL_185_STALE_SESSION_RECOVERY",
  "PORTAL_185_STALE_BINDING_RECOVERY",
  "PORTAL_185_ROUTE_INTENT_DRIFT_RECOVERY",
  "PORTAL_185_LINEAGE_FENCE_DRIFT_RECOVERY",
  "PORTAL_185_LIST_DETAIL_COVERAGE_PARITY",
  "PORTAL_185_NO_CONTROLLER_LOCAL_TRIMMING",
  "PORTAL_213_HEALTH_RECORD_SURFACE_CONTEXT",
  "PORTAL_213_RESULT_INTERPRETATION_AUTHORITY",
  "PORTAL_213_RESULT_INSIGHT_ALIAS_RESOLVED",
  "PORTAL_213_RECORD_ARTIFACT_PARITY_VERIFIED",
  "PORTAL_213_RECORD_ARTIFACT_PARITY_DEGRADED",
  "PORTAL_213_VISUALIZATION_PARITY_BRIDGED",
  "PORTAL_213_VISUALIZATION_TABLE_FALLBACK",
  "PORTAL_213_DELAYED_RELEASE_PLACEHOLDER",
  "PORTAL_213_STEP_UP_PLACEHOLDER",
  "PORTAL_213_RESTRICTED_PLACEHOLDER",
  "PORTAL_213_FOLLOW_UP_ELIGIBILITY",
  "PORTAL_213_RECORD_CONTINUITY_PRESERVED",
  "PORTAL_214_COMMUNICATION_TIMELINE_ASSEMBLED",
  "PORTAL_214_PREVIEW_SUPPRESSED_PLACEHOLDER",
  "PORTAL_214_STEP_UP_PLACEHOLDER",
  "PORTAL_214_RECOVERY_ONLY_PLACEHOLDER",
  "PORTAL_214_TUPLE_ALIGNMENT_VERIFIED",
  "PORTAL_214_TUPLE_ALIGNMENT_DRIFT",
  "PORTAL_214_LOCAL_SUCCESS_NOT_FINAL",
  "PORTAL_214_DELIVERY_FAILURE_VISIBLE",
  "PORTAL_214_DISPUTE_VISIBLE",
  "PORTAL_214_BLOCKER_REPAIR_DOMINATES",
  "PORTAL_214_CALLBACK_STATUS_COMPATIBILITY",
] as const;

export type AuthenticatedPortalReasonCode = (typeof AUTHENTICATED_PORTAL_REASON_CODES)[number];

export type PatientAudienceTier =
  | "patient_public"
  | "patient_authenticated"
  | "secure_link_recovery"
  | "embedded_authenticated";
export type PatientPurposeOfUse =
  | "public_status"
  | "authenticated_self_service"
  | "secure_link_recovery"
  | "embedded_authenticated";
export type CommunicationPreviewMode =
  | "public_safe_summary"
  | "authenticated_summary"
  | "step_up_required"
  | "suppressed_recovery_only";
export type TimelineVisibilityMode =
  | "awareness_only"
  | "summary_only"
  | "message_safe"
  | "full_patient_thread";
export type ArtifactVisibilityMode =
  | "summary_only"
  | "governed_inline"
  | "governed_download"
  | "placeholder_only";
export type MutationAuthority = "none" | "step_up_only" | "route_bound_mutation";
export type PortalSurfaceState =
  | "ready"
  | "pending_confirmation"
  | "under_review"
  | "repair_required"
  | "read_only"
  | "summary_only"
  | "action_disabled"
  | "recovery_required"
  | "identity_hold";
export type PortalEntryState =
  | "public_recovery"
  | "authenticated_home"
  | "requests_index"
  | "request_detail"
  | "same_shell_recovery"
  | "identity_hold";
export type PortalTrustPosture = "trusted" | "reduced" | "step_up_required" | "repair_hold";
export type PortalFreshnessState = "fresh" | "pending_consistency" | "stale" | "blocked";
export type PortalCausalConsistencyState = "consistent" | "pending" | "stale" | "blocked";
export type PortalRequestBucket = "needs_attention" | "in_progress" | "complete";
export type PortalVisibilityTier = "full" | "partial" | "placeholder_only" | "suppressed";
export type PortalSummarySafetyTier = "public_safe" | "patient_safe" | "phi_suppressed";
export type PortalProjectionState = "live" | "placeholder" | "recovery_only" | "identity_hold";
export type PortalRecoveryReason =
  | "none"
  | "stale_session"
  | "stale_binding"
  | "route_intent_tuple_drift"
  | "lineage_fence_drift"
  | "identity_repair_hold"
  | "command_pending";
export type PatientSpotlightDecisionTier =
  | "urgent_safety"
  | "patient_action"
  | "dependency_repair"
  | "watchful_attention"
  | "quiet_home";
export type PatientSpotlightCandidateType =
  | "active_request"
  | "pending_patient_action"
  | "dependency_repair"
  | "callback_message_blocker"
  | "record_results_cue"
  | "contact_reachability_repair"
  | "recovery_identity_hold";
export type PatientHomeTruthState = "complete" | "query_failed" | "converging" | "fallback";
export type PatientCapabilityLeaseState = "live" | "stale" | "missing";
export type PatientWritableEligibilityState = "writable" | "read_only" | "blocked";
export type PatientRequestActionType =
  | "respond_more_info"
  | "callback_response"
  | "contact_route_repair"
  | "renew_consent"
  | "record_follow_up"
  | "view_request"
  | "recover_session"
  | "none";
export type PatientRequestActionabilityState =
  | "live"
  | "read_only"
  | "blocked"
  | "recovery_required";
export type PatientActionSettlementState =
  | "local_acknowledged"
  | "pending_authoritative_confirmation"
  | "external_observation_received"
  | "authoritative_outcome_settled"
  | "disputed_recovery_required";
export type PatientSafetyInterruptionState =
  | "clear"
  | "assimilation_pending"
  | "review_pending"
  | "urgent_required"
  | "manual_review_required";
export type PatientMoreInfoCycleState =
  | "reply_needed"
  | "reply_submitted"
  | "awaiting_review"
  | "accepted_late_review"
  | "expired"
  | "superseded"
  | "repair_required"
  | "read_only";
export type PatientMoreInfoAnswerabilityState =
  | "answerable"
  | "submitted_read_only"
  | "blocked_by_repair"
  | "blocked_by_consent"
  | "expired_recovery"
  | "public_safe_placeholder";
export type PatientMoreInfoPromptState = "answered" | "unanswered" | "blocked" | "receipt";
export type PatientCallbackVisibleState =
  | "queued"
  | "scheduled"
  | "attempting_now"
  | "retry_planned"
  | "route_repair_required"
  | "escalated"
  | "closed";
export type PatientCallbackWindowRiskState =
  | "on_track"
  | "at_risk"
  | "missed_window"
  | "repair_required";
export type PatientReachabilitySummaryState =
  | "clear"
  | "degraded"
  | "blocked"
  | "recovering"
  | "rebound_pending";
export type PatientReachabilityRouteAuthorityState = "current" | "stale" | "disputed" | "unknown";
export type PatientDeliveryRiskState = "on_track" | "at_risk" | "likely_failed" | "disputed";
export type ConversationSubthreadType =
  | "secure_message"
  | "clinician_reply"
  | "callback"
  | "reminder"
  | "delivery_failure"
  | "provider_dispute"
  | "repair_guidance"
  | "receipt"
  | "more_info";
export type ConversationDeliveryRiskState = "on_track" | "at_risk" | "likely_failed" | "disputed";
export type ConversationDeliveryEvidenceState =
  | "not_applicable"
  | "pending"
  | "delivered"
  | "failed"
  | "bounced"
  | "disputed";
export type ConversationTransportAcceptanceState =
  | "not_started"
  | "queued"
  | "accepted"
  | "rejected";
export type ConversationLocalAckState = "none" | "seen" | "submitted" | "accepted_locally";
export type ConversationAuthoritativeOutcomeState =
  | "awaiting_delivery_truth"
  | "awaiting_reply"
  | "callback_scheduled"
  | "awaiting_review"
  | "reviewed"
  | "settled"
  | "recovery_required";
export type ConversationReplyNeededState =
  | "none"
  | "reply_needed"
  | "blocked_by_repair"
  | "blocked_by_step_up"
  | "read_only";
export type ConversationRepairRequiredState =
  | "none"
  | "contact_route_repair"
  | "consent_renewal"
  | "identity_repair"
  | "recovery";
export type ConversationTimelineSurfaceState =
  | "ready"
  | "placeholder"
  | "pending"
  | "recovery_only"
  | "read_only";
export type PatientComposerLeaseState = "active" | "blocked" | "resume_required" | "released";
export type ConversationTupleAlignmentState = "aligned" | "drifted" | "recovery_only";
export type PatientContactRepairState =
  | "not_required"
  | "required"
  | "in_progress"
  | "verification_pending"
  | "rebound_pending"
  | "applied"
  | "failed_recovery";
export type PatientConsentCheckpointState =
  | "satisfied"
  | "required"
  | "expired"
  | "renewal_pending"
  | "withdrawal_reconciliation"
  | "recovery_required";
export type PatientConsentCheckpointClass =
  | "more_info"
  | "callback"
  | "contact_repair"
  | "pharmacy"
  | "general";
export type PatientRecordCategory =
  | "latest_update"
  | "test_result"
  | "medicine_allergy"
  | "condition_care_plan"
  | "letter_document"
  | "action_needed_follow_up";
export type PatientRecordRenderMode =
  | "overview"
  | "detail"
  | "trend"
  | "document_summary"
  | "attachment";
export type PatientRecordReleaseState =
  | "visible"
  | "delayed_release"
  | "step_up_required"
  | "restricted"
  | "identity_hold"
  | "recovery_required";
export type PatientRecordSurfaceState =
  | "visible"
  | "gated_placeholder"
  | "stale_recovery"
  | "read_only";
export type PatientRecordContinuationState = "aligned" | "stale" | "blocked";
export type PatientRecordContinuityPosture =
  | "stable"
  | "child_route_active"
  | "awaiting_step_up"
  | "delayed_release"
  | "identity_hold"
  | "recovering"
  | "blocked";
export type PatientRecordPresentationMode =
  | "structured_summary"
  | "governed_preview"
  | "governed_download"
  | "external_handoff"
  | "placeholder_only"
  | "recovery_only";
export type PatientRecordSummaryParityState =
  | "verified"
  | "provisional"
  | "stale"
  | "extraction_failed"
  | "source_only"
  | "download_only"
  | "recovery_only";
export type PatientRecordSourceAuthorityState =
  | "source_authoritative"
  | "summary_verified"
  | "summary_provisional"
  | "source_only"
  | "table_only"
  | "placeholder_only"
  | "recovery_only";
export type RecordArtifactGateState =
  | "visible"
  | "delayed_release"
  | "step_up_required"
  | "restricted"
  | "identity_hold"
  | "blocked";
export type RecordArtifactParityState = "verified" | "provisional" | "stale" | "blocked";
export type VisualizationParityState =
  | "visual_and_table"
  | "table_only"
  | "summary_only"
  | "placeholder_only"
  | "blocked";
export type VisualizationAuthority = "chart" | "table" | "summary" | "placeholder";
export type PatientRecordFollowUpActionType =
  | "messaging"
  | "callback"
  | "booking"
  | "request_detail_repair"
  | "artifact_recovery";
export type PatientRecordFollowUpEligibilityState =
  | "available"
  | "gated"
  | "recovery_only"
  | "unavailable";
export type PatientRecordFollowUpFenceState = "aligned" | "stale" | "blocked";
export type PatientResultComparisonState =
  | "comparable"
  | "not_comparable"
  | "stale_source"
  | "partial_history";

export interface PatientSpotlightCandidateControls {
  readonly visibilityAllowed?: boolean;
  readonly identityHoldClear?: boolean;
  readonly continuityClear?: boolean;
  readonly releaseTrustClear?: boolean;
  readonly capabilityLeaseState?: PatientCapabilityLeaseState;
  readonly writableEligibilityState?: PatientWritableEligibilityState;
  readonly recoveryOnly?: boolean;
}

export interface PatientSpotlightCandidateInput extends PatientSpotlightCandidateControls {
  readonly candidateRef: string;
  readonly candidateType: PatientSpotlightCandidateType;
  readonly entityRef: string;
  readonly entityVersionRef: string;
  readonly patientLabel: string;
  readonly decisionTier: PatientSpotlightDecisionTier;
  readonly patientSafetyBlocker?: boolean;
  readonly patientOwedAction?: boolean;
  readonly activeDependencyFailure?: boolean;
  readonly authoritativeDueAt?: string | null;
  readonly latestMeaningfulUpdateAt: string;
  readonly stableEntityRef?: string;
  readonly actionRef?: string | null;
  readonly actionLabel?: string | null;
  readonly actionRouteRef?: string | null;
}

export interface PatientSpotlightCandidateProjection {
  readonly candidateRef: string;
  readonly candidateType: PatientSpotlightCandidateType;
  readonly entityRef: string;
  readonly entityVersionRef: string;
  readonly patientLabel: string;
  readonly decisionTier: PatientSpotlightDecisionTier;
  readonly patientSafetyBlocker: boolean;
  readonly patientOwedAction: boolean;
  readonly activeDependencyFailure: boolean;
  readonly authoritativeDueAt: string | null;
  readonly latestMeaningfulUpdateAt: string;
  readonly stableEntityRef: string;
  readonly actionRef: string | null;
  readonly actionLabel: string | null;
  readonly actionRouteRef: string | null;
  readonly capabilityLeaseState: PatientCapabilityLeaseState;
  readonly writableEligibilityState: PatientWritableEligibilityState;
  readonly visibilityAllowed: boolean;
  readonly identityHoldClear: boolean;
  readonly continuityClear: boolean;
  readonly releaseTrustClear: boolean;
  readonly recoveryOnly: boolean;
  readonly visibilityState: "visible" | "excluded";
  readonly exclusionReasons: readonly string[];
  readonly selectionTuple: readonly [
    PatientSpotlightDecisionTier,
    boolean,
    boolean,
    boolean,
    string,
    string,
    string,
  ];
  readonly selectionTupleHash: string;
}

export interface PatientSpotlightDecisionUseWindow {
  readonly projectionName: "PatientSpotlightDecisionUseWindow";
  readonly state:
    | "new_selection"
    | "preserved"
    | "preempted_by_higher_tier"
    | "expired_revalidated"
    | "quiet_revalidated";
  readonly selectedCandidateRef: string | null;
  readonly challengerCandidateRef: string | null;
  readonly challengerDecisionTier: PatientSpotlightDecisionTier | null;
  readonly windowStartedAt: string;
  readonly windowExpiresAt: string;
  readonly explicitRevalidateAt: string;
  readonly selectionTupleHash: string;
  readonly explanation: string;
}

export interface PatientQuietHomeDecision {
  readonly projectionName: "PatientQuietHomeDecision";
  readonly decisionRef: string;
  readonly decisionTier: "quiet_home";
  readonly eligible: boolean;
  readonly reason:
    | "all_clear"
    | "candidate_present"
    | "blocked_by_recovery"
    | "blocked_by_identity_hold"
    | "blocked_by_degraded_truth"
    | "blocked_by_visibility_or_actionability";
  readonly explanation: string;
  readonly gentlestSafeNextActionRef: string;
  readonly blockedPreventionRefs: readonly string[];
  readonly candidateSetEmpty: boolean;
  readonly queryTruthState: PatientHomeTruthState;
  readonly computedAt: string;
}

export interface PatientSpotlightDecisionProjection {
  readonly projectionName: "PatientSpotlightDecisionProjection";
  readonly decisionRef: string;
  readonly decisionTier: PatientSpotlightDecisionTier;
  readonly selectedCandidateRef: string | null;
  readonly selectedEntityRef: string | null;
  readonly selectedActionRef: string | null;
  readonly selectedActionRouteRef: string | null;
  readonly selectedActionLabel: string | null;
  readonly headline: string;
  readonly body: string;
  readonly singleDominantAction: true;
  readonly candidateLadder: readonly PatientSpotlightCandidateProjection[];
  readonly excludedCandidateRefs: readonly string[];
  readonly outrankedCandidateRefs: readonly string[];
  readonly useWindow: PatientSpotlightDecisionUseWindow;
  readonly quietHomeDecisionRef: string;
  readonly selectionTupleHash: string;
  readonly sourceProjectionRefs: readonly string[];
  readonly reasonCodes: readonly string[];
  readonly computedAt: string;
  readonly createdByAuthority: typeof AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME;
}

export interface PatientNavUrgencyDigest {
  readonly projectionName: "PatientNavUrgencyDigest";
  readonly digestRef: string;
  readonly urgentCount: number;
  readonly attentionCount: number;
  readonly dependencyRepairCount: number;
  readonly quietHomeEligible: boolean;
  readonly dominantRouteRef: string | null;
  readonly urgentHelpRouteRef: "/v1/help/urgent";
  readonly routeBadges: readonly {
    readonly routeRef: string;
    readonly label: string;
    readonly urgencyTier: PatientSpotlightDecisionTier;
  }[];
  readonly computedAt: string;
}

export interface PatientNavReturnContract {
  readonly projectionName: "PatientNavReturnContract";
  readonly contractRef: string;
  readonly originRouteRef: string;
  readonly returnRouteRef: string;
  readonly selectedEntityRef: string | null;
  readonly selectedCandidateRef: string | null;
  readonly tupleHash: string;
  readonly continuityState: "preserved" | "quiet" | "recovery_only" | "blocked";
}

export interface PatientPortalNavigationProjection {
  readonly projectionName: "PatientPortalNavigationProjection";
  readonly activeRouteRef: "/v1/me/home";
  readonly items: readonly {
    readonly id: "home" | "requests" | "messages" | "account";
    readonly label: string;
    readonly path: string;
    readonly badgeLabel: string | null;
    readonly ariaCurrent: boolean;
  }[];
  readonly urgencyDigestRef: string;
}

export interface PortalRouteTupleInput {
  readonly routeFamilyRef: string;
  readonly sessionEpochRef: string | null;
  readonly expectedSessionEpochRef: string | null;
  readonly subjectBindingVersionRef: string | null;
  readonly expectedSubjectBindingVersionRef: string | null;
  readonly routeIntentBindingRef: string | null;
  readonly expectedRouteIntentBindingRef: string | null;
  readonly lineageFenceRef: string | null;
  readonly expectedLineageFenceRef: string | null;
}

export interface BuildPatientAudienceCoverageInput extends PortalRouteTupleInput {
  readonly subjectRef: string;
  readonly audienceTier: PatientAudienceTier;
  readonly purposeOfUse: PatientPurposeOfUse;
  readonly trustPosture: PortalTrustPosture;
  readonly freshnessState?: PortalFreshnessState;
  readonly commandConsistencyState?: PortalCausalConsistencyState;
  readonly coverageRowRefs?: readonly string[];
  readonly sectionContractRefs?: readonly string[];
  readonly previewContractRefs?: readonly string[];
  readonly artifactContractRefs?: readonly string[];
  readonly redactionPolicyRefs?: readonly string[];
  readonly identityRepairCaseRef?: string | null;
  readonly observedAt?: string;
}

export interface PatientAudienceCoverageProjection {
  readonly patientAudienceCoverageProjectionId: string;
  readonly schemaVersion: typeof AUTHENTICATED_PORTAL_PROJECTION_SCHEMA_VERSION;
  readonly policyVersion: typeof AUTHENTICATED_PORTAL_PROJECTION_POLICY_VERSION;
  readonly subjectScopeRef: string;
  readonly audienceTier: PatientAudienceTier;
  readonly purposeOfUse: PatientPurposeOfUse;
  readonly projectionFamilyRefs: readonly string[];
  readonly routeFamilyRefs: readonly string[];
  readonly communicationPreviewMode: CommunicationPreviewMode;
  readonly timelineVisibilityMode: TimelineVisibilityMode;
  readonly artifactVisibilityMode: ArtifactVisibilityMode;
  readonly mutationAuthority: MutationAuthority;
  readonly minimumNecessaryContractRef: string;
  readonly requiredVisibilityPolicyRef: string;
  readonly requiredCoverageRowRefs: readonly string[];
  readonly requiredSectionContractRefs: readonly string[];
  readonly requiredPreviewContractRefs: readonly string[];
  readonly requiredArtifactContractRefs: readonly string[];
  readonly requiredRedactionPolicyRefs: readonly string[];
  readonly requiredPlaceholderContractRef: string;
  readonly requiredRouteIntentRefs: readonly string[];
  readonly requiredEmbeddedSessionRef: string | null;
  readonly surfaceState: PortalSurfaceState;
  readonly recoveryReason: PortalRecoveryReason;
  readonly reasonCodes: readonly string[];
  readonly computedAt: string;
  readonly createdByAuthority: typeof AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME;
}

export interface PatientShellConsistencyProjection {
  readonly patientShellConsistencyRef: string;
  readonly bundleVersion: typeof AUTHENTICATED_PORTAL_PROJECTION_SCHEMA_VERSION;
  readonly audienceTier: PatientAudienceTier;
  readonly computedAt: string;
  readonly staleAt: string;
  readonly governingObjectRefs: readonly string[];
  readonly entityVersionRefs: readonly string[];
  readonly causalConsistencyState: PortalCausalConsistencyState;
  readonly releaseApprovalFreezeRef: string | null;
  readonly channelReleaseFreezeState: "open" | "read_only" | "frozen";
  readonly requiredAssuranceSliceTrustRefs: readonly string[];
  readonly releaseRecoveryDispositionRef: string | null;
}

export interface PatientPortalEntryProjection {
  readonly patientPortalEntryProjectionId: string;
  readonly coverageProjectionRef: string;
  readonly patientShellConsistencyRef: string;
  readonly subjectRef: string;
  readonly entryState: PortalEntryState;
  readonly audienceTier: PatientAudienceTier;
  readonly trustPosture: PortalTrustPosture;
  readonly freshnessState: PortalFreshnessState;
  readonly routeTupleHash: string;
  readonly currentStateTitle: string;
  readonly currentRouteFamilyRef: string;
  readonly safeLandingRouteRef: string;
  readonly nextProjectionRefs: readonly string[];
  readonly reasonCodes: readonly string[];
  readonly renderedAt: string;
  readonly createdByAuthority: typeof AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME;
}

export interface PatientHomeProjection {
  readonly projectionName: "PatientHomeProjection";
  readonly projectionAlias: "PatientPortalHomeProjection";
  readonly patientHomeProjectionId: string;
  readonly coverageProjectionRef: string;
  readonly patientShellConsistencyRef: string;
  readonly spotlightDecisionRef: string;
  readonly quietHomeDecisionRef: string;
  readonly requiredReleaseTrustFreezeVerdictRef: string | null;
  readonly secondaryCardOrderingHash: string;
  readonly compactCardRefs: readonly string[];
  readonly dominantActionRef: string | null;
  readonly homeMode: "attention" | "quiet" | "recovery_only" | "blocked";
  readonly spotlightDecision: PatientSpotlightDecisionProjection;
  readonly spotlightUseWindow: PatientSpotlightDecisionUseWindow;
  readonly quietHomeDecision: PatientQuietHomeDecision;
  readonly navigationUrgencyDigest: PatientNavUrgencyDigest;
  readonly navReturnContract: PatientNavReturnContract;
  readonly portalNavigation: PatientPortalNavigationProjection;
  readonly querySurfaceRef: "GET /v1/me/home";
  readonly selectedSpotlightRef: string | null;
  readonly visibleCandidateRefs: readonly string[];
  readonly excludedCandidateRefs: readonly string[];
  readonly sourceProjectionRefs: readonly string[];
  readonly surfaceState: PortalSurfaceState;
  readonly reasonCodes: readonly string[];
  readonly computedAt: string;
  readonly createdByAuthority: typeof AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME;
}

export type PatientPortalHomeProjection = PatientHomeProjection;

export interface PortalSourceDownstream {
  readonly childType:
    | "more_info_cycle"
    | "booking_case"
    | "appointment"
    | "callback_case"
    | "conversation_cluster"
    | "pharmacy_case"
    | "hub_case"
    | "self_care_advice"
    | "admin_resolution_case"
    | "record_follow_up"
    | "admin_repair";
  readonly childRef: string;
  readonly patientLabelRef: string;
  readonly authoritativeState: string;
  readonly awaitingParty: "patient" | "practice" | "system" | "none";
  readonly nextSafeActionRef: string | null;
  readonly visibilityTier: PortalVisibilityTier;
  readonly lastMeaningfulUpdateAt: string;
}

export interface PortalSourceMoreInfoPrompt {
  readonly promptRef: string;
  readonly promptLabelRef: string;
  readonly state: PatientMoreInfoPromptState;
  readonly requiredEvidenceRefs?: readonly string[];
  readonly visibilityTier?: PortalVisibilityTier;
  readonly answerReceiptRef?: string | null;
}

export interface PortalSourceMoreInfoCycle {
  readonly cycleRef: string;
  readonly cycleVersionRef: string;
  readonly promptStackRef: string;
  readonly state: PatientMoreInfoCycleState;
  readonly replyWindowCheckpointRef: string;
  readonly lateReviewWindowRef: string | null;
  readonly dueAt: string | null;
  readonly expiresAt: string | null;
  readonly authoritativeReceiptRef?: string | null;
  readonly secureLinkGrantRef?: string | null;
  readonly continuityEvidenceRef?: string | null;
  readonly promptItems: readonly PortalSourceMoreInfoPrompt[];
}

export interface PortalSourceCallbackCase {
  readonly callbackCaseRef: string;
  readonly callbackCaseVersionRef: string;
  readonly clusterRef: string;
  readonly expectationEnvelopeRef: string;
  readonly outcomeEvidenceBundleRef?: string | null;
  readonly resolutionGateRef?: string | null;
  readonly patientVisibleState: PatientCallbackVisibleState;
  readonly windowRiskState: PatientCallbackWindowRiskState;
  readonly windowLowerAt: string | null;
  readonly windowUpperAt: string | null;
  readonly stateConfidenceBand: "high" | "medium" | "low";
  readonly monotoneRevision: number;
  readonly continuityEvidenceRef?: string | null;
}

export interface PortalSourceReachability {
  readonly reachabilityAssessmentRef: string;
  readonly contactRouteSnapshotRef: string;
  readonly summaryState: PatientReachabilitySummaryState;
  readonly routeAuthorityState: PatientReachabilityRouteAuthorityState;
  readonly deliveryRiskState: PatientDeliveryRiskState;
  readonly activeDependencyRef?: string | null;
  readonly affectedRouteRefs: readonly string[];
  readonly latestObservationAt: string;
}

export interface PortalSourceContactRepair {
  readonly repairCaseRef: string;
  readonly contactRepairJourneyRef: string;
  readonly repairState: PatientContactRepairState;
  readonly blockedActionRef: string;
  readonly blockedContextRef: string;
  readonly verificationCheckpointRef?: string | null;
  readonly resultingReachabilityAssessmentRef?: string | null;
  readonly repairRouteRef?: string | null;
}

export interface PortalSourceConsentCheckpoint {
  readonly checkpointRef: string;
  readonly checkpointClass: PatientConsentCheckpointClass;
  readonly surfaceState: PatientConsentCheckpointState;
  readonly blockedActionRef: string;
  readonly blockedContextRef: string;
  readonly consentGrantRef?: string | null;
  readonly renewalRouteRef?: string | null;
  readonly selectionBindingHash?: string | null;
}

export interface PortalSourceRecordFollowUpAction {
  readonly actionType: PatientRecordFollowUpActionType;
  readonly actionRef: string;
  readonly actionLabel: string;
  readonly routeRef: string;
  readonly recordActionContextTokenRef: string;
  readonly recordOriginContinuationRef: string;
  readonly capabilityRef: string;
  readonly capabilityLeaseExpiresAt: string | null;
  readonly blockingDependencyRefs?: readonly string[];
}

export interface PortalSourceRecordArtifact {
  readonly recordArtifactRef: string;
  readonly structuredSummaryRef: string;
  readonly structuredSummaryHash: string;
  readonly summaryDerivationPackageRef: string;
  readonly summaryRedactionTransformRef: string;
  readonly sourceArtifactRef: string;
  readonly sourceArtifactBundleRef: string;
  readonly sourceArtifactHash: string;
  readonly sourceRedactionTransformRef: string;
  readonly extractVersionRef: string;
  readonly artifactPresentationContractRef: string;
  readonly artifactSurfaceBindingRef: string;
  readonly artifactSurfaceContextRef: string;
  readonly artifactSurfaceFrameRef: string;
  readonly artifactModeTruthProjectionRef: string;
  readonly currentSafeMode: PatientRecordPresentationMode;
  readonly binaryArtifactDeliveryRef?: string | null;
  readonly artifactByteGrantRef?: string | null;
  readonly artifactParityDigestRef: string;
  readonly artifactTransferSettlementRef?: string | null;
  readonly artifactFallbackDispositionRef?: string | null;
  readonly embeddedNavigationGrantRef?: string | null;
  readonly downloadEligibilityState?: "available" | "gated" | "unavailable";
  readonly summaryParityState?: PatientRecordSummaryParityState;
  readonly sourceAuthorityState?: PatientRecordSourceAuthorityState;
  readonly generatedAt?: string;
}

export interface PortalSourceResultInterpretation {
  readonly observationRef: string;
  readonly patientSafeTitle: string;
  readonly whatThisTestIs: string;
  readonly latestResult: string;
  readonly whatChanged: string;
  readonly patientNextStep: string;
  readonly urgentHelp: string;
  readonly technicalDetails: string;
  readonly displayValue: string;
  readonly displayUnit: string;
  readonly originalValue: string;
  readonly originalUnit: string;
  readonly referenceRangeRef: string;
  readonly comparatorBasisRef: string;
  readonly trendWindowRef: string;
  readonly specimenRef: string;
  readonly specimenDate: string;
  readonly sourceOrganisationRef: string;
  readonly abnormalityBasisRef: string;
  readonly interpretationSummary: string;
  readonly comparisonState: PatientResultComparisonState;
}

export interface PortalSourceVisualization {
  readonly visualizationRef: string;
  readonly summarySentenceRef: string;
  readonly summaryText: string;
  readonly tableRef: string;
  readonly rowIdentityRefs: readonly string[];
  readonly columnSchemaRef: string;
  readonly sortStateRef: string;
  readonly filterContextRef: string;
  readonly unitLabelRefs: readonly string[];
  readonly selectionModelRef: string;
  readonly currentSelectionRef: string;
  readonly selectionSummaryRef: string;
  readonly filterSummaryRef: string;
  readonly trustSummaryRef: string;
  readonly nonColorCueRefs: readonly string[];
  readonly comparisonMode: "none" | "primary_vs_prior" | "ranked" | "matrix" | "time_series";
  readonly keyboardModelRef: string;
  readonly parityState: VisualizationParityState;
  readonly freshnessAccessibilityContractRef: string;
}

export interface PortalSourceRecord {
  readonly recordRef: string;
  readonly recordVersionRef: string;
  readonly recordLineageRef: string;
  readonly patientSafeTitle: string;
  readonly publicSafeTitle: string;
  readonly category: PatientRecordCategory;
  readonly ownerSubjectRef: string;
  readonly requiredSubjectBindingVersionRef: string;
  readonly requiredSessionEpochRef: string;
  readonly routeIntentBindingRef: string;
  readonly lineageFenceRef: string;
  readonly recordVisibilityEnvelopeRef: string;
  readonly recordReleaseGateRef: string;
  readonly recordStepUpCheckpointRef: string;
  readonly releaseState: PatientRecordReleaseState;
  readonly visibilityTier: PortalVisibilityTier;
  readonly summarySafetyTier: PortalSummarySafetyTier;
  readonly latestMeaningfulUpdateAt: string;
  readonly renderMode?: PatientRecordRenderMode;
  readonly selectedAnchorRef?: string | null;
  readonly oneExpandedItemGroupRef?: string | null;
  readonly resultId?: string | null;
  readonly documentId?: string | null;
  readonly placeholderContractRef?: string | null;
  readonly recordOriginContinuationRef?: string | null;
  readonly recoveryContinuationTokenRef?: string | null;
  readonly experienceContinuityEvidenceRef?: string | null;
  readonly artifacts: readonly PortalSourceRecordArtifact[];
  readonly resultInterpretation?: PortalSourceResultInterpretation | null;
  readonly visualization?: PortalSourceVisualization | null;
  readonly followUpActions?: readonly PortalSourceRecordFollowUpAction[];
  readonly commandConsistencyState?: PortalCausalConsistencyState;
  readonly identityRepairCaseRef?: string | null;
  readonly identityRepairFreezeRef?: string | null;
}

export interface PortalSourceRequest {
  readonly requestRef: string;
  readonly requestVersionRef: string;
  readonly requestLineageRef: string;
  readonly patientSafeLabel: string;
  readonly publicSafeLabel: string;
  readonly statusText: string;
  readonly bucket: PortalRequestBucket;
  readonly ownerSubjectRef: string;
  readonly requiredSubjectBindingVersionRef: string;
  readonly requiredSessionEpochRef: string;
  readonly routeIntentBindingRef: string;
  readonly lineageFenceRef: string;
  readonly awaitingParty: "patient" | "practice" | "system" | "none";
  readonly nextSafeActionRef: string | null;
  readonly dominantActionRef: string | null;
  readonly latestMeaningfulUpdateAt: string;
  readonly evidenceSnapshotRef: string;
  readonly evidenceSummaryParityRef: string;
  readonly trustCueRef: string;
  readonly lineageCaseLinkRefs: readonly string[];
  readonly downstream: readonly PortalSourceDownstream[];
  readonly communicationClusterRefs: readonly string[];
  readonly artifactRefs: readonly string[];
  readonly commandConsistencyState: PortalCausalConsistencyState;
  readonly identityRepairCaseRef?: string | null;
  readonly identityRepairFreezeRef?: string | null;
  readonly preferredActionType?: PatientRequestActionType | null;
  readonly actionSettlementState?: PatientActionSettlementState | null;
  readonly safetyInterruptionState?: PatientSafetyInterruptionState | null;
  readonly safetyInterruptionReasonRef?: string | null;
  readonly moreInfoCycle?: PortalSourceMoreInfoCycle | null;
  readonly callbackCases?: readonly PortalSourceCallbackCase[];
  readonly reachability?: PortalSourceReachability | null;
  readonly contactRepair?: PortalSourceContactRepair | null;
  readonly consentCheckpoint?: PortalSourceConsentCheckpoint | null;
}

export interface PortalSourceCommunicationEnvelope {
  readonly envelopeRef: string;
  readonly envelopeVersionRef: string;
  readonly clusterRef: string;
  readonly threadId: string;
  readonly subthreadRef?: string | null;
  readonly subthreadType: ConversationSubthreadType;
  readonly channel: "secure_message" | "portal" | "sms" | "email" | "phone" | "post";
  readonly authoredBy: "patient" | "clinician" | "practice" | "system" | "provider";
  readonly patientSafeSummary: string;
  readonly publicSafeSummary: string;
  readonly sentAt: string;
  readonly sortAt?: string | null;
  readonly visibleSnippetRef?: string | null;
  readonly previewKindRef?: string | null;
  readonly reminderPlanRef?: string | null;
  readonly receiptRef?: string | null;
  readonly settlementRef?: string | null;
  readonly failureEvidenceRef?: string | null;
  readonly disputeEvidenceRef?: string | null;
  readonly transportAcceptanceState?: ConversationTransportAcceptanceState;
  readonly deliveryEvidenceState?: ConversationDeliveryEvidenceState;
  readonly deliveryRiskState?: ConversationDeliveryRiskState;
  readonly localAckState?: ConversationLocalAckState;
  readonly authoritativeOutcomeState?: ConversationAuthoritativeOutcomeState;
  readonly visibilityTier?: PortalVisibilityTier;
  readonly summarySafetyTier?: PortalSummarySafetyTier;
}

export interface PortalSourceConversationSubthread {
  readonly subthreadRef: string;
  readonly subthreadType: ConversationSubthreadType;
  readonly owner: "patient" | "practice" | "system" | "provider";
  readonly label: string;
  readonly replyTargetRef?: string | null;
  readonly replyWindowRef?: string | null;
  readonly workflowBranchRef?: string | null;
  readonly communicationEnvelopeRefs?: readonly string[];
  readonly sortAt: string;
}

export interface PortalSourceConversationCluster {
  readonly clusterRef: string;
  readonly clusterVersionRef: string;
  readonly threadId: string;
  readonly threadVersionRef: string;
  readonly governingRequestRef?: string | null;
  readonly requestLineageRef?: string | null;
  readonly careEpisodeRef?: string | null;
  readonly ownerSubjectRef?: string | null;
  readonly patientSafeSubject: string;
  readonly publicSafeSubject: string;
  readonly selectedAnchorRef?: string | null;
  readonly latestMeaningfulUpdateAt: string;
  readonly receiptGrammarVersionRef: string;
  readonly monotoneRevision: number;
  readonly previewVisibilityContractRef?: string | null;
  readonly summarySafetyTier?: PortalSummarySafetyTier;
  readonly messageThreadRefs?: readonly string[];
  readonly callbackCaseRefs?: readonly string[];
  readonly reminderPlanRefs?: readonly string[];
  readonly subthreads?: readonly PortalSourceConversationSubthread[];
  readonly communicationEnvelopes: readonly PortalSourceCommunicationEnvelope[];
  readonly callbackStatusProjections?: readonly PatientCallbackStatusProjection[];
  readonly reachabilitySummaryProjection?: PatientReachabilitySummaryProjection | null;
  readonly contactRepairProjection?: PatientContactRepairProjection | null;
  readonly consentCheckpointProjection?: PatientConsentCheckpointProjection | null;
  readonly expectedThreadTupleHash?: string | null;
  readonly forceTupleDrift?: boolean;
  readonly identityRepairCaseRef?: string | null;
  readonly commandConsistencyState?: PortalCausalConsistencyState;
}

export interface PatientRequestSummaryProjection {
  readonly summaryProjectionRef: string;
  readonly coverageProjectionRef: string;
  readonly requestRef: string;
  readonly requestLineageRef: string;
  readonly displayLabel: string;
  readonly statusText: string;
  readonly awaitingParty: PortalSourceRequest["awaitingParty"];
  readonly latestMeaningfulUpdateAt: string;
  readonly nextSafeActionRef: string | null;
  readonly dominantActionRef: string | null;
  readonly trustCueRef: string;
  readonly summarySafetyTier: PortalSummarySafetyTier;
  readonly visibleFieldRefs: readonly string[];
  readonly blockedFieldRefs: readonly string[];
  readonly surfaceState: PortalSurfaceState;
  readonly reasonCodes: readonly string[];
  readonly computedAt: string;
}

export interface PatientRequestLineageProjection {
  readonly patientRequestLineageProjectionId: string;
  readonly coverageProjectionRef: string;
  readonly requestRef: string;
  readonly requestLineageRef: string;
  readonly summaryProjectionRef: string;
  readonly detailProjectionRef: string | null;
  readonly currentStageRef: string;
  readonly lineageCaseLinkRefs: readonly string[];
  readonly downstreamProjectionRefs: readonly string[];
  readonly childObjects: readonly string[];
  readonly requestReturnBundleRef: string;
  readonly nextActionProjectionRef: string;
  readonly latestLineageCaseLinkRef: string | null;
  readonly visiblePlaceholderRefs: readonly string[];
  readonly awaitingParty: PortalSourceRequest["awaitingParty"];
  readonly safestNextActionRef: string | null;
  readonly nextExpectedStepRef: string | null;
  readonly lastConfirmedStepAt: string;
  readonly selectedChildAnchorRef: string | null;
  readonly selectedChildAnchorTupleHash: string;
  readonly lineageTupleHash: string;
  readonly visibilityState: Exclude<PortalVisibilityTier, "suppressed">;
  readonly computedAt: string;
}

export interface PatientRequestDownstreamProjection {
  readonly projectionName: "PatientRequestDownstreamProjection";
  readonly downstreamProjectionRef: string;
  readonly coverageProjectionRef: string;
  readonly requestRef: string;
  readonly requestLineageRef: string;
  readonly patientShellConsistencyRef: string;
  readonly childType: PortalSourceDownstream["childType"];
  readonly childRef: string;
  readonly patientLabelRef: string;
  readonly authoritativeState: string;
  readonly awaitingParty: PortalSourceDownstream["awaitingParty"];
  readonly sortKey: string;
  readonly visibilityTier: PortalVisibilityTier;
  readonly placeholderPosture:
    | "none"
    | "step_up_required"
    | "read_only"
    | "identity_hold"
    | "release_delay"
    | "sibling_projection_missing";
  readonly placeholderReasonRefs: readonly string[];
  readonly nextSafeActionRef: string | null;
  readonly childAnchorTupleHash: string;
  readonly routeRef: string;
  readonly computedAt: string;
  readonly createdByAuthority: typeof AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME;
}

export interface PatientRequestReturnBundle {
  readonly projectionName: "PatientRequestReturnBundle";
  readonly requestReturnBundleRef: string;
  readonly requestRef: string;
  readonly requestLineageRef: string;
  readonly selectedAnchorRef: string;
  readonly selectedFilterRef: PortalRequestBucket | "all";
  readonly disclosurePosture: "row_summary" | "detail_header" | "child_route" | "recovery";
  readonly scrollStateRef: string | null;
  readonly returnRouteRef: string;
  readonly selectedAnchorTupleHash: string;
  readonly lineageTupleHash: string;
  readonly continuityEvidenceRef: string;
  readonly sameShellState: "preserved" | "read_only" | "recovery_required" | "identity_hold";
  readonly computedAt: string;
}

export interface PatientRequestsIndexProjection {
  readonly patientRequestsIndexProjectionId: string;
  readonly coverageProjectionRef: string;
  readonly patientRef: string | null;
  readonly defaultBucket: PortalRequestBucket;
  readonly visibleBuckets: readonly PortalRequestBucket[];
  readonly activeFilterSetRef: string;
  readonly selectedAnchorRef: string | null;
  readonly selectedAnchorTupleHash: string | null;
  readonly selectedRequestReturnBundleRef: string | null;
  readonly dominantActionRef: string | null;
  readonly trustCueRef: string;
  readonly requestSummaryRefs: readonly string[];
  readonly requestLineageRefs: readonly string[];
  readonly bucketMembershipDigestRef: string;
  readonly lineageOrderingDigestRef: string;
  readonly surfaceState: PortalSurfaceState;
  readonly reasonCodes: readonly string[];
  readonly computedAt: string;
  readonly createdByAuthority: typeof AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME;
}

export interface PatientNextActionProjection {
  readonly projectionName: "PatientNextActionProjection";
  readonly nextActionProjectionRef: string;
  readonly coverageProjectionRef: string;
  readonly requestRef: string;
  readonly requestLineageRef: string;
  readonly governingObjectRef: string;
  readonly actionType: PatientRequestActionType;
  readonly dominantActionRef: string | null;
  readonly actionLabel: string;
  readonly actionability: PatientRequestActionabilityState;
  readonly routingProjectionRef: string | null;
  readonly blockingDependencyRefs: readonly string[];
  readonly safetyInterruptionRef: string | null;
  readonly requestReturnBundleRef: string;
  readonly reasonCodes: readonly string[];
  readonly computedAt: string;
}

export interface PatientActionRoutingProjection {
  readonly projectionName: "PatientActionRoutingProjection";
  readonly actionRoutingProjectionRef: string;
  readonly coverageProjectionRef: string;
  readonly governingObjectRef: string;
  readonly governingObjectVersionRef: string;
  readonly routeFamilyRef: string;
  readonly routeIntentBindingRef: string | null;
  readonly capabilityLeaseRef: string;
  readonly writableEligibilityFenceRef: string;
  readonly policyBundleRef: string;
  readonly requestReturnBundleRef: string;
  readonly continuityEvidenceRef: string;
  readonly freshnessToken: string;
  readonly actionType: PatientRequestActionType;
  readonly routeTargetRef: string | null;
  readonly blockedReasonRef: string | null;
  readonly safetyInterruptionRef: string | null;
  readonly computedAt: string;
  readonly createdByAuthority: typeof AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME;
}

export interface PatientActionSettlementProjection {
  readonly projectionName: "PatientActionSettlementProjection";
  readonly actionSettlementProjectionRef: string;
  readonly actionRoutingProjectionRef: string;
  readonly governingObjectRef: string;
  readonly localAckState: "none" | "acknowledged";
  readonly processingAcceptanceState: "not_started" | "accepted" | "pending";
  readonly externalObservationState: "none" | "received" | "disputed";
  readonly authoritativeOutcomeState: PatientActionSettlementState;
  readonly sameShellState: "pending" | "settled" | "recovery_required" | "disputed";
  readonly recoveryEnvelopeRef: string | null;
  readonly requestReturnBundleRef: string;
  readonly settledAt: string | null;
  readonly computedAt: string;
  readonly createdByAuthority: typeof AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME;
}

export interface PatientSafetyInterruptionProjection {
  readonly projectionName: "PatientSafetyInterruptionProjection";
  readonly safetyInterruptionProjectionRef: string;
  readonly coverageProjectionRef: string;
  readonly requestRef: string;
  readonly requestLineageRef: string;
  readonly surfaceState: PatientSafetyInterruptionState;
  readonly interruptionReasonRef: string | null;
  readonly suppressedActionRefs: readonly string[];
  readonly nextSafeActionRef: string;
  readonly requestReturnBundleRef: string;
  readonly safetyDecisionEpochRef: string;
  readonly computedAt: string;
  readonly createdByAuthority: typeof AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME;
}

export interface PatientReachabilitySummaryProjection {
  readonly projectionName: "PatientReachabilitySummaryProjection";
  readonly reachabilitySummaryProjectionRef: string;
  readonly coverageProjectionRef: string;
  readonly requestRef: string;
  readonly requestLineageRef: string;
  readonly reachabilityAssessmentRef: string;
  readonly contactRouteSnapshotRef: string;
  readonly summaryState: PatientReachabilitySummaryState;
  readonly routeAuthorityState: PatientReachabilityRouteAuthorityState;
  readonly deliveryRiskState: PatientDeliveryRiskState;
  readonly activeDependencyRef: string | null;
  readonly affectedRouteRefs: readonly string[];
  readonly dominantRepairActionRef: string | null;
  readonly currentRouteSafe: boolean;
  readonly publicSafeSummaryRef: string;
  readonly latestObservationAt: string;
  readonly requestReturnBundleRef: string;
  readonly continuityEvidenceRef: string;
  readonly computedAt: string;
  readonly createdByAuthority: typeof AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME;
}

export interface PatientContactRepairProjection {
  readonly projectionName: "PatientContactRepairProjection";
  readonly contactRepairProjectionRef: string;
  readonly coverageProjectionRef: string;
  readonly requestRef: string;
  readonly requestLineageRef: string;
  readonly repairCaseRef: string;
  readonly contactRepairJourneyRef: string;
  readonly repairState: PatientContactRepairState;
  readonly blockedActionRef: string;
  readonly blockedContextRef: string;
  readonly preservedBlockedActionSummaryRef: string;
  readonly verificationCheckpointRef: string | null;
  readonly resultingReachabilityAssessmentRef: string | null;
  readonly dominantActionRef: string | null;
  readonly repairRouteRef: string;
  readonly requestReturnBundleRef: string;
  readonly continuityEvidenceRef: string;
  readonly sameShellState:
    | "repair_active"
    | "verification_pending"
    | "rebound_pending"
    | "released";
  readonly computedAt: string;
  readonly createdByAuthority: typeof AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME;
}

export interface PatientConsentCheckpointProjection {
  readonly projectionName: "PatientConsentCheckpointProjection";
  readonly consentCheckpointProjectionRef: string;
  readonly coverageProjectionRef: string;
  readonly requestRef: string;
  readonly requestLineageRef: string;
  readonly checkpointRef: string;
  readonly checkpointClass: PatientConsentCheckpointClass;
  readonly surfaceState: PatientConsentCheckpointState;
  readonly blockedActionRef: string;
  readonly blockedContextRef: string;
  readonly consentGrantRef: string | null;
  readonly renewalRouteRef: string | null;
  readonly selectionBindingHash: string | null;
  readonly dominantActionRef: string | null;
  readonly requestReturnBundleRef: string;
  readonly continuityEvidenceRef: string;
  readonly reasonCodes: readonly string[];
  readonly computedAt: string;
  readonly createdByAuthority: typeof AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME;
}

export interface PatientMoreInfoStatusProjection {
  readonly projectionName: "PatientMoreInfoStatusProjection";
  readonly moreInfoStatusProjectionRef: string;
  readonly coverageProjectionRef: string;
  readonly requestRef: string;
  readonly requestLineageRef: string;
  readonly activeCycleRef: string;
  readonly cycleVersionRef: string;
  readonly promptStackRef: string;
  readonly cycleState: PatientMoreInfoCycleState;
  readonly replyWindowCheckpointRef: string;
  readonly lateReviewWindowRef: string | null;
  readonly dueAt: string | null;
  readonly expiresAt: string | null;
  readonly authoritativeReceiptRef: string | null;
  readonly secureLinkGrantRef: string | null;
  readonly answerabilityState: PatientMoreInfoAnswerabilityState;
  readonly dominantActionRef: string | null;
  readonly reachabilitySummaryProjectionRef: string;
  readonly contactRepairProjectionRef: string | null;
  readonly consentCheckpointProjectionRef: string | null;
  readonly blockerRefs: readonly string[];
  readonly publicSafeSummaryRef: string;
  readonly requestReturnBundleRef: string;
  readonly continuityEvidenceRef: string;
  readonly reasonCodes: readonly string[];
  readonly computedAt: string;
  readonly createdByAuthority: typeof AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME;
}

export interface PatientMoreInfoResponseThreadProjection {
  readonly projectionName: "PatientMoreInfoResponseThreadProjection";
  readonly responseThreadProjectionRef: string;
  readonly moreInfoStatusProjectionRef: string;
  readonly coverageProjectionRef: string;
  readonly requestRef: string;
  readonly requestLineageRef: string;
  readonly activeCycleRef: string;
  readonly promptStackRef: string;
  readonly threadTupleHash: string;
  readonly orderedPromptItems: readonly {
    readonly promptRef: string;
    readonly promptLabelRef: string;
    readonly state: PatientMoreInfoPromptState;
    readonly focusable: boolean;
    readonly requiredEvidenceRefs: readonly string[];
    readonly visibilityTier: PortalVisibilityTier;
    readonly answerReceiptRef: string | null;
  }[];
  readonly currentFocusablePromptRef: string | null;
  readonly answerabilityState: PatientMoreInfoAnswerabilityState;
  readonly visibilityTier: PortalVisibilityTier;
  readonly maskingTier: PortalSummarySafetyTier;
  readonly dominantActionRef: string | null;
  readonly receiptSummaryRef: string | null;
  readonly requestReturnBundleRef: string;
  readonly continuityEvidenceRef: string;
  readonly surfaceState: PortalSurfaceState;
  readonly reasonCodes: readonly string[];
  readonly computedAt: string;
  readonly createdByAuthority: typeof AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME;
}

export interface PatientCallbackStatusProjection {
  readonly projectionName: "PatientCallbackStatusProjection";
  readonly callbackStatusProjectionRef: string;
  readonly coverageProjectionRef: string;
  readonly requestRef: string;
  readonly requestLineageRef: string;
  readonly clusterRef: string;
  readonly callbackCaseRef: string;
  readonly callbackCaseVersionRef: string;
  readonly expectationEnvelopeRef: string;
  readonly outcomeEvidenceBundleRef: string | null;
  readonly resolutionGateRef: string | null;
  readonly patientVisibleState: PatientCallbackVisibleState;
  readonly windowRiskState: PatientCallbackWindowRiskState;
  readonly windowLowerAt: string | null;
  readonly windowUpperAt: string | null;
  readonly stateConfidenceBand: "high" | "medium" | "low";
  readonly monotoneRevision: number;
  readonly routeRepairRequiredState: boolean;
  readonly dominantActionRef: string | null;
  readonly reachabilitySummaryProjectionRef: string;
  readonly contactRepairProjectionRef: string | null;
  readonly requestShellRouteRef: string;
  readonly messageShellRouteRef: string;
  readonly requestReturnBundleRef: string;
  readonly continuityEvidenceRef: string;
  readonly authoritativeBasisRefs: readonly string[];
  readonly computedAt: string;
  readonly createdByAuthority: typeof AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME;
}

export interface RecordArtifactParityWitness {
  readonly projectionName: "RecordArtifactParityWitness";
  readonly recordArtifactParityWitnessRef: string;
  readonly recordRef: string;
  readonly recordVersionRef: string;
  readonly sourceArtifactRef: string;
  readonly structuredSummaryRef: string;
  readonly artifactParityDigestRef: string;
  readonly artifactModeTruthProjectionRef: string;
  readonly recordVisibilityEnvelopeRef: string;
  readonly recordReleaseGateRef: string;
  readonly recordStepUpCheckpointRef: string;
  readonly parityTupleHash: string;
  readonly summaryParityState: PatientRecordSummaryParityState;
  readonly sourceParityState: RecordArtifactParityState;
  readonly recordGateState: RecordArtifactGateState;
  readonly artifactModeState: "permitted" | "demoted" | "blocked";
  readonly sourceAuthorityState: PatientRecordSourceAuthorityState;
  readonly fallbackDispositionRef: string;
  readonly reasonCodes: readonly string[];
  readonly computedAt: string;
  readonly createdByAuthority: typeof AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME;
}

export interface PatientRecordArtifactProjection {
  readonly projectionName: "PatientRecordArtifactProjection";
  readonly recordArtifactProjectionId: string;
  readonly recordRef: string;
  readonly recordVersionRef: string;
  readonly structuredSummaryRef: string;
  readonly structuredSummaryHash: string;
  readonly summaryDerivationPackageRef: string;
  readonly summaryRedactionTransformRef: string;
  readonly sourceArtifactRef: string;
  readonly sourceArtifactBundleRef: string;
  readonly sourceArtifactHash: string;
  readonly sourceRedactionTransformRef: string;
  readonly extractVersionRef: string;
  readonly artifactPresentationContractRef: string;
  readonly artifactSurfaceBindingRef: string;
  readonly artifactSurfaceContextRef: string;
  readonly artifactSurfaceFrameRef: string;
  readonly artifactModeTruthProjectionRef: string;
  readonly binaryArtifactDeliveryRef: string | null;
  readonly artifactByteGrantRef: string | null;
  readonly artifactParityDigestRef: string;
  readonly recordArtifactParityWitnessRef: string;
  readonly artifactTransferSettlementRef: string | null;
  readonly artifactFallbackDispositionRef: string | null;
  readonly recordVisibilityEnvelopeRef: string;
  readonly recordReleaseGateRef: string;
  readonly recordStepUpCheckpointRef: string;
  readonly recordOriginContinuationRef: string;
  readonly recoveryContinuationTokenRef: string;
  readonly presentationMode: PatientRecordPresentationMode;
  readonly downloadEligibilityState: "available" | "gated" | "unavailable";
  readonly embeddedNavigationGrantRef: string | null;
  readonly summaryParityState: PatientRecordSummaryParityState;
  readonly sourceAuthorityState: PatientRecordSourceAuthorityState;
  readonly parityTupleHash: string;
  readonly generatedAt: string;
  readonly createdByAuthority: typeof AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME;
}

export interface PatientResultInterpretationProjection {
  readonly projectionName: "PatientResultInterpretationProjection";
  readonly projectionAlias: "PatientResultInsightProjection";
  readonly resultInterpretationId: string;
  readonly recordRef: string;
  readonly observationRef: string;
  readonly patientSafeTitle: string;
  readonly explanationOrder: readonly [
    "what_this_test_is",
    "latest_result",
    "what_changed",
    "patient_next_step",
    "urgent_help",
    "technical_details",
  ];
  readonly whatThisTestIs: string;
  readonly latestResult: string;
  readonly whatChanged: string;
  readonly patientNextStep: string;
  readonly urgentHelp: string;
  readonly technicalDetails: string;
  readonly displayValue: string;
  readonly displayUnit: string;
  readonly originalValue: string;
  readonly originalUnit: string;
  readonly referenceRangeRef: string;
  readonly comparatorBasisRef: string;
  readonly trendWindowRef: string;
  readonly specimenRef: string;
  readonly specimenDate: string;
  readonly sourceOrganisationRef: string;
  readonly abnormalityBasisRef: string;
  readonly interpretationSummary: string;
  readonly comparisonState: PatientResultComparisonState;
  readonly relatedActionRefs: readonly string[];
  readonly sourceMetadataRefs: readonly string[];
  readonly reasonCodes: readonly string[];
  readonly computedAt: string;
  readonly createdByAuthority: typeof AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME;
}

export type PatientResultInsightProjection = PatientResultInterpretationProjection;

export interface VisualizationFallbackContract {
  readonly projectionName: "VisualizationFallbackContract";
  readonly visualizationFallbackContractId: string;
  readonly surfaceRef: string;
  readonly visualizationRef: string;
  readonly summarySentenceRef: string;
  readonly summaryStateRef: string;
  readonly tableRef: string;
  readonly tableContractRef: string;
  readonly downloadRef: string | null;
  readonly nonColorCueRefs: readonly string[];
  readonly unitLabelRef: string;
  readonly currentSelectionRef: string;
  readonly filterContextRef: string;
  readonly sortStateRef: string;
  readonly comparisonMode: "none" | "primary_vs_prior" | "ranked" | "matrix" | "time_series";
  readonly keyboardModelRef: string;
  readonly emptyVisualizationContractRef: string;
  readonly surfaceStateContractRef: string;
  readonly freshnessAccessibilityContractRef: string;
  readonly parityTupleHash: string;
  readonly parityState: VisualizationParityState;
}

export interface VisualizationTableContract {
  readonly projectionName: "VisualizationTableContract";
  readonly visualizationTableContractId: string;
  readonly surfaceRef: string;
  readonly tableRef: string;
  readonly rowIdentityRefs: readonly string[];
  readonly columnSchemaRef: string;
  readonly sortStateRef: string;
  readonly filterContextRef: string;
  readonly unitLabelRefs: readonly string[];
  readonly selectionModelRef: string;
  readonly currentSelectionRef: string;
  readonly emptyStateContractRef: string;
  readonly renderedAt: string;
}

export interface VisualizationParityProjection {
  readonly projectionName: "VisualizationParityProjection";
  readonly visualizationParityProjectionId: string;
  readonly surfaceRef: string;
  readonly visualizationFallbackContractRef: string;
  readonly visualizationTableContractRef: string;
  readonly summarySentenceRef: string;
  readonly selectionSummaryRef: string;
  readonly filterSummaryRef: string;
  readonly trustSummaryRef: string;
  readonly lastStableTableRef: string;
  readonly parityTupleHash: string;
  readonly parityState: VisualizationParityState;
  readonly visualizationAuthority: VisualizationAuthority;
  readonly reasonCodes: readonly string[];
  readonly generatedAt: string;
}

export interface PatientRecordFollowUpEligibilityProjection {
  readonly projectionName: "PatientRecordFollowUpEligibilityProjection";
  readonly recordFollowUpEligibilityId: string;
  readonly recordRef: string;
  readonly recordVersionRef: string;
  readonly recordActionContextTokenRef: string;
  readonly recordOriginContinuationRef: string;
  readonly requiredVisibilityEnvelopeRef: string;
  readonly requiredReleaseGateRef: string;
  readonly requiredStepUpCheckpointRef: string;
  readonly capabilityRef: string;
  readonly capabilityLeaseExpiresAt: string | null;
  readonly releaseState: PatientRecordReleaseState;
  readonly visibilityTier: PortalVisibilityTier;
  readonly allowedNextActionRefs: readonly string[];
  readonly allowedActionTypes: readonly PatientRecordFollowUpActionType[];
  readonly blockingDependencyRefs: readonly string[];
  readonly eligibilityFenceState: PatientRecordFollowUpFenceState;
  readonly eligibilityState: PatientRecordFollowUpEligibilityState;
  readonly reasonCodes: readonly string[];
  readonly computedAt: string;
  readonly createdByAuthority: typeof AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME;
}

export interface PatientRecordContinuityState {
  readonly projectionName: "PatientRecordContinuityState";
  readonly recordContinuityStateId: string;
  readonly recordRef: string;
  readonly recordVersionRef: string;
  readonly selectedAnchorRef: string;
  readonly expandedChildRef: string | null;
  readonly oneExpandedItemGroupRef: string;
  readonly recordVisibilityEnvelopeRef: string;
  readonly recordStepUpCheckpointRef: string;
  readonly recordReleaseGateRef: string;
  readonly recordOriginContinuationRef: string;
  readonly recoveryContinuationTokenRef: string;
  readonly summarySafetyTier: PortalSummarySafetyTier;
  readonly placeholderContractRef: string;
  readonly continuationState: PatientRecordContinuityPosture;
  readonly computedAt: string;
  readonly createdByAuthority: typeof AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME;
}

export interface PatientRecordSurfaceContext {
  readonly projectionName: "PatientRecordSurfaceContext";
  readonly recordSurfaceContextId: string;
  readonly recordRef: string;
  readonly recordVersionRef: string;
  readonly patientShellConsistencyRef: string;
  readonly recordVisibilityEnvelopeRef: string;
  readonly recordReleaseGateRef: string;
  readonly recordStepUpCheckpointRef: string;
  readonly recordArtifactProjectionRefs: readonly string[];
  readonly artifactParityDigestRefs: readonly string[];
  readonly recordArtifactParityWitnessRefs: readonly string[];
  readonly resultInterpretationProjectionRefs: readonly string[];
  readonly followUpEligibilityProjectionRefs: readonly string[];
  readonly continuityStateRefs: readonly string[];
  readonly visualizationParityProjectionRefs: readonly string[];
  readonly summarySafetyTier: PortalSummarySafetyTier;
  readonly renderMode: PatientRecordRenderMode;
  readonly selectedAnchorRef: string;
  readonly oneExpandedItemGroupRef: string;
  readonly recordOriginContinuationRef: string;
  readonly experienceContinuityEvidenceRef: string;
  readonly overviewGroups: readonly {
    readonly groupRef: PatientRecordCategory;
    readonly label: string;
    readonly recordRefs: readonly string[];
    readonly placeholderRecordRefs: readonly string[];
  }[];
  readonly recordRows: readonly {
    readonly recordRef: string;
    readonly patientSafeTitle: string;
    readonly category: PatientRecordCategory;
    readonly releaseState: PatientRecordReleaseState;
    readonly visibilityTier: PortalVisibilityTier;
    readonly sourceAuthorityState: PatientRecordSourceAuthorityState;
    readonly routeRef: string;
    readonly placeholderVisible: boolean;
  }[];
  readonly surfaceTupleHash: string;
  readonly continuationState: PatientRecordContinuationState;
  readonly surfaceState: PatientRecordSurfaceState;
  readonly reasonCodes: readonly string[];
  readonly computedAt: string;
  readonly createdByAuthority: typeof AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME;
}

export interface PatientCommunicationVisibilityProjection {
  readonly communicationVisibilityProjectionId: string;
  readonly coverageProjectionRef: string;
  readonly clusterOrThreadRef: string;
  readonly patientShellConsistencyRef: string;
  readonly audienceTier: PatientAudienceTier;
  readonly releaseState: "live" | "read_only" | "frozen";
  readonly stepUpRequirementRef: string | null;
  readonly visibilityTier: PortalVisibilityTier;
  readonly summarySafetyTier: PortalSummarySafetyTier;
  readonly minimumNecessaryContractRef: string;
  readonly previewVisibilityContractRef: string;
  readonly visibleSnippetRefs: readonly string[];
  readonly previewMode: CommunicationPreviewMode;
  readonly placeholderContractRef: string;
  readonly hiddenContentReasonRefs: readonly string[];
  readonly redactionPolicyRef: string;
  readonly safeContinuationRef: string | null;
  readonly latestReceiptEnvelopeRef: string | null;
  readonly latestSettlementRef: string | null;
  readonly experienceContinuityEvidenceRef: string;
  readonly computedAt: string;
  readonly createdByAuthority: typeof AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME;
}

export interface ConversationTimelineAnchor {
  readonly anchorRef: string;
  readonly clusterRef: string;
  readonly threadId: string;
  readonly sourceRef: string;
  readonly eventType: ConversationSubthreadType;
  readonly surfaceLabel: string;
  readonly sortAt: string;
  readonly visibilityProjectionRef: string;
  readonly reasonCodes: readonly string[];
}

export interface PatientConversationClusterSummary {
  readonly clusterSummaryRef: string;
  readonly clusterRef: string;
  readonly threadId: string;
  readonly threadTupleHash: string;
  readonly patientSafeSubject: string;
  readonly publicSafeSubject: string;
  readonly previewDigestRef: string;
  readonly visibilityProjectionRef: string;
  readonly callbackStatusProjectionRefs: readonly string[];
  readonly latestAnchorRef: string | null;
  readonly deliveryRiskState: ConversationDeliveryRiskState;
  readonly authoritativeOutcomeState: ConversationAuthoritativeOutcomeState;
  readonly tupleAlignmentState: ConversationTupleAlignmentState;
  readonly dominantNextActionRef: string | null;
}

export interface PatientConversationPreviewDigest {
  readonly projectionName: "PatientConversationPreviewDigest";
  readonly previewDigestRef: string;
  readonly coverageProjectionRef: string;
  readonly clusterRef: string;
  readonly threadId: string;
  readonly threadTupleHash: string;
  readonly receiptGrammarVersionRef: string;
  readonly monotoneRevision: number;
  readonly previewVisibilityContractRef: string;
  readonly summarySafetyTier: PortalSummarySafetyTier;
  readonly previewMode: CommunicationPreviewMode;
  readonly previewLabel: string;
  readonly placeholderVisible: boolean;
  readonly placeholderKind: "none" | "public_safe" | "step_up" | "recovery_only" | "tuple_drift";
  readonly placeholderReasonRefs: readonly string[];
  readonly placeholderNextStepRef: string | null;
  readonly rowState: ConversationTimelineSurfaceState;
  readonly threadMastheadState: ConversationTimelineSurfaceState;
  readonly callbackCardState: ConversationTimelineSurfaceState;
  readonly reminderNoticeState: ConversationTimelineSurfaceState;
  readonly composerLeaseRef: string;
  readonly receiptSummaryRef: string | null;
  readonly dominantNextActionRef: string | null;
  readonly localSuccessFinalityWarningRef: string | null;
  readonly reasonCodes: readonly string[];
  readonly computedAt: string;
  readonly createdByAuthority: typeof AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME;
}

export interface ConversationCallbackCardProjection {
  readonly projectionName: "ConversationCallbackCardProjection";
  readonly callbackCardRef: string;
  readonly coverageProjectionRef: string;
  readonly clusterRef: string;
  readonly threadId: string;
  readonly callbackCaseRef: string;
  readonly callbackStatusProjectionRef: string;
  readonly threadTupleHash: string;
  readonly receiptGrammarVersionRef: string;
  readonly monotoneRevision: number;
  readonly previewVisibilityContractRef: string;
  readonly summarySafetyTier: PortalSummarySafetyTier;
  readonly patientVisibleState: PatientCallbackVisibleState;
  readonly windowRiskState: PatientCallbackWindowRiskState;
  readonly routeRepairRequiredState: boolean;
  readonly dominantActionRef: string | null;
  readonly surfaceState: ConversationTimelineSurfaceState;
  readonly reasonCodes: readonly string[];
  readonly computedAt: string;
  readonly createdByAuthority: typeof AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME;
}

export interface ConversationSubthreadProjection {
  readonly projectionName: "ConversationSubthreadProjection";
  readonly subthreadProjectionRef: string;
  readonly coverageProjectionRef: string;
  readonly clusterRef: string;
  readonly threadId: string;
  readonly subthreadRef: string;
  readonly subthreadType: ConversationSubthreadType;
  readonly threadTupleHash: string;
  readonly receiptGrammarVersionRef: string;
  readonly monotoneRevision: number;
  readonly previewVisibilityContractRef: string;
  readonly summarySafetyTier: PortalSummarySafetyTier;
  readonly communicationEnvelopeRefs: readonly string[];
  readonly timelineAnchorRefs: readonly string[];
  readonly callbackStatusProjectionRefs: readonly string[];
  readonly replyNeededState: ConversationReplyNeededState;
  readonly repairRequiredState: ConversationRepairRequiredState;
  readonly surfaceState: ConversationTimelineSurfaceState;
  readonly reasonCodes: readonly string[];
  readonly computedAt: string;
  readonly createdByAuthority: typeof AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME;
}

export interface PatientReceiptEnvelope {
  readonly projectionName: "PatientReceiptEnvelope";
  readonly receiptEnvelopeRef: string;
  readonly coverageProjectionRef: string;
  readonly clusterRef: string;
  readonly threadId: string;
  readonly sourceEnvelopeRef: string;
  readonly receiptKind: "message" | "callback" | "reminder" | "delivery_failure" | "dispute";
  readonly grammarVersionRef: string;
  readonly localAckState: ConversationLocalAckState;
  readonly transportAcceptanceState: ConversationTransportAcceptanceState;
  readonly deliveryEvidenceState: ConversationDeliveryEvidenceState;
  readonly authoritativeOutcomeState: ConversationAuthoritativeOutcomeState;
  readonly summaryRef: string;
  readonly settledAt: string | null;
  readonly reasonCodes: readonly string[];
  readonly computedAt: string;
  readonly createdByAuthority: typeof AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME;
}

export interface ConversationCommandSettlement {
  readonly projectionName: "ConversationCommandSettlement";
  readonly settlementRef: string;
  readonly coverageProjectionRef: string;
  readonly clusterRef: string;
  readonly threadId: string;
  readonly sourceEnvelopeRef: string;
  readonly localAckState: ConversationLocalAckState;
  readonly transportAcceptanceState: ConversationTransportAcceptanceState;
  readonly deliveryEvidenceState: ConversationDeliveryEvidenceState;
  readonly authoritativeOutcomeState: ConversationAuthoritativeOutcomeState;
  readonly sameShellState: "pending" | "settled" | "recovery_required" | "disputed";
  readonly calmSettledLanguageAllowed: boolean;
  readonly authoritativeBasisRefs: readonly string[];
  readonly reasonCodes: readonly string[];
  readonly computedAt: string;
  readonly createdByAuthority: typeof AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME;
}

export interface PatientComposerLease {
  readonly projectionName: "PatientComposerLease";
  readonly composerLeaseRef: string;
  readonly coverageProjectionRef: string;
  readonly clusterRef: string;
  readonly threadId: string;
  readonly threadTupleHash: string;
  readonly leaseState: PatientComposerLeaseState;
  readonly allowedActionRefs: readonly string[];
  readonly blockedReasonRefs: readonly string[];
  readonly blockedByProjectionRefs: readonly string[];
  readonly localDraftRef: string | null;
  readonly routeRef: string;
  readonly reasonCodes: readonly string[];
  readonly computedAt: string;
  readonly createdByAuthority: typeof AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME;
}

export interface PatientConversationCluster {
  readonly projectionName: "PatientConversationCluster";
  readonly clusterProjectionRef: string;
  readonly coverageProjectionRef: string;
  readonly clusterRef: string;
  readonly threadId: string;
  readonly threadTupleHash: string;
  readonly receiptGrammarVersionRef: string;
  readonly monotoneRevision: number;
  readonly previewVisibilityContractRef: string;
  readonly summarySafetyTier: PortalSummarySafetyTier;
  readonly patientSafeSubject: string;
  readonly publicSafeSubject: string;
  readonly subthreadProjectionRefs: readonly string[];
  readonly timelineAnchorRefs: readonly string[];
  readonly callbackStatusProjectionRefs: readonly string[];
  readonly callbackCardRefs: readonly string[];
  readonly previewDigestRef: string;
  readonly composerLeaseRef: string;
  readonly dominantNextActionRef: string | null;
  readonly tupleAlignmentState: ConversationTupleAlignmentState;
  readonly surfaceState: ConversationTimelineSurfaceState;
  readonly reasonCodes: readonly string[];
  readonly computedAt: string;
  readonly createdByAuthority: typeof AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME;
}

export interface ConversationThreadProjection {
  readonly projectionName: "ConversationThreadProjection";
  readonly threadProjectionRef: string;
  readonly coverageProjectionRef: string;
  readonly clusterProjectionRef: string;
  readonly clusterRef: string;
  readonly threadId: string;
  readonly threadTupleHash: string;
  readonly receiptGrammarVersionRef: string;
  readonly monotoneRevision: number;
  readonly previewVisibilityContractRef: string;
  readonly summarySafetyTier: PortalSummarySafetyTier;
  readonly subthreadProjectionRefs: readonly string[];
  readonly timelineAnchorRefs: readonly string[];
  readonly callbackStatusProjectionRefs: readonly string[];
  readonly callbackCardRefs: readonly string[];
  readonly composerLeaseRef: string;
  readonly previewDigestRef: string;
  readonly receiptEnvelopeRefs: readonly string[];
  readonly settlementRefs: readonly string[];
  readonly selectedAnchorRef: string | null;
  readonly routeRefs: {
    readonly listRouteRef: "/v1/me/messages";
    readonly clusterRouteRef: string;
    readonly threadRouteRef: string;
  };
  readonly tupleAlignmentState: ConversationTupleAlignmentState;
  readonly surfaceState: ConversationTimelineSurfaceState;
  readonly reasonCodes: readonly string[];
  readonly computedAt: string;
  readonly createdByAuthority: typeof AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME;
}

export interface PatientCommunicationsTimelineProjection {
  readonly projectionName: "PatientCommunicationsTimelineProjection";
  readonly communicationsTimelineProjectionRef: string;
  readonly coverageProjectionRef: string;
  readonly patientShellConsistencyRef: string;
  readonly subjectRef: string;
  readonly querySurfaceRef: "GET /v1/me/messages";
  readonly visualMode: "Conversation_Braid_Atlas";
  readonly selectedClusterRef: string | null;
  readonly selectedThreadId: string | null;
  readonly conversationClusterRefs: readonly string[];
  readonly threadProjectionRefs: readonly string[];
  readonly previewDigestRefs: readonly string[];
  readonly visibilityProjectionRefs: readonly string[];
  readonly composerLeaseRefs: readonly string[];
  readonly receiptEnvelopeRefs: readonly string[];
  readonly settlementRefs: readonly string[];
  readonly callbackStatusProjectionRefs: readonly string[];
  readonly callbackCardRefs: readonly string[];
  readonly clusterSummaries: readonly PatientConversationClusterSummary[];
  readonly timelineAnchors: readonly ConversationTimelineAnchor[];
  readonly tupleAlignmentState: ConversationTupleAlignmentState;
  readonly surfaceState: ConversationTimelineSurfaceState;
  readonly reasonCodes: readonly string[];
  readonly computedAt: string;
  readonly createdByAuthority: typeof AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME;
}

export interface PatientRequestDetailProjection {
  readonly requestDetailProjectionId: string;
  readonly coverageProjectionRef: string;
  readonly requestRef: string;
  readonly requestVersionRef: string;
  readonly patientShellConsistencyRef: string;
  readonly summaryProjectionRef: string;
  readonly lineageProjectionRef: string;
  readonly lineageTupleHash: string;
  readonly downstreamOrderingDigestRef: string;
  readonly evidenceSnapshotRef: string | null;
  readonly evidenceSummaryParityRef: string | null;
  readonly timelineProjectionRef: string | null;
  readonly communicationsProjectionRefs: readonly string[];
  readonly downstreamProjectionRefs: readonly string[];
  readonly nextActionProjectionRef: string;
  readonly actionRoutingProjectionRef: string | null;
  readonly actionSettlementProjectionRef: string | null;
  readonly safetyInterruptionProjectionRef: string | null;
  readonly selectedAnchorRef: string;
  readonly selectedChildAnchorRef: string | null;
  readonly selectedChildAnchorTupleHash: string;
  readonly requestReturnBundleRef: string;
  readonly dominantActionRef: string | null;
  readonly placeholderContractRef: string;
  readonly visibleFieldRefs: readonly string[];
  readonly blockedFieldRefs: readonly string[];
  readonly surfaceState: PortalSurfaceState;
  readonly experienceContinuityEvidenceRef: string;
  readonly reasonCodes: readonly string[];
  readonly renderedAt: string;
  readonly createdByAuthority: typeof AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME;
}

export interface PatientActionRecoveryProjection {
  readonly actionRecoveryProjectionId: string;
  readonly coverageProjectionRef: string;
  readonly governingObjectRef: string;
  readonly originRouteFamilyRef: string;
  readonly patientShellConsistencyRef: string;
  readonly patientDegradedModeProjectionRef: string;
  readonly blockedActionRef: string | null;
  readonly patientRecoveryLoopRef: string;
  readonly recoveryReasonCode: PortalRecoveryReason;
  readonly entryChannelRef:
    | "secure_link"
    | "authenticated"
    | "embedded"
    | "deep_link"
    | "child_route";
  readonly lastSafeSummaryRef: string;
  readonly summarySafetyTier: PortalSummarySafetyTier;
  readonly selectedAnchorRef: string;
  readonly requestReturnBundleRef: string | null;
  readonly recoveryContinuationRef: string;
  readonly actionRecoveryEnvelopeRef: string;
  readonly writableEligibilityFenceRef: string;
  readonly nextSafeActionRef: string;
  readonly reentryRouteFamilyRef: string;
  readonly surfaceState: Extract<
    PortalSurfaceState,
    "pending_confirmation" | "repair_required" | "read_only" | "recovery_required"
  >;
  readonly recoveryTupleHash: string;
  readonly experienceContinuityEvidenceRef: string;
  readonly renderedAt: string;
  readonly reasonCodes: readonly string[];
  readonly createdByAuthority: typeof AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME;
}

export interface PatientIdentityHoldProjection {
  readonly identityHoldProjectionId: string;
  readonly coverageProjectionRef: string;
  readonly identityRepairCaseRef: string;
  readonly identityRepairFreezeRef: string;
  readonly identityBindingRef: string | null;
  readonly bindingVersionRef: string | null;
  readonly resultingIdentityBindingRef: string | null;
  readonly identityRepairReleaseSettlementRef: string | null;
  readonly bindingFenceState: "aligned" | "superseded" | "awaiting_correction";
  readonly governingObjectRef: string;
  readonly patientShellConsistencyRef: string;
  readonly patientDegradedModeProjectionRef: string;
  readonly holdReasonRef: string;
  readonly downstreamDispositionSummaryRef: string;
  readonly allowedSummaryTier: PortalSummarySafetyTier;
  readonly suppressedActionRefs: readonly string[];
  readonly writableEligibilityFenceRef: string;
  readonly nextSafeActionRef: string;
  readonly requestReturnBundleRef: string | null;
  readonly resumeContinuationRef: string | null;
  readonly surfaceState:
    | "active"
    | "awaiting_verification"
    | "read_only"
    | "recovery_required"
    | "released";
  readonly renderedAt: string;
  readonly reasonCodes: readonly string[];
  readonly createdByAuthority: typeof AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME;
}

export interface PatientSecureLinkSessionProjection {
  readonly patientSecureLinkSessionId: string;
  readonly coverageProjectionRef: string;
  readonly accessGrantRef: string;
  readonly grantFamily: string;
  readonly grantState: string;
  readonly grantScopeEnvelopeRef: string;
  readonly accessGrantRedemptionRef: string | null;
  readonly grantSupersessionRef: string | null;
  readonly routeIntentBindingRef: string | null;
  readonly postAuthReturnIntentRef: string | null;
  readonly sessionEstablishmentDecisionRef: string | null;
  readonly subjectRef: string | null;
  readonly identityBindingRef: string | null;
  readonly requiredIdentityBindingRef: string | null;
  readonly subjectBindingVersionRef: string | null;
  readonly sessionEpochRef: string | null;
  readonly lineageFenceEpoch: string | null;
  readonly tokenKeyVersionRef: string;
  readonly fenceState:
    | "aligned"
    | "stale_session"
    | "stale_binding"
    | "stale_lineage"
    | "superseded"
    | "expired";
  readonly proofState: "pending" | "session_bound" | "step_up_required" | "invalid";
  readonly audienceTier: PatientAudienceTier;
  readonly resumeContinuationRef: string | null;
  readonly patientActionRecoveryEnvelopeRef: string | null;
  readonly lastSafeSummaryRef: string | null;
  readonly summarySafetyTier: PortalSummarySafetyTier;
  readonly recoveryRouteFamily: string | null;
  readonly expiryAt: string;
  readonly sessionState:
    | "live"
    | "step_up_required"
    | "stale_recoverable"
    | "superseded"
    | "expired";
  readonly createdByAuthority: typeof AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME;
}

export interface PatientPortalProjectionEventRecord {
  readonly eventRef: string;
  readonly eventName:
    | "patient_portal.coverage.computed"
    | "patient_portal.entry.materialized"
    | "patient_portal.home.materialized"
    | "patient_portal.requests_index.materialized"
    | "patient_portal.request_detail.materialized"
    | "patient_portal.more_info.materialized"
    | "patient_portal.more_info_thread.materialized"
    | "patient_portal.callback_status.materialized"
    | "patient_portal.contact_repair.materialized"
    | "patient_portal.messages_index.materialized"
    | "patient_portal.message_cluster.materialized"
    | "patient_portal.message_thread.materialized"
    | "patient_portal.message_callback.materialized"
    | "patient_portal.records_index.materialized"
    | "patient_portal.record_result_detail.materialized"
    | "patient_portal.record_document_detail.materialized"
    | "patient_portal.recovery.materialized"
    | "patient_portal.identity_hold.materialized";
  readonly coverageProjectionRef: string | null;
  readonly occurredAt: string;
  readonly payloadHash: string;
  readonly reasonCodes: readonly string[];
  readonly createdByAuthority: typeof AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME;
}

export interface AuthenticatedPortalProjectionRepositorySnapshots {
  readonly coverage: readonly PatientAudienceCoverageProjection[];
  readonly entries: readonly PatientPortalEntryProjection[];
  readonly home: readonly PatientHomeProjection[];
  readonly requestIndexes: readonly PatientRequestsIndexProjection[];
  readonly downstream: readonly PatientRequestDownstreamProjection[];
  readonly returnBundles: readonly PatientRequestReturnBundle[];
  readonly nextActions: readonly PatientNextActionProjection[];
  readonly actionRoutings: readonly PatientActionRoutingProjection[];
  readonly actionSettlements: readonly PatientActionSettlementProjection[];
  readonly safetyInterruptions: readonly PatientSafetyInterruptionProjection[];
  readonly moreInfoStatuses: readonly PatientMoreInfoStatusProjection[];
  readonly moreInfoThreads: readonly PatientMoreInfoResponseThreadProjection[];
  readonly callbackStatuses: readonly PatientCallbackStatusProjection[];
  readonly reachabilitySummaries: readonly PatientReachabilitySummaryProjection[];
  readonly contactRepairs: readonly PatientContactRepairProjection[];
  readonly consentCheckpoints: readonly PatientConsentCheckpointProjection[];
  readonly communicationsTimelines: readonly PatientCommunicationsTimelineProjection[];
  readonly conversationClusters: readonly PatientConversationCluster[];
  readonly conversationThreads: readonly ConversationThreadProjection[];
  readonly conversationSubthreads: readonly ConversationSubthreadProjection[];
  readonly conversationPreviewDigests: readonly PatientConversationPreviewDigest[];
  readonly conversationCallbackCards: readonly ConversationCallbackCardProjection[];
  readonly patientReceiptEnvelopes: readonly PatientReceiptEnvelope[];
  readonly conversationCommandSettlements: readonly ConversationCommandSettlement[];
  readonly patientComposerLeases: readonly PatientComposerLease[];
  readonly recordSurfaceContexts: readonly PatientRecordSurfaceContext[];
  readonly resultInterpretations: readonly PatientResultInterpretationProjection[];
  readonly recordArtifacts: readonly PatientRecordArtifactProjection[];
  readonly recordArtifactParityWitnesses: readonly RecordArtifactParityWitness[];
  readonly recordFollowUpEligibilities: readonly PatientRecordFollowUpEligibilityProjection[];
  readonly recordContinuityStates: readonly PatientRecordContinuityState[];
  readonly visualizationFallbackContracts: readonly VisualizationFallbackContract[];
  readonly visualizationTableContracts: readonly VisualizationTableContract[];
  readonly visualizationParityProjections: readonly VisualizationParityProjection[];
  readonly requestDetails: readonly PatientRequestDetailProjection[];
  readonly communicationVisibility: readonly PatientCommunicationVisibilityProjection[];
  readonly actionRecovery: readonly PatientActionRecoveryProjection[];
  readonly identityHolds: readonly PatientIdentityHoldProjection[];
  readonly secureLinkSessions: readonly PatientSecureLinkSessionProjection[];
  readonly events: readonly PatientPortalProjectionEventRecord[];
}

export interface AuthenticatedPortalProjectionRepository {
  readonly saveCoverage: (projection: PatientAudienceCoverageProjection) => void;
  readonly saveEntry: (projection: PatientPortalEntryProjection) => void;
  readonly saveHome: (projection: PatientHomeProjection) => void;
  readonly saveRequestsIndex: (projection: PatientRequestsIndexProjection) => void;
  readonly saveRequestDownstream: (projection: PatientRequestDownstreamProjection) => void;
  readonly saveRequestReturnBundle: (projection: PatientRequestReturnBundle) => void;
  readonly saveNextAction: (projection: PatientNextActionProjection) => void;
  readonly saveActionRouting: (projection: PatientActionRoutingProjection) => void;
  readonly saveActionSettlement: (projection: PatientActionSettlementProjection) => void;
  readonly saveSafetyInterruption: (projection: PatientSafetyInterruptionProjection) => void;
  readonly saveMoreInfoStatus: (projection: PatientMoreInfoStatusProjection) => void;
  readonly saveMoreInfoThread: (projection: PatientMoreInfoResponseThreadProjection) => void;
  readonly saveCallbackStatus: (projection: PatientCallbackStatusProjection) => void;
  readonly saveReachabilitySummary: (projection: PatientReachabilitySummaryProjection) => void;
  readonly saveContactRepair: (projection: PatientContactRepairProjection) => void;
  readonly saveConsentCheckpoint: (projection: PatientConsentCheckpointProjection) => void;
  readonly saveCommunicationsTimeline: (
    projection: PatientCommunicationsTimelineProjection,
  ) => void;
  readonly saveConversationCluster: (projection: PatientConversationCluster) => void;
  readonly saveConversationThread: (projection: ConversationThreadProjection) => void;
  readonly saveConversationSubthread: (projection: ConversationSubthreadProjection) => void;
  readonly saveConversationPreviewDigest: (projection: PatientConversationPreviewDigest) => void;
  readonly saveConversationCallbackCard: (projection: ConversationCallbackCardProjection) => void;
  readonly savePatientReceiptEnvelope: (projection: PatientReceiptEnvelope) => void;
  readonly saveConversationCommandSettlement: (projection: ConversationCommandSettlement) => void;
  readonly savePatientComposerLease: (projection: PatientComposerLease) => void;
  readonly saveRecordSurfaceContext: (projection: PatientRecordSurfaceContext) => void;
  readonly saveResultInterpretation: (projection: PatientResultInterpretationProjection) => void;
  readonly saveRecordArtifact: (projection: PatientRecordArtifactProjection) => void;
  readonly saveRecordArtifactParityWitness: (projection: RecordArtifactParityWitness) => void;
  readonly saveRecordFollowUpEligibility: (
    projection: PatientRecordFollowUpEligibilityProjection,
  ) => void;
  readonly saveRecordContinuityState: (projection: PatientRecordContinuityState) => void;
  readonly saveVisualizationFallbackContract: (projection: VisualizationFallbackContract) => void;
  readonly saveVisualizationTableContract: (projection: VisualizationTableContract) => void;
  readonly saveVisualizationParityProjection: (projection: VisualizationParityProjection) => void;
  readonly saveRequestDetail: (projection: PatientRequestDetailProjection) => void;
  readonly saveCommunicationVisibility: (
    projection: PatientCommunicationVisibilityProjection,
  ) => void;
  readonly saveActionRecovery: (projection: PatientActionRecoveryProjection) => void;
  readonly saveIdentityHold: (projection: PatientIdentityHoldProjection) => void;
  readonly saveSecureLinkSession: (projection: PatientSecureLinkSessionProjection) => void;
  readonly appendEvent: (event: PatientPortalProjectionEventRecord) => void;
  readonly snapshots: () => AuthenticatedPortalProjectionRepositorySnapshots;
}

export interface RequestOwnershipPortalPort {
  readonly getOwnershipContext: (input: {
    readonly requestRef?: string | null;
    readonly requestLineageRef?: string | null;
    readonly subjectRef: string;
  }) => Promise<{
    readonly requestLineageRef: string | null;
    readonly subjectBindingVersionRef: string | null;
    readonly sessionEpochRef: string | null;
    readonly routeIntentBindingRef: string | null;
    readonly lineageFenceRef: string | null;
    readonly ownershipPosture:
      | "anonymous_public"
      | "claim_pending"
      | "read_only_authenticated"
      | "owned_authenticated"
      | "recovery_only";
    readonly reasonCodes: readonly string[];
  } | null>;
}

export interface ResolvePortalEntryInput extends BuildPatientAudienceCoverageInput {
  readonly sourceRequests: readonly PortalSourceRequest[];
  readonly selectedRequestRef?: string | null;
  readonly spotlightCandidates?: readonly PatientSpotlightCandidateInput[];
  readonly currentSpotlightDecision?: PatientSpotlightDecisionProjection | null;
  readonly homeTruthState?: PatientHomeTruthState;
  readonly spotlightUseWindowMs?: number;
}

export interface ResolvePortalEntryResult {
  readonly coverage: PatientAudienceCoverageProjection;
  readonly entry: PatientPortalEntryProjection;
  readonly home: PatientHomeProjection;
  readonly recovery: PatientActionRecoveryProjection | null;
  readonly identityHold: PatientIdentityHoldProjection | null;
}

export type ResolvePatientHomeInput = ResolvePortalEntryInput;

export interface ResolvePatientHomeResult {
  readonly coverage: PatientAudienceCoverageProjection;
  readonly home: PatientPortalHomeProjection;
  readonly recovery: PatientActionRecoveryProjection | null;
  readonly identityHold: PatientIdentityHoldProjection | null;
}

export interface ListPatientRequestsInput extends BuildPatientAudienceCoverageInput {
  readonly sourceRequests: readonly PortalSourceRequest[];
  readonly patientRef?: string | null;
  readonly selectedAnchorRef?: string | null;
  readonly selectedFilterRef?: PortalRequestBucket | "all";
  readonly disclosurePosture?: PatientRequestReturnBundle["disclosurePosture"];
  readonly scrollStateRef?: string | null;
}

export interface ListPatientRequestsResult {
  readonly coverage: PatientAudienceCoverageProjection;
  readonly index: PatientRequestsIndexProjection;
  readonly summaries: readonly PatientRequestSummaryProjection[];
  readonly lineages: readonly PatientRequestLineageProjection[];
  readonly returnBundles: readonly PatientRequestReturnBundle[];
  readonly downstream: readonly PatientRequestDownstreamProjection[];
  readonly nextActions: readonly PatientNextActionProjection[];
  readonly safetyInterruptions: readonly PatientSafetyInterruptionProjection[];
  readonly recovery: PatientActionRecoveryProjection | null;
  readonly identityHold: PatientIdentityHoldProjection | null;
}

export interface GetPatientRequestDetailInput extends BuildPatientAudienceCoverageInput {
  readonly sourceRequests: readonly PortalSourceRequest[];
  readonly requestRef: string;
  readonly patientRef?: string | null;
  readonly selectedFilterRef?: PortalRequestBucket | "all";
  readonly disclosurePosture?: PatientRequestReturnBundle["disclosurePosture"];
  readonly scrollStateRef?: string | null;
  readonly actionType?: PatientRequestActionType | null;
  readonly actionSettlementState?: PatientActionSettlementState | null;
}

export interface GetPatientRequestDetailResult {
  readonly coverage: PatientAudienceCoverageProjection;
  readonly summary: PatientRequestSummaryProjection;
  readonly lineage: PatientRequestLineageProjection;
  readonly detail: PatientRequestDetailProjection | null;
  readonly downstream: readonly PatientRequestDownstreamProjection[];
  readonly returnBundle: PatientRequestReturnBundle;
  readonly nextAction: PatientNextActionProjection;
  readonly actionRouting: PatientActionRoutingProjection;
  readonly actionSettlement: PatientActionSettlementProjection;
  readonly safetyInterruption: PatientSafetyInterruptionProjection;
  readonly communicationVisibility: readonly PatientCommunicationVisibilityProjection[];
  readonly recovery: PatientActionRecoveryProjection | null;
  readonly identityHold: PatientIdentityHoldProjection | null;
}

export interface MoreInfoChildRouteResolverInput extends GetPatientRequestDetailInput {
  readonly childRouteRef?: string | null;
}

export interface MoreInfoChildRouteResolverResult {
  readonly coverage: PatientAudienceCoverageProjection;
  readonly requestReturnBundle: PatientRequestReturnBundle;
  readonly moreInfoStatus: PatientMoreInfoStatusProjection;
  readonly responseThread: PatientMoreInfoResponseThreadProjection;
  readonly callbackStatuses: readonly PatientCallbackStatusProjection[];
  readonly reachabilitySummary: PatientReachabilitySummaryProjection;
  readonly contactRepair: PatientContactRepairProjection | null;
  readonly consentCheckpoint: PatientConsentCheckpointProjection | null;
  readonly actionRouting: PatientActionRoutingProjection;
  readonly actionSettlement: PatientActionSettlementProjection;
  readonly recovery: PatientActionRecoveryProjection | null;
  readonly identityHold: PatientIdentityHoldProjection | null;
}

export interface GetPatientMoreInfoInput extends MoreInfoChildRouteResolverInput {}
export interface GetPatientMoreInfoResult extends MoreInfoChildRouteResolverResult {}

export interface GetPatientMoreInfoThreadInput extends MoreInfoChildRouteResolverInput {}
export interface GetPatientMoreInfoThreadResult extends MoreInfoChildRouteResolverResult {}

export interface GetPatientCallbackStatusInput extends GetPatientRequestDetailInput {
  readonly clusterId: string;
  readonly callbackCaseId: string;
}

export interface GetPatientCallbackStatusResult {
  readonly coverage: PatientAudienceCoverageProjection;
  readonly callbackStatus: PatientCallbackStatusProjection;
  readonly reachabilitySummary: PatientReachabilitySummaryProjection;
  readonly contactRepair: PatientContactRepairProjection | null;
  readonly consentCheckpoint: PatientConsentCheckpointProjection | null;
  readonly requestReturnBundle: PatientRequestReturnBundle;
  readonly actionRouting: PatientActionRoutingProjection;
  readonly recovery: PatientActionRecoveryProjection | null;
  readonly identityHold: PatientIdentityHoldProjection | null;
}

export interface GetPatientContactRepairInput extends GetPatientRequestDetailInput {
  readonly repairCaseId: string;
}

export interface GetPatientContactRepairResult {
  readonly coverage: PatientAudienceCoverageProjection;
  readonly contactRepair: PatientContactRepairProjection;
  readonly reachabilitySummary: PatientReachabilitySummaryProjection;
  readonly consentCheckpoint: PatientConsentCheckpointProjection | null;
  readonly requestReturnBundle: PatientRequestReturnBundle;
  readonly actionRouting: PatientActionRoutingProjection;
  readonly recovery: PatientActionRecoveryProjection | null;
  readonly identityHold: PatientIdentityHoldProjection | null;
}

export interface ListPatientMessagesInput extends BuildPatientAudienceCoverageInput {
  readonly sourceClusters: readonly PortalSourceConversationCluster[];
  readonly selectedClusterRef?: string | null;
  readonly selectedThreadId?: string | null;
}

export interface ListPatientMessagesResult {
  readonly coverage: PatientAudienceCoverageProjection;
  readonly timeline: PatientCommunicationsTimelineProjection;
  readonly conversationClusters: readonly PatientConversationCluster[];
  readonly conversationThreads: readonly ConversationThreadProjection[];
  readonly conversationSubthreads: readonly ConversationSubthreadProjection[];
  readonly previewDigests: readonly PatientConversationPreviewDigest[];
  readonly communicationVisibility: readonly PatientCommunicationVisibilityProjection[];
  readonly callbackCards: readonly ConversationCallbackCardProjection[];
  readonly callbackStatuses: readonly PatientCallbackStatusProjection[];
  readonly receiptEnvelopes: readonly PatientReceiptEnvelope[];
  readonly commandSettlements: readonly ConversationCommandSettlement[];
  readonly composerLeases: readonly PatientComposerLease[];
  readonly recovery: PatientActionRecoveryProjection | null;
  readonly identityHold: PatientIdentityHoldProjection | null;
}

export interface GetPatientMessageClusterInput extends ListPatientMessagesInput {
  readonly clusterId: string;
}

export interface GetPatientMessageClusterResult extends ListPatientMessagesResult {
  readonly conversationCluster: PatientConversationCluster;
  readonly conversationThread: ConversationThreadProjection;
}

export interface GetPatientMessageThreadInput extends ListPatientMessagesInput {
  readonly clusterId: string;
  readonly threadId: string;
}

export interface GetPatientMessageThreadResult extends GetPatientMessageClusterResult {}

export interface GetPatientMessageCallbackInput extends ListPatientMessagesInput {
  readonly clusterId: string;
  readonly callbackCaseId: string;
}

export interface GetPatientMessageCallbackResult extends GetPatientMessageClusterResult {
  readonly callbackStatus: PatientCallbackStatusProjection;
  readonly callbackCard: ConversationCallbackCardProjection;
}

export interface ListPatientRecordsInput extends BuildPatientAudienceCoverageInput {
  readonly sourceRecords: readonly PortalSourceRecord[];
  readonly patientRef?: string | null;
  readonly selectedRecordRef?: string | null;
  readonly selectedAnchorRef?: string | null;
  readonly oneExpandedItemGroupRef?: string | null;
  readonly renderMode?: PatientRecordRenderMode;
}

export interface ListPatientRecordsResult {
  readonly coverage: PatientAudienceCoverageProjection;
  readonly surfaceContext: PatientRecordSurfaceContext;
  readonly artifactProjections: readonly PatientRecordArtifactProjection[];
  readonly parityWitnesses: readonly RecordArtifactParityWitness[];
  readonly resultInterpretations: readonly PatientResultInterpretationProjection[];
  readonly followUpEligibilities: readonly PatientRecordFollowUpEligibilityProjection[];
  readonly continuityStates: readonly PatientRecordContinuityState[];
  readonly visualizationFallbackContracts: readonly VisualizationFallbackContract[];
  readonly visualizationTableContracts: readonly VisualizationTableContract[];
  readonly visualizationParityProjections: readonly VisualizationParityProjection[];
  readonly recovery: PatientActionRecoveryProjection | null;
  readonly identityHold: PatientIdentityHoldProjection | null;
}

export interface GetPatientRecordResultDetailInput extends ListPatientRecordsInput {
  readonly resultId: string;
}

export interface GetPatientRecordResultDetailResult extends ListPatientRecordsResult {
  readonly resultInterpretation: PatientResultInterpretationProjection;
  readonly resultInsight: PatientResultInsightProjection;
  readonly recordArtifact: PatientRecordArtifactProjection;
  readonly parityWitness: RecordArtifactParityWitness;
  readonly visualizationParity: VisualizationParityProjection | null;
}

export interface GetPatientRecordDocumentDetailInput extends ListPatientRecordsInput {
  readonly documentId: string;
}

export interface GetPatientRecordDocumentDetailResult extends ListPatientRecordsResult {
  readonly recordArtifact: PatientRecordArtifactProjection;
  readonly parityWitness: RecordArtifactParityWitness;
}

export interface AuthenticatedPortalProjectionService {
  readonly buildPatientAudienceCoverageProjection: (
    input: BuildPatientAudienceCoverageInput,
  ) => Promise<PatientAudienceCoverageProjection>;
  readonly resolvePortalEntry: (
    input: ResolvePortalEntryInput,
  ) => Promise<ResolvePortalEntryResult>;
  readonly getPatientHome: (input: ResolvePatientHomeInput) => Promise<ResolvePatientHomeResult>;
  readonly listPatientRequests: (
    input: ListPatientRequestsInput,
  ) => Promise<ListPatientRequestsResult>;
  readonly getPatientRequestDetail: (
    input: GetPatientRequestDetailInput,
  ) => Promise<GetPatientRequestDetailResult>;
  readonly getPatientMoreInfo: (
    input: GetPatientMoreInfoInput,
  ) => Promise<GetPatientMoreInfoResult>;
  readonly getPatientMoreInfoThread: (
    input: GetPatientMoreInfoThreadInput,
  ) => Promise<GetPatientMoreInfoThreadResult>;
  readonly getPatientCallbackStatus: (
    input: GetPatientCallbackStatusInput,
  ) => Promise<GetPatientCallbackStatusResult>;
  readonly getPatientContactRepair: (
    input: GetPatientContactRepairInput,
  ) => Promise<GetPatientContactRepairResult>;
  readonly listPatientMessages: (
    input: ListPatientMessagesInput,
  ) => Promise<ListPatientMessagesResult>;
  readonly getPatientMessageCluster: (
    input: GetPatientMessageClusterInput,
  ) => Promise<GetPatientMessageClusterResult>;
  readonly getPatientMessageThread: (
    input: GetPatientMessageThreadInput,
  ) => Promise<GetPatientMessageThreadResult>;
  readonly getPatientMessageCallback: (
    input: GetPatientMessageCallbackInput,
  ) => Promise<GetPatientMessageCallbackResult>;
  readonly listPatientRecords: (
    input: ListPatientRecordsInput,
  ) => Promise<ListPatientRecordsResult>;
  readonly getPatientRecordResultDetail: (
    input: GetPatientRecordResultDetailInput,
  ) => Promise<GetPatientRecordResultDetailResult>;
  readonly getPatientRecordDocumentDetail: (
    input: GetPatientRecordDocumentDetailInput,
  ) => Promise<GetPatientRecordDocumentDetailResult>;
}

export interface AuthenticatedPortalProjectionApplication {
  readonly authenticatedPortalProjectionService: AuthenticatedPortalProjectionService;
  readonly repository: AuthenticatedPortalProjectionRepository;
  readonly requestOwnership: RequestOwnershipPortalPort;
  readonly migrationPlanRef: (typeof authenticatedPortalProjectionMigrationPlanRefs)[number];
  readonly migrationPlanRefs: typeof authenticatedPortalProjectionMigrationPlanRefs;
  readonly persistenceTables: typeof authenticatedPortalProjectionPersistenceTables;
  readonly parallelInterfaceGaps: typeof authenticatedPortalProjectionParallelInterfaceGaps;
  readonly policyVersion: typeof AUTHENTICATED_PORTAL_PROJECTION_POLICY_VERSION;
}

export function createInMemoryAuthenticatedPortalProjectionRepository(): AuthenticatedPortalProjectionRepository {
  const coverage = new Map<string, PatientAudienceCoverageProjection>();
  const entries = new Map<string, PatientPortalEntryProjection>();
  const home = new Map<string, PatientHomeProjection>();
  const requestIndexes = new Map<string, PatientRequestsIndexProjection>();
  const downstream = new Map<string, PatientRequestDownstreamProjection>();
  const returnBundles = new Map<string, PatientRequestReturnBundle>();
  const nextActions = new Map<string, PatientNextActionProjection>();
  const actionRoutings = new Map<string, PatientActionRoutingProjection>();
  const actionSettlements = new Map<string, PatientActionSettlementProjection>();
  const safetyInterruptions = new Map<string, PatientSafetyInterruptionProjection>();
  const moreInfoStatuses = new Map<string, PatientMoreInfoStatusProjection>();
  const moreInfoThreads = new Map<string, PatientMoreInfoResponseThreadProjection>();
  const callbackStatuses = new Map<string, PatientCallbackStatusProjection>();
  const reachabilitySummaries = new Map<string, PatientReachabilitySummaryProjection>();
  const contactRepairs = new Map<string, PatientContactRepairProjection>();
  const consentCheckpoints = new Map<string, PatientConsentCheckpointProjection>();
  const communicationsTimelines = new Map<string, PatientCommunicationsTimelineProjection>();
  const conversationClusters = new Map<string, PatientConversationCluster>();
  const conversationThreads = new Map<string, ConversationThreadProjection>();
  const conversationSubthreads = new Map<string, ConversationSubthreadProjection>();
  const conversationPreviewDigests = new Map<string, PatientConversationPreviewDigest>();
  const conversationCallbackCards = new Map<string, ConversationCallbackCardProjection>();
  const patientReceiptEnvelopes = new Map<string, PatientReceiptEnvelope>();
  const conversationCommandSettlements = new Map<string, ConversationCommandSettlement>();
  const patientComposerLeases = new Map<string, PatientComposerLease>();
  const recordSurfaceContexts = new Map<string, PatientRecordSurfaceContext>();
  const resultInterpretations = new Map<string, PatientResultInterpretationProjection>();
  const recordArtifacts = new Map<string, PatientRecordArtifactProjection>();
  const recordArtifactParityWitnesses = new Map<string, RecordArtifactParityWitness>();
  const recordFollowUpEligibilities = new Map<string, PatientRecordFollowUpEligibilityProjection>();
  const recordContinuityStates = new Map<string, PatientRecordContinuityState>();
  const visualizationFallbackContracts = new Map<string, VisualizationFallbackContract>();
  const visualizationTableContracts = new Map<string, VisualizationTableContract>();
  const visualizationParityProjections = new Map<string, VisualizationParityProjection>();
  const requestDetails = new Map<string, PatientRequestDetailProjection>();
  const communicationVisibility = new Map<string, PatientCommunicationVisibilityProjection>();
  const actionRecovery = new Map<string, PatientActionRecoveryProjection>();
  const identityHolds = new Map<string, PatientIdentityHoldProjection>();
  const secureLinkSessions = new Map<string, PatientSecureLinkSessionProjection>();
  const events: PatientPortalProjectionEventRecord[] = [];

  return {
    saveCoverage(projection) {
      coverage.set(projection.patientAudienceCoverageProjectionId, projection);
    },
    saveEntry(projection) {
      entries.set(projection.patientPortalEntryProjectionId, projection);
    },
    saveHome(projection) {
      home.set(projection.patientHomeProjectionId, projection);
    },
    saveRequestsIndex(projection) {
      requestIndexes.set(projection.patientRequestsIndexProjectionId, projection);
    },
    saveRequestDownstream(projection) {
      downstream.set(projection.downstreamProjectionRef, projection);
    },
    saveRequestReturnBundle(projection) {
      returnBundles.set(projection.requestReturnBundleRef, projection);
    },
    saveNextAction(projection) {
      nextActions.set(projection.nextActionProjectionRef, projection);
    },
    saveActionRouting(projection) {
      actionRoutings.set(projection.actionRoutingProjectionRef, projection);
    },
    saveActionSettlement(projection) {
      actionSettlements.set(projection.actionSettlementProjectionRef, projection);
    },
    saveSafetyInterruption(projection) {
      safetyInterruptions.set(projection.safetyInterruptionProjectionRef, projection);
    },
    saveMoreInfoStatus(projection) {
      moreInfoStatuses.set(projection.moreInfoStatusProjectionRef, projection);
    },
    saveMoreInfoThread(projection) {
      moreInfoThreads.set(projection.responseThreadProjectionRef, projection);
    },
    saveCallbackStatus(projection) {
      callbackStatuses.set(projection.callbackStatusProjectionRef, projection);
    },
    saveReachabilitySummary(projection) {
      reachabilitySummaries.set(projection.reachabilitySummaryProjectionRef, projection);
    },
    saveContactRepair(projection) {
      contactRepairs.set(projection.contactRepairProjectionRef, projection);
    },
    saveConsentCheckpoint(projection) {
      consentCheckpoints.set(projection.consentCheckpointProjectionRef, projection);
    },
    saveCommunicationsTimeline(projection) {
      communicationsTimelines.set(projection.communicationsTimelineProjectionRef, projection);
    },
    saveConversationCluster(projection) {
      conversationClusters.set(projection.clusterProjectionRef, projection);
    },
    saveConversationThread(projection) {
      conversationThreads.set(projection.threadProjectionRef, projection);
    },
    saveConversationSubthread(projection) {
      conversationSubthreads.set(projection.subthreadProjectionRef, projection);
    },
    saveConversationPreviewDigest(projection) {
      conversationPreviewDigests.set(projection.previewDigestRef, projection);
    },
    saveConversationCallbackCard(projection) {
      conversationCallbackCards.set(projection.callbackCardRef, projection);
    },
    savePatientReceiptEnvelope(projection) {
      patientReceiptEnvelopes.set(projection.receiptEnvelopeRef, projection);
    },
    saveConversationCommandSettlement(projection) {
      conversationCommandSettlements.set(projection.settlementRef, projection);
    },
    savePatientComposerLease(projection) {
      patientComposerLeases.set(projection.composerLeaseRef, projection);
    },
    saveRecordSurfaceContext(projection) {
      recordSurfaceContexts.set(projection.recordSurfaceContextId, projection);
    },
    saveResultInterpretation(projection) {
      resultInterpretations.set(projection.resultInterpretationId, projection);
    },
    saveRecordArtifact(projection) {
      recordArtifacts.set(projection.recordArtifactProjectionId, projection);
    },
    saveRecordArtifactParityWitness(projection) {
      recordArtifactParityWitnesses.set(projection.recordArtifactParityWitnessRef, projection);
    },
    saveRecordFollowUpEligibility(projection) {
      recordFollowUpEligibilities.set(projection.recordFollowUpEligibilityId, projection);
    },
    saveRecordContinuityState(projection) {
      recordContinuityStates.set(projection.recordContinuityStateId, projection);
    },
    saveVisualizationFallbackContract(projection) {
      visualizationFallbackContracts.set(projection.visualizationFallbackContractId, projection);
    },
    saveVisualizationTableContract(projection) {
      visualizationTableContracts.set(projection.visualizationTableContractId, projection);
    },
    saveVisualizationParityProjection(projection) {
      visualizationParityProjections.set(projection.visualizationParityProjectionId, projection);
    },
    saveRequestDetail(projection) {
      requestDetails.set(projection.requestDetailProjectionId, projection);
    },
    saveCommunicationVisibility(projection) {
      communicationVisibility.set(projection.communicationVisibilityProjectionId, projection);
    },
    saveActionRecovery(projection) {
      actionRecovery.set(projection.actionRecoveryProjectionId, projection);
    },
    saveIdentityHold(projection) {
      identityHolds.set(projection.identityHoldProjectionId, projection);
    },
    saveSecureLinkSession(projection) {
      secureLinkSessions.set(projection.patientSecureLinkSessionId, projection);
    },
    appendEvent(event) {
      events.push(event);
    },
    snapshots() {
      return {
        coverage: [...coverage.values()],
        entries: [...entries.values()],
        home: [...home.values()],
        requestIndexes: [...requestIndexes.values()],
        downstream: [...downstream.values()],
        returnBundles: [...returnBundles.values()],
        nextActions: [...nextActions.values()],
        actionRoutings: [...actionRoutings.values()],
        actionSettlements: [...actionSettlements.values()],
        safetyInterruptions: [...safetyInterruptions.values()],
        moreInfoStatuses: [...moreInfoStatuses.values()],
        moreInfoThreads: [...moreInfoThreads.values()],
        callbackStatuses: [...callbackStatuses.values()],
        reachabilitySummaries: [...reachabilitySummaries.values()],
        contactRepairs: [...contactRepairs.values()],
        consentCheckpoints: [...consentCheckpoints.values()],
        communicationsTimelines: [...communicationsTimelines.values()],
        conversationClusters: [...conversationClusters.values()],
        conversationThreads: [...conversationThreads.values()],
        conversationSubthreads: [...conversationSubthreads.values()],
        conversationPreviewDigests: [...conversationPreviewDigests.values()],
        conversationCallbackCards: [...conversationCallbackCards.values()],
        patientReceiptEnvelopes: [...patientReceiptEnvelopes.values()],
        conversationCommandSettlements: [...conversationCommandSettlements.values()],
        patientComposerLeases: [...patientComposerLeases.values()],
        recordSurfaceContexts: [...recordSurfaceContexts.values()],
        resultInterpretations: [...resultInterpretations.values()],
        recordArtifacts: [...recordArtifacts.values()],
        recordArtifactParityWitnesses: [...recordArtifactParityWitnesses.values()],
        recordFollowUpEligibilities: [...recordFollowUpEligibilities.values()],
        recordContinuityStates: [...recordContinuityStates.values()],
        visualizationFallbackContracts: [...visualizationFallbackContracts.values()],
        visualizationTableContracts: [...visualizationTableContracts.values()],
        visualizationParityProjections: [...visualizationParityProjections.values()],
        requestDetails: [...requestDetails.values()],
        communicationVisibility: [...communicationVisibility.values()],
        actionRecovery: [...actionRecovery.values()],
        identityHolds: [...identityHolds.values()],
        secureLinkSessions: [...secureLinkSessions.values()],
        events: [...events],
      };
    },
  };
}

export function createAuthenticatedPortalProjectionApplication(options?: {
  readonly repository?: AuthenticatedPortalProjectionRepository;
  readonly requestOwnership?: RequestOwnershipPortalPort;
}): AuthenticatedPortalProjectionApplication {
  const repository = options?.repository ?? createInMemoryAuthenticatedPortalProjectionRepository();
  const requestOwnership = options?.requestOwnership ?? createDefaultRequestOwnershipPortalPort();
  const authenticatedPortalProjectionService = createAuthenticatedPortalProjectionService({
    repository,
    requestOwnership,
  });
  return {
    authenticatedPortalProjectionService,
    repository,
    requestOwnership,
    migrationPlanRef: authenticatedPortalProjectionMigrationPlanRefs[0],
    migrationPlanRefs: authenticatedPortalProjectionMigrationPlanRefs,
    persistenceTables: authenticatedPortalProjectionPersistenceTables,
    parallelInterfaceGaps: authenticatedPortalProjectionParallelInterfaceGaps,
    policyVersion: AUTHENTICATED_PORTAL_PROJECTION_POLICY_VERSION,
  };
}

export function createAuthenticatedPortalProjectionService(options: {
  readonly repository: AuthenticatedPortalProjectionRepository;
  readonly requestOwnership: RequestOwnershipPortalPort;
}): AuthenticatedPortalProjectionService {
  const repository = options.repository;
  const requestOwnership = options.requestOwnership;

  async function buildPatientAudienceCoverageProjection(
    input: BuildPatientAudienceCoverageInput,
  ): Promise<PatientAudienceCoverageProjection> {
    const observedAt = input.observedAt ?? new Date().toISOString();
    const drift = detectRecoveryReason(input);
    const identityHold =
      input.trustPosture === "repair_hold" || Boolean(input.identityRepairCaseRef);
    const commandPending = input.commandConsistencyState === "pending";
    const publicOnly = input.audienceTier === "patient_public";
    const authenticated =
      input.audienceTier === "patient_authenticated" ||
      input.audienceTier === "embedded_authenticated";
    const recoveryOnly = drift !== "none" || input.purposeOfUse === "secure_link_recovery";
    const surfaceState: PortalSurfaceState = identityHold
      ? "identity_hold"
      : recoveryOnly
        ? "recovery_required"
        : commandPending
          ? "pending_confirmation"
          : authenticated && input.trustPosture === "trusted"
            ? "ready"
            : authenticated
              ? "summary_only"
              : "read_only";
    const communicationPreviewMode: CommunicationPreviewMode =
      identityHold || recoveryOnly
        ? "suppressed_recovery_only"
        : publicOnly
          ? "public_safe_summary"
          : input.trustPosture === "step_up_required"
            ? "step_up_required"
            : "authenticated_summary";
    const timelineVisibilityMode: TimelineVisibilityMode =
      identityHold || recoveryOnly
        ? "summary_only"
        : publicOnly
          ? "awareness_only"
          : input.trustPosture === "trusted"
            ? "full_patient_thread"
            : "message_safe";
    const artifactVisibilityMode: ArtifactVisibilityMode =
      identityHold || recoveryOnly
        ? "placeholder_only"
        : publicOnly
          ? "summary_only"
          : input.trustPosture === "trusted"
            ? "governed_inline"
            : "placeholder_only";
    const mutationAuthority: MutationAuthority =
      identityHold || recoveryOnly || publicOnly
        ? "none"
        : input.trustPosture === "trusted" && !commandPending
          ? "route_bound_mutation"
          : "step_up_only";
    const reasonCodes = mergeReasonCodes(
      [
        "PORTAL_185_COVERAGE_FIRST",
        "PORTAL_185_NO_CONTROLLER_LOCAL_TRIMMING",
        publicOnly ? "PORTAL_185_PUBLIC_MINIMAL_ONLY" : "PORTAL_185_AUTHENTICATED_SUMMARY_ALLOWED",
      ],
      [
        ...(surfaceState === "ready" ? ["PORTAL_185_DETAIL_FULL_ALLOWED"] : []),
        ...(surfaceState === "summary_only" || surfaceState === "read_only"
          ? ["PORTAL_185_DETAIL_SUMMARY_ONLY"]
          : []),
        ...(mutationAuthority === "none" ? ["PORTAL_185_ACTION_DISABLED"] : []),
        ...(commandPending ? ["PORTAL_185_COMMAND_PENDING_CONSISTENCY"] : []),
        ...(identityHold ? ["PORTAL_185_IDENTITY_HOLD"] : []),
        ...reasonCodesForRecovery(drift),
      ],
    );

    const projection: PatientAudienceCoverageProjection = {
      patientAudienceCoverageProjectionId: stableRef(
        "patient_audience_coverage",
        `${input.subjectRef}:${input.audienceTier}:${input.purposeOfUse}:${input.routeFamilyRef}:${drift}:${input.trustPosture}:${input.commandConsistencyState ?? "consistent"}`,
      ),
      schemaVersion: AUTHENTICATED_PORTAL_PROJECTION_SCHEMA_VERSION,
      policyVersion: AUTHENTICATED_PORTAL_PROJECTION_POLICY_VERSION,
      subjectScopeRef: input.subjectRef,
      audienceTier: input.audienceTier,
      purposeOfUse: input.purposeOfUse,
      projectionFamilyRefs: projectionFamiliesFor(surfaceState),
      routeFamilyRefs: [input.routeFamilyRef],
      communicationPreviewMode,
      timelineVisibilityMode,
      artifactVisibilityMode,
      mutationAuthority,
      minimumNecessaryContractRef: `minimum_necessary:${input.audienceTier}:${communicationPreviewMode}`,
      requiredVisibilityPolicyRef: "patient_portal_visibility_policy_185",
      requiredCoverageRowRefs: input.coverageRowRefs ?? [
        `coverage:${input.audienceTier}:${input.routeFamilyRef}`,
      ],
      requiredSectionContractRefs: input.sectionContractRefs ?? [
        "PatientPortalEntryProjection",
        "PatientRequestsIndexProjection",
        "PatientRequestDetailProjection",
      ],
      requiredPreviewContractRefs: input.previewContractRefs ?? [
        "PatientCommunicationVisibilityProjection",
      ],
      requiredArtifactContractRefs: input.artifactContractRefs ?? [
        "PatientDocumentPlaceholderContract",
      ],
      requiredRedactionPolicyRefs: input.redactionPolicyRefs ?? [
        "patient_portal_redaction_policy_185",
      ],
      requiredPlaceholderContractRef: "patient_portal_placeholder_contract_185",
      requiredRouteIntentRefs: compactStrings([input.routeIntentBindingRef]),
      requiredEmbeddedSessionRef:
        input.audienceTier === "embedded_authenticated" ? input.sessionEpochRef : null,
      surfaceState,
      recoveryReason: identityHold ? "identity_repair_hold" : drift,
      reasonCodes,
      computedAt: observedAt,
      createdByAuthority: AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME,
    };
    repository.saveCoverage(projection);
    repository.appendEvent(
      createEvent(
        "patient_portal.coverage.computed",
        projection.patientAudienceCoverageProjectionId,
        projection,
      ),
    );
    return projection;
  }

  async function resolveMoreInfoChildRoute(
    input: MoreInfoChildRouteResolverInput,
  ): Promise<MoreInfoChildRouteResolverResult> {
    const request = input.sourceRequests.find(
      (candidate) => candidate.requestRef === input.requestRef,
    );
    if (!request) {
      throw new Error(`more-info projection source not found: ${input.requestRef}`);
    }
    await requestOwnership.getOwnershipContext({
      requestRef: request.requestRef,
      requestLineageRef: request.requestLineageRef,
      subjectRef: input.subjectRef,
    });
    const requestScopedInput = tightenRouteTupleToRequest(input, request);
    const coverage = await buildPatientAudienceCoverageProjection(requestScopedInput);
    const observedAt = input.observedAt ?? coverage.computedAt;
    const consistency = buildShellConsistency(requestScopedInput, coverage, [request], observedAt);
    const summary = buildSummaryProjection(request, coverage, observedAt);
    const lineage = buildLineageProjection(request, summary, coverage, observedAt);
    const requestReturnBundle = buildRequestReturnBundle({
      input,
      request,
      coverage,
      lineage,
      observedAt,
      disclosurePosture: "child_route",
    });
    const downstream = buildDownstreamProjections({
      request,
      coverage,
      consistency,
      returnBundle: requestReturnBundle,
      observedAt,
    });
    const safetyInterruption = buildSafetyInterruptionProjection({
      request,
      coverage,
      returnBundle: requestReturnBundle,
      observedAt,
    });
    const family = buildMoreInfoCallbackRepairFamily({
      input: requestScopedInput,
      request,
      coverage,
      requestReturnBundle,
      observedAt,
    });
    const childActionType = actionTypeForChildRouteFamily(family);
    const nextAction = buildNextActionProjection({
      input: { actionType: childActionType },
      request,
      coverage,
      returnBundle: requestReturnBundle,
      downstream,
      safetyInterruption,
      observedAt,
    });
    const actionRouting = buildActionRoutingProjection({
      input: { routeFamilyRef: input.routeFamilyRef },
      request,
      coverage,
      consistency,
      returnBundle: requestReturnBundle,
      nextAction,
      safetyInterruption,
      observedAt,
    });
    const actionSettlement = buildActionSettlementProjection({
      input,
      request,
      coverage,
      routing: actionRouting,
      returnBundle: requestReturnBundle,
      observedAt,
    });
    const recovery = buildRecoveryIfNeeded({
      input: requestScopedInput,
      coverage,
      consistency,
      request,
      observedAt,
    });
    const hold = buildHoldIfNeeded({ coverage, consistency, request, observedAt });

    repository.saveRequestReturnBundle(requestReturnBundle);
    repository.saveReachabilitySummary(family.reachabilitySummary);
    repository.saveMoreInfoStatus(family.moreInfoStatus);
    repository.saveMoreInfoThread(family.responseThread);
    for (const callbackStatus of family.callbackStatuses) {
      repository.saveCallbackStatus(callbackStatus);
    }
    if (family.contactRepair) repository.saveContactRepair(family.contactRepair);
    if (family.consentCheckpoint) repository.saveConsentCheckpoint(family.consentCheckpoint);
    repository.saveActionRouting(actionRouting);
    repository.saveActionSettlement(actionSettlement);
    if (recovery) repository.saveActionRecovery(recovery);
    if (hold) repository.saveIdentityHold(hold);
    repository.appendEvent(
      createEvent(
        "patient_portal.more_info.materialized",
        coverage.patientAudienceCoverageProjectionId,
        family.moreInfoStatus,
      ),
    );
    repository.appendEvent(
      createEvent(
        "patient_portal.more_info_thread.materialized",
        coverage.patientAudienceCoverageProjectionId,
        family.responseThread,
      ),
    );
    return {
      coverage,
      requestReturnBundle,
      moreInfoStatus: family.moreInfoStatus,
      responseThread: family.responseThread,
      callbackStatuses: family.callbackStatuses,
      reachabilitySummary: family.reachabilitySummary,
      contactRepair: family.contactRepair,
      consentCheckpoint: family.consentCheckpoint,
      actionRouting,
      actionSettlement,
      recovery,
      identityHold: hold,
    };
  }

  async function listPatientMessagesInternal(
    input: ListPatientMessagesInput,
  ): Promise<ListPatientMessagesResult> {
    const coverage = await buildPatientAudienceCoverageProjection(input);
    const observedAt = input.observedAt ?? coverage.computedAt;
    const consistency = buildConversationShellConsistency(
      input,
      coverage,
      input.sourceClusters,
      observedAt,
    );
    const assembled = assembleCommunicationsTimelineProjection({
      input,
      coverage,
      consistency,
      clusters: input.sourceClusters,
      observedAt,
    });
    const recovery = buildRecoveryIfNeeded({
      input,
      coverage,
      consistency,
      request: null,
      observedAt,
    });
    const hold = buildHoldIfNeeded({ coverage, consistency, request: null, observedAt });
    saveCommunicationsTimelineProjectionFamily(repository, assembled);
    if (recovery) repository.saveActionRecovery(recovery);
    if (hold) repository.saveIdentityHold(hold);
    repository.appendEvent(
      createEvent(
        "patient_portal.messages_index.materialized",
        coverage.patientAudienceCoverageProjectionId,
        assembled.timeline,
      ),
    );
    return {
      coverage,
      ...assembled,
      recovery,
      identityHold: hold,
    };
  }

  async function listPatientRecordsInternal(
    input: ListPatientRecordsInput,
  ): Promise<ListPatientRecordsResult> {
    const coverage = await buildPatientAudienceCoverageProjection(input);
    const observedAt = input.observedAt ?? coverage.computedAt;
    const consistency = buildRecordShellConsistency(
      input,
      coverage,
      input.sourceRecords,
      observedAt,
    );
    const selectedRecord =
      (input.selectedRecordRef
        ? input.sourceRecords.find((record) => record.recordRef === input.selectedRecordRef)
        : input.sourceRecords[0]) ?? null;
    const assembled = assembleHealthRecordProjection({
      input,
      coverage,
      consistency,
      records: input.sourceRecords,
      selectedRecord,
      renderMode: input.renderMode ?? "overview",
      observedAt,
    });
    const recovery = buildRecoveryIfNeeded({
      input,
      coverage,
      consistency,
      request: null,
      observedAt,
    });
    const hold = buildHoldIfNeeded({ coverage, consistency, request: null, observedAt });
    saveHealthRecordProjectionFamily(repository, assembled);
    if (recovery) repository.saveActionRecovery(recovery);
    if (hold) repository.saveIdentityHold(hold);
    repository.appendEvent(
      createEvent(
        "patient_portal.records_index.materialized",
        coverage.patientAudienceCoverageProjectionId,
        assembled.surfaceContext,
      ),
    );
    return {
      coverage,
      ...assembled,
      recovery,
      identityHold: hold,
    };
  }

  return {
    buildPatientAudienceCoverageProjection,

    async resolvePortalEntry(input) {
      const coverage = await buildPatientAudienceCoverageProjection(input);
      const observedAt = input.observedAt ?? coverage.computedAt;
      const consistency = buildShellConsistency(input, coverage, input.sourceRequests, observedAt);
      const selectedRequest = input.selectedRequestRef
        ? (input.sourceRequests.find(
            (request) => request.requestRef === input.selectedRequestRef,
          ) ?? null)
        : (input.sourceRequests[0] ?? null);
      const recovery = buildRecoveryIfNeeded({
        input,
        coverage,
        consistency,
        request: selectedRequest,
        observedAt,
      });
      const hold = buildHoldIfNeeded({
        coverage,
        consistency,
        request: selectedRequest,
        observedAt,
      });
      const entry: PatientPortalEntryProjection = {
        patientPortalEntryProjectionId: stableRef(
          "patient_portal_entry",
          `${coverage.patientAudienceCoverageProjectionId}:${selectedRequest?.requestRef ?? "home"}`,
        ),
        coverageProjectionRef: coverage.patientAudienceCoverageProjectionId,
        patientShellConsistencyRef: consistency.patientShellConsistencyRef,
        subjectRef: input.subjectRef,
        entryState: entryStateFor(coverage, selectedRequest),
        audienceTier: coverage.audienceTier,
        trustPosture: input.trustPosture,
        freshnessState: freshnessFor(coverage, input),
        routeTupleHash: routeTupleHash(input),
        currentStateTitle: stateTitleFor(coverage, selectedRequest),
        currentRouteFamilyRef: input.routeFamilyRef,
        safeLandingRouteRef: safeLandingRouteFor(coverage, selectedRequest),
        nextProjectionRefs: compactStrings([
          coverage.patientAudienceCoverageProjectionId,
          recovery?.actionRecoveryProjectionId,
          hold?.identityHoldProjectionId,
        ]),
        reasonCodes: coverage.reasonCodes,
        renderedAt: observedAt,
        createdByAuthority: AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME,
      };
      const home = buildHomeProjection(
        input,
        coverage,
        consistency,
        input.sourceRequests,
        observedAt,
      );
      repository.saveEntry(entry);
      repository.saveHome(home);
      if (recovery) repository.saveActionRecovery(recovery);
      if (hold) repository.saveIdentityHold(hold);
      repository.appendEvent(
        createEvent(
          "patient_portal.entry.materialized",
          coverage.patientAudienceCoverageProjectionId,
          entry,
        ),
      );
      repository.appendEvent(
        createEvent(
          "patient_portal.home.materialized",
          coverage.patientAudienceCoverageProjectionId,
          home,
        ),
      );
      return { coverage, entry, home, recovery, identityHold: hold };
    },

    async getPatientHome(input) {
      const coverage = await buildPatientAudienceCoverageProjection(input);
      const observedAt = input.observedAt ?? coverage.computedAt;
      const consistency = buildShellConsistency(input, coverage, input.sourceRequests, observedAt);
      const selectedRequest = input.selectedRequestRef
        ? (input.sourceRequests.find(
            (request) => request.requestRef === input.selectedRequestRef,
          ) ?? null)
        : (input.sourceRequests[0] ?? null);
      const home = buildHomeProjection(
        input,
        coverage,
        consistency,
        input.sourceRequests,
        observedAt,
      );
      const recovery = buildRecoveryIfNeeded({
        input,
        coverage,
        consistency,
        request: selectedRequest,
        observedAt,
      });
      const hold = buildHoldIfNeeded({
        coverage,
        consistency,
        request: selectedRequest,
        observedAt,
      });
      repository.saveHome(home);
      if (recovery) repository.saveActionRecovery(recovery);
      if (hold) repository.saveIdentityHold(hold);
      repository.appendEvent(
        createEvent(
          "patient_portal.home.materialized",
          coverage.patientAudienceCoverageProjectionId,
          home,
        ),
      );
      return { coverage, home, recovery, identityHold: hold };
    },

    async listPatientRequests(input) {
      const coverage = await buildPatientAudienceCoverageProjection(input);
      const observedAt = input.observedAt ?? coverage.computedAt;
      const consistency = buildShellConsistency(input, coverage, input.sourceRequests, observedAt);
      const visibleRequests = input.sourceRequests.filter((request) =>
        isRequestVisibleUnderCoverage(coverage, request, input.subjectRef),
      );
      const summaries = visibleRequests.map((request) =>
        buildSummaryProjection(request, coverage, observedAt),
      );
      const lineages = visibleRequests.map((request, index) =>
        buildLineageProjection(request, summaries[index], coverage, observedAt),
      );
      const returnBundles = visibleRequests.map((request, index) =>
        buildRequestReturnBundle({
          input,
          request,
          coverage,
          lineage: lineages[index]!,
          observedAt,
          disclosurePosture: input.disclosurePosture ?? "row_summary",
        }),
      );
      const downstream = visibleRequests.flatMap((request, index) =>
        buildDownstreamProjections({
          request,
          coverage,
          consistency,
          returnBundle: returnBundles[index]!,
          observedAt,
        }),
      );
      const safetyInterruptions = visibleRequests.map((request, index) =>
        buildSafetyInterruptionProjection({
          request,
          coverage,
          returnBundle: returnBundles[index]!,
          observedAt,
        }),
      );
      const nextActions = visibleRequests.map((request, index) =>
        buildNextActionProjection({
          input: {},
          request,
          coverage,
          returnBundle: returnBundles[index]!,
          downstream: downstream.filter((child) => child.requestRef === request.requestRef),
          safetyInterruption: safetyInterruptions[index]!,
          observedAt,
        }),
      );
      const selectedAnchorRef = input.selectedAnchorRef ?? visibleRequests[0]?.requestRef ?? null;
      const selectedReturnBundle =
        returnBundles.find((bundle) => bundle.requestRef === selectedAnchorRef) ??
        returnBundles[0] ??
        null;
      const indexProjection: PatientRequestsIndexProjection = {
        patientRequestsIndexProjectionId: stableRef(
          "patient_requests_index",
          `${coverage.patientAudienceCoverageProjectionId}:${visibleRequests.map((request) => request.requestRef).join("|")}`,
        ),
        coverageProjectionRef: coverage.patientAudienceCoverageProjectionId,
        patientRef: input.patientRef ?? null,
        defaultBucket: "needs_attention",
        visibleBuckets: ["needs_attention", "in_progress", "complete"],
        activeFilterSetRef: "status-care-type-updated",
        selectedAnchorRef,
        selectedAnchorTupleHash:
          selectedReturnBundle?.selectedAnchorTupleHash ??
          (selectedAnchorRef ? digest(selectedAnchorRef) : null),
        selectedRequestReturnBundleRef: selectedReturnBundle?.requestReturnBundleRef ?? null,
        dominantActionRef: firstDefined(nextActions.map((action) => action.dominantActionRef)),
        trustCueRef: visibleRequests[0]?.trustCueRef ?? "trust_cue_none",
        requestSummaryRefs: summaries.map((summary) => summary.summaryProjectionRef),
        requestLineageRefs: lineages.map((lineage) => lineage.patientRequestLineageProjectionId),
        bucketMembershipDigestRef: stableRef(
          "bucket_membership",
          visibleRequests.map((request) => `${request.bucket}:${request.requestRef}`).join("|"),
        ),
        lineageOrderingDigestRef: stableRef(
          "lineage_ordering",
          lineages.map((lineage) => lineage.lineageTupleHash).join("|"),
        ),
        surfaceState: coverage.surfaceState,
        reasonCodes: mergeReasonCodes(coverage.reasonCodes, [
          "PORTAL_185_LIST_DETAIL_COVERAGE_PARITY",
        ]),
        computedAt: observedAt,
        createdByAuthority: AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME,
      };
      const recovery = buildRecoveryIfNeeded({
        input,
        coverage,
        consistency,
        request: visibleRequests[0] ?? null,
        observedAt,
      });
      const hold = buildHoldIfNeeded({
        coverage,
        consistency,
        request: visibleRequests[0] ?? null,
        observedAt,
      });
      repository.saveRequestsIndex(indexProjection);
      for (const projection of returnBundles) {
        repository.saveRequestReturnBundle(projection);
      }
      for (const projection of downstream) {
        repository.saveRequestDownstream(projection);
      }
      for (const projection of safetyInterruptions) {
        repository.saveSafetyInterruption(projection);
      }
      for (const projection of nextActions) {
        repository.saveNextAction(projection);
      }
      if (recovery) repository.saveActionRecovery(recovery);
      if (hold) repository.saveIdentityHold(hold);
      repository.appendEvent(
        createEvent(
          "patient_portal.requests_index.materialized",
          coverage.patientAudienceCoverageProjectionId,
          indexProjection,
        ),
      );
      return {
        coverage,
        index: indexProjection,
        summaries,
        lineages,
        returnBundles,
        downstream,
        nextActions,
        safetyInterruptions,
        recovery,
        identityHold: hold,
      };
    },

    async getPatientRequestDetail(input) {
      const request = input.sourceRequests.find(
        (candidate) => candidate.requestRef === input.requestRef,
      );
      if (!request) {
        throw new Error(`request projection source not found: ${input.requestRef}`);
      }
      await requestOwnership.getOwnershipContext({
        requestRef: request.requestRef,
        requestLineageRef: request.requestLineageRef,
        subjectRef: input.subjectRef,
      });
      const requestScopedInput = tightenRouteTupleToRequest(input, request);
      const coverage = await buildPatientAudienceCoverageProjection(requestScopedInput);
      const observedAt = input.observedAt ?? coverage.computedAt;
      const consistency = buildShellConsistency(
        requestScopedInput,
        coverage,
        [request],
        observedAt,
      );
      const summary = buildSummaryProjection(request, coverage, observedAt);
      const lineage = buildLineageProjection(request, summary, coverage, observedAt);
      const returnBundle = buildRequestReturnBundle({
        input,
        request,
        coverage,
        lineage,
        observedAt,
        disclosurePosture: input.disclosurePosture ?? "detail_header",
      });
      const downstream = buildDownstreamProjections({
        request,
        coverage,
        consistency,
        returnBundle,
        observedAt,
      });
      const safetyInterruption = buildSafetyInterruptionProjection({
        request,
        coverage,
        returnBundle,
        observedAt,
      });
      const nextAction = buildNextActionProjection({
        input,
        request,
        coverage,
        returnBundle,
        downstream,
        safetyInterruption,
        observedAt,
      });
      const actionRouting = buildActionRoutingProjection({
        input,
        request,
        coverage,
        consistency,
        returnBundle,
        nextAction,
        safetyInterruption,
        observedAt,
      });
      const actionSettlement = buildActionSettlementProjection({
        input,
        request,
        coverage,
        routing: actionRouting,
        returnBundle,
        observedAt,
      });
      const recovery = buildRecoveryIfNeeded({
        input: requestScopedInput,
        coverage,
        consistency,
        request,
        observedAt,
      });
      const hold = buildHoldIfNeeded({ coverage, consistency, request, observedAt });
      const communicationVisibility = request.communicationClusterRefs.map((clusterOrThreadRef) =>
        buildCommunicationVisibility(clusterOrThreadRef, coverage, consistency, observedAt),
      );
      const detail =
        recovery || hold
          ? null
          : buildDetailProjection({
              request,
              coverage,
              consistency,
              summary,
              lineage,
              downstream,
              returnBundle,
              nextAction,
              actionRouting,
              actionSettlement,
              safetyInterruption,
              communicationVisibility,
              observedAt,
            });
      if (detail) repository.saveRequestDetail(detail);
      repository.saveRequestReturnBundle(returnBundle);
      for (const projection of downstream) {
        repository.saveRequestDownstream(projection);
      }
      repository.saveSafetyInterruption(safetyInterruption);
      repository.saveNextAction(nextAction);
      repository.saveActionRouting(actionRouting);
      repository.saveActionSettlement(actionSettlement);
      for (const communication of communicationVisibility) {
        repository.saveCommunicationVisibility(communication);
      }
      if (recovery) repository.saveActionRecovery(recovery);
      if (hold) repository.saveIdentityHold(hold);
      repository.appendEvent(
        createEvent(
          "patient_portal.request_detail.materialized",
          coverage.patientAudienceCoverageProjectionId,
          detail ?? recovery ?? hold,
        ),
      );
      return {
        coverage,
        summary,
        lineage,
        detail,
        downstream,
        returnBundle,
        nextAction,
        actionRouting,
        actionSettlement,
        safetyInterruption,
        communicationVisibility,
        recovery,
        identityHold: hold,
      };
    },

    async listPatientMessages(input) {
      return listPatientMessagesInternal(input);
    },

    async getPatientMessageCluster(input) {
      const result = await listPatientMessagesInternal({
        ...input,
        selectedClusterRef: input.clusterId,
      });
      const conversationCluster =
        result.conversationClusters.find((cluster) => cluster.clusterRef === input.clusterId) ??
        null;
      const conversationThread =
        result.conversationThreads.find((thread) => thread.clusterRef === input.clusterId) ?? null;
      if (!conversationCluster || !conversationThread) {
        throw new Error(`message cluster projection source not found: ${input.clusterId}`);
      }
      repository.appendEvent(
        createEvent(
          "patient_portal.message_cluster.materialized",
          result.coverage.patientAudienceCoverageProjectionId,
          conversationCluster,
        ),
      );
      return {
        ...result,
        conversationCluster,
        conversationThread,
      };
    },

    async getPatientMessageThread(input) {
      const result = await listPatientMessagesInternal({
        ...input,
        selectedClusterRef: input.clusterId,
        selectedThreadId: input.threadId,
      });
      const conversationCluster =
        result.conversationClusters.find((cluster) => cluster.clusterRef === input.clusterId) ??
        null;
      const conversationThread =
        result.conversationThreads.find(
          (thread) => thread.clusterRef === input.clusterId && thread.threadId === input.threadId,
        ) ?? null;
      if (!conversationCluster || !conversationThread) {
        throw new Error(`message thread projection source not found: ${input.threadId}`);
      }
      repository.appendEvent(
        createEvent(
          "patient_portal.message_thread.materialized",
          result.coverage.patientAudienceCoverageProjectionId,
          conversationThread,
        ),
      );
      return {
        ...result,
        conversationCluster,
        conversationThread,
      };
    },

    async getPatientMessageCallback(input) {
      const result = await listPatientMessagesInternal({
        ...input,
        selectedClusterRef: input.clusterId,
      });
      const conversationCluster =
        result.conversationClusters.find((cluster) => cluster.clusterRef === input.clusterId) ??
        null;
      const conversationThread =
        result.conversationThreads.find((thread) => thread.clusterRef === input.clusterId) ?? null;
      const callbackStatus =
        result.callbackStatuses.find(
          (status) =>
            status.clusterRef === input.clusterId &&
            status.callbackCaseRef === input.callbackCaseId,
        ) ?? null;
      const callbackCard =
        result.callbackCards.find(
          (card) =>
            card.clusterRef === input.clusterId && card.callbackCaseRef === input.callbackCaseId,
        ) ?? null;
      if (!conversationCluster || !conversationThread || !callbackStatus || !callbackCard) {
        throw new Error(`message callback projection source not found: ${input.callbackCaseId}`);
      }
      repository.appendEvent(
        createEvent(
          "patient_portal.message_callback.materialized",
          result.coverage.patientAudienceCoverageProjectionId,
          callbackCard,
        ),
      );
      return {
        ...result,
        conversationCluster,
        conversationThread,
        callbackStatus,
        callbackCard,
      };
    },

    async listPatientRecords(input) {
      return listPatientRecordsInternal(input);
    },

    async getPatientRecordResultDetail(input) {
      const record = input.sourceRecords.find((candidate) => candidate.resultId === input.resultId);
      if (!record) {
        throw new Error(`record result projection source not found: ${input.resultId}`);
      }
      const result = await listPatientRecordsInternal(
        tightenRouteTupleToRecord(
          {
            ...input,
            selectedRecordRef: record.recordRef,
            selectedAnchorRef: input.selectedAnchorRef ?? record.recordRef,
            renderMode: "detail",
          },
          record,
        ),
      );
      const resultInterpretation =
        result.resultInterpretations.find(
          (projection) => projection.recordRef === record.recordRef,
        ) ?? null;
      const recordArtifact =
        result.artifactProjections.find(
          (projection) => projection.recordRef === record.recordRef,
        ) ?? null;
      const parityWitness =
        result.parityWitnesses.find((projection) => projection.recordRef === record.recordRef) ??
        null;
      if (!resultInterpretation || !recordArtifact || !parityWitness) {
        throw new Error(`record result projection incomplete: ${input.resultId}`);
      }
      const visualizationParity =
        result.visualizationParityProjections.find(
          (projection) => projection.surfaceRef === record.recordRef,
        ) ?? null;
      repository.appendEvent(
        createEvent(
          "patient_portal.record_result_detail.materialized",
          result.coverage.patientAudienceCoverageProjectionId,
          resultInterpretation,
        ),
      );
      return {
        ...result,
        resultInterpretation,
        resultInsight: adaptPatientResultInsightProjection(resultInterpretation),
        recordArtifact,
        parityWitness,
        visualizationParity,
      };
    },

    async getPatientRecordDocumentDetail(input) {
      const record = input.sourceRecords.find(
        (candidate) => candidate.documentId === input.documentId,
      );
      if (!record) {
        throw new Error(`record document projection source not found: ${input.documentId}`);
      }
      const result = await listPatientRecordsInternal(
        tightenRouteTupleToRecord(
          {
            ...input,
            selectedRecordRef: record.recordRef,
            selectedAnchorRef: input.selectedAnchorRef ?? record.recordRef,
            renderMode: "document_summary",
          },
          record,
        ),
      );
      const recordArtifact =
        result.artifactProjections.find(
          (projection) => projection.recordRef === record.recordRef,
        ) ?? null;
      const parityWitness =
        result.parityWitnesses.find((projection) => projection.recordRef === record.recordRef) ??
        null;
      if (!recordArtifact || !parityWitness) {
        throw new Error(`record document projection incomplete: ${input.documentId}`);
      }
      repository.appendEvent(
        createEvent(
          "patient_portal.record_document_detail.materialized",
          result.coverage.patientAudienceCoverageProjectionId,
          recordArtifact,
        ),
      );
      return {
        ...result,
        recordArtifact,
        parityWitness,
      };
    },

    async getPatientMoreInfo(input) {
      return resolveMoreInfoChildRoute({
        ...input,
        actionType: input.actionType ?? "respond_more_info",
      });
    },

    async getPatientMoreInfoThread(input) {
      return resolveMoreInfoChildRoute({
        ...input,
        actionType: input.actionType ?? "respond_more_info",
      });
    },

    async getPatientCallbackStatus(input) {
      const result = await resolveMoreInfoChildRoute({
        ...input,
        actionType: input.actionType ?? "callback_response",
      });
      const callbackStatus =
        result.callbackStatuses.find(
          (status) =>
            status.callbackCaseRef === input.callbackCaseId &&
            status.clusterRef === input.clusterId,
        ) ?? result.callbackStatuses[0];
      if (!callbackStatus) {
        throw new Error(`callback status projection source not found: ${input.callbackCaseId}`);
      }
      repository.appendEvent(
        createEvent(
          "patient_portal.callback_status.materialized",
          result.coverage.patientAudienceCoverageProjectionId,
          callbackStatus,
        ),
      );
      return {
        coverage: result.coverage,
        callbackStatus,
        reachabilitySummary: result.reachabilitySummary,
        contactRepair: result.contactRepair,
        consentCheckpoint: result.consentCheckpoint,
        requestReturnBundle: result.requestReturnBundle,
        actionRouting: result.actionRouting,
        recovery: result.recovery,
        identityHold: result.identityHold,
      };
    },

    async getPatientContactRepair(input) {
      const result = await resolveMoreInfoChildRoute({
        ...input,
        actionType: input.actionType ?? "contact_route_repair",
      });
      if (!result.contactRepair || result.contactRepair.repairCaseRef !== input.repairCaseId) {
        throw new Error(`contact repair projection source not found: ${input.repairCaseId}`);
      }
      repository.appendEvent(
        createEvent(
          "patient_portal.contact_repair.materialized",
          result.coverage.patientAudienceCoverageProjectionId,
          result.contactRepair,
        ),
      );
      return {
        coverage: result.coverage,
        contactRepair: result.contactRepair,
        reachabilitySummary: result.reachabilitySummary,
        consentCheckpoint: result.consentCheckpoint,
        requestReturnBundle: result.requestReturnBundle,
        actionRouting: result.actionRouting,
        recovery: result.recovery,
        identityHold: result.identityHold,
      };
    },
  };
}

export function createDefaultRequestOwnershipPortalPort(): RequestOwnershipPortalPort {
  return {
    async getOwnershipContext(input) {
      return {
        requestLineageRef: input.requestLineageRef ?? null,
        subjectBindingVersionRef: null,
        sessionEpochRef: null,
        routeIntentBindingRef: null,
        lineageFenceRef: null,
        ownershipPosture: "read_only_authenticated",
        reasonCodes: ["PORTAL_185_COVERAGE_FIRST"],
      };
    },
  };
}

function tightenRouteTupleToRequest<T extends GetPatientRequestDetailInput>(
  input: T,
  request: PortalSourceRequest,
): T {
  return {
    ...input,
    expectedSessionEpochRef: input.expectedSessionEpochRef ?? request.requiredSessionEpochRef,
    expectedSubjectBindingVersionRef:
      input.expectedSubjectBindingVersionRef ?? request.requiredSubjectBindingVersionRef,
    expectedRouteIntentBindingRef:
      input.expectedRouteIntentBindingRef ?? request.routeIntentBindingRef,
    expectedLineageFenceRef: input.expectedLineageFenceRef ?? request.lineageFenceRef,
    identityRepairCaseRef: input.identityRepairCaseRef ?? request.identityRepairCaseRef ?? null,
    commandConsistencyState: input.commandConsistencyState ?? request.commandConsistencyState,
  };
}

function tightenRouteTupleToRecord<T extends ListPatientRecordsInput>(
  input: T,
  record: PortalSourceRecord,
): T {
  return {
    ...input,
    expectedSessionEpochRef: input.expectedSessionEpochRef ?? record.requiredSessionEpochRef,
    expectedSubjectBindingVersionRef:
      input.expectedSubjectBindingVersionRef ?? record.requiredSubjectBindingVersionRef,
    expectedRouteIntentBindingRef:
      input.expectedRouteIntentBindingRef ?? record.routeIntentBindingRef,
    expectedLineageFenceRef: input.expectedLineageFenceRef ?? record.lineageFenceRef,
    identityRepairCaseRef: input.identityRepairCaseRef ?? record.identityRepairCaseRef ?? null,
    commandConsistencyState: input.commandConsistencyState ?? record.commandConsistencyState,
  };
}

function buildRecordShellConsistency(
  input: BuildPatientAudienceCoverageInput,
  coverage: PatientAudienceCoverageProjection,
  records: readonly PortalSourceRecord[],
  observedAt: string,
): PatientShellConsistencyProjection {
  const staleAt = new Date(Date.parse(observedAt) + 120_000).toISOString();
  return {
    patientShellConsistencyRef: stableRef(
      "patient_record_shell_consistency",
      `${coverage.patientAudienceCoverageProjectionId}:${records.map((record) => record.recordVersionRef).join("|")}`,
    ),
    bundleVersion: AUTHENTICATED_PORTAL_PROJECTION_SCHEMA_VERSION,
    audienceTier: coverage.audienceTier,
    computedAt: observedAt,
    staleAt,
    governingObjectRefs: records.map((record) => record.recordRef),
    entityVersionRefs: records.map((record) => record.recordVersionRef),
    causalConsistencyState:
      coverage.surfaceState === "recovery_required" || coverage.surfaceState === "identity_hold"
        ? "blocked"
        : (input.commandConsistencyState ?? "consistent"),
    releaseApprovalFreezeRef: null,
    channelReleaseFreezeState: coverage.surfaceState === "ready" ? "open" : "read_only",
    requiredAssuranceSliceTrustRefs: ["phase2_identity_control_plane", "phase2_record_parity"],
    releaseRecoveryDispositionRef:
      coverage.surfaceState === "recovery_required" ? "record_recovery_same_shell_213" : null,
  };
}

export interface HealthRecordProjectionAssemblerInput {
  readonly input: ListPatientRecordsInput;
  readonly coverage: PatientAudienceCoverageProjection;
  readonly consistency: PatientShellConsistencyProjection;
  readonly records: readonly PortalSourceRecord[];
  readonly selectedRecord: PortalSourceRecord | null;
  readonly renderMode: PatientRecordRenderMode;
  readonly observedAt: string;
}

export interface HealthRecordProjectionAssemblerResult {
  readonly surfaceContext: PatientRecordSurfaceContext;
  readonly artifactProjections: readonly PatientRecordArtifactProjection[];
  readonly parityWitnesses: readonly RecordArtifactParityWitness[];
  readonly resultInterpretations: readonly PatientResultInterpretationProjection[];
  readonly followUpEligibilities: readonly PatientRecordFollowUpEligibilityProjection[];
  readonly continuityStates: readonly PatientRecordContinuityState[];
  readonly visualizationFallbackContracts: readonly VisualizationFallbackContract[];
  readonly visualizationTableContracts: readonly VisualizationTableContract[];
  readonly visualizationParityProjections: readonly VisualizationParityProjection[];
}

export function assembleHealthRecordProjection(
  assemblerInput: HealthRecordProjectionAssemblerInput,
): HealthRecordProjectionAssemblerResult {
  const witnesses: RecordArtifactParityWitness[] = [];
  const artifactProjections: PatientRecordArtifactProjection[] = [];
  const resultInterpretations: PatientResultInterpretationProjection[] = [];
  const followUpEligibilities: PatientRecordFollowUpEligibilityProjection[] = [];
  const continuityStates: PatientRecordContinuityState[] = [];
  const visualizationFallbackContracts: VisualizationFallbackContract[] = [];
  const visualizationTableContracts: VisualizationTableContract[] = [];
  const visualizationParityProjections: VisualizationParityProjection[] = [];

  for (const record of assemblerInput.records) {
    const firstArtifact = record.artifacts[0] ?? defaultRecordArtifactFor(record);
    for (const artifact of record.artifacts.length > 0 ? record.artifacts : [firstArtifact]) {
      const witness = buildRecordArtifactParityWitness({
        record,
        artifact,
        coverage: assemblerInput.coverage,
        observedAt: assemblerInput.observedAt,
      });
      witnesses.push(witness);
      artifactProjections.push(
        buildPatientRecordArtifactProjection({
          record,
          artifact,
          witness,
          observedAt: assemblerInput.observedAt,
        }),
      );
    }
    if (record.resultId) {
      resultInterpretations.push(
        buildPatientResultInterpretationProjection({
          record,
          witness: witnesses.find((witness) => witness.recordRef === record.recordRef)!,
          observedAt: assemblerInput.observedAt,
        }),
      );
    }
    followUpEligibilities.push(
      buildRecordFollowUpEligibilityProjection({
        input: assemblerInput.input,
        record,
        coverage: assemblerInput.coverage,
        witness: witnesses.find((witness) => witness.recordRef === record.recordRef)!,
        observedAt: assemblerInput.observedAt,
      }),
    );
    continuityStates.push(
      buildRecordContinuityState({
        input: assemblerInput.input,
        record,
        coverage: assemblerInput.coverage,
        selected: assemblerInput.selectedRecord?.recordRef === record.recordRef,
        observedAt: assemblerInput.observedAt,
      }),
    );
    const visualization = buildVisualizationParityBridge({
      record,
      witness: witnesses.find((witness) => witness.recordRef === record.recordRef)!,
      observedAt: assemblerInput.observedAt,
    });
    if (visualization) {
      visualizationFallbackContracts.push(visualization.fallback);
      visualizationTableContracts.push(visualization.table);
      visualizationParityProjections.push(visualization.parity);
    }
  }

  const surfaceContext = buildPatientRecordSurfaceContext({
    input: assemblerInput.input,
    coverage: assemblerInput.coverage,
    consistency: assemblerInput.consistency,
    records: assemblerInput.records,
    selectedRecord: assemblerInput.selectedRecord,
    renderMode: assemblerInput.renderMode,
    artifactProjections,
    witnesses,
    resultInterpretations,
    followUpEligibilities,
    continuityStates,
    visualizationParityProjections,
    observedAt: assemblerInput.observedAt,
  });

  return {
    surfaceContext,
    artifactProjections,
    parityWitnesses: witnesses,
    resultInterpretations,
    followUpEligibilities,
    continuityStates,
    visualizationFallbackContracts,
    visualizationTableContracts,
    visualizationParityProjections,
  };
}

function saveHealthRecordProjectionFamily(
  repository: AuthenticatedPortalProjectionRepository,
  assembled: HealthRecordProjectionAssemblerResult,
): void {
  repository.saveRecordSurfaceContext(assembled.surfaceContext);
  for (const projection of assembled.parityWitnesses) {
    repository.saveRecordArtifactParityWitness(projection);
  }
  for (const projection of assembled.artifactProjections) {
    repository.saveRecordArtifact(projection);
  }
  for (const projection of assembled.resultInterpretations) {
    repository.saveResultInterpretation(projection);
  }
  for (const projection of assembled.followUpEligibilities) {
    repository.saveRecordFollowUpEligibility(projection);
  }
  for (const projection of assembled.continuityStates) {
    repository.saveRecordContinuityState(projection);
  }
  for (const projection of assembled.visualizationFallbackContracts) {
    repository.saveVisualizationFallbackContract(projection);
  }
  for (const projection of assembled.visualizationTableContracts) {
    repository.saveVisualizationTableContract(projection);
  }
  for (const projection of assembled.visualizationParityProjections) {
    repository.saveVisualizationParityProjection(projection);
  }
}

function buildRecordArtifactParityWitness(input: {
  readonly record: PortalSourceRecord;
  readonly artifact: PortalSourceRecordArtifact;
  readonly coverage: PatientAudienceCoverageProjection;
  readonly observedAt: string;
}): RecordArtifactParityWitness {
  const recordGateState = recordGateStateFor(input.record, input.coverage);
  const modePermitted =
    recordGateState === "visible" &&
    input.artifact.currentSafeMode !== "placeholder_only" &&
    input.artifact.currentSafeMode !== "recovery_only";
  const summaryParityState = input.artifact.summaryParityState ?? "verified";
  const exactTuple =
    summaryParityState === "verified" &&
    input.artifact.structuredSummaryHash.length > 0 &&
    input.artifact.sourceArtifactHash.length > 0 &&
    modePermitted;
  const sourceParityState: RecordArtifactParityState =
    recordGateState !== "visible"
      ? "blocked"
      : exactTuple
        ? "verified"
        : summaryParityState === "stale" || summaryParityState === "extraction_failed"
          ? "stale"
          : "provisional";
  const sourceAuthorityState: PatientRecordSourceAuthorityState = exactTuple
    ? "summary_verified"
    : recordGateState !== "visible"
      ? input.coverage.surfaceState === "recovery_required"
        ? "recovery_only"
        : "placeholder_only"
      : summaryParityState === "source_only" || summaryParityState === "download_only"
        ? "source_only"
        : "summary_provisional";
  const reasonCodes = mergeReasonCodes(
    ["PORTAL_213_HEALTH_RECORD_SURFACE_CONTEXT"],
    [
      exactTuple
        ? "PORTAL_213_RECORD_ARTIFACT_PARITY_VERIFIED"
        : "PORTAL_213_RECORD_ARTIFACT_PARITY_DEGRADED",
      ...reasonCodesForRecordGate(recordGateState),
    ],
  );
  return {
    projectionName: "RecordArtifactParityWitness",
    recordArtifactParityWitnessRef: stableRef(
      "record_artifact_parity_witness",
      `${input.record.recordRef}:${input.record.recordVersionRef}:${input.artifact.sourceArtifactRef}:${recordGateState}:${sourceAuthorityState}`,
    ),
    recordRef: input.record.recordRef,
    recordVersionRef: input.record.recordVersionRef,
    sourceArtifactRef: input.artifact.sourceArtifactRef,
    structuredSummaryRef: input.artifact.structuredSummaryRef,
    artifactParityDigestRef: input.artifact.artifactParityDigestRef,
    artifactModeTruthProjectionRef: input.artifact.artifactModeTruthProjectionRef,
    recordVisibilityEnvelopeRef: input.record.recordVisibilityEnvelopeRef,
    recordReleaseGateRef: input.record.recordReleaseGateRef,
    recordStepUpCheckpointRef: input.record.recordStepUpCheckpointRef,
    parityTupleHash: digest({
      recordRef: input.record.recordRef,
      recordVersionRef: input.record.recordVersionRef,
      sourceArtifactRef: input.artifact.sourceArtifactRef,
      sourceArtifactHash: input.artifact.sourceArtifactHash,
      structuredSummaryRef: input.artifact.structuredSummaryRef,
      structuredSummaryHash: input.artifact.structuredSummaryHash,
      recordVisibilityEnvelopeRef: input.record.recordVisibilityEnvelopeRef,
      recordReleaseGateRef: input.record.recordReleaseGateRef,
      recordStepUpCheckpointRef: input.record.recordStepUpCheckpointRef,
      currentSafeMode: input.artifact.currentSafeMode,
      recordGateState,
    }),
    summaryParityState,
    sourceParityState,
    recordGateState,
    artifactModeState: modePermitted
      ? "permitted"
      : recordGateState === "visible"
        ? "demoted"
        : "blocked",
    sourceAuthorityState,
    fallbackDispositionRef:
      sourceAuthorityState === "summary_verified"
        ? "record_artifact_fallback:none"
        : `record_artifact_fallback:${sourceAuthorityState}`,
    reasonCodes,
    computedAt: input.observedAt,
    createdByAuthority: AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME,
  };
}

function buildPatientRecordArtifactProjection(input: {
  readonly record: PortalSourceRecord;
  readonly artifact: PortalSourceRecordArtifact;
  readonly witness: RecordArtifactParityWitness;
  readonly observedAt: string;
}): PatientRecordArtifactProjection {
  const presentationMode: PatientRecordPresentationMode =
    input.witness.recordGateState !== "visible"
      ? "placeholder_only"
      : input.witness.sourceAuthorityState === "summary_verified"
        ? input.artifact.currentSafeMode
        : input.witness.sourceAuthorityState === "source_only"
          ? "governed_download"
          : "structured_summary";
  return {
    projectionName: "PatientRecordArtifactProjection",
    recordArtifactProjectionId: stableRef(
      "patient_record_artifact_projection",
      `${input.record.recordRef}:${input.artifact.recordArtifactRef}:${input.witness.parityTupleHash}`,
    ),
    recordRef: input.record.recordRef,
    recordVersionRef: input.record.recordVersionRef,
    structuredSummaryRef: input.artifact.structuredSummaryRef,
    structuredSummaryHash: input.artifact.structuredSummaryHash,
    summaryDerivationPackageRef: input.artifact.summaryDerivationPackageRef,
    summaryRedactionTransformRef: input.artifact.summaryRedactionTransformRef,
    sourceArtifactRef: input.artifact.sourceArtifactRef,
    sourceArtifactBundleRef: input.artifact.sourceArtifactBundleRef,
    sourceArtifactHash: input.artifact.sourceArtifactHash,
    sourceRedactionTransformRef: input.artifact.sourceRedactionTransformRef,
    extractVersionRef: input.artifact.extractVersionRef,
    artifactPresentationContractRef: input.artifact.artifactPresentationContractRef,
    artifactSurfaceBindingRef: input.artifact.artifactSurfaceBindingRef,
    artifactSurfaceContextRef: input.artifact.artifactSurfaceContextRef,
    artifactSurfaceFrameRef: input.artifact.artifactSurfaceFrameRef,
    artifactModeTruthProjectionRef: input.artifact.artifactModeTruthProjectionRef,
    binaryArtifactDeliveryRef: input.artifact.binaryArtifactDeliveryRef ?? null,
    artifactByteGrantRef: input.artifact.artifactByteGrantRef ?? null,
    artifactParityDigestRef: input.artifact.artifactParityDigestRef,
    recordArtifactParityWitnessRef: input.witness.recordArtifactParityWitnessRef,
    artifactTransferSettlementRef: input.artifact.artifactTransferSettlementRef ?? null,
    artifactFallbackDispositionRef:
      input.artifact.artifactFallbackDispositionRef ?? input.witness.fallbackDispositionRef,
    recordVisibilityEnvelopeRef: input.record.recordVisibilityEnvelopeRef,
    recordReleaseGateRef: input.record.recordReleaseGateRef,
    recordStepUpCheckpointRef: input.record.recordStepUpCheckpointRef,
    recordOriginContinuationRef:
      input.record.recordOriginContinuationRef ??
      stableRef("record_origin_continuation", input.record.recordRef),
    recoveryContinuationTokenRef:
      input.record.recoveryContinuationTokenRef ??
      stableRef("record_recovery_continuation", input.record.recordRef),
    presentationMode,
    downloadEligibilityState:
      presentationMode === "governed_download" || presentationMode === "governed_preview"
        ? (input.artifact.downloadEligibilityState ?? "available")
        : input.witness.recordGateState === "visible"
          ? "gated"
          : "unavailable",
    embeddedNavigationGrantRef: input.artifact.embeddedNavigationGrantRef ?? null,
    summaryParityState: input.witness.summaryParityState,
    sourceAuthorityState: input.witness.sourceAuthorityState,
    parityTupleHash: input.witness.parityTupleHash,
    generatedAt: input.artifact.generatedAt ?? input.observedAt,
    createdByAuthority: AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME,
  };
}

function buildPatientResultInterpretationProjection(input: {
  readonly record: PortalSourceRecord;
  readonly witness: RecordArtifactParityWitness;
  readonly observedAt: string;
}): PatientResultInterpretationProjection {
  const source =
    input.record.resultInterpretation ?? defaultResultInterpretationForRecord(input.record);
  const gated = input.witness.recordGateState !== "visible";
  return {
    projectionName: "PatientResultInterpretationProjection",
    projectionAlias: "PatientResultInsightProjection",
    resultInterpretationId: stableRef(
      "patient_result_interpretation",
      `${input.record.recordRef}:${source.observationRef}:${input.witness.parityTupleHash}`,
    ),
    recordRef: input.record.recordRef,
    observationRef: source.observationRef,
    patientSafeTitle: source.patientSafeTitle,
    explanationOrder: [
      "what_this_test_is",
      "latest_result",
      "what_changed",
      "patient_next_step",
      "urgent_help",
      "technical_details",
    ],
    whatThisTestIs: source.whatThisTestIs,
    latestResult: gated
      ? "This result exists but details are not visible yet."
      : source.latestResult,
    whatChanged: gated
      ? "Comparison is held until the current release gate allows detail."
      : source.whatChanged,
    patientNextStep: gated
      ? "Follow the visible next step on this record placeholder."
      : source.patientNextStep,
    urgentHelp: source.urgentHelp,
    technicalDetails: gated
      ? "Technical detail is withheld by the current record gate."
      : source.technicalDetails,
    displayValue: gated ? "Not shown yet" : source.displayValue,
    displayUnit: gated ? "" : source.displayUnit,
    originalValue: gated ? "withheld" : source.originalValue,
    originalUnit: gated ? "" : source.originalUnit,
    referenceRangeRef: source.referenceRangeRef,
    comparatorBasisRef: source.comparatorBasisRef,
    trendWindowRef: source.trendWindowRef,
    specimenRef: source.specimenRef,
    specimenDate: source.specimenDate,
    sourceOrganisationRef: source.sourceOrganisationRef,
    abnormalityBasisRef: source.abnormalityBasisRef,
    interpretationSummary: gated
      ? "A governed placeholder is visible until the result can be released."
      : source.interpretationSummary,
    comparisonState: gated ? "stale_source" : source.comparisonState,
    relatedActionRefs: (input.record.followUpActions ?? []).map((action) => action.actionRef),
    sourceMetadataRefs: [
      source.specimenRef,
      source.sourceOrganisationRef,
      source.referenceRangeRef,
      source.abnormalityBasisRef,
    ],
    reasonCodes: mergeReasonCodes(
      ["PORTAL_213_RESULT_INTERPRETATION_AUTHORITY", "PORTAL_213_RESULT_INSIGHT_ALIAS_RESOLVED"],
      reasonCodesForRecordGate(input.witness.recordGateState),
    ),
    computedAt: input.observedAt,
    createdByAuthority: AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME,
  };
}

export function adaptPatientResultInsightProjection(
  projection: PatientResultInterpretationProjection,
): PatientResultInsightProjection {
  return projection;
}

function buildVisualizationParityBridge(input: {
  readonly record: PortalSourceRecord;
  readonly witness: RecordArtifactParityWitness;
  readonly observedAt: string;
}): {
  readonly fallback: VisualizationFallbackContract;
  readonly table: VisualizationTableContract;
  readonly parity: VisualizationParityProjection;
} | null {
  const source = input.record.visualization ?? null;
  if (!source) return null;
  const parityState: VisualizationParityState =
    input.witness.recordGateState !== "visible"
      ? "placeholder_only"
      : input.witness.sourceAuthorityState !== "summary_verified"
        ? "table_only"
        : source.parityState;
  const visualizationAuthority: VisualizationAuthority =
    parityState === "visual_and_table"
      ? "chart"
      : parityState === "table_only"
        ? "table"
        : parityState === "summary_only"
          ? "summary"
          : "placeholder";
  const parityTupleHash = digest({
    recordRef: input.record.recordRef,
    visualizationRef: source.visualizationRef,
    tableRef: source.tableRef,
    rowIdentityRefs: source.rowIdentityRefs,
    currentSelectionRef: source.currentSelectionRef,
    filterContextRef: source.filterContextRef,
    witness: input.witness.parityTupleHash,
    parityState,
  });
  const table: VisualizationTableContract = {
    projectionName: "VisualizationTableContract",
    visualizationTableContractId: stableRef(
      "visualization_table_contract",
      `${input.record.recordRef}:${source.tableRef}`,
    ),
    surfaceRef: input.record.recordRef,
    tableRef: source.tableRef,
    rowIdentityRefs: source.rowIdentityRefs,
    columnSchemaRef: source.columnSchemaRef,
    sortStateRef: source.sortStateRef,
    filterContextRef: source.filterContextRef,
    unitLabelRefs: source.unitLabelRefs,
    selectionModelRef: source.selectionModelRef,
    currentSelectionRef: source.currentSelectionRef,
    emptyStateContractRef: stableRef("empty_visualization_table", input.record.recordRef),
    renderedAt: input.observedAt,
  };
  const fallback: VisualizationFallbackContract = {
    projectionName: "VisualizationFallbackContract",
    visualizationFallbackContractId: stableRef(
      "visualization_fallback_contract",
      `${input.record.recordRef}:${source.visualizationRef}`,
    ),
    surfaceRef: input.record.recordRef,
    visualizationRef: source.visualizationRef,
    summarySentenceRef: source.summarySentenceRef,
    summaryStateRef: stableRef("visualization_summary_state", source.summaryText),
    tableRef: source.tableRef,
    tableContractRef: table.visualizationTableContractId,
    downloadRef: null,
    nonColorCueRefs: source.nonColorCueRefs,
    unitLabelRef: source.unitLabelRefs[0] ?? "unit:none",
    currentSelectionRef: source.currentSelectionRef,
    filterContextRef: source.filterContextRef,
    sortStateRef: source.sortStateRef,
    comparisonMode: source.comparisonMode,
    keyboardModelRef: source.keyboardModelRef,
    emptyVisualizationContractRef: stableRef("empty_visualization", input.record.recordRef),
    surfaceStateContractRef: stableRef("visualization_surface_state", parityState),
    freshnessAccessibilityContractRef: source.freshnessAccessibilityContractRef,
    parityTupleHash,
    parityState,
  };
  const reasonCodes = mergeReasonCodes(
    ["PORTAL_213_VISUALIZATION_PARITY_BRIDGED"],
    parityState === "visual_and_table" ? [] : ["PORTAL_213_VISUALIZATION_TABLE_FALLBACK"],
  );
  return {
    table,
    fallback,
    parity: {
      projectionName: "VisualizationParityProjection",
      visualizationParityProjectionId: stableRef(
        "visualization_parity_projection",
        `${input.record.recordRef}:${source.visualizationRef}:${parityState}`,
      ),
      surfaceRef: input.record.recordRef,
      visualizationFallbackContractRef: fallback.visualizationFallbackContractId,
      visualizationTableContractRef: table.visualizationTableContractId,
      summarySentenceRef: source.summarySentenceRef,
      selectionSummaryRef: source.selectionSummaryRef,
      filterSummaryRef: source.filterSummaryRef,
      trustSummaryRef: source.trustSummaryRef,
      lastStableTableRef: source.tableRef,
      parityTupleHash,
      parityState,
      visualizationAuthority,
      reasonCodes,
      generatedAt: input.observedAt,
    },
  };
}

function buildRecordFollowUpEligibilityProjection(input: {
  readonly input: ListPatientRecordsInput;
  readonly record: PortalSourceRecord;
  readonly coverage: PatientAudienceCoverageProjection;
  readonly witness: RecordArtifactParityWitness;
  readonly observedAt: string;
}): PatientRecordFollowUpEligibilityProjection {
  const actions = input.record.followUpActions ?? [];
  const blockingDependencyRefs = [
    ...actions.flatMap((action) => action.blockingDependencyRefs ?? []),
    ...(input.witness.recordGateState === "visible"
      ? []
      : [input.witness.recordArtifactParityWitnessRef]),
  ];
  const eligibilityFenceState: PatientRecordFollowUpFenceState =
    input.coverage.surfaceState === "recovery_required" ||
    input.coverage.surfaceState === "identity_hold"
      ? "blocked"
      : input.input.commandConsistencyState && input.input.commandConsistencyState !== "consistent"
        ? "stale"
        : input.witness.recordGateState === "visible"
          ? "aligned"
          : "blocked";
  const liveActions = actions.filter(
    (action) => (action.blockingDependencyRefs ?? []).length === 0,
  );
  const eligibilityState: PatientRecordFollowUpEligibilityState =
    eligibilityFenceState === "aligned" &&
    input.coverage.mutationAuthority === "route_bound_mutation" &&
    liveActions.length > 0
      ? "available"
      : input.witness.recordGateState !== "visible"
        ? "gated"
        : eligibilityFenceState === "blocked" || eligibilityFenceState === "stale"
          ? "recovery_only"
          : "unavailable";
  const primaryAction = liveActions[0] ?? actions[0] ?? defaultRecordFollowUpAction(input.record);
  return {
    projectionName: "PatientRecordFollowUpEligibilityProjection",
    recordFollowUpEligibilityId: stableRef(
      "patient_record_follow_up_eligibility",
      `${input.record.recordRef}:${eligibilityFenceState}:${eligibilityState}`,
    ),
    recordRef: input.record.recordRef,
    recordVersionRef: input.record.recordVersionRef,
    recordActionContextTokenRef: primaryAction.recordActionContextTokenRef,
    recordOriginContinuationRef: primaryAction.recordOriginContinuationRef,
    requiredVisibilityEnvelopeRef: input.record.recordVisibilityEnvelopeRef,
    requiredReleaseGateRef: input.record.recordReleaseGateRef,
    requiredStepUpCheckpointRef: input.record.recordStepUpCheckpointRef,
    capabilityRef: primaryAction.capabilityRef,
    capabilityLeaseExpiresAt: primaryAction.capabilityLeaseExpiresAt,
    releaseState: input.record.releaseState,
    visibilityTier: input.record.visibilityTier,
    allowedNextActionRefs:
      eligibilityState === "available" ? liveActions.map((action) => action.actionRef) : [],
    allowedActionTypes:
      eligibilityState === "available" ? liveActions.map((action) => action.actionType) : [],
    blockingDependencyRefs,
    eligibilityFenceState,
    eligibilityState,
    reasonCodes: mergeReasonCodes(
      ["PORTAL_213_FOLLOW_UP_ELIGIBILITY"],
      reasonCodesForRecordGate(input.witness.recordGateState),
    ),
    computedAt: input.observedAt,
    createdByAuthority: AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME,
  };
}

function buildRecordContinuityState(input: {
  readonly input: ListPatientRecordsInput;
  readonly record: PortalSourceRecord;
  readonly coverage: PatientAudienceCoverageProjection;
  readonly selected: boolean;
  readonly observedAt: string;
}): PatientRecordContinuityState {
  const gateState = recordGateStateFor(input.record, input.coverage);
  const continuationState: PatientRecordContinuityPosture =
    input.coverage.surfaceState === "recovery_required"
      ? "recovering"
      : input.coverage.surfaceState === "identity_hold" || gateState === "identity_hold"
        ? "identity_hold"
        : gateState === "delayed_release"
          ? "delayed_release"
          : gateState === "step_up_required"
            ? "awaiting_step_up"
            : gateState === "visible"
              ? input.selected
                ? "child_route_active"
                : "stable"
              : "blocked";
  return {
    projectionName: "PatientRecordContinuityState",
    recordContinuityStateId: stableRef(
      "patient_record_continuity_state",
      `${input.record.recordRef}:${continuationState}:${input.input.selectedAnchorRef ?? ""}`,
    ),
    recordRef: input.record.recordRef,
    recordVersionRef: input.record.recordVersionRef,
    selectedAnchorRef:
      input.input.selectedAnchorRef ?? input.record.selectedAnchorRef ?? input.record.recordRef,
    expandedChildRef: input.selected
      ? (input.record.resultId ?? input.record.documentId ?? input.record.recordRef)
      : null,
    oneExpandedItemGroupRef:
      input.input.oneExpandedItemGroupRef ??
      input.record.oneExpandedItemGroupRef ??
      "record_overview_one_expanded_item",
    recordVisibilityEnvelopeRef: input.record.recordVisibilityEnvelopeRef,
    recordStepUpCheckpointRef: input.record.recordStepUpCheckpointRef,
    recordReleaseGateRef: input.record.recordReleaseGateRef,
    recordOriginContinuationRef:
      input.record.recordOriginContinuationRef ??
      stableRef("record_origin_continuation", input.record.recordRef),
    recoveryContinuationTokenRef:
      input.record.recoveryContinuationTokenRef ??
      stableRef("record_recovery_continuation", input.record.recordRef),
    summarySafetyTier: input.record.summarySafetyTier,
    placeholderContractRef:
      input.record.placeholderContractRef ??
      stableRef("record_placeholder_contract", input.record.recordRef),
    continuationState,
    computedAt: input.observedAt,
    createdByAuthority: AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME,
  };
}

function buildPatientRecordSurfaceContext(input: {
  readonly input: ListPatientRecordsInput;
  readonly coverage: PatientAudienceCoverageProjection;
  readonly consistency: PatientShellConsistencyProjection;
  readonly records: readonly PortalSourceRecord[];
  readonly selectedRecord: PortalSourceRecord | null;
  readonly renderMode: PatientRecordRenderMode;
  readonly artifactProjections: readonly PatientRecordArtifactProjection[];
  readonly witnesses: readonly RecordArtifactParityWitness[];
  readonly resultInterpretations: readonly PatientResultInterpretationProjection[];
  readonly followUpEligibilities: readonly PatientRecordFollowUpEligibilityProjection[];
  readonly continuityStates: readonly PatientRecordContinuityState[];
  readonly visualizationParityProjections: readonly VisualizationParityProjection[];
  readonly observedAt: string;
}): PatientRecordSurfaceContext {
  const selected = input.selectedRecord ?? input.records[0] ?? null;
  const selectedWitness =
    input.witnesses.find((witness) => witness.recordRef === selected?.recordRef) ??
    input.witnesses[0] ??
    null;
  const recordRef = selected?.recordRef ?? "records_overview";
  const recordVersionRef = selected?.recordVersionRef ?? "records_overview_v1";
  const overviewGroups = recordOverviewGroups(input.records);
  const recordRows = input.records.map((record) => {
    const witness =
      input.witnesses.find((candidate) => candidate.recordRef === record.recordRef) ??
      selectedWitness;
    return {
      recordRef: record.recordRef,
      patientSafeTitle:
        recordGateStateFor(record, input.coverage) === "visible"
          ? record.patientSafeTitle
          : record.publicSafeTitle,
      category: record.category,
      releaseState: record.releaseState,
      visibilityTier: record.visibilityTier,
      sourceAuthorityState: witness?.sourceAuthorityState ?? "placeholder_only",
      routeRef: routeForRecord(record),
      placeholderVisible: recordGateStateFor(record, input.coverage) !== "visible",
    };
  });
  const continuationState: PatientRecordContinuationState =
    input.coverage.surfaceState === "recovery_required" ||
    input.consistency.causalConsistencyState === "blocked"
      ? "blocked"
      : input.consistency.causalConsistencyState === "stale"
        ? "stale"
        : "aligned";
  const surfaceState: PatientRecordSurfaceState =
    continuationState === "blocked"
      ? "stale_recovery"
      : selectedWitness?.recordGateState && selectedWitness.recordGateState !== "visible"
        ? "gated_placeholder"
        : input.coverage.surfaceState === "ready"
          ? "visible"
          : "read_only";
  return {
    projectionName: "PatientRecordSurfaceContext",
    recordSurfaceContextId: stableRef(
      "patient_record_surface_context",
      `${input.coverage.patientAudienceCoverageProjectionId}:${recordRef}:${input.renderMode}:${input.witnesses.map((witness) => witness.parityTupleHash).join("|")}`,
    ),
    recordRef,
    recordVersionRef,
    patientShellConsistencyRef: input.consistency.patientShellConsistencyRef,
    recordVisibilityEnvelopeRef:
      selected?.recordVisibilityEnvelopeRef ?? "record_visibility_envelope:overview",
    recordReleaseGateRef: selected?.recordReleaseGateRef ?? "record_release_gate:overview",
    recordStepUpCheckpointRef:
      selected?.recordStepUpCheckpointRef ?? "record_step_up_checkpoint:overview",
    recordArtifactProjectionRefs: input.artifactProjections.map(
      (projection) => projection.recordArtifactProjectionId,
    ),
    artifactParityDigestRefs: input.artifactProjections.map(
      (projection) => projection.artifactParityDigestRef,
    ),
    recordArtifactParityWitnessRefs: input.witnesses.map(
      (witness) => witness.recordArtifactParityWitnessRef,
    ),
    resultInterpretationProjectionRefs: input.resultInterpretations.map(
      (projection) => projection.resultInterpretationId,
    ),
    followUpEligibilityProjectionRefs: input.followUpEligibilities.map(
      (projection) => projection.recordFollowUpEligibilityId,
    ),
    continuityStateRefs: input.continuityStates.map(
      (projection) => projection.recordContinuityStateId,
    ),
    visualizationParityProjectionRefs: input.visualizationParityProjections.map(
      (projection) => projection.visualizationParityProjectionId,
    ),
    summarySafetyTier: selected?.summarySafetyTier ?? "public_safe",
    renderMode: input.renderMode,
    selectedAnchorRef: input.input.selectedAnchorRef ?? selected?.selectedAnchorRef ?? recordRef,
    oneExpandedItemGroupRef:
      input.input.oneExpandedItemGroupRef ??
      selected?.oneExpandedItemGroupRef ??
      "record_overview_one_expanded_item",
    recordOriginContinuationRef:
      selected?.recordOriginContinuationRef ?? stableRef("record_origin_continuation", recordRef),
    experienceContinuityEvidenceRef:
      selected?.experienceContinuityEvidenceRef ??
      stableRef("record_continuity_evidence", recordRef),
    overviewGroups,
    recordRows,
    surfaceTupleHash: digest({
      coverageProjectionRef: input.coverage.patientAudienceCoverageProjectionId,
      shellConsistencyRef: input.consistency.patientShellConsistencyRef,
      recordRows,
      witnesses: input.witnesses.map((witness) => witness.parityTupleHash),
      renderMode: input.renderMode,
    }),
    continuationState,
    surfaceState,
    reasonCodes: mergeReasonCodes(input.coverage.reasonCodes, [
      "PORTAL_213_HEALTH_RECORD_SURFACE_CONTEXT",
      "PORTAL_213_RECORD_CONTINUITY_PRESERVED",
      ...(input.witnesses.some((witness) => witness.sourceAuthorityState !== "summary_verified")
        ? ["PORTAL_213_RECORD_ARTIFACT_PARITY_DEGRADED"]
        : ["PORTAL_213_RECORD_ARTIFACT_PARITY_VERIFIED"]),
    ]),
    computedAt: input.observedAt,
    createdByAuthority: AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME,
  };
}

function recordGateStateFor(
  record: PortalSourceRecord,
  coverage: PatientAudienceCoverageProjection,
): RecordArtifactGateState {
  if (coverage.surfaceState === "identity_hold" || record.releaseState === "identity_hold") {
    return "identity_hold";
  }
  if (
    coverage.surfaceState === "recovery_required" ||
    record.releaseState === "recovery_required"
  ) {
    return "blocked";
  }
  if (record.releaseState === "delayed_release") return "delayed_release";
  if (record.releaseState === "step_up_required") return "step_up_required";
  if (record.releaseState === "restricted" || record.visibilityTier === "suppressed") {
    return "restricted";
  }
  return "visible";
}

function reasonCodesForRecordGate(gateState: RecordArtifactGateState): readonly string[] {
  switch (gateState) {
    case "delayed_release":
      return ["PORTAL_213_DELAYED_RELEASE_PLACEHOLDER"];
    case "step_up_required":
      return ["PORTAL_213_STEP_UP_PLACEHOLDER"];
    case "restricted":
      return ["PORTAL_213_RESTRICTED_PLACEHOLDER"];
    case "identity_hold":
    case "blocked":
      return ["PORTAL_213_RECORD_CONTINUITY_PRESERVED"];
    case "visible":
      return [];
  }
}

function recordOverviewGroups(
  records: readonly PortalSourceRecord[],
): PatientRecordSurfaceContext["overviewGroups"] {
  const labels: Record<PatientRecordCategory, string> = {
    latest_update: "Latest updates",
    test_result: "Test results",
    medicine_allergy: "Medicines and allergies",
    condition_care_plan: "Conditions and care plans",
    letter_document: "Letters and documents",
    action_needed_follow_up: "Action-needed follow-up",
  };
  return (Object.keys(labels) as PatientRecordCategory[]).map((groupRef) => {
    const groupRecords = records.filter((record) => record.category === groupRef);
    return {
      groupRef,
      label: labels[groupRef],
      recordRefs: groupRecords.map((record) => record.recordRef),
      placeholderRecordRefs: groupRecords
        .filter(
          (record) => record.releaseState !== "visible" || record.visibilityTier === "suppressed",
        )
        .map((record) => record.recordRef),
    };
  });
}

function routeForRecord(record: PortalSourceRecord): string {
  if (record.resultId) return `/v1/me/records/results/${record.resultId}`;
  if (record.documentId) return `/v1/me/records/documents/${record.documentId}`;
  return `/v1/me/records#${record.recordRef}`;
}

function defaultRecordArtifactFor(record: PortalSourceRecord): PortalSourceRecordArtifact {
  return {
    recordArtifactRef: stableRef("record_artifact", record.recordRef),
    structuredSummaryRef: stableRef("record_structured_summary", record.recordRef),
    structuredSummaryHash: digest({ recordRef: record.recordRef, summary: record.publicSafeTitle }),
    summaryDerivationPackageRef: stableRef("record_summary_derivation", record.recordRef),
    summaryRedactionTransformRef: stableRef("record_summary_redaction", record.recordRef),
    sourceArtifactRef: stableRef("record_source_artifact", record.recordRef),
    sourceArtifactBundleRef: stableRef("record_source_bundle", record.recordRef),
    sourceArtifactHash: digest({ recordRef: record.recordRef, source: record.recordVersionRef }),
    sourceRedactionTransformRef: stableRef("record_source_redaction", record.recordRef),
    extractVersionRef: `${record.recordVersionRef}:extract`,
    artifactPresentationContractRef: stableRef("artifact_presentation_contract", record.recordRef),
    artifactSurfaceBindingRef: stableRef("artifact_surface_binding", record.recordRef),
    artifactSurfaceContextRef: stableRef("artifact_surface_context", record.recordRef),
    artifactSurfaceFrameRef: stableRef("artifact_surface_frame", record.recordRef),
    artifactModeTruthProjectionRef: stableRef("artifact_mode_truth", record.recordRef),
    currentSafeMode: "structured_summary",
    artifactParityDigestRef: stableRef("artifact_parity_digest", record.recordRef),
    downloadEligibilityState: "gated",
    summaryParityState: "provisional",
  };
}

function defaultResultInterpretationForRecord(
  record: PortalSourceRecord,
): PortalSourceResultInterpretation {
  return {
    observationRef: record.resultId ?? stableRef("observation", record.recordRef),
    patientSafeTitle: record.patientSafeTitle,
    whatThisTestIs:
      "This test result is shown with the patient-facing explanation supplied by the record projection.",
    latestResult: "The latest result is available in the structured summary.",
    whatChanged: "There is no directly comparable prior result in this projection.",
    patientNextStep: "Use the available record follow-up action if more detail is needed.",
    urgentHelp: "Seek urgent help if symptoms feel severe or rapidly worsening.",
    technicalDetails:
      "Technical source details are available through the source artifact reference.",
    displayValue: "See summary",
    displayUnit: "",
    originalValue: "source",
    originalUnit: "",
    referenceRangeRef: stableRef("reference_range", record.recordRef),
    comparatorBasisRef: stableRef("comparator_basis", record.recordRef),
    trendWindowRef: stableRef("trend_window", record.recordRef),
    specimenRef: stableRef("specimen", record.recordRef),
    specimenDate: record.latestMeaningfulUpdateAt,
    sourceOrganisationRef: "source_organisation:practice",
    abnormalityBasisRef: "abnormality_basis:not_supplied",
    interpretationSummary: "Patient-facing interpretation is available from this projection.",
    comparisonState: "partial_history",
  };
}

function defaultRecordFollowUpAction(record: PortalSourceRecord): PortalSourceRecordFollowUpAction {
  return {
    actionType: "artifact_recovery",
    actionRef: stableRef("record_follow_up_action", `${record.recordRef}:artifact_recovery`),
    actionLabel: "Recover record artifact",
    routeRef: routeForRecord(record),
    recordActionContextTokenRef: stableRef("record_action_context", record.recordRef),
    recordOriginContinuationRef:
      record.recordOriginContinuationRef ??
      stableRef("record_origin_continuation", record.recordRef),
    capabilityRef: stableRef("record_capability", `${record.recordRef}:artifact_recovery`),
    capabilityLeaseExpiresAt: null,
    blockingDependencyRefs: [stableRef("record_follow_up_no_live_action", record.recordRef)],
  };
}

function detectRecoveryReason(input: PortalRouteTupleInput): PortalRecoveryReason {
  if (input.sessionEpochRef !== input.expectedSessionEpochRef) {
    return "stale_session";
  }
  if (input.subjectBindingVersionRef !== input.expectedSubjectBindingVersionRef) {
    return "stale_binding";
  }
  if (input.routeIntentBindingRef !== input.expectedRouteIntentBindingRef) {
    return "route_intent_tuple_drift";
  }
  if (input.lineageFenceRef !== input.expectedLineageFenceRef) {
    return "lineage_fence_drift";
  }
  return "none";
}

function reasonCodesForRecovery(recoveryReason: PortalRecoveryReason): readonly string[] {
  switch (recoveryReason) {
    case "stale_session":
      return ["PORTAL_185_STALE_SESSION_RECOVERY", "PORTAL_185_SAME_SHELL_RECOVERY"];
    case "stale_binding":
      return ["PORTAL_185_STALE_BINDING_RECOVERY", "PORTAL_185_SAME_SHELL_RECOVERY"];
    case "route_intent_tuple_drift":
      return ["PORTAL_185_ROUTE_INTENT_DRIFT_RECOVERY", "PORTAL_185_SAME_SHELL_RECOVERY"];
    case "lineage_fence_drift":
      return ["PORTAL_185_LINEAGE_FENCE_DRIFT_RECOVERY", "PORTAL_185_SAME_SHELL_RECOVERY"];
    case "command_pending":
      return ["PORTAL_185_COMMAND_PENDING_CONSISTENCY"];
    case "identity_repair_hold":
      return ["PORTAL_185_IDENTITY_HOLD"];
    case "none":
      return [];
  }
}

function projectionFamiliesFor(surfaceState: PortalSurfaceState): readonly string[] {
  if (surfaceState === "identity_hold") {
    return ["PatientPortalEntryProjection", "PatientIdentityHoldProjection"];
  }
  if (surfaceState === "recovery_required") {
    return ["PatientPortalEntryProjection", "PatientActionRecoveryProjection"];
  }
  return [
    "PatientPortalEntryProjection",
    "PatientHomeProjection",
    "PatientRequestsIndexProjection",
    "PatientRequestSummaryProjection",
    "PatientRequestLineageProjection",
    "PatientRequestDetailProjection",
    "PatientRequestDownstreamProjection",
    "PatientRequestReturnBundle",
    "PatientNextActionProjection",
    "PatientActionRoutingProjection",
    "PatientActionSettlementProjection",
    "PatientSafetyInterruptionProjection",
    "PatientMoreInfoStatusProjection",
    "PatientMoreInfoResponseThreadProjection",
    "PatientCallbackStatusProjection",
    "PatientReachabilitySummaryProjection",
    "PatientContactRepairProjection",
    "PatientConsentCheckpointProjection",
    "PatientCommunicationVisibilityProjection",
    "PatientCommunicationsTimelineProjection",
    "PatientConversationCluster",
    "ConversationThreadProjection",
    "ConversationSubthreadProjection",
    "PatientConversationPreviewDigest",
    "ConversationCallbackCardProjection",
    "PatientReceiptEnvelope",
    "ConversationCommandSettlement",
    "PatientComposerLease",
    "PatientRecordSurfaceContext",
    "PatientResultInterpretationProjection",
    "PatientResultInsightProjection",
    "PatientRecordArtifactProjection",
    "RecordArtifactParityWitness",
    "PatientRecordFollowUpEligibilityProjection",
    "PatientRecordContinuityState",
    "VisualizationFallbackContract",
    "VisualizationTableContract",
    "VisualizationParityProjection",
  ];
}

function buildShellConsistency(
  input: BuildPatientAudienceCoverageInput,
  coverage: PatientAudienceCoverageProjection,
  requests: readonly PortalSourceRequest[],
  observedAt: string,
): PatientShellConsistencyProjection {
  const staleAt = new Date(Date.parse(observedAt) + 120_000).toISOString();
  const causalConsistencyState: PortalCausalConsistencyState =
    coverage.surfaceState === "recovery_required" || coverage.surfaceState === "identity_hold"
      ? "blocked"
      : (input.commandConsistencyState ?? "consistent");
  return {
    patientShellConsistencyRef: stableRef(
      "patient_shell_consistency",
      `${coverage.patientAudienceCoverageProjectionId}:${requests.map((request) => request.requestVersionRef).join("|")}`,
    ),
    bundleVersion: AUTHENTICATED_PORTAL_PROJECTION_SCHEMA_VERSION,
    audienceTier: coverage.audienceTier,
    computedAt: observedAt,
    staleAt,
    governingObjectRefs: requests.map((request) => request.requestRef),
    entityVersionRefs: requests.map((request) => request.requestVersionRef),
    causalConsistencyState,
    releaseApprovalFreezeRef: null,
    channelReleaseFreezeState:
      coverage.surfaceState === "ready" || coverage.surfaceState === "summary_only"
        ? "open"
        : "read_only",
    requiredAssuranceSliceTrustRefs: ["phase2_identity_control_plane"],
    releaseRecoveryDispositionRef:
      coverage.surfaceState === "recovery_required" ? "release_recovery_same_shell_185" : null,
  };
}

function buildConversationShellConsistency(
  input: BuildPatientAudienceCoverageInput,
  coverage: PatientAudienceCoverageProjection,
  clusters: readonly PortalSourceConversationCluster[],
  observedAt: string,
): PatientShellConsistencyProjection {
  const staleAt = new Date(Date.parse(observedAt) + 120_000).toISOString();
  const causalConsistencyState: PortalCausalConsistencyState =
    coverage.surfaceState === "recovery_required" || coverage.surfaceState === "identity_hold"
      ? "blocked"
      : (input.commandConsistencyState ?? "consistent");
  return {
    patientShellConsistencyRef: stableRef(
      "conversation_shell_consistency",
      `${coverage.patientAudienceCoverageProjectionId}:${clusters.map((cluster) => cluster.clusterVersionRef).join("|")}`,
    ),
    bundleVersion: AUTHENTICATED_PORTAL_PROJECTION_SCHEMA_VERSION,
    audienceTier: coverage.audienceTier,
    computedAt: observedAt,
    staleAt,
    governingObjectRefs: clusters.map((cluster) => cluster.clusterRef),
    entityVersionRefs: clusters.map((cluster) => cluster.clusterVersionRef),
    causalConsistencyState,
    releaseApprovalFreezeRef:
      coverage.surfaceState === "identity_hold" ? "identity_repair_freeze_214" : null,
    channelReleaseFreezeState:
      coverage.surfaceState === "ready" || coverage.surfaceState === "summary_only"
        ? "open"
        : "read_only",
    requiredAssuranceSliceTrustRefs: ["phase2_identity_control_plane", "message_thread_tuple_214"],
    releaseRecoveryDispositionRef:
      coverage.surfaceState === "recovery_required" ? "message_recovery_same_shell_214" : null,
  };
}

function entryStateFor(
  coverage: PatientAudienceCoverageProjection,
  request: PortalSourceRequest | null,
): PortalEntryState {
  if (coverage.surfaceState === "identity_hold") return "identity_hold";
  if (coverage.surfaceState === "recovery_required") return "same_shell_recovery";
  if (request) return "request_detail";
  if (coverage.audienceTier === "patient_public") return "public_recovery";
  return "authenticated_home";
}

function stateTitleFor(
  coverage: PatientAudienceCoverageProjection,
  request: PortalSourceRequest | null,
): string {
  if (coverage.surfaceState === "identity_hold") return "Identity hold";
  if (coverage.surfaceState === "recovery_required") return "Same-shell recovery";
  if (request) return "Request detail";
  if (coverage.audienceTier === "patient_authenticated") return "Authenticated home";
  return "Portal entry";
}

function safeLandingRouteFor(
  coverage: PatientAudienceCoverageProjection,
  request: PortalSourceRequest | null,
): string {
  if (coverage.surfaceState === "identity_hold") return "/v1/me/identity-hold";
  if (coverage.surfaceState === "recovery_required") return "/v1/me/recovery/current";
  if (request) return `/v1/me/requests/${request.requestRef}`;
  return "/v1/me";
}

function freshnessFor(
  coverage: PatientAudienceCoverageProjection,
  input: BuildPatientAudienceCoverageInput,
): PortalFreshnessState {
  if (coverage.surfaceState === "recovery_required" || coverage.surfaceState === "identity_hold") {
    return "blocked";
  }
  return (
    input.freshnessState ??
    (input.commandConsistencyState === "pending" ? "pending_consistency" : "fresh")
  );
}

function buildHomeProjection(
  input: ResolvePortalEntryInput,
  coverage: PatientAudienceCoverageProjection,
  consistency: PatientShellConsistencyProjection,
  requests: readonly PortalSourceRequest[],
  observedAt: string,
): PatientHomeProjection {
  return assemblePatientHomeProjection({ input, coverage, consistency, requests, observedAt });
}

export interface PatientHomeProjectionAssemblerInput {
  readonly input: ResolvePortalEntryInput;
  readonly coverage: PatientAudienceCoverageProjection;
  readonly consistency: PatientShellConsistencyProjection;
  readonly requests: readonly PortalSourceRequest[];
  readonly observedAt: string;
}

export function assemblePatientHomeProjection(
  assemblerInput: PatientHomeProjectionAssemblerInput,
): PatientHomeProjection {
  const { input, coverage, consistency, requests, observedAt } = assemblerInput;
  const visibleRequests = requests.filter((request) =>
    isRequestVisibleUnderCoverage(coverage, request, input.subjectRef),
  );
  const orderedRefs = visibleRequests.map((request) => request.requestRef).sort();
  const candidateLadder = buildHomeCandidateLadder({
    input,
    coverage,
    consistency,
    requests,
    observedAt,
  });
  const visibleCandidates = candidateLadder
    .filter((candidate) => candidate.visibilityState === "visible")
    .sort(compareSpotlightCandidates);
  const excludedCandidates = candidateLadder.filter(
    (candidate) => candidate.visibilityState === "excluded",
  );
  const quietHomeDecision = buildQuietHomeDecision({
    input,
    coverage,
    consistency,
    visibleCandidates,
    excludedCandidates,
    observedAt,
  });
  const selectedCandidate = chooseSpotlightCandidate({
    current: input.currentSpotlightDecision ?? null,
    visibleCandidates,
    observedAt,
    windowMs: input.spotlightUseWindowMs,
  });
  const spotlightDecision = buildSpotlightDecision({
    selectedCandidate: selectedCandidate.candidate,
    visibleCandidates,
    excludedCandidates,
    useWindow: selectedCandidate.useWindow,
    quietHomeDecision,
    coverage,
    observedAt,
  });
  const navigationUrgencyDigest = buildNavUrgencyDigest({
    spotlightDecision,
    quietHomeDecision,
    visibleCandidates,
    observedAt,
  });
  const navReturnContract = buildNavReturnContract({
    spotlightDecision,
    quietHomeDecision,
    coverage,
  });
  const portalNavigation = buildPortalNavigation(navigationUrgencyDigest);
  const blockedHome =
    coverage.surfaceState === "identity_hold" ||
    (quietHomeDecision.reason !== "all_clear" && quietHomeDecision.reason !== "candidate_present");
  const homeMode: PatientHomeProjection["homeMode"] =
    coverage.surfaceState === "recovery_required"
      ? "recovery_only"
      : blockedHome
        ? "blocked"
        : quietHomeDecision.eligible && !spotlightDecision.selectedCandidateRef
          ? "quiet"
          : "attention";
  return {
    projectionName: "PatientHomeProjection",
    projectionAlias: "PatientPortalHomeProjection",
    patientHomeProjectionId: stableRef(
      "patient_home",
      `${coverage.patientAudienceCoverageProjectionId}:${spotlightDecision.selectionTupleHash}:${quietHomeDecision.decisionRef}`,
    ),
    coverageProjectionRef: coverage.patientAudienceCoverageProjectionId,
    patientShellConsistencyRef: consistency.patientShellConsistencyRef,
    spotlightDecisionRef: spotlightDecision.decisionRef,
    quietHomeDecisionRef: quietHomeDecision.decisionRef,
    requiredReleaseTrustFreezeVerdictRef: null,
    secondaryCardOrderingHash: digest(
      visibleCandidates
        .filter((candidate) => candidate.candidateRef !== spotlightDecision.selectedCandidateRef)
        .map((candidate) => candidate.candidateRef),
    ),
    compactCardRefs: orderedRefs
      .slice(0, 4)
      .map((requestRef) => stableRef("compact_card", requestRef)),
    dominantActionRef:
      spotlightDecision.selectedActionRef ??
      (homeMode === "blocked" || homeMode === "recovery_only"
        ? quietHomeDecision.gentlestSafeNextActionRef
        : null),
    homeMode,
    spotlightDecision,
    spotlightUseWindow: spotlightDecision.useWindow,
    quietHomeDecision,
    navigationUrgencyDigest,
    navReturnContract,
    portalNavigation,
    querySurfaceRef: "GET /v1/me/home",
    selectedSpotlightRef: spotlightDecision.selectedCandidateRef,
    visibleCandidateRefs: visibleCandidates.map((candidate) => candidate.candidateRef),
    excludedCandidateRefs: excludedCandidates.map((candidate) => candidate.candidateRef),
    sourceProjectionRefs: [
      "PatientHomeProjection",
      "PatientPortalHomeProjection",
      "PatientSpotlightDecisionProjection",
      "PatientSpotlightDecisionUseWindow",
      "PatientQuietHomeDecision",
      "PatientNavUrgencyDigest",
      "PatientNavReturnContract",
    ],
    surfaceState: coverage.surfaceState,
    reasonCodes: mergeReasonCodes(coverage.reasonCodes, spotlightDecision.reasonCodes),
    computedAt: observedAt,
    createdByAuthority: AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME,
  };
}

const PATIENT_SPOTLIGHT_TIER_ORDER: Record<PatientSpotlightDecisionTier, number> = {
  urgent_safety: 0,
  patient_action: 1,
  dependency_repair: 2,
  watchful_attention: 3,
  quiet_home: 4,
};

const DEFAULT_SPOTLIGHT_USE_WINDOW_MS = 8 * 60 * 1000;

function buildHomeCandidateLadder(input: {
  readonly input: ResolvePortalEntryInput;
  readonly coverage: PatientAudienceCoverageProjection;
  readonly consistency: PatientShellConsistencyProjection;
  readonly requests: readonly PortalSourceRequest[];
  readonly observedAt: string;
}): readonly PatientSpotlightCandidateProjection[] {
  const candidates = new Map<string, PatientSpotlightCandidateInput>();
  for (const candidate of deriveCandidatesFromRequests(input)) {
    candidates.set(candidate.candidateRef, candidate);
  }
  for (const candidate of input.input.spotlightCandidates ?? []) {
    candidates.set(candidate.candidateRef, candidate);
  }
  if (
    input.coverage.surfaceState === "recovery_required" ||
    input.coverage.surfaceState === "identity_hold" ||
    input.consistency.causalConsistencyState !== "consistent"
  ) {
    const recoveryCandidate = recoveryCandidateForHomeState(input);
    candidates.set(recoveryCandidate.candidateRef, recoveryCandidate);
  }
  return [...candidates.values()].map((candidate) =>
    normalizeSpotlightCandidate(candidate, input.coverage),
  );
}

function deriveCandidatesFromRequests(input: {
  readonly input: ResolvePortalEntryInput;
  readonly coverage: PatientAudienceCoverageProjection;
  readonly requests: readonly PortalSourceRequest[];
  readonly observedAt: string;
}): readonly PatientSpotlightCandidateInput[] {
  const candidates: PatientSpotlightCandidateInput[] = [];
  for (const request of input.requests) {
    const controls = requestCandidateControls(input.input, input.coverage, request);
    if (request.bucket !== "complete") {
      const urgent = isUrgentSafetyRequest(request);
      const patientOwed = request.awaitingParty === "patient";
      const dependencyFailure = request.commandConsistencyState !== "consistent";
      candidates.push({
        ...controls,
        candidateRef: stableRef("spotlight_candidate", `${request.requestRef}:request`),
        candidateType: patientOwed
          ? "pending_patient_action"
          : dependencyFailure
            ? "dependency_repair"
            : "active_request",
        entityRef: request.requestRef,
        entityVersionRef: request.requestVersionRef,
        patientLabel: request.patientSafeLabel,
        decisionTier: urgent
          ? "urgent_safety"
          : patientOwed
            ? "patient_action"
            : dependencyFailure
              ? "dependency_repair"
              : "watchful_attention",
        patientSafetyBlocker: urgent,
        patientOwedAction: patientOwed,
        activeDependencyFailure: dependencyFailure,
        authoritativeDueAt: null,
        latestMeaningfulUpdateAt: request.latestMeaningfulUpdateAt,
        stableEntityRef: request.requestRef,
        actionRef: request.dominantActionRef ?? request.nextSafeActionRef ?? "view_request",
        actionLabel: patientOwed ? "Continue request" : "View request",
        actionRouteRef: `/v1/me/requests/${request.requestRef}`,
      });
    }
    for (const child of request.downstream) {
      const childCandidate = candidateFromDownstream(input.input, input.coverage, request, child);
      if (childCandidate) candidates.push(childCandidate);
    }
  }
  return candidates;
}

function requestCandidateControls(
  input: ResolvePortalEntryInput,
  coverage: PatientAudienceCoverageProjection,
  request: PortalSourceRequest,
): PatientSpotlightCandidateControls {
  const continuityClear =
    request.requiredSubjectBindingVersionRef === input.subjectBindingVersionRef &&
    request.requiredSessionEpochRef === input.sessionEpochRef &&
    request.routeIntentBindingRef === input.routeIntentBindingRef &&
    request.lineageFenceRef === input.lineageFenceRef;
  const hasAction = Boolean(request.dominantActionRef ?? request.nextSafeActionRef);
  return {
    visibilityAllowed: isRequestVisibleUnderCoverage(coverage, request, input.subjectRef),
    identityHoldClear: coverage.surfaceState !== "identity_hold",
    continuityClear,
    releaseTrustClear: coverage.surfaceState !== "recovery_required",
    capabilityLeaseState:
      coverage.mutationAuthority === "route_bound_mutation" &&
      request.commandConsistencyState === "consistent"
        ? "live"
        : request.commandConsistencyState === "pending"
          ? "stale"
          : "missing",
    writableEligibilityState:
      coverage.mutationAuthority === "route_bound_mutation" && hasAction ? "writable" : "read_only",
    recoveryOnly:
      coverage.surfaceState === "recovery_required" || coverage.surfaceState === "identity_hold",
  };
}

function candidateFromDownstream(
  input: ResolvePortalEntryInput,
  coverage: PatientAudienceCoverageProjection,
  request: PortalSourceRequest,
  child: PortalSourceDownstream,
): PatientSpotlightCandidateInput | null {
  if (child.visibilityTier === "suppressed") return null;
  const controls = requestCandidateControls(input, coverage, request);
  const candidateType = candidateTypeForDownstream(child);
  if (!candidateType) return null;
  const patientOwed = child.awaitingParty === "patient";
  const dependencyFailure =
    candidateType === "dependency_repair" || candidateType === "contact_reachability_repair";
  const urgent = /urgent|safety|red[-_ ]?flag/i.test(
    `${child.patientLabelRef} ${child.authoritativeState}`,
  );
  return {
    ...controls,
    candidateRef: stableRef("spotlight_candidate", `${request.requestRef}:${child.childRef}`),
    candidateType,
    entityRef: child.childRef,
    entityVersionRef: `${request.requestVersionRef}:${child.childRef}`,
    patientLabel: child.patientLabelRef,
    decisionTier: urgent
      ? "urgent_safety"
      : patientOwed
        ? "patient_action"
        : dependencyFailure
          ? "dependency_repair"
          : "watchful_attention",
    patientSafetyBlocker: urgent,
    patientOwedAction: patientOwed,
    activeDependencyFailure: dependencyFailure,
    authoritativeDueAt: null,
    latestMeaningfulUpdateAt: child.lastMeaningfulUpdateAt,
    stableEntityRef: child.childRef,
    actionRef: child.nextSafeActionRef ?? request.nextSafeActionRef ?? "view_request",
    actionLabel: patientOwed ? "Reply to message" : "View update",
    actionRouteRef: `/v1/me/requests/${request.requestRef}`,
  };
}

function candidateTypeForDownstream(
  child: PortalSourceDownstream,
): PatientSpotlightCandidateType | null {
  if (child.childType === "callback_case" || child.childType === "conversation_cluster") {
    return "callback_message_blocker";
  }
  if (child.childType === "record_follow_up") return "record_results_cue";
  if (
    child.childType === "admin_repair" &&
    /contact|phone|email|reachability/i.test(`${child.patientLabelRef} ${child.authoritativeState}`)
  ) {
    return "contact_reachability_repair";
  }
  if (
    child.childType === "admin_repair" ||
    child.childType === "hub_case" ||
    child.childType === "pharmacy_case"
  ) {
    return "dependency_repair";
  }
  return null;
}

function recoveryCandidateForHomeState(input: {
  readonly input: ResolvePortalEntryInput;
  readonly coverage: PatientAudienceCoverageProjection;
  readonly consistency: PatientShellConsistencyProjection;
  readonly observedAt: string;
}): PatientSpotlightCandidateInput {
  const identityHold = input.coverage.surfaceState === "identity_hold";
  return {
    candidateRef: stableRef(
      "spotlight_candidate",
      `${input.coverage.patientAudienceCoverageProjectionId}:recovery`,
    ),
    candidateType: "recovery_identity_hold",
    entityRef: input.coverage.patientAudienceCoverageProjectionId,
    entityVersionRef: input.consistency.patientShellConsistencyRef,
    patientLabel: identityHold ? "Identity repair in progress" : "Recovery needed",
    decisionTier: "dependency_repair",
    patientSafetyBlocker: false,
    patientOwedAction: false,
    activeDependencyFailure: true,
    authoritativeDueAt: null,
    latestMeaningfulUpdateAt: input.observedAt,
    stableEntityRef: input.coverage.patientAudienceCoverageProjectionId,
    actionRef: identityHold
      ? "wait_for_identity_repair_release"
      : "re_authenticate_or_resume_recovery",
    actionLabel: identityHold ? "Wait for identity repair" : "Resume recovery",
    actionRouteRef: identityHold ? "/v1/me/identity-hold" : "/v1/me/recovery/current",
    visibilityAllowed: false,
    identityHoldClear: !identityHold,
    continuityClear: input.consistency.causalConsistencyState === "consistent",
    releaseTrustClear: false,
    capabilityLeaseState: "stale",
    writableEligibilityState: "blocked",
    recoveryOnly: true,
  };
}

function normalizeSpotlightCandidate(
  candidate: PatientSpotlightCandidateInput,
  coverage: PatientAudienceCoverageProjection,
): PatientSpotlightCandidateProjection {
  const visibilityAllowed = candidate.visibilityAllowed ?? true;
  const identityHoldClear =
    candidate.identityHoldClear ?? coverage.surfaceState !== "identity_hold";
  const continuityClear = candidate.continuityClear ?? true;
  const releaseTrustClear =
    candidate.releaseTrustClear ?? coverage.surfaceState !== "recovery_required";
  const capabilityLeaseState = candidate.capabilityLeaseState ?? "live";
  const writableEligibilityState = candidate.writableEligibilityState ?? "writable";
  const recoveryOnly = candidate.recoveryOnly ?? false;
  const exclusionReasons = compactStrings([
    visibilityAllowed ? null : "visibility_policy_excluded",
    identityHoldClear ? null : "identity_hold_excluded",
    continuityClear ? null : "continuity_tuple_excluded",
    releaseTrustClear ? null : "release_trust_excluded",
    capabilityLeaseState === "live" ? null : `capability_lease_${capabilityLeaseState}`,
    writableEligibilityState === "writable"
      ? null
      : `writable_eligibility_${writableEligibilityState}`,
    recoveryOnly ? "recovery_only_excluded" : null,
  ]);
  const patientSafetyBlocker = candidate.patientSafetyBlocker ?? false;
  const patientOwedAction = candidate.patientOwedAction ?? false;
  const activeDependencyFailure = candidate.activeDependencyFailure ?? false;
  const authoritativeDueAt = candidate.authoritativeDueAt ?? null;
  const stableEntityRef = candidate.stableEntityRef ?? candidate.entityRef;
  const selectionTuple: PatientSpotlightCandidateProjection["selectionTuple"] = [
    candidate.decisionTier,
    patientSafetyBlocker,
    patientOwedAction,
    activeDependencyFailure,
    authoritativeDueAt ?? "no_due_time",
    candidate.latestMeaningfulUpdateAt,
    stableEntityRef,
  ];
  return {
    candidateRef: candidate.candidateRef,
    candidateType: candidate.candidateType,
    entityRef: candidate.entityRef,
    entityVersionRef: candidate.entityVersionRef,
    patientLabel: candidate.patientLabel,
    decisionTier: candidate.decisionTier,
    patientSafetyBlocker,
    patientOwedAction,
    activeDependencyFailure,
    authoritativeDueAt,
    latestMeaningfulUpdateAt: candidate.latestMeaningfulUpdateAt,
    stableEntityRef,
    actionRef: candidate.actionRef ?? null,
    actionLabel: candidate.actionLabel ?? null,
    actionRouteRef: candidate.actionRouteRef ?? null,
    capabilityLeaseState,
    writableEligibilityState,
    visibilityAllowed,
    identityHoldClear,
    continuityClear,
    releaseTrustClear,
    recoveryOnly,
    visibilityState: exclusionReasons.length === 0 ? "visible" : "excluded",
    exclusionReasons,
    selectionTuple,
    selectionTupleHash: digest(selectionTuple),
  };
}

function compareSpotlightCandidates(
  left: PatientSpotlightCandidateProjection,
  right: PatientSpotlightCandidateProjection,
): number {
  return (
    PATIENT_SPOTLIGHT_TIER_ORDER[left.decisionTier] -
      PATIENT_SPOTLIGHT_TIER_ORDER[right.decisionTier] ||
    Number(right.patientSafetyBlocker) - Number(left.patientSafetyBlocker) ||
    Number(right.patientOwedAction) - Number(left.patientOwedAction) ||
    Number(right.activeDependencyFailure) - Number(left.activeDependencyFailure) ||
    compareOptionalDueAt(left.authoritativeDueAt, right.authoritativeDueAt) ||
    Date.parse(right.latestMeaningfulUpdateAt) - Date.parse(left.latestMeaningfulUpdateAt) ||
    left.stableEntityRef.localeCompare(right.stableEntityRef)
  );
}

function compareOptionalDueAt(left: string | null, right: string | null): number {
  if (left && right) return Date.parse(left) - Date.parse(right);
  if (left) return -1;
  if (right) return 1;
  return 0;
}

function buildQuietHomeDecision(input: {
  readonly input: ResolvePortalEntryInput;
  readonly coverage: PatientAudienceCoverageProjection;
  readonly consistency: PatientShellConsistencyProjection;
  readonly visibleCandidates: readonly PatientSpotlightCandidateProjection[];
  readonly excludedCandidates: readonly PatientSpotlightCandidateProjection[];
  readonly observedAt: string;
}): PatientQuietHomeDecision {
  const truthState = input.input.homeTruthState ?? "complete";
  const candidateSetEmpty = input.visibleCandidates.length === 0;
  let reason: PatientQuietHomeDecision["reason"] = "all_clear";
  if (!candidateSetEmpty) {
    reason = "candidate_present";
  } else if (input.coverage.surfaceState === "recovery_required") {
    reason = "blocked_by_recovery";
  } else if (input.coverage.surfaceState === "identity_hold") {
    reason = "blocked_by_identity_hold";
  } else if (
    truthState !== "complete" ||
    input.consistency.causalConsistencyState !== "consistent"
  ) {
    reason = "blocked_by_degraded_truth";
  } else if (input.excludedCandidates.some((candidate) => candidate.exclusionReasons.length > 0)) {
    reason = "blocked_by_visibility_or_actionability";
  }
  const eligible = candidateSetEmpty && reason === "all_clear";
  const blockedPreventionRefs = input.excludedCandidates
    .flatMap((candidate) =>
      candidate.exclusionReasons.map((reasonRef) => `${candidate.candidateRef}:${reasonRef}`),
    )
    .sort();
  return {
    projectionName: "PatientQuietHomeDecision",
    decisionRef: stableRef(
      "quiet_home_decision",
      `${input.coverage.patientAudienceCoverageProjectionId}:${truthState}:${reason}:${blockedPreventionRefs.join("|")}`,
    ),
    decisionTier: "quiet_home",
    eligible,
    reason,
    explanation: quietHomeExplanation(reason, eligible),
    gentlestSafeNextActionRef: eligible
      ? "review_request_summaries"
      : input.coverage.surfaceState === "identity_hold"
        ? "wait_for_identity_repair_release"
        : input.coverage.surfaceState === "recovery_required"
          ? "re_authenticate_or_resume_recovery"
          : "review_blocked_home_state",
    blockedPreventionRefs,
    candidateSetEmpty,
    queryTruthState: truthState,
    computedAt: input.observedAt,
  };
}

function quietHomeExplanation(
  reason: PatientQuietHomeDecision["reason"],
  eligible: boolean,
): string {
  if (eligible) {
    return "Quiet home is allowed because the candidate ladder is empty after complete, trusted projection assembly.";
  }
  switch (reason) {
    case "candidate_present":
      return "Quiet home is blocked because at least one visible spotlight candidate outranks the quiet state.";
    case "blocked_by_recovery":
      return "Quiet home is blocked because recovery-only continuity must be resolved before the home can claim all clear.";
    case "blocked_by_identity_hold":
      return "Quiet home is blocked because identity repair is active and PHI-bearing home content must remain suppressed.";
    case "blocked_by_degraded_truth":
      return "Quiet home is blocked because query, convergence, or fallback truth is not complete enough to declare no action.";
    case "blocked_by_visibility_or_actionability":
      return "Quiet home is blocked because excluded candidates still need visibility, lease, or writable eligibility repair.";
    case "all_clear":
      return "Quiet home is allowed.";
  }
}

function chooseSpotlightCandidate(input: {
  readonly current: PatientSpotlightDecisionProjection | null;
  readonly visibleCandidates: readonly PatientSpotlightCandidateProjection[];
  readonly observedAt: string;
  readonly windowMs?: number;
}): {
  readonly candidate: PatientSpotlightCandidateProjection | null;
  readonly useWindow: PatientSpotlightDecisionUseWindow;
} {
  const challenger = input.visibleCandidates[0] ?? null;
  const currentCandidate = input.current?.selectedCandidateRef
    ? (input.visibleCandidates.find(
        (candidate) => candidate.candidateRef === input.current?.selectedCandidateRef,
      ) ?? null)
    : null;
  const nowMs = Date.parse(input.observedAt);
  const currentWindow = input.current?.useWindow ?? null;
  const currentWindowActive =
    Boolean(currentCandidate && currentWindow) &&
    Date.parse(currentWindow?.windowExpiresAt ?? "") > nowMs;
  const challengerPreempts =
    Boolean(currentWindowActive && currentCandidate && challenger) &&
    PATIENT_SPOTLIGHT_TIER_ORDER[challenger?.decisionTier ?? "quiet_home"] <
      PATIENT_SPOTLIGHT_TIER_ORDER[currentCandidate?.decisionTier ?? "quiet_home"];
  const candidate =
    currentWindowActive && currentCandidate && !challengerPreempts ? currentCandidate : challenger;
  const state: PatientSpotlightDecisionUseWindow["state"] =
    currentWindowActive && currentCandidate && !challengerPreempts
      ? "preserved"
      : challengerPreempts
        ? "preempted_by_higher_tier"
        : input.current?.selectedCandidateRef
          ? "expired_revalidated"
          : candidate
            ? "new_selection"
            : "quiet_revalidated";
  const windowMs = input.windowMs ?? DEFAULT_SPOTLIGHT_USE_WINDOW_MS;
  const windowStartedAt =
    state === "preserved" && currentWindow ? currentWindow.windowStartedAt : input.observedAt;
  const windowExpiresAt =
    state === "preserved" && currentWindow
      ? currentWindow.windowExpiresAt
      : new Date(nowMs + windowMs).toISOString();
  const selectionTupleHash =
    candidate?.selectionTupleHash ??
    digest(["quiet_home", "no_visible_candidate", input.observedAt.slice(0, 10)]);
  return {
    candidate,
    useWindow: {
      projectionName: "PatientSpotlightDecisionUseWindow",
      state,
      selectedCandidateRef: candidate?.candidateRef ?? null,
      challengerCandidateRef: challenger?.candidateRef ?? null,
      challengerDecisionTier: challenger?.decisionTier ?? null,
      windowStartedAt,
      windowExpiresAt,
      explicitRevalidateAt: input.observedAt,
      selectionTupleHash,
      explanation: useWindowExplanation(state, currentCandidate, challenger),
    },
  };
}

function useWindowExplanation(
  state: PatientSpotlightDecisionUseWindow["state"],
  current: PatientSpotlightCandidateProjection | null,
  challenger: PatientSpotlightCandidateProjection | null,
): string {
  switch (state) {
    case "preserved":
      return `Current spotlight ${current?.candidateRef ?? "none"} stayed active because the challenger ${challenger?.candidateRef ?? "none"} did not outrank its tier.`;
    case "preempted_by_higher_tier":
      return `Challenger ${challenger?.candidateRef ?? "none"} preempted the active spotlight by higher decision tier.`;
    case "expired_revalidated":
      return "The previous use window expired or the current candidate no longer passed gates, so the ladder was re-ranked.";
    case "quiet_revalidated":
      return "No visible candidate passed the home spotlight gates during explicit revalidation.";
    case "new_selection":
      return `Candidate ${challenger?.candidateRef ?? "none"} opened a new spotlight use window.`;
  }
}

function buildSpotlightDecision(input: {
  readonly selectedCandidate: PatientSpotlightCandidateProjection | null;
  readonly visibleCandidates: readonly PatientSpotlightCandidateProjection[];
  readonly excludedCandidates: readonly PatientSpotlightCandidateProjection[];
  readonly useWindow: PatientSpotlightDecisionUseWindow;
  readonly quietHomeDecision: PatientQuietHomeDecision;
  readonly coverage: PatientAudienceCoverageProjection;
  readonly observedAt: string;
}): PatientSpotlightDecisionProjection {
  const selected = input.selectedCandidate;
  const decisionTier: PatientSpotlightDecisionTier =
    selected?.decisionTier ??
    (input.quietHomeDecision.eligible ? "quiet_home" : "dependency_repair");
  const selectedActionRef =
    selected?.capabilityLeaseState === "live" && selected.writableEligibilityState === "writable"
      ? selected.actionRef
      : null;
  const copy = spotlightCopyFor(selected, input.quietHomeDecision);
  return {
    projectionName: "PatientSpotlightDecisionProjection",
    decisionRef: stableRef(
      "spotlight_decision",
      `${input.coverage.patientAudienceCoverageProjectionId}:${input.useWindow.selectionTupleHash}:${decisionTier}`,
    ),
    decisionTier,
    selectedCandidateRef: selected?.candidateRef ?? null,
    selectedEntityRef: selected?.entityRef ?? null,
    selectedActionRef,
    selectedActionRouteRef: selectedActionRef ? (selected?.actionRouteRef ?? null) : null,
    selectedActionLabel: selectedActionRef ? (selected?.actionLabel ?? null) : null,
    headline: copy.headline,
    body: copy.body,
    singleDominantAction: true,
    candidateLadder: [...input.visibleCandidates, ...input.excludedCandidates],
    excludedCandidateRefs: input.excludedCandidates.map((candidate) => candidate.candidateRef),
    outrankedCandidateRefs: input.visibleCandidates
      .filter((candidate) => candidate.candidateRef !== selected?.candidateRef)
      .map((candidate) => candidate.candidateRef),
    useWindow: input.useWindow,
    quietHomeDecisionRef: input.quietHomeDecision.decisionRef,
    selectionTupleHash: input.useWindow.selectionTupleHash,
    sourceProjectionRefs: [
      "PatientAudienceCoverageProjection",
      "PatientSpotlightDecisionProjection",
      "PatientSpotlightDecisionUseWindow",
      "PatientQuietHomeDecision",
    ],
    reasonCodes: mergeReasonCodes(input.coverage.reasonCodes, [
      `PORTAL_210_${decisionTier.toUpperCase()}`,
    ]),
    computedAt: input.observedAt,
    createdByAuthority: AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME,
  };
}

function spotlightCopyFor(
  candidate: PatientSpotlightCandidateProjection | null,
  quietHomeDecision: PatientQuietHomeDecision,
): { readonly headline: string; readonly body: string } {
  if (!candidate) {
    return quietHomeDecision.eligible
      ? {
          headline: "No action is needed right now",
          body: "The home surface stays quiet because complete projection truth found no actionable request, dependency repair, callback, or account blocker.",
        }
      : {
          headline: "Home cannot be marked quiet yet",
          body: quietHomeDecision.explanation,
        };
  }
  switch (candidate.decisionTier) {
    case "urgent_safety":
      return {
        headline: "Urgent help is the safest next step",
        body: `${candidate.patientLabel} is shown first because the selected entity carries a patient-safety blocker.`,
      };
    case "patient_action":
      return {
        headline: "One action keeps this moving",
        body: `${candidate.patientLabel} is selected because it is owed by the patient and its capability lease is live.`,
      };
    case "dependency_repair":
      return {
        headline: "A dependency needs repair before this can move",
        body: `${candidate.patientLabel} is selected because an active dependency failure outranks passive updates.`,
      };
    case "watchful_attention":
      return {
        headline: "A current request is worth checking",
        body: `${candidate.patientLabel} is visible without creating dashboard noise or extra calls to action.`,
      };
    case "quiet_home":
      return {
        headline: "No action is needed right now",
        body: quietHomeDecision.explanation,
      };
  }
}

function buildNavUrgencyDigest(input: {
  readonly spotlightDecision: PatientSpotlightDecisionProjection;
  readonly quietHomeDecision: PatientQuietHomeDecision;
  readonly visibleCandidates: readonly PatientSpotlightCandidateProjection[];
  readonly observedAt: string;
}): PatientNavUrgencyDigest {
  const urgentCount = input.visibleCandidates.filter(
    (candidate) => candidate.decisionTier === "urgent_safety",
  ).length;
  const dependencyRepairCount = input.visibleCandidates.filter(
    (candidate) => candidate.decisionTier === "dependency_repair",
  ).length;
  const attentionCount = input.visibleCandidates.filter(
    (candidate) => candidate.decisionTier === "patient_action",
  ).length;
  const routeBadges = compactStrings([
    urgentCount > 0 ? "urgent_safety" : null,
    attentionCount > 0 ? "patient_action" : null,
    dependencyRepairCount > 0 ? "dependency_repair" : null,
  ]).map((tier) => ({
    routeRef: tier === "urgent_safety" ? "/v1/help/urgent" : "/v1/me/requests",
    label:
      tier === "urgent_safety"
        ? "Urgent"
        : tier === "patient_action"
          ? `${attentionCount} to do`
          : `${dependencyRepairCount} repair`,
    urgencyTier: tier as PatientSpotlightDecisionTier,
  }));
  return {
    projectionName: "PatientNavUrgencyDigest",
    digestRef: stableRef(
      "patient_nav_urgency_digest",
      `${input.spotlightDecision.decisionRef}:${routeBadges.map((badge) => badge.label).join("|")}`,
    ),
    urgentCount,
    attentionCount,
    dependencyRepairCount,
    quietHomeEligible: input.quietHomeDecision.eligible,
    dominantRouteRef: input.spotlightDecision.selectedActionRouteRef,
    urgentHelpRouteRef: "/v1/help/urgent",
    routeBadges,
    computedAt: input.observedAt,
  };
}

function buildNavReturnContract(input: {
  readonly spotlightDecision: PatientSpotlightDecisionProjection;
  readonly quietHomeDecision: PatientQuietHomeDecision;
  readonly coverage: PatientAudienceCoverageProjection;
}): PatientNavReturnContract {
  const continuityState: PatientNavReturnContract["continuityState"] =
    input.coverage.surfaceState === "recovery_required"
      ? "recovery_only"
      : input.coverage.surfaceState === "identity_hold"
        ? "blocked"
        : input.quietHomeDecision.eligible
          ? "quiet"
          : "preserved";
  return {
    projectionName: "PatientNavReturnContract",
    contractRef: stableRef(
      "patient_nav_return_contract",
      `${input.coverage.patientAudienceCoverageProjectionId}:${input.spotlightDecision.selectionTupleHash}`,
    ),
    originRouteRef: "/v1/me/home",
    returnRouteRef: input.spotlightDecision.selectedActionRouteRef ?? "/v1/me/home",
    selectedEntityRef: input.spotlightDecision.selectedEntityRef,
    selectedCandidateRef: input.spotlightDecision.selectedCandidateRef,
    tupleHash: digest({
      coverageProjectionRef: input.coverage.patientAudienceCoverageProjectionId,
      selectedCandidateRef: input.spotlightDecision.selectedCandidateRef,
      returnRouteRef: input.spotlightDecision.selectedActionRouteRef ?? "/v1/me/home",
    }),
    continuityState,
  };
}

function buildPortalNavigation(
  urgencyDigest: PatientNavUrgencyDigest,
): PatientPortalNavigationProjection {
  const requestBadge = urgencyDigest.routeBadges.find(
    (badge) => badge.routeRef === "/v1/me/requests",
  );
  return {
    projectionName: "PatientPortalNavigationProjection",
    activeRouteRef: "/v1/me/home",
    urgencyDigestRef: urgencyDigest.digestRef,
    items: [
      { id: "home", label: "Home", path: "/v1/me/home", badgeLabel: null, ariaCurrent: true },
      {
        id: "requests",
        label: "Requests",
        path: "/v1/me/requests",
        badgeLabel: requestBadge?.label ?? null,
        ariaCurrent: false,
      },
      {
        id: "messages",
        label: "Messages",
        path: "/v1/me/messages",
        badgeLabel: null,
        ariaCurrent: false,
      },
      {
        id: "account",
        label: "Account",
        path: "/v1/me/account",
        badgeLabel: null,
        ariaCurrent: false,
      },
    ],
  };
}

function isUrgentSafetyRequest(request: PortalSourceRequest): boolean {
  return /urgent|safety|red[-_ ]?flag/i.test(
    `${request.statusText} ${request.trustCueRef} ${request.patientSafeLabel}`,
  );
}

function isRequestVisibleUnderCoverage(
  coverage: PatientAudienceCoverageProjection,
  request: PortalSourceRequest,
  subjectRef: string,
): boolean {
  if (coverage.audienceTier === "patient_public") {
    return request.bucket !== "complete";
  }
  if (coverage.surfaceState === "identity_hold" || coverage.surfaceState === "recovery_required") {
    return request.ownerSubjectRef === subjectRef;
  }
  return request.ownerSubjectRef === subjectRef;
}

function buildSummaryProjection(
  request: PortalSourceRequest,
  coverage: PatientAudienceCoverageProjection,
  observedAt: string,
): PatientRequestSummaryProjection {
  const publicOnly = coverage.audienceTier === "patient_public";
  const suppressed =
    coverage.surfaceState === "identity_hold" ||
    coverage.communicationPreviewMode === "suppressed_recovery_only";
  const visibleFieldRefs = publicOnly
    ? ["requestRef", "statusText", "latestMeaningfulUpdateAt", "nextSafeActionRef"]
    : suppressed
      ? ["requestRef", "publicSafeLabel", "lastSafeSummaryRef"]
      : [
          "requestRef",
          "patientSafeLabel",
          "statusText",
          "awaitingParty",
          "latestMeaningfulUpdateAt",
          "nextSafeActionRef",
          "lineageCaseLinkRefs",
        ];
  const blockedFieldRefs = publicOnly
    ? ["communicationClusterRefs", "artifactRefs", "downstream.detail", "patientSafeLabel"]
    : suppressed
      ? ["communicationClusterRefs", "artifactRefs", "timelineProjectionRef", "dominantActionRef"]
      : [];
  return {
    summaryProjectionRef: stableRef(
      "patient_request_summary",
      `${coverage.patientAudienceCoverageProjectionId}:${request.requestRef}`,
    ),
    coverageProjectionRef: coverage.patientAudienceCoverageProjectionId,
    requestRef: request.requestRef,
    requestLineageRef: request.requestLineageRef,
    displayLabel: publicOnly || suppressed ? request.publicSafeLabel : request.patientSafeLabel,
    statusText: request.statusText,
    awaitingParty: request.awaitingParty,
    latestMeaningfulUpdateAt: request.latestMeaningfulUpdateAt,
    nextSafeActionRef:
      coverage.mutationAuthority === "none" ? "view_or_recover_only" : request.nextSafeActionRef,
    dominantActionRef:
      coverage.mutationAuthority === "route_bound_mutation" ? request.dominantActionRef : null,
    trustCueRef: request.trustCueRef,
    summarySafetyTier: publicOnly || suppressed ? "public_safe" : "patient_safe",
    visibleFieldRefs,
    blockedFieldRefs,
    surfaceState: coverage.surfaceState === "ready" ? "ready" : coverage.surfaceState,
    reasonCodes: coverage.reasonCodes,
    computedAt: observedAt,
  };
}

function buildLineageProjection(
  request: PortalSourceRequest,
  summary: PatientRequestSummaryProjection | undefined,
  coverage: PatientAudienceCoverageProjection,
  observedAt: string,
): PatientRequestLineageProjection {
  const visibleDownstream = request.downstream.filter((child) =>
    coverage.surfaceState === "ready" ? child.visibilityTier !== "suppressed" : true,
  );
  return {
    patientRequestLineageProjectionId: stableRef(
      "patient_request_lineage",
      `${coverage.patientAudienceCoverageProjectionId}:${request.requestLineageRef}`,
    ),
    coverageProjectionRef: coverage.patientAudienceCoverageProjectionId,
    requestRef: request.requestRef,
    requestLineageRef: request.requestLineageRef,
    summaryProjectionRef:
      summary?.summaryProjectionRef ?? stableRef("missing_summary", request.requestRef),
    detailProjectionRef: null,
    currentStageRef: request.statusText,
    lineageCaseLinkRefs: [...request.lineageCaseLinkRefs],
    downstreamProjectionRefs: visibleDownstream.map((child) =>
      stableRef("patient_downstream", `${request.requestRef}:${child.childRef}`),
    ),
    childObjects: visibleDownstream.map((child) => `${child.childType}:${child.childRef}`),
    requestReturnBundleRef: stableRef("patient_request_return_bundle", request.requestRef),
    nextActionProjectionRef: stableRef(
      "patient_next_action",
      `${coverage.patientAudienceCoverageProjectionId}:${request.requestRef}`,
    ),
    latestLineageCaseLinkRef: request.lineageCaseLinkRefs[0] ?? null,
    visiblePlaceholderRefs:
      coverage.surfaceState === "ready"
        ? []
        : visibleDownstream.map((child) => `placeholder:${child.childRef}`),
    awaitingParty: request.awaitingParty,
    safestNextActionRef:
      coverage.mutationAuthority === "route_bound_mutation"
        ? request.nextSafeActionRef
        : "view_or_recover_only",
    nextExpectedStepRef: request.nextSafeActionRef,
    lastConfirmedStepAt: request.latestMeaningfulUpdateAt,
    selectedChildAnchorRef: visibleDownstream[0]?.childRef ?? null,
    selectedChildAnchorTupleHash: digest(visibleDownstream[0]?.childRef ?? "none"),
    lineageTupleHash: digest({
      requestLineageRef: request.requestLineageRef,
      children: visibleDownstream.map((child) => child.childRef),
      coverageProjectionRef: coverage.patientAudienceCoverageProjectionId,
    }),
    visibilityState:
      coverage.surfaceState === "ready"
        ? "full"
        : coverage.surfaceState === "summary_only"
          ? "partial"
          : "placeholder_only",
    computedAt: observedAt,
  };
}

function buildRequestReturnBundle(input: {
  readonly input: {
    readonly selectedFilterRef?: PortalRequestBucket | "all";
    readonly scrollStateRef?: string | null;
  };
  readonly request: PortalSourceRequest;
  readonly coverage: PatientAudienceCoverageProjection;
  readonly lineage: PatientRequestLineageProjection;
  readonly observedAt: string;
  readonly disclosurePosture: PatientRequestReturnBundle["disclosurePosture"];
}): PatientRequestReturnBundle {
  const sameShellState: PatientRequestReturnBundle["sameShellState"] =
    input.coverage.surfaceState === "identity_hold"
      ? "identity_hold"
      : input.coverage.surfaceState === "recovery_required"
        ? "recovery_required"
        : input.coverage.mutationAuthority === "none"
          ? "read_only"
          : "preserved";
  return {
    projectionName: "PatientRequestReturnBundle",
    requestReturnBundleRef: stableRef("patient_request_return_bundle", input.request.requestRef),
    requestRef: input.request.requestRef,
    requestLineageRef: input.request.requestLineageRef,
    selectedAnchorRef: input.request.requestRef,
    selectedFilterRef: input.input.selectedFilterRef ?? input.request.bucket,
    disclosurePosture: input.disclosurePosture,
    scrollStateRef: input.input.scrollStateRef ?? null,
    returnRouteRef: `/v1/me/requests/${input.request.requestRef}`,
    selectedAnchorTupleHash: digest({
      requestRef: input.request.requestRef,
      requestLineageRef: input.request.requestLineageRef,
      coverageProjectionRef: input.coverage.patientAudienceCoverageProjectionId,
    }),
    lineageTupleHash: input.lineage.lineageTupleHash,
    continuityEvidenceRef: stableRef(
      "patient_experience_continuity",
      `${input.request.requestRef}:${input.coverage.patientAudienceCoverageProjectionId}`,
    ),
    sameShellState,
    computedAt: input.observedAt,
  };
}

function buildDownstreamProjections(input: {
  readonly request: PortalSourceRequest;
  readonly coverage: PatientAudienceCoverageProjection;
  readonly consistency: PatientShellConsistencyProjection;
  readonly returnBundle: PatientRequestReturnBundle;
  readonly observedAt: string;
}): readonly PatientRequestDownstreamProjection[] {
  return input.request.downstream
    .filter(
      (child) => input.coverage.surfaceState !== "ready" || child.visibilityTier !== "suppressed",
    )
    .sort(compareDownstream)
    .map((child, index) => {
      const placeholderPosture = placeholderPostureForDownstream(
        input.coverage,
        input.request,
        child,
      );
      const placeholderReasonRefs = placeholderReasonRefsForDownstream(
        input.coverage,
        input.request,
        child,
        placeholderPosture,
      );
      return {
        projectionName: "PatientRequestDownstreamProjection",
        downstreamProjectionRef: stableRef(
          "patient_downstream",
          `${input.request.requestRef}:${child.childRef}`,
        ),
        coverageProjectionRef: input.coverage.patientAudienceCoverageProjectionId,
        requestRef: input.request.requestRef,
        requestLineageRef: input.request.requestLineageRef,
        patientShellConsistencyRef: input.consistency.patientShellConsistencyRef,
        childType: child.childType,
        childRef: child.childRef,
        patientLabelRef: child.patientLabelRef,
        authoritativeState: child.authoritativeState,
        awaitingParty: child.awaitingParty,
        sortKey: `${String(index + 1).padStart(2, "0")}:${child.awaitingParty}:${child.lastMeaningfulUpdateAt}:${child.childRef}`,
        visibilityTier: child.visibilityTier,
        placeholderPosture,
        placeholderReasonRefs,
        nextSafeActionRef:
          placeholderPosture === "none"
            ? child.nextSafeActionRef
            : "open_governed_placeholder_or_recovery",
        childAnchorTupleHash: digest({
          childRef: child.childRef,
          requestLineageRef: input.request.requestLineageRef,
          returnBundleRef: input.returnBundle.requestReturnBundleRef,
        }),
        routeRef: `/v1/me/requests/${input.request.requestRef}/children/${child.childRef}`,
        computedAt: input.observedAt,
        createdByAuthority: AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME,
      };
    });
}

function compareDownstream(left: PortalSourceDownstream, right: PortalSourceDownstream): number {
  return (
    severityForDownstream(right) - severityForDownstream(left) ||
    Number(right.awaitingParty === "patient") - Number(left.awaitingParty === "patient") ||
    Date.parse(right.lastMeaningfulUpdateAt) - Date.parse(left.lastMeaningfulUpdateAt) ||
    left.childRef.localeCompare(right.childRef)
  );
}

function severityForDownstream(child: PortalSourceDownstream): number {
  if (/urgent|safety|red[-_ ]?flag/i.test(`${child.patientLabelRef} ${child.authoritativeState}`)) {
    return 4;
  }
  if (child.childType === "admin_repair" || child.authoritativeState.includes("repair")) return 3;
  if (child.awaitingParty === "patient") return 2;
  if (child.authoritativeState.includes("pending")) return 1;
  return 0;
}

function placeholderPostureForDownstream(
  coverage: PatientAudienceCoverageProjection,
  request: PortalSourceRequest,
  child: PortalSourceDownstream,
): PatientRequestDownstreamProjection["placeholderPosture"] {
  if (coverage.surfaceState === "identity_hold") return "identity_hold";
  if (coverage.surfaceState === "recovery_required") return "release_delay";
  if (coverage.communicationPreviewMode === "step_up_required") return "step_up_required";
  if (coverage.mutationAuthority !== "route_bound_mutation") return "read_only";
  if (child.visibilityTier === "suppressed") return "sibling_projection_missing";
  if (child.childType === "conversation_cluster" || child.childType === "callback_case") {
    const has212Projection =
      Boolean(request.moreInfoCycle) ||
      Boolean(request.callbackCases?.length) ||
      Boolean(request.reachability) ||
      Boolean(request.contactRepair) ||
      Boolean(request.consentCheckpoint);
    return has212Projection ? "none" : "sibling_projection_missing";
  }
  if (child.childType === "record_follow_up") {
    return "sibling_projection_missing";
  }
  return "none";
}

function placeholderReasonRefsForDownstream(
  coverage: PatientAudienceCoverageProjection,
  request: PortalSourceRequest,
  child: PortalSourceDownstream,
  posture: PatientRequestDownstreamProjection["placeholderPosture"],
): readonly string[] {
  if (posture === "none") return [];
  return compactStrings([
    posture,
    coverage.surfaceState === "identity_hold" ? "PORTAL_185_IDENTITY_HOLD" : null,
    coverage.surfaceState === "recovery_required" ? "PORTAL_185_SAME_SHELL_RECOVERY" : null,
    child.childType === "conversation_cluster" && !request.moreInfoCycle
      ? "PARALLEL_INTERFACE_GAP_CROSSCUTTING_REQUEST_CONTEXT"
      : null,
    child.childType === "callback_case" && !request.callbackCases?.length
      ? "PARALLEL_INTERFACE_GAP_CROSSCUTTING_REQUEST_CONTEXT"
      : null,
    child.childType === "record_follow_up" ? "PARALLEL_INTERFACE_GAP_CROSSCUTTING_RECORDS" : null,
  ]);
}

function buildSafetyInterruptionProjection(input: {
  readonly request: PortalSourceRequest;
  readonly coverage: PatientAudienceCoverageProjection;
  readonly returnBundle: PatientRequestReturnBundle;
  readonly observedAt: string;
}): PatientSafetyInterruptionProjection {
  const urgentFromText = isUrgentSafetyRequest(input.request);
  const surfaceState =
    input.request.safetyInterruptionState ??
    (urgentFromText ? "urgent_required" : ("clear" as PatientSafetyInterruptionState));
  const suppressedActionRefs =
    surfaceState === "clear"
      ? []
      : compactStrings([input.request.dominantActionRef, input.request.nextSafeActionRef]);
  return {
    projectionName: "PatientSafetyInterruptionProjection",
    safetyInterruptionProjectionRef: stableRef(
      "patient_safety_interruption",
      `${input.coverage.patientAudienceCoverageProjectionId}:${input.request.requestRef}:${surfaceState}`,
    ),
    coverageProjectionRef: input.coverage.patientAudienceCoverageProjectionId,
    requestRef: input.request.requestRef,
    requestLineageRef: input.request.requestLineageRef,
    surfaceState,
    interruptionReasonRef:
      input.request.safetyInterruptionReasonRef ??
      (surfaceState === "clear" ? null : `safety_interruption:${surfaceState}`),
    suppressedActionRefs,
    nextSafeActionRef:
      surfaceState === "urgent_required" ? "open_urgent_help" : "hold_action_in_shell",
    requestReturnBundleRef: input.returnBundle.requestReturnBundleRef,
    safetyDecisionEpochRef: stableRef(
      "safety_decision_epoch",
      `${input.request.requestRef}:${surfaceState}:${input.request.latestMeaningfulUpdateAt}`,
    ),
    computedAt: input.observedAt,
    createdByAuthority: AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME,
  };
}

function buildNextActionProjection(input: {
  readonly input: { readonly actionType?: PatientRequestActionType | null };
  readonly request: PortalSourceRequest;
  readonly coverage: PatientAudienceCoverageProjection;
  readonly returnBundle: PatientRequestReturnBundle;
  readonly downstream: readonly PatientRequestDownstreamProjection[];
  readonly safetyInterruption: PatientSafetyInterruptionProjection;
  readonly observedAt: string;
}): PatientNextActionProjection {
  const blockingDependencyRefs = input.downstream
    .filter((child) => child.placeholderPosture !== "none" || child.awaitingParty === "patient")
    .map((child) => child.downstreamProjectionRef);
  const requestedAction = input.input.actionType ?? input.request.preferredActionType ?? null;
  const actionType =
    input.safetyInterruption.surfaceState !== "clear"
      ? "none"
      : (requestedAction ?? inferActionType(input.request, input.downstream));
  const actionability = actionabilityFor(input.coverage, input.safetyInterruption, actionType);
  const dominantActionRef =
    actionability === "live"
      ? (input.request.dominantActionRef ?? input.request.nextSafeActionRef ?? actionType)
      : null;
  const nextActionProjectionRef = stableRef(
    "patient_next_action",
    `${input.coverage.patientAudienceCoverageProjectionId}:${input.request.requestRef}`,
  );
  return {
    projectionName: "PatientNextActionProjection",
    nextActionProjectionRef,
    coverageProjectionRef: input.coverage.patientAudienceCoverageProjectionId,
    requestRef: input.request.requestRef,
    requestLineageRef: input.request.requestLineageRef,
    governingObjectRef: input.request.requestRef,
    actionType,
    dominantActionRef,
    actionLabel: actionLabelFor(actionType, actionability),
    actionability,
    routingProjectionRef:
      actionType === "none"
        ? null
        : stableRef("patient_action_routing", `${nextActionProjectionRef}:${actionType}`),
    blockingDependencyRefs:
      actionability === "live"
        ? blockingDependencyRefs.filter((ref) => ref.includes("repair"))
        : blockingDependencyRefs,
    safetyInterruptionRef:
      input.safetyInterruption.surfaceState === "clear"
        ? null
        : input.safetyInterruption.safetyInterruptionProjectionRef,
    requestReturnBundleRef: input.returnBundle.requestReturnBundleRef,
    reasonCodes: nextActionReasonCodes(input.coverage, input.safetyInterruption, actionability),
    computedAt: input.observedAt,
  };
}

function inferActionType(
  request: PortalSourceRequest,
  downstream: readonly PatientRequestDownstreamProjection[],
): PatientRequestActionType {
  const repair = downstream.find((child) => child.childType === "admin_repair");
  if (repair) return "contact_route_repair";
  const patientConversation = downstream.find(
    (child) =>
      child.awaitingParty === "patient" &&
      (child.childType === "conversation_cluster" || child.childType === "callback_case"),
  );
  if (patientConversation?.childType === "callback_case") return "callback_response";
  if (patientConversation) return "respond_more_info";
  const record = downstream.find((child) => child.childType === "record_follow_up");
  if (record) return "record_follow_up";
  if (request.awaitingParty === "patient") return "respond_more_info";
  return request.nextSafeActionRef ? "view_request" : "none";
}

function actionabilityFor(
  coverage: PatientAudienceCoverageProjection,
  safetyInterruption: PatientSafetyInterruptionProjection,
  actionType: PatientRequestActionType,
): PatientRequestActionabilityState {
  if (coverage.surfaceState === "recovery_required") return "recovery_required";
  if (safetyInterruption.surfaceState !== "clear") return "blocked";
  if (actionType === "none") return "read_only";
  if (coverage.mutationAuthority === "route_bound_mutation") return "live";
  if (coverage.surfaceState === "identity_hold") return "blocked";
  return "read_only";
}

function actionLabelFor(
  actionType: PatientRequestActionType,
  actionability: PatientRequestActionabilityState,
): string {
  if (actionability === "blocked") return "Action paused";
  if (actionability === "recovery_required") return "Resume safely";
  if (actionability === "read_only") return "View request";
  switch (actionType) {
    case "respond_more_info":
      return "Reply to request";
    case "callback_response":
      return "Respond to callback";
    case "contact_route_repair":
      return "Repair contact route";
    case "renew_consent":
      return "Review consent";
    case "record_follow_up":
      return "Review record update";
    case "view_request":
      return "View request";
    case "recover_session":
      return "Resume safely";
    case "none":
      return "No action";
  }
}

function nextActionReasonCodes(
  coverage: PatientAudienceCoverageProjection,
  safetyInterruption: PatientSafetyInterruptionProjection,
  actionability: PatientRequestActionabilityState,
): readonly string[] {
  return mergeReasonCodes(coverage.reasonCodes, [
    `PORTAL_211_ACTIONABILITY_${actionability.toUpperCase()}`,
    ...(safetyInterruption.surfaceState === "clear"
      ? []
      : [`PORTAL_211_SAFETY_${safetyInterruption.surfaceState.toUpperCase()}`]),
  ]);
}

function buildActionRoutingProjection(input: {
  readonly input: Pick<GetPatientRequestDetailInput, "routeFamilyRef">;
  readonly request: PortalSourceRequest;
  readonly coverage: PatientAudienceCoverageProjection;
  readonly consistency: PatientShellConsistencyProjection;
  readonly returnBundle: PatientRequestReturnBundle;
  readonly nextAction: PatientNextActionProjection;
  readonly safetyInterruption: PatientSafetyInterruptionProjection;
  readonly observedAt: string;
}): PatientActionRoutingProjection {
  const blockedReasonRef =
    input.nextAction.actionability === "live"
      ? null
      : input.safetyInterruption.surfaceState !== "clear"
        ? input.safetyInterruption.safetyInterruptionProjectionRef
        : input.coverage.surfaceState === "identity_hold"
          ? "identity_hold"
          : input.coverage.surfaceState === "recovery_required"
            ? "recovery_required"
            : "read_only_or_step_up_required";
  const actionRoutingProjectionRef =
    input.nextAction.routingProjectionRef ??
    stableRef("patient_action_routing", `${input.nextAction.nextActionProjectionRef}:blocked`);
  return {
    projectionName: "PatientActionRoutingProjection",
    actionRoutingProjectionRef,
    coverageProjectionRef: input.coverage.patientAudienceCoverageProjectionId,
    governingObjectRef: input.request.requestRef,
    governingObjectVersionRef: input.request.requestVersionRef,
    routeFamilyRef: input.input.routeFamilyRef,
    routeIntentBindingRef: input.request.routeIntentBindingRef,
    capabilityLeaseRef: stableRef(
      "capability_lease",
      `${input.request.requestRef}:${input.nextAction.actionType}:${input.coverage.mutationAuthority}`,
    ),
    writableEligibilityFenceRef:
      input.nextAction.actionability === "live"
        ? stableRef("writable_eligibility_fence", input.request.requestRef)
        : "writable_fence_closed_211",
    policyBundleRef: `patient_action_policy:${input.nextAction.actionType}:${input.coverage.audienceTier}`,
    requestReturnBundleRef: input.returnBundle.requestReturnBundleRef,
    continuityEvidenceRef: input.returnBundle.continuityEvidenceRef,
    freshnessToken: digest({
      shellConsistencyRef: input.consistency.patientShellConsistencyRef,
      requestVersionRef: input.request.requestVersionRef,
      commandConsistencyState: input.request.commandConsistencyState,
    }),
    actionType: input.nextAction.actionType,
    routeTargetRef: blockedReasonRef
      ? null
      : routeTargetForAction(input.request, input.nextAction.actionType),
    blockedReasonRef,
    safetyInterruptionRef:
      input.safetyInterruption.surfaceState === "clear"
        ? null
        : input.safetyInterruption.safetyInterruptionProjectionRef,
    computedAt: input.observedAt,
    createdByAuthority: AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME,
  };
}

function routeTargetForAction(
  request: PortalSourceRequest,
  actionType: PatientRequestActionType,
): string | null {
  switch (actionType) {
    case "respond_more_info":
      return `/v1/me/requests/${request.requestRef}/more-info`;
    case "callback_response":
      return `/v1/me/requests/${request.requestRef}/callback`;
    case "contact_route_repair":
      return `/v1/me/requests/${request.requestRef}/contact-repair`;
    case "renew_consent":
      return `/v1/me/requests/${request.requestRef}/consent`;
    case "record_follow_up":
      return `/v1/me/requests/${request.requestRef}/records`;
    case "view_request":
      return `/v1/me/requests/${request.requestRef}`;
    case "recover_session":
      return "/v1/me/recovery/current";
    case "none":
      return null;
  }
}

function buildActionSettlementProjection(input: {
  readonly input: Pick<GetPatientRequestDetailInput, "actionSettlementState">;
  readonly request: PortalSourceRequest;
  readonly coverage: PatientAudienceCoverageProjection;
  readonly routing: PatientActionRoutingProjection;
  readonly returnBundle: PatientRequestReturnBundle;
  readonly observedAt: string;
}): PatientActionSettlementProjection {
  const authoritativeOutcomeState =
    input.input.actionSettlementState ??
    input.request.actionSettlementState ??
    (input.coverage.surfaceState === "recovery_required" || input.routing.blockedReasonRef
      ? "disputed_recovery_required"
      : input.request.commandConsistencyState === "pending"
        ? "pending_authoritative_confirmation"
        : input.request.bucket === "complete"
          ? "authoritative_outcome_settled"
          : "local_acknowledged");
  const sameShellState: PatientActionSettlementProjection["sameShellState"] =
    authoritativeOutcomeState === "authoritative_outcome_settled"
      ? "settled"
      : authoritativeOutcomeState === "disputed_recovery_required"
        ? "recovery_required"
        : "pending";
  return {
    projectionName: "PatientActionSettlementProjection",
    actionSettlementProjectionRef: stableRef(
      "patient_action_settlement",
      `${input.routing.actionRoutingProjectionRef}:${authoritativeOutcomeState}`,
    ),
    actionRoutingProjectionRef: input.routing.actionRoutingProjectionRef,
    governingObjectRef: input.request.requestRef,
    localAckState:
      authoritativeOutcomeState === "local_acknowledged" ||
      authoritativeOutcomeState === "pending_authoritative_confirmation" ||
      authoritativeOutcomeState === "external_observation_received" ||
      authoritativeOutcomeState === "authoritative_outcome_settled"
        ? "acknowledged"
        : "none",
    processingAcceptanceState:
      authoritativeOutcomeState === "pending_authoritative_confirmation"
        ? "pending"
        : authoritativeOutcomeState === "local_acknowledged"
          ? "not_started"
          : "accepted",
    externalObservationState:
      authoritativeOutcomeState === "external_observation_received"
        ? "received"
        : authoritativeOutcomeState === "disputed_recovery_required"
          ? "disputed"
          : "none",
    authoritativeOutcomeState,
    sameShellState,
    recoveryEnvelopeRef:
      sameShellState === "recovery_required"
        ? stableRef("patient_action_recovery_envelope", input.request.requestRef)
        : null,
    requestReturnBundleRef: input.returnBundle.requestReturnBundleRef,
    settledAt: sameShellState === "settled" ? input.observedAt : null,
    computedAt: input.observedAt,
    createdByAuthority: AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME,
  };
}

function buildMoreInfoCallbackRepairFamily(input: {
  readonly input: BuildPatientAudienceCoverageInput;
  readonly request: PortalSourceRequest;
  readonly coverage: PatientAudienceCoverageProjection;
  readonly requestReturnBundle: PatientRequestReturnBundle;
  readonly observedAt: string;
}): {
  readonly moreInfoStatus: PatientMoreInfoStatusProjection;
  readonly responseThread: PatientMoreInfoResponseThreadProjection;
  readonly callbackStatuses: readonly PatientCallbackStatusProjection[];
  readonly reachabilitySummary: PatientReachabilitySummaryProjection;
  readonly contactRepair: PatientContactRepairProjection | null;
  readonly consentCheckpoint: PatientConsentCheckpointProjection | null;
} {
  const reachabilitySummary = buildReachabilitySummaryProjection(input);
  const contactRepair = buildContactRepairProjection({
    ...input,
    reachabilitySummary,
  });
  const consentCheckpoint = buildConsentCheckpointProjection(input);
  const moreInfoStatus = buildMoreInfoStatusProjection({
    ...input,
    reachabilitySummary,
    contactRepair,
    consentCheckpoint,
  });
  const responseThread = buildMoreInfoResponseThreadProjection({
    ...input,
    moreInfoStatus,
  });
  const callbackStatuses = (input.request.callbackCases ?? []).map((callbackCase) =>
    buildCallbackStatusProjection({
      ...input,
      callbackCase,
      reachabilitySummary,
      contactRepair,
    }),
  );
  return {
    moreInfoStatus,
    responseThread,
    callbackStatuses,
    reachabilitySummary,
    contactRepair,
    consentCheckpoint,
  };
}

function buildReachabilitySummaryProjection(input: {
  readonly request: PortalSourceRequest;
  readonly coverage: PatientAudienceCoverageProjection;
  readonly requestReturnBundle: PatientRequestReturnBundle;
  readonly observedAt: string;
}): PatientReachabilitySummaryProjection {
  const source = input.request.reachability ?? defaultReachabilityForRequest(input.request);
  const currentRouteSafe =
    source.summaryState === "clear" &&
    source.routeAuthorityState === "current" &&
    source.deliveryRiskState !== "likely_failed" &&
    source.deliveryRiskState !== "disputed";
  return {
    projectionName: "PatientReachabilitySummaryProjection",
    reachabilitySummaryProjectionRef: stableRef(
      "patient_reachability_summary",
      `${input.coverage.patientAudienceCoverageProjectionId}:${input.request.requestRef}:${source.reachabilityAssessmentRef}`,
    ),
    coverageProjectionRef: input.coverage.patientAudienceCoverageProjectionId,
    requestRef: input.request.requestRef,
    requestLineageRef: input.request.requestLineageRef,
    reachabilityAssessmentRef: source.reachabilityAssessmentRef,
    contactRouteSnapshotRef: source.contactRouteSnapshotRef,
    summaryState: source.summaryState,
    routeAuthorityState: source.routeAuthorityState,
    deliveryRiskState: source.deliveryRiskState,
    activeDependencyRef: source.activeDependencyRef ?? null,
    affectedRouteRefs: source.affectedRouteRefs,
    dominantRepairActionRef: currentRouteSafe ? null : "contact_route_repair",
    currentRouteSafe,
    publicSafeSummaryRef: stableRef(
      "reachability_public_safe_summary",
      `${source.summaryState}:${source.routeAuthorityState}:${source.deliveryRiskState}`,
    ),
    latestObservationAt: source.latestObservationAt,
    requestReturnBundleRef: input.requestReturnBundle.requestReturnBundleRef,
    continuityEvidenceRef: input.requestReturnBundle.continuityEvidenceRef,
    computedAt: input.observedAt,
    createdByAuthority: AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME,
  };
}

function buildContactRepairProjection(input: {
  readonly request: PortalSourceRequest;
  readonly coverage: PatientAudienceCoverageProjection;
  readonly requestReturnBundle: PatientRequestReturnBundle;
  readonly reachabilitySummary: PatientReachabilitySummaryProjection;
  readonly observedAt: string;
}): PatientContactRepairProjection | null {
  const source =
    input.request.contactRepair ??
    (input.reachabilitySummary.currentRouteSafe
      ? null
      : defaultContactRepairForRequest(input.request, input.reachabilitySummary));
  if (!source || source.repairState === "not_required") return null;
  const sameShellState: PatientContactRepairProjection["sameShellState"] =
    source.repairState === "applied"
      ? "released"
      : source.repairState === "rebound_pending"
        ? "rebound_pending"
        : source.repairState === "verification_pending"
          ? "verification_pending"
          : "repair_active";
  return {
    projectionName: "PatientContactRepairProjection",
    contactRepairProjectionRef: stableRef(
      "patient_contact_repair",
      `${input.coverage.patientAudienceCoverageProjectionId}:${input.request.requestRef}:${source.repairCaseRef}`,
    ),
    coverageProjectionRef: input.coverage.patientAudienceCoverageProjectionId,
    requestRef: input.request.requestRef,
    requestLineageRef: input.request.requestLineageRef,
    repairCaseRef: source.repairCaseRef,
    contactRepairJourneyRef: source.contactRepairJourneyRef,
    repairState: source.repairState,
    blockedActionRef: source.blockedActionRef,
    blockedContextRef: source.blockedContextRef,
    preservedBlockedActionSummaryRef: stableRef(
      "blocked_contact_action_summary",
      `${source.blockedContextRef}:${source.blockedActionRef}`,
    ),
    verificationCheckpointRef: source.verificationCheckpointRef ?? null,
    resultingReachabilityAssessmentRef: source.resultingReachabilityAssessmentRef ?? null,
    dominantActionRef: sameShellState === "released" ? null : "contact_route_repair",
    repairRouteRef: source.repairRouteRef ?? `/v1/me/contact-repair/${source.repairCaseRef}`,
    requestReturnBundleRef: input.requestReturnBundle.requestReturnBundleRef,
    continuityEvidenceRef: input.requestReturnBundle.continuityEvidenceRef,
    sameShellState,
    computedAt: input.observedAt,
    createdByAuthority: AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME,
  };
}

function buildConsentCheckpointProjection(input: {
  readonly request: PortalSourceRequest;
  readonly coverage: PatientAudienceCoverageProjection;
  readonly requestReturnBundle: PatientRequestReturnBundle;
  readonly observedAt: string;
}): PatientConsentCheckpointProjection | null {
  const source = input.request.consentCheckpoint ?? null;
  if (!source || source.surfaceState === "satisfied") return null;
  return {
    projectionName: "PatientConsentCheckpointProjection",
    consentCheckpointProjectionRef: stableRef(
      "patient_consent_checkpoint",
      `${input.coverage.patientAudienceCoverageProjectionId}:${input.request.requestRef}:${source.checkpointRef}`,
    ),
    coverageProjectionRef: input.coverage.patientAudienceCoverageProjectionId,
    requestRef: input.request.requestRef,
    requestLineageRef: input.request.requestLineageRef,
    checkpointRef: source.checkpointRef,
    checkpointClass: source.checkpointClass,
    surfaceState: source.surfaceState,
    blockedActionRef: source.blockedActionRef,
    blockedContextRef: source.blockedContextRef,
    consentGrantRef: source.consentGrantRef ?? null,
    renewalRouteRef: source.renewalRouteRef ?? null,
    selectionBindingHash: source.selectionBindingHash ?? null,
    dominantActionRef:
      source.surfaceState === "required" ||
      source.surfaceState === "expired" ||
      source.surfaceState === "renewal_pending"
        ? "renew_consent"
        : "recover_session",
    requestReturnBundleRef: input.requestReturnBundle.requestReturnBundleRef,
    continuityEvidenceRef: input.requestReturnBundle.continuityEvidenceRef,
    reasonCodes: [
      `PORTAL_212_CONSENT_${source.surfaceState.toUpperCase()}`,
      `PORTAL_212_CHECKPOINT_${source.checkpointClass.toUpperCase()}`,
    ],
    computedAt: input.observedAt,
    createdByAuthority: AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME,
  };
}

function buildMoreInfoStatusProjection(input: {
  readonly request: PortalSourceRequest;
  readonly coverage: PatientAudienceCoverageProjection;
  readonly requestReturnBundle: PatientRequestReturnBundle;
  readonly reachabilitySummary: PatientReachabilitySummaryProjection;
  readonly contactRepair: PatientContactRepairProjection | null;
  readonly consentCheckpoint: PatientConsentCheckpointProjection | null;
  readonly observedAt: string;
}): PatientMoreInfoStatusProjection {
  const cycle = input.request.moreInfoCycle ?? defaultMoreInfoCycleForRequest(input.request);
  const answerabilityState = moreInfoAnswerabilityFor({
    coverage: input.coverage,
    cycle,
    reachabilitySummary: input.reachabilitySummary,
    contactRepair: input.contactRepair,
    consentCheckpoint: input.consentCheckpoint,
  });
  const dominantActionRef = dominantMoreInfoActionFor(answerabilityState, cycle);
  const blockerRefs = compactStrings([
    input.reachabilitySummary.currentRouteSafe
      ? null
      : input.reachabilitySummary.reachabilitySummaryProjectionRef,
    input.contactRepair?.contactRepairProjectionRef,
    input.consentCheckpoint?.consentCheckpointProjectionRef,
    answerabilityState === "expired_recovery" ? cycle.replyWindowCheckpointRef : null,
  ]);
  return {
    projectionName: "PatientMoreInfoStatusProjection",
    moreInfoStatusProjectionRef: stableRef(
      "patient_more_info_status",
      `${input.coverage.patientAudienceCoverageProjectionId}:${input.request.requestRef}:${cycle.cycleRef}:${cycle.state}`,
    ),
    coverageProjectionRef: input.coverage.patientAudienceCoverageProjectionId,
    requestRef: input.request.requestRef,
    requestLineageRef: input.request.requestLineageRef,
    activeCycleRef: cycle.cycleRef,
    cycleVersionRef: cycle.cycleVersionRef,
    promptStackRef: cycle.promptStackRef,
    cycleState: cycle.state,
    replyWindowCheckpointRef: cycle.replyWindowCheckpointRef,
    lateReviewWindowRef: cycle.lateReviewWindowRef,
    dueAt: cycle.dueAt,
    expiresAt: cycle.expiresAt,
    authoritativeReceiptRef: cycle.authoritativeReceiptRef ?? null,
    secureLinkGrantRef: cycle.secureLinkGrantRef ?? null,
    answerabilityState,
    dominantActionRef,
    reachabilitySummaryProjectionRef: input.reachabilitySummary.reachabilitySummaryProjectionRef,
    contactRepairProjectionRef: input.contactRepair?.contactRepairProjectionRef ?? null,
    consentCheckpointProjectionRef: input.consentCheckpoint?.consentCheckpointProjectionRef ?? null,
    blockerRefs,
    publicSafeSummaryRef: stableRef(
      "more_info_public_safe_summary",
      `${cycle.cycleRef}:${cycle.state}:${answerabilityState}`,
    ),
    requestReturnBundleRef: input.requestReturnBundle.requestReturnBundleRef,
    continuityEvidenceRef:
      cycle.continuityEvidenceRef ?? input.requestReturnBundle.continuityEvidenceRef,
    reasonCodes: mergeReasonCodes(input.coverage.reasonCodes, [
      `PORTAL_212_MORE_INFO_${cycle.state.toUpperCase()}`,
      `PORTAL_212_ANSWERABILITY_${answerabilityState.toUpperCase()}`,
    ]),
    computedAt: input.observedAt,
    createdByAuthority: AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME,
  };
}

function buildMoreInfoResponseThreadProjection(input: {
  readonly request: PortalSourceRequest;
  readonly coverage: PatientAudienceCoverageProjection;
  readonly requestReturnBundle: PatientRequestReturnBundle;
  readonly moreInfoStatus: PatientMoreInfoStatusProjection;
  readonly observedAt: string;
}): PatientMoreInfoResponseThreadProjection {
  const cycle = input.request.moreInfoCycle ?? defaultMoreInfoCycleForRequest(input.request);
  const maskingTier: PortalSummarySafetyTier =
    input.coverage.audienceTier === "patient_public" ||
    input.moreInfoStatus.answerabilityState === "public_safe_placeholder"
      ? "public_safe"
      : "patient_safe";
  const orderedPromptItems = cycle.promptItems.map((prompt, index) => {
    const blocked =
      input.moreInfoStatus.answerabilityState !== "answerable" && prompt.state !== "answered";
    return {
      promptRef: prompt.promptRef,
      promptLabelRef: prompt.promptLabelRef,
      state: blocked ? ("blocked" as PatientMoreInfoPromptState) : prompt.state,
      focusable:
        input.moreInfoStatus.answerabilityState === "answerable" &&
        prompt.state === "unanswered" &&
        cycle.promptItems.findIndex((item) => item.state === "unanswered") === index,
      requiredEvidenceRefs: prompt.requiredEvidenceRefs ?? [],
      visibilityTier:
        maskingTier === "public_safe" ? "placeholder_only" : (prompt.visibilityTier ?? "full"),
      answerReceiptRef: prompt.answerReceiptRef ?? null,
    };
  });
  return {
    projectionName: "PatientMoreInfoResponseThreadProjection",
    responseThreadProjectionRef: stableRef(
      "patient_more_info_response_thread",
      `${input.moreInfoStatus.moreInfoStatusProjectionRef}:${cycle.promptStackRef}`,
    ),
    moreInfoStatusProjectionRef: input.moreInfoStatus.moreInfoStatusProjectionRef,
    coverageProjectionRef: input.coverage.patientAudienceCoverageProjectionId,
    requestRef: input.request.requestRef,
    requestLineageRef: input.request.requestLineageRef,
    activeCycleRef: cycle.cycleRef,
    promptStackRef: cycle.promptStackRef,
    threadTupleHash: digest({
      cycleRef: cycle.cycleRef,
      cycleVersionRef: cycle.cycleVersionRef,
      prompts: orderedPromptItems.map((item) => `${item.promptRef}:${item.state}`),
      continuityEvidenceRef: input.moreInfoStatus.continuityEvidenceRef,
    }),
    orderedPromptItems,
    currentFocusablePromptRef:
      orderedPromptItems.find((prompt) => prompt.focusable)?.promptRef ?? null,
    answerabilityState: input.moreInfoStatus.answerabilityState,
    visibilityTier: maskingTier === "public_safe" ? "placeholder_only" : "full",
    maskingTier,
    dominantActionRef: input.moreInfoStatus.dominantActionRef,
    receiptSummaryRef: cycle.authoritativeReceiptRef ?? null,
    requestReturnBundleRef: input.requestReturnBundle.requestReturnBundleRef,
    continuityEvidenceRef: input.moreInfoStatus.continuityEvidenceRef,
    surfaceState:
      input.moreInfoStatus.answerabilityState === "answerable"
        ? "ready"
        : input.moreInfoStatus.answerabilityState === "public_safe_placeholder"
          ? "summary_only"
          : input.moreInfoStatus.answerabilityState === "expired_recovery"
            ? "recovery_required"
            : "read_only",
    reasonCodes: input.moreInfoStatus.reasonCodes,
    computedAt: input.observedAt,
    createdByAuthority: AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME,
  };
}

function buildCallbackStatusProjection(input: {
  readonly request: PortalSourceRequest;
  readonly coverage: PatientAudienceCoverageProjection;
  readonly requestReturnBundle: PatientRequestReturnBundle;
  readonly callbackCase: PortalSourceCallbackCase;
  readonly reachabilitySummary: PatientReachabilitySummaryProjection;
  readonly contactRepair: PatientContactRepairProjection | null;
  readonly observedAt: string;
}): PatientCallbackStatusProjection {
  const routeRepairRequiredState =
    input.callbackCase.patientVisibleState === "route_repair_required" ||
    input.callbackCase.windowRiskState === "repair_required" ||
    !input.reachabilitySummary.currentRouteSafe ||
    Boolean(input.contactRepair && input.contactRepair.repairState !== "applied");
  return {
    projectionName: "PatientCallbackStatusProjection",
    callbackStatusProjectionRef: stableRef(
      "patient_callback_status",
      `${input.coverage.patientAudienceCoverageProjectionId}:${input.callbackCase.callbackCaseRef}:${input.callbackCase.monotoneRevision}`,
    ),
    coverageProjectionRef: input.coverage.patientAudienceCoverageProjectionId,
    requestRef: input.request.requestRef,
    requestLineageRef: input.request.requestLineageRef,
    clusterRef: input.callbackCase.clusterRef,
    callbackCaseRef: input.callbackCase.callbackCaseRef,
    callbackCaseVersionRef: input.callbackCase.callbackCaseVersionRef,
    expectationEnvelopeRef: input.callbackCase.expectationEnvelopeRef,
    outcomeEvidenceBundleRef: input.callbackCase.outcomeEvidenceBundleRef ?? null,
    resolutionGateRef: input.callbackCase.resolutionGateRef ?? null,
    patientVisibleState: routeRepairRequiredState
      ? "route_repair_required"
      : input.callbackCase.patientVisibleState,
    windowRiskState: routeRepairRequiredState
      ? "repair_required"
      : input.callbackCase.windowRiskState,
    windowLowerAt: input.callbackCase.windowLowerAt,
    windowUpperAt: input.callbackCase.windowUpperAt,
    stateConfidenceBand: input.callbackCase.stateConfidenceBand,
    monotoneRevision: input.callbackCase.monotoneRevision,
    routeRepairRequiredState,
    dominantActionRef: routeRepairRequiredState
      ? "contact_route_repair"
      : input.callbackCase.patientVisibleState === "closed"
        ? null
        : "callback_response",
    reachabilitySummaryProjectionRef: input.reachabilitySummary.reachabilitySummaryProjectionRef,
    contactRepairProjectionRef: input.contactRepair?.contactRepairProjectionRef ?? null,
    requestShellRouteRef: `/v1/me/requests/${input.request.requestRef}/callback/${input.callbackCase.callbackCaseRef}`,
    messageShellRouteRef: `/v1/me/messages/${input.callbackCase.clusterRef}/callback/${input.callbackCase.callbackCaseRef}`,
    requestReturnBundleRef: input.requestReturnBundle.requestReturnBundleRef,
    continuityEvidenceRef:
      input.callbackCase.continuityEvidenceRef ?? input.requestReturnBundle.continuityEvidenceRef,
    authoritativeBasisRefs: compactStrings([
      input.callbackCase.expectationEnvelopeRef,
      input.callbackCase.outcomeEvidenceBundleRef,
      input.callbackCase.resolutionGateRef,
    ]),
    computedAt: input.observedAt,
    createdByAuthority: AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME,
  };
}

function moreInfoAnswerabilityFor(input: {
  readonly coverage: PatientAudienceCoverageProjection;
  readonly cycle: PortalSourceMoreInfoCycle;
  readonly reachabilitySummary: PatientReachabilitySummaryProjection;
  readonly contactRepair: PatientContactRepairProjection | null;
  readonly consentCheckpoint: PatientConsentCheckpointProjection | null;
}): PatientMoreInfoAnswerabilityState {
  if (input.coverage.audienceTier === "patient_public") return "public_safe_placeholder";
  if (input.consentCheckpoint && input.consentCheckpoint.surfaceState !== "satisfied") {
    return "blocked_by_consent";
  }
  if (
    !input.reachabilitySummary.currentRouteSafe ||
    (input.contactRepair && input.contactRepair.repairState !== "applied")
  ) {
    return "blocked_by_repair";
  }
  if (input.cycle.state === "expired" || input.cycle.state === "superseded") {
    return "expired_recovery";
  }
  if (
    input.cycle.state === "reply_submitted" ||
    input.cycle.state === "awaiting_review" ||
    input.cycle.state === "accepted_late_review" ||
    input.cycle.state === "read_only"
  ) {
    return "submitted_read_only";
  }
  if (input.cycle.state === "repair_required") return "blocked_by_repair";
  if (input.coverage.mutationAuthority !== "route_bound_mutation") return "submitted_read_only";
  return "answerable";
}

function dominantMoreInfoActionFor(
  answerability: PatientMoreInfoAnswerabilityState,
  cycle: PortalSourceMoreInfoCycle,
): PatientRequestActionType | null {
  switch (answerability) {
    case "answerable":
      return cycle.state === "reply_needed" ? "respond_more_info" : null;
    case "blocked_by_repair":
      return "contact_route_repair";
    case "blocked_by_consent":
      return "renew_consent";
    case "expired_recovery":
      return "recover_session";
    case "submitted_read_only":
    case "public_safe_placeholder":
      return null;
  }
}

function actionTypeForChildRouteFamily(input: {
  readonly moreInfoStatus: PatientMoreInfoStatusProjection;
  readonly callbackStatuses: readonly PatientCallbackStatusProjection[];
  readonly contactRepair: PatientContactRepairProjection | null;
  readonly consentCheckpoint: PatientConsentCheckpointProjection | null;
}): PatientRequestActionType {
  if (input.contactRepair?.dominantActionRef === "contact_route_repair") {
    return "contact_route_repair";
  }
  if (input.consentCheckpoint?.dominantActionRef === "renew_consent") {
    return "renew_consent";
  }
  if (input.moreInfoStatus.dominantActionRef) {
    return input.moreInfoStatus.dominantActionRef as PatientRequestActionType;
  }
  const callbackAction = input.callbackStatuses.find((status) => status.dominantActionRef);
  return (callbackAction?.dominantActionRef as PatientRequestActionType | null) ?? "view_request";
}

function defaultMoreInfoCycleForRequest(request: PortalSourceRequest): PortalSourceMoreInfoCycle {
  return {
    cycleRef: stableRef("more_info_cycle", `${request.requestRef}:none`),
    cycleVersionRef: `${request.requestVersionRef}:more_info_none`,
    promptStackRef: stableRef("more_info_prompt_stack", `${request.requestRef}:none`),
    state: request.awaitingParty === "patient" ? "reply_needed" : "read_only",
    replyWindowCheckpointRef: stableRef("reply_window_checkpoint", request.requestRef),
    lateReviewWindowRef: null,
    dueAt: null,
    expiresAt: null,
    authoritativeReceiptRef: null,
    secureLinkGrantRef: null,
    continuityEvidenceRef: stableRef("patient_experience_continuity", request.requestRef),
    promptItems: [
      {
        promptRef: stableRef("more_info_prompt", `${request.requestRef}:summary`),
        promptLabelRef: "safe_more_info_prompt_summary",
        state: request.awaitingParty === "patient" ? "unanswered" : "blocked",
        requiredEvidenceRefs: [],
        visibilityTier: "partial",
      },
    ],
  };
}

function defaultReachabilityForRequest(request: PortalSourceRequest): PortalSourceReachability {
  return {
    reachabilityAssessmentRef: stableRef("reachability_assessment", `${request.requestRef}:clear`),
    contactRouteSnapshotRef: stableRef("contact_route_snapshot", `${request.requestRef}:current`),
    summaryState: "clear",
    routeAuthorityState: "current",
    deliveryRiskState: "on_track",
    activeDependencyRef: null,
    affectedRouteRefs: [],
    latestObservationAt: request.latestMeaningfulUpdateAt,
  };
}

function defaultContactRepairForRequest(
  request: PortalSourceRequest,
  reachability: PatientReachabilitySummaryProjection,
): PortalSourceContactRepair {
  return {
    repairCaseRef: stableRef("contact_repair_case", `${request.requestRef}:reachability`),
    contactRepairJourneyRef: stableRef(
      "contact_repair_journey",
      `${request.requestRef}:reachability`,
    ),
    repairState: reachability.summaryState === "rebound_pending" ? "rebound_pending" : "required",
    blockedActionRef: request.dominantActionRef ?? request.nextSafeActionRef ?? "callback_response",
    blockedContextRef: reachability.reachabilitySummaryProjectionRef,
    verificationCheckpointRef: stableRef("contact_route_verification", request.requestRef),
    resultingReachabilityAssessmentRef: null,
    repairRouteRef: `/v1/me/contact-repair/${stableRef("contact_repair_case", `${request.requestRef}:reachability`)}`,
  };
}

function buildCommunicationVisibility(
  clusterOrThreadRef: string,
  coverage: PatientAudienceCoverageProjection,
  consistency: PatientShellConsistencyProjection,
  observedAt: string,
): PatientCommunicationVisibilityProjection {
  const suppressed = coverage.communicationPreviewMode === "suppressed_recovery_only";
  return {
    communicationVisibilityProjectionId: stableRef(
      "patient_communication_visibility",
      `${coverage.patientAudienceCoverageProjectionId}:${clusterOrThreadRef}`,
    ),
    coverageProjectionRef: coverage.patientAudienceCoverageProjectionId,
    clusterOrThreadRef,
    patientShellConsistencyRef: consistency.patientShellConsistencyRef,
    audienceTier: coverage.audienceTier,
    releaseState: coverage.surfaceState === "ready" ? "live" : "read_only",
    stepUpRequirementRef:
      coverage.communicationPreviewMode === "step_up_required" ? "step_up_required_185" : null,
    visibilityTier: suppressed
      ? "placeholder_only"
      : coverage.timelineVisibilityMode === "full_patient_thread"
        ? "full"
        : "partial",
    summarySafetyTier: suppressed ? "phi_suppressed" : "patient_safe",
    minimumNecessaryContractRef: coverage.minimumNecessaryContractRef,
    previewVisibilityContractRef: `preview:${coverage.communicationPreviewMode}`,
    visibleSnippetRefs: suppressed ? [] : [`snippet:${clusterOrThreadRef}:safe`],
    previewMode: coverage.communicationPreviewMode,
    placeholderContractRef: coverage.requiredPlaceholderContractRef,
    hiddenContentReasonRefs: suppressed ? coverage.reasonCodes : [],
    redactionPolicyRef:
      coverage.requiredRedactionPolicyRefs[0] ?? "patient_portal_redaction_policy_185",
    safeContinuationRef: suppressed
      ? "same_shell_recovery"
      : `thread:${clusterOrThreadRef}:continue`,
    latestReceiptEnvelopeRef: `receipt:${clusterOrThreadRef}:latest`,
    latestSettlementRef: `settlement:${clusterOrThreadRef}:latest`,
    experienceContinuityEvidenceRef: stableRef("experience_continuity", clusterOrThreadRef),
    computedAt: observedAt,
    createdByAuthority: AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME,
  };
}

export interface CommunicationsTimelineAssemblerInput {
  readonly input: ListPatientMessagesInput;
  readonly coverage: PatientAudienceCoverageProjection;
  readonly consistency: PatientShellConsistencyProjection;
  readonly clusters: readonly PortalSourceConversationCluster[];
  readonly observedAt: string;
}

export interface CommunicationsTimelineProjectionFamily {
  readonly timeline: PatientCommunicationsTimelineProjection;
  readonly conversationClusters: readonly PatientConversationCluster[];
  readonly conversationThreads: readonly ConversationThreadProjection[];
  readonly conversationSubthreads: readonly ConversationSubthreadProjection[];
  readonly previewDigests: readonly PatientConversationPreviewDigest[];
  readonly communicationVisibility: readonly PatientCommunicationVisibilityProjection[];
  readonly callbackCards: readonly ConversationCallbackCardProjection[];
  readonly callbackStatuses: readonly PatientCallbackStatusProjection[];
  readonly receiptEnvelopes: readonly PatientReceiptEnvelope[];
  readonly commandSettlements: readonly ConversationCommandSettlement[];
  readonly composerLeases: readonly PatientComposerLease[];
}

interface ConversationClusterFamily {
  readonly cluster: PatientConversationCluster;
  readonly thread: ConversationThreadProjection;
  readonly subthreads: readonly ConversationSubthreadProjection[];
  readonly previewDigest: PatientConversationPreviewDigest;
  readonly visibility: PatientCommunicationVisibilityProjection;
  readonly callbackCards: readonly ConversationCallbackCardProjection[];
  readonly callbackStatuses: readonly PatientCallbackStatusProjection[];
  readonly receipts: readonly PatientReceiptEnvelope[];
  readonly settlements: readonly ConversationCommandSettlement[];
  readonly composerLease: PatientComposerLease;
  readonly anchors: readonly ConversationTimelineAnchor[];
  readonly summary: PatientConversationClusterSummary;
}

export function assembleCommunicationsTimelineProjection(
  assemblerInput: CommunicationsTimelineAssemblerInput,
): CommunicationsTimelineProjectionFamily {
  const { input, coverage, consistency, clusters, observedAt } = assemblerInput;
  const orderedClusters = [...clusters].sort((left, right) =>
    right.latestMeaningfulUpdateAt.localeCompare(left.latestMeaningfulUpdateAt),
  );
  const families = orderedClusters.map((cluster) =>
    buildConversationClusterProjectionFamily({
      input,
      coverage,
      consistency,
      sourceCluster: cluster,
      observedAt,
    }),
  );
  const anchors = families
    .flatMap((family) => family.anchors)
    .sort((left, right) => left.sortAt.localeCompare(right.sortAt));
  const tupleAlignmentState: ConversationTupleAlignmentState = families.some(
    (family) => family.cluster.tupleAlignmentState === "drifted",
  )
    ? "drifted"
    : coverage.surfaceState === "recovery_required"
      ? "recovery_only"
      : "aligned";
  const timeline: PatientCommunicationsTimelineProjection = {
    projectionName: "PatientCommunicationsTimelineProjection",
    communicationsTimelineProjectionRef: stableRef(
      "patient_communications_timeline",
      `${coverage.patientAudienceCoverageProjectionId}:${orderedClusters.map((cluster) => `${cluster.clusterRef}:${cluster.monotoneRevision}`).join("|")}`,
    ),
    coverageProjectionRef: coverage.patientAudienceCoverageProjectionId,
    patientShellConsistencyRef: consistency.patientShellConsistencyRef,
    subjectRef: input.subjectRef,
    querySurfaceRef: "GET /v1/me/messages",
    visualMode: "Conversation_Braid_Atlas",
    selectedClusterRef: input.selectedClusterRef ?? orderedClusters[0]?.clusterRef ?? null,
    selectedThreadId: input.selectedThreadId ?? orderedClusters[0]?.threadId ?? null,
    conversationClusterRefs: families.map((family) => family.cluster.clusterProjectionRef),
    threadProjectionRefs: families.map((family) => family.thread.threadProjectionRef),
    previewDigestRefs: families.map((family) => family.previewDigest.previewDigestRef),
    visibilityProjectionRefs: families.map(
      (family) => family.visibility.communicationVisibilityProjectionId,
    ),
    composerLeaseRefs: families.map((family) => family.composerLease.composerLeaseRef),
    receiptEnvelopeRefs: families.flatMap((family) =>
      family.receipts.map((receipt) => receipt.receiptEnvelopeRef),
    ),
    settlementRefs: families.flatMap((family) =>
      family.settlements.map((settlement) => settlement.settlementRef),
    ),
    callbackStatusProjectionRefs: families.flatMap((family) =>
      family.callbackStatuses.map((status) => status.callbackStatusProjectionRef),
    ),
    callbackCardRefs: families.flatMap((family) =>
      family.callbackCards.map((card) => card.callbackCardRef),
    ),
    clusterSummaries: families.map((family) => family.summary),
    timelineAnchors: anchors,
    tupleAlignmentState,
    surfaceState:
      coverage.surfaceState === "recovery_required"
        ? "recovery_only"
        : tupleAlignmentState === "drifted"
          ? "placeholder"
          : coverage.surfaceState === "pending_confirmation"
            ? "pending"
            : coverage.surfaceState === "ready"
              ? "ready"
              : "read_only",
    reasonCodes: mergeReasonCodes(coverage.reasonCodes, [
      "PORTAL_214_COMMUNICATION_TIMELINE_ASSEMBLED",
      tupleAlignmentState === "drifted"
        ? "PORTAL_214_TUPLE_ALIGNMENT_DRIFT"
        : "PORTAL_214_TUPLE_ALIGNMENT_VERIFIED",
    ]),
    computedAt: observedAt,
    createdByAuthority: AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME,
  };
  return {
    timeline,
    conversationClusters: families.map((family) => family.cluster),
    conversationThreads: families.map((family) => family.thread),
    conversationSubthreads: families.flatMap((family) => family.subthreads),
    previewDigests: families.map((family) => family.previewDigest),
    communicationVisibility: families.map((family) => family.visibility),
    callbackCards: families.flatMap((family) => family.callbackCards),
    callbackStatuses: families.flatMap((family) => family.callbackStatuses),
    receiptEnvelopes: families.flatMap((family) => family.receipts),
    commandSettlements: families.flatMap((family) => family.settlements),
    composerLeases: families.map((family) => family.composerLease),
  };
}

function buildConversationClusterProjectionFamily(input: {
  readonly input: ListPatientMessagesInput;
  readonly coverage: PatientAudienceCoverageProjection;
  readonly consistency: PatientShellConsistencyProjection;
  readonly sourceCluster: PortalSourceConversationCluster;
  readonly observedAt: string;
}): ConversationClusterFamily {
  const { coverage, consistency, sourceCluster, observedAt } = input;
  const previewVisibilityContractRef =
    sourceCluster.previewVisibilityContractRef ??
    `preview:${coverage.communicationPreviewMode}:communications_timeline_214`;
  const summarySafetyTier =
    coverage.communicationPreviewMode === "suppressed_recovery_only"
      ? "phi_suppressed"
      : coverage.audienceTier === "patient_public"
        ? "public_safe"
        : (sourceCluster.summarySafetyTier ?? "patient_safe");
  const threadTupleHash = conversationThreadTupleHash({
    sourceCluster,
    previewVisibilityContractRef,
    summarySafetyTier,
  });
  const tupleAlignmentState = conversationTupleAlignmentStateFor({
    coverage,
    sourceCluster,
    threadTupleHash,
  });
  const visibility = resolveConversationCommunicationVisibility({
    sourceCluster,
    coverage,
    consistency,
    threadTupleHash,
    previewVisibilityContractRef,
    summarySafetyTier,
    observedAt,
  });
  const receipts = sourceCluster.communicationEnvelopes.map((envelope) =>
    buildPatientReceiptEnvelope({
      coverage,
      sourceCluster,
      envelope,
      observedAt,
    }),
  );
  const settlements = sourceCluster.communicationEnvelopes.map((envelope) =>
    buildConversationCommandSettlement({
      coverage,
      sourceCluster,
      envelope,
      observedAt,
    }),
  );
  const anchors = sourceCluster.communicationEnvelopes.map((envelope) =>
    buildConversationTimelineAnchor({
      envelope,
      sourceCluster,
      visibility,
    }),
  );
  const callbackStatuses = sourceCluster.callbackStatusProjections ?? [];
  const callbackCards = callbackStatuses.map((status) =>
    buildConversationCallbackCard({
      coverage,
      sourceCluster,
      callbackStatus: status,
      threadTupleHash,
      previewVisibilityContractRef,
      summarySafetyTier,
      tupleAlignmentState,
      observedAt,
    }),
  );
  const subthreads = buildConversationSubthreadProjections({
    coverage,
    sourceCluster,
    anchors,
    callbackStatuses,
    threadTupleHash,
    previewVisibilityContractRef,
    summarySafetyTier,
    tupleAlignmentState,
    observedAt,
  });
  const reasonCodes = conversationReasonCodesFor({
    coverage,
    sourceCluster,
    tupleAlignmentState,
    callbackStatuses,
  });
  const dominantNextActionRef = dominantConversationActionFor({
    coverage,
    sourceCluster,
    tupleAlignmentState,
  });
  const composerLease = buildPatientComposerLease({
    coverage,
    sourceCluster,
    threadTupleHash,
    tupleAlignmentState,
    dominantNextActionRef,
    observedAt,
  });
  const previewDigest = buildPatientConversationPreviewDigest({
    coverage,
    sourceCluster,
    receipts,
    composerLease,
    threadTupleHash,
    previewVisibilityContractRef,
    summarySafetyTier,
    tupleAlignmentState,
    dominantNextActionRef,
    reasonCodes,
    observedAt,
  });
  const clusterProjectionRef = stableRef(
    "patient_conversation_cluster",
    `${coverage.patientAudienceCoverageProjectionId}:${sourceCluster.clusterRef}:${threadTupleHash}`,
  );
  const cluster: PatientConversationCluster = {
    projectionName: "PatientConversationCluster",
    clusterProjectionRef,
    coverageProjectionRef: coverage.patientAudienceCoverageProjectionId,
    clusterRef: sourceCluster.clusterRef,
    threadId: sourceCluster.threadId,
    threadTupleHash,
    receiptGrammarVersionRef: sourceCluster.receiptGrammarVersionRef,
    monotoneRevision: sourceCluster.monotoneRevision,
    previewVisibilityContractRef,
    summarySafetyTier,
    patientSafeSubject: sourceCluster.patientSafeSubject,
    publicSafeSubject: sourceCluster.publicSafeSubject,
    subthreadProjectionRefs: subthreads.map((subthread) => subthread.subthreadProjectionRef),
    timelineAnchorRefs: anchors.map((anchor) => anchor.anchorRef),
    callbackStatusProjectionRefs: callbackStatuses.map(
      (status) => status.callbackStatusProjectionRef,
    ),
    callbackCardRefs: callbackCards.map((card) => card.callbackCardRef),
    previewDigestRef: previewDigest.previewDigestRef,
    composerLeaseRef: composerLease.composerLeaseRef,
    dominantNextActionRef,
    tupleAlignmentState,
    surfaceState: conversationSurfaceStateFor(coverage, tupleAlignmentState),
    reasonCodes,
    computedAt: observedAt,
    createdByAuthority: AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME,
  };
  const thread: ConversationThreadProjection = {
    projectionName: "ConversationThreadProjection",
    threadProjectionRef: stableRef(
      "conversation_thread",
      `${clusterProjectionRef}:${sourceCluster.threadId}`,
    ),
    coverageProjectionRef: coverage.patientAudienceCoverageProjectionId,
    clusterProjectionRef,
    clusterRef: sourceCluster.clusterRef,
    threadId: sourceCluster.threadId,
    threadTupleHash,
    receiptGrammarVersionRef: sourceCluster.receiptGrammarVersionRef,
    monotoneRevision: sourceCluster.monotoneRevision,
    previewVisibilityContractRef,
    summarySafetyTier,
    subthreadProjectionRefs: subthreads.map((subthread) => subthread.subthreadProjectionRef),
    timelineAnchorRefs: anchors.map((anchor) => anchor.anchorRef),
    callbackStatusProjectionRefs: callbackStatuses.map(
      (status) => status.callbackStatusProjectionRef,
    ),
    callbackCardRefs: callbackCards.map((card) => card.callbackCardRef),
    composerLeaseRef: composerLease.composerLeaseRef,
    previewDigestRef: previewDigest.previewDigestRef,
    receiptEnvelopeRefs: receipts.map((receipt) => receipt.receiptEnvelopeRef),
    settlementRefs: settlements.map((settlement) => settlement.settlementRef),
    selectedAnchorRef: sourceCluster.selectedAnchorRef ?? anchors[0]?.anchorRef ?? null,
    routeRefs: {
      listRouteRef: "/v1/me/messages",
      clusterRouteRef: `/v1/me/messages/${sourceCluster.clusterRef}`,
      threadRouteRef: `/v1/me/messages/${sourceCluster.clusterRef}/thread/${sourceCluster.threadId}`,
    },
    tupleAlignmentState,
    surfaceState: conversationSurfaceStateFor(coverage, tupleAlignmentState),
    reasonCodes,
    computedAt: observedAt,
    createdByAuthority: AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME,
  };
  const summary: PatientConversationClusterSummary = {
    clusterSummaryRef: stableRef(
      "conversation_cluster_summary",
      `${clusterProjectionRef}:${previewDigest.previewDigestRef}`,
    ),
    clusterRef: sourceCluster.clusterRef,
    threadId: sourceCluster.threadId,
    threadTupleHash,
    patientSafeSubject: sourceCluster.patientSafeSubject,
    publicSafeSubject: sourceCluster.publicSafeSubject,
    previewDigestRef: previewDigest.previewDigestRef,
    visibilityProjectionRef: visibility.communicationVisibilityProjectionId,
    callbackStatusProjectionRefs: callbackStatuses.map(
      (status) => status.callbackStatusProjectionRef,
    ),
    latestAnchorRef: anchors[anchors.length - 1]?.anchorRef ?? null,
    deliveryRiskState: dominantConversationDeliveryRisk(sourceCluster),
    authoritativeOutcomeState: dominantConversationOutcome(sourceCluster),
    tupleAlignmentState,
    dominantNextActionRef,
  };
  return {
    cluster,
    thread,
    subthreads,
    previewDigest,
    visibility,
    callbackCards,
    callbackStatuses,
    receipts,
    settlements,
    composerLease,
    anchors,
    summary,
  };
}

function resolveConversationCommunicationVisibility(input: {
  readonly sourceCluster: PortalSourceConversationCluster;
  readonly coverage: PatientAudienceCoverageProjection;
  readonly consistency: PatientShellConsistencyProjection;
  readonly threadTupleHash: string;
  readonly previewVisibilityContractRef: string;
  readonly summarySafetyTier: PortalSummarySafetyTier;
  readonly observedAt: string;
}): PatientCommunicationVisibilityProjection {
  const suppressed = input.coverage.communicationPreviewMode === "suppressed_recovery_only";
  const stepUp = input.coverage.communicationPreviewMode === "step_up_required";
  const hiddenContentReasonRefs = mergeReasonCodes(suppressed ? input.coverage.reasonCodes : [], [
    ...(suppressed ? ["PORTAL_214_RECOVERY_ONLY_PLACEHOLDER"] : []),
    ...(stepUp ? ["PORTAL_214_STEP_UP_PLACEHOLDER"] : []),
    ...(input.coverage.audienceTier === "patient_public"
      ? ["PORTAL_214_PREVIEW_SUPPRESSED_PLACEHOLDER"]
      : []),
  ]);
  return {
    communicationVisibilityProjectionId: stableRef(
      "patient_communication_visibility",
      `${input.coverage.patientAudienceCoverageProjectionId}:${input.sourceCluster.clusterRef}:${input.threadTupleHash}`,
    ),
    coverageProjectionRef: input.coverage.patientAudienceCoverageProjectionId,
    clusterOrThreadRef: input.sourceCluster.clusterRef,
    patientShellConsistencyRef: input.consistency.patientShellConsistencyRef,
    audienceTier: input.coverage.audienceTier,
    releaseState: input.coverage.surfaceState === "ready" ? "live" : "read_only",
    stepUpRequirementRef: stepUp ? "communications_step_up_required_214" : null,
    visibilityTier: suppressed
      ? "placeholder_only"
      : input.coverage.timelineVisibilityMode === "full_patient_thread"
        ? "full"
        : "partial",
    summarySafetyTier: input.summarySafetyTier,
    minimumNecessaryContractRef: input.coverage.minimumNecessaryContractRef,
    previewVisibilityContractRef: input.previewVisibilityContractRef,
    visibleSnippetRefs: suppressed
      ? []
      : input.sourceCluster.communicationEnvelopes
          .map((envelope) => envelope.visibleSnippetRef ?? `snippet:${envelope.envelopeRef}:safe`)
          .slice(0, input.coverage.timelineVisibilityMode === "full_patient_thread" ? 8 : 2),
    previewMode: input.coverage.communicationPreviewMode,
    placeholderContractRef: placeholderContractForConversation(input.coverage, "preview"),
    hiddenContentReasonRefs,
    redactionPolicyRef:
      input.coverage.requiredRedactionPolicyRefs[0] ?? "patient_portal_redaction_policy_185",
    safeContinuationRef: suppressed
      ? "same_shell_recovery"
      : `/v1/me/messages/${input.sourceCluster.clusterRef}`,
    latestReceiptEnvelopeRef:
      input.sourceCluster.communicationEnvelopes[
        input.sourceCluster.communicationEnvelopes.length - 1
      ]?.receiptRef ?? stableRef("conversation_receipt_latest", input.sourceCluster.clusterRef),
    latestSettlementRef:
      input.sourceCluster.communicationEnvelopes[
        input.sourceCluster.communicationEnvelopes.length - 1
      ]?.settlementRef ??
      stableRef("conversation_settlement_latest", input.sourceCluster.clusterRef),
    experienceContinuityEvidenceRef: stableRef(
      "conversation_experience_continuity",
      `${input.sourceCluster.clusterRef}:${input.threadTupleHash}`,
    ),
    computedAt: input.observedAt,
    createdByAuthority: AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME,
  };
}

function buildPatientConversationPreviewDigest(input: {
  readonly coverage: PatientAudienceCoverageProjection;
  readonly sourceCluster: PortalSourceConversationCluster;
  readonly receipts: readonly PatientReceiptEnvelope[];
  readonly composerLease: PatientComposerLease;
  readonly threadTupleHash: string;
  readonly previewVisibilityContractRef: string;
  readonly summarySafetyTier: PortalSummarySafetyTier;
  readonly tupleAlignmentState: ConversationTupleAlignmentState;
  readonly dominantNextActionRef: string | null;
  readonly reasonCodes: readonly string[];
  readonly observedAt: string;
}): PatientConversationPreviewDigest {
  const placeholder = conversationPlaceholderFor({
    coverage: input.coverage,
    tupleAlignmentState: input.tupleAlignmentState,
  });
  const latestReceipt = input.receipts[input.receipts.length - 1] ?? null;
  const localSuccessFinalityWarningRef = input.receipts.some(
    (receipt) =>
      (receipt.localAckState === "submitted" ||
        receipt.localAckState === "accepted_locally" ||
        receipt.transportAcceptanceState === "accepted") &&
      receipt.authoritativeOutcomeState !== "settled",
  )
    ? "local_ack_is_not_authoritative_settlement_214"
    : null;
  return {
    projectionName: "PatientConversationPreviewDigest",
    previewDigestRef: stableRef(
      "patient_conversation_preview_digest",
      `${input.coverage.patientAudienceCoverageProjectionId}:${input.sourceCluster.clusterRef}:${input.threadTupleHash}`,
    ),
    coverageProjectionRef: input.coverage.patientAudienceCoverageProjectionId,
    clusterRef: input.sourceCluster.clusterRef,
    threadId: input.sourceCluster.threadId,
    threadTupleHash: input.threadTupleHash,
    receiptGrammarVersionRef: input.sourceCluster.receiptGrammarVersionRef,
    monotoneRevision: input.sourceCluster.monotoneRevision,
    previewVisibilityContractRef: input.previewVisibilityContractRef,
    summarySafetyTier: input.summarySafetyTier,
    previewMode: input.coverage.communicationPreviewMode,
    previewLabel:
      input.coverage.audienceTier === "patient_public"
        ? input.sourceCluster.publicSafeSubject
        : input.sourceCluster.patientSafeSubject,
    placeholderVisible: placeholder.kind !== "none",
    placeholderKind: placeholder.kind,
    placeholderReasonRefs: placeholder.reasonRefs,
    placeholderNextStepRef: placeholder.nextStepRef,
    rowState: conversationSurfaceStateFor(input.coverage, input.tupleAlignmentState),
    threadMastheadState: conversationSurfaceStateFor(input.coverage, input.tupleAlignmentState),
    callbackCardState: input.sourceCluster.callbackCaseRefs?.length ? "ready" : "read_only",
    reminderNoticeState: input.sourceCluster.reminderPlanRefs?.length ? "ready" : "read_only",
    composerLeaseRef: input.composerLease.composerLeaseRef,
    receiptSummaryRef: latestReceipt?.summaryRef ?? null,
    dominantNextActionRef: input.dominantNextActionRef,
    localSuccessFinalityWarningRef,
    reasonCodes: mergeReasonCodes(input.reasonCodes, [
      ...(localSuccessFinalityWarningRef ? ["PORTAL_214_LOCAL_SUCCESS_NOT_FINAL"] : []),
    ]),
    computedAt: input.observedAt,
    createdByAuthority: AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME,
  };
}

function buildConversationCallbackCard(input: {
  readonly coverage: PatientAudienceCoverageProjection;
  readonly sourceCluster: PortalSourceConversationCluster;
  readonly callbackStatus: PatientCallbackStatusProjection;
  readonly threadTupleHash: string;
  readonly previewVisibilityContractRef: string;
  readonly summarySafetyTier: PortalSummarySafetyTier;
  readonly tupleAlignmentState: ConversationTupleAlignmentState;
  readonly observedAt: string;
}): ConversationCallbackCardProjection {
  return {
    projectionName: "ConversationCallbackCardProjection",
    callbackCardRef: stableRef(
      "conversation_callback_card",
      `${input.callbackStatus.callbackStatusProjectionRef}:${input.threadTupleHash}`,
    ),
    coverageProjectionRef: input.coverage.patientAudienceCoverageProjectionId,
    clusterRef: input.sourceCluster.clusterRef,
    threadId: input.sourceCluster.threadId,
    callbackCaseRef: input.callbackStatus.callbackCaseRef,
    callbackStatusProjectionRef: input.callbackStatus.callbackStatusProjectionRef,
    threadTupleHash: input.threadTupleHash,
    receiptGrammarVersionRef: input.sourceCluster.receiptGrammarVersionRef,
    monotoneRevision: input.sourceCluster.monotoneRevision,
    previewVisibilityContractRef: input.previewVisibilityContractRef,
    summarySafetyTier: input.summarySafetyTier,
    patientVisibleState: input.callbackStatus.patientVisibleState,
    windowRiskState: input.callbackStatus.windowRiskState,
    routeRepairRequiredState: input.callbackStatus.routeRepairRequiredState,
    dominantActionRef: input.callbackStatus.dominantActionRef,
    surfaceState: conversationSurfaceStateFor(input.coverage, input.tupleAlignmentState),
    reasonCodes: mergeReasonCodes(input.coverage.reasonCodes, [
      "PORTAL_214_CALLBACK_STATUS_COMPATIBILITY",
      ...(input.callbackStatus.routeRepairRequiredState
        ? ["PORTAL_214_BLOCKER_REPAIR_DOMINATES"]
        : []),
    ]),
    computedAt: input.observedAt,
    createdByAuthority: AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME,
  };
}

function buildConversationSubthreadProjections(input: {
  readonly coverage: PatientAudienceCoverageProjection;
  readonly sourceCluster: PortalSourceConversationCluster;
  readonly anchors: readonly ConversationTimelineAnchor[];
  readonly callbackStatuses: readonly PatientCallbackStatusProjection[];
  readonly threadTupleHash: string;
  readonly previewVisibilityContractRef: string;
  readonly summarySafetyTier: PortalSummarySafetyTier;
  readonly tupleAlignmentState: ConversationTupleAlignmentState;
  readonly observedAt: string;
}): readonly ConversationSubthreadProjection[] {
  const subthreadSources =
    input.sourceCluster.subthreads && input.sourceCluster.subthreads.length > 0
      ? input.sourceCluster.subthreads
      : defaultSubthreadsForCluster(input.sourceCluster);
  return subthreadSources.map((subthread) => {
    const envelopeRefs =
      subthread.communicationEnvelopeRefs ??
      input.sourceCluster.communicationEnvelopes
        .filter(
          (envelope) =>
            (envelope.subthreadRef ?? envelope.subthreadType) === subthread.subthreadRef,
        )
        .map((envelope) => envelope.envelopeRef);
    const subthreadAnchors = input.anchors.filter((anchor) =>
      envelopeRefs.includes(anchor.sourceRef),
    );
    return {
      projectionName: "ConversationSubthreadProjection",
      subthreadProjectionRef: stableRef(
        "conversation_subthread",
        `${input.coverage.patientAudienceCoverageProjectionId}:${input.sourceCluster.clusterRef}:${subthread.subthreadRef}:${input.threadTupleHash}`,
      ),
      coverageProjectionRef: input.coverage.patientAudienceCoverageProjectionId,
      clusterRef: input.sourceCluster.clusterRef,
      threadId: input.sourceCluster.threadId,
      subthreadRef: subthread.subthreadRef,
      subthreadType: subthread.subthreadType,
      threadTupleHash: input.threadTupleHash,
      receiptGrammarVersionRef: input.sourceCluster.receiptGrammarVersionRef,
      monotoneRevision: input.sourceCluster.monotoneRevision,
      previewVisibilityContractRef: input.previewVisibilityContractRef,
      summarySafetyTier: input.summarySafetyTier,
      communicationEnvelopeRefs: envelopeRefs,
      timelineAnchorRefs: subthreadAnchors.map((anchor) => anchor.anchorRef),
      callbackStatusProjectionRefs:
        subthread.subthreadType === "callback"
          ? input.callbackStatuses.map((status) => status.callbackStatusProjectionRef)
          : [],
      replyNeededState: replyNeededStateForSubthread({
        coverage: input.coverage,
        subthreadType: subthread.subthreadType,
        tupleAlignmentState: input.tupleAlignmentState,
        sourceCluster: input.sourceCluster,
      }),
      repairRequiredState: repairRequiredStateForCluster(input.sourceCluster, input.coverage),
      surfaceState: conversationSurfaceStateFor(input.coverage, input.tupleAlignmentState),
      reasonCodes: conversationReasonCodesFor({
        coverage: input.coverage,
        sourceCluster: input.sourceCluster,
        tupleAlignmentState: input.tupleAlignmentState,
        callbackStatuses: input.callbackStatuses,
      }),
      computedAt: input.observedAt,
      createdByAuthority: AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME,
    };
  });
}

function buildPatientReceiptEnvelope(input: {
  readonly coverage: PatientAudienceCoverageProjection;
  readonly sourceCluster: PortalSourceConversationCluster;
  readonly envelope: PortalSourceCommunicationEnvelope;
  readonly observedAt: string;
}): PatientReceiptEnvelope {
  const authoritativeOutcomeState =
    input.envelope.authoritativeOutcomeState ?? authoritativeOutcomeForEnvelope(input.envelope);
  return {
    projectionName: "PatientReceiptEnvelope",
    receiptEnvelopeRef:
      input.envelope.receiptRef ??
      stableRef(
        "patient_receipt_envelope",
        `${input.coverage.patientAudienceCoverageProjectionId}:${input.envelope.envelopeRef}`,
      ),
    coverageProjectionRef: input.coverage.patientAudienceCoverageProjectionId,
    clusterRef: input.sourceCluster.clusterRef,
    threadId: input.sourceCluster.threadId,
    sourceEnvelopeRef: input.envelope.envelopeRef,
    receiptKind: receiptKindForEnvelope(input.envelope),
    grammarVersionRef: input.sourceCluster.receiptGrammarVersionRef,
    localAckState: input.envelope.localAckState ?? "none",
    transportAcceptanceState: input.envelope.transportAcceptanceState ?? "not_started",
    deliveryEvidenceState: input.envelope.deliveryEvidenceState ?? "not_applicable",
    authoritativeOutcomeState,
    summaryRef: stableRef(
      "patient_receipt_summary",
      `${input.envelope.envelopeRef}:${authoritativeOutcomeState}:${input.sourceCluster.receiptGrammarVersionRef}`,
    ),
    settledAt:
      authoritativeOutcomeState === "settled"
        ? (input.envelope.sortAt ?? input.envelope.sentAt)
        : null,
    reasonCodes: receiptReasonCodesFor(input.envelope, authoritativeOutcomeState),
    computedAt: input.observedAt,
    createdByAuthority: AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME,
  };
}

function buildConversationCommandSettlement(input: {
  readonly coverage: PatientAudienceCoverageProjection;
  readonly sourceCluster: PortalSourceConversationCluster;
  readonly envelope: PortalSourceCommunicationEnvelope;
  readonly observedAt: string;
}): ConversationCommandSettlement {
  const authoritativeOutcomeState =
    input.envelope.authoritativeOutcomeState ?? authoritativeOutcomeForEnvelope(input.envelope);
  const deliveryEvidenceState = input.envelope.deliveryEvidenceState ?? "not_applicable";
  const sameShellState: ConversationCommandSettlement["sameShellState"] =
    deliveryEvidenceState === "disputed" || input.envelope.deliveryRiskState === "disputed"
      ? "disputed"
      : authoritativeOutcomeState === "recovery_required"
        ? "recovery_required"
        : authoritativeOutcomeState === "settled"
          ? "settled"
          : "pending";
  return {
    projectionName: "ConversationCommandSettlement",
    settlementRef:
      input.envelope.settlementRef ??
      stableRef(
        "conversation_command_settlement",
        `${input.coverage.patientAudienceCoverageProjectionId}:${input.envelope.envelopeRef}`,
      ),
    coverageProjectionRef: input.coverage.patientAudienceCoverageProjectionId,
    clusterRef: input.sourceCluster.clusterRef,
    threadId: input.sourceCluster.threadId,
    sourceEnvelopeRef: input.envelope.envelopeRef,
    localAckState: input.envelope.localAckState ?? "none",
    transportAcceptanceState: input.envelope.transportAcceptanceState ?? "not_started",
    deliveryEvidenceState,
    authoritativeOutcomeState,
    sameShellState,
    calmSettledLanguageAllowed:
      authoritativeOutcomeState === "settled" && deliveryEvidenceState !== "disputed",
    authoritativeBasisRefs: compactStrings([
      input.envelope.envelopeRef,
      input.envelope.receiptRef,
      input.envelope.failureEvidenceRef,
      input.envelope.disputeEvidenceRef,
    ]),
    reasonCodes: receiptReasonCodesFor(input.envelope, authoritativeOutcomeState),
    computedAt: input.observedAt,
    createdByAuthority: AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME,
  };
}

function buildConversationTimelineAnchor(input: {
  readonly envelope: PortalSourceCommunicationEnvelope;
  readonly sourceCluster: PortalSourceConversationCluster;
  readonly visibility: PatientCommunicationVisibilityProjection;
}): ConversationTimelineAnchor {
  return {
    anchorRef: stableRef(
      "conversation_timeline_anchor",
      `${input.sourceCluster.clusterRef}:${input.envelope.envelopeRef}`,
    ),
    clusterRef: input.sourceCluster.clusterRef,
    threadId: input.sourceCluster.threadId,
    sourceRef: input.envelope.envelopeRef,
    eventType: input.envelope.subthreadType,
    surfaceLabel: input.envelope.patientSafeSummary,
    sortAt: input.envelope.sortAt ?? input.envelope.sentAt,
    visibilityProjectionRef: input.visibility.communicationVisibilityProjectionId,
    reasonCodes: receiptReasonCodesFor(
      input.envelope,
      input.envelope.authoritativeOutcomeState ?? authoritativeOutcomeForEnvelope(input.envelope),
    ),
  };
}

function buildPatientComposerLease(input: {
  readonly coverage: PatientAudienceCoverageProjection;
  readonly sourceCluster: PortalSourceConversationCluster;
  readonly threadTupleHash: string;
  readonly tupleAlignmentState: ConversationTupleAlignmentState;
  readonly dominantNextActionRef: string | null;
  readonly observedAt: string;
}): PatientComposerLease {
  const repairState = repairRequiredStateForCluster(input.sourceCluster, input.coverage);
  const blockedReasonRefs = compactStrings([
    input.tupleAlignmentState === "drifted" ? "PORTAL_214_TUPLE_ALIGNMENT_DRIFT" : null,
    input.coverage.communicationPreviewMode === "step_up_required"
      ? "PORTAL_214_STEP_UP_PLACEHOLDER"
      : null,
    input.coverage.communicationPreviewMode === "suppressed_recovery_only"
      ? "PORTAL_214_RECOVERY_ONLY_PLACEHOLDER"
      : null,
    repairState !== "none" ? "PORTAL_214_BLOCKER_REPAIR_DOMINATES" : null,
  ]);
  const leaseState: PatientComposerLeaseState =
    input.coverage.mutationAuthority === "route_bound_mutation" &&
    input.tupleAlignmentState === "aligned" &&
    repairState === "none"
      ? "active"
      : input.tupleAlignmentState === "recovery_only"
        ? "resume_required"
        : "blocked";
  return {
    projectionName: "PatientComposerLease",
    composerLeaseRef: stableRef(
      "patient_composer_lease",
      `${input.coverage.patientAudienceCoverageProjectionId}:${input.sourceCluster.clusterRef}:${input.threadTupleHash}`,
    ),
    coverageProjectionRef: input.coverage.patientAudienceCoverageProjectionId,
    clusterRef: input.sourceCluster.clusterRef,
    threadId: input.sourceCluster.threadId,
    threadTupleHash: input.threadTupleHash,
    leaseState,
    allowedActionRefs: leaseState === "active" ? ["send_secure_reply", "request_callback"] : [],
    blockedReasonRefs,
    blockedByProjectionRefs: compactStrings([
      input.sourceCluster.contactRepairProjection?.contactRepairProjectionRef,
      input.sourceCluster.consentCheckpointProjection?.consentCheckpointProjectionRef,
      input.sourceCluster.reachabilitySummaryProjection?.reachabilitySummaryProjectionRef,
    ]),
    localDraftRef:
      leaseState === "active" ? stableRef("message_local_draft", input.threadTupleHash) : null,
    routeRef: `/v1/me/messages/${input.sourceCluster.clusterRef}/thread/${input.sourceCluster.threadId}`,
    reasonCodes: mergeReasonCodes(input.coverage.reasonCodes, blockedReasonRefs),
    computedAt: input.observedAt,
    createdByAuthority: AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME,
  };
}

function saveCommunicationsTimelineProjectionFamily(
  repository: AuthenticatedPortalProjectionRepository,
  family: CommunicationsTimelineProjectionFamily,
): void {
  repository.saveCommunicationsTimeline(family.timeline);
  for (const projection of family.conversationClusters)
    repository.saveConversationCluster(projection);
  for (const projection of family.conversationThreads)
    repository.saveConversationThread(projection);
  for (const projection of family.conversationSubthreads) {
    repository.saveConversationSubthread(projection);
  }
  for (const projection of family.previewDigests)
    repository.saveConversationPreviewDigest(projection);
  for (const projection of family.communicationVisibility) {
    repository.saveCommunicationVisibility(projection);
  }
  for (const projection of family.callbackCards)
    repository.saveConversationCallbackCard(projection);
  for (const projection of family.callbackStatuses) repository.saveCallbackStatus(projection);
  for (const projection of family.receiptEnvelopes)
    repository.savePatientReceiptEnvelope(projection);
  for (const projection of family.commandSettlements) {
    repository.saveConversationCommandSettlement(projection);
  }
  for (const projection of family.composerLeases) repository.savePatientComposerLease(projection);
}

function conversationThreadTupleHash(input: {
  readonly sourceCluster: PortalSourceConversationCluster;
  readonly previewVisibilityContractRef: string;
  readonly summarySafetyTier: PortalSummarySafetyTier;
}): string {
  return digest({
    clusterRef: input.sourceCluster.clusterRef,
    threadId: input.sourceCluster.threadId,
    receiptGrammarVersionRef: input.sourceCluster.receiptGrammarVersionRef,
    monotoneRevision: input.sourceCluster.monotoneRevision,
    previewVisibilityContractRef: input.previewVisibilityContractRef,
    summarySafetyTier: input.summarySafetyTier,
    envelopeRefs: input.sourceCluster.communicationEnvelopes.map(
      (envelope) => envelope.envelopeRef,
    ),
    callbackStatusProjectionRefs: (input.sourceCluster.callbackStatusProjections ?? []).map(
      (status) => status.callbackStatusProjectionRef,
    ),
  });
}

function conversationTupleAlignmentStateFor(input: {
  readonly coverage: PatientAudienceCoverageProjection;
  readonly sourceCluster: PortalSourceConversationCluster;
  readonly threadTupleHash: string;
}): ConversationTupleAlignmentState {
  if (input.coverage.surfaceState === "recovery_required") return "recovery_only";
  if (input.sourceCluster.forceTupleDrift) return "drifted";
  if (
    input.sourceCluster.expectedThreadTupleHash &&
    input.sourceCluster.expectedThreadTupleHash !== input.threadTupleHash
  ) {
    return "drifted";
  }
  return "aligned";
}

function conversationPlaceholderFor(input: {
  readonly coverage: PatientAudienceCoverageProjection;
  readonly tupleAlignmentState: ConversationTupleAlignmentState;
}): {
  readonly kind: PatientConversationPreviewDigest["placeholderKind"];
  readonly reasonRefs: readonly string[];
  readonly nextStepRef: string | null;
} {
  if (input.tupleAlignmentState === "drifted") {
    return {
      kind: "tuple_drift",
      reasonRefs: ["PORTAL_214_TUPLE_ALIGNMENT_DRIFT"],
      nextStepRef: "refresh_thread_from_authority",
    };
  }
  if (input.coverage.communicationPreviewMode === "suppressed_recovery_only") {
    return {
      kind: "recovery_only",
      reasonRefs: ["PORTAL_214_RECOVERY_ONLY_PLACEHOLDER"],
      nextStepRef: "recover_session",
    };
  }
  if (input.coverage.communicationPreviewMode === "step_up_required") {
    return {
      kind: "step_up",
      reasonRefs: ["PORTAL_214_STEP_UP_PLACEHOLDER"],
      nextStepRef: "complete_step_up",
    };
  }
  if (input.coverage.audienceTier === "patient_public") {
    return {
      kind: "public_safe",
      reasonRefs: ["PORTAL_214_PREVIEW_SUPPRESSED_PLACEHOLDER"],
      nextStepRef: "sign_in_for_message_detail",
    };
  }
  return { kind: "none", reasonRefs: [], nextStepRef: null };
}

function conversationReasonCodesFor(input: {
  readonly coverage: PatientAudienceCoverageProjection;
  readonly sourceCluster: PortalSourceConversationCluster;
  readonly tupleAlignmentState: ConversationTupleAlignmentState;
  readonly callbackStatuses: readonly PatientCallbackStatusProjection[];
}): readonly string[] {
  return mergeReasonCodes(input.coverage.reasonCodes, [
    "PORTAL_214_COMMUNICATION_TIMELINE_ASSEMBLED",
    input.tupleAlignmentState === "drifted"
      ? "PORTAL_214_TUPLE_ALIGNMENT_DRIFT"
      : "PORTAL_214_TUPLE_ALIGNMENT_VERIFIED",
    ...(input.coverage.communicationPreviewMode === "suppressed_recovery_only"
      ? ["PORTAL_214_RECOVERY_ONLY_PLACEHOLDER"]
      : []),
    ...(input.coverage.communicationPreviewMode === "step_up_required"
      ? ["PORTAL_214_STEP_UP_PLACEHOLDER"]
      : []),
    ...(input.coverage.audienceTier === "patient_public"
      ? ["PORTAL_214_PREVIEW_SUPPRESSED_PLACEHOLDER"]
      : []),
    ...(input.sourceCluster.communicationEnvelopes.some(
      (envelope) =>
        envelope.localAckState === "submitted" ||
        envelope.localAckState === "accepted_locally" ||
        envelope.transportAcceptanceState === "accepted",
    )
      ? ["PORTAL_214_LOCAL_SUCCESS_NOT_FINAL"]
      : []),
    ...(input.sourceCluster.communicationEnvelopes.some(
      (envelope) =>
        envelope.deliveryRiskState === "likely_failed" ||
        envelope.deliveryEvidenceState === "failed" ||
        envelope.deliveryEvidenceState === "bounced",
    )
      ? ["PORTAL_214_DELIVERY_FAILURE_VISIBLE"]
      : []),
    ...(input.sourceCluster.communicationEnvelopes.some(
      (envelope) =>
        envelope.deliveryRiskState === "disputed" || envelope.deliveryEvidenceState === "disputed",
    )
      ? ["PORTAL_214_DISPUTE_VISIBLE"]
      : []),
    ...(repairRequiredStateForCluster(input.sourceCluster, input.coverage) !== "none"
      ? ["PORTAL_214_BLOCKER_REPAIR_DOMINATES"]
      : []),
    ...(input.callbackStatuses.length > 0 ? ["PORTAL_214_CALLBACK_STATUS_COMPATIBILITY"] : []),
  ]);
}

function receiptReasonCodesFor(
  envelope: PortalSourceCommunicationEnvelope,
  authoritativeOutcomeState: ConversationAuthoritativeOutcomeState,
): readonly string[] {
  return [
    ...(authoritativeOutcomeState !== "settled" &&
    (envelope.localAckState === "submitted" ||
      envelope.localAckState === "accepted_locally" ||
      envelope.transportAcceptanceState === "accepted")
      ? ["PORTAL_214_LOCAL_SUCCESS_NOT_FINAL"]
      : []),
    ...(envelope.deliveryRiskState === "likely_failed" ||
    envelope.deliveryEvidenceState === "failed" ||
    envelope.deliveryEvidenceState === "bounced"
      ? ["PORTAL_214_DELIVERY_FAILURE_VISIBLE"]
      : []),
    ...(envelope.deliveryRiskState === "disputed" || envelope.deliveryEvidenceState === "disputed"
      ? ["PORTAL_214_DISPUTE_VISIBLE"]
      : []),
  ];
}

function dominantConversationActionFor(input: {
  readonly coverage: PatientAudienceCoverageProjection;
  readonly sourceCluster: PortalSourceConversationCluster;
  readonly tupleAlignmentState: ConversationTupleAlignmentState;
}): string | null {
  const repairState = repairRequiredStateForCluster(input.sourceCluster, input.coverage);
  if (repairState === "contact_route_repair") return "contact_route_repair";
  if (repairState === "consent_renewal") return "renew_consent";
  if (repairState === "identity_repair" || repairState === "recovery") return "recover_session";
  if (input.tupleAlignmentState !== "aligned") return "refresh_thread_from_authority";
  if (input.coverage.communicationPreviewMode === "step_up_required") return "complete_step_up";
  if (input.coverage.mutationAuthority !== "route_bound_mutation") return null;
  if (
    input.sourceCluster.communicationEnvelopes.some(
      (envelope) =>
        envelope.subthreadType === "secure_message" &&
        (envelope.authoritativeOutcomeState ?? authoritativeOutcomeForEnvelope(envelope)) ===
          "awaiting_reply",
    )
  ) {
    return "send_secure_reply";
  }
  return null;
}

function repairRequiredStateForCluster(
  sourceCluster: PortalSourceConversationCluster,
  coverage: PatientAudienceCoverageProjection,
): ConversationRepairRequiredState {
  if (coverage.surfaceState === "identity_hold" || sourceCluster.identityRepairCaseRef) {
    return "identity_repair";
  }
  if (coverage.surfaceState === "recovery_required") return "recovery";
  if (
    sourceCluster.contactRepairProjection &&
    sourceCluster.contactRepairProjection.sameShellState !== "released"
  ) {
    return "contact_route_repair";
  }
  if (
    sourceCluster.reachabilitySummaryProjection &&
    !sourceCluster.reachabilitySummaryProjection.currentRouteSafe
  ) {
    return "contact_route_repair";
  }
  if (
    sourceCluster.consentCheckpointProjection &&
    sourceCluster.consentCheckpointProjection.surfaceState !== "satisfied"
  ) {
    return "consent_renewal";
  }
  if (
    sourceCluster.communicationEnvelopes.some(
      (envelope) =>
        envelope.deliveryRiskState === "likely_failed" ||
        envelope.deliveryEvidenceState === "failed" ||
        envelope.deliveryEvidenceState === "bounced",
    )
  ) {
    return "contact_route_repair";
  }
  return "none";
}

function replyNeededStateForSubthread(input: {
  readonly coverage: PatientAudienceCoverageProjection;
  readonly subthreadType: ConversationSubthreadType;
  readonly tupleAlignmentState: ConversationTupleAlignmentState;
  readonly sourceCluster: PortalSourceConversationCluster;
}): ConversationReplyNeededState {
  if (input.tupleAlignmentState === "drifted") return "read_only";
  if (
    repairRequiredStateForCluster(input.sourceCluster, input.coverage) === "contact_route_repair"
  ) {
    return "blocked_by_repair";
  }
  if (input.coverage.communicationPreviewMode === "step_up_required") return "blocked_by_step_up";
  if (input.coverage.mutationAuthority !== "route_bound_mutation") return "read_only";
  return input.subthreadType === "secure_message" || input.subthreadType === "clinician_reply"
    ? "reply_needed"
    : "none";
}

function conversationSurfaceStateFor(
  coverage: PatientAudienceCoverageProjection,
  tupleAlignmentState: ConversationTupleAlignmentState,
): ConversationTimelineSurfaceState {
  if (tupleAlignmentState === "recovery_only" || coverage.surfaceState === "recovery_required") {
    return "recovery_only";
  }
  if (tupleAlignmentState === "drifted") return "placeholder";
  if (coverage.surfaceState === "pending_confirmation") return "pending";
  if (
    coverage.communicationPreviewMode === "step_up_required" ||
    coverage.audienceTier === "patient_public"
  ) {
    return "placeholder";
  }
  return coverage.surfaceState === "ready" ? "ready" : "read_only";
}

function dominantConversationDeliveryRisk(
  sourceCluster: PortalSourceConversationCluster,
): ConversationDeliveryRiskState {
  const risks = sourceCluster.communicationEnvelopes.map(
    (envelope) =>
      envelope.deliveryRiskState ?? riskForDeliveryEvidence(envelope.deliveryEvidenceState),
  );
  if (risks.includes("disputed")) return "disputed";
  if (risks.includes("likely_failed")) return "likely_failed";
  if (risks.includes("at_risk")) return "at_risk";
  return "on_track";
}

function dominantConversationOutcome(
  sourceCluster: PortalSourceConversationCluster,
): ConversationAuthoritativeOutcomeState {
  const outcomes = sourceCluster.communicationEnvelopes.map(
    (envelope) => envelope.authoritativeOutcomeState ?? authoritativeOutcomeForEnvelope(envelope),
  );
  for (const outcome of [
    "recovery_required",
    "awaiting_delivery_truth",
    "awaiting_reply",
    "callback_scheduled",
    "awaiting_review",
    "reviewed",
  ] as const) {
    if (outcomes.includes(outcome)) return outcome;
  }
  return "settled";
}

function authoritativeOutcomeForEnvelope(
  envelope: PortalSourceCommunicationEnvelope,
): ConversationAuthoritativeOutcomeState {
  if (
    envelope.deliveryRiskState === "likely_failed" ||
    envelope.deliveryRiskState === "disputed" ||
    envelope.deliveryEvidenceState === "failed" ||
    envelope.deliveryEvidenceState === "bounced" ||
    envelope.deliveryEvidenceState === "disputed"
  ) {
    return "recovery_required";
  }
  if (envelope.subthreadType === "callback") return "callback_scheduled";
  if (envelope.subthreadType === "secure_message" || envelope.subthreadType === "clinician_reply") {
    return "awaiting_reply";
  }
  if (envelope.deliveryEvidenceState === "delivered") return "settled";
  return "awaiting_delivery_truth";
}

function riskForDeliveryEvidence(
  deliveryEvidenceState: ConversationDeliveryEvidenceState | undefined,
): ConversationDeliveryRiskState {
  if (deliveryEvidenceState === "disputed") return "disputed";
  if (deliveryEvidenceState === "failed" || deliveryEvidenceState === "bounced") {
    return "likely_failed";
  }
  if (deliveryEvidenceState === "pending") return "at_risk";
  return "on_track";
}

function receiptKindForEnvelope(
  envelope: PortalSourceCommunicationEnvelope,
): PatientReceiptEnvelope["receiptKind"] {
  if (envelope.deliveryRiskState === "disputed" || envelope.deliveryEvidenceState === "disputed") {
    return "dispute";
  }
  if (
    envelope.deliveryRiskState === "likely_failed" ||
    envelope.deliveryEvidenceState === "failed" ||
    envelope.deliveryEvidenceState === "bounced"
  ) {
    return "delivery_failure";
  }
  if (envelope.subthreadType === "callback") return "callback";
  if (envelope.subthreadType === "reminder") return "reminder";
  return "message";
}

function defaultSubthreadsForCluster(
  sourceCluster: PortalSourceConversationCluster,
): readonly PortalSourceConversationSubthread[] {
  const byKey = new Map<string, PortalSourceConversationSubthread>();
  for (const envelope of sourceCluster.communicationEnvelopes) {
    const subthreadRef = envelope.subthreadRef ?? envelope.subthreadType;
    if (byKey.has(subthreadRef)) continue;
    byKey.set(subthreadRef, {
      subthreadRef,
      subthreadType: envelope.subthreadType,
      owner: envelope.authoredBy === "patient" ? "patient" : "practice",
      label: envelope.previewKindRef ?? envelope.subthreadType,
      communicationEnvelopeRefs: sourceCluster.communicationEnvelopes
        .filter((candidate) => (candidate.subthreadRef ?? candidate.subthreadType) === subthreadRef)
        .map((candidate) => candidate.envelopeRef),
      sortAt: envelope.sortAt ?? envelope.sentAt,
    });
  }
  return [...byKey.values()];
}

function placeholderContractForConversation(
  coverage: PatientAudienceCoverageProjection,
  scope: "preview" | "thread",
): string {
  return `${coverage.requiredPlaceholderContractRef}:conversation_${scope}:kind_reason_next_step_214`;
}

function buildDetailProjection(input: {
  readonly request: PortalSourceRequest;
  readonly coverage: PatientAudienceCoverageProjection;
  readonly consistency: PatientShellConsistencyProjection;
  readonly summary: PatientRequestSummaryProjection;
  readonly lineage: PatientRequestLineageProjection;
  readonly downstream: readonly PatientRequestDownstreamProjection[];
  readonly returnBundle: PatientRequestReturnBundle;
  readonly nextAction: PatientNextActionProjection;
  readonly actionRouting: PatientActionRoutingProjection;
  readonly actionSettlement: PatientActionSettlementProjection;
  readonly safetyInterruption: PatientSafetyInterruptionProjection;
  readonly communicationVisibility: readonly PatientCommunicationVisibilityProjection[];
  readonly observedAt: string;
}): PatientRequestDetailProjection {
  const full = input.coverage.surfaceState === "ready";
  const visibleFieldRefs = full
    ? [
        "header",
        "statusStrip",
        "history",
        "downstreamCards",
        "communicationsPreview",
        "artifactPlaceholders",
        "actionRail",
      ]
    : ["header", "statusStrip", "lineageStrip", "governedPlaceholders"];
  const blockedFieldRefs = full
    ? []
    : ["timelineBody", "threadBodies", "artifactInlinePreview", "liveMutationControls"];
  return {
    requestDetailProjectionId: stableRef(
      "patient_request_detail",
      `${input.coverage.patientAudienceCoverageProjectionId}:${input.request.requestRef}`,
    ),
    coverageProjectionRef: input.coverage.patientAudienceCoverageProjectionId,
    requestRef: input.request.requestRef,
    requestVersionRef: input.request.requestVersionRef,
    patientShellConsistencyRef: input.consistency.patientShellConsistencyRef,
    summaryProjectionRef: input.summary.summaryProjectionRef,
    lineageProjectionRef: input.lineage.patientRequestLineageProjectionId,
    lineageTupleHash: input.lineage.lineageTupleHash,
    downstreamOrderingDigestRef: stableRef(
      "downstream_ordering",
      input.lineage.downstreamProjectionRefs.join("|"),
    ),
    evidenceSnapshotRef: full ? input.request.evidenceSnapshotRef : null,
    evidenceSummaryParityRef: full ? input.request.evidenceSummaryParityRef : null,
    timelineProjectionRef: full ? stableRef("patient_timeline", input.request.requestRef) : null,
    communicationsProjectionRefs: input.communicationVisibility.map(
      (projection) => projection.communicationVisibilityProjectionId,
    ),
    downstreamProjectionRefs: input.downstream.map(
      (projection) => projection.downstreamProjectionRef,
    ),
    nextActionProjectionRef: input.nextAction.nextActionProjectionRef,
    actionRoutingProjectionRef: input.actionRouting.actionRoutingProjectionRef,
    actionSettlementProjectionRef: input.actionSettlement.actionSettlementProjectionRef,
    safetyInterruptionProjectionRef:
      input.safetyInterruption.surfaceState === "clear"
        ? null
        : input.safetyInterruption.safetyInterruptionProjectionRef,
    selectedAnchorRef: input.request.requestRef,
    selectedChildAnchorRef: input.lineage.selectedChildAnchorRef,
    selectedChildAnchorTupleHash: input.lineage.selectedChildAnchorTupleHash,
    requestReturnBundleRef: input.returnBundle.requestReturnBundleRef,
    dominantActionRef: input.nextAction.dominantActionRef,
    placeholderContractRef: input.coverage.requiredPlaceholderContractRef,
    visibleFieldRefs,
    blockedFieldRefs,
    surfaceState: full ? "ready" : input.coverage.surfaceState,
    experienceContinuityEvidenceRef: stableRef(
      "experience_continuity",
      `${input.request.requestRef}:${input.coverage.patientAudienceCoverageProjectionId}`,
    ),
    reasonCodes: mergeReasonCodes(input.coverage.reasonCodes, [
      "PORTAL_185_LIST_DETAIL_COVERAGE_PARITY",
    ]),
    renderedAt: input.observedAt,
    createdByAuthority: AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME,
  };
}

function buildRecoveryIfNeeded(input: {
  readonly input: BuildPatientAudienceCoverageInput;
  readonly coverage: PatientAudienceCoverageProjection;
  readonly consistency: PatientShellConsistencyProjection;
  readonly request: PortalSourceRequest | null;
  readonly observedAt: string;
}): PatientActionRecoveryProjection | null {
  if (input.coverage.surfaceState !== "recovery_required") return null;
  const requestRef = input.request?.requestRef ?? "portal";
  const reason =
    input.coverage.recoveryReason === "none" ? "command_pending" : input.coverage.recoveryReason;
  return {
    actionRecoveryProjectionId: stableRef(
      "patient_action_recovery",
      `${input.coverage.patientAudienceCoverageProjectionId}:${requestRef}`,
    ),
    coverageProjectionRef: input.coverage.patientAudienceCoverageProjectionId,
    governingObjectRef: requestRef,
    originRouteFamilyRef: input.input.routeFamilyRef,
    patientShellConsistencyRef: input.consistency.patientShellConsistencyRef,
    patientDegradedModeProjectionRef: stableRef(
      "patient_degraded_mode",
      input.coverage.patientAudienceCoverageProjectionId,
    ),
    blockedActionRef: input.request?.dominantActionRef ?? null,
    patientRecoveryLoopRef: stableRef("patient_recovery_loop", requestRef),
    recoveryReasonCode: reason,
    entryChannelRef:
      input.input.purposeOfUse === "secure_link_recovery" ? "secure_link" : "authenticated",
    lastSafeSummaryRef: stableRef("last_safe_summary", requestRef),
    summarySafetyTier: "public_safe",
    selectedAnchorRef: requestRef,
    requestReturnBundleRef: input.request
      ? stableRef("patient_request_return_bundle", requestRef)
      : null,
    recoveryContinuationRef: stableRef("recovery_continuation", `${requestRef}:${reason}`),
    actionRecoveryEnvelopeRef: stableRef("action_recovery_envelope", `${requestRef}:${reason}`),
    writableEligibilityFenceRef: "writable_fence_closed_185",
    nextSafeActionRef: "re_authenticate_or_resume_recovery",
    reentryRouteFamilyRef: input.input.routeFamilyRef,
    surfaceState: "recovery_required",
    recoveryTupleHash: digest({
      requestRef,
      reason,
      coverageProjectionRef: input.coverage.patientAudienceCoverageProjectionId,
    }),
    experienceContinuityEvidenceRef: stableRef("experience_continuity", requestRef),
    renderedAt: input.observedAt,
    reasonCodes: mergeReasonCodes(input.coverage.reasonCodes, ["PORTAL_185_SAME_SHELL_RECOVERY"]),
    createdByAuthority: AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME,
  };
}

function buildHoldIfNeeded(input: {
  readonly coverage: PatientAudienceCoverageProjection;
  readonly consistency: PatientShellConsistencyProjection;
  readonly request: PortalSourceRequest | null;
  readonly observedAt: string;
}): PatientIdentityHoldProjection | null {
  if (input.coverage.surfaceState !== "identity_hold") return null;
  const requestRef = input.request?.requestRef ?? "portal";
  const repairCaseRef =
    input.request?.identityRepairCaseRef ??
    stableRef("identity_repair_case", input.coverage.subjectScopeRef);
  return {
    identityHoldProjectionId: stableRef(
      "patient_identity_hold",
      `${input.coverage.patientAudienceCoverageProjectionId}:${repairCaseRef}`,
    ),
    coverageProjectionRef: input.coverage.patientAudienceCoverageProjectionId,
    identityRepairCaseRef: repairCaseRef,
    identityRepairFreezeRef:
      input.request?.identityRepairFreezeRef ?? stableRef("identity_repair_freeze", repairCaseRef),
    identityBindingRef: null,
    bindingVersionRef: null,
    resultingIdentityBindingRef: null,
    identityRepairReleaseSettlementRef: null,
    bindingFenceState: "awaiting_correction",
    governingObjectRef: requestRef,
    patientShellConsistencyRef: input.consistency.patientShellConsistencyRef,
    patientDegradedModeProjectionRef: stableRef(
      "patient_degraded_mode",
      input.coverage.patientAudienceCoverageProjectionId,
    ),
    holdReasonRef: "identity_binding_under_repair",
    downstreamDispositionSummaryRef: stableRef("downstream_disposition_summary", repairCaseRef),
    allowedSummaryTier: "public_safe",
    suppressedActionRefs: compactStrings([
      input.request?.dominantActionRef,
      input.request?.nextSafeActionRef,
    ]),
    writableEligibilityFenceRef: "writable_fence_closed_185",
    nextSafeActionRef: "wait_for_identity_repair_release",
    requestReturnBundleRef: input.request
      ? stableRef("patient_request_return_bundle", requestRef)
      : null,
    resumeContinuationRef: null,
    surfaceState: "active",
    renderedAt: input.observedAt,
    reasonCodes: mergeReasonCodes(input.coverage.reasonCodes, ["PORTAL_185_IDENTITY_HOLD"]),
    createdByAuthority: AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME,
  };
}

function routeTupleHash(input: PortalRouteTupleInput): string {
  return digest({
    routeFamilyRef: input.routeFamilyRef,
    sessionEpochRef: input.sessionEpochRef,
    subjectBindingVersionRef: input.subjectBindingVersionRef,
    routeIntentBindingRef: input.routeIntentBindingRef,
    lineageFenceRef: input.lineageFenceRef,
  });
}

function firstDefined(values: readonly (string | null | undefined)[]): string | null {
  for (const value of values) {
    if (value) return value;
  }
  return null;
}

function compactStrings(values: readonly (string | null | undefined)[]): readonly string[] {
  return values.filter((value): value is string => typeof value === "string" && value.length > 0);
}

function mergeReasonCodes(left: readonly string[], right: readonly string[]): readonly string[] {
  return [...new Set([...left, ...right])];
}

function createEvent(
  eventName: PatientPortalProjectionEventRecord["eventName"],
  coverageProjectionRef: string | null,
  payload: unknown,
): PatientPortalProjectionEventRecord {
  return {
    eventRef: stableRef("portal_projection_event", `${eventName}:${digest(payload)}`),
    eventName,
    coverageProjectionRef,
    occurredAt: new Date().toISOString(),
    payloadHash: digest(payload),
    reasonCodes: extractReasonCodes(payload),
    createdByAuthority: AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME,
  };
}

function extractReasonCodes(payload: unknown): readonly string[] {
  if (payload && typeof payload === "object" && "reasonCodes" in payload) {
    const value = (payload as { readonly reasonCodes?: unknown }).reasonCodes;
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string")
      : [];
  }
  return [];
}

function stableRef(prefix: string, value: string): string {
  return `${prefix}_${createHash("sha256").update(value).digest("hex").slice(0, 24)}`;
}

function digest(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(stableValue(value)))
    .digest("hex");
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.keys(record)
        .sort()
        .map((key) => [key, stableValue(record[key])]),
    );
  }
  return value;
}
