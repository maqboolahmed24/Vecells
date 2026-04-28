import fs from "node:fs";
import path from "node:path";

import {
  createInitialPharmacyShellState,
  resolvePharmacyShellSnapshot,
} from "../../apps/pharmacy-console/src/pharmacy-shell-seed.model.ts";
import { resolvePharmacyWorkbenchViewModels } from "../../apps/pharmacy-console/src/pharmacy-workbench.model.ts";
import { resolvePharmacyBounceBackRecoveryPreview } from "../../packages/domains/pharmacy/src/phase6-pharmacy-bounce-back-preview.ts";
import { resolvePharmacyOutcomeAssurancePreview } from "../../packages/domains/pharmacy/src/phase6-pharmacy-outcome-assurance-preview.ts";
import { resolvePharmacyPatientStatusPreview } from "../../packages/domains/pharmacy/src/phase6-pharmacy-patient-status-preview.ts";

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const ROOT = "/Users/test/Code/V";

const REQUIRED_FILES = [
  "docs/tests/371_phase6_console_patient_status_and_responsive_accessibility_suite.md",
  "data/test/371_console_and_workbench_cases.csv",
  "data/test/371_patient_status_and_return_state_cases.csv",
  "data/test/371_responsive_fold_and_device_matrix.csv",
  "data/test/371_accessibility_and_reduced_motion_cases.csv",
  "data/test/371_visual_baseline_manifest.json",
  "data/test/371_suite_results.json",
  "data/test/371_defect_log_and_remediation.json",
  "data/analysis/371_external_reference_notes.md",
  "tools/test/validate_371_phase6_final_browser_suite.ts",
  "tests/playwright/371_console_responsive_and_same_shell.spec.ts",
  "tests/playwright/371_patient_status_and_return_states.spec.ts",
  "tests/playwright/371_accessibility_keyboard_and_aria.spec.ts",
  "tests/playwright/371_reflow_reduced_motion_and_visual.spec.ts",
] as const;

for (const relativePath of REQUIRED_FILES) {
  invariant(fs.existsSync(path.join(ROOT, relativePath)), `MISSING_REQUIRED_FILE:${relativePath}`);
}

function csvRows(relativePath: string): string[] {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8").trim().split("\n").slice(1);
}

const consoleRows = csvRows("data/test/371_console_and_workbench_cases.csv");
const patientRows = csvRows("data/test/371_patient_status_and_return_state_cases.csv");
const responsiveRows = csvRows("data/test/371_responsive_fold_and_device_matrix.csv");
const accessibilityRows = csvRows("data/test/371_accessibility_and_reduced_motion_cases.csv");

invariant(consoleRows.length >= 12, "Console/workbench matrix must include at least 12 rows.");
invariant(patientRows.length >= 12, "Patient status matrix must include at least 12 rows.");
invariant(responsiveRows.length >= 12, "Responsive/device matrix must include at least 12 rows.");
invariant(accessibilityRows.length >= 12, "Accessibility matrix must include at least 12 rows.");

for (const requiredNeedle of [
  "queue_to_workbench_continuity",
  "same_shell_inventory_compare_state",
  "handoff_stale_read_only",
  "assurance_unmatched_gate_open",
  "blocked_provider_outage",
  "reopen_loop_risk_recovery",
  "queue_peek_focus_return",
]) {
  invariant(
    consoleRows.some((row) => row.includes(requiredNeedle)),
    `Console/workbench matrix missing ${requiredNeedle}.`,
  );
}

for (const requiredNeedle of [
  "chosen_pharmacy_summary",
  "referral_confirmation",
  "dispatch_pending_next_steps",
  "outcome_completed_calm",
  "review_next_steps",
  "contact_route_repair",
  "urgent_action_alert",
  "patient_safe_worsening_symptoms",
  "no_appointment_truth",
]) {
  invariant(
    patientRows.some((row) => row.includes(requiredNeedle)),
    `Patient status matrix missing ${requiredNeedle}.`,
  );
}

for (const requiredNeedle of [
  "desktop_console_aside",
  "tablet_console_mission_stack",
  "phone_console_mission_stack",
  "console_400_percent_equivalent",
  "patient_400_percent_equivalent",
  "non_chromium_critical_smoke",
]) {
  invariant(
    responsiveRows.some((row) => row.includes(requiredNeedle)),
    `Responsive matrix missing ${requiredNeedle}.`,
  );
}

