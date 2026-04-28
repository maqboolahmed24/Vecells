import actionArtifact from "../../../data/release/484_canary_wave_actions.json";
import planArtifact from "../../../data/release/484_canary_wave_plan.json";
import policyArtifact from "../../../data/release/484_remaining_wave_observation_policies.json";
import settlementArtifact from "../../../data/release/484_canary_wave_settlements.json";
import wideningEvidenceArtifact from "../../../data/release/484_wave_widening_evidence.json";

export type CanaryRollout484State =
  | "ready"
  | "tenant_ready"
  | "channel_ready"
  | "active"
  | "paused"
  | "rollback"
  | "completed"
  | "blocked"
  | "selector_expanded";

type CanaryScenario484 =
  | "completed"
  | "ready"
  | "active"
  | "previous_stability_not_exact"
  | "support_capacity_constrained"
  | "channel_scope_blocked"
  | "selector_expanded"
  | "guardrail_breach_after_settlement"
  | "rollback_channel_gap"
  | "conflicting_scope"
  | "policy_changed_after_approval";

export type CanaryNode484State =
  | "ready"
  | "waiting"
  | "active"
  | "paused"
  | "rollback"
  | "completed"
  | "blocked";

export type CanarySelectorKind484 = "tenant" | "channel" | "mixed";

export interface CanaryExposure484 {
  readonly patients: number;
  readonly staff: number;
  readonly pharmacy: number;
  readonly hub: number;
  readonly nhs_app: number;
  readonly assistive: number;
}

export interface CanaryRollout484Node {
  readonly nodeId: "wave2" | "remaining" | "nhs_app" | "assistive";
  readonly label: string;
  readonly state: CanaryNode484State;
  readonly waveRef: string;
  readonly selectorKind: CanarySelectorKind484;
  readonly cohortScope: string;
  readonly channelScope: string;
  readonly detail: string;
  readonly blockerRef: string | null;
}

export interface CanaryRollout484Guardrail {
  readonly guardrailId: string;
  readonly label: string;
  readonly state: "exact" | "breached" | "insufficient_evidence" | "stale";
  readonly observedValue: string;
  readonly threshold: string;
  readonly interval: string;
  readonly blockerRef: string | null;
}

export interface CanaryRollout484Projection {
  readonly state: CanaryRollout484State;
  readonly scenarioId: CanaryScenario484;
  readonly releaseCandidateRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly waveRef: string;
  readonly selectorId: string;
  readonly selectorKind: CanarySelectorKind484;
  readonly selectorState: "exact" | "expanded" | "conflict" | "blocked";
  readonly baselineSelectorHash: string;
  readonly proposedSelectorHash: string;
  readonly tenantScope: string;
  readonly cohortScope: string;
  readonly channelScope: string;
  readonly routeFamilyRefs: readonly string[];
  readonly previousStabilityState: string;
  readonly decisionState: string;
  readonly settlementState: string;
  readonly observationState: string;
  readonly wideningEnabled: boolean;
  readonly recoveryDisposition: string;
  readonly actionLabel: string;
  readonly nextSafeAction: string;
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly previousExposure: CanaryExposure484;
  readonly proposedExposure: CanaryExposure484;
  readonly deltaExposure: CanaryExposure484;
  readonly maxPermittedDelta: CanaryExposure484;
  readonly blastRadiusState: "exact" | "blocked";
  readonly guardrails: readonly CanaryRollout484Guardrail[];
  readonly nodes: readonly CanaryRollout484Node[];
  readonly pauseRecord: {
    readonly state: string;
    readonly reasonCode: string;
    readonly actionRecordRef: string;
  } | null;
  readonly rollbackRecord: {
    readonly state: string;
    readonly routeRollbackReadinessState: string;
    readonly channelRollbackReadinessState: string;
    readonly rollbackMode: string;
  } | null;
  readonly policyState: string;
  readonly artifactCount: number;
}

