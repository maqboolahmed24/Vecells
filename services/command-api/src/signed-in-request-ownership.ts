import { createHash } from "node:crypto";

export const SIGNED_IN_REQUEST_OWNERSHIP_SERVICE_NAME = "SignedInRequestOwnershipService";
export const SIGNED_IN_REQUEST_OWNERSHIP_SCHEMA_VERSION = "184.phase2.request-ownership.v1";
export const SIGNED_IN_REQUEST_OWNERSHIP_POLICY_VERSION = "phase2-signed-in-request-ownership-v1";

export const signedInRequestOwnershipPersistenceTables = [
  "phase2_request_lineage_ownership",
  "phase2_signed_in_request_starts",
  "phase2_authenticated_ownership_attachments",
  "phase2_authority_patient_ref_derivation_settlements",
  "phase2_authenticated_uplift_mappings",
  "phase2_ownership_drift_fences",
  "phase2_request_ownership_events",
] as const;

export const signedInRequestOwnershipMigrationPlanRefs = [
  "services/command-api/migrations/099_phase2_signed_in_request_ownership.sql",
] as const;

export const signedInRequestOwnershipParallelInterfaceGaps = [
  "PARALLEL_INTERFACE_GAP_PHASE2_REQUEST_OWNERSHIP_ONE_LINEAGE_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_REQUEST_OWNERSHIP_AUTHORITY_DERIVED_PATIENT_REF_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_REQUEST_OWNERSHIP_PRE_SUBMIT_CLAIM_CONTINUITY_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_REQUEST_OWNERSHIP_POST_SUBMIT_UPLIFT_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_REQUEST_OWNERSHIP_RACE_SAFE_MAPPING_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_REQUEST_OWNERSHIP_STALE_FENCING_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_REQUEST_OWNERSHIP_SAME_SHELL_RECOVERY_V1",
] as const;

export const SIGNED_IN_REQUEST_OWNERSHIP_REASON_CODES = [
  "SRO_184_ONE_REQUEST_LINEAGE",
  "SRO_184_SIGNED_IN_DRAFT_ATTACHED",
  "SRO_184_AUTHORITY_DERIVED_PATIENT_REF_ONLY",
  "SRO_184_REQUEST_EPISODE_PATIENT_REF_SAME_TRANSACTION",
  "SRO_184_PRE_SUBMIT_CLAIM_SAME_DRAFT",
  "SRO_184_PUBLIC_GRANTS_SUPERSEDED",
  "SRO_184_SESSION_ROTATED_FOR_WRITABLE_SCOPE",
  "SRO_184_POST_SUBMIT_UPLIFT_SAME_REQUEST_SHELL",
  "SRO_184_DUPLICATE_PROMOTION_REPLAY_RETURNED",
  "SRO_184_STALE_SESSION_RECOVERY",
  "SRO_184_STALE_BINDING_RECOVERY",
  "SRO_184_SUBJECT_SWITCH_RECOVERY",
  "SRO_184_ROUTE_INTENT_DRIFT_RECOVERY",
  "SRO_184_LINEAGE_FENCE_DRIFT_RECOVERY",
  "SRO_184_NO_DIRECT_PATIENT_REF_MUTATION",
] as const;

export type SignedInRequestOwnershipReasonCode =
  (typeof SIGNED_IN_REQUEST_OWNERSHIP_REASON_CODES)[number];

export type RequestLineagePhase = "draft" | "submitted" | "promoted" | "episode_opened";
export type OwnershipPosture =
  | "anonymous_public"
  | "claim_pending"
  | "read_only_authenticated"
  | "owned_authenticated"
  | "recovery_only";
export type WritableAuthorityState = "none" | "auth_read_only" | "claim_pending" | "writable";
export type SignedInStartMode = "already_claimed" | "claim_pending" | "read_only";
export type OwnershipDecisionState =
  | "attached"
  | "claimed"
  | "uplifted"
  | "recover_only"
  | "claim_pending"
  | "step_up_required"
  | "denied";
export type AuthorityDerivedPatientRefState = "not_derived" | "derived_in_authority_transaction";
export type RouteContinuityTarget =
  | "same_draft_shell"
  | "same_request_shell"
  | "recovery_shell"
  | "claim_pending_shell";

export interface RequestLineageOwnershipRecord {
  readonly requestLineageRef: string;
  readonly schemaVersion: typeof SIGNED_IN_REQUEST_OWNERSHIP_SCHEMA_VERSION;
  readonly policyVersion: typeof SIGNED_IN_REQUEST_OWNERSHIP_POLICY_VERSION;
  readonly draftPublicId: string;
  readonly requestRef: string | null;
  readonly submissionEnvelopeRef: string;
  readonly continuityShellRef: string;
  readonly continuityAnchorRef: string;
  readonly requestShellRef: string;
  readonly episodeRef: string | null;
  readonly phase: RequestLineagePhase;
  readonly currentSubjectRef: string | null;
  readonly currentOwnerSubjectRef: string | null;
  readonly currentSubjectBindingVersionRef: string | null;
  readonly sessionRef: string | null;
  readonly sessionEpochRef: string | null;
  readonly routeIntentBindingRef: string;
  readonly lineageFenceRef: string;
  readonly ownershipPosture: OwnershipPosture;
  readonly writableAuthorityState: WritableAuthorityState;
  readonly patientRefDerivationState: AuthorityDerivedPatientRefState;
  readonly requestPatientRef: string | null;
  readonly episodePatientRef: string | null;
  readonly authoritySettlementRef: string | null;
  readonly reasonCodes: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly version: number;
  readonly createdByAuthority: typeof SIGNED_IN_REQUEST_OWNERSHIP_SERVICE_NAME;
}

export interface SignedInRequestStartRecord {
  readonly signedInRequestStartRef: string;
  readonly idempotencyKey: string;
  readonly requestLineageRef: string;
  readonly draftPublicId: string;
  readonly subjectRef: string;
  readonly sessionRef: string;
  readonly sessionEpochRef: string;
  readonly subjectBindingVersionRef: string;
  readonly startMode: SignedInStartMode;
  readonly routeContinuityTarget: RouteContinuityTarget;
  readonly reasonCodes: readonly string[];
  readonly startedAt: string;
  readonly createdByAuthority: typeof SIGNED_IN_REQUEST_OWNERSHIP_SERVICE_NAME;
}

export interface AuthenticatedOwnershipAttachmentRecord {
  readonly attachmentRef: string;
  readonly idempotencyKey: string;
  readonly requestLineageRef: string;
  readonly draftPublicId: string;
  readonly subjectRef: string;
  readonly decisionState: OwnershipDecisionState;
  readonly preservedSubmissionEnvelopeRef: string;
  readonly preservedContinuityShellRef: string;
  readonly preservedContinuityAnchorRef: string;
  readonly authoritySettlementRef: string | null;
  readonly accessGrantSupersessionRefs: readonly string[];
  readonly rotatedSessionEpochRef: string | null;
  readonly routeContinuityTarget: RouteContinuityTarget;
  readonly reasonCodes: readonly string[];
  readonly attachedAt: string;
  readonly createdByAuthority: typeof SIGNED_IN_REQUEST_OWNERSHIP_SERVICE_NAME;
}

export interface AuthorityPatientRefDerivationSettlement {
  readonly derivationSettlementRef: string;
  readonly idempotencyKey: string;
  readonly requestLineageRef: string;
  readonly requestRef: string | null;
  readonly episodeRef: string | null;
  readonly subjectRef: string;
  readonly authoritySettlementRef: string;
  readonly previousSubjectBindingVersionRef: string | null;
  readonly nextSubjectBindingVersionRef: string;
  readonly previousRequestPatientRef: string | null;
  readonly nextRequestPatientRef: string | null;
  readonly previousEpisodePatientRef: string | null;
  readonly nextEpisodePatientRef: string | null;
  readonly transactionBoundary: "identity_binding_authority_request_episode_patient_refs";
  readonly reasonCodes: readonly string[];
  readonly settledAt: string;
  readonly createdByAuthority: typeof SIGNED_IN_REQUEST_OWNERSHIP_SERVICE_NAME;
}

