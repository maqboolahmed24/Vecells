import { createHash } from "node:crypto";

export const PHASE7_NHS_APP_MANIFEST_SERVICE_NAME = "Phase7NhsAppManifestAndJumpOffService";
export const PHASE7_NHS_APP_MANIFEST_SCHEMA_VERSION = "377.phase7.manifest-service.v1";

export const PHASE7_MANIFEST_VERSION = "nhsapp-manifest-v0.1.0-freeze-374";
export const PHASE7_CONFIG_FINGERPRINT = "sha256:374-manifest-tuples-f488ecd-local-freeze-v1";
export const PHASE7_RELEASE_CANDIDATE_REF = "release-candidate:phase7-nhs-app-contract-freeze-374";
export const PHASE7_RELEASE_APPROVAL_FREEZE_REF =
  "ReleaseApprovalFreeze:RAF-P7-374-CONTRACT-FREEZE";
export const PHASE7_BEHAVIOR_CONTRACT_SET_REF = "BehaviorContractSet:phase7-nhs-app-first-wave";
export const PHASE7_SURFACE_SCHEMA_SET_REF = "SurfaceSchemaSet:phase7-patient-routes-v1";
export const PHASE7_COMPATIBILITY_EVIDENCE_REF =
  "CompatibilityEvidence:phase7-bridge-floor-freeze-374";
export const PHASE7_MINIMUM_BRIDGE_REF =
  "MinimumBridgeCapabilities:phase7-embedded-floor-375-pending";
export const PHASE7_EMBEDDED_NAV_ELIGIBILITY_REF =
  "PatientEmbeddedNavEligibility:phase7-nav-floor-375-pending";
export const PHASE7_INTAKE_CONVERGENCE_REF =
  "IntakeConvergenceContract:phase1-browser-and-nhsapp-shared-v1";

export type NhsAppEnvironment =
  | "local_preview"
  | "sandpit"
  | "aos"
  | "limited_release"
  | "full_release";

export type JourneyClassification =
  | "safe_for_nhs_app_now"
  | "needs_embedded_adaptation_first"
  | "not_suitable_in_phase7";

export type JumpOffResolutionStatus = "resolved" | "blocked";
export type RouteExposureState = "exposed" | "blocked" | "inventory_only" | "excluded";
export type EnvironmentParityState = "matching" | "blocked";

export type ManifestBlockedReason =
  | "not_in_manifest"
  | "cohort_blocked"
  | "environment_mismatch"
  | "requires_embedded_adaptation"
  | "pending_continuity_validation"
  | "config_fingerprint_mismatch"
  | "manifest_version_mismatch"
  | "release_tuple_mismatch"
  | "ods_rule_blocked"
  | "route_excluded";

export interface NhsAppIntegrationManifest {
  manifestId: string;
  manifestVersion: string;
  baseUrlsByEnvironment: Record<NhsAppEnvironment, string>;
  allowedJourneyPaths: string[];
  jumpOffMappings: JumpOffMapping[];
  requiresNhsLogin: boolean;
  supportsEmbeddedMode: boolean;
  minimumBridgeCapabilitiesRef: string;
  telemetryContractRef: string;
  cohortRules: {
    defaultReleaseCohortRef: string;
    limitedReleaseCohortRef: string;
    fullReleaseCohortRef: string;
    odsRuleSetRef: string;
    partialVisibilityIsManifested: boolean;
  };
  serviceDeskProfileRef: string;
  evidencePackRef: string;
  configFingerprint: string;
  releaseCandidateRef: string;
  releaseApprovalFreezeRef: string;
  behaviorContractSetRef: string;
  surfaceSchemaSetRef: string;
  compatibilityEvidenceRef: string;
  approvedAt: string;
  supersedesManifestId: string | null;
  changeNoticeRef: string;
  currentReleaseState: string;
}

export interface JourneyPathDefinition {
  journeyPathId: string;
  routePattern: string;
  journeyType: string;
  classification: JourneyClassification;
  requiresAuth: boolean;
  minimumAssuranceLevel: string;
  supportsResume: boolean;
  supportsDeepLink: boolean;
  embeddedReadinessState: string;
  minimumBridgeCapabilitiesRef: string;
  embeddedNavEligibilityContractRef: string;
  fallbackRoute: string;
  routeOwner: string;
  changeClass: string;
  channelFallbackBehaviour: string;
  shellConsistencyProfileRef: string;
  visibilityTierRef: string;
  summarySafetyTier: string;
  placeholderContractRef: string;
  requiresStepUpForFullDetail: boolean;
  continuityControlCode: string;
  continuityEvidenceContractRef: string;
  intakeConvergenceContractRef: string;
  outboundNavigationPolicyRef: string;
  artifactPresentationContractRef: string;
  routeFreezeDispositionRef: string;
}

export interface JumpOffMapping {
  mappingId: string;
  nhsAppPlacement: string;
  odsVisibilityRule: string;
  journeyPathId: string;
  copyVariantRef: string;
  releaseCohortRef: string;
}

export interface IntegrationEvidencePack {
  evidencePackId: string;
  demoEnvironmentUrl: string;
  uxAuditRefs: string[];
  clinicalSafetyRefs: string[];
  privacyRefs: string[];
  SCALRefs: string[];
  incidentRunbookRefs: string[];
}

export interface ServiceDeskProfile {
  serviceDeskProfileId: string;
  publicFacingContactMethods: string[];
  documentedSupportHours: string;
  majorIncidentContactPath: string;
  clinicalSafetyContactRef: string;
  serviceManagementProtocolRef: string;
  lastReviewedAt: string;
}

export interface ManifestPromotionBundle {
  bundleId: string;
  manifestVersion: string;
  environment: NhsAppEnvironment;
  configFingerprint: string;
  releaseCandidateRef: string;
  releaseApprovalFreezeRef: string;
  behaviorContractSetRef: string;
  surfaceSchemaSetRef: string;
  compatibilityEvidenceRef: string;
  approvedBy: string;
  promotedAt: string | null;
  rollbackRef: string;
}

export interface NhsAppContinuityEvidenceBundle {
  bundleId: string;
  manifestVersionRef: string;
  journeyPathRef: string;
  continuityControlCode: string;
  governingContractRef: string;
  experienceContinuityEvidenceRefs: string[];
  validationState: "trusted" | "degraded" | "missing" | "stale";
  blockingRefs: string[];
  releaseApprovalFreezeRef: string;
  capturedAt: string;
}

export interface EnvironmentManifestPin {
  environment: NhsAppEnvironment;
  baseUrl: string;
  manifestVersion: string;
  configFingerprint: string;
  releaseApprovalFreezeRef: string;
  externalApprovalState: string;
  routeExposureState: string;
  driftDisposition: string;
}

export interface ManifestAuditRecord {
  auditId: string;
  eventType:
    | "manifest_lookup"
    | "environment_resolution"
    | "journey_path_lookup"
    | "jump_off_resolution"
    | "supersession_recorded"
    | "environment_pin_updated"
    | "evidence_pack_lookup";
  manifestVersionRef: string | null;
  configFingerprintRef: string | null;
  environment: NhsAppEnvironment | null;
  journeyPathRef: string | null;
  placementRef: string | null;
  odsCodeHash: string | null;
  blockedReasons: ManifestBlockedReason[];
  recordedAt: string;
}

export interface ManifestRepositorySeed {
  manifests: NhsAppIntegrationManifest[];
  journeyPaths: JourneyPathDefinition[];
  environmentPins: EnvironmentManifestPin[];
  evidencePacks: IntegrationEvidencePack[];
  serviceDeskProfiles: ServiceDeskProfile[];
  promotionBundles: ManifestPromotionBundle[];
  continuityEvidenceBundles: NhsAppContinuityEvidenceBundle[];
}

export interface EnvironmentResolutionInput {
  environment: NhsAppEnvironment;
  expectedManifestVersion?: string;
  expectedConfigFingerprint?: string;
  expectedReleaseApprovalFreezeRef?: string;
}

export interface EnvironmentResolutionResult {
  environment: NhsAppEnvironment;
  baseUrl: string | null;
  manifestVersion: string | null;
  configFingerprint: string | null;
  releaseApprovalFreezeRef: string | null;
  parityState: EnvironmentParityState;
  blockedReasons: ManifestBlockedReason[];
  manifest: NhsAppIntegrationManifest | null;
  auditRecord: ManifestAuditRecord;
}

