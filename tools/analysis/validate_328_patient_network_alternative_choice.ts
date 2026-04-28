import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  PATIENT_NETWORK_ALTERNATIVE_CHOICE_VISUAL_MODE,
  isPatientNetworkAlternativeChoicePath,
  resolvePatientNetworkAlternativeChoiceProjectionByScenarioId,
  resolvePatientNetworkAlternativeChoiceScenarioId,
} from "../../apps/patient-web/src/patient-network-alternative-choice.model.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const REQUIRED_FILES = [
  path.join(ROOT, "apps", "patient-web", "src", "patient-network-alternative-choice.tsx"),
  path.join(ROOT, "apps", "patient-web", "src", "patient-network-alternative-choice.model.ts"),
  path.join(ROOT, "apps", "patient-web", "src", "patient-network-alternative-choice.css"),
  path.join(ROOT, "docs", "frontend", "328_patient_network_alternative_choice_spec.md"),
  path.join(ROOT, "docs", "frontend", "328_patient_network_alternative_choice_atlas.html"),
  path.join(ROOT, "docs", "frontend", "328_patient_network_alternative_choice_topology.mmd"),
  path.join(ROOT, "docs", "frontend", "328_patient_network_alternative_choice_tokens.json"),
  path.join(ROOT, "docs", "accessibility", "328_patient_network_alternative_choice_a11y_notes.md"),
  path.join(ROOT, "data", "contracts", "328_patient_network_alternative_choice_contract.json"),
  path.join(ROOT, "data", "analysis", "328_algorithm_alignment_notes.md"),
  path.join(ROOT, "data", "analysis", "328_patient_network_choice_state_matrix.csv"),
  path.join(ROOT, "data", "analysis", "328_visual_reference_notes.json"),
  path.join(ROOT, "tests", "playwright", "328_network_alternative_choice.helpers.ts"),
  path.join(ROOT, "tests", "playwright", "328_network_alternative_choice.spec.ts"),
  path.join(ROOT, "tests", "playwright", "328_network_alternative_choice.visual.spec.ts"),
  path.join(ROOT, "tests", "playwright", "328_network_alternative_choice.accessibility.spec.ts"),
  path.join(ROOT, "tests", "playwright", "328_network_alternative_choice.embedded.spec.ts"),
];

const REQUIRED_SCRIPT =
  '"validate:328-patient-network-alternative-choice": "pnpm exec tsx ./tools/analysis/validate_328_patient_network_alternative_choice.ts"';

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
      "- [-] par_328_phase5_track_Playwright_or_other_appropriate_tooling_frontend_build_patient_network_alternatives_choice_and_callback_fallback_views",
    ) ||
      checklist.includes(
        "- [X] par_328_phase5_track_Playwright_or_other_appropriate_tooling_frontend_build_patient_network_alternatives_choice_and_callback_fallback_views",
      ),
    "CHECKLIST_ROW_MISSING_OR_UNCLAIMED:par_328",
  );
}

function validatePackageScript() {
  const packageJson = read(path.join(ROOT, "package.json"));
  requireCondition(
    packageJson.includes(REQUIRED_SCRIPT),
    "PACKAGE_SCRIPT_MISSING:validate:328-patient-network-alternative-choice",
  );
}

function validateFrontendFiles() {
  const app = read(path.join(ROOT, "apps", "patient-web", "src", "App.tsx"));
  const route = read(
    path.join(ROOT, "apps", "patient-web", "src", "patient-network-alternative-choice.tsx"),
  );
  const css = read(
    path.join(ROOT, "apps", "patient-web", "src", "patient-network-alternative-choice.css"),
  );

  requireCondition(
    app.includes("PatientNetworkAlternativeChoiceApp") &&
      app.includes("isPatientNetworkAlternativeChoicePath"),
    "APP_ROUTE_WIRING_MISSING",
  );

  for (const marker of [
    "AlternativeOfferHero",
    "AlternativeOfferCard",
    "AlternativeOfferReasonChipRow",
    "AlternativeOfferSelectionPanel",
    "CallbackFallbackCard",
    "AlternativeOfferExpiryStrip",
    "AlternativeOfferProvenanceStub",
    "OfferRouteRepairPanel",
  ]) {
    requireCondition(route.includes(marker), `ROUTE_COMPONENT_MISSING:${marker}`);
  }

  for (const marker of [
    "data-network-choice",
    "data-offer-session",
    "data-choice-actionability",
    "data-selected-offer-entry",
    "data-selected-anchor-ref",
    "data-selected-anchor-tuple-hash",
    "data-callback-fallback",
    "data-offer-provenance",
    "data-repair-state",
  ]) {
    requireCondition(route.includes(marker), `DOM_MARKER_MISSING:${marker}`);
  }

  for (const selector of [
    ".patient-network-choice__card",
    ".patient-network-choice__callback-card",
    ".patient-network-choice__selection-panel",
    ".patient-network-choice__provenance",
    ".patient-network-choice__repair-panel",
  ]) {
    requireCondition(css.includes(selector), `CSS_SELECTOR_MISSING:${selector}`);
  }
}

