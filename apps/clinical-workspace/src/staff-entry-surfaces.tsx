import { useEffect, useMemo, useState, type ReactNode } from "react";
import { VecellLogoLockup, formatVecellTitle } from "@vecells/design-system";
import { resolvePharmacyProductMergePreviewForRequest } from "../../../packages/domains/pharmacy/src/phase6-pharmacy-product-merge-preview";

export type StaffEntryScenario = "quiet" | "busy" | "blocking" | "degraded";
export type StaffEntryRouteKey =
  | "workspace-home"
  | "workspace-queue"
  | "ops-overview"
  | "ops-support"
  | "ops-support-inbox";

export interface RecommendedQueueProjection {
  readonly queueKey: string;
  readonly label: string;
  readonly summary: string;
  readonly waitingCount: number;
  readonly changeCount: number;
  readonly breachWindowLabel: string;
  readonly nextSafeActionLabel: string;
  readonly launchPath: string;
}

export interface WorkspaceHomeProjection {
  readonly projectionName: "WorkspaceHomeProjection";
  readonly title: string;
  readonly guidance: string;
  readonly safeActionPromise: string;
  readonly recommendedQueue: RecommendedQueueProjection;
}

export interface StaffInboxProjection {
  readonly projectionName: "StaffInboxProjection";
  readonly backlogLabel: string;
  readonly changedSinceSeenLabel: string;
  readonly approvalsLabel: string;
  readonly callbacksLabel: string;
}

export interface PersonalWorklistProjection {
  readonly projectionName: "PersonalWorklistProjection";
  readonly taskId: string;
  readonly label: string;
  readonly summary: string;
  readonly changedSinceSeen: boolean;
  readonly blocked: boolean;
  readonly resumePath: string;
}

export interface TeamQueueSummaryProjection {
  readonly projectionName: "TeamQueueSummaryProjection";
  readonly queueKey: string;
  readonly label: string;
  readonly waitingCount: number;
  readonly breachWindowLabel: string;
  readonly trend: "steady" | "rising" | "contained";
}

export interface InterruptionDigestItem {
  readonly key: string;
  readonly label: string;
  readonly countLabel: string;
  readonly emphasis: "stable" | "watch" | "blocked";
  readonly summary: string;
}

export interface InterruptionDigestProjection {
  readonly projectionName: "InterruptionDigestProjection";
  readonly summary: string;
  readonly items: readonly InterruptionDigestItem[];
}

export interface ApprovalInboxProjection {
  readonly projectionName: "ApprovalInboxProjection";
  readonly pendingCount: number;
  readonly oldestAgeLabel: string;
}

export interface CallbackWorklistProjection {
  readonly projectionName: "CallbackWorklistProjection";
  readonly callbackCount: number;
  readonly oldestAgeLabel: string;
}

export interface EscalationInboxProjection {
  readonly projectionName: "EscalationInboxProjection";
  readonly escalationCount: number;
  readonly highestSeverityLabel: string;
}

export interface ChangedSinceSeenProjection {
  readonly projectionName: "ChangedSinceSeenProjection";
  readonly changedCount: number;
  readonly changedLabels: readonly string[];
}

export interface CrossDomainTaskSummaryProjection {
  readonly projectionName: "CrossDomainTaskSummaryProjection";
  readonly domain: string;
  readonly label: string;
  readonly countLabel: string;
  readonly summary: string;
  readonly launchPath: string;
  readonly requestRef: string | null;
  readonly pharmacyCaseId: string | null;
  readonly changedSinceSeenLabel: string | null;
  readonly notificationStateLabel: string | null;
  readonly continuitySummary: string | null;
}

export interface DependencyDigestProjection {
  readonly projectionName: "DependencyDigestProjection";
  readonly state: "clear" | "watch" | "blocking" | "degraded";
  readonly title: string;
  readonly summary: string;
  readonly resolutionLabel: string;
}

export interface PharmacyConsoleSummaryProjection {
  readonly projectionName: "PharmacyConsoleSummaryProjection";
  readonly queueLabel: string;
  readonly refillCount: number;
  readonly interventionCount: number;
}

export interface OpsNorthStarMetric {
  readonly label: string;
  readonly value: string;
  readonly status: "stable" | "watch" | "blocked";
}

export interface OpsOverviewProjection {
  readonly title: string;
  readonly summary: string;
  readonly sparseMessage: string;
  readonly nextLensLabel: string;
  readonly metrics: readonly OpsNorthStarMetric[];
}

export interface BottleneckRadarItem {
  readonly queueKey: string;
  readonly label: string;
  readonly loadPercent: number;
  readonly countLabel: string;
  readonly status: "contained" | "watch" | "blocked";
}

export interface SupportDeskShortcut {
  readonly label: string;
  readonly countLabel: string;
  readonly summary: string;
  readonly launchPath: string;
}

export interface SupportDeskHomeProjection {
  readonly projectionName: "SupportDeskHomeProjection";
  readonly title: string;
  readonly summary: string;
  readonly unifiedStatus: string;
  readonly readOnlyPosture: string;
  readonly queueShortcuts: readonly SupportDeskShortcut[];
}

export interface SupportInboxRow {
  readonly supportTicketId: string;
  readonly subject: string;
  readonly queue: string;
  readonly stateLabel: string;
  readonly evidenceLabel: string;
  readonly launchLabel: string;
  readonly launchPath: string;
  readonly changed: boolean;
  readonly blocked: boolean;
}

export interface SupportInboxProjection {
  readonly projectionName: "SupportInboxProjection";
  readonly viewKey: string;
  readonly title: string;
  readonly summary: string;
  readonly rows: readonly SupportInboxRow[];
}

type SupportInboxViewKey = "all" | "repair" | "changed" | "replay";

export interface SupportEntryRouteContract {
  readonly routeKey: StaffEntryRouteKey;
  readonly pathPattern: string;
  readonly shellFamily: "staff_entry_same_shell";
  readonly continuityKey: string;
  readonly selectedAnchorPolicy: string;
  readonly readOnlyPosture: "live" | "guarded" | "read_only" | "blocked";
  readonly allowedHandoffDestinations: readonly string[];
  readonly dominantActionLabel: string;
  readonly routeLabel: string;
  readonly testId: string;
}

interface ParsedRoute {
  readonly routeKey: StaffEntryRouteKey;
  readonly queueKey?: string;
  readonly viewKey?: string;
}

