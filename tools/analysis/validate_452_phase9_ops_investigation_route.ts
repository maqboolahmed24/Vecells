import fs from "node:fs";
import path from "node:path";
import {
  OPS_INVESTIGATION_SCHEMA_VERSION,
  createOpsInvestigationFixture,
} from "../../apps/ops-console/src/operations-investigation-phase9.model";

const root = process.cwd();

const requiredFiles = [
  "apps/ops-console/src/operations-investigation-phase9.model.ts",
  "apps/ops-console/src/operations-investigation-phase9.model.test.ts",
  "apps/ops-console/src/operations-shell-seed.model.ts",
  "apps/ops-console/src/operations-shell-seed.tsx",
  "apps/ops-console/src/operations-shell-seed.css",
  "data/contracts/452_phase9_ops_investigation_route_contract.json",
  "data/fixtures/452_phase9_ops_investigation_route_fixtures.json",
  "data/analysis/452_ops_investigation_implementation_note.md",
  "tools/test/run_phase9_ops_investigation_route.ts",
  "tools/analysis/validate_452_phase9_ops_investigation_route.ts",
  "tests/unit/452_ops_investigation_route.spec.ts",
  "tests/integration/452_ops_investigation_route_artifacts.spec.ts",
  "tests/playwright/452_ops_investigation_route.spec.js",
];

