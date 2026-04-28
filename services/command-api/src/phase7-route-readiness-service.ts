import { createHash } from "node:crypto";
import type { BridgeAction } from "../../../packages/nhs-app-bridge-runtime/src/index";
import {
  createDefaultPhase7NhsAppManifestApplication,
  PHASE7_BEHAVIOR_CONTRACT_SET_REF,
  PHASE7_COMPATIBILITY_EVIDENCE_REF,
  PHASE7_CONFIG_FINGERPRINT,
  PHASE7_MANIFEST_VERSION,
  PHASE7_MINIMUM_BRIDGE_REF,
  PHASE7_RELEASE_APPROVAL_FREEZE_REF,
  PHASE7_RELEASE_CANDIDATE_REF,
  PHASE7_SURFACE_SCHEMA_SET_REF,
  type JourneyClassification,
  type JourneyPathDefinition,
  type ManifestExposureRoute,
  type NhsAppContinuityEvidenceBundle as ManifestContinuityEvidenceBundle,
  type NhsAppEnvironment,
  type Phase7NhsAppManifestApplication,
} from "./phase7-nhs-app-manifest-service";

export const PHASE7_ROUTE_READINESS_SERVICE_NAME = "Phase7NHSAppRouteReadinessAndPromotionVerifier";
export const PHASE7_ROUTE_READINESS_SCHEMA_VERSION = "383.phase7.route-readiness.v1";

const RECORDED_AT = "2026-04-27T01:05:15.000Z";
const DEFAULT_STALE_AFTER_DAYS = 180;

export type RouteReadinessVerdict =
  | "ready"
  | "conditionally_ready"
  | "placeholder_only"
  | "blocked"
  | "evidence_missing";
export type PromotionReadinessState = "promotable" | "blocked";
export type EvidenceValidationState = "trusted" | "degraded" | "missing" | "stale";
export type AuditEvidenceState = "current" | "conditional" | "stale" | "missing" | "failed";
export type AuditEvidenceType =
  | "accessibility"
  | "continuity"
  | "compatibility"
  | "bridge_support"
  | "shell_semantics"
  | "artifact_delivery";
export type AccessibleContentCoverageState =
  | "complete"
  | "partial"
  | "placeholder_only"
  | "missing";
export type AccessibleMobileReadinessState =
  | "responsive_verified"
  | "summary_only_verified"
  | "placeholder_verified"
  | "not_verified";
export type UIStateCompatibleState =
  | "compatible"
  | "conditional"
  | "placeholder_only"
  | "incompatible";
export type UIStateSemanticCoverageState = "complete" | "partial" | "missing";
export type UIStateInteractivePosture =
  | "read_write"
  | "read_only"
  | "summary_only"
  | "browser_handoff"
  | "out_of_scope";

export type RouteReadinessFailureReason =
  | "accessibility_audit_missing"
  | "continuity_evidence_stale"
  | "bridge_support_mismatch"
  | "release_tuple_drift"
  | "placeholder_contract_missing"
  | "incompatible_ui_state"
  | "continuity_evidence_missing"
  | "compatibility_evidence_missing"
  | "manifest_route_missing"
  | "route_requires_embedded_adaptation"
  | "route_not_suitable"
  | "ui_state_contract_missing"
  | "manual_observation_pending"
  | "promotion_policy_not_ready";

export interface NHSAppContinuityEvidenceBundle {
  readonly bundleId: string;
  readonly manifestVersionRef: string;
  readonly journeyPathRef: string;
  readonly continuityControlCode: string;
  readonly governingContractRef: string;
  readonly experienceContinuityEvidenceRefs: readonly string[];
  readonly validationState: EvidenceValidationState;
  readonly blockingRefs: readonly string[];
  readonly releaseApprovalFreezeRef: string;
  readonly capturedAt: string;
  readonly supersededByRef: string | null;
  readonly source: "manifest_seed" | "route_readiness_registry";
}

export interface AccessibleContentVariant {
  readonly variantId: string;
  readonly journeyPathRef: string;
  readonly routeFamilyRef: string;
  readonly manifestVersionRef: string;
  readonly language: "en-GB";
  readonly contentGrade: "nhs_service_manual_aligned";
  readonly recoveryCopyRef: string;
  readonly mobileReadinessState: AccessibleMobileReadinessState;
  readonly wcagLevel: "WCAG2.2-AA";
  readonly ariaPatternRefs: readonly string[];
  readonly accessibilityAuditRef: string;
  readonly coverageState: AccessibleContentCoverageState;
  readonly capturedAt: string;
}

export interface AuditEvidenceReference {
  readonly auditRef: string;
  readonly evidenceType: AuditEvidenceType;
  readonly journeyPathRef: string | null;
  readonly manifestVersionRef: string;
  readonly releaseApprovalFreezeRef: string;
  readonly state: AuditEvidenceState;
  readonly capturedAt: string;
  readonly expiresAt: string;
  readonly evidenceSummaryRef: string;
  readonly sourceUrl: string | null;
}

export interface UIStateContract {
  readonly uiStateContractId: string;
  readonly journeyPathRef: string;
  readonly routeFamilyRef: string;
  readonly manifestVersionRef: string;
  readonly shellType:
    | "embedded_nhs_app"
    | "browser_handoff"
    | "placeholder_summary"
    | "not_applicable";
  readonly supportsEmbeddedShell: boolean;
  readonly supportsSummarySafety: boolean;
  readonly supportsPlaceholder: boolean;
  readonly supportsHostResize: boolean;
  readonly supportsReducedMotion: boolean;
  readonly supportsSafeAreaInsets: boolean;
  readonly supportsBridgeDowngrade: boolean;
  readonly semanticCoverageState: UIStateSemanticCoverageState;
  readonly interactivePosture: UIStateInteractivePosture;
  readonly requiredBridgeActionRefs: readonly BridgeAction[];
  readonly compatibleState: UIStateCompatibleState;
  readonly capturedAt: string;
}

export interface BridgeSupportProfile {
  readonly bridgeSupportProfileRef: string;
  readonly minimumBridgeCapabilitiesRef: string;
  readonly manifestVersionRef: string;
  readonly supportedBridgeActionRefs: readonly BridgeAction[];
  readonly currentBridgeCapabilityMatrixRef: string;
  readonly compatibilityEvidenceRef: string;
  readonly capturedAt: string;
}

export interface RouteReadinessReleaseTuple {
  readonly manifestVersionRef: string | null;
  readonly configFingerprint: string | null;
  readonly releaseCandidateRef: string | null;
  readonly releaseApprovalFreezeRef: string | null;
  readonly behaviorContractSetRef: string | null;
  readonly surfaceSchemaSetRef: string | null;
  readonly compatibilityEvidenceRef: string | null;
}

