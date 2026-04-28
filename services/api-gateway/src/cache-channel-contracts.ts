import {
  createBrowserRuntimeTelemetryEvent,
  listBrowserRecoveryPostureRows,
  listBrowserRuntimePublicationRings,
  lookupRouteBundle,
  resolveBrowserRuntimeDecision,
  type BrowserFreezeState,
  type BrowserManifestState,
  type BrowserOfflineState,
  type BrowserProjectionFreshnessState,
  type BrowserTransportObservationState,
  type BrowserTrustState,
} from "@vecells/release-controls";

const TRANSPORT_STATES = new Set<BrowserTransportObservationState>([
  "healthy",
  "disconnected",
  "reconnecting",
  "replay_gap",
  "message_ambiguity",
]);

const FRESHNESS_STATES = new Set<BrowserProjectionFreshnessState>([
  "fresh",
  "updating",
  "stale_review",
  "replay_gap",
  "blocked",
]);

const MANIFEST_STATES = new Set<BrowserManifestState>(["current", "drifted"]);
const TRUST_STATES = new Set<BrowserTrustState>(["trusted", "degraded", "quarantined"]);
const FREEZE_STATES = new Set<BrowserFreezeState>(["normal", "channel_frozen", "release_frozen"]);
const OFFLINE_STATES = new Set<BrowserOfflineState>(["online", "offline"]);

function parseEnumValue<TValue extends string>(
  searchParams: URLSearchParams,
  key: string,
  values: ReadonlySet<TValue>,
): TValue | undefined {
  const value = searchParams.get(key);
  if (!value) {
    return undefined;
  }
  return values.has(value as TValue) ? (value as TValue) : undefined;
}

export function buildCacheChannelContractsResponse(searchParams: URLSearchParams) {
  const routeFamilyRef = searchParams.get("routeFamilyRef") || "rf_patient_home";
  const environmentRing = searchParams.get("environmentRing") || "local";

  const decision = resolveBrowserRuntimeDecision({
    routeFamilyRef,
    environmentRing,
    transportState: parseEnumValue(searchParams, "transportState", TRANSPORT_STATES),
    projectionFreshnessState: parseEnumValue(
      searchParams,
      "projectionFreshnessState",
      FRESHNESS_STATES,
    ),
    manifestState: parseEnumValue(searchParams, "manifestState", MANIFEST_STATES),
    trustState: parseEnumValue(searchParams, "trustState", TRUST_STATES),
    freezeState: parseEnumValue(searchParams, "freezeState", FREEZE_STATES),
    offlineState: parseEnumValue(searchParams, "offlineState", OFFLINE_STATES),
    observedAt: searchParams.get("observedAt") ?? undefined,
  });

  const routeBundle = lookupRouteBundle(routeFamilyRef);
  const publicationRings = listBrowserRuntimePublicationRings();
  const postureRows = listBrowserRecoveryPostureRows().filter(
    (row) =>
      row.routeFamilyRef === routeFamilyRef &&
      (!searchParams.get("environmentRing") || row.environmentRing === environmentRing),
  );

  return {
    statusCode: 200,
    body: {
      ok: true,
      lookupMode: "cache_channel_contract_governor",
      filters: {
        routeFamilyRef,
        environmentRing,
        transportState: searchParams.get("transportState") ?? "healthy",
        projectionFreshnessState: searchParams.get("projectionFreshnessState") ?? "fresh",
        manifestState: searchParams.get("manifestState") ?? "current",
        trustState: searchParams.get("trustState") ?? "trusted",
        freezeState: searchParams.get("freezeState") ?? "normal",
        offlineState: searchParams.get("offlineState") ?? "online",
      },
      decision,
      routeBundle,
      publicationRings,
      postureRows,
      telemetryPreview: [
        createBrowserRuntimeTelemetryEvent({
          eventKind: "browser_downgrade_applied",
          decision,
        }),
      ],
      law: {
        websocketConnectedImpliesFreshTruth: false,
        cachePresenceImpliesWritableAction: false,
        genericSyncBadgeMayHideBlockedState: false,
      },
    },
  } as const;
}
