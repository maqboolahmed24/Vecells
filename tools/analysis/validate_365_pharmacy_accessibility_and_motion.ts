import fs from "node:fs";
import path from "node:path";

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const ROOT = "/Users/test/Code/V";

const requiredFiles = [
  "packages/design-system/src/pharmacy-accessibility-micro-interactions.tsx",
  "packages/design-system/src/pharmacy-accessibility-micro-interactions.css",
  "packages/design-system/src/pharmacy-dispatch-surfaces.tsx",
  "packages/design-system/src/pharmacy-mission-stack-recovery-surfaces.tsx",
  "packages/design-system/src/pharmacy-patient-status-surfaces.tsx",
  "apps/pharmacy-console/src/pharmacy-shell-seed.tsx",
  "apps/pharmacy-console/src/pharmacy-shell-seed.css",
  "apps/patient-web/src/patient-pharmacy-shell.tsx",
  "apps/patient-web/src/patient-pharmacy-shell.css",
  "apps/patient-web/src/patient-pharmacy-chooser.tsx",
  "apps/patient-web/src/patient-pharmacy-chooser.css",
  "docs/frontend/365_pharmacy_accessibility_and_micro_interaction_spec.md",
  "docs/frontend/365_pharmacy_accessibility_and_micro_interaction_atlas.html",
  "docs/accessibility/365_pharmacy_semantic_coverage_matrix.md",
  "docs/accessibility/365_pharmacy_keyboard_focus_map.md",
  "docs/accessibility/365_pharmacy_target_size_and_reflow_audit.md",
  "data/contracts/365_pharmacy_a11y_and_micro_interaction_contract.json",
  "data/analysis/365_algorithm_alignment_notes.md",
  "data/analysis/365_visual_reference_notes.json",
  "data/analysis/365_focus_order_matrix.csv",
  "data/analysis/365_announcements_and_status_message_matrix.csv",
  "tests/playwright/365_pharmacy_accessibility.helpers.ts",
  "tests/playwright/365_pharmacy_semantics_and_keyboard.spec.ts",
  "tests/playwright/365_pharmacy_reflow_and_reduced_motion.spec.ts",
  "tests/playwright/365_pharmacy_dialogs_drawers_and_focus_return.spec.ts",
  "tests/playwright/365_pharmacy_aria_snapshots.spec.ts",
  "tests/playwright/365_pharmacy_visual_accessibility.spec.ts",
] as const;

for (const relativePath of requiredFiles) {
  invariant(fs.existsSync(path.join(ROOT, relativePath)), `Missing required file: ${relativePath}`);
}

const contract = JSON.parse(
  fs.readFileSync(
    path.join(ROOT, "data/contracts/365_pharmacy_a11y_and_micro_interaction_contract.json"),
    "utf8",
  ),
) as {
  taskId?: string;
  visualMode?: string;
  components?: string[];
  routeFamilies?: string[];
  dialogsAndDrawers?: string[];
  focusContracts?: string[];
  announcementChannels?: string[];
  targetSizeMinimumPx?: number;
  reducedMotionBehaviors?: string[];
  proofFiles?: string[];
};

invariant(contract.taskId === "par_365", "Contract taskId must be par_365.");
invariant(
  contract.visualMode === "Pharmacy_Accessible_Quiet_Polish",
  "Contract visualMode must be Pharmacy_Accessible_Quiet_Polish.",
);
for (const componentName of [
  "PharmacyA11yAnnouncementHub",
  "PharmacyFocusRouteMap",
  "PharmacyAccessibleStatusBadge",
  "PharmacyInlineAck",
  "PharmacyTargetSizeGuard",
  "PharmacyReducedMotionBridge",
  "PharmacyDialogAndDrawerSemantics",
] as const) {
  invariant(contract.components?.includes(componentName), `Missing contract component: ${componentName}`);
}
for (const routeFamily of ["rf_patient_pharmacy", "rf_pharmacy_console"] as const) {
  invariant(contract.routeFamilies?.includes(routeFamily), `Missing route family: ${routeFamily}`);
}
for (const dialogSurface of [
  "PharmacyQueuePeekDrawer",
  "PharmacyReferralConfirmationDrawer",
] as const) {
  invariant(
    contract.dialogsAndDrawers?.includes(dialogSurface),
    `Missing dialog/drawer contract entry: ${dialogSurface}`,
  );
}
invariant(
  contract.targetSizeMinimumPx === 44,
  "Contract must freeze a 44px minimum target size.",
);
invariant(
  Array.isArray(contract.reducedMotionBehaviors) && contract.reducedMotionBehaviors.length >= 3,
  "Contract must declare reduced-motion behaviors.",
);
invariant(
  Array.isArray(contract.proofFiles) && contract.proofFiles.length === 5,
  "Contract must list the 5 required Playwright proof files.",
);

