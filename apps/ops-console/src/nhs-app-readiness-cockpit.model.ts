export const NHS_APP_READINESS_VISUAL_MODE = "NHSApp_Readiness_Cockpit" as const;
export const NHS_APP_READINESS_ROUTE_PREFIX = "/ops/release/nhs-app" as const;
export const NHS_APP_MANIFEST_VERSION = "nhsapp-manifest-v0.1.0-freeze-374" as const;
export const NHS_APP_CONFIG_FINGERPRINT =
  "sha256:374-manifest-tuples-f488ecd-local-freeze-v1" as const;
export const NHS_APP_RELEASE_CANDIDATE_REF =
  "release-candidate:phase7-nhs-app-contract-freeze-374" as const;
export const NHS_APP_RELEASE_APPROVAL_FREEZE_REF =
  "ReleaseApprovalFreeze:RAF-P7-374-CONTRACT-FREEZE" as const;
export const NHS_APP_BEHAVIOR_CONTRACT_SET_REF =
  "BehaviorContractSet:phase7-nhs-app-first-wave" as const;
export const NHS_APP_SURFACE_SCHEMA_SET_REF = "SurfaceSchemaSet:phase7-patient-routes-v1" as const;
export const NHS_APP_COMPATIBILITY_EVIDENCE_REF =
  "CompatibilityEvidence:phase7-bridge-floor-freeze-374" as const;
export const NHS_APP_MINIMUM_BRIDGE_REF =
  "MinimumBridgeCapabilities:phase7-embedded-floor-375-pending" as const;

export const nhsAppReadinessEnvironments = [
  "local_preview",
  "sandpit",
  "aos",
  "limited_release",
  "full_release",
] as const;

export const nhsAppReadinessVerdicts = [
  "ready",
  "conditionally_ready",
  "placeholder_only",
  "blocked",
  "evidence_missing",
] as const;

export const nhsAppFreezeModes = [
  "live",
  "hidden",
  "read_only",
  "placeholder_only",
  "redirect_to_safe_route",
] as const;

export const nhsAppDegradationModes = [
  "none",
  "summary_only",
  "browser_handoff",
  "placeholder_summary",
  "safe_route_redirect",
  "out_of_scope",
] as const;

export const nhsAppPreviewModes = [
  "ios_safe_area",
  "android_compact",
  "narrow_laptop",
  "reduced_motion",
] as const;

export const nhsAppRouteAudiences = [
  "patient",
  "patient_and_staff",
  "internal_assurance",
] as const;

export type NhsAppReadinessEnvironment = (typeof nhsAppReadinessEnvironments)[number];
export type NhsAppReadinessVerdict = (typeof nhsAppReadinessVerdicts)[number];
export type NhsAppFreezeMode = (typeof nhsAppFreezeModes)[number];
export type NhsAppDegradationMode = (typeof nhsAppDegradationModes)[number];
export type NhsAppPreviewMode = (typeof nhsAppPreviewModes)[number];
export type NhsAppRouteAudience = (typeof nhsAppRouteAudiences)[number];
export type NhsAppEnvironmentParityState = "matching" | "blocked" | "profile_only";
export type NhsAppContinuityPosture = "trusted" | "conditional" | "placeholder" | "missing";
export type NhsAppEvidenceCompleteness =
  | "complete"
  | "conditional"
  | "placeholder_only"
  | "missing"
  | "blocked";
export type NhsAppInspectorTab = "evidence" | "compatibility" | "continuity";
export type NhsAppRouteView = "cockpit" | "routes" | "route_detail" | "preview";

export interface NhsAppReleaseTuple {
  readonly manifestVersionRef: string;
  readonly configFingerprintRef: string;
  readonly releaseCandidateRef: string;
  readonly releaseApprovalFreezeRef: string;
  readonly behaviorContractSetRef: string;
  readonly surfaceSchemaSetRef: string;
  readonly compatibilityEvidenceRef: string;
}

export interface NhsAppEnvironmentTuple {
  readonly environment: NhsAppReadinessEnvironment;
  readonly label: string;
  readonly stageLabel: string;
  readonly baseUrl: string;
  readonly manifestVersionRef: string;
  readonly configFingerprintRef: string;
  readonly releaseApprovalFreezeRef: string;
  readonly cohortRef: string;
  readonly cohortState: "profile_only" | "enabled" | "monitoring" | "disabled";
  readonly telemetryState: "green" | "observe" | "pending";
  readonly enabledJourneyRefs: readonly string[];
  readonly guardrailSummary: string;
}

export interface NhsAppRouteInventoryRow {
  readonly journeyPathId: string;
  readonly routePattern: string;
  readonly routeFamilyRef: string;
  readonly routeOwner: string;
  readonly audience: NhsAppRouteAudience;
  readonly classification:
    | "safe_for_nhs_app_now"
    | "needs_embedded_adaptation_first"
    | "not_suitable_in_phase7";
  readonly readinessVerdict: NhsAppReadinessVerdict;
  readonly environmentParity: Readonly<Record<NhsAppReadinessEnvironment, NhsAppEnvironmentParityState>>;
  readonly liveFreezePosture: "none" | "template_ready" | "active_freeze";
  readonly freezeMode: NhsAppFreezeMode;
  readonly degradationMode: NhsAppDegradationMode;
  readonly evidenceCompleteness: NhsAppEvidenceCompleteness;
  readonly continuityPosture: NhsAppContinuityPosture;
  readonly compatibilityTruth: "compatible" | "conditional" | "incompatible" | "not_applicable";
  readonly bridgeCapabilityFloor: string;
  readonly bridgeActions: readonly string[];
  readonly artifactConstraint: string;
  readonly placeholderBehavior: string;
  readonly failureReasons: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly releaseTuple: NhsAppReleaseTuple;
  readonly topologyLinks: readonly string[];
  readonly safeRouteRef: string | null;
  readonly supportRecoveryRef: string;
  readonly automationId: string;
}

