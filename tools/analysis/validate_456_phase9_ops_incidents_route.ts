import fs from "node:fs";
import path from "node:path";
import {
  OPS_INCIDENTS_SCHEMA_VERSION,
  createOpsIncidentsFixture,
} from "../../apps/ops-console/src/operations-incidents-phase9.model";

const root = process.cwd();

const requiredFiles = [
  "apps/ops-console/src/operations-incidents-phase9.model.ts",
  "apps/ops-console/src/operations-incidents-phase9.model.test.ts",
  "apps/ops-console/src/operations-shell-seed.model.ts",
  "apps/ops-console/src/operations-shell-seed.tsx",
  "apps/ops-console/src/operations-shell-seed.css",
  "data/contracts/456_phase9_ops_incidents_route_contract.json",
  "data/fixtures/456_phase9_ops_incidents_route_fixtures.json",
  "data/analysis/456_ops_incidents_implementation_note.md",
  "tools/test/run_phase9_ops_incidents_route.ts",
  "tools/analysis/validate_456_phase9_ops_incidents_route.ts",
  "tests/unit/456_ops_incidents_route.spec.ts",
  "tests/integration/456_ops_incidents_route_artifacts.spec.ts",
  "tests/playwright/456_ops_incidents_route.spec.js",
];

const requiredSourceFragments: Record<string, readonly string[]> = {
  "apps/ops-console/src/operations-incidents-phase9.model.ts": [
    "OpsIncidentQueueRow",
    "OpsReportabilityChecklistProjection",
    "OpsPostIncidentReviewProjection",
    "OpsIncidentTelemetryRedactionProjection",
    "createOpsIncidentsProjection",
    "createOpsIncidentsFixture",
  ],
  "apps/ops-console/src/operations-shell-seed.tsx": [
    'data-surface="incident-desk"',
    'data-surface="incident-command-strip"',
    'data-surface="incident-queue"',
    'data-surface="near-miss-intake"',
    'data-surface="severity-board"',
    'data-surface="containment-timeline"',
    'data-surface="reportability-checklist"',
    'data-surface="pir-panel"',
    'data-surface="incident-capa-links"',
    'data-surface="incident-evidence-links"',
    "UIEventEnvelope",
    "UITelemetryDisclosureFence",
  ],
  "apps/ops-console/src/operations-shell-seed.model.ts": [
    "incidentsProjection",
    "createOpsIncidentsProjection",
    "workbenchStateForIncidentControl",
    "incidentsWorkbenchState",
  ],
  "apps/ops-console/src/operations-shell-seed.css": [
    ".ops-incident-desk",
    ".ops-incident-command-strip",
    ".ops-incident-layout",
    ".ops-incident-row",
    ".ops-near-miss-intake",
    "@media (prefers-reduced-motion: reduce)",
  ],
  "tests/playwright/456_ops_incidents_route.spec.js": [
    "incident-desk",
    "near-miss-intake",
    "permission-denied",
    "settlement-pending",
    "reducedMotion",
    "accessibilityApi?.snapshot",
    "patientIdentifier",
  ],
};

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

for (const relativePath of requiredFiles) {
  assert(fs.existsSync(path.join(root, relativePath)), `MISSING_FILE:${relativePath}`);
}

for (const [relativePath, fragments] of Object.entries(requiredSourceFragments)) {
  const source = readText(relativePath);
  for (const fragment of fragments) {
    assert(source.includes(fragment), `SOURCE_FRAGMENT_MISSING:${relativePath}:${fragment}`);
  }
}

const packageJson = readJson<{ scripts?: Record<string, string> }>("package.json");
assert(
  packageJson.scripts?.["test:phase9:ops-incidents-route"] ===
    "pnpm exec tsx ./tools/test/run_phase9_ops_incidents_route.ts && pnpm exec vitest run tests/unit/456_ops_incidents_route.spec.ts tests/integration/456_ops_incidents_route_artifacts.spec.ts && node tests/playwright/456_ops_incidents_route.spec.js --run",
  "PACKAGE_SCRIPT_MISSING:test:phase9:ops-incidents-route",
);
assert(
  packageJson.scripts?.["validate:456-phase9-ops-incidents-route"] ===
    "pnpm exec tsx ./tools/analysis/validate_456_phase9_ops_incidents_route.ts",
  "PACKAGE_SCRIPT_MISSING:validate:456-phase9-ops-incidents-route",
);

