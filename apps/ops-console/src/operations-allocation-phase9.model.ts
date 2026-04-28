import {
  OPS_OVERVIEW_BOARD_SCOPE_REF,
  OPS_OVERVIEW_SCOPE_POLICY_REF,
  OPS_OVERVIEW_SHELL_CONTINUITY_KEY,
  OPS_OVERVIEW_TIME_HORIZON,
  normalizeOpsOverviewScenarioState,
  type OpsOverviewScenarioState,
} from "./operations-overview-phase9.model";

export const OPS_ALLOCATION_TASK_ID = "par_451";
export const OPS_ALLOCATION_SCHEMA_VERSION = "451.phase9.ops-allocation-route.v1";

export type OpsAllocationRouteLens = "queues" | "capacity";
export type OpsAllocationScenarioState = OpsOverviewScenarioState;

export type OpsActionEligibilityState =
  | "executable"
  | "observe_only"
  | "stale_reacquire"
  | "read_only_recovery"
  | "handoff_required"
  | "blocked";

export type OpsInterventionSettlementStatus =
  | "not_submitted"
  | "pending_effect"
  | "applied"
  | "handoff_required"
  | "read_only_diagnostic"
  | "blocked_guardrail"
  | "stale_reacquire";

export interface OpsBottleneckLadderRow {
  readonly rank: number;
  readonly anomalyRef: string;
  readonly anomalyName: string;
  readonly affectedScope: string;
  readonly consequenceScore: number;
  readonly leverageScore: number;
  readonly persistence: string;
  readonly freshnessTrust: string;
  readonly freshnessTrustScore: number;
  readonly guardrailDrag: number;
  readonly trend: readonly number[];
  readonly intervalLabel: string;
  readonly reason: string;
  readonly anomalyRankScore: number;
  readonly actionEligibilityState: OpsActionEligibilityState;
  readonly sourceSliceEnvelopeRef: string;
  readonly selected: boolean;
}

export interface OpsCapacityAllocationRow {
  readonly capacityRef: string;
  readonly laneLabel: string;
  readonly teamOrChannel: string;
  readonly currentCapacity: number;
  readonly proposedDelta: number;
  readonly resultingCapacity: number;
  readonly breachRiskDelta: string;
  readonly dependencyConstraint: string;
  readonly confidenceInterval: string;
  readonly calibrationAge: string;
  readonly owner: string;
  readonly proposalState: "proposed" | "advisory" | "read_only" | "blocked";
}

export interface OpsCohortImpactMatrixRow {
  readonly cohortRef: string;
  readonly cohortLabel: string;
  readonly pressureIndex: number;
  readonly variance: string;
  readonly effectiveSampleSize: number;
  readonly confidenceInterval: string;
  readonly equityWatch: string;
  readonly proposedEffect: string;
  readonly promotionState: "eligible" | "watch" | "context_only" | "blocked";
  readonly lowSample: boolean;
  readonly safeSummary: string;
}

export interface InterventionCandidateLease {
  readonly candidateLeaseId: string;
  readonly candidateRef: string;
  readonly actionScopeRef: string;
  readonly sourceSliceEnvelopeRef: string;
  readonly opsBoardStateSnapshotRef: string;
  readonly opsSelectionLeaseRef: string;
  readonly opsRouteIntentRef: string;
  readonly opsDeltaGateRef: string;
  readonly opsReturnTokenRef: string;
  readonly boardTupleHash: string;
  readonly selectedEntityTupleHash: string;
  readonly releaseTrustFreezeVerdictRef: string;
  readonly governingObjectRef: string;
  readonly eligibilityState: OpsActionEligibilityState;
  readonly policyBundleRef: string;
  readonly expiresAt: string;
  readonly idempotencyKey: string;
  readonly settlementStatus: OpsInterventionSettlementStatus;
}

export interface OpsActionEligibilityFence {
  readonly actionEligibilityFenceRef: string;
  readonly eligibilityState: OpsActionEligibilityState;
  readonly reason: string;
  readonly requiredGovernanceHandoff: boolean;
  readonly degradedReasonRefs: readonly string[];
  readonly timeoutRecovery: string;
  readonly announcedCopy: string;
}

export interface OpsInterventionCandidate {
  readonly candidateRef: string;
  readonly title: string;
  readonly actionType:
    | "human_staffing_move"
    | "automation_fallback"
    | "routing_change"
    | "supplier_failover"
    | "threshold_adjustment"
    | "governance_handoff";
  readonly targetScope: string;
  readonly expectedBenefit: string;
  readonly expectedBenefitScore: number;
  readonly uncertainty: string;
  readonly implementationLag: string;
  readonly owner: string;
  readonly downsideRisk: string;
  readonly guardrails: readonly string[];
  readonly readinessScore: number;
  readonly readinessState:
    | "commit_ready"
    | "advisory"
    | "observe_only"
    | "handoff_only"
    | "blocked";
  readonly eligibilityState: OpsActionEligibilityState;
  readonly leaseRef: string;
  readonly selected: boolean;
}

