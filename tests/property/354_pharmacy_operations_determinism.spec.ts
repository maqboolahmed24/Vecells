import { describe, expect, it } from "vitest";

import {
  create354OperationsHarness,
  seed354DispatchFailureCase,
  seed354WaitingOutcomeCase,
} from "../integration/354_pharmacy_operations.helpers.ts";

describe("354 pharmacy operations determinism", () => {
  it("keeps projection ids and versions stable across repeated refresh when upstream truth is unchanged", async () => {
    const harness = create354OperationsHarness();
    await seed354DispatchFailureCase({
      harness,
      seed: "354_determinism_failure",
    });
    await seed354WaitingOutcomeCase({
      harness,
      seed: "354_determinism_waiting_outcome",
    });

    const first = await harness.operationsService.refreshOperationsProjections({
      recordedAt: "2026-04-24T18:00:00.000Z",
    });
    const second = await harness.operationsService.refreshOperationsProjections({
      recordedAt: "2026-04-24T18:15:00.000Z",
    });

    expect(
      second.exceptions.map((row) => ({
        id: row.pharmacyDispatchExceptionProjectionId,
        version: row.version,
      })),
    ).toEqual(
      first.exceptions.map((row) => ({
        id: row.pharmacyDispatchExceptionProjectionId,
        version: row.version,
      })),
    );

    expect(
      second.providerHealth.map((row) => ({
        id: row.pharmacyProviderHealthProjectionId,
        version: row.version,
      })),
    ).toEqual(
      first.providerHealth.map((row) => ({
        id: row.pharmacyProviderHealthProjectionId,
        version: row.version,
      })),
    );
  });
});