export interface NhsAppReadinessFilters {
  readonly environment: NhsAppReadinessEnvironment;
  readonly readiness: "all" | NhsAppReadinessVerdict;
  readonly audience: "all" | NhsAppRouteAudience;
  readonly routeFamily: "all" | string;
  readonly freeze: "all" | NhsAppFreezeMode | NhsAppDegradationMode;
}

export interface NhsAppReadinessUrlState {
  readonly routeView: NhsAppRouteView;
  readonly selectedJourneyPathId: string;
  readonly filters: NhsAppReadinessFilters;
  readonly previewMode: NhsAppPreviewMode;
  readonly inspectorTab: NhsAppInspectorTab;
  readonly evidenceDrawerOpen: boolean;
}

export type NhsAppReadinessStatePatch = Omit<Partial<NhsAppReadinessUrlState>, "filters"> & {
  readonly filters?: Partial<NhsAppReadinessFilters>;
};

export interface NhsAppReadinessSummary {
  readonly totalRoutes: number;
  readonly visibleRoutes: number;
  readonly readyRoutes: number;
  readonly blockedRoutes: number;
  readonly placeholderRoutes: number;
  readonly evidenceMissingRoutes: number;
  readonly environment: NhsAppReadinessEnvironment;
  readonly releaseTupleSummary: string;
}

export interface NhsAppPreviewConstraints {
  readonly previewMode: NhsAppPreviewMode;
  readonly hiddenSupplierChrome: boolean;
  readonly bridgeAvailable: boolean;
  readonly safeAreaInsetTop: number;
  readonly safeAreaInsetBottom: number;
  readonly deviceWidth: number;
  readonly deviceHeight: number;
  readonly reducedMotion: boolean;
  readonly freezeMode: NhsAppFreezeMode;
  readonly artifactLimitation: string;
  readonly previewStatus: "interactive" | "read_only" | "placeholder" | "redirect" | "blocked";
}

const releaseTuple: NhsAppReleaseTuple = {
  manifestVersionRef: NHS_APP_MANIFEST_VERSION,
  configFingerprintRef: NHS_APP_CONFIG_FINGERPRINT,
  releaseCandidateRef: NHS_APP_RELEASE_CANDIDATE_REF,
  releaseApprovalFreezeRef: NHS_APP_RELEASE_APPROVAL_FREEZE_REF,
  behaviorContractSetRef: NHS_APP_BEHAVIOR_CONTRACT_SET_REF,
  surfaceSchemaSetRef: NHS_APP_SURFACE_SCHEMA_SET_REF,
  compatibilityEvidenceRef: NHS_APP_COMPATIBILITY_EVIDENCE_REF,
};

const allMatching: Readonly<Record<NhsAppReadinessEnvironment, NhsAppEnvironmentParityState>> = {
  local_preview: "matching",
  sandpit: "matching",
  aos: "matching",
  limited_release: "matching",
  full_release: "matching",
};

const profileThenRelease: Readonly<Record<NhsAppReadinessEnvironment, NhsAppEnvironmentParityState>> = {
  local_preview: "matching",
  sandpit: "matching",
  aos: "matching",
  limited_release: "matching",
  full_release: "profile_only",
};

const adaptationBlocked: Readonly<Record<NhsAppReadinessEnvironment, NhsAppEnvironmentParityState>> = {
  local_preview: "matching",
  sandpit: "profile_only",
  aos: "profile_only",
  limited_release: "blocked",
  full_release: "blocked",
};

const outOfScope: Readonly<Record<NhsAppReadinessEnvironment, NhsAppEnvironmentParityState>> = {
  local_preview: "blocked",
  sandpit: "blocked",
  aos: "blocked",
  limited_release: "blocked",
  full_release: "blocked",
};

const defaultBridgeActions = ["isEmbedded", "setBackAction", "clearBackAction"] as const;

function route(input: Omit<NhsAppRouteInventoryRow, "releaseTuple" | "automationId">): NhsAppRouteInventoryRow {
  return {
    ...input,
    releaseTuple,
    automationId: `NHSAppRouteInventory:${input.journeyPathId}`,
  };
}

