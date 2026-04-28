import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  PATIENT_PHARMACY_SHELL_VISUAL_MODE,
  createInitialPatientPharmacyShellState,
  resolvePatientPharmacyShellSnapshot,
} from "../../apps/patient-web/src/patient-pharmacy-shell.model.ts";
import {
  PHARMACY_MISSION_FRAME_VISUAL_MODE,
  createInitialPharmacyShellState,
  resolvePharmacyShellSnapshot,
} from "../../apps/pharmacy-console/src/pharmacy-shell-seed.model.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const REQUIRED_FILES = [
  path.join(ROOT, "apps", "pharmacy-console", "src", "pharmacy-shell-seed.tsx"),
  path.join(ROOT, "apps", "pharmacy-console", "src", "pharmacy-shell-seed.model.ts"),
  path.join(ROOT, "apps", "pharmacy-console", "src", "pharmacy-shell-seed.css"),
  path.join(ROOT, "apps", "patient-web", "src", "patient-pharmacy-shell.tsx"),
  path.join(ROOT, "apps", "patient-web", "src", "patient-pharmacy-shell.model.ts"),
  path.join(ROOT, "apps", "patient-web", "src", "patient-pharmacy-shell.css"),
  path.join(ROOT, "docs", "frontend", "356_pharmacy_shell_and_mission_frame_spec.md"),
  path.join(ROOT, "docs", "frontend", "356_pharmacy_shell_and_mission_frame_atlas.html"),
  path.join(ROOT, "docs", "frontend", "356_pharmacy_shell_route_topology.mmd"),
  path.join(ROOT, "docs", "frontend", "356_pharmacy_shell_tokens.json"),
  path.join(ROOT, "docs", "accessibility", "356_pharmacy_shell_a11y_notes.md"),
  path.join(ROOT, "data", "contracts", "356_pharmacy_shell_contract.json"),
  path.join(ROOT, "data", "analysis", "356_algorithm_alignment_notes.md"),
  path.join(ROOT, "data", "analysis", "356_shell_state_matrix.csv"),
  path.join(ROOT, "data", "analysis", "356_visual_reference_notes.json"),
  path.join(ROOT, "tests", "playwright", "356_pharmacy_shell_continuity.spec.ts"),
  path.join(ROOT, "tests", "playwright", "356_pharmacy_shell_responsive.spec.ts"),
  path.join(ROOT, "tests", "playwright", "356_pharmacy_shell_accessibility.spec.ts"),
  path.join(ROOT, "tests", "playwright", "356_pharmacy_shell_visual.spec.ts"),
];

const REQUIRED_SCRIPT =
  '"validate:356-pharmacy-shell-ui": "pnpm exec tsx ./tools/analysis/validate_356_pharmacy_shell_ui.ts"';

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
      "- [-] par_356_phase6_track_Playwright_or_other_appropriate_tooling_frontend_build_pharmacy_shell_route_family_and_console_mission_frame",
    ) ||
      checklist.includes(
        "- [X] par_356_phase6_track_Playwright_or_other_appropriate_tooling_frontend_build_pharmacy_shell_route_family_and_console_mission_frame",
      ),
    "CHECKLIST_ROW_MISSING_OR_UNCLAIMED:par_356",
  );
}

function validatePackageScript() {
  const packageJson = read(path.join(ROOT, "package.json"));
  requireCondition(
    packageJson.includes(REQUIRED_SCRIPT),
    "PACKAGE_SCRIPT_MISSING:validate:356-pharmacy-shell-ui",
  );
}

function validateFrontendFiles() {
  const workspace = read(path.join(ROOT, "apps", "pharmacy-console", "src", "pharmacy-shell-seed.tsx"));
  const workspaceCss = read(path.join(ROOT, "apps", "pharmacy-console", "src", "pharmacy-shell-seed.css"));
  const patient = read(path.join(ROOT, "apps", "patient-web", "src", "patient-pharmacy-shell.tsx"));
  const patientCss = read(path.join(ROOT, "apps", "patient-web", "src", "patient-pharmacy-shell.css"));

  for (const marker of [
    "PharmacyShellFrame",
    "PharmacyWorkspaceShell",
    "PharmacyQueueSpineHost",
    "PharmacyValidationBoardHost",
    "PharmacySupportRegionHost",
    "PharmacyCheckpointRail",
    "PharmacyCasePulseHost",
    "PharmacyDecisionDockHost",
    "PharmacyChosenProviderAnchor",
    "PharmacyRouteRecoveryFrame",
  ]) {
    requireCondition(workspace.includes(marker), `WORKSPACE_COMPONENT_MISSING:${marker}`);
  }

  requireCondition(patient.includes("PharmacyPatientShell"), "PATIENT_SHELL_COMPONENT_MISSING");

  for (const marker of [
    "data-layout-topology",
    "data-breakpoint-class",
    "data-route-family",
    "data-selected-case-anchor",
    "data-active-checkpoint-summary",
    "data-promoted-support-region",
    "data-dominant-action-state",
    "data-recovery-posture",
  ]) {
    requireCondition(workspace.includes(marker), `WORKSPACE_MARKER_MISSING:${marker}`);
  }

  for (const marker of [
    "data-route-family",
    "data-chosen-provider-ref",
    "data-request-lineage-ref",
    "data-promoted-support-region",
    "data-dominant-action-state",
    "data-recovery-posture",
  ]) {
    requireCondition(patient.includes(marker), `PATIENT_MARKER_MISSING:${marker}`);
  }

  for (const className of [
    ".pharmacy-recovery-strip",
    ".pharmacy-panel--anchor",
  ]) {
    requireCondition(workspaceCss.includes(className), `WORKSPACE_STYLE_MISSING:${className}`);
  }

  for (const className of [
    ".patient-pharmacy-shell__route-nav",
    ".patient-pharmacy-shell__decision-dock",
    ".patient-pharmacy-shell__recovery-frame",
  ]) {
    requireCondition(patientCss.includes(className), `PATIENT_STYLE_MISSING:${className}`);
  }
}

