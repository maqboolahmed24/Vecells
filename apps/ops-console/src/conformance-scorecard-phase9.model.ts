import canonicalCrossPhaseConformanceFixture from "../../../data/fixtures/449_phase9_cross_phase_conformance_fixtures.json";
import type {
  BAUReadinessPack,
  ContractAdoptionState,
  CrossPhaseConformanceScorecard,
  ConformanceState,
  PhaseConformanceRow,
  Phase9CrossPhaseConformanceFixture,
} from "../../../packages/domains/analytics_assurance/src/phase9-cross-phase-conformance";
import {
  OPS_OVERVIEW_BOARD_SCOPE_REF,
  OPS_OVERVIEW_SCOPE_POLICY_REF,
  OPS_OVERVIEW_SHELL_CONTINUITY_KEY,
  OPS_OVERVIEW_TIME_HORIZON,
} from "./operations-overview-phase9.model";

export const CONFORMANCE_SCORECARD_TASK_ID = "par_460";
export const CONFORMANCE_SCORECARD_SCHEMA_VERSION =
  "460.phase9.service-owner-conformance-scorecard.v1";
export const CONFORMANCE_SCORECARD_VISUAL_MODE = "Service_Owner_Conformance_Ledger";
export const CONFORMANCE_SCORECARD_GAP_ARTIFACT_REF =
  "PHASE9_BATCH_458_472_INTERFACE_GAP_460_CONFORMANCE_PROJECTION";
const PHASE9_CROSS_PHASE_CONFORMANCE_VERSION = "449.phase9.cross-phase-conformance.v1";

function createPhase9CrossPhaseConformanceFixture(): Phase9CrossPhaseConformanceFixture {
  return canonicalCrossPhaseConformanceFixture as unknown as Phase9CrossPhaseConformanceFixture;
}

export type ConformanceScorecardScenarioState =
  | "exact"
  | "stale"
  | "blocked"
  | "summary_drift"
  | "missing_verification"
  | "stale_runtime_tuple"
  | "missing_ops_proof"
  | "deferred_channel"
  | "no_blocker"
  | "permission_denied";

export type ProofDimensionKey =
  | "all"
  | "summary_alignment"
  | "contract_adoption"
  | "verification_coverage"
  | "operational_proof"
  | "governance_proof"
  | "recovery_posture"
  | "end_state_proof";

export type ConformanceOwnerKey =
  | "all"
  | "service_owner"
  | "governance"
  | "operations"
  | "release"
  | "resilience";

export type ConformanceBlockerFilterKey = "all" | "has_blocker" | "no_blocker";
export type ConformanceStateFilterKey = "all" | "exact" | "stale" | "blocked" | "deferred";
export type ConformanceRowKind = "phase" | "control_family" | "deferred_channel";
export type BAUSignoffActionState = "ready" | "blocked" | "diagnostic_only" | "permission_denied";

export interface ConformanceSafeHandoffLink {
  readonly handoffRef: string;
  readonly label: string;
  readonly targetSurface:
    | "assurance"
    | "governance"
    | "operations"
    | "resilience"
    | "incident"
    | "records"
    | "release";
  readonly route: string;
  readonly payloadRef: string;
  readonly returnTokenRef: string;
  readonly selectedRowRef: string;
  readonly rawArtifactUrlSuppressed: true;
}

export interface PhaseConformanceRowProjection {
  readonly phaseConformanceRowId: string;
  readonly phaseCode: string;
  readonly phaseLabel: string;
  readonly rowKind: ConformanceRowKind;
  readonly ownerKey: ConformanceOwnerKey;
  readonly ownerLabel: string;
  readonly summaryAlignmentState: ConformanceState;
  readonly contractAdoptionState: ContractAdoptionState;
  readonly verificationCoverageState: ConformanceState;
  readonly operationalProofState: ConformanceState;
  readonly governanceProofState: ConformanceState;
  readonly recoveryPostureState: ConformanceState;
  readonly endStateProofState: ConformanceState;
  readonly rowState: ConformanceState;
  readonly rowHash: string;
  readonly rowHashParity: "matched" | "drifted" | "deferred";
  readonly generatedAt: string;
  readonly summarySourceRefs: readonly string[];
  readonly canonicalBlueprintRefs: readonly string[];
  readonly runtimePublicationBundleRefs: readonly string[];
  readonly verificationScenarioRefs: readonly string[];
  readonly controlStatusSnapshotRefs: readonly string[];
  readonly opsProofRefs: readonly string[];
  readonly governanceProofRefs: readonly string[];
  readonly recoveryDispositionRefs: readonly string[];
  readonly endStateProofRefs: readonly string[];
  readonly blockerRefs: readonly string[];
  readonly failedPredicate: string;
  readonly consequence: string;
  readonly nextSafeAction: string;
  readonly selected: boolean;
}

export interface ConformanceBlockerQueueItemProjection {
  readonly blockerRef: string;
  readonly sourceRowRef: string;
  readonly sourcePhaseCode: string;
  readonly ownerKey: ConformanceOwnerKey;
  readonly ownerLabel: string;
  readonly severity: "watch" | "high" | "critical";
  readonly dueAt: string;
  readonly failedPredicate: string;
  readonly consequence: string;
  readonly nextSafeAction: string;
  readonly selected: boolean;
}

export interface ConformanceBlockerQueueProjection {
  readonly blockerQueueRef: string;
  readonly queueState: "empty" | "open" | "blocked" | "permission_denied";
  readonly activeOwnerFilter: ConformanceOwnerKey;
  readonly activeBlockerFilter: ConformanceBlockerFilterKey;
  readonly blockerCount: number;
  readonly items: readonly ConformanceBlockerQueueItemProjection[];
}

export interface BAUSignoffReadinessProjection {
  readonly bauReadinessRef: string;
  readonly signoffState: BAUReadinessPack["signoffState"] | "permission_denied";
  readonly actionState: BAUSignoffActionState;
  readonly actionAllowed: boolean;
  readonly scorecardHashParity: "matched" | "drifted" | "blocked";
  readonly releaseToBAURecordRef: string;
  readonly blockedReleaseAttemptRef: string;
  readonly disabledReason: string;
  readonly requiredRowRefs: readonly string[];
  readonly blockerRefs: readonly string[];
}

