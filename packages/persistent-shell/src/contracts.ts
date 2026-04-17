import {
  getShellContract,
  shellSurfaceContracts,
  type ShellSlug,
  type ShellSurfaceContract,
} from "../../api-contracts/src/shell-contracts";
import { createShellSignal, type ShellTelemetrySnapshot } from "@vecells/observability";
import {
  createBrowserRuntimeTelemetryEvent,
  foundationReleasePosture,
  resolveBrowserRuntimeDecision,
  type BrowserRecoveryPostureContract,
  type BrowserRuntimeObservationInput,
  type ReleasePosture,
} from "@vecells/release-controls";
import { profileSelectionResolutions } from "../../design-system/src/token-foundation";

export const PERSISTENT_SHELL_TASK_ID = "par_106";
export const PERSISTENT_SHELL_VISUAL_MODE = "Persistent_Shell_Framework";

export type PersistentShellFamily =
  | "patient"
  | "staff"
  | "operations"
  | "hub"
  | "governance"
  | "pharmacy"
  | "support";
export type PersistentShellTopology =
  | "focus_frame"
  | "two_plane"
  | "three_plane"
  | "mission_stack";
export type RouteResidencyState =
  | "resident_root"
  | "same_shell_child"
  | "same_shell_object_switch"
  | "bounded_stage";
export type ContinuityTransitionState =
  | "reuse"
  | "morph_in_place"
  | "preserve_read_only"
  | "recover_in_place"
  | "replace_shell";
export type ShellBoundaryState =
  | "reuse_shell"
  | "morph_child_surface"
  | "preserve_shell_read_only"
  | "recover_in_place"
  | "replace_shell";
export type BreakpointClass = "compact" | "narrow" | "medium" | "expanded" | "wide";
export type RuntimeScenario =
  | "live"
  | "stale_review"
  | "read_only"
  | "recovery_only"
  | "blocked";
export type AccentTone =
  | "accent_active"
  | "accent_review"
  | "accent_insight"
  | "accent_success"
  | "accent_danger";

export interface ShellSlotContent {
  title: string;
  summary: string;
  detail: string;
}

export interface PersistentShellRouteClaim {
  routeFamilyRef: string;
  shellSlug: ShellSlug;
  shellFamily: PersistentShellFamily;
  title: string;
  section: string;
  residency: RouteResidencyState;
  continuityKey: string;
  entityKeyRef: string;
  defaultAnchor: string;
  anchors: readonly string[];
  dominantActionLabel: string;
  trustCue: string;
  routeSummary: string;
  topologyHint?: PersistentShellTopology;
  supportSlot?: ShellSlotContent;
  casePulse: ShellSlotContent;
  decisionDock: ShellSlotContent;
  primaryRegion: ShellSlotContent;
  sourceRefs: readonly string[];
  gapResolutions?: readonly string[];
  followOnDependencies?: readonly string[];
}

export interface ShellFamilyOwnershipContract {
  shellSlug: ShellSlug;
  shellFamily: PersistentShellFamily;
  audienceSurfaceRef: string;
  ownershipContractId: string;
  continuityKey: string;
  statusStripAuthorityRef: string;
  decisionDockFocusLeaseRef: string;
  quietWorkProtectionLeaseRef: string;
  continuityRestorePlanRef: string;
  missionStackFoldPlanRef: string;
  degradedStateContractRef: string;
  defaultTopology: PersistentShellTopology;
  allowedTopologies: readonly PersistentShellTopology[];
  supportRegionBudget: 0 | 1;
  sourceRefs: readonly string[];
}

export interface PersistentShellSpec {
  shellSlug: ShellSlug;
  shellFamily: PersistentShellFamily;
  displayName: string;
  shellTitle: string;
  shellEyebrow: string;
  shellSummary: string;
  audienceSurfaceRef: string;
  accentTone: AccentTone;
  defaultDensityMode: "relaxed" | "balanced" | "compact";
  defaultMotionMode: "full" | "reduced" | "essential_only";
  defaultTopology: PersistentShellTopology;
  allowedTopologies: readonly PersistentShellTopology[];
  supportRegionBudget: 0 | 1;
  leftPaneLabel: string;
  centerPaneLabel: string;
  rightPaneLabel: string;
  northStarLabel: string;
  navSections: readonly string[];
  ownership: ShellFamilyOwnershipContract;
  routeClaims: readonly PersistentShellRouteClaim[];
  specimenNotes: readonly string[];
  gapResolutions?: readonly string[];
  followOnDependencies?: readonly string[];
  sourceRefs: readonly string[];
}

export interface ContinuityTransitionCheckpoint {
  transitionCheckpointId: string;
  currentShellSlug: ShellSlug;
  currentRouteFamilyRef: string;
  candidateShellSlug: ShellSlug;
  candidateRouteFamilyRef: string;
  transitionState: ContinuityTransitionState;
  routeAdjacencyState: "same_route" | "same_shell_adjacent" | "same_shell_object_switch" | "boundary";
  continuityEvidenceState: "trusted" | "degraded" | "blocked";
  runtimePosture: BrowserRecoveryPostureContract["effectiveBrowserPosture"];
  sourceRefs: readonly string[];
}

export interface ShellBoundaryDecision {
  decisionId: string;
  shellSlug: ShellSlug;
  candidateRouteFamilyRef: string;
  boundaryState: ShellBoundaryState;
  reason: string;
  checkpoint: ContinuityTransitionCheckpoint;
  runtimeDecision: BrowserRecoveryPostureContract;
  telemetryEventId: string;
}

export interface ContinuityCarryForwardPlan {
  planId: string;
  shellSlug: ShellSlug;
  boundaryState: ShellBoundaryState;
  preserveNavigationLedger: boolean;
  preserveStatusStrip: boolean;
  preserveCasePulse: boolean;
  preserveDecisionDock: boolean;
  preserveSelectedAnchor: boolean;
  preservePromotedSupportRegion: boolean;
  preserveMissionStackFoldState: boolean;
  selectedAnchorDisposition: "preserve" | "freeze" | "reset_to_route_default";
  supportRegionDisposition: "preserve" | "freeze" | "replace";
  focusDisposition: "restore_selected_anchor" | "focus_boundary_notice" | "focus_primary_region";
  sourceRefs: readonly string[];
}

export interface ContinuityRestorePlan {
  planId: string;
  shellSlug: ShellSlug;
  restoreStorageKey: string;
  returnRouteFamilyRef: string;
  selectedAnchor: string;
  foldState: "folded" | "expanded";
  runtimeScenario: RuntimeScenario;
  dominantActionLabel: string;
  sourceRefs: readonly string[];
}

export interface PersistentShellProfileResolution {
  shellSlug: ShellSlug;
  shellFamily: PersistentShellFamily;
  breakpointClass: BreakpointClass;
  topology: PersistentShellTopology;
  densityMode: "relaxed" | "balanced" | "compact";
  motionMode: "full" | "reduced" | "essential_only";
  profileSelectionResolutionId: string;
  allowedTopologies: readonly PersistentShellTopology[];
  sourceRefs: readonly string[];
}

export interface PersistentShellRuntimeBinding {
  shellSlug: ShellSlug;
  routeFamilyRef: string;
  runtimeScenario: RuntimeScenario;
  runtimeDecision: BrowserRecoveryPostureContract;
  releasePosture: ReleasePosture;
  telemetry: ShellTelemetrySnapshot;
}

export interface PersistentShellSimulationHarness {
  shell: PersistentShellSpec;
  currentRoute: PersistentShellRouteClaim;
  runtimeScenario: RuntimeScenario;
  transitionTo: (
    routeFamilyRef: string,
    runtimeScenario?: RuntimeScenario,
  ) => {
    route: PersistentShellRouteClaim;
    boundaryDecision: ShellBoundaryDecision;
    carryForwardPlan: ContinuityCarryForwardPlan;
    restorePlan: ContinuityRestorePlan;
  };
}

const SOURCE_PLATFORM_FRONTEND = "blueprint/platform-frontend-blueprint.md";
const SOURCE_PATIENT = "blueprint/patient-portal-experience-architecture-blueprint.md";
const SOURCE_STAFF = "blueprint/staff-workspace-interface-architecture.md";
const SOURCE_STAFF_SUPPORT = "blueprint/staff-operations-and-support-blueprint.md";
const SOURCE_OPERATIONS = "blueprint/operations-console-frontend-blueprint.md";
const SOURCE_HUB = "blueprint/phase-5-the-network-horizon.md";
const SOURCE_GOVERNANCE = "blueprint/governance-admin-console-frontend-blueprint.md";
const SOURCE_PHARMACY = "blueprint/pharmacy-console-frontend-architecture.md";
const SOURCE_TOKENS = "blueprint/design-token-foundation.md";
const SOURCE_QUIET = "blueprint/ux-quiet-clarity-redesign.md";
const SOURCE_KERNEL = "blueprint/canonical-ui-contract-kernel.md";
const SOURCE_FORENSICS = "blueprint/forensic-audit-findings.md";

