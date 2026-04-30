import {
  generateFrontendContractManifest,
  validateFrontendContractManifest,
  type FrontendContractManifestRuntime,
  type FrontendManifestValidationVerdict,
} from "@vecells/api-contracts";
import {
  createContinuityCarryForwardPlan,
  createContinuityRestorePlan,
  resolveAutomationAnchorProfile,
  resolveRouteGuardDecision,
  resolveShellBoundaryDecision,
  type AudienceSurfaceRuntimeBindingLike,
  type ReleaseRecoveryDispositionLike,
  type ReleaseTrustFreezeVerdictLike,
  type RouteFreezeDispositionLike,
  type RouteGuardDecision,
  type RuntimeScenario,
} from "@vecells/persistent-shell";
import {
  resolveSurfacePostureContract,
  surfacePostureSpecimens,
  type SurfacePostureContract,
} from "@vecells/surface-postures";
import {
  statusTruthSpecimens,
  type CasePulseContract,
  type ProjectionActionabilityState,
  type ProjectionFreshnessState,
  type ProjectionTransportState,
  type ProjectionTrustState,
  type StatusTruthInput,
} from "@vecells/design-system";

export const STAFF_SHELL_TASK_ID = "par_116";
export const STAFF_TELEMETRY_SCENARIO_ID = "SCN_STATUS_LAB_WORKSPACE_REVIEW";
export const STAFF_STORAGE_KEY = "clinical-workspace::staff-shell-ledger";

export type StaffRouteKind =
  | "home"
  | "queue"
  | "task"
  | "more-info"
  | "decision"
  | "approvals"
  | "escalations"
  | "changed"
  | "search"
  | "support-handoff";

export type StaffQueueState =
  | "recommended"
  | "changed"
  | "approval"
  | "escalated"
  | "blocked"
  | "reassigned";

export interface StaffEvidenceItem {
  label: string;
  value: string;
  detail: string;
}

export interface StaffConsequenceItem {
  title: string;
  detail: string;
}

export interface StaffQuickCaptureConfig {
  endpoints: readonly string[];
  questionSets: readonly string[];
  reasonChips: readonly string[];
  macros: readonly string[];
  duePicks: readonly string[];
}

export interface StaffQueueCase {
  id: string;
  patientLabel: string;
  patientRef: string;
  queueKey: string;
  state: StaffQueueState;
  urgencyTone: "info" | "caution" | "critical";
  ageLabel: string;
  freshnessLabel: string;
  dueLabel: string;
  primaryReason: string;
  secondaryMeta: string;
  previewSummary: string;
  previewTrustNote: string;
  summaryPoints: readonly string[];
  deltaClass: "decisive" | "consequential" | "contextual";
  deltaSummary: string;
  supersededContext: readonly string[];
  evidence: readonly StaffEvidenceItem[];
  consequences: readonly StaffConsequenceItem[];
  references: readonly string[];
  decisionOptions: readonly string[];
  moreInfoPrompts: readonly string[];
  quickCapture: StaffQuickCaptureConfig;
  nextQueueRank: number;
  currentQueueRank: number;
  launchQueue: string;
}

export interface StaffQueueDefinition {
  key: string;
  label: string;
  description: string;
  recommendedTaskId: string;
  filter: (item: StaffQueueCase) => boolean;
}

export interface StaffHomeModule {
  id: string;
  title: string;
  summary: string;
  detail: string;
  tone: "neutral" | "caution" | "critical";
  taskRefs: readonly string[];
}

export interface StaffShellRoute {
  kind: StaffRouteKind;
  path: string;
  routeFamilyRef: "rf_staff_workspace" | "rf_staff_workspace_child";
  title: string;
  sectionLabel: string;
  queueKey: string | null;
  taskId: string | null;
  searchQuery: string;
}

export interface StaffShellLedger {
  path: string;
  selectedAnchorId: string;
  queueKey: string;
  selectedTaskId: string;
  previewTaskId: string;
  searchQuery: string;
  bufferedUpdateCount: number;
  queuedBatchPending: boolean;
  runtimeScenario: RuntimeScenario;
  lastQuietRegionLabel: string;
}

export interface StaffRouteAuthorityArtifacts {
  manifest: StaffFrontendContractManifest;
  verdict: FrontendManifestValidationVerdict;
  runtimeBinding: AudienceSurfaceRuntimeBindingLike;
  releaseVerdict: ReleaseTrustFreezeVerdictLike;
  routeFreezeDisposition: RouteFreezeDispositionLike | null;
  releaseRecoveryDisposition: ReleaseRecoveryDispositionLike | null;
  guardDecision: RouteGuardDecision;
}

type StaffFrontendContractManifest = FrontendContractManifestRuntime & {
  shellType: "staff";
};

const workspaceStatusSeed = statusTruthSpecimens.find(
  (candidate) => candidate.audience === "workspace",
);

if (!workspaceStatusSeed) {
  throw new Error("STATUS_TRUTH_WORKSPACE_SPECIMEN_MISSING");
}

const workspaceEmptySeed = surfacePostureSpecimens.find(
  (candidate) => candidate.postureId === "workspace_empty_queue",
);
const workspacePartialSeed = surfacePostureSpecimens.find(
  (candidate) => candidate.postureId === "workspace_partial_visibility",
);

if (!workspaceEmptySeed || !workspacePartialSeed) {
  throw new Error("WORKSPACE_POSTURE_SPECIMENS_MISSING");
}

function requireWorkspaceEmptySeed(): SurfacePostureContract {
  if (!workspaceEmptySeed) {
    throw new Error("WORKSPACE_EMPTY_POSTURE_SPECIMEN_MISSING");
  }
  return cloneJson(workspaceEmptySeed);
}

function requireWorkspacePartialSeed(): SurfacePostureContract {
  if (!workspacePartialSeed) {
    throw new Error("WORKSPACE_PARTIAL_POSTURE_SPECIMEN_MISSING");
  }
  return cloneJson(workspacePartialSeed);
}