export interface AuthenticatedUpliftMappingRecord {
  readonly upliftMappingRef: string;
  readonly idempotencyKey: string;
  readonly requestLineageRef: string | null;
  readonly draftPublicId: string | null;
  readonly requestRef: string;
  readonly requestShellRef: string;
  readonly episodeRef: string | null;
  readonly subjectRef: string;
  readonly decisionState: OwnershipDecisionState;
  readonly routeContinuityTarget: RouteContinuityTarget;
  readonly duplicatePromotionReplay: boolean;
  readonly clonedRequestCreated: false;
  readonly authoritySettlementRef: string | null;
  readonly reasonCodes: readonly string[];
  readonly mappedAt: string;
  readonly createdByAuthority: typeof SIGNED_IN_REQUEST_OWNERSHIP_SERVICE_NAME;
}

export interface OwnershipDriftFenceRecord {
  readonly driftFenceRef: string;
  readonly requestLineageRef: string | null;
  readonly draftPublicId: string | null;
  readonly requestRef: string | null;
  readonly subjectRef: string;
  readonly driftType:
    | "stale_session"
    | "stale_binding"
    | "subject_switch"
    | "route_intent_tuple_drift"
    | "lineage_fence_drift";
  readonly expectedRef: string | null;
  readonly observedRef: string | null;
  readonly decisionState: "recover_only" | "claim_pending" | "step_up_required" | "denied";
  readonly routeContinuityTarget: Extract<
    RouteContinuityTarget,
    "recovery_shell" | "claim_pending_shell"
  >;
  readonly reasonCodes: readonly string[];
  readonly fencedAt: string;
  readonly createdByAuthority: typeof SIGNED_IN_REQUEST_OWNERSHIP_SERVICE_NAME;
}

export interface RequestOwnershipEventRecord {
  readonly eventRef: string;
  readonly eventName:
    | "request_ownership.signed_in_start"
    | "request_ownership.pre_submit_claim"
    | "request_ownership.patient_ref_derived"
    | "request_ownership.post_submit_uplift"
    | "request_ownership.drift_recovery";
  readonly requestLineageRef: string | null;
  readonly occurredAt: string;
  readonly payloadHash: string;
  readonly reasonCodes: readonly string[];
  readonly createdByAuthority: typeof SIGNED_IN_REQUEST_OWNERSHIP_SERVICE_NAME;
}

export interface IdentityBindingAuthorityOwnershipInput {
  readonly commandId: string;
  readonly idempotencyKey: string;
  readonly subjectRef: string;
  readonly expectedSubjectBindingVersionRef: string | null;
  readonly patientLinkDecisionRef: string | null;
  readonly targetPatientRef: string | null;
  readonly derivedLineageRefs: readonly {
    readonly lineageKind: "request" | "episode";
    readonly lineageRef: string;
  }[];
  readonly routeIntentBindingRef: string;
  readonly actorRef: string;
  readonly reasonCodes: readonly string[];
  readonly observedAt: string;
}

export interface IdentityBindingAuthorityOwnershipSettlement {
  readonly authoritySettlementRef: string;
  readonly subjectBindingVersionRef: string;
  readonly requestPatientRef: string | null;
  readonly episodePatientRef: string | null;
  readonly ownershipState: "claim_pending" | "claimed" | "revoked" | "repair_hold";
  readonly decision: "accepted" | "replayed" | "denied" | "stale_rejected" | "freeze_blocked";
  readonly reasonCodes: readonly string[];
}

export interface IdentityBindingAuthorityOwnershipPort {
  readonly settleOwnership: (
    input: IdentityBindingAuthorityOwnershipInput,
  ) => Promise<IdentityBindingAuthorityOwnershipSettlement>;
}

export interface AccessGrantOwnershipPort {
  readonly supersedePublicGrantsForClaim: (input: {
    readonly idempotencyKey: string;
    readonly draftPublicId: string;
    readonly requestLineageRef: string;
    readonly submissionEnvelopeRef: string;
    readonly publicGrantRefs: readonly string[];
    readonly sessionEpochRef: string;
    readonly subjectBindingVersionRef: string;
    readonly routeIntentBindingRef: string;
    readonly lineageFenceRef: string;
    readonly observedAt: string;
  }) => Promise<{ readonly accessGrantSupersessionRefs: readonly string[] }>;
}

export interface SessionGovernorOwnershipPort {
  readonly rotateForWritableScope: (input: {
    readonly idempotencyKey: string;
    readonly sessionRef: string;
    readonly sessionEpochRef: string;
    readonly subjectRef: string;
    readonly subjectBindingVersionRef: string;
    readonly routeIntentBindingRef: string;
    readonly observedAt: string;
  }) => Promise<{
    readonly rotatedSessionEpochRef: string;
    readonly sessionSettlementRef: string;
    readonly reasonCodes: readonly string[];
  }>;
}

export interface RouteIntentOwnershipPort {
  readonly mapContinuity: (input: {
    readonly idempotencyKey: string;
    readonly requestLineageRef: string | null;
    readonly draftPublicId: string | null;
    readonly requestRef: string | null;
    readonly currentRouteIntentBindingRef: string;
    readonly target: RouteContinuityTarget;
    readonly observedAt: string;
  }) => Promise<{
    readonly routeIntentBindingRef: string;
    readonly routeContinuityTarget: RouteContinuityTarget;
    readonly routeRef: string;
  }>;
}

export interface SignedInRequestOwnershipRepositorySnapshots {
  readonly lineages: readonly RequestLineageOwnershipRecord[];
  readonly starts: readonly SignedInRequestStartRecord[];
  readonly attachments: readonly AuthenticatedOwnershipAttachmentRecord[];
  readonly derivationSettlements: readonly AuthorityPatientRefDerivationSettlement[];
  readonly upliftMappings: readonly AuthenticatedUpliftMappingRecord[];
  readonly driftFences: readonly OwnershipDriftFenceRecord[];
  readonly events: readonly RequestOwnershipEventRecord[];
}

export interface SignedInRequestOwnershipRepository {
  readonly getStartByIdempotencyKey: (idempotencyKey: string) => {
    readonly start: SignedInRequestStartRecord;
    readonly lineage: RequestLineageOwnershipRecord;
  } | null;
  readonly getLineageByRef: (requestLineageRef: string) => RequestLineageOwnershipRecord | null;
  readonly getLineageByDraftPublicId: (
    draftPublicId: string,
  ) => RequestLineageOwnershipRecord | null;
  readonly getLineageByRequestRef: (requestRef: string) => RequestLineageOwnershipRecord | null;
  readonly saveLineage: (lineage: RequestLineageOwnershipRecord) => void;
  readonly saveStart: (start: SignedInRequestStartRecord) => void;
  readonly getAttachmentByIdempotencyKey: (idempotencyKey: string) => {
    readonly attachment: AuthenticatedOwnershipAttachmentRecord;
    readonly lineage: RequestLineageOwnershipRecord;
  } | null;
  readonly saveAttachment: (attachment: AuthenticatedOwnershipAttachmentRecord) => void;
  readonly getDerivationByIdempotencyKey: (idempotencyKey: string) => {
    readonly settlement: AuthorityPatientRefDerivationSettlement;
    readonly lineage: RequestLineageOwnershipRecord;
  } | null;
  readonly saveDerivationSettlement: (
    settlement: AuthorityPatientRefDerivationSettlement,
    lineage: RequestLineageOwnershipRecord,
  ) => void;
  readonly getUpliftByIdempotencyKey: (idempotencyKey: string) => {
    readonly mapping: AuthenticatedUpliftMappingRecord;
    readonly lineage: RequestLineageOwnershipRecord | null;
  } | null;
  readonly getUpliftByRequestRef: (requestRef: string) => {
    readonly mapping: AuthenticatedUpliftMappingRecord;
    readonly lineage: RequestLineageOwnershipRecord | null;
  } | null;
  readonly saveUpliftMapping: (mapping: AuthenticatedUpliftMappingRecord) => void;
  readonly saveDriftFence: (fence: OwnershipDriftFenceRecord) => void;
  readonly appendEvent: (event: RequestOwnershipEventRecord) => void;
  readonly snapshots: () => SignedInRequestOwnershipRepositorySnapshots;
}

export interface StartSignedInDraftInput {
  readonly idempotencyKey: string;
  readonly draftPublicId: string;
  readonly submissionEnvelopeRef: string;
  readonly continuityShellRef: string;
  readonly continuityAnchorRef: string;
  readonly requestShellRef: string;
  readonly subjectRef: string;
  readonly sessionRef: string;
  readonly sessionEpochRef: string;
  readonly subjectBindingVersionRef: string;
  readonly routeIntentBindingRef: string;
  readonly lineageFenceRef: string;
  readonly startMode: SignedInStartMode;
  readonly observedAt?: string;
}

