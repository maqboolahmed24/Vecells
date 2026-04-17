import { describe, expect, it } from "vitest";
import {
  apiContractRegistryPayload,
  createApiContractRegistryStore,
} from "../src/api-contract-registry.ts";

describe("api contract registry", () => {
  it("returns the authoritative route-family bundle", () => {
    const registry = createApiContractRegistryStore();
    const bundle = registry.lookupByRouteFamilyRef("rf_patient_requests");

    expect(bundle).toBeDefined();
    expect(bundle?.projectionQueryContractRef).toBe("PQC_050_RF_PATIENT_REQUESTS_V1");
    expect(bundle?.mutationCommandContractRef).toBe("MCC_050_RF_PATIENT_REQUESTS_V1");
    expect(bundle?.liveUpdateChannelContractRef).toBe("LCC_050_RF_PATIENT_REQUESTS_V1");
    expect(bundle?.clientCachePolicyRefs).toContain("CP_PATIENT_ROUTE_INTENT_PRIVATE");
  });

  it("supports deterministic digest lookup", () => {
    const registry = createApiContractRegistryStore();
    const rawDigest = "938aa4fecf715a10";
    const prefixedDigest = `projection-query-digest::${rawDigest}`;

    const rawLookup = registry.lookupByContractDigestRef(rawDigest);
    const prefixedLookup = registry.lookupByContractDigestRef(prefixedDigest);

    expect(rawLookup?.digest.registryDigestRef).toBe(prefixedDigest);
    expect(prefixedLookup?.digest.contractRef).toBe("PQC_050_RF_PATIENT_REQUESTS_V1");
    expect(prefixedLookup?.routeFamilyBundles[0]?.routeFamilyRef).toBe("rf_patient_requests");
  });

  it("filters contracts by audience surface and validation state", () => {
    const registry = createApiContractRegistryStore();
    const governanceWarnings = registry.listContracts({
      audienceSurface: "audsurf_governance_admin",
      contractFamily: "MutationCommandContract",
      validationState: "warning",
    });

    expect(governanceWarnings).toHaveLength(1);
    expect(governanceWarnings[0]).toMatchObject({
      mutationCommandContractId: "MCC_050_RF_GOVERNANCE_SHELL_V1",
      routeIntentCoverageState: "parallel_gap_stubbed",
    });
  });

  it("rejects missing route-family bundles", () => {
    const mutated = {
      ...apiContractRegistryPayload,
      summary: {
        ...apiContractRegistryPayload.summary,
        route_family_bundle_count: apiContractRegistryPayload.summary.route_family_bundle_count - 1,
      },
      routeFamilyBundles: apiContractRegistryPayload.routeFamilyBundles.slice(1),
    };

    expect(() => createApiContractRegistryStore(mutated)).toThrow(
      "API_CONTRACT_REGISTRY_MANIFEST_ROUTE_COUNT_DRIFT",
    );
  });

  it("rejects digest collisions", () => {
    const [firstDigest] = apiContractRegistryPayload.contractDigestIndex;
    const duplicated = {
      ...apiContractRegistryPayload,
      contractDigestIndex: [
        firstDigest,
        { ...firstDigest, contractRef: "duplicate-ref" },
        ...apiContractRegistryPayload.contractDigestIndex.slice(1),
      ],
    };

    expect(() => createApiContractRegistryStore(duplicated)).toThrow(
      "API_CONTRACT_REGISTRY_DIGEST_COLLISION",
    );
  });
});