export interface JourneyPathLookupResult {
  journeyPath: JourneyPathDefinition | null;
  inManifest: boolean;
  exposureState: RouteExposureState;
  blockedReasons: ManifestBlockedReason[];
  continuityEvidence: NhsAppContinuityEvidenceBundle | null;
  auditRecord: ManifestAuditRecord;
}

export interface JumpOffResolutionInput extends EnvironmentResolutionInput {
  nhsAppPlacement: string;
  odsCode?: string;
  releaseCohortRef: string;
}

export interface JumpOffResolutionResult {
  status: JumpOffResolutionStatus;
  exposureState: RouteExposureState;
  blockedReasons: ManifestBlockedReason[];
  environment: EnvironmentResolutionResult;
  mapping: JumpOffMapping | null;
  journeyPath: JourneyPathDefinition | null;
  continuityEvidence: NhsAppContinuityEvidenceBundle | null;
  jumpOffUrlTemplate: string | null;
  copyVariantRef: string | null;
  routeMetadata: Pick<
    JourneyPathDefinition,
    | "routeOwner"
    | "visibilityTierRef"
    | "summarySafetyTier"
    | "placeholderContractRef"
    | "intakeConvergenceContractRef"
    | "continuityControlCode"
    | "continuityEvidenceContractRef"
    | "routeFreezeDispositionRef"
  > | null;
  auditRecord: ManifestAuditRecord;
}

export interface ManifestExposureRoute {
  journeyPathId: string;
  routePattern: string;
  journeyType: string;
  classification: JourneyClassification;
  exposureState: RouteExposureState;
  blockedReasons: ManifestBlockedReason[];
  routeOwner: string;
  visibilityTierRef: string;
  summarySafetyTier: string;
  placeholderContractRef: string;
  intakeConvergenceContractRef: string;
  continuityEvidenceContractRef: string;
  routeFreezeDispositionRef: string;
}

export interface ManifestExposureResult {
  environment: EnvironmentResolutionResult;
  manifestVersion: string | null;
  configFingerprint: string | null;
  releaseTuple: {
    releaseCandidateRef: string | null;
    releaseApprovalFreezeRef: string | null;
    behaviorContractSetRef: string | null;
    surfaceSchemaSetRef: string | null;
    compatibilityEvidenceRef: string | null;
  };
  routes: ManifestExposureRoute[];
  jumpOffMappings: JumpOffMapping[];
  evidencePackRef: string | null;
  serviceDeskProfileRef: string | null;
}

export interface OnboardingEvidenceResolutionResult {
  manifestVersion: string;
  evidencePack: IntegrationEvidencePack;
  serviceDeskProfile: ServiceDeskProfile;
  promotionBundles: ManifestPromotionBundle[];
  continuityEvidenceBundles: NhsAppContinuityEvidenceBundle[];
  blockedReasons: ManifestBlockedReason[];
  auditRecord: ManifestAuditRecord;
}

