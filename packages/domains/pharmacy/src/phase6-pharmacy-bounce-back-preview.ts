import type { AggregateRef } from "./phase6-pharmacy-case-kernel";
import type { PharmacyBounceBackRecordSnapshot } from "./phase6-pharmacy-patient-status-engine";
import type {
  PharmacyBounceBackLoopSupervisorPosture,
  PharmacyBounceBackTruthProjectionSnapshot,
  PharmacyPracticeVisibilityProjectionSnapshot,
  PharmacyReturnNotificationTriggerSnapshot,
  UrgentReturnDirectRouteProfileSnapshot,
} from "./phase6-pharmacy-bounce-back-engine";

const TASK_342 = "seq_342" as const;
const TASK_344 =
  "seq_344_phase6_freeze_bounce_back_urgent_return_and_practice_visibility_contracts" as const;
const TASK_353 =
  "par_353_phase6_track_backend_build_bounce_back_urgent_return_and_reopen_mechanics" as const;

type Task342 = typeof TASK_342;
type Task344 = typeof TASK_344;
type Task353 = typeof TASK_353;

export const PHARMACY_RECOVERY_CONTROL_VISUAL_MODE = "Pharmacy_Recovery_Control";

export type PharmacyRecoverySurfaceState =
  | "urgent_return"
  | "routine_reopen"
  | "loop_risk_escalated";

export type PharmacyRecoveryTone =
  | "watch"
  | "review"
  | "blocked"
  | "critical";

export interface PharmacyBounceBackQueueItemSnapshot {
  itemId: string;
  label: string;
  state: "complete" | "current" | "blocked" | "pending";
  summary: string;
  detail: string;
}

export interface PharmacyBounceBackQueueSnapshot {
  title: string;
  summary: string;
  items: readonly PharmacyBounceBackQueueItemSnapshot[];
}

export interface PharmacyReopenedCaseBannerSnapshot {
  tone: PharmacyRecoveryTone;
  title: string;
  summary: string;
  detail: string;
  statusPill: string;
  announcementRole: "status" | "alert";
}

export interface PharmacyUrgentReturnModeSnapshot {
  tone: PharmacyRecoveryTone;
  title: string;
  summary: string;
  routeClassLabel: string;
  directRouteLabel: string;
  fallbackRouteLabel: string;
  monitoredSafetyNetLabel: string;
  calmCopyLabel: string;
}

export interface OpenOriginalRequestActionSnapshot {
  title: string;
  summary: string;
  buttonLabel: string;
  hint: string;
  availabilityState: "available" | "duty_task_only";
}

export interface PharmacyReturnMessagePreviewSnapshot {
  title: string;
  summary: string;
  headline: string;
  body: string;
  warning: string | null;
  notificationStateLabel: string;
  channelHintLabel: string;
  anchorLabel: string;
  contractLabel: string;
}

export interface PharmacyReopenDiffRowSnapshot {
  diffId: string;
  label: string;
  previousValue: string;
  currentValue: string;
  implication: string;
}

export interface PharmacyReopenDiffStripSnapshot {
  title: string;
  summary: string;
  rows: readonly PharmacyReopenDiffRowSnapshot[];
}

export interface PharmacyLoopRiskEscalationCardSnapshot {
  tone: PharmacyRecoveryTone;
  title: string;
  summary: string;
  loopRiskLabel: string;
  reopenPriorityLabel: string;
  supervisorStateLabel: string;
  autoBlockSummary: readonly string[];
  announcementRole: "status" | "alert";
}

export interface PharmacyRecoveryDecisionDockActionSnapshot {
  actionId: string;
  label: string;
  detail: string;
  routeTarget: "validate" | "resolve" | "handoff" | "assurance";
  emphasis: "primary" | "secondary";
}

export interface PharmacyRecoveryDecisionDockSnapshot {
  tone: PharmacyRecoveryTone;
  title: string;
  summary: string;
  currentOwnerLabel: string;
  consequenceTitle: string;
  consequenceSummary: string;
  closeBlockers: readonly string[];
  primaryAction: PharmacyRecoveryDecisionDockActionSnapshot;
  secondaryActions: readonly PharmacyRecoveryDecisionDockActionSnapshot[];
}

export interface PharmacyBounceBackRecordBinding
  extends Pick<
    PharmacyBounceBackRecordSnapshot,
    | "bounceBackRecordId"
    | "bounceBackType"
    | "materialChange"
    | "loopRisk"
    | "reopenSignal"
    | "reopenPriorityBand"
    | "supervisorReviewState"
    | "gpActionRequired"
    | "reopenedCaseStatus"
    | "autoRedispatchBlocked"
    | "autoCloseBlocked"
    | "returnedTaskRef"
    | "reopenByAt"
    | "patientInformedAt"
    | "createdAt"
    | "updatedAt"
  > {}

export interface PharmacyBounceBackTruthBinding
  extends Pick<
    PharmacyBounceBackTruthProjectionSnapshot,
    | "pharmacyBounceBackTruthProjectionId"
    | "reopenedCaseStatus"
    | "returnedTaskRef"
    | "reacquisitionMode"
    | "triageReentryState"
    | "gpActionRequired"
    | "materialChange"
    | "loopRisk"
    | "reopenSignal"
    | "reopenPriorityBand"
    | "patientNotificationState"
    | "autoRedispatchBlocked"
    | "autoCloseBlocked"
    | "computedAt"
  > {}

export interface PharmacyReturnNotificationBinding
  extends Pick<
    PharmacyReturnNotificationTriggerSnapshot,
    | "pharmacyReturnNotificationTriggerId"
    | "notificationState"
    | "channelHint"
    | "headlineCopyRef"
    | "bodyCopyRef"
    | "warningCopyRef"
    | "selectedAnchorRef"
    | "activeReturnContractRef"
    | "generatedAt"
    | "patientInformedAt"
  > {}

