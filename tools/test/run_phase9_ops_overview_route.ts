import fs from "node:fs";
import path from "node:path";
import { format, resolveConfig } from "prettier";
import {
  OPS_OVERVIEW_SCHEMA_VERSION,
  OPS_OVERVIEW_TASK_ID,
  createOpsOverviewFixture,
} from "../../apps/ops-console/src/operations-overview-phase9.model";

const root = process.cwd();
const contractsDir = path.join(root, "data", "contracts");
const fixturesDir = path.join(root, "data", "fixtures");
const analysisDir = path.join(root, "data", "analysis");

const contractPath = path.join(contractsDir, "450_phase9_ops_overview_route_contract.json");
const fixturePath = path.join(fixturesDir, "450_phase9_ops_overview_route_fixtures.json");
const notesPath = path.join(analysisDir, "450_ops_overview_implementation_note.md");

const fixture = createOpsOverviewFixture();

async function formatJson(value: unknown, filePath: string): Promise<string> {
  const config = (await resolveConfig(filePath)) ?? {};
  return format(JSON.stringify(value, null, 2), { ...config, filepath: filePath });
}

const contractArtifact = {
  taskId: OPS_OVERVIEW_TASK_ID,
  schemaVersion: OPS_OVERVIEW_SCHEMA_VERSION,
  route: fixture.route,
  sourceAlgorithmRefs: fixture.sourceAlgorithmRefs,
  upstreamSchemaVersions: fixture.upstreamSchemaVersions,
  requiredSurfaces: [
    "OperationsConsoleShell",
    "NorthStarBand",
    "ServiceHealthGrid",
    "OpsStableServiceDigest",
    "ops-freshness-strip",
    "ops-return-token-target",
  ],
  automationAnchors: fixture.automationAnchors,
  scenarioStates: Object.keys(fixture.scenarioProjections),
  shellContinuityContract: {
    shellContinuityKey: fixture.scenarioProjections.normal.shellContinuityKey,
    boardStateDigestRef: fixture.scenarioProjections.normal.boardStateDigestRef,
    boardTupleHash: fixture.scenarioProjections.normal.boardTupleHash,
    boardScopeRef: fixture.scenarioProjections.normal.boardScopeRef,
    timeHorizon: fixture.scenarioProjections.normal.timeHorizon,
    scopePolicyRef: fixture.scenarioProjections.normal.scopePolicyRef,
  },
  failClosedStates: {
    stale: fixture.scenarioProjections.stale.freshnessStrip.publicationState,
    quarantined: fixture.scenarioProjections.quarantined.freshnessStrip.trustState,
    blocked: fixture.scenarioProjections.blocked.freshnessStrip.publicationState,
    permissionDenied: fixture.scenarioProjections.permission_denied.freshnessStrip.publicationState,
    freeze: fixture.scenarioProjections.freeze.freshnessStrip.freezeState,
    settlementPending:
      fixture.scenarioProjections.settlement_pending.freshnessStrip.liveControlState,
  },
  parityProof: {
    northStarMetricCount: fixture.scenarioProjections.normal.northStarBand.length,
    serviceHealthCellCount: fixture.scenarioProjections.normal.serviceHealth.length,
    tableFallbacksRequired: true,
  },
  noGapArtifactRequired: true,
};

fs.mkdirSync(contractsDir, { recursive: true });
fs.mkdirSync(fixturesDir, { recursive: true });
fs.mkdirSync(analysisDir, { recursive: true });

fs.writeFileSync(contractPath, await formatJson(contractArtifact, contractPath));
fs.writeFileSync(fixturePath, await formatJson(fixture, fixturePath));
fs.writeFileSync(
  notesPath,
  [
    "# Task 450 Operations Overview Implementation Note",
    "",
    "The `/ops/overview` frontend now consumes a deterministic task-450 projection adapter for NorthStarBand, ServiceHealthGrid, freshness/trust/freeze strip, stable service digest, and return-token continuity state.",
    "",
    "The visual hierarchy keeps NorthStarBand as compact operational vitals, ServiceHealthGrid as the primary essential-function map, BottleneckRadar as the promoted anomaly field, and the right rail as selected-service detail plus a return-safe drill affordance. Stable-service posture renders one OpsStableServiceDigest instead of a wall of healthy charts.",
    "",
    "Fail-closed states preserve the same OperationsConsoleShell. Stale, degraded, quarantined, blocked, permission-denied, freeze, and settlement-pending scenarios keep the last stable context visible while downgrading affected controls to observe-only, read-only, diagnostic, blocked, or governance-only posture.",
    "",
    "The route publishes semantic automation anchors for `ops-overview`, `north-star-band`, `service-health-grid`, `ops-freshness-strip`, `ops-stable-service-digest`, `ops-health-cell`, and `ops-return-token-target`.",
    "",
    "Playwright evidence is written to `.artifacts/operations-overview-450` for normal, stable service, stale, degraded, quarantined, blocked, permission-denied, freeze, settlement-pending, reduced-motion, desktop, laptop, tablet, and narrow states.",
    "",
  ].join("\n"),
);

console.log(`Phase 9 ops overview contract: ${path.relative(root, contractPath)}`);
console.log(`Phase 9 ops overview fixture: ${path.relative(root, fixturePath)}`);
