import { createHash } from "node:crypto";
import type { RouteRuntimeTuple } from "./capability-decision-engine";
import type {
  AccessGrantRecord,
  AccessGrantRedemptionRecord,
  AccessGrantScopeEnvelopeRecord,
  AccessGrantService,
  AccessGrantSupersessionRecord,
  IssueAccessGrantInput,
  IssueAccessGrantResult,
  RedeemAccessGrantResult,
} from "./access-grant-supersession";
import { createAccessGrantSupersessionApplication } from "./access-grant-supersession";
import type { TelephonyEvidenceReadinessAssessment } from "./telephony-readiness-pipeline";

export const TELEPHONY_CONTINUATION_SERVICE_NAME = "TelephonyContinuationGrantService";
export const TELEPHONY_CONTINUATION_SCHEMA_VERSION = "192.phase2.telephony-continuation.v1";
export const TELEPHONY_CONTINUATION_POLICY_VERSION = "phase2-telephony-continuation-grants-192.v1";
export const TELEPHONY_CONTINUATION_LIFETIME_POLICY_VERSION =
  "phase2-telephony-continuation-lifetime-resend-192.v1";
export const TELEPHONY_CONTINUATION_DOWNGRADE_POLICY_VERSION =
  "phase2-telephony-continuation-downgrade-192.v1";
export const TELEPHONY_CONTINUATION_RECOVERY_POLICY_VERSION =
  "phase2-telephony-continuation-recovery-192.v1";
export const TELEPHONY_CONTINUATION_MESSAGE_POLICY_VERSION =
  "phase2-telephony-continuation-message-mask-192.v1";

export const telephonyContinuationPersistenceTables = [
  "phase2_telephony_continuation_eligibilities",
  "phase2_telephony_continuation_contexts",
  "phase2_telephony_continuation_dispatch_intents",
  "phase2_telephony_continuation_message_manifests",
  "phase2_telephony_continuation_redemption_outcomes",
  "phase2_recovery_continuation_envelopes",
  "phase2_secure_link_session_projections",
] as const;

export const telephonyContinuationMigrationPlanRefs = [
  "services/command-api/migrations/107_phase2_telephony_continuation_grants.sql",
] as const;

export const telephonyContinuationGapResolutions = [
  "GAP_RESOLVED_PHASE2_TELEPHONY_CONTINUATION_GRANT_LIFETIME_AND_RESEND_POLICY",
  "GAP_RESOLVED_PHASE2_TELEPHONY_CONTINUATION_SEEDED_TO_CHALLENGE_DOWNGRADE",
  "GAP_RESOLVED_PHASE2_TELEPHONY_CONTINUATION_INTERRUPTED_RECOVERY",
  "GAP_RESOLVED_PHASE2_TELEPHONY_CONTINUATION_REDEEMED_AFTER_PROMOTION_OR_URGENT_DIVERSION",
  "GAP_RESOLVED_PHASE2_TELEPHONY_CONTINUATION_MESSAGE_MANIFEST_MASKING",
] as const;

export const telephonyContinuationLifetimePolicy = Object.freeze({
  policyVersion: TELEPHONY_CONTINUATION_LIFETIME_POLICY_VERSION,
  defaultGrantTtlMinutes: 20,
  maxResendsPerCallSession: 2,
  resendSupersessionCause: "secure_link_reissue",
  expiryRecoveryWindowMinutes: 1440,
  replayRule:
    "duplicate_redemption_returns_access_grant_redemption_record_and_existing_continuation_outcome",
});

export const telephonyContinuationReasonCatalog = Object.freeze([
  "TEL_CONT_192_SETTLED_POSTURE_REQUIRED",
  "TEL_CONT_192_EVIDENCE_READINESS_ALLOWS_CONTINUATION",
  "TEL_CONT_192_MANUAL_ONLY_NO_REDEEMABLE_GRANT",
  "TEL_CONT_192_URGENT_LIVE_MANUAL_ONLY",
  "TEL_CONT_192_MANUAL_REVIEW_MANUAL_ONLY",
  "TEL_CONT_192_UNUSABLE_TERMINAL_MANUAL_ONLY",
  "TEL_CONT_192_NOT_ELIGIBLE_MANUAL_ONLY",
  "TEL_CONT_192_SEEDED_GRANTED_BY_SETTLED_ELIGIBILITY",
  "TEL_CONT_192_CHALLENGE_GRANTED_WITH_NO_SEEDED_DISCLOSURE",
  "TEL_CONT_192_DOWNGRADE_SEEDED_TO_CHALLENGE",
  "TEL_CONT_192_DESTINATION_NOT_VERIFIED_FOR_SEEDED",
  "TEL_CONT_192_HIGH_ASSURANCE_BINDING_REQUIRED_FOR_SEEDED",
  "TEL_CONT_192_SCOPE_FENCE_REQUIRED_FOR_SEEDED",
  "TEL_CONT_192_RELEASE_OR_CHANNEL_POSTURE_NARROWED",
  "TEL_CONT_192_ACCESS_GRANT_SERVICE_CANONICAL",
  "TEL_CONT_192_DISPATCH_DOES_NOT_DECIDE_GRANT_FAMILY",
  "TEL_CONT_192_MESSAGE_MANIFEST_MASKED_NO_PHI",
  "TEL_CONT_192_EXACT_ONCE_REDEMPTION",
  "TEL_CONT_192_REPLAY_RETURNED",
  "TEL_CONT_192_SECURE_LINK_SESSION_ROTATED",
  "TEL_CONT_192_CSRF_SECRET_ROTATED",
  "TEL_CONT_192_URL_GRANT_REUSE_BLOCKED",
  "TEL_CONT_192_RECOVERY_TOKEN_SAME_SHELL",
  "TEL_CONT_192_STEP_UP_INTERRUPTED_RECOVERY",
  "TEL_CONT_192_STALE_LINK_RECOVERY",
  "TEL_CONT_192_SUPERSEDED_LINK_RECOVERY",
  "TEL_CONT_192_RESEND_SUPERSEDES_PRIOR_LINK",
] as const);

export type TelephonyContinuationGrantFamily =
  | "continuation_seeded_verified"
  | "continuation_challenge"
  | "manual_only";
export type TelephonyContinuationEligibilityState =
  | "not_eligible"
  | "eligible_seeded"
  | "eligible_challenge"
  | "manual_only";
export type TelephonyContinuationLineageScope =
  | "same_submission_envelope"
  | "same_request_lineage"
  | "none";
export type TelephonyContinuationContextState =
  | "pending"
  | "grant_issued"
  | "no_grant_manual_only"
  | "consumed"
  | "superseded"
  | "expired";
export type TelephonyContinuationCapabilityCeiling =
  | "minimal_detail_entry"
  | "challenge_before_disclosure"
  | "manual_only_no_disclosure";
export type TelephonyContinuationRedemptionState =
  | "session_established"
  | "replay_returned"
  | "step_up_interrupted"
  | "stale_link_recovery"
  | "superseded_recovery"
  | "denied";

export interface TelephonyVerificationDecisionSnapshot {
  readonly telephonyVerificationDecisionRef: string;
  readonly identityConfidenceAssessmentRef: string | null;
  readonly destinationConfidenceAssessmentRef: string | null;
  readonly bestCandidateRef: string | null;
  readonly nextAllowedContinuationPosture:
    | "seeded_continuation_candidate"
    | "challenge_continuation_only"
    | "manual_followup_only"
    | "no_continuation";
  readonly reasonCodes: readonly string[];
}

export interface ContinuationDestinationPosture {
  readonly destinationConfidenceRef: string | null;
  readonly destinationHash: string | null;
  readonly maskedDestination: string | null;
  readonly verifiedForPatient: boolean;
  readonly intendedPatientRef: string | null;
  readonly channelControlProofRef: string | null;
}

export interface ContinuationAuthorityBindingPosture {
  readonly boundSubjectRef: string | null;
  readonly boundIdentityBindingRef: string | null;
  readonly boundSessionEpoch: string | null;
  readonly boundSubjectBindingVersion: string | null;
  readonly boundPatientRef: string | null;
  readonly bindingState: "none" | "candidate" | "high_assurance" | "repair_hold" | "revoked";
  readonly current: boolean;
}

export interface ContinuationRouteAndLineageFence {
  readonly routeFamilyRef: string;
  readonly actionScope: "secure_resume" | "envelope_resume" | "contact_route_repair";
  readonly requestSeedRef: string;
  readonly governingObjectVersionRef: string;
  readonly routeIntentBindingRef: string;
  readonly lineageFenceRef: string;
  readonly manifestVersionRef: string;
  readonly releaseApprovalFreezeRef: string;
  readonly minimumBridgeCapabilitiesRef: string;
  readonly channelReleaseFreezeState: "live" | "constrained" | "frozen" | "blocked";
  readonly requiredAudienceSurfaceRuntimeBindingRef: string | null;
  readonly sameLineageRecoveryRouteRef: string;
  readonly patientShellContinuityKey: string;
  readonly patientNavReturnContractRef: string;
  readonly patientShellConsistencyRef: string;
}

