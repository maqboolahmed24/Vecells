import { describe, expect, it } from "vitest";
import {
  createReleasePublicationParityRecord,
  createRuntimePublicationBundle,
  createRuntimePublicationSimulationHarness,
  evaluateRuntimePublicationAuthority,
  validateReleasePublicationParityRecord,
  validateRuntimePublicationBundle,
} from "../src/runtime-publication.ts";

function createCurrentBundleTuple(bundle: ReturnType<typeof createRuntimePublicationBundle>) {
  return {
    runtimeTopologyManifestRef: bundle.runtimeTopologyManifestRef,
    workloadFamilyRefs: bundle.workloadFamilyRefs,
    trustZoneBoundaryRefs: bundle.trustZoneBoundaryRefs,
    gatewaySurfaceRefs: bundle.gatewaySurfaceRefs,
    routeContractDigestRefs: bundle.routeContractDigestRefs,
    frontendContractManifestRefs: bundle.frontendContractManifestRefs,
    frontendContractDigestRefs: bundle.frontendContractDigestRefs,
    designContractPublicationBundleRefs: bundle.designContractPublicationBundleRefs,
    designContractDigestRefs: bundle.designContractDigestRefs,
    designContractLintVerdictRefs: bundle.designContractLintVerdictRefs,
    projectionContractFamilyRefs: bundle.projectionContractFamilyRefs,
    projectionContractVersionRefs: bundle.projectionContractVersionRefs,
    projectionContractVersionSetRefs: bundle.projectionContractVersionSetRefs,
    projectionCompatibilityDigestRefs: bundle.projectionCompatibilityDigestRefs,
    projectionQueryContractDigestRefs: bundle.projectionQueryContractDigestRefs,
    mutationCommandContractDigestRefs: bundle.mutationCommandContractDigestRefs,
    liveUpdateChannelDigestRefs: bundle.liveUpdateChannelDigestRefs,
    clientCachePolicyDigestRefs: bundle.clientCachePolicyDigestRefs,
    releaseContractVerificationMatrixRef: bundle.releaseContractVerificationMatrixRef,
    releaseContractMatrixHash: bundle.releaseContractMatrixHash,
    commandSettlementSchemaSetRef: bundle.commandSettlementSchemaSetRef,
    transitionEnvelopeSchemaSetRef: bundle.transitionEnvelopeSchemaSetRef,
    recoveryDispositionSetRef: bundle.recoveryDispositionSetRef,
    routeFreezeDispositionRefs: bundle.routeFreezeDispositionRefs,
    continuityEvidenceContractRefs: bundle.continuityEvidenceContractRefs,
    surfacePublicationRefs: bundle.surfacePublicationRefs,
    surfaceRuntimeBindingRefs: bundle.surfaceRuntimeBindingRefs,
    buildProvenanceRef: bundle.buildProvenanceRef,
    provenanceVerificationState: bundle.provenanceVerificationState,
    provenanceConsumptionState: bundle.provenanceConsumptionState,
  };
}

function createCurrentParityTuple(parity: ReturnType<typeof createReleasePublicationParityRecord>) {
  return {
    releaseContractVerificationMatrixRef: parity.releaseContractVerificationMatrixRef,
    releaseContractMatrixHash: parity.releaseContractMatrixHash,
    routeContractDigestRefs: parity.routeContractDigestRefs,
    frontendContractDigestRefs: parity.frontendContractDigestRefs,
    projectionCompatibilityDigestRefs: parity.projectionCompatibilityDigestRefs,
    surfacePublicationRefs: parity.surfacePublicationRefs,
    surfaceRuntimeBindingRefs: parity.surfaceRuntimeBindingRefs,
    activeChannelFreezeRefs: parity.activeChannelFreezeRefs,
    recoveryDispositionRefs: parity.recoveryDispositionRefs,
    continuityEvidenceDigestRefs: parity.continuityEvidenceDigestRefs,
    provenanceVerificationState: parity.provenanceVerificationState,
    provenanceConsumptionState: parity.provenanceConsumptionState,
    bundleTupleHash: parity.bundleTupleHash,
    matrixGroupStates: parity.matrixGroupStates,
    driftReasonIds: parity.driftReasonIds,
    bindingCeilingReasons: parity.bindingCeilingReasons,
  };
}

describe("runtime publication authority", () => {
  it("builds a publishable simulation harness", () => {
    const harness = createRuntimePublicationSimulationHarness();
    expect(harness.bundle.publicationState).toBe("published");
    expect(harness.parityRecord.parityState).toBe("exact");
    expect(harness.verdict.publishable).toBe(true);
    expect(harness.verdict.routeExposureState).toBe("publishable");
  });

  it("fails closed when bundle members drift", () => {
    const harness = createRuntimePublicationSimulationHarness();
    const result = validateRuntimePublicationBundle({
      bundle: harness.bundle,
      current: {
        ...createCurrentBundleTuple(harness.bundle),
        gatewaySurfaceRefs: ["gws_patient_home", "gws_patient_messages"],
      },
    });
    expect(result.valid).toBe(false);
    expect(result.publicationState).toBe("stale");
    expect(result.refusalReasonRefs).toContain("DRIFT_GATEWAY_SURFACES");
  });

  it("fails closed when provenance is quarantined", () => {
    const bundle = createRuntimePublicationBundle({
      ...createRuntimePublicationSimulationHarness().bundle,
      provenanceVerificationState: "quarantined",
      provenanceConsumptionState: "quarantined",
    });
    const result = validateRuntimePublicationBundle({
      bundle,
      current: createCurrentBundleTuple(bundle),
    });
    expect(result.valid).toBe(false);
    expect(result.publicationState).toBe("conflict");
    expect(result.refusalReasonRefs).toContain("PROVENANCE_QUARANTINED");
  });

  it("blocks parity when matrix groups drift", () => {
    const harness = createRuntimePublicationSimulationHarness();
    const parity = createReleasePublicationParityRecord({
      ...harness.parityRecord,
      driftReasonIds: ["DRIFT_FRONTEND_CONTRACT_DIGESTS"],
      matrixGroupStates: {
        ...harness.parityRecord.matrixGroupStates,
        manifests: "stale",
      },
    });
    const bundleValidation = validateRuntimePublicationBundle({
      bundle: harness.bundle,
      current: createCurrentBundleTuple(harness.bundle),
    });
    const parityValidation = validateReleasePublicationParityRecord({
      parityRecord: parity,
      current: createCurrentParityTuple(parity),
      bundleValidation,
    });
    expect(parityValidation.valid).toBe(false);
    expect(parityValidation.parityState).toBe("stale");
    expect(parityValidation.routeExposureState).toBe("frozen");
  });

  it("propagates bundle refusal into the authority verdict", () => {
    const harness = createRuntimePublicationSimulationHarness();
    const verdict = evaluateRuntimePublicationAuthority({
      bundle: harness.bundle,
      currentBundle: {
        ...createCurrentBundleTuple(harness.bundle),
        clientCachePolicyDigestRefs: [],
      },
      parityRecord: harness.parityRecord,
      currentParity: createCurrentParityTuple(harness.parityRecord),
    });
    expect(verdict.publishable).toBe(false);
    expect(verdict.refusalReasonRefs).toContain("MISSING_CLIENT_CACHE_POLICY_DIGEST");
  });
});
