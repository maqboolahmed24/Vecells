import {
  apiContractRegistryCatalog,
  apiContractRegistryPayload,
  apiContractRegistrySchemas,
} from "./api-contract-registry.catalog";

export { apiContractRegistryCatalog, apiContractRegistryPayload, apiContractRegistrySchemas };

export type ApiContractRegistryPayload = typeof apiContractRegistryPayload;
export type ApiContractRouteBundle = ApiContractRegistryPayload["routeFamilyBundles"][number];
export type ManifestReadyRouteFamilySet =
  ApiContractRegistryPayload["manifestReadyRouteFamilySets"][number];
export type ProjectionQueryContractRow =
  ApiContractRegistryPayload["projectionQueryContracts"][number];
export type MutationCommandContractRow =
  ApiContractRegistryPayload["mutationCommandContracts"][number];
export type LiveUpdateChannelContractRow =
  ApiContractRegistryPayload["liveUpdateChannelContracts"][number];
export type ClientCachePolicyRow = ApiContractRegistryPayload["clientCachePolicies"][number];
export type ApiContractDigestIndexRow = ApiContractRegistryPayload["contractDigestIndex"][number];
export type ApiContractValidationRule = ApiContractRegistryPayload["validationRules"][number];
export type ParallelInterfaceGap = ApiContractRegistryPayload["parallelInterfaceGaps"][number];
export type ApiContractDefect = ApiContractRegistryPayload["defects"][number];

export type ApiContractFamily =
  | "ProjectionQueryContract"
  | "MutationCommandContract"
  | "LiveUpdateChannelContract"
  | "ClientCachePolicy";

export type ApiContractValidationState = "valid" | "warning" | "exception" | "blocked";

export type ApiContractRow =
  | ProjectionQueryContractRow
  | MutationCommandContractRow
  | LiveUpdateChannelContractRow
  | ClientCachePolicyRow;

export interface ApiContractDigestLookup {
  readonly digest: ApiContractDigestIndexRow;
  readonly contract: ApiContractRow;
  readonly routeFamilyBundles: readonly ApiContractRouteBundle[];
  readonly manifestReadyRouteFamilySets: readonly ManifestReadyRouteFamilySet[];
}

export interface ApiContractRegistryFilter {
  readonly audienceSurface?: string;
  readonly routeFamilyRef?: string;
  readonly gatewaySurfaceRef?: string;
  readonly contractFamily?: ApiContractFamily;
  readonly validationState?: ApiContractValidationState;
}

function normalizeDigestRef(value: string): string {
  const separators = [
    "projection-query-digest::",
    "mutation-command-digest::",
    "live-channel-digest::",
    "cache-policy-digest::",
  ];
  for (const separator of separators) {
    if (value.startsWith(separator)) {
      return value.slice(separator.length);
    }
  }
  return value;
}

function routeFamiliesForContract(contract: ApiContractRow): readonly string[] {
  if ("routeFamilyRef" in contract) {
    return [contract.routeFamilyRef];
  }
  return contract.routeFamilyRefs;
}

function gatewaySurfacesForContract(contract: ApiContractRow): readonly string[] {
  if ("gatewaySurfaceRefs" in contract) {
    return contract.gatewaySurfaceRefs;
  }
  return contract.sourceGatewayRefs;
}

function contractRefForRow(contract: ApiContractRow): string {
  if ("projectionQueryContractId" in contract) {
    return contract.projectionQueryContractId;
  }
  if ("mutationCommandContractId" in contract) {
    return contract.mutationCommandContractId;
  }
  if ("liveUpdateChannelContractId" in contract) {
    return contract.liveUpdateChannelContractId;
  }
  return contract.clientCachePolicyId;
}

function familyForRow(contract: ApiContractRow): ApiContractFamily {
  if ("projectionQueryContractId" in contract) {
    return "ProjectionQueryContract";
  }
  if ("mutationCommandContractId" in contract) {
    return "MutationCommandContract";
  }
  if ("liveUpdateChannelContractId" in contract) {
    return "LiveUpdateChannelContract";
  }
  return "ClientCachePolicy";
}

export class ApiContractRegistryStore {
  readonly payload: ApiContractRegistryPayload;
  readonly routeBundlesByRouteFamily = new Map<string, ApiContractRouteBundle>();
  readonly manifestSetsById = new Map<string, ManifestReadyRouteFamilySet>();
  readonly manifestSetsByAudienceSurface = new Map<string, ManifestReadyRouteFamilySet[]>();
  readonly contractsByRef = new Map<string, ApiContractRow>();
  readonly contractDigestsByNormalizedDigest = new Map<string, ApiContractDigestIndexRow>();