export const phase7ManifestExposureRoutes = [
  {
    routeId: "phase7_nhs_app_manifest_current",
    method: "GET",
    path: "/internal/v1/nhs-app/manifest/current",
    contractFamily: "NHSAppIntegrationManifestExposureContract",
    purpose:
      "Expose the pinned immutable NHS App manifest tuple and route inventory for one environment.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "phase7_nhs_app_journey_path_lookup",
    method: "GET",
    path: "/internal/v1/nhs-app/journey-paths/{journeyPathId}",
    contractFamily: "JourneyPathDefinitionLookupContract",
    purpose:
      "Resolve manifest-owned route metadata, visibility tier, summary safety tier, placeholder, convergence, and freeze refs.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "phase7_nhs_app_jump_off_resolve",
    method: "POST",
    path: "/internal/v1/nhs-app/jump-offs:resolve",
    contractFamily: "JumpOffMappingResolutionContract",
    purpose:
      "Resolve deterministic NHS App jump-off exposure by placement, ODS rule, release cohort, environment, manifest version, and config fingerprint.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "phase7_nhs_app_environment_resolve",
    method: "GET",
    path: "/internal/v1/nhs-app/environments/{environment}",
    contractFamily: "NHSAppEnvironmentProfileResolutionContract",
    purpose:
      "Resolve base URL, manifestVersion, configFingerprint, and release tuple parity for one environment.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "phase7_nhs_app_onboarding_evidence_refs",
    method: "GET",
    path: "/internal/v1/nhs-app/onboarding/evidence",
    contractFamily: "IntegrationEvidencePackReferenceContract",
    purpose:
      "Expose evidence pack, service desk, promotion, and continuity refs without claiming external approval.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
] as const;

const RECORDED_AT = "2026-04-27T00:10:15.000Z";

const BASE_URLS_BY_ENVIRONMENT: Record<NhsAppEnvironment, string> = {
  local_preview: "https://local.vecells.invalid/nhs-app-preview",
  sandpit: "https://sandpit.vecells.invalid/nhs-app",
  aos: "https://aos.vecells.invalid/nhs-app",
  limited_release: "https://limited-release.vecells.invalid/nhs-app",
  full_release: "https://www.vecells.invalid/nhs-app",
};

const FIRST_WAVE_ALLOWED_JOURNEY_PATHS = [
  "jp_start_medical_request",
  "jp_start_admin_request",
  "jp_continue_draft",
  "jp_request_status",
  "jp_respond_more_info",
  "jp_manage_local_appointment",
  "jp_pharmacy_choice",
  "jp_pharmacy_status",
] as const;

const ENVIRONMENT_PINS: EnvironmentManifestPin[] = [
  {
    environment: "local_preview",
    baseUrl: BASE_URLS_BY_ENVIRONMENT.local_preview,
    manifestVersion: PHASE7_MANIFEST_VERSION,
    configFingerprint: PHASE7_CONFIG_FINGERPRINT,
    releaseApprovalFreezeRef: PHASE7_RELEASE_APPROVAL_FREEZE_REF,
    externalApprovalState: "not_applicable_local_contract_freeze",
    routeExposureState: "contract_test_only",
    driftDisposition: "block_without_superseding_manifest",
  },
  {
    environment: "sandpit",
    baseUrl: BASE_URLS_BY_ENVIRONMENT.sandpit,
    manifestVersion: PHASE7_MANIFEST_VERSION,
    configFingerprint: PHASE7_CONFIG_FINGERPRINT,
    releaseApprovalFreezeRef: PHASE7_RELEASE_APPROVAL_FREEZE_REF,
    externalApprovalState: "not_requested",
    routeExposureState: "same_manifest_tuple_required",
    driftDisposition: "block_without_superseding_manifest",
  },
  {
    environment: "aos",
    baseUrl: BASE_URLS_BY_ENVIRONMENT.aos,
    manifestVersion: PHASE7_MANIFEST_VERSION,
    configFingerprint: PHASE7_CONFIG_FINGERPRINT,
    releaseApprovalFreezeRef: PHASE7_RELEASE_APPROVAL_FREEZE_REF,
    externalApprovalState: "not_requested",
    routeExposureState: "same_manifest_tuple_required",
    driftDisposition: "block_without_superseding_manifest",
  },
  {
    environment: "limited_release",
    baseUrl: BASE_URLS_BY_ENVIRONMENT.limited_release,
    manifestVersion: PHASE7_MANIFEST_VERSION,
    configFingerprint: PHASE7_CONFIG_FINGERPRINT,
    releaseApprovalFreezeRef: PHASE7_RELEASE_APPROVAL_FREEZE_REF,
    externalApprovalState: "future_gate",
    routeExposureState: "same_manifest_tuple_required",
    driftDisposition: "block_without_superseding_manifest",
  },
  {
    environment: "full_release",
    baseUrl: BASE_URLS_BY_ENVIRONMENT.full_release,
    manifestVersion: PHASE7_MANIFEST_VERSION,
    configFingerprint: PHASE7_CONFIG_FINGERPRINT,
    releaseApprovalFreezeRef: PHASE7_RELEASE_APPROVAL_FREEZE_REF,
    externalApprovalState: "future_gate",
    routeExposureState: "same_manifest_tuple_required",
    driftDisposition: "block_without_superseding_manifest",
  },
];

const JUMP_OFF_MAPPINGS: JumpOffMapping[] = [
  {
    mappingId: "jom_start_medical_request",
    nhsAppPlacement: "gp_services_ask_gp_medical",
    odsVisibilityRule: "ods_rule_registered_practice_manifest_enabled",
    journeyPathId: "jp_start_medical_request",
    copyVariantRef: "copy:nhsapp-start-medical-request-v1",
    releaseCohortRef: "cohort:phase7-internal-sandpit-only",
  },
  {
    mappingId: "jom_start_admin_request",
    nhsAppPlacement: "gp_services_ask_gp_admin",
    odsVisibilityRule: "ods_rule_registered_practice_manifest_enabled",
    journeyPathId: "jp_start_admin_request",
    copyVariantRef: "copy:nhsapp-start-admin-request-v1",
    releaseCohortRef: "cohort:phase7-internal-sandpit-only",
  },
  {
    mappingId: "jom_request_status",
    nhsAppPlacement: "gp_services_request_status",
    odsVisibilityRule: "ods_rule_request_lineage_visible_to_practice",
    journeyPathId: "jp_request_status",
    copyVariantRef: "copy:nhsapp-request-status-v1",
    releaseCohortRef: "cohort:phase7-internal-sandpit-only",
  },
  {
    mappingId: "jom_appointment_manage",
    nhsAppPlacement: "appointments_manage_local",
    odsVisibilityRule: "ods_rule_booking_provider_manifest_enabled",
    journeyPathId: "jp_manage_local_appointment",
    copyVariantRef: "copy:nhsapp-manage-appointment-v1",
    releaseCohortRef: "cohort:phase7-internal-sandpit-only",
  },
  {
    mappingId: "jom_pharmacy_choice",
    nhsAppPlacement: "gp_services_pharmacy_choice",
    odsVisibilityRule: "ods_rule_pharmacy_loop_manifest_enabled",
    journeyPathId: "jp_pharmacy_choice",
    copyVariantRef: "copy:nhsapp-pharmacy-choice-v1",
    releaseCohortRef: "cohort:phase7-internal-sandpit-only",
  },
  {
    mappingId: "jom_pharmacy_status",
    nhsAppPlacement: "gp_services_pharmacy_status",
    odsVisibilityRule: "ods_rule_pharmacy_loop_visible_to_patient",
    journeyPathId: "jp_pharmacy_status",
    copyVariantRef: "copy:nhsapp-pharmacy-status-v1",
    releaseCohortRef: "cohort:phase7-internal-sandpit-only",
  },
];

const INTEGRATION_MANIFEST: NhsAppIntegrationManifest = {
  manifestId: "nhs-app-integration-manifest-374-freeze",
  manifestVersion: PHASE7_MANIFEST_VERSION,
  baseUrlsByEnvironment: BASE_URLS_BY_ENVIRONMENT,
  allowedJourneyPaths: [...FIRST_WAVE_ALLOWED_JOURNEY_PATHS],
  jumpOffMappings: JUMP_OFF_MAPPINGS,
  requiresNhsLogin: true,
  supportsEmbeddedMode: true,
  minimumBridgeCapabilitiesRef: PHASE7_MINIMUM_BRIDGE_REF,
  telemetryContractRef: "TelemetryContract:phase7-nhs-app-route-and-sso-events-376-pending",
  cohortRules: {
    defaultReleaseCohortRef: "cohort:phase7-internal-sandpit-only",
    limitedReleaseCohortRef: "cohort:future-nhs-app-limited-release",
    fullReleaseCohortRef: "cohort:future-nhs-app-full-release",
    odsRuleSetRef: "OdsVisibilityRuleSet:nhs-app-phase7-first-wave-v1",
    partialVisibilityIsManifested: true,
  },
  serviceDeskProfileRef: "service-desk-profile-374-primary",
  evidencePackRef: "integration-evidence-pack-374-nonprod",
  configFingerprint: PHASE7_CONFIG_FINGERPRINT,
  releaseCandidateRef: PHASE7_RELEASE_CANDIDATE_REF,
  releaseApprovalFreezeRef: PHASE7_RELEASE_APPROVAL_FREEZE_REF,
  behaviorContractSetRef: PHASE7_BEHAVIOR_CONTRACT_SET_REF,
  surfaceSchemaSetRef: PHASE7_SURFACE_SCHEMA_SET_REF,
  compatibilityEvidenceRef: PHASE7_COMPATIBILITY_EVIDENCE_REF,
  approvedAt: RECORDED_AT,
  supersedesManifestId: null,
  changeNoticeRef: "ChangeNotice:CN-P7-374-INITIAL-FREEZE",
  currentReleaseState: "contract_frozen_not_promoted",
};

const SHARED_JOURNEY_REFS = {
  minimumBridgeCapabilitiesRef: PHASE7_MINIMUM_BRIDGE_REF,
  embeddedNavEligibilityContractRef: PHASE7_EMBEDDED_NAV_ELIGIBILITY_REF,
  shellConsistencyProfileRef: "PatientShellConsistencyProfile:patient-persistent-shell-v1",
  visibilityTierRef: "VisibilityTier:nhs-app-first-wave-summary",
  placeholderContractRef: "PlaceholderContract:nhs-app-same-shell-bounded-recovery-v1",
  outboundNavigationPolicyRef: "OutboundNavigationPolicy:nhs-app-governed-handoff-v1",
  artifactPresentationContractRef: "ArtifactPresentationContract:summary-first-nhs-app-v1",
  routeFreezeDispositionRef: "RouteFreezeDisposition:nhs-app-freeze-in-place-v1",
};

function buildJourneyPath(
  input: Pick<
    JourneyPathDefinition,
    | "journeyPathId"
    | "routePattern"
    | "journeyType"
    | "classification"
    | "embeddedReadinessState"
    | "fallbackRoute"
    | "routeOwner"
    | "changeClass"
    | "channelFallbackBehaviour"
    | "summarySafetyTier"
    | "requiresStepUpForFullDetail"
    | "continuityControlCode"
    | "continuityEvidenceContractRef"
    | "intakeConvergenceContractRef"
  > &
    Partial<
      Pick<
        JourneyPathDefinition,
        | "visibilityTierRef"
        | "placeholderContractRef"
        | "outboundNavigationPolicyRef"
        | "artifactPresentationContractRef"
        | "routeFreezeDispositionRef"
      >
    >,
): JourneyPathDefinition {
  return {
    requiresAuth: true,
    minimumAssuranceLevel: "nhs_login_p9_or_equivalent",
    supportsResume: true,
    supportsDeepLink: true,
    ...SHARED_JOURNEY_REFS,
    ...input,
  };
}

const JOURNEY_PATHS: JourneyPathDefinition[] = [
  buildJourneyPath({
    journeyPathId: "jp_start_medical_request",
    routePattern: "/requests/new?type=medical",
    journeyType: "medical_request_intake",
    classification: "safe_for_nhs_app_now",
    embeddedReadinessState: "candidate_ready_contract_frozen",
    fallbackRoute: "/requests/new?channel=browser",
    routeOwner: "patient_intake",
    changeClass: "minor_manifest_change_with_intake_regression",
    channelFallbackBehaviour: "same_shell_browser_fallback_with_draft_preserved",
    summarySafetyTier: "clinical_entry_summary_with_red_flag_disclaimer",
    requiresStepUpForFullDetail: false,
    continuityControlCode: "intake_resume",
    continuityEvidenceContractRef: "RouteContinuityEvidenceContract:intake-resume-v1",
    intakeConvergenceContractRef: PHASE7_INTAKE_CONVERGENCE_REF,
  }),
  buildJourneyPath({
    journeyPathId: "jp_start_admin_request",
    routePattern: "/requests/new?type=admin",
    journeyType: "admin_request_intake",
    classification: "safe_for_nhs_app_now",
    embeddedReadinessState: "candidate_ready_contract_frozen",
    fallbackRoute: "/requests/new?channel=browser",
    routeOwner: "patient_intake",
    changeClass: "minor_manifest_change_with_intake_regression",
    channelFallbackBehaviour: "same_shell_browser_fallback_with_draft_preserved",
    summarySafetyTier: "admin_entry_summary_with_scope_disclaimer",
    requiresStepUpForFullDetail: false,
    continuityControlCode: "intake_resume",
    continuityEvidenceContractRef: "RouteContinuityEvidenceContract:intake-resume-v1",
    intakeConvergenceContractRef: PHASE7_INTAKE_CONVERGENCE_REF,
  }),
  buildJourneyPath({
    journeyPathId: "jp_continue_draft",
    routePattern: "/requests/drafts/:draftId",
    journeyType: "draft_resume",
    classification: "safe_for_nhs_app_now",
    embeddedReadinessState: "candidate_ready_contract_frozen",
    fallbackRoute: "/requests",
    routeOwner: "patient_intake",
    changeClass: "minor_manifest_change_with_resume_regression",
    channelFallbackBehaviour: "same_shell_restore_or_claim_recovery",
    summarySafetyTier: "draft_provenance_summary",
    requiresStepUpForFullDetail: false,
    continuityControlCode: "intake_resume",
    continuityEvidenceContractRef: "RouteContinuityEvidenceContract:intake-resume-v1",
    intakeConvergenceContractRef: PHASE7_INTAKE_CONVERGENCE_REF,
  }),
  buildJourneyPath({
    journeyPathId: "jp_request_status",
    routePattern: "/requests/:requestId/status",
    journeyType: "request_status",
    classification: "safe_for_nhs_app_now",
    embeddedReadinessState: "candidate_ready_contract_frozen",
    fallbackRoute: "/requests",
    routeOwner: "patient_status",
    changeClass: "minor_manifest_change_with_status_regression",
    channelFallbackBehaviour: "summary_only_status_with_browser_recovery",
    summarySafetyTier: "status_summary_only",
    requiresStepUpForFullDetail: false,
    continuityControlCode: "patient_nav",
    continuityEvidenceContractRef: "RouteContinuityEvidenceContract:patient-navigation-v1",
    intakeConvergenceContractRef: "IntakeConvergenceContract:not_applicable_status_projection",
  }),
  buildJourneyPath({
    journeyPathId: "jp_respond_more_info",
    routePattern: "/requests/:requestId/more-info/:checkpointId",
    journeyType: "more_info_response",
    classification: "safe_for_nhs_app_now",
    embeddedReadinessState: "candidate_ready_contract_frozen",
    fallbackRoute: "/requests/:requestId/status",
    routeOwner: "more_info",
    changeClass: "major_manifest_change_if_payload_shape_changes",
    channelFallbackBehaviour: "preserve_checkpoint_and_block_stale_reply",
    summarySafetyTier: "reply_checkpoint_summary",
    requiresStepUpForFullDetail: false,
    continuityControlCode: "more_info_reply",
    continuityEvidenceContractRef: "RouteContinuityEvidenceContract:more-info-reply-v1",
    intakeConvergenceContractRef: "IntakeConvergenceContract:not_applicable_more_info_reply",
  }),
  buildJourneyPath({
    journeyPathId: "jp_manage_local_appointment",
    routePattern: "/appointments/:appointmentId/manage",
    journeyType: "appointment_manage",
    classification: "safe_for_nhs_app_now",
    embeddedReadinessState: "candidate_ready_contract_frozen",
    fallbackRoute: "/appointments",
    routeOwner: "booking",
    changeClass: "major_manifest_change_if_writable_scope_changes",
    channelFallbackBehaviour: "summary_only_manage_when_command_posture_not_trusted",
    summarySafetyTier: "appointment_summary_first",
    requiresStepUpForFullDetail: false,
    continuityControlCode: "booking_manage",
    continuityEvidenceContractRef: "RouteContinuityEvidenceContract:booking-manage-v1",
    intakeConvergenceContractRef: "IntakeConvergenceContract:not_applicable_booking_manage",
  }),
  buildJourneyPath({
    journeyPathId: "jp_pharmacy_choice",
    routePattern: "/requests/:requestId/pharmacy/choice",
    journeyType: "pharmacy_choice",
    classification: "safe_for_nhs_app_now",
    embeddedReadinessState: "candidate_ready_contract_frozen",
    fallbackRoute: "/requests/:requestId/status",
    routeOwner: "pharmacy_loop",
    changeClass: "major_manifest_change_if_provider_choice_scope_changes",
    channelFallbackBehaviour: "choice_set_summary_or_same_shell_repair",
    summarySafetyTier: "pharmacy_choice_disclosure",
    requiresStepUpForFullDetail: false,
    continuityControlCode: "pharmacy_console_settlement",
    continuityEvidenceContractRef: "RouteContinuityEvidenceContract:pharmacy-loop-settlement-v1",
    intakeConvergenceContractRef: "IntakeConvergenceContract:not_applicable_pharmacy_choice",
  }),
  buildJourneyPath({
    journeyPathId: "jp_pharmacy_status",
    routePattern: "/requests/:requestId/pharmacy/status",
    journeyType: "pharmacy_status",
    classification: "safe_for_nhs_app_now",
    embeddedReadinessState: "candidate_ready_contract_frozen",
    fallbackRoute: "/requests/:requestId/status",
    routeOwner: "pharmacy_loop",
    changeClass: "minor_manifest_change_with_status_regression",
    channelFallbackBehaviour: "pharmacy_summary_with_practice_visibility_recovery",
    summarySafetyTier: "pharmacy_status_summary_only",
    requiresStepUpForFullDetail: false,
    continuityControlCode: "pharmacy_console_settlement",
    continuityEvidenceContractRef: "RouteContinuityEvidenceContract:pharmacy-loop-settlement-v1",
    intakeConvergenceContractRef: "IntakeConvergenceContract:not_applicable_pharmacy_status",
  }),
  buildJourneyPath({
    journeyPathId: "jp_waitlist_offer_response",
    routePattern: "/appointments/waitlist/:offerId/respond",
    journeyType: "waitlist_offer_response",
    classification: "needs_embedded_adaptation_first",
    embeddedReadinessState: "requires_deadline_and_native_back_adaptation",
    fallbackRoute: "/appointments",
    routeOwner: "booking",
    changeClass: "major_manifest_change_before_visibility",
    channelFallbackBehaviour: "show_offer_summary_and_open_browser_until_adapted",
    visibilityTierRef: "VisibilityTier:nhs-app-hidden-until-adapted",
    summarySafetyTier: "deadline_sensitive_summary",
    requiresStepUpForFullDetail: false,
    continuityControlCode: "booking_manage",
    continuityEvidenceContractRef: "RouteContinuityEvidenceContract:booking-manage-v1",
    intakeConvergenceContractRef: "IntakeConvergenceContract:not_applicable_waitlist",
  }),
  buildJourneyPath({
    journeyPathId: "jp_hub_alternative_offer",
    routePattern: "/appointments/hub-offers/:offerId",
    journeyType: "hub_alternative_offer",
    classification: "needs_embedded_adaptation_first",
    embeddedReadinessState: "requires_cross_org_scope_and_return_anchor_adaptation",
    fallbackRoute: "/appointments",
    routeOwner: "booking_hub",
    changeClass: "major_manifest_change_before_visibility",
    channelFallbackBehaviour: "summary_only_until_cross_org_scope_trusted",
    visibilityTierRef: "VisibilityTier:nhs-app-hidden-until-adapted",
    summarySafetyTier: "cross_org_offer_summary",
    requiresStepUpForFullDetail: true,
    continuityControlCode: "hub_booking_manage",
    continuityEvidenceContractRef: "RouteContinuityEvidenceContract:hub-booking-manage-v1",
    intakeConvergenceContractRef: "IntakeConvergenceContract:not_applicable_hub_offer",
  }),
  buildJourneyPath({
    journeyPathId: "jp_records_letters_summary",
    routePattern: "/records/letters/:letterId",
    journeyType: "record_letter_summary",
    classification: "needs_embedded_adaptation_first",
    embeddedReadinessState: "requires_file_download_and_artifact_adaptation",
    fallbackRoute: "/records",
    routeOwner: "records",
    changeClass: "major_manifest_change_before_visibility",
    channelFallbackBehaviour: "summary_first_no_raw_download_until_bridge_ready",
    visibilityTierRef: "VisibilityTier:nhs-app-hidden-until-adapted",
    summarySafetyTier: "record_summary_with_masking",
    requiresStepUpForFullDetail: true,
    continuityControlCode: "record_continuation",
    continuityEvidenceContractRef: "RouteContinuityEvidenceContract:record-continuation-v1",
    intakeConvergenceContractRef: "IntakeConvergenceContract:not_applicable_records",
  }),
  buildJourneyPath({
    journeyPathId: "jp_patient_message_thread",
    routePattern: "/messages/:threadId",
    journeyType: "patient_message_thread",
    classification: "needs_embedded_adaptation_first",
    embeddedReadinessState: "requires_notification_return_and_thread_settlement_adaptation",
    fallbackRoute: "/messages",
    routeOwner: "communications",
    changeClass: "major_manifest_change_before_visibility",
    channelFallbackBehaviour: "thread_summary_only_until_settlement_ready",
    visibilityTierRef: "VisibilityTier:nhs-app-hidden-until-adapted",
    summarySafetyTier: "conversation_summary_with_reply_fence",
    requiresStepUpForFullDetail: true,
    continuityControlCode: "conversation_settlement",
    continuityEvidenceContractRef: "RouteContinuityEvidenceContract:conversation-settlement-v1",
    intakeConvergenceContractRef: "IntakeConvergenceContract:not_applicable_messages",
  }),
  {
    ...buildJourneyPath({
      journeyPathId: "jp_urgent_emergency_advice",
      routePattern: "/urgent-and-emergency-care",
      journeyType: "urgent_emergency_advice",
      classification: "not_suitable_in_phase7",
      embeddedReadinessState: "out_of_scope_nhs_app_manifest",
      fallbackRoute: "/",
      routeOwner: "public_information",
      changeClass: "not_applicable",
      channelFallbackBehaviour: "browser_public_safety_signposting_only",
      visibilityTierRef: "VisibilityTier:not-in-nhs-app-phase7",
      summarySafetyTier: "public_safety_signposting",
      requiresStepUpForFullDetail: false,
      continuityControlCode: "public_safety_signposting",
      continuityEvidenceContractRef:
        "RouteContinuityEvidenceContract:not_applicable_public_information",
      intakeConvergenceContractRef: "IntakeConvergenceContract:not_applicable_public_information",
    }),
    requiresAuth: false,
    minimumAssuranceLevel: "not_applicable_public_information",
    supportsResume: false,
    supportsDeepLink: false,
    outboundNavigationPolicyRef: "OutboundNavigationPolicy:public-safety-browser-only",
    artifactPresentationContractRef: "ArtifactPresentationContract:not_applicable",
    routeFreezeDispositionRef: "RouteFreezeDisposition:not_applicable_public_information",
  },
];

const EVIDENCE_PACKS: IntegrationEvidencePack[] = [
  {
    evidencePackId: "integration-evidence-pack-374-nonprod",
    demoEnvironmentUrl: BASE_URLS_BY_ENVIRONMENT.local_preview,
    uxAuditRefs: [
      "UXAudit:manual-wcag-2-2-aa-required-before-partner-demo",
      "UXAudit:nhs-service-manual-alignment-required-before-partner-demo",
    ],
    clinicalSafetyRefs: [
      "ClinicalSafety:DCB0129-hazard-log-required-before-scal",
      "ClinicalSafety:DCB0160-consumer-alignment-required-before-scal",
    ],
    privacyRefs: ["Privacy:DPIA-nhs-app-embedded-context-required-before-scal"],
    SCALRefs: ["SCAL:future-nhs-app-supplier-conformance-assessment"],
    incidentRunbookRefs: ["IncidentRunbook:nhs-app-major-incident-rehearsal-required"],
  },
];

const SERVICE_DESK_PROFILES: ServiceDeskProfile[] = [
  {
    serviceDeskProfileId: "service-desk-profile-374-primary",
    publicFacingContactMethods: [
      "patient_help_form:future-public-facing-service-desk",
      "telephone:future-service-desk-number",
    ],
    documentedSupportHours:
      "Monday to Friday 08:00-18:30 UK local time for non-urgent support; urgent clinical advice signposts to existing NHS urgent pathways",
    majorIncidentContactPath: "MajorIncidentContactPath:nhs-app-service-management-bridge-required",
    clinicalSafetyContactRef: "ClinicalSafetyContact:phase7-clinical-safety-officer",
    serviceManagementProtocolRef: "ServiceManagementProtocol:nhs-app-incident-rehearsal-required",
    lastReviewedAt: RECORDED_AT,
  },
];

const PROMOTION_BUNDLES: ManifestPromotionBundle[] = [
  {
    bundleId: "manifest-promotion-bundle-374-local-preview",
    manifestVersion: PHASE7_MANIFEST_VERSION,
    environment: "local_preview",
    configFingerprint: PHASE7_CONFIG_FINGERPRINT,
    releaseCandidateRef: PHASE7_RELEASE_CANDIDATE_REF,
    releaseApprovalFreezeRef: PHASE7_RELEASE_APPROVAL_FREEZE_REF,
    behaviorContractSetRef: PHASE7_BEHAVIOR_CONTRACT_SET_REF,
    surfaceSchemaSetRef: PHASE7_SURFACE_SCHEMA_SET_REF,
    compatibilityEvidenceRef: PHASE7_COMPATIBILITY_EVIDENCE_REF,
    approvedBy: "local-contract-freeze-only",
    promotedAt: null,
    rollbackRef: "RollbackPlan:phase7-nhs-app-disable-all-jump-offs",
  },
];

const CONTINUITY_EVIDENCE_BUNDLES: NhsAppContinuityEvidenceBundle[] = [
  {
    bundleId: "continuity-374-jp-start-medical-request",
    manifestVersionRef: PHASE7_MANIFEST_VERSION,
    journeyPathRef: "jp_start_medical_request",
    continuityControlCode: "intake_resume",
    governingContractRef: "RouteContinuityEvidenceContract:intake-resume-v1",
    experienceContinuityEvidenceRefs: [
      "ExperienceContinuityControlEvidence:intake-resume-browser-parity-required",
    ],
    validationState: "degraded",
    blockingRefs: ["WAIT_FOR_375_378_379_EMBEDDED_SSO_PROOF"],
    releaseApprovalFreezeRef: PHASE7_RELEASE_APPROVAL_FREEZE_REF,
    capturedAt: RECORDED_AT,
  },
  {
    bundleId: "continuity-374-jp-pharmacy-status",
    manifestVersionRef: PHASE7_MANIFEST_VERSION,
    journeyPathRef: "jp_pharmacy_status",
    continuityControlCode: "pharmacy_console_settlement",
    governingContractRef: "RouteContinuityEvidenceContract:pharmacy-loop-settlement-v1",
    experienceContinuityEvidenceRefs: [
      "ExperienceContinuityControlEvidence:phase6-pharmacy-loop-local-proof",
    ],
    validationState: "trusted",
    blockingRefs: [],
    releaseApprovalFreezeRef: PHASE7_RELEASE_APPROVAL_FREEZE_REF,
    capturedAt: RECORDED_AT,
  },
];

export const defaultPhase7ManifestSeed: ManifestRepositorySeed = {
  manifests: [INTEGRATION_MANIFEST],
  journeyPaths: JOURNEY_PATHS,
  environmentPins: ENVIRONMENT_PINS,
  evidencePacks: EVIDENCE_PACKS,
  serviceDeskProfiles: SERVICE_DESK_PROFILES,
  promotionBundles: PROMOTION_BUNDLES,
  continuityEvidenceBundles: CONTINUITY_EVIDENCE_BUNDLES,
};

const COHORT_ENVIRONMENT_ALLOWLIST: Record<string, NhsAppEnvironment[]> = {
  "cohort:phase7-internal-sandpit-only": ["local_preview", "sandpit"],
  "cohort:future-nhs-app-limited-release": ["limited_release"],
  "cohort:future-nhs-app-full-release": ["full_release"],
};

const ODS_VISIBILITY_ALLOWLIST: Record<string, Set<string>> = {
  ods_rule_registered_practice_manifest_enabled: new Set(["A83001", "B82001"]),
  ods_rule_request_lineage_visible_to_practice: new Set(["A83001", "B82001"]),
  ods_rule_booking_provider_manifest_enabled: new Set(["A83001"]),
  ods_rule_pharmacy_loop_manifest_enabled: new Set(["A83001", "F001"]),
  ods_rule_pharmacy_loop_visible_to_patient: new Set(["A83001", "F001"]),
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }
  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function hashString(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function appendUnique<T>(values: T[], value: T): void {
  if (!values.includes(value)) {
    values.push(value);
  }
}

function requireNonEmpty(value: string, field: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`INVALID_${field.toUpperCase()}: ${field} is required.`);
  }
  return trimmed;
}