interface StaffEntryDataset {
  readonly workspaceHome: WorkspaceHomeProjection;
  readonly staffInbox: StaffInboxProjection;
  readonly personalWorklist: PersonalWorklistProjection;
  readonly teamQueues: readonly TeamQueueSummaryProjection[];
  readonly interruptionDigest: InterruptionDigestProjection;
  readonly approvalInbox: ApprovalInboxProjection;
  readonly callbackWorklist: CallbackWorklistProjection;
  readonly escalationInbox: EscalationInboxProjection;
  readonly changedSinceSeen: ChangedSinceSeenProjection;
  readonly crossDomainTasks: readonly CrossDomainTaskSummaryProjection[];
  readonly dependencyDigest: DependencyDigestProjection;
  readonly pharmacyConsoleSummary: PharmacyConsoleSummaryProjection;
  readonly opsOverview: OpsOverviewProjection;
  readonly bottleneckRadar: readonly BottleneckRadarItem[];
  readonly supportDeskHome: SupportDeskHomeProjection;
  readonly supportInboxViews: Record<SupportInboxViewKey, SupportInboxProjection>;
}

const VISUAL_MODE = "Staff_Entry_Quiet_Control";
const STYLE_SYSTEM = "Quiet_Internal_Control";

export const ROUTE_METADATA_REGISTRY: Record<StaffEntryRouteKey, SupportEntryRouteContract> = {
  "workspace-home": {
    routeKey: "workspace-home",
    pathPattern: "/workspace",
    shellFamily: "staff_entry_same_shell",
    continuityKey: "staff.workspace.queue",
    selectedAnchorPolicy: "recommended-queue-first",
    readOnlyPosture: "live",
    allowedHandoffDestinations: ["/workspace/queue/:queueKey", "/ops/overview", "/ops/support"],
    dominantActionLabel: "Open the recommended queue and continue safely",
    routeLabel: "Workspace",
    testId: "WorkspaceHomeRoute",
  },
  "workspace-queue": {
    routeKey: "workspace-queue",
    pathPattern: "/workspace/queue/:queueKey",
    shellFamily: "staff_entry_same_shell",
    continuityKey: "staff.workspace.queue",
    selectedAnchorPolicy: "selected-queue-persists",
    readOnlyPosture: "guarded",
    allowedHandoffDestinations: ["/workspace", "/ops/overview", "/ops/support"],
    dominantActionLabel: "Resume the highest-safety case inside the selected queue",
    routeLabel: "Queue",
    testId: "WorkspaceQueueRoute",
  },
  "ops-overview": {
    routeKey: "ops-overview",
    pathPattern: "/ops/overview",
    shellFamily: "staff_entry_same_shell",
    continuityKey: "ops.overview.control",
    selectedAnchorPolicy: "ops-north-star-first",
    readOnlyPosture: "guarded",
    allowedHandoffDestinations: ["/workspace", "/workspace/queue/:queueKey", "/ops/support"],
    dominantActionLabel: "Inspect the next constrained bottleneck without losing place",
    routeLabel: "Ops Overview",
    testId: "OpsOverviewRoute",
  },
  "ops-support": {
    routeKey: "ops-support",
    pathPattern: "/ops/support",
    shellFamily: "staff_entry_same_shell",
    continuityKey: "support.workspace.tickets",
    selectedAnchorPolicy: "support-home-entry",
    readOnlyPosture: "guarded",
    allowedHandoffDestinations: ["/ops/support/inbox/:viewKey", "/workspace", "/ops/overview"],
    dominantActionLabel: "Enter the support inbox from one governed shell",
    routeLabel: "Support Desk",
    testId: "OpsSupportRoute",
  },
  "ops-support-inbox": {
    routeKey: "ops-support-inbox",
    pathPattern: "/ops/support/inbox/:viewKey",
    shellFamily: "staff_entry_same_shell",
    continuityKey: "support.workspace.tickets",
    selectedAnchorPolicy: "support-inbox-view-persists",
    readOnlyPosture: "read_only",
    allowedHandoffDestinations: ["/ops/support", "/workspace", "/ops/overview"],
    dominantActionLabel: "Choose the governed inbox view and launch the next safe ticket workspace",
    routeLabel: "Support Inbox",
    testId: "OpsSupportInboxRoute",
  },
};

const TEAM_QUEUES: readonly TeamQueueSummaryProjection[] = [
  {
    projectionName: "TeamQueueSummaryProjection",
    queueKey: "same-day-review",
    label: "Same-day clinical review",
    waitingCount: 18,
    breachWindowLabel: "37m to breach",
    trend: "steady",
  },
  {
    projectionName: "TeamQueueSummaryProjection",
    queueKey: "follow-up-replies",
    label: "Follow-up replies",
    waitingCount: 11,
    breachWindowLabel: "1h 14m to breach",
    trend: "contained",
  },
  {
    projectionName: "TeamQueueSummaryProjection",
    queueKey: "identity-repair",
    label: "Identity repair holds",
    waitingCount: 4,
    breachWindowLabel: "2h 08m to breach",
    trend: "rising",
  },
];

const SUPPORT_INBOX_ROWS: readonly SupportInboxRow[] = [
  {
    supportTicketId: "support_ticket_218_delivery_failure",
    subject: "Delivery evidence split after callback repair",
    queue: "repair",
    stateLabel: "Changed since seen",
    evidenceLabel: "Timeline settled 4m ago",
    launchLabel: "Launch governed ticket",
    launchPath: "/ops/support/tickets/support_ticket_218_delivery_failure",
    changed: true,
    blocked: false,
  },
  {
    supportTicketId: "support_ticket_219_replay_restore_blocked",
    subject: "Replay restore awaiting external confirmation",
    queue: "replay",
    stateLabel: "Blocked by dependency",
    evidenceLabel: "Restore checkpoint frozen",
    launchLabel: "Open restore status",
    launchPath: "/ops/support/tickets/support_ticket_219_replay_restore_blocked",
    changed: false,
    blocked: true,
  },
  {
    supportTicketId: "support_ticket_219_duplicate_resend",
    subject: "Duplicate resend attempt reused live mutation",
    queue: "repair",
    stateLabel: "Ready for review",
    evidenceLabel: "Idempotent attempt linked",
    launchLabel: "Inspect repair trail",
    launchPath: "/ops/support/tickets/support_ticket_219_duplicate_resend",
    changed: false,
    blocked: false,
  },
];

