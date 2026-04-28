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
  "tools/test/run_phase9_audit_break_glass_assurance_redaction.ts",
  "tests/playwright/466_audit_assurance.helpers.ts",
  "tests/playwright/466_audit_explorer_and_replay.spec.ts",
  "tests/playwright/466_break_glass_review.spec.ts",
  "tests/playwright/466_assurance_pack_generation_export.spec.ts",
  "tests/playwright/466_redaction_dom_aria_telemetry.spec.ts",
  "tests/integration/466_worm_audit_integrity.test.ts",
  "tests/integration/466_pack_generation_determinism.test.ts",
  "tests/integration/466_artifact_presentation_redaction.test.ts",
  "tests/fixtures/466_audit_assurance_synthetic_cases.json",
  "docs/testing/466_audit_break_glass_assurance_redaction_test_plan.md",
  "data/evidence/466_audit_break_glass_assurance_redaction_results.json",
  "data/analysis/466_algorithm_alignment_notes.md",
  "data/analysis/466_external_reference_notes.json",
  "data/contracts/PHASE9_BATCH_458_472_INTERFACE_GAP_466_AUDIT_ASSURANCE_TEST_FIXTURE.json",
  "tools/analysis/validate_466_phase9_audit_break_glass_assurance_redaction.ts",
];

for (const requiredFile of requiredFiles) {
  assertExists(requiredFile);
}

for (const scriptName of [
  "test:phase9:audit-break-glass-assurance-redaction",
  "validate:466-phase9-audit-break-glass-assurance-redaction",
]) {
  assertIncludes("package.json", scriptName);
}

for (const fragment of [
  "InvestigationScopeEnvelope",
  "InvestigationTimelineReconstruction",
  "WORM",
  "break-glass",
  "support replay",
  "ArtifactPresentationContract",
  "OutboundNavigationGrant",
  "UITelemetryDisclosureFence",
]) {
  assertIncludes("data/analysis/466_algorithm_alignment_notes.md", fragment);
}

const fixture = readJson<any>("tests/fixtures/466_audit_assurance_synthetic_cases.json");
assertCondition(
  fixture.schemaVersion === "466.phase9.audit-break-glass-assurance-redaction.v1",
  "Unexpected fixture schema",
);
assertCondition(fixture.searchPivotCases.length === 6, "Expected 6 audit search pivots");
for (const pivot of ["request", "patient", "task", "appointment", "pharmacy_case", "actor"]) {
  assertCondition(
    fixture.searchPivotCases.some(
      (pivotCase: { pivot: string; pivotsToWormTimeline: boolean; indexOnlyAllowed: boolean }) =>
        pivotCase.pivot === pivot &&
        pivotCase.pivotsToWormTimeline === true &&
        pivotCase.indexOnlyAllowed === false,
    ),
    `Missing or unsafe pivot ${pivot}`,
  );
}
for (const framework of ["DSPT", "DTAC", "DCB0129", "DCB0160"]) {
  assertCondition(
    fixture.assurancePackFixture.frameworksCovered.includes(framework),
    `Missing framework ${framework}`,
  );
}
for (const caseId of [
  "graph-stale",
  "graph-blocked",
  "stale-pack",
  "denied-scope",
  "blocked-trust",
  "redaction-drift",
]) {
  assertCondition(
    fixture.assurancePackFixture.failClosedCases.some(
      (caseResult: { caseId: string; blocked: boolean }) =>
        caseResult.caseId === caseId && caseResult.blocked === true,
    ),
    `Missing fail-closed case ${caseId}`,
  );
}

const evidence = readJson<any>(
  "data/evidence/466_audit_break_glass_assurance_redaction_results.json",
);
assertCondition(
  evidence.schemaVersion === "466.phase9.audit-break-glass-assurance-redaction.v1",
  "Unexpected evidence schema",
);
assertCondition(evidence.wormAudit.chainContinuous === true, "WORM chain continuity failed");
assertCondition(evidence.wormAudit.tamperDetection === true, "Tamper detection failed");
assertCondition(
  evidence.wormAudit.deterministicTimelineOrdering === true,
  "Timeline ordering failed",
);
assertCondition(evidence.auditSearch.requiredPivotsCovered === true, "Search pivots missing");
assertCondition(
  evidence.breakGlass.failClosedOnAbsent === true,
  "Break-glass absent did not block",
);
assertCondition(
  evidence.breakGlass.failClosedOnExpired === true,
  "Break-glass expired did not block",
);
assertCondition(evidence.supportReplay.replayExitGapClosed === true, "Replay exit gap open");
assertCondition(
  evidence.assurancePack.requiredFrameworksCovered === true,
  "Required assurance frameworks missing",
);
assertCondition(
  evidence.assurancePack.allFailureModesFailClosed === true,
  "Assurance failure modes did not fail closed",
);
assertCondition(
  evidence.assurancePack.packExportOptimismGapClosed === true,
  "Pack export optimism gap open",
);
assertCondition(
  evidence.artifactPresentation.noRawExportUrls === true,
  "Raw export URL guard failed",
);
assertCondition(
  evidence.artifactPresentation.artifactPresentationContractsPresent === true,
  "Artifact presentation contract missing",
);
assertCondition(
  evidence.artifactPresentation.outboundNavigationGrantPresent === true,
  "Outbound grant missing",
);
assertCondition(evidence.redaction.redactionLeakageGapClosed === true, "Redaction gap open");
assertCondition(evidence.noPhi === true, "PHI gate failed");
assertCondition(evidence.noSecrets === true, "Secret gate failed");
assertCondition(evidence.noSev1OrSev2Defects === true, "Sev-1/Sev-2 gate failed");
for (const [gapName, closed] of Object.entries(evidence.gapClosures)) {
  assertCondition(closed === true, `Gap closure failed: ${gapName}`);
}
for (const state of [
  "normal",
  "stale",
  "graph-blocked",
  "permission-denied",
  "redaction-drift",
  "reduced-motion",
]) {
  assertCondition(
    evidence.uiStateCoverage.some(
      (row: { state: string; covered: boolean }) => row.state === state && row.covered === true,
    ),
    `Missing UI state coverage ${state}`,
  );
}

const externalNotes = readJson<any>("data/analysis/466_external_reference_notes.json");
for (const expectedFragment of [
  "playwright.dev/docs/aria-snapshots",
  "playwright.dev/docs/api/class-tracing",
  "playwright.dev/docs/screenshots",
  "playwright.dev/docs/network",
  "w3.org/TR/WCAG22",
  "w3.org/WAI/ARIA/apg",
  "digital-technology-assessment-criteria-dtac",
  "dsptoolkit.nhs.uk",
  "clinical-risk-management-its-application-in-the-manufacture-of-health-it-systems",
  "clinical-risk-management-its-application-in-the-deployment-and-use-of-health-it-systems",
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

assertCondition(
  /^\- \[(?:-|X)\] par_466_phase9_Playwright_or_other_appropriate_tooling_testing_run_audit_break_glass_assurance_pack_and_redaction_suites/m.test(
    read("prompt/checklist.md"),
  ),
  "Checklist row for par_466 must be claimed or complete",
);

console.log("Task 466 audit, break-glass, assurance, and redaction validation passed.");
