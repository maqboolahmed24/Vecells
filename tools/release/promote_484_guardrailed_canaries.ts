import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../..");

export const TASK_ID = "seq_484";
export const FIXED_NOW = "2026-04-28T00:00:00.000Z";
export const SCHEMA_VERSION = "484.programme.guardrailed-canary.v1";
export const OUTPUT_ROOT = "output/playwright/484-canary-rollout";

type JsonObject = Record<string, unknown>;

export type Canary484ScenarioState =
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

type SelectorKind = "tenant" | "channel" | "mixed";
type DecisionState =
  | "approved"
  | "active_observation"
  | "completed"
  | "blocked"
  | "pause_required"
  | "rollback_required"
  | "stale";
type SettlementResult =
  | "applied"
  | "accepted_pending_observation"
  | "blocked_guardrail"
  | "denied_scope"
  | "stale_wave"
  | "superseded"
  | "evidence_required";

export interface ExposureVector {
  readonly patients: number;
  readonly staff: number;
  readonly pharmacy: number;
  readonly hub: number;
  readonly nhs_app: number;
  readonly assistive: number;
}

export interface CanaryScopeSelector {
  readonly recordType: "CanaryScopeSelector";
  readonly selectorId: string;
  readonly scenarioId: Canary484ScenarioState;
  readonly waveRef: string;
  readonly selectorKind: SelectorKind;
  readonly tenantScope: string;
  readonly cohortScope: string;
  readonly channelScope: string;
  readonly routeFamilyRefs: readonly string[];
  readonly baselineSelectorHash: string;
  readonly proposedSelectorHash: string;
  readonly selectorState: "exact" | "expanded" | "conflict" | "blocked";
  readonly expansionSourceRef: string | null;
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly owner: string;
  readonly generatedAt: string;
  readonly recordHash: string;
}

export interface CanaryBlastRadiusProof {
  readonly recordType: "CanaryBlastRadiusProof";
  readonly proofId: string;
  readonly scenarioId: Canary484ScenarioState;
  readonly waveRef: string;
  readonly selectorRef: string;
  readonly previousExposure: ExposureVector;
  readonly proposedExposure: ExposureVector;
  readonly deltaExposure: ExposureVector;
  readonly maxPermittedDelta: ExposureVector;
  readonly blastRadiusState: "exact" | "blocked";
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly owner: string;
  readonly generatedAt: string;
  readonly recordHash: string;
}

export interface TenantCanaryEligibility {
  readonly recordType: "TenantCanaryEligibility";
  readonly eligibilityId: string;
  readonly scenarioId: Canary484ScenarioState;
  readonly waveRef: string;
  readonly tenantRef: string;
  readonly coreWebEligibilityState: "exact" | "blocked";
  readonly routeFamilyRefs: readonly string[];
  readonly supportCapacityState: "exact" | "constrained";
  readonly rollbackReadinessState: "ready" | "blocked";
  readonly eligibilityState: "exact" | "blocked";
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly owner: string;
  readonly generatedAt: string;
  readonly recordHash: string;
}

export interface ChannelCanaryEligibility {
  readonly recordType: "ChannelCanaryEligibility";
  readonly eligibilityId: string;
  readonly scenarioId: Canary484ScenarioState;
  readonly waveRef: string;
  readonly channelRef: string;
  readonly channelEligibilityState: "exact" | "blocked" | "not_applicable";
  readonly monthlyDataState: "current" | "missing" | "not_applicable";
  readonly routeFreezeState: "clear" | "active";
  readonly channelRollbackReadinessState: "ready" | "blocked" | "not_applicable";
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly owner: string;
  readonly generatedAt: string;
  readonly recordHash: string;
}

export interface CanaryGuardrailEvaluation {
  readonly recordType: "CanaryGuardrailEvaluation";
  readonly evaluationId: string;
  readonly scenarioId: Canary484ScenarioState;
  readonly waveRef: string;
  readonly ruleId: string;
  readonly ruleKind: string;
  readonly metricRef: string;
  readonly comparator: string;
  readonly threshold: number;
  readonly observedValue: number;
  readonly unit: string;
  readonly interval: string;
  readonly sampleSize: number;
  readonly requiredSampleSize: number;
  readonly state: "exact" | "breached" | "insufficient_evidence" | "stale";
  readonly severity: "info" | "pause" | "rollback" | "block";
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly owner: string;
  readonly evaluatedAt: string;
  readonly recordHash: string;
}

export interface CanaryWideningDecision {
  readonly recordType: "CanaryWideningDecision";
  readonly decisionId: string;
  readonly taskId: typeof TASK_ID;
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly scenarioId: Canary484ScenarioState;
  readonly waveRef: string;
  readonly releaseCandidateRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly releaseWatchTupleRef: string;
  readonly watchTupleHash: string;
  readonly selectorRef: string;
  readonly blastRadiusProofRef: string;
  readonly tenantEligibilityRef: string;
  readonly channelEligibilityRef: string;
  readonly previousStabilityVerdictRef: string;
  readonly previousStabilityState: string;
  readonly guardrailEvaluationRefs: readonly string[];
  readonly observationPolicyRef: string;
  readonly decisionState: DecisionState;
  readonly actionPermitted: boolean;
  readonly nextSafeAction: string;
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly owner: string;
  readonly generatedAt: string;
  readonly wormAuditRef: string;
  readonly recordHash: string;
}

export interface CanaryWaveActionRecord {
  readonly recordType: "CanaryWaveActionRecord";
  readonly canaryWaveActionRecordId: string;
  readonly scenarioId: Canary484ScenarioState;
  readonly waveRef: string;
  readonly actionType: "widen";
  readonly commandState: "accepted" | "blocked" | "stale";
  readonly releaseRef: string;
  readonly releaseCandidateRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly releaseWatchTupleRef: string;
  readonly watchTupleHash: string;
  readonly selectorRef: string;
  readonly wideningDecisionRef: string;
  readonly waveObservationPolicyRef: string;
  readonly guardrailSnapshotRef: string;
  readonly rollbackBindingRef: string | null;
  readonly expectedWaveState: "draft" | "active";
  readonly expectedWaveFenceEpoch: number;
  readonly expectedPredecessorSettlementRef: string;
  readonly roleAuthorizationRef: string;
  readonly idempotencyKey: string;
  readonly purposeBindingRef: string;
  readonly injectedClockRef: string;
  readonly approvalBundleRef: string;
  readonly impactPreviewRef: string;
  readonly actingContextRef: string;
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly createdAt: string;
  readonly settledAt: string | null;
  readonly wormAuditRef: string;
  readonly recordHash: string;
}