export interface OpsScenarioCompareProjection {
  readonly scenarioCompareRef: string;
  readonly baseSnapshotRef: string;
  readonly baseBoardTupleHash: string;
  readonly currentMetricBasis: string;
  readonly proposedMetricBasis: string;
  readonly impactMetricBasis: string;
  readonly queuedDriftSummary: string;
  readonly frozenReason: string;
  readonly rankOrderStable: boolean;
  readonly focusProtectionFenceRef: string;
  readonly deltaGateState: "safe_apply" | "released" | "buffered" | "stale" | "blocked";
}

export interface OpsAllocationProjection {
  readonly taskId: typeof OPS_ALLOCATION_TASK_ID;
  readonly schemaVersion: typeof OPS_ALLOCATION_SCHEMA_VERSION;
  readonly routeLens: OpsAllocationRouteLens;
  readonly route: "/ops/queues" | "/ops/capacity";
  readonly scenarioState: OpsAllocationScenarioState;
  readonly boardScopeRef: typeof OPS_OVERVIEW_BOARD_SCOPE_REF;
  readonly timeHorizon: typeof OPS_OVERVIEW_TIME_HORIZON;
  readonly scopePolicyRef: typeof OPS_OVERVIEW_SCOPE_POLICY_REF;
  readonly shellContinuityKey: typeof OPS_OVERVIEW_SHELL_CONTINUITY_KEY;
  readonly boardStateDigestRef: string;
  readonly boardTupleHash: string;
  readonly selectedAnomalyRef: string;
  readonly selectedEntityTupleHash: string;
  readonly sourceSliceEnvelopeRef: string;
  readonly releaseTrustFreezeVerdictRef: string;
  readonly bottleneckLadder: readonly OpsBottleneckLadderRow[];
  readonly capacityRows: readonly OpsCapacityAllocationRow[];
  readonly cohortRows: readonly OpsCohortImpactMatrixRow[];
  readonly interventionCandidates: readonly OpsInterventionCandidate[];
  readonly selectedIntervention: OpsInterventionCandidate;
  readonly candidateLease: InterventionCandidateLease;
  readonly actionEligibilityFence: OpsActionEligibilityFence;
  readonly scenarioCompare: OpsScenarioCompareProjection;
  readonly surfaceSummary: string;
  readonly sourceAlgorithmRefs: readonly string[];
  readonly upstreamSchemaVersions: Record<"437" | "438" | "446" | "450", string>;
}

export const opsAllocationScenarioStates = [
  "normal",
  "stable_service",
  "empty",
  "stale",
  "degraded",
  "quarantined",
  "blocked",
  "permission_denied",
  "freeze",
  "settlement_pending",
] as const satisfies readonly OpsAllocationScenarioState[];

export const opsAllocationAutomationAnchors = [
  "bottleneck-radar",
  "capacity-allocator",
  "cohort-impact-matrix",
  "intervention-workbench",
  "action-eligibility-state",
  "scenario-compare",
  "ops-governance-handoff",
] as const;

const sourceAlgorithmRefs = [
  "blueprint/operations-console-frontend-blueprint.md#4.2-BottleneckRadar",
  "blueprint/operations-console-frontend-blueprint.md#4.3-CapacityAllocator",
  "blueprint/operations-console-frontend-blueprint.md#4.5-CohortImpactMatrix",
  "blueprint/operations-console-frontend-blueprint.md#4.6-InterventionWorkbench",
  "blueprint/operations-console-frontend-blueprint.md#6-drill-down-allocation-and-degraded-mode-algorithms",
  "blueprint/phase-9-the-assurance-ledger.md#9B",
] as const;

const upstreamSchemaVersions = {
  "437": "437.phase9.operational-projection-engine.v1",
  "438": "438.phase9.essential-function-metrics.v1",
  "446": "446.phase9.projection-rebuild-quarantine.v1",
  "450": "450.phase9.ops-overview-route.v1",
} as const;

