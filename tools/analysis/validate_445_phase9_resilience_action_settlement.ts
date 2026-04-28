import fs from "node:fs";
import path from "node:path";
import {
  PHASE9_OPERATIONAL_READINESS_POSTURE_VERSION,
  PHASE9_RESILIENCE_ACTION_SETTLEMENT_VERSION,
  createPhase9ResilienceActionSettlementFixture,
  type Phase9ResilienceActionSettlementFixture,
} from "../../packages/domains/analytics_assurance/src/index.ts";

const root = process.cwd();

const requiredFiles = [
  "packages/domains/analytics_assurance/src/phase9-resilience-action-settlement.ts",
  "data/contracts/445_phase9_resilience_action_settlement_contract.json",
  "data/fixtures/445_phase9_resilience_action_settlement_fixtures.json",
  "data/analysis/445_phase9_resilience_action_settlement_summary.md",
  "data/analysis/445_algorithm_alignment_notes.md",
  "data/analysis/445_settlement_result_matrix.csv",
  "data/analysis/445_recovery_evidence_artifact_catalog.csv",
  "tools/test/run_phase9_resilience_action_settlement.ts",
  "tools/analysis/validate_445_phase9_resilience_action_settlement.ts",
  "tests/unit/445_resilience_action_settlement.spec.ts",
  "tests/integration/445_resilience_action_settlement_artifacts.spec.ts",
];

const requiredTestTokens = [
  "clean-environment restore execution state machine",
  "dependency-order validation blocking restore success",
  "required journey proof blocking restore success",
  "failover scenario scope and tuple enforcement",
  "failover activation and stand-down settlement",
  "chaos blast-radius and guardrail enforcement",
  "stale readiness/posture/publication/trust/freeze blocking every action type",
  "settlement result drives visible/actionable state",
  "evidence artifact hash determinism",
  "recovery evidence graph writeback",
  "old restore/failover/chaos runs no longer satisfying current posture after tuple drift",
  "duplicate command/idempotency safety",
  "authorization and tenant isolation",
  "raw object-store link prevention for recovery artifacts",
];

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

const packageJson = readJson<{ scripts?: Record<string, string> }>("package.json");
assert(
  packageJson.scripts?.["test:phase9:resilience-action-settlement"] ===
    "pnpm exec tsx ./tools/test/run_phase9_resilience_action_settlement.ts && pnpm exec vitest run tests/unit/445_resilience_action_settlement.spec.ts tests/integration/445_resilience_action_settlement_artifacts.spec.ts",
  "PACKAGE_SCRIPT_MISSING:test:phase9:resilience-action-settlement",
);
assert(
  packageJson.scripts?.["validate:445-phase9-resilience-action-settlement"] ===
    "pnpm exec tsx ./tools/analysis/validate_445_phase9_resilience_action_settlement.ts",
  "PACKAGE_SCRIPT_MISSING:validate:445-phase9-resilience-action-settlement",
);

const checklist = readText("prompt/checklist.md");
assert(/^- \[(?:-|X)\] par_445_/m.test(checklist), "CHECKLIST_TASK_445_NOT_CLAIMED_OR_COMPLETE");

for (const [relativePath, version] of [
  [
    "data/contracts/444_phase9_operational_readiness_posture_contract.json",
    PHASE9_OPERATIONAL_READINESS_POSTURE_VERSION,
  ],
  [
    "data/contracts/443_phase9_disposition_execution_engine_contract.json",
    "443.phase9.disposition-execution-engine.v1",
  ],
] as const) {
  assert(fs.existsSync(path.join(root, relativePath)), `UPSTREAM_ARTIFACT_MISSING:${relativePath}`);
  assert(
    readJson<{ schemaVersion?: string }>(relativePath).schemaVersion === version,
    `UPSTREAM_VERSION_DRIFT:${relativePath}`,
  );
}

const contract = readJson<{
  schemaVersion?: string;
  upstreamReadinessSchemaVersion?: string;
  sourceAlgorithmRefs?: readonly string[];
  producedObjects?: readonly string[];
  apiSurface?: readonly string[];
  settlementAuthority?: Record<string, string | boolean>;
  recoveryEvidenceWriteback?: {
    ledgerEntryHash?: string;
    ledgerEntryType?: string;
    replayDecisionClass?: string;
    graphEdgeRefs?: readonly string[];
    writebackHash?: string;
  };
  deterministicReplay?: Record<string, string | undefined>;
  noGapArtifactRequired?: boolean;
}>("data/contracts/445_phase9_resilience_action_settlement_contract.json");

