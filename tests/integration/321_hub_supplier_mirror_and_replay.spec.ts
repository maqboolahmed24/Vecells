import { describe, expect, it } from "vitest";

import {
  atMinute,
  beginNativeCommit,
  buildNativeSubmitInput,
  setupHubCommitHarness,
} from "./321_hub_commit.helpers.ts";

describe("321 hub supplier mirror and replay", () => {
  it("freezes manage posture when supplier drift is observed after booking", async () => {
    const harness = await setupHubCommitHarness("321_drift");
    const begin = await beginNativeCommit(harness);
    const booked = await harness.commitService.submitNativeApiCommit(
      await buildNativeSubmitInput(harness, begin, {
        response: {
          responseClass: "authoritative_confirmed",
          receiptCheckpointRef: `receipt_${begin.commitAttempt.commitAttemptId}`,
          adapterCorrelationKey: `corr_${begin.commitAttempt.commitAttemptId}`,
          providerBookingReference: `booking_${begin.commitAttempt.commitAttemptId}`,
          supplierAppointmentRef: `supplier_${begin.commitAttempt.commitAttemptId}`,
          sourceFamilies: [
            "same_commit_read_after_write",
            "durable_provider_reference",
          ],
          hardMatchRefsPassed: [
            "selected_candidate",
            "capacity_unit",
            "provider_binding",
          ],
        },
      }),
    );

    const drift = await harness.commitService.recordSupplierMirrorObservation({
      hubAppointmentId: booked.appointment!.hubAppointmentId,
      observedAt: atMinute(20),
      observedStatus: "cancelled",
      supplierVersion: "supplier_v2",
      driftReasonRefs: ["supplier_cancelled_after_booking"],
    });

    expect(drift.mirrorState.driftState).toBe("drift_detected");
    expect(drift.mirrorState.manageFreezeState).toBe("frozen");
    expect(drift.driftHook?.hookState).toBe("open");
    expect(drift.truthProjection.confirmationTruthState).toBe("blocked_by_drift");
    expect(drift.truthProjection.closureState).toBe("blocked_by_supplier_drift");
    expect(drift.continuityProjection?.blockingRefs).toContain("supplier_drift_detected");
  });

  it("returns the existing booked result when native submit is replayed after success", async () => {
    const harness = await setupHubCommitHarness("321_submit_replay");
    const begin = await beginNativeCommit(harness);
    const booked = await harness.commitService.submitNativeApiCommit(
      await buildNativeSubmitInput(harness, begin, {
        response: {
          responseClass: "authoritative_confirmed",
          receiptCheckpointRef: `receipt_${begin.commitAttempt.commitAttemptId}`,
          adapterCorrelationKey: `corr_${begin.commitAttempt.commitAttemptId}`,
          providerBookingReference: `booking_${begin.commitAttempt.commitAttemptId}`,
          supplierAppointmentRef: `supplier_${begin.commitAttempt.commitAttemptId}`,
          sourceFamilies: [
            "same_commit_read_after_write",
            "durable_provider_reference",
          ],
          hardMatchRefsPassed: [
            "selected_candidate",
            "capacity_unit",
            "provider_binding",
          ],
        },
      }),
    );

    const replay = await harness.commitService.submitNativeApiCommit(
      await buildNativeSubmitInput(harness, begin, {
        recordedAt: atMinute(18),
        response: {
          responseClass: "authoritative_confirmed",
          receiptCheckpointRef: `receipt_${begin.commitAttempt.commitAttemptId}`,
          adapterCorrelationKey: `corr_${begin.commitAttempt.commitAttemptId}`,
          providerBookingReference: `booking_${begin.commitAttempt.commitAttemptId}`,
          supplierAppointmentRef: `supplier_${begin.commitAttempt.commitAttemptId}`,
          sourceFamilies: [
            "same_commit_read_after_write",
            "durable_provider_reference",
          ],
          hardMatchRefsPassed: [
            "selected_candidate",
            "capacity_unit",
            "provider_binding",
          ],
        },
      }),
    );

    expect(replay.settlement.result).toBe("booked_pending_ack");
    expect(replay.commitAttempt.commitAttemptId).toBe(booked.commitAttempt.commitAttemptId);
    expect(replay.appointment?.hubAppointmentId).toBe(booked.appointment?.hubAppointmentId);
  });
});
