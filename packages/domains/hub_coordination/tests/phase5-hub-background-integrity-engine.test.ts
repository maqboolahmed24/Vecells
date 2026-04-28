import { describe, expect, it } from "vitest";

import {
  atMinute,
  buildSupplierObservationInput,
  prepareBookedManageHarness,
  setupBookedIntegrityHarness,
  setupReconciliationIntegrityHarness,
} from "../../../../tests/integration/325_hub_background_integrity.helpers.ts";

describe("phase5 hub background integrity engine", () => {
  it("claims exactly one active reconciliation lease per attempt", async () => {
    const harness = await setupReconciliationIntegrityHarness("325_unit_claim");

    const first = await harness.integrityService.claimReconciliationAttempt({
      commitAttemptId: harness.reconciliationResult.commitAttempt.commitAttemptId,
      workerRef: "worker_a",
      workerRunRef: "run_a",
      claimedAt: atMinute(25),
    });
    const second = await harness.integrityService.claimReconciliationAttempt({
      commitAttemptId: harness.reconciliationResult.commitAttempt.commitAttemptId,
      workerRef: "worker_b",
      workerRunRef: "run_b",
      claimedAt: atMinute(26),
    });

    expect(first.replayed).toBe(false);
    expect(first.blockedByActiveLease).toBe(false);
    expect(first.workLease?.leaseState).toBe("active");
    expect(second.replayed).toBe(false);
    expect(second.blockedByActiveLease).toBe(true);
    expect(second.workLease?.hubReconciliationWorkLeaseId).toBe(
      first.workLease?.hubReconciliationWorkLeaseId,
    );
  });

  it("keeps a frozen mirror frozen when a later booked observation is weaker than current drift", async () => {
    const harness = await setupBookedIntegrityHarness("325_unit_mirror_monotone");
    await prepareBookedManageHarness(harness);

    const drift = await harness.integrityService.ingestSupplierMirrorObservation(
      buildSupplierObservationInput(harness, {
        observedStatus: "cancelled",
      }),
    );
    const weakerBooked = await harness.integrityService.ingestSupplierMirrorObservation(
      buildSupplierObservationInput(harness, {
        payloadId: `supplier_payload_recovery_${drift.observation.hubAppointmentId}`,
        observedStatus: "booked",
        observedAt: atMinute(31),
        recordedAt: atMinute(31),
        confidenceBand: "low",
      }),
    );

    expect(drift.mirrorState.driftState).toBe("drift_detected");
    expect(drift.mirrorState.manageFreezeState).toBe("frozen");
    expect(weakerBooked.observation.observationDisposition).toBe("ignored_weaker");
    expect(weakerBooked.mirrorState.hubSupplierMirrorStateId).toBe(
      drift.mirrorState.hubSupplierMirrorStateId,
    );
    expect(weakerBooked.mirrorState.manageFreezeState).toBe("frozen");
    expect(weakerBooked.mirrorState.driftState).toBe("drift_detected");
  });
});
