import fs from "node:fs";
import path from "node:path";
import {
  PHASE9_ASSURANCE_INGEST_SERVICE_VERSION,
  PHASE9_ESSENTIAL_FUNCTION_METRICS_VERSION,
  PHASE9_GRAPH_VERDICT_ENGINE_VERSION,
  PHASE9_OPERATIONAL_PROJECTION_ENGINE_VERSION,
  PHASE9_PROJECTION_REBUILD_QUARANTINE_VERSION,
  PHASE9_RESILIENCE_ACTION_SETTLEMENT_VERSION,
  createPhase9ProjectionRebuildQuarantineFixture,
  type Phase9ProjectionRebuildQuarantineFixture,
} from "../../packages/domains/analytics_assurance/src/index.ts";

const root = process.cwd();

const requiredFiles = [
  "packages/domains/analytics_assurance/src/phase9-projection-rebuild-quarantine.ts",
  "data/contracts/446_phase9_projection_rebuild_quarantine_contract.json",
  "data/fixtures/446_phase9_projection_rebuild_quarantine_fixtures.json",
  "data/analysis/446_phase9_projection_rebuild_quarantine_summary.md",
  "data/analysis/446_algorithm_alignment_notes.md",
  "data/analysis/446_projection_rebuild_quarantine_matrix.csv",
  "data/analysis/446_quarantine_impact_register.csv",
  "tools/test/run_phase9_projection_rebuild_quarantine.ts",
  "tools/analysis/validate_446_phase9_projection_rebuild_quarantine.ts",
  "tests/unit/446_projection_rebuild_quarantine.spec.ts",
  "tests/integration/446_projection_rebuild_quarantine_artifacts.spec.ts",
];

const requiredTestTokens = [
  "deterministic rebuild from raw events",
  "rebuild hash equality and inequality",
  "command-following exact replay requirement",
  "out-of-order event quarantine",
  "conflicting duplicate quarantine and exact duplicate idempotency",
  "incompatible schema quarantine",
  "unknown mandatory namespace quarantine",
  "slice-bounded quarantine that preserves unaffected slices",
  "trust hysteresis thresholds",
  "hard block immediate quarantine",
  "control status cannot be satisfied on quarantined required evidence",
  "operations slice actionability downgrade",
  "degraded-slice pack attestation gate",
  "quarantine release with replay equality",
  "tenant isolation and authorization",
  "audit/assurance-ledger writeback for quarantine and release",
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
  packageJson.scripts?.["test:phase9:projection-rebuild-quarantine"] ===
    "pnpm exec tsx ./tools/test/run_phase9_projection_rebuild_quarantine.ts && pnpm exec vitest run tests/unit/446_projection_rebuild_quarantine.spec.ts tests/integration/446_projection_rebuild_quarantine_artifacts.spec.ts",
  "PACKAGE_SCRIPT_MISSING:test:phase9:projection-rebuild-quarantine",
);
assert(
  packageJson.scripts?.["validate:446-phase9-projection-rebuild-quarantine"] ===
    "pnpm exec tsx ./tools/analysis/validate_446_phase9_projection_rebuild_quarantine.ts",
  "PACKAGE_SCRIPT_MISSING:validate:446-phase9-projection-rebuild-quarantine",
);

const checklist = readText("prompt/checklist.md");
assert(/^- \[(?:-|X)\] par_446_/m.test(checklist), "CHECKLIST_TASK_446_NOT_CLAIMED_OR_COMPLETE");

