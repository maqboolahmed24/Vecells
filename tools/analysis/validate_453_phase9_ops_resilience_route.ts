import fs from "node:fs";
import path from "node:path";
import {
  OPS_RESILIENCE_SCHEMA_VERSION,
  createOpsResilienceFixture,
} from "../../apps/ops-console/src/operations-resilience-phase9.model";

const root = process.cwd();

const requiredFiles = [
  "apps/ops-console/src/operations-resilience-phase9.model.ts",
  "apps/ops-console/src/operations-resilience-phase9.model.test.ts",
  "apps/ops-console/src/operations-shell-seed.model.ts",
  "apps/ops-console/src/operations-shell-seed.tsx",
  "apps/ops-console/src/operations-shell-seed.css",
  "data/contracts/453_phase9_ops_resilience_route_contract.json",
  "data/fixtures/453_phase9_ops_resilience_route_fixtures.json",
  "data/analysis/453_ops_resilience_implementation_note.md",
  "tools/test/run_phase9_ops_resilience_route.ts",
  "tools/analysis/validate_453_phase9_ops_resilience_route.ts",
  "tests/unit/453_ops_resilience_route.spec.ts",
  "tests/integration/453_ops_resilience_route_artifacts.spec.ts",
  "tests/playwright/453_ops_resilience_route.spec.js",
];

