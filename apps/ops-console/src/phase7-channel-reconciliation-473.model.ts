import reconciliationArtifact from "../../../data/conformance/473_phase7_channel_readiness_reconciliation.json";
import rowPatchArtifact from "../../../data/conformance/473_phase7_phase_conformance_row_patch.json";
import coverageMatrixArtifact from "../../../data/conformance/473_phase7_embedded_surface_coverage_matrix.json";
import blockersArtifact from "../../../data/conformance/473_phase7_deferred_scope_blockers.json";
import masterScorecardAfterArtifact from "../../../data/conformance/473_master_scorecard_after_phase7_reconciliation.json";

export type Phase7ChannelScenarioState =
  | "exact"
  | "deferred"
  | "blocked"
  | "stale"
  | "not_applicable"
  | "superseded";

export type Phase7ChannelReadinessState =
  | "ready_to_reconcile"
  | "deferred"
  | "blocked"
  | "stale"
  | "not_applicable"
  | "superseded";

export interface Phase7ChannelRouteCoverageProjection {
  readonly coverageRowId: string;
  readonly routeFamily: string;
  readonly journeyPathRefs: readonly string[];
  readonly coverageState: "exact" | "blocked" | "stale" | "not_applicable";
  readonly manifestRef: string;
  readonly routeContractRefs: readonly string[];
  readonly routeFreezeDispositionRefs: readonly string[];
  readonly fallbackRefs: readonly string[];
  readonly proofRefs: readonly string[];
  readonly blockerRefs: readonly string[];
  readonly rowHash: string;
  readonly selected: boolean;
}

export interface Phase7ChannelBlockerProjection {
  readonly blockerId: string;
  readonly blockerState: string;
  readonly reasonCode: string;
  readonly owner: string;
  readonly sourceRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly nextSafeAction: string;
  readonly blockerHash: string;
}

export interface Phase7ChannelReconciliation473Projection {
  readonly visualMode: "Phase7_Channel_Reconciliation_473";
  readonly scenarioState: Phase7ChannelScenarioState;
  readonly readinessState: Phase7ChannelReadinessState;
  readonly scorecardState: "exact" | "blocked";
  readonly rowState: "exact" | "deferred_scope" | "blocked" | "stale" | "not_applicable";
  readonly reconcileActionState: "enabled" | "frozen_until_authority_exact";
  readonly channelActivationPermitted: boolean;
  readonly releaseRef: string;
  readonly tenantScope: string;
  readonly manifestVersionRef: string;
  readonly rowHash: string;
  readonly rowHashPrefix: string;
  readonly sourceScorecardHash: string;
  readonly afterScorecardHash: string;
  readonly selectedRouteFamily: string;
  readonly routeRows: readonly Phase7ChannelRouteCoverageProjection[];
  readonly selectedRoute: Phase7ChannelRouteCoverageProjection;
  readonly blockers: readonly Phase7ChannelBlockerProjection[];
  readonly environmentProfileRefs: readonly string[];
  readonly scalBundleRef: string | null;
  readonly optionalFutureInputStates: readonly {
    readonly taskId: string;
    readonly expectedArtifactRef: string;
    readonly availabilityState: "available" | "not_yet_available";
  }[];
  readonly sourceTraceRefs: readonly string[];
  readonly noRawArtifactUrls: true;
  readonly responsiveContract: "mission_stack_blockers_visible";
}

type ScenarioExample = {
  readonly readinessState: Phase7ChannelReadinessState;
  readonly scorecardState: "exact" | "blocked";
  readonly rowState: "exact" | "deferred_scope" | "blocked" | "stale" | "not_applicable";
  readonly channelActivationPermitted: boolean;
  readonly blockerCount: number;
  readonly selectedRouteFamily: string;
  readonly reconcileActionState: "enabled" | "frozen_until_authority_exact";
};

const reconciliation = reconciliationArtifact as {
  readonly releaseRef: string;
  readonly tenantScope: string;
  readonly readinessPredicate: {
    readonly state: Phase7ChannelReadinessState;
    readonly manifestVersionRef: string;
    readonly sourceRefs: readonly string[];
    readonly evidenceRefs: readonly string[];
    readonly optionalFutureInputStates: readonly Phase7ChannelReconciliation473Projection["optionalFutureInputStates"][number][];
  };
  readonly scenarioExamples: Record<Phase7ChannelReadinessState, ScenarioExample>;
};

const rowPatch = rowPatchArtifact as {
  readonly rowHash: string;
  readonly environmentProfileRefs: readonly string[];
  readonly scalBundleRef: string | null;
};

const coverageRows = (
  coverageMatrixArtifact as {
    readonly rows: readonly Omit<Phase7ChannelRouteCoverageProjection, "selected">[];
    readonly edgeCaseMatrix: readonly {
      readonly edgeCaseId: string;
      readonly expectedState: Phase7ChannelReadinessState;
      readonly assertion: string;
      readonly sourceRefs: readonly string[];
      readonly edgeCaseHash: string;
    }[];
  }
).rows;

