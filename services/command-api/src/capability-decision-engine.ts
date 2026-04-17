import { createHash } from "node:crypto";

export const capabilityDecisionEnginePersistenceTables = [
  "route_capability_profile_registry",
  "capability_decision_records",
  "scope_envelope_authorization_records",
  "capability_policy_audit",
] as const;

export const capabilityDecisionEngineMigrationPlanRefs = [
  "services/command-api/migrations/095_phase2_capability_decision_engine.sql",
] as const;

export const capabilityDecisionEngineParallelInterfaceGaps = [
  "PARALLEL_INTERFACE_GAP_PHASE2_CAPABILITY_ROUTE_PROFILE_REGISTRY_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_CAPABILITY_CENTRAL_ENGINE_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_CAPABILITY_SCOPE_ENVELOPE_DRIFT_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_CAPABILITY_CEILING_NOT_MUTATION_AUTHORITY_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_CAPABILITY_STALE_FENCE_RECOVERY_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_CAPABILITY_AUDIT_PUBLICATION_V1",
] as const;

export const CAPABILITY_DECISION_ENGINE_NAME = "CapabilityDecisionEngine";
export const CAPABILITY_DECISION_SCHEMA_VERSION = "170.phase2.trust.v1";
export const CAPABILITY_DECISION_POLICY_VERSION = "phase2-trust-v1";
export const CAPABILITY_ROUTE_PROFILE_REGISTRY_REF =
  "data/contracts/170_route_capability_profiles.yaml";

export const CAPABILITY_DECISION_REASON_CODES = [
  "CAP_180_ENGINE_CENTRAL_EVALUATION",
  "CAP_180_ROUTE_PROFILE_RESOLVED",
  "CAP_180_ROUTE_PROFILE_VALIDATED",
  "CAP_180_DENY_BY_DEFAULT",
  "CAP_180_UNKNOWN_ROUTE_PROFILE_DENIED",
  "CAP_180_SUBJECT_POSTURE_ACCEPTED",
  "CAP_180_AUTHENTICATED_SUBJECT_REQUIRED",
  "CAP_180_VERIFICATION_BELOW_ROUTE_REQUIREMENT",
  "CAP_180_SESSION_CURRENT",
  "CAP_180_SESSION_REQUIRED",
  "CAP_180_SESSION_STALE_OR_EXPIRED",
  "CAP_180_SESSION_EPOCH_DRIFT",
  "CAP_180_PATIENT_LINK_ACCEPTED",
  "CAP_180_PATIENT_LINK_AMBIGUOUS",
  "CAP_180_PATIENT_LINK_BELOW_ROUTE_REQUIREMENT",
  "CAP_180_BINDING_AUTHORITY_CURRENT",
  "CAP_180_BINDING_REQUIRED",
  "CAP_180_BINDING_VERSION_DRIFT",
  "CAP_180_BINDING_REPAIR_OR_REVOKED",
  "CAP_180_AGE_POLICY_ACCEPTED",
  "CAP_180_AGE_POLICY_BLOCKED",
  "CAP_180_RESTRICTION_DENY",
  "CAP_180_RESTRICTION_RECOVER_ONLY",
  "CAP_180_RESTRICTION_STEP_UP",
  "CAP_180_ROUTE_SENSITIVITY_ACCEPTED",
  "CAP_180_FUTURE_PROFILE_DENIED",
  "CAP_180_CHANNEL_CEILING_ACCEPTED",
  "CAP_180_CHANNEL_CEILING_BLOCKED",
  "CAP_180_RELEASE_POSTURE_ACCEPTED",
  "CAP_180_RELEASE_POSTURE_DRIFT",
  "CAP_180_MANIFEST_POSTURE_DRIFT",
  "CAP_180_SAME_LINEAGE_RECOVERY_AVAILABLE",
  "CAP_180_STEP_UP_PATH_AVAILABLE",
  "CAP_180_CAPABILITY_ALLOW",
  "CAP_180_CAPABILITY_DENIED",
  "CAP_180_SCOPE_ENVELOPE_CHECKED",
  "CAP_180_SCOPE_ENVELOPE_AUTHORIZED",
  "CAP_180_SCOPE_GRANT_FAMILY_DRIFT",
  "CAP_180_SCOPE_ROUTE_FAMILY_DRIFT",
  "CAP_180_SCOPE_ACTION_SCOPE_DRIFT",
  "CAP_180_SCOPE_GOVERNING_OBJECT_DRIFT",
  "CAP_180_SCOPE_GOVERNING_VERSION_DRIFT",
  "CAP_180_SCOPE_SESSION_EPOCH_DRIFT",
  "CAP_180_SCOPE_BINDING_VERSION_DRIFT",
  "CAP_180_SCOPE_LINEAGE_FENCE_DRIFT",
  "CAP_180_SCOPE_RELEASE_POSTURE_DRIFT",
  "CAP_180_SCOPE_MANIFEST_POSTURE_DRIFT",
  "CAP_180_SCOPE_CHANNEL_POSTURE_DRIFT",
  "CAP_180_SCOPE_AUDIENCE_DRIFT",
  "CAP_180_SCOPE_EXPIRED",
  "CAP_180_SCOPE_SUPERSEDED",
  "CAP_180_SCOPE_REDEMPTION_STATE_BLOCKED",
  "CAP_180_SCOPE_RECOVER_ONLY",
  "CAP_180_SCOPE_DENIED",
  "CAP_180_SCOPE_REPLAY_RETURNED",
] as const;

export type CapabilityDecisionReasonCode = (typeof CAPABILITY_DECISION_REASON_CODES)[number];

export const capabilityDecisionPolicyRegistry = Object.freeze({
  authority: CAPABILITY_DECISION_ENGINE_NAME,
  schemaVersion: CAPABILITY_DECISION_SCHEMA_VERSION,
  policyVersion: CAPABILITY_DECISION_POLICY_VERSION,
  routeProfileRegistryRef: CAPABILITY_ROUTE_PROFILE_REGISTRY_REF,
  decisionVocabulary: ["allow", "step_up_required", "recover_only", "deny"] as const,
  reasonCodes: CAPABILITY_DECISION_REASON_CODES,
});

export type CapabilityDecisionState = "allow" | "step_up_required" | "recover_only" | "deny";
export type ScopeEnvelopeAuthorizationState = "authorized" | "recover_only" | "deny";
export type IdentitySource =
  | "anonymous"
  | "nhs_login"
  | "secure_link"
  | "sms_continuation"
  | "staff_override"
  | "system";
export type VerificationLevel =
  | "none"
  | "contact_seeded"
  | "nhs_low"
  | "nhs_p9"
  | "nhs_p5_plus"
  | "manual_verified";
export type PatientLinkState =
  | "none"
  | "candidate"
  | "provisional_verified"
  | "verified_patient"
  | "ambiguous"
  | "conflict"
  | "repair_hold"
  | "revoked";
export type BindingAuthorityState =
  | "none"
  | "candidate"
  | "provisional_verified"
  | "verified_patient"
  | "claimed"
  | "corrected"
  | "revoked"
  | "repair_hold";
export type SessionRuntimeState =
  | "none"
  | "establishing"
  | "active"
  | "step_up_required"
  | "restricted"
  | "recovery_only"
  | "revoked"
  | "expired_idle"
  | "expired_absolute"
  | "terminated";
export type RouteSensitivityClass = "public" | "low" | "moderate" | "high" | "restricted";
export type DerivedTrustBand =
  | "deny"
  | "recover_only"
  | "anonymous_public"
  | "signed_in_basic"
  | "signed_in_verified"
  | "restricted";
export type MinimumLinkConfidenceBand = "none" | "candidate" | "verified" | "high";
export type AgeGateState = "not_applicable" | "pass" | "proxy_required" | "blocked" | "unknown";
export type AgePolicy = "none" | "minor_proxy_required" | "adult_only";
export type GrantFamily =
  | "draft_resume_minimal"
  | "public_status_minimal"
  | "claim_step_up"
  | "continuation_seeded_verified"
  | "continuation_challenge"
  | "transaction_action_minimal"
  | "support_recovery_minimal";
export type ActionScope =
  | "envelope_resume"
  | "status_view"
  | "claim"
  | "attachment_add"
  | "respond_more_info"
  | "waitlist_offer"
  | "alternative_offer"
  | "appointment_manage_entry"
  | "pharmacy_status_entry"
  | "callback_status_entry"
  | "callback_response"
  | "message_thread_entry"
  | "message_reply"
  | "contact_route_repair"
  | "secure_resume"
  | "identity_repair";
