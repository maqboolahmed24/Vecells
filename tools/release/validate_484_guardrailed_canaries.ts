import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  canonicalize,
  required484EdgeCases,
  SCHEMA_VERSION,
  TASK_ID,
} from "./promote_484_guardrailed_canaries";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../..");

type JsonObject = Record<string, unknown>;

const requiredFiles = [
  "tools/release/promote_484_guardrailed_canaries.ts",
  "tools/release/validate_484_guardrailed_canaries.ts",
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
  "tests/release/484_canary_widening_gate.test.ts",
  "tests/release/484_canary_pause_rollback.test.ts",
  "tests/playwright/484_canary_rollout.helpers.ts",
  "tests/playwright/484_canary_rollout_console.spec.ts",
  "apps/ops-console/src/canary-rollout-console-484.model.ts",
  "apps/ops-console/src/canary-rollout-console-484.tsx",
  "apps/ops-console/src/canary-rollout-console-484.css",
] as const;

const requiredRecordTypes = [
  "CanaryWavePlan",
  "CanaryScopeSelector",
  "CanaryGuardrailEvaluation",
  "CanaryWideningDecision",
  "CanaryWaveActionRecord",
  "CanaryWaveSettlement",
  "CanaryPauseRecord",
  "CanaryRollbackRecord",
  "CanaryBlastRadiusProof",
  "ChannelCanaryEligibility",
  "TenantCanaryEligibility",
  "RemainingWaveObservationPolicy",
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

function assertIncludes(value: unknown, expected: string, label: string): void {
  assert(Array.isArray(value) && value.includes(expected), `${label} must include ${expected}`);
}

export function validate484GuardrailedCanaryArtifacts(): void {
  requiredFiles.forEach(assertFileExists);

  const plan = readJson<JsonObject>("data/release/484_canary_wave_plan.json");
  const actions = readJson<JsonObject>("data/release/484_canary_wave_actions.json");
  const settlements = readJson<JsonObject>("data/release/484_canary_wave_settlements.json");
  const policies = readJson<JsonObject>(
    "data/release/484_remaining_wave_observation_policies.json",
  );
  const evidence = readJson<JsonObject>("data/release/484_wave_widening_evidence.json");
  const gap = readJson<JsonObject>(
    "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_484_CANARY_WIDENING_AUTHORITY.json",
  );
  const externalRefs = readJson<JsonObject>("data/analysis/484_external_reference_notes.json");

  for (const [label, value] of Object.entries({
    plan,
    actions,
    settlements,
    policies,
    evidence,
    gap,
    externalRefs,
  })) {
    assertNoSensitiveSerialized(value, label);
    assertHashRecord(value, label);
  }

  for (const relativePath of [
    "docs/runbooks/484_guardrailed_canary_rollout_runbook.md",
    "docs/test-evidence/484_remaining_wave_rollout_report.md",
    "data/analysis/484_algorithm_alignment_notes.md",
  ]) {
    assertNoSensitiveSerialized(
      fs.readFileSync(path.join(ROOT, relativePath), "utf8"),
      relativePath,
    );
  }

  assert.equal(evidence.taskId, TASK_ID);
  assert.equal(evidence.schemaVersion, SCHEMA_VERSION);

  const activeDecision = evidence.activeDecision as JsonObject;
  const activeSettlement = evidence.activeSettlement as JsonObject;
  assert.equal(activeDecision.scenarioId, "completed");
  assert.equal(activeDecision.previousStabilityState, "stable");
  assert.equal(activeDecision.decisionState, "completed");
  assert.equal(activeDecision.actionPermitted, true);
  assert.deepEqual(activeDecision.blockerRefs, []);
  assert.equal(activeSettlement.result, "applied");
  assert.equal(activeSettlement.observedWaveState, "completed");
  assert.equal(activeSettlement.observationState, "satisfied");
  assert.deepEqual(activeSettlement.blockerRefs, []);

  const scenarioDecisions = asArray(evidence.scenarioDecisions, "scenarioDecisions");
  const selectors = asArray(plan.selectors, "selectors");
  const blastRadiusProofs = asArray(plan.blastRadiusProofs, "blastRadiusProofs");
  const tenantEligibilities = asArray(plan.tenantEligibilities, "tenantEligibilities");
  const channelEligibilities = asArray(plan.channelEligibilities, "channelEligibilities");
  const scenarioSettlements = asArray(settlements.settlements, "settlements");
  const pauseRecords = asArray(settlements.pauseRecords, "pauseRecords");
  const rollbackRecords = asArray(settlements.rollbackRecords, "rollbackRecords");
  const remainingPolicies = asArray(policies.policies, "policies");

  const previous = findByScenario(
    scenarioDecisions,
    "previous_stability_not_exact",
    "scenarioDecisions",
  );
  assert.equal(previous.decisionState, "blocked");
  assert.equal(previous.actionPermitted, false);
  assertIncludes(
    previous.blockerRefs,
    "blocker:484:previous-wave-stability-not-exact",
    "previous stability blockers",
  );

  const support = findByScenario(
    tenantEligibilities,
    "support_capacity_constrained",
    "tenantEligibilities",
  );
  assert.equal(support.supportCapacityState, "constrained");
  assert.equal(
    findByScenario(scenarioDecisions, "support_capacity_constrained", "scenarioDecisions")
      .decisionState,
    "blocked",
  );

  const channelDecision = findByScenario(
    scenarioDecisions,
    "channel_scope_blocked",
    "scenarioDecisions",
  );
  assert.equal(
    findByScenario(tenantEligibilities, "channel_scope_blocked", "tenantEligibilities")
      .coreWebEligibilityState,
    "exact",
  );
  assert.equal(
    findByScenario(channelEligibilities, "channel_scope_blocked", "channelEligibilities")
      .channelEligibilityState,
    "blocked",
  );
  assert.equal(channelDecision.decisionState, "blocked");

  const expandedSelector = findByScenario(selectors, "selector_expanded", "selectors");
  assert.equal(expandedSelector.selectorState, "expanded");
  assert.notEqual(expandedSelector.baselineSelectorHash, expandedSelector.proposedSelectorHash);
  assert.equal(
    findByScenario(scenarioDecisions, "selector_expanded", "scenarioDecisions").decisionState,
    "blocked",
  );
  assert.equal(
    findByScenario(blastRadiusProofs, "selector_expanded", "blastRadiusProofs").blastRadiusState,
    "blocked",
  );

  const pausedSettlement = findByScenario(
    scenarioSettlements,
    "guardrail_breach_after_settlement",
    "settlements",
  );
  assert.equal(pausedSettlement.result, "blocked_guardrail");
  assert.equal(pausedSettlement.observedWaveState, "paused");
  assert(
    pauseRecords.some(
      (record) =>
        record.scenarioId === "guardrail_breach_after_settlement" && record.state === "recommended",
    ),
    "guardrail breach must create a recommended pause record",
  );

  const rollback = findByScenario(rollbackRecords, "rollback_channel_gap", "rollbackRecords");
  assert.equal(rollback.state, "blocked");
  assert.equal(rollback.routeRollbackReadinessState, "ready");
  assert.equal(rollback.channelRollbackReadinessState, "blocked");
  assert.equal(
    findByScenario(scenarioSettlements, "rollback_channel_gap", "settlements").observationState,
    "rollback_required",
  );

  assert.equal(
    findByScenario(selectors, "conflicting_scope", "selectors").selectorState,
    "conflict",
  );
  assert.equal(
    findByScenario(scenarioDecisions, "conflicting_scope", "scenarioDecisions").decisionState,
    "blocked",
  );

  assert.equal(
    findByScenario(remainingPolicies, "policy_changed_after_approval", "policies").policyState,
    "superseded",
  );
  assert.equal(
    findByScenario(scenarioSettlements, "policy_changed_after_approval", "settlements").result,
    "stale_wave",
  );

  const edgeFixtures = (plan.edgeCaseFixtures as JsonObject) ?? {};
  const edgeCaseIds = new Set(
    asArray(edgeFixtures.fixtures, "edgeCaseFixtures.fixtures").map((fixture) =>
      String(fixture.edgeCaseId),
    ),
  );
  required484EdgeCases.forEach((edgeCase) => {
    assert(edgeCaseIds.has(edgeCase), `${edgeCase} must be covered`);
  });

  const recordTypes = collectRecordTypes({ plan, actions, settlements, policies, evidence, gap });
  requiredRecordTypes.forEach((recordType) => {
    assert(recordTypes.has(recordType), `${recordType} must be represented`);
  });

  const artifacts = asArray(evidence.artifactRefs, "evidence.artifactRefs");
  for (const requiredArtifactMarker of [
    "ready",
    "active",
    "paused",
    "rollback",
    "completed",
    "blocked",
  ]) {
    assert(
      artifacts.some((artifact) => String(artifact).includes(requiredArtifactMarker)),
      `Playwright artifacts must include ${requiredArtifactMarker}`,
    );
  }
  artifacts.forEach((artifact) => {
    const artifactRef = String(artifact);
    assert(
      artifactRef.startsWith("output/playwright/484-canary-rollout/"),
      `${artifactRef} must stay under 484 output root`,
    );
    assert(!artifactRef.includes("failure.trace"), `${artifactRef} must not be a failure trace`);
    assert(fs.existsSync(path.join(ROOT, artifactRef)), `${artifactRef} must exist`);
  });

  console.log("484 Guardrailed canary artifacts validated.");
}

if (process.argv[1]?.endsWith("validate_484_guardrailed_canaries.ts")) {
  validate484GuardrailedCanaryArtifacts();
}
