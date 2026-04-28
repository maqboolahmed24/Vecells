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
  "apps/governance-console/src/role-scope-studio-phase9.model.ts",
  "apps/governance-console/src/role-scope-studio-phase9.model.test.ts",
  "docs/frontend/458_governance_role_scope_studio_spec.md",
  "docs/accessibility/458_role_scope_studio_a11y_notes.md",
  "data/contracts/458_governance_role_scope_studio_projection.schema.json",
  "data/contracts/PHASE9_BATCH_458_472_INTERFACE_GAP_458_ACCESS_PREVIEW_READ_MODEL.json",
  "data/contracts/458_phase9_role_scope_studio_route_contract.json",
  "data/fixtures/458_role_scope_studio_fixtures.json",
  "data/analysis/458_algorithm_alignment_notes.md",
  "data/analysis/458_external_reference_notes.json",
  "tests/unit/458_role_scope_studio_projection.spec.ts",
  "tests/integration/458_role_scope_studio_artifacts.spec.ts",
  "tests/playwright/458_role_scope_studio_flow.spec.ts",
  "tests/playwright/458_access_preview_masking.spec.ts",
  "tests/playwright/458_release_freeze_cards.spec.ts",
  "tests/playwright/458_role_scope_studio_accessibility.spec.ts",
  "tests/playwright/458_role_scope_studio_visual.spec.ts",
  "tools/test/run_phase9_role_scope_studio.ts",
  "tools/analysis/validate_458_phase9_role_scope_studio.ts",
];

for (const requiredFile of requiredFiles) {
  assertCondition(
    fs.existsSync(path.join(root, requiredFile)),
    `Missing required file ${requiredFile}`,
  );
}

assertIncludes(
  "apps/governance-console/src/governance-shell-seed.model.ts",
  "access_role_scope_studio",
);
assertIncludes(
  "apps/governance-console/src/governance-shell-seed.model.ts",
  "/ops/access/role-scope-studio",
);
assertIncludes(
  "apps/governance-console/src/governance-shell-seed.tsx",
  "function GovernanceScopeRibbon",
);
assertIncludes("apps/governance-console/src/governance-shell-seed.tsx", "function RoleScopeMatrix");
assertIncludes(
  "apps/governance-console/src/governance-shell-seed.tsx",
  "function EffectiveAccessPreviewPane",
);
assertIncludes(
  "apps/governance-console/src/governance-shell-seed.tsx",
  "function AccessMaskDiffCard",
);
assertIncludes(
  "apps/governance-console/src/governance-shell-seed.tsx",
  "function BreakGlassElevationSummary",
);
assertIncludes(
  "apps/governance-console/src/governance-shell-seed.tsx",
  "function ReleaseFreezeCardRail",
);
assertIncludes(
  "apps/governance-console/src/governance-shell-seed.tsx",
  "function DeniedActionExplainer",
);
assertIncludes(
  "apps/governance-console/src/governance-shell-seed.tsx",
  "function ScopeTupleInspector",
);
assertIncludes(
  "apps/governance-console/src/governance-shell-seed.tsx",
  "function GovernanceReturnContextStrip",
);
for (const anchor of [
  'data-testid="role-scope-studio"',
  'data-testid="governance-scope-ribbon-458"',
  'data-testid="role-scope-matrix"',
  'data-testid="effective-access-preview-pane"',
  'data-testid="access-mask-diff-card"',
  'data-testid="break-glass-elevation-summary"',
  'data-testid="release-freeze-card-rail"',
  'data-testid="denied-action-explainer"',
  'data-testid="scope-tuple-inspector"',
  'data-testid="governance-return-context-strip"',
]) {
  assertIncludes("apps/governance-console/src/governance-shell-seed.tsx", anchor);
}
assertIncludes("apps/governance-console/src/governance-shell-seed.css", ".role-scope-studio");
assertIncludes("package.json", "test:phase9:role-scope-studio");
assertIncludes("package.json", "validate:458-phase9-role-scope-studio");

const contract = JSON.parse(
  read("data/contracts/458_phase9_role_scope_studio_route_contract.json"),
);
assertCondition(
  contract.schemaVersion === "458.phase9.governance-role-scope-studio.v1",
  "Bad schema version",
);
assertCondition(
  contract.routes.includes("/ops/access/role-scope-studio"),
  "Missing role scope studio route",
);
assertCondition(
  contract.matrixCoverage.columnCount === 7,
  "Matrix must expose 7 capability columns",
);
assertCondition(contract.matrixCoverage.rowCount >= 7, "Matrix must expose route/action families");
assertCondition(
  contract.matrixCoverage.requiredStatesPresent === true,
  "Matrix must expose live/diagnostic/recovery/denied/frozen/masked states",
);
assertCondition(
  contract.matrixCoverage.navigationIsNotAuthorization === true,
  "Navigation must not become authorization",
);
assertCondition(
  contract.accessPreviewSafety.usesGapArtifact === true,
  "Access preview gap artifact must be referenced",
);
assertCondition(
  contract.accessPreviewSafety.hiddenFieldsNotRendered === true,
  "Hidden fields must not render",
);
assertCondition(
  contract.accessPreviewSafety.telemetryRedacted === true,
  "Telemetry must be redacted",
);
assertCondition(
  contract.breakGlassPosture.incidentPersonaShowsActiveElevation === true,
  "Break-glass active elevation summary missing",
);
assertCondition(
  contract.freezeCardCoverage.requiredKindsPresent === true,
  "Missing required release freeze card kinds",
);
assertCondition(
  contract.freezeCardCoverage.frozenDowngradesExportApproval === true,
  "Frozen state must freeze export/approval/admin controls",
);
assertCondition(
  contract.deniedActionSafety.allExplainSourcePredicateConsequenceAndNextAction === true,
  "Denied actions must explain source, predicate, consequence, and next safe action",
);

const fixture = JSON.parse(read("data/fixtures/458_role_scope_studio_fixtures.json"));
for (const state of [
  "normal",
  "empty",
  "stale",
  "degraded",
  "blocked",
  "permission_denied",
  "settlement_pending",
  "frozen",
  "masked",
]) {
  assertCondition(fixture.scenarioProjections[state], `Fixture missing ${state}`);
}
for (const anchor of [
  "role-scope-studio",
  "governance-scope-ribbon-458",
  "role-scope-matrix",
  "effective-access-preview-pane",
  "access-mask-diff-card",
  "break-glass-elevation-summary",
  "release-freeze-card-rail",
  "denied-action-explainer",
  "scope-tuple-inspector",
  "governance-return-context-strip",
]) {
  assertCondition(
    fixture.automationAnchors.includes(anchor),
    `Missing automation anchor ${anchor}`,
  );
}
assertCondition(
  /^\- \[(?:-|X)\] par_458_phase9_track_Playwright_or_other_appropriate_tooling_frontend_build_governance_role_scope_studio_access_preview_and_release_freeze_cards/m.test(
    read("prompt/checklist.md"),
  ),
  "Checklist row for par_458 must be claimed or complete",
);

console.log("Task 458 role scope studio validation passed.");
