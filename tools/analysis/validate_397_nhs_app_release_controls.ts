import fs from "node:fs";
import path from "node:path";

import {
  PHASE7_397_REQUIRED_FREEZE_TRIGGERS,
  PHASE7_397_REQUIRED_JOURNEY_REFS,
  assert397MonthlyPackRedactionSafe,
  create397ReleaseControlReadinessReport,
  generate397MonthlyPerformancePack,
  load397JsonFile,
  rehearse397GuardrailFreezeAndKillSwitch,
  validateReleaseControlsFromFiles,
  type ChannelReleaseCohortManifest,
  type ReleaseGuardrailPolicyManifest,
  type RouteFreezeDispositionManifest,
} from "../../services/command-api/src/phase7-nhs-app-release-control-service.ts";

type JsonRecord = Record<string, unknown>;

const ROOT = "/Users/test/Code/V";

const REQUIRED_FILES = [
  "services/command-api/src/phase7-nhs-app-release-control-service.ts",
  "ops/release/397_nhs_app_limited_release_runbook.md",
  "ops/release/397_guardrail_threshold_matrix.csv",
  "ops/release/397_cohort_plan_template.csv",
  "ops/release/397_monthly_performance_pack_guide.md",
  "ops/release/397_change_notice_workflow.md",
  "data/config/397_channel_release_cohort_manifest.example.json",
  "data/config/397_release_guardrail_policy_manifest.example.json",
  "data/config/397_route_freeze_disposition_manifest.example.json",
  "data/contracts/397_nhs_app_release_control_contract.json",
  "data/analysis/397_algorithm_alignment_notes.md",
  "data/analysis/397_external_reference_notes.md",
  "data/analysis/397_release_control_rehearsal_matrix.csv",
  "data/analysis/397_monthly_pack_field_map.csv",
  "tools/browser-automation/397_configure_limited_release_controls.spec.ts",
  "tools/browser-automation/397_rehearse_guardrail_freeze_and_kill_switch.spec.ts",
  "tools/browser-automation/397_generate_monthly_pack_and_change_notice.spec.ts",
  "tools/analysis/validate_397_nhs_app_release_controls.ts",
  "tests/unit/397_nhs_app_release_controls.spec.ts",
  "tests/integration/397_nhs_app_release_controls.spec.ts",
  "tests/property/397_release_control_properties.spec.ts",
] as const;

for (const relativePath of REQUIRED_FILES) {
  invariant(fs.existsSync(path.join(ROOT, relativePath)), `MISSING_REQUIRED_FILE:${relativePath}`);
}

const packageJson = readJson<{ scripts?: Record<string, string> }>("package.json");
invariant(
  packageJson.scripts?.["validate:397-nhs-app-release-controls"] ===
    "pnpm exec tsx ./tools/analysis/validate_397_nhs_app_release_controls.ts",
  "package.json missing validate:397-nhs-app-release-controls script.",
);

const checklist = readText("prompt/checklist.md");
invariant(/^- \[X\] par_396_/m.test(checklist), "par_396 must be complete before par_397.");
invariant(
  /^- \[(?:-|X)\] par_397_/m.test(checklist),
  "par_397 must be claimed or complete while validator runs.",
);

const serviceSource = readText(
  "services/command-api/src/phase7-nhs-app-release-control-service.ts",
);
for (const needle of [
  "ChannelReleaseCohortManifest",
  "ReleaseGuardrailPolicyManifest",
  "RouteFreezeDispositionManifest",
  "validateChannelReleaseCohortManifest",
  "evaluate397ReleaseGuardrails",
  "release397FreezeWithFreshGreenWindow",
  "rehearse397GuardrailFreezeAndKillSwitch",
  "generate397MonthlyPerformancePack",
  "submit397JourneyChangeNotice",
  "assert397MonthlyPackRedactionSafe",
]) {
  requireIncludes(serviceSource, needle, "397 release-control service");
}

const externalNotes = readText("data/analysis/397_external_reference_notes.md");
for (const url of [
  "https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration",
  "https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/standards-for-nhs-app-integration",
  "https://service-manual.nhs.uk/accessibility",
  "https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-guidance/",
  "https://playwright.dev/docs/browser-contexts",
  "https://playwright.dev/docs/trace-viewer",
]) {
  requireIncludes(externalNotes, url, "397 external reference notes");
}

const cohortManifest = load397JsonFile<ChannelReleaseCohortManifest>(
  "data/config/397_channel_release_cohort_manifest.example.json",
  ROOT,
);
const guardrailManifest = load397JsonFile<ReleaseGuardrailPolicyManifest>(
  "data/config/397_release_guardrail_policy_manifest.example.json",
  ROOT,
);
const dispositionManifest = load397JsonFile<RouteFreezeDispositionManifest>(
  "data/config/397_route_freeze_disposition_manifest.example.json",
  ROOT,
);

