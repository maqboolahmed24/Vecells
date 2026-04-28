import { describe, expect, it } from "vitest";

import {
  create354OperationsHarness,
  seed354WaitingChoiceCase,
} from "./354_pharmacy_operations.helpers.ts";

describe("354 pharmacy operations scale probe", () => {
  it("materializes queue summaries for repeated waiting-choice cases without browser-side stitching", async () => {
    const harness = create354OperationsHarness();

    for (let index = 0; index < 10; index += 1) {
      await seed354WaitingChoiceCase({
        harness,
        seed: `354_scale_${index.toString().padStart(2, "0")}`,
      });
    }

    const summary =
      await harness.operationsService.queryService.fetchWaitingForChoiceWorklist({
        recordedAt: "2026-04-24T18:45:00.000Z",
      });

    expect(summary.rows.length).toBe(10);
    expect(summary.summary.totalCount).toBe(10);
    expect(summary.summary.ageing.oldestQueueAgeMinutes).toBeGreaterThan(0);
    expect(
      summary.rows.every((row) => row.visibleChoiceCount >= row.recommendedFrontierCount),
    ).toBe(true);
  });
});