function requireWorkspaceStatusSeed() {
  if (!workspaceStatusSeed) {
    throw new Error("STATUS_TRUTH_WORKSPACE_SPECIMEN_MISSING");
  }
  return workspaceStatusSeed;
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export const staffCases: readonly StaffQueueCase[] = [
  {
    id: "task-311",
    patientLabel: "Asha Patel",
    patientRef: "PT-311-AX7",
    queueKey: "recommended",
    state: "changed",
    urgencyTone: "caution",
    ageLabel: "47m open",
    freshnessLabel: "Changed 12m ago",
    dueLabel: "More-info due 14:10",
    primaryReason: "Returned evidence changes the inhaler escalation recommendation.",
    secondaryMeta:
      "2 attachments · duplicate suspicion watch · prior judgment now superseded · reviewer Lee Moran",
    previewSummary:
      "The patient replied with a corrected inhaler photo and a pharmacy note that contradict the last self-care path.",
    previewTrustNote:
      "Preview stays summary-first and read-only until the active task shell revalidates the decision lease.",
    summaryPoints: [
      "Patient-reported wheeze worsened overnight after following the original advice path.",
      "Returned evidence includes a new inhaler label image and a pharmacy callback note.",
      "A duplicate suspicion remains open because an older repeat request reused the same phone number.",
    ],
    deltaClass: "decisive",
    deltaSummary:
      "A decisive delta landed: the pharmacy callback and attachment pair invalidated the prior self-care judgement.",
    supersededContext: [
      "Superseded: self-care advice variant from 09:12 assumed no controller inhaler duplication.",
      "Superseded: prior approval note treated the callback as informational, not blocking.",
    ],
    evidence: [
      {
        label: "Attachment digest",
        value: "2 returned artifacts",
        detail: "One inhaler photo, one pharmacy callback transcript excerpt.",
      },
      {
        label: "Duplicate watch",
        value: "open",
        detail: "History group 7 still needs reviewer acknowledgement before closure.",
      },
      {
        label: "Patient reply",
        value: "late but valid",
        detail: "Reply arrived 12 minutes after the last more-info window warning.",
      },
    ],
    consequences: [
      {
        title: "Recommendation impact",
        detail: "The active advice path must be rechecked before the case can settle.",
      },
      {
        title: "Support boundary",
        detail: "If the attachment check fails, hand off through support review only.",
      },
    ],
    references: [
      "Medication summary v7",
      "Practice escalation policy note",
      "Previous decision preview",
    ],
    decisionOptions: [
      "Escalate to clinician callback",
      "Issue more-info follow-up",
      "Hold as duplicate review",
    ],
    moreInfoPrompts: [
      "Confirm which inhaler was actually used after the overnight symptom change.",
      "Ask whether the pharmacist supplied a replacement or updated dose instructions.",
      "Verify whether the callback note refers to this request lineage or an older duplicate.",
    ],
    quickCapture: {
      endpoints: ["Clinician callback", "Pharmacy clarification", "Duplicate review lane"],
      questionSets: ["Inhaler confirmation", "Pharmacy callback", "Duplicate history check"],
      reasonChips: ["Returned evidence", "Contradiction", "Patient safety"],
      macros: ["Hold commit and reopen change review", "Late reply acknowledged", "Pharmacy note pending"],
      duePicks: ["Today 14:30", "Today 16:00", "Tomorrow 09:00"],
    },
    nextQueueRank: 2,
    currentQueueRank: 1,
    launchQueue: "returned-evidence",
  },
  {
    id: "task-208",
    patientLabel: "Noah Bennett",
    patientRef: "PT-208-FQ2",
    queueKey: "recommended",
    state: "approval",
    urgencyTone: "info",
    ageLabel: "18m open",
    freshnessLabel: "Approval queued",
    dueLabel: "Approval SLA 15:00",
    primaryReason: "Booking-intent summary is ready, but consequence review still needs approval.",
    secondaryMeta:
      "1 approval blocker · booking-intent seed · reviewer Zoe Keane · no downstream drift detected",
    previewSummary:
      "The task is clinically stable, but the promoted booking path cannot settle until the approval lane confirms the new access need.",
    previewTrustNote:
      "Preview keeps the approval blocker visible without minting a writable approval action.",
    summaryPoints: [
      "The patient accepted the proposed service window in the previous more-info cycle.",
      "The booking-intent seed is ready to advance once the approval frame confirms the access rule.",
      "No contradictory evidence has landed since the last reviewer touch.",
    ],
    deltaClass: "contextual",
    deltaSummary:
      "The only new information is a contextual approval requirement triggered by the service site availability change.",
    supersededContext: [
      "Superseded: initial booking-intent preview assumed no extra approval requirement.",
    ],
    evidence: [
      {
        label: "Approval lane",
        value: "awaiting reviewer",
        detail: "One promoted approval preview is attached to this task.",
      },
      {
        label: "Booking intent",
        value: "ready to stage",
        detail: "The bounded booking follow-up stays read-only until approval settles.",
      },
    ],
    consequences: [
      {
        title: "Decision impact",
        detail: "Dominant action is approval review, not direct booking commitment.",
      },
    ],
    references: ["Service eligibility snapshot", "Previous callback summary"],
    decisionOptions: [
      "Request approval",
      "Prepare booking handoff",
      "Hold in review",
    ],
    moreInfoPrompts: [
      "Confirm whether the patient still prefers the proposed service date.",
      "Verify if transport constraints changed since the last callback.",
    ],
    quickCapture: {
      endpoints: ["Approval reviewer", "Booking intent lane"],
      questionSets: ["Approval context", "Service preference"],
      reasonChips: ["Approval needed", "Booking intent", "Stable evidence"],
      macros: ["Approval preview promoted", "Booking handoff staged", "Awaiting reviewer sign-off"],
      duePicks: ["Today 15:00", "Today 17:00", "Tomorrow 08:30"],
    },
    nextQueueRank: 4,
    currentQueueRank: 3,
    launchQueue: "approvals",
  },
  {
    id: "task-412",
    patientLabel: "Elena Morris",
    patientRef: "PT-412-ZM4",
    queueKey: "recommended",
    state: "escalated",
    urgencyTone: "critical",
    ageLabel: "9m open",
    freshnessLabel: "Urgent callback watch",
    dueLabel: "Escalation due now",
    primaryReason: "Callback follow-up is drifting and now needs an urgent, bounded escalation.",
    secondaryMeta:
      "Blocked contact route · callback-intent seed · dependency caution · reviewer Tariq Noor",
    previewSummary:
      "Outbound callback attempts are failing against the current contact route assessment, so the case moved into urgent escalation status.",
    previewTrustNote:
      "Preview reports the escalation status only; contact-route repair stays limited to the task workspace.",
    summaryPoints: [
      "Two callback attempts failed against a stale mobile number.",
      "The current reachability assessment disputes the preferred contact route.",
      "The patient asked for a same-day callback in the original request.",
    ],
    deltaClass: "consequential",
    deltaSummary:
      "A consequential delta arrived: contact-route trust drift means the callback plan is no longer safely actionable.",
    supersededContext: [
      "Superseded: previous callback summary assumed the mobile route was current.",
    ],
    evidence: [
      {
        label: "Reachability",
        value: "disputed",
        detail: "The active contact-route snapshot is stale and under repair.",
      },
      {
        label: "Dependency digest",
        value: "callback queue delayed",
        detail: "Queue health remains degraded but not fully blocked.",
      },
    ],
    consequences: [
      {
        title: "Escalation impact",
        detail: "The dominant action is escalation review with one promoted relief path.",
      },
      {
        title: "Support boundary",
        detail: "Support handoff remains a read-only escape hatch for contact-route repair only.",
      },
    ],
    references: ["Reachability assessment", "Callback timeline"],
    decisionOptions: [
      "Escalate to urgent callback review",
      "Freeze contact-route mutation",
      "Send to support review",
    ],
    moreInfoPrompts: [
      "Ask for a safe alternate callback number.",
      "Confirm if voicemail or text follow-up is acceptable.",
    ],
    quickCapture: {
      endpoints: ["Urgent callback lane", "Support review", "Reachability repair"],
      questionSets: ["Alternate number", "Urgency confirmation"],
      reasonChips: ["Urgent escalation", "Contact route disputed", "Callback follow-up"],
      macros: ["Escalation promoted", "Reachability repair frozen", "Support review prepared"],
      duePicks: ["In 30 minutes", "Today 13:45", "Today 16:30"],
    },
    nextQueueRank: 1,
    currentQueueRank: 2,
    launchQueue: "callback-follow-up",
  },
  {
    id: "task-507",
    patientLabel: "Ravi Singh",
    patientRef: "PT-507-RS1",
    queueKey: "recommended",
    state: "blocked",
    urgencyTone: "critical",
    ageLabel: "61m open",
    freshnessLabel: "Pharmacy intent blocked",
    dueLabel: "Pharmacy response awaited",
    primaryReason: "Pharmacy-intent seed is paused while a duplicate medication route is reconciled.",
    secondaryMeta:
      "Pharmacy intent · blocker active · duplicate suspicion reopened · reviewer Mina Blake",
    previewSummary:
      "The pharmacy line cannot move until the duplicate medication route is reconciled and the returned evidence is acknowledged.",
    previewTrustNote:
      "Preview holds the blocker summary only; the heavy artifact review waits for task open.",
    summaryPoints: [
      "The patient uploaded a second medication label with a different site stamp.",
      "The pharmacy-intent seed is otherwise ready for fulfilment staging.",
      "A reopen event linked the current line to an older duplicate resolution draft.",
    ],
    deltaClass: "decisive",
    deltaSummary:
      "A decisive duplicate-lineage delta blocked the pharmacy intent and forced a reopened review posture.",
    supersededContext: [
      "Superseded: previous pharmacy-intent preview treated the duplicate review as settled.",
      "Superseded: prior fulfillment readiness note relied on the older medication snapshot.",
    ],
    evidence: [
      {
        label: "Medication snapshot",
        value: "2 conflicting labels",
        detail: "The newer label changes the route interpretation for fulfilment.",
      },
      {
        label: "Pharmacy intent",
        value: "paused",
        detail: "No downstream pharmacy mutation may proceed while the blocker is active.",
      },
    ],
    consequences: [
      {
        title: "Decision impact",
        detail: "DecisionDock must freeze send and completion until the duplicate block clears.",
      },
    ],
    references: ["Pharmacy seed summary", "Duplicate resolution note", "Medication image digest"],
    decisionOptions: [
      "Reconcile duplicate route",
      "Request pharmacy clarification",
      "Hold for manual review",
    ],
    moreInfoPrompts: [
      "Confirm which site supplied the replacement label.",
      "Ask whether the patient still has the original packaging available.",
    ],
    quickCapture: {
      endpoints: ["Pharmacy clarification", "Duplicate review lane"],
      questionSets: ["Medication source", "Replacement supply"],
      reasonChips: ["Pharmacy intent", "Duplicate suspicion", "Returned evidence"],
      macros: ["Freeze fulfilment action", "Duplicate review reopened", "Pharmacy note pending"],
      duePicks: ["Today 15:30", "Tomorrow 09:15", "Tomorrow 11:00"],
    },
    nextQueueRank: 3,
    currentQueueRank: 4,
    launchQueue: "pharmacy-watch",
  },
  {
    id: "task-118",
    patientLabel: "Maya Foster",
    patientRef: "PT-118-MF8",
    queueKey: "recommended",
    state: "reassigned",
    urgencyTone: "info",
    ageLabel: "26m open",
    freshnessLabel: "Reopen watch",
    dueLabel: "Review by 16:20",
    primaryReason: "A reopened admin-resolution case needs a calm changed-since-seen review.",
    secondaryMeta:
      "Reopen watch · admin-resolution seed · no urgent blocker · reviewer Ada Fox",
    previewSummary:
      "The prior admin-resolution outcome was reopened after a new practice note arrived, but the task remains safely reviewable.",
    previewTrustNote:
      "Preview preserves the reopen context and return anchor while staying summary-only.",
    summaryPoints: [
      "The original admin-resolution summary remains visible as superseded context.",
      "A new practice note changes follow-up ownership but not patient safety status.",
      "No urgent interruption wins the shell right now.",
    ],
    deltaClass: "contextual",
    deltaSummary:
      "A contextual reopen delta landed: ownership and next-step language changed, but the prior judgement still holds for now.",
    supersededContext: [
      "Superseded: admin-resolution close note from 10:05 is preserved for comparison.",
    ],
    evidence: [
      {
        label: "Reopen state",
        value: "review required",
        detail: "The task re-entered the queue without losing its prior settlement context.",
      },
      {
        label: "Ownership",
        value: "reassigned",
        detail: "The case must surface calm reassignment instead of silently moving away.",
      },
    ],
    consequences: [
      {
        title: "Review impact",
        detail: "Changed-since-seen review becomes the dominant next step until the reopen is acknowledged.",
      },
    ],
    references: ["Close note v2", "Reopen event digest"],
    decisionOptions: [
      "Acknowledge reopen",
      "Request more info",
      "Return to admin resolution",
    ],
    moreInfoPrompts: [
      "Ask whether the patient-facing completion note needs correcting.",
      "Confirm which owner should receive the reopened follow-up.",
    ],
    quickCapture: {
      endpoints: ["Admin resolution", "Reopen review"],
      questionSets: ["Reopen context", "Ownership clarification"],
      reasonChips: ["Changed since seen", "Reassigned", "Reopen watch"],
      macros: ["Reopen acknowledged", "Owner reassigned", "Quiet return preserved"],
      duePicks: ["Today 16:20", "Tomorrow 10:00", "Tomorrow 12:00"],
    },
    nextQueueRank: 5,
    currentQueueRank: 5,
    launchQueue: "changed-since-seen",
  },
] as const;

export const staffQueues: readonly StaffQueueDefinition[] = [
  {
    key: "recommended",
    label: "Recommended queue",
    description: "Best next queue based on start-of-day role and current interruption weight.",
    recommendedTaskId: "task-311",
    filter: () => true,
  },
  {
    key: "returned-evidence",
    label: "Returned evidence",
    description: "Cases reopened by patient replies, new attachments, or contradiction packets.",
    recommendedTaskId: "task-311",
    filter: (item) => item.deltaClass === "decisive" || item.state === "changed",
  },
  {
    key: "callback-follow-up",
    label: "Callback follow-up",
    description: "Cases where callback intent, reachability drift, or same-day urgency is active.",
    recommendedTaskId: "task-412",
    filter: (item) =>
      item.id === "task-412" || item.quickCapture.reasonChips.includes("Callback follow-up"),
  },
  {
    key: "pharmacy-watch",
    label: "Pharmacy watch",
    description: "Bounded pharmacy-intent and medication-route blockers inside the same shell.",
    recommendedTaskId: "task-507",
    filter: (item) => item.id === "task-507",
  },
  {
    key: "changed-since-seen",
    label: "Changed since seen",
    description: "Cases that resumed review because the evidence or ownership picture changed.",
    recommendedTaskId: "task-118",
    filter: (item) => item.state === "changed" || item.id === "task-118",
  },
] as const;

export const staffHomeModules: readonly StaffHomeModule[] = [
  {
    id: "today-workbench-hero",
    title: "TodayWorkbenchHero",
    summary: "Resume the returned-evidence queue and reopen the active inhaler review first.",
    detail:
      "The recommended queue stays expanded because decisive deltas landed in the last acknowledged review cycle.",
    tone: "neutral",
    taskRefs: ["task-311", "task-412"],
  },
  {
    id: "interruption-digest",
    title: "InterruptionDigest",
    summary: "1 blocker, 1 urgent escalation, 2 watch items.",
    detail:
      "Escalation remains the only promoted interruption; the rest stay summary-level until selected.",
    tone: "critical",
    taskRefs: ["task-412", "task-507"],
  },
  {
    id: "team-risk-digest",
    title: "TeamRiskDigest",
    summary: "Booking approvals are accumulating while callback follow-up is time-sensitive.",
    detail:
      "The team-risk digest stays summary-only until the operator explicitly promotes a lane.",
    tone: "caution",
    taskRefs: ["task-208", "task-118"],
  },
  {
    id: "recent-resumption-strip",
    title: "RecentResumptionStrip",
    summary: "Recent resumptions preserve the exact row and quiet-return target from the last safe read.",
    detail:
      "Task 118 and Task 311 are ready to resume without resetting the queue context or decision rail.",
    tone: "neutral",
    taskRefs: ["task-118", "task-311"],
  },
] as const;

function requireCase(taskId: string): StaffQueueCase {
  const task = staffCases.find((candidate) => candidate.id === taskId);
  if (!task) {
    throw new Error(`STAFF_CASE_UNKNOWN:${taskId}`);
  }
  return task;
}

export { requireCase };

export function requireQueue(queueKey: string): StaffQueueDefinition {
  const queue = staffQueues.find((candidate) => candidate.key === queueKey);
  if (!queue) {
    throw new Error(`STAFF_QUEUE_UNKNOWN:${queueKey}`);
  }
  return queue;
}

export function listQueueCases(queueKey: string): StaffQueueCase[] {
  const queue = requireQueue(queueKey);
  return staffCases.filter(queue.filter).sort((left, right) => left.currentQueueRank - right.currentQueueRank);
}

export function listSearchCases(query: string): StaffQueueCase[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [];
  }
  return staffCases.filter((item) =>
    [
      item.patientLabel,
      item.patientRef,
      item.primaryReason,
      item.secondaryMeta,
      item.queueKey,
      item.id,
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalized),
  );
}