const report = validateReleaseControlsFromFiles({
  root: ROOT,
  cohortManifestPath: "data/config/397_channel_release_cohort_manifest.example.json",
  guardrailManifestPath: "data/config/397_release_guardrail_policy_manifest.example.json",
  dispositionManifestPath: "data/config/397_route_freeze_disposition_manifest.example.json",
});
invariant(report.readinessState === "ready", "397 release-control readiness must be ready.");
invariant(
  report.machineReadableSummary.cohortsCoverRequiredJourneys,
  "Cohort manifests must cover all required journeys.",
);
invariant(
  report.machineReadableSummary.allFreezeTriggersConfigured,
  "Guardrail policy must cover all required freeze triggers.",
);
invariant(
  report.machineReadableSummary.routeFreezeDispositionModesComplete,
  "Route freeze dispositions must include patient-safe modes.",
);
invariant(
  report.machineReadableSummary.monthlyPackSafeForExport,
  "Monthly performance pack must be redaction-safe.",
);

const directReport = create397ReleaseControlReadinessReport({
  cohortManifest,
  guardrailManifest,
  dispositionManifest,
});
invariant(directReport.readinessState === "ready", "Direct 397 readiness report must be ready.");

const cohortJourneySet = new Set(
  cohortManifest.cohorts.flatMap((cohort) => [...cohort.enabledJourneys]),
);
for (const journeyRef of PHASE7_397_REQUIRED_JOURNEY_REFS) {
  invariant(cohortJourneySet.has(journeyRef), `Missing required journey ${journeyRef}.`);
  invariant(
    dispositionManifest.dispositions.some((entry) => entry.journeyPathRef === journeyRef),
    `Missing disposition for ${journeyRef}.`,
  );
}
const triggerSet = new Set(
  guardrailManifest.policies.flatMap((policy) => [...policy.requiredFreezeTriggers]),
);
for (const trigger of PHASE7_397_REQUIRED_FREEZE_TRIGGERS) {
  invariant(triggerSet.has(trigger), `Missing required freeze trigger ${trigger}.`);
}

const rehearsal = rehearse397GuardrailFreezeAndKillSwitch({
  cohortManifest,
  guardrailManifest,
  dispositionManifest,
});
invariant(rehearsal.freezeDecision.decision === "freeze", "Freeze rehearsal must freeze.");
invariant(
  rehearsal.killSwitchDecision.decision === "kill_switch_activation",
  "Kill switch rehearsal must activate.",
);
invariant(
  rehearsal.disabledJumpOffWithoutRedeploy,
  "Kill switch rehearsal must disable jump-off without redeploy.",
);

const pack = generate397MonthlyPerformancePack({
  cohortManifest,
  guardrailManifest,
  dispositionManifest,
  environment: "limited_release",
  period: "2026-05",
});
const redaction = assert397MonthlyPackRedactionSafe(pack);
invariant(redaction.safeForExport, "397 monthly pack leaked sensitive fields.");
for (const usage of pack.journeyUsage) {
  invariant(usage.routeEntryCount >= usage.successfulCompletionCount, "Pack counts are invalid.");
}

const guardrailRows = readCsv("ops/release/397_guardrail_threshold_matrix.csv");
for (const trigger of PHASE7_397_REQUIRED_FREEZE_TRIGGERS) {
  invariant(
    guardrailRows.some((row) => row.freeze_trigger === trigger),
    `Guardrail threshold matrix missing ${trigger}.`,
  );
}
const monthlyRows = readCsv("data/analysis/397_monthly_pack_field_map.csv");
for (const field of ["journeyUsage.routeEntryCount", "completionRates.rate", "dropOffs.rate"]) {
  invariant(
    monthlyRows.some((row) => row.monthly_pack_field === field),
    `Monthly pack field map missing ${field}.`,
  );
}

const contract = readJson<{ objects?: JsonRecord; routes?: unknown[] }>(
  "data/contracts/397_nhs_app_release_control_contract.json",
);
for (const objectName of [
  "ChannelReleaseCohort",
  "ReleaseGuardrailPolicy",
  "ChannelReleaseFreezeRecord",
  "RouteFreezeDisposition",
  "NHSAppPerformancePack",
  "JourneyChangeNotice",
]) {
  invariant(contract.objects?.[objectName], `Contract missing ${objectName}.`);
}
invariant((contract.routes?.length ?? 0) >= 6, "Contract must expose release-control routes.");

for (const browserSpec of [
  "tools/browser-automation/397_configure_limited_release_controls.spec.ts",
  "tools/browser-automation/397_rehearse_guardrail_freeze_and_kill_switch.spec.ts",
  "tools/browser-automation/397_generate_monthly_pack_and_change_notice.spec.ts",
]) {
  const source = readText(browserSpec);
  requireIncludes(source, "chromium.launch", browserSpec);
  requireIncludes(source, "browser.newContext", browserSpec);
  requireIncludes(source, "context.tracing.start", browserSpec);
  requireIncludes(source, "--run", browserSpec);
}

const serviceDefinition = readText("services/command-api/src/service-definition.ts");
requireIncludes(serviceDefinition, "phase7NhsAppReleaseControlRoutes", "service definition");

console.log("validate_397_nhs_app_release_controls: ok");

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function readJson<T extends JsonRecord>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

function requireIncludes(haystack: string, needle: string, label: string): void {
  invariant(haystack.includes(needle), `${label} missing ${needle}.`);
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current);
  return cells;
}

function readCsv(relativePath: string): JsonRecord[] {
  const lines = readText(relativePath).trim().split(/\r?\n/u).filter(Boolean);
  const headers = parseCsvLine(lines[0] ?? "");
  invariant(headers.length > 1, `${relativePath} must have a header.`);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    invariant(values.length === headers.length, `${relativePath} malformed row: ${line}`);
    return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
  });
}
