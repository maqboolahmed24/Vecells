import { describe, expect, it } from "vitest";

import {
  create355ConsoleHarness,
  seed355PackageReadyCase,
} from "../integration/355_pharmacy_console.helpers.ts";

describe("355 inventory freshness and fence properties", () => {
  it("keeps freshness ordering monotone from fresh to stale to unavailable", async () => {
    const harness = create355ConsoleHarness();
    const fresh = await seed355PackageReadyCase({
      harness,
      seed: "355_prop_fresh",
      freshnessState: "fresh",
    });
    const aging = await seed355PackageReadyCase({
      harness,
      seed: "355_prop_aging",
      freshnessState: "aging",
    });
    const stale = await seed355PackageReadyCase({
      harness,
      seed: "355_prop_stale",
      freshnessState: "stale",
    });
    const unavailable = await seed355PackageReadyCase({
      harness,
      seed: "355_prop_unavailable",
      freshnessState: "unavailable",
    });

    const truthStates = await Promise.all([
      harness.consoleService.fetchInventoryTruthProjection(fresh.pharmacyCaseId, fresh.lineItemRef, {
        recordedAt: fresh.recordedAt,
      }),
      harness.consoleService.fetchInventoryTruthProjection(aging.pharmacyCaseId, aging.lineItemRef, {
        recordedAt: aging.recordedAt,
      }),
      harness.consoleService.fetchInventoryTruthProjection(stale.pharmacyCaseId, stale.lineItemRef, {
        recordedAt: stale.recordedAt,
      }),
      harness.consoleService.fetchInventoryTruthProjection(
        unavailable.pharmacyCaseId,
        unavailable.lineItemRef,
        { recordedAt: unavailable.recordedAt },
      ),
    ]);

    expect(truthStates.map((state) => state?.dominantFreshnessState)).toEqual([
      "fresh",
      "aging",
      "stale",
      "unavailable",
    ]);
  });

  it("never exposes a commit-ready exact candidate when freshness is stale or unavailable", async () => {
    const harness = create355ConsoleHarness();
    for (const freshnessState of ["stale", "unavailable"] as const) {
      const seeded = await seed355PackageReadyCase({
        harness,
        seed: `355_prop_block_${freshnessState}`,
        freshnessState,
      });
      const comparison = await harness.consoleService.fetchInventoryComparisonProjection(
        seeded.pharmacyCaseId,
        seeded.lineItemRef,
        { recordedAt: seeded.recordedAt },
      );
      const exactCandidate = comparison?.candidateRows.find(
        (row) => row.candidateRef === seeded.exactCandidateRef,
      );
      expect(exactCandidate?.commitReady).toBe(false);
      expect(exactCandidate?.blockingReasonCodes).toContain("INVENTORY_FRESHNESS_BLOCKED");
    }
  });
});
