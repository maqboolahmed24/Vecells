import { describe, expect, it } from "vitest";

import {
  create354OperationsHarness,
  force354DiscoveryUnavailable,
  seed354DispatchFailureCase,
  seed354WaitingChoiceCase,
} from "./354_pharmacy_operations.helpers.ts";

describe("354 provider health and changed-since-seen deltas", () => {
  it("returns deterministic row-version deltas for provider health and queue worklists", async () => {
    const harness = create354OperationsHarness();
    await seed354DispatchFailureCase({
      harness,
      seed: "354_provider_failure",
    });
    const waitingChoice = await seed354WaitingChoiceCase({
      harness,
      seed: "354_provider_directory",
    });

    const initialSummary =
      await harness.operationsService.queryService.fetchProviderHealthSummary({
        recordedAt: "2026-04-24T18:00:00.000Z",
      });
    const seenRows = initialSummary.rows.map((row) => ({
      projectionId: row.pharmacyProviderHealthProjectionId,
      version: row.version,
    }));

    const unchangedDelta =
      await harness.operationsService.queryService.fetchChangedSinceSeenDeltas({
        recordedAt: "2026-04-24T18:00:00.000Z",
        worklistFamily: "pharmacy_provider_health_projection",
        seenRows,
      });
    expect(unchangedDelta.addedCount).toBe(0);
    expect(unchangedDelta.changedCount).toBe(0);
    expect(unchangedDelta.removedCount).toBe(0);

    await force354DiscoveryUnavailable({
      harness,
      pharmacyCaseId: waitingChoice.pharmacyCaseId,
    });

    const changedDelta =
      await harness.operationsService.queryService.fetchChangedSinceSeenDeltas({
        recordedAt: "2026-04-24T19:00:00.000Z",
        worklistFamily: "pharmacy_provider_health_projection",
        seenRows,
      });
    expect(changedDelta.changedCount + changedDelta.addedCount).toBeGreaterThan(0);

    const providerDetail =
      await harness.operationsService.queryService.fetchProviderHealthDetail("A10001", {
        recordedAt: "2026-04-24T19:00:00.000Z",
      });
    expect(providerDetail).not.toBeNull();
    expect(providerDetail?.projection.activeCaseCount).toBeGreaterThan(0);
    expect(providerDetail?.historySummary.length).toBeGreaterThan(0);
  });
});
