import { describe, expect, it } from "vitest";

import {
  atMinute,
  buildBeginCommitInput,
  buildManualCaptureInput,
  setupHubCommitHarness,
} from "../../../../tests/integration/321_hub_commit.helpers.ts";

describe("phase5 hub commit engine", () => {
  it("replays beginCommitAttempt by idempotency key instead of minting a second attempt", async () => {
    const harness = await setupHubCommitHarness("321_unit_replay");
    const beginInput = await buildBeginCommitInput(harness, "native_api");

    const first = await harness.commitService.beginCommitAttempt(beginInput);
    const replay = await harness.commitService.beginCommitAttempt({
      ...beginInput,
      recordedAt: atMinute(14),
    });

    expect(first.replayed).toBe(false);
    expect(replay.replayed).toBe(true);
    expect(replay.commitAttempt.commitAttemptId).toBe(first.commitAttempt.commitAttemptId);
    expect(replay.reservation.reservationId).toBe(first.reservation.reservationId);

    const attempts = await harness.commitRepositories.listCommitAttemptsForCase(
      harness.accepted.hubTransition.hubCase.hubCoordinationCaseId,
    );
    expect(attempts).toHaveLength(1);
  });

  it("keeps weak manual evidence provisional until corroboration clears the gate", async () => {
    const harness = await setupHubCommitHarness("321_unit_manual");
    const begin = await harness.commitService.beginCommitAttempt(
      await buildBeginCommitInput(harness, "manual_pending_confirmation"),
    );

    const firstCapture = await harness.commitService.captureManualBookingEvidence(
      await buildManualCaptureInput(harness, begin),
    );
    const secondBase = await buildManualCaptureInput(harness, begin);
    const secondCapture = await harness.commitService.captureManualBookingEvidence({
      ...secondBase,
      commitAttemptId: firstCapture.commitAttempt.commitAttemptId,
      presentedTruthTupleHash: firstCapture.commitAttempt.truthTupleHash,
      recordedAt: atMinute(16),
      evidence: {
        ...secondBase.evidence,
        evidenceSourceFamilies: [
          "manual_operator_entry",
          "manual_independent_call_back",
        ],
      },
    });

    expect(firstCapture.settlement.result).toBe("pending_confirmation");
    expect(firstCapture.confirmationGate?.state).toBe("pending");
    expect(firstCapture.truthProjection.confirmationTruthState).toBe("confirmation_pending");
    expect(firstCapture.appointment).toBeNull();

    expect(secondCapture.settlement.result).toBe("booked_pending_ack");
    expect(secondCapture.confirmationGate?.state).toBe("confirmed");
    expect(secondCapture.truthProjection.confirmationTruthState).toBe(
      "confirmed_pending_practice_ack",
    );
    expect(secondCapture.appointment?.appointmentState).toBe(
      "confirmed_pending_practice_ack",
    );
  });
});
