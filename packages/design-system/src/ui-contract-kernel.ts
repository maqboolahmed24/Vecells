import {
  DESIGN_TOKEN_EXPORT_ARTIFACT_ID,
  DESIGN_TOKEN_FOUNDATION_REF,
  MODE_TUPLE_COVERAGE_REF,
  TOKEN_KERNEL_LAYERING_POLICY_ID,
  profileSelectionResolutions,
  profileTokens,
  type ContrastMode,
  type DensityMode,
  type ModeTuple,
  type MotionMode,
  type ShellType,
  type ThemeMode,
} from "./token-foundation";

export type BreakpointClass = "compact" | "narrow" | "medium" | "expanded" | "wide";
export type AudienceSurface =
  | "audsurf_patient_public_entry"
  | "audsurf_patient_authenticated_portal"
  | "audsurf_patient_transaction_recovery"
  | "audsurf_clinical_workspace"
  | "audsurf_support_workspace"
  | "audsurf_hub_desk"
  | "audsurf_pharmacy_console"
  | "audsurf_operations_console"
  | "audsurf_governance_admin";
export type AudienceTier =
  | "patient_public"
  | "patient_authenticated"
  | "staff"
  | "support"
  | "hub"
  | "pharmacy"
  | "operations"
  | "governance";
export type SurfacePostureState =
  | "ready"
  | "empty_actionable"
  | "empty_informational"
  | "loading_summary"
  | "settled_pending_confirmation"
  | "stale_review"
  | "read_only"
  | "blocked_recovery";
export type SurfaceStateClass =
  | "settled"
  | "loading"
  | "empty"
  | "sparse"
  | "stale"
  | "degraded"
  | "recovery"
  | "blocked";
export type FreshnessState = "fresh" | "aging" | "stale" | "disconnected";
export type TrustState = "trusted" | "partial" | "degraded" | "blocked";
export type SettlementState =
  | "none"
  | "settled"
  | "local_ack"
  | "server_accepted"
  | "awaiting_external"
  | "projection_seen"
  | "review_required"
  | "reverted"
  | "failed"
  | "expired";
export type WritableState = "writable" | "read_only" | "recovery_only" | "blocked";
export type ArtifactModeState =
  | "preview_verified"
  | "summary_only"
  | "handoff_only"
  | "preview_degraded"
  | "blocked";
export type EffectiveDisplayState =
  | "blocked"
  | "recovery"
  | "degraded"
  | "stale"
  | "read_only"
  | "settled_pending_confirmation"
  | "loading"
  | "empty"
  | "sparse"
  | "ready";
export type BindingState = "exact" | "stale" | "blocked";
export type CoverageState = "complete" | "degraded" | "blocked";
export type LintState = "exact" | "drifted" | "blocked";
export type StructuralSnapshotState = "exact" | "stale" | "missing";
export type PublicationState = "published" | "stale" | "blocked" | "withdrawn";
export type SemanticTone =
  | "neutral"
  | "accent_active"
  | "accent_review"
  | "accent_insight"
  | "accent_success"
  | "accent_danger";
export type MotionIntent =
  | "motion.reveal"
  | "motion.morph"
  | "motion.pending"
  | "motion.degrade"
  | "motion.recover"
  | "motion.escalate";
export type AriaLiveMode = "polite" | "assertive" | "off";

export interface VisualTokenProfile {
  visualTokenProfileId: string;
  shellType: ShellType;
  routeFamilyRef: string;
  designTokenFoundationRef: string;
  designTokenExportArtifactRef: string;
  tokenKernelLayeringPolicyRef: string;
  profileSelectionResolutionRef: string;
  shellVisualProfileRef: string;
  breakpointClass: BreakpointClass;
  densityProfileRef: string;
  spaceScaleRef: string;
  sizeScaleRef: string;
  typeScaleRef: string;
  radiusScaleRef: string;
  semanticColorProfileRef: string;
  topologyMetricRef: string;
  motionProfileRef: string;
  profileDigestRef: string;
  effectiveAt: string;
  source_refs: readonly string[];
}

export interface SurfaceStateSemanticsProfile {
  surfaceStateSemanticsProfileId: string;
  surfaceRef: string;
  visualTokenProfileRef: string;
  surfacePostureFrameRef: string;
  surfaceStateFrameRef: string;
  artifactStageRef: string;
  statusOwnerRef: string;
  effectiveSeverity: number;
  effectiveDisplayState: EffectiveDisplayState;
  effectiveTone: SemanticTone;
  ariaLiveMode: AriaLiveMode;
  motionIntentRef: MotionIntent;
  designContractVocabularyTupleRef: string;
  telemetryBindingProfileRef: string;
  automationAnchorMapRef: string;
  surfaceStateKernelBindingRef: string;
  stateSemanticsDigestRef: string;
  resolvedAt: string;
  source_refs: readonly string[];
}

export interface SurfaceStateKernelBinding {
  surfaceStateKernelBindingId: string;
  routeFamilyRef: string;
  surfaceRef: string;
  visualTokenProfileRef: string;
  surfaceStateSemanticsProfileRef: string;
  accessibilitySemanticCoverageProfileRef: string;
  automationAnchorMapRef: string;
  telemetryBindingProfileRef: string;
  artifactModePresentationProfileRef: string;
  designContractVocabularyTupleRef: string;
  bindingState: BindingState;
  kernelPropagationDigestRef: string;
  resolvedAt: string;
  source_refs: readonly string[];
}

export interface AutomationAnchorMap {
  automationAnchorMapId: string;
  surfaceRef: string;
  requiredDomMarkers: readonly string[];
  dominantActionMarkerRef: string;
  selectedAnchorMarkerRef: string;
  artifactMarkerRef: string;
  continuityMarkerRef: string;
  designContractVocabularyTupleRef: string;
  domMarkerSchemaRef: string;
  telemetryBindingProfileRef: string;
  anchorMapDigestRef: string;
  publishedAt: string;
  source_refs: readonly string[];
}

export interface TelemetryBindingProfile {
  telemetryBindingProfileId: string;
  surfaceRef: string;
  requiredUiEventRefs: readonly string[];
  designContractVocabularyTupleRef: string;
  requiredDomMarkerSchemaRef: string;
  redactionProfileRef: string;
  bindingDigestRef: string;
  publishedAt: string;
  source_refs: readonly string[];
}

export interface ArtifactModePresentationProfile {
  artifactModePresentationProfileId: string;
  artifactSurfaceFrameRef: string;
  artifactStageRef: string;
  summaryPolicyRef: string;
  previewPolicyRef: string;
  printPolicyRef: string;
  downloadPolicyRef: string;
  exportPolicyRef: string;
  handoffPolicyRef: string;
  returnAnchorRef: string;
  designContractVocabularyTupleRef: string;
  presentationDigestRef: string;
  effectiveAt: string;
  source_refs: readonly string[];
}

export interface DesignContractVocabularyTuple {
  designContractVocabularyTupleId: string;
  surfaceRef: string;
  stateClassVocabularyRef: string;
  stateReasonVocabularyRef: string;
  artifactModeVocabularyRef: string;
  breakpointVocabularyRef: string;
  selectedAnchorVocabularyRef: string;
  dominantActionVocabularyRef: string;
  automationMarkerVocabularyRef: string;
  telemetryEventVocabularyRef: string;
  tupleHash: string;
  publishedAt: string;
  source_refs: readonly string[];
}

export interface DesignContractPublicationBundle {
  designContractPublicationBundleId: string;
  audienceSurface: AudienceSurface;
  routeFamilyRefs: readonly string[];
  shellType: ShellType;
  breakpointCoverageRefs: readonly BreakpointClass[];
  modeTupleCoverageRef: string;
  designTokenExportArtifactRef: string;
  tokenKernelLayeringPolicyRef: string;
  profileSelectionResolutionRefs: readonly string[];
  visualTokenProfileRefs: readonly string[];
  surfaceStateSemanticsProfileRefs: readonly string[];
  surfaceStateKernelBindingRefs: readonly string[];
  accessibilitySemanticCoverageProfileRefs: readonly string[];
  automationAnchorMapRefs: readonly string[];
  telemetryBindingProfileRefs: readonly string[];
  artifactModePresentationProfileRefs: readonly string[];
  designContractVocabularyTupleRefs: readonly string[];
  designContractDigestRef: string;
  structuralSnapshotRefs: readonly string[];
  lintVerdictRef: string;
  publicationState: PublicationState;
  publishedAt: string;
  source_refs: readonly string[];
}

export interface DesignContractLintVerdict {
  designContractLintVerdictId: string;
  designContractPublicationBundleRef: string;
  tokenLatticeState: LintState;
  profileLayeringState: LintState;
  modeResolutionState: LintState;
  surfaceSemanticsState: LintState;
  kernelStatePropagationState: LintState;
  accessibilitySemanticCoverageState: LintState;
  automationTelemetryParityState: LintState;
  artifactModeParityState: LintState;
  surfaceRoleUsageState: LintState;
  structuralSnapshotState: StructuralSnapshotState;
  result: "pass" | "blocked";
  recordedAt: string;
  source_refs: readonly string[];
}