const requiredSourceFragments: Record<string, readonly string[]> = {
  "apps/ops-console/src/operations-resilience-phase9.model.ts": [
    "OpsResilienceSurfaceRuntimeBindingProjection",
    "OpsRecoveryControlPostureProjection",
    "OpsResilienceActionRailItem",
    "OpsRecoveryEvidenceArtifactProjection",
    "createOpsResilienceProjection",
    "createOpsResilienceFixture",
  ],
  "apps/ops-console/src/operations-shell-seed.tsx": [
    'data-surface="resilience-board"',
    'data-surface="essential-function-map"',
    'data-surface="operational-readiness-snapshot"',
    'data-surface="dependency-restore-bands"',
    'data-surface="backup-freshness"',
    'data-surface="runbook-binding"',
    'data-surface="recovery-control-posture"',
    'data-surface="recovery-run-timeline"',
    'data-surface="recovery-action-rail"',
    'data-surface="resilience-settlement"',
    'data-surface="recovery-artifact-stage"',
  ],
  "apps/ops-console/src/operations-shell-seed.model.ts": [
    "resilienceProjection",
    "createOpsResilienceProjection",
    "workbenchStateForRecoveryControl",
    "resilienceWorkbenchState",
  ],
  "apps/ops-console/src/operations-shell-seed.css": [
    ".ops-resilience-board",
    ".ops-restore-band",
    ".ops-restore-node",
    ".ops-recovery-action-rail",
    "@media (prefers-reduced-motion: reduce)",
  ],
  "tests/playwright/453_ops_resilience_route.spec.js": [
    "resilience-board",
    "dependency-restore-bands",
    "permission-denied",
    "settlement-pending",
    "freeze",
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
  packageJson.scripts?.["test:phase9:ops-resilience-route"] ===
    "pnpm exec tsx ./tools/test/run_phase9_ops_resilience_route.ts && pnpm exec vitest run tests/unit/453_ops_resilience_route.spec.ts tests/integration/453_ops_resilience_route_artifacts.spec.ts && node tests/playwright/453_ops_resilience_route.spec.js --run",
  "PACKAGE_SCRIPT_MISSING:test:phase9:ops-resilience-route",
);
assert(
  packageJson.scripts?.["validate:453-phase9-ops-resilience-route"] ===
    "pnpm exec tsx ./tools/analysis/validate_453_phase9_ops_resilience_route.ts",
  "PACKAGE_SCRIPT_MISSING:validate:453-phase9-ops-resilience-route",
);

const checklist = readText("prompt/checklist.md");
assert(/^- \[(?:-|X)\] par_453_/m.test(checklist), "CHECKLIST_TASK_453_NOT_CLAIMED_OR_COMPLETE");

const contract = readJson<{
  schemaVersion?: string;
  routes?: readonly string[];
  requiredSurfaces?: readonly string[];
  automationAnchors?: readonly string[];
  resilienceAuthority?: {
    bindingState?: string;
    controlState?: string;
    latestSettlementResult?: string;
    essentialFunctionCount?: number;
    dependencyBandCount?: number;
    actionRailCount?: number;
  };
  downgradeProof?: {
    staleBindingState?: string;
    staleRunbookState?: string;
    degradedTrustState?: string;
    degradedControlState?: string;
    freezeControlState?: string;
    freezeState?: string;
    blockedBackupState?: string;
    blockedReadinessState?: string;
    permissionDeniedBindingState?: string;
    permissionDeniedSettlementResult?: string;
    settlementPendingResult?: string;
  };
  artifactProof?: {
    normalArtifactState?: string;
    staleArtifactState?: string;
    permissionDeniedArtifactState?: string;
    artifactPresentationContractRef?: string;
    artifactTransferSettlementRef?: string;
    artifactFallbackDispositionRef?: string;
    outboundNavigationGrantRef?: string;
  };
  timelineProof?: {
    normalTimelineState?: string;
    normalRunAuthority?: string;
    staleTimelineState?: string;
    staleRunAuthority?: string;
    runEventCount?: number;
  };
  noGapArtifactRequired?: boolean;
}>("data/contracts/453_phase9_ops_resilience_route_contract.json");
const fixture = readJson<ReturnType<typeof createOpsResilienceFixture>>(
  "data/fixtures/453_phase9_ops_resilience_route_fixtures.json",
);
const recomputed = createOpsResilienceFixture();

assert(contract.schemaVersion === OPS_RESILIENCE_SCHEMA_VERSION, "CONTRACT_SCHEMA_VERSION_DRIFT");
assert(fixture.schemaVersion === OPS_RESILIENCE_SCHEMA_VERSION, "FIXTURE_SCHEMA_VERSION_DRIFT");
assert(contract.routes?.includes("/ops/resilience"), "ROUTE_MISSING:/ops/resilience");
for (const surface of [
  "ResilienceBoard",
  "EssentialFunctionMap",
  "DependencyRestoreBands",
  "BackupFreshness",
  "RunbookBinding",
  "OperationalReadinessSnapshot",
  "RecoveryControlPosture",
  "RecoveryRunTimeline",
  "RecoveryActionRail",
  "ResilienceSettlement",
  "RecoveryArtifactStage",
]) {
  assert(contract.requiredSurfaces?.includes(surface), `REQUIRED_SURFACE_MISSING:${surface}`);
}
for (const anchor of [
  "resilience-board",
  "essential-function-map",
  "dependency-restore-bands",
  "backup-freshness",
  "runbook-binding",
  "recovery-control-posture",
  "recovery-action-rail",
  "resilience-settlement",
  "recovery-artifact-stage",
]) {
  assert(contract.automationAnchors?.includes(anchor), `AUTOMATION_ANCHOR_MISSING:${anchor}`);
}
assert(contract.resilienceAuthority?.bindingState === "live", "NORMAL_BINDING_NOT_LIVE");
assert(contract.resilienceAuthority?.controlState === "live_control", "NORMAL_CONTROL_NOT_LIVE");
assert(contract.resilienceAuthority?.latestSettlementResult === "applied", "NORMAL_NOT_APPLIED");
assert(contract.resilienceAuthority?.essentialFunctionCount === 10, "FUNCTION_COUNT_DRIFT");
assert(contract.resilienceAuthority?.dependencyBandCount === 10, "RESTORE_BAND_COUNT_DRIFT");
assert(contract.resilienceAuthority?.actionRailCount === 10, "ACTION_RAIL_COUNT_DRIFT");
assert(
  contract.downgradeProof?.staleBindingState === "diagnostic_only",
  "STALE_BINDING_NOT_DIAGNOSTIC_ONLY",
);
assert(contract.downgradeProof?.staleRunbookState === "stale", "STALE_RUNBOOK_NOT_STALE");
assert(contract.downgradeProof?.degradedTrustState === "degraded", "DEGRADED_TRUST_MISSING");
assert(
  contract.downgradeProof?.degradedControlState === "diagnostic_only",
  "DEGRADED_CONTROL_NOT_DIAGNOSTIC_ONLY",
);
assert(contract.downgradeProof?.freezeState === "active", "FREEZE_STATE_NOT_ACTIVE");
assert(
  contract.downgradeProof?.freezeControlState === "governed_recovery",
  "FREEZE_CONTROL_NOT_GOVERNED",
);
assert(contract.downgradeProof?.blockedBackupState === "missing", "BLOCKED_BACKUP_NOT_MISSING");
assert(contract.downgradeProof?.blockedReadinessState === "blocked", "BLOCKED_READINESS_DRIFT");
assert(
  contract.downgradeProof?.permissionDeniedBindingState === "blocked",
  "PERMISSION_DENIED_NOT_BLOCKED",
);
assert(
  contract.downgradeProof?.permissionDeniedSettlementResult === "blocked_publication",
  "PERMISSION_DENIED_SETTLEMENT_DRIFT",
);
assert(
  contract.downgradeProof?.settlementPendingResult === "accepted_pending_evidence",
  "PENDING_SETTLEMENT_NOT_VISIBLE",
);
assert(
  contract.artifactProof?.normalArtifactState === "external_handoff_ready",
  "NORMAL_ARTIFACT_NOT_READY",
);
assert(
  contract.artifactProof?.staleArtifactState === "governed_preview",
  "STALE_ARTIFACT_NOT_GOVERNED",
);
assert(
  contract.artifactProof?.permissionDeniedArtifactState === "summary_only",
  "PERMISSION_DENIED_ARTIFACT_NOT_SUMMARY",
);
assert(
  Boolean(contract.artifactProof?.artifactPresentationContractRef) &&
    Boolean(contract.artifactProof?.artifactTransferSettlementRef) &&
    Boolean(contract.artifactProof?.artifactFallbackDispositionRef) &&
    Boolean(contract.artifactProof?.outboundNavigationGrantRef),
  "DISPOSITION_CONTRACT_REFS_MISSING",
);
assert(contract.timelineProof?.normalTimelineState === "exact", "NORMAL_TIMELINE_NOT_EXACT");
assert(
  contract.timelineProof?.normalRunAuthority === "current_tuple",
  "NORMAL_RUN_NOT_AUTHORITATIVE",
);
assert(contract.timelineProof?.staleTimelineState === "stale", "STALE_TIMELINE_NOT_STALE");
assert(
  contract.timelineProof?.staleRunAuthority === "historical_only",
  "STALE_RUN_NOT_HISTORICAL_ONLY",
);
assert(contract.timelineProof?.runEventCount === 3, "RUN_EVENT_COUNT_DRIFT");
assert(
  fixture.scenarioProjections.normal.boardStateDigestRef ===
    recomputed.scenarioProjections.normal.boardStateDigestRef,
  "FIXTURE_DIGEST_DRIFT",
);
assert(contract.noGapArtifactRequired === true, "UNEXPECTED_GAP_ARTIFACT_REQUIRED");

for (const existingContract of [
  "data/contracts/443_phase9_disposition_execution_engine_contract.json",
  "data/contracts/444_phase9_operational_readiness_posture_contract.json",
  "data/contracts/445_phase9_resilience_action_settlement_contract.json",
]) {
  assert(
    fs.existsSync(path.join(root, existingContract)),
    `UPSTREAM_CONTRACT_MISSING:${existingContract}`,
  );
}

const gapPath = path.join(
  root,
  "data/contracts/PHASE9_BATCH_443_457_INTERFACE_GAP_453_RESILIENCE_BOARD_INPUTS.json",
);
assert(!fs.existsSync(gapPath), "UNEXPECTED_RESILIENCE_BOARD_GAP_ARTIFACT");

console.log("Task 453 ops resilience route validation passed.");
