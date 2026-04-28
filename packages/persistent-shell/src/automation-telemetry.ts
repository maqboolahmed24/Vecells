import {
  accessibilityHarnessScenarios,
  composeStatusSentence,
  statusTruthSpecimens,
  uiContractAccessibilityArtifact,
  uiContractAutomationAnchorArtifact,
  uiContractKernelPublication,
  uiContractSurfaceStateKernelBindingRows,
} from "@vecells/design-system";
import { getPersistentShellRouteClaim } from "./contracts";
import { routeAuthorityProfiles, type RouteGuardPosture } from "./route-guard-plumbing";

export const AUTOMATION_TELEMETRY_TASK_ID = "par_114";
export const AUTOMATION_TELEMETRY_VISUAL_MODE = "UI_Telemetry_Console";
export const AUTOMATION_ANCHOR_PROFILE_EXAMPLES_PATH =
  "data/analysis/automation_anchor_profile_examples.json";
export const AUTOMATION_ANCHOR_MATRIX_PATH = "data/analysis/automation_anchor_matrix.csv";
export const UI_TELEMETRY_VOCABULARY_PATH = "data/analysis/ui_telemetry_vocabulary.json";
export const UI_EVENT_ENVELOPE_EXAMPLES_PATH =
  "data/analysis/ui_event_envelope_examples.json";

export const AUTOMATION_TELEMETRY_SOURCE_PRECEDENCE = [
  "prompt/114.md",
  "prompt/shared_operating_contract_106_to_115.md",
  "prompt/AGENT.md",
  "prompt/checklist.md",
  "blueprint/canonical-ui-contract-kernel.md#AutomationAnchorMap",
  "blueprint/canonical-ui-contract-kernel.md#TelemetryBindingProfile",
  "blueprint/canonical-ui-contract-kernel.md#SurfaceStateKernelBinding",
  "blueprint/canonical-ui-contract-kernel.md#SurfaceStateSemanticsProfile",
  "blueprint/platform-frontend-blueprint.md#AutomationAnchorProfile",
  "blueprint/platform-frontend-blueprint.md#Shared IA rules",
  "blueprint/platform-frontend-blueprint.md#Canonical real-time interaction, motion, and live-projection experience algorithm",
  "blueprint/platform-runtime-and-release-blueprint.md#FrontendContractManifest",
  "blueprint/platform-runtime-and-release-blueprint.md#AudienceSurfaceRuntimeBinding",
  "blueprint/accessibility-and-content-system-contract.md#AssistiveAnnouncementTruthProjection",
  "blueprint/accessibility-and-content-system-contract.md#VisualizationParityProjection",
  "blueprint/forensic-audit-findings.md#Finding 116",
  "blueprint/forensic-audit-findings.md#Finding 117",
  "blueprint/forensic-audit-findings.md#Finding 118",
  "blueprint/forensic-audit-findings.md#Finding 120",
  "data/analysis/automation_anchor_maps.json",
  "data/analysis/accessibility_semantic_coverage_profiles.json",
  "data/analysis/runtime_binding_guard_examples.json",
] as const;

const GENERATED_AT = "2026-04-13T20:14:00.000Z";
const CAPTURED_ON = "2026-04-13";

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

export type AutomationMarkerClass =
  | "landmark"
  | "state_summary"
  | "dominant_action"
  | "selected_anchor"
  | "focus_restore"
  | "artifact_posture"
  | "recovery_posture"
  | "visualization_authority"
  | "route_shell_posture";
export type AutomationProfileState = "exact" | "provisional";
export type AutomationSourceSurface =
  | "shell_gallery"
  | "status_truth_lab"
  | "posture_gallery"
  | "route_guard_lab"
  | "patient_seed_surrogate";
export type UiTelemetryEventClass =
  | "surface_enter"
  | "state_summary_changed"
  | "selected_anchor_changed"
  | "dominant_action_changed"
  | "artifact_mode_changed"
  | "recovery_posture_changed"
  | "visibility_freshness_downgrade";
export type TelemetryBindingState = "contract" | "supplemental_gap_resolution";
export type DisclosureFenceState = "safe" | "redacted";
export type VisualizationAuthorityState =
  | "visual_table_summary"
  | "table_only"
  | "summary_only";
export type RepeatedInstanceStrategy = "shared_anchor_only" | "subordinate_instance_key";
export type ScenarioActionKey =
  | "selected_anchor"
  | "dominant_action"
  | "artifact_mode"
  | "recovery_posture"
  | "visibility_downgrade"
  | "focus_restore";

export interface GapResolutionRecord {
  gapId: string;
  classification: "gap_resolution";
  statement: string;
  implementedRule: string;
  source_refs: readonly string[];
}

export interface AssumptionRecord {
  assumptionId: string;
  classification: "assumption";
  statement: string;
  safeFallback: string;
  source_refs: readonly string[];
}

export interface FollowOnDependencyRecord {
  dependencyId: string;
  classification: "follow_on_dependency";
  statement: string;
  ownerTaskRange: string;
  source_refs: readonly string[];
}

export interface AutomationMarkerBinding {
  routeFamilyRef: string;
  shellSlug: string;
  audienceSurface: string;
  markerClass: AutomationMarkerClass;
  markerRef: string;
  domMarker: string;
  selector: string;
  selectorAttribute: string;
  selectorValue: string;
  disclosureFenceState: DisclosureFenceState;
  repeatedInstanceStrategy: RepeatedInstanceStrategy;
  supportingDomMarkers: readonly string[];
  supportingEventClasses: readonly UiTelemetryEventClass[];
  contractState: AutomationProfileState;
  gapResolutionRef: string | null;
  source_refs: readonly string[];
}

export interface AutomationAnchorProfileExample {
  automationAnchorProfileId: string;
  routeFamilyRef: string;
  routeLabel: string;
  shellSlug: string;
  audienceSurface: string;
  shellContinuityKey: string;
  automationAnchorMapRef: string;
  telemetryBindingProfileRef: string;
  accessibilitySemanticCoverageProfileRef: string;
  surfaceStateKernelBindingRef: string;
  designContractVocabularyTupleRef: string;
  coverageState: string;
  profileState: AutomationProfileState;
  visualizationAuthority: VisualizationAuthorityState;
  selectedAnchorRef: string;
  focusRestoreRef: string;
  dominantActionRef: string;
  dominantActionLabel: string;
  summarySentence: string;
  requiredSemanticRegionRefs: readonly string[];
  requiredUiEventRefs: readonly string[];
  supplementalUiEventRefs: readonly string[];
  markerBindings: readonly AutomationMarkerBinding[];
  sourceSurfaceRefs: readonly AutomationSourceSurface[];
  sourceArtifactRefs: readonly string[];
  profileDigestRef: string;
  source_refs: readonly string[];
}

export interface AutomationDiagnosticsScenario {
  scenarioId: string;
  sourceSurface: AutomationSourceSurface;
  sourceArtifactRef: string;
  routeFamilyRef: string;
  shellSlug: string;
  title: string;
  summary: string;
  shellLabel: string;
  routeLabel: string;
  audienceLabel: string;
  selectedAnchorRef: string;
  selectedAnchorLabel: string;
  focusRestoreRef: string;
  focusRestoreLabel: string;
  dominantActionRef: string;
  dominantActionLabel: string;
  artifactModeState: string;
  recoveryPosture: RouteGuardPosture;
  visualizationAuthority: VisualizationAuthorityState;
  routeShellPosture: string;
  stateSummary: string;
  statusSentence: string;
  overlayMarkerRefs: readonly string[];
  interactionOrder: readonly ScenarioActionKey[];
  initialEventEnvelopeRefs: readonly string[];
  source_refs: readonly string[];
}

export interface UiTelemetryVocabularyEntry {
  routeFamilyRef: string;
  shellSlug: string;
  audienceSurface: string;
  eventClass: UiTelemetryEventClass;
  eventName: string;
  eventCode: string;
  bindingState: TelemetryBindingState;
  automationAnchorProfileRef: string;
  telemetryBindingProfileRef: string;
  designContractVocabularyTupleRef: string;
  primaryMarkerClassRef: AutomationMarkerClass;
  redactionProfileRef: string;
  disclosureFenceState: DisclosureFenceState;
  vocabularyDigestRef: string;
  gapResolutionRef: string | null;
  source_refs: readonly string[];
}