export const NHS_APP_ENVIRONMENT_TUPLES: readonly NhsAppEnvironmentTuple[] = [
  {
    environment: "local_preview",
    label: "Local preview",
    stageLabel: "Contract freeze preview",
    baseUrl: "https://local-preview.nhs-app.vecells.test",
    manifestVersionRef: NHS_APP_MANIFEST_VERSION,
    configFingerprintRef: NHS_APP_CONFIG_FINGERPRINT,
    releaseApprovalFreezeRef: NHS_APP_RELEASE_APPROVAL_FREEZE_REF,
    cohortRef: "ChannelReleaseCohort:384:local-profile",
    cohortState: "profile_only",
    telemetryState: "pending",
    enabledJourneyRefs: ["jp_pharmacy_status"],
    guardrailSummary: "Preview tuple only; no patient cohort.",
  },
  {
    environment: "sandpit",
    label: "Sandpit",
    stageLabel: "Controlled supplier verification",
    baseUrl: "https://sandpit.nhs-app.vecells.test",
    manifestVersionRef: NHS_APP_MANIFEST_VERSION,
    configFingerprintRef: NHS_APP_CONFIG_FINGERPRINT,
    releaseApprovalFreezeRef: NHS_APP_RELEASE_APPROVAL_FREEZE_REF,
    cohortRef: "ChannelReleaseCohort:385:sandpit-pharmacy-controlled",
    cohortState: "enabled",
    telemetryState: "green",
    enabledJourneyRefs: ["jp_pharmacy_status"],
    guardrailSummary: "Pharmacy status cohort green; other routes remain readiness inventory.",
  },
  {
    environment: "aos",
    label: "AOS",
    stageLabel: "Assurance observation slice",
    baseUrl: "https://aos.nhs-app.vecells.test",
    manifestVersionRef: NHS_APP_MANIFEST_VERSION,
    configFingerprintRef: NHS_APP_CONFIG_FINGERPRINT,
    releaseApprovalFreezeRef: NHS_APP_RELEASE_APPROVAL_FREEZE_REF,
    cohortRef: "ChannelReleaseCohort:385:aos-pharmacy-assurance",
    cohortState: "enabled",
    telemetryState: "green",
    enabledJourneyRefs: ["jp_pharmacy_status"],
    guardrailSummary: "AOS evidence slice current for pharmacy status only.",
  },
  {
    environment: "limited_release",
    label: "Limited release",
    stageLabel: "SCAL sample cohort",
    baseUrl: "https://limited-release.nhs-app.vecells.test",
    manifestVersionRef: NHS_APP_MANIFEST_VERSION,
    configFingerprintRef: NHS_APP_CONFIG_FINGERPRINT,
    releaseApprovalFreezeRef: NHS_APP_RELEASE_APPROVAL_FREEZE_REF,
    cohortRef: "ChannelReleaseCohort:385:limited-release-pharmacy",
    cohortState: "monitoring",
    telemetryState: "observe",
    enabledJourneyRefs: ["jp_pharmacy_status"],
    guardrailSummary: "Monitoring green-window readiness before broader exposure.",
  },
  {
    environment: "full_release",
    label: "Full release",
    stageLabel: "Disabled until limited release clears",
    baseUrl: "https://full-release.nhs-app.vecells.test",
    manifestVersionRef: NHS_APP_MANIFEST_VERSION,
    configFingerprintRef: NHS_APP_CONFIG_FINGERPRINT,
    releaseApprovalFreezeRef: NHS_APP_RELEASE_APPROVAL_FREEZE_REF,
    cohortRef: "ChannelReleaseCohort:385:full-release-pharmacy",
    cohortState: "disabled",
    telemetryState: "pending",
    enabledJourneyRefs: [],
    guardrailSummary: "No full-release exposure until sample and monthly evidence pack pass.",
  },
] as const;

