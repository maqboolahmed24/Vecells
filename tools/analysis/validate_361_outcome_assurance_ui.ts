import fs from "node:fs";
import path from "node:path";

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const ROOT = "/Users/test/Code/V";

const requiredFiles = [
  "packages/domains/pharmacy/src/phase6-pharmacy-outcome-assurance-preview.ts",
  "packages/design-system/src/pharmacy-outcome-assurance-surfaces.tsx",
  "packages/design-system/src/pharmacy-outcome-assurance-surfaces.css",
  "apps/pharmacy-console/src/pharmacy-shell-seed.tsx",
  "docs/frontend/361_outcome_assurance_and_reconciliation_spec.md",
  "docs/frontend/361_outcome_assurance_atlas.html",
  "docs/frontend/361_outcome_assurance_topology.mmd",
  "docs/frontend/361_outcome_assurance_tokens.json",
  "docs/accessibility/361_outcome_assurance_a11y_notes.md",
  "data/contracts/361_outcome_assurance_contract.json",
  "data/contracts/PHASE6_BATCH_356_363_INTERFACE_GAP_OUTCOME_ASSURANCE.json",
  "data/analysis/361_algorithm_alignment_notes.md",
  "data/analysis/361_outcome_confidence_and_gate_matrix.csv",
  "data/analysis/361_visual_reference_notes.json",
  "tests/playwright/361_outcome_assurance_core.spec.ts",
  "tests/playwright/361_outcome_assurance_manual_review.spec.ts",
  "tests/playwright/361_outcome_assurance_accessibility.spec.ts",
  "tests/playwright/361_outcome_assurance_visual.spec.ts",
] as const;

for (const relativePath of requiredFiles) {
  invariant(fs.existsSync(path.join(ROOT, relativePath)), `Missing required file: ${relativePath}`);
}

const contract = JSON.parse(
  fs.readFileSync(
    path.join(ROOT, "data/contracts/361_outcome_assurance_contract.json"),
    "utf8",
  ),
) as {
  visualMode?: string;
  components?: string[];
  scenarios?: string[];
  rootDataAttributes?: string[];
  interfaceGapRefs?: string[];
};

invariant(
  contract.visualMode === "Pharmacy_Assurance_Workbench",
  "Contract visualMode must be Pharmacy_Assurance_Workbench.",
);
invariant(
  Array.isArray(contract.components) && contract.components.length === 8,
  "Contract must declare the 8 authoritative assurance components.",
);
for (const scenarioId of ["PHC-2124", "PHC-2146", "PHC-2168"]) {
  invariant(
    contract.scenarios?.includes(scenarioId),
    `Contract scenarios must include ${scenarioId}.`,
  );
}
for (const attribute of [
  "data-assurance-visual-mode",
  "data-assurance-surface-state",
  "data-assurance-outcome-truth-state",
  "data-assurance-manual-review-state",
  "data-assurance-gate-state",
  "data-assurance-close-eligibility-state",
  "data-assurance-confidence-band",
]) {
  invariant(
    contract.rootDataAttributes?.includes(attribute),
    `Contract rootDataAttributes must include ${attribute}.`,
  );
}
invariant(
  contract.interfaceGapRefs?.includes(
    "PHASE6_BATCH_356_363_INTERFACE_GAP_OUTCOME_ASSURANCE.json",
  ),
  "Contract must reference the outcome-assurance interface-gap note.",
);

const previewSource = fs.readFileSync(
  path.join(ROOT, "packages/domains/pharmacy/src/phase6-pharmacy-outcome-assurance-preview.ts"),
  "utf8",
);
for (const requiredSymbol of [
  "export const PHARMACY_ASSURANCE_WORKBENCH_VISUAL_MODE",
  "export interface PharmacyOutcomeAssurancePreviewSnapshot",
  "export const pharmacyOutcomeAssurancePreviewCases",
  "export function resolvePharmacyOutcomeAssurancePreview",
]) {
  invariant(
    previewSource.includes(requiredSymbol),
    `Assurance preview source is missing required symbol: ${requiredSymbol}`,
  );
}
for (const scenarioId of ["PHC-2124", "PHC-2146", "PHC-2168"]) {
  invariant(
    previewSource.includes(`pharmacyCaseId: "${scenarioId}"`),
    `Assurance preview source must include seeded scenario ${scenarioId}.`,
  );
}

const surfacesSource = fs.readFileSync(
  path.join(ROOT, "packages/design-system/src/pharmacy-outcome-assurance-surfaces.tsx"),
  "utf8",
);
for (const requiredSymbol of [
  "export function PharmacyOutcomeAssurancePanel",
  "export function OutcomeEvidenceSourceCard",
  "export function OutcomeMatchSummary",
  "export function OutcomeConfidenceMeter",
  "export function OutcomeGateTimeline",
  "export function OutcomeManualReviewBanner",
  "export function OutcomeEvidenceDrawer",
  "export function OutcomeDecisionDock",
]) {
  invariant(
    surfacesSource.includes(requiredSymbol),
    `Assurance surfaces source is missing required symbol: ${requiredSymbol}`,
  );
}

const shellSource = fs.readFileSync(
  path.join(ROOT, "apps/pharmacy-console/src/pharmacy-shell-seed.tsx"),
  "utf8",
);
for (const requiredFragment of [
  "resolvePharmacyOutcomeAssurancePreview",
  "data-assurance-visual-mode",
  "data-assurance-surface-state",
  "data-support-region",
  "\"outcome_assurance\"",
  "<PharmacyOutcomeAssurancePanel",
  "<OutcomeDecisionDock",
  "data-testid=\"pharmacy-assurance-route\"",
]) {
  invariant(
    shellSource.includes(requiredFragment),
    `Pharmacy shell is missing required 361 fragment: ${requiredFragment}`,
  );
}

const appSource = fs.readFileSync(
  path.join(ROOT, "apps/pharmacy-console/src/App.tsx"),
  "utf8",
);
invariant(
  appSource.includes("@vecells/design-system/pharmacy-outcome-assurance-surfaces.css"),
  "Pharmacy app must load the assurance surfaces stylesheet.",
);

const designSystemPackage = fs.readFileSync(
  path.join(ROOT, "packages/design-system/package.json"),
  "utf8",
);
invariant(
  designSystemPackage.includes("./pharmacy-outcome-assurance-surfaces.css"),
  "Design-system package must export the assurance surfaces stylesheet.",
);

const matrixRows = fs
  .readFileSync(path.join(ROOT, "data/analysis/361_outcome_confidence_and_gate_matrix.csv"), "utf8")
  .trim()
  .split("\n");
invariant(matrixRows.length >= 4, "Confidence/gate matrix must include header plus seeded rows.");

const notes = JSON.parse(
  fs.readFileSync(
    path.join(ROOT, "data/analysis/361_visual_reference_notes.json"),
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
      taskId: "par_361",
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
