import { describe, expect, it } from "vitest";

import {
  createHubQueueCase,
  publishQueue,
  setupHubQueueHarness,
} from "../../../../tests/integration/319_hub_queue.helpers.ts";

describe("phase5 hub queue engine", () => {
  it("keeps imminent breach cases ahead of fairness and convenience cues", async () => {
    const harness = await setupHubQueueHarness("319_unit_priority");
    const critical = await createHubQueueCase(harness, {
      name: "critical",
      priorityBand: "urgent",
      dueMinute: 18,
      latestSafeOfferMinute: 12,
      originPracticeOds: "PRA_CRITICAL",
      state: "coordinator_selecting",
      expectedCoordinationMinutes: 18,
    });
    const fairA = await createHubQueueCase(harness, {
      name: "fair_a",
      priorityBand: "priority",
      dueMinute: 90,
      originPracticeOds: "PRA_A",
      state: "coordinator_selecting",
    });
    const fairB = await createHubQueueCase(harness, {
      name: "fair_b",
      priorityBand: "priority",
      dueMinute: 92,
      originPracticeOds: "PRA_B",
      state: "coordinator_selecting",
    });

    const result = await publishQueue(harness, [fairA, fairB, critical]);

    expect(result.rankEntries[0]?.taskRef).toBe(critical.current.hubCase.hubCoordinationCaseId);
    const criticalExplanation = result.riskExplanations.find(
      (entry) => entry.hubCoordinationCaseId === critical.current.hubCase.hubCoordinationCaseId,
    );
    expect(criticalExplanation?.riskBand).toBe(3);
    expect(criticalExplanation?.pBreach ?? 0).toBeGreaterThan(0.5);

    const replay = await harness.queueService.replayHubQueueOrder({
      rankSnapshotId: result.rankSnapshot.rankSnapshotId,
    });
    expect(replay.matchesStoredSnapshot).toBe(true);
    expect(replay.mismatchFields).toEqual([]);
  });

  it("applies fairness only within non-critical bands", async () => {
    const harness = await setupHubQueueHarness("319_unit_fairness");
    const a1 = await createHubQueueCase(harness, {
      name: "a1",
      priorityBand: "priority",
      dueMinute: 120,
      originPracticeOds: "PRA_A",
      state: "coordinator_selecting",
      expectedCoordinationMinutes: 30,
    });
    const a2 = await createHubQueueCase(harness, {
      name: "a2",
      priorityBand: "priority",
      dueMinute: 120,
      originPracticeOds: "PRA_A",
      state: "coordinator_selecting",
      expectedCoordinationMinutes: 30,
    });
    const b1 = await createHubQueueCase(harness, {
      name: "b1",
      priorityBand: "priority",
      dueMinute: 120,
      originPracticeOds: "PRA_B",
      state: "coordinator_selecting",
      expectedCoordinationMinutes: 15,
    });

    const result = await publishQueue(harness, [a1, a2, b1]);
    const firstTwo = result.rankEntries.slice(0, 2).map((entry) => entry.taskRef);

    expect(firstTwo).toContain(a1.current.hubCase.hubCoordinationCaseId);
    expect(firstTwo).toContain(b1.current.hubCase.hubCoordinationCaseId);
    expect(result.fairnessState).not.toBeNull();
    expect(result.rankSnapshot.overloadState).toBe("nominal");
  });
});
