import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  PATIENT_NETWORK_CONFIRMATION_VISUAL_MODE,
  resolvePatientNetworkConfirmationProjectionByScenarioId,
} from "../../apps/patient-web/src/patient-network-confirmation.model.ts";
import { resolveCrossOrgCommitScenario } from "../../packages/domain-kernel/src/phase5-cross-org-confirmation-preview.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const REQUIRED_FILES = [
  path.join(ROOT, "packages", "domain-kernel", "src", "phase5-cross-org-confirmation-preview.ts"),
  path.join(ROOT, "apps", "hub-desk", "src", "hub-commit-confirmation-pane.tsx"),
  path.join(ROOT, "apps", "hub-desk", "src", "hub-commit-confirmation-pane.css"),
  path.join(ROOT, "apps", "patient-web", "src", "patient-network-confirmation.model.ts"),
  path.join(ROOT, "apps", "patient-web", "src", "patient-network-confirmation.tsx"),
  path.join(ROOT, "apps", "patient-web", "src", "patient-network-confirmation.css"),
  path.join(ROOT, "docs", "frontend", "329_cross_org_commit_confirmation_and_visibility_spec.md"),
  path.join(
    ROOT,
    "docs",
    "frontend",
    "329_cross_org_commit_confirmation_and_visibility_atlas.html",
  ),
  path.join(ROOT, "docs", "frontend", "329_cross_org_commit_confirmation_topology.mmd"),
  path.join(ROOT, "docs", "frontend", "329_cross_org_commit_confirmation_tokens.json"),
  path.join(ROOT, "docs", "accessibility", "329_cross_org_commit_confirmation_a11y_notes.md"),
  path.join(ROOT, "data", "contracts", "329_cross_org_commit_and_visibility_contract.json"),
  path.join(ROOT, "data", "analysis", "329_algorithm_alignment_notes.md"),
  path.join(ROOT, "data", "analysis", "329_commit_visibility_state_matrix.csv"),
  path.join(ROOT, "data", "analysis", "329_visual_reference_notes.json"),
  path.join(ROOT, "tests", "playwright", "329_commit_confirmation.helpers.ts"),
  path.join(ROOT, "tests", "playwright", "329_hub_commit_confirmation.spec.ts"),
  path.join(ROOT, "tests", "playwright", "329_patient_network_confirmation.spec.ts"),
  path.join(ROOT, "tests", "playwright", "329_practice_visibility_panel.spec.ts"),
  path.join(ROOT, "tests", "playwright", "329_commit_confirmation.accessibility.spec.ts"),
];

const REQUIRED_SCRIPT =
  '"validate:329-commit-confirmation-and-visibility-ui": "pnpm exec tsx ./tools/analysis/validate_329_commit_confirmation_and_visibility_ui.ts"';

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
      "- [-] par_329_phase5_track_Playwright_or_other_appropriate_tooling_frontend_build_cross_org_commit_confirmation_and_practice_visibility_surfaces",
    ) ||
      checklist.includes(
        "- [X] par_329_phase5_track_Playwright_or_other_appropriate_tooling_frontend_build_cross_org_commit_confirmation_and_practice_visibility_surfaces",
      ),
    "CHECKLIST_ROW_MISSING_OR_UNCLAIMED:par_329",
  );
}

function validatePackageScript() {
  const packageJson = read(path.join(ROOT, "package.json"));
  requireCondition(
    packageJson.includes(REQUIRED_SCRIPT),
    "PACKAGE_SCRIPT_MISSING:validate:329-commit-confirmation-and-visibility-ui",
  );
}

function validateFrontendFiles() {
  const app = read(path.join(ROOT, "apps", "patient-web", "src", "App.tsx"));
  const patient = read(
    path.join(ROOT, "apps", "patient-web", "src", "patient-network-confirmation.tsx"),
  );
  const hubShell = read(path.join(ROOT, "apps", "hub-desk", "src", "hub-desk-shell.tsx"));
  const hubPane = read(
    path.join(ROOT, "apps", "hub-desk", "src", "hub-commit-confirmation-pane.tsx"),
  );

  requireCondition(
    app.includes("PatientNetworkConfirmationView") &&
      app.includes("isPatientNetworkConfirmationPath"),
    "PATIENT_ROUTE_WIRING_MISSING",
  );

  for (const marker of [
    "PatientNetworkConfirmationView",
    "ConfirmationDisclosureStrip",
    "AppointmentSummaryBlock",
    "WhatNextBlock",
    "ManageStub",
  ]) {
    requireCondition(patient.includes(marker), `PATIENT_COMPONENT_MISSING:${marker}`);
  }

  for (const marker of [
    "HubCommitConfirmationPane",
    "HubCommitAttemptTimeline",
    "ManualNativeBookingProofModal",
    "ImportedConfirmationReviewPanel",
    "PracticeVisibilityPanel",
    "PracticeAcknowledgementIndicator",
    "ContinuityDeliveryEvidenceDrawer",
    "HubSupplierDriftBanner",
    "HubCommitSettlementReceipt",
  ]) {
    requireCondition(hubPane.includes(marker), `HUB_COMPONENT_MISSING:${marker}`);
  }

  requireCondition(
    hubShell.includes("HubCommitConfirmationPane") &&
      hubShell.includes("createInitialHubCommitUiState"),
    "HUB_SHELL_INTEGRATION_MISSING",
  );

  for (const marker of [
    "data-hub-commit-posture",
    "data-commit-timeline",
    "data-practice-visibility",
    "data-acknowledgement-state",
    "data-patient-confirmation",
    "data-supplier-drift",
  ]) {
    requireCondition(
      patient.includes(marker) || hubPane.includes(marker),
      `DOM_MARKER_MISSING:${marker}`,
    );
  }
}