const checklist = readText("prompt/checklist.md");
assert(/^- \[(?:-|X)\] par_456_/m.test(checklist), "CHECKLIST_TASK_456_NOT_CLAIMED_OR_COMPLETE");

const contract = readJson<{
  schemaVersion?: string;
  routes?: readonly string[];
  requiredSurfaces?: readonly string[];
  automationAnchors?: readonly string[];
  upstreamSchemaVersions?: Record<string, string>;
  reportabilityAuthority?: {
    normalDecision?: string;
    pendingDecision?: string;
    blockedDecision?: string;
    staleDecision?: string;
    permissionDecision?: string;
  };
  containmentAuthority?: {
    normalStates?: readonly string[];
    pendingStates?: readonly string[];
    blockedStates?: readonly string[];
  };
  closureAuthority?: {
    normalClosureState?: string;
    normalClosureBlockers?: readonly string[];
    blockedClosureState?: string;
    emptyClosureState?: string;
  };
  nearMissAuthority?: {
    nearMissCount?: number;
    intakeAllowed?: boolean;
    degradedIntakeAllowed?: boolean;
  };
  evidenceAuthority?: {
    evidenceLinks?: readonly { safeReturnTokenRef?: string; payloadClass?: string }[];
    capaLinks?: readonly string[];
  };
  redactionAuthority?: {
    permittedPayloadClass?: string;
    redactedFields?: readonly string[];
  };
  noGapArtifactRequired?: boolean;
}>("data/contracts/456_phase9_ops_incidents_route_contract.json");
const fixture = readJson<ReturnType<typeof createOpsIncidentsFixture>>(
  "data/fixtures/456_phase9_ops_incidents_route_fixtures.json",
);
const recomputed = createOpsIncidentsFixture();

assert(contract.schemaVersion === OPS_INCIDENTS_SCHEMA_VERSION, "CONTRACT_SCHEMA_VERSION_DRIFT");
assert(fixture.schemaVersion === OPS_INCIDENTS_SCHEMA_VERSION, "FIXTURE_SCHEMA_VERSION_DRIFT");
assert(contract.routes?.includes("/ops/incidents"), "ROUTE_MISSING:/ops/incidents");

for (const surface of [
  "IncidentDesk",
  "IncidentCommandStrip",
  "IncidentQueue",
  "NearMissIntake",
  "SeverityBoard",
  "ContainmentTimeline",
  "ReportabilityChecklist",
  "ExternalReportingHandoff",
  "PostIncidentReview",
  "IncidentCapaLinks",
  "IncidentEvidenceLinks",
  "IncidentTelemetryRedaction",
]) {
  assert(contract.requiredSurfaces?.includes(surface), `REQUIRED_SURFACE_MISSING:${surface}`);
}

for (const anchor of [
  "incident-desk",
  "incident-command-strip",
  "incident-queue",
  "near-miss-intake",
  "severity-board",
  "containment-timeline",
  "reportability-checklist",
  "pir-panel",
  "incident-capa-links",
  "incident-evidence-links",
]) {
  assert(contract.automationAnchors?.includes(anchor), `AUTOMATION_ANCHOR_MISSING:${anchor}`);
}

