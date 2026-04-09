#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const DATA_DIR = path.join(ROOT, "data", "analysis");
const DOCS_DIR = path.join(ROOT, "docs", "architecture");

const REQUIRED_INPUTS = {
  requirementRegistry: path.join(DATA_DIR, "requirement_registry.jsonl"),
  audienceSurfaceInventory: path.join(DATA_DIR, "audience_surface_inventory.csv"),
  routeFamilyInventory: path.join(DATA_DIR, "route_family_inventory.csv"),
  endpointMatrix: path.join(DATA_DIR, "endpoint_matrix.csv"),
  externalDependencies: path.join(DATA_DIR, "external_dependencies.json"),
  dataClassification: path.join(DATA_DIR, "data_classification_matrix.csv"),
  runtimeTopology: path.join(DATA_DIR, "runtime_workload_families.json"),
  gatewayMatrix: path.join(DATA_DIR, "gateway_surface_matrix.csv"),
  workspaceGraph: path.join(DATA_DIR, "workspace_package_graph.json"),
  serviceRuntime: path.join(DATA_DIR, "service_runtime_matrix.csv"),
};

const DELIVERABLES = [
  path.join(DOCS_DIR, "14_frontend_stack_decision.md"),
  path.join(DOCS_DIR, "14_gateway_bff_pattern_and_surface_split.md"),
  path.join(DOCS_DIR, "14_shell_and_route_runtime_architecture.md"),
  path.join(DOCS_DIR, "14_design_system_and_contract_publication_strategy.md"),
  path.join(DOCS_DIR, "14_client_state_data_fetch_and_live_update_baseline.md"),
  path.join(DOCS_DIR, "14_frontend_testing_and_Playwright_or_other_appropriate_tooling_baseline.md"),
  path.join(DOCS_DIR, "14_visual_direction_and_showcase_spec.md"),
  path.join(DOCS_DIR, "14_frontend_architecture_showcase.html"),
  path.join(DOCS_DIR, "14_shell_topology_and_bff_map.mmd"),
  path.join(DATA_DIR, "frontend_stack_scorecard.csv"),
  path.join(DATA_DIR, "gateway_surface_split_matrix.csv"),
  path.join(DATA_DIR, "client_state_and_cache_policy_matrix.csv"),
  path.join(DATA_DIR, "ui_contract_publication_matrix.csv"),
  path.join(DATA_DIR, "playwright_coverage_matrix.csv"),
];

const SHOWCASE_MARKERS = [
  'data-testid="showcase-shell"',
  'data-testid="shell-rail"',
  'data-testid="hero-strip"',
  'data-testid="shell-switcher"',
  'data-testid="route-switcher"',
  'data-testid="shell-preview"',
  'data-testid="status-strip"',
  'data-testid="decision-dock"',
  'data-testid="contract-inspector"',
  'data-testid="design-contract-digest"',
  'data-testid="selected-anchor"',
  'data-testid="visualization-panel"',
  'data-testid="visualization-table"',
  'data-testid="selection-state"',
  'data-testid="vecells-monogram"',
  'data-shell-type',
  'data-channel-profile',
  'data-route-family',
  'data-layout-topology',
  'data-breakpoint-class',
  'data-density-profile',
  'data-writable-state',
  'data-anchor-state',
  'data-design-contract-digest',
  'data-design-contract-state',
  'data-design-contract-lint-state',
  'data-accessibility-coverage-state',
  'data-semantic-surface',
  'data-keyboard-model',
  'data-focus-transition-scope',
  'data-live-announce-state',
  'data-visualization-parity-state',
  'data-visualization-selection',
  'data-visualization-authority',
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function fileExists(target) {
  return fs.existsSync(target);
}

function readText(target) {
  assert(fileExists(target), `Missing file: ${target}`);
  return fs.readFileSync(target, "utf8");
}

function readJson(target) {
  return JSON.parse(readText(target));
}

function countJsonl(target) {
  return readText(target)
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0).length;
}