export interface ConformanceSourceTraceStepProjection {
  readonly stepKey:
    | "summary"
    | "blueprint"
    | "runtime"
    | "verification"
    | "governance"
    | "operations"
    | "recovery"
    | "end_state";
  readonly label: string;
  readonly state: ConformanceState | ContractAdoptionState | "deferred";
  readonly sourceRefs: readonly string[];
  readonly consequence: string;
}

export interface ConformanceSourceTraceProjection {
  readonly sourceTraceRef: string;
  readonly selectedRowRef: string;
  readonly selectedRowLabel: string;
  readonly drawerState: "open" | "closed";
  readonly returnTokenRef: string;
  readonly steps: readonly ConformanceSourceTraceStepProjection[];
}

export interface ConformanceRowDiffProjection {
  readonly rowDiffRef: string;
  readonly selectedRowRef: string;
  readonly diffState:
    | "none"
    | "summary_drift"
    | "missing_verification"
    | "runtime_stale"
    | "ops_gap";
  readonly beforeSummary: string;
  readonly afterSummary: string;
  readonly changedRefs: readonly string[];
  readonly consequence: string;
}

export interface RuntimeTupleCoverageBandProjection {
  readonly runtimeTupleCoverageRef: string;
  readonly runtimeBundleCount: number;
  readonly verificationScenarioCount: number;
  readonly recoveryDispositionCount: number;
  readonly coverageState: ConformanceState;
  readonly tupleHashRef: string;
  readonly summary: string;
}

export interface GovernanceOpsProofRailProjection {
  readonly proofRailRef: string;
  readonly governanceProofState: ConformanceState;
  readonly operationsProofState: ConformanceState;
  readonly recoveryPostureState: ConformanceState;
  readonly governanceBundleCount: number;
  readonly opsSliceCount: number;
  readonly recoveryDispositionCount: number;
  readonly proofRefs: readonly string[];
}

export interface CrossPhaseControlFamilyMatrixCellProjection {
  readonly cellRef: string;
  readonly controlFamily: string;
  readonly dimension: Exclude<ProofDimensionKey, "all">;
  readonly state: ConformanceState | "deferred";
  readonly text: string;
  readonly consequence: string;
}

export interface CrossPhaseControlFamilyMatrixProjection {
  readonly matrixRef: string;
  readonly state: ConformanceState;
  readonly families: readonly string[];
  readonly dimensions: readonly Exclude<ProofDimensionKey, "all">[];
  readonly cells: readonly CrossPhaseControlFamilyMatrixCellProjection[];
}

export interface ConformanceFilterSetProjection {
  readonly filterSetRef: string;
  readonly phaseFilter: string;
  readonly dimensionFilter: ProofDimensionKey;
  readonly ownerFilter: ConformanceOwnerKey;
  readonly blockerFilter: ConformanceBlockerFilterKey;
  readonly stateFilter: ConformanceStateFilterKey;
  readonly phaseOptions: readonly string[];
}

export interface ScorecardHashProjection {
  readonly scorecardHashCardRef: string;
  readonly scorecardRef: string;
  readonly scorecardState: ConformanceState;
  readonly scorecardHash: string;
  readonly hashPrefix: string;
  readonly generatedAt: string;
  readonly graphVerdictState: ConformanceState;
  readonly signoffConsequence: string;
}

export interface CrossPhaseConformanceScorecardProjection {
  readonly taskId: typeof CONFORMANCE_SCORECARD_TASK_ID;
  readonly schemaVersion: typeof CONFORMANCE_SCORECARD_SCHEMA_VERSION;
  readonly route: "/ops/conformance";
  readonly visualMode: typeof CONFORMANCE_SCORECARD_VISUAL_MODE;
  readonly scenarioState: ConformanceScorecardScenarioState;
  readonly releaseRef: string;
  readonly tenantScope: string;
  readonly boardScopeRef: string;
  readonly timeHorizon: string;
  readonly scopePolicyRef: string;
  readonly shellContinuityKey: string;
  readonly selectedRowRef: string;
  readonly scorecardHash: ScorecardHashProjection;
  readonly filters: ConformanceFilterSetProjection;
  readonly phaseRows: readonly PhaseConformanceRowProjection[];
  readonly visibleRows: readonly PhaseConformanceRowProjection[];
  readonly controlFamilyMatrix: CrossPhaseControlFamilyMatrixProjection;
  readonly runtimeTupleCoverage: RuntimeTupleCoverageBandProjection;
  readonly governanceOpsProofRail: GovernanceOpsProofRailProjection;
  readonly blockerQueue: ConformanceBlockerQueueProjection;
  readonly bauSignoffReadiness: BAUSignoffReadinessProjection;
  readonly sourceTrace: ConformanceSourceTraceProjection;
  readonly rowDiff: ConformanceRowDiffProjection;
  readonly safeHandoffLinks: readonly ConformanceSafeHandoffLink[];
  readonly noRawArtifactUrls: true;
  readonly interfaceGapArtifactRef: typeof CONFORMANCE_SCORECARD_GAP_ARTIFACT_REF;
  readonly sourceAlgorithmRefs: readonly string[];
  readonly upstreamSchemaVersions: Record<string, string>;
  readonly automationAnchors: readonly string[];
}

const sourceAlgorithmRefs = [
  "blueprint/phase-9-the-assurance-ledger.md#9I",
  "blueprint/phase-cards.md#Cross-Phase-Conformance-Scorecard",
  "blueprint/blueprint-init.md#CrossPhaseConformanceScorecard",
  "blueprint/platform-runtime-and-release-blueprint.md#VerificationScenario",
  "packages/domains/analytics_assurance/src/phase9-cross-phase-conformance.ts",
] as const;

const automationAnchors = [
  "conformance-scorecard-shell",
  "phase-row-proof-table",
  "cross-phase-control-family-matrix",
  "runtime-tuple-coverage-band",
  "governance-ops-proof-rail",
  "bau-signoff-blocker-queue",
  "conformance-source-trace-drawer",
  "scorecard-hash-card",
  "summary-alignment-diff-panel",
] as const;

const proofDimensions = [
  "summary_alignment",
  "contract_adoption",
  "verification_coverage",
  "operational_proof",
  "governance_proof",
  "recovery_posture",
  "end_state_proof",
] as const satisfies readonly Exclude<ProofDimensionKey, "all">[];

const controlFamilies = [
  "route settlement",
  "artifact presentation",
  "visibility policy",
  "release freeze",
  "continuity evidence",
  "assurance graph",
  "retention",
  "resilience",
  "incident",
  "tenant config",
] as const;