export type MaxGrantCeiling =
  | "none"
  | "draft_lease_only"
  | "continuation_recovery_only"
  | "authenticated_draft_only"
  | "request_status_read"
  | "request_attachment_write"
  | "future_denied";
export type WritableAuthorityState = "writable" | "read_only" | "blocked";
export type FreshnessState = "fresh" | "stale" | "expired";

export interface RouteCapabilityProfile {
  readonly routeProfileRef: string;
  readonly routeFamily: string;
  readonly actionScope: ActionScope;
  readonly sensitivityClass: RouteSensitivityClass;
  readonly requiresAuthenticatedSubject: boolean;
  readonly requiresHighAssuranceBinding: boolean;
  readonly requiresWritableAuthority: boolean;
  readonly supportsRecovery: boolean;
  readonly supportsStepUp: boolean;
  readonly grantFamiliesAllowed: readonly GrantFamily[];
  readonly channelCeiling: DerivedTrustBand;
  readonly releaseConstraints: {
    readonly requiredReleaseApprovalFreezeRef?: string | null;
    readonly requiredManifestVersionRef?: string | null;
    readonly allowFrozenChannel?: boolean;
  };
  readonly embeddedConstraints: {
    readonly embeddedAllowed: boolean;
    readonly minimumBridgeCapabilitiesRef?: string | null;
  };
  readonly minimumLinkConfidenceBand: MinimumLinkConfidenceBand;
  readonly restrictionChecks: readonly string[];
  readonly agePolicy: AgePolicy;
  readonly profileVersion: string;
  readonly requiredTrustBand: DerivedTrustBand;
  readonly maxGrantCeiling: MaxGrantCeiling;
  readonly writableAuthorityState: WritableAuthorityState;
  readonly lifecycle: "current" | "planned_phase2" | "future_profile_pending";
  readonly freshnessMinScore: number;
  readonly freshnessStepScore: number;
  readonly riskStepThreshold: number;
  readonly riskBlockThreshold: number;
  readonly decisionTtlSeconds: number;
  readonly reauthAfterSeconds: number | null;
  readonly recoveryPathRef: string | null;
  readonly stepUpPathRef: string | null;
  readonly reasonCodes: readonly string[];
}

export interface IdentityContextSnapshot {
  readonly identityContextRef: string;
  readonly subjectRef: string | null;
  readonly identitySource: IdentitySource;
  readonly verificationLevel: VerificationLevel;
  readonly ageGateState: AgeGateState;
  readonly restrictionReasonCodes: readonly string[];
  readonly evidenceEnvelopeRefs: readonly string[];
  readonly lastVerifiedAt: string;
  readonly expiresAt: string;
}

export interface PatientLinkSnapshot {
  readonly patientLinkRef: string | null;
  readonly linkState: PatientLinkState;
  readonly linkProbabilityLowerBound: number;
  readonly subjectProofLowerBound: number;
  readonly confidenceModelState: "calibrated" | "drift_review" | "out_of_domain";
  readonly bindingVersionRef: string | null;
}

export interface BindingAuthoritySnapshot {
  readonly identityBindingRef: string | null;
  readonly bindingState: BindingAuthorityState;
  readonly currentBindingVersionRef: string | null;
  readonly ownershipState: "none" | "claim_pending" | "claimed" | "revoked" | "repair_hold";
}

export interface SessionPostureSnapshot {
  readonly sessionRef: string | null;
  readonly sessionEpochRef: string | null;
  readonly sessionState: SessionRuntimeState;
  readonly routeAuthorityState: "none" | "auth_read_only" | "claim_pending" | "writable";
  readonly subjectBindingVersionRef: string | null;
  readonly authTime: string | null;
  readonly idleExpiresAt: string | null;
  readonly absoluteExpiresAt: string | null;
}

export interface RouteRuntimeTuple {
  readonly routeProfileRef?: string | null;
  readonly routeFamily: string;
  readonly actionScope: ActionScope;
  readonly governingObjectRef?: string | null;
  readonly governingObjectVersionRef?: string | null;
  readonly sessionEpochRef?: string | null;
  readonly subjectBindingVersionRef?: string | null;
  readonly lineageFenceRef?: string | null;
  readonly grantFamily?: GrantFamily | null;
  readonly releaseApprovalFreezeRef?: string | null;
  readonly manifestVersionRef?: string | null;
  readonly channelPosture?:
    | "web"
    | "secure_link"
    | "sms"
    | "embedded"
    | "support"
    | "frozen"
    | null;
  readonly embeddedPosture?: "not_embedded" | "trusted" | "degraded" | "frozen" | null;
  readonly audienceScope?: "patient_public" | "patient_authenticated" | "support" | "staff" | null;
  readonly visibilityScope?: "public_safe_summary" | "authenticated_summary" | "scoped_phi" | null;
}

export interface CapabilityEvaluationInput {
  readonly identityContext: IdentityContextSnapshot;
  readonly patientLink: PatientLinkSnapshot;
  readonly binding: BindingAuthoritySnapshot;
  readonly session: SessionPostureSnapshot;
  readonly routeTuple: RouteRuntimeTuple;
  readonly sameLineageRecoveryAvailable: boolean;
  readonly riskSignals?: readonly number[];
  readonly edgeCorrelationId?: string | null;
  readonly observedAt?: string;
}

export interface CapabilityDecisionRecord {
  readonly capabilityDecisionId: string;
  readonly schemaVersion: typeof CAPABILITY_DECISION_SCHEMA_VERSION;
  readonly policyVersion: typeof CAPABILITY_DECISION_POLICY_VERSION;
  readonly engineAuthority: typeof CAPABILITY_DECISION_ENGINE_NAME;
  readonly routeProfileRef: string;
  readonly routeProfileVersion: string | null;
  readonly identityContextRef: string;
  readonly subjectRef: string | null;
  readonly patientLinkRef: string | null;
  readonly identityBindingRef: string | null;
  readonly decisionState: CapabilityDecisionState;
  readonly decision: CapabilityDecisionState;
  readonly writableAuthorityState: WritableAuthorityState;
  readonly maxGrantCeiling: MaxGrantCeiling;
  readonly capabilityCeiling: DerivedTrustBand;
  readonly reasonCodes: readonly string[];
  readonly decisionInputs: {
    readonly identitySource: IdentitySource;
    readonly verificationLevel: VerificationLevel;
    readonly patientLinkPosture: PatientLinkState;
    readonly freshnessState: FreshnessState;
    readonly policyRestrictions: readonly string[];
    readonly routeProfileLifecycle: string;
  };
  readonly identityBindingMutation: "none";
  readonly capabilityIsCeilingOnly: true;
  readonly evaluatedAt: string;
  readonly expiresAt: string;
  readonly subjectBindingVersionRef: string | null;
  readonly sessionEpochRef: string | null;
  readonly lineageFenceRef: string | null;
  readonly derivedTrustBand: DerivedTrustBand;
  readonly trustFloor: DerivedTrustBand;
  readonly freshnessScore: number;
  readonly riskUpperBound: number;
  readonly routeTupleHash: string;
  readonly edgeCorrelationId: string | null;
  readonly stepUpPathRef: string | null;
  readonly recoveryPathRef: string | null;
}

export interface AccessGrantScopeEnvelope {
  readonly scopeEnvelopeRef: string;
  readonly grantFamily: GrantFamily;
  readonly actionScope: ActionScope;
  readonly routeFamily: string;
  readonly governingObjectRef: string | null;
  readonly governingObjectVersionRef: string | null;
  readonly sessionEpochRef: string | null;
  readonly subjectBindingVersionRef: string | null;
  readonly lineageFenceRef: string | null;
  readonly routeIntentBindingRef: string | null;
  readonly releaseApprovalFreezeRef: string | null;
  readonly manifestVersionRef: string | null;
  readonly channelPosture: RouteRuntimeTuple["channelPosture"];
  readonly embeddedPosture: RouteRuntimeTuple["embeddedPosture"];
  readonly audienceScope: RouteRuntimeTuple["audienceScope"];
  readonly visibilityScope: RouteRuntimeTuple["visibilityScope"];
  readonly expiresAt: string;
  readonly supersessionState: "live" | "rotated" | "superseded" | "revoked" | "expired";
  readonly redemptionState: "unredeemed" | "redeeming" | "redeemed" | "replayed";
  readonly scopeHash: string;
}

export interface ScopeEnvelopeAuthorizationInput {
  readonly scopeEnvelope: AccessGrantScopeEnvelope;
  readonly routeTuple: RouteRuntimeTuple;
  readonly sameLineageRecoveryAvailable: boolean;
  readonly idempotencyKey?: string | null;
  readonly observedAt?: string;
}

