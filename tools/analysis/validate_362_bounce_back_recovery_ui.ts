import fs from "node:fs";
import path from "node:path";

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const ROOT = "/Users/test/Code/V";

const requiredFiles = [
  "packages/domains/pharmacy/src/phase6-pharmacy-bounce-back-preview.ts",
  "packages/design-system/src/pharmacy-bounce-back-recovery-surfaces.tsx",
  "packages/design-system/src/pharmacy-bounce-back-recovery-surfaces.css",
  "apps/pharmacy-console/src/pharmacy-shell-seed.tsx",
  "docs/frontend/362_bounce_back_and_reopen_recovery_spec.md",
  "docs/frontend/362_bounce_back_atlas.html",
  "docs/frontend/362_reopen_recovery_topology.mmd",
  "docs/frontend/362_bounce_back_tokens.json",
  "docs/accessibility/362_bounce_back_a11y_notes.md",
  "data/contracts/362_bounce_back_recovery_contract.json",
  "data/contracts/PHASE6_BATCH_356_363_INTERFACE_GAP_BOUNCE_BACK_AND_REOPEN.json",
  "data/analysis/362_algorithm_alignment_notes.md",
  "data/analysis/362_reopen_and_loop_risk_matrix.csv",
  "data/analysis/362_visual_reference_notes.json",
  "tests/playwright/362_bounce_back_recovery.spec.ts",
  "tests/playwright/362_urgent_return_mode.spec.ts",
  "tests/playwright/362_bounce_back_accessibility.spec.ts",
  "tests/playwright/362_bounce_back_visual.spec.ts",
] as const;

for (const relativePath of requiredFiles) {
  invariant(fs.existsSync(path.join(ROOT, relativePath)), `Missing required file: ${relativePath}`);
}

const contract = JSON.parse(
  fs.readFileSync(
    path.join(ROOT, "data/contracts/362_bounce_back_recovery_contract.json"),
    "utf8",
  ),
) as {
  visualMode?: string;
  components?: string[];
  scenarios?: string[];
  rootDataAttributes?: string[];
  interfaceGapRefs?: string[];
  promotedSupportRegion?: string;
};

invariant(
  contract.visualMode === "Pharmacy_Recovery_Control",
  "Contract visualMode must be Pharmacy_Recovery_Control.",
);
invariant(
  contract.promotedSupportRegion === "bounce_back_recovery",
  "Contract promotedSupportRegion must be bounce_back_recovery.",
);
invariant(
  Array.isArray(contract.components) && contract.components.length === 7,
  "Contract must declare the 7 authoritative recovery components.",
);
for (const scenarioId of ["PHC-2103", "PHC-2204", "PHC-2215"]) {
  invariant(
    contract.scenarios?.includes(scenarioId),
    `Contract scenarios must include ${scenarioId}.`,
  );
}
for (const attribute of [
  "data-recovery-visual-mode",
  "data-recovery-surface-state",
  "data-recovery-bounce-back-type",
  "data-recovery-reopened-case-status",
  "data-recovery-loop-risk-band",
  "data-recovery-priority-band",
  "data-recovery-notification-state",
  "data-recovery-urgent-mode",
  "data-promoted-support-region",
] as const) {
  invariant(
    contract.rootDataAttributes?.includes(attribute),
    `Contract rootDataAttributes must include ${attribute}.`,
  );
}
invariant(
  contract.interfaceGapRefs?.includes(
    "PHASE6_BATCH_356_363_INTERFACE_GAP_BOUNCE_BACK_AND_REOPEN.json",
  ),
  "Contract must reference the recovery interface-gap note.",
);

const previewSource = fs.readFileSync(
  path.join(ROOT, "packages/domains/pharmacy/src/phase6-pharmacy-bounce-back-preview.ts"),
  "utf8",
);
for (const requiredSymbol of [
  "export const PHARMACY_RECOVERY_CONTROL_VISUAL_MODE",
  "export interface PharmacyBounceBackRecoveryPreviewSnapshot",
  "export const pharmacyBounceBackRecoveryPreviewCases",
  "export function resolvePharmacyBounceBackRecoveryPreview",
]) {
  invariant(
    previewSource.includes(requiredSymbol),
    `Recovery preview source is missing required symbol: ${requiredSymbol}`,
  );
}
for (const scenarioId of ["PHC-2103", "PHC-2204", "PHC-2215"]) {
  invariant(
    previewSource.includes(`pharmacyCaseId: "${scenarioId}"`),
    `Recovery preview source must include seeded scenario ${scenarioId}.`,
  );
}

const surfacesSource = fs.readFileSync(
  path.join(ROOT, "packages/design-system/src/pharmacy-bounce-back-recovery-surfaces.tsx"),
  "utf8",
);
for (const requiredSymbol of [
  "export function PharmacyBounceBackQueue",
  "export function PharmacyReopenedCaseBanner",
  "export function PharmacyUrgentReturnMode",
  "export function OpenOriginalRequestAction",
  "export function PharmacyReturnMessagePreview",
  "export function PharmacyReopenDiffStrip",
  "export function PharmacyLoopRiskEscalationCard",
  "export function PharmacyRecoveryControlPanel",
  "export function PharmacyRecoveryDecisionDock",
]) {
  invariant(
    surfacesSource.includes(requiredSymbol),
    `Recovery surfaces source is missing required symbol: ${requiredSymbol}`,
  );
}

const shellSource = fs.readFileSync(
  path.join(ROOT, "apps/pharmacy-console/src/pharmacy-shell-seed.tsx"),
  "utf8",
);
for (const requiredFragment of [
  "resolvePharmacyBounceBackRecoveryPreview",
  "data-recovery-visual-mode",
  "data-recovery-surface-state",
  "\"bounce_back_recovery\"",
  "<PharmacyRecoveryControlPanel",
  "<PharmacyRecoveryDecisionDock",
  "data-testid=\"pharmacy-assurance-route\"",
]) {
  invariant(
    shellSource.includes(requiredFragment),
    `Pharmacy shell is missing required 362 fragment: ${requiredFragment}`,
  );
}

const appSource = fs.readFileSync(
  path.join(ROOT, "apps/pharmacy-console/src/App.tsx"),
  "utf8",
);
invariant(
  appSource.includes("@vecells/design-system/pharmacy-bounce-back-recovery-surfaces.css"),
  "Pharmacy app must load the recovery surfaces stylesheet.",
);

const designSystemPackage = fs.readFileSync(
  path.join(ROOT, "packages/design-system/package.json"),
  "utf8",
);
invariant(
  designSystemPackage.includes("./pharmacy-bounce-back-recovery-surfaces.css"),
  "Design-system package must export the recovery surfaces stylesheet.",
);

const matrixRows = fs
  .readFileSync(path.join(ROOT, "data/analysis/362_reopen_and_loop_risk_matrix.csv"), "utf8")
  .trim()
  .split("\n");
invariant(matrixRows.length >= 4, "Recovery matrix must include header plus seeded rows.");

const notes = JSON.parse(
  fs.readFileSync(
    path.join(ROOT, "data/analysis/362_visual_reference_notes.json"),
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
      taskId: "par_362",
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
