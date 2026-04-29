import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  PATIENT_APPOINTMENT_FAMILY_VISUAL_MODE,
  UnifiedAppointmentFamilyResolver,
  appointmentFamilyStateMatrix337,
} from "../../apps/patient-web/src/patient-appointment-family-workspace.model.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const REQUIRED_FILES = [
  path.join(ROOT, "apps", "patient-web", "src", "patient-appointment-family-workspace.model.ts"),
  path.join(ROOT, "apps", "patient-web", "src", "patient-appointment-family-workspace.tsx"),
  path.join(ROOT, "apps", "patient-web", "src", "patient-appointment-family-workspace.css"),
  path.join(ROOT, "apps", "patient-web", "src", "App.tsx"),
  path.join(ROOT, "apps", "patient-web", "src", "patient-home-requests-detail-routes.tsx"),
  path.join(ROOT, "apps", "patient-web", "src", "patient-network-alternative-choice.tsx"),
  path.join(ROOT, "docs", "architecture", "337_network_local_booking_and_patient_manage_merge.md"),
  path.join(ROOT, "docs", "frontend", "337_network_local_booking_and_patient_manage_merge_atlas.html"),
  path.join(ROOT, "docs", "frontend", "337_appointment_family_topology.mmd"),
  path.join(ROOT, "docs", "frontend", "337_appointment_family_tokens.json"),
  path.join(ROOT, "docs", "accessibility", "337_appointment_family_a11y_notes.md"),
  path.join(ROOT, "data", "contracts", "337_network_local_appointment_family_contract.json"),
  path.join(ROOT, "data", "analysis", "337_algorithm_alignment_notes.md"),
  path.join(ROOT, "data", "analysis", "337_appointment_family_state_matrix.csv"),
  path.join(ROOT, "data", "analysis", "337_visual_reference_notes.json"),
  path.join(ROOT, "tests", "integration", "337_downstream_truth_and_route_resolution.spec.ts"),
  path.join(ROOT, "tests", "playwright", "337_appointment_family.helpers.ts"),
  path.join(ROOT, "tests", "playwright", "337_appointment_family_list_and_detail.spec.ts"),
  path.join(ROOT, "tests", "playwright", "337_appointment_manage_entry_resolution.spec.ts"),
  path.join(ROOT, "tests", "playwright", "337_appointment_family_timeline_and_recovery.spec.ts")
];

const REQUIRED_SCRIPT =
  '"validate:337-appointment-family-merge": "pnpm exec tsx ./tools/analysis/validate_337_appointment_family_merge.ts"';

function requireCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function read(filePath: string): string {
  requireCondition(fs.existsSync(filePath), `MISSING_REQUIRED_FILE:${path.relative(ROOT, filePath)}`);
  return fs.readFileSync(filePath, "utf8");
}

function validateFiles(): void {
  for (const filePath of REQUIRED_FILES) {
    read(filePath);
  }
}

function validateChecklist(): void {
  const checklist = read(path.join(ROOT, "prompt", "checklist.md"));
  requireCondition(
    checklist.includes(
      "- [-] seq_337_phase5_merge_Playwright_or_other_appropriate_tooling_integrate_network_coordination_with_local_booking_and_patient_portal_manage_flows",
    ) ||
      checklist.includes(
        "- [X] seq_337_phase5_merge_Playwright_or_other_appropriate_tooling_integrate_network_coordination_with_local_booking_and_patient_portal_manage_flows",
      ),
    "CHECKLIST_ROW_MISSING_OR_UNCLAIMED:seq_337",
  );
}

function validatePackageScript(): void {
  const packageJson = read(path.join(ROOT, "package.json"));
  requireCondition(
    packageJson.includes(REQUIRED_SCRIPT),
    "PACKAGE_SCRIPT_MISSING:validate:337-appointment-family-merge",
  );
}

