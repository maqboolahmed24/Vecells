import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(read(relativePath)) as T;
}

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertExists(relativePath: string): void {
  assertCondition(fs.existsSync(path.join(root, relativePath)), `Missing ${relativePath}`);
}

function assertIncludes(relativePath: string, fragment: string): void {
  assertCondition(read(relativePath).includes(fragment), `${relativePath} missing ${fragment}`);
}

const requiredFiles = [
  "tools/test/run_phase9_restore_failover_chaos_slice_quarantine.ts",
  "tests/integration/468_restore_run_contract.test.ts",
  "tests/integration/468_failover_run_contract.test.ts",
  "tests/integration/468_chaos_run_contract.test.ts",
  "tests/integration/468_recovery_evidence_pack.test.ts",
  "tests/integration/468_assurance_slice_quarantine.test.ts",
  "tests/playwright/468_resilience.helpers.ts",
  "tests/playwright/468_resilience_board_restore_failover_chaos.spec.ts",
  "tests/playwright/468_resilience_artifact_presentation.spec.ts",
  "tests/playwright/468_slice_quarantine_ui.spec.ts",
  "tests/fixtures/468_resilience_essential_function_cases.json",
  "docs/testing/468_restore_failover_chaos_slice_quarantine_test_plan.md",
  "data/evidence/468_restore_failover_chaos_slice_quarantine_results.json",
  "data/analysis/468_algorithm_alignment_notes.md",
  "data/analysis/468_external_reference_notes.json",
  "data/contracts/PHASE9_BATCH_458_472_INTERFACE_GAP_468_RESILIENCE_TEST_HARNESS.json",
  "tools/analysis/validate_468_phase9_restore_failover_chaos_slice_quarantine.ts",
];

for (const requiredFile of requiredFiles) {
  assertExists(requiredFile);
}

for (const scriptName of [
  "test:phase9:restore-failover-chaos-slice-quarantine",
  "validate:468-phase9-restore-failover-chaos-slice-quarantine",
]) {
  assertIncludes("package.json", scriptName);
}

for (const fragment of [
  "EssentialFunctionMap",
  "RecoveryTier",
  "BackupSetManifest",
  "RunbookBindingRecord",
  "ResilienceActionSettlement",
  "RecoveryEvidencePack",
  "ArtifactPresentationContract",
  "slice-bounded quarantine",
  "data-restored-only",
  "old game-day",
]) {
  assertIncludes("data/analysis/468_algorithm_alignment_notes.md", fragment);
}

const fixture = readJson<any>("tests/fixtures/468_resilience_essential_function_cases.json");
assertCondition(
  fixture.schemaVersion === "468.phase9.restore-failover-chaos-slice-quarantine.v1",
  "Unexpected fixture schema",
);
assertCondition(fixture.essentialFunctionCases.length === 10, "Essential function count mismatch");
for (const functionCode of [
  "digital_intake",
  "safety_gate",
  "triage_queue",
  "patient_status_secure_links",
  "local_booking",
  "hub_coordination",
  "pharmacy_referral_loop",
  "outbound_communications",
  "audit_search",
  "assistive_layer_downgrade",
]) {
  assertCondition(
    fixture.essentialFunctionCases.some(
      (row: { functionCode: string; covered: boolean }) =>
        row.functionCode === functionCode && row.covered === true,
    ),
    `Missing essential function ${functionCode}`,
  );
}
for (const state of ["current", "stale", "missing", "withdrawn"]) {
  assertCondition(
    fixture.backupManifestStateCases.some((row: { state: string }) => row.state === state),
    `Missing backup state ${state}`,
  );
}
assertCondition(
  fixture.restoreRunCases.cleanEnvironmentRestore.resultState === "succeeded",
  "Clean restore did not succeed",
);
assertCondition(
  fixture.restoreRunCases.dataRestoreOnly.resultState === "data_restored",
  "Data restore-only case missing",
);
assertCondition(
  fixture.restoreRunCases.dependencyBlocked.cycleDetected === true,
  "Dependency blocked proof missing",
);
assertCondition(
  fixture.failoverRunCases.activatedRun.resultState === "active" &&
    fixture.failoverRunCases.stoodDownRun.resultState === "stood_down",
  "Failover lifecycle missing",
);
for (const chaosState of ["scheduled", "running", "halted", "completed", "guardrail_blocked"]) {
  assertCondition(
    fixture.chaosLifecycleCases.some((row: { state: string }) => row.state === chaosState),
    `Missing chaos state ${chaosState}`,
  );
}
for (const artifactType of [
  "restore_report",
  "failover_report",
  "chaos_report",
  "recovery_pack_export",
  "dependency_restore_explainer",
  "journey_recovery_proof",
  "backup_manifest_report",
  "runbook_bundle",
  "readiness_snapshot_summary",
]) {
  assertCondition(
    fixture.recoveryEvidence.artifactPresentationCases.some(
      (row: { artifactType: string; reportChannelCovered: boolean }) =>
        row.artifactType === artifactType && row.reportChannelCovered === true,
    ),
    `Missing artifact presentation ${artifactType}`,
  );
}
assertCondition(
  fixture.projectionQuarantine.divergentComparison.equal === false,
  "Projection mismatch missing",
);
assertCondition(
  fixture.projectionQuarantine.hardBlockedSliceEvaluation.trustState === "quarantined",
  "Hard blocked slice missing",
);
assertCondition(
  fixture.projectionQuarantine.unaffectedSliceEvaluation.trustState === "trusted",
  "Unaffected slice did not remain trusted",
);
assertCondition(
  fixture.oldGameDayInvalidation.tupleDriftSettlement.result === "stale_scope",
  "Old game-day invalidation missing",
);

