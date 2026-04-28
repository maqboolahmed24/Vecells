import fs from "node:fs";
import path from "node:path";

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

function assertIncludes(file: string, fragment: string): void {
  const content = read(file);
  assertCondition(content.includes(fragment), `${file} is missing ${fragment}`);
}

const requiredFiles = [
  "apps/ops-console/src/conformance-scorecard-phase9.model.ts",
  "apps/ops-console/src/conformance-scorecard-phase9.model.test.ts",
  "docs/frontend/460_cross_phase_conformance_scorecard_spec.md",
  "docs/accessibility/460_conformance_scorecard_a11y_notes.md",
  "data/contracts/460_conformance_scorecard_projection.schema.json",
  "data/contracts/PHASE9_BATCH_458_472_INTERFACE_GAP_460_CONFORMANCE_PROJECTION.json",
  "data/contracts/460_phase9_conformance_scorecard_route_contract.json",
  "data/fixtures/460_conformance_scorecard_fixtures.json",
  "data/analysis/460_algorithm_alignment_notes.md",
  "data/analysis/460_external_reference_notes.json",
  "tests/unit/460_conformance_scorecard_projection.spec.ts",
  "tests/integration/460_conformance_scorecard_artifacts.spec.ts",
  "tests/playwright/460_conformance_scorecard_flow.spec.ts",
  "tests/playwright/460_conformance_blockers.spec.ts",
  "tests/playwright/460_conformance_accessibility.spec.ts",
  "tests/playwright/460_conformance_visual.spec.ts",
  "tools/test/run_phase9_conformance_scorecard.ts",
  "tools/analysis/validate_460_phase9_conformance_scorecard.ts",
];

for (const requiredFile of requiredFiles) {
  assertCondition(
    fs.existsSync(path.join(root, requiredFile)),
    `Missing required file ${requiredFile}`,
  );
}

for (const componentName of [
  "function ConformanceScorecardShell",
  "function PhaseRowProofTable",
  "function CrossPhaseControlFamilyMatrix",
  "function RuntimeTupleCoverageBand",
  "function GovernanceOpsProofRail",
  "function BAUSignoffBlockerQueue",
  "function ConformanceSourceTraceDrawer",
  "function ScorecardHashCard",
  "function SummaryAlignmentDiffPanel",
]) {
  assertIncludes("apps/ops-console/src/operations-shell-seed.tsx", componentName);
}

for (const projectionName of [
  "interface CrossPhaseConformanceScorecardProjection",
  "interface PhaseConformanceRowProjection",
  "interface ConformanceBlockerQueueProjection",
  "interface BAUSignoffReadinessProjection",
  "interface ConformanceSourceTraceProjection",
  "interface ConformanceRowDiffProjection",
]) {
  assertIncludes("apps/ops-console/src/conformance-scorecard-phase9.model.ts", projectionName);
}

for (const anchor of [
  'data-testid="conformance-scorecard-shell"',
  'data-testid="phase-row-proof-table"',
  'data-testid="cross-phase-control-family-matrix"',
  'data-testid="runtime-tuple-coverage-band"',
  'data-testid="governance-ops-proof-rail"',
  'data-testid="bau-signoff-blocker-queue"',
  'data-testid="conformance-source-trace-drawer"',
  'data-testid="scorecard-hash-card"',
  'data-testid="summary-alignment-diff-panel"',
]) {
  assertIncludes("apps/ops-console/src/operations-shell-seed.tsx", anchor);
}

assertIncludes("apps/ops-console/src/operations-shell-seed.model.ts", '"conformance"');
assertIncludes("apps/ops-console/src/operations-shell-seed.model.ts", "conformanceProjection");
assertIncludes("apps/ops-console/src/operations-shell-seed.tsx", "data-conformance-visual-mode");
assertIncludes("apps/ops-console/src/operations-shell-seed.tsx", "data-no-raw-artifact-urls");
assertIncludes("apps/ops-console/src/operations-shell-seed.css", ".ops-conformance-scorecard");
assertIncludes("package.json", "test:phase9:conformance-scorecard");
assertIncludes("package.json", "validate:460-phase9-conformance-scorecard");

