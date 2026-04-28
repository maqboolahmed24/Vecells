import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { write476ReleaseWaveArtifacts } from "./plan_476_release_waves";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../..");

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(read(relativePath)) as T;
}

function assertExists(relativePath: string): void {
  assert.ok(fs.existsSync(path.join(ROOT, relativePath)), `${relativePath} must exist`);
}

function assertIncludes(relativePath: string, expected: string): void {
  assert.ok(read(relativePath).includes(expected), `${relativePath} must include ${expected}`);
}

write476ReleaseWaveArtifacts();

const requiredPaths = [
  "data/release/476_release_wave_manifest.json",
  "data/release/476_tenant_cohort_rollout_plan.json",
  "data/release/476_wave_guardrail_snapshots.json",
  "data/release/476_wave_observation_policies.json",
  "data/release/476_wave_eligibility_verdicts.json",
  "data/release/476_blast_radius_matrix.json",
  "data/contracts/476_release_wave_manifest.schema.json",
  "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_476_WAVE_ACTION_SETTLEMENT_AUTHORITY.json",
  "tools/release/plan_476_release_waves.ts",
  "tools/release/validate_476_release_waves.ts",
  "docs/runbooks/476_release_wave_runbook.md",
  "docs/programme/476_tenant_cohort_rollout_plan.md",
  "data/analysis/476_algorithm_alignment_notes.md",
  "data/analysis/476_external_reference_notes.json",
  "apps/ops-console/src/release-wave-planner-476.model.ts",
  "tests/release/476_wave_manifest_contract.test.ts",
  "tests/release/476_guardrail_snapshot.test.ts",
  "tests/playwright/476_release_wave_planner.spec.ts",
];

for (const requiredPath of requiredPaths) assertExists(requiredPath);

const manifest = readJson<any>("data/release/476_release_wave_manifest.json");
const plan = readJson<any>("data/release/476_tenant_cohort_rollout_plan.json");
const guardrails = readJson<any>("data/release/476_wave_guardrail_snapshots.json");
const policies = readJson<any>("data/release/476_wave_observation_policies.json");
const verdicts = readJson<any>("data/release/476_wave_eligibility_verdicts.json");
const matrix = readJson<any>("data/release/476_blast_radius_matrix.json");
const gap = readJson<any>(
  "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_476_WAVE_ACTION_SETTLEMENT_AUTHORITY.json",
);

assert.equal(manifest.schemaVersion, "476.programme.release-wave-manifest.v1");
assert.equal(manifest.recordType, "ProgrammeReleaseWaveManifest");
assert.equal(manifest.activationPermitted, false);
assert.equal(manifest.wideningPermitted, false);
assert.equal(manifest.deploymentWaves.length, 5);
assert.equal(gap.activationPermitted, false);
assert.equal(gap.wideningPermitted, false);

const wave1 = manifest.deploymentWaves.find(
  (wave: any) => wave.waveId === "wave_476_1_core_web_canary",
);
assert.ok(wave1, "Wave 1 must exist");
assert.equal(wave1.state, "approved");
assert.equal(wave1.verdict, "eligible_with_constraints");
assert.equal(wave1.blastRadiusExposure.nhs_app, 0);
assert.equal(wave1.blastRadiusExposure.assistive, 0);
assert.equal(wave1.blastRadiusExposure.pharmacy, 0);
assert.ok(wave1.commandTransitionPolicy.settlementRecordRequired);
assert.equal(wave1.commandTransitionPolicy.informalFeatureFlagsPermitted, false);

const approvedWaves = manifest.deploymentWaves.filter((wave: any) => wave.state === "approved");
const wave1Score = matrix.waveScores.find((score: any) => score.waveId === wave1.waveId);
assert.ok(wave1Score, "Wave 1 score must exist");
for (const approvedWave of approvedWaves) {
  const score = matrix.waveScores.find(
    (candidate: any) => candidate.waveId === approvedWave.waveId,
  );
  assert.ok(score.totalExposureScore >= wave1Score.totalExposureScore);
}

assert.ok(
  plan.channelScopes.some(
    (scope: any) =>
      scope.scopeId === "wcs_476_wave1_core_web_only" &&
      scope.explicitlyExcludedChannels.includes("nhs_app") &&
      scope.explicitlyExcludedChannels.includes("pharmacy_dispatch"),
  ),
  "Wave 1 channel scope must explicitly exclude NHS App and pharmacy dispatch",
);

assert.ok(
  plan.assistiveScopes.some(
    (scope: any) =>
      scope.assistiveScopeId === "was_476_assistive_visible_narrow_staff" &&
      scope.visibleModePermitted === true &&
      scope.allStaffPermitted === false &&
      scope.patientFacingPermitted === false,
  ),
  "Assistive visible mode must be limited to a narrow staff cohort",
);

assert.ok(
  guardrails.snapshots.some(
    (snapshot: any) =>
      snapshot.snapshotId === "wgs_476_superseded_runtime_bundle_edge_case" &&
      snapshot.state === "blocked" &&
      snapshot.blockerRefs.includes("blocker:476:runtime-publication-bundle-superseded"),
  ),
  "Superseded runtime guardrail edge case must block",
);

assert.ok(
  policies.policies.some(
    (policy: any) =>
      policy.policyId === "wop_476_too_short_observation_edge_case" &&
      policy.state === "blocked" &&
      policy.minimumObservationHours > 4,
  ),
  "Too-short observation edge case must block",
);

assert.ok(
  verdicts.edgeCaseVerdicts.some(
    (verdict: any) =>
      verdict.verdictId === "wev_476_edge_reference_data_rollback_gap" &&
      verdict.verdict === "blocked",
  ),
  "Reference-data rollback gap must block",
);

assert.ok(
  matrix.edgeCaseProofs.some(
    (proof: any) =>
      proof.edgeCaseId === "edge_476_cohort_selector_regrouping" && proof.proofState === "blocked",
  ),
  "Cohort regrouping proof must block selector widening",
);

for (const marker of [
  'data-testid="release-476-planner"',
  'data-testid="release-476-hero-row"',
  'data-testid="release-476-wave-ladder"',
  'data-testid="release-476-guardrail-table"',
  'data-testid="release-476-blast-radius-matrix"',
  'data-testid="release-476-command-confirmation-dialog"',
]) {
  assertIncludes("apps/ops-console/src/operations-shell-seed.tsx", marker);
}

assertIncludes("package.json", "test:programme:476-release-waves");
assertIncludes("package.json", "validate:476-release-waves");

console.log("Task 476 release wave validation passed.");
