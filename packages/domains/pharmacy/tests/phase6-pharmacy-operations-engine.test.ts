import { describe, expect, it } from "vitest";

import {
  create354OperationsHarness,
  seed354DispatchFailureCase,
} from "../../../../tests/integration/354_pharmacy_operations.helpers.ts";

describe("phase6 pharmacy operations engine", () => {
  it("elevates provider health when dispatch truth moves into transport rejection", async () => {
    const harness = create354OperationsHarness();
    const failed = await seed354DispatchFailureCase({
      harness,
      seed: "354_unit_provider_health",
    });

    const summary = await harness.operationsService.queryService.fetchProviderHealthSummary({
      recordedAt: "2026-04-23T15:00:00.000Z",
    });

    const providerRow = summary.rows.find(
      (row) => row.providerKey === "A10001",
    );
    expect(providerRow).toBeDefined();
    expect(providerRow?.severity).toBe("critical");
    expect(providerRow?.dispatchFailureCount).toBe(1);
    expect(providerRow?.dispatchHealthState).toBe("failing");

    const history = await harness.operationsRepositories.listOperationsAuditEventsForProvider(
      "A10001",
    );
    expect(history.length).toBeGreaterThan(0);
    expect(
      history.some(
        (entry) =>
          entry.toSnapshot().projectionFamily === "pharmacy_provider_health_projection",
      ),
    ).toBe(true);

    const exceptionRows =
      await harness.operationsService.queryService.fetchDispatchExceptionWorklist({
        recordedAt: "2026-04-23T15:00:00.000Z",
      });
    expect(
      exceptionRows.rows.some(
        (row) =>
          row.pharmacyCaseRef.refId === failed.pharmacyCaseId &&
          row.activeExceptionClasses.includes("dispatch_failed"),
      ),
    ).toBe(true);
  });
});
