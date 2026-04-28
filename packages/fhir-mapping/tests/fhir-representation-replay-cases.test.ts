import fs from "node:fs";
import { describe, expect, it } from "vitest";
import {
  createFhirRepresentationCompiler,
  createFhirRepresentationStore,
  fhirExchangeBundlePolicies,
  fhirIdentifierPolicies,
  fhirRepresentationContracts,
  fhirStatusMappingPolicies,
  type FhirExchangeBundlePolicy,
  type FhirRepresentationContractSnapshot,
} from "../src/index.ts";

const replayCases = JSON.parse(
  fs.readFileSync(
    new URL("../../../data/test/fhir_representation_replay_cases.json", import.meta.url),
    "utf8",
  ),
);

function createCompilerRuntime(options?: {
  contracts?: readonly FhirRepresentationContractSnapshot[];
  bundlePolicies?: readonly FhirExchangeBundlePolicy[];
}) {
  const store = createFhirRepresentationStore({
    contracts: options?.contracts ?? fhirRepresentationContracts,
    bundlePolicies: options?.bundlePolicies ?? fhirExchangeBundlePolicies,
    identifierPolicies: fhirIdentifierPolicies,
    statusPolicies: fhirStatusMappingPolicies,
  });

  return {
    store,
    compiler: createFhirRepresentationCompiler(store),
  };
}

describe("seq_133 FHIR representation replay cases", () => {
  it("replays the same aggregate version deterministically for every stable replay case", async () => {
    const stableCases = replayCases.filter(
      (row: { expectedOutcome: string }) => row.expectedOutcome === "stable_replay",
    );
    expect(stableCases.length).toBeGreaterThan(1);

    for (const replayCase of stableCases) {
      const { compiler } = createCompilerRuntime();
      const first = await compiler.materializeRepresentationSet({
        representationContractRef: replayCase.representationContractRef,
        generatedAt: replayCase.generatedAt,
        bundlePolicyRef: replayCase.bundlePolicyRef,
        adapterContractProfileRef: replayCase.adapterContractProfileRef,
        aggregate: replayCase.aggregate,
      });
      const replay = await compiler.materializeRepresentationSet({
        representationContractRef: replayCase.representationContractRef,
        generatedAt: replayCase.replayGeneratedAt,
        bundlePolicyRef: replayCase.bundlePolicyRef,
        adapterContractProfileRef: replayCase.adapterContractProfileRef,
        aggregate: replayCase.aggregate,
      });

      expect(replay.replayed, replayCase.caseId).toBe(true);
      expect(replay.representationSet.fhirRepresentationSetId, replayCase.caseId).toBe(
        first.representationSet.fhirRepresentationSetId,
      );
      expect(
        replay.resourceRecords.map((record) => `${record.logicalId}:${record.versionId}`),
        replayCase.caseId,
      ).toEqual(first.resourceRecords.map((record) => `${record.logicalId}:${record.versionId}`));
      expect(replay.exchangeBundle?.toSnapshot().transportPayloadHash, replayCase.caseId).toBe(
        first.exchangeBundle?.toSnapshot().transportPayloadHash,
      );
    }
  });

  it("supersedes prior emitted sets append-only when the aggregate version changes", async () => {
    const supersessionCase = replayCases.find(
      (row: { expectedOutcome: string }) => row.expectedOutcome === "supersedes_append_only",
    );
    expect(supersessionCase).toBeTruthy();

    const { compiler, store } = createCompilerRuntime();
    const first = await compiler.materializeRepresentationSet({
      representationContractRef: supersessionCase.representationContractRef,
      generatedAt: supersessionCase.generatedAt,
      bundlePolicyRef: supersessionCase.bundlePolicyRef,
      adapterContractProfileRef: supersessionCase.adapterContractProfileRef,
      aggregate: supersessionCase.aggregate,
    });
    const second = await compiler.materializeRepresentationSet({
      representationContractRef: supersessionCase.representationContractRef,
      generatedAt: supersessionCase.nextGeneratedAt,
      bundlePolicyRef: supersessionCase.bundlePolicyRef,
      adapterContractProfileRef: supersessionCase.adapterContractProfileRef,
      aggregate: supersessionCase.nextAggregate,
    });

    const supersededFirst = await store.getRepresentationSet(first.representationSet.fhirRepresentationSetId);
    expect(supersededFirst?.toSnapshot().representationState).toBe("superseded");
    expect(supersededFirst?.toSnapshot().supersededByRepresentationSetRef).toBe(
      second.representationSet.fhirRepresentationSetId,
    );
    expect(second.representationSet.toSnapshot().supersedesRepresentationSetRef).toBe(
      first.representationSet.fhirRepresentationSetId,
    );
  });
});