const routeDefinitions: Record<string, Omit<PersistentShellRouteClaim, "shellSlug" | "shellFamily">> = {
  rf_patient_home: {
    routeFamilyRef: "rf_patient_home",
    title: "Home",
    section: "Home",
    residency: "resident_root",
    continuityKey: "patient.portal.home",
    entityKeyRef: "entity.patient.home",
    defaultAnchor: "home-spotlight",
    anchors: ["home-spotlight", "home-next-step", "home-trust"],
    dominantActionLabel: "Continue the safest next step",
    trustCue: "Home never outruns settlement or degraded posture.",
    routeSummary: "Quiet orientation frame for current patient obligations and trust cues.",
    casePulse: {
      title: "CasePulse",
      summary: "Current patient urgency digest",
      detail: "One dominant question, one trust cue, and one return-safe anchor.",
    },
    decisionDock: {
      title: "DecisionDock",
      summary: "Next safe patient action",
      detail: "The dock keeps action promotion singular and recovery-aware.",
    },
    primaryRegion: {
      title: "Focus frame",
      summary: "Readable center column with one support lane",
      detail: "Calm service posture replaces dashboard sprawl.",
    },
    supportSlot: {
      title: "Support region",
      summary: "Bounded trust and recovery cues",
      detail: "FOLLOW_ON_DEPENDENCY_PATIENT_SUPPORT_REGION routes land here in later tasks.",
    },
    sourceRefs: [SOURCE_PLATFORM_FRONTEND, SOURCE_PATIENT, SOURCE_QUIET, SOURCE_FORENSICS],
    followOnDependencies: [
      "FOLLOW_ON_DEPENDENCY_PATIENT_HOME_SUMMARY_PROJECTIONS",
      "FOLLOW_ON_DEPENDENCY_PATIENT_SUPPORT_REGION",
    ],
  },
  rf_patient_requests: {
    routeFamilyRef: "rf_patient_requests",
    title: "Requests",
    section: "Requests",
    residency: "resident_root",
    continuityKey: "patient.portal.requests",
    entityKeyRef: "entity.patient.request-lineage",
    defaultAnchor: "request-needs-attention",
    anchors: ["request-needs-attention", "request-lineage", "request-history"],
    dominantActionLabel: "Review the next request obligation",
    trustCue: "Lineage stays visible before any downstream child route opens.",
    routeSummary: "Case browser with lineage-first request buckets and governed calm empty state.",
    casePulse: {
      title: "CasePulse",
      summary: "Needs-attention digest",
      detail: "Blocked, in-progress, and complete buckets remain one continuity surface.",
    },
    decisionDock: {
      title: "DecisionDock",
      summary: "Safest next request action",
      detail: "The dock highlights the next patient-owed action without hiding lineage.",
    },
    primaryRegion: {
      title: "Request lane",
      summary: "Bucketed case browser",
      detail: "Adjacent request states morph in place instead of spawning detached pages.",
    },
    supportSlot: {
      title: "Support region",
      summary: "Request trust and history",
      detail: "Later task 115 plugs patient request child content into this governed slot.",
    },
    sourceRefs: [SOURCE_PLATFORM_FRONTEND, SOURCE_PATIENT, SOURCE_QUIET],
    followOnDependencies: ["FOLLOW_ON_DEPENDENCY_PATIENT_REQUEST_CHILD_ROUTES"],
  },
  rf_patient_appointments: {
    routeFamilyRef: "rf_patient_appointments",
    title: "Appointments",
    section: "Appointments",
    residency: "resident_root",
    continuityKey: "patient.portal.appointments",
    entityKeyRef: "entity.patient.appointment",
    defaultAnchor: "appointments-upcoming",
    anchors: ["appointments-upcoming", "appointments-actions", "appointments-history"],
    dominantActionLabel: "Manage the active appointment",
    trustCue: "Booking posture and continuity evidence remain visible inside the shell.",
    routeSummary: "Appointment posture surface with one dominant action and bounded support rail.",
    casePulse: {
      title: "CasePulse",
      summary: "Appointment state ribbon",
      detail: "Upcoming, blocked, and recovery cues stay shell-resident.",
    },
    decisionDock: {
      title: "DecisionDock",
      summary: "Next appointment action",
      detail: "Read-only and recovery fallbacks stay in place when booking evidence drifts.",
    },
    primaryRegion: {
      title: "Appointment focus",
      summary: "Readable manage column",
      detail: "The shell preserves the active appointment anchor across route morphs.",
    },
    supportSlot: {
      title: "Support region",
      summary: "Trust and contingency cues",
      detail: "Booking-specific recovery content arrives in later route work.",
    },
    sourceRefs: [SOURCE_PLATFORM_FRONTEND, SOURCE_PATIENT, SOURCE_FORENSICS],
    followOnDependencies: ["FOLLOW_ON_DEPENDENCY_PATIENT_APPOINTMENT_ROUTES"],
  },
  rf_patient_health_record: {
    routeFamilyRef: "rf_patient_health_record",
    title: "Health record",
    section: "Health record",
    residency: "resident_root",
    continuityKey: "patient.portal.record",
    entityKeyRef: "entity.patient.record",
    defaultAnchor: "record-summary",
    anchors: ["record-summary", "record-latest", "record-follow-up"],
    dominantActionLabel: "Review the latest record update",
    trustCue: "Record continuity and artifact posture remain bound to the same shell.",
    routeSummary: "Record overview frame with summary-first artifact entry and return-safe anchors.",
    casePulse: {
      title: "CasePulse",
      summary: "Clinical update digest",
      detail: "The patient sees one bounded record significance cue at a time.",
    },
    decisionDock: {
      title: "DecisionDock",
      summary: "Next record follow-up",
      detail: "Artifact preview and handoff remain secondary to the shell summary.",
    },
    primaryRegion: {
      title: "Record column",
      summary: "Summary-first document posture",
      detail: "Artifact child routes plug into the same shell continuity envelope.",
    },
    supportSlot: {
      title: "Support region",
      summary: "Record trust and fallback",
      detail: "Artifact preview route families attach here in task 109.",
    },
    sourceRefs: [SOURCE_PLATFORM_FRONTEND, SOURCE_PATIENT],
    followOnDependencies: ["FOLLOW_ON_DEPENDENCY_PATIENT_ARTIFACT_ROUTES"],
  },
  rf_patient_messages: {
    routeFamilyRef: "rf_patient_messages",
    title: "Messages",
    section: "Messages",
    residency: "resident_root",
    continuityKey: "patient.portal.messages",
    entityKeyRef: "entity.patient.thread",
    defaultAnchor: "messages-inbox",
    anchors: ["messages-inbox", "messages-thread", "messages-recovery"],
    dominantActionLabel: "Continue the current message thread",
    trustCue: "Thread recovery and delivery posture stay in the same shell.",
    routeSummary: "Messages entry point with stable inbox anchor and recovery-aware thread continuity.",
    casePulse: {
      title: "CasePulse",
      summary: "Conversation digest",
      detail: "Unread, action-needed, and delivery dispute cues share the shell ribbon.",
    },
    decisionDock: {
      title: "DecisionDock",
      summary: "Reply or recover",
      detail: "The shell can pin a reply anchor or hold read-only recovery in place.",
    },
    primaryRegion: {
      title: "Thread canvas",
      summary: "Message list to thread morph",
      detail: "Adjacent message routes preserve the selected thread anchor.",
    },
    supportSlot: {
      title: "Support region",
      summary: "Delivery and reachability cues",
      detail: "Later messaging route families attach to this same support slot.",
    },
    sourceRefs: [SOURCE_PLATFORM_FRONTEND, SOURCE_PATIENT],
    followOnDependencies: ["FOLLOW_ON_DEPENDENCY_PATIENT_MESSAGING_ROUTES"],
  },
  rf_intake_self_service: {
    routeFamilyRef: "rf_intake_self_service",
    title: "Start request",
    section: "Requests",
    residency: "same_shell_child",
    continuityKey: "patient.portal.requests",
    entityKeyRef: "entity.patient.intake",
    defaultAnchor: "request-start",
    anchors: ["request-start", "request-proof", "request-return"],
    dominantActionLabel: "Continue the active intake step",
    trustCue: "Intake remains a child of the patient shell rather than a detached flow.",
    routeSummary: "Same-shell intake child route with governed return contract to Requests.",
    casePulse: {
      title: "CasePulse",
      summary: "Intake progress",
      detail: "Progress and blockers stay visible in the shared shell strip.",
    },
    decisionDock: {
      title: "DecisionDock",
      summary: "Primary intake step",
      detail: "The dock retains the current intake step and return-safe route target.",
    },
    primaryRegion: {
      title: "Intake stage",
      summary: "Step surface inside the same shell",
      detail: "This child route proves same-shell morph behavior for task 115.",
    },
    sourceRefs: [SOURCE_PLATFORM_FRONTEND, SOURCE_PATIENT],
    followOnDependencies: ["FOLLOW_ON_DEPENDENCY_PATIENT_SEED_ROUTES_TASK_115"],
  },
  rf_intake_telephony_capture: {
    routeFamilyRef: "rf_intake_telephony_capture",
    title: "Phone capture",
    section: "Requests",
    residency: "same_shell_child",
    continuityKey: "patient.portal.requests",
    entityKeyRef: "entity.patient.telephony-capture",
    defaultAnchor: "request-capture",
    anchors: ["request-capture", "request-proof", "request-return"],
    dominantActionLabel: "Resume the assisted capture route",
    trustCue: "Assisted capture stays inside the patient continuity key.",
    routeSummary: "Assisted intake route proving same-shell recovery and return behavior.",
    casePulse: {
      title: "CasePulse",
      summary: "Capture progress",
      detail: "The status strip remains authoritative for partial visibility and drift.",
    },
    decisionDock: {
      title: "DecisionDock",
      summary: "Continue the capture checkpoint",
      detail: "Patient and support actors see one governed step surface, not a second shell.",
    },
    primaryRegion: {
      title: "Capture stage",
      summary: "Assisted patient capture",
      detail: "Later route work plugs into this shell slot without resetting chrome.",
    },
    sourceRefs: [SOURCE_PLATFORM_FRONTEND, SOURCE_PATIENT],
    followOnDependencies: ["FOLLOW_ON_DEPENDENCY_PATIENT_SEED_ROUTES_TASK_115"],
  },
  rf_patient_secure_link_recovery: {
    routeFamilyRef: "rf_patient_secure_link_recovery",
    title: "Recovery",
    section: "Messages",
    residency: "bounded_stage",
    continuityKey: "patient.portal.messages",
    entityKeyRef: "entity.patient.secure-link",
    defaultAnchor: "messages-recovery",
    anchors: ["messages-recovery", "messages-return", "messages-proof"],
    dominantActionLabel: "Repair access and resume the message route",
    trustCue: "Recovery is bounded inside the same shell rather than redirecting away.",
    routeSummary: "Bounded recovery route that preserves shell identity while calming the posture.",
    casePulse: {
      title: "CasePulse",
      summary: "Secure-link recovery",
      detail: "The shell keeps the last safe target visible while access repairs happen.",
    },
    decisionDock: {
      title: "DecisionDock",
      summary: "Resume after recovery",
      detail: "Recovery instructions remain next to the preserved return anchor.",
    },
    primaryRegion: {
      title: "Recovery frame",
      summary: "Same-shell bounded recovery",
      detail: "Finding 120 requires degraded patient routes to stay within the shell.",
    },
    sourceRefs: [SOURCE_PLATFORM_FRONTEND, SOURCE_PATIENT, SOURCE_FORENSICS],
  },
  rf_patient_embedded_channel: {
    routeFamilyRef: "rf_patient_embedded_channel",
    title: "Embedded session",
    section: "Home",
    residency: "bounded_stage",
    continuityKey: "patient.portal.home",
    entityKeyRef: "entity.patient.embedded",
    defaultAnchor: "home-trust",
    anchors: ["home-trust", "embedded-capabilities", "embedded-return"],
    dominantActionLabel: "Continue inside the embedded channel if eligible",
    trustCue: "Embedded capability drift must fail closed inside the same patient shell.",
    routeSummary: "Embedded child route proving channel-aware bounded recovery rather than shell replacement.",
    casePulse: {
      title: "CasePulse",
      summary: "Embedded channel posture",
      detail: "Manifest, trust, and bridge capabilities remain visible and bounded.",
    },
    decisionDock: {
      title: "DecisionDock",
      summary: "Embedded continuation",
      detail: "The dock can demote to safe browser handoff without losing the shell.",
    },
    primaryRegion: {
      title: "Embedded frame",
      summary: "Bounded channel stage",
      detail: "Finding 90 keeps embedded behavior tied to the hardened shell law.",
    },
    sourceRefs: [SOURCE_PLATFORM_FRONTEND, SOURCE_PATIENT, SOURCE_FORENSICS],
  },
  rf_staff_workspace: {
    routeFamilyRef: "rf_staff_workspace",
    title: "Queue",
    section: "Queue",
    residency: "resident_root",
    continuityKey: "staff.workspace.queue",
    entityKeyRef: "entity.staff.queue",
    defaultAnchor: "queue-active-case",
    anchors: ["queue-active-case", "queue-decision", "queue-settlement"],
    dominantActionLabel: "Advance the current case safely",
    trustCue: "Queue, decision, and settlement remain visible inside one workspace shell.",
    routeSummary: "Queue-first clinical workspace with pinned decision dock and balanced calm density.",
    casePulse: {
      title: "CasePulse",
      summary: "Queue continuity",
      detail: "The active reviewer, settlement posture, and queue count stay visible.",
    },
    decisionDock: {
      title: "DecisionDock",
      summary: "Current reviewer action",
      detail: "One dominant action remains visible while evidence and blockers stay adjacent.",
    },
    primaryRegion: {
      title: "Task canvas",
      summary: "Fluid task working region",
      detail: "Workboard, canvas, and dock align under a shared continuity key.",
    },
    supportSlot: {
      title: "Promoted support region",
      summary: "Assistive or evidence side-stage",
      detail: "FOLLOW_ON_DEPENDENCY_STAFF_SUPPORT_REGION routes attach here later.",
    },
    sourceRefs: [SOURCE_PLATFORM_FRONTEND, SOURCE_STAFF, SOURCE_QUIET, SOURCE_FORENSICS],
    followOnDependencies: ["FOLLOW_ON_DEPENDENCY_STAFF_SUPPORT_REGION"],
  },
  rf_staff_workspace_child: {
    routeFamilyRef: "rf_staff_workspace_child",
    title: "Case detail",
    section: "Queue",
    residency: "same_shell_object_switch",
    continuityKey: "staff.workspace.queue",
    entityKeyRef: "entity.staff.case",
    defaultAnchor: "queue-decision",
    anchors: ["queue-decision", "queue-evidence", "queue-settlement"],
    dominantActionLabel: "Resolve the active case in place",
    trustCue: "Same-shell case switches preserve queue continuity and reviewer context.",
    routeSummary: "Adjacent workspace child route used to prove in-place shell morph and focus leases.",
    casePulse: {
      title: "CasePulse",
      summary: "Selected case state",
      detail: "The selected case remains pinned through queue changes and narrow-screen folding.",
    },
    decisionDock: {
      title: "DecisionDock",
      summary: "Dominant case decision",
      detail: "The dock remains sticky through same-shell morphs and read-only drift.",
    },
    primaryRegion: {
      title: "Case canvas",
      summary: "Selected-object workspace",
      detail: "Findings 92 and 93 require shell-local consistency and live focus leases.",
    },
    topologyHint: "three_plane",
    sourceRefs: [SOURCE_PLATFORM_FRONTEND, SOURCE_STAFF, SOURCE_FORENSICS],
  },
  rf_support_ticket_workspace: {
    routeFamilyRef: "rf_support_ticket_workspace",
    title: "Tickets",
    section: "Tickets",
    residency: "resident_root",
    continuityKey: "support.workspace.tickets",
    entityKeyRef: "entity.support.ticket",
    defaultAnchor: "ticket-active",
    anchors: ["ticket-active", "ticket-timeline", "ticket-return"],
    dominantActionLabel: "Continue the active support handoff",
    trustCue: "Replay and return posture remain inside one governed shell.",
    routeSummary: "Support ticket workspace carried forward from the shared support blueprint.",
    casePulse: {
      title: "CasePulse",
      summary: "Ticket continuity",
      detail: "Origin, current owner, and replay-safe return target stay visible.",
    },
    decisionDock: {
      title: "DecisionDock",
      summary: "Active support action",
      detail: "The shell can pin the next safe support move without creating a second product shell.",
    },
    primaryRegion: {
      title: "Ticket board",
      summary: "Timeline-first support workspace",
      detail: "Support remains a shared-shell extension because the repo already ships the app shell.",
    },
    sourceRefs: [SOURCE_PLATFORM_FRONTEND, SOURCE_STAFF_SUPPORT, SOURCE_QUIET],
  },
  rf_support_replay_observe: {
    routeFamilyRef: "rf_support_replay_observe",
    title: "Replay observe",
    section: "Tickets",
    residency: "same_shell_child",
    continuityKey: "support.workspace.tickets",
    entityKeyRef: "entity.support.replay",
    defaultAnchor: "ticket-return",
    anchors: ["ticket-return", "ticket-replay", "ticket-proof"],
    dominantActionLabel: "Observe and return safely",
    trustCue: "Replay may not strand the operator away from the source ticket.",
    routeSummary: "Replay side-stage for support returning to the same shell ledger and anchor.",
    casePulse: {
      title: "CasePulse",
      summary: "Replay posture",
      detail: "The shell keeps the source ticket visible during replay observation.",
    },
    decisionDock: {
      title: "DecisionDock",
      summary: "Return safely",
      detail: "Replay work preserves the original return target rather than browser back guesswork.",
    },
    primaryRegion: {
      title: "Replay stage",
      summary: "Bounded observation route",
      detail: "Later support route tasks can compose into the same shell without rewriting it.",
    },
    sourceRefs: [SOURCE_PLATFORM_FRONTEND, SOURCE_STAFF_SUPPORT],
  },
  rf_operations_board: {
    routeFamilyRef: "rf_operations_board",
    title: "Board",
    section: "Board",
    residency: "resident_root",
    continuityKey: "ops.board",
    entityKeyRef: "entity.ops.board",
    defaultAnchor: "board-watch",
    anchors: ["board-watch", "board-health", "board-intervention"],
    dominantActionLabel: "Intervene through the governed anomaly lane",
    trustCue: "Operations trust, release, and guardrail posture stay visible beside every board action.",
    routeSummary: "Premium diagnostic control room with north-star band and table-first health canvas.",
    casePulse: {
      title: "CasePulse",
      summary: "Operational watch tuple",
      detail: "Watch tuples and intervention severity remain explicit and low-noise.",
    },
    decisionDock: {
      title: "DecisionDock",
      summary: "Governed intervention",
      detail: "The dock stays subordinate to release and trust posture instead of dashboard hype.",
    },
    primaryRegion: {
      title: "Diagnostic canvas",
      summary: "Table-first fleet health board",
      detail: "Finding 96 requires exact guardrail and trust posture in the shell.",
    },
    supportSlot: {
      title: "Promoted support region",
      summary: "Guardrail and evidence lane",
      detail: "Later route work may plug watch or anomaly evidence into this support slot.",
    },
    sourceRefs: [SOURCE_PLATFORM_FRONTEND, SOURCE_OPERATIONS, SOURCE_FORENSICS],
  },
  rf_operations_drilldown: {
    routeFamilyRef: "rf_operations_drilldown",
    title: "Investigation",
    section: "Board",
    residency: "same_shell_object_switch",
    continuityKey: "ops.board",
    entityKeyRef: "entity.ops.investigation",
    defaultAnchor: "board-intervention",
    anchors: ["board-intervention", "board-compare", "board-guardrail"],
    dominantActionLabel: "Continue the governed investigation",
    trustCue: "Investigations stay inside the same operations shell until a hard boundary is explicit.",
    routeSummary: "Adjacent investigation route proving optional three-plane compare without shell reset.",
    casePulse: {
      title: "CasePulse",
      summary: "Investigation state",
      detail: "The current anomaly remains pinned through topology changes and drift.",
    },
    decisionDock: {
      title: "DecisionDock",
      summary: "Investigation action",
      detail: "The dock preserves the governed intervention question across same-shell morphs.",
    },
    primaryRegion: {
      title: "Investigation canvas",
      summary: "Compare-ready anomaly workspace",
      detail: "Three-plane mode is allowed only when compare or blocker review is active.",
    },
    topologyHint: "three_plane",
    sourceRefs: [SOURCE_PLATFORM_FRONTEND, SOURCE_OPERATIONS, SOURCE_QUIET],
  },
  rf_hub_queue: {
    routeFamilyRef: "rf_hub_queue",
    title: "Queue",
    section: "Queue",
    residency: "resident_root",
    continuityKey: "hub.queue",
    entityKeyRef: "entity.hub.queue",
    defaultAnchor: "hub-ranked-option",
    anchors: ["hub-ranked-option", "hub-candidate", "hub-comms"],
    dominantActionLabel: "Pin the next ranked option",
    trustCue: "Selected options stay pinned through queue churn and same-shell moves.",
    routeSummary: "Queue-first hub shell with ranked options and comms/audit rail.",
    casePulse: {
      title: "CasePulse",
      summary: "Queue and handoff posture",
      detail: "Candidate readiness and acknowledgement stay visible at shell level.",
    },
    decisionDock: {
      title: "DecisionDock",
      summary: "Ranked option decision",
      detail: "The dock keeps the chosen candidate pinned as the queue shifts.",
    },
    primaryRegion: {
      title: "Options plane",
      summary: "Ranked candidate center plane",
      detail: "Hub geometry is deliberately less evidence-prism dense than workspace.",
    },
    supportSlot: {
      title: "Support region",
      summary: "Comms and audit rail",
      detail: "Hub comms or audit route families can attach here later without a second shell.",
    },
    sourceRefs: [SOURCE_PLATFORM_FRONTEND, SOURCE_HUB, SOURCE_QUIET],
    gapResolutions: [
      "GAP_RESOLUTION_HUB_SHELL_LAYOUT_DERIVED_FROM_PHASE_5_AND_GENERAL_SHELL_LAW",
    ],
  },
  rf_hub_case_management: {
    routeFamilyRef: "rf_hub_case_management",
    title: "Case management",
    section: "Queue",
    residency: "same_shell_object_switch",
    continuityKey: "hub.queue",
    entityKeyRef: "entity.hub.case",
    defaultAnchor: "hub-candidate",
    anchors: ["hub-candidate", "hub-settlement", "hub-comms"],
    dominantActionLabel: "Advance the selected coordination option",
    trustCue: "Case switches keep the selected option pinned while the same shell stays active.",
    routeSummary: "Adjacent case-management route proving shell reuse and selected-option pinning.",
    casePulse: {
      title: "CasePulse",
      summary: "Selected option continuity",
      detail: "The chosen option remains stable across case transitions and fold state changes.",
    },
    decisionDock: {
      title: "DecisionDock",
      summary: "Selected option commitment",
      detail: "The dock preserves the handoff action unless a stronger blocker preempts it.",
    },
    primaryRegion: {
      title: "Case plane",
      summary: "Coordination candidate detail",
      detail: "Hub detail routes reuse the same queue shell and pinned candidate state.",
    },
    sourceRefs: [SOURCE_PLATFORM_FRONTEND, SOURCE_HUB, SOURCE_QUIET],
    gapResolutions: [
      "GAP_RESOLUTION_HUB_SHELL_LAYOUT_DERIVED_FROM_PHASE_5_AND_GENERAL_SHELL_LAW",
    ],
  },
  rf_governance_shell: {
    routeFamilyRef: "rf_governance_shell",
    title: "Governance",
    section: "Governance",
    residency: "resident_root",
    continuityKey: "governance.review",
    entityKeyRef: "entity.governance.review",
    defaultAnchor: "governance-scope",
    anchors: ["governance-scope", "governance-diff", "governance-approval"],
    dominantActionLabel: "Advance the governed review in place",
    trustCue: "Scope, diff, review, and release-watch posture remain exact and non-theatrical.",
    routeSummary: "Analytical governance shell with fixed tuple order, diff canvas, and calm approval rail.",
    casePulse: {
      title: "CasePulse",
      summary: "Review tuple",
      detail: "Release-watch and continuity evidence stay visible beside the active diff.",
    },
    decisionDock: {
      title: "DecisionDock",
      summary: "Governed approval action",
      detail: "One primary approval action survives resize, stale-return, and read-only drift.",
    },
    primaryRegion: {
      title: "Diff canvas",
      summary: "Scope and evidence review",
      detail: "Finding 95 requires watch parity and recovery posture to stay visible in the shell.",
    },
    supportSlot: {
      title: "Support region",
      summary: "Approval and guardrail rail",
      detail: "Only one support region may auto-promote during review.",
    },
    sourceRefs: [SOURCE_PLATFORM_FRONTEND, SOURCE_GOVERNANCE, SOURCE_FORENSICS],
  },
  rf_pharmacy_console: {
    routeFamilyRef: "rf_pharmacy_console",
    title: "Checkpoints",
    section: "Checkpoints",
    residency: "resident_root",
    continuityKey: "pharmacy.console",
    entityKeyRef: "entity.pharmacy.console",
    defaultAnchor: "pharmacy-lane",
    anchors: ["pharmacy-lane", "pharmacy-validation", "pharmacy-decision"],
    dominantActionLabel: "Complete the current validation checkpoint",
    trustCue: "Checkpoint, consent, and validation cues stay calm and procedural.",
    routeSummary: "Checkpoint-driven pharmacy shell with lane list, validation board, and decision rail.",
    casePulse: {
      title: "CasePulse",
      summary: "Validation posture",
      detail: "Consent, proof freshness, and lane progress remain visible at shell level.",
    },
    decisionDock: {
      title: "DecisionDock",
      summary: "Current checkpoint action",
      detail: "The validation action stays singular and safety-aware.",
    },
    primaryRegion: {
      title: "Checkpoint board",
      summary: "Procedural validation canvas",
      detail: "The shell avoids generic inbox or booking-shell visual language.",
    },
    supportSlot: {
      title: "Support region",
      summary: "Validation and decision rail",
      detail: "Later pharmacy route families can slot into this rail without replacing the shell.",
    },
    sourceRefs: [SOURCE_PLATFORM_FRONTEND, SOURCE_PHARMACY, SOURCE_QUIET],
  },
};

