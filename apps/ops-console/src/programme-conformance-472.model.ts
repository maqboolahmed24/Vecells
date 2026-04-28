import scorecardArtifact from "../../../data/conformance/472_cross_phase_conformance_scorecard.json";
import phaseRowsArtifact from "../../../data/conformance/472_phase_conformance_rows.json";
import controlRowsArtifact from "../../../data/conformance/472_cross_phase_control_family_rows.json";
import deferredScopeArtifact from "../../../data/conformance/472_deferred_scope_and_phase7_dependency_note.json";
import summaryCorrectionsArtifact from "../../../data/conformance/472_summary_alignment_corrections.json";

export type ProgrammeConformance472ScenarioState =
  | "exact"
  | "blocked"
  | "deferred_scope"
  | "summary_drift";

export type ProgrammeConformance472RowState = "exact" | "blocked" | "deferred_scope";

export interface ProgrammeConformance472RowProjection {
  readonly rowId: string;
  readonly rowKind: "phase" | "phase_deferred_scope" | "control_family";
  readonly rowCode: string;
  readonly label: string;
  readonly owner: string;
  readonly mandatoryForCurrentCoreRelease: boolean;
  readonly permittedDeferredScope: boolean;
  readonly rowState: ProgrammeConformance472RowState;
  readonly summaryAlignmentState: string;
  readonly contractAdoptionState: string;
  readonly verificationCoverageState: string;
  readonly operationalProofState: string;
  readonly governanceProofState: string;
  readonly endStateProofState: string;
  readonly rowHash: string;
  readonly sourceRefs: readonly string[];
  readonly requiredProofRefs: readonly string[];
  readonly activeDependencyRefs: readonly string[];
  readonly correctionRefs: readonly string[];
  readonly consequence: string;
  readonly nextSafeAction: string;
  readonly selected: boolean;
}

export interface ProgrammeConformance472CorrectionProjection {
  readonly correctionId: string;
  readonly sourceRef: string;
  readonly staleOrFlattenedClaim: string;
  readonly originalClaimState: "blocked";
  readonly correctedState: string;
  readonly correctionApplied: boolean;
  readonly affectedRows: readonly string[];
  readonly requiredCorrection: string;
}

export interface ProgrammeConformance472HandoffProjection {
  readonly handoffRef: string;
  readonly label: string;
  readonly route: string;
  readonly selectedRowRef: string;
  readonly returnTokenRef: string;
  readonly safeReturnToken: string;
  readonly artifactPresentationContract: "required";
  readonly outboundNavigationGrant: "required";
  readonly rawArtifactUrlSuppressed: true;
}

export interface ProgrammeConformance472Projection {
  readonly visualMode: "Programme_472_Cross_Phase_Conformance";
  readonly scenarioState: ProgrammeConformance472ScenarioState;
  readonly scorecardId: string;
  readonly releaseRef: string;
  readonly tenantScope: string;
  readonly authoritativeScorecardState: "exact" | "blocked";
  readonly scorecardState: "exact" | "blocked";
  readonly scorecardHash: string;
  readonly scorecardHashPrefix: string;
  readonly summaryAlignmentState: "exact_after_correction" | "blocked";
  readonly summaryCorrectionState: "corrected" | "blocked_original_claim_visible";
  readonly deferredScopeState: "permitted_explicit" | "blocked";
  readonly bauHandoffState: "ready_for_bau_handoff" | "blocked";
  readonly phaseRowCount: number;
  readonly controlFamilyRowCount: number;
  readonly mandatoryRowCount: number;
  readonly exactMandatoryRowCount: number;
  readonly deferredRowCount: number;
  readonly blockerCount: number;
  readonly selectedRowRef: string;
  readonly selectedRow: ProgrammeConformance472RowProjection;
  readonly rows: readonly ProgrammeConformance472RowProjection[];
  readonly phaseRows: readonly ProgrammeConformance472RowProjection[];
  readonly controlFamilyRows: readonly ProgrammeConformance472RowProjection[];
  readonly deferredScope: {
    readonly deferredPhaseRowId: string;
    readonly phase7LiveNhsAppLaunchState: string;
    readonly activeDependenciesRemainCurrent: boolean;
    readonly activeDependencyRefs: readonly string[];
    readonly scorecardRule: string;
    readonly followUpTask: string;
  };
  readonly summaryCorrections: readonly ProgrammeConformance472CorrectionProjection[];
  readonly sourceTraceRefs: readonly string[];
  readonly handoffs: readonly ProgrammeConformance472HandoffProjection[];
  readonly noRawArtifactUrls: true;
}

type RawRow = Omit<ProgrammeConformance472RowProjection, "selected">;

const scorecard = scorecardArtifact as {
  readonly scorecardId: string;
  readonly releaseRef: string;
  readonly tenantScope: string;
  readonly scorecardState: "exact" | "blocked";
  readonly scorecardHash: string;
  readonly summaryAlignmentState: "exact_after_correction" | "blocked";
  readonly deferredScopeState: "permitted_explicit" | "blocked";
  readonly bauHandoffState: "ready_for_bau_handoff" | "blocked";
  readonly phaseRowCount: number;
  readonly controlFamilyRowCount: number;
  readonly mandatoryRowCount: number;
  readonly exactMandatoryRowCount: number;
  readonly deferredRowCount: number;
  readonly blockerCount: number;
  readonly sourceAlgorithmRefs: readonly string[];
  readonly upstreamArtifactRefs: readonly string[];
};