export const NHS_APP_ROUTE_INVENTORY: readonly NhsAppRouteInventoryRow[] = [
  route({
    journeyPathId: "jp_start_medical_request",
    routePattern: "/requests/new?type=medical",
    routeFamilyRef: "medical_request_intake",
    routeOwner: "patient_intake",
    audience: "patient",
    classification: "safe_for_nhs_app_now",
    readinessVerdict: "conditionally_ready",
    environmentParity: profileThenRelease,
    liveFreezePosture: "none",
    freezeMode: "live",
    degradationMode: "none",
    evidenceCompleteness: "conditional",
    continuityPosture: "conditional",
    compatibilityTruth: "conditional",
    bridgeCapabilityFloor: NHS_APP_MINIMUM_BRIDGE_REF,
    bridgeActions: defaultBridgeActions,
    artifactConstraint: "Draft autosave and red-flag copy must share browser and NHS App state.",
    placeholderBehavior: "Same-shell browser fallback preserves draft when channel evidence drifts.",
    failureReasons: ["manual_observation_pending"],
    evidenceRefs: [
      "IntakeConvergenceContract:phase1-browser-and-nhsapp-shared-v1",
      "RouteContinuityEvidenceContract:intake-resume-v1",
    ],
    topologyLinks: ["NHSAppManifest", "IntakeConvergenceContract", "ReleaseTuple"],
    safeRouteRef: "/requests/new?channel=browser",
    supportRecoveryRef: "SupportRecovery:386:intake-draft-preserved",
  }),
  route({
    journeyPathId: "jp_start_admin_request",
    routePattern: "/requests/new?type=admin",
    routeFamilyRef: "admin_request_intake",
    routeOwner: "patient_intake",
    audience: "patient",
    classification: "safe_for_nhs_app_now",
    readinessVerdict: "conditionally_ready",
    environmentParity: profileThenRelease,
    liveFreezePosture: "none",
    freezeMode: "live",
    degradationMode: "none",
    evidenceCompleteness: "conditional",
    continuityPosture: "conditional",
    compatibilityTruth: "conditional",
    bridgeCapabilityFloor: NHS_APP_MINIMUM_BRIDGE_REF,
    bridgeActions: defaultBridgeActions,
    artifactConstraint: "Admin request scope must stay clear and recoverable without native chrome.",
    placeholderBehavior: "Fallback keeps the same entry route and preserves typed context.",
    failureReasons: ["manual_observation_pending"],
    evidenceRefs: [
      "IntakeConvergenceContract:phase1-browser-and-nhsapp-shared-v1",
      "RouteContinuityEvidenceContract:intake-resume-v1",
    ],
    topologyLinks: ["NHSAppManifest", "AccessibleContentVariant", "ReleaseTuple"],
    safeRouteRef: "/requests/new?channel=browser",
    supportRecoveryRef: "SupportRecovery:386:admin-entry-browser-fallback",
  }),
  route({
    journeyPathId: "jp_continue_draft",
    routePattern: "/requests/drafts/:draftId",
    routeFamilyRef: "draft_resume",
    routeOwner: "patient_intake",
    audience: "patient",
    classification: "safe_for_nhs_app_now",
    readinessVerdict: "conditionally_ready",
    environmentParity: profileThenRelease,
    liveFreezePosture: "none",
    freezeMode: "live",
    degradationMode: "none",
    evidenceCompleteness: "conditional",
    continuityPosture: "conditional",
    compatibilityTruth: "conditional",
    bridgeCapabilityFloor: NHS_APP_MINIMUM_BRIDGE_REF,
    bridgeActions: defaultBridgeActions,
    artifactConstraint: "Draft claim and resume state must survive native back and browser handoff.",
    placeholderBehavior: "Show draft provenance and repair path when session binding is stale.",
    failureReasons: ["manual_observation_pending"],
    evidenceRefs: [
      "RouteContinuityEvidenceContract:intake-resume-v1",
      "PatientEmbeddedSessionProjection:375-pending",
    ],
    topologyLinks: ["SessionProjection", "RouteContinuityEvidence", "ReleaseTuple"],
    safeRouteRef: "/requests",
    supportRecoveryRef: "SupportRecovery:386:draft-claim-repair",
  }),
  route({
    journeyPathId: "jp_request_status",
    routePattern: "/requests/:requestId/status",
    routeFamilyRef: "request_status",
    routeOwner: "patient_status",
    audience: "patient",
    classification: "safe_for_nhs_app_now",
    readinessVerdict: "evidence_missing",
    environmentParity: profileThenRelease,
    liveFreezePosture: "none",
    freezeMode: "live",
    degradationMode: "summary_only",
    evidenceCompleteness: "missing",
    continuityPosture: "missing",
    compatibilityTruth: "conditional",
    bridgeCapabilityFloor: NHS_APP_MINIMUM_BRIDGE_REF,
    bridgeActions: ["isEmbedded", "setBackAction", "goToAppPage"],
    artifactConstraint: "Status remains summary-first until route continuity evidence is current.",
    placeholderBehavior: "Keep status summary visible and link to browser recovery when evidence is absent.",
    failureReasons: ["continuity_evidence_missing", "manual_observation_pending"],
    evidenceRefs: [
      "RouteContinuityEvidenceContract:patient-navigation-v1",
      "BridgeCapabilityMatrix:381-sandpit-verification-current",
    ],
    topologyLinks: ["RouteReadiness", "BridgeCapabilityMatrix", "ContinuityEvidenceGap"],
    safeRouteRef: "/requests",
    supportRecoveryRef: "SupportRecovery:386:request-status-summary",
  }),
  route({
    journeyPathId: "jp_respond_more_info",
    routePattern: "/requests/:requestId/more-info/:checkpointId",
    routeFamilyRef: "more_info_response",
    routeOwner: "more_info",
    audience: "patient_and_staff",
    classification: "safe_for_nhs_app_now",
    readinessVerdict: "evidence_missing",
    environmentParity: profileThenRelease,
    liveFreezePosture: "none",
    freezeMode: "live",
    degradationMode: "summary_only",
    evidenceCompleteness: "missing",
    continuityPosture: "missing",
    compatibilityTruth: "conditional",
    bridgeCapabilityFloor: NHS_APP_MINIMUM_BRIDGE_REF,
    bridgeActions: defaultBridgeActions,
    artifactConstraint: "Checkpoint replies need stale-reply blocking and safe keyboard proof.",
    placeholderBehavior: "Expose checkpoint summary and block write actions until reply evidence is fresh.",
    failureReasons: ["ui_state_contract_missing", "manual_observation_pending"],
    evidenceRefs: [
      "RouteContinuityEvidenceContract:more-info-reply-v1",
      "AccessibleContentVariant:pending:more-info",
    ],
    topologyLinks: ["MoreInfoReply", "RouteReadinessGap", "ReleaseTuple"],
    safeRouteRef: "/requests/:requestId/status",
    supportRecoveryRef: "SupportRecovery:386:more-info-checkpoint-hold",
  }),
  route({
    journeyPathId: "jp_manage_local_appointment",
    routePattern: "/appointments/:appointmentId/manage",
    routeFamilyRef: "appointment_manage",
    routeOwner: "booking",
    audience: "patient_and_staff",
    classification: "safe_for_nhs_app_now",
    readinessVerdict: "conditionally_ready",
    environmentParity: profileThenRelease,
    liveFreezePosture: "template_ready",
    freezeMode: "placeholder_only",
    degradationMode: "placeholder_summary",
    evidenceCompleteness: "conditional",
    continuityPosture: "trusted",
    compatibilityTruth: "conditional",
    bridgeCapabilityFloor: NHS_APP_MINIMUM_BRIDGE_REF,
    bridgeActions: ["isEmbedded", "setBackAction", "clearBackAction", "downloadBytes"],
    artifactConstraint: "Writable appointment controls downgrade to summary-only when command posture is not trusted.",
    placeholderBehavior: "Show appointment summary, next safe action, and contact-practice recovery copy.",
    failureReasons: ["promotion_policy_not_ready"],
    evidenceRefs: [
      "ContinuityEvidence:383:appointment_manage",
      "UIStateContract:383:appointment-manage",
      "AuditEvidence:383:accessibility:appointment-manage:conditional",
      "RouteFreezeDisposition:385:appointment-placeholder",
    ],
    topologyLinks: ["RouteReadiness:383", "RouteFreezeDisposition:385", "BridgeRuntime:381"],
    safeRouteRef: null,
    supportRecoveryRef: "SupportRecovery:385:appointment-contact-practice",
  }),
  route({
    journeyPathId: "jp_pharmacy_choice",
    routePattern: "/requests/:requestId/pharmacy/choice",
    routeFamilyRef: "pharmacy_choice",
    routeOwner: "pharmacy_loop",
    audience: "patient",
    classification: "safe_for_nhs_app_now",
    readinessVerdict: "evidence_missing",
    environmentParity: profileThenRelease,
    liveFreezePosture: "none",
    freezeMode: "live",
    degradationMode: "summary_only",
    evidenceCompleteness: "missing",
    continuityPosture: "conditional",
    compatibilityTruth: "conditional",
    bridgeCapabilityFloor: NHS_APP_MINIMUM_BRIDGE_REF,
    bridgeActions: defaultBridgeActions,
    artifactConstraint: "Provider-choice scope and warned-choice copy need route-level audit evidence.",
    placeholderBehavior: "Show selected pharmacy summary and repair path until choice mutation evidence lands.",
    failureReasons: ["accessibility_audit_missing", "ui_state_contract_missing"],
    evidenceRefs: [
      "RouteContinuityEvidenceContract:pharmacy-loop-settlement-v1",
      "PharmacyChoiceTruth:358",
    ],
    topologyLinks: ["PharmacyLoop", "RouteReadinessGap", "ReleaseTuple"],
    safeRouteRef: "/requests/:requestId/status",
    supportRecoveryRef: "SupportRecovery:386:pharmacy-choice-summary",
  }),
  route({
    journeyPathId: "jp_pharmacy_status",
    routePattern: "/requests/:requestId/pharmacy/status",
    routeFamilyRef: "pharmacy_status",
    routeOwner: "pharmacy_loop",
    audience: "patient",
    classification: "safe_for_nhs_app_now",
    readinessVerdict: "ready",
    environmentParity: allMatching,
    liveFreezePosture: "template_ready",
    freezeMode: "read_only",
    degradationMode: "summary_only",
    evidenceCompleteness: "complete",
    continuityPosture: "trusted",
    compatibilityTruth: "compatible",
    bridgeCapabilityFloor: NHS_APP_MINIMUM_BRIDGE_REF,
    bridgeActions: ["isEmbedded", "setBackAction", "clearBackAction", "goToAppPage"],
    artifactConstraint: "Status is summary-only; no raw file download is exposed in embedded mode.",
    placeholderBehavior: "If frozen, keep latest pharmacy summary read-only and route to request status.",
    failureReasons: [],
    evidenceRefs: [
      "AccessibleContentVariant:383:pharmacy-status",
      "UIStateContract:383:pharmacy-status",
      "AuditEvidence:383:accessibility:pharmacy-status:current",
      "BridgeCapabilityMatrix:381-sandpit-verification-current",
      "RouteFreezeDisposition:385:pharmacy-status-read-only",
    ],
    topologyLinks: ["RouteReadiness:383", "BridgeRuntime:381", "LiveControl:385"],
    safeRouteRef: "/requests/:requestId/status",
    supportRecoveryRef: "SupportRecovery:385:pharmacy-status-safe-status",
  }),
  route({
    journeyPathId: "jp_waitlist_offer_response",
    routePattern: "/appointments/waitlist/:offerId/respond",
    routeFamilyRef: "waitlist_offer_response",
    routeOwner: "booking",
    audience: "patient_and_staff",
    classification: "needs_embedded_adaptation_first",
    readinessVerdict: "blocked",
    environmentParity: adaptationBlocked,
    liveFreezePosture: "template_ready",
    freezeMode: "redirect_to_safe_route",
    degradationMode: "safe_route_redirect",
    evidenceCompleteness: "blocked",
    continuityPosture: "conditional",
    compatibilityTruth: "incompatible",
    bridgeCapabilityFloor: NHS_APP_MINIMUM_BRIDGE_REF,
    bridgeActions: ["isEmbedded", "setBackAction", "addToCalendar"],
    artifactConstraint: "Deadline-sensitive response requires native back and calendar behavior before exposure.",
    placeholderBehavior: "Redirect to safe waitlist offer list with deadline copy and support recovery.",
    failureReasons: [
      "route_requires_embedded_adaptation",
      "bridge_support_mismatch",
      "incompatible_ui_state",
    ],
    evidenceRefs: [
      "ContinuityEvidence:383:waitlist_offer_response",
      "UIStateContract:383:waitlist-response",
      "AuditEvidence:383:accessibility:waitlist-response:failed",
      "RouteFreezeDisposition:385:waitlist-safe-redirect",
    ],
    topologyLinks: ["RouteReadiness:383", "BridgeRuntime:381", "LiveControl:385"],
    safeRouteRef: "/appointments/waitlist/offers",
    supportRecoveryRef: "SupportRecovery:385:waitlist-safe-route",
  }),
  route({
    journeyPathId: "jp_hub_alternative_offer",
    routePattern: "/appointments/hub-offers/:offerId",
    routeFamilyRef: "hub_alternative_offer",
    routeOwner: "booking_hub",
    audience: "patient_and_staff",
    classification: "needs_embedded_adaptation_first",
    readinessVerdict: "blocked",
    environmentParity: adaptationBlocked,
    liveFreezePosture: "none",
    freezeMode: "hidden",
    degradationMode: "summary_only",
    evidenceCompleteness: "missing",
    continuityPosture: "missing",
    compatibilityTruth: "conditional",
    bridgeCapabilityFloor: NHS_APP_MINIMUM_BRIDGE_REF,
    bridgeActions: defaultBridgeActions,
    artifactConstraint: "Cross-organisation scope and return anchor need route-specific evidence.",
    placeholderBehavior: "Keep hidden from patient cohorts; show internal summary for assurance only.",
    failureReasons: ["route_requires_embedded_adaptation", "continuity_evidence_missing"],
    evidenceRefs: [
      "RouteContinuityEvidenceContract:hub-booking-manage-v1",
      "VisibilityTier:nhs-app-hidden-until-adapted",
    ],
    topologyLinks: ["HubBooking", "RouteReadinessGap", "ManifestVisibilityTier"],
    safeRouteRef: "/appointments",
    supportRecoveryRef: "SupportRecovery:386:hub-offer-hidden",
  }),
  route({
    journeyPathId: "jp_records_letters_summary",
    routePattern: "/records/letters/:letterId",
    routeFamilyRef: "record_letter_summary",
    routeOwner: "records",
    audience: "patient",
    classification: "needs_embedded_adaptation_first",
    readinessVerdict: "placeholder_only",
    environmentParity: adaptationBlocked,
    liveFreezePosture: "template_ready",
    freezeMode: "hidden",
    degradationMode: "placeholder_summary",
    evidenceCompleteness: "placeholder_only",
    continuityPosture: "placeholder",
    compatibilityTruth: "compatible",
    bridgeCapabilityFloor: NHS_APP_MINIMUM_BRIDGE_REF,
    bridgeActions: ["isEmbedded", "setBackAction", "downloadBytes"],
    artifactConstraint: "Raw letter download remains gated; embedded view shows summary-first artifact state.",
    placeholderBehavior: "Show masked letter summary and browser route until file handling evidence is current.",
    failureReasons: ["placeholder_contract_missing"],
    evidenceRefs: [
      "ContinuityEvidence:383:record_letter_summary",
      "UIStateContract:383:record-letter-placeholder",
      "AuditEvidence:383:artifact-delivery:records-placeholder-current",
      "RouteFreezeDisposition:385:records-hidden-during-freeze",
    ],
    topologyLinks: ["ArtifactDelivery:382", "RouteReadiness:383", "LiveControl:385"],
    safeRouteRef: null,
    supportRecoveryRef: "SupportRecovery:385:records-browser-route",
  }),
  route({
    journeyPathId: "jp_patient_message_thread",
    routePattern: "/messages/:threadId",
    routeFamilyRef: "patient_message_thread",
    routeOwner: "communications",
    audience: "patient_and_staff",
    classification: "needs_embedded_adaptation_first",
    readinessVerdict: "evidence_missing",
    environmentParity: adaptationBlocked,
    liveFreezePosture: "none",
    freezeMode: "hidden",
    degradationMode: "summary_only",
    evidenceCompleteness: "missing",
    continuityPosture: "missing",
    compatibilityTruth: "conditional",
    bridgeCapabilityFloor: NHS_APP_MINIMUM_BRIDGE_REF,
    bridgeActions: defaultBridgeActions,
    artifactConstraint: "Notification return and message settlement require thread continuity evidence.",
    placeholderBehavior: "Show thread summary only; do not expose reply controls until settlement is proven.",
    failureReasons: ["continuity_evidence_missing", "ui_state_contract_missing"],
    evidenceRefs: [
      "RouteContinuityEvidenceContract:conversation-settlement-v1",
      "AccessibleContentVariant:pending:patient-message-thread",
    ],
    topologyLinks: ["Communications", "RouteReadinessGap", "ManifestVisibilityTier"],
    safeRouteRef: "/messages",
    supportRecoveryRef: "SupportRecovery:386:message-thread-summary",
  }),
  route({
    journeyPathId: "jp_urgent_emergency_advice",
    routePattern: "/urgent-and-emergency-care",
    routeFamilyRef: "urgent_emergency_advice",
    routeOwner: "public_information",
    audience: "internal_assurance",
    classification: "not_suitable_in_phase7",
    readinessVerdict: "blocked",
    environmentParity: outOfScope,
    liveFreezePosture: "none",
    freezeMode: "hidden",
    degradationMode: "out_of_scope",
    evidenceCompleteness: "blocked",
    continuityPosture: "missing",
    compatibilityTruth: "not_applicable",
    bridgeCapabilityFloor: "not_applicable_public_information",
    bridgeActions: [],
    artifactConstraint: "Public urgent advice is excluded from Phase 7 embedded manifest exposure.",
    placeholderBehavior: "Do not expose in NHS App route cohorts; public browser safety signposting only.",
    failureReasons: ["route_not_suitable"],
    evidenceRefs: [
      "RouteFreezeDisposition:not_applicable_public_information",
      "OutboundNavigationPolicy:public-safety-browser-only",
    ],
    topologyLinks: ["ManifestExclusion", "PublicSafetySignposting", "ReleaseTuple"],
    safeRouteRef: "/",
    supportRecoveryRef: "SupportRecovery:386:public-safety-browser-only",
  }),
] as const;