export interface CanaryWaveSettlement {
  readonly recordType: "CanaryWaveSettlement";
  readonly canaryWaveSettlementId: string;
  readonly scenarioId: Canary484ScenarioState;
  readonly canaryWaveActionRecordRef: string;
  readonly result: SettlementResult;
  readonly waveRef: string;
  readonly selectorRef: string;
  readonly releaseWatchTupleRef: string;
  readonly watchTupleHash: string;
  readonly waveObservationPolicyRef: string;
  readonly observedWaveState: "draft" | "active" | "paused" | "rolled_back" | "completed";
  readonly observedGuardrailState: "exact" | "breached" | "stale" | "blocked";
  readonly observedPublicationParityState: "exact" | "stale";
  readonly observedRollbackReadinessState: "ready" | "blocked";
  readonly observationState: "satisfied" | "open" | "halted" | "rollback_required" | "superseded";
  readonly recoveryActionRef: string;
  readonly supersededByWaveActionRef: string | null;
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly recordedAt: string;
  readonly recordHash: string;
}

export interface CanaryPauseRecord {
  readonly recordType: "CanaryPauseRecord";
  readonly pauseRecordId: string;
  readonly scenarioId: Canary484ScenarioState;
  readonly waveRef: string;
  readonly canaryWaveSettlementRef: string;
  readonly reasonCode: string;
  readonly actionRecordRef: string;
  readonly state: "recommended" | "not_required";
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly generatedAt: string;
  readonly wormAuditRef: string;
  readonly recordHash: string;
}

export interface CanaryRollbackRecord {
  readonly recordType: "CanaryRollbackRecord";
  readonly rollbackRecordId: string;
  readonly scenarioId: Canary484ScenarioState;
  readonly waveRef: string;
  readonly canaryWaveSettlementRef: string;
  readonly rollbackMode: "route_rewind" | "channel_blocked" | "runtime_rollback";
  readonly routeRollbackReadinessState: "ready" | "blocked";
  readonly channelRollbackReadinessState: "ready" | "blocked" | "not_applicable";
  readonly state: "recommended" | "blocked" | "not_required";
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly generatedAt: string;
  readonly wormAuditRef: string;
  readonly recordHash: string;
}

export interface RemainingWaveObservationPolicy {
  readonly recordType: "RemainingWaveObservationPolicy";
  readonly policyId: string;
  readonly scenarioId: Canary484ScenarioState;
  readonly sourcePolicyRef: string;
  readonly waveRef: string;
  readonly dwellWindow: string;
  readonly minimumObservationHours: number;
  readonly requiredProbeRefs: readonly string[];
  readonly policyState: "armed" | "blocked" | "superseded";
  readonly supersedesPolicyRef: string | null;
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly owner: string;
  readonly generatedAt: string;
  readonly recordHash: string;
}

export interface CanaryWavePlan {
  readonly recordType: "CanaryWavePlan";
  readonly planId: string;
  readonly taskId: typeof TASK_ID;
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly releaseCandidateRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly previousWaveStabilityVerdictRef: string;
  readonly planState: "ready" | "blocked" | "partially_applied";
  readonly canaryOrder: readonly string[];
  readonly selectorRefs: readonly string[];
  readonly blastRadiusProofRefs: readonly string[];
  readonly decisionRefs: readonly string[];
  readonly observationPolicyRefs: readonly string[];
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly artifactRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly owner: string;
  readonly generatedAt: string;
  readonly wormAuditRef: string;
  readonly recordHash: string;
}

const sourceRefs = [
  "prompt/484.md",
  "prompt/shared_operating_contract_473_to_489.md",
  "blueprint/platform-runtime-and-release-blueprint.md#deploymentwave",
  "blueprint/platform-runtime-and-release-blueprint.md#waveactionrecord",
  "blueprint/platform-runtime-and-release-blueprint.md#waveactionsettlement",
  "blueprint/platform-runtime-and-release-blueprint.md#waveobservationpolicy",
  "blueprint/platform-runtime-and-release-blueprint.md#waveguardrailsnapshot",
  "blueprint/phase-9-the-assurance-ledger.md#tenant-governance-and-incident-workflow",
  "blueprint/phase-7-inside-the-nhs-app.md#limited-release-monthly-data-and-route-freeze",
  "blueprint/phase-8-the-assistive-layer.md#assistive-rollout-slices-and-freeze-disposition",
  "data/release/476_release_wave_manifest.json",
  "data/release/483_wave1_stability_verdict.json",
] as const;

const requiredInputPaths = [
  "data/release/476_release_wave_manifest.json",
  "data/release/476_wave_guardrail_snapshots.json",
  "data/release/476_wave_observation_policies.json",
  "data/release/482_wave1_promotion_settlement.json",
  "data/release/483_wave1_stability_verdict.json",
] as const;

export const required484EdgeCases = [
  "edge_484_wave1_stable_but_support_rota_capacity_constrained",
  "edge_484_tenant_core_web_eligible_but_channel_scope_blocked",
  "edge_484_canary_selector_expands_due_to_dynamic_membership",
  "edge_484_guardrail_breach_after_settlement_before_dwell_complete",
  "edge_484_rollback_route_ready_but_channel_embedding_missing",
  "edge_484_same_tenant_conflicting_scopes_across_canaries",
  "edge_484_observation_policy_changed_after_canary_approval",
] as const;

const edgeCaseByScenario: Record<Canary484ScenarioState, string | null> = {
  completed: null,
  ready: null,
  active: null,
  previous_stability_not_exact: null,
  support_capacity_constrained: "edge_484_wave1_stable_but_support_rota_capacity_constrained",
  channel_scope_blocked: "edge_484_tenant_core_web_eligible_but_channel_scope_blocked",
  selector_expanded: "edge_484_canary_selector_expands_due_to_dynamic_membership",
  guardrail_breach_after_settlement:
    "edge_484_guardrail_breach_after_settlement_before_dwell_complete",
  rollback_channel_gap: "edge_484_rollback_route_ready_but_channel_embedding_missing",
  conflicting_scope: "edge_484_same_tenant_conflicting_scopes_across_canaries",
  policy_changed_after_approval: "edge_484_observation_policy_changed_after_canary_approval",
};

const defaultExposure: ExposureVector = {
  patients: 25,
  staff: 6,
  pharmacy: 0,
  hub: 2,
  nhs_app: 0,
  assistive: 0,
};

