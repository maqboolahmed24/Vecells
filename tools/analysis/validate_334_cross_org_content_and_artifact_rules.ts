import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  PATIENT_NETWORK_CONFIRMATION_VISUAL_MODE,
  resolvePatientNetworkConfirmationProjectionByScenarioId,
} from "../../apps/patient-web/src/patient-network-confirmation.model.ts";
import {
  PATIENT_NETWORK_MANAGE_VISUAL_MODE,
  resolvePatientNetworkManageProjectionByScenarioId,
} from "../../apps/patient-web/src/patient-network-manage.model.ts";
import {
  createInitialHubShellState,
  resolveHubShellSnapshot,
} from "../../apps/hub-desk/src/hub-desk-shell.model.ts";
import {
  CROSS_ORG_ARTIFACT_HANDOFF_VISUAL_MODE,
} from "../../packages/design-system/src/cross-org-artifact-handoff.tsx";
import { resolveCrossOrgCommitScenario } from "../../packages/domain-kernel/src/phase5-cross-org-confirmation-preview.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const REQUIRED_FILES = [
  path.join(ROOT, "packages", "design-system", "src", "cross-org-artifact-handoff.tsx"),
  path.join(ROOT, "packages", "design-system", "src", "cross-org-artifact-handoff.css"),
  path.join(ROOT, "packages", "design-system", "src", "index.tsx"),
  path.join(ROOT, "packages", "design-system", "package.json"),
  path.join(ROOT, "apps", "patient-web", "src", "patient-network-confirmation.tsx"),
  path.join(ROOT, "apps", "patient-web", "src", "patient-network-manage.tsx"),
  path.join(ROOT, "apps", "hub-desk", "src", "hub-commit-confirmation-pane.tsx"),
  path.join(ROOT, "apps", "hub-desk", "src", "hub-desk-shell.tsx"),
  path.join(
    ROOT,
    "docs",
    "frontend",
    "334_cross_org_accessibility_content_and_artifact_handoff_spec.md",
  ),
  path.join(
    ROOT,
    "docs",
    "frontend",
    "334_cross_org_accessibility_content_and_artifact_handoff_atlas.html",
  ),
  path.join(ROOT, "docs", "frontend", "334_cross_org_artifact_handoff_topology.mmd"),
  path.join(ROOT, "docs", "frontend", "334_cross_org_artifact_tokens.json"),
  path.join(ROOT, "docs", "accessibility", "334_cross_org_content_and_artifact_a11y_notes.md"),
  path.join(ROOT, "docs", "content", "334_phase5_cross_org_content_style_guide.md"),
  path.join(ROOT, "data", "contracts", "334_cross_org_content_and_artifact_contract.json"),
  path.join(ROOT, "data", "analysis", "334_algorithm_alignment_notes.md"),
  path.join(ROOT, "data", "analysis", "334_visual_reference_notes.json"),
  path.join(ROOT, "data", "analysis", "334_content_truth_phrase_matrix.csv"),
  path.join(ROOT, "tests", "playwright", "334_cross_org_artifact_modes.spec.ts"),
  path.join(ROOT, "tests", "playwright", "334_cross_org_content.accessibility.spec.ts"),
  path.join(ROOT, "tests", "playwright", "334_cross_org_handoff_and_return_anchor.spec.ts"),
];

const REQUIRED_SCRIPT =
  '"validate:334-cross-org-content-and-artifact-rules": "pnpm exec tsx ./tools/analysis/validate_334_cross_org_content_and_artifact_rules.ts"';

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
      "- [-] par_334_phase5_track_Playwright_or_other_appropriate_tooling_frontend_build_cross_org_accessibility_content_and_artifact_handoff_refinements",
    ) ||
      checklist.includes(
        "- [X] par_334_phase5_track_Playwright_or_other_appropriate_tooling_frontend_build_cross_org_accessibility_content_and_artifact_handoff_refinements",
      ),
    "CHECKLIST_ROW_MISSING_OR_UNCLAIMED:par_334",
  );
}

function validatePackageScript() {
  const packageJson = read(path.join(ROOT, "package.json"));
  requireCondition(
    packageJson.includes(REQUIRED_SCRIPT),
    "PACKAGE_SCRIPT_MISSING:validate:334-cross-org-content-and-artifact-rules",
  );
}

