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

function assertIncludes(file: string, fragment: string): void {
  const content = read(file);
  assertCondition(content.includes(fragment), `${file} is missing ${fragment}`);
}

const requiredFiles = [
  "packages/domains/operations/src/phase9-security-compliance-export-destinations.ts",
  "automation/phase9/configure_security_reporting_and_compliance_exports.ts",
  "tests/playwright/463_security_reporting_destinations.spec.ts",
  "tests/playwright/463_compliance_export_destinations.spec.ts",
  "tests/playwright/463_export_destination_redaction.spec.ts",
  "tests/playwright/463_security_compliance_exports.helpers.ts",
  "tests/integration/463_security_compliance_destination_contract.test.ts",
  "docs/runbooks/463_security_reporting_compliance_export_destination_setup.md",
  "data/contracts/463_security_compliance_export_destination.schema.json",
  "data/contracts/PHASE9_BATCH_458_472_INTERFACE_GAP_463_SECURITY_COMPLIANCE_EXPORT_DESTINATIONS.json",
  "data/contracts/463_phase9_security_compliance_export_registry_contract.json",
  "data/fixtures/463_security_compliance_export_registry_fixtures.json",
  "data/analysis/463_algorithm_alignment_notes.md",
  "data/analysis/463_external_reference_notes.json",
  "data/analysis/463_security_compliance_export_verification_evidence.json",
  "tools/test/run_phase9_security_compliance_exports.ts",
  "tools/analysis/validate_463_phase9_security_compliance_exports.ts",
];

for (const requiredFile of requiredFiles) {
  assertCondition(
    fs.existsSync(path.join(root, requiredFile)),
    `Missing required file ${requiredFile}`,
  );
}

for (const typeName of [
  "interface GovernedExportDestinationBinding",
  "interface SecurityReportingDestinationBinding",
  "interface ComplianceExportPolicyBinding",
  "interface ExportDestinationVerificationRecord",
  "interface ExportDeliverySettlement",
  "interface ReportabilityHandoffVerificationRecord",
]) {
  assertIncludes(
    "packages/domains/operations/src/phase9-security-compliance-export-destinations.ts",
    typeName,
  );
}

for (const anchor of [
  'data-testid="security-compliance-export-config-surface"',
  'data-testid="security-compliance-export-scope-ribbon"',
  'data-testid="security-compliance-export-wizard"',
  'data-testid="security-compliance-export-readiness-strip"',
  'data-testid="export-destination-table"',
  'data-testid="fake-security-reporting-receiver-ledger"',
  'data-testid="fake-compliance-export-receiver-ledger"',
  'data-testid="export-artifact-policy-rail"',
  'data-testid="security-compliance-export-error-summary"',
  'data-testid="security-compliance-export-live"',
]) {
  assertIncludes("apps/governance-console/src/governance-shell-seed.tsx", anchor);
}

assertIncludes(
  "apps/governance-console/src/governance-shell-seed.model.ts",
  "/ops/config/security-compliance-exports",
);
assertIncludes(
  "apps/ops-console/src/operations-shell-seed.tsx",
  "ops-security-compliance-export-readiness-strip",
);
assertIncludes(
  "apps/ops-console/src/operations-shell-seed.tsx",
  "data-security-compliance-export-state",
);
assertIncludes(
  "apps/governance-console/src/governance-shell-seed.tsx",
  "records-security-compliance-export-readiness-strip",
);
assertIncludes("package.json", "test:phase9:security-compliance-exports");
assertIncludes("package.json", "validate:463-phase9-security-compliance-exports");

