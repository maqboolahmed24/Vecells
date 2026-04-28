import fs from "node:fs";
import path from "node:path";

import { serviceDefinition } from "../../services/command-api/src/service-definition.ts";
import {
  createDefaultPhase7LiveControlApplication,
  phase7LiveControlRoutes,
  type FreezeMode,
  type FreezeTriggerType,
  type LiveControlFailureReason,
} from "../../services/command-api/src/phase7-live-control-service.ts";
import {
  PHASE7_MANIFEST_VERSION,
  PHASE7_RELEASE_APPROVAL_FREEZE_REF,
} from "../../services/command-api/src/phase7-nhs-app-manifest-service.ts";

type JsonRecord = Record<string, unknown>;

const ROOT = "/Users/test/Code/V";

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
  const lines = readText(relativePath).trim().split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines[0] ?? "");
  invariant(headers.length > 1, `${relativePath} must have a header.`);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    invariant(values.length === headers.length, `${relativePath} malformed row: ${line}`);
    return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
  });
}

function requireIncludes(haystack: string, needle: string, label: string): void {
  invariant(haystack.toLowerCase().includes(needle.toLowerCase()), `${label} missing ${needle}.`);
}

const REQUIRED_FILES = [
  "services/command-api/src/phase7-live-control-service.ts",
  "docs/architecture/385_phase7_live_rollout_and_governance_control_plane.md",
  "docs/ops/385_phase7_limited_release_and_kill_switch_runbook.md",
  "docs/data/385_phase7_monthly_pack_and_change_notice.md",
  "data/analysis/385_external_reference_notes.md",
  "data/analysis/385_algorithm_alignment_notes.md",
  "data/test/385_release_guardrail_matrix.csv",
  "data/test/385_route_freeze_disposition_matrix.csv",
  "data/test/385_monthly_pack_schema.csv",
  "tools/analysis/validate_385_phase7_live_control.ts",
  "tests/unit/385_release_guardrail_and_route_freeze.spec.ts",
  "tests/integration/385_limited_release_freeze_and_monthly_pack.spec.ts",
] as const;

for (const relativePath of REQUIRED_FILES) {
  invariant(fs.existsSync(path.join(ROOT, relativePath)), `MISSING_REQUIRED_FILE:${relativePath}`);
}

const packageJson = readJson<{ scripts?: Record<string, string> }>("package.json");
invariant(
  packageJson.scripts?.["validate:385-phase7-live-control"] ===
    "pnpm exec tsx ./tools/analysis/validate_385_phase7_live_control.ts",
  "package.json missing validate:385-phase7-live-control script.",
);

const checklist = readText("prompt/checklist.md");
invariant(/^- \[X\] par_384_/m.test(checklist), "par_384 must be complete before par_385.");
invariant(
  /^- \[(?:-|X)\] par_385_/m.test(checklist),
  "par_385 must be claimed or complete while validator runs.",
);

const serviceSource = readText("services/command-api/src/phase7-live-control-service.ts");
for (const needle of [
  "ChannelReleaseCohort",
  "ReleaseGuardrailPolicy",
  "ChannelReleaseFreezeRecord",
  "RouteFreezeDisposition",
  "NHSAppPerformancePack",
  "JourneyChangeNotice",
  "evaluateCohort",
  "activateKillSwitch",
  "generatePerformancePack",
  "telemetry_missing",
  "threshold_breach",
  "compatibility_drift",
  "continuity_evidence_degraded",
]) {
  requireIncludes(serviceSource, needle, "live control service");
}

for (const route of phase7LiveControlRoutes) {
  invariant(
    serviceDefinition.routeCatalog.some((catalogRoute) => catalogRoute.routeId === route.routeId),
    `serviceDefinition route catalog missing ${route.routeId}.`,
  );
}

for (const [relativePath, requiredTerms] of Object.entries({
  "docs/architecture/385_phase7_live_rollout_and_governance_control_plane.md": [
    "ChannelReleaseCohort",
    "ReleaseGuardrailPolicy",
    "ChannelReleaseFreezeRecord",
    "RouteFreezeDisposition",
    "NHSAppPerformancePack",
    "JourneyChangeNotice",
  ],
  "docs/ops/385_phase7_limited_release_and_kill_switch_runbook.md": [
    "limited release",
    "Kill Switch",
    "telemetry_missing",
    "RouteFreezeDisposition",
  ],
  "docs/data/385_phase7_monthly_pack_and_change_notice.md": [
    "NHSAppPerformancePack",
    "JourneyChangeNotice",
    "P1M",
    "P3M",
  ],
  "data/analysis/385_external_reference_notes.md": [
    "digital.nhs.uk",
    "nhsconnect.github.io",
    "monthly data",
    "annual assurance",
    "three months",
  ],
  "data/analysis/385_algorithm_alignment_notes.md": [
    "383",
    "384",
    "RouteFreezeDisposition",
    "ReleaseGuardrailPolicy",
  ],
})) {
  const text = readText(relativePath);
  for (const term of requiredTerms) {
    requireIncludes(text, term, relativePath);
  }
}

