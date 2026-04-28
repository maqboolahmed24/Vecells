import fs from "node:fs";
import path from "node:path";
import { writePhase7ChannelReconciliationArtifacts } from "./reconcile_473_phase7_deferred_channel";

const root = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(read(relativePath)) as T;
}

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertFile(relativePath: string): void {
  assertCondition(fs.existsSync(path.join(root, relativePath)), `Missing ${relativePath}`);
}

function assertIncludes(relativePath: string, fragment: string): void {
  assertCondition(read(relativePath).includes(fragment), `${relativePath} is missing ${fragment}`);
}

writePhase7ChannelReconciliationArtifacts();

const requiredFiles = [
  "tools/conformance/reconcile_473_phase7_deferred_channel.ts",
  "tools/conformance/validate_473_phase7_channel_reconciliation.ts",
  "data/conformance/473_phase7_channel_readiness_reconciliation.json",
  "data/conformance/473_phase7_phase_conformance_row_patch.json",
  "data/conformance/473_phase7_embedded_surface_coverage_matrix.json",
  "data/conformance/473_phase7_deferred_scope_blockers.json",
  "data/conformance/473_master_scorecard_after_phase7_reconciliation.json",
  "data/contracts/473_phase7_channel_reconciliation.schema.json",
  "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_473_CHANNEL_ACTIVATION_AUTHORITY.json",
  "docs/programme/473_phase7_channel_reconciliation_report.md",
  "docs/programme/473_deferred_nhs_app_channel_decision_log.md",
  "data/analysis/473_algorithm_alignment_notes.md",
  "data/analysis/473_external_reference_notes.json",
  "apps/ops-console/src/phase7-channel-reconciliation-473.model.ts",
  "tests/conformance/473_phase7_reconciliation_exact.test.ts",
  "tests/conformance/473_phase7_reconciliation_deferred.test.ts",
  "tests/conformance/473_phase7_reconciliation_blocked.test.ts",
  "tests/playwright/473_scorecard_phase7_channel.spec.ts",
];

for (const requiredFile of requiredFiles) {
  assertFile(requiredFile);
}

const reconciliation = readJson<any>(
  "data/conformance/473_phase7_channel_readiness_reconciliation.json",
);
const patch = readJson<any>("data/conformance/473_phase7_phase_conformance_row_patch.json");
const coverage = readJson<any>("data/conformance/473_phase7_embedded_surface_coverage_matrix.json");
const blockers = readJson<any>("data/conformance/473_phase7_deferred_scope_blockers.json");
const masterAfter = readJson<any>(
  "data/conformance/473_master_scorecard_after_phase7_reconciliation.json",
);

assertCondition(
  reconciliation.schemaVersion === "473.programme.phase7-channel-reconciliation.v1",
  "Bad 473 schema",
);
assertCondition(
  reconciliation.readinessPredicate.state === "deferred",
  "Default 473 output must be deferred",
);
assertCondition(patch.patchState === "deferred_preserved", "Patch must preserve deferred state");
assertCondition(patch.rowStateAfterPatch === "deferred_scope", "Phase 7 row must remain deferred");
assertCondition(
  patch.channelActivationPermitted === false,
  "Channel activation must not be permitted",
);
assertCondition(masterAfter.scorecardState === "exact", "Core scorecard should remain exact");
assertCondition(
  masterAfter.channelActivationPermitted === false,
  "Master after must block channel activation",
);
assertCondition(blockers.blockers.length >= 3, "Deferred output must expose blockers");
assertCondition(coverage.rows.length >= 7, "Embedded route coverage rows missing");
assertCondition(
  coverage.edgeCaseMatrix.some(
    (edgeCase: any) => edgeCase.edgeCaseId === "tenant_not_applicable_explicit",
  ),
  "Not-applicable tenant edge case missing",
);
assertCondition(
  reconciliation.readinessPredicate.optionalFutureInputStates.some(
    (input: any) => input.taskId === "seq_486" && input.availabilityState === "not_yet_available",
  ),
  "Missing task 486 not-yet-available input state",
);

for (const anchor of [
  'data-testid="phase7-channel-reconciliation"',
  'data-testid="phase7-channel-readiness-rail"',
  'data-testid="phase7-channel-matrix"',
  'data-testid="phase7-embedded-route-matrix"',
  'data-testid="phase7-channel-source-trace-drawer"',
  'data-testid="phase7-reconcile-as-complete"',
]) {
  assertIncludes("apps/ops-console/src/operations-shell-seed.tsx", anchor);
}

assertIncludes("package.json", "test:programme:473-phase7-channel-reconciliation");
assertIncludes("package.json", "validate:473-phase7-channel-reconciliation");
assertIncludes(
  "prompt/checklist.md",
  "seq_473_programme_merge_reconcile_phase7_deferred_channel_into_master_conformance_scorecard_when_ready",
);

const generatedSurfaces = [
  read("data/conformance/473_phase7_channel_readiness_reconciliation.json"),
  read("data/conformance/473_phase7_phase_conformance_row_patch.json"),
  read("data/conformance/473_phase7_embedded_surface_coverage_matrix.json"),
  read("data/conformance/473_phase7_deferred_scope_blockers.json"),
  read("data/conformance/473_master_scorecard_after_phase7_reconciliation.json"),
];
assertCondition(
  generatedSurfaces.every((surface) => !surface.match(/https?:\/\//)),
  "UI-facing 473 conformance artifacts must not carry raw web URLs",
);

console.log("Task 473 Phase 7 channel reconciliation validation passed.");
