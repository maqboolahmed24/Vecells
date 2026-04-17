import { stableDigest } from "./build-provenance";
import type { RuntimeTopologyPublicationCatalog as GeneratedRuntimeTopologyPublicationCatalog } from "./runtime-topology-publication.catalog.types";
import {
  runtimeTopologyPublicationCatalog,
  type RuntimeTopologyPublicationDriftCategory as GeneratedRuntimeTopologyPublicationDriftCategory,
} from "./runtime-topology-publication.catalog";

export type RuntimeTopologyPublicationDriftCategoryCode =
  GeneratedRuntimeTopologyPublicationDriftCategory["categoryCode"];
export type RuntimeTopologyPublicationFindingSeverity =
  GeneratedRuntimeTopologyPublicationDriftCategory["severity"];

export interface RuntimeTopologyWorkloadFamily {
  runtimeWorkloadFamilyRef: string;
  trustZoneRef: string;
  tenantIsolationMode: string;
  serviceIdentityRef: string;
  gatewaySurfaceRefs: readonly string[];
  allowedDownstreamWorkloadFamilyRefs: readonly string[];
}

export interface RuntimeTopologyTrustZoneBoundary {
  boundaryId: string;
  sourceTrustZoneRef: string;
  targetTrustZoneRef: string;
  sourceWorkloadFamilyRefs: readonly string[];
  targetWorkloadFamilyRefs: readonly string[];
  allowedIdentityRefs: readonly string[];
  allowedDataClassificationRefs: readonly string[];
  boundaryState: string;
}