const contract = readJson<any>(
  "data/contracts/460_phase9_conformance_scorecard_route_contract.json",
);
assertCondition(
  contract.schemaVersion === "460.phase9.service-owner-conformance-scorecard.v1",
  "Bad task 460 schema version",
);
assertCondition(contract.routeIntegration.path === "/ops/conformance", "Bad scorecard route");
assertCondition(contract.routeIntegration.serviceOwnerSurface === true, "Missing owner surface");
assertCondition(contract.routeIntegration.noExecutiveRag === true, "Scorecard must not be RAG");
assertCondition(contract.bauGating.exactReady === true, "Exact scorecard must be ready");
assertCondition(contract.bauGating.staleDiagnosticOnly === true, "Stale must be diagnostic-only");
assertCondition(contract.bauGating.summaryDriftBlocked === true, "Summary drift must block");
assertCondition(
  contract.bauGating.missingVerificationBlocked === true,
  "Missing verification must block",
);
assertCondition(contract.bauGating.staleRuntimeBlocked === true, "Stale runtime must block");
assertCondition(contract.bauGating.missingOpsProofBlocked === true, "Missing ops proof must block");
assertCondition(
  contract.bauGating.deferredChannelExplicit === true,
  "Deferred channel must stay explicit",
);
assertCondition(
  contract.artifactSafety.noRawArtifactUrls === true &&
    contract.artifactSafety.allHandoffsSuppressRawUrls === true &&
    contract.artifactSafety.serializedProjectionHasNoHttpUrls === true,
  "Raw artifact URLs must be suppressed",
);

for (const target of [
  "assurance",
  "governance",
  "operations",
  "resilience",
  "incident",
  "records",
  "release",
]) {
  assertCondition(
    contract.projectionCoverage.safeHandoffTargets.includes(target),
    `Missing handoff target ${target}`,
  );
}

const fixture = readJson<any>("data/fixtures/460_conformance_scorecard_fixtures.json");
for (const state of [
  "exact",
  "stale",
  "blocked",
  "summary_drift",
  "missing_verification",
  "stale_runtime_tuple",
  "missing_ops_proof",
  "deferred_channel",
  "no_blocker",
  "permission_denied",
]) {
  assertCondition(fixture.scenarioProjections[state], `Fixture missing ${state}`);
}
for (const anchor of [
  "conformance-scorecard-shell",
  "phase-row-proof-table",
  "cross-phase-control-family-matrix",
  "runtime-tuple-coverage-band",
  "governance-ops-proof-rail",
  "bau-signoff-blocker-queue",
  "conformance-source-trace-drawer",
  "scorecard-hash-card",
  "summary-alignment-diff-panel",
]) {
  assertCondition(
    fixture.automationAnchors.includes(anchor),
    `Missing automation anchor ${anchor}`,
  );
}

const gap = readJson<any>(
  "data/contracts/PHASE9_BATCH_458_472_INTERFACE_GAP_460_CONFORMANCE_PROJECTION.json",
);
assertCondition(gap.status === "bounded_adapter_created", "Missing bounded adapter gap status");
assertCondition(
  gap.adapter.readPolicy === "canonical_phase_conformance_rows_and_scorecards_only",
  "Adapter must read canonical conformance objects only",
);

assertCondition(
  /^\- \[(?:-|X)\] par_460_phase9_track_Playwright_or_other_appropriate_tooling_frontend_build_cross_phase_conformance_scorecard_for_service_owners/m.test(
    read("prompt/checklist.md"),
  ),
  "Checklist row for par_460 must be claimed or complete",
);

console.log("Task 460 conformance scorecard validation passed.");