function assertManifestTuple(manifest: NhsAppIntegrationManifest): void {
  if (!manifest.configFingerprint.startsWith("sha256:")) {
    throw new Error("INVALID_CONFIG_FINGERPRINT: manifest configFingerprint must be sha256.");
  }
  if (manifest.releaseApprovalFreezeRef !== PHASE7_RELEASE_APPROVAL_FREEZE_REF) {
    throw new Error("RELEASE_TUPLE_MISMATCH: manifest release approval freeze drifted.");
  }
  if (!manifest.supportsEmbeddedMode || !manifest.requiresNhsLogin) {
    throw new Error(
      "INVALID_MANIFEST_POSTURE: NHS App manifest requires embedded mode and NHS login.",
    );
  }
}

function buildAuditRecord(input: {
  eventType: ManifestAuditRecord["eventType"];
  manifestVersionRef?: string | null;
  configFingerprintRef?: string | null;
  environment?: NhsAppEnvironment | null;
  journeyPathRef?: string | null;
  placementRef?: string | null;
  odsCode?: string | null;
  blockedReasons?: ManifestBlockedReason[];
}): ManifestAuditRecord {
  const odsCodeHash = input.odsCode ? hashString(input.odsCode.toUpperCase()) : null;
  const blockedReasons = [...(input.blockedReasons ?? [])].sort();
  const auditId = `audit:377:${input.eventType}:${hashString(
    stableStringify({
      manifestVersionRef: input.manifestVersionRef ?? null,
      configFingerprintRef: input.configFingerprintRef ?? null,
      environment: input.environment ?? null,
      journeyPathRef: input.journeyPathRef ?? null,
      placementRef: input.placementRef ?? null,
      odsCodeHash,
      blockedReasons,
    }),
  ).slice("sha256:".length, "sha256:".length + 16)}`;
  return {
    auditId,
    eventType: input.eventType,
    manifestVersionRef: input.manifestVersionRef ?? null,
    configFingerprintRef: input.configFingerprintRef ?? null,
    environment: input.environment ?? null,
    journeyPathRef: input.journeyPathRef ?? null,
    placementRef: input.placementRef ?? null,
    odsCodeHash,
    blockedReasons,
    recordedAt: RECORDED_AT,
  };
}