function validateFrontendFiles(): void {
  const model = read(
    path.join(ROOT, "apps", "patient-web", "src", "patient-appointment-family-workspace.model.ts"),
  );
  const app = read(path.join(ROOT, "apps", "patient-web", "src", "App.tsx"));
  const view = read(
    path.join(ROOT, "apps", "patient-web", "src", "patient-appointment-family-workspace.tsx"),
  );
  const requestDetail = read(
    path.join(ROOT, "apps", "patient-web", "src", "patient-home-requests-detail-routes.tsx"),
  );
  const networkChoice = read(
    path.join(ROOT, "apps", "patient-web", "src", "patient-network-alternative-choice.tsx"),
  );

  for (const marker of [
    "UnifiedAppointmentFamilyResolver",
    "AppointmentManageEntryResolver",
    "NetworkLocalContinuityBinder",
    "appointmentsWorkspaceHref337",
    "appointmentFamilyStateMatrix337",
  ]) {
    requireCondition(model.includes(marker), `MODEL_MARKER_MISSING:${marker}`);
  }

  for (const marker of [
    "PatientAppointmentFamilyRow",
    "PatientRequestDownstreamWorkRail",
    "AppointmentFamilyStatusChip",
    "HubFallbackRibbon",
    "AppointmentFamilyTimelineBridge",
    "HubLocalReturnAnchorReceipt",
    'data-testid="PatientAppointmentFamilyWorkspace"',
    'data-testid="AppointmentManageEntryResolver"',
    'data-testid="AppointmentFamilyTimelineBridge"',
    'data-testid="HubFallbackRibbon"',
    'data-testid="HubLocalReturnAnchorReceipt"',
  ]) {
    requireCondition(view.includes(marker), `VIEW_MARKER_MISSING:${marker}`);
  }

  requireCondition(
    app.includes("PatientAppointmentFamilyWorkspace") &&
      app.includes('pathname === "/appointments"'),
    "PATIENT_APP_APPOINTMENT_FAMILY_ROUTE_MISSING",
  );
  requireCondition(
    requestDetail.includes("PatientRequestDownstreamWorkRail"),
    "REQUEST_DETAIL_DOWNSTREAM_FAMILY_INTEGRATION_MISSING",
  );
  requireCondition(
    networkChoice.includes("data-return-route-ref={returnContract.returnRouteRef}") &&
      networkChoice.includes("data-origin-key={returnContract.originKey}"),
    "NETWORK_CHOICE_RETURN_CONTRACT_MARKERS_MISSING",
  );
}