export function applyQueueChangeBatch(
  rows: readonly StaffQueueCase[],
  selectedTaskId: string,
): StaffQueueCase[] {
  const currentRows = [...rows];
  const selectedIndex = currentRows.findIndex((row) => row.id === selectedTaskId);
  const selectedRow = selectedIndex >= 0 ? currentRows[selectedIndex] : null;
  const reranked = [...currentRows].sort((left, right) => left.nextQueueRank - right.nextQueueRank);

  if (!selectedRow || selectedIndex < 0) {
    return reranked;
  }

  const withoutSelected = reranked.filter((row) => row.id !== selectedTaskId);
  withoutSelected.splice(Math.min(selectedIndex, withoutSelected.length), 0, selectedRow);
  return withoutSelected;
}

export function routeFamilyRefForKind(
  kind: StaffRouteKind,
): "rf_staff_workspace" | "rf_staff_workspace_child" {
  switch (kind) {
    case "home":
    case "queue":
    case "task":
      return "rf_staff_workspace";
    case "more-info":
    case "decision":
    case "approvals":
    case "escalations":
    case "changed":
    case "search":
    case "support-handoff":
      return "rf_staff_workspace_child";
  }
}

export function buildStaffPath(route: {
  kind: StaffRouteKind;
  queueKey?: string | null;
  taskId?: string | null;
  searchQuery?: string;
}): string {
  switch (route.kind) {
    case "home":
      return "/workspace";
    case "queue":
      return `/workspace/queue/${route.queueKey ?? "recommended"}`;
    case "task":
      return `/workspace/task/${route.taskId ?? "task-311"}`;
    case "more-info":
      return `/workspace/task/${route.taskId ?? "task-311"}/more-info`;
    case "decision":
      return `/workspace/task/${route.taskId ?? "task-311"}/decision`;
    case "approvals":
      return "/workspace/approvals";
    case "escalations":
      return "/workspace/escalations";
    case "changed":
      return "/workspace/changed";
    case "search": {
      const search = route.searchQuery?.trim();
      return search ? `/workspace/search?q=${encodeURIComponent(search)}` : "/workspace/search";
    }
    case "support-handoff":
      return "/workspace/support-handoff";
  }
}