function validateArtifacts() {
  const contract = JSON.parse(
    read(path.join(ROOT, "data", "contracts", "328_patient_network_alternative_choice_contract.json")),
  ) as {
    taskId?: string;
    visualMode?: string;
    domMarkers?: string[];
    choiceLaw?: {
      fullCurrentSetVisible?: boolean;
      recommendationAdvisoryOnly?: boolean;
      preselectedChoiceForbiddenOnFirstEntry?: boolean;
      autoAcceptForbidden?: boolean;
    };
    callbackLaw?: {
      separateFromRankedRows?: boolean;
      inheritsRankOrdinal?: boolean;
      inheritsRankedMarkers?: boolean;
    };
    recoveryLaw?: {
      preserveSelectedAnchorThroughRepair?: boolean;
      readOnlyProvenanceForExpiredSupersededOrDrift?: boolean;
      blockFreshMutationOnStaleLinkOrWrongPatient?: boolean;
    };
  };
  const spec = read(
    path.join(ROOT, "docs", "frontend", "328_patient_network_alternative_choice_spec.md"),
  );
  const atlas = read(
    path.join(ROOT, "docs", "frontend", "328_patient_network_alternative_choice_atlas.html"),
  );
  const alignment = read(path.join(ROOT, "data", "analysis", "328_algorithm_alignment_notes.md"));
  const matrix = read(path.join(ROOT, "data", "analysis", "328_patient_network_choice_state_matrix.csv"));
  const notes = read(path.join(ROOT, "data", "analysis", "328_visual_reference_notes.json"));

  requireCondition(contract.taskId === "par_328", "CONTRACT_TASK_ID_INVALID");
  requireCondition(
    contract.visualMode === PATIENT_NETWORK_ALTERNATIVE_CHOICE_VISUAL_MODE,
    "CONTRACT_VISUAL_MODE_INVALID",
  );
  requireCondition(
    contract.domMarkers?.includes("data-callback-fallback"),
    "CONTRACT_CALLBACK_MARKER_MISSING",
  );
  requireCondition(
    contract.choiceLaw?.fullCurrentSetVisible === true &&
      contract.choiceLaw?.recommendationAdvisoryOnly === true &&
      contract.choiceLaw?.preselectedChoiceForbiddenOnFirstEntry === true &&
      contract.choiceLaw?.autoAcceptForbidden === true,
    "CHOICE_LAW_INVALID",
  );
  requireCondition(
    contract.callbackLaw?.separateFromRankedRows === true &&
      contract.callbackLaw?.inheritsRankOrdinal === false &&
      contract.callbackLaw?.inheritsRankedMarkers === false,
    "CALLBACK_LAW_INVALID",
  );
  requireCondition(
    contract.recoveryLaw?.preserveSelectedAnchorThroughRepair === true &&
      contract.recoveryLaw?.readOnlyProvenanceForExpiredSupersededOrDrift === true &&
      contract.recoveryLaw?.blockFreshMutationOnStaleLinkOrWrongPatient === true,
    "RECOVERY_LAW_INVALID",
  );

  for (const marker of [
    "https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration",
    "https://service-manual.nhs.uk/design-system/patterns/confirmation-page",
    "https://service-manual.nhs.uk/design-system/patterns/question-pages",
    "https://www.w3.org/WAI/ARIA/apg/patterns/radio/",
    "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/",
    "https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum",
    "https://www.w3.org/WAI/WCAG22/Understanding/reflow",
    "https://www.w3.org/WAI/WCAG21/Understanding/status-messages.html",
    "https://playwright.dev/docs/best-practices",
    "https://playwright.dev/docs/aria-snapshots",
    "https://playwright.dev/docs/emulation",
    "https://playwright.dev/docs/next/trace-viewer",
    "https://linear.app/now/how-we-redesigned-the-linear-ui",
    "https://linear.app/docs/conceptual-model",
  ]) {
    requireCondition(notes.includes(marker), `VISUAL_REFERENCE_URL_MISSING:${marker}`);
  }

  for (const marker of [
    "AlternativeOfferSessionRouteSnapshot328",
    "HubOfferToConfirmationTruthProjectionRouteSnapshot328",
    "AlternativeOfferRegenerationSettlementRouteSnapshot328",
    "AlternativeOfferProvenanceStub",
    "sameShellContinuationRef",
  ]) {
    requireCondition(alignment.includes(marker), `ALIGNMENT_MARKER_MISSING:${marker}`);
  }

  for (const scenarioId of [
    "offer_session_328_live",
    "offer_session_328_contact_repair",
    "offer_session_328_stale_link",
    "offer_session_328_regenerated",
    "offer_session_328_embedded_drift",
  ]) {
    requireCondition(matrix.includes(scenarioId), `STATE_MATRIX_ROW_MISSING:${scenarioId}`);
  }

  requireCondition(
    spec.includes("callback remains a visibly separate governed fallback action") &&
      spec.includes("no preselected option on first entry"),
    "SPEC_CORE_LAW_MISSING",
  );
  requireCondition(
    atlas.includes('data-testid="PatientNetworkAlternativeChoiceAtlas"') &&
      atlas.includes('data-visual-mode="Patient_Network_Open_Choice"'),
    "ATLAS_ROOT_MARKERS_MISSING",
  );
}

