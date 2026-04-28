import fs from "node:fs";
import path from "node:path";

import { createScenarioDataset } from "../../apps/clinical-workspace/src/staff-entry-surfaces.tsx";
import {
  opsAnomalies,
  opsCohortImpactRows,
  opsServiceHealthRows,
} from "../../apps/ops-console/src/operations-shell-seed.model.ts";
import {
  resolvePatientHomeRequestsDetailEntry,
} from "../../apps/patient-web/src/patient-home-requests-detail-routes.model.ts";
import {
  resolveRecordsCommunicationsEntry,
} from "../../apps/patient-web/src/patient-records-communications.model.ts";
import {
  pharmacyProductMergePreviewCases,
  resolvePharmacyProductMergePreviewForRequest,
} from "../../packages/domains/pharmacy/src/phase6-pharmacy-product-merge-preview.ts";

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const ROOT = "/Users/test/Code/V";

const REQUIRED_FILES = [
  "packages/domains/pharmacy/src/phase6-pharmacy-product-merge-preview.ts",
  "packages/domains/pharmacy/src/index.ts",
  "apps/patient-web/src/patient-home-requests-detail-routes.model.ts",
  "apps/patient-web/src/patient-home-requests-detail-routes.tsx",
  "apps/patient-web/src/patient-home-requests-detail-routes.css",
  "apps/patient-web/src/patient-records-communications.model.ts",
  "apps/patient-web/src/patient-records-communications.tsx",
  "apps/ops-console/src/operations-shell-seed.model.ts",
  "apps/clinical-workspace/src/staff-entry-surfaces.tsx",
  "docs/architecture/368_pharmacy_loop_product_merge_spec.md",
  "docs/architecture/368_pharmacy_request_lineage_and_notifications_topology.mmd",
  "docs/frontend/368_pharmacy_request_child_and_ops_merge_atlas.html",
  "docs/communications/368_pharmacy_notification_and_status_rules.md",
  "data/contracts/368_pharmacy_loop_merge_contract.json",
  "data/analysis/368_algorithm_alignment_notes.md",
  "data/analysis/368_notification_trigger_matrix.csv",
  "data/analysis/368_request_child_visibility_matrix.csv",
  "data/analysis/368_external_reference_notes.md",
  "tools/analysis/validate_368_pharmacy_loop_merge.ts",
  "tests/integration/368_pharmacy_loop_merge_coherence.spec.ts",
  "packages/domains/pharmacy/tests/phase6-pharmacy-product-merge-preview.test.ts",
  "tests/playwright/368_pharmacy_loop_merge.helpers.ts",
  "tests/playwright/368_triage_to_pharmacy_to_request_detail.spec.ts",
  "tests/playwright/368_pharmacy_notifications_and_status_coherence.spec.ts",
  "tests/playwright/368_reopen_to_triage_and_operations_visibility.spec.ts"
] as const;

for (const relativePath of REQUIRED_FILES) {
  invariant(fs.existsSync(path.join(ROOT, relativePath)), `MISSING_REQUIRED_FILE:${relativePath}`);
}

const contract = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data/contracts/368_pharmacy_loop_merge_contract.json"), "utf8"),
) as {
  taskId?: string;
  visualMode?: string;
  cases?: Array<{
    requestRef: string;
    pharmacyCaseId: string;
    messageClusterRef: string;
    opsAnomalyId: string | null;
  }>;
  proofFiles?: string[];
  gapFileRequired?: boolean;
};

invariant(contract.taskId === "seq_368", "Contract taskId must be seq_368.");
invariant(contract.visualMode === "Pharmacy_Product_Merge", "Contract visualMode drifted.");
invariant(contract.gapFileRequired === false, "368 should not require a gap file.");
invariant(contract.cases?.length === 3, "Contract must freeze 3 merged pharmacy cases.");
invariant(contract.proofFiles?.length === 5, "Contract must list the 5 proof files.");

