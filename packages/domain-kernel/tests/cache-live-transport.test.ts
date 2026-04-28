import { describe, expect, it } from "vitest";
import {
  CacheLiveTransportStore,
  createDeterministicCacheLiveTransportIdGenerator,
  runCacheLiveTransportScenarios,
} from "../src/index.ts";

describe("cache and live transport substrate", () => {
  it("marks missed heartbeats as explicit degraded transport instead of fresh truth", () => {
    const store = new CacheLiveTransportStore(
      createDeterministicCacheLiveTransportIdGenerator("test088"),
    );

    store.registerLiveChannel({
      transportChannelRef: "ltr_ops_board",
      liveUpdateChannelContractId: "LCC_TEST_OPS",
      channelCode: "operations_board.state_updates",
      transport: "websocket",
      channelPosture: "buffered_replay_safe",
      gatewaySurfaceRefs: ["gws_operations_board"],
      audienceSurfaceRefs: ["audsurf_operations_console"],
      workloadFamilyRef: "wf_shell_delivery_published_gateway",
      connectionRegistryRef: "cr_ops",
      replayBufferRef: "rb_ops",
      heartbeatIntervalSeconds: 10,
      heartbeatGraceSeconds: 5,
      replayWindowSize: 2,
      reconnectPolicyRef: "rp_ops_ws",
      staleModeHookRef: "hook_ops_stale",
      sourceRefs: ["prompt/088.md"],
    });

    const connection = store.openConnection({
      transportChannelRef: "ltr_ops_board",
      subscriberRef: "ops_user_1",
      registeredAt: "2026-04-12T09:00:00Z",
    });

    const changed = store.sweepHeartbeatLoss("2026-04-12T09:00:25Z");

    expect(changed).toBe(1);
    expect(store.getConnection(connection.connectionId)?.state).toBe("stale");
    expect(store.getConnection(connection.connectionId)?.truthState).toBe("degraded_explicit");
    expect(store.currentDegradedState("ltr_ops_board")).toBe("heartbeat_missed");
  });

  it("exposes replay-window exhaustion instead of pretending replay is still complete", () => {
    const store = new CacheLiveTransportStore(
      createDeterministicCacheLiveTransportIdGenerator("test088replay"),
    );

    store.registerLiveChannel({
      transportChannelRef: "ltr_support_replay",
      liveUpdateChannelContractId: "LCC_TEST_REPLAY",
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
      reconnectPolicyRef: "rp_support_replay",
      staleModeHookRef: "hook_support_restore",
      sourceRefs: ["prompt/088.md"],
    });

    store.publishReplayFrame({
      transportChannelRef: "ltr_support_replay",
      payloadDigestRef: "digest:1",
      truthBindingRef: "truth:1",
      emittedAt: "2026-04-12T09:01:00Z",
    });
    store.publishReplayFrame({
      transportChannelRef: "ltr_support_replay",
      payloadDigestRef: "digest:2",
      truthBindingRef: "truth:2",
      emittedAt: "2026-04-12T09:01:01Z",
    });
    store.publishReplayFrame({
      transportChannelRef: "ltr_support_replay",
      payloadDigestRef: "digest:3",
      truthBindingRef: "truth:3",
      emittedAt: "2026-04-12T09:01:02Z",
    });

    const result = store.readReplayWindow("ltr_support_replay", 0);

    expect(result.replayState).toBe("window_exhausted");
    expect(result.earliestAvailableSequence).toBe(2);
    expect(result.latestSequence).toBe(3);
    expect(result.frames).toHaveLength(0);
  });

  it("keeps cache invalidation and reset explicit", () => {
    const store = new CacheLiveTransportStore(
      createDeterministicCacheLiveTransportIdGenerator("test088cache"),
    );

    store.registerCacheNamespace({
      namespaceRef: "cns_projection_read",
      namespaceClass: "projection_read",
      storageMode: "tenant_scoped_session_memory",
      scopeMode: "tenant_subject_self_service",
      gatewaySurfaceRefs: ["gws_patient_home"],
      sourcePolicyRefs: ["CP_PATIENT_SUMMARY_PRIVATE_SHORT"],
      boundedTtlSeconds: 90,
      invalidationHookRefs: ["hook_projection_rebuilt"],
      honestyRuleRefs: ["stale_cache_requires_rebind"],
    });

    store.writeCacheEntry({
      namespaceRef: "cns_projection_read",
      entryKey: "tenant_001::home",
      payloadDigestRef: "digest:tenant-home",
      truthBindingRef: "truth:tenant-home",
      refreshedAt: "2026-04-12T09:02:00Z",
    });
    store.invalidateNamespace(
      "cns_projection_read",
      "2026-04-12T09:02:10Z",
      "projection_binding_drift",
    );

    expect(store.getCacheEntry("cns_projection_read", "tenant_001::home")?.healthState).toBe(
      "invalidated",
    );

    store.resetNamespaces(["cns_projection_read"], "2026-04-12T09:02:20Z", "manual_reset");
    expect(store.getCacheEntry("cns_projection_read", "tenant_001::home")?.healthState).toBe(
      "reset",
    );
  });

  it("publishes the required degraded and replay-safe scenarios", () => {
    const scenarios = runCacheLiveTransportScenarios();
    expect(scenarios).toHaveLength(5);
    expect(
      scenarios.find((scenario) => scenario.scenarioId === "operations_board_heartbeat_loss")
        ?.degradedState,
    ).toBe("heartbeat_missed");
    expect(
      scenarios.find((scenario) => scenario.scenarioId === "support_replay_window_exhausted")
        ?.replayState,
    ).toBe("window_exhausted");
    expect(
      scenarios.find((scenario) => scenario.scenarioId === "projection_cache_binding_drift")
        ?.cacheHealthState,
    ).toBe("invalidated");
  });
});
