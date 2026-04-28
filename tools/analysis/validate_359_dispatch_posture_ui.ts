import fs from "node:fs";
import path from "node:path";

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const ROOT = "/Users/test/Code/V";

const requiredFiles = [
  "packages/domains/pharmacy/src/phase6-pharmacy-dispatch-preview.ts",
  "packages/design-system/src/pharmacy-dispatch-surfaces.tsx",
  "packages/design-system/src/pharmacy-dispatch-surfaces.css",
  "apps/pharmacy-console/src/pharmacy-shell-seed.tsx",
  "apps/patient-web/src/patient-pharmacy-shell.tsx",
  "docs/frontend/359_referral_confirmation_and_dispatch_posture_spec.md",
  "docs/frontend/359_referral_confirmation_atlas.html",
  "docs/frontend/359_dispatch_posture_topology.mmd",
  "docs/frontend/359_dispatch_tokens.json",
  "docs/accessibility/359_dispatch_a11y_notes.md",
  "data/contracts/359_dispatch_posture_contract.json",
  "data/analysis/359_algorithm_alignment_notes.md",
  "data/analysis/359_dispatch_state_and_copy_matrix.csv",
  "data/analysis/359_visual_reference_notes.json",
  "tests/playwright/359_referral_confirmation_drawer.spec.ts",
  "tests/playwright/359_dispatch_patient_state.spec.ts",
  "tests/playwright/359_dispatch_accessibility.spec.ts",
  "tests/playwright/359_dispatch_visual.spec.ts",
] as const;

for (const relativePath of requiredFiles) {
  invariant(fs.existsSync(path.join(ROOT, relativePath)), `Missing required file: ${relativePath}`);
}

const contract = JSON.parse(
  fs.readFileSync(
    path.join(ROOT, "data/contracts/359_dispatch_posture_contract.json"),
    "utf8",
  ),
) as {
  visualMode?: string;
  components?: string[];
  scenarios?: string[];
  rootDataAttributes?: string[];
  staffDrawerRows?: string[];
};

invariant(
  contract.visualMode === "Pharmacy_Dispatch_Assurance",
  "Contract visualMode must be Pharmacy_Dispatch_Assurance.",
);
invariant(
  Array.isArray(contract.components) && contract.components.length === 8,
  "Contract must declare the 8 authoritative dispatch-posture components.",
);
for (const scenarioId of ["PHC-2048", "PHC-2057", "PHC-2090", "PHC-2148", "PHC-2156"]) {
  invariant(
    contract.scenarios?.includes(scenarioId),
    `Contract scenarios must include ${scenarioId}.`,
  );
}
for (const attribute of [
  "data-dispatch-surface-state",
  "data-dispatch-authoritative-proof-state",
  "data-consent-checkpoint-state",
  "data-consent-continuity-state",
  "data-patient-calm-allowed",
]) {
  invariant(
    contract.rootDataAttributes?.includes(attribute),
    `Contract rootDataAttributes must include ${attribute}.`,
  );
}
invariant(
  Array.isArray(contract.staffDrawerRows) && contract.staffDrawerRows.length === 5,
  "Contract must declare the 5 staff drawer evidence rows.",
);

const previewSource = fs.readFileSync(
  path.join(ROOT, "packages/domains/pharmacy/src/phase6-pharmacy-dispatch-preview.ts"),
  "utf8",
);
for (const requiredSymbol of [
  "export const PHARMACY_DISPATCH_ASSURANCE_VISUAL_MODE",
  "export interface PharmacyDispatchPreviewSnapshot",
  "export function resolvePharmacyDispatchPreview",
]) {
  invariant(
    previewSource.includes(requiredSymbol),
    `Dispatch preview source is missing required symbol: ${requiredSymbol}`,
  );
}
for (const scenarioId of ["PHC-2048", "PHC-2057", "PHC-2090", "PHC-2148", "PHC-2156"]) {
  invariant(
    previewSource.includes(`pharmacyCaseId: "${scenarioId}"`),
    `Dispatch preview source must include seeded scenario ${scenarioId}.`,
  );
}

const surfacesSource = fs.readFileSync(
  path.join(ROOT, "packages/design-system/src/pharmacy-dispatch-surfaces.tsx"),
  "utf8",
);
for (const requiredSymbol of [
  "export function PharmacyReferralConfirmationDrawer",
  "export function DispatchProofStatusStrip",
  "export function DispatchEvidenceRows",
  "export function DispatchArtifactSummaryCard",
  "export function PatientDispatchPendingState",
  "export function PatientConsentCheckpointNotice",
  "export function ChosenPharmacyAnchorCard",
  "export function DispatchContinuityWarningStrip",
]) {
  invariant(
    surfacesSource.includes(requiredSymbol),
    `Dispatch surfaces source is missing required symbol: ${requiredSymbol}`,
  );
}

const patientShellSource = fs.readFileSync(
  path.join(ROOT, "apps/patient-web/src/patient-pharmacy-shell.tsx"),
  "utf8",
);
for (const requiredFragment of [
  "data-dispatch-surface-state",
  "data-consent-checkpoint-state",
  "data-patient-calm-allowed",
  "<PatientPharmacyDispatchSurface",
  "<ChosenPharmacyAnchorCard anchor={dispatchPreview.chosenPharmacy}",
  "<PatientConsentCheckpointNotice",
  "<PatientDispatchPendingState",
  "<DispatchContinuityWarningStrip",
]) {
  invariant(
    patientShellSource.includes(requiredFragment),
    `Patient shell is missing required dispatch fragment: ${requiredFragment}`,
  );
}

const pharmacyShellSource = fs.readFileSync(
  path.join(ROOT, "apps/pharmacy-console/src/pharmacy-shell-seed.tsx"),
  "utf8",
);
for (const requiredFragment of [
  "data-dispatch-visual-mode",
  "data-dispatch-surface-state",
  "data-dispatch-authoritative-proof-state",
  "data-consent-checkpoint-state",
  "<PharmacyReferralConfirmationDrawer",
  "<DispatchProofStatusStrip",
  "<ChosenPharmacyAnchorCard",
]) {
  invariant(
    pharmacyShellSource.includes(requiredFragment),
    `Pharmacy shell is missing required dispatch fragment: ${requiredFragment}`,
  );
}

const matrixRows = fs
  .readFileSync(path.join(ROOT, "data/analysis/359_dispatch_state_and_copy_matrix.csv"), "utf8")
  .trim()
  .split("\n");
invariant(matrixRows.length >= 6, "Dispatch state/copy matrix must include header plus seeded rows.");

const notes = JSON.parse(
  fs.readFileSync(
    path.join(ROOT, "data/analysis/359_visual_reference_notes.json"),
    "utf8",
  ),
) as { sources?: Array<{ label?: string; url?: string }> };
invariant(
  Array.isArray(notes.sources) && notes.sources.length >= 8,
  "Visual reference notes must record the official inspiration set.",
);

console.log(
  JSON.stringify(
    {
      taskId: "par_359",
      visualMode: contract.visualMode,
      componentCount: contract.components?.length ?? 0,
      scenarioCount: contract.scenarios?.length ?? 0,
      evidenceRowCount: contract.staffDrawerRows?.length ?? 0,
      sourceCount: notes.sources?.length ?? 0,
      matrixRows: matrixRows.length,
    },
    null,
    2,
  ),
);
