import type { RuntimeScenario } from "@vecells/persistent-shell";
import { requireCase } from "./workspace-shell.data";

export type ConsequenceBoundaryMode =
  | "self_care"
  | "admin_resolution"
  | "clinician_review_required"
  | "blocked_pending_review";

export type ConsequenceMutationState =
  | "live"
  | "stale_recoverable"
  | "recovery_only"
  | "blocked";

export type AdviceSettlementState =
  | "renderable"
  | "withheld"
  | "invalidated"
  | "superseded"
  | "quarantined";

export type AdminDependencyState =
  | "clear"
  | "repair_required"
  | "disputed"
  | "blocked_pending_identity"
  | "blocked_pending_consent"
  | "blocked_pending_external_confirmation";

export type ConsequenceReopenState =
  | "stable"
  | "reopen_required"
  | "reopened"
  | "blocked_pending_review";

export type AdminSettlementState =
  | "queued"
  | "patient_notified"
  | "waiting_dependency"
  | "completed"
  | "reopened_for_review"
  | "blocked_pending_safety"
  | "stale_recoverable";

export type PatientExpectationClass =
  | "self_care_guidance"
  | "self_care_safety_net"
  | "admin_waiting"
  | "admin_completion"
  | "blocked_recovery";

type ConsequenceTone = "self_care" | "admin" | "reopen";

interface SelfCareSeed {
  bundleVersionRef: string;
  variantLabel: string;
  localeLabel: string;
  safetyNetSummary: string;
  watchWindowLabel: string;
  watchState: "monitoring" | "review_required" | "rollback_recommended" | "closed";
  releaseWatchRef: string;
  trustState: "trusted" | "degraded" | "quarantined";
  issueSummary: string;
  draftDefault: string;
  issueEvidence: readonly string[];
  actionLabel: string;
}

interface AdminSeed {
  subtypeRef: string;
  subtypeLabel: string;
  subtypeSummary: string;
  ownerLabel: string;
  waitingShapeLabel: string;
  waitingReasonLabel: string;
  completionArtifactLabel: string;
  completionArtifactRef: string | null;
  completionArtifactSummary: string;
  actionLabel: string;
  subtypeOptions: readonly {
    subtypeRef: string;
    label: string;
    summary: string;
  }[];
}

interface DependencyBlockerSeed {
  blockerId: string;
  label: string;
  summary: string;
  tone: "neutral" | "caution" | "critical" | "accent";
  dominant: boolean;
}

interface ConsequenceCaseSeed {
  taskId: string;
  tone: ConsequenceTone;
  boundaryMode: ConsequenceBoundaryMode;
  clinicalMeaningState:
    | "informational_only"
    | "bounded_admin_only"
    | "clinician_reentry_required";
  operationalFollowUpScope: "none" | "self_serve_guidance" | "bounded_admin_resolution";
  adminMutationAuthorityState: "none" | "bounded_admin_only" | "frozen";
  boundaryState: "live" | "superseded" | "reopened" | "blocked";
  reopenState: ConsequenceReopenState;
  boundaryTupleHash: string;
  decisionEpochRef: string;
  boundaryDecisionRef: string;
  dependencySetRef: string;
  adviceSettlement: AdviceSettlementState;
  adminSettlement: AdminSettlementState | null;
  queueSummary: string;
  routeSummary: string;
  dominantMeaningLabel: string;
  selectedAnchorRef: string;
  reasonLabels: readonly string[];
  patientExpectationTemplateRef: string;
  patientExpectationClass: PatientExpectationClass;
  patientExpectationDeliveryMode: "full" | "summary_safe" | "placeholder_safe";
  patientExpectationHeadline: string;
  patientExpectationSummary: string;
  patientExpectationReviewLabel: string;
  patientExpectationTupleLabel: string;
  selfCare: SelfCareSeed | null;
  admin: AdminSeed | null;
  dependencyState: AdminDependencyState;
  dominantRecoveryRouteRef: string;
  dominantRecoveryLabel: string;
  dependencyBlockers: readonly DependencyBlockerSeed[];
  driftSummary: string;
  recoveryGuidance: string;
  reopenCue: string;
}

export interface ConsequenceWorkbenchRowProjection {
  rowId: string;
  taskId: string;
  anchorRef: string;
  patientLabel: string;
  modeLabel: string;
  summary: string;
  boundaryMode: ConsequenceBoundaryMode;
  adviceSettlement: AdviceSettlementState;
  adminSettlement: AdminSettlementState | "not_applicable";
  dependencyState: AdminDependencyState;
  reopenState: ConsequenceReopenState;
  selected: boolean;
}

