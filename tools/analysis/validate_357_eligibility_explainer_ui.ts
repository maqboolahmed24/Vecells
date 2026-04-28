import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  PHARMACY_ELIGIBILITY_CLARITY_VISUAL_MODE,
  resolvePharmacyEligibilityPreview,
} from "../../packages/domains/pharmacy/src/phase6-pharmacy-eligibility-preview.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const REQUIRED_FILES = [
  path.join(ROOT, "packages", "domains", "pharmacy", "src", "phase6-pharmacy-eligibility-preview.ts"),
  path.join(ROOT, "packages", "design-system", "src", "pharmacy-eligibility-surfaces.tsx"),
  path.join(ROOT, "packages", "design-system", "src", "pharmacy-eligibility-surfaces.css"),
  path.join(ROOT, "apps", "pharmacy-console", "src", "pharmacy-shell-seed.tsx"),
  path.join(ROOT, "apps", "patient-web", "src", "patient-pharmacy-shell.tsx"),
  path.join(ROOT, "apps", "patient-web", "src", "patient-pharmacy-shell.model.ts"),
  path.join(ROOT, "docs", "frontend", "357_eligibility_explainer_and_return_state_spec.md"),
  path.join(ROOT, "docs", "frontend", "357_eligibility_explainer_atlas.html"),
  path.join(ROOT, "docs", "frontend", "357_eligibility_flow_topology.mmd"),
  path.join(ROOT, "docs", "frontend", "357_eligibility_tokens.json"),
  path.join(ROOT, "docs", "accessibility", "357_eligibility_a11y_notes.md"),
  path.join(ROOT, "data", "contracts", "357_eligibility_explainer_contract.json"),
  path.join(ROOT, "data", "analysis", "357_algorithm_alignment_notes.md"),
  path.join(ROOT, "data", "analysis", "357_gate_disclosure_matrix.csv"),
  path.join(ROOT, "data", "analysis", "357_visual_reference_notes.json"),
  path.join(ROOT, "tests", "playwright", "357_eligibility_staff_explainer.spec.ts"),
  path.join(ROOT, "tests", "playwright", "357_eligibility_patient_return_state.spec.ts"),
  path.join(ROOT, "tests", "playwright", "357_eligibility_accessibility.spec.ts"),
  path.join(ROOT, "tests", "playwright", "357_eligibility_visual.spec.ts"),
];

const REQUIRED_SCRIPT =
  '"validate:357-eligibility-explainer-ui": "pnpm exec tsx ./tools/analysis/validate_357_eligibility_explainer_ui.ts"';

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
      "- [-] par_357_phase6_track_Playwright_or_other_appropriate_tooling_frontend_build_eligibility_explainer_and_patient_unsuitable_return_views",
    ) ||
      checklist.includes(
        "- [X] par_357_phase6_track_Playwright_or_other_appropriate_tooling_frontend_build_eligibility_explainer_and_patient_unsuitable_return_views",
      ),
    "CHECKLIST_ROW_MISSING_OR_UNCLAIMED:par_357",
  );
}

function validatePackageScript() {
  const packageJson = read(path.join(ROOT, "package.json"));
  requireCondition(
    packageJson.includes(REQUIRED_SCRIPT),
    "PACKAGE_SCRIPT_MISSING:validate:357-eligibility-explainer-ui",
  );
}

