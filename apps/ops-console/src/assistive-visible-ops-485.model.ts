import scopeArtifact from "../../../data/assistive/485_approved_cohort_scope.json";
import trustArtifact from "../../../data/assistive/485_trust_envelope_resolution.json";
import planArtifact from "../../../data/assistive/485_visible_mode_enablement_plan.json";

export interface AssistiveVisibleOps485Row {
  readonly scenarioId: string;
  readonly capabilityCode: string;
  readonly watchTupleHash: string;
  readonly routeFamilyRef: string;
  readonly releaseCohortRef: string;
  readonly rolloutRung: string;
  readonly eligibleMode: string;
  readonly trustScore: number;
  readonly trustState: string;
  readonly envelopePosture: string;
  readonly actionabilityState: string;
  readonly freezeState: string;
  readonly disclosureFenceHealth: string;
  readonly visibleStaffCount: number;
  readonly insertEnabledStaffCount: number;
  readonly blockerRefs: readonly string[];
}

export interface AssistiveVisibleOps485Projection {
  readonly rows: readonly AssistiveVisibleOps485Row[];
  readonly activeRow: AssistiveVisibleOps485Row;
  readonly freezeExplanation: string;
  readonly edgeCaseCount: number;
}

type ScenarioRecord = { readonly scenarioId: string; readonly [key: string]: unknown };

function asArray<T extends ScenarioRecord>(value: unknown): readonly T[] {
  return Array.isArray(value) ? (value as readonly T[]) : [];
}

function asStringArray(value: unknown): readonly string[] {
  return Array.isArray(value) ? value.map((entry) => String(entry)) : [];
}

function findScenario<T extends ScenarioRecord>(
  entries: readonly T[],
  scenarioId: string,
  label: string,
): T {
  const found = entries.find((entry) => entry.scenarioId === scenarioId);
  if (!found) throw new Error(`Missing 485 ${label} for ${scenarioId}`);
  return found;
}

export function createAssistiveVisibleOps485Projection(): AssistiveVisibleOps485Projection {
  const eligibilityVerdicts = asArray<any>((planArtifact as any).eligibilityVerdicts);
  const rolloutVerdicts = asArray<any>((trustArtifact as any).rolloutVerdicts);
  const trustProjections = asArray<any>((trustArtifact as any).trustProjections);
  const trustEnvelopes = asArray<any>((trustArtifact as any).trustEnvelopes);
  const exposureProofs = asArray<any>((scopeArtifact as any).exposureProofs);

  const rows = eligibilityVerdicts.map((eligibility) => {
    const scenarioId = String(eligibility.scenarioId);
    const rollout = findScenario<any>(rolloutVerdicts, scenarioId, "rollout verdict");
    const projection = findScenario<any>(trustProjections, scenarioId, "trust projection");
    const envelope = findScenario<any>(trustEnvelopes, scenarioId, "trust envelope");
    const exposure = findScenario<any>(exposureProofs, scenarioId, "exposure proof");
    return {
      scenarioId,
      capabilityCode: String(eligibility.capabilityCode),
      watchTupleHash: String(eligibility.watchTupleHash),
      routeFamilyRef: String(rollout.routeFamilyRef),
      releaseCohortRef: String(rollout.releaseCohortRef),
      rolloutRung: String(rollout.rolloutRung),
      eligibleMode: String(eligibility.eligibleMode),
      trustScore: Number(projection.trustScore ?? 0),
      trustState: String(envelope.trustState),
      envelopePosture: String(envelope.surfacePostureState),
      actionabilityState: String(envelope.actionabilityState),
      freezeState: String(envelope.freezeState),
      disclosureFenceHealth: String(envelope.disclosureFenceHealth),
      visibleStaffCount: Number(exposure.visibleStaffCount ?? 0),
      insertEnabledStaffCount: Number(exposure.insertEnabledStaffCount ?? 0),
      blockerRefs: asStringArray(eligibility.blockerRefs),
    } satisfies AssistiveVisibleOps485Row;
  });
  const activeRow = rows.find((row) => row.scenarioId === "visible_insert_approved") ?? rows[0];
  if (!activeRow) throw new Error("485 Assistive Ops projection has no rows");
  return {
    rows,
    activeRow,
    freezeExplanation:
      "Frozen or degraded envelopes preserve provenance and immediately suppress insert, regenerate, export, and completion-adjacent controls.",
    edgeCaseCount: asArray<any>((planArtifact as any).edgeCaseFixtures?.fixtures).length,
  };
}