export interface SelfCarePreviewSummaryProjection {
  previewId: string;
  bundleVersionRef: string;
  variantLabel: string;
  localeLabel: string;
  safetyNetSummary: string;
  watchWindowLabel: string;
  watchState: "monitoring" | "review_required" | "rollback_recommended" | "closed";
  releaseWatchRef: string;
  adviceSettlement: AdviceSettlementState;
  trustState: "trusted" | "degraded" | "quarantined";
}

export interface SelfCareIssueStageProjection {
  stageId: string;
  stageState: "issue_ready" | "settled" | "stale_recoverable" | "recovery_only" | "blocked";
  summary: string;
  draftDefault: string;
  issueEvidence: readonly string[];
  actionLabel: string;
  actionEnabled: boolean;
  freezeReason: string | null;
}

export interface AdminDependencyBlockerProjection {
  blockerId: string;
  label: string;
  summary: string;
  tone: "neutral" | "caution" | "critical" | "accent";
  dominant: boolean;
}

export interface AdminDependencyPanelProjection {
  panelId: string;
  dependencySetRef: string;
  dependencyState: AdminDependencyState;
  reopenState: ConsequenceReopenState;
  dominantRecoveryRouteRef: string;
  dominantRecoveryLabel: string;
  blockers: readonly AdminDependencyBlockerProjection[];
}

export interface PatientExpectationPreviewProjection {
  previewId: string;
  expectationTemplateRef: string;
  expectationClass: PatientExpectationClass;
  deliveryMode: "full" | "summary_safe" | "placeholder_safe";
  headline: string;
  summary: string;
  nextReviewLabel: string;
  tupleAlignmentLabel: string;
}

export interface AdminResolutionStageProjection {
  stageId: string;
  stageState:
    | "preview"
    | "waiting_dependency"
    | "completed"
    | "reopened"
    | "blocked_pending_safety"
    | "stale_recoverable";
  subtypeRef: string;
  subtypeLabel: string;
  subtypeSummary: string;
  ownerLabel: string;
  waitingShapeLabel: string;
  waitingReasonLabel: string;
  completionArtifactLabel: string;
  completionArtifactRef: string | null;
  completionArtifactSummary: string;
  actionLabel: string;
  actionEnabled: boolean;
  freezeReason: string | null;
  settlementState: AdminSettlementState;
  subtypeOptions: readonly {
    subtypeRef: string;
    label: string;
    summary: string;
  }[];
}

export interface BoundaryDriftRecoveryProjection {
  recoveryId: string;
  visible: boolean;
  recoveryState: "stale_recoverable" | "reopen_required" | "recovery_only" | "blocked";
  summary: string;
  guidance: string;
  reasonLabels: readonly string[];
  reopenCue: string;
}

export interface SelfCareAdminDetailProjection {
  detailId: string;
  taskId: string;
  patientLabel: string;
  visualMode: "Bounded_Consequence_Studio";
  mutationState: ConsequenceMutationState;
  boundaryMode: ConsequenceBoundaryMode;
  clinicalMeaningState: ConsequenceCaseSeed["clinicalMeaningState"];
  operationalFollowUpScope: ConsequenceCaseSeed["operationalFollowUpScope"];
  adminMutationAuthorityState: ConsequenceCaseSeed["adminMutationAuthorityState"];
  boundaryState: ConsequenceCaseSeed["boundaryState"];
  reopenState: ConsequenceReopenState;
  boundaryTupleHash: string;
  boundaryDecisionRef: string;
  decisionEpochRef: string;
  dominantMeaningLabel: string;
  routeSummary: string;
  reasonLabels: readonly string[];
  adviceSettlement: AdviceSettlementState;
  adminSettlement: AdminSettlementState | "not_applicable";
  selfCarePreviewSummary: SelfCarePreviewSummaryProjection | null;
  selfCareIssueStage: SelfCareIssueStageProjection | null;
  adminResolutionStage: AdminResolutionStageProjection | null;
  adminDependencyPanel: AdminDependencyPanelProjection;
  patientExpectationPreview: PatientExpectationPreviewProjection;
  boundaryDriftRecovery: BoundaryDriftRecoveryProjection;
  sourceSummaryPoints: readonly string[];
}

export interface SelfCareAdminViewsRouteProjection {
  routeId: string;
  visualMode: "Bounded_Consequence_Studio";
  queueHealthSummary: string;
  rowCount: number;
  selectedTaskId: string;
  rows: readonly ConsequenceWorkbenchRowProjection[];
  detailSurface: SelfCareAdminDetailProjection;
}