export const defaultNhsAppReadinessState: NhsAppReadinessUrlState = {
  routeView: "routes",
  selectedJourneyPathId: "jp_pharmacy_status",
  filters: {
    environment: "limited_release",
    readiness: "all",
    audience: "all",
    routeFamily: "all",
    freeze: "all",
  },
  previewMode: "ios_safe_area",
  inspectorTab: "evidence",
  evidenceDrawerOpen: false,
};

function isOneOf<T extends readonly string[]>(values: T, value: string | null): value is T[number] {
  return value !== null && values.includes(value);
}

function getSearchParam(params: URLSearchParams, key: string): string | null {
  const value = params.get(key);
  return value && value.trim().length > 0 ? value : null;
}

function normalizeJourneyPathId(input: string | null): string {
  if (input && NHS_APP_ROUTE_INVENTORY.some((routeRow) => routeRow.journeyPathId === input)) {
    return input;
  }
  return defaultNhsAppReadinessState.selectedJourneyPathId;
}

export function getNhsAppEnvironmentTuple(
  environment: NhsAppReadinessEnvironment,
): NhsAppEnvironmentTuple {
  return (
    NHS_APP_ENVIRONMENT_TUPLES.find((tuple) => tuple.environment === environment) ??
    NHS_APP_ENVIRONMENT_TUPLES[0]!
  );
}