const ownerLabels: Record<ConformanceOwnerKey, string> = {
  all: "All owners",
  service_owner: "Service owner",
  governance: "Governance owner",
  operations: "Operations owner",
  release: "Release owner",
  resilience: "Resilience owner",
};

const severityOrder: Record<ConformanceBlockerQueueItemProjection["severity"], number> = {
  critical: 3,
  high: 2,
  watch: 1,
};

function syntheticHash(prefix: string): string {
  return `${prefix.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}460`.padEnd(64, "0").slice(0, 64);
}

function normalizeToken(value: string | null | undefined, fallback = "all"): string {
  return String(value ?? fallback)
    .toLowerCase()
    .replace(/-/g, "_");
}

export function normalizeConformanceScorecardScenarioState(
  value: string | null | undefined,
): ConformanceScorecardScenarioState {
  const normalized = normalizeToken(value, "exact");
  if (
    normalized === "stale" ||
    normalized === "blocked" ||
    normalized === "summary_drift" ||
    normalized === "missing_verification" ||
    normalized === "stale_runtime_tuple" ||
    normalized === "missing_ops_proof" ||
    normalized === "deferred_channel" ||
    normalized === "no_blocker" ||
    normalized === "permission_denied"
  ) {
    return normalized;
  }
  return "exact";
}

function normalizeDimensionFilter(value: string | null | undefined): ProofDimensionKey {
  const normalized = normalizeToken(value);
  return proofDimensions.includes(normalized as Exclude<ProofDimensionKey, "all">)
    ? (normalized as ProofDimensionKey)
    : "all";
}

function normalizeOwnerFilter(value: string | null | undefined): ConformanceOwnerKey {
  const normalized = normalizeToken(value);
  if (
    normalized === "service_owner" ||
    normalized === "governance" ||
    normalized === "operations" ||
    normalized === "release" ||
    normalized === "resilience"
  ) {
    return normalized;
  }
  return "all";
}

function normalizeBlockerFilter(value: string | null | undefined): ConformanceBlockerFilterKey {
  const normalized = normalizeToken(value);
  if (normalized === "has_blocker" || normalized === "no_blocker") return normalized;
  return "all";
}

function normalizeStateFilter(value: string | null | undefined): ConformanceStateFilterKey {
  const normalized = normalizeToken(value);
  if (
    normalized === "exact" ||
    normalized === "stale" ||
    normalized === "blocked" ||
    normalized === "deferred"
  ) {
    return normalized;
  }
  return "all";
}

function labelForPhaseCode(phaseCode: string): string {
  const labels: Record<string, string> = {
    phase0_foundation: "Phase 0 foundation",
    phase3_duplicate_resolution: "Phase 3 duplicate resolution",
    phase6_pharmacy_loop: "Phase 6 pharmacy loop",
    phase7_nhs_app_deferred_channel: "Phase 7 NHS App deferred channel",
    phase8_assistive_layer: "Phase 8 assistive layer",
    phase9_assurance_governance: "Phase 9 assurance governance",
    cross_phase_runtime_release: "Cross-phase runtime release",
    runtime_publication_tuple: "Runtime publication tuple",
    verification_ladder: "Verification ladder",
    slice_trust_control_status: "Slice trust and control status",
    continuity_evidence: "Continuity evidence",
    governance_ops_proof: "Governance and operations proof",
  };
  return labels[phaseCode] ?? phaseCode.replace(/_/g, " ");
}

function ownerForPhaseCode(phaseCode: string): ConformanceOwnerKey {
  if (phaseCode.includes("governance")) return "governance";
  if (phaseCode.includes("runtime") || phaseCode.includes("verification")) return "release";
  if (phaseCode.includes("continuity") || phaseCode.includes("resilience")) return "resilience";
  if (phaseCode.includes("slice") || phaseCode.includes("ops")) return "operations";
  return "service_owner";
}

function rowKindForPhaseCode(phaseCode: string): ConformanceRowKind {
  if (phaseCode.includes("deferred_channel")) return "deferred_channel";
  if (
    phaseCode.includes("runtime") ||
    phaseCode.includes("verification") ||
    phaseCode.includes("slice") ||
    phaseCode.includes("continuity") ||
    phaseCode.includes("governance_ops")
  ) {
    return "control_family";
  }
  return "phase";
}

function worstState(states: readonly ConformanceState[]): ConformanceState {
  if (states.includes("blocked")) return "blocked";
  if (states.includes("stale")) return "stale";
  return "exact";
}

function contractToConformanceState(state: ContractAdoptionState): ConformanceState {
  return state === "exact" ? "exact" : state === "partial" ? "stale" : "blocked";
}

function stateForDimension(
  row: PhaseConformanceRowProjection,
  dimension: Exclude<ProofDimensionKey, "all">,
): ConformanceState | ContractAdoptionState {
  switch (dimension) {
    case "summary_alignment":
      return row.summaryAlignmentState;
    case "contract_adoption":
      return row.contractAdoptionState;
    case "verification_coverage":
      return row.verificationCoverageState;
    case "operational_proof":
      return row.operationalProofState;
    case "governance_proof":
      return row.governanceProofState;
    case "recovery_posture":
      return row.recoveryPostureState;
    case "end_state_proof":
      return row.endStateProofState;
  }
}

function cloneRow(
  row: PhaseConformanceRow,
  overrides: Partial<PhaseConformanceRow> & { readonly phaseCode?: string },
): PhaseConformanceRow {
  const phaseCode = overrides.phaseCode ?? row.phaseCode;
  const summaryAlignmentState = overrides.summaryAlignmentState ?? row.summaryAlignmentState;
  const contractAdoptionState = overrides.contractAdoptionState ?? row.contractAdoptionState;
  const verificationCoverageState =
    overrides.verificationCoverageState ?? row.verificationCoverageState;
  const operationalProofState = overrides.operationalProofState ?? row.operationalProofState;
  const endStateProofState = overrides.endStateProofState ?? row.endStateProofState;
  const rowState =
    overrides.rowState ??
    worstState([
      summaryAlignmentState,
      contractToConformanceState(contractAdoptionState),
      verificationCoverageState,
      operationalProofState,
      endStateProofState,
    ]);
  const rowHash = syntheticHash(
    `${phaseCode}-${summaryAlignmentState}-${contractAdoptionState}-${verificationCoverageState}-${operationalProofState}-${endStateProofState}`,
  );
  return {
    ...row,
    ...overrides,
    phaseCode,
    summaryAlignmentState,
    contractAdoptionState,
    verificationCoverageState,
    operationalProofState,
    endStateProofState,
    rowState,
    rowHash,
    phaseConformanceRowId: `pcr_460_${rowHash.slice(0, 16)}`,
  };
}

