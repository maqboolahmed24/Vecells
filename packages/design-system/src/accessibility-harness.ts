import type {
  AccessibilitySemanticCoverageProfile,
  CoverageState,
} from "./ui-contract-kernel";
import { uiContractAccessibilityArtifact } from "./ui-contract-kernel.generated";

export const ACCESSIBILITY_HARNESS_TASK_ID = "par_111";
export const ACCESSIBILITY_HARNESS_VISUAL_MODE = "Accessibility_Control_Deck";
export const ACCESSIBILITY_HARNESS_PUBLICATION_PATH =
  "data/analysis/accessibility_semantic_coverage_profiles.json";
export const FOCUS_TRANSITION_CONTRACT_MATRIX_PATH =
  "data/analysis/focus_transition_contract_matrix.csv";
export const KEYBOARD_INTERACTION_CONTRACT_MATRIX_PATH =
  "data/analysis/keyboard_interaction_contract_matrix.csv";
export const ASSISTIVE_ANNOUNCEMENT_EXAMPLES_PATH =
  "data/analysis/assistive_announcement_examples.json";

export const ACCESSIBILITY_HARNESS_SOURCE_PRECEDENCE = [
  "prompt/111.md",
  "prompt/shared_operating_contract_106_to_115.md",
  "prompt/AGENT.md",
  "prompt/checklist.md",
  "blueprint/accessibility-and-content-system-contract.md#AccessibleSurfaceContract",
  "blueprint/accessibility-and-content-system-contract.md#KeyboardInteractionContract",
  "blueprint/accessibility-and-content-system-contract.md#FocusTransitionContract",
  "blueprint/accessibility-and-content-system-contract.md#AssistiveAnnouncementContract",
  "blueprint/accessibility-and-content-system-contract.md#AssistiveAnnouncementTruthProjection",
  "blueprint/accessibility-and-content-system-contract.md#VisualizationParityProjection",
  "blueprint/canonical-ui-contract-kernel.md#SurfaceStateKernelBinding",
  "blueprint/platform-frontend-blueprint.md#AccessibilitySemanticCoverageProfile",
  "blueprint/platform-frontend-blueprint.md#SelectedAnchorPolicy",
  "blueprint/forensic-audit-findings.md#Finding 86",
  "blueprint/forensic-audit-findings.md#Finding 92",
  "blueprint/forensic-audit-findings.md#Finding 93",
  "blueprint/forensic-audit-findings.md#Finding 116",
  "blueprint/forensic-audit-findings.md#Finding 117",
  "blueprint/forensic-audit-findings.md#Finding 118",
  "blueprint/forensic-audit-findings.md#Finding 120",
] as const;

export type KeyboardModel = "tab_ring" | "listbox" | "grid" | "tabs";
export type FocusTransitionScope =
  | "surface_root"
  | "selected_anchor_preserve"
  | "detail_child_return"
  | "same_shell_recovery"
  | "thread_focus_restore";
export type FocusTrigger =
  | "same_shell_refresh"
  | "buffered_update"
  | "mission_stack_fold"
  | "mission_stack_unfold"
  | "restore"
  | "invalidation"
  | "recovery_return";
export type FocusDisposition =
  | "preserve"
  | "restore_previous"
  | "move_selected_anchor"
  | "move_summary"
  | "move_recovery_stub";
export type ContractState = "exact" | "provisional" | "blocked";
export type AnnouncementAuthority =
  | "chrome_restore"
  | "local_ack"
  | "pending"
  | "stale"
  | "recovery"
  | "authoritative_settlement";
export type AnnouncementStatus =
  | "current"
  | "suppressed"
  | "deduplicated"
  | "superseded";
export type AnnouncementIntent =
  | "restore"
  | "queued"
  | "pending"
  | "stale"
  | "recovery"
  | "settled";
export type VisualizationParityState =
  | "visual_table_summary"
  | "table_only"
  | "summary_only"
  | "placeholder";

export interface FocusTargetDescriptor {
  focusTargetRef: string;
  domMarkerRef: string;
  label: string;
  role: "button" | "tab" | "row" | "summary" | "status";
}

export interface AccessibilityHarnessRouteProfile {
  routeFamilyRef: string;
  shellType: AccessibilitySemanticCoverageProfile["shellType"];
  audienceTier: AccessibilitySemanticCoverageProfile["audienceTier"];
  coverageState: CoverageState;
  keyboardModel: KeyboardModel;
  focusTransitionScope: FocusTransitionScope;
  verificationState: ContractState;
  landmarkRefs: readonly string[];
  headingOrder: readonly string[];
  focusTargets: readonly FocusTargetDescriptor[];
  currentFocusTargetRef: string;
  previousFocusTargetRef: string;
  selectedAnchorTargetRef: string;
  summaryTargetRef: string;
  recoveryStubTargetRef: string;
  keyboardGapResolutionRef: string | null;
  announcementGapResolutionRef: string | null;
  visualizationGapResolutionRef: string | null;
  automationAnchorMapRef: string;
  designContractPublicationBundleRef: string;
  reducedMotionEquivalenceRef: string;
  requiredBreakpointClassRefs: AccessibilitySemanticCoverageProfile["requiredBreakpointClassRefs"];
  coverageTupleHash: string;
}

export interface FocusTransitionDecision {
  disposition: FocusDisposition;
  nextTargetRef: string;
  explanation: string;
}

export interface FocusTransitionContractRow {
  contractId: string;
  routeFamilyRef: string;
  keyboardModel: KeyboardModel;
  focusTransitionScope: FocusTransitionScope;
  trigger: FocusTrigger;
  currentTargetRef: string;
  previousTargetRef: string;
  nextTargetRef: string;
  disposition: FocusDisposition;
  contractState: ContractState;
  motionEquivalenceRef: string;
  zoomReflowRef: string;
  rationale: string;
  domMarkerRef: string;
  designContractPublicationBundleRef: string;
  coverageState: CoverageState;
  source_refs: readonly string[];
}

export interface KeyboardInteractionContractRow {
  contractId: string;
  routeFamilyRef: string;
  keyboardModel: KeyboardModel;
  focusTransitionScope: FocusTransitionScope;
  traversalKeyRefs: readonly string[];
  activationKeyRefs: readonly string[];
  dismissalKeyRefs: readonly string[];
  optionalKeyRefs: readonly string[];
  landmarkRefs: readonly string[];
  verificationNarrative: string;
  contractState: ContractState;
  gapResolutionRef: string | null;
  designContractPublicationBundleRef: string;
  coverageState: CoverageState;
  source_refs: readonly string[];
}

export interface KeyboardVerificationResult {
  valid: boolean;
  invalidKeys: readonly string[];
  missingTraversalKey: boolean;
  missingActivationKey: boolean;
}

export interface AssistiveAnnouncementInput {
  announcementId: string;
  scenarioId: string;
  routeFamilyRef: string;
  trigger: FocusTrigger | "initial";
  scopeRef: string;
  causalTuple: string;
  authority: AnnouncementAuthority;
  intent: AnnouncementIntent;
  politeness: "polite" | "assertive";
  text: string;
  sequence: number;
}

export interface AssistiveAnnouncementExample
  extends Omit<AssistiveAnnouncementInput, "sequence"> {
  status: AnnouncementStatus;
}

export interface AssistiveAnnouncementExampleArtifact {
  task_id: string;
  visual_mode: string;
  generated_at: string;
  captured_on: string;
  summary: {
    example_count: number;
    current_count: number;
    suppressed_count: number;
    deduplicated_count: number;
    superseded_count: number;
  };
  assistiveAnnouncementExamples: readonly AssistiveAnnouncementExample[];
  source_precedence: readonly string[];
  gap_resolutions: readonly GapResolutionRecord[];
}

export interface VisualizationParityInput {
  visualMeaningState: "verified" | "stale" | "blocked";
  tableAvailable: boolean;
  summaryAvailable: boolean;
  fallbackReason: string;
}

export interface VisualizationParityDecision {
  parityState: VisualizationParityState;
  explanation: string;
  authorityTarget: "visual" | "table" | "summary" | "placeholder";
}