export interface RouteReadinessEvidenceSummary {
  readonly continuityEvidence: NHSAppContinuityEvidenceBundle | null;
  readonly accessibleContentVariant: AccessibleContentVariant | null;
  readonly accessibilityAudit: AuditEvidenceReference | null;
  readonly compatibilityAudit: AuditEvidenceReference | null;
  readonly bridgeSupportAudit: AuditEvidenceReference | null;
  readonly shellSemanticsAudit: AuditEvidenceReference | null;
  readonly uiStateContract: UIStateContract | null;
  readonly bridgeSupportProfile: BridgeSupportProfile;
}

export interface RouteReadinessResult {
  readonly readinessId: string;
  readonly schemaVersion: typeof PHASE7_ROUTE_READINESS_SCHEMA_VERSION;
  readonly serviceAuthority: typeof PHASE7_ROUTE_READINESS_SERVICE_NAME;
  readonly environment: NhsAppEnvironment;
  readonly journeyPathId: string;
  readonly routeFamilyRef: string | null;
  readonly routePattern: string | null;
  readonly classification: JourneyClassification | null;
  readonly manifestExposureState: ManifestExposureRoute["exposureState"] | "missing";
  readonly verdict: RouteReadinessVerdict;
  readonly failureReasons: readonly RouteReadinessFailureReason[];
  readonly releaseTuple: RouteReadinessReleaseTuple;
  readonly evidence: RouteReadinessEvidenceSummary;
  readonly computedAt: string;
  readonly tupleHash: string;
}

export interface EvaluateRouteReadinessInput {
  readonly environment: NhsAppEnvironment;
  readonly journeyPathId: string;
  readonly expectedManifestVersion?: string;
  readonly expectedConfigFingerprint?: string;
  readonly expectedReleaseCandidateRef?: string;
  readonly expectedReleaseApprovalFreezeRef?: string;
  readonly expectedBehaviorContractSetRef?: string;
  readonly expectedSurfaceSchemaSetRef?: string;
  readonly expectedCompatibilityEvidenceRef?: string;
  readonly now?: string;
}

export interface VerifyPromotionReadinessInput {
  readonly environment: NhsAppEnvironment;
  readonly journeyPathIds?: readonly string[];
  readonly expectedManifestVersion?: string;
  readonly expectedConfigFingerprint?: string;
  readonly expectedReleaseCandidateRef?: string;
  readonly expectedReleaseApprovalFreezeRef?: string;
  readonly expectedBehaviorContractSetRef?: string;
  readonly expectedSurfaceSchemaSetRef?: string;
  readonly expectedCompatibilityEvidenceRef?: string;
  readonly allowConditionallyReadyRoutes?: boolean;
  readonly now?: string;
}

export interface PromotionReadinessResult {
  readonly schemaVersion: typeof PHASE7_ROUTE_READINESS_SCHEMA_VERSION;
  readonly serviceAuthority: typeof PHASE7_ROUTE_READINESS_SERVICE_NAME;
  readonly promotionState: PromotionReadinessState;
  readonly environment: NhsAppEnvironment;
  readonly releaseTuple: RouteReadinessReleaseTuple;
  readonly routeResults: readonly RouteReadinessResult[];
  readonly aggregateFailureReasons: readonly RouteReadinessFailureReason[];
  readonly failureReasonsByRoute: Readonly<Record<string, readonly RouteReadinessFailureReason[]>>;
  readonly checkedAt: string;
  readonly promotionTupleHash: string;
}