const shellDefinitions = [
  {
    shellSlug: "patient-web",
    shellFamily: "patient",
    displayName: "Patient Web",
    shellTitle: "Persistent patient shell",
    shellEyebrow: "Patient continuity family",
    shellSummary: "Calm service shell with five-section navigation and bounded recovery.",
    audienceSurfaceRef: "audsurf_patient_authenticated_portal",
    accentTone: "accent_active",
    defaultDensityMode: "relaxed",
    defaultMotionMode: "reduced",
    defaultTopology: "focus_frame",
    allowedTopologies: ["focus_frame", "mission_stack"],
    supportRegionBudget: 1,
    leftPaneLabel: "Section navigation",
    centerPaneLabel: "Patient focus frame",
    rightPaneLabel: "Support region",
    northStarLabel: "Trust and continuity",
    navSections: ["Home", "Requests", "Appointments", "Health record", "Messages"],
    routeFamilyRefs: [
      "rf_patient_home",
      "rf_patient_requests",
      "rf_patient_appointments",
      "rf_patient_health_record",
      "rf_patient_messages",
      "rf_intake_self_service",
      "rf_intake_telephony_capture",
      "rf_patient_secure_link_recovery",
      "rf_patient_embedded_channel",
    ],
    specimenNotes: [
      "One dominant CTA maximum.",
      "Readable measure center column with one bounded support lane.",
      "Embedded and recovery child routes remain inside the same shell.",
    ],
    sourceRefs: [SOURCE_PLATFORM_FRONTEND, SOURCE_PATIENT, SOURCE_QUIET, SOURCE_FORENSICS],
  },
  {
    shellSlug: "clinical-workspace",
    shellFamily: "staff",
    displayName: "Clinical Workspace",
    shellTitle: "Persistent staff workspace shell",
    shellEyebrow: "Queue-first clinical family",
    shellSummary: "Two-plane operational workspace with sticky decision dock and calm queue density.",
    audienceSurfaceRef: "audsurf_clinical_workspace",
    accentTone: "accent_insight",
    defaultDensityMode: "balanced",
    defaultMotionMode: "reduced",
    defaultTopology: "two_plane",
    allowedTopologies: ["two_plane", "three_plane", "mission_stack"],
    supportRegionBudget: 1,
    leftPaneLabel: "Workboard plane",
    centerPaneLabel: "Task canvas",
    rightPaneLabel: "Decision rail",
    northStarLabel: "Queue continuity",
    navSections: ["Queue"],
    routeFamilyRefs: ["rf_staff_workspace", "rf_staff_workspace_child"],
    specimenNotes: [
      "Queue rail remains keyboard-first.",
      "Decision dock stays pinned through same-shell object switches.",
      "Mission stack is a fold of the same shell, not a mobile fork.",
    ],
    sourceRefs: [SOURCE_PLATFORM_FRONTEND, SOURCE_STAFF, SOURCE_QUIET, SOURCE_FORENSICS],
  },
  {
    shellSlug: "support-workspace",
    shellFamily: "support",
    displayName: "Support Workspace",
    shellTitle: "Persistent support workspace shell",
    shellEyebrow: "Replay-aware support family",
    shellSummary: "Timeline-first support shell kept on the same framework because the repo already ships the app.",
    audienceSurfaceRef: "audsurf_support_workspace",
    accentTone: "accent_review",
    defaultDensityMode: "balanced",
    defaultMotionMode: "reduced",
    defaultTopology: "two_plane",
    allowedTopologies: ["two_plane", "three_plane", "mission_stack"],
    supportRegionBudget: 1,
    leftPaneLabel: "Ticket lane",
    centerPaneLabel: "Support timeline",
    rightPaneLabel: "Replay return rail",
    northStarLabel: "Replay-safe continuity",
    navSections: ["Tickets"],
    routeFamilyRefs: ["rf_support_ticket_workspace", "rf_support_replay_observe"],
    specimenNotes: [
      "Support remains a governed extension of the shared shell framework.",
      "Replay preserves return targets rather than depending on browser back.",
      "Masked subject context stays on-page.",
    ],
    sourceRefs: [SOURCE_PLATFORM_FRONTEND, SOURCE_STAFF_SUPPORT, SOURCE_QUIET],
  },
  {
    shellSlug: "ops-console",
    shellFamily: "operations",
    displayName: "Ops Console",
    shellTitle: "Persistent operations shell",
    shellEyebrow: "Diagnostic control family",
    shellSummary: "North-star operations shell with governed interventions and table-first health surfaces.",
    audienceSurfaceRef: "audsurf_operations_console",
    accentTone: "accent_success",
    defaultDensityMode: "compact",
    defaultMotionMode: "reduced",
    defaultTopology: "two_plane",
    allowedTopologies: ["two_plane", "three_plane", "mission_stack"],
    supportRegionBudget: 1,
    leftPaneLabel: "Watch list",
    centerPaneLabel: "Health canvas",
    rightPaneLabel: "Intervention rail",
    northStarLabel: "Operational north-star band",
    navSections: ["Board"],
    routeFamilyRefs: ["rf_operations_board", "rf_operations_drilldown"],
    specimenNotes: [
      "Avoids neon war-room styling.",
      "Optional three-plane mode is restricted to compare or investigation posture.",
      "Trust and guardrail posture remain visible beside interventions.",
    ],
    sourceRefs: [SOURCE_PLATFORM_FRONTEND, SOURCE_OPERATIONS, SOURCE_QUIET, SOURCE_FORENSICS],
  },
  {
    shellSlug: "hub-desk",
    shellFamily: "hub",
    displayName: "Hub Desk",
    shellTitle: "Persistent hub coordination shell",
    shellEyebrow: "Queue-first hub family",
    shellSummary: "Coordination shell with ranked options, pinned candidate state, and comms/audit rail.",
    audienceSurfaceRef: "audsurf_hub_desk",
    accentTone: "accent_insight",
    defaultDensityMode: "balanced",
    defaultMotionMode: "reduced",
    defaultTopology: "two_plane",
    allowedTopologies: ["two_plane", "mission_stack"],
    supportRegionBudget: 1,
    leftPaneLabel: "Queue plane",
    centerPaneLabel: "Options plane",
    rightPaneLabel: "Comms and audit rail",
    northStarLabel: "Ranked-option continuity",
    navSections: ["Queue"],
    routeFamilyRefs: ["rf_hub_queue", "rf_hub_case_management"],
    specimenNotes: [
      "Selected option stays pinned through same-shell changes.",
      "Geometry is distinct from workspace: more candidate choice, less evidence prism.",
      "Derived from phase-5 hub law plus the shared shell contract.",
    ],
    sourceRefs: [SOURCE_PLATFORM_FRONTEND, SOURCE_HUB, SOURCE_QUIET],
  },
  {
    shellSlug: "governance-console",
    shellFamily: "governance",
    displayName: "Governance Console",
    shellTitle: "Persistent governance shell",
    shellEyebrow: "Analytical review family",
    shellSummary: "Exact governance shell with scope ribbon, diff canvas, and guardrail-first approval rail.",
    audienceSurfaceRef: "audsurf_governance_admin",
    accentTone: "accent_insight",
    defaultDensityMode: "compact",
    defaultMotionMode: "reduced",
    defaultTopology: "three_plane",
    allowedTopologies: ["three_plane", "mission_stack"],
    supportRegionBudget: 1,
    leftPaneLabel: "Scope rail",
    centerPaneLabel: "Diff and evidence canvas",
    rightPaneLabel: "Approval and guardrail rail",
    northStarLabel: "Review tuple continuity",
    navSections: ["Governance"],
    routeFamilyRefs: ["rf_governance_shell"],
    specimenNotes: [
      "No giant stat cards or approval theatre.",
      "Tuple order stays fixed and analytical.",
      "Watch parity and recovery posture remain visible beside review work.",
    ],
    sourceRefs: [SOURCE_PLATFORM_FRONTEND, SOURCE_GOVERNANCE, SOURCE_QUIET, SOURCE_FORENSICS],
  },
  {
    shellSlug: "pharmacy-console",
    shellFamily: "pharmacy",
    displayName: "Pharmacy Console",
    shellTitle: "Persistent pharmacy shell",
    shellEyebrow: "Checkpoint validation family",
    shellSummary: "Checkpoint-driven validation shell with calm procedural certainty and safety-aware decisions.",
    audienceSurfaceRef: "audsurf_pharmacy_console",
    accentTone: "accent_success",
    defaultDensityMode: "balanced",
    defaultMotionMode: "reduced",
    defaultTopology: "two_plane",
    allowedTopologies: ["two_plane", "mission_stack"],
    supportRegionBudget: 1,
    leftPaneLabel: "Lane list",
    centerPaneLabel: "Checkpoint board",
    rightPaneLabel: "Validation rail",
    northStarLabel: "Checkpoint continuity",
    navSections: ["Checkpoints"],
    routeFamilyRefs: ["rf_pharmacy_console"],
    specimenNotes: [
      "Validation certainty replaces generic inbox treatment.",
      "Checkpoint and consent cues remain explicit.",
      "Later domain work can slot into the same shell and decision rail.",
    ],
    sourceRefs: [SOURCE_PLATFORM_FRONTEND, SOURCE_PHARMACY, SOURCE_QUIET],
  },
] as const;

