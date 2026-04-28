import scopeArtifact from "../../../data/assistive/485_approved_cohort_scope.json";
import settlementArtifact from "../../../data/assistive/485_assistive_enablement_settlements.json";
import trustArtifact from "../../../data/assistive/485_trust_envelope_resolution.json";
import planArtifact from "../../../data/assistive/485_visible_mode_enablement_plan.json";

export type AssistiveVisible485UiState =
  | "shadow-only"
  | "visible-summary"
  | "visible-insert"
  | "observe-only"
  | "frozen"
  | "hidden"
  | "commit";

type ScenarioId =
  | "visible_insert_approved"
  | "route_verdict_shadow_only"
  | "insert_evidence_missing"
  | "envelope_downgrade_mid_session"
  | "frozen_freeze_disposition"
  | "hidden_out_of_slice"
  | "commit_missing_human_approval";

export interface AssistiveVisible485Projection {
  readonly uiState: AssistiveVisible485UiState;
  readonly scenarioId: ScenarioId;
  readonly mode: string;
  readonly modeLabel: string;
  readonly capabilityCode: string;
  readonly watchTupleHash: string;
  readonly routeFamilyRef: string;
  readonly releaseCohortRef: string;
  readonly trustEnvelopeRef: string;
  readonly rolloutVerdictRef: string;
  readonly trustState: string;
  readonly surfacePostureState: string;
  readonly actionabilityState: string;
  readonly confidencePostureState: string;
  readonly freezeState: string;
  readonly disclosureFenceHealth: string;
  readonly trustScore: number;
  readonly rolloutRung: string;
  readonly visibleSummaryAllowed: boolean;
  readonly visibleInsertAllowed: boolean;
  readonly visibleCommitCeilingAllowed: boolean;
  readonly concreteCommitAllowed: boolean;
  readonly insertControlsVisible: boolean;
  readonly regenerateControlsVisible: boolean;
  readonly exportControlsVisible: boolean;
  readonly provenanceVisible: boolean;
  readonly reviewNotice: string;
  readonly nextSafeAction: string;
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly settlementResult: string;
  readonly exposure: {
    readonly visibleStaffCount: number;
    readonly insertEnabledStaffCount: number;
    readonly hiddenOutsideCohort: boolean;
  };
}

export const assistiveVisible485States = [
  "shadow-only",
  "visible-summary",
  "visible-insert",
  "observe-only",
  "frozen",
  "hidden",
  "commit",
] as const satisfies readonly AssistiveVisible485UiState[];

const stateToScenario: Record<AssistiveVisible485UiState, ScenarioId> = {
  "shadow-only": "route_verdict_shadow_only",
  "visible-summary": "insert_evidence_missing",
  "visible-insert": "visible_insert_approved",
  "observe-only": "envelope_downgrade_mid_session",
  frozen: "frozen_freeze_disposition",
  hidden: "hidden_out_of_slice",
  commit: "commit_missing_human_approval",
};

type ScenarioRecord = { readonly scenarioId: string; readonly [key: string]: unknown };

function asArray<T extends ScenarioRecord>(value: unknown): readonly T[] {
  return Array.isArray(value) ? (value as readonly T[]) : [];
}

function asStringArray(value: unknown): readonly string[] {
  return Array.isArray(value) ? value.map((entry) => String(entry)) : [];
}

function findScenario<T extends ScenarioRecord>(
  entries: readonly T[],
  scenarioId: ScenarioId,
  label: string,
): T {
  const found = entries.find((entry) => entry.scenarioId === scenarioId);
  if (!found) throw new Error(`Missing 485 ${label} for ${scenarioId}`);
  return found;
}

function titleCase(value: string): string {
  return value
    .split(/[_:-]/g)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function normalizeAssistiveVisible485State(value: unknown): AssistiveVisible485UiState {
  return assistiveVisible485States.includes(value as AssistiveVisible485UiState)
    ? (value as AssistiveVisible485UiState)
    : "visible-insert";
}

export function createAssistiveVisible485Projection(
  uiState: AssistiveVisible485UiState = "visible-insert",
): AssistiveVisible485Projection {
  const scenarioId = stateToScenario[uiState];
  const eligibility = findScenario<any>(
    asArray<any>((planArtifact as any).eligibilityVerdicts),
    scenarioId,
    "eligibility",
  );
  const envelope = findScenario<any>(
    asArray<any>((trustArtifact as any).trustEnvelopes),
    scenarioId,
    "trust envelope",
  );
  const projection = findScenario<any>(
    asArray<any>((trustArtifact as any).trustProjections),
    scenarioId,
    "trust projection",
  );
  const verdict = findScenario<any>(
    asArray<any>((trustArtifact as any).rolloutVerdicts),
    scenarioId,
    "rollout verdict",
  );
  const exposure = findScenario<any>(
    asArray<any>((scopeArtifact as any).exposureProofs),
    scenarioId,
    "exposure proof",
  );
  const settlement = findScenario<any>(
    asArray<any>((settlementArtifact as any).settlements),
    scenarioId,
    "settlement",
  );

  return {
    uiState,
    scenarioId,
    mode: String(eligibility.eligibleMode),
    modeLabel: titleCase(String(eligibility.eligibleMode)),
    capabilityCode: String(eligibility.capabilityCode),
    watchTupleHash: String(eligibility.watchTupleHash),
    routeFamilyRef: String(verdict.routeFamilyRef),
    releaseCohortRef: String(verdict.releaseCohortRef),
    trustEnvelopeRef: String(envelope.trustEnvelopeId),
    rolloutVerdictRef: String(verdict.rolloutVerdictId),
    trustState: String(envelope.trustState),
    surfacePostureState: String(envelope.surfacePostureState),
    actionabilityState: String(envelope.actionabilityState),
    confidencePostureState: String(envelope.confidencePostureState),
    freezeState: String(envelope.freezeState),
    disclosureFenceHealth: String(envelope.disclosureFenceHealth),
    trustScore: Number(projection.trustScore ?? 0),
    rolloutRung: String(verdict.rolloutRung),
    visibleSummaryAllowed: Boolean(eligibility.visibleSummaryAllowed),
    visibleInsertAllowed: Boolean(eligibility.visibleInsertAllowed),
    visibleCommitCeilingAllowed: Boolean(eligibility.visibleCommitCeilingAllowed),
    concreteCommitAllowed: Boolean(eligibility.concreteCommitAllowed),
    insertControlsVisible: Boolean(eligibility.insertControlsVisible),
    regenerateControlsVisible: Boolean(eligibility.regenerateControlsVisible),
    exportControlsVisible: Boolean(eligibility.exportControlsVisible),
    provenanceVisible: Boolean(eligibility.provenanceVisible),
    reviewNotice: "Review before use. Assistive output is support material, not settlement.",
    nextSafeAction: String(eligibility.nextSafeAction),
    blockerRefs: asStringArray(eligibility.blockerRefs),
    evidenceRefs: asStringArray(eligibility.evidenceRefs),
    settlementResult: String(settlement.result),
    exposure: {
      visibleStaffCount: Number(exposure.visibleStaffCount ?? 0),
      insertEnabledStaffCount: Number(exposure.insertEnabledStaffCount ?? 0),
      hiddenOutsideCohort: Boolean(exposure.hiddenOutsideCohort),
    },
  };
}
