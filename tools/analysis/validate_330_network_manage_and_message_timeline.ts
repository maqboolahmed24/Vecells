import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  PATIENT_NETWORK_MANAGE_VISUAL_MODE,
  resolvePatientNetworkManageProjectionByScenarioId,
} from "../../apps/patient-web/src/patient-network-manage.model.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const REQUIRED_FILES = [
  path.join(ROOT, "packages", "domain-kernel", "src", "phase5-network-manage-preview.ts"),
  path.join(ROOT, "apps", "patient-web", "src", "patient-network-manage.model.ts"),
  path.join(ROOT, "apps", "patient-web", "src", "patient-network-manage.tsx"),
  path.join(ROOT, "apps", "patient-web", "src", "patient-network-manage.css"),
  path.join(ROOT, "docs", "frontend", "330_network_manage_and_message_timeline_spec.md"),
  path.join(ROOT, "docs", "frontend", "330_network_manage_and_message_timeline_atlas.html"),
  path.join(ROOT, "docs", "frontend", "330_network_manage_and_message_timeline_topology.mmd"),
  path.join(ROOT, "docs", "frontend", "330_network_manage_and_message_timeline_tokens.json"),
  path.join(ROOT, "docs", "accessibility", "330_network_manage_and_message_timeline_a11y_notes.md"),
  path.join(ROOT, "data", "contracts", "330_network_manage_and_message_timeline_contract.json"),
  path.join(ROOT, "data", "analysis", "330_algorithm_alignment_notes.md"),
  path.join(ROOT, "data", "analysis", "330_manage_timeline_state_matrix.csv"),
  path.join(ROOT, "data", "analysis", "330_visual_reference_notes.json"),
  path.join(ROOT, "tests", "playwright", "330_network_manage.helpers.ts"),
  path.join(ROOT, "tests", "playwright", "330_network_manage_view.spec.ts"),
  path.join(ROOT, "tests", "playwright", "330_network_message_timeline.spec.ts"),
  path.join(ROOT, "tests", "playwright", "330_network_manage.visual.spec.ts"),
  path.join(ROOT, "tests", "playwright", "330_network_manage.accessibility.spec.ts"),
];

const REQUIRED_SCRIPT =
  '"validate:330-network-manage-and-message-timeline": "pnpm exec tsx ./tools/analysis/validate_330_network_manage_and_message_timeline.ts"';

function requireCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function read(filePath: string): string {
  requireCondition(
    fs.existsSync(filePath),
    `MISSING_REQUIRED_FILE:${path.relative(ROOT, filePath)}`,
  );
  return fs.readFileSync(filePath, "utf8");
}

function validateFiles() {
  for (const filePath of REQUIRED_FILES) {
    read(filePath);
  }
}

function validateChecklist() {
  const checklist = read(path.join(ROOT, "prompt", "checklist.md"));
  requireCondition(
    checklist.includes(
      "- [-] par_330_phase5_track_Playwright_or_other_appropriate_tooling_frontend_build_network_reminders_manage_flows_and_message_timeline_views",
    ) ||
      checklist.includes(
        "- [X] par_330_phase5_track_Playwright_or_other_appropriate_tooling_frontend_build_network_reminders_manage_flows_and_message_timeline_views",
      ),
    "CHECKLIST_ROW_MISSING_OR_UNCLAIMED:par_330",
  );
}

function validatePackageScript() {
  const packageJson = read(path.join(ROOT, "package.json"));
  requireCondition(
    packageJson.includes(REQUIRED_SCRIPT),
    "PACKAGE_SCRIPT_MISSING:validate:330-network-manage-and-message-timeline",
  );
}

function validateFrontendFiles() {
  const app = read(path.join(ROOT, "apps", "patient-web", "src", "App.tsx"));
  const patient = read(path.join(ROOT, "apps", "patient-web", "src", "patient-network-manage.tsx"));
  const confirmation = read(
    path.join(ROOT, "apps", "patient-web", "src", "patient-network-confirmation.tsx"),
  );

  requireCondition(
    app.includes("PatientNetworkManageView") && app.includes("isPatientNetworkManagePath"),
    "PATIENT_MANAGE_ROUTE_WIRING_MISSING",
  );

  for (const marker of [
    "NetworkAppointmentManageView",
    "NetworkManageCapabilityPanel",
    "NetworkManageActionPanel",
    "ReminderTimelineNotice",
    "ReminderDeliveryStateCard",
    "ConversationReminderSubthread",
    "HubManageSettlementPanel",
    "ContactRouteRepairInlineJourney",
    "NetworkManageReadOnlyState",
    "MessageTimelineClusterView",
  ]) {
    requireCondition(patient.includes(marker), `PATIENT_COMPONENT_MISSING:${marker}`);
  }

  requireCondition(
    confirmation.includes("resolveNetworkManageScenarioFromConfirmation330") &&
      confirmation.includes("resolvePatientNetworkManagePath330"),
    "CONFIRMATION_HANDOFF_MISSING",
  );

  for (const marker of [
    "data-network-manage",
    "data-manage-capability",
    "data-reminder-row",
    "data-message-timeline",
    "data-manage-settlement",
    "data-contact-repair",
  ]) {
    requireCondition(patient.includes(marker), `DOM_MARKER_MISSING:${marker}`);
  }
}

