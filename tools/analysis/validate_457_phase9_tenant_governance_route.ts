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
  "apps/governance-console/src/tenant-governance-phase9.model.ts",
  "apps/governance-console/src/tenant-governance-phase9.model.test.ts",
  "tests/unit/457_tenant_governance_route.spec.ts",
  "tests/integration/457_tenant_governance_route_artifacts.spec.ts",
  "tests/playwright/457_tenant_governance_route.spec.js",
  "tools/test/run_phase9_tenant_governance_route.ts",
  "tools/analysis/validate_457_phase9_tenant_governance_route.ts",
  "data/contracts/457_phase9_tenant_governance_route_contract.json",
  "data/fixtures/457_phase9_tenant_governance_route_fixtures.json",
  "data/analysis/457_tenant_governance_implementation_note.md",
];

for (const requiredFile of requiredFiles) {
  assertCondition(
    fs.existsSync(path.join(root, requiredFile)),
    `Missing required file ${requiredFile}`,
  );
}

assertIncludes("apps/governance-console/src/governance-shell-seed.model.ts", "config_tenants");
assertIncludes("apps/governance-console/src/governance-shell-seed.model.ts", "/ops/config/tenants");
assertIncludes(
  "apps/governance-console/src/governance-shell-seed.tsx",
  'data-testid="tenant-governance"',
);
assertIncludes(
  "apps/governance-console/src/governance-shell-seed.tsx",
  'data-testid="tenant-baseline-matrix"',
);
assertIncludes(
  "apps/governance-console/src/governance-shell-seed.tsx",
  'data-testid="config-diff-viewer"',
);
assertIncludes(
  "apps/governance-console/src/governance-shell-seed.tsx",
  'data-testid="policy-pack-history"',
);
assertIncludes(
  "apps/governance-console/src/governance-shell-seed.tsx",
  'data-testid="standards-watchlist"',
);
assertIncludes(
  "apps/governance-console/src/governance-shell-seed.tsx",
  'data-testid="legacy-reference-findings"',
);
assertIncludes(
  "apps/governance-console/src/governance-shell-seed.tsx",
  'data-testid="promotion-approval-status"',
);
assertIncludes(
  "apps/governance-console/src/governance-shell-seed.tsx",
  'data-testid="release-watch-status"',
);
assertIncludes(
  "apps/governance-console/src/governance-shell-seed.tsx",
  'data-testid="migration-posture"',
);
assertIncludes("apps/governance-console/src/governance-shell-seed.css", ".tenant-governance");
assertIncludes(
  "apps/governance-console/src/tenant-governance-phase9.model.ts",
  "StandardsDependencyWatchlist",
);
assertIncludes(
  "apps/governance-console/src/tenant-governance-phase9.model.ts",
  "LegacyReferenceFinding",
);
assertIncludes(
  "apps/governance-console/src/tenant-governance-phase9.model.ts",
  "PolicyCompatibilityAlert",
);
assertIncludes(
  "apps/governance-console/src/tenant-governance-phase9.model.ts",
  "StandardsExceptionRecord",
);
assertIncludes("package.json", "test:phase9:tenant-governance-route");
assertIncludes("package.json", "validate:457-phase9-tenant-governance-route");

const contract = JSON.parse(
  read("data/contracts/457_phase9_tenant_governance_route_contract.json"),
);
assertCondition(
  contract.schemaVersion === "457.phase9.tenant-governance-route.v1",
  "Bad schema version",
);
assertCondition(contract.routes.includes("/ops/governance/tenants"), "Missing governance route");
assertCondition(contract.routes.includes("/ops/config/tenants"), "Missing config tenants route");
assertCondition(contract.matrixCoverage.domainCount === 10, "Tenant matrix must expose 10 domains");
assertCondition(
  contract.matrixCoverage.requiredDomainsPresent === true,
  "Tenant matrix lost required governance domains",
);
assertCondition(
  contract.matrixCoverage.cellsExposeExactEffectiveInheritanceAndVersion === true,
  "Matrix cells must expose exact/effective/inheritance/version values",
);
assertCondition(
  contract.matrixCoverage.selectedTenantPreservedUnderFilters === true,
  "Selected tenant must be preserved by matrix filters",
);
assertCondition(
  contract.watchlistAuthority.usesTask448Contract === true,
  "Task 448 contract must remain the watchlist authority",
);
assertCondition(
  contract.watchlistAuthority.noInterfaceGapRequired === true,
  "Unexpected watchlist interface gap posture",
);
assertCondition(
  contract.watchlistAuthority.legacyFindingsVisible === true,
  "Legacy reference findings must be visible",
);
assertCondition(
  contract.watchlistAuthority.policyCompatibilityAlertsVisible === true,
  "Policy compatibility alerts must be visible",
);
assertCondition(
  contract.watchlistAuthority.standardsExceptionsVisible === true,
  "Standards exceptions must be visible",
);
assertCondition(
  contract.promotionSafety.compileAndPromoteFrozenUntilAllTuplesSettle === true,
  "Compile/promote controls must stay frozen until all tuples settle",
);
assertCondition(
  contract.promotionSafety.staleRequiresRevalidation === true,
  "Stale watchlist must expose revalidation",
);
assertCondition(contract.noGapArtifactRequired === true, "Unexpected gap posture");

const fixture = JSON.parse(read("data/fixtures/457_phase9_tenant_governance_route_fixtures.json"));
for (const route of [
  "/ops/governance/tenants",
  "/ops/config/tenants",
  "/ops/config/bundles",
  "/ops/config/promotions",
  "/ops/release",
]) {
  assertCondition(fixture.routes.includes(route), `Fixture missing route ${route}`);
}
for (const anchor of [
  "tenant-governance",
  "tenant-baseline-matrix",
  "config-diff-viewer",
  "policy-pack-history",
  "standards-watchlist",
  "legacy-reference-findings",
  "promotion-approval-status",
  "release-watch-status",
  "migration-posture",
]) {
  assertCondition(
    fixture.automationAnchors.includes(anchor),
    `Missing automation anchor ${anchor}`,
  );
}

assertCondition(
  fs.existsSync(
    path.join(root, "data", "contracts", "448_phase9_tenant_config_governance_contract.json"),
  ),
  "Missing upstream 448 tenant config governance contract",
);
assertCondition(
  !fs.existsSync(
    path.join(
      root,
      "data",
      "contracts",
      "PHASE9_BATCH_443_457_INTERFACE_GAP_457_TENANT_WATCHLIST_INPUTS.json",
    ),
  ),
  "Tenant watchlist interface gap note should not exist when 448 artifacts are available",
);
assertCondition(
  /^\- \[(?:-|X)\] par_457_phase9_track_Playwright_or_other_appropriate_tooling_frontend_build_tenant_baseline_matrix_config_diff_and_watchlist_views/m.test(
    read("prompt/checklist.md"),
  ),
  "Checklist row for par_457 must be claimed or complete",
);

console.log("Task 457 tenant governance route validation passed.");
