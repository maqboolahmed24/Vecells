import {
  createInitialContinuitySnapshot,
  createUiTelemetryEnvelope,
  getPersistentShellRouteClaim,
  navigateWithinShell,
  selectAnchorInSnapshot,
  type ContinuitySnapshot,
  type RuntimeScenario,
  type UiTelemetryEnvelopeExample,
  type UiTelemetryEventClass,
} from "@vecells/persistent-shell";
import { resolvePharmacyProductMergePreviewForOpsAnomaly } from "../../../packages/domains/pharmacy/src/phase6-pharmacy-product-merge-preview";
import {
  createOpsOverviewProjection,
  defaultAnomalyIdForOverviewState,
  defaultHealthCellForOverviewState,
  deltaGateStateForOverviewState,
  normalizeOpsOverviewScenarioState,
  type OpsOverviewFreshnessStrip,
  type OpsOverviewNorthStarMetric,
  type OpsOverviewProjection,
  type OpsOverviewScenarioState,
  type OpsOverviewServiceHealthCell,
  type OpsStableServiceDigest,
} from "./operations-overview-phase9.model";
import {
  createOpsAllocationProjection,
  type OpsActionEligibilityState,
  type OpsAllocationProjection,
  type OpsAllocationRouteLens,
} from "./operations-allocation-phase9.model";
import {
  createOpsAssuranceProjection,
  type OpsAssuranceExportControlState,
  type OpsAssuranceProjection,
} from "./operations-assurance-phase9.model";
import {
  createComplianceLedgerProjection,
  type ComplianceLedgerProjection,
} from "./compliance-ledger-phase9.model";
import {
  createCrossPhaseConformanceScorecardProjection,
  type BAUSignoffActionState,
  type ConformanceScorecardScenarioState,
  type CrossPhaseConformanceScorecardProjection,
} from "./conformance-scorecard-phase9.model";
import {
  createOpsIncidentsProjection,
  type OpsIncidentActionControlState,
  type OpsIncidentsProjection,
} from "./operations-incidents-phase9.model";
import {
  createOpsInvestigationProjection,
  type OpsInvestigationOriginLens,
  type OpsInvestigationProjection,
} from "./operations-investigation-phase9.model";
import {
  createOpsResilienceProjection,
  type OpsRecoveryControlState,
  type OpsResilienceProjection,
} from "./operations-resilience-phase9.model";

export const OPS_SHELL_TASK_ID = "par_117";
export const OPS_SHELL_VISUAL_MODE = "Operations_Shell_Seed_Routes";
export const OPS_SOURCE_SURFACE = "posture_gallery";
export const OPS_TELEMETRY_SCENARIO_ID = "SCN_POSTURE_GALLERY_OPERATIONS_RECOVERY";
export const OPS_DEFAULT_PATH = "/ops/overview";
export const OPS_SHELL_SLUG = "ops-console";

export type OpsLens =
  | "overview"
  | "queues"
  | "capacity"
  | "dependencies"
  | "audit"
  | "assurance"
  | "conformance"
  | "incidents"
  | "resilience";
export type OpsChildRouteKind = "investigations" | "interventions" | "compare" | "health";
export type OpsRouteFamilyRef = "rf_operations_board" | "rf_operations_drilldown";
export type OpsDeltaGateState = "live" | "buffered" | "stale" | "table_only";
export type OpsSeverity = "watch" | "caution" | "critical";
export type OpsFenceState = "live" | "buffered_hold" | "observe_only" | "frozen";
export type OpsVisualizationMode = "chart_plus_table" | "summary_only" | "table_only";
export type OpsBoardFrameMode = "two_plane" | "three_plane" | "mission_stack";

export interface OpsLocation {
  pathname: string;
  lens: OpsLens;
  routeFamilyRef: OpsRouteFamilyRef;
  childRouteKind: OpsChildRouteKind | null;
  opsRouteIntentId: string | null;
}

export type { OpsOverviewScenarioState } from "./operations-overview-phase9.model";
export type OpsNorthStarMetric = OpsOverviewNorthStarMetric;
export type OpsServiceHealthRow = OpsOverviewServiceHealthCell;

export interface OpsCohortImpactRow {
  cohortRef: string;
  cohortLabel: string;
  variance: string;
  direction: "up" | "flat" | "down";
  summary: string;
}

export interface OpsAnomaly {
  anomalyId: string;
  lens: OpsLens;
  title: string;
  severity: OpsSeverity;
  queuePressure: number;
  capacityGap: number;
  summary: string;
  trustSummary: string;
  evidenceBasis: string;
  continuityQuestion: string;
  promotedSurfaceRef:
    | "BottleneckRadar"
    | "CapacityAllocator"
    | "ServiceHealthGrid"
    | "CohortImpactMatrix";
  recommendedAction: string;
  confidenceLabel: string;
  blockerSummary: string;
  eligibilityFenceState: OpsFenceState;
  compareSummary: string;
  healthSummary: string;
  ownerLabel: string;
  cohortFocus: string;
  timeHorizon: string;
  governanceHandoffLabel: string;
  gapRefs: readonly string[];
}

export interface OpsSelectionLease {
  leaseId: string;
  anomalyId: string;
  promotedSurfaceRef: OpsAnomaly["promotedSurfaceRef"];
  leaseState: "active" | "held" | "frozen";
  promotionLockReason: "none" | "delta_buffered" | "stale_truth" | "table_only_parity";
  continuityKey: string;
  boardTupleHash: string;
  selectedHealthCellRef: string;
  selectedHealthCellTupleHash: string;
  actionEligibilityState: OpsFenceState;
  expiresAt: string;
}

export interface OpsDeltaGate {
  deltaGateId: string;
  gateState: OpsDeltaGateState;
  summary: string;
  freshnessState: "fresh" | "buffered" | "stale";
  visualizationMode: OpsVisualizationMode;
  trustState: "authoritative" | "guarded" | "diagnostic_only";
  blockedMutation: boolean;
}

export interface OpsReturnToken {
  returnTokenId: string;
  originPath: string;
  selectedAnomalyId: string;
  selectedHealthCellRef: string;
  lens: OpsLens;
  timeHorizon: string;
  boardScopeRef: string;
  scopePolicyRef: string;
  shellContinuityKey: string;
  boardStateDigestRef: string;
  boardTupleHash: string;
  freshnessState: string;
  focusAnchorRef: string;
  scrollAnchorRef: string;
  issuedAt: string;
  expiresAt: string;
}

export interface OpsRouteIntent {
  opsRouteIntentId: string;
  routeKind: OpsChildRouteKind;
  title: string;
  question: string;
  evidenceBasis: string;
  returnTokenRef: string;
}

export interface OpsGovernanceHandoff {
  handoffId: string;
  title: string;
  summary: string;
  launchLabel: string;
  returnToken: OpsReturnToken;
  gapRefs: readonly string[];
}

