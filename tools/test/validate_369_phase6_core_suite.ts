import fs from "node:fs";
import path from "node:path";

import { resolvePharmacyChoicePreview } from "../../packages/domains/pharmacy/src/phase6-pharmacy-choice-preview.ts";
import { resolvePharmacyDispatchPreview } from "../../packages/domains/pharmacy/src/phase6-pharmacy-dispatch-preview.ts";
import { resolvePharmacyOutcomeAssurancePreview } from "../../packages/domains/pharmacy/src/phase6-pharmacy-outcome-assurance-preview.ts";
import { resolvePharmacyPatientStatusPreview } from "../../packages/domains/pharmacy/src/phase6-pharmacy-patient-status-preview.ts";

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const ROOT = "/Users/test/Code/V";

const REQUIRED_FILES = [
  "docs/tests/369_phase6_eligibility_directory_dispatch_and_reconciliation_suite.md",
  "docs/tests/369_phase6_browser_and_backend_matrix.md",
  "data/test/369_eligibility_and_provider_choice_cases.csv",
  "data/test/369_directory_drift_and_capability_cases.csv",
  "data/test/369_dispatch_idempotency_and_proof_cases.csv",
  "data/test/369_outcome_reconciliation_cases.csv",
  "data/test/369_suite_results.json",
  "data/test/369_defect_log_and_remediation.json",
  "data/analysis/369_external_reference_notes.md",
  "tools/test/validate_369_phase6_core_suite.ts",
  "tests/integration/369_phase6_core_suite.spec.ts",
  "tests/playwright/369_patient_provider_choice_and_dispatch.spec.ts",
  "tests/playwright/369_staff_dispatch_and_pending_proof.spec.ts",
  "tests/playwright/369_outcome_review_and_reconciliation.spec.ts",
] as const;

for (const relativePath of REQUIRED_FILES) {
  invariant(fs.existsSync(path.join(ROOT, relativePath)), `MISSING_REQUIRED_FILE:${relativePath}`);
}

function csvRows(relativePath: string): string[] {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8").trim().split("\n").slice(1);
}

const eligibilityRows = csvRows("data/test/369_eligibility_and_provider_choice_cases.csv");
const directoryRows = csvRows("data/test/369_directory_drift_and_capability_cases.csv");
const dispatchRows = csvRows("data/test/369_dispatch_idempotency_and_proof_cases.csv");
const outcomeRows = csvRows("data/test/369_outcome_reconciliation_cases.csv");

invariant(
  eligibilityRows.length >= 10,
  "Eligibility/provider-choice matrix must include at least 10 rows.",
);
invariant(directoryRows.length >= 8, "Directory/capability matrix must include at least 8 rows.");
invariant(dispatchRows.length >= 8, "Dispatch/proof matrix must include at least 8 rows.");
invariant(outcomeRows.length >= 7, "Outcome reconciliation matrix must include at least 7 rows.");

for (const requiredNeedle of [
  "pathway_pass",
  "pathway_fail",
  "unsuitable_return",
  "full_choice_law",
  "stale_choice",
  "mobile_desktop_parity",
]) {
  invariant(
    eligibilityRows.some((row) => row.includes(requiredNeedle)),
    `Eligibility/provider-choice matrix missing ${requiredNeedle}.`,
  );
}

for (const requiredNeedle of [
  "dohs_service_search",
  "eps_dos_legacy",
  "zero_provider_response",
  "direct_supported",
  "manual_supported",
  "unsupported",
]) {
  invariant(
    directoryRows.some((row) => row.includes(requiredNeedle)),
    `Directory/capability matrix missing ${requiredNeedle}.`,
  );
}

for (const requiredNeedle of [
  "duplicate_submit_reuses_attempt",
  "structured_ack_satisfies_gate",
  "expired_pending_attempt",
  "stale_consent_before_send",
  "contradictory_proof_visible",
]) {
  invariant(
    dispatchRows.some((row) => row.includes(requiredNeedle)),
    `Dispatch/proof matrix missing ${requiredNeedle}.`,
  );
}

for (const requiredNeedle of [
  "gp_workflow_observation_resolved",
  "same_message_exact_replay",
  "email_ingest_without_trusted_correlation",
  "urgent_gp_action_reopens_case",
  "no_update_record_or_email_not_completion",
]) {
  invariant(
    outcomeRows.some((row) => row.includes(requiredNeedle)),
    `Outcome matrix missing ${requiredNeedle}.`,
  );
}