const guardrailRows = readCsv("data/test/385_release_guardrail_matrix.csv");
for (const failureReason of [
  "telemetry_missing",
  "threshold_breach",
  "compatibility_drift",
  "continuity_evidence_degraded",
  "assurance_slice_degraded",
  "sample_size_below_minimum",
  "readiness_not_ready",
] satisfies LiveControlFailureReason[]) {
  invariant(
    guardrailRows.some((row) => String(row.expected_failure_reasons).includes(failureReason)),
    `Release guardrail matrix missing ${failureReason}.`,
  );
}

for (const triggerType of [
  "telemetry_missing",
  "threshold_breach",
  "assurance_slice_degraded",
  "compatibility_drift",
  "continuity_evidence_degraded",
] satisfies FreezeTriggerType[]) {
  invariant(
    guardrailRows.some((row) => row.expected_trigger_type === triggerType),
    `Release guardrail matrix missing trigger ${triggerType}.`,
  );
}

const dispositionRows = readCsv("data/test/385_route_freeze_disposition_matrix.csv");
for (const freezeMode of [
  "hidden",
  "read_only",
  "placeholder_only",
  "redirect_to_safe_route",
] satisfies FreezeMode[]) {
  invariant(
    dispositionRows.some((row) => row.freeze_mode === freezeMode),
    `Route freeze disposition matrix missing ${freezeMode}.`,
  );
}

const monthlyRows = readCsv("data/test/385_monthly_pack_schema.csv");
for (const field of [
  "pack_id",
  "telemetry_plan_ref",
  "event_contract_refs",
  "journey_path_id",
  "completion_rate",
  "guardrail_breach_count",
  "pack_hash",
]) {
  invariant(
    monthlyRows.some((row) => row.field_name === field),
    `Monthly schema missing ${field}.`,
  );
}

const application = createDefaultPhase7LiveControlApplication();
const inventory = application.listEvidence();
invariant(inventory.cohorts.length >= 4, "Cohort seed incomplete.");
invariant(inventory.guardrailPolicies.length >= 2, "Guardrail policy seed incomplete.");

const enabled = application.evaluateCohort({
  cohortId: "ChannelReleaseCohort:385:limited-release-pharmacy",
});
invariant(enabled.decision === "enable", "Limited release should enable under green window.");
invariant(enabled.failureReasons.length === 0, "Green enable should have no failures.");
invariant(enabled.environmentProfile.parityState === "matching", "Environment profile drifted.");
invariant(
  enabled.promotionReadiness.promotionState === "promotable",
  "Promotion readiness should be promotable.",
);

const frozen = application.evaluateCohort({
  cohortId: "ChannelReleaseCohort:385:limited-release-pharmacy",
  observationWindow: { telemetryPresent: false },
});
invariant(frozen.decision === "freeze", "Missing telemetry should freeze.");
invariant(
  frozen.freezeRecord?.triggerType === "telemetry_missing",
  "Missing telemetry trigger not recorded.",
);
invariant(
  frozen.routeDispositions.some((disposition) => disposition.freezeMode === "read_only"),
  "Read-only route disposition missing.",
);

const released = application.releaseFreeze({
  freezeRecordId: frozen.freezeRecord?.freezeRecordId ?? "missing",
  expectedManifestVersion: PHASE7_MANIFEST_VERSION,
  expectedReleaseApprovalFreezeRef: PHASE7_RELEASE_APPROVAL_FREEZE_REF,
});
invariant(released.freezeState === "released", "Freeze release failed.");

const killSwitch = application.activateKillSwitch({
  cohortId: "ChannelReleaseCohort:385:limited-release-pharmacy",
});
invariant(killSwitch.decision === "kill_switch_activation", "Kill switch activation failed.");
invariant(
  killSwitch.freezeRecord?.releaseApprovalFreezeRef === PHASE7_RELEASE_APPROVAL_FREEZE_REF,
  "Kill switch release tuple drifted.",
);

const pack = application.generatePerformancePack({
  environment: "limited_release",
  period: "2026-05",
  cohortId: "ChannelReleaseCohort:385:limited-release-pharmacy",
});
invariant(pack.telemetryPlanRef === "ChannelTelemetryPlan:384:limited_release", "Pack plan drift.");
invariant(pack.eventContractRefs.length >= 7, "Pack missing event contract refs.");
invariant(pack.journeyUsage[0]?.journeyPathRef === "jp_pharmacy_status", "Pack journey missing.");
invariant(pack.packHash.startsWith("sha256:"), "Pack hash missing.");

const blockedNotice = application.submitJourneyChangeNotice({
  changeType: "significant",
  affectedJourneys: ["jp_pharmacy_status"],
  submittedAt: "2026-04-27T00:00:00.000Z",
  plannedChangeAt: "2026-06-01T00:00:00.000Z",
});
invariant(blockedNotice.approvalState === "blocked_lead_time", "Lead-time guard failed.");
invariant(blockedNotice.leadTimeRequired === "P3M", "Significant change lead time drifted.");

console.log("validate_385_phase7_live_control: ok");