function buildJumpOffUrl(baseUrl: string, routePattern: string): string {
  const separator = routePattern.includes("?") ? "&" : "?";
  return `${baseUrl}${routePattern}${separator}from=nhsApp`;
}

function routeMetadata(
  journeyPath: JourneyPathDefinition,
): JumpOffResolutionResult["routeMetadata"] {
  return {
    routeOwner: journeyPath.routeOwner,
    visibilityTierRef: journeyPath.visibilityTierRef,
    summarySafetyTier: journeyPath.summarySafetyTier,
    placeholderContractRef: journeyPath.placeholderContractRef,
    intakeConvergenceContractRef: journeyPath.intakeConvergenceContractRef,
    continuityControlCode: journeyPath.continuityControlCode,
    continuityEvidenceContractRef: journeyPath.continuityEvidenceContractRef,
    routeFreezeDispositionRef: journeyPath.routeFreezeDispositionRef,
  };
}

export class InMemoryNhsAppManifestRepository {
  private readonly manifestsByVersion = new Map<string, NhsAppIntegrationManifest>();
  private readonly manifestsById = new Map<string, NhsAppIntegrationManifest>();
  private readonly journeyPaths = new Map<string, JourneyPathDefinition>();
  private readonly environmentPins = new Map<NhsAppEnvironment, EnvironmentManifestPin>();
  private readonly evidencePacks = new Map<string, IntegrationEvidencePack>();
  private readonly serviceDeskProfiles = new Map<string, ServiceDeskProfile>();
  private readonly promotionBundles: ManifestPromotionBundle[] = [];
  private readonly continuityEvidenceBundles: NhsAppContinuityEvidenceBundle[] = [];
  private readonly auditRecords: ManifestAuditRecord[] = [];