export interface StartSignedInDraftResult {
  readonly start: SignedInRequestStartRecord;
  readonly lineage: RequestLineageOwnershipRecord;
  readonly replayed: boolean;
}

export interface ClaimPreSubmitDraftInput {
  readonly idempotencyKey: string;
  readonly draftPublicId: string;
  readonly subjectRef: string;
  readonly sessionRef: string;
  readonly sessionEpochRef: string;
  readonly expectedSessionEpochRef: string;
  readonly expectedSubjectBindingVersionRef: string;
  readonly currentSubjectBindingVersionRef: string;
  readonly expectedRouteIntentBindingRef: string;
  readonly expectedLineageFenceRef: string;
  readonly targetPatientRef: string | null;
  readonly patientLinkDecisionRef?: string | null;
  readonly publicGrantRefs?: readonly string[];
  readonly writableScopeRequested?: boolean;
  readonly episodeRef?: string | null;
  readonly actorRef?: string;
  readonly observedAt?: string;
}

export interface ClaimPreSubmitDraftResult {
  readonly attachment: AuthenticatedOwnershipAttachmentRecord;
  readonly lineage: RequestLineageOwnershipRecord;
  readonly derivationSettlement: AuthorityPatientRefDerivationSettlement | null;
  readonly replayed: boolean;
}

export interface DerivePatientRefsThroughAuthorityInput {
  readonly idempotencyKey: string;
  readonly requestLineageRef: string;
  readonly subjectRef: string;
  readonly expectedSubjectBindingVersionRef: string | null;
  readonly targetPatientRef: string | null;
  readonly patientLinkDecisionRef?: string | null;
  readonly routeIntentBindingRef: string;
  readonly episodeRef?: string | null;
  readonly actorRef?: string;
  readonly reasonCodes?: readonly string[];
  readonly observedAt?: string;
}

export interface DerivePatientRefsThroughAuthorityResult {
  readonly settlement: AuthorityPatientRefDerivationSettlement;
  readonly lineage: RequestLineageOwnershipRecord;
  readonly authorityDecision: IdentityBindingAuthorityOwnershipSettlement["decision"];
  readonly replayed: boolean;
}

export interface UpliftPostSubmitRequestInput {
  readonly idempotencyKey: string;
  readonly requestRef: string;
  readonly draftPublicId?: string | null;
  readonly requestShellRef: string;
  readonly episodeRef?: string | null;
  readonly subjectRef: string;
  readonly sessionRef: string;
  readonly sessionEpochRef: string;
  readonly expectedSessionEpochRef: string;
  readonly expectedSubjectBindingVersionRef: string;
  readonly currentSubjectBindingVersionRef: string;
  readonly expectedRouteIntentBindingRef: string;
  readonly expectedLineageFenceRef: string;
  readonly targetPatientRef: string | null;
  readonly patientLinkDecisionRef?: string | null;
  readonly actorRef?: string;
  readonly observedAt?: string;
}

export interface UpliftPostSubmitRequestResult {
  readonly mapping: AuthenticatedUpliftMappingRecord;
  readonly lineage: RequestLineageOwnershipRecord | null;
  readonly derivationSettlement: AuthorityPatientRefDerivationSettlement | null;
  readonly replayed: boolean;
}

export interface EvaluateWritableContinuityInput {
  readonly requestLineageRef?: string;
  readonly draftPublicId?: string;
  readonly requestRef?: string;
  readonly subjectRef: string;
  readonly sessionEpochRef: string;
  readonly expectedSessionEpochRef: string;
  readonly currentSubjectBindingVersionRef: string;
  readonly expectedSubjectBindingVersionRef: string;
  readonly expectedRouteIntentBindingRef: string;
  readonly expectedLineageFenceRef: string;
  readonly observedAt?: string;
}

export interface EvaluateWritableContinuityResult {
  readonly accepted: boolean;
  readonly lineage: RequestLineageOwnershipRecord | null;
  readonly driftFence: OwnershipDriftFenceRecord | null;
  readonly decisionState: OwnershipDecisionState;
  readonly routeContinuityTarget: RouteContinuityTarget;
  readonly reasonCodes: readonly string[];
}

export interface SignedInRequestOwnershipService {
  readonly startSignedInDraft: (
    input: StartSignedInDraftInput,
  ) => Promise<StartSignedInDraftResult>;
  readonly claimPreSubmitDraft: (
    input: ClaimPreSubmitDraftInput,
  ) => Promise<ClaimPreSubmitDraftResult>;
  readonly derivePatientRefsThroughAuthority: (
    input: DerivePatientRefsThroughAuthorityInput,
  ) => Promise<DerivePatientRefsThroughAuthorityResult>;
  readonly upliftPostSubmitRequest: (
    input: UpliftPostSubmitRequestInput,
  ) => Promise<UpliftPostSubmitRequestResult>;
  readonly evaluateWritableContinuity: (
    input: EvaluateWritableContinuityInput,
  ) => Promise<EvaluateWritableContinuityResult>;
}

export interface SignedInRequestOwnershipApplication {
  readonly signedInRequestOwnershipService: SignedInRequestOwnershipService;
  readonly repository: SignedInRequestOwnershipRepository;
  readonly identityBindingAuthority: IdentityBindingAuthorityOwnershipPort;
  readonly accessGrantService: AccessGrantOwnershipPort;
  readonly sessionGovernor: SessionGovernorOwnershipPort;
  readonly routeIntent: RouteIntentOwnershipPort;
  readonly migrationPlanRef: (typeof signedInRequestOwnershipMigrationPlanRefs)[number];
  readonly migrationPlanRefs: typeof signedInRequestOwnershipMigrationPlanRefs;
  readonly persistenceTables: typeof signedInRequestOwnershipPersistenceTables;
  readonly parallelInterfaceGaps: typeof signedInRequestOwnershipParallelInterfaceGaps;
  readonly policyVersion: typeof SIGNED_IN_REQUEST_OWNERSHIP_POLICY_VERSION;
}