const adminSubtypeOptions = {
  document: [
    {
      subtypeRef: "document_or_letter_workflow",
      label: "Document or letter workflow",
      summary: "Issue or correct a governed outbound document with one typed completion artifact.",
    },
    {
      subtypeRef: "result_follow_up_workflow",
      label: "Result follow-up workflow",
      summary: "Bounded result follow-up after the clinical meaning is already resolved.",
    },
  ] as const,
  medication: [
    {
      subtypeRef: "medication_admin_query",
      label: "Medication admin query",
      summary: "Non-clinical prescription administration follow-up with explicit dependency handling.",
    },
    {
      subtypeRef: "form_workflow",
      label: "Form workflow",
      summary: "Use only when the blocked dependency is governed paperwork rather than medication routing.",
    },
  ] as const,
  registration: [
    {
      subtypeRef: "registration_or_demographic_update",
      label: "Registration or demographic update",
      summary: "Identity-safe corrections and owner-visible waiting posture.",
    },
    {
      subtypeRef: "routed_admin_task",
      label: "Routed admin task",
      summary: "Temporary bounded ingress that still needs concrete subtype confirmation.",
    },
  ] as const,
} as const;

const consequenceSeeds: readonly ConsequenceCaseSeed[] = [
  {
    taskId: "task-311",
    tone: "self_care",
    boundaryMode: "self_care",
    clinicalMeaningState: "informational_only",
    operationalFollowUpScope: "self_serve_guidance",
    adminMutationAuthorityState: "none",
    boundaryState: "live",
    reopenState: "stable",
    boundaryTupleHash: "boundary_tuple::task-311::self-care-v4",
    decisionEpochRef: "decision_epoch::task-311::self-care-v4",
    boundaryDecisionRef: "self_care_boundary_decision::task-311::current",
    dependencySetRef: "advice_admin_dependency_set::task-311::current",
    adviceSettlement: "renderable",
    adminSettlement: null,
    queueSummary: "Self-care guidance is current and publishable on the active tuple.",
    routeSummary:
      "Issue informational guidance only. The summary, safety-net text, and patient preview stay bound to the current advice settlement and watch window.",
    dominantMeaningLabel: "Informational guidance only",
    selectedAnchorRef: "consequence-detail-task-311",
    reasonLabels: [
      "clinicalMeaningState = informational_only",
      "operationalFollowUpScope = self_serve_guidance",
      "AdviceAdminDependencySet.reopenState = stable",
    ],
    patientExpectationTemplateRef: "patient_expectation_template::self-care-guidance-v4",
    patientExpectationClass: "self_care_guidance",
    patientExpectationDeliveryMode: "full",
    patientExpectationHeadline: "We are sharing guidance, not opening an admin follow-up case.",
    patientExpectationSummary:
      "The patient sees inhaler advice, a safety-net return threshold, and one watch-window note. Nothing here implies a practice admin promise or completion milestone.",
    patientExpectationReviewLabel: "Watch through 20 Apr 14:00",
    patientExpectationTupleLabel: "Patient preview aligns to boundary_tuple::task-311::self-care-v4",
    selfCare: {
      bundleVersionRef: "advice_bundle_version::inhaler-guidance::v12",
      variantLabel: "SMS + portal variant",
      localeLabel: "en-GB / standard readability",
      safetyNetSummary: "Return immediately if wheeze worsens, inhaler use increases, or symptoms persist past 48 hours.",
      watchWindowLabel: "Follow-up watch window closes 20 Apr 14:00",
      watchState: "monitoring",
      releaseWatchRef: "advice_admin_release_watch::task-311::self-care",
      trustState: "trusted",
      issueSummary:
        "The advice bundle is current, clinically informational, and safe to issue while the boundary tuple, decision epoch, and watch window still match.",
      draftDefault:
        "Patient-safe reminder: continue controller inhaler as labelled and recontact earlier if overnight wheeze returns.",
      issueEvidence: [
        "Advice bundle version v12 is current for this locale and channel mix.",
        "Safety-net summary stays visible with the same boundary tuple.",
        "The patient wording preview is aligned to the same expectation template ref.",
      ],
      actionLabel: "Issue self-care advice",
    },
    admin: null,
    dependencyState: "clear",
    dominantRecoveryRouteRef: "dominant_recovery_route::task-311::none",
    dominantRecoveryLabel: "No admin blocker is active on this tuple.",
    dependencyBlockers: [
      {
        blockerId: "dependency-clear-task-311",
        label: "No current dependency blocker",
        summary: "This consequence stays informational. No bounded admin follow-up is currently legal or required.",
        tone: "accent",
        dominant: true,
      },
    ],
    driftSummary: "If the decision epoch, tuple hash, or watch window drifts, the issue control freezes in place and the last draft remains visible.",
    recoveryGuidance: "Refresh the boundary tuple, confirm the watch window, then recommit from the same shell.",
    reopenCue: "No reopen trigger is currently active.",
  },
  {
    taskId: "task-507",
    tone: "admin",
    boundaryMode: "admin_resolution",
    clinicalMeaningState: "bounded_admin_only",
    operationalFollowUpScope: "bounded_admin_resolution",
    adminMutationAuthorityState: "bounded_admin_only",
    boundaryState: "live",
    reopenState: "stable",
    boundaryTupleHash: "boundary_tuple::task-507::admin-blocked-v3",
    decisionEpochRef: "decision_epoch::task-507::admin-blocked-v3",
    boundaryDecisionRef: "self_care_boundary_decision::task-507::current",
    dependencySetRef: "advice_admin_dependency_set::task-507::current",
    adviceSettlement: "superseded",
    adminSettlement: "waiting_dependency",
    queueSummary: "Bounded admin work is still legal, but the dominant blocker is unresolved external confirmation.",
    routeSummary:
      "The admin lane stays open only for medication administration follow-up. Dependency blockers remain dominant and completion is frozen until the external confirmation tuple clears.",
    dominantMeaningLabel: "Bounded admin follow-up only",
    selectedAnchorRef: "consequence-detail-task-507",
    reasonLabels: [
      "clinicalMeaningState = bounded_admin_only",
      "operationalFollowUpScope = bounded_admin_resolution",
      "AdminResolutionSettlement.result = waiting_dependency",
    ],
    patientExpectationTemplateRef: "patient_expectation_template::admin-waiting::medication-v2",
    patientExpectationClass: "admin_waiting",
    patientExpectationDeliveryMode: "summary_safe",
    patientExpectationHeadline: "The patient sees a waiting update, not a completion message.",
    patientExpectationSummary:
      "The patient wording explains that the practice is waiting on one external medication-routing confirmation and that no new clinical judgement has been issued in the meantime.",
    patientExpectationReviewLabel: "External confirmation review due today 15:30",
    patientExpectationTupleLabel: "Patient preview aligns to boundary_tuple::task-507::admin-blocked-v3",
    selfCare: null,
    admin: {
      subtypeRef: "medication_admin_query",
      subtypeLabel: "Medication admin query",
      subtypeSummary: "Non-clinical follow-up about fulfilment routing and replacement packaging.",
      ownerLabel: "Medicines admin desk",
      waitingShapeLabel: "Awaiting external dependency",
      waitingReasonLabel: "Pharmacy routing confirmation",
      completionArtifactLabel: "Medication admin answered",
      completionArtifactRef: null,
      completionArtifactSummary:
        "Completion cannot be recorded until the medication routing answer, patient wording, and delivery posture all reference the same tuple.",
      actionLabel: "Record waiting posture",
      subtypeOptions: adminSubtypeOptions.medication,
    },
    dependencyState: "blocked_pending_external_confirmation",
    dominantRecoveryRouteRef: "dominant_recovery_route::task-507::external_confirmation",
    dominantRecoveryLabel: "External confirmation is the dominant recovery route.",
    dependencyBlockers: [
      {
        blockerId: "task-507-external-confirmation",
        label: "External confirmation is missing",
        summary: "The medication routing answer is not durable yet, so notify and complete controls must stay frozen.",
        tone: "critical",
        dominant: true,
      },
      {
        blockerId: "task-507-duplicate-watch",
        label: "Duplicate medication lineage still needs reconciliation",
        summary: "The route stays visible as provenance, but the dominant blocker remains external confirmation.",
        tone: "caution",
        dominant: false,
      },
    ],
    driftSummary: "Subtype and waiting posture remain visible, but completion must fail closed if dependency or tuple truth changes.",
    recoveryGuidance: "Keep the current subtype selection, resolve the external confirmation, then re-evaluate the dependency set before completing.",
    reopenCue: "No clinical re-entry trigger is active yet, but the blocker still governs the lane.",
  },
  {
    taskId: "task-208",
    tone: "admin",
    boundaryMode: "admin_resolution",
    clinicalMeaningState: "bounded_admin_only",
    operationalFollowUpScope: "bounded_admin_resolution",
    adminMutationAuthorityState: "bounded_admin_only",
    boundaryState: "live",
    reopenState: "stable",
    boundaryTupleHash: "boundary_tuple::task-208::admin-complete-v2",
    decisionEpochRef: "decision_epoch::task-208::admin-complete-v2",
    boundaryDecisionRef: "self_care_boundary_decision::task-208::current",
    dependencySetRef: "advice_admin_dependency_set::task-208::current",
    adviceSettlement: "withheld",
    adminSettlement: "completed",
    queueSummary: "Bounded admin completion is visible in-shell with its typed completion artifact and patient wording preview.",
    routeSummary:
      "This case is past waiting. The same shell keeps the completion artifact, expectation wording, and tuple provenance visible instead of redirecting to a generic success receipt.",
    dominantMeaningLabel: "Completed bounded admin follow-up",
    selectedAnchorRef: "consequence-detail-task-208",
    reasonLabels: [
      "AdminResolutionSettlement.result = completed",
      "completionArtifactRef is present",
      "AdviceAdminDependencySet.dependencyState = clear",
    ],
    patientExpectationTemplateRef: "patient_expectation_template::admin-completion::document-v3",
    patientExpectationClass: "admin_completion",
    patientExpectationDeliveryMode: "full",
    patientExpectationHeadline: "The patient sees a completion update tied to the issued document.",
    patientExpectationSummary:
      "The completion wording names the corrected booking letter, when it was sent, and what to do if it does not arrive. It does not relabel the work as fresh clinical advice.",
    patientExpectationReviewLabel: "Delivery watch closes tomorrow 09:00",
    patientExpectationTupleLabel: "Patient preview aligns to boundary_tuple::task-208::admin-complete-v2",
    selfCare: null,
    admin: {
      subtypeRef: "document_or_letter_workflow",
      subtypeLabel: "Document or letter workflow",
      subtypeSummary: "Issue and correct a governed outbound document with one typed completion artifact.",
      ownerLabel: "Practice correspondence desk",
      waitingShapeLabel: "No waiting blocker",
      waitingReasonLabel: "Completed in current tuple",
      completionArtifactLabel: "Document issued",
      completionArtifactRef: "admin_resolution_completion_artifact::task-208::document-issued",
      completionArtifactSummary:
        "Corrected booking letter published at 11:04 and bound to the current expectation template and delivery watch.",
      actionLabel: "Completion settled",
      subtypeOptions: adminSubtypeOptions.document,
    },
    dependencyState: "clear",
    dominantRecoveryRouteRef: "dominant_recovery_route::task-208::none",
    dominantRecoveryLabel: "No dominant recovery route is active while the completion tuple stays current.",
    dependencyBlockers: [
      {
        blockerId: "task-208-clear",
        label: "No current blocker",
        summary: "The completion artifact, expectation template, and settlement all reference the same boundary tuple.",
        tone: "accent",
        dominant: true,
      },
    ],
    driftSummary: "If publication, decision epoch, or patient expectation drifted now, the route would keep this completion visible but freeze any new notify action.",
    recoveryGuidance: "Keep the completion artifact visible and only reopen from the replacement tuple if a new drift reason is recorded.",
    reopenCue: "No reopen trigger is active on the completed tuple.",
  },
  {
    taskId: "task-118",
    tone: "reopen",
    boundaryMode: "clinician_review_required",
    clinicalMeaningState: "clinician_reentry_required",
    operationalFollowUpScope: "none",
    adminMutationAuthorityState: "frozen",
    boundaryState: "reopened",
    reopenState: "reopened",
    boundaryTupleHash: "boundary_tuple::task-118::reopened-v5",
    decisionEpochRef: "decision_epoch::task-118::reopened-v5",
    boundaryDecisionRef: "self_care_boundary_decision::task-118::reopened",
    dependencySetRef: "advice_admin_dependency_set::task-118::reopened",
    adviceSettlement: "invalidated",
    adminSettlement: "reopened_for_review",
    queueSummary: "The last admin consequence remains visible only as preserved provenance because the boundary reopened for review.",
    routeSummary:
      "A new practice note changed the consequence tuple. The last admin subtype and patient wording stay visible, but all admin completion controls freeze and the reviewer must re-enter governed review.",
    dominantMeaningLabel: "Clinician review required before more consequence work",
    selectedAnchorRef: "consequence-detail-task-118",
    reasonLabels: [
      "boundaryState = reopened",
      "reopenState = reopened",
      "clinicalMeaningState = clinician_reentry_required",
    ],
    patientExpectationTemplateRef: "patient_expectation_template::blocked-recovery::reopen-v2",
    patientExpectationClass: "blocked_recovery",
    patientExpectationDeliveryMode: "placeholder_safe",
    patientExpectationHeadline: "The patient view falls back to recovery-safe wording.",
    patientExpectationSummary:
      "The patient no longer sees the old admin completion as current. The shell preserves provenance, shows that the practice is reviewing an update, and avoids implying that the prior completion still stands.",
    patientExpectationReviewLabel: "Boundary review reopened today 10:42",
    patientExpectationTupleLabel: "Patient preview aligns to boundary_tuple::task-118::reopened-v5",
    selfCare: null,
    admin: {
      subtypeRef: "registration_or_demographic_update",
      subtypeLabel: "Registration or demographic update",
      subtypeSummary: "Preserved subtype selection from the last bounded admin path.",
      ownerLabel: "Registration desk (frozen)",
      waitingShapeLabel: "Re-entry required",
      waitingReasonLabel: "Practice note changed boundary meaning",
      completionArtifactLabel: "Demographics updated",
      completionArtifactRef: "admin_resolution_completion_artifact::task-118::demographics-updated",
      completionArtifactSummary:
        "Prior completion artifact remains visible for provenance only and no longer authorizes new completion or patient notification.",
      actionLabel: "Return to review",
      subtypeOptions: adminSubtypeOptions.registration,
    },
    dependencyState: "disputed",
    dominantRecoveryRouteRef: "dominant_recovery_route::task-118::triage_review",
    dominantRecoveryLabel: "The dominant recovery route is same-shell review re-entry.",
    dependencyBlockers: [
      {
        blockerId: "task-118-reopen",
        label: "Boundary tuple reopened for review",
        summary: "The prior admin completion is now provenance only. Recommit is required from the replacement review frame.",
        tone: "critical",
        dominant: true,
      },
      {
        blockerId: "task-118-patient-preview",
        label: "Patient wording reverted to recovery-safe placeholder",
        summary: "The patient and staff surfaces remain aligned by freezing the old completion wording.",
        tone: "caution",
        dominant: false,
      },
    ],
    driftSummary: "Selected subtype and prior completion evidence stay visible, but the tuple no longer permits bounded admin mutation.",
    recoveryGuidance: "Keep the preserved subtype in view, return to governed review, and recommit only from the replacement boundary tuple.",
    reopenCue: "Practice note changed owner and consequence meaning after completion.",
  },
] as const;