  constructor(seed: ManifestRepositorySeed = defaultPhase7ManifestSeed) {
    for (const manifest of seed.manifests) {
      this.insertManifest(manifest);
    }
    for (const journeyPath of seed.journeyPaths) {
      this.journeyPaths.set(journeyPath.journeyPathId, clone(journeyPath));
    }
    for (const pin of seed.environmentPins) {
      this.environmentPins.set(pin.environment, clone(pin));
    }
    for (const evidencePack of seed.evidencePacks) {
      this.evidencePacks.set(evidencePack.evidencePackId, clone(evidencePack));
    }
    for (const profile of seed.serviceDeskProfiles) {
      this.serviceDeskProfiles.set(profile.serviceDeskProfileId, clone(profile));
    }
    this.promotionBundles.push(...seed.promotionBundles.map((bundle) => clone(bundle)));
    this.continuityEvidenceBundles.push(
      ...seed.continuityEvidenceBundles.map((bundle) => clone(bundle)),
    );
  }

  getManifestByVersion(manifestVersion: string): NhsAppIntegrationManifest | null {
    const manifest = this.manifestsByVersion.get(manifestVersion);
    this.recordAudit({
      eventType: "manifest_lookup",
      manifestVersionRef: manifestVersion,
      configFingerprintRef: manifest?.configFingerprint ?? null,
      blockedReasons: manifest ? [] : ["not_in_manifest"],
    });
    return manifest ? clone(manifest) : null;
  }

  listManifests(): NhsAppIntegrationManifest[] {
    return [...this.manifestsByVersion.values()].map((manifest) => clone(manifest));
  }

  getEnvironmentPin(environment: NhsAppEnvironment): EnvironmentManifestPin | null {
    const pin = this.environmentPins.get(environment);
    return pin ? clone(pin) : null;
  }

  listEnvironmentPins(): EnvironmentManifestPin[] {
    return [...this.environmentPins.values()].map((pin) => clone(pin));
  }

  getJourneyPath(journeyPathId: string): JourneyPathDefinition | null {
    const journeyPath = this.journeyPaths.get(journeyPathId);
    return journeyPath ? clone(journeyPath) : null;
  }

  listJourneyPaths(): JourneyPathDefinition[] {
    return [...this.journeyPaths.values()].map((journeyPath) => clone(journeyPath));
  }

  getEvidencePack(evidencePackId: string): IntegrationEvidencePack | null {
    const evidencePack = this.evidencePacks.get(evidencePackId);
    return evidencePack ? clone(evidencePack) : null;
  }

  getServiceDeskProfile(serviceDeskProfileId: string): ServiceDeskProfile | null {
    const profile = this.serviceDeskProfiles.get(serviceDeskProfileId);
    return profile ? clone(profile) : null;
  }

  listPromotionBundles(manifestVersion: string): ManifestPromotionBundle[] {
    return this.promotionBundles
      .filter((bundle) => bundle.manifestVersion === manifestVersion)
      .map((bundle) => clone(bundle));
  }

  listContinuityEvidenceBundles(manifestVersion: string): NhsAppContinuityEvidenceBundle[] {
    return this.continuityEvidenceBundles
      .filter((bundle) => bundle.manifestVersionRef === manifestVersion)
      .map((bundle) => clone(bundle));
  }

  getContinuityEvidence(
    manifestVersion: string,
    journeyPathId: string,
  ): NhsAppContinuityEvidenceBundle | null {
    const bundle = this.continuityEvidenceBundles.find(
      (entry) =>
        entry.manifestVersionRef === manifestVersion && entry.journeyPathRef === journeyPathId,
    );
    return bundle ? clone(bundle) : null;
  }

  saveSupersedingManifest(manifest: NhsAppIntegrationManifest): NhsAppIntegrationManifest {
    if (manifest.supersedesManifestId === null) {
      throw new Error(
        "SUPERSESSION_REQUIRED: superseding manifests must name supersedesManifestId.",
      );
    }
    if (!this.manifestsById.has(manifest.supersedesManifestId)) {
      throw new Error("SUPERSEDED_MANIFEST_NOT_FOUND: supersedesManifestId is not in repository.");
    }
    this.insertManifest(manifest);
    this.recordAudit({
      eventType: "supersession_recorded",
      manifestVersionRef: manifest.manifestVersion,
      configFingerprintRef: manifest.configFingerprint,
    });
    return clone(manifest);
  }

  pinEnvironment(input: {
    environment: NhsAppEnvironment;
    manifestVersion: string;
    configFingerprint: string;
    releaseApprovalFreezeRef: string;
  }): EnvironmentManifestPin {
    const manifest = this.manifestsByVersion.get(input.manifestVersion);
    if (!manifest) {
      throw new Error("MANIFEST_VERSION_NOT_FOUND: cannot pin unknown manifest version.");
    }
    if (manifest.configFingerprint !== input.configFingerprint) {
      throw new Error("CONFIG_FINGERPRINT_MISMATCH: cannot pin mismatched config fingerprint.");
    }
    if (manifest.releaseApprovalFreezeRef !== input.releaseApprovalFreezeRef) {
      throw new Error("RELEASE_TUPLE_MISMATCH: cannot pin mismatched release approval freeze.");
    }
    const current = this.environmentPins.get(input.environment);
    const pin: EnvironmentManifestPin = {
      environment: input.environment,
      baseUrl: manifest.baseUrlsByEnvironment[input.environment],
      manifestVersion: manifest.manifestVersion,
      configFingerprint: manifest.configFingerprint,
      releaseApprovalFreezeRef: manifest.releaseApprovalFreezeRef,
      externalApprovalState: current?.externalApprovalState ?? "not_requested",
      routeExposureState: current?.routeExposureState ?? "same_manifest_tuple_required",
      driftDisposition: "block_without_superseding_manifest",
    };
    this.environmentPins.set(input.environment, clone(pin));
    this.recordAudit({
      eventType: "environment_pin_updated",
      environment: input.environment,
      manifestVersionRef: input.manifestVersion,
      configFingerprintRef: input.configFingerprint,
    });
    return clone(pin);
  }