function validateArtifacts() {
  const spec = read(path.join(ROOT, "docs", "frontend", "356_pharmacy_shell_and_mission_frame_spec.md"));
  const atlas = read(path.join(ROOT, "docs", "frontend", "356_pharmacy_shell_and_mission_frame_atlas.html"));
  const topology = read(path.join(ROOT, "docs", "frontend", "356_pharmacy_shell_route_topology.mmd"));
  const a11y = read(path.join(ROOT, "docs", "accessibility", "356_pharmacy_shell_a11y_notes.md"));
  const alignment = read(path.join(ROOT, "data", "analysis", "356_algorithm_alignment_notes.md"));
  const matrix = read(path.join(ROOT, "data", "analysis", "356_shell_state_matrix.csv"));
  const notes = read(path.join(ROOT, "data", "analysis", "356_visual_reference_notes.json"));

  const tokens = JSON.parse(
    read(path.join(ROOT, "docs", "frontend", "356_pharmacy_shell_tokens.json")),
  ) as {
    taskId?: string;
    visualMode?: string;
    dimensions?: { workspaceQueueSpineRemMin?: number; patientMainColumnMaxPx?: number };
    motion?: { reducedMotion?: boolean };
  };
  const contract = JSON.parse(
    read(path.join(ROOT, "data", "contracts", "356_pharmacy_shell_contract.json")),
  ) as {
    taskId?: string;
    visualMode?: string;
    routeFamilies?: Array<{ routeFamilyRef: string; routes: string[] }>;
    domMarkers?: string[];
    laws?: Record<string, boolean>;
  };

  requireCondition(spec.includes("PharmacyPatientShell"), "SPEC_PATIENT_SHELL_MISSING");
  requireCondition(spec.includes("PharmacyWorkspaceShell"), "SPEC_WORKSPACE_SHELL_MISSING");
  requireCondition(spec.includes("mission_stack"), "SPEC_MISSION_STACK_MISSING");
  requireCondition(
    atlas.includes('data-testid="356PharmacyShellAtlas"') &&
      atlas.includes('data-visual-mode="Pharmacy_Mission_Frame"'),
    "ATLAS_ROOT_MARKERS_MISSING",
  );
  requireCondition(
    topology.includes('PatientChoose["/pharmacy/:pharmacyCaseId/choose"]') &&
      topology.includes('Queue["/workspace/pharmacy"]'),
    "TOPOLOGY_ROUTE_FAMILY_MISSING",
  );

  requireCondition(tokens.taskId === "par_356", "TOKENS_TASK_ID_INVALID");
  requireCondition(
    tokens.visualMode === PHARMACY_MISSION_FRAME_VISUAL_MODE,
    "TOKENS_VISUAL_MODE_INVALID",
  );
  requireCondition(
    tokens.dimensions?.workspaceQueueSpineRemMin === 22 &&
      tokens.dimensions?.patientMainColumnMaxPx === 760 &&
      tokens.motion?.reducedMotion === true,
    "TOKENS_CORE_VALUES_INVALID",
  );

  requireCondition(contract.taskId === "par_356", "CONTRACT_TASK_ID_INVALID");
  requireCondition(
    contract.visualMode === PHARMACY_MISSION_FRAME_VISUAL_MODE,
    "CONTRACT_VISUAL_MODE_INVALID",
  );
  requireCondition(
    contract.routeFamilies?.some((family) => family.routeFamilyRef === "rf_patient_pharmacy") &&
      contract.routeFamilies?.some((family) => family.routeFamilyRef === "rf_pharmacy_console"),
    "CONTRACT_ROUTE_FAMILIES_INVALID",
  );
  requireCondition(
    contract.domMarkers?.includes("data-selected-case-anchor") &&
      contract.domMarkers?.includes("data-chosen-provider-ref"),
    "CONTRACT_DOM_MARKERS_INVALID",
  );
  requireCondition(
    contract.laws?.sameShellContinuity === true &&
      contract.laws?.missionStackIsFoldNotSeparateIA === true &&
      contract.laws?.degradedTruthIsVisiblyNonCalm === true,
    "CONTRACT_LAWS_INVALID",
  );

  requireCondition(
    alignment.includes("/pharmacy/:pharmacyCaseId/choose") &&
      alignment.includes("/workspace/pharmacy/:pharmacyCaseId/handoff"),
    "ALIGNMENT_ROUTE_MAP_INCOMPLETE",
  );

  for (const scenarioId of [
    "workspace_queue_live",
    "workspace_assurance_recovery",
    "patient_choose_live",
    "patient_status_recovery",
  ]) {
    requireCondition(matrix.includes(scenarioId), `STATE_MATRIX_ROW_MISSING:${scenarioId}`);
  }

  for (const url of [
    "https://playwright.dev/docs/browser-contexts",
    "https://playwright.dev/docs/accessibility-testing",
    "https://playwright.dev/docs/trace-viewer-intro",
    "https://playwright.dev/docs/aria-snapshots",
    "https://playwright.dev/docs/next/test-snapshots",
    "https://service-manual.nhs.uk/design-system/patterns/confirmation-page",
    "https://service-manual.nhs.uk/design-system/patterns/interruption-page",
    "https://service-manual.nhs.uk/design-system/components/card",
    "https://service-manual.nhs.uk/design-system/components/summary-list",
    "https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/",
    "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/",
    "https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/",
    "https://linear.app/now/how-we-redesigned-the-linear-ui",
    "https://vercel.com/academy/nextjs-foundations/nested-layouts",
  ]) {
    requireCondition(notes.includes(url), `VISUAL_REFERENCE_URL_MISSING:${url}`);
  }

  requireCondition(a11y.includes("320px"), "A11Y_REFLOW_RULE_MISSING");
  requireCondition(a11y.includes("44px"), "A11Y_TOUCH_TARGET_RULE_MISSING");
}