export function createInMemorySignedInRequestOwnershipRepository(): SignedInRequestOwnershipRepository {
  const lineages = new Map<string, RequestLineageOwnershipRecord>();
  const lineageRefsByDraftPublicId = new Map<string, string>();
  const lineageRefsByRequestRef = new Map<string, string>();
  const starts = new Map<string, SignedInRequestStartRecord>();
  const startRefsByIdempotency = new Map<string, string>();
  const attachments = new Map<string, AuthenticatedOwnershipAttachmentRecord>();
  const attachmentRefsByIdempotency = new Map<string, string>();
  const derivations = new Map<string, AuthorityPatientRefDerivationSettlement>();
  const derivationRefsByIdempotency = new Map<string, string>();
  const upliftMappings = new Map<string, AuthenticatedUpliftMappingRecord>();
  const upliftRefsByIdempotency = new Map<string, string>();
  const upliftRefsByRequestRef = new Map<string, string>();
  const driftFences: OwnershipDriftFenceRecord[] = [];
  const events: RequestOwnershipEventRecord[] = [];

  function lineageForRef(requestLineageRef: string | null): RequestLineageOwnershipRecord | null {
    return requestLineageRef ? (lineages.get(requestLineageRef) ?? null) : null;
  }

  function saveLineageRecord(lineage: RequestLineageOwnershipRecord): void {
    lineages.set(lineage.requestLineageRef, lineage);
    lineageRefsByDraftPublicId.set(lineage.draftPublicId, lineage.requestLineageRef);
    if (lineage.requestRef) {
      lineageRefsByRequestRef.set(lineage.requestRef, lineage.requestLineageRef);
    }
  }

  return {
    getStartByIdempotencyKey(idempotencyKey) {
      const startRef = startRefsByIdempotency.get(idempotencyKey);
      const start = startRef ? starts.get(startRef) : undefined;
      const lineage = start ? lineages.get(start.requestLineageRef) : undefined;
      return start && lineage ? { start, lineage } : null;
    },
    getLineageByRef(requestLineageRef) {
      return lineages.get(requestLineageRef) ?? null;
    },
    getLineageByDraftPublicId(draftPublicId) {
      const requestLineageRef = lineageRefsByDraftPublicId.get(draftPublicId);
      return requestLineageRef ? (lineages.get(requestLineageRef) ?? null) : null;
    },
    getLineageByRequestRef(requestRef) {
      const requestLineageRef = lineageRefsByRequestRef.get(requestRef);
      return requestLineageRef ? (lineages.get(requestLineageRef) ?? null) : null;
    },
    saveLineage(lineage) {
      saveLineageRecord(lineage);
    },
    saveStart(start) {
      starts.set(start.signedInRequestStartRef, start);
      startRefsByIdempotency.set(start.idempotencyKey, start.signedInRequestStartRef);
    },
    getAttachmentByIdempotencyKey(idempotencyKey) {
      const attachmentRef = attachmentRefsByIdempotency.get(idempotencyKey);
      const attachment = attachmentRef ? attachments.get(attachmentRef) : undefined;
      const lineage = attachment ? lineages.get(attachment.requestLineageRef) : undefined;
      return attachment && lineage ? { attachment, lineage } : null;
    },
    saveAttachment(attachment) {
      attachments.set(attachment.attachmentRef, attachment);
      attachmentRefsByIdempotency.set(attachment.idempotencyKey, attachment.attachmentRef);
    },
    getDerivationByIdempotencyKey(idempotencyKey) {
      const settlementRef = derivationRefsByIdempotency.get(idempotencyKey);
      const settlement = settlementRef ? derivations.get(settlementRef) : undefined;
      const lineage = settlement ? lineages.get(settlement.requestLineageRef) : undefined;
      return settlement && lineage ? { settlement, lineage } : null;
    },
    saveDerivationSettlement(settlement, lineage) {
      derivations.set(settlement.derivationSettlementRef, settlement);
      derivationRefsByIdempotency.set(
        settlement.idempotencyKey,
        settlement.derivationSettlementRef,
      );
      saveLineageRecord(lineage);
    },
    getUpliftByIdempotencyKey(idempotencyKey) {
      const mappingRef = upliftRefsByIdempotency.get(idempotencyKey);
      const mapping = mappingRef ? upliftMappings.get(mappingRef) : undefined;
      return mapping ? { mapping, lineage: lineageForRef(mapping.requestLineageRef) } : null;
    },
    getUpliftByRequestRef(requestRef) {
      const mappingRef = upliftRefsByRequestRef.get(requestRef);
      const mapping = mappingRef ? upliftMappings.get(mappingRef) : undefined;
      return mapping ? { mapping, lineage: lineageForRef(mapping.requestLineageRef) } : null;
    },
    saveUpliftMapping(mapping) {
      upliftMappings.set(mapping.upliftMappingRef, mapping);
      upliftRefsByIdempotency.set(mapping.idempotencyKey, mapping.upliftMappingRef);
      upliftRefsByRequestRef.set(mapping.requestRef, mapping.upliftMappingRef);
    },
    saveDriftFence(fence) {
      driftFences.push(fence);
    },
    appendEvent(event) {
      events.push(event);
    },
    snapshots() {
      return {
        lineages: [...lineages.values()],
        starts: [...starts.values()],
        attachments: [...attachments.values()],
        derivationSettlements: [...derivations.values()],
        upliftMappings: [...upliftMappings.values()],
        driftFences: [...driftFences],
        events: [...events],
      };
    },
  };
}

export function createSignedInRequestOwnershipApplication(options?: {
  readonly repository?: SignedInRequestOwnershipRepository;
  readonly identityBindingAuthority?: IdentityBindingAuthorityOwnershipPort;
  readonly accessGrantService?: AccessGrantOwnershipPort;
  readonly sessionGovernor?: SessionGovernorOwnershipPort;
  readonly routeIntent?: RouteIntentOwnershipPort;
}): SignedInRequestOwnershipApplication {
  const repository = options?.repository ?? createInMemorySignedInRequestOwnershipRepository();
  const identityBindingAuthority =
    options?.identityBindingAuthority ?? createDefaultIdentityBindingAuthorityOwnershipPort();
  const accessGrantService = options?.accessGrantService ?? createDefaultAccessGrantOwnershipPort();
  const sessionGovernor = options?.sessionGovernor ?? createDefaultSessionGovernorOwnershipPort();
  const routeIntent = options?.routeIntent ?? createDefaultRouteIntentOwnershipPort();
  const signedInRequestOwnershipService = createSignedInRequestOwnershipService({
    repository,
    identityBindingAuthority,
    accessGrantService,
    sessionGovernor,
    routeIntent,
  });
  return {
    signedInRequestOwnershipService,
    repository,
    identityBindingAuthority,
    accessGrantService,
    sessionGovernor,
    routeIntent,
    migrationPlanRef: signedInRequestOwnershipMigrationPlanRefs[0],
    migrationPlanRefs: signedInRequestOwnershipMigrationPlanRefs,
    persistenceTables: signedInRequestOwnershipPersistenceTables,
    parallelInterfaceGaps: signedInRequestOwnershipParallelInterfaceGaps,
    policyVersion: SIGNED_IN_REQUEST_OWNERSHIP_POLICY_VERSION,
  };
}