function mutationStateForScenario(runtimeScenario: RuntimeScenario): ConsequenceMutationState {
  switch (runtimeScenario) {
    case "stale_review":
      return "stale_recoverable";
    case "read_only":
    case "recovery_only":
      return "recovery_only";
    case "blocked":
      return "blocked";
    case "live":
    default:
      return "live";
  }
}

function selfCareStageState(
  seed: ConsequenceCaseSeed,
  mutationState: ConsequenceMutationState,
): SelfCareIssueStageProjection["stageState"] {
  if (mutationState === "stale_recoverable") {
    return "stale_recoverable";
  }
  if (mutationState === "recovery_only") {
    return "recovery_only";
  }
  if (mutationState === "blocked") {
    return "blocked";
  }
  return seed.adviceSettlement === "renderable" ? "issue_ready" : "settled";
}

function adminStageState(
  seed: ConsequenceCaseSeed,
  mutationState: ConsequenceMutationState,
): AdminResolutionStageProjection["stageState"] {
  if (mutationState === "stale_recoverable") {
    return "stale_recoverable";
  }
  if (seed.adminSettlement === "waiting_dependency") {
    return "waiting_dependency";
  }
  if (seed.adminSettlement === "completed" || seed.adminSettlement === "patient_notified") {
    return "completed";
  }
  if (seed.adminSettlement === "reopened_for_review") {
    return "reopened";
  }
  if (seed.adminSettlement === "blocked_pending_safety") {
    return "blocked_pending_safety";
  }
  return "preview";
}