export interface UiTelemetryEnvelopeExample {
  envelopeId: string;
  scenarioId: string;
  routeFamilyRef: string;
  shellSlug: string;
  sourceSurface: AutomationSourceSurface;
  eventClass: UiTelemetryEventClass;
  eventName: string;
  eventCode: string;
  bindingState: TelemetryBindingState;
  selectedAnchorRef: string;
  dominantActionRef: string;
  focusRestoreRef: string;
  artifactModeState: string;
  recoveryPosture: RouteGuardPosture;
  visualizationAuthority: VisualizationAuthorityState;
  disclosureFenceState: DisclosureFenceState;
  payload: Readonly<Record<string, string>>;
  redactedFields: readonly string[];
  payloadDigestRef: string;
  emittedAt: string;
  source_refs: readonly string[];
}

export interface AutomationSurfaceState {
  selectedAnchorRef?: string;
  focusRestoreRef?: string;
  dominantActionRef?: string;
  artifactModeState?: string;
  recoveryPosture?: RouteGuardPosture;
  visualizationAuthority?: VisualizationAuthorityState;
  routeShellPosture?: string;
}

export interface UiTelemetryEnvelopeInput {
  scenarioId: string;
  routeFamilyRef: string;
  sourceSurface: AutomationSourceSurface;
  eventClass: UiTelemetryEventClass;
  payload: Readonly<Record<string, string>>;
  emittedAt?: string;
  surfaceState?: AutomationSurfaceState;
}

export interface AutomationAndTelemetryArtifacts {
  automationAnchorProfileExamplesArtifact: {
    task_id: string;
    visual_mode: string;
    generated_at: string;
    captured_on: string;
    summary: {
      route_profile_count: number;
      exact_profile_count: number;
      provisional_profile_count: number;
      marker_class_count: number;
      scenario_count: number;
      source_surface_count: number;
      matrix_row_count: number;
    };
    routeProfiles: readonly AutomationAnchorProfileExample[];
    diagnosticScenarios: readonly AutomationDiagnosticsScenario[];
    gap_resolutions: readonly GapResolutionRecord[];
    assumptions: readonly AssumptionRecord[];
    follow_on_dependencies: readonly FollowOnDependencyRecord[];
    source_precedence: readonly string[];
  };
  uiTelemetryVocabularyArtifact: {
    task_id: string;
    visual_mode: string;
    generated_at: string;
    captured_on: string;
    summary: {
      route_profile_count: number;
      event_binding_count: number;
      unique_event_class_count: number;
      contract_binding_count: number;
      supplemental_binding_count: number;
      disclosure_safe_count: number;
      redaction_rule_count: number;
    };
    vocabularyEntries: readonly UiTelemetryVocabularyEntry[];
    redactionRules: readonly {
      ruleId: string;
      classification: "phi_safe" | "redacted";
      fieldPattern: string;
      disposition: string;
      source_refs: readonly string[];
    }[];
    assumptions: readonly AssumptionRecord[];
    source_precedence: readonly string[];
  };
  uiEventEnvelopeExamplesArtifact: {
    task_id: string;
    visual_mode: string;
    generated_at: string;
    captured_on: string;
    summary: {
      example_count: number;
      scenario_count: number;
      redacted_example_count: number;
      total_redacted_field_count: number;
      recovery_event_count: number;
      visibility_downgrade_event_count: number;
    };
    eventEnvelopes: readonly UiTelemetryEnvelopeExample[];
    source_precedence: readonly string[];
  };
  automationAnchorMatrixRows: readonly AutomationMarkerBinding[];
}

const statusSpecimenById = new Map<string, (typeof statusTruthSpecimens)[number]>(
  statusTruthSpecimens.map((specimen) => [specimen.id, specimen]),
);
const routeAuthorityProfileByRoute = new Map<string, (typeof routeAuthorityProfiles)[number]>(
  routeAuthorityProfiles.map((profile) => [profile.routeFamilyRef, profile]),
);
const accessibilityProfileByRoute = new Map<
  string,
  (typeof uiContractAccessibilityArtifact.accessibilitySemanticCoverageProfiles)[number]
>(
  uiContractAccessibilityArtifact.accessibilitySemanticCoverageProfiles.map((profile) => [
    profile.routeFamilyRef,
    profile,
  ]),
);
const automationAnchorMapByRoute = new Map<
  string,
  (typeof uiContractAutomationAnchorArtifact.automationAnchorMaps)[number]
>(
  uiContractAutomationAnchorArtifact.automationAnchorMaps.map((anchorMap) => [
    anchorMap.surfaceRef,
    anchorMap,
  ]),
);
const telemetryBindingByRoute = new Map<
  string,
  (typeof uiContractKernelPublication.telemetryBindingProfiles)[number]
>(
  uiContractKernelPublication.telemetryBindingProfiles.map((profile) => [
    profile.surfaceRef,
    profile,
  ]),
);
const designTupleByRoute = new Map<
  string,
  (typeof uiContractKernelPublication.designContractVocabularyTuples)[number]
>(
  uiContractKernelPublication.designContractVocabularyTuples.map((tuple) => [
    tuple.surfaceRef,
    tuple,
  ]),
);
const kernelRowByRoute = new Map<
  string,
  (typeof uiContractSurfaceStateKernelBindingRows)[number]
>(
  uiContractSurfaceStateKernelBindingRows.map((row) => [row.route_family_ref, row]),
);
const harnessScenarioByRoute = new Map<
  string,
  (typeof accessibilityHarnessScenarios)[number]
>(
  accessibilityHarnessScenarios.map((scenario) => [scenario.routeFamilyRef, scenario]),
);

const gapResolutions: readonly GapResolutionRecord[] = [
  {
    gapId: "GAP_RESOLUTION_AUTOMATION_ANCHOR_FOCUS_RESTORE_MARKER_V1",
    classification: "gap_resolution",
    statement:
      "The upstream anchor map names selected-anchor continuity but does not publish a dedicated focus-restore DOM marker class.",
    implementedRule:
      "The shared vocabulary introduces `focus_restore` as a browser-visible class using `data-focus-restore-ref`, subordinate to the existing selected-anchor and return-anchor tuple.",
    source_refs: [
      "prompt/114.md#Gap_handling_you_must_perform_during_this_task",
      "blueprint/platform-frontend-blueprint.md#same-shell continuity and selected-anchor requirements",
    ],
  },
  {
    gapId: "GAP_RESOLUTION_AUTOMATION_ANCHOR_RECOVERY_POSTURE_MARKER_V1",
    classification: "gap_resolution",
    statement:
      "Recovery posture is implied by writable and surface-state data but is not published as one named automation marker class.",
    implementedRule:
      "The shared vocabulary publishes `recovery_posture` through `data-recovery-posture` and binds it to the recovery-posture telemetry event class.",
    source_refs: [
      "prompt/114.md#Mission",
      "blueprint/platform-frontend-blueprint.md#Shared visibility, hydration, and empty-state rules",
    ],
  },
  {
    gapId: "GAP_RESOLUTION_AUTOMATION_ANCHOR_VISUALIZATION_AUTHORITY_MARKER_V1",
    classification: "gap_resolution",
    statement:
      "Visualization authority exists in accessibility and parity contracts but was not exposed as one shared DOM marker class.",
    implementedRule:
      "The shared vocabulary publishes `visualization_authority` via `data-visualization-authority` and keeps chart, table, and summary fallbacks on the same marker name.",
    source_refs: [
      "prompt/114.md#Mission",
      "blueprint/accessibility-and-content-system-contract.md#VisualizationParityProjection",
    ],
  },
  {
    gapId: "GAP_RESOLUTION_AUTOMATION_ANCHOR_ROUTE_SHELL_POSTURE_MARKER_V1",
    classification: "gap_resolution",
    statement:
      "Route and shell posture can be reconstructed from root markers and runtime bindings, but the corpus did not publish one browser-visible summary class for it.",
    implementedRule:
      "The shared vocabulary publishes `route_shell_posture` via `data-route-shell-posture` and binds it to manifest, route-guard, and shell continuity tuples.",
    source_refs: [
      "prompt/114.md#Mission",
      "blueprint/platform-runtime-and-release-blueprint.md#AudienceSurfaceRuntimeBinding",
    ],
  },
  {
    gapId: "GAP_RESOLUTION_AUTOMATION_ANCHOR_REPEATED_INSTANCE_SELECTOR_SUBORDINATE_V1",
    classification: "gap_resolution",
    statement:
      "Repeated rows, tabs, and cards sometimes need instance-level targeting, but route-local selectors must not become the authority vocabulary.",
    implementedRule:
      "Repeated-instance targeting remains subordinate to shared marker classes through `data-automation-instance-key`, never as a route-local replacement for anchor refs.",
    source_refs: [
      "prompt/114.md#Gap_handling_you_must_perform_during_this_task",
      "blueprint/platform-frontend-blueprint.md#AutomationAnchorProfile",
    ],
  },
  {
    gapId: "GAP_RESOLUTION_AUTOMATION_ANCHOR_SUPPLEMENTAL_UI_EVENT_CLASSES_V1",
    classification: "gap_resolution",
    statement:
      "The published telemetry profiles cover viewed, state changed, dominant action, and artifact-mode events, but do not name selected-anchor, recovery-posture, or visibility-downgrade events directly.",
    implementedRule:
      "The shared vocabulary adds three bounded supplemental event classes that inherit each route-family telemetry prefix instead of inventing a parallel namespace.",
    source_refs: [
      "prompt/114.md#Mission",
      "blueprint/canonical-ui-contract-kernel.md#TelemetryBindingProfile",
    ],
  },
  {
    gapId: "GAP_RESOLUTION_AUTOMATION_ANCHOR_PATIENT_SEED_SURROGATE_V1",
    classification: "gap_resolution",
    statement:
      "Patient shell seed routes are not published yet, but later tasks must inherit the finished automation vocabulary rather than redefining it.",
    implementedRule:
      "The console publishes one provisional patient-home seed surrogate that reuses `rf_patient_home` shell and marker tuples unchanged until `par_115` binds live seed routes to the same vocabulary.",
    source_refs: ["prompt/114.md#Mock_now_execution", "prompt/115.md"],
  },
] as const;