export function parseNhsAppReadinessUrl(pathname: string, search: string): NhsAppReadinessUrlState {
  const params = new URLSearchParams(search);
  const cleanPath = pathname.replace(/\/+$/, "");
  const segments = cleanPath.split("/").filter(Boolean);
  const routesIndex = segments.findIndex((segment) => segment === "routes");
  const routeIdFromPath =
    routesIndex >= 0 && routesIndex + 1 < segments.length ? segments[routesIndex + 1] ?? null : null;
  const previewPath = segments.includes("preview");
  const routeId = normalizeJourneyPathId(routeIdFromPath ?? getSearchParam(params, "route"));
  const environmentParam = getSearchParam(params, "env");
  const readinessParam = getSearchParam(params, "readiness");
  const audienceParam = getSearchParam(params, "audience");
  const previewParam = getSearchParam(params, "preview");
  const tabParam = getSearchParam(params, "tab");
  const environment = isOneOf(nhsAppReadinessEnvironments, environmentParam)
    ? environmentParam
    : defaultNhsAppReadinessState.filters.environment;
  const readiness = isOneOf(nhsAppReadinessVerdicts, readinessParam)
    ? readinessParam
    : "all";
  const audience = isOneOf(nhsAppRouteAudiences, audienceParam)
    ? audienceParam
    : "all";
  const previewMode = isOneOf(nhsAppPreviewModes, previewParam)
    ? previewParam
    : defaultNhsAppReadinessState.previewMode;
  const inspectorTab = isOneOf(["evidence", "compatibility", "continuity"] as const, tabParam)
    ? tabParam
    : "evidence";
  const familyParam = getSearchParam(params, "family");
  const routeFamily =
    familyParam && NHS_APP_ROUTE_INVENTORY.some((routeRow) => routeRow.routeFamilyRef === familyParam)
      ? familyParam
      : "all";
  const freezeParam = getSearchParam(params, "freeze");
  const freeze =
    freezeParam &&
    ([...nhsAppFreezeModes, ...nhsAppDegradationModes] as readonly string[]).includes(freezeParam)
      ? (freezeParam as NhsAppReadinessFilters["freeze"])
      : "all";

  return {
    routeView: previewPath ? "preview" : routeIdFromPath ? "route_detail" : "routes",
    selectedJourneyPathId: routeId,
    filters: {
      environment,
      readiness,
      audience,
      routeFamily,
      freeze,
    },
    previewMode,
    inspectorTab,
    evidenceDrawerOpen: getSearchParam(params, "evidence") === "open",
  };
}

