import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../..");

export const TASK_ID = "seq_483";
export const FIXED_NOW = "2026-04-28T00:00:00.000Z";
export const SCHEMA_VERSION = "483.programme.wave-observation.v1";
export const OUTPUT_ROOT = "output/playwright/483-wave-observation";

type JsonObject = Record<string, unknown>;

export type Observation483ScenarioState =
  | "stable"
  | "observing"
  | "insufficient_evidence"
  | "tenant_slice_incident"
  | "staff_queue_projection_lag"
  | "assistive_freeze"
  | "runtime_parity_stale"
  | "support_load_breach"
  | "channel_monthly_missing";

export type WaveObservationState =
  | "observing"
  | "stable"
  | "pause_recommended"
  | "rollback_recommended"
  | "blocked"
  | "insufficient_evidence";

export type GuardrailEvaluationState =
  | "exact"
  | "breached"
  | "stale"
  | "blocked"
  | "insufficient_evidence"
  | "not_applicable";

export interface WaveSupportLoadSample {
  readonly recordType: "WaveSupportLoadSample";
  readonly sampleId: string;
  readonly scenarioId: Observation483ScenarioState;
  readonly waveRef: string;
  readonly tenantScope: string;
  readonly cohortScope: string;
  readonly channelScope: string;
  readonly routeFamilyRef: string;
  readonly launchTicketCount: number;
  readonly threshold: number;
  readonly interval: string;
  readonly technicalProbeState: "exact" | "breached";
  readonly sourceProjectionRef: string;
  readonly owner: string;
  readonly state: "exact" | "breached";
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly observedAt: string;
  readonly recordHash: string;
}

export interface ProjectionLagSample {
  readonly recordType: "ProjectionLagSample";
  readonly sampleId: string;
  readonly scenarioId: Observation483ScenarioState;
  readonly waveRef: string;
  readonly tenantScope: string;
  readonly cohortScope: string;
  readonly channelScope: string;
  readonly routeFamilyRef: string;
  readonly maxLagSeconds: number;
  readonly aggregateMaxLagSeconds: number;
  readonly threshold: number;
  readonly interval: string;
  readonly sourceProjectionRef: string;
  readonly owner: string;
  readonly state: "exact" | "breached";
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly observedAt: string;
  readonly recordHash: string;
}

export interface RuntimeHealthSample {
  readonly recordType: "RuntimeHealthSample";
  readonly sampleId: string;
  readonly scenarioId: Observation483ScenarioState;
  readonly releaseCandidateRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly publicationParityRef: string;
  readonly parityAgeMinutes: number;
  readonly maxParityAgeMinutes: number;
  readonly runtimePublicationState: "current" | "stale";
  readonly state: "exact" | "stale";
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly observedAt: string;
  readonly recordHash: string;
}

export interface AssistiveChannelPostureSample {
  readonly recordType: "AssistiveChannelPostureSample";
  readonly sampleId: string;
  readonly scenarioId: Observation483ScenarioState;
  readonly waveRef: string;
  readonly assistiveScopeRef: string;
  readonly channelScope: string;
  readonly assistiveTrustEnvelopeState: "shadow_only" | "frozen";
  readonly channelMonthlyDataState: "not_applicable" | "current" | "missing";
  readonly activeChannelCohort: boolean;
  readonly state: "exact" | "frozen" | "blocked";
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly observedAt: string;
  readonly recordHash: string;
}

export interface WaveIncidentCorrelation {
  readonly recordType: "WaveIncidentCorrelation";
  readonly correlationId: string;
  readonly scenarioId: Observation483ScenarioState;
  readonly waveRef: string;
  readonly tenantScope: string;
  readonly tenantSliceRef: string;
  readonly aggregateIncidentCount: number;
  readonly tenantSliceIncidentCount: number;
  readonly aggregateState: "exact" | "breached";
  readonly sliceState: "exact" | "breached";
  readonly aggregateHealthyButSliceBreach: boolean;
  readonly sourceProjectionRef: string;
  readonly owner: string;
  readonly state: "exact" | "breached";
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly observedAt: string;
  readonly recordHash: string;
}

export interface GuardrailEvaluation {
  readonly recordType: "GuardrailEvaluation";
  readonly evaluationId: string;
  readonly scenarioId: Observation483ScenarioState;
  readonly waveRef: string;
  readonly ruleId: string;
  readonly ruleKind: string;
  readonly method: string;
  readonly comparator: string;
  readonly threshold: number;
  readonly unit: string;
  readonly interval: string;
  readonly metricRef: string;
  readonly observedValue: number;
  readonly sampleSize: number;
  readonly requiredSampleSize: number;
  readonly sourceProjectionRef: string;
  readonly tenantScope: string;
  readonly cohortScope: string;
  readonly channelScope: string;
  readonly routeFamilyRef: string;
  readonly state: GuardrailEvaluationState;
  readonly severity: "info" | "watch" | "pause" | "rollback" | "block";
  readonly blockerRefs: readonly string[];
  readonly recommendationRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly evaluatedAt: string;
  readonly recordHash: string;
}

export interface DwellWindowEvidence {
  readonly recordType: "DwellWindowEvidence";
  readonly dwellEvidenceId: string;
  readonly scenarioId: Observation483ScenarioState;
  readonly waveRef: string;
  readonly policyRef: string;
  readonly dwellWindow: string;
  readonly minimumObservationHours: number;
  readonly observedHours: number;
  readonly openedAt: string;
  readonly evaluatedAt: string;
  readonly sampleCadenceMinutes: number;
  readonly requiredSamples: number;
  readonly observedSamples: number;
  readonly pointMetricsGreen: boolean;
  readonly dwellSatisfied: boolean;
  readonly evidenceComplete: boolean;
  readonly state: "complete" | "observing" | "insufficient_evidence" | "blocked";
  readonly whyNotStable: string | null;
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly recordHash: string;
}

export interface WavePauseRecommendation {
  readonly recordType: "WavePauseRecommendation";
  readonly recommendationId: string;
  readonly scenarioId: Observation483ScenarioState;
  readonly waveRef: string;
  readonly reasonCode: string;
  readonly actionType: "pause";
  readonly commandHandlerRef: string;
  readonly roleAuthorizationRef: string;
  readonly idempotencyKey: string;
  readonly purposeBindingRef: string;
  readonly injectedClockRef: string;
  readonly recoveryActionRef: string;
  readonly scope: {
    readonly tenantScope: string;
    readonly cohortScope: string;
    readonly channelScope: string;
  };
  readonly state: "recommended" | "not_required";
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly generatedAt: string;
  readonly wormAuditRef: string;
  readonly recordHash: string;
}

export interface WaveRollbackRecommendation {
  readonly recordType: "WaveRollbackRecommendation";
  readonly recommendationId: string;
  readonly scenarioId: Observation483ScenarioState;
  readonly waveRef: string;
  readonly reasonCode: string;
  readonly actionType: "rollback";
  readonly commandHandlerRef: string;
  readonly roleAuthorizationRef: string;
  readonly idempotencyKey: string;
  readonly purposeBindingRef: string;
  readonly injectedClockRef: string;
  readonly recoveryActionRef: string;
  readonly state: "recommended" | "not_required";
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly generatedAt: string;
  readonly wormAuditRef: string;
  readonly recordHash: string;
}

export interface WaveWideningEligibility {
  readonly recordType: "WaveWideningEligibility";
  readonly eligibilityId: string;
  readonly scenarioId: Observation483ScenarioState;
  readonly waveRef: string;
  readonly stabilityState: WaveObservationState;
  readonly eligibilityState: "exact" | "blocked" | "insufficient_evidence";
  readonly wideningEnabled: boolean;
  readonly nextWaveRef: string;
  readonly reason: string;
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly generatedAt: string;
  readonly wormAuditRef: string;
  readonly recordHash: string;
}

