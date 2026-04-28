import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  HUB_ACTING_CONTEXT_VISUAL_MODE,
  activateHubBreakGlass,
  createInitialHubShellState,
  navigateHubShell,
  resolveHubShellSnapshot,
  revokeHubBreakGlass,
  selectHubActingSite,
  selectHubOrganisation,
  selectHubPurposeOfUse,
} from "../../apps/hub-desk/src/hub-desk-shell.model.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const REQUIRED_FILES = [
  path.join(ROOT, "apps", "hub-desk", "src", "hub-desk-shell.tsx"),
  path.join(ROOT, "apps", "hub-desk", "src", "hub-desk-shell.model.ts"),
  path.join(ROOT, "apps", "hub-desk", "src", "hub-desk-shell.css"),
  path.join(ROOT, "docs", "frontend", "332_org_aware_access_controls_and_acting_context_switcher_spec.md"),
  path.join(ROOT, "docs", "frontend", "332_org_aware_access_controls_and_acting_context_switcher_atlas.html"),
  path.join(ROOT, "docs", "frontend", "332_acting_context_control_plane_topology.mmd"),
  path.join(ROOT, "docs", "frontend", "332_acting_context_control_plane_tokens.json"),
  path.join(ROOT, "docs", "accessibility", "332_acting_context_control_plane_a11y_notes.md"),
  path.join(ROOT, "data", "contracts", "332_acting_context_control_plane_contract.json"),
  path.join(ROOT, "data", "analysis", "332_algorithm_alignment_notes.md"),
  path.join(ROOT, "data", "analysis", "332_acting_context_state_matrix.csv"),
  path.join(ROOT, "data", "analysis", "332_visual_reference_notes.json"),
  path.join(ROOT, "tests", "playwright", "332_acting_context_switcher.spec.ts"),
  path.join(ROOT, "tests", "playwright", "332_break_glass_and_scope_drift.spec.ts"),
  path.join(ROOT, "tests", "playwright", "332_minimum_necessary_placeholders.spec.ts"),
  path.join(ROOT, "tests", "playwright", "332_acting_context.accessibility.spec.ts"),
];

const REQUIRED_SCRIPT =
  '"validate:332-acting-context-control-plane": "pnpm exec tsx ./tools/analysis/validate_332_acting_context_control_plane.ts"';

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
      "- [-] par_332_phase5_track_Playwright_or_other_appropriate_tooling_frontend_build_org_aware_access_controls_and_acting_context_switcher",
    ) ||
      checklist.includes(
        "- [X] par_332_phase5_track_Playwright_or_other_appropriate_tooling_frontend_build_org_aware_access_controls_and_acting_context_switcher",
      ),
    "CHECKLIST_ROW_MISSING_OR_UNCLAIMED:par_332",
  );
}

function validatePackageScript() {
  const packageJson = read(path.join(ROOT, "package.json"));
  requireCondition(
    packageJson.includes(REQUIRED_SCRIPT),
    "PACKAGE_SCRIPT_MISSING:validate:332-acting-context-control-plane",
  );
}

function validateFrontendFiles() {
  const app = read(path.join(ROOT, "apps", "hub-desk", "src", "hub-desk-shell.tsx"));
  const css = read(path.join(ROOT, "apps", "hub-desk", "src", "hub-desk-shell.css"));
  const model = read(path.join(ROOT, "apps", "hub-desk", "src", "hub-desk-shell.model.ts"));

  for (const marker of [
    "HubActingContextChip",
    "HubScopeSummaryStrip",
    "OrganisationSwitchDrawer",
    "ActingSiteSwitcher",
    "PurposeOfUsePanel",
    "BreakGlassReasonModal",
    "AccessScopeTransitionReceipt",
    "ScopeDriftFreezeBanner",
    "VisibilityEnvelopeLegend",
    "MinimumNecessaryPlaceholderBlock",
    "HubAccessDeniedState",
  ]) {
    requireCondition(app.includes(marker), `FRONTEND_COMPONENT_MISSING:${marker}`);
  }

  for (const marker of [
    "data-acting-organisation",
    "data-acting-site",
    "data-purpose-of-use",
    "data-audience-tier",
    "data-access-posture",
    "data-break-glass-state",
    "data-visibility-envelope-state",
    "data-scope-transition-outcome",
    "data-placeholder-reason",
    "data-scope-drift-class",
  ]) {
    requireCondition(app.includes(marker), `DOM_MARKER_MISSING:${marker}`);
  }

  requireCondition(model.includes("HUB_ACTING_CONTEXT_VISUAL_MODE"), "VISUAL_MODE_MISSING");
  requireCondition(model.includes("selectedOrganisationId"), "ORGANISATION_STATE_MISSING");
  requireCondition(model.includes("selectedSiteId"), "SITE_STATE_MISSING");
  requireCondition(model.includes("selectedPurposeId"), "PURPOSE_STATE_MISSING");
  requireCondition(model.includes("breakGlassBaseState"), "BREAK_GLASS_STATE_MISSING");
  requireCondition(css.includes(".hub-acting-context-chip"), "ACTING_CONTEXT_CHIP_STYLES_MISSING");
  requireCondition(css.includes(".hub-org-switch-drawer"), "DRAWER_STYLES_MISSING");
  requireCondition(css.includes(".hub-break-glass-modal"), "BREAK_GLASS_MODAL_STYLES_MISSING");
  requireCondition(css.includes(".hub-placeholder-grid"), "PLACEHOLDER_GRID_STYLES_MISSING");
  requireCondition(css.includes(".hub-access-denied-state"), "ACCESS_DENIED_STYLES_MISSING");
}

