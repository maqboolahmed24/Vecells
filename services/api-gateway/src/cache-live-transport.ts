import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..", "..");
const CACHE_MANIFEST_PATH = path.join(ROOT, "data", "analysis", "cache_namespace_manifest.json");
const LIVE_TRANSPORT_MANIFEST_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "live_transport_topology_manifest.json",
);
const BOUNDARY_MATRIX_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "cache_transport_boundary_matrix.csv",
);

function readJson<TValue>(filePath: string): TValue {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as TValue;
}

function readCsvRows(filePath: string): Array<Record<string, string>> {
  const [headerLine, ...bodyLines] = fs
    .readFileSync(filePath, "utf8")
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);
  if (!headerLine) {
    return [];
  }
  const headers = headerLine.split(",").map((value) => value.trim());
  return bodyLines.map((line) => {
    const values = line.split(",").map((value) => value.trim());
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

interface CacheNamespaceManifestPayload {
  generated_at?: string;
  summary: Record<string, unknown>;
  cacheNamespaces: CacheNamespaceDefinition[];
  policyBindings?: Array<Record<string, unknown>>;
}

interface LiveTransportTopologyManifestPayload {
  generated_at?: string;
  summary: Record<string, unknown>;
  liveChannels: LiveTransportChannelDefinition[];
  drillScenarios?: Array<Record<string, unknown>>;
}

interface CacheNamespaceDefinition {
  namespaceRef: string;
  namespaceClass: string;
  storageMode: string;
  scopeMode: string;
  gatewaySurfaceRefs: readonly string[];
  sourcePolicyRefs: readonly string[];
  boundedTtlSeconds: number;
  invalidationHookRefs: readonly string[];
  honestyRuleRefs: readonly string[];
}

interface LiveTransportChannelDefinition {
  transportChannelRef: string;
  liveUpdateChannelContractId: string | null;
  channelCode: string;
  transport: string;
  channelPosture: string;
  gatewaySurfaceRefs: readonly string[];
  audienceSurfaceRefs: readonly string[];
  workloadFamilyRef: string;
  connectionRegistryRef: string;
  replayBufferRef: string;
  heartbeatIntervalSeconds: number;
  heartbeatGraceSeconds: number;
  replayWindowSize: number;
  reconnectPolicyRef: string;
  staleModeHookRef: string;
  sourceRefs: readonly string[];
}

function buildRuntimeSnapshot(
  cacheManifest: CacheNamespaceManifestPayload,
  liveTransportManifest: LiveTransportTopologyManifestPayload,
  namespaces: readonly CacheNamespaceDefinition[],
  channels: readonly LiveTransportChannelDefinition[],
) {
  const recordedAt = liveTransportManifest.generated_at ?? cacheManifest.generated_at ?? "";
  return {
    cacheNamespaces: namespaces,
    cacheEntries: [],
    cacheResets: [],
    liveChannels: channels,
    connections: channels.map((channel) => ({
      connectionId: `baseline:${channel.connectionRegistryRef}`,
      transportChannelRef: channel.transportChannelRef,
      connectionRegistryRef: channel.connectionRegistryRef,
      subscriberRef: "runtime_substrate_baseline",
      connectionEpoch: 1,
      reconnectToken: channel.reconnectPolicyRef,
      registeredAt: recordedAt,
      lastHeartbeatAt: recordedAt,
      state: "connected",
      truthState: "freshness_unproven",
      degradationReason: null,
    })),
    replayFrames: [],
    degradationRecords: [],
  };
}

function filterNamespaces(
  namespaces: readonly CacheNamespaceDefinition[],
  gatewaySurfaceRef: string | undefined,
  namespaceClass: string | undefined,
) {
  return namespaces.filter((row) => {
    return (
      (!gatewaySurfaceRef || row.gatewaySurfaceRefs.includes(gatewaySurfaceRef)) &&
      (!namespaceClass || row.namespaceClass === namespaceClass)
    );
  });
}

function filterChannels(
  channels: readonly LiveTransportChannelDefinition[],
  gatewaySurfaceRef: string | undefined,
  transport: string | undefined,
) {
  return channels.filter((row) => {
    return (
      (!gatewaySurfaceRef || row.gatewaySurfaceRefs.includes(gatewaySurfaceRef)) &&
      (!transport || row.transport === transport)
    );
  });
}

export function buildCacheLiveTransportResponse(searchParams: URLSearchParams) {
  const cacheManifest = readJson<CacheNamespaceManifestPayload>(CACHE_MANIFEST_PATH);
  const liveTransportManifest = readJson<LiveTransportTopologyManifestPayload>(
    LIVE_TRANSPORT_MANIFEST_PATH,
  );
  const boundaryRows = readCsvRows(BOUNDARY_MATRIX_PATH);
  const gatewaySurfaceRef = searchParams.get("gatewaySurfaceRef") || undefined;
  const transport = searchParams.get("transport") || undefined;
  const namespaceClass = searchParams.get("namespaceClass") || undefined;

  const namespaces = filterNamespaces(
    cacheManifest.cacheNamespaces,
    gatewaySurfaceRef,
    namespaceClass,
  );
  const channels = filterChannels(liveTransportManifest.liveChannels, gatewaySurfaceRef, transport);

  return {
    statusCode: 200,
    body: {
      ok: true,
      lookupMode: "runtime_substrate",
      filters: {
        gatewaySurfaceRef: gatewaySurfaceRef ?? "all",
        transport: transport ?? "all",
        namespaceClass: namespaceClass ?? "all",
      },
      summary: {
        cache: cacheManifest.summary,
        liveTransport: liveTransportManifest.summary,
        filteredNamespaceCount: namespaces.length,
        filteredChannelCount: channels.length,
        boundaryRowCount: boundaryRows.length,
      },
      namespaces,
      channels,
      boundaryRows: boundaryRows.filter((row) => {
        return (
          (!gatewaySurfaceRef || row.gateway_surface_ref === gatewaySurfaceRef) &&
          (!transport || row.transport === transport) &&
          (!namespaceClass || row.namespace_class === namespaceClass)
        );
      }),
      scenarios: liveTransportManifest.drillScenarios ?? [],
      runtimeSnapshot: buildRuntimeSnapshot(
        cacheManifest,
        liveTransportManifest,
        namespaces,
        channels,
      ),
      honestyLaw: {
        cacheWarmthImpliesWritable: false,
        connectionHealthImpliesFreshTruth: false,
        directBrowserToInternalBusAllowed: false,
      },
    },
  } as const;
}