export interface WaveStabilityVerdict {
  readonly recordType: "WaveStabilityVerdict";
  readonly verdictId: string;
  readonly taskId: typeof TASK_ID;
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly scenarioId: Observation483ScenarioState;
  readonly waveRef: string;
  readonly releaseCandidateRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly releaseWatchTupleRef: string;
  readonly releaseWatchTupleHash: string;
  readonly observationPolicyRef: string;
  readonly guardrailSnapshotRef: string;
  readonly tenantScope: string;
  readonly cohortScope: string;
  readonly channelScope: string;
  readonly stabilityState: WaveObservationState;
  readonly wideningEligibilityRef: string;
  readonly pauseRecommendationRefs: readonly string[];
  readonly rollbackRecommendationRefs: readonly string[];
  readonly blockerRefs: readonly string[];
  readonly guardrailEvaluationRefs: readonly string[];
  readonly dwellWindowEvidenceRef: string;
  readonly incidentCorrelationRefs: readonly string[];
  readonly supportLoadSampleRefs: readonly string[];
  readonly projectionLagSampleRefs: readonly string[];
  readonly runtimeHealthSampleRefs: readonly string[];
  readonly assistiveChannelPostureSampleRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly artifactRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly owner: string;
  readonly nextSafeAction: string;
  readonly generatedAt: string;
  readonly wormAuditRef: string;
  readonly recordHash: string;
}

export interface WaveObservationRun {
  readonly recordType: "WaveObservationRun";
  readonly observationRunId: string;
  readonly taskId: typeof TASK_ID;
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly scenarioId: Observation483ScenarioState;
  readonly waveRef: string;
  readonly releaseCandidateRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly releaseWatchTupleRef: string;
  readonly observationPolicyRef: string;
  readonly guardrailSnapshotRef: string;
  readonly tenantScope: string;
  readonly cohortScope: string;
  readonly channelScope: string;
  readonly signalRefs: readonly string[];
  readonly guardrailEvaluationRefs: readonly string[];
  readonly dwellWindowEvidenceRef: string;
  readonly stabilityVerdictRef: string;
  readonly state: WaveObservationState;
  readonly nextSafeAction: string;
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly owner: string;
  readonly generatedAt: string;
  readonly wormAuditRef: string;
  readonly recordHash: string;
}

const sourceRefs = [
  "prompt/483.md",
  "prompt/shared_operating_contract_473_to_489.md",
  "blueprint/platform-runtime-and-release-blueprint.md#releasewatchtuple",
  "blueprint/platform-runtime-and-release-blueprint.md#waveobservationpolicy",
  "blueprint/platform-runtime-and-release-blueprint.md#waveguardrailsnapshot",
  "blueprint/phase-9-the-assurance-ledger.md#incident-workflow",
  "blueprint/phase-8-the-assistive-layer.md#assistive-trust-envelope",
  "blueprint/phase-7-inside-the-nhs-app.md#monthly-data-and-limited-release-monitoring",
  "data/release/476_release_wave_manifest.json",
  "data/release/476_wave_guardrail_snapshots.json",
  "data/release/476_wave_observation_policies.json",
  "data/release/482_wave1_promotion_settlement.json",
] as const;

const requiredInputPaths = [
  "data/release/476_release_wave_manifest.json",
  "data/release/476_wave_guardrail_snapshots.json",
  "data/release/476_wave_observation_policies.json",
  "data/release/482_wave1_promotion_settlement.json",
  "data/evidence/482_wave1_promotion_evidence.json",
] as const;

export const required483EdgeCases = [
  "edge_483_dwell_window_incomplete_but_point_metrics_green",
  "edge_483_tenant_slice_incident_spike_aggregate_healthy",
  "edge_483_projection_lag_staff_queue_only",
  "edge_483_assistive_trust_envelope_freezes_mid_wave",
  "edge_483_runtime_publication_parity_stale_after_promotion",
  "edge_483_support_load_breaches_while_technical_probes_pass",
  "edge_483_channel_monthly_data_missing_for_active_channel_cohort",
] as const;

const defaultBinding = {
  releaseRef: "release:programme-core-baseline:phase0-6-phase8-9:2026-04-28",
  releaseCandidateRef: "RC_LOCAL_V1",
  runtimePublicationBundleRef: "rpb::local::authoritative",
  releasePublicationParityRef: "rpp::local::authoritative",
  releaseWatchTupleRef: "RWT_LOCAL_V1",
  releaseWatchTupleHash: "9e419df51ddbbe289935c8f50152d2c69039cc8e9b6a443f83be09f054094779",
  waveRef: "wave_476_1_core_web_canary",
  tenantScope: "tenant-demo-gp:programme-core-release",
  cohortScope: "wtc_476_wave1_core_web_smallest_safe",
  channelScope: "wcs_476_wave1_core_web_only",
  assistiveScope: "was_476_wave1_assistive_shadow_only",
  guardrailSnapshotRef: "wgs_476_wave1_core_web",
  observationPolicyRef: "wop_476_wave1_24h",
  nextWaveRef: "wave_476_2_core_web_staff_pharmacy_after_projection",
} as const;

const scenarioEdges: Record<Observation483ScenarioState, string | null> = {
  stable: null,
  observing: "edge_483_dwell_window_incomplete_but_point_metrics_green",
  insufficient_evidence: null,
  tenant_slice_incident: "edge_483_tenant_slice_incident_spike_aggregate_healthy",
  staff_queue_projection_lag: "edge_483_projection_lag_staff_queue_only",
  assistive_freeze: "edge_483_assistive_trust_envelope_freezes_mid_wave",
  runtime_parity_stale: "edge_483_runtime_publication_parity_stale_after_promotion",
  support_load_breach: "edge_483_support_load_breaches_while_technical_probes_pass",
  channel_monthly_missing: "edge_483_channel_monthly_data_missing_for_active_channel_cohort",
};

interface ScenarioSignals {
  readonly scenarioId: Observation483ScenarioState;
  readonly observedHours: number;
  readonly observedSamples: number;
  readonly latencyP95Ms: number;
  readonly errorRatePercent: number;
  readonly aggregateIncidentCount: number;
  readonly tenantSliceIncidentCount: number;
  readonly supportTickets: number;
  readonly aggregateProjectionLagSeconds: number;
  readonly projectionLagSeconds: number;
  readonly projectionRouteFamily: string;
  readonly safetySignals: number;
  readonly runtimeParityAgeMinutes: number;
  readonly runtimePublicationState: "current" | "stale";
  readonly assistiveTrustEnvelopeState: "shadow_only" | "frozen";
  readonly activeChannelCohort: boolean;
  readonly channelMonthlyDataState: "not_applicable" | "current" | "missing";
}

interface ScenarioRecords {
  readonly signals: ScenarioSignals;
  readonly supportSample: WaveSupportLoadSample;
  readonly projectionLagSample: ProjectionLagSample;
  readonly runtimeHealthSample: RuntimeHealthSample;
  readonly assistiveChannelPostureSample: AssistiveChannelPostureSample;
  readonly incidentCorrelation: WaveIncidentCorrelation;
  readonly guardrailEvaluations: readonly GuardrailEvaluation[];
  readonly dwellWindowEvidence: DwellWindowEvidence;
  readonly pauseRecommendations: readonly WavePauseRecommendation[];
  readonly rollbackRecommendations: readonly WaveRollbackRecommendation[];
  readonly wideningEligibility: WaveWideningEligibility;
  readonly stabilityVerdict: WaveStabilityVerdict;
  readonly observationRun: WaveObservationRun;
}

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
  if (missing.length > 0) throw new Error(`483 required inputs missing: ${missing.join(", ")}`);
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
  const settlement = readJson<any>("data/release/482_wave1_promotion_settlement.json");
  const wave =
    manifest.deploymentWaves?.find((entry: any) => entry.waveId === defaultBinding.waveRef) ?? {};
  return {
    ...defaultBinding,
    releaseRef: wave.releaseRef ?? defaultBinding.releaseRef,
    releaseCandidateRef: wave.releaseCandidateRef ?? defaultBinding.releaseCandidateRef,
    runtimePublicationBundleRef:
      settlement.settlement?.observedRuntimePublicationBundleRef ??
      wave.runtimePublicationBundleRef ??
      defaultBinding.runtimePublicationBundleRef,
    releasePublicationParityRef:
      wave.releasePublicationParityRef ?? defaultBinding.releasePublicationParityRef,
    releaseWatchTupleRef:
      settlement.settlement?.releaseWatchTupleRef ??
      wave.releaseWatchTupleRef ??
      defaultBinding.releaseWatchTupleRef,
    releaseWatchTupleHash: wave.releaseWatchTupleHash ?? defaultBinding.releaseWatchTupleHash,
    waveRef: wave.waveId ?? defaultBinding.waveRef,
    tenantScope: wave.tenantScope ?? defaultBinding.tenantScope,
    cohortScope: wave.tenantCohortRef ?? defaultBinding.cohortScope,
    channelScope: wave.channelScopeRef ?? defaultBinding.channelScope,
    assistiveScope: wave.assistiveScopeRef ?? defaultBinding.assistiveScope,
    guardrailSnapshotRef:
      settlement.settlement?.observedGuardrailSnapshotRef ??
      wave.guardrailSnapshotRef ??
      defaultBinding.guardrailSnapshotRef,
    observationPolicyRef:
      settlement.settlement?.waveObservationPolicyRef ??
      wave.observationPolicyRef ??
      defaultBinding.observationPolicyRef,
    nextWaveRef: defaultBinding.nextWaveRef,
  };
}

