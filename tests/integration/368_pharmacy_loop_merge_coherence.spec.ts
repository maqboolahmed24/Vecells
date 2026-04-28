import { describe, expect, it } from "vitest";

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
  resolvePharmacyPatientStatusPreview,
} from "../../packages/domains/pharmacy/src/phase6-pharmacy-patient-status-preview.ts";
import {
  resolvePharmacyProductMergePreviewForOpsAnomaly,
  resolvePharmacyProductMergePreviewForRequest,
} from "../../packages/domains/pharmacy/src/phase6-pharmacy-product-merge-preview.ts";

describe("368 pharmacy loop merge coherence", () => {
  it("keeps request detail and message clusters on the same pending pharmacy child truth", () => {
    const merge = resolvePharmacyProductMergePreviewForRequest("request_211_b");
    const requestEntry = resolvePatientHomeRequestsDetailEntry({
      pathname: "/requests/request_211_b",
    });
    const messageEntry = resolveRecordsCommunicationsEntry(
      "/messages/cluster_368_pharmacy_pending",
    );

    expect(merge).not.toBeNull();
    expect(requestEntry.requestDetail?.downstream[0]?.pharmacyChild?.pharmacyCaseId).toBe(
      merge?.pharmacyCaseId,
    );
    expect(requestEntry.requestDetail?.summary.linkedPharmacyCaseId).toBe(merge?.pharmacyCaseId);
    expect(messageEntry.activeCluster.linkedPharmacyCaseId).toBe(merge?.pharmacyCaseId);
    expect(messageEntry.activeCluster.governingObjectRef).toBe(merge?.requestRef);
    expect(messageEntry.activeCluster.authoritativeStatusLabel).toBe(
      merge?.patientNotification.stateLabel,
    );
    expect(messageEntry.commandSettlement.authoritativeOutcomeState).toBe("awaiting_review");
    expect(messageEntry.sourceProjectionRefs).toEqual(
      expect.arrayContaining(merge?.sourceProjectionRefs ?? []),
    );
  });

  it("keeps urgent-return continuity aligned across ops, changed-since-seen, and staff cross-domain cards", () => {
    const merge = resolvePharmacyProductMergePreviewForOpsAnomaly("ops-route-pharmacy-2103");
    const requestEntry = resolvePatientHomeRequestsDetailEntry({
      pathname: "/requests/request_215_callback",
    });
    const messageEntry = resolveRecordsCommunicationsEntry(
      "/messages/cluster_368_pharmacy_urgent_return",
    );
    const staffDataset = createScenarioDataset("blocking");
    const pharmacyTask = staffDataset.crossDomainTasks.find((task) => task.domain === "pharmacy");
    const opsAnomaly = opsAnomalies.find((anomaly) => anomaly.anomalyId === "ops-route-pharmacy-2103");

    expect(merge).not.toBeNull();
    expect(requestEntry.requestDetail?.downstream[0]?.pharmacyChild?.pharmacyCaseId).toBe(
      merge?.pharmacyCaseId,
    );
    expect(messageEntry.activeCluster.linkedPharmacyCaseId).toBe(merge?.pharmacyCaseId);
    expect(pharmacyTask?.requestRef).toBe(merge?.requestRef);
    expect(pharmacyTask?.pharmacyCaseId).toBe(merge?.pharmacyCaseId);
    expect(pharmacyTask?.changedSinceSeenLabel).toBe(merge?.changedSinceSeenLabel);
    expect(pharmacyTask?.notificationStateLabel).toBe(merge?.patientNotification.stateLabel);
    expect(staffDataset.changedSinceSeen.changedLabels).toContain(merge?.changedSinceSeenLabel);
    expect(opsAnomaly?.title).toBe(merge?.ops.title);
    expect(opsAnomaly?.summary).toBe(merge?.ops.summary);
    expect(opsServiceHealthRows.some((row) => row.serviceRef === "svc_pharmacy_loop")).toBe(true);
    expect(
      opsCohortImpactRows.some((row) => row.cohortRef === "cohort_pharmacy_reentry"),
    ).toBe(true);
  });

  it("keeps completed messaging calm and consistent with the patient pharmacy status projection", () => {
    const merge = resolvePharmacyProductMergePreviewForRequest("request_215_closed");
    const messageEntry = resolveRecordsCommunicationsEntry(
      "/messages/cluster_368_pharmacy_completed",
    );
    const statusPreview = resolvePharmacyPatientStatusPreview("PHC-2196");

    expect(merge).not.toBeNull();
    expect(statusPreview).not.toBeNull();
    expect(messageEntry.activeCluster.linkedPharmacyCaseId).toBe("PHC-2196");
    expect(messageEntry.activeCluster.authoritativeStatusLabel).toBe("Outcome recorded");
    expect(messageEntry.commandSettlement.authoritativeOutcomeState).toBe("settled");
    expect(messageEntry.commandSettlement.calmSettledLanguageAllowed).toBe(true);
    expect(messageEntry.receiptEnvelope.receiptLabel).toBe("Outcome recorded");
    expect(statusPreview?.outcomeTruth.outcomeTruthState).toBe("settled_resolved");
    expect(statusPreview?.outcomePage?.calmCompletionText).toContain(
      "completed referral outcome",
    );
  });
});