export function createSignedInRequestOwnershipService(options: {
  readonly repository: SignedInRequestOwnershipRepository;
  readonly identityBindingAuthority: IdentityBindingAuthorityOwnershipPort;
  readonly accessGrantService: AccessGrantOwnershipPort;
  readonly sessionGovernor: SessionGovernorOwnershipPort;
  readonly routeIntent: RouteIntentOwnershipPort;
}): SignedInRequestOwnershipService {
  const repository = options.repository;
  const identityBindingAuthority = options.identityBindingAuthority;
  const accessGrantService = options.accessGrantService;
  const sessionGovernor = options.sessionGovernor;
  const routeIntent = options.routeIntent;

  async function derivePatientRefsThroughAuthority(
    input: DerivePatientRefsThroughAuthorityInput,
  ): Promise<DerivePatientRefsThroughAuthorityResult> {
    const replay = repository.getDerivationByIdempotencyKey(input.idempotencyKey);
    if (replay) {
      return {
        settlement: replay.settlement,
        lineage: replay.lineage,
        authorityDecision: "replayed",
        replayed: true,
      };
    }

    const lineage = repository.getLineageByRef(input.requestLineageRef);
    if (!lineage) {
      throw new Error(`request lineage not found: ${input.requestLineageRef}`);
    }
    const observedAt = input.observedAt ?? new Date().toISOString();
    const episodeRef = input.episodeRef ?? lineage.episodeRef;
    const derivedLineageRefs = [
      { lineageKind: "request" as const, lineageRef: lineage.requestLineageRef },
      ...(episodeRef ? [{ lineageKind: "episode" as const, lineageRef: episodeRef }] : []),
    ];
    const authoritySettlement = await identityBindingAuthority.settleOwnership({
      commandId: stableRef("sro_authority_command", input.idempotencyKey),
      idempotencyKey: `${input.idempotencyKey}:identity-binding-authority`,
      subjectRef: input.subjectRef,
      expectedSubjectBindingVersionRef: input.expectedSubjectBindingVersionRef,
      patientLinkDecisionRef: input.patientLinkDecisionRef ?? null,
      targetPatientRef: input.targetPatientRef,
      derivedLineageRefs,
      routeIntentBindingRef: input.routeIntentBindingRef,
      actorRef: input.actorRef ?? input.subjectRef,
      reasonCodes: [
        "SRO_184_AUTHORITY_DERIVED_PATIENT_REF_ONLY",
        "SRO_184_REQUEST_EPISODE_PATIENT_REF_SAME_TRANSACTION",
        ...(input.reasonCodes ?? []),
      ],
      observedAt,
    });
    const settlement: AuthorityPatientRefDerivationSettlement = {
      derivationSettlementRef: stableRef("sro_derivation", input.idempotencyKey),
      idempotencyKey: input.idempotencyKey,
      requestLineageRef: lineage.requestLineageRef,
      requestRef: lineage.requestRef,
      episodeRef,
      subjectRef: input.subjectRef,
      authoritySettlementRef: authoritySettlement.authoritySettlementRef,
      previousSubjectBindingVersionRef: lineage.currentSubjectBindingVersionRef,
      nextSubjectBindingVersionRef: authoritySettlement.subjectBindingVersionRef,
      previousRequestPatientRef: lineage.requestPatientRef,
      nextRequestPatientRef: authoritySettlement.requestPatientRef,
      previousEpisodePatientRef: lineage.episodePatientRef,
      nextEpisodePatientRef: authoritySettlement.episodePatientRef,
      transactionBoundary: "identity_binding_authority_request_episode_patient_refs",
      reasonCodes: [
        "SRO_184_AUTHORITY_DERIVED_PATIENT_REF_ONLY",
        "SRO_184_REQUEST_EPISODE_PATIENT_REF_SAME_TRANSACTION",
        ...authoritySettlement.reasonCodes,
      ],
      settledAt: observedAt,
      createdByAuthority: SIGNED_IN_REQUEST_OWNERSHIP_SERVICE_NAME,
    };

    const accepted =
      authoritySettlement.decision === "accepted" || authoritySettlement.decision === "replayed";
    const ownershipState = authoritySettlement["ownershipState"];
    const nextLineage = accepted
      ? evolveLineage(lineage, {
          episodeRef,
          currentSubjectRef: input.subjectRef,
          currentOwnerSubjectRef:
            ownershipState === "claimed" ? input.subjectRef : lineage.currentOwnerSubjectRef,
          currentSubjectBindingVersionRef: authoritySettlement.subjectBindingVersionRef,
          ownershipPosture: ownershipState === "claimed" ? "owned_authenticated" : "claim_pending",
          writableAuthorityState: ownershipState === "claimed" ? "writable" : "claim_pending",
          patientRefDerivationState: "derived_in_authority_transaction",
          requestPatientRef: authoritySettlement.requestPatientRef,
          episodePatientRef: authoritySettlement.episodePatientRef,
          authoritySettlementRef: authoritySettlement.authoritySettlementRef,
          reasonCodes: mergeReasonCodes(lineage.reasonCodes, settlement.reasonCodes),
          updatedAt: observedAt,
        })
      : evolveLineage(lineage, {
          ownershipPosture: "claim_pending",
          writableAuthorityState: "claim_pending",
          reasonCodes: mergeReasonCodes(lineage.reasonCodes, authoritySettlement.reasonCodes),
          updatedAt: observedAt,
        });
    repository.saveDerivationSettlement(settlement, nextLineage);
    repository.appendEvent(
      createEvent(
        "request_ownership.patient_ref_derived",
        nextLineage.requestLineageRef,
        settlement,
      ),
    );
    return {
      settlement,
      lineage: nextLineage,
      authorityDecision: authoritySettlement.decision,
      replayed: false,
    };
  }

  return {
    async startSignedInDraft(input) {
      const replay = repository.getStartByIdempotencyKey(input.idempotencyKey);
      if (replay) {
        return { ...replay, replayed: true };
      }
      const observedAt = input.observedAt ?? new Date().toISOString();
      const existingLineage = repository.getLineageByDraftPublicId(input.draftPublicId);
      const ownershipPosture = startModeToOwnershipPosture(input.startMode);
      const writableAuthorityState = startModeToWritableAuthorityState(input.startMode);
      const lineage =
        existingLineage ??
        ({
          requestLineageRef: stableRef("request_lineage", input.draftPublicId),
          schemaVersion: SIGNED_IN_REQUEST_OWNERSHIP_SCHEMA_VERSION,
          policyVersion: SIGNED_IN_REQUEST_OWNERSHIP_POLICY_VERSION,
          draftPublicId: input.draftPublicId,
          requestRef: null,
          submissionEnvelopeRef: input.submissionEnvelopeRef,
          continuityShellRef: input.continuityShellRef,
          continuityAnchorRef: input.continuityAnchorRef,
          requestShellRef: input.requestShellRef,
          episodeRef: null,
          phase: "draft",
          currentSubjectRef: input.subjectRef,
          currentOwnerSubjectRef: input.startMode === "already_claimed" ? input.subjectRef : null,
          currentSubjectBindingVersionRef: input.subjectBindingVersionRef,
          sessionRef: input.sessionRef,
          sessionEpochRef: input.sessionEpochRef,
          routeIntentBindingRef: input.routeIntentBindingRef,
          lineageFenceRef: input.lineageFenceRef,
          ownershipPosture,
          writableAuthorityState,
          patientRefDerivationState: "not_derived",
          requestPatientRef: null,
          episodePatientRef: null,
          authoritySettlementRef: null,
          reasonCodes: [
            "SRO_184_ONE_REQUEST_LINEAGE",
            "SRO_184_SIGNED_IN_DRAFT_ATTACHED",
            "SRO_184_NO_DIRECT_PATIENT_REF_MUTATION",
          ],
          createdAt: observedAt,
          updatedAt: observedAt,
          version: 1,
          createdByAuthority: SIGNED_IN_REQUEST_OWNERSHIP_SERVICE_NAME,
        } satisfies RequestLineageOwnershipRecord);
      const nextLineage = existingLineage
        ? evolveLineage(existingLineage, {
            currentSubjectRef: input.subjectRef,
            currentOwnerSubjectRef:
              input.startMode === "already_claimed"
                ? input.subjectRef
                : existingLineage.currentOwnerSubjectRef,
            currentSubjectBindingVersionRef: input.subjectBindingVersionRef,
            sessionRef: input.sessionRef,
            sessionEpochRef: input.sessionEpochRef,
            routeIntentBindingRef: input.routeIntentBindingRef,
            lineageFenceRef: input.lineageFenceRef,
            ownershipPosture,
            writableAuthorityState,
            reasonCodes: mergeReasonCodes(existingLineage.reasonCodes, [
              "SRO_184_ONE_REQUEST_LINEAGE",
              "SRO_184_SIGNED_IN_DRAFT_ATTACHED",
            ]),
            updatedAt: observedAt,
          })
        : lineage;
      const start: SignedInRequestStartRecord = {
        signedInRequestStartRef: stableRef("sro_start", input.idempotencyKey),
        idempotencyKey: input.idempotencyKey,
        requestLineageRef: nextLineage.requestLineageRef,
        draftPublicId: input.draftPublicId,
        subjectRef: input.subjectRef,
        sessionRef: input.sessionRef,
        sessionEpochRef: input.sessionEpochRef,
        subjectBindingVersionRef: input.subjectBindingVersionRef,
        startMode: input.startMode,
        routeContinuityTarget: "same_draft_shell",
        reasonCodes: ["SRO_184_ONE_REQUEST_LINEAGE", "SRO_184_SIGNED_IN_DRAFT_ATTACHED"],
        startedAt: observedAt,
        createdByAuthority: SIGNED_IN_REQUEST_OWNERSHIP_SERVICE_NAME,
      };
      repository.saveLineage(nextLineage);
      repository.saveStart(start);
      repository.appendEvent(
        createEvent("request_ownership.signed_in_start", nextLineage.requestLineageRef, start),
      );
      return { start, lineage: nextLineage, replayed: false };
    },

    async claimPreSubmitDraft(input) {
      const replay = repository.getAttachmentByIdempotencyKey(input.idempotencyKey);
      if (replay) {
        return {
          attachment: replay.attachment,
          lineage: replay.lineage,
          derivationSettlement:
            repository.getDerivationByIdempotencyKey(`${input.idempotencyKey}:derive`)
              ?.settlement ?? null,
          replayed: true,
        };
      }

      const lineage = repository.getLineageByDraftPublicId(input.draftPublicId);
      if (!lineage) {
        throw new Error(`draft lineage not found: ${input.draftPublicId}`);
      }
      const observedAt = input.observedAt ?? new Date().toISOString();
      const drift = createDriftFenceIfNeeded({
        lineage,
        subjectRef: input.subjectRef,
        sessionEpochRef: input.sessionEpochRef,
        expectedSessionEpochRef: input.expectedSessionEpochRef,
        currentSubjectBindingVersionRef: input.currentSubjectBindingVersionRef,
        expectedSubjectBindingVersionRef: input.expectedSubjectBindingVersionRef,
        expectedRouteIntentBindingRef: input.expectedRouteIntentBindingRef,
        expectedLineageFenceRef: input.expectedLineageFenceRef,
        observedAt,
      });
      if (drift) {
        repository.saveDriftFence(drift);
        const attachment = buildAttachment({
          input,
          lineage,
          decisionState: drift.decisionState,
          routeContinuityTarget: drift.routeContinuityTarget,
          authoritySettlementRef: null,
          accessGrantSupersessionRefs: [],
          rotatedSessionEpochRef: null,
          reasonCodes: drift.reasonCodes,
          attachedAt: observedAt,
        });
        const recoveryLineage = evolveLineage(lineage, {
          ownershipPosture:
            drift.decisionState === "claim_pending" ? "claim_pending" : "recovery_only",
          writableAuthorityState: "claim_pending",
          reasonCodes: mergeReasonCodes(lineage.reasonCodes, drift.reasonCodes),
          updatedAt: observedAt,
        });
        repository.saveLineage(recoveryLineage);
        repository.saveAttachment(attachment);
        repository.appendEvent(
          createEvent("request_ownership.drift_recovery", recoveryLineage.requestLineageRef, drift),
        );
        return {
          attachment,
          lineage: recoveryLineage,
          derivationSettlement: null,
          replayed: false,
        };
      }

      const grantResult = await accessGrantService.supersedePublicGrantsForClaim({
        idempotencyKey: `${input.idempotencyKey}:access-grants`,
        draftPublicId: lineage.draftPublicId,
        requestLineageRef: lineage.requestLineageRef,
        submissionEnvelopeRef: lineage.submissionEnvelopeRef,
        publicGrantRefs: input.publicGrantRefs ?? [],
        sessionEpochRef: input.sessionEpochRef,
        subjectBindingVersionRef: input.currentSubjectBindingVersionRef,
        routeIntentBindingRef: lineage.routeIntentBindingRef,
        lineageFenceRef: lineage.lineageFenceRef,
        observedAt,
      });
      const rotation = input.writableScopeRequested
        ? await sessionGovernor.rotateForWritableScope({
            idempotencyKey: `${input.idempotencyKey}:session-governor`,
            sessionRef: input.sessionRef,
            sessionEpochRef: input.sessionEpochRef,
            subjectRef: input.subjectRef,
            subjectBindingVersionRef: input.currentSubjectBindingVersionRef,
            routeIntentBindingRef: lineage.routeIntentBindingRef,
            observedAt,
          })
        : null;
      const seededLineage = evolveLineage(lineage, {
        episodeRef: input.episodeRef ?? lineage.episodeRef,
        currentSubjectRef: input.subjectRef,
        sessionRef: input.sessionRef,
        sessionEpochRef: rotation?.rotatedSessionEpochRef ?? input.sessionEpochRef,
        currentSubjectBindingVersionRef: input.currentSubjectBindingVersionRef,
        ownershipPosture: "claim_pending",
        writableAuthorityState: input.writableScopeRequested ? "writable" : "claim_pending",
        reasonCodes: mergeReasonCodes(lineage.reasonCodes, [
          "SRO_184_PRE_SUBMIT_CLAIM_SAME_DRAFT",
          "SRO_184_PUBLIC_GRANTS_SUPERSEDED",
          ...(rotation ? ["SRO_184_SESSION_ROTATED_FOR_WRITABLE_SCOPE"] : []),
        ]),
        updatedAt: observedAt,
      });
      repository.saveLineage(seededLineage);

      const derivation = await derivePatientRefsThroughAuthority({
        idempotencyKey: `${input.idempotencyKey}:derive`,
        requestLineageRef: seededLineage.requestLineageRef,
        subjectRef: input.subjectRef,
        expectedSubjectBindingVersionRef: input.expectedSubjectBindingVersionRef,
        targetPatientRef: input.targetPatientRef,
        patientLinkDecisionRef: input.patientLinkDecisionRef ?? null,
        routeIntentBindingRef: seededLineage.routeIntentBindingRef,
        episodeRef: input.episodeRef ?? seededLineage.episodeRef,
        actorRef: input.actorRef ?? input.subjectRef,
        reasonCodes: ["SRO_184_PRE_SUBMIT_CLAIM_SAME_DRAFT"],
        observedAt,
      });
      const attachment = buildAttachment({
        input,
        lineage: derivation.lineage,
        decisionState: derivation.authorityDecision === "denied" ? "denied" : "claimed",
        routeContinuityTarget: "same_draft_shell",
        authoritySettlementRef: derivation.settlement.authoritySettlementRef,
        accessGrantSupersessionRefs: grantResult.accessGrantSupersessionRefs,
        rotatedSessionEpochRef: rotation?.rotatedSessionEpochRef ?? null,
        reasonCodes: [
          "SRO_184_PRE_SUBMIT_CLAIM_SAME_DRAFT",
          "SRO_184_PUBLIC_GRANTS_SUPERSEDED",
          ...(rotation
            ? ["SRO_184_SESSION_ROTATED_FOR_WRITABLE_SCOPE" as const, ...rotation.reasonCodes]
            : []),
          ...derivation.settlement.reasonCodes,
        ],
        attachedAt: observedAt,
      });
      repository.saveAttachment(attachment);
      repository.appendEvent(
        createEvent(
          "request_ownership.pre_submit_claim",
          derivation.lineage.requestLineageRef,
          attachment,
        ),
      );
      return {
        attachment,
        lineage: derivation.lineage,
        derivationSettlement: derivation.settlement,
        replayed: false,
      };
    },

    derivePatientRefsThroughAuthority,

    async upliftPostSubmitRequest(input) {
      const replayByIdempotency = repository.getUpliftByIdempotencyKey(input.idempotencyKey);
      if (replayByIdempotency) {
        return {
          mapping: replayByIdempotency.mapping,
          lineage: replayByIdempotency.lineage,
          derivationSettlement:
            repository.getDerivationByIdempotencyKey(`${input.idempotencyKey}:derive`)
              ?.settlement ?? null,
          replayed: true,
        };
      }
      const replayByRequest = repository.getUpliftByRequestRef(input.requestRef);
      if (replayByRequest) {
        const mapping: AuthenticatedUpliftMappingRecord = {
          ...replayByRequest.mapping,
          duplicatePromotionReplay: true,
          reasonCodes: mergeReasonCodes(replayByRequest.mapping.reasonCodes, [
            "SRO_184_DUPLICATE_PROMOTION_REPLAY_RETURNED",
          ]),
        };
        return {
          mapping,
          lineage: replayByRequest.lineage,
          derivationSettlement: null,
          replayed: true,
        };
      }

      const observedAt = input.observedAt ?? new Date().toISOString();
      const lineage =
        repository.getLineageByRequestRef(input.requestRef) ??
        (input.draftPublicId ? repository.getLineageByDraftPublicId(input.draftPublicId) : null);
      if (!lineage) {
        const mapping = buildUpliftMapping({
          input,
          lineage: null,
          decisionState: "recover_only",
          routeContinuityTarget: "recovery_shell",
          authoritySettlementRef: null,
          duplicatePromotionReplay: false,
          reasonCodes: ["SRO_184_SAME_SHELL_RECOVERY"],
          mappedAt: observedAt,
        });
        repository.saveUpliftMapping(mapping);
        repository.appendEvent(createEvent("request_ownership.drift_recovery", null, mapping));
        return { mapping, lineage: null, derivationSettlement: null, replayed: false };
      }

      const drift = createDriftFenceIfNeeded({
        lineage,
        subjectRef: input.subjectRef,
        sessionEpochRef: input.sessionEpochRef,
        expectedSessionEpochRef: input.expectedSessionEpochRef,
        currentSubjectBindingVersionRef: input.currentSubjectBindingVersionRef,
        expectedSubjectBindingVersionRef: input.expectedSubjectBindingVersionRef,
        expectedRouteIntentBindingRef: input.expectedRouteIntentBindingRef,
        expectedLineageFenceRef: input.expectedLineageFenceRef,
        observedAt,
      });
      if (drift) {
        repository.saveDriftFence(drift);
        const mapping = buildUpliftMapping({
          input,
          lineage,
          decisionState: drift.decisionState,
          routeContinuityTarget: drift.routeContinuityTarget,
          authoritySettlementRef: null,
          duplicatePromotionReplay: false,
          reasonCodes: drift.reasonCodes,
          mappedAt: observedAt,
        });
        const recoveryLineage = evolveLineage(lineage, {
          requestRef: input.requestRef,
          requestShellRef: input.requestShellRef,
          episodeRef: input.episodeRef ?? lineage.episodeRef,
          ownershipPosture:
            drift.decisionState === "claim_pending" ? "claim_pending" : "recovery_only",
          writableAuthorityState: "claim_pending",
          reasonCodes: mergeReasonCodes(lineage.reasonCodes, drift.reasonCodes),
          updatedAt: observedAt,
        });
        repository.saveLineage(recoveryLineage);
        repository.saveUpliftMapping(mapping);
        repository.appendEvent(
          createEvent("request_ownership.drift_recovery", recoveryLineage.requestLineageRef, drift),
        );
        return { mapping, lineage: recoveryLineage, derivationSettlement: null, replayed: false };
      }

      const continuity = await routeIntent.mapContinuity({
        idempotencyKey: `${input.idempotencyKey}:route-intent`,
        requestLineageRef: lineage.requestLineageRef,
        draftPublicId: lineage.draftPublicId,
        requestRef: input.requestRef,
        currentRouteIntentBindingRef: lineage.routeIntentBindingRef,
        target: "same_request_shell",
        observedAt,
      });
      const submittedLineage = evolveLineage(lineage, {
        requestRef: input.requestRef,
        requestShellRef: input.requestShellRef,
        episodeRef: input.episodeRef ?? lineage.episodeRef,
        phase: input.episodeRef ? "episode_opened" : "promoted",
        currentSubjectRef: input.subjectRef,
        sessionRef: input.sessionRef,
        sessionEpochRef: input.sessionEpochRef,
        currentSubjectBindingVersionRef: input.currentSubjectBindingVersionRef,
        routeIntentBindingRef: continuity.routeIntentBindingRef,
        ownershipPosture: "claim_pending",
        writableAuthorityState: "claim_pending",
        reasonCodes: mergeReasonCodes(lineage.reasonCodes, [
          "SRO_184_POST_SUBMIT_UPLIFT_SAME_REQUEST_SHELL",
        ]),
        updatedAt: observedAt,
      });
      repository.saveLineage(submittedLineage);
      const derivation = await derivePatientRefsThroughAuthority({
        idempotencyKey: `${input.idempotencyKey}:derive`,
        requestLineageRef: submittedLineage.requestLineageRef,
        subjectRef: input.subjectRef,
        expectedSubjectBindingVersionRef: input.expectedSubjectBindingVersionRef,
        targetPatientRef: input.targetPatientRef,
        patientLinkDecisionRef: input.patientLinkDecisionRef ?? null,
        routeIntentBindingRef: continuity.routeIntentBindingRef,
        episodeRef: input.episodeRef ?? submittedLineage.episodeRef,
        actorRef: input.actorRef ?? input.subjectRef,
        reasonCodes: ["SRO_184_POST_SUBMIT_UPLIFT_SAME_REQUEST_SHELL"],
        observedAt,
      });
      const mapping = buildUpliftMapping({
        input,
        lineage: derivation.lineage,
        decisionState: derivation.authorityDecision === "denied" ? "denied" : "uplifted",
        routeContinuityTarget: "same_request_shell",
        authoritySettlementRef: derivation.settlement.authoritySettlementRef,
        duplicatePromotionReplay: false,
        reasonCodes: [
          "SRO_184_POST_SUBMIT_UPLIFT_SAME_REQUEST_SHELL",
          "SRO_184_NO_DIRECT_PATIENT_REF_MUTATION",
          ...derivation.settlement.reasonCodes,
        ],
        mappedAt: observedAt,
      });
      repository.saveUpliftMapping(mapping);
      repository.appendEvent(
        createEvent(
          "request_ownership.post_submit_uplift",
          derivation.lineage.requestLineageRef,
          mapping,
        ),
      );
      return {
        mapping,
        lineage: derivation.lineage,
        derivationSettlement: derivation.settlement,
        replayed: false,
      };
    },

    async evaluateWritableContinuity(input) {
      const observedAt = input.observedAt ?? new Date().toISOString();
      const lineage =
        (input.requestLineageRef ? repository.getLineageByRef(input.requestLineageRef) : null) ??
        (input.draftPublicId ? repository.getLineageByDraftPublicId(input.draftPublicId) : null) ??
        (input.requestRef ? repository.getLineageByRequestRef(input.requestRef) : null);
      if (!lineage) {
        return {
          accepted: false,
          lineage: null,
          driftFence: null,
          decisionState: "recover_only",
          routeContinuityTarget: "recovery_shell",
          reasonCodes: ["SRO_184_SAME_SHELL_RECOVERY"],
        };
      }
      const drift = createDriftFenceIfNeeded({
        lineage,
        subjectRef: input.subjectRef,
        sessionEpochRef: input.sessionEpochRef,
        expectedSessionEpochRef: input.expectedSessionEpochRef,
        currentSubjectBindingVersionRef: input.currentSubjectBindingVersionRef,
        expectedSubjectBindingVersionRef: input.expectedSubjectBindingVersionRef,
        expectedRouteIntentBindingRef: input.expectedRouteIntentBindingRef,
        expectedLineageFenceRef: input.expectedLineageFenceRef,
        observedAt,
      });
      if (drift) {
        repository.saveDriftFence(drift);
        repository.appendEvent(
          createEvent("request_ownership.drift_recovery", lineage.requestLineageRef, drift),
        );
        return {
          accepted: false,
          lineage,
          driftFence: drift,
          decisionState: drift.decisionState,
          routeContinuityTarget: drift.routeContinuityTarget,
          reasonCodes: drift.reasonCodes,
        };
      }
      return {
        accepted: true,
        lineage,
        driftFence: null,
        decisionState:
          lineage.ownershipPosture === "owned_authenticated" ? "attached" : "claim_pending",
        routeContinuityTarget: "same_request_shell",
        reasonCodes: ["SRO_184_ONE_REQUEST_LINEAGE"],
      };
    },
  };
}