function titleForRoute(route: StaffRouteKind): string {
  switch (route) {
    case "home":
      return "Workspace Home";
    case "queue":
      return "Queue workboard";
    case "task":
      return "Active task";
    case "more-info":
      return "More-info compose";
    case "decision":
      return "Decision preview";
    case "approvals":
      return "Approvals";
    case "escalations":
      return "Escalations";
    case "changed":
      return "Changed since seen";
    case "search":
      return "Search";
    case "support-handoff":
      return "Support handoff";
  }
}

function sectionForRoute(route: StaffRouteKind): string {
  switch (route) {
    case "approvals":
      return "Approvals";
    case "escalations":
      return "Escalations";
    case "changed":
      return "Changed";
    case "search":
      return "Search";
    default:
      return "Queue";
  }
}

export function parseStaffPath(pathname: string, search = ""): StaffShellRoute {
  const normalizedPath = pathname === "/" ? "/workspace" : pathname.replace(/\/+$/, "") || "/workspace";
  const params = new URLSearchParams(search);
  const queueMatch = normalizedPath.match(/^\/workspace\/queue\/([^/]+)$/);
  if (queueMatch) {
    const queueKey = decodeURIComponent(queueMatch[1] ?? "recommended");
    return {
      kind: "queue",
      path: buildStaffPath({ kind: "queue", queueKey }),
      routeFamilyRef: "rf_staff_workspace",
      title: titleForRoute("queue"),
      sectionLabel: sectionForRoute("queue"),
      queueKey,
      taskId: null,
      searchQuery: "",
    };
  }

  const taskChildMatch = normalizedPath.match(/^\/workspace\/task\/([^/]+)\/(more-info|decision)$/);
  if (taskChildMatch) {
    const taskId = decodeURIComponent(taskChildMatch[1] ?? "task-311");
    const kind = (taskChildMatch[2] ?? "more-info") as "more-info" | "decision";
    return {
      kind,
      path: buildStaffPath({ kind, taskId }),
      routeFamilyRef: "rf_staff_workspace_child",
      title: titleForRoute(kind),
      sectionLabel: sectionForRoute(kind),
      queueKey: requireCase(taskId).launchQueue,
      taskId,
      searchQuery: "",
    };
  }

  const taskMatch = normalizedPath.match(/^\/workspace\/task\/([^/]+)$/);
  if (taskMatch) {
    const taskId = decodeURIComponent(taskMatch[1] ?? "task-311");
    return {
      kind: "task",
      path: buildStaffPath({ kind: "task", taskId }),
      routeFamilyRef: "rf_staff_workspace",
      title: titleForRoute("task"),
      sectionLabel: sectionForRoute("task"),
      queueKey: requireCase(taskId).launchQueue,
      taskId,
      searchQuery: "",
    };
  }

  if (normalizedPath === "/workspace/approvals") {
    return {
      kind: "approvals",
      path: "/workspace/approvals",
      routeFamilyRef: "rf_staff_workspace_child",
      title: titleForRoute("approvals"),
      sectionLabel: sectionForRoute("approvals"),
      queueKey: "approvals",
      taskId: "task-208",
      searchQuery: "",
    };
  }

  if (normalizedPath === "/workspace/escalations") {
    return {
      kind: "escalations",
      path: "/workspace/escalations",
      routeFamilyRef: "rf_staff_workspace_child",
      title: titleForRoute("escalations"),
      sectionLabel: sectionForRoute("escalations"),
      queueKey: "callback-follow-up",
      taskId: "task-412",
      searchQuery: "",
    };
  }

  if (normalizedPath === "/workspace/changed") {
    return {
      kind: "changed",
      path: "/workspace/changed",
      routeFamilyRef: "rf_staff_workspace_child",
      title: titleForRoute("changed"),
      sectionLabel: sectionForRoute("changed"),
      queueKey: "changed-since-seen",
      taskId: "task-118",
      searchQuery: "",
    };
  }

  if (normalizedPath === "/workspace/search") {
    const searchQuery = params.get("q") ?? "";
    return {
      kind: "search",
      path: buildStaffPath({ kind: "search", searchQuery }),
      routeFamilyRef: "rf_staff_workspace_child",
      title: titleForRoute("search"),
      sectionLabel: sectionForRoute("search"),
      queueKey: "recommended",
      taskId: null,
      searchQuery,
    };
  }

  if (normalizedPath === "/workspace/support-handoff") {
    return {
      kind: "support-handoff",
      path: "/workspace/support-handoff",
      routeFamilyRef: "rf_staff_workspace_child",
      title: titleForRoute("support-handoff"),
      sectionLabel: sectionForRoute("support-handoff"),
      queueKey: "callback-follow-up",
      taskId: "task-412",
      searchQuery: "",
    };
  }

  return {
    kind: "home",
    path: "/workspace",
    routeFamilyRef: "rf_staff_workspace",
    title: titleForRoute("home"),
    sectionLabel: sectionForRoute("home"),
    queueKey: "recommended",
    taskId: "task-311",
    searchQuery: "",
  };
}

export function defaultAnchorForRoute(route: StaffShellRoute): string {
  switch (route.kind) {
    case "home":
      return "hero-recommended-queue";
    case "queue":
      return `queue-row-${route.queueKey ?? "recommended"}-${requireQueue(route.queueKey ?? "recommended").recommendedTaskId}`;
    case "task":
      return `task-summary-${route.taskId ?? "task-311"}`;
    case "more-info":
      return `more-info-compose-${route.taskId ?? "task-311"}`;
    case "decision":
      return `decision-preview-${route.taskId ?? "task-311"}`;
    case "approvals":
      return "approval-preview-task-208";
    case "escalations":
      return "escalation-preview-task-412";
    case "changed":
      return "changed-delta-task-118";
    case "search":
      return "search-results";
    case "support-handoff":
      return "support-handoff-stub";
  }
}

export function createInitialLedger(
  route: StaffShellRoute,
  runtimeScenario: RuntimeScenario,
): StaffShellLedger {
  return {
    path: route.path,
    selectedAnchorId: defaultAnchorForRoute(route),
    queueKey: route.queueKey ?? "recommended",
    selectedTaskId: route.taskId ?? "task-311",
    previewTaskId: route.taskId ?? "task-311",
    searchQuery: route.searchQuery,
    bufferedUpdateCount: route.kind === "more-info" || route.kind === "decision" ? 2 : 1,
    queuedBatchPending: route.kind === "queue" || route.kind === "home",
    runtimeScenario,
    lastQuietRegionLabel: route.kind === "home" ? "Today workbench hero" : "Queue workboard",
  };
}

