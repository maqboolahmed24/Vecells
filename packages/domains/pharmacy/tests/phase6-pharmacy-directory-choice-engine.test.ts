import { describe, expect, it } from "vitest";

import {
  create348DirectoryHarness,
  discover348ChoiceBundle,
  seed348EligibleCase,
} from "../../../../tests/integration/348_pharmacy_directory.helpers.ts";

describe("phase6 pharmacy directory choice engine", () => {
  it("builds a full visible choice set with manual warning and suppressed-unsafe summary", async () => {
    const harness = create348DirectoryHarness();
    const { evaluated } = await seed348EligibleCase(harness, "348_unit_frontier");

    const bundle = await discover348ChoiceBundle({
      harness,
      pharmacyCaseId: evaluated.caseMutation.pharmacyCase.pharmacyCaseId,
    });

    expect(bundle.directorySnapshot.sourceSnapshotRefs).toHaveLength(4);
    expect(bundle.choiceProof.visibleProviderRefs.map((ref) => ref.refId)).toEqual([
      "provider_A10001",
      "provider_A10002",
    ]);
    expect(bundle.choiceProof.warningVisibleProviderRefs.map((ref) => ref.refId)).toEqual([
      "provider_A10002",
    ]);
    expect(bundle.choiceProof.suppressedUnsafeProviderRefs.map((ref) => ref.refId)).toEqual([
      "provider_A10003",
    ]);
    expect(bundle.directorySnapshot.invalidHiddenProviderRefs.map((ref) => ref.refId)).toEqual([
      "provider_A10004",
    ]);
    expect(
      bundle.choiceProof.recommendedProviderRefs.every((recommended) =>
        bundle.choiceProof.visibleProviderRefs.some((visible) => visible.refId === recommended.refId),
      ),
    ).toBe(true);
  });

  it("replays the latest current bundle without rebuilding when the snapshot is still fresh", async () => {
    const harness = create348DirectoryHarness();
    const { evaluated } = await seed348EligibleCase(harness, "348_unit_replay");

    const first = await discover348ChoiceBundle({
      harness,
      pharmacyCaseId: evaluated.caseMutation.pharmacyCase.pharmacyCaseId,
      evaluatedAt: "2026-04-23T12:00:00.000Z",
    });
    const replayed = await discover348ChoiceBundle({
      harness,
      pharmacyCaseId: evaluated.caseMutation.pharmacyCase.pharmacyCaseId,
      evaluatedAt: "2026-04-23T12:20:00.000Z",
      refreshMode: "if_stale",
    });

    expect(replayed.replayed).toBe(true);
    expect(replayed.directorySnapshot.directorySnapshotId).toBe(
      first.directorySnapshot.directorySnapshotId,
    );
    expect(replayed.choiceSession.pharmacyChoiceSessionId).toBe(
      first.choiceSession.pharmacyChoiceSessionId,
    );
  });
});
