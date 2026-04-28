import { describe, expect, it } from "vitest";

import {
  create353BounceBackHarness,
  ingest353BounceBack,
  seed353BounceBackReadyCase,
} from "../integration/353_pharmacy_bounce_back.helpers.ts";

describe("353 pharmacy bounce-back priority and loop properties", () => {
  it("keeps normalized reopen posture deterministic for the same seeded lineage", async () => {
    const leftHarness = create353BounceBackHarness();
    const rightHarness = create353BounceBackHarness();

    const leftSeed = await seed353BounceBackReadyCase({
      harness: leftHarness,
      seed: "353_property_deterministic",
    });
    const rightSeed = await seed353BounceBackReadyCase({
      harness: rightHarness,
      seed: "353_property_deterministic",
    });

    const leftPreview = await leftHarness.bounceBackService.previewNormalizedBounceBack({
      pharmacyCaseId: leftSeed.currentCase.pharmacyCaseId,
      sourceKind: "manual_capture",
      explicitBounceBackType: "patient_declined",
      evidenceSummaryRef: "353.property.preview",
      patientDeclinedRequiresAlternative: true,
      normalizedEvidenceRefs: ["353:property:declined"],
      receivedAt: "2026-04-23T19:30:00.000Z",
      recordedAt: "2026-04-23T19:30:00.000Z",
    });
    const rightPreview = await rightHarness.bounceBackService.previewNormalizedBounceBack({
      pharmacyCaseId: rightSeed.currentCase.pharmacyCaseId,
      sourceKind: "manual_capture",
      explicitBounceBackType: "patient_declined",
      evidenceSummaryRef: "353.property.preview",
      patientDeclinedRequiresAlternative: true,
      normalizedEvidenceRefs: ["353:property:declined"],
      receivedAt: "2026-04-23T19:30:00.000Z",
      recordedAt: "2026-04-23T19:30:00.000Z",
    });

    expect(leftPreview.materialChange).toBe(rightPreview.materialChange);
    expect(leftPreview.loopRisk).toBe(rightPreview.loopRisk);
    expect(leftPreview.reopenPriorityBand).toBe(rightPreview.reopenPriorityBand);
    expect(leftPreview.reopenedCaseStatus).toBe(rightPreview.reopenedCaseStatus);
  });

  it("raises loop risk monotonically for repeated non-material bounce-backs on one lineage", async () => {
    const harness = create353BounceBackHarness();
    const seeded = await seed353BounceBackReadyCase({
      harness,
      seed: "353_property_loop",
    });

    const first = await ingest353BounceBack({
      harness,
      pharmacyCaseId: seeded.currentCase.pharmacyCaseId,
      patientShellConsistencyProjectionId:
        seeded.shellProjection.patientShellConsistencyProjectionId,
      patientContactRouteRef: seeded.patientContactRouteRef,
      explicitBounceBackType: "routine_gp_return",
      recordedAt: "2026-04-23T19:31:00.000Z",
      deltaClinical: 0,
      deltaContact: 0,
      deltaProvider: 0,
      deltaConsent: 0,
      deltaTiming: 0,
      emitPatientNotification: false,
    });
    const second = await ingest353BounceBack({
      harness,
      pharmacyCaseId: seeded.currentCase.pharmacyCaseId,
      patientShellConsistencyProjectionId:
        seeded.shellProjection.patientShellConsistencyProjectionId,
      patientContactRouteRef: seeded.patientContactRouteRef,
      explicitBounceBackType: "routine_gp_return",
      recordedAt: "2026-04-23T19:32:00.000Z",
      deltaClinical: 0,
      deltaContact: 0,
      deltaProvider: 0,
      deltaConsent: 0,
      deltaTiming: 0,
      emitPatientNotification: false,
    });

    expect(second.bounceBackRecord.loopRisk).toBeGreaterThan(first.bounceBackRecord.loopRisk);
    expect(second.bounceBackRecord.reopenPriorityBand).toBeGreaterThanOrEqual(
      first.bounceBackRecord.reopenPriorityBand,
    );
  });
});
