import fs from "node:fs";
import path from "node:path";

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const ROOT = "/Users/test/Code/V";

const requiredFiles = [
  "packages/domains/pharmacy/src/phase6-pharmacy-patient-status-preview.ts",
  "packages/design-system/src/pharmacy-patient-status-surfaces.tsx",
  "packages/design-system/src/pharmacy-patient-status-surfaces.css",
  "apps/patient-web/src/patient-pharmacy-shell.tsx",
  "apps/patient-web/src/patient-pharmacy-shell.model.ts",
  "docs/frontend/360_patient_pharmacy_instructions_and_status_spec.md",
  "docs/frontend/360_patient_pharmacy_atlas.html",
  "docs/frontend/360_patient_pharmacy_status_topology.mmd",
  "docs/frontend/360_patient_pharmacy_tokens.json",
  "docs/accessibility/360_patient_pharmacy_a11y_notes.md",
  "data/contracts/360_patient_pharmacy_status_contract.json",
  "data/analysis/360_algorithm_alignment_notes.md",
  "data/analysis/360_status_and_copy_matrix.csv",
  "data/analysis/360_visual_reference_notes.json",
  "tests/playwright/360_patient_pharmacy_status_flow.spec.ts",
  "tests/playwright/360_patient_contact_repair_and_review.spec.ts",
  "tests/playwright/360_patient_pharmacy_accessibility.spec.ts",
  "tests/playwright/360_patient_pharmacy_visual.spec.ts",
] as const;

for (const relativePath of requiredFiles) {
  invariant(fs.existsSync(path.join(ROOT, relativePath)), `Missing required file: ${relativePath}`);
}

const contract = JSON.parse(
  fs.readFileSync(
    path.join(ROOT, "data/contracts/360_patient_pharmacy_status_contract.json"),
    "utf8",
  ),
) as {
  visualMode?: string;
  components?: string[];
  scenarios?: string[];
  rootDataAttributes?: string[];
};

invariant(
  contract.visualMode === "Pharmacy_Patient_Status",
  "Contract visualMode must be Pharmacy_Patient_Status.",
);
invariant(
  Array.isArray(contract.components) && contract.components.length === 9,
  "Contract must declare the 9 authoritative patient-pharmacy components.",
);
for (const scenarioId of ["PHC-2057", "PHC-2090", "PHC-2103", "PHC-2184", "PHC-2188", "PHC-2196"]) {
  invariant(
    contract.scenarios?.includes(scenarioId),
    `Contract scenarios must include ${scenarioId}.`,
  );
}
for (const attribute of [
  "data-patient-status-visual-mode",
  "data-patient-status-surface-state",
  "data-patient-status-macro-state",
  "data-patient-status-posture",
  "data-patient-status-outcome-state",
  "data-patient-status-repair-state",
  "data-patient-status-reference-mode",
  "data-patient-status-opening-state",
]) {
  invariant(
    contract.rootDataAttributes?.includes(attribute),
    `Contract rootDataAttributes must include ${attribute}.`,
  );
}

const previewSource = fs.readFileSync(
  path.join(ROOT, "packages/domains/pharmacy/src/phase6-pharmacy-patient-status-preview.ts"),
  "utf8",
);
for (const requiredSymbol of [
  "export const PHARMACY_PATIENT_STATUS_VISUAL_MODE",
  "export interface PharmacyPatientStatusPreviewSnapshot",
  "export function resolvePharmacyPatientStatusPreview",
]) {
  invariant(
    previewSource.includes(requiredSymbol),
    `Patient-status preview source is missing required symbol: ${requiredSymbol}`,
  );
}
for (const scenarioId of ["PHC-2057", "PHC-2090", "PHC-2103", "PHC-2184", "PHC-2188", "PHC-2196"]) {
  invariant(
    previewSource.includes(`pharmacyCaseId: "${scenarioId}"`),
    `Patient-status preview source must include seeded scenario ${scenarioId}.`,
  );
}

const surfacesSource = fs.readFileSync(
  path.join(ROOT, "packages/design-system/src/pharmacy-patient-status-surfaces.tsx"),
  "utf8",
);
for (const requiredSymbol of [
  "export function ChosenPharmacyConfirmationPage",
  "export function PharmacyNextStepPage",
  "export function PharmacyContactCard",
  "export function PharmacyOpeningStateChip",
  "export function PharmacyReferralReferenceCard",
  "export function PharmacyStatusTracker",
  "export function PharmacyOutcomePage",
  "export function PharmacyReviewNextStepPage",
  "export function PharmacyContactRouteRepairState",
]) {
  invariant(
    surfacesSource.includes(requiredSymbol),
    `Patient-status surfaces source is missing required symbol: ${requiredSymbol}`,
  );
}

const patientShellSource = fs.readFileSync(
  path.join(ROOT, "apps/patient-web/src/patient-pharmacy-shell.tsx"),
  "utf8",
);
for (const requiredFragment of [
  "data-patient-status-visual-mode",
  "data-patient-status-surface-state",
  "data-patient-status-macro-state",
  "data-patient-status-posture",
  "<PatientPharmacyStatusSurface",
  "<PharmacyContactCard",
  "<PharmacyReferralReferenceCard",
  "<ChosenPharmacyConfirmationPage",
  "<PharmacyStatusTracker",
]) {
  invariant(
    patientShellSource.includes(requiredFragment),
    `Patient shell is missing required 360 fragment: ${requiredFragment}`,
  );
}

const matrixRows = fs
  .readFileSync(path.join(ROOT, "data/analysis/360_status_and_copy_matrix.csv"), "utf8")
  .trim()
  .split("\n");
invariant(matrixRows.length >= 7, "Status/copy matrix must include header plus seeded rows.");

const notes = JSON.parse(
  fs.readFileSync(
    path.join(ROOT, "data/analysis/360_visual_reference_notes.json"),
    "utf8",
  ),
) as { sources?: Array<{ label?: string; url?: string }> };
invariant(
  Array.isArray(notes.sources) && notes.sources.length >= 10,
  "Visual reference notes must record the official inspiration set.",
);

console.log(
  JSON.stringify(
    {
      taskId: "par_360",
      visualMode: contract.visualMode,
      componentCount: contract.components?.length ?? 0,
      scenarioCount: contract.scenarios?.length ?? 0,
      sourceCount: notes.sources?.length ?? 0,
      matrixRows: matrixRows.length,
    },
    null,
    2,
  ),
);
