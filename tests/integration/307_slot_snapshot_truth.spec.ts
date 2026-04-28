import { describe, expect, it } from "vitest";

import { buildSearchWindows, setupBookingCoreFlow } from "./307_booking_core.helpers.ts";

describe("307 slot snapshot truth", () => {
  it("keeps fresh complete snapshots renderable with exact page and day-bucket truth", async () => {
    const flow = await setupBookingCoreFlow({
      seed: "307_renderable",
      searchWindows: buildSearchWindows("307_renderable"),
      skipOfferSelection: true,
    });

    const current = await flow.slotSearchApplication.queryCurrentSlotSearch({
      bookingCaseId: `booking_case_${flow.seed}`,
    });
    const page = await flow.slotSearchApplication.fetchSlotSnapshotPage({
      slotSetSnapshotId: flow.slotSearch.slotSetSnapshot.slotSetSnapshotId,
      pageNumber: 1,
      requestedAt: "2026-04-22T12:12:00.000Z",
    });
    const dayBucket = await flow.slotSearchApplication.fetchSlotSnapshotDayBucket({
      slotSetSnapshotId: flow.slotSearch.slotSetSnapshot.slotSetSnapshotId,
      localDayKey: "2026-04-24",
      requestedAt: "2026-04-22T12:12:00.000Z",
    });

    expect(current?.slotSetSnapshot.slotSetSnapshotId).toBe(
      flow.slotSearch.slotSetSnapshot.slotSetSnapshotId,
    );
    expect(flow.slotSearch.slotSetSnapshot.coverageState).toBe("complete");
    expect(flow.slotSearch.recoveryState.viewState).toBe("renderable");
    expect(flow.slotSearch.slotSetSnapshot.candidateCount).toBe(2);
    expect(page.selectable).toBe(true);
    expect(page.slots).toHaveLength(2);
    expect(dayBucket.slots).toHaveLength(2);
  });

  it("keeps partial coverage explicit and fails closed to stale_refresh_required when invalidated", async () => {
    const flow = await setupBookingCoreFlow({
      seed: "307_partial",
      searchWindows: buildSearchWindows("307_partial", {
        coverageStateHint: "partial_coverage",
      }),
      skipOfferSelection: true,
    });

    expect(flow.slotSearch.slotSetSnapshot.coverageState).toBe("partial_coverage");
    expect(flow.slotSearch.recoveryState.viewState).toBe("partial_coverage");
    expect(flow.slotSearch.recoveryState.supportHelpVisible).toBe(true);

    const invalidated = await flow.slotSearchApplication.invalidateSlotSnapshot({
      slotSetSnapshotId: flow.slotSearch.slotSetSnapshot.slotSetSnapshotId,
      reasonCodes: ["operator_reset"],
      invalidatedAt: "2026-04-22T12:15:00.000Z",
    });
    const current = await flow.slotSearchApplication.queryCurrentSlotSearch({
      bookingCaseId: `booking_case_${flow.seed}`,
    });

    expect(invalidated.viewState).toBe("stale_refresh_required");
    expect(current).toBeNull();
  });

  it("distinguishes no-supply truth from support-fallback recovery", async () => {
    const noSupply = await setupBookingCoreFlow({
      seed: "307_no_supply",
      searchWindows: buildSearchWindows("307_no_supply", {
        empty: true,
      }),
      skipOfferSelection: true,
    });
    const fallback = await setupBookingCoreFlow({
      seed: "307_support_fallback",
      searchWindows: buildSearchWindows("307_support_fallback", {
        coverageStateHint: "failed",
        empty: true,
      }),
      skipOfferSelection: true,
    });

    expect(noSupply.slotSearch.slotSetSnapshot.candidateCount).toBe(0);
    expect(noSupply.slotSearch.recoveryState.viewState).toBe("no_supply_confirmed");
    expect(noSupply.slotSearch.recoveryState.sameShellActionRef).toBe(
      "booking_search_support_fallback",
    );

    expect(fallback.slotSearch.slotSetSnapshot.candidateCount).toBe(0);
    expect(fallback.slotSearch.slotSetSnapshot.coverageState).toBe("failed");
    expect(fallback.slotSearch.recoveryState.viewState).toBe("support_fallback");
    expect(fallback.slotSearch.recoveryState.sameShellActionRef).toBe(
      "booking_search_support_fallback",
    );
  });
});