assert(
  contract.schemaVersion === PHASE9_RESILIENCE_ACTION_SETTLEMENT_VERSION,
  "CONTRACT_SCHEMA_VERSION_DRIFT",
);
assert(
  contract.upstreamReadinessSchemaVersion === PHASE9_OPERATIONAL_READINESS_POSTURE_VERSION,
  "UPSTREAM_READINESS_SCHEMA_VERSION_DRIFT",
);
for (const sourceRef of [
  "#9F",
  "#9A",
  "#9D",
  "CommandActionRecord",
  "CommandSettlementRecord",
  "ArtifactPresentationContract",
  "444_phase9_operational_readiness",
]) {
  assert(
    contract.sourceAlgorithmRefs?.some((candidate) => candidate.includes(sourceRef)),
    `SOURCE_REF_MISSING:${sourceRef}`,
  );
}
for (const objectName of [
  "RestoreRun",
  "FailoverScenario",
  "FailoverRun",
  "ChaosExperiment",
  "ChaosRun",
  "RecoveryEvidencePack",
  "ResilienceSurfaceRuntimeBinding",
  "ResilienceActionRecord",
  "ResilienceActionSettlement",
  "RecoveryEvidenceArtifact",
  "RecoveryEvidenceGraphWriteback",
]) {
  assert(contract.producedObjects?.includes(objectName), `PRODUCED_OBJECT_MISSING:${objectName}`);
}
for (const methodName of [
  "approveFailoverScenario",
  "approveChaosExperiment",
  "prepareRestore",
  "startRestore",
  "validateRestore",
  "activateFailover",
  "validateFailover",
  "standDownFailover",
  "scheduleChaos",
  "startChaos",
  "abortChaos",
  "attestRecoveryPack",
  "getLatestRunAndSettlementState",
  "getRecoveryEvidenceArtifacts",
  "explainSettlementBlocker",
  "writeRecoveryEvidenceGraph",
]) {
  assert(contract.apiSurface?.includes(methodName), `API_SURFACE_MISSING:${methodName}`);
}
assert(contract.settlementAuthority?.restoreResult === "succeeded", "RESTORE_NOT_SETTLED");
assert(
  contract.settlementAuthority?.failoverStandDownResult === "stood_down",
  "FAILOVER_STAND_DOWN_NOT_SETTLED",
);
assert(
  contract.settlementAuthority?.chaosGuardrailResult === "blocked_guardrail",
  "CHAOS_GUARDRAIL_NOT_BLOCKED",
);
assert(contract.settlementAuthority?.duplicateIdempotencyStable === true, "IDEMPOTENCY_NOT_STABLE");
assert(
  contract.recoveryEvidenceWriteback?.ledgerEntryType === "evidence_materialization",
  "LEDGER_ENTRY_TYPE_INVALID",
);
assert(
  contract.recoveryEvidenceWriteback?.replayDecisionClass === "exact_replay",
  "LEDGER_REPLAY_CLASS_INVALID",
);
assert(
  contract.recoveryEvidenceWriteback?.ledgerEntryHash?.match(/^[a-f0-9]{64}$/),
  "LEDGER_ENTRY_HASH_INVALID",
);
assert(
  (contract.recoveryEvidenceWriteback?.graphEdgeRefs?.length ?? 0) >= 3,
  "GRAPH_WRITEBACK_EDGES_MISSING",
);
assert(
  contract.deterministicReplay?.deterministicArtifactHash ===
    contract.deterministicReplay?.deterministicArtifactReplayHash,
  "ARTIFACT_REPLAY_HASH_DRIFT",
);
assert(contract.noGapArtifactRequired === true, "GAP_ARTIFACT_POSTURE_MISSING");

