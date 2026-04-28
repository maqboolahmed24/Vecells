import { describe, expect, it } from "vitest";

import { practiceContinuityChannels } from "../../packages/domains/hub_coordination/src/phase5-practice-continuity-engine.ts";
import {
  atMinute,
  buildEnqueuePracticeContinuityInput,
  buildReopenInput,
  setupPracticeContinuityHarness,
} from "../integration/322_practice_continuity.helpers.ts";

describe("322 practice acknowledgement properties", () => {
  it("keeps enqueue idempotent for every declared continuity channel", async () => {
    for (const continuityChannel of practiceContinuityChannels) {
      const harness = await setupPracticeContinuityHarness(`322_property_${continuityChannel}`);
      const enqueueInput = buildEnqueuePracticeContinuityInput(harness, {
        continuityChannel,
      });

      const first = await harness.continuityService.enqueuePracticeContinuityMessage(enqueueInput);
      const replay = await harness.continuityService.enqueuePracticeContinuityMessage({
        ...enqueueInput,
        recordedAt: atMinute(16),
      });

      expect(replay.message?.practiceContinuityMessageId).toBe(
        first.message?.practiceContinuityMessageId,
      );
      expect(replay.replayed).toBe(true);
    }
  });

  it("increments acknowledgement generation monotonically when reopen is requested repeatedly", async () => {
    const harness = await setupPracticeContinuityHarness("322_property_generation");
    await harness.continuityService.enqueuePracticeContinuityMessage(
      buildEnqueuePracticeContinuityInput(harness),
    );

    const generations: number[] = [];
    for (const minuteOffset of [19, 20, 21]) {
      const reopened = await harness.continuityService.reopenPracticeAcknowledgementDebt(
        buildReopenInput(harness, {
          recordedAt: atMinute(minuteOffset),
        }),
      );
      generations.push(reopened.hubTransition!.hubCase.practiceAckGeneration);
    }

    expect(generations).toEqual([...generations].sort((left, right) => left - right));
    expect(new Set(generations).size).toBe(generations.length);
  });
});
