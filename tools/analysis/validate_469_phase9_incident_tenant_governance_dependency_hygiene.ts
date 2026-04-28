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
  "tools/test/run_phase9_incident_tenant_governance_dependency_hygiene.ts",
  "tests/integration/469_incident_workflow_contract.test.ts",
  "tests/integration/469_reportability_capa_assurance_writeback.test.ts",
  "tests/integration/469_tenant_config_immutability.test.ts",
  "tests/integration/469_standards_dependency_watchlist.test.ts",
  "tests/integration/469_legacy_reference_and_exception_expiry.test.ts",
  "tests/playwright/469_incident_tenant.helpers.ts",
  "tests/playwright/469_incident_desk_flow.spec.ts",
  "tests/playwright/469_tenant_governance_hygiene_flow.spec.ts",
  "tests/playwright/469_incident_tenant_accessibility.spec.ts",
  "tests/fixtures/469_incident_tenant_hygiene_cases.json",
  "docs/testing/469_incident_tenant_governance_dependency_hygiene_test_plan.md",
  "data/evidence/469_incident_tenant_governance_dependency_hygiene_results.json",
  "data/analysis/469_algorithm_alignment_notes.md",
  "data/analysis/469_external_reference_notes.json",
  "data/contracts/PHASE9_BATCH_458_472_INTERFACE_GAP_469_INCIDENT_TENANT_HYGIENE_FIXTURES.json",
  "tools/analysis/validate_469_phase9_incident_tenant_governance_dependency_hygiene.ts",
];

for (const requiredFile of requiredFiles) {
  assertExists(requiredFile);
}

for (const scriptName of [
  "test:phase9:incident-tenant-governance-dependency-hygiene",
  "validate:469-phase9-incident-tenant-governance-dependency-hygiene",
]) {
  assertIncludes("package.json", scriptName);
}

for (const fragment of [
  "SecurityIncident",
  "NearMissReport",
  "ReportabilityAssessment",
  "ExternalReportingHandoffRecord",
  "TenantBaselineProfile",
  "ConfigVersion",
  "CompiledPolicyBundle",
  "StandardsDependencyWatchlist",
  "DependencyLifecycleRecord",
  "LegacyReferenceFinding",
  "PolicyCompatibilityAlert",
  "StandardsExceptionRecord",
  "PromotionReadinessAssessment",
  "just-culture",
  "CAPA-overdue",
]) {
  assertIncludes("data/analysis/469_algorithm_alignment_notes.md", fragment);
}

for (const screenshotName of [
  "469-exact.png",
  "469-reportable.png",
  "469-near-miss.png",
  "469-containment-pending.png",
  "469-capa-overdue.png",
  "469-compile-blocked.png",
  "469-promotion-blocked.png",
  "469-exception-expired.png",
  "469-permission-denied.png",
]) {
  const sourceFiles = [
    "tools/test/run_phase9_incident_tenant_governance_dependency_hygiene.ts",
    "tests/playwright/469_incident_desk_flow.spec.ts",
    "tests/playwright/469_tenant_governance_hygiene_flow.spec.ts",
  ].map(read);
  assertCondition(
    sourceFiles.some((content) => content.includes(screenshotName)),
    `Missing screenshot coverage ${screenshotName}`,
  );
}