function validateFrontendFiles() {
  const designSystem = read(
    path.join(ROOT, "packages", "design-system", "src", "cross-org-artifact-handoff.tsx"),
  );
  const designSystemIndex = read(path.join(ROOT, "packages", "design-system", "src", "index.tsx"));
  const designSystemPackage = read(path.join(ROOT, "packages", "design-system", "package.json"));
  const confirmation = read(
    path.join(ROOT, "apps", "patient-web", "src", "patient-network-confirmation.tsx"),
  );
  const manage = read(path.join(ROOT, "apps", "patient-web", "src", "patient-network-manage.tsx"));
  const hubPane = read(
    path.join(ROOT, "apps", "hub-desk", "src", "hub-commit-confirmation-pane.tsx"),
  );
  const hubShell = read(path.join(ROOT, "apps", "hub-desk", "src", "hub-desk-shell.tsx"));

  for (const marker of [
    "CROSS_ORG_ARTIFACT_HANDOFF_VISUAL_MODE",
    "CrossOrgArtifactSurfaceFrame",
    "NetworkConfirmationArtifactStage",
    "PracticeNotificationArtifactSummary",
    "GovernedPlaceholderSummary",
    "ArtifactHandoffActionBar",
    "ArtifactParityBanner",
    "AccessibleTimelineStatusAnnotations",
    "ReturnAnchorReceipt",
    "CrossOrgContentLegend",
    "GrantBoundPreviewState",
  ]) {
    requireCondition(designSystem.includes(marker), `DESIGN_SYSTEM_COMPONENT_MISSING:${marker}`);
  }

  requireCondition(
    designSystemIndex.includes("CROSS_ORG_ARTIFACT_HANDOFF_VISUAL_MODE") &&
      designSystemIndex.includes('} from "./cross-org-artifact-handoff";'),
    "DESIGN_SYSTEM_INDEX_EXPORT_MISSING",
  );
  requireCondition(
    designSystemPackage.includes(
      '"./cross-org-artifact-handoff.css": "./src/cross-org-artifact-handoff.css"',
    ),
    "DESIGN_SYSTEM_CSS_EXPORT_MISSING",
  );

  for (const marker of [
    "data-artifact-stage-mode",
    "data-artifact-grant-state",
    "data-return-anchor-state",
    "data-artifact-visual-mode",
  ]) {
    requireCondition(
      confirmation.includes(marker) && manage.includes(marker) && hubPane.includes(marker),
      `DOM_MARKER_FAMILY_MISSING:${marker}`,
    );
  }

  requireCondition(
    confirmation.includes("CrossOrgContentLegend") &&
      confirmation.includes("ArtifactHandoffActionBar") &&
      confirmation.includes("ReturnAnchorReceipt"),
    "PATIENT_CONFIRMATION_ARTIFACT_FAMILY_MISSING",
  );
  requireCondition(
    manage.includes("CrossOrgContentLegend") &&
      manage.includes("AccessibleTimelineStatusAnnotations") &&
      manage.includes("ArtifactHandoffActionBar"),
    "PATIENT_MANAGE_ARTIFACT_FAMILY_MISSING",
  );
  requireCondition(
    hubPane.includes("PracticeNotificationArtifactSummary") &&
      hubPane.includes("CrossOrgContentLegend") &&
      hubPane.includes("AccessibleTimelineStatusAnnotations"),
    "HUB_COMMIT_ARTIFACT_FAMILY_MISSING",
  );
  requireCondition(
    hubShell.includes("GovernedPlaceholderSummary") && hubShell.includes("CrossOrgContentLegend"),
    "HUB_RECOVERY_PLACEHOLDER_FAMILY_MISSING",
  );
}