function parseCsv(text) {
  const lines = text.replace(/\r/g, "").split("\n").filter((line) => line.length > 0);
  if (!lines.length) return [];
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    return row;
  });
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

function parseCsvFile(target) {
  return parseCsv(readText(target));
}

function ensurePrerequisites() {
  Object.entries(REQUIRED_INPUTS).forEach(([, target]) => {
    assert(fileExists(target), `Missing seq_014 prerequisite: ${target}`);
  });

  const surfaces = parseCsvFile(REQUIRED_INPUTS.audienceSurfaceInventory);
  const routeFamilies = parseCsvFile(REQUIRED_INPUTS.routeFamilyInventory);
  const endpoints = parseCsvFile(REQUIRED_INPUTS.endpointMatrix);
  const dependencies = readJson(REQUIRED_INPUTS.externalDependencies);
  const classifications = parseCsvFile(REQUIRED_INPUTS.dataClassification);
  const runtime = readJson(REQUIRED_INPUTS.runtimeTopology);
  const gateways = parseCsvFile(REQUIRED_INPUTS.gatewayMatrix);
  const workspace = readJson(REQUIRED_INPUTS.workspaceGraph);
  const services = parseCsvFile(REQUIRED_INPUTS.serviceRuntime);

  assert(surfaces.length === 22, "Audience surface inventory row count drifted.");
  assert(routeFamilies.length === 20, "Route family inventory row count drifted.");
  assert(endpoints.length === 15, "Endpoint matrix row count drifted.");
  assert(dependencies.summary.dependency_count === 20, "External dependency count drifted.");
  assert(classifications.length >= 70, "Data classification model looks incomplete.");
  assert(runtime.summary.gateway_surface_count === 22, "Runtime topology gateway count drifted.");
  assert(workspace.summary.app_count >= 7, "Workspace app count drifted.");
  assert(services.length === 21, "Service runtime count drifted.");

  return {
    requirement_registry_rows: countJsonl(REQUIRED_INPUTS.requirementRegistry),
    audience_surface_count: surfaces.length,
    route_family_count: routeFamilies.length,
    endpoint_count: endpoints.length,
    dependency_count: dependencies.summary.dependency_count,
    classification_row_count: classifications.length,
    gateway_surface_count: gateways.length,
    workspace_app_count: workspace.summary.app_count,
    service_runtime_count: services.length,
  };
}

function validateDeliverables() {
  DELIVERABLES.forEach((target) => {
    assert(fileExists(target), `Missing seq_014 deliverable: ${target}`);
  });
}

function extractShowcasePayload(html) {
  const match = html.match(/<script id="showcase-data" type="application\/json">([\s\S]*?)<\/script>/);
  assert(match, "Showcase JSON payload script tag is missing.");
  return JSON.parse(match[1]);
}