export interface OpsBoardStateSnapshot {
  snapshotId: string;
  location: OpsLocation;
  overviewState: OpsOverviewScenarioState;
  overviewProjection: OpsOverviewProjection;
  allocationProjection: OpsAllocationProjection;
  assuranceProjection: OpsAssuranceProjection;
  complianceLedgerProjection: ComplianceLedgerProjection;
  conformanceProjection: CrossPhaseConformanceScorecardProjection;
  incidentsProjection: OpsIncidentsProjection;
  investigationProjection: OpsInvestigationProjection;
  resilienceProjection: OpsResilienceProjection;
  shellContinuityKey: string;
  boardStateDigestRef: string;
  boardTupleHash: string;
  boardScopeRef: string;
  timeHorizon: string;
  scopePolicyRef: string;
  selectedHealthCell: OpsServiceHealthRow;
  selectedHealthCellRef: string;
  selectedAnomaly: OpsAnomaly;
  anomalyRanking: readonly OpsAnomaly[];
  northStarBand: readonly OpsNorthStarMetric[];
  selectionLease: OpsSelectionLease;
  deltaGate: OpsDeltaGate;
  returnToken: OpsReturnToken | null;
  routeIntent: OpsRouteIntent | null;
  governanceHandoff: OpsGovernanceHandoff | null;
  serviceHealth: readonly OpsServiceHealthRow[];
  freshnessStrip: OpsOverviewFreshnessStrip;
  stableServiceDigest: OpsStableServiceDigest | null;
  cohortImpact: readonly OpsCohortImpactRow[];
  frameMode: OpsBoardFrameMode;
  workbenchState: OpsFenceState;
  visualizationMode: OpsVisualizationMode;
  summarySentence: string;
}

export interface OpsShellState {
  location: OpsLocation;
  continuitySnapshot: ContinuitySnapshot;
  selectedAnomalyId: string;
  selectedHealthCellRef: string;
  overviewState: OpsOverviewScenarioState;
  deltaGateState: OpsDeltaGateState;
  returnToken: OpsReturnToken | null;
  governanceHandoff: OpsGovernanceHandoff | null;
  runtimeScenario: RuntimeScenario;
  telemetry: readonly UiTelemetryEnvelopeExample[];
}

export interface OpsMockProjectionExample {
  exampleId: string;
  path: string;
  deltaGateState: OpsDeltaGateState;
  summary: string;
  selectedAnomalyId: string;
  childRouteKind: OpsChildRouteKind | null;
}

export interface OpsRouteContractSeedRow {
  path: string;
  routeFamilyRef: OpsRouteFamilyRef;
  lens: OpsLens;
  childRouteKind: OpsChildRouteKind | null;
  continuityKey: string;
  selectedAnchorPolicy: string;
  summary: string;
}

export interface OpsAnomalyMatrixRow {
  anomalyId: string;
  severity: OpsSeverity;
  lens: OpsLens;
  fenceState: OpsFenceState;
  recommendedAction: string;
  governanceStub: string;
  gapRefs: readonly string[];
}

export const opsLensOrder: readonly OpsLens[] = [
  "overview",
  "queues",
  "capacity",
  "dependencies",
  "audit",
  "assurance",
  "conformance",
  "incidents",
  "resilience",
] as const;

export const opsChildRouteOrder: readonly OpsChildRouteKind[] = [
  "investigations",
  "interventions",
  "compare",
  "health",
] as const;

const opsBoardClaim = getPersistentShellRouteClaim("rf_operations_board");
const opsDrilldownClaim = getPersistentShellRouteClaim("rf_operations_drilldown");
const pharmacyUrgentReturnOpsMerge =
  resolvePharmacyProductMergePreviewForOpsAnomaly("ops-route-pharmacy-2103");