function validateFrontendFiles() {
  const designSystem = read(
    path.join(ROOT, "packages", "design-system", "src", "pharmacy-eligibility-surfaces.tsx"),
  );
  const designSystemCss = read(
    path.join(ROOT, "packages", "design-system", "src", "pharmacy-eligibility-surfaces.css"),
  );
  const workspace = read(
    path.join(ROOT, "apps", "pharmacy-console", "src", "pharmacy-shell-seed.tsx"),
  );
  const patient = read(
    path.join(ROOT, "apps", "patient-web", "src", "patient-pharmacy-shell.tsx"),
  );
  const patientModel = read(
    path.join(ROOT, "apps", "patient-web", "src", "patient-pharmacy-shell.model.ts"),
  );

  for (const marker of [
    "PharmacyEligibilityRuleExplainer",
    "EligibilityGateLadder",
    "EligibilityVersionChip",
    "EligibilityEvidenceDrawer",
    "PatientUnsuitableReturnState",
    "PatientAlternativeRouteNextStepPanel",
    "EligibilitySupersessionNotice",
  ]) {
    requireCondition(designSystem.includes(marker), `DESIGN_SYSTEM_COMPONENT_MISSING:${marker}`);
  }

  for (const marker of [
    "resolvePharmacyEligibilityPreview",
    "data-decision-tuple-hash",
    "data-eligibility-bundle-id",
    "data-eligibility-final-disposition",
    "data-eligibility-publication-state",
  ]) {
    requireCondition(workspace.includes(marker), `WORKSPACE_MARKER_MISSING:${marker}`);
    requireCondition(patient.includes(marker), `PATIENT_MARKER_MISSING:${marker}`);
  }

  requireCondition(
    patient.includes("PatientUnsuitableReturnState") &&
      patient.includes("PatientAlternativeRouteNextStepPanel"),
    "PATIENT_UNSUITABLE_SURFACES_MISSING",
  );
  requireCondition(
    workspace.includes("PharmacyEligibilityRuleExplainer") &&
      workspace.includes("EligibilityEvidenceDrawer"),
    "WORKSPACE_EXPLAINER_SURFACES_MISSING",
  );
  requireCondition(
    patientModel.includes('pharmacyCaseId: "PHC-2090"'),
    "PATIENT_MODEL_CASE_MISSING:PHC-2090",
  );

  for (const className of [
    ".pharmacy-eligibility-surface",
    ".pharmacy-eligibility-ladder__button",
    ".pharmacy-eligibility-primary-action",
    ".pharmacy-eligibility-notice",
  ]) {
    requireCondition(designSystemCss.includes(className), `DESIGN_SYSTEM_STYLE_MISSING:${className}`);
  }
}

function validatePreviewTruth() {
  const returned = resolvePharmacyEligibilityPreview("PHC-2090");
  const superseded = resolvePharmacyEligibilityPreview("PHC-2124");
  const eligible = resolvePharmacyEligibilityPreview("PHC-2048");

  requireCondition(returned, "PREVIEW_CASE_MISSING:PHC-2090");
  requireCondition(superseded, "PREVIEW_CASE_MISSING:PHC-2124");
  requireCondition(eligible, "PREVIEW_CASE_MISSING:PHC-2048");

  requireCondition(
    returned.finalDisposition === "ineligible_returned",
    "PREVIEW_FINAL_DISPOSITION_INVALID:PHC-2090",
  );
  requireCondition(
    superseded.publicationState === "superseded" &&
      Boolean(superseded.supersessionNotice),
    "PREVIEW_SUPERSESSION_INVALID:PHC-2124",
  );
  requireCondition(
    eligible.finalDisposition === "eligible_choice_pending",
    "PREVIEW_ELIGIBLE_INVALID:PHC-2048",
  );
  requireCondition(
    returned.decisionTupleHash !== superseded.decisionTupleHash,
    "PREVIEW_TUPLE_HASH_COLLISION",
  );
}

