import fs from "node:fs";
import path from "node:path";
import {
  evaluateRuntimePublicationAuthority,
  type ReleasePublicationParityRecordContract,
  type ReleasePublicationParityTuple,
  type RuntimePublicationBundleContract,
  type RuntimePublicationBundleTuple,
} from "../../packages/release-controls/src/runtime-publication.ts";

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");

export interface CliArgs {
  [key: string]: string;
}

export interface PublicationArtifacts {
  bundle: RuntimePublicationBundleContract;
  parity: ReleasePublicationParityRecordContract;
}

export function parseArgs(argv: readonly string[]): CliArgs {
  const args: CliArgs = {};
  for (let index = 2; index < argv.length; index += 2) {
    const key = argv[index];
    if (!key) continue;
    args[key] = argv[index + 1] ?? "true";
  }
  return args;
}

export function readJson<TValue>(filePath: string): TValue {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as TValue;
}

export function writeJson(filePath: string, payload: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

export function loadPublicationArtifacts(environmentRing: string): PublicationArtifacts {
  const bundleCatalog = readJson<{
    runtimePublicationBundles: RuntimePublicationBundleContract[];
  }>(path.join(ROOT, "data", "analysis", "runtime_publication_bundles.json"));
  const parityCatalog = readJson<{
    releasePublicationParityRecords: ReleasePublicationParityRecordContract[];
  }>(path.join(ROOT, "data", "analysis", "release_publication_parity_records.json"));
  const bundle = bundleCatalog.runtimePublicationBundles.find(
    (row) => row.environmentRing === environmentRing,
  );
  if (!bundle) {
    throw new Error(`No runtime publication bundle found for ${environmentRing}.`);
  }
  const parity = parityCatalog.releasePublicationParityRecords.find(
    (row) => row.environmentRing === environmentRing,
  );
  if (!parity) {
    throw new Error(`No release publication parity record found for ${environmentRing}.`);
  }
  return { bundle, parity };
}

export function toCurrentBundle(
  bundle: RuntimePublicationBundleContract,
): RuntimePublicationBundleTuple {
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

export function toCurrentParity(
  parity: ReleasePublicationParityRecordContract,
): ReleasePublicationParityTuple {
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

export function evaluatePublicationArtifacts(artifacts: PublicationArtifacts) {
  return evaluateRuntimePublicationAuthority({
    bundle: artifacts.bundle,
    currentBundle: toCurrentBundle(artifacts.bundle),
    parityRecord: artifacts.parity,
    currentParity: toCurrentParity(artifacts.parity),
  });
}
