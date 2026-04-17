export interface RuntimeTopologyPublicationCatalogWorkloadFamily {
  runtimeWorkloadFamilyRef: string;
  trustZoneRef: string;
  tenantIsolationMode: string;
  serviceIdentityRef: string;
  gatewaySurfaceRefs: readonly string[];
  allowedDownstreamWorkloadFamilyRefs: readonly string[];
}

export interface RuntimeTopologyPublicationCatalogTrustZoneBoundary {
  boundaryId: string;
  sourceTrustZoneRef: string;
  targetTrustZoneRef: string;
  sourceWorkloadFamilyRefs: readonly string[];
  targetWorkloadFamilyRefs: readonly string[];
  allowedIdentityRefs: readonly string[];
  allowedDataClassificationRefs: readonly string[];
  boundaryState: string;
}

export interface RuntimeTopologyPublicationCatalogGatewaySurface {
  gatewaySurfaceId: string;
  gatewayServiceRef: string;
  routeFamilyRefs: readonly string[];
  allowedDownstreamWorkloadFamilyRefs: readonly string[];
  trustZoneBoundaryRefs: readonly string[];
  tenantIsolationMode: string;
  requiredAssuranceSliceRefs: readonly string[];
  frontendContractManifestRef: string;
  audienceSurfaceRuntimeBindingRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  runtimeTopologyManifestRef: string;
  publicationState: string;
}

export interface RuntimeTopologyPublicationCatalogRoutePublication {
  routePublicationRef: string;
  routeFamilyRef: string;
  primaryGatewaySurfaceRef: string;
  frontendContractManifestRef: string;
  allowedDownstreamWorkloadFamilyRefs: readonly string[];
  tenantIsolationMode: string;
  publicationState: string;
}

export interface RuntimeTopologyPublicationCatalogFrontendManifest {
  frontendContractManifestId: string;
  gatewaySurfaceRef: string;
  gatewaySurfaceRefs: readonly string[];
  routeFamilyRefs: readonly string[];
  audienceSurfaceRuntimeBindingRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  designContractPublicationBundleRef: string;
  driftState: string;
}

export interface RuntimeTopologyPublicationCatalogAudienceRuntimeBinding {
  audienceSurfaceRuntimeBindingId: string;
  gatewaySurfaceRefs: readonly string[];
  routeFamilyRefs: readonly string[];
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  designContractPublicationBundleRef: string;
  bindingState: string;
}

export interface RuntimeTopologyPublicationCatalogSurfacePublication {
  audienceSurfacePublicationRef: string;
  gatewaySurfaceRefs: readonly string[];
  routeFamilyRefs: readonly string[];
  designContractPublicationBundleRef: string;
  runtimePublicationBundleRef: string;
  publicationState: string;
}

export interface RuntimeTopologyPublicationCatalogDesignBundle {
  designContractPublicationBundleId: string;
  routeFamilyRefs: readonly string[];
  runtimePublicationBundleRef: string;
  topologyTupleHash: string;
  publicationState: string;
}

export interface RuntimeTopologyPublicationCatalogGraph {
  runtimeTopologyManifestRef: string;
  runtimePublicationBundleRef: string;
  releasePublicationParityRef: string;
  topologyTupleHash: string;
  bundlePublicationState: string;
  parityState: string;
  routeExposureState: string;
  workloadFamilyRefs: readonly string[];
  trustZoneBoundaryRefs: readonly string[];
  assuranceSliceRefs: readonly string[];
  workloadFamilies: readonly RuntimeTopologyPublicationCatalogWorkloadFamily[];
  trustZoneBoundaries: readonly RuntimeTopologyPublicationCatalogTrustZoneBoundary[];
  bundleGatewaySurfaceRefs: readonly string[];
  bundleFrontendManifestRefs: readonly string[];
  bundleSurfaceRuntimeBindingRefs: readonly string[];
  bundleSurfacePublicationRefs: readonly string[];
  bundleDesignPublicationRefs: readonly string[];
  gatewaySurfaces: readonly RuntimeTopologyPublicationCatalogGatewaySurface[];
  routePublications: readonly RuntimeTopologyPublicationCatalogRoutePublication[];
  frontendManifests: readonly RuntimeTopologyPublicationCatalogFrontendManifest[];
  audienceSurfaceRuntimeBindings: readonly RuntimeTopologyPublicationCatalogAudienceRuntimeBinding[];
  surfacePublications: readonly RuntimeTopologyPublicationCatalogSurfacePublication[];
  designContractPublicationBundles: readonly RuntimeTopologyPublicationCatalogDesignBundle[];
}

export interface RuntimeTopologyPublicationCatalogScenarioExpectation {
  publishable: boolean;
  publicationEligibilityState: "publishable" | "blocked";
  blockedReasonRefs: readonly string[];
  driftCategoryCodes: readonly string[];
  bindingCompleteness: number;
  driftFindingCount: number;
}

export interface RuntimeTopologyPublicationCatalogFinding {
  findingId: string;
  categoryCode: string;
  severity: "error" | "warning";
  message: string;
  memberRef: string;
}

export interface RuntimeTopologyPublicationScenarioRecord {
  scenarioId: string;
  environmentRing: string;
  title: string;
  description: string;
  graph: RuntimeTopologyPublicationCatalogGraph;
  expected: RuntimeTopologyPublicationCatalogScenarioExpectation;
}

export interface RuntimeTopologyPublicationDriftCategoryRecord {
  categoryCode: string;
  label: string;
  severity: "error" | "warning";
  description: string;
}

export interface RuntimeTopologyPublicationCurrentSnapshotRecord {
  runtimeTopologyManifestRef: string;
  runtimePublicationBundleRef: string;
  releasePublicationParityRef: string;
  topologyTupleHash: string;
  gatewaySurfaceCount: number;
  routePublicationCount: number;
  frontendManifestCount: number;
  audienceSurfaceRuntimeBindingCount: number;
  surfacePublicationCount: number;
  designBundleCount: number;
  assuranceSliceCount: number;
  trustBoundaryCount: number;
  workloadFamilyCatalogCount: number;
  verdict: {
    publishable: boolean;
    publicationEligibilityState: "publishable" | "blocked";
    bindingCompleteness: number;
    driftFindingCount: number;
    blockedReasonRefs: readonly string[];
    warningReasonRefs: readonly string[];
    driftFindings: readonly RuntimeTopologyPublicationCatalogFinding[];
  };
}

export interface RuntimeTopologyPublicationCatalog {
  taskId: string;
  generatedAt: string;
  visualMode: string;
  sourcePrecedence: readonly string[];
  driftCategoryDefinitions: readonly RuntimeTopologyPublicationDriftCategoryRecord[];
  currentGraphSnapshot: RuntimeTopologyPublicationCurrentSnapshotRecord;
  publicationScenarios: readonly RuntimeTopologyPublicationScenarioRecord[];
}
