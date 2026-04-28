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
  "tools/test/run_phase9_retention_legal_hold_worm_replay.ts",
  "tests/integration/467_retention_lifecycle_binding.test.ts",
  "tests/integration/467_legal_hold_freeze.test.ts",
  "tests/integration/467_worm_hash_chain_protection.test.ts",
  "tests/integration/467_archive_manifest_deletion_certificate.test.ts",
  "tests/integration/467_replay_dependency_protection.test.ts",
  "tests/playwright/467_records_governance.helpers.ts",
  "tests/playwright/467_records_governance_lifecycle_flow.spec.ts",
  "tests/playwright/467_disposition_block_explainer.spec.ts",
  "tests/fixtures/467_retention_dependency_graph_cases.json",
  "docs/testing/467_retention_legal_hold_worm_replay_test_plan.md",
  "data/evidence/467_retention_legal_hold_worm_replay_results.json",
  "data/analysis/467_algorithm_alignment_notes.md",
  "data/analysis/467_external_reference_notes.json",
  "data/contracts/PHASE9_BATCH_458_472_INTERFACE_GAP_467_RETENTION_TEST_FIXTURE.json",
  "tools/analysis/validate_467_phase9_retention_legal_hold_worm_replay.ts",
];

for (const requiredFile of requiredFiles) {
  assertExists(requiredFile);
}

for (const scriptName of [
  "test:phase9:retention-legal-hold-worm-replay",
  "validate:467-phase9-retention-legal-hold-worm-replay",
]) {
  assertIncludes("package.json", scriptName);
}

for (const fragment of [
  "RetentionLifecycleBinding",
  "DispositionEligibilityAssessment",
  "LegalHoldScopeManifest",
  "LegalHoldRecord",
  "ArtifactDependencyLink",
  "DispositionBlockExplainer",
  "ArchiveManifest",
  "DeletionCertificate",
  "WORM",
  "replay-critical",
  "raw storage scans",
  "certificate optimism gap",
]) {
  assertIncludes("data/analysis/467_algorithm_alignment_notes.md", fragment);
}

const fixture = readJson<any>("tests/fixtures/467_retention_dependency_graph_cases.json");
assertCondition(
  fixture.schemaVersion === "467.phase9.retention-legal-hold-worm-replay.v1",
  "Unexpected fixture schema",
);
for (const artifactClass of [
  "evidence_artifact",
  "assurance_pack",
  "audit_record",
  "incident_bundle",
  "recovery_artifact",
  "assistive_final_human_artifact",
  "transcript_summary",
  "conformance_artifact",
]) {
  assertCondition(
    fixture.retentionClassificationCases.some(
      (row: { artifactClass: string; boundAtCreation: boolean; storagePathInferred: boolean }) =>
        row.artifactClass === artifactClass &&
        row.boundAtCreation === true &&
        row.storagePathInferred === false,
    ),
    `Missing retention classification case ${artifactClass}`,
  );
}
assertCondition(
  fixture.dispositionProtectionCases.rawStorageScan.jobState === "blocked",
  "Raw storage scan was not blocked",
);
assertCondition(
  fixture.dispositionProtectionCases.wormHashChain.jobState === "blocked",
  "WORM/hash-chain delete was not blocked",
);
assertCondition(
  fixture.dispositionProtectionCases.wormHashChain.adminOverrideDeleteAllowed === false,
  "WORM override path unexpectedly allowed",
);
assertCondition(
  fixture.dispositionProtectionCases.replayCritical.deleteJobState === "blocked",
  "Replay-critical delete was not blocked",
);
assertCondition(
  fixture.dispositionProtectionCases.replayCritical.archiveJobState === "queued",
  "Replay-critical archive was not queued",
);
assertCondition(
  fixture.legalHoldFreezeCases.activeHold.activeFreezeRefs.length > 0,
  "Active freeze refs missing",
);
assertCondition(
  fixture.legalHoldFreezeCases.activeHold.activeLegalHoldRefs.length > 0,
  "Active legal hold refs missing",
);
assertCondition(
  fixture.deletionCertificateCase.certificateWriteBlockedResult.job.blockerRefs.includes(
    "certificate:write-before-delete-required",
  ),
  "Certificate write-before-delete blocker missing",
);
for (const dependencyRef of [
  "dependency:assurance-pack:pack_440",
  "dependency:investigation:timeline_439",
  "dependency:capa:capa_441",
  "dependency:recovery-artifact:restore_438",
  "dependency:archive-manifest:am_443_prior",
  "dependency:deletion-certificate:dc_443_prior",
]) {
  assertCondition(
    fixture.dispositionProtectionCases.dependencyPreservation.graphDependencyRefs.includes(
      dependencyRef,
    ),
    `Missing dependency preservation ref ${dependencyRef}`,
  );
}

const evidence = readJson<any>("data/evidence/467_retention_legal_hold_worm_replay_results.json");
assertCondition(
  evidence.schemaVersion === "467.phase9.retention-legal-hold-worm-replay.v1",
  "Unexpected evidence schema",
);
for (const [coverageName, covered] of Object.entries(evidence.coverage)) {
  assertCondition(covered === true, `Coverage failed: ${coverageName}`);
}
for (const [gapName, closed] of Object.entries(evidence.gapClosures)) {
  assertCondition(closed === true, `Gap closure failed: ${gapName}`);
}
for (const state of [
  "exact",
  "hold-active",
  "freeze-active",
  "dependency-blocked",
  "archive-ready",
  "delete-ready",
  "archived",
  "deleted",
  "permission-denied",
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
assertCondition(evidence.noPhi === true, "PHI guard failed");
assertCondition(evidence.noSecrets === true, "Secret guard failed");
assertCondition(evidence.noSev1OrSev2Defects === true, "Sev-1/Sev-2 gate failed");

const externalNotes = readJson<any>("data/analysis/467_external_reference_notes.json");
for (const expectedFragment of [
  "playwright.dev/docs/aria-snapshots",
  "playwright.dev/docs/api/class-tracing",
  "playwright.dev/docs/screenshots",
  "playwright.dev/docs/network",
  "w3.org/TR/WCAG22",
  "w3.org/WAI/ARIA/apg",
  "NHSE_Records_Management_CoP_2023_V5.pdf",
  "ncsc.gov.uk/collection/cyber-assessment-framework",
  "design-system.service.gov.uk/components/error-summary",
  "design-system.service.gov.uk/components/warning-text",
  "design-system.service.gov.uk/components/details",
  "design-system.service.gov.uk/components/summary-list",
]) {
  assertCondition(
    externalNotes.references.some((reference: { url: string }) =>
      reference.url.includes(expectedFragment),
    ),
    `Missing external reference ${expectedFragment}`,
  );
}

assertIncludes(
  "apps/governance-console/src/records-governance-phase9.model.ts",
  "next review settlement",
);

assertCondition(
  /^\- \[(?:-|X)\] par_467_phase9_Playwright_or_other_appropriate_tooling_testing_run_retention_legal_hold_worm_and_replay_dependency_protection_suites/m.test(
    read("prompt/checklist.md"),
  ),
  "Checklist row for par_467 must be claimed or complete",
);

console.log("Task 467 retention, legal hold, WORM, and replay validation passed.");