export interface AccessibilitySemanticCoverageProfile {
  accessibilitySemanticCoverageProfileId: string;
  routeFamilyRef: string;
  shellType: ShellType;
  audienceTier: AudienceTier;
  profileSelectionResolutionRef: string;
  semanticSurfaceRefs: readonly string[];
  accessibleSurfaceContractRefs: readonly string[];
  keyboardInteractionContractRefs: readonly string[];
  focusTransitionContractRefs: readonly string[];
  assistiveAnnouncementContractRefs: readonly string[];
  freshnessAccessibilityContractRefs: readonly string[];
  assistiveTextPolicyRef: string;
  fieldAccessibilityContractRefs: readonly string[];
  formErrorSummaryContractRefs: readonly string[];
  timeoutRecoveryContractRefs: readonly string[];
  visualizationFallbackContractRefs: readonly string[];
  visualizationTableContractRefs: readonly string[];
  visualizationParityProjectionRefs: readonly string[];
  automationAnchorProfileRef: string;
  automationAnchorMapRef: string;
  surfaceStateSemanticsProfileRefs: readonly string[];
  surfaceStateKernelBindingRefs: readonly string[];
  designContractPublicationBundleRef: string;
  requiredBreakpointClassRefs: readonly BreakpointClass[];
  missionStackCoverageRef: string;
  hostResizeCoverageRef: string;
  embeddedSafeAreaCoverageRef: string;
  reducedMotionEquivalenceRef: string;
  bufferedUpdateCoverageRefs: readonly string[];
  coverageTupleHash: string;
  coverageState: CoverageState;
  verifiedAt: string;
  source_refs: readonly string[];
}

export interface GapResolutionRecord {
  gapId: string;
  classification: "gap_resolution";
  statement: string;
  implementedRule: string;
  source_refs: readonly string[];
}

export interface FollowOnDependencyRecord {
  dependencyId: string;
  classification: "follow_on_dependency";
  routeFamilyRef: string;
  statement: string;
  safeFallback: string;
  source_refs: readonly string[];
}

export interface KernelCoverageGapRecord {
  gapId: string;
  classification: "kernel_coverage_gap";
  routeFamilyRef: string;
  coverageState: CoverageState;
  statement: string;
  failClosedSurfaceState: string;
  source_refs: readonly string[];
}

export interface StudioScenario {
  scenarioId: string;
  routeFamilyRef: string;
  audienceSurface: AudienceSurface;
  label: string;
  postureState: SurfacePostureState;
  stateClass: SurfaceStateClass;
  freshnessState: FreshnessState;
  trustState: TrustState;
  settlementState: SettlementState;
  writableState: WritableState;
  artifactModeState: ArtifactModeState;
  effectiveDisplayState: EffectiveDisplayState;
  effectiveTone: SemanticTone;
  ariaLiveMode: AriaLiveMode;
  motionIntentRef: MotionIntent;
  dominantActionLabel: string;
  selectedAnchorLabel: string;
  bindingState: BindingState;
  accessibilityCoverageState: CoverageState;
  artifactPosture: string;
}

export interface UiContractKernelPublicationArtifact {
  task_id: string;
  generated_at: string;
  captured_on: string;
  visual_mode: string;
  mission: string;
  source_precedence: readonly string[];
  upstream_inputs: readonly string[];
  summary: {
    bundle_count: number;
    route_family_count: number;
    exact_binding_count: number;
    stale_binding_count: number;
    blocked_binding_count: number;
    accessibility_complete_count: number;
    accessibility_degraded_count: number;
    lint_pass_count: number;
    lint_blocked_count: number;
  };
  gap_resolutions: readonly GapResolutionRecord[];
  kernel_coverage_gaps: readonly KernelCoverageGapRecord[];
  follow_on_dependencies: readonly FollowOnDependencyRecord[];
  precedence_equation: {
    posture_priority: typeof POSTURE_PRIORITY;
    state_class_priority: typeof STATE_CLASS_PRIORITY;
    freshness_priority: typeof FRESHNESS_PRIORITY;
    trust_priority: typeof TRUST_PRIORITY;
    settlement_priority: typeof SETTLEMENT_PRIORITY;
    writable_priority: typeof WRITABLE_PRIORITY;
    artifact_priority: typeof ARTIFACT_PRIORITY;
    tie_break_order: readonly EffectiveDisplayState[];
  };
  supported_mode_tuples: readonly ModeTuple[];
  studio_scenarios: readonly StudioScenario[];
  designContractPublicationBundles: readonly DesignContractPublicationBundle[];
  visualTokenProfiles: readonly VisualTokenProfile[];
  surfaceStateSemanticsProfiles: readonly SurfaceStateSemanticsProfile[];
  surfaceStateKernelBindings: readonly SurfaceStateKernelBinding[];
  accessibilitySemanticCoverageProfiles: readonly AccessibilitySemanticCoverageProfile[];
  automationAnchorMaps: readonly AutomationAnchorMap[];
  telemetryBindingProfiles: readonly TelemetryBindingProfile[];
  artifactModePresentationProfiles: readonly ArtifactModePresentationProfile[];
  designContractVocabularyTuples: readonly DesignContractVocabularyTuple[];
}

export interface UiContractLintVerdictArtifact {
  task_id: string;
  generated_at: string;
  captured_on: string;
  visual_mode: string;
  summary: {
    lint_verdict_count: number;
    pass_count: number;
    blocked_count: number;
  };
  gap_resolutions: readonly GapResolutionRecord[];
  kernel_coverage_gaps: readonly KernelCoverageGapRecord[];
  follow_on_dependencies: readonly FollowOnDependencyRecord[];
  designContractLintVerdicts: readonly DesignContractLintVerdict[];
}

export interface UiContractAutomationAnchorArtifact {
  task_id: string;
  generated_at: string;
  captured_on: string;
  summary: {
    automation_anchor_map_count: number;
    unique_dom_marker_count: number;
  };
  automationAnchorMaps: readonly AutomationAnchorMap[];
}

export interface UiContractAccessibilityArtifact {
  task_id: string;
  generated_at: string;
  captured_on: string;
  summary: {
    accessibility_profile_count: number;
    complete_count: number;
    degraded_count: number;
    blocked_count: number;
  };
  accessibilitySemanticCoverageProfiles: readonly AccessibilitySemanticCoverageProfile[];
}

export interface SurfaceStateKernelBindingCsvRow {
  surface_state_kernel_binding_id: string;
  route_family_ref: string;
  audience_surface: AudienceSurface;
  shell_type: ShellType;
  binding_state: BindingState;
  accessibility_coverage_state: CoverageState;
  artifact_mode_state: ArtifactModeState;
  effective_display_state: EffectiveDisplayState;
  effective_tone: SemanticTone;
  aria_live_mode: AriaLiveMode;
  motion_intent_ref: MotionIntent;
  dominant_action_marker_ref: string;
  selected_anchor_marker_ref: string;
  kernel_propagation_digest_ref: string;
  design_contract_digest_ref: string;
}

export interface KernelRouteSeed {
  routeFamilyRef: string;
  routeFamilyLabel: string;
  shellType: ShellType;
  audienceSurface: AudienceSurface;
  designContractPublicationBundleRef: string;
  lintVerdictRef: string;
  profileSelectionResolutionRefs: readonly string[];
  visualTokenProfileRef: string;
  accessibilitySemanticCoverageProfileRef: string;
  automationAnchorProfileRef: string;
  automationAnchorMapRef: string;
  surfaceStateSemanticsProfileRef: string;
  surfaceStateKernelBindingRef: string;
  telemetryBindingProfileRef: string;
  artifactModePresentationProfileRef: string;
  designContractVocabularyTupleRef: string;
  keyboardModel: string;
  focusTransitionScope: string;
  landmarks: readonly string[];
  breakpointCoverageRefs: readonly BreakpointClass[];
  modeCoverageRefs: readonly string[];
  requiredDomMarkers: readonly string[];
  requiredDataAttributes: readonly string[];
  verificationState: string;
}

export interface KernelBundleSeed {
  designContractPublicationBundleId: string;
  lintVerdictRef: string;
  audienceSurface: AudienceSurface;
  shellType: ShellType;
  routeFamilyRefs: readonly string[];
  structuralSnapshotRefs: readonly string[];
}

export interface UiContractKernelBuildInput {
  generatedAt: string;
  capturedOn: string;
  routeSeeds: readonly KernelRouteSeed[];
  bundleSeeds: readonly KernelBundleSeed[];
}

interface MockSurfaceTruth {
  postureState: SurfacePostureState;
  stateClass: SurfaceStateClass;
  freshnessState: FreshnessState;
  trustState: TrustState;
  settlementState: SettlementState;
  writableState: WritableState;
  artifactModeState: ArtifactModeState;
  statusOwnerRef: string;
  surfaceReasonRef: string;
  dominantActionLabel: string;
  selectedAnchorLabel: string;
  artifactPosture: string;
  accessibilityCoverageState: CoverageState;
}

interface RouteEvaluationRecord {
  route: KernelRouteSeed;
  truth: MockSurfaceTruth;
  visualTokenProfile: VisualTokenProfile;
  vocabularyTuple: DesignContractVocabularyTuple;
  telemetryBindingProfile: TelemetryBindingProfile;
  automationAnchorMap: AutomationAnchorMap;
  artifactModePresentationProfile: ArtifactModePresentationProfile;
  surfaceStateSemanticsProfile: SurfaceStateSemanticsProfile;
  accessibilitySemanticCoverageProfile: AccessibilitySemanticCoverageProfile;
  surfaceStateKernelBinding: SurfaceStateKernelBinding;
  studioScenario: StudioScenario;
}

export const UI_CONTRACT_KERNEL_TASK_ID = "par_104";
export const UI_CONTRACT_KERNEL_VISUAL_MODE = "Kernel_Atlas";
export const UI_CONTRACT_KERNEL_SCHEMA_PATH =
  "packages/design-system/contracts/ui-contract-kernel.schema.json";
