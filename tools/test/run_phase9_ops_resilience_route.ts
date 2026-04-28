import fs from "node:fs";
import path from "node:path";
import { format, resolveConfig } from "prettier";
import {
  OPS_RESILIENCE_SCHEMA_VERSION,
  OPS_RESILIENCE_TASK_ID,
  createOpsResilienceFixture,
} from "../../apps/ops-console/src/operations-resilience-phase9.model";

const root = process.cwd();
const contractsDir = path.join(root, "data", "contracts");
const fixturesDir = path.join(root, "data", "fixtures");
const analysisDir = path.join(root, "data", "analysis");

const contractPath = path.join(contractsDir, "453_phase9_ops_resilience_route_contract.json");
const fixturePath = path.join(fixturesDir, "453_phase9_ops_resilience_route_fixtures.json");
const notesPath = path.join(analysisDir, "453_ops_resilience_implementation_note.md");

const fixture = createOpsResilienceFixture();

async function formatJson(value: unknown, filePath: string): Promise<string> {
  const config = (await resolveConfig(filePath)) ?? {};
  return format(JSON.stringify(value, null, 2), { ...config, filepath: filePath });
}

const normal = fixture.scenarioProjections.normal;
const stale = fixture.scenarioProjections.stale;
const degraded = fixture.scenarioProjections.degraded;
const freeze = fixture.scenarioProjections.freeze;
const blocked = fixture.scenarioProjections.blocked;
const permissionDenied = fixture.scenarioProjections.permission_denied;
const settlementPending = fixture.scenarioProjections.settlement_pending;

const contractArtifact = {
  taskId: OPS_RESILIENCE_TASK_ID,
  schemaVersion: OPS_RESILIENCE_SCHEMA_VERSION,
  routes: fixture.routes,
  sourceAlgorithmRefs: fixture.sourceAlgorithmRefs,
  upstreamSchemaVersions: fixture.upstreamSchemaVersions,
  requiredSurfaces: [
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
  ],
  automationAnchors: fixture.automationAnchors,
  scenarioStates: Object.keys(fixture.scenarioProjections),
  resilienceAuthority: {
    resilienceTupleHash: normal.resilienceTupleHash,
    operationalReadinessSnapshotRef: normal.readinessSnapshot.operationalReadinessSnapshotRef,
    recoveryControlPostureRef: normal.recoveryControlPosture.recoveryControlPostureRef,
    bindingState: normal.runtimeBinding.bindingState,
    controlState: normal.recoveryControlPosture.postureState,
    latestSettlementResult: normal.latestSettlement.result,
    essentialFunctionCount: normal.essentialFunctions.length,
    dependencyBandCount: normal.dependencyRestoreBands.length,
    actionRailCount: normal.actionRail.length,
  },
  downgradeProof: {
    staleBindingState: stale.runtimeBinding.bindingState,
    staleRunbookState: stale.runbookBindings[0]?.bindingState,
    degradedTrustState: degraded.recoveryControlPosture.trustState,
    degradedControlState: degraded.recoveryControlPosture.postureState,
    freezeControlState: freeze.recoveryControlPosture.postureState,
    freezeState: freeze.recoveryControlPosture.freezeState,
    blockedBackupState: blocked.backupFreshness.manifestState,
    blockedReadinessState: blocked.readinessSnapshot.readinessState,
    permissionDeniedBindingState: permissionDenied.runtimeBinding.bindingState,
    permissionDeniedSettlementResult: permissionDenied.latestSettlement.result,
    settlementPendingResult: settlementPending.latestSettlement.result,
  },
  artifactProof: {
    normalArtifactState: normal.artifactStage.artifactState,
    staleArtifactState: stale.artifactStage.artifactState,
    permissionDeniedArtifactState: permissionDenied.artifactStage.artifactState,
    artifactPresentationContractRef: normal.artifactStage.artifactPresentationContractRef,
    artifactTransferSettlementRef: normal.artifactStage.artifactTransferSettlementRef,
    artifactFallbackDispositionRef: normal.artifactStage.artifactFallbackDispositionRef,
    outboundNavigationGrantRef: normal.artifactStage.outboundNavigationGrantRef,
  },
  timelineProof: {
    normalTimelineState: normal.runTimeline.timelineState,
    normalRunAuthority: normal.recoveryRunEvents[0]?.currentAuthority,
    staleTimelineState: stale.runTimeline.timelineState,
    staleRunAuthority: stale.recoveryRunEvents[0]?.currentAuthority,
    runEventCount: normal.recoveryRunEvents.length,
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
    "# Task 453 Operations Resilience Implementation Note",
    "",
    "`/ops/resilience` now renders a same-shell `ResilienceBoard` with an essential function map, topological dependency restore bands, backup freshness, runbook binding state, operational readiness snapshot, recovery control posture, and recovery evidence artifact stage.",
    "",
    "The board treats restore, failover, chaos, and recovery pack actions as settlement-bound controls. Button acknowledgement never changes recovery authority; authority comes from `RecoveryControlPosture` and `ResilienceActionSettlement` projection state.",
    "",
    "Stale tuples, degraded trust, active freeze state, missing backup manifests, withdrawn runbooks, and permission-denied publication all fail closed while preserving diagnostic visibility for dependency order, historical run evidence, and proof debt.",
    "",
    "Task 453 reuses the existing task 443 disposition execution engine, task 444 operational readiness posture, and task 445 resilience action settlement contracts, so no interface gap artifact is required.",
    "",
    "Playwright evidence is written to `.artifacts/operations-resilience-453` for normal, empty, stale, degraded, quarantined, blocked, permission-denied, settlement-pending, freeze, selected function, keyboard action, reduced-motion, desktop, laptop, tablet, and narrow mission-stack states.",
    "",
  ].join("\n"),
);

console.log(`Phase 9 ops resilience contract: ${path.relative(root, contractPath)}`);
console.log(`Phase 9 ops resilience fixture: ${path.relative(root, fixturePath)}`);
