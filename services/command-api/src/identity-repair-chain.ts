import { createHash } from "node:crypto";

export const IDENTITY_REPAIR_ORCHESTRATOR_NAME = "IdentityRepairOrchestrator";
export const IDENTITY_REPAIR_SCHEMA_VERSION = "170.phase2.trust.v1";
export const IDENTITY_REPAIR_POLICY_VERSION = "phase2-identity-repair-v1";

export const identityRepairChainPersistenceTables = [
  "phase2_identity_repair_signals",
  "phase2_identity_repair_cases",
  "phase2_identity_repair_freeze_records",
  "phase2_identity_repair_branch_dispositions",
  "phase2_identity_repair_review_approvals",
  "phase2_identity_repair_authority_corrections",
  "phase2_identity_repair_release_settlements",
  "phase2_identity_repair_hold_projections",
  "phase2_identity_repair_events",
] as const;

export const identityRepairChainMigrationPlanRefs = [
  "services/command-api/migrations/097_phase2_identity_repair_chain.sql",
] as const;

export const identityRepairChainParallelInterfaceGaps = [
  "PARALLEL_INTERFACE_GAP_PHASE2_IDENTITY_REPAIR_SIGNAL_CONVERGENCE_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_IDENTITY_REPAIR_FREEZE_FIRST_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_IDENTITY_REPAIR_BRANCH_DISPOSITION_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_IDENTITY_REPAIR_AUTHORITY_CORRECTION_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_IDENTITY_REPAIR_HOLD_PROJECTION_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_IDENTITY_REPAIR_RELEASE_SETTLEMENT_V1",
] as const;

export const IDENTITY_REPAIR_REASON_CODES = [
  "IR_182_SIGNAL_APPEND_ONLY",
  "IR_182_SIGNAL_REPLAY_RETURNED",
  "IR_182_ACTIVE_CASE_REUSED",
  "IR_182_CASE_OPENED_FOR_FROZEN_BINDING",
  "IR_182_FREEZE_EXACT_ONCE",
  "IR_182_LINEAGE_FENCE_ISSUED_FOR_IDENTITY_REPAIR",
  "IR_182_SESSION_GOVERNOR_FROZE_STALE_SESSIONS",
  "IR_182_ACCESS_GRANTS_SUPERSEDED_BY_ACCESS_GRANT_SERVICE",
  "IR_182_ROUTE_INTENTS_SUPERSEDED",
  "IR_182_NON_ESSENTIAL_COMMUNICATIONS_FROZEN",
  "IR_182_PATIENT_IDENTITY_HOLD_PROJECTION",
  "IR_182_BRANCH_QUARANTINE_ENUMERATED",
  "IR_182_WRONG_PATIENT_NOT_REQUEST_STATE",
  "IR_182_REVIEW_REQUIRED_BEFORE_RELEASE",
  "IR_182_CORRECTION_ONLY_THROUGH_IDENTITY_BINDING_AUTHORITY",
  "IR_182_RELEASE_SETTLEMENT_EXACT_ONCE",
  "IR_182_FRESH_AUTHORITY_ONLY_AFTER_RELEASE",
] as const;

export type IdentityRepairReasonCode = (typeof IDENTITY_REPAIR_REASON_CODES)[number];

export type IdentityRepairSignalClass =
  | "patient_report"
  | "support_report"
  | "auth_subject_conflict"
  | "secure_link_subject_conflict"
  | "telephony_contradiction"
  | "downstream_contradiction"
  | "delivery_dispute"
  | "audit_replay";

export type IdentityRepairSignalDisposition =
  | "suspicion_only"
  | "credible_misbinding"
  | "confirmed_misbinding";

export type IdentityRepairCaseState =
  | "opened"
  | "freeze_committed"
  | "downstream_quarantined"
  | "correction_authority_pending"
  | "corrected"
  | "rebuild_pending"
  | "release_pending"
  | "closed";

export type IdentityRepairFreezeState = "pending" | "active" | "released";
export type IdentityRepairCommunicationsHoldState = "active" | "partial" | "released";
export type IdentityRepairProjectionHoldState = "summary_only" | "read_only" | "recovery_only";

export type IdentityRepairBranchType =
  | "request_shell"
  | "episode_state"
  | "conversation_callback"
  | "external_message_delivery"
  | "file_artifact_visibility"
  | "support_workspace_continuity"
  | "telephony_continuation"
  | "analytics_event_branch"
  | "pharmacy"
  | "booking"
  | "hub_coordination"
  | "message_thread"
  | "artifact_projection"
  | "outbound_communication";

export type IdentityRepairBranchState =
  | "pending_freeze"
  | "quarantined"
  | "compensation_pending"
  | "manual_review_only"
  | "suppressed"
  | "already_safe"
  | "rebuild_required"
  | "rebuilt"
  | "released"
  | "compensated"
  | "terminal_suppressed"
  | "manual_review_closed";

export type IdentityRepairRequiredDisposition =
  | "suppress_visibility"
  | "revalidate_under_new_binding"
  | "compensate_external"
  | "manual_review_only"
  | "already_safe"
  | "rebuild_required";

export type IdentityRepairCorrectionMode = "correction_applied" | "revoked";

export type IdentityRepairReleaseMode =
  | "read_only_resume"
  | "claim_pending_resume"
  | "writable_resume"
  | "manual_follow_up_only";

export interface IdentityRepairSignalRecord {
  readonly repairSignalId: string;
  readonly idempotencyKey: string;
  readonly signalDigest: string;
  readonly episodeId: string;
  readonly affectedRequestRef: string;
  readonly observedIdentityBindingRef: string;
  readonly frozenIdentityBindingRef: string;
  readonly observedSessionRef: string | null;
  readonly observedAccessGrantRef: string | null;
  readonly observedRouteIntentBindingRef: string | null;
  readonly signalClass: IdentityRepairSignalClass;
  readonly signalDisposition: IdentityRepairSignalDisposition;
  readonly evidenceRefs: readonly string[];
  readonly openedRepairCaseRef: string;
  readonly reportedBy: string;
  readonly reportedAt: string;
  readonly reasonCodes: readonly string[];
  readonly createdByAuthority: typeof IDENTITY_REPAIR_ORCHESTRATOR_NAME;
}

export interface IdentityRepairCaseRecord {
  readonly repairCaseId: string;
  readonly episodeId: string;
  readonly affectedRequestRefs: readonly string[];
  readonly openedSignalRefs: readonly string[];
  readonly frozenIdentityBindingRef: string;
  readonly frozenSubjectRef: string | null;
  readonly frozenPatientRef: string | null;
  readonly suspectedWrongBindingRef: string | null;
  readonly repairBasis:
    | "wrong_patient_suspicion"
    | "credible_wrong_patient"
    | "confirmed_wrong_patient";
  readonly lineageFenceEpoch: number;
  readonly state: IdentityRepairCaseState;
  readonly openedBy: string;
  readonly supervisorApprovalRef: string | null;
  readonly independentReviewRef: string | null;
  readonly freezeRecordRef: string | null;
  readonly projectionRebuildRef: string | null;
  readonly downstreamDispositionRefs: readonly string[];
  readonly compensationRefs: readonly string[];
  readonly releaseSettlementRef: string | null;
  readonly bindingAuthoritySettlementRef: string | null;
  readonly resultingIdentityBindingRef: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdByAuthority: typeof IDENTITY_REPAIR_ORCHESTRATOR_NAME;
}

export interface IdentityRepairFreezeRecord {
  readonly freezeRecordId: string;
  readonly idempotencyKey: string;
  readonly identityRepairCaseRef: string;
  readonly frozenIdentityBindingRef: string;
  readonly lineageFenceEpoch: number;
  readonly lineageFenceRef: string;
  readonly issuedFor: "identity_repair";
  readonly sessionTerminationSettlementRefs: readonly string[];
  readonly accessGrantSupersessionRefs: readonly string[];
  readonly supersededRouteIntentBindingRefs: readonly string[];
  readonly communicationsHoldRef: string;
  readonly communicationsHoldState: IdentityRepairCommunicationsHoldState;
  readonly projectionHoldState: IdentityRepairProjectionHoldState;
  readonly patientIdentityHoldProjectionRef: string;
  readonly patientActionRecoveryProjectionRef: string;
  readonly affectedAudienceRefs: readonly string[];
  readonly branchDispositionRefs: readonly string[];
  readonly freezeState: IdentityRepairFreezeState;
  readonly reasonCodes: readonly string[];
  readonly activatedAt: string;
  readonly releasedAt: string | null;
  readonly createdByAuthority: typeof IDENTITY_REPAIR_ORCHESTRATOR_NAME;
}

export interface IdentityRepairBranchDispositionRecord {
  readonly branchDispositionId: string;
  readonly identityRepairCaseRef: string;
  readonly freezeRecordRef: string;
  readonly branchType: IdentityRepairBranchType;
  readonly branchRef: string;
  readonly branchState: IdentityRepairBranchState;
  readonly requiredDisposition: IdentityRepairRequiredDisposition;
  readonly externalSideEffectRef: string | null;
  readonly routeIntentBindingRef: string | null;
  readonly patientVisibleRef: string | null;
  readonly compensationRef: string | null;
  readonly reviewedBy: string | null;
  readonly reasonCodes: readonly string[];
  readonly updatedAt: string;
  readonly createdByAuthority: typeof IDENTITY_REPAIR_ORCHESTRATOR_NAME;
}

export interface IdentityRepairReviewApprovalRecord {
  readonly reviewApprovalId: string;
  readonly idempotencyKey: string;
  readonly identityRepairCaseRef: string;
  readonly freezeRecordRef: string;
  readonly supervisorApprovalRef: string;
  readonly independentReviewRef: string;
  readonly reviewedCorrectionPlanRef: string;
  readonly approvedBySupervisor: string;
  readonly approvedByIndependentReviewer: string;
  readonly approvedAt: string;
  readonly reasonCodes: readonly string[];
  readonly createdByAuthority: typeof IDENTITY_REPAIR_ORCHESTRATOR_NAME;
}

