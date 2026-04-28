import fs from "node:fs";
import path from "node:path";
import {
  PHASE9_CROSS_PHASE_CONFORMANCE_VERSION,
  createPhase9CrossPhaseConformanceFixture,
  type Phase9CrossPhaseConformanceFixture,
} from "../../packages/domains/analytics_assurance/src/index.ts";

const root = process.cwd();

const requiredFiles = [
  "packages/domains/analytics_assurance/src/phase9-cross-phase-conformance.ts",
  "data/contracts/449_phase9_cross_phase_conformance_contract.json",
  "data/fixtures/449_phase9_cross_phase_conformance_fixtures.json",
  "data/analysis/449_phase9_cross_phase_conformance_summary.md",
  "data/analysis/449_algorithm_alignment_notes.md",
  "data/analysis/449_phase_conformance_rows.csv",
  "data/analysis/449_bau_signoff_blockers.csv",
  "tools/test/run_phase9_cross_phase_conformance.ts",
  "tools/analysis/validate_449_phase9_cross_phase_conformance.ts",
  "tests/unit/449_cross_phase_conformance.spec.ts",
  "tests/integration/449_cross_phase_conformance_artifacts.spec.ts",
];

const requiredTestTokens = [
  "phase row exact/stale/blocked derivation",
  "summary contradiction blocking",
  "missing runtime publication blocking",
  "missing verification scenario blocking",
  "stale control status or slice trust blocking",
  "stale continuity evidence blocking",
  "missing governance/ops proof blocking",
  "scorecard hash determinism",
  "scorecard stale after proof drift",
  "BAU signoff blocked unless scorecard exact",
  "release-to-BAU blocked on stale/blocked scorecard",
  "on-call contact validation blocking",
  "runbook rehearsal freshness blocking",
  "exercise evidence linkage",
  "tenant isolation and authorization",
];