const shellTypeToProfileRow: Record<PersistentShellFamily, string> = {
  patient: "PSR_050_PATIENT_V1",
  staff: "PSR_050_STAFF_V1",
  support: "PSR_050_SUPPORT_V1",
  hub: "PSR_050_HUB_V1",
  operations: "PSR_050_OPERATIONS_V1",
  governance: "PSR_050_GOVERNANCE_V1",
  pharmacy: "PSR_050_PHARMACY_V1",
};

function toBreakpointClass(width: number): BreakpointClass {
  if (width < 480) {
    return "compact";
  }
  if (width < 768) {
    return "narrow";
  }
  if (width < 1024) {
    return "medium";
  }
  if (width < 1440) {
    return "expanded";
  }
  return "wide";
}

function buildOwnershipContract(
  shell: (typeof shellDefinitions)[number],
): ShellFamilyOwnershipContract {
  return {
    shellSlug: shell.shellSlug,
    shellFamily: shell.shellFamily,
    audienceSurfaceRef: shell.audienceSurfaceRef,
    ownershipContractId: `SFOC_106_${shell.shellFamily.toUpperCase()}_V1`,
    continuityKey: `${shell.shellFamily}.persistent-shell`,
    statusStripAuthorityRef: `SSA_106_${shell.shellFamily.toUpperCase()}_V1`,
    decisionDockFocusLeaseRef: `DDFL_106_${shell.shellFamily.toUpperCase()}_V1`,
    quietWorkProtectionLeaseRef: `QWPL_106_${shell.shellFamily.toUpperCase()}_V1`,
    continuityRestorePlanRef: `CRP_106_${shell.shellFamily.toUpperCase()}_V1`,
    missionStackFoldPlanRef: `MSFP_106_${shell.shellFamily.toUpperCase()}_V1`,
    degradedStateContractRef: `CDC_106_${shell.shellFamily.toUpperCase()}_V1`,
    defaultTopology: shell.defaultTopology,
    allowedTopologies: shell.allowedTopologies,
    supportRegionBudget: shell.supportRegionBudget,
    sourceRefs: shell.sourceRefs,
  };
}

