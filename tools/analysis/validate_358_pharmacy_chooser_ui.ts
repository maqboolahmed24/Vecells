import fs from "node:fs";
import path from "node:path";

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const ROOT = "/Users/test/Code/V";

const requiredFiles = [
  "apps/patient-web/src/patient-pharmacy-chooser.tsx",
  "apps/patient-web/src/patient-pharmacy-chooser.css",
  "packages/domains/pharmacy/src/phase6-pharmacy-choice-preview.ts",
  "docs/frontend/358_pharmacy_chooser_spec.md",
  "docs/frontend/358_pharmacy_chooser_atlas.html",
  "docs/frontend/358_pharmacy_chooser_topology.mmd",
  "docs/frontend/358_pharmacy_chooser_tokens.json",
  "docs/accessibility/358_pharmacy_chooser_a11y_notes.md",
  "data/contracts/358_pharmacy_chooser_contract.json",
  "data/analysis/358_algorithm_alignment_notes.md",
  "data/analysis/358_choice_grouping_filter_matrix.csv",
  "data/analysis/358_visual_reference_notes.json",
  "tests/playwright/358_pharmacy_chooser_list_map.spec.ts",
  "tests/playwright/358_pharmacy_chooser_warning_and_change.spec.ts",
  "tests/playwright/358_pharmacy_chooser_accessibility.spec.ts",
  "tests/playwright/358_pharmacy_chooser_visual.spec.ts",
] as const;

for (const relativePath of requiredFiles) {
  invariant(fs.existsSync(path.join(ROOT, relativePath)), `Missing required file: ${relativePath}`);
}

const contract = JSON.parse(
  fs.readFileSync(
    path.join(ROOT, "data/contracts/358_pharmacy_chooser_contract.json"),
    "utf8",
  ),
) as {
  visualMode?: string;
  components?: string[];
  scenarios?: string[];
  rootDataAttributes?: string[];
};

invariant(
  contract.visualMode === "Pharmacy_Chooser_Premium",
  "Contract visualMode must be Pharmacy_Chooser_Premium.",
);
invariant(
  Array.isArray(contract.components) && contract.components.length === 8,
  "Contract must declare the 8 authoritative chooser components.",
);
invariant(
  Array.isArray(contract.scenarios) &&
    contract.scenarios.includes("PHC-2048") &&
    contract.scenarios.includes("PHC-2148") &&
    contract.scenarios.includes("PHC-2156"),
  "Contract scenarios must include PHC-2048, PHC-2148, and PHC-2156.",
);
invariant(
  Array.isArray(contract.rootDataAttributes) &&
    contract.rootDataAttributes.includes("data-choice-visible-set-hash") &&
    contract.rootDataAttributes.includes("data-choice-drift-state"),
  "Contract must expose the chooser proof and drift data attributes.",
);

const chooserSource = fs.readFileSync(
  path.join(ROOT, "apps/patient-web/src/patient-pharmacy-chooser.tsx"),
  "utf8",
);

for (const requiredSymbol of [
  "export function PharmacyChoicePage",
  "export function PharmacyChoiceGroupSection",
  "export function PharmacyProviderCard",
  "export function PharmacyChoiceMap",
  "export function PharmacyOpenStateFilterBar",
  "export function PharmacyWarningAcknowledgementPanel",
  "export function PharmacyChosenProviderReview",
  "export function PharmacyChoiceDriftRecoveryStrip",
]) {
  invariant(
    chooserSource.includes(requiredSymbol),
    `Chooser source is missing required symbol: ${requiredSymbol}`,
  );
}

const matrixRows = fs
  .readFileSync(path.join(ROOT, "data/analysis/358_choice_grouping_filter_matrix.csv"), "utf8")
  .trim()
  .split("\n");
invariant(matrixRows.length >= 10, "Grouping/filter matrix must include the seeded scenarios.");

const notes = JSON.parse(
  fs.readFileSync(
    path.join(ROOT, "data/analysis/358_visual_reference_notes.json"),
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
      taskId: "par_358",
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