export interface IdentityRepairAuthorityCorrectionRecord {
  readonly authorityCorrectionId: string;
  readonly idempotencyKey: string;
  readonly identityRepairCaseRef: string;
  readonly freezeRecordRef: string;
  readonly correctionMode: IdentityRepairCorrectionMode;
  readonly expectedFrozenIdentityBindingRef: string;
  readonly bindingAuthoritySettlementRef: string;
  readonly resultingIdentityBindingRef: string | null;
  readonly decision: "accepted" | "manual_review_required";
  readonly appliedAt: string;
  readonly reasonCodes: readonly string[];
  readonly createdByAuthority: typeof IDENTITY_REPAIR_ORCHESTRATOR_NAME;
}

export interface IdentityRepairReleaseSettlement {
  readonly releaseSettlementId: string;
  readonly idempotencyKey: string;
  readonly identityRepairCaseRef: string;
  readonly freezeRecordRef: string;
  readonly releaseMode: IdentityRepairReleaseMode;
  readonly supervisorApprovalRef: string;
  readonly independentReviewRef: string;
  readonly bindingAuthoritySettlementRef: string;
  readonly resultingIdentityBindingRef: string | null;
  readonly branchDispositionRefs: readonly string[];
  readonly communicationsReleaseRef: string;
  readonly projectionRebuildRef: string;
  readonly freshSessionAllowed: boolean;
  readonly freshAccessGrantAllowed: boolean;
  readonly freshRouteIntentAllowed: boolean;
  readonly settledAt: string;
  readonly reasonCodes: readonly string[];
  readonly createdByAuthority: typeof IDENTITY_REPAIR_ORCHESTRATOR_NAME;
}

export interface PatientIdentityHoldProjection {
  readonly projectionRef: string;
  readonly identityRepairCaseRef: string;
  readonly frozenIdentityBindingRef: string;
  readonly freezeRecordRef: string | null;
  readonly lineageFenceRef: string | null;
  readonly displayMode: IdentityRepairProjectionHoldState;
  readonly safeSummary: string;
  readonly hiddenPhiDetail: true;
  readonly readOnly: true;
  readonly recoveryOnly: boolean;
  readonly allowedActions: readonly string[];
  readonly blockedActions: readonly string[];
  readonly reasonCodes: readonly string[];
  readonly updatedAt: string;
}

export interface PatientActionRecoveryProjection {
  readonly projectionRef: string;
  readonly identityRepairCaseRef: string;
  readonly frozenIdentityBindingRef: string;
  readonly actionRoutingMode: "recovery_only" | "read_only_resume" | "claim_pending_resume";
  readonly recoveryWorkspaceRef: string;
  readonly allowedRecoveryActions: readonly string[];
  readonly blockedMutationActions: readonly string[];
  readonly noGenericRedirect: true;
  readonly reasonCodes: readonly string[];
  readonly updatedAt: string;
}

export interface IdentityRepairEventRecord {
  readonly eventRef: string;
  readonly eventName:
    | "identity.repair_signal.recorded"
    | "identity.repair_case.opened"
    | "identity.repair_freeze.committed"
    | "identity.repair_branch.quarantined"
    | "identity.repair_review.approved"
    | "identity.repair_authority.corrected"
    | "identity.repair_release.settled";
  readonly identityRepairCaseRef: string;
  readonly occurredAt: string;
  readonly payloadHash: string;
  readonly createdByAuthority: typeof IDENTITY_REPAIR_ORCHESTRATOR_NAME;
}

export interface SessionGovernorRepairPort {
  readonly freezeSessions: (input: {
    readonly identityRepairCaseRef: string;
    readonly frozenIdentityBindingRef: string;
    readonly observedSessionRefs: readonly string[];
    readonly lineageFenceRef: string;
    readonly reason: "identity_repair";
    readonly observedAt: string;
  }) => Promise<{
    readonly sessionTerminationSettlementRefs: readonly string[];
    readonly reasonCodes: readonly string[];
  }>;
}

export interface AccessGrantServiceRepairPort {
  readonly supersedeGrantsForIdentityRepair: (input: {
    readonly identityRepairCaseRef: string;
    readonly frozenIdentityBindingRef: string;
    readonly observedAccessGrantRefs: readonly string[];
    readonly lineageFenceRef: string;
    readonly causeClass: "identity_repair";
    readonly observedAt: string;
  }) => Promise<{
    readonly accessGrantSupersessionRefs: readonly string[];
    readonly reasonCodes: readonly string[];
  }>;
}

export interface RouteIntentRepairPort {
  readonly supersedeRouteIntentsForIdentityRepair: (input: {
    readonly identityRepairCaseRef: string;
    readonly frozenIdentityBindingRef: string;
    readonly observedRouteIntentBindingRefs: readonly string[];
    readonly lineageFenceRef: string;
    readonly observedAt: string;
  }) => Promise<{
    readonly supersededRouteIntentBindingRefs: readonly string[];
    readonly reasonCodes: readonly string[];
  }>;
}

export interface CommunicationFreezePort {
  readonly freezeNonEssentialCommunications: (input: {
    readonly identityRepairCaseRef: string;
    readonly frozenIdentityBindingRef: string;
    readonly affectedRequestRefs: readonly string[];
    readonly lineageFenceRef: string;
    readonly observedAt: string;
  }) => Promise<{
    readonly communicationsHoldRef: string;
    readonly communicationsHoldState: IdentityRepairCommunicationsHoldState;
    readonly affectedAudienceRefs: readonly string[];
    readonly reasonCodes: readonly string[];
  }>;
  readonly releaseCommunications: (input: {
    readonly identityRepairCaseRef: string;
    readonly releaseMode: IdentityRepairReleaseMode;
    readonly releaseSettlementRef: string;
    readonly observedAt: string;
  }) => Promise<{
    readonly communicationsReleaseRef: string;
    readonly reasonCodes: readonly string[];
  }>;
}

export interface ProjectionDegradationPort {
  readonly degradeForIdentityHold: (input: {
    readonly identityRepairCaseRef: string;
    readonly frozenIdentityBindingRef: string;
    readonly freezeRecordRef: string;
    readonly lineageFenceRef: string;
    readonly observedAt: string;
  }) => Promise<{
    readonly patientIdentityHoldProjectionRef: string;
    readonly patientActionRecoveryProjectionRef: string;
    readonly projectionHoldState: IdentityRepairProjectionHoldState;
    readonly reasonCodes: readonly string[];
  }>;
  readonly rebuildAfterRelease: (input: {
    readonly identityRepairCaseRef: string;
    readonly releaseSettlementRef: string;
    readonly resultingIdentityBindingRef: string | null;
    readonly releaseMode: IdentityRepairReleaseMode;
    readonly observedAt: string;
  }) => Promise<{
    readonly projectionRebuildRef: string;
    readonly reasonCodes: readonly string[];
  }>;
}

export interface IdentityBindingAuthorityRepairPort {
  readonly settleRepairBinding: (input: {
    readonly identityRepairCaseRef: string;
    readonly correctionMode: IdentityRepairCorrectionMode;
    readonly expectedFrozenIdentityBindingRef: string;
    readonly correctedIdentityBindingRef: string | null;
    readonly revokedIdentityBindingRef: string | null;
    readonly supervisorApprovalRef: string;
    readonly independentReviewRef: string;
    readonly actorRef: string;
    readonly observedAt: string;
  }) => Promise<{
    readonly bindingAuthoritySettlementRef: string;
    readonly resultingIdentityBindingRef: string | null;
    readonly decision: "accepted" | "manual_review_required";
    readonly reasonCodes: readonly string[];
  }>;
}

export interface RecordIdentityRepairSignalInput {
  readonly idempotencyKey: string;
  readonly episodeId: string;
  readonly affectedRequestRef: string;
  readonly observedIdentityBindingRef: string;
  readonly frozenIdentityBindingRef?: string;
  readonly observedSessionRef?: string | null;
  readonly observedAccessGrantRef?: string | null;
  readonly observedRouteIntentBindingRef?: string | null;
  readonly frozenSubjectRef?: string | null;
  readonly frozenPatientRef?: string | null;
  readonly suspectedWrongBindingRef?: string | null;
  readonly signalClass: IdentityRepairSignalClass;
  readonly signalDisposition: IdentityRepairSignalDisposition;
  readonly evidenceRefs: readonly string[];
  readonly reportedBy: string;
  readonly reportedAt?: string;
}

export interface CommitIdentityRepairFreezeInput {
  readonly freezeIdempotencyKey: string;
  readonly identityRepairCaseRef: string;
  readonly actorRef: string;
  readonly observedAt?: string;
  readonly branchInventory?: readonly IdentityRepairBranchInventoryInput[];
}

export interface IdentityRepairBranchInventoryInput {
  readonly branchType: IdentityRepairBranchType;
  readonly branchRef?: string;
  readonly branchState?: IdentityRepairBranchState;
  readonly requiredDisposition: IdentityRepairRequiredDisposition;
  readonly externalSideEffectRef?: string | null;
  readonly routeIntentBindingRef?: string | null;
  readonly patientVisibleRef?: string | null;
  readonly reasonCodes?: readonly string[];
}

export interface RecordIdentityRepairReviewInput {
  readonly reviewIdempotencyKey: string;
  readonly identityRepairCaseRef: string;
  readonly supervisorApprovalRef: string;
  readonly independentReviewRef: string;
  readonly reviewedCorrectionPlanRef: string;
  readonly approvedBySupervisor: string;
  readonly approvedByIndependentReviewer: string;
  readonly approvedAt?: string;
}

export interface ApplyIdentityRepairAuthorityCorrectionInput {
  readonly correctionIdempotencyKey: string;
  readonly identityRepairCaseRef: string;
  readonly correctionMode: IdentityRepairCorrectionMode;
  readonly correctedIdentityBindingRef?: string | null;
  readonly revokedIdentityBindingRef?: string | null;
  readonly actorRef: string;
  readonly observedAt?: string;
}

export interface SettleIdentityRepairBranchInput {
  readonly identityRepairCaseRef: string;
  readonly branchDispositionId: string;
  readonly nextState:
    | "rebuilt"
    | "released"
    | "compensated"
    | "terminal_suppressed"
    | "manual_review_closed"
    | "already_safe";
  readonly compensationRef?: string | null;
  readonly reviewedBy: string;
  readonly observedAt?: string;
}