export function buildNhsAppReadinessUrl(state: NhsAppReadinessUrlState): string {
  const routePath =
    state.routeView === "preview"
      ? `${NHS_APP_READINESS_ROUTE_PREFIX}/preview`
      : `${NHS_APP_READINESS_ROUTE_PREFIX}/routes/${state.selectedJourneyPathId}`;
  const params = new URLSearchParams();
  params.set("env", state.filters.environment);
  if (state.filters.readiness !== "all") {
    params.set("readiness", state.filters.readiness);
  }
  if (state.filters.audience !== "all") {
    params.set("audience", state.filters.audience);
  }
  if (state.filters.routeFamily !== "all") {
    params.set("family", state.filters.routeFamily);
  }
  if (state.filters.freeze !== "all") {
    params.set("freeze", state.filters.freeze);
  }
  params.set("preview", state.previewMode);
  params.set("tab", state.inspectorTab);
  if (state.evidenceDrawerOpen) {
    params.set("evidence", "open");
  }
  return `${routePath}?${params.toString()}`;
}

export function selectNhsAppRoute(
  rows: readonly NhsAppRouteInventoryRow[],
  journeyPathId: string,
): NhsAppRouteInventoryRow {
  return rows.find((row) => row.journeyPathId === journeyPathId) ?? rows[0]!;
}