const persistentShellSpecs = shellDefinitions.map((shell) => {
  const ownership = buildOwnershipContract(shell);
  const routeClaims = shell.routeFamilyRefs.map((routeFamilyRef) => {
    const definition = routeDefinitions[routeFamilyRef];
    if (!definition) {
      throw new Error(`PERSISTENT_SHELL_ROUTE_DEFINITION_MISSING:${routeFamilyRef}`);
    }
    return {
      ...definition,
      shellSlug: shell.shellSlug,
      shellFamily: shell.shellFamily,
    };
  });
  return {
    ...shell,
    ownership,
    routeClaims,
    gapResolutions: routeClaims.flatMap((route) => route.followOnDependencies ?? []),
  } as const satisfies PersistentShellSpec;
});

const shellSpecBySlug = new Map<ShellSlug, PersistentShellSpec>(
  persistentShellSpecs.map((spec) => [spec.shellSlug, spec]),
);

const routeClaimByRef = new Map<string, PersistentShellRouteClaim>();
for (const spec of persistentShellSpecs) {
  for (const route of spec.routeClaims) {
    routeClaimByRef.set(route.routeFamilyRef, route);
  }
}

function resolveRuntimeObservationPreset(
  routeFamilyRef: string,
  runtimeScenario: RuntimeScenario,
): BrowserRuntimeObservationInput {
  const base: BrowserRuntimeObservationInput = {
    routeFamilyRef,
    environmentRing: "local",
  };
  switch (runtimeScenario) {
    case "live":
      return base;
    case "stale_review":
      return {
        ...base,
        projectionFreshnessState: "stale_review",
        transportState: "healthy",
      };
    case "read_only":
      return {
        ...base,
        projectionFreshnessState: "stale_review",
        trustState: "degraded",
        transportState: "reconnecting",
      };
    case "recovery_only":
      return {
        ...base,
        projectionFreshnessState: "replay_gap",
        manifestState: "drifted",
        transportState: "replay_gap",
        trustState: "degraded",
      };
    case "blocked":
      return {
        ...base,
        projectionFreshnessState: "blocked",
        manifestState: "drifted",
        trustState: "quarantined",
        freezeState: "release_frozen",
        transportState: "message_ambiguity",
      };
  }
}

