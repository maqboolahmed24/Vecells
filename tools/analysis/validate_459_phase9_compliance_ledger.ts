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
  "apps/ops-console/src/compliance-ledger-phase9.model.ts",
  "apps/ops-console/src/compliance-ledger-phase9.model.test.ts",
  "docs/frontend/459_compliance_ledger_and_gap_queue_spec.md",
  "docs/accessibility/459_compliance_ledger_a11y_notes.md",
  "data/contracts/459_compliance_ledger_projection.schema.json",
  "data/contracts/PHASE9_BATCH_458_472_INTERFACE_GAP_459_COMPLIANCE_LEDGER_PROJECTION.json",
  "data/contracts/459_phase9_compliance_ledger_route_contract.json",
  "data/fixtures/459_compliance_ledger_fixtures.json",
  "data/analysis/459_algorithm_alignment_notes.md",
  "data/analysis/459_external_reference_notes.json",
  "tests/unit/459_compliance_ledger_projection.spec.ts",
  "tests/integration/459_compliance_ledger_artifacts.spec.ts",
  "tests/playwright/459_compliance_ledger_flow.spec.ts",
  "tests/playwright/459_gap_queue_triage.spec.ts",
  "tests/playwright/459_compliance_ledger_accessibility.spec.ts",
  "tests/playwright/459_compliance_ledger_visual.spec.ts",
  "tools/test/run_phase9_compliance_ledger.ts",
  "tools/analysis/validate_459_phase9_compliance_ledger.ts",
];

for (const requiredFile of requiredFiles) {
  assertCondition(
    fs.existsSync(path.join(root, requiredFile)),
    `Missing required file ${requiredFile}`,
  );
}

for (const componentName of [
  "function ComplianceLedgerPanel",
  "function ControlEvidenceGapQueue",
  "function ControlStatusLedgerRow",
  "function EvidenceGraphMiniMap",
  "function GapOwnerBurdenRail",
  "function StandardsVersionContextChip",
  "function CAPAAndIncidentLinkStrip",
  "function GraphCompletenessBlockerCard",
  "function EvidenceGapResolutionDrawer",
]) {
  assertIncludes("apps/ops-console/src/operations-shell-seed.tsx", componentName);
}

for (const projectionName of [
  "interface ComplianceLedgerProjection",
  "interface ControlEvidenceGapQueueProjection",
  "interface ControlEvidenceGraphMiniMapProjection",
  "interface ControlOwnerBurdenProjection",
  "interface GapQueueFilterSetProjection",
  "interface GapResolutionActionPreviewProjection",
]) {
  assertIncludes("apps/ops-console/src/compliance-ledger-phase9.model.ts", projectionName);
}

for (const anchor of [
  'data-testid="compliance-ledger-panel"',
  'data-testid="control-evidence-gap-queue"',
  'data-testid="evidence-graph-mini-map"',
  'data-testid="gap-owner-burden-rail"',
  "standards-version-context-chip",
  'data-testid="capa-and-incident-link-strip"',
  'data-testid="graph-completeness-blocker-card"',
  'data-testid="evidence-gap-resolution-drawer"',
]) {
  assertIncludes("apps/ops-console/src/operations-shell-seed.tsx", anchor);
}

assertIncludes("apps/ops-console/src/operations-shell-seed.tsx", "data-no-raw-artifact-urls");
assertIncludes("apps/ops-console/src/operations-shell-seed.model.ts", "complianceLedgerProjection");
assertIncludes("apps/ops-console/src/operations-shell-seed.css", ".ops-compliance-ledger");
assertIncludes("package.json", "test:phase9:compliance-ledger");
assertIncludes("package.json", "validate:459-phase9-compliance-ledger");

const contract = readJson<any>("data/contracts/459_phase9_compliance_ledger_route_contract.json");
assertCondition(
  contract.schemaVersion === "459.phase9.compliance-ledger-and-gap-queue.v1",
  "Bad task 459 schema version",
);
assertCondition(contract.routeIntegration.path === "/ops/assurance", "Bad ledger route");
assertCondition(
  contract.routeIntegration.noAdjacentDashboard === true,
  "Ledger is not route-integrated",
);
assertCondition(
  contract.routeIntegration.ledgerUsesAssuranceGraph === true,
  "Ledger must use assurance graph refs",
);
assertCondition(
  contract.graphDowngrades.staleDiagnosticOnly === true,
  "Stale graph must be diagnostic-only",
);
assertCondition(
  contract.graphDowngrades.blockedFailsClosed === true,
  "Blocked graph must fail closed",
);
assertCondition(
  contract.graphDowngrades.permissionDeniedMetadataOnly === true,
  "Permission denied must be metadata only",
);
assertCondition(
  contract.artifactSafety.noRawArtifactUrls === true &&
    contract.artifactSafety.allHandoffsSuppressRawUrls === true &&
    contract.artifactSafety.serializedProjectionHasNoHttpUrls === true,
  "Raw artifact URLs must be suppressed",
);
for (const target of [
  "assurance_pack_preview",
  "incident_desk",
  "capa_tracker",
  "tenant_governance",
  "records_lifecycle",
  "resilience_evidence",
]) {
  assertCondition(
    contract.projectionCoverage.safeHandoffTargets.includes(target),
    `Missing handoff target ${target}`,
  );
}

const fixture = readJson<any>("data/fixtures/459_compliance_ledger_fixtures.json");
for (const state of [
  "exact",
  "normal",
  "stale",
  "blocked",
  "empty",
  "permission_denied",
  "overdue_owner",
  "graph_drift",
]) {
  assertCondition(fixture.scenarioProjections[state], `Fixture missing ${state}`);
}
for (const anchor of [
  "compliance-ledger-panel",
  "control-evidence-gap-queue",
  "control-status-ledger-row",
  "evidence-graph-mini-map",
  "gap-owner-burden-rail",
  "standards-version-context-chip",
  "capa-and-incident-link-strip",
  "graph-completeness-blocker-card",
  "evidence-gap-resolution-drawer",
]) {
  assertCondition(
    fixture.automationAnchors.includes(anchor),
    `Missing automation anchor ${anchor}`,
  );
}

const gap = readJson<any>(
  "data/contracts/PHASE9_BATCH_458_472_INTERFACE_GAP_459_COMPLIANCE_LEDGER_PROJECTION.json",
);
assertCondition(gap.status === "bounded_adapter_created", "Missing bounded adapter gap status");
assertCondition(
  gap.adapter.readPolicy === "canonical_assurance_objects_only",
  "Adapter must read canonical assurance objects only",
);

assertCondition(
  /^\- \[(?:-|X)\] par_459_phase9_track_Playwright_or_other_appropriate_tooling_frontend_build_compliance_ledger_panel_and_control_evidence_gap_queue/m.test(
    read("prompt/checklist.md"),
  ),
  "Checklist row for par_459 must be claimed or complete",
);

console.log("Task 459 compliance ledger validation passed.");