function validateDataArtifacts(payload) {
  const stackRows = parseCsvFile(path.join(DATA_DIR, "frontend_stack_scorecard.csv"));
  const gatewayRows = parseCsvFile(path.join(DATA_DIR, "gateway_surface_split_matrix.csv"));
  const stateRows = parseCsvFile(path.join(DATA_DIR, "client_state_and_cache_policy_matrix.csv"));
  const contractRows = parseCsvFile(path.join(DATA_DIR, "ui_contract_publication_matrix.csv"));
  const coverageRows = parseCsvFile(path.join(DATA_DIR, "playwright_coverage_matrix.csv"));

  assert(stackRows.length === 3, "Frontend stack scorecard row count drifted.");
  assert(gatewayRows.length === 22, "Gateway surface split row count drifted.");
  assert(stateRows.length === 12, "Client state matrix row count drifted.");
  assert(contractRows.length === 8, "UI contract publication matrix row count drifted.");
  assert(coverageRows.length === 12, "Playwright coverage matrix row count drifted.");

  const stackIds = new Set(stackRows.map((row) => row.option_id));
  ["OPT_REACT_TS_VITE_TANSTACK", "OPT_REACT_TS_NEXT_APP_ROUTER", "OPT_REACT_TS_REMIX"].forEach((id) => {
    assert(stackIds.has(id), `Missing frontend stack option: ${id}`);
  });
  const chosenStack = stackRows.find((row) => row.decision === "chosen");
  assert(chosenStack && chosenStack.option_id === "OPT_REACT_TS_VITE_TANSTACK", "Chosen frontend stack drifted.");

  const upstreamAudienceSurfaceIds = new Set(parseCsvFile(REQUIRED_INPUTS.audienceSurfaceInventory).map((row) => row.surface_id));
  const upstreamGatewaySurfaceIds = new Set(parseCsvFile(REQUIRED_INPUTS.gatewayMatrix).map((row) => row.gateway_surface_id));
  const generatedAudienceSurfaceIds = new Set(gatewayRows.map((row) => row.audience_surface_id));
  const generatedGatewaySurfaceIds = new Set(gatewayRows.map((row) => row.gateway_surface_id));
  assert(upstreamAudienceSurfaceIds.size === generatedAudienceSurfaceIds.size, "Audience surface coverage count drifted in gateway split matrix.");
  assert(upstreamGatewaySurfaceIds.size === generatedGatewaySurfaceIds.size, "Gateway surface coverage count drifted in gateway split matrix.");
  upstreamAudienceSurfaceIds.forEach((id) => assert(generatedAudienceSurfaceIds.has(id), `Missing audience surface mapping: ${id}`));
  upstreamGatewaySurfaceIds.forEach((id) => assert(generatedGatewaySurfaceIds.has(id), `Missing gateway surface mapping: ${id}`));

  const statePlanes = new Set(stateRows.map((row) => row.state_plane));
  [
    "shell_frame",
    "selected_anchor",
    "decision_dock",
    "server_query_cache",
    "mutation_ack",
    "live_channel",
    "recovery_posture",
    "design_contract_digest",
  ].forEach((plane) => {
    assert(statePlanes.has(plane), `Missing client-state plane: ${plane}`);
  });

  const contractMembers = new Set(contractRows.map((row) => row.publication_bundle_member));
  [
    "DesignTokenExportArtifact",
    "ProfileSelectionResolution",
    "SurfaceStateSemanticsProfile",
    "AccessibilitySemanticCoverageProfile",
    "AutomationAnchorMap",
    "TelemetryBindingProfile",
    "FrontendContractManifest",
    "AudienceSurfaceRuntimeBinding",
  ].forEach((member) => {
    assert(contractMembers.has(member), `Missing contract publication row: ${member}`);
  });

  const coverageIds = new Set(coverageRows.map((row) => row.coverage_id));
  [
    "PW_PATIENT_320",
    "PW_PATIENT_ROUTE_MORPH",
    "PW_WORKSPACE_ROUTE_MORPH",
    "PW_OPERATIONS_PARITY",
    "PW_GOVERNANCE_ROUTE_MORPH",
    "PW_REDUCED_MOTION",
    "PW_A11Y_SMOKE",
  ].forEach((id) => {
    assert(coverageIds.has(id), `Missing Playwright coverage row: ${id}`);
  });
  assert(coverageRows.some((row) => row.viewport_matrix.includes("320")), "Playwright coverage must include 320px.");
  assert(coverageRows.some((row) => row.viewport_matrix.includes("768")), "Playwright coverage must include 768px.");
  assert(coverageRows.some((row) => row.viewport_matrix.includes("1024")), "Playwright coverage must include 1024px.");
  assert(coverageRows.some((row) => row.viewport_matrix.includes("1440")), "Playwright coverage must include 1440px.");

  assert(payload.summary.stack_option_count === stackRows.length, "Payload stack count drifted.");
  assert(payload.summary.gateway_surface_count === gatewayRows.length, "Payload gateway count drifted.");
  assert(payload.summary.client_state_policy_count === stateRows.length, "Payload state policy count drifted.");
  assert(payload.summary.ui_contract_publication_count === contractRows.length, "Payload UI contract count drifted.");
  assert(payload.summary.playwright_coverage_count === coverageRows.length, "Payload Playwright coverage count drifted.");
  assert(payload.summary.shell_demo_count === payload.shell_demos.length, "Payload shell demo count drifted.");
  assert(payload.summary.unresolved_gap_count === 0, "Unexpected frontend gaps present.");
  assert(payload.chosen_stack_option_id === "OPT_REACT_TS_VITE_TANSTACK", "Payload chosen stack drifted.");
  assert(payload.chosen_bff_pattern_option_id === "BFF_ROUTE_FAMILY_SPLIT", "Payload chosen BFF pattern drifted.");
  assert(payload.chosen_contract_publication_posture === "design_and_runtime_bundles_are_published_together", "Contract publication posture drifted.");
}