const assumptions: readonly AssumptionRecord[] = [
  {
    assumptionId: "ASSUMPTION_UI_TELEMETRY_DISCLOSURE_FENCE_SAFE_FIELDS_V1",
    classification: "assumption",
    statement:
      "Diagnostic overlays and event envelopes may expose route, shell, posture, and vocabulary digests, but must suppress person, content, contact, and attachment-like fields.",
    safeFallback:
      "When a field name implies PHI or content detail, the console emits only `redacted::<digest>` and counts the redaction instead of showing the value.",
    source_refs: [
      "prompt/114.md#Gap_handling_you_must_perform_during_this_task",
      "blueprint/accessibility-and-content-system-contract.md#semantic coverage alignment and PHI-safe state exposure",
    ],
  },
] as const;

const followOnDependencies: readonly FollowOnDependencyRecord[] = [
  {
    dependencyId: "FOLLOW_ON_DEPENDENCY_PATIENT_SEED_ROUTES_BIND_SHARED_AUTOMATION_V1",
    classification: "follow_on_dependency",
    statement:
      "The audience shell seed tasks must bind their live route cards, mock projections, and same-shell actions to this published marker and telemetry vocabulary without renaming classes or events.",
    ownerTaskRange: "par_115-par_120",
    source_refs: ["prompt/114.md#Primary outcome", "prompt/115.md", "prompt/120.md"],
  },
  {
    dependencyId: "FOLLOW_ON_DEPENDENCY_RUNTIME_SINKS_CONSUME_UI_EVENT_ENVELOPES_V1",
    classification: "follow_on_dependency",
    statement:
      "The merge tasks must wire the same event-envelope schema into frontend manifests, browser diagnostics, and runtime observability sinks without forking the browser-visible names.",
    ownerTaskRange: "seq_127-seq_130",
    source_refs: ["prompt/114.md#Actual_production_strategy_later", "prompt/127.md", "prompt/130.md"],
  },
] as const;

const redactionRules = [
  {
    ruleId: "RDP_UI_EVENT_SAFE_ROUTE_FIELDS_V1",
    classification: "phi_safe" as const,
    fieldPattern: "^(routeFamilyRef|shellSlug|audienceSurface|eventClass|eventName|eventCode)$",
    disposition: "Expose unchanged because the value is route- and vocabulary-scoped, not person-scoped.",
    source_refs: [
      "prompt/114.md#Mission",
      "blueprint/accessibility-and-content-system-contract.md#semantic coverage alignment and PHI-safe state exposure",
    ],
  },
  {
    ruleId: "RDP_UI_EVENT_SAFE_MARKER_FIELDS_V1",
    classification: "phi_safe" as const,
    fieldPattern: "^(selectedAnchorRef|focusRestoreRef|dominantActionRef|artifactModeState|recoveryPosture|visualizationAuthority)$",
    disposition: "Expose unchanged because these are shared marker and posture refs, not content values.",
    source_refs: [
      "prompt/114.md#Mission",
      "blueprint/canonical-ui-contract-kernel.md#AutomationAnchorMap",
    ],
  },
  {
    ruleId: "RDP_UI_EVENT_REDACT_PERSON_FIELDS_V1",
    classification: "redacted" as const,
    fieldPattern: "(patient|person|subject|actor|displayName|name)$",
    disposition: "Replace with `redacted::<digest>`.",
    source_refs: [
      "prompt/114.md#Gap_handling_you_must_perform_during_this_task",
      "blueprint/accessibility-and-content-system-contract.md#AssistiveAnnouncementTruthProjection",
    ],
  },
  {
    ruleId: "RDP_UI_EVENT_REDACT_CONTACT_FIELDS_V1",
    classification: "redacted" as const,
    fieldPattern: "(email|phone|mobile|address|contact)$",
    disposition: "Replace with `redacted::<digest>`.",
    source_refs: [
      "prompt/114.md#Gap_handling_you_must_perform_during_this_task",
      "blueprint/accessibility-and-content-system-contract.md#semantic coverage alignment and PHI-safe state exposure",
    ],
  },
  {
    ruleId: "RDP_UI_EVENT_REDACT_CONTENT_FIELDS_V1",
    classification: "redacted" as const,
    fieldPattern: "(message|excerpt|note|comment|body|subjectLine)$",
    disposition: "Replace with `redacted::<digest>`.",
    source_refs: [
      "prompt/114.md#Mission",
      "blueprint/accessibility-and-content-system-contract.md#AssistiveAnnouncementContract",
    ],
  },
  {
    ruleId: "RDP_UI_EVENT_REDACT_ARTIFACT_FIELDS_V1",
    classification: "redacted" as const,
    fieldPattern: "(attachment|document|filename|artifactTitle)$",
    disposition: "Replace with `redacted::<digest>`.",
    source_refs: [
      "prompt/114.md#Mission",
      "blueprint/platform-frontend-blueprint.md#ArtifactSurfaceFrame",
    ],
  },
] as const;

