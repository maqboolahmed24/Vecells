import { describe, expect, it } from "vitest";

import {
  create353BounceBackHarness,
  seed353BounceBackReadyCase,
} from "./353_pharmacy_bounce_back.helpers.ts";
import { ingest352Outcome } from "./352_pharmacy_outcome.helpers.ts";

const TASK_343 =
  "seq_343_phase6_freeze_directory_discovery_referral_dispatch_and_outcome_reconciliation_contracts" as const;

describe("353 pharmacy urgent return and duty-task routing", () => {
  it("turns urgent pharmacy return evidence into one duty-task reopen truth family", async () => {
    const harness = create353BounceBackHarness();
    const seeded = await seed353BounceBackReadyCase({
      harness,
      seed: "353_urgent_return",
    });

    const outcome = await ingest352Outcome({
      harness,
      pharmacyCaseId: seeded.currentCase.pharmacyCaseId,
      classificationState: "urgent_gp_action",
      sourceType: "direct_structured_message",
      recordedAt: "2026-04-23T19:05:00.000Z",
    });

    const ingested = await harness.bounceBackService.ingestBounceBackEvidence({
      pharmacyCaseId: seeded.currentCase.pharmacyCaseId,
      patientShellConsistencyProjectionId:
        seeded.shellProjection.patientShellConsistencyProjectionId,
      patientContactRouteRef: seeded.patientContactRouteRef,
      sourceKind: "outcome_observation",
      sourceOutcomeOrDispatchRef: {
        targetFamily: "PharmacyOutcomeSettlement",
        refId: outcome.settlement.settlementId,
        ownerTask: TASK_343,
      },
      evidenceSummaryRef: "353.urgent.return",
      normalizedEvidenceRefs: ["353:urgent:return"],
      actorRef: "actor:353:urgent_return",
      commandActionRecordRef: "action:353:urgent_return",
      commandSettlementRecordRef: "settlement:353:urgent_return",
      leaseRef: seeded.currentCase.leaseRef,
      expectedOwnershipEpoch: seeded.currentCase.ownershipEpoch,
      expectedLineageFenceRef: seeded.currentCase.lineageFenceRef,
      scopedMutationGateRef: "scope:353:urgent_return",
      reasonCode: "pharmacy_urgent_return",
      receivedAt: "2026-04-23T19:06:00.000Z",
      recordedAt: "2026-04-23T19:06:00.000Z",
      emitPatientNotification: true,
    });

    expect(ingested.pharmacyCase.status).toBe("urgent_bounce_back");
    expect(ingested.bounceBackRecord.bounceBackType).toBe("urgent_gp_return");
    expect(ingested.bounceBackRecord.directUrgentRouteRef?.refId).toBeTruthy();
    expect(ingested.bounceBackTruthProjection.reacquisitionMode).toBe("duty_task");
    expect(ingested.bounceBackTruthProjection.returnedTaskRef).toContain("duty_task:");
    expect(ingested.bounceBackTruthProjection.reopenPriorityBand).toBe(3);
    expect(ingested.practiceVisibilityProjection.urgentReturnState).toBe("urgent_return_active");
    expect(ingested.notificationTrigger?.headlineCopyRef).toBe(
      "pharmacy.return.urgent_action_required",
    );
  });
});