export interface ScopeEnvelopeAuthorizationRecord {
  readonly scopeEnvelopeAuthorizationId: string;
  readonly schemaVersion: typeof CAPABILITY_DECISION_SCHEMA_VERSION;
  readonly policyVersion: typeof CAPABILITY_DECISION_POLICY_VERSION;
  readonly scopeEnvelopeRef: string;
  readonly authorizationState: ScopeEnvelopeAuthorizationState;
  readonly routeTupleHash: string;
  readonly driftFields: readonly string[];
  readonly reasonCodes: readonly string[];
  readonly idempotencyKey: string;
  readonly authorizedAt: string;
  readonly expiresAt: string;
}

export interface RouteGuardAuthorizationInput extends CapabilityEvaluationInput {
  readonly scopeEnvelope?: AccessGrantScopeEnvelope | null;
  readonly scopeEnvelopeIdempotencyKey?: string | null;
}

export interface RouteGuardAuthorizationResult {
  readonly canProceed: boolean;
  readonly decisionState: CapabilityDecisionState;
  readonly capabilityDecision: CapabilityDecisionRecord;
  readonly scopeAuthorization: ScopeEnvelopeAuthorizationRecord | null;
  readonly reasonCodes: readonly string[];
}

export interface CapabilityDecisionEngineRepository {
  getDecisionById(capabilityDecisionId: string): Promise<CapabilityDecisionRecord | null>;
  saveDecision(decision: CapabilityDecisionRecord): Promise<CapabilityDecisionRecord>;
  getScopeAuthorizationByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<ScopeEnvelopeAuthorizationRecord | null>;
  saveScopeAuthorization(
    authorization: ScopeEnvelopeAuthorizationRecord,
  ): Promise<ScopeEnvelopeAuthorizationRecord>;
}

export interface CapabilityDecisionEngineRepositorySnapshots {
  readonly decisions: readonly CapabilityDecisionRecord[];
  readonly scopeAuthorizations: readonly ScopeEnvelopeAuthorizationRecord[];
}

export interface RouteCapabilityProfileRegistry {
  resolveProfile(routeTuple: RouteRuntimeTuple): RouteCapabilityProfile | null;
  getProfile(routeProfileRef: string): RouteCapabilityProfile | null;
  listProfiles(): readonly RouteCapabilityProfile[];
  validateStrict(): void;
}

export interface CapabilityDecisionEngineService {
  evaluateCapability(input: CapabilityEvaluationInput): Promise<CapabilityDecisionRecord>;
  authorizeScopeEnvelope(input: ScopeEnvelopeAuthorizationInput): Promise<{
    readonly authorization: ScopeEnvelopeAuthorizationRecord;
    readonly replayed: boolean;
  }>;
  authorizeRoute(input: RouteGuardAuthorizationInput): Promise<RouteGuardAuthorizationResult>;
}

export interface CapabilityDecisionEngineApplication {
  readonly capabilityDecisionEngine: CapabilityDecisionEngineService;
  readonly routeProfileRegistry: RouteCapabilityProfileRegistry;
  readonly repository: CapabilityDecisionEngineRepository;
  readonly migrationPlanRef: (typeof capabilityDecisionEngineMigrationPlanRefs)[number];
  readonly migrationPlanRefs: typeof capabilityDecisionEngineMigrationPlanRefs;
  readonly persistenceTables: typeof capabilityDecisionEnginePersistenceTables;
  readonly parallelInterfaceGaps: typeof capabilityDecisionEngineParallelInterfaceGaps;
  readonly policyRegistry: typeof capabilityDecisionPolicyRegistry;
}

const TRUST_RANK: Record<DerivedTrustBand, number> = {
  deny: 0,
  recover_only: 1,
  anonymous_public: 2,
  signed_in_basic: 3,
  signed_in_verified: 4,
  restricted: 5,
};

const DECISION_RANK: Record<CapabilityDecisionState, number> = {
  deny: 0,
  recover_only: 1,
  step_up_required: 2,
  allow: 3,
};

const REQUIRED_LINK_RANK: Record<MinimumLinkConfidenceBand, number> = {
  none: 0,
  candidate: 1,
  verified: 2,
  high: 3,
};

const LINK_RANK: Record<PatientLinkState, number> = {
  none: 0,
  candidate: 1,
  provisional_verified: 2,
  verified_patient: 3,
  ambiguous: 0,
  conflict: 0,
  repair_hold: 0,
  revoked: 0,
};