for (const requiredNeedle of [
  "landmark_structure",
  "status_messages",
  "keyboard_patient_chooser",
  "keyboard_staff_drawer",
  "focus_return_queue_peek",
  "aria_snapshots",
  "target_size_minimum",
  "reflow_320_css_px",
  "reduced_motion_equivalence",
  "visual_baseline_context",
]) {
  invariant(
    accessibilityRows.some((row) => row.includes(requiredNeedle)),
    `Accessibility matrix missing ${requiredNeedle}.`,
  );
}

const visualManifest = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data/test/371_visual_baseline_manifest.json"), "utf8"),
) as {
  taskId?: string;
  baselines?: Array<{ baselineId?: string; family?: string; file?: string; phiSafe?: boolean }>;
  crossBrowserSmoke?: Array<{ engine?: string }>;
};
invariant(visualManifest.taskId === "seq_371", "Visual manifest must belong to seq_371.");
invariant(
  Array.isArray(visualManifest.baselines) && visualManifest.baselines.length === 6,
  "Visual manifest must list 6 baselines.",
);
for (const family of [
  "calm_console",
  "stale_console",
  "blocked_console",
  "patient_pending",
  "patient_review",
  "bounce_back_return",
] as const) {
  const baseline = visualManifest.baselines.find((entry) => entry.family === family);
  invariant(baseline, `Visual manifest missing ${family}.`);
  invariant(baseline.phiSafe === true, `${family} baseline must be marked PHI-safe.`);
  invariant(/\.png$/.test(baseline.file ?? ""), `${family} baseline must reference a PNG file.`);
}
invariant(
  visualManifest.crossBrowserSmoke?.some((entry) => entry.engine === "chromium") &&
    visualManifest.crossBrowserSmoke?.some((entry) => entry.engine === "firefox"),
  "Visual manifest must record Chromium and Firefox smoke coverage.",
);

const suiteResults = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data/test/371_suite_results.json"), "utf8"),
) as {
  taskId?: string;
  status?: string;
  releaseSignal?: string;
  commands?: Array<{ command?: string; status?: string }>;
  caseCounts?: Record<string, number>;
};
invariant(suiteResults.taskId === "seq_371", "Suite results must belong to seq_371.");
invariant(suiteResults.status === "passed", "Suite results must record passed status.");
invariant(
  Array.isArray(suiteResults.commands) && suiteResults.commands.length === 5,
  "Suite results must list 5 proof commands.",
);
for (const command of suiteResults.commands) {
  invariant(command.status === "passed", `Proof command did not pass: ${command.command}`);
}
invariant(
  suiteResults.caseCounts?.visualBaselines === 6,
  "Suite results visual baseline count drifted.",
);
invariant(
  suiteResults.caseCounts?.crossBrowserEngines === 2,
  "Suite results cross-browser engine count drifted.",
);

const defectLog = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data/test/371_defect_log_and_remediation.json"), "utf8"),
) as { taskId?: string; defects?: unknown[]; boundedExternalBoundaries?: unknown[] };
invariant(defectLog.taskId === "seq_371", "Defect log must belong to seq_371.");
invariant(Array.isArray(defectLog.defects), "Defect log must include a defects array.");
invariant(
  Array.isArray(defectLog.boundedExternalBoundaries) &&
    defectLog.boundedExternalBoundaries.length >= 2,
  "Defect log must record bounded external boundaries.",
);

const notes = fs.readFileSync(
  path.join(ROOT, "data/analysis/371_external_reference_notes.md"),
  "utf8",
);
for (const url of [
  "https://playwright.dev/docs/accessibility-testing",
  "https://playwright.dev/docs/aria-snapshots",
  "https://playwright.dev/docs/test-snapshots",
  "https://playwright.dev/docs/emulation",
  "https://playwright.dev/docs/browser-contexts",
  "https://www.w3.org/WAI/WCAG22/Understanding/reflow.html",
  "https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html",
  "https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html",
  "https://service-manual.nhs.uk/accessibility/testing",
  "https://service-manual.nhs.uk/design-system/styles/focus-state",
  "https://service-manual.nhs.uk/design-system/components/warning-callout",
  "https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/",
  "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/",
] as const) {
  invariant(notes.includes(url), `External reference notes missing ${url}.`);
}

