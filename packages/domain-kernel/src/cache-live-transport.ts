function invariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    throw new Error(`${code}: ${message}`);
  }
}

function stableDigest(input: string): string {
  let left = 0x811c9dc5;
  let right = 0x9e3779b9 ^ input.length;
  for (const char of input) {
    const code = char.charCodeAt(0);
    left = Math.imul(left ^ code, 0x01000193) >>> 0;
    right = Math.imul(right ^ code, 0x85ebca6b) >>> 0;
  }
  return `${left.toString(16).padStart(8, "0")}${right.toString(16).padStart(8, "0")}`;
}

export type CacheNamespaceClass =
  | "runtime_manifest"
  | "projection_read"
  | "route_family"
  | "entity_scoped"
  | "transient_replay_support";

export type CacheEntryHealthState = "fresh" | "stale_read_only" | "invalidated" | "reset";
export type ConnectionState = "connected" | "stale" | "blocked" | "closed";
export type ConnectionTruthState = "freshness_unproven" | "degraded_explicit" | "replay_required";
export type ReplayReadState = "ok" | "window_exhausted" | "channel_blocked";
export type ChannelDegradedState =
  | "healthy"
  | "heartbeat_missed"
  | "stale_transport"
  | "replay_window_exhausted"
  | "blocked";

export interface CacheNamespaceDefinition {
  namespaceRef: string;
  namespaceClass: CacheNamespaceClass;
  storageMode: string;
  scopeMode: string;
  gatewaySurfaceRefs: readonly string[];
  sourcePolicyRefs: readonly string[];
  boundedTtlSeconds: number;
  invalidationHookRefs: readonly string[];
  honestyRuleRefs: readonly string[];
}

export interface CacheEntryRecord {
  entryId: string;
  namespaceRef: string;
  entryKey: string;
  payloadDigestRef: string;
  truthBindingRef: string;
  refreshedAt: string;
  healthState: CacheEntryHealthState;
  lastInvalidationReason: string | null;
  sourcePolicyRef: string | null;
}

export interface CacheResetRecord {
  resetId: string;
  namespaceRefs: readonly string[];
  resetAt: string;
  reasonCode: string;
}

export interface LiveTransportChannelDefinition {
  transportChannelRef: string;
  liveUpdateChannelContractId: string | null;
  channelCode: string;
  transport: "sse" | "websocket";
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

export interface ConnectionRecord {
  connectionId: string;
  transportChannelRef: string;
  connectionRegistryRef: string;
  subscriberRef: string;
  connectionEpoch: number;
  reconnectToken: string;
  registeredAt: string;
  lastHeartbeatAt: string;
  state: ConnectionState;
  truthState: ConnectionTruthState;
  degradationReason: string | null;
}

export interface ReplayFrameRecord {
  replayFrameId: string;
  transportChannelRef: string;
  sequence: number;
  payloadDigestRef: string;
  truthBindingRef: string;
  emittedAt: string;
  postureState: "live" | "stale" | "blocked";
}

export interface ReplayReadResult {
  replayState: ReplayReadState;
  frames: readonly ReplayFrameRecord[];
  earliestAvailableSequence: number;
  latestSequence: number;
}

export interface ChannelDegradationRecord {
  recordId: string;
  transportChannelRef: string;
  degradedState: ChannelDegradedState;
  reasonCode: string;
  recordedAt: string;
}

export interface CacheLiveTransportSnapshot {
  cacheNamespaces: readonly CacheNamespaceDefinition[];
  cacheEntries: readonly CacheEntryRecord[];
  cacheResets: readonly CacheResetRecord[];
  liveChannels: readonly LiveTransportChannelDefinition[];
  connections: readonly ConnectionRecord[];
  replayFrames: readonly ReplayFrameRecord[];
  degradationRecords: readonly ChannelDegradationRecord[];
}

export interface CacheEntryWriteInput {
  namespaceRef: string;
  entryKey: string;
  payloadDigestRef: string;
  truthBindingRef: string;
  refreshedAt: string;
  sourcePolicyRef?: string | null;
}

export interface OpenConnectionInput {
  transportChannelRef: string;
  subscriberRef: string;
  registeredAt: string;
}

export interface PublishReplayFrameInput {
  transportChannelRef: string;
  payloadDigestRef: string;
  truthBindingRef: string;
  emittedAt: string;
  postureState?: "live" | "stale" | "blocked";
}

export interface ChannelDegradationInput {
  transportChannelRef: string;
  degradedState: ChannelDegradedState;
  reasonCode: string;
  recordedAt: string;
}

export interface CacheLiveTransportScenarioResult {
  scenarioId: string;
  description: string;
  honestyOutcome: "explicit_degraded" | "replay_required" | "reset_visible" | "fresh_but_unproven";
  replayState: ReplayReadState | "not_requested";
  degradedState: ChannelDegradedState | "none";
  cacheHealthState: CacheEntryHealthState | "not_applicable";
}

export type CacheLiveTransportIdGenerator = (family: string) => string;

export function createDeterministicCacheLiveTransportIdGenerator(
  prefix = "clt",
): CacheLiveTransportIdGenerator {
  const counters = new Map<string, number>();
  return (family: string): string => {
    const next = (counters.get(family) ?? 0) + 1;
    counters.set(family, next);
    return `${prefix}_${family}_${String(next).padStart(4, "0")}`;
  };
}

export class CacheLiveTransportStore {
  private readonly generateId: CacheLiveTransportIdGenerator;