const STAFF_MANIFEST_BASE = {
  audienceSurface: "audsurf_clinical_workspace",
  shellType: "staff",
  routeFamilyRefs: ["rf_staff_workspace", "rf_staff_workspace_child"],
  gatewaySurfaceRef: "gws_clinician_workspace",
  gatewaySurfaceRefs: [
    "gws_clinician_workspace",
    "gws_clinician_workspace_child",
    "gws_practice_ops_workspace",
    "gws_assistive_sidecar",
  ],
  surfaceRouteContractRef: "ASRC_050_CLINICAL_WORKSPACE_V1",
  surfacePublicationRef: "ASPR_050_CLINICAL_WORKSPACE_V1",
  audienceSurfaceRuntimeBindingRef: "ASRB_050_CLINICAL_WORKSPACE_V1",
  designContractPublicationBundleRef: "dcpb::clinical_workspace::planned",
  tokenKernelLayeringPolicyRef: "TKLP_SIGNAL_ATLAS_LIVE_V1",
  profileSelectionResolutionRefs: [
    "PSR_050_CLINICAL_WORKSPACE_V1",
    "PSR_050_STAFF_V1",
    "PSR_050_RF_STAFF_WORKSPACE_V1",
    "PSR_050_RF_STAFF_WORKSPACE_CHILD_V1",
  ],
  surfaceStateKernelBindingRefs: [
    "SSKB_050_RF_STAFF_WORKSPACE_V1",
    "SSKB_050_RF_STAFF_WORKSPACE_CHILD_V1",
  ],
  projectionContractVersionSetRef: "PCVS_050_CLINICAL_WORKSPACE_V1",
  runtimePublicationBundleRef: "rpb::clinical_workspace::planned",
  projectionQueryContractRefs: [
    "PQC_050_RF_STAFF_WORKSPACE_V1",
    "PQC_050_RF_STAFF_WORKSPACE_CHILD_V1",
  ],
  projectionQueryContractDigestRefs: [
    "projection-query-digest::0973bb4a4950c84e",
    "projection-query-digest::5e6e47f740c068fa",
  ],
  mutationCommandContractRefs: [
    "MCC_050_RF_STAFF_WORKSPACE_V1",
    "MCC_050_RF_STAFF_WORKSPACE_CHILD_V1",
  ],
  mutationCommandContractDigestRefs: [
    "mutation-command-digest::18af4e7a1c26e0b8",
    "mutation-command-digest::d688764d7d04d722",
  ],
  liveUpdateChannelContractRefs: [
    "LCC_050_RF_STAFF_WORKSPACE_V1",
    "LCC_050_RF_STAFF_WORKSPACE_CHILD_V1",
  ],
  liveUpdateChannelDigestRefs: [
    "live-channel-digest::49525887f7d162dc",
    "live-channel-digest::b377fa0b95ed96af",
  ],
  clientCachePolicyRef: "CP_WORKSPACE_SINGLE_ORG_PRIVATE",
  clientCachePolicyRefs: [
    "CP_ASSISTIVE_ADJUNCT_NO_PERSIST",
    "CP_WORKSPACE_CHILD_PRIVATE_EPHEMERAL",
    "CP_WORKSPACE_SINGLE_ORG_PRIVATE",
  ],
  clientCachePolicyDigestRefs: [
    "cache-policy-digest::2b4638d623680784",
    "cache-policy-digest::eb30b568e5146fc1",
    "cache-policy-digest::7674a539240e0f9e",
  ],
  commandSettlementSchemaRef: "CommandSettlementSchema::staff_workspace::v1",
  commandSettlementSchemaRefs: [
    "CommandSettlementSchema::staff_workspace::v1",
    "CommandSettlementSchema::staff_workspace_child::v1",
  ],
  transitionEnvelopeSchemaRef: "TransitionEnvelopeSchema::staff_workspace::v1",
  transitionEnvelopeSchemaRefs: [
    "TransitionEnvelopeSchema::staff_workspace::v1",
    "TransitionEnvelopeSchema::staff_workspace_child::v1",
  ],
  releaseRecoveryDispositionRef: "RRD_WORKSPACE_READ_ONLY",
  releaseRecoveryDispositionRefs: [
    "RRD_ASSISTIVE_READ_ONLY",
    "RRD_ASSISTIVE_SIDECAR_FROZEN",
    "RRD_WORKSPACE_CHILD_READ_ONLY",
    "RRD_WORKSPACE_CHILD_RECOVERY_ONLY",
    "RRD_WORKSPACE_QUEUE_PLACEHOLDER",
    "RRD_WORKSPACE_READ_ONLY",
  ],
  routeFreezeDispositionRef: "RFD_050_CLINICAL_WORKSPACE_V1",
  routeFreezeDispositionRefs: ["RFD_050_CLINICAL_WORKSPACE_V1"],
  designContractLintVerdictRef: "dclv::clinical_workspace::seed_ready",
  profileLayeringDigestRef: "81672401de8a72af",
  kernelPropagationDigestRef: "5a17eb84d7331069",
  accessibilitySemanticCoverageProfileRefs: [
    "ASCP_050_RF_STAFF_WORKSPACE_V1",
    "ASCP_050_RF_STAFF_WORKSPACE_CHILD_V1",
  ],
  automationAnchorProfileRefs: [
    "AAP_050_RF_STAFF_WORKSPACE_V1",
    "AAP_050_RF_STAFF_WORKSPACE_CHILD_V1",
  ],
  surfaceStateSemanticsProfileRefs: [
    "SSSP_050_RF_STAFF_WORKSPACE_V1",
    "SSSP_050_RF_STAFF_WORKSPACE_CHILD_V1",
  ],
  source_refs: [
    "prompt/116.md",
    "prompt/shared_operating_contract_116_to_125.md",
    "blueprint/staff-workspace-interface-architecture.md#Route family",
    "blueprint/staff-workspace-interface-architecture.md#WorkspaceNavigationLedger",
    "blueprint/platform-frontend-blueprint.md#PersistentShell",
    "blueprint/forensic-audit-findings.md#Finding 92",
  ],
} as const;

function scenarioManifestTuple(runtimeScenario: RuntimeScenario) {
  switch (runtimeScenario) {
    case "live":
      return {
        browserPostureState: "publishable_live" as const,
        designContractLintState: "pass" as const,
        accessibilityCoverageState: "complete" as const,
        projectionCompatibilityState: "exact" as const,
        runtimeBindingState: "exact" as const,
        runtimePublicationState: "published" as const,
        publicationParityState: "exact" as const,
        manifestState: "current" as const,
        accessibilityCoverageDigestRef: "acd::staff_workspace::seed_live",
        projectionCompatibilityDigestRef: "pcd::staff_workspace::seed_live",
        generatedAt: "2026-04-13T21:00:00Z",
      };
    case "stale_review":
      return {
        browserPostureState: "read_only" as const,
        designContractLintState: "pass" as const,
        accessibilityCoverageState: "complete" as const,
        projectionCompatibilityState: "constrained" as const,
        runtimeBindingState: "exact" as const,
        runtimePublicationState: "published" as const,
        publicationParityState: "stale" as const,
        manifestState: "drifted" as const,
        accessibilityCoverageDigestRef: "acd::staff_workspace::seed_live",
        projectionCompatibilityDigestRef: "pcd::staff_workspace::stale_review",
        generatedAt: "2026-04-13T21:05:00Z",
      };
    case "read_only":
      return {
        browserPostureState: "read_only" as const,
        designContractLintState: "drifted" as const,
        accessibilityCoverageState: "complete" as const,
        projectionCompatibilityState: "constrained" as const,
        runtimeBindingState: "exact" as const,
        runtimePublicationState: "stale" as const,
        publicationParityState: "stale" as const,
        manifestState: "drifted" as const,
        accessibilityCoverageDigestRef: "acd::staff_workspace::read_only",
        projectionCompatibilityDigestRef: "pcd::staff_workspace::read_only",
        generatedAt: "2026-04-13T21:10:00Z",
      };
    case "recovery_only":
      return {
        browserPostureState: "recovery_only" as const,
        designContractLintState: "pass" as const,
        accessibilityCoverageState: "degraded" as const,
        projectionCompatibilityState: "recovery_only" as const,
        runtimeBindingState: "stale" as const,
        runtimePublicationState: "published" as const,
        publicationParityState: "exact" as const,
        manifestState: "drifted" as const,
        accessibilityCoverageDigestRef: "acd::staff_workspace::recovery_only",
        projectionCompatibilityDigestRef: "pcd::staff_workspace::recovery_only",
        generatedAt: "2026-04-13T21:15:00Z",
      };
    case "blocked":
      return {
        browserPostureState: "blocked" as const,
        designContractLintState: "blocked" as const,
        accessibilityCoverageState: "blocked" as const,
        projectionCompatibilityState: "blocked" as const,
        runtimeBindingState: "blocked" as const,
        runtimePublicationState: "withdrawn" as const,
        publicationParityState: "withdrawn" as const,
        manifestState: "rejected" as const,
        accessibilityCoverageDigestRef: "acd::staff_workspace::blocked",
        projectionCompatibilityDigestRef: "pcd::staff_workspace::blocked",
        generatedAt: "2026-04-13T21:20:00Z",
      };
  }
}

