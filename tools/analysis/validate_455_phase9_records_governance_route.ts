import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
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
  "apps/governance-console/src/records-governance-phase9.model.ts",
  "apps/governance-console/src/records-governance-phase9.model.test.ts",
  "tests/unit/455_records_governance_route.spec.ts",
  "tests/integration/455_records_governance_route_artifacts.spec.ts",
  "tests/playwright/455_records_governance_route.spec.js",
  "tools/test/run_phase9_records_governance_route.ts",
  "tools/analysis/validate_455_phase9_records_governance_route.ts",
  "data/contracts/455_phase9_records_governance_route_contract.json",
  "data/fixtures/455_phase9_records_governance_route_fixtures.json",
  "data/analysis/455_records_governance_implementation_note.md",
];

for (const requiredFile of requiredFiles) {
  assertCondition(
    fs.existsSync(path.join(root, requiredFile)),
    `Missing required file ${requiredFile}`,
  );
}

assertIncludes(
  "apps/governance-console/src/governance-shell-seed.model.ts",
  "governance_records_holds",
);
assertIncludes(
  "apps/governance-console/src/governance-shell-seed.model.ts",
  "/ops/governance/records/disposition",
);
assertIncludes(
  "apps/governance-console/src/governance-shell-seed.tsx",
  'data-testid="records-governance"',
);
assertIncludes(
  "apps/governance-console/src/governance-shell-seed.tsx",
  'data-testid="lifecycle-ledger"',
);
assertIncludes(
  "apps/governance-console/src/governance-shell-seed.tsx",
  'data-testid="legal-hold-queue"',
);
assertIncludes(
  "apps/governance-console/src/governance-shell-seed.tsx",
  'data-testid="disposition-queue"',
);
assertIncludes(
  "apps/governance-console/src/governance-shell-seed.tsx",
  'testId="deletion-certificate-stage"',
);
assertIncludes(
  "apps/governance-console/src/governance-shell-seed.css",
  ".records-governance__layout",
);
assertIncludes(
  "apps/governance-console/src/records-governance-phase9.model.ts",
  "retentionLifecycleBindingRef",
);
assertIncludes(
  "apps/governance-console/src/records-governance-phase9.model.ts",
  "dispositionEligibilityAssessmentRef",
);
assertIncludes(
  "apps/governance-console/src/records-governance-phase9.model.ts",
  "ArtifactPresentationContract",
);
assertIncludes("package.json", "test:phase9:records-governance-route");
assertIncludes("package.json", "validate:455-phase9-records-governance-route");

const contract = JSON.parse(
  read("data/contracts/455_phase9_records_governance_route_contract.json"),
);
assertCondition(
  contract.schemaVersion === "455.phase9.records-governance-route.v1",
  "Bad schema version",
);
assertCondition(contract.routes.length === 3, "Missing records governance routes");
assertCondition(
  contract.lifecycleSafety.noRawBatchCandidates === true,
  "Raw candidates must be absent",
);
assertCondition(
  contract.lifecycleSafety.protectedRowsSuppressDelete === true,
  "Protected rows must suppress deletion",
);
assertCondition(
  contract.lifecycleSafety.holdReleaseRequiresSupersedingAssessment === true,
  "Hold release must require superseding assessment",
);
assertCondition(
  contract.artifactContracts.deletionCertificate.includes("apc_443"),
  "Missing certificate APC",
);
assertCondition(contract.noGapArtifactRequired === true, "Unexpected gap posture");

const fixture = JSON.parse(read("data/fixtures/455_phase9_records_governance_route_fixtures.json"));
for (const route of [
  "/ops/governance/records",
  "/ops/governance/records/holds",
  "/ops/governance/records/disposition",
]) {
  assertCondition(fixture.routes.includes(route), `Fixture missing route ${route}`);
}
for (const anchor of [
  "records-governance",
  "retention-class-browser",
  "lifecycle-ledger",
  "legal-hold-queue",
  "hold-scope-review",
  "disposition-queue",
  "block-explainer",
  "deletion-certificate-stage",
  "archive-manifest-stage",
]) {
  assertCondition(
    fixture.automationAnchors.includes(anchor),
    `Missing automation anchor ${anchor}`,
  );
}

for (const upstream of [
  "data/contracts/442_phase9_retention_lifecycle_engine_contract.json",
  "data/contracts/443_phase9_disposition_execution_engine_contract.json",
]) {
  assertCondition(
    fs.existsSync(path.join(root, upstream)),
    `Missing upstream contract ${upstream}`,
  );
}

assertCondition(
  !fs.existsSync(
    path.join(
      root,
      "data",
      "contracts",
      "PHASE9_BATCH_443_457_INTERFACE_GAP_455_RECORDS_ARTIFACT_INPUTS.json",
    ),
  ),
  "Records artifact gap note should not exist when 442/443 artifacts are available",
);

assertCondition(
  /^\- \[(?:-|X)\] par_455_phase9_track_Playwright_or_other_appropriate_tooling_frontend_build_records_lifecycle_governance_hold_disposition_and_certificate_views/m.test(
    read("prompt/checklist.md"),
  ),
  "Checklist row for par_455 must be claimed or complete",
);

console.log("Task 455 records governance route validation passed.");