const evidence = readJson<any>("data/evidence/468_restore_failover_chaos_slice_quarantine_results.json");
for (const [coverageName, covered] of Object.entries(evidence.coverage)) {
  assertCondition(covered === true, `Coverage failed: ${coverageName}`);
}
for (const [gapName, closed] of Object.entries(evidence.gapClosures)) {
  assertCondition(closed === true, `Gap closure failed: ${gapName}`);
}
for (const state of [
  "exact",
  "stale",
  "blocked",
  "recovery-only",
  "guardrail-constrained",
  "quarantined",
]) {
  assertCondition(
    evidence.uiStateCoverage.some(
      (row: { state: string; covered: boolean; screenshot: string }) =>
        row.state === state && row.covered === true && row.screenshot.endsWith(".png"),
    ),
    `Missing UI state coverage ${state}`,
  );
}
assertCondition(evidence.noRawArtifactUrls === true, "Raw artifact URL guard failed");
assertCondition(
  evidence.noEnvironmentIdentifiersInUi === true,
  "Environment identifier UI guard failed",
);
assertCondition(evidence.noPhi === true, "PHI guard failed");
assertCondition(evidence.noSecrets === true, "Secret guard failed");
assertCondition(evidence.noSev1OrSev2Defects === true, "Sev-1/Sev-2 gate failed");

const externalNotes = readJson<any>("data/analysis/468_external_reference_notes.json");
for (const expectedFragment of [
  "playwright.dev/docs/aria-snapshots",
  "playwright.dev/docs/screenshots",
  "playwright.dev/docs/network",
  "playwright.dev/docs/browser-contexts",
  "playwright.dev/docs/api/class-tracing",
  "w3.org/TR/WCAG22",
  "w3.org/WAI/ARIA/apg",
  "service-manual.nhs.uk/accessibility",
  "design-system.service.gov.uk/components/error-summary",
  "design-system.service.gov.uk/components/warning-text",
  "design-system.service.gov.uk/components/notification-banner",
  "design-system.service.gov.uk/components/details",
  "design-system.service.gov.uk/components/summary-list",
  "analysisfunction.civilservice.gov.uk/policy-store/data-visualisation-charts",
  "ncsc.gov.uk/collection/cyber-assessment-framework",
  "england.nhs.uk/ourwork/eprr/ex",
  "dsptoolkit.nhs.uk",
]) {
  assertCondition(
    externalNotes.references.some((reference: { url: string }) =>
      reference.url.includes(expectedFragment),
    ),
    `Missing external reference ${expectedFragment}`,
  );
}

assertCondition(
  /^\- \[(?:-|X)\] par_468_phase9_Playwright_or_other_appropriate_tooling_testing_run_restore_failover_chaos_and_slice_quarantine_suites/m.test(
    read("prompt/checklist.md"),
  ),
  "Checklist row for par_468 must be claimed or complete",
);

console.log("Task 468 restore, failover, chaos, and slice quarantine validation passed.");