function resolveMockShellRuntimeOutcome(
  runtimeScenario: RuntimeScenario,
): {
  posture: BrowserRecoveryPostureContract["effectiveBrowserPosture"];
  actionability: BrowserRecoveryPostureContract["actionabilityState"];
  freshness: BrowserRecoveryPostureContract["projectionFreshnessEnvelope"]["freshnessState"];
  reasonRefs: readonly string[];
} {
  switch (runtimeScenario) {
    case "live":
      return {
        posture: "live",
        actionability: "writable",
        freshness: "fresh",
        reasonRefs: [],
      };
    case "stale_review":
      return {
        posture: "live",
        actionability: "writable",
        freshness: "stale_review",
        reasonRefs: ["projection_stale_review"],
      };
    case "read_only":
      return {
        posture: "read_only",
        actionability: "read_only",
        freshness: "stale_review",
        reasonRefs: ["projection_stale_review", "trust_degraded", "transport_reconnecting"],
      };
    case "recovery_only":
      return {
        posture: "recovery_only",
        actionability: "recovery_only",
        freshness: "replay_gap",
        reasonRefs: ["projection_replay_gap", "browser_manifest_drift", "trust_degraded"],
      };
    case "blocked":
      return {
        posture: "blocked",
        actionability: "blocked",
        freshness: "blocked",
        reasonRefs: [
          "projection_blocked",
          "browser_manifest_drift",
          "trust_quarantined",
          "freeze_release_frozen",
        ],
      };
  }
}

function resolveShellRuntimeDecision(
  routeFamilyRef: string,
  runtimeScenario: RuntimeScenario,
): BrowserRecoveryPostureContract {
  const scenarioDecision = resolveBrowserRuntimeDecision(
    resolveRuntimeObservationPreset(routeFamilyRef, runtimeScenario),
  );
  const outcome = resolveMockShellRuntimeOutcome(runtimeScenario);
  return {
    ...scenarioDecision,
    baselineBrowserPosture: outcome.posture,
    effectiveBrowserPosture: outcome.posture,
    actionabilityState: outcome.actionability,
    reasonRefs: [...outcome.reasonRefs],
    projectionFreshnessEnvelope: {
      ...scenarioDecision.projectionFreshnessEnvelope,
      freshnessState: outcome.freshness,
      actionabilityState: outcome.actionability,
      reasonRefs: [...outcome.reasonRefs],
    },
  };
}

function firstRouteClaim(shell: PersistentShellSpec): PersistentShellRouteClaim {
  const route = shell.routeClaims[0];
  if (!route) {
    throw new Error(`PERSISTENT_SHELL_ROUTE_CLAIMS_EMPTY:${shell.shellSlug}`);
  }
  return route;
}

function routeAdjacencyState(
  currentRoute: PersistentShellRouteClaim,
  candidateRoute: PersistentShellRouteClaim,
): ContinuityTransitionCheckpoint["routeAdjacencyState"] {
  if (currentRoute.routeFamilyRef === candidateRoute.routeFamilyRef) {
    return "same_route";
  }
  if (currentRoute.shellSlug !== candidateRoute.shellSlug) {
    return "boundary";
  }
  if (candidateRoute.residency === "same_shell_object_switch") {
    return "same_shell_object_switch";
  }
  return "same_shell_adjacent";
}

function continuityEvidenceStateForPosture(
  posture: BrowserRecoveryPostureContract["effectiveBrowserPosture"],
): ContinuityTransitionCheckpoint["continuityEvidenceState"] {
  if (posture === "live") {
    return "trusted";
  }
  if (posture === "read_only") {
    return "degraded";
  }
  return "blocked";
}

function resolveTransitionState(
  currentRoute: PersistentShellRouteClaim,
  candidateRoute: PersistentShellRouteClaim,
  runtimeDecision: BrowserRecoveryPostureContract,
): ContinuityTransitionState {
  if (currentRoute.shellSlug !== candidateRoute.shellSlug) {
    return "replace_shell";
  }
  if (runtimeDecision.effectiveBrowserPosture === "blocked") {
    return "recover_in_place";
  }
  if (runtimeDecision.effectiveBrowserPosture === "recovery_only") {
    return "recover_in_place";
  }
  if (runtimeDecision.effectiveBrowserPosture === "read_only") {
    return "preserve_read_only";
  }
  if (currentRoute.routeFamilyRef === candidateRoute.routeFamilyRef) {
    return "reuse";
  }
  return "morph_in_place";
}

function resolveBoundaryState(
  transitionState: ContinuityTransitionState,
): ShellBoundaryState {
  switch (transitionState) {
    case "reuse":
      return "reuse_shell";
    case "morph_in_place":
      return "morph_child_surface";
    case "preserve_read_only":
      return "preserve_shell_read_only";
    case "recover_in_place":
      return "recover_in_place";
    case "replace_shell":
      return "replace_shell";
  }
}