type ScenarioRecord = {
  readonly scenarioId: CanaryScenario484;
  readonly [key: string]: unknown;
};

const stateToScenario: Record<CanaryRollout484State, CanaryScenario484> = {
  ready: "ready",
  tenant_ready: "ready",
  channel_ready: "ready",
  active: "active",
  paused: "guardrail_breach_after_settlement",
  rollback: "rollback_channel_gap",
  completed: "completed",
  blocked: "previous_stability_not_exact",
  selector_expanded: "selector_expanded",
};

export const canaryRollout484States = [
  "ready",
  "tenant_ready",
  "channel_ready",
  "active",
  "paused",
  "rollback",
  "completed",
  "blocked",
  "selector_expanded",
] as const satisfies readonly CanaryRollout484State[];

function findScenario<T extends ScenarioRecord>(
  entries: readonly T[],
  scenarioId: CanaryScenario484,
  label: string,
): T {
  const found = entries.find((entry) => entry.scenarioId === scenarioId);
  if (!found) throw new Error(`Missing 484 ${label} for ${scenarioId}`);
  return found;
}

function asRecordArray<T extends ScenarioRecord>(value: unknown): readonly T[] {
  return Array.isArray(value) ? (value as readonly T[]) : [];
}

function asStringArray(value: unknown): readonly string[] {
  return Array.isArray(value) ? value.map((entry) => String(entry)) : [];
}

function asExposure(value: unknown): CanaryExposure484 {
  const record = (value ?? {}) as Partial<CanaryExposure484>;
  return {
    patients: Number(record.patients ?? 0),
    staff: Number(record.staff ?? 0),
    pharmacy: Number(record.pharmacy ?? 0),
    hub: Number(record.hub ?? 0),
    nhs_app: Number(record.nhs_app ?? 0),
    assistive: Number(record.assistive ?? 0),
  };
}

function toNodeState(state: CanaryRollout484State, nodeId: CanaryRollout484Node["nodeId"]) {
  if (nodeId === "wave2") {
    if (state === "completed") return "completed";
    if (state === "active") return "active";
    if (state === "paused") return "paused";
    if (state === "rollback") return "rollback";
    if (state === "blocked" || state === "selector_expanded") return "blocked";
    return "ready";
  }
  if (nodeId === "remaining") return state === "completed" ? "ready" : "waiting";
  if (nodeId === "nhs_app") {
    if (state === "channel_ready") return "ready";
    if (state === "rollback") return "rollback";
    return "blocked";
  }
  return "blocked";
}

function selectorKindForState(
  state: CanaryRollout484State,
  fallback: CanarySelectorKind484,
): CanarySelectorKind484 {
  if (state === "tenant_ready") return "tenant";
  if (state === "channel_ready") return "channel";
  return fallback;
}

function actionEnabledFor(
  state: CanaryRollout484State,
  decisionState: string,
  selectorState: string,
  blockerRefs: readonly string[],
): boolean {
  return (
    (state === "ready" || state === "tenant_ready" || state === "channel_ready") &&
    decisionState === "approved" &&
    selectorState === "exact" &&
    blockerRefs.length === 0
  );
}