export function filterNhsAppRouteInventory(
  rows: readonly NhsAppRouteInventoryRow[],
  filters: NhsAppReadinessFilters,
): NhsAppRouteInventoryRow[] {
  return rows.filter((row) => {
    if (filters.readiness !== "all" && row.readinessVerdict !== filters.readiness) {
      return false;
    }
    if (filters.audience !== "all" && row.audience !== filters.audience) {
      return false;
    }
    if (filters.routeFamily !== "all" && row.routeFamilyRef !== filters.routeFamily) {
      return false;
    }
    if (
      filters.freeze !== "all" &&
      row.freezeMode !== filters.freeze &&
      row.degradationMode !== filters.freeze
    ) {
      return false;
    }
    return row.environmentParity[filters.environment] !== "blocked";
  });
}

export function summarizeNhsAppReadiness(
  rows: readonly NhsAppRouteInventoryRow[],
  visibleRows: readonly NhsAppRouteInventoryRow[],
  environment: NhsAppReadinessEnvironment,
): NhsAppReadinessSummary {
  return {
    totalRoutes: rows.length,
    visibleRoutes: visibleRows.length,
    readyRoutes: visibleRows.filter((row) => row.readinessVerdict === "ready").length,
    blockedRoutes: visibleRows.filter((row) => row.readinessVerdict === "blocked").length,
    placeholderRoutes: visibleRows.filter((row) => row.readinessVerdict === "placeholder_only").length,
    evidenceMissingRoutes: visibleRows.filter((row) => row.readinessVerdict === "evidence_missing").length,
    environment,
    releaseTupleSummary: `${NHS_APP_MANIFEST_VERSION} / ${NHS_APP_RELEASE_APPROVAL_FREEZE_REF}`,
  };
}

export function resolveNhsAppPreviewConstraints(
  routeRow: NhsAppRouteInventoryRow,
  previewMode: NhsAppPreviewMode,
): NhsAppPreviewConstraints {
  const device =
    previewMode === "android_compact"
      ? { deviceWidth: 360, deviceHeight: 740, top: 24, bottom: 16 }
      : previewMode === "narrow_laptop"
        ? { deviceWidth: 390, deviceHeight: 620, top: 12, bottom: 12 }
        : { deviceWidth: 390, deviceHeight: 844, top: 44, bottom: 34 };
  const previewStatus =
    routeRow.freezeMode === "redirect_to_safe_route"
      ? "redirect"
      : routeRow.readinessVerdict === "blocked" || routeRow.degradationMode === "out_of_scope"
        ? "blocked"
        : routeRow.freezeMode === "hidden" || routeRow.freezeMode === "placeholder_only"
          ? "placeholder"
          : routeRow.freezeMode === "read_only"
            ? "read_only"
            : "interactive";

  return {
    previewMode,
    hiddenSupplierChrome: true,
    bridgeAvailable: routeRow.compatibilityTruth !== "not_applicable",
    safeAreaInsetTop: device.top,
    safeAreaInsetBottom: device.bottom,
    deviceWidth: device.deviceWidth,
    deviceHeight: device.deviceHeight,
    reducedMotion: previewMode === "reduced_motion",
    freezeMode: routeRow.freezeMode,
    artifactLimitation: routeRow.artifactConstraint,
    previewStatus,
  };
}

export function updateNhsAppReadinessState(
  current: NhsAppReadinessUrlState,
  patch: NhsAppReadinessStatePatch,
): NhsAppReadinessUrlState {
  return {
    ...current,
    ...patch,
    filters: {
      ...current.filters,
      ...(patch.filters ?? {}),
    },
  };
}

export function getNhsAppRouteFamilies(
  rows: readonly NhsAppRouteInventoryRow[] = NHS_APP_ROUTE_INVENTORY,
): string[] {
  return Array.from(new Set(rows.map((row) => row.routeFamilyRef))).sort();
}
