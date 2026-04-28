import { describe, expect, it } from "vitest";

import {
  create355ConsoleHarness,
  create355FenceForSelectedCandidate,
  mutate355InventoryRecord,
  seed355PackageReadyCase,
} from "./355_pharmacy_console.helpers.ts";

describe("355 inventory fence and drift", () => {
  it("creates fences idempotently and invalidates them on material stock drift", async () => {
    const harness = create355ConsoleHarness();
    const seeded = await seed355PackageReadyCase({
      harness,
      seed: "355_fence",
      freshnessState: "fresh",
      communicationPreviewed: true,
    });

    const firstFence = await create355FenceForSelectedCandidate({
      harness,
      pharmacyCaseId: seeded.pharmacyCaseId,
      lineItemRef: seeded.lineItemRef,
      candidateRef: seeded.exactCandidateRef,
      recordedAt: "2026-04-24T09:10:00.000Z",
    });
    const replayFence = await create355FenceForSelectedCandidate({
      harness,
      pharmacyCaseId: seeded.pharmacyCaseId,
      lineItemRef: seeded.lineItemRef,
      candidateRef: seeded.exactCandidateRef,
      recordedAt: "2026-04-24T09:11:00.000Z",
    });

    expect(replayFence.inventoryComparisonFenceId).toBe(firstFence.inventoryComparisonFenceId);
    expect(replayFence.fenceEpoch).toBe(firstFence.fenceEpoch);

    await mutate355InventoryRecord({
      harness,
      inventorySupportRecordId: seeded.exactRecord.inventorySupportRecordId,
      patch: {
        availableQuantity: 0,
        reservedQuantity: 0,
      },
    });

    const refreshed = await harness.consoleService.refreshInventoryComparisonFence({
      pharmacyCaseId: seeded.pharmacyCaseId,
      lineItemRef: seeded.lineItemRef,
      recordedAt: "2026-04-24T09:12:00.000Z",
    });
    expect(refreshed?.fenceState).toBe("invalidated");
    expect(refreshed?.invalidatedReasonCode).toBe("AVAILABILITY_DRIFT");

    const comparison = await harness.consoleService.fetchInventoryComparisonProjection(
      seeded.pharmacyCaseId,
      seeded.lineItemRef,
      { recordedAt: "2026-04-24T09:12:00.000Z" },
    );
    expect(comparison?.activeFenceRef).toBeNull();
    expect(comparison?.preservedReadOnlyFenceRef?.refId).toBe(firstFence.inventoryComparisonFenceId);

    const handoff = await harness.consoleService.fetchHandoffProjection(seeded.pharmacyCaseId, {
      recordedAt: "2026-04-24T09:12:00.000Z",
    });
    expect(handoff?.handoffReadinessState).not.toBe("verified");
  });
});