export interface TelephonyContinuationEligibility {
  readonly telephonyContinuationEligibilityRef: string;
  readonly decisionIdempotencyKey: string;
  readonly schemaVersion: typeof TELEPHONY_CONTINUATION_SCHEMA_VERSION;
  readonly policyVersion: typeof TELEPHONY_CONTINUATION_POLICY_VERSION;
  readonly callSessionRef: string;
  readonly evidenceReadinessAssessmentRef: string;
  readonly identityConfidenceRef: string | null;
  readonly destinationConfidenceRef: string | null;
  readonly verificationDecisionRef: string | null;
  readonly grantFamilyRecommendation: TelephonyContinuationGrantFamily;
  readonly lineageScope: TelephonyContinuationLineageScope;
  readonly eligibilityState: TelephonyContinuationEligibilityState;
  readonly routeFamilyRef: string | null;
  readonly actionScope: "secure_resume" | "envelope_resume" | "contact_route_repair" | null;
  readonly requestSeedRef: string | null;
  readonly downgradeReasonCodes: readonly string[];
  readonly reasonCodes: readonly string[];
  readonly evaluatedAt: string;
  readonly recordedBy: typeof TELEPHONY_CONTINUATION_SERVICE_NAME;
}

export interface TelephonyContinuationContext {
  readonly continuationContextRef: string;
  readonly issuanceIdempotencyKey: string;
  readonly schemaVersion: typeof TELEPHONY_CONTINUATION_SCHEMA_VERSION;
  readonly policyVersion: typeof TELEPHONY_CONTINUATION_POLICY_VERSION;
  readonly callSessionRef: string;
  readonly contextState: TelephonyContinuationContextState;
  readonly targetChannel: "sms" | "support_callback" | "none";
  readonly phoneNumberHash: string | null;
  readonly requestedGrantFamily: TelephonyContinuationGrantFamily;
  readonly capabilityCeiling: TelephonyContinuationCapabilityCeiling;
  readonly currentReadinessVerdict: {
    readonly usabilityState: TelephonyEvidenceReadinessAssessment["usabilityState"];
    readonly promotionReadiness: TelephonyEvidenceReadinessAssessment["promotionReadiness"];
  };
  readonly evidenceReadinessAssessmentRef: string;
  readonly continuationEligibilityRef: string;
  readonly lineageScope: TelephonyContinuationLineageScope;
  readonly requestSeedRef: string | null;
  readonly routeFamilyRef: string | null;
  readonly actionScope:
    | "secure_resume"
    | "envelope_resume"
    | "contact_route_repair"
    | "manual_followup";
  readonly authoritySettledBindingFence: {
    readonly boundSubjectRef: string | null;
    readonly boundIdentityBindingRef: string | null;
    readonly boundSessionEpoch: string | null;
    readonly boundSubjectBindingVersion: string | null;
    readonly lineageFenceRef: string | null;
  };
  readonly manifestVersionRef: string | null;
  readonly releaseApprovalFreezeRef: string | null;
  readonly minimumBridgeCapabilitiesRef: string | null;
  readonly channelReleaseFreezeState: "live" | "constrained" | "frozen" | "blocked" | "none";
  readonly grantFenceState:
    | "not_applicable"
    | "pending_access_grant_service"
    | "grant_issued"
    | "consumed"
    | "superseded"
    | "blocked";
  readonly accessGrantRef: string | null;
  readonly scopeEnvelopeRef: string | null;
  readonly supersedesContextRef: string | null;
  readonly reasonCodes: readonly string[];
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly resolvedAt: string | null;
  readonly recordedBy: typeof TELEPHONY_CONTINUATION_SERVICE_NAME;
}

export interface ContinuationMessageManifest {
  readonly messageManifestRef: string;
  readonly schemaVersion: typeof TELEPHONY_CONTINUATION_SCHEMA_VERSION;
  readonly policyVersion: typeof TELEPHONY_CONTINUATION_MESSAGE_POLICY_VERSION;
  readonly continuationContextRef: string;
  readonly grantFamily: Exclude<TelephonyContinuationGrantFamily, "manual_only">;
  readonly templateRef: string;
  readonly bodyCopyCode: string;
  readonly bodyPreview: string;
  readonly containsPhi: false;
  readonly includesSignedUrl: false;
  readonly linkPlaceholderRef: string;
  readonly reasonCodes: readonly string[];
  readonly createdAt: string;
  readonly recordedBy: typeof TELEPHONY_CONTINUATION_SERVICE_NAME;
}

export interface ContinuationDispatchIntent {
  readonly dispatchIntentRef: string;
  readonly dispatchIdempotencyKey: string;
  readonly schemaVersion: typeof TELEPHONY_CONTINUATION_SCHEMA_VERSION;
  readonly policyVersion: typeof TELEPHONY_CONTINUATION_POLICY_VERSION;
  readonly callSessionRef: string;
  readonly continuationContextRef: string;
  readonly accessGrantRef: string | null;
  readonly messageManifestRef: string | null;
  readonly grantFamily: TelephonyContinuationGrantFamily;
  readonly dispatchOutcome: "queued" | "no_redeemable_grant" | "manual_followup";
  readonly targetChannel: "sms" | "support_callback" | "none";
  readonly destinationHash: string | null;
  readonly maskedDestination: string | null;
  readonly noPhiBody: true;
  readonly signedUrlMaterializedInManifest: false;
  readonly providerDeliveryRef: string | null;
  readonly reasonCodes: readonly string[];
  readonly createdAt: string;
  readonly recordedBy: typeof TELEPHONY_CONTINUATION_SERVICE_NAME;
}

export interface RecoveryContinuationEnvelope {
  readonly recoveryContinuationRef: string;
  readonly schemaVersion: typeof TELEPHONY_CONTINUATION_SCHEMA_VERSION;
  readonly policyVersion: typeof TELEPHONY_CONTINUATION_RECOVERY_POLICY_VERSION;
  readonly continuationContextRef: string;
  readonly callSessionRef: string;
  readonly lineageScope: TelephonyContinuationLineageScope;
  readonly routeFamilyRef: string | null;
  readonly routeIntentRef: string | null;
  readonly resumeObjectRef: string | null;
  readonly requestSeedRef: string | null;
  readonly returnContractRef: string;
  readonly patientShellConsistencyRef: string;
  readonly shellContinuityKey: string;
  readonly selectedMobileStep:
    | "identity_challenge"
    | "contact_route_repair"
    | "stale_link_recovery";
  readonly patientActionRecoveryEnvelopeRef: string | null;
  readonly sameShellRequired: true;
  readonly recoveryReasonCode: string;
  readonly recoveryTupleHash: string;
  readonly reasonCodes: readonly string[];
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly recordedBy: typeof TELEPHONY_CONTINUATION_SERVICE_NAME;
}

export interface SecureLinkSessionProjection {
  readonly projectionRef: string;
  readonly schemaVersion: typeof TELEPHONY_CONTINUATION_SCHEMA_VERSION;
  readonly continuationContextRef: string;
  readonly accessGrantRef: string;
  readonly grantRedemptionRef: string;
  readonly secureLinkSessionRef: string;
  readonly sessionEpochRef: string;
  readonly csrfSecretRef: string;
  readonly routeIntentBindingRef: string | null;
  readonly disclosurePosture: "seeded_verified" | "challenge_minimal" | "recovery_only";
  readonly patientDataDisclosureAllowed: boolean;
  readonly urlGrantReusable: false;
  readonly reasonCodes: readonly string[];
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly recordedBy: typeof TELEPHONY_CONTINUATION_SERVICE_NAME;
}

export interface ContinuationRedemptionOutcome {
  readonly continuationRedemptionOutcomeRef: string;
  readonly redemptionIdempotencyKey: string;
  readonly schemaVersion: typeof TELEPHONY_CONTINUATION_SCHEMA_VERSION;
  readonly policyVersion: typeof TELEPHONY_CONTINUATION_POLICY_VERSION;
  readonly callSessionRef: string;
  readonly continuationContextRef: string | null;
  readonly accessGrantRef: string | null;
  readonly grantRedemptionRef: string | null;
  readonly redemptionState: TelephonyContinuationRedemptionState;
  readonly replayed: boolean;
  readonly secureLinkSessionRef: string | null;
  readonly secureLinkSessionProjectionRef: string | null;
  readonly recoveryContinuationRef: string | null;
  readonly routeIntentBindingRef: string | null;
  readonly csrfSecretRef: string | null;
  readonly grantTokenReuseBlocked: true;
  readonly reasonCodes: readonly string[];
  readonly redeemedAt: string;
  readonly recordedBy: typeof TELEPHONY_CONTINUATION_SERVICE_NAME;
}