const baseBottlenecks = [
  {
    anomalyRef: "ops-route-07",
    anomalyName: "Referral confirmation backlog surge",
    affectedScope: "queue.priority.referral-confirmation",
    consequenceScore: 94,
    leverageScore: 88,
    persistenceMinutes: 96,
    freshnessTrustScore: 86,
    guardrailDrag: 12,
    trend: [44, 51, 63, 71, 82, 89],
    intervalLabel: "Relief lower bound +4.2 staff-hours",
    reason:
      "Highest safe relief because the queue tuple is fresh, the selected lane is exact, and staffing movement has bounded downside.",
    baseEligibility: "executable",
    sourceSliceEnvelopeRef: "OSE_451_QUEUE_CONFIRMATION",
  },
  {
    anomalyRef: "ops-route-04",
    anomalyName: "Outbound supplier acknowledgement drag",
    affectedScope: "dependency.outbound-confirmations",
    consequenceScore: 82,
    leverageScore: 61,
    persistenceMinutes: 132,
    freshnessTrustScore: 74,
    guardrailDrag: 34,
    trend: [51, 58, 66, 69, 68, 72],
    intervalLabel: "Protected path +7% to +10%",
    reason:
      "Visible bottleneck, but supplier ambiguity keeps automated replay behind a governance handoff.",
    baseEligibility: "handoff_required",
    sourceSliceEnvelopeRef: "OSE_451_DEPENDENCY_SUPPLIER",
  },
  {
    anomalyRef: "ops-route-12",
    anomalyName: "Continuity replay proof drift",
    affectedScope: "continuity.replay.checkpoint",
    consequenceScore: 78,
    leverageScore: 43,
    persistenceMinutes: 188,
    freshnessTrustScore: 52,
    guardrailDrag: 64,
    trend: [37, 39, 45, 50, 55, 59],
    intervalLabel: "Diagnostic only until proof realigns",
    reason:
      "The preserved proof basis remains readable, but stale continuity evidence suppresses live allocation.",
    baseEligibility: "stale_reacquire",
    sourceSliceEnvelopeRef: "OSE_451_CONTINUITY_REPLAY",
  },
  {
    anomalyRef: "ops-route-15",
    anomalyName: "Release freeze constraining relief",
    affectedScope: "release.freeze.manual-relief",
    consequenceScore: 74,
    leverageScore: 49,
    persistenceMinutes: 240,
    freshnessTrustScore: 81,
    guardrailDrag: 78,
    trend: [28, 34, 42, 47, 54, 57],
    intervalLabel: "Manual package only",
    reason:
      "The action can be prepared, but release freeze authority blocks execution inside the ops shell.",
    baseEligibility: "blocked",
    sourceSliceEnvelopeRef: "OSE_451_RELEASE_FREEZE",
  },
  {
    anomalyRef: "ops-route-21",
    anomalyName: "Partner acknowledgement watch cohort",
    affectedScope: "cohort.partner-origin-acknowledgements",
    consequenceScore: 41,
    leverageScore: 32,
    persistenceMinutes: 44,
    freshnessTrustScore: 69,
    guardrailDrag: 22,
    trend: [21, 24, 30, 29, 32, 34],
    intervalLabel: "Context only; n=9",
    reason:
      "Point variance is high, but effective sample size is below promotion policy and cannot dominate.",
    baseEligibility: "observe_only",
    sourceSliceEnvelopeRef: "OSE_451_LOW_SAMPLE_PARTNER_ACK",
  },
] as const satisfies readonly (Omit<
  OpsBottleneckLadderRow,
  | "rank"
  | "persistence"
  | "freshnessTrust"
  | "anomalyRankScore"
  | "actionEligibilityState"
  | "selected"
> & {
  readonly persistenceMinutes: number;
  readonly baseEligibility: OpsActionEligibilityState;
})[];

const baseCapacityRows = [
  {
    capacityRef: "cap-confirm-priority-reviewers",
    laneLabel: "Priority referral confirmation",
    teamOrChannel: "Confirmation reviewers",
    currentCapacity: 18,
    proposedDelta: 2,
    breachRiskDelta: "-6 breach-risk cases",
    dependencyConstraint: "Keep priority-lane owner unchanged; no supplier dependency.",
    confidenceInterval: "80% CI 4 to 8 cases",
    calibrationAge: "8m calibrated",
    owner: "Operations queue control",
  },
  {
    capacityRef: "cap-hub-cross-cover",
    laneLabel: "Hub coordination cover",
    teamOrChannel: "Hub desk cross-cover",
    currentCapacity: 9,
    proposedDelta: 1,
    breachRiskDelta: "-2 confirmation delays",
    dependencyConstraint: "Network coordination policy tuple must remain current.",
    confidenceInterval: "80% CI 1 to 3 cases",
    calibrationAge: "11m calibrated",
    owner: "Hub duty lead",
  },
  {
    capacityRef: "cap-supplier-protected-path",
    laneLabel: "Protected outbound path",
    teamOrChannel: "Supplier fallback channel",
    currentCapacity: 12,
    proposedDelta: 0,
    breachRiskDelta: "No live capacity move; route only priority confirmations",
    dependencyConstraint: "Supplier ambiguity requires governance handoff.",
    confidenceInterval: "Guarded interval; provider receipts late",
    calibrationAge: "12m guarded",
    owner: "Runtime dependency watch",
  },
] as const;