const phaseRows = (phaseRowsArtifact as { readonly rows: readonly RawRow[] }).rows;
const controlFamilyRows = (controlRowsArtifact as { readonly rows: readonly RawRow[] }).rows;
const deferredScope = deferredScopeArtifact as ProgrammeConformance472Projection["deferredScope"];
const summaryCorrections = (
  summaryCorrectionsArtifact as {
    readonly blockedClaimExamples: readonly ProgrammeConformance472CorrectionProjection[];
  }
).blockedClaimExamples;

export function normalizeProgrammeConformance472ScenarioState(
  value: string | null | undefined,
): ProgrammeConformance472ScenarioState {
  return value === "blocked" || value === "deferred_scope" || value === "summary_drift"
    ? value
    : "exact";
}

function selectedRowForScenario(
  scenarioState: ProgrammeConformance472ScenarioState,
  requestedRowRef: string | null | undefined,
  rows: readonly ProgrammeConformance472RowProjection[],
): ProgrammeConformance472RowProjection {
  const scenarioDefault =
    scenarioState === "deferred_scope"
      ? "phase_7_deferred_nhs_app_channel_scope"
      : scenarioState === "summary_drift"
        ? "phase_9_assurance_ledger_bau_transfer"
        : rows[0]?.rowId;
  const selected =
    rows.find((row) => row.rowId === requestedRowRef) ??
    rows.find((row) => row.rowId === scenarioDefault) ??
    rows[0];
  if (!selected) {
    throw new Error("Task 472 programme conformance rows are missing.");
  }
  return selected;
}

function projectRows(
  rows: readonly RawRow[],
  selectedRowRef: string | null,
): readonly ProgrammeConformance472RowProjection[] {
  return rows.map((row) => ({
    ...row,
    selected: row.rowId === selectedRowRef,
  }));
}

function scenarioScorecardState(
  scenarioState: ProgrammeConformance472ScenarioState,
): "exact" | "blocked" {
  return scenarioState === "blocked" || scenarioState === "summary_drift"
    ? "blocked"
    : scorecard.scorecardState;
}

export function createProgrammeConformance472Projection(
  scenarioState: ProgrammeConformance472ScenarioState = "exact",
  selectedRowRef: string | null = null,
): ProgrammeConformance472Projection {
  const unselectedRows = [...phaseRows, ...controlFamilyRows].map((row) => ({
    ...row,
    selected: false,
  }));
  const selectedRow = selectedRowForScenario(scenarioState, selectedRowRef, unselectedRows);
  const projectedPhaseRows = projectRows(phaseRows, selectedRow.rowId);
  const projectedControlRows = projectRows(controlFamilyRows, selectedRow.rowId);
  const projectedRows = [...projectedPhaseRows, ...projectedControlRows];
  const projectedSelectedRow = projectedRows.find((row) => row.rowId === selectedRow.rowId);
  if (!projectedSelectedRow) {
    throw new Error(`Task 472 selected row is missing: ${selectedRow.rowId}`);
  }
  const displayedScorecardState = scenarioScorecardState(scenarioState);
  const displayedSummaryState =
    scenarioState === "summary_drift" ? "blocked" : scorecard.summaryAlignmentState;
  const displayedDeferredScopeState =
    scenarioState === "blocked" ? "blocked" : scorecard.deferredScopeState;
  const displayedBlockerCount =
    scenarioState === "blocked" || scenarioState === "summary_drift"
      ? summaryCorrections.length
      : scorecard.blockerCount;
  const safeReturnToken = `ORT_472_${selectedRow.rowId}`;

  return {
    visualMode: "Programme_472_Cross_Phase_Conformance",
    scenarioState,
    scorecardId: scorecard.scorecardId,
    releaseRef: scorecard.releaseRef,
    tenantScope: scorecard.tenantScope,
    authoritativeScorecardState: scorecard.scorecardState,
    scorecardState: displayedScorecardState,
    scorecardHash: scorecard.scorecardHash,
    scorecardHashPrefix: scorecard.scorecardHash.slice(0, 16),
    summaryAlignmentState: displayedSummaryState,
    summaryCorrectionState:
      scenarioState === "summary_drift" ? "blocked_original_claim_visible" : "corrected",
    deferredScopeState: displayedDeferredScopeState,
    bauHandoffState: displayedScorecardState === "exact" ? scorecard.bauHandoffState : "blocked",
    phaseRowCount: scorecard.phaseRowCount,
    controlFamilyRowCount: scorecard.controlFamilyRowCount,
    mandatoryRowCount: scorecard.mandatoryRowCount,
    exactMandatoryRowCount: scorecard.exactMandatoryRowCount,
    deferredRowCount: scorecard.deferredRowCount,
    blockerCount: displayedBlockerCount,
    selectedRowRef: selectedRow.rowId,
    selectedRow: projectedSelectedRow,
    rows: projectedRows,
    phaseRows: projectedPhaseRows,
    controlFamilyRows: projectedControlRows,
    deferredScope,
    summaryCorrections,
    sourceTraceRefs: [
      ...scorecard.sourceAlgorithmRefs.slice(0, 6),
      ...scorecard.upstreamArtifactRefs.slice(-6),
    ],
    handoffs: [
      {
        handoffRef: `programme-472-handoff:${selectedRow.rowId}`,
        label: "Open selected row evidence",
        route: `/ops/conformance?programme=472&programmeState=${scenarioState}&selectedProgrammeRow=${selectedRow.rowId}`,
        selectedRowRef: selectedRow.rowId,
        returnTokenRef: `return-token:programme-472:${selectedRow.rowId}`,
        safeReturnToken,
        artifactPresentationContract: "required",
        outboundNavigationGrant: "required",
        rawArtifactUrlSuppressed: true,
      },
    ],
    noRawArtifactUrls: true,
  };
}
