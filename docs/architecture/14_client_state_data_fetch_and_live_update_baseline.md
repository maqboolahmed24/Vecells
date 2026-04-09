# 14 Client State Data Fetch And Live Update Baseline

        The client state posture separates shell truth, selected-anchor truth, server query cache, mutation acknowledgement, live-channel patching, and degraded recovery posture into distinct lanes so convenience state cannot impersonate authoritative outcome.

        ## Client-State Matrix

        | Plane | Scope | Authority | Persistence | Settlement upgrade | Degraded posture |
| --- | --- | --- | --- | --- | --- |
| shell_frame | all live shells | PersistentShell; AudienceSurfaceRuntimeBinding; SurfacePostureFrame | memory_with_soft_navigation_only | binding_refresh_rechecks_writable_posture | read_only or recovery_only in place |
| selected_anchor | anchor-bearing routes and compare surfaces | SelectedAnchor; SelectedAnchorPreserver | memory_plus_history_state | invalidated until explicit replacement or dismissal | invalidated marker retained, not silently cleared |
| decision_dock | major entity routes | DecisionDock; AttentionBudget; WorkspaceTrustEnvelope | memory | server settlement or trust drift can demote the dock in place | dominant action freezes without swapping shells |
| server_query_cache | patient home, requests, appointments, messages | ProjectionQueryContract; ClientCachePolicy; FrontendContractManifest | memory_with_stale_time_from_manifest | authoritative projection refresh upgrades visible macro state | summary_only or recovery_only via runtime binding |
| server_query_cache | workspace queue and preview panes | ProjectionQueryContract; ClientCachePolicy; QueueChangeBatch | memory_with_focused_queue_position_retention | lease and settlement deltas patch the active row in place | queue placeholder or read_only while trust drift remains open |
| server_query_cache | workspace child routes, decision stages, and support regions | ProjectionQueryContract; LiveUpdateChannelContract; WorkspaceTrustEnvelope | memory | settlement and blocker changes patch the existing task plane | read_only or compare_fallback in the same shell |
| server_query_cache | operations board overview and drilldown | ProjectionQueryContract; VisualizationParityProjection; ClientCachePolicy | memory_with_drilldown_anchor_retention | authoritative ops settlement upgrades dominant anomaly posture | table_first or diagnostic_only when parity or trust drifts |
| server_query_cache | governance change review, release watch, and approval evidence | ProjectionQueryContract; AudienceSurfaceRuntimeBinding; ReleaseWatchTuple | memory_with_scope_tuple_guard | approval or promotion settlement upgrades the existing ChangeEnvelope | handoff_only or read_only while tuple freshness is stale |
| mutation_ack | all writable routes | MutationCommandContract; TransitionEnvelope; CommandSettlementRecord | memory | projection or settlement channel resolves final visible outcome | read_only with preserved summary if settlement chain is stale |
| live_channel | shell freshness, thread deltas, queue deltas, board health, release watch | LiveUpdateChannelContract; FreshnessChip; AmbientStateRibbon | ephemeral connection plus resumable cursor | channel is advisory until the projection or settlement row lands | status strip changes to stale or paused in place |
| recovery_posture | secure-link recovery, support replay, embedded fallback, route freezes | RouteFreezeDisposition; ReleaseRecoveryDisposition; AudienceSurfaceRuntimeBinding | memory | binding must re-enter publishable_live before writable posture returns | placeholder, masked observe-only, or recovery-only in the same shell |
| design_contract_digest | every live route root | DesignContractPublicationBundle; DesignContractLintVerdict; ProfileSelectionResolution | route-root attribute only | bundle mismatch downgrades the surface in place | preserved_summary or recovery_only |

        ## State Rules

        - Shell continuity and selected anchor live in deterministic reducers, not in ad hoc component state.
        - Server-state caches consume only published `ProjectionQueryContract` rows and their `ClientCachePolicy` bindings.
        - Optimistic UI is limited to acknowledgement posture. Final reassurance requires the settlement or projection upgrade.
        - Live-channel deltas can patch freshness and selection in place, but may not override settlement semantics by transport receipt alone.
        - Recovery, read-only, and blocked posture are runtime-binding outputs, not local route guesses.