  constructor(payload: ApiContractRegistryPayload = apiContractRegistryPayload) {
    this.payload = payload;
    this.validatePayload();

    for (const bundle of payload.routeFamilyBundles) {
      this.routeBundlesByRouteFamily.set(bundle.routeFamilyRef, bundle);
    }

    for (const manifestSet of payload.manifestReadyRouteFamilySets) {
      this.manifestSetsById.set(manifestSet.manifestReadyRouteFamilySetId, manifestSet);
      const audienceItems =
        this.manifestSetsByAudienceSurface.get(manifestSet.audienceSurface) ?? [];
      audienceItems.push(manifestSet);
      this.manifestSetsByAudienceSurface.set(manifestSet.audienceSurface, audienceItems);
    }

    const allContracts: ApiContractRow[] = [
      ...payload.projectionQueryContracts,
      ...payload.mutationCommandContracts,
      ...payload.liveUpdateChannelContracts,
      ...payload.clientCachePolicies,
    ];
    for (const contract of allContracts) {
      this.contractsByRef.set(contractRefForRow(contract), contract);
    }

    for (const digest of payload.contractDigestIndex) {
      this.contractDigestsByNormalizedDigest.set(
        normalizeDigestRef(digest.contractDigestRef),
        digest,
      );
      this.contractDigestsByNormalizedDigest.set(
        normalizeDigestRef(digest.registryDigestRef),
        digest,
      );
    }
  }

  private validatePayload(): void {
    const payload = this.payload;

    if (payload.summary.route_family_bundle_count !== payload.routeFamilyBundles.length) {
      throw new Error("API_CONTRACT_REGISTRY_SUMMARY_ROUTE_BUNDLE_DRIFT");
    }
    if (
      payload.summary.manifest_ready_route_family_set_count !==
      payload.manifestReadyRouteFamilySets.length
    ) {
      throw new Error("API_CONTRACT_REGISTRY_SUMMARY_MANIFEST_SET_DRIFT");
    }

    const routeRefs = new Set<string>();
    for (const bundle of payload.routeFamilyBundles) {
      const routeFamilyRef = bundle.routeFamilyRef;
      const validationState = bundle.validationState;
      const liveUpdateChannelContractRef = bundle.liveUpdateChannelContractRef;
      const browserPostureState = bundle.browserPostureState;
      if (routeRefs.has(bundle.routeFamilyRef)) {
        throw new Error(`API_CONTRACT_REGISTRY_DUPLICATE_ROUTE_FAMILY:${bundle.routeFamilyRef}`);
      }
      routeRefs.add(routeFamilyRef);

      if (!bundle.projectionQueryContractRef || !bundle.mutationCommandContractRef) {
        throw new Error(`API_CONTRACT_REGISTRY_INCOMPLETE_MUTABLE_BUNDLE:${routeFamilyRef}`);
      }
      if (!bundle.clientCachePolicyRefs.length) {
        throw new Error(`API_CONTRACT_REGISTRY_MISSING_CACHE_POLICY:${routeFamilyRef}`);
      }
      if (
        validationState === "valid" &&
        liveUpdateChannelContractRef === null &&
        browserPostureState === "read_only"
      ) {
        throw new Error(`API_CONTRACT_REGISTRY_VALID_ROUTE_MISSING_LIVE:${routeFamilyRef}`);
      }
    }

    const routeRefsFromManifestSets = new Set<string>(
      payload.manifestReadyRouteFamilySets.flatMap((row) => row.routeFamilyRefs),
    );
    if (routeRefs.size !== routeRefsFromManifestSets.size) {
      throw new Error("API_CONTRACT_REGISTRY_MANIFEST_ROUTE_COUNT_DRIFT");
    }
    for (const routeRef of routeRefs) {
      if (!routeRefsFromManifestSets.has(routeRef)) {
        throw new Error(`API_CONTRACT_REGISTRY_ROUTE_OUTSIDE_MANIFEST_SET:${routeRef}`);
      }
    }

    const registryDigestKeys = new Set<string>();
    const rawDigestKeys = new Set<string>();
    for (const row of payload.contractDigestIndex) {
      const registryNormalized = `${row.contractFamily}:${normalizeDigestRef(row.registryDigestRef)}`;
      if (registryDigestKeys.has(registryNormalized)) {
        throw new Error(`API_CONTRACT_REGISTRY_DIGEST_COLLISION:${registryNormalized}`);
      }
      registryDigestKeys.add(registryNormalized);

      const rawNormalized = normalizeDigestRef(row.contractDigestRef);
      if (rawDigestKeys.has(rawNormalized)) {
        throw new Error(`API_CONTRACT_REGISTRY_RAW_DIGEST_COLLISION:${rawNormalized}`);
      }
      rawDigestKeys.add(rawNormalized);
    }
  }