export const opsAnomalies: readonly OpsAnomaly[] = [
  {
    anomalyId: "ops-route-pharmacy-2103",
    lens: "overview",
    title:
      pharmacyUrgentReturnOpsMerge?.ops.title ??
      "PHC-2103 urgent return reopened the original request",
    severity: "critical",
    queuePressure: 99,
    capacityGap: 10,
    summary:
      pharmacyUrgentReturnOpsMerge?.ops.summary ??
      "PHC-2103 has reopened the urgent-return request with one confirmed history across triage, patient messaging, and pharmacy recovery.",
    trustSummary:
      "The same urgent-return history now feeds ops, request detail, patient messages, and pharmacy recovery without a second local status copy.",
    evidenceBasis:
      pharmacyUrgentReturnOpsMerge?.supportReplaySummary ??
      "Bounce-back status, request-anchor preservation, and pharmacy recovery all point at one reopened history chain.",
    continuityQuestion:
      "Which team should resume the reopened request first without dropping the urgent-return proof, patient-safe messaging, or pharmacy recovery context?",
    promotedSurfaceRef: "BottleneckRadar",
    recommendedAction:
      "Resume the urgent-return request from the preserved anchor, keep PHC-2103 visible in operations, and route urgent review through the same recovery process.",
    confidenceLabel: "0.86 confidence / urgent-return history bound",
    blockerSummary:
      "Do not calm, archive, or silently reroute the request while urgent-return review, pharmacy recovery, and GP-action evidence remain open.",
    eligibilityFenceState: "live",
    compareSummary:
      pharmacyUrgentReturnOpsMerge?.reentrySummary ??
      "Compare the reopened request anchor against the bounce-back evidence chain before any closure or reassignment decision.",
    healthSummary:
      pharmacyUrgentReturnOpsMerge?.patientNotification.body ??
      "Urgent-return status remains visibly non-calm across patient and staff surfaces until the reopened work is resolved.",
    ownerLabel: "Pharmacy loop operations",
    cohortFocus: "Urgent return / reopened request cohort",
    timeHorizon: "Now",
    governanceHandoffLabel: "Launch urgent-return coordination note",
    gapRefs: [],
  },
  {
    anomalyId: "ops-route-07",
    lens: "queues",
    title: "Backlog surge in referral confirmation",
    severity: "critical",
    queuePressure: 97,
    capacityGap: 18,
    summary:
      "Referral confirmation wait time is climbing faster than staffed review lanes can drain it.",
    trustSummary:
      "Authoritative queue details are current, but the next relief action is gated by live staffing confirmation.",
    evidenceBasis:
      "Queue pressure, confirmation dwell, and replay-safe continuity evidence agree on one blocked lane.",
    continuityQuestion:
      "Which confirmation lane can absorb relief without dropping the currently selected backlog proof basis?",
    promotedSurfaceRef: "BottleneckRadar",
    recommendedAction:
      "Shift two confirmation reviewers into the priority repair lane for the next 90 minutes.",
    confidenceLabel: "0.82 confidence / guardrails green",
    blockerSummary:
      "Requires staffing details to stay live and release freeze to remain scoped away from queue rebalancing.",
    eligibilityFenceState: "live",
    compareSummary:
      "Compare queue growth against the preserved 06:00 baseline and the latest delta digest.",
    healthSummary:
      "Confirmation essential function is degraded but still serviceable if relief lands in the current window.",
    ownerLabel: "Operations queue control",
    cohortFocus: "High-priority referral cohort",
    timeHorizon: "90m",
    governanceHandoffLabel: "Launch staffing allocation note in governance",
    gapRefs: ["GAP_FUTURE_OPS_METRIC_QUEUE_DENSITY_V1"],
  },
  {
    anomalyId: "ops-route-04",
    lens: "dependencies",
    title: "Supplier dependency degradation on outbound confirmations",
    severity: "critical",
    queuePressure: 81,
    capacityGap: 9,
    summary:
      "Delivery acknowledgements from the outbound supplier are intermittently late, expanding the retry lane.",
    trustSummary:
      "Dependency watch details are buffered; summary stays confirmed but the action plane is guarded until the parity lane settles.",
    evidenceBasis:
      "Supplier watch, outbound cache lag, and intervention guardrail details still agree on the degradation boundary.",
    continuityQuestion:
      "Can the team reduce user-facing lag without overclaiming a recovered supplier state?",
    promotedSurfaceRef: "ServiceHealthGrid",
    recommendedAction:
      "Hold non-essential outbound retries and route only priority confirmations through the protected path.",
    confidenceLabel: "0.74 confidence / dependency guardrail active",
    blockerSummary:
      "Automatic replay remains blocked while supplier ambiguity and cache freshness stay above the bound.",
    eligibilityFenceState: "buffered_hold",
    compareSummary:
      "Compare supplier latency drift against the last fully published runtime publication bundle.",
    healthSummary:
      "Notification delivery function is degraded and must present table-first status if parity drops further.",
    ownerLabel: "Runtime dependency watch",
    cohortFocus: "Outbound notification cohort",
    timeHorizon: "2h",
    governanceHandoffLabel: "Launch supplier watch memo in governance",
    gapRefs: ["GAP_FUTURE_OPS_METRIC_DEPENDENCY_TRACES_V1"],
  },
  {
    anomalyId: "ops-route-12",
    lens: "audit",
    title: "Continuity breakage in evidence replay",
    severity: "critical",
    queuePressure: 62,
    capacityGap: 5,
    summary:
      "The replay chain can still show preserved proof, but the newest continuity slice no longer joins cleanly to the active watch details.",
    trustSummary:
      "Current board symptoms are visible, yet the preserved proof basis is older and must be named before any action status upgrades.",
    evidenceBasis:
      "Continuity evidence slice, replay history, and audit details disagree on the newest checkpoint only.",
    continuityQuestion:
      "What changed after the preserved proof basis, and does the action plane stay diagnostic-only until that drift is explained?",
    promotedSurfaceRef: "BottleneckRadar",
    recommendedAction:
      "Freeze promoted action state, open investigation mode, and preserve the current proof basis for compare.",
    confidenceLabel: "0.91 confidence / action fence frozen",
    blockerSummary:
      "Intervention is blocked until replay history and continuity evidence settle on the same checkpoint.",
    eligibilityFenceState: "frozen",
    compareSummary:
      "Side-by-side preserved proof vs live delta is required; silent rebasing is forbidden.",
    healthSummary:
      "Continuity control envelope is blocked for calm status, but evidence remains readable.",
    ownerLabel: "Continuity evidence control",
    cohortFocus: "Cross-surface continuity ledger",
    timeHorizon: "4h",
    governanceHandoffLabel: "Launch continuity review package in governance",
    gapRefs: ["GAP_FUTURE_OPS_CHILD_ROUTE_CONTINUITY_GRAPH_V1"],
  },
  {
    anomalyId: "ops-route-09",
    lens: "assurance",
    title: "Confirmation drift between assurance slice and board summary",
    severity: "caution",
    queuePressure: 48,
    capacityGap: 4,
    summary:
      "Assurance confirms the current mitigation outcome, but the board summary is still carrying an older watch explanation.",
    trustSummary:
      "Publication parity is exact enough for read-only review, but board calmness cannot upgrade until the slice rebinding lands.",
    evidenceBasis:
      "Assurance slice, board summary, and release publication agree on the mitigation result but not the visible narrative.",
    continuityQuestion:
      "Which surface needs rebinding so the operator can trust one settled explanation again?",
    promotedSurfaceRef: "CohortImpactMatrix",
    recommendedAction:
      "Re-publish the assurance-backed summary bundle and keep intervention status observe-only meanwhile.",
    confidenceLabel: "0.69 confidence / assurance rebinding pending",
    blockerSummary:
      "Summary calmness is suppressed until the board explanation and slice details realign.",
    eligibilityFenceState: "observe_only",
    compareSummary:
      "Compare assurance-backed and board-local narratives instead of the underlying outcome.",
    healthSummary: "Assurance function is stable; only the shell explanation is drifted.",
    ownerLabel: "Assurance publication steward",
    cohortFocus: "Settled mitigation cohort",
    timeHorizon: "6h",
    governanceHandoffLabel: "Launch publication drift note in governance",
    gapRefs: ["GAP_FUTURE_OPS_METRIC_ASSURANCE_DRILL_DENSITY_V1"],
  },
  {
    anomalyId: "ops-route-15",
    lens: "incidents",
    title: "Release freeze spillover into manual relief planning",
    severity: "critical",
    queuePressure: 55,
    capacityGap: 12,
    summary:
      "The current release freeze is correctly blocking automated relief, but operators still need a bounded manual plan.",
    trustSummary:
      "Runtime freeze verdict is authoritative; the workbench must look intentionally frozen, not secretly commit-ready.",
    evidenceBasis:
      "Release watch details, runtime freeze verdict, and affected service-health rows agree on the freeze boundary.",
    continuityQuestion: "What relief options remain lawful while the freeze stays active?",
    promotedSurfaceRef: "CapacityAllocator",
    recommendedAction:
      "Prepare the manual fallback package and keep every execution step fenced behind governance handoff.",
    confidenceLabel: "0.88 confidence / release freeze active",
    blockerSummary:
      "All automated relief remains blocked until freeze verdict clears or governance opens an exception lane.",
    eligibilityFenceState: "frozen",
    compareSummary:
      "Compare frozen release status against the last pre-freeze admissible action set.",
    healthSummary:
      "Affected essential functions are guarded, not healthy, even where customer impact is currently low.",
    ownerLabel: "Release watch coordinator",
    cohortFocus: "Freeze-affected service cluster",
    timeHorizon: "12h",
    governanceHandoffLabel: "Open release-freeze review",
    gapRefs: ["GAP_BOUNDARY_OPS_GOV_HANDOFF_RELEASE_EXCEPTION_V1"],
  },
  {
    anomalyId: "ops-route-18",
    lens: "resilience",
    title: "Restore debt rising above rehearsal coverage",
    severity: "caution",
    queuePressure: 33,
    capacityGap: 7,
    summary:
      "Restore readiness is still serviceable, but rehearsal debt is now wider than the preferred confidence band.",
    trustSummary:
      "Operational readiness details are current, yet the board must keep mitigation authority modest until coverage improves.",
    evidenceBasis:
      "Restore rehearsal outcomes, backup-set manifests, and readiness snapshots agree on the debt window.",
    continuityQuestion:
      "Which recovery tier needs rehearsal before the shell can show more confidence?",
    promotedSurfaceRef: "ServiceHealthGrid",
    recommendedAction:
      "Schedule the next limited restore rehearsal and keep workbench status observe-only until it settles.",
    confidenceLabel: "0.63 confidence / rehearsal debt open",
    blockerSummary:
      "Recovery control status suppresses stronger action authority until rehearsal coverage rises.",
    eligibilityFenceState: "observe_only",
    compareSummary:
      "Compare current readiness against the last green rehearsal tier, not against ideal target state alone.",
    healthSummary: "Recovery status is guarded but not blocked.",
    ownerLabel: "Resilience baseline steward",
    cohortFocus: "Tier-2 recovery map",
    timeHorizon: "24h",
    governanceHandoffLabel: "Open resilience debt review",
    gapRefs: ["GAP_FUTURE_OPS_CHILD_ROUTE_RESILIENCE_PACK_V1"],
  },
  {
    anomalyId: "ops-route-21",
    lens: "dependencies",
    title: "Supplier ambiguity on partner-origin acknowledgements",
    severity: "watch",
    queuePressure: 24,
    capacityGap: 3,
    summary:
      "Partner-origin acknowledgements are inconsistent enough to merit watch status but not promotion above active blockers.",
    trustSummary:
      "The watch details are current and quiet; this stays in low-noise status until it crosses the promotion fence.",
    evidenceBasis:
      "Partner acknowledgement audit rows and outbound retry summaries both show ambiguity without current breach-risk.",
    continuityQuestion:
      "What would move this watchpoint into a promoted anomaly, and what should stay merely visible?",
    promotedSurfaceRef: "CohortImpactMatrix",
    recommendedAction:
      "Keep the watch visible, expand the compare slice only if variance persists through the next observation window.",
    confidenceLabel: "0.58 confidence / watch status only",
    blockerSummary:
      "No manual intervention yet; the lane remains observe-only until variance persists.",
    eligibilityFenceState: "observe_only",
    compareSummary:
      "Compare the partner watchpoint only against the current observation band, not against hard-failure details.",
    healthSummary:
      "Supplier cohort remains watch-level and should not dominate the board by default.",
    ownerLabel: "Partner dependency watch",
    cohortFocus: "Partner-origin acknowledgement cohort",
    timeHorizon: "8h",
    governanceHandoffLabel: "Launch supplier-ambiguity note",
    gapRefs: ["GAP_FUTURE_OPS_METRIC_PARTNER_ACK_DETAIL_V1"],
  },
] as const;