export interface SettleIdentityRepairReleaseInput {
  readonly releaseIdempotencyKey: string;
  readonly identityRepairCaseRef: string;
  readonly releaseMode: IdentityRepairReleaseMode;
  readonly actorRef: string;
  readonly observedAt?: string;
}

export interface RouteDuringActiveRepairInput {
  readonly identityRepairCaseRef?: string;
  readonly frozenIdentityBindingRef?: string;
  readonly observedAt?: string;
}

export interface IdentityRepairRepositorySnapshots {
  readonly signals: readonly IdentityRepairSignalRecord[];
  readonly cases: readonly IdentityRepairCaseRecord[];
  readonly freezeRecords: readonly IdentityRepairFreezeRecord[];
  readonly branchDispositions: readonly IdentityRepairBranchDispositionRecord[];
  readonly reviewApprovals: readonly IdentityRepairReviewApprovalRecord[];
  readonly authorityCorrections: readonly IdentityRepairAuthorityCorrectionRecord[];
  readonly releaseSettlements: readonly IdentityRepairReleaseSettlement[];
  readonly patientIdentityHoldProjections: readonly PatientIdentityHoldProjection[];
  readonly patientActionRecoveryProjections: readonly PatientActionRecoveryProjection[];
  readonly events: readonly IdentityRepairEventRecord[];
}

export interface IdentityRepairRepository {
  readonly getSignalByIdempotencyKey: (idempotencyKey: string) => IdentityRepairSignalRecord | null;
  readonly getSignalByDigest: (signalDigest: string) => IdentityRepairSignalRecord | null;
  readonly saveSignal: (signal: IdentityRepairSignalRecord) => void;
  readonly listSignalsByCase: (
    identityRepairCaseRef: string,
  ) => readonly IdentityRepairSignalRecord[];
  readonly getActiveCaseByFrozenBinding: (
    frozenIdentityBindingRef: string,
  ) => IdentityRepairCaseRecord | null;
  readonly getCase: (identityRepairCaseRef: string) => IdentityRepairCaseRecord | null;
  readonly saveCase: (repairCase: IdentityRepairCaseRecord) => void;
  readonly updateCase: (repairCase: IdentityRepairCaseRecord) => void;
  readonly getFreezeByIdempotencyKey: (idempotencyKey: string) => IdentityRepairFreezeRecord | null;
  readonly getFreezeByCase: (identityRepairCaseRef: string) => IdentityRepairFreezeRecord | null;
  readonly saveFreeze: (freeze: IdentityRepairFreezeRecord) => void;
  readonly updateFreeze: (freeze: IdentityRepairFreezeRecord) => void;
  readonly saveBranch: (branch: IdentityRepairBranchDispositionRecord) => void;
  readonly updateBranch: (branch: IdentityRepairBranchDispositionRecord) => void;
  readonly getBranch: (branchDispositionId: string) => IdentityRepairBranchDispositionRecord | null;
  readonly listBranchesByCase: (
    identityRepairCaseRef: string,
  ) => readonly IdentityRepairBranchDispositionRecord[];
  readonly getReviewByIdempotencyKey: (
    idempotencyKey: string,
  ) => IdentityRepairReviewApprovalRecord | null;
  readonly getReviewByCase: (
    identityRepairCaseRef: string,
  ) => IdentityRepairReviewApprovalRecord | null;
  readonly saveReview: (review: IdentityRepairReviewApprovalRecord) => void;
  readonly getCorrectionByIdempotencyKey: (
    idempotencyKey: string,
  ) => IdentityRepairAuthorityCorrectionRecord | null;
  readonly getCorrectionByCase: (
    identityRepairCaseRef: string,
  ) => IdentityRepairAuthorityCorrectionRecord | null;
  readonly saveCorrection: (correction: IdentityRepairAuthorityCorrectionRecord) => void;
  readonly getReleaseByIdempotencyKey: (
    idempotencyKey: string,
  ) => IdentityRepairReleaseSettlement | null;
  readonly getReleaseByCase: (
    identityRepairCaseRef: string,
  ) => IdentityRepairReleaseSettlement | null;
  readonly saveRelease: (release: IdentityRepairReleaseSettlement) => void;
  readonly saveHoldProjection: (
    holdProjection: PatientIdentityHoldProjection,
    recoveryProjection: PatientActionRecoveryProjection,
  ) => void;
  readonly getHoldProjectionByCase: (identityRepairCaseRef: string) => {
    readonly holdProjection: PatientIdentityHoldProjection;
    readonly recoveryProjection: PatientActionRecoveryProjection;
  } | null;
  readonly appendEvent: (event: IdentityRepairEventRecord) => void;
  readonly snapshots: () => IdentityRepairRepositorySnapshots;
}

export interface IdentityRepairOrchestrator {
  readonly recordSignal: (input: RecordIdentityRepairSignalInput) => Promise<{
    readonly signal: IdentityRepairSignalRecord;
    readonly repairCase: IdentityRepairCaseRecord;
    readonly replayedSignal: boolean;
    readonly reusedActiveCase: boolean;
  }>;
  readonly commitFreeze: (input: CommitIdentityRepairFreezeInput) => Promise<{
    readonly freezeRecord: IdentityRepairFreezeRecord;
    readonly repairCase: IdentityRepairCaseRecord;
    readonly branchDispositions: readonly IdentityRepairBranchDispositionRecord[];
    readonly patientIdentityHoldProjection: PatientIdentityHoldProjection;
    readonly patientActionRecoveryProjection: PatientActionRecoveryProjection;
    readonly replayedFreeze: boolean;
  }>;
  readonly routeDuringActiveRepair: (input: RouteDuringActiveRepairInput) => Promise<{
    readonly decision: "identity_hold" | "no_active_repair";
    readonly patientIdentityHoldProjection: PatientIdentityHoldProjection | null;
    readonly patientActionRecoveryProjection: PatientActionRecoveryProjection | null;
    readonly reasonCodes: readonly string[];
  }>;
  readonly recordReviewApproval: (input: RecordIdentityRepairReviewInput) => Promise<{
    readonly reviewApproval: IdentityRepairReviewApprovalRecord;
    readonly repairCase: IdentityRepairCaseRecord;
    readonly replayedReview: boolean;
  }>;
  readonly applyAuthorityCorrection: (
    input: ApplyIdentityRepairAuthorityCorrectionInput,
  ) => Promise<{
    readonly correction: IdentityRepairAuthorityCorrectionRecord;
    readonly repairCase: IdentityRepairCaseRecord;
    readonly replayedCorrection: boolean;
  }>;
  readonly settleBranchDisposition: (input: SettleIdentityRepairBranchInput) => Promise<{
    readonly branchDisposition: IdentityRepairBranchDispositionRecord;
    readonly repairCase: IdentityRepairCaseRecord;
  }>;
  readonly settleRelease: (input: SettleIdentityRepairReleaseInput) => Promise<{
    readonly releaseSettlement: IdentityRepairReleaseSettlement;
    readonly repairCase: IdentityRepairCaseRecord;
    readonly replayedRelease: boolean;
  }>;
}

export interface IdentityRepairOrchestratorApplication {
  readonly identityRepairOrchestrator: IdentityRepairOrchestrator;
  readonly repository: IdentityRepairRepository;
  readonly migrationPlanRef: (typeof identityRepairChainMigrationPlanRefs)[number];
  readonly migrationPlanRefs: typeof identityRepairChainMigrationPlanRefs;
  readonly persistenceTables: typeof identityRepairChainPersistenceTables;
  readonly parallelInterfaceGaps: typeof identityRepairChainParallelInterfaceGaps;
  readonly policyVersion: typeof IDENTITY_REPAIR_POLICY_VERSION;
}

export interface CreateIdentityRepairOrchestratorOptions {
  readonly repository?: IdentityRepairRepository;
  readonly sessionGovernor?: SessionGovernorRepairPort;
  readonly accessGrantService?: AccessGrantServiceRepairPort;
  readonly routeIntentSupersession?: RouteIntentRepairPort;
  readonly communicationFreeze?: CommunicationFreezePort;
  readonly projectionDegradation?: ProjectionDegradationPort;
  readonly identityBindingAuthority?: IdentityBindingAuthorityRepairPort;
}

const releaseReadyBranchStates: readonly IdentityRepairBranchState[] = [
  "already_safe",
  "suppressed",
  "rebuilt",
  "released",
  "compensated",
  "terminal_suppressed",
  "manual_review_closed",
];

const defaultBranchInventory: readonly IdentityRepairBranchInventoryInput[] = [
  {
    branchType: "request_shell",
    branchState: "quarantined",
    requiredDisposition: "revalidate_under_new_binding",
    reasonCodes: ["IR_182_BRANCH_QUARANTINE_ENUMERATED"],
  },
  {
    branchType: "episode_state",
    branchState: "rebuild_required",
    requiredDisposition: "rebuild_required",
    reasonCodes: ["IR_182_WRONG_PATIENT_NOT_REQUEST_STATE"],
  },
  {
    branchType: "conversation_callback",
    branchState: "manual_review_only",
    requiredDisposition: "manual_review_only",
    reasonCodes: ["IR_182_BRANCH_QUARANTINE_ENUMERATED"],
  },
  {
    branchType: "external_message_delivery",
    branchState: "compensation_pending",
    requiredDisposition: "compensate_external",
    reasonCodes: ["IR_182_BRANCH_QUARANTINE_ENUMERATED"],
  },
  {
    branchType: "file_artifact_visibility",
    branchState: "suppressed",
    requiredDisposition: "suppress_visibility",
    reasonCodes: ["IR_182_BRANCH_QUARANTINE_ENUMERATED"],
  },
  {
    branchType: "support_workspace_continuity",
    branchState: "manual_review_only",
    requiredDisposition: "manual_review_only",
    reasonCodes: ["IR_182_BRANCH_QUARANTINE_ENUMERATED"],
  },
  {
    branchType: "telephony_continuation",
    branchState: "quarantined",
    requiredDisposition: "revalidate_under_new_binding",
    reasonCodes: ["IR_182_BRANCH_QUARANTINE_ENUMERATED"],
  },
  {
    branchType: "analytics_event_branch",
    branchState: "already_safe",
    requiredDisposition: "already_safe",
    reasonCodes: ["IR_182_BRANCH_QUARANTINE_ENUMERATED"],
  },
];