function resolveBoundaryReason(
  transitionState: ContinuityTransitionState,
  currentRoute: PersistentShellRouteClaim,
  candidateRoute: PersistentShellRouteClaim,
  runtimeDecision: BrowserRecoveryPostureContract,
): string {
  if (transitionState === "replace_shell") {
    return `${currentRoute.shellFamily} -> ${candidateRoute.shellFamily} shell ownership boundary`;
  }
  if (transitionState === "reuse") {
    return "Same shellContinuityKey and same route-family claim";
  }
  if (transitionState === "morph_in_place") {
    return "Adjacent route-family claim inside the same PersistentShell";
  }
  if (transitionState === "preserve_read_only") {
    return `Runtime posture ${runtimeDecision.effectiveBrowserPosture} suppresses writable calm while preserving shell state`;
  }
  return `Runtime posture ${runtimeDecision.effectiveBrowserPosture} requires bounded recovery inside the same shell`;
}

export function listPersistentShellSpecs(): readonly PersistentShellSpec[] {
  return persistentShellSpecs;
}

export function getPersistentShellSpec(shellSlug: ShellSlug): PersistentShellSpec {
  const spec = shellSpecBySlug.get(shellSlug);
  if (!spec) {
    throw new Error(`PERSISTENT_SHELL_SPEC_UNKNOWN:${shellSlug}`);
  }
  return spec;
}

export function getPersistentShellRouteClaim(
  routeFamilyRef: string,
): PersistentShellRouteClaim {
  const route = routeClaimByRef.get(routeFamilyRef);
  if (!route) {
    throw new Error(`PERSISTENT_SHELL_ROUTE_UNKNOWN:${routeFamilyRef}`);
  }
  return route;
}

export function getPersistentShellRuntimeBinding(
  shellSlug: ShellSlug,
  routeFamilyRef: string,
  runtimeScenario: RuntimeScenario = "live",
): PersistentShellRuntimeBinding {
  const contract = getShellContract(shellSlug);
  const telemetry = createShellSignal(
    shellSlug,
    contract.routeFamilyIds,
    contract.gatewaySurfaceIds,
  );
  return {
    shellSlug,
    routeFamilyRef,
    runtimeScenario,
    runtimeDecision: resolveShellRuntimeDecision(routeFamilyRef, runtimeScenario),
    releasePosture: foundationReleasePosture[shellSlug],
    telemetry,
  };
}

export function resolvePersistentShellProfile(
  shellSlug: ShellSlug,
  options?: {
    breakpointClass?: BreakpointClass;
    viewportWidth?: number;
    missionStackFolded?: boolean;
    routeFamilyRef?: string;
  },
): PersistentShellProfileResolution {
  const shell = getPersistentShellSpec(shellSlug);
  const breakpointClass =
    options?.breakpointClass ?? toBreakpointClass(options?.viewportWidth ?? 1440);
  const currentRoute =
    options?.routeFamilyRef !== undefined
      ? getPersistentShellRouteClaim(options.routeFamilyRef)
      : firstRouteClaim(shell);
  const topology =
    breakpointClass === "compact" || breakpointClass === "narrow" || options?.missionStackFolded
      ? "mission_stack"
      : currentRoute.topologyHint ?? shell.defaultTopology;
  const resolutionId = shellTypeToProfileRow[shell.shellFamily];
  const publishedRow = profileSelectionResolutions.find(
    (row) => row.profileSelectionResolutionId === resolutionId,
  );
  if (!publishedRow) {
    throw new Error(`PERSISTENT_SHELL_PROFILE_RESOLUTION_UNKNOWN:${resolutionId}`);
  }
  return {
    shellSlug,
    shellFamily: shell.shellFamily,
    breakpointClass,
    topology,
    densityMode: shell.defaultDensityMode,
    motionMode: shell.defaultMotionMode,
    profileSelectionResolutionId: publishedRow.profileSelectionResolutionId,
    allowedTopologies: shell.allowedTopologies,
    sourceRefs: [SOURCE_TOKENS, SOURCE_KERNEL, ...shell.sourceRefs],
  };
}

export function resolveShellBoundaryDecision(input: {
  currentRouteFamilyRef: string;
  candidateRouteFamilyRef: string;
  runtimeScenario?: RuntimeScenario;
}): ShellBoundaryDecision {
  const currentRoute = getPersistentShellRouteClaim(input.currentRouteFamilyRef);
  const candidateRoute = getPersistentShellRouteClaim(input.candidateRouteFamilyRef);
  const runtimeDecision = resolveShellRuntimeDecision(
    candidateRoute.routeFamilyRef,
    input.runtimeScenario ?? "live",
  );
  const transitionState = resolveTransitionState(currentRoute, candidateRoute, runtimeDecision);
  const checkpoint: ContinuityTransitionCheckpoint = {
    transitionCheckpointId: `ctc::${currentRoute.routeFamilyRef}::${candidateRoute.routeFamilyRef}::${input.runtimeScenario ?? "live"}`,
    currentShellSlug: currentRoute.shellSlug,
    currentRouteFamilyRef: currentRoute.routeFamilyRef,
    candidateShellSlug: candidateRoute.shellSlug,
    candidateRouteFamilyRef: candidateRoute.routeFamilyRef,
    transitionState,
    routeAdjacencyState: routeAdjacencyState(currentRoute, candidateRoute),
    continuityEvidenceState: continuityEvidenceStateForPosture(
      runtimeDecision.effectiveBrowserPosture,
    ),
    runtimePosture: runtimeDecision.effectiveBrowserPosture,
    sourceRefs: [SOURCE_PLATFORM_FRONTEND, SOURCE_KERNEL, ...candidateRoute.sourceRefs],
  };
  const boundaryState = resolveBoundaryState(transitionState);
  const reason = resolveBoundaryReason(
    transitionState,
    currentRoute,
    candidateRoute,
    runtimeDecision,
  );
  const telemetryEvent = createBrowserRuntimeTelemetryEvent({
    eventKind:
      checkpoint.runtimePosture === "live"
        ? "reconnect_observed"
        : "browser_downgrade_applied",
    decision: runtimeDecision,
  });

  return {
    decisionId: `sbd::${currentRoute.routeFamilyRef}::${candidateRoute.routeFamilyRef}::${boundaryState}`,
    shellSlug: candidateRoute.shellSlug,
    candidateRouteFamilyRef: candidateRoute.routeFamilyRef,
    boundaryState,
    reason,
    checkpoint,
    runtimeDecision,
    telemetryEventId: telemetryEvent.eventId,
  };
}

export function createContinuityCarryForwardPlan(
  decision: ShellBoundaryDecision,
): ContinuityCarryForwardPlan {
  const preserveSelectedAnchor =
    decision.boundaryState === "reuse_shell" ||
    decision.boundaryState === "morph_child_surface" ||
    decision.boundaryState === "preserve_shell_read_only";
  const preserveSupportRegion = decision.boundaryState !== "replace_shell";

  return {
    planId: `ccfp::${decision.decisionId}`,
    shellSlug: decision.shellSlug,
    boundaryState: decision.boundaryState,
    preserveNavigationLedger: decision.boundaryState !== "replace_shell",
    preserveStatusStrip: decision.boundaryState !== "replace_shell",
    preserveCasePulse: decision.boundaryState !== "replace_shell",
    preserveDecisionDock: decision.boundaryState !== "replace_shell",
    preserveSelectedAnchor,
    preservePromotedSupportRegion: preserveSupportRegion,
    preserveMissionStackFoldState: decision.boundaryState !== "replace_shell",
    selectedAnchorDisposition: preserveSelectedAnchor
      ? decision.boundaryState === "preserve_shell_read_only"
        ? "freeze"
        : "preserve"
      : "reset_to_route_default",
    supportRegionDisposition: decision.boundaryState === "recover_in_place" ? "freeze" : "preserve",
    focusDisposition:
      decision.boundaryState === "recover_in_place"
        ? "focus_boundary_notice"
        : preserveSelectedAnchor
          ? "restore_selected_anchor"
          : "focus_primary_region",
    sourceRefs: decision.checkpoint.sourceRefs,
  };
}

export function createContinuityRestorePlan(input: {
  shellSlug: ShellSlug;
  routeFamilyRef: string;
  selectedAnchor: string;
  foldState: "folded" | "expanded";
  runtimeScenario?: RuntimeScenario;
}): ContinuityRestorePlan {
  const route = getPersistentShellRouteClaim(input.routeFamilyRef);
  return {
    planId: `crp::${input.shellSlug}::${input.routeFamilyRef}::${input.selectedAnchor}`,
    shellSlug: input.shellSlug,
    restoreStorageKey: `persistent-shell::${input.shellSlug}`,
    returnRouteFamilyRef: route.routeFamilyRef,
    selectedAnchor: input.selectedAnchor,
    foldState: input.foldState,
    runtimeScenario: input.runtimeScenario ?? "live",
    dominantActionLabel: route.dominantActionLabel,
    sourceRefs: [SOURCE_PLATFORM_FRONTEND, SOURCE_PATIENT, SOURCE_STAFF, SOURCE_OPERATIONS],
  };
}