function validateModelRuntime() {
  const live = resolvePatientNetworkAlternativeChoiceProjectionByScenarioId(
    "offer_session_328_live",
  );
  requireCondition(live, "LIVE_SCENARIO_MISSING");
  requireCondition(live.offerCards.length === 4, "LIVE_OFFER_CARD_COUNT_INVALID");
  requireCondition(live.selectedOfferEntryId === null, "LIVE_ROUTE_SHOULD_NOT_PRESELECT");
  requireCondition(
    live.callbackFallbackCard.eligibilityState === "visible",
    "LIVE_CALLBACK_SHOULD_BE_VISIBLE",
  );
  requireCondition(
    live.offerCards.every((card) => card.selectionState === "available"),
    "LIVE_CARDS_SHOULD_ALL_BE_AVAILABLE",
  );

  const contactRepair = resolvePatientNetworkAlternativeChoiceProjectionByScenarioId(
    "offer_session_328_contact_repair",
  );
  requireCondition(contactRepair?.routeRepairPanel, "CONTACT_REPAIR_PANEL_MISSING");
  requireCondition(
    contactRepair.selectedOfferEntryId === "offer_entry_328_wharf_1910",
    "CONTACT_REPAIR_SELECTED_ANCHOR_INVALID",
  );

  const stale = resolvePatientNetworkAlternativeChoiceProjectionByScenarioId(
    "offer_session_328_stale_link",
  );
  requireCondition(
    stale?.truthProjection.offerActionabilityState === "blocked" &&
      stale.provenanceStub?.actionLabel === "Open current choice set",
    "STALE_LINK_RECOVERY_INVALID",
  );

  const superseded = resolvePatientNetworkAlternativeChoiceProjectionByScenarioId(
    "offer_session_328_superseded",
  );
  requireCondition(
    superseded?.truthProjection.offerActionabilityState === "read_only_provenance" &&
      superseded.provenanceStub?.transitionScenarioId === "offer_session_328_regenerated",
    "SUPERSEDED_PROVENANCE_INVALID",
  );

  const regenerated = resolvePatientNetworkAlternativeChoiceProjectionByScenarioId(
    "offer_session_328_regenerated",
  );
  requireCondition(
    regenerated?.selectedOfferEntryId === "offer_entry_328_wharf_1910" &&
      regenerated.truthProjection.offerActionabilityState === "live_open_choice",
    "REGENERATED_SELECTION_INVALID",
  );

  const embeddedDrift = resolvePatientNetworkAlternativeChoiceProjectionByScenarioId(
    "offer_session_328_embedded_drift",
  );
  requireCondition(
    embeddedDrift?.recoveryReason === "embedded_drift" &&
      embeddedDrift.truthProjection.offerActionabilityState === "blocked",
    "EMBEDDED_DRIFT_INVALID",
  );

  const publicationDrift = resolvePatientNetworkAlternativeChoiceProjectionByScenarioId(
    "offer_session_328_publication_drift",
  );
  requireCondition(
    publicationDrift?.recoveryReason === "publication_drift" &&
      publicationDrift.provenanceStub?.transitionScenarioId === "offer_session_328_regenerated",
    "PUBLICATION_DRIFT_INVALID",
  );

  requireCondition(
    isPatientNetworkAlternativeChoicePath("/bookings/network/offer_session_328_live"),
    "PATH_MATCHING_INVALID",
  );
  requireCondition(
    resolvePatientNetworkAlternativeChoiceScenarioId(
      "/bookings/network/offer_session_328_regenerated",
    ) === "offer_session_328_regenerated",
    "PATH_SCENARIO_RESOLUTION_INVALID",
  );
}

function main() {
  validateFiles();
  validateChecklist();
  validatePackageScript();
  validateFrontendFiles();
  validateArtifacts();
  validateModelRuntime();
  console.log("validate_328_patient_network_alternative_choice: ok");
}

main();