const pendingPatient = resolvePharmacyPatientStatusPreview("PHC-2057");
invariant(pendingPatient?.surfaceState === "dispatch_pending", "PHC-2057 pending status drifted.");
invariant(
  pendingPatient.referralReferenceSummary?.displayMode === "pending",
  "PHC-2057 reference mode drifted.",
);

const confirmedPatient = resolvePharmacyPatientStatusPreview("PHC-2184");
invariant(
  confirmedPatient?.surfaceState === "referral_confirmed",
  "PHC-2184 confirmation status drifted.",
);
invariant(!!confirmedPatient.confirmationPage, "PHC-2184 confirmation page drifted.");

const completedPatient = resolvePharmacyPatientStatusPreview("PHC-2196");
invariant(completedPatient?.surfaceState === "completed", "PHC-2196 completed status drifted.");
invariant(
  completedPatient.statusProjection.calmCopyAllowed === true,
  "PHC-2196 completed status must allow calm copy.",
);

const reviewPatient = resolvePharmacyPatientStatusPreview("PHC-2090");
invariant(reviewPatient?.surfaceState === "review_next_steps", "PHC-2090 review status drifted.");
invariant(
  reviewPatient.reviewNextStepPage?.announcementRole === "status",
  "PHC-2090 review announcement role drifted.",
);

const repairPatient = resolvePharmacyPatientStatusPreview("PHC-2188");
invariant(repairPatient?.surfaceState === "contact_repair", "PHC-2188 repair status drifted.");
invariant(
  repairPatient.repairProjection?.repairProjectionState === "awaiting_verification",
  "PHC-2188 repair projection drifted.",
);

const urgentPatient = resolvePharmacyPatientStatusPreview("PHC-2103");
invariant(urgentPatient?.surfaceState === "urgent_action", "PHC-2103 urgent status drifted.");
invariant(
  urgentPatient.reviewNextStepPage?.announcementRole === "alert",
  "PHC-2103 urgent announcement role drifted.",
);
invariant(
  urgentPatient.statusProjection.calmCopyAllowed === false,
  "PHC-2103 urgent status must block calm copy.",
);

const outageSnapshot = resolvePharmacyShellSnapshot(
  createInitialPharmacyShellState("/workspace/pharmacy/PHC-2244/handoff"),
  1440,
);
const outageWorkbench = resolvePharmacyWorkbenchViewModels(outageSnapshot);
invariant(outageWorkbench.providerHealthState === "outage", "PHC-2244 provider outage drifted.");
invariant(/outage|block/i.test(outageWorkbench.handoffState), "PHC-2244 handoff block drifted.");

const unmatchedOutcome = resolvePharmacyOutcomeAssurancePreview("PHC-2168");
invariant(
  unmatchedOutcome?.truthBinding.outcomeTruthState === "unmatched",
  "PHC-2168 unmatched outcome truth drifted.",
);
invariant(unmatchedOutcome.gateBinding.gateState === "open", "PHC-2168 assurance gate drifted.");

const loopRecovery = resolvePharmacyBounceBackRecoveryPreview("PHC-2215");
invariant(
  loopRecovery?.surfaceState === "loop_risk_escalated",
  "PHC-2215 loop-risk recovery drifted.",
);
invariant(
  (loopRecovery.loopSupervisorBinding.loopRisk ?? 0) >= 0.8,
  "PHC-2215 loop-risk score drifted.",
);

const packageJson = fs.readFileSync(path.join(ROOT, "package.json"), "utf8");
invariant(
  packageJson.includes("validate:371-phase6-final-browser-suite"),
  "Root package is missing validate:371-phase6-final-browser-suite.",
);

console.log(
  JSON.stringify(
    {
      taskId: "seq_371",
      status: suiteResults.status,
      releaseSignal: suiteResults.releaseSignal,
      matrices: {
        consoleRows: consoleRows.length,
        patientRows: patientRows.length,
        responsiveRows: responsiveRows.length,
        accessibilityRows: accessibilityRows.length,
        visualBaselines: visualManifest.baselines.length,
      },
      commandCount: suiteResults.commands.length,
      boundedExternalBoundaries: defectLog.boundedExternalBoundaries.length,
    },
    null,
    2,
  ),
);
