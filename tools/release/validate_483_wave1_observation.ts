import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { canonicalize, required483EdgeCases, SCHEMA_VERSION, TASK_ID } from "./monitor_483_wave1";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../..");

type JsonObject = Record<string, unknown>;

const requiredFiles = [
  "tools/release/monitor_483_wave1.ts",
  "tools/release/validate_483_wave1_observation.ts",
  "data/release/483_wave1_observation_run.json",
  "data/release/483_wave1_guardrail_evaluations.json",
  "data/release/483_wave1_dwell_window_evidence.json",
  "data/release/483_wave1_stability_verdict.json",
  "data/contracts/483_wave_observation.schema.json",
  "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_483_WAVE_OBSERVATION_AUTHORITY.json",
  "docs/runbooks/483_wave1_monitoring_and_pause_runbook.md",
  "docs/test-evidence/483_wave1_observation_report.md",
  "tests/release/483_wave_guardrail_evaluation.test.ts",
  "tests/release/483_wave_dwell_window.test.ts",
  "tests/playwright/483_wave_observation_tower.spec.ts",
  "data/analysis/483_algorithm_alignment_notes.md",
  "data/analysis/483_external_reference_notes.json",
] as const;

const requiredRecordTypes = [
  "WaveObservationRun",
  "GuardrailEvaluation",
  "DwellWindowEvidence",
  "WaveStabilityVerdict",
  "WavePauseRecommendation",
  "WaveRollbackRecommendation",
  "WaveWideningEligibility",
  "WaveIncidentCorrelation",
  "WaveSupportLoadSample",
  "ProjectionLagSample",
  "RuntimeHealthSample",
  "AssistiveChannelPostureSample",
  "ProgrammeBatchInterfaceGap",
] as const;

const forbiddenRawSensitivePattern =
  /patientNhs|nhsNumber|clinicalNarrative|rawIncident|rawRouteParam|artifact-fragment:raw|artifactFragment=|investigationKey=|Bearer |access_token|refresh_token|id_token|sk_live|BEGIN PRIVATE|PRIVATE KEY|s3:\/\/|gs:\/\/|blob:|inlineSecret|rawExportUrl|postgres:\/\/|mysql:\/\/|AKIA[0-9A-Z]{16}|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

function hashValue(value: unknown): string {
  return createHash("sha256").update(canonicalize(value)).digest("hex");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), "utf8")) as T;
}

function assertFileExists(relativePath: string): void {
  assert(fs.existsSync(path.join(ROOT, relativePath)), `${relativePath} must exist`);
}

function assertNoSensitiveSerialized(value: unknown, label: string): void {
  const serialized = typeof value === "string" ? value : JSON.stringify(value);
  assert(!forbiddenRawSensitivePattern.test(serialized), `${label} contains raw sensitive marker`);
}

function assertHashRecord(value: unknown, pathLabel = "record"): void {
  if (value === null || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertHashRecord(entry, `${pathLabel}[${index}]`));
    return;
  }
  const record = value as JsonObject;
  if (typeof record.recordHash === "string") {
    const { recordHash, ...withoutHash } = record;
    assert.equal(
      recordHash,
      hashValue(withoutHash),
      `${pathLabel} recordHash must be deterministic`,
    );
  }
  for (const [key, nested] of Object.entries(record)) {
    if (key !== "recordHash") assertHashRecord(nested, `${pathLabel}.${key}`);
  }
}

function collectRecordTypes(value: unknown, found = new Set<string>()): Set<string> {
  if (value === null || typeof value !== "object") return found;
  if (Array.isArray(value)) {
    value.forEach((entry) => collectRecordTypes(entry, found));
    return found;
  }
  const record = value as JsonObject;
  if (typeof record.recordType === "string") found.add(record.recordType);
  Object.values(record).forEach((entry) => collectRecordTypes(entry, found));
  return found;
}

