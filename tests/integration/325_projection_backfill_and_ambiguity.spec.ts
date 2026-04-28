import { describe, expect, it } from "vitest";

import {
  atMinute,
  prepareBookedManageHarness,
  setupBookedIntegrityHarness,
} from "./325_hub_background_integrity.helpers.ts";

describe("325 projection backfill and ambiguity handling", () => {
  it("fails closed when open-case lineage is ambiguous instead of restoring a calm booked posture", async () => {
    const harness = await setupBookedIntegrityHarness("325_backfill_ambiguous");
    await prepareBookedManageHarness(harness);

    const appointment = (
      await harness.commitRepositories.getAppointmentRecord(
        harness.commitResult.appointment!.hubAppointmentId,
      )
    )!.toSnapshot();
    await harness.commitRepositories.saveAppointmentRecord(
      {
        ...appointment,
        selectedCandidateRef: `${appointment.selectedCandidateRef}_drifted`,
        version: appointment.version + 1,
      },
      {
        expectedVersion: appointment.version,
      },
    );

    const result = await harness.integrityService.runProjectionBackfill({
      hubCoordinationCaseId: harness.commitResult.commitAttempt.hubCoordinationCaseId,
      workerRef: "backfill_worker",
      workerRunRef: "backfill_run_1",
      recordedAt: atMinute(40),
    });

    expect(result.cursor.lastVerdict).toBe("ambiguous");
    expect(result.cursor.ambiguityReasonRefs).toContain("appointment_candidate_conflict");
    expect(result.truthProjection.confirmationTruthState).toBe("disputed");
    expect(result.truthProjection.practiceVisibilityState).toBe("recovery_required");
    expect(result.exception?.exceptionClass).toBe("backfill_ambiguity_supervision");
  });

  it("repairs missing current refs without inventing a calmer state than the durable lineage supports", async () => {
    const harness = await setupBookedIntegrityHarness("325_backfill_repair");

    const truthProjection = (
      await harness.offerRepositories.getTruthProjectionForCase(
        harness.commitResult.commitAttempt.hubCoordinationCaseId,
      )
    )!.toSnapshot();
    await harness.offerRepositories.saveTruthProjection(
      {
        ...truthProjection,
        hubAppointmentId: null,
        practiceAcknowledgementRef: null,
        blockingRefs: truthProjection.blockingRefs.filter(
          (value) => value !== "supplier_drift_detected",
        ),
        version: truthProjection.version + 1,
      },
      {
        expectedVersion: truthProjection.version,
      },
    );

    const result = await harness.integrityService.runProjectionBackfill({
      hubCoordinationCaseId: harness.commitResult.commitAttempt.hubCoordinationCaseId,
      workerRef: "backfill_worker",
      workerRunRef: "backfill_run_2",
      recordedAt: atMinute(41),
    });

    expect(result.cursor.lastVerdict).toBe("repaired");
    expect(result.truthProjection.hubAppointmentId).toBe(
      harness.commitResult.appointment?.hubAppointmentId,
    );
    expect(result.truthProjection.practiceAcknowledgementRef).toBeNull();
    expect(result.truthProjection.confirmationTruthState).toBe(
      truthProjection.confirmationTruthState,
    );
  });
});