export interface AccessibilityHarnessScenario {
  scenarioId: string;
  routeFamilyRef: string;
  label: string;
  audienceLabel: string;
  description: string;
  keyboardModel: KeyboardModel;
  focusTransitionScope: FocusTransitionScope;
  landmarkRefs: readonly string[];
  headingOrder: readonly string[];
  focusTargets: readonly FocusTargetDescriptor[];
  currentFocusTargetRef: string;
  previousFocusTargetRef: string;
  selectedAnchorTargetRef: string;
  primaryTriggerRefs: readonly FocusTrigger[];
  parityState: VisualizationParityState;
  parityFallbackState: VisualizationParityState;
  summarySentence: string;
  chartLabel: string;
  tableLabel: string;
  visualizationRows: readonly Readonly<Record<"metric" | "current" | "fallback", string>>[];
  announcementExampleRefs: readonly string[];
  gapResolutionRefs: readonly string[];
}

export interface PrerequisiteGapRecord {
  gapId: string;
  classification: "prerequisite_gap";
  statement: string;
  safeFallback: string;
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
  ownerTaskRange: string;
  statement: string;
  safeFallback: string;
  source_refs: readonly string[];
}

export interface AccessibilityCoverageHarnessExtension {
  task_id: string;
  generated_at: string;
  captured_on: string;
  summary: typeof uiContractAccessibilityArtifact.summary;
  accessibilitySemanticCoverageProfiles: readonly AccessibilitySemanticCoverageProfile[];
  harness_task_id: string;
  harness_visual_mode: string;
  harness_summary: {
    route_profile_count: number;
    scenario_count: number;
    focus_transition_contract_count: number;
    keyboard_interaction_contract_count: number;
    exact_keyboard_contract_count: number;
    provisional_keyboard_contract_count: number;
    blocked_keyboard_contract_count: number;
    announcement_example_count: number;
  };
  focusTransitionContracts: readonly FocusTransitionContractRow[];
  keyboardInteractionContracts: readonly KeyboardInteractionContractRow[];
  harnessScenarios: readonly AccessibilityHarnessScenario[];
  prerequisite_gaps: readonly PrerequisiteGapRecord[];
  gap_resolutions: readonly GapResolutionRecord[];
  follow_on_dependencies: readonly FollowOnDependencyRecord[];
  source_precedence: readonly string[];
  assistiveAnnouncementExamplesRef: string;
}

export interface AccessibilityHarnessArtifacts {
  accessibilityExtension: AccessibilityCoverageHarnessExtension;
  focusTransitionRows: readonly FocusTransitionContractRow[];
  keyboardRows: readonly KeyboardInteractionContractRow[];
  announcementArtifact: AssistiveAnnouncementExampleArtifact;
  scenarios: readonly AccessibilityHarnessScenario[];
}

interface RouteHarnessSpec {
  routeFamilyRef: string;
  keyboardModel: KeyboardModel;
  focusTransitionScope: FocusTransitionScope;
  verificationState: ContractState;
  landmarkRefs: readonly string[];
  headingOrder: readonly string[];
  currentFocusLabel: string;
  selectedAnchorLabel: string;
  summaryLabel: string;
  recoveryLabel: string;
  keyboardGapResolutionRef?: string;
  announcementGapResolutionRef?: string;
  visualizationGapResolutionRef?: string;
}

interface ScenarioSeed {
  scenarioId: string;
  routeFamilyRef: string;
  label: string;
  audienceLabel: string;
  description: string;
  primaryTriggerRefs: readonly FocusTrigger[];
  parityInput: VisualizationParityInput;
  parityFallbackInput: VisualizationParityInput;
  summarySentence: string;
  chartLabel: string;
  tableLabel: string;
  visualizationRows: readonly Readonly<Record<"metric" | "current" | "fallback", string>>[];
}

interface KeyboardRule {
  traversalKeyRefs: readonly string[];
  activationKeyRefs: readonly string[];
  dismissalKeyRefs: readonly string[];
  optionalKeyRefs: readonly string[];
  narrative: string;
}

const KEYBOARD_RULES: Record<KeyboardModel, KeyboardRule> = {
  tab_ring: {
    traversalKeyRefs: ["Tab", "Shift+Tab"],
    activationKeyRefs: ["Enter", "Space"],
    dismissalKeyRefs: ["Escape"],
    optionalKeyRefs: ["ArrowDown", "ArrowUp"],
    narrative: "Linear tab order with explicit activation and calm escape.",
  },
  listbox: {
    traversalKeyRefs: ["ArrowDown", "ArrowUp", "Home", "End"],
    activationKeyRefs: ["Enter", "Space"],
    dismissalKeyRefs: ["Escape"],
    optionalKeyRefs: ["Tab", "Shift+Tab"],
    narrative: "Roving listbox focus keeps the selected anchor stable while items change.",
  },
  grid: {
    traversalKeyRefs: ["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", "Home", "End"],
    activationKeyRefs: ["Enter", "Space"],
    dismissalKeyRefs: ["Escape"],
    optionalKeyRefs: ["PageUp", "PageDown", "Tab", "Shift+Tab"],
    narrative: "Dense matrix navigation is explicit and may downgrade to table-first proof.",
  },
  tabs: {
    traversalKeyRefs: ["ArrowLeft", "ArrowRight", "Home", "End"],
    activationKeyRefs: ["Enter", "Space"],
    dismissalKeyRefs: ["Escape"],
    optionalKeyRefs: ["Tab", "Shift+Tab"],
    narrative: "Tabs own section changes and thread restore without shell-level chrome repetition.",
  },
};

