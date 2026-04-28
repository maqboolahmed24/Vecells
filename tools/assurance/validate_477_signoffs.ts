import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  build477FinalSignoffArtifacts,
  write477FinalSignoffArtifacts,
  type FinalLaunchSignoffRegister,
  type Signoff477Scenario,
} from "./prepare_477_final_signoffs";

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

function assertNoSecrets(value: unknown, label: string): void {
  const serialized = JSON.stringify(value);
  const forbidden =
    /Bearer |access_token|refresh_token|id_token|sk_live|BEGIN PRIVATE|PRIVATE KEY|postgres:\/\/|mysql:\/\/|s3:\/\/|AKIA[0-9A-Z]{16}|@nhs\.net|https?:\/\/[^" ]+\/raw/i;
  assert(!forbidden.test(serialized), `${label} must not expose credentials, private keys, or raw URLs`);
}

function assertScenarioBlocks(scenario: Signoff477Scenario, reason: string): void {
  const artifacts = build477FinalSignoffArtifacts(scenario);
  assert.equal(
    artifacts.finalSignoffRegister.signoffReviewPermitted,
    false,
    `${scenario} must block signoff review: ${reason}`,
  );
  assert.equal(
    artifacts.finalSignoffRegister.launchApprovalPermitted,
    false,
    `${scenario} must block launch approval: ${reason}`,
  );
  assert.ok(
    artifacts.finalSignoffRegister.launchDecision.signoffBlockerCount > 0,
    `${scenario} must expose a signoff blocker count: ${reason}`,
  );
}

write477FinalSignoffArtifacts();

const requiredPaths = [
  "data/signoff/477_final_signoff_register.json",
  "data/signoff/477_security_assurance_matrix.json",
  "data/signoff/477_clinical_safety_case_delta.json",
  "data/signoff/477_privacy_dpia_and_records_matrix.json",
  "data/signoff/477_regulatory_and_dtac_evidence_matrix.json",
  "data/signoff/477_accessibility_and_usability_attestation.json",
  "data/signoff/477_supplier_and_dependency_signoff_register.json",
  "data/signoff/477_open_exception_register.json",
  "data/contracts/477_final_signoff.schema.json",
  "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_477_COMMAND_SETTLEMENT_AUTHORITY.json",
  "tools/assurance/prepare_477_final_signoffs.ts",
  "tools/assurance/validate_477_signoffs.ts",
  "docs/assurance/477_final_launch_signoff_pack.md",
  "tests/assurance/477_signoff_register.test.ts",
  "tests/assurance/477_exception_gate.test.ts",
  "tests/playwright/477_signoff_cockpit.spec.ts",
  "data/analysis/477_algorithm_alignment_notes.md",
  "data/analysis/477_external_reference_notes.json",
];

for (const requiredPath of requiredPaths) assertExists(requiredPath);

const register = readJson<FinalLaunchSignoffRegister>("data/signoff/477_final_signoff_register.json");
const security = readJson<any>("data/signoff/477_security_assurance_matrix.json");
const clinical = readJson<any>("data/signoff/477_clinical_safety_case_delta.json");
const privacy = readJson<any>("data/signoff/477_privacy_dpia_and_records_matrix.json");
const regulatory = readJson<any>("data/signoff/477_regulatory_and_dtac_evidence_matrix.json");
const accessibility = readJson<any>(
  "data/signoff/477_accessibility_and_usability_attestation.json",
);
const supplier = readJson<any>("data/signoff/477_supplier_and_dependency_signoff_register.json");
const exceptions = readJson<any>("data/signoff/477_open_exception_register.json");
const externalReferences = readJson<any>("data/analysis/477_external_reference_notes.json");

assert.equal(register.schemaVersion, "477.programme.final-launch-signoff.v1");
assert.equal(register.recordType, "FinalLaunchSignoffRegister");
assert.equal(register.scenarioState, "ready_with_constraints");
assert.equal(register.overallSignoffState, "ready_with_constraints");
assert.equal(register.launchDecision.signoffBlockerCount, 0);
assert.equal(register.signoffReviewPermitted, true);
assert.equal(register.launchApprovalPermitted, false);
assert.equal(register.commandSettlementCurrent, false);
assert.equal(register.authorities.length, 5);

const expectedLanes = [
  "security",
  "clinical_safety",
  "privacy_records",
  "regulatory_dtac",
  "accessibility_usability",
];
assert.deepEqual(
  register.authorities.map((authority) => authority.laneId).sort(),
  expectedLanes.sort(),
);

for (const authority of register.authorities) {
  assert.equal(authority.releaseBinding.releaseCandidateRef, register.releaseBinding.releaseCandidateRef);
  assert.equal(
    authority.releaseBinding.runtimePublicationBundleRef,
    register.releaseBinding.runtimePublicationBundleRef,
  );
  assert.equal(authority.releaseBinding.waveManifestRef, register.releaseBinding.waveManifestRef);
  assert.ok(authority.authorityTupleHash.startsWith(`${authority.authorityId}:`));
  assert.ok(authority.wormAuditRef.includes(authority.authorityId));
  assert.ok(authority.recordHash.length === 64);
}

for (const coverage of [
  "FinalLaunchSignoffRegister",
  "SignoffAuthority",
  "SignoffEvidenceBinding",
  "SignoffException",
  "ClinicalSafetyCaseDelta",
  "HazardLogDeltaBinding",
  "DeploymentSafetyAcceptance",
  "AssistiveClinicalSafetyApproval",
  "PrivacyDPIAClosureRecord",
  "DataProtectionImpactException",
  "RecordsRetentionApproval",
  "LegalHoldReadinessProof",
  "SecurityAssuranceEvidenceRow",
  "PenTestClosureBinding",
  "VulnerabilityExceptionWaiver",
  "SupplyChainAttestation",
]) {
  assert.ok(register.typedRecordCoverage.includes(coverage), `${coverage} must be covered`);
}

assert.ok(security.rows.some((row: any) => row.recordType === "SecurityAssuranceEvidenceRow"));
assert.ok(security.penTestClosureBinding.recordType === "PenTestClosureBinding");
assert.ok(security.vulnerabilityExceptionWaivers[0].expiresAt);
assert.ok(
  security.edgeCaseProofs.some(
    (edge: any) => edge.edgeCaseId === "edge_477_medium_pentest_waiver_missing_expiry",
  ),
);

assert.ok(
  clinical.hazardLogDeltaBindings.some(
    (binding: any) => binding.recordType === "HazardLogDeltaBinding",
  ),
);
assert.ok(
  clinical.assistiveClinicalSafetyApprovals.every(
    (approval: any) => approval.visibleModePermitted === false,
  ),
);
assert.ok(
  clinical.edgeCaseProofs.some(
    (edge: any) => edge.edgeCaseId === "edge_477_clinical_core_web_signed_assistive_visible_missing",
  ),
);

assert.equal(
  privacy.dpiaClosureRecords[0].telemetryDestinationRef,
  "telemetry:privacy-safe-observability:v2",
);
assert.ok(
  privacy.edgeCaseProofs.some(
    (edge: any) => edge.edgeCaseId === "edge_477_dpia_old_telemetry_destination",
  ),
);
assert.ok(privacy.recordsRetentionApprovals[0].recordType === "RecordsRetentionApproval");
assert.ok(privacy.legalHoldReadinessProofs[0].recordType === "LegalHoldReadinessProof");

assert.ok(
  regulatory.dtacEvidenceRows.every(
    (row: any) => row.releaseCandidateRef === register.releaseBinding.releaseCandidateRef,
  ),
);
assert.ok(
  regulatory.edgeCaseProofs.some(
    (edge: any) => edge.edgeCaseId === "edge_477_dtac_superseded_release_candidate",
  ),
);

assert.equal(accessibility.coverageProfile.mobileCoreWebState, "attested");
assert.equal(accessibility.coverageProfile.embeddedNhsAppState, "deferred_not_in_wave1");
assert.ok(
  accessibility.edgeCaseProofs.some(
    (edge: any) => edge.edgeCaseId === "edge_477_accessibility_desktop_only",
  ),
);

assert.ok(
  supplier.supplyChainAttestations.every(
    (attestation: any) => attestation.tenantScope === register.releaseBinding.tenantScope,
  ),
);
assert.ok(
  supplier.edgeCaseProofs.some(
    (edge: any) => edge.edgeCaseId === "edge_477_supplier_tenant_scope_mismatch",
  ),
);

assert.ok(
  exceptions.exceptions.some(
    (entry: any) => entry.exceptionId === "ex_477_backend_command_settlement_pending",
  ),
);
assert.equal(exceptions.classificationPolicy.sourceAlgorithmOverridesDeclaredClassification, true);

assertScenarioBlocks("missing_signoff", "missing privacy authority");
assertScenarioBlocks("expired_signoff", "expired clinical safety signoff");
assertScenarioBlocks("tuple_mismatch", "DTAC release candidate mismatch");
assertScenarioBlocks("blocked", "stale DPIA telemetry destination");
assertScenarioBlocks("exception_blocking", "source algorithm overrides non-blocking exception claim");

assertNoSecrets(register, "final signoff register");
assertNoSecrets(security, "security assurance matrix");
assertNoSecrets(supplier, "supplier register");

assert.ok(
  externalReferences.references.some((ref: any) => ref.refId === "nhs-dtac-2026"),
  "external reference notes must include current DTAC source",
);

for (const marker of [
  'data-testid="final-477-signoff-cockpit"',
  'data-testid="final-477-launch-decision-strip"',
  'data-testid="final-477-signoff-lanes"',
  'data-testid="final-477-exception-ledger"',
  'data-testid="final-477-source-drawer"',
  'data-testid="final-477-launch-approval-action"',
]) {
  assertIncludes("apps/governance-console/src/governance-shell-seed.tsx", marker);
}

assertIncludes("package.json", "test:programme:477-final-signoffs");
assertIncludes("package.json", "validate:477-final-signoffs");

console.log("Task 477 final signoff validation passed.");
