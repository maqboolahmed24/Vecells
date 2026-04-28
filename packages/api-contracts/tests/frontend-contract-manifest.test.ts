import { describe, expect, it } from "vitest";
import {
  createFrontendContractManifestStore,
  deriveDesignContractDigest,
  deriveFrontendContractDigest,
  frontendContractManifestExamples,
  frontendManifestValidationExamples,
  validateFrontendContractManifest,
} from "../src/index.ts";

describe("frontend contract manifest runtime", () => {
  it("derives stable digests from sorted authority tuples", () => {
    const manifest = frontendContractManifestExamples[0];
    const shuffled = {
      ...manifest,
      routeFamilyRefs: [...manifest.routeFamilyRefs].reverse(),
      gatewaySurfaceRefs: [...manifest.gatewaySurfaceRefs].reverse(),
      projectionQueryContractDigestRefs: [...manifest.projectionQueryContractDigestRefs].reverse(),
      mutationCommandContractDigestRefs: [
        ...manifest.mutationCommandContractDigestRefs,
      ].reverse(),
      liveUpdateChannelDigestRefs: [...manifest.liveUpdateChannelDigestRefs].reverse(),
      clientCachePolicyDigestRefs: [...manifest.clientCachePolicyDigestRefs].reverse(),
      profileSelectionResolutionRefs: [...manifest.profileSelectionResolutionRefs].reverse(),
      surfaceStateKernelBindingRefs: [...manifest.surfaceStateKernelBindingRefs].reverse(),
      accessibilitySemanticCoverageProfileRefs: [
        ...manifest.accessibilitySemanticCoverageProfileRefs,
      ].reverse(),
      automationAnchorProfileRefs: [...manifest.automationAnchorProfileRefs].reverse(),
      surfaceStateSemanticsProfileRefs: [...manifest.surfaceStateSemanticsProfileRefs].reverse(),
    };

    expect(deriveFrontendContractDigest(shuffled)).toBe(manifest.frontendContractDigestRef);
    expect(deriveDesignContractDigest(shuffled)).toBe(manifest.designContractDigestRef);
  });

  it("keeps the live manifest publishable", () => {
    const scenario = frontendManifestValidationExamples[0];
    const verdict = validateFrontendContractManifest(scenario.manifest, {
      routeFamilyRef: "rf_patient_home",
      expectPublishableLive: true,
    });

    expect(verdict.validationState).toBe("valid");
    expect(verdict.safeToConsume).toBe(true);
    expect(verdict.effectiveBrowserPosture).toBe("publishable_live");
    expect(verdict.issueCodes).toEqual([]);
  });

  it("demotes runtime and accessibility drift to recovery_only", () => {
    const scenario = frontendManifestValidationExamples[2];
    const verdict = validateFrontendContractManifest(scenario.manifest, {
      routeFamilyRef: "rf_support_replay_observe",
    });

    expect(verdict.validationState).toBe("degraded");
    expect(verdict.safeToConsume).toBe(true);
    expect(verdict.effectiveBrowserPosture).toBe("recovery_only");
    expect(verdict.issueCodes).toContain("runtime_binding_stale");
    expect(verdict.issueCodes).toContain("accessibility_coverage_degraded");
  });

  it("rejects digest drift and blocked runtime tuples", () => {
    const digestMismatch = validateFrontendContractManifest(
      frontendManifestValidationExamples[4].manifest,
      { routeFamilyRef: "rf_patient_home" },
    );
    const blocked = validateFrontendContractManifest(frontendManifestValidationExamples[3].manifest, {
      routeFamilyRef: "rf_governance_shell",
    });

    expect(digestMismatch.validationState).toBe("rejected");
    expect(digestMismatch.safeToConsume).toBe(false);
    expect(digestMismatch.issueCodes).toContain("frontend_contract_digest_drift");

    expect(blocked.validationState).toBe("rejected");
    expect(blocked.safeToConsume).toBe(false);
    expect(blocked.effectiveBrowserPosture).toBe("blocked");
    expect(blocked.issueCodes).toContain("runtime_publication_withdrawn");
  });

  it("lets routes consume only validated manifests", () => {
    const store = createFrontendContractManifestStore(frontendContractManifestExamples);

    expect(store.consumeRoute("rf_patient_requests").verdict.safeToConsume).toBe(true);
    expect(() => store.consumeRoute("rf_governance_shell")).toThrow(
      /FRONTEND_MANIFEST_REJECTED/,
    );
    expect(store.findManifestForRoute("rf_nonexistent")).toBeNull();
  });
});