const ROUTE_HARNESS_SPECS = [
  {
    routeFamilyRef: "rf_governance_shell",
    keyboardModel: "tabs",
    focusTransitionScope: "surface_root",
    verificationState: "provisional",
    landmarkRefs: ["banner", "navigation", "main", "complementary"],
    headingOrder: ["Governance shell", "Approval rail", "Assurance tuple"],
    currentFocusLabel: "Approval tab",
    selectedAnchorLabel: "Approval summary",
    summaryLabel: "Governance summary",
    recoveryLabel: "Governance recovery stub",
    keyboardGapResolutionRef: "GAP_RESOLUTION_KEYBOARD_MODEL_TABS_RESTORE_PROVISIONAL_V1",
    announcementGapResolutionRef: "GAP_RESOLUTION_ANNOUNCEMENT_COPY_RECOVERY_SEMANTICS_V1",
  },
  {
    routeFamilyRef: "rf_hub_case_management",
    keyboardModel: "tab_ring",
    focusTransitionScope: "surface_root",
    verificationState: "exact",
    landmarkRefs: ["banner", "navigation", "main"],
    headingOrder: ["Hub case management", "Alternatives", "State braid"],
    currentFocusLabel: "Case next step",
    selectedAnchorLabel: "Case summary",
    summaryLabel: "Hub summary",
    recoveryLabel: "Hub recovery stub",
  },
  {
    routeFamilyRef: "rf_hub_queue",
    keyboardModel: "listbox",
    focusTransitionScope: "selected_anchor_preserve",
    verificationState: "exact",
    landmarkRefs: ["banner", "navigation", "main"],
    headingOrder: ["Hub queue", "Selected case", "Command rail"],
    currentFocusLabel: "Queue row",
    selectedAnchorLabel: "Selected case summary",
    summaryLabel: "Queue summary",
    recoveryLabel: "Hub queue recovery stub",
  },
  {
    routeFamilyRef: "rf_intake_self_service",
    keyboardModel: "tab_ring",
    focusTransitionScope: "surface_root",
    verificationState: "exact",
    landmarkRefs: ["banner", "navigation", "main", "form"],
    headingOrder: ["Self-service intake", "Question set", "Next action"],
    currentFocusLabel: "Primary form field",
    selectedAnchorLabel: "Question summary",
    summaryLabel: "Intake summary",
    recoveryLabel: "Intake recovery stub",
  },
  {
    routeFamilyRef: "rf_intake_telephony_capture",
    keyboardModel: "tab_ring",
    focusTransitionScope: "surface_root",
    verificationState: "exact",
    landmarkRefs: ["banner", "navigation", "main", "form"],
    headingOrder: ["Telephony capture", "Caller context", "Confirmation"],
    currentFocusLabel: "Capture field",
    selectedAnchorLabel: "Caller summary",
    summaryLabel: "Telephony summary",
    recoveryLabel: "Telephony recovery stub",
  },
  {
    routeFamilyRef: "rf_operations_board",
    keyboardModel: "grid",
    focusTransitionScope: "surface_root",
    verificationState: "provisional",
    landmarkRefs: ["banner", "navigation", "main", "complementary"],
    headingOrder: ["Operations board", "Signal matrix", "Guardrail summary"],
    currentFocusLabel: "Guardrail grid cell",
    selectedAnchorLabel: "Selected guardrail summary",
    summaryLabel: "Operations summary",
    recoveryLabel: "Operations recovery stub",
    keyboardGapResolutionRef: "GAP_RESOLUTION_KEYBOARD_MODEL_GRID_PROVISIONAL_V1",
    visualizationGapResolutionRef: "GAP_VISUALIZATION_PARITY_OPERATIONS_TABLE_ONLY_V1",
  },
  {
    routeFamilyRef: "rf_operations_drilldown",
    keyboardModel: "grid",
    focusTransitionScope: "surface_root",
    verificationState: "provisional",
    landmarkRefs: ["banner", "navigation", "main", "complementary"],
    headingOrder: ["Operations drilldown", "Incident ledger", "Decision dock"],
    currentFocusLabel: "Incident grid cell",
    selectedAnchorLabel: "Incident summary",
    summaryLabel: "Drilldown summary",
    recoveryLabel: "Drilldown recovery stub",
    keyboardGapResolutionRef: "GAP_RESOLUTION_KEYBOARD_MODEL_GRID_PROVISIONAL_V1",
  },
  {
    routeFamilyRef: "rf_patient_appointments",
    keyboardModel: "tab_ring",
    focusTransitionScope: "detail_child_return",
    verificationState: "exact",
    landmarkRefs: ["banner", "navigation", "main"],
    headingOrder: ["Appointments", "Selected appointment", "Preparation"],
    currentFocusLabel: "Appointment detail action",
    selectedAnchorLabel: "Appointment summary",
    summaryLabel: "Appointments summary",
    recoveryLabel: "Appointment recovery stub",
  },
  {
    routeFamilyRef: "rf_patient_embedded_channel",
    keyboardModel: "tab_ring",
    focusTransitionScope: "surface_root",
    verificationState: "blocked",
    landmarkRefs: ["banner", "main"],
    headingOrder: ["Embedded channel", "Channel constraints", "Safe return"],
    currentFocusLabel: "Embedded safe action",
    selectedAnchorLabel: "Embedded summary",
    summaryLabel: "Embedded channel summary",
    recoveryLabel: "Embedded recovery stub",
    announcementGapResolutionRef: "GAP_RESOLUTION_ANNOUNCEMENT_COPY_RECOVERY_SEMANTICS_V1",
  },
  {
    routeFamilyRef: "rf_patient_health_record",
    keyboardModel: "tab_ring",
    focusTransitionScope: "surface_root",
    verificationState: "exact",
    landmarkRefs: ["banner", "navigation", "main"],
    headingOrder: ["Health record", "Record sections", "Observation summary"],
    currentFocusLabel: "Record section button",
    selectedAnchorLabel: "Record summary",
    summaryLabel: "Health summary",
    recoveryLabel: "Record recovery stub",
  },
  {
    routeFamilyRef: "rf_patient_home",
    keyboardModel: "tab_ring",
    focusTransitionScope: "surface_root",
    verificationState: "exact",
    landmarkRefs: ["banner", "navigation", "main"],
    headingOrder: ["Patient home", "Next steps", "Trusted summary"],
    currentFocusLabel: "Next step button",
    selectedAnchorLabel: "Home summary",
    summaryLabel: "Home summary",
    recoveryLabel: "Home recovery stub",
  },
  {
    routeFamilyRef: "rf_patient_messages",
    keyboardModel: "tabs",
    focusTransitionScope: "thread_focus_restore",
    verificationState: "provisional",
    landmarkRefs: ["banner", "navigation", "main"],
    headingOrder: ["Messages", "Thread rail", "Composer status"],
    currentFocusLabel: "Thread tab",
    selectedAnchorLabel: "Thread summary",
    summaryLabel: "Messages summary",
    recoveryLabel: "Messages recovery stub",
    keyboardGapResolutionRef: "GAP_RESOLUTION_KEYBOARD_MODEL_TABS_RESTORE_PROVISIONAL_V1",
  },
  {
    routeFamilyRef: "rf_patient_requests",
    keyboardModel: "tab_ring",
    focusTransitionScope: "detail_child_return",
    verificationState: "exact",
    landmarkRefs: ["banner", "navigation", "main"],
    headingOrder: ["Requests", "Request detail", "Outcome summary"],
    currentFocusLabel: "Request action",
    selectedAnchorLabel: "Request summary",
    summaryLabel: "Request summary",
    recoveryLabel: "Request recovery stub",
  },
  {
    routeFamilyRef: "rf_patient_secure_link_recovery",
    keyboardModel: "tab_ring",
    focusTransitionScope: "same_shell_recovery",
    verificationState: "exact",
    landmarkRefs: ["banner", "main"],
    headingOrder: ["Secure link recovery", "Identity check", "Recovery summary"],
    currentFocusLabel: "Identity step",
    selectedAnchorLabel: "Recovery summary",
    summaryLabel: "Secure recovery summary",
    recoveryLabel: "Secure link recovery stub",
    announcementGapResolutionRef: "GAP_RESOLUTION_ANNOUNCEMENT_COPY_RECOVERY_SEMANTICS_V1",
  },
  {
    routeFamilyRef: "rf_pharmacy_console",
    keyboardModel: "tab_ring",
    focusTransitionScope: "surface_root",
    verificationState: "exact",
    landmarkRefs: ["banner", "navigation", "main", "complementary"],
    headingOrder: ["Pharmacy console", "Prescription queue", "Verification detail"],
    currentFocusLabel: "Prescription action",
    selectedAnchorLabel: "Prescription summary",
    summaryLabel: "Pharmacy summary",
    recoveryLabel: "Pharmacy recovery stub",
  },
  {
    routeFamilyRef: "rf_staff_workspace",
    keyboardModel: "listbox",
    focusTransitionScope: "selected_anchor_preserve",
    verificationState: "exact",
    landmarkRefs: ["banner", "navigation", "main"],
    headingOrder: ["Workspace queue", "Selected task", "Next action"],
    currentFocusLabel: "Task row",
    selectedAnchorLabel: "Task summary",
    summaryLabel: "Workspace summary",
    recoveryLabel: "Workspace recovery stub",
  },
  {
    routeFamilyRef: "rf_staff_workspace_child",
    keyboardModel: "tab_ring",
    focusTransitionScope: "selected_anchor_preserve",
    verificationState: "exact",
    landmarkRefs: ["banner", "navigation", "main"],
    headingOrder: ["Workspace detail", "Clinical record", "Action rail"],
    currentFocusLabel: "Clinical detail action",
    selectedAnchorLabel: "Clinical summary",
    summaryLabel: "Workspace detail summary",
    recoveryLabel: "Workspace detail recovery stub",
  },
  {
    routeFamilyRef: "rf_support_replay_observe",
    keyboardModel: "tab_ring",
    focusTransitionScope: "same_shell_recovery",
    verificationState: "provisional",
    landmarkRefs: ["banner", "navigation", "main", "complementary"],
    headingOrder: ["Replay observe", "Event timeline", "Recovery posture"],
    currentFocusLabel: "Replay checkpoint",
    selectedAnchorLabel: "Replay summary",
    summaryLabel: "Replay summary",
    recoveryLabel: "Replay recovery stub",
    announcementGapResolutionRef: "GAP_RESOLUTION_ANNOUNCEMENT_COPY_RECOVERY_SEMANTICS_V1",
  },
  {
    routeFamilyRef: "rf_support_ticket_workspace",
    keyboardModel: "grid",
    focusTransitionScope: "selected_anchor_preserve",
    verificationState: "provisional",
    landmarkRefs: ["banner", "navigation", "main", "complementary"],
    headingOrder: ["Support workspace", "Ticket board", "Escalation rail"],
    currentFocusLabel: "Ticket board cell",
    selectedAnchorLabel: "Ticket summary",
    summaryLabel: "Support summary",
    recoveryLabel: "Support recovery stub",
    keyboardGapResolutionRef: "GAP_RESOLUTION_KEYBOARD_MODEL_GRID_PROVISIONAL_V1",
    visualizationGapResolutionRef: "GAP_VISUALIZATION_PARITY_SUPPORT_PLACEHOLDER_V1",
  },
] as const satisfies readonly RouteHarnessSpec[];