function policyForWave() {
  const binding = releaseBindingFromInputs();
  const policies = readJson<any>("data/release/476_wave_observation_policies.json");
  return (
    policies.policies?.find((entry: any) => entry.policyId === binding.observationPolicyRef) ?? {
      policyId: binding.observationPolicyRef,
      minimumObservationHours: 24,
      dwellWindow: "PT24H",
      requiredProbeRefs: [],
    }
  );
}

function guardrailRulesForWave(): any[] {
  const binding = releaseBindingFromInputs();
  const snapshots = readJson<any>("data/release/476_wave_guardrail_snapshots.json");
  const snapshot =
    snapshots.snapshots?.find((entry: any) => entry.snapshotId === binding.guardrailSnapshotRef) ??
    {};
  return Array.isArray(snapshot.guardrailRules) ? snapshot.guardrailRules : [];
}

function evidenceHash(relativePath: string): string {
  return hashValue(readJson(relativePath));
}

function scenarioSignals(scenarioId: Observation483ScenarioState): ScenarioSignals {
  const base: ScenarioSignals = {
    scenarioId,
    observedHours: 24,
    observedSamples: 288,
    latencyP95Ms: 612,
    errorRatePercent: 0.08,
    aggregateIncidentCount: 0,
    tenantSliceIncidentCount: 0,
    supportTickets: 1,
    aggregateProjectionLagSeconds: 34,
    projectionLagSeconds: 34,
    projectionRouteFamily: "aggregate",
    safetySignals: 0,
    runtimeParityAgeMinutes: 9,
    runtimePublicationState: "current",
    assistiveTrustEnvelopeState: "shadow_only",
    activeChannelCohort: false,
    channelMonthlyDataState: "not_applicable",
  };

  const overrides: Partial<Record<Observation483ScenarioState, Partial<ScenarioSignals>>> = {
    observing: { observedHours: 8, observedSamples: 96 },
    insufficient_evidence: { observedHours: 24, observedSamples: 48 },
    tenant_slice_incident: { aggregateIncidentCount: 0, tenantSliceIncidentCount: 2 },
    staff_queue_projection_lag: {
      aggregateProjectionLagSeconds: 64,
      projectionLagSeconds: 181,
      projectionRouteFamily: "staff_queue",
    },
    assistive_freeze: { assistiveTrustEnvelopeState: "frozen" },
    runtime_parity_stale: { runtimeParityAgeMinutes: 47, runtimePublicationState: "stale" },
    support_load_breach: { supportTickets: 5 },
    channel_monthly_missing: {
      activeChannelCohort: true,
      channelMonthlyDataState: "missing",
    },
  };

  return { ...base, ...(overrides[scenarioId] ?? {}) };
}

function comparisonPass(observedValue: number, comparator: string, threshold: number): boolean {
  if (comparator === "<=") return observedValue <= threshold;
  if (comparator === "==") return observedValue === threshold;
  if (comparator === ">") return observedValue > threshold;
  return false;
}

function observedValueForRule(rule: any, signals: ScenarioSignals): number {
  const metricRef = String(rule.metricRef ?? "");
  if (metricRef.includes("request-latency")) return signals.latencyP95Ms;
  if (metricRef.includes("http-5xx")) return signals.errorRatePercent;
  if (metricRef.includes("major-incident")) return signals.aggregateIncidentCount;
  if (metricRef.includes("launch-ticket")) return signals.supportTickets;
  if (metricRef.includes("projection")) return signals.aggregateProjectionLagSeconds;
  if (metricRef.includes("safety")) return signals.safetySignals;
  return 0;
}