export const defaultRouteCapabilityProfiles = [
  {
    routeProfileRef: "RCP_180_ANONYMOUS_DRAFT_START",
    routeFamily: "rf_phase1_public_intake",
    actionScope: "envelope_resume",
    sensitivityClass: "public",
    requiresAuthenticatedSubject: false,
    requiresHighAssuranceBinding: false,
    requiresWritableAuthority: false,
    supportsRecovery: true,
    supportsStepUp: false,
    grantFamiliesAllowed: ["draft_resume_minimal"],
    channelCeiling: "anonymous_public",
    releaseConstraints: {},
    embeddedConstraints: { embeddedAllowed: false },
    minimumLinkConfidenceBand: "none",
    restrictionChecks: ["age_policy", "manual_override"],
    agePolicy: "none",
    profileVersion: "RCP_180.v1",
    requiredTrustBand: "anonymous_public",
    maxGrantCeiling: "draft_lease_only",
    writableAuthorityState: "read_only",
    lifecycle: "current",
    freshnessMinScore: 0.05,
    freshnessStepScore: 0.02,
    riskStepThreshold: 0.8,
    riskBlockThreshold: 0.95,
    decisionTtlSeconds: 300,
    reauthAfterSeconds: null,
    recoveryPathRef: "recovery://draft-resume",
    stepUpPathRef: null,
    reasonCodes: ["CAP_170_ANONYMOUS_DRAFT_START_ALLOWED"],
  },
  {
    routeProfileRef: "RCP_180_SIGNED_IN_DRAFT_START",
    routeFamily: "rf_phase2_authenticated_intake",
    actionScope: "envelope_resume",
    sensitivityClass: "low",
    requiresAuthenticatedSubject: true,
    requiresHighAssuranceBinding: false,
    requiresWritableAuthority: false,
    supportsRecovery: true,
    supportsStepUp: true,
    grantFamiliesAllowed: ["draft_resume_minimal", "claim_step_up"],
    channelCeiling: "signed_in_basic",
    releaseConstraints: {},
    embeddedConstraints: { embeddedAllowed: true },
    minimumLinkConfidenceBand: "candidate",
    restrictionChecks: ["age_policy", "session_freshness", "manual_override"],
    agePolicy: "none",
    profileVersion: "RCP_180.v1",
    requiredTrustBand: "signed_in_basic",
    maxGrantCeiling: "authenticated_draft_only",
    writableAuthorityState: "read_only",
    lifecycle: "planned_phase2",
    freshnessMinScore: 0.35,
    freshnessStepScore: 0.2,
    riskStepThreshold: 0.55,
    riskBlockThreshold: 0.9,
    decisionTtlSeconds: 300,
    reauthAfterSeconds: 1800,
    recoveryPathRef: "recovery://signed-in-draft",
    stepUpPathRef: "step-up://nhs-login",
    reasonCodes: ["CAP_170_SIGNED_IN_DRAFT_START_ALLOWED"],
  },
  {
    routeProfileRef: "RCP_180_AUTHENTICATED_REQUEST_STATUS_VIEW",
    routeFamily: "rf_phase2_authenticated_request_status",
    actionScope: "status_view",
    sensitivityClass: "high",
    requiresAuthenticatedSubject: true,
    requiresHighAssuranceBinding: true,
    requiresWritableAuthority: false,
    supportsRecovery: true,
    supportsStepUp: true,
    grantFamiliesAllowed: ["public_status_minimal", "support_recovery_minimal"],
    channelCeiling: "signed_in_verified",
    releaseConstraints: {},
    embeddedConstraints: { embeddedAllowed: true },
    minimumLinkConfidenceBand: "verified",
    restrictionChecks: ["age_policy", "session_freshness", "identity_repair", "manual_override"],
    agePolicy: "none",
    profileVersion: "RCP_180.v1",
    requiredTrustBand: "signed_in_verified",
    maxGrantCeiling: "request_status_read",
    writableAuthorityState: "read_only",
    lifecycle: "planned_phase2",
    freshnessMinScore: 0.45,
    freshnessStepScore: 0.25,
    riskStepThreshold: 0.45,
    riskBlockThreshold: 0.85,
    decisionTtlSeconds: 240,
    reauthAfterSeconds: 900,
    recoveryPathRef: "recovery://request-status",
    stepUpPathRef: "step-up://nhs-p9",
    reasonCodes: ["CAP_170_AUTH_STATUS_VIEW_ALLOWED"],
  },
  {
    routeProfileRef: "RCP_180_DRAFT_CLAIM_INTO_AUTHENTICATED_ACCOUNT",
    routeFamily: "rf_phase2_claim_redemption",
    actionScope: "claim",
    sensitivityClass: "high",
    requiresAuthenticatedSubject: true,
    requiresHighAssuranceBinding: false,
    requiresWritableAuthority: false,
    supportsRecovery: true,
    supportsStepUp: true,
    grantFamiliesAllowed: ["claim_step_up"],
    channelCeiling: "signed_in_verified",
    releaseConstraints: {},
    embeddedConstraints: { embeddedAllowed: true },
    minimumLinkConfidenceBand: "candidate",
    restrictionChecks: ["age_policy", "session_freshness", "grant_scope", "manual_override"],
    agePolicy: "none",
    profileVersion: "RCP_180.v1",
    requiredTrustBand: "signed_in_verified",
    maxGrantCeiling: "authenticated_draft_only",
    writableAuthorityState: "read_only",
    lifecycle: "planned_phase2",
    freshnessMinScore: 0.4,
    freshnessStepScore: 0.25,
    riskStepThreshold: 0.4,
    riskBlockThreshold: 0.85,
    decisionTtlSeconds: 180,
    reauthAfterSeconds: 900,
    recoveryPathRef: "recovery://claim",
    stepUpPathRef: "step-up://claim-nhs-p9",
    reasonCodes: ["CAP_170_DRAFT_CLAIM_REQUIRES_STEP_UP"],
  },
  {
    routeProfileRef: "RCP_180_POST_SIGN_IN_ATTACHMENT_ADDITION",
    routeFamily: "rf_phase2_authenticated_attachments",
    actionScope: "attachment_add",
    sensitivityClass: "restricted",
    requiresAuthenticatedSubject: true,
    requiresHighAssuranceBinding: true,
    requiresWritableAuthority: true,
    supportsRecovery: true,
    supportsStepUp: true,
    grantFamiliesAllowed: ["transaction_action_minimal"],
    channelCeiling: "signed_in_verified",
    releaseConstraints: {},
    embeddedConstraints: { embeddedAllowed: true },
    minimumLinkConfidenceBand: "high",
    restrictionChecks: ["age_policy", "session_freshness", "route_intent", "manual_override"],
    agePolicy: "none",
    profileVersion: "RCP_180.v1",
    requiredTrustBand: "signed_in_verified",
    maxGrantCeiling: "request_attachment_write",
    writableAuthorityState: "writable",
    lifecycle: "planned_phase2",
    freshnessMinScore: 0.55,
    freshnessStepScore: 0.35,
    riskStepThreshold: 0.35,
    riskBlockThreshold: 0.75,
    decisionTtlSeconds: 120,
    reauthAfterSeconds: 600,
    recoveryPathRef: "recovery://attachment-add",
    stepUpPathRef: "step-up://fresh-auth",
    reasonCodes: ["CAP_170_ATTACHMENT_ADD_ALLOWED_WITH_LINK"],
  },
  {
    routeProfileRef: "RCP_180_SMS_CONTINUATION_PHONE_SEEDED_DRAFT",
    routeFamily: "rf_phase2_sms_continuation",
    actionScope: "secure_resume",
    sensitivityClass: "moderate",
    requiresAuthenticatedSubject: false,
    requiresHighAssuranceBinding: false,
    requiresWritableAuthority: false,
    supportsRecovery: true,
    supportsStepUp: true,
    grantFamiliesAllowed: ["continuation_seeded_verified", "continuation_challenge"],
    channelCeiling: "recover_only",
    releaseConstraints: {},
    embeddedConstraints: { embeddedAllowed: false },
    minimumLinkConfidenceBand: "candidate",
    restrictionChecks: ["grant_scope", "lineage_fence", "manual_override"],
    agePolicy: "none",
    profileVersion: "RCP_180.v1",
    requiredTrustBand: "recover_only",
    maxGrantCeiling: "continuation_recovery_only",
    writableAuthorityState: "read_only",
    lifecycle: "planned_phase2",
    freshnessMinScore: 0.2,
    freshnessStepScore: 0.1,
    riskStepThreshold: 0.45,
    riskBlockThreshold: 0.8,
    decisionTtlSeconds: 120,
    reauthAfterSeconds: null,
    recoveryPathRef: "recovery://sms-continuation",
    stepUpPathRef: "step-up://continuation-challenge",
    reasonCodes: ["CAP_170_SMS_CONTINUATION_RECOVER_ONLY"],
  },
  {
    routeProfileRef: "RCP_180_IDENTITY_REPAIR_HOLD",
    routeFamily: "rf_phase2_identity_repair",
    actionScope: "identity_repair",
    sensitivityClass: "restricted",
    requiresAuthenticatedSubject: true,
    requiresHighAssuranceBinding: false,
    requiresWritableAuthority: false,
    supportsRecovery: true,
    supportsStepUp: false,
    grantFamiliesAllowed: ["support_recovery_minimal"],
    channelCeiling: "recover_only",
    releaseConstraints: {},
    embeddedConstraints: { embeddedAllowed: false },
    minimumLinkConfidenceBand: "none",
    restrictionChecks: ["identity_repair", "manual_override"],
    agePolicy: "none",
    profileVersion: "RCP_180.v1",
    requiredTrustBand: "recover_only",
    maxGrantCeiling: "continuation_recovery_only",
    writableAuthorityState: "blocked",
    lifecycle: "planned_phase2",
    freshnessMinScore: 0.05,
    freshnessStepScore: 0.02,
    riskStepThreshold: 0.2,
    riskBlockThreshold: 0.7,
    decisionTtlSeconds: 120,
    reauthAfterSeconds: null,
    recoveryPathRef: "recovery://identity-repair",
    stepUpPathRef: null,
    reasonCodes: ["CAP_170_IDENTITY_REPAIR_RECOVER_ONLY"],
  },
  {
    routeProfileRef: "RCP_180_FUTURE_PROTECTED_RECORDS",
    routeFamily: "rf_future_records",
    actionScope: "status_view",
    sensitivityClass: "restricted",
    requiresAuthenticatedSubject: true,
    requiresHighAssuranceBinding: true,
    requiresWritableAuthority: false,
    supportsRecovery: false,
    supportsStepUp: false,
    grantFamiliesAllowed: [],
    channelCeiling: "deny",
    releaseConstraints: {},
    embeddedConstraints: { embeddedAllowed: false },
    minimumLinkConfidenceBand: "high",
    restrictionChecks: ["future_surface_placeholder"],
    agePolicy: "adult_only",
    profileVersion: "RCP_180.v1",
    requiredTrustBand: "restricted",
    maxGrantCeiling: "future_denied",
    writableAuthorityState: "blocked",
    lifecycle: "future_profile_pending",
    freshnessMinScore: 1,
    freshnessStepScore: 1,
    riskStepThreshold: 0,
    riskBlockThreshold: 0,
    decisionTtlSeconds: 60,
    reauthAfterSeconds: null,
    recoveryPathRef: null,
    stepUpPathRef: null,
    reasonCodes: ["CAP_170_FUTURE_RECORDS_DENIED_PLACEHOLDER"],
  },
] as const satisfies readonly RouteCapabilityProfile[];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
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

function hashRef(prefix: string, value: unknown): string {
  return `${prefix}_${createHash("sha256").update(stableJson(value)).digest("hex").slice(0, 24)}`;
}

function addSeconds(iso: string, seconds: number): string {
  return new Date(new Date(iso).getTime() + seconds * 1000).toISOString();
}

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}

function normalizeRiskSignals(signals: readonly number[] | undefined): number {
  return Math.min(
    1,
    (signals ?? []).reduce((total, signal) => total + Math.max(0, Math.min(1, signal)), 0),
  );
}

function freshnessState(input: CapabilityEvaluationInput, observedAt: string): FreshnessState {
  const now = new Date(observedAt).getTime();
  const expiresAt = new Date(input.identityContext.expiresAt).getTime();
  if (Number.isNaN(expiresAt) || expiresAt <= now) {
    return "expired";
  }
  const lastVerifiedAt = new Date(input.identityContext.lastVerifiedAt).getTime();
  if (Number.isNaN(lastVerifiedAt) || now - lastVerifiedAt > 30 * 60 * 1000) {
    return "stale";
  }
  return "fresh";
}

