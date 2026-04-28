import fs from "node:fs";
import path from "node:path";

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const ROOT = "/Users/test/Code/V";

const requiredFiles = [
  "packages/design-system/src/pharmacy-mission-stack-recovery-surfaces.tsx",
  "packages/design-system/src/pharmacy-mission-stack-recovery-surfaces.css",
  "apps/pharmacy-console/src/pharmacy-shell-seed.tsx",
  "apps/pharmacy-console/src/pharmacy-shell-seed.css",
  "docs/frontend/364_pharmacy_console_mission_stack_and_recovery_spec.md",
  "docs/frontend/364_pharmacy_console_mission_stack_atlas.html",
  "docs/frontend/364_pharmacy_console_fold_and_recovery_topology.mmd",
  "docs/frontend/364_pharmacy_console_responsive_tokens.json",
  "docs/accessibility/364_pharmacy_console_responsive_a11y_notes.md",
  "data/contracts/364_pharmacy_console_mission_stack_contract.json",
  "data/contracts/PHASE6_BATCH_364_371_INTERFACE_GAP_MISSION_STACK.json",
  "data/analysis/364_algorithm_alignment_notes.md",
  "data/analysis/364_fold_state_matrix.csv",
  "data/analysis/364_recovery_posture_matrix.csv",
  "data/analysis/364_visual_reference_notes.json",
  "tests/playwright/364_pharmacy_console_mission_stack.spec.ts",
  "tests/playwright/364_pharmacy_console_recovery_posture.spec.ts",
  "tests/playwright/364_pharmacy_console_mobile_and_tablet.spec.ts",
  "tests/playwright/364_pharmacy_console_visual.spec.ts"
] as const;

for (const relativePath of requiredFiles) {
  invariant(fs.existsSync(path.join(ROOT, relativePath)), `Missing required file: ${relativePath}`);
}

const contract = JSON.parse(
  fs.readFileSync(
    path.join(ROOT, "data/contracts/364_pharmacy_console_mission_stack_contract.json"),
    "utf8",
  ),
) as {
  visualMode?: string;
  foldStates?: string[];
  recoveryPostures?: string[];
  components?: string[];
  shellRegions?: string[];
  rootDataAttributes?: string[];
  interfaceGapRefs?: string[];
  scenarios?: string[];
};

invariant(
  contract.visualMode === "Pharmacy_Mission_Stack_Recovery",
  "Contract visualMode must be Pharmacy_Mission_Stack_Recovery.",
);
invariant(
  Array.isArray(contract.foldStates) && contract.foldStates.length === 3,
  "Contract must declare the 3 authoritative fold states.",
);
for (const foldState of ["desktop_expanded", "mission_stack_narrow", "mission_stack_compact"]) {
  invariant(contract.foldStates?.includes(foldState), `Missing fold state: ${foldState}`);
}
invariant(
  Array.isArray(contract.recoveryPostures) && contract.recoveryPostures.length === 3,
  "Contract must declare the 3 authoritative recovery postures.",
);
for (const posture of ["live", "read_only", "recovery_only"]) {
  invariant(
    contract.recoveryPostures?.includes(posture),
    `Missing recovery posture: ${posture}`,
  );
}
invariant(
  Array.isArray(contract.components) && contract.components.length === 8,
  "Contract must declare the 8 required mission-stack components.",
);
invariant(
  Array.isArray(contract.shellRegions) && contract.shellRegions.length === 7,
  "Contract must declare the 7 mission-stack shell regions.",
);
for (const attribute of [
  "data-mission-stack-visual-mode",
  "data-fold-state",
  "data-queue-peek-state",
  "data-support-region-resume-state",
  "data-continuity-overlay-state",
  "data-watch-window-reentry-state",
  "data-sticky-dock-mode",
  "data-selected-case-anchor",
  "data-selected-checkpoint-id",
  "data-selected-line-item-id",
  "data-promoted-support-region",
  "data-recovery-posture",
] as const) {
  invariant(
    contract.rootDataAttributes?.includes(attribute),
    `Contract rootDataAttributes must include ${attribute}.`,
  );
}
invariant(
  contract.interfaceGapRefs?.includes("PHASE6_BATCH_364_371_INTERFACE_GAP_MISSION_STACK.json"),
  "Contract must reference the mission-stack interface-gap note.",
);
for (const scenarioId of ["PHC-2048", "PHC-2103", "PHC-2124", "PHC-2244"]) {
  invariant(contract.scenarios?.includes(scenarioId), `Missing scenario: ${scenarioId}`);
}

const missionStackSource = fs.readFileSync(
  path.join(ROOT, "packages/design-system/src/pharmacy-mission-stack-recovery-surfaces.tsx"),
  "utf8",
);
for (const requiredSymbol of [
  "export const PHARMACY_MISSION_STACK_RECOVERY_VISUAL_MODE",
  "export function PharmacyMissionStackController",
  "export function PharmacyQueuePeekDrawer",
  "export function PharmacyCaseResumeStub",
  "export function PharmacyRecoveryStrip",
  "export function PharmacyContinuityFrozenOverlay",
  "export function PharmacySupportRegionResumeCard",
  "export function PharmacyWatchWindowReentryBanner",
]) {
  invariant(
    missionStackSource.includes(requiredSymbol),
    `Mission-stack surfaces source is missing required symbol: ${requiredSymbol}`,
  );
}

