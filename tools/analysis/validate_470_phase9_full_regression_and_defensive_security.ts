import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const forbiddenSensitivePattern =
  /patientNhs|nhsNumber|clinicalNarrative|rawIncident|rawIncidentDetail|rawRouteParam|route-param:raw|artifact-fragment:raw|artifactFragment=|investigationKey=|Bearer |access_token|refresh_token|id_token|sk_live|BEGIN PRIVATE|PRIVATE KEY|s3:\/\/|gs:\/\/|blob:|inlineSecret|rawExportUrl|secretRef|postgres:\/\/|mysql:\/\/|AKIA[0-9A-Z]{16}/i;

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
  "tools/testing/run_470_full_regression_and_defensive_security.ts",
  "tests/e2e/470_full_cross_phase_regression.spec.ts",
  "tests/e2e/470_patient_staff_ops_governance_journeys.spec.ts",
  "tests/security/470_defensive_penetration_authorization.test.ts",
  "tests/security/470_defensive_penetration_tenant_isolation.test.ts",
  "tests/security/470_defensive_penetration_artifact_export.test.ts",
  "tests/security/470_defensive_penetration_input_and_replay.test.ts",
  "tests/security/470_defensive_penetration_secrets_and_telemetry.test.ts",
  "tests/playwright/470_full_cross_phase_browser_regression.spec.ts",
  "tests/fixtures/470_cross_phase_synthetic_programme_cases.json",
  "docs/testing/470_full_cross_phase_regression_and_penetration_plan.md",
  "data/evidence/470_full_regression_and_defensive_security_results.json",
  "data/analysis/470_algorithm_alignment_notes.md",
  "data/analysis/470_external_reference_notes.json",
  "data/contracts/PHASE9_BATCH_458_472_INTERFACE_GAP_470_FULL_REGRESSION_ORCHESTRATOR.json",
  "tools/analysis/validate_470_phase9_full_regression_and_defensive_security.ts",
];

for (const requiredFile of requiredFiles) {
  assertExists(requiredFile);
}

for (const scriptName of [
  "test:phase9:full-regression-defensive-security",
  "validate:470-phase9-full-regression-defensive-security",
]) {
  assertIncludes("package.json", scriptName);
}

for (const fragment of [
  "AuditRecord",
  "IdempotencyRecord",
  "ReplayCollisionReview",
  "IdentityBinding",
  "Session",
  "ActingContext",
  "AccessGrant",
  "CompiledPolicyBundle",
  "RouteIntentBinding",
  "CommandActionRecord",
  "CommandSettlementRecord",
  "ArtifactPresentationContract",
  "OutboundNavigationGrant",
  "Phase-local pass gap",
  "Security theatre gap",
  "NHS App/deferred-channel ambiguity gap",
  "Artifact boundary gap",
  "Telemetry leakage gap",
]) {
  assertIncludes("data/analysis/470_algorithm_alignment_notes.md", fragment);
}

for (const screenshotName of [
  "470-incidents-same-shell-artifact.png",
  "470-incidents-permission-denied.png",
  "470-tenant-normal.png",
  "470-tenant-compile-blocked.png",
  "470-narrow-reduced-motion-zoom.png",
]) {
  assertIncludes("tests/playwright/470_full_cross_phase_browser_regression.spec.ts", screenshotName);
}

const fixture = readJson<any>("tests/fixtures/470_cross_phase_synthetic_programme_cases.json");
assertCondition(
  fixture.schemaVersion === "470.phase9.full-cross-phase-regression-defensive-security.v1",
  "Unexpected fixture schema",
);
assertCondition(fixture.fixtureHash.match(/^[a-f0-9]{64}$/), "Missing fixture hash");
assertCondition(fixture.journeyCases.length >= 16, "Missing cross-phase journeys");
assertCondition(fixture.surfaceCases.length >= 13, "Missing critical surface coverage");
assertCondition(fixture.securityCases.length >= 18, "Missing defensive security cases");
assertCondition(
  !JSON.stringify(fixture).match(forbiddenSensitivePattern),
  "Fixture contains forbidden sensitive markers",
);

for (const journeyId of [
  "patient-intake-receipt-status-manage-recovery",
  "red-flag-diversion-safety-epoch",
  "identity-grant-secure-link-access-renewal",
  "duplicate-same-episode-review-queue-rank",
  "clinical-workspace-task-more-info-endpoint-booking-next-task",
  "local-booking-hub-coordination-external-confirmation-gates",
  "smart-waitlist-offer-hold-confirm-expire",
  "pharmacy-referral-and-bounce-back",
  "outbound-comms-reachability-repair",
  "assistive-review-final-artifact-override-downgrade",
  "ops-overview-heatmap-investigation-intervention",
  "audit-assurance-break-glass-redaction",
  "resilience-restore-failover-quarantine",
  "incident-near-miss-tenant-governance-dependency-hygiene",
  "records-retention-legal-hold-worm-replay",
  "access-studio-compliance-ledger-conformance-scorecard",
]) {
  assertCondition(
    fixture.journeyCases.some((journey: { journeyId: string }) => journey.journeyId === journeyId),
    `Missing journey ${journeyId}`,
  );
}

for (const journey of fixture.journeyCases) {
  assertCondition(
    journey.runtimeInvariants.routeIntentBinding === true &&
      journey.runtimeInvariants.authoritativeCommandSettlementOnly === true &&
      journey.runtimeInvariants.artifactPresentationContractRequired === true &&
      journey.runtimeInvariants.outboundNavigationGrantRequired === true &&
      journey.runtimeInvariants.uiTelemetryRedacted === true,
    `Journey invariant failure ${journey.journeyId}`,
  );
}

