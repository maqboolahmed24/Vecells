# Phase 9 Tenant Governance Route Implementation Note

Task 457 adds `/ops/governance/tenants` and `/ops/config/tenants` tenant governance surfaces to the governance shell. The surface keeps the tenant baseline matrix, config diff viewer, policy-pack history, standards/dependency watchlist, legacy findings, policy compatibility alerts, standards exceptions, promotion approvals, release watch, and migration/backfill posture in one review context.

The frontend uses the canonical task 448 tenant-config governance outputs. The same StandardsDependencyWatchlist hash is shown beside compilation, simulation, approval, release freeze, migration, read-path compatibility, and projection backfill posture.

Compile and promote controls remain unavailable until compilation, simulation, watchlist, approvals, migration/backfill, continuity evidence, and release-watch settlement requirements are all satisfied. Stale or drifted watchlists expose revalidation instead of silently refreshing the selected tenant anchor.

No `PHASE9_BATCH_443_457_INTERFACE_GAP_457_TENANT_WATCHLIST_INPUTS.json` artifact is required because the 448 contract already provides the canonical tenant config watchlist, findings, exceptions, compilation record, simulation envelope, and promotion readiness inputs.
