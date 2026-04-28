import fs from "node:fs";
import path from "node:path";

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const ROOT = "/Users/test/Code/V";

const requiredFiles = [
  "packages/design-system/src/pharmacy-workbench-surfaces.tsx",
  "packages/design-system/src/pharmacy-workbench-surfaces.css",
  "apps/pharmacy-console/src/pharmacy-workbench.model.ts",
  "apps/pharmacy-console/src/pharmacy-shell-seed.model.ts",
  "apps/pharmacy-console/src/pharmacy-shell-seed.tsx",
  "docs/frontend/363_pharmacy_operations_panel_and_workbench_spec.md",
  "docs/frontend/363_pharmacy_workbench_atlas.html",
  "docs/frontend/363_pharmacy_workbench_topology.mmd",
  "docs/frontend/363_pharmacy_workbench_tokens.json",
  "docs/accessibility/363_pharmacy_workbench_a11y_notes.md",
  "data/contracts/363_pharmacy_workbench_contract.json",
  "data/contracts/PHASE6_BATCH_356_363_INTERFACE_GAP_PHARMACY_WORKBENCH.json",
  "data/analysis/363_algorithm_alignment_notes.md",
  "data/analysis/363_workbench_and_support_region_matrix.csv",
  "data/analysis/363_visual_reference_notes.json",
  "tests/playwright/363_pharmacy_workbench_queue_and_case.spec.ts",
  "tests/playwright/363_inventory_comparison_and_handoff.spec.ts",
  "tests/playwright/363_pharmacy_workbench_accessibility.spec.ts",
  "tests/playwright/363_pharmacy_workbench_visual.spec.ts"
] as const;

for (const relativePath of requiredFiles) {
  invariant(fs.existsSync(path.join(ROOT, relativePath)), `Missing required file: ${relativePath}`);
}

const contract = JSON.parse(
  fs.readFileSync(
    path.join(ROOT, "data/contracts/363_pharmacy_workbench_contract.json"),
    "utf8",
  ),
) as {
  visualMode?: string;
  components?: string[];
  promotedSupportRegions?: string[];
  operationalStates?: string[];
  rootDataAttributes?: string[];
  interfaceGapRefs?: string[];
  scenarios?: string[];
};

invariant(
  contract.visualMode === "Pharmacy_Operations_Workbench",
  "Contract visualMode must be Pharmacy_Operations_Workbench.",
);
invariant(
  Array.isArray(contract.components) && contract.components.length === 10,
  "Contract must declare the 10 authoritative workbench components.",
);
invariant(
  Array.isArray(contract.promotedSupportRegions) &&
    contract.promotedSupportRegions.includes("operations_queue") &&
    contract.promotedSupportRegions.includes("inventory_comparison") &&
    contract.promotedSupportRegions.includes("handoff_readiness"),
  "Contract must include the authoritative promoted support regions.",
);
invariant(
  Array.isArray(contract.operationalStates) && contract.operationalStates.length === 9,
  "Contract must declare the 9 operational state refs.",
);
for (const attribute of [
  "data-workbench-visual-mode",
  "data-workbench-stock-risk",
  "data-workbench-watch-state",
  "data-workbench-provider-health",
  "data-workbench-settlement-state",
  "data-workbench-handoff-state",
  "data-promoted-support-region",
  "data-current-path",
  "data-route-key",
  "data-selected-case-id",
  "data-selected-line-item-id",
] as const) {
  invariant(
    contract.rootDataAttributes?.includes(attribute),
    `Contract rootDataAttributes must include ${attribute}.`,
  );
}
for (const scenarioId of ["PHC-2072", "PHC-2124", "PHC-2232", "PHC-2244"]) {
  invariant(
    contract.scenarios?.includes(scenarioId),
    `Contract scenarios must include ${scenarioId}.`,
  );
}
invariant(
  contract.interfaceGapRefs?.includes(
    "PHASE6_BATCH_356_363_INTERFACE_GAP_PHARMACY_WORKBENCH.json",
  ),
  "Contract must reference the pharmacy workbench interface-gap note.",
);