export function createDefaultIdentityBindingAuthorityOwnershipPort(): IdentityBindingAuthorityOwnershipPort {
  return {
    async settleOwnership(input) {
      return {
        authoritySettlementRef: stableRef("iba_ownership_settlement", input.idempotencyKey),
        subjectBindingVersionRef:
          input.expectedSubjectBindingVersionRef ??
          stableRef(
            "binding_version",
            `${input.subjectRef}:${input.targetPatientRef ?? "pending"}`,
          ),
        requestPatientRef: input.targetPatientRef,
        episodePatientRef: input.derivedLineageRefs.some((ref) => ref.lineageKind === "episode")
          ? input.targetPatientRef
          : null,
        ownershipState: input.targetPatientRef ? "claimed" : "claim_pending",
        decision: input.targetPatientRef ? "accepted" : "denied",
        reasonCodes: input.reasonCodes,
      };
    },
  };
}

export function createDefaultAccessGrantOwnershipPort(): AccessGrantOwnershipPort {
  return {
    async supersedePublicGrantsForClaim(input) {
      return {
        accessGrantSupersessionRefs: input.publicGrantRefs.map((grantRef) =>
          stableRef("access_grant_supersession", `${input.idempotencyKey}:${grantRef}`),
        ),
      };
    },
  };
}