export function createInMemoryIdentityRepairRepository(): IdentityRepairRepository {
  const signalsById = new Map<string, IdentityRepairSignalRecord>();
  const signalsByIdempotencyKey = new Map<string, string>();
  const signalsByDigest = new Map<string, string>();
  const casesById = new Map<string, IdentityRepairCaseRecord>();
  const activeCasesByFrozenBinding = new Map<string, string>();
  const freezeRecordsById = new Map<string, IdentityRepairFreezeRecord>();
  const freezeRecordsByIdempotencyKey = new Map<string, string>();
  const freezeRecordsByCase = new Map<string, string>();
  const branchesById = new Map<string, IdentityRepairBranchDispositionRecord>();
  const branchesByCase = new Map<string, string[]>();
  const reviewsByIdempotencyKey = new Map<string, string>();
  const reviewsByCase = new Map<string, IdentityRepairReviewApprovalRecord>();
  const reviewsById = new Map<string, IdentityRepairReviewApprovalRecord>();
  const correctionsByIdempotencyKey = new Map<string, string>();
  const correctionsByCase = new Map<string, IdentityRepairAuthorityCorrectionRecord>();
  const correctionsById = new Map<string, IdentityRepairAuthorityCorrectionRecord>();
  const releasesByIdempotencyKey = new Map<string, string>();
  const releasesByCase = new Map<string, IdentityRepairReleaseSettlement>();
  const releasesById = new Map<string, IdentityRepairReleaseSettlement>();
  const holdProjectionsByCase = new Map<
    string,
    {
      readonly holdProjection: PatientIdentityHoldProjection;
      readonly recoveryProjection: PatientActionRecoveryProjection;
    }
  >();
  const events: IdentityRepairEventRecord[] = [];

  function indexCase(repairCase: IdentityRepairCaseRecord): void {
    casesById.set(repairCase.repairCaseId, repairCase);
    if (repairCase.state === "closed") {
      activeCasesByFrozenBinding.delete(repairCase.frozenIdentityBindingRef);
    } else {
      activeCasesByFrozenBinding.set(repairCase.frozenIdentityBindingRef, repairCase.repairCaseId);
    }
  }

  return {
    getSignalByIdempotencyKey(idempotencyKey) {
      const signalId = signalsByIdempotencyKey.get(idempotencyKey);
      return signalId ? (signalsById.get(signalId) ?? null) : null;
    },
    getSignalByDigest(signalDigest) {
      const signalId = signalsByDigest.get(signalDigest);
      return signalId ? (signalsById.get(signalId) ?? null) : null;
    },
    saveSignal(signal) {
      if (signalsById.has(signal.repairSignalId)) {
        throw new Error(`IdentityRepairSignal already exists: ${signal.repairSignalId}`);
      }
      signalsById.set(signal.repairSignalId, signal);
      signalsByIdempotencyKey.set(signal.idempotencyKey, signal.repairSignalId);
      signalsByDigest.set(signal.signalDigest, signal.repairSignalId);
    },
    listSignalsByCase(identityRepairCaseRef) {
      return [...signalsById.values()].filter(
        (signal) => signal.openedRepairCaseRef === identityRepairCaseRef,
      );
    },
    getActiveCaseByFrozenBinding(frozenIdentityBindingRef) {
      const caseId = activeCasesByFrozenBinding.get(frozenIdentityBindingRef);
      return caseId ? (casesById.get(caseId) ?? null) : null;
    },
    getCase(identityRepairCaseRef) {
      return casesById.get(identityRepairCaseRef) ?? null;
    },
    saveCase(repairCase) {
      if (casesById.has(repairCase.repairCaseId)) {
        throw new Error(`IdentityRepairCase already exists: ${repairCase.repairCaseId}`);
      }
      indexCase(repairCase);
    },
    updateCase(repairCase) {
      if (!casesById.has(repairCase.repairCaseId)) {
        throw new Error(`IdentityRepairCase is missing: ${repairCase.repairCaseId}`);
      }
      indexCase(repairCase);
    },
    getFreezeByIdempotencyKey(idempotencyKey) {
      const freezeRecordId = freezeRecordsByIdempotencyKey.get(idempotencyKey);
      return freezeRecordId ? (freezeRecordsById.get(freezeRecordId) ?? null) : null;
    },
    getFreezeByCase(identityRepairCaseRef) {
      const freezeRecordId = freezeRecordsByCase.get(identityRepairCaseRef);
      return freezeRecordId ? (freezeRecordsById.get(freezeRecordId) ?? null) : null;
    },
    saveFreeze(freeze) {
      if (freezeRecordsByCase.has(freeze.identityRepairCaseRef)) {
        throw new Error(
          `IdentityRepairFreezeRecord already exists: ${freeze.identityRepairCaseRef}`,
        );
      }
      freezeRecordsById.set(freeze.freezeRecordId, freeze);
      freezeRecordsByIdempotencyKey.set(freeze.idempotencyKey, freeze.freezeRecordId);
      freezeRecordsByCase.set(freeze.identityRepairCaseRef, freeze.freezeRecordId);
    },
    updateFreeze(freeze) {
      if (!freezeRecordsById.has(freeze.freezeRecordId)) {
        throw new Error(`IdentityRepairFreezeRecord is missing: ${freeze.freezeRecordId}`);
      }
      freezeRecordsById.set(freeze.freezeRecordId, freeze);
      freezeRecordsByCase.set(freeze.identityRepairCaseRef, freeze.freezeRecordId);
    },
    saveBranch(branch) {
      branchesById.set(branch.branchDispositionId, branch);
      const existing = branchesByCase.get(branch.identityRepairCaseRef) ?? [];
      branchesByCase.set(
        branch.identityRepairCaseRef,
        unique([...existing, branch.branchDispositionId]),
      );
    },
    updateBranch(branch) {
      if (!branchesById.has(branch.branchDispositionId)) {
        throw new Error(
          `IdentityRepairBranchDisposition is missing: ${branch.branchDispositionId}`,
        );
      }
      branchesById.set(branch.branchDispositionId, branch);
    },
    getBranch(branchDispositionId) {
      return branchesById.get(branchDispositionId) ?? null;
    },
    listBranchesByCase(identityRepairCaseRef) {
      return (branchesByCase.get(identityRepairCaseRef) ?? [])
        .map((branchId) => branchesById.get(branchId))
        .filter((branch): branch is IdentityRepairBranchDispositionRecord => branch !== undefined);
    },
    getReviewByIdempotencyKey(idempotencyKey) {
      const reviewId = reviewsByIdempotencyKey.get(idempotencyKey);
      return reviewId ? (reviewsById.get(reviewId) ?? null) : null;
    },
    getReviewByCase(identityRepairCaseRef) {
      return reviewsByCase.get(identityRepairCaseRef) ?? null;
    },
    saveReview(review) {
      reviewsById.set(review.reviewApprovalId, review);
      reviewsByIdempotencyKey.set(review.idempotencyKey, review.reviewApprovalId);
      reviewsByCase.set(review.identityRepairCaseRef, review);
    },
    getCorrectionByIdempotencyKey(idempotencyKey) {
      const correctionId = correctionsByIdempotencyKey.get(idempotencyKey);
      return correctionId ? (correctionsById.get(correctionId) ?? null) : null;
    },
    getCorrectionByCase(identityRepairCaseRef) {
      return correctionsByCase.get(identityRepairCaseRef) ?? null;
    },
    saveCorrection(correction) {
      correctionsById.set(correction.authorityCorrectionId, correction);
      correctionsByIdempotencyKey.set(correction.idempotencyKey, correction.authorityCorrectionId);
      correctionsByCase.set(correction.identityRepairCaseRef, correction);
    },
    getReleaseByIdempotencyKey(idempotencyKey) {
      const releaseId = releasesByIdempotencyKey.get(idempotencyKey);
      return releaseId ? (releasesById.get(releaseId) ?? null) : null;
    },
    getReleaseByCase(identityRepairCaseRef) {
      return releasesByCase.get(identityRepairCaseRef) ?? null;
    },
    saveRelease(release) {
      releasesById.set(release.releaseSettlementId, release);
      releasesByIdempotencyKey.set(release.idempotencyKey, release.releaseSettlementId);
      releasesByCase.set(release.identityRepairCaseRef, release);
    },
    saveHoldProjection(holdProjection, recoveryProjection) {
      holdProjectionsByCase.set(holdProjection.identityRepairCaseRef, {
        holdProjection,
        recoveryProjection,
      });
    },
    getHoldProjectionByCase(identityRepairCaseRef) {
      return holdProjectionsByCase.get(identityRepairCaseRef) ?? null;
    },
    appendEvent(event) {
      events.push(event);
    },
    snapshots() {
      return {
        signals: [...signalsById.values()],
        cases: [...casesById.values()],
        freezeRecords: [...freezeRecordsById.values()],
        branchDispositions: [...branchesById.values()],
        reviewApprovals: [...reviewsById.values()],
        authorityCorrections: [...correctionsById.values()],
        releaseSettlements: [...releasesById.values()],
        patientIdentityHoldProjections: [...holdProjectionsByCase.values()].map(
          (entry) => entry.holdProjection,
        ),
        patientActionRecoveryProjections: [...holdProjectionsByCase.values()].map(
          (entry) => entry.recoveryProjection,
        ),
        events: [...events],
      };
    },
  };
}