function validateDocsAndAssets(payload) {
  const stackDoc = readText(path.join(DOCS_DIR, "14_frontend_stack_decision.md"));
  const gatewayDoc = readText(path.join(DOCS_DIR, "14_gateway_bff_pattern_and_surface_split.md"));
  const shellDoc = readText(path.join(DOCS_DIR, "14_shell_and_route_runtime_architecture.md"));
  const designDoc = readText(path.join(DOCS_DIR, "14_design_system_and_contract_publication_strategy.md"));
  const stateDoc = readText(path.join(DOCS_DIR, "14_client_state_data_fetch_and_live_update_baseline.md"));
  const testingDoc = readText(path.join(DOCS_DIR, "14_frontend_testing_and_Playwright_or_other_appropriate_tooling_baseline.md"));
  const visualDoc = readText(path.join(DOCS_DIR, "14_visual_direction_and_showcase_spec.md"));
  const mermaid = readText(path.join(DOCS_DIR, "14_shell_topology_and_bff_map.mmd"));
  const html = readText(path.join(DOCS_DIR, "14_frontend_architecture_showcase.html"));

  [
    stackDoc,
    gatewayDoc,
    shellDoc,
    designDoc,
    stateDoc,
    testingDoc,
    visualDoc,
  ].forEach((text, index) => {
    assert(text.startsWith("# "), `Documentation file ${index + 1} is missing a top-level heading.`);
  });

  assert(stackDoc.includes("OPT_REACT_TS_VITE_TANSTACK"), "Stack doc missing chosen option id.");
  assert(stackDoc.includes("client-first React"), "Stack doc missing browser-runtime rationale.");
  assert(gatewayDoc.includes("BFF_ROUTE_FAMILY_SPLIT"), "Gateway doc missing chosen BFF pattern.");
  assert(gatewayDoc.includes("GatewayBffSurface"), "Gateway doc missing gateway authority law.");
  assert(shellDoc.includes("same shell"), "Shell doc missing same-shell framing.");
  assert(shellDoc.includes("SelectedAnchor"), "Shell doc missing selected-anchor framing.");
  assert(designDoc.includes("DesignTokenExportArtifact"), "Design doc missing contract bundle coverage.");
  assert(designDoc.includes("Finding 118") || designDoc.includes("Finding 118".toLowerCase()) || designDoc.includes("Finding 118 - Token export"), "Design doc should mention Finding 118 closure.");
  assert(stateDoc.includes("MutationCommandContract"), "State doc missing mutation contract law.");
  assert(testingDoc.includes("Playwright"), "Testing doc missing Playwright baseline.");
  assert(visualDoc.includes("Signal Atlas Live / Quiet Clarity"), "Visual doc missing named visual direction.");
  assert(visualDoc.includes("Vecells monogram"), "Visual doc missing monogram spec.");

  assert(mermaid.includes("app_patient_web"), "Mermaid map missing patient app.");
  assert(mermaid.includes("svc_api_gateway"), "Mermaid map missing API gateway.");
  assert(mermaid.includes("gws_governance_shell"), "Mermaid map missing governance gateway surface.");

  assert(!html.includes("__EMBEDDED_JSON__"), "Showcase HTML still contains the JSON placeholder.");
  assert(html.includes("Vecells Frontend Architecture Showcase"), "Showcase HTML title missing.");
  assert(html.includes(payload.frontend_architecture_id), "Showcase payload is not embedded in HTML.");
  SHOWCASE_MARKERS.forEach((marker) => {
    assert(html.includes(marker), `Showcase HTML missing required marker: ${marker}`);
  });
  [
    'src="http://',
    'src="https://',
    'href="http://',
    'href="https://',
    "fonts.googleapis.com",
    "fonts.gstatic.com",
    "unpkg.com",
    "cdn.jsdelivr.net",
  ].forEach((needle) => {
    assert(!html.includes(needle), `Showcase HTML contains forbidden remote asset reference: ${needle}`);
  });
}