function validateArtifacts() {
  const spec = read(
    path.join(
      ROOT,
      "docs",
      "frontend",
      "332_org_aware_access_controls_and_acting_context_switcher_spec.md",
    ),
  );
  const atlas = read(
    path.join(
      ROOT,
      "docs",
      "frontend",
      "332_org_aware_access_controls_and_acting_context_switcher_atlas.html",
    ),
  );
  const topology = read(
    path.join(ROOT, "docs", "frontend", "332_acting_context_control_plane_topology.mmd"),
  );
  const a11yNotes = read(
    path.join(ROOT, "docs", "accessibility", "332_acting_context_control_plane_a11y_notes.md"),
  );
  const tokens = JSON.parse(
    read(path.join(ROOT, "docs", "frontend", "332_acting_context_control_plane_tokens.json")),
  ) as {
    taskId?: string;
    visualMode?: string;
    dimensions?: Record<string, unknown>;
    motion?: Record<string, unknown>;
  };
  const contract = JSON.parse(
    read(path.join(ROOT, "data", "contracts", "332_acting_context_control_plane_contract.json")),
  ) as {
    taskId?: string;
    visualMode?: string;
    domMarkers?: string[];
    laws?: Record<string, boolean>;
  };
  const alignment = read(path.join(ROOT, "data", "analysis", "332_algorithm_alignment_notes.md"));
  const matrix = read(path.join(ROOT, "data", "analysis", "332_acting_context_state_matrix.csv"));
  const notes = read(path.join(ROOT, "data", "analysis", "332_visual_reference_notes.json"));

  requireCondition(contract.taskId === "par_332", "CONTRACT_TASK_ID_INVALID");
  requireCondition(
    contract.visualMode === HUB_ACTING_CONTEXT_VISUAL_MODE,
    "CONTRACT_VISUAL_MODE_INVALID",
  );
  for (const marker of [
    "data-acting-organisation",
    "data-acting-site",
    "data-purpose-of-use",
    "data-audience-tier",
    "data-access-posture",
    "data-break-glass-state",
    "data-visibility-envelope-state",
    "data-scope-transition-outcome",
    "data-placeholder-reason",
    "data-scope-drift-class",
  ]) {
    requireCondition(contract.domMarkers?.includes(marker), `CONTRACT_MARKER_MISSING:${marker}`);
  }
  requireCondition(
    contract.laws?.activeScopeVisibleInShellChrome === true &&
      contract.laws?.scopeSwitchPreservesOrExplicitlyFreezes === true &&
      contract.laws?.readOnlyAndDeniedStayDistinct === true &&
      contract.laws?.hiddenCrossOrgFieldsUseGovernedPlaceholders === true &&
      contract.laws?.breakGlassStatesStayDistinct === true &&
      contract.laws?.currentCaseAnchorSurvivesScopeChanges === true,
    "CONTRACT_LAWS_INVALID",
  );

  requireCondition(
    spec.includes("HubActingContextChip") &&
      spec.includes("OrganisationSwitchDrawer") &&
      spec.includes("Read-only and denied are different states"),
    "SPEC_CORE_CONTENT_MISSING",
  );
  requireCondition(
    atlas.includes('data-testid="HubActingContextControlPlaneAtlas"') &&
      atlas.includes('data-visual-mode="Hub_Acting_Context_Control_Plane"'),
    "ATLAS_ROOT_MARKERS_MISSING",
  );
  requireCondition(
    topology.includes('M["Hub masthead') &&
      topology.includes('D["OrganisationSwitchDrawer"]') &&
      topology.includes('X["HubAccessDeniedState"]'),
    "TOPOLOGY_CORE_NODES_MISSING",
  );
  requireCondition(tokens.taskId === "par_332", "TOKENS_TASK_ID_INVALID");
  requireCondition(tokens.visualMode === HUB_ACTING_CONTEXT_VISUAL_MODE, "TOKENS_VISUAL_MODE_INVALID");
  requireCondition(
    tokens.dimensions?.switcherDrawerWidthPx === 392 &&
      tokens.motion?.reducedMotion === true,
    "TOKENS_CORE_VALUES_INVALID",
  );
  requireCondition(
    a11yNotes.includes("BreakGlassReasonModal") &&
      a11yNotes.includes("modal dialog semantics") &&
      a11yNotes.includes("purpose rows may be `current`, `available`, `pending`, or `blocked`"),
    "A11Y_NOTES_MISSING_CORE_RULES",
  );

  for (const marker of [
    "StaffIdentityContext",
    "ActingContext",
    "ActingScopeTuple",
    "CrossOrganisationVisibilityEnvelope",
    "BreakGlassAuditRecord",
    "ScopedMutationGate",
  ]) {
    requireCondition(alignment.includes(marker), `ALIGNMENT_MARKER_MISSING:${marker}`);
  }

  for (const scenarioId of [
    "hub_live_case_104",
    "origin_read_only_case_104",
    "servicing_read_only_case_041",
    "purpose_drift_frozen_case_041",
    "break_glass_active_case_031",
    "break_glass_expiring_case_031",
    "denied_scope_case_052",
    "origin_scope_denied_exceptions",
  ]) {
    requireCondition(matrix.includes(scenarioId), `STATE_MATRIX_ROW_MISSING:${scenarioId}`);
  }

  for (const url of [
    "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/",
    "https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/",
    "https://www.w3.org/WAI/ARIA/apg/patterns/listbox/",
    "https://www.w3.org/WAI/WCAG22/Understanding/reflow",
    "https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum",
    "https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum",
    "https://service-manual.nhs.uk/design-system/patterns/interruption-page",
    "https://nextjs.org/docs/app/guides/preserving-ui-state",
    "https://nextjs.org/docs/app/glossary",
    "https://playwright.dev/docs/best-practices",
    "https://playwright.dev/docs/aria-snapshots",
    "https://playwright.dev/docs/test-snapshots",
    "https://playwright.dev/docs/next/browser-contexts",
    "https://linear.app/now/how-we-redesigned-the-linear-ui",
    "https://linear.app/changelog/2026-03-12-ui-refresh",
  ]) {
    requireCondition(notes.includes(url), `VISUAL_REFERENCE_URL_MISSING:${url}`);
  }
}