const fixture = readJson<Phase9ResilienceActionSettlementFixture>(
  "data/fixtures/445_phase9_resilience_action_settlement_fixtures.json",
);
const recomputed = createPhase9ResilienceActionSettlementFixture();
assert(fixture.replayHash === recomputed.replayHash, "REPLAY_HASH_DRIFT");
assert(fixture.surfaceBindingLive.bindingState === "live", "LIVE_BINDING_NOT_LIVE");
assert(
  fixture.surfaceBindingDiagnostic.bindingState !== "live",
  "DIAGNOSTIC_BINDING_NOT_DOWNGRADED",
);
assert(fixture.restoreStartedRun.targetEnvironmentRef.includes("clean-env"), "RESTORE_NOT_CLEAN");
assert(fixture.restoreValidatedRun.resultState === "succeeded", "RESTORE_RUN_NOT_SUCCEEDED");
assert(
  fixture.dependencyBlockedRestoreRun.dependencyValidationState === "blocked",
  "DEPENDENCY_BLOCK_NOT_RECORDED",
);
assert(
  fixture.missingJourneyProofRestoreRun.resultState === "journey_validation_pending",
  "JOURNEY_PROOF_BLOCK_NOT_RECORDED",
);
assert(
  fixture.staleFailoverSettlement.result === "stale_scope",
  "FAILOVER_STALE_SCOPE_NOT_BLOCKED",
);
assert(fixture.failoverStoodDownRun.resultState === "stood_down", "FAILOVER_NOT_STOOD_DOWN");
assert(
  fixture.chaosGuardrailBlockedSettlement.result === "blocked_guardrail",
  "CHAOS_GUARDRAIL_FIXTURE_INVALID",
);
assert(
  fixture.blockedEveryActionTypeSettlements.some(
    (settlement) => settlement.result === "blocked_publication",
  ),
  "PUBLICATION_BLOCK_MISSING",
);
assert(
  fixture.blockedEveryActionTypeSettlements.some(
    (settlement) => settlement.result === "blocked_trust",
  ),
  "TRUST_BLOCK_MISSING",
);
assert(
  fixture.blockedEveryActionTypeSettlements.some((settlement) => settlement.result === "frozen"),
  "FREEZE_BLOCK_MISSING",
);
assert(
  fixture.latestSettlementState.visibleActionableState === "blocked",
  "VISIBLE_STATE_NOT_SETTLEMENT_DRIVEN",
);
assert(
  fixture.recoveryEvidenceGraphWriteback.assuranceLedgerEntry.hash.match(/^[a-f0-9]{64}$/),
  "WRITEBACK_LEDGER_HASH_INVALID",
);
assert(
  fixture.tupleDriftSettlement.result === "stale_scope",
  "OLD_RUNS_NOT_INVALIDATED_BY_TUPLE_DRIFT",
);
assert(
  fixture.duplicateIdempotencySettlement.resilienceActionSettlementId ===
    fixture.duplicateIdempotencyReplaySettlement.resilienceActionSettlementId,
  "DUPLICATE_IDEMPOTENCY_NOT_SAFE",
);
assert(
  fixture.authorizationDeniedErrorCode === "RESILIENCE_ACTION_ROLE_DENIED",
  "AUTHORIZATION_DENIAL_MISSING",
);
assert(
  fixture.tenantDeniedErrorCode === "RESILIENCE_ACTION_SCOPE_TENANT_DENIED",
  "TENANT_DENIAL_MISSING",
);
assert(
  fixture.rawObjectStoreLinkDeniedErrorCode === "RECOVERY_EVIDENCE_RAW_OBJECT_LINK_DENIED",
  "RAW_OBJECT_STORE_LINK_DENIAL_MISSING",
);

const gapPath = "data/contracts/PHASE9_BATCH_443_457_INTERFACE_GAP_445_COMMAND_SETTLEMENT.json";
assert(!fs.existsSync(path.join(root, gapPath)), "UNEXPECTED_COMMAND_SETTLEMENT_GAP");

const sourceText = readText(
  "packages/domains/analytics_assurance/src/phase9-resilience-action-settlement.ts",
);
for (const token of [
  "RestoreRun",
  "FailoverScenario",
  "FailoverRun",
  "ChaosExperiment",
  "ChaosRun",
  "RecoveryEvidencePack",
  "ResilienceSurfaceRuntimeBinding",
  "ResilienceActionRecord",
  "ResilienceActionSettlement",
  "RecoveryEvidenceArtifact",
  "writeRecoveryEvidenceGraph",
  "RECOVERY_EVIDENCE_RAW_OBJECT_LINK_DENIED",
]) {
  assert(sourceText.includes(token), `SOURCE_TOKEN_MISSING:${token}`);
}

const testText = `${readText("tests/unit/445_resilience_action_settlement.spec.ts")}\n${readText(
  "tests/integration/445_resilience_action_settlement_artifacts.spec.ts",
)}`;
for (const token of requiredTestTokens) {
  assert(testText.includes(token), `TEST_TOKEN_MISSING:${token}`);
}
