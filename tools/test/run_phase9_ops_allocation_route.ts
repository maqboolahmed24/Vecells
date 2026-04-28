import fs from "node:fs";
import path from "node:path";
import { format, resolveConfig } from "prettier";
import {
  OPS_ALLOCATION_SCHEMA_VERSION,
  OPS_ALLOCATION_TASK_ID,
  createOpsAllocationFixture,
} from "../../apps/ops-console/src/operations-allocation-phase9.model";

const root = process.cwd();
const contractsDir = path.join(root, "data", "contracts");
const fixturesDir = path.join(root, "data", "fixtures");
const analysisDir = path.join(root, "data", "analysis");

const contractPath = path.join(contractsDir, "451_phase9_ops_allocation_route_contract.json");
const fixturePath = path.join(fixturesDir, "451_phase9_ops_allocation_route_fixtures.json");
const notesPath = path.join(analysisDir, "451_ops_allocation_implementation_note.md");

const fixture = createOpsAllocationFixture();

async function formatJson(value: unknown, filePath: string): Promise<string> {
  const config = (await resolveConfig(filePath)) ?? {};
  return format(JSON.stringify(value, null, 2), { ...config, filepath: filePath });
}

const normalQueues = fixture.scenarioProjections.queues.normal;
const staleQueues = fixture.scenarioProjections.queues.stale;
const quarantinedQueues = fixture.scenarioProjections.queues.quarantined;
const blockedQueues = fixture.scenarioProjections.queues.blocked;
const permissionDeniedQueues = fixture.scenarioProjections.queues.permission_denied;
const settlementQueues = fixture.scenarioProjections.queues.settlement_pending;
const lowSampleCohort = normalQueues.cohortRows.find((row) => row.lowSample);
const lowSampleBottleneck = normalQueues.bottleneckLadder.find(
  (row) => row.anomalyRef === "ops-route-21",
);

const contractArtifact = {
  taskId: OPS_ALLOCATION_TASK_ID,
  schemaVersion: OPS_ALLOCATION_SCHEMA_VERSION,
  routes: fixture.routes,
  sourceAlgorithmRefs: fixture.sourceAlgorithmRefs,
  upstreamSchemaVersions: fixture.upstreamSchemaVersions,
  requiredSurfaces: [
    "OperationsConsoleShell",
    "BottleneckRadar",
    "CapacityAllocator",
    "CohortImpactMatrix",
    "InterventionWorkbench",
  ],
  automationAnchors: fixture.automationAnchors,
  scenarioStates: Object.keys(fixture.scenarioProjections.queues),
  shellContinuityContract: {
    shellContinuityKey: normalQueues.shellContinuityKey,
    boardStateDigestRef: normalQueues.boardStateDigestRef,
    boardTupleHash: normalQueues.boardTupleHash,
    boardScopeRef: normalQueues.boardScopeRef,
    timeHorizon: normalQueues.timeHorizon,
    scopePolicyRef: normalQueues.scopePolicyRef,
  },
  actionEligibilityProof: {
    normal: normalQueues.actionEligibilityFence.eligibilityState,
    stale: staleQueues.actionEligibilityFence.eligibilityState,
    quarantined: quarantinedQueues.actionEligibilityFence.eligibilityState,
    blocked: blockedQueues.actionEligibilityFence.eligibilityState,
    permissionDenied: permissionDeniedQueues.actionEligibilityFence.eligibilityState,
    settlementPending: {
      eligibility: settlementQueues.actionEligibilityFence.eligibilityState,
      settlementStatus: settlementQueues.candidateLease.settlementStatus,
    },
  },
  parityProof: {
    bottleneckRows: normalQueues.bottleneckLadder.length,
    capacityRows: normalQueues.capacityRows.length,
    cohortRows: normalQueues.cohortRows.length,
    tableFallbacksRequired: true,
    lowSamplePromotionBlocked:
      lowSampleCohort?.promotionState === "context_only" && lowSampleBottleneck?.rank !== 1,
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
    "# Task 451 Operations Allocation Implementation Note",
    "",
    "`/ops/queues` and `/ops/capacity` now share a deterministic task-451 projection adapter for BottleneckRadar, CapacityAllocator, CohortImpactMatrix, and InterventionWorkbench.",
    "",
    "BottleneckRadar renders a ranked ladder instead of a dense chart: rank, affected scope, consequence, leverage, persistence, trust, guardrail drag, trend, and the ranking reason all have visual and table parity.",
    "",
    "CapacityAllocator starts from the selected bottleneck and shows current capacity, proposed delta, breach impact, dependency constraints, confidence interval, calibration age, owner, and proposal state in compact bars plus table fallback.",
    "",
    "CohortImpactMatrix is sample-gated. Low-sample cohorts remain context-only and cannot become dominant even when the point estimate is high.",
    "",
    "InterventionWorkbench is driven by `InterventionCandidateLease` and `OpsActionEligibilityFence`. Executable, observe-only, stale-reacquire, read-only-recovery, handoff-required, blocked, and settlement-pending postures are explicit, with governance handoff preserved by the existing return-token shell.",
    "",
    "Playwright evidence is written to `.artifacts/operations-allocation-451` for queues/capacity routes, normal, empty, stale, degraded, quarantined, blocked, permission-denied, settlement-pending, reduced-motion, desktop, laptop, tablet, and narrow mission-stack states.",
    "",
  ].join("\n"),
);

console.log(`Phase 9 ops allocation contract: ${path.relative(root, contractPath)}`);
console.log(`Phase 9 ops allocation fixture: ${path.relative(root, fixturePath)}`);
