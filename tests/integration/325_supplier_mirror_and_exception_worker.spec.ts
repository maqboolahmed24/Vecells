import { describe, expect, it } from "vitest";

import {
  atMinute,
  buildSupplierObservationInput,
  prepareBookedManageHarness,
  setupBookedIntegrityHarness,
} from "./325_hub_background_integrity.helpers.ts";

describe("325 supplier mirror and exception worker", () => {
  it("freezes manage posture, reopens visibility debt, and opens typed exception work on supplier drift", async () => {
    const harness = await setupBookedIntegrityHarness("325_supplier_drift");
    await prepareBookedManageHarness(harness);

    const drift = await harness.integrityService.ingestSupplierMirrorObservation(
      buildSupplierObservationInput(harness, {
        observedStatus: "cancelled",
      }),
    );

    expect(drift.replayed).toBe(false);
    expect(drift.observation.observationDisposition).toBe("drift_detected");
    expect(drift.checkpoint.continuityRefreshRequired).toBe(true);
    expect(drift.checkpoint.visibilityDebtReopened).toBe(true);
    expect(drift.mirrorState.manageFreezeState).toBe("frozen");
    expect(drift.exception?.exceptionClass).toBe("supplier_drift_detected");
    expect(drift.exceptionWorkItem?.workState).toBe("open");

    const reminderState =
      await harness.manageService.queryCurrentReminderManageVisibilityState(
        harness.commitResult.commitAttempt.hubCoordinationCaseId,
      );
    expect(reminderState.practiceVisibilityProjection?.practiceAcknowledgementState).toBe(
      "ack_pending",
    );
    expect(reminderState.truthProjection?.confirmationTruthState).toBe("blocked_by_drift");
  });

  it("persists retry state across exception-worker claims and retries", async () => {
    const harness = await setupBookedIntegrityHarness("325_exception_retry");
    await prepareBookedManageHarness(harness);
    const drift = await harness.integrityService.ingestSupplierMirrorObservation(
      buildSupplierObservationInput(harness, {
        observedStatus: "cancelled",
      }),
    );

    const claimed = await harness.integrityService.claimExceptionWork({
      exceptionId: drift.exception!.exceptionId,
      workerRef: "exception_worker",
      workerRunRef: "exception_run_1",
      claimedAt: atMinute(32),
    });
    const processed = await harness.integrityService.processExceptionWork({
      exceptionId: drift.exception!.exceptionId,
      workerRef: "exception_worker",
      workerRunRef: "exception_run_1",
      recordedAt: atMinute(33),
      action: "retry",
      reasonCode: "await_next_supplier_poll",
      retryAfterMinutes: 20,
    });

    expect(claimed.workItem.workState).toBe("claimed");
    expect(processed.workItem.workState).toBe("retry_scheduled");
    expect(processed.workItem.retryCount).toBe(1);
    expect(processed.exception.retryState).toBe("retryable");

    const snapshot = await harness.integrityService.queryCurrentIntegrityState(
      harness.commitResult.commitAttempt.hubCoordinationCaseId,
    );
    expect(snapshot.exceptionBacklog).toHaveLength(1);
    expect(snapshot.exceptionBacklog[0]?.workState).toBe("retry_scheduled");
    expect(snapshot.exceptionBacklog[0]?.retryCount).toBe(1);
  });
});