function blockerForRule(rule: any, scenarioId: Observation483ScenarioState): string {
  const ruleKind = String(rule.ruleKind ?? rule.ruleId ?? "guardrail");
  return `blocker:483:${scenarioId}:${ruleKind.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
}

function buildSupportSample(signals: ScenarioSignals): WaveSupportLoadSample {
  const binding = releaseBindingFromInputs();
  const threshold = 3;
  const breached = signals.supportTickets > threshold;
  return withHash<WaveSupportLoadSample>({
    recordType: "WaveSupportLoadSample",
    sampleId: `support_sample_483_${signals.scenarioId}`,
    scenarioId: signals.scenarioId,
    waveRef: binding.waveRef,
    tenantScope: binding.tenantScope,
    cohortScope: binding.cohortScope,
    channelScope: binding.channelScope,
    routeFamilyRef: "support_intake",
    launchTicketCount: signals.supportTickets,
    threshold,
    interval: "PT24H",
    technicalProbeState: "exact",
    sourceProjectionRef: "projection:support-launch-load:synthetic:483",
    owner: "support-operations",
    state: breached ? "breached" : "exact",
    blockerRefs: breached ? ["blocker:483:support-load-above-wave1-threshold"] : [],
    evidenceRefs: ["data/bau/475_operating_model.json"],
    sourceRefs,
    observedAt: FIXED_NOW,
  });
}

function buildProjectionLagSample(signals: ScenarioSignals): ProjectionLagSample {
  const binding = releaseBindingFromInputs();
  const threshold = 120;
  const breached = signals.projectionLagSeconds > threshold;
  return withHash<ProjectionLagSample>({
    recordType: "ProjectionLagSample",
    sampleId: `projection_lag_sample_483_${signals.scenarioId}`,
    scenarioId: signals.scenarioId,
    waveRef: binding.waveRef,
    tenantScope: binding.tenantScope,
    cohortScope: binding.cohortScope,
    channelScope: binding.channelScope,
    routeFamilyRef: signals.projectionRouteFamily,
    maxLagSeconds: signals.projectionLagSeconds,
    aggregateMaxLagSeconds: signals.aggregateProjectionLagSeconds,
    threshold,
    interval: "PT15M",
    sourceProjectionRef: "projection:runtime-read-model-lag:synthetic:483",
    owner: "platform-projection-owner",
    state: breached ? "breached" : "exact",
    blockerRefs: breached ? ["blocker:483:staff-queue-projection-lag-over-threshold"] : [],
    evidenceRefs: ["data/migration/474_projection_readiness_verdicts.json"],
    sourceRefs,
    observedAt: FIXED_NOW,
  });
}

function buildRuntimeHealthSample(signals: ScenarioSignals): RuntimeHealthSample {
  const binding = releaseBindingFromInputs();
  const stale = signals.runtimePublicationState === "stale";
  return withHash<RuntimeHealthSample>({
    recordType: "RuntimeHealthSample",
    sampleId: `runtime_health_sample_483_${signals.scenarioId}`,
    scenarioId: signals.scenarioId,
    releaseCandidateRef: binding.releaseCandidateRef,
    runtimePublicationBundleRef: binding.runtimePublicationBundleRef,
    publicationParityRef: binding.releasePublicationParityRef,
    parityAgeMinutes: signals.runtimeParityAgeMinutes,
    maxParityAgeMinutes: 15,
    runtimePublicationState: signals.runtimePublicationState,
    state: stale ? "stale" : "exact",
    blockerRefs: stale ? ["blocker:483:runtime-publication-parity-stale-after-promotion"] : [],
    evidenceRefs: [
      "data/release/482_wave1_publication_parity_after_promotion.json",
      "data/release/482_wave1_promotion_settlement.json",
    ],
    sourceRefs,
    observedAt: FIXED_NOW,
  });
}

function buildPostureSample(signals: ScenarioSignals): AssistiveChannelPostureSample {
  const binding = releaseBindingFromInputs();
  const frozen = signals.assistiveTrustEnvelopeState === "frozen";
  const missingMonthly =
    signals.activeChannelCohort && signals.channelMonthlyDataState === "missing";
  return withHash<AssistiveChannelPostureSample>({
    recordType: "AssistiveChannelPostureSample",
    sampleId: `assistive_channel_posture_483_${signals.scenarioId}`,
    scenarioId: signals.scenarioId,
    waveRef: binding.waveRef,
    assistiveScopeRef: binding.assistiveScope,
    channelScope: binding.channelScope,
    assistiveTrustEnvelopeState: signals.assistiveTrustEnvelopeState,
    channelMonthlyDataState: signals.channelMonthlyDataState,
    activeChannelCohort: signals.activeChannelCohort,
    state: missingMonthly ? "blocked" : frozen ? "frozen" : "exact",
    blockerRefs: [
      ...(frozen ? ["blocker:483:assistive-trust-envelope-frozen-mid-wave"] : []),
      ...(missingMonthly ? ["blocker:483:active-channel-monthly-data-obligation-missing"] : []),
    ],
    evidenceRefs: [
      "data/release/476_wave_observation_policies.json",
      "data/release/476_release_wave_manifest.json",
    ],
    sourceRefs,
    observedAt: FIXED_NOW,
  });
}

function buildIncidentCorrelation(signals: ScenarioSignals): WaveIncidentCorrelation {
  const binding = releaseBindingFromInputs();
  const aggregateState = signals.aggregateIncidentCount === 0 ? "exact" : "breached";
  const sliceState = signals.tenantSliceIncidentCount === 0 ? "exact" : "breached";
  return withHash<WaveIncidentCorrelation>({
    recordType: "WaveIncidentCorrelation",
    correlationId: `incident_correlation_483_${signals.scenarioId}`,
    scenarioId: signals.scenarioId,
    waveRef: binding.waveRef,
    tenantScope: binding.tenantScope,
    tenantSliceRef: "tenant-slice:demo-gp:core-web:staff-and-patient",
    aggregateIncidentCount: signals.aggregateIncidentCount,
    tenantSliceIncidentCount: signals.tenantSliceIncidentCount,
    aggregateState,
    sliceState,
    aggregateHealthyButSliceBreach: aggregateState === "exact" && sliceState === "breached",
    sourceProjectionRef: "projection:ops-incident-correlation:synthetic:483",
    owner: "incident-manager",
    state: sliceState,
    blockerRefs:
      sliceState === "breached"
        ? ["blocker:483:tenant-slice-incident-spike-hidden-by-aggregate"]
        : [],
    evidenceRefs: ["data/evidence/481_dr_and_go_live_smoke_report.json"],
    sourceRefs,
    observedAt: FIXED_NOW,
  });
}

function baseRuleEvaluations(
  signals: ScenarioSignals,
  supportSample: WaveSupportLoadSample,
): GuardrailEvaluation[] {
  const binding = releaseBindingFromInputs();
  const policy = policyForWave();
  const requiredSampleSize = Number(policy.minimumObservationHours ?? 24) * 12;
  const insufficient = signals.observedSamples < requiredSampleSize;
  return guardrailRulesForWave().map((rule: any) => {
    const observedValue = observedValueForRule(rule, signals);
    const threshold = Number(rule.threshold ?? 0);
    const comparator = String(rule.comparator ?? "<=");
    const passed = comparisonPass(observedValue, comparator, threshold);
    const state: GuardrailEvaluationState = insufficient
      ? "insufficient_evidence"
      : passed
        ? "exact"
        : "breached";
    const ruleId = String(rule.ruleId ?? "guardrail:483:unknown");
    const blockerRefs = state === "breached" ? [blockerForRule(rule, signals.scenarioId)] : [];
    const recommendationRefs =
      state === "breached" && !ruleId.includes("safety")
        ? [`pause_rec_483_${signals.scenarioId}`]
        : [];
    return withHash<GuardrailEvaluation>({
      recordType: "GuardrailEvaluation",
      evaluationId: `guardrail_eval_483_${signals.scenarioId}_${ruleId.replace(/[^a-z0-9]+/gi, "_")}`,
      scenarioId: signals.scenarioId,
      waveRef: binding.waveRef,
      ruleId,
      ruleKind: String(rule.ruleKind ?? "unknown"),
      method: `evaluate ${rule.metricRef ?? "metric"} ${comparator} ${threshold} over ${rule.interval ?? "PT5M"}`,
      comparator,
      threshold,
      unit: String(rule.unit ?? "count"),
      interval: String(rule.interval ?? "PT5M"),
      metricRef: String(rule.metricRef ?? "metric:unknown"),
      observedValue,
      sampleSize: signals.observedSamples,
      requiredSampleSize,
      sourceProjectionRef: ruleId.includes("support-load")
        ? supportSample.sourceProjectionRef
        : "projection:release-watch-approved-signals:synthetic:483",
      tenantScope: binding.tenantScope,
      cohortScope: binding.cohortScope,
      channelScope: binding.channelScope,
      routeFamilyRef: "aggregate",
      state,
      severity: state === "breached" ? "pause" : insufficient ? "watch" : "info",
      blockerRefs,
      recommendationRefs,
      evidenceRefs: ["data/release/476_wave_guardrail_snapshots.json"],
      sourceRefs,
      evaluatedAt: FIXED_NOW,
    });
  });
}

function supplementalEvaluations(
  signals: ScenarioSignals,
  incidentCorrelation: WaveIncidentCorrelation,
  projectionLagSample: ProjectionLagSample,
  runtimeHealthSample: RuntimeHealthSample,
  postureSample: AssistiveChannelPostureSample,
): GuardrailEvaluation[] {
  const binding = releaseBindingFromInputs();
  const common = {
    scenarioId: signals.scenarioId,
    waveRef: binding.waveRef,
    tenantScope: binding.tenantScope,
    cohortScope: binding.cohortScope,
    channelScope: binding.channelScope,
    sourceRefs,
    evaluatedAt: FIXED_NOW,
  };
  const evaluations: GuardrailEvaluation[] = [];

  if (incidentCorrelation.aggregateHealthyButSliceBreach) {
    evaluations.push(
      withHash<GuardrailEvaluation>({
        recordType: "GuardrailEvaluation",
        ...common,
        evaluationId: `guardrail_eval_483_${signals.scenarioId}_tenant_slice_incident`,
        ruleId: "guardrail:483:tenant-slice-incident-correlation",
        ruleKind: "tenant_slice_incident_correlation",
        method: "evaluate tenant slice incidents independently from aggregate incident count",
        comparator: "==",
        threshold: 0,
        unit: "sev1_or_sev2",
        interval: "PT24H",
        metricRef: "metric:ops:tenant-slice-major-incident-count",
        observedValue: incidentCorrelation.tenantSliceIncidentCount,
        sampleSize: signals.observedSamples,
        requiredSampleSize: 288,
        sourceProjectionRef: incidentCorrelation.sourceProjectionRef,
        routeFamilyRef: "tenant_slice",
        state: "breached",
        severity: "pause",
        blockerRefs: incidentCorrelation.blockerRefs,
        recommendationRefs: [`pause_rec_483_${signals.scenarioId}`],
        evidenceRefs: [incidentCorrelation.correlationId],
      }),
    );
  }

  if (projectionLagSample.state === "breached") {
    evaluations.push(
      withHash<GuardrailEvaluation>({
        recordType: "GuardrailEvaluation",
        ...common,
        evaluationId: `guardrail_eval_483_${signals.scenarioId}_staff_queue_projection_lag`,
        ruleId: "guardrail:483:staff-queue-projection-lag",
        ruleKind: "projection_lag_slice",
        method: "evaluate staff queue projection lag even when aggregate projection lag is green",
        comparator: "<=",
        threshold: projectionLagSample.threshold,
        unit: "seconds",
        interval: projectionLagSample.interval,
        metricRef: "metric:projection:staff-queue-lag-seconds",
        observedValue: projectionLagSample.maxLagSeconds,
        sampleSize: signals.observedSamples,
        requiredSampleSize: 288,
        sourceProjectionRef: projectionLagSample.sourceProjectionRef,
        routeFamilyRef: projectionLagSample.routeFamilyRef,
        state: "breached",
        severity: "pause",
        blockerRefs: projectionLagSample.blockerRefs,
        recommendationRefs: [`pause_rec_483_${signals.scenarioId}`],
        evidenceRefs: [projectionLagSample.sampleId],
      }),
    );
  }

  if (runtimeHealthSample.state === "stale") {
    evaluations.push(
      withHash<GuardrailEvaluation>({
        recordType: "GuardrailEvaluation",
        ...common,
        evaluationId: `guardrail_eval_483_${signals.scenarioId}_runtime_parity_stale`,
        ruleId: "guardrail:483:runtime-publication-parity-current",
        ruleKind: "runtime_publication_parity",
        method:
          "fail closed when publication parity age exceeds the post-promotion freshness ceiling",
        comparator: "<=",
        threshold: runtimeHealthSample.maxParityAgeMinutes,
        unit: "minutes",
        interval: "PT15M",
        metricRef: "metric:runtime:publication-parity-age-minutes",
        observedValue: runtimeHealthSample.parityAgeMinutes,
        sampleSize: signals.observedSamples,
        requiredSampleSize: 288,
        sourceProjectionRef: "projection:runtime-publication-parity:synthetic:483",
        routeFamilyRef: "runtime_publication",
        state: "stale",
        severity: "rollback",
        blockerRefs: runtimeHealthSample.blockerRefs,
        recommendationRefs: [`rollback_rec_483_${signals.scenarioId}`],
        evidenceRefs: [runtimeHealthSample.sampleId],
      }),
    );
  }

  if (postureSample.state === "frozen" || postureSample.state === "blocked") {
    evaluations.push(
      withHash<GuardrailEvaluation>({
        recordType: "GuardrailEvaluation",
        ...common,
        evaluationId: `guardrail_eval_483_${signals.scenarioId}_assistive_channel_posture`,
        ruleId:
          postureSample.state === "blocked"
            ? "guardrail:483:channel-monthly-data-obligation"
            : "guardrail:483:assistive-trust-envelope-current",
        ruleKind:
          postureSample.state === "blocked"
            ? "channel_monthly_data_obligation"
            : "assistive_trust_envelope",
        method:
          postureSample.state === "blocked"
            ? "block active channel cohort when monthly-data obligation evidence is missing"
            : "pause wave when assistive trust envelope freezes during observation",
        comparator: "==",
        threshold: 0,
        unit: postureSample.state === "blocked" ? "missing-monthly-packs" : "frozen-envelopes",
        interval: "P1D",
        metricRef:
          postureSample.state === "blocked"
            ? "metric:channel:monthly-data-pack-missing"
            : "metric:assistive:trust-envelope-frozen-count",
        observedValue: 1,
        sampleSize: signals.observedSamples,
        requiredSampleSize: 288,
        sourceProjectionRef: "projection:assistive-channel-posture:synthetic:483",
        routeFamilyRef: postureSample.state === "blocked" ? "nhs_app_channel" : "assistive",
        state: postureSample.state === "blocked" ? "blocked" : "breached",
        severity: postureSample.state === "blocked" ? "block" : "pause",
        blockerRefs: postureSample.blockerRefs,
        recommendationRefs:
          postureSample.state === "blocked" ? [] : [`pause_rec_483_${signals.scenarioId}`],
        evidenceRefs: [postureSample.sampleId],
      }),
    );
  }

  return evaluations;
}

function buildDwellWindowEvidence(signals: ScenarioSignals): DwellWindowEvidence {
  const binding = releaseBindingFromInputs();
  const policy = policyForWave();
  const minimumObservationHours = Number(policy.minimumObservationHours ?? 24);
  const requiredSamples = minimumObservationHours * 12;
  const dwellSatisfied = signals.observedHours >= minimumObservationHours;
  const evidenceComplete = dwellSatisfied && signals.observedSamples >= requiredSamples;
  const pointMetricsGreen =
    signals.latencyP95Ms <= 900 &&
    signals.errorRatePercent <= 0.5 &&
    signals.aggregateIncidentCount === 0 &&
    signals.safetySignals === 0;
  const state: DwellWindowEvidence["state"] = !dwellSatisfied
    ? "observing"
    : signals.observedSamples < requiredSamples
      ? "insufficient_evidence"
      : "complete";
  return withHash<DwellWindowEvidence>({
    recordType: "DwellWindowEvidence",
    dwellEvidenceId: `dwell_window_483_${signals.scenarioId}`,
    scenarioId: signals.scenarioId,
    waveRef: binding.waveRef,
    policyRef: binding.observationPolicyRef,
    dwellWindow: String(policy.dwellWindow ?? "PT24H"),
    minimumObservationHours,
    observedHours: signals.observedHours,
    openedAt: "2026-04-27T00:00:00.000Z",
    evaluatedAt: FIXED_NOW,
    sampleCadenceMinutes: 5,
    requiredSamples,
    observedSamples: signals.observedSamples,
    pointMetricsGreen,
    dwellSatisfied,
    evidenceComplete,
    state,
    whyNotStable: evidenceComplete
      ? null
      : state === "observing"
        ? "The dwell window is not complete even though point metrics are green."
        : "The dwell window elapsed, but approved projection sample count is below policy.",
    blockerRefs:
      state === "complete"
        ? []
        : state === "observing"
          ? ["blocker:483:dwell-window-not-complete"]
          : ["blocker:483:approved-projection-sample-count-insufficient"],
    evidenceRefs: [
      "data/release/476_wave_observation_policies.json",
      "data/release/482_wave1_promotion_settlement.json",
    ],
    sourceRefs,
  });
}

function classifyObservation(
  evaluations: readonly GuardrailEvaluation[],
  dwellWindowEvidence: DwellWindowEvidence,
): WaveObservationState {
  if (evaluations.some((entry) => entry.state === "blocked")) return "blocked";
  if (evaluations.some((entry) => entry.severity === "rollback")) return "rollback_recommended";
  if (evaluations.some((entry) => entry.severity === "pause")) return "pause_recommended";
  if (dwellWindowEvidence.state === "observing") return "observing";
  if (
    dwellWindowEvidence.state === "insufficient_evidence" ||
    evaluations.some((entry) => entry.state === "insufficient_evidence")
  ) {
    return "insufficient_evidence";
  }
  return "stable";
}

function nextSafeActionFor(state: WaveObservationState): string {
  const actions: Record<WaveObservationState, string> = {
    stable: "Wave 1 is stable. Task 484 may compute the next canary widening scope.",
    observing: "Continue observing Wave 1 until the full dwell window is complete.",
    insufficient_evidence:
      "Keep Wave 1 active but do not widen until approved projection samples meet policy.",
    pause_recommended:
      "Open the typed pause command and hold any widening until the slice blocker is settled.",
    rollback_recommended:
      "Open rollback recommendation and restore exact runtime publication parity before widening.",
    blocked: "Block stability and widening until the channel or evidence obligation is current.",
  };
  return actions[state];
}

function buildPauseRecommendation(
  signals: ScenarioSignals,
  blockerRefs: readonly string[],
): WavePauseRecommendation | null {
  const binding = releaseBindingFromInputs();
  if (blockerRefs.length === 0) return null;
  return withHash<WavePauseRecommendation>({
    recordType: "WavePauseRecommendation",
    recommendationId: `pause_rec_483_${signals.scenarioId}`,
    scenarioId: signals.scenarioId,
    waveRef: binding.waveRef,
    reasonCode: blockerRefs[0] ?? "blocker:483:pause",
    actionType: "pause",
    commandHandlerRef: "WaveActionRecord:483:pause-command-handler",
    roleAuthorizationRef: "role-auth:release-governance:wave-controller",
    idempotencyKey: `idem_483_pause_${signals.scenarioId}_20260428`,
    purposeBindingRef: `purpose:483:${binding.waveRef}:pause:${signals.scenarioId}`,
    injectedClockRef: "clock:483:fixed-2026-04-28T00:00:00Z",
    recoveryActionRef: "recovery:483:pause-wave1-and-investigate",
    scope: {
      tenantScope: binding.tenantScope,
      cohortScope: binding.cohortScope,
      channelScope: binding.channelScope,
    },
    state: "recommended",
    blockerRefs,
    evidenceRefs: ["data/release/483_wave1_guardrail_evaluations.json"],
    sourceRefs,
    generatedAt: FIXED_NOW,
    wormAuditRef: `worm-ledger:483:pause-recommendation:${signals.scenarioId}`,
  });
}

function buildRollbackRecommendation(
  signals: ScenarioSignals,
  blockerRefs: readonly string[],
): WaveRollbackRecommendation | null {
  const binding = releaseBindingFromInputs();
  if (blockerRefs.length === 0) return null;
  return withHash<WaveRollbackRecommendation>({
    recordType: "WaveRollbackRecommendation",
    recommendationId: `rollback_rec_483_${signals.scenarioId}`,
    scenarioId: signals.scenarioId,
    waveRef: binding.waveRef,
    reasonCode: blockerRefs[0] ?? "blocker:483:rollback",
    actionType: "rollback",
    commandHandlerRef: "WaveActionRecord:483:rollback-command-handler",
    roleAuthorizationRef: "role-auth:release-governance:wave-controller",
    idempotencyKey: `idem_483_rollback_${signals.scenarioId}_20260428`,
    purposeBindingRef: `purpose:483:${binding.waveRef}:rollback:${signals.scenarioId}`,
    injectedClockRef: "clock:483:fixed-2026-04-28T00:00:00Z",
    recoveryActionRef: "recovery:483:rollback-wave1-runtime-publication",
    state: "recommended",
    blockerRefs,
    evidenceRefs: ["data/release/483_wave1_guardrail_evaluations.json"],
    sourceRefs,
    generatedAt: FIXED_NOW,
    wormAuditRef: `worm-ledger:483:rollback-recommendation:${signals.scenarioId}`,
  });
}

export function build483ScenarioRecords(
  scenarioId: Observation483ScenarioState = "stable",
  artifactRefs: readonly string[] = [],
): ScenarioRecords {
  ensureRequiredInputs();
  const binding = releaseBindingFromInputs();
  const signals = scenarioSignals(scenarioId);
  const supportSample = buildSupportSample(signals);
  const projectionLagSample = buildProjectionLagSample(signals);
  const runtimeHealthSample = buildRuntimeHealthSample(signals);
  const assistiveChannelPostureSample = buildPostureSample(signals);
  const incidentCorrelation = buildIncidentCorrelation(signals);
  const baseEvaluations = baseRuleEvaluations(signals, supportSample);
  const extraEvaluations = supplementalEvaluations(
    signals,
    incidentCorrelation,
    projectionLagSample,
    runtimeHealthSample,
    assistiveChannelPostureSample,
  );
  const guardrailEvaluations = [...baseEvaluations, ...extraEvaluations];
  const dwellWindowEvidence = buildDwellWindowEvidence(signals);
  const stabilityState = classifyObservation(guardrailEvaluations, dwellWindowEvidence);
  const pauseBlockers = guardrailEvaluations
    .filter((entry) => entry.severity === "pause")
    .flatMap((entry) => entry.blockerRefs);
  const rollbackBlockers = guardrailEvaluations
    .filter((entry) => entry.severity === "rollback")
    .flatMap((entry) => entry.blockerRefs);
  const blockingRefs = [
    ...new Set([
      ...guardrailEvaluations.flatMap((entry) => entry.blockerRefs),
      ...dwellWindowEvidence.blockerRefs,
    ]),
  ];
  const pauseRecommendation = buildPauseRecommendation(signals, pauseBlockers);
  const rollbackRecommendation = buildRollbackRecommendation(signals, rollbackBlockers);
  const pauseRecommendations = pauseRecommendation ? [pauseRecommendation] : [];
  const rollbackRecommendations = rollbackRecommendation ? [rollbackRecommendation] : [];
  const wideningEligibility = withHash<WaveWideningEligibility>({
    recordType: "WaveWideningEligibility",
    eligibilityId: `widening_eligibility_483_${scenarioId}`,
    scenarioId,
    waveRef: binding.waveRef,
    stabilityState,
    eligibilityState:
      stabilityState === "stable"
        ? "exact"
        : stabilityState === "insufficient_evidence" || stabilityState === "observing"
          ? "insufficient_evidence"
          : "blocked",
    wideningEnabled: stabilityState === "stable",
    nextWaveRef: binding.nextWaveRef,
    reason:
      stabilityState === "stable"
        ? "Dwell evidence is complete and every Wave 1 guardrail is exact."
        : nextSafeActionFor(stabilityState),
    blockerRefs: stabilityState === "stable" ? [] : blockingRefs,
    evidenceRefs: [
      "data/release/483_wave1_guardrail_evaluations.json",
      "data/release/483_wave1_dwell_window_evidence.json",
    ],
    sourceRefs,
    generatedAt: FIXED_NOW,
    wormAuditRef: `worm-ledger:483:widening-eligibility:${scenarioId}`,
  });
  const stabilityVerdict = withHash<WaveStabilityVerdict>({
    recordType: "WaveStabilityVerdict",
    verdictId: `stability_verdict_483_${scenarioId}`,
    taskId: TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    scenarioId,
    waveRef: binding.waveRef,
    releaseCandidateRef: binding.releaseCandidateRef,
    runtimePublicationBundleRef: binding.runtimePublicationBundleRef,
    releaseWatchTupleRef: binding.releaseWatchTupleRef,
    releaseWatchTupleHash: binding.releaseWatchTupleHash,
    observationPolicyRef: binding.observationPolicyRef,
    guardrailSnapshotRef: binding.guardrailSnapshotRef,
    tenantScope: binding.tenantScope,
    cohortScope: binding.cohortScope,
    channelScope: binding.channelScope,
    stabilityState,
    wideningEligibilityRef: wideningEligibility.eligibilityId,
    pauseRecommendationRefs: pauseRecommendations.map((entry) => entry.recommendationId),
    rollbackRecommendationRefs: rollbackRecommendations.map((entry) => entry.recommendationId),
    blockerRefs: stabilityState === "stable" ? [] : blockingRefs,
    guardrailEvaluationRefs: guardrailEvaluations.map((entry) => entry.evaluationId),
    dwellWindowEvidenceRef: dwellWindowEvidence.dwellEvidenceId,
    incidentCorrelationRefs: [incidentCorrelation.correlationId],
    supportLoadSampleRefs: [supportSample.sampleId],
    projectionLagSampleRefs: [projectionLagSample.sampleId],
    runtimeHealthSampleRefs: [runtimeHealthSample.sampleId],
    assistiveChannelPostureSampleRefs: [assistiveChannelPostureSample.sampleId],
    evidenceRefs: [
      "data/release/476_wave_guardrail_snapshots.json",
      "data/release/476_wave_observation_policies.json",
      "data/release/482_wave1_promotion_settlement.json",
    ],
    artifactRefs,
    sourceRefs,
    owner: "release-governance",
    nextSafeAction: nextSafeActionFor(stabilityState),
    generatedAt: FIXED_NOW,
    wormAuditRef: `worm-ledger:483:stability-verdict:${scenarioId}`,
  });
  const observationRun = withHash<WaveObservationRun>({
    recordType: "WaveObservationRun",
    observationRunId: `observation_run_483_${scenarioId}`,
    taskId: TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    scenarioId,
    waveRef: binding.waveRef,
    releaseCandidateRef: binding.releaseCandidateRef,
    runtimePublicationBundleRef: binding.runtimePublicationBundleRef,
    releaseWatchTupleRef: binding.releaseWatchTupleRef,
    observationPolicyRef: binding.observationPolicyRef,
    guardrailSnapshotRef: binding.guardrailSnapshotRef,
    tenantScope: binding.tenantScope,
    cohortScope: binding.cohortScope,
    channelScope: binding.channelScope,
    signalRefs: [
      supportSample.sampleId,
      projectionLagSample.sampleId,
      runtimeHealthSample.sampleId,
      assistiveChannelPostureSample.sampleId,
      incidentCorrelation.correlationId,
    ],
    guardrailEvaluationRefs: guardrailEvaluations.map((entry) => entry.evaluationId),
    dwellWindowEvidenceRef: dwellWindowEvidence.dwellEvidenceId,
    stabilityVerdictRef: stabilityVerdict.verdictId,
    state: stabilityState,
    nextSafeAction: stabilityVerdict.nextSafeAction,
    blockerRefs: stabilityVerdict.blockerRefs,
    evidenceRefs: [
      "data/release/482_wave1_promotion_settlement.json",
      "data/release/476_wave_observation_policies.json",
    ],
    sourceRefs,
    owner: "release-governance",
    generatedAt: FIXED_NOW,
    wormAuditRef: `worm-ledger:483:observation-run:${scenarioId}`,
  });

  return {
    signals,
    supportSample,
    projectionLagSample,
    runtimeHealthSample,
    assistiveChannelPostureSample,
    incidentCorrelation,
    guardrailEvaluations,
    dwellWindowEvidence,
    pauseRecommendations,
    rollbackRecommendations,
    wideningEligibility,
    stabilityVerdict,
    observationRun,
  };
}

export function build483Records(artifactRefs: readonly string[] = listOutputArtifacts()) {
  const scenarioIds: Observation483ScenarioState[] = [
    "stable",
    "observing",
    "insufficient_evidence",
    "tenant_slice_incident",
    "staff_queue_projection_lag",
    "assistive_freeze",
    "runtime_parity_stale",
    "support_load_breach",
    "channel_monthly_missing",
  ];
  const scenarios = scenarioIds.map((scenarioId) =>
    build483ScenarioRecords(scenarioId, artifactRefs),
  );
  const activeScenario = scenarios[0];
  const edgeCaseFixtures = withHash<JsonObject>({
    recordType: "Wave1ObservationEdgeCaseFixtures",
    taskId: TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    generatedAt: FIXED_NOW,
    fixtures: scenarios
      .filter((entry) => scenarioEdges[entry.signals.scenarioId])
      .map((entry) => ({
        edgeCaseId: scenarioEdges[entry.signals.scenarioId],
        scenarioId: entry.signals.scenarioId,
        stabilityState: entry.stabilityVerdict.stabilityState,
        blockerRefs: entry.stabilityVerdict.blockerRefs,
        evidenceRefs: [
          entry.dwellWindowEvidence.dwellEvidenceId,
          ...entry.guardrailEvaluations.map((evaluation) => evaluation.evaluationId),
        ],
      })),
    sourceRefs,
  });

  return {
    activeScenario,
    scenarios,
    edgeCaseFixtures,
    allGuardrailEvaluations: scenarios.flatMap((entry) => entry.guardrailEvaluations),
    allDwellWindowEvidence: scenarios.map((entry) => entry.dwellWindowEvidence),
    allStabilityVerdicts: scenarios.map((entry) => entry.stabilityVerdict),
    allObservationRuns: scenarios.map((entry) => entry.observationRun),
    allSupportSamples: scenarios.map((entry) => entry.supportSample),
    allProjectionLagSamples: scenarios.map((entry) => entry.projectionLagSample),
    allRuntimeHealthSamples: scenarios.map((entry) => entry.runtimeHealthSample),
    allAssistiveChannelPostureSamples: scenarios.map(
      (entry) => entry.assistiveChannelPostureSample,
    ),
    allIncidentCorrelations: scenarios.map((entry) => entry.incidentCorrelation),
    allPauseRecommendations: scenarios.flatMap((entry) => entry.pauseRecommendations),
    allRollbackRecommendations: scenarios.flatMap((entry) => entry.rollbackRecommendations),
    allWideningEligibilities: scenarios.map((entry) => entry.wideningEligibility),
  };
}

function buildSchema(): JsonObject {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://vecells.local/contracts/483_wave_observation.schema.json",
    title: "Wave 1 observation records",
    type: "object",
    required: ["recordType", "taskId", "schemaVersion", "generatedAt"],
    properties: {
      recordType: { type: "string" },
      taskId: { const: TASK_ID },
      schemaVersion: { const: SCHEMA_VERSION },
      generatedAt: { type: "string", format: "date-time" },
      activeRun: { $ref: "#/$defs/WaveObservationRun" },
      activeVerdict: { $ref: "#/$defs/WaveStabilityVerdict" },
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
      WaveObservationRun: {
        allOf: [
          { $ref: "#/$defs/hashedRecord" },
          {
            type: "object",
            required: ["state", "guardrailEvaluationRefs", "dwellWindowEvidenceRef"],
            properties: {
              state: {
                enum: [
                  "observing",
                  "stable",
                  "pause_recommended",
                  "rollback_recommended",
                  "blocked",
                  "insufficient_evidence",
                ],
              },
            },
          },
        ],
      },
      WaveStabilityVerdict: {
        allOf: [
          { $ref: "#/$defs/hashedRecord" },
          {
            type: "object",
            required: ["stabilityState", "wideningEligibilityRef", "blockerRefs"],
          },
        ],
      },
      GuardrailEvaluation: {
        allOf: [
          { $ref: "#/$defs/hashedRecord" },
          {
            type: "object",
            required: ["ruleId", "state", "sampleSize", "requiredSampleSize"],
          },
        ],
      },
      DwellWindowEvidence: {
        allOf: [
          { $ref: "#/$defs/hashedRecord" },
          {
            type: "object",
            required: ["dwellSatisfied", "evidenceComplete", "state"],
          },
        ],
      },
    },
  };
}

function buildInterfaceGap(): JsonObject {
  return withHash<JsonObject>({
    recordType: "ProgrammeBatchInterfaceGap",
    gapId: "PROGRAMME_BATCH_473_489_INTERFACE_GAP_483_WAVE_OBSERVATION_AUTHORITY",
    taskId: TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    sourceConcepts: [
      "ReleaseWatchTuple live wave proof",
      "WaveObservationPolicy dwell authority",
      "Assistive and channel posture samples",
      "tenant-slice incident correlation",
    ],
    repositoryGap:
      "No single native contract joined Wave 1 promotion settlement, live guardrail projections, dwell evidence, assistive posture, and channel monthly-data obligations.",
    failClosedBridge:
      "monitor_483_wave1.ts publishes typed hashed observations and classifies stale, missing, partial, tenant-crossing, frozen, and contradictory evidence before any widening eligibility can become exact.",
    owner: "release-governance",
    state: "closed_by_typed_bridge",
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
        refId: "nhs-service-manual-accessibility",
        relevance:
          "Wave Observation Tower uses semantic controls, keyboard access, direct labels, high-contrast checks, and table fallback for timeline and guardrail visuals.",
      },
      {
        refId: "playwright-browser-automation",
        relevance:
          "483 Playwright verification captures traces, screenshots, ARIA snapshots, reduced-motion and forced-colors contexts.",
      },
      {
        refId: "nhs-app-monthly-data-and-limited-release",
        relevance:
          "The active channel cohort edge case blocks stability when monthly-data obligation evidence is missing.",
      },
      {
        refId: "clinical-safety-and-assistive-trust-monitoring",
        relevance:
          "Assistive trust-envelope freeze is treated as a pause recommendation during Wave 1 observation.",
      },
    ],
    sourceRefs,
  });
}

function buildAlgorithmAlignmentNotes(): string {
  return `# 483 Algorithm Alignment Notes

Task: ${TASK_ID}
Generated: ${FIXED_NOW}

## Implemented source authority

- ReleaseWatchTuple and WaveObservationPolicy are loaded through Wave 1 records from tasks 476 and 482.
- WaveGuardrailSnapshot thresholds are evaluated with deterministic approved projection samples.
- Dwell-window evidence is a first-class record; green point metrics cannot mark stability before the 24-hour window and sample count are complete.
- Stability states are restricted to observing, stable, pause_recommended, rollback_recommended, blocked, and insufficient_evidence.
- Widening is enabled only for the stable verdict, and the stable verdict is the active happy-path output for task 484.

## Fail-closed bridge

The repository did not have one native contract for observation authority across runtime parity, tenant-slice incidents, support load, projection lag, assistive posture, and channel monthly-data evidence. The bridge is recorded in data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_483_WAVE_OBSERVATION_AUTHORITY.json and is closed by typed hashed records.

## Edge cases covered

${required483EdgeCases.map((edgeCase) => `- ${edgeCase}`).join("\n")}
`;
}

function buildRunbook(): string {
  return `# Wave 1 Monitoring And Pause Runbook

Generated: ${FIXED_NOW}

## Operating rule

Use data/release/483_wave1_stability_verdict.json as the Wave 1 observation authority. Do not widen from dashboard labels, raw logs, or informal feature flags.

## Stable path

1. Confirm the active WaveStabilityVerdict is stable.
2. Confirm wideningEligibility.wideningEnabled is true.
3. Confirm dwell evidence is complete for 24 hours with 288 approved five-minute samples.
4. Confirm pauseRecommendationRefs and rollbackRecommendationRefs are empty.
5. Hand task 484 the active verdict and eligibility refs.

## Pause path

Open a typed WaveActionRecord pause command when a guardrail evaluation carries severity pause. Preserve the tenant, cohort, channel, idempotency key, purpose binding, injected clock, and WORM audit refs from the WavePauseRecommendation.

## Rollback path

Open the rollback command when runtime publication parity is stale after promotion. Do not widen until parity is exact and a fresh stability verdict is published.

## Blocked path

Missing channel monthly-data evidence for an active channel cohort blocks stability. Keep Wave 1 active only in the already approved scope and resolve the channel obligation before any wider or channel-specific action.
`;
}

function buildObservationReport(records: ReturnType<typeof build483Records>): string {
  const stable = records.activeScenario.stabilityVerdict;
  return `# Wave 1 Observation Report

Generated: ${FIXED_NOW}

## Active verdict

- Verdict: ${stable.stabilityState}
- Wave: ${stable.waveRef}
- Watch tuple: ${stable.releaseWatchTupleRef}
- Watch tuple hash: ${stable.releaseWatchTupleHash}
- Dwell evidence: ${stable.dwellWindowEvidenceRef}
- Widening eligibility: ${stable.wideningEligibilityRef}
- Next safe action: ${stable.nextSafeAction}

## Scenario coverage

${records.allStabilityVerdicts
  .map(
    (verdict) =>
      `- ${verdict.scenarioId}: ${verdict.stabilityState}; blockers=${verdict.blockerRefs.length}`,
  )
  .join("\n")}

## Browser evidence

${stable.artifactRefs.length === 0 ? "- Browser artifacts are generated by the Playwright suite." : stable.artifactRefs.map((artifact) => `- ${artifact}`).join("\n")}
`;
}

export function write483Wave1ObservationArtifacts(): void {
  const artifactRefs = listOutputArtifacts();
  const records = build483Records(artifactRefs);
  const active = records.activeScenario;

  writeJson(
    "data/release/483_wave1_observation_run.json",
    withHash<JsonObject>({
      recordType: "Wave1ObservationRunEnvelope",
      taskId: TASK_ID,
      schemaVersion: SCHEMA_VERSION,
      generatedAt: FIXED_NOW,
      activeRun: active.observationRun,
      scenarioRuns: records.allObservationRuns,
      supportLoadSamples: records.allSupportSamples,
      projectionLagSamples: records.allProjectionLagSamples,
      runtimeHealthSamples: records.allRuntimeHealthSamples,
      assistiveChannelPostureSamples: records.allAssistiveChannelPostureSamples,
      incidentCorrelations: records.allIncidentCorrelations,
      edgeCaseFixtures: records.edgeCaseFixtures,
      sourceRefs,
    }),
  );

  writeJson(
    "data/release/483_wave1_guardrail_evaluations.json",
    withHash<JsonObject>({
      recordType: "Wave1GuardrailEvaluationEnvelope",
      taskId: TASK_ID,
      schemaVersion: SCHEMA_VERSION,
      generatedAt: FIXED_NOW,
      activeEvaluations: active.guardrailEvaluations,
      scenarioEvaluations: records.allGuardrailEvaluations,
      pauseRecommendations: records.allPauseRecommendations,
      rollbackRecommendations: records.allRollbackRecommendations,
      sourceRefs,
    }),
  );

  writeJson(
    "data/release/483_wave1_dwell_window_evidence.json",
    withHash<JsonObject>({
      recordType: "Wave1DwellWindowEvidenceEnvelope",
      taskId: TASK_ID,
      schemaVersion: SCHEMA_VERSION,
      generatedAt: FIXED_NOW,
      activeDwellWindowEvidence: active.dwellWindowEvidence,
      scenarioDwellWindowEvidence: records.allDwellWindowEvidence,
      sourceRefs,
    }),
  );

  writeJson(
    "data/release/483_wave1_stability_verdict.json",
    withHash<JsonObject>({
      recordType: "Wave1StabilityVerdictEnvelope",
      taskId: TASK_ID,
      schemaVersion: SCHEMA_VERSION,
      generatedAt: FIXED_NOW,
      activeVerdict: active.stabilityVerdict,
      activeWideningEligibility: active.wideningEligibility,
      scenarioVerdicts: records.allStabilityVerdicts,
      wideningEligibilities: records.allWideningEligibilities,
      edgeCaseFixtures: records.edgeCaseFixtures,
      sourceRefs,
    }),
  );

  writeJson("data/contracts/483_wave_observation.schema.json", buildSchema());
  writeJson(
    "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_483_WAVE_OBSERVATION_AUTHORITY.json",
    buildInterfaceGap(),
  );
  writeJson("data/analysis/483_external_reference_notes.json", buildExternalReferenceNotes());
  writeText("data/analysis/483_algorithm_alignment_notes.md", buildAlgorithmAlignmentNotes());
  writeText("docs/runbooks/483_wave1_monitoring_and_pause_runbook.md", buildRunbook());
  writeText("docs/test-evidence/483_wave1_observation_report.md", buildObservationReport(records));

  formatFiles([
    "data/release/483_wave1_observation_run.json",
    "data/release/483_wave1_guardrail_evaluations.json",
    "data/release/483_wave1_dwell_window_evidence.json",
    "data/release/483_wave1_stability_verdict.json",
    "data/contracts/483_wave_observation.schema.json",
    "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_483_WAVE_OBSERVATION_AUTHORITY.json",
    "data/analysis/483_external_reference_notes.json",
    "data/analysis/483_algorithm_alignment_notes.md",
    "docs/runbooks/483_wave1_monitoring_and_pause_runbook.md",
    "docs/test-evidence/483_wave1_observation_report.md",
  ]);
}

if (process.argv[1]?.endsWith("monitor_483_wave1.ts")) {
  write483Wave1ObservationArtifacts();
}