export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((entry) => canonicalize(entry)).join(",")}]`;
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalize((value as JsonObject)[key])}`)
    .join(",")}}`;
}

export function hashValue(value: unknown): string {
  return createHash("sha256").update(canonicalize(value)).digest("hex");
}

function withHash<T extends JsonObject>(record: Omit<T, "recordHash">): T {
  return { ...record, recordHash: hashValue(record) } as T;
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), "utf8")) as T;
}

function writeJson(relativePath: string, value: unknown): void {
  const absolutePath = path.join(ROOT, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(relativePath: string, value: string): void {
  const absolutePath = path.join(ROOT, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, value.endsWith("\n") ? value : `${value}\n`);
}

function formatFiles(paths: readonly string[]): void {
  execFileSync("pnpm", ["exec", "prettier", "--write", ...paths], {
    cwd: ROOT,
    stdio: "inherit",
  });
}

function ensureRequiredInputs(): void {
  const missing = requiredInputPaths.filter(
    (relativePath) => !fs.existsSync(path.join(ROOT, relativePath)),
  );
  if (missing.length > 0) throw new Error(`484 required inputs missing: ${missing.join(", ")}`);
}

function listOutputArtifacts(): string[] {
  const absoluteRoot = path.join(ROOT, OUTPUT_ROOT);
  if (!fs.existsSync(absoluteRoot)) return [];
  const found: string[] = [];
  const visit = (directory: string): void => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolutePath);
      else found.push(path.relative(ROOT, absolutePath));
    }
  };
  visit(absoluteRoot);
  return found.sort();
}

function releaseBindingFromInputs() {
  const manifest = readJson<any>("data/release/476_release_wave_manifest.json");
  const stability = readJson<any>("data/release/483_wave1_stability_verdict.json");
  const activeVerdict = stability.activeVerdict ?? {};
  return {
    releaseRef:
      manifest.releaseRef ?? "release:programme-core-baseline:phase0-6-phase8-9:2026-04-28",
    releaseCandidateRef: manifest.releaseCandidateRef ?? "RC_LOCAL_V1",
    runtimePublicationBundleRef:
      activeVerdict.runtimePublicationBundleRef ?? "rpb::local::authoritative",
    releaseWatchTupleRef: activeVerdict.releaseWatchTupleRef ?? "RWT_LOCAL_V1",
    watchTupleHash:
      activeVerdict.releaseWatchTupleHash ??
      "9e419df51ddbbe289935c8f50152d2c69039cc8e9b6a443f83be09f054094779",
    previousStabilityVerdictRef: activeVerdict.verdictId ?? "stability_verdict_483_stable",
    previousStabilityState: String(activeVerdict.stabilityState ?? "stable"),
  };
}

function waveById(waveRef: string): any {
  const manifest = readJson<any>("data/release/476_release_wave_manifest.json");
  return (
    manifest.deploymentWaves?.find((entry: any) => entry.waveId === waveRef) ??
    manifest.deploymentWaves?.[1]
  );
}

function policyById(policyId: string): any {
  const policies = readJson<any>("data/release/476_wave_observation_policies.json");
  return policies.policies?.find((entry: any) => entry.policyId === policyId) ?? {};
}

function scenarioTargetWave(scenarioId: Canary484ScenarioState): string {
  if (scenarioId === "channel_scope_blocked" || scenarioId === "rollback_channel_gap") {
    return "wave_476_channel_nhs_app_limited_release";
  }
  if (scenarioId === "conflicting_scope") return "wave_476_remaining_tenant_waves";
  return "wave_476_2_core_web_staff_pharmacy_after_projection";
}

function scenarioSelectorKind(scenarioId: Canary484ScenarioState): SelectorKind {
  if (scenarioId === "channel_scope_blocked" || scenarioId === "rollback_channel_gap") {
    return "channel";
  }
  if (scenarioId === "ready" || scenarioId === "active" || scenarioId === "completed")
    return "mixed";
  return "tenant";
}

function exposureDelta(previous: ExposureVector, proposed: ExposureVector): ExposureVector {
  return {
    patients: Math.max(0, proposed.patients - previous.patients),
    staff: Math.max(0, proposed.staff - previous.staff),
    pharmacy: Math.max(0, proposed.pharmacy - previous.pharmacy),
    hub: Math.max(0, proposed.hub - previous.hub),
    nhs_app: Math.max(0, proposed.nhs_app - previous.nhs_app),
    assistive: Math.max(0, proposed.assistive - previous.assistive),
  };
}

function proposedExposureFor(scenarioId: Canary484ScenarioState): ExposureVector {
  if (scenarioId === "channel_scope_blocked" || scenarioId === "rollback_channel_gap") {
    return { ...defaultExposure, nhs_app: 15 };
  }
  if (scenarioId === "conflicting_scope") {
    return { patients: 110, staff: 30, pharmacy: 4, hub: 6, nhs_app: 0, assistive: 0 };
  }
  if (scenarioId === "selector_expanded") {
    return { patients: 190, staff: 52, pharmacy: 6, hub: 8, nhs_app: 0, assistive: 0 };
  }
  return { patients: 80, staff: 24, pharmacy: 4, hub: 6, nhs_app: 0, assistive: 0 };
}

function blockersForScenario(scenarioId: Canary484ScenarioState): string[] {
  const blockers: Record<Canary484ScenarioState, string[]> = {
    completed: [],
    ready: [],
    active: [],
    previous_stability_not_exact: ["blocker:484:previous-wave-stability-not-exact"],
    support_capacity_constrained: ["blocker:484:support-rota-capacity-constrained-for-wider-wave"],
    channel_scope_blocked: ["blocker:484:tenant-core-web-eligible-channel-scope-blocked"],
    selector_expanded: ["blocker:484:canary-selector-expanded-by-dynamic-membership"],
    guardrail_breach_after_settlement: [
      "blocker:484:guardrail-breach-after-settlement-before-dwell",
    ],
    rollback_channel_gap: ["blocker:484:channel-embedding-rollback-path-missing"],
    conflicting_scope: ["blocker:484:same-tenant-conflicting-canary-scopes"],
    policy_changed_after_approval: ["blocker:484:observation-policy-changed-after-approval"],
  };
  return blockers[scenarioId];
}

function buildSelector(scenarioId: Canary484ScenarioState): CanaryScopeSelector {
  const wave = waveById(scenarioTargetWave(scenarioId));
  const selectorKind = scenarioSelectorKind(scenarioId);
  const selectorPayload = {
    waveRef: wave.waveId,
    selectorKind,
    tenantScope: wave.tenantCohortRef,
    channelScope: wave.channelScopeRef,
    routeFamilyRefs: wave.routeFamilies ?? [],
  };
  const exactHash = hashValue(selectorPayload);
  const proposedHash =
    scenarioId === "selector_expanded"
      ? hashValue({ ...selectorPayload, dynamicMemberAdded: "tenant-demo-branch-2" })
      : exactHash;
  const selectorState =
    scenarioId === "selector_expanded"
      ? "expanded"
      : scenarioId === "conflicting_scope"
        ? "conflict"
        : scenarioId === "channel_scope_blocked" || scenarioId === "rollback_channel_gap"
          ? "blocked"
          : "exact";
  return withHash<CanaryScopeSelector>({
    recordType: "CanaryScopeSelector",
    selectorId: `selector_484_${scenarioId}`,
    scenarioId,
    waveRef: wave.waveId,
    selectorKind,
    tenantScope: wave.tenantCohortRef,
    cohortScope: wave.tenantCohortRef,
    channelScope: wave.channelScopeRef,
    routeFamilyRefs: wave.routeFamilies ?? [],
    baselineSelectorHash: exactHash,
    proposedSelectorHash: proposedHash,
    selectorState,
    expansionSourceRef:
      scenarioId === "selector_expanded" ? "tenant-directory-delta:synthetic:484" : null,
    blockerRefs:
      selectorState === "exact"
        ? []
        : scenarioId === "conflicting_scope"
          ? ["blocker:484:same-tenant-conflicting-canary-scopes"]
          : scenarioId === "selector_expanded"
            ? ["blocker:484:canary-selector-expanded-by-dynamic-membership"]
            : ["blocker:484:tenant-core-web-eligible-channel-scope-blocked"],
    evidenceRefs: ["data/release/476_release_wave_manifest.json"],
    sourceRefs,
    owner: "release-governance",
    generatedAt: FIXED_NOW,
  });
}

function buildBlastRadiusProof(
  scenarioId: Canary484ScenarioState,
  selector: CanaryScopeSelector,
): CanaryBlastRadiusProof {
  const proposedExposure = proposedExposureFor(scenarioId);
  const deltaExposure = exposureDelta(defaultExposure, proposedExposure);
  const maxPermittedDelta: ExposureVector = {
    patients: 80,
    staff: 24,
    pharmacy: 4,
    hub: 6,
    nhs_app: 0,
    assistive: 0,
  };
  const blocked =
    deltaExposure.patients > maxPermittedDelta.patients ||
    deltaExposure.staff > maxPermittedDelta.staff ||
    deltaExposure.pharmacy > maxPermittedDelta.pharmacy ||
    deltaExposure.nhs_app > maxPermittedDelta.nhs_app ||
    selector.selectorState !== "exact";
  return withHash<CanaryBlastRadiusProof>({
    recordType: "CanaryBlastRadiusProof",
    proofId: `blast_radius_484_${scenarioId}`,
    scenarioId,
    waveRef: selector.waveRef,
    selectorRef: selector.selectorId,
    previousExposure: defaultExposure,
    proposedExposure,
    deltaExposure,
    maxPermittedDelta,
    blastRadiusState: blocked ? "blocked" : "exact",
    blockerRefs: blocked
      ? [...selector.blockerRefs, "blocker:484:blast-radius-proof-not-exact"]
      : [],
    evidenceRefs: ["data/release/476_blast_radius_matrix.json"],
    sourceRefs,
    owner: "release-governance",
    generatedAt: FIXED_NOW,
  });
}

function buildTenantEligibility(
  scenarioId: Canary484ScenarioState,
  selector: CanaryScopeSelector,
): TenantCanaryEligibility {
  const supportConstrained = scenarioId === "support_capacity_constrained";
  const rollbackBlocked = scenarioId === "rollback_channel_gap";
  const blocked = supportConstrained || scenarioId === "conflicting_scope";
  return withHash<TenantCanaryEligibility>({
    recordType: "TenantCanaryEligibility",
    eligibilityId: `tenant_eligibility_484_${scenarioId}`,
    scenarioId,
    waveRef: selector.waveRef,
    tenantRef: "tenant-demo-gp:programme-core-release",
    coreWebEligibilityState: blocked ? "blocked" : "exact",
    routeFamilyRefs: selector.routeFamilyRefs,
    supportCapacityState: supportConstrained ? "constrained" : "exact",
    rollbackReadinessState: rollbackBlocked ? "blocked" : "ready",
    eligibilityState: blocked ? "blocked" : "exact",
    blockerRefs: blocked ? blockersForScenario(scenarioId) : [],
    evidenceRefs: [
      "data/bau/475_operating_model.json",
      "data/release/476_release_wave_manifest.json",
    ],
    sourceRefs,
    owner: "service-owner",
    generatedAt: FIXED_NOW,
  });
}

function buildChannelEligibility(
  scenarioId: Canary484ScenarioState,
  selector: CanaryScopeSelector,
): ChannelCanaryEligibility {
  const isChannel = selector.selectorKind === "channel";
  const channelBlocked = scenarioId === "channel_scope_blocked";
  const rollbackBlocked = scenarioId === "rollback_channel_gap";
  return withHash<ChannelCanaryEligibility>({
    recordType: "ChannelCanaryEligibility",
    eligibilityId: `channel_eligibility_484_${scenarioId}`,
    scenarioId,
    waveRef: selector.waveRef,
    channelRef: isChannel ? "nhs_app_limited_release" : selector.channelScope,
    channelEligibilityState: isChannel
      ? channelBlocked || rollbackBlocked
        ? "blocked"
        : "exact"
      : "not_applicable",
    monthlyDataState:
      isChannel && channelBlocked ? "missing" : isChannel ? "current" : "not_applicable",
    routeFreezeState: isChannel && (channelBlocked || rollbackBlocked) ? "active" : "clear",
    channelRollbackReadinessState: isChannel
      ? rollbackBlocked
        ? "blocked"
        : "ready"
      : "not_applicable",
    blockerRefs: channelBlocked || rollbackBlocked ? blockersForScenario(scenarioId) : [],
    evidenceRefs: [
      "data/release/476_wave_observation_policies.json",
      "data/conformance/473_phase7_channel_readiness_reconciliation.json",
    ],
    sourceRefs,
    owner: "release-governance",
    generatedAt: FIXED_NOW,
  });
}

function buildGuardrails(
  scenarioId: Canary484ScenarioState,
  waveRef: string,
): CanaryGuardrailEvaluation[] {
  const breach = scenarioId === "guardrail_breach_after_settlement";
  const stale = scenarioId === "policy_changed_after_approval";
  const latency = withHash<CanaryGuardrailEvaluation>({
    recordType: "CanaryGuardrailEvaluation",
    evaluationId: `canary_guardrail_484_${scenarioId}_latency`,
    scenarioId,
    waveRef,
    ruleId: "guardrail:484:latency-p95",
    ruleKind: "latency_budget",
    metricRef: "metric:ops:request-latency-p95",
    comparator: "<=",
    threshold: 900,
    observedValue: breach ? 1040 : 640,
    unit: "ms",
    interval: "PT5M",
    sampleSize: scenarioId === "active" ? 96 : 288,
    requiredSampleSize: 288,
    state: breach
      ? "breached"
      : scenarioId === "active"
        ? "insufficient_evidence"
        : stale
          ? "stale"
          : "exact",
    severity: breach ? "pause" : stale ? "block" : "info",
    blockerRefs: breach
      ? ["blocker:484:guardrail-breach-after-settlement-before-dwell"]
      : stale
        ? ["blocker:484:observation-policy-changed-after-approval"]
        : [],
    evidenceRefs: ["data/release/476_wave_guardrail_snapshots.json"],
    sourceRefs,
    owner: "sre",
    evaluatedAt: FIXED_NOW,
  });
  const support = withHash<CanaryGuardrailEvaluation>({
    recordType: "CanaryGuardrailEvaluation",
    evaluationId: `canary_guardrail_484_${scenarioId}_support`,
    scenarioId,
    waveRef,
    ruleId: "guardrail:484:support-capacity",
    ruleKind: "support_capacity",
    metricRef: "metric:support:wider-rollout-rota-free-slots",
    comparator: ">=",
    threshold: 2,
    observedValue: scenarioId === "support_capacity_constrained" ? 0 : 4,
    unit: "rota-slots",
    interval: "P1D",
    sampleSize: 1,
    requiredSampleSize: 1,
    state: scenarioId === "support_capacity_constrained" ? "breached" : "exact",
    severity: scenarioId === "support_capacity_constrained" ? "block" : "info",
    blockerRefs:
      scenarioId === "support_capacity_constrained"
        ? ["blocker:484:support-rota-capacity-constrained-for-wider-wave"]
        : [],
    evidenceRefs: ["data/bau/475_operating_model.json"],
    sourceRefs,
    owner: "support-operations",
    evaluatedAt: FIXED_NOW,
  });
  return [latency, support];
}

function decisionStateFor(
  scenarioId: Canary484ScenarioState,
  blockers: readonly string[],
): DecisionState {
  if (scenarioId === "completed") return "completed";
  if (scenarioId === "active") return "active_observation";
  if (scenarioId === "guardrail_breach_after_settlement") return "pause_required";
  if (scenarioId === "rollback_channel_gap") return "rollback_required";
  if (scenarioId === "policy_changed_after_approval") return "stale";
  return blockers.length === 0 ? "approved" : "blocked";
}

function nextSafeActionFor(state: DecisionState): string {
  const actions: Record<DecisionState, string> = {
    approved:
      "Submit the scoped canary action and observe the new wave policy before any next widening.",
    active_observation:
      "Hold the next canary while this settlement remains accepted pending observation.",
    completed:
      "First guarded canary has settled. Remaining waves stay gated by their own selectors.",
    blocked: "Do not widen. Resolve selector, support, channel, or blast-radius blockers first.",
    pause_required:
      "Pause this canary and hold further widening until guardrail recovery evidence is exact.",
    rollback_required:
      "Open rollback review; route rollback exists but channel embedding recovery is not exact.",
    stale: "Supersede the action because the observation policy changed after approval.",
  };
  return actions[state];
}

export function build484ScenarioRecords(
  scenarioId: Canary484ScenarioState = "completed",
  artifactRefs: readonly string[] = [],
) {
  ensureRequiredInputs();
  const binding = releaseBindingFromInputs();
  const selector = buildSelector(scenarioId);
  const wave = waveById(selector.waveRef);
  const blastRadiusProof = buildBlastRadiusProof(scenarioId, selector);
  const tenantEligibility = buildTenantEligibility(scenarioId, selector);
  const channelEligibility = buildChannelEligibility(scenarioId, selector);
  const guardrails = buildGuardrails(scenarioId, selector.waveRef);
  const previousStabilityBlocked =
    scenarioId === "previous_stability_not_exact" || binding.previousStabilityState !== "stable";
  const blockerRefs = [
    ...new Set([
      ...(previousStabilityBlocked ? ["blocker:484:previous-wave-stability-not-exact"] : []),
      ...selector.blockerRefs,
      ...blastRadiusProof.blockerRefs,
      ...tenantEligibility.blockerRefs,
      ...channelEligibility.blockerRefs,
      ...guardrails.flatMap((entry) => entry.blockerRefs),
    ]),
  ];
  const decisionState = decisionStateFor(scenarioId, blockerRefs);
  const actionPermitted = decisionState === "approved" || decisionState === "completed";
  const decision = withHash<CanaryWideningDecision>({
    recordType: "CanaryWideningDecision",
    decisionId: `canary_decision_484_${scenarioId}`,
    taskId: TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    scenarioId,
    waveRef: selector.waveRef,
    releaseCandidateRef: binding.releaseCandidateRef,
    runtimePublicationBundleRef: binding.runtimePublicationBundleRef,
    releaseWatchTupleRef: binding.releaseWatchTupleRef,
    watchTupleHash: binding.watchTupleHash,
    selectorRef: selector.selectorId,
    blastRadiusProofRef: blastRadiusProof.proofId,
    tenantEligibilityRef: tenantEligibility.eligibilityId,
    channelEligibilityRef: channelEligibility.eligibilityId,
    previousStabilityVerdictRef: binding.previousStabilityVerdictRef,
    previousStabilityState: previousStabilityBlocked ? "insufficient_evidence" : "stable",
    guardrailEvaluationRefs: guardrails.map((entry) => entry.evaluationId),
    observationPolicyRef: wave.observationPolicyRef,
    decisionState,
    actionPermitted,
    nextSafeAction: nextSafeActionFor(decisionState),
    blockerRefs,
    evidenceRefs: [
      "data/release/483_wave1_stability_verdict.json",
      "data/release/476_release_wave_manifest.json",
      "data/release/476_wave_guardrail_snapshots.json",
    ],
    sourceRefs,
    owner: "release-governance",
    generatedAt: FIXED_NOW,
    wormAuditRef: `worm-ledger:484:canary-decision:${scenarioId}`,
  });
  const action = withHash<CanaryWaveActionRecord>({
    recordType: "CanaryWaveActionRecord",
    canaryWaveActionRecordId: `canary_action_484_${scenarioId}`,
    scenarioId,
    waveRef: selector.waveRef,
    actionType: "widen",
    commandState:
      scenarioId === "policy_changed_after_approval"
        ? "stale"
        : actionPermitted ||
            scenarioId === "active" ||
            scenarioId === "guardrail_breach_after_settlement"
          ? "accepted"
          : "blocked",
    releaseRef: binding.releaseRef,
    releaseCandidateRef: binding.releaseCandidateRef,
    runtimePublicationBundleRef: binding.runtimePublicationBundleRef,
    releaseWatchTupleRef: binding.releaseWatchTupleRef,
    watchTupleHash: binding.watchTupleHash,
    selectorRef: selector.selectorId,
    wideningDecisionRef: decision.decisionId,
    waveObservationPolicyRef: wave.observationPolicyRef,
    guardrailSnapshotRef: wave.guardrailSnapshotRef,
    rollbackBindingRef: wave.rollbackBindingRef ?? null,
    expectedWaveState: "draft",
    expectedWaveFenceEpoch: 1,
    expectedPredecessorSettlementRef: "wave_action_settlement_482_wave1_ready",
    roleAuthorizationRef: "role-auth:release-governance:wave-controller",
    idempotencyKey: `idem_484_${scenarioId}_20260428`,
    purposeBindingRef: `purpose:484:${selector.waveRef}:guardrailed-canary:${scenarioId}`,
    injectedClockRef: "clock:484:fixed-2026-04-28T00:00:00Z",
    approvalBundleRef: decision.decisionId,
    impactPreviewRef: `impact_preview_484_${scenarioId}`,
    actingContextRef: "operator:synthetic-release-manager",
    blockerRefs,
    evidenceRefs: [decision.decisionId, selector.selectorId, blastRadiusProof.proofId],
    sourceRefs,
    createdAt: FIXED_NOW,
    settledAt:
      actionPermitted ||
      scenarioId === "active" ||
      scenarioId === "guardrail_breach_after_settlement"
        ? FIXED_NOW
        : null,
    wormAuditRef: `worm-ledger:484:canary-action:${scenarioId}`,
  });
  const result: SettlementResult =
    scenarioId === "completed"
      ? "applied"
      : scenarioId === "ready" || scenarioId === "active"
        ? "accepted_pending_observation"
        : scenarioId === "guardrail_breach_after_settlement"
          ? "blocked_guardrail"
          : scenarioId === "policy_changed_after_approval"
            ? "stale_wave"
            : scenarioId === "rollback_channel_gap"
              ? "evidence_required"
              : "denied_scope";
  const settlement = withHash<CanaryWaveSettlement>({
    recordType: "CanaryWaveSettlement",
    canaryWaveSettlementId: `canary_settlement_484_${scenarioId}`,
    scenarioId,
    canaryWaveActionRecordRef: action.canaryWaveActionRecordId,
    result,
    waveRef: selector.waveRef,
    selectorRef: selector.selectorId,
    releaseWatchTupleRef: binding.releaseWatchTupleRef,
    watchTupleHash: binding.watchTupleHash,
    waveObservationPolicyRef: wave.observationPolicyRef,
    observedWaveState:
      result === "applied"
        ? "completed"
        : scenarioId === "guardrail_breach_after_settlement"
          ? "paused"
          : scenarioId === "rollback_channel_gap"
            ? "rolled_back"
            : "active",
    observedGuardrailState:
      scenarioId === "guardrail_breach_after_settlement"
        ? "breached"
        : scenarioId === "policy_changed_after_approval"
          ? "stale"
          : blockerRefs.length > 0
            ? "blocked"
            : "exact",
    observedPublicationParityState: "exact",
    observedRollbackReadinessState: scenarioId === "rollback_channel_gap" ? "blocked" : "ready",
    observationState:
      result === "applied"
        ? "satisfied"
        : scenarioId === "guardrail_breach_after_settlement"
          ? "halted"
          : scenarioId === "rollback_channel_gap"
            ? "rollback_required"
            : scenarioId === "policy_changed_after_approval"
              ? "superseded"
              : "open",
    recoveryActionRef:
      scenarioId === "guardrail_breach_after_settlement"
        ? "recovery:484:pause-canary-guardrail-breach"
        : scenarioId === "rollback_channel_gap"
          ? "recovery:484:rollback-route-and-block-channel"
          : "recovery:484:observe-next-canary",
    supersededByWaveActionRef:
      scenarioId === "policy_changed_after_approval"
        ? "canary_action_484_policy_superseding"
        : null,
    blockerRefs,
    evidenceRefs: [action.canaryWaveActionRecordId, "data/release/484_canary_wave_actions.json"],
    sourceRefs,
    recordedAt: FIXED_NOW,
  });
  const pauseRecord =
    scenarioId === "guardrail_breach_after_settlement"
      ? withHash<CanaryPauseRecord>({
          recordType: "CanaryPauseRecord",
          pauseRecordId: `canary_pause_484_${scenarioId}`,
          scenarioId,
          waveRef: selector.waveRef,
          canaryWaveSettlementRef: settlement.canaryWaveSettlementId,
          reasonCode: "blocker:484:guardrail-breach-after-settlement-before-dwell",
          actionRecordRef: "WaveActionRecord:484:pause-canary",
          state: "recommended",
          blockerRefs: ["blocker:484:guardrail-breach-after-settlement-before-dwell"],
          evidenceRefs: [settlement.canaryWaveSettlementId],
          sourceRefs,
          generatedAt: FIXED_NOW,
          wormAuditRef: `worm-ledger:484:pause:${scenarioId}`,
        })
      : null;
  const rollbackRecord =
    scenarioId === "rollback_channel_gap"
      ? withHash<CanaryRollbackRecord>({
          recordType: "CanaryRollbackRecord",
          rollbackRecordId: `canary_rollback_484_${scenarioId}`,
          scenarioId,
          waveRef: selector.waveRef,
          canaryWaveSettlementRef: settlement.canaryWaveSettlementId,
          rollbackMode: "channel_blocked",
          routeRollbackReadinessState: "ready",
          channelRollbackReadinessState: "blocked",
          state: "blocked",
          blockerRefs: ["blocker:484:channel-embedding-rollback-path-missing"],
          evidenceRefs: [settlement.canaryWaveSettlementId],
          sourceRefs,
          generatedAt: FIXED_NOW,
          wormAuditRef: `worm-ledger:484:rollback:${scenarioId}`,
        })
      : null;
  const policySource = policyById(wave.observationPolicyRef);
  const remainingPolicy = withHash<RemainingWaveObservationPolicy>({
    recordType: "RemainingWaveObservationPolicy",
    policyId: `remaining_policy_484_${scenarioId}`,
    scenarioId,
    sourcePolicyRef: wave.observationPolicyRef,
    waveRef: selector.waveRef,
    dwellWindow: String(policySource.dwellWindow ?? "PT48H"),
    minimumObservationHours: Number(policySource.minimumObservationHours ?? 48),
    requiredProbeRefs: policySource.requiredProbeRefs ?? [],
    policyState:
      scenarioId === "policy_changed_after_approval"
        ? "superseded"
        : blockerRefs.some((entry) => entry.includes("channel"))
          ? "blocked"
          : "armed",
    supersedesPolicyRef:
      scenarioId === "policy_changed_after_approval" ? wave.observationPolicyRef : null,
    blockerRefs:
      scenarioId === "policy_changed_after_approval"
        ? ["blocker:484:observation-policy-changed-after-approval"]
        : blockerRefs.filter((entry) => entry.includes("channel")),
    evidenceRefs: ["data/release/476_wave_observation_policies.json"],
    sourceRefs,
    owner: policySource.owner ?? "release-governance",
    generatedAt: FIXED_NOW,
  });
  return {
    selector,
    blastRadiusProof,
    tenantEligibility,
    channelEligibility,
    guardrails,
    decision,
    action,
    settlement,
    pauseRecord,
    rollbackRecord,
    remainingPolicy,
    artifactRefs,
  };
}

export function build484Records(artifactRefs: readonly string[] = listOutputArtifacts()) {
  const scenarioIds: Canary484ScenarioState[] = [
    "completed",
    "ready",
    "active",
    "previous_stability_not_exact",
    "support_capacity_constrained",
    "channel_scope_blocked",
    "selector_expanded",
    "guardrail_breach_after_settlement",
    "rollback_channel_gap",
    "conflicting_scope",
    "policy_changed_after_approval",
  ];
  const scenarios = scenarioIds.map((scenarioId) =>
    build484ScenarioRecords(scenarioId, artifactRefs),
  );
  const activeScenario = scenarios[0];
  const plan = withHash<CanaryWavePlan>({
    recordType: "CanaryWavePlan",
    planId: "canary_wave_plan_484_completed",
    taskId: TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    releaseCandidateRef: activeScenario.decision.releaseCandidateRef,
    runtimePublicationBundleRef: activeScenario.decision.runtimePublicationBundleRef,
    previousWaveStabilityVerdictRef: activeScenario.decision.previousStabilityVerdictRef,
    planState: "partially_applied",
    canaryOrder: [
      "wave_476_2_core_web_staff_pharmacy_after_projection",
      "wave_476_remaining_tenant_waves",
      "wave_476_channel_nhs_app_limited_release",
      "wave_476_assistive_narrow_staff_cohort",
    ],
    selectorRefs: scenarios.map((entry) => entry.selector.selectorId),
    blastRadiusProofRefs: scenarios.map((entry) => entry.blastRadiusProof.proofId),
    decisionRefs: scenarios.map((entry) => entry.decision.decisionId),
    observationPolicyRefs: scenarios.map((entry) => entry.remainingPolicy.policyId),
    blockerRefs: [],
    evidenceRefs: [
      "data/release/483_wave1_stability_verdict.json",
      "data/release/476_release_wave_manifest.json",
    ],
    artifactRefs,
    sourceRefs,
    owner: "release-governance",
    generatedAt: FIXED_NOW,
    wormAuditRef: "worm-ledger:484:canary-plan",
  });
  const edgeCaseFixtures = withHash<JsonObject>({
    recordType: "CanaryEdgeCaseFixtures",
    taskId: TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    generatedAt: FIXED_NOW,
    fixtures: scenarios
      .filter((entry) => edgeCaseByScenario[entry.decision.scenarioId])
      .map((entry) => ({
        edgeCaseId: edgeCaseByScenario[entry.decision.scenarioId],
        scenarioId: entry.decision.scenarioId,
        decisionState: entry.decision.decisionState,
        settlementResult: entry.settlement.result,
        blockerRefs: entry.decision.blockerRefs,
      })),
    sourceRefs,
  });
  return {
    activeScenario,
    scenarios,
    plan,
    edgeCaseFixtures,
    selectors: scenarios.map((entry) => entry.selector),
    blastRadiusProofs: scenarios.map((entry) => entry.blastRadiusProof),
    tenantEligibilities: scenarios.map((entry) => entry.tenantEligibility),
    channelEligibilities: scenarios.map((entry) => entry.channelEligibility),
    guardrailEvaluations: scenarios.flatMap((entry) => entry.guardrails),
    decisions: scenarios.map((entry) => entry.decision),
    actions: scenarios.map((entry) => entry.action),
    settlements: scenarios.map((entry) => entry.settlement),
    pauseRecords: scenarios.flatMap((entry) => (entry.pauseRecord ? [entry.pauseRecord] : [])),
    rollbackRecords: scenarios.flatMap((entry) =>
      entry.rollbackRecord ? [entry.rollbackRecord] : [],
    ),
    remainingPolicies: scenarios.map((entry) => entry.remainingPolicy),
  };
}

function buildSchema(): JsonObject {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://vecells.local/contracts/484_guardrailed_canary.schema.json",
    title: "Guardrailed canary rollout records",
    type: "object",
    required: ["recordType", "taskId", "schemaVersion", "generatedAt"],
    properties: {
      recordType: { type: "string" },
      taskId: { const: TASK_ID },
      schemaVersion: { const: SCHEMA_VERSION },
      generatedAt: { type: "string", format: "date-time" },
    },
    $defs: {
      hashedRecord: {
        type: "object",
        required: ["recordType", "recordHash"],
        properties: {
          recordType: { type: "string" },
          recordHash: { type: "string", pattern: "^[a-f0-9]{64}$" },
        },
      },
      CanaryWideningDecision: {
        allOf: [
          { $ref: "#/$defs/hashedRecord" },
          {
            type: "object",
            required: ["decisionState", "actionPermitted", "selectorRef", "blockerRefs"],
          },
        ],
      },
      CanaryWaveSettlement: {
        allOf: [
          { $ref: "#/$defs/hashedRecord" },
          { type: "object", required: ["result", "observationState"] },
        ],
      },
    },
  };
}

function buildInterfaceGap(): JsonObject {
  return withHash<JsonObject>({
    recordType: "ProgrammeBatchInterfaceGap",
    gapId: "PROGRAMME_BATCH_473_489_INTERFACE_GAP_484_CANARY_WIDENING_AUTHORITY",
    taskId: TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    sourceConcepts: [
      "CanaryScopeSelector",
      "CanaryBlastRadiusProof",
      "CanaryWideningDecision",
      "remaining-wave observation policy authority",
    ],
    repositoryGap:
      "The repository had WaveActionRecord and WaveActionSettlement source concepts but no single native contract joining Wave 1 stability, canary selector hashes, blast-radius proof, channel eligibility, and settlement evidence for remaining waves.",
    failClosedBridge:
      "promote_484_guardrailed_canaries.ts publishes typed selector, eligibility, blast-radius, decision, action, settlement, pause, rollback, and policy records before any UI can enable widening.",
    state: "closed_by_typed_bridge",
    owner: "release-governance",
    blockerRefs: [],
    sourceRefs,
    generatedAt: FIXED_NOW,
  });
}

function buildExternalReferenceNotes(): JsonObject {
  return withHash<JsonObject>({
    recordType: "ExternalReferenceNotes",
    taskId: TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    generatedAt: FIXED_NOW,
    references: [
      {
        refId: "nhs-app-limited-release-and-monthly-data",
        relevance:
          "Channel canaries remain blocked unless monthly data, route freeze, and channel rollback evidence are exact.",
      },
      {
        refId: "playwright-browser-automation",
        relevance:
          "The Canary Rollout Console is verified with traces, screenshots, ARIA snapshots, keyboard navigation, reduced motion, and forced colors.",
      },
      {
        refId: "accessible-data-visualisation",
        relevance:
          "The wave ladder and scope comparison include direct labels and table fallbacks.",
      },
      {
        refId: "clinical-safety-and-assistive-rollout",
        relevance:
          "Assistive visible cohort activation is not widened by 484 and remains deferred to its dedicated authority task.",
      },
    ],
    sourceRefs,
  });
}

function buildAlgorithmAlignmentNotes(): string {
  return `# 484 Algorithm Alignment Notes