function deferredChannelRow(base: PhaseConformanceRow): PhaseConformanceRow {
  return cloneRow(base, {
    phaseCode: "phase7_nhs_app_deferred_channel",
    summarySourceRefs: ["phase-cards:phase7", "blueprint-init:phase7"],
    canonicalBlueprintRefs: [
      "blueprint:phase7:deferred-channel",
      "blueprint/platform-runtime-and-release-blueprint.md#EmbeddedSurfaceContractCoverageRecord",
    ],
    requiredControlStatusSnapshotRefs: ["control-status:phase7:deferred-channel:scoped-out"],
    requiredAssuranceSliceTrustRefs: ["slice-trust:phase7:deferred-channel:scoped-out"],
    requiredExperienceContinuityEvidenceRefs: [
      "experience-continuity:phase7:deferred-channel:deferred",
    ],
    requiredOpsContinuityEvidenceSliceRefs: ["ops-continuity:phase7:deferred-channel:not-live"],
    requiredGovernanceContinuityEvidenceBundleRefs: [
      "governance-continuity:phase7:deferred-channel:watchlist",
    ],
    requiredRuntimePublicationBundleRefs: ["runtime-publication:phase7:deferred-channel:excluded"],
    requiredVerificationScenarioRefs: ["verification-scenario:phase7:deferred-channel:deferred"],
    requiredReleaseRecoveryDispositionRefs: [
      "release-recovery:phase7:deferred-channel:scoped-defer",
    ],
    requiredEndStateProofRefs: ["end-state-proof:phase7:deferred-channel:deferred-not-live"],
    rowState: "exact",
  });
}

function rowsForScenario(
  fixture: Phase9CrossPhaseConformanceFixture,
  scenarioState: ConformanceScorecardScenarioState,
): readonly PhaseConformanceRow[] {
  const exactRows = fixture.exactPhaseRows;
  switch (scenarioState) {
    case "no_blocker":
    case "exact":
      return exactRows;
    case "deferred_channel":
      return [...exactRows, deferredChannelRow(exactRows[0]!)];
    case "stale":
      return [
        ...exactRows.slice(0, -1),
        cloneRow(exactRows.at(-1)!, {
          requiredEndStateProofRefs: ["end-state-proof:cross_phase_runtime_release:drifted"],
          endStateProofState: "stale",
        }),
      ];
    case "summary_drift":
      return [fixture.summaryContradictionRow, ...exactRows.slice(0, 2)];
    case "missing_verification":
      return [fixture.missingVerificationScenarioRow, ...exactRows.slice(0, 2)];
    case "stale_runtime_tuple":
      return [
        cloneRow(fixture.missingRuntimePublicationRow, {
          requiredRuntimePublicationBundleRefs: ["runtime-publication:stale:watch-tuple"],
          verificationCoverageState: "stale",
          rowState: "stale",
        }),
        ...exactRows.slice(0, 2),
      ];
    case "missing_ops_proof":
      return [fixture.missingGovernanceOpsProofRow, ...exactRows.slice(0, 2)];
    case "permission_denied":
      return exactRows.map((row) =>
        cloneRow(row, {
          requiredEndStateProofRefs: ["permission-denied:metadata-only"],
          endStateProofState: "blocked",
          rowState: "blocked",
        }),
      );
    case "blocked":
    default:
      return [
        fixture.summaryContradictionRow,
        fixture.missingRuntimePublicationRow,
        fixture.missingVerificationScenarioRow,
        fixture.staleControlSliceTrustRow,
        fixture.staleContinuityEvidenceRow,
        fixture.missingGovernanceOpsProofRow,
      ];
  }
}

function scorecardForScenario(
  fixture: Phase9CrossPhaseConformanceFixture,
  scenarioState: ConformanceScorecardScenarioState,
): CrossPhaseConformanceScorecard {
  switch (scenarioState) {
    case "exact":
    case "no_blocker":
    case "deferred_channel":
      return fixture.exactScorecard;
    case "stale":
      return fixture.staleScorecardAfterProofDrift;
    case "permission_denied":
    case "blocked":
    case "summary_drift":
    case "missing_verification":
    case "stale_runtime_tuple":
    case "missing_ops_proof":
    default:
      return fixture.blockedScorecard;
  }
}

function bauPackForScenario(
  fixture: Phase9CrossPhaseConformanceFixture,
  scenarioState: ConformanceScorecardScenarioState,
): BAUReadinessPack {
  return scenarioState === "exact" ||
    scenarioState === "no_blocker" ||
    scenarioState === "deferred_channel"
    ? fixture.signedOffBauReadinessPack
    : fixture.blockedBauReadinessPack;
}

function blockerRefsForRow(row: PhaseConformanceRowProjection): readonly string[] {
  const blockers: string[] = [];
  if (row.summaryAlignmentState !== "exact") {
    blockers.push(`${row.phaseCode}:summary:${row.summaryAlignmentState}`);
  }
  if (row.contractAdoptionState !== "exact") {
    blockers.push(`${row.phaseCode}:contract:${row.contractAdoptionState}`);
  }
  if (row.verificationCoverageState !== "exact") {
    blockers.push(`${row.phaseCode}:verification:${row.verificationCoverageState}`);
  }
  if (row.operationalProofState !== "exact") {
    blockers.push(`${row.phaseCode}:operational:${row.operationalProofState}`);
  }
  if (row.governanceProofState !== "exact") {
    blockers.push(`${row.phaseCode}:governance:${row.governanceProofState}`);
  }
  if (row.recoveryPostureState !== "exact") {
    blockers.push(`${row.phaseCode}:recovery:${row.recoveryPostureState}`);
  }
  if (row.endStateProofState !== "exact") {
    blockers.push(`${row.phaseCode}:end-state:${row.endStateProofState}`);
  }
  return blockers.sort();
}