export interface SettleContinuationEligibilityInput {
  readonly callSessionRef: string;
  readonly idempotencyKey: string;
  readonly evidenceReadinessAssessment: TelephonyEvidenceReadinessAssessment;
  readonly verificationDecision: TelephonyVerificationDecisionSnapshot | null;
  readonly destinationPosture: ContinuationDestinationPosture;
  readonly authorityBinding: ContinuationAuthorityBindingPosture;
  readonly routeFence: ContinuationRouteAndLineageFence;
  readonly observedAt?: string;
}

export interface IssueContinuationInput {
  readonly idempotencyKey: string;
  readonly eligibility: TelephonyContinuationEligibility;
  readonly evidenceReadinessAssessment: TelephonyEvidenceReadinessAssessment;
  readonly destinationPosture: ContinuationDestinationPosture;
  readonly authorityBinding: ContinuationAuthorityBindingPosture;
  readonly routeFence: ContinuationRouteAndLineageFence;
  readonly actorRef: string;
  readonly observedAt?: string;
  readonly expiresAt?: string;
}

export interface IssueContinuationResult {
  readonly eligibility: TelephonyContinuationEligibility;
  readonly context: TelephonyContinuationContext;
  readonly dispatchIntent: ContinuationDispatchIntent;
  readonly messageManifest: ContinuationMessageManifest | null;
  readonly grantIssue: IssueAccessGrantResult | null;
  readonly materializedToken: string | null;
  readonly replayed: boolean;
}

export interface RedeemContinuationInput {
  readonly redemptionIdempotencyKey: string;
  readonly presentedToken: string;
  readonly routeTuple: RouteRuntimeTuple;
  readonly actorRef: string;
  readonly sameLineageRecoveryAvailable?: boolean;
  readonly interruption?:
    | "none"
    | "step_up_required"
    | "nhs_login_uplift"
    | "contact_route_repair"
    | "subject_conflict"
    | "session_expiry";
  readonly observedAt?: string;
}

export interface RedeemContinuationResult {
  readonly outcome: ContinuationRedemptionOutcome;
  readonly grantRedemption: AccessGrantRedemptionRecord | null;
  readonly grant: AccessGrantRecord | null;
  readonly scopeEnvelope: AccessGrantScopeEnvelopeRecord | null;
  readonly supersession: AccessGrantSupersessionRecord | null;
  readonly secureLinkSession: SecureLinkSessionProjection | null;
  readonly recoveryContinuation: RecoveryContinuationEnvelope | null;
  readonly replayed: boolean;
}

export interface TelephonyContinuationRepositorySnapshots {
  readonly eligibilities: readonly TelephonyContinuationEligibility[];
  readonly contexts: readonly TelephonyContinuationContext[];
  readonly dispatchIntents: readonly ContinuationDispatchIntent[];
  readonly messageManifests: readonly ContinuationMessageManifest[];
  readonly redemptionOutcomes: readonly ContinuationRedemptionOutcome[];
  readonly recoveryContinuations: readonly RecoveryContinuationEnvelope[];
  readonly secureLinkSessions: readonly SecureLinkSessionProjection[];
}

export interface TelephonyContinuationRepository {
  getEligibilityByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<TelephonyContinuationEligibility | null>;
  saveEligibility(record: TelephonyContinuationEligibility): Promise<void>;
  getContextByIssuanceIdempotencyKey(
    idempotencyKey: string,
  ): Promise<TelephonyContinuationContext | null>;
  getContextByRef(contextRef: string): Promise<TelephonyContinuationContext | null>;
  getCurrentContextForCall(callSessionRef: string): Promise<TelephonyContinuationContext | null>;
  getContextByAccessGrantRef(grantRef: string): Promise<TelephonyContinuationContext | null>;
  saveContext(record: TelephonyContinuationContext): Promise<void>;
  getDispatchIntentByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<ContinuationDispatchIntent | null>;
  saveDispatchIntent(record: ContinuationDispatchIntent): Promise<void>;
  getMessageManifest(messageManifestRef: string): Promise<ContinuationMessageManifest | null>;
  saveMessageManifest(record: ContinuationMessageManifest): Promise<void>;
  getRedemptionOutcomeByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<ContinuationRedemptionOutcome | null>;
  getRedemptionOutcomeByGrantRedemptionRef(
    grantRedemptionRef: string,
  ): Promise<ContinuationRedemptionOutcome | null>;
  saveRedemptionOutcome(record: ContinuationRedemptionOutcome): Promise<void>;
  getRecoveryContinuation(ref: string): Promise<RecoveryContinuationEnvelope | null>;
  saveRecoveryContinuation(record: RecoveryContinuationEnvelope): Promise<void>;
  saveSecureLinkSessionProjection(record: SecureLinkSessionProjection): Promise<void>;
  snapshots(): TelephonyContinuationRepositorySnapshots;
}

export interface TelephonyContinuationGrantService {
  settleContinuationEligibility(
    input: SettleContinuationEligibilityInput,
  ): Promise<TelephonyContinuationEligibility>;
  issueContinuation(input: IssueContinuationInput): Promise<IssueContinuationResult>;
  redeemContinuation(input: RedeemContinuationInput): Promise<RedeemContinuationResult>;
  consumeRecoveryContinuation(input: {
    readonly recoveryContinuationRef: string;
    readonly observedAt?: string;
  }): Promise<{
    readonly recoveryContinuation: RecoveryContinuationEnvelope;
    readonly sameShellContinuityPreserved: true;
    readonly reasonCodes: readonly string[];
  }>;
}

export interface TelephonyContinuationApplication {
  readonly service: TelephonyContinuationGrantService;
  readonly repository: TelephonyContinuationRepository;
  readonly accessGrantService: AccessGrantService;
  readonly persistenceTables: typeof telephonyContinuationPersistenceTables;
  readonly migrationPlanRefs: typeof telephonyContinuationMigrationPlanRefs;
  readonly gapResolutions: typeof telephonyContinuationGapResolutions;
  readonly lifetimePolicy: typeof telephonyContinuationLifetimePolicy;
  readonly reasonCatalog: typeof telephonyContinuationReasonCatalog;
}

function nowIso(): string {
  return new Date().toISOString();
}

function addMinutesIso(baseIso: string, minutes: number): string {
  return new Date(Date.parse(baseIso) + minutes * 60_000).toISOString();
}

function stableJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((entry) => stableJson(entry)).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableJson(entry)}`)
    .join(",")}}`;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function deterministicId(prefix: string, value: unknown): string {
  return `${prefix}_${sha256(stableJson(value)).slice(0, 24)}`;
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

function readinessForcesManualOnly(
  assessment: TelephonyEvidenceReadinessAssessment,
): string | null {
  if (assessment.usabilityState === "urgent_live_only")
    return "TEL_CONT_192_URGENT_LIVE_MANUAL_ONLY";
  if (assessment.usabilityState === "manual_review_only") {
    return "TEL_CONT_192_MANUAL_REVIEW_MANUAL_ONLY";
  }
  if (assessment.usabilityState === "unusable_terminal") {
    return "TEL_CONT_192_UNUSABLE_TERMINAL_MANUAL_ONLY";
  }
  return null;
}

function readinessAllowsContinuation(assessment: TelephonyEvidenceReadinessAssessment): boolean {
  return (
    assessment.usabilityState === "safety_usable" ||
    assessment.promotionReadiness === "continuation_only" ||
    assessment.promotionReadiness === "ready_to_seed" ||
    assessment.promotionReadiness === "ready_to_promote"
  );
}

function routeFenceComplete(routeFence: ContinuationRouteAndLineageFence): boolean {
  return Boolean(
    routeFence.routeFamilyRef &&
      routeFence.actionScope &&
      routeFence.requestSeedRef &&
      routeFence.governingObjectVersionRef &&
      routeFence.routeIntentBindingRef &&
      routeFence.lineageFenceRef &&
      routeFence.manifestVersionRef &&
      routeFence.releaseApprovalFreezeRef &&
      routeFence.minimumBridgeCapabilitiesRef,
  );
}

function canSeed(input: SettleContinuationEligibilityInput): boolean {
  return (
    input.verificationDecision?.nextAllowedContinuationPosture ===
      "seeded_continuation_candidate" &&
    input.destinationPosture.verifiedForPatient &&
    input.authorityBinding.bindingState === "high_assurance" &&
    input.authorityBinding.current &&
    Boolean(input.authorityBinding.boundIdentityBindingRef) &&
    routeFenceComplete(input.routeFence) &&
    input.routeFence.channelReleaseFreezeState !== "blocked"
  );
}

function seededDowngradeReasons(input: SettleContinuationEligibilityInput): readonly string[] {
  const reasons: string[] = [];
  if (!input.destinationPosture.verifiedForPatient) {
    reasons.push("TEL_CONT_192_DESTINATION_NOT_VERIFIED_FOR_SEEDED");
  }
  if (
    input.authorityBinding.bindingState !== "high_assurance" ||
    !input.authorityBinding.current ||
    !input.authorityBinding.boundIdentityBindingRef
  ) {
    reasons.push("TEL_CONT_192_HIGH_ASSURANCE_BINDING_REQUIRED_FOR_SEEDED");
  }
  if (!routeFenceComplete(input.routeFence)) {
    reasons.push("TEL_CONT_192_SCOPE_FENCE_REQUIRED_FOR_SEEDED");
  }
  if (input.routeFence.channelReleaseFreezeState === "blocked") {
    reasons.push("TEL_CONT_192_RELEASE_OR_CHANNEL_POSTURE_NARROWED");
  }
  return unique(reasons);
}

function challengeAllowed(input: SettleContinuationEligibilityInput): boolean {
  const posture = input.verificationDecision?.nextAllowedContinuationPosture;
  return (
    (posture === "seeded_continuation_candidate" || posture === "challenge_continuation_only") &&
    routeFenceComplete(input.routeFence) &&
    input.routeFence.channelReleaseFreezeState !== "blocked"
  );
}

function capabilityCeilingFor(
  family: TelephonyContinuationGrantFamily,
): TelephonyContinuationCapabilityCeiling {
  if (family === "continuation_seeded_verified") return "minimal_detail_entry";
  if (family === "continuation_challenge") return "challenge_before_disclosure";
  return "manual_only_no_disclosure";
}

function lineageScopeFor(eligibility: TelephonyContinuationEligibility): {
  lineageKind: "draft" | "request";
  lineageRef: string;
} {
  if (!eligibility.requestSeedRef) {
    throw new Error("Continuation grant issuance requires requestSeedRef.");
  }
  return eligibility.lineageScope === "same_request_lineage"
    ? { lineageKind: "request", lineageRef: eligibility.requestSeedRef }
    : { lineageKind: "draft", lineageRef: eligibility.requestSeedRef };
}

function accessGrantIssueInput(input: IssueContinuationInput): IssueAccessGrantInput {
  const grantFamily = input.eligibility.grantFamilyRecommendation;
  if (grantFamily === "manual_only") {
    throw new Error("manual_only creates no redeemable grant.");
  }
  const seeded = grantFamily === "continuation_seeded_verified";
  return {
    issueIdempotencyKey: `${input.idempotencyKey}:access-grant`,
    grantFamily,
    actionScope: input.routeFence.actionScope,
    routeFamily: input.routeFence.routeFamilyRef,
    governingObjectRef: input.routeFence.requestSeedRef,
    governingObjectVersionRef: input.routeFence.governingObjectVersionRef,
    sessionEpochRef: seeded ? input.authorityBinding.boundSessionEpoch : null,
    subjectBindingVersionRef: seeded ? input.authorityBinding.boundSubjectBindingVersion : null,
    lineageFenceRef: input.routeFence.lineageFenceRef,
    routeIntentBindingRef: input.routeFence.routeIntentBindingRef,
    releaseApprovalFreezeRef: input.routeFence.releaseApprovalFreezeRef,
    manifestVersionRef: input.routeFence.manifestVersionRef,
    channelPosture: "sms",
    embeddedPosture: "not_embedded",
    audienceScope: "patient_public",
    visibilityScope: seeded ? "scoped_phi" : "public_safe_summary",
    subjectRef: seeded ? input.authorityBinding.boundSubjectRef : null,
    lineageScope: lineageScopeFor(input.eligibility),
    phiExposureClass: seeded ? "scoped_phi" : "minimal",
    recoveryRouteRef: input.routeFence.sameLineageRecoveryRouteRef,
    opaqueToken: undefined,
    expiresAt:
      input.expiresAt ??
      addMinutesIso(
        input.observedAt ?? nowIso(),
        telephonyContinuationLifetimePolicy.defaultGrantTtlMinutes,
      ),
    issuedBy: TELEPHONY_CONTINUATION_SERVICE_NAME,
    issuedAt: input.observedAt ?? nowIso(),
    reasonCodes: [
      "TEL_CONT_192_ACCESS_GRANT_SERVICE_CANONICAL",
      seeded
        ? "TEL_CONT_192_SEEDED_GRANTED_BY_SETTLED_ELIGIBILITY"
        : "TEL_CONT_192_CHALLENGE_GRANTED_WITH_NO_SEEDED_DISCLOSURE",
    ],
  };
}

function buildMessageManifest(input: {
  readonly context: TelephonyContinuationContext;
  readonly grantFamily: Exclude<TelephonyContinuationGrantFamily, "manual_only">;
  readonly observedAt: string;
}): ContinuationMessageManifest {
  const challenge = input.grantFamily === "continuation_challenge";
  return freezeRecord({
    messageManifestRef: deterministicId("tcmm", {
      context: input.context.continuationContextRef,
      grantFamily: input.grantFamily,
    }),
    schemaVersion: TELEPHONY_CONTINUATION_SCHEMA_VERSION,
    policyVersion: TELEPHONY_CONTINUATION_MESSAGE_POLICY_VERSION,
    continuationContextRef: input.context.continuationContextRef,
    grantFamily: input.grantFamily,
    templateRef: challenge
      ? "sms_continuation_challenge_masked_192.v1"
      : "sms_continuation_seeded_masked_192.v1",
    bodyCopyCode: challenge ? "CONTINUE_WITH_IDENTITY_CHECK" : "CONTINUE_SECURELY",
    bodyPreview: challenge
      ? "Vecells: continue securely. We will ask a quick check before showing anything. The link expires soon."
      : "Vecells: continue securely. The link expires soon. We will never ask for your password by SMS.",
    containsPhi: false,
    includesSignedUrl: false,
    linkPlaceholderRef: `link-placeholder://${input.context.accessGrantRef}`,
    reasonCodes: [
      "TEL_CONT_192_MESSAGE_MANIFEST_MASKED_NO_PHI",
      "TEL_CONT_192_DISPATCH_DOES_NOT_DECIDE_GRANT_FAMILY",
    ],
    createdAt: input.observedAt,
    recordedBy: TELEPHONY_CONTINUATION_SERVICE_NAME,
  }) as ContinuationMessageManifest;
}

function routeTupleForContext(context: TelephonyContinuationContext): RouteRuntimeTuple {
  if (
    !context.routeFamilyRef ||
    context.actionScope === "manual_followup" ||
    !context.requestSeedRef
  ) {
    throw new Error(`Continuation context ${context.continuationContextRef} is not redeemable.`);
  }
  return {
    routeFamily: context.routeFamilyRef,
    actionScope: context.actionScope,
    governingObjectRef: context.requestSeedRef,
    governingObjectVersionRef: context.requestSeedRef ? `${context.requestSeedRef}:version` : null,
    sessionEpochRef: context.authoritySettledBindingFence.boundSessionEpoch,
    subjectBindingVersionRef: context.authoritySettledBindingFence.boundSubjectBindingVersion,
    lineageFenceRef: context.authoritySettledBindingFence.lineageFenceRef,
    grantFamily:
      context.requestedGrantFamily === "manual_only" ? null : context.requestedGrantFamily,
    releaseApprovalFreezeRef: context.releaseApprovalFreezeRef,
    manifestVersionRef: context.manifestVersionRef,
    channelPosture: "sms",
    embeddedPosture: "not_embedded",
    audienceScope: "patient_public",
    visibilityScope:
      context.requestedGrantFamily === "continuation_seeded_verified"
        ? "scoped_phi"
        : "public_safe_summary",
  };
}

export function createContinuationRedemptionRouteTuple(input: {
  readonly context: TelephonyContinuationContext;
  readonly governingObjectVersionRef: string;
}): RouteRuntimeTuple {
  return {
    ...routeTupleForContext(input.context),
    governingObjectVersionRef: input.governingObjectVersionRef,
  };
}

export function createInMemoryTelephonyContinuationRepository(): TelephonyContinuationRepository {
  const eligibilities = new Map<string, TelephonyContinuationEligibility>();
  const eligibilitiesByIdempotency = new Map<string, string>();
  const contexts = new Map<string, TelephonyContinuationContext>();
  const contextsByIssuanceIdempotency = new Map<string, string>();
  const contextsByAccessGrantRef = new Map<string, string>();
  const dispatchIntents = new Map<string, ContinuationDispatchIntent>();
  const dispatchByIdempotency = new Map<string, string>();
  const messageManifests = new Map<string, ContinuationMessageManifest>();
  const redemptionOutcomes = new Map<string, ContinuationRedemptionOutcome>();
  const redemptionOutcomesByIdempotency = new Map<string, string>();
  const redemptionOutcomesByGrantRedemption = new Map<string, string>();
  const recoveryContinuations = new Map<string, RecoveryContinuationEnvelope>();
  const secureLinkSessions = new Map<string, SecureLinkSessionProjection>();

  return {
    async getEligibilityByIdempotencyKey(idempotencyKey) {
      const ref = eligibilitiesByIdempotency.get(idempotencyKey);
      return ref ? clone(eligibilities.get(ref) ?? null) : null;
    },
    async saveEligibility(record) {
      const frozen = freezeRecord(record) as TelephonyContinuationEligibility;
      eligibilities.set(frozen.telephonyContinuationEligibilityRef, frozen);
      eligibilitiesByIdempotency.set(
        frozen.decisionIdempotencyKey,
        frozen.telephonyContinuationEligibilityRef,
      );
    },
    async getContextByIssuanceIdempotencyKey(idempotencyKey) {
      const ref = contextsByIssuanceIdempotency.get(idempotencyKey);
      return ref ? clone(contexts.get(ref) ?? null) : null;
    },
    async getContextByRef(contextRef) {
      return clone(contexts.get(contextRef) ?? null);
    },
    async getCurrentContextForCall(callSessionRef) {
      return (
        [...contexts.values()]
          .filter((context) => context.callSessionRef === callSessionRef)
          .sort((left, right) => right.issuedAt.localeCompare(left.issuedAt))[0] ?? null
      );
    },
    async getContextByAccessGrantRef(grantRef) {
      const contextRef = contextsByAccessGrantRef.get(grantRef);
      return contextRef ? clone(contexts.get(contextRef) ?? null) : null;
    },
    async saveContext(record) {
      const frozen = freezeRecord(record) as TelephonyContinuationContext;
      contexts.set(frozen.continuationContextRef, frozen);
      contextsByIssuanceIdempotency.set(
        frozen.issuanceIdempotencyKey,
        frozen.continuationContextRef,
      );
      if (frozen.accessGrantRef)
        contextsByAccessGrantRef.set(frozen.accessGrantRef, frozen.continuationContextRef);
    },
    async getDispatchIntentByIdempotencyKey(idempotencyKey) {
      const ref = dispatchByIdempotency.get(idempotencyKey);
      return ref ? clone(dispatchIntents.get(ref) ?? null) : null;
    },
    async saveDispatchIntent(record) {
      const frozen = freezeRecord(record) as ContinuationDispatchIntent;
      dispatchIntents.set(frozen.dispatchIntentRef, frozen);
      dispatchByIdempotency.set(frozen.dispatchIdempotencyKey, frozen.dispatchIntentRef);
    },
    async getMessageManifest(messageManifestRef) {
      return clone(messageManifests.get(messageManifestRef) ?? null);
    },
    async saveMessageManifest(record) {
      const frozen = freezeRecord(record) as ContinuationMessageManifest;
      messageManifests.set(frozen.messageManifestRef, frozen);
    },
    async getRedemptionOutcomeByIdempotencyKey(idempotencyKey) {
      const ref = redemptionOutcomesByIdempotency.get(idempotencyKey);
      return ref ? clone(redemptionOutcomes.get(ref) ?? null) : null;
    },
    async getRedemptionOutcomeByGrantRedemptionRef(grantRedemptionRef) {
      const ref = redemptionOutcomesByGrantRedemption.get(grantRedemptionRef);
      return ref ? clone(redemptionOutcomes.get(ref) ?? null) : null;
    },
    async saveRedemptionOutcome(record) {
      const frozen = freezeRecord(record) as ContinuationRedemptionOutcome;
      redemptionOutcomes.set(frozen.continuationRedemptionOutcomeRef, frozen);
      redemptionOutcomesByIdempotency.set(
        frozen.redemptionIdempotencyKey,
        frozen.continuationRedemptionOutcomeRef,
      );
      if (frozen.grantRedemptionRef) {
        redemptionOutcomesByGrantRedemption.set(
          frozen.grantRedemptionRef,
          frozen.continuationRedemptionOutcomeRef,
        );
      }
    },
    async getRecoveryContinuation(ref) {
      return clone(recoveryContinuations.get(ref) ?? null);
    },
    async saveRecoveryContinuation(record) {
      const frozen = freezeRecord(record) as RecoveryContinuationEnvelope;
      recoveryContinuations.set(frozen.recoveryContinuationRef, frozen);
    },
    async saveSecureLinkSessionProjection(record) {
      const frozen = freezeRecord(record) as SecureLinkSessionProjection;
      secureLinkSessions.set(frozen.projectionRef, frozen);
    },
    snapshots() {
      return freezeRecord({
        eligibilities: [...eligibilities.values()],
        contexts: [...contexts.values()],
        dispatchIntents: [...dispatchIntents.values()],
        messageManifests: [...messageManifests.values()],
        redemptionOutcomes: [...redemptionOutcomes.values()],
        recoveryContinuations: [...recoveryContinuations.values()],
        secureLinkSessions: [...secureLinkSessions.values()],
      }) as TelephonyContinuationRepositorySnapshots;
    },
  };
}

class TelephonyContinuationGrantServiceImpl implements TelephonyContinuationGrantService {
  constructor(
    private readonly repository: TelephonyContinuationRepository,
    private readonly accessGrantService: AccessGrantService,
  ) {}

  async settleContinuationEligibility(
    input: SettleContinuationEligibilityInput,
  ): Promise<TelephonyContinuationEligibility> {
    const replay = await this.repository.getEligibilityByIdempotencyKey(input.idempotencyKey);
    if (replay) return replay;

    const observedAt = input.observedAt ?? nowIso();
    const reasonCodes = ["TEL_CONT_192_SETTLED_POSTURE_REQUIRED"];
    const downgradeReasonCodes: string[] = [];
    let grantFamilyRecommendation: TelephonyContinuationGrantFamily = "manual_only";
    let eligibilityState: TelephonyContinuationEligibilityState = "manual_only";
    let lineageScope: TelephonyContinuationLineageScope = "none";

    const readinessManual = readinessForcesManualOnly(input.evidenceReadinessAssessment);
    if (readinessManual) {
      reasonCodes.push(readinessManual, "TEL_CONT_192_MANUAL_ONLY_NO_REDEEMABLE_GRANT");
    } else if (!readinessAllowsContinuation(input.evidenceReadinessAssessment)) {
      reasonCodes.push(
        "TEL_CONT_192_NOT_ELIGIBLE_MANUAL_ONLY",
        "TEL_CONT_192_MANUAL_ONLY_NO_REDEEMABLE_GRANT",
      );
      eligibilityState = "not_eligible";
    } else if (canSeed(input)) {
      grantFamilyRecommendation = "continuation_seeded_verified";
      eligibilityState = "eligible_seeded";
      lineageScope = "same_submission_envelope";
      reasonCodes.push(
        "TEL_CONT_192_EVIDENCE_READINESS_ALLOWS_CONTINUATION",
        "TEL_CONT_192_SEEDED_GRANTED_BY_SETTLED_ELIGIBILITY",
      );
    } else if (challengeAllowed(input)) {
      grantFamilyRecommendation = "continuation_challenge";
      eligibilityState = "eligible_challenge";
      lineageScope = "same_submission_envelope";
      downgradeReasonCodes.push(...seededDowngradeReasons(input));
      reasonCodes.push(
        "TEL_CONT_192_EVIDENCE_READINESS_ALLOWS_CONTINUATION",
        "TEL_CONT_192_CHALLENGE_GRANTED_WITH_NO_SEEDED_DISCLOSURE",
        ...(input.verificationDecision?.nextAllowedContinuationPosture ===
        "seeded_continuation_candidate"
          ? ["TEL_CONT_192_DOWNGRADE_SEEDED_TO_CHALLENGE"]
          : []),
      );
    } else {
      reasonCodes.push(
        "TEL_CONT_192_NOT_ELIGIBLE_MANUAL_ONLY",
        "TEL_CONT_192_MANUAL_ONLY_NO_REDEEMABLE_GRANT",
      );
      eligibilityState = "not_eligible";
    }

    const eligibility: TelephonyContinuationEligibility = freezeRecord({
      telephonyContinuationEligibilityRef: deterministicId("tel_ce_192", {
        callSessionRef: input.callSessionRef,
        idempotencyKey: input.idempotencyKey,
      }),
      decisionIdempotencyKey: input.idempotencyKey,
      schemaVersion: TELEPHONY_CONTINUATION_SCHEMA_VERSION,
      policyVersion: TELEPHONY_CONTINUATION_POLICY_VERSION,
      callSessionRef: input.callSessionRef,
      evidenceReadinessAssessmentRef:
        input.evidenceReadinessAssessment.telephonyEvidenceReadinessAssessmentRef,
      identityConfidenceRef:
        input.verificationDecision?.identityConfidenceAssessmentRef ??
        input.verificationDecision?.telephonyVerificationDecisionRef ??
        null,
      destinationConfidenceRef:
        input.destinationPosture.destinationConfidenceRef ??
        input.verificationDecision?.destinationConfidenceAssessmentRef ??
        null,
      verificationDecisionRef: input.verificationDecision?.telephonyVerificationDecisionRef ?? null,
      grantFamilyRecommendation,
      lineageScope,
      eligibilityState,
      routeFamilyRef:
        grantFamilyRecommendation === "manual_only" ? null : input.routeFence.routeFamilyRef,
      actionScope:
        grantFamilyRecommendation === "manual_only" ? null : input.routeFence.actionScope,
      requestSeedRef:
        grantFamilyRecommendation === "manual_only" ? null : input.routeFence.requestSeedRef,
      downgradeReasonCodes: unique(downgradeReasonCodes),
      reasonCodes: unique([...reasonCodes, ...downgradeReasonCodes]),
      evaluatedAt: observedAt,
      recordedBy: TELEPHONY_CONTINUATION_SERVICE_NAME,
    }) as TelephonyContinuationEligibility;
    await this.repository.saveEligibility(eligibility);
    return eligibility;
  }

  async issueContinuation(input: IssueContinuationInput): Promise<IssueContinuationResult> {
    const existing = await this.repository.getDispatchIntentByIdempotencyKey(input.idempotencyKey);
    if (existing) {
      const context = await this.repository.getContextByRef(existing.continuationContextRef);
      if (!context)
        throw new Error(`Missing continuation context ${existing.continuationContextRef}`);
      const messageManifest = existing.messageManifestRef
        ? await this.repository.getMessageManifest(existing.messageManifestRef)
        : null;
      return {
        eligibility: input.eligibility,
        context,
        dispatchIntent: existing,
        messageManifest,
        grantIssue: null,
        materializedToken: null,
        replayed: true,
      };
    }

    const observedAt = input.observedAt ?? nowIso();
    const expiresAt =
      input.expiresAt ??
      addMinutesIso(observedAt, telephonyContinuationLifetimePolicy.defaultGrantTtlMinutes);
    const priorContext = await this.repository.getCurrentContextForCall(
      input.eligibility.callSessionRef,
    );
    const manualOnly =
      input.eligibility.grantFamilyRecommendation === "manual_only" ||
      input.eligibility.eligibilityState === "manual_only" ||
      input.eligibility.eligibilityState === "not_eligible";

    if (manualOnly) {
      const context = this.buildContext({
        input,
        accessGrantRef: null,
        scopeEnvelopeRef: null,
        supersedesContextRef: priorContext?.continuationContextRef ?? null,
        observedAt,
        expiresAt,
      });
      const dispatchIntent = this.buildDispatchIntent({
        input,
        context,
        messageManifestRef: null,
        observedAt,
      });
      await this.repository.saveContext(context);
      await this.repository.saveDispatchIntent(dispatchIntent);
      return {
        eligibility: input.eligibility,
        context,
        dispatchIntent,
        messageManifest: null,
        grantIssue: null,
        materializedToken: null,
        replayed: false,
      };
    }

    const issueInput = accessGrantIssueInput({ ...input, expiresAt, observedAt });
    let grantIssue: IssueAccessGrantResult;
    if (priorContext?.accessGrantRef) {
      const replacement = await this.accessGrantService.replaceGrant({
        supersessionIdempotencyKey: `${input.idempotencyKey}:resend-supersession`,
        predecessorGrantRef: priorContext.accessGrantRef,
        issue: {
          ...issueInput,
          reasonCodes: unique([
            ...(issueInput.reasonCodes ?? []),
            "TEL_CONT_192_RESEND_SUPERSEDES_PRIOR_LINK",
          ]),
        },
        causeClass: "secure_link_reissue",
        actorRef: input.actorRef,
        observedAt,
      });
      grantIssue = replacement.replacement;
    } else {
      grantIssue = await this.accessGrantService.issueGrant(issueInput);
    }

    const context = this.buildContext({
      input,
      accessGrantRef: grantIssue.grant.grantRef,
      scopeEnvelopeRef: grantIssue.scopeEnvelope.scopeEnvelopeRef,
      supersedesContextRef: priorContext?.continuationContextRef ?? null,
      observedAt,
      expiresAt,
    });
    const messageManifest = buildMessageManifest({
      context,
      grantFamily: input.eligibility.grantFamilyRecommendation as Exclude<
        TelephonyContinuationGrantFamily,
        "manual_only"
      >,
      observedAt,
    });
    const dispatchIntent = this.buildDispatchIntent({
      input,
      context,
      messageManifestRef: messageManifest.messageManifestRef,
      observedAt,
    });
    await this.repository.saveContext(context);
    await this.repository.saveMessageManifest(messageManifest);
    await this.repository.saveDispatchIntent(dispatchIntent);

    return {
      eligibility: input.eligibility,
      context,
      dispatchIntent,
      messageManifest,
      grantIssue,
      materializedToken: grantIssue.materializedToken,
      replayed: false,
    };
  }

  async redeemContinuation(input: RedeemContinuationInput): Promise<RedeemContinuationResult> {
    const replayByIdempotency = await this.repository.getRedemptionOutcomeByIdempotencyKey(
      input.redemptionIdempotencyKey,
    );
    if (replayByIdempotency) {
      return {
        outcome: {
          ...replayByIdempotency,
          replayed: true,
          reasonCodes: unique([...replayByIdempotency.reasonCodes, "TEL_CONT_192_REPLAY_RETURNED"]),
        },
        grantRedemption: null,
        grant: null,
        scopeEnvelope: null,
        supersession: null,
        secureLinkSession: null,
        recoveryContinuation: replayByIdempotency.recoveryContinuationRef
          ? await this.repository.getRecoveryContinuation(
              replayByIdempotency.recoveryContinuationRef,
            )
          : null,
        replayed: true,
      };
    }

    const observedAt = input.observedAt ?? nowIso();
    const redemption = await this.accessGrantService.redeemGrant({
      redemptionIdempotencyKey: `${input.redemptionIdempotencyKey}:access-grant`,
      presentedToken: input.presentedToken,
      routeTuple: input.routeTuple,
      actorRef: input.actorRef,
      sameLineageRecoveryAvailable: input.sameLineageRecoveryAvailable ?? true,
      observedAt,
    });

    const existingOutcome = redemption.redemption.grantRef
      ? await this.repository.getRedemptionOutcomeByGrantRedemptionRef(
          redemption.redemption.redemptionRef,
        )
      : null;
    if (existingOutcome) {
      return {
        outcome: {
          ...existingOutcome,
          replayed: true,
          reasonCodes: unique([...existingOutcome.reasonCodes, "TEL_CONT_192_REPLAY_RETURNED"]),
        },
        grantRedemption: redemption.redemption,
        grant: redemption.grant,
        scopeEnvelope: redemption.scopeEnvelope,
        supersession: redemption.supersession,
        secureLinkSession: null,
        recoveryContinuation: existingOutcome.recoveryContinuationRef
          ? await this.repository.getRecoveryContinuation(existingOutcome.recoveryContinuationRef)
          : null,
        replayed: true,
      };
    }

    const context = redemption.grant?.grantRef
      ? await this.repository.getContextByAccessGrantRef(redemption.grant.grantRef)
      : null;
    const recoveryNeeded =
      redemption.redemption.decision !== "redeemed" || (input.interruption ?? "none") !== "none";
    let secureLinkSession: SecureLinkSessionProjection | null = null;
    let recoveryContinuation: RecoveryContinuationEnvelope | null = null;
    let redemptionState: TelephonyContinuationRedemptionState = "session_established";
    const reasonCodes = [
      "TEL_CONT_192_EXACT_ONCE_REDEMPTION",
      "TEL_CONT_192_URL_GRANT_REUSE_BLOCKED",
      ...redemption.redemption.reasonCodes,
    ];

    if (recoveryNeeded) {
      const recoveryReason = this.recoveryReasonCode(redemption, input.interruption ?? "none");
      redemptionState =
        recoveryReason === "step_up_required" ||
        recoveryReason === "nhs_login_uplift" ||
        recoveryReason === "contact_route_repair" ||
        recoveryReason === "subject_conflict" ||
        recoveryReason === "session_expiry"
          ? "step_up_interrupted"
          : recoveryReason === "superseded_link"
            ? "superseded_recovery"
            : redemption.redemption.decision === "denied"
              ? "denied"
              : "stale_link_recovery";
      if (context) {
        recoveryContinuation = this.buildRecoveryContinuation({
          context,
          recoveryReasonCode: recoveryReason,
          observedAt,
        });
        await this.repository.saveRecoveryContinuation(recoveryContinuation);
        reasonCodes.push(
          "TEL_CONT_192_RECOVERY_TOKEN_SAME_SHELL",
          redemptionState === "superseded_recovery"
            ? "TEL_CONT_192_SUPERSEDED_LINK_RECOVERY"
            : redemptionState === "step_up_interrupted"
              ? "TEL_CONT_192_STEP_UP_INTERRUPTED_RECOVERY"
              : "TEL_CONT_192_STALE_LINK_RECOVERY",
        );
      }
    } else if (context && redemption.grant) {
      secureLinkSession = this.buildSecureLinkSession({
        context,
        grantRef: redemption.grant.grantRef,
        grantRedemptionRef: redemption.redemption.redemptionRef,
        observedAt,
      });
      await this.repository.saveSecureLinkSessionProjection(secureLinkSession);
      reasonCodes.push(
        "TEL_CONT_192_SECURE_LINK_SESSION_ROTATED",
        "TEL_CONT_192_CSRF_SECRET_ROTATED",
      );
    } else {
      redemptionState = "denied";
    }

    const outcome: ContinuationRedemptionOutcome = freezeRecord({
      continuationRedemptionOutcomeRef: deterministicId("tcro", {
        idempotencyKey: input.redemptionIdempotencyKey,
        grantRedemptionRef: redemption.redemption.redemptionRef,
      }),
      redemptionIdempotencyKey: input.redemptionIdempotencyKey,
      schemaVersion: TELEPHONY_CONTINUATION_SCHEMA_VERSION,
      policyVersion: TELEPHONY_CONTINUATION_POLICY_VERSION,
      callSessionRef: context?.callSessionRef ?? "unknown_call_session",
      continuationContextRef: context?.continuationContextRef ?? null,
      accessGrantRef: redemption.grant?.grantRef ?? null,
      grantRedemptionRef: redemption.redemption.redemptionRef,
      redemptionState,
      replayed: redemption.replayed,
      secureLinkSessionRef: secureLinkSession?.secureLinkSessionRef ?? null,
      secureLinkSessionProjectionRef: secureLinkSession?.projectionRef ?? null,
      recoveryContinuationRef: recoveryContinuation?.recoveryContinuationRef ?? null,
      routeIntentBindingRef:
        secureLinkSession?.routeIntentBindingRef ??
        context?.authoritySettledBindingFence.lineageFenceRef ??
        null,
      csrfSecretRef: secureLinkSession?.csrfSecretRef ?? null,
      grantTokenReuseBlocked: true,
      reasonCodes: unique(reasonCodes),
      redeemedAt: observedAt,
      recordedBy: TELEPHONY_CONTINUATION_SERVICE_NAME,
    }) as ContinuationRedemptionOutcome;
    await this.repository.saveRedemptionOutcome(outcome);
    return {
      outcome,
      grantRedemption: redemption.redemption,
      grant: redemption.grant,
      scopeEnvelope: redemption.scopeEnvelope,
      supersession: redemption.supersession,
      secureLinkSession,
      recoveryContinuation,
      replayed: redemption.replayed,
    };
  }

  async consumeRecoveryContinuation(input: {
    readonly recoveryContinuationRef: string;
    readonly observedAt?: string;
  }): Promise<{
    readonly recoveryContinuation: RecoveryContinuationEnvelope;
    readonly sameShellContinuityPreserved: true;
    readonly reasonCodes: readonly string[];
  }> {
    const recoveryContinuation = await this.repository.getRecoveryContinuation(
      input.recoveryContinuationRef,
    );
    if (!recoveryContinuation) {
      throw new Error(`Unknown RecoveryContinuationToken ${input.recoveryContinuationRef}`);
    }
    return {
      recoveryContinuation,
      sameShellContinuityPreserved: true,
      reasonCodes: unique([
        ...recoveryContinuation.reasonCodes,
        "TEL_CONT_192_RECOVERY_TOKEN_SAME_SHELL",
      ]),
    };
  }

  private buildContext(input: {
    readonly input: IssueContinuationInput;
    readonly accessGrantRef: string | null;
    readonly scopeEnvelopeRef: string | null;
    readonly supersedesContextRef: string | null;
    readonly observedAt: string;
    readonly expiresAt: string;
  }): TelephonyContinuationContext {
    const family = input.input.eligibility.grantFamilyRecommendation;
    const manualOnly = family === "manual_only";
    return freezeRecord({
      continuationContextRef: deterministicId("tel_ctx_192", {
        idempotencyKey: input.input.idempotencyKey,
        callSessionRef: input.input.eligibility.callSessionRef,
      }),
      issuanceIdempotencyKey: input.input.idempotencyKey,
      schemaVersion: TELEPHONY_CONTINUATION_SCHEMA_VERSION,
      policyVersion: TELEPHONY_CONTINUATION_POLICY_VERSION,
      callSessionRef: input.input.eligibility.callSessionRef,
      contextState: manualOnly ? "no_grant_manual_only" : "grant_issued",
      targetChannel: manualOnly ? "none" : "sms",
      phoneNumberHash: input.input.destinationPosture.destinationHash,
      requestedGrantFamily: family,
      capabilityCeiling: capabilityCeilingFor(family),
      currentReadinessVerdict: {
        usabilityState: input.input.evidenceReadinessAssessment.usabilityState,
        promotionReadiness: input.input.evidenceReadinessAssessment.promotionReadiness,
      },
      evidenceReadinessAssessmentRef:
        input.input.evidenceReadinessAssessment.telephonyEvidenceReadinessAssessmentRef,
      continuationEligibilityRef: input.input.eligibility.telephonyContinuationEligibilityRef,
      lineageScope: input.input.eligibility.lineageScope,
      requestSeedRef: manualOnly ? null : input.input.routeFence.requestSeedRef,
      routeFamilyRef: manualOnly ? null : input.input.routeFence.routeFamilyRef,
      actionScope: manualOnly ? "manual_followup" : input.input.routeFence.actionScope,
      authoritySettledBindingFence: {
        boundSubjectRef: input.input.authorityBinding.boundSubjectRef,
        boundIdentityBindingRef: input.input.authorityBinding.boundIdentityBindingRef,
        boundSessionEpoch:
          family === "continuation_seeded_verified"
            ? input.input.authorityBinding.boundSessionEpoch
            : null,
        boundSubjectBindingVersion:
          family === "continuation_seeded_verified"
            ? input.input.authorityBinding.boundSubjectBindingVersion
            : null,
        lineageFenceRef: manualOnly ? null : input.input.routeFence.lineageFenceRef,
      },
      manifestVersionRef: manualOnly ? null : input.input.routeFence.manifestVersionRef,
      releaseApprovalFreezeRef: manualOnly ? null : input.input.routeFence.releaseApprovalFreezeRef,
      minimumBridgeCapabilitiesRef: manualOnly
        ? null
        : input.input.routeFence.minimumBridgeCapabilitiesRef,
      channelReleaseFreezeState: manualOnly
        ? "none"
        : input.input.routeFence.channelReleaseFreezeState,
      grantFenceState: manualOnly ? "not_applicable" : "grant_issued",
      accessGrantRef: input.accessGrantRef,
      scopeEnvelopeRef: input.scopeEnvelopeRef,
      supersedesContextRef: input.supersedesContextRef,
      reasonCodes: unique([
        "TEL_CONT_192_ACCESS_GRANT_SERVICE_CANONICAL",
        ...(manualOnly
          ? ["TEL_CONT_192_MANUAL_ONLY_NO_REDEEMABLE_GRANT"]
          : ["TEL_CONT_192_DISPATCH_DOES_NOT_DECIDE_GRANT_FAMILY"]),
        ...(input.supersedesContextRef ? ["TEL_CONT_192_RESEND_SUPERSEDES_PRIOR_LINK"] : []),
        ...input.input.eligibility.reasonCodes,
      ]),
      issuedAt: input.observedAt,
      expiresAt: input.expiresAt,
      resolvedAt: manualOnly ? input.observedAt : null,
      recordedBy: TELEPHONY_CONTINUATION_SERVICE_NAME,
    }) as TelephonyContinuationContext;
  }

  private buildDispatchIntent(input: {
    readonly input: IssueContinuationInput;
    readonly context: TelephonyContinuationContext;
    readonly messageManifestRef: string | null;
    readonly observedAt: string;
  }): ContinuationDispatchIntent {
    const manualOnly = input.context.requestedGrantFamily === "manual_only";
    return freezeRecord({
      dispatchIntentRef: deterministicId("tcdi", {
        context: input.context.continuationContextRef,
        idempotencyKey: input.input.idempotencyKey,
      }),
      dispatchIdempotencyKey: input.input.idempotencyKey,
      schemaVersion: TELEPHONY_CONTINUATION_SCHEMA_VERSION,
      policyVersion: TELEPHONY_CONTINUATION_POLICY_VERSION,
      callSessionRef: input.context.callSessionRef,
      continuationContextRef: input.context.continuationContextRef,
      accessGrantRef: input.context.accessGrantRef,
      messageManifestRef: input.messageManifestRef,
      grantFamily: input.context.requestedGrantFamily,
      dispatchOutcome: manualOnly ? "no_redeemable_grant" : "queued",
      targetChannel: input.context.targetChannel,
      destinationHash: input.input.destinationPosture.destinationHash,
      maskedDestination: input.input.destinationPosture.maskedDestination,
      noPhiBody: true,
      signedUrlMaterializedInManifest: false,
      providerDeliveryRef: null,
      reasonCodes: unique([
        "TEL_CONT_192_DISPATCH_DOES_NOT_DECIDE_GRANT_FAMILY",
        ...(manualOnly
          ? ["TEL_CONT_192_MANUAL_ONLY_NO_REDEEMABLE_GRANT"]
          : ["TEL_CONT_192_MESSAGE_MANIFEST_MASKED_NO_PHI"]),
      ]),
      createdAt: input.observedAt,
      recordedBy: TELEPHONY_CONTINUATION_SERVICE_NAME,
    }) as ContinuationDispatchIntent;
  }

  private buildSecureLinkSession(input: {
    readonly context: TelephonyContinuationContext;
    readonly grantRef: string;
    readonly grantRedemptionRef: string;
    readonly observedAt: string;
  }): SecureLinkSessionProjection {
    const seeded = input.context.requestedGrantFamily === "continuation_seeded_verified";
    const sessionEpochRef = deterministicId("tc_session_epoch", {
      context: input.context.continuationContextRef,
      redemption: input.grantRedemptionRef,
    });
    return freezeRecord({
      projectionRef: deterministicId("tcslsp", {
        context: input.context.continuationContextRef,
        redemption: input.grantRedemptionRef,
      }),
      schemaVersion: TELEPHONY_CONTINUATION_SCHEMA_VERSION,
      continuationContextRef: input.context.continuationContextRef,
      accessGrantRef: input.grantRef,
      grantRedemptionRef: input.grantRedemptionRef,
      secureLinkSessionRef: deterministicId("tc_secure_session", {
        context: input.context.continuationContextRef,
        redemption: input.grantRedemptionRef,
      }),
      sessionEpochRef,
      csrfSecretRef: deterministicId("tc_csrf_secret", {
        sessionEpochRef,
        redemption: input.grantRedemptionRef,
      }),
      routeIntentBindingRef: input.context.authoritySettledBindingFence.lineageFenceRef,
      disclosurePosture: seeded ? "seeded_verified" : "challenge_minimal",
      patientDataDisclosureAllowed: seeded,
      urlGrantReusable: false,
      reasonCodes: [
        "TEL_CONT_192_SECURE_LINK_SESSION_ROTATED",
        "TEL_CONT_192_CSRF_SECRET_ROTATED",
        "TEL_CONT_192_URL_GRANT_REUSE_BLOCKED",
        ...(seeded ? [] : ["TEL_CONT_192_CHALLENGE_GRANTED_WITH_NO_SEEDED_DISCLOSURE"]),
      ],
      createdAt: input.observedAt,
      expiresAt: addMinutesIso(input.observedAt, 60),
      recordedBy: TELEPHONY_CONTINUATION_SERVICE_NAME,
    }) as SecureLinkSessionProjection;
  }

  private buildRecoveryContinuation(input: {
    readonly context: TelephonyContinuationContext;
    readonly recoveryReasonCode: string;
    readonly observedAt: string;
  }): RecoveryContinuationEnvelope {
    const selectedMobileStep =
      input.recoveryReasonCode === "contact_route_repair"
        ? "contact_route_repair"
        : input.recoveryReasonCode === "expired_link" ||
            input.recoveryReasonCode === "superseded_link" ||
            input.recoveryReasonCode === "stale_scope"
          ? "stale_link_recovery"
          : "identity_challenge";
    const tuple = {
      context: input.context.continuationContextRef,
      requestSeedRef: input.context.requestSeedRef,
      routeFamilyRef: input.context.routeFamilyRef,
      shellContinuityKey: input.context.requestSeedRef,
      recoveryReasonCode: input.recoveryReasonCode,
    };
    return freezeRecord({
      recoveryContinuationRef: deterministicId("rct_192", tuple),
      schemaVersion: TELEPHONY_CONTINUATION_SCHEMA_VERSION,
      policyVersion: TELEPHONY_CONTINUATION_RECOVERY_POLICY_VERSION,
      continuationContextRef: input.context.continuationContextRef,
      callSessionRef: input.context.callSessionRef,
      lineageScope: input.context.lineageScope,
      routeFamilyRef: input.context.routeFamilyRef,
      routeIntentRef: input.context.authoritySettledBindingFence.lineageFenceRef,
      resumeObjectRef: input.context.requestSeedRef,
      requestSeedRef: input.context.requestSeedRef,
      returnContractRef: `PatientNavReturnContract:${input.context.requestSeedRef}`,
      patientShellConsistencyRef: `PatientShellConsistencyProjection:${input.context.requestSeedRef}`,
      shellContinuityKey: `patient-shell:${input.context.requestSeedRef}`,
      selectedMobileStep,
      patientActionRecoveryEnvelopeRef: `PatientActionRecoveryEnvelope:${input.context.requestSeedRef}:${input.recoveryReasonCode}`,
      sameShellRequired: true,
      recoveryReasonCode: input.recoveryReasonCode,
      recoveryTupleHash: deterministicId("recovery_tuple", tuple),
      reasonCodes: [
        "TEL_CONT_192_RECOVERY_TOKEN_SAME_SHELL",
        input.recoveryReasonCode === "superseded_link"
          ? "TEL_CONT_192_SUPERSEDED_LINK_RECOVERY"
          : input.recoveryReasonCode === "expired_link" ||
              input.recoveryReasonCode === "stale_scope"
            ? "TEL_CONT_192_STALE_LINK_RECOVERY"
            : "TEL_CONT_192_STEP_UP_INTERRUPTED_RECOVERY",
      ],
      issuedAt: input.observedAt,
      expiresAt: addMinutesIso(input.observedAt, 60),
      recordedBy: TELEPHONY_CONTINUATION_SERVICE_NAME,
    }) as RecoveryContinuationEnvelope;
  }

  private recoveryReasonCode(
    redemption: RedeemAccessGrantResult,
    interruption: NonNullable<RedeemContinuationInput["interruption"]>,
  ): string {
    if (interruption !== "none") return interruption;
    if (redemption.redemption.decision === "expired") return "expired_link";
    if (redemption.redemption.decision === "superseded") return "superseded_link";
    if (redemption.redemption.decision === "recover_only") return "stale_scope";
    return "denied";
  }
}

export function createTelephonyContinuationApplication(options?: {
  readonly repository?: TelephonyContinuationRepository;
  readonly accessGrantService?: AccessGrantService;
}): TelephonyContinuationApplication {
  const repository = options?.repository ?? createInMemoryTelephonyContinuationRepository();
  const accessGrantService =
    options?.accessGrantService ?? createAccessGrantSupersessionApplication().accessGrantService;
  return Object.freeze({
    service: new TelephonyContinuationGrantServiceImpl(repository, accessGrantService),
    repository,
    accessGrantService,
    persistenceTables: telephonyContinuationPersistenceTables,
    migrationPlanRefs: telephonyContinuationMigrationPlanRefs,
    gapResolutions: telephonyContinuationGapResolutions,
    lifetimePolicy: telephonyContinuationLifetimePolicy,
    reasonCatalog: telephonyContinuationReasonCatalog,
  }) as TelephonyContinuationApplication;
}
