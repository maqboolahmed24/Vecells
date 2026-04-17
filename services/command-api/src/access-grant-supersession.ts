import { createHash, randomBytes } from "node:crypto";
import {
  CAPABILITY_DECISION_POLICY_VERSION,
  CAPABILITY_DECISION_SCHEMA_VERSION,
} from "./capability-decision-engine";
import type {
  AccessGrantScopeEnvelope as CapabilityAccessGrantScopeEnvelope,
  CapabilityDecisionState,
  RouteRuntimeTuple,
  ScopeEnvelopeAuthorizationRecord,
} from "./capability-decision-engine";

export const ACCESS_GRANT_SERVICE_NAME = "AccessGrantService";
export const ACCESS_GRANT_SCHEMA_VERSION = "170.phase2.trust.v1";
export const ACCESS_GRANT_POLICY_VERSION = "phase2-access-grant-v1";

export const accessGrantSupersessionPersistenceTables = [
  "phase2_access_grant_scope_envelopes",
  "phase2_access_grants",
  "phase2_access_grant_redemptions",
  "phase2_access_grant_supersessions",
  "phase2_claim_redemption_settlements",
  "phase2_secure_link_session_projections",
] as const;

export const accessGrantSupersessionMigrationPlanRefs = [
  "services/command-api/migrations/096_phase2_access_grant_supersession.sql",
] as const;

export const accessGrantSupersessionParallelInterfaceGaps = [
  "PARALLEL_INTERFACE_GAP_PHASE2_ACCESS_GRANT_CANONICAL_SERVICE_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_ACCESS_GRANT_SCOPE_ENVELOPE_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_ACCESS_GRANT_EXACT_ONCE_REDEMPTION_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_ACCESS_GRANT_SUPERSESSION_CHAIN_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_ACCESS_GRANT_CLAIM_AUTHORITY_HANDOFF_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_ACCESS_GRANT_SESSION_ROTATION_V1",
] as const;

export const ACCESS_GRANT_REASON_CODES = [
  "ACCESS_181_CANONICAL_GRANT_ISSUED",
  "ACCESS_181_SCOPE_ENVELOPE_IMMUTABLE",
  "ACCESS_181_MANUAL_ONLY_NOT_REDEEMABLE",
  "ACCESS_181_TOKEN_HASH_ONLY",
  "ACCESS_181_REDEMPTION_EXACT_ONCE",
  "ACCESS_181_REPLAY_RETURNED",
  "ACCESS_181_SCOPE_AUTHORIZED_BY_CAPABILITY_DECISION_ENGINE",
  "ACCESS_181_SCOPE_DRIFT_RECOVER_ONLY",
  "ACCESS_181_GRANT_REDEEMED",
  "ACCESS_181_GRANT_RECOVER_ONLY",
  "ACCESS_181_GRANT_DENIED",
  "ACCESS_181_GRANT_EXPIRED",
  "ACCESS_181_GRANT_SUPERSESSION_SETTLED",
  "ACCESS_181_REPLACEMENT_GRANT_SUPERSEDES_PREDECESSOR",
  "ACCESS_181_CLAIM_SESSION_ACTIVE",
  "ACCESS_181_CLAIM_SESSION_WRITABLE_AUTHORITY_ACCEPTED",
  "ACCESS_181_CLAIM_ROUTE_INTENT_CURRENT",
  "ACCESS_181_CLAIM_CAPABILITY_ALLOW",
  "ACCESS_181_CLAIM_STEP_UP_REQUIRED",
  "ACCESS_181_BINDING_AUTHORITY_CLAIM_CONFIRMED",
  "ACCESS_181_NO_DIRECT_PATIENT_REF_MUTATION",
  "ACCESS_181_SESSION_ROTATED_AFTER_CLAIM",
  "ACCESS_181_PUBLIC_GRANTS_SUPERSEDED_AFTER_CLAIM",
  "ACCESS_181_CLAIM_REPLAY_RETURNED",
  "ACCESS_181_SAME_LINEAGE_RECOVERY",
] as const;

export type AccessGrantReasonCode = (typeof ACCESS_GRANT_REASON_CODES)[number];

export type AccessGrantFamily =
  | "draft_resume_minimal"
  | "public_status_minimal"
  | "claim_step_up"
  | "continuation_seeded_verified"
  | "continuation_challenge"
  | "support_recovery_minimal"
  | "transaction_action_minimal";

export type AccessGrantActionScope =
  | "envelope_resume"
  | "status_view"
  | "claim"
  | "attachment_add"
  | "respond_more_info"
  | "secure_resume"
  | "identity_repair"
  | "contact_route_repair";

export type AccessGrantState =
  | "live"
  | "redeeming"
  | "redeemed"
  | "rotated"
  | "superseded"
  | "revoked"
  | "expired"
  | "recover_only";

export type AccessGrantReplayPolicy = "one_time" | "rotating" | "multi_use_minimal";

export type AccessGrantRedemptionDecision =
  | "redeemed"
  | "recover_only"
  | "step_up_required"
  | "denied"
  | "expired"
  | "superseded";

export type AccessGrantSupersessionCauseClass =
  | "rotation"
  | "claim_completed"
  | "draft_promoted"
  | "secure_link_reissue"
  | "identity_repair"
  | "session_drift"
  | "route_drift"
  | "publication_drift"
  | "expiry_sweep"
  | "logout"
  | "manual_revoke"
  | "claim_replay_consumed"
  | "scope_drift";

export type ClaimRedemptionDecision =
  | "claim_confirmed"
  | "step_up_required"
  | "recover_only"
  | "denied";

export interface AccessGrantLineageScope {
  readonly lineageKind: "draft" | "request" | "episode" | "support_case";
  readonly lineageRef: string;
}

export interface AccessGrantScopeEnvelopeRecord extends CapabilityAccessGrantScopeEnvelope {
  readonly createdAt: string;
  readonly lineageScope: AccessGrantLineageScope;
  readonly phiExposureClass: "none" | "minimal" | "scoped_phi";
  readonly recoveryRouteRef: string | null;
  readonly immutableScopeHash: string;
  readonly createdByAuthority: typeof ACCESS_GRANT_SERVICE_NAME;
}

export interface AccessGrantRecord {
  readonly grantRef: string;
  readonly issueIdempotencyKey: string;
  readonly schemaVersion: typeof ACCESS_GRANT_SCHEMA_VERSION;
  readonly policyVersion: typeof ACCESS_GRANT_POLICY_VERSION;
  readonly grantFamily: AccessGrantFamily;
  readonly grantState: AccessGrantState;
  readonly replayPolicy: AccessGrantReplayPolicy;
  readonly scopeEnvelopeRef: string;
  readonly tokenHash: string;
  readonly subjectRef: string | null;
  readonly issuedBy: string;
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly predecessorGrantRef: string | null;
  readonly successorGrantRef: string | null;
  readonly currentRedemptionRef: string | null;
  readonly latestSupersessionRef: string | null;
  readonly reasonCodes: readonly string[];
  readonly createdByAuthority: typeof ACCESS_GRANT_SERVICE_NAME;
}

export interface AccessGrantRedemptionRecord {
  readonly redemptionRef: string;
  readonly idempotencyKey: string;
  readonly grantRef: string | null;
  readonly scopeEnvelopeRef: string | null;
  readonly tokenHash: string;
  readonly decision: AccessGrantRedemptionDecision;
  readonly terminal: true;
  readonly routeTupleHash: string | null;
  readonly scopeAuthorizationRef: string | null;
  readonly recoveryRouteRef: string | null;
  readonly sameLineageRecoveryAvailable: boolean;
  readonly actorRef: string;
  readonly reasonCodes: readonly string[];
  readonly settledAt: string;
  readonly createdByAuthority: typeof ACCESS_GRANT_SERVICE_NAME;
}

export interface AccessGrantSupersessionRecord {
  readonly supersessionRef: string;
  readonly idempotencyKey: string;
  readonly predecessorGrantRef: string;
  readonly successorGrantRef: string | null;
  readonly causeClass: AccessGrantSupersessionCauseClass;
  readonly supersessionState: Exclude<AccessGrantState, "live" | "redeeming">;
  readonly routeIntentBindingRef: string | null;
  readonly sessionEpochRef: string | null;
  readonly subjectBindingVersionRef: string | null;
  readonly lineageFenceRef: string | null;
  readonly reasonCodes: readonly string[];
  readonly settledAt: string;
  readonly createdByAuthority: typeof ACCESS_GRANT_SERVICE_NAME;
}

export interface ClaimRouteIntentBindingSnapshot {
  readonly routeIntentBindingRef: string;
  readonly bindingState: "live" | "stale" | "superseded" | "revoked";
  readonly routeFamily: string;
  readonly actionScope: "claim";
  readonly governingObjectRef: string;
  readonly governingObjectVersionRef: string | null;
  readonly sessionEpochRef: string | null;
  readonly subjectBindingVersionRef: string | null;
  readonly lineageFenceRef: string | null;
}

export interface ClaimSessionSnapshot {
  readonly sessionRef: string;
  readonly sessionState: "active" | "step_up_required" | "restricted" | "revoked" | "expired";
  readonly sessionEpochRef: string;
  readonly subjectRef: string;
  readonly subjectBindingVersionRef: string | null;
}

export interface ClaimSessionEstablishmentDecisionSnapshot {
  readonly sessionDecisionRef: string;
  readonly writableAuthorityState: "none" | "auth_read_only" | "claim_pending" | "writable";
  readonly sessionEpochRef: string;
  readonly subjectBindingVersionRef: string | null;
}

export interface ClaimCapabilityDecisionSnapshot {
  readonly capabilityDecisionRef: string;
  readonly decisionState: CapabilityDecisionState;
  readonly writableAuthorityState: "read_only" | "writable" | "blocked";
  readonly reasonCodes: readonly string[];
}

