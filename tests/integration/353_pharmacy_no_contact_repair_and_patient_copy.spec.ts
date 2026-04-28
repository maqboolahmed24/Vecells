import { describe, expect, it } from "vitest";

import {
  create353BounceBackHarness,
  ingest353BounceBack,
  seed353BounceBackReadyCase,
} from "./353_pharmacy_bounce_back.helpers.ts";

describe("353 pharmacy no-contact repair and patient copy", () => {
  it("reopens no-contact returns with repair-bound reachability truth instead of assuming contact health", async () => {
    const harness = create353BounceBackHarness();
    const seeded = await seed353BounceBackReadyCase({
      harness,
      seed: "353_no_contact",
      routeKind: "sms",
    });

    await harness.reachabilityGovernor.freezeContactRouteSnapshot({
      subjectRef: seeded.currentCase.patientRef.refId,
      routeRef: seeded.patientContactRouteRef,
      routeVersionRef: `${seeded.patientContactRouteRef}:v2`,
      routeKind: "sms",
      normalizedAddressRef: "tel:+447700900353",
      preferenceProfileRef: "preference_profile_353_no_contact",
      verificationState: "unverified",
      demographicFreshnessState: "stale",
      preferenceFreshnessState: "stale",
      sourceAuthorityClass: "patient_confirmed",
      createdAt: "2026-04-23T19:09:00.000Z",
    });

    const ingested = await ingest353BounceBack({
      harness,
      pharmacyCaseId: seeded.currentCase.pharmacyCaseId,
      patientShellConsistencyProjectionId:
        seeded.shellProjection.patientShellConsistencyProjectionId,
      patientContactRouteRef: seeded.patientContactRouteRef,
      explicitBounceBackType: "patient_not_contactable",
      patientContactFailureSeverity: 1,
      contactRouteTrustFailure: 1,
      recordedAt: "2026-04-23T19:10:00.000Z",
      emitPatientNotification: false,
      deltaClinical: 0,
      deltaContact: 1,
      deltaProvider: 0,
      deltaConsent: 0,
      deltaTiming: 0.2,
    });

    expect(ingested.pharmacyCase.status).toBe("no_contact_return_pending");
    expect(ingested.bounceBackRecord.reopenedCaseStatus).toBe("no_contact_return_pending");
    expect(ingested.reachabilityPlan?.dominantBrokenDependency).toBe("urgent_return");
    expect(ingested.reachabilityPlan?.repairState).not.toBe("clear");
    expect(ingested.reachabilityPlan?.contactRepairJourneyRef).toBeTruthy();
    expect(ingested.practiceVisibilityProjection.reachabilityRepairState).toBe("in_progress");
    expect(ingested.notificationTrigger?.headlineCopyRef).toBe(
      "pharmacy.return.contact_repair_required",
    );

    const preview = await harness.bounceBackService.getReturnSpecificPatientMessagePreview(
      seeded.currentCase.pharmacyCaseId,
    );
    expect(preview?.headlineCopyRef).toBe("pharmacy.return.contact_repair_required");
    expect(preview?.notificationState).toBe("ready");
  });
});
