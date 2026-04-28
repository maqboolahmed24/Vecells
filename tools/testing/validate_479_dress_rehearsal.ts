import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../..");

type JsonObject = Record<string, unknown>;

const requiredFiles = [
  "tests/playwright/479_dress_rehearsal_patient_primary_flows.spec.ts",
  "tests/playwright/479_dress_rehearsal_staff_primary_flows.spec.ts",
  "tests/playwright/479_dress_rehearsal_pharmacy_hub_booking_flows.spec.ts",
  "tests/playwright/479_dress_rehearsal_assistive_and_channel_posture.spec.ts",
  "tests/fixtures/479_production_like_seed.json",
  "data/evidence/479_dress_rehearsal_report.json",
  "data/evidence/479_dress_rehearsal_trace_manifest.json",
  "docs/test-evidence/479_production_like_dress_rehearsal_report.md",
  "docs/runbooks/479_dress_rehearsal_incident_and_rollback_notes.md",
  "data/analysis/479_algorithm_alignment_notes.md",
  "data/analysis/479_external_reference_notes.json",
  "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_479_DRESS_REHEARSAL_SETTLEMENT.json",
] as const;

const requiredRecordTypes = [
  "DressRehearsalScenario",
  "DressRehearsalRun",
  "DressRehearsalEvidenceRow",
  "DressRehearsalFailureTriage",
  "ProductionLikeFixtureManifest",
  "SyntheticPatientPersona",
  "SyntheticStaffPersona",
  "SyntheticTenantScope",
  "RunbookExerciseBinding",
  "ObservationProbeEvidence",
  "ReleaseWaveDressRehearsalBinding",
  "RollbackPracticeEvidence",
] as const;

const requiredEdgeCases = [
  "edge_479_patient_resume_after_projection_refresh",
  "edge_479_red_flag_diversion_preserves_audit",
  "edge_479_staff_queue_resort_selected_item_in_flight",
  "edge_479_booking_slot_invalidates_safe_state",
  "edge_479_pharmacy_provider_unavailable_manual_fallback",
  "edge_479_assistive_trust_downgrade_suppresses_insert",
  "edge_479_nhs_app_deferred_core_web_passes",
  "edge_479_network_reconnect_no_duplicate_settlement",
] as const;