export interface ClaimConfidenceSnapshot {
  readonly P_link: number;
  readonly LCB_link_alpha: number;
  readonly P_subject: number;
  readonly LCB_subject_alpha: number;
  readonly runnerUpProbabilityUpperBound: number;
  readonly gap_logit: number;
  readonly confidenceModelState: "calibrated" | "drift_review" | "out_of_domain";
}

export interface ClaimBindingAuthorityInput {
  readonly subjectRef: string;
  readonly expectedCurrentBindingVersionRef: string | null;
  readonly patientLinkDecisionRef: string | null;
  readonly targetPatientRef: string;
  readonly confidence: ClaimConfidenceSnapshot;
  readonly provenanceRefs: readonly string[];
  readonly derivedLineageRefs: readonly AccessGrantLineageScope[];
  readonly actorRef: string;
}

export interface ClaimIdentityPostureSnapshot {
  readonly verificationLevel: "none" | "contact_seeded" | "nhs_low" | "nhs_p9" | "nhs_p5_plus";
  readonly completedStepUpRef: string | null;
}

export interface ClaimRedemptionSettlement {
  readonly claimSettlementRef: string;
  readonly idempotencyKey: string;
  readonly publicId: string;
  readonly decision: ClaimRedemptionDecision;
  readonly grantRedemptionRef: string | null;
  readonly bindingAuthoritySettlementRef: string | null;
  readonly bindingVersionRef: string | null;
  readonly rotatedSessionEpochRef: string | null;
  readonly commandActionRef: string | null;
  readonly commandSettlementRef: string | null;
  readonly supersessionRefs: readonly string[];
  readonly recoveryRouteRef: string | null;
  readonly reasonCodes: readonly string[];
  readonly settledAt: string;
  readonly createdByAuthority: typeof ACCESS_GRANT_SERVICE_NAME;
}

export interface SecureLinkSessionProjection {
  readonly projectionRef: string;
  readonly grantRef: string;
  readonly sessionEpochRef: string | null;
  readonly subjectBindingVersionRef: string | null;
  readonly routeIntentBindingRef: string | null;
  readonly sameShellRecoveryRouteRef: string | null;
  readonly projectionState: "recover_only" | "claim_pending" | "writable";
  readonly createdAt: string;
}

export interface IssueAccessGrantInput {
  readonly issueIdempotencyKey: string;
  readonly grantFamily: AccessGrantFamily | "manual_only";
  readonly actionScope: AccessGrantActionScope;
  readonly routeFamily: string;
  readonly governingObjectRef: string | null;
  readonly governingObjectVersionRef: string | null;
  readonly sessionEpochRef: string | null;
  readonly subjectBindingVersionRef: string | null;
  readonly lineageFenceRef: string | null;
  readonly routeIntentBindingRef: string | null;
  readonly releaseApprovalFreezeRef?: string | null;
  readonly manifestVersionRef?: string | null;
  readonly channelPosture: RouteRuntimeTuple["channelPosture"];
  readonly embeddedPosture: RouteRuntimeTuple["embeddedPosture"];
  readonly audienceScope: RouteRuntimeTuple["audienceScope"];
  readonly visibilityScope: RouteRuntimeTuple["visibilityScope"];
  readonly subjectRef?: string | null;
  readonly lineageScope: AccessGrantLineageScope;
  readonly phiExposureClass: AccessGrantScopeEnvelopeRecord["phiExposureClass"];
  readonly recoveryRouteRef?: string | null;
  readonly replayPolicy?: AccessGrantReplayPolicy;
  readonly predecessorGrantRef?: string | null;
  readonly opaqueToken?: string;
  readonly expiresAt: string;
  readonly issuedBy: string;
  readonly issuedAt?: string;
  readonly reasonCodes?: readonly string[];
}

export interface IssueAccessGrantResult {
  readonly grant: AccessGrantRecord;
  readonly scopeEnvelope: AccessGrantScopeEnvelopeRecord;
  readonly materializedToken: string | null;
  readonly replayed: boolean;
}

export interface RedeemAccessGrantInput {
  readonly redemptionIdempotencyKey: string;
  readonly presentedToken: string;
  readonly routeTuple: RouteRuntimeTuple;
  readonly actorRef: string;
  readonly sameLineageRecoveryAvailable?: boolean;
  readonly observedAt?: string;
}

export interface RedeemAccessGrantResult {
  readonly redemption: AccessGrantRedemptionRecord;
  readonly grant: AccessGrantRecord | null;
  readonly scopeEnvelope: AccessGrantScopeEnvelopeRecord | null;
  readonly scopeAuthorization: ScopeEnvelopeAuthorizationRecord | null;
  readonly supersession: AccessGrantSupersessionRecord | null;
  readonly replayed: boolean;
}

export interface SupersedeAccessGrantInput {
  readonly supersessionIdempotencyKey: string;
  readonly predecessorGrantRef: string;
  readonly successorGrantRef?: string | null;
  readonly causeClass: AccessGrantSupersessionCauseClass;
  readonly routeIntentBindingRef?: string | null;
  readonly sessionEpochRef?: string | null;
  readonly subjectBindingVersionRef?: string | null;
  readonly lineageFenceRef?: string | null;
  readonly supersessionState?: Exclude<AccessGrantState, "live" | "redeeming">;
  readonly actorRef: string;
  readonly reasonCodes?: readonly string[];
  readonly observedAt?: string;
}

export interface SupersedeAccessGrantResult {
  readonly supersession: AccessGrantSupersessionRecord;
  readonly predecessorGrant: AccessGrantRecord;
  readonly replayed: boolean;
}

export interface ReplaceAccessGrantInput {
  readonly supersessionIdempotencyKey: string;
  readonly issue: IssueAccessGrantInput;
  readonly predecessorGrantRef: string;
  readonly causeClass: AccessGrantSupersessionCauseClass;
  readonly actorRef: string;
  readonly observedAt?: string;
}

export interface ReplaceAccessGrantResult {
  readonly replacement: IssueAccessGrantResult;
  readonly supersession: AccessGrantSupersessionRecord;
  readonly replayed: boolean;
}

export interface RedeemClaimInput {
  readonly claimIdempotencyKey: string;
  readonly publicId: string;
  readonly presentedToken: string;
  readonly routeTuple: RouteRuntimeTuple;
  readonly routeIntentBinding: ClaimRouteIntentBindingSnapshot;
  readonly session: ClaimSessionSnapshot;
  readonly sessionEstablishmentDecision: ClaimSessionEstablishmentDecisionSnapshot;
  readonly capabilityDecision: ClaimCapabilityDecisionSnapshot;
  readonly identityPosture: ClaimIdentityPostureSnapshot;
  readonly bindingAuthority: ClaimBindingAuthorityInput;
  readonly stalePublicGrantRefs?: readonly string[];
  readonly targetAlreadyClaimedBySubjectRef?: string | null;
  readonly sameLineageRecoveryAvailable?: boolean;
  readonly observedAt?: string;
}

export interface RedeemClaimResult {
  readonly settlement: ClaimRedemptionSettlement;
  readonly redemption: AccessGrantRedemptionRecord | null;
  readonly bindingAuthoritySettlementRef: string | null;
  readonly rotatedSessionEpochRef: string | null;
  readonly supersessions: readonly AccessGrantSupersessionRecord[];
  readonly replayed: boolean;
}

export interface ScopeEnvelopeAuthorizationPort {
  authorizeScopeEnvelope(input: {
    readonly scopeEnvelope: AccessGrantScopeEnvelopeRecord;
    readonly routeTuple: RouteRuntimeTuple;
    readonly sameLineageRecoveryAvailable: boolean;
    readonly idempotencyKey: string;
    readonly observedAt: string;
  }): Promise<{
    readonly authorization: ScopeEnvelopeAuthorizationRecord;
    readonly replayed: boolean;
  }>;
}

export interface IdentityBindingAuthorityClaimPort {
  settleClaimConfirmed(input: {
    readonly commandId: string;
    readonly idempotencyKey: string;
    readonly subjectRef: string;
    readonly expectedCurrentBindingVersionRef: string | null;
    readonly patientLinkDecisionRef: string | null;
    readonly targetPatientRef: string;
    readonly routeIntentBindingRef: string;
    readonly confidence: ClaimConfidenceSnapshot;
    readonly provenanceRefs: readonly string[];
    readonly derivedLineageRefs: readonly AccessGrantLineageScope[];
    readonly actorRef: string;
    readonly observedAt: string;
  }): Promise<{
    readonly settlementRef: string;
    readonly bindingVersionRef: string | null;
    readonly decision: "accepted" | "replayed" | "denied" | "stale_rejected" | "freeze_blocked";
    readonly reasonCodes: readonly string[];
  }>;
}

export interface SessionGovernorRotationPort {
  rotateAfterClaim(input: {
    readonly sessionRef: string;
    readonly currentSessionEpochRef: string;
    readonly subjectRef: string;
    readonly previousBindingVersionRef: string | null;
    readonly nextBindingVersionRef: string | null;
    readonly routeIntentBindingRef: string;
    readonly reasonCodes: readonly string[];
    readonly observedAt: string;
  }): Promise<{
    readonly rotatedSessionEpochRef: string;
    readonly sessionSettlementRef: string;
    readonly reasonCodes: readonly string[];
  }>;
}

export interface AccessGrantSupersessionRepositorySnapshots {
  readonly scopeEnvelopes: readonly AccessGrantScopeEnvelopeRecord[];
  readonly grants: readonly AccessGrantRecord[];
  readonly redemptions: readonly AccessGrantRedemptionRecord[];
  readonly supersessions: readonly AccessGrantSupersessionRecord[];
  readonly claimSettlements: readonly ClaimRedemptionSettlement[];
  readonly secureLinkSessionProjections: readonly SecureLinkSessionProjection[];
}