function validateArtifacts() {
  const spec = read(
    path.join(ROOT, "docs", "frontend", "330_network_manage_and_message_timeline_spec.md"),
  );
  const atlas = read(
    path.join(ROOT, "docs", "frontend", "330_network_manage_and_message_timeline_atlas.html"),
  );
  const contract = JSON.parse(
    read(
      path.join(ROOT, "data", "contracts", "330_network_manage_and_message_timeline_contract.json"),
    ),
  ) as {
    taskId?: string;
    visualMode?: string;
    domMarkers?: string[];
    laws?: Record<string, boolean>;
  };
  const notes = read(path.join(ROOT, "data", "analysis", "330_visual_reference_notes.json"));
  const matrix = read(path.join(ROOT, "data", "analysis", "330_manage_timeline_state_matrix.csv"));

  requireCondition(contract.taskId === "par_330", "CONTRACT_TASK_ID_INVALID");
  requireCondition(
    contract.visualMode === PATIENT_NETWORK_MANAGE_VISUAL_MODE,
    "CONTRACT_VISUAL_MODE_INVALID",
  );
  for (const marker of [
    "data-network-manage",
    "data-manage-capability",
    "data-reminder-row",
    "data-message-timeline",
    "data-manage-settlement",
    "data-contact-repair",
  ]) {
    requireCondition(contract.domMarkers?.includes(marker), `CONTRACT_DOM_MARKER_MISSING:${marker}`);
  }
  requireCondition(
    contract.laws?.manageExposureFromCurrentCapabilityAndContinuityOnly === true &&
      contract.laws?.reminderRowsStayInsideUnifiedTimeline === true &&
      contract.laws?.blockedManageStaysInShell === true &&
      contract.laws?.contactRepairPreservesAnchorAndMessageContext === true &&
      contract.laws?.staleCtasFreezeInPlace === true &&
      contract.laws?.callbackFallbackRemainsSeparateGovernedPath === true,
    "CONTRACT_LAWS_INVALID",
  );

  requireCondition(
    spec.includes("NetworkManageCapabilityPanel") &&
      spec.includes("MessageTimelineClusterView") &&
      spec.includes("contact-route repair"),
    "SPEC_CORE_CONTENT_MISSING",
  );
  requireCondition(
    atlas.includes('data-testid="NetworkManageMessageTimelineAtlas"') &&
      atlas.includes('data-visual-mode="Network_Appointment_Timeline_Workspace"'),
    "ATLAS_ROOT_MARKERS_MISSING",
  );

  for (const url of [
    "https://service-manual.nhs.uk/design-system/patterns/confirmation-page",
    "https://service-manual.nhs.uk/design-system/patterns/check-answers",
    "https://service-manual.nhs.uk/design-system/patterns/interruption-page",
    "https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration",
    "https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/",
    "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/dialog/",
    "https://www.w3.org/WAI/WCAG21/Understanding/status-messages.html",
    "https://www.w3.org/WAI/WCAG22/Understanding/reflow.html",
    "https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html",
    "https://playwright.dev/docs/best-practices",
    "https://playwright.dev/docs/aria-snapshots",
    "https://playwright.dev/docs/test-snapshots",
    "https://playwright.dev/docs/trace-viewer-intro",
    "https://linear.app/now/how-we-redesigned-the-linear-ui",
    "https://linear.app/docs/conceptual-model",
  ]) {
    requireCondition(notes.includes(url), `VISUAL_REFERENCE_URL_MISSING:${url}`);
  }

  for (const scenarioId of [
    "network_manage_330_live",
    "network_manage_330_contact_repair",
    "network_manage_330_read_only",
    "network_manage_330_unsupported_reschedule",
  ]) {
    requireCondition(matrix.includes(scenarioId), `STATE_MATRIX_MISSING:${scenarioId}`);
  }
}

function validateScenarioTruth() {
  const live = resolvePatientNetworkManageProjectionByScenarioId("network_manage_330_live");
  const repair = resolvePatientNetworkManageProjectionByScenarioId("network_manage_330_contact_repair");
  const readOnly = resolvePatientNetworkManageProjectionByScenarioId("network_manage_330_read_only");

  requireCondition(
    live.capabilityPanel.capabilityState === "live" &&
      live.capabilityPanel.readOnlyMode === "interactive",
    "LIVE_SCENARIO_INVALID",
  );
  requireCondition(
    repair.contactRepairJourney?.repairState === "required" &&
      repair.settlementPanel?.settlementResult === "blocked_dependency",
    "REPAIR_SCENARIO_INVALID",
  );
  requireCondition(
    readOnly.readOnlyState?.reason === "confirmation_pending" &&
      readOnly.focusedTimelineRowId === "reminder_suppressed_pending_confirmation",
    "READ_ONLY_SCENARIO_INVALID",
  );
}

function main() {
  validateFiles();
  validateChecklist();
  validatePackageScript();
  validateFrontendFiles();
  validateArtifacts();
  validateScenarioTruth();
  console.log("330 network manage and message timeline validation passed.");
}

main();