const forbiddenRawSensitivePattern =
  /patientNhs|nhsNumber|clinicalNarrative|rawIncident|rawRouteParam|artifact-fragment:raw|artifactFragment=|investigationKey=|Bearer |access_token|refresh_token|id_token|sk_live|BEGIN PRIVATE|PRIVATE KEY|s3:\/\/|gs:\/\/|blob:|inlineSecret|rawExportUrl|postgres:\/\/|mysql:\/\/|AKIA[0-9A-Z]{16}|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((entry) => canonicalize(entry)).join(",")}]`;
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalize((value as JsonObject)[key])}`)
    .join(",")}}`;
}

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

export function validate479DressRehearsalArtifacts(): void {
  requiredFiles.forEach(assertFileExists);

  const seed = readJson<JsonObject>("tests/fixtures/479_production_like_seed.json");
  const report = readJson<JsonObject>("data/evidence/479_dress_rehearsal_report.json");
  const traceManifest = readJson<JsonObject>(
    "data/evidence/479_dress_rehearsal_trace_manifest.json",
  );
  const interfaceGap = readJson<JsonObject>(
    "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_479_DRESS_REHEARSAL_SETTLEMENT.json",
  );
  const externalRefs = readJson<JsonObject>("data/analysis/479_external_reference_notes.json");

  for (const [label, value] of Object.entries({
    seed,
    report,
    traceManifest,
    interfaceGap,
    externalRefs,
  })) {
    assertNoSensitiveSerialized(value, label);
    assertHashRecord(value, label);
  }

  for (const relativePath of [
    "docs/test-evidence/479_production_like_dress_rehearsal_report.md",
    "docs/runbooks/479_dress_rehearsal_incident_and_rollback_notes.md",
    "data/analysis/479_algorithm_alignment_notes.md",
  ]) {
    assertNoSensitiveSerialized(
      fs.readFileSync(path.join(ROOT, relativePath), "utf8"),
      relativePath,
    );
  }

  assert.equal(seed.taskId, "seq_479");
  assert.equal(seed.schemaVersion, "479.programme.production-like-dress-rehearsal.v1");
  assert.equal(report.taskId, "seq_479");
  assert.equal(report.launchBlockingFailureCount, 0, "no launch-blocking failures may remain");
  assert.equal(report.overallRunState, "passed_with_channel_constraint");

  const recordTypes = collectRecordTypes({ seed, report, traceManifest, interfaceGap });
  requiredRecordTypes.forEach((recordType) => {
    assert(recordTypes.has(recordType), `${recordType} must be represented`);
  });

  const scenarios = asArray(seed.scenarios, "seed.scenarios");
  assert(
    scenarios.length >= 8,
    "all primary patient, staff, operations, assistive, and channel flows must be covered",
  );
  const edgeCaseRefs = new Set(
    scenarios.flatMap((scenario) =>
      asArray(scenario.requiredEdgeCaseRefs, `${scenario.scenarioId}.requiredEdgeCaseRefs`),
    ),
  );
  requiredEdgeCases.forEach((edgeCase) => {
    assert(edgeCaseRefs.has(edgeCase), `${edgeCase} must be covered by a scenario`);
  });

  const reportRuns = asArray(report.runs, "report.runs");
  assert.equal(reportRuns.length, scenarios.length, "every scenario needs a run row");
  for (const run of reportRuns) {
    assert(
      run.runState === "passed" || run.runState === "constrained",
      `${run.scenarioRef} must pass or be constrained`,
    );
    assert.equal(
      run.completionClaimPermittedBeforeSettlement,
      false,
      `${run.scenarioRef} cannot claim completion before settlement`,
    );
    assert.equal(run.consoleErrorCount, 0, `${run.scenarioRef} has console errors`);
    assert.equal(run.pageErrorCount, 0, `${run.scenarioRef} has page errors`);
    assert.equal(run.requestFailureCount, 0, `${run.scenarioRef} has network failures`);
    assert(asArray(run.traceRefs, `${run.scenarioRef}.traceRefs`).length > 0, "trace must exist");
    assert.equal(run.duplicateSettlementCount, 0, `${run.scenarioRef} duplicated settlement`);
  }

  const reconnect = reportRuns.find(
    (run) => run.scenarioRef === "drs_479_network_reconnect_no_duplicate_settlement",
  );
  assert(reconnect, "network reconnect run must exist");
  assert.equal(
    reconnect?.observedSettlementCount,
    1,
    "reconnect scenario must observe one settlement",
  );

  const channel = reportRuns.find(
    (run) => run.scenarioRef === "drs_479_nhs_app_deferred_core_web_passes",
  );
  assert(channel, "NHS App deferred channel run must exist");
  assert.equal(channel?.runState, "constrained");
  assert.equal(channel?.launchClassification, "constrained_launch");

  const evidenceRows = asArray(report.evidenceRows, "report.evidenceRows");
  for (const row of evidenceRows) {
    assert(
      asArray(row.artifactRefs, `${row.evidenceRowId}.artifactRefs`).length > 0,
      "evidence row must point at artifacts",
    );
    assert.equal(
      row.noPhiOrSecretsObserved,
      true,
      `${row.evidenceRowId} sensitive-data guard failed`,
    );
  }

  const artifactRefs = asArray(traceManifest.artifactRefs, "traceManifest.artifactRefs").map(
    String,
  );
  assert(artifactRefs.length > 0, "trace manifest must list browser artifacts");
  artifactRefs.forEach((artifactRef) => {
    assert(
      artifactRef.startsWith("output/playwright/479-dress-rehearsal/"),
      `${artifactRef} must stay under the 479 output root`,
    );
    assert(fs.existsSync(path.join(ROOT, artifactRef)), `${artifactRef} must exist`);
  });

  assert.equal(
    (interfaceGap as any).commandRequirements?.settlementRequiredBeforeCompletionClaim,
    true,
    "interface gap must require settlement before completion claim",
  );
  assert.equal(
    (interfaceGap as any).commandRequirements?.duplicateSettlementPermitted,
    false,
    "interface gap must disallow duplicate settlements",
  );

  const notes = asArray(externalRefs.notes, "externalRefs.notes");
  assert(
    notes.some((note) => String(note.url).includes("playwright.dev")),
    "external notes must cite Playwright",
  );
  assert(
    notes.some((note) => String(note.url).includes("digital.nhs.uk/services/nhs-app")),
    "external notes must cite official NHS App guidance",
  );
  assert(
    notes.some((note) => String(note.url).includes("service-manual.nhs.uk/accessibility")),
    "external notes must cite NHS accessibility guidance",
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  validate479DressRehearsalArtifacts();
  console.log("479 dress rehearsal artifacts validated.");
}
