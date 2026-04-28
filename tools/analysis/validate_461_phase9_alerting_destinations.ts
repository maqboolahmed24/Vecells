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
  "packages/domains/operations/src/phase9-operational-destination-registry.ts",
  "automation/phase9/configure_observability_incident_alerting_destinations.ts",
  "tests/playwright/461_configure_alerting_destinations.spec.ts",
  "tests/playwright/461_destination_redaction_and_secret_refs.spec.ts",
  "tests/playwright/461_destination_config.helpers.ts",
  "tests/integration/461_alert_destination_contract.test.ts",
  "docs/runbooks/461_observability_incident_alerting_destination_setup.md",
  "data/contracts/461_operational_destination_binding.schema.json",
  "data/contracts/PHASE9_BATCH_458_472_INTERFACE_GAP_461_DESTINATION_REGISTRY.json",
  "data/contracts/461_phase9_operational_destination_registry_contract.json",
  "data/fixtures/461_operational_destination_registry_fixtures.json",
  "data/analysis/461_algorithm_alignment_notes.md",
  "data/analysis/461_external_reference_notes.json",
  "data/analysis/461_destination_verification_evidence.json",
  "tools/test/run_phase9_alerting_destinations.ts",
  "tools/analysis/validate_461_phase9_alerting_destinations.ts",
];

for (const requiredFile of requiredFiles) {
  assertCondition(
    fs.existsSync(path.join(root, requiredFile)),
    `Missing required file ${requiredFile}`,
  );
}

for (const typeName of [
  "interface OperationalDestinationBinding",
  "interface AlertDestinationVerificationRecord",
  "interface IncidentDestinationRoute",
  "interface DestinationRedactionPolicyBinding",
  "interface DestinationDeliverySettlement",
]) {
  assertIncludes(
    "packages/domains/operations/src/phase9-operational-destination-registry.ts",
    typeName,
  );
}

for (const anchor of [
  'data-testid="operational-destination-config-surface"',
  'data-testid="destination-binding-wizard"',
  'data-testid="destination-binding-table"',
  'data-testid="destination-fake-receiver-ledger"',
  'data-testid="destination-redaction-secret-rail"',
  'data-testid="destination-downstream-readiness-strip"',
  'data-testid="destination-error-summary"',
]) {
  assertIncludes("apps/governance-console/src/governance-shell-seed.tsx", anchor);
}

assertIncludes("apps/governance-console/src/governance-shell-seed.model.ts", "/ops/config/destinations");
assertIncludes("apps/ops-console/src/operations-shell-seed.tsx", "ops-destination-readiness-strip");
assertIncludes("apps/ops-console/src/operations-shell-seed.tsx", "data-destination-registry-state");
assertIncludes("package.json", "test:phase9:alerting-destinations");
assertIncludes("package.json", "validate:461-phase9-alerting-destinations");

const contract = readJson<any>(
  "data/contracts/461_phase9_operational_destination_registry_contract.json",
);
assertCondition(
  contract.schemaVersion === "461.phase9.operational-destination-binding.v1",
  "Bad task 461 schema version",
);
assertCondition(contract.route === "/ops/config/destinations", "Bad destination route");
assertCondition(contract.destinationCoverage.classCount === 10, "Destination class count mismatch");
assertCondition(
  contract.destinationCoverage.noInlineSecretMaterial === true,
  "Inline secret material must be disabled",
);
assertCondition(
  contract.destinationCoverage.allSecretRefsAreVaultRefs === true,
  "Secret refs must be vault refs",
);
assertCondition(
  contract.destinationCoverage.fallbackTriggeredOnDeliveryFailure === true,
  "Delivery failure fallback must be proven",
);

for (const destinationClass of [
  "service_level_breach_risk_alert",
  "projection_stale_quarantined_alert",
  "incident_creation_severity_escalation",
  "near_miss_intake_notification",
  "reportability_assessment_pending_overdue",
  "release_freeze_recovery_disposition",
  "resilience_posture_blocked_stale",
  "assurance_graph_blocked_stale",
  "evidence_gap_owner_notification",
  "destination_delivery_failure_fallback",
]) {
  assertCondition(
    contract.requiredDestinationClasses.includes(destinationClass),
    `Missing required destination class ${destinationClass}`,
  );
}

const fixture = readJson<any>("data/fixtures/461_operational_destination_registry_fixtures.json");
for (const scenarioState of [
  "normal",
  "missing_secret",
  "denied_scope",
  "stale_destination",
  "delivery_failed",
  "permission_denied",
]) {
  assertCondition(fixture.scenarioProjections[scenarioState], `Missing ${scenarioState} fixture`);
}

const externalNotes = readJson<any>("data/analysis/461_external_reference_notes.json");
for (const expectedUrl of [
  "https://opentelemetry.io/docs/concepts/semantic-conventions/",
  "https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html",
  "https://www.ncsc.gov.uk/guidance/introduction-logging-security-purposes",
  "https://design-system.service.gov.uk/components/error-summary/",
  "https://playwright.dev/docs/network",
]) {
  assertCondition(
    externalNotes.references.some((reference: { url: string }) => reference.url === expectedUrl),
    `Missing external reference ${expectedUrl}`,
  );
}

assertCondition(
  /^\- \[(?:-|X)\] par_461_phase9_use_Playwright_or_other_appropriate_tooling_browser_automation_to_configure_observability_incident_and_alerting_destinations/m.test(
    read("prompt/checklist.md"),
  ),
  "Checklist row for par_461 must be claimed or complete",
);

console.log("Task 461 operational destination validation passed.");
