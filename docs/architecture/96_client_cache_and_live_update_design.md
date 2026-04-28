
        # par_096 Client Cache And Live Update Design

        `par_096` publishes the authoritative browser runtime tuple for cache semantics, live-update channels, freshness disclosure, and safe downgrade posture. The catalog is derived from the validated route inventory in `par_065` plus the ring publication truth from `par_094`.

        ## Summary

        - Client cache policies: 21
        - Live-update channel contracts: 15
        - Browser recovery posture rows: 95
        - Audience surfaces covered: 9
        - Allowed live-channel absences remain bounded to the four route families already declared in `par_065`

        ## Runtime Law

        - Every route family resolves one primary `ClientCachePolicy` for the browser runtime decision.
        - Live channel reconnect never implies fresh truth. Projection freshness, parity, freeze, and trust still gate the effective posture.
        - Patient continuity preserves summaries or anchors but suppresses writable CTAs when freshness or tuple truth drifts.
        - Workspace, hub, pharmacy, support, operations, and governance surfaces each degrade through one published posture lane instead of generic banners or framework defaults.

        ## Audience Coverage

        - Patient-facing rows: 45
        - Workspace and servicing rows: 25
        - Operations and governance rows: 25

        ## Published Artifacts

        - `data/analysis/client_cache_policy_catalog.json`
        - `data/analysis/live_update_channel_contract_catalog.json`
        - `data/analysis/browser_recovery_posture_matrix.csv`
        - `packages/release-controls/src/browser-runtime-governor.catalog.ts`
        - `docs/architecture/96_cache_channel_contract_studio.html`

        ## Follow-on Dependencies

        - `FOLLOW_ON_DEPENDENCY_CONTENT_PATIENT_FRESHNESS_COPY_V1`: par_096 publishes stable disclosure modes and recovery posture now, but later shell work can refine the final audience copy without changing the underlying contract tuple.
- `FOLLOW_ON_DEPENDENCY_CONTENT_WORKSPACE_STALE_COPY_V1`: Workspace and pharmacy surfaces already degrade deterministically here; later shell iterations may refine phrasing only.
- `FOLLOW_ON_DEPENDENCY_CONTENT_OPERATIONS_STALE_COPY_V1`: The downgrade law is published here. Later content work may refine diagnostics or handoff wording, but not the runtime posture transitions.