assert(
  contract.upstreamSchemaVersions?.["447"] === "447.phase9.incident-reportability-workflow.v1",
  "UPSTREAM_447_VERSION_MISSING",
);
assert(contract.reportabilityAuthority?.normalDecision === "reported", "NORMAL_NOT_REPORTED");
assert(
  contract.reportabilityAuthority?.pendingDecision === "reportable_pending_submission",
  "PENDING_REPORTABILITY_NOT_VISIBLE",
);
assert(
  contract.reportabilityAuthority?.blockedDecision === "insufficient_facts_blocked",
  "INSUFFICIENT_FACTS_NOT_VISIBLE",
);
assert(contract.reportabilityAuthority?.staleDecision === "superseded", "STALE_NOT_SUPERSEDED");
assert(
  contract.reportabilityAuthority?.permissionDecision === "insufficient_facts_blocked",
  "PERMISSION_SCOPE_DECISION_DRIFT",
);
assert(contract.containmentAuthority?.normalStates?.includes("applied"), "APPLIED_MISSING");
assert(contract.containmentAuthority?.pendingStates?.includes("pending"), "PENDING_MISSING");
assert(contract.containmentAuthority?.blockedStates?.includes("failed"), "FAILED_MISSING");
assert(contract.closureAuthority?.normalClosureState === "blocked", "NORMAL_CLOSURE_NOT_BLOCKED");
assert(
  contract.closureAuthority?.normalClosureBlockers?.includes("pir:root-cause-open") &&
    contract.closureAuthority.normalClosureBlockers.includes("capa:training-drill-pending"),
  "NORMAL_CLOSURE_BLOCKERS_MISSING",
);
assert(contract.closureAuthority?.emptyClosureState === "complete", "EMPTY_CLOSURE_NOT_COMPLETE");
assert(contract.nearMissAuthority?.nearMissCount === 1, "NEAR_MISS_COUNT_DRIFT");
assert(contract.nearMissAuthority?.intakeAllowed === true, "NEAR_MISS_INTAKE_NOT_ALLOWED");
assert(
  contract.nearMissAuthority?.degradedIntakeAllowed === true,
  "DEGRADED_NEAR_MISS_DRAFT_NOT_ALLOWED",
);
assert(
  contract.evidenceAuthority?.evidenceLinks?.every(
    (link) => Boolean(link.safeReturnTokenRef) && Boolean(link.payloadClass),
  ),
  "EVIDENCE_SAFE_RETURN_METADATA_MISSING",
);
assert(
  contract.evidenceAuthority?.capaLinks?.includes("capa_441_incident_route_token"),
  "CAPA_LINK_MISSING",
);
assert(
  contract.redactionAuthority?.permittedPayloadClass === "metadata_only",
  "TELEMETRY_PAYLOAD_CLASS_DRIFT",
);
for (const field of [
  "incidentSummary",
  "patientIdentifier",
  "routeParams",
  "artifactFragment",
  "investigationKey",
]) {
  assert(
    contract.redactionAuthority?.redactedFields?.includes(field),
    `REDACTED_FIELD_MISSING:${field}`,
  );
}
assert(
  fixture.scenarioProjections.normal.boardStateDigestRef ===
    recomputed.scenarioProjections.normal.boardStateDigestRef,
  "FIXTURE_DIGEST_DRIFT",
);
assert(contract.noGapArtifactRequired === true, "UNEXPECTED_GAP_ARTIFACT_REQUIRED");

for (const existingContract of [
  "data/contracts/439_phase9_investigation_timeline_service_contract.json",
  "data/contracts/440_phase9_assurance_pack_factory_contract.json",
  "data/contracts/441_phase9_capa_attestation_workflow_contract.json",
  "data/contracts/446_phase9_projection_rebuild_quarantine_contract.json",
  "data/contracts/447_phase9_incident_reportability_workflow_contract.json",
]) {
  assert(
    fs.existsSync(path.join(root, existingContract)),
    `UPSTREAM_CONTRACT_MISSING:${existingContract}`,
  );
}

const gapPath = path.join(
  root,
  "data/contracts/PHASE9_BATCH_443_457_INTERFACE_GAP_456_REPORTABILITY_INPUTS.json",
);
assert(!fs.existsSync(gapPath), "UNEXPECTED_REPORTABILITY_GAP_ARTIFACT");

console.log("Task 456 ops incidents route validation passed.");