  recordAudit(
    record: Omit<Parameters<typeof buildAuditRecord>[0], "odsCode"> & { odsCode?: string | null },
  ): ManifestAuditRecord {
    const auditRecord = buildAuditRecord(record);
    this.auditRecords.push(auditRecord);
    return auditRecord;
  }

  listAuditRecords(): ManifestAuditRecord[] {
    return this.auditRecords.map((record) => clone(record));
  }

  private insertManifest(manifest: NhsAppIntegrationManifest): void {
    assertManifestTuple(manifest);
    if (this.manifestsByVersion.has(manifest.manifestVersion)) {
      throw new Error("DUPLICATE_MANIFEST_VERSION: manifestVersion must be immutable and unique.");
    }
    if (this.manifestsById.has(manifest.manifestId)) {
      throw new Error("DUPLICATE_MANIFEST_ID: manifestId must be immutable and unique.");
    }
    this.manifestsByVersion.set(manifest.manifestVersion, clone(manifest));
    this.manifestsById.set(manifest.manifestId, clone(manifest));
  }
}

export interface NhsAppOdsVisibilityEvaluator {
  evaluate(input: { odsVisibilityRule: string; odsCode?: string }): {
    allowed: boolean;
    blockedReasons: ManifestBlockedReason[];
  };
}

export function createDefaultOdsVisibilityEvaluator(): NhsAppOdsVisibilityEvaluator {
  return {
    evaluate(input) {
      const odsCode = input.odsCode?.trim().toUpperCase();
      const allowlist = ODS_VISIBILITY_ALLOWLIST[input.odsVisibilityRule];
      if (!odsCode || !allowlist?.has(odsCode)) {
        return { allowed: false, blockedReasons: ["ods_rule_blocked"] };
      }
      return { allowed: true, blockedReasons: [] };
    },
  };
}

export interface Phase7NhsAppManifestApplication {
  repository: InMemoryNhsAppManifestRepository;
  resolveEnvironment(input: EnvironmentResolutionInput): EnvironmentResolutionResult;
  lookupJourneyPath(input: {
    environment: NhsAppEnvironment;
    journeyPathId: string;
    expectedManifestVersion?: string;
    expectedConfigFingerprint?: string;
  }): JourneyPathLookupResult;
  getManifestExposure(input: EnvironmentResolutionInput): ManifestExposureResult;
  resolveJumpOff(input: JumpOffResolutionInput): JumpOffResolutionResult;
  resolveOnboardingEvidence(input: EnvironmentResolutionInput): OnboardingEvidenceResolutionResult;
  saveSupersedingManifest(manifest: NhsAppIntegrationManifest): NhsAppIntegrationManifest;
  pinEnvironment(input: {
    environment: NhsAppEnvironment;
    manifestVersion: string;
    configFingerprint: string;
    releaseApprovalFreezeRef: string;
  }): EnvironmentManifestPin;
  listAuditRecords(): ManifestAuditRecord[];
}