const missionStackCss = fs.readFileSync(
  path.join(ROOT, "packages/design-system/src/pharmacy-mission-stack-recovery-surfaces.css"),
  "utf8",
);
for (const cssFragment of [
  ".pharmacy-case-resume-stub",
  "pointer-events: none;",
  ".pharmacy-queue-peek__panel",
  ".pharmacy-continuity-overlay",
]) {
  invariant(
    missionStackCss.includes(cssFragment),
    `Mission-stack stylesheet is missing required fragment: ${cssFragment}`,
  );
}

const shellSource = fs.readFileSync(
  path.join(ROOT, "apps/pharmacy-console/src/pharmacy-shell-seed.tsx"),
  "utf8",
);
for (const requiredFragment of [
  "<PharmacyMissionStackController",
  "<PharmacyQueuePeekDrawer",
  "<PharmacyCaseResumeStub",
  "<PharmacyRecoveryStrip",
  "<PharmacyContinuityFrozenOverlay",
  "<PharmacySupportRegionResumeCard",
  "<PharmacyWatchWindowReentryBanner",
  "data-mission-stack-visual-mode",
  "data-fold-state",
  "data-queue-peek-state",
  "data-support-region-resume-state",
  "data-continuity-overlay-state",
  "data-watch-window-reentry-state",
  "data-sticky-dock-mode",
]) {
  invariant(
    shellSource.includes(requiredFragment),
    `Pharmacy shell is missing required 364 fragment: ${requiredFragment}`,
  );
}

const shellCss = fs.readFileSync(
  path.join(ROOT, "apps/pharmacy-console/src/pharmacy-shell-seed.css"),
  "utf8",
);
for (const requiredFragment of [
  ".pharmacy-shell__mission-dock",
  "pointer-events: none;",
  ".pharmacy-shell__mission-dock button",
  ".pharmacy-shell--mission_stack .pharmacy-shell__mission-stage",
]) {
  invariant(
    shellCss.includes(requiredFragment),
    `Pharmacy shell stylesheet is missing required 364 fragment: ${requiredFragment}`,
  );
}

const appSource = fs.readFileSync(
  path.join(ROOT, "apps/pharmacy-console/src/App.tsx"),
  "utf8",
);
invariant(
  appSource.includes("@vecells/design-system/pharmacy-mission-stack-recovery-surfaces.css"),
  "Pharmacy app must load the mission-stack recovery stylesheet.",
);

const designSystemPackage = fs.readFileSync(
  path.join(ROOT, "packages/design-system/package.json"),
  "utf8",
);
invariant(
  designSystemPackage.includes("./pharmacy-mission-stack-recovery-surfaces.css"),
  "Design-system package must export the mission-stack recovery stylesheet.",
);

const rootPackage = fs.readFileSync(path.join(ROOT, "package.json"), "utf8");
invariant(
  rootPackage.includes("validate:364-pharmacy-console-mission-stack"),
  "Root package must define the 364 validator script.",
);

const foldRows = fs
  .readFileSync(path.join(ROOT, "data/analysis/364_fold_state_matrix.csv"), "utf8")
  .trim()
  .split("\n");
invariant(foldRows.length >= 5, "Fold-state matrix must include header plus seeded rows.");

const recoveryRows = fs
  .readFileSync(path.join(ROOT, "data/analysis/364_recovery_posture_matrix.csv"), "utf8")
  .trim()
  .split("\n");
invariant(
  recoveryRows.length >= 5,
  "Recovery-posture matrix must include header plus seeded rows.",
);

const notes = JSON.parse(
  fs.readFileSync(
    path.join(ROOT, "data/analysis/364_visual_reference_notes.json"),
    "utf8",
  ),
) as { sources?: Array<{ url?: string; borrowed?: string[]; rejected?: string[] }> };
invariant(
  Array.isArray(notes.sources) && notes.sources.length >= 12,
  "Visual reference notes must record the official inspiration set.",
);
for (const source of notes.sources ?? []) {
  invariant(Boolean(source.url), "Every reference note source must include a url.");
  invariant(
    Array.isArray(source.borrowed) && source.borrowed.length >= 1,
    "Every reference note source must record borrowed guidance.",
  );
  invariant(
    Array.isArray(source.rejected) && source.rejected.length >= 1,
    "Every reference note source must record rejected guidance.",
  );
}

console.log(
  JSON.stringify(
    {
      taskId: "par_364",
      visualMode: contract.visualMode,
      foldStates: contract.foldStates?.length ?? 0,
      recoveryPostures: contract.recoveryPostures?.length ?? 0,
      components: contract.components?.length ?? 0,
      sources: notes.sources?.length ?? 0,
    },
    null,
    2,
  ),
);
