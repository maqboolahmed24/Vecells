import type { AggregateRef } from "./phase6-pharmacy-case-kernel";
import type {
  PharmacyOutcomeTruthProjectionSnapshot,
  PharmacyOutcomeTruthState,
} from "./phase6-pharmacy-patient-status-engine";
import type {
  NormalizedPharmacyOutcomeEvidenceSnapshot,
  OutcomeEvidenceEnvelopeSnapshot,
  PharmacyOutcomeClassificationState,
  PharmacyOutcomeMatchConfidenceBand,
  PharmacyOutcomeMatchScorecardSnapshot,
  PharmacyOutcomeReconciliationGateSnapshot,
  PharmacyOutcomeSettlementSnapshot,
  PharmacyOutcomeSourceProvenanceSnapshot,
} from "./phase6-pharmacy-outcome-reconciliation-engine";
import type {
  PharmacyAssuranceProjectionSnapshot,
  PharmacyAssuranceState,
} from "./phase6-pharmacy-console-engine";

const TASK_342 = "seq_342" as const;

type Task342 = typeof TASK_342;

export const PHARMACY_ASSURANCE_WORKBENCH_VISUAL_MODE =
  "Pharmacy_Assurance_Workbench";

export type PharmacyOutcomeAssuranceSurfaceState =
  | "matched_review"
  | "ambiguous_review"
  | "unmatched_review";

export type PharmacyOutcomeAssuranceTone =
  | "ready"
  | "watch"
  | "review"
  | "blocked";

export interface OutcomeAssuranceHeaderSnapshot {
  tone: PharmacyOutcomeAssuranceTone;
  eyebrow: string;
  title: string;
  summary: string;
  statusPill: string;
  closePostureLabel: string;
}

export interface OutcomeEvidenceSourceCardSnapshot {
  sourceLabel: string;
  sourceSummary: string;
  consultationModeLabel: string;
  medicinesSuppliedLabel: string;
  gpActionLabel: string;
  resolutionClassificationLabel: string;
  receivedAtLabel: string;
  trustLabel: string;
}

export interface OutcomeMatchSummarySnapshot {
  title: string;
  summary: string;
  matchedCaseLabel: string;
  runnerUpCaseLabel: string | null;
  matchStateLabel: string;
  patientVisibilityLabel: string;
}

export interface OutcomeConfidenceBreakdownSnapshot {
  metricId: string;
  label: string;
  value: string;
  summary: string;
}

export interface OutcomeConfidenceMeterSnapshot {
  confidenceBand: PharmacyOutcomeMatchConfidenceBand;
  title: string;
  summary: string;
  confidenceValue: number;
  confidenceLabel: string;
  deltaToRunnerUpLabel: string;
  thresholdSummary: string;
  breakdown: readonly OutcomeConfidenceBreakdownSnapshot[];
}

export interface OutcomeGateTimelineStepSnapshot {
  stepId: string;
  label: string;
  state: "complete" | "current" | "blocked" | "pending";
  summary: string;
  detail: string;
}

export interface OutcomeGateTimelineSnapshot {
  title: string;
  summary: string;
  steps: readonly OutcomeGateTimelineStepSnapshot[];
}

export interface OutcomeManualReviewBannerSnapshot {
  tone: PharmacyOutcomeAssuranceTone;
  title: string;
  summary: string;
  detail: string;
  announcementRole: "status" | "alert";
}

export interface OutcomeEvidenceDrawerRowSnapshot {
  label: string;
  value: string;
  detail: string;
}

export interface OutcomeEvidenceDrawerGroupSnapshot {
  groupId: string;
  label: string;
  rows: readonly OutcomeEvidenceDrawerRowSnapshot[];
}

export interface OutcomeEvidenceDrawerSnapshot {
  title: string;
  summary: string;
  toggleLabel: string;
  groups: readonly OutcomeEvidenceDrawerGroupSnapshot[];
}

export interface OutcomeDecisionDockActionSnapshot {
  actionId: string;
  label: string;
  detail: string;
  routeTarget: "validate" | "resolve" | "handoff" | "assurance";
  emphasis: "primary" | "secondary";
}

export interface OutcomeDecisionDockSnapshot {
  tone: PharmacyOutcomeAssuranceTone;
  title: string;
  summary: string;
  currentOwnerLabel: string;
  nextReviewLabel: string;
  consequenceTitle: string;
  consequenceSummary: string;
  closeBlockers: readonly string[];
  primaryAction: OutcomeDecisionDockActionSnapshot;
  secondaryActions: readonly OutcomeDecisionDockActionSnapshot[];
}

export interface PharmacyOutcomeTruthBinding
  extends Pick<
    PharmacyOutcomeTruthProjectionSnapshot,
    | "pharmacyOutcomeTruthProjectionId"
    | "outcomeTruthState"
    | "resolutionClass"
    | "matchConfidenceBand"
    | "manualReviewState"
    | "closeEligibilityState"
    | "patientVisibilityState"
    | "continuityEvidenceRef"
    | "computedAt"
  > {}

export interface PharmacyOutcomeGateBinding
  extends Pick<
    PharmacyOutcomeReconciliationGateSnapshot,
    | "outcomeReconciliationGateId"
    | "gateState"
    | "manualReviewState"
    | "blockingClosureState"
    | "patientVisibilityState"
    | "currentOwnerRef"
    | "resolutionNotesRef"
    | "openedAt"
    | "resolvedAt"
  > {}

export interface PharmacyOutcomeSettlementBinding
  extends Pick<
    PharmacyOutcomeSettlementSnapshot,
    | "settlementId"
    | "result"
    | "matchConfidenceBand"
    | "closeEligibilityState"
    | "receiptTextRef"
    | "experienceContinuityEvidenceRef"
    | "recoveryRouteRef"
    | "recordedAt"
  > {}