export interface PharmacyRecoveryVisibilityBinding
  extends Pick<
    PharmacyPracticeVisibilityProjectionSnapshot,
    | "pharmacyPracticeVisibilityProjectionId"
    | "latestPatientInstructionState"
    | "gpActionRequiredState"
    | "triageReentryState"
    | "urgentReturnState"
    | "reachabilityRepairState"
    | "currentCloseBlockerRefs"
    | "minimumNecessaryAudienceView"
    | "calmCopyAllowed"
    | "computedAt"
  > {}

export interface PharmacyUrgentRouteBinding
  extends Pick<
    UrgentReturnDirectRouteProfileSnapshot,
    | "urgentReturnDirectRouteProfileId"
    | "bounceBackType"
    | "routeClass"
    | "directRouteRef"
    | "fallbackRouteRef"
    | "monitoredSafetyNetRequired"
    | "routeEvidenceRequirementRef"
    | "calmCopyForbidden"
    | "reviewedAt"
  > {}

export interface PharmacyLoopSupervisorBinding
  extends PharmacyBounceBackLoopSupervisorPosture {}

export interface PharmacyBounceBackRecoveryPreviewSnapshot {
  pharmacyCaseId: string;
  visualMode: typeof PHARMACY_RECOVERY_CONTROL_VISUAL_MODE;
  surfaceState: PharmacyRecoverySurfaceState;
  banner: PharmacyReopenedCaseBannerSnapshot;
  queue: PharmacyBounceBackQueueSnapshot;
  urgentReturnMode: PharmacyUrgentReturnModeSnapshot;
  openOriginalRequestAction: OpenOriginalRequestActionSnapshot;
  returnMessagePreview: PharmacyReturnMessagePreviewSnapshot;
  reopenDiffStrip: PharmacyReopenDiffStripSnapshot;
  loopRiskEscalationCard: PharmacyLoopRiskEscalationCardSnapshot;
  decisionDock: PharmacyRecoveryDecisionDockSnapshot;
  bounceBackBinding: PharmacyBounceBackRecordBinding;
  truthBinding: PharmacyBounceBackTruthBinding;
  notificationBinding: PharmacyReturnNotificationBinding | null;
  visibilityBinding: PharmacyRecoveryVisibilityBinding;
  urgentRouteBinding: PharmacyUrgentRouteBinding | null;
  loopSupervisorBinding: PharmacyLoopSupervisorBinding;
}

function makeCaseRef(refId: string): AggregateRef<"PharmacyCase", Task342> {
  return { targetFamily: "PharmacyCase", refId, ownerTask: TASK_342 };
}

