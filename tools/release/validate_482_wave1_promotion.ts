import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { canonicalize, required482EdgeCases, SCHEMA_VERSION, TASK_ID } from "./promote_482_wave1";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../..");

type JsonObject = Record<string, unknown>;

const requiredFiles = [
  "tools/release/promote_482_wave1.ts",
  "tools/release/validate_482_wave1_promotion.ts",
  "data/release/482_wave1_promotion_command.json",
  "data/release/482_wave1_promotion_settlement.json",
  "data/release/482_wave1_publication_parity_after_promotion.json",
  "data/evidence/482_wave1_promotion_evidence.json",
  "data/contracts/482_wave1_promotion.schema.json",
  "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_482_PROMOTION_AUTHORITY.json",
  "docs/runbooks/482_wave1_promotion_runbook.md",
  "docs/programme/482_wave1_promotion_decision.md",
  "tests/release/482_wave1_promotion_gate.test.ts",
  "tests/release/482_wave1_promotion_idempotency.test.ts",
  "tests/playwright/482_release_promotion_console.spec.ts",
  "data/analysis/482_algorithm_alignment_notes.md",
  "data/analysis/482_external_reference_notes.json",
] as const;

const requiredRecordTypes = [
  "Wave1PromotionCommand",
  "Wave1PromotionPreflight",
  "WaveActionRecord",
  "WaveActionSettlement",
  "PromotionAuthorityTuple",
  "PromotionBlocker",
  "PromotionIdempotencyBinding",
  "PromotionRecoveryDisposition",
  "PublicationParityAfterPromotion",
  "Wave1ActivationEvidence",
  "Wave1OperatorCommunication",
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

export function validate482Wave1PromotionArtifacts(): void {
  requiredFiles.forEach(assertFileExists);

  const command = readJson<JsonObject>("data/release/482_wave1_promotion_command.json");
  const settlement = readJson<JsonObject>("data/release/482_wave1_promotion_settlement.json");
  const parity = readJson<JsonObject>(
    "data/release/482_wave1_publication_parity_after_promotion.json",
  );
  const evidence = readJson<JsonObject>("data/evidence/482_wave1_promotion_evidence.json");
  const gap = readJson<JsonObject>(
    "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_482_PROMOTION_AUTHORITY.json",
  );
  const externalRefs = readJson<JsonObject>("data/analysis/482_external_reference_notes.json");

  for (const [label, value] of Object.entries({
    command,
    settlement,
    parity,
    evidence,
    gap,
    externalRefs,
  })) {
    assertNoSensitiveSerialized(value, label);
    assertHashRecord(value, label);
  }

  for (const relativePath of [
    "docs/runbooks/482_wave1_promotion_runbook.md",
    "docs/programme/482_wave1_promotion_decision.md",
    "data/analysis/482_algorithm_alignment_notes.md",
  ]) {
    assertNoSensitiveSerialized(
      fs.readFileSync(path.join(ROOT, relativePath), "utf8"),
      relativePath,
    );
  }

  assert.equal(evidence.taskId, TASK_ID);
  assert.equal(evidence.schemaVersion, SCHEMA_VERSION);
  assert.equal(evidence.promotionVerdict, "wave1_promoted_under_observation");
  const ready = evidence.ready as JsonObject;
  const readyCommand = ready.command as JsonObject;
  const readyPreflight = ready.preflight as JsonObject;
  const readySettlement = ready.settlement as JsonObject;
  const readyParity = ready.parity as JsonObject;
  const readyActivation = ready.activationEvidence as JsonObject;

  assert.equal(readyCommand.commandState, "accepted");
  assert.equal(readyPreflight.state, "exact");
  assert.deepEqual(readyPreflight.blockerRefs, []);
  assert(
    asArray(readyPreflight.lanes, "ready.preflight.lanes").every((lane) => lane.state === "exact"),
  );
  assert.equal(readySettlement.result, "applied");
  assert.equal(readyParity.parityState, "exact");
  assert.equal(readyParity.activationPermitted, true);
  assert.equal(readyActivation.activationState, "active_under_observation");
  assert.equal(readyCommand.operatorRoleRef, "role:release-manager");
  assert.equal(readyCommand.cohortScope, "wtc_476_wave1_core_web_smallest_safe");
  assert.equal(readyCommand.channelScope, "wcs_476_wave1_core_web_only");

  const recordTypes = collectRecordTypes({ command, settlement, parity, evidence, gap });
  requiredRecordTypes.forEach((recordType) => {
    assert(recordTypes.has(recordType), `${recordType} must be represented`);
  });

  const edgeCaseFixtures = asArray(evidence.edgeCaseFixtures, "edgeCaseFixtures");
  const edgeCaseIds = new Set(edgeCaseFixtures.map((fixture) => String(fixture.edgeCaseId)));
  required482EdgeCases.forEach((edgeCase) => {
    assert(edgeCaseIds.has(edgeCase), `${edgeCase} must be covered`);
  });

  const edgeSettlements = asArray(evidence.edgeSettlements, "edgeSettlements");
  assert(
    edgeSettlements.some((entry) => (entry.settlement as JsonObject).result === "denied_scope"),
    "operator role denial must settle as denied_scope",
  );
  assert(
    edgeSettlements.some(
      (entry) =>
        (entry.idempotencyBinding as JsonObject).replayDisposition === "same_settlement_returned",
    ),
    "duplicate idempotency key must return same settlement",
  );
  assert(
    edgeSettlements.some(
      (entry) =>
        (entry.parity as JsonObject).parityState === "mismatch" &&
        (entry.activationEvidence as JsonObject).activationState === "blocked",
    ),
    "publication parity mismatch must block activation evidence",
  );
  assert(
    edgeSettlements.some((entry) =>
      asArray((entry.preflight as JsonObject).blockerRefs, "edge.preflight.blockerRefs").includes(
        "blocker:482:rollback-binding-absent-for-wave1-route-family" as any,
      ),
    ),
    "missing rollback binding edge case must block preflight",
  );

  const artifacts = asArray(evidence.artifactRefs, "artifactRefs");
  for (const requiredArtifactMarker of [
    "ready",
    "blocked",
    "pending",
    "settled",
    "parity_failed",
  ]) {
    assert(
      artifacts.some((artifact) => String(artifact).includes(requiredArtifactMarker)),
      `Playwright artifacts must include ${requiredArtifactMarker}`,
    );
  }
  artifacts.forEach((artifact) => {
    const artifactRef = String(artifact);
    assert(
      artifactRef.startsWith("output/playwright/482-wave1-promotion/"),
      `${artifactRef} must stay under 482 output root`,
    );
    assert(fs.existsSync(path.join(ROOT, artifactRef)), `${artifactRef} must exist`);
  });

  console.log("482 Wave 1 promotion artifacts validated.");
}

if (process.argv[1]?.endsWith("validate_482_wave1_promotion.ts")) {
  validate482Wave1PromotionArtifacts();
}