export const opsNorthStarBand: readonly OpsNorthStarMetric[] =
  createOpsOverviewProjection("normal").northStarBand;

export const opsServiceHealthRows: readonly OpsServiceHealthRow[] =
  createOpsOverviewProjection("normal").serviceHealth;

export const opsCohortImpactRows: readonly OpsCohortImpactRow[] = [
  {
    cohortRef: "cohort_pharmacy_reentry",
    cohortLabel: "Urgent pharmacy re-entry",
    variance: "+1 reopened",
    direction: "up",
    summary:
      pharmacyUrgentReturnOpsMerge?.changedSinceSeenLabel ??
      "Urgent return reopened the original request anchor and raised a new changed-since-seen event.",
  },
  {
    cohortRef: "cohort_referrals",
    cohortLabel: "Priority referrals",
    variance: "+14%",
    direction: "up",
    summary: "Queue delay is concentrated in the priority referral cohort.",
  },
  {
    cohortRef: "cohort_notifications",
    cohortLabel: "Outbound confirmations",
    variance: "-7%",
    direction: "down",
    summary: "Supplier lag is suppressing delivery throughput.",
  },
  {
    cohortRef: "cohort_recovery",
    cohortLabel: "Restore-ready tiers",
    variance: "Flat",
    direction: "flat",
    summary: "Readiness remains stable, but rehearsal debt is visible.",
  },
] as const;

function normalizeLens(value: string | undefined): OpsLens {
  return opsLensOrder.includes((value ?? "") as OpsLens) ? (value as OpsLens) : "overview";
}

function normalizeChildRoute(value: string | undefined): OpsChildRouteKind | null {
  return opsChildRouteOrder.includes((value ?? "") as OpsChildRouteKind)
    ? (value as OpsChildRouteKind)
    : null;
}

export function rootPathForOpsLens(lens: OpsLens): string {
  return `/ops/${lens}`;
}

export function childPathForOpsIntent(
  lens: OpsLens,
  childRouteKind: OpsChildRouteKind,
  opsRouteIntentId: string,
): string {
  return `/ops/${lens}/${childRouteKind}/${opsRouteIntentId}`;
}

export function parseOpsPath(pathname: string): OpsLocation {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] !== "ops") {
    return {
      pathname: OPS_DEFAULT_PATH,
      lens: "overview",
      routeFamilyRef: "rf_operations_board",
      childRouteKind: null,
      opsRouteIntentId: null,
    };
  }

  const lens = normalizeLens(segments[1]);
  const childRouteKind = normalizeChildRoute(segments[2]);
  const opsRouteIntentId = childRouteKind ? (segments[3] ?? null) : null;
  return {
    pathname: childRouteKind && opsRouteIntentId ? pathname : rootPathForOpsLens(lens),
    lens,
    routeFamilyRef: childRouteKind ? "rf_operations_drilldown" : "rf_operations_board",
    childRouteKind,
    opsRouteIntentId,
  };
}

export function anomalyForId(anomalyId: string | null | undefined): OpsAnomaly | null {
  return opsAnomalies.find((anomaly) => anomaly.anomalyId === anomalyId) ?? null;
}

export function anchorKeyForAnomaly(anomaly: OpsAnomaly): string {
  switch (anomaly.promotedSurfaceRef) {
    case "ServiceHealthGrid":
      return "board-health";
    case "CapacityAllocator":
    case "BottleneckRadar":
    case "CohortImpactMatrix":
    default:
      return anomaly.eligibilityFenceState === "live" ? "board-intervention" : "board-watch";
  }
}

function severityWeight(severity: OpsSeverity): number {
  switch (severity) {
    case "critical":
      return 3;
    case "caution":
      return 2;
    case "watch":
      return 1;
  }
}

function deltaPenalty(deltaGateState: OpsDeltaGateState): number {
  switch (deltaGateState) {
    case "live":
      return 0;
    case "buffered":
      return 2;
    case "stale":
      return 5;
    case "table_only":
      return 3;
  }
}

export function rankOpsAnomalies(
  lens: OpsLens,
  deltaGateState: OpsDeltaGateState,
): readonly OpsAnomaly[] {
  return [...opsAnomalies].sort((left, right) => {
    const leftLensBonus = left.lens === lens || lens === "overview" ? 3 : 0;
    const rightLensBonus = right.lens === lens || lens === "overview" ? 3 : 0;
    const leftScore =
      severityWeight(left.severity) * 100 +
      leftLensBonus * 10 +
      left.queuePressure -
      deltaPenalty(deltaGateState);
    const rightScore =
      severityWeight(right.severity) * 100 +
      rightLensBonus * 10 +
      right.queuePressure -
      deltaPenalty(deltaGateState);
    return rightScore - leftScore;
  });
}

export function resolveSelectedOpsAnomalyId(
  lens: OpsLens,
  currentAnomalyId: string | null | undefined,
  deltaGateState: OpsDeltaGateState,
): string {
  if (anomalyForId(currentAnomalyId)) {
    return currentAnomalyId!;
  }
  return rankOpsAnomalies(lens, deltaGateState)[0]?.anomalyId ?? opsAnomalies[0]!.anomalyId;
}

export function createOpsDeltaGate(deltaGateState: OpsDeltaGateState): OpsDeltaGate {
  switch (deltaGateState) {
    case "live":
      return {
        deltaGateId: "ODG_LIVE",
        gateState: "live",
        summary:
          "Live updates may refresh secondary summaries, but the promoted anomaly lease remains pinned.",
        freshnessState: "fresh",
        visualizationMode: "chart_plus_table",
        trustState: "authoritative",
        blockedMutation: false,
      };
    case "buffered":
      return {
        deltaGateId: "ODG_BUFFERED",
        gateState: "buffered",
        summary:
          "New deltas are buffered into a digest so the selected anomaly is not stolen mid-analysis.",
        freshnessState: "buffered",
        visualizationMode: "chart_plus_table",
        trustState: "guarded",
        blockedMutation: true,
      };
    case "stale":
      return {
        deltaGateId: "ODG_STALE",
        gateState: "stale",
        summary:
          "The board preserves the last safe explanation and freezes the action plane until freshness recovers.",
        freshnessState: "stale",
        visualizationMode: "summary_only",
        trustState: "diagnostic_only",
        blockedMutation: true,
      };
    case "table_only":
      return {
        deltaGateId: "ODG_TABLE_ONLY",
        gateState: "table_only",
        summary:
          "Visualization parity has degraded, so every evidence panel falls back to table-first status.",
        freshnessState: "buffered",
        visualizationMode: "table_only",
        trustState: "guarded",
        blockedMutation: true,
      };
  }
}