  private readonly cacheNamespaces = new Map<string, CacheNamespaceDefinition>();
  private readonly cacheEntries = new Map<string, CacheEntryRecord>();
  private readonly cacheResets: CacheResetRecord[] = [];
  private readonly liveChannels = new Map<string, LiveTransportChannelDefinition>();
  private readonly connections = new Map<string, ConnectionRecord>();
  private readonly replayFramesByChannel = new Map<string, ReplayFrameRecord[]>();
  private readonly degradationRecordsByChannel = new Map<string, ChannelDegradationRecord[]>();
  private readonly connectionEpochs = new Map<string, number>();

  constructor(generateId = createDeterministicCacheLiveTransportIdGenerator()) {
    this.generateId = generateId;
  }

  registerCacheNamespace(definition: CacheNamespaceDefinition): CacheNamespaceDefinition {
    invariant(
      !this.cacheNamespaces.has(definition.namespaceRef),
      "CACHE_NAMESPACE_EXISTS",
      `Cache namespace ${definition.namespaceRef} is already registered.`,
    );
    this.cacheNamespaces.set(definition.namespaceRef, definition);
    return definition;
  }

  registerLiveChannel(definition: LiveTransportChannelDefinition): LiveTransportChannelDefinition {
    invariant(
      !this.liveChannels.has(definition.transportChannelRef),
      "LIVE_CHANNEL_EXISTS",
      `Live channel ${definition.transportChannelRef} is already registered.`,
    );
    this.liveChannels.set(definition.transportChannelRef, definition);
    this.replayFramesByChannel.set(definition.transportChannelRef, []);
    this.degradationRecordsByChannel.set(definition.transportChannelRef, []);
    return definition;
  }

  writeCacheEntry(input: CacheEntryWriteInput): CacheEntryRecord {
    const namespace = this.cacheNamespaces.get(input.namespaceRef);
    invariant(
      namespace,
      "CACHE_NAMESPACE_UNKNOWN",
      `Cache namespace ${input.namespaceRef} is unknown.`,
    );
    const compositeKey = `${input.namespaceRef}::${input.entryKey}`;
    const existing = this.cacheEntries.get(compositeKey);
    const entry: CacheEntryRecord = {
      entryId: existing?.entryId ?? this.generateId("cache_entry"),
      namespaceRef: input.namespaceRef,
      entryKey: input.entryKey,
      payloadDigestRef: input.payloadDigestRef,
      truthBindingRef: input.truthBindingRef,
      refreshedAt: input.refreshedAt,
      healthState: "fresh",
      lastInvalidationReason: null,
      sourcePolicyRef: input.sourcePolicyRef ?? namespace.sourcePolicyRefs[0] ?? null,
    };
    this.cacheEntries.set(compositeKey, entry);
    return entry;
  }

  invalidateNamespace(namespaceRef: string, invalidatedAt: string, reasonCode: string): number {
    invariant(
      this.cacheNamespaces.has(namespaceRef),
      "CACHE_NAMESPACE_UNKNOWN",
      `Cache namespace ${namespaceRef} is unknown.`,
    );
    let changed = 0;
    for (const [key, entry] of this.cacheEntries.entries()) {
      if (entry.namespaceRef !== namespaceRef) {
        continue;
      }
      this.cacheEntries.set(key, {
        ...entry,
        refreshedAt: invalidatedAt,
        healthState: "invalidated",
        lastInvalidationReason: reasonCode,
      });
      changed += 1;
    }
    return changed;
  }

