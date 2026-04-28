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
  "packages/domains/operations/src/phase9-live-projection-gateway.ts",
  "tests/playwright/464_live_projection.helpers.ts",
  "tests/playwright/464_live_projection_update_flow.spec.ts",
  "tests/playwright/464_live_delta_gate_and_stale_state.spec.ts",
  "tests/playwright/464_cross_surface_return_after_live_drift.spec.ts",
  "tests/integration/464_live_projection_gateway_contract.test.ts",
  "docs/frontend/464_phase9_live_event_stream_integration_spec.md",
  "docs/architecture/464_phase9_live_projection_topology.mmd",
  "data/contracts/464_phase9_live_projection_channel.schema.json",
  "data/contracts/PHASE9_BATCH_458_472_INTERFACE_GAP_464_LIVE_EVENT_STREAM_CONTRACTS.json",
  "data/contracts/464_phase9_live_projection_gateway_contract.json",
  "data/fixtures/464_live_projection_gateway_fixtures.json",
  "data/analysis/464_algorithm_alignment_notes.md",
  "data/analysis/464_external_reference_notes.json",
  "data/analysis/464_live_projection_gateway_verification_evidence.json",
  "tools/test/run_phase9_live_projection_gateway.ts",
  "tools/analysis/validate_464_phase9_live_projection_gateway.ts",
];

for (const requiredFile of requiredFiles) {
  assertCondition(
    fs.existsSync(path.join(root, requiredFile)),
    `Missing required file ${requiredFile}`,
  );
}

for (const typeName of [
  "interface Phase9LiveProjectionChannelContract",
  "interface AssuranceGraphLiveUpdateContract",
  "interface OperationsProjectionLiveUpdateContract",
  "interface IncidentLiveUpdateContract",
  "interface ResiliencePostureLiveUpdateContract",
  "interface TenantGovernanceLiveUpdateContract",
  "interface ConformanceScorecardLiveUpdateContract",
  "export class LivePhase9ProjectionGateway",
]) {
  assertIncludes("packages/domains/operations/src/phase9-live-projection-gateway.ts", typeName);
}

for (const anchor of [
  'data-testid="phase9-live-projection-gateway-strip"',
  'data-testid="phase9-live-gateway-status"',
  'data-testid="phase9-live-update-fixture-producer"',
  'data-testid="phase9-live-queued-delta-digest"',
  'data-testid="phase9-live-source-slice-table"',
  'data-testid="phase9-live-return-token-panel"',
  "data-phase9-live-gateway-state",
  "data-phase9-live-raw-event-browser-join-allowed",
]) {
  assertIncludes("apps/ops-console/src/operations-shell-seed.tsx", anchor);
  assertIncludes("apps/governance-console/src/governance-shell-seed.tsx", anchor);
}

for (const scriptName of [
  "test:phase9:live-projection-gateway",
  "validate:464-phase9-live-projection-gateway",
]) {
  assertIncludes("package.json", scriptName);
}

const contract = readJson<any>("data/contracts/464_phase9_live_projection_gateway_contract.json");
assertCondition(
  contract.schemaVersion === "464.phase9.live-projection-channel.v1",
  "Bad task 464 schema version",
);
assertCondition(contract.surfaceCoverage.channelCount === 10, "Live channel count mismatch");
assertCondition(
  contract.surfaceCoverage.allSurfacesCovered === true,
  "All surfaces must be covered",
);
assertCondition(
  contract.surfaceCoverage.allSubscriptionKeysUnique === true,
  "Subscription keys must be unique",
);
assertCondition(
  contract.surfaceCoverage.allRuntimeBindingsRequired === true,
  "Runtime bindings must be required",
);
assertCondition(
  contract.surfaceCoverage.rawEventBrowserJoinAllowed === false,
  "Raw event browser joins must be disallowed",
);
assertCondition(
  contract.surfaceCoverage.rawDomainEventPayloadAllowed === false,
  "Raw domain event payloads must be disallowed",
);
assertCondition(
  contract.failClosedCoverage.versionMismatchBlocks === true,
  "Projection version mismatch must block",
);
assertCondition(
  contract.failClosedCoverage.missingRuntimeBindingBlocks === true,
  "Missing runtime binding must block",
);
assertCondition(
  contract.failClosedCoverage.graphDriftBlocksSignoff === true,
  "Graph drift must block signoff/export",
);
assertCondition(
  contract.failClosedCoverage.deltaGatePreservesAnchor === true,
  "Delta gates must preserve selected anchor",
);
assertCondition(
  contract.failClosedCoverage.returnTokenDriftRecoversReadOnly === true,
  "Return token drift must recover read-only",
);
assertCondition(
  contract.failClosedCoverage.telemetryRedacted === true,
  "Telemetry fence must be redacted in normal state",
);
assertCondition(
  contract.quarantineCoverage.sliceBounded === true,
  "Quarantine must be slice bounded",
);

for (const surfaceCode of [
  "operations_overview",
  "assurance_center",
  "audit_explorer",
  "resilience_board",
  "incident_desk",
  "records_governance",
  "tenant_governance",
  "access_studio",
  "compliance_ledger",
  "conformance_scorecard",
]) {
  assertCondition(
    contract.requiredPhase9LiveSurfaceCodes.includes(surfaceCode),
    `Missing live surface ${surfaceCode}`,
  );
}

for (const scenarioState of [
  "normal",
  "projection_version_mismatch",
  "stale_projection",
  "quarantined_incident_producer",
  "graph_drift",
  "action_settlement_failed",
  "delta_gate_open",
  "return_token_drift",
  "telemetry_fence_violation",
  "missing_runtime_binding",
  "reconnecting",
  "recovery_only",
]) {
  assertCondition(contract.scenarioCoverage[scenarioState], `Missing ${scenarioState} coverage`);
}

const externalNotes = readJson<any>("data/analysis/464_external_reference_notes.json");
for (const expectedUrl of [
  "https://html.spec.whatwg.org/multipage/server-sent-events.html",
  "https://playwright.dev/docs/network",
  "https://playwright.dev/docs/trace-viewer",
  "https://playwright.dev/docs/screenshots",
  "https://playwright.dev/docs/aria-snapshots",
  "https://service-manual.nhs.uk/design-system/changes-to-design-system-wcag-2-2",
  "https://design-system.service.gov.uk/components/notification-banner/",
  "https://design-system.service.gov.uk/components/error-summary/",
  "https://www.w3.org/TR/WCAG22/",
  "https://analysisfunction.civilservice.gov.uk/policy-store/data-visualisation-charts/",
]) {
  assertCondition(
    externalNotes.references.some((reference: { url: string }) => reference.url === expectedUrl),
    `Missing external reference ${expectedUrl}`,
  );
}

assertCondition(
  /^\- \[(?:-|X)\] par_464_phase9_merge_Playwright_or_other_appropriate_tooling_integrate_assurance_governance_and_operations_surfaces_with_live_domain_event_streams/m.test(
    read("prompt/checklist.md"),
  ),
  "Checklist row for par_464 must be claimed or complete",
);

console.log("Task 464 live projection gateway validation passed.");
