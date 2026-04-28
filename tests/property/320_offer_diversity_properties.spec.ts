import { describe, expect, it } from "vitest";

import { solveAlternativeOfferSet } from "../../packages/domains/hub_coordination/src/phase5-alternative-offer-engine.ts";
import {
  atMinute,
  setupAlternativeOfferHarness,
} from "../integration/320_alternative_offer.helpers.ts";

function permute<T>(items: readonly T[]): readonly T[][] {
  if (items.length <= 1) {
    return [items.slice()];
  }
  const results: T[][] = [];
  items.forEach((item, index) => {
    const remaining = [...items.slice(0, index), ...items.slice(index + 1)];
    for (const permutation of permute(remaining)) {
      results.push([item, ...permutation]);
    }
  });
  return results;
}

describe("320 offer diversity properties", () => {
  it("keeps the visible offer set stable across candidate-order permutations", async () => {
    const harness = await setupAlternativeOfferHarness("320_property");
    const candidates = (
      await harness.repositories.listCandidatesForSnapshot(harness.snapshotResult.snapshotId)
    ).map((row) => row.toSnapshot());
    const permutations = permute(candidates).slice(0, 6);
    const visibleSignatures = new Set<string>();
    const hashSignatures = new Set<string>();

    for (const variant of permutations) {
      const solved = solveAlternativeOfferSet({
        hubCoordinationCaseId: harness.candidatesReady.hubCase.hubCoordinationCaseId,
        candidateSnapshot: harness.snapshotResult.snapshot!,
        decisionPlan: harness.snapshotResult.decisionPlan!,
        rankProof: harness.snapshotResult.rankProof!,
        candidates: variant,
        generatedAt: atMinute(12),
      });
      visibleSignatures.add(JSON.stringify(solved.visibleCandidates.map((candidate) => candidate.candidateId)));
      hashSignatures.add(solved.offerSetHash);
      expect(new Set(solved.visibleCandidates.map((candidate) => candidate.capacityUnitRef)).size).toBe(
        solved.visibleCandidates.length,
      );
    }

    expect(visibleSignatures.size).toBe(1);
    expect(hashSignatures.size).toBe(1);
  });
});
