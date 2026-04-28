import { describe, expect, it } from "vitest";

import {
  create348DirectoryHarness,
  seed348EligibleCase,
} from "../integration/348_pharmacy_directory.helpers.ts";
import {
  createPhase6PharmacyDirectoryChoiceEngineService,
  createStaticPharmacyDiscoveryAdapter,
} from "../../packages/domains/pharmacy/src/index.ts";
import directoryFixtures from "../../data/fixtures/348_directory_source_examples.json";

const fixture = directoryFixtures as {
  baseLocation: { postcodeDistrict: string };
  baseScenario: Record<
    string,
    {
      version: string;
      sourceLabel: string;
      sourceTrustClass:
        | "authoritative"
        | "strategic"
        | "legacy"
        | "manual_override";
      capturedAt: string;
      providers: Parameters<typeof createStaticPharmacyDiscoveryAdapter>[0]["providers"];
    }
  >;
};

describe("348 provider ranking and choice stability", () => {
  it("keeps the visible ordering stable across adapter registration order", async () => {
    const harnessA = create348DirectoryHarness();
    const { evaluated: evaluatedA } = await seed348EligibleCase(harnessA, "348_prop_a");
    const bundleA = await harnessA.directoryService.discoverProvidersForCase({
      pharmacyCaseId: evaluatedA.caseMutation.pharmacyCase.pharmacyCaseId,
      location: fixture.baseLocation,
      audience: "patient",
      refreshMode: "force_refresh",
      evaluatedAt: "2026-04-23T12:00:00.000Z",
    });

    const harnessB = create348DirectoryHarness();
    const { evaluated: evaluatedB } = await seed348EligibleCase(harnessB, "348_prop_b");
    const reversedAdapters = Object.entries(fixture.baseScenario)
      .reverse()
      .map(([mode, value]) =>
        createStaticPharmacyDiscoveryAdapter({
          mode: mode as
            | "dohs_service_search"
            | "eps_dos_legacy"
            | "local_registry_override"
            | "manual_directory_snapshot",
          version: value.version,
          sourceLabel: value.sourceLabel,
          sourceTrustClass: value.sourceTrustClass,
          capturedAt: value.capturedAt,
          providers: value.providers,
        }),
      );
    const reorderedService = createPhase6PharmacyDirectoryChoiceEngineService({
      repositories: harnessB.repositories,
      caseKernelService: harnessB.caseKernelService,
      eligibilityRepositories: harnessB.eligibilityRepositories,
      adapters: reversedAdapters,
    });
    const bundleB = await reorderedService.discoverProvidersForCase({
      pharmacyCaseId: evaluatedB.caseMutation.pharmacyCase.pharmacyCaseId,
      location: fixture.baseLocation,
      audience: "patient",
      refreshMode: "force_refresh",
      evaluatedAt: "2026-04-23T12:00:00.000Z",
    });

    expect(bundleA.choiceProof.visibleProviderRefs.map((ref) => ref.refId)).toEqual(
      bundleB.choiceProof.visibleProviderRefs.map((ref) => ref.refId),
    );
    expect(bundleA.choiceProof.recommendedProviderRefs.map((ref) => ref.refId)).toEqual(
      bundleB.choiceProof.recommendedProviderRefs.map((ref) => ref.refId),
    );
    expect(bundleA.choiceProof.visibleChoiceSetHash).toBe(bundleB.choiceProof.visibleChoiceSetHash);
  });
});