function freshnessScore(input: CapabilityEvaluationInput, observedAt: string): number {
  const now = new Date(observedAt).getTime();
  const lastVerifiedAt = new Date(input.identityContext.lastVerifiedAt).getTime();
  if (Number.isNaN(now) || Number.isNaN(lastVerifiedAt)) {
    return 0;
  }
  const ageSeconds = Math.max(0, (now - lastVerifiedAt) / 1000);
  return Number(Math.exp(-ageSeconds / 1800).toFixed(6));
}

function minimumTrust(left: DerivedTrustBand, right: DerivedTrustBand): DerivedTrustBand {
  return TRUST_RANK[left] <= TRUST_RANK[right] ? left : right;
}

function subjectAssuranceBand(identity: IdentityContextSnapshot): DerivedTrustBand {
  if (identity.identitySource === "anonymous") {
    return "anonymous_public";
  }
  if (identity.identitySource === "sms_continuation" || identity.identitySource === "secure_link") {
    return identity.verificationLevel === "contact_seeded" ? "recover_only" : "signed_in_basic";
  }
  if (identity.identitySource === "staff_override" || identity.identitySource === "system") {
    return "restricted";
  }
  if (identity.verificationLevel === "nhs_p9" || identity.verificationLevel === "nhs_p5_plus") {
    return "signed_in_verified";
  }
  if (identity.verificationLevel === "manual_verified") {
    return "restricted";
  }
  if (identity.verificationLevel === "nhs_low") {
    return "signed_in_basic";
  }
  return "recover_only";
}

function patientLinkBand(
  profile: RouteCapabilityProfile,
  link: PatientLinkSnapshot,
): DerivedTrustBand {
  if (profile.minimumLinkConfidenceBand === "none") {
    return "restricted";
  }
  if (link.confidenceModelState !== "calibrated") {
    return "recover_only";
  }
  if (link.linkState === "verified_patient" && link.linkProbabilityLowerBound >= 0.95) {
    return "signed_in_verified";
  }
  if (link.linkState === "provisional_verified" && link.linkProbabilityLowerBound >= 0.85) {
    return "signed_in_basic";
  }
  if (link.linkState === "candidate" && link.linkProbabilityLowerBound >= 0.55) {
    return "signed_in_basic";
  }
  return "recover_only";
}

function ageBand(identity: IdentityContextSnapshot): DerivedTrustBand {
  if (identity.ageGateState === "blocked") {
    return "deny";
  }
  if (identity.ageGateState === "proxy_required" || identity.ageGateState === "unknown") {
    return "recover_only";
  }
  return "restricted";
}

function channelBand(
  profile: RouteCapabilityProfile,
  routeTuple: RouteRuntimeTuple,
): DerivedTrustBand {
  if (routeTuple.channelPosture === "frozen") {
    return profile.releaseConstraints.allowFrozenChannel ? "recover_only" : "deny";
  }
  if (routeTuple.channelPosture === "sms") {
    return minimumTrust(profile.channelCeiling, "recover_only");
  }
  if (routeTuple.channelPosture === "embedded") {
    return profile.embeddedConstraints.embeddedAllowed ? profile.channelCeiling : "recover_only";
  }
  return profile.channelCeiling;
}

function policyBand(identity: IdentityContextSnapshot): DerivedTrustBand {
  if (
    identity.restrictionReasonCodes.some((code) =>
      ["identity_repair_hold", "patient_link_conflict", "future_surface_placeholder"].includes(
        code,
      ),
    )
  ) {
    return "recover_only";
  }
  if (identity.restrictionReasonCodes.includes("manual_override_narrowed")) {
    return "recover_only";
  }
  return "restricted";
}

function applyState(
  current: CapabilityDecisionState,
  next: CapabilityDecisionState,
): CapabilityDecisionState {
  return DECISION_RANK[next] < DECISION_RANK[current] ? next : current;
}

function degradeForRecoverable(
  profile: RouteCapabilityProfile,
  recoveryAvailable: boolean,
  preferred: CapabilityDecisionState,
): CapabilityDecisionState {
  if (preferred === "step_up_required" && profile.supportsStepUp) {
    return "step_up_required";
  }
  if (profile.supportsRecovery && recoveryAvailable) {
    return "recover_only";
  }
  return "deny";
}

function assertProfile(profile: RouteCapabilityProfile): void {
  const requiredStrings = [
    profile.routeProfileRef,
    profile.routeFamily,
    profile.actionScope,
    profile.sensitivityClass,
    profile.profileVersion,
  ];
  if (requiredStrings.some((value) => value.length === 0)) {
    throw new Error("RouteCapabilityProfile requires non-empty route, action, and version fields.");
  }
  if (profile.decisionTtlSeconds <= 0) {
    throw new Error(`${profile.routeProfileRef} decisionTtlSeconds must be positive.`);
  }
  if (profile.freshnessStepScore > profile.freshnessMinScore) {
    throw new Error(`${profile.routeProfileRef} freshness step threshold exceeds allow threshold.`);
  }
  if (profile.riskStepThreshold > profile.riskBlockThreshold) {
    throw new Error(`${profile.routeProfileRef} risk step threshold exceeds block threshold.`);
  }
  if (
    profile.lifecycle !== "future_profile_pending" &&
    profile.grantFamiliesAllowed.length === 0 &&
    profile.maxGrantCeiling !== "none"
  ) {
    throw new Error(`${profile.routeProfileRef} with grant ceiling must declare grant families.`);
  }
}

export function createRouteCapabilityProfileRegistry(
  profiles: readonly RouteCapabilityProfile[] = defaultRouteCapabilityProfiles,
): RouteCapabilityProfileRegistry {
  const byRef = new Map<string, RouteCapabilityProfile>();
  const byTuple = new Map<string, RouteCapabilityProfile>();

  for (const profile of profiles) {
    assertProfile(profile);
    if (byRef.has(profile.routeProfileRef)) {
      throw new Error(`Duplicate RouteCapabilityProfile ref ${profile.routeProfileRef}.`);
    }
    const tupleKey = `${profile.routeFamily}::${profile.actionScope}`;
    if (byTuple.has(tupleKey)) {
      throw new Error(`Duplicate RouteCapabilityProfile tuple ${tupleKey}.`);
    }
    byRef.set(profile.routeProfileRef, clone(profile));
    byTuple.set(tupleKey, clone(profile));
  }

  return {
    resolveProfile(routeTuple) {
      if (routeTuple.routeProfileRef) {
        return clone(byRef.get(routeTuple.routeProfileRef) ?? null);
      }
      return clone(byTuple.get(`${routeTuple.routeFamily}::${routeTuple.actionScope}`) ?? null);
    },
    getProfile(routeProfileRef) {
      return clone(byRef.get(routeProfileRef) ?? null);
    },
    listProfiles() {
      return clone([...byRef.values()]);
    },
    validateStrict() {
      for (const profile of byRef.values()) {
        assertProfile(profile);
      }
    },
  };
}