export interface RuntimeTopologyGatewaySurface {
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

export interface RuntimeTopologyRoutePublication {
  routePublicationRef: string;
  routeFamilyRef: string;
  primaryGatewaySurfaceRef: string;
  frontendContractManifestRef: string;
  allowedDownstreamWorkloadFamilyRefs: readonly string[];
  tenantIsolationMode: string;
  publicationState: string;
}

export interface RuntimeTopologyFrontendManifest {
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

export interface RuntimeTopologyAudienceSurfaceRuntimeBinding {
  audienceSurfaceRuntimeBindingId: string;
  gatewaySurfaceRefs: readonly string[];
  routeFamilyRefs: readonly string[];
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  designContractPublicationBundleRef: string;
  bindingState: string;
}

export interface RuntimeTopologySurfacePublication {
  audienceSurfacePublicationRef: string;
  gatewaySurfaceRefs: readonly string[];
  routeFamilyRefs: readonly string[];
  designContractPublicationBundleRef: string;
  runtimePublicationBundleRef: string;
  publicationState: string;
}

export interface RuntimeTopologyDesignPublicationBundle {
  designContractPublicationBundleId: string;
  routeFamilyRefs: readonly string[];
  runtimePublicationBundleRef: string;
  topologyTupleHash: string;
  publicationState: string;
}

export interface RuntimeTopologyPublicationGraph {
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
  workloadFamilies: readonly RuntimeTopologyWorkloadFamily[];
  trustZoneBoundaries: readonly RuntimeTopologyTrustZoneBoundary[];
  bundleGatewaySurfaceRefs: readonly string[];
  bundleFrontendManifestRefs: readonly string[];
  bundleSurfaceRuntimeBindingRefs: readonly string[];
  bundleSurfacePublicationRefs: readonly string[];
  bundleDesignPublicationRefs: readonly string[];
  gatewaySurfaces: readonly RuntimeTopologyGatewaySurface[];
  routePublications: readonly RuntimeTopologyRoutePublication[];
  frontendManifests: readonly RuntimeTopologyFrontendManifest[];
  audienceSurfaceRuntimeBindings: readonly RuntimeTopologyAudienceSurfaceRuntimeBinding[];
  surfacePublications: readonly RuntimeTopologySurfacePublication[];
  designContractPublicationBundles: readonly RuntimeTopologyDesignPublicationBundle[];
}

export interface RuntimeTopologyPublicationScenario {
  scenarioId: string;
  environmentRing: string;
  title: string;
  description: string;
  graph: RuntimeTopologyPublicationGraph;
  expected: {
    publishable: boolean;
    publicationEligibilityState: "publishable" | "blocked";
    blockedReasonRefs: readonly RuntimeTopologyPublicationDriftCategoryCode[];
    driftCategoryCodes: readonly RuntimeTopologyPublicationDriftCategoryCode[];
    bindingCompleteness: number;
    driftFindingCount: number;
  };
  driftFindings?: readonly RuntimeTopologyPublicationFinding[];
}

export interface RuntimeTopologyPublicationCurrentSnapshot {
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
  verdict: RuntimeTopologyPublicationVerdict;
}

export interface RuntimeTopologyPublicationFinding {
  findingId: string;
  categoryCode: RuntimeTopologyPublicationDriftCategoryCode;
  severity: RuntimeTopologyPublicationFindingSeverity;
  message: string;
  memberRef: string;
}

export interface RuntimeTopologyPublicationVerdict {
  publishable: boolean;
  publicationEligibilityState: "publishable" | "blocked";
  bindingCompleteness: number;
  driftFindingCount: number;
  blockedReasonRefs: readonly RuntimeTopologyPublicationDriftCategoryCode[];
  warningReasonRefs: readonly string[];
  driftFindings: readonly RuntimeTopologyPublicationFinding[];
}

export interface RuntimeTopologyPublicationMetricsSnapshot {
  scenarioCount: number;
  publishableScenarioCount: number;
  blockedScenarioCount: number;
  currentDriftFindingCount: number;
  gatewaySurfaceCount: number;
  currentBlockedReasonRefs: readonly RuntimeTopologyPublicationDriftCategoryCode[];
}

export interface RuntimeTopologyPublicationSimulationHarness {
  catalog: GeneratedRuntimeTopologyPublicationCatalog;
  scenario: RuntimeTopologyPublicationScenario;
  verdict: RuntimeTopologyPublicationVerdict;
  metrics: RuntimeTopologyPublicationMetricsSnapshot;
  currentGraphSnapshot: RuntimeTopologyPublicationCurrentSnapshot;
}

const publicationScenarios =
  runtimeTopologyPublicationCatalog.publicationScenarios as unknown as readonly RuntimeTopologyPublicationScenario[];
const currentGraphSnapshot =
  runtimeTopologyPublicationCatalog.currentGraphSnapshot as RuntimeTopologyPublicationCurrentSnapshot;

const categorySeverityByCode = new Map<
  RuntimeTopologyPublicationDriftCategoryCode,
  RuntimeTopologyPublicationFindingSeverity
>(
  runtimeTopologyPublicationCatalog.driftCategoryDefinitions.map((definition) => [
    definition.categoryCode,
    definition.severity,
  ]),
);

function uniqueSorted<TValue extends string>(values: readonly TValue[]): TValue[] {
  return Array.from(new Set(values)).sort((left, right) => left.localeCompare(right)) as TValue[];
}

function createFinding(
  categoryCode: RuntimeTopologyPublicationDriftCategoryCode,
  message: string,
  memberRef: string,
): RuntimeTopologyPublicationFinding {
  return {
    findingId: `rtpf::${stableDigest([categoryCode, memberRef, message]).slice(0, 16)}`,
    categoryCode,
    severity: categorySeverityByCode.get(categoryCode) ?? "error",
    message,
    memberRef,
  };
}

function addFinding(
  findings: RuntimeTopologyPublicationFinding[],
  categoryCode: RuntimeTopologyPublicationDriftCategoryCode,
  message: string,
  memberRef: string,
): void {
  findings.push(createFinding(categoryCode, message, memberRef));
}

function dedupeFindings(
  findings: readonly RuntimeTopologyPublicationFinding[],
): RuntimeTopologyPublicationFinding[] {
  const seen = new Set<string>();
  const unique: RuntimeTopologyPublicationFinding[] = [];
  for (const finding of findings) {
    const key = `${finding.categoryCode}::${finding.memberRef}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(finding);
  }
  return unique;
}

export function getRuntimeTopologyPublicationCatalog(): GeneratedRuntimeTopologyPublicationCatalog {
  return runtimeTopologyPublicationCatalog;
}

export function getRuntimeTopologyPublicationScenario(
  scenarioId: string,
): RuntimeTopologyPublicationScenario {
  const scenario = runtimeTopologyPublicationCatalog.publicationScenarios.find(
    (candidate) => candidate.scenarioId === scenarioId,
  ) as RuntimeTopologyPublicationScenario | undefined;
  if (!scenario) {
    throw new Error(`Unknown runtime topology publication scenario: ${scenarioId}`);
  }
  return scenario;
}

export function getRuntimeTopologyPublicationCurrentSnapshot(): RuntimeTopologyPublicationCurrentSnapshot {
  return currentGraphSnapshot;
}

export function selectRuntimeTopologyPublicationScenario(options?: {
  scenarioId?: string;
  environmentRing?: string;
  publishable?: boolean;
}): RuntimeTopologyPublicationScenario {
  if (options?.scenarioId) {
    return getRuntimeTopologyPublicationScenario(options.scenarioId);
  }

  const candidates = publicationScenarios.filter((scenario) => {
    if (options?.environmentRing && scenario.environmentRing !== options.environmentRing) {
      return false;
    }
    if (options?.publishable !== undefined && scenario.expected.publishable !== options.publishable) {
      return false;
    }
    return true;
  });
  if (candidates.length > 0) {
    return candidates[0]!;
  }

  if (options?.environmentRing) {
    const exact = publicationScenarios.find(
      (scenario) => scenario.environmentRing === options.environmentRing,
    );
    if (exact) {
      return exact;
    }
  }

  const publishable = publicationScenarios.find(
    (scenario) => scenario.expected.publishable,
  );
  return publishable ?? publicationScenarios[0]!;
}

export function evaluateRuntimeTopologyPublicationGraph(
  graph: RuntimeTopologyPublicationGraph,
): RuntimeTopologyPublicationVerdict {
  const findings: RuntimeTopologyPublicationFinding[] = [];
  const gatewayById = new Map(graph.gatewaySurfaces.map((row) => [row.gatewaySurfaceId, row] as const));
  const manifestById = new Map(
    graph.frontendManifests.map((row) => [row.frontendContractManifestId, row] as const),
  );
  const bindingById = new Map(
    graph.audienceSurfaceRuntimeBindings.map(
      (row) => [row.audienceSurfaceRuntimeBindingId, row] as const,
    ),
  );
  const publicationById = new Map(
    graph.surfacePublications.map((row) => [row.audienceSurfacePublicationRef, row] as const),
  );
  const designById = new Map(
    graph.designContractPublicationBundles.map(
      (row) => [row.designContractPublicationBundleId, row] as const,
    ),
  );
  const workloadByRef = new Map(
    graph.workloadFamilies.map((row) => [row.runtimeWorkloadFamilyRef, row] as const),
  );
  const boundaryById = new Map(
    graph.trustZoneBoundaries.map((row) => [row.boundaryId, row] as const),
  );
  const assuranceSliceRefs = new Set(graph.assuranceSliceRefs);

  const workloadRefs = new Set(graph.workloadFamilyRefs);
  const trustBoundaryRefs = new Set(graph.trustZoneBoundaryRefs);
  const runtimeBundleRef = graph.runtimePublicationBundleRef;

  for (const ref of graph.bundleGatewaySurfaceRefs) {
    if (!gatewayById.has(ref)) {
      addFinding(findings, "MISSING_MANIFEST_BINDING", "Bundle gateway surface ref is missing.", ref);
    }
  }
  for (const ref of graph.bundleFrontendManifestRefs) {
    if (!manifestById.has(ref)) {
      addFinding(findings, "MISSING_MANIFEST_BINDING", "Bundle frontend manifest ref is missing.", ref);
    }
  }
  for (const ref of graph.bundleSurfaceRuntimeBindingRefs) {
    if (!bindingById.has(ref)) {
      addFinding(
        findings,
        "MISSING_MANIFEST_BINDING",
        "Bundle surface runtime binding ref is missing.",
        ref,
      );
    }
  }
  for (const ref of graph.bundleSurfacePublicationRefs) {
    if (!publicationById.has(ref)) {
      addFinding(
        findings,
        "MISSING_MANIFEST_BINDING",
        "Bundle surface publication ref is missing.",
        ref,
      );
    }
  }
  for (const ref of graph.bundleDesignPublicationRefs) {
    if (!designById.has(ref)) {
      addFinding(
        findings,
        "MISSING_MANIFEST_BINDING",
        "Bundle design publication bundle ref is missing.",
        ref,
      );
    }
  }

  for (const row of graph.gatewaySurfaces) {
    if (row.runtimePublicationBundleRef !== runtimeBundleRef) {
      addFinding(
        findings,
        "STALE_AUDIENCE_SURFACE_RUNTIME_BINDING",
        "Gateway surface points at a stale runtime-publication bundle ref.",
        row.gatewaySurfaceId,
      );
    }
    if (row.runtimeTopologyManifestRef !== graph.runtimeTopologyManifestRef) {
      addFinding(
        findings,
        "MISSING_MANIFEST_BINDING",
        "Gateway surface points at a stale runtime topology manifest ref.",
        row.gatewaySurfaceId,
      );
    }
    for (const workloadRef of row.allowedDownstreamWorkloadFamilyRefs) {
      if (!workloadRefs.has(workloadRef)) {
        addFinding(
          findings,
          "GATEWAY_TO_UNDECLARED_WORKLOAD",
          "Gateway surface reaches an undeclared workload family.",
          row.gatewaySurfaceId,
        );
      }
    }
    for (const boundaryRef of row.trustZoneBoundaryRefs) {
      if (!trustBoundaryRefs.has(boundaryRef)) {
        addFinding(
          findings,
          "UNDECLARED_TRUST_BOUNDARY_CROSSING",
          "Gateway surface crosses an undeclared trust boundary.",
          row.gatewaySurfaceId,
        );
      }
      if (!boundaryById.has(boundaryRef)) {
        addFinding(
          findings,
          "MISSING_MANIFEST_BINDING",
          "Gateway surface references a trust-boundary row that is absent from the topology manifest.",
          row.gatewaySurfaceId,
        );
      }
    }
    for (const assuranceSliceRef of row.requiredAssuranceSliceRefs) {
      if (!assuranceSliceRefs.has(assuranceSliceRef)) {
        addFinding(
          findings,
          "MISSING_MANIFEST_BINDING",
          "Gateway surface requires an assurance slice that is absent from the topology manifest.",
          row.gatewaySurfaceId,
        );
      }
    }
    if (!manifestById.has(row.frontendContractManifestRef)) {
      addFinding(
        findings,
        "MISSING_MANIFEST_BINDING",
        "Gateway surface points at a missing frontend manifest.",
        row.gatewaySurfaceId,
      );
    }
    if (!bindingById.has(row.audienceSurfaceRuntimeBindingRef)) {
      addFinding(
        findings,
        "MISSING_MANIFEST_BINDING",
        "Gateway surface points at a missing audience runtime binding.",
        row.gatewaySurfaceId,
      );
    }
    if (!publicationById.has(row.surfacePublicationRef)) {
      addFinding(
        findings,
        "MISSING_MANIFEST_BINDING",
        "Gateway surface points at a missing surface publication row.",
        row.gatewaySurfaceId,
      );
    }
    for (const workloadRef of row.allowedDownstreamWorkloadFamilyRefs) {
      const workload = workloadByRef.get(workloadRef);
      if (!workload) {
        continue;
      }
      const matchedBoundary = row.trustZoneBoundaryRefs.some((boundaryRef) => {
        const boundary = boundaryById.get(boundaryRef);
        if (!boundary || boundary.boundaryState !== "allowed") {
          return false;
        }
        if (!boundary.targetWorkloadFamilyRefs.includes(workloadRef)) {
          return false;
        }
        return boundary.allowedIdentityRefs.includes(workload.serviceIdentityRef);
      });
      if (!matchedBoundary) {
        addFinding(
          findings,
          "UNDECLARED_TRUST_BOUNDARY_CROSSING",
          "Gateway surface reaches a workload whose service identity is not permitted by the declared trust boundaries.",
          row.gatewaySurfaceId,
        );
      }
    }
  }

  for (const row of graph.routePublications) {
    const gatewaySurface = gatewayById.get(row.primaryGatewaySurfaceRef);
    if (!gatewaySurface) {
      addFinding(
        findings,
        "MISSING_MANIFEST_BINDING",
        "Route publication points at a missing gateway surface.",
        row.routePublicationRef,
      );
    } else if (row.tenantIsolationMode !== gatewaySurface.tenantIsolationMode) {
      addFinding(
        findings,
        "TENANT_ISOLATION_MISMATCH",
        "Route publication tenant-isolation mode drifted from the gateway surface.",
        row.routePublicationRef,
      );
    }
    for (const workloadRef of row.allowedDownstreamWorkloadFamilyRefs) {
      if (!workloadRefs.has(workloadRef)) {
        addFinding(
          findings,
          "GATEWAY_TO_UNDECLARED_WORKLOAD",
          "Route publication reaches an undeclared workload family.",
          row.routePublicationRef,
        );
      }
    }
    if (
      row.publicationState === "withdrawn" ||
      row.publicationState === "blocked" ||
      row.publicationState === "withdrawn_by_topology_drift"
    ) {
      addFinding(
        findings,
        "ROUTE_PUBLICATION_WITHDRAWN",
        "Route publication is withdrawn or blocked for the active topology tuple.",
        row.routePublicationRef,
      );
    } else if (
      row.publicationState !== "published" &&
      row.publicationState !== "published_exact"
    ) {
      addFinding(
        findings,
        "STALE_AUDIENCE_SURFACE_RUNTIME_BINDING",
        "Route publication is not in an exact publishable state.",
        row.routePublicationRef,
      );
    }
  }

  for (const row of graph.frontendManifests) {
    if (row.runtimePublicationBundleRef !== runtimeBundleRef) {
      addFinding(
        findings,
        "STALE_AUDIENCE_SURFACE_RUNTIME_BINDING",
        "Frontend manifest points at a stale runtime-publication bundle ref.",
        row.frontendContractManifestId,
      );
    }
    if (!gatewayById.has(row.gatewaySurfaceRef)) {
      addFinding(
        findings,
        "MISSING_MANIFEST_BINDING",
        "Frontend manifest points at a missing gateway surface.",
        row.frontendContractManifestId,
      );
    }
    if (!bindingById.has(row.audienceSurfaceRuntimeBindingRef)) {
      addFinding(
        findings,
        "MISSING_MANIFEST_BINDING",
        "Frontend manifest points at a missing runtime binding.",
        row.frontendContractManifestId,
      );
    }
    if (!publicationById.has(row.surfacePublicationRef)) {
      addFinding(
        findings,
        "MISSING_MANIFEST_BINDING",
        "Frontend manifest points at a missing surface publication row.",
        row.frontendContractManifestId,
      );
    }
    if (!designById.has(row.designContractPublicationBundleRef)) {
      addFinding(
        findings,
        "MISSING_MANIFEST_BINDING",
        "Frontend manifest points at a missing design publication bundle.",
        row.frontendContractManifestId,
      );
    }
    for (const ref of row.gatewaySurfaceRefs) {
      if (!gatewayById.has(ref)) {
        addFinding(
          findings,
          "MISSING_MANIFEST_BINDING",
          "Frontend manifest gateway-surface set contains a missing surface.",
          row.frontendContractManifestId,
        );
      }
    }
  }

  for (const row of graph.audienceSurfaceRuntimeBindings) {
    if (row.runtimePublicationBundleRef !== runtimeBundleRef || row.bindingState !== "publishable_live") {
      addFinding(
        findings,
        "STALE_AUDIENCE_SURFACE_RUNTIME_BINDING",
        "Audience surface runtime binding is not exact for the active runtime tuple.",
        row.audienceSurfaceRuntimeBindingId,
      );
    }
    if (!publicationById.has(row.surfacePublicationRef)) {
      addFinding(
        findings,
        "MISSING_MANIFEST_BINDING",
        "Audience surface runtime binding points at a missing surface publication row.",
        row.audienceSurfaceRuntimeBindingId,
      );
    }
    if (!designById.has(row.designContractPublicationBundleRef)) {
      addFinding(
        findings,
        "MISSING_MANIFEST_BINDING",
        "Audience surface runtime binding points at a missing design publication bundle.",
        row.audienceSurfaceRuntimeBindingId,
      );
    }
    for (const ref of row.gatewaySurfaceRefs) {
      if (!gatewayById.has(ref)) {
        addFinding(
          findings,
          "MISSING_MANIFEST_BINDING",
          "Audience runtime binding gateway-surface set contains a missing surface.",
          row.audienceSurfaceRuntimeBindingId,
        );
      }
    }
  }

  for (const row of graph.surfacePublications) {
    if (
      row.runtimePublicationBundleRef !== runtimeBundleRef ||
      row.publicationState !== "published_exact"
    ) {
      addFinding(
        findings,
        "STALE_AUDIENCE_SURFACE_RUNTIME_BINDING",
        "Audience surface publication is stale or tied to the wrong runtime-publication bundle.",
        row.audienceSurfacePublicationRef,
      );
    }
    if (!designById.has(row.designContractPublicationBundleRef)) {
      addFinding(
        findings,
        "MISSING_MANIFEST_BINDING",
        "Audience surface publication points at a missing design publication bundle.",
        row.audienceSurfacePublicationRef,
      );
    }
  }

  for (const row of graph.designContractPublicationBundles) {
    if (
      row.runtimePublicationBundleRef !== runtimeBundleRef ||
      row.topologyTupleHash !== graph.topologyTupleHash
    ) {
      addFinding(
        findings,
        "DESIGN_BUNDLE_WRONG_TOPOLOGY_TUPLE",
        "Design publication bundle is bound to the wrong runtime-publication or topology tuple.",
        row.designContractPublicationBundleId,
      );
    }
  }

  const uniqueFindings = dedupeFindings(findings);
  const requiredRefs =
    graph.bundleGatewaySurfaceRefs.length +
    graph.bundleFrontendManifestRefs.length +
    graph.bundleSurfaceRuntimeBindingRefs.length +
    graph.bundleSurfacePublicationRefs.length +
    graph.bundleDesignPublicationRefs.length;
  const matchedRefs =
    graph.bundleGatewaySurfaceRefs.filter((ref) => gatewayById.has(ref)).length +
    graph.bundleFrontendManifestRefs.filter((ref) => manifestById.has(ref)).length +
    graph.bundleSurfaceRuntimeBindingRefs.filter((ref) => bindingById.has(ref)).length +
    graph.bundleSurfacePublicationRefs.filter((ref) => publicationById.has(ref)).length +
    graph.bundleDesignPublicationRefs.filter((ref) => designById.has(ref)).length;

  return {
    publishable: uniqueFindings.length === 0,
    publicationEligibilityState: uniqueFindings.length === 0 ? "publishable" : "blocked",
    bindingCompleteness: requiredRefs === 0 ? 1 : Number((matchedRefs / requiredRefs).toFixed(4)),
    driftFindingCount: uniqueFindings.length,
    blockedReasonRefs: uniqueSorted(uniqueFindings.map((finding) => finding.categoryCode)),
    warningReasonRefs: [],
    driftFindings: uniqueFindings,
  };
}

export function createRuntimeTopologyPublicationVerdictDigest(
  verdict: RuntimeTopologyPublicationVerdict,
): string {
  return stableDigest({
    publishable: verdict.publishable,
    publicationEligibilityState: verdict.publicationEligibilityState,
    bindingCompleteness: verdict.bindingCompleteness,
    driftFindingCount: verdict.driftFindingCount,
    blockedReasonRefs: uniqueSorted(verdict.blockedReasonRefs),
    driftFindings: verdict.driftFindings.map((finding) => ({
      categoryCode: finding.categoryCode,
      memberRef: finding.memberRef,
      severity: finding.severity,
    })),
  });
}

export function summarizeRuntimeTopologyPublicationMetrics(): RuntimeTopologyPublicationMetricsSnapshot {
  return {
    scenarioCount: publicationScenarios.length,
    publishableScenarioCount: publicationScenarios.filter((scenario) => scenario.expected.publishable)
      .length,
    blockedScenarioCount: publicationScenarios.filter((scenario) => !scenario.expected.publishable)
      .length,
    currentDriftFindingCount: currentGraphSnapshot.verdict.driftFindingCount,
    gatewaySurfaceCount: currentGraphSnapshot.gatewaySurfaceCount,
    currentBlockedReasonRefs: currentGraphSnapshot.verdict
      .blockedReasonRefs as readonly RuntimeTopologyPublicationDriftCategoryCode[],
  };
}

export function createRuntimeTopologyPublicationSimulationHarness(options?: {
  scenarioId?: string;
  environmentRing?: string;
  publishable?: boolean;
}): RuntimeTopologyPublicationSimulationHarness {
  const scenario = selectRuntimeTopologyPublicationScenario({
    environmentRing: options?.environmentRing ?? "local",
    publishable: options?.publishable ?? true,
    scenarioId: options?.scenarioId,
  });
  return {
    catalog: runtimeTopologyPublicationCatalog,
    scenario,
    verdict: evaluateRuntimeTopologyPublicationGraph(scenario.graph),
    metrics: summarizeRuntimeTopologyPublicationMetrics(),
    currentGraphSnapshot,
  };
}

export function runRuntimeTopologyPublicationSimulation(options?: {
  scenarioId?: string;
  environmentRing?: string;
  publishable?: boolean;
}): RuntimeTopologyPublicationSimulationHarness {
  return createRuntimeTopologyPublicationSimulationHarness(options);
}
