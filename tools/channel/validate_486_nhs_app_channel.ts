import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  canonicalize,
  required486EdgeCases,
  SCHEMA_VERSION,
  TASK_ID,
} from "./enable_486_nhs_app_channel";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../..");

type JsonObject = Record<string, unknown>;

const requiredFiles = [
  "tools/channel/enable_486_nhs_app_channel.ts",
  "tools/channel/validate_486_nhs_app_channel.ts",
  "data/channel/486_nhs_app_manifest_activation_plan.json",
  "data/channel/486_nhs_app_channel_enablement_command.json",
  "data/channel/486_nhs_app_channel_enablement_settlement.json",
  "data/channel/486_embedded_route_coverage_after_activation.json",
  "data/channel/486_monthly_data_and_assurance_obligation_binding.json",
  "data/contracts/486_nhs_app_channel_enablement.schema.json",
  "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_486_NHS_APP_CHANNEL_AUTHORITY.json",
  "data/analysis/486_algorithm_alignment_notes.md",
  "data/analysis/486_external_reference_notes.json",
  "docs/runbooks/486_nhs_app_channel_activation_runbook.md",
  "docs/programme/486_nhs_app_limited_release_decision.md",
  "docs/test-evidence/486_nhs_app_channel_enablement_report.md",
  "tests/channel/486_manifest_activation_gate.test.ts",
  "tests/channel/486_embedded_coverage_gate.test.ts",
  "tests/playwright/486_nhs_app_embedded_channel.helpers.ts",
  "tests/playwright/486_nhs_app_embedded_channel.spec.ts",
  "apps/patient-web/src/nhs-app-embedded-channel-486.model.ts",
  "apps/patient-web/src/nhs-app-embedded-channel-486.tsx",
  "apps/patient-web/src/nhs-app-embedded-channel-486.css",
  "apps/ops-console/src/nhs-app-channel-activation-486.model.ts",
  "apps/ops-console/src/nhs-app-channel-activation-486.tsx",
  "apps/ops-console/src/nhs-app-channel-activation-486.css",
] as const;

const requiredRecordTypes = [
  "NHSAppManifestActivationPlan",
  "NHSAppChannelEnablementCommand",
  "NHSAppChannelEnablementSettlement",
  "EmbeddedRouteActivationVerdict",
  "NHSAppLimitedReleaseScope",
  "NHSAppMonthlyDataObligationBinding",
  "JourneyChangeControlBinding",
  "NHSAppUnsupportedBridgeFallback",
  "EmbeddedSurfacePostureProof",
  "ChannelFreezeDispositionBinding",
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
  const found = entries.find(
    (entry) => entry.scenarioId === scenarioId || entry.activeScenarioId === scenarioId,
  );
  assert(found, `${label} must include ${scenarioId}`);
  return found;
}

function findRoute(entries: JsonObject[], scenarioId: string, routeFamilyRef: string): JsonObject {
  const found = entries.find(
    (entry) => entry.scenarioId === scenarioId && entry.routeFamilyRef === routeFamilyRef,
  );
  assert(found, `route verdict must include ${scenarioId}/${routeFamilyRef}`);
  return found;
}

function assertIncludes(value: unknown, expected: string, label: string): void {
  assert(Array.isArray(value) && value.includes(expected), `${label} must include ${expected}`);
}