export interface PharmacyOutcomeScorecardBinding
  extends Pick<
    PharmacyOutcomeMatchScorecardSnapshot,
    | "pharmacyOutcomeMatchScorecardId"
    | "candidateCaseRef"
    | "runnerUpCaseRef"
    | "mPatient"
    | "mProvider"
    | "mService"
    | "mTime"
    | "mTransport"
    | "mContra"
    | "sourceFloor"
    | "matchScore"
    | "runnerUpMatchScore"
    | "posteriorMatchConfidence"
    | "deltaToRunnerUp"
    | "policyVersionRef"
    | "thresholdFamilyRefs"
    | "calculatedAt"
  > {}

export interface PharmacyAssuranceProjectionBinding
  extends Pick<
    PharmacyAssuranceProjectionSnapshot,
    | "pharmacyAssuranceProjectionId"
    | "assuranceState"
    | "blockingReasonCodes"
    | "currentRecoveryOwnerRef"
    | "computedAt"
  > {}

export interface PharmacyOutcomeEvidenceBinding
  extends Pick<
    OutcomeEvidenceEnvelopeSnapshot,
    | "outcomeEvidenceEnvelopeId"
    | "sourceType"
    | "sourceMessageKey"
    | "decisionClass"
    | "trustClass"
    | "receivedAt"
    | "correlationRefs"
    | "dedupeState"
  > {}

export interface PharmacyOutcomeProvenanceBinding
  extends Pick<
    PharmacyOutcomeSourceProvenanceSnapshot,
    | "outcomeSourceProvenanceId"
    | "senderIdentityRef"
    | "inboundTransportFamily"
    | "inboundChannelRef"
    | "trustedCorrelationFragments"
    | "gpWorkflowIdentifiers"
    | "parserAssumptionRefs"
    | "degradedFieldRefs"
    | "fieldOriginRefs"
    | "rawPayloadRef"
    | "recordedAt"
  > {}

export interface PharmacyOutcomeNormalizedBinding
  extends Pick<
    NormalizedPharmacyOutcomeEvidenceSnapshot,
    | "normalizedPharmacyOutcomeEvidenceId"
    | "classificationState"
    | "outcomeAt"
    | "patientRefId"
    | "providerRefId"
    | "providerOdsCode"
    | "serviceType"
    | "trustedCorrelationRefs"
    | "sourceFloor"
    | "transportHintRefs"
    | "routeIntentTupleHash"
    | "rawPayloadRef"
  > {}

