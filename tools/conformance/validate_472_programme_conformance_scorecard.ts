import fs from "node:fs";
import path from "node:path";
import { writeProgrammeConformanceArtifacts } from "./generate_472_programme_conformance_scorecard";

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

writeProgrammeConformanceArtifacts();

const requiredFiles = [
  "tools/conformance/generate_472_programme_conformance_scorecard.ts",
  "tools/conformance/validate_472_programme_conformance_scorecard.ts",
  "data/conformance/472_cross_phase_conformance_scorecard.json",
  "data/conformance/472_phase_conformance_rows.json",
  "data/conformance/472_cross_phase_control_family_rows.json",
  "data/conformance/472_deferred_scope_and_phase7_dependency_note.json",
  "data/conformance/472_summary_alignment_corrections.json",
  "docs/programme/472_programme_merge_conformance_report.md",
  "docs/programme/472_bau_handoff_summary.md",
  "docs/architecture/472_cross_phase_conformance_topology.mmd",
  "data/contracts/472_programme_conformance_scorecard.schema.json",
  "data/analysis/472_algorithm_alignment_notes.md",
  "data/analysis/472_external_reference_notes.json",
  "data/contracts/PHASE9_BATCH_458_472_INTERFACE_GAP_472_PROGRAMME_SCORECARD_GENERATOR.json",
  "apps/ops-console/src/programme-conformance-472.model.ts",
  "tests/integration/472_programme_conformance_generator.test.ts",
  "tests/integration/472_summary_alignment_blocking.test.ts",
  "tests/integration/472_phase7_deferred_scope_dependency.test.ts",
  "tests/integration/472_scorecard_hash_determinism.test.ts",
  "tests/playwright/472_programme_conformance_scorecard_smoke.spec.ts",
];

for (const requiredFile of requiredFiles) {
  assertFile(requiredFile);
}

const scorecard = readJson<any>("data/conformance/472_cross_phase_conformance_scorecard.json");
const phaseRows = readJson<any>("data/conformance/472_phase_conformance_rows.json").rows;
const controlRows = readJson<any>("data/conformance/472_cross_phase_control_family_rows.json").rows;
const deferredScope = readJson<any>(
  "data/conformance/472_deferred_scope_and_phase7_dependency_note.json",
);
const corrections = readJson<any>("data/conformance/472_summary_alignment_corrections.json");

assertCondition(scorecard.scorecardState === "exact", "Task 472 scorecard must be exact");
assertCondition(scorecard.allMandatoryRowsExact === true, "Mandatory rows must be exact");
assertCondition(scorecard.blockerCount === 0, "Exact scorecard should not carry blockers");
assertCondition(scorecard.phaseRowCount === 10, "Expected ten phase rows");
assertCondition(scorecard.controlFamilyRowCount >= 14, "Expected mandatory control-family rows");
assertCondition(
  scorecard.permittedDeferredRows.includes("phase_7_deferred_nhs_app_channel_scope"),
  "Phase 7 deferred row must be explicit and permitted",
);
assertCondition(
  phaseRows.some(
    (row: any) =>
      row.rowCode === "phase_7" &&
      row.rowState === "deferred_scope" &&
      row.mandatoryForCurrentCoreRelease === false,
  ),
  "Phase 7 deferred scope row is missing or mandatory",
);
assertCondition(
  controlRows.some((row: any) => row.rowCode === "artifact_presentation_outbound_navigation_grant"),
  "Artifact presentation/outbound grant control row missing",
);
assertCondition(
  deferredScope.activeDependencyRefs.includes("OutboundNavigationGrant") &&
    deferredScope.activeDependencyRefs.includes("ArtifactPresentationContract"),
  "Deferred scope note must retain active Phase 7 artifact and grant dependencies",
);
assertCondition(
  corrections.blockedClaimExamples.every(
    (correction: any) =>
      correction.originalClaimState === "blocked" && correction.correctionApplied === true,
  ),
  "Summary alignment corrections must preserve blocked original claim state",
);

for (const anchor of [
  'data-testid="programme-472-scorecard"',
  'data-testid="programme-472-hash-card"',
  'data-testid="programme-472-row-table"',
  'data-testid="programme-472-deferred-scope"',
  'data-testid="programme-472-summary-corrections"',
  'data-testid="programme-472-source-trace-drawer"',
  'data-testid="programme-472-handoffs"',
]) {
  assertIncludes("apps/ops-console/src/operations-shell-seed.tsx", anchor);
}

assertIncludes("package.json", "test:programme:472-conformance-scorecard");
assertIncludes("package.json", "validate:472-programme-conformance-scorecard");
assertIncludes(
  "prompt/checklist.md",
  "seq_472_programme_merge_reconcile_phase0_to_phase6_and_phase8_phase9_conformance_scorecard",
);

const generatedSurfaces = [
  read("data/conformance/472_cross_phase_conformance_scorecard.json"),
  read("data/conformance/472_phase_conformance_rows.json"),
  read("data/conformance/472_cross_phase_control_family_rows.json"),
  read("data/conformance/472_deferred_scope_and_phase7_dependency_note.json"),
  read("data/conformance/472_summary_alignment_corrections.json"),
];
assertCondition(
  generatedSurfaces.every((surface) => !surface.match(/https?:\/\//)),
  "Runtime scorecard artifacts must not carry raw web URLs into the UI surface",
);

console.log("Task 472 programme conformance scorecard validation passed.");