function validateArtifacts() {
  const spec = read(
    path.join(ROOT, "docs", "frontend", "334_cross_org_accessibility_content_and_artifact_handoff_spec.md"),
  );
  const atlas = read(
    path.join(ROOT, "docs", "frontend", "334_cross_org_accessibility_content_and_artifact_handoff_atlas.html"),
  );
  const topology = read(path.join(ROOT, "docs", "frontend", "334_cross_org_artifact_handoff_topology.mmd"));
  const a11y = read(
    path.join(ROOT, "docs", "accessibility", "334_cross_org_content_and_artifact_a11y_notes.md"),
  );
  const styleGuide = read(
    path.join(ROOT, "docs", "content", "334_phase5_cross_org_content_style_guide.md"),
  );
  const alignment = read(path.join(ROOT, "data", "analysis", "334_algorithm_alignment_notes.md"));
  const notes = read(path.join(ROOT, "data", "analysis", "334_visual_reference_notes.json"));
  const phraseMatrix = read(path.join(ROOT, "data", "analysis", "334_content_truth_phrase_matrix.csv"));
  const tokens = JSON.parse(
    read(path.join(ROOT, "docs", "frontend", "334_cross_org_artifact_tokens.json")),
  ) as {
    taskId?: string;
    visualMode?: string;
    layout?: {
      artifactMainFrameMaxWidthPx?: number;
      secondaryMetadataRailWidthPx?: number;
      actionBarHeightPx?: number;
      summaryStackGapPx?: number;
      artifactContentInsetPx?: number;
    };
    motion?: {
      artifactModeMorphMs?: number;
      bannerRevealMs?: number;
      handoffSettlementRevealMs?: number;
      reducedMotion?: boolean;
    };
  };
  const contract = JSON.parse(
    read(path.join(ROOT, "data", "contracts", "334_cross_org_content_and_artifact_contract.json")),
  ) as {
    taskId?: string;
    visualMode?: string;
    domMarkers?: string[];
    laws?: Record<string, boolean>;
    components?: string[];
  };

  requireCondition(spec.includes("Practice informed"), "SPEC_PHRASE_MISSING:Practice informed");
  requireCondition(
    spec.includes("Practice acknowledged"),
    "SPEC_PHRASE_MISSING:Practice acknowledged",
  );
  requireCondition(spec.includes("summary-first"), "SPEC_SUMMARY_FIRST_MISSING");
  requireCondition(spec.includes("ReturnAnchorReceipt"), "SPEC_RETURN_RECEIPT_MISSING");

  requireCondition(
    atlas.includes('data-testid="CrossOrgArtifactHandoffAtlas"') &&
      atlas.includes('data-visual-mode="Governed_Artifact_Handoff_Studio"'),
    "ATLAS_ROOT_MARKERS_MISSING",
  );

  requireCondition(
    topology.includes('E{"Grant active and parity current?"}') &&
      topology.includes('G["GovernedPlaceholderSummary"]') &&
      topology.includes('H["ReturnAnchorReceipt"]'),
    "TOPOLOGY_CORE_NODES_MISSING",
  );

  requireCondition(tokens.taskId === "par_334", "TOKENS_TASK_ID_INVALID");
  requireCondition(
    tokens.visualMode === CROSS_ORG_ARTIFACT_HANDOFF_VISUAL_MODE,
    "TOKENS_VISUAL_MODE_INVALID",
  );
  requireCondition(
    tokens.layout?.artifactMainFrameMaxWidthPx === 880 &&
      tokens.layout?.secondaryMetadataRailWidthPx === 320 &&
      tokens.layout?.actionBarHeightPx === 56 &&
      tokens.layout?.summaryStackGapPx === 16 &&
      tokens.layout?.artifactContentInsetPx === 20,
    "TOKENS_LAYOUT_INVALID",
  );
  requireCondition(
    tokens.motion?.artifactModeMorphMs === 140 &&
      tokens.motion?.bannerRevealMs === 120 &&
      tokens.motion?.handoffSettlementRevealMs === 160 &&
      tokens.motion?.reducedMotion === true,
    "TOKENS_MOTION_INVALID",
  );

  requireCondition(contract.taskId === "par_334", "CONTRACT_TASK_ID_INVALID");
  requireCondition(
    contract.visualMode === CROSS_ORG_ARTIFACT_HANDOFF_VISUAL_MODE,
    "CONTRACT_VISUAL_MODE_INVALID",
  );
  for (const marker of [
    "CrossOrgArtifactSurfaceFrame",
    "NetworkConfirmationArtifactStage",
    "PracticeNotificationArtifactSummary",
    "GovernedPlaceholderSummary",
    "ArtifactHandoffActionBar",
    "ArtifactParityBanner",
    "AccessibleTimelineStatusAnnotations",
    "ReturnAnchorReceipt",
    "CrossOrgContentLegend",
    "GrantBoundPreviewState",
  ]) {
    requireCondition(contract.components?.includes(marker), `CONTRACT_COMPONENT_MISSING:${marker}`);
  }
  for (const marker of [
    "data-artifact-stage-mode",
    "data-artifact-grant-state",
    "data-return-anchor-state",
    "data-artifact-visual-mode",
    "data-parity-stage-mode",
    "data-placeholder-reason",
    "data-grant-state",
    "data-practice-informed",
    "data-practice-acknowledged",
  ]) {
    requireCondition(
      contract.domMarkers?.includes(marker),
      `CONTRACT_DOM_MARKER_MISSING:${marker}`,
    );
  }
  requireCondition(
    contract.laws?.summaryFirstByDefault === true &&
      contract.laws?.previewRequiresCurrentGrantAndParity === true &&
      contract.laws?.printDownloadExportHandoffStaySecondary === true &&
      contract.laws?.patientConfirmedIsNotPracticeAcknowledged === true &&
      contract.laws?.hiddenDetailUsesGovernedPlaceholder === true &&
      contract.laws?.downgradePreservesReturnAnchor === true &&
      contract.laws?.familyWideAccessibilityGrammar === true &&
      contract.laws?.embeddedHostsRemainSummaryOnly === true,
    "CONTRACT_LAWS_INVALID",
  );

  for (const marker of [
    "Appointment confirmed",
    "Practice informed",
    "Practice acknowledged",
    "Manage live",
    "Provider pending",
    "Callback fallback",
    "summary_first",
    "summary_only",
  ]) {
    requireCondition(phraseMatrix.includes(marker), `PHRASE_MATRIX_ENTRY_MISSING:${marker}`);
  }

  for (const marker of [
    "summary-first",
    "Practice informed",
    "Practice acknowledged",
    "Return to current summary or receipt",
  ]) {
    requireCondition(
      styleGuide.toLowerCase().includes(marker.toLowerCase()),
      `STYLE_GUIDE_MARKER_MISSING:${marker}`,
    );
  }

  for (const marker of [
    "summary_first",
    "preview",
    "print`, `download`, `export`, `external_handoff`",
    "placeholder rows must explain",
  ]) {
    requireCondition(alignment.includes(marker), `ALIGNMENT_MARKER_MISSING:${marker}`);
  }

  for (const marker of ["focus return", "status-region restraint", "320px", "reduced-motion"]) {
    requireCondition(
      a11y.toLowerCase().includes(marker.toLowerCase()),
      `A11Y_MARKER_MISSING:${marker}`,
    );
  }

  for (const url of [
    "https://service-manual.nhs.uk/design-system/patterns/confirmation-page",
    "https://service-manual.nhs.uk/design-system/patterns/check-answers",
    "https://service-manual.nhs.uk/design-system/components/warning-callout",
    "https://service-manual.nhs.uk/design-system/components/table",
    "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/",
    "https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/",
    "https://www.w3.org/WAI/tutorials/tables/",
    "https://www.w3.org/WAI/WCAG22/Understanding/reflow",
    "https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum",
    "https://www.w3.org/WAI/WCAG21/Understanding/status-messages.html",
    "https://playwright.dev/docs/accessibility-testing",
    "https://playwright.dev/docs/aria-snapshots",
    "https://playwright.dev/docs/test-snapshots",
    "https://playwright.dev/docs/trace-viewer-intro",
    "https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration",
    "https://linear.app/now/how-we-redesigned-the-linear-ui",
  ]) {
    requireCondition(notes.includes(url), `VISUAL_REFERENCE_URL_MISSING:${url}`);
  }
}

