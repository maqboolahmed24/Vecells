import fs from "node:fs";
import path from "node:path";
import {
  OPS_OVERVIEW_SCHEMA_VERSION,
  createOpsOverviewFixture,
} from "../../apps/ops-console/src/operations-overview-phase9.model";

const root = process.cwd();

const requiredFiles = [
  "apps/ops-console/src/operations-overview-phase9.model.ts",
  "apps/ops-console/src/operations-shell-seed.model.ts",
  "apps/ops-console/src/operations-shell-seed.tsx",
  "apps/ops-console/src/operations-shell-seed.css",
  "apps/ops-console/src/operations-overview-phase9.model.test.ts",
  "data/contracts/450_phase9_ops_overview_route_contract.json",
  "data/fixtures/450_phase9_ops_overview_route_fixtures.json",
  "data/analysis/450_ops_overview_implementation_note.md",
  "tools/test/run_phase9_ops_overview_route.ts",
  "tools/analysis/validate_450_phase9_ops_overview_route.ts",
  "tests/unit/450_ops_overview_route.spec.ts",
  "tests/integration/450_ops_overview_route_artifacts.spec.ts",
  "tests/playwright/450_ops_overview_route.spec.js",
];

const requiredSourceFragments: Record<string, readonly string[]> = {
  "apps/ops-console/src/operations-shell-seed.tsx": [
    'data-surface="ops-overview"',
    'data-surface="north-star-band"',
    'dataSurface="service-health-grid"',
    'data-surface="ops-freshness-strip"',
    'data-surface="ops-stable-service-digest"',
    'data-surface="ops-health-cell"',
    'data-surface="ops-return-token-target"',
    "OpsReturnToken",
    "onSelectHealthCell",
  ],
  "apps/ops-console/src/operations-shell-seed.model.ts": [
    "shellContinuityKey",
    "boardStateDigestRef",
    "boardTupleHash",
    "selectedHealthCellRef",
    "createOpsSelectionLease",
    "createOpsReturnToken",
  ],
  "apps/ops-console/src/operations-shell-seed.css": [
    "--ops-bg: #f8faf8",
    "--ops-board: #eef2ef",
    "grid-template-columns: repeat(6",
    "grid-template-columns: repeat(3",
    "@media (prefers-reduced-motion: reduce)",
  ],
  "tests/playwright/450_ops_overview_route.spec.js": [
    "normal",
    "stable",
    "stale",
    "degraded",
    "quarantined",
    "blocked",
    "permission-denied",
    "freeze",
    "settlement-pending",
    "reducedMotion",
    "accessibility.snapshot",
  ],
};

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

for (const relativePath of requiredFiles) {
  assert(fs.existsSync(path.join(root, relativePath)), `MISSING_FILE:${relativePath}`);
}

for (const [relativePath, fragments] of Object.entries(requiredSourceFragments)) {
  const source = readText(relativePath);
  for (const fragment of fragments) {
    assert(source.includes(fragment), `SOURCE_FRAGMENT_MISSING:${relativePath}:${fragment}`);
  }
}

const packageJson = readJson<{ scripts?: Record<string, string> }>("package.json");
assert(
  packageJson.scripts?.["test:phase9:ops-overview-route"] ===
    "pnpm exec tsx ./tools/test/run_phase9_ops_overview_route.ts && pnpm exec vitest run tests/unit/450_ops_overview_route.spec.ts tests/integration/450_ops_overview_route_artifacts.spec.ts && node tests/playwright/450_ops_overview_route.spec.js --run",
  "PACKAGE_SCRIPT_MISSING:test:phase9:ops-overview-route",
);
assert(
  packageJson.scripts?.["validate:450-phase9-ops-overview-route"] ===
    "pnpm exec tsx ./tools/analysis/validate_450_phase9_ops_overview_route.ts",
  "PACKAGE_SCRIPT_MISSING:validate:450-phase9-ops-overview-route",
);

const checklist = readText("prompt/checklist.md");
assert(/^- \[(?:-|X)\] par_450_/m.test(checklist), "CHECKLIST_TASK_450_NOT_CLAIMED_OR_COMPLETE");