export function createIdentityRepairOrchestrator(
  options: CreateIdentityRepairOrchestratorOptions = {},
): IdentityRepairOrchestratorApplication {
  const repository = options.repository ?? createInMemoryIdentityRepairRepository();
  const sessionGovernor = options.sessionGovernor ?? createDefaultSessionGovernorRepairPort();
  const accessGrantService =
    options.accessGrantService ?? createDefaultAccessGrantServiceRepairPort();
  const routeIntentSupersession =
    options.routeIntentSupersession ?? createDefaultRouteIntentRepairPort();
  const communicationFreeze = options.communicationFreeze ?? createDefaultCommunicationFreezePort();
  const projectionDegradation =
    options.projectionDegradation ?? createDefaultProjectionDegradationPort();
  const identityBindingAuthority =
    options.identityBindingAuthority ?? createDefaultIdentityBindingAuthorityRepairPort();

  const identityRepairOrchestrator: IdentityRepairOrchestrator = {
    async recordSignal(input) {
      const existingByIdempotency = repository.getSignalByIdempotencyKey(input.idempotencyKey);
      if (existingByIdempotency) {
        const repairCase = requireCase(repository, existingByIdempotency.openedRepairCaseRef);
        return {
          signal: existingByIdempotency,
          repairCase,
          replayedSignal: true,
          reusedActiveCase: true,
        };
      }

      const signalDigest = computeSignalDigest(input);
      const existingByDigest = repository.getSignalByDigest(signalDigest);
      if (existingByDigest) {
        const repairCase = requireCase(repository, existingByDigest.openedRepairCaseRef);
        return {
          signal: existingByDigest,
          repairCase,
          replayedSignal: true,
          reusedActiveCase: true,
        };
      }

      const reportedAt = input.reportedAt ?? new Date().toISOString();
      const frozenIdentityBindingRef =
        input.frozenIdentityBindingRef ?? input.observedIdentityBindingRef;
      const activeCase = repository.getActiveCaseByFrozenBinding(frozenIdentityBindingRef);
      const reusedActiveCase = activeCase !== null;
      const repairCaseRef =
        activeCase?.repairCaseId ?? makeStableRef("ir_case", `${frozenIdentityBindingRef}:case`);
      const signal: IdentityRepairSignalRecord = {
        repairSignalId: makeStableRef("ir_signal", input.idempotencyKey),
        idempotencyKey: input.idempotencyKey,
        signalDigest,
        episodeId: input.episodeId,
        affectedRequestRef: input.affectedRequestRef,
        observedIdentityBindingRef: input.observedIdentityBindingRef,
        frozenIdentityBindingRef,
        observedSessionRef: input.observedSessionRef ?? null,
        observedAccessGrantRef: input.observedAccessGrantRef ?? null,
        observedRouteIntentBindingRef: input.observedRouteIntentBindingRef ?? null,
        signalClass: input.signalClass,
        signalDisposition: input.signalDisposition,
        evidenceRefs: [...input.evidenceRefs],
        openedRepairCaseRef: repairCaseRef,
        reportedBy: input.reportedBy,
        reportedAt,
        reasonCodes: [
          "IR_182_SIGNAL_APPEND_ONLY",
          reusedActiveCase ? "IR_182_ACTIVE_CASE_REUSED" : "IR_182_CASE_OPENED_FOR_FROZEN_BINDING",
        ],
        createdByAuthority: IDENTITY_REPAIR_ORCHESTRATOR_NAME,
      };
      repository.saveSignal(signal);

      const repairCase =
        activeCase === null
          ? createRepairCaseFromSignal(signal, input)
          : mergeSignalIntoActiveCase(activeCase, signal, input);

      if (activeCase === null) {
        repository.saveCase(repairCase);
        repository.appendEvent(
          createEvent("identity.repair_case.opened", repairCase.repairCaseId, repairCase),
        );
      } else {
        repository.updateCase(repairCase);
      }
      repository.appendEvent(
        createEvent("identity.repair_signal.recorded", repairCase.repairCaseId, signal),
      );

      const preliminaryHold = buildHoldProjections({
        repairCase,
        freezeRecord: null,
        holdState: "recovery_only",
        updatedAt: reportedAt,
      });
      repository.saveHoldProjection(
        preliminaryHold.holdProjection,
        preliminaryHold.recoveryProjection,
      );

      return {
        signal,
        repairCase,
        replayedSignal: false,
        reusedActiveCase,
      };
    },

    async commitFreeze(input) {
      const existingByIdempotency = repository.getFreezeByIdempotencyKey(
        input.freezeIdempotencyKey,
      );
      if (existingByIdempotency) {
        const repairCase = requireCase(repository, existingByIdempotency.identityRepairCaseRef);
        const projections = requireHoldProjection(repository, repairCase.repairCaseId);
        return {
          freezeRecord: existingByIdempotency,
          repairCase,
          branchDispositions: repository.listBranchesByCase(repairCase.repairCaseId),
          patientIdentityHoldProjection: projections.holdProjection,
          patientActionRecoveryProjection: projections.recoveryProjection,
          replayedFreeze: true,
        };
      }

      const existingByCase = repository.getFreezeByCase(input.identityRepairCaseRef);
      if (existingByCase) {
        const repairCase = requireCase(repository, existingByCase.identityRepairCaseRef);
        const projections = requireHoldProjection(repository, repairCase.repairCaseId);
        return {
          freezeRecord: existingByCase,
          repairCase,
          branchDispositions: repository.listBranchesByCase(repairCase.repairCaseId),
          patientIdentityHoldProjection: projections.holdProjection,
          patientActionRecoveryProjection: projections.recoveryProjection,
          replayedFreeze: true,
        };
      }

      const repairCase = requireCase(repository, input.identityRepairCaseRef);
      if (repairCase.state === "closed") {
        throw new Error("IdentityRepairCase is closed and cannot be frozen");
      }

      const observedAt = input.observedAt ?? new Date().toISOString();
      const lineageFenceEpoch = repairCase.lineageFenceEpoch + 1;
      const lineageFenceRef = makeStableRef(
        "lineage_fence_identity_repair",
        `${repairCase.repairCaseId}:${lineageFenceEpoch}`,
      );
      const signalRefs = repository.listSignalsByCase(repairCase.repairCaseId);
      const observedSessionRefs = unique(
        signalRefs
          .map((signal) => signal.observedSessionRef)
          .filter((ref): ref is string => ref !== null),
      );
      const observedAccessGrantRefs = unique(
        signalRefs
          .map((signal) => signal.observedAccessGrantRef)
          .filter((ref): ref is string => ref !== null),
      );
      const observedRouteIntentBindingRefs = unique(
        signalRefs
          .map((signal) => signal.observedRouteIntentBindingRef)
          .filter((ref): ref is string => ref !== null),
      );

      const sessionSettlement = await sessionGovernor.freezeSessions({
        identityRepairCaseRef: repairCase.repairCaseId,
        frozenIdentityBindingRef: repairCase.frozenIdentityBindingRef,
        observedSessionRefs,
        lineageFenceRef,
        reason: "identity_repair",
        observedAt,
      });
      const grantSettlement = await accessGrantService.supersedeGrantsForIdentityRepair({
        identityRepairCaseRef: repairCase.repairCaseId,
        frozenIdentityBindingRef: repairCase.frozenIdentityBindingRef,
        observedAccessGrantRefs,
        lineageFenceRef,
        causeClass: "identity_repair",
        observedAt,
      });
      const routeSettlement = await routeIntentSupersession.supersedeRouteIntentsForIdentityRepair({
        identityRepairCaseRef: repairCase.repairCaseId,
        frozenIdentityBindingRef: repairCase.frozenIdentityBindingRef,
        observedRouteIntentBindingRefs,
        lineageFenceRef,
        observedAt,
      });
      const communicationSettlement = await communicationFreeze.freezeNonEssentialCommunications({
        identityRepairCaseRef: repairCase.repairCaseId,
        frozenIdentityBindingRef: repairCase.frozenIdentityBindingRef,
        affectedRequestRefs: repairCase.affectedRequestRefs,
        lineageFenceRef,
        observedAt,
      });
      const freezeRecordId = makeStableRef("ir_freeze", input.freezeIdempotencyKey);
      const projectionSettlement = await projectionDegradation.degradeForIdentityHold({
        identityRepairCaseRef: repairCase.repairCaseId,
        frozenIdentityBindingRef: repairCase.frozenIdentityBindingRef,
        freezeRecordRef: freezeRecordId,
        lineageFenceRef,
        observedAt,
      });

      const freezeRecord: IdentityRepairFreezeRecord = {
        freezeRecordId,
        idempotencyKey: input.freezeIdempotencyKey,
        identityRepairCaseRef: repairCase.repairCaseId,
        frozenIdentityBindingRef: repairCase.frozenIdentityBindingRef,
        lineageFenceEpoch,
        lineageFenceRef,
        issuedFor: "identity_repair",
        sessionTerminationSettlementRefs: sessionSettlement.sessionTerminationSettlementRefs,
        accessGrantSupersessionRefs: grantSettlement.accessGrantSupersessionRefs,
        supersededRouteIntentBindingRefs: routeSettlement.supersededRouteIntentBindingRefs,
        communicationsHoldRef: communicationSettlement.communicationsHoldRef,
        communicationsHoldState: communicationSettlement.communicationsHoldState,
        projectionHoldState: projectionSettlement.projectionHoldState,
        patientIdentityHoldProjectionRef: projectionSettlement.patientIdentityHoldProjectionRef,
        patientActionRecoveryProjectionRef: projectionSettlement.patientActionRecoveryProjectionRef,
        affectedAudienceRefs: communicationSettlement.affectedAudienceRefs,
        branchDispositionRefs: [],
        freezeState: "active",
        reasonCodes: unique([
          "IR_182_FREEZE_EXACT_ONCE",
          "IR_182_LINEAGE_FENCE_ISSUED_FOR_IDENTITY_REPAIR",
          "IR_182_SESSION_GOVERNOR_FROZE_STALE_SESSIONS",
          "IR_182_ACCESS_GRANTS_SUPERSEDED_BY_ACCESS_GRANT_SERVICE",
          "IR_182_ROUTE_INTENTS_SUPERSEDED",
          "IR_182_NON_ESSENTIAL_COMMUNICATIONS_FROZEN",
          "IR_182_PATIENT_IDENTITY_HOLD_PROJECTION",
          ...sessionSettlement.reasonCodes,
          ...grantSettlement.reasonCodes,
          ...routeSettlement.reasonCodes,
          ...communicationSettlement.reasonCodes,
          ...projectionSettlement.reasonCodes,
        ]),
        activatedAt: observedAt,
        releasedAt: null,
        createdByAuthority: IDENTITY_REPAIR_ORCHESTRATOR_NAME,
      };
      repository.saveFreeze(freezeRecord);

      const branchDispositions = (input.branchInventory ?? defaultBranchInventory).map(
        (branch, index): IdentityRepairBranchDispositionRecord => {
          const branchRef =
            branch.branchRef ??
            makeStableRef(
              `branch_${branch.branchType}`,
              `${repairCase.repairCaseId}:${freezeRecord.freezeRecordId}:${index}`,
            );
          return {
            branchDispositionId: makeStableRef(
              "ir_branch",
              `${freezeRecord.freezeRecordId}:${branch.branchType}:${branchRef}`,
            ),
            identityRepairCaseRef: repairCase.repairCaseId,
            freezeRecordRef: freezeRecord.freezeRecordId,
            branchType: branch.branchType,
            branchRef,
            branchState: branch.branchState ?? "quarantined",
            requiredDisposition: branch.requiredDisposition,
            externalSideEffectRef: branch.externalSideEffectRef ?? null,
            routeIntentBindingRef: branch.routeIntentBindingRef ?? null,
            patientVisibleRef: branch.patientVisibleRef ?? null,
            compensationRef: null,
            reviewedBy: null,
            reasonCodes: unique([
              "IR_182_BRANCH_QUARANTINE_ENUMERATED",
              ...(branch.reasonCodes ?? []),
            ]),
            updatedAt: observedAt,
            createdByAuthority: IDENTITY_REPAIR_ORCHESTRATOR_NAME,
          };
        },
      );
      for (const branch of branchDispositions) {
        repository.saveBranch(branch);
      }

      const freezeWithBranches: IdentityRepairFreezeRecord = {
        ...freezeRecord,
        branchDispositionRefs: branchDispositions.map((branch) => branch.branchDispositionId),
      };
      repository.updateFreeze(freezeWithBranches);

      const updatedCase: IdentityRepairCaseRecord = {
        ...repairCase,
        lineageFenceEpoch,
        state: "downstream_quarantined",
        freezeRecordRef: freezeWithBranches.freezeRecordId,
        downstreamDispositionRefs: branchDispositions.map((branch) => branch.branchDispositionId),
        updatedAt: observedAt,
      };
      repository.updateCase(updatedCase);

      const projections = buildHoldProjections({
        repairCase: updatedCase,
        freezeRecord: freezeWithBranches,
        holdState: projectionSettlement.projectionHoldState,
        updatedAt: observedAt,
      });
      repository.saveHoldProjection(projections.holdProjection, projections.recoveryProjection);
      repository.appendEvent(
        createEvent(
          "identity.repair_freeze.committed",
          updatedCase.repairCaseId,
          freezeWithBranches,
        ),
      );
      repository.appendEvent(
        createEvent(
          "identity.repair_branch.quarantined",
          updatedCase.repairCaseId,
          branchDispositions,
        ),
      );

      return {
        freezeRecord: freezeWithBranches,
        repairCase: updatedCase,
        branchDispositions,
        patientIdentityHoldProjection: projections.holdProjection,
        patientActionRecoveryProjection: projections.recoveryProjection,
        replayedFreeze: false,
      };
    },

    async routeDuringActiveRepair(input) {
      const repairCase = input.identityRepairCaseRef
        ? repository.getCase(input.identityRepairCaseRef)
        : input.frozenIdentityBindingRef
          ? repository.getActiveCaseByFrozenBinding(input.frozenIdentityBindingRef)
          : null;

      if (repairCase === null || repairCase.state === "closed") {
        return {
          decision: "no_active_repair",
          patientIdentityHoldProjection: null,
          patientActionRecoveryProjection: null,
          reasonCodes: [],
        };
      }

      const projections =
        repository.getHoldProjectionByCase(repairCase.repairCaseId) ??
        buildHoldProjections({
          repairCase,
          freezeRecord: repository.getFreezeByCase(repairCase.repairCaseId),
          holdState: "recovery_only",
          updatedAt: input.observedAt ?? new Date().toISOString(),
        });

      return {
        decision: "identity_hold",
        patientIdentityHoldProjection: projections.holdProjection,
        patientActionRecoveryProjection: projections.recoveryProjection,
        reasonCodes: [
          "IR_182_PATIENT_IDENTITY_HOLD_PROJECTION",
          "IR_182_WRONG_PATIENT_NOT_REQUEST_STATE",
        ],
      };
    },

    async recordReviewApproval(input) {
      const existing = repository.getReviewByIdempotencyKey(input.reviewIdempotencyKey);
      if (existing) {
        return {
          reviewApproval: existing,
          repairCase: requireCase(repository, existing.identityRepairCaseRef),
          replayedReview: true,
        };
      }
      const existingByCase = repository.getReviewByCase(input.identityRepairCaseRef);
      if (existingByCase) {
        return {
          reviewApproval: existingByCase,
          repairCase: requireCase(repository, existingByCase.identityRepairCaseRef),
          replayedReview: true,
        };
      }

      const repairCase = requireCase(repository, input.identityRepairCaseRef);
      const freezeRecord = requireFreeze(repository, repairCase.repairCaseId);
      if (freezeRecord.freezeState !== "active") {
        throw new Error("IdentityRepairFreezeRecord must be active before review approval");
      }

      const approvedAt = input.approvedAt ?? new Date().toISOString();
      const reviewApproval: IdentityRepairReviewApprovalRecord = {
        reviewApprovalId: makeStableRef("ir_review", input.reviewIdempotencyKey),
        idempotencyKey: input.reviewIdempotencyKey,
        identityRepairCaseRef: repairCase.repairCaseId,
        freezeRecordRef: freezeRecord.freezeRecordId,
        supervisorApprovalRef: input.supervisorApprovalRef,
        independentReviewRef: input.independentReviewRef,
        reviewedCorrectionPlanRef: input.reviewedCorrectionPlanRef,
        approvedBySupervisor: input.approvedBySupervisor,
        approvedByIndependentReviewer: input.approvedByIndependentReviewer,
        approvedAt,
        reasonCodes: ["IR_182_REVIEW_REQUIRED_BEFORE_RELEASE"],
        createdByAuthority: IDENTITY_REPAIR_ORCHESTRATOR_NAME,
      };
      repository.saveReview(reviewApproval);

      const updatedCase: IdentityRepairCaseRecord = {
        ...repairCase,
        state: "correction_authority_pending",
        supervisorApprovalRef: input.supervisorApprovalRef,
        independentReviewRef: input.independentReviewRef,
        updatedAt: approvedAt,
      };
      repository.updateCase(updatedCase);
      repository.appendEvent(
        createEvent("identity.repair_review.approved", updatedCase.repairCaseId, reviewApproval),
      );

      return {
        reviewApproval,
        repairCase: updatedCase,
        replayedReview: false,
      };
    },

    async applyAuthorityCorrection(input) {
      const existing = repository.getCorrectionByIdempotencyKey(input.correctionIdempotencyKey);
      if (existing) {
        return {
          correction: existing,
          repairCase: requireCase(repository, existing.identityRepairCaseRef),
          replayedCorrection: true,
        };
      }
      const existingByCase = repository.getCorrectionByCase(input.identityRepairCaseRef);
      if (existingByCase) {
        return {
          correction: existingByCase,
          repairCase: requireCase(repository, existingByCase.identityRepairCaseRef),
          replayedCorrection: true,
        };
      }

      const repairCase = requireCase(repository, input.identityRepairCaseRef);
      const freezeRecord = requireFreeze(repository, repairCase.repairCaseId);
      const review = repository.getReviewByCase(repairCase.repairCaseId);
      if (freezeRecord.freezeState !== "active") {
        throw new Error("IdentityRepairFreezeRecord must be active before authority correction");
      }
      if (!review) {
        throw new Error(
          "supervisor and independent review are required before authority correction",
        );
      }

      const observedAt = input.observedAt ?? new Date().toISOString();
      const authoritySettlement = await identityBindingAuthority.settleRepairBinding({
        identityRepairCaseRef: repairCase.repairCaseId,
        correctionMode: input.correctionMode,
        expectedFrozenIdentityBindingRef: repairCase.frozenIdentityBindingRef,
        correctedIdentityBindingRef: input.correctedIdentityBindingRef ?? null,
        revokedIdentityBindingRef: input.revokedIdentityBindingRef ?? null,
        supervisorApprovalRef: review.supervisorApprovalRef,
        independentReviewRef: review.independentReviewRef,
        actorRef: input.actorRef,
        observedAt,
      });

      const correction: IdentityRepairAuthorityCorrectionRecord = {
        authorityCorrectionId: makeStableRef("ir_correction", input.correctionIdempotencyKey),
        idempotencyKey: input.correctionIdempotencyKey,
        identityRepairCaseRef: repairCase.repairCaseId,
        freezeRecordRef: freezeRecord.freezeRecordId,
        correctionMode: input.correctionMode,
        expectedFrozenIdentityBindingRef: repairCase.frozenIdentityBindingRef,
        bindingAuthoritySettlementRef: authoritySettlement.bindingAuthoritySettlementRef,
        resultingIdentityBindingRef: authoritySettlement.resultingIdentityBindingRef,
        decision: authoritySettlement.decision,
        appliedAt: observedAt,
        reasonCodes: unique([
          "IR_182_CORRECTION_ONLY_THROUGH_IDENTITY_BINDING_AUTHORITY",
          ...authoritySettlement.reasonCodes,
        ]),
        createdByAuthority: IDENTITY_REPAIR_ORCHESTRATOR_NAME,
      };
      repository.saveCorrection(correction);

      const updatedCase: IdentityRepairCaseRecord = {
        ...repairCase,
        state: "corrected",
        bindingAuthoritySettlementRef: correction.bindingAuthoritySettlementRef,
        resultingIdentityBindingRef: correction.resultingIdentityBindingRef,
        projectionRebuildRef: makeStableRef("projection_rebuild_pending", repairCase.repairCaseId),
        updatedAt: observedAt,
      };
      repository.updateCase(updatedCase);
      repository.appendEvent(
        createEvent("identity.repair_authority.corrected", updatedCase.repairCaseId, correction),
      );

      return {
        correction,
        repairCase: updatedCase,
        replayedCorrection: false,
      };
    },

    async settleBranchDisposition(input) {
      const repairCase = requireCase(repository, input.identityRepairCaseRef);
      requireFreeze(repository, repairCase.repairCaseId);
      const branch = repository.getBranch(input.branchDispositionId);
      if (!branch || branch.identityRepairCaseRef !== repairCase.repairCaseId) {
        throw new Error("IdentityRepairBranchDisposition does not belong to the repair case");
      }
      const observedAt = input.observedAt ?? new Date().toISOString();
      const updatedBranch: IdentityRepairBranchDispositionRecord = {
        ...branch,
        branchState: input.nextState,
        compensationRef: input.compensationRef ?? branch.compensationRef,
        reviewedBy: input.reviewedBy,
        reasonCodes: unique([
          ...branch.reasonCodes,
          input.nextState === "compensated"
            ? "IR_182_BRANCH_QUARANTINE_ENUMERATED"
            : "IR_182_BRANCH_QUARANTINE_ENUMERATED",
        ]),
        updatedAt: observedAt,
      };
      repository.updateBranch(updatedBranch);

      const nextCompensationRefs = unique([
        ...repairCase.compensationRefs,
        ...(updatedBranch.compensationRef ? [updatedBranch.compensationRef] : []),
      ]);
      const updatedCase: IdentityRepairCaseRecord = {
        ...repairCase,
        state: repairCase.state === "corrected" ? "rebuild_pending" : repairCase.state,
        compensationRefs: nextCompensationRefs,
        updatedAt: observedAt,
      };
      repository.updateCase(updatedCase);

      return {
        branchDisposition: updatedBranch,
        repairCase: updatedCase,
      };
    },

    async settleRelease(input) {
      const existing = repository.getReleaseByIdempotencyKey(input.releaseIdempotencyKey);
      if (existing) {
        return {
          releaseSettlement: existing,
          repairCase: requireCase(repository, existing.identityRepairCaseRef),
          replayedRelease: true,
        };
      }
      const existingByCase = repository.getReleaseByCase(input.identityRepairCaseRef);
      if (existingByCase) {
        return {
          releaseSettlement: existingByCase,
          repairCase: requireCase(repository, existingByCase.identityRepairCaseRef),
          replayedRelease: true,
        };
      }

      const repairCase = requireCase(repository, input.identityRepairCaseRef);
      const freezeRecord = requireFreeze(repository, repairCase.repairCaseId);
      const review = repository.getReviewByCase(repairCase.repairCaseId);
      const correction = repository.getCorrectionByCase(repairCase.repairCaseId);
      if (freezeRecord.freezeState !== "active") {
        throw new Error("IdentityRepairFreezeRecord must be active before release");
      }
      if (!review) {
        throw new Error("supervisor and independent review are required before release");
      }
      if (!correction || correction.decision !== "accepted") {
        throw new Error(
          "IdentityBindingAuthority correction or revocation is required before release",
        );
      }

      const branches = repository.listBranchesByCase(repairCase.repairCaseId);
      const unsafeBranches = branches.filter(
        (branch) => !releaseReadyBranchStates.includes(branch.branchState),
      );
      if (unsafeBranches.length > 0) {
        throw new Error(
          `branch dispositions are not release-ready: ${unsafeBranches
            .map((branch) => branch.branchDispositionId)
            .join(",")}`,
        );
      }

      const observedAt = input.observedAt ?? new Date().toISOString();
      const releaseSettlementId = makeStableRef("ir_release", input.releaseIdempotencyKey);
      const communicationsRelease = await communicationFreeze.releaseCommunications({
        identityRepairCaseRef: repairCase.repairCaseId,
        releaseMode: input.releaseMode,
        releaseSettlementRef: releaseSettlementId,
        observedAt,
      });
      const projectionRebuild = await projectionDegradation.rebuildAfterRelease({
        identityRepairCaseRef: repairCase.repairCaseId,
        releaseSettlementRef: releaseSettlementId,
        resultingIdentityBindingRef: correction.resultingIdentityBindingRef,
        releaseMode: input.releaseMode,
        observedAt,
      });

      const releaseSettlement: IdentityRepairReleaseSettlement = {
        releaseSettlementId,
        idempotencyKey: input.releaseIdempotencyKey,
        identityRepairCaseRef: repairCase.repairCaseId,
        freezeRecordRef: freezeRecord.freezeRecordId,
        releaseMode: input.releaseMode,
        supervisorApprovalRef: review.supervisorApprovalRef,
        independentReviewRef: review.independentReviewRef,
        bindingAuthoritySettlementRef: correction.bindingAuthoritySettlementRef,
        resultingIdentityBindingRef: correction.resultingIdentityBindingRef,
        branchDispositionRefs: branches.map((branch) => branch.branchDispositionId),
        communicationsReleaseRef: communicationsRelease.communicationsReleaseRef,
        projectionRebuildRef: projectionRebuild.projectionRebuildRef,
        freshSessionAllowed:
          input.releaseMode === "claim_pending_resume" || input.releaseMode === "writable_resume",
        freshAccessGrantAllowed:
          input.releaseMode === "read_only_resume" ||
          input.releaseMode === "claim_pending_resume" ||
          input.releaseMode === "writable_resume",
        freshRouteIntentAllowed:
          input.releaseMode === "read_only_resume" ||
          input.releaseMode === "claim_pending_resume" ||
          input.releaseMode === "writable_resume",
        settledAt: observedAt,
        reasonCodes: unique([
          "IR_182_RELEASE_SETTLEMENT_EXACT_ONCE",
          "IR_182_FRESH_AUTHORITY_ONLY_AFTER_RELEASE",
          ...communicationsRelease.reasonCodes,
          ...projectionRebuild.reasonCodes,
        ]),
        createdByAuthority: IDENTITY_REPAIR_ORCHESTRATOR_NAME,
      };
      repository.saveRelease(releaseSettlement);

      const releasedFreeze: IdentityRepairFreezeRecord = {
        ...freezeRecord,
        freezeState: "released",
        communicationsHoldState: "released",
        releasedAt: observedAt,
      };
      repository.updateFreeze(releasedFreeze);

      const closedCase: IdentityRepairCaseRecord = {
        ...repairCase,
        state: "closed",
        releaseSettlementRef: releaseSettlement.releaseSettlementId,
        projectionRebuildRef: releaseSettlement.projectionRebuildRef,
        updatedAt: observedAt,
      };
      repository.updateCase(closedCase);
      repository.appendEvent(
        createEvent("identity.repair_release.settled", closedCase.repairCaseId, releaseSettlement),
      );

      return {
        releaseSettlement,
        repairCase: closedCase,
        replayedRelease: false,
      };
    },
  };

  return {
    identityRepairOrchestrator,
    repository,
    migrationPlanRef: identityRepairChainMigrationPlanRefs[0],
    migrationPlanRefs: identityRepairChainMigrationPlanRefs,
    persistenceTables: identityRepairChainPersistenceTables,
    parallelInterfaceGaps: identityRepairChainParallelInterfaceGaps,
    policyVersion: IDENTITY_REPAIR_POLICY_VERSION,
  };
}