function buildDecision(input: {
  readonly evaluation: CapabilityEvaluationInput;
  readonly profile: RouteCapabilityProfile | null;
  readonly decisionState: CapabilityDecisionState;
  readonly reasonCodes: readonly string[];
  readonly observedAt: string;
  readonly freshnessState: FreshnessState;
  readonly freshnessScore: number;
  readonly riskUpperBound: number;
  readonly derivedTrustBand: DerivedTrustBand;
}): CapabilityDecisionRecord {
  const profileRef = input.profile?.routeProfileRef ?? "RCP_180_UNKNOWN_PROTECTED_ROUTE";
  const expiresAt = addSeconds(input.observedAt, input.profile?.decisionTtlSeconds ?? 60);
  const routeTupleHash = hashRef("rth", input.evaluation.routeTuple);
  const subjectBindingVersionRef =
    input.evaluation.routeTuple.subjectBindingVersionRef ??
    input.evaluation.binding.currentBindingVersionRef ??
    input.evaluation.session.subjectBindingVersionRef;
  const sessionEpochRef =
    input.evaluation.routeTuple.sessionEpochRef ?? input.evaluation.session.sessionEpochRef;
  const lineageFenceRef = input.evaluation.routeTuple.lineageFenceRef ?? null;
  const reasonCodes = unique(input.reasonCodes);
  const capabilityDecisionId = hashRef("cdx", {
    policyVersion: CAPABILITY_DECISION_POLICY_VERSION,
    profileRef,
    identityContextRef: input.evaluation.identityContext.identityContextRef,
    routeTupleHash,
    reasonCodes,
    decisionState: input.decisionState,
    observedAt: input.observedAt,
  });

  return {
    capabilityDecisionId,
    schemaVersion: CAPABILITY_DECISION_SCHEMA_VERSION,
    policyVersion: CAPABILITY_DECISION_POLICY_VERSION,
    engineAuthority: CAPABILITY_DECISION_ENGINE_NAME,
    routeProfileRef: profileRef,
    routeProfileVersion: input.profile?.profileVersion ?? null,
    identityContextRef: input.evaluation.identityContext.identityContextRef,
    subjectRef: input.evaluation.identityContext.subjectRef,
    patientLinkRef: input.evaluation.patientLink.patientLinkRef,
    identityBindingRef: input.evaluation.binding.identityBindingRef,
    decisionState: input.decisionState,
    decision: input.decisionState,
    writableAuthorityState:
      input.decisionState === "allow"
        ? (input.profile?.writableAuthorityState ?? "blocked")
        : "blocked",
    maxGrantCeiling:
      input.decisionState === "allow"
        ? (input.profile?.maxGrantCeiling ?? "none")
        : input.decisionState === "recover_only"
          ? "continuation_recovery_only"
          : "none",
    capabilityCeiling: input.profile?.channelCeiling ?? "deny",
    reasonCodes,
    decisionInputs: {
      identitySource: input.evaluation.identityContext.identitySource,
      verificationLevel: input.evaluation.identityContext.verificationLevel,
      patientLinkPosture: input.evaluation.patientLink.linkState,
      freshnessState: input.freshnessState,
      policyRestrictions: input.evaluation.identityContext.restrictionReasonCodes,
      routeProfileLifecycle: input.profile?.lifecycle ?? "unknown",
    },
    identityBindingMutation: "none",
    capabilityIsCeilingOnly: true,
    evaluatedAt: input.observedAt,
    expiresAt,
    subjectBindingVersionRef: subjectBindingVersionRef ?? null,
    sessionEpochRef: sessionEpochRef ?? null,
    lineageFenceRef,
    derivedTrustBand: input.derivedTrustBand,
    trustFloor: input.profile?.requiredTrustBand ?? "deny",
    freshnessScore: input.freshnessScore,
    riskUpperBound: input.riskUpperBound,
    routeTupleHash,
    edgeCorrelationId: input.evaluation.edgeCorrelationId ?? null,
    stepUpPathRef:
      input.decisionState === "step_up_required" ? (input.profile?.stepUpPathRef ?? null) : null,
    recoveryPathRef:
      input.decisionState === "recover_only" ? (input.profile?.recoveryPathRef ?? null) : null,
  };
}

function evaluateCapabilityPure(
  registry: RouteCapabilityProfileRegistry,
  input: CapabilityEvaluationInput,
): CapabilityDecisionRecord {
  const observedAt = input.observedAt ?? new Date().toISOString();
  const profile = registry.resolveProfile(input.routeTuple);
  const riskUpperBound = normalizeRiskSignals(input.riskSignals);
  const currentFreshnessState = freshnessState(input, observedAt);
  const currentFreshnessScore = freshnessScore(input, observedAt);
  const reasons: string[] = ["CAP_180_ENGINE_CENTRAL_EVALUATION"];

  if (!profile) {
    return buildDecision({
      evaluation: input,
      profile,
      decisionState: "deny",
      reasonCodes: [
        ...reasons,
        "CAP_180_DENY_BY_DEFAULT",
        "CAP_180_UNKNOWN_ROUTE_PROFILE_DENIED",
        "CAP_180_CAPABILITY_DENIED",
      ],
      observedAt,
      freshnessState: currentFreshnessState,
      freshnessScore: currentFreshnessScore,
      riskUpperBound,
      derivedTrustBand: "deny",
    });
  }

  reasons.push("CAP_180_ROUTE_PROFILE_RESOLVED", "CAP_180_ROUTE_PROFILE_VALIDATED");
  let decisionState: CapabilityDecisionState = "allow";

  const subjectBand = subjectAssuranceBand(input.identityContext);
  let derivedTrustBand = subjectBand;

  if (profile.requiresAuthenticatedSubject && !input.identityContext.subjectRef) {
    reasons.push("CAP_180_AUTHENTICATED_SUBJECT_REQUIRED");
    decisionState = applyState(
      decisionState,
      degradeForRecoverable(profile, input.sameLineageRecoveryAvailable, "step_up_required"),
    );
  } else {
    reasons.push("CAP_180_SUBJECT_POSTURE_ACCEPTED");
  }

  if (TRUST_RANK[subjectBand] < TRUST_RANK[profile.requiredTrustBand]) {
    reasons.push("CAP_180_VERIFICATION_BELOW_ROUTE_REQUIREMENT");
    decisionState = applyState(
      decisionState,
      degradeForRecoverable(profile, input.sameLineageRecoveryAvailable, "step_up_required"),
    );
  }

  if (profile.requiresAuthenticatedSubject) {
    if (input.session.sessionState !== "active") {
      reasons.push("CAP_180_SESSION_REQUIRED", "CAP_180_SESSION_STALE_OR_EXPIRED");
      decisionState = applyState(
        decisionState,
        degradeForRecoverable(profile, input.sameLineageRecoveryAvailable, "recover_only"),
      );
    } else if (
      input.routeTuple.sessionEpochRef &&
      input.session.sessionEpochRef &&
      input.routeTuple.sessionEpochRef !== input.session.sessionEpochRef
    ) {
      reasons.push("CAP_180_SESSION_EPOCH_DRIFT");
      decisionState = applyState(
        decisionState,
        degradeForRecoverable(profile, input.sameLineageRecoveryAvailable, "recover_only"),
      );
    } else {
      reasons.push("CAP_180_SESSION_CURRENT");
    }
  }

  const linkBand = patientLinkBand(profile, input.patientLink);
  derivedTrustBand = minimumTrust(derivedTrustBand, linkBand);
  if (["ambiguous", "conflict", "repair_hold", "revoked"].includes(input.patientLink.linkState)) {
    reasons.push("CAP_180_PATIENT_LINK_AMBIGUOUS");
    decisionState = applyState(
      decisionState,
      degradeForRecoverable(profile, input.sameLineageRecoveryAvailable, "recover_only"),
    );
  } else if (
    LINK_RANK[input.patientLink.linkState] < REQUIRED_LINK_RANK[profile.minimumLinkConfidenceBand]
  ) {
    reasons.push("CAP_180_PATIENT_LINK_BELOW_ROUTE_REQUIREMENT");
    decisionState = applyState(
      decisionState,
      degradeForRecoverable(profile, input.sameLineageRecoveryAvailable, "step_up_required"),
    );
  } else {
    reasons.push("CAP_180_PATIENT_LINK_ACCEPTED");
  }

  if (["repair_hold", "revoked"].includes(input.binding.bindingState)) {
    reasons.push("CAP_180_BINDING_REPAIR_OR_REVOKED");
    decisionState = applyState(
      decisionState,
      degradeForRecoverable(profile, input.sameLineageRecoveryAvailable, "recover_only"),
    );
  } else if (profile.requiresHighAssuranceBinding && !input.binding.currentBindingVersionRef) {
    reasons.push("CAP_180_BINDING_REQUIRED");
    decisionState = applyState(
      decisionState,
      degradeForRecoverable(profile, input.sameLineageRecoveryAvailable, "step_up_required"),
    );
  } else if (
    input.routeTuple.subjectBindingVersionRef &&
    input.binding.currentBindingVersionRef &&
    input.routeTuple.subjectBindingVersionRef !== input.binding.currentBindingVersionRef
  ) {
    reasons.push("CAP_180_BINDING_VERSION_DRIFT");
    decisionState = applyState(
      decisionState,
      degradeForRecoverable(profile, input.sameLineageRecoveryAvailable, "recover_only"),
    );
  } else {
    reasons.push("CAP_180_BINDING_AUTHORITY_CURRENT");
  }

  const ageDerivedBand = ageBand(input.identityContext);
  derivedTrustBand = minimumTrust(derivedTrustBand, ageDerivedBand);
  if (
    input.identityContext.ageGateState === "blocked" ||
    (profile.agePolicy === "adult_only" && input.identityContext.ageGateState !== "pass")
  ) {
    reasons.push("CAP_180_AGE_POLICY_BLOCKED");
    decisionState = applyState(decisionState, "deny");
  } else {
    reasons.push("CAP_180_AGE_POLICY_ACCEPTED");
  }

  if (input.identityContext.restrictionReasonCodes.includes("future_surface_placeholder")) {
    reasons.push("CAP_180_RESTRICTION_DENY");
    decisionState = applyState(decisionState, "deny");
  } else if (
    input.identityContext.restrictionReasonCodes.some((code) =>
      ["identity_repair_hold", "patient_link_conflict", "manual_override_narrowed"].includes(code),
    )
  ) {
    reasons.push("CAP_180_RESTRICTION_RECOVER_ONLY");
    decisionState = applyState(
      decisionState,
      degradeForRecoverable(profile, input.sameLineageRecoveryAvailable, "recover_only"),
    );
  } else if (input.identityContext.restrictionReasonCodes.includes("session_stale")) {
    reasons.push("CAP_180_RESTRICTION_STEP_UP");
    decisionState = applyState(
      decisionState,
      degradeForRecoverable(profile, input.sameLineageRecoveryAvailable, "step_up_required"),
    );
  }
  derivedTrustBand = minimumTrust(derivedTrustBand, policyBand(input.identityContext));

  if (profile.lifecycle === "future_profile_pending") {
    reasons.push("CAP_180_FUTURE_PROFILE_DENIED");
    decisionState = applyState(decisionState, "deny");
  } else if (TRUST_RANK[derivedTrustBand] < TRUST_RANK[profile.requiredTrustBand]) {
    reasons.push(
      "CAP_180_ROUTE_SENSITIVITY_ACCEPTED",
      "CAP_180_VERIFICATION_BELOW_ROUTE_REQUIREMENT",
    );
    decisionState = applyState(
      decisionState,
      degradeForRecoverable(profile, input.sameLineageRecoveryAvailable, "step_up_required"),
    );
  } else {
    reasons.push("CAP_180_ROUTE_SENSITIVITY_ACCEPTED");
  }

  const currentChannelBand = channelBand(profile, input.routeTuple);
  derivedTrustBand = minimumTrust(derivedTrustBand, currentChannelBand);
  if (TRUST_RANK[currentChannelBand] === TRUST_RANK.deny) {
    reasons.push("CAP_180_CHANNEL_CEILING_BLOCKED");
    decisionState = applyState(decisionState, "deny");
  } else {
    reasons.push("CAP_180_CHANNEL_CEILING_ACCEPTED");
  }

  if (
    profile.releaseConstraints.requiredReleaseApprovalFreezeRef &&
    input.routeTuple.releaseApprovalFreezeRef !==
      profile.releaseConstraints.requiredReleaseApprovalFreezeRef
  ) {
    reasons.push("CAP_180_RELEASE_POSTURE_DRIFT");
    decisionState = applyState(
      decisionState,
      degradeForRecoverable(profile, input.sameLineageRecoveryAvailable, "recover_only"),
    );
  } else if (
    profile.releaseConstraints.requiredManifestVersionRef &&
    input.routeTuple.manifestVersionRef !== profile.releaseConstraints.requiredManifestVersionRef
  ) {
    reasons.push("CAP_180_MANIFEST_POSTURE_DRIFT");
    decisionState = applyState(
      decisionState,
      degradeForRecoverable(profile, input.sameLineageRecoveryAvailable, "recover_only"),
    );
  } else {
    reasons.push("CAP_180_RELEASE_POSTURE_ACCEPTED");
  }

  if (currentFreshnessState === "expired" || currentFreshnessScore < profile.freshnessStepScore) {
    reasons.push("CAP_180_SESSION_STALE_OR_EXPIRED");
    decisionState = applyState(
      decisionState,
      degradeForRecoverable(profile, input.sameLineageRecoveryAvailable, "recover_only"),
    );
  } else if (currentFreshnessScore < profile.freshnessMinScore) {
    reasons.push("CAP_180_RESTRICTION_STEP_UP");
    decisionState = applyState(
      decisionState,
      degradeForRecoverable(profile, input.sameLineageRecoveryAvailable, "step_up_required"),
    );
  }

  if (riskUpperBound >= profile.riskBlockThreshold) {
    reasons.push("CAP_180_RESTRICTION_DENY");
    decisionState = applyState(decisionState, "deny");
  } else if (riskUpperBound >= profile.riskStepThreshold) {
    reasons.push("CAP_180_RESTRICTION_STEP_UP");
    decisionState = applyState(
      decisionState,
      degradeForRecoverable(profile, input.sameLineageRecoveryAvailable, "step_up_required"),
    );
  }

  if (decisionState === "recover_only") {
    reasons.push("CAP_180_SAME_LINEAGE_RECOVERY_AVAILABLE");
  } else if (decisionState === "step_up_required") {
    reasons.push("CAP_180_STEP_UP_PATH_AVAILABLE");
  } else if (decisionState === "allow") {
    reasons.push(...profile.reasonCodes, "CAP_180_CAPABILITY_ALLOW");
  } else {
    reasons.push("CAP_180_CAPABILITY_DENIED");
  }

  return buildDecision({
    evaluation: input,
    profile,
    decisionState,
    reasonCodes: reasons,
    observedAt,
    freshnessState: currentFreshnessState,
    freshnessScore: currentFreshnessScore,
    riskUpperBound,
    derivedTrustBand,
  });
}