function buildNodes(
  state: CanaryRollout484State,
  selectorKind: CanarySelectorKind484,
  tenantScope: string,
  channelScope: string,
): CanaryRollout484Node[] {
  return [
    {
      nodeId: "wave2",
      label: "Wave 2",
      state: toNodeState(state, "wave2"),
      waveRef: "wave_476_2_core_web_staff_pharmacy_after_projection",
      selectorKind,
      cohortScope: tenantScope,
      channelScope,
      detail: "Staff and pharmacy canary after Wave 1 observation.",
      blockerRef: state === "blocked" ? "blocker:484:previous-wave-stability-not-exact" : null,
    },
    {
      nodeId: "remaining",
      label: "Remaining Tenants",
      state: toNodeState(state, "remaining"),
      waveRef: "wave_476_remaining_tenant_waves",
      selectorKind: "tenant",
      cohortScope: "wtc_476_remaining_tenant_waves",
      channelScope: "core_web",
      detail: "Deferred tenant canaries stay behind their own observation policy.",
      blockerRef: null,
    },
    {
      nodeId: "nhs_app",
      label: "NHS App",
      state: toNodeState(state, "nhs_app"),
      waveRef: "wave_476_channel_nhs_app_limited_release",
      selectorKind: "channel",
      cohortScope: "wtc_476_nhs_app_limited_release",
      channelScope: "nhs_app_limited_release",
      detail: "Channel widening depends on monthly data, route freeze, and rollback evidence.",
      blockerRef:
        state === "channel_ready"
          ? null
          : "blocker:484:tenant-core-web-eligible-channel-scope-blocked",
    },
    {
      nodeId: "assistive",
      label: "Assistive",
      state: toNodeState(state, "assistive"),
      waveRef: "wave_476_assistive_narrow_staff_cohort",
      selectorKind: "tenant",
      cohortScope: "wtc_476_assistive_narrow_staff",
      channelScope: "staff_assistive_shadow",
      detail: "Visible assistive activation remains deferred to the dedicated authority task.",
      blockerRef: "blocker:484:assistive-visible-mode-deferred",
    },
  ];
}

