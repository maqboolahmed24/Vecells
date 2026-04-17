import {
  createApiContractRegistryStore,
  type ApiContractFamily,
  type ApiContractValidationState,
} from "@vecells/api-contracts";

const registry = createApiContractRegistryStore();

function normalizeOptionalValue(value: string | null): string | undefined {
  if (!value || value === "all") {
    return undefined;
  }
  return value;
}

function readContractFamily(value: string | undefined): ApiContractFamily | undefined {
  if (!value) {
    return undefined;
  }
  return value as ApiContractFamily;
}

function readValidationState(value: string | undefined): ApiContractValidationState | undefined {
  if (!value) {
    return undefined;
  }
  return value as ApiContractValidationState;
}

export function buildApiContractRegistryResponse(searchParams: URLSearchParams) {
  const contractDigestRef = normalizeOptionalValue(searchParams.get("contractDigestRef"));
  if (contractDigestRef) {
    const digestLookup = registry.lookupByContractDigestRef(contractDigestRef);
    if (!digestLookup) {
      return {
        statusCode: 404,
        body: {
          ok: false,
          error: "CONTRACT_DIGEST_NOT_FOUND",
          contractDigestRef,
        },
      } as const;
    }

    return {
      statusCode: 200,
      body: {
        ok: true,
        lookupMode: "contractDigestRef",
        requestedDigest: contractDigestRef,
        summary: registry.payload.summary,
        digest: digestLookup.digest,
        contract: digestLookup.contract,
        routeFamilyBundles: digestLookup.routeFamilyBundles,
        manifestReadyRouteFamilySets: digestLookup.manifestReadyRouteFamilySets,
      },
    } as const;
  }

  const audienceSurface = normalizeOptionalValue(searchParams.get("audienceSurface"));
  const routeFamilyRef = normalizeOptionalValue(searchParams.get("routeFamilyRef"));
  const gatewaySurfaceRef = normalizeOptionalValue(searchParams.get("gatewaySurfaceRef"));
  const contractFamily = readContractFamily(
    normalizeOptionalValue(searchParams.get("contractFamily")),
  );
  const validationState = readValidationState(
    normalizeOptionalValue(searchParams.get("validationState")),
  );
  const includeManifestSets = searchParams.get("includeManifestSets") === "true";

  const contracts = registry.listContracts({
    audienceSurface,
    routeFamilyRef,
    gatewaySurfaceRef,
    contractFamily,
    validationState,
  });

  const routeFamilyBundles = routeFamilyRef
    ? [registry.lookupByRouteFamilyRef(routeFamilyRef)].filter(Boolean)
    : audienceSurface
      ? registry.lookupByAudienceSurface(audienceSurface)
      : gatewaySurfaceRef
        ? registry.lookupByGatewaySurfaceRef(gatewaySurfaceRef)
        : registry.listRouteFamilyBundles();

  return {
    statusCode: 200,
    body: {
      ok: true,
      lookupMode: "registry",
      filters: {
        audienceSurface: audienceSurface ?? "all",
        routeFamilyRef: routeFamilyRef ?? "all",
        gatewaySurfaceRef: gatewaySurfaceRef ?? "all",
        contractFamily: contractFamily ?? "all",
        validationState: validationState ?? "all",
      },
      summary: registry.payload.summary,
      contracts,
      routeFamilyBundles,
      manifestReadyRouteFamilySets: includeManifestSets
        ? registry.listManifestReadyRouteFamilySets()
        : [],
      validationRules: registry.listValidationRules(),
      parallelInterfaceGaps: registry.listParallelInterfaceGaps(),
      defects: registry.listDefects(),
    },
  } as const;
}