const contract = readJson<any>(
  "data/contracts/463_phase9_security_compliance_export_registry_contract.json",
);
assertCondition(
  contract.schemaVersion === "463.phase9.security-compliance-export-destination.v1",
  "Bad task 463 schema version",
);
assertCondition(
  contract.route === "/ops/config/security-compliance-exports",
  "Bad security compliance export route",
);
assertCondition(contract.destinationCoverage.bindingCount === 12, "Destination count mismatch");
assertCondition(
  contract.destinationCoverage.allDestinationClassesCovered === true,
  "Destination classes must be covered",
);
assertCondition(
  contract.destinationCoverage.allSecretRefsAreVaultRefs === true,
  "Destination secret refs must be vault refs",
);
assertCondition(
  contract.destinationCoverage.allSecretMaterialInlineFalse === true,
  "Secret material must not be inline",
);
assertCondition(
  contract.destinationCoverage.allArtifactPresentationBound === true,
  "ArtifactPresentationContract must be bound",
);
assertCondition(
  contract.destinationCoverage.allOutboundGrantBound === true,
  "OutboundNavigationGrant must be bound",
);
assertCondition(contract.destinationCoverage.noRawExportUrls === true, "Raw URLs must be blocked");
assertCondition(
  contract.fakeReceiverCoverage.allSecurityPayloadsRedacted === true,
  "Security reporting payloads must be redacted",
);
assertCondition(
  contract.fakeReceiverCoverage.allCompliancePayloadsRedacted === true,
  "Compliance export payloads must be redacted",
);
assertCondition(
  contract.staleGraphInvalidatesReadiness === true,
  "Stale graph must invalidate readiness",
);
assertCondition(
  contract.blockedRedactionInvalidatesDelivery === true,
  "Blocked redaction must invalidate delivery",
);

for (const destinationClass of [
  "reportable_data_security_incident_handoff",
  "internal_security_incident_report_bundle",
  "near_miss_learning_summary_destination",
  "dspt_operational_evidence_pack_export",
  "dtac_evidence_refresh_export",
  "dcb0129_manufacturer_safety_pack_delta_export",
  "dcb0160_deployment_handoff_pack_export",
  "nhs_app_integrated_channel_operational_pack_export",
  "audit_investigation_bundle_export",
  "archive_manifest_deletion_certificate_export",
  "recovery_evidence_pack_export",
  "cross_phase_conformance_scorecard_export",
]) {
  assertCondition(
    contract.requiredExportDestinationClasses.includes(destinationClass),
    `Missing destination class ${destinationClass}`,
  );
}

for (const artifactClass of [
  "dspt_operational_evidence_pack",
  "audit_investigation_bundle",
  "deletion_certificate",
  "archive_manifest",
  "recovery_evidence_pack",
  "cross_phase_conformance_scorecard",
]) {
  assertCondition(
    contract.requiredExportArtifactClasses.includes(artifactClass),
    `Missing required artifact class ${artifactClass}`,
  );
}

const fixture = readJson<any>("data/fixtures/463_security_compliance_export_registry_fixtures.json");
for (const scenarioState of [
  "normal",
  "missing_secret",
  "missing_destination",
  "denied_scope",
  "stale_graph",
  "stale_redaction_policy",
  "blocked_graph",
  "blocked_redaction",
  "delivery_failed",
  "permission_denied",
  "reportability_pending",
]) {
  assertCondition(fixture.scenarioProjections[scenarioState], `Missing ${scenarioState} fixture`);
}

const externalNotes = readJson<any>("data/analysis/463_external_reference_notes.json");
for (const expectedUrl of [
  "https://digital.nhs.uk/services/data-security-and-protection-toolkit",
  "https://transform.england.nhs.uk/key-tools-and-info/digital-technology-assessment-criteria-dtac/",
  "https://transform.england.nhs.uk/information-governance/guidance/records-management-code/",
  "https://digital.nhs.uk/data-and-information/information-standards/governance/latest-activity/standards-and-collections/review-of-digital-clinical-safety-standards-dcb0129-and-dcb0160",
  "https://design-system.service.gov.uk/components/error-summary/",
  "https://playwright.dev/docs/network",
  "https://playwright.dev/docs/aria-snapshots",
]) {
  assertCondition(
    externalNotes.references.some((reference: { url: string }) => reference.url === expectedUrl),
    `Missing external reference ${expectedUrl}`,
  );
}

assertCondition(
  /^\- \[(?:-|X)\] par_463_phase9_use_Playwright_or_other_appropriate_tooling_browser_automation_to_configure_security_reporting_and_compliance_export_destinations/m.test(
    read("prompt/checklist.md"),
  ),
  "Checklist row for par_463 must be claimed or complete",
);

console.log("Task 463 security compliance export destination validation passed.");