function guardrailLabel(ruleKind: string): string {
  if (ruleKind === "latency_budget") return "Latency p95";
  if (ruleKind === "support_capacity") return "Support capacity";
  return ruleKind
    .split(/[_:-]/g)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function normalizeCanaryRollout484State(value: unknown): CanaryRollout484State {
  return canaryRollout484States.includes(value as CanaryRollout484State)
    ? (value as CanaryRollout484State)
    : "ready";
}

export function createCanaryRollout484Projection(
  state: CanaryRollout484State = "ready",
): CanaryRollout484Projection {
  const scenarioId = stateToScenario[state];
  const decisions = asRecordArray<any>((wideningEvidenceArtifact as any).scenarioDecisions);
  const selectors = asRecordArray<any>((planArtifact as any).selectors);
  const blastRadiusProofs = asRecordArray<any>((planArtifact as any).blastRadiusProofs);
  const actions = asRecordArray<any>((actionArtifact as any).actions);
  const settlements = asRecordArray<any>((settlementArtifact as any).settlements);
  const guardrails = asRecordArray<any>((actionArtifact as any).guardrailEvaluations).filter(
    (entry) => entry.scenarioId === scenarioId,
  );
  const policies = asRecordArray<any>((policyArtifact as any).policies);
  const pauseRecords = asRecordArray<any>((settlementArtifact as any).pauseRecords);
  const rollbackRecords = asRecordArray<any>((settlementArtifact as any).rollbackRecords);

  const decision = findScenario<any>(decisions, scenarioId, "decision");
  const selector = findScenario<any>(selectors, scenarioId, "selector");
  const blastRadiusProof = findScenario<any>(blastRadiusProofs, scenarioId, "blast-radius proof");
  const action = findScenario<any>(actions, scenarioId, "action");
  const settlement = findScenario<any>(settlements, scenarioId, "settlement");
  const policy = findScenario<any>(policies, scenarioId, "policy");
  const selectorKind = selectorKindForState(state, selector.selectorKind);
  const selectorState =
    state === "tenant_ready" || state === "channel_ready" ? "exact" : selector.selectorState;
  const blockerRefs =
    state === "tenant_ready" || state === "channel_ready"
      ? []
      : asStringArray(decision.blockerRefs);
  const routeFamilyRefs =
    state === "channel_ready"
      ? ["nhs_app_embedding_control", "channel_rollback_probe"]
      : asStringArray(selector.routeFamilyRefs);
  const proposedExposure =
    state === "channel_ready"
      ? { patients: 25, staff: 6, pharmacy: 0, hub: 2, nhs_app: 0, assistive: 0 }
      : asExposure(blastRadiusProof.proposedExposure);
  const deltaExposure =
    state === "channel_ready"
      ? { patients: 0, staff: 0, pharmacy: 0, hub: 0, nhs_app: 0, assistive: 0 }
      : asExposure(blastRadiusProof.deltaExposure);
  const wideningEnabled = actionEnabledFor(
    state,
    String(decision.decisionState),
    String(selectorState),
    blockerRefs,
  );

  return {
    state,
    scenarioId,
    releaseCandidateRef: String(decision.releaseCandidateRef),
    runtimePublicationBundleRef: String(decision.runtimePublicationBundleRef),
    waveRef: String(decision.waveRef),
    selectorId: String(selector.selectorId),
    selectorKind,
    selectorState,
    baselineSelectorHash: String(selector.baselineSelectorHash),
    proposedSelectorHash:
      state === "tenant_ready" || state === "channel_ready"
        ? String(selector.baselineSelectorHash)
        : String(selector.proposedSelectorHash),
    tenantScope: String(selector.tenantScope),
    cohortScope: String(selector.cohortScope),
    channelScope:
      state === "channel_ready" ? "nhs_app_shadow_zero_external" : String(selector.channelScope),
    routeFamilyRefs,
    previousStabilityState: String(decision.previousStabilityState),
    decisionState: String(decision.decisionState),
    settlementState: String(settlement.result),
    observationState: String(settlement.observationState),
    wideningEnabled,
    recoveryDisposition: String(settlement.recoveryActionRef),
    actionLabel: wideningEnabled ? "Submit guarded canary" : "Widening held",
    nextSafeAction: String(decision.nextSafeAction),
    blockerRefs,
    evidenceRefs: [
      ...asStringArray(decision.evidenceRefs),
      String(action.canaryWaveActionRecordId),
    ],
    previousExposure: asExposure(blastRadiusProof.previousExposure),
    proposedExposure,
    deltaExposure,
    maxPermittedDelta: asExposure(blastRadiusProof.maxPermittedDelta),
    blastRadiusState: state === "channel_ready" ? "exact" : blastRadiusProof.blastRadiusState,
    guardrails: guardrails.map((entry) => ({
      guardrailId: String(entry.evaluationId),
      label: guardrailLabel(String(entry.ruleKind)),
      state: entry.state,
      observedValue: `${entry.observedValue} ${entry.unit}`,
      threshold: `${entry.comparator} ${entry.threshold} ${entry.unit}`,
      interval: String(entry.interval),
      blockerRef: asStringArray(entry.blockerRefs)[0] ?? null,
    })),
    nodes: buildNodes(
      state,
      selectorKind,
      String(selector.tenantScope),
      String(selector.channelScope),
    ),
    pauseRecord:
      pauseRecords.find((record) => record.scenarioId === scenarioId) === undefined
        ? null
        : {
            state: String(pauseRecords.find((record) => record.scenarioId === scenarioId)?.state),
            reasonCode: String(
              pauseRecords.find((record) => record.scenarioId === scenarioId)?.reasonCode,
            ),
            actionRecordRef: String(
              pauseRecords.find((record) => record.scenarioId === scenarioId)?.actionRecordRef,
            ),
          },
    rollbackRecord:
      rollbackRecords.find((record) => record.scenarioId === scenarioId) === undefined
        ? null
        : {
            state: String(
              rollbackRecords.find((record) => record.scenarioId === scenarioId)?.state,
            ),
            routeRollbackReadinessState: String(
              rollbackRecords.find((record) => record.scenarioId === scenarioId)
                ?.routeRollbackReadinessState,
            ),
            channelRollbackReadinessState: String(
              rollbackRecords.find((record) => record.scenarioId === scenarioId)
                ?.channelRollbackReadinessState,
            ),
            rollbackMode: String(
              rollbackRecords.find((record) => record.scenarioId === scenarioId)?.rollbackMode,
            ),
          },
    policyState: String(policy.policyState),
    artifactCount: asStringArray((wideningEvidenceArtifact as any).artifactRefs).length,
  };
}