for (const [relativePath, version] of [
  [
    "data/contracts/435_phase9_assurance_ingest_service_contract.json",
    PHASE9_ASSURANCE_INGEST_SERVICE_VERSION,
  ],
  [
    "data/contracts/436_phase9_graph_verdict_engine_contract.json",
    PHASE9_GRAPH_VERDICT_ENGINE_VERSION,
  ],
  [
    "data/contracts/437_phase9_operational_projection_engine_contract.json",
    PHASE9_OPERATIONAL_PROJECTION_ENGINE_VERSION,
  ],
  [
    "data/contracts/438_phase9_essential_function_metrics_contract.json",
    PHASE9_ESSENTIAL_FUNCTION_METRICS_VERSION,
  ],
  [
    "data/contracts/445_phase9_resilience_action_settlement_contract.json",
    PHASE9_RESILIENCE_ACTION_SETTLEMENT_VERSION,
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
  upstreamIngestSchemaVersion?: string;
  upstreamGraphVerdictSchemaVersion?: string;
  upstreamOperationalProjectionSchemaVersion?: string;
  upstreamMetricSchemaVersion?: string;
  upstreamResilienceSchemaVersion?: string;
  sourceAlgorithmRefs?: readonly string[];
  producedObjects?: readonly string[];
  apiSurface?: readonly string[];
  rebuildAuthority?: Record<string, string | boolean>;
  quarantineAuthority?: Record<string, string | undefined>;
  ledgerWriteback?: Record<string, string | undefined>;
  noGapArtifactRequired?: boolean;
}>("data/contracts/446_phase9_projection_rebuild_quarantine_contract.json");

assert(
  contract.schemaVersion === PHASE9_PROJECTION_REBUILD_QUARANTINE_VERSION,
  "CONTRACT_SCHEMA_VERSION_DRIFT",
);
assert(
  contract.upstreamIngestSchemaVersion === PHASE9_ASSURANCE_INGEST_SERVICE_VERSION,
  "UPSTREAM_INGEST_SCHEMA_VERSION_DRIFT",
);
assert(
  contract.upstreamGraphVerdictSchemaVersion === PHASE9_GRAPH_VERDICT_ENGINE_VERSION,
  "UPSTREAM_GRAPH_SCHEMA_VERSION_DRIFT",
);
assert(
  contract.upstreamOperationalProjectionSchemaVersion ===
    PHASE9_OPERATIONAL_PROJECTION_ENGINE_VERSION,
  "UPSTREAM_OPERATIONAL_SCHEMA_VERSION_DRIFT",
);
assert(
  contract.upstreamMetricSchemaVersion === PHASE9_ESSENTIAL_FUNCTION_METRICS_VERSION,
  "UPSTREAM_METRIC_SCHEMA_VERSION_DRIFT",
);
assert(
  contract.upstreamResilienceSchemaVersion === PHASE9_RESILIENCE_ACTION_SETTLEMENT_VERSION,
  "UPSTREAM_RESILIENCE_SCHEMA_VERSION_DRIFT",
);
for (const sourceRef of ["#9A", "#9B", "#9D", "#9F", "435_phase9", "436_phase9", "445_phase9"]) {
  assert(
    contract.sourceAlgorithmRefs?.some((candidate) => candidate.includes(sourceRef)),
    `SOURCE_REF_MISSING:${sourceRef}`,
  );
}
for (const objectName of [
  "ProjectionRebuildRun",
  "ProjectionHealthSnapshot",
  "AssuranceIngestCheckpoint",
  "AssuranceSliceTrustRecord",
  "ProducerNamespaceQuarantineRecord",
  "ControlStatusSnapshot",
  "OpsOverviewSliceEnvelope",
  "DegradedSliceAttestationGate",
  "QuarantineImpactExplanation",
  "ProjectionQuarantineLedgerWriteback",
]) {
  assert(contract.producedObjects?.includes(objectName), `PRODUCED_OBJECT_MISSING:${objectName}`);
}
for (const methodName of [
  "triggerProjectionRebuild",
  "getRebuildStatus",
  "compareSnapshotVsRebuild",
  "listQuarantinedProducerNamespaces",
  "explainSliceTrustBlockers",
  "placeProducerNamespaceQuarantine",
  "releaseProducerNamespaceQuarantine",
  "evaluateSliceTrustForScope",
  "listAffectedControlsPacksRetentionAndResilience",
  "writeQuarantineLedgerEvidence",
]) {
  assert(contract.apiSurface?.includes(methodName), `API_SURFACE_MISSING:${methodName}`);
}
assert(contract.rebuildAuthority?.deterministicRunState === "matched", "REBUILD_NOT_MATCHED");
assert(contract.rebuildAuthority?.divergentComparisonEqual === false, "REBUILD_DIVERGENCE_MISSING");
assert(contract.rebuildAuthority?.exactReplayFrozen === true, "EXACT_REPLAY_NOT_FROZEN");
assert(
  contract.quarantineAuthority?.conflictingDuplicate === "conflicting_duplicate",
  "CONFLICTING_DUPLICATE_NOT_QUARANTINED",
);
assert(
  contract.quarantineAuthority?.outOfOrder === "out_of_order_sequence",
  "OUT_OF_ORDER_NOT_QUARANTINED",
);
assert(
  contract.quarantineAuthority?.incompatibleSchema === "incompatible_schema",
  "INCOMPATIBLE_SCHEMA_NOT_QUARANTINED",
);
assert(
  contract.quarantineAuthority?.unknownNamespace === "unknown_mandatory_namespace",
  "UNKNOWN_NAMESPACE_NOT_QUARANTINED",
);
assert(contract.quarantineAuthority?.hardBlockedTrustState === "quarantined", "HARD_BLOCK_MISSING");
assert(
  contract.quarantineAuthority?.unaffectedTrustState === "trusted",
  "UNRELATED_SLICE_NOT_TRUSTED",
);
assert(contract.quarantineAuthority?.releasedQuarantineState === "released", "RELEASE_MISSING");
assert(
  contract.ledgerWriteback?.quarantineReplayClass === "exact_replay",
  "LEDGER_REPLAY_CLASS_INVALID",
);
assert(
  contract.ledgerWriteback?.quarantineLedgerHash?.match(/^[a-f0-9]{64}$/),
  "QUARANTINE_LEDGER_HASH_INVALID",
);
assert(
  contract.ledgerWriteback?.releaseLedgerHash?.match(/^[a-f0-9]{64}$/),
  "RELEASE_LEDGER_HASH_INVALID",
);
assert(contract.noGapArtifactRequired === true, "GAP_ARTIFACT_POSTURE_MISSING");

const fixture = readJson<Phase9ProjectionRebuildQuarantineFixture>(
  "data/fixtures/446_phase9_projection_rebuild_quarantine_fixtures.json",
);
const recomputed = createPhase9ProjectionRebuildQuarantineFixture();
assert(fixture.replayHash === recomputed.replayHash, "REPLAY_HASH_DRIFT");
assert(fixture.matchingComparison.equal === true, "MATCHING_COMPARISON_NOT_EQUAL");
assert(fixture.divergentComparison.equal === false, "DIVERGENT_COMPARISON_NOT_DIVERGED");
assert(fixture.commandFollowingRun.replayRequirement === "exact", "COMMAND_REPLAY_NOT_EXACT");
assert(fixture.commandFollowingRun.runState === "blocked", "COMMAND_REPLAY_NOT_BLOCKED");
assert(
  fixture.exactDuplicateDecision.decision === "idempotent_duplicate",
  "EXACT_DUPLICATE_NOT_IDEMPOTENT",
);
assert(
  fixture.conflictingDuplicateDecision.decision === "quarantined",
  "CONFLICTING_DUPLICATE_NOT_QUARANTINED",
);
assert(
  fixture.outOfOrderDecision.decision === "quarantined",
  "OUT_OF_ORDER_DECISION_NOT_QUARANTINED",
);
assert(
  fixture.incompatibleSchemaDecision.decision === "quarantined",
  "INCOMPATIBLE_SCHEMA_DECISION_NOT_QUARANTINED",
);
assert(
  fixture.unknownNamespaceDecision.decision === "quarantined",
  "UNKNOWN_NAMESPACE_DECISION_NOT_QUARANTINED",
);
assert(
  fixture.trustedSliceFirstEvaluation.trustState === "degraded",
  "FIRST_HYSTERESIS_SHOULD_NOT_TRUST",
);
assert(
  fixture.trustedSliceSecondEvaluation.trustState === "trusted",
  "SECOND_HYSTERESIS_SHOULD_TRUST",
);
assert(
  fixture.hardBlockedSliceEvaluation.trustState === "quarantined",
  "HARD_BLOCK_NOT_QUARANTINED",
);
assert(
  fixture.unaffectedSliceEvaluation.trustState === "trusted",
  "UNAFFECTED_SLICE_NOT_PRESERVED",
);
assert(fixture.quarantinedControlStatus.state !== "satisfied", "QUARANTINED_CONTROL_SATISFIED");
assert(
  fixture.downgradedOpsSliceEnvelope.actionEligibilityState === "blocked",
  "OPS_ACTION_NOT_DOWNGRADED",
);
assert(
  fixture.degradedSliceAttestationGate.gateState === "attestation_required",
  "DEGRADED_GATE_NOT_REQUIRED",
);
assert(
  fixture.releasedQuarantineRecord.quarantineState === "released",
  "QUARANTINE_RELEASE_NOT_RECORDED",
);
assert(
  fixture.tenantDeniedErrorCode === "PROJECTION_QUARANTINE_TENANT_DENIED",
  "TENANT_DENIAL_MISSING",
);
assert(
  fixture.authorizationDeniedErrorCode === "PROJECTION_QUARANTINE_ROLE_DENIED",
  "AUTH_DENIAL_MISSING",
);

const gapPath =
  "data/contracts/PHASE9_BATCH_443_457_INTERFACE_GAP_446_SLICE_QUARANTINE_CONTRACT.json";
assert(!fs.existsSync(path.join(root, gapPath)), "UNEXPECTED_SLICE_QUARANTINE_GAP");

const sourceText = readText(
  "packages/domains/analytics_assurance/src/phase9-projection-rebuild-quarantine.ts",
);
for (const token of [
  "ProjectionRebuildRun",
  "ProjectionHealthSnapshot",
  "AssuranceIngestCheckpoint",
  "AssuranceSliceTrustRecord",
  "ProducerNamespaceQuarantineRecord",
  "DegradedSliceAttestationGate",
  "writeQuarantineLedgerEvidence",
  "releaseProducerNamespaceQuarantine",
]) {
  assert(sourceText.includes(token), `SOURCE_TOKEN_MISSING:${token}`);
}

const testText = `${readText("tests/unit/446_projection_rebuild_quarantine.spec.ts")}\n${readText(
  "tests/integration/446_projection_rebuild_quarantine_artifacts.spec.ts",
)}`;
for (const token of requiredTestTokens) {
  assert(testText.includes(token), `TEST_TOKEN_MISSING:${token}`);
}