const edgeCaseMatrix = (
  coverageMatrixArtifact as {
    readonly edgeCaseMatrix: readonly {
      readonly edgeCaseId: string;
      readonly expectedState: Phase7ChannelReadinessState;
      readonly assertion: string;
      readonly sourceRefs: readonly string[];
      readonly edgeCaseHash: string;
    }[];
  }
).edgeCaseMatrix;

const deferredBlockers = (
  blockersArtifact as {
    readonly blockers: readonly Phase7ChannelBlockerProjection[];
  }
).blockers;

const masterAfter = masterScorecardAfterArtifact as {
  readonly sourceScorecardHash: string;
  readonly scorecardHash: string;
};

export function normalizePhase7ChannelScenarioState(
  value: string | null | undefined,
): Phase7ChannelScenarioState {
  if (
    value === "exact" ||
    value === "deferred" ||
    value === "blocked" ||
    value === "stale" ||
    value === "not_applicable" ||
    value === "superseded"
  ) {
    return value;
  }
  return "deferred";
}

function readinessForScenario(
  scenarioState: Phase7ChannelScenarioState,
): Phase7ChannelReadinessState {
  return scenarioState === "exact" ? "ready_to_reconcile" : scenarioState;
}

function blockersForScenario(
  scenarioState: Phase7ChannelScenarioState,
): readonly Phase7ChannelBlockerProjection[] {
  const readinessState = readinessForScenario(scenarioState);
  if (scenarioState === "deferred") {
    return deferredBlockers;
  }
  if (scenarioState === "exact" || scenarioState === "not_applicable") {
    return [];
  }
  const edgeCase = edgeCaseMatrix.find((candidate) => candidate.expectedState === readinessState);
  if (!edgeCase) {
    return [];
  }
  return [
    {
      blockerId: `p7crb_473_${edgeCase.edgeCaseHash.slice(0, 16)}`,
      blockerState: readinessState,
      reasonCode: edgeCase.edgeCaseId,
      owner: "release-governance",
      sourceRefs: edgeCase.sourceRefs,
      evidenceRefs: [edgeCase.edgeCaseId],
      nextSafeAction: edgeCase.assertion,
      blockerHash: edgeCase.edgeCaseHash,
    },
  ];
}

function routeRowsForScenario(
  readinessState: Phase7ChannelReadinessState,
  selectedRouteFamily: string,
): readonly Phase7ChannelRouteCoverageProjection[] {
  return coverageRows.map((row) => {
    const forcedState =
      readinessState === "ready_to_reconcile"
        ? "exact"
        : readinessState === "not_applicable"
          ? "not_applicable"
          : readinessState === "blocked" && row.routeFamily === "booking"
            ? "blocked"
            : readinessState === "stale" && row.routeFamily === "status"
              ? "stale"
              : row.coverageState;
    return {
      ...row,
      coverageState: forcedState,
      selected: row.routeFamily === selectedRouteFamily,
    };
  });
}

export function createPhase7ChannelReconciliation473Projection(
  scenarioState: Phase7ChannelScenarioState = "deferred",
  selectedRouteFamily: string | null = null,
): Phase7ChannelReconciliation473Projection {
  const readinessState = readinessForScenario(scenarioState);
  const scenario =
    reconciliation.scenarioExamples[readinessState] ?? reconciliation.scenarioExamples.deferred;
  const selectedFamily = selectedRouteFamily ?? scenario.selectedRouteFamily;
  const routeRows = routeRowsForScenario(readinessState, selectedFamily);
  const selectedRoute = routeRows.find((row) => row.selected) ?? routeRows[0];
  if (!selectedRoute) {
    throw new Error("Task 473 route coverage rows are missing.");
  }
  return {
    visualMode: "Phase7_Channel_Reconciliation_473",
    scenarioState,
    readinessState,
    scorecardState: scenario.scorecardState,
    rowState: scenario.rowState,
    reconcileActionState: scenario.reconcileActionState,
    channelActivationPermitted: scenario.channelActivationPermitted,
    releaseRef: reconciliation.releaseRef,
    tenantScope: reconciliation.tenantScope,
    manifestVersionRef: reconciliation.readinessPredicate.manifestVersionRef,
    rowHash: rowPatch.rowHash,
    rowHashPrefix: rowPatch.rowHash.slice(0, 16),
    sourceScorecardHash: masterAfter.sourceScorecardHash,
    afterScorecardHash: masterAfter.scorecardHash,
    selectedRouteFamily: selectedRoute.routeFamily,
    routeRows,
    selectedRoute,
    blockers: blockersForScenario(scenarioState),
    environmentProfileRefs: rowPatch.environmentProfileRefs,
    scalBundleRef: rowPatch.scalBundleRef,
    optionalFutureInputStates: reconciliation.readinessPredicate.optionalFutureInputStates,
    sourceTraceRefs: [
      ...reconciliation.readinessPredicate.sourceRefs,
      ...reconciliation.readinessPredicate.evidenceRefs.slice(0, 6),
      ...selectedRoute.proofRefs,
    ],
    noRawArtifactUrls: true,
    responsiveContract: "mission_stack_blockers_visible",
  };
}