function validateArtifacts(): void {
  const architecture = read(
    path.join(ROOT, "docs", "architecture", "337_network_local_booking_and_patient_manage_merge.md"),
  );
  const atlas = read(
    path.join(ROOT, "docs", "frontend", "337_network_local_booking_and_patient_manage_merge_atlas.html"),
  );
  const topology = read(path.join(ROOT, "docs", "frontend", "337_appointment_family_topology.mmd"));
  const a11y = read(path.join(ROOT, "docs", "accessibility", "337_appointment_family_a11y_notes.md"));
  const alignment = read(path.join(ROOT, "data", "analysis", "337_algorithm_alignment_notes.md"));
  const matrix = read(path.join(ROOT, "data", "analysis", "337_appointment_family_state_matrix.csv"));
  const notes = JSON.parse(
    read(path.join(ROOT, "data", "analysis", "337_visual_reference_notes.json")),
  ) as {
    taskId?: string;
    visualMode?: string;
    sources?: Array<{ url?: string; category?: string }>;
  };
  const tokens = JSON.parse(
    read(path.join(ROOT, "docs", "frontend", "337_appointment_family_tokens.json")),
  ) as {
    taskId?: string;
    visualMode?: string;
    layout?: { appointmentsListRailWidthPx?: number; mainWorkspaceMinPx?: number; secondaryDetailRailWidthPx?: number; contentMaxWidthPx?: number; cardStackGapPx?: number };
    motion?: { familyRowToDetailMorphMs?: number; manageEntryTransitionMs?: number; fallbackRibbonRevealMs?: number; reducedMotion?: boolean };
  };
  const contract = JSON.parse(
    read(path.join(ROOT, "data", "contracts", "337_network_local_appointment_family_contract.json")),
  ) as {
    taskId?: string;
    visualMode?: string;
    components?: string[];
    truthSources?: string[];
    domMarkers?: string[];
    laws?: Record<string, boolean>;
  };

  requireCondition(
    architecture.includes("Unified_Appointment_Family_Workspace") &&
      architecture.includes("BookingConfirmationTruthProjection") &&
      architecture.includes("HubOfferToConfirmationTruthProjection") &&
      architecture.includes("AppointmentManageEntryResolver"),
    "ARCHITECTURE_DOC_CORE_LAWS_MISSING",
  );
  requireCondition(
    atlas.includes('data-testid="UnifiedAppointmentFamilyAtlas"') &&
      atlas.includes('data-visual-mode="Unified_Appointment_Family_Workspace"') &&
      atlas.includes("PatientRequestDownstreamWorkRail") &&
      atlas.includes("HubFallbackRibbon"),
    "ATLAS_CORE_MARKERS_MISSING",
  );
  requireCondition(
    topology.includes('B["UnifiedAppointmentFamilyResolver"]') &&
      topology.includes('G["AppointmentManageEntryResolver -> local manage route"]') &&
      topology.includes('J["network choice route / callback recovery"]') &&
      topology.includes('L["HubLocalReturnAnchorReceipt -> PatientAppointmentFamilyWorkspace"]'),
    "TOPOLOGY_CORE_NODES_MISSING",
  );
  requireCondition(
    a11y.includes("Playwright trace capture") ||
      a11y.includes("trace artifacts on failure"),
    "A11Y_PROOF_NOTES_MISSING",
  );
  requireCondition(
    alignment.includes("family_network_live") &&
      alignment.includes("Confirmation pending") &&
      alignment.includes("PatientRequestDownstreamWorkRail"),
    "ALGORITHM_ALIGNMENT_NOTES_INCOMPLETE",
  );
  requireCondition(
    matrix.includes("default,family_network_live,network_appointment,HubOfferToConfirmationTruthProjection,Appointment confirmed,Practice informed") &&
      matrix.includes("pending,family_network_live,network_appointment,HubOfferToConfirmationTruthProjection,Confirmation pending,Manage summary only"),
    "STATE_MATRIX_ROWS_MISSING",
  );

  requireCondition(tokens.taskId === "seq_337", "TOKENS_TASK_ID_INVALID");
  requireCondition(tokens.visualMode === PATIENT_APPOINTMENT_FAMILY_VISUAL_MODE, "TOKENS_VISUAL_MODE_INVALID");
  requireCondition(
    tokens.layout?.appointmentsListRailWidthPx === 344 &&
      tokens.layout?.mainWorkspaceMinPx === 680 &&
      tokens.layout?.secondaryDetailRailWidthPx === 320 &&
      tokens.layout?.contentMaxWidthPx === 1280 &&
      tokens.layout?.cardStackGapPx === 16,
    "TOKENS_LAYOUT_VALUES_INVALID",
  );
  requireCondition(
    tokens.motion?.familyRowToDetailMorphMs === 160 &&
      tokens.motion?.manageEntryTransitionMs === 180 &&
      tokens.motion?.fallbackRibbonRevealMs === 140 &&
      tokens.motion?.reducedMotion === true,
    "TOKENS_MOTION_VALUES_INVALID",
  );

  requireCondition(contract.taskId === "seq_337", "CONTRACT_TASK_ID_INVALID");
  requireCondition(contract.visualMode === PATIENT_APPOINTMENT_FAMILY_VISUAL_MODE, "CONTRACT_VISUAL_MODE_INVALID");
  for (const component of [
    "UnifiedAppointmentFamilyResolver",
    "PatientAppointmentFamilyRow",
    "PatientRequestDownstreamWorkRail",
    "AppointmentFamilyStatusChip",
    "AppointmentManageEntryResolver",
    "NetworkLocalContinuityBinder",
    "HubFallbackRibbon",
    "AppointmentFamilyTimelineBridge",
    "PatientAppointmentFamilyWorkspace",
    "HubLocalReturnAnchorReceipt",
  ]) {
    requireCondition(contract.components?.includes(component), `CONTRACT_COMPONENT_MISSING:${component}`);
  }
  for (const truthSource of [
    "BookingConfirmationTruthProjection",
    "HubOfferToConfirmationTruthProjection",
  ]) {
    requireCondition(contract.truthSources?.includes(truthSource), `CONTRACT_TRUTH_SOURCE_MISSING:${truthSource}`);
  }
  requireCondition(
    contract.domMarkers?.includes("data-return-route-ref") &&
      contract.laws?.objectPresenceDoesNotImplyCalmConfirmation === true &&
      contract.laws?.equivalentTruthUsesEquivalentWording === true &&
      contract.laws?.fallbackPreservesAnchorAndReturnTarget === true,
    "CONTRACT_LAWS_OR_MARKERS_INVALID",
  );

  const sourceUrls = new Set((notes.sources ?? []).map((source) => source.url));
  requireCondition(notes.taskId === "seq_337", "VISUAL_NOTES_TASK_ID_INVALID");
  requireCondition(notes.visualMode === PATIENT_APPOINTMENT_FAMILY_VISUAL_MODE, "VISUAL_NOTES_MODE_INVALID");
  for (const url of [
    "https://service-manual.nhs.uk/design-system/patterns/confirmation-page",
    "https://service-manual.nhs.uk/design-system/patterns/check-answers",
    "https://service-manual.nhs.uk/design-system/patterns/question-pages",
    "https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration",
    "https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/",
    "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/",
    "https://www.w3.org/WAI/WCAG22/Understanding/reflow",
    "https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum",
    "https://playwright.dev/docs/best-practices",
    "https://playwright.dev/docs/aria-snapshots",
    "https://playwright.dev/docs/test-snapshots",
    "https://playwright.dev/docs/trace-viewer-intro",
    "https://linear.app/now/behind-the-latest-design-refresh",
  ]) {
    requireCondition(sourceUrls.has(url), `VISUAL_REFERENCE_MISSING:${url}`);
  }
}

