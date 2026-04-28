import { describe, expect, it } from "vitest";

import {
  createHubQueueCase,
  publishQueue,
  setupHubQueueHarness,
} from "../integration/319_hub_queue.helpers.ts";

function permutations<T>(values: readonly T[]): T[][] {
  if (values.length <= 1) {
    return [values.slice() as T[]];
  }
  const output: T[][] = [];
  for (let index = 0; index < values.length; index += 1) {
    const rest = values.slice(0, index).concat(values.slice(index + 1));
    for (const permutation of permutations(rest)) {
      output.push([values[index]!, ...permutation]);
    }
  }
  return output;
}

describe("319 hub queue ordering properties", () => {
  it("is permutation-stable for the same governed fact cut", async () => {
    const baselineHarness = await setupHubQueueHarness("319_property_baseline");
    const a = await createHubQueueCase(baselineHarness, {
      name: "a",
      dueMinute: 80,
      originPracticeOds: "PRA_PROP_A",
      state: "coordinator_selecting",
    });
    const b = await createHubQueueCase(baselineHarness, {
      name: "b",
      priorityBand: "urgent",
      dueMinute: 20,
      latestSafeOfferMinute: 12,
      originPracticeOds: "PRA_PROP_B",
      state: "coordinator_selecting",
    });
    const c = await createHubQueueCase(baselineHarness, {
      name: "c",
      dueMinute: 82,
      originPracticeOds: "PRA_PROP_C",
      state: "coordinator_selecting",
    });
    const baseline = await publishQueue(baselineHarness, [a, b, c]);
    const baselineById = new Map([
      [a.current.hubCase.hubCoordinationCaseId, "a"],
      [b.current.hubCase.hubCoordinationCaseId, "b"],
      [c.current.hubCase.hubCoordinationCaseId, "c"],
    ]);
    const expectedOrder = baseline.rankEntries.map((entry) => baselineById.get(entry.taskRef));

    for (const [index, order] of permutations(["a", "b", "c"] as const).entries()) {
      const harness = await setupHubQueueHarness(`319_property_${index}`);
      const cases = {
        a: await createHubQueueCase(harness, {
          name: "a",
          dueMinute: 80,
          originPracticeOds: "PRA_PROP_A",
          state: "coordinator_selecting",
        }),
        b: await createHubQueueCase(harness, {
          name: "b",
          priorityBand: "urgent",
          dueMinute: 20,
          latestSafeOfferMinute: 12,
          originPracticeOds: "PRA_PROP_B",
          state: "coordinator_selecting",
        }),
        c: await createHubQueueCase(harness, {
          name: "c",
          dueMinute: 82,
          originPracticeOds: "PRA_PROP_C",
          state: "coordinator_selecting",
        }),
      };
      const result = await publishQueue(
        harness,
        order.map((key) => cases[key]),
      );
      const byId = new Map([
        [cases.a.current.hubCase.hubCoordinationCaseId, "a"],
        [cases.b.current.hubCase.hubCoordinationCaseId, "b"],
        [cases.c.current.hubCase.hubCoordinationCaseId, "c"],
      ]);
      expect(result.rankEntries.map((entry) => byId.get(entry.taskRef))).toEqual(expectedOrder);
    }
  });
});