export function createPhase7NhsAppManifestApplication(input?: {
  repository?: InMemoryNhsAppManifestRepository;
  odsVisibilityEvaluator?: NhsAppOdsVisibilityEvaluator;
}): Phase7NhsAppManifestApplication {
  const repository = input?.repository ?? new InMemoryNhsAppManifestRepository();
  const odsVisibilityEvaluator =
    input?.odsVisibilityEvaluator ?? createDefaultOdsVisibilityEvaluator();

  function resolveEnvironment(input: EnvironmentResolutionInput): EnvironmentResolutionResult {
    const pin = repository.getEnvironmentPin(input.environment);
    const blockedReasons: ManifestBlockedReason[] = [];
    if (!pin) {
      appendUnique(blockedReasons, "environment_mismatch");
    }

    const manifest = pin ? repository.getManifestByVersion(pin.manifestVersion) : null;
    if (
      pin &&
      input.expectedManifestVersion &&
      input.expectedManifestVersion !== pin.manifestVersion
    ) {
      appendUnique(blockedReasons, "manifest_version_mismatch");
    }
    if (
      pin &&
      input.expectedConfigFingerprint &&
      input.expectedConfigFingerprint !== pin.configFingerprint
    ) {
      appendUnique(blockedReasons, "config_fingerprint_mismatch");
    }
    if (
      pin &&
      input.expectedReleaseApprovalFreezeRef &&
      input.expectedReleaseApprovalFreezeRef !== pin.releaseApprovalFreezeRef
    ) {
      appendUnique(blockedReasons, "release_tuple_mismatch");
    }
    if (!manifest && pin) {
      appendUnique(blockedReasons, "not_in_manifest");
    }
    const auditRecord = repository.recordAudit({
      eventType: "environment_resolution",
      environment: input.environment,
      manifestVersionRef: pin?.manifestVersion ?? input.expectedManifestVersion ?? null,
      configFingerprintRef: pin?.configFingerprint ?? input.expectedConfigFingerprint ?? null,
      blockedReasons,
    });
    return {
      environment: input.environment,
      baseUrl: pin?.baseUrl ?? null,
      manifestVersion: pin?.manifestVersion ?? null,
      configFingerprint: pin?.configFingerprint ?? null,
      releaseApprovalFreezeRef: pin?.releaseApprovalFreezeRef ?? null,
      parityState: blockedReasons.length === 0 ? "matching" : "blocked",
      blockedReasons,
      manifest,
      auditRecord,
    };
  }

  function classifyRouteExposure(input: {
    manifest: NhsAppIntegrationManifest | null;
    journeyPath: JourneyPathDefinition | null;
    continuityEvidence: NhsAppContinuityEvidenceBundle | null;
    inheritedBlockedReasons?: ManifestBlockedReason[];
  }): { exposureState: RouteExposureState; blockedReasons: ManifestBlockedReason[] } {
    const blockedReasons = [...(input.inheritedBlockedReasons ?? [])];
    if (!input.manifest || !input.journeyPath) {
      appendUnique(blockedReasons, "not_in_manifest");
      return { exposureState: "blocked", blockedReasons };
    }
    if (!input.manifest.allowedJourneyPaths.includes(input.journeyPath.journeyPathId)) {
      appendUnique(blockedReasons, "not_in_manifest");
    }
    if (input.journeyPath.classification === "needs_embedded_adaptation_first") {
      appendUnique(blockedReasons, "requires_embedded_adaptation");
    }
    if (input.journeyPath.classification === "not_suitable_in_phase7") {
      appendUnique(blockedReasons, "route_excluded");
    }
    if (
      input.manifest.allowedJourneyPaths.includes(input.journeyPath.journeyPathId) &&
      (!input.continuityEvidence || input.continuityEvidence.validationState !== "trusted")
    ) {
      appendUnique(blockedReasons, "pending_continuity_validation");
    }
    if (blockedReasons.length > 0) {
      if (input.journeyPath.classification === "needs_embedded_adaptation_first") {
        return { exposureState: "inventory_only", blockedReasons };
      }
      if (input.journeyPath.classification === "not_suitable_in_phase7") {
        return { exposureState: "excluded", blockedReasons };
      }
      return { exposureState: "blocked", blockedReasons };
    }
    return { exposureState: "exposed", blockedReasons };
  }

  function lookupJourneyPath(lookupInput: {
    environment: NhsAppEnvironment;
    journeyPathId: string;
    expectedManifestVersion?: string;
    expectedConfigFingerprint?: string;
  }): JourneyPathLookupResult {
    const environment = resolveEnvironment({
      environment: lookupInput.environment,
      expectedManifestVersion: lookupInput.expectedManifestVersion,
      expectedConfigFingerprint: lookupInput.expectedConfigFingerprint,
    });
    const journeyPath = repository.getJourneyPath(lookupInput.journeyPathId);
    const continuityEvidence =
      environment.manifest?.manifestVersion && journeyPath
        ? repository.getContinuityEvidence(
            environment.manifest.manifestVersion,
            lookupInput.journeyPathId,
          )
        : null;
    const exposure = classifyRouteExposure({
      manifest: environment.manifest,
      journeyPath,
      continuityEvidence,
      inheritedBlockedReasons: environment.blockedReasons,
    });
    const auditRecord = repository.recordAudit({
      eventType: "journey_path_lookup",
      environment: lookupInput.environment,
      manifestVersionRef: environment.manifestVersion,
      configFingerprintRef: environment.configFingerprint,
      journeyPathRef: lookupInput.journeyPathId,
      blockedReasons: exposure.blockedReasons,
    });
    return {
      journeyPath,
      inManifest:
        environment.manifest?.allowedJourneyPaths.includes(lookupInput.journeyPathId) ?? false,
      exposureState: exposure.exposureState,
      blockedReasons: exposure.blockedReasons,
      continuityEvidence,
      auditRecord,
    };
  }

  function getManifestExposure(input: EnvironmentResolutionInput): ManifestExposureResult {
    const environment = resolveEnvironment(input);
    const manifest = environment.manifest;
    const routes = repository.listJourneyPaths().map((journeyPath): ManifestExposureRoute => {
      const continuityEvidence = manifest
        ? repository.getContinuityEvidence(manifest.manifestVersion, journeyPath.journeyPathId)
        : null;
      const exposure = classifyRouteExposure({
        manifest,
        journeyPath,
        continuityEvidence,
        inheritedBlockedReasons: environment.blockedReasons,
      });
      return {
        journeyPathId: journeyPath.journeyPathId,
        routePattern: journeyPath.routePattern,
        journeyType: journeyPath.journeyType,
        classification: journeyPath.classification,
        exposureState: exposure.exposureState,
        blockedReasons: exposure.blockedReasons,
        routeOwner: journeyPath.routeOwner,
        visibilityTierRef: journeyPath.visibilityTierRef,
        summarySafetyTier: journeyPath.summarySafetyTier,
        placeholderContractRef: journeyPath.placeholderContractRef,
        intakeConvergenceContractRef: journeyPath.intakeConvergenceContractRef,
        continuityEvidenceContractRef: journeyPath.continuityEvidenceContractRef,
        routeFreezeDispositionRef: journeyPath.routeFreezeDispositionRef,
      };
    });
    return {
      environment,
      manifestVersion: manifest?.manifestVersion ?? null,
      configFingerprint: manifest?.configFingerprint ?? null,
      releaseTuple: {
        releaseCandidateRef: manifest?.releaseCandidateRef ?? null,
        releaseApprovalFreezeRef: manifest?.releaseApprovalFreezeRef ?? null,
        behaviorContractSetRef: manifest?.behaviorContractSetRef ?? null,
        surfaceSchemaSetRef: manifest?.surfaceSchemaSetRef ?? null,
        compatibilityEvidenceRef: manifest?.compatibilityEvidenceRef ?? null,
      },
      routes,
      jumpOffMappings: manifest?.jumpOffMappings.map((mapping) => clone(mapping)) ?? [],
      evidencePackRef: manifest?.evidencePackRef ?? null,
      serviceDeskProfileRef: manifest?.serviceDeskProfileRef ?? null,
    };
  }

  function resolveJumpOff(input: JumpOffResolutionInput): JumpOffResolutionResult {
    const nhsAppPlacement = requireNonEmpty(input.nhsAppPlacement, "nhsAppPlacement");
    const environment = resolveEnvironment(input);
    const manifest = environment.manifest;
    const blockedReasons = [...environment.blockedReasons];
    const mapping =
      manifest?.jumpOffMappings.find((entry) => entry.nhsAppPlacement === nhsAppPlacement) ?? null;
    if (!mapping) {
      appendUnique(blockedReasons, "not_in_manifest");
    }
    let journeyPath: JourneyPathDefinition | null = null;
    let continuityEvidence: NhsAppContinuityEvidenceBundle | null = null;
    if (manifest && mapping) {
      const allowedEnvironments = COHORT_ENVIRONMENT_ALLOWLIST[mapping.releaseCohortRef] ?? [];
      if (!allowedEnvironments.includes(input.environment)) {
        appendUnique(blockedReasons, "environment_mismatch");
      }
      if (mapping.releaseCohortRef !== input.releaseCohortRef) {
        appendUnique(blockedReasons, "cohort_blocked");
      }
      const odsVisibility = odsVisibilityEvaluator.evaluate({
        odsVisibilityRule: mapping.odsVisibilityRule,
        odsCode: input.odsCode,
      });
      for (const reason of odsVisibility.blockedReasons) {
        appendUnique(blockedReasons, reason);
      }
      journeyPath = repository.getJourneyPath(mapping.journeyPathId);
      continuityEvidence = journeyPath
        ? repository.getContinuityEvidence(manifest.manifestVersion, journeyPath.journeyPathId)
        : null;
      const exposure = classifyRouteExposure({
        manifest,
        journeyPath,
        continuityEvidence,
        inheritedBlockedReasons: blockedReasons,
      });
      blockedReasons.length = 0;
      blockedReasons.push(...exposure.blockedReasons);
    }
    const status: JumpOffResolutionStatus = blockedReasons.length === 0 ? "resolved" : "blocked";
    const exposureState: RouteExposureState =
      status === "resolved"
        ? "exposed"
        : journeyPath?.classification === "needs_embedded_adaptation_first"
          ? "inventory_only"
          : journeyPath?.classification === "not_suitable_in_phase7"
            ? "excluded"
            : "blocked";
    const auditRecord = repository.recordAudit({
      eventType: "jump_off_resolution",
      environment: input.environment,
      manifestVersionRef: environment.manifestVersion,
      configFingerprintRef: environment.configFingerprint,
      journeyPathRef: journeyPath?.journeyPathId ?? mapping?.journeyPathId ?? null,
      placementRef: nhsAppPlacement,
      odsCode: input.odsCode ?? null,
      blockedReasons,
    });
    return {
      status,
      exposureState,
      blockedReasons,
      environment,
      mapping: mapping ? clone(mapping) : null,
      journeyPath: journeyPath ? clone(journeyPath) : null,
      continuityEvidence: continuityEvidence ? clone(continuityEvidence) : null,
      jumpOffUrlTemplate:
        status === "resolved" && environment.baseUrl && journeyPath
          ? buildJumpOffUrl(environment.baseUrl, journeyPath.routePattern)
          : null,
      copyVariantRef: status === "resolved" ? (mapping?.copyVariantRef ?? null) : null,
      routeMetadata: journeyPath ? routeMetadata(journeyPath) : null,
      auditRecord,
    };
  }

  function resolveOnboardingEvidence(
    input: EnvironmentResolutionInput,
  ): OnboardingEvidenceResolutionResult {
    const environment = resolveEnvironment(input);
    const manifest = environment.manifest;
    if (!manifest) {
      throw new Error("MANIFEST_NOT_AVAILABLE: onboarding evidence requires a pinned manifest.");
    }
    const evidencePack = repository.getEvidencePack(manifest.evidencePackRef);
    const serviceDeskProfile = repository.getServiceDeskProfile(manifest.serviceDeskProfileRef);
    if (!evidencePack || !serviceDeskProfile) {
      throw new Error("ONBOARDING_REFERENCES_MISSING: manifest evidence refs are incomplete.");
    }
    const continuityEvidenceBundles = repository.listContinuityEvidenceBundles(
      manifest.manifestVersion,
    );
    const blockedReasons = [...environment.blockedReasons];
    if (
      continuityEvidenceBundles.some(
        (bundle) => bundle.validationState !== "trusted" || bundle.blockingRefs.length > 0,
      )
    ) {
      appendUnique(blockedReasons, "pending_continuity_validation");
    }
    const auditRecord = repository.recordAudit({
      eventType: "evidence_pack_lookup",
      environment: input.environment,
      manifestVersionRef: manifest.manifestVersion,
      configFingerprintRef: manifest.configFingerprint,
      blockedReasons,
    });
    return {
      manifestVersion: manifest.manifestVersion,
      evidencePack,
      serviceDeskProfile,
      promotionBundles: repository.listPromotionBundles(manifest.manifestVersion),
      continuityEvidenceBundles,
      blockedReasons,
      auditRecord,
    };
  }

  return {
    repository,
    resolveEnvironment,
    lookupJourneyPath,
    getManifestExposure,
    resolveJumpOff,
    resolveOnboardingEvidence,
    saveSupersedingManifest(manifest) {
      return repository.saveSupersedingManifest(manifest);
    },
    pinEnvironment(input) {
      return repository.pinEnvironment(input);
    },
    listAuditRecords() {
      return repository.listAuditRecords();
    },
  };
}

export function createDefaultPhase7NhsAppManifestApplication(): Phase7NhsAppManifestApplication {
  return createPhase7NhsAppManifestApplication();
}