function projectRow(
  row: PhaseConformanceRow,
  scorecardState: ConformanceState,
  scenarioState: ConformanceScorecardScenarioState,
  selectedRowRef: string,
): PhaseConformanceRowProjection {
  const ownerKey = ownerForPhaseCode(row.phaseCode);
  const governanceProofState = row.requiredGovernanceContinuityEvidenceBundleRefs.some((ref) =>
    ref.startsWith("missing:"),
  )
    ? "blocked"
    : row.operationalProofState;
  const recoveryPostureState = row.requiredReleaseRecoveryDispositionRefs.some((ref) =>
    ref.startsWith("missing:"),
  )
    ? "blocked"
    : row.verificationCoverageState === "blocked"
      ? "blocked"
      : row.verificationCoverageState === "stale"
        ? "stale"
        : "exact";
  const base: Omit<PhaseConformanceRowProjection, "blockerRefs"> = {
    phaseConformanceRowId: row.phaseConformanceRowId,
    phaseCode: row.phaseCode,
    phaseLabel: labelForPhaseCode(row.phaseCode),
    rowKind: rowKindForPhaseCode(row.phaseCode),
    ownerKey,
    ownerLabel: ownerLabels[ownerKey],
    summaryAlignmentState: row.summaryAlignmentState,
    contractAdoptionState: row.contractAdoptionState,
    verificationCoverageState: row.verificationCoverageState,
    operationalProofState: row.operationalProofState,
    governanceProofState,
    recoveryPostureState,
    endStateProofState: row.endStateProofState,
    rowState: scenarioState === "permission_denied" ? "blocked" : row.rowState,
    rowHash: row.rowHash,
    rowHashParity: row.phaseCode.includes("deferred_channel")
      ? "deferred"
      : scorecardState === "exact" && row.rowState === "exact"
        ? "matched"
        : "drifted",
    generatedAt: row.generatedAt,
    summarySourceRefs: row.summarySourceRefs,
    canonicalBlueprintRefs: row.canonicalBlueprintRefs,
    runtimePublicationBundleRefs: row.requiredRuntimePublicationBundleRefs,
    verificationScenarioRefs: row.requiredVerificationScenarioRefs,
    controlStatusSnapshotRefs: row.requiredControlStatusSnapshotRefs,
    opsProofRefs: row.requiredOpsContinuityEvidenceSliceRefs,
    governanceProofRefs: row.requiredGovernanceContinuityEvidenceBundleRefs,
    recoveryDispositionRefs: row.requiredReleaseRecoveryDispositionRefs,
    endStateProofRefs: row.requiredEndStateProofRefs,
    failedPredicate:
      row.rowState === "exact"
        ? "all_required_refs_match_current_scorecard"
        : row.summaryAlignmentState !== "exact"
          ? "summary_alignment_must_match_runtime_and_governance_claims"
          : row.verificationCoverageState !== "exact"
            ? "verification_scenario_and_runtime_tuple_must_be_pinned"
            : row.operationalProofState !== "exact"
              ? "operations_and_governance_proof_must_be_exact"
              : "end_state_proof_must_match_current_hash",
    consequence:
      row.rowState === "exact"
        ? row.phaseCode.includes("deferred_channel")
          ? "Deferred channel is explicitly scoped out of live BAU signoff."
          : "Row can contribute to BAU signoff if every other row remains exact."
        : "BAU signoff and release-to-BAU record creation remain blocked.",
    nextSafeAction:
      row.summaryAlignmentState !== "exact"
        ? "Reconcile phase-card and bootstrap summary sources"
        : row.verificationCoverageState !== "exact"
          ? "Pin verification scenario and runtime publication tuple"
          : row.operationalProofState !== "exact" || governanceProofState !== "exact"
            ? "Refresh operations and governance proof bundles"
            : "Recompute scorecard hash from current proof set",
    selected: row.phaseConformanceRowId === selectedRowRef,
  };
  return {
    ...base,
    blockerRefs: blockerRefsForRow(base as PhaseConformanceRowProjection),
  };
}

function filterRows(
  rows: readonly PhaseConformanceRowProjection[],
  filters: ConformanceFilterSetProjection,
): readonly PhaseConformanceRowProjection[] {
  return rows.filter((row) => {
    const phaseMatch = filters.phaseFilter === "all" || row.phaseCode === filters.phaseFilter;
    const ownerMatch = filters.ownerFilter === "all" || row.ownerKey === filters.ownerFilter;
    const blockerMatch =
      filters.blockerFilter === "all" ||
      (filters.blockerFilter === "has_blocker" && row.blockerRefs.length > 0) ||
      (filters.blockerFilter === "no_blocker" && row.blockerRefs.length === 0);
    const stateMatch =
      filters.stateFilter === "all" ||
      (filters.stateFilter === "deferred" && row.rowKind === "deferred_channel") ||
      row.rowState === filters.stateFilter;
    const dimensionMatch =
      filters.dimensionFilter === "all" ||
      stateForDimension(row, filters.dimensionFilter) !== "exact";
    return phaseMatch && ownerMatch && blockerMatch && stateMatch && dimensionMatch;
  });
}

function createFilterSet(input: {
  readonly rows: readonly PhaseConformanceRowProjection[];
  readonly phaseFilter?: string | null;
  readonly dimensionFilter?: string | null;
  readonly ownerFilter?: string | null;
  readonly blockerFilter?: string | null;
  readonly stateFilter?: string | null;
}): ConformanceFilterSetProjection {
  const requestedPhase = normalizeToken(input.phaseFilter);
  const phaseOptions = ["all", ...input.rows.map((row) => row.phaseCode)].filter(
    (value, index, values) => values.indexOf(value) === index,
  );
  return {
    filterSetRef: "CFS_460_SERVICE_OWNER",
    phaseFilter: phaseOptions.includes(requestedPhase) ? requestedPhase : "all",
    dimensionFilter: normalizeDimensionFilter(input.dimensionFilter),
    ownerFilter: normalizeOwnerFilter(input.ownerFilter),
    blockerFilter: normalizeBlockerFilter(input.blockerFilter),
    stateFilter: normalizeStateFilter(input.stateFilter),
    phaseOptions,
  };
}

