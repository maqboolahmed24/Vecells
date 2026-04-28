import { describe, expect, it } from "vitest";

import {
  create353BounceBackHarness,
  ingest353BounceBack,
  load353Summary,
  seed353BounceBackReadyCase,
} from "./353_pharmacy_bounce_back.helpers.ts";

describe("353 pharmacy bounce-back routing", () => {
  it("routes urgent GP returns through the urgent branch with direct-route posture and triage reacquisition", async () => {
    const harness = create353BounceBackHarness();
    const seeded = await seed353BounceBackReadyCase({
      harness,
      seed: "353_urgent_route",
      routeKind: "voice",
    });

    const result = await ingest353BounceBack({
      harness,
      pharmacyCaseId: seeded.currentCase.pharmacyCaseId,
      patientShellConsistencyProjectionId:
        seeded.shellProjection.patientShellConsistencyProjectionId,
      patientContactRouteRef: seeded.patientContactRouteRef,
      explicitBounceBackType: "urgent_gp_return",
      sourceKind: "manual_capture",
      recordedAt: "2026-04-23T19:10:00.000Z",
      outstandingClinicalWorkRequired: true,
      emitPatientNotification: true,
    });

    expect(result.pharmacyCase.status).toBe("urgent_bounce_back");
    expect(result.bounceBackRecord.directUrgentRouteRef?.targetFamily).toBe(
      "UrgentReturnDirectRouteProfile",
    );
    expect(result.bounceBackRecord.gpActionRequired).toBe(true);
    expect(result.bounceBackRecord.returnedTaskRef).toContain("duty_task:");
    expect(result.bounceBackTruthProjection.reacquisitionMode).toBe("duty_task");
    expect(result.bounceBackTruthProjection.triageReentryState).toBe("triage_active");
    expect(result.notificationTrigger?.notificationState).toBe("emitted");

    const summary = await load353Summary(harness, seeded.currentCase.pharmacyCaseId);
    expect(summary?.reopenedCaseStatus).toBe("urgent_bounce_back");
    expect(summary?.patientNotificationState).toBe("emitted");
  });
});