const baseCohortRows = [
  {
    cohortRef: "cohort-priority-referrals",
    cohortLabel: "High-priority referrals",
    pressureIndex: 86,
    variance: "+14% dwell",
    effectiveSampleSize: 412,
    confidenceInterval: "0.78 to 0.86 pressure band",
    equityWatch: "No new access-equity alert",
    proposedEffect: "Expected relief: 4 to 8 cases",
    promotionState: "eligible",
    lowSample: false,
    safeSummary:
      "Large enough sample and confidence band support promotion when queue tuple stays live.",
  },
  {
    cohortRef: "cohort-outbound-confirmations",
    cohortLabel: "Outbound confirmations",
    pressureIndex: 72,
    variance: "-7% throughput",
    effectiveSampleSize: 188,
    confidenceInterval: "0.64 to 0.76 dependency band",
    equityWatch: "Delivery fallback constrained",
    proposedEffect: "Priority-only protected path",
    promotionState: "watch",
    lowSample: false,
    safeSummary:
      "Supplier lag is visible but cannot inherit commit-ready posture from queue pressure.",
  },
  {
    cohortRef: "cohort-urgent-pharmacy-reentry",
    cohortLabel: "Urgent pharmacy re-entry",
    pressureIndex: 58,
    variance: "+1 reopened request",
    effectiveSampleSize: 34,
    confidenceInterval: "Wide interval; operational review only",
    equityWatch: "Urgent-return lineage must remain non-calm",
    proposedEffect: "Keep same request anchor visible",
    promotionState: "watch",
    lowSample: false,
    safeSummary:
      "Clinically important watch cohort remains visible without displacing the dominant queue anomaly.",
  },
  {
    cohortRef: "cohort-partner-ack-low-sample",
    cohortLabel: "Partner-origin acknowledgements",
    pressureIndex: 91,
    variance: "+31% point estimate",
    effectiveSampleSize: 9,
    confidenceInterval: "n=9 below promotion threshold",
    equityWatch: "Context only until support grows",
    proposedEffect: "No promoted intervention",
    promotionState: "context_only",
    lowSample: true,
    safeSummary:
      "Low effective sample size prevents dominant treatment despite the high point estimate.",
  },
] as const satisfies readonly OpsCohortImpactMatrixRow[];

function sanitizeRef(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]+/g, "_");
}

export function normalizeOpsAllocationScenarioState(
  value: string | null | undefined,
): OpsAllocationScenarioState {
  return normalizeOpsOverviewScenarioState(value);
}

export function routeForAllocationLens(
  routeLens: OpsAllocationRouteLens,
): "/ops/queues" | "/ops/capacity" {
  return routeLens === "capacity" ? "/ops/capacity" : "/ops/queues";
}

export function defaultAllocationAnomalyForLens(
  routeLens: OpsAllocationRouteLens,
  scenarioState: OpsAllocationScenarioState = "normal",
): string {
  switch (scenarioState) {
    case "stale":
      return "ops-route-12";
    case "blocked":
    case "permission_denied":
    case "freeze":
      return "ops-route-15";
    case "quarantined":
      return "ops-route-04";
    case "degraded":
      return "ops-route-04";
    case "empty":
    case "stable_service":
      return "ops-route-21";
    case "settlement_pending":
    case "normal":
    default:
      return routeLens === "capacity" ? "ops-route-07" : "ops-route-07";
  }
}

function scenarioEligibility(
  scenarioState: OpsAllocationScenarioState,
  baseEligibility: OpsActionEligibilityState,
): OpsActionEligibilityState {
  switch (scenarioState) {
    case "blocked":
    case "permission_denied":
      return "blocked";
    case "freeze":
      return baseEligibility === "observe_only" ? "observe_only" : "handoff_required";
    case "stale":
      return "stale_reacquire";
    case "quarantined":
      return "read_only_recovery";
    case "degraded":
      return baseEligibility === "executable" ? "observe_only" : baseEligibility;
    case "settlement_pending":
      return baseEligibility === "executable" ? "observe_only" : baseEligibility;
    case "empty":
    case "stable_service":
      return "observe_only";
    case "normal":
    default:
      return baseEligibility;
  }
}

function scenarioSettlementStatus(
  scenarioState: OpsAllocationScenarioState,
  eligibilityState: OpsActionEligibilityState,
): OpsInterventionSettlementStatus {
  if (scenarioState === "settlement_pending") {
    return "pending_effect";
  }
  switch (eligibilityState) {
    case "executable":
      return "not_submitted";
    case "handoff_required":
      return "handoff_required";
    case "stale_reacquire":
      return "stale_reacquire";
    case "read_only_recovery":
      return "read_only_diagnostic";
    case "blocked":
      return "blocked_guardrail";
    case "observe_only":
    default:
      return "read_only_diagnostic";
  }
}

function eligibilityReason(
  scenarioState: OpsAllocationScenarioState,
  selectedRow: OpsBottleneckLadderRow,
  eligibilityState: OpsActionEligibilityState,
): string {
  if (scenarioState === "settlement_pending") {
    return "A previous allocation is pending authoritative settlement, so the workbench preserves context and waits for effect proof.";
  }
  switch (eligibilityState) {
    case "executable":
      return "The source slice is interactive, tuple hashes match, selection lease is live, and release trust is not frozen.";
    case "handoff_required":
      return "The candidate can be prepared, but mutation authority belongs to governance because guardrails or release posture constrain the shell.";
    case "stale_reacquire":
      return "The preserved board or continuity tuple is stale; reacquire the selected anomaly before preparing a new action.";
    case "read_only_recovery":
      return "The affected slice is degraded or quarantined, so the allocator renders readable evidence only.";
    case "blocked":
      return "Release, permission, or slice authority blocks operational mutation in this shell.";
    case "observe_only":
    default:
      return `${selectedRow.anomalyName} is visible for diagnosis, but current policy keeps the intervention advisory.`;
  }
}

