import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildHubAuthorityCommand,
  setupHubScopeVisibilityHarness,
} from "../../tests/integration/316_hub_scope_visibility.helpers.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const REQUIRED_FILES = [
  path.join(
    ROOT,
    "packages",
    "domains",
    "hub_coordination",
    "src",
    "phase5-acting-context-visibility-kernel.ts",
  ),
  path.join(
    ROOT,
    "packages",
    "domains",
    "hub_coordination",
    "tests",
    "phase5-acting-context-visibility-kernel.test.ts",
  ),
  path.join(ROOT, "docs", "architecture", "316_staff_identity_acting_context_and_cross_org_visibility_enforcement.md"),
  path.join(ROOT, "docs", "api", "316_hub_scope_and_visibility_api.md"),
  path.join(ROOT, "docs", "security", "316_break_glass_scope_tuple_and_minimum_necessary_rules.md"),
  path.join(ROOT, "data", "analysis", "316_external_reference_notes.md"),
  path.join(ROOT, "data", "analysis", "316_scope_drift_cases.csv"),
  path.join(ROOT, "data", "analysis", "316_visibility_tier_field_matrix.csv"),
  path.join(
    ROOT,
    "services",
    "command-api",
    "migrations",
    "144_phase5_staff_identity_acting_context_visibility.sql",
  ),
  path.join(ROOT, "tests", "integration", "316_hub_scope_visibility_authority.spec.ts"),
  path.join(ROOT, "tests", "integration", "316_acting_context_visibility_migration.spec.ts"),
  path.join(ROOT, "tests", "property", "316_acting_context_visibility_properties.spec.ts"),
];

const REQUIRED_SCRIPT =
  '"validate:316-acting-context-scope-and-visibility": "pnpm exec tsx ./tools/analysis/validate_316_acting_context_scope_and_visibility.ts"';

function requireCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function read(filePath: string): string {
  requireCondition(fs.existsSync(filePath), `MISSING_REQUIRED_FILE:${path.relative(ROOT, filePath)}`);
  return fs.readFileSync(filePath, "utf8");
}

function validateChecklist() {
  const checklist = read(path.join(ROOT, "prompt", "checklist.md"));
  requireCondition(
    checklist.includes(
      "- [-] par_316_phase5_track_backend_build_staff_identity_org_boundary_and_acting_context_resolution",
    ) ||
      checklist.includes(
        "- [X] par_316_phase5_track_backend_build_staff_identity_org_boundary_and_acting_context_resolution",
      ),
    "CHECKLIST_ROW_MISSING_OR_UNCLAIMED:par_316",
  );
}

function validatePackageScript() {
  const packageJson = read(path.join(ROOT, "package.json"));
  requireCondition(packageJson.includes(REQUIRED_SCRIPT), "PACKAGE_SCRIPT_MISSING:validate:316");
}

function validateMigration() {
  const sql = read(
    path.join(
      ROOT,
      "services",
      "command-api",
      "migrations",
      "144_phase5_staff_identity_acting_context_visibility.sql",
    ),
  );
  for (const requiredTable of [
    "phase5_staff_identity_contexts",
    "phase5_acting_contexts",
    "phase5_acting_scope_tuples",
    "phase5_cross_org_visibility_envelopes",
    "phase5_scope_authority_audit_records",
    "phase5_break_glass_audit_records",
  ]) {
    requireCondition(sql.includes(requiredTable), `MIGRATION_TABLE_MISSING:${requiredTable}`);
  }
  requireCondition(
    sql.includes("Phase 5 scope and visibility authority"),
    "MIGRATION_DEPENDENCY_NOTE_MISSING",
  );
}

function validateAnalysisCatalogs() {
  const driftCases = read(path.join(ROOT, "data", "analysis", "316_scope_drift_cases.csv"));
  const fieldMatrix = read(path.join(ROOT, "data", "analysis", "316_visibility_tier_field_matrix.csv"));
  for (const driftClass of [
    "organisation_switch",
    "tenant_scope_change",
    "environment_change",
    "policy_plane_change",
    "purpose_of_use_change",
    "elevation_expiry",
    "break_glass_revocation",
    "visibility_contract_drift",
  ]) {
    requireCondition(driftCases.includes(driftClass), `DRIFT_CASE_MISSING:${driftClass}`);
  }
  for (const tier of [
    "origin_practice_visibility",
    "hub_desk_visibility",
    "servicing_site_visibility",
  ]) {
    requireCondition(fieldMatrix.includes(tier), `VISIBILITY_TIER_MISSING:${tier}`);
  }
}

async function validateRuntimeProof() {
  const harness = await setupHubScopeVisibilityHarness("316_validator");
  const allowed = await harness.visibilityService.assertCurrentHubCommandScope(
    buildHubAuthorityCommand(
      {
        seed: "316_validator",
        staffIdentityContextId: harness.bootstrap.staffIdentityContext.staffIdentityContextId,
        actingContextId: harness.bootstrap.actingContext.actingContextId,
        scopeTupleHash: harness.bootstrap.actingContext.scopeTupleHash,
        minimumNecessaryContractRef: harness.bootstrap.actingContext.minimumNecessaryContractRef,
        visibilityEnvelopeId: harness.visibilityEnvelope.crossOrganisationVisibilityEnvelopeId,
        hubCoordinationCaseId: harness.claimed.hubCase.hubCoordinationCaseId,
        expectedOwnershipEpoch: harness.claimed.hubCase.ownershipEpoch,
        expectedOwnershipFenceToken: harness.claimed.hubCase.ownershipFenceToken,
      },
      "begin_candidate_search",
      "hub_case_detail",
      6,
    ),
  );
  requireCondition(allowed.decision === "allowed", "RUNTIME_ALLOWED_SCOPE_FAILED");

  const stale = await harness.visibilityService.validateCurrentHubCommandScope(
    buildHubAuthorityCommand(
      {
        seed: "316_validator",
        staffIdentityContextId: harness.bootstrap.staffIdentityContext.staffIdentityContextId,
        actingContextId: harness.bootstrap.actingContext.actingContextId,
        scopeTupleHash: harness.bootstrap.actingContext.scopeTupleHash,
        minimumNecessaryContractRef: harness.bootstrap.actingContext.minimumNecessaryContractRef,
        visibilityEnvelopeId: harness.visibilityEnvelope.crossOrganisationVisibilityEnvelopeId,
        hubCoordinationCaseId: harness.claimed.hubCase.hubCoordinationCaseId,
        expectedOwnershipEpoch: harness.claimed.hubCase.ownershipEpoch,
        expectedOwnershipFenceToken: harness.claimed.hubCase.ownershipFenceToken,
      },
      "begin_candidate_search",
      "hub_case_detail",
      7,
      {
        observedActiveOrganisationRef: "ODS_316_validator",
      },
    ),
  );
  requireCondition(stale.reasonCode === "organisation_switch", "RUNTIME_SCOPE_DRIFT_FAILED");
}

async function main() {
  for (const filePath of REQUIRED_FILES) {
    read(filePath);
  }
  validateChecklist();
  validatePackageScript();
  validateMigration();
  validateAnalysisCatalogs();
  await validateRuntimeProof();
  console.log("316 acting context, scope, and visibility validation passed.");
}

await main();