function validateArtifacts() {
  const spec = read(
    path.join(ROOT, "docs", "frontend", "357_eligibility_explainer_and_return_state_spec.md"),
  );
  const atlas = read(path.join(ROOT, "docs", "frontend", "357_eligibility_explainer_atlas.html"));
  const topology = read(path.join(ROOT, "docs", "frontend", "357_eligibility_flow_topology.mmd"));
  const a11y = read(path.join(ROOT, "docs", "accessibility", "357_eligibility_a11y_notes.md"));
  const alignment = read(path.join(ROOT, "data", "analysis", "357_algorithm_alignment_notes.md"));
  const matrix = read(path.join(ROOT, "data", "analysis", "357_gate_disclosure_matrix.csv"));
  const notes = JSON.parse(
    read(path.join(ROOT, "data", "analysis", "357_visual_reference_notes.json")),
  ) as {
    taskId?: string;
    visualMode?: string;
    sources?: Array<{ url: string }>;
  };
  const tokens = JSON.parse(
    read(path.join(ROOT, "docs", "frontend", "357_eligibility_tokens.json")),
  ) as {
    taskId?: string;
    visualMode?: string;
    dimensions?: { staffEvidenceRailPx?: number; patientReturnStateMaxWidthPx?: number };
    motion?: { reducedMotion?: boolean };
  };
  const contract = JSON.parse(
    read(path.join(ROOT, "data", "contracts", "357_eligibility_explainer_contract.json")),
  ) as {
    taskId?: string;
    visualMode?: string;
    components?: string[];
    domMarkers?: string[];
    laws?: Record<string, boolean>;
  };

  requireCondition(spec.includes("PharmacyEligibilityRuleExplainer"), "SPEC_COMPONENT_MISSING");
  requireCondition(spec.includes("PatientUnsuitableReturnState"), "SPEC_PATIENT_STATE_MISSING");
  requireCondition(spec.includes("same request shell"), "SPEC_SAME_SHELL_RULE_MISSING");
  requireCondition(
    atlas.includes('data-testid="357EligibilityAtlas"') &&
      atlas.includes('data-visual-mode="Pharmacy_Eligibility_Clarity"'),
    "ATLAS_ROOT_MARKERS_MISSING",
  );
  requireCondition(
    topology.includes('ExplanationBundle["EligibilityExplanationBundleSnapshot"]') &&
      topology.includes('PatientNext["Patient next-step panel"]'),
    "TOPOLOGY_FLOW_INCOMPLETE",
  );
  requireCondition(a11y.includes("aria-expanded"), "A11Y_DISCLOSURE_NOTE_MISSING");
  requireCondition(alignment.includes("decisionTupleHash"), "ALIGNMENT_TUPLE_MAPPING_MISSING");
  requireCondition(
    matrix.includes("matchedRuleIds,visible in staff-safe explanation only,hidden"),
    "DISCLOSURE_MATRIX_INTERNAL_RULE_ROW_MISSING",
  );

  requireCondition(tokens.taskId === "par_357", "TOKENS_TASK_ID_INVALID");
  requireCondition(
    tokens.visualMode === PHARMACY_ELIGIBILITY_CLARITY_VISUAL_MODE,
    "TOKENS_VISUAL_MODE_INVALID",
  );
  requireCondition(
    tokens.dimensions?.staffEvidenceRailPx === 360 &&
      tokens.dimensions?.patientReturnStateMaxWidthPx === 720 &&
      tokens.motion?.reducedMotion === true,
    "TOKENS_CORE_VALUES_INVALID",
  );

  requireCondition(contract.taskId === "par_357", "CONTRACT_TASK_ID_INVALID");
  requireCondition(
    contract.visualMode === PHARMACY_ELIGIBILITY_CLARITY_VISUAL_MODE,
    "CONTRACT_VISUAL_MODE_INVALID",
  );
  requireCondition(
    contract.components?.includes("EligibilityEvidenceDrawer") &&
      contract.components?.includes("PatientAlternativeRouteNextStepPanel"),
    "CONTRACT_COMPONENTS_INVALID",
  );
  requireCondition(
    contract.domMarkers?.includes("data-decision-tuple-hash") &&
      contract.domMarkers?.includes("data-eligibility-publication-state"),
    "CONTRACT_DOM_MARKERS_INVALID",
  );
  requireCondition(
    contract.laws?.singleExplanationTruth === true &&
      contract.laws?.patientCopyMayRedactButNotChangeDecisionTruth === true &&
      contract.laws?.supersededBundlesFreezeCurrentPosture === true,
    "CONTRACT_LAWS_INVALID",
  );

  for (const url of [
    "https://service-manual.nhs.uk/design-system/patterns/interruption-page",
    "https://service-manual.nhs.uk/design-system/patterns/confirmation-page",
    "https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/",
    "https://www.w3.org/WAI/ARIA/apg/patterns/accordion/",
    "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/",
    "https://playwright.dev/docs/accessibility-testing",
    "https://playwright.dev/docs/aria-snapshots",
    "https://playwright.dev/docs/browser-contexts",
    "https://linear.app/now/behind-the-latest-design-refresh",
  ]) {
    requireCondition(
      notes.sources?.some((entry) => entry.url === url),
      `VISUAL_REFERENCE_SOURCE_MISSING:${url}`,
    );
  }
}

function main() {
  validateFiles();
  validateChecklist();
  validatePackageScript();
  validateFrontendFiles();
  validatePreviewTruth();
  validateArtifacts();
  console.log("357 eligibility explainer UI validation passed.");
}

main();