export const UI_CONTRACT_KERNEL_SOURCE_PRECEDENCE = [
  "prompt/104.md",
  "prompt/shared_operating_contract_096_to_105.md",
  "prompt/AGENT.md",
  "prompt/checklist.md",
  "blueprint/canonical-ui-contract-kernel.md#Canonical contracts",
  "blueprint/canonical-ui-contract-kernel.md#4. State-severity equation and display precedence",
  "blueprint/canonical-ui-contract-kernel.md#6. Accessibility, telemetry, and automation anchors",
  "blueprint/platform-frontend-blueprint.md#7. Canonical motion, accessibility, and verification system",
  "blueprint/platform-frontend-blueprint.md#7.8 Verification and Playwright contract",
  "blueprint/platform-frontend-blueprint.md#AccessibilitySemanticCoverageProfile",
  "blueprint/accessibility-and-content-system-contract.md#AccessibilitySemanticCoverageProfile",
  "blueprint/design-token-foundation.md#Machine-readable export contract",
  "blueprint/ux-quiet-clarity-redesign.md#Redesign concept",
  "blueprint/forensic-audit-findings.md#Finding 86",
  "blueprint/forensic-audit-findings.md#Finding 97",
  "blueprint/forensic-audit-findings.md#Finding 103",
  "blueprint/forensic-audit-findings.md#Finding 116",
  "blueprint/forensic-audit-findings.md#Finding 117",
  "blueprint/forensic-audit-findings.md#Finding 118",
  "blueprint/forensic-audit-findings.md#Finding 120",
  "data/analysis/design_token_export_artifact.json",
  "data/analysis/frontend_contract_manifests.json",
  "data/analysis/frontend_accessibility_and_automation_profiles.json",
  "data/analysis/design_contract_publication_bundles.json",
  "data/analysis/runtime_publication_bundles.json",
] as const;

export const UI_KERNEL_ROUTE_ROOT_MARKERS = [
  "data-shell-type",
  "data-channel-profile",
  "data-route-family",
  "data-design-contract-digest",
  "data-design-contract-state",
  "data-design-contract-lint-state",
  "data-layout-topology",
  "data-breakpoint-class",
  "data-density-profile",
  "data-surface-state",
  "data-state-owner",
  "data-state-reason",
  "data-writable-state",
  "data-dominant-action",
  "data-anchor-id",
  "data-anchor-state",
  "data-artifact-stage",
  "data-artifact-mode",
  "data-transfer-state",
  "data-continuity-key",
  "data-return-anchor",
  "data-accessibility-coverage-state",
  "data-semantic-surface",
  "data-keyboard-model",
  "data-focus-transition-scope",
  "data-live-announce-state",
] as const;

export const POSTURE_PRIORITY = {
  ready: 0,
  empty_actionable: 1,
  empty_informational: 1,
  loading_summary: 2,
  settled_pending_confirmation: 3,
  stale_review: 4,
  read_only: 4,
  blocked_recovery: 5,
} as const;

export const STATE_CLASS_PRIORITY = {
  settled: 0,
  loading: 1,
  empty: 1,
  sparse: 1,
  stale: 3,
  degraded: 4,
  recovery: 5,
  blocked: 5,
} as const;

export const FRESHNESS_PRIORITY = {
  fresh: 0,
  aging: 1,
  stale: 4,
  disconnected: 5,
} as const;

export const TRUST_PRIORITY = {
  trusted: 0,
  partial: 2,
  degraded: 4,
  blocked: 5,
} as const;

export const SETTLEMENT_PRIORITY = {
  none: 0,
  settled: 0,
  local_ack: 1,
  server_accepted: 2,
  awaiting_external: 3,
  projection_seen: 3,
  review_required: 4,
  reverted: 4,
  failed: 5,
  expired: 5,
} as const;

export const WRITABLE_PRIORITY = {
  writable: 0,
  read_only: 3,
  recovery_only: 4,
  blocked: 5,
} as const;

export const ARTIFACT_PRIORITY = {
  preview_verified: 0,
  summary_only: 2,
  handoff_only: 3,
  preview_degraded: 4,
  blocked: 5,
} as const;

export const DISPLAY_STATE_TIE_BREAK_ORDER = [
  "blocked",
  "recovery",
  "degraded",
  "stale",
  "read_only",
  "settled_pending_confirmation",
  "loading",
  "empty",
  "sparse",
  "ready",
] as const satisfies readonly EffectiveDisplayState[];

const ROUTE_ROOT_MARKER_SET = new Set<string>(UI_KERNEL_ROUTE_ROOT_MARKERS);
const COVERAGE_GAP_ROUTES = new Set([
  "rf_support_replay_observe",
  "rf_operations_board",
  "rf_operations_drilldown",
  "rf_governance_shell",
]);
const ARTIFACT_FOLLOW_ON_ROUTES = new Set(["rf_patient_embedded_channel"]);
const VISUALIZATION_HEAVY_ROUTES = new Set([
  "rf_support_replay_observe",
  "rf_operations_board",
  "rf_operations_drilldown",
  "rf_hub_case_management",
  "rf_hub_queue",
  "rf_governance_shell",
]);

const PROFILE_BY_SHELL = new Map(profileSelectionResolutions.map((row) => [row.shellType, row]));
const PROFILE_TOKEN_BY_SHELL = new Map(profileTokens.map((row) => [row.shellType, row]));

function deterministicHashHex(value: string): string {
  let left = 0x811c9dc5 ^ value.length;
  let right = 0x9e3779b9 ^ value.length;
  let upper = 0xc2b2ae35 ^ value.length;
  let lower = 0x27d4eb2f ^ value.length;

  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    left = Math.imul(left ^ code, 0x01000193);
    right = Math.imul(right ^ ((code << (index % 8)) >>> 0), 0x85ebca6b);
    upper = Math.imul(upper ^ (code + index), 0x165667b1);
    lower = Math.imul(lower ^ (code + value.length - index), 0xd3a2646c);
  }

  return [left >>> 0, right >>> 0, upper >>> 0, lower >>> 0]
    .map((part) => part.toString(16).padStart(8, "0"))
    .join("");
}

function stableDigest(value: unknown, length = 16): string {
  return deterministicHashHex(JSON.stringify(value)).slice(0, length);
}

