import { describe, expect, it } from "vitest";

import {
  atMinute,
  createAuthoritativeBookedCommit,
  createImportedDisputedCommit,
} from "./339_commit_mesh_no_slot.helpers.ts";
import {
  beginNativeCommit,
  buildBeginCommitInput,
  buildManualCaptureInput,
  buildNativeSubmitInput,
  setupHubCommitHarness,
} from "./321_hub_commit.helpers.ts";

describe("339 commit truth and confirmation gate", () => {
  it("keeps pending native and weak manual evidence below booked calmness until corroboration or authoritative confirmation clears the gate", async () => {
    const pendingHarness = await setupHubCommitHarness("339_native_pending");
    const pendingBegin = await beginNativeCommit(pendingHarness);
    const pending = await pendingHarness.commitService.submitNativeApiCommit(
      await buildNativeSubmitInput(pendingHarness, pendingBegin, {
        response: {
          responseClass: "accepted_pending",
          receiptCheckpointRef: `receipt_${pendingBegin.commitAttempt.commitAttemptId}`,
          adapterCorrelationKey: `corr_${pendingBegin.commitAttempt.commitAttemptId}`,
          providerBookingReference: `booking_${pendingBegin.commitAttempt.commitAttemptId}`,
          supplierAppointmentRef: `supplier_appt_${pendingBegin.commitAttempt.commitAttemptId}`,
          sourceFamilies: ["adapter_receipt"],
        },
      }),
    );

    expect(pending.settlement.result).toBe("pending_confirmation");
    expect(pending.confirmationGate?.state).toBe("pending");
    expect(pending.truthProjection.confirmationTruthState).toBe("confirmation_pending");
    expect(pending.truthProjection.patientVisibilityState).toBe("provisional_receipt");
    expect(pending.truthProjection.practiceVisibilityState).toBe("continuity_pending");
    expect(pending.truthProjection.closureState).toBe("blocked_by_confirmation");
    expect(pending.appointment).toBeNull();

    const manualHarness = await setupHubCommitHarness("339_manual_corroborated");
    const manualBegin = await manualHarness.commitService.beginCommitAttempt(
      await buildBeginCommitInput(manualHarness, "manual_pending_confirmation"),
    );

    const weakManual = await manualHarness.commitService.captureManualBookingEvidence(
      await buildManualCaptureInput(manualHarness, manualBegin),
    );

    expect(weakManual.settlement.result).toBe("pending_confirmation");
    expect(weakManual.confirmationGate?.state).toBe("pending");
    expect(weakManual.truthProjection.confirmationTruthState).toBe("confirmation_pending");
    expect(weakManual.truthProjection.patientVisibilityState).toBe("provisional_receipt");
    expect(weakManual.truthProjection.closureState).toBe("blocked_by_confirmation");
    expect(weakManual.appointment).toBeNull();

    const corroboratedBase = await buildManualCaptureInput(manualHarness, manualBegin);
    const corroborated = await manualHarness.commitService.captureManualBookingEvidence({
      ...corroboratedBase,
      commitAttemptId: weakManual.commitAttempt.commitAttemptId,
      presentedTruthTupleHash: weakManual.commitAttempt.truthTupleHash,
      recordedAt: atMinute(16),
      evidence: {
        ...corroboratedBase.evidence,
        evidenceSourceFamilies: [
          "manual_operator_entry",
          "manual_independent_call_back",
        ],
      },
    });

    expect(corroborated.settlement.result).toBe("booked_pending_ack");
    expect(corroborated.confirmationGate?.state).toBe("confirmed");
    expect(corroborated.truthProjection.confirmationTruthState).toBe(
      "confirmed_pending_practice_ack",
    );
    expect(corroborated.truthProjection.practiceVisibilityState).toBe("ack_pending");
    expect(corroborated.truthProjection.closureState).toBe("blocked_by_practice_visibility");
    expect(corroborated.appointment?.appointmentState).toBe("confirmed_pending_practice_ack");
  });

  it("keeps imported disputes and supplier drift visibly weaker than final booked calmness", async () => {
    const imported = await createImportedDisputedCommit("339_import_disputed");

    expect(imported.disputed.confirmationGate?.state).toBe("disputed");
    expect(imported.disputed.settlement.result).toBe("imported_disputed");
    expect(imported.disputed.truthProjection.confirmationTruthState).toBe("disputed");
    expect(imported.disputed.truthProjection.patientVisibilityState).toBe("recovery_required");
    expect(imported.disputed.truthProjection.closureState).toBe("blocked_by_confirmation");
    expect(imported.disputed.evidenceBundle?.hardMatchResult).toBe("failed");
    expect(imported.disputed.evidenceBundle?.hardMatchRefsFailed).toContain("source_version");

    const booked = await createAuthoritativeBookedCommit("339_supplier_drift");
    const drift = await booked.harness.commitService.recordSupplierMirrorObservation({
      hubAppointmentId: booked.booked.appointment!.hubAppointmentId,
      observedAt: atMinute(20),
      observedStatus: "cancelled",
      supplierVersion: "supplier_v2",
      driftReasonRefs: ["supplier_cancelled_after_booking"],
    });

    expect(drift.mirrorState.driftState).toBe("drift_detected");
    expect(drift.mirrorState.manageFreezeState).toBe("frozen");
    expect(drift.driftHook?.hookState).toBe("open");
    expect(drift.truthProjection.confirmationTruthState).toBe("blocked_by_drift");
    expect(drift.truthProjection.patientVisibilityState).toBe("recovery_required");
    expect(drift.truthProjection.practiceVisibilityState).toBe("recovery_required");
    expect(drift.truthProjection.closureState).toBe("blocked_by_supplier_drift");
    expect(drift.continuityProjection?.blockingRefs).toContain("supplier_drift_detected");
  });
});