export const createIdentityRepairOrchestratorService = createIdentityRepairOrchestrator;
export const createIdentityRepairChainApplication = createIdentityRepairOrchestrator;

function createRepairCaseFromSignal(
  signal: IdentityRepairSignalRecord,
  input: RecordIdentityRepairSignalInput,
): IdentityRepairCaseRecord {
  return {
    repairCaseId: signal.openedRepairCaseRef,
    episodeId: signal.episodeId,
    affectedRequestRefs: [signal.affectedRequestRef],
    openedSignalRefs: [signal.repairSignalId],
    frozenIdentityBindingRef: signal.frozenIdentityBindingRef,
    frozenSubjectRef: input.frozenSubjectRef ?? null,
    frozenPatientRef: input.frozenPatientRef ?? null,
    suspectedWrongBindingRef: input.suspectedWrongBindingRef ?? null,
    repairBasis: repairBasisFor(signal.signalDisposition),
    lineageFenceEpoch: 0,
    state: "opened",
    openedBy: signal.reportedBy,
    supervisorApprovalRef: null,
    independentReviewRef: null,
    freezeRecordRef: null,
    projectionRebuildRef: null,
    downstreamDispositionRefs: [],
    compensationRefs: [],
    releaseSettlementRef: null,
    bindingAuthoritySettlementRef: null,
    resultingIdentityBindingRef: null,
    createdAt: signal.reportedAt,
    updatedAt: signal.reportedAt,
    createdByAuthority: IDENTITY_REPAIR_ORCHESTRATOR_NAME,
  };
}