for (const surfaceId of [
  "operations-overview",
  "queue-heatmap",
  "investigation",
  "intervention-allocation",
  "audit-explorer",
  "assurance-pack",
  "resilience-board",
  "incident-desk",
  "records-governance",
  "tenant-governance",
  "access-studio",
  "compliance-ledger",
  "conformance-scorecard",
]) {
  assertCondition(
    fixture.surfaceCases.some((surface: { surfaceId: string }) => surface.surfaceId === surfaceId),
    `Missing surface ${surfaceId}`,
  );
}

for (const suiteId of [
  "authorization",
  "tenantIsolation",
  "artifactExport",
  "inputReplay",
  "secretsTelemetry",
]) {
  const cases = fixture.securityCases.filter(
    (securityCase: { suiteId: string }) => securityCase.suiteId === suiteId,
  );
  assertCondition(cases.length > 0, `Missing security suite ${suiteId}`);
  for (const securityCase of cases) {
    assertCondition(securityCase.defensiveOnly === true, `${securityCase.caseId} is not defensive-only`);
    assertCondition(
      Array.isArray(securityCase.externalTargets) && securityCase.externalTargets.length === 0,
      `${securityCase.caseId} targets external systems`,
    );
    assertCondition(
      securityCase.usesRealSecretsOrPhi === false,
      `${securityCase.caseId} requires real secrets or PHI`,
    );
    assertCondition(
      securityCase.actualOutcomeAsserted === true &&
        securityCase.actualOutcomeState === securityCase.expectedOutcomeState,
      `${securityCase.caseId} does not assert actual outcome`,
    );
  }
}

for (const artifact of fixture.artifactBoundaryCases) {
  assertCondition(
    artifact.artifactPresentationContract === "required_and_verified" &&
      artifact.outboundNavigationGrant === "required_and_verified" &&
      artifact.rawBlobUrlExposure === false &&
      artifact.telemetryPayloadClass === "metadata_only",
    `Artifact boundary failed ${artifact.caseId}`,
  );
}

assertCondition(
  fixture.nhsAppDeferredChannelScope.state === "deferred_scope_bounded" &&
    fixture.nhsAppDeferredChannelScope.gapClosed === true,
  "NHS App/deferred-channel scope gap is not closed",
);

const evidence = readJson<any>("data/evidence/470_full_regression_and_defensive_security_results.json");
for (const [coverageName, covered] of Object.entries(evidence.coverage)) {
  assertCondition(covered === true, `Coverage failed: ${coverageName}`);
}
for (const [coverageName, covered] of Object.entries(evidence.securityCoverage)) {
  assertCondition(covered === true, `Security coverage failed: ${coverageName}`);
}
for (const [gapName, closed] of Object.entries(evidence.gapClosures)) {
  assertCondition(closed === true, `Gap closure failed: ${gapName}`);
}
assertCondition(evidence.allCoveragePassed === true, "Coverage summary failed");
assertCondition(evidence.noExternalTargets === true, "External target guard failed");
assertCondition(evidence.noRealSecretsOrPhi === true, "Real secret/PHI guard failed");
assertCondition(evidence.noSensitiveFixtureMarkers === true, "Fixture redaction guard failed");
assertCondition(evidence.noSensitiveEvidenceMarkers === true, "Evidence redaction guard failed");
assertCondition(evidence.noRawArtifactUrls === true, "Raw artifact URL guard failed");
assertCondition(evidence.noTracePersistence === true, "Trace persistence guard failed");
assertCondition(evidence.noSev1OrSev2Defects === true, "Sev1/Sev2 defect guard failed");
assertCondition(!JSON.stringify(evidence).match(forbiddenSensitivePattern), "Evidence has forbidden markers");

const orchestrator = readJson<any>(
  "data/contracts/PHASE9_BATCH_458_472_INTERFACE_GAP_470_FULL_REGRESSION_ORCHESTRATOR.json",
);
assertCondition(orchestrator.gapClosed === true, "Orchestrator interface gap is not closed");
assertCondition(orchestrator.realSecretsOrPhiRequired === false, "Orchestrator requires real secrets or PHI");
assertCondition(
  Array.isArray(orchestrator.externalTargets) && orchestrator.externalTargets.length === 0,
  "Orchestrator targets external systems",
);

const externalNotes = readJson<any>("data/analysis/470_external_reference_notes.json");
for (const expectedFragment of [
  "playwright.dev/docs/accessibility-testing",
  "playwright.dev/docs/network",
  "playwright.dev/docs/screenshots",
  "playwright.dev/docs/browser-contexts",
  "owasp.org/www-project-web-security-testing-guide",
  "w3.org/TR/WCAG22",
  "ncsc.gov.uk/collection/cyber-assessment-framework",
]) {
  assertCondition(
    externalNotes.references.some((reference: { url: string }) =>
      reference.url.includes(expectedFragment),
    ),
    `Missing external reference ${expectedFragment}`,
  );
}

assertCondition(
  /^\- \[(?:-|X)\] par_470_phase9_Playwright_or_other_appropriate_tooling_testing_run_full_cross_phase_end_to_end_regression_and_penetration_suites/m.test(
    read("prompt/checklist.md"),
  ),
  "Checklist row for par_470 must be claimed or complete",
);

console.log("Task 470 full cross-phase regression and defensive security validation passed.");