function degradedReasonRefs(
  scenarioState: OpsAllocationScenarioState,
  selectedRow: OpsBottleneckLadderRow,
): readonly string[] {
  const refs = [`source:${selectedRow.sourceSliceEnvelopeRef}`];
  if (scenarioState === "stale") refs.push("freshness:stale_review");
  if (scenarioState === "quarantined") refs.push("trust:producer_namespace_quarantined");
  if (scenarioState === "blocked") refs.push("authority:blocked");
  if (scenarioState === "permission_denied") refs.push("policy:permission_denied");
  if (scenarioState === "freeze") refs.push("release:channel_freeze");
  if (scenarioState === "settlement_pending") refs.push("settlement:pending_effect");
  return refs;
}

function rankScore(
  row: (typeof baseBottlenecks)[number],
  routeLens: OpsAllocationRouteLens,
  scenarioState: OpsAllocationScenarioState,
): number {
  const routeBonus =
    routeLens === "capacity" && row.anomalyRef === "ops-route-15"
      ? 5
      : routeLens === "queues" && row.anomalyRef === "ops-route-07"
        ? 8
        : 0;
  const statePenalty =
    scenarioState === "stale" || scenarioState === "quarantined"
      ? 14
      : scenarioState === "blocked" || scenarioState === "permission_denied"
        ? 30
        : scenarioState === "empty" || scenarioState === "stable_service"
          ? 22
          : 0;
  const lowSamplePenalty = row.anomalyRef === "ops-route-21" ? 42 : 0;
  return Math.round(
    row.consequenceScore * 0.38 +
      row.leverageScore * 0.28 +
      (row.persistenceMinutes / 4) * 0.18 +
      row.freshnessTrustScore * 0.1 -
      row.guardrailDrag * 0.06 +
      routeBonus -
      statePenalty -
      lowSamplePenalty,
  );
}

function createLadder(
  routeLens: OpsAllocationRouteLens,
  scenarioState: OpsAllocationScenarioState,
  selectedAnomalyRef: string,
): readonly OpsBottleneckLadderRow[] {
  return [...baseBottlenecks]
    .map((row) => {
      const actionEligibilityState = scenarioEligibility(scenarioState, row.baseEligibility);
      return {
        rank: 0,
        anomalyRef: row.anomalyRef,
        anomalyName: row.anomalyName,
        affectedScope: row.affectedScope,
        consequenceScore: row.consequenceScore,
        leverageScore: row.leverageScore,
        persistence: `${row.persistenceMinutes}m persistent`,
        freshnessTrust:
          scenarioState === "quarantined"
            ? "Quarantined trust"
            : scenarioState === "stale"
              ? "Stale review"
              : `${row.freshnessTrustScore}% trust lower bound`,
        freshnessTrustScore:
          scenarioState === "quarantined"
            ? Math.min(row.freshnessTrustScore, 38)
            : scenarioState === "stale"
              ? Math.min(row.freshnessTrustScore, 42)
              : row.freshnessTrustScore,
        guardrailDrag:
          scenarioState === "blocked" || scenarioState === "permission_denied"
            ? Math.max(row.guardrailDrag, 88)
            : scenarioState === "freeze"
              ? Math.max(row.guardrailDrag, 76)
              : row.guardrailDrag,
        trend: row.trend,
        intervalLabel: row.intervalLabel,
        reason: row.reason,
        anomalyRankScore: rankScore(row, routeLens, scenarioState),
        actionEligibilityState,
        sourceSliceEnvelopeRef: row.sourceSliceEnvelopeRef,
        selected: row.anomalyRef === selectedAnomalyRef,
      } satisfies OpsBottleneckLadderRow;
    })
    .sort((left, right) => {
      if (right.anomalyRankScore !== left.anomalyRankScore) {
        return right.anomalyRankScore - left.anomalyRankScore;
      }
      return left.anomalyRef.localeCompare(right.anomalyRef);
    })
    .map((row, index) => ({
      ...row,
      rank: index + 1,
      selected: row.anomalyRef === selectedAnomalyRef,
    }));
}

function capacityProposalState(
  scenarioState: OpsAllocationScenarioState,
  selectedEligibility: OpsActionEligibilityState,
): OpsCapacityAllocationRow["proposalState"] {
  if (selectedEligibility === "blocked" || scenarioState === "permission_denied") {
    return "blocked";
  }
  if (
    selectedEligibility === "stale_reacquire" ||
    selectedEligibility === "read_only_recovery" ||
    scenarioState === "quarantined"
  ) {
    return "read_only";
  }
  return selectedEligibility === "executable" ? "proposed" : "advisory";
}

