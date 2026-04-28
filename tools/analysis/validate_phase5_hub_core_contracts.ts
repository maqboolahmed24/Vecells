import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const CHECKLIST_PATH = path.join(ROOT, "prompt", "checklist.md");
const PACKAGE_JSON_PATH = path.join(ROOT, "package.json");

const REQUIRED_FILES = [
  path.join(ROOT, "docs", "architecture", "311_phase5_hub_case_and_acting_context_contract.md"),
  path.join(ROOT, "docs", "api", "311_phase5_hub_route_and_command_contract.md"),
  path.join(ROOT, "docs", "security", "311_phase5_org_boundary_and_visibility_rules.md"),
  path.join(ROOT, "docs", "frontend", "311_phase5_hub_state_and_scope_atlas.html"),
  path.join(ROOT, "data", "contracts", "311_network_booking_request.schema.json"),
  path.join(ROOT, "data", "contracts", "311_hub_coordination_case.schema.json"),
  path.join(ROOT, "data", "contracts", "311_hub_coordination_state_machine.json"),
  path.join(ROOT, "data", "contracts", "311_staff_identity_context.schema.json"),
  path.join(ROOT, "data", "contracts", "311_acting_context.schema.json"),
  path.join(ROOT, "data", "contracts", "311_cross_org_visibility_envelope.schema.json"),
  path.join(ROOT, "data", "contracts", "311_hub_visibility_tier_contract.json"),
  path.join(ROOT, "data", "contracts", "311_hub_route_family_registry.yaml"),
  path.join(ROOT, "data", "contracts", "311_hub_event_catalog.json"),
  path.join(ROOT, "data", "analysis", "311_external_reference_notes.json"),
  path.join(ROOT, "data", "analysis", "311_hub_transition_matrix.csv"),
  path.join(ROOT, "data", "analysis", "311_visibility_scope_matrix.csv"),
  path.join(ROOT, "data", "analysis", "311_hub_case_gap_log.json"),
  path.join(ROOT, "data", "contracts", "PHASE5_INTERFACE_GAP_HUB_CORE_POLICY_AND_CAPACITY.json"),
  path.join(ROOT, "data", "contracts", "PHASE5_INTERFACE_GAP_HUB_CORE_CANDIDATE_AND_OFFER.json"),
  path.join(
    ROOT,
    "data",
    "contracts",
    "PHASE5_INTERFACE_GAP_HUB_CORE_COMMIT_AND_CONFIRMATION.json",
  ),
  path.join(
    ROOT,
    "data",
    "contracts",
    "PHASE5_INTERFACE_GAP_HUB_CORE_FALLBACK_AND_VISIBILITY.json",
  ),
  path.join(ROOT, "tools", "analysis", "build_311_phase5_hub_core_contracts.ts"),
  path.join(ROOT, "tools", "analysis", "validate_phase5_hub_core_contracts.ts"),
  path.join(ROOT, "tests", "playwright", "311_hub_state_and_scope_atlas.spec.ts"),
];

const REQUIRED_SCRIPT =
  '"validate:311-phase5-hub-core-contracts": "pnpm exec tsx ./tools/analysis/validate_phase5_hub_core_contracts.ts"';

const REQUIRED_TOP_LEVEL_STATUSES = [
  "hub_requested",
  "intake_validated",
  "queued",
  "claimed",
  "candidate_searching",
  "candidates_ready",
  "coordinator_selecting",
  "candidate_revalidating",
  "native_booking_pending",
  "confirmation_pending",
  "booked_pending_practice_ack",
  "booked",
  "closed",
];

const REQUIRED_BRANCH_STATUSES = [
  "alternatives_offered",
  "patient_choice_pending",
  "callback_transfer_pending",
  "callback_offered",
  "escalated_back",
];

const REQUIRED_TRANSITIONS = [
  ["hub_requested", "intake_validated"],
  ["intake_validated", "queued"],
  ["queued", "claimed"],
  ["claimed", "candidate_searching"],
  ["candidate_searching", "candidates_ready"],
  ["candidates_ready", "coordinator_selecting"],
  ["candidates_ready", "alternatives_offered"],
  ["alternatives_offered", "patient_choice_pending"],
  ["coordinator_selecting", "candidate_revalidating"],
  ["candidate_revalidating", "native_booking_pending"],
  ["native_booking_pending", "confirmation_pending"],
  ["native_booking_pending", "booked_pending_practice_ack"],
  ["confirmation_pending", "booked_pending_practice_ack"],
  ["booked_pending_practice_ack", "booked"],
  ["booked", "closed"],
  ["callback_transfer_pending", "callback_offered"],
  ["callback_offered", "closed"],
  ["escalated_back", "closed"],
];