function validateShowcasePayload(payload) {
  assert(payload.frontend_architecture_id === "vecells_frontend_architecture_v1", "Unexpected frontend architecture id.");
  assert(payload.mission && payload.mission.includes("Vecells frontend baseline"), "Mission field drifted.");
  assert(Array.isArray(payload.source_precedence) && payload.source_precedence.length >= 10, "Source precedence looks incomplete.");
  assert(payload.source_precedence[0].includes("Continuity key and shell law"), "Source precedence order drifted.");
  const upstream = ensurePrerequisites();
  assert(JSON.stringify(payload.upstream_inputs) === JSON.stringify(upstream), "Upstream input summary drifted.");
  assert(Array.isArray(payload.shell_demos) && payload.shell_demos.length === 4, "Shell demo count drifted.");

  const shellIds = new Set(payload.shell_demos.map((row) => row.shell_id));
  ["patient", "workspace", "operations", "governance"].forEach((id) => {
    assert(shellIds.has(id), `Missing showcase shell demo: ${id}`);
  });

  payload.shell_demos.forEach((shell) => {
    assert(Array.isArray(shell.routes) && shell.routes.length >= 2, `Shell demo needs at least two routes: ${shell.shell_id}`);
    assert(Array.isArray(shell.anchor_options) && shell.anchor_options.length >= 3, `Shell demo anchor options drifted: ${shell.shell_id}`);
    shell.routes.forEach((route) => {
      [
        "route_id",
        "route_family",
        "layout_topology",
        "density_profile",
        "writable_state",
        "design_contract_digest",
        "design_contract_state",
        "design_contract_lint_state",
        "accessibility_coverage_state",
        "semantic_surface",
        "keyboard_model",
        "focus_transition_scope",
        "live_announce_state",
      ].forEach((field) => {
        assert(route[field], `Missing showcase route field ${field} on ${shell.shell_id}:${route.route_id}`);
      });
    });
  });

  const chosenBff = payload.bff_pattern_scorecard.find((row) => row.decision === "chosen");
  assert(chosenBff && chosenBff.option_id === "BFF_ROUTE_FAMILY_SPLIT", "Chosen BFF pattern drifted.");
}

function main() {
  validateDeliverables();
  ensurePrerequisites();
  const html = readText(path.join(DOCS_DIR, "14_frontend_architecture_showcase.html"));
  const payload = extractShowcasePayload(html);
  validateDataArtifacts(payload);
  validateDocsAndAssets(payload);
  validateShowcasePayload(payload);
  console.log(JSON.stringify({
    frontend_architecture_id: payload.frontend_architecture_id,
    checks: [
      "deliverables_exist",
      "prerequisites_stable",
      "csv_counts_and_choices",
      "docs_and_mermaid_content",
      "showcase_markers_and_no_cdn",
      "embedded_payload_integrity"
    ],
    summary: payload.summary
  }, null, 2));
}

main();