function validateRuntime() {
  const live = resolveHubShellSnapshot(createInitialHubShellState("/hub/case/hub-case-104"), 1440);
  requireCondition(live.actingContextControlPlane.accessPosture === "writable", "LIVE_POSTURE_INVALID");
  requireCondition(
    live.actingContextControlPlane.minimumNecessaryPlaceholders.length === 1,
    "LIVE_PLACEHOLDER_COUNT_INVALID",
  );

  const originReadOnly = resolveHubShellSnapshot(
    selectHubOrganisation(createInitialHubShellState("/hub/case/hub-case-104"), "riverside_medical"),
    1440,
  );
  requireCondition(
    originReadOnly.actingContextControlPlane.accessPosture === "read_only" &&
      originReadOnly.actingContextControlPlane.visibilityEnvelopeLegend.currentAudienceTierId ===
        "origin_practice_visibility" &&
      originReadOnly.actingContextControlPlane.minimumNecessaryPlaceholders.length === 3 &&
      originReadOnly.actingContextControlPlane.accessScopeTransitionReceipt?.outcome ===
        "preserve_read_only",
    "ORIGIN_READ_ONLY_SCENARIO_INVALID",
  );

  const servicingReadOnly = resolveHubShellSnapshot(
    selectHubOrganisation(createInitialHubShellState("/hub/case/hub-case-041"), "elm_park_surgery"),
    1440,
  );
  requireCondition(
    servicingReadOnly.actingContextControlPlane.accessPosture === "read_only" &&
      servicingReadOnly.actingContextControlPlane.visibilityEnvelopeLegend.currentAudienceTierId ===
        "servicing_site_visibility" &&
      servicingReadOnly.actingContextControlPlane.minimumNecessaryPlaceholders.length === 2,
    "SERVICING_READ_ONLY_SCENARIO_INVALID",
  );

  const purposeDrift = resolveHubShellSnapshot(
    selectHubPurposeOfUse(
      createInitialHubShellState("/hub/case/hub-case-041"),
      "service_recovery_review",
    ),
    1440,
  );
  requireCondition(
    purposeDrift.actingContextControlPlane.accessPosture === "frozen" &&
      purposeDrift.actingContextControlPlane.scopeDriftFreezeBanner?.driftClass ===
        "purpose_of_use_change" &&
      purposeDrift.routeShellPosture === "shell_recovery_only",
    "PURPOSE_DRIFT_SCENARIO_INVALID",
  );

  const activeBreakGlass = activateHubBreakGlass(
    createInitialHubShellState("/hub/case/hub-case-031"),
    "urgent_clinical_safety",
  );
  const activeSnapshot = resolveHubShellSnapshot(activeBreakGlass, 1440);
  requireCondition(
    activeSnapshot.actingContextControlPlane.scopeSummaryStrip.breakGlassState === "active" &&
      activeSnapshot.actingContextControlPlane.accessPosture === "frozen" &&
      activeSnapshot.routeShellPosture === "shell_recovery_only" &&
      activeSnapshot.actingContextControlPlane.minimumNecessaryPlaceholders.length === 0,
    "ACTIVE_BREAK_GLASS_SCENARIO_INVALID",
  );

  const expiringSnapshot = resolveHubShellSnapshot(
    selectHubActingSite(activeBreakGlass, "north_shore_escalation_room"),
    1440,
  );
  requireCondition(
    expiringSnapshot.actingContextControlPlane.scopeSummaryStrip.breakGlassState === "expiring" &&
      expiringSnapshot.actingContextControlPlane.accessPosture === "frozen" &&
      expiringSnapshot.routeShellPosture === "shell_recovery_only",
    "EXPIRING_BREAK_GLASS_SCENARIO_INVALID",
  );

  const revokedSnapshot = resolveHubShellSnapshot(revokeHubBreakGlass(activeBreakGlass), 1440);
  requireCondition(
    revokedSnapshot.actingContextControlPlane.accessPosture === "denied" &&
      revokedSnapshot.actingContextControlPlane.accessDeniedState != null,
    "REVOKED_BREAK_GLASS_SCENARIO_INVALID",
  );

  const deniedCase = resolveHubShellSnapshot(
    selectHubOrganisation(createInitialHubShellState("/hub/case/hub-case-052"), "south_vale_network"),
    1440,
  );
  requireCondition(
    deniedCase.actingContextControlPlane.accessPosture === "denied" &&
      deniedCase.actingContextControlPlane.visibilityEnvelopeLegend.currentAudienceTierId ===
        "no_visibility" &&
      deniedCase.actingContextControlPlane.accessDeniedState?.title === "HubAccessDeniedState",
    "DENIED_CASE_SCENARIO_INVALID",
  );

  const deniedExceptions = resolveHubShellSnapshot(
    selectHubOrganisation(createInitialHubShellState("/hub/exceptions"), "riverside_medical"),
    1440,
  );
  requireCondition(
    deniedExceptions.location.pathname === "/hub/exceptions" &&
      deniedExceptions.actingContextControlPlane.accessPosture === "denied" &&
      deniedExceptions.routeShellPosture === "shell_recovery_only",
    "DENIED_EXCEPTIONS_SCENARIO_INVALID",
  );

  const roundTrip = navigateHubShell(
    selectHubOrganisation(createInitialHubShellState("/hub/case/hub-case-104"), "riverside_medical"),
    "/hub/alternatives/offer-session-104",
  );
  const roundTripSnapshot = resolveHubShellSnapshot(roundTrip, 1440);
  requireCondition(
    roundTrip.location.routeFamilyRef === "rf_hub_case_management" &&
      roundTripSnapshot.currentCase.caseId === "hub-case-104" &&
      roundTripSnapshot.actingContextControlPlane.accessPosture === "read_only",
    "ALTERNATIVES_SCOPE_CONTINUITY_INVALID",
  );
}

function main() {
  validateFiles();
  validateChecklist();
  validatePackageScript();
  validateFrontendFiles();
  validateArtifacts();
  validateRuntime();
  console.log("332 acting context control plane validation passed.");
}

main();
