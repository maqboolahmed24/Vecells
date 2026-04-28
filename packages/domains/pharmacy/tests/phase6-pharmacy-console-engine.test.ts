import { describe, expect, it } from "vitest";

import {
  createPhase6PharmacyConsoleBackendService,
  createPhase6PharmacyConsoleStore,
} from "../src/index.ts";

describe("phase6 pharmacy console engine", () => {
  it("boots an empty console backend surface", async () => {
    const repositories = createPhase6PharmacyConsoleStore();
    const service = createPhase6PharmacyConsoleBackendService({
      repositories,
    });

    await expect(service.fetchConsoleWorklist()).resolves.toEqual([]);
    await expect(
      service.invalidateInventoryComparisonFence({
        inventoryComparisonFenceId: "missing_fence",
        reasonCode: "test",
      }),
    ).resolves.toBeNull();
  });
});