  resetNamespaces(
    namespaceRefs: readonly string[],
    resetAt: string,
    reasonCode: string,
  ): CacheResetRecord {
    for (const namespaceRef of namespaceRefs) {
      invariant(
        this.cacheNamespaces.has(namespaceRef),
        "CACHE_NAMESPACE_UNKNOWN",
        `Cache namespace ${namespaceRef} is unknown.`,
      );
    }
    for (const [key, entry] of this.cacheEntries.entries()) {
      if (!namespaceRefs.includes(entry.namespaceRef)) {
        continue;
      }
      this.cacheEntries.set(key, {
        ...entry,
        refreshedAt: resetAt,
        healthState: "reset",
        lastInvalidationReason: reasonCode,
      });
    }
    const record: CacheResetRecord = {
      resetId: this.generateId("cache_reset"),
      namespaceRefs: [...namespaceRefs],
      resetAt,
      reasonCode,
    };
    this.cacheResets.push(record);
    return record;
  }

  openConnection(input: OpenConnectionInput): ConnectionRecord {
    const channel = this.liveChannels.get(input.transportChannelRef);
    invariant(
      channel,
      "LIVE_CHANNEL_UNKNOWN",
      `Live channel ${input.transportChannelRef} is unknown.`,
    );
    const epochKey = `${input.transportChannelRef}::${input.subscriberRef}`;
    const connectionEpoch = (this.connectionEpochs.get(epochKey) ?? 0) + 1;
    this.connectionEpochs.set(epochKey, connectionEpoch);
    const connectionId = this.generateId("connection");
    const record: ConnectionRecord = {
      connectionId,
      transportChannelRef: input.transportChannelRef,
      connectionRegistryRef: channel.connectionRegistryRef,
      subscriberRef: input.subscriberRef,
      connectionEpoch,
      reconnectToken: stableDigest(
        `${channel.transportChannelRef}|${input.subscriberRef}|${connectionEpoch}|${connectionId}`,
      ),
      registeredAt: input.registeredAt,
      lastHeartbeatAt: input.registeredAt,
      state: "connected",
      truthState: "freshness_unproven",
      degradationReason: null,
    };
    this.connections.set(connectionId, record);
    return record;
  }

  closeConnection(connectionId: string): ConnectionRecord {
    const connection = this.connections.get(connectionId);
    invariant(connection, "CONNECTION_UNKNOWN", `Connection ${connectionId} is unknown.`);
    const closed: ConnectionRecord = { ...connection, state: "closed" };
    this.connections.set(connectionId, closed);
    return closed;
  }

  recordHeartbeat(connectionId: string, heartbeatAt: string): ConnectionRecord {
    const connection = this.connections.get(connectionId);
    invariant(connection, "CONNECTION_UNKNOWN", `Connection ${connectionId} is unknown.`);
    invariant(
      connection.state !== "blocked",
      "CONNECTION_BLOCKED",
      "Blocked connections may not heartbeat.",
    );
    const next: ConnectionRecord = {
      ...connection,
      lastHeartbeatAt: heartbeatAt,
      state: "connected",
      truthState: "freshness_unproven",
      degradationReason: null,
    };
    this.connections.set(connectionId, next);
    return next;
  }

  publishReplayFrame(input: PublishReplayFrameInput): ReplayFrameRecord {
    const channel = this.liveChannels.get(input.transportChannelRef);
    invariant(
      channel,
      "LIVE_CHANNEL_UNKNOWN",
      `Live channel ${input.transportChannelRef} is unknown.`,
    );
    const frames = this.replayFramesByChannel.get(input.transportChannelRef) ?? [];
    const sequence = (frames.at(-1)?.sequence ?? 0) + 1;
    const frame: ReplayFrameRecord = {
      replayFrameId: this.generateId("replay_frame"),
      transportChannelRef: input.transportChannelRef,
      sequence,
      payloadDigestRef: input.payloadDigestRef,
      truthBindingRef: input.truthBindingRef,
      emittedAt: input.emittedAt,
      postureState: input.postureState ?? "live",
    };
    frames.push(frame);
    while (frames.length > channel.replayWindowSize) {
      frames.shift();
    }
    this.replayFramesByChannel.set(input.transportChannelRef, frames);
    return frame;
  }