function mergeSignalIntoActiveCase(
  activeCase: IdentityRepairCaseRecord,
  signal: IdentityRepairSignalRecord,
  input: RecordIdentityRepairSignalInput,
): IdentityRepairCaseRecord {
  return {
    ...activeCase,
    affectedRequestRefs: unique([...activeCase.affectedRequestRefs, signal.affectedRequestRef]),
    openedSignalRefs: unique([...activeCase.openedSignalRefs, signal.repairSignalId]),
    frozenSubjectRef: activeCase.frozenSubjectRef ?? input.frozenSubjectRef ?? null,
    frozenPatientRef: activeCase.frozenPatientRef ?? input.frozenPatientRef ?? null,
    suspectedWrongBindingRef:
      activeCase.suspectedWrongBindingRef ?? input.suspectedWrongBindingRef ?? null,
    repairBasis: strongestRepairBasis(activeCase.repairBasis, signal.signalDisposition),
    updatedAt: signal.reportedAt,
  };
}

function repairBasisFor(
  signalDisposition: IdentityRepairSignalDisposition,
): IdentityRepairCaseRecord["repairBasis"] {
  if (signalDisposition === "confirmed_misbinding") {
    return "confirmed_wrong_patient";
  }
  if (signalDisposition === "credible_misbinding") {
    return "credible_wrong_patient";
  }
  return "wrong_patient_suspicion";
}

function strongestRepairBasis(
  current: IdentityRepairCaseRecord["repairBasis"],
  nextDisposition: IdentityRepairSignalDisposition,
): IdentityRepairCaseRecord["repairBasis"] {
  const order: Record<IdentityRepairCaseRecord["repairBasis"], number> = {
    wrong_patient_suspicion: 1,
    credible_wrong_patient: 2,
    confirmed_wrong_patient: 3,
  };
  const next = repairBasisFor(nextDisposition);
  return order[next] > order[current] ? next : current;
}

