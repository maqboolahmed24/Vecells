import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  canonicalize,
  required485EdgeCases,
  SCHEMA_VERSION,
  TASK_ID,
} from "./enable_485_visible_modes";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../..");

type JsonObject = Record<string, unknown>;

const requiredFiles = [
  "tools/assistive/enable_485_visible_modes.ts",
  "tools/assistive/validate_485_visible_modes.ts",
  "data/assistive/485_visible_mode_enablement_plan.json",
  "data/assistive/485_approved_cohort_scope.json",
  "data/assistive/485_trust_envelope_resolution.json",
  "data/assistive/485_assistive_enablement_commands.json",
  "data/assistive/485_assistive_enablement_settlements.json",
  "data/contracts/485_assistive_visible_enablement.schema.json",
  "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_485_ASSISTIVE_VISIBLE_AUTHORITY.json",
  "data/analysis/485_algorithm_alignment_notes.md",
  "data/analysis/485_external_reference_notes.json",
  "docs/runbooks/485_assistive_visible_mode_enablement_runbook.md",
  "docs/training/485_assistive_visible_mode_staff_briefing.md",
  "docs/test-evidence/485_assistive_visible_mode_enablement_report.md",
  "tests/assistive/485_trust_envelope_gate.test.ts",
  "tests/assistive/485_cohort_scope_gate.test.ts",
  "tests/playwright/485_assistive_visible_modes.spec.ts",
  "apps/clinical-workspace/src/assistive-visible-mode-485.model.ts",
  "apps/clinical-workspace/src/assistive-visible-mode-485.tsx",
  "apps/clinical-workspace/src/assistive-visible-mode-485.css",
  "apps/ops-console/src/assistive-visible-ops-485.model.ts",
  "apps/ops-console/src/assistive-visible-ops-485.tsx",
  "apps/ops-console/src/assistive-visible-ops-485.css",
] as const;