  listValidationRules(): readonly ApiContractValidationRule[] {
    return this.payload.validationRules;
  }

  listParallelInterfaceGaps(): readonly ParallelInterfaceGap[] {
    return this.payload.parallelInterfaceGaps;
  }

  listDefects(): readonly ApiContractDefect[] {
    return this.payload.defects;
  }

  listManifestReadyRouteFamilySets(): readonly ManifestReadyRouteFamilySet[] {
    return this.payload.manifestReadyRouteFamilySets;
  }

  listRouteFamilyBundles(): readonly ApiContractRouteBundle[] {
    return this.payload.routeFamilyBundles;
  }

  listContracts(filter: ApiContractRegistryFilter = {}): readonly ApiContractRow[] {
    const contracts: ApiContractRow[] = [
      ...this.payload.projectionQueryContracts,
      ...this.payload.mutationCommandContracts,
      ...this.payload.liveUpdateChannelContracts,
      ...this.payload.clientCachePolicies,
    ];

    return contracts.filter((contract) => {
      const family = familyForRow(contract);
      const routeFamilies = routeFamiliesForContract(contract);
      const bundleMatches = routeFamilies
        .map((routeFamilyRef) => this.routeBundlesByRouteFamily.get(routeFamilyRef))
        .filter((bundle): bundle is ApiContractRouteBundle => Boolean(bundle));

      if (filter.contractFamily && family !== filter.contractFamily) {
        return false;
      }
      if (filter.validationState && contract.validationState !== filter.validationState) {
        return false;
      }
      if (filter.routeFamilyRef && !routeFamilies.includes(filter.routeFamilyRef)) {
        return false;
      }
      if (
        filter.audienceSurface &&
        !bundleMatches.some((bundle) => bundle.manifestAudienceSurface === filter.audienceSurface)
      ) {
        return false;
      }
      if (
        filter.gatewaySurfaceRef &&
        !gatewaySurfacesForContract(contract).includes(filter.gatewaySurfaceRef)
      ) {
        return false;
      }
      return true;
    });
  }

  lookupByRouteFamilyRef(routeFamilyRef: string): ApiContractRouteBundle | undefined {
    return this.routeBundlesByRouteFamily.get(routeFamilyRef);
  }

  lookupByAudienceSurface(audienceSurface: string): readonly ApiContractRouteBundle[] {
    return this.payload.routeFamilyBundles.filter(
      (bundle) => bundle.manifestAudienceSurface === audienceSurface,
    );
  }

  lookupByGatewaySurfaceRef(gatewaySurfaceRef: string): readonly ApiContractRouteBundle[] {
    return this.payload.routeFamilyBundles.filter((bundle) =>
      bundle.gatewaySurfaceRefs.some((surfaceRef) => surfaceRef === gatewaySurfaceRef),
    );
  }

  lookupByContractDigestRef(contractDigestRef: string): ApiContractDigestLookup | undefined {
    const digest = this.contractDigestsByNormalizedDigest.get(
      normalizeDigestRef(contractDigestRef),
    );
    if (!digest) {
      return undefined;
    }
    const contract = this.contractsByRef.get(digest.contractRef);
    if (!contract) {
      throw new Error(`API_CONTRACT_REGISTRY_UNKNOWN_CONTRACT_REF:${digest.contractRef}`);
    }
    const routeFamilyBundles = digest.routeFamilyBundleRefs
      .map((bundleRef) =>
        this.payload.routeFamilyBundles.find(
          (routeBundle) => routeBundle.apiContractRouteBundleId === bundleRef,
        ),
      )
      .filter((bundle): bundle is ApiContractRouteBundle => Boolean(bundle));
    const manifestReadyRouteFamilySets = digest.manifestReadyRouteFamilySetRefs
      .map((setRef) => this.manifestSetsById.get(setRef))
      .filter((set): set is ManifestReadyRouteFamilySet => Boolean(set));

    return {
      digest,
      contract,
      routeFamilyBundles,
      manifestReadyRouteFamilySets,
    };
  }
}

export function createApiContractRegistryStore(
  payload: ApiContractRegistryPayload = apiContractRegistryPayload,
): ApiContractRegistryStore {
  return new ApiContractRegistryStore(payload);
}
