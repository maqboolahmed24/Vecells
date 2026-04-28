import { describe, expect, it } from "vitest";

import {
  atMinute,
  buildAcknowledgementInput,
  buildEnqueuePracticeContinuityInput,
  buildReceiptInput,
  setupPracticeContinuityHarness,
} from "./322_practice_continuity.helpers.ts";

describe("322 practice continuity chain truth", () => {
  it("moves from queued continuity to acknowledged booked truth without collapsing weaker evidence", async () => {
    const harness = await setupPracticeContinuityHarness("322_truth");

    const enqueued = await harness.continuityService.enqueuePracticeContinuityMessage(
      buildEnqueuePracticeContinuityInput(harness),
    );
    expect(enqueued.message?.transportState).toBe("queued");
    expect(enqueued.truthProjection.practiceVisibilityState).toBe("continuity_pending");
    expect(enqueued.truthProjection.confirmationTruthState).toBe(
      "confirmed_pending_practice_ack",
    );

    const dispatched = await harness.continuityService.dispatchPracticeContinuityMessage({
      practiceContinuityMessageId: enqueued.message!.practiceContinuityMessageId,
      attemptedAt: atMinute(16),
      sourceRefs: ["tests/integration/322_practice_continuity_chain_truth.spec.ts"],
    });
    expect(dispatched.dispatchAttempt?.dispatchState).toBe("accepted");
    expect(dispatched.truthProjection.practiceVisibilityState).toBe("continuity_pending");
    expect(dispatched.message?.transportAckState).toBe("accepted");

    const downloaded = await harness.continuityService.recordReceiptCheckpoint(
      buildReceiptInput(enqueued.message!.practiceContinuityMessageId, "delivery_downloaded", {
        recordedAt: atMinute(17),
      }),
    );
    expect(downloaded.deliveryEvidence?.deliveryState).toBe("delivered");
    expect(downloaded.truthProjection.practiceVisibilityState).toBe("ack_pending");
    expect(downloaded.appointment.practiceAcknowledgementState).toBe("ack_pending");

    const acknowledged = await harness.continuityService.capturePracticeAcknowledgement(
      await buildAcknowledgementInput(harness, enqueued.message!.practiceContinuityMessageId, {
        recordedAt: atMinute(18),
      }),
    );
    expect(acknowledged.acknowledgement?.ackState).toBe("received");
    expect(acknowledged.message?.ackState).toBe("acknowledged");
    expect(acknowledged.truthProjection.practiceVisibilityState).toBe("acknowledged");
    expect(acknowledged.truthProjection.confirmationTruthState).toBe("confirmed");
    expect(acknowledged.appointment.practiceAcknowledgementState).toBe("acknowledged");
    expect(acknowledged.hubTransition?.hubCase.status).toBe("booked");
  });
});