const designSystemSource = fs.readFileSync(
  path.join(ROOT, "packages/design-system/src/pharmacy-accessibility-micro-interactions.tsx"),
  "utf8",
);
for (const symbol of [
  "export const PHARMACY_ACCESSIBLE_QUIET_POLISH_VISUAL_MODE",
  "export function PharmacyA11yAnnouncementHub",
  "export function PharmacyFocusRouteMap",
  "export function PharmacyAccessibleStatusBadge",
  "export function PharmacyInlineAck",
  "export function PharmacyTargetSizeGuard",
  "export function PharmacyReducedMotionBridge",
  "export function PharmacyDialogAndDrawerSemantics",
] as const) {
  invariant(
    designSystemSource.includes(symbol),
    `Shared accessibility source is missing ${symbol}.`,
  );
}

const patientShellSource = fs.readFileSync(
  path.join(ROOT, "apps/patient-web/src/patient-pharmacy-shell.tsx"),
  "utf8",
);
for (const fragment of [
  "<PharmacyReducedMotionBridge",
  "<PharmacyA11yAnnouncementHub",
  "<PharmacyFocusRouteMap",
  "<PharmacyAccessibleStatusBadge",
  "data-pharmacy-a11y-visual-mode",
] as const) {
  invariant(patientShellSource.includes(fragment), `Patient shell missing ${fragment}.`);
}

const pharmacyShellSource = fs.readFileSync(
  path.join(ROOT, "apps/pharmacy-console/src/pharmacy-shell-seed.tsx"),
  "utf8",
);
for (const fragment of [
  "<PharmacyReducedMotionBridge",
  "<PharmacyA11yAnnouncementHub",
  "<PharmacyFocusRouteMap",
  "<PharmacyAccessibleStatusBadge",
  "data-pharmacy-a11y-visual-mode",
] as const) {
  invariant(pharmacyShellSource.includes(fragment), `Pharmacy shell missing ${fragment}.`);
}

const notes = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data/analysis/365_visual_reference_notes.json"), "utf8"),
) as {
  sources?: Array<{ url?: string; borrowed?: string[]; rejected?: string[] }>;
};
invariant(
  Array.isArray(notes.sources) && notes.sources.length >= 10,
  "Visual reference notes must include at least 10 official/current sources.",
);
for (const source of notes.sources ?? []) {
  invariant(Boolean(source.url), "Every reference note source must include a url.");
  invariant(
    Array.isArray(source.borrowed) && source.borrowed.length >= 1,
    "Every source must record borrowed guidance.",
  );
  invariant(
    Array.isArray(source.rejected) && source.rejected.length >= 1,
    "Every source must record rejected guidance.",
  );
}

const rootPackage = fs.readFileSync(path.join(ROOT, "package.json"), "utf8");
invariant(
  rootPackage.includes("validate:365-pharmacy-accessibility-and-motion"),
  "Root package must define the 365 validator script.",
);

const focusRows = fs
  .readFileSync(path.join(ROOT, "data/analysis/365_focus_order_matrix.csv"), "utf8")
  .trim()
  .split("\n");
invariant(focusRows.length >= 7, "Focus-order matrix must include header plus seeded rows.");

const announcementRows = fs
  .readFileSync(
    path.join(ROOT, "data/analysis/365_announcements_and_status_message_matrix.csv"),
    "utf8",
  )
  .trim()
  .split("\n");
invariant(
  announcementRows.length >= 7,
  "Announcement matrix must include header plus seeded rows.",
);

console.log(
  JSON.stringify(
    {
      taskId: contract.taskId,
      visualMode: contract.visualMode,
      componentCount: contract.components?.length ?? 0,
      routeFamilyCount: contract.routeFamilies?.length ?? 0,
      sources: notes.sources?.length ?? 0,
      focusRows: focusRows.length - 1,
      announcementRows: announcementRows.length - 1,
    },
    null,
    2,
  ),
);