const scenarioDefinitions = [
  {
    scenarioId: "SCN_SHELL_GALLERY_PATIENT_HOME",
    sourceSurface: "shell_gallery" as const,
    sourceArtifactRef: "docs/architecture/106_shell_specimen_gallery.html",
    routeFamilyRef: "rf_patient_home",
    title: "Patient home shell gallery",
    audienceLabel: "Patient portal",
    statusSpecimenId: "patient_home_pending_confirmation",
    summary:
      "The shell gallery specimen shows one calm patient route carrying the same selected anchor, dominant action, and route posture vocabulary used by automation and diagnostics.",
    shellLabel: "Patient Web",
    selectedAnchorLabel: "Home spotlight summary",
    focusRestoreLabel: "Restore to home spotlight",
    routeShellPosture: "shell_live",
    interactionOrder: [
      "selected_anchor",
      "dominant_action",
      "artifact_mode",
      "focus_restore",
    ] as const,
  },
  {
    scenarioId: "SCN_STATUS_LAB_WORKSPACE_REVIEW",
    sourceSurface: "status_truth_lab" as const,
    sourceArtifactRef: "docs/architecture/107_status_component_lab.html",
    routeFamilyRef: "rf_staff_workspace",
    title: "Workspace status lab",
    audienceLabel: "Clinical workspace",
    statusSpecimenId: "workspace_stale_review",
    summary:
      "The status lab specimen proves that state summary, dominant action, and stale review posture stay on the same published marker vocabulary.",
    shellLabel: "Clinical Workspace",
    selectedAnchorLabel: "Queue review summary",
    focusRestoreLabel: "Restore to workspace queue row",
    routeShellPosture: "shell_read_only",
    interactionOrder: [
      "visibility_downgrade",
      "selected_anchor",
      "dominant_action",
      "focus_restore",
    ] as const,
  },
  {
    scenarioId: "SCN_POSTURE_GALLERY_OPERATIONS_RECOVERY",
    sourceSurface: "posture_gallery" as const,
    sourceArtifactRef: "docs/architecture/110_posture_gallery.html",
    routeFamilyRef: "rf_operations_board",
    title: "Operations posture gallery",
    audienceLabel: "Operations console",
    statusSpecimenId: "operations_blocked_truth",
    summary:
      "The posture gallery specimen keeps blocked and recovery-only posture visible through one recovery-posture marker instead of per-page debug booleans.",
    shellLabel: "Ops Console",
    selectedAnchorLabel: "Operations anomaly summary",
    focusRestoreLabel: "Restore to anomaly digest",
    routeShellPosture: "shell_recovery_only",
    interactionOrder: [
      "recovery_posture",
      "visibility_downgrade",
      "selected_anchor",
      "focus_restore",
    ] as const,
  },
  {
    scenarioId: "SCN_ROUTE_GUARD_PATIENT_REQUESTS",
    sourceSurface: "route_guard_lab" as const,
    sourceArtifactRef: "docs/architecture/112_route_guard_lab.html",
    routeFamilyRef: "rf_patient_requests",
    title: "Route guard live patient requests",
    audienceLabel: "Patient portal",
    statusSpecimenId: "patient_home_pending_confirmation",
    summary:
      "The route guard specimen shows that live route entry, selected-anchor memory, and visibility downgrade events share the same language when runtime authority shifts.",
    shellLabel: "Patient Web",
    selectedAnchorLabel: "Request needs attention",
    focusRestoreLabel: "Restore to request summary",
    routeShellPosture: "shell_live",
    interactionOrder: [
      "selected_anchor",
      "visibility_downgrade",
      "artifact_mode",
      "focus_restore",
    ] as const,
  },
  {
    scenarioId: "SCN_ROUTE_GUARD_SUPPORT_BLOCKED",
    sourceSurface: "route_guard_lab" as const,
    sourceArtifactRef: "docs/architecture/112_route_guard_lab.html",
    routeFamilyRef: "rf_support_replay_observe",
    title: "Route guard blocked replay",
    audienceLabel: "Support workspace",
    statusSpecimenId: "governance_settled_read_only",
    summary:
      "The blocked replay specimen fails closed to one recovery posture marker and a redacted event envelope instead of leaking ticket or person context.",
    shellLabel: "Support Workspace",
    selectedAnchorLabel: "Replay recovery stub",
    focusRestoreLabel: "Restore to replay summary",
    routeShellPosture: "shell_blocked",
    interactionOrder: [
      "recovery_posture",
      "selected_anchor",
      "visibility_downgrade",
      "focus_restore",
    ] as const,
  },
  {
    scenarioId: "SCN_PATIENT_SEED_SURROGATE_HOME",
    sourceSurface: "patient_seed_surrogate" as const,
    sourceArtifactRef: "docs/architecture/106_shell_specimen_gallery.html",
    routeFamilyRef: "rf_patient_home",
    title: "Patient seed surrogate",
    audienceLabel: "Future patient seed",
    statusSpecimenId: "patient_home_pending_confirmation",
    summary:
      "Until `par_115` lands, the patient-home surrogate proves that future seed routes inherit the exact same anchor classes and event names already published here.",
    shellLabel: "Patient Web",
    selectedAnchorLabel: "Seed route spotlight",
    focusRestoreLabel: "Restore to seed spotlight",
    routeShellPosture: "shell_live",
    interactionOrder: [
      "selected_anchor",
      "dominant_action",
      "artifact_mode",
      "focus_restore",
    ] as const,
  },
] as const;

function hashRef(input: unknown): string {
  return deterministicHashHex(JSON.stringify(input)).slice(0, 16);
}