const SCENARIO_SEEDS = [
  {
    scenarioId: "SCN_PATIENT_REQUEST_BUFFERED_PRESERVE",
    routeFamilyRef: "rf_patient_requests",
    label: "Patient request buffered preserve",
    audienceLabel: "Patient",
    description:
      "Buffered updates keep focus on the active request action while the shell records local acknowledgement, pending queue truth, and final settlement.",
    primaryTriggerRefs: ["same_shell_refresh", "buffered_update", "restore"],
    parityInput: {
      visualMeaningState: "verified",
      tableAvailable: true,
      summaryAvailable: true,
      fallbackReason: "Verified request summary and table stay aligned.",
    },
    parityFallbackInput: {
      visualMeaningState: "stale",
      tableAvailable: true,
      summaryAvailable: true,
      fallbackReason: "If the visual drifts, the request summary stays authoritative through table-first parity.",
    },
    summarySentence:
      "The request queue summary remains authoritative while status moves from local acknowledgement to settled confirmation.",
    chartLabel: "Request queue cadence",
    tableLabel: "Request queue fallback table",
    visualizationRows: [
      { metric: "Queued", current: "1", fallback: "1 verified row" },
      { metric: "Pending", current: "1", fallback: "1 pending row" },
      { metric: "Settled", current: "1", fallback: "1 settled row" },
    ],
  },
  {
    scenarioId: "SCN_STAFF_WORKSPACE_RESTORE",
    routeFamilyRef: "rf_staff_workspace",
    label: "Workspace selected-anchor restore",
    audienceLabel: "Workspace",
    description:
      "Selected-anchor preserve keeps the clinician on the chosen task summary through fold, unfold, and return without shell chrome narration.",
    primaryTriggerRefs: ["mission_stack_fold", "mission_stack_unfold", "restore"],
    parityInput: {
      visualMeaningState: "verified",
      tableAvailable: true,
      summaryAvailable: true,
      fallbackReason: "Workspace summary and task table stay on the same tuple.",
    },
    parityFallbackInput: {
      visualMeaningState: "verified",
      tableAvailable: true,
      summaryAvailable: true,
      fallbackReason: "No downgrade is required for this scenario.",
    },
    summarySentence:
      "The workspace keeps the selected task stable while mission-stack fold and unfold happen inside one shell.",
    chartLabel: "Task pacing",
    tableLabel: "Task pacing fallback table",
    visualizationRows: [
      { metric: "Selected task", current: "Stable", fallback: "Stable" },
      { metric: "Pending saves", current: "0", fallback: "0" },
      { metric: "Return contract", current: "Exact", fallback: "Exact" },
    ],
  },
  {
    scenarioId: "SCN_PATIENT_MESSAGES_THREAD_RESTORE",
    routeFamilyRef: "rf_patient_messages",
    label: "Patient messages thread restore",
    audienceLabel: "Patient",
    description:
      "Thread restore keeps focus on the active conversation tab and deduplicates repeated pending announcements on the same causal tuple.",
    primaryTriggerRefs: ["restore", "buffered_update"],
    parityInput: {
      visualMeaningState: "verified",
      tableAvailable: true,
      summaryAvailable: true,
      fallbackReason: "Message thread summary and list stay aligned.",
    },
    parityFallbackInput: {
      visualMeaningState: "stale",
      tableAvailable: true,
      summaryAvailable: true,
      fallbackReason: "If the thread visual drifts, the table and summary continue to carry the proof.",
    },
    summarySentence:
      "The active thread stays selected and repeated pending narration is deduplicated on its causal tuple.",
    chartLabel: "Message thread health",
    tableLabel: "Message thread fallback table",
    visualizationRows: [
      { metric: "Unread", current: "2", fallback: "2 rows" },
      { metric: "Pending send", current: "1", fallback: "1 row" },
      { metric: "Settled reply", current: "1", fallback: "1 row" },
    ],
  },
  {
    scenarioId: "SCN_OPERATIONS_PARITY_DOWNGRADE",
    routeFamilyRef: "rf_operations_board",
    label: "Operations chart parity downgrade",
    audienceLabel: "Operations",
    description:
      "The matrix surface visibly downgrades from visual-plus-table parity to table-only when chart meaning becomes stale.",
    primaryTriggerRefs: ["buffered_update", "invalidation"],
    parityInput: {
      visualMeaningState: "verified",
      tableAvailable: true,
      summaryAvailable: true,
      fallbackReason: "The operations matrix and fallback table publish the same truth.",
    },
    parityFallbackInput: {
      visualMeaningState: "stale",
      tableAvailable: true,
      summaryAvailable: true,
      fallbackReason: "Chart drift forces the surface into table-only posture inside the same shell.",
    },
    summarySentence:
      "Guardrail severity remains readable even if the chart view is withdrawn and the table becomes the authoritative surface.",
    chartLabel: "Guardrail drift matrix",
    tableLabel: "Guardrail fallback table",
    visualizationRows: [
      { metric: "Critical", current: "2", fallback: "2 rows" },
      { metric: "Watch", current: "3", fallback: "3 rows" },
      { metric: "Settled", current: "8", fallback: "8 rows" },
    ],
  },
  {
    scenarioId: "SCN_GOVERNANCE_RECOVERY_INVALIDATION",
    routeFamilyRef: "rf_governance_shell",
    label: "Governance recovery invalidation",
    audienceLabel: "Governance",
    description:
      "Recovery posture moves focus only when the contract requires invalidation, then returns to the summary rail with authoritative settlement language.",
    primaryTriggerRefs: ["invalidation", "recovery_return"],
    parityInput: {
      visualMeaningState: "verified",
      tableAvailable: true,
      summaryAvailable: true,
      fallbackReason: "The governance evidence matrix remains on verified parity.",
    },
    parityFallbackInput: {
      visualMeaningState: "stale",
      tableAvailable: true,
      summaryAvailable: true,
      fallbackReason: "If evidence visuals drift, governance falls back to table-first review without losing summary truth.",
    },
    summarySentence:
      "Recovery moves focus to the stub only on contracted invalidation, then returns to the summary rail once settlement is authoritative.",
    chartLabel: "Evidence posture matrix",
    tableLabel: "Evidence fallback table",
    visualizationRows: [
      { metric: "Ready", current: "5", fallback: "5 rows" },
      { metric: "Review", current: "2", fallback: "2 rows" },
      { metric: "Blocked", current: "1", fallback: "1 row" },
    ],
  },
  {
    scenarioId: "SCN_SUPPORT_BLOCKED_RECOVERY",
    routeFamilyRef: "rf_support_replay_observe",
    label: "Support blocked recovery",
    audienceLabel: "Support",
    description:
      "Blocked recovery keeps the same shell visible, suppresses repeated chrome narration, and falls back to summary-only evidence if visualization parity cannot be proved.",
    primaryTriggerRefs: ["invalidation", "recovery_return"],
    parityInput: {
      visualMeaningState: "stale",
      tableAvailable: true,
      summaryAvailable: true,
      fallbackReason: "Replay observations start in table-only posture because visual parity is still provisional.",
    },
    parityFallbackInput: {
      visualMeaningState: "blocked",
      tableAvailable: false,
      summaryAvailable: true,
      fallbackReason: "If replay evidence cannot prove parity, the shell retreats to summary-only posture.",
    },
    summarySentence:
      "Replay evidence stays inspectable even when the chart is removed and the shell speaks only the blocked recovery truth.",
    chartLabel: "Replay gap view",
    tableLabel: "Replay fallback table",
    visualizationRows: [
      { metric: "Replayed", current: "4", fallback: "4 rows" },
      { metric: "Missing", current: "1", fallback: "1 row" },
      { metric: "Recovered", current: "0", fallback: "Summary only" },
    ],
  },
] as const satisfies readonly ScenarioSeed[];

export const ACCESSIBILITY_HARNESS_PREREQUISITE_GAPS = [
  {
    gapId: "PREREQUISITE_GAP_PAR_110_SHARED_POSTURE_SURFACES_V1",
    classification: "prerequisite_gap",
    statement:
      "par_110 shared loading, empty, stale, blocked, and recovery posture deliverables were not present when par_111 executed.",
    safeFallback:
      "The harness publishes its own bounded posture descriptors and fails closed to summary, table, or recovery stub markers until the shared posture surface lands.",
    source_refs: [
      "prompt/shared_operating_contract_106_to_115.md",
      "prompt/110.md",
      "prompt/111.md",
    ],
  },
] as const satisfies readonly PrerequisiteGapRecord[];

