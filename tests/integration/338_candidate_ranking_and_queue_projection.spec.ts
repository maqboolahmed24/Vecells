import { describe, expect, it } from "vitest";

import {
  buildCaseBinding,
  buildNoTrustedSupplyBindings,
  createHubQueueCase,
  publishQueue,
  setupHubQueueHarness,
} from "./319_hub_queue.helpers.ts";

describe("338 candidate ranking and queue projection", () => {
  it("publishes queue rows in the same authoritative order as the rank entries", async () => {
    const harness = await setupHubQueueHarness("338_queue_projection");
    const urgent = await createHubQueueCase(harness, {
      name: "urgent",
      priorityBand: "urgent",
      dueMinute: 18,
      latestSafeOfferMinute: 11,
      originPracticeOds: "PRA_338_URGENT",
      state: "coordinator_selecting",
    });
    const noTrusted = await createHubQueueCase(harness, {
      name: "no_trusted",
      dueMinute: 72,
      originPracticeOds: "PRA_338_NO_TRUST",
      state: "candidates_ready",
      snapshotBindings: buildNoTrustedSupplyBindings("338_queue_projection_no_trusted"),
    });
    const selecting = await createHubQueueCase(harness, {
      name: "selecting",
      dueMinute: 56,
      originPracticeOds: "PRA_338_SELECTING",
      state: "coordinator_selecting",
    });

    const published = await publishQueue(harness, [selecting, urgent, noTrusted], {
      selectedAnchorRef: urgent.current.hubCase.hubCoordinationCaseId,
      caseBindings: [
        buildCaseBinding(selecting),
        buildCaseBinding(urgent),
        buildCaseBinding(noTrusted),
      ],
    });

    expect(published.rankEntries.map((entry) => entry.taskRef)).toEqual(
      published.workbenchProjection.visibleRowRefs,
    );
    expect(published.workbenchProjection.selectedAnchorRef).toBe(
      urgent.current.hubCase.hubCoordinationCaseId,
    );
    expect(published.rankEntries[0]?.taskRef).toBe(urgent.current.hubCase.hubCoordinationCaseId);
    expect(published.rankEntries[1]?.taskRef).toBe(
      noTrusted.current.hubCase.hubCoordinationCaseId,
    );
    expect(published.rankEntries[2]?.taskRef).toBe(
      selecting.current.hubCase.hubCoordinationCaseId,
    );
  });

  it("preserves the selected anchor through buffered queue change batches and replay", async () => {
    const harness = await setupHubQueueHarness("338_queue_batch");
    const first = await createHubQueueCase(harness, {
      name: "first",
      dueMinute: 90,
      originPracticeOds: "PRA_338_BATCH_A",
      state: "coordinator_selecting",
    });
    const second = await createHubQueueCase(harness, {
      name: "second",
      dueMinute: 95,
      originPracticeOds: "PRA_338_BATCH_B",
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
      originPracticeOds: "PRA_338_BATCH_C",
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

    const replay = await harness.queueService.replayHubQueueOrder({
      rankSnapshotId: updated.rankSnapshot.rankSnapshotId,
    });
    expect(replay.matchesStoredSnapshot).toBe(true);
    expect(replay.mismatchFields).toEqual([]);
  });
});