Task: ${TASK_ID}
Generated: ${FIXED_NOW}

## Implemented source authority

- Wave 1 stability is loaded from data/release/483_wave1_stability_verdict.json and must be stable before a canary action is permitted.
- Each canary step publishes a CanaryScopeSelector, CanaryBlastRadiusProof, CanaryWideningDecision, CanaryWaveActionRecord, CanaryWaveSettlement, and RemainingWaveObservationPolicy.
- Widening does not jump directly from Wave 1 to all tenants. The active completed path settles only the next guarded staff/pharmacy canary and leaves remaining tenant, NHS App, and assistive scope gated.
- Channel and assistive scopes remain fail-closed where current evidence belongs to tasks 485 and 486.

## Edge cases covered

${required484EdgeCases.map((edgeCase) => `- ${edgeCase}`).join("\n")}
`;
}

function buildRunbook(): string {
  return `# Guardrailed Canary Rollout Runbook

Generated: ${FIXED_NOW}

## Authority

Use data/release/484_wave_widening_evidence.json and data/release/484_canary_wave_settlements.json as the canary rollout authority. Do not widen from route labels, dashboards, or informal feature flags.

## Widening sequence

1. Confirm Wave 1 stability is exact.
2. Confirm the canary selector hash has not expanded.
3. Confirm blast-radius proof is exact for tenant, channel, and route scope.
4. Submit the CanaryWaveActionRecord with role authorization, purpose binding, idempotency key, injected clock, and WORM audit ref.
5. Treat accepted control-plane state as pending until CanaryWaveSettlement and the bound observation policy are satisfied.

