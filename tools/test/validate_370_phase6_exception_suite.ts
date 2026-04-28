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
  "docs/tests/370_phase6_bounce_back_urgent_return_and_exception_suite.md",
  "data/test/370_bounce_back_and_reopen_cases.csv",
  "data/test/370_urgent_return_and_direct_channel_cases.csv",
  "data/test/370_practice_visibility_and_exception_queue_cases.csv",
  "data/test/370_provider_health_and_outage_cases.csv",
  "data/test/370_suite_results.json",
  "data/test/370_defect_log_and_remediation.json",
  "data/analysis/370_external_reference_notes.md",
  "tools/test/validate_370_phase6_exception_suite.ts",
  "tests/integration/370_phase6_exception_suite.spec.ts",
  "tests/playwright/370_patient_review_and_return_states.spec.ts",
  "tests/playwright/370_staff_bounce_back_and_reopen.spec.ts",
  "tests/playwright/370_practice_visibility_and_exception_workbench.spec.ts",
] as const;

for (const relativePath of REQUIRED_FILES) {
  invariant(fs.existsSync(path.join(ROOT, relativePath)), `MISSING_REQUIRED_FILE:${relativePath}`);
}

function csvRows(relativePath: string): string[] {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8").trim().split("\n").slice(1);
}

const bounceRows = csvRows("data/test/370_bounce_back_and_reopen_cases.csv");
const urgentRows = csvRows("data/test/370_urgent_return_and_direct_channel_cases.csv");
const visibilityRows = csvRows("data/test/370_practice_visibility_and_exception_queue_cases.csv");
const providerRows = csvRows("data/test/370_provider_health_and_outage_cases.csv");

invariant(bounceRows.length >= 10, "Bounce-back matrix must include at least 10 rows.");
invariant(urgentRows.length >= 8, "Urgent-return matrix must include at least 8 rows.");
invariant(visibilityRows.length >= 16, "Practice visibility matrix must include at least 16 rows.");
invariant(providerRows.length >= 8, "Provider health matrix must include at least 8 rows.");

for (const requiredNeedle of [
  "routine_bounce_back_reopen",
  "urgent_bounce_back_reopen",
  "diff_first_evidence_anchors",
  "loop_prevention_repeat_bounce",
  "supervisor_escalation_loop_risk",
]) {
  invariant(
    bounceRows.some((row) => row.includes(requiredNeedle)),
    `Bounce-back matrix missing ${requiredNeedle}.`,
  );
}

for (const requiredNeedle of [
  "direct_channel_urgent_return_initiation",
  "monitored_email_safety_net_configured",
  "update_record_not_urgent_return_channel",
  "reachability_repair_direct_route_unavailable",
]) {
  invariant(
    urgentRows.some((row) => row.includes(requiredNeedle)),
    `Urgent-return matrix missing ${requiredNeedle}.`,
  );
}

for (const requiredNeedle of [
  "active_cases_queue",
  "waiting_for_choice_queue",
  "waiting_for_outcome_queue",
  "bounce_back_queue",
  "discovery_unavailable_exception",
  "zero_provider_exception",
  "dispatch_failed_exception",
  "ack_missing_exception",
  "outcome_unmatched_exception",
  "no_outcome_window_exception",
]) {
  invariant(
    visibilityRows.some((row) => row.includes(requiredNeedle)),
    `Practice visibility matrix missing ${requiredNeedle}.`,
  );
}

for (const requiredNeedle of [
  "provider_outage_detection",
  "provider_health_projection_update",
  "outage_impact_waiting_choice",
  "outage_impact_dispatch_pending",
  "provider_health_changed_since_seen",
]) {
  invariant(
    providerRows.some((row) => row.includes(requiredNeedle)),
    `Provider health matrix missing ${requiredNeedle}.`,
  );
}

const suiteResults = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data/test/370_suite_results.json"), "utf8"),
) as {
  taskId?: string;
  status?: string;
  releaseSignal?: string;
  commands?: Array<{ command?: string; status?: string }>;
  caseCounts?: Record<string, number>;
};
invariant(suiteResults.taskId === "seq_370", "Suite results must belong to seq_370.");
invariant(
  Array.isArray(suiteResults.commands) && suiteResults.commands.length === 5,
  "Suite results must list 5 proof commands.",
);
invariant(
  suiteResults.caseCounts?.practiceVisibilityAndExceptionQueue === 16,
  "Suite results practice visibility case count drifted.",
);

