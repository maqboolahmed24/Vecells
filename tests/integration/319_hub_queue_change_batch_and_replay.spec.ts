import { describe, expect, it } from "vitest";

import {
  createHubQueueCase,
  publishQueue,
  setupHubQueueHarness,
} from "./319_hub_queue.helpers.ts";

describe("319 hub queue change batch and replay", () => {
  it("publishes queue change batches that preserve selected-anchor continuity", async () => {
    const harness = await setupHubQueueHarness("319_batch");
    const first = await createHubQueueCase(harness, {
      name: "first",
      dueMinute: 90,
      originPracticeOds: "PRA_BATCH_A",
      state: "coordinator_selecting",
    });
    const second = await createHubQueueCase(harness, {
      name: "second",
      dueMinute: 95,
      originPracticeOds: "PRA_BATCH_B",
      state: "coordinator_selecting",
    });

    const initial = await publishQueue(harness, [first, second], {
      selectedAnchorRef: second.current.hubCase.hubCoordinationCaseId,
    });

    expect(initial.queueChangeBatch).toBeNull();

    const insertedCritical = await createHubQueueCase(harness, {
      name: "critical_insert",
      priorityBand: "urgent",
      dueMinute: 16,
      latestSafeOfferMinute: 10,
      originPracticeOds: "PRA_BATCH_C",
      state: "coordinator_selecting",
      expectedCoordinationMinutes: 20,
    });

    const updated = await publishQueue(harness, [first, second, insertedCritical], {
      selectedAnchorRef: second.current.hubCase.hubCoordinationCaseId,
    });

    expect(updated.queueChangeBatch).not.toBeNull();
    expect(updated.queueChangeBatch?.insertedRefs).toContain(
      insertedCritical.current.hubCase.hubCoordinationCaseId,
    );
    expect(updated.queueChangeBatch?.preservedAnchorRef).toBe(
      second.current.hubCase.hubCoordinationCaseId,
    );
    expect(updated.queueChangeBatch?.anchorApplyState).toBe("preserved");
    expect(updated.workbenchProjection.activeQueueChangeBatchRef).toBe(
      updated.queueChangeBatch?.batchId ?? null,
    );

    const replay = await harness.queueService.replayHubQueueOrder({
      rankSnapshotId: updated.rankSnapshot.rankSnapshotId,
    });
    expect(replay.matchesStoredSnapshot).toBe(true);
    expect(replay.mismatchFields).toEqual([]);
  });
});