export function createDefaultSessionGovernorOwnershipPort(): SessionGovernorOwnershipPort {
  return {
    async rotateForWritableScope(input) {
      return {
        rotatedSessionEpochRef: stableRef("session_epoch_rotated", input.idempotencyKey),
        sessionSettlementRef: stableRef("session_settlement", input.idempotencyKey),
        reasonCodes: ["SRO_184_SESSION_ROTATED_FOR_WRITABLE_SCOPE"],
      };
    },
  };
}

export function createDefaultRouteIntentOwnershipPort(): RouteIntentOwnershipPort {
  return {
    async mapContinuity(input) {
      return {
        routeIntentBindingRef: input.currentRouteIntentBindingRef,
        routeContinuityTarget: input.target,
        routeRef:
          input.target === "same_request_shell"
            ? `/requests/${input.requestRef ?? input.requestLineageRef}`
            : `/drafts/${input.draftPublicId ?? input.requestLineageRef}`,
      };
    },
  };
}

function startModeToOwnershipPosture(startMode: SignedInStartMode): OwnershipPosture {
  if (startMode === "already_claimed") {
    return "owned_authenticated";
  }
  if (startMode === "read_only") {
    return "read_only_authenticated";
  }
  return "claim_pending";
}

function startModeToWritableAuthorityState(startMode: SignedInStartMode): WritableAuthorityState {
  if (startMode === "already_claimed") {
    return "writable";
  }
  if (startMode === "read_only") {
    return "auth_read_only";
  }
  return "claim_pending";
}

