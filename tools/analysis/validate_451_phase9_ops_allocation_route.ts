import fs from "node:fs";
import path from "node:path";
import {
  OPS_ALLOCATION_SCHEMA_VERSION,
  createOpsAllocationFixture,
} from "../../apps/ops-console/src/operations-allocation-phase9.model";

const root = process.cwd();

const requiredFiles = [
  "apps/ops-console/src/operations-allocation-phase9.model.ts",
  "apps/ops-console/src/operations-allocation-phase9.model.test.ts",
  "apps/ops-console/src/operations-shell-seed.model.ts",
  "apps/ops-console/src/operations-shell-seed.tsx",
  "apps/ops-console/src/operations-shell-seed.css",
  "data/contracts/451_phase9_ops_allocation_route_contract.json",
  "data/fixtures/451_phase9_ops_allocation_route_fixtures.json",
  "data/analysis/451_ops_allocation_implementation_note.md",
  "tools/test/run_phase9_ops_allocation_route.ts",
  "tools/analysis/validate_451_phase9_ops_allocation_route.ts",
  "tests/unit/451_ops_allocation_route.spec.ts",
  "tests/integration/451_ops_allocation_route_artifacts.spec.ts",
  "tests/playwright/451_ops_allocation_route.spec.js",
];

const requiredSourceFragments: Record<string, readonly string[]> = {
  "apps/ops-console/src/operations-allocation-phase9.model.ts": [
    "InterventionCandidateLease",
    "OpsActionEligibilityFence",
    "createOpsAllocationProjection",
    "createOpsAllocationFixture",
    "lowSample",
    "settlement_pending",
  ],
  "apps/ops-console/src/operations-shell-seed.tsx": [
    'dataSurface="bottleneck-radar"',
    'dataSurface="capacity-allocator"',
    'dataSurface="cohort-impact-matrix"',
    'data-surface="intervention-workbench"',
    'data-surface="action-eligibility-state"',
    'data-surface="scenario-compare"',
    'data-surface="ops-governance-handoff"',
    "data-candidate-lease-ref",
  ],
  "apps/ops-console/src/operations-shell-seed.model.ts": [
    "allocationProjection",
    "createOpsAllocationProjection",
    "workbenchStateForAllocationEligibility",
    "selectionLease",
  ],
  "apps/ops-console/src/operations-shell-seed.css": [
    ".ops-ladder__row",
    ".ops-capacity-row",
    ".ops-cohort-mini",
    ".ops-eligibility-card",
    ".ops-scenario-compare",
    "@media (prefers-reduced-motion: reduce)",
  ],
  "tests/playwright/451_ops_allocation_route.spec.js": [
    "bottleneck-radar",
    "capacity-allocator",
    "cohort-impact-matrix",
    "intervention-workbench",
    "permission-denied",
    "settlement-pending",
    "reducedMotion",
    "accessibilityApi?.snapshot",
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
  packageJson.scripts?.["test:phase9:ops-allocation-route"] ===
    "pnpm exec tsx ./tools/test/run_phase9_ops_allocation_route.ts && pnpm exec vitest run tests/unit/451_ops_allocation_route.spec.ts tests/integration/451_ops_allocation_route_artifacts.spec.ts && node tests/playwright/451_ops_allocation_route.spec.js --run",
  "PACKAGE_SCRIPT_MISSING:test:phase9:ops-allocation-route",
);
assert(
  packageJson.scripts?.["validate:451-phase9-ops-allocation-route"] ===
    "pnpm exec tsx ./tools/analysis/validate_451_phase9_ops_allocation_route.ts",
  "PACKAGE_SCRIPT_MISSING:validate:451-phase9-ops-allocation-route",
);

const checklist = readText("prompt/checklist.md");
assert(/^- \[(?:-|X)\] par_451_/m.test(checklist), "CHECKLIST_TASK_451_NOT_CLAIMED_OR_COMPLETE");

const contract = readJson<{
  schemaVersion?: string;
  requiredSurfaces?: readonly string[];
  automationAnchors?: readonly string[];
  actionEligibilityProof?: {
    normal?: string;
    stale?: string;
    quarantined?: string;
    blocked?: string;
    permissionDenied?: string;
    settlementPending?: { eligibility?: string; settlementStatus?: string };
  };
  parityProof?: {
    bottleneckRows?: number;
    capacityRows?: number;
    cohortRows?: number;
    lowSamplePromotionBlocked?: boolean;
  };
  noGapArtifactRequired?: boolean;
}>("data/contracts/451_phase9_ops_allocation_route_contract.json");
const fixture = readJson<ReturnType<typeof createOpsAllocationFixture>>(
  "data/fixtures/451_phase9_ops_allocation_route_fixtures.json",
);
const recomputed = createOpsAllocationFixture();

assert(contract.schemaVersion === OPS_ALLOCATION_SCHEMA_VERSION, "CONTRACT_SCHEMA_VERSION_DRIFT");
assert(fixture.schemaVersion === OPS_ALLOCATION_SCHEMA_VERSION, "FIXTURE_SCHEMA_VERSION_DRIFT");
for (const surface of [
  "BottleneckRadar",
  "CapacityAllocator",
  "CohortImpactMatrix",
  "InterventionWorkbench",
]) {
  assert(contract.requiredSurfaces?.includes(surface), `REQUIRED_SURFACE_MISSING:${surface}`);
}
for (const anchor of [
  "bottleneck-radar",
  "capacity-allocator",
  "cohort-impact-matrix",
  "intervention-workbench",
  "action-eligibility-state",
  "scenario-compare",
  "ops-governance-handoff",
]) {
  assert(contract.automationAnchors?.includes(anchor), `AUTOMATION_ANCHOR_MISSING:${anchor}`);
}
assert(contract.actionEligibilityProof?.normal === "executable", "NORMAL_NOT_EXECUTABLE");
assert(contract.actionEligibilityProof?.stale === "stale_reacquire", "STALE_NOT_REACQUIRE");
assert(
  contract.actionEligibilityProof?.quarantined === "read_only_recovery",
  "QUARANTINE_NOT_READ_ONLY",
);
assert(contract.actionEligibilityProof?.blocked === "blocked", "BLOCKED_NOT_BLOCKED");
assert(
  contract.actionEligibilityProof?.permissionDenied === "blocked",
  "PERMISSION_DENIED_NOT_BLOCKED",
);
assert(
  contract.actionEligibilityProof?.settlementPending?.settlementStatus === "pending_effect",
  "SETTLEMENT_PENDING_NOT_VISIBLE",
);
assert(contract.parityProof?.bottleneckRows === 5, "BOTTLENECK_ROW_COUNT_DRIFT");
assert(contract.parityProof?.capacityRows === 3, "CAPACITY_ROW_COUNT_DRIFT");
assert(contract.parityProof?.cohortRows === 4, "COHORT_ROW_COUNT_DRIFT");
assert(contract.parityProof?.lowSamplePromotionBlocked === true, "LOW_SAMPLE_PROMOTED");
assert(
  fixture.scenarioProjections.queues.normal.boardStateDigestRef ===
    recomputed.scenarioProjections.queues.normal.boardStateDigestRef,
  "FIXTURE_DIGEST_DRIFT",
);
assert(contract.noGapArtifactRequired === true, "UNEXPECTED_GAP_ARTIFACT_REQUIRED");

const gapPath = path.join(
  root,
  "data/contracts/PHASE9_BATCH_443_457_INTERFACE_GAP_451_INTERVENTION_ELIGIBILITY.json",
);
assert(!fs.existsSync(gapPath), "UNEXPECTED_INTERVENTION_ELIGIBILITY_GAP_ARTIFACT");

console.log("Task 451 ops allocation route validation passed.");