function labelFromToken(value: string): string {
  return value
    .split(/[_-]/g)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function priorityLabel(value: number): string {
  if (value >= 4) {
    return "Priority band 4 / immediate supervisor route";
  }
  if (value >= 3) {
    return "Priority band 3 / same-shift recovery";
  }
  if (value >= 2) {
    return "Priority band 2 / reopen today";
  }
  return "Priority band 1 / reopen without urgent escalation";
}

function loopRiskTone(value: number): PharmacyRecoveryTone {
  if (value >= 0.8) {
    return "critical";
  }
  if (value >= 0.6) {
    return "blocked";
  }
  if (value >= 0.35) {
    return "review";
  }
  return "watch";
}

function loopRiskBand(value: number): "low" | "watch" | "high" | "critical" {
  if (value >= 0.8) {
    return "critical";
  }
  if (value >= 0.6) {
    return "high";
  }
  if (value >= 0.35) {
    return "watch";
  }
  return "low";
}

function createBounceBackBinding(input: {
  pharmacyCaseId: string;
  bounceBackType: PharmacyBounceBackRecordSnapshot["bounceBackType"];
  materialChange: number;
  loopRisk: number;
  reopenSignal: number;
  reopenPriorityBand: number;
  supervisorReviewState: PharmacyBounceBackRecordSnapshot["supervisorReviewState"];
  gpActionRequired: boolean;
  reopenedCaseStatus: PharmacyBounceBackRecordSnapshot["reopenedCaseStatus"];
  autoRedispatchBlocked: boolean;
  autoCloseBlocked: boolean;
  returnedTaskRef: string | null;
  reopenByAt: string | null;
  patientInformedAt: string | null;
  createdAt: string;
  updatedAt: string;
}): PharmacyBounceBackRecordBinding {
  return {
    bounceBackRecordId: `bounce_back_${input.pharmacyCaseId}`,
    bounceBackType: input.bounceBackType,
    materialChange: input.materialChange,
    loopRisk: input.loopRisk,
    reopenSignal: input.reopenSignal,
    reopenPriorityBand: input.reopenPriorityBand,
    supervisorReviewState: input.supervisorReviewState,
    gpActionRequired: input.gpActionRequired,
    reopenedCaseStatus: input.reopenedCaseStatus,
    autoRedispatchBlocked: input.autoRedispatchBlocked,
    autoCloseBlocked: input.autoCloseBlocked,
    returnedTaskRef: input.returnedTaskRef,
    reopenByAt: input.reopenByAt,
    patientInformedAt: input.patientInformedAt,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  };
}

function createTruthBinding(input: {
  pharmacyCaseId: string;
  reopenedCaseStatus: PharmacyBounceBackTruthProjectionSnapshot["reopenedCaseStatus"];
  returnedTaskRef: string | null;
  reacquisitionMode: PharmacyBounceBackTruthProjectionSnapshot["reacquisitionMode"];
  triageReentryState: PharmacyBounceBackTruthProjectionSnapshot["triageReentryState"];
  gpActionRequired: boolean;
  materialChange: number;
  loopRisk: number;
  reopenSignal: number;
  reopenPriorityBand: number;
  patientNotificationState: PharmacyBounceBackTruthProjectionSnapshot["patientNotificationState"];
  autoRedispatchBlocked: boolean;
  autoCloseBlocked: boolean;
  computedAt: string;
}): PharmacyBounceBackTruthBinding {
  return {
    pharmacyBounceBackTruthProjectionId: `bounce_back_truth_${input.pharmacyCaseId}`,
    reopenedCaseStatus: input.reopenedCaseStatus,
    returnedTaskRef: input.returnedTaskRef,
    reacquisitionMode: input.reacquisitionMode,
    triageReentryState: input.triageReentryState,
    gpActionRequired: input.gpActionRequired,
    materialChange: input.materialChange,
    loopRisk: input.loopRisk,
    reopenSignal: input.reopenSignal,
    reopenPriorityBand: input.reopenPriorityBand,
    patientNotificationState: input.patientNotificationState,
    autoRedispatchBlocked: input.autoRedispatchBlocked,
    autoCloseBlocked: input.autoCloseBlocked,
    computedAt: input.computedAt,
  };
}

function createNotificationBinding(input: {
  pharmacyCaseId: string;
  notificationState: PharmacyReturnNotificationTriggerSnapshot["notificationState"];
  channelHint: PharmacyReturnNotificationTriggerSnapshot["channelHint"];
  headlineCopyRef: string;
  bodyCopyRef: string;
  warningCopyRef: string | null;
  selectedAnchorRef: string;
  activeReturnContractRef: string | null;
  generatedAt: string;
  patientInformedAt: string | null;
}): PharmacyReturnNotificationBinding {
  return {
    pharmacyReturnNotificationTriggerId: `return_notification_${input.pharmacyCaseId}`,
    notificationState: input.notificationState,
    channelHint: input.channelHint,
    headlineCopyRef: input.headlineCopyRef,
    bodyCopyRef: input.bodyCopyRef,
    warningCopyRef: input.warningCopyRef,
    selectedAnchorRef: input.selectedAnchorRef,
    activeReturnContractRef: input.activeReturnContractRef,
    generatedAt: input.generatedAt,
    patientInformedAt: input.patientInformedAt,
  };
}

function createVisibilityBinding(input: {
  pharmacyCaseId: string;
  latestPatientInstructionState: PharmacyPracticeVisibilityProjectionSnapshot["latestPatientInstructionState"];
  gpActionRequiredState: PharmacyPracticeVisibilityProjectionSnapshot["gpActionRequiredState"];
  triageReentryState: PharmacyPracticeVisibilityProjectionSnapshot["triageReentryState"];
  urgentReturnState: PharmacyPracticeVisibilityProjectionSnapshot["urgentReturnState"];
  reachabilityRepairState: PharmacyPracticeVisibilityProjectionSnapshot["reachabilityRepairState"];
  currentCloseBlockerRefs: readonly string[];
  minimumNecessaryAudienceView: PharmacyPracticeVisibilityProjectionSnapshot["minimumNecessaryAudienceView"];
  calmCopyAllowed: boolean;
  computedAt: string;
}): PharmacyRecoveryVisibilityBinding {
  return {
    pharmacyPracticeVisibilityProjectionId: `practice_visibility_${input.pharmacyCaseId}`,
    latestPatientInstructionState: input.latestPatientInstructionState,
    gpActionRequiredState: input.gpActionRequiredState,
    triageReentryState: input.triageReentryState,
    urgentReturnState: input.urgentReturnState,
    reachabilityRepairState: input.reachabilityRepairState,
    currentCloseBlockerRefs: input.currentCloseBlockerRefs,
    minimumNecessaryAudienceView: input.minimumNecessaryAudienceView,
    calmCopyAllowed: input.calmCopyAllowed,
    computedAt: input.computedAt,
  };
}

function createUrgentRouteBinding(input: {
  pharmacyCaseId: string;
  bounceBackType: Extract<
    UrgentReturnDirectRouteProfileSnapshot["bounceBackType"],
    "urgent_gp_return" | "safeguarding_concern"
  >;
  routeClass: UrgentReturnDirectRouteProfileSnapshot["routeClass"];
  directRouteRef: string;
  fallbackRouteRef: string | null;
  monitoredSafetyNetRequired: boolean;
  routeEvidenceRequirementRef: string;
  reviewedAt: string;
}): PharmacyUrgentRouteBinding {
  return {
    urgentReturnDirectRouteProfileId: `urgent_route_${input.pharmacyCaseId}`,
    bounceBackType: input.bounceBackType,
    routeClass: input.routeClass,
    directRouteRef: input.directRouteRef,
    fallbackRouteRef: input.fallbackRouteRef,
    monitoredSafetyNetRequired: input.monitoredSafetyNetRequired,
    routeEvidenceRequirementRef: input.routeEvidenceRequirementRef,
    calmCopyForbidden: true,
    reviewedAt: input.reviewedAt,
  };
}

function createLoopSupervisorBinding(input: {
  pharmacyCaseId: string;
  bounceBackRecordId: string;
  materialChange: number;
  loopRisk: number;
  reopenPriorityBand: number;
  supervisorReviewState: PharmacyBounceBackRecordSnapshot["supervisorReviewState"];
  autoRedispatchBlocked: boolean;
  autoCloseBlocked: boolean;
}): PharmacyLoopSupervisorBinding {
  return {
    pharmacyCaseId: input.pharmacyCaseId,
    bounceBackRecordId: input.bounceBackRecordId,
    materialChange: input.materialChange,
    loopRisk: input.loopRisk,
    reopenPriorityBand: input.reopenPriorityBand,
    supervisorReviewState: input.supervisorReviewState,
    autoRedispatchBlocked: input.autoRedispatchBlocked,
    autoCloseBlocked: input.autoCloseBlocked,
  };
}

export const pharmacyBounceBackRecoveryPreviewCases = [
  (() => {
    const bounceBackBinding = createBounceBackBinding({
      pharmacyCaseId: "PHC-2103",
      bounceBackType: "urgent_gp_return",
      materialChange: 0.82,
      loopRisk: 0.42,
      reopenSignal: 0.91,
      reopenPriorityBand: 3,
      supervisorReviewState: "not_required",
      gpActionRequired: true,
      reopenedCaseStatus: "urgent_bounce_back",
      autoRedispatchBlocked: true,
      autoCloseBlocked: true,
      returnedTaskRef: "duty-task::PHC-2103",
      reopenByAt: "2026-04-24T16:15:00.000Z",
      patientInformedAt: "2026-04-24T15:15:00.000Z",
      createdAt: "2026-04-24T15:08:00.000Z",
      updatedAt: "2026-04-24T15:16:00.000Z",
    });
    const truthBinding = createTruthBinding({
      pharmacyCaseId: "PHC-2103",
      reopenedCaseStatus: "urgent_bounce_back",
      returnedTaskRef: "duty-task::PHC-2103",
      reacquisitionMode: "duty_task",
      triageReentryState: "triage_active",
      gpActionRequired: true,
      materialChange: bounceBackBinding.materialChange,
      loopRisk: bounceBackBinding.loopRisk,
      reopenSignal: bounceBackBinding.reopenSignal,
      reopenPriorityBand: bounceBackBinding.reopenPriorityBand,
      patientNotificationState: "emitted",
      autoRedispatchBlocked: true,
      autoCloseBlocked: true,
      computedAt: "2026-04-24T15:16:00.000Z",
    });
    const notificationBinding = createNotificationBinding({
      pharmacyCaseId: "PHC-2103",
      notificationState: "emitted",
      channelHint: "secure_message",
      headlineCopyRef: "urgent_gp_return.headline",
      bodyCopyRef: "urgent_gp_return.body",
      warningCopyRef: "urgent_gp_return.warning",
      selectedAnchorRef: "queue:urgent-return",
      activeReturnContractRef: "return-contract::urgent",
      generatedAt: "2026-04-24T15:14:00.000Z",
      patientInformedAt: "2026-04-24T15:15:00.000Z",
    });
    const visibilityBinding = createVisibilityBinding({
      pharmacyCaseId: "PHC-2103",
      latestPatientInstructionState: "urgent_action",
      gpActionRequiredState: "urgent_gp_action",
      triageReentryState: "triage_active",
      urgentReturnState: "urgent_return_active",
      reachabilityRepairState: "not_required",
      currentCloseBlockerRefs: [
        "urgent-return-active",
        "dispatch-proof-invalid",
        "gp-action-required",
      ],
      minimumNecessaryAudienceView: "clinical_action_required",
      calmCopyAllowed: false,
      computedAt: "2026-04-24T15:16:00.000Z",
    });
    const urgentRouteBinding = createUrgentRouteBinding({
      pharmacyCaseId: "PHC-2103",
      bounceBackType: "urgent_gp_return",
      routeClass: "dedicated_professional_number",
      directRouteRef: "Integrated care desk / 0300 555 0184",
      fallbackRouteRef: "Monitored urgent email / urgent-returns@vecell.test",
      monitoredSafetyNetRequired: true,
      routeEvidenceRequirementRef: "Capture the spoken summary and callback owner before ending the call.",
      reviewedAt: "2026-04-24T15:10:00.000Z",
    });
    const loopSupervisorBinding = createLoopSupervisorBinding({
      pharmacyCaseId: "PHC-2103",
      bounceBackRecordId: bounceBackBinding.bounceBackRecordId,
      materialChange: bounceBackBinding.materialChange,
      loopRisk: bounceBackBinding.loopRisk,
      reopenPriorityBand: bounceBackBinding.reopenPriorityBand,
      supervisorReviewState: bounceBackBinding.supervisorReviewState,
      autoRedispatchBlocked: bounceBackBinding.autoRedispatchBlocked,
      autoCloseBlocked: bounceBackBinding.autoCloseBlocked,
    });
    return {
      pharmacyCaseId: "PHC-2103",
      visualMode: PHARMACY_RECOVERY_CONTROL_VISUAL_MODE,
      surfaceState: "urgent_return",
      banner: {
        tone: "critical",
        title: "Urgent return has reopened this case and quiet completion is forbidden",
        summary:
          "The shell must show an urgent recovery status until the GP route and monitored safety net are re-established.",
        detail:
          "The last dispatch proof remains visible for reference only. Every action now routes through the urgent return control path.",
        statusPill: "Urgent return active",
        announcementRole: "alert",
      },
      queue: {
        title: "Bounce-back recovery queue",
        summary:
          "Recovery stays explicit in the same shell: signal in, dispatch frozen, urgent route active, and patient message recorded.",
        items: [
          {
            itemId: "signal",
            label: "Safety signal received",
            state: "complete",
            summary: "Urgent GP return was normalized and attached to the case.",
            detail: "Material change and reopen signal both exceeded the urgent floor.",
          },
          {
            itemId: "freeze",
            label: "Dispatch frozen",
            state: "complete",
            summary: "Auto-redispatch and auto-close are blocked.",
            detail: "Previous dispatch proof is preserved only as continuity evidence.",
          },
          {
            itemId: "route",
            label: "Urgent route active",
            state: "current",
            summary: "Direct clinician route is the dominant action.",
            detail: "A monitored safety net is required before the case can calm.",
          },
          {
            itemId: "settle",
            label: "Return settled",
            state: "blocked",
            summary: "The case cannot settle until the urgent path confirms ownership.",
            detail: "Closure and quiet copy remain suppressed.",
          },
        ],
      },
      urgentReturnMode: {
        tone: "critical",
        title: "Urgent return mode",
        summary:
          "Use the direct professional route now; do not rely on the original dispatch or patient-facing calm copy.",
        routeClassLabel: labelFromToken(urgentRouteBinding.routeClass),
        directRouteLabel: urgentRouteBinding.directRouteRef,
        fallbackRouteLabel: urgentRouteBinding.fallbackRouteRef ?? "No secondary route recorded",
        monitoredSafetyNetLabel: urgentRouteBinding.monitoredSafetyNetRequired
          ? "Monitored safety net required"
          : "No monitored safety net required",
        calmCopyLabel: urgentRouteBinding.calmCopyForbidden
          ? "Calm patient copy suppressed"
          : "Calm patient copy allowed",
      },
      openOriginalRequestAction: {
        title: "Original request anchor",
        summary:
          "The original request stays in the shell so the pharmacist can reopen against the exact case frame without losing context.",
        buttonLabel: "Open original request in the same shell",
        hint: "Returns to the active case anchor instead of creating a detached recovery journey.",
        availabilityState: "available",
      },
      returnMessagePreview: {
        title: "Patient return message preview",
        summary:
          "This is the current patient-safe wording, held against the emitted return agreement and queue item.",
        headline: "Please contact your GP practice urgently about your pharmacy referral",
        body:
          "We have reopened your referral because the pharmacy cannot complete it safely through the original path. Your GP team is being contacted now.",
        warning:
          "Do not tell the patient the referral is complete or ask them to wait for the pharmacy to continue the same route.",
        notificationStateLabel: "Emitted",
        channelHintLabel: "Secure message",
        anchorLabel: notificationBinding.selectedAnchorRef,
        contractLabel: notificationBinding.activeReturnContractRef ? "Active return agreement" : "No active return agreement",
      },
      reopenDiffStrip: {
        title: "Reopen diff",
        summary:
          "The recovery strip shows what changed from the last calm-safe status to the current reopened state.",
        rows: [
          {
            diffId: "proof",
            label: "Dispatch proof",
            previousValue: "Authoritative proof / accepted",
            currentValue: "Contradictory proof / urgent return",
            implication: "Keep proof visible for audit but remove it from calm status copy.",
          },
          {
            diffId: "route",
            label: "Dominant route",
            previousValue: "Original dispatch continuation",
            currentValue: "Dedicated professional number",
            implication: "Recovery work moves to urgent clinician routing immediately.",
          },
          {
            diffId: "patient",
            label: "Patient status",
            previousValue: "Action in progress",
            currentValue: "Urgent action",
            implication: "The patient message must stay explicit and non-calm.",
          },
        ],
      },
      loopRiskEscalationCard: {
        tone: loopRiskTone(loopSupervisorBinding.loopRisk ?? 0),
        title: "Loop-risk status",
        summary:
          "This urgent return is not yet in supervisor escalation, but the shell still makes the loop-risk score visible so repeat returns can be spotted early.",
        loopRiskLabel: `${percent(loopSupervisorBinding.loopRisk ?? 0)} / ${loopRiskBand(
          loopSupervisorBinding.loopRisk ?? 0,
        )}`,
        reopenPriorityLabel: priorityLabel(loopSupervisorBinding.reopenPriorityBand ?? 0),
        supervisorStateLabel: labelFromToken(loopSupervisorBinding.supervisorReviewState ?? "not_required"),
        autoBlockSummary: ["Auto-redispatch blocked", "Auto-close blocked"],
        announcementRole: "status",
      },
      decisionDock: {
        tone: "critical",
        title: "Open the recovery route that keeps this urgent return safe",
        summary:
          "The dominant action is to reopen the original case frame and carry the urgent return evidence with it.",
        currentOwnerLabel: "Duty pharmacist / urgent return owner",
        consequenceTitle: "Consequence preview",
        consequenceSummary:
          "Opening handoff proof keeps the prior route visible; opening validation keeps the new urgent route and return evidence in view.",
        closeBlockers: visibilityBinding.currentCloseBlockerRefs,
        primaryAction: {
          actionId: "open-validate",
          label: "Open validation board",
          detail: "Re-enter the case on the original request frame with the urgent return preserved.",
          routeTarget: "validate",
          emphasis: "primary",
        },
        secondaryActions: [
          {
            actionId: "open-handoff",
            label: "Inspect handoff proof",
            detail: "Compare the old dispatch proof with the urgent return route.",
            routeTarget: "handoff",
            emphasis: "secondary",
          },
          {
            actionId: "open-resolve",
            label: "Review return outcome",
            detail: "Inspect the reopened outcome lane without losing the current shell anchor.",
            routeTarget: "resolve",
            emphasis: "secondary",
          },
        ],
      },
      bounceBackBinding,
      truthBinding,
      notificationBinding,
      visibilityBinding,
      urgentRouteBinding,
      loopSupervisorBinding,
    } satisfies PharmacyBounceBackRecoveryPreviewSnapshot;
  })(),
  (() => {
    const bounceBackBinding = createBounceBackBinding({
      pharmacyCaseId: "PHC-2204",
      bounceBackType: "routine_gp_return",
      materialChange: 0.58,
      loopRisk: 0.28,
      reopenSignal: 0.63,
      reopenPriorityBand: 1,
      supervisorReviewState: "not_required",
      gpActionRequired: false,
      reopenedCaseStatus: "unresolved_returned",
      autoRedispatchBlocked: true,
      autoCloseBlocked: true,
      returnedTaskRef: null,
      reopenByAt: "2026-04-24T18:00:00.000Z",
      patientInformedAt: null,
      createdAt: "2026-04-24T14:52:00.000Z",
      updatedAt: "2026-04-24T15:18:00.000Z",
    });
    const truthBinding = createTruthBinding({
      pharmacyCaseId: "PHC-2204",
      reopenedCaseStatus: "unresolved_returned",
      returnedTaskRef: null,
      reacquisitionMode: "original_request",
      triageReentryState: "reentry_pending",
      gpActionRequired: false,
      materialChange: bounceBackBinding.materialChange,
      loopRisk: bounceBackBinding.loopRisk,
      reopenSignal: bounceBackBinding.reopenSignal,
      reopenPriorityBand: bounceBackBinding.reopenPriorityBand,
      patientNotificationState: "ready",
      autoRedispatchBlocked: true,
      autoCloseBlocked: true,
      computedAt: "2026-04-24T15:18:00.000Z",
    });
    const notificationBinding = createNotificationBinding({
      pharmacyCaseId: "PHC-2204",
      notificationState: "ready",
      channelHint: "sms",
      headlineCopyRef: "routine_gp_return.headline",
      bodyCopyRef: "routine_gp_return.body",
      warningCopyRef: null,
      selectedAnchorRef: "case:original-request",
      activeReturnContractRef: "return-contract::routine",
      generatedAt: "2026-04-24T15:19:00.000Z",
      patientInformedAt: null,
    });
    const visibilityBinding = createVisibilityBinding({
      pharmacyCaseId: "PHC-2204",
      latestPatientInstructionState: "reviewing_next_steps",
      gpActionRequiredState: "routine_review",
      triageReentryState: "reentry_pending",
      urgentReturnState: "routine_return_active",
      reachabilityRepairState: "not_required",
      currentCloseBlockerRefs: ["routine-return-open", "patient-message-not-yet-emitted"],
      minimumNecessaryAudienceView: "summary_only",
      calmCopyAllowed: false,
      computedAt: "2026-04-24T15:18:00.000Z",
    });
    const loopSupervisorBinding = createLoopSupervisorBinding({
      pharmacyCaseId: "PHC-2204",
      bounceBackRecordId: bounceBackBinding.bounceBackRecordId,
      materialChange: bounceBackBinding.materialChange,
      loopRisk: bounceBackBinding.loopRisk,
      reopenPriorityBand: bounceBackBinding.reopenPriorityBand,
      supervisorReviewState: bounceBackBinding.supervisorReviewState,
      autoRedispatchBlocked: bounceBackBinding.autoRedispatchBlocked,
      autoCloseBlocked: bounceBackBinding.autoCloseBlocked,
    });
    return {
      pharmacyCaseId: "PHC-2204",
      visualMode: PHARMACY_RECOVERY_CONTROL_VISUAL_MODE,
      surfaceState: "routine_reopen",
      banner: {
        tone: "review",
        title: "Routine return has reopened the original request and removed quiet closure",
        summary:
          "This is a same-shell reopen. The shell keeps the original request anchor visible so the pharmacist can compare old and new truth before acting.",
        detail:
          "A duty task is not required yet. The original request remains the lawful place to continue the recovery.",
        statusPill: "Routine return active",
        announcementRole: "status",
      },
      queue: {
        title: "Bounce-back recovery queue",
        summary:
          "The shell keeps a gentle but explicit recovery state: return received, original request reopened, patient message prepared, settlement still blocked.",
        items: [
          {
            itemId: "signal",
            label: "Return normalized",
            state: "complete",
            summary: "Routine return was captured from the latest pharmacy message.",
            detail: "Reopen signal cleared the secondary threshold without requiring urgent routing.",
          },
          {
            itemId: "reopen",
            label: "Original request reopened",
            state: "current",
            summary: "The original request anchor is the recovery workspace.",
            detail: "No separate duty-task branch is necessary while the return remains routine.",
          },
          {
            itemId: "notify",
            label: "Patient message prepared",
            state: "pending",
            summary: "Message copy is ready but has not been emitted yet.",
            detail: "The shell keeps the contract-bound preview visible before release.",
          },
          {
            itemId: "settle",
            label: "Close posture restored",
            state: "blocked",
            summary: "Quiet closure stays blocked until the reopen settles.",
            detail: "Auto-close remains forbidden.",
          },
        ],
      },
      urgentReturnMode: {
        tone: "watch",
        title: "Routine return mode",
        summary:
          "No direct urgent route is required. Continue in the original request frame and keep patient messaging explicit until the reopen settles.",
        routeClassLabel: "Original request reacquisition",
        directRouteLabel: "Return to the original request board",
        fallbackRouteLabel: "Escalate to duty task only if the return worsens or stalls",
        monitoredSafetyNetLabel: "Monitored safety net not required",
        calmCopyLabel: "Calm patient copy still suppressed until recovery settles",
      },
      openOriginalRequestAction: {
        title: "Original request anchor",
        summary:
          "The authoritative next step is to continue from the original request, not to split the case into a detached recovery record.",
        buttonLabel: "Open original request in the same shell",
        hint: "The selected checkpoint and line item stay pinned when you return.",
        availabilityState: "available",
      },
      returnMessagePreview: {
        title: "Patient return message preview",
        summary:
          "This preview is tied to the current return agreement and the existing case item so the wording stays clear when the reopen is released.",
        headline: "We need to review your pharmacy referral before the next step can continue",
        body:
          "Your referral has been reopened because the pharmacy could not continue the original route as planned. We are reviewing the next safe step now.",
        warning: null,
        notificationStateLabel: "Ready to send",
        channelHintLabel: "SMS",
        anchorLabel: notificationBinding.selectedAnchorRef,
        contractLabel: notificationBinding.activeReturnContractRef ? "Active return agreement" : "No active return agreement",
      },
      reopenDiffStrip: {
        title: "Reopen diff",
        summary:
          "The diff strip compares the last quiet-safe posture with the current reopened state so the pharmacist can see what changed before continuing.",
        rows: [
          {
            diffId: "continuity",
            label: "Case frame",
            previousValue: "Dispatch continuation",
            currentValue: "Original request reacquired",
            implication: "Return through the same shell to keep prior checkpoints and line items intact.",
          },
          {
            diffId: "message",
            label: "Patient message",
            previousValue: "No recovery copy required",
            currentValue: "Reviewing next steps",
            implication: "Patient copy must stay explicit until the reopen settles.",
          },
          {
            diffId: "close",
            label: "Close posture",
            previousValue: "Awaiting completion proof",
            currentValue: "Blocked by routine return",
            implication: "Do not let the case drift back into quiet completion language.",
          },
        ],
      },
      loopRiskEscalationCard: {
        tone: loopRiskTone(loopSupervisorBinding.loopRisk ?? 0),
        title: "Loop-risk status",
        summary:
          "Loop risk is low enough to avoid supervisor escalation, but it remains visible so repeated returns can be spotted without reading logs.",
        loopRiskLabel: `${percent(loopSupervisorBinding.loopRisk ?? 0)} / ${loopRiskBand(
          loopSupervisorBinding.loopRisk ?? 0,
        )}`,
        reopenPriorityLabel: priorityLabel(loopSupervisorBinding.reopenPriorityBand ?? 0),
        supervisorStateLabel: labelFromToken(loopSupervisorBinding.supervisorReviewState ?? "not_required"),
        autoBlockSummary: ["Auto-redispatch blocked", "Auto-close blocked"],
        announcementRole: "status",
      },
      decisionDock: {
        tone: "review",
        title: "Return to the original request and review what changed",
        summary:
          "The recovery remains bounded to the original case frame, so the next safe action is to reopen the validation board with the diff strip in view.",
        currentOwnerLabel: "Pharmacy queue owner / reopen follow-up",
        consequenceTitle: "Consequence preview",
        consequenceSummary:
          "Re-entering the validation board keeps the queue anchor, patient message preview, and return diff together.",
        closeBlockers: visibilityBinding.currentCloseBlockerRefs,
        primaryAction: {
          actionId: "open-validate",
          label: "Open validation board",
          detail: "Continue from the original request with the reopen diff and recovery message still visible.",
          routeTarget: "validate",
          emphasis: "primary",
        },
        secondaryActions: [
          {
            actionId: "open-handoff",
            label: "Inspect handoff proof",
            detail: "Compare the old proof chain with the new reopen posture.",
            routeTarget: "handoff",
            emphasis: "secondary",
          },
          {
            actionId: "open-resolve",
            label: "Review outcome lane",
            detail: "Check whether the latest return signal changes outcome posture.",
            routeTarget: "resolve",
            emphasis: "secondary",
          },
        ],
      },
      bounceBackBinding,
      truthBinding,
      notificationBinding,
      visibilityBinding,
      urgentRouteBinding: null,
      loopSupervisorBinding,
    } satisfies PharmacyBounceBackRecoveryPreviewSnapshot;
  })(),
  (() => {
    const bounceBackBinding = createBounceBackBinding({
      pharmacyCaseId: "PHC-2215",
      bounceBackType: "patient_not_contactable",
      materialChange: 0.71,
      loopRisk: 0.84,
      reopenSignal: 0.78,
      reopenPriorityBand: 4,
      supervisorReviewState: "required",
      gpActionRequired: false,
      reopenedCaseStatus: "no_contact_return_pending",
      autoRedispatchBlocked: true,
      autoCloseBlocked: true,
      returnedTaskRef: "duty-task::PHC-2215-loop",
      reopenByAt: "2026-04-24T15:40:00.000Z",
      patientInformedAt: null,
      createdAt: "2026-04-24T14:36:00.000Z",
      updatedAt: "2026-04-24T15:20:00.000Z",
    });
    const truthBinding = createTruthBinding({
      pharmacyCaseId: "PHC-2215",
      reopenedCaseStatus: "no_contact_return_pending",
      returnedTaskRef: "duty-task::PHC-2215-loop",
      reacquisitionMode: "duty_task",
      triageReentryState: "reentry_pending",
      gpActionRequired: false,
      materialChange: bounceBackBinding.materialChange,
      loopRisk: bounceBackBinding.loopRisk,
      reopenSignal: bounceBackBinding.reopenSignal,
      reopenPriorityBand: bounceBackBinding.reopenPriorityBand,
      patientNotificationState: "suppressed",
      autoRedispatchBlocked: true,
      autoCloseBlocked: true,
      computedAt: "2026-04-24T15:20:00.000Z",
    });
    const visibilityBinding = createVisibilityBinding({
      pharmacyCaseId: "PHC-2215",
      latestPatientInstructionState: "reviewing_next_steps",
      gpActionRequiredState: "none",
      triageReentryState: "reentry_pending",
      urgentReturnState: "routine_return_active",
      reachabilityRepairState: "required",
      currentCloseBlockerRefs: [
        "loop-risk-escalated",
        "contact-route-repair-required",
        "supervisor-review-required",
      ],
      minimumNecessaryAudienceView: "operations_attention",
      calmCopyAllowed: false,
      computedAt: "2026-04-24T15:20:00.000Z",
    });
    const loopSupervisorBinding = createLoopSupervisorBinding({
      pharmacyCaseId: "PHC-2215",
      bounceBackRecordId: bounceBackBinding.bounceBackRecordId,
      materialChange: bounceBackBinding.materialChange,
      loopRisk: bounceBackBinding.loopRisk,
      reopenPriorityBand: bounceBackBinding.reopenPriorityBand,
      supervisorReviewState: bounceBackBinding.supervisorReviewState,
      autoRedispatchBlocked: bounceBackBinding.autoRedispatchBlocked,
      autoCloseBlocked: bounceBackBinding.autoCloseBlocked,
    });
    return {
      pharmacyCaseId: "PHC-2215",
      visualMode: PHARMACY_RECOVERY_CONTROL_VISUAL_MODE,
      surfaceState: "loop_risk_escalated",
      banner: {
        tone: "blocked",
        title: "Repeated bounce-backs have escalated loop risk and frozen automatic recovery",
        summary:
          "This case has returned too many times to continue on a normal reopen path. Supervisor review is now part of the dominant action.",
        detail:
          "Contact repair is still required, but the shell must show the escalation and block any quiet retries or silent closure.",
        statusPill: "Loop risk escalated",
        announcementRole: "alert",
      },
      queue: {
        title: "Bounce-back recovery queue",
        summary:
          "The queue shows repeated return evidence, contact-route breakage, supervisor escalation, and frozen auto-actions in one place.",
        items: [
          {
            itemId: "repeat",
            label: "Repeat return detected",
            state: "complete",
            summary: "The return count and score crossed the loop threshold.",
            detail: "This case must no longer auto-redispatch or auto-close.",
          },
          {
            itemId: "contact",
            label: "Contact route repair required",
            state: "current",
            summary: "The patient cannot currently receive a trustworthy next-step message.",
            detail: "Notification remains suppressed until reachability is repaired.",
          },
          {
            itemId: "supervisor",
            label: "Supervisor review required",
            state: "current",
            summary: "Escalation is now part of the dominant recovery status.",
            detail: "A supervisor must either allow redispatch, keep the block, or dismiss the return as material noise.",
          },
          {
            itemId: "settle",
            label: "Recovery settled",
            state: "blocked",
            summary: "Settlement is blocked by loop risk and reachability debt.",
            detail: "The case cannot settle until escalation and contact repair both clear.",
          },
        ],
      },
      urgentReturnMode: {
        tone: "blocked",
        title: "Escalated recovery mode",
        summary:
          "This is not an urgent GP route, but it is no longer a routine reopen either. Continue only through the escalated recovery controls.",
        routeClassLabel: "Duty task with supervisor escalation",
        directRouteLabel: "Loop-risk escalation queue",
        fallbackRouteLabel: "Return to original request only after supervisor resolution",
        monitoredSafetyNetLabel: "Contact-route repair required before patient message release",
        calmCopyLabel: "Calm patient copy suppressed",
      },
      openOriginalRequestAction: {
        title: "Original request anchor",
        summary:
          "The original request is still visible for context, but the next decisive action is the duty-task escalation rather than a simple return to workbench mode.",
        buttonLabel: "Return to original request reference",
        hint: "Use this only to inspect the original frame; the active recovery path is the escalated duty-task route.",
        availabilityState: "duty_task_only",
      },
      returnMessagePreview: {
        title: "Patient return message preview",
        summary:
          "The patient-facing message remains suppressed until contact-route repair and supervisor review both clear.",
        headline: "Next-step message is paused while we repair how to contact the patient",
        body:
          "The referral has been reopened, but we are not sending new instructions until we confirm the patient can receive them safely.",
        warning:
          "Do not emit a partial message while the contact route is still broken or while loop-risk escalation remains unresolved.",
        notificationStateLabel: "Suppressed",
        channelHintLabel: "No release channel",
        anchorLabel: "contact-route-repair",
        contractLabel: "No active return agreement until repair settles",
      },
      reopenDiffStrip: {
        title: "Reopen diff",
        summary:
          "The diff shows how repeated returns changed the case from ordinary reopen posture into escalated recovery with supervisor debt.",
        rows: [
          {
            diffId: "return-count",
            label: "Recovery pattern",
            previousValue: "Single reopen",
            currentValue: "Repeated bounce-backs / loop risk high",
            implication: "Escalate instead of attempting another quiet retry.",
          },
          {
            diffId: "message",
            label: "Patient message",
            previousValue: "Ready to send",
            currentValue: "Suppressed pending repair",
            implication: "No patient instruction can be emitted until contact repair succeeds.",
          },
          {
            diffId: "owner",
            label: "Current owner",
            previousValue: "Routine reopen queue",
            currentValue: "Supervisor review and duty-task owner",
            implication: "The case has crossed into escalated recovery handling.",
          },
        ],
      },
      loopRiskEscalationCard: {
        tone: "critical",
        title: "Loop-risk escalation",
        summary:
          "Loop risk is now high enough that the shell must foreground supervisor review and hard auto-blocks.",
        loopRiskLabel: `${percent(loopSupervisorBinding.loopRisk ?? 0)} / ${loopRiskBand(
          loopSupervisorBinding.loopRisk ?? 0,
        )}`,
        reopenPriorityLabel: priorityLabel(loopSupervisorBinding.reopenPriorityBand ?? 0),
        supervisorStateLabel: labelFromToken(loopSupervisorBinding.supervisorReviewState ?? "required"),
        autoBlockSummary: [
          "Auto-redispatch blocked",
          "Auto-close blocked",
          "Patient notification suppressed",
        ],
        announcementRole: "alert",
      },
      decisionDock: {
        tone: "blocked",
        title: "Resolve escalation before any recovery can continue",
        summary:
          "The dominant action is to move through validation and proof review with the escalation card still in view.",
        currentOwnerLabel: "Supervisor review owner / loop-risk queue",
        consequenceTitle: "Consequence preview",
        consequenceSummary:
          "Validation keeps the reopened case visible; handoff lets the pharmacist compare prior proof and current suppression. Neither route removes the escalation block.",
        closeBlockers: visibilityBinding.currentCloseBlockerRefs,
        primaryAction: {
          actionId: "open-validate",
          label: "Open validation board",
          detail: "Review the reopened case with loop-risk and contact-repair debt pinned in view.",
          routeTarget: "validate",
          emphasis: "primary",
        },
        secondaryActions: [
          {
            actionId: "open-handoff",
            label: "Inspect handoff proof",
            detail: "Compare previous dispatch proof with the repeated bounce-back pattern.",
            routeTarget: "handoff",
            emphasis: "secondary",
          },
          {
            actionId: "stay-assurance",
            label: "Keep recovery board open",
            detail: "Remain on the recovery control surface while supervisor review is pending.",
            routeTarget: "assurance",
            emphasis: "secondary",
          },
        ],
      },
      bounceBackBinding,
      truthBinding,
      notificationBinding: null,
      visibilityBinding,
      urgentRouteBinding: null,
      loopSupervisorBinding,
    } satisfies PharmacyBounceBackRecoveryPreviewSnapshot;
  })(),
] as const satisfies readonly PharmacyBounceBackRecoveryPreviewSnapshot[];

export function resolvePharmacyBounceBackRecoveryPreview(
  pharmacyCaseId: string,
): PharmacyBounceBackRecoveryPreviewSnapshot | null {
  return (
    pharmacyBounceBackRecoveryPreviewCases.find(
      (preview) => preview.pharmacyCaseId === pharmacyCaseId,
    ) ?? null
  );
}

export function makePharmacyBounceBackRecoveryPreviewCaseRef(
  pharmacyCaseId: string,
): AggregateRef<"PharmacyCase", Task342> {
  return makeCaseRef(pharmacyCaseId);
}
