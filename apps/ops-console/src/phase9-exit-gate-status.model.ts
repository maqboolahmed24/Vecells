import phase9ExitGateEvidence from "../../../data/evidence/471_phase9_exit_gate_decision.json";
import type {
  Phase9ExitGateDecision,
  Phase9ExitGateReadModel,
} from "../../../packages/domains/analytics_assurance/src/phase9-exit-gate";

export type Phase9ExitGateScenarioState = "exact" | "blocked" | "missing";

export interface Phase9ExitGateStatusProjection extends Phase9ExitGateReadModel {
  readonly scenarioState: Phase9ExitGateScenarioState;
  readonly visualMode: "Phase9_Exit_Gate_Status";
  readonly exactRowCount: number;
  readonly mandatoryRowCount: number;
  readonly blockerCount: number;
  readonly selectedBlockerRef: string | null;
  readonly noRawArtifactUrls: true;
}

type Phase9ExitGateEvidenceArtifact = {
  readonly decision: Phase9ExitGateDecision;
  readonly readModel: Phase9ExitGateReadModel;
  readonly blockedDecisionExample: Phase9ExitGateDecision;
  readonly missingProofDecisionExample: Phase9ExitGateDecision;
};

const evidence = phase9ExitGateEvidence as unknown as Phase9ExitGateEvidenceArtifact;

export function normalizePhase9ExitGateScenarioState(
  value: string | null | undefined,
): Phase9ExitGateScenarioState {
  return value === "blocked" || value === "missing" ? value : "exact";
}

function readModelFromDecision(decision: Phase9ExitGateDecision): Phase9ExitGateReadModel {
  const approvalControlState = decision.approvalPermitted ? "enabled" : "disabled";
  return {
    routeRef: decision.approvalPermitted
      ? "/ops/conformance?exitGate=exact"
      : "/ops/conformance?exitGate=blocked",
    dataSurface: "phase9-exit-gate-status",
    decisionState: decision.decisionState,
    approvalControlState,
    approvalDisabledReason: decision.approvalPermitted
      ? "All mandatory Phase 9 proof rows are exact."
      : "Approval is disabled until every mandatory proof row is exact and the scorecard remains exact.",
    statusHeadline: decision.approvalPermitted
      ? "Phase 9 exit gate approved"
      : "Phase 9 exit gate blocked",
    completionEvidenceBundleHash:
      decision.completionEvidenceBundle.completionEvidenceBundleHash,
    releaseToBAURecordGuardState: decision.releaseToBAURecordGuard.guardState,
    rows: decision.checklistRows.map((row) => ({
      rowId: row.rowId,
      title: row.title,
      owner: row.owner,
      mandatory: row.mandatory,
      rowState: row.rowState,
      rowHash: row.rowHash,
      nextSafeAction: row.nextSafeAction,
    })),
    blockers: decision.blockers.map((blocker) => ({
      blockerId: blocker.blockerId,
      owner: blocker.owner,
      machineReason: blocker.machineReason,
      nextSafeAction: blocker.nextSafeAction,
    })),
    artifactHandoffs: [
      {
        handoffRef: `handoff:phase9-exit-gate:${decision.phase9ExitGateDecisionId}`,
        label: "Completion evidence bundle",
        payloadClass: "metadata_only",
        artifactPresentationContract: "required",
        outboundNavigationGrant: "required",
        safeReturnToken: `ORT_471_${decision.phase9ExitGateDecisionId}`,
        rawArtifactUrlSuppressed: true,
      },
    ],
  };
}

export function createPhase9ExitGateStatusProjection(
  scenarioState: Phase9ExitGateScenarioState = "exact",
): Phase9ExitGateStatusProjection {
  const readModel =
    scenarioState === "blocked"
      ? readModelFromDecision(evidence.blockedDecisionExample)
      : scenarioState === "missing"
        ? readModelFromDecision(evidence.missingProofDecisionExample)
        : evidence.readModel;
  return {
    ...readModel,
    scenarioState,
    visualMode: "Phase9_Exit_Gate_Status",
    exactRowCount: readModel.rows.filter((row) => row.rowState === "exact").length,
    mandatoryRowCount: readModel.rows.filter((row) => row.mandatory).length,
    blockerCount: readModel.blockers.length,
    selectedBlockerRef: readModel.blockers[0]?.blockerId ?? null,
    noRawArtifactUrls: true,
  };
}