function validateRuntime() {
  requireCondition(
    PATIENT_NETWORK_CONFIRMATION_VISUAL_MODE === "Cross_Org_Confirmation_Ledger",
    "CONFIRMATION_VISUAL_MODE_DRIFT",
  );
  requireCondition(
    PATIENT_NETWORK_MANAGE_VISUAL_MODE === "Network_Appointment_Timeline_Workspace",
    "MANAGE_VISUAL_MODE_DRIFT",
  );

  const pending = resolvePatientNetworkConfirmationProjectionByScenarioId(
    "network_confirmation_329_pending",
  );
  const acknowledged = resolvePatientNetworkConfirmationProjectionByScenarioId(
    "network_confirmation_329_practice_acknowledged",
  );
  const drift = resolvePatientNetworkConfirmationProjectionByScenarioId(
    "network_confirmation_329_supplier_drift",
  );
  requireCondition(
    pending.state === "pending_copy" &&
      pending.disclosureRows[0]?.label === "Appointment confirmed" &&
      pending.disclosureRows[1]?.label === "Practice informed" &&
      pending.disclosureRows[2]?.label === "Practice acknowledged",
    "CONFIRMATION_PHRASE_ORDER_INVALID",
  );
  requireCondition(
    acknowledged.disclosureRows[2]?.value === "Acknowledged at 10:31",
    "ACKNOWLEDGED_CONFIRMATION_INVALID",
  );
  requireCondition(
    drift.state === "blocked" && drift.patientFacingReference === "Confirmation pending",
    "DRIFT_CONFIRMATION_STATE_INVALID",
  );

  const liveManage = resolvePatientNetworkManageProjectionByScenarioId("network_manage_330_live");
  const repairManage = resolvePatientNetworkManageProjectionByScenarioId(
    "network_manage_330_contact_repair",
  );
  requireCondition(
    liveManage.capabilityPanel.capabilityState === "live" &&
      liveManage.capabilityPanel.readOnlyMode === "interactive",
    "LIVE_MANAGE_STATE_INVALID",
  );
  requireCondition(
    repairManage.capabilityPanel.capabilityState === "blocked" &&
      repairManage.contactRepairJourney?.repairState === "required",
    "REPAIR_MANAGE_STATE_INVALID",
  );

  const liveHub = resolveHubShellSnapshot(createInitialHubShellState("/hub/case/hub-case-066"), 1520);
  const auditHub = resolveHubShellSnapshot(
    createInitialHubShellState("/hub/audit/hub-case-066"),
    1520,
  );
  const recoveryHub = resolveHubShellSnapshot(
    createInitialHubShellState("/hub/case/hub-case-052"),
    1520,
  );
  requireCondition(
    liveHub.artifactModeState === "interactive_live",
    "LIVE_HUB_ARTIFACT_MODE_INVALID",
  );
  requireCondition(auditHub.artifactModeState === "summary_only", "AUDIT_HUB_ARTIFACT_MODE_INVALID");
  requireCondition(
    recoveryHub.recoveryPosture === "recovery_only" &&
      recoveryHub.currentCase?.caseId === "hub-case-052",
    "RECOVERY_HUB_STATE_INVALID",
  );

  const pendingAck = resolveCrossOrgCommitScenario("hub-case-066", "booked_pending_practice_ack");
  const booked = resolveCrossOrgCommitScenario("hub-case-104", "booked");
  const supplierDrift = resolveCrossOrgCommitScenario("hub-case-041", "supplier_drift");
  requireCondition(
    pendingAck?.patientView.patientFacingReference === "Appointment confirmed" &&
      pendingAck.practiceView.acknowledgementLabel === "Acknowledgement overdue" &&
      pendingAck.continuityDrawer.notificationPreview.body.includes("Practice informed is current") &&
      pendingAck.continuityDrawer.notificationPreview.body.includes(
        "Practice acknowledged remains pending",
      ),
    "PENDING_ACK_COMMIT_SCENARIO_INVALID",
  );
  requireCondition(
    booked?.practiceView.acknowledgementLabel === "Practice acknowledged",
    "BOOKED_COMMIT_SCENARIO_INVALID",
  );
  requireCondition(
    supplierDrift?.patientView.patientFacingReference === "Confirmation pending" &&
      supplierDrift.practiceView.acknowledgementLabel === "Acknowledgement reopened",
    "SUPPLIER_DRIFT_COMMIT_SCENARIO_INVALID",
  );
}

function main() {
  validateFiles();
  validateChecklist();
  validatePackageScript();
  validateFrontendFiles();
  validateArtifacts();
  validateRuntime();
  console.log("334 cross-org content and artifact rules validation passed.");
}

main();