function createBlockers(
  rows: readonly PhaseConformanceRowProjection[],
  selectedRowRef: string,
  ownerFilter: ConformanceOwnerKey,
  blockerFilter: ConformanceBlockerFilterKey,
  scenarioState: ConformanceScorecardScenarioState,
): ConformanceBlockerQueueProjection {
  const rawItems = rows.flatMap((row) =>
    row.blockerRefs.map((blockerRef, index) => ({
      blockerRef,
      sourceRowRef: row.phaseConformanceRowId,
      sourcePhaseCode: row.phaseCode,
      ownerKey: row.ownerKey,
      ownerLabel: row.ownerLabel,
      severity:
        row.rowState === "blocked" ? "critical" : row.rowState === "stale" ? "high" : "watch",
      dueAt: row.rowState === "blocked" ? "2026-04-29T12:00:00.000Z" : "2026-05-02T12:00:00.000Z",
      failedPredicate: row.failedPredicate,
      consequence: row.consequence,
      nextSafeAction: row.nextSafeAction,
      selected: row.phaseConformanceRowId === selectedRowRef && index === 0,
    })),
  ) satisfies readonly ConformanceBlockerQueueItemProjection[];
  const items = rawItems
    .filter((item) => ownerFilter === "all" || item.ownerKey === ownerFilter)
    .filter((item) => blockerFilter !== "no_blocker")
    .sort(
      (left, right) =>
        severityOrder[right.severity] - severityOrder[left.severity] ||
        left.dueAt.localeCompare(right.dueAt) ||
        left.blockerRef.localeCompare(right.blockerRef),
    );
  return {
    blockerQueueRef: `CBQ_460_${normalizeToken(scenarioState)}`,
    queueState:
      scenarioState === "permission_denied"
        ? "permission_denied"
        : rawItems.length === 0
          ? "empty"
          : rows.some((row) => row.rowState === "blocked")
            ? "blocked"
            : "open",
    activeOwnerFilter: ownerFilter,
    activeBlockerFilter: blockerFilter,
    blockerCount: rawItems.length,
    items,
  };
}

function createRuntimeCoverage(
  rows: readonly PhaseConformanceRowProjection[],
  scorecard: CrossPhaseConformanceScorecard,
): RuntimeTupleCoverageBandProjection {
  const runtimeRefs = rows.flatMap((row) => row.runtimePublicationBundleRefs);
  const verificationRefs = rows.flatMap((row) => row.verificationScenarioRefs);
  const recoveryRefs = rows.flatMap((row) => row.recoveryDispositionRefs);
  const coverageState = worstState(rows.map((row) => row.verificationCoverageState));
  return {
    runtimeTupleCoverageRef: `RTCB_460_${scorecard.crossPhaseConformanceScorecardId}`,
    runtimeBundleCount: new Set(runtimeRefs).size,
    verificationScenarioCount: new Set(verificationRefs).size,
    recoveryDispositionCount: new Set(recoveryRefs).size,
    coverageState,
    tupleHashRef: scorecard.scorecardHash,
    summary:
      coverageState === "exact"
        ? "Runtime publication, verification scenarios, and recovery dispositions are pinned to the same scorecard tuple."
        : "Runtime tuple coverage is not exact; BAU signoff cannot rely on surrounding green checks.",
  };
}

function createGovernanceOpsRail(
  rows: readonly PhaseConformanceRowProjection[],
): GovernanceOpsProofRailProjection {
  const governanceProofState = worstState(rows.map((row) => row.governanceProofState));
  const operationsProofState = worstState(rows.map((row) => row.operationalProofState));
  const recoveryPostureState = worstState(rows.map((row) => row.recoveryPostureState));
  return {
    proofRailRef: "GOPR_460_GOV_OPS_PROOF",
    governanceProofState,
    operationsProofState,
    recoveryPostureState,
    governanceBundleCount: new Set(rows.flatMap((row) => row.governanceProofRefs)).size,
    opsSliceCount: new Set(rows.flatMap((row) => row.opsProofRefs)).size,
    recoveryDispositionCount: new Set(rows.flatMap((row) => row.recoveryDispositionRefs)).size,
    proofRefs: [
      ...new Set([
        ...rows.flatMap((row) => row.governanceProofRefs),
        ...rows.flatMap((row) => row.opsProofRefs),
        ...rows.flatMap((row) => row.recoveryDispositionRefs),
      ]),
    ].sort(),
  };
}

function createMatrix(
  rows: readonly PhaseConformanceRowProjection[],
): CrossPhaseControlFamilyMatrixProjection {
  const matrixState = worstState(rows.map((row) => row.rowState));
  const cells = controlFamilies.flatMap((family, familyIndex) =>
    proofDimensions.map((dimension, dimensionIndex) => {
      const sourceRow = rows[(familyIndex + dimensionIndex) % Math.max(1, rows.length)];
      const state: CrossPhaseControlFamilyMatrixCellProjection["state"] =
        sourceRow?.rowKind === "deferred_channel" && family === "artifact presentation"
          ? "deferred"
          : sourceRow
            ? stateForDimension(sourceRow, dimension) === "partial"
              ? "stale"
              : (stateForDimension(sourceRow, dimension) as ConformanceState)
            : "blocked";
      return {
        cellRef: `matrix:460:${family.replace(/[^a-z0-9]+/gi, "-")}:${dimension}`,
        controlFamily: family,
        dimension,
        state,
        text:
          state === "exact"
            ? "Exact proof"
            : state === "deferred"
              ? "Deferred scope"
              : titleForState(state),
        consequence:
          state === "exact" || state === "deferred"
            ? "Does not block BAU signoff for the current live scope."
            : "Blocks signoff until the same proof row reconciles.",
      };
    }),
  );
  return {
    matrixRef: "CPCM_460_SHARED_CONTROLS",
    state: matrixState,
    families: controlFamilies,
    dimensions: proofDimensions,
    cells,
  };
}