export const ACCESSIBILITY_HARNESS_GAP_RESOLUTIONS = [
  {
    gapId: "GAP_RESOLUTION_KEYBOARD_MODEL_GRID_PROVISIONAL_V1",
    classification: "gap_resolution",
    statement:
      "Operations and support matrix flows still need route-level evidence for the full roving-grid contract, so the shared harness marks them provisional instead of inventing exactness.",
    implementedRule:
      "Grid routes publish the shared key model and remain visible, but verification state stays provisional and parity may downgrade to table-first proof.",
    source_refs: [
      "prompt/111.md#Gap_handling_you_must_perform_during_this_task",
      "blueprint/accessibility-and-content-system-contract.md#KeyboardInteractionContract",
    ],
  },
  {
    gapId: "GAP_RESOLUTION_KEYBOARD_MODEL_TABS_RESTORE_PROVISIONAL_V1",
    classification: "gap_resolution",
    statement:
      "Tabs that also own thread restore need a stricter shared restore law than the blueprint spells out in copy-only terms.",
    implementedRule:
      "Tab routes publish restore and activation keys now, but remain provisional until later route tracks attach live thread and governance evidence.",
    source_refs: [
      "prompt/111.md#Gap_handling_you_must_perform_during_this_task",
      "blueprint/platform-frontend-blueprint.md#SelectedAnchorPolicy",
    ],
  },
  {
    gapId: "GAP_RESOLUTION_ANNOUNCEMENT_COPY_RECOVERY_SEMANTICS_V1",
    classification: "gap_resolution",
    statement:
      "Recovery wording is under-specified for embedded and replay cases, so the harness preserves authority class and suppresses decorative shell narration.",
    implementedRule:
      "Announcement truth distinguishes local acknowledgement, pending, stale, recovery, and authoritative settlement first; copy stays calm and bounded.",
    source_refs: [
      "prompt/111.md#Gap_handling_you_must_perform_during_this_task",
      "blueprint/accessibility-and-content-system-contract.md#AssistiveAnnouncementTruthProjection",
    ],
  },
  {
    gapId: "GAP_VISUALIZATION_PARITY_OPERATIONS_TABLE_ONLY_V1",
    classification: "gap_resolution",
    statement:
      "Operations chart surfaces cannot claim meaning beyond the fallback table and summary while matrix parity is still provisional.",
    implementedRule:
      "When visual meaning is stale, the harness downgrades to table-only inside the same shell and records the downgrade as an explicit parity state.",
    source_refs: [
      "prompt/111.md#Gap_handling_you_must_perform_during_this_task",
      "blueprint/accessibility-and-content-system-contract.md#VisualizationParityProjection",
    ],
  },
  {
    gapId: "GAP_VISUALIZATION_PARITY_SUPPORT_PLACEHOLDER_V1",
    classification: "gap_resolution",
    statement:
      "Support replay visuals may not always have a stable fallback table during blocked recovery.",
    implementedRule:
      "When neither visual nor table can prove the tuple, the shell retreats to summary-only posture rather than inventing a pseudo-chart.",
    source_refs: [
      "prompt/111.md#Gap_handling_you_must_perform_during_this_task",
      "blueprint/accessibility-and-content-system-contract.md#VisualizationFallbackContract",
    ],
  },
] as const satisfies readonly GapResolutionRecord[];

export const ACCESSIBILITY_HARNESS_FOLLOW_ON_DEPENDENCIES = [
  {
    dependencyId: "FOLLOW_ON_DEPENDENCY_ACCESSIBILITY_POSTURE_REBIND_V1",
    classification: "follow_on_dependency",
    ownerTaskRange: "par_110",
    statement:
      "Rebind the harness posture labels and examples to the shared par_110 surface once the canonical empty, stale, blocked, and recovery frames publish.",
    safeFallback:
      "Current harness posture descriptors remain bounded and fail closed without changing focus or announcement law.",
    source_refs: ["prompt/110.md", "prompt/111.md"],
  },
  {
    dependencyId: "FOLLOW_ON_DEPENDENCY_ACCESSIBILITY_LIVE_ROUTE_BINDINGS_V1",
    classification: "follow_on_dependency",
    ownerTaskRange: "par_112-par_115",
    statement:
      "Attach live route guards, runtime bindings, automation vocabulary, and patient-shell seed routes to the shared harness scenarios.",
    safeFallback:
      "The route family matrices, scenario pack, and browser checks stay stable and can be consumed directly by later route tasks.",
    source_refs: ["prompt/112.md", "prompt/114.md", "prompt/115.md"],
  },
] as const satisfies readonly FollowOnDependencyRecord[];