export function createInMemoryCapabilityDecisionEngineRepository(): CapabilityDecisionEngineRepository & {
  snapshots(): CapabilityDecisionEngineRepositorySnapshots;
} {
  const decisions = new Map<string, CapabilityDecisionRecord>();
  const scopeAuthorizations = new Map<string, ScopeEnvelopeAuthorizationRecord>();

  return {
    async getDecisionById(capabilityDecisionId) {
      const decision = decisions.get(capabilityDecisionId);
      return decision ? clone(decision) : null;
    },
    async saveDecision(decision) {
      const existing = decisions.get(decision.capabilityDecisionId);
      if (existing) {
        return clone(existing);
      }
      decisions.set(decision.capabilityDecisionId, clone(decision));
      return clone(decision);
    },
    async getScopeAuthorizationByIdempotencyKey(idempotencyKey) {
      const authorization = scopeAuthorizations.get(idempotencyKey);
      return authorization ? clone(authorization) : null;
    },
    async saveScopeAuthorization(authorization) {
      const existing = scopeAuthorizations.get(authorization.idempotencyKey);
      if (existing) {
        return clone(existing);
      }
      scopeAuthorizations.set(authorization.idempotencyKey, clone(authorization));
      return clone(authorization);
    },
    snapshots() {
      return {
        decisions: clone([...decisions.values()]),
        scopeAuthorizations: clone([...scopeAuthorizations.values()]),
      };
    },
  };
}

function optionalDrift(
  expected: string | null | undefined,
  actual: string | null | undefined,
): boolean {
  return expected !== null && expected !== undefined && expected !== (actual ?? null);
}

function scopeAuthorizationState(
  driftFields: readonly string[],
  reasons: readonly string[],
  sameLineageRecoveryAvailable: boolean,
): ScopeEnvelopeAuthorizationState {
  if (driftFields.length === 0) {
    return "authorized";
  }
  const terminal = reasons.some((reason) =>
    [
      "CAP_180_SCOPE_GRANT_FAMILY_DRIFT",
      "CAP_180_SCOPE_EXPIRED",
      "CAP_180_SCOPE_DENIED",
      "CAP_180_SCOPE_REDEMPTION_STATE_BLOCKED",
    ].includes(reason),
  );
  if (!terminal && sameLineageRecoveryAvailable) {
    return "recover_only";
  }
  if (
    terminal &&
    sameLineageRecoveryAvailable &&
    !reasons.includes("CAP_180_SCOPE_GRANT_FAMILY_DRIFT")
  ) {
    return "recover_only";
  }
  return "deny";
}

function buildScopeAuthorization(
  input: ScopeEnvelopeAuthorizationInput,
  reasons: readonly string[],
  driftFields: readonly string[],
  state: ScopeEnvelopeAuthorizationState,
  observedAt: string,
  idempotencyKey: string,
): ScopeEnvelopeAuthorizationRecord {
  const routeTupleHash = hashRef("rth", input.routeTuple);
  return {
    scopeEnvelopeAuthorizationId: hashRef("sea", {
      scopeEnvelopeRef: input.scopeEnvelope.scopeEnvelopeRef,
      routeTupleHash,
      state,
      reasons,
      idempotencyKey,
      observedAt,
    }),
    schemaVersion: CAPABILITY_DECISION_SCHEMA_VERSION,
    policyVersion: CAPABILITY_DECISION_POLICY_VERSION,
    scopeEnvelopeRef: input.scopeEnvelope.scopeEnvelopeRef,
    authorizationState: state,
    routeTupleHash,
    driftFields: unique(driftFields),
    reasonCodes: unique(reasons),
    idempotencyKey,
    authorizedAt: observedAt,
    expiresAt: input.scopeEnvelope.expiresAt,
  };
}