const REQUIRED_AUDIENCE_TIERS = [
  "origin_practice_visibility",
  "hub_desk_visibility",
  "servicing_site_visibility",
];

const REQUIRED_EVENT_NAMES = [
  "hub.request.created",
  "hub.case.created",
  "hub.case.claimed",
  "hub.case.released",
  "hub.case.transfer_started",
  "hub.case.transfer_accepted",
  "hub.capacity.snapshot.created",
  "hub.candidates.rank_completed",
  "hub.offer.created",
  "hub.offer.accepted",
  "hub.booking.native_started",
  "hub.booking.confirmation_pending",
  "hub.booking.externally_confirmed",
  "hub.practice.notified",
  "hub.practice.acknowledged",
  "hub.patient.notified",
  "hub.callback.transfer_pending",
  "hub.callback.offered",
  "hub.escalated.back",
  "hub.queue.overload_critical",
  "hub.case.closed",
];

const REQUIRED_API_PATHS = [
  "/v1/hub/requests",
  "/v1/hub/cases/{hubCoordinationCaseId}",
  "/v1/hub/cases/{hubCoordinationCaseId}:claim",
  "/v1/hub/cases/{hubCoordinationCaseId}:transfer-ownership",
  "/v1/hub/cases/{hubCoordinationCaseId}:refresh-candidates",
  "/v1/hub/cases/{hubCoordinationCaseId}:offer-alternatives",
  "/v1/hub/cases/{hubCoordinationCaseId}:commit-native-booking",
  "/v1/hub/cases/{hubCoordinationCaseId}:return-to-practice",
  "/v1/hub/cases/{hubCoordinationCaseId}:close",
];

const REQUIRED_EXTERNAL_URLS = [
  "https://digital.nhs.uk/services/care-identity-service",
  "https://digital.nhs.uk/services/care-identity-service/applications-and-services/cis2-authentication/authenticators",
  "https://digital.nhs.uk/services/care-identity-service/setting-up-and-troubleshooting",
  "https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html",
  "https://www.w3.org/WAI/ARIA/apg/patterns/tabs/",
  "https://service-manual.nhs.uk/design-system/components/table",
  "https://service-manual.nhs.uk/design-system/components/tabs",
  "https://playwright.dev/docs/best-practices",
  "https://playwright.dev/docs/aria-snapshots",
  "https://linear.app/docs/triage",
  "https://vercel.com/docs/dashboard-features",
  "https://carbondesignsystem.com/components/data-table/usage/",
  "https://carbondesignsystem.com/community/patterns/create-flows/",
];

function read(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    throw new Error(`MISSING_REQUIRED_FILE:${path.relative(ROOT, filePath)}`);
  }
  return fs.readFileSync(filePath, "utf8");
}

function parseJson(filePath: string) {
  return JSON.parse(read(filePath));
}

function requireCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function parseCsv(text: string) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  requireCondition(lines.length > 1, "CSV_MISSING_ROWS");
  const parseLine = (line: string) => {
    const cells: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      const next = line[index + 1];
      if (char === '"' && inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        cells.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    cells.push(current);
    return cells;
  };

  const headers = parseLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function validateChecklist() {
  const checklist = read(CHECKLIST_PATH);
  requireCondition(
    checklist.includes(
      "- [-] seq_311_phase5_freeze_network_coordination_contract_org_boundaries_and_acting_context_rules",
    ) ||
      checklist.includes(
        "- [X] seq_311_phase5_freeze_network_coordination_contract_org_boundaries_and_acting_context_rules",
      ),
    "CHECKLIST_ROW_MISSING_OR_UNCLAIMED:seq_311",
  );
}

function validatePackageScript() {
  const packageJson = read(PACKAGE_JSON_PATH);
  requireCondition(packageJson.includes(REQUIRED_SCRIPT), "PACKAGE_SCRIPT_MISSING:validate:311");
}

function validateStateMachine() {
  const stateMachine = parseJson(
    path.join(ROOT, "data", "contracts", "311_hub_coordination_state_machine.json"),
  );
  requireCondition(stateMachine.taskId === "seq_311", "STATE_MACHINE_TASK_ID_DRIFT");
  requireCondition(
    stateMachine.aggregate === "HubCoordinationCase",
    "STATE_MACHINE_AGGREGATE_DRIFT",
  );
  requireCondition(
    stateMachine.closureAuthority === "LifecycleCoordinator",
    "STATE_MACHINE_CLOSURE_AUTHORITY_DRIFT",
  );

  const stateIds = new Set(stateMachine.states.map((entry: { stateId: string }) => entry.stateId));
  for (const status of [...REQUIRED_TOP_LEVEL_STATUSES, ...REQUIRED_BRANCH_STATUSES]) {
    requireCondition(stateIds.has(status), `STATE_MISSING:${status}`);
  }

  const transitionKeys = new Set(
    stateMachine.transitions.map(
      (entry: { from: string; to: string }) => `${entry.from}->${entry.to}`,
    ),
  );
  for (const [from, to] of REQUIRED_TRANSITIONS) {
    requireCondition(transitionKeys.has(`${from}->${to}`), `TRANSITION_MISSING:${from}->${to}`);
  }

  requireCondition(
    Array.isArray(stateMachine.transitions) && stateMachine.transitions.length >= 42,
    "TRANSITION_COUNT_DRIFT",
  );
  requireCondition(
    stateMachine.openCaseBlockersRule?.blockerCatalogRefs?.includes("practice_ack_debt_open"),
    "BLOCKER_RULE_MISSING:PRACTICE_ACK_DEBT",
  );
}

function validateSchemas() {
  const bookingRequest = parseJson(
    path.join(ROOT, "data", "contracts", "311_network_booking_request.schema.json"),
  );
  requireCondition(
    bookingRequest.required.includes("requestLineageRef") &&
      bookingRequest.required.includes("originBookingCaseId") &&
      bookingRequest.required.includes("reasonForHubRouting"),
    "NETWORK_BOOKING_REQUEST_REQUIRED_FIELDS_DRIFT",
  );

  const hubCase = parseJson(
    path.join(ROOT, "data", "contracts", "311_hub_coordination_case.schema.json"),
  );
  const hubStatusEnum = new Set(hubCase.properties.status.enum);
  for (const status of [...REQUIRED_TOP_LEVEL_STATUSES, ...REQUIRED_BRANCH_STATUSES]) {
    requireCondition(hubStatusEnum.has(status), `HUB_CASE_STATUS_ENUM_MISSING:${status}`);
  }
  for (const field of [
    "lineageCaseLinkRef",
    "parentLineageCaseLinkRef",
    "ownershipFenceToken",
    "practiceAckGeneration",
    "openCaseBlockerRefs",
  ]) {
    requireCondition(hubCase.required.includes(field), `HUB_CASE_REQUIRED_FIELD_MISSING:${field}`);
  }

  const staffIdentity = parseJson(
    path.join(ROOT, "data", "contracts", "311_staff_identity_context.schema.json"),
  );
  requireCondition(
    staffIdentity.properties.authProvider.const === "cis2",
    "STAFF_IDENTITY_AUTH_PROVIDER_DRIFT",
  );

  const actingContext = parseJson(
    path.join(ROOT, "data", "contracts", "311_acting_context.schema.json"),
  );
  for (const tierId of REQUIRED_AUDIENCE_TIERS) {
    requireCondition(
      actingContext.properties.audienceTierRef.enum.includes(tierId),
      `ACTING_CONTEXT_AUDIENCE_TIER_MISSING:${tierId}`,
    );
  }
  requireCondition(
    actingContext.properties.purposeOfUse.enum.includes("direct_care_network_coordination"),
    "ACTING_CONTEXT_PURPOSE_OF_USE_DRIFT",
  );

  const visibilityEnvelope = parseJson(
    path.join(ROOT, "data", "contracts", "311_cross_org_visibility_envelope.schema.json"),
  );
  requireCondition(
    visibilityEnvelope.properties.envelopeState.enum.includes("current") &&
      visibilityEnvelope.properties.envelopeState.enum.includes("stale"),
    "VISIBILITY_ENVELOPE_STATE_DRIFT",
  );
}

function validateVisibilityContract() {
  const contract = parseJson(
    path.join(ROOT, "data", "contracts", "311_hub_visibility_tier_contract.json"),
  );
  requireCondition(
    Array.isArray(contract.audienceTiers) && contract.audienceTiers.length === 3,
    "AUDIENCE_TIER_COUNT_DRIFT",
  );
  const tierIds = new Set(contract.audienceTiers.map((entry: { tierId: string }) => entry.tierId));
  for (const tierId of REQUIRED_AUDIENCE_TIERS) {
    requireCondition(tierIds.has(tierId), `AUDIENCE_TIER_MISSING:${tierId}`);
  }
  requireCondition(
    contract.commandEnvelopeRequirements.some((entry: string) => entry.includes("ActingContext")),
    "VISIBILITY_CONTRACT_ACTING_CONTEXT_RULE_MISSING",
  );
}

function validateRouteRegistry() {
  const yaml = read(path.join(ROOT, "data", "contracts", "311_hub_route_family_registry.yaml"));
  requireCondition(yaml.includes("shellType: hub"), "ROUTE_REGISTRY_SHELL_TYPE_DRIFT");
  requireCondition(yaml.includes("rootRouteId: hub_case_detail"), "ROUTE_REGISTRY_ROOT_DRIFT");
  const routeCount = (yaml.match(/routeId:/g) || []).length;
  requireCondition(routeCount === 5, "ROUTE_REGISTRY_COUNT_DRIFT");
  for (const routePath of [
    "/hub/queue",
    "/hub/case/:hubCoordinationCaseId",
    "/hub/alternatives/:offerSessionId",
    "/hub/exceptions",
    "/hub/audit/:hubCoordinationCaseId",
  ]) {
    requireCondition(yaml.includes(routePath), `ROUTE_PATH_MISSING:${routePath}`);
  }
  requireCondition(yaml.includes("same_family_root"), "ROUTE_REGISTRY_MISSING_CASE_ROOT");
  requireCondition(yaml.includes("commandRefs: []"), "ROUTE_REGISTRY_EMPTY_ARRAY_DRIFT");
}

function validateEventCatalog() {
  const catalog = parseJson(path.join(ROOT, "data", "contracts", "311_hub_event_catalog.json"));
  requireCondition(catalog.aggregate === "HubCoordinationCase", "EVENT_CATALOG_AGGREGATE_DRIFT");
  requireCondition(
    Array.isArray(catalog.events) && catalog.events.length === REQUIRED_EVENT_NAMES.length,
    "EVENT_COUNT_DRIFT",
  );
  const eventNames = new Set(catalog.events.map((entry: { eventName: string }) => entry.eventName));
  for (const eventName of REQUIRED_EVENT_NAMES) {
    requireCondition(eventNames.has(eventName), `EVENT_NAME_MISSING:${eventName}`);
  }
  requireCondition(
    Array.isArray(catalog.apiSurface) && catalog.apiSurface.length === REQUIRED_API_PATHS.length,
    "API_SURFACE_COUNT_DRIFT",
  );
  const apiPaths = new Set(catalog.apiSurface.map((entry: { path: string }) => entry.path));
  for (const apiPath of REQUIRED_API_PATHS) {
    requireCondition(apiPaths.has(apiPath), `API_PATH_MISSING:${apiPath}`);
  }
}

function validateExternalNotes() {
  const notes = parseJson(path.join(ROOT, "data", "analysis", "311_external_reference_notes.json"));
  requireCondition(
    notes.taskId ===
      "seq_311_phase5_freeze_network_coordination_contract_org_boundaries_and_acting_context_rules",
    "EXTERNAL_NOTES_TASK_ID_DRIFT",
  );
  const reviewedUrls = new Set(
    (notes.sourcesReviewed ?? []).map((entry: { url: string }) => entry.url),
  );
  for (const url of REQUIRED_EXTERNAL_URLS) {
    requireCondition(reviewedUrls.has(url), `EXTERNAL_URL_MISSING:${url}`);
  }
}

function validateMatrices() {
  const transitions = parseCsv(
    read(path.join(ROOT, "data", "analysis", "311_hub_transition_matrix.csv")),
  );
  requireCondition(transitions.length >= 42, "TRANSITION_MATRIX_COUNT_DRIFT");
  requireCondition(
    transitions.some(
      (row) =>
        row.transitionId === "H311_039" &&
        row.fromStatus === "callback_transfer_pending" &&
        row.toStatus === "callback_offered",
    ),
    "TRANSITION_MATRIX_CALLBACK_EDGE_DRIFT",
  );

  const visibilityRows = parseCsv(
    read(path.join(ROOT, "data", "analysis", "311_visibility_scope_matrix.csv")),
  );
  requireCondition(visibilityRows.length === 24, "VISIBILITY_MATRIX_COUNT_DRIFT");
  requireCondition(
    visibilityRows.some(
      (row) =>
        row.tierId === "origin_practice_visibility" &&
        row.fieldRef === "hub_internal_free_text" &&
        row.visibility === "withheld",
    ),
    "VISIBILITY_MATRIX_ORIGIN_WITHHOLDING_DRIFT",
  );
  requireCondition(
    visibilityRows.some(
      (row) =>
        row.tierId === "servicing_site_visibility" &&
        row.fieldRef === "site_local_capacity" &&
        row.visibility === "visible",
    ),
    "VISIBILITY_MATRIX_SERVICING_SITE_DRIFT",
  );
}

function validateGapLogAndSeams() {
  const gapLog = parseJson(path.join(ROOT, "data", "analysis", "311_hub_case_gap_log.json"));
  requireCondition(Array.isArray(gapLog.gaps) && gapLog.gaps.length === 4, "GAP_LOG_COUNT_DRIFT");
  for (const seamId of [
    "PHASE5_INTERFACE_GAP_HUB_CORE_POLICY_AND_CAPACITY",
    "PHASE5_INTERFACE_GAP_HUB_CORE_CANDIDATE_AND_OFFER",
    "PHASE5_INTERFACE_GAP_HUB_CORE_COMMIT_AND_CONFIRMATION",
    "PHASE5_INTERFACE_GAP_HUB_CORE_FALLBACK_AND_VISIBILITY",
  ]) {
    requireCondition(
      gapLog.gaps.some((entry: { seamId: string }) => entry.seamId === seamId),
      `GAP_LOG_ENTRY_MISSING:${seamId}`,
    );
  }

  const policySeam = parseJson(
    path.join(ROOT, "data", "contracts", "PHASE5_INTERFACE_GAP_HUB_CORE_POLICY_AND_CAPACITY.json"),
  );
  requireCondition(policySeam.ownerTask === "seq_312", "SEAM_OWNER_DRIFT:POLICY");

  const commitSeam = parseJson(
    path.join(
      ROOT,
      "data",
      "contracts",
      "PHASE5_INTERFACE_GAP_HUB_CORE_COMMIT_AND_CONFIRMATION.json",
    ),
  );
  requireCondition(
    commitSeam.requiredObjects.some(
      (entry: { objectName: string }) =>
        entry.objectName === "HubOfferToConfirmationTruthProjection",
    ),
    "COMMIT_SEAM_TRUTH_OBJECT_MISSING",
  );
}

function validateDocs() {
  const architecture = read(
    path.join(ROOT, "docs", "architecture", "311_phase5_hub_case_and_acting_context_contract.md"),
  );
  requireCondition(
    architecture.includes(
      "`BookingCase.lineageCaseLinkRef` remains the canonical Phase 4 booking branch.",
    ),
    "ARCH_LINEAGE_RULE_MISSING",
  );
  requireCondition(
    architecture.includes("Typed later-owned seams"),
    "ARCH_TYPED_SEAM_SECTION_MISSING",
  );

  const api = read(path.join(ROOT, "docs", "api", "311_phase5_hub_route_and_command_contract.md"));
  requireCondition(
    api.includes("`/v1/hub/cases/{hubCoordinationCaseId}`"),
    "API_READ_ROUTE_MISSING",
  );
  requireCondition(api.includes("Command-envelope law"), "API_ENVELOPE_SECTION_MISSING");

  const security = read(
    path.join(ROOT, "docs", "security", "311_phase5_org_boundary_and_visibility_rules.md"),
  );
  requireCondition(
    security.includes("`ActingContext.scopeTupleHash`"),
    "SECURITY_SCOPE_TUPLE_RULE_MISSING",
  );
  requireCondition(security.includes("Visibility tiers"), "SECURITY_VISIBILITY_SECTION_MISSING");
}

function validateAtlas() {
  const atlas = read(
    path.join(ROOT, "docs", "frontend", "311_phase5_hub_state_and_scope_atlas.html"),
  );
  for (const token of [
    'data-testid="Phase5HubAtlas"',
    'data-testid="LineageDiagram"',
    'data-testid="VisibilityMatrixVisual"',
    'data-testid="RouteFamilyTable"',
    'data-testid="CommandTable"',
    'data-testid="AudienceParityTable"',
    "--canvas: #f7f8fa;",
    "grid-template-columns: 300px minmax(0, 1fr) 420px;",
    "max-width: 1720px;",
    "prefers-reduced-motion",
    "window.__phase5HubAtlasData = { loaded: true",
  ]) {
    requireCondition(atlas.includes(token), `ATLAS_TOKEN_MISSING:${token}`);
  }
}

function main() {
  for (const filePath of REQUIRED_FILES) {
    read(filePath);
  }
  validateChecklist();
  validatePackageScript();
  validateStateMachine();
  validateSchemas();
  validateVisibilityContract();
  validateRouteRegistry();
  validateEventCatalog();
  validateExternalNotes();
  validateMatrices();
  validateGapLogAndSeams();
  validateDocs();
  validateAtlas();
  console.log("validate_phase5_hub_core_contracts: ok");
}

main();