function asArray(value: unknown, label: string): JsonObject[] {
  assert(Array.isArray(value), `${label} must be an array`);
  return value as JsonObject[];
}

function findByScenario(entries: JsonObject[], scenarioId: string, label: string): JsonObject {
  const found = entries.find((entry) => entry.scenarioId === scenarioId);
  assert(found, `${label} must include ${scenarioId}`);
  return found;
}

export function validate483Wave1ObservationArtifacts(): void {
  requiredFiles.forEach(assertFileExists);

  const run = readJson<JsonObject>("data/release/483_wave1_observation_run.json");
  const evaluations = readJson<JsonObject>("data/release/483_wave1_guardrail_evaluations.json");
  const dwell = readJson<JsonObject>("data/release/483_wave1_dwell_window_evidence.json");
  const verdict = readJson<JsonObject>("data/release/483_wave1_stability_verdict.json");
  const gap = readJson<JsonObject>(
    "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_483_WAVE_OBSERVATION_AUTHORITY.json",
  );
  const externalRefs = readJson<JsonObject>("data/analysis/483_external_reference_notes.json");

  for (const [label, value] of Object.entries({
    run,
    evaluations,
    dwell,
    verdict,
    gap,
    externalRefs,
  })) {
    assertNoSensitiveSerialized(value, label);
    assertHashRecord(value, label);
  }

  for (const relativePath of [
    "docs/runbooks/483_wave1_monitoring_and_pause_runbook.md",
    "docs/test-evidence/483_wave1_observation_report.md",
    "data/analysis/483_algorithm_alignment_notes.md",
  ]) {
    assertNoSensitiveSerialized(
      fs.readFileSync(path.join(ROOT, relativePath), "utf8"),
      relativePath,
    );
  }

  assert.equal(verdict.taskId, TASK_ID);
  assert.equal(verdict.schemaVersion, SCHEMA_VERSION);

  const activeVerdict = verdict.activeVerdict as JsonObject;
  const activeEligibility = verdict.activeWideningEligibility as JsonObject;
  assert.equal(activeVerdict.stabilityState, "stable");
  assert.deepEqual(activeVerdict.blockerRefs, []);
  assert.equal(activeEligibility.wideningEnabled, true);
  assert.equal(activeEligibility.eligibilityState, "exact");

  const scenarioVerdicts = asArray(verdict.scenarioVerdicts, "scenarioVerdicts");
  const wideningEligibilities = asArray(verdict.wideningEligibilities, "wideningEligibilities");
  for (const eligibility of wideningEligibilities) {
    assert.equal(
      eligibility.wideningEnabled,
      eligibility.scenarioId === "stable",
      `${eligibility.scenarioId} widening gate must only enable stable verdicts`,
    );
  }

  assert.equal(
    findByScenario(scenarioVerdicts, "observing", "scenarioVerdicts").stabilityState,
    "observing",
  );
  assert.equal(
    findByScenario(scenarioVerdicts, "insufficient_evidence", "scenarioVerdicts").stabilityState,
    "insufficient_evidence",
  );
  assert.equal(
    findByScenario(scenarioVerdicts, "tenant_slice_incident", "scenarioVerdicts").stabilityState,
    "pause_recommended",
  );
  assert.equal(
    findByScenario(scenarioVerdicts, "staff_queue_projection_lag", "scenarioVerdicts")
      .stabilityState,
    "pause_recommended",
  );
  assert.equal(
    findByScenario(scenarioVerdicts, "assistive_freeze", "scenarioVerdicts").stabilityState,
    "pause_recommended",
  );
  assert.equal(
    findByScenario(scenarioVerdicts, "runtime_parity_stale", "scenarioVerdicts").stabilityState,
    "rollback_recommended",
  );
  assert.equal(
    findByScenario(scenarioVerdicts, "support_load_breach", "scenarioVerdicts").stabilityState,
    "pause_recommended",
  );
  assert.equal(
    findByScenario(scenarioVerdicts, "channel_monthly_missing", "scenarioVerdicts").stabilityState,
    "blocked",
  );

  const edgeFixtures = verdict.edgeCaseFixtures as JsonObject;
  const edgeCaseIds = new Set(
    asArray(edgeFixtures.fixtures, "edgeCaseFixtures.fixtures").map((fixture) =>
      String(fixture.edgeCaseId),
    ),
  );
  required483EdgeCases.forEach((edgeCase) => {
    assert(edgeCaseIds.has(edgeCase), `${edgeCase} must be covered`);
  });

  const dwellRecords = asArray(dwell.scenarioDwellWindowEvidence, "scenarioDwellWindowEvidence");
  const observingDwell = findByScenario(dwellRecords, "observing", "scenarioDwellWindowEvidence");
  assert.equal(observingDwell.pointMetricsGreen, true);
  assert.equal(observingDwell.dwellSatisfied, false);
  assert.equal(observingDwell.state, "observing");
  assert.equal(
    findByScenario(dwellRecords, "insufficient_evidence", "scenarioDwellWindowEvidence").state,
    "insufficient_evidence",
  );

  const incidentCorrelations = asArray(run.incidentCorrelations, "incidentCorrelations");
  const tenantSlice = findByScenario(
    incidentCorrelations,
    "tenant_slice_incident",
    "incidentCorrelations",
  );
  assert.equal(tenantSlice.aggregateState, "exact");
  assert.equal(tenantSlice.sliceState, "breached");
  assert.equal(tenantSlice.aggregateHealthyButSliceBreach, true);

  const projectionSamples = asArray(run.projectionLagSamples, "projectionLagSamples");
  const staffQueue = findByScenario(
    projectionSamples,
    "staff_queue_projection_lag",
    "projectionLagSamples",
  );
  assert.equal(staffQueue.routeFamilyRef, "staff_queue");
  assert(Number(staffQueue.maxLagSeconds) > Number(staffQueue.threshold));

  const supportSamples = asArray(run.supportLoadSamples, "supportLoadSamples");
  const supportBreach = findByScenario(supportSamples, "support_load_breach", "supportLoadSamples");
  assert.equal(supportBreach.technicalProbeState, "exact");
  assert.equal(supportBreach.state, "breached");

  const postureSamples = asArray(
    run.assistiveChannelPostureSamples,
    "assistiveChannelPostureSamples",
  );
  assert.equal(
    findByScenario(postureSamples, "assistive_freeze", "assistiveChannelPostureSamples").state,
    "frozen",
  );
  assert.equal(
    findByScenario(postureSamples, "channel_monthly_missing", "assistiveChannelPostureSamples")
      .state,
    "blocked",
  );

  const recordTypes = collectRecordTypes({ run, evaluations, dwell, verdict, gap });
  requiredRecordTypes.forEach((recordType) => {
    assert(recordTypes.has(recordType), `${recordType} must be represented`);
  });

  const artifacts = asArray(activeVerdict.artifactRefs, "activeVerdict.artifactRefs");
  for (const requiredArtifactMarker of [
    "stable",
    "insufficient",
    "pause",
    "rollback",
    "blocked",
    "observing",
  ]) {
    assert(
      artifacts.some((artifact) => String(artifact).includes(requiredArtifactMarker)),
      `Playwright artifacts must include ${requiredArtifactMarker}`,
    );
  }
  artifacts.forEach((artifact) => {
    const artifactRef = String(artifact);
    assert(
      artifactRef.startsWith("output/playwright/483-wave-observation/"),
      `${artifactRef} must stay under 483 output root`,
    );
    assert(fs.existsSync(path.join(ROOT, artifactRef)), `${artifactRef} must exist`);
  });

  console.log("483 Wave 1 observation artifacts validated.");
}

if (process.argv[1]?.endsWith("validate_483_wave1_observation.ts")) {
  validate483Wave1ObservationArtifacts();
}