export interface PharmacyOutcomeAssurancePreviewSnapshot {
  pharmacyCaseId: string;
  visualMode: typeof PHARMACY_ASSURANCE_WORKBENCH_VISUAL_MODE;
  surfaceState: PharmacyOutcomeAssuranceSurfaceState;
  header: OutcomeAssuranceHeaderSnapshot;
  sourceCard: OutcomeEvidenceSourceCardSnapshot;
  matchSummary: OutcomeMatchSummarySnapshot;
  confidenceMeter: OutcomeConfidenceMeterSnapshot;
  gateTimeline: OutcomeGateTimelineSnapshot;
  manualReviewBanner: OutcomeManualReviewBannerSnapshot;
  evidenceDrawer: OutcomeEvidenceDrawerSnapshot;
  decisionDock: OutcomeDecisionDockSnapshot;
  truthBinding: PharmacyOutcomeTruthBinding;
  gateBinding: PharmacyOutcomeGateBinding;
  settlementBinding: PharmacyOutcomeSettlementBinding;
  scorecardBinding: PharmacyOutcomeScorecardBinding;
  assuranceBinding: PharmacyAssuranceProjectionBinding;
  evidenceBinding: PharmacyOutcomeEvidenceBinding;
  provenanceBinding: PharmacyOutcomeProvenanceBinding;
  normalizedBinding: PharmacyOutcomeNormalizedBinding;
}

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `pha_${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function makeCaseRef(refId: string): AggregateRef<"PharmacyCase", Task342> {
  return { targetFamily: "PharmacyCase", refId, ownerTask: TASK_342 };
}

function prettyClassification(
  value: PharmacyOutcomeClassificationState | string | null,
): string {
  if (!value) {
    return "Classification pending";
  }
  switch (value) {
    case "medicine_supplied":
      return "Medicine supplied";
    case "resolved_no_supply":
      return "Resolved without supply";
    case "urgent_gp_action":
      return "Urgent GP action";
    case "pharmacy_unable_to_complete":
      return "Unable to complete";
    case "unable_to_contact":
      return "Unable to contact";
    case "advice_only":
      return "Advice only";
    case "onward_referral":
      return "Onward referral";
    case "unmatched":
      return "Unmatched";
    default:
      return value.replaceAll("_", " ");
  }
}

function bandTone(
  value: PharmacyOutcomeMatchConfidenceBand,
): PharmacyOutcomeAssuranceTone {
  switch (value) {
    case "high":
      return "ready";
    case "medium":
      return "watch";
    case "low":
    default:
      return "review";
  }
}

function confidenceLabel(value: number): string {
  return `${(value * 100).toFixed(0)}% confidence`;
}

function buildBreakdown(
  input: Pick<
    PharmacyOutcomeMatchScorecardSnapshot,
    "mPatient" | "mProvider" | "mService" | "mTime" | "mTransport" | "mContra"
  >,
): readonly OutcomeConfidenceBreakdownSnapshot[] {
  return [
    {
      metricId: "patient",
      label: "Patient",
      value: input.mPatient.toFixed(2),
      summary: "Patient correlation strength",
    },
    {
      metricId: "provider",
      label: "Provider",
      value: input.mProvider.toFixed(2),
      summary: "Chosen provider alignment",
    },
    {
      metricId: "service",
      label: "Service",
      value: input.mService.toFixed(2),
      summary: "Pathway or service alignment",
    },
    {
      metricId: "time",
      label: "Timing",
      value: input.mTime.toFixed(2),
      summary: "Outcome timing proximity",
    },
    {
      metricId: "transport",
      label: "Transport",
      value: input.mTransport.toFixed(2),
      summary: "Transport-family confidence",
    },
    {
      metricId: "contra",
      label: "Contradiction",
      value: input.mContra.toFixed(2),
      summary: "Contradiction penalty",
    },
  ];
}

function buildDrawerGroups(input: {
  evidence: PharmacyOutcomeEvidenceBinding;
  provenance: PharmacyOutcomeProvenanceBinding;
  normalized: PharmacyOutcomeNormalizedBinding;
  scorecard: PharmacyOutcomeScorecardBinding;
  gate: PharmacyOutcomeGateBinding;
}): readonly OutcomeEvidenceDrawerGroupSnapshot[] {
  return [
    {
      groupId: "envelope",
      label: "Incoming evidence",
      rows: [
        {
          label: "Source message key",
          value: input.evidence.sourceMessageKey,
          detail: `Decision class ${input.evidence.decisionClass.replaceAll("_", " ")}`,
        },
        {
          label: "Trust class",
          value: input.evidence.trustClass.replaceAll("_", " "),
          detail: `Dedupe posture ${input.evidence.dedupeState.replaceAll("_", " ")}`,
        },
        {
          label: "Route tuple hash",
          value: input.normalized.routeIntentTupleHash ?? "No frozen route tuple",
          detail: `Source floor ${input.normalized.sourceFloor.toFixed(2)}`,
        },
      ],
    },
    {
      groupId: "provenance",
      label: "Provenance and parser posture",
      rows: [
        {
          label: "Sender / channel",
          value:
            input.provenance.senderIdentityRef ??
            input.provenance.inboundChannelRef ??
            "Sender masked",
          detail:
            input.provenance.inboundTransportFamily ??
            "Transport family not recorded",
        },
        {
          label: "Parser assumptions",
          value:
            input.provenance.parserAssumptionRefs.join(", ") ||
            "No parser assumptions recorded",
          detail:
            input.provenance.degradedFieldRefs.join(", ") ||
            "No degraded fields recorded",
        },
        {
          label: "GP workflow ids",
          value:
            input.provenance.gpWorkflowIdentifiers.join(", ") ||
            "No workflow identifiers recorded",
          detail:
            input.provenance.trustedCorrelationFragments.join(", ") ||
            "No trusted correlation fragments recorded",
        },
      ],
    },
    {
      groupId: "gate",
      label: "Gate and scoring",
      rows: [
        {
          label: "Posterior confidence",
          value: confidenceLabel(input.scorecard.posteriorMatchConfidence),
          detail: `Delta to runner-up ${input.scorecard.deltaToRunnerUp.toFixed(2)}`,
        },
        {
          label: "Gate owner",
          value: input.gate.currentOwnerRef,
          detail:
            input.gate.resolutionNotesRef ??
            "No resolution note recorded yet",
        },
        {
          label: "Policy version",
          value: input.scorecard.policyVersionRef,
          detail:
            input.scorecard.thresholdFamilyRefs.join(", ") ||
            "Threshold families not listed",
        },
      ],
    },
  ];
}

function buildHeader(input: {
  tone: PharmacyOutcomeAssuranceTone;
  title: string;
  summary: string;
  statusPill: string;
  closePostureLabel: string;
}): OutcomeAssuranceHeaderSnapshot {
  return {
    tone: input.tone,
    eyebrow: "Outcome assurance",
    title: input.title,
    summary: input.summary,
    statusPill: input.statusPill,
    closePostureLabel: input.closePostureLabel,
  };
}

function buildCommonBindings(input: {
  pharmacyCaseId: string;
  truthState: PharmacyOutcomeTruthState;
  resolutionClass: PharmacyOutcomeClassificationState;
  confidenceBand: PharmacyOutcomeMatchConfidenceBand;
  manualReviewState: string;
  closeEligibilityState: PharmacyOutcomeTruthProjectionSnapshot["closeEligibilityState"];
  patientVisibilityState: PharmacyOutcomeReconciliationGateSnapshot["patientVisibilityState"];
  confidence: number;
  deltaToRunnerUp: number;
  matchScore: number;
  runnerUpMatchScore: number;
  candidateCaseId: string | null;
  runnerUpCaseId: string | null;
  sourceType: OutcomeEvidenceEnvelopeSnapshot["sourceType"];
  trustClass: OutcomeEvidenceEnvelopeSnapshot["trustClass"];
  decisionClass: OutcomeEvidenceEnvelopeSnapshot["decisionClass"];
  classificationState: PharmacyOutcomeClassificationState;
  assuranceState: PharmacyAssuranceState;
  gateState: PharmacyOutcomeReconciliationGateSnapshot["gateState"];
  blockingClosureState: PharmacyOutcomeReconciliationGateSnapshot["blockingClosureState"];
  currentOwnerRef: string;
  result: PharmacyOutcomeSettlementSnapshot["result"];
  recordedAt: string;
  contradictionScore: number;
  receivedAt: string;
}): {
  truthBinding: PharmacyOutcomeTruthBinding;
  gateBinding: PharmacyOutcomeGateBinding;
  settlementBinding: PharmacyOutcomeSettlementBinding;
  scorecardBinding: PharmacyOutcomeScorecardBinding;
  assuranceBinding: PharmacyAssuranceProjectionBinding;
  evidenceBinding: PharmacyOutcomeEvidenceBinding;
  provenanceBinding: PharmacyOutcomeProvenanceBinding;
  normalizedBinding: PharmacyOutcomeNormalizedBinding;
} {
  const evidenceBinding: PharmacyOutcomeEvidenceBinding = {
    outcomeEvidenceEnvelopeId: `outcome_evidence_${input.pharmacyCaseId}`,
    sourceType: input.sourceType,
    sourceMessageKey: `${input.pharmacyCaseId}-outcome-message`,
    decisionClass: input.decisionClass,
    trustClass: input.trustClass,
    receivedAt: input.receivedAt,
    correlationRefs: [`corr/${input.pharmacyCaseId}`, `patient/${input.pharmacyCaseId}`],
    dedupeState: "new",
  };

  const provenanceBinding: PharmacyOutcomeProvenanceBinding = {
    outcomeSourceProvenanceId: `outcome_source_${input.pharmacyCaseId}`,
    senderIdentityRef:
      input.sourceType === "gp_workflow_observation"
        ? "GP workflow observation"
        : input.sourceType === "email_ingest"
          ? "Email intake mailbox"
          : "Structured sender",
    inboundTransportFamily:
      input.sourceType === "email_ingest" ? "mailroom" : "structured_inbox",
    inboundChannelRef:
      input.sourceType === "manual_structured_capture"
        ? "manual_capture_console"
        : "pharmacy_outcome_ingest",
    trustedCorrelationFragments: [`case:${input.pharmacyCaseId}`, "provider:confirmed"],
    gpWorkflowIdentifiers:
      input.sourceType === "gp_workflow_observation"
        ? [`gpf-${stableHash(input.pharmacyCaseId)}`]
        : [],
    parserAssumptionRefs:
      input.sourceType === "email_ingest"
        ? ["parser.assumed_free_text_classification"]
        : ["parser.structured_message_v1"],
    degradedFieldRefs:
      input.sourceType === "email_ingest"
        ? ["consultation_mode", "medicine_codes"]
        : [],
    fieldOriginRefs: ["classification_state", "provider_ref", "outcome_at"],
    rawPayloadRef: `payload://${input.pharmacyCaseId}`,
    recordedAt: input.receivedAt,
  };

  const normalizedBinding: PharmacyOutcomeNormalizedBinding = {
    normalizedPharmacyOutcomeEvidenceId: `normalized_outcome_${input.pharmacyCaseId}`,
    classificationState: input.classificationState,
    outcomeAt: input.recordedAt,
    patientRefId: `patient/${input.pharmacyCaseId}`,
    providerRefId: `provider/${input.pharmacyCaseId}`,
    providerOdsCode: `ODS-${input.pharmacyCaseId.slice(-4)}`,
    serviceType: "clinical_pathway_consultation",
    trustedCorrelationRefs: [`case/${input.pharmacyCaseId}`],
    sourceFloor: input.sourceType === "email_ingest" ? 0.42 : 0.92,
    transportHintRefs:
      input.sourceType === "email_ingest" ? ["email_low_assurance"] : ["structured_pathway"],
    routeIntentTupleHash: `tuple_${stableHash(input.pharmacyCaseId)}`,
    rawPayloadRef: `payload://${input.pharmacyCaseId}`,
  };

  const scorecardBinding: PharmacyOutcomeScorecardBinding = {
    pharmacyOutcomeMatchScorecardId: `outcome_scorecard_${input.pharmacyCaseId}`,
    candidateCaseRef:
      input.candidateCaseId === null ? null : makeCaseRef(input.candidateCaseId),
    runnerUpCaseRef:
      input.runnerUpCaseId === null ? null : makeCaseRef(input.runnerUpCaseId),
    mPatient:
      input.candidateCaseId === null ? 0.22 : input.confidence > 0.8 ? 0.98 : 0.92,
    mProvider:
      input.candidateCaseId === null ? 0.14 : input.confidence > 0.8 ? 0.95 : 0.87,
    mService:
      input.candidateCaseId === null ? 0.26 : input.confidence > 0.8 ? 0.88 : 0.84,
    mTime:
      input.candidateCaseId === null ? 0.18 : input.confidence > 0.8 ? 0.78 : 0.41,
    mTransport:
      input.candidateCaseId === null ? 0.11 : input.confidence > 0.8 ? 0.72 : 0.63,
    mContra: input.contradictionScore,
    sourceFloor: normalizedBinding.sourceFloor,
    matchScore: input.matchScore,
    runnerUpMatchScore: input.runnerUpMatchScore,
    posteriorMatchConfidence: input.confidence,
    deltaToRunnerUp: input.deltaToRunnerUp,
    policyVersionRef: "pharmacy_outcome_matching_v1",
    thresholdFamilyRefs: [
      "source_floor",
      "auto_apply_threshold",
      "contradiction_threshold",
    ],
    calculatedAt: input.recordedAt,
  };

  const gateBinding: PharmacyOutcomeGateBinding = {
    outcomeReconciliationGateId: `outcome_gate_${input.pharmacyCaseId}`,
    gateState: input.gateState,
    manualReviewState:
      input.gateState === "in_review" ? "in_review" : (input.manualReviewState as PharmacyOutcomeReconciliationGateSnapshot["manualReviewState"]),
    blockingClosureState: input.blockingClosureState,
    patientVisibilityState: input.patientVisibilityState,
    currentOwnerRef: input.currentOwnerRef,
    resolutionNotesRef:
      input.gateState === "in_review"
        ? "Pharmacist review note captured; closure remains frozen."
        : input.gateState === "open"
          ? "No governing review note recorded yet."
          : "Gate resolution note recorded.",
    openedAt: input.receivedAt,
    resolvedAt: null,
  };

  const settlementBinding: PharmacyOutcomeSettlementBinding = {
    settlementId: `outcome_settlement_${input.pharmacyCaseId}`,
    result: input.result,
    matchConfidenceBand: input.confidenceBand,
    closeEligibilityState: input.closeEligibilityState,
    receiptTextRef: `pharmacy.outcome.settlement.${input.result}`,
    experienceContinuityEvidenceRef: `continuity://${input.pharmacyCaseId}`,
    recoveryRouteRef:
      input.result === "reopened_for_safety"
        ? `/workspace/pharmacy/${input.pharmacyCaseId}/assurance`
        : null,
    recordedAt: input.recordedAt,
  };

  const truthBinding: PharmacyOutcomeTruthBinding = {
    pharmacyOutcomeTruthProjectionId: `outcome_truth_${input.pharmacyCaseId}`,
    outcomeTruthState: input.truthState,
    resolutionClass: input.resolutionClass,
    matchConfidenceBand: input.confidenceBand,
    manualReviewState: input.manualReviewState,
    closeEligibilityState: input.closeEligibilityState,
    patientVisibilityState: input.patientVisibilityState,
    continuityEvidenceRef: settlementBinding.experienceContinuityEvidenceRef,
    computedAt: input.recordedAt,
  };

  const assuranceBinding: PharmacyAssuranceProjectionBinding = {
    pharmacyAssuranceProjectionId: `pharmacy_assurance_${input.pharmacyCaseId}`,
    assuranceState: input.assuranceState,
    blockingReasonCodes:
      input.closeEligibilityState === "not_closable"
        ? ["OUTCOME_REVIEW_ACTIVE", "UNMATCHED_OUTCOME"]
        : ["OUTCOME_REVIEW_ACTIVE", "CLOSE_READY_SUPPRESSED"],
    currentRecoveryOwnerRef: input.currentOwnerRef,
    computedAt: input.recordedAt,
  };

  return {
    truthBinding,
    gateBinding,
    settlementBinding,
    scorecardBinding,
    assuranceBinding,
    evidenceBinding,
    provenanceBinding,
    normalizedBinding,
  };
}