function titleForState(state: string): string {
  return state
    .split(/[_-]/g)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function createTrace(
  row: PhaseConformanceRowProjection,
  drawerOpen: boolean,
): ConformanceSourceTraceProjection {
  return {
    sourceTraceRef: `CSTD_460_${row.phaseConformanceRowId}`,
    selectedRowRef: row.phaseConformanceRowId,
    selectedRowLabel: row.phaseLabel,
    drawerState: drawerOpen ? "open" : "closed",
    returnTokenRef: `return-token:460:/ops/conformance:${row.phaseConformanceRowId}`,
    steps: [
      {
        stepKey: "summary",
        label: "Summary",
        state: row.summaryAlignmentState,
        sourceRefs: row.summarySourceRefs,
        consequence: "Planning summary must not describe a simpler system than live proof.",
      },
      {
        stepKey: "blueprint",
        label: "Blueprint",
        state: row.contractAdoptionState,
        sourceRefs: row.canonicalBlueprintRefs,
        consequence: "Canonical contracts decide whether this claim can be adopted.",
      },
      {
        stepKey: "runtime",
        label: "Runtime",
        state: row.verificationCoverageState,
        sourceRefs: row.runtimePublicationBundleRefs,
        consequence: "Runtime publication must be pinned to the same scorecard tuple.",
      },
      {
        stepKey: "verification",
        label: "Verification",
        state: row.verificationCoverageState,
        sourceRefs: row.verificationScenarioRefs,
        consequence: "Verification scenarios must cover the affected phase and control family.",
      },
      {
        stepKey: "governance",
        label: "Governance",
        state: row.governanceProofState,
        sourceRefs: row.governanceProofRefs,
        consequence: "Governance proof cannot be detached from operations proof.",
      },
      {
        stepKey: "operations",
        label: "Operations",
        state: row.operationalProofState,
        sourceRefs: row.opsProofRefs,
        consequence: "Operations proof must be exact before signoff can claim BAU readiness.",
      },
      {
        stepKey: "recovery",
        label: "Recovery",
        state: row.recoveryPostureState,
        sourceRefs: row.recoveryDispositionRefs,
        consequence: "Release recovery disposition must remain current.",
      },
      {
        stepKey: "end_state",
        label: "End-state proof",
        state: row.rowKind === "deferred_channel" ? "deferred" : row.endStateProofState,
        sourceRefs: row.endStateProofRefs,
        consequence: "Final proof refs must match the current scorecard hash.",
      },
    ],
  };
}

function createDiff(
  row: PhaseConformanceRowProjection,
  scenarioState: ConformanceScorecardScenarioState,
): ConformanceRowDiffProjection {
  const diffState: ConformanceRowDiffProjection["diffState"] =
    row.summaryAlignmentState === "blocked"
      ? "summary_drift"
      : row.verificationCoverageState === "blocked"
        ? "missing_verification"
        : scenarioState === "stale_runtime_tuple" || row.verificationCoverageState === "stale"
          ? "runtime_stale"
          : row.operationalProofState !== "exact" || row.governanceProofState !== "exact"
            ? "ops_gap"
            : "none";
  return {
    rowDiffRef: `CRD_460_${row.phaseConformanceRowId}`,
    selectedRowRef: row.phaseConformanceRowId,
    diffState,
    beforeSummary:
      "Phase summary, blueprint, runtime, governance, operations, and recovery proof are expected to resolve to one row hash.",
    afterSummary:
      diffState === "none"
        ? "No row-level contradiction is active for the selected proof row."
        : row.consequence,
    changedRefs: row.blockerRefs,
    consequence:
      diffState === "none"
        ? "Selected row can stay in BAU signoff calculation."
        : "Selected row is removed from signoff eligibility until the failed predicate is resolved.",
  };
}

function createHandoffs(row: PhaseConformanceRowProjection): readonly ConformanceSafeHandoffLink[] {
  const payloadRef = `handoff-payload:460:${row.phaseConformanceRowId}`;
  const returnTokenRef = `return-token:460:/ops/conformance:${row.phaseConformanceRowId}`;
  const handoffs = [
    ["assurance", "Assurance", "/ops/assurance"],
    ["governance", "Governance", "/ops/governance"],
    ["operations", "Operations", "/ops/overview"],
    ["resilience", "Resilience", "/ops/resilience"],
    ["incident", "Incident", "/ops/incidents"],
    ["records", "Records", "/ops/records"],
    ["release", "Release", "/ops/release"],
  ] as const satisfies readonly [ConformanceSafeHandoffLink["targetSurface"], string, string][];
  return handoffs.map(([targetSurface, label, route]) => ({
    handoffRef: `handoff:460:${targetSurface}`,
    label,
    targetSurface: targetSurface as ConformanceSafeHandoffLink["targetSurface"],
    route,
    payloadRef,
    returnTokenRef,
    selectedRowRef: row.phaseConformanceRowId,
    rawArtifactUrlSuppressed: true,
  }));
}

function createBAUSignoff(input: {
  readonly scenarioState: ConformanceScorecardScenarioState;
  readonly fixture: Phase9CrossPhaseConformanceFixture;
  readonly scorecard: CrossPhaseConformanceScorecard;
  readonly rows: readonly PhaseConformanceRowProjection[];
  readonly bauPack: BAUReadinessPack;
}): BAUSignoffReadinessProjection {
  const rowBlockers = input.rows.flatMap((row) => row.blockerRefs);
  const blockerRefs =
    input.scenarioState === "permission_denied"
      ? ["permission:conformance-scorecard:metadata-only"]
      : [...new Set([...rowBlockers, ...input.bauPack.blockerRefs])].sort();
  const actionState: BAUSignoffActionState =
    input.scenarioState === "permission_denied"
      ? "permission_denied"
      : input.scorecard.scorecardState === "exact" && blockerRefs.length === 0
        ? "ready"
        : input.scorecard.scorecardState === "stale"
          ? "diagnostic_only"
          : "blocked";
  return {
    bauReadinessRef: input.bauPack.bauReadinessPackId,
    signoffState:
      input.scenarioState === "permission_denied"
        ? "permission_denied"
        : input.bauPack.signoffState,
    actionState,
    actionAllowed: actionState === "ready",
    scorecardHashParity: input.scorecard.scorecardState === "exact" ? "matched" : "blocked",
    releaseToBAURecordRef:
      actionState === "ready"
        ? input.fixture.releaseToBAURecord.releaseToBAURecordId
        : "release-to-bau:not-created",
    blockedReleaseAttemptRef: input.fixture.blockedReleaseToBAUAttempt.attemptId,
    disabledReason:
      actionState === "ready"
        ? "Scorecard hash and required row hashes match the current proof set."
        : input.scenarioState === "permission_denied"
          ? "Permission scope allows metadata only; signoff remains unavailable."
          : input.scorecard.scorecardState === "stale"
            ? "Scorecard is stale; recompute from current proof before BAU signoff."
            : "Scorecard is blocked by row, runtime, governance, operations, or release-to-BAU proof gaps.",
    requiredRowRefs: input.rows.map((row) => row.phaseConformanceRowId),
    blockerRefs,
  };
}

export function createCrossPhaseConformanceScorecardProjection(
  options: {
    readonly scenarioState?: ConformanceScorecardScenarioState | string | null;
    readonly selectedRowRef?: string | null;
    readonly drawerOpen?: boolean;
    readonly phaseFilter?: string | null;
    readonly dimensionFilter?: string | null;
    readonly ownerFilter?: string | null;
    readonly blockerFilter?: string | null;
    readonly stateFilter?: string | null;
  } = {},
): CrossPhaseConformanceScorecardProjection {
  const scenarioState = normalizeConformanceScorecardScenarioState(options.scenarioState);
  const fixture = createPhase9CrossPhaseConformanceFixture();
  const scorecard = scorecardForScenario(fixture, scenarioState);
  const rawRows = rowsForScenario(fixture, scenarioState);
  const initialSelectedRowRef =
    options.selectedRowRef &&
    rawRows.some((row) => row.phaseConformanceRowId === options.selectedRowRef)
      ? options.selectedRowRef
      : rawRows[0]?.phaseConformanceRowId;
  const projectedRows = rawRows.map((row) =>
    projectRow(row, scorecard.scorecardState, scenarioState, initialSelectedRowRef ?? "none"),
  );
  const filters = createFilterSet({
    rows: projectedRows,
    phaseFilter: options.phaseFilter,
    dimensionFilter: options.dimensionFilter,
    ownerFilter: options.ownerFilter,
    blockerFilter: options.blockerFilter,
    stateFilter: options.stateFilter,
  });
  const visibleRows = filterRows(projectedRows, filters);
  const selectedRow =
    projectedRows.find((row) => row.phaseConformanceRowId === initialSelectedRowRef) ??
    visibleRows[0] ??
    projectedRows[0]!;
  const rowsWithSelection = projectedRows.map((row) => ({
    ...row,
    selected: row.phaseConformanceRowId === selectedRow.phaseConformanceRowId,
  }));
  const visibleRowsWithSelection = filterRows(rowsWithSelection, filters);
  const bauPack = bauPackForScenario(fixture, scenarioState);

  return {
    taskId: CONFORMANCE_SCORECARD_TASK_ID,
    schemaVersion: CONFORMANCE_SCORECARD_SCHEMA_VERSION,
    route: "/ops/conformance",
    visualMode: CONFORMANCE_SCORECARD_VISUAL_MODE,
    scenarioState,
    releaseRef: scorecard.releaseRef,
    tenantScope: scorecard.tenantScope,
    boardScopeRef: OPS_OVERVIEW_BOARD_SCOPE_REF,
    timeHorizon: OPS_OVERVIEW_TIME_HORIZON,
    scopePolicyRef: OPS_OVERVIEW_SCOPE_POLICY_REF,
    shellContinuityKey: OPS_OVERVIEW_SHELL_CONTINUITY_KEY,
    selectedRowRef: selectedRow.phaseConformanceRowId,
    scorecardHash: {
      scorecardHashCardRef: `SHC_460_${scorecard.crossPhaseConformanceScorecardId}`,
      scorecardRef: scorecard.crossPhaseConformanceScorecardId,
      scorecardState: scorecard.scorecardState,
      scorecardHash: scorecard.scorecardHash,
      hashPrefix: scorecard.scorecardHash.slice(0, 12),
      generatedAt: scorecard.generatedAt,
      graphVerdictState: scorecard.scorecardState,
      signoffConsequence:
        scorecard.scorecardState === "exact"
          ? "BAU signoff can proceed only while every visible required row hash remains exact."
          : "BAU signoff and release-to-BAU record creation are blocked.",
    },
    filters,
    phaseRows: rowsWithSelection,
    visibleRows: visibleRowsWithSelection,
    controlFamilyMatrix: createMatrix(rowsWithSelection),
    runtimeTupleCoverage: createRuntimeCoverage(rowsWithSelection, scorecard),
    governanceOpsProofRail: createGovernanceOpsRail(rowsWithSelection),
    blockerQueue: createBlockers(
      rowsWithSelection,
      selectedRow.phaseConformanceRowId,
      filters.ownerFilter,
      filters.blockerFilter,
      scenarioState,
    ),
    bauSignoffReadiness: createBAUSignoff({
      scenarioState,
      fixture,
      scorecard,
      rows: rowsWithSelection,
      bauPack,
    }),
    sourceTrace: createTrace(selectedRow, options.drawerOpen ?? true),
    rowDiff: createDiff(selectedRow, scenarioState),
    safeHandoffLinks: createHandoffs(selectedRow),
    noRawArtifactUrls: true,
    interfaceGapArtifactRef: CONFORMANCE_SCORECARD_GAP_ARTIFACT_REF,
    sourceAlgorithmRefs,
    upstreamSchemaVersions: {
      ...fixture.upstreamSchemaVersions,
      "449": PHASE9_CROSS_PHASE_CONFORMANCE_VERSION,
      "460": CONFORMANCE_SCORECARD_SCHEMA_VERSION,
    },
    automationAnchors,
  };
}

export function createCrossPhaseConformanceScorecardFixture() {
  const scenarios = [
    "exact",
    "stale",
    "blocked",
    "summary_drift",
    "missing_verification",
    "stale_runtime_tuple",
    "missing_ops_proof",
    "deferred_channel",
    "no_blocker",
    "permission_denied",
  ] as const;
  return {
    taskId: CONFORMANCE_SCORECARD_TASK_ID,
    schemaVersion: CONFORMANCE_SCORECARD_SCHEMA_VERSION,
    route: "/ops/conformance" as const,
    visualMode: CONFORMANCE_SCORECARD_VISUAL_MODE,
    interfaceGapArtifactRef: CONFORMANCE_SCORECARD_GAP_ARTIFACT_REF,
    sourceAlgorithmRefs,
    upstreamSchemaVersions: {
      ...createPhase9CrossPhaseConformanceFixture().upstreamSchemaVersions,
      "449": PHASE9_CROSS_PHASE_CONFORMANCE_VERSION,
      "460": CONFORMANCE_SCORECARD_SCHEMA_VERSION,
    },
    automationAnchors,
    scenarioProjections: Object.fromEntries(
      scenarios.map((scenarioState) => [
        scenarioState,
        createCrossPhaseConformanceScorecardProjection({ scenarioState }),
      ]),
    ) as Record<(typeof scenarios)[number], CrossPhaseConformanceScorecardProjection>,
  };
}