function validateRuntime() {
  const workspaceWide = resolvePharmacyShellSnapshot(
    createInitialPharmacyShellState("/workspace/pharmacy/PHC-2057"),
    1440,
  );
  requireCondition(
    workspaceWide.layoutMode === "two_plane" &&
      workspaceWide.location.routeKey === "case" &&
      workspaceWide.currentCase.pharmacyCaseId === "PHC-2057",
    "WORKSPACE_WIDE_SNAPSHOT_INVALID",
  );

  const workspaceNarrow = resolvePharmacyShellSnapshot(
    createInitialPharmacyShellState("/workspace/pharmacy/PHC-2103/assurance"),
    390,
  );
  requireCondition(
    workspaceNarrow.layoutMode === "mission_stack" &&
      workspaceNarrow.recoveryPosture === "recovery_only" &&
      workspaceNarrow.location.routeKey === "assurance",
    "WORKSPACE_NARROW_SNAPSHOT_INVALID",
  );

  const patientWide = resolvePatientPharmacyShellSnapshot(
    createInitialPatientPharmacyShellState("/pharmacy/PHC-2048/choose"),
    1280,
  );
  requireCondition(
    patientWide.layoutMode === "two_plane" &&
      patientWide.location.routeKey === "choose" &&
      patientWide.currentCase.pharmacyCaseId === "PHC-2048",
    "PATIENT_WIDE_SNAPSHOT_INVALID",
  );

  const patientNarrow = resolvePatientPharmacyShellSnapshot(
    createInitialPatientPharmacyShellState("/pharmacy/PHC-2103/status"),
    390,
  );
  requireCondition(
    patientNarrow.layoutMode === "mission_stack" &&
      patientNarrow.currentCase.recoveryPosture === "recovery_only" &&
      patientNarrow.promotedSupportRegion === "status_recovery",
    "PATIENT_NARROW_SNAPSHOT_INVALID",
  );

  requireCondition(
    PHARMACY_MISSION_FRAME_VISUAL_MODE === "Pharmacy_Mission_Frame" &&
      PATIENT_PHARMACY_SHELL_VISUAL_MODE === "Pharmacy_Mission_Frame",
    "VISUAL_MODE_DRIFT",
  );
}

function main() {
  validateFiles();
  validateChecklist();
  validatePackageScript();
  validateFrontendFiles();
  validateArtifacts();
  validateRuntime();
  console.log("validate_356_pharmacy_shell_ui: ok");
}

main();