export interface AccessGrantSupersessionRepository {
  getGrantByIssueIdempotencyKey(issueIdempotencyKey: string): Promise<AccessGrantRecord | null>;
  getGrantByRef(grantRef: string): Promise<AccessGrantRecord | null>;
  getGrantByTokenHash(tokenHash: string): Promise<AccessGrantRecord | null>;
  saveScopeEnvelope(
    envelope: AccessGrantScopeEnvelopeRecord,
  ): Promise<AccessGrantScopeEnvelopeRecord>;
  getScopeEnvelope(scopeEnvelopeRef: string): Promise<AccessGrantScopeEnvelopeRecord | null>;
  saveGrant(grant: AccessGrantRecord): Promise<AccessGrantRecord>;
  updateGrant(grant: AccessGrantRecord): Promise<AccessGrantRecord>;
  getRedemptionByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<AccessGrantRedemptionRecord | null>;
  getRedemptionByRef(redemptionRef: string): Promise<AccessGrantRedemptionRecord | null>;
  getRedemptionByTokenHash(tokenHash: string): Promise<AccessGrantRedemptionRecord | null>;
  saveRedemption(redemption: AccessGrantRedemptionRecord): Promise<AccessGrantRedemptionRecord>;
  getSupersessionByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<AccessGrantSupersessionRecord | null>;
  saveSupersession(
    supersession: AccessGrantSupersessionRecord,
  ): Promise<AccessGrantSupersessionRecord>;
  getClaimSettlementByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<ClaimRedemptionSettlement | null>;
  getClaimSettlementByTokenHash(tokenHash: string): Promise<ClaimRedemptionSettlement | null>;
  getClaimSettlementByGrantRedemptionRef(
    redemptionRef: string,
  ): Promise<ClaimRedemptionSettlement | null>;
  saveClaimSettlement(
    settlement: ClaimRedemptionSettlement,
    tokenHash: string,
  ): Promise<ClaimRedemptionSettlement>;
  saveSecureLinkSessionProjection(
    projection: SecureLinkSessionProjection,
  ): Promise<SecureLinkSessionProjection>;
}

export interface AccessGrantService {
  issueGrant(input: IssueAccessGrantInput): Promise<IssueAccessGrantResult>;
  redeemGrant(input: RedeemAccessGrantInput): Promise<RedeemAccessGrantResult>;
  supersedeGrant(input: SupersedeAccessGrantInput): Promise<SupersedeAccessGrantResult>;
  replaceGrant(input: ReplaceAccessGrantInput): Promise<ReplaceAccessGrantResult>;
  revokeGrant(
    input: Omit<SupersedeAccessGrantInput, "causeClass">,
  ): Promise<SupersedeAccessGrantResult>;
  redeemClaim(input: RedeemClaimInput): Promise<RedeemClaimResult>;
}

export interface AccessGrantSupersessionApplication {
  readonly accessGrantService: AccessGrantService;
  readonly repository: AccessGrantSupersessionRepository;
  readonly migrationPlanRef: (typeof accessGrantSupersessionMigrationPlanRefs)[number];
  readonly migrationPlanRefs: typeof accessGrantSupersessionMigrationPlanRefs;
  readonly persistenceTables: typeof accessGrantSupersessionPersistenceTables;
  readonly parallelInterfaceGaps: typeof accessGrantSupersessionParallelInterfaceGaps;
  readonly policyVersion: typeof ACCESS_GRANT_POLICY_VERSION;
}

type MutableGrantUpdate = Partial<
  Pick<
    AccessGrantRecord,
    | "grantState"
    | "successorGrantRef"
    | "currentRedemptionRef"
    | "latestSupersessionRef"
    | "reasonCodes"
  >
>;

function nowIso(): string {
  return new Date().toISOString();
}