  readReplayWindow(transportChannelRef: string, afterSequence: number): ReplayReadResult {
    const channel = this.liveChannels.get(transportChannelRef);
    invariant(channel, "LIVE_CHANNEL_UNKNOWN", `Live channel ${transportChannelRef} is unknown.`);
    const degraded = this.currentDegradedState(transportChannelRef);
    if (degraded === "blocked") {
      const frames = this.replayFramesByChannel.get(transportChannelRef) ?? [];
      return {
        replayState: "channel_blocked",
        frames: [],
        earliestAvailableSequence: frames[0]?.sequence ?? 0,
        latestSequence: frames.at(-1)?.sequence ?? 0,
      };
    }
    const frames = this.replayFramesByChannel.get(transportChannelRef) ?? [];
    const earliestAvailableSequence = frames[0]?.sequence ?? 0;
    const latestSequence = frames.at(-1)?.sequence ?? 0;
    if (frames.length > 0 && afterSequence < earliestAvailableSequence - 1) {
      return {
        replayState: "window_exhausted",
        frames: [],
        earliestAvailableSequence,
        latestSequence,
      };
    }
    return {
      replayState: "ok",
      frames: frames.filter((frame) => frame.sequence > afterSequence),
      earliestAvailableSequence,
      latestSequence,
    };
  }

  markChannelDegraded(input: ChannelDegradationInput): ChannelDegradationRecord {
    const channel = this.liveChannels.get(input.transportChannelRef);
    invariant(
      channel,
      "LIVE_CHANNEL_UNKNOWN",
      `Live channel ${input.transportChannelRef} is unknown.`,
    );
    const record: ChannelDegradationRecord = {
      recordId: this.generateId("degradation"),
      transportChannelRef: input.transportChannelRef,
      degradedState: input.degradedState,
      reasonCode: input.reasonCode,
      recordedAt: input.recordedAt,
    };
    const history = this.degradationRecordsByChannel.get(input.transportChannelRef) ?? [];
    history.push(record);
    this.degradationRecordsByChannel.set(input.transportChannelRef, history);
    if (input.degradedState === "blocked") {
      for (const [connectionId, connection] of this.connections.entries()) {
        if (connection.transportChannelRef !== input.transportChannelRef) {
          continue;
        }
        this.connections.set(connectionId, {
          ...connection,
          state: "blocked",
          truthState: "replay_required",
          degradationReason: input.reasonCode,
        });
      }
    }
    return record;
  }

  sweepHeartbeatLoss(observedAt: string): number {
    let changed = 0;
    for (const [connectionId, connection] of this.connections.entries()) {
      if (connection.state !== "connected") {
        continue;
      }
      const channel = this.liveChannels.get(connection.transportChannelRef);
      invariant(
        channel,
        "LIVE_CHANNEL_UNKNOWN",
        `Live channel ${connection.transportChannelRef} is unknown.`,
      );
      const heartbeatAgeSeconds =
        (Date.parse(observedAt) - Date.parse(connection.lastHeartbeatAt)) / 1000;
      if (heartbeatAgeSeconds <= channel.heartbeatIntervalSeconds + channel.heartbeatGraceSeconds) {
        continue;
      }
      this.connections.set(connectionId, {
        ...connection,
        state: "stale",
        truthState: "degraded_explicit",
        degradationReason: "heartbeat_window_exceeded",
      });
      this.markChannelDegraded({
        transportChannelRef: connection.transportChannelRef,
        degradedState: "heartbeat_missed",
        reasonCode: "heartbeat_window_exceeded",
        recordedAt: observedAt,
      });
      changed += 1;
    }
    return changed;
  }

  getCacheEntry(namespaceRef: string, entryKey: string): CacheEntryRecord | undefined {
    return this.cacheEntries.get(`${namespaceRef}::${entryKey}`);
  }

  getConnection(connectionId: string): ConnectionRecord | undefined {
    return this.connections.get(connectionId);
  }

  currentDegradedState(transportChannelRef: string): ChannelDegradedState {
    const history = this.degradationRecordsByChannel.get(transportChannelRef) ?? [];
    return history.at(-1)?.degradedState ?? "healthy";
  }