function authorizeScopeEnvelopePure(
  input: ScopeEnvelopeAuthorizationInput,
): ScopeEnvelopeAuthorizationRecord {
  const observedAt = input.observedAt ?? new Date().toISOString();
  const idempotencyKey =
    input.idempotencyKey ??
    hashRef("scope_idem", {
      envelope: input.scopeEnvelope.scopeEnvelopeRef,
      routeTuple: input.routeTuple,
      observedAt,
    });
  const reasons: string[] = ["CAP_180_SCOPE_ENVELOPE_CHECKED"];
  const driftFields: string[] = [];

  const flag = (field: string, reason: CapabilityDecisionReasonCode) => {
    driftFields.push(field);
    reasons.push(reason);
  };

  if (input.scopeEnvelope.grantFamily !== input.routeTuple.grantFamily) {
    flag("grantFamily", "CAP_180_SCOPE_GRANT_FAMILY_DRIFT");
  }
  if (input.scopeEnvelope.routeFamily !== input.routeTuple.routeFamily) {
    flag("routeFamily", "CAP_180_SCOPE_ROUTE_FAMILY_DRIFT");
  }
  if (input.scopeEnvelope.actionScope !== input.routeTuple.actionScope) {
    flag("actionScope", "CAP_180_SCOPE_ACTION_SCOPE_DRIFT");
  }
  if (optionalDrift(input.scopeEnvelope.governingObjectRef, input.routeTuple.governingObjectRef)) {
    flag("governingObjectRef", "CAP_180_SCOPE_GOVERNING_OBJECT_DRIFT");
  }
  if (
    optionalDrift(
      input.scopeEnvelope.governingObjectVersionRef,
      input.routeTuple.governingObjectVersionRef,
    )
  ) {
    flag("governingObjectVersionRef", "CAP_180_SCOPE_GOVERNING_VERSION_DRIFT");
  }
  if (optionalDrift(input.scopeEnvelope.sessionEpochRef, input.routeTuple.sessionEpochRef)) {
    flag("sessionEpochRef", "CAP_180_SCOPE_SESSION_EPOCH_DRIFT");
  }
  if (
    optionalDrift(
      input.scopeEnvelope.subjectBindingVersionRef,
      input.routeTuple.subjectBindingVersionRef,
    )
  ) {
    flag("subjectBindingVersionRef", "CAP_180_SCOPE_BINDING_VERSION_DRIFT");
  }
  if (optionalDrift(input.scopeEnvelope.lineageFenceRef, input.routeTuple.lineageFenceRef)) {
    flag("lineageFenceRef", "CAP_180_SCOPE_LINEAGE_FENCE_DRIFT");
  }
  if (
    optionalDrift(
      input.scopeEnvelope.releaseApprovalFreezeRef,
      input.routeTuple.releaseApprovalFreezeRef,
    )
  ) {
    flag("releaseApprovalFreezeRef", "CAP_180_SCOPE_RELEASE_POSTURE_DRIFT");
  }
  if (optionalDrift(input.scopeEnvelope.manifestVersionRef, input.routeTuple.manifestVersionRef)) {
    flag("manifestVersionRef", "CAP_180_SCOPE_MANIFEST_POSTURE_DRIFT");
  }
  if (optionalDrift(input.scopeEnvelope.channelPosture, input.routeTuple.channelPosture)) {
    flag("channelPosture", "CAP_180_SCOPE_CHANNEL_POSTURE_DRIFT");
  }
  if (optionalDrift(input.scopeEnvelope.audienceScope, input.routeTuple.audienceScope)) {
    flag("audienceScope", "CAP_180_SCOPE_AUDIENCE_DRIFT");
  }
  if (optionalDrift(input.scopeEnvelope.visibilityScope, input.routeTuple.visibilityScope)) {
    flag("visibilityScope", "CAP_180_SCOPE_AUDIENCE_DRIFT");
  }
  if (new Date(input.scopeEnvelope.expiresAt).getTime() <= new Date(observedAt).getTime()) {
    flag("expiresAt", "CAP_180_SCOPE_EXPIRED");
  }
  if (input.scopeEnvelope.supersessionState !== "live") {
    flag("supersessionState", "CAP_180_SCOPE_SUPERSEDED");
  }
  if (
    input.scopeEnvelope.redemptionState !== "unredeemed" &&
    input.scopeEnvelope.redemptionState !== "redeeming"
  ) {
    flag("redemptionState", "CAP_180_SCOPE_REDEMPTION_STATE_BLOCKED");
  }

  const state = scopeAuthorizationState(driftFields, reasons, input.sameLineageRecoveryAvailable);
  if (state === "authorized") {
    reasons.push("CAP_180_SCOPE_ENVELOPE_AUTHORIZED");
  } else if (state === "recover_only") {
    reasons.push("CAP_180_SCOPE_RECOVER_ONLY");
  } else {
    reasons.push("CAP_180_SCOPE_DENIED");
  }

  return buildScopeAuthorization(input, reasons, driftFields, state, observedAt, idempotencyKey);
}

export function createCapabilityDecisionEngineService(input: {
  readonly repository: CapabilityDecisionEngineRepository;
  readonly routeProfileRegistry?: RouteCapabilityProfileRegistry;
}): CapabilityDecisionEngineService {
  const routeProfileRegistry = input.routeProfileRegistry ?? createRouteCapabilityProfileRegistry();
  routeProfileRegistry.validateStrict();

  return {
    async evaluateCapability(evaluationInput) {
      const decision = evaluateCapabilityPure(routeProfileRegistry, evaluationInput);
      return input.repository.saveDecision(decision);
    },
    async authorizeScopeEnvelope(scopeInput) {
      const observedAt = scopeInput.observedAt ?? new Date().toISOString();
      const idempotencyKey =
        scopeInput.idempotencyKey ??
        hashRef("scope_idem", {
          envelope: scopeInput.scopeEnvelope.scopeEnvelopeRef,
          routeTuple: scopeInput.routeTuple,
          observedAt,
        });
      const existing = await input.repository.getScopeAuthorizationByIdempotencyKey(idempotencyKey);
      if (existing) {
        return {
          authorization: {
            ...existing,
            reasonCodes: unique([...existing.reasonCodes, "CAP_180_SCOPE_REPLAY_RETURNED"]),
          },
          replayed: true,
        };
      }
      const authorization = authorizeScopeEnvelopePure({
        ...scopeInput,
        idempotencyKey,
        observedAt,
      });
      return {
        authorization: await input.repository.saveScopeAuthorization(authorization),
        replayed: false,
      };
    },
    async authorizeRoute(routeInput) {
      const capabilityDecision = await this.evaluateCapability(routeInput);
      const scopeAuthorization = routeInput.scopeEnvelope
        ? (
            await this.authorizeScopeEnvelope({
              scopeEnvelope: routeInput.scopeEnvelope,
              routeTuple: routeInput.routeTuple,
              sameLineageRecoveryAvailable: routeInput.sameLineageRecoveryAvailable,
              idempotencyKey: routeInput.scopeEnvelopeIdempotencyKey,
              observedAt: routeInput.observedAt,
            })
          ).authorization
        : null;
      const scopeState = scopeAuthorization?.authorizationState ?? "authorized";
      let decisionState = capabilityDecision.decisionState;
      if (scopeState === "recover_only") {
        decisionState = applyState(decisionState, "recover_only");
      }
      if (scopeState === "deny") {
        decisionState = "deny";
      }
      const reasonCodes = unique([
        ...capabilityDecision.reasonCodes,
        ...(scopeAuthorization?.reasonCodes ?? []),
      ]);
      return {
        canProceed: decisionState === "allow" && scopeState === "authorized",
        decisionState,
        capabilityDecision,
        scopeAuthorization,
        reasonCodes,
      };
    },
  };
}

export function createCapabilityDecisionEngineApplication(
  input: {
    readonly repository?: CapabilityDecisionEngineRepository;
    readonly routeProfileRegistry?: RouteCapabilityProfileRegistry;
  } = {},
): CapabilityDecisionEngineApplication {
  const repository = input.repository ?? createInMemoryCapabilityDecisionEngineRepository();
  const routeProfileRegistry = input.routeProfileRegistry ?? createRouteCapabilityProfileRegistry();
  return {
    capabilityDecisionEngine: createCapabilityDecisionEngineService({
      repository,
      routeProfileRegistry,
    }),
    routeProfileRegistry,
    repository,
    migrationPlanRef: capabilityDecisionEngineMigrationPlanRefs[0],
    migrationPlanRefs: capabilityDecisionEngineMigrationPlanRefs,
    persistenceTables: capabilityDecisionEnginePersistenceTables,
    parallelInterfaceGaps: capabilityDecisionEngineParallelInterfaceGaps,
    policyRegistry: capabilityDecisionPolicyRegistry,
  };
}