const suiteResults = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data/test/369_suite_results.json"), "utf8"),
) as {
  taskId?: string;
  status?: string;
  releaseSignal?: string;
  commands?: Array<{ command?: string; status?: string }>;
  caseCounts?: Record<string, number>;
};
invariant(suiteResults.taskId === "seq_369", "Suite results must belong to seq_369.");
invariant(
  Array.isArray(suiteResults.commands) && suiteResults.commands.length === 5,
  "Suite results must list 5 proof commands.",
);
invariant(
  suiteResults.caseCounts?.eligibilityAndProviderChoice === 10,
  "Suite results case count drifted.",
);

const defectLog = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data/test/369_defect_log_and_remediation.json"), "utf8"),
) as { taskId?: string; defects?: unknown[]; boundedExternalBoundaries?: unknown[] };
invariant(defectLog.taskId === "seq_369", "Defect log must belong to seq_369.");
invariant(Array.isArray(defectLog.defects), "Defect log must include a defects array.");
invariant(
  Array.isArray(defectLog.boundedExternalBoundaries) &&
    defectLog.boundedExternalBoundaries.length >= 2,
  "Defect log must record bounded external boundaries.",
);

const notes = fs.readFileSync(
  path.join(ROOT, "data/analysis/369_external_reference_notes.md"),
  "utf8",
);
for (const url of [
  "https://playwright.dev/docs/test-assertions",
  "https://playwright.dev/docs/trace-viewer-intro",
  "https://playwright.dev/docs/next/accessibility-testing",
  "https://playwright.dev/docs/next/test-snapshots",
  "https://digital.nhs.uk/developer/api-catalogue/directory-of-healthcare-services/guide-to-search-identifiers-and-service-codes",
  "https://digital.nhs.uk/developer/api-catalogue/organisation-data-service-ord",
  "https://digital.nhs.uk/developer/api-catalogue/gp-connect-update-record",
  "https://digital.nhs.uk/services/gp-connect/gp-connect-in-your-organisation/transparency-notice/appendix-2",
  "https://digital.nhs.uk/developer/api-catalogue/message-exchange-for-social-care-and-health-api",
  "https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh",
  "https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh/workflow-groups-and-workflow-ids",
] as const) {
  invariant(notes.includes(url), `External reference notes missing ${url}.`);
}

const choice = resolvePharmacyChoicePreview("PHC-2148");
invariant(choice !== null, "PHC-2148 choice preview must exist.");
invariant(
  choice.choiceSession.selectedProviderRef?.refId === "provider_A10002",
  "PHC-2148 warned provider selection drifted.",
);
invariant(choice.warningAcknowledgement !== null, "PHC-2148 must require warning acknowledgement.");

const staleChoice = resolvePharmacyChoicePreview("PHC-2156");
invariant(
  staleChoice?.driftRecovery?.state === "visible_choice_set_changed",
  "PHC-2156 stale choice proof drifted.",
);

const pendingDispatch = resolvePharmacyDispatchPreview("PHC-2057");
invariant(
  pendingDispatch?.truthBinding.authoritativeProofState === "pending",
  "PHC-2057 pending dispatch proof drifted.",
);
invariant(
  pendingDispatch?.truthBinding.proofRiskState === "at_risk",
  "PHC-2057 proof risk drifted.",
);

const completedStatus = resolvePharmacyPatientStatusPreview("PHC-2196");
invariant(
  completedStatus?.outcomeTruth.outcomeTruthState === "settled_resolved",
  "PHC-2196 outcome status drifted.",
);

const weakOutcome = resolvePharmacyOutcomeAssurancePreview("PHC-2124");
invariant(
  weakOutcome?.truthBinding.outcomeTruthState === "review_required",
  "PHC-2124 weak-match truth drifted.",
);
invariant(weakOutcome?.gateBinding.gateState === "open", "PHC-2124 reconciliation gate drifted.");

const packageJson = fs.readFileSync(path.join(ROOT, "package.json"), "utf8");
invariant(
  packageJson.includes("validate:369-phase6-core-suite"),
  "Root package is missing validate:369-phase6-core-suite.",
);

console.log(
  JSON.stringify(
    {
      taskId: "seq_369",
      status: suiteResults.status,
      releaseSignal: suiteResults.releaseSignal,
      matrices: {
        eligibilityRows: eligibilityRows.length,
        directoryRows: directoryRows.length,
        dispatchRows: dispatchRows.length,
        outcomeRows: outcomeRows.length,
      },
      commandCount: suiteResults.commands.length,
      defectCount: defectLog.defects.length,
    },
    null,
    2,
  ),
);