  toSnapshot(): CacheLiveTransportSnapshot {
    return {
      cacheNamespaces: [...this.cacheNamespaces.values()],
      cacheEntries: [...this.cacheEntries.values()],
      cacheResets: [...this.cacheResets],
      liveChannels: [...this.liveChannels.values()],
      connections: [...this.connections.values()],
      replayFrames: [...this.replayFramesByChannel.values()].flatMap((frames) => frames),
      degradationRecords: [...this.degradationRecordsByChannel.values()].flatMap((rows) => rows),
    };
  }
}

function createScenarioStore(): CacheLiveTransportStore {
  const store = new CacheLiveTransportStore(
    createDeterministicCacheLiveTransportIdGenerator("par088"),
  );
  store.registerCacheNamespace({
    namespaceRef: "cns_runtime_manifest_publication",
    namespaceClass: "runtime_manifest",
    storageMode: "memory_with_reset_drill",
    scopeMode: "runtime_global",
    gatewaySurfaceRefs: ["gws_operations_board", "gws_governance_shell"],
    sourcePolicyRefs: ["CP_PUBLIC_NO_PERSISTED_PHI"],
    boundedTtlSeconds: 120,
    invalidationHookRefs: ["hook_publication_bundle_changed"],
    honestyRuleRefs: ["cache_warmth_never_implies_writable"],
  });
  store.registerCacheNamespace({
    namespaceRef: "cns_projection_read_tenant_session",
    namespaceClass: "projection_read",
    storageMode: "tenant_scoped_session_memory",
    scopeMode: "tenant_subject_self_service",
    gatewaySurfaceRefs: ["gws_patient_home", "gws_patient_messages"],
    sourcePolicyRefs: ["CP_PATIENT_SUMMARY_PRIVATE_SHORT", "CP_PATIENT_THREAD_PRIVATE_EPHEMERAL"],
    boundedTtlSeconds: 90,
    invalidationHookRefs: ["hook_projection_rebuilt", "hook_command_settled"],
    honestyRuleRefs: ["stale_cache_requires_rebind"],
  });
  store.registerCacheNamespace({
    namespaceRef: "cns_route_family_staff_workspace",
    namespaceClass: "route_family",
    storageMode: "tenant_scoped_session_memory",
    scopeMode: "tenant_staff_single_org",
    gatewaySurfaceRefs: ["gws_clinician_workspace", "gws_clinician_workspace_child"],
    sourcePolicyRefs: ["CP_WORKSPACE_CHILD_PRIVATE_EPHEMERAL"],
    boundedTtlSeconds: 60,
    invalidationHookRefs: ["hook_lease_invalidated", "hook_selected_anchor_changed"],
    honestyRuleRefs: ["connected_transport_does_not_imply_fresh_task"],
  });
  store.registerCacheNamespace({
    namespaceRef: "cns_entity_scoped_pharmacy_case",
    namespaceClass: "entity_scoped",
    storageMode: "tenant_scoped_session_memory",
    scopeMode: "tenant_tuple_and_effect_scope",
    gatewaySurfaceRefs: ["gws_pharmacy_console"],
    sourcePolicyRefs: ["CP_PHARMACY_CASE_PRIVATE"],
    boundedTtlSeconds: 45,
    invalidationHookRefs: ["hook_dispatch_proof_changed", "hook_consent_checkpoint_changed"],
    honestyRuleRefs: ["entity_cache_stays_read_only_on_drift"],
  });
  store.registerCacheNamespace({
    namespaceRef: "cns_transient_replay_support",
    namespaceClass: "transient_replay_support",
    storageMode: "ephemeral_memory_only",
    scopeMode: "support_replay_session",
    gatewaySurfaceRefs: ["gws_support_replay_observe"],
    sourcePolicyRefs: ["CP_SUPPORT_REPLAY_FROZEN_NO_STORE"],
    boundedTtlSeconds: 30,
    invalidationHookRefs: ["hook_restore_settlement_completed", "hook_mask_scope_changed"],
    honestyRuleRefs: ["replay_cache_never_restores_live_mutation_by_itself"],
  });
  store.registerLiveChannel({
    transportChannelRef: "ltr_patient_home_state",
    liveUpdateChannelContractId: "LCC_050_RF_PATIENT_HOME_V1",
    channelCode: "patient_home.state_updates",
    transport: "sse",
    channelPosture: "buffered_replay_safe",
    gatewaySurfaceRefs: ["gws_patient_home"],
    audienceSurfaceRefs: ["audsurf_patient_authenticated_portal"],
    workloadFamilyRef: "wf_shell_delivery_published_gateway",
    connectionRegistryRef: "cr_patient_portal",
    replayBufferRef: "rb_patient_home",
    heartbeatIntervalSeconds: 15,
    heartbeatGraceSeconds: 10,
    replayWindowSize: 3,
    reconnectPolicyRef: "rp_patient_portal_sse",
    staleModeHookRef: "hook_patient_home_stale_banner",
    sourceRefs: ["prompt/088.md", "data/analysis/frontend_contract_manifests.json"],
  });
  store.registerLiveChannel({
    transportChannelRef: "ltr_support_replay",
    liveUpdateChannelContractId: "LCC_050_RF_SUPPORT_REPLAY_OBSERVE_V1",
    channelCode: "support_replay.observe_updates",
    transport: "sse",
    channelPosture: "buffered_replay_safe",
    gatewaySurfaceRefs: ["gws_support_replay_observe"],
    audienceSurfaceRefs: ["audsurf_support_workspace"],
    workloadFamilyRef: "wf_shell_delivery_published_gateway",
    connectionRegistryRef: "cr_support_replay",
    replayBufferRef: "rb_support_replay",
    heartbeatIntervalSeconds: 20,
    heartbeatGraceSeconds: 10,
    replayWindowSize: 2,
    reconnectPolicyRef: "rp_support_replay_sse",
    staleModeHookRef: "hook_support_restore_gate",
    sourceRefs: ["prompt/088.md", "data/analysis/frontend_contract_manifests.json"],
  });
  store.registerLiveChannel({
    transportChannelRef: "ltr_operations_board",
    liveUpdateChannelContractId: "LCC_050_RF_OPERATIONS_BOARD_V1",
    channelCode: "operations_board.state_updates",
    transport: "websocket",
    channelPosture: "buffered_replay_safe",
    gatewaySurfaceRefs: ["gws_operations_board"],
    audienceSurfaceRefs: ["audsurf_operations_console"],
    workloadFamilyRef: "wf_shell_delivery_published_gateway",
    connectionRegistryRef: "cr_operations_console",
    replayBufferRef: "rb_operations_board",
    heartbeatIntervalSeconds: 10,
    heartbeatGraceSeconds: 5,
    replayWindowSize: 2,
    reconnectPolicyRef: "rp_operations_board_ws",
    staleModeHookRef: "hook_operations_guardrail_banner",
    sourceRefs: ["prompt/088.md", "data/analysis/frontend_contract_manifests.json"],
  });
  return store;
}

export function runCacheLiveTransportScenarios(): readonly CacheLiveTransportScenarioResult[] {
  const healthy = createScenarioStore();
  const connection = healthy.openConnection({
    transportChannelRef: "ltr_patient_home_state",
    subscriberRef: "pat_subject_001",
    registeredAt: "2026-04-12T09:00:00Z",
  });
  healthy.publishReplayFrame({
    transportChannelRef: "ltr_patient_home_state",
    payloadDigestRef: "digest:patient-home:1",
    truthBindingRef: "truth:patient-home:1",
    emittedAt: "2026-04-12T09:00:02Z",
  });
  healthy.publishReplayFrame({
    transportChannelRef: "ltr_patient_home_state",
    payloadDigestRef: "digest:patient-home:2",
    truthBindingRef: "truth:patient-home:2",
    emittedAt: "2026-04-12T09:00:03Z",
  });
  healthy.recordHeartbeat(connection.connectionId, "2026-04-12T09:00:04Z");

  const heartbeatLoss = createScenarioStore();
  const staleConnection = heartbeatLoss.openConnection({
    transportChannelRef: "ltr_operations_board",
    subscriberRef: "ops_supervisor_007",
    registeredAt: "2026-04-12T09:00:00Z",
  });
  heartbeatLoss.sweepHeartbeatLoss("2026-04-12T09:00:25Z");

  const replayExhausted = createScenarioStore();
  replayExhausted.publishReplayFrame({
    transportChannelRef: "ltr_support_replay",
    payloadDigestRef: "digest:replay:1",
    truthBindingRef: "truth:replay:1",
    emittedAt: "2026-04-12T09:01:00Z",
  });
  replayExhausted.publishReplayFrame({
    transportChannelRef: "ltr_support_replay",
    payloadDigestRef: "digest:replay:2",
    truthBindingRef: "truth:replay:2",
    emittedAt: "2026-04-12T09:01:01Z",
  });
  replayExhausted.publishReplayFrame({
    transportChannelRef: "ltr_support_replay",
    payloadDigestRef: "digest:replay:3",
    truthBindingRef: "truth:replay:3",
    emittedAt: "2026-04-12T09:01:02Z",
  });
  const replayResult = replayExhausted.readReplayWindow("ltr_support_replay", 0);
  if (replayResult.replayState === "window_exhausted") {
    replayExhausted.markChannelDegraded({
      transportChannelRef: "ltr_support_replay",
      degradedState: "replay_window_exhausted",
      reasonCode: "requested_sequence_older_than_buffer",
      recordedAt: "2026-04-12T09:01:03Z",
    });
  }

  const resetDrill = createScenarioStore();
  resetDrill.writeCacheEntry({
    namespaceRef: "cns_runtime_manifest_publication",
    entryKey: "bundle::local",
    payloadDigestRef: "digest:bundle:local",
    truthBindingRef: "truth:bundle:local",
    refreshedAt: "2026-04-12T09:02:00Z",
  });
  resetDrill.resetNamespaces(
    ["cns_runtime_manifest_publication"],
    "2026-04-12T09:02:30Z",
    "stale_mode_drill",
  );

  const staleCache = createScenarioStore();
  staleCache.writeCacheEntry({
    namespaceRef: "cns_projection_read_tenant_session",
    entryKey: "patient_home::tenant_001",
    payloadDigestRef: "digest:tenant:001",
    truthBindingRef: "truth:tenant:001",
    refreshedAt: "2026-04-12T09:03:00Z",
  });
  staleCache.invalidateNamespace(
    "cns_projection_read_tenant_session",
    "2026-04-12T09:03:10Z",
    "projection_binding_drift",
  );

  return [
    {
      scenarioId: "patient_home_reconnect_replay_safe",
      description:
        "Healthy reconnect still leaves freshness unproven until projection binding rechecks.",
      honestyOutcome: "fresh_but_unproven",
      replayState: healthy.readReplayWindow("ltr_patient_home_state", 1).replayState,
      degradedState: healthy.currentDegradedState("ltr_patient_home_state"),
      cacheHealthState: "not_applicable",
    },
    {
      scenarioId: "operations_board_heartbeat_loss",
      description:
        "Missed heartbeat explicitly degrades the channel and blocks calm freshness inference.",
      honestyOutcome: "explicit_degraded",
      replayState: "not_requested",
      degradedState: heartbeatLoss.currentDegradedState("ltr_operations_board"),
      cacheHealthState:
        heartbeatLoss.getConnection(staleConnection.connectionId)?.state === "stale"
          ? "not_applicable"
          : "not_applicable",
    },
    {
      scenarioId: "support_replay_window_exhausted",
      description:
        "Replay exhaustion fails closed into reconnect-plus-reacquire posture instead of silent data loss.",
      honestyOutcome: "replay_required",
      replayState: replayResult.replayState,
      degradedState: replayExhausted.currentDegradedState("ltr_support_replay"),
      cacheHealthState: "not_applicable",
    },
    {
      scenarioId: "runtime_manifest_reset_drill",
      description:
        "Reset drills visibly clear runtime-manifest warmth and keep the reset event explicit.",
      honestyOutcome: "reset_visible",
      replayState: "not_requested",
      degradedState: "none",
      cacheHealthState:
        resetDrill.getCacheEntry("cns_runtime_manifest_publication", "bundle::local")
          ?.healthState ?? "not_applicable",
    },
    {
      scenarioId: "projection_cache_binding_drift",
      description:
        "Projection-cache drift invalidates the cache rather than implying calm writable posture.",
      honestyOutcome: "explicit_degraded",
      replayState: "not_requested",
      degradedState: "none",
      cacheHealthState:
        staleCache.getCacheEntry("cns_projection_read_tenant_session", "patient_home::tenant_001")
          ?.healthState ?? "not_applicable",
    },
  ];
}