const workbenchSurfacesSource = fs.readFileSync(
  path.join(ROOT, "packages/design-system/src/pharmacy-workbench-surfaces.tsx"),
  "utf8",
);
for (const requiredSymbol of [
  "export const PHARMACY_OPERATIONS_WORKBENCH_VISUAL_MODE",
  "export function PharmacyOperationsPanel",
  "export function PharmacyOperationsQueueTable",
  "export function PharmacyCaseWorkbench",
  "export function MedicationValidationBoard",
  "export function InventoryTruthPanel",
  "export function InventoryComparisonWorkspace",
  "export function HandoffReadinessBoard",
  "export function PharmacyStockRiskChip",
  "export function PharmacyWatchWindowBanner",
  "export function PharmacyWorkbenchDecisionDock",
]) {
  invariant(
    workbenchSurfacesSource.includes(requiredSymbol),
    `Workbench surfaces source is missing required symbol: ${requiredSymbol}`,
  );
}

const shellSource = fs.readFileSync(
  path.join(ROOT, "apps/pharmacy-console/src/pharmacy-shell-seed.tsx"),
  "utf8",
);
for (const requiredFragment of [
  "resolvePharmacyWorkbenchViewModels",
  "restoreInitialShellState",
  "data-workbench-visual-mode",
  "data-workbench-stock-risk",
  "data-workbench-watch-state",
  "data-workbench-provider-health",
  "data-workbench-settlement-state",
  "data-workbench-handoff-state",
  "<PharmacyOperationsPanel",
  "<PharmacyCaseWorkbench",
  "<InventoryTruthPanel",
  "<InventoryComparisonWorkspace",
  "<HandoffReadinessBoard",
  "<PharmacyWorkbenchDecisionDock",
]) {
  invariant(
    shellSource.includes(requiredFragment),
    `Pharmacy shell is missing required 363 fragment: ${requiredFragment}`,
  );
}

const shellModelSource = fs.readFileSync(
  path.join(ROOT, "apps/pharmacy-console/src/pharmacy-shell-seed.model.ts"),
  "utf8",
);
for (const scenarioId of ["PHC-2232", "PHC-2244"]) {
  invariant(
    shellModelSource.includes(`pharmacyCaseId: "${scenarioId}"`),
    `Shell seed model must include scenario ${scenarioId}.`,
  );
}
for (const requiredSymbol of [
  "derivePharmacyOperationsStateRefs",
  "derivePharmacyProviderHealthState",
  "derivePharmacyWatchWindowState",
  "derivePharmacyBlockingReasonCodes",
  "derivePharmacyRecoveryOwnerLabel",
]) {
  invariant(
    shellModelSource.includes(requiredSymbol),
    `Shell seed model is missing required derivation helper: ${requiredSymbol}`,
  );
}

const appSource = fs.readFileSync(
  path.join(ROOT, "apps/pharmacy-console/src/App.tsx"),
  "utf8",
);
invariant(
  appSource.includes("@vecells/design-system/pharmacy-workbench-surfaces.css"),
  "Pharmacy app must load the workbench surfaces stylesheet.",
);

const designSystemPackage = fs.readFileSync(
  path.join(ROOT, "packages/design-system/package.json"),
  "utf8",
);
invariant(
  designSystemPackage.includes("./pharmacy-workbench-surfaces.css"),
  "Design-system package must export the workbench surfaces stylesheet.",
);

const rootPackage = fs.readFileSync(path.join(ROOT, "package.json"), "utf8");
invariant(
  rootPackage.includes("validate:363-pharmacy-workbench-ui"),
  "Root package must define the 363 validator script.",
);

const matrixRows = fs
  .readFileSync(path.join(ROOT, "data/analysis/363_workbench_and_support_region_matrix.csv"), "utf8")
  .trim()
  .split("\n");
invariant(matrixRows.length >= 6, "Workbench/support-region matrix must include header plus seeded rows.");

const notes = JSON.parse(
  fs.readFileSync(
    path.join(ROOT, "data/analysis/363_visual_reference_notes.json"),
    "utf8",
  ),
) as { sources?: Array<{ label?: string; url?: string }> };
invariant(
  Array.isArray(notes.sources) && notes.sources.length >= 12,
  "Visual reference notes must record the official inspiration set.",
);

console.log(
  JSON.stringify(
    {
      taskId: "par_363",
      visualMode: contract.visualMode,
      componentCount: contract.components?.length ?? 0,
      promotedSupportRegionCount: contract.promotedSupportRegions?.length ?? 0,
      operationalStateCount: contract.operationalStates?.length ?? 0,
      sourceCount: notes.sources?.length ?? 0,
      matrixRows: matrixRows.length,
    },
    null,
    2,
  ),
);
