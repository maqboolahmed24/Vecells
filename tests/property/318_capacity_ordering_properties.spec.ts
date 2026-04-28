import { describe, expect, it } from "vitest";

import {
  buildDefaultBindings,
  buildSnapshotCommand,
  setupNetworkCapacityHarness,
} from "../integration/318_network_capacity.helpers.ts";

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

describe("318 capacity ordering properties", () => {
  it("keeps ranked order and proof checksum stable for binding-order permutations", async () => {
    const harness = await setupNetworkCapacityHarness("318_property");
    const bindings = buildDefaultBindings("318_property");
    const permutations = permute(bindings).slice(0, 6);

    const orderedRefSignatures = new Set<string>();
    const proofChecksums = new Set<string>();

    for (const variant of permutations) {
      const result = await harness.service.buildCandidateSnapshotForCase({
        ...buildSnapshotCommand("318_property"),
        hubCoordinationCaseId: harness.claimed.hubCase.hubCoordinationCaseId,
        adapterBindings: variant,
      });

      orderedRefSignatures.add(JSON.stringify(result.decisionPlan?.orderedCandidateRefs ?? []));
      proofChecksums.add(result.rankProof?.proofChecksum ?? "missing");
    }

    expect(orderedRefSignatures.size).toBe(1);
    expect(proofChecksums.size).toBe(1);
  });
});