function assertion(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function toRouteSlug(routeFamilyRef: string): string {
  return routeFamilyRef.replace(/^rf_/, "");
}

function profileStateFromCoverage(coverageState: string): AutomationProfileState {
  return coverageState === "complete" ? "exact" : "provisional";
}

function visualizationAuthorityFromCoverage(
  routeFamilyRef: string,
  coverageState: string,
): VisualizationAuthorityState {
  const harnessScenario = harnessScenarioByRoute.get(routeFamilyRef);
  if (harnessScenario?.parityState === "visual_table_summary") {
    return "visual_table_summary";
  }
  if (harnessScenario?.parityState === "table_only") {
    return "table_only";
  }
  return coverageState === "complete" ? "visual_table_summary" : "summary_only";
}

function recoveryPostureFromKernel(routeFamilyRef: string): RouteGuardPosture {
  const kernelRow = kernelRowByRoute.get(routeFamilyRef);
  switch (kernelRow?.effective_display_state) {
    case "blocked":
      return "blocked";
    case "recovery":
    case "degraded":
      return "recovery_only";
    case "read_only":
    case "stale":
      return "read_only";
    default:
      return "live";
  }
}

function buildStateSummary(routeFamilyRef: string): string {
  const routeAuthority = routeAuthorityProfileByRoute.get(routeFamilyRef);
  if (routeAuthority) {
    return routeAuthority.lastSafeSummary;
  }
  const routeClaim = getPersistentShellRouteClaim(routeFamilyRef);
  return routeClaim?.routeSummary ?? `${routeFamilyRef} remains on the shared shell summary vocabulary.`;
}

function markerSelector(routeFamilyRef: string, markerClass: AutomationMarkerClass): string {
  if (markerClass === "landmark") {
    return `[data-automation-surface='${routeFamilyRef}']`;
  }
  return `[data-automation-surface='${routeFamilyRef}'] [data-automation-anchor-class='${markerClass}']`;
}

function eventCode(routeFamilyRef: string, eventClass: UiTelemetryEventClass): string {
  return `EVT_114_${routeFamilyRef.replaceAll("rf_", "").toUpperCase()}_${eventClass.toUpperCase()}`;
}

function artifactModeStateForRoute(routeFamilyRef: string): string {
  return kernelRowByRoute.get(routeFamilyRef)?.artifact_mode_state ?? "summary_only";
}

function telemetryNameForClass(
  routeFamilyRef: string,
  eventClass: UiTelemetryEventClass,
  requiredUiEventRefs: readonly string[],
): { eventName: string; bindingState: TelemetryBindingState; gapResolutionRef: string | null } {
  const firstEvent = requiredUiEventRefs[0];
  assertion(firstEvent, `Missing telemetry event prefix for ${routeFamilyRef}.`);
  const prefix = firstEvent.split(".").slice(0, 2).join(".");
  switch (eventClass) {
    case "surface_enter":
      return {
        eventName: requiredUiEventRefs.find((eventName) => eventName.endsWith(".viewed"))!,
        bindingState: "contract",
        gapResolutionRef: null,
      };
    case "state_summary_changed":
      return {
        eventName: requiredUiEventRefs.find((eventName) => eventName.endsWith(".state_changed"))!,
        bindingState: "contract",
        gapResolutionRef: null,
      };
    case "dominant_action_changed":
      return {
        eventName: requiredUiEventRefs.find((eventName) => eventName.endsWith(".dominant_action"))!,
        bindingState: "contract",
        gapResolutionRef: null,
      };
    case "artifact_mode_changed":
      return {
        eventName: requiredUiEventRefs.find((eventName) => eventName.endsWith(".artifact_mode_changed"))!,
        bindingState: "contract",
        gapResolutionRef: null,
      };
    case "selected_anchor_changed":
      return {
        eventName: `${prefix}.${toRouteSlug(routeFamilyRef)}.selected_anchor_changed`,
        bindingState: "supplemental_gap_resolution",
        gapResolutionRef: "GAP_RESOLUTION_AUTOMATION_ANCHOR_SUPPLEMENTAL_UI_EVENT_CLASSES_V1",
      };
    case "recovery_posture_changed":
      return {
        eventName: `${prefix}.${toRouteSlug(routeFamilyRef)}.recovery_posture_changed`,
        bindingState: "supplemental_gap_resolution",
        gapResolutionRef: "GAP_RESOLUTION_AUTOMATION_ANCHOR_SUPPLEMENTAL_UI_EVENT_CLASSES_V1",
      };
    case "visibility_freshness_downgrade":
      return {
        eventName: `${prefix}.${toRouteSlug(routeFamilyRef)}.visibility_downgrade`,
        bindingState: "supplemental_gap_resolution",
        gapResolutionRef: "GAP_RESOLUTION_AUTOMATION_ANCHOR_SUPPLEMENTAL_UI_EVENT_CLASSES_V1",
      };
  }
}

function inferSensitiveField(key: string): boolean {
  return /(patient|person|subject|actor|displayName|name|email|phone|mobile|address|contact|message|excerpt|note|comment|body|subjectLine|attachment|document|filename|artifactTitle)/i.test(
    key,
  );
}

export function filterPhiSafeDisclosure(
  payload: Readonly<Record<string, string>>,
): {
  payload: Readonly<Record<string, string>>;
  redactedFields: readonly string[];
  disclosureFenceState: DisclosureFenceState;
} {
  const sanitizedEntries: Array<[string, string]> = [];
  const redactedFields: string[] = [];
  for (const [key, value] of Object.entries(payload)) {
    if (!inferSensitiveField(key)) {
      sanitizedEntries.push([key, value]);
      continue;
    }
    redactedFields.push(key);
    sanitizedEntries.push([key, `redacted::${hashRef({ key, value })}`]);
  }
  return {
    payload: Object.freeze(Object.fromEntries(sanitizedEntries)),
    redactedFields,
    disclosureFenceState: redactedFields.length === 0 ? "safe" : "redacted",
  };
}

function resolveMarkerBindings(routeFamilyRef: string): readonly AutomationMarkerBinding[] {
  const routeAuthority = routeAuthorityProfileByRoute.get(routeFamilyRef);
  const anchorMap = automationAnchorMapByRoute.get(routeFamilyRef);
  const accessibilityProfile = accessibilityProfileByRoute.get(routeFamilyRef);
  const telemetryBinding = telemetryBindingByRoute.get(routeFamilyRef);
  const routeClaim = getPersistentShellRouteClaim(routeFamilyRef);

  assertion(routeAuthority, `Missing route authority profile for ${routeFamilyRef}.`);
  assertion(anchorMap, `Missing automation anchor map for ${routeFamilyRef}.`);
  assertion(accessibilityProfile, `Missing accessibility profile for ${routeFamilyRef}.`);
  assertion(telemetryBinding, `Missing telemetry binding profile for ${routeFamilyRef}.`);
  assertion(routeClaim, `Missing shell route claim for ${routeFamilyRef}.`);

  const profileState = profileStateFromCoverage(accessibilityProfile.coverageState);
  const sharedSourceRefs = [
    ...AUTOMATION_TELEMETRY_SOURCE_PRECEDENCE,
    ...anchorMap.source_refs,
    ...telemetryBinding.source_refs,
    ...accessibilityProfile.source_refs,
  ];

  const base = {
    routeFamilyRef,
    shellSlug: routeAuthority.shellSlug,
    audienceSurface: routeAuthority.audienceSurface,
    disclosureFenceState: "safe" as const,
    repeatedInstanceStrategy: "shared_anchor_only" as const,
    contractState: profileState,
    source_refs: sharedSourceRefs,
  };

  return [
    {
      ...base,
      markerClass: "landmark",
      markerRef: `${routeFamilyRef}-root`,
      domMarker: `${routeFamilyRef}-root`,
      selector: markerSelector(routeFamilyRef, "landmark"),
      selectorAttribute: "data-automation-surface",
      selectorValue: routeFamilyRef,
      supportingDomMarkers: [`${routeFamilyRef}-root`, "data-route-family", "data-shell-slug"],
      supportingEventClasses: ["surface_enter"],
      gapResolutionRef: null,
    },
    {
      ...base,
      markerClass: "state_summary",
      markerRef: `marker.${routeFamilyRef}.state_summary`,
      domMarker: "surface-state",
      selector: markerSelector(routeFamilyRef, "state_summary"),
      selectorAttribute: "data-automation-anchor-class",
      selectorValue: "state_summary",
      supportingDomMarkers: ["surface-state", "data-surface-state", "data-state-reason"],
      supportingEventClasses: ["state_summary_changed", "visibility_freshness_downgrade"],
      gapResolutionRef: null,
    },
    {
      ...base,
      markerClass: "dominant_action",
      markerRef: anchorMap.dominantActionMarkerRef,
      domMarker: "dominant-action",
      selector: markerSelector(routeFamilyRef, "dominant_action"),
      selectorAttribute: "data-automation-anchor-ref",
      selectorValue: anchorMap.dominantActionMarkerRef,
      supportingDomMarkers: ["dominant-action", "data-dominant-action"],
      supportingEventClasses: ["dominant_action_changed"],
      gapResolutionRef: null,
    },
    {
      ...base,
      markerClass: "selected_anchor",
      markerRef: anchorMap.selectedAnchorMarkerRef,
      domMarker: "selected-anchor",
      selector: markerSelector(routeFamilyRef, "selected_anchor"),
      selectorAttribute: "data-automation-anchor-ref",
      selectorValue: anchorMap.selectedAnchorMarkerRef,
      supportingDomMarkers: ["selected-anchor", "data-anchor-id", "data-anchor-state"],
      supportingEventClasses: ["selected_anchor_changed"],
      gapResolutionRef: null,
    },
    {
      ...base,
      markerClass: "focus_restore",
      markerRef: `marker.${routeFamilyRef}.focus_restore`,
      domMarker: "focus-restore",
      selector: markerSelector(routeFamilyRef, "focus_restore"),
      selectorAttribute: "data-focus-restore-ref",
      selectorValue: `focus_restore.${routeFamilyRef}.${routeClaim.defaultAnchor}`,
      supportingDomMarkers: ["data-focus-restore-ref", "data-return-anchor"],
      supportingEventClasses: ["selected_anchor_changed"],
      gapResolutionRef: "GAP_RESOLUTION_AUTOMATION_ANCHOR_FOCUS_RESTORE_MARKER_V1",
    },
    {
      ...base,
      markerClass: "artifact_posture",
      markerRef: anchorMap.artifactMarkerRef,
      domMarker: "artifact-posture",
      selector: markerSelector(routeFamilyRef, "artifact_posture"),
      selectorAttribute: "data-automation-anchor-ref",
      selectorValue: anchorMap.artifactMarkerRef,
      supportingDomMarkers: ["data-artifact-mode", "data-artifact-stage"],
      supportingEventClasses: ["artifact_mode_changed"],
      gapResolutionRef: null,
    },
    {
      ...base,
      markerClass: "recovery_posture",
      markerRef: `marker.${routeFamilyRef}.recovery_posture`,
      domMarker: "recovery-posture",
      selector: markerSelector(routeFamilyRef, "recovery_posture"),
      selectorAttribute: "data-recovery-posture",
      selectorValue: recoveryPostureFromKernel(routeFamilyRef),
      supportingDomMarkers: ["data-recovery-posture", "data-writable-state", "data-surface-state"],
      supportingEventClasses: ["recovery_posture_changed", "visibility_freshness_downgrade"],
      gapResolutionRef: "GAP_RESOLUTION_AUTOMATION_ANCHOR_RECOVERY_POSTURE_MARKER_V1",
    },
    {
      ...base,
      markerClass: "visualization_authority",
      markerRef: `marker.${routeFamilyRef}.visualization_authority`,
      domMarker: "visualization-authority",
      selector: markerSelector(routeFamilyRef, "visualization_authority"),
      selectorAttribute: "data-visualization-authority",
      selectorValue: visualizationAuthorityFromCoverage(
        routeFamilyRef,
        accessibilityProfile.coverageState,
      ),
      supportingDomMarkers: [
        "data-visualization-authority",
        "data-semantic-surface",
        "data-accessibility-coverage-state",
      ],
      supportingEventClasses: ["visibility_freshness_downgrade"],
      gapResolutionRef: "GAP_RESOLUTION_AUTOMATION_ANCHOR_VISUALIZATION_AUTHORITY_MARKER_V1",
    },
    {
      ...base,
      markerClass: "route_shell_posture",
      markerRef: `marker.${routeFamilyRef}.route_shell_posture`,
      domMarker: "route-shell-posture",
      selector: markerSelector(routeFamilyRef, "route_shell_posture"),
      selectorAttribute: "data-route-shell-posture",
      selectorValue: recoveryPostureFromKernel(routeFamilyRef) === "live" ? "shell_live" : "shell_guarded",
      supportingDomMarkers: [
        "data-route-shell-posture",
        "data-route-family",
        "data-shell-slug",
        "data-channel-profile",
      ],
      supportingEventClasses: [
        "state_summary_changed",
        "recovery_posture_changed",
        "visibility_freshness_downgrade",
      ],
      gapResolutionRef: "GAP_RESOLUTION_AUTOMATION_ANCHOR_ROUTE_SHELL_POSTURE_MARKER_V1",
    },
  ] as const;
}

export function resolveAutomationAnchorProfile(
  routeFamilyRef: string,
): AutomationAnchorProfileExample {
  const routeAuthority = routeAuthorityProfileByRoute.get(routeFamilyRef);
  const anchorMap = automationAnchorMapByRoute.get(routeFamilyRef);
  const accessibilityProfile = accessibilityProfileByRoute.get(routeFamilyRef);
  const telemetryBinding = telemetryBindingByRoute.get(routeFamilyRef);
  const designTuple = designTupleByRoute.get(routeFamilyRef);
  const kernelRow = kernelRowByRoute.get(routeFamilyRef);
  const routeClaim = getPersistentShellRouteClaim(routeFamilyRef);

  assertion(routeAuthority, `Missing route authority profile for ${routeFamilyRef}.`);
  assertion(anchorMap, `Missing automation anchor map for ${routeFamilyRef}.`);
  assertion(accessibilityProfile, `Missing accessibility profile for ${routeFamilyRef}.`);
  assertion(telemetryBinding, `Missing telemetry binding profile for ${routeFamilyRef}.`);
  assertion(designTuple, `Missing design vocabulary tuple for ${routeFamilyRef}.`);
  assertion(kernelRow, `Missing kernel row for ${routeFamilyRef}.`);
  assertion(routeClaim, `Missing route claim for ${routeFamilyRef}.`);

  const harnessScenario = harnessScenarioByRoute.get(routeFamilyRef);
  const markerBindings = resolveMarkerBindings(routeFamilyRef);
  const profileState = profileStateFromCoverage(accessibilityProfile.coverageState);
  const visualizationAuthority = visualizationAuthorityFromCoverage(
    routeFamilyRef,
    accessibilityProfile.coverageState,
  );
  const sourceSurfaceRefs = scenarioDefinitions
    .filter((scenario) => scenario.routeFamilyRef === routeFamilyRef)
    .map((scenario) => scenario.sourceSurface);
  const sourceArtifactRefs = scenarioDefinitions
    .filter((scenario) => scenario.routeFamilyRef === routeFamilyRef)
    .map((scenario) => scenario.sourceArtifactRef);
  const selectedAnchorRef = anchorMap.selectedAnchorMarkerRef;
  const focusRestoreRef = `focus_restore.${routeFamilyRef}.${routeClaim.defaultAnchor}`;
  const dominantActionRef = anchorMap.dominantActionMarkerRef;

  return {
    automationAnchorProfileId: accessibilityProfile.automationAnchorProfileRef,
    routeFamilyRef,
    routeLabel: routeAuthority.routeLabel,
    shellSlug: routeAuthority.shellSlug,
    audienceSurface: routeAuthority.audienceSurface,
    shellContinuityKey: routeClaim.continuityKey,
    automationAnchorMapRef: anchorMap.automationAnchorMapId,
    telemetryBindingProfileRef: telemetryBinding.telemetryBindingProfileId,
    accessibilitySemanticCoverageProfileRef:
      accessibilityProfile.accessibilitySemanticCoverageProfileId,
    surfaceStateKernelBindingRef: kernelRow.surface_state_kernel_binding_id,
    designContractVocabularyTupleRef: designTuple.designContractVocabularyTupleId,
    coverageState: accessibilityProfile.coverageState,
    profileState,
    visualizationAuthority,
    selectedAnchorRef,
    focusRestoreRef,
    dominantActionRef,
    dominantActionLabel: routeClaim.dominantActionLabel,
    summarySentence: buildStateSummary(routeFamilyRef),
    requiredSemanticRegionRefs: accessibilityProfile.semanticSurfaceRefs,
    requiredUiEventRefs: telemetryBinding.requiredUiEventRefs,
    supplementalUiEventRefs: [
      `${telemetryBinding.requiredUiEventRefs[0].split(".").slice(0, 2).join(".")}.${toRouteSlug(routeFamilyRef)}.selected_anchor_changed`,
      `${telemetryBinding.requiredUiEventRefs[0].split(".").slice(0, 2).join(".")}.${toRouteSlug(routeFamilyRef)}.recovery_posture_changed`,
      `${telemetryBinding.requiredUiEventRefs[0].split(".").slice(0, 2).join(".")}.${toRouteSlug(routeFamilyRef)}.visibility_downgrade`,
    ],
    markerBindings,
    sourceSurfaceRefs,
    sourceArtifactRefs,
    profileDigestRef: hashRef({
      routeFamilyRef,
      selectedAnchorRef,
      focusRestoreRef,
      dominantActionRef,
      visualizationAuthority,
      coverageState: accessibilityProfile.coverageState,
      requiredUiEventRefs: telemetryBinding.requiredUiEventRefs,
      harnessScenarioId: harnessScenario?.scenarioId ?? null,
    }),
    source_refs: [
      ...AUTOMATION_TELEMETRY_SOURCE_PRECEDENCE,
      ...anchorMap.source_refs,
      ...telemetryBinding.source_refs,
      ...accessibilityProfile.source_refs,
      ...designTuple.source_refs,
    ],
  };
}

const automationRouteProfiles = routeAuthorityProfiles
  .map((profile) => resolveAutomationAnchorProfile(profile.routeFamilyRef))
  .sort((left, right) => left.routeFamilyRef.localeCompare(right.routeFamilyRef));

const automationRouteProfileByRoute = new Map(
  automationRouteProfiles.map((profile) => [profile.routeFamilyRef, profile]),
);

export function resolveSharedMarkerSelector(
  routeFamilyRef: string,
  markerClass: AutomationMarkerClass,
): string {
  return markerSelector(routeFamilyRef, markerClass);
}

export function buildAutomationSurfaceAttributes(
  profile: AutomationAnchorProfileExample,
  state: AutomationSurfaceState = {},
): Readonly<Record<string, string>> {
  return Object.freeze({
    "data-automation-surface": profile.routeFamilyRef,
    "data-route-family": profile.routeFamilyRef,
    "data-shell-slug": profile.shellSlug,
    "data-audience-surface": profile.audienceSurface,
    "data-automation-anchor-profile-ref": profile.automationAnchorProfileId,
    "data-automation-anchor-map-ref": profile.automationAnchorMapRef,
    "data-telemetry-binding-profile-ref": profile.telemetryBindingProfileRef,
    "data-accessibility-profile-ref": profile.accessibilitySemanticCoverageProfileRef,
    "data-design-contract-vocabulary-tuple-ref": profile.designContractVocabularyTupleRef,
    "data-profile-digest": profile.profileDigestRef,
    "data-selected-anchor-ref": state.selectedAnchorRef ?? profile.selectedAnchorRef,
    "data-focus-restore-ref": state.focusRestoreRef ?? profile.focusRestoreRef,
    "data-dominant-action-ref": state.dominantActionRef ?? profile.dominantActionRef,
    "data-artifact-mode":
      state.artifactModeState ?? artifactModeStateForRoute(profile.routeFamilyRef),
    "data-recovery-posture": state.recoveryPosture ?? recoveryPostureFromKernel(profile.routeFamilyRef),
    "data-visualization-authority":
      state.visualizationAuthority ?? profile.visualizationAuthority,
    "data-route-shell-posture":
      state.routeShellPosture ??
      (recoveryPostureFromKernel(profile.routeFamilyRef) === "live" ? "shell_live" : "shell_guarded"),
  });
}

export function buildAutomationAnchorElementAttributes(
  binding: AutomationMarkerBinding,
  options: { instanceKey?: string } = {},
): Readonly<Record<string, string>> {
  return Object.freeze({
    "data-automation-anchor-class": binding.markerClass,
    "data-automation-anchor-ref": binding.markerRef,
    "data-dom-marker": binding.domMarker,
    "data-automation-instance-key": options.instanceKey ?? binding.markerClass,
  });
}

const diagnosticsScenarios: readonly AutomationDiagnosticsScenario[] = scenarioDefinitions.map(
  (definition) => {
    const profile = automationRouteProfileByRoute.get(definition.routeFamilyRef);
    const routeClaim = getPersistentShellRouteClaim(definition.routeFamilyRef);
    const statusSpecimen = statusSpecimenById.get(definition.statusSpecimenId);
    assertion(profile, `Missing automation route profile for ${definition.routeFamilyRef}.`);
    assertion(routeClaim, `Missing shell route claim for ${definition.routeFamilyRef}.`);
    assertion(statusSpecimen, `Missing status specimen ${definition.statusSpecimenId}.`);

    const selectedAnchorBinding = profile.markerBindings.find(
      (binding) => binding.markerClass === "selected_anchor",
    );
    const focusRestoreBinding = profile.markerBindings.find(
      (binding) => binding.markerClass === "focus_restore",
    );
    const dominantActionBinding = profile.markerBindings.find(
      (binding) => binding.markerClass === "dominant_action",
    );
    assertion(selectedAnchorBinding, `Missing selected-anchor binding for ${definition.routeFamilyRef}.`);
    assertion(focusRestoreBinding, `Missing focus-restore binding for ${definition.routeFamilyRef}.`);
    assertion(dominantActionBinding, `Missing dominant-action binding for ${definition.routeFamilyRef}.`);

    return {
      scenarioId: definition.scenarioId,
      sourceSurface: definition.sourceSurface,
      sourceArtifactRef: definition.sourceArtifactRef,
      routeFamilyRef: definition.routeFamilyRef,
      shellSlug: profile.shellSlug,
      title: definition.title,
      summary: definition.summary,
      shellLabel: definition.shellLabel,
      routeLabel: profile.routeLabel,
      audienceLabel: definition.audienceLabel,
      selectedAnchorRef: selectedAnchorBinding.markerRef,
      selectedAnchorLabel: definition.selectedAnchorLabel,
      focusRestoreRef: focusRestoreBinding.selectorValue,
      focusRestoreLabel: definition.focusRestoreLabel,
      dominantActionRef: dominantActionBinding.markerRef,
      dominantActionLabel: routeClaim.dominantActionLabel,
      artifactModeState:
        kernelRowByRoute.get(definition.routeFamilyRef)?.artifact_mode_state ?? "summary_only",
      recoveryPosture: recoveryPostureFromKernel(definition.routeFamilyRef),
      visualizationAuthority: profile.visualizationAuthority,
      routeShellPosture: definition.routeShellPosture,
      stateSummary: buildStateSummary(definition.routeFamilyRef),
      statusSentence: composeStatusSentence(statusSpecimen.statusInput).stateSummary,
      overlayMarkerRefs: [
        selectedAnchorBinding.markerRef,
        dominantActionBinding.markerRef,
        focusRestoreBinding.markerRef,
      ],
      interactionOrder: definition.interactionOrder,
      initialEventEnvelopeRefs: [],
      source_refs: [definition.sourceArtifactRef, ...profile.source_refs],
    };
  },
);

function primaryMarkerClassForEvent(
  eventClass: UiTelemetryEventClass,
): AutomationMarkerClass {
  switch (eventClass) {
    case "surface_enter":
      return "landmark";
    case "state_summary_changed":
      return "state_summary";
    case "selected_anchor_changed":
      return "selected_anchor";
    case "dominant_action_changed":
      return "dominant_action";
    case "artifact_mode_changed":
      return "artifact_posture";
    case "recovery_posture_changed":
      return "recovery_posture";
    case "visibility_freshness_downgrade":
      return "visualization_authority";
  }
}

const uiTelemetryVocabularyEntries: readonly UiTelemetryVocabularyEntry[] =
  automationRouteProfiles.flatMap((profile) => {
    const allEventClasses: readonly UiTelemetryEventClass[] = [
      "surface_enter",
      "state_summary_changed",
      "selected_anchor_changed",
      "dominant_action_changed",
      "artifact_mode_changed",
      "recovery_posture_changed",
      "visibility_freshness_downgrade",
    ];
    return allEventClasses.map((eventClass) => {
      const eventMeta = telemetryNameForClass(
        profile.routeFamilyRef,
        eventClass,
        profile.requiredUiEventRefs,
      );
      return {
        routeFamilyRef: profile.routeFamilyRef,
        shellSlug: profile.shellSlug,
        audienceSurface: profile.audienceSurface,
        eventClass,
        eventName: eventMeta.eventName,
        eventCode: eventCode(profile.routeFamilyRef, eventClass),
        bindingState: eventMeta.bindingState,
        automationAnchorProfileRef: profile.automationAnchorProfileId,
        telemetryBindingProfileRef: profile.telemetryBindingProfileRef,
        designContractVocabularyTupleRef: profile.designContractVocabularyTupleRef,
        primaryMarkerClassRef: primaryMarkerClassForEvent(eventClass),
        redactionProfileRef:
          telemetryBindingByRoute.get(profile.routeFamilyRef)?.redactionProfileRef ??
          "RDP_114_BROWSER_SAFE_V1",
        disclosureFenceState: "safe",
        vocabularyDigestRef: hashRef({
          routeFamilyRef: profile.routeFamilyRef,
          eventClass,
          eventName: eventMeta.eventName,
          bindingState: eventMeta.bindingState,
        }),
        gapResolutionRef: eventMeta.gapResolutionRef,
        source_refs: profile.source_refs,
      };
    });
  });

const uiTelemetryVocabularyByRouteAndClass = new Map(
  uiTelemetryVocabularyEntries.map((entry) => [`${entry.routeFamilyRef}:${entry.eventClass}`, entry]),
);

export function createUiTelemetryEnvelope(
  input: UiTelemetryEnvelopeInput,
): UiTelemetryEnvelopeExample {
  const profile = automationRouteProfileByRoute.get(input.routeFamilyRef);
  const scenario = diagnosticsScenarios.find((candidate) => candidate.scenarioId === input.scenarioId);
  const vocabulary = uiTelemetryVocabularyByRouteAndClass.get(
    `${input.routeFamilyRef}:${input.eventClass}`,
  );

  assertion(profile, `Missing automation route profile for ${input.routeFamilyRef}.`);
  assertion(scenario, `Missing diagnostics scenario ${input.scenarioId}.`);
  assertion(vocabulary, `Missing telemetry vocabulary for ${input.routeFamilyRef}:${input.eventClass}.`);

  const surfaceState = {
    selectedAnchorRef: scenario.selectedAnchorRef,
    focusRestoreRef: scenario.focusRestoreRef,
    dominantActionRef: scenario.dominantActionRef,
    artifactModeState: scenario.artifactModeState,
    recoveryPosture: scenario.recoveryPosture,
    visualizationAuthority: scenario.visualizationAuthority,
    routeShellPosture: scenario.routeShellPosture,
    ...input.surfaceState,
  } satisfies AutomationSurfaceState;
  const sanitized = filterPhiSafeDisclosure(input.payload);

  return {
    envelopeId: `UEE_${hashRef({
      scenarioId: input.scenarioId,
      routeFamilyRef: input.routeFamilyRef,
      eventClass: input.eventClass,
      payload: sanitized.payload,
    })}`,
    scenarioId: input.scenarioId,
    routeFamilyRef: input.routeFamilyRef,
    shellSlug: profile.shellSlug,
    sourceSurface: input.sourceSurface,
    eventClass: input.eventClass,
    eventName: vocabulary.eventName,
    eventCode: vocabulary.eventCode,
    bindingState: vocabulary.bindingState,
    selectedAnchorRef: surfaceState.selectedAnchorRef ?? profile.selectedAnchorRef,
    dominantActionRef: surfaceState.dominantActionRef ?? profile.dominantActionRef,
    focusRestoreRef: surfaceState.focusRestoreRef ?? profile.focusRestoreRef,
    artifactModeState:
      surfaceState.artifactModeState ?? artifactModeStateForRoute(profile.routeFamilyRef),
    recoveryPosture:
      surfaceState.recoveryPosture ?? recoveryPostureFromKernel(profile.routeFamilyRef),
    visualizationAuthority:
      surfaceState.visualizationAuthority ?? profile.visualizationAuthority,
    disclosureFenceState: sanitized.disclosureFenceState,
    payload: sanitized.payload,
    redactedFields: sanitized.redactedFields,
    payloadDigestRef: hashRef(sanitized.payload),
    emittedAt: input.emittedAt ?? GENERATED_AT,
    source_refs: vocabulary.source_refs,
  };
}

const eventEnvelopeExamples: readonly UiTelemetryEnvelopeExample[] = diagnosticsScenarios.flatMap(
  (scenario, index) => {
    const emittedAtBase = `2026-04-13T20:${String(10 + index).padStart(2, "0")}:00.000Z`;
    const events = [
      createUiTelemetryEnvelope({
        scenarioId: scenario.scenarioId,
        routeFamilyRef: scenario.routeFamilyRef,
        sourceSurface: scenario.sourceSurface,
        eventClass: "surface_enter",
        payload: {
          routeFamilyRef: scenario.routeFamilyRef,
          shellSlug: scenario.shellSlug,
          audienceSurface: automationRouteProfileByRoute.get(scenario.routeFamilyRef)?.audienceSurface ?? "unknown",
          stateSummary: scenario.stateSummary,
          patientDisplayName: `${scenario.audienceLabel} Example`,
        },
        emittedAt: emittedAtBase,
      }),
      createUiTelemetryEnvelope({
        scenarioId: scenario.scenarioId,
        routeFamilyRef: scenario.routeFamilyRef,
        sourceSurface: scenario.sourceSurface,
        eventClass: scenario.interactionOrder.includes("selected_anchor")
          ? "selected_anchor_changed"
          : "state_summary_changed",
        payload: {
          selectedAnchorRef: scenario.selectedAnchorRef,
          focusRestoreRef: scenario.focusRestoreRef,
          stateSummary: scenario.statusSentence,
          messageExcerpt: `${scenario.title} anchored summary changed`,
        },
        emittedAt: emittedAtBase.replace(":00.000Z", ":12.000Z"),
      }),
      createUiTelemetryEnvelope({
        scenarioId: scenario.scenarioId,
        routeFamilyRef: scenario.routeFamilyRef,
        sourceSurface: scenario.sourceSurface,
        eventClass: scenario.interactionOrder.includes("dominant_action")
          ? "dominant_action_changed"
          : "state_summary_changed",
        payload: {
          dominantActionRef: scenario.dominantActionRef,
          stateSummary: scenario.statusSentence,
          subjectLine: `${scenario.routeLabel} changed`,
        },
        emittedAt: emittedAtBase.replace(":00.000Z", ":24.000Z"),
      }),
      createUiTelemetryEnvelope({
        scenarioId: scenario.scenarioId,
        routeFamilyRef: scenario.routeFamilyRef,
        sourceSurface: scenario.sourceSurface,
        eventClass: scenario.interactionOrder.includes("recovery_posture")
          ? "recovery_posture_changed"
          : scenario.interactionOrder.includes("visibility_downgrade")
            ? "visibility_freshness_downgrade"
            : "artifact_mode_changed",
        payload: {
          artifactModeState: scenario.artifactModeState,
          recoveryPosture: scenario.recoveryPosture,
          visualizationAuthority: scenario.visualizationAuthority,
          attachmentFilename: `${scenario.routeFamilyRef}-trace.txt`,
        },
        emittedAt: emittedAtBase.replace(":00.000Z", ":36.000Z"),
      }),
    ];
    return events;
  },
);

const scenariosWithEnvelopeRefs = diagnosticsScenarios.map((scenario) => ({
  ...scenario,
  initialEventEnvelopeRefs: eventEnvelopeExamples
    .filter((envelope) => envelope.scenarioId === scenario.scenarioId)
    .map((envelope) => envelope.envelopeId),
}));

export function buildAutomationAndUiTelemetryArtifacts(): AutomationAndTelemetryArtifacts {
  return {
    automationAnchorProfileExamplesArtifact: {
      task_id: AUTOMATION_TELEMETRY_TASK_ID,
      visual_mode: AUTOMATION_TELEMETRY_VISUAL_MODE,
      generated_at: GENERATED_AT,
      captured_on: CAPTURED_ON,
      summary: {
        route_profile_count: automationRouteProfiles.length,
        exact_profile_count: automationRouteProfiles.filter(
          (profile) => profile.profileState === "exact",
        ).length,
        provisional_profile_count: automationRouteProfiles.filter(
          (profile) => profile.profileState === "provisional",
        ).length,
        marker_class_count: 9,
        scenario_count: scenariosWithEnvelopeRefs.length,
        source_surface_count: new Set(
          scenariosWithEnvelopeRefs.map((scenario) => scenario.sourceSurface),
        ).size,
        matrix_row_count: automationRouteProfiles.reduce(
          (count, profile) => count + profile.markerBindings.length,
          0,
        ),
      },
      routeProfiles: automationRouteProfiles,
      diagnosticScenarios: scenariosWithEnvelopeRefs,
      gap_resolutions: gapResolutions,
      assumptions,
      follow_on_dependencies: followOnDependencies,
      source_precedence: AUTOMATION_TELEMETRY_SOURCE_PRECEDENCE,
    },
    uiTelemetryVocabularyArtifact: {
      task_id: AUTOMATION_TELEMETRY_TASK_ID,
      visual_mode: AUTOMATION_TELEMETRY_VISUAL_MODE,
      generated_at: GENERATED_AT,
      captured_on: CAPTURED_ON,
      summary: {
        route_profile_count: automationRouteProfiles.length,
        event_binding_count: uiTelemetryVocabularyEntries.length,
        unique_event_class_count: new Set(
          uiTelemetryVocabularyEntries.map((entry) => entry.eventClass),
        ).size,
        contract_binding_count: uiTelemetryVocabularyEntries.filter(
          (entry) => entry.bindingState === "contract",
        ).length,
        supplemental_binding_count: uiTelemetryVocabularyEntries.filter(
          (entry) => entry.bindingState === "supplemental_gap_resolution",
        ).length,
        disclosure_safe_count: uiTelemetryVocabularyEntries.filter(
          (entry) => entry.disclosureFenceState === "safe",
        ).length,
        redaction_rule_count: redactionRules.length,
      },
      vocabularyEntries: uiTelemetryVocabularyEntries,
      redactionRules,
      assumptions,
      source_precedence: AUTOMATION_TELEMETRY_SOURCE_PRECEDENCE,
    },
    uiEventEnvelopeExamplesArtifact: {
      task_id: AUTOMATION_TELEMETRY_TASK_ID,
      visual_mode: AUTOMATION_TELEMETRY_VISUAL_MODE,
      generated_at: GENERATED_AT,
      captured_on: CAPTURED_ON,
      summary: {
        example_count: eventEnvelopeExamples.length,
        scenario_count: scenariosWithEnvelopeRefs.length,
        redacted_example_count: eventEnvelopeExamples.filter(
          (example) => example.disclosureFenceState === "redacted",
        ).length,
        total_redacted_field_count: eventEnvelopeExamples.reduce(
          (count, example) => count + example.redactedFields.length,
          0,
        ),
        recovery_event_count: eventEnvelopeExamples.filter(
          (example) => example.eventClass === "recovery_posture_changed",
        ).length,
        visibility_downgrade_event_count: eventEnvelopeExamples.filter(
          (example) => example.eventClass === "visibility_freshness_downgrade",
        ).length,
      },
      eventEnvelopes: eventEnvelopeExamples,
      source_precedence: AUTOMATION_TELEMETRY_SOURCE_PRECEDENCE,
    },
    automationAnchorMatrixRows: automationRouteProfiles.flatMap(
      (profile) => profile.markerBindings,
    ),
  };
}

const automationAndUiTelemetryArtifacts = buildAutomationAndUiTelemetryArtifacts();

export const automationAnchorProfileExamplesArtifact =
  automationAndUiTelemetryArtifacts.automationAnchorProfileExamplesArtifact;
export const uiTelemetryVocabularyArtifact =
  automationAndUiTelemetryArtifacts.uiTelemetryVocabularyArtifact;
export const uiEventEnvelopeExamplesArtifact =
  automationAndUiTelemetryArtifacts.uiEventEnvelopeExamplesArtifact;
export const automationAnchorMatrixRows =
  automationAndUiTelemetryArtifacts.automationAnchorMatrixRows;

export const automationTelemetryCatalog = {
  taskId: AUTOMATION_TELEMETRY_TASK_ID,
  visualMode: AUTOMATION_TELEMETRY_VISUAL_MODE,
  routeProfileCount: automationAnchorProfileExamplesArtifact.summary.route_profile_count,
  exactProfileCount: automationAnchorProfileExamplesArtifact.summary.exact_profile_count,
  provisionalProfileCount:
    automationAnchorProfileExamplesArtifact.summary.provisional_profile_count,
  markerClassCount: automationAnchorProfileExamplesArtifact.summary.marker_class_count,
  scenarioCount: automationAnchorProfileExamplesArtifact.summary.scenario_count,
  eventBindingCount: uiTelemetryVocabularyArtifact.summary.event_binding_count,
  supplementalBindingCount: uiTelemetryVocabularyArtifact.summary.supplemental_binding_count,
  redactedEnvelopeCount: uiEventEnvelopeExamplesArtifact.summary.redacted_example_count,
  disclosureRuleCount: uiTelemetryVocabularyArtifact.summary.redaction_rule_count,
} as const;