function createCapacityRows(
  routeLens: OpsAllocationRouteLens,
  scenarioState: OpsAllocationScenarioState,
  selectedEligibility: OpsActionEligibilityState,
): readonly OpsCapacityAllocationRow[] {
  const proposalState = capacityProposalState(scenarioState, selectedEligibility);
  const capacityBias = routeLens === "capacity" ? 1 : 0;
  return baseCapacityRows.map((row) => {
    const proposedDelta =
      proposalState === "blocked" || proposalState === "read_only"
        ? 0
        : row.proposedDelta + capacityBias;
    return {
      ...row,
      proposedDelta,
      resultingCapacity: row.currentCapacity + proposedDelta,
      proposalState,
      breachRiskDelta:
        proposalState === "blocked"
          ? "Blocked by authority"
          : proposalState === "read_only"
            ? "Read-only; last stable impact retained"
            : row.breachRiskDelta,
    };
  });
}

function createCohortRows(
  scenarioState: OpsAllocationScenarioState,
): readonly OpsCohortImpactMatrixRow[] {
  return baseCohortRows.map((row) => {
    if (scenarioState === "blocked" || scenarioState === "permission_denied") {
      return {
        ...row,
        promotionState: row.lowSample ? "context_only" : "blocked",
        proposedEffect: row.lowSample ? row.proposedEffect : "Blocked by shell authority",
      };
    }
    if (scenarioState === "quarantined" && row.cohortRef === "cohort-outbound-confirmations") {
      return {
        ...row,
        promotionState: "blocked",
        equityWatch: "Quarantined supplier slice",
        proposedEffect: "Read-only until quarantine releases",
      };
    }
    if (scenarioState === "stale" && row.promotionState === "eligible") {
      return {
        ...row,
        promotionState: "watch",
        proposedEffect: "Stale review; reacquire before action",
      };
    }
    return row;
  });
}

function readinessStateForEligibility(
  eligibilityState: OpsActionEligibilityState,
): OpsInterventionCandidate["readinessState"] {
  switch (eligibilityState) {
    case "executable":
      return "commit_ready";
    case "handoff_required":
      return "handoff_only";
    case "blocked":
      return "blocked";
    case "observe_only":
      return "advisory";
    case "stale_reacquire":
    case "read_only_recovery":
    default:
      return "observe_only";
  }
}

function createInterventionCandidates(
  selectedRow: OpsBottleneckLadderRow,
  scenarioState: OpsAllocationScenarioState,
): readonly OpsInterventionCandidate[] {
  const primaryEligibility = selectedRow.actionEligibilityState;
  const settlementPending = scenarioState === "settlement_pending";
  const candidates: readonly Omit<
    OpsInterventionCandidate,
    "eligibilityState" | "leaseRef" | "selected"
  >[] = [
    {
      candidateRef: `IC_${sanitizeRef(selectedRow.anomalyRef)}_STAFF_RELIEF`,
      title: "Move reviewers into protected relief lane",
      actionType: "human_staffing_move",
      targetScope: selectedRow.affectedScope,
      expectedBenefit: settlementPending
        ? "Effect proof pending from previously submitted relief move"
        : "4 to 8 fewer breach-risk cases in the current window",
      expectedBenefitScore: 84,
      uncertainty: "80% CI based on current capacity calibration",
      implementationLag: "15m to staff handoff",
      owner: "Operations queue control",
      downsideRisk: "Non-priority confirmation throughput slows by up to 3%.",
      guardrails: [
        "OpsSelectionLease must remain active",
        "Release freeze verdict must remain live",
        "Capacity rank proof must match selected lane",
      ],
      readinessScore: settlementPending ? 66 : 88,
      readinessState: readinessStateForEligibility(primaryEligibility),
    },
    {
      candidateRef: `IC_${sanitizeRef(selectedRow.anomalyRef)}_PROTECTED_PATH`,
      title: "Route priority confirmations through protected path",
      actionType: "routing_change",
      targetScope: "dependency.outbound-confirmations",
      expectedBenefit: "Priority delivery stays visible while supplier ambiguity is reviewed",
      expectedBenefitScore: 62,
      uncertainty: "Guarded by supplier receipt interval",
      implementationLag: "25m to channel confirmation",
      owner: "Runtime dependency watch",
      downsideRisk: "Ordinary retry lane remains held.",
      guardrails: [
        "Supplier watch tuple must be named",
        "No automatic replay while ambiguity persists",
      ],
      readinessScore: 62,
      readinessState: "handoff_only",
    },
    {
      candidateRef: `IC_${sanitizeRef(selectedRow.anomalyRef)}_OBSERVE`,
      title: "Observe and reacquire proof basis",
      actionType: "governance_handoff",
      targetScope: selectedRow.sourceSliceEnvelopeRef,
      expectedBenefit: "Preserves the current context without arming unsafe mutation",
      expectedBenefitScore: 38,
      uncertainty: "No relief claim until tuple realigns",
      implementationLag: "Next board check",
      owner: "Assurance publication steward",
      downsideRisk: "Operational pressure may persist during review.",
      guardrails: ["Continuity set hash must be preserved", "Return token must stay valid"],
      readinessScore: 42,
      readinessState: "observe_only",
    },
  ];

  return candidates.map((candidate, index) => {
    const eligibilityState =
      index === 0
        ? primaryEligibility
        : candidate.actionType === "routing_change"
          ? scenarioEligibility(scenarioState, "handoff_required")
          : "observe_only";
    return {
      ...candidate,
      readinessState:
        index === 0 ? readinessStateForEligibility(eligibilityState) : candidate.readinessState,
      eligibilityState,
      leaseRef: `ICL_${sanitizeRef(candidate.candidateRef)}`,
      selected: index === 0,
    };
  });
}