export const phase7RouteReadinessRoutes = [
  {
    routeId: "phase7_nhs_app_route_readiness_list",
    method: "GET",
    path: "/internal/v1/nhs-app/readiness/routes",
    contractFamily: "NHSAppRouteReadinessContract",
    purpose:
      "Evaluate every manifested and adaptation-tracked NHS App route against continuity, accessibility, UI state, bridge support, and release tuple evidence.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "phase7_nhs_app_route_readiness_get",
    method: "GET",
    path: "/internal/v1/nhs-app/readiness/routes/{journeyPathId}",
    contractFamily: "NHSAppRouteReadinessContract",
    purpose:
      "Return the route-level readiness verdict and evidence bundle for one NHS App journey path.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "phase7_nhs_app_route_readiness_evidence",
    method: "GET",
    path: "/internal/v1/nhs-app/readiness/evidence",
    contractFamily: "NHSAppContinuityEvidenceBundleContract",
    purpose:
      "Expose continuity, accessibility, audit, UI state, and bridge support evidence refs used by route readiness decisions.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "phase7_nhs_app_promotion_readiness_verify",
    method: "POST",
    path: "/internal/v1/nhs-app/readiness:verify-promotion",
    contractFamily: "NHSAppPromotionReadinessVerifierContract",
    purpose:
      "Verify that a requested NHS App promotion set is promotable and fail closed on missing or drifted evidence.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
] as const;

const DEFAULT_PROMOTION_ROUTE_IDS = [
  "jp_pharmacy_status",
  "jp_manage_local_appointment",
  "jp_request_status",
  "jp_records_letters_summary",
  "jp_waitlist_offer_response",
  "jp_urgent_emergency_advice",
] as const;

const DEFAULT_SUPPORTED_BRIDGE_ACTIONS: BridgeAction[] = [
  "isEmbedded",
  "setBackAction",
  "clearBackAction",
  "goHome",
  "goToAppPage",
  "openOverlay",
  "openExternal",
  "downloadBytes",
];

const DEFAULT_BRIDGE_SUPPORT_PROFILE: BridgeSupportProfile = {
  bridgeSupportProfileRef: "BridgeSupportProfile:383-sandpit-verified-minus-calendar",
  minimumBridgeCapabilitiesRef: PHASE7_MINIMUM_BRIDGE_REF,
  manifestVersionRef: PHASE7_MANIFEST_VERSION,
  supportedBridgeActionRefs: DEFAULT_SUPPORTED_BRIDGE_ACTIONS,
  currentBridgeCapabilityMatrixRef: "BridgeCapabilityMatrix:381-sandpit-verification-current",
  compatibilityEvidenceRef: PHASE7_COMPATIBILITY_EVIDENCE_REF,
  capturedAt: RECORDED_AT,
};

const ROUTE_READINESS_CONTINUITY_SEED: NHSAppContinuityEvidenceBundle[] = [
  buildContinuityEvidence({
    journeyPathRef: "jp_manage_local_appointment",
    routeFamilyRef: "appointment_manage",
    continuityControlCode: "booking_manage",
    governingContractRef: "RouteContinuityEvidenceContract:booking-manage-v1",
    refs: ["ExperienceContinuityControlEvidence:383-booking-manage-embedded-summary-proof"],
  }),
  buildContinuityEvidence({
    journeyPathRef: "jp_records_letters_summary",
    routeFamilyRef: "record_letter_summary",
    continuityControlCode: "record_continuation",
    governingContractRef: "RouteContinuityEvidenceContract:record-continuation-v1",
    refs: ["ExperienceContinuityControlEvidence:383-record-summary-placeholder-proof"],
  }),
  buildContinuityEvidence({
    journeyPathRef: "jp_waitlist_offer_response",
    routeFamilyRef: "waitlist_offer_response",
    continuityControlCode: "booking_manage",
    governingContractRef: "RouteContinuityEvidenceContract:booking-manage-v1",
    refs: ["ExperienceContinuityControlEvidence:383-waitlist-deadline-summary-proof"],
  }),
];

const DEFAULT_ACCESSIBLE_CONTENT_VARIANTS: AccessibleContentVariant[] = [
  {
    variantId: "AccessibleContentVariant:383:pharmacy-status",
    journeyPathRef: "jp_pharmacy_status",
    routeFamilyRef: "pharmacy_status",
    manifestVersionRef: PHASE7_MANIFEST_VERSION,
    language: "en-GB",
    contentGrade: "nhs_service_manual_aligned",
    recoveryCopyRef: "RecoveryCopy:383:pharmacy-status-summary",
    mobileReadinessState: "summary_only_verified",
    wcagLevel: "WCAG2.2-AA",
    ariaPatternRefs: ["WAI-ARIA-APG:landmarks", "WAI-ARIA-APG:accessible-names"],
    accessibilityAuditRef: "AuditEvidence:383:accessibility:pharmacy-status:current",
    coverageState: "complete",
    capturedAt: RECORDED_AT,
  },
  {
    variantId: "AccessibleContentVariant:383:appointment-manage",
    journeyPathRef: "jp_manage_local_appointment",
    routeFamilyRef: "appointment_manage",
    manifestVersionRef: PHASE7_MANIFEST_VERSION,
    language: "en-GB",
    contentGrade: "nhs_service_manual_aligned",
    recoveryCopyRef: "RecoveryCopy:383:appointment-manage-summary",
    mobileReadinessState: "responsive_verified",
    wcagLevel: "WCAG2.2-AA",
    ariaPatternRefs: ["WAI-ARIA-APG:landmarks", "WAI-ARIA-APG:forms"],
    accessibilityAuditRef: "AuditEvidence:383:accessibility:appointment-manage:conditional",
    coverageState: "complete",
    capturedAt: RECORDED_AT,
  },
  {
    variantId: "AccessibleContentVariant:383:record-letter-placeholder",
    journeyPathRef: "jp_records_letters_summary",
    routeFamilyRef: "record_letter_summary",
    manifestVersionRef: PHASE7_MANIFEST_VERSION,
    language: "en-GB",
    contentGrade: "nhs_service_manual_aligned",
    recoveryCopyRef: "RecoveryCopy:383:record-letter-placeholder",
    mobileReadinessState: "placeholder_verified",
    wcagLevel: "WCAG2.2-AA",
    ariaPatternRefs: ["WAI-ARIA-APG:landmarks", "WAI-ARIA-APG:disclosure"],
    accessibilityAuditRef: "AuditEvidence:383:accessibility:record-letter-placeholder:current",
    coverageState: "placeholder_only",
    capturedAt: RECORDED_AT,
  },
  {
    variantId: "AccessibleContentVariant:383:waitlist-response",
    journeyPathRef: "jp_waitlist_offer_response",
    routeFamilyRef: "waitlist_offer_response",
    manifestVersionRef: PHASE7_MANIFEST_VERSION,
    language: "en-GB",
    contentGrade: "nhs_service_manual_aligned",
    recoveryCopyRef: "RecoveryCopy:383:waitlist-deadline-summary",
    mobileReadinessState: "not_verified",
    wcagLevel: "WCAG2.2-AA",
    ariaPatternRefs: ["WAI-ARIA-APG:dialog", "WAI-ARIA-APG:forms"],
    accessibilityAuditRef: "AuditEvidence:383:accessibility:waitlist-response:failed",
    coverageState: "partial",
    capturedAt: RECORDED_AT,
  },
];

const DEFAULT_AUDIT_EVIDENCE: AuditEvidenceReference[] = [
  audit("AuditEvidence:383:accessibility:pharmacy-status:current", "accessibility", {
    journeyPathRef: "jp_pharmacy_status",
    state: "current",
    evidenceSummaryRef: "AccessibilityAuditSummary:383:pharmacy-status-wcag22-aa",
    sourceUrl: "https://service-manual.nhs.uk/accessibility/testing",
  }),
  audit("AuditEvidence:383:accessibility:appointment-manage:conditional", "accessibility", {
    journeyPathRef: "jp_manage_local_appointment",
    state: "conditional",
    evidenceSummaryRef: "AccessibilityAuditSummary:383:appointment-final-device-pass-pending",
    sourceUrl: "https://service-manual.nhs.uk/accessibility/new-criteria-in-wcag-2-2",
  }),
  audit("AuditEvidence:383:accessibility:record-letter-placeholder:current", "accessibility", {
    journeyPathRef: "jp_records_letters_summary",
    state: "current",
    evidenceSummaryRef: "AccessibilityAuditSummary:383:record-placeholder-wcag22-aa",
    sourceUrl: "https://www.w3.org/TR/WCAG22/",
  }),
  audit("AuditEvidence:383:accessibility:waitlist-response:failed", "accessibility", {
    journeyPathRef: "jp_waitlist_offer_response",
    state: "failed",
    evidenceSummaryRef: "AccessibilityAuditSummary:383:waitlist-deadline-focus-failed",
    sourceUrl: "https://www.w3.org/WAI/ARIA/apg/",
  }),
  audit(PHASE7_COMPATIBILITY_EVIDENCE_REF, "compatibility", {
    journeyPathRef: null,
    state: "current",
    evidenceSummaryRef: "CompatibilityEvidenceSummary:383:bridge-floor-381-382",
    sourceUrl:
      "https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-overview/",
  }),
  audit("AuditEvidence:383:bridge-support:sandpit-current", "bridge_support", {
    journeyPathRef: null,
    state: "current",
    evidenceSummaryRef: "BridgeSupportEvidenceSummary:383:js-api-v2-actions",
    sourceUrl:
      "https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-guidance/",
  }),
  audit("AuditEvidence:383:shell-semantics:sandpit-current", "shell_semantics", {
    journeyPathRef: null,
    state: "current",
    evidenceSummaryRef: "ShellSemanticsEvidenceSummary:383:landmarks-safe-area-reduced-motion",
    sourceUrl: "https://playwright.dev/docs/aria-snapshots",
  }),
  audit("AuditEvidence:383:artifact-delivery:records-placeholder-current", "artifact_delivery", {
    journeyPathRef: "jp_records_letters_summary",
    state: "current",
    evidenceSummaryRef: "ArtifactDeliveryEvidenceSummary:382:summary-first-byte-grant-gated",
    sourceUrl: "https://service-manual.nhs.uk/accessibility/testing",
  }),
];

const DEFAULT_UI_STATE_CONTRACTS: UIStateContract[] = [
  {
    uiStateContractId: "UIStateContract:383:pharmacy-status",
    journeyPathRef: "jp_pharmacy_status",
    routeFamilyRef: "pharmacy_status",
    manifestVersionRef: PHASE7_MANIFEST_VERSION,
    shellType: "embedded_nhs_app",
    supportsEmbeddedShell: true,
    supportsSummarySafety: true,
    supportsPlaceholder: true,
    supportsHostResize: true,
    supportsReducedMotion: true,
    supportsSafeAreaInsets: true,
    supportsBridgeDowngrade: true,
    semanticCoverageState: "complete",
    interactivePosture: "summary_only",
    requiredBridgeActionRefs: ["isEmbedded", "setBackAction", "clearBackAction"],
    compatibleState: "compatible",
    capturedAt: RECORDED_AT,
  },
  {
    uiStateContractId: "UIStateContract:383:appointment-manage",
    journeyPathRef: "jp_manage_local_appointment",
    routeFamilyRef: "appointment_manage",
    manifestVersionRef: PHASE7_MANIFEST_VERSION,
    shellType: "embedded_nhs_app",
    supportsEmbeddedShell: true,
    supportsSummarySafety: true,
    supportsPlaceholder: true,
    supportsHostResize: true,
    supportsReducedMotion: true,
    supportsSafeAreaInsets: true,
    supportsBridgeDowngrade: true,
    semanticCoverageState: "complete",
    interactivePosture: "read_write",
    requiredBridgeActionRefs: ["isEmbedded", "setBackAction", "clearBackAction", "downloadBytes"],
    compatibleState: "conditional",
    capturedAt: RECORDED_AT,
  },
  {
    uiStateContractId: "UIStateContract:383:record-letter-placeholder",
    journeyPathRef: "jp_records_letters_summary",
    routeFamilyRef: "record_letter_summary",
    manifestVersionRef: PHASE7_MANIFEST_VERSION,
    shellType: "placeholder_summary",
    supportsEmbeddedShell: true,
    supportsSummarySafety: true,
    supportsPlaceholder: true,
    supportsHostResize: true,
    supportsReducedMotion: true,
    supportsSafeAreaInsets: true,
    supportsBridgeDowngrade: true,
    semanticCoverageState: "complete",
    interactivePosture: "summary_only",
    requiredBridgeActionRefs: ["isEmbedded", "setBackAction", "downloadBytes"],
    compatibleState: "placeholder_only",
    capturedAt: RECORDED_AT,
  },
  {
    uiStateContractId: "UIStateContract:383:waitlist-response",
    journeyPathRef: "jp_waitlist_offer_response",
    routeFamilyRef: "waitlist_offer_response",
    manifestVersionRef: PHASE7_MANIFEST_VERSION,
    shellType: "embedded_nhs_app",
    supportsEmbeddedShell: true,
    supportsSummarySafety: false,
    supportsPlaceholder: false,
    supportsHostResize: false,
    supportsReducedMotion: true,
    supportsSafeAreaInsets: false,
    supportsBridgeDowngrade: false,
    semanticCoverageState: "partial",
    interactivePosture: "read_write",
    requiredBridgeActionRefs: ["isEmbedded", "setBackAction", "addToCalendar"],
    compatibleState: "incompatible",
    capturedAt: RECORDED_AT,
  },
  {
    uiStateContractId: "UIStateContract:383:urgent-emergency-advice",
    journeyPathRef: "jp_urgent_emergency_advice",
    routeFamilyRef: "urgent_emergency_advice",
    manifestVersionRef: PHASE7_MANIFEST_VERSION,
    shellType: "not_applicable",
    supportsEmbeddedShell: false,
    supportsSummarySafety: false,
    supportsPlaceholder: false,
    supportsHostResize: false,
    supportsReducedMotion: true,
    supportsSafeAreaInsets: false,
    supportsBridgeDowngrade: false,
    semanticCoverageState: "missing",
    interactivePosture: "out_of_scope",
    requiredBridgeActionRefs: [],
    compatibleState: "incompatible",
    capturedAt: RECORDED_AT,
  },
];

export class ContinuityEvidenceRegistry {
  private readonly bundles = new Map<string, NHSAppContinuityEvidenceBundle>();

  constructor(seed: readonly NHSAppContinuityEvidenceBundle[] = []) {
    for (const bundle of seed) {
      this.save(bundle);
    }
  }

  static fromManifestSeed(
    manifestBundles: readonly ManifestContinuityEvidenceBundle[],
    additionalBundles: readonly NHSAppContinuityEvidenceBundle[] = ROUTE_READINESS_CONTINUITY_SEED,
  ): ContinuityEvidenceRegistry {
    const normalized = manifestBundles.map(normalizeManifestContinuityEvidence);
    return new ContinuityEvidenceRegistry([...normalized, ...additionalBundles]);
  }

  save(bundle: NHSAppContinuityEvidenceBundle): NHSAppContinuityEvidenceBundle {
    const cloned = clone(bundle);
    this.bundles.set(continuityKey(cloned.manifestVersionRef, cloned.journeyPathRef), cloned);
    return clone(cloned);
  }

  get(manifestVersionRef: string, journeyPathRef: string): NHSAppContinuityEvidenceBundle | null {
    const bundle = this.bundles.get(continuityKey(manifestVersionRef, journeyPathRef));
    return bundle ? clone(bundle) : null;
  }

  list(): NHSAppContinuityEvidenceBundle[] {
    return Array.from(this.bundles.values()).map((bundle) => clone(bundle));
  }

  validate(
    bundle: NHSAppContinuityEvidenceBundle | null,
    input?: { readonly now?: string; readonly staleAfterDays?: number },
  ): {
    readonly state: "valid" | "missing" | "stale";
    readonly failureReasons: readonly RouteReadinessFailureReason[];
  } {
    if (!bundle) {
      return { state: "missing", failureReasons: ["continuity_evidence_missing"] };
    }
    if (
      bundle.validationState !== "trusted" ||
      bundle.blockingRefs.length > 0 ||
      bundle.supersededByRef ||
      isOlderThan(bundle.capturedAt, input?.now ?? RECORDED_AT, input?.staleAfterDays)
    ) {
      return { state: "stale", failureReasons: ["continuity_evidence_stale"] };
    }
    return { state: "valid", failureReasons: [] };
  }
}

export class AccessibleContentVariantRegistry {
  private readonly variants = new Map<string, AccessibleContentVariant>();

  constructor(seed: readonly AccessibleContentVariant[] = DEFAULT_ACCESSIBLE_CONTENT_VARIANTS) {
    for (const variant of seed) {
      this.variants.set(variant.journeyPathRef, clone(variant));
    }
  }

  get(journeyPathRef: string): AccessibleContentVariant | null {
    const variant = this.variants.get(journeyPathRef);
    return variant ? clone(variant) : null;
  }

  list(): AccessibleContentVariant[] {
    return Array.from(this.variants.values()).map((variant) => clone(variant));
  }
}

export class AuditEvidenceReferenceResolver {
  private readonly refs = new Map<string, AuditEvidenceReference>();

  constructor(seed: readonly AuditEvidenceReference[] = DEFAULT_AUDIT_EVIDENCE) {
    for (const ref of seed) {
      this.refs.set(ref.auditRef, clone(ref));
    }
  }

  resolve(auditRef: string | null | undefined): AuditEvidenceReference | null {
    if (!auditRef) {
      return null;
    }
    const ref = this.refs.get(auditRef);
    return ref ? clone(ref) : null;
  }

  resolveGlobal(evidenceType: AuditEvidenceType): AuditEvidenceReference | null {
    const ref = Array.from(this.refs.values()).find(
      (entry) => entry.evidenceType === evidenceType && entry.journeyPathRef === null,
    );
    return ref ? clone(ref) : null;
  }

  resolveForRoute(
    evidenceType: AuditEvidenceType,
    journeyPathRef: string,
  ): AuditEvidenceReference | null {
    const ref = Array.from(this.refs.values()).find(
      (entry) => entry.evidenceType === evidenceType && entry.journeyPathRef === journeyPathRef,
    );
    return ref ? clone(ref) : this.resolveGlobal(evidenceType);
  }

  list(): AuditEvidenceReference[] {
    return Array.from(this.refs.values()).map((ref) => clone(ref));
  }
}

export class UIStateContractRegistry {
  private readonly contracts = new Map<string, UIStateContract>();

  constructor(seed: readonly UIStateContract[] = DEFAULT_UI_STATE_CONTRACTS) {
    for (const contract of seed) {
      this.contracts.set(contract.journeyPathRef, clone(contract));
    }
  }

  get(journeyPathRef: string): UIStateContract | null {
    const contract = this.contracts.get(journeyPathRef);
    return contract ? clone(contract) : null;
  }

  list(): UIStateContract[] {
    return Array.from(this.contracts.values()).map((contract) => clone(contract));
  }
}

export interface Phase7RouteReadinessApplication {
  readonly manifestApplication: Phase7NhsAppManifestApplication;
  readonly continuityRegistry: ContinuityEvidenceRegistry;
  readonly accessibleContentRegistry: AccessibleContentVariantRegistry;
  readonly auditResolver: AuditEvidenceReferenceResolver;
  readonly uiStateRegistry: UIStateContractRegistry;
  readonly bridgeSupportProfile: BridgeSupportProfile;
  evaluateRouteReadiness(input: EvaluateRouteReadinessInput): RouteReadinessResult;
  listRouteReadiness(
    input: Omit<EvaluateRouteReadinessInput, "journeyPathId">,
  ): RouteReadinessResult[];
  verifyPromotionReadiness(input: VerifyPromotionReadinessInput): PromotionReadinessResult;
  listEvidence(): RouteReadinessEvidenceInventory;
}

export interface RouteReadinessEvidenceInventory {
  readonly schemaVersion: typeof PHASE7_ROUTE_READINESS_SCHEMA_VERSION;
  readonly continuityEvidenceBundles: readonly NHSAppContinuityEvidenceBundle[];
  readonly accessibleContentVariants: readonly AccessibleContentVariant[];
  readonly auditEvidenceReferences: readonly AuditEvidenceReference[];
  readonly uiStateContracts: readonly UIStateContract[];
  readonly bridgeSupportProfile: BridgeSupportProfile;
}

export function createDefaultPhase7RouteReadinessApplication(input?: {
  readonly manifestApplication?: Phase7NhsAppManifestApplication;
  readonly continuityRegistry?: ContinuityEvidenceRegistry;
  readonly accessibleContentRegistry?: AccessibleContentVariantRegistry;
  readonly auditResolver?: AuditEvidenceReferenceResolver;
  readonly uiStateRegistry?: UIStateContractRegistry;
  readonly bridgeSupportProfile?: BridgeSupportProfile;
}): Phase7RouteReadinessApplication {
  const manifestApplication =
    input?.manifestApplication ?? createDefaultPhase7NhsAppManifestApplication();
  const continuityRegistry =
    input?.continuityRegistry ??
    ContinuityEvidenceRegistry.fromManifestSeed(
      manifestApplication.repository.listContinuityEvidenceBundles(PHASE7_MANIFEST_VERSION),
    );
  const accessibleContentRegistry =
    input?.accessibleContentRegistry ?? new AccessibleContentVariantRegistry();
  const auditResolver = input?.auditResolver ?? new AuditEvidenceReferenceResolver();
  const uiStateRegistry = input?.uiStateRegistry ?? new UIStateContractRegistry();
  const bridgeSupportProfile = input?.bridgeSupportProfile ?? clone(DEFAULT_BRIDGE_SUPPORT_PROFILE);

  function evaluateRouteReadiness(input: EvaluateRouteReadinessInput): RouteReadinessResult {
    const now = input.now ?? RECORDED_AT;
    const exposure = manifestApplication.getManifestExposure({
      environment: input.environment,
      expectedManifestVersion: input.expectedManifestVersion,
      expectedConfigFingerprint: input.expectedConfigFingerprint,
      expectedReleaseApprovalFreezeRef: input.expectedReleaseApprovalFreezeRef,
    });
    const route =
      exposure.routes.find((entry) => entry.journeyPathId === input.journeyPathId) ?? null;
    const journeyPath = route
      ? manifestApplication.repository.getJourneyPath(input.journeyPathId)
      : null;
    const releaseTuple = releaseTupleFromExposure(exposure, input);
    const continuityEvidence =
      releaseTuple.manifestVersionRef && journeyPath
        ? continuityRegistry.get(releaseTuple.manifestVersionRef, journeyPath.journeyPathId)
        : null;
    const accessibleContentVariant = accessibleContentRegistry.get(input.journeyPathId);
    const accessibilityAudit = auditResolver.resolve(
      accessibleContentVariant?.accessibilityAuditRef ?? null,
    );
    const compatibilityAudit = auditResolver.resolve(PHASE7_COMPATIBILITY_EVIDENCE_REF);
    const bridgeSupportAudit = auditResolver.resolveGlobal("bridge_support");
    const shellSemanticsAudit = auditResolver.resolveGlobal("shell_semantics");
    const uiStateContract = uiStateRegistry.get(input.journeyPathId);
    const failureReasons = collectFailureReasons({
      input,
      now,
      route,
      journeyPath,
      releaseTuple,
      continuityEvidence,
      accessibleContentVariant,
      accessibilityAudit,
      compatibilityAudit,
      bridgeSupportAudit,
      shellSemanticsAudit,
      uiStateContract,
      bridgeSupportProfile,
    });
    const verdict = verdictFor({
      failureReasons,
      route,
      journeyPath,
      uiStateContract,
      accessibilityAudit,
      accessibleContentVariant,
    });
    const tupleHash = hashString(
      stableStringify({
        environment: input.environment,
        journeyPathId: input.journeyPathId,
        releaseTuple,
        verdict,
        failureReasons,
        continuityEvidenceRef: continuityEvidence?.bundleId ?? null,
        accessibilityAuditRef: accessibilityAudit?.auditRef ?? null,
        uiStateContractRef: uiStateContract?.uiStateContractId ?? null,
        bridgeSupportProfileRef: bridgeSupportProfile.bridgeSupportProfileRef,
      }),
    );
    return freeze({
      readinessId: `RouteReadiness:383:${input.journeyPathId}:${tupleHash.slice(7, 23)}`,
      schemaVersion: PHASE7_ROUTE_READINESS_SCHEMA_VERSION,
      serviceAuthority: PHASE7_ROUTE_READINESS_SERVICE_NAME,
      environment: input.environment,
      journeyPathId: input.journeyPathId,
      routeFamilyRef: journeyPath?.journeyType ?? route?.journeyType ?? null,
      routePattern: journeyPath?.routePattern ?? route?.routePattern ?? null,
      classification: journeyPath?.classification ?? route?.classification ?? null,
      manifestExposureState: route?.exposureState ?? "missing",
      verdict,
      failureReasons,
      releaseTuple,
      evidence: {
        continuityEvidence,
        accessibleContentVariant,
        accessibilityAudit,
        compatibilityAudit,
        bridgeSupportAudit,
        shellSemanticsAudit,
        uiStateContract,
        bridgeSupportProfile: clone(bridgeSupportProfile),
      },
      computedAt: now,
      tupleHash,
    });
  }

  function listRouteReadiness(
    input: Omit<EvaluateRouteReadinessInput, "journeyPathId">,
  ): RouteReadinessResult[] {
    return DEFAULT_PROMOTION_ROUTE_IDS.map((journeyPathId) =>
      evaluateRouteReadiness({ ...input, journeyPathId }),
    );
  }

  function verifyPromotionReadiness(
    input: VerifyPromotionReadinessInput,
  ): PromotionReadinessResult {
    const routeIds = input.journeyPathIds?.length
      ? Array.from(input.journeyPathIds)
      : Array.from(DEFAULT_PROMOTION_ROUTE_IDS);
    const routeResults = routeIds.map((journeyPathId) =>
      evaluateRouteReadiness({
        environment: input.environment,
        journeyPathId,
        expectedManifestVersion: input.expectedManifestVersion,
        expectedConfigFingerprint: input.expectedConfigFingerprint,
        expectedReleaseCandidateRef: input.expectedReleaseCandidateRef,
        expectedReleaseApprovalFreezeRef: input.expectedReleaseApprovalFreezeRef,
        expectedBehaviorContractSetRef: input.expectedBehaviorContractSetRef,
        expectedSurfaceSchemaSetRef: input.expectedSurfaceSchemaSetRef,
        expectedCompatibilityEvidenceRef: input.expectedCompatibilityEvidenceRef,
        now: input.now,
      }),
    );
    const failureReasonsByRoute = Object.fromEntries(
      routeResults.map((result) => [
        result.journeyPathId,
        promotionFailuresFor(result, input.allowConditionallyReadyRoutes ?? false),
      ]),
    );
    const aggregateFailureReasons = unique(
      Object.values(failureReasonsByRoute)
        .flat()
        .concat(
          routeResults.some(
            (result) =>
              result.verdict === "conditionally_ready" &&
              !(input.allowConditionallyReadyRoutes ?? false),
          )
            ? ["promotion_policy_not_ready" as const]
            : [],
        ),
    );
    const promotionState: PromotionReadinessState =
      aggregateFailureReasons.length === 0 ? "promotable" : "blocked";
    const releaseTuple = routeResults[0]?.releaseTuple ?? defaultReleaseTuple();
    const promotionTupleHash = hashString(
      stableStringify({
        environment: input.environment,
        routeIds,
        promotionState,
        releaseTuple,
        aggregateFailureReasons,
      }),
    );
    return freeze({
      schemaVersion: PHASE7_ROUTE_READINESS_SCHEMA_VERSION,
      serviceAuthority: PHASE7_ROUTE_READINESS_SERVICE_NAME,
      promotionState,
      environment: input.environment,
      releaseTuple,
      routeResults,
      aggregateFailureReasons,
      failureReasonsByRoute,
      checkedAt: input.now ?? RECORDED_AT,
      promotionTupleHash,
    });
  }

  function listEvidence(): RouteReadinessEvidenceInventory {
    return freeze({
      schemaVersion: PHASE7_ROUTE_READINESS_SCHEMA_VERSION,
      continuityEvidenceBundles: continuityRegistry.list(),
      accessibleContentVariants: accessibleContentRegistry.list(),
      auditEvidenceReferences: auditResolver.list(),
      uiStateContracts: uiStateRegistry.list(),
      bridgeSupportProfile: clone(bridgeSupportProfile),
    });
  }

  return {
    manifestApplication,
    continuityRegistry,
    accessibleContentRegistry,
    auditResolver,
    uiStateRegistry,
    bridgeSupportProfile,
    evaluateRouteReadiness,
    listRouteReadiness,
    verifyPromotionReadiness,
    listEvidence,
  };
}

function collectFailureReasons(input: {
  readonly input: EvaluateRouteReadinessInput;
  readonly now: string;
  readonly route: ManifestExposureRoute | null;
  readonly journeyPath: JourneyPathDefinition | null;
  readonly releaseTuple: RouteReadinessReleaseTuple;
  readonly continuityEvidence: NHSAppContinuityEvidenceBundle | null;
  readonly accessibleContentVariant: AccessibleContentVariant | null;
  readonly accessibilityAudit: AuditEvidenceReference | null;
  readonly compatibilityAudit: AuditEvidenceReference | null;
  readonly bridgeSupportAudit: AuditEvidenceReference | null;
  readonly shellSemanticsAudit: AuditEvidenceReference | null;
  readonly uiStateContract: UIStateContract | null;
  readonly bridgeSupportProfile: BridgeSupportProfile;
}): RouteReadinessFailureReason[] {
  const failures: RouteReadinessFailureReason[] = [];
  appendAll(failures, releaseTupleFailures(input.input, input.releaseTuple));
  if (!input.route || !input.journeyPath) {
    appendUnique(failures, "manifest_route_missing");
    appendUnique(failures, "continuity_evidence_missing");
    appendUnique(failures, "accessibility_audit_missing");
    appendUnique(failures, "ui_state_contract_missing");
    return failures;
  }
  if (input.journeyPath.classification === "not_suitable_in_phase7") {
    appendUnique(failures, "route_not_suitable");
  }
  if (input.journeyPath.classification === "needs_embedded_adaptation_first") {
    appendUnique(failures, "route_requires_embedded_adaptation");
  }
  const continuityState = new ContinuityEvidenceRegistry().validate(input.continuityEvidence, {
    now: input.now,
    staleAfterDays: DEFAULT_STALE_AFTER_DAYS,
  });
  appendAll(failures, continuityState.failureReasons);
  if (!input.accessibleContentVariant) {
    appendUnique(failures, "accessibility_audit_missing");
  } else if (
    input.accessibleContentVariant.coverageState === "missing" ||
    input.accessibleContentVariant.mobileReadinessState === "not_verified"
  ) {
    appendUnique(failures, "accessibility_audit_missing");
  }
  if (!auditIsAcceptable(input.accessibilityAudit)) {
    appendUnique(failures, "accessibility_audit_missing");
  }
  if (input.accessibilityAudit?.state === "conditional") {
    appendUnique(failures, "manual_observation_pending");
  }
  if (!auditIsCurrent(input.compatibilityAudit)) {
    appendUnique(failures, "compatibility_evidence_missing");
  }
  if (!auditIsCurrent(input.bridgeSupportAudit) || !auditIsCurrent(input.shellSemanticsAudit)) {
    appendUnique(failures, "compatibility_evidence_missing");
  }
  if (!input.uiStateContract) {
    appendUnique(failures, "ui_state_contract_missing");
  } else {
    const ui = input.uiStateContract;
    if (
      ui.compatibleState === "incompatible" ||
      ui.semanticCoverageState === "missing" ||
      !ui.supportsReducedMotion ||
      !ui.supportsSafeAreaInsets ||
      !ui.supportsHostResize
    ) {
      appendUnique(failures, "incompatible_ui_state");
    }
    if (
      !ui.supportsPlaceholder &&
      input.journeyPath.classification === "needs_embedded_adaptation_first"
    ) {
      appendUnique(failures, "placeholder_contract_missing");
    }
    if (
      ui.requiredBridgeActionRefs.some(
        (action) => !input.bridgeSupportProfile.supportedBridgeActionRefs.includes(action),
      )
    ) {
      appendUnique(failures, "bridge_support_mismatch");
    }
  }
  if (
    input.journeyPath.classification === "needs_embedded_adaptation_first" &&
    !input.journeyPath.placeholderContractRef
  ) {
    appendUnique(failures, "placeholder_contract_missing");
  }
  return failures;
}

function verdictFor(input: {
  readonly failureReasons: readonly RouteReadinessFailureReason[];
  readonly route: ManifestExposureRoute | null;
  readonly journeyPath: JourneyPathDefinition | null;
  readonly uiStateContract: UIStateContract | null;
  readonly accessibilityAudit: AuditEvidenceReference | null;
  readonly accessibleContentVariant: AccessibleContentVariant | null;
}): RouteReadinessVerdict {
  if (
    input.failureReasons.includes("release_tuple_drift") ||
    input.failureReasons.includes("route_not_suitable") ||
    input.failureReasons.includes("incompatible_ui_state") ||
    input.failureReasons.includes("bridge_support_mismatch") ||
    input.failureReasons.includes("placeholder_contract_missing")
  ) {
    return "blocked";
  }
  if (
    input.failureReasons.includes("manifest_route_missing") ||
    input.failureReasons.includes("continuity_evidence_missing") ||
    input.failureReasons.includes("accessibility_audit_missing") ||
    input.failureReasons.includes("ui_state_contract_missing") ||
    input.failureReasons.includes("compatibility_evidence_missing") ||
    input.failureReasons.includes("continuity_evidence_stale")
  ) {
    return "evidence_missing";
  }
  if (
    input.journeyPath?.classification === "needs_embedded_adaptation_first" &&
    input.uiStateContract?.compatibleState === "placeholder_only" &&
    input.accessibleContentVariant?.coverageState === "placeholder_only"
  ) {
    return "placeholder_only";
  }
  if (
    input.failureReasons.includes("manual_observation_pending") ||
    input.uiStateContract?.compatibleState === "conditional" ||
    input.accessibilityAudit?.state === "conditional"
  ) {
    return "conditionally_ready";
  }
  return input.route ? "ready" : "evidence_missing";
}

function promotionFailuresFor(
  result: RouteReadinessResult,
  allowConditionallyReadyRoutes: boolean,
): RouteReadinessFailureReason[] {
  if (result.verdict === "ready") {
    return [];
  }
  if (allowConditionallyReadyRoutes && result.verdict === "conditionally_ready") {
    return [];
  }
  const reasons = [...result.failureReasons];
  if (result.verdict === "conditionally_ready" && !allowConditionallyReadyRoutes) {
    appendUnique(reasons, "promotion_policy_not_ready");
  }
  if (result.verdict === "placeholder_only") {
    appendUnique(reasons, "promotion_policy_not_ready");
  }
  return unique(reasons);
}

function releaseTupleFailures(
  input: EvaluateRouteReadinessInput,
  tuple: RouteReadinessReleaseTuple,
): RouteReadinessFailureReason[] {
  const checks = [
    [input.expectedManifestVersion, tuple.manifestVersionRef],
    [input.expectedConfigFingerprint, tuple.configFingerprint],
    [input.expectedReleaseCandidateRef, tuple.releaseCandidateRef],
    [input.expectedReleaseApprovalFreezeRef, tuple.releaseApprovalFreezeRef],
    [input.expectedBehaviorContractSetRef, tuple.behaviorContractSetRef],
    [input.expectedSurfaceSchemaSetRef, tuple.surfaceSchemaSetRef],
    [input.expectedCompatibilityEvidenceRef, tuple.compatibilityEvidenceRef],
  ] as const;
  if (checks.some(([expected, actual]) => expected && expected !== actual)) {
    return ["release_tuple_drift"];
  }
  if (
    tuple.manifestVersionRef !== PHASE7_MANIFEST_VERSION ||
    tuple.configFingerprint !== PHASE7_CONFIG_FINGERPRINT ||
    tuple.releaseCandidateRef !== PHASE7_RELEASE_CANDIDATE_REF ||
    tuple.releaseApprovalFreezeRef !== PHASE7_RELEASE_APPROVAL_FREEZE_REF ||
    tuple.behaviorContractSetRef !== PHASE7_BEHAVIOR_CONTRACT_SET_REF ||
    tuple.surfaceSchemaSetRef !== PHASE7_SURFACE_SCHEMA_SET_REF ||
    tuple.compatibilityEvidenceRef !== PHASE7_COMPATIBILITY_EVIDENCE_REF
  ) {
    return ["release_tuple_drift"];
  }
  return [];
}

function releaseTupleFromExposure(
  exposure: ReturnType<Phase7NhsAppManifestApplication["getManifestExposure"]>,
  input: EvaluateRouteReadinessInput,
): RouteReadinessReleaseTuple {
  return {
    manifestVersionRef: exposure.manifestVersion ?? input.expectedManifestVersion ?? null,
    configFingerprint: exposure.configFingerprint ?? input.expectedConfigFingerprint ?? null,
    releaseCandidateRef: exposure.releaseTuple.releaseCandidateRef,
    releaseApprovalFreezeRef:
      exposure.releaseTuple.releaseApprovalFreezeRef ??
      input.expectedReleaseApprovalFreezeRef ??
      null,
    behaviorContractSetRef: exposure.releaseTuple.behaviorContractSetRef,
    surfaceSchemaSetRef: exposure.releaseTuple.surfaceSchemaSetRef,
    compatibilityEvidenceRef: exposure.releaseTuple.compatibilityEvidenceRef,
  };
}

function defaultReleaseTuple(): RouteReadinessReleaseTuple {
  return {
    manifestVersionRef: PHASE7_MANIFEST_VERSION,
    configFingerprint: PHASE7_CONFIG_FINGERPRINT,
    releaseCandidateRef: PHASE7_RELEASE_CANDIDATE_REF,
    releaseApprovalFreezeRef: PHASE7_RELEASE_APPROVAL_FREEZE_REF,
    behaviorContractSetRef: PHASE7_BEHAVIOR_CONTRACT_SET_REF,
    surfaceSchemaSetRef: PHASE7_SURFACE_SCHEMA_SET_REF,
    compatibilityEvidenceRef: PHASE7_COMPATIBILITY_EVIDENCE_REF,
  };
}

function normalizeManifestContinuityEvidence(
  bundle: ManifestContinuityEvidenceBundle,
): NHSAppContinuityEvidenceBundle {
  return {
    ...bundle,
    supersededByRef: null,
    source: "manifest_seed",
  };
}

function buildContinuityEvidence(input: {
  readonly journeyPathRef: string;
  readonly routeFamilyRef: string;
  readonly continuityControlCode: string;
  readonly governingContractRef: string;
  readonly refs: readonly string[];
}): NHSAppContinuityEvidenceBundle {
  return {
    bundleId: `ContinuityEvidence:383:${input.routeFamilyRef}`,
    manifestVersionRef: PHASE7_MANIFEST_VERSION,
    journeyPathRef: input.journeyPathRef,
    continuityControlCode: input.continuityControlCode,
    governingContractRef: input.governingContractRef,
    experienceContinuityEvidenceRefs: input.refs,
    validationState: "trusted",
    blockingRefs: [],
    releaseApprovalFreezeRef: PHASE7_RELEASE_APPROVAL_FREEZE_REF,
    capturedAt: RECORDED_AT,
    supersededByRef: null,
    source: "route_readiness_registry",
  };
}

function audit(
  auditRef: string,
  evidenceType: AuditEvidenceType,
  input: {
    readonly journeyPathRef: string | null;
    readonly state: AuditEvidenceState;
    readonly evidenceSummaryRef: string;
    readonly sourceUrl: string | null;
  },
): AuditEvidenceReference {
  return {
    auditRef,
    evidenceType,
    journeyPathRef: input.journeyPathRef,
    manifestVersionRef: PHASE7_MANIFEST_VERSION,
    releaseApprovalFreezeRef: PHASE7_RELEASE_APPROVAL_FREEZE_REF,
    state: input.state,
    capturedAt: RECORDED_AT,
    expiresAt: "2026-10-24T01:05:15.000Z",
    evidenceSummaryRef: input.evidenceSummaryRef,
    sourceUrl: input.sourceUrl,
  };
}

function auditIsCurrent(ref: AuditEvidenceReference | null): boolean {
  return ref?.state === "current";
}

function auditIsAcceptable(ref: AuditEvidenceReference | null): boolean {
  return ref?.state === "current" || ref?.state === "conditional";
}

function continuityKey(manifestVersionRef: string, journeyPathRef: string): string {
  return `${manifestVersionRef}::${journeyPathRef}`;
}

function isOlderThan(
  capturedAt: string,
  now: string,
  staleAfterDays = DEFAULT_STALE_AFTER_DAYS,
): boolean {
  const captured = Date.parse(capturedAt);
  const current = Date.parse(now);
  if (!Number.isFinite(captured) || !Number.isFinite(current)) {
    return true;
  }
  return current - captured > staleAfterDays * 24 * 60 * 60 * 1000;
}

function appendUnique<T>(values: T[], value: T): void {
  if (!values.includes(value)) {
    values.push(value);
  }
}

function appendAll<T>(values: T[], additions: readonly T[]): void {
  for (const value of additions) {
    appendUnique(values, value);
  }
}

function unique<T>(values: readonly T[]): T[] {
  const result: T[] = [];
  for (const value of values) {
    appendUnique(result, value);
  }
  return result;
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

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function freeze<T extends object>(value: T): Readonly<T> {
  return Object.freeze(clone(value));
}