export function createStaffManifest(
  runtimeScenario: RuntimeScenario,
): StaffFrontendContractManifest {
  const tuple = scenarioManifestTuple(runtimeScenario);
  return {
    ...generateFrontendContractManifest({
    frontendContractManifestId: `FCM_116_STAFF_WORKSPACE_${runtimeScenario.toUpperCase()}`,
    ...STAFF_MANIFEST_BASE,
    ...tuple,
    }),
    shellType: "staff",
  };
}

function surfaceAuthorityStateForScenario(
  runtimeScenario: RuntimeScenario,
): ReleaseTrustFreezeVerdictLike["surfaceAuthorityState"] {
  switch (runtimeScenario) {
    case "live":
      return "live";
    case "stale_review":
    case "read_only":
      return "diagnostic_only";
    case "recovery_only":
      return "recovery_only";
    case "blocked":
      return "blocked";
  }
}

function mutationAuthorityForScenario(
  runtimeScenario: RuntimeScenario,
): ReleaseTrustFreezeVerdictLike["mutationAuthorityState"] {
  switch (surfaceAuthorityStateForScenario(runtimeScenario)) {
    case "live":
      return "enabled";
    case "diagnostic_only":
      return "observe_only";
    case "recovery_only":
      return "governed_recovery";
    case "blocked":
      return "blocked";
  }
}

export function createStaffRouteAuthority(
  route: StaffShellRoute,
  runtimeScenario: RuntimeScenario,
): StaffRouteAuthorityArtifacts {
  const manifest = createStaffManifest(runtimeScenario);
  const verdict = validateFrontendContractManifest(manifest, {
    routeFamilyRef: route.routeFamilyRef,
  });
  const runtimeBinding: AudienceSurfaceRuntimeBindingLike = {
    audienceSurfaceRuntimeBindingId: manifest.audienceSurfaceRuntimeBindingRef,
    audienceSurface: manifest.audienceSurface,
    routeFamilyRefs: manifest.routeFamilyRefs,
    gatewaySurfaceRefs: manifest.gatewaySurfaceRefs,
    surfaceRouteContractRef: manifest.surfaceRouteContractRef,
    surfacePublicationRef: manifest.surfacePublicationRef,
    runtimePublicationBundleRef: manifest.runtimePublicationBundleRef,
    designContractPublicationBundleRef: manifest.designContractPublicationBundleRef,
    bindingState:
      runtimeScenario === "live"
        ? "live"
        : runtimeScenario === "stale_review" || runtimeScenario === "read_only"
          ? "read_only"
          : runtimeScenario === "recovery_only"
            ? "recovery_only"
            : "blocked",
    surfaceAuthorityState: surfaceAuthorityStateForScenario(runtimeScenario),
    releaseRecoveryDispositionRefs: manifest.releaseRecoveryDispositionRefs,
    routeFreezeDispositionRefs: manifest.routeFreezeDispositionRefs,
    surfaceTupleHash: manifest.surfaceAuthorityTupleHash,
    generatedAt: manifest.generatedAt,
  };
  const releaseVerdict: ReleaseTrustFreezeVerdictLike = {
    releaseTrustFreezeVerdictId: `RTFV_116_${route.routeFamilyRef.toUpperCase()}_${runtimeScenario.toUpperCase()}`,
    audienceSurface: manifest.audienceSurface,
    routeFamilyRef: route.routeFamilyRef,
    surfaceAuthorityState: surfaceAuthorityStateForScenario(runtimeScenario),
    calmTruthState: runtimeScenario === "live" ? "allowed" : "suppressed",
    mutationAuthorityState: mutationAuthorityForScenario(runtimeScenario),
    blockerRefs:
      runtimeScenario === "live"
        ? []
        : runtimeScenario === "blocked"
          ? ["BLOCKER_RELEASE_PARITY_NOT_EXACT", "BLOCKER_RUNTIME_PUBLICATION_WITHDRAWN"]
          : ["BLOCKER_CALM_OR_WRITABLE_POSTURE_SUPPRESSED"],
    evaluatedAt: manifest.generatedAt,
  };

  let routeFreezeDisposition: RouteFreezeDispositionLike | null = null;
  let releaseRecoveryDisposition: ReleaseRecoveryDispositionLike | null = null;
  if (runtimeScenario !== "live") {
    routeFreezeDisposition = {
      routeFreezeDispositionId: `RFD_116_${route.routeFamilyRef.toUpperCase()}_${runtimeScenario.toUpperCase()}`,
      routeFamilyRef: route.routeFamilyRef,
      freezeState:
        runtimeScenario === "blocked"
          ? "blocked"
          : runtimeScenario === "recovery_only"
            ? "recovery_only"
            : "read_only",
      sameShellDisposition:
        runtimeScenario === "blocked"
          ? "downgrade_blocked"
          : runtimeScenario === "recovery_only"
            ? "downgrade_recovery_only"
            : "downgrade_read_only",
      recoveryActionLabel:
        runtimeScenario === "blocked"
          ? "Open recovery summary"
          : runtimeScenario === "recovery_only"
            ? "Restore the last safe task snapshot"
            : "Review the current tuple",
      reasonRefs:
        runtimeScenario === "blocked"
          ? ["runtime_publication_withdrawn", "manifest_state_rejected"]
          : runtimeScenario === "recovery_only"
            ? ["runtime_binding_stale", "focus_protection_invalidated"]
            : ["projection_truth_under_review"],
    };
    releaseRecoveryDisposition = {
      releaseRecoveryDispositionId: `RRD_116_${route.routeFamilyRef.toUpperCase()}_${runtimeScenario.toUpperCase()}`,
      posture:
        runtimeScenario === "blocked"
          ? "blocked"
          : runtimeScenario === "recovery_only"
            ? "recovery_only"
            : "read_only",
      label:
        runtimeScenario === "blocked"
          ? "Blocked recovery"
          : runtimeScenario === "recovery_only"
            ? "Same-shell recovery"
            : "Read-only preserve",
      summary:
        runtimeScenario === "blocked"
          ? "The shell keeps the last safe task summary while publication authority is withdrawn."
          : runtimeScenario === "recovery_only"
            ? "Focus-protected work stays frozen in place until the reviewer restores the tuple."
            : "The same shell remains visible, but writable posture is fenced until review completes.",
      actionLabel:
        runtimeScenario === "blocked"
          ? "Return to last safe summary"
          : runtimeScenario === "recovery_only"
            ? "Restore draft and review delta"
            : "Recheck decisive delta",
      continuityMode:
        runtimeScenario === "blocked"
          ? "review_summary"
          : runtimeScenario === "recovery_only"
            ? "resume_return_contract"
            : "refresh_tuple",
      reasonRefs:
        runtimeScenario === "blocked"
          ? ["manifest_state_rejected", "runtime_publication_withdrawn"]
          : runtimeScenario === "recovery_only"
            ? ["runtime_binding_stale", "workspace_focus_protection_invalidated"]
            : ["projection_truth_under_review"],
    };
  }

  const guardManifest = {
    ...manifest,
    browserPostureState:
      runtimeScenario === "live"
        ? "live"
        : runtimeScenario === "recovery_only"
          ? "recovery_only"
          : runtimeScenario === "blocked"
            ? "blocked"
            : "read_only",
  } as const;

  const guardDecision = resolveRouteGuardDecision({
    routeFamilyRef: route.routeFamilyRef,
    manifest: guardManifest,
    runtimeBinding,
    hydrationState: runtimeScenario === "live" ? "binding_ready" : "binding_invalid",
    audienceContext: {
      audienceSurface: manifest.audienceSurface,
      channelProfile: "browser",
    },
    releaseVerdict,
    routeFreezeDisposition,
    releaseRecoveryDisposition,
  });

  return {
    manifest,
    verdict,
    runtimeBinding,
    releaseVerdict,
    routeFreezeDisposition,
    releaseRecoveryDisposition,
    guardDecision,
  };
}