export function createOpsSelectionLease(
  anomaly: OpsAnomaly,
  deltaGateState: OpsDeltaGateState,
  overviewProjection: OpsOverviewProjection = createOpsOverviewProjection("normal"),
  actionEligibilityState: OpsFenceState = anomaly.eligibilityFenceState,
): OpsSelectionLease {
  return {
    leaseId: `OSL_${anomaly.anomalyId.toUpperCase()}`,
    anomalyId: anomaly.anomalyId,
    promotedSurfaceRef: anomaly.promotedSurfaceRef,
    leaseState:
      deltaGateState === "live" ? "active" : deltaGateState === "buffered" ? "held" : "frozen",
    promotionLockReason:
      deltaGateState === "live"
        ? "none"
        : deltaGateState === "buffered"
          ? "delta_buffered"
          : deltaGateState === "stale"
            ? "stale_truth"
            : "table_only_parity",
    continuityKey: opsBoardClaim.continuityKey,
    boardTupleHash: overviewProjection.boardTupleHash,
    selectedHealthCellRef: overviewProjection.selectedHealthCellRef,
    selectedHealthCellTupleHash: overviewProjection.selectedHealthCellTupleHash,
    actionEligibilityState,
    expiresAt: "2026-04-14T13:45:00Z",
  };
}

export function createOpsReturnToken(
  location: OpsLocation,
  anomaly: OpsAnomaly,
  overviewProjection: OpsOverviewProjection = createOpsOverviewProjection("normal"),
): OpsReturnToken {
  return {
    returnTokenId: `ORT_${anomaly.anomalyId.toUpperCase()}`,
    originPath:
      location.routeFamilyRef === "rf_operations_board"
        ? location.pathname
        : rootPathForOpsLens(location.lens),
    selectedAnomalyId: anomaly.anomalyId,
    selectedHealthCellRef: overviewProjection.selectedHealthCellRef,
    lens: location.lens,
    timeHorizon: overviewProjection.timeHorizon,
    boardScopeRef: overviewProjection.boardScopeRef,
    scopePolicyRef: overviewProjection.scopePolicyRef,
    shellContinuityKey: overviewProjection.shellContinuityKey,
    boardStateDigestRef: overviewProjection.boardStateDigestRef,
    boardTupleHash: overviewProjection.boardTupleHash,
    freshnessState: overviewProjection.freshnessStrip.freshnessState,
    focusAnchorRef: overviewProjection.returnFocusAnchorRef,
    scrollAnchorRef: "ops-service-health-grid",
    issuedAt: "2026-04-14T13:00:00Z",
    expiresAt: "2026-04-14T13:45:00Z",
  };
}

export function createOpsRouteIntent(
  location: OpsLocation,
  anomaly: OpsAnomaly,
  returnToken: OpsReturnToken,
): OpsRouteIntent | null {
  if (!location.childRouteKind) {
    return null;
  }
  return {
    opsRouteIntentId: anomaly.anomalyId,
    routeKind: location.childRouteKind,
    title: `${location.childRouteKind} / ${anomaly.title}`,
    question: anomaly.continuityQuestion,
    evidenceBasis: anomaly.evidenceBasis,
    returnTokenRef: returnToken.returnTokenId,
  };
}

export function createOpsGovernanceHandoff(
  anomaly: OpsAnomaly,
  returnToken: OpsReturnToken,
): OpsGovernanceHandoff {
  return {
    handoffId: `OGH_${anomaly.anomalyId.toUpperCase()}`,
    title: "Governance handoff ready for review",
    summary:
      "This handoff keeps the current anomaly context available while governance reviews the next action.",
    launchLabel: anomaly.governanceHandoffLabel,
    returnToken,
    gapRefs: ["GAP_BOUNDARY_OPS_GOV_HANDOFF_REVIEW_STUB_V1", ...anomaly.gapRefs],
  };
}

export function createOpsTelemetryEnvelope(
  routeFamilyRef: OpsRouteFamilyRef,
  eventClass: UiTelemetryEventClass,
  payload: Record<string, string | number | boolean | null>,
  surfaceState?: {
    selectedAnchorRef?: string;
    dominantActionRef?: string;
    focusRestoreRef?: string;
    artifactModeState?: string;
    recoveryPosture?: "live" | "read_only" | "recovery_only" | "blocked";
    visualizationAuthority?: "visual_table_summary" | "table_only" | "summary_only";
    routeShellPosture?: string;
  },
): UiTelemetryEnvelopeExample {
  const normalizedPayload = Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [key, String(value ?? "")]),
  );
  return createUiTelemetryEnvelope({
    scenarioId: OPS_TELEMETRY_SCENARIO_ID,
    routeFamilyRef,
    sourceSurface: OPS_SOURCE_SURFACE,
    eventClass,
    payload: normalizedPayload,
    surfaceState: surfaceState
      ? {
          selectedAnchorRef: surfaceState.selectedAnchorRef,
          dominantActionRef: surfaceState.dominantActionRef,
          focusRestoreRef: surfaceState.focusRestoreRef,
          artifactModeState: surfaceState.artifactModeState,
          recoveryPosture: surfaceState.recoveryPosture,
          visualizationAuthority: surfaceState.visualizationAuthority,
          routeShellPosture: surfaceState.routeShellPosture,
        }
      : undefined,
  });
}

function continuitySnapshotForLocation(
  location: OpsLocation,
  anomaly: OpsAnomaly,
): ContinuitySnapshot {
  const routeClaim =
    location.routeFamilyRef === "rf_operations_board" ? opsBoardClaim : opsDrilldownClaim;
  return createInitialContinuitySnapshot({
    shellSlug: OPS_SHELL_SLUG,
    routeFamilyRef: routeClaim.routeFamilyRef,
    anchorKey: anchorKeyForAnomaly(anomaly),
    runtimeScenario: "live",
  });
}

function nextContinuitySnapshot(
  snapshot: ContinuitySnapshot,
  location: OpsLocation,
  anomaly: OpsAnomaly,
): ContinuitySnapshot {
  if (snapshot.activeRouteFamilyRef !== location.routeFamilyRef) {
    return navigateWithinShell(snapshot, location.routeFamilyRef).snapshot;
  }
  const anchorKey = anchorKeyForAnomaly(anomaly);
  if (snapshot.selectedAnchor.anchorKey !== anchorKey) {
    return selectAnchorInSnapshot(snapshot, anchorKey);
  }
  return snapshot;
}

function runtimeScenarioForDeltaGate(deltaGateState: OpsDeltaGateState): RuntimeScenario {
  switch (deltaGateState) {
    case "live":
      return "live";
    case "buffered":
    case "table_only":
      return "read_only";
    case "stale":
      return "recovery_only";
  }
}

function allocationLensForOpsLens(lens: OpsLens): OpsAllocationRouteLens {
  return lens === "capacity" ? "capacity" : "queues";
}

function investigationOriginLensForOpsLens(lens: OpsLens): OpsInvestigationOriginLens {
  switch (lens) {
    case "queues":
    case "capacity":
    case "audit":
    case "overview":
      return lens;
    default:
      return "overview";
  }
}

function workbenchStateForAllocationEligibility(
  eligibilityState: OpsActionEligibilityState,
): OpsFenceState {
  switch (eligibilityState) {
    case "executable":
      return "live";
    case "handoff_required":
      return "buffered_hold";
    case "observe_only":
    case "read_only_recovery":
      return "observe_only";
    case "stale_reacquire":
    case "blocked":
    default:
      return "frozen";
  }
}