## Stop conditions

Pause after any post-settlement guardrail breach before dwell completion. Roll back or block when channel embedding recovery is not exact. Supersede stale actions when observation policy changes after approval.
`;
}

function buildReport(records: ReturnType<typeof build484Records>): string {
  return `# Remaining Wave Rollout Report

Generated: ${FIXED_NOW}

## Active canary result

- Plan: ${records.plan.planId}
- Active decision: ${records.activeScenario.decision.decisionState}
- Active settlement: ${records.activeScenario.settlement.result}
- Action permitted: ${records.activeScenario.decision.actionPermitted}
- Next safe action: ${records.activeScenario.decision.nextSafeAction}

## Scenario coverage

${records.decisions
  .map(
    (decision) =>
      `- ${decision.scenarioId}: ${decision.decisionState}; blockers=${decision.blockerRefs.length}`,
  )
  .join("\n")}

## Browser evidence

${records.plan.artifactRefs.length === 0 ? "- Browser artifacts are generated by the Playwright suite." : records.plan.artifactRefs.map((artifact) => `- ${artifact}`).join("\n")}
`;
}

export function write484GuardrailedCanaryArtifacts(): void {
  const artifactRefs = listOutputArtifacts();
  const records = build484Records(artifactRefs);
  writeJson(
    "data/release/484_canary_wave_plan.json",
    withHash<JsonObject>({
      recordType: "CanaryWavePlanEnvelope",
      taskId: TASK_ID,
      schemaVersion: SCHEMA_VERSION,
      generatedAt: FIXED_NOW,
      plan: records.plan,
      selectors: records.selectors,
      blastRadiusProofs: records.blastRadiusProofs,
      tenantEligibilities: records.tenantEligibilities,
      channelEligibilities: records.channelEligibilities,
      edgeCaseFixtures: records.edgeCaseFixtures,
      sourceRefs,
    }),
  );
  writeJson(
    "data/release/484_canary_wave_actions.json",
    withHash<JsonObject>({
      recordType: "CanaryWaveActionEnvelope",
      taskId: TASK_ID,
      schemaVersion: SCHEMA_VERSION,
      generatedAt: FIXED_NOW,
      activeAction: records.activeScenario.action,
      actions: records.actions,
      decisions: records.decisions,
      guardrailEvaluations: records.guardrailEvaluations,
      sourceRefs,
    }),
  );
  writeJson(
    "data/release/484_canary_wave_settlements.json",
    withHash<JsonObject>({
      recordType: "CanaryWaveSettlementEnvelope",
      taskId: TASK_ID,
      schemaVersion: SCHEMA_VERSION,
      generatedAt: FIXED_NOW,
      activeSettlement: records.activeScenario.settlement,
      settlements: records.settlements,
      pauseRecords: records.pauseRecords,
      rollbackRecords: records.rollbackRecords,
      sourceRefs,
    }),
  );
  writeJson(
    "data/release/484_remaining_wave_observation_policies.json",
    withHash<JsonObject>({
      recordType: "RemainingWaveObservationPolicyEnvelope",
      taskId: TASK_ID,
      schemaVersion: SCHEMA_VERSION,
      generatedAt: FIXED_NOW,
      policies: records.remainingPolicies,
      sourceRefs,
    }),
  );
  writeJson(
    "data/release/484_wave_widening_evidence.json",
    withHash<JsonObject>({
      recordType: "CanaryWaveWideningEvidence",
      taskId: TASK_ID,
      schemaVersion: SCHEMA_VERSION,
      generatedAt: FIXED_NOW,
      activeDecision: records.activeScenario.decision,
      activeSettlement: records.activeScenario.settlement,
      planRef: records.plan.planId,
      scenarioDecisions: records.decisions,
      edgeCaseFixtures: records.edgeCaseFixtures,
      artifactRefs,
      sourceRefs,
    }),
  );
  writeJson("data/contracts/484_guardrailed_canary.schema.json", buildSchema());
  writeJson(
    "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_484_CANARY_WIDENING_AUTHORITY.json",
    buildInterfaceGap(),
  );
  writeJson("data/analysis/484_external_reference_notes.json", buildExternalReferenceNotes());
  writeText("data/analysis/484_algorithm_alignment_notes.md", buildAlgorithmAlignmentNotes());
  writeText("docs/runbooks/484_guardrailed_canary_rollout_runbook.md", buildRunbook());
  writeText("docs/test-evidence/484_remaining_wave_rollout_report.md", buildReport(records));
  formatFiles([
    "data/release/484_canary_wave_plan.json",
    "data/release/484_canary_wave_actions.json",
    "data/release/484_canary_wave_settlements.json",
    "data/release/484_remaining_wave_observation_policies.json",
    "data/release/484_wave_widening_evidence.json",
    "data/contracts/484_guardrailed_canary.schema.json",
    "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_484_CANARY_WIDENING_AUTHORITY.json",
    "data/analysis/484_external_reference_notes.json",
    "data/analysis/484_algorithm_alignment_notes.md",
    "docs/runbooks/484_guardrailed_canary_rollout_runbook.md",
    "docs/test-evidence/484_remaining_wave_rollout_report.md",
  ]);
}

if (process.argv[1]?.endsWith("promote_484_guardrailed_canaries.ts")) {
  write484GuardrailedCanaryArtifacts();
}