function buildHoldProjections(input: {
  readonly repairCase: IdentityRepairCaseRecord;
  readonly freezeRecord: IdentityRepairFreezeRecord | null;
  readonly holdState: IdentityRepairProjectionHoldState;
  readonly updatedAt: string;
}): {
  readonly holdProjection: PatientIdentityHoldProjection;
  readonly recoveryProjection: PatientActionRecoveryProjection;
} {
  const baseReasonCodes = [
    "IR_182_PATIENT_IDENTITY_HOLD_PROJECTION",
    "IR_182_WRONG_PATIENT_NOT_REQUEST_STATE",
  ];
  const holdProjection: PatientIdentityHoldProjection = {
    projectionRef:
      input.freezeRecord?.patientIdentityHoldProjectionRef ??
      makeStableRef("patient_identity_hold", input.repairCase.repairCaseId),
    identityRepairCaseRef: input.repairCase.repairCaseId,
    frozenIdentityBindingRef: input.repairCase.frozenIdentityBindingRef,
    freezeRecordRef: input.freezeRecord?.freezeRecordId ?? null,
    lineageFenceRef: input.freezeRecord?.lineageFenceRef ?? null,
    displayMode: input.holdState,
    safeSummary:
      "Identity verification is on hold while a supervised wrong-patient repair is completed.",
    hiddenPhiDetail: true,
    readOnly: true,
    recoveryOnly: input.holdState === "recovery_only",
    allowedActions: [
      "view_identity_hold_summary",
      "contact_support",
      "sign_out",
      "return_after_release_settlement",
    ],
    blockedActions: [
      "view_phi_detail",
      "submit_patient_mutation",
      "redeem_stale_access_grant",
      "resume_stale_route_intent",
      "send_non_essential_patient_communication",
    ],
    reasonCodes: baseReasonCodes,
    updatedAt: input.updatedAt,
  };
  const recoveryProjection: PatientActionRecoveryProjection = {
    projectionRef:
      input.freezeRecord?.patientActionRecoveryProjectionRef ??
      makeStableRef("patient_action_recovery", input.repairCase.repairCaseId),
    identityRepairCaseRef: input.repairCase.repairCaseId,
    frozenIdentityBindingRef: input.repairCase.frozenIdentityBindingRef,
    actionRoutingMode: "recovery_only",
    recoveryWorkspaceRef: makeStableRef("identity_repair_recovery", input.repairCase.repairCaseId),
    allowedRecoveryActions: [
      "read_safe_hold_reason",
      "start_support_contact",
      "upload_repair_evidence",
      "wait_for_release_settlement",
    ],
    blockedMutationActions: [
      "claim_request",
      "write_authenticated_request",
      "continue_callback",
      "open_seeded_link",
    ],
    noGenericRedirect: true,
    reasonCodes: baseReasonCodes,
    updatedAt: input.updatedAt,
  };
  return { holdProjection, recoveryProjection };
}

function requireCase(
  repository: IdentityRepairRepository,
  identityRepairCaseRef: string,
): IdentityRepairCaseRecord {
  const repairCase = repository.getCase(identityRepairCaseRef);
  if (!repairCase) {
    throw new Error(`IdentityRepairCase is missing: ${identityRepairCaseRef}`);
  }
  return repairCase;
}

function requireFreeze(
  repository: IdentityRepairRepository,
  identityRepairCaseRef: string,
): IdentityRepairFreezeRecord {
  const freeze = repository.getFreezeByCase(identityRepairCaseRef);
  if (!freeze) {
    throw new Error(`IdentityRepairFreezeRecord is missing: ${identityRepairCaseRef}`);
  }
  return freeze;
}

function requireHoldProjection(
  repository: IdentityRepairRepository,
  identityRepairCaseRef: string,
): {
  readonly holdProjection: PatientIdentityHoldProjection;
  readonly recoveryProjection: PatientActionRecoveryProjection;
} {
  const projections = repository.getHoldProjectionByCase(identityRepairCaseRef);
  if (!projections) {
    throw new Error(`PatientIdentityHoldProjection is missing: ${identityRepairCaseRef}`);
  }
  return projections;
}

function createEvent(
  eventName: IdentityRepairEventRecord["eventName"],
  identityRepairCaseRef: string,
  payload: unknown,
): IdentityRepairEventRecord {
  const payloadHash = hashStable(payload);
  return {
    eventRef: makeStableRef("ir_event", `${eventName}:${identityRepairCaseRef}:${payloadHash}`),
    eventName,
    identityRepairCaseRef,
    occurredAt: new Date().toISOString(),
    payloadHash,
    createdByAuthority: IDENTITY_REPAIR_ORCHESTRATOR_NAME,
  };
}

function computeSignalDigest(input: RecordIdentityRepairSignalInput): string {
  return hashStable({
    episodeId: input.episodeId,
    affectedRequestRef: input.affectedRequestRef,
    observedIdentityBindingRef: input.observedIdentityBindingRef,
    frozenIdentityBindingRef: input.frozenIdentityBindingRef ?? input.observedIdentityBindingRef,
    observedSessionRef: input.observedSessionRef ?? null,
    observedAccessGrantRef: input.observedAccessGrantRef ?? null,
    observedRouteIntentBindingRef: input.observedRouteIntentBindingRef ?? null,
    signalClass: input.signalClass,
    signalDisposition: input.signalDisposition,
    evidenceRefs: [...input.evidenceRefs].sort(),
  });
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function makeStableRef(prefix: string, seed: string): string {
  return `${prefix}_${hashStable(seed).slice(0, 16)}`;
}

function unique<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}

function createDefaultSessionGovernorRepairPort(): SessionGovernorRepairPort {
  return {
    async freezeSessions(input) {
      return {
        sessionTerminationSettlementRefs:
          input.observedSessionRefs.length > 0
            ? input.observedSessionRefs.map((sessionRef) =>
                makeStableRef(
                  "session_termination",
                  `${input.identityRepairCaseRef}:${sessionRef}`,
                ),
              )
            : [makeStableRef("session_termination", input.identityRepairCaseRef)],
        reasonCodes: ["IR_182_SESSION_GOVERNOR_FROZE_STALE_SESSIONS"],
      };
    },
  };
}

function createDefaultAccessGrantServiceRepairPort(): AccessGrantServiceRepairPort {
  return {
    async supersedeGrantsForIdentityRepair(input) {
      return {
        accessGrantSupersessionRefs:
          input.observedAccessGrantRefs.length > 0
            ? input.observedAccessGrantRefs.map((grantRef) =>
                makeStableRef(
                  "access_grant_supersession",
                  `${input.identityRepairCaseRef}:${grantRef}`,
                ),
              )
            : [makeStableRef("access_grant_supersession", input.identityRepairCaseRef)],
        reasonCodes: ["IR_182_ACCESS_GRANTS_SUPERSEDED_BY_ACCESS_GRANT_SERVICE"],
      };
    },
  };
}

function createDefaultRouteIntentRepairPort(): RouteIntentRepairPort {
  return {
    async supersedeRouteIntentsForIdentityRepair(input) {
      return {
        supersededRouteIntentBindingRefs:
          input.observedRouteIntentBindingRefs.length > 0
            ? input.observedRouteIntentBindingRefs.map((routeIntentBindingRef) =>
                makeStableRef(
                  "route_intent_supersession",
                  `${input.identityRepairCaseRef}:${routeIntentBindingRef}`,
                ),
              )
            : [makeStableRef("route_intent_supersession", input.identityRepairCaseRef)],
        reasonCodes: ["IR_182_ROUTE_INTENTS_SUPERSEDED"],
      };
    },
  };
}

function createDefaultCommunicationFreezePort(): CommunicationFreezePort {
  return {
    async freezeNonEssentialCommunications(input) {
      return {
        communicationsHoldRef: makeStableRef("communications_hold", input.identityRepairCaseRef),
        communicationsHoldState: "active",
        affectedAudienceRefs: ["patient", "support", "notification_worker"],
        reasonCodes: ["IR_182_NON_ESSENTIAL_COMMUNICATIONS_FROZEN"],
      };
    },
    async releaseCommunications(input) {
      return {
        communicationsReleaseRef: makeStableRef(
          "communications_release",
          `${input.identityRepairCaseRef}:${input.releaseSettlementRef}`,
        ),
        reasonCodes: ["IR_182_FRESH_AUTHORITY_ONLY_AFTER_RELEASE"],
      };
    },
  };
}

function createDefaultProjectionDegradationPort(): ProjectionDegradationPort {
  return {
    async degradeForIdentityHold(input) {
      return {
        patientIdentityHoldProjectionRef: makeStableRef(
          "patient_identity_hold",
          input.identityRepairCaseRef,
        ),
        patientActionRecoveryProjectionRef: makeStableRef(
          "patient_action_recovery",
          input.identityRepairCaseRef,
        ),
        projectionHoldState: "summary_only",
        reasonCodes: ["IR_182_PATIENT_IDENTITY_HOLD_PROJECTION"],
      };
    },
    async rebuildAfterRelease(input) {
      return {
        projectionRebuildRef: makeStableRef(
          "projection_rebuild",
          `${input.identityRepairCaseRef}:${input.releaseSettlementRef}`,
        ),
        reasonCodes: ["IR_182_FRESH_AUTHORITY_ONLY_AFTER_RELEASE"],
      };
    },
  };
}

function createDefaultIdentityBindingAuthorityRepairPort(): IdentityBindingAuthorityRepairPort {
  return {
    async settleRepairBinding(input) {
      return {
        bindingAuthoritySettlementRef: makeStableRef(
          "identity_binding_authority_settlement",
          `${input.identityRepairCaseRef}:${input.correctionMode}`,
        ),
        resultingIdentityBindingRef:
          input.correctionMode === "revoked"
            ? input.revokedIdentityBindingRef
            : input.correctedIdentityBindingRef,
        decision: "accepted",
        reasonCodes: ["IR_182_CORRECTION_ONLY_THROUGH_IDENTITY_BINDING_AUTHORITY"],
      };
    },
  };
}