function workbenchStateForAssuranceControl(
  controlState: OpsAssuranceExportControlState,
): OpsFenceState {
  switch (controlState) {
    case "live_export":
      return "live";
    case "attestation_required":
      return "observe_only";
    case "diagnostic_only":
    case "recovery_only":
      return "observe_only";
    case "blocked":
    default:
      return "frozen";
  }
}

function workbenchStateForIncidentControl(
  controlState: OpsIncidentActionControlState,
): OpsFenceState {
  switch (controlState) {
    case "live_control":
      return "live";
    case "governed_recovery":
      return "buffered_hold";
    case "diagnostic_only":
      return "observe_only";
    case "blocked":
    default:
      return "frozen";
  }
}

function workbenchStateForRecoveryControl(controlState: OpsRecoveryControlState): OpsFenceState {
  switch (controlState) {
    case "live_control":
      return "live";
    case "diagnostic_only":
      return "observe_only";
    case "governed_recovery":
      return "buffered_hold";
    case "blocked":
    default:
      return "frozen";
  }
}

function workbenchStateForConformanceControl(controlState: BAUSignoffActionState): OpsFenceState {
  switch (controlState) {
    case "ready":
      return "live";
    case "diagnostic_only":
      return "observe_only";
    case "permission_denied":
    case "blocked":
    default:
      return "frozen";
  }
}

function conformanceScenarioForOverviewState(
  overviewState: OpsOverviewScenarioState,
): ConformanceScorecardScenarioState {
  switch (overviewState) {
    case "stale":
    case "degraded":
    case "settlement_pending":
      return "stale";
    case "blocked":
    case "quarantined":
    case "freeze":
      return "blocked";
    case "permission_denied":
      return "permission_denied";
    default:
      return "exact";
  }
}

function stricterWorkbenchState(left: OpsFenceState, right: OpsFenceState): OpsFenceState {
  const order: Record<OpsFenceState, number> = {
    live: 0,
    buffered_hold: 1,
    observe_only: 2,
    frozen: 3,
  };
  return order[right] > order[left] ? right : left;
}

export function createInitialOpsShellState(
  pathname: string = OPS_DEFAULT_PATH,
  options: {
    deltaGateState?: OpsDeltaGateState;
    selectedAnomalyId?: string;
    selectedHealthCellRef?: string;
    overviewState?: OpsOverviewScenarioState | string;
  } = {},
): OpsShellState {
  const location = parseOpsPath(pathname);
  const overviewState = normalizeOpsOverviewScenarioState(options.overviewState);
  const selectedHealthCellRef =
    options.selectedHealthCellRef ?? defaultHealthCellForOverviewState(overviewState);
  const overviewProjection = createOpsOverviewProjection(overviewState, selectedHealthCellRef);
  const deltaGateState = options.deltaGateState ?? deltaGateStateForOverviewState(overviewState);
  const selectedAnomalyId = resolveSelectedOpsAnomalyId(
    location.lens,
    location.opsRouteIntentId ??
      options.selectedAnomalyId ??
      defaultAnomalyIdForOverviewState(overviewState),
    deltaGateState,
  );
  const anomaly = anomalyForId(selectedAnomalyId) ?? opsAnomalies[0]!;
  const continuitySnapshot = continuitySnapshotForLocation(location, anomaly);
  const telemetry = [
    createOpsTelemetryEnvelope(location.routeFamilyRef, "surface_enter", {
      routeFamilyRef: location.routeFamilyRef,
      selectedAnomalyId,
      selectedHealthCellRef: overviewProjection.selectedHealthCellRef,
      pathname: location.pathname,
      deltaGateState,
      overviewState,
    }),
  ] as const;
  return {
    location,
    continuitySnapshot,
    selectedAnomalyId,
    selectedHealthCellRef: overviewProjection.selectedHealthCellRef,
    overviewState,
    deltaGateState,
    returnToken: location.childRouteKind
      ? createOpsReturnToken(location, anomaly, overviewProjection)
      : null,
    governanceHandoff: null,
    runtimeScenario: runtimeScenarioForDeltaGate(deltaGateState),
    telemetry,
  };
}

function appendTelemetry(
  state: OpsShellState,
  eventClass: UiTelemetryEventClass,
  payload: Record<string, string | number | boolean | null>,
): readonly UiTelemetryEnvelopeExample[] {
  return [
    ...state.telemetry,
    createOpsTelemetryEnvelope(state.location.routeFamilyRef, eventClass, payload),
  ];
}

export function selectOpsAnomaly(state: OpsShellState, anomalyId: string): OpsShellState {
  const anomaly =
    anomalyForId(anomalyId) ?? anomalyForId(state.selectedAnomalyId) ?? opsAnomalies[0]!;
  const continuitySnapshot = nextContinuitySnapshot(
    state.continuitySnapshot,
    state.location,
    anomaly,
  );
  return {
    ...state,
    selectedAnomalyId: anomaly.anomalyId,
    continuitySnapshot,
    telemetry: appendTelemetry(state, "selected_anchor_changed", {
      selectedAnomalyId: anomaly.anomalyId,
      anchorKey: continuitySnapshot.selectedAnchor.anchorKey,
      promotedSurfaceRef: anomaly.promotedSurfaceRef,
    }),
  };
}

export function selectOpsHealthCell(
  state: OpsShellState,
  selectedHealthCellRef: string,
): OpsShellState {
  const overviewProjection = createOpsOverviewProjection(
    state.overviewState,
    selectedHealthCellRef,
  );
  return {
    ...state,
    selectedHealthCellRef: overviewProjection.selectedHealthCellRef,
    telemetry: appendTelemetry(state, "selected_anchor_changed", {
      selectedHealthCellRef: overviewProjection.selectedHealthCellRef,
      selectedHealthCellTupleHash: overviewProjection.selectedHealthCellTupleHash,
      boardStateDigestRef: overviewProjection.boardStateDigestRef,
    }),
  };
}

export function setOpsDeltaGateState(
  state: OpsShellState,
  deltaGateState: OpsDeltaGateState,
): OpsShellState {
  const runtimeScenario = runtimeScenarioForDeltaGate(deltaGateState);
  const overviewState =
    deltaGateState === "stale"
      ? "stale"
      : deltaGateState === "buffered"
        ? "settlement_pending"
        : deltaGateState === "table_only"
          ? "degraded"
          : "normal";
  const overviewProjection = createOpsOverviewProjection(
    overviewState,
    state.selectedHealthCellRef,
  );
  return {
    ...state,
    deltaGateState,
    overviewState,
    selectedHealthCellRef: overviewProjection.selectedHealthCellRef,
    runtimeScenario,
    telemetry: appendTelemetry(state, "visibility_freshness_downgrade", {
      deltaGateState,
      overviewState,
      blockedMutation: createOpsDeltaGate(deltaGateState).blockedMutation,
      visualizationMode: createOpsDeltaGate(deltaGateState).visualizationMode,
    }),
  };
}