const RAW_ANNOUNCEMENT_INPUTS: readonly AssistiveAnnouncementInput[] = [
  {
    announcementId: "ANN_PATIENT_REQUEST_LOCAL_ACK_V1",
    scenarioId: "SCN_PATIENT_REQUEST_BUFFERED_PRESERVE",
    routeFamilyRef: "rf_patient_requests",
    trigger: "buffered_update",
    scopeRef: "request_settlement",
    causalTuple: "request-42::local_ack",
    authority: "local_ack",
    intent: "queued",
    politeness: "polite",
    text: "Request saved locally. Waiting for queue confirmation.",
    sequence: 1,
  },
  {
    announcementId: "ANN_PATIENT_REQUEST_PENDING_V1",
    scenarioId: "SCN_PATIENT_REQUEST_BUFFERED_PRESERVE",
    routeFamilyRef: "rf_patient_requests",
    trigger: "buffered_update",
    scopeRef: "request_settlement",
    causalTuple: "request-42::pending",
    authority: "pending",
    intent: "pending",
    politeness: "polite",
    text: "Request queued for confirmation.",
    sequence: 2,
  },
  {
    announcementId: "ANN_PATIENT_REQUEST_SETTLED_V1",
    scenarioId: "SCN_PATIENT_REQUEST_BUFFERED_PRESERVE",
    routeFamilyRef: "rf_patient_requests",
    trigger: "restore",
    scopeRef: "request_settlement",
    causalTuple: "request-42::settled",
    authority: "authoritative_settlement",
    intent: "settled",
    politeness: "polite",
    text: "Request confirmed and reflected in the queue.",
    sequence: 3,
  },
  {
    announcementId: "ANN_STAFF_RESTORE_CHROME_V1",
    scenarioId: "SCN_STAFF_WORKSPACE_RESTORE",
    routeFamilyRef: "rf_staff_workspace",
    trigger: "restore",
    scopeRef: "shell_restore",
    causalTuple: "workspace-9::chrome_restore",
    authority: "chrome_restore",
    intent: "restore",
    politeness: "polite",
    text: "Workspace restored.",
    sequence: 4,
  },
  {
    announcementId: "ANN_STAFF_RESTORE_SELECTED_V1",
    scenarioId: "SCN_STAFF_WORKSPACE_RESTORE",
    routeFamilyRef: "rf_staff_workspace",
    trigger: "restore",
    scopeRef: "selected_anchor_restore",
    causalTuple: "workspace-9::selected_anchor_restore",
    authority: "local_ack",
    intent: "restore",
    politeness: "polite",
    text: "Returned to the selected task summary.",
    sequence: 5,
  },
  {
    announcementId: "ANN_PATIENT_THREAD_PENDING_V1",
    scenarioId: "SCN_PATIENT_MESSAGES_THREAD_RESTORE",
    routeFamilyRef: "rf_patient_messages",
    trigger: "buffered_update",
    scopeRef: "thread_state",
    causalTuple: "thread-8::pending",
    authority: "pending",
    intent: "pending",
    politeness: "polite",
    text: "Reply waiting for delivery confirmation.",
    sequence: 6,
  },
  {
    announcementId: "ANN_PATIENT_THREAD_PENDING_DUP_V1",
    scenarioId: "SCN_PATIENT_MESSAGES_THREAD_RESTORE",
    routeFamilyRef: "rf_patient_messages",
    trigger: "buffered_update",
    scopeRef: "thread_state",
    causalTuple: "thread-8::pending",
    authority: "pending",
    intent: "pending",
    politeness: "polite",
    text: "Reply waiting for delivery confirmation.",
    sequence: 7,
  },
  {
    announcementId: "ANN_PATIENT_THREAD_SETTLED_V1",
    scenarioId: "SCN_PATIENT_MESSAGES_THREAD_RESTORE",
    routeFamilyRef: "rf_patient_messages",
    trigger: "restore",
    scopeRef: "thread_state",
    causalTuple: "thread-8::settled",
    authority: "authoritative_settlement",
    intent: "settled",
    politeness: "polite",
    text: "Reply delivered and visible in the thread.",
    sequence: 8,
  },
  {
    announcementId: "ANN_OPERATIONS_PARITY_STALE_V1",
    scenarioId: "SCN_OPERATIONS_PARITY_DOWNGRADE",
    routeFamilyRef: "rf_operations_board",
    trigger: "buffered_update",
    scopeRef: "visualization_parity",
    causalTuple: "ops-board::parity_stale",
    authority: "stale",
    intent: "stale",
    politeness: "assertive",
    text: "Chart parity stale. Table becomes the authoritative view.",
    sequence: 9,
  },
  {
    announcementId: "ANN_OPERATIONS_PARITY_TABLE_ONLY_V1",
    scenarioId: "SCN_OPERATIONS_PARITY_DOWNGRADE",
    routeFamilyRef: "rf_operations_board",
    trigger: "invalidation",
    scopeRef: "visualization_parity",
    causalTuple: "ops-board::table_only",
    authority: "recovery",
    intent: "recovery",
    politeness: "assertive",
    text: "Visual withdrawn. Guardrail table and summary remain available.",
    sequence: 10,
  },
  {
    announcementId: "ANN_GOVERNANCE_RECOVERY_REQUIRED_V1",
    scenarioId: "SCN_GOVERNANCE_RECOVERY_INVALIDATION",
    routeFamilyRef: "rf_governance_shell",
    trigger: "invalidation",
    scopeRef: "governance_recovery",
    causalTuple: "gov-shell::recovery_required",
    authority: "recovery",
    intent: "recovery",
    politeness: "assertive",
    text: "Approval evidence changed. Focus moved to the summary rail.",
    sequence: 11,
  },
  {
    announcementId: "ANN_GOVERNANCE_RECOVERY_SETTLED_V1",
    scenarioId: "SCN_GOVERNANCE_RECOVERY_INVALIDATION",
    routeFamilyRef: "rf_governance_shell",
    trigger: "recovery_return",
    scopeRef: "governance_recovery",
    causalTuple: "gov-shell::recovery_settled",
    authority: "authoritative_settlement",
    intent: "settled",
    politeness: "polite",
    text: "Evidence tuple settled. Returned to the approval summary.",
    sequence: 12,
  },
  {
    announcementId: "ANN_SUPPORT_BLOCKED_RECOVERY_V1",
    scenarioId: "SCN_SUPPORT_BLOCKED_RECOVERY",
    routeFamilyRef: "rf_support_replay_observe",
    trigger: "invalidation",
    scopeRef: "support_recovery",
    causalTuple: "support-replay::blocked",
    authority: "recovery",
    intent: "recovery",
    politeness: "assertive",
    text: "Replay evidence incomplete. Summary-only posture active.",
    sequence: 13,
  },
  {
    announcementId: "ANN_SUPPORT_BLOCKED_RECOVERY_DUP_V1",
    scenarioId: "SCN_SUPPORT_BLOCKED_RECOVERY",
    routeFamilyRef: "rf_support_replay_observe",
    trigger: "invalidation",
    scopeRef: "support_recovery",
    causalTuple: "support-replay::blocked",
    authority: "recovery",
    intent: "recovery",
    politeness: "assertive",
    text: "Replay evidence incomplete. Summary-only posture active.",
    sequence: 14,
  },
] as const;

const ANNOUNCEMENT_AUTHORITY_RANK: Record<AnnouncementAuthority, number> = {
  chrome_restore: 0,
  local_ack: 1,
  pending: 2,
  stale: 3,
  recovery: 4,
  authoritative_settlement: 5,
};

const FOCUS_TRIGGER_ORDER = [
  "same_shell_refresh",
  "buffered_update",
  "mission_stack_fold",
  "mission_stack_unfold",
  "restore",
  "invalidation",
  "recovery_return",
] as const satisfies readonly FocusTrigger[];

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

function shortHash(value: string): string {
  return deterministicHashHex(value).slice(0, 16);
}

function routeToken(routeFamilyRef: string): string {
  return routeFamilyRef.replace(/^rf_/, "").toUpperCase();
}

function focusSlug(routeFamilyRef: string): string {
  return routeFamilyRef.replace(/^rf_/, "");
}

function buildFocusTargets(spec: RouteHarnessSpec): readonly FocusTargetDescriptor[] {
  const slug = focusSlug(spec.routeFamilyRef);
  return [
    {
      focusTargetRef: `focus.current.${slug}`,
      domMarkerRef: `${slug}-current`,
      label: spec.currentFocusLabel,
      role: spec.keyboardModel === "grid" ? "row" : spec.keyboardModel === "tabs" ? "tab" : "button",
    },
    {
      focusTargetRef: `focus.selected_anchor.${slug}`,
      domMarkerRef: `${slug}-selected-anchor`,
      label: spec.selectedAnchorLabel,
      role: "summary",
    },
    {
      focusTargetRef: `focus.summary.${slug}`,
      domMarkerRef: `${slug}-summary`,
      label: spec.summaryLabel,
      role: "summary",
    },
    {
      focusTargetRef: `focus.stub.${slug}`,
      domMarkerRef: `${slug}-recovery-stub`,
      label: spec.recoveryLabel,
      role: "status",
    },
  ];
}

function getAccessibilityProfile(routeFamilyRef: string): AccessibilitySemanticCoverageProfile {
  const profile = uiContractAccessibilityArtifact.accessibilitySemanticCoverageProfiles.find(
    (entry) => entry.routeFamilyRef === routeFamilyRef,
  );
  if (!profile) {
    throw new Error(`Missing accessibility profile for ${routeFamilyRef}.`);
  }
  return profile;
}

function buildRouteProfile(spec: RouteHarnessSpec): AccessibilityHarnessRouteProfile {
  const accessibility = getAccessibilityProfile(spec.routeFamilyRef);
  const focusTargets = buildFocusTargets(spec);
  return {
    routeFamilyRef: spec.routeFamilyRef,
    shellType: accessibility.shellType,
    audienceTier: accessibility.audienceTier,
    coverageState: accessibility.coverageState,
    keyboardModel: spec.keyboardModel,
    focusTransitionScope: spec.focusTransitionScope,
    verificationState: spec.verificationState,
    landmarkRefs: spec.landmarkRefs,
    headingOrder: spec.headingOrder,
    focusTargets,
    currentFocusTargetRef: focusTargets[0]?.focusTargetRef ?? "",
    previousFocusTargetRef: focusTargets[1]?.focusTargetRef ?? "",
    selectedAnchorTargetRef: focusTargets[1]?.focusTargetRef ?? "",
    summaryTargetRef: focusTargets[2]?.focusTargetRef ?? "",
    recoveryStubTargetRef: focusTargets[3]?.focusTargetRef ?? "",
    keyboardGapResolutionRef: spec.keyboardGapResolutionRef ?? null,
    announcementGapResolutionRef: spec.announcementGapResolutionRef ?? null,
    visualizationGapResolutionRef: spec.visualizationGapResolutionRef ?? null,
    automationAnchorMapRef: accessibility.automationAnchorMapRef,
    designContractPublicationBundleRef: accessibility.designContractPublicationBundleRef,
    reducedMotionEquivalenceRef: accessibility.reducedMotionEquivalenceRef,
    requiredBreakpointClassRefs: accessibility.requiredBreakpointClassRefs,
    coverageTupleHash: accessibility.coverageTupleHash,
  };
}