function evolveLineage(
  lineage: RequestLineageOwnershipRecord,
  patch: Partial<
    Omit<
      RequestLineageOwnershipRecord,
      | "requestLineageRef"
      | "schemaVersion"
      | "policyVersion"
      | "draftPublicId"
      | "createdAt"
      | "version"
      | "createdByAuthority"
    >
  >,
): RequestLineageOwnershipRecord {
  return {
    ...lineage,
    ...patch,
    version: lineage.version + 1,
  };
}

function createDriftFenceIfNeeded(input: {
  readonly lineage: RequestLineageOwnershipRecord;
  readonly subjectRef: string;
  readonly sessionEpochRef: string;
  readonly expectedSessionEpochRef: string;
  readonly currentSubjectBindingVersionRef: string;
  readonly expectedSubjectBindingVersionRef: string;
  readonly expectedRouteIntentBindingRef: string;
  readonly expectedLineageFenceRef: string;
  readonly observedAt: string;
}): OwnershipDriftFenceRecord | null {
  if (input.lineage.currentSubjectRef && input.lineage.currentSubjectRef !== input.subjectRef) {
    return driftFence(input, "subject_switch", input.lineage.currentSubjectRef, input.subjectRef, [
      "SRO_184_SUBJECT_SWITCH_RECOVERY",
    ]);
  }
  if (
    input.lineage.sessionEpochRef !== input.sessionEpochRef ||
    input.sessionEpochRef !== input.expectedSessionEpochRef
  ) {
    return driftFence(
      input,
      "stale_session",
      input.lineage.sessionEpochRef ?? input.expectedSessionEpochRef,
      input.sessionEpochRef,
      ["SRO_184_STALE_SESSION_RECOVERY"],
    );
  }
  if (
    input.lineage.currentSubjectBindingVersionRef !== input.currentSubjectBindingVersionRef ||
    input.currentSubjectBindingVersionRef !== input.expectedSubjectBindingVersionRef
  ) {
    return driftFence(
      input,
      "stale_binding",
      input.lineage.currentSubjectBindingVersionRef ?? input.expectedSubjectBindingVersionRef,
      input.currentSubjectBindingVersionRef,
      ["SRO_184_STALE_BINDING_RECOVERY"],
    );
  }
  if (input.lineage.routeIntentBindingRef !== input.expectedRouteIntentBindingRef) {
    return driftFence(
      input,
      "route_intent_tuple_drift",
      input.lineage.routeIntentBindingRef,
      input.expectedRouteIntentBindingRef,
      ["SRO_184_ROUTE_INTENT_DRIFT_RECOVERY"],
    );
  }
  if (input.lineage.lineageFenceRef !== input.expectedLineageFenceRef) {
    return driftFence(
      input,
      "lineage_fence_drift",
      input.lineage.lineageFenceRef,
      input.expectedLineageFenceRef,
      ["SRO_184_LINEAGE_FENCE_DRIFT_RECOVERY"],
    );
  }
  return null;
}

function driftFence(
  input: {
    readonly lineage: RequestLineageOwnershipRecord;
    readonly subjectRef: string;
    readonly observedAt: string;
  },
  driftType: OwnershipDriftFenceRecord["driftType"],
  expectedRef: string | null,
  observedRef: string | null,
  reasonCodes: readonly SignedInRequestOwnershipReasonCode[],
): OwnershipDriftFenceRecord {
  const claimPending = driftType === "subject_switch";
  return {
    driftFenceRef: stableRef(
      "sro_drift_fence",
      `${input.lineage.requestLineageRef}:${driftType}:${expectedRef ?? "none"}:${observedRef ?? "none"}`,
    ),
    requestLineageRef: input.lineage.requestLineageRef,
    draftPublicId: input.lineage.draftPublicId,
    requestRef: input.lineage.requestRef,
    subjectRef: input.subjectRef,
    driftType,
    expectedRef,
    observedRef,
    decisionState: claimPending ? "claim_pending" : "recover_only",
    routeContinuityTarget: claimPending ? "claim_pending_shell" : "recovery_shell",
    reasonCodes,
    fencedAt: input.observedAt,
    createdByAuthority: SIGNED_IN_REQUEST_OWNERSHIP_SERVICE_NAME,
  };
}

function buildAttachment(input: {
  readonly input: ClaimPreSubmitDraftInput;
  readonly lineage: RequestLineageOwnershipRecord;
  readonly decisionState: OwnershipDecisionState;
  readonly routeContinuityTarget: RouteContinuityTarget;
  readonly authoritySettlementRef: string | null;
  readonly accessGrantSupersessionRefs: readonly string[];
  readonly rotatedSessionEpochRef: string | null;
  readonly reasonCodes: readonly string[];
  readonly attachedAt: string;
}): AuthenticatedOwnershipAttachmentRecord {
  return {
    attachmentRef: stableRef("sro_attachment", input.input.idempotencyKey),
    idempotencyKey: input.input.idempotencyKey,
    requestLineageRef: input.lineage.requestLineageRef,
    draftPublicId: input.lineage.draftPublicId,
    subjectRef: input.input.subjectRef,
    decisionState: input.decisionState,
    preservedSubmissionEnvelopeRef: input.lineage.submissionEnvelopeRef,
    preservedContinuityShellRef: input.lineage.continuityShellRef,
    preservedContinuityAnchorRef: input.lineage.continuityAnchorRef,
    authoritySettlementRef: input.authoritySettlementRef,
    accessGrantSupersessionRefs: [...input.accessGrantSupersessionRefs],
    rotatedSessionEpochRef: input.rotatedSessionEpochRef,
    routeContinuityTarget: input.routeContinuityTarget,
    reasonCodes: input.reasonCodes,
    attachedAt: input.attachedAt,
    createdByAuthority: SIGNED_IN_REQUEST_OWNERSHIP_SERVICE_NAME,
  };
}

function buildUpliftMapping(input: {
  readonly input: UpliftPostSubmitRequestInput;
  readonly lineage: RequestLineageOwnershipRecord | null;
  readonly decisionState: OwnershipDecisionState;
  readonly routeContinuityTarget: RouteContinuityTarget;
  readonly authoritySettlementRef: string | null;
  readonly duplicatePromotionReplay: boolean;
  readonly reasonCodes: readonly string[];
  readonly mappedAt: string;
}): AuthenticatedUpliftMappingRecord {
  return {
    upliftMappingRef: stableRef("sro_uplift", input.input.idempotencyKey),
    idempotencyKey: input.input.idempotencyKey,
    requestLineageRef: input.lineage?.requestLineageRef ?? null,
    draftPublicId: input.lineage?.draftPublicId ?? input.input.draftPublicId ?? null,
    requestRef: input.input.requestRef,
    requestShellRef: input.input.requestShellRef,
    episodeRef: input.input.episodeRef ?? input.lineage?.episodeRef ?? null,
    subjectRef: input.input.subjectRef,
    decisionState: input.decisionState,
    routeContinuityTarget: input.routeContinuityTarget,
    duplicatePromotionReplay: input.duplicatePromotionReplay,
    clonedRequestCreated: false,
    authoritySettlementRef: input.authoritySettlementRef,
    reasonCodes: input.reasonCodes,
    mappedAt: input.mappedAt,
    createdByAuthority: SIGNED_IN_REQUEST_OWNERSHIP_SERVICE_NAME,
  };
}

function createEvent(
  eventName: RequestOwnershipEventRecord["eventName"],
  requestLineageRef: string | null,
  payload: unknown,
): RequestOwnershipEventRecord {
  return {
    eventRef: stableRef("sro_event", `${eventName}:${digest(payload)}`),
    eventName,
    requestLineageRef,
    occurredAt: new Date().toISOString(),
    payloadHash: digest(payload),
    reasonCodes: extractReasonCodes(payload),
    createdByAuthority: SIGNED_IN_REQUEST_OWNERSHIP_SERVICE_NAME,
  };
}

function extractReasonCodes(payload: unknown): readonly string[] {
  if (payload && typeof payload === "object" && "reasonCodes" in payload) {
    const reasonCodes = (payload as { readonly reasonCodes?: unknown }).reasonCodes;
    return Array.isArray(reasonCodes) ? reasonCodes.filter(isString) : [];
  }
  return [];
}

function mergeReasonCodes(left: readonly string[], right: readonly string[]): readonly string[] {
  return [...new Set([...left, ...right])];
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
  if (Array.isArray(value)) {
    return value.map(stableValue);
  }
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

function isString(value: unknown): value is string {
  return typeof value === "string";
}