export function navigateOpsShell(state: OpsShellState, pathname: string): OpsShellState {
  const location = parseOpsPath(pathname);
  const nextSelectedAnomalyId = resolveSelectedOpsAnomalyId(
    location.lens,
    location.opsRouteIntentId ?? state.selectedAnomalyId,
    state.deltaGateState,
  );
  const anomaly = anomalyForId(nextSelectedAnomalyId) ?? opsAnomalies[0]!;
  const continuitySnapshot = nextContinuitySnapshot(state.continuitySnapshot, location, anomaly);
  const overviewProjection = createOpsOverviewProjection(
    state.overviewState,
    state.selectedHealthCellRef,
  );
  const nextReturnToken =
    location.childRouteKind || state.location.routeFamilyRef === "rf_operations_board"
      ? createOpsReturnToken(
          state.location,
          anomalyForId(state.selectedAnomalyId) ?? anomaly,
          overviewProjection,
        )
      : state.returnToken;
  return {
    ...state,
    location,
    continuitySnapshot,
    selectedAnomalyId: nextSelectedAnomalyId,
    returnToken: location.childRouteKind ? nextReturnToken : state.returnToken,
    governanceHandoff: null,
    telemetry: appendTelemetry(state, "state_summary_changed", {
      pathname: location.pathname,
      routeFamilyRef: location.routeFamilyRef,
      selectedAnomalyId: nextSelectedAnomalyId,
      selectedHealthCellRef: overviewProjection.selectedHealthCellRef,
      returnTokenRef: nextReturnToken?.returnTokenId ?? null,
    }),
  };
}

export function returnFromOpsChildRoute(state: OpsShellState): OpsShellState {
  const fallbackPath = rootPathForOpsLens(state.location.lens);
  const returnTarget = state.returnToken?.originPath ?? fallbackPath;
  const nextState = navigateOpsShell(state, returnTarget);
  return {
    ...nextState,
    governanceHandoff: null,
    telemetry: appendTelemetry(nextState, "dominant_action_changed", {
      returnTarget,
      selectedAnomalyId: nextState.selectedAnomalyId,
      returnLaw: "OpsReturnToken",
    }),
  };
}

export function openOpsGovernanceHandoff(state: OpsShellState): OpsShellState {
  const anomaly = anomalyForId(state.selectedAnomalyId) ?? opsAnomalies[0]!;
  const overviewProjection = createOpsOverviewProjection(
    state.overviewState,
    state.selectedHealthCellRef,
  );
  const returnToken =
    state.returnToken ?? createOpsReturnToken(state.location, anomaly, overviewProjection);
  return {
    ...state,
    governanceHandoff: createOpsGovernanceHandoff(anomaly, returnToken),
    telemetry: appendTelemetry(state, "dominant_action_changed", {
      governanceHandoff: anomaly.governanceHandoffLabel,
      selectedAnomalyId: anomaly.anomalyId,
    }),
  };
}

export function closeOpsGovernanceHandoff(state: OpsShellState): OpsShellState {
  return {
    ...state,
    governanceHandoff: null,
    telemetry: appendTelemetry(state, "state_summary_changed", {
      governanceHandoffClosed: true,
      selectedAnomalyId: state.selectedAnomalyId,
    }),
  };
}

export function resolveOpsBoardSnapshot(
  state: OpsShellState,
  viewportWidth: number,
): OpsBoardStateSnapshot {
  const overviewProjection = createOpsOverviewProjection(
    state.overviewState,
    state.selectedHealthCellRef,
  );
  const effectiveDeltaGateState =
    state.overviewState === "normal" || state.overviewState === "stable_service"
      ? state.deltaGateState
      : deltaGateStateForOverviewState(state.overviewState);
  const selectedAnomaly = anomalyForId(state.selectedAnomalyId) ?? opsAnomalies[0]!;
  const anomalyRanking = rankOpsAnomalies(state.location.lens, effectiveDeltaGateState);
  const allocationProjection = createOpsAllocationProjection(
    allocationLensForOpsLens(state.location.lens),
    state.overviewState,
    selectedAnomaly.anomalyId,
  );
  const assuranceProjection = createOpsAssuranceProjection(state.overviewState);
  const complianceLedgerProjection = createComplianceLedgerProjection({
    scenarioState: state.overviewState,
    selectedFrameworkCode: assuranceProjection.selectedFrameworkCode,
    selectedControlRef: assuranceProjection.selectedControlCode,
  });
  const conformanceProjection = createCrossPhaseConformanceScorecardProjection({
    scenarioState: conformanceScenarioForOverviewState(state.overviewState),
  });
  const incidentsProjection = createOpsIncidentsProjection({ scenarioState: state.overviewState });
  const investigationProjection = createOpsInvestigationProjection(
    investigationOriginLensForOpsLens(state.location.lens),
    state.overviewState,
    selectedAnomaly.anomalyId,
    overviewProjection.selectedHealthCellRef,
  );
  const resilienceProjection = createOpsResilienceProjection(
    state.overviewState,
    overviewProjection.selectedHealthCellRef,
  );
  const baseDeltaGate = createOpsDeltaGate(effectiveDeltaGateState);
  const deltaGate: OpsDeltaGate = {
    ...baseDeltaGate,
    summary: overviewProjection.freshnessStrip.summary,
    freshnessState:
      overviewProjection.freshnessStrip.freshnessState === "fresh"
        ? "fresh"
        : overviewProjection.freshnessStrip.freshnessState === "watch"
          ? "buffered"
          : "stale",
    trustState:
      overviewProjection.freshnessStrip.publicationState === "live"
        ? baseDeltaGate.trustState
        : overviewProjection.freshnessStrip.publicationState === "blocked"
          ? "diagnostic_only"
          : "guarded",
    blockedMutation:
      baseDeltaGate.blockedMutation ||
      overviewProjection.freshnessStrip.liveControlState !== "live",
  };
  const returnToken =
    state.returnToken ?? createOpsReturnToken(state.location, selectedAnomaly, overviewProjection);
  const routeIntent = createOpsRouteIntent(state.location, selectedAnomaly, returnToken);
  const governanceHandoff = state.governanceHandoff;
  const frameMode: OpsBoardFrameMode =
    viewportWidth < 1100
      ? "mission_stack"
      : state.location.childRouteKind === "compare" || state.location.lens === "incidents"
        ? "three_plane"
        : "two_plane";
  const selectedHealthCell =
    overviewProjection.serviceHealth.find(
      (cell) => cell.serviceRef === overviewProjection.selectedHealthCellRef,
    ) ?? overviewProjection.serviceHealth[0]!;
  const overviewWorkbenchState: OpsFenceState =
    overviewProjection.freshnessStrip.publicationState === "blocked" ||
    selectedHealthCell.mitigationAuthorityState === "blocked"
      ? "frozen"
      : overviewProjection.freshnessStrip.liveControlState === "read_only"
        ? "observe_only"
        : deltaGate.blockedMutation && selectedAnomaly.eligibilityFenceState === "live"
          ? "buffered_hold"
          : effectiveDeltaGateState === "stale"
            ? "frozen"
            : effectiveDeltaGateState === "table_only"
              ? "observe_only"
              : selectedAnomaly.eligibilityFenceState;
  const allocationWorkbenchState = workbenchStateForAllocationEligibility(
    allocationProjection.actionEligibilityFence.eligibilityState,
  );
  const assuranceWorkbenchState: OpsFenceState =
    state.location.lens === "assurance"
      ? workbenchStateForAssuranceControl(
          assuranceProjection.actionRail[0]?.controlState ?? "blocked",
        )
      : "live";
  const investigationWorkbenchState: OpsFenceState =
    state.location.childRouteKind === "investigations" &&
    investigationProjection.drawerSession.deltaState !== "aligned"
      ? investigationProjection.drawerSession.deltaState === "blocked"
        ? "frozen"
        : "observe_only"
      : "live";
  const incidentsWorkbenchState: OpsFenceState =
    state.location.lens === "incidents"
      ? workbenchStateForIncidentControl(incidentsProjection.runtimeBinding.actionControlState)
      : "live";
  const resilienceWorkbenchState: OpsFenceState =
    state.location.lens === "resilience"
      ? workbenchStateForRecoveryControl(resilienceProjection.recoveryControlPosture.postureState)
      : "live";
  const conformanceWorkbenchState: OpsFenceState =
    state.location.lens === "conformance"
      ? workbenchStateForConformanceControl(conformanceProjection.bauSignoffReadiness.actionState)
      : "live";
  const workbenchState = stricterWorkbenchState(
    stricterWorkbenchState(
      stricterWorkbenchState(
        stricterWorkbenchState(
          overviewWorkbenchState,
          stricterWorkbenchState(allocationWorkbenchState, assuranceWorkbenchState),
        ),
        stricterWorkbenchState(investigationWorkbenchState, incidentsWorkbenchState),
      ),
      resilienceWorkbenchState,
    ),
    conformanceWorkbenchState,
  );
  const selectionLease = createOpsSelectionLease(
    selectedAnomaly,
    effectiveDeltaGateState,
    overviewProjection,
    workbenchState,
  );

  return {
    snapshotId: `OBS_${selectedAnomaly.anomalyId.toUpperCase()}_${effectiveDeltaGateState.toUpperCase()}_${state.overviewState.toUpperCase()}`,
    location: state.location,
    overviewState: state.overviewState,
    overviewProjection,
    allocationProjection,
    assuranceProjection,
    complianceLedgerProjection,
    conformanceProjection,
    incidentsProjection,
    investigationProjection,
    resilienceProjection,
    shellContinuityKey: overviewProjection.shellContinuityKey,
    boardStateDigestRef: overviewProjection.boardStateDigestRef,
    boardTupleHash: overviewProjection.boardTupleHash,
    boardScopeRef: overviewProjection.boardScopeRef,
    timeHorizon: overviewProjection.timeHorizon,
    scopePolicyRef: overviewProjection.scopePolicyRef,
    selectedHealthCell,
    selectedHealthCellRef: selectedHealthCell.serviceRef,
    selectedAnomaly,
    anomalyRanking,
    northStarBand: overviewProjection.northStarBand,
    selectionLease,
    deltaGate,
    returnToken,
    routeIntent,
    governanceHandoff,
    serviceHealth: overviewProjection.serviceHealth,
    freshnessStrip: overviewProjection.freshnessStrip,
    stableServiceDigest: overviewProjection.stableServiceDigest,
    cohortImpact: opsCohortImpactRows,
    frameMode,
    workbenchState,
    visualizationMode: deltaGate.visualizationMode,
    summarySentence: state.location.childRouteKind
      ? `${selectedAnomaly.title} stays pinned while ${state.location.childRouteKind} preserves the same continuity question and return token.`
      : overviewProjection.stableServiceDigest
        ? overviewProjection.surfaceSummary
        : `${selectedAnomaly.title} remains the dominant anomaly while ${selectedHealthCell.serviceLabel} stays bound to ${overviewProjection.boardStateDigestRef}.`,
  };
}