export function resolveFocusTransition(input: {
  trigger: FocusTrigger;
  focusTransitionScope: FocusTransitionScope;
  currentTargetRef: string;
  previousTargetRef: string;
  selectedAnchorTargetRef: string;
  summaryTargetRef: string;
  recoveryStubTargetRef: string;
}): FocusTransitionDecision {
  const preserveTriggers = new Set<FocusTrigger>([
    "same_shell_refresh",
    "buffered_update",
    "mission_stack_fold",
    "mission_stack_unfold",
  ]);

  if (preserveTriggers.has(input.trigger)) {
    return {
      disposition: "preserve",
      nextTargetRef: input.currentTargetRef,
      explanation: "Same-shell changes preserve the active focus target.",
    };
  }

  if (input.trigger === "restore") {
    if (input.focusTransitionScope === "surface_root") {
      return {
        disposition: "restore_previous",
        nextTargetRef: input.previousTargetRef || input.currentTargetRef,
        explanation: "Restore returns focus to the last meaningful in-shell target.",
      };
    }
    return {
      disposition: "restore_previous",
      nextTargetRef: input.previousTargetRef || input.selectedAnchorTargetRef,
      explanation: "Restore returns focus to the selected anchor or prior thread target.",
    };
  }

  if (input.trigger === "invalidation") {
    if (input.focusTransitionScope === "same_shell_recovery") {
      return {
        disposition: "move_recovery_stub",
        nextTargetRef: input.recoveryStubTargetRef,
        explanation: "Invalidation moves focus to the bounded recovery stub.",
      };
    }
    if (
      input.focusTransitionScope === "selected_anchor_preserve" ||
      input.focusTransitionScope === "detail_child_return" ||
      input.focusTransitionScope === "thread_focus_restore"
    ) {
      return {
        disposition: "move_selected_anchor",
        nextTargetRef: input.selectedAnchorTargetRef,
        explanation: "Invalidation retreats to the selected anchor instead of stealing shell focus.",
      };
    }
    return {
      disposition: "move_summary",
      nextTargetRef: input.summaryTargetRef,
      explanation: "Surface-root invalidation moves focus to the verified summary.",
    };
  }

  if (input.previousTargetRef) {
    return {
      disposition: "restore_previous",
      nextTargetRef: input.previousTargetRef,
      explanation: "Recovery returns focus to the prior meaningful target when it is still valid.",
    };
  }

  if (input.focusTransitionScope === "same_shell_recovery") {
    return {
      disposition: "move_selected_anchor",
      nextTargetRef: input.selectedAnchorTargetRef,
      explanation: "Recovery settles on the selected anchor when the prior target is unavailable.",
    };
  }

  return {
    disposition: "move_summary",
    nextTargetRef: input.summaryTargetRef,
    explanation: "Recovery settles on the summary when no prior focus target is admissible.",
  };
}

export function verifyKeyboardInteraction(
  contract: Pick<
    KeyboardInteractionContractRow,
    "traversalKeyRefs" | "activationKeyRefs" | "dismissalKeyRefs" | "optionalKeyRefs"
  >,
  keySequence: readonly string[],
): KeyboardVerificationResult {
  const allowedKeys = new Set([
    ...contract.traversalKeyRefs,
    ...contract.activationKeyRefs,
    ...contract.dismissalKeyRefs,
    ...contract.optionalKeyRefs,
  ]);
  const invalidKeys = keySequence.filter((key) => !allowedKeys.has(key));
  const missingTraversalKey = !keySequence.some((key) =>
    contract.traversalKeyRefs.includes(key),
  );
  const missingActivationKey =
    contract.activationKeyRefs.length > 0 &&
    !keySequence.some((key) => contract.activationKeyRefs.includes(key));
  return {
    valid: invalidKeys.length === 0 && !missingTraversalKey && !missingActivationKey,
    invalidKeys,
    missingTraversalKey,
    missingActivationKey,
  };
}

export function evaluateVisualizationParity(
  input: VisualizationParityInput,
): VisualizationParityDecision {
  if (
    input.visualMeaningState === "verified" &&
    input.tableAvailable &&
    input.summaryAvailable
  ) {
    return {
      parityState: "visual_table_summary",
      explanation: input.fallbackReason,
      authorityTarget: "visual",
    };
  }
  if (input.tableAvailable && input.summaryAvailable) {
    return {
      parityState: "table_only",
      explanation: input.fallbackReason,
      authorityTarget: "table",
    };
  }
  if (input.summaryAvailable) {
    return {
      parityState: "summary_only",
      explanation: input.fallbackReason,
      authorityTarget: "summary",
    };
  }
  return {
    parityState: "placeholder",
    explanation: input.fallbackReason,
    authorityTarget: "placeholder",
  };
}

export function arbitrateAssistiveAnnouncements(
  inputs: readonly AssistiveAnnouncementInput[],
): readonly AssistiveAnnouncementExample[] {
  const sorted = [...inputs].sort((left, right) => left.sequence - right.sequence);
  const dedupeSet = new Set<string>();
  const activeByScope = new Map<string, AssistiveAnnouncementExample>();
  const processed: AssistiveAnnouncementExample[] = [];

  for (const input of sorted) {
    if (input.authority === "chrome_restore") {
      processed.push({ ...input, status: "suppressed" });
      continue;
    }

    if (dedupeSet.has(input.causalTuple)) {
      processed.push({ ...input, status: "deduplicated" });
      continue;
    }
    dedupeSet.add(input.causalTuple);

    const current = activeByScope.get(input.scopeRef);
    const nextExample: AssistiveAnnouncementExample = { ...input, status: "current" };
    if (
      current &&
      ANNOUNCEMENT_AUTHORITY_RANK[input.authority] >=
        ANNOUNCEMENT_AUTHORITY_RANK[current.authority]
    ) {
      current.status = "superseded";
      activeByScope.set(input.scopeRef, nextExample);
      processed.push(nextExample);
      continue;
    }

    if (current) {
      processed.push({ ...input, status: "superseded" });
      continue;
    }

    activeByScope.set(input.scopeRef, nextExample);
    processed.push(nextExample);
  }

  return processed;
}

function buildFocusTransitionRows(
  routeProfiles: readonly AccessibilityHarnessRouteProfile[],
): readonly FocusTransitionContractRow[] {
  return routeProfiles.flatMap((profile) =>
    FOCUS_TRIGGER_ORDER.map((trigger) => {
      const decision = resolveFocusTransition({
        trigger,
        focusTransitionScope: profile.focusTransitionScope,
        currentTargetRef: profile.currentFocusTargetRef,
        previousTargetRef: profile.previousFocusTargetRef,
        selectedAnchorTargetRef: profile.selectedAnchorTargetRef,
        summaryTargetRef: profile.summaryTargetRef,
        recoveryStubTargetRef: profile.recoveryStubTargetRef,
      });
      const triggerToken = trigger.toUpperCase();
      return {
        contractId: `FTC_111_${routeToken(profile.routeFamilyRef)}_${triggerToken}_V1`,
        routeFamilyRef: profile.routeFamilyRef,
        keyboardModel: profile.keyboardModel,
        focusTransitionScope: profile.focusTransitionScope,
        trigger,
        currentTargetRef: profile.currentFocusTargetRef,
        previousTargetRef: profile.previousFocusTargetRef,
        nextTargetRef: decision.nextTargetRef,
        disposition: decision.disposition,
        contractState: profile.verificationState,
        motionEquivalenceRef: profile.reducedMotionEquivalenceRef,
        zoomReflowRef: "zoom.400_equivalent_reflow",
        rationale: decision.explanation,
        domMarkerRef:
          profile.focusTargets.find((entry) => entry.focusTargetRef === decision.nextTargetRef)
            ?.domMarkerRef ?? "",
        designContractPublicationBundleRef: profile.designContractPublicationBundleRef,
        coverageState: profile.coverageState,
        source_refs: ACCESSIBILITY_HARNESS_SOURCE_PRECEDENCE,
      };
    }),
  );
}

function buildKeyboardInteractionRows(
  routeProfiles: readonly AccessibilityHarnessRouteProfile[],
): readonly KeyboardInteractionContractRow[] {
  return routeProfiles.map((profile) => {
    const rule = KEYBOARD_RULES[profile.keyboardModel];
    return {
      contractId: `KIC_111_${routeToken(profile.routeFamilyRef)}_PRIMARY_V1`,
      routeFamilyRef: profile.routeFamilyRef,
      keyboardModel: profile.keyboardModel,
      focusTransitionScope: profile.focusTransitionScope,
      traversalKeyRefs: rule.traversalKeyRefs,
      activationKeyRefs: rule.activationKeyRefs,
      dismissalKeyRefs: rule.dismissalKeyRefs,
      optionalKeyRefs: rule.optionalKeyRefs,
      landmarkRefs: profile.landmarkRefs,
      verificationNarrative: rule.narrative,
      contractState: profile.verificationState,
      gapResolutionRef: profile.keyboardGapResolutionRef,
      designContractPublicationBundleRef: profile.designContractPublicationBundleRef,
      coverageState: profile.coverageState,
      source_refs: ACCESSIBILITY_HARNESS_SOURCE_PRECEDENCE,
    };
  });
}