function validateArtifacts() {
  const spec = read(
    path.join(ROOT, "docs", "frontend", "329_cross_org_commit_confirmation_and_visibility_spec.md"),
  );
  const atlas = read(
    path.join(
      ROOT,
      "docs",
      "frontend",
      "329_cross_org_commit_confirmation_and_visibility_atlas.html",
    ),
  );
  const contract = JSON.parse(
    read(path.join(ROOT, "data", "contracts", "329_cross_org_commit_and_visibility_contract.json")),
  ) as {
    taskId?: string;
    visualMode?: string;
    domMarkers?: string[];
    laws?: Record<string, boolean>;
  };
  const notes = read(path.join(ROOT, "data", "analysis", "329_visual_reference_notes.json"));
  const matrix = read(
    path.join(ROOT, "data", "analysis", "329_commit_visibility_state_matrix.csv"),
  );

  requireCondition(contract.taskId === "par_329", "CONTRACT_TASK_ID_INVALID");
  requireCondition(
    contract.visualMode === PATIENT_NETWORK_CONFIRMATION_VISUAL_MODE,
    "CONTRACT_VISUAL_MODE_INVALID",
  );
  requireCondition(
    contract.domMarkers?.includes("data-practice-visibility") &&
      contract.domMarkers?.includes("data-hub-commit-posture"),
    "CONTRACT_DOM_MARKERS_INVALID",
  );
  requireCondition(
    contract.laws?.transportAcceptedIsNotBooked === true &&
      contract.laws?.patientConfirmedIsNotPracticeAcknowledged === true &&
      contract.laws?.manualProofMustBeStructured === true &&
      contract.laws?.practiceViewMustRemainMinimumNecessary === true &&
      contract.laws?.recoveryStaysInsideShell === true,
    "CONTRACT_LAWS_INVALID",
  );

  requireCondition(
    spec.includes("PracticeVisibilityPanel") &&
      spec.includes("Appointment confirmed") &&
      spec.includes("Practice acknowledged"),
    "SPEC_CORE_CONTENT_MISSING",
  );
  requireCondition(
    atlas.includes('data-testid="CrossOrgCommitConfirmationAtlas"') &&
      atlas.includes('data-visual-mode="Cross_Org_Confirmation_Ledger"'),
    "ATLAS_ROOT_MARKERS_MISSING",
  );

  for (const url of [
    "https://service-manual.nhs.uk/design-system/patterns/confirmation-page",
    "https://service-manual.nhs.uk/design-system/patterns/check-answers",
    "https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration",
    "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/",
    "https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/",
    "https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum",
    "https://www.w3.org/WAI/WCAG21/Understanding/reflow",
    "https://www.w3.org/WAI/WCAG21/Understanding/status-messages.html",
    "https://playwright.dev/docs/best-practices",
    "https://playwright.dev/docs/aria-snapshots",
    "https://playwright.dev/docs/test-snapshots",
    "https://playwright.dev/docs/trace-viewer-intro",
    "https://linear.app/now/how-we-redesigned-the-linear-ui",
    "https://linear.app/docs/conceptual-model",
  ]) {
    requireCondition(notes.includes(url), `VISUAL_REFERENCE_URL_MISSING:${url}`);
  }

  for (const row of [
    "candidate_revalidation",
    "native_booking_pending",
    "confirmation_pending",
    "booked_pending_practice_ack",
    "booked",
    "disputed",
    "supplier_drift",
  ]) {
    requireCondition(matrix.includes(row), `STATE_MATRIX_ROW_MISSING:${row}`);
  }
}

function validateRuntime() {
  const pending = resolvePatientNetworkConfirmationProjectionByScenarioId(
    "network_confirmation_329_pending",
  );
  const acknowledged = resolvePatientNetworkConfirmationProjectionByScenarioId(
    "network_confirmation_329_practice_acknowledged",
  );
  const drift = resolvePatientNetworkConfirmationProjectionByScenarioId(
    "network_confirmation_329_supplier_drift",
  );
  const hubPending = resolveCrossOrgCommitScenario("hub-case-104", "confirmation_pending");
  const hubBooked = resolveCrossOrgCommitScenario("hub-case-104", "booked");
  const hubDisputed = resolveCrossOrgCommitScenario("hub-case-087", "disputed");

  requireCondition(pending.state === "pending_copy", "PENDING_PATIENT_STATE_INVALID");
  requireCondition(
    acknowledged.disclosureRows[2]?.value === "Acknowledged at 10:31",
    "ACKNOWLEDGED_DISCLOSURE_INVALID",
  );
  requireCondition(drift.state === "blocked", "DRIFT_PATIENT_STATE_INVALID");
  requireCondition(
    hubPending?.manualProof?.submitLabel === "Attach reviewed manual proof",
    "MANUAL_PROOF_BINDING_INVALID",
  );
  requireCondition(
    hubBooked?.practiceView.acknowledgementState === "acknowledged",
    "BOOKED_ACK_STATE_INVALID",
  );
  requireCondition(
    hubDisputed?.importedReview?.heading === "Imported confirmation review",
    "DISPUTED_IMPORT_REVIEW_INVALID",
  );
}

function main() {
  validateFiles();
  validateChecklist();
  validatePackageScript();
  validateFrontendFiles();
  validateArtifacts();
  validateRuntime();
  console.log("validate_329_commit_confirmation_and_visibility_ui: ok");
}

main();