export function createScenarioDataset(scenario: StaffEntryScenario): StaffEntryDataset {
  const busy = scenario === "busy";
  const blocking = scenario === "blocking";
  const degraded = scenario === "degraded";
  const pharmacyCreatedMerge = resolvePharmacyProductMergePreviewForRequest("request_211_b");
  const pharmacyUrgentReturnMerge = resolvePharmacyProductMergePreviewForRequest("request_215_callback");
  const dominantPharmacyMerge =
    busy || blocking ? pharmacyUrgentReturnMerge ?? pharmacyCreatedMerge : pharmacyCreatedMerge;

  const recommendedQueue: RecommendedQueueProjection = {
    queueKey: "same-day-review",
    label: "Same-day clinical review",
    summary: blocking
      ? "Queue launch is held until the dependency digest confirms chronology is trustworthy."
      : "One safe next action stays dominant even while inbox noise and changed evidence grow.",
    waitingCount: busy ? 31 : blocking ? 18 : degraded ? 20 : 14,
    changeCount: busy ? 9 : blocking ? 4 : degraded ? 6 : 2,
    breachWindowLabel: blocking ? "Hold launch until evidence lag clears" : busy ? "11m to breach" : "37m to breach",
    nextSafeActionLabel: blocking ? "Review dependency banner" : "Open queue and continue safely",
    launchPath: "/workspace/queue/same-day-review",
  };

  const interruptionItems: readonly InterruptionDigestItem[] = [
    {
      key: "approvals",
      label: "Approvals",
      countLabel: busy ? "6 waiting" : "2 waiting",
      emphasis: "watch",
      summary: "Approvals with clinical impact remain one jump away from the main queue.",
    },
    {
      key: "callbacks",
      label: "Callbacks",
      countLabel: busy ? "8 due" : "3 due",
      emphasis: busy ? "watch" : "stable",
      summary: "Callback promises surface alongside queue work so return paths stay explicit.",
    },
    {
      key: "escalations",
      label: "Escalations",
      countLabel: blocking ? "2 blocked" : busy ? "3 active" : "1 active",
      emphasis: blocking ? "blocked" : "watch",
      summary: "Escalations never disappear behind the queue view or support launch.",
    },
    {
      key: "dependency",
      label: "Dependency digest",
      countLabel: blocking ? "1 blocking outage" : degraded ? "1 degraded feed" : "No blockers",
      emphasis: blocking ? "blocked" : degraded ? "watch" : "stable",
      summary: "External chronology lag, replay holds, and read-only fallbacks stay visible.",
    },
  ];

  const supportRows = SUPPORT_INBOX_ROWS.map((row, index) => {
    if (scenario === "blocking" && index === 0) {
      return {
        ...row,
        stateLabel: "Held while chronology rechecks",
        evidenceLabel: "Gateway lag 14m behind live proof",
        blocked: true,
      };
    }
    if (scenario === "degraded" && index === 2) {
      return {
        ...row,
        stateLabel: "Read-only fallback",
        evidenceLabel: "Support action lease paused",
      };
    }
    return row;
  });

  return {
    workspaceHome: {
      projectionName: "WorkspaceHomeProjection",
      title: "Start-of-day queue control",
      guidance: "The first surface answers one question: what is the next safe thing to do right now?",
      safeActionPromise: "Recommended queue, interrupt digest, and support launch share one quiet shell.",
      recommendedQueue,
    },
    staffInbox: {
      projectionName: "StaffInboxProjection",
      backlogLabel: busy ? "31 items waiting" : "14 items waiting",
      changedSinceSeenLabel: busy ? "9 changed since seen" : "2 changed since seen",
      approvalsLabel: busy ? "6 approvals" : "2 approvals",
      callbacksLabel: busy ? "8 callbacks" : "3 callbacks",
    },
    personalWorklist: {
      projectionName: "PersonalWorklistProjection",
      taskId: "task_resume_rx2148",
      label: blocking ? "Resume paused evidence review" : "Resume pinned evidence review",
      summary: blocking
        ? "Continue only after the chronology banner clears the shared dependency hold."
        : "RX-2148 remains pinned because evidence changed after your last review.",
      changedSinceSeen: scenario !== "quiet",
      blocked: blocking,
      resumePath: "/workspace/queue/same-day-review",
    },
    teamQueues: TEAM_QUEUES.map((queue) => {
      if (scenario === "busy" && queue.queueKey === "same-day-review") {
        return { ...queue, waitingCount: 31, breachWindowLabel: "11m to breach", trend: "rising" };
      }
      if (scenario === "blocking" && queue.queueKey === "identity-repair") {
        return { ...queue, waitingCount: 7, breachWindowLabel: "Dependency held", trend: "rising" };
      }
      if (scenario === "degraded" && queue.queueKey === "follow-up-replies") {
        return { ...queue, waitingCount: 13, breachWindowLabel: "Read-only for 9m", trend: "steady" };
      }
      return queue;
    }),
    interruptionDigest: {
      projectionName: "InterruptionDigestProjection",
      summary: "Approvals, callbacks, escalations, and dependency drift resolve through the same calm stack.",
      items: interruptionItems,
    },
    approvalInbox: {
      projectionName: "ApprovalInboxProjection",
      pendingCount: busy ? 6 : 2,
      oldestAgeLabel: busy ? "18m oldest" : "7m oldest",
    },
    callbackWorklist: {
      projectionName: "CallbackWorklistProjection",
      callbackCount: busy ? 8 : 3,
      oldestAgeLabel: busy ? "24m oldest" : "11m oldest",
    },
    escalationInbox: {
      projectionName: "EscalationInboxProjection",
      escalationCount: blocking ? 2 : 1,
      highestSeverityLabel: blocking ? "Dependency block" : "Clinical wait risk",
    },
    changedSinceSeen: {
      projectionName: "ChangedSinceSeenProjection",
      changedCount: busy ? 9 : degraded ? 6 : 2,
      changedLabels: busy
        ? [
            dominantPharmacyMerge?.changedSinceSeenLabel ?? "Urgent pharmacy return changed",
            dominantPharmacyMerge?.triageChangedLabel ?? "Pharmacy lineage reranked",
            "Queue rank reranked",
          ]
        : [
            dominantPharmacyMerge?.changedSinceSeenLabel ?? "Pharmacy request child updated",
            "Support repair settled",
          ],
    },
    crossDomainTasks: [
      {
        projectionName: "CrossDomainTaskSummaryProjection",
        domain: "pharmacy",
        label: dominantPharmacyMerge?.triageCardLabel ?? "Pharmacy continuation",
        countLabel: dominantPharmacyMerge
          ? `${dominantPharmacyMerge.pharmacyCaseId} · ${dominantPharmacyMerge.triageCountLabel}`
          : busy
            ? "5 waiting"
            : "2 waiting",
        summary:
          dominantPharmacyMerge?.triageCardSummary ??
          "Output 211 contributes refill and intervention risk so staff can launch with context.",
        launchPath:
          dominantPharmacyMerge?.mergeState === "urgent_return"
            ? "/ops/overview"
            : "/workspace/queue/same-day-review",
        requestRef: dominantPharmacyMerge?.requestRef ?? null,
        pharmacyCaseId: dominantPharmacyMerge?.pharmacyCaseId ?? null,
        changedSinceSeenLabel: dominantPharmacyMerge?.changedSinceSeenLabel ?? null,
        notificationStateLabel: dominantPharmacyMerge?.patientNotification.stateLabel ?? null,
        continuitySummary: dominantPharmacyMerge?.supportReplaySummary ?? null,
      },
      {
        projectionName: "CrossDomainTaskSummaryProjection",
        domain: "support",
        label: "Support replay restores",
        countLabel: blocking ? "1 blocked" : "3 ready",
        summary: "Output 219 exposes replay-safe repair and restore posture before the full ticket shell lands.",
        launchPath: "/ops/support",
        requestRef: null,
        pharmacyCaseId: null,
        changedSinceSeenLabel: null,
        notificationStateLabel: null,
        continuitySummary: null,
      },
      {
        projectionName: "CrossDomainTaskSummaryProjection",
        domain: "intake",
        label: "Changed patient submissions",
        countLabel: busy ? "4 changed" : "1 changed",
        summary: "Output 210 still feeds the changed-since-seen digest instead of a separate console hop.",
        launchPath: "/workspace",
        requestRef: null,
        pharmacyCaseId: null,
        changedSinceSeenLabel: null,
        notificationStateLabel: null,
        continuitySummary: null,
      },
    ],
    dependencyDigest: {
      projectionName: "DependencyDigestProjection",
      state: blocking ? "blocking" : degraded ? "degraded" : busy ? "watch" : "clear",
      title: blocking ? "Evidence chronology hold" : degraded ? "Support lease degraded" : "Dependency posture clear",
      summary: blocking
        ? "Outbound delivery evidence is delayed, so queue launch and support ticket entry stay guarded."
        : degraded
          ? "Actions are temporarily read-only while support chronology re-syncs."
          : "No active chronology blocks. Launches remain same-shell and live.",
      resolutionLabel: blocking
        ? "Hold launches and review fallback"
        : degraded
          ? "Use read-only fallback until resync"
          : "Proceed with governed launch",
    },
    pharmacyConsoleSummary: {
      projectionName: "PharmacyConsoleSummaryProjection",
      queueLabel: "Pharmacy refill and intervention view",
      refillCount: busy ? 7 : 3,
      interventionCount: blocking ? 4 : 1,
    },
    opsOverview: {
      title: "Operations overview",
      summary: "A sparse control surface when calm, with the same north-star ribbon and interrupt logic when pressure rises.",
      sparseMessage: "Calm state keeps only the few signals needed to decide whether to stay in queue work or widen attention.",
      nextLensLabel: blocking ? "Read dependency hold" : "Inspect callback repair watchpoint",
      metrics: [
        { label: "Service posture", value: blocking ? "Blocked" : degraded ? "Guarded" : "Stable", status: blocking ? "blocked" : degraded ? "watch" : "stable" },
        { label: "Queues near breach", value: busy ? "3" : "1", status: busy ? "watch" : "stable" },
        { label: "Support repairs", value: blocking ? "1 held" : "3 ready", status: blocking ? "blocked" : "watch" },
        { label: "Read-only fallbacks", value: degraded ? "2 active" : "0", status: degraded ? "watch" : "stable" },
      ],
    },
    bottleneckRadar: [
      { queueKey: "same-day-review", label: "Same-day review", loadPercent: busy ? 91 : 58, countLabel: busy ? "31 waiting" : "14 waiting", status: busy ? "blocked" : "contained" },
      { queueKey: "callback-repair", label: "Callback repair", loadPercent: blocking ? 88 : 62, countLabel: blocking ? "1 hold" : "3 active", status: blocking ? "blocked" : "watch" },
      { queueKey: "support-replay", label: "Support replay", loadPercent: degraded ? 74 : 48, countLabel: degraded ? "read-only" : "stable", status: degraded ? "watch" : "contained" },
    ],
    supportDeskHome: {
      projectionName: "SupportDeskHomeProjection",
      title: "Support entry",
      summary: "Ticket-oriented entry starts with inbox selection, repair posture, and one safe launch target.",
      unifiedStatus: blocking ? "Transfer only" : degraded ? "Away" : "Online",
      readOnlyPosture: blocking ? "Blocked by chronology hold" : degraded ? "Read-only fallback armed" : "Live lease available",
      queueShortcuts: [
        {
          label: "Repair inbox",
          countLabel: blocking ? "1 held" : "2 ready",
          summary: "Controlled resend, delivery repair, and replay-safe restores from outputs 218 and 219.",
          launchPath: "/ops/support/inbox/repair",
        },
        {
          label: "Changed tickets",
          countLabel: busy ? "4 changed" : "1 changed",
          summary: "Recent lineage or evidence drift stays visible before agents open a ticket.",
          launchPath: "/ops/support/inbox/changed",
        },
        {
          label: "Replay review",
          countLabel: degraded ? "2 review-only" : "1 ready",
          summary: "Open checkpoint and restore posture without leaving the shell family.",
          launchPath: "/ops/support/inbox/replay",
        },
      ],
    },
    supportInboxViews: {
      all: {
        projectionName: "SupportInboxProjection",
        viewKey: "all",
        title: "All support inbox items",
        summary: "Cross-channel support work stays ticket-centric and same-shell, without inventing deeper 221 semantics.",
        rows: supportRows,
      },
      repair: {
        projectionName: "SupportInboxProjection",
        viewKey: "repair",
        title: "Repair inbox",
        summary: "Repair-first view emphasizes resend, replay, and chronology repair without leaving the shell.",
        rows: supportRows.filter((row) => row.queue === "repair"),
      },
      changed: {
        projectionName: "SupportInboxProjection",
        viewKey: "changed",
        title: "Changed since seen",
        summary: "Changed evidence or lineage is explicit before the agent opens a governed ticket workspace.",
        rows: supportRows.filter((row) => row.changed),
      },
      replay: {
        projectionName: "SupportInboxProjection",
        viewKey: "replay",
        title: "Replay and restore review",
        summary: "Replay review stays honest about dependency holds, read-only fallbacks, and restore readiness.",
        rows: supportRows.filter((row) => row.queue === "replay" || row.blocked),
      },
    },
  };
}