for (const preview of pharmacyProductMergePreviewCases) {
  const detail = resolvePatientHomeRequestsDetailEntry({
    pathname: `/requests/${preview.requestRef}`,
  }).requestDetail;
  invariant(detail, `Missing request detail for ${preview.requestRef}.`);
  invariant(
    detail.summary.linkedPharmacyCaseId === preview.pharmacyCaseId,
    `Request summary drift for ${preview.requestRef}.`,
  );
  invariant(
    detail.downstream.some(
      (child) =>
        child.pharmacyChild?.pharmacyCaseId === preview.pharmacyCaseId &&
        child.pharmacyChild.notificationStateLabel === preview.patientNotification.stateLabel,
    ),
    `Request downstream pharmacy child drift for ${preview.requestRef}.`,
  );

  const messages = resolveRecordsCommunicationsEntry(`/messages/${preview.messageClusterRef}`);
  invariant(
    messages.activeCluster.governingObjectRef === preview.requestRef,
    `Message cluster governing object drift for ${preview.messageClusterRef}.`,
  );
  invariant(
    messages.activeCluster.linkedPharmacyCaseId === preview.pharmacyCaseId,
    `Message cluster case drift for ${preview.messageClusterRef}.`,
  );
  invariant(
    messages.activeCluster.authoritativeStatusLabel === preview.patientNotification.stateLabel,
    `Message cluster status drift for ${preview.messageClusterRef}.`,
  );
}

const urgentReturn = resolvePharmacyProductMergePreviewForRequest("request_215_callback");
invariant(urgentReturn, "Urgent-return merge preview is missing.");
invariant(
  opsAnomalies.some(
    (anomaly) =>
      anomaly.anomalyId === "ops-route-pharmacy-2103" &&
      anomaly.summary === urgentReturn.ops.summary,
  ),
  "Ops anomaly for the urgent pharmacy return is missing or drifted.",
);
invariant(
  opsServiceHealthRows.some((row) => row.serviceRef === "svc_pharmacy_loop"),
  "Ops service health must include pharmacy loop continuity.",
);
invariant(
  opsCohortImpactRows.some((row) => row.cohortRef === "cohort_pharmacy_reentry"),
  "Ops cohort impact must include pharmacy re-entry.",
);

const blockingDataset = createScenarioDataset("blocking");
const pharmacyTask = blockingDataset.crossDomainTasks.find((task) => task.domain === "pharmacy");
invariant(pharmacyTask, "Blocking dataset must include a pharmacy cross-domain task.");
invariant(
  pharmacyTask.requestRef === urgentReturn.requestRef &&
    pharmacyTask.pharmacyCaseId === urgentReturn.pharmacyCaseId,
  "Blocking staff-entry dataset drifted off the urgent-return merge.",
);
invariant(
  blockingDataset.changedSinceSeen.changedLabels.includes(urgentReturn.changedSinceSeenLabel),
  "Changed-since-seen must include the urgent-return pharmacy label.",
);

const notificationRows = fs
  .readFileSync(path.join(ROOT, "data/analysis/368_notification_trigger_matrix.csv"), "utf8")
  .trim()
  .split("\n");
invariant(notificationRows.length === 4, "Notification matrix must include header plus 3 rows.");

const visibilityRows = fs
  .readFileSync(path.join(ROOT, "data/analysis/368_request_child_visibility_matrix.csv"), "utf8")
  .trim()
  .split("\n");
invariant(visibilityRows.length === 4, "Visibility matrix must include header plus 3 rows.");

const externalNotes = fs.readFileSync(
  path.join(ROOT, "data/analysis/368_external_reference_notes.md"),
  "utf8",
);
for (const url of [
  "https://service-manual.nhs.uk/content/writing-nhs-messages",
  "https://playwright.dev/docs/best-practices",
  "https://playwright.dev/docs/browser-contexts",
  "https://playwright.dev/docs/trace-viewer-intro",
  "https://playwright.dev/docs/locators",
  "https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html",
  "https://www.w3.org/WAI/ARIA/apg/patterns/alert/",
] as const) {
  invariant(externalNotes.includes(url), `External reference notes missing ${url}.`);
}

const packageJson = fs.readFileSync(path.join(ROOT, "package.json"), "utf8");
invariant(
  packageJson.includes("validate:368-pharmacy-loop-merge"),
  "Root package is missing validate:368-pharmacy-loop-merge.",
);

console.log(
  JSON.stringify(
    {
      taskId: contract.taskId,
      visualMode: contract.visualMode,
      caseCount: contract.cases?.length ?? 0,
      proofFileCount: contract.proofFiles?.length ?? 0,
      opsAnomaly: urgentReturn.ops.anomalyId,
      notificationRows: notificationRows.length - 1,
      visibilityRows: visibilityRows.length - 1,
    },
    null,
    2,
  ),
);