function freezeReason(
  seed: ConsequenceCaseSeed,
  mutationState: ConsequenceMutationState,
): string | null {
  if (mutationState === "stale_recoverable") {
    return "Boundary tuple or decision epoch drifted. Preserve the draft and recommit from the replacement tuple.";
  }
  if (mutationState === "recovery_only") {
    return "Release or trust posture degraded. Keep the last safe consequence visible, but do not issue or complete anything new.";
  }
  if (mutationState === "blocked") {
    return "Current publication or settlement posture blocks fresh consequence mutation.";
  }
  if (seed.reopenState !== "stable") {
    return "The reopen fence is no longer stable. The prior draft stays visible only as superseded context.";
  }
  return null;
}

function boundaryRecoveryState(
  seed: ConsequenceCaseSeed,
  mutationState: ConsequenceMutationState,
): BoundaryDriftRecoveryProjection["recoveryState"] {
  if (mutationState === "stale_recoverable") {
    return "stale_recoverable";
  }
  if (mutationState === "recovery_only") {
    return "recovery_only";
  }
  if (mutationState === "blocked") {
    return "blocked";
  }
  return seed.reopenState === "stable" ? "reopen_required" : "reopen_required";
}

function rowModeLabel(seed: ConsequenceCaseSeed): string {
  switch (seed.boundaryMode) {
    case "self_care":
      return "Self-care";
    case "admin_resolution":
      return "Bounded admin";
    case "blocked_pending_review":
      return "Blocked review";
    case "clinician_review_required":
    default:
      return "Reopened review";
  }
}