export function createPersistentShellSimulationHarness(
  shellSlug: ShellSlug,
): PersistentShellSimulationHarness {
  const shell = getPersistentShellSpec(shellSlug);
  let currentRoute = firstRouteClaim(shell);
  let runtimeScenario: RuntimeScenario = "live";

  return {
    shell,
    get currentRoute() {
      return currentRoute;
    },
    get runtimeScenario() {
      return runtimeScenario;
    },
    transitionTo(routeFamilyRef: string, nextRuntimeScenario: RuntimeScenario = "live") {
      const route = getPersistentShellRouteClaim(routeFamilyRef);
      const boundaryDecision = resolveShellBoundaryDecision({
        currentRouteFamilyRef: currentRoute.routeFamilyRef,
        candidateRouteFamilyRef: routeFamilyRef,
        runtimeScenario: nextRuntimeScenario,
      });
      const carryForwardPlan = createContinuityCarryForwardPlan(boundaryDecision);
      const restorePlan = createContinuityRestorePlan({
        shellSlug: route.shellSlug,
        routeFamilyRef,
        selectedAnchor: carryForwardPlan.preserveSelectedAnchor
          ? currentRoute.defaultAnchor
          : route.defaultAnchor,
        foldState: "expanded",
        runtimeScenario: nextRuntimeScenario,
      });
      currentRoute = route;
      runtimeScenario = nextRuntimeScenario;
      return {
        route,
        boundaryDecision,
        carryForwardPlan,
        restorePlan,
      };
    },
  };
}

export const persistentShellCatalog = {
  taskId: PERSISTENT_SHELL_TASK_ID,
  visualMode: PERSISTENT_SHELL_VISUAL_MODE,
  shellCount: persistentShellSpecs.length,
  primaryAudienceShellCount: 6,
  routeResidencyCount: [...routeClaimByRef.keys()].length,
  supportExtensionCount: 1,
  topologyModes: ["focus_frame", "two_plane", "three_plane", "mission_stack"],
  runtimeScenarioCount: 5,
} as const;

export const packageContract = {
  artifactId: "package_persistent_shell",
  packageName: "@vecells/persistent-shell",
  packageRole: "shared",
  ownerContextCode: "frontend_runtime",
  ownerContextLabel: "Frontend Runtime",
  purpose:
    "Reusable cross-audience PersistentShell framework that turns shell law, continuity memory, and runtime posture into shared typed code.",
  versioningPosture:
    "Workspace-private published contract boundary. Apps compose this layer rather than reimplementing shell truth locally.",
  allowedDependencies: [
    "packages/api-contracts",
    "packages/design-system",
    "packages/observability",
    "packages/release-controls",
  ],
  forbiddenDependencies: [
    "apps/* route-local shell forks",
    "services/* deep UI imports",
    "packages/domains/* presentation forks",
  ],
  dependencyContractRefs: [
    "CBC_106_SHELLS_TO_UI_KERNEL",
    "CBC_106_SHELLS_TO_BROWSER_RUNTIME_BINDING",
  ],
  objectFamilyCount: 11,
  contractFamilyCount: 3,
  sourceContexts: ["frontend_runtime", "patient_experience", "triage_workspace", "operations"],
} as const;

export const ownedObjectFamilies = [
  {
    canonicalName: "PersistentShell",
    objectKind: "other",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef: `${SOURCE_PLATFORM_FRONTEND}#1.1 PersistentShell`,
  },
  {
    canonicalName: "ContinuityTransitionCheckpoint",
    objectKind: "contract",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef: `${SOURCE_PLATFORM_FRONTEND}#ContinuityTransitionCheckpoint`,
  },
  {
    canonicalName: "ShellBoundaryDecision",
    objectKind: "contract",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef: `${SOURCE_PLATFORM_FRONTEND}#ShellBoundaryDecision`,
  },
  {
    canonicalName: "ContinuityCarryForwardPlan",
    objectKind: "contract",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef: `${SOURCE_PLATFORM_FRONTEND}#ContinuityCarryForwardPlan`,
  },
  {
    canonicalName: "ContinuityRestorePlan",
    objectKind: "contract",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef: `${SOURCE_PLATFORM_FRONTEND}#1.1I ContinuityRestorePlan`,
  },
  {
    canonicalName: "MissionStackFoldPlan",
    objectKind: "contract",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef: `${SOURCE_PLATFORM_FRONTEND}#1.1J MissionStackFoldPlan`,
  },
  {
    canonicalName: "ShellFamilyOwnershipContract",
    objectKind: "contract",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef: `${SOURCE_PLATFORM_FRONTEND}#ShellFamilyOwnershipContract`,
  },
  {
    canonicalName: "RouteGuardDecision",
    objectKind: "contract",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend browser authority runtime",
    sourceRef: `${SOURCE_PLATFORM_FRONTEND}#Browser boundary and BFF law`,
  },
  {
    canonicalName: "ActionGuardDecision",
    objectKind: "contract",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend browser authority runtime",
    sourceRef: `${SOURCE_PLATFORM_FRONTEND}#WritableEligibilityFence`,
  },
  {
    canonicalName: "RuntimeBindingHydrationSnapshot",
    objectKind: "contract",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend browser authority runtime",
    sourceRef: `${SOURCE_PLATFORM_FRONTEND}#Browser boundary and BFF law`,
  },
  {
    canonicalName: "ManifestCapabilitySwitch",
    objectKind: "contract",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend browser authority runtime",
    sourceRef: `${SOURCE_PLATFORM_FRONTEND}#1.1 Feature switches subordinate to browser authority`,
  },
] as const;

export const ownedContractFamilies = [
  {
    contractFamilyId: "CF_106_PERSISTENT_SHELL_RUNTIME",
    label: "Persistent shell runtime",
    description: "Shell registry, topology resolution, route residency, and continuity state.",
    versioningPosture: "workspace-private",
    consumerContractIds: ["PersistentShell", "ContinuityTransitionCheckpoint", "ShellBoundaryDecision"],
    consumerOwnerCodes: ["patient_experience", "triage_workspace", "operations", "governance_admin"],
    consumerSelectors: ["shellSlug", "routeFamilyRef", "breakpointClass"],
    sourceRefs: [SOURCE_PLATFORM_FRONTEND, SOURCE_KERNEL],
    ownedObjectFamilyCount: 5,
  },
  {
    contractFamilyId: "CF_106_PERSISTENT_SHELL_CONTINUITY",
    label: "Persistent shell continuity memory",
    description: "Carry-forward, restore, mission-stack fold, and shell runtime posture binding.",
    versioningPosture: "workspace-private",
    consumerContractIds: ["ContinuityCarryForwardPlan", "ContinuityRestorePlan", "MissionStackFoldPlan"],
    consumerOwnerCodes: ["frontend_runtime", "patient_experience", "triage_workspace"],
    consumerSelectors: ["shellSlug", "selectedAnchor", "runtimeScenario"],
    sourceRefs: [SOURCE_PLATFORM_FRONTEND, SOURCE_QUIET, SOURCE_FORENSICS],
    ownedObjectFamilyCount: 4,
  },
  {
    contractFamilyId: "CF_112_ROUTE_GUARD_BROWSER_AUTHORITY",
    label: "Route guard browser authority",
    description:
      "Manifest-bound route guards, capability switches, runtime binding hydration, and same-shell downgrade decisions.",
    versioningPosture: "workspace-private",
    consumerContractIds: [
      "RouteGuardDecision",
      "ActionGuardDecision",
      "RuntimeBindingHydrationSnapshot",
      "ManifestCapabilitySwitch",
    ],
    consumerOwnerCodes: [
      "frontend_runtime",
      "patient_experience",
      "triage_workspace",
      "operations",
      "governance_admin",
    ],
    consumerSelectors: ["routeFamilyRef", "audienceSurface", "channelProfile"],
    sourceRefs: [SOURCE_PLATFORM_FRONTEND, SOURCE_KERNEL, SOURCE_FORENSICS],
    ownedObjectFamilyCount: 4,
  },
] as const;

export function bootstrapSharedPackage() {
  return {
    packageName: packageContract.packageName,
    objectFamilies: ownedObjectFamilies.length,
    contractFamilies: ownedContractFamilies.length,
    shells: persistentShellSpecs.length,
    routeClaims: routeClaimByRef.size,
  };
}

export function listPersistentShellShellSlugs(): readonly ShellSlug[] {
  return Object.keys(shellSurfaceContracts) as ShellSlug[];
}

export function getShellTelemetry(shellSlug: ShellSlug): ShellTelemetrySnapshot {
  const contract: ShellSurfaceContract = getShellContract(shellSlug);
  return createShellSignal(shellSlug, contract.routeFamilyIds, contract.gatewaySurfaceIds);
}