const fixture = readJson<any>("tests/fixtures/469_incident_tenant_hygiene_cases.json");
assertCondition(
  fixture.schemaVersion === "469.phase9.incident-tenant-governance-dependency-hygiene.v1",
  "Unexpected fixture schema",
);
assertCondition(
  fixture.requiredIncidentDetectionSources.join("|") === "telemetry|operator_report|near_miss",
  "Incident detection source list mismatch",
);
for (const source of ["telemetry", "operator_report", "near_miss"]) {
  assertCondition(
    fixture.incidentCases.detectionSources.some(
      (row: { detectionSource: string }) => row.detectionSource === source,
    ),
    `Missing detection source ${source}`,
  );
}
assertCondition(
  fixture.incidentCases.severityTriage.severity === "sev1",
  "Severity triage did not escalate to sev1",
);
assertCondition(
  fixture.incidentCases.evidencePreservation.timelineIntegrityState === "exact",
  "Evidence timeline not exact",
);
assertCondition(
  fixture.incidentCases.containment.blockedBeforeEvidence.resultState === "blocked" &&
    fixture.incidentCases.containment.completed.resultState === "settled" &&
    fixture.incidentCases.containment.replay.idempotencyDecision === "exact_replay",
  "Containment lifecycle incomplete",
);
assertCondition(
  fixture.incidentCases.reportability.task463Destination.destinationClass ===
    "reportable_data_security_incident_handoff",
  "Task 463 reportability destination missing",
);
assertCondition(
  fixture.incidentCases.reportability.task463Handoff.handoffState === "verified",
  "Task 463 reportability handoff is not verified",
);
assertCondition(
  !JSON.stringify(fixture.incidentCases.reportability.fakeReceiverRecords).match(
    /https?:\/\/|Bearer|access_token|clinicalNarrative|patientNhs|nhsNumber|rawExportUrl|secretRef/i,
  ),
  "Fake receiver payload exposed sensitive markers",
);
assertCondition(
  fixture.tenantCases.configVersioning.parentChainValid === true &&
    fixture.tenantCases.configVersioning.rootGenesisValid === true,
  "Config version lineage invalid",
);
assertCondition(
  fixture.tenantCases.policyPacks.allRequiredFamiliesCovered === true &&
    fixture.tenantCases.policyPacks.allEffectiveWindowsValid === true,
  "Policy pack coverage invalid",
);
assertCondition(
  fixture.tenantCases.compileGate.visibilityBlockedVerdict.compileGateState === "blocked" &&
    fixture.tenantCases.compileGate.stalePharmacyDispatchVerdict.compileGateState === "blocked" &&
    fixture.tenantCases.compileGate.staleAssistiveVerdict.compileGateState === "blocked",
  "Compile blocker coverage missing",
);
assertCondition(
  fixture.tenantCases.standardsWatchlist.hashParity === true &&
    fixture.tenantCases.standardsWatchlist.cleanHashDiffers === true,
  "Watchlist hash parity invalid",
);
assertCondition(
  fixture.tenantCases.dependencyHygiene.everyBlockingDependencyHasOwnerAndRemediation === true,
  "Dependency hygiene ownership/remediation missing",
);
assertCondition(
  Date.parse(fixture.tenantCases.legacyAndExceptions.expiredException.expiresAt) <
    Date.parse(fixture.generatedAt),
  "Standards exception is not expired relative to generatedAt",
);
assertCondition(
  fixture.tenantCases.legacyAndExceptions.exceptionExpiryReopenedFindings === true,
  "Expired exception did not reopen findings",
);
assertCondition(
  fixture.tenantCases.promotion.approvalBypass.state === "invalidated" &&
    fixture.tenantCases.promotion.drift.state === "invalidated",
  "Promotion shortcut/drift invalidation missing",
);

const evidence = readJson<any>(
  "data/evidence/469_incident_tenant_governance_dependency_hygiene_results.json",
);
for (const [coverageName, covered] of Object.entries(evidence.coverage)) {
  assertCondition(covered === true, `Coverage failed: ${coverageName}`);
}
for (const [gapName, closed] of Object.entries(evidence.gapClosures)) {
  assertCondition(closed === true, `Gap closure failed: ${gapName}`);
}
for (const state of [
  "exact",
  "reportable",
  "near-miss",
  "containment-pending",
  "CAPA-overdue",
  "compile-blocked",
  "promotion-blocked",
  "exception-expired",
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
assertCondition(evidence.fakeDestinationPayloadsRedacted === true, "Fake destination redaction failed");
assertCondition(evidence.noPhi === true, "PHI guard failed");
assertCondition(evidence.noIncidentDetails === true, "Incident detail guard failed");
assertCondition(evidence.noRouteParams === true, "Route param guard failed");
assertCondition(evidence.noArtifactFragments === true, "Artifact fragment guard failed");
assertCondition(evidence.noTracePersistence === true, "Trace persistence guard failed");
assertCondition(evidence.noSev1OrSev2Defects === true, "Sev-1/Sev-2 gate failed");

const externalNotes = readJson<any>("data/analysis/469_external_reference_notes.json");
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
  "england.nhs.uk/long-read/nhs-core-standards-for-emergency-preparedness-resilience-and-response-guidance",
  "england.nhs.uk/ourwork/eprr/gf",
  "england.nhs.uk/long-read/emergency-preparedness-resilience-and-response-eprr-annual-report-and-assurance-update",
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
  /^\- \[(?:-|X)\] par_469_phase9_Playwright_or_other_appropriate_tooling_testing_run_incident_tenant_governance_and_dependency_hygiene_suites/m.test(
    read("prompt/checklist.md"),
  ),
  "Checklist row for par_469 must be claimed or complete",
);

console.log("Task 469 incident, tenant governance, and dependency hygiene validation passed.");
