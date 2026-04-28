import fs from "node:fs";
import path from "node:path";
import {
  OPS_ASSURANCE_SCHEMA_VERSION,
  createOpsAssuranceFixture,
} from "../../apps/ops-console/src/operations-assurance-phase9.model";

const root = process.cwd();

const requiredFiles = [
  "apps/ops-console/src/operations-assurance-phase9.model.ts",
  "apps/ops-console/src/operations-assurance-phase9.model.test.ts",
  "apps/ops-console/src/operations-shell-seed.model.ts",
  "apps/ops-console/src/operations-shell-seed.tsx",
  "apps/ops-console/src/operations-shell-seed.css",
  "data/contracts/454_phase9_ops_assurance_route_contract.json",
  "data/fixtures/454_phase9_ops_assurance_route_fixtures.json",
  "data/analysis/454_ops_assurance_implementation_note.md",
  "tools/test/run_phase9_ops_assurance_route.ts",
  "tools/analysis/validate_454_phase9_ops_assurance_route.ts",
  "tests/unit/454_ops_assurance_route.spec.ts",
  "tests/integration/454_ops_assurance_route_artifacts.spec.ts",
  "tests/playwright/454_ops_assurance_route.spec.js",
];

const requiredSourceFragments: Record<string, readonly string[]> = {
  "apps/ops-console/src/operations-assurance-phase9.model.ts": [
    "OpsAssuranceSurfaceRuntimeBindingProjection",
    "OpsAssuranceControlHeatMapCell",
    "OpsAssurancePackPreviewProjection",
    "OpsAssurancePackSettlementProjection",
    "createOpsAssuranceProjection",
    "createOpsAssuranceFixture",
  ],
  "apps/ops-console/src/operations-shell-seed.tsx": [
    'data-surface="assurance-center"',
    'data-surface="framework-selector"',
    'data-surface="control-heat-map"',
    'data-surface="control-heat-table"',
    'data-surface="evidence-gap-queue"',
    'data-surface="capa-tracker"',
    'data-surface="pack-preview"',
    'data-surface="pack-settlement"',
    'data-surface="pack-export-state"',
  ],
  "apps/ops-console/src/operations-shell-seed.model.ts": [
    "assuranceProjection",
    "createOpsAssuranceProjection",
    "workbenchStateForAssuranceControl",
    "assuranceWorkbenchState",
  ],
  "apps/ops-console/src/operations-shell-seed.css": [
    ".ops-assurance-center",
    ".ops-assurance-heat-map",
    ".ops-assurance-cell",
    ".ops-assurance-triad",
    ".ops-assurance-pack-preview",
    "@media (prefers-reduced-motion: reduce)",
  ],
  "tests/playwright/454_ops_assurance_route.spec.js": [
    "assurance-center",
    "control-heat-map",
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
  packageJson.scripts?.["test:phase9:ops-assurance-route"] ===
    "pnpm exec tsx ./tools/test/run_phase9_ops_assurance_route.ts && pnpm exec vitest run tests/unit/454_ops_assurance_route.spec.ts tests/integration/454_ops_assurance_route_artifacts.spec.ts && node tests/playwright/454_ops_assurance_route.spec.js --run",
  "PACKAGE_SCRIPT_MISSING:test:phase9:ops-assurance-route",
);
assert(
  packageJson.scripts?.["validate:454-phase9-ops-assurance-route"] ===
    "pnpm exec tsx ./tools/analysis/validate_454_phase9_ops_assurance_route.ts",
  "PACKAGE_SCRIPT_MISSING:validate:454-phase9-ops-assurance-route",
);

const checklist = readText("prompt/checklist.md");
assert(/^- \[(?:-|X)\] par_454_/m.test(checklist), "CHECKLIST_TASK_454_NOT_CLAIMED_OR_COMPLETE");

const contract = readJson<{
  schemaVersion?: string;
  routes?: readonly string[];
  requiredSurfaces?: readonly string[];
  automationAnchors?: readonly string[];
  frameworkCodes?: readonly string[];
  assuranceAuthority?: {
    bindingState?: string;
    packState?: string;
    settlementResult?: string;
    controlCount?: number;
    artifactState?: string;
  };
  triadProof?: {
    normalFreshness?: string;
    normalTrust?: string;
    normalCompleteness?: string;
    staleGraph?: string;
    degradedTrust?: string;
    degradedGate?: string;
    quarantinedTrust?: string;
    quarantinedGate?: string;
    blockedGraph?: string;
    deniedScopeSettlement?: string;
    pendingSettlement?: string;
  };
  packPreviewProof?: {
    packVersionHash?: string;
    evidenceSetHash?: string;
    continuitySetHash?: string;
    graphHash?: string;
    graphDecisionHash?: string;
    queryPlanHash?: string;
    renderTemplateHash?: string;
    redactionPolicyHash?: string;
    reproductionState?: string;
    artifactPresentationContractRef?: string;
    artifactTransferSettlementRef?: string;
    outboundNavigationGrantRef?: string;
  };
  noGapArtifactRequired?: boolean;
}>("data/contracts/454_phase9_ops_assurance_route_contract.json");
const fixture = readJson<ReturnType<typeof createOpsAssuranceFixture>>(
  "data/fixtures/454_phase9_ops_assurance_route_fixtures.json",
);
const recomputed = createOpsAssuranceFixture();

assert(contract.schemaVersion === OPS_ASSURANCE_SCHEMA_VERSION, "CONTRACT_SCHEMA_VERSION_DRIFT");
assert(fixture.schemaVersion === OPS_ASSURANCE_SCHEMA_VERSION, "FIXTURE_SCHEMA_VERSION_DRIFT");
assert(contract.routes?.includes("/ops/assurance"), "ROUTE_MISSING:/ops/assurance");
for (const surface of [
  "AssuranceCenter",
  "FrameworkSelector",
  "ControlHeatMap",
  "ControlHeatTable",
  "EvidenceGapQueue",
  "CapaTracker",
  "PackPreview",
  "PackSettlement",
  "PackExportState",
]) {
  assert(contract.requiredSurfaces?.includes(surface), `REQUIRED_SURFACE_MISSING:${surface}`);
}
for (const anchor of [
  "assurance-center",
  "framework-selector",
  "control-heat-map",
  "control-heat-table",
  "evidence-gap-queue",
  "capa-tracker",
  "pack-preview",
  "pack-settlement",
  "pack-export-state",
]) {
  assert(contract.automationAnchors?.includes(anchor), `AUTOMATION_ANCHOR_MISSING:${anchor}`);
}
for (const frameworkCode of [
  "DSPT",
  "DTAC",
  "DCB0129",
  "DCB0160",
  "NHS_APP_CHANNEL",
  "IM1_CHANGE",
]) {
  assert(contract.frameworkCodes?.includes(frameworkCode), `FRAMEWORK_MISSING:${frameworkCode}`);
}
assert(contract.assuranceAuthority?.bindingState === "live", "NORMAL_BINDING_NOT_LIVE");
assert(contract.assuranceAuthority?.packState === "export_ready", "NORMAL_PACK_NOT_EXPORT_READY");
assert(
  contract.assuranceAuthority?.settlementResult === "export_ready",
  "NORMAL_SETTLEMENT_NOT_EXPORT_READY",
);
assert(contract.assuranceAuthority?.controlCount === 6, "CONTROL_COUNT_DRIFT");
assert(
  contract.assuranceAuthority?.artifactState === "external_handoff_ready",
  "NORMAL_ARTIFACT_NOT_READY",
);
assert(contract.triadProof?.normalFreshness === "current", "NORMAL_FRESHNESS_NOT_CURRENT");
assert(contract.triadProof?.normalTrust === "trusted", "NORMAL_TRUST_NOT_TRUSTED");
assert(contract.triadProof?.normalCompleteness === "complete", "NORMAL_COMPLETENESS_NOT_COMPLETE");
assert(contract.triadProof?.staleGraph === "stale", "STALE_GRAPH_NOT_STALE");
assert(contract.triadProof?.degradedTrust === "degraded", "DEGRADED_TRUST_NOT_VISIBLE");
assert(contract.triadProof?.degradedGate === "attestation_required", "DEGRADED_GATE_NOT_REQUIRED");
assert(contract.triadProof?.quarantinedTrust === "quarantined", "QUARANTINE_TRUST_NOT_VISIBLE");
assert(
  contract.triadProof?.quarantinedGate === "blocked_quarantined",
  "QUARANTINE_GATE_NOT_BLOCKED",
);
assert(contract.triadProof?.blockedGraph === "blocked", "BLOCKED_GRAPH_NOT_BLOCKED");
assert(contract.triadProof?.deniedScopeSettlement === "denied_scope", "DENIED_SCOPE_NOT_VISIBLE");
assert(
  contract.triadProof?.pendingSettlement === "pending_attestation",
  "PENDING_ATTESTATION_NOT_VISIBLE",
);
assert(
  Boolean(contract.packPreviewProof?.packVersionHash) &&
    Boolean(contract.packPreviewProof?.evidenceSetHash) &&
    Boolean(contract.packPreviewProof?.continuitySetHash) &&
    Boolean(contract.packPreviewProof?.graphHash) &&
    Boolean(contract.packPreviewProof?.graphDecisionHash) &&
    Boolean(contract.packPreviewProof?.queryPlanHash) &&
    Boolean(contract.packPreviewProof?.renderTemplateHash) &&
    Boolean(contract.packPreviewProof?.redactionPolicyHash),
  "PACK_HASH_METADATA_MISSING",
);
assert(contract.packPreviewProof?.reproductionState === "exact", "NORMAL_REPRODUCTION_NOT_EXACT");
assert(
  Boolean(contract.packPreviewProof?.artifactPresentationContractRef) &&
    Boolean(contract.packPreviewProof?.artifactTransferSettlementRef) &&
    Boolean(contract.packPreviewProof?.outboundNavigationGrantRef),
  "ARTIFACT_HANDOFF_REFS_MISSING",
);
assert(
  fixture.scenarioProjections.normal.boardStateDigestRef ===
    recomputed.scenarioProjections.normal.boardStateDigestRef,
  "FIXTURE_DIGEST_DRIFT",
);
assert(contract.noGapArtifactRequired === true, "UNEXPECTED_GAP_ARTIFACT_REQUIRED");

for (const existingContract of [
  "data/contracts/440_phase9_assurance_pack_factory_contract.json",
  "data/contracts/441_phase9_capa_attestation_workflow_contract.json",
  "data/contracts/446_phase9_projection_rebuild_quarantine_contract.json",
]) {
  assert(
    fs.existsSync(path.join(root, existingContract)),
    `UPSTREAM_CONTRACT_MISSING:${existingContract}`,
  );
}

const gapPath = path.join(
  root,
  "data/contracts/PHASE9_BATCH_443_457_INTERFACE_GAP_454_PACK_SETTLEMENT_INPUTS.json",
);
assert(!fs.existsSync(gapPath), "UNEXPECTED_PACK_SETTLEMENT_GAP_ARTIFACT");

console.log("Task 454 ops assurance route validation passed.");