function titleFromRoute(routeFamilyRef: string): string {
  return routeFamilyRef
    .replace(/^rf_/, "")
    .split("_")
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

function shellToAudienceTier(audienceSurface: AudienceSurface, shellType: ShellType): AudienceTier {
  if (audienceSurface === "audsurf_patient_public_entry") {
    return "patient_public";
  }
  if (
    audienceSurface === "audsurf_patient_authenticated_portal" ||
    audienceSurface === "audsurf_patient_transaction_recovery"
  ) {
    return "patient_authenticated";
  }
  if (shellType === "staff") {
    return "staff";
  }
  if (shellType === "support") {
    return "support";
  }
  if (shellType === "hub") {
    return "hub";
  }
  if (shellType === "pharmacy") {
    return "pharmacy";
  }
  if (shellType === "operations") {
    return "operations";
  }
  return "governance";
}

function classifySurface(routeFamilyRef: string): MockSurfaceTruth {
  const base: MockSurfaceTruth = {
    postureState: "ready",
    stateClass: "settled",
    freshnessState: "fresh",
    trustState: "trusted",
    settlementState: "settled",
    writableState: "writable",
    artifactModeState: "preview_verified",
    statusOwnerRef: "status_owner.surface_frame",
    surfaceReasonRef: "reason.authoritative_ready",
    dominantActionLabel: "Review dominant action",
    selectedAnchorLabel: `${titleFromRoute(routeFamilyRef)} anchor`,
    artifactPosture: "contract_permitted_preview",
    accessibilityCoverageState: "complete",
  };

  const overrides: Record<string, Partial<MockSurfaceTruth>> = {
    rf_staff_workspace: {
      postureState: "loading_summary",
      stateClass: "loading",
      settlementState: "none",
      surfaceReasonRef: "reason.initial_projection_fill",
      dominantActionLabel: "Wait for queue hydration",
    },
    rf_staff_workspace_child: {
      postureState: "read_only",
      stateClass: "settled",
      writableState: "read_only",
      surfaceReasonRef: "reason.parent_scope_lock",
      dominantActionLabel: "Return to primary workspace",
    },
    rf_hub_queue: {
      postureState: "empty_actionable",
      stateClass: "sparse",
      settlementState: "none",
      surfaceReasonRef: "reason.queue_sparse_but_actionable",
      dominantActionLabel: "Expand coordination filter",
    },
    rf_hub_case_management: {
      postureState: "settled_pending_confirmation",
      stateClass: "settled",
      settlementState: "awaiting_external",
      surfaceReasonRef: "reason.pending_external_offer_confirmation",
      dominantActionLabel: "Hold current offer",
    },
    rf_patient_health_record: {
      postureState: "stale_review",
      stateClass: "stale",
      freshnessState: "aging",
      surfaceReasonRef: "reason.awaiting_clinical_refresh",
      dominantActionLabel: "Refresh clinical record",
    },
    rf_support_ticket_workspace: {
      postureState: "stale_review",
      stateClass: "stale",
      freshnessState: "stale",
      settlementState: "review_required",
      surfaceReasonRef: "reason.evidence_waiting_review",
      dominantActionLabel: "Resume ticket triage",
    },
    rf_support_replay_observe: {
      postureState: "stale_review",
      stateClass: "degraded",
      freshnessState: "stale",
      trustState: "partial",
      settlementState: "review_required",
      writableState: "read_only",
      artifactModeState: "summary_only",
      surfaceReasonRef: "reason.replay_semantic_gap",
      dominantActionLabel: "Open replay summary",
      artifactPosture: "summary_only",
      accessibilityCoverageState: "degraded",
    },
    rf_patient_secure_link_recovery: {
      postureState: "blocked_recovery",
      stateClass: "recovery",
      trustState: "partial",
      writableState: "recovery_only",
      artifactModeState: "summary_only",
      surfaceReasonRef: "reason.linkage_recovery_required",
      dominantActionLabel: "Re-arm secure recovery",
      artifactPosture: "summary_only",
    },
    rf_patient_embedded_channel: {
      postureState: "settled_pending_confirmation",
      stateClass: "settled",
      settlementState: "server_accepted",
      artifactModeState: "handoff_only",
      surfaceReasonRef: "reason.host_shell_controls_artifact_preview",
      dominantActionLabel: "Return to host handoff",
      artifactPosture: "external_handoff",
    },
    rf_operations_board: {
      postureState: "stale_review",
      stateClass: "degraded",
      freshnessState: "aging",
      trustState: "partial",
      writableState: "read_only",
      artifactModeState: "summary_only",
      surfaceReasonRef: "reason.operations_accessibility_gap",
      dominantActionLabel: "Inspect anomaly summary",
      artifactPosture: "summary_only",
      accessibilityCoverageState: "degraded",
    },
    rf_operations_drilldown: {
      postureState: "blocked_recovery",
      stateClass: "blocked",
      freshnessState: "stale",
      trustState: "degraded",
      settlementState: "review_required",
      writableState: "blocked",
      artifactModeState: "blocked",
      surfaceReasonRef: "reason.prominence_contract_blocked",
      dominantActionLabel: "Recover drilldown evidence",
      artifactPosture: "blocked",
      accessibilityCoverageState: "degraded",
    },
    rf_governance_shell: {
      postureState: "read_only",
      stateClass: "stale",
      freshnessState: "aging",
      settlementState: "projection_seen",
      writableState: "read_only",
      artifactModeState: "summary_only",
      surfaceReasonRef: "reason.approval_evidence_semantics_incomplete",
      dominantActionLabel: "Review approval summary",
      artifactPosture: "summary_only",
      accessibilityCoverageState: "degraded",
    },
  };

  return {
    ...base,
    ...overrides[routeFamilyRef],
  };
}

export interface StatePrecedenceInput {
  postureState: SurfacePostureState;
  stateClass: SurfaceStateClass;
  freshnessState: FreshnessState;
  trustState: TrustState;
  settlementState: SettlementState;
  writableState: WritableState;
  artifactModeState: ArtifactModeState;
  accentTone: SemanticTone;
}

export interface StatePrecedenceResult {
  effectiveSeverity: number;
  effectiveDisplayState: EffectiveDisplayState;
  effectiveTone: SemanticTone;
  ariaLiveMode: AriaLiveMode;
  motionIntentRef: MotionIntent;
}

export function resolveStatePrecedence(
  input: StatePrecedenceInput,
): StatePrecedenceResult {
  const severity = Math.max(
    POSTURE_PRIORITY[input.postureState],
    STATE_CLASS_PRIORITY[input.stateClass],
    FRESHNESS_PRIORITY[input.freshnessState],
    TRUST_PRIORITY[input.trustState],
    SETTLEMENT_PRIORITY[input.settlementState],
    WRITABLE_PRIORITY[input.writableState],
    ARTIFACT_PRIORITY[input.artifactModeState],
  );

  let effectiveDisplayState: EffectiveDisplayState = "ready";

  if (
    input.stateClass === "blocked" ||
    input.freshnessState === "disconnected" ||
    input.trustState === "blocked" ||
    input.settlementState === "failed" ||
    input.settlementState === "expired" ||
    input.writableState === "blocked" ||
    input.artifactModeState === "blocked"
  ) {
    effectiveDisplayState = "blocked";
  } else if (
    input.stateClass === "recovery" ||
    input.writableState === "recovery_only" ||
    input.postureState === "blocked_recovery"
  ) {
    effectiveDisplayState = "recovery";
  } else if (
    input.stateClass === "degraded" ||
    input.trustState === "degraded" ||
    input.artifactModeState === "preview_degraded"
  ) {
    effectiveDisplayState = "degraded";
  } else if (
    input.stateClass === "stale" ||
    input.freshnessState === "stale" ||
    input.postureState === "stale_review" ||
    input.settlementState === "review_required"
  ) {
    effectiveDisplayState = "stale";
  } else if (input.postureState === "read_only" || input.writableState === "read_only") {
    effectiveDisplayState = "read_only";
  } else if (
    input.postureState === "settled_pending_confirmation" ||
    input.settlementState === "server_accepted" ||
    input.settlementState === "awaiting_external" ||
    input.settlementState === "projection_seen"
  ) {
    effectiveDisplayState = "settled_pending_confirmation";
  } else if (input.postureState === "loading_summary" || input.stateClass === "loading") {
    effectiveDisplayState = "loading";
  } else if (
    input.postureState === "empty_actionable" ||
    input.postureState === "empty_informational" ||
    input.stateClass === "empty"
  ) {
    effectiveDisplayState = "empty";
  } else if (input.stateClass === "sparse") {
    effectiveDisplayState = "sparse";
  }

  const toneByDisplayState: Record<EffectiveDisplayState, SemanticTone> = {
    blocked: "accent_danger",
    recovery: "accent_review",
    degraded: "accent_review",
    stale: "accent_review",
    read_only: "neutral",
    settled_pending_confirmation: "accent_active",
    loading: "neutral",
    empty: "accent_insight",
    sparse: "neutral",
    ready: input.accentTone,
  };

  const liveModeByDisplayState: Record<EffectiveDisplayState, AriaLiveMode> = {
    blocked: "assertive",
    recovery: "assertive",
    degraded: input.settlementState === "review_required" ? "assertive" : "polite",
    stale: input.settlementState === "review_required" ? "assertive" : "polite",
    read_only: "polite",
    settled_pending_confirmation: "polite",
    loading: "polite",
    empty: "polite",
    sparse: "polite",
    ready: "off",
  };

  const motionByDisplayState: Record<EffectiveDisplayState, MotionIntent> = {
    blocked: "motion.escalate",
    recovery: "motion.recover",
    degraded: "motion.degrade",
    stale: "motion.degrade",
    read_only: "motion.degrade",
    settled_pending_confirmation: "motion.pending",
    loading: "motion.reveal",
    empty: "motion.reveal",
    sparse: "motion.morph",
    ready: "motion.morph",
  };

  return {
    effectiveSeverity: severity,
    effectiveDisplayState,
    effectiveTone: toneByDisplayState[effectiveDisplayState],
    ariaLiveMode: liveModeByDisplayState[effectiveDisplayState],
    motionIntentRef: motionByDisplayState[effectiveDisplayState],
  };
}

function toSupportedModeTuples(): ModeTuple[] {
  const themes: ThemeMode[] = ["light", "dark"];
  const contrasts: ContrastMode[] = ["standard", "high"];
  const densities: DensityMode[] = ["relaxed", "balanced", "compact"];
  const motions: MotionMode[] = ["full", "reduced", "essential_only"];
  const tuples: ModeTuple[] = [];

  for (const theme of themes) {
    for (const contrast of contrasts) {
      for (const density of densities) {
        for (const motion of motions) {
          tuples.push({ theme, contrast, density, motion });
        }
      }
    }
  }

  return tuples;
}

function telemetryEventRefs(routeFamilyRef: string): string[] {
  const core = routeFamilyRef.replace(/^rf_/, "");
  return [
    `ui.surface.${core}.viewed`,
    `ui.surface.${core}.state_changed`,
    `ui.surface.${core}.dominant_action`,
    `ui.surface.${core}.artifact_mode_changed`,
  ];
}

function mergeRouteDomMarkers(route: KernelRouteSeed): string[] {
  const markers = new Set<string>(route.requiredDomMarkers);
  for (const marker of ROUTE_ROOT_MARKER_SET) {
    markers.add(marker);
  }
  markers.add(`${route.routeFamilyRef}-root`);
  markers.add("data-design-contract-digest");
  markers.add("data-design-contract-state");
  markers.add("data-design-contract-lint-state");
  return [...markers];
}

function artifactBlueprint(route: KernelRouteSeed, truth: MockSurfaceTruth) {
  const isFollowOn = ARTIFACT_FOLLOW_ON_ROUTES.has(route.routeFamilyRef);
  const previewPolicyRef =
    truth.artifactModeState === "preview_verified"
      ? "artifact.preview.contract_permitted"
      : truth.artifactModeState === "preview_degraded"
        ? "artifact.preview.degraded"
        : "artifact.preview.summary_only";
  const printPolicyRef =
    route.shellType === "patient" || route.shellType === "pharmacy"
      ? "artifact.print.ready"
      : "artifact.print.unavailable";
  const downloadPolicyRef =
    truth.artifactModeState === "blocked"
      ? "artifact.download.blocked"
      : truth.artifactModeState === "summary_only"
        ? "artifact.download.summary_guarded"
        : "artifact.download.byte_download";
  const exportPolicyRef =
    isFollowOn || truth.artifactModeState === "handoff_only"
      ? "artifact.export.follow_on_summary_only"
      : "artifact.export.contractual";
  const handoffPolicyRef =
    truth.artifactModeState === "handoff_only"
      ? "artifact.handoff.external_required"
      : "artifact.handoff.optional";
  const artifactStageRef =
    truth.artifactModeState === "handoff_only"
      ? "artifact_stage.handoff"
      : truth.artifactModeState === "summary_only"
        ? "artifact_stage.summary"
        : truth.artifactModeState === "blocked"
          ? "artifact_stage.blocked"
          : "artifact_stage.preview";

  return {
    artifactStageRef,
    summaryPolicyRef: "artifact.summary.always_available",
    previewPolicyRef,
    printPolicyRef,
    downloadPolicyRef,
    exportPolicyRef,
    handoffPolicyRef,
  };
}

function buildRouteEvaluation(route: KernelRouteSeed, generatedAt: string): RouteEvaluationRecord {
  const truth = classifySurface(route.routeFamilyRef);
  const profileSelection = PROFILE_BY_SHELL.get(route.shellType);
  const profileToken = PROFILE_TOKEN_BY_SHELL.get(route.shellType);

  if (!profileSelection || !profileToken) {
    throw new Error(`Missing par_103 token profile coverage for shell ${route.shellType}.`);
  }

  const precedence = resolveStatePrecedence({
    postureState: truth.postureState,
    stateClass: truth.stateClass,
    freshnessState: truth.freshnessState,
    trustState: truth.trustState,
    settlementState: truth.settlementState,
    writableState: truth.writableState,
    artifactModeState: truth.artifactModeState,
    accentTone: profileToken.accentRole === "active"
      ? "accent_active"
      : profileToken.accentRole === "review"
        ? "accent_review"
        : profileToken.accentRole === "insight"
          ? "accent_insight"
          : profileToken.accentRole === "success"
            ? "accent_success"
            : "accent_danger",
  });

  const vocabularyTuple: DesignContractVocabularyTuple = {
    designContractVocabularyTupleId: route.designContractVocabularyTupleRef,
    surfaceRef: route.routeFamilyRef,
    stateClassVocabularyRef: "dcv.state_class.signal_atlas_live.v1",
    stateReasonVocabularyRef: "dcv.state_reason.signal_atlas_live.v1",
    artifactModeVocabularyRef: "dcv.artifact_mode.signal_atlas_live.v1",
    breakpointVocabularyRef: "dcv.breakpoint.signal_atlas_live.v1",
    selectedAnchorVocabularyRef: `dcv.selected_anchor.${route.routeFamilyRef}.v1`,
    dominantActionVocabularyRef: `dcv.dominant_action.${route.routeFamilyRef}.v1`,
    automationMarkerVocabularyRef: `dcv.automation_marker.${route.routeFamilyRef}.v1`,
    telemetryEventVocabularyRef: `dcv.telemetry.${route.routeFamilyRef}.v1`,
    tupleHash: stableDigest({
      routeFamilyRef: route.routeFamilyRef,
      requiredDomMarkers: route.requiredDomMarkers,
      requiredDataAttributes: route.requiredDataAttributes,
      telemetryEventRefs: telemetryEventRefs(route.routeFamilyRef),
    }),
    publishedAt: generatedAt,
    source_refs: [
      "blueprint/canonical-ui-contract-kernel.md#DesignContractVocabularyTuple",
      "prompt/104.md",
    ],
  };

  const telemetryBindingProfile: TelemetryBindingProfile = {
    telemetryBindingProfileId: route.telemetryBindingProfileRef,
    surfaceRef: route.routeFamilyRef,
    requiredUiEventRefs: telemetryEventRefs(route.routeFamilyRef),
    designContractVocabularyTupleRef: vocabularyTuple.designContractVocabularyTupleId,
    requiredDomMarkerSchemaRef: "DMS_104_CANONICAL_UI_KERNEL_V1",
    redactionProfileRef: `RDP_104_${route.shellType.toUpperCase()}_SAFE_V1`,
    bindingDigestRef: stableDigest({
      routeFamilyRef: route.routeFamilyRef,
      vocabularyTupleRef: vocabularyTuple.designContractVocabularyTupleId,
      eventRefs: telemetryEventRefs(route.routeFamilyRef),
    }),
    publishedAt: generatedAt,
    source_refs: [
      "blueprint/canonical-ui-contract-kernel.md#TelemetryBindingProfile",
      "prompt/104.md",
    ],
  };

  const automationAnchorMap: AutomationAnchorMap = {
    automationAnchorMapId: route.automationAnchorMapRef,
    surfaceRef: route.routeFamilyRef,
    requiredDomMarkers: mergeRouteDomMarkers(route),
    dominantActionMarkerRef: `marker.${route.routeFamilyRef}.dominant_action`,
    selectedAnchorMarkerRef: `marker.${route.routeFamilyRef}.selected_anchor`,
    artifactMarkerRef: `marker.${route.routeFamilyRef}.artifact_mode`,
    continuityMarkerRef: `marker.${route.routeFamilyRef}.continuity_key`,
    designContractVocabularyTupleRef: vocabularyTuple.designContractVocabularyTupleId,
    domMarkerSchemaRef: "DMS_104_CANONICAL_UI_KERNEL_V1",
    telemetryBindingProfileRef: telemetryBindingProfile.telemetryBindingProfileId,
    anchorMapDigestRef: stableDigest({
      routeFamilyRef: route.routeFamilyRef,
      requiredDomMarkers: mergeRouteDomMarkers(route),
      telemetryBindingProfileRef: telemetryBindingProfile.telemetryBindingProfileId,
    }),
    publishedAt: generatedAt,
    source_refs: [
      "blueprint/canonical-ui-contract-kernel.md#AutomationAnchorMap",
      "prompt/104.md",
    ],
  };

  const breakpointClass: BreakpointClass =
    route.breakpointCoverageRefs.find((candidate): candidate is BreakpointClass =>
      candidate === "compact" ||
      candidate === "narrow" ||
      candidate === "medium" ||
      candidate === "expanded" ||
      candidate === "wide",
    ) ?? "medium";
  const topologyMetricRef =
    profileSelection.allowedTopologyMetricRefs[0] ?? "topology.focus_frame";

  const visualTokenProfile: VisualTokenProfile = {
    visualTokenProfileId: route.visualTokenProfileRef,
    shellType: route.shellType,
    routeFamilyRef: route.routeFamilyRef,
    designTokenFoundationRef: DESIGN_TOKEN_FOUNDATION_REF,
    designTokenExportArtifactRef: DESIGN_TOKEN_EXPORT_ARTIFACT_ID,
    tokenKernelLayeringPolicyRef: TOKEN_KERNEL_LAYERING_POLICY_ID,
    profileSelectionResolutionRef: route.profileSelectionResolutionRefs[0] ?? profileSelection.profileSelectionResolutionId,
    shellVisualProfileRef: `SVP_104_${route.shellType.toUpperCase()}_${route.routeFamilyRef.toUpperCase()}_V1`,
    breakpointClass,
    densityProfileRef: `density.${profileToken.defaultDensityMode}`,
    spaceScaleRef: "space.q4.canonical",
    sizeScaleRef: "size.canonical",
    typeScaleRef: "type.canonical",
    radiusScaleRef: "radius.canonical",
    semanticColorProfileRef: profileSelection.semanticColorProfileRef,
    topologyMetricRef,
    motionProfileRef: `motion.${profileToken.defaultMotionMode}`,
    profileDigestRef: stableDigest({
      routeFamilyRef: route.routeFamilyRef,
      profileSelectionResolutionRef: route.profileSelectionResolutionRefs[0] ?? profileSelection.profileSelectionResolutionId,
      topologyMetricRef,
      semanticColorProfileRef: profileSelection.semanticColorProfileRef,
    }),
    effectiveAt: generatedAt,
    source_refs: [
      "blueprint/canonical-ui-contract-kernel.md#VisualTokenProfile",
      "data/analysis/design_token_export_artifact.json",
      "prompt/104.md",
    ],
  };

  const artifact = artifactBlueprint(route, truth);
  const artifactModePresentationProfile: ArtifactModePresentationProfile = {
    artifactModePresentationProfileId: route.artifactModePresentationProfileRef,
    artifactSurfaceFrameRef: `artifact_surface.${route.routeFamilyRef}`,
    artifactStageRef: artifact.artifactStageRef,
    summaryPolicyRef: artifact.summaryPolicyRef,
    previewPolicyRef: artifact.previewPolicyRef,
    printPolicyRef: artifact.printPolicyRef,
    downloadPolicyRef: artifact.downloadPolicyRef,
    exportPolicyRef: artifact.exportPolicyRef,
    handoffPolicyRef: artifact.handoffPolicyRef,
    returnAnchorRef: `return_anchor.${route.routeFamilyRef}`,
    designContractVocabularyTupleRef: vocabularyTuple.designContractVocabularyTupleId,
    presentationDigestRef: stableDigest({
      routeFamilyRef: route.routeFamilyRef,
      artifactModeState: truth.artifactModeState,
      artifactStageRef: artifact.artifactStageRef,
      exportPolicyRef: artifact.exportPolicyRef,
    }),
    effectiveAt: generatedAt,
    source_refs: [
      "blueprint/canonical-ui-contract-kernel.md#ArtifactModePresentationProfile",
      "prompt/104.md",
    ],
  };

  const surfaceStateSemanticsProfile: SurfaceStateSemanticsProfile = {
    surfaceStateSemanticsProfileId: route.surfaceStateSemanticsProfileRef,
    surfaceRef: route.routeFamilyRef,
    visualTokenProfileRef: visualTokenProfile.visualTokenProfileId,
    surfacePostureFrameRef: `surface_posture.${truth.postureState}`,
    surfaceStateFrameRef: `surface_state.${truth.stateClass}`,
    artifactStageRef: artifact.artifactStageRef,
    statusOwnerRef: truth.statusOwnerRef,
    effectiveSeverity: precedence.effectiveSeverity,
    effectiveDisplayState: precedence.effectiveDisplayState,
    effectiveTone: precedence.effectiveTone,
    ariaLiveMode: precedence.ariaLiveMode,
    motionIntentRef: precedence.motionIntentRef,
    designContractVocabularyTupleRef: vocabularyTuple.designContractVocabularyTupleId,
    telemetryBindingProfileRef: telemetryBindingProfile.telemetryBindingProfileId,
    automationAnchorMapRef: automationAnchorMap.automationAnchorMapId,
    surfaceStateKernelBindingRef: route.surfaceStateKernelBindingRef,
    stateSemanticsDigestRef: stableDigest({
      routeFamilyRef: route.routeFamilyRef,
      postureState: truth.postureState,
      stateClass: truth.stateClass,
      freshnessState: truth.freshnessState,
      trustState: truth.trustState,
      settlementState: truth.settlementState,
      writableState: truth.writableState,
      artifactModeState: truth.artifactModeState,
      effectiveDisplayState: precedence.effectiveDisplayState,
    }),
    resolvedAt: generatedAt,
    source_refs: [
      "blueprint/canonical-ui-contract-kernel.md#SurfaceStateSemanticsProfile",
      "prompt/104.md",
    ],
  };

  const coverageState: CoverageState = COVERAGE_GAP_ROUTES.has(route.routeFamilyRef)
    ? "degraded"
    : truth.accessibilityCoverageState;
  const isVisualizationHeavy = VISUALIZATION_HEAVY_ROUTES.has(route.routeFamilyRef);
  const accessibilitySemanticCoverageProfile: AccessibilitySemanticCoverageProfile = {
    accessibilitySemanticCoverageProfileId: route.accessibilitySemanticCoverageProfileRef,
    routeFamilyRef: route.routeFamilyRef,
    shellType: route.shellType,
    audienceTier: shellToAudienceTier(route.audienceSurface, route.shellType),
    profileSelectionResolutionRef: route.profileSelectionResolutionRefs[0] ?? profileSelection.profileSelectionResolutionId,
    semanticSurfaceRefs: [
      `semantic_surface.${route.routeFamilyRef}.root`,
      `semantic_surface.${route.routeFamilyRef}.status`,
      `semantic_surface.${route.routeFamilyRef}.artifact`,
    ],
    accessibleSurfaceContractRefs: [`ASC_104_${route.routeFamilyRef.toUpperCase()}_ROOT_V1`],
    keyboardInteractionContractRefs: [`KIC_104_${route.routeFamilyRef.toUpperCase()}_PRIMARY_V1`],
    focusTransitionContractRefs: [
      `FTC_104_${route.routeFamilyRef.toUpperCase()}_RESTORE_V1`,
      `FTC_104_${route.routeFamilyRef.toUpperCase()}_SETTLE_V1`,
    ],
    assistiveAnnouncementContractRefs: [
      `AAC_104_${route.routeFamilyRef.toUpperCase()}_SUMMARY_V1`,
      `AAC_104_${route.routeFamilyRef.toUpperCase()}_STATE_V1`,
    ],
    freshnessAccessibilityContractRefs: [`FAC_104_${route.routeFamilyRef.toUpperCase()}_PRIMARY_V1`],
    assistiveTextPolicyRef: `ATP_104_${shellToAudienceTier(route.audienceSurface, route.shellType).toUpperCase()}_V1`,
    fieldAccessibilityContractRefs:
      route.routeFamilyRef.includes("intake") || route.routeFamilyRef.includes("request")
        ? [`FIELD_ACC_104_${route.routeFamilyRef.toUpperCase()}_PRIMARY_V1`]
        : [],
    formErrorSummaryContractRefs:
      route.routeFamilyRef.includes("intake") || route.routeFamilyRef.includes("request")
        ? [`FESC_104_${route.routeFamilyRef.toUpperCase()}_PRIMARY_V1`]
        : [],
    timeoutRecoveryContractRefs: [`TRC_104_${route.routeFamilyRef.toUpperCase()}_PRIMARY_V1`],
    visualizationFallbackContractRefs: isVisualizationHeavy
      ? [`VFC_104_${route.routeFamilyRef.toUpperCase()}_PRIMARY_V1`]
      : [],
    visualizationTableContractRefs: isVisualizationHeavy
      ? [`VTC_104_${route.routeFamilyRef.toUpperCase()}_PRIMARY_V1`]
      : [],
    visualizationParityProjectionRefs: isVisualizationHeavy
      ? [`VPP_104_${route.routeFamilyRef.toUpperCase()}_PRIMARY_V1`]
      : [],
    automationAnchorProfileRef: route.automationAnchorProfileRef,
    automationAnchorMapRef: automationAnchorMap.automationAnchorMapId,
    surfaceStateSemanticsProfileRefs: [surfaceStateSemanticsProfile.surfaceStateSemanticsProfileId],
    surfaceStateKernelBindingRefs: [route.surfaceStateKernelBindingRef],
    designContractPublicationBundleRef: route.designContractPublicationBundleRef,
    requiredBreakpointClassRefs: route.breakpointCoverageRefs,
    missionStackCoverageRef:
      coverageState === "complete" ? "mission_stack.complete" : "mission_stack.degraded",
    hostResizeCoverageRef:
      coverageState === "complete" ? "host_resize.complete" : "host_resize.degraded",
    embeddedSafeAreaCoverageRef:
      coverageState === "complete" ? "safe_area.complete" : "safe_area.degraded",
    reducedMotionEquivalenceRef:
      coverageState === "complete"
        ? "reduced_motion.equivalent"
        : "reduced_motion.summary_only_equivalent",
    bufferedUpdateCoverageRefs: [
      coverageState === "complete" ? "buffered_update.complete" : "buffered_update.summary_only",
      coverageState === "complete" ? "buffered_replay.complete" : "buffered_replay.summary_only",
    ],
    coverageTupleHash: stableDigest({
      routeFamilyRef: route.routeFamilyRef,
      accessibilityCoverageState: coverageState,
      bundleRef: route.designContractPublicationBundleRef,
      semanticsRef: surfaceStateSemanticsProfile.surfaceStateSemanticsProfileId,
      automationAnchorMapRef: automationAnchorMap.automationAnchorMapId,
    }),
    coverageState,
    verifiedAt: generatedAt,
    source_refs: [
      "blueprint/accessibility-and-content-system-contract.md#AccessibilitySemanticCoverageProfile",
      "blueprint/platform-frontend-blueprint.md#AccessibilitySemanticCoverageProfile",
      "prompt/104.md",
    ],
  };

  const bindingState: BindingState = COVERAGE_GAP_ROUTES.has(route.routeFamilyRef)
    ? "blocked"
    : ARTIFACT_FOLLOW_ON_ROUTES.has(route.routeFamilyRef)
      ? "stale"
      : "exact";

  const surfaceStateKernelBinding: SurfaceStateKernelBinding = {
    surfaceStateKernelBindingId: route.surfaceStateKernelBindingRef,
    routeFamilyRef: route.routeFamilyRef,
    surfaceRef: route.routeFamilyRef,
    visualTokenProfileRef: visualTokenProfile.visualTokenProfileId,
    surfaceStateSemanticsProfileRef: surfaceStateSemanticsProfile.surfaceStateSemanticsProfileId,
    accessibilitySemanticCoverageProfileRef:
      accessibilitySemanticCoverageProfile.accessibilitySemanticCoverageProfileId,
    automationAnchorMapRef: automationAnchorMap.automationAnchorMapId,
    telemetryBindingProfileRef: telemetryBindingProfile.telemetryBindingProfileId,
    artifactModePresentationProfileRef:
      artifactModePresentationProfile.artifactModePresentationProfileId,
    designContractVocabularyTupleRef: vocabularyTuple.designContractVocabularyTupleId,
    bindingState,
    kernelPropagationDigestRef: stableDigest({
      routeFamilyRef: route.routeFamilyRef,
      bindingState,
      semanticsDigestRef: surfaceStateSemanticsProfile.stateSemanticsDigestRef,
      accessibilityTupleHash: accessibilitySemanticCoverageProfile.coverageTupleHash,
      anchorMapDigestRef: automationAnchorMap.anchorMapDigestRef,
      telemetryDigestRef: telemetryBindingProfile.bindingDigestRef,
      artifactDigestRef: artifactModePresentationProfile.presentationDigestRef,
    }),
    resolvedAt: generatedAt,
    source_refs: [
      "blueprint/canonical-ui-contract-kernel.md#SurfaceStateKernelBinding",
      "prompt/104.md",
    ],
  };

  const studioScenario: StudioScenario = {
    scenarioId: `SCN_104_${route.routeFamilyRef.toUpperCase()}_V1`,
    routeFamilyRef: route.routeFamilyRef,
    audienceSurface: route.audienceSurface,
    label: titleFromRoute(route.routeFamilyRef),
    postureState: truth.postureState,
    stateClass: truth.stateClass,
    freshnessState: truth.freshnessState,
    trustState: truth.trustState,
    settlementState: truth.settlementState,
    writableState: truth.writableState,
    artifactModeState: truth.artifactModeState,
    effectiveDisplayState: precedence.effectiveDisplayState,
    effectiveTone: precedence.effectiveTone,
    ariaLiveMode: precedence.ariaLiveMode,
    motionIntentRef: precedence.motionIntentRef,
    dominantActionLabel: truth.dominantActionLabel,
    selectedAnchorLabel: truth.selectedAnchorLabel,
    bindingState,
    accessibilityCoverageState: accessibilitySemanticCoverageProfile.coverageState,
    artifactPosture: truth.artifactPosture,
  };

  return {
    route,
    truth,
    visualTokenProfile,
    vocabularyTuple,
    telemetryBindingProfile,
    automationAnchorMap,
    artifactModePresentationProfile,
    surfaceStateSemanticsProfile,
    accessibilitySemanticCoverageProfile,
    surfaceStateKernelBinding,
    studioScenario,
  };
}

function coverageGapRecords(
  evaluations: readonly RouteEvaluationRecord[],
): KernelCoverageGapRecord[] {
  return evaluations
    .filter((evaluation) => evaluation.accessibilitySemanticCoverageProfile.coverageState !== "complete")
    .map((evaluation) => ({
      gapId: `GAP_KERNEL_COVERAGE_${evaluation.route.routeFamilyRef.toUpperCase()}_V1`,
      classification: "kernel_coverage_gap",
      routeFamilyRef: evaluation.route.routeFamilyRef,
      coverageState: evaluation.accessibilitySemanticCoverageProfile.coverageState,
      statement:
        "Route-family accessibility coverage is not yet complete across reduced motion, host resize, mission-stack parity, and buffered update posture, so the kernel keeps the binding fail-closed.",
      failClosedSurfaceState:
        evaluation.truth.artifactModeState === "summary_only" ? "summary_first" : "recovery_first",
      source_refs: [
        "prompt/104.md",
        "blueprint/accessibility-and-content-system-contract.md#AccessibilitySemanticCoverageProfile",
      ],
    }));
}

function followOnDependencyRecords(
  evaluations: readonly RouteEvaluationRecord[],
): FollowOnDependencyRecord[] {
  return evaluations
    .filter((evaluation) => ARTIFACT_FOLLOW_ON_ROUTES.has(evaluation.route.routeFamilyRef))
    .map((evaluation) => ({
      dependencyId: `FOLLOW_ON_DEPENDENCY_ARTIFACT_MODE_${evaluation.route.routeFamilyRef.toUpperCase()}_V1`,
      classification: "follow_on_dependency",
      routeFamilyRef: evaluation.route.routeFamilyRef,
      statement:
        "Artifact-mode authority for embedded and host-controlled handoff surfaces still needs a shell-consumer specialization, so the kernel publishes the safe handoff-only posture now.",
      safeFallback: "summary_only_or_external_handoff",
      source_refs: [
        "prompt/104.md",
        "blueprint/canonical-ui-contract-kernel.md#ArtifactModePresentationProfile",
      ],
    }));
}

export const UI_KERNEL_GAP_RESOLUTIONS: readonly GapResolutionRecord[] = [
  {
    gapId: "GAP_RESOLUTION_KERNEL_EXECUTION_FORMAT_EFFECTIVE_DISPLAY_STATE_V1",
    classification: "gap_resolution",
    statement:
      "The blueprint gave a numeric precedence equation and tie-break order but did not specify a standalone executable display-state token for read-only posture, so the kernel publishes `read_only` as an explicit display state between stale and settled-pending-confirmation.",
    implementedRule:
      "Display precedence becomes blocked > recovery > degraded > stale > read_only > settled_pending_confirmation > loading > empty > sparse > ready while numeric severity remains unchanged.",
    source_refs: [
      "prompt/104.md",
      "blueprint/canonical-ui-contract-kernel.md#4. State-severity equation and display precedence",
    ],
  },
  {
    gapId: "GAP_RESOLUTION_KERNEL_EXECUTION_FORMAT_LINT_VERDICT_DIGEST_V1",
    classification: "gap_resolution",
    statement:
      "The corpus did not define a single digest input for bundle-level lint verdicts, so the kernel computes them from token export, propagation, accessibility tuple, telemetry tuple, artifact policy, and structural snapshot refs.",
    implementedRule:
      "Lint verdict state is fail-closed and deterministic across publication reruns because every verdict row hashes the same contract tuple surfaces.",
    source_refs: [
      "prompt/104.md",
      "blueprint/canonical-ui-contract-kernel.md#DesignContractLintVerdict",
    ],
  },
] as const;

export function buildUiContractKernelArtifacts(
  input: UiContractKernelBuildInput,
): {
  publicationArtifact: UiContractKernelPublicationArtifact;
  lintArtifact: UiContractLintVerdictArtifact;
  automationArtifact: UiContractAutomationAnchorArtifact;
  accessibilityArtifact: UiContractAccessibilityArtifact;
  surfaceStateKernelBindingRows: readonly SurfaceStateKernelBindingCsvRow[];
} {
  const evaluations = input.routeSeeds
    .slice()
    .sort((left, right) => left.routeFamilyRef.localeCompare(right.routeFamilyRef))
    .map((route) => buildRouteEvaluation(route, input.generatedAt));
  const evaluationMap = new Map(evaluations.map((row) => [row.route.routeFamilyRef, row]));
  const coverageGaps = coverageGapRecords(evaluations);
  const followOnDependencies = followOnDependencyRecords(evaluations);

  const lintVerdicts: DesignContractLintVerdict[] = input.bundleSeeds
    .slice()
    .sort((left, right) => left.designContractPublicationBundleId.localeCompare(right.designContractPublicationBundleId))
    .map((bundleSeed) => {
      const bundleRoutes = bundleSeed.routeFamilyRefs.map((routeFamilyRef) => {
        const evaluation = evaluationMap.get(routeFamilyRef);
        if (!evaluation) {
          throw new Error(`Missing route evaluation for ${routeFamilyRef}.`);
        }
        return evaluation;
      });
      const hasBlocked = bundleRoutes.some(
        (route) => route.surfaceStateKernelBinding.bindingState === "blocked",
      );
      const hasStale = bundleRoutes.some(
        (route) => route.surfaceStateKernelBinding.bindingState === "stale",
      );

      const verdict: DesignContractLintVerdict = {
        designContractLintVerdictId: bundleSeed.lintVerdictRef,
        designContractPublicationBundleRef: bundleSeed.designContractPublicationBundleId,
        tokenLatticeState: "exact",
        profileLayeringState: "exact",
        modeResolutionState: "exact",
        surfaceSemanticsState: hasBlocked ? "blocked" : hasStale ? "drifted" : "exact",
        kernelStatePropagationState: hasBlocked ? "blocked" : hasStale ? "drifted" : "exact",
        accessibilitySemanticCoverageState: hasBlocked ? "blocked" : "exact",
        automationTelemetryParityState: "exact",
        artifactModeParityState: hasStale ? "drifted" : "exact",
        surfaceRoleUsageState: "exact",
        structuralSnapshotState:
          bundleSeed.structuralSnapshotRefs.length >= 3 ? "exact" : "missing",
        result:
          hasBlocked ||
          hasStale ||
          bundleSeed.structuralSnapshotRefs.length < 3
            ? "blocked"
            : "pass",
        recordedAt: input.generatedAt,
        source_refs: [
          "blueprint/canonical-ui-contract-kernel.md#DesignContractLintVerdict",
          "prompt/104.md",
        ],
      };

      return verdict;
    });

  const lintMap = new Map(
    lintVerdicts.map((verdict) => [verdict.designContractPublicationBundleRef, verdict]),
  );

  const bundles: DesignContractPublicationBundle[] = input.bundleSeeds
    .slice()
    .sort((left, right) => left.designContractPublicationBundleId.localeCompare(right.designContractPublicationBundleId))
    .map((bundleSeed) => {
      const bundleRoutes = bundleSeed.routeFamilyRefs.map((routeFamilyRef) => {
        const evaluation = evaluationMap.get(routeFamilyRef);
        if (!evaluation) {
          throw new Error(`Missing route evaluation for ${routeFamilyRef}.`);
        }
        return evaluation;
      });
      const verdict = lintMap.get(bundleSeed.designContractPublicationBundleId);
      if (!verdict) {
        throw new Error(`Missing lint verdict for ${bundleSeed.designContractPublicationBundleId}.`);
      }
      const publicationState: PublicationState =
        verdict.result === "pass" ? "published" : "blocked";
      const designContractDigestRef = stableDigest({
        bundleId: bundleSeed.designContractPublicationBundleId,
        routeFamilyRefs: bundleSeed.routeFamilyRefs,
        visualTokenProfileRefs: bundleRoutes.map((route) => route.visualTokenProfile.visualTokenProfileId),
        kernelPropagationDigestRefs: bundleRoutes.map(
          (route) => route.surfaceStateKernelBinding.kernelPropagationDigestRef,
        ),
        coverageTupleHashes: bundleRoutes.map(
          (route) => route.accessibilitySemanticCoverageProfile.coverageTupleHash,
        ),
        lintVerdictRef: verdict.designContractLintVerdictId,
      });

      return {
        designContractPublicationBundleId: bundleSeed.designContractPublicationBundleId,
        audienceSurface: bundleSeed.audienceSurface,
        routeFamilyRefs: bundleSeed.routeFamilyRefs,
        shellType: bundleSeed.shellType,
        breakpointCoverageRefs: [
          ...new Set(bundleRoutes.flatMap((route) => route.route.breakpointCoverageRefs)),
        ] as BreakpointClass[],
        modeTupleCoverageRef: MODE_TUPLE_COVERAGE_REF,
        designTokenExportArtifactRef: DESIGN_TOKEN_EXPORT_ARTIFACT_ID,
        tokenKernelLayeringPolicyRef: TOKEN_KERNEL_LAYERING_POLICY_ID,
        profileSelectionResolutionRefs: [
          ...new Set(
            bundleRoutes.flatMap((route) => route.route.profileSelectionResolutionRefs.slice(0, 1)),
          ),
        ],
        visualTokenProfileRefs: bundleRoutes.map(
          (route) => route.visualTokenProfile.visualTokenProfileId,
        ),
        surfaceStateSemanticsProfileRefs: bundleRoutes.map(
          (route) => route.surfaceStateSemanticsProfile.surfaceStateSemanticsProfileId,
        ),
        surfaceStateKernelBindingRefs: bundleRoutes.map(
          (route) => route.surfaceStateKernelBinding.surfaceStateKernelBindingId,
        ),
        accessibilitySemanticCoverageProfileRefs: bundleRoutes.map(
          (route) =>
            route.accessibilitySemanticCoverageProfile.accessibilitySemanticCoverageProfileId,
        ),
        automationAnchorMapRefs: bundleRoutes.map(
          (route) => route.automationAnchorMap.automationAnchorMapId,
        ),
        telemetryBindingProfileRefs: bundleRoutes.map(
          (route) => route.telemetryBindingProfile.telemetryBindingProfileId,
        ),
        artifactModePresentationProfileRefs: bundleRoutes.map(
          (route) => route.artifactModePresentationProfile.artifactModePresentationProfileId,
        ),
        designContractVocabularyTupleRefs: bundleRoutes.map(
          (route) => route.vocabularyTuple.designContractVocabularyTupleId,
        ),
        designContractDigestRef,
        structuralSnapshotRefs: bundleSeed.structuralSnapshotRefs,
        lintVerdictRef: bundleSeed.lintVerdictRef,
        publicationState,
        publishedAt: input.generatedAt,
        source_refs: [
          "blueprint/canonical-ui-contract-kernel.md#DesignContractPublicationBundle",
          "prompt/104.md",
        ],
      };
    });

  const bundleDigestById = new Map(
    bundles.map((bundle) => [bundle.designContractPublicationBundleId, bundle.designContractDigestRef]),
  );

  const surfaceStateKernelBindingRows: SurfaceStateKernelBindingCsvRow[] = evaluations.map(
    (evaluation) => ({
      surface_state_kernel_binding_id:
        evaluation.surfaceStateKernelBinding.surfaceStateKernelBindingId,
      route_family_ref: evaluation.route.routeFamilyRef,
      audience_surface: evaluation.route.audienceSurface,
      shell_type: evaluation.route.shellType,
      binding_state: evaluation.surfaceStateKernelBinding.bindingState,
      accessibility_coverage_state:
        evaluation.accessibilitySemanticCoverageProfile.coverageState,
      artifact_mode_state: evaluation.truth.artifactModeState,
      effective_display_state: evaluation.surfaceStateSemanticsProfile.effectiveDisplayState,
      effective_tone: evaluation.surfaceStateSemanticsProfile.effectiveTone,
      aria_live_mode: evaluation.surfaceStateSemanticsProfile.ariaLiveMode,
      motion_intent_ref: evaluation.surfaceStateSemanticsProfile.motionIntentRef,
      dominant_action_marker_ref: evaluation.automationAnchorMap.dominantActionMarkerRef,
      selected_anchor_marker_ref: evaluation.automationAnchorMap.selectedAnchorMarkerRef,
      kernel_propagation_digest_ref:
        evaluation.surfaceStateKernelBinding.kernelPropagationDigestRef,
      design_contract_digest_ref:
        bundleDigestById.get(evaluation.route.designContractPublicationBundleRef) ?? "",
    }),
  );

  const publicationArtifact: UiContractKernelPublicationArtifact = {
    task_id: UI_CONTRACT_KERNEL_TASK_ID,
    generated_at: input.generatedAt,
    captured_on: input.capturedOn,
    visual_mode: UI_CONTRACT_KERNEL_VISUAL_MODE,
    mission:
      "Publish one executable canonical UI contract kernel that binds visible state, accessibility semantics, automation anchors, telemetry vocabulary, and artifact posture to the same route-family truth.",
    source_precedence: UI_CONTRACT_KERNEL_SOURCE_PRECEDENCE,
    upstream_inputs: [
      "data/analysis/design_token_export_artifact.json",
      "data/analysis/frontend_contract_manifests.json",
      "data/analysis/frontend_accessibility_and_automation_profiles.json",
      "data/analysis/design_contract_publication_bundles.json",
      "data/analysis/runtime_publication_bundles.json",
    ],
    summary: {
      bundle_count: bundles.length,
      route_family_count: evaluations.length,
      exact_binding_count: evaluations.filter(
        (row) => row.surfaceStateKernelBinding.bindingState === "exact",
      ).length,
      stale_binding_count: evaluations.filter(
        (row) => row.surfaceStateKernelBinding.bindingState === "stale",
      ).length,
      blocked_binding_count: evaluations.filter(
        (row) => row.surfaceStateKernelBinding.bindingState === "blocked",
      ).length,
      accessibility_complete_count: evaluations.filter(
        (row) => row.accessibilitySemanticCoverageProfile.coverageState === "complete",
      ).length,
      accessibility_degraded_count: evaluations.filter(
        (row) => row.accessibilitySemanticCoverageProfile.coverageState !== "complete",
      ).length,
      lint_pass_count: lintVerdicts.filter((row) => row.result === "pass").length,
      lint_blocked_count: lintVerdicts.filter((row) => row.result === "blocked").length,
    },
    gap_resolutions: UI_KERNEL_GAP_RESOLUTIONS,
    kernel_coverage_gaps: coverageGaps,
    follow_on_dependencies: followOnDependencies,
    precedence_equation: {
      posture_priority: POSTURE_PRIORITY,
      state_class_priority: STATE_CLASS_PRIORITY,
      freshness_priority: FRESHNESS_PRIORITY,
      trust_priority: TRUST_PRIORITY,
      settlement_priority: SETTLEMENT_PRIORITY,
      writable_priority: WRITABLE_PRIORITY,
      artifact_priority: ARTIFACT_PRIORITY,
      tie_break_order: DISPLAY_STATE_TIE_BREAK_ORDER,
    },
    supported_mode_tuples: toSupportedModeTuples(),
    studio_scenarios: evaluations.map((row) => row.studioScenario),
    designContractPublicationBundles: bundles,
    visualTokenProfiles: evaluations.map((row) => row.visualTokenProfile),
    surfaceStateSemanticsProfiles: evaluations.map((row) => row.surfaceStateSemanticsProfile),
    surfaceStateKernelBindings: evaluations.map((row) => row.surfaceStateKernelBinding),
    accessibilitySemanticCoverageProfiles: evaluations.map(
      (row) => row.accessibilitySemanticCoverageProfile,
    ),
    automationAnchorMaps: evaluations.map((row) => row.automationAnchorMap),
    telemetryBindingProfiles: evaluations.map((row) => row.telemetryBindingProfile),
    artifactModePresentationProfiles: evaluations.map(
      (row) => row.artifactModePresentationProfile,
    ),
    designContractVocabularyTuples: evaluations.map((row) => row.vocabularyTuple),
  };

  const lintArtifact: UiContractLintVerdictArtifact = {
    task_id: UI_CONTRACT_KERNEL_TASK_ID,
    generated_at: input.generatedAt,
    captured_on: input.capturedOn,
    visual_mode: UI_CONTRACT_KERNEL_VISUAL_MODE,
    summary: {
      lint_verdict_count: lintVerdicts.length,
      pass_count: lintVerdicts.filter((row) => row.result === "pass").length,
      blocked_count: lintVerdicts.filter((row) => row.result === "blocked").length,
    },
    gap_resolutions: UI_KERNEL_GAP_RESOLUTIONS,
    kernel_coverage_gaps: coverageGaps,
    follow_on_dependencies: followOnDependencies,
    designContractLintVerdicts: lintVerdicts,
  };

  const automationArtifact: UiContractAutomationAnchorArtifact = {
    task_id: UI_CONTRACT_KERNEL_TASK_ID,
    generated_at: input.generatedAt,
    captured_on: input.capturedOn,
    summary: {
      automation_anchor_map_count: evaluations.length,
      unique_dom_marker_count: new Set(
        evaluations.flatMap((row) => row.automationAnchorMap.requiredDomMarkers),
      ).size,
    },
    automationAnchorMaps: evaluations.map((row) => row.automationAnchorMap),
  };

  const accessibilityArtifact: UiContractAccessibilityArtifact = {
    task_id: UI_CONTRACT_KERNEL_TASK_ID,
    generated_at: input.generatedAt,
    captured_on: input.capturedOn,
    summary: {
      accessibility_profile_count: evaluations.length,
      complete_count: evaluations.filter(
        (row) => row.accessibilitySemanticCoverageProfile.coverageState === "complete",
      ).length,
      degraded_count: evaluations.filter(
        (row) => row.accessibilitySemanticCoverageProfile.coverageState === "degraded",
      ).length,
      blocked_count: evaluations.filter(
        (row) => row.accessibilitySemanticCoverageProfile.coverageState === "blocked",
      ).length,
    },
    accessibilitySemanticCoverageProfiles: evaluations.map(
      (row) => row.accessibilitySemanticCoverageProfile,
    ),
  };

  return {
    publicationArtifact,
    lintArtifact,
    automationArtifact,
    accessibilityArtifact,
    surfaceStateKernelBindingRows,
  };
}