function postureTupleForScenario(runtimeScenario: RuntimeScenario): {
  trust: ProjectionTrustState;
  freshness: ProjectionFreshnessState;
  transport: ProjectionTransportState;
  actionability: ProjectionActionabilityState;
  outcome: StatusTruthInput["authoritativeOutcomeState"];
  saveState: StatusTruthInput["saveState"];
} {
  switch (runtimeScenario) {
    case "live":
      return {
        trust: "trusted",
        freshness: "fresh",
        transport: "live",
        actionability: "live",
        outcome: "pending",
        saveState: "idle",
      };
    case "stale_review":
      return {
        trust: "degraded",
        freshness: "stale_review",
        transport: "live",
        actionability: "frozen",
        outcome: "review_required",
        saveState: "saved",
      };
    case "read_only":
      return {
        trust: "degraded",
        freshness: "stale_review",
        transport: "paused",
        actionability: "frozen",
        outcome: "review_required",
        saveState: "saved",
      };
    case "recovery_only":
      return {
        trust: "partial",
        freshness: "blocked_recovery",
        transport: "reconnecting",
        actionability: "recovery_only",
        outcome: "recovery_required",
        saveState: "failed",
      };
    case "blocked":
      return {
        trust: "blocked",
        freshness: "blocked_recovery",
        transport: "disconnected",
        actionability: "recovery_only",
        outcome: "failed",
        saveState: "failed",
      };
  }
}

export function buildWorkspaceStatus(
  route: StaffShellRoute,
  runtimeScenario: RuntimeScenario,
  task: StaffQueueCase | null,
): { statusInput: StatusTruthInput; pulse: CasePulseContract } {
  const tuple = postureTupleForScenario(runtimeScenario);
  const workspaceSeed = requireWorkspaceStatusSeed();
  const statusInput = cloneJson(workspaceSeed.statusInput);
  const pulse = cloneJson(workspaceSeed.pulse);

  statusInput.dominantActionLabel =
    route.kind === "more-info"
      ? "Send bounded more-info request"
      : route.kind === "decision"
        ? "Confirm the current decision preview"
        : route.kind === "approvals"
          ? "Advance the promoted approval preview"
          : route.kind === "escalations"
            ? "Relieve the escalated callback blocker"
            : route.kind === "changed"
              ? "Acknowledge the authoritative delta packet"
              : route.kind === "search"
                ? "Review the exact-match search result"
                : route.kind === "support-handoff"
                  ? "Keep support handoff bounded"
                  : task
                    ? "Advance the current case safely"
                    : "Resume the recommended queue";

  statusInput.authority.macroStateRef =
    route.kind === "escalations"
      ? "action_required"
      : route.kind === "approvals"
        ? "reviewing_next_steps"
        : runtimeScenario === "blocked"
          ? "blocked"
          : runtimeScenario === "recovery_only"
            ? "recovery_required"
            : "in_review";
  statusInput.authority.projectionTrustState = tuple.trust;
  statusInput.authority.degradeMode =
    runtimeScenario === "blocked"
      ? "recovery_required"
      : runtimeScenario === "live"
        ? "quiet_pending"
        : "refresh_required";
  statusInput.freshnessEnvelope.projectionFreshnessState = tuple.freshness;
  statusInput.freshnessEnvelope.transportState = tuple.transport;
  statusInput.freshnessEnvelope.actionabilityState = tuple.actionability;
  statusInput.freshnessEnvelope.reasonRefs =
    runtimeScenario === "live"
      ? ["workspace_queue_current"]
      : runtimeScenario === "recovery_only"
        ? ["focus_protection_invalidated", "runtime_binding_stale"]
        : ["decisive_delta_requires_review"];
  statusInput.authoritativeOutcomeState = tuple.outcome;
  statusInput.saveState = tuple.saveState;
  statusInput.lastChangedAt = "2026-04-13T13:52:00Z";

  pulse.entityRef = task?.id ?? "workspace-home";
  pulse.entityType = route.kind === "home" ? "Workspace home" : "Review task";
  pulse.macroState = statusInput.authority.macroStateRef;
  pulse.headline =
    route.kind === "home"
      ? "Clinical workspace start-of-day"
      : task
        ? `${task.id.toUpperCase()} / ${task.patientLabel}`
        : "Clinical workspace";
  pulse.subheadline =
    route.kind === "home"
      ? "One quiet shell keeps queue continuity, interruptions, and dominant action aligned."
      : task
        ? task.previewSummary
        : "Same-shell route entry keeps task, queue, and dock truth together.";
  pulse.primaryNextActionLabel = statusInput.dominantActionLabel;
  pulse.ownershipOrActorSummary =
    route.kind === "support-handoff"
      ? "Support remains a separate shell family"
      : task
        ? `${task.patientRef} · ${task.launchQueue}`
        : "Assigned to clinical workspace";
  pulse.urgencyBand =
    runtimeScenario === "blocked"
      ? "Recovery only"
      : task?.urgencyTone === "critical"
        ? "Urgent review"
        : task?.urgencyTone === "caution"
          ? "Guarded review"
          : "Quiet next step";
  pulse.confirmationPosture =
    runtimeScenario === "live"
      ? "Writable status available"
      : runtimeScenario === "recovery_only"
        ? "Recovery posture"
        : runtimeScenario === "blocked"
          ? "Blocked by release truth"
          : "Read-only preserve";
  pulse.changedSinceSeen =
    route.kind === "changed"
      ? "Changed since seen: reopen state and ownership context are preserved."
      : task?.deltaSummary ?? "Changed since seen: no decisive delta currently promoted.";
  pulse.lastMeaningfulUpdateAt = statusInput.lastChangedAt;
  pulse.stateAxes = [
    {
      key: "lifecycle",
      label: "Lifecycle",
      value:
        route.kind === "approvals"
          ? "Approval review"
          : route.kind === "escalations"
            ? "Escalation active"
            : route.kind === "changed"
              ? "Resumed review"
              : runtimeScenario === "live"
                ? "In review"
                : runtimeScenario === "blocked"
                  ? "Recovery required"
                  : "Review required",
      detail: "The workspace keeps one current view while the route changes.",
    },
    {
      key: "ownership",
      label: "Ownership",
      value: task?.state === "reassigned" ? "Reassigned" : "Queue row pinned",
      detail: "Queue, task, and quiet-return target remain explicit in the ledger.",
    },
    {
      key: "trust",
      label: "Trust",
      value: tuple.trust === "trusted" ? "Trusted" : tuple.trust === "blocked" ? "Blocked" : "Degraded",
      detail: "Runtime authority, not local optimism, decides whether the shell is writable.",
    },
    {
      key: "urgency",
      label: "Urgency",
      value: pulse.urgencyBand,
      detail: "Interruption budgeting promotes only one urgent path at a time.",
    },
    {
      key: "interaction",
      label: "Interaction",
      value:
        tuple.actionability === "live"
          ? "Writable"
          : tuple.actionability === "frozen"
            ? "Frozen"
            : "Recovery only",
      detail: "Protected work freezes in place instead of losing the current draft or anchor.",
    },
  ];

  return { statusInput, pulse };
}