const contract = readJson<{
  schemaVersion?: string;
  requiredSurfaces?: readonly string[];
  automationAnchors?: readonly string[];
  scenarioStates?: readonly string[];
  shellContinuityContract?: {
    shellContinuityKey?: string;
    boardStateDigestRef?: string;
    boardTupleHash?: string;
  };
  failClosedStates?: {
    stale?: string;
    quarantined?: string;
    blocked?: string;
    permissionDenied?: string;
    freeze?: string;
    settlementPending?: string;
  };
  parityProof?: { northStarMetricCount?: number; serviceHealthCellCount?: number };
  noGapArtifactRequired?: boolean;
}>("data/contracts/450_phase9_ops_overview_route_contract.json");
const fixture = readJson<ReturnType<typeof createOpsOverviewFixture>>(
  "data/fixtures/450_phase9_ops_overview_route_fixtures.json",
);
const recomputed = createOpsOverviewFixture();

assert(contract.schemaVersion === OPS_OVERVIEW_SCHEMA_VERSION, "CONTRACT_SCHEMA_VERSION_DRIFT");
assert(fixture.schemaVersion === OPS_OVERVIEW_SCHEMA_VERSION, "FIXTURE_SCHEMA_VERSION_DRIFT");
for (const scenarioState of [
  "normal",
  "stable_service",
  "empty",
  "stale",
  "degraded",
  "quarantined",
  "blocked",
  "permission_denied",
  "freeze",
  "settlement_pending",
]) {
  assert(
    contract.scenarioStates?.includes(scenarioState),
    `SCENARIO_STATE_MISSING:${scenarioState}`,
  );
  assert(
    fixture.scenarioProjections[scenarioState].boardStateDigestRef ===
      recomputed.scenarioProjections[scenarioState].boardStateDigestRef,
    `SCENARIO_DIGEST_DRIFT:${scenarioState}`,
  );
}
for (const surface of [
  "OperationsConsoleShell",
  "NorthStarBand",
  "ServiceHealthGrid",
  "OpsStableServiceDigest",
  "ops-freshness-strip",
  "ops-return-token-target",
]) {
  assert(contract.requiredSurfaces?.includes(surface), `REQUIRED_SURFACE_MISSING:${surface}`);
}
for (const anchor of [
  "ops-overview",
  "north-star-band",
  "service-health-grid",
  "ops-freshness-strip",
  "ops-stable-service-digest",
  "ops-health-cell",
  "ops-return-token-target",
]) {
  assert(contract.automationAnchors?.includes(anchor), `AUTOMATION_ANCHOR_MISSING:${anchor}`);
}
assert(
  contract.shellContinuityContract?.shellContinuityKey ===
    recomputed.scenarioProjections.normal.shellContinuityKey,
  "SHELL_CONTINUITY_KEY_DRIFT",
);
assert(contract.failClosedStates?.stale === "diagnostic_only", "STALE_NOT_DIAGNOSTIC");
assert(contract.failClosedStates?.quarantined === "quarantined", "QUARANTINE_NOT_VISIBLE");
assert(contract.failClosedStates?.blocked === "blocked", "BLOCKED_NOT_BLOCKED");
assert(contract.failClosedStates?.permissionDenied === "blocked", "PERMISSION_DENIED_NOT_BLOCKED");
assert(contract.failClosedStates?.freeze === "release_freeze", "FREEZE_NOT_RELEASE_FREEZE");
assert(contract.failClosedStates?.settlementPending === "paused", "SETTLEMENT_NOT_PAUSED");
assert(contract.parityProof?.northStarMetricCount === 6, "NORTH_STAR_COUNT_DRIFT");
assert(contract.parityProof?.serviceHealthCellCount === 6, "SERVICE_HEALTH_COUNT_DRIFT");
assert(contract.noGapArtifactRequired === true, "UNEXPECTED_GAP_ARTIFACT_REQUIRED");

const gapPath = path.join(
  root,
  "data/contracts/PHASE9_BATCH_443_457_INTERFACE_GAP_450_OPS_SHELL_CONTRACTS.json",
);
assert(!fs.existsSync(gapPath), "UNEXPECTED_OPS_SHELL_CONTRACT_GAP_ARTIFACT");

console.log("Task 450 ops overview route validation passed.");