function createSelectedAnomalyRef(
  routeLens: OpsAllocationRouteLens,
  scenarioState: OpsAllocationScenarioState,
  selectedAnomalyRef: string | null | undefined,
): string {
  if (selectedAnomalyRef && baseBottlenecks.some((row) => row.anomalyRef === selectedAnomalyRef)) {
    return selectedAnomalyRef;
  }
  return defaultAllocationAnomalyForLens(routeLens, scenarioState);
}

export function createOpsAllocationProjection(
  routeLens: OpsAllocationRouteLens,
  scenarioStateInput: OpsAllocationScenarioState | string | null | undefined = "normal",
  selectedAnomalyRefInput?: string | null,
): OpsAllocationProjection {
  const scenarioState = normalizeOpsAllocationScenarioState(scenarioStateInput);
  const selectedAnomalyRef = createSelectedAnomalyRef(
    routeLens,
    scenarioState,
    selectedAnomalyRefInput,
  );
  const ladder = createLadder(routeLens, scenarioState, selectedAnomalyRef);
  const selectedRow =
    ladder.find((row) => row.anomalyRef === selectedAnomalyRef) ??
    ladder.find(
      (row) => row.anomalyRef === defaultAllocationAnomalyForLens(routeLens, scenarioState),
    ) ??
    ladder[0]!;
  const capacityRows = createCapacityRows(
    routeLens,
    scenarioState,
    selectedRow.actionEligibilityState,
  );
  const cohortRows = createCohortRows(scenarioState);
  const interventionCandidates = createInterventionCandidates(selectedRow, scenarioState);
  const selectedIntervention = interventionCandidates.find((candidate) => candidate.selected)!;
  const boardStateDigestRef = `OASD_451_${sanitizeRef(routeLens)}_${sanitizeRef(scenarioState)}_${sanitizeRef(selectedRow.anomalyRef)}`;
  const boardTupleHash = `ops-allocation-tuple-451-${routeLens}-${scenarioState}-${selectedRow.anomalyRef}`;
  const selectedEntityTupleHash = `ops-allocation-selected-451-${selectedRow.anomalyRef}-${scenarioState}`;
  const releaseTrustFreezeVerdictRef =
    scenarioState === "freeze" || scenarioState === "blocked"
      ? "RTFV_451_BLOCKING_FREEZE"
      : "RTFV_451_LIVE_AUTHORITY";
  const settlementStatus = scenarioSettlementStatus(
    scenarioState,
    selectedRow.actionEligibilityState,
  );
  const actionEligibilityFence: OpsActionEligibilityFence = {
    actionEligibilityFenceRef: `OAEF_451_${sanitizeRef(selectedRow.anomalyRef)}_${sanitizeRef(scenarioState)}`,
    eligibilityState: selectedRow.actionEligibilityState,
    reason: eligibilityReason(scenarioState, selectedRow, selectedRow.actionEligibilityState),
    requiredGovernanceHandoff:
      selectedRow.actionEligibilityState === "handoff_required" ||
      selectedRow.actionEligibilityState === "blocked",
    degradedReasonRefs: degradedReasonRefs(scenarioState, selectedRow),
    timeoutRecovery:
      selectedRow.actionEligibilityState === "executable"
        ? "If the lease expires, preserve the selected anomaly and fall back to stale reacquire."
        : "Preserve the selected anomaly, explain the downgrade, and keep governance handoff available.",
    announcedCopy: `Action eligibility is ${selectedRow.actionEligibilityState.replace(/_/g, " ")} for ${selectedRow.anomalyName}.`,
  };
  const candidateLease: InterventionCandidateLease = {
    candidateLeaseId: selectedIntervention.leaseRef,
    candidateRef: selectedIntervention.candidateRef,
    actionScopeRef: selectedIntervention.targetScope,
    sourceSliceEnvelopeRef: selectedRow.sourceSliceEnvelopeRef,
    opsBoardStateSnapshotRef: `OBS_451_${sanitizeRef(selectedRow.anomalyRef)}_${sanitizeRef(scenarioState)}`,
    opsSelectionLeaseRef: `OSL_${sanitizeRef(selectedRow.anomalyRef)}`,
    opsRouteIntentRef: `ORI_451_${sanitizeRef(routeLens)}_${sanitizeRef(selectedRow.anomalyRef)}`,
    opsDeltaGateRef:
      selectedRow.actionEligibilityState === "executable" ? "ODG_LIVE" : "ODG_GUARDED",
    opsReturnTokenRef: `ORT_${sanitizeRef(selectedRow.anomalyRef)}`,
    boardTupleHash,
    selectedEntityTupleHash,
    releaseTrustFreezeVerdictRef,
    governingObjectRef: selectedRow.sourceSliceEnvelopeRef,
    eligibilityState: selectedRow.actionEligibilityState,
    policyBundleRef: "policy-bundle:ops-allocation-governed-relief",
    expiresAt: "2026-04-28T15:30:00Z",
    idempotencyKey: `ops-allocation-451:${routeLens}:${selectedRow.anomalyRef}:${scenarioState}`,
    settlementStatus,
  };
  const scenarioCompare: OpsScenarioCompareProjection = {
    scenarioCompareRef: `OSC_451_${sanitizeRef(routeLens)}_${sanitizeRef(selectedRow.anomalyRef)}`,
    baseSnapshotRef: `OBS_451_${sanitizeRef(selectedRow.anomalyRef)}_BASE`,
    baseBoardTupleHash:
      scenarioState === "settlement_pending"
        ? "ops-allocation-tuple-451-queues-normal-ops-route-07"
        : boardTupleHash,
    currentMetricBasis: "current: queue pressure, capacity minutes, breach-risk cases",
    proposedMetricBasis: "proposed: reviewer delta, protected path routing, guardrail drag",
    impactMetricBasis: "impact: lower-bound relief and displaced-risk preview",
    queuedDriftSummary:
      scenarioState === "normal"
        ? "No queued drift; rank order is frozen while compare is open."
        : `Queued drift is visible as ${scenarioState.replace(/_/g, " ")} without stealing focus.`,
    frozenReason: "OpsDeltaGate freezes the base snapshot and keeps proposed impact separate.",
    rankOrderStable: true,
    focusProtectionFenceRef: `OFPF_451_COMPARE_${sanitizeRef(selectedRow.anomalyRef)}`,
    deltaGateState:
      selectedRow.actionEligibilityState === "executable"
        ? "safe_apply"
        : selectedRow.actionEligibilityState === "blocked"
          ? "blocked"
          : selectedRow.actionEligibilityState === "stale_reacquire"
            ? "stale"
            : "buffered",
  };

  return {
    taskId: OPS_ALLOCATION_TASK_ID,
    schemaVersion: OPS_ALLOCATION_SCHEMA_VERSION,
    routeLens,
    route: routeForAllocationLens(routeLens),
    scenarioState,
    boardScopeRef: OPS_OVERVIEW_BOARD_SCOPE_REF,
    timeHorizon: OPS_OVERVIEW_TIME_HORIZON,
    scopePolicyRef: OPS_OVERVIEW_SCOPE_POLICY_REF,
    shellContinuityKey: OPS_OVERVIEW_SHELL_CONTINUITY_KEY,
    boardStateDigestRef,
    boardTupleHash,
    selectedAnomalyRef: selectedRow.anomalyRef,
    selectedEntityTupleHash,
    sourceSliceEnvelopeRef: selectedRow.sourceSliceEnvelopeRef,
    releaseTrustFreezeVerdictRef,
    bottleneckLadder: ladder,
    capacityRows,
    cohortRows,
    interventionCandidates,
    selectedIntervention,
    candidateLease,
    actionEligibilityFence,
    scenarioCompare,
    surfaceSummary:
      selectedRow.actionEligibilityState === "executable"
        ? "Ranked allocation is live for the selected anomaly, with lease-bound intervention controls."
        : "Ranked allocation remains visible, but the action plane is downgraded in place until authority recovers.",
    sourceAlgorithmRefs,
    upstreamSchemaVersions,
  };
}

export function createOpsAllocationFixture() {
  const scenarioProjections = Object.fromEntries(
    (["queues", "capacity"] as const).map((routeLens) => [
      routeLens,
      Object.fromEntries(
        opsAllocationScenarioStates.map((scenarioState) => [
          scenarioState,
          createOpsAllocationProjection(routeLens, scenarioState),
        ]),
      ),
    ]),
  ) as Record<OpsAllocationRouteLens, Record<OpsAllocationScenarioState, OpsAllocationProjection>>;

  return {
    taskId: OPS_ALLOCATION_TASK_ID,
    schemaVersion: OPS_ALLOCATION_SCHEMA_VERSION,
    routes: ["/ops/queues", "/ops/capacity"] as const,
    sourceAlgorithmRefs,
    upstreamSchemaVersions,
    automationAnchors: opsAllocationAutomationAnchors,
    scenarioProjections,
  };
}
