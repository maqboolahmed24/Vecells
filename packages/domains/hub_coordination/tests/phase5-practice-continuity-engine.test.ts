import { describe, expect, it } from "vitest";

import {
  atMinute,
  buildAcknowledgementInput,
  buildEnqueuePracticeContinuityInput,
  buildReceiptInput,
  buildReopenInput,
  setupPracticeContinuityHarness,
} from "../../../../tests/integration/322_practice_continuity.helpers.ts";

describe("phase5 practice continuity engine", () => {
  it("replays enqueue by dedupe key instead of minting a second live message", async () => {
    const harness = await setupPracticeContinuityHarness("322_unit_replay");
    const enqueueInput = buildEnqueuePracticeContinuityInput(harness);

    const first = await harness.continuityService.enqueuePracticeContinuityMessage(enqueueInput);
    const replay = await harness.continuityService.enqueuePracticeContinuityMessage({
      ...enqueueInput,
      recordedAt: atMinute(16),
    });

    expect(first.replayed).toBe(false);
    expect(replay.replayed).toBe(true);
    expect(replay.message?.practiceContinuityMessageId).toBe(
      first.message?.practiceContinuityMessageId,
    );
    expect(replay.truthProjection.practiceVisibilityState).toBe("continuity_pending");

    const messages = await harness.repositories.listMessagesForCase(
      enqueueInput.hubCoordinationCaseId,
    );
    expect(messages).toHaveLength(1);
  });

  it("rejects acknowledgement evidence that targets a stale generation after reopen", async () => {
    const harness = await setupPracticeContinuityHarness("322_unit_stale_generation");
    const firstMessage = await harness.continuityService.enqueuePracticeContinuityMessage(
      buildEnqueuePracticeContinuityInput(harness),
    );
    expect(firstMessage.message).not.toBeNull();
    await harness.continuityService.recordReceiptCheckpoint(
      buildReceiptInput(firstMessage.message!.practiceContinuityMessageId, "delivery_downloaded"),
    );
    await harness.continuityService.reopenPracticeAcknowledgementDebt(
      buildReopenInput(harness),
    );
    const refreshedMessage = await harness.continuityService.enqueuePracticeContinuityMessage(
      buildEnqueuePracticeContinuityInput(harness, {
        recordedAt: atMinute(20),
      }),
    );

    await expect(
      harness.continuityService.capturePracticeAcknowledgement(
        await buildAcknowledgementInput(
          harness,
          refreshedMessage.message!.practiceContinuityMessageId,
          {
            recordedAt: atMinute(21),
            presentedAckGeneration: firstMessage.message!.ackGeneration,
          },
        ),
      ),
    ).rejects.toMatchObject({
      code: "PRACTICE_ACK_GENERATION_STALE",
    });
  });
});