export const pharmacyOutcomeAssurancePreviewCases = [
  (() => {
    const bindings = buildCommonBindings({
      pharmacyCaseId: "PHC-2124",
      truthState: "review_required",
      resolutionClass: "medicine_supplied",
      confidenceBand: "low",
      manualReviewState: "required",
      closeEligibilityState: "blocked_by_reconciliation",
      patientVisibilityState: "review_placeholder",
      confidence: 0.54,
      deltaToRunnerUp: 0.12,
      matchScore: 0.58,
      runnerUpMatchScore: 0.46,
      candidateCaseId: "PHC-2124",
      runnerUpCaseId: "PHC-2146",
      sourceType: "direct_structured_message",
      trustClass: "trusted_structured",
      decisionClass: "distinct",
      classificationState: "medicine_supplied",
      assuranceState: "outcome_review",
      gateState: "open",
      blockingClosureState: "blocks_close",
      currentOwnerRef: "Outcome review owner / pharmacist queue",
      result: "review_required",
      recordedAt: "2026-04-24T15:02:00.000Z",
      contradictionScore: 0.31,
      receivedAt: "2026-04-24T15:01:00.000Z",
    });
    return {
      pharmacyCaseId: "PHC-2124",
      visualMode: PHARMACY_ASSURANCE_WORKBENCH_VISUAL_MODE,
      surfaceState: "ambiguous_review",
      header: buildHeader({
        tone: "review",
        title: "Outcome evidence is matched, but confidence is still too weak to close the case",
        summary:
          "The best candidate aligns on patient, provider, and service, but timing drift and contradiction penalties keep this in review-required posture.",
        statusPill: "Weak match",
        closePostureLabel: "Closure blocked by reconciliation",
      }),
      sourceCard: {
        sourceLabel: "Structured pharmacy outcome",
        sourceSummary:
          "A structured outcome message arrived from Canal Street Pharmacy and is being held as the latest evidence for this case.",
        consultationModeLabel: "Remote clinical-pathway consultation",
        medicinesSuppliedLabel: "Nasal steroid spray supplied / 1 pack",
        gpActionLabel: "No GP action required from this outcome yet",
        resolutionClassificationLabel: prettyClassification("medicine_supplied"),
        receivedAtLabel: "24 Apr 2026, 16:01",
        trustLabel: "Trusted structured evidence",
      },
      matchSummary: {
        title: "Best current match",
        summary:
          "This evidence points to PHC-2124, but the runner-up remains close enough that the shell must stay visibly non-calm.",
        matchedCaseLabel: "PHC-2124 / Canal Street Pharmacy",
        runnerUpCaseLabel: "PHC-2146 / Station Road Pharmacy",
        matchStateLabel: "Review required / weak confidence frontier",
        patientVisibilityLabel: "Patient shell remains on review placeholder posture",
      },
      confidenceMeter: {
        confidenceBand: bindings.truthBinding.matchConfidenceBand,
        title: "Reconciliation confidence",
        summary:
          "Confidence is visible here so the pharmacist can understand why the case remains blocked without opening a detached admin page.",
        confidenceValue: bindings.scorecardBinding.posteriorMatchConfidence,
        confidenceLabel: confidenceLabel(bindings.scorecardBinding.posteriorMatchConfidence),
        deltaToRunnerUpLabel: `${bindings.scorecardBinding.deltaToRunnerUp.toFixed(2)} clear of the runner-up`,
        thresholdSummary:
          "Below the auto-apply threshold; closure and quiet reassurance stay frozen.",
        breakdown: buildBreakdown(bindings.scorecardBinding),
      },
      gateTimeline: {
        title: "Reconciliation gate timeline",
        summary:
          "Evidence is present and scored, but the review gate remains open and close-ready posture is intentionally suppressed.",
        steps: [
          {
            stepId: "received",
            label: "Evidence received",
            state: "complete",
            summary: "Structured outcome envelope recorded.",
            detail: "The latest evidence envelope is current and replay-safe.",
          },
          {
            stepId: "score",
            label: "Match scored",
            state: "complete",
            summary: "Best candidate and runner-up calculated.",
            detail: "Confidence is low enough that auto-apply remains forbidden.",
          },
          {
            stepId: "gate",
            label: "Review gate",
            state: "current",
            summary: "Manual review still required.",
            detail: "The active owner must decide whether to clarify, apply, or reopen.",
          },
          {
            stepId: "close",
            label: "Close posture",
            state: "blocked",
            summary: "Quiet closure remains blocked.",
            detail: "The case may not read as resolved until the gate clears.",
          },
        ],
      },
      manualReviewBanner: {
        tone: "review",
        title: "Manual review is required before this case can close",
        summary:
          "The best match is real enough to inspect but not strong enough to settle automatically.",
        detail:
          "Clarification, apply, and reopen decisions stay centralized in the DecisionDock until the gate is resolved.",
        announcementRole: "alert",
      },
      evidenceDrawer: {
        title: "Evidence drawer",
        summary:
          "Open the current source, parser, and scoring detail without leaving the same pharmacy shell.",
        toggleLabel: "Inspect source detail and scoring provenance",
        groups: buildDrawerGroups({
          evidence: bindings.evidenceBinding,
          provenance: bindings.provenanceBinding,
          normalized: bindings.normalizedBinding,
          scorecard: bindings.scorecardBinding,
          gate: bindings.gateBinding,
        }),
      },
      decisionDock: {
        tone: "review",
        title: "Clarify or explicitly review the weak-match outcome",
        summary:
          "This route keeps the decisive next step in one place so the case cannot drift into quiet success posture.",
        currentOwnerLabel: bindings.gateBinding.currentOwnerRef,
        nextReviewLabel: "Review due by 24 Apr 2026, 16:24",
        consequenceTitle: "Consequence preview",
        consequenceSummary:
          "Applying this evidence too early would close against a low-confidence match; leaving it here keeps the case explicit and review-bound.",
        closeBlockers: ["Weak confidence band", "Open reconciliation gate"],
        primaryAction: {
          actionId: "open-resolve",
          label: "Open resolve board",
          detail: "Review the outcome lane with the current evidence and close blockers in view.",
          routeTarget: "resolve",
          emphasis: "primary",
        },
        secondaryActions: [
          {
            actionId: "open-validate",
            label: "Clarify on validation board",
            detail: "Return to the validation lane without losing the current case anchor.",
            routeTarget: "validate",
            emphasis: "secondary",
          },
          {
            actionId: "open-handoff",
            label: "Inspect handoff proof",
            detail: "Compare current outcome uncertainty against dispatch proof history.",
            routeTarget: "handoff",
            emphasis: "secondary",
          },
        ],
      },
      ...bindings,
    } satisfies PharmacyOutcomeAssurancePreviewSnapshot;
  })(),
  (() => {
    const bindings = buildCommonBindings({
      pharmacyCaseId: "PHC-2146",
      truthState: "review_required",
      resolutionClass: "resolved_no_supply",
      confidenceBand: "high",
      manualReviewState: "in_review",
      closeEligibilityState: "blocked_by_reconciliation",
      patientVisibilityState: "review_placeholder",
      confidence: 0.86,
      deltaToRunnerUp: 0.41,
      matchScore: 0.88,
      runnerUpMatchScore: 0.47,
      candidateCaseId: "PHC-2146",
      runnerUpCaseId: null,
      sourceType: "gp_workflow_observation",
      trustClass: "trusted_observed",
      decisionClass: "distinct",
      classificationState: "resolved_no_supply",
      assuranceState: "outcome_review",
      gateState: "in_review",
      blockingClosureState: "blocks_close",
      currentOwnerRef: "Manual review owner / duty pharmacist",
      result: "review_required",
      recordedAt: "2026-04-24T15:08:00.000Z",
      contradictionScore: 0.08,
      receivedAt: "2026-04-24T15:06:00.000Z",
    });
    return {
      pharmacyCaseId: "PHC-2146",
      visualMode: PHARMACY_ASSURANCE_WORKBENCH_VISUAL_MODE,
      surfaceState: "matched_review",
      header: buildHeader({
        tone: bandTone(bindings.truthBinding.matchConfidenceBand),
        title: "Outcome evidence is strongly matched, but manual review debt still blocks quiet closure",
        summary:
          "The current evidence is likely correct. The remaining blocker is operational review debt, not matching uncertainty.",
        statusPill: "Manual review debt",
        closePostureLabel: "Close-ready suppressed until review clears",
      }),
      sourceCard: {
        sourceLabel: "Observed GP workflow outcome",
        sourceSummary:
          "A workflow observation confirms the likely outcome, but the case remains intentionally non-calm until the review queue resolves it.",
        consultationModeLabel: "Asynchronous pathway outcome recorded",
        medicinesSuppliedLabel: "No medicine supply confirmed in this outcome",
        gpActionLabel: "No new GP action required",
        resolutionClassificationLabel: prettyClassification("resolved_no_supply"),
        receivedAtLabel: "24 Apr 2026, 16:06",
        trustLabel: "Trusted observed evidence",
      },
      matchSummary: {
        title: "Matched case posture",
        summary:
          "The candidate match is strong and uncontested. What remains is explicit operational review, not hidden uncertainty.",
        matchedCaseLabel: "PHC-2146 / Station Road Pharmacy",
        runnerUpCaseLabel: null,
        matchStateLabel: "Matched / manual review still open",
        patientVisibilityLabel: "Patient shell remains on review placeholder posture",
      },
      confidenceMeter: {
        confidenceBand: bindings.truthBinding.matchConfidenceBand,
        title: "Reconciliation confidence",
        summary:
          "This score is intentionally calmer than the weak-match variant, but it still does not unlock close-ready posture on its own.",
        confidenceValue: bindings.scorecardBinding.posteriorMatchConfidence,
        confidenceLabel: confidenceLabel(bindings.scorecardBinding.posteriorMatchConfidence),
        deltaToRunnerUpLabel: "No viable runner-up remains",
        thresholdSummary:
          "Confidence is high, but manual review debt remains the active blocker.",
        breakdown: buildBreakdown(bindings.scorecardBinding),
      },
      gateTimeline: {
        title: "Reconciliation gate timeline",
        summary:
          "The gate has moved from open to active review. Closure stays frozen until the review note and final decision are recorded.",
        steps: [
          {
            stepId: "received",
            label: "Evidence received",
            state: "complete",
            summary: "Observed outcome recorded.",
            detail: "The evidence envelope and normalized record are current.",
          },
          {
            stepId: "score",
            label: "Match scored",
            state: "complete",
            summary: "High-confidence match calculated.",
            detail: "The score frontier now favors the active case decisively.",
          },
          {
            stepId: "gate",
            label: "Review gate",
            state: "current",
            summary: "Manual review is now in progress.",
            detail: "The current owner must settle the remaining review debt before the case can close.",
          },
          {
            stepId: "close",
            label: "Close posture",
            state: "blocked",
            summary: "Closure remains intentionally blocked.",
            detail: "This case cannot tint as complete while review remains open.",
          },
        ],
      },
      manualReviewBanner: {
        tone: "watch",
        title: "Manual review is in progress",
        summary:
          "Matching uncertainty is low, but the final review step is still owed before closure can become quiet.",
        detail:
          "Keep all decisive actions in the DecisionDock until the review is recorded and the gate is cleared.",
        announcementRole: "status",
      },
      evidenceDrawer: {
        title: "Evidence drawer",
        summary:
          "The rail keeps provenance and review detail close to the current case without detaching into a second admin page.",
        toggleLabel: "Inspect evidence provenance and review detail",
        groups: buildDrawerGroups({
          evidence: bindings.evidenceBinding,
          provenance: bindings.provenanceBinding,
          normalized: bindings.normalizedBinding,
          scorecard: bindings.scorecardBinding,
          gate: bindings.gateBinding,
        }),
      },
      decisionDock: {
        tone: "watch",
        title: "Finish the in-progress review and then clear close-ready posture lawfully",
        summary:
          "This case is closer to completion than the weak-match variant, but the shell still treats review debt as authoritative.",
        currentOwnerLabel: bindings.gateBinding.currentOwnerRef,
        nextReviewLabel: "Review target 24 Apr 2026, 17:00",
        consequenceTitle: "Consequence preview",
        consequenceSummary:
          "Clearing review debt here preserves one authoritative next step and avoids a false complete state on the queue row.",
        closeBlockers: ["Manual review still in progress", "Outcome gate not yet resolved"],
        primaryAction: {
          actionId: "open-resolve",
          label: "Open resolve board",
          detail: "Record the final review decision with the current match detail in view.",
          routeTarget: "resolve",
          emphasis: "primary",
        },
        secondaryActions: [
          {
            actionId: "open-validate",
            label: "Return to validation lane",
            detail: "Review supporting validation context without leaving the same shell family.",
            routeTarget: "validate",
            emphasis: "secondary",
          },
          {
            actionId: "open-handoff",
            label: "Inspect dispatch proof history",
            detail: "Keep dispatch proof distinct from outcome review debt.",
            routeTarget: "handoff",
            emphasis: "secondary",
          },
        ],
      },
      ...bindings,
    } satisfies PharmacyOutcomeAssurancePreviewSnapshot;
  })(),
  (() => {
    const bindings = buildCommonBindings({
      pharmacyCaseId: "PHC-2168",
      truthState: "unmatched",
      resolutionClass: "unmatched",
      confidenceBand: "low",
      manualReviewState: "required",
      closeEligibilityState: "not_closable",
      patientVisibilityState: "review_placeholder",
      confidence: 0.18,
      deltaToRunnerUp: 0,
      matchScore: 0.21,
      runnerUpMatchScore: 0.18,
      candidateCaseId: null,
      runnerUpCaseId: null,
      sourceType: "email_ingest",
      trustClass: "email_low_assurance",
      decisionClass: "distinct",
      classificationState: "unmatched",
      assuranceState: "outcome_review",
      gateState: "open",
      blockingClosureState: "blocks_close",
      currentOwnerRef: "Clarification owner / pharmacist review queue",
      result: "unmatched",
      recordedAt: "2026-04-24T15:14:00.000Z",
      contradictionScore: 0.44,
      receivedAt: "2026-04-24T15:12:00.000Z",
    });
    return {
      pharmacyCaseId: "PHC-2168",
      visualMode: PHARMACY_ASSURANCE_WORKBENCH_VISUAL_MODE,
      surfaceState: "unmatched_review",
      header: buildHeader({
        tone: "blocked",
        title: "Outcome evidence is unmatched and cannot support any closure posture",
        summary:
          "No trusted case tuple currently satisfies the matching thresholds, so the case stays explicitly review-bound and non-calm.",
        statusPill: "Unmatched",
        closePostureLabel: "Not closable until clarified or recorded as unmatched",
      }),
      sourceCard: {
        sourceLabel: "Low-assurance email outcome",
        sourceSummary:
          "A free-text email outcome arrived without a trustworthy tuple, so the case remains unmatched until it is clarified or formally recorded as unmatched.",
        consultationModeLabel: "Consultation mode not verified",
        medicinesSuppliedLabel: "No verified medicine supply in the source evidence",
        gpActionLabel: "Possible GP follow-up after clarification",
        resolutionClassificationLabel: prettyClassification("unmatched"),
        receivedAtLabel: "24 Apr 2026, 16:12",
        trustLabel: "Email low-assurance evidence",
      },
      matchSummary: {
        title: "No trustworthy case match",
        summary:
          "The shell keeps unmatched evidence explicit so it cannot be mistaken for a slow or quietly successful completion state.",
        matchedCaseLabel: "No candidate case currently satisfies the hard floor",
        runnerUpCaseLabel: "Runner-up remains below the same floor",
        matchStateLabel: "Unmatched / clarification required",
        patientVisibilityLabel: "Patient shell remains on review placeholder posture",
      },
      confidenceMeter: {
        confidenceBand: bindings.truthBinding.matchConfidenceBand,
        title: "Reconciliation confidence",
        summary:
          "Confidence is intentionally low and visibly separated from matched-review states so the case cannot quiet itself into closure.",
        confidenceValue: bindings.scorecardBinding.posteriorMatchConfidence,
        confidenceLabel: confidenceLabel(bindings.scorecardBinding.posteriorMatchConfidence),
        deltaToRunnerUpLabel: "No meaningful lead over any alternative tuple",
        thresholdSummary:
          "Below the source floor and auto-apply threshold; unmatched posture is authoritative.",
        breakdown: buildBreakdown(bindings.scorecardBinding),
      },
      gateTimeline: {
        title: "Reconciliation gate timeline",
        summary:
          "The evidence is present and visible, but no case match exists and the shell shows that explicitly instead of dropping the case.",
        steps: [
          {
            stepId: "received",
            label: "Evidence received",
            state: "complete",
            summary: "Low-assurance email captured.",
            detail: "The envelope is replay-safe but not match-safe.",
          },
          {
            stepId: "score",
            label: "Match scored",
            state: "blocked",
            summary: "No candidate satisfies the hard floor.",
            detail: "The current score remains below the matching threshold family.",
          },
          {
            stepId: "gate",
            label: "Review gate",
            state: "current",
            summary: "Clarification or unmatched review is required.",
            detail: "The gate remains open until the unmatched posture is resolved explicitly.",
          },
          {
            stepId: "close",
            label: "Close posture",
            state: "blocked",
            summary: "Closure is not allowed.",
            detail: "This case must not read as resolved or quietly disappear.",
          },
        ],
      },
      manualReviewBanner: {
        tone: "blocked",
        title: "The outcome is unmatched and must stay visibly unresolved",
        summary:
          "This is not a quiet pending case. It needs clarification or a formal unmatched decision before anything else can settle.",
        detail:
          "Use the DecisionDock to move to the validation or resolve lanes without losing the current evidence context.",
        announcementRole: "alert",
      },
      evidenceDrawer: {
        title: "Evidence drawer",
        summary:
          "The drawer keeps parser, provenance, and scoring detail inspectable inside the same shell while unmatched posture remains explicit.",
        toggleLabel: "Inspect unmatched evidence detail",
        groups: buildDrawerGroups({
          evidence: bindings.evidenceBinding,
          provenance: bindings.provenanceBinding,
          normalized: bindings.normalizedBinding,
          scorecard: bindings.scorecardBinding,
          gate: bindings.gateBinding,
        }),
      },
      decisionDock: {
        tone: "blocked",
        title: "Clarify the source or record the unmatched outcome explicitly",
        summary:
          "No background process will make this calm. The next decision stays visible here until the unmatched posture is resolved lawfully.",
        currentOwnerLabel: bindings.gateBinding.currentOwnerRef,
        nextReviewLabel: "Clarify by 24 Apr 2026, 16:40",
        consequenceTitle: "Consequence preview",
        consequenceSummary:
          "If this evidence is left unmatched without an explicit decision, the case remains open and closure stays unavailable everywhere else in the shell.",
        closeBlockers: ["No trusted case match", "Outcome marked not closable"],
        primaryAction: {
          actionId: "open-validate",
          label: "Open validation lane",
          detail: "Return to the case board and inspect the active tuple before clarifying.",
          routeTarget: "validate",
          emphasis: "primary",
        },
        secondaryActions: [
          {
            actionId: "open-resolve",
            label: "Open resolve board",
            detail: "Record the unmatched review decision with the current evidence still in view.",
            routeTarget: "resolve",
            emphasis: "secondary",
          },
          {
            actionId: "open-handoff",
            label: "Inspect handoff proof history",
            detail: "Compare the unmatched evidence against the latest safe handoff tuple.",
            routeTarget: "handoff",
            emphasis: "secondary",
          },
        ],
      },
      ...bindings,
    } satisfies PharmacyOutcomeAssurancePreviewSnapshot;
  })(),
] as const;

const assurancePreviewMap = new Map(
  pharmacyOutcomeAssurancePreviewCases.map((preview) => [preview.pharmacyCaseId, preview] as const),
);

export function resolvePharmacyOutcomeAssurancePreview(
  pharmacyCaseId: string | null | undefined,
): PharmacyOutcomeAssurancePreviewSnapshot | null {
  return assurancePreviewMap.get(pharmacyCaseId ?? "") ?? null;
}