const defectLog = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data/test/370_defect_log_and_remediation.json"), "utf8"),
) as { taskId?: string; defects?: unknown[]; boundedExternalBoundaries?: unknown[] };
invariant(defectLog.taskId === "seq_370", "Defect log must belong to seq_370.");
invariant(Array.isArray(defectLog.defects), "Defect log must include a defects array.");
invariant(
  Array.isArray(defectLog.boundedExternalBoundaries) &&
    defectLog.boundedExternalBoundaries.length >= 2,
  "Defect log must record bounded external boundaries.",
);

const notes = fs.readFileSync(
  path.join(ROOT, "data/analysis/370_external_reference_notes.md"),
  "utf8",
);
for (const url of [
  "https://www.england.nhs.uk/wp-content/uploads/2023/11/PRN00936-i-Community-pharmacy-advanced-service-specification-NHS-pharmacy-first-service-November-2023.pdf",
  "https://digital.nhs.uk/services/gp-connect/gp-connect-in-your-organisation/gp-connect-update-record",
  "https://playwright.dev/docs/browser-contexts",
  "https://playwright.dev/docs/trace-viewer",
  "https://playwright.dev/docs/api/class-tracing",
] as const) {
  invariant(notes.includes(url), `External reference notes missing ${url}.`);
}

const urgentRecovery = resolvePharmacyBounceBackRecoveryPreview("PHC-2103");
invariant(urgentRecovery?.surfaceState === "urgent_return", "PHC-2103 urgent recovery drifted.");
invariant(
  urgentRecovery.urgentRouteBinding?.routeClass === "dedicated_professional_number",
  "PHC-2103 direct urgent route class drifted.",
);
invariant(
  urgentRecovery.truthBinding.reopenPriorityBand === 3,
  "PHC-2103 urgent reopen priority drifted.",
);

const routineRecovery = resolvePharmacyBounceBackRecoveryPreview("PHC-2204");
invariant(routineRecovery?.surfaceState === "routine_reopen", "PHC-2204 routine reopen drifted.");
invariant(
  routineRecovery.openOriginalRequestAction.availabilityState === "available",
  "PHC-2204 original request action drifted.",
);

const loopRecovery = resolvePharmacyBounceBackRecoveryPreview("PHC-2215");
invariant(
  loopRecovery?.surfaceState === "loop_risk_escalated",
  "PHC-2215 loop-risk recovery drifted.",
);
invariant(
  (loopRecovery.loopSupervisorBinding.loopRisk ?? 0) >= 0.8,
  "PHC-2215 loop-risk score drifted.",
);

const patientUrgent = resolvePharmacyPatientStatusPreview("PHC-2103");
invariant(
  patientUrgent?.statusProjection.currentMacroState === "urgent_action",
  "PHC-2103 patient urgent macro state drifted.",
);
invariant(
  patientUrgent.statusProjection.calmCopyAllowed === false,
  "PHC-2103 must not allow calm patient copy.",
);

const unmatchedOutcome = resolvePharmacyOutcomeAssurancePreview("PHC-2168");
invariant(
  unmatchedOutcome?.truthBinding.outcomeTruthState === "unmatched",
  "PHC-2168 unmatched outcome truth drifted.",
);
invariant(unmatchedOutcome.gateBinding.gateState === "open", "PHC-2168 gate state drifted.");

const outageSnapshot = resolvePharmacyShellSnapshot(
  createInitialPharmacyShellState("/workspace/pharmacy/PHC-2244"),
  1440,
);
const outageWorkbench = resolvePharmacyWorkbenchViewModels(outageSnapshot);
invariant(outageWorkbench.providerHealthState === "outage", "PHC-2244 provider outage drifted.");
invariant(/outage|block/i.test(outageWorkbench.handoffState), "PHC-2244 handoff block drifted.");

const packageJson = fs.readFileSync(path.join(ROOT, "package.json"), "utf8");
invariant(
  packageJson.includes("validate:370-phase6-exception-suite"),
  "Root package is missing validate:370-phase6-exception-suite.",
);

console.log(
  JSON.stringify(
    {
      taskId: "seq_370",
      status: suiteResults.status,
      releaseSignal: suiteResults.releaseSignal,
      matrices: {
        bounceRows: bounceRows.length,
        urgentRows: urgentRows.length,
        visibilityRows: visibilityRows.length,
        providerRows: providerRows.length,
      },
      commandCount: suiteResults.commands.length,
      defectCount: defectLog.defects.length,
    },
    null,
    2,
  ),
);