export function validate486NHSAppChannel(): void {
  requiredFiles.forEach(assertFileExists);

  const plan = readJson<JsonObject>("data/channel/486_nhs_app_manifest_activation_plan.json");
  const commands = readJson<JsonObject>("data/channel/486_nhs_app_channel_enablement_command.json");
  const settlements = readJson<JsonObject>(
    "data/channel/486_nhs_app_channel_enablement_settlement.json",
  );
  const coverage = readJson<JsonObject>(
    "data/channel/486_embedded_route_coverage_after_activation.json",
  );
  const obligations = readJson<JsonObject>(
    "data/channel/486_monthly_data_and_assurance_obligation_binding.json",
  );
  const gap = readJson<JsonObject>(
    "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_486_NHS_APP_CHANNEL_AUTHORITY.json",
  );
  const externalRefs = readJson<JsonObject>("data/analysis/486_external_reference_notes.json");

  for (const [label, value] of Object.entries({
    plan,
    commands,
    settlements,
    coverage,
    obligations,
    gap,
    externalRefs,
  })) {
    assertNoSensitiveSerialized(value, label);
    assertHashRecord(value, label);
  }

  for (const relativePath of [
    "docs/runbooks/486_nhs_app_channel_activation_runbook.md",
    "docs/programme/486_nhs_app_limited_release_decision.md",
    "docs/test-evidence/486_nhs_app_channel_enablement_report.md",
    "data/analysis/486_algorithm_alignment_notes.md",
  ]) {
    assertNoSensitiveSerialized(
      fs.readFileSync(path.join(ROOT, relativePath), "utf8"),
      relativePath,
    );
  }

  assert.equal(plan.taskId, TASK_ID);
  assert.equal(plan.schemaVersion, SCHEMA_VERSION);

  const activePlan = plan.plan as JsonObject;
  assert.equal(activePlan.recordType, "NHSAppManifestActivationPlan");
  assert.equal(activePlan.activationDecisionState, "approved");
  assert.equal(activePlan.channelExposureState, "enabled");
  assert.equal(activePlan.failClosedMode, "deferred_hidden");
  assert.deepEqual(activePlan.blockerRefs, []);

  const activeCommand = commands.activeCommand as JsonObject;
  assert.equal(activeCommand.commandType, "enable_channel");
  assert.equal(activeCommand.commandState, "accepted");
  assert.equal(activeCommand.requestedChannelState, "enabled");

  const activeSettlement = settlements.activeSettlement as JsonObject;
  assert.equal(activeSettlement.result, "applied");
  assert.equal(activeSettlement.enabled, true);
  assert.equal(activeSettlement.channelExposureState, "enabled");
  assert.equal(activeSettlement.observedRouteCoverageState, "exact");
  assert.equal(activeSettlement.observedMonthlyDataObligationState, "bound");

  const plans = asArray(plan.plans, "plans");
  const limitedScopes = asArray(plan.limitedReleaseScopes, "limitedReleaseScopes");
  const scenarioSettlements = asArray(settlements.settlements, "settlements");
  const routeVerdicts = asArray(coverage.routeVerdicts, "coverage.routeVerdicts");
  const postureProofs = asArray(
    coverage.embeddedSurfacePostureProofs,
    "coverage.embeddedSurfacePostureProofs",
  );
  const fallbacks = asArray(
    coverage.unsupportedBridgeFallbacks,
    "coverage.unsupportedBridgeFallbacks",
  );
  const monthlyBindings = asArray(
    obligations.monthlyDataBindings,
    "obligations.monthlyDataBindings",
  );
  const journeyBindings = asArray(
    obligations.journeyChangeBindings,
    "obligations.journeyChangeBindings",
  );

  const deferred = findByScenario(plans, "deferred_scope", "plans");
  assert.equal(deferred.activationDecisionState, "deferred");
  assert.equal(deferred.channelExposureState, "deferred_hidden");
  assert.equal(findByScenario(scenarioSettlements, "deferred_scope", "settlements").enabled, false);

  const tupleMismatch = findByScenario(
    scenarioSettlements,
    "blocked_tuple_mismatch",
    "settlements",
  );
  assert.equal(tupleMismatch.result, "blocked_tuple");
  assert.equal(tupleMismatch.channelExposureState, "blocked_hidden");

  const liveMissing = findByScenario(
    limitedScopes,
    "aos_approved_live_profile_missing",
    "limitedScopes",
  );
  assert.equal(liveMissing.environmentProfileState, "live_profile_missing");
  assert.equal(
    findByScenario(scenarioSettlements, "aos_approved_live_profile_missing", "settlements").result,
    "blocked_environment",
  );

  const routeStart = findRoute(
    routeVerdicts,
    "route_coverage_missing_pharmacy_status",
    "start_request",
  );
  const routeStatus = findRoute(
    routeVerdicts,
    "route_coverage_missing_pharmacy_status",
    "request_status",
  );
  const routePharmacy = findRoute(
    routeVerdicts,
    "route_coverage_missing_pharmacy_status",
    "pharmacy",
  );
  assert.equal(routeStart.embeddedSurfaceCoverageState, "exact");
  assert.equal(routeStatus.embeddedSurfaceCoverageState, "missing");
  assert.equal(routePharmacy.embeddedSurfaceCoverageState, "missing");
  assert.equal(
    findByScenario(scenarioSettlements, "route_coverage_missing_pharmacy_status", "settlements")
      .result,
    "blocked_coverage",
  );

  const unsupportedGoverned = findByScenario(fallbacks, "unsupported_bridge", "fallbacks");
  assert.equal(unsupportedGoverned.fallbackState, "governed");
  assert.equal(unsupportedGoverned.deadLinkExposed, false);
  assert.equal(
    findByScenario(scenarioSettlements, "unsupported_bridge", "settlements").result,
    "applied_with_fallback",
  );
  const unsupportedMissing = findByScenario(
    fallbacks,
    "unsupported_download_no_fallback",
    "fallbacks",
  );
  assert.equal(unsupportedMissing.fallbackState, "missing");
  assert.equal(unsupportedMissing.deadLinkExposed, true);
  assert.equal(
    findByScenario(scenarioSettlements, "unsupported_download_no_fallback", "settlements").result,
    "blocked_fallback",
  );

  const chrome = findByScenario(postureProofs, "chrome_hiding_not_enforced", "postureProofs");
  assert.equal(chrome.headerHidden, false);
  assert.equal(chrome.footerHidden, false);
  assert.equal(chrome.supplierChromeState, "not_enforced");
  assert.equal(
    findByScenario(scenarioSettlements, "chrome_hiding_not_enforced", "settlements").result,
    "blocked_chrome",
  );

  const monthlyMissing = findByScenario(
    monthlyBindings,
    "monthly_data_missing_active_release",
    "monthlyBindings",
  );
  assert.equal(monthlyMissing.obligationState, "missing");
  assertIncludes(
    monthlyMissing.blockerRefs,
    "blocker:486:monthly-data-obligation-missing-active-limited-release",
    "monthly missing blockers",
  );

  const journeyChanged = findByScenario(
    journeyBindings,
    "journey_text_changed_without_notice",
    "journeyBindings",
  );
  assert.equal(journeyChanged.journeyTextChangeState, "changed_after_approval");
  assert.equal(journeyChanged.noticeState, "missing");
  assert.equal(
    findByScenario(scenarioSettlements, "journey_text_changed_without_notice", "settlements")
      .result,
    "blocked_change_control",
  );

  const safeReturn = findRoute(routeVerdicts, "safe_return_broken", "secure_link_recovery");
  assert.equal(safeReturn.safeReturnState, "broken");
  assert.equal(
    findByScenario(scenarioSettlements, "safe_return_broken", "settlements").result,
    "blocked_safe_return",
  );

  const edgeFixtures = (plan.edgeCaseFixtures as JsonObject) ?? {};
  const edgeCaseIds = new Set(
    asArray(edgeFixtures.fixtures, "edgeCaseFixtures.fixtures").map((fixture) =>
      String(fixture.edgeCaseId),
    ),
  );
  required486EdgeCases.forEach((edgeCase) => {
    assert(edgeCaseIds.has(edgeCase), `${edgeCase} must be covered`);
  });

  const recordTypes = collectRecordTypes({
    plan,
    commands,
    settlements,
    coverage,
    obligations,
    gap,
  });
  requiredRecordTypes.forEach((recordType) => {
    assert(recordTypes.has(recordType), `${recordType} must be represented`);
  });

  const artifacts = asArray((activePlan as JsonObject).artifactRefs, "plan.artifactRefs");
  for (const requiredArtifactMarker of ["approved", "deferred", "blocked", "unsupported"]) {
    assert(
      artifacts.some((artifact) => String(artifact).includes(requiredArtifactMarker)),
      `Playwright artifacts must include ${requiredArtifactMarker}`,
    );
  }
  artifacts.forEach((artifact) => {
    const artifactRef = String(artifact);
    assert(
      artifactRef.startsWith("output/playwright/486-nhs-app-embedded-channel/"),
      `${artifactRef} must stay under 486 output root`,
    );
    assert(!artifactRef.includes("failure.trace"), `${artifactRef} must not be a failure trace`);
    assert(fs.existsSync(path.join(ROOT, artifactRef)), `${artifactRef} must exist`);
  });

  console.log("486 NHS App channel enablement artifacts validated.");
}

if (process.argv[1]?.endsWith("validate_486_nhs_app_channel.ts")) {
  validate486NHSAppChannel();
}