function buildScenarios(
  routeProfiles: readonly AccessibilityHarnessRouteProfile[],
  announcementExamples: readonly AssistiveAnnouncementExample[],
): readonly AccessibilityHarnessScenario[] {
  const profileMap = new Map(routeProfiles.map((profile) => [profile.routeFamilyRef, profile]));
  return SCENARIO_SEEDS.map((seed) => {
    const routeProfile = profileMap.get(seed.routeFamilyRef);
    if (!routeProfile) {
      throw new Error(`Missing route profile for scenario ${seed.scenarioId}.`);
    }
    const parity = evaluateVisualizationParity(seed.parityInput);
    const parityFallback = evaluateVisualizationParity(seed.parityFallbackInput);
    const scenarioAnnouncementRefs = announcementExamples
      .filter((example) => example.scenarioId === seed.scenarioId)
      .map((example) => example.announcementId);
    const gapResolutionRefs = [
      routeProfile.keyboardGapResolutionRef,
      routeProfile.announcementGapResolutionRef,
      routeProfile.visualizationGapResolutionRef,
    ].filter((value): value is string => Boolean(value));
    return {
      scenarioId: seed.scenarioId,
      routeFamilyRef: seed.routeFamilyRef,
      label: seed.label,
      audienceLabel: seed.audienceLabel,
      description: seed.description,
      keyboardModel: routeProfile.keyboardModel,
      focusTransitionScope: routeProfile.focusTransitionScope,
      landmarkRefs: routeProfile.landmarkRefs,
      headingOrder: routeProfile.headingOrder,
      focusTargets: routeProfile.focusTargets,
      currentFocusTargetRef: routeProfile.currentFocusTargetRef,
      previousFocusTargetRef: routeProfile.previousFocusTargetRef,
      selectedAnchorTargetRef: routeProfile.selectedAnchorTargetRef,
      primaryTriggerRefs: seed.primaryTriggerRefs,
      parityState: parity.parityState,
      parityFallbackState: parityFallback.parityState,
      summarySentence: seed.summarySentence,
      chartLabel: seed.chartLabel,
      tableLabel: seed.tableLabel,
      visualizationRows: seed.visualizationRows,
      announcementExampleRefs: scenarioAnnouncementRefs,
      gapResolutionRefs,
    };
  });
}

export function buildAccessibilityHarnessArtifacts(): AccessibilityHarnessArtifacts {
  const generatedAt = new Date().toISOString();
  const routeProfiles = ROUTE_HARNESS_SPECS.map(buildRouteProfile);
  const keyboardRows = buildKeyboardInteractionRows(routeProfiles);
  const focusTransitionRows = buildFocusTransitionRows(routeProfiles);
  const announcementExamples = arbitrateAssistiveAnnouncements(RAW_ANNOUNCEMENT_INPUTS);
  const scenarios = buildScenarios(routeProfiles, announcementExamples);

  const announcementArtifact: AssistiveAnnouncementExampleArtifact = {
    task_id: ACCESSIBILITY_HARNESS_TASK_ID,
    visual_mode: ACCESSIBILITY_HARNESS_VISUAL_MODE,
    generated_at: generatedAt,
    captured_on: generatedAt.slice(0, 10),
    summary: {
      example_count: announcementExamples.length,
      current_count: announcementExamples.filter((example) => example.status === "current")
        .length,
      suppressed_count: announcementExamples.filter((example) => example.status === "suppressed")
        .length,
      deduplicated_count: announcementExamples.filter(
        (example) => example.status === "deduplicated",
      ).length,
      superseded_count: announcementExamples.filter((example) => example.status === "superseded")
        .length,
    },
    assistiveAnnouncementExamples: announcementExamples,
    source_precedence: ACCESSIBILITY_HARNESS_SOURCE_PRECEDENCE,
    gap_resolutions: ACCESSIBILITY_HARNESS_GAP_RESOLUTIONS,
  };

  const accessibilityExtension: AccessibilityCoverageHarnessExtension = {
    task_id: uiContractAccessibilityArtifact.task_id,
    generated_at: generatedAt,
    captured_on: generatedAt.slice(0, 10),
    summary: uiContractAccessibilityArtifact.summary,
    accessibilitySemanticCoverageProfiles:
      uiContractAccessibilityArtifact.accessibilitySemanticCoverageProfiles,
    harness_task_id: ACCESSIBILITY_HARNESS_TASK_ID,
    harness_visual_mode: ACCESSIBILITY_HARNESS_VISUAL_MODE,
    harness_summary: {
      route_profile_count: routeProfiles.length,
      scenario_count: scenarios.length,
      focus_transition_contract_count: focusTransitionRows.length,
      keyboard_interaction_contract_count: keyboardRows.length,
      exact_keyboard_contract_count: keyboardRows.filter(
        (row) => row.contractState === "exact",
      ).length,
      provisional_keyboard_contract_count: keyboardRows.filter(
        (row) => row.contractState === "provisional",
      ).length,
      blocked_keyboard_contract_count: keyboardRows.filter(
        (row) => row.contractState === "blocked",
      ).length,
      announcement_example_count: announcementExamples.length,
    },
    focusTransitionContracts: focusTransitionRows,
    keyboardInteractionContracts: keyboardRows,
    harnessScenarios: scenarios,
    prerequisite_gaps: ACCESSIBILITY_HARNESS_PREREQUISITE_GAPS,
    gap_resolutions: ACCESSIBILITY_HARNESS_GAP_RESOLUTIONS,
    follow_on_dependencies: ACCESSIBILITY_HARNESS_FOLLOW_ON_DEPENDENCIES,
    source_precedence: ACCESSIBILITY_HARNESS_SOURCE_PRECEDENCE,
    assistiveAnnouncementExamplesRef: ASSISTIVE_ANNOUNCEMENT_EXAMPLES_PATH,
  };

  return {
    accessibilityExtension,
    focusTransitionRows,
    keyboardRows,
    announcementArtifact,
    scenarios,
  };
}

export const accessibilityHarnessRouteProfiles = ROUTE_HARNESS_SPECS.map(buildRouteProfile);
export const accessibilityHarnessArtifacts = buildAccessibilityHarnessArtifacts();
export const accessibilityHarnessPublication =
  accessibilityHarnessArtifacts.accessibilityExtension;
export const focusTransitionContractRows = accessibilityHarnessArtifacts.focusTransitionRows;
export const keyboardInteractionContractRows = accessibilityHarnessArtifacts.keyboardRows;
export const assistiveAnnouncementExampleArtifact =
  accessibilityHarnessArtifacts.announcementArtifact;
export const accessibilityHarnessScenarios = accessibilityHarnessArtifacts.scenarios;
export const accessibilityHarnessCatalog = {
  taskId: ACCESSIBILITY_HARNESS_TASK_ID,
  routeProfileCount: accessibilityHarnessRouteProfiles.length,
  scenarioCount: accessibilityHarnessScenarios.length,
  focusTransitionContractCount: focusTransitionContractRows.length,
  keyboardInteractionContractCount: keyboardInteractionContractRows.length,
  exactKeyboardContractCount: keyboardInteractionContractRows.filter(
    (row) => row.contractState === "exact",
  ).length,
  provisionalKeyboardContractCount: keyboardInteractionContractRows.filter(
    (row) => row.contractState === "provisional",
  ).length,
  blockedKeyboardContractCount: keyboardInteractionContractRows.filter(
    (row) => row.contractState === "blocked",
  ).length,
  announcementExampleCount:
    assistiveAnnouncementExampleArtifact.assistiveAnnouncementExamples.length,
  bundleDigestRef: shortHash(
    JSON.stringify({
      focusTransitionContractCount: focusTransitionContractRows.length,
      keyboardInteractionContractCount: keyboardInteractionContractRows.length,
      scenarioCount: accessibilityHarnessScenarios.length,
    }),
  ),
} as const;