function buildRows(selectedTaskId: string): readonly ConsequenceWorkbenchRowProjection[] {
  return consequenceSeeds.map((seed) => {
    const task = requireCase(seed.taskId);
    return {
      rowId: `consequence-row::${seed.taskId}`,
      taskId: seed.taskId,
      anchorRef: `consequence-row-${seed.taskId}`,
      patientLabel: task.patientLabel,
      modeLabel: rowModeLabel(seed),
      summary: seed.queueSummary,
      boundaryMode: seed.boundaryMode,
      adviceSettlement: seed.adviceSettlement,
      adminSettlement: seed.adminSettlement ?? "not_applicable",
      dependencyState: seed.dependencyState,
      reopenState: seed.reopenState,
      selected: seed.taskId === selectedTaskId,
    };
  });
}

function buildDetailSurface(
  seed: ConsequenceCaseSeed,
  mutationState: ConsequenceMutationState,
): SelfCareAdminDetailProjection {
  const task = requireCase(seed.taskId);
  const selfCarePreviewSummary =
    seed.selfCare == null
      ? null
      : {
          previewId: `self-care-preview-summary::${seed.taskId}`,
          bundleVersionRef: seed.selfCare.bundleVersionRef,
          variantLabel: seed.selfCare.variantLabel,
          localeLabel: seed.selfCare.localeLabel,
          safetyNetSummary: seed.selfCare.safetyNetSummary,
          watchWindowLabel: seed.selfCare.watchWindowLabel,
          watchState: seed.selfCare.watchState,
          releaseWatchRef: seed.selfCare.releaseWatchRef,
          adviceSettlement: seed.adviceSettlement,
          trustState: seed.selfCare.trustState,
        };
  const selfCareIssueStage =
    seed.selfCare == null
      ? null
      : {
          stageId: `self-care-issue-stage::${seed.taskId}`,
          stageState: selfCareStageState(seed, mutationState),
          summary: seed.selfCare.issueSummary,
          draftDefault: seed.selfCare.draftDefault,
          issueEvidence: seed.selfCare.issueEvidence,
          actionLabel: seed.selfCare.actionLabel,
          actionEnabled:
            mutationState === "live" &&
            seed.adviceSettlement === "renderable" &&
            seed.boundaryMode === "self_care" &&
            seed.reopenState === "stable",
          freezeReason: freezeReason(seed, mutationState),
        };
  const adminResolutionStage =
    seed.admin == null || seed.adminSettlement == null
      ? null
      : {
          stageId: `admin-resolution-stage::${seed.taskId}`,
          stageState: adminStageState(seed, mutationState),
          subtypeRef: seed.admin.subtypeRef,
          subtypeLabel: seed.admin.subtypeLabel,
          subtypeSummary: seed.admin.subtypeSummary,
          ownerLabel: seed.admin.ownerLabel,
          waitingShapeLabel: seed.admin.waitingShapeLabel,
          waitingReasonLabel: seed.admin.waitingReasonLabel,
          completionArtifactLabel: seed.admin.completionArtifactLabel,
          completionArtifactRef: seed.admin.completionArtifactRef,
          completionArtifactSummary: seed.admin.completionArtifactSummary,
          actionLabel: seed.admin.actionLabel,
          actionEnabled:
            mutationState === "live" &&
            seed.boundaryMode === "admin_resolution" &&
            seed.dependencyState === "clear" &&
            seed.reopenState === "stable" &&
            (seed.adminSettlement === "completed" || seed.adminSettlement === "patient_notified"
              ? false
              : true),
          freezeReason: freezeReason(seed, mutationState),
          settlementState: seed.adminSettlement,
          subtypeOptions: seed.admin.subtypeOptions,
        };

  return {
    detailId: `self-care-admin-detail::${seed.taskId}`,
    taskId: seed.taskId,
    patientLabel: task.patientLabel,
    visualMode: "Bounded_Consequence_Studio",
    mutationState,
    boundaryMode: seed.boundaryMode,
    clinicalMeaningState: seed.clinicalMeaningState,
    operationalFollowUpScope: seed.operationalFollowUpScope,
    adminMutationAuthorityState: seed.adminMutationAuthorityState,
    boundaryState: seed.boundaryState,
    reopenState: seed.reopenState,
    boundaryTupleHash: seed.boundaryTupleHash,
    boundaryDecisionRef: seed.boundaryDecisionRef,
    decisionEpochRef: seed.decisionEpochRef,
    dominantMeaningLabel: seed.dominantMeaningLabel,
    routeSummary: seed.routeSummary,
    reasonLabels: seed.reasonLabels,
    adviceSettlement: seed.adviceSettlement,
    adminSettlement: seed.adminSettlement ?? "not_applicable",
    selfCarePreviewSummary,
    selfCareIssueStage,
    adminResolutionStage,
    adminDependencyPanel: {
      panelId: `admin-dependency-panel::${seed.taskId}`,
      dependencySetRef: seed.dependencySetRef,
      dependencyState: seed.dependencyState,
      reopenState: seed.reopenState,
      dominantRecoveryRouteRef: seed.dominantRecoveryRouteRef,
      dominantRecoveryLabel: seed.dominantRecoveryLabel,
      blockers: seed.dependencyBlockers,
    },
    patientExpectationPreview: {
      previewId: `patient-expectation-preview::${seed.taskId}`,
      expectationTemplateRef: seed.patientExpectationTemplateRef,
      expectationClass: seed.patientExpectationClass,
      deliveryMode: seed.patientExpectationDeliveryMode,
      headline: seed.patientExpectationHeadline,
      summary: seed.patientExpectationSummary,
      nextReviewLabel: seed.patientExpectationReviewLabel,
      tupleAlignmentLabel: seed.patientExpectationTupleLabel,
    },
    boundaryDriftRecovery: {
      recoveryId: `boundary-drift-recovery::${seed.taskId}`,
      visible: mutationState !== "live" || seed.reopenState !== "stable" || seed.boundaryMode === "clinician_review_required",
      recoveryState: boundaryRecoveryState(seed, mutationState),
      summary: seed.driftSummary,
      guidance: seed.recoveryGuidance,
      reasonLabels: seed.reasonLabels,
      reopenCue: seed.reopenCue,
    },
    sourceSummaryPoints: task.summaryPoints,
  };
}