const upstreamContractPaths: Record<string, string> = {
  "432": "data/contracts/432_phase9_assurance_ledger_contracts.json",
  "433": "data/contracts/433_phase9_operational_projection_contracts.json",
  "434": "data/contracts/434_phase9_governance_control_contracts.json",
  "435": "data/contracts/435_phase9_assurance_ingest_service_contract.json",
  "436": "data/contracts/436_phase9_graph_verdict_engine_contract.json",
  "437": "data/contracts/437_phase9_operational_projection_engine_contract.json",
  "438": "data/contracts/438_phase9_essential_function_metrics_contract.json",
  "439": "data/contracts/439_phase9_investigation_timeline_service_contract.json",
  "440": "data/contracts/440_phase9_assurance_pack_factory_contract.json",
  "441": "data/contracts/441_phase9_capa_attestation_workflow_contract.json",
  "442": "data/contracts/442_phase9_retention_lifecycle_engine_contract.json",
  "443": "data/contracts/443_phase9_disposition_execution_engine_contract.json",
  "444": "data/contracts/444_phase9_operational_readiness_posture_contract.json",
  "445": "data/contracts/445_phase9_resilience_action_settlement_contract.json",
  "446": "data/contracts/446_phase9_projection_rebuild_quarantine_contract.json",
  "447": "data/contracts/447_phase9_incident_reportability_workflow_contract.json",
  "448": "data/contracts/448_phase9_tenant_config_governance_contract.json",
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

const packageJson = readJson<{ scripts?: Record<string, string> }>("package.json");
assert(
  packageJson.scripts?.["test:phase9:cross-phase-conformance"] ===
    "pnpm exec tsx ./tools/test/run_phase9_cross_phase_conformance.ts && pnpm exec vitest run tests/unit/449_cross_phase_conformance.spec.ts tests/integration/449_cross_phase_conformance_artifacts.spec.ts",
  "PACKAGE_SCRIPT_MISSING:test:phase9:cross-phase-conformance",
);
assert(
  packageJson.scripts?.["validate:449-phase9-cross-phase-conformance"] ===
    "pnpm exec tsx ./tools/analysis/validate_449_phase9_cross_phase_conformance.ts",
  "PACKAGE_SCRIPT_MISSING:validate:449-phase9-cross-phase-conformance",
);

const checklist = readText("prompt/checklist.md");
assert(/^- \[(?:-|X)\] par_449_/m.test(checklist), "CHECKLIST_TASK_449_NOT_CLAIMED_OR_COMPLETE");

const recomputed = createPhase9CrossPhaseConformanceFixture();
for (const [taskId, relativePath] of Object.entries(upstreamContractPaths)) {
  assert(fs.existsSync(path.join(root, relativePath)), `UPSTREAM_ARTIFACT_MISSING:${relativePath}`);
  assert(
    readJson<{ schemaVersion?: string }>(relativePath).schemaVersion ===
      recomputed.upstreamSchemaVersions[taskId],
    `UPSTREAM_VERSION_DRIFT:${relativePath}`,
  );
}

const contract = readJson<{
  schemaVersion?: string;
  upstreamSchemaVersions?: Record<string, string>;
  sourceAlgorithmRefs?: readonly string[];
  producedObjects?: readonly string[];
  apiSurface?: readonly string[];
  conformanceAuthority?: {
    exactScorecardState?: string;
    staleScorecardState?: string;
    blockedScorecardState?: string;
    summaryContradictionState?: string;
    missingRuntimePublicationState?: string;
    missingVerificationScenarioState?: string;
    staleControlSliceState?: string;
    staleContinuityState?: string;
    missingGovernanceOpsState?: string;
  };
  bauAuthority?: {
    signedOffState?: string;
    blockedPackState?: string;
    blockedPackBlockers?: readonly string[];
    blockedReleaseAttemptState?: string;
    blockedReleaseAttemptBlockers?: readonly string[];
  };
  runbookAndOnCallAuthority?: {
    validOnCallState?: string;
    blockedOnCallState?: string;
    blockedOnCallBlockers?: readonly string[];
    currentRunbookState?: string;
    staleRunbookState?: string;
    staleRunbookBlockers?: readonly string[];
  };
  exerciseAuthority?: { exerciseTypes?: readonly string[]; exactExerciseCount?: number };
  blockerAuthority?: {
    missingProofRefs?: readonly string[];
    blockerRefs?: readonly string[];
    phaseBlockerRefs?: readonly string[];
    bauBlockerRefs?: readonly string[];
  };
  authAuthority?: { tenantDeniedErrorCode?: string; authorizationDeniedErrorCode?: string };
  deterministicReplay?: { replayHash?: string };
  noGapArtifactRequired?: boolean;
}>("data/contracts/449_phase9_cross_phase_conformance_contract.json");

assert(
  contract.schemaVersion === PHASE9_CROSS_PHASE_CONFORMANCE_VERSION,
  "CONTRACT_SCHEMA_VERSION_DRIFT",
);
for (const taskId of Object.keys(upstreamContractPaths)) {
  assert(
    contract.upstreamSchemaVersions?.[taskId] === recomputed.upstreamSchemaVersions[taskId],
    `CONTRACT_UPSTREAM_VERSION_DRIFT:${taskId}`,
  );
}
for (const sourceRef of ["#9I", "phase-cards", "blueprint-init", "platform-runtime"]) {
  assert(
    contract.sourceAlgorithmRefs?.some((candidate) => candidate.includes(sourceRef)),
    `SOURCE_REF_MISSING:${sourceRef}`,
  );
}
for (const objectName of [
  "BAUReadinessPack",
  "OnCallMatrix",
  "RunbookBundle",
  "PhaseConformanceRow",
  "CrossPhaseConformanceScorecard",
  "ReleaseToBAURecord",
  "ExerciseEvidenceRecord",
]) {
  assert(contract.producedObjects?.includes(objectName), `PRODUCED_OBJECT_MISSING:${objectName}`);
}
for (const methodName of [
  "ingestExerciseEvidence",
  "generatePhaseConformanceRow",
  "generateCrossPhaseScorecard",
  "getScorecardStateAndHash",
  "listBlockersByPhase",
  "listMissingProofRefs",
  "createOrUpdateBAUReadinessPack",
  "validateOnCallMatrix",
  "validateRunbookBundle",
  "attemptReleaseToBAURecordCreation",
  "explainBAUSignoffBlockers",
]) {
  assert(contract.apiSurface?.includes(methodName), `API_SURFACE_MISSING:${methodName}`);
}
assert(contract.conformanceAuthority?.exactScorecardState === "exact", "EXACT_SCORECARD_NOT_EXACT");
assert(contract.conformanceAuthority?.staleScorecardState === "stale", "STALE_SCORECARD_NOT_STALE");
assert(
  contract.conformanceAuthority?.blockedScorecardState === "blocked",
  "BLOCKED_SCORECARD_NOT_BLOCKED",
);
assert(
  contract.conformanceAuthority?.summaryContradictionState === "blocked",
  "SUMMARY_CONTRADICTION_NOT_BLOCKED",
);
assert(
  contract.conformanceAuthority?.missingRuntimePublicationState === "blocked",
  "MISSING_RUNTIME_NOT_BLOCKED",
);
assert(
  contract.conformanceAuthority?.missingVerificationScenarioState === "blocked",
  "MISSING_VERIFICATION_NOT_BLOCKED",
);
assert(
  contract.conformanceAuthority?.staleControlSliceState === "stale",
  "STALE_CONTROL_SLICE_NOT_STALE",
);
assert(
  contract.conformanceAuthority?.staleContinuityState === "stale",
  "STALE_CONTINUITY_NOT_STALE",
);
assert(
  contract.conformanceAuthority?.missingGovernanceOpsState === "blocked",
  "MISSING_GOV_OPS_NOT_BLOCKED",
);
assert(contract.bauAuthority?.signedOffState === "signed_off", "BAU_SIGNOFF_NOT_SIGNED");
assert(contract.bauAuthority?.blockedPackState === "blocked", "BAU_BLOCKED_PACK_NOT_BLOCKED");
assert(
  contract.bauAuthority?.blockedPackBlockers?.some((blocker) => blocker.startsWith("scorecard:")),
  "BAU_SCORECARD_BLOCKER_MISSING",
);
assert(
  contract.bauAuthority?.blockedReleaseAttemptState === "blocked",
  "RELEASE_TO_BAU_BLOCK_NOT_BLOCKED",
);
assert(
  contract.bauAuthority?.blockedReleaseAttemptBlockers?.includes("scorecard:blocked"),
  "RELEASE_TO_BAU_SCORECARD_BLOCKER_MISSING",
);
assert(
  contract.runbookAndOnCallAuthority?.validOnCallState === "validated",
  "VALID_ON_CALL_NOT_VALIDATED",
);
assert(
  contract.runbookAndOnCallAuthority?.blockedOnCallBlockers?.includes("on-call:rota-missing"),
  "ON_CALL_ROTA_BLOCKER_MISSING",
);
assert(
  contract.runbookAndOnCallAuthority?.currentRunbookState === "current",
  "RUNBOOK_NOT_CURRENT",
);
assert(contract.runbookAndOnCallAuthority?.staleRunbookState === "stale", "RUNBOOK_NOT_STALE");
assert(
  contract.runbookAndOnCallAuthority?.staleRunbookBlockers?.includes("runbook:rehearsal:stale"),
  "RUNBOOK_REHEARSAL_BLOCKER_MISSING",
);
assert(contract.exerciseAuthority?.exactExerciseCount === 11, "EXERCISE_COUNT_INVALID");
for (const exerciseType of [
  "full_load_soak_patient_staff",
  "projection_rebuild_raw_events",
  "backup_restore_clean_environment",
  "failover_rehearsal",
  "security_incident_rehearsal",
  "reportable_incident_drill",
  "monthly_assurance_pack_generation",
  "retention_deletion_dry_run",
  "tenant_baseline_diff_approval_audit",
  "full_end_to_end_regression",
  "continuity_evidence_convergence",
]) {
  assert(
    contract.exerciseAuthority?.exerciseTypes?.includes(exerciseType),
    `EXERCISE_MISSING:${exerciseType}`,
  );
}
assert(
  (contract.blockerAuthority?.missingProofRefs?.length ?? 0) >= 3,
  "MISSING_PROOF_REFS_MISSING",
);
assert((contract.blockerAuthority?.phaseBlockerRefs?.length ?? 0) >= 6, "PHASE_BLOCKERS_MISSING");
assert((contract.blockerAuthority?.bauBlockerRefs?.length ?? 0) >= 4, "BAU_BLOCKERS_MISSING");
assert(
  contract.authAuthority?.tenantDeniedErrorCode === "CONFORMANCE_TENANT_SCOPE_DENIED",
  "TENANT_SCOPE_DENIAL_MISSING",
);
assert(
  contract.authAuthority?.authorizationDeniedErrorCode === "CONFORMANCE_ROLE_DENIED",
  "AUTHORIZATION_DENIAL_MISSING",
);
assert(contract.deterministicReplay?.replayHash?.match(/^[a-f0-9]{64}$/), "REPLAY_HASH_INVALID");
assert(contract.noGapArtifactRequired === true, "GAP_POSTURE_INVALID");

const fixture = readJson<Phase9CrossPhaseConformanceFixture>(
  "data/fixtures/449_phase9_cross_phase_conformance_fixtures.json",
);
assert(fixture.replayHash === recomputed.replayHash, "REPLAY_HASH_DRIFT");
assert(fixture.exactScorecard.scorecardState === "exact", "FIXTURE_EXACT_SCORECARD_INVALID");
assert(
  fixture.exactScorecard.scorecardHash === recomputed.exactScorecard.scorecardHash,
  "SCORECARD_HASH_DRIFT",
);
assert(
  fixture.staleScorecardAfterProofDrift.scorecardState === "stale",
  "FIXTURE_STALE_SCORECARD_INVALID",
);
assert(fixture.blockedScorecard.scorecardState === "blocked", "FIXTURE_BLOCKED_SCORECARD_INVALID");
assert(
  fixture.signedOffBauReadinessPack.signoffState === "signed_off",
  "FIXTURE_BAU_SIGNOFF_INVALID",
);
assert(fixture.blockedBauReadinessPack.signoffState === "blocked", "FIXTURE_BAU_BLOCK_INVALID");
assert(fixture.blockedReleaseToBAUAttempt.state === "blocked", "FIXTURE_RELEASE_BLOCK_INVALID");
assert(
  fixture.missingProofRefs.includes("missing:runtime-publication-bundle"),
  "MISSING_RUNTIME_REF_ABSENT",
);
assert(
  fixture.blockerExplanation.blockerRefs.includes("scorecard:blocked"),
  "BLOCKER_EXPLANATION_SCORECARD_ABSENT",
);
assert(
  fixture.tenantDeniedErrorCode === "CONFORMANCE_TENANT_SCOPE_DENIED",
  "FIXTURE_TENANT_DENIAL",
);
assert(fixture.authorizationDeniedErrorCode === "CONFORMANCE_ROLE_DENIED", "FIXTURE_AUTHZ_DENIAL");

const unitSpec = readText("tests/unit/449_cross_phase_conformance.spec.ts");
for (const token of requiredTestTokens) {
  assert(unitSpec.includes(token), `TEST_TOKEN_MISSING:${token}`);
}

const summary = readText("data/analysis/449_phase9_cross_phase_conformance_summary.md");
const notes = readText("data/analysis/449_algorithm_alignment_notes.md");
const rowsCsv = readText("data/analysis/449_phase_conformance_rows.csv");
const blockersCsv = readText("data/analysis/449_bau_signoff_blockers.csv");
assert(summary.includes("PhaseConformanceRow binds"), "SUMMARY_PHASE_ROW_MISSING");
assert(
  notes.includes("Release-to-BAU record creation is blocked"),
  "NOTES_RELEASE_BLOCKER_MISSING",
);
assert(rowsCsv.includes("phase3_duplicate_resolution,blocked"), "ROWS_CSV_BLOCKED_ROW_MISSING");
assert(blockersCsv.includes("blocked"), "BLOCKERS_CSV_BLOCKED_MISSING");

const gapPath = path.join(
  root,
  "data/contracts/PHASE9_BATCH_443_457_INTERFACE_GAP_449_CONFORMANCE_INPUTS.json",
);
assert(!fs.existsSync(gapPath), "UNEXPECTED_CONFORMANCE_INPUT_GAP_ARTIFACT");

console.log("449 Phase 9 cross-phase conformance validation passed");