function classNames(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

function normalizePathname(pathname: string): string {
  if (!pathname || pathname === "/") {
    return "/workspace";
  }
  return pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

function parseRoute(pathname: string): ParsedRoute {
  const normalized = normalizePathname(pathname);
  if (normalized === "/workspace") {
    return { routeKey: "workspace-home" };
  }
  if (normalized.startsWith("/workspace/queue/")) {
    return { routeKey: "workspace-queue", queueKey: normalized.replace("/workspace/queue/", "") };
  }
  if (normalized === "/ops/overview") {
    return { routeKey: "ops-overview" };
  }
  if (normalized === "/ops/support") {
    return { routeKey: "ops-support" };
  }
  if (normalized.startsWith("/ops/support/inbox/")) {
    return { routeKey: "ops-support-inbox", viewKey: normalized.replace("/ops/support/inbox/", "") };
  }
  return { routeKey: "workspace-home" };
}

function readLocation() {
  if (typeof window === "undefined") {
    return {
      pathname: "/workspace",
      search: "?state=quiet",
    };
  }
  return {
    pathname: normalizePathname(window.location.pathname),
    search: window.location.search,
  };
}

function parseScenario(search: string): StaffEntryScenario {
  const params = new URLSearchParams(search);
  const value = params.get("state");
  if (value === "busy" || value === "blocking" || value === "degraded" || value === "quiet") {
    return value;
  }
  return "quiet";
}

function scenarioLabel(scenario: StaffEntryScenario): string {
  switch (scenario) {
    case "busy":
      return "Busy";
    case "blocking":
      return "Blocking";
    case "degraded":
      return "Degraded";
    case "quiet":
    default:
      return "Quiet";
  }
}

function pageTitle(routeKey: StaffEntryRouteKey): string {
  return formatVecellTitle("Clinical Workspace", ROUTE_METADATA_REGISTRY[routeKey].routeLabel);
}

function statusTone(status: "stable" | "watch" | "blocked" | "contained"): string {
  switch (status) {
    case "blocked":
      return "blocked";
    case "watch":
      return "watch";
    case "contained":
      return "contained";
    case "stable":
    default:
      return "stable";
  }
}

function buildQueryString(scenario: StaffEntryScenario): string {
  return `?state=${scenario}`;
}

function useReducedMotionPreference(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return reducedMotion;
}

function useStaffEntryRouter() {
  const [locationState, setLocationState] = useState(readLocation);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const handlePopState = () => setLocationState(readLocation());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const route = useMemo(() => parseRoute(locationState.pathname), [locationState.pathname]);
  const scenario = useMemo(() => parseScenario(locationState.search), [locationState.search]);

  const navigate = (pathname: string, nextScenario: StaffEntryScenario = scenario) => {
    if (typeof window === "undefined") {
      return;
    }
    window.history.pushState({}, "", `${pathname}${buildQueryString(nextScenario)}`);
    window.dispatchEvent(new Event("vecells-route-change"));
    setLocationState(readLocation());
  };

  const updateScenario = (nextScenario: StaffEntryScenario) => {
    navigate(locationState.pathname, nextScenario);
  };

  return {
    route,
    scenario,
    pathname: locationState.pathname,
    navigate,
    updateScenario,
  };
}

function StatPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "stable" | "watch" | "blocked" | "contained";
}) {
  return (
    <div className="staff-entry__stat-pill" data-tone={tone}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function BlockingDependencyBanner({
  dependencyDigest,
}: {
  dependencyDigest: DependencyDigestProjection;
}) {
  if (dependencyDigest.state === "clear") {
    return null;
  }
  return (
    <section
      aria-label="Dependency posture"
      className="staff-entry__dependency-banner"
      data-testid="BlockingDependencyBanner"
      data-state={dependencyDigest.state}
    >
      <div>
        <p className="staff-entry__eyebrow">Dependency posture</p>
        <h2>{dependencyDigest.title}</h2>
        <p>{dependencyDigest.summary}</p>
      </div>
      <div className="staff-entry__dependency-resolution">
        <span>Fallback</span>
        <strong>{dependencyDigest.resolutionLabel}</strong>
      </div>
    </section>
  );
}

export function RecommendedQueueCard({
  projection,
  onLaunch,
  disabled,
}: {
  projection: WorkspaceHomeProjection;
  onLaunch: () => void;
  disabled: boolean;
}) {
  return (
    <section className="staff-entry__feature-card" data-testid="RecommendedQueueCard">
      <p className="staff-entry__eyebrow">Recommended queue</p>
      <h2>{projection.recommendedQueue.label}</h2>
      <p>{projection.recommendedQueue.summary}</p>
      <div className="staff-entry__metric-row">
        <StatPill label="Waiting" value={String(projection.recommendedQueue.waitingCount)} tone="contained" />
        <StatPill label="Changed" value={String(projection.recommendedQueue.changeCount)} tone="watch" />
        <StatPill label="Risk" value={projection.recommendedQueue.breachWindowLabel} tone={disabled ? "blocked" : "stable"} />
      </div>
      <div className="staff-entry__action-row">
        <button
          type="button"
          className="staff-entry__primary-button"
          data-testid="recommended-queue-launch"
          onClick={onLaunch}
          disabled={disabled}
        >
          {disabled ? "Queue launch held" : projection.recommendedQueue.nextSafeActionLabel}
        </button>
        <span className="staff-entry__supporting-copy">{projection.safeActionPromise}</span>
      </div>
    </section>
  );
}

export function InterruptDigestStack({
  digest,
}: {
  digest: InterruptionDigestProjection;
}) {
  return (
    <section className="staff-entry__stack-card" data-testid="InterruptDigestStack">
      <p className="staff-entry__eyebrow">Interruptions</p>
      <h2>Unified interrupt digest</h2>
      <p>{digest.summary}</p>
      <ul className="staff-entry__interrupt-list">
        {digest.items.map((item) => (
          <li key={item.key} className="staff-entry__interrupt-item" data-tone={item.emphasis}>
            <div>
              <strong>{item.label}</strong>
              <p>{item.summary}</p>
            </div>
            <span aria-label={`${item.label}: ${item.countLabel}`}>{item.countLabel}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PinnedWorkResumeCard({
  projection,
  onResume,
}: {
  projection: PersonalWorklistProjection;
  onResume: () => void;
}) {
  return (
    <section className="staff-entry__secondary-card" data-testid="PinnedWorkResumeCard">
      <p className="staff-entry__eyebrow">Pinned resume</p>
      <h2>{projection.label}</h2>
      <p>{projection.summary}</p>
      <div className="staff-entry__tag-row">
        {projection.changedSinceSeen ? <span className="staff-entry__tag" data-tone="watch">Changed since seen</span> : null}
        {projection.blocked ? <span className="staff-entry__tag" data-tone="blocked">Blocked</span> : null}
      </div>
      <button type="button" className="staff-entry__secondary-button" onClick={onResume}>
        Resume pinned work
      </button>
    </section>
  );
}

export function OpsNorthStarRibbon({
  projection,
}: {
  projection: OpsOverviewProjection;
}) {
  return (
    <section className="staff-entry__north-star" data-testid="OpsNorthStarRibbon">
      <div>
        <p className="staff-entry__eyebrow">North star</p>
        <h2>{projection.title}</h2>
        <p>{projection.summary}</p>
      </div>
      <div className="staff-entry__north-star-grid">
        {projection.metrics.map((metric) => (
          <div key={metric.label} className="staff-entry__north-star-metric" data-tone={metric.status}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

export function BottleneckRadarLite({
  items,
  onInspect,
}: {
  items: readonly BottleneckRadarItem[];
  onInspect: (queueKey: string) => void;
}) {
  return (
    <section className="staff-entry__radar" data-testid="BottleneckRadarLite">
      <p className="staff-entry__eyebrow">Bottleneck radar</p>
      <h2>Queue pressure and repair watchpoints</h2>
      <ul className="staff-entry__radar-list">
        {items.map((item) => (
          <li key={item.queueKey} className="staff-entry__radar-item" data-tone={statusTone(item.status)}>
            <button type="button" className="staff-entry__radar-button" onClick={() => onInspect(item.queueKey)}>
              <span className="staff-entry__radar-label">{item.label}</span>
              <span className="staff-entry__radar-bar" aria-hidden="true">
                <span style={{ width: `${item.loadPercent}%` }} />
              </span>
              <span className="staff-entry__radar-meta">{item.countLabel}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function SupportDeskEntryPanel({
  projection,
  onLaunch,
}: {
  projection: SupportDeskHomeProjection;
  onLaunch: (path: string) => void;
}) {
  return (
    <section className="staff-entry__support-panel" data-testid="SupportDeskEntryPanel">
      <p className="staff-entry__eyebrow">Support entry</p>
      <h2>{projection.title}</h2>
      <p>{projection.summary}</p>
      <div className="staff-entry__metric-row">
        <StatPill label="Unified status" value={projection.unifiedStatus} tone="stable" />
        <StatPill label="Posture" value={projection.readOnlyPosture} tone="watch" />
      </div>
      <div className="staff-entry__shortcut-grid">
        {projection.queueShortcuts.map((shortcut) => (
          <button
            key={shortcut.label}
            type="button"
            className="staff-entry__shortcut-card"
            onClick={() => onLaunch(shortcut.launchPath)}
          >
            <strong>{shortcut.label}</strong>
            <span>{shortcut.countLabel}</span>
            <p>{shortcut.summary}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

export function SupportInboxViewSwitcher({
  activeViewKey,
  onSelect,
}: {
  activeViewKey: string;
  onSelect: (viewKey: string) => void;
}) {
  const views = [
    { key: "all", label: "All" },
    { key: "repair", label: "Repair" },
    { key: "changed", label: "Changed" },
    { key: "replay", label: "Replay" },
  ] as const;

  return (
    <div
      className="staff-entry__view-switcher"
      data-testid="SupportInboxViewSwitcher"
      role="tablist"
      aria-label="Support inbox views"
    >
      {views.map((view) => (
        <button
          key={view.key}
          id={`support-view-tab-${view.key}`}
          type="button"
          role="tab"
          aria-selected={activeViewKey === view.key}
          className="staff-entry__view-button"
          data-active={activeViewKey === view.key ? "true" : "false"}
          onClick={() => onSelect(view.key)}
        >
          {view.label}
        </button>
      ))}
    </div>
  );
}

export function CrossDomainTaskStrip({
  tasks,
  onLaunch,
}: {
  tasks: readonly CrossDomainTaskSummaryProjection[];
  onLaunch: (path: string) => void;
}) {
  return (
    <section className="staff-entry__cross-domain" data-testid="CrossDomainTaskStrip">
      <p className="staff-entry__eyebrow">Cross-domain work</p>
      <h2>Connected tasks without a console swap</h2>
      <div className="staff-entry__cross-domain-grid">
        {tasks.map((task) => (
          <button
            key={`${task.domain}-${task.label}`}
            type="button"
            className="staff-entry__cross-domain-card"
            data-domain={task.domain}
            data-request-ref={task.requestRef ?? undefined}
            data-pharmacy-case-id={task.pharmacyCaseId ?? undefined}
            data-notification-state={task.notificationStateLabel ?? undefined}
            data-changed-since-seen={task.changedSinceSeenLabel ?? undefined}
            onClick={() => onLaunch(task.launchPath)}
          >
            <strong>{task.label}</strong>
            <div className="staff-entry__tag-row">
              <span
                className="staff-entry__tag"
                data-tone={
                  task.notificationStateLabel?.toLowerCase().includes("urgent")
                    ? "blocked"
                    : task.domain === "pharmacy"
                      ? "watch"
                      : undefined
                }
              >
                {task.countLabel}
              </span>
              {task.requestRef ? <span className="staff-entry__tag">{task.requestRef}</span> : null}
              {task.pharmacyCaseId ? (
                <span className="staff-entry__tag">{task.pharmacyCaseId}</span>
              ) : null}
            </div>
            <p>{task.summary}</p>
            {task.changedSinceSeenLabel ? (
              <small className="staff-entry__cross-domain-meta">{task.changedSinceSeenLabel}</small>
            ) : null}
            {task.notificationStateLabel ? (
              <small className="staff-entry__cross-domain-meta">
                Notification posture: {task.notificationStateLabel}
              </small>
            ) : null}
          </button>
        ))}
      </div>
    </section>
  );
}

function SupportInboxTable({
  projection,
  onLaunch,
}: {
  projection: SupportInboxProjection;
  onLaunch: (path: string) => void;
}) {
  return (
    <section
      className="staff-entry__support-table-wrap"
      role="tabpanel"
      aria-labelledby={`support-view-tab-${projection.viewKey}`}
    >
      <div className="staff-entry__support-table-header">
        <div>
          <p className="staff-entry__eyebrow">Support inbox</p>
          <h2>{projection.title}</h2>
          <p>{projection.summary}</p>
        </div>
      </div>
      <div className="staff-entry__support-table" data-testid="SupportInboxTable">
        <div className="staff-entry__support-row staff-entry__support-row--header" role="row">
          <span role="columnheader">Ticket</span>
          <span role="columnheader">Queue</span>
          <span role="columnheader">State</span>
          <span role="columnheader">Evidence</span>
          <span role="columnheader">Launch</span>
        </div>
        {projection.rows.map((row) => (
          <div key={row.supportTicketId} className="staff-entry__support-row" role="row">
            <span role="cell">
              <strong>{row.subject}</strong>
              <small>{row.supportTicketId}</small>
            </span>
            <span role="cell">{row.queue}</span>
            <span role="cell">
              <span className="staff-entry__tag" data-tone={row.blocked ? "blocked" : row.changed ? "watch" : "stable"}>
                {row.stateLabel}
              </span>
            </span>
            <span role="cell">{row.evidenceLabel}</span>
            <span role="cell">
              <button type="button" className="staff-entry__table-launch" onClick={() => onLaunch(row.launchPath)}>
                {row.launchLabel}
              </button>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function QueueSummaryList({
  queues,
  activeQueueKey,
  onSelect,
}: {
  queues: readonly TeamQueueSummaryProjection[];
  activeQueueKey?: string;
  onSelect: (queueKey: string) => void;
}) {
  return (
    <section className="staff-entry__queue-list">
      <p className="staff-entry__eyebrow">Team queues</p>
      <h2>Queue continuity</h2>
      <ul>
        {queues.map((queue) => (
          <li key={queue.queueKey}>
            <button
              type="button"
              className="staff-entry__queue-button"
              data-active={activeQueueKey === queue.queueKey ? "true" : "false"}
              onClick={() => onSelect(queue.queueKey)}
            >
              <span>
                <strong>{queue.label}</strong>
                <small>{queue.breachWindowLabel}</small>
              </span>
              <span>{queue.waitingCount}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RouteContinuityLedger({
  contract,
  pathname,
  scenario,
}: {
  contract: SupportEntryRouteContract;
  pathname: string;
  scenario: StaffEntryScenario;
}) {
  return (
    <aside className="staff-entry__continuity-ledger" data-testid="SameShellContinuityLedger">
      <p className="staff-entry__eyebrow">Route continuity</p>
      <dl>
        <div>
          <dt>Shell</dt>
          <dd>{contract.shellFamily}</dd>
        </div>
        <div>
          <dt>Continuity key</dt>
          <dd>{contract.continuityKey}</dd>
        </div>
        <div>
          <dt>Anchor policy</dt>
          <dd>{contract.selectedAnchorPolicy}</dd>
        </div>
        <div>
          <dt>Path</dt>
          <dd>{pathname}</dd>
        </div>
        <div>
          <dt>Scenario</dt>
          <dd>{scenarioLabel(scenario)}</dd>
        </div>
      </dl>
    </aside>
  );
}

export function StaffEntryShell({
  routeKey,
  pathname,
  scenario,
  reducedMotion,
  contract,
  dataset,
  onNavigate,
  onScenarioChange,
  children,
}: {
  routeKey: StaffEntryRouteKey;
  pathname: string;
  scenario: StaffEntryScenario;
  reducedMotion: boolean;
  contract: SupportEntryRouteContract;
  dataset: StaffEntryDataset;
  onNavigate: (path: string) => void;
  onScenarioChange: (scenario: StaffEntryScenario) => void;
  children: ReactNode;
}) {
  const navItems = [
    { routeKey: "workspace-home", label: "Workspace", path: "/workspace" },
    { routeKey: "ops-overview", label: "Ops Overview", path: "/ops/overview" },
    { routeKey: "ops-support", label: "Support Desk", path: "/ops/support" },
  ] as const;

  return (
    <div
      className="staff-entry"
      data-testid={STYLE_SYSTEM}
      data-visual-mode={VISUAL_MODE}
      data-shell-family={contract.shellFamily}
      data-continuity-key={contract.continuityKey}
      data-selected-anchor-policy={contract.selectedAnchorPolicy}
      data-route-key={routeKey}
      data-route-path={pathname}
      data-read-only-posture={contract.readOnlyPosture}
      data-motion-mode={reducedMotion ? "reduced" : "full"}
    >
      <a className="staff-entry__skip-link" href="#staff-entry-main">
        Skip to main content
      </a>
      <header className="staff-entry__masthead">
        <div className="staff-entry__brand">
          <VecellLogoLockup
            aria-hidden="true"
            className="staff-entry__brand-mark"
            style={{ width: 160, height: "auto" }}
          />
          <div>
            <p className="staff-entry__eyebrow">Staff entry quiet control</p>
            <h1>One shell for start-of-day, ops watch, and support entry.</h1>
            <p className="staff-entry__lede">
              Quiet workbench first. One dominant next-safe action, one interrupt digest, one governed launch path.
            </p>
          </div>
        </div>
        <div className="staff-entry__masthead-side">
          <div className="staff-entry__scenario-switcher" aria-label="Scenario selector">
            {(["quiet", "busy", "blocking", "degraded"] as const).map((candidate) => (
              <button
                key={candidate}
                type="button"
                data-active={scenario === candidate ? "true" : "false"}
                onClick={() => onScenarioChange(candidate)}
              >
                {scenarioLabel(candidate)}
              </button>
            ))}
          </div>
          <div className="staff-entry__headline-stats">
            <StatPill label="Backlog" value={dataset.staffInbox.backlogLabel} tone="contained" />
            <StatPill label="Changed" value={dataset.staffInbox.changedSinceSeenLabel} tone="watch" />
          </div>
        </div>
      </header>

      <nav className="staff-entry__route-nav" aria-label="Staff entry sections">
        {navItems.map((item) => (
          <button
            key={item.path}
            type="button"
            className="staff-entry__route-button"
            aria-current={routeKey === item.routeKey ? "page" : undefined}
            data-active={routeKey === item.routeKey ? "true" : "false"}
            onClick={() => onNavigate(item.path)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <OpsNorthStarRibbon projection={dataset.opsOverview} />
      <BlockingDependencyBanner dependencyDigest={dataset.dependencyDigest} />

      <main id="staff-entry-main" className="staff-entry__main">
        <section className="staff-entry__content">{children}</section>
        <RouteContinuityLedger contract={contract} pathname={pathname} scenario={scenario} />
      </main>
    </div>
  );
}

function WorkspaceHomeView({
  dataset,
  onNavigate,
  scenario,
}: {
  dataset: StaffEntryDataset;
  onNavigate: (path: string) => void;
  scenario: StaffEntryScenario;
}) {
  return (
    <div className="staff-entry__route-layout" data-testid="WorkspaceHomeRoute">
      <div className="staff-entry__primary-column">
        <RecommendedQueueCard
          projection={dataset.workspaceHome}
          onLaunch={() => onNavigate(dataset.workspaceHome.recommendedQueue.launchPath)}
          disabled={scenario === "blocking"}
        />
        <CrossDomainTaskStrip tasks={dataset.crossDomainTasks} onLaunch={onNavigate} />
      </div>
      <div className="staff-entry__secondary-column">
        <InterruptDigestStack digest={dataset.interruptionDigest} />
        <PinnedWorkResumeCard projection={dataset.personalWorklist} onResume={() => onNavigate(dataset.personalWorklist.resumePath)} />
      </div>
    </div>
  );
}

function WorkspaceQueueView({
  dataset,
  queueKey,
  onNavigate,
  scenario,
}: {
  dataset: StaffEntryDataset;
  queueKey?: string;
  onNavigate: (path: string) => void;
  scenario: StaffEntryScenario;
}) {
  return (
    <div className="staff-entry__route-layout" data-testid="WorkspaceQueueRoute">
      <div className="staff-entry__primary-column">
        <RecommendedQueueCard
          projection={dataset.workspaceHome}
          onLaunch={() => onNavigate("/workspace/queue/same-day-review")}
          disabled={scenario === "blocking"}
        />
        <QueueSummaryList
          queues={dataset.teamQueues}
          activeQueueKey={queueKey ?? dataset.workspaceHome.recommendedQueue.queueKey}
          onSelect={(selectedQueueKey) => onNavigate(`/workspace/queue/${selectedQueueKey}`)}
        />
      </div>
      <div className="staff-entry__secondary-column">
        <InterruptDigestStack digest={dataset.interruptionDigest} />
        <PinnedWorkResumeCard projection={dataset.personalWorklist} onResume={() => onNavigate(dataset.personalWorklist.resumePath)} />
      </div>
    </div>
  );
}

function OpsOverviewView({
  dataset,
  onNavigate,
}: {
  dataset: StaffEntryDataset;
  onNavigate: (path: string) => void;
}) {
  return (
    <div className="staff-entry__route-layout" data-testid="OpsOverviewRoute">
      <div className="staff-entry__primary-column">
        <BottleneckRadarLite
          items={dataset.bottleneckRadar}
          onInspect={(queueKey) =>
            onNavigate(queueKey === "support-replay" ? "/ops/support" : "/workspace/queue/same-day-review")
          }
        />
        <CrossDomainTaskStrip tasks={dataset.crossDomainTasks} onLaunch={onNavigate} />
      </div>
      <div className="staff-entry__secondary-column">
        <SupportDeskEntryPanel projection={dataset.supportDeskHome} onLaunch={onNavigate} />
      </div>
    </div>
  );
}

function OpsSupportView({
  dataset,
  onNavigate,
}: {
  dataset: StaffEntryDataset;
  onNavigate: (path: string) => void;
}) {
  return (
    <div className="staff-entry__route-layout" data-testid="OpsSupportRoute">
      <div className="staff-entry__primary-column">
        <SupportDeskEntryPanel projection={dataset.supportDeskHome} onLaunch={onNavigate} />
      </div>
      <div className="staff-entry__secondary-column">
        <InterruptDigestStack digest={dataset.interruptionDigest} />
      </div>
    </div>
  );
}

function OpsSupportInboxView({
  dataset,
  viewKey,
  onNavigate,
}: {
  dataset: StaffEntryDataset;
  viewKey?: string;
  onNavigate: (path: string) => void;
}) {
  const candidateViewKey = (viewKey ?? "repair") as SupportInboxViewKey;
  const activeViewKey: SupportInboxViewKey = candidateViewKey in dataset.supportInboxViews ? candidateViewKey : "repair";
  const projection = dataset.supportInboxViews[activeViewKey];
  return (
    <div className="staff-entry__support-inbox-route" data-testid="OpsSupportInboxRoute">
      <SupportInboxViewSwitcher
        activeViewKey={activeViewKey}
        onSelect={(nextViewKey) => onNavigate(`/ops/support/inbox/${nextViewKey}`)}
      />
      <SupportInboxTable projection={projection} onLaunch={onNavigate} />
    </div>
  );
}

export function StaffEntrySurfaceApp() {
  const { route, scenario, pathname, navigate, updateScenario } = useStaffEntryRouter();
  const reducedMotion = useReducedMotionPreference();
  const dataset = useMemo(() => createScenarioDataset(scenario), [scenario]);
  const contract = ROUTE_METADATA_REGISTRY[route.routeKey];

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = pageTitle(route.routeKey);
    }
  }, [route.routeKey]);

  const handleNavigate = (path: string) => navigate(path, scenario);

  return (
    <StaffEntryShell
      routeKey={route.routeKey}
      pathname={pathname}
      scenario={scenario}
      reducedMotion={reducedMotion}
      contract={contract}
      dataset={dataset}
      onNavigate={handleNavigate}
      onScenarioChange={updateScenario}
    >
      {route.routeKey === "workspace-home" ? (
        <WorkspaceHomeView dataset={dataset} onNavigate={handleNavigate} scenario={scenario} />
      ) : null}
      {route.routeKey === "workspace-queue" ? (
        <WorkspaceQueueView dataset={dataset} queueKey={route.queueKey} onNavigate={handleNavigate} scenario={scenario} />
      ) : null}
      {route.routeKey === "ops-overview" ? <OpsOverviewView dataset={dataset} onNavigate={handleNavigate} /> : null}
      {route.routeKey === "ops-support" ? <OpsSupportView dataset={dataset} onNavigate={handleNavigate} /> : null}
      {route.routeKey === "ops-support-inbox" ? (
        <OpsSupportInboxView dataset={dataset} viewKey={route.viewKey} onNavigate={handleNavigate} />
      ) : null}
    </StaffEntryShell>
  );
}