function stableJson(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableJson(entry)).join(",")}]`;
  }
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableJson(entry)}`)
    .join(",")}}`;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function hashRef(prefix: string, value: unknown): string {
  return `${prefix}_${sha256(stableJson(value)).slice(0, 24)}`;
}

function hashToken(token: string): string {
  return `agtok_${sha256(`phase2-access-grant-token:${token}`)}`;
}

function generatedToken(): string {
  return `ag_live_${randomBytes(24).toString("base64url")}`;
}

function unique(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values)]);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function freezeRecord<T extends object>(value: T): Readonly<T> {
  return Object.freeze(clone(value));
}

function defaultReplayPolicy(grantFamily: AccessGrantFamily): AccessGrantReplayPolicy {
  if (grantFamily === "public_status_minimal" || grantFamily === "support_recovery_minimal") {
    return "multi_use_minimal";
  }
  if (grantFamily === "continuation_seeded_verified" || grantFamily === "continuation_challenge") {
    return "rotating";
  }
  return "one_time";
}

function supersessionStateForCause(
  causeClass: AccessGrantSupersessionCauseClass,
): Exclude<AccessGrantState, "live" | "redeeming"> {
  if (causeClass === "rotation" || causeClass === "secure_link_reissue") {
    return "rotated";
  }
  if (causeClass === "expiry_sweep") {
    return "expired";
  }
  if (causeClass === "logout" || causeClass === "manual_revoke") {
    return "revoked";
  }
  if (
    causeClass === "route_drift" ||
    causeClass === "scope_drift" ||
    causeClass === "session_drift" ||
    causeClass === "identity_repair"
  ) {
    return "recover_only";
  }
  return "superseded";
}

function isExpired(expiresAt: string, observedAt: string): boolean {
  const expiry = new Date(expiresAt).getTime();
  const observed = new Date(observedAt).getTime();
  return !Number.isFinite(expiry) || !Number.isFinite(observed) || expiry <= observed;
}

function grantWith(grant: AccessGrantRecord, update: MutableGrantUpdate): AccessGrantRecord {
  return freezeRecord({
    ...grant,
    ...update,
    reasonCodes: unique([...(grant.reasonCodes ?? []), ...(update.reasonCodes ?? [])]),
  }) as AccessGrantRecord;
}

function createScopeHash(input: IssueAccessGrantInput): string {
  return hashRef("ag_scope_hash", {
    grantFamily: input.grantFamily,
    actionScope: input.actionScope,
    routeFamily: input.routeFamily,
    governingObjectRef: input.governingObjectRef,
    governingObjectVersionRef: input.governingObjectVersionRef,
    sessionEpochRef: input.sessionEpochRef,
    subjectBindingVersionRef: input.subjectBindingVersionRef,
    lineageFenceRef: input.lineageFenceRef,
    routeIntentBindingRef: input.routeIntentBindingRef,
    releaseApprovalFreezeRef: input.releaseApprovalFreezeRef ?? null,
    manifestVersionRef: input.manifestVersionRef ?? null,
    channelPosture: input.channelPosture ?? null,
    embeddedPosture: input.embeddedPosture ?? null,
    audienceScope: input.audienceScope ?? null,
    visibilityScope: input.visibilityScope ?? null,
    lineageScope: input.lineageScope,
    phiExposureClass: input.phiExposureClass,
    recoveryRouteRef: input.recoveryRouteRef ?? null,
    expiresAt: input.expiresAt,
  });
}

function compareField(driftFields: string[], name: string, left: unknown, right: unknown): void {
  if ((left ?? null) !== (right ?? null)) {
    driftFields.push(name);
  }
}

function makeScopeAuthorization(input: {
  readonly scopeEnvelope: AccessGrantScopeEnvelopeRecord;
  readonly routeTuple: RouteRuntimeTuple;
  readonly sameLineageRecoveryAvailable: boolean;
  readonly idempotencyKey: string;
  readonly observedAt: string;
}): ScopeEnvelopeAuthorizationRecord {
  const driftFields: string[] = [];
  compareField(
    driftFields,
    "grantFamily",
    input.scopeEnvelope.grantFamily,
    input.routeTuple.grantFamily,
  );
  compareField(
    driftFields,
    "actionScope",
    input.scopeEnvelope.actionScope,
    input.routeTuple.actionScope,
  );
  compareField(
    driftFields,
    "routeFamily",
    input.scopeEnvelope.routeFamily,
    input.routeTuple.routeFamily,
  );
  compareField(
    driftFields,
    "governingObjectRef",
    input.scopeEnvelope.governingObjectRef,
    input.routeTuple.governingObjectRef,
  );
  compareField(
    driftFields,
    "governingObjectVersionRef",
    input.scopeEnvelope.governingObjectVersionRef,
    input.routeTuple.governingObjectVersionRef,
  );
  compareField(
    driftFields,
    "sessionEpochRef",
    input.scopeEnvelope.sessionEpochRef,
    input.routeTuple.sessionEpochRef,
  );
  compareField(
    driftFields,
    "subjectBindingVersionRef",
    input.scopeEnvelope.subjectBindingVersionRef,
    input.routeTuple.subjectBindingVersionRef,
  );
  compareField(
    driftFields,
    "lineageFenceRef",
    input.scopeEnvelope.lineageFenceRef,
    input.routeTuple.lineageFenceRef,
  );
  compareField(
    driftFields,
    "releaseApprovalFreezeRef",
    input.scopeEnvelope.releaseApprovalFreezeRef,
    input.routeTuple.releaseApprovalFreezeRef,
  );
  compareField(
    driftFields,
    "manifestVersionRef",
    input.scopeEnvelope.manifestVersionRef,
    input.routeTuple.manifestVersionRef,
  );
  compareField(
    driftFields,
    "channelPosture",
    input.scopeEnvelope.channelPosture,
    input.routeTuple.channelPosture,
  );
  compareField(
    driftFields,
    "embeddedPosture",
    input.scopeEnvelope.embeddedPosture,
    input.routeTuple.embeddedPosture,
  );
  compareField(
    driftFields,
    "audienceScope",
    input.scopeEnvelope.audienceScope,
    input.routeTuple.audienceScope,
  );
  compareField(
    driftFields,
    "visibilityScope",
    input.scopeEnvelope.visibilityScope,
    input.routeTuple.visibilityScope,
  );

  const reasonCodes = ["CAP_180_SCOPE_ENVELOPE_CHECKED", "ACCESS_181_REDEMPTION_EXACT_ONCE"];
  let authorizationState: ScopeEnvelopeAuthorizationRecord["authorizationState"] = "authorized";
  if (isExpired(input.scopeEnvelope.expiresAt, input.observedAt)) {
    authorizationState = "deny";
    reasonCodes.push("CAP_180_SCOPE_EXPIRED", "ACCESS_181_GRANT_EXPIRED");
  } else if (input.scopeEnvelope.supersessionState !== "live") {
    authorizationState = "deny";
    reasonCodes.push("CAP_180_SCOPE_SUPERSEDED");
  } else if (driftFields.length > 0) {
    authorizationState = input.sameLineageRecoveryAvailable ? "recover_only" : "deny";
    reasonCodes.push(
      input.sameLineageRecoveryAvailable ? "CAP_180_SCOPE_RECOVER_ONLY" : "CAP_180_SCOPE_DENIED",
      "ACCESS_181_SCOPE_DRIFT_RECOVER_ONLY",
    );
  } else {
    reasonCodes.push(
      "CAP_180_SCOPE_ENVELOPE_AUTHORIZED",
      "ACCESS_181_SCOPE_AUTHORIZED_BY_CAPABILITY_DECISION_ENGINE",
    );
  }

  return freezeRecord({
    scopeEnvelopeAuthorizationId: hashRef("sear", {
      scopeEnvelopeRef: input.scopeEnvelope.scopeEnvelopeRef,
      idempotencyKey: input.idempotencyKey,
    }),
    schemaVersion: CAPABILITY_DECISION_SCHEMA_VERSION,
    policyVersion: CAPABILITY_DECISION_POLICY_VERSION,
    scopeEnvelopeRef: input.scopeEnvelope.scopeEnvelopeRef,
    authorizationState,
    routeTupleHash: hashRef("route_tuple", input.routeTuple),
    driftFields: unique(driftFields),
    reasonCodes: unique(reasonCodes),
    idempotencyKey: input.idempotencyKey,
    authorizedAt: input.observedAt,
    expiresAt: input.scopeEnvelope.expiresAt,
  }) as ScopeEnvelopeAuthorizationRecord;
}

function terminalRedemption(input: {
  readonly redemptionIdempotencyKey: string;
  readonly tokenHash: string;
  readonly grantRef: string | null;
  readonly scopeEnvelopeRef: string | null;
  readonly decision: AccessGrantRedemptionDecision;
  readonly routeTuple: RouteRuntimeTuple | null;
  readonly authorization: ScopeEnvelopeAuthorizationRecord | null;
  readonly recoveryRouteRef: string | null;
  readonly sameLineageRecoveryAvailable: boolean;
  readonly actorRef: string;
  readonly reasonCodes: readonly string[];
  readonly observedAt: string;
}): AccessGrantRedemptionRecord {
  return freezeRecord({
    redemptionRef: hashRef("agr", {
      idempotencyKey: input.redemptionIdempotencyKey,
      tokenHash: input.tokenHash,
      grantRef: input.grantRef,
    }),
    idempotencyKey: input.redemptionIdempotencyKey,
    grantRef: input.grantRef,
    scopeEnvelopeRef: input.scopeEnvelopeRef,
    tokenHash: input.tokenHash,
    decision: input.decision,
    terminal: true,
    routeTupleHash: input.routeTuple ? hashRef("route_tuple", input.routeTuple) : null,
    scopeAuthorizationRef: input.authorization?.scopeEnvelopeAuthorizationId ?? null,
    recoveryRouteRef: input.recoveryRouteRef,
    sameLineageRecoveryAvailable: input.sameLineageRecoveryAvailable,
    actorRef: input.actorRef,
    reasonCodes: unique(input.reasonCodes),
    settledAt: input.observedAt,
    createdByAuthority: ACCESS_GRANT_SERVICE_NAME,
  }) as AccessGrantRedemptionRecord;
}

function defaultBindingAuthorityPort(): IdentityBindingAuthorityClaimPort {
  return {
    async settleClaimConfirmed(input) {
      const bindingVersionRef = hashRef("ibv_claim", {
        subjectRef: input.subjectRef,
        targetPatientRef: input.targetPatientRef,
        idempotencyKey: input.idempotencyKey,
      });
      return freezeRecord({
        settlementRef: hashRef("ibas_claim", {
          commandId: input.commandId,
          idempotencyKey: input.idempotencyKey,
        }),
        bindingVersionRef,
        decision: "accepted" as const,
        reasonCodes: [
          "BINDING_179_AUTHORITY_SOLE_WRITER",
          "BINDING_179_ACCEPTED_APPEND_ONLY",
          "BINDING_179_CURRENT_POINTER_CAS",
          "ACCESS_181_BINDING_AUTHORITY_CLAIM_CONFIRMED",
        ],
      });
    },
  };
}

function defaultSessionGovernorPort(): SessionGovernorRotationPort {
  return {
    async rotateAfterClaim(input) {
      return freezeRecord({
        rotatedSessionEpochRef: hashRef("sess_epoch_claim", {
          sessionRef: input.sessionRef,
          currentSessionEpochRef: input.currentSessionEpochRef,
          nextBindingVersionRef: input.nextBindingVersionRef,
          observedAt: input.observedAt,
        }),
        sessionSettlementRef: hashRef("sess_settlement_claim", {
          sessionRef: input.sessionRef,
          observedAt: input.observedAt,
        }),
        reasonCodes: unique([
          "SESSION_176_ROTATED_AFTER_BINDING_CHANGE",
          "ACCESS_181_SESSION_ROTATED_AFTER_CLAIM",
          ...input.reasonCodes,
        ]),
      });
    },
  };
}

export function createInMemoryAccessGrantSupersessionRepository(): AccessGrantSupersessionRepository & {
  readonly snapshots: () => AccessGrantSupersessionRepositorySnapshots;
} {
  const scopeEnvelopes = new Map<string, AccessGrantScopeEnvelopeRecord>();
  const grants = new Map<string, AccessGrantRecord>();
  const grantsByIssueIdempotencyKey = new Map<string, string>();
  const grantsByTokenHash = new Map<string, string>();
  const redemptions = new Map<string, AccessGrantRedemptionRecord>();
  const redemptionsByIdempotencyKey = new Map<string, string>();
  const redemptionsByTokenHash = new Map<string, string>();
  const supersessions = new Map<string, AccessGrantSupersessionRecord>();
  const supersessionsByIdempotencyKey = new Map<string, string>();
  const claimSettlements = new Map<string, ClaimRedemptionSettlement>();
  const claimSettlementsByIdempotencyKey = new Map<string, string>();
  const claimSettlementsByTokenHash = new Map<string, string>();
  const claimSettlementsByRedemptionRef = new Map<string, string>();
  const secureLinkSessionProjections = new Map<string, SecureLinkSessionProjection>();

  return {
    async getGrantByIssueIdempotencyKey(issueIdempotencyKey) {
      const grantRef = grantsByIssueIdempotencyKey.get(issueIdempotencyKey);
      return grantRef ? clone(grants.get(grantRef) ?? null) : null;
    },
    async getGrantByRef(grantRef) {
      return clone(grants.get(grantRef) ?? null);
    },
    async getGrantByTokenHash(tokenHash) {
      const grantRef = grantsByTokenHash.get(tokenHash);
      return grantRef ? clone(grants.get(grantRef) ?? null) : null;
    },
    async saveScopeEnvelope(envelope) {
      const record = freezeRecord(envelope) as AccessGrantScopeEnvelopeRecord;
      scopeEnvelopes.set(record.scopeEnvelopeRef, record);
      return clone(record);
    },
    async getScopeEnvelope(scopeEnvelopeRef) {
      return clone(scopeEnvelopes.get(scopeEnvelopeRef) ?? null);
    },
    async saveGrant(grant) {
      const record = freezeRecord(grant) as AccessGrantRecord;
      grants.set(record.grantRef, record);
      grantsByIssueIdempotencyKey.set(record.issueIdempotencyKey, record.grantRef);
      grantsByTokenHash.set(record.tokenHash, record.grantRef);
      return clone(record);
    },
    async updateGrant(grant) {
      const record = freezeRecord(grant) as AccessGrantRecord;
      grants.set(record.grantRef, record);
      grantsByTokenHash.set(record.tokenHash, record.grantRef);
      return clone(record);
    },
    async getRedemptionByIdempotencyKey(idempotencyKey) {
      const redemptionRef = redemptionsByIdempotencyKey.get(idempotencyKey);
      return redemptionRef ? clone(redemptions.get(redemptionRef) ?? null) : null;
    },
    async getRedemptionByRef(redemptionRef) {
      return clone(redemptions.get(redemptionRef) ?? null);
    },
    async getRedemptionByTokenHash(tokenHash) {
      const redemptionRef = redemptionsByTokenHash.get(tokenHash);
      return redemptionRef ? clone(redemptions.get(redemptionRef) ?? null) : null;
    },
    async saveRedemption(redemption) {
      const record = freezeRecord(redemption) as AccessGrantRedemptionRecord;
      redemptions.set(record.redemptionRef, record);
      redemptionsByIdempotencyKey.set(record.idempotencyKey, record.redemptionRef);
      redemptionsByTokenHash.set(record.tokenHash, record.redemptionRef);
      return clone(record);
    },
    async getSupersessionByIdempotencyKey(idempotencyKey) {
      const supersessionRef = supersessionsByIdempotencyKey.get(idempotencyKey);
      return supersessionRef ? clone(supersessions.get(supersessionRef) ?? null) : null;
    },
    async saveSupersession(supersession) {
      const record = freezeRecord(supersession) as AccessGrantSupersessionRecord;
      supersessions.set(record.supersessionRef, record);
      supersessionsByIdempotencyKey.set(record.idempotencyKey, record.supersessionRef);
      return clone(record);
    },
    async getClaimSettlementByIdempotencyKey(idempotencyKey) {
      const claimSettlementRef = claimSettlementsByIdempotencyKey.get(idempotencyKey);
      return claimSettlementRef ? clone(claimSettlements.get(claimSettlementRef) ?? null) : null;
    },
    async getClaimSettlementByTokenHash(tokenHash) {
      const claimSettlementRef = claimSettlementsByTokenHash.get(tokenHash);
      return claimSettlementRef ? clone(claimSettlements.get(claimSettlementRef) ?? null) : null;
    },
    async getClaimSettlementByGrantRedemptionRef(redemptionRef) {
      const claimSettlementRef = claimSettlementsByRedemptionRef.get(redemptionRef);
      return claimSettlementRef ? clone(claimSettlements.get(claimSettlementRef) ?? null) : null;
    },
    async saveClaimSettlement(settlement, tokenHash) {
      const record = freezeRecord(settlement) as ClaimRedemptionSettlement;
      claimSettlements.set(record.claimSettlementRef, record);
      claimSettlementsByIdempotencyKey.set(record.idempotencyKey, record.claimSettlementRef);
      claimSettlementsByTokenHash.set(tokenHash, record.claimSettlementRef);
      if (record.grantRedemptionRef) {
        claimSettlementsByRedemptionRef.set(record.grantRedemptionRef, record.claimSettlementRef);
      }
      return clone(record);
    },
    async saveSecureLinkSessionProjection(projection) {
      const record = freezeRecord(projection) as SecureLinkSessionProjection;
      secureLinkSessionProjections.set(record.projectionRef, record);
      return clone(record);
    },
    snapshots() {
      return freezeRecord({
        scopeEnvelopes: [...scopeEnvelopes.values()],
        grants: [...grants.values()],
        redemptions: [...redemptions.values()],
        supersessions: [...supersessions.values()],
        claimSettlements: [...claimSettlements.values()],
        secureLinkSessionProjections: [...secureLinkSessionProjections.values()],
      }) as AccessGrantSupersessionRepositorySnapshots;
    },
  };
}

export function createAccessGrantService(options: {
  readonly repository: AccessGrantSupersessionRepository;
  readonly scopeAuthorizer?: ScopeEnvelopeAuthorizationPort;
  readonly identityBindingAuthority?: IdentityBindingAuthorityClaimPort;
  readonly sessionGovernor?: SessionGovernorRotationPort;
}): AccessGrantService {
  const repository = options.repository;
  const identityBindingAuthority =
    options.identityBindingAuthority ?? defaultBindingAuthorityPort();
  const sessionGovernor = options.sessionGovernor ?? defaultSessionGovernorPort();

  async function authorizeScopeEnvelope(input: {
    readonly scopeEnvelope: AccessGrantScopeEnvelopeRecord;
    readonly routeTuple: RouteRuntimeTuple;
    readonly sameLineageRecoveryAvailable: boolean;
    readonly idempotencyKey: string;
    readonly observedAt: string;
  }): Promise<{
    readonly authorization: ScopeEnvelopeAuthorizationRecord;
    readonly replayed: boolean;
  }> {
    if (options.scopeAuthorizer) {
      return options.scopeAuthorizer.authorizeScopeEnvelope(input);
    }
    return {
      authorization: makeScopeAuthorization(input),
      replayed: false,
    };
  }

  async function supersedeGrant(
    input: SupersedeAccessGrantInput,
  ): Promise<SupersedeAccessGrantResult> {
    const observedAt = input.observedAt ?? nowIso();
    const replay = await repository.getSupersessionByIdempotencyKey(
      input.supersessionIdempotencyKey,
    );
    if (replay) {
      const predecessorGrant = await repository.getGrantByRef(replay.predecessorGrantRef);
      if (!predecessorGrant) {
        throw new Error(`Missing predecessor grant ${replay.predecessorGrantRef}`);
      }
      return { supersession: replay, predecessorGrant, replayed: true };
    }

    const predecessorGrant = await repository.getGrantByRef(input.predecessorGrantRef);
    if (!predecessorGrant) {
      throw new Error(`Unknown predecessor grant ${input.predecessorGrantRef}`);
    }

    const supersessionState =
      input.supersessionState ?? supersessionStateForCause(input.causeClass);
    const reasonCodes = unique([
      "ACCESS_181_GRANT_SUPERSESSION_SETTLED",
      ...(input.successorGrantRef ? ["ACCESS_181_REPLACEMENT_GRANT_SUPERSEDES_PREDECESSOR"] : []),
      ...(input.reasonCodes ?? []),
    ]);
    const supersession: AccessGrantSupersessionRecord = freezeRecord({
      supersessionRef: hashRef("ags", {
        predecessorGrantRef: input.predecessorGrantRef,
        successorGrantRef: input.successorGrantRef ?? null,
        idempotencyKey: input.supersessionIdempotencyKey,
      }),
      idempotencyKey: input.supersessionIdempotencyKey,
      predecessorGrantRef: input.predecessorGrantRef,
      successorGrantRef: input.successorGrantRef ?? null,
      causeClass: input.causeClass,
      supersessionState,
      routeIntentBindingRef: input.routeIntentBindingRef ?? null,
      sessionEpochRef: input.sessionEpochRef ?? null,
      subjectBindingVersionRef: input.subjectBindingVersionRef ?? null,
      lineageFenceRef: input.lineageFenceRef ?? null,
      reasonCodes,
      settledAt: observedAt,
      createdByAuthority: ACCESS_GRANT_SERVICE_NAME,
    }) as AccessGrantSupersessionRecord;
    await repository.saveSupersession(supersession);
    const updated = grantWith(predecessorGrant, {
      grantState: supersessionState,
      successorGrantRef: input.successorGrantRef ?? predecessorGrant.successorGrantRef,
      latestSupersessionRef: supersession.supersessionRef,
      reasonCodes,
    });
    await repository.updateGrant(updated);
    return { supersession, predecessorGrant: updated, replayed: false };
  }

  async function settleClaim(input: {
    readonly claimInput: RedeemClaimInput;
    readonly decision: ClaimRedemptionDecision;
    readonly tokenHash: string;
    readonly grantRedemptionRef: string | null;
    readonly bindingAuthoritySettlementRef: string | null;
    readonly bindingVersionRef: string | null;
    readonly rotatedSessionEpochRef: string | null;
    readonly supersessionRefs: readonly string[];
    readonly recoveryRouteRef: string | null;
    readonly reasonCodes: readonly string[];
    readonly observedAt: string;
  }): Promise<ClaimRedemptionSettlement> {
    const commandActionRef =
      input.decision === "claim_confirmed"
        ? hashRef("cmd_action_claim", {
            publicId: input.claimInput.publicId,
            idempotencyKey: input.claimInput.claimIdempotencyKey,
          })
        : null;
    const commandSettlementRef =
      input.decision === "claim_confirmed"
        ? hashRef("cmd_settlement_claim", {
            commandActionRef,
            bindingAuthoritySettlementRef: input.bindingAuthoritySettlementRef,
          })
        : null;
    const settlement: ClaimRedemptionSettlement = freezeRecord({
      claimSettlementRef: hashRef("claim_settlement", {
        publicId: input.claimInput.publicId,
        idempotencyKey: input.claimInput.claimIdempotencyKey,
      }),
      idempotencyKey: input.claimInput.claimIdempotencyKey,
      publicId: input.claimInput.publicId,
      decision: input.decision,
      grantRedemptionRef: input.grantRedemptionRef,
      bindingAuthoritySettlementRef: input.bindingAuthoritySettlementRef,
      bindingVersionRef: input.bindingVersionRef,
      rotatedSessionEpochRef: input.rotatedSessionEpochRef,
      commandActionRef,
      commandSettlementRef,
      supersessionRefs: unique(input.supersessionRefs),
      recoveryRouteRef: input.recoveryRouteRef,
      reasonCodes: unique(input.reasonCodes),
      settledAt: input.observedAt,
      createdByAuthority: ACCESS_GRANT_SERVICE_NAME,
    }) as ClaimRedemptionSettlement;
    return repository.saveClaimSettlement(settlement, input.tokenHash);
  }

  function replayClaimResult(settlement: ClaimRedemptionSettlement): RedeemClaimResult {
    return {
      settlement: freezeRecord({
        ...settlement,
        reasonCodes: unique([...settlement.reasonCodes, "ACCESS_181_CLAIM_REPLAY_RETURNED"]),
      }) as ClaimRedemptionSettlement,
      redemption: null,
      bindingAuthoritySettlementRef: settlement.bindingAuthoritySettlementRef,
      rotatedSessionEpochRef: settlement.rotatedSessionEpochRef,
      supersessions: Object.freeze([]),
      replayed: true,
    };
  }

  return {
    async issueGrant(input) {
      if (input.grantFamily === "manual_only") {
        throw new Error(
          "manual_only is not a redeemable grant: ACCESS_181_MANUAL_ONLY_NOT_REDEEMABLE",
        );
      }
      const replay = await repository.getGrantByIssueIdempotencyKey(input.issueIdempotencyKey);
      if (replay) {
        const scopeEnvelope = await repository.getScopeEnvelope(replay.scopeEnvelopeRef);
        if (!scopeEnvelope) {
          throw new Error(`Missing scope envelope ${replay.scopeEnvelopeRef}`);
        }
        return { grant: replay, scopeEnvelope, materializedToken: null, replayed: true };
      }

      const issuedAt = input.issuedAt ?? nowIso();
      const opaqueToken = input.opaqueToken ?? generatedToken();
      const tokenHash = hashToken(opaqueToken);
      const scopeHash = createScopeHash(input);
      const scopeEnvelopeRef = hashRef("agse", {
        issueIdempotencyKey: input.issueIdempotencyKey,
        scopeHash,
      });
      const scopeEnvelope: AccessGrantScopeEnvelopeRecord = freezeRecord({
        scopeEnvelopeRef,
        grantFamily: input.grantFamily,
        actionScope: input.actionScope,
        routeFamily: input.routeFamily,
        governingObjectRef: input.governingObjectRef,
        governingObjectVersionRef: input.governingObjectVersionRef,
        sessionEpochRef: input.sessionEpochRef,
        subjectBindingVersionRef: input.subjectBindingVersionRef,
        lineageFenceRef: input.lineageFenceRef,
        routeIntentBindingRef: input.routeIntentBindingRef,
        releaseApprovalFreezeRef: input.releaseApprovalFreezeRef ?? null,
        manifestVersionRef: input.manifestVersionRef ?? null,
        channelPosture: input.channelPosture ?? null,
        embeddedPosture: input.embeddedPosture ?? null,
        audienceScope: input.audienceScope ?? null,
        visibilityScope: input.visibilityScope ?? null,
        expiresAt: input.expiresAt,
        supersessionState: "live" as const,
        redemptionState: "unredeemed" as const,
        scopeHash,
        createdAt: issuedAt,
        lineageScope: input.lineageScope,
        phiExposureClass: input.phiExposureClass,
        recoveryRouteRef: input.recoveryRouteRef ?? null,
        immutableScopeHash: scopeHash,
        createdByAuthority: ACCESS_GRANT_SERVICE_NAME,
      }) as AccessGrantScopeEnvelopeRecord;
      const grant: AccessGrantRecord = freezeRecord({
        grantRef: hashRef("ag", {
          issueIdempotencyKey: input.issueIdempotencyKey,
          scopeEnvelopeRef,
        }),
        issueIdempotencyKey: input.issueIdempotencyKey,
        schemaVersion: ACCESS_GRANT_SCHEMA_VERSION,
        policyVersion: ACCESS_GRANT_POLICY_VERSION,
        grantFamily: input.grantFamily,
        grantState: "live" as const,
        replayPolicy: input.replayPolicy ?? defaultReplayPolicy(input.grantFamily),
        scopeEnvelopeRef,
        tokenHash,
        subjectRef: input.subjectRef ?? null,
        issuedBy: input.issuedBy,
        issuedAt,
        expiresAt: input.expiresAt,
        predecessorGrantRef: input.predecessorGrantRef ?? null,
        successorGrantRef: null,
        currentRedemptionRef: null,
        latestSupersessionRef: null,
        reasonCodes: unique([
          "ACCESS_181_CANONICAL_GRANT_ISSUED",
          "ACCESS_181_SCOPE_ENVELOPE_IMMUTABLE",
          "ACCESS_181_TOKEN_HASH_ONLY",
          ...(input.reasonCodes ?? []),
        ]),
        createdByAuthority: ACCESS_GRANT_SERVICE_NAME,
      }) as AccessGrantRecord;
      await repository.saveScopeEnvelope(scopeEnvelope);
      await repository.saveGrant(grant);
      return { grant, scopeEnvelope, materializedToken: opaqueToken, replayed: false };
    },

    async redeemGrant(input) {
      const observedAt = input.observedAt ?? nowIso();
      const sameLineageRecoveryAvailable = input.sameLineageRecoveryAvailable ?? true;
      const replayByIdempotency = await repository.getRedemptionByIdempotencyKey(
        input.redemptionIdempotencyKey,
      );
      if (replayByIdempotency) {
        const grant = replayByIdempotency.grantRef
          ? await repository.getGrantByRef(replayByIdempotency.grantRef)
          : null;
        const scopeEnvelope = replayByIdempotency.scopeEnvelopeRef
          ? await repository.getScopeEnvelope(replayByIdempotency.scopeEnvelopeRef)
          : null;
        return {
          redemption: freezeRecord({
            ...replayByIdempotency,
            reasonCodes: unique([...replayByIdempotency.reasonCodes, "ACCESS_181_REPLAY_RETURNED"]),
          }) as AccessGrantRedemptionRecord,
          grant,
          scopeEnvelope,
          scopeAuthorization: null,
          supersession: null,
          replayed: true,
        };
      }

      const tokenHash = hashToken(input.presentedToken);
      const replayByToken = await repository.getRedemptionByTokenHash(tokenHash);
      if (replayByToken) {
        const grant = replayByToken.grantRef
          ? await repository.getGrantByRef(replayByToken.grantRef)
          : null;
        const scopeEnvelope = replayByToken.scopeEnvelopeRef
          ? await repository.getScopeEnvelope(replayByToken.scopeEnvelopeRef)
          : null;
        return {
          redemption: freezeRecord({
            ...replayByToken,
            reasonCodes: unique([...replayByToken.reasonCodes, "ACCESS_181_REPLAY_RETURNED"]),
          }) as AccessGrantRedemptionRecord,
          grant,
          scopeEnvelope,
          scopeAuthorization: null,
          supersession: null,
          replayed: true,
        };
      }

      const grant = await repository.getGrantByTokenHash(tokenHash);
      if (!grant) {
        const redemption = terminalRedemption({
          redemptionIdempotencyKey: input.redemptionIdempotencyKey,
          tokenHash,
          grantRef: null,
          scopeEnvelopeRef: null,
          decision: "denied",
          routeTuple: input.routeTuple,
          authorization: null,
          recoveryRouteRef: null,
          sameLineageRecoveryAvailable: false,
          actorRef: input.actorRef,
          reasonCodes: ["ACCESS_181_GRANT_DENIED", "ACCESS_181_TOKEN_HASH_ONLY"],
          observedAt,
        });
        await repository.saveRedemption(redemption);
        return {
          redemption,
          grant: null,
          scopeEnvelope: null,
          scopeAuthorization: null,
          supersession: null,
          replayed: false,
        };
      }

      const scopeEnvelope = await repository.getScopeEnvelope(grant.scopeEnvelopeRef);
      if (!scopeEnvelope) {
        throw new Error(`Missing AccessGrantScopeEnvelope ${grant.scopeEnvelopeRef}`);
      }

      if (grant.grantState !== "live") {
        const redemption = terminalRedemption({
          redemptionIdempotencyKey: input.redemptionIdempotencyKey,
          tokenHash,
          grantRef: grant.grantRef,
          scopeEnvelopeRef: grant.scopeEnvelopeRef,
          decision: grant.grantState === "expired" ? "expired" : "superseded",
          routeTuple: input.routeTuple,
          authorization: null,
          recoveryRouteRef: scopeEnvelope.recoveryRouteRef,
          sameLineageRecoveryAvailable,
          actorRef: input.actorRef,
          reasonCodes: [
            grant.grantState === "expired"
              ? "ACCESS_181_GRANT_EXPIRED"
              : "ACCESS_181_GRANT_SUPERSESSION_SETTLED",
            "ACCESS_181_SAME_LINEAGE_RECOVERY",
          ],
          observedAt,
        });
        await repository.saveRedemption(redemption);
        return {
          redemption,
          grant,
          scopeEnvelope,
          scopeAuthorization: null,
          supersession: null,
          replayed: false,
        };
      }

      await repository.updateGrant(
        grantWith(grant, {
          grantState: "redeeming",
          reasonCodes: ["ACCESS_181_REDEMPTION_EXACT_ONCE"],
        }),
      );
      const authorization = await authorizeScopeEnvelope({
        scopeEnvelope,
        routeTuple: input.routeTuple,
        sameLineageRecoveryAvailable,
        idempotencyKey: `${input.redemptionIdempotencyKey}:scope`,
        observedAt,
      });

      let decision: AccessGrantRedemptionDecision = "redeemed";
      let finalState: AccessGrantState = "redeemed";
      let supersession: AccessGrantSupersessionRecord | null = null;
      const reasonCodes = [
        "ACCESS_181_REDEMPTION_EXACT_ONCE",
        ...authorization.authorization.reasonCodes,
      ];

      if (isExpired(grant.expiresAt, observedAt)) {
        decision = "expired";
        finalState = "expired";
        reasonCodes.push("ACCESS_181_GRANT_EXPIRED");
      } else if (authorization.authorization.authorizationState === "recover_only") {
        decision = "recover_only";
        finalState = "recover_only";
        reasonCodes.push("ACCESS_181_GRANT_RECOVER_ONLY", "ACCESS_181_SAME_LINEAGE_RECOVERY");
      } else if (authorization.authorization.authorizationState === "deny") {
        decision = "denied";
        finalState = "revoked";
        reasonCodes.push("ACCESS_181_GRANT_DENIED");
      } else {
        reasonCodes.push("ACCESS_181_GRANT_REDEEMED");
      }

      const redemption = terminalRedemption({
        redemptionIdempotencyKey: input.redemptionIdempotencyKey,
        tokenHash,
        grantRef: grant.grantRef,
        scopeEnvelopeRef: grant.scopeEnvelopeRef,
        decision,
        routeTuple: input.routeTuple,
        authorization: authorization.authorization,
        recoveryRouteRef:
          decision === "recover_only" || decision === "expired"
            ? scopeEnvelope.recoveryRouteRef
            : null,
        sameLineageRecoveryAvailable,
        actorRef: input.actorRef,
        reasonCodes,
        observedAt,
      });
      await repository.saveRedemption(redemption);
      const finalGrant = grantWith(grant, {
        grantState: finalState,
        currentRedemptionRef: redemption.redemptionRef,
        reasonCodes,
      });
      await repository.updateGrant(finalGrant);

      if (decision !== "redeemed") {
        const supersessionResult = await supersedeGrant({
          supersessionIdempotencyKey: `${input.redemptionIdempotencyKey}:supersession`,
          predecessorGrantRef: grant.grantRef,
          causeClass:
            decision === "expired"
              ? "expiry_sweep"
              : authorization.authorization.authorizationState === "recover_only"
                ? "scope_drift"
                : "manual_revoke",
          routeIntentBindingRef: scopeEnvelope.routeIntentBindingRef,
          sessionEpochRef: input.routeTuple.sessionEpochRef ?? null,
          subjectBindingVersionRef: input.routeTuple.subjectBindingVersionRef ?? null,
          lineageFenceRef: input.routeTuple.lineageFenceRef ?? null,
          supersessionState: finalState as Exclude<AccessGrantState, "live" | "redeeming">,
          actorRef: input.actorRef,
          reasonCodes,
          observedAt,
        });
        supersession = supersessionResult.supersession;
      }

      return {
        redemption,
        grant: await repository.getGrantByRef(grant.grantRef),
        scopeEnvelope,
        scopeAuthorization: authorization.authorization,
        supersession,
        replayed: false,
      };
    },

    async supersedeGrant(input) {
      return supersedeGrant(input);
    },

    async replaceGrant(input) {
      const replacement = await this.issueGrant({
        ...input.issue,
        predecessorGrantRef: input.predecessorGrantRef,
      });
      const supersession = await supersedeGrant({
        supersessionIdempotencyKey: input.supersessionIdempotencyKey,
        predecessorGrantRef: input.predecessorGrantRef,
        successorGrantRef: replacement.grant.grantRef,
        causeClass: input.causeClass,
        actorRef: input.actorRef,
        observedAt: input.observedAt,
        reasonCodes: ["ACCESS_181_REPLACEMENT_GRANT_SUPERSEDES_PREDECESSOR"],
      });
      return {
        replacement,
        supersession: supersession.supersession,
        replayed: replacement.replayed || supersession.replayed,
      };
    },

    async revokeGrant(input) {
      return supersedeGrant({ ...input, causeClass: "manual_revoke" });
    },

    async redeemClaim(input) {
      const observedAt = input.observedAt ?? nowIso();
      const tokenHash = hashToken(input.presentedToken);
      const replayByIdempotency = await repository.getClaimSettlementByIdempotencyKey(
        input.claimIdempotencyKey,
      );
      if (replayByIdempotency) {
        return replayClaimResult(replayByIdempotency);
      }
      const replayByToken = await repository.getClaimSettlementByTokenHash(tokenHash);
      if (replayByToken) {
        return replayClaimResult(replayByToken);
      }

      const invalidSession =
        input.session.sessionState !== "active" ||
        input.session.sessionEpochRef !== input.sessionEstablishmentDecision.sessionEpochRef ||
        input.session.sessionEpochRef !== (input.routeTuple.sessionEpochRef ?? null);
      if (invalidSession) {
        const settlement = await settleClaim({
          claimInput: input,
          decision: "denied",
          tokenHash,
          grantRedemptionRef: null,
          bindingAuthoritySettlementRef: null,
          bindingVersionRef: null,
          rotatedSessionEpochRef: null,
          supersessionRefs: [],
          recoveryRouteRef: "recovery://claim",
          reasonCodes: ["ACCESS_181_GRANT_DENIED"],
          observedAt,
        });
        return {
          settlement,
          redemption: null,
          bindingAuthoritySettlementRef: null,
          rotatedSessionEpochRef: null,
          supersessions: Object.freeze([]),
          replayed: false,
        };
      }

      if (
        input.sessionEstablishmentDecision.writableAuthorityState !== "claim_pending" &&
        input.sessionEstablishmentDecision.writableAuthorityState !== "writable"
      ) {
        const settlement = await settleClaim({
          claimInput: input,
          decision: "denied",
          tokenHash,
          grantRedemptionRef: null,
          bindingAuthoritySettlementRef: null,
          bindingVersionRef: null,
          rotatedSessionEpochRef: null,
          supersessionRefs: [],
          recoveryRouteRef: "recovery://claim",
          reasonCodes: ["ACCESS_181_CLAIM_SESSION_ACTIVE", "ACCESS_181_GRANT_DENIED"],
          observedAt,
        });
        return {
          settlement,
          redemption: null,
          bindingAuthoritySettlementRef: null,
          rotatedSessionEpochRef: null,
          supersessions: Object.freeze([]),
          replayed: false,
        };
      }

      const routeIntentCurrent =
        input.routeIntentBinding.bindingState === "live" &&
        input.routeIntentBinding.routeFamily === input.routeTuple.routeFamily &&
        input.routeIntentBinding.actionScope === "claim" &&
        input.routeTuple.actionScope === "claim" &&
        input.routeIntentBinding.governingObjectRef ===
          (input.routeTuple.governingObjectRef ?? null) &&
        input.routeIntentBinding.sessionEpochRef === (input.routeTuple.sessionEpochRef ?? null) &&
        input.routeIntentBinding.subjectBindingVersionRef ===
          (input.routeTuple.subjectBindingVersionRef ?? null) &&
        input.routeIntentBinding.lineageFenceRef === (input.routeTuple.lineageFenceRef ?? null);
      if (!routeIntentCurrent) {
        const settlement = await settleClaim({
          claimInput: input,
          decision: "recover_only",
          tokenHash,
          grantRedemptionRef: null,
          bindingAuthoritySettlementRef: null,
          bindingVersionRef: null,
          rotatedSessionEpochRef: null,
          supersessionRefs: [],
          recoveryRouteRef: "recovery://claim",
          reasonCodes: [
            "ACCESS_181_CLAIM_SESSION_ACTIVE",
            "ACCESS_181_CLAIM_SESSION_WRITABLE_AUTHORITY_ACCEPTED",
            "ACCESS_181_SCOPE_DRIFT_RECOVER_ONLY",
            "ACCESS_181_SAME_LINEAGE_RECOVERY",
          ],
          observedAt,
        });
        return {
          settlement,
          redemption: null,
          bindingAuthoritySettlementRef: null,
          rotatedSessionEpochRef: null,
          supersessions: Object.freeze([]),
          replayed: false,
        };
      }

      if (input.capabilityDecision.decisionState !== "allow") {
        const decision =
          input.capabilityDecision.decisionState === "step_up_required"
            ? "step_up_required"
            : input.capabilityDecision.decisionState === "recover_only"
              ? "recover_only"
              : "denied";
        const settlement = await settleClaim({
          claimInput: input,
          decision,
          tokenHash,
          grantRedemptionRef: null,
          bindingAuthoritySettlementRef: null,
          bindingVersionRef: null,
          rotatedSessionEpochRef: null,
          supersessionRefs: [],
          recoveryRouteRef: decision === "recover_only" ? "recovery://claim" : null,
          reasonCodes: [
            "ACCESS_181_CLAIM_SESSION_ACTIVE",
            "ACCESS_181_CLAIM_SESSION_WRITABLE_AUTHORITY_ACCEPTED",
            "ACCESS_181_CLAIM_ROUTE_INTENT_CURRENT",
            decision === "step_up_required"
              ? "ACCESS_181_CLAIM_STEP_UP_REQUIRED"
              : "ACCESS_181_GRANT_DENIED",
          ],
          observedAt,
        });
        return {
          settlement,
          redemption: null,
          bindingAuthoritySettlementRef: null,
          rotatedSessionEpochRef: null,
          supersessions: Object.freeze([]),
          replayed: false,
        };
      }

      const redemptionResult = await this.redeemGrant({
        redemptionIdempotencyKey: `${input.claimIdempotencyKey}:grant-redemption`,
        presentedToken: input.presentedToken,
        routeTuple: input.routeTuple,
        actorRef: input.session.subjectRef,
        sameLineageRecoveryAvailable: input.sameLineageRecoveryAvailable ?? true,
        observedAt,
      });
      const existingByRedemption = await repository.getClaimSettlementByGrantRedemptionRef(
        redemptionResult.redemption.redemptionRef,
      );
      if (existingByRedemption) {
        return replayClaimResult(existingByRedemption);
      }

      if (redemptionResult.redemption.decision !== "redeemed") {
        const claimDecision =
          redemptionResult.redemption.decision === "recover_only" ? "recover_only" : "denied";
        const settlement = await settleClaim({
          claimInput: input,
          decision: claimDecision,
          tokenHash,
          grantRedemptionRef: redemptionResult.redemption.redemptionRef,
          bindingAuthoritySettlementRef: null,
          bindingVersionRef: null,
          rotatedSessionEpochRef: null,
          supersessionRefs: redemptionResult.supersession
            ? [redemptionResult.supersession.supersessionRef]
            : [],
          recoveryRouteRef: redemptionResult.redemption.recoveryRouteRef,
          reasonCodes: [
            "ACCESS_181_CLAIM_SESSION_ACTIVE",
            "ACCESS_181_CLAIM_SESSION_WRITABLE_AUTHORITY_ACCEPTED",
            "ACCESS_181_CLAIM_ROUTE_INTENT_CURRENT",
            "ACCESS_181_CLAIM_CAPABILITY_ALLOW",
            ...redemptionResult.redemption.reasonCodes,
          ],
          observedAt,
        });
        return {
          settlement,
          redemption: redemptionResult.redemption,
          bindingAuthoritySettlementRef: null,
          rotatedSessionEpochRef: null,
          supersessions: redemptionResult.supersession
            ? Object.freeze([redemptionResult.supersession])
            : Object.freeze([]),
          replayed: false,
        };
      }

      const verifiedEnough =
        input.identityPosture.completedStepUpRef !== null ||
        input.identityPosture.verificationLevel === "nhs_p9" ||
        input.identityPosture.verificationLevel === "nhs_p5_plus";
      if (!verifiedEnough) {
        const settlement = await settleClaim({
          claimInput: input,
          decision: "step_up_required",
          tokenHash,
          grantRedemptionRef: redemptionResult.redemption.redemptionRef,
          bindingAuthoritySettlementRef: null,
          bindingVersionRef: null,
          rotatedSessionEpochRef: null,
          supersessionRefs: [],
          recoveryRouteRef: "step-up://claim-nhs-p9",
          reasonCodes: [
            "ACCESS_181_CLAIM_SESSION_ACTIVE",
            "ACCESS_181_CLAIM_SESSION_WRITABLE_AUTHORITY_ACCEPTED",
            "ACCESS_181_CLAIM_ROUTE_INTENT_CURRENT",
            "ACCESS_181_CLAIM_CAPABILITY_ALLOW",
            "ACCESS_181_CLAIM_STEP_UP_REQUIRED",
          ],
          observedAt,
        });
        return {
          settlement,
          redemption: redemptionResult.redemption,
          bindingAuthoritySettlementRef: null,
          rotatedSessionEpochRef: null,
          supersessions: Object.freeze([]),
          replayed: false,
        };
      }

      if (
        input.targetAlreadyClaimedBySubjectRef &&
        input.targetAlreadyClaimedBySubjectRef !== input.session.subjectRef
      ) {
        const settlement = await settleClaim({
          claimInput: input,
          decision: "denied",
          tokenHash,
          grantRedemptionRef: redemptionResult.redemption.redemptionRef,
          bindingAuthoritySettlementRef: null,
          bindingVersionRef: null,
          rotatedSessionEpochRef: null,
          supersessionRefs: [],
          recoveryRouteRef: "support://identity-repair",
          reasonCodes: [
            "ACCESS_181_CLAIM_SESSION_ACTIVE",
            "ACCESS_181_CLAIM_SESSION_WRITABLE_AUTHORITY_ACCEPTED",
            "ACCESS_181_CLAIM_ROUTE_INTENT_CURRENT",
            "ACCESS_181_CLAIM_CAPABILITY_ALLOW",
            "ACCESS_181_GRANT_DENIED",
          ],
          observedAt,
        });
        return {
          settlement,
          redemption: redemptionResult.redemption,
          bindingAuthoritySettlementRef: null,
          rotatedSessionEpochRef: null,
          supersessions: Object.freeze([]),
          replayed: false,
        };
      }

      const binding = await identityBindingAuthority.settleClaimConfirmed({
        commandId: hashRef("claim_binding_command", {
          publicId: input.publicId,
          claimIdempotencyKey: input.claimIdempotencyKey,
        }),
        idempotencyKey: `${input.claimIdempotencyKey}:identity-binding-authority`,
        subjectRef: input.bindingAuthority.subjectRef,
        expectedCurrentBindingVersionRef: input.bindingAuthority.expectedCurrentBindingVersionRef,
        patientLinkDecisionRef: input.bindingAuthority.patientLinkDecisionRef,
        targetPatientRef: input.bindingAuthority.targetPatientRef,
        routeIntentBindingRef: input.routeIntentBinding.routeIntentBindingRef,
        confidence: input.bindingAuthority.confidence,
        provenanceRefs: [
          ...input.bindingAuthority.provenanceRefs,
          redemptionResult.redemption.redemptionRef,
        ],
        derivedLineageRefs: input.bindingAuthority.derivedLineageRefs,
        actorRef: input.bindingAuthority.actorRef,
        observedAt,
      });
      if (binding.decision !== "accepted" && binding.decision !== "replayed") {
        const settlement = await settleClaim({
          claimInput: input,
          decision: "denied",
          tokenHash,
          grantRedemptionRef: redemptionResult.redemption.redemptionRef,
          bindingAuthoritySettlementRef: binding.settlementRef,
          bindingVersionRef: binding.bindingVersionRef,
          rotatedSessionEpochRef: null,
          supersessionRefs: [],
          recoveryRouteRef: "support://identity-repair",
          reasonCodes: [
            "ACCESS_181_CLAIM_CAPABILITY_ALLOW",
            "ACCESS_181_GRANT_DENIED",
            ...binding.reasonCodes,
          ],
          observedAt,
        });
        return {
          settlement,
          redemption: redemptionResult.redemption,
          bindingAuthoritySettlementRef: binding.settlementRef,
          rotatedSessionEpochRef: null,
          supersessions: Object.freeze([]),
          replayed: false,
        };
      }

      const supersessions: AccessGrantSupersessionRecord[] = [];
      const claimSupersession = await supersedeGrant({
        supersessionIdempotencyKey: `${input.claimIdempotencyKey}:claim-grant-supersession`,
        predecessorGrantRef: redemptionResult.redemption.grantRef ?? "",
        causeClass: "claim_completed",
        routeIntentBindingRef: input.routeIntentBinding.routeIntentBindingRef,
        sessionEpochRef: input.session.sessionEpochRef,
        subjectBindingVersionRef: binding.bindingVersionRef,
        lineageFenceRef: input.routeIntentBinding.lineageFenceRef,
        supersessionState: "superseded",
        actorRef: input.session.subjectRef,
        reasonCodes: [
          "ACCESS_181_BINDING_AUTHORITY_CLAIM_CONFIRMED",
          "ACCESS_181_PUBLIC_GRANTS_SUPERSEDED_AFTER_CLAIM",
        ],
        observedAt,
      });
      supersessions.push(claimSupersession.supersession);
      for (const staleGrantRef of input.stalePublicGrantRefs ?? []) {
        const staleSupersession = await supersedeGrant({
          supersessionIdempotencyKey: `${input.claimIdempotencyKey}:stale-public:${staleGrantRef}`,
          predecessorGrantRef: staleGrantRef,
          causeClass: "claim_completed",
          routeIntentBindingRef: input.routeIntentBinding.routeIntentBindingRef,
          sessionEpochRef: input.session.sessionEpochRef,
          subjectBindingVersionRef: binding.bindingVersionRef,
          lineageFenceRef: input.routeIntentBinding.lineageFenceRef,
          supersessionState: "superseded",
          actorRef: input.session.subjectRef,
          reasonCodes: ["ACCESS_181_PUBLIC_GRANTS_SUPERSEDED_AFTER_CLAIM"],
          observedAt,
        });
        supersessions.push(staleSupersession.supersession);
      }

      const rotationNeeded =
        input.session.subjectBindingVersionRef !== binding.bindingVersionRef ||
        input.sessionEstablishmentDecision.writableAuthorityState !== "writable";
      const rotation = rotationNeeded
        ? await sessionGovernor.rotateAfterClaim({
            sessionRef: input.session.sessionRef,
            currentSessionEpochRef: input.session.sessionEpochRef,
            subjectRef: input.session.subjectRef,
            previousBindingVersionRef: input.session.subjectBindingVersionRef,
            nextBindingVersionRef: binding.bindingVersionRef,
            routeIntentBindingRef: input.routeIntentBinding.routeIntentBindingRef,
            reasonCodes: ["ACCESS_181_BINDING_AUTHORITY_CLAIM_CONFIRMED"],
            observedAt,
          })
        : null;

      const settlement = await settleClaim({
        claimInput: input,
        decision: "claim_confirmed",
        tokenHash,
        grantRedemptionRef: redemptionResult.redemption.redemptionRef,
        bindingAuthoritySettlementRef: binding.settlementRef,
        bindingVersionRef: binding.bindingVersionRef,
        rotatedSessionEpochRef: rotation?.rotatedSessionEpochRef ?? null,
        supersessionRefs: supersessions.map((entry) => entry.supersessionRef),
        recoveryRouteRef: null,
        reasonCodes: [
          "ACCESS_181_CLAIM_SESSION_ACTIVE",
          "ACCESS_181_CLAIM_SESSION_WRITABLE_AUTHORITY_ACCEPTED",
          "ACCESS_181_CLAIM_ROUTE_INTENT_CURRENT",
          "ACCESS_181_CLAIM_CAPABILITY_ALLOW",
          "ACCESS_181_BINDING_AUTHORITY_CLAIM_CONFIRMED",
          "ACCESS_181_NO_DIRECT_PATIENT_REF_MUTATION",
          ...(rotation ? ["ACCESS_181_SESSION_ROTATED_AFTER_CLAIM"] : []),
          "ACCESS_181_PUBLIC_GRANTS_SUPERSEDED_AFTER_CLAIM",
        ],
        observedAt,
      });
      return {
        settlement,
        redemption: redemptionResult.redemption,
        bindingAuthoritySettlementRef: binding.settlementRef,
        rotatedSessionEpochRef: rotation?.rotatedSessionEpochRef ?? null,
        supersessions: Object.freeze(
          supersessions.map((entry) => freezeRecord(entry) as AccessGrantSupersessionRecord),
        ),
        replayed: false,
      };
    },
  };
}

export function createAccessGrantSupersessionApplication(options?: {
  readonly repository?: AccessGrantSupersessionRepository;
  readonly scopeAuthorizer?: ScopeEnvelopeAuthorizationPort;
  readonly identityBindingAuthority?: IdentityBindingAuthorityClaimPort;
  readonly sessionGovernor?: SessionGovernorRotationPort;
}): AccessGrantSupersessionApplication {
  const repository = options?.repository ?? createInMemoryAccessGrantSupersessionRepository();
  return Object.freeze({
    accessGrantService: createAccessGrantService({
      repository,
      scopeAuthorizer: options?.scopeAuthorizer,
      identityBindingAuthority: options?.identityBindingAuthority,
      sessionGovernor: options?.sessionGovernor,
    }),
    repository,
    migrationPlanRef: accessGrantSupersessionMigrationPlanRefs[0],
    migrationPlanRefs: accessGrantSupersessionMigrationPlanRefs,
    persistenceTables: accessGrantSupersessionPersistenceTables,
    parallelInterfaceGaps: accessGrantSupersessionParallelInterfaceGaps,
    policyVersion: ACCESS_GRANT_POLICY_VERSION,
  }) as AccessGrantSupersessionApplication;
}