const requiredSourceFragments: Record<string, readonly string[]> = {
  "apps/ops-console/src/operations-investigation-phase9.model.ts": [
    "OpsInvestigationScopeEnvelope",
    "OpsInvestigationTimelineReconstruction",
    "OpsAuditQuerySession",
    "OpsEvidenceGraphMiniMap",
    "OpsBreakGlassReviewProjection",
    "OpsSupportReplayBoundary",
    "OpsInvestigationBundleExport",
    "createOpsInvestigationProjection",
    "createOpsInvestigationFixture",
  ],
  "apps/ops-console/src/operations-shell-seed.tsx": [
    'data-surface="investigation-drawer"',
    'data-surface="investigation-question"',
    'data-surface="proof-basis"',
    'data-surface="timeline-ladder"',
    'data-surface="audit-explorer"',
    'data-surface="break-glass-review"',
    'data-surface="support-replay-boundary"',
    'data-surface="evidence-graph-mini-map"',
    'data-surface="safe-return-anchor"',
    "focusOpsSafeReturnTarget",
  ],
  "apps/ops-console/src/operations-shell-seed.model.ts": [
    "investigationProjection",
    "createOpsInvestigationProjection",
    "investigationOriginLensForOpsLens",
    "investigationWorkbenchState",
  ],
  "apps/ops-console/src/operations-shell-seed.css": [
    ".ops-investigation-drawer",
    ".ops-audit-explorer",
    ".ops-timeline-ladder",
    ".ops-graph-minimap",
    ".ops-audit-layout",
    "@media (prefers-reduced-motion: reduce)",
  ],
  "tests/playwright/452_ops_investigation_route.spec.js": [
    "investigation-drawer",
    "audit-explorer",
    "timeline-ladder",
    "break-glass-review",
    "support-replay-boundary",
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
  packageJson.scripts?.["test:phase9:ops-investigation-route"] ===
    "pnpm exec tsx ./tools/test/run_phase9_ops_investigation_route.ts && pnpm exec vitest run tests/unit/452_ops_investigation_route.spec.ts tests/integration/452_ops_investigation_route_artifacts.spec.ts && node tests/playwright/452_ops_investigation_route.spec.js --run",
  "PACKAGE_SCRIPT_MISSING:test:phase9:ops-investigation-route",
);
assert(
  packageJson.scripts?.["validate:452-phase9-ops-investigation-route"] ===
    "pnpm exec tsx ./tools/analysis/validate_452_phase9_ops_investigation_route.ts",
  "PACKAGE_SCRIPT_MISSING:validate:452-phase9-ops-investigation-route",
);

const checklist = readText("prompt/checklist.md");
assert(/^- \[(?:-|X)\] par_452_/m.test(checklist), "CHECKLIST_TASK_452_NOT_CLAIMED_OR_COMPLETE");

const contract = readJson<{
  schemaVersion?: string;
  requiredSurfaces?: readonly string[];
  automationAnchors?: readonly string[];
  routeContinuityProof?: {
    preservedQuestionStableUnderDrift?: boolean;
    drawerDeltaStateWhenStale?: string;
  };
  graphAndExportProof?: {
    normalGraphVerdict?: string;
    normalExportState?: string;
    staleGraphVerdict?: string;
    staleExportState?: string;
    quarantinedGraphVerdict?: string;
    blockedExportState?: string;
    settlementExportState?: string;
  };
  auditExplorerProof?: {
    causalityState?: string;
    eventCount?: number;
    graphRowCount?: number;
    breakGlassAuthorizedVisibility?: boolean;
    supportReplayBlockedState?: string;
  };
  dispositionContractRefs?: {
    artifactPresentationContractRef?: string;
    artifactTransferSettlementRef?: string;
    artifactFallbackDispositionRef?: string;
    outboundNavigationGrantRef?: string;
  };
  noGapArtifactRequired?: boolean;
}>("data/contracts/452_phase9_ops_investigation_route_contract.json");
const fixture = readJson<ReturnType<typeof createOpsInvestigationFixture>>(
  "data/fixtures/452_phase9_ops_investigation_route_fixtures.json",
);
const recomputed = createOpsInvestigationFixture();

assert(
  contract.schemaVersion === OPS_INVESTIGATION_SCHEMA_VERSION,
  "CONTRACT_SCHEMA_VERSION_DRIFT",
);
assert(fixture.schemaVersion === OPS_INVESTIGATION_SCHEMA_VERSION, "FIXTURE_SCHEMA_VERSION_DRIFT");
for (const surface of [
  "InvestigationDrawer",
  "AuditExplorer",
  "TimelineLadder",
  "EvidenceGraphMiniMap",
  "BreakGlassReview",
  "SupportReplayBoundary",
  "InvestigationBundleExport",
]) {
  assert(contract.requiredSurfaces?.includes(surface), `REQUIRED_SURFACE_MISSING:${surface}`);
}
for (const anchor of [
  "investigation-drawer",
  "investigation-question",
  "proof-basis",
  "timeline-ladder",
  "audit-explorer",
  "break-glass-review",
  "support-replay-boundary",
  "evidence-graph-mini-map",
  "safe-return-anchor",
]) {
  assert(contract.automationAnchors?.includes(anchor), `AUTOMATION_ANCHOR_MISSING:${anchor}`);
}
assert(
  contract.routeContinuityProof?.preservedQuestionStableUnderDrift === true,
  "QUESTION_HASH_REBASED_UNDER_DRIFT",
);
assert(
  contract.routeContinuityProof?.drawerDeltaStateWhenStale === "drifted",
  "STALE_DRAWER_DELTA_NOT_VISIBLE",
);
assert(
  contract.graphAndExportProof?.normalGraphVerdict === "complete",
  "NORMAL_GRAPH_NOT_COMPLETE",
);
assert(
  contract.graphAndExportProof?.normalExportState === "export_ready",
  "NORMAL_EXPORT_NOT_READY",
);
assert(contract.graphAndExportProof?.staleGraphVerdict === "stale", "STALE_GRAPH_NOT_STALE");
assert(contract.graphAndExportProof?.staleExportState === "summary_only", "STALE_EXPORT_NOT_HELD");
assert(
  contract.graphAndExportProof?.quarantinedGraphVerdict === "blocked",
  "QUARANTINED_GRAPH_NOT_BLOCKED",
);
assert(
  contract.graphAndExportProof?.blockedExportState === "blocked",
  "BLOCKED_EXPORT_NOT_BLOCKED",
);
assert(
  contract.graphAndExportProof?.settlementExportState === "redaction_review",
  "SETTLEMENT_EXPORT_NOT_REVIEW",
);
assert(contract.auditExplorerProof?.causalityState === "complete", "AUDIT_CAUSALITY_NOT_COMPLETE");
assert(contract.auditExplorerProof?.eventCount === 4, "TIMELINE_EVENT_COUNT_DRIFT");
assert(contract.auditExplorerProof?.graphRowCount === 3, "GRAPH_ROW_COUNT_DRIFT");
assert(
  contract.auditExplorerProof?.breakGlassAuthorizedVisibility === false,
  "PERMISSION_DENIED_BREAK_GLASS_VISIBLE",
);
assert(
  contract.auditExplorerProof?.supportReplayBlockedState === "blocked",
  "PERMISSION_DENIED_REPLAY_NOT_BLOCKED",
);
assert(
  Boolean(contract.dispositionContractRefs?.artifactPresentationContractRef) &&
    Boolean(contract.dispositionContractRefs?.artifactTransferSettlementRef) &&
    Boolean(contract.dispositionContractRefs?.artifactFallbackDispositionRef) &&
    Boolean(contract.dispositionContractRefs?.outboundNavigationGrantRef),
  "DISPOSITION_CONTRACT_REFS_MISSING",
);
assert(
  fixture.scenarioProjections.audit.normal.boardStateDigestRef ===
    recomputed.scenarioProjections.audit.normal.boardStateDigestRef,
  "FIXTURE_DIGEST_DRIFT",
);
assert(contract.noGapArtifactRequired === true, "UNEXPECTED_GAP_ARTIFACT_REQUIRED");

const existingTimelineContract = path.join(
  root,
  "data/contracts/439_phase9_investigation_timeline_service_contract.json",
);
const existingDispositionContract = path.join(
  root,
  "data/contracts/443_phase9_disposition_execution_engine_contract.json",
);
assert(fs.existsSync(existingTimelineContract), "TASK_439_TIMELINE_CONTRACT_MISSING");
assert(fs.existsSync(existingDispositionContract), "TASK_443_DISPOSITION_CONTRACT_MISSING");

const gapPath = path.join(
  root,
  "data/contracts/PHASE9_BATCH_443_457_INTERFACE_GAP_452_INVESTIGATION_CONTRACTS.json",
);
assert(!fs.existsSync(gapPath), "UNEXPECTED_INVESTIGATION_CONTRACT_GAP_ARTIFACT");

console.log("Task 452 ops investigation route validation passed.");
