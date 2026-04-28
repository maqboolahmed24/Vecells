import { describe, expect, it } from "vitest";

import {
  create355ConsoleHarness,
  create355FenceForSelectedCandidate,
  seed355PackageReadyCase,
} from "./355_pharmacy_console.helpers.ts";

describe("355 pharmacy console summary and handoff", () => {
  it("keeps package-ready work in inventory support until a valid fence exists, then verifies handoff", async () => {
    const harness = create355ConsoleHarness();
    const seeded = await seed355PackageReadyCase({
      harness,
      seed: "355_summary",
      freshnessState: "fresh",
      communicationPreviewed: true,
    });

    const initialWorkbench = await harness.consoleService.fetchCaseWorkbenchProjection(
      seeded.pharmacyCaseId,
      { recordedAt: seeded.recordedAt },
    );
    expect(initialWorkbench).not.toBeNull();

    const initialMission = await harness.consoleService.fetchMissionProjection(seeded.pharmacyCaseId, {
      recordedAt: seeded.recordedAt,
    });
    expect(initialMission?.dominantPromotedRegion).toBe("inventory_support");

    const initialHandoff = await harness.consoleService.fetchHandoffProjection(seeded.pharmacyCaseId, {
      recordedAt: seeded.recordedAt,
    });
    expect(initialHandoff?.handoffReadinessState).toBe("review_required");
    expect(initialHandoff?.blockingReasonCodes).toContain("LINE_VERIFICATION_INCOMPLETE");

    await create355FenceForSelectedCandidate({
      harness,
      pharmacyCaseId: seeded.pharmacyCaseId,
      lineItemRef: seeded.lineItemRef,
      candidateRef: seeded.exactCandidateRef,
      recordedAt: "2026-04-24T09:05:00.000Z",
    });

    const refreshedHandoff = await harness.consoleService.fetchHandoffProjection(
      seeded.pharmacyCaseId,
      { recordedAt: "2026-04-24T09:06:00.000Z" },
    );
    expect(refreshedHandoff?.handoffReadinessState).toBe("verified");
    expect(refreshedHandoff?.blockingReasonCodes).toEqual([]);

    const summary = await harness.consoleService.fetchConsoleSummaryProjection(seeded.pharmacyCaseId, {
      recordedAt: "2026-04-24T09:06:00.000Z",
    });
    expect(summary?.verifiedLineCount).toBe(1);
    expect(summary?.activeFenceCount).toBe(1);
    expect(summary?.handoffReadinessState).toBe("verified");

    const worklist = await harness.consoleService.fetchConsoleWorklist({
      recordedAt: "2026-04-24T09:06:00.000Z",
      handoffReadinessState: "verified",
    });
    expect(worklist.map((row) => row.pharmacyCaseRef.refId)).toContain(seeded.pharmacyCaseId);
  });

  it("fails closed when inventory freshness is stale", async () => {
    const harness = create355ConsoleHarness();
    const seeded = await seed355PackageReadyCase({
      harness,
      seed: "355_stale",
      freshnessState: "stale",
      communicationPreviewed: true,
    });

    const truth = await harness.consoleService.fetchInventoryTruthProjection(
      seeded.pharmacyCaseId,
      seeded.lineItemRef,
      { recordedAt: seeded.recordedAt },
    );
    expect(truth?.dominantFreshnessState).toBe("stale");
    expect(truth?.hardStopReached).toBe(true);

    const comparison = await harness.consoleService.fetchInventoryComparisonProjection(
      seeded.pharmacyCaseId,
      seeded.lineItemRef,
      { recordedAt: seeded.recordedAt },
    );
    expect(comparison?.dominantCompareState).toBe("blocked");
    expect(comparison?.candidateRows[0]?.blockingReasonCodes).toContain(
      "INVENTORY_FRESHNESS_BLOCKED",
    );

    const handoff = await harness.consoleService.fetchHandoffProjection(seeded.pharmacyCaseId, {
      recordedAt: seeded.recordedAt,
    });
    expect(handoff?.handoffReadinessState).toBe("not_ready");
    expect(handoff?.blockingReasonCodes).toContain("INVENTORY_FRESHNESS_BLOCKED");
  });
});