export function defaultSelfCareAdminTaskId(): string {
  return consequenceSeeds[0]?.taskId ?? "task-311";
}

export function listSelfCareAdminTaskIds(): readonly string[] {
  return consequenceSeeds.map((seed) => seed.taskId);
}

export function buildSelfCareAdminViewsRouteProjection(input: {
  runtimeScenario: RuntimeScenario;
  selectedTaskId: string;
}): SelfCareAdminViewsRouteProjection {
  const selectedSeed =
    consequenceSeeds.find((seed) => seed.taskId === input.selectedTaskId) ??
    consequenceSeeds[0]!;
  const mutationState = mutationStateForScenario(input.runtimeScenario);
  const rows = buildRows(selectedSeed.taskId);
  const adminCount = consequenceSeeds.filter((seed) => seed.boundaryMode === "admin_resolution").length;
  const selfCareCount = consequenceSeeds.filter((seed) => seed.boundaryMode === "self_care").length;

  return {
    routeId: `self-care-admin-route::${selectedSeed.taskId}`,
    visualMode: "Bounded_Consequence_Studio",
    queueHealthSummary:
      mutationState === "live"
        ? `${selfCareCount} self-care and ${adminCount} bounded-admin consequence views are available in the same shell.`
        : "Consequence work stays in the same shell, but writable posture is currently frozen while the tuple recovers.",
    rowCount: rows.length,
    selectedTaskId: selectedSeed.taskId,
    rows,
    detailSurface: buildDetailSurface(selectedSeed, mutationState),
  };
}