const requiredRecordTypes = [
  "AssistiveVisibleModeEnablementPlan",
  "AssistiveApprovedCohortScope",
  "AssistiveModeEligibilityVerdict",
  "AssistiveVisibleEnablementCommand",
  "AssistiveVisibleEnablementSettlement",
  "AssistiveVisibleRollbackBinding",
  "AssistiveHumanResponsibilityAcknowledgement",
  "AssistiveTrainingPrerequisiteEvidence",
  "AssistiveModeExposureProof",
  "AssistiveCapabilityTrustProjection",
  "AssistiveCapabilityRolloutVerdict",
  "AssistiveCapabilityTrustEnvelope",
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

export function validate485AssistiveVisibleModes(): void {
  requiredFiles.forEach(assertFileExists);

  const plan = readJson<JsonObject>("data/assistive/485_visible_mode_enablement_plan.json");
  const scopes = readJson<JsonObject>("data/assistive/485_approved_cohort_scope.json");
  const trust = readJson<JsonObject>("data/assistive/485_trust_envelope_resolution.json");
  const commands = readJson<JsonObject>("data/assistive/485_assistive_enablement_commands.json");
  const settlements = readJson<JsonObject>(
    "data/assistive/485_assistive_enablement_settlements.json",
  );
  const gap = readJson<JsonObject>(
    "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_485_ASSISTIVE_VISIBLE_AUTHORITY.json",
  );
  const externalRefs = readJson<JsonObject>("data/analysis/485_external_reference_notes.json");

  for (const [label, value] of Object.entries({
    plan,
    scopes,
    trust,
    commands,
    settlements,
    gap,
    externalRefs,
  })) {
    assertNoSensitiveSerialized(value, label);
    assertHashRecord(value, label);
  }

  for (const relativePath of [
    "docs/runbooks/485_assistive_visible_mode_enablement_runbook.md",
    "docs/training/485_assistive_visible_mode_staff_briefing.md",
    "docs/test-evidence/485_assistive_visible_mode_enablement_report.md",
    "data/analysis/485_algorithm_alignment_notes.md",
  ]) {
    assertNoSensitiveSerialized(
      fs.readFileSync(path.join(ROOT, relativePath), "utf8"),
      relativePath,
    );
  }

  assert.equal(plan.taskId, TASK_ID);
  assert.equal(plan.schemaVersion, SCHEMA_VERSION);

  const activeVerdict = plan.activeEligibilityVerdict as JsonObject;
  assert.equal(activeVerdict.scenarioId, "visible_insert_approved");
  assert.equal(activeVerdict.eligibleMode, "visible_insert");
  assert.equal(activeVerdict.visibleSummaryAllowed, true);
  assert.equal(activeVerdict.visibleInsertAllowed, true);
  assert.equal(activeVerdict.insertControlsVisible, true);
  assert.equal(activeVerdict.concreteCommitAllowed, false);
  assert.deepEqual(activeVerdict.blockerRefs, []);

  const eligibilityVerdicts = asArray(plan.eligibilityVerdicts, "eligibilityVerdicts");
  const cohortScopes = asArray(scopes.scopes, "scopes");
  const exposureProofs = asArray(scopes.exposureProofs, "exposureProofs");
  const trainingEvidence = asArray(scopes.trainingEvidence, "trainingEvidence");
  const trustProjections = asArray(trust.trustProjections, "trustProjections");
  const rolloutVerdicts = asArray(trust.rolloutVerdicts, "rolloutVerdicts");
  const trustEnvelopes = asArray(trust.trustEnvelopes, "trustEnvelopes");
  const humanAcknowledgements = asArray(commands.humanAcknowledgements, "humanAcknowledgements");
  const scenarioSettlements = asArray(settlements.settlements, "settlements");

  const shadowOnly = findByScenario(
    eligibilityVerdicts,
    "route_verdict_shadow_only",
    "eligibility",
  );
  assert.equal(shadowOnly.eligibleMode, "shadow");
  assert.equal(shadowOnly.visibleSummaryAllowed, false);
  assert.equal(
    findByScenario(rolloutVerdicts, "route_verdict_shadow_only", "rolloutVerdicts").rolloutRung,
    "shadow_only",
  );
  assert.equal(
    findByScenario(trustProjections, "route_verdict_shadow_only", "trustProjections").trustState,
    "trusted",
  );

  const staleRoute = findByScenario(rolloutVerdicts, "route_contract_stale", "rolloutVerdicts");
  assert.equal(staleRoute.routeContractState, "stale");
  assert.equal(
    findByScenario(trainingEvidence, "route_contract_stale", "trainingEvidence").trainingState,
    "exact",
  );
  assertIncludes(
    findByScenario(eligibilityVerdicts, "route_contract_stale", "eligibility").blockerRefs,
    "blocker:485:surface-route-contract-stale",
    "route contract stale blockers",
  );

  const insertMissing = findByScenario(
    eligibilityVerdicts,
    "insert_evidence_missing",
    "eligibility",
  );
  assert.equal(insertMissing.eligibleMode, "visible_summary");
  assert.equal(insertMissing.visibleSummaryAllowed, true);
  assert.equal(insertMissing.visibleInsertAllowed, false);
  assert.equal(
    findByScenario(rolloutVerdicts, "insert_evidence_missing", "rolloutVerdicts")
      .insertEvidenceState,
    "missing",
  );

  const downgraded = findByScenario(
    trustEnvelopes,
    "envelope_downgrade_mid_session",
    "trustEnvelopes",
  );
  assert.equal(downgraded.surfacePostureState, "observe_only");
  assert.equal(downgraded.actionabilityState, "regenerate_only");
  assert.equal(
    findByScenario(eligibilityVerdicts, "envelope_downgrade_mid_session", "eligibility")
      .insertControlsVisible,
    false,
  );

  const historicalKillSwitch = findByScenario(
    eligibilityVerdicts,
    "historical_kill_switch_clear",
    "eligibility",
  );
  assert.equal(historicalKillSwitch.eligibleMode, "visible_insert");
  assert.equal(historicalKillSwitch.visibleInsertAllowed, true);
  assert.deepEqual(historicalKillSwitch.blockerRefs, []);

  const splitVisible = findByScenario(
    exposureProofs,
    "split_route_visible_insert",
    "exposureProofs",
  );
  const splitShadow = findByScenario(eligibilityVerdicts, "split_route_shadow_only", "eligibility");
  assert.equal(splitShadow.eligibleMode, "shadow");
  assert.equal(splitVisible.broadFlagLeakageState, "none");
  assert(
    asArray(splitVisible.routeModeMap, "splitVisible.routeModeMap").some(
      (entry) => entry.routeFamilyRef === "self_care_boundary" && entry.mode === "shadow",
    ),
    "same watch tuple must keep self-care boundary route shadow-only",
  );

  const commit = findByScenario(
    eligibilityVerdicts,
    "commit_missing_human_approval",
    "eligibility",
  );
  assert.equal(commit.visibleCommitCeilingAllowed, true);
  assert.equal(commit.concreteCommitAllowed, false);
  assert.equal(
    findByScenario(humanAcknowledgements, "commit_missing_human_approval", "humanAcknowledgements")
      .approvalGateState,
    "missing",
  );
  assert.equal(
    findByScenario(scenarioSettlements, "commit_missing_human_approval", "settlements").result,
    "blocked_approval",
  );

  const hidden = findByScenario(cohortScopes, "hidden_out_of_slice", "cohortScopes");
  assert.equal(hidden.sliceMembershipState, "out_of_slice");
  assert.equal(
    findByScenario(eligibilityVerdicts, "hidden_out_of_slice", "eligibility").eligibleMode,
    "hidden",
  );

  const edgeFixtures = (plan.edgeCaseFixtures as JsonObject) ?? {};
  const edgeCaseIds = new Set(
    asArray(edgeFixtures.fixtures, "edgeCaseFixtures.fixtures").map((fixture) =>
      String(fixture.edgeCaseId),
    ),
  );
  required485EdgeCases.forEach((edgeCase) => {
    assert(edgeCaseIds.has(edgeCase), `${edgeCase} must be covered`);
  });

  const recordTypes = collectRecordTypes({ plan, scopes, trust, commands, settlements, gap });
  requiredRecordTypes.forEach((recordType) => {
    assert(recordTypes.has(recordType), `${recordType} must be represented`);
  });

  const artifacts = asArray((plan.plan as JsonObject).artifactRefs, "plan.artifactRefs");
  for (const requiredArtifactMarker of [
    "shadow",
    "visible-summary",
    "visible-insert",
    "observe-only",
    "frozen",
    "hidden",
  ]) {
    assert(
      artifacts.some((artifact) => String(artifact).includes(requiredArtifactMarker)),
      `Playwright artifacts must include ${requiredArtifactMarker}`,
    );
  }
  artifacts.forEach((artifact) => {
    const artifactRef = String(artifact);
    assert(
      artifactRef.startsWith("output/playwright/485-assistive-visible-modes/"),
      `${artifactRef} must stay under 485 output root`,
    );
    assert(!artifactRef.includes("failure.trace"), `${artifactRef} must not be a failure trace`);
    assert(fs.existsSync(path.join(ROOT, artifactRef)), `${artifactRef} must exist`);
  });

  console.log("485 Assistive visible mode artifacts validated.");
}

if (process.argv[1]?.endsWith("validate_485_visible_modes.ts")) {
  validate485AssistiveVisibleModes();
}