export function buildSurfacePosture(
  route: StaffShellRoute,
  authority: StaffRouteAuthorityArtifacts,
  options: {
    queueRows: readonly StaffQueueCase[];
    selectedAnchorId: string;
    searchQuery: string;
  },
): SurfacePostureContract | null {
  if (route.kind === "queue" && options.queueRows.length === 0) {
    return resolveSurfacePostureContract({
      ...requireWorkspaceEmptySeed(),
      title: "No task needs action in this filtered queue right now",
      summary:
        "The queue is quiet for the current filter tuple, and the safest next action is to review saved filters or move to the adjacent queue.",
      selectedAnchor: {
        anchorId: options.selectedAnchorId,
        label: route.queueKey ?? "recommended",
        summary: "Queue selection remains explicit under empty posture.",
        returnLabel: "Back to the current queue",
      },
    });
  }

  if (route.kind === "search" && options.searchQuery && options.queueRows.length === 0) {
    return resolveSurfacePostureContract({
      ...requireWorkspaceEmptySeed(),
      title: "No exact-match result is currently published for this search",
      summary:
        "The same shell preserves your search term, route memory, and return target instead of dropping to a generic empty page.",
      regionLabel: "Search results",
      dominantQuestion: "Should I broaden the search or return to the current queue context?",
      nextSafeActionLabel: "Review search filters",
      selectedAnchor: {
        anchorId: options.selectedAnchorId,
        label: "Search results",
        summary: "The search route keeps the current query and return posture visible.",
        returnLabel: "Back to search results",
      },
    });
  }

  if (authority.guardDecision.effectivePosture === "recovery_only") {
    return resolveSurfacePostureContract({
      ...requireWorkspacePartialSeed(),
      postureClass: "bounded_recovery",
      title: "Protected work is frozen in place until the runtime tuple recovers",
      summary:
        "The current draft, selected anchor, and last safe summary stay visible while buffered updates wait behind the focus-protection lease.",
      regionLabel: "Protected composition recovery",
      dominantQuestion: "What can the reviewer safely restore before the current task continues?",
      nextSafeActionLabel: "Restore draft and review delta",
      visibilityState: "full",
      freshnessState: "stale_review",
      actionabilityState: "recovery_only",
      degradedMode: "bounded_recovery",
      selectedAnchor: {
        anchorId: options.selectedAnchorId,
        label: "Protected composition",
        summary: "Draft, compare target, and queue anchor remain pinned.",
        returnLabel: "Back to the protected composition anchor",
      },
      recoveryActions: [
        {
          actionId: "restore_draft",
          label: "Restore draft and review delta",
          detail: "Return to the last safe draft without replacing the current task or queue context.",
          importance: "dominant",
          actionKind: "resume",
        },
        {
          actionId: "review_summary",
          label: "Open last safe summary",
          detail: "Inspect the last trusted task summary while the live tuple is repaired.",
          importance: "secondary",
          actionKind: "return",
        },
      ],
    });
  }

  if (authority.guardDecision.effectivePosture === "blocked") {
    return resolveSurfacePostureContract({
      ...requireWorkspacePartialSeed(),
      postureClass: "blocked_recovery",
      title: "The workspace keeps context, but release truth blocks live action",
      summary:
        "The last safe queue row and task summary remain visible, yet commit and handoff actions stay suppressed until publication authority returns.",
      regionLabel: "Blocked release recovery",
      dominantQuestion: "What is the single safe recovery path while the workspace remains blocked?",
      nextSafeActionLabel: "Open recovery summary",
      visibilityState: "blocked",
      freshnessState: "blocked_recovery",
      actionabilityState: "blocked",
      degradedMode: "bounded_recovery",
      selectedAnchor: {
        anchorId: options.selectedAnchorId,
        label: "Blocked workspace anchor",
        summary: "The current row and quiet-return target remain visible even while action is blocked.",
        returnLabel: "Back to the blocked workspace anchor",
      },
      recoveryActions: [
        {
          actionId: "open_recovery_summary",
          label: "Open recovery summary",
          detail: "Preserve the task context while the operator reviews the release blocker evidence.",
          importance: "dominant",
          actionKind: "resume",
        },
      ],
    });
  }

  if (authority.guardDecision.effectivePosture === "read_only") {
    return resolveSurfacePostureContract({
      ...requireWorkspacePartialSeed(),
      postureClass: "read_only",
      title: "The current task remains visible, but writable posture is fenced",
      summary:
        "Queue truth, task summary, and the decision rail stay present while the reviewer rechecks the current delta or approval state.",
      regionLabel: "Read-only preserve",
      dominantQuestion: "What can still be reviewed safely without reopening mutation posture?",
      nextSafeActionLabel: "Review the visible summary",
      visibilityState: "full",
      freshnessState: "stale_review",
      actionabilityState: "read_only",
      degradedMode: "none",
      selectedAnchor: {
        anchorId: options.selectedAnchorId,
        label: "Read-only task anchor",
        summary: "The same task anchor stays pinned while commit posture is fenced.",
        returnLabel: "Back to the current task anchor",
      },
    });
  }

  return null;
}

export function deriveTaskForRoute(route: StaffShellRoute): StaffQueueCase | null {
  if (!route.taskId) {
    return route.kind === "approvals"
      ? requireCase("task-208")
      : route.kind === "escalations"
        ? requireCase("task-412")
        : route.kind === "changed"
          ? requireCase("task-118")
          : route.kind === "support-handoff"
            ? requireCase("task-412")
            : null;
  }
  return requireCase(route.taskId);
}

export function deriveVisibleQueueRows(
  route: StaffShellRoute,
  ledger: StaffShellLedger,
): StaffQueueCase[] {
  if (route.kind === "search") {
    return listSearchCases(route.searchQuery || ledger.searchQuery);
  }
  if (route.kind === "approvals") {
    return staffCases.filter((item) => item.state === "approval");
  }
  if (route.kind === "escalations") {
    return staffCases.filter((item) => item.state === "escalated" || item.state === "blocked");
  }
  if (route.kind === "changed") {
    return staffCases.filter(
      (item) => item.state === "changed" || item.state === "reassigned" || item.deltaClass !== "contextual",
    );
  }
  const queueKey = route.queueKey ?? ledger.queueKey ?? "recommended";
  const rows = listQueueCases(queueKey);
  return ledger.queuedBatchPending ? rows : applyQueueChangeBatch(rows, ledger.selectedTaskId);
}

export function reduceLedgerForNavigation(input: {
  ledger: StaffShellLedger;
  currentRoute: StaffShellRoute;
  nextRoute: StaffShellRoute;
  runtimeScenario: RuntimeScenario;
}): {
  ledger: StaffShellLedger;
  boundaryState: string;
  restoreStorageKey: string;
} {
  const boundaryDecision = resolveShellBoundaryDecision({
    currentRouteFamilyRef: input.currentRoute.routeFamilyRef,
    candidateRouteFamilyRef: input.nextRoute.routeFamilyRef,
    runtimeScenario: input.runtimeScenario,
  });
  const carryForwardPlan = createContinuityCarryForwardPlan(boundaryDecision);
  const restorePlan = createContinuityRestorePlan({
    shellSlug: "clinical-workspace",
    routeFamilyRef: input.nextRoute.routeFamilyRef,
    selectedAnchor: input.ledger.selectedAnchorId,
    foldState: "expanded",
    runtimeScenario: input.runtimeScenario,
  });
  const nextAnchor = carryForwardPlan.preserveSelectedAnchor
    ? input.ledger.selectedAnchorId
    : defaultAnchorForRoute(input.nextRoute);

  return {
    ledger: {
      ...input.ledger,
      path: input.nextRoute.path,
      queueKey: input.nextRoute.queueKey ?? input.ledger.queueKey,
      selectedTaskId: input.nextRoute.taskId ?? input.ledger.selectedTaskId,
      previewTaskId: input.nextRoute.taskId ?? input.ledger.previewTaskId,
      selectedAnchorId: nextAnchor,
      searchQuery: input.nextRoute.searchQuery,
      lastQuietRegionLabel:
        input.nextRoute.kind === "home" ? "Today workbench hero" : input.ledger.lastQuietRegionLabel,
    },
    boundaryState: boundaryDecision.boundaryState,
    restoreStorageKey: restorePlan.restoreStorageKey,
  };
}

export function defaultDecisionOption(task: StaffQueueCase): string {
  return task.decisionOptions[0] ?? "Review the current task";
}

export function staffAutomationProfile(routeFamilyRef: StaffShellRoute["routeFamilyRef"]) {
  return resolveAutomationAnchorProfile(routeFamilyRef);
}