export const opsMockProjectionExamples: readonly OpsMockProjectionExample[] = [
  {
    exampleId: "OPS_OVERVIEW_LIVE",
    path: "/ops/overview",
    deltaGateState: "live",
    summary:
      "Desktop overview keeps one dominant backlog anomaly and a live intervention workbench.",
    selectedAnomalyId: "ops-route-07",
    childRouteKind: null,
  },
  {
    exampleId: "OPS_QUEUES_BUFFERED",
    path: "/ops/queues",
    deltaGateState: "buffered",
    summary:
      "Queue lens buffers new deltas instead of re-ranking away from the preserved backlog selection.",
    selectedAnomalyId: "ops-route-07",
    childRouteKind: null,
  },
  {
    exampleId: "OPS_DEPENDENCIES_TABLE_ONLY",
    path: "/ops/dependencies",
    deltaGateState: "table_only",
    summary:
      "Dependency lens downgrades visualization parity to table-only status while preserving the same workspace.",
    selectedAnomalyId: "ops-route-04",
    childRouteKind: null,
  },
  {
    exampleId: "OPS_AUDIT_INVESTIGATION",
    path: "/ops/audit/investigations/ops-route-12",
    deltaGateState: "stale",
    summary:
      "Audit investigation keeps preserved proof basis visible and action status frozen under stale continuity information.",
    selectedAnomalyId: "ops-route-12",
    childRouteKind: "investigations",
  },
  {
    exampleId: "OPS_INCIDENT_COMPARE",
    path: "/ops/incidents/compare/ops-route-15",
    deltaGateState: "buffered",
    summary:
      "Incident compare route opens the only allowed three-plane status and preserves the same anomaly selection.",
    selectedAnomalyId: "ops-route-15",
    childRouteKind: "compare",
  },
  {
    exampleId: "OPS_RESILIENCE_HEALTH",
    path: "/ops/resilience/health/ops-route-18",
    deltaGateState: "live",
    summary:
      "Resilience health drill keeps essential-function health visible beside restore debt context.",
    selectedAnomalyId: "ops-route-18",
    childRouteKind: "health",
  },
] as const;

export const opsRouteContractSeedRows: readonly OpsRouteContractSeedRow[] = [
  ...opsLensOrder.map((lens) => ({
    path: `/ops/${lens}`,
    routeFamilyRef: "rf_operations_board" as const,
    lens,
    childRouteKind: null,
    continuityKey: opsBoardClaim.continuityKey,
    selectedAnchorPolicy: "acknowledgement_required",
    summary: `Resident operations board root for the ${lens} lens.`,
  })),
  ...opsLensOrder.flatMap((lens) =>
    opsChildRouteOrder.map((childRouteKind) => ({
      path: `/ops/${lens}/${childRouteKind}/:opsRouteIntentId`,
      routeFamilyRef: "rf_operations_drilldown" as const,
      lens,
      childRouteKind,
      continuityKey: opsDrilldownClaim.continuityKey,
      selectedAnchorPolicy: "acknowledgement_required",
      summary: `Same-shell ${childRouteKind} child route preserving the operations continuity key.`,
    })),
  ),
] as const;

export const opsAnomalyMatrixRows: readonly OpsAnomalyMatrixRow[] = opsAnomalies.map((anomaly) => ({
  anomalyId: anomaly.anomalyId,
  severity: anomaly.severity,
  lens: anomaly.lens,
  fenceState: anomaly.eligibilityFenceState,
  recommendedAction: anomaly.recommendedAction,
  governanceStub: anomaly.governanceHandoffLabel,
  gapRefs: anomaly.gapRefs,
}));

export function createOpsRouteMapMermaid(): string {
  return [
    "flowchart LR",
    '  root["/ops/:lens root board"] --> investigations["/ops/:lens/investigations/:opsRouteIntentId"]',
    '  root --> interventions["/ops/:lens/interventions/:opsRouteIntentId"]',
    '  root --> compare["/ops/:lens/compare/:opsRouteIntentId"]',
    '  root --> health["/ops/:lens/health/:opsRouteIntentId"]',
    '  investigations --> returnLaw["OpsReturnToken return"]',
    '  interventions --> governance["Bounded governance handoff stub"]',
    "  compare --> returnLaw",
    "  health --> returnLaw",
    "  governance --> returnLaw",
  ].join("\n");
}

export function createOpsGallerySeed() {
  return opsMockProjectionExamples.map((example) => {
    const state = createInitialOpsShellState(example.path, {
      deltaGateState: example.deltaGateState,
      selectedAnomalyId: example.selectedAnomalyId,
    });
    return resolveOpsBoardSnapshot(state, example.childRouteKind === "compare" ? 1480 : 1320);
  });
}
