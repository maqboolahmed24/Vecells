import { describe, expect, it } from "vitest";

import {
  create353BounceBackHarness,
  ingest353BounceBack,
  load353LoopPosture,
  load353Summary,
  reopen353FromBounceBack,
  resolve353SupervisorReview,
  seed353BounceBackReadyCase,
} from "./353_pharmacy_bounce_back.helpers.ts";

describe("353 pharmacy bounce-back queue posture and reopen flow", () => {
  it("escalates repeated non-material loops before allowing reopen", async () => {
    const harness = create353BounceBackHarness();
    const seeded = await seed353BounceBackReadyCase({
      harness,
      seed: "353_loop_review",
    });

    const first = await ingest353BounceBack({
      harness,
      pharmacyCaseId: seeded.currentCase.pharmacyCaseId,
      patientShellConsistencyProjectionId:
        seeded.shellProjection.patientShellConsistencyProjectionId,
      patientContactRouteRef: seeded.patientContactRouteRef,
      explicitBounceBackType: "routine_gp_return",
      recordedAt: "2026-04-23T19:10:00.000Z",
      deltaClinical: 0,
      deltaContact: 0,
      deltaProvider: 0,
      deltaConsent: 0,
      deltaTiming: 0,
      emitPatientNotification: false,
    });

    expect(first.bounceBackRecord.supervisorReviewState).toBe("not_required");

    const second = await ingest353BounceBack({
      harness,
      pharmacyCaseId: seeded.currentCase.pharmacyCaseId,
      patientShellConsistencyProjectionId:
        seeded.shellProjection.patientShellConsistencyProjectionId,
      patientContactRouteRef: seeded.patientContactRouteRef,
      explicitBounceBackType: "routine_gp_return",
      recordedAt: "2026-04-23T19:11:00.000Z",
      deltaClinical: 0,
      deltaContact: 0,
      deltaProvider: 0,
      deltaConsent: 0,
      deltaTiming: 0,
      emitPatientNotification: false,
    });

    expect(second.bounceBackRecord.supervisorReviewState).toBe("required");
    expect(second.supervisorReview?.reviewState).toBe("required");
    expect(second.bounceBackTruthProjection.autoRedispatchBlocked).toBe(true);

    const summary = await load353Summary(harness, seeded.currentCase.pharmacyCaseId);
    const posture = await load353LoopPosture(harness, seeded.currentCase.pharmacyCaseId);
    expect(summary?.currentSupervisorReviewRef?.refId).toBe(
      second.supervisorReview?.pharmacyBounceBackSupervisorReviewId,
    );
    expect(posture?.supervisorReviewState).toBe("required");

    await expect(
      reopen353FromBounceBack({
        harness,
        pharmacyCaseId: seeded.currentCase.pharmacyCaseId,
        bounceBackRecordId: second.bounceBackRecord.bounceBackRecordId,
        patientShellConsistencyProjectionId:
          seeded.shellProjection.patientShellConsistencyProjectionId,
        reopenToStatus: "candidate_received",
        recordedAt: "2026-04-23T19:12:00.000Z",
      }),
    ).rejects.toMatchObject({
      code: "SUPERVISOR_REVIEW_REQUIRED",
    });

    const resolved = await resolve353SupervisorReview({
      harness,
      pharmacyCaseId: seeded.currentCase.pharmacyCaseId,
      bounceBackRecordId: second.bounceBackRecord.bounceBackRecordId,
      resolution: "dismiss_as_material_change",
      recordedAt: "2026-04-23T19:13:00.000Z",
    });

    expect(resolved.bounceBackRecord.supervisorReviewState).toBe("resolved");
    expect(resolved.bounceBackTruthProjection.autoRedispatchBlocked).toBe(false);
    expect(
      resolved.bounceBackTruthProjection.practiceVisibilityProjectionRef.refId,
    ).toBe(resolved.practiceVisibilityProjection.pharmacyPracticeVisibilityProjectionId);

    const reopened = await reopen353FromBounceBack({
      harness,
      pharmacyCaseId: seeded.currentCase.pharmacyCaseId,
      bounceBackRecordId: second.bounceBackRecord.bounceBackRecordId,
      patientShellConsistencyProjectionId:
        seeded.shellProjection.patientShellConsistencyProjectionId,
      reopenToStatus: "candidate_received",
      recordedAt: "2026-04-23T19:14:00.000Z",
    });

    expect(reopened.result.pharmacyCase.status).toBe("candidate_received");
    expect(reopened.triageReentryState).toBe("triage_active");
    expect(
      reopened.result.bounceBackTruthProjection.practiceVisibilityProjectionRef.refId,
    ).toBe(reopened.result.practiceVisibilityProjection.pharmacyPracticeVisibilityProjectionId);
    expect(reopened.result.bounceBackTruthProjection.patientStatusProjectionRef.refId).toBe(
      reopened.result.patientStatusProjection.pharmacyPatientStatusProjectionId,
    );
  });
});