function validateRuntime(): void {
  const defaultWorkspace = UnifiedAppointmentFamilyResolver({ variant: "default" });
  requireCondition(defaultWorkspace.visualMode === PATIENT_APPOINTMENT_FAMILY_VISUAL_MODE, "WORKSPACE_MODE_INVALID");
  requireCondition(defaultWorkspace.rows.length === 4, "WORKSPACE_ROW_COUNT_INVALID");

  const local = defaultWorkspace.rows.find((row) => row.familyRef === "family_local_confirmed");
  const network = defaultWorkspace.rows.find((row) => row.familyRef === "family_network_live");
  const waitlist = defaultWorkspace.rows.find((row) => row.familyRef === "family_waitlist_fallback_due");
  const callback = defaultWorkspace.rows.find((row) => row.familyRef === "family_callback_follow_on");

  requireCondition(local?.truthSource === "BookingConfirmationTruthProjection", "LOCAL_TRUTH_SOURCE_INVALID");
  requireCondition(network?.truthSource === "HubOfferToConfirmationTruthProjection", "NETWORK_TRUTH_SOURCE_INVALID");
  requireCondition(local?.status.primaryLabel === "Appointment confirmed", "LOCAL_CONFIRMED_WORDING_INVALID");
  requireCondition(
    network?.status.primaryLabel === "Appointment confirmed" &&
      network.status.secondaryLabel === "Practice informed",
    "NETWORK_CONFIRMED_WORDING_INVALID",
  );
  requireCondition(
    waitlist?.manageEntry.resolutionKind === "network_choice" &&
      waitlist.manageEntry.routeRef?.includes("/bookings/network/offer_session_328_live") &&
      waitlist.fallback?.headline === "Fallback is now the governing path",
    "WAITLIST_FALLBACK_ROUTING_INVALID",
  );
  requireCondition(
    callback?.status.primaryLabel === "Choice set visible" &&
      callback.manageEntry.resolutionKind === "network_choice",
    "CALLBACK_FAMILY_RULES_INVALID",
  );

  const pendingWorkspace = UnifiedAppointmentFamilyResolver({
    variant: "pending",
    selectedFamilyRef: "family_network_live",
  });
  requireCondition(
    pendingWorkspace.selectedRow.status.primaryLabel === "Confirmation pending" &&
      pendingWorkspace.selectedRow.manageEntry.resolutionKind === "read_only" &&
      pendingWorkspace.selectedRow.manageEntry.staleCtaSuppressed === true &&
      pendingWorkspace.selectedRow.manageEntry.routeRef?.includes("network_manage_330_read_only"),
    "PENDING_NETWORK_RULES_INVALID",
  );

  const requestWorkspace = UnifiedAppointmentFamilyResolver({
    entrySource: "request_detail",
    requestContextRef: "request_211_a",
    selectedFamilyRef: "family_waitlist_fallback_due",
  });
  requireCondition(
    requestWorkspace.entrySource === "request_detail" &&
      requestWorkspace.requestContextRef === "request_211_a" &&
      requestWorkspace.selectedRow.familyRef === "family_waitlist_fallback_due",
    "REQUEST_DETAIL_WORKSPACE_CONTEXT_INVALID",
  );

  const matrix = appointmentFamilyStateMatrix337();
  requireCondition(matrix.length === 8, "STATE_MATRIX_RUNTIME_LENGTH_INVALID");
}

function main(): void {
  validateFiles();
  validateChecklist();
  validatePackageScript();
  validateFrontendFiles();
  validateArtifacts();
  validateRuntime();
  console.log("337 appointment family merge validation passed.");
}

main();
